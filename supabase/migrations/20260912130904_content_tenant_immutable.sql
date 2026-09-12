-- 0019 — FABLE-02: a content record never changes tenant.
--
-- Fixes a tenant-isolation defect found by the lifecycle/content-integrity
-- checkpoint (probe 2d). Demonstrated, not theoretical:
--
--   A person who legitimately holds CAN_DRAFT in institution A and
--   CAN_FREEZE_RELEASE in institution B could, in ONE statement, carry A's
--   release into B and seal it there:
--
--     update public.plp_releases set institution_id = B, status = 'FROZEN'
--      where id = <a release belonging to A>;
--
--   Both existing barriers passed it. The RLS USING clause is evaluated on the
--   OLD row (CAN_DRAFT in A -- true) and the WITH CHECK on the NEW row
--   (CAN_DRAFT in B -- also true), so RLS admitted the update; and the status
--   trigger read the capability from NEW.institution_id, which the same
--   statement had just set to B, where the caller really does hold
--   CAN_FREEZE_RELEASE. The authorization decision was made against
--   attacker-supplied tenant context.
--
-- Root cause: FABLE-01 established that an institution-scoped record's tenant
-- is fixed at insert, and enforced it per table -- enrollments_guard,
-- org_nodes_before_write, role_assignments_guard and
-- academic_periods_append_only each refuse a changed institution_id. FABLE-02
-- introduced eleven institution-scoped content tables and carried none of that
-- forward. This migration restores the convention for them.
--
-- Two fixes, deliberately both:
--   (1) institution_id becomes immutable on every FABLE-02 content table, so
--       the hop cannot be attempted at all;
--   (2) the status trigger derives the institution from OLD -- the
--       authoritative tenant of the existing row -- instead of NEW. With (1)
--       in place the two are always equal, but an authorization check must not
--       read a value the same statement is writing, and (2) keeps the decision
--       correct even if (1) is ever disabled for maintenance.
--
-- Known adjacent gap, deliberately NOT fixed here because it belongs to a
-- different subsystem: public.feature_flags carries institution_id, grants
-- UPDATE to authenticated, and has no tenant guard either. It is FABLE-01
-- platform configuration, not content, and is reported separately rather than
-- bundled into a content migration.

create function public.enforce_record_tenant_immutable() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.institution_id is distinct from old.institution_id then
    raise exception 'institution_id is immutable: a record never changes tenant (%.%)',
      tg_table_schema, tg_table_name;
  end if;
  return new;
end $$;
revoke all on function public.enforce_record_tenant_immutable() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['sources','source_versions','courses','modules','lessons',
                           'learning_objectives','misconception_taxonomy','items','item_options',
                           'assessment_definitions','plp_releases'] loop
    execute format('create trigger %1$s_tenant_immutable before update on public.%1$I
                      for each row execute function public.enforce_record_tenant_immutable()', t);
  end loop;
end $$;

-- The status trigger now reads the institution from OLD. Body otherwise
-- identical to 0018.
create or replace function public.enforce_content_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_institution uuid;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'INGESTED' then
      raise exception 'content rows are created at INGESTED, not % (%.%)',
        new.status, tg_table_schema, tg_table_name;
    end if;
    if new.author_person_id is null then
      new.author_person_id := public.current_person_id();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    -- (1) is the transition legal? The graph alone decides, and it knows
    -- nothing about roles.
    if not exists (select 1 from public.content_status_transitions t
                    where t.from_status = old.status and t.to_status = new.status) then
      raise exception 'illegal content transition % -> % on %.% (not in the allow-list)',
        old.status, new.status, tg_table_schema, tg_table_name;
    end if;

    -- (2) may THIS caller make a legal transition? Asked only once the edge is
    -- known to be legal, and asked about the institution that owns the row as
    -- it stands -- never the one the same statement is trying to write.
    v_institution := (to_jsonb(old) ->> 'institution_id')::uuid;

    if new.status = 'APPROVED' then
      if new.reviewed_by_person_id is null then
        raise exception 'APPROVED requires a reviewer (%.%)', tg_table_schema, tg_table_name;
      end if;
      if new.author_person_id is null then
        raise exception 'APPROVED requires a known author to separate from the reviewer (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      if new.reviewed_by_person_id = new.author_person_id then
        raise exception 'the reviewer may not be the author (%.%)', tg_table_schema, tg_table_name;
      end if;
      new.reviewed_at := coalesce(new.reviewed_at, now());
    end if;

    if new.status = 'FROZEN' then
      if not public.can_in_institution('CAN_FREEZE_RELEASE', v_institution) then
        raise exception 'sealing content requires CAN_FREEZE_RELEASE in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;

    if new.status = 'PUBLISHED' then
      if not public.can_in_institution('CAN_PUBLISH', v_institution) then
        raise exception 'publishing requires CAN_PUBLISH in the owning institution (INV-32) (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;
  end if;

  if new.author_person_id is distinct from old.author_person_id then
    raise exception 'author_person_id is immutable (%.%)', tg_table_schema, tg_table_name;
  end if;
  return new;
end $$;
revoke all on function public.enforce_content_status() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text;
begin
  -- every FABLE-02 institution-scoped table carries the tenant guard
  select string_agg(t, ', ') into bad from unnest(array['sources','source_versions','courses',
    'modules','lessons','learning_objectives','misconception_taxonomy','items','item_options',
    'assessment_definitions','plp_releases']) t
   where not exists (select 1 from pg_trigger g join pg_class c on c.oid = g.tgrelid
                      where c.relname = t and g.tgname = t || '_tenant_immutable'
                        and not g.tgisinternal);
  if bad is not null then raise exception 'tenant guard missing on: %', bad; end if;

  -- and the guard actually fires on UPDATE (tgtype bit 16)
  select string_agg(c.relname, ', ') into bad from pg_trigger g join pg_class c on c.oid = g.tgrelid
   where g.tgname like '%\_tenant\_immutable' and not g.tgisinternal and (g.tgtype & 16) = 0;
  if bad is not null then raise exception 'tenant guard does not cover UPDATE on: %', bad; end if;

  -- the authorization decision reads the existing row, not the incoming one
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'enforce_content_status';
  if def not like '%to_jsonb(old) ->> ''institution_id''%' then
    raise exception 'the status trigger does not derive the institution from OLD';
  end if;
  if def like '%to_jsonb(new) ->> ''institution_id''%' then
    raise exception 'the status trigger still reads institution_id from NEW';
  end if;
  if def not like '%CAN_FREEZE_RELEASE%' or def not like '%CAN_PUBLISH%' then
    raise exception 'the status trigger lost a capability gate';
  end if;

  -- standing hygiene
  select count(*) into n from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;

  select count(*) into n from pg_policies
   where schemaname = 'public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;

  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;

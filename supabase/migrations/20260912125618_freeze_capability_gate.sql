-- 0018 — FABLE-02 §2: APPROVED -> FROZEN requires CAN_FREEZE_RELEASE.
--
-- Completes the pair the capability model already named. Sealing content and
-- making it available are two different authorities, held by different roles:
-- HEAD_OF_DEPARTMENT can seal a release but not publish it; only
-- INSTITUTION_ADMIN and SYSTEM_ADMIN can do both. Migration 0017 gated
-- FROZEN -> PUBLISHED and said this edge was the next migration's item.
--
-- The separation this keeps sharp: content_status_transitions answers "is this
-- transition legal?" and nothing else -- it has no role column and never will.
-- The trigger answers "may this caller make a legal transition?", and only
-- after the graph has already ruled the edge legal. Merging the two would put
-- authority into a data table that exists to describe the lifecycle, and every
-- future edge would have to carry a capability whether or not it needs one.
--
-- Nothing else changes in the function: the body below is 0017's with the
-- FROZEN branch added and the institution lookup hoisted so both capability
-- checks read it once.
--
-- One ordering fix comes with it, found while testing that boundary. BEFORE
-- row triggers fire in NAME order, and `plp_releases_freeze_stamp` sorts
-- before `plp_releases_status_guard`, so an unlisted edge into PUBLISHED was
-- refused by the freeze trigger's defensive "published only after frozen and
-- hashed" check instead of by the graph. Fail-closed either way -- both
-- triggers refuse -- but the reader got the wrong reason, and the graph is
-- supposed to be what answers legality. The trigger is renamed so the guard
-- speaks first; the defensive check stays, and now only ever fires for a
-- listed edge that somehow arrives without a hash.

drop trigger plp_releases_freeze_stamp on public.plp_releases;
create trigger plp_releases_z_freeze_stamp before insert or update on public.plp_releases
  for each row execute function public.enforce_release_freeze();

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

    -- (2) may THIS caller make a legal transition? A separate question with a
    -- separate answer, asked only once the edge is known to be legal.
    v_institution := (to_jsonb(new) ->> 'institution_id')::uuid;

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

    -- sealing is a human CAN_FREEZE_RELEASE act: it is the moment the hash is
    -- computed and the taught content stops being editable (INV-04)
    if new.status = 'FROZEN' then
      if not public.can_in_institution('CAN_FREEZE_RELEASE', v_institution) then
        raise exception 'sealing content requires CAN_FREEZE_RELEASE in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;

    -- publishing is a human CAN_PUBLISH act (INV-32)
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
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'enforce_content_status';
  if def not like '%CAN_FREEZE_RELEASE%' then
    raise exception 'the status trigger does not gate FROZEN on CAN_FREEZE_RELEASE';
  end if;
  if def not like '%CAN_PUBLISH%' then
    raise exception 'the status trigger no longer gates PUBLISHED on CAN_PUBLISH (INV-32)';
  end if;

  -- the two authorities are distinct: a role that can seal is not thereby a
  -- role that can publish
  select string_agg(r::text, ', ') into bad
    from unnest(enum_range(null::public.app_role)) r
   where 'CAN_FREEZE_RELEASE' = any (public.role_capabilities(r))
     and r not in ('SYSTEM_ADMIN','INSTITUTION_ADMIN','HEAD_OF_DEPARTMENT');
  if bad is not null then raise exception 'CAN_FREEZE_RELEASE leaked to role(s): %', bad; end if;
  if not ('CAN_FREEZE_RELEASE' = any (public.role_capabilities('HEAD_OF_DEPARTMENT'))
      and not ('CAN_PUBLISH' = any (public.role_capabilities('HEAD_OF_DEPARTMENT')))) then
    raise exception 'the seal and publish authorities are no longer distinct at HEAD_OF_DEPARTMENT';
  end if;

  -- the lifecycle graph stays free of authority: it carries edges, not roles
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema = 'public' and table_name = 'content_status_transitions'
     and column_name not in ('from_status','to_status','note');
  if bad is not null then
    raise exception 'content_status_transitions grew a column beyond the edge itself: %', bad;
  end if;

  -- the graph answers legality first: BEFORE row triggers fire in name order,
  -- so the status guard must sort before the freeze stamp on plp_releases
  select string_agg(g.tgname, ' < ' order by g.tgname) into bad
    from pg_trigger g join pg_class c on c.oid = g.tgrelid
   where c.relname = 'plp_releases' and not g.tgisinternal and g.tgtype & 2 = 2;
  if bad is distinct from 'plp_releases_status_guard < plp_releases_z_freeze_stamp' then
    raise exception 'plp_releases BEFORE trigger order is %, expected the status guard to fire first', bad;
  end if;

  -- the guard is still attached everywhere it was
  select string_agg(t, ', ') into bad from unnest(array['courses','modules','lessons','items',
    'assessment_definitions','plp_releases']) t
   where not exists (select 1 from pg_trigger g join pg_class c on c.oid = g.tgrelid
                      where c.relname = t and g.tgname = t || '_status_guard' and not g.tgisinternal);
  if bad is not null then raise exception 'status guard missing on: %', bad; end if;

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

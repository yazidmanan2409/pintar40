-- 0016 — FABLE-02 §1/§2: AssessmentDefinition, PLPRelease, authorship and
-- reviewer provenance, and the legal content state machine.
--
-- Scope note: the content_sha256 contract, taught-content immutability and the
-- CAN_PUBLISH gate land in the next migration, once every intended hash input
-- exists. Defining the hash before AssessmentDefinition existed would have
-- produced a "version 1 hash" that a later migration silently reinterpreted.
--
-- The transition graph is an ALLOW-LIST table, not a deny-list: a status with
-- no row in content_status_transitions cannot be reached or left. A future
-- enum value therefore fails closed until a migration adds its edges.
--
-- Standing habit, learned twice in this phase: `create function` grants
-- EXECUTE to PUBLIC, and PUBLIC includes anon. Every new function here is
-- revoked explicitly at the point of creation.

create type public.assessment_mode as enum ('PRE_TEST','POST_TEST','QUICK','STANDALONE');

create table public.content_status_transitions (
  from_status public.content_status not null,
  to_status   public.content_status not null,
  note        text,
  primary key (from_status, to_status)
);
alter table public.content_status_transitions enable row level security;
insert into public.content_status_transitions (from_status, to_status, note) values
  ('INGESTED',          'STRUCTURED',        'raw import shaped into the content model'),
  ('STRUCTURED',        'VALIDATED',         'technical validation passed'),
  ('VALIDATED',         'VALIDATION_FAILED', 'the only permitted regression'),
  ('VALIDATION_FAILED', 'STRUCTURED',        'returned for correction'),
  ('VALIDATED',         'IN_REVIEW',         'submitted for academic review'),
  ('IN_REVIEW',         'APPROVED',          'human reviewer approved; does not lock the row'),
  ('APPROVED',          'FROZEN',            'taught content sealed'),
  ('FROZEN',            'PUBLISHED',         'made available to the institution'),
  ('PUBLISHED',         'SUPERSEDED',        'replaced by a later release');

do $$
declare t text;
begin
  foreach t in array array['courses','modules','lessons','items'] loop
    execute format('alter table public.%I
      add column author_person_id      uuid references public.persons(id),
      add column reviewed_by_person_id uuid references public.persons(id),
      add column reviewed_at           timestamptz', t);
  end loop;
end $$;

create table public.assessment_definitions (
  id                      uuid primary key default gen_random_uuid(),
  institution_id          uuid not null references public.institutions(id),
  course_id               uuid references public.courses(id),
  module_id               uuid references public.modules(id),
  title                   text not null check (btrim(title) <> ''),
  mode                    public.assessment_mode not null,
  bank_type               public.bank_type not null,
  version                 integer not null default 1 check (version > 0),
  item_count              smallint not null check (item_count > 0),
  difficulty_mix          jsonb not null default '{}'::jsonb,
  safety_critical_minimum smallint not null default 0 check (safety_critical_minimum >= 0),
  passing_rules           jsonb not null default '{}'::jsonb,
  hesitation_window_seconds integer check (hesitation_window_seconds is null or hesitation_window_seconds between 1 and 3600),
  shuffle_policy          text not null default 'NONE' check (shuffle_policy in ('NONE','ITEMS','ITEMS_AND_OPTIONS')),
  allows_pause            boolean not null default false,
  offline_tolerant        boolean not null default false,
  late_sync_grace_seconds integer not null default 0 check (late_sync_grace_seconds >= 0),
  attempt_limit           smallint check (attempt_limit is null or attempt_limit > 0),
  author_person_id        uuid references public.persons(id),
  reviewed_by_person_id   uuid references public.persons(id),
  reviewed_at             timestamptz,
  status                  public.content_status not null default 'INGESTED',
  created_at              timestamptz not null default now(),
  constraint assessment_definitions_scope_one check (num_nonnulls(course_id, module_id) = 1),
  constraint assessment_definitions_safety_fits check (safety_critical_minimum <= item_count),
  unique (institution_id, title, mode, version)
);
create index assessment_definitions_course_idx on public.assessment_definitions (course_id);
create index assessment_definitions_module_idx on public.assessment_definitions (module_id);
alter table public.assessment_definitions enable row level security;

create table public.plp_releases (
  id                    uuid primary key default gen_random_uuid(),
  institution_id        uuid not null references public.institutions(id),
  course_id             uuid not null references public.courses(id),
  version_label         text not null check (version_label ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  content_sha256        text check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$'),
  supersedes_release_id uuid references public.plp_releases(id),
  author_person_id      uuid references public.persons(id),
  reviewed_by_person_id uuid references public.persons(id),
  reviewed_at           timestamptz,
  frozen_at             timestamptz,
  published_at          timestamptz,
  status                public.content_status not null default 'INGESTED',
  created_at            timestamptz not null default now(),
  unique (institution_id, course_id, version_label),
  constraint plp_releases_no_self_supersede check (supersedes_release_id is distinct from id)
);
create index plp_releases_supersedes_idx on public.plp_releases (supersedes_release_id);
create index plp_releases_course_idx on public.plp_releases (institution_id, course_id);
alter table public.plp_releases enable row level security;

create function public.enforce_content_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
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
    if not exists (select 1 from public.content_status_transitions t
                    where t.from_status = old.status and t.to_status = new.status) then
      raise exception 'illegal content transition % -> % on %.% (not in the allow-list)',
        old.status, new.status, tg_table_schema, tg_table_name;
    end if;

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
  end if;

  if new.author_person_id is distinct from old.author_person_id then
    raise exception 'author_person_id is immutable (%.%)', tg_table_schema, tg_table_name;
  end if;
  return new;
end $$;
revoke all on function public.enforce_content_status() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['courses','modules','lessons','items','assessment_definitions','plp_releases'] loop
    execute format('create trigger %1$s_status_guard before insert or update on public.%1$I
                      for each row execute function public.enforce_content_status()', t);
  end loop;
end $$;

insert into public.record_class_registry values
  ('assessment_definitions', 'INSTITUTION_SCOPED', 'authored assessment rules'),
  ('plp_releases',           'INSTITUTION_SCOPED', 'authored release snapshots');

do $$
declare t text;
begin
  foreach t in array array['assessment_definitions','plp_releases'] loop
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format($f$
      create policy %1$s_select on public.%1$I for select to authenticated
        using (public.can_in_institution('CAN_DRAFT', institution_id))
    $f$, t);
    execute format($f$
      create policy %1$s_insert on public.%1$I for insert to authenticated
        with check (public.can_in_institution('CAN_DRAFT', institution_id))
    $f$, t);
    execute format($f$
      create policy %1$s_update on public.%1$I for update to authenticated
        using (public.can_in_institution('CAN_DRAFT', institution_id))
        with check (public.can_in_institution('CAN_DRAFT', institution_id))
    $f$, t);
  end loop;
end $$;

grant select on public.content_status_transitions to authenticated;
create policy content_status_transitions_select on public.content_status_transitions
  for select to authenticated using (public.current_person_id() is not null);

do $$
declare n int; bad text; v_inst uuid; v_course uuid; v_a uuid; v_b uuid;
begin
  select count(*) into n from pg_tables
   where schemaname='public' and not rowsecurity
     and tablename in ('assessment_definitions','plp_releases','content_status_transitions');
  if n > 0 then raise exception 'RLS not enabled on % new table(s)', n; end if;

  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;

  select count(*) into n from pg_policies
   where schemaname='public' and (qual='true' or with_check='true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;

  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;

  select count(*) into n from public.content_status_transitions;
  if n <> 9 then raise exception 'transition allow-list has % edges, expected 9', n; end if;
  select string_agg(from_status::text, ', ') into bad from public.content_status_transitions
   where from_status in ('SUPERSEDED');
  if bad is not null then raise exception 'SUPERSEDED has outgoing transitions: %', bad; end if;
  select string_agg(to_status::text, ', ') into bad from public.content_status_transitions
   where from_status = 'VALIDATED' and to_status not in ('IN_REVIEW','VALIDATION_FAILED');
  if bad is not null then raise exception 'unexpected transition out of VALIDATED: %', bad; end if;
  select string_agg(from_status::text || '->' || to_status::text, ', ') into bad
    from public.content_status_transitions
   where (from_status = 'FROZEN' and to_status <> 'PUBLISHED')
      or (from_status = 'PUBLISHED' and to_status <> 'SUPERSEDED');
  if bad is not null then raise exception 'reversal out of a sealed state is listed: %', bad; end if;

  select string_agg(t, ', ') into bad from unnest(array['courses','modules','lessons','items',
    'assessment_definitions','plp_releases']) t
   where not exists (select 1 from pg_trigger g join pg_class c on c.oid = g.tgrelid
                      where c.relname = t and g.tgname = t || '_status_guard' and not g.tgisinternal);
  if bad is not null then raise exception 'status guard missing on: %', bad; end if;

  -- behavioural proof against a real row, removed before the block ends.
  -- Order by id: the seeded persons share a created_at, so ordering by it is
  -- not deterministic and can return the same row twice.
  select id into v_inst from public.institutions order by id limit 1;
  if v_inst is null then raise exception 'no institution to verify against'; end if;
  select id into v_a from public.persons order by id limit 1;
  select id into v_b from public.persons order by id desc limit 1;
  if v_a is null or v_b is null or v_a = v_b then
    raise exception 'need two distinct persons to verify reviewer separation'; end if;

  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Verifikasi', 'SMA', 'X', 'guard probe', v_a) returning id into v_course;

  begin
    update public.courses set status = 'VALIDATED' where id = v_course;
    raise exception 'GUARD_GAP: allowed INGESTED -> VALIDATED (a skip)';
  exception when others then
    if sqlerrm like 'GUARD_GAP%' then raise; end if;
  end;

  update public.courses set status = 'STRUCTURED' where id = v_course;
  update public.courses set status = 'VALIDATED'  where id = v_course;
  update public.courses set status = 'IN_REVIEW'  where id = v_course;

  begin
    update public.courses set status = 'APPROVED', reviewed_by_person_id = v_a where id = v_course;
    raise exception 'GUARD_GAP: allowed the author to approve their own content';
  exception when others then
    if sqlerrm like 'GUARD_GAP%' then raise; end if;
  end;

  update public.courses set status = 'APPROVED', reviewed_by_person_id = v_b where id = v_course;
  select count(*) into n from public.courses where id = v_course and reviewed_at is not null;
  if n <> 1 then raise exception 'APPROVED did not stamp reviewed_at'; end if;

  update public.courses set status = 'FROZEN' where id = v_course;
  begin
    update public.courses set status = 'APPROVED' where id = v_course;
    raise exception 'GUARD_GAP: allowed a reversal out of FROZEN';
  exception when others then
    if sqlerrm like 'GUARD_GAP%' then raise; end if;
  end;

  begin
    update public.courses set author_person_id = v_b where id = v_course;
    raise exception 'GUARD_GAP: allowed author_person_id to be rewritten';
  exception when others then
    if sqlerrm like 'GUARD_GAP%' then raise; end if;
  end;

  delete from public.courses where id = v_course;
end $$;

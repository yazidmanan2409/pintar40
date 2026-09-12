-- 0021 — FABLE-02 §7, slice A: the evidence root. AssessmentSession,
-- PresentedItem, and the provenance backbone (INV-33).
--
-- These tables are created here and written by Phases 3-4. Nothing in this
-- migration decides when real evidence is produced; it decides what a piece of
-- evidence must carry to be admissible, and makes those facts unrewritable.
--
-- THE DERIVATION RULE, and why it is shaped this way. FABLE-02's checkpoint
-- found a tenant hop that worked because an authorization decision read
-- NEW.institution_id -- a value the same statement was writing. evidence_class
-- is the same shape of decision and worth more: it decides whether a session
-- counts as real evidence at all. So none of its inputs is caller-supplied.
--
--   * enrollment_id is the authoritative binding. enrollments already carries
--     (person_id, institution_id, academic_period_id) NOT NULL, so a session
--     DERIVES all three from it rather than accepting them alongside it. There
--     is no second value that could disagree.
--   * evidence_class has no parameter anywhere. The opener does not take one,
--     and the insert trigger overwrites whatever is in the column, so even an
--     owner-level INSERT cannot assert it.
--   * the tenant-synthetic rule wins unconditionally and first: a synthetic
--     institution can never produce OFFICIAL evidence, whatever else is asked
--     for.
--
-- WHAT IS IMMUTABLE, and what deliberately is not. Provenance is the
-- historical identity of the evidence: who, where, under which enrolment,
-- period, release, definition, engine and policy, through which channel, in
-- which class. Those never change. Operational state must keep moving during a
-- live session -- status, the authoritative deadline (extension is an audited
-- act), the termination reason, the lifecycle timestamps -- and freezing them
-- because they share a table would make the schema unusable by Phase 3. The
-- trigger therefore names provenance columns explicitly; it does not freeze
-- the row.
--
-- CLIENT WRITE PATH: none. No client role receives INSERT, UPDATE or DELETE on
-- either table. Sessions are opened through open_assessment_session(), which
-- only the service role may execute. That is what "created here, written by
-- Phases 3-4" means in privileges rather than in prose, and it is also what
-- makes the derivation rule above airtight: there is no client statement in
-- which an input could be manipulated.

create type public.session_status as enum
  ('CREATED','IN_PROGRESS','PAUSED','SUBMITTED','EXPIRED','TERMINATED','FINALIZED');

create type public.evidence_channel as enum
  ('ONLINE','PAPER_MANUAL_ENTRY','PAPER_IMPORTED','PUBLIC_DEMO');

create type public.evidence_class as enum
  ('OFFICIAL','PREVIEW','SYNTHETIC','PUBLIC_DEMO');

-- Same allow-list shape as content_status_transitions, and the same rule: this
-- table answers "is the transition legal" and carries no capability column.
create table public.session_status_transitions (
  from_status public.session_status not null,
  to_status   public.session_status not null,
  note        text,
  primary key (from_status, to_status)
);
alter table public.session_status_transitions enable row level security;
insert into public.session_status_transitions (from_status, to_status, note) values
  ('CREATED',     'IN_PROGRESS', 'learner began'),
  ('CREATED',     'EXPIRED',     'deadline passed before it began'),
  ('CREATED',     'TERMINATED',  'withdrawn before it began'),
  ('IN_PROGRESS', 'PAUSED',      'permitted only where the definition allows pausing'),
  ('IN_PROGRESS', 'SUBMITTED',   'learner submitted'),
  ('IN_PROGRESS', 'EXPIRED',     'authoritative deadline passed'),
  ('IN_PROGRESS', 'TERMINATED',  'ended by staff or integrity action'),
  ('PAUSED',      'IN_PROGRESS', 'resumed'),
  ('PAUSED',      'EXPIRED',     'deadline passed while paused'),
  ('PAUSED',      'TERMINATED',  'ended while paused'),
  ('SUBMITTED',   'FINALIZED',   'scored'),
  ('SUBMITTED',   'TERMINATED',  'withdrawn after submission, before scoring'),
  ('EXPIRED',     'FINALIZED',   'scored on what was answered');

create table public.assessment_sessions (
  id                    uuid primary key default gen_random_uuid(),
  -- provenance: derived (person, institution, period) or required (the rest)
  person_id             uuid not null references public.persons(id),
  institution_id        uuid not null references public.institutions(id),
  enrollment_id         uuid not null references public.enrollments(id),
  academic_period_id    uuid not null references public.academic_periods(id),
  class_node_id         uuid references public.org_nodes(id),
  cohort_node_id        uuid references public.org_nodes(id),
  -- the assignment tables are a later migration in this phase; the columns
  -- exist now because provenance is NOT NULL from the first migration, and the
  -- foreign keys are added when those tables land.
  learning_assignment_id   uuid,
  assessment_assignment_id uuid,
  plp_release_id        uuid not null references public.plp_releases(id),
  assessment_definition_id uuid not null references public.assessment_definitions(id),
  assessment_definition_version integer not null check (assessment_definition_version > 0),
  engine_version        text not null check (btrim(engine_version) <> ''),
  scoring_policy_version text not null check (btrim(scoring_policy_version) <> ''),
  evidence_channel      public.evidence_channel not null,
  evidence_class        public.evidence_class not null,
  mode                  public.assessment_mode not null,
  -- operational state: these move during a live session
  status                public.session_status not null default 'CREATED',
  authoritative_deadline timestamptz,
  shuffle_seed          bigint not null default (random() * 9007199254740991)::bigint,
  termination_reason    text,
  started_at            timestamptz,
  submitted_at          timestamptz,
  finalized_at          timestamptz,
  created_at            timestamptz not null default now(),
  constraint sessions_termination_reason_only_when_terminated
    check ((status = 'TERMINATED') or termination_reason is null)
);
create index assessment_sessions_person_idx on public.assessment_sessions (person_id, created_at desc);
create index assessment_sessions_institution_idx on public.assessment_sessions (institution_id, evidence_class);
create index assessment_sessions_definition_idx on public.assessment_sessions (assessment_definition_id);
alter table public.assessment_sessions enable row level security;

-- PresentedItem: what was actually put in front of the learner, in what order.
-- Immutable in full -- there is no operational half to a delivery record.
create table public.presented_items (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.assessment_sessions(id),
  item_id        uuid not null references public.items(id),
  institution_id uuid not null references public.institutions(id),
  position       smallint not null check (position > 0),
  presented_at   timestamptz not null default now(),
  unique (session_id, position),
  unique (session_id, item_id)
);
create index presented_items_item_idx on public.presented_items (item_id);
alter table public.presented_items enable row level security;

-- ---------------------------------------------------------------------------
-- evidence_class derivation. Reads the institution's own is_synthetic flag,
-- the channel, and a transaction-local server context -- never a column on the
-- row being written. The synthetic rule is first and unconditional.
-- ---------------------------------------------------------------------------
create function public.derive_evidence_class(p_institution uuid,
                                             p_channel public.evidence_channel)
returns public.evidence_class
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_synthetic boolean; v_context text;
begin
  select i.is_synthetic into v_synthetic from public.institutions i where i.id = p_institution;
  if v_synthetic is null then
    raise exception 'cannot derive evidence_class: unknown institution %', p_institution;
  end if;
  -- a synthetic tenant never produces official evidence, whatever is asked for
  if v_synthetic then return 'SYNTHETIC'; end if;
  if p_channel = 'PUBLIC_DEMO' then return 'PUBLIC_DEMO'; end if;
  v_context := nullif(current_setting('app.evidence_context', true), '');
  if v_context = 'preview' then return 'PREVIEW'; end if;
  return 'OFFICIAL';
end $$;
revoke all on function public.derive_evidence_class(uuid, public.evidence_channel)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Provenance: derived on insert, unrewritable afterwards (INV-33).
-- ---------------------------------------------------------------------------
create function public.enforce_session_provenance() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_person uuid; v_inst uuid; v_period uuid; v_col text;
  v_new jsonb; v_old jsonb;
  v_provenance text[] := array['person_id','institution_id','enrollment_id','academic_period_id',
    'class_node_id','cohort_node_id','learning_assignment_id','assessment_assignment_id',
    'plp_release_id','assessment_definition_id','assessment_definition_version',
    'engine_version','scoring_policy_version','evidence_channel','evidence_class','mode',
    'shuffle_seed','created_at'];
begin
  if tg_op = 'INSERT' then
    -- the enrollment is the authoritative binding; person, institution and
    -- period are read from it, never accepted alongside it
    select e.person_id, e.institution_id, e.academic_period_id
      into v_person, v_inst, v_period
      from public.enrollments e where e.id = new.enrollment_id;
    if v_person is null then
      raise exception 'unknown enrollment %', new.enrollment_id;
    end if;
    new.person_id := v_person;
    new.institution_id := v_inst;
    new.academic_period_id := v_period;

    -- evidence_class is derived, never asserted
    new.evidence_class := public.derive_evidence_class(v_inst, new.evidence_channel);

    -- the release and the definition belong to the same institution as the
    -- enrolment, or the provenance would name two tenants at once
    if not exists (select 1 from public.plp_releases r
                    where r.id = new.plp_release_id and r.institution_id = v_inst) then
      raise exception 'the release does not belong to the enrolment''s institution';
    end if;
    if not exists (select 1 from public.assessment_definitions d
                    where d.id = new.assessment_definition_id and d.institution_id = v_inst) then
      raise exception 'the assessment definition does not belong to the enrolment''s institution';
    end if;
    return new;
  end if;

  v_new := to_jsonb(new); v_old := to_jsonb(old);
  foreach v_col in array v_provenance loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception 'assessment_sessions.% is provenance and immutable after insert (INV-33)', v_col;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.enforce_session_provenance() from public, anon, authenticated;

create trigger assessment_sessions_provenance before insert or update on public.assessment_sessions
  for each row execute function public.enforce_session_provenance();

-- ---------------------------------------------------------------------------
-- Session lifecycle. Same separation the content lifecycle keeps: the graph
-- answers legality and carries no capability column.
-- ---------------------------------------------------------------------------
create function public.enforce_session_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'CREATED' then
      raise exception 'a session is created at CREATED, not %', new.status;
    end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    if not exists (select 1 from public.session_status_transitions t
                    where t.from_status = old.status and t.to_status = new.status) then
      raise exception 'illegal session transition % -> % (not in the allow-list)',
        old.status, new.status;
    end if;
    if new.status = 'IN_PROGRESS' and new.started_at is null then
      new.started_at := now();
    end if;
    if new.status = 'SUBMITTED' then new.submitted_at := coalesce(new.submitted_at, now()); end if;
    if new.status = 'FINALIZED' then new.finalized_at := coalesce(new.finalized_at, now()); end if;
    if new.status = 'TERMINATED' and coalesce(btrim(new.termination_reason), '') = '' then
      raise exception 'TERMINATED requires a termination_reason';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_session_status() from public, anon, authenticated;

create trigger assessment_sessions_status before insert or update on public.assessment_sessions
  for each row execute function public.enforce_session_status();

-- A delivery record is written once and never revised.
create function public.enforce_presented_item_immutable() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    select s.institution_id into new.institution_id
      from public.assessment_sessions s where s.id = new.session_id;
    if new.institution_id is null then
      raise exception 'unknown session %', new.session_id;
    end if;
    if not exists (select 1 from public.items i
                    where i.id = new.item_id and i.institution_id = new.institution_id) then
      raise exception 'the item does not belong to the session''s institution (INV-01)';
    end if;
    return new;
  end if;
  raise exception 'a presented item is immutable: it records what was shown (INV-33)';
end $$;
revoke all on function public.enforce_presented_item_immutable() from public, anon, authenticated;

create trigger presented_items_immutable before insert or update or delete on public.presented_items
  for each row execute function public.enforce_presented_item_immutable();

-- Tenant immutability, carried forward from 0019 rather than rediscovered.
create trigger assessment_sessions_tenant_immutable before update on public.assessment_sessions
  for each row execute function public.enforce_record_tenant_immutable();

-- ---------------------------------------------------------------------------
-- The only creation path. Only the service role may call it; there is no
-- evidence_class parameter to supply, and person/institution/period are not
-- parameters either.
-- ---------------------------------------------------------------------------
create function public.open_assessment_session(
  p_enrollment uuid,
  p_definition uuid,
  p_plp_release uuid,
  p_channel public.evidence_channel,
  p_mode public.assessment_mode,
  p_engine_version text,
  p_scoring_policy_version text,
  p_class_node uuid default null,
  p_cohort_node uuid default null,
  p_authoritative_deadline timestamptz default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_version integer;
begin
  select d.version into v_version from public.assessment_definitions d where d.id = p_definition;
  if v_version is null then raise exception 'unknown assessment definition %', p_definition; end if;
  insert into public.assessment_sessions (
    person_id, institution_id, academic_period_id,           -- overwritten by the trigger
    enrollment_id, class_node_id, cohort_node_id, plp_release_id,
    assessment_definition_id, assessment_definition_version,
    engine_version, scoring_policy_version, evidence_channel,
    evidence_class,                                          -- overwritten by the trigger
    mode, authoritative_deadline)
  values (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    p_enrollment, p_class_node, p_cohort_node, p_plp_release,
    p_definition, v_version, p_engine_version, p_scoring_policy_version, p_channel,
    'OFFICIAL',
    p_mode, p_authoritative_deadline)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.open_assessment_session(uuid, uuid, uuid, public.evidence_channel,
  public.assessment_mode, text, text, uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.open_assessment_session(uuid, uuid, uuid, public.evidence_channel,
  public.assessment_mode, text, text, uuid, uuid, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- Reads only. A learner sees their own sessions; staff see their institution's
-- through the capability they already hold. shuffle_seed is server-only, so it
-- is excluded from the column grant rather than merely undocumented.
-- ---------------------------------------------------------------------------
grant select (id, person_id, institution_id, enrollment_id, academic_period_id,
              class_node_id, cohort_node_id, learning_assignment_id, assessment_assignment_id,
              plp_release_id, assessment_definition_id, assessment_definition_version,
              engine_version, scoring_policy_version, evidence_channel, evidence_class, mode,
              status, authoritative_deadline, termination_reason, started_at, submitted_at,
              finalized_at, created_at)
  on public.assessment_sessions to authenticated;
grant select on public.presented_items to authenticated;
grant select on public.session_status_transitions to authenticated;

create policy assessment_sessions_select on public.assessment_sessions for select to authenticated
  using (person_id = public.current_person_id()
      or public.can_in_institution('CAN_REVIEW_INTEGRITY', institution_id)
      or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id));

create policy presented_items_select on public.presented_items for select to authenticated
  using (exists (select 1 from public.assessment_sessions s
                  where s.id = session_id
                    and (s.person_id = public.current_person_id()
                      or public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id))));

create policy session_status_transitions_select on public.session_status_transitions
  for select to authenticated using (public.current_person_id() is not null);

insert into public.record_class_registry values
  ('assessment_sessions', 'INSTITUTION_SCOPED', 'evidence never travels with a learner'),
  ('presented_items',     'INSTITUTION_SCOPED', 'evidence never travels with a learner');

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text;
begin
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity
   and tablename in ('assessment_sessions','presented_items','session_status_transitions');
  if n > 0 then raise exception 'RLS not enabled on % new evidence table(s)', n; end if;

  -- no client write path anywhere on the evidence tables
  select string_agg(g.table_name || '.' || g.privilege_type || '->' || g.grantee, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee in ('anon','authenticated')
     and g.table_name in ('assessment_sessions','presented_items','session_status_transitions')
     and g.privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES');
  if bad is not null then raise exception 'a client role can write evidence: %', bad; end if;

  -- shuffle_seed is server-only: no client column grant on it
  select count(*) into n from information_schema.column_privileges
   where table_schema='public' and table_name='assessment_sessions'
     and column_name='shuffle_seed' and grantee in ('anon','authenticated');
  if n > 0 then raise exception 'shuffle_seed is readable by a client role'; end if;

  -- evidence_class cannot be asserted: the opener takes no such parameter
  select pg_get_function_identity_arguments(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='open_assessment_session';
  if def is null then raise exception 'open_assessment_session missing'; end if;
  if def ilike '%evidence_class%' then
    raise exception 'open_assessment_session accepts an evidence_class argument';
  end if;
  if def ilike '%person%' or def ilike '%institution%' or def ilike '%period%' then
    raise exception 'open_assessment_session accepts a derived provenance argument: %', def;
  end if;

  -- the derivation reads the institution row, not the row being written
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='derive_evidence_class';
  if def not like '%is_synthetic%' then
    raise exception 'derive_evidence_class does not read the tenant synthetic flag';
  end if;

  -- the provenance trigger names columns; it must not freeze operational state
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='enforce_session_provenance';
  foreach bad in array array['status','authoritative_deadline','termination_reason',
                             'started_at','submitted_at','finalized_at'] loop
    if def like '%''' || bad || '''%' then
      raise exception 'operational column % was frozen as provenance', bad;
    end if;
  end loop;

  -- the lifecycle graph is edges only, like the content one
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema='public' and table_name='session_status_transitions'
     and column_name not in ('from_status','to_status','note');
  if bad is not null then raise exception 'session_status_transitions grew a column: %', bad; end if;
  select count(*) into n from public.session_status_transitions;
  if n <> 13 then raise exception 'session transition allow-list has % edges, expected 13', n; end if;
  select string_agg(from_status::text, ', ') into bad from public.session_status_transitions
   where from_status in ('FINALIZED','TERMINATED');
  if bad is not null then raise exception 'a terminal session state has outgoing edges: %', bad; end if;

  -- standing hygiene
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
end $$;

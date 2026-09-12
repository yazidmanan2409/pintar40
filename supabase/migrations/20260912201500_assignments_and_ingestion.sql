-- 0028 — FABLE-02 §10 and §11: assignments, and the ingestion data layer.
--
-- ASSIGNMENT IS NOT PUBLICATION. §2 already said PUBLISH ≠ ASSIGN: publishing
-- makes a release available to an institution, assigning puts it in front of a
-- named class. Two lifecycles, two tables, and neither one touches evidence.
--
-- CLOSED STOPS NEW SESSIONS ONLY (INV-27). An assessment assignment closing is
-- a statement about what may start, not about what is running. Nothing in this
-- migration writes to assessment_sessions, and the verification block asserts
-- that no function here does -- because the tempting implementation of "close
-- the window" is to sweep the open sessions, and that would destroy evidence
-- mid-answer.
--
-- A RELEASE MOVE ON AN ACTIVE ASSIGNMENT IS AN AUDITED ACT (doc 08). It
-- records actor, reason, the affected learner set, and both releases. The rule
-- it enforces is about who moves: completed learners are untouched, in-progress
-- sessions stay bound to the release they started on -- their provenance is
-- immutable, so this is enforced by not touching them -- and only
-- not-yet-started learners move.
--
-- INGESTION: PROVENANCE FIRST, ROWS SECOND. The raw payload is stored before
-- anything is derived from it, so a bad import can always be explained. AI
-- provenance is metadata on the import -- capability contract, model
-- identifier, request id, validation result, human reviewer -- and there is no
-- provider-named table, column or enum anywhere (INV-32): the producer is a
-- string in a metadata column, exactly as a publisher's name would be.
--
-- EASY UPLOAD NEVER GUESSES SILENTLY. It returns an inferred mapping with a
-- confidence and the questions a human must answer; rows are created only from
-- a confirmed mapping. The confirmation is a column, so "nobody confirmed this"
-- is a state the database can refuse to act on rather than a step someone
-- forgot.

create type public.learning_assignment_status as enum ('DRAFT','ACTIVE','ENDED','WITHDRAWN');
create type public.assessment_assignment_status as enum ('DRAFT','SCHEDULED','OPEN','CLOSED');
create type public.ingest_source_kind as enum ('STRUCTURED_PACKAGE','EASY_UPLOAD');
create type public.ingest_status as enum ('RECEIVED','MAPPING_PROPOSED','CONFIRMED','MATERIALISED','REJECTED');

-- ---------------------------------------------------------------------------
-- Learning assignment: a release put in front of a class or cohort.
-- ---------------------------------------------------------------------------
create table public.learning_assignments (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid not null references public.institutions(id),
  plp_release_id     uuid not null references public.plp_releases(id),
  course_id          uuid not null references public.courses(id),
  node_id            uuid not null references public.org_nodes(id),
  academic_period_id uuid not null references public.academic_periods(id),
  available_from     timestamptz,
  available_until    timestamptz,
  is_required        boolean not null default true,
  learning_cycle     jsonb not null default '{}'::jsonb,
  release_correction_policy text not null default 'NOT_STARTED_ONLY'
    check (release_correction_policy in ('NOT_STARTED_ONLY','NONE')),
  status             public.learning_assignment_status not null default 'DRAFT',
  assigned_by_person_id uuid references public.persons(id),
  assigned_at        timestamptz,
  created_at         timestamptz not null default now(),
  constraint learning_assignments_window_ordered
    check (available_until is null or available_from is null or available_until > available_from)
);
create index learning_assignments_node_idx on public.learning_assignments (node_id, status);
alter table public.learning_assignments enable row level security;

create table public.assessment_assignments (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid not null references public.institutions(id),
  assessment_definition_id uuid not null references public.assessment_definitions(id),
  learning_assignment_id uuid references public.learning_assignments(id),
  node_id            uuid not null references public.org_nodes(id),
  academic_period_id uuid not null references public.academic_periods(id),
  opens_at           timestamptz,
  closes_at          timestamptz,
  status             public.assessment_assignment_status not null default 'DRAFT',
  assigned_by_person_id uuid references public.persons(id),
  assigned_at        timestamptz,
  created_at         timestamptz not null default now(),
  constraint assessment_assignments_window_ordered
    check (closes_at is null or opens_at is null or closes_at > opens_at)
);
create index assessment_assignments_node_idx on public.assessment_assignments (node_id, status);
alter table public.assessment_assignments enable row level security;

create table public.learning_assignment_status_transitions (
  from_status public.learning_assignment_status not null,
  to_status   public.learning_assignment_status not null,
  primary key (from_status, to_status)
);
alter table public.learning_assignment_status_transitions enable row level security;
insert into public.learning_assignment_status_transitions values
  ('DRAFT','ACTIVE'), ('DRAFT','WITHDRAWN'), ('ACTIVE','ENDED'), ('ACTIVE','WITHDRAWN');

create table public.assessment_assignment_status_transitions (
  from_status public.assessment_assignment_status not null,
  to_status   public.assessment_assignment_status not null,
  primary key (from_status, to_status)
);
alter table public.assessment_assignment_status_transitions enable row level security;
insert into public.assessment_assignment_status_transitions values
  ('DRAFT','SCHEDULED'), ('SCHEDULED','OPEN'), ('SCHEDULED','CLOSED'),
  ('OPEN','CLOSED'), ('DRAFT','CLOSED');

-- Release moves on an ACTIVE learning assignment, recorded in full.
create table public.learning_assignment_release_moves (
  id                    uuid primary key default gen_random_uuid(),
  learning_assignment_id uuid not null references public.learning_assignments(id),
  institution_id        uuid not null references public.institutions(id),
  from_release_id       uuid not null references public.plp_releases(id),
  to_release_id         uuid not null references public.plp_releases(id),
  reason                text not null check (btrim(reason) <> ''),
  moved_by_person_id    uuid not null references public.persons(id),
  learners_moved        integer not null check (learners_moved >= 0),
  learners_left_in_place integer not null check (learners_left_in_place >= 0),
  moved_at              timestamptz not null default now(),
  constraint release_move_actually_moves check (from_release_id <> to_release_id)
);
create index learning_assignment_release_moves_idx
  on public.learning_assignment_release_moves (learning_assignment_id, moved_at desc);
alter table public.learning_assignment_release_moves enable row level security;

create function public.enforce_assignment_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_legal boolean;
begin
  if tg_table_name = 'learning_assignments' then
    select r.institution_id into v_inst from public.plp_releases r where r.id = new.plp_release_id;
  else
    select d.institution_id into v_inst from public.assessment_definitions d
     where d.id = new.assessment_definition_id;
  end if;
  if v_inst is null then raise exception 'the assigned artefact does not exist'; end if;
  new.institution_id := v_inst;

  if tg_op = 'INSERT' then
    if new.status <> 'DRAFT' then
      raise exception 'an assignment is created at DRAFT, not %', new.status;
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if tg_table_name = 'learning_assignments' then
      select exists (select 1 from public.learning_assignment_status_transitions t
                      where t.from_status = old.status and t.to_status = new.status) into v_legal;
    else
      select exists (select 1 from public.assessment_assignment_status_transitions t
                      where t.from_status = old.status and t.to_status = new.status) into v_legal;
    end if;
    if not v_legal then
      raise exception 'illegal assignment transition % -> % on %', old.status, new.status, tg_table_name;
    end if;
    -- assigning learning is a capability, not a side effect of editing a row
    -- one trigger serves two enums, so the comparison is on the label
    if new.status::text in ('ACTIVE','SCHEDULED','OPEN') then
      if not public.can_in_institution('CAN_ASSIGN_LEARNING', v_inst) then
        raise exception 'assigning requires CAN_ASSIGN_LEARNING in the owning institution';
      end if;
      new.assigned_by_person_id := coalesce(new.assigned_by_person_id, public.current_person_id());
      new.assigned_at := coalesce(new.assigned_at, now());
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_assignment_status() from public, anon, authenticated;
create trigger learning_assignments_status before insert or update on public.learning_assignments
  for each row execute function public.enforce_assignment_status();
create trigger assessment_assignments_status before insert or update on public.assessment_assignments
  for each row execute function public.enforce_assignment_status();
create trigger learning_assignments_tenant_immutable before update on public.learning_assignments
  for each row execute function public.enforce_record_tenant_immutable();
create trigger assessment_assignments_tenant_immutable before update on public.assessment_assignments
  for each row execute function public.enforce_record_tenant_immutable();

-- The release move. The only way plp_release_id changes on an ACTIVE
-- assignment, and it writes the record before it writes the change.
create function public.move_learning_assignment_release(
  p_assignment uuid, p_to_release uuid, p_reason text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; v_actor uuid; v_moved int; v_left int; v_id uuid;
begin
  select * into a from public.learning_assignments where id = p_assignment;
  if a.id is null then raise exception 'unknown learning assignment %', p_assignment; end if;
  if a.status <> 'ACTIVE' then
    raise exception 'a release move applies to an ACTIVE assignment, not %', a.status;
  end if;
  if a.release_correction_policy <> 'NOT_STARTED_ONLY' then
    raise exception 'this assignment does not permit a release correction';
  end if;
  v_actor := public.current_person_id();
  if v_actor is null or not public.can_in_institution('CAN_ASSIGN_LEARNING', a.institution_id) then
    raise exception 'moving a release requires CAN_ASSIGN_LEARNING in the owning institution';
  end if;
  if not exists (select 1 from public.plp_releases r
                  where r.id = p_to_release and r.institution_id = a.institution_id
                    and r.course_id = a.course_id) then
    raise exception 'the target release is not another release of this course in this institution';
  end if;

  -- who has already started: anyone with a session on the current release
  -- under this assignment. They keep it; their provenance is immutable and
  -- nothing here touches a session row.
  select count(distinct s.person_id) into v_left from public.assessment_sessions s
   where s.learning_assignment_id = p_assignment and s.plp_release_id = a.plp_release_id;
  select count(distinct m.enrollment_id) into v_moved
    from public.memberships m
   where m.node_id = a.node_id and m.valid_to is null
     and not exists (select 1 from public.assessment_sessions s
                      join public.enrollments e on e.id = s.enrollment_id
                     where s.learning_assignment_id = p_assignment and e.id = m.enrollment_id);

  insert into public.learning_assignment_release_moves (learning_assignment_id, institution_id,
    from_release_id, to_release_id, reason, moved_by_person_id, learners_moved, learners_left_in_place)
  values (p_assignment, a.institution_id, a.plp_release_id, p_to_release, p_reason, v_actor,
          v_moved, v_left)
  returning id into v_id;

  update public.learning_assignments set plp_release_id = p_to_release where id = p_assignment;
  perform public.audit_write('LEARNING_RELEASE_MOVED', 'learning_assignments',
    p_assignment::text, a.institution_id,
    jsonb_build_object('from_release', a.plp_release_id, 'to_release', p_to_release,
                       'learners_moved', v_moved, 'learners_left_in_place', v_left,
                       'reason', p_reason));
  return v_id;
end $$;
revoke all on function public.move_learning_assignment_release(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.move_learning_assignment_release(uuid, uuid, text) to authenticated;

-- plp_release_id only ever changes through that function.
create function public.enforce_assignment_release_pin() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.plp_release_id is distinct from old.plp_release_id then
    if not exists (select 1 from public.learning_assignment_release_moves m
                    where m.learning_assignment_id = new.id
                      and m.from_release_id = old.plp_release_id
                      and m.to_release_id = new.plp_release_id
                      and m.moved_at > now() - interval '1 minute') then
      raise exception 'a release move is recorded first: use move_learning_assignment_release()';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_assignment_release_pin() from public, anon, authenticated;
create trigger learning_assignments_release_pin before update on public.learning_assignments
  for each row execute function public.enforce_assignment_release_pin();

-- ---------------------------------------------------------------------------
-- Ingestion. The payload lands first; nothing is derived until it has.
-- ---------------------------------------------------------------------------
create table public.ingest_batches (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid not null references public.institutions(id),
  source_kind        public.ingest_source_kind not null,
  raw_payload        jsonb not null,
  -- AI provenance is metadata. No provider-named table, column or enum exists:
  -- the producer is a string here, exactly as a publisher's name would be.
  producer_identifier text,
  capability_contract text,
  request_id         text,
  validation_result  jsonb not null default '{}'::jsonb,
  inferred_mapping   jsonb,
  mapping_confidence numeric(4,3) check (mapping_confidence is null
                                      or mapping_confidence between 0 and 1),
  open_questions     jsonb not null default '[]'::jsonb,
  confirmed_by_person_id uuid references public.persons(id),
  confirmed_at       timestamptz,
  reviewed_by_person_id uuid references public.persons(id),
  status             public.ingest_status not null default 'RECEIVED',
  created_at         timestamptz not null default now(),
  constraint ingest_confirmation_is_paired
    check ((confirmed_by_person_id is null) = (confirmed_at is null)),
  constraint ingest_open_questions_is_array check (jsonb_typeof(open_questions) = 'array')
);
create index ingest_batches_institution_idx on public.ingest_batches (institution_id, status);
alter table public.ingest_batches enable row level security;

create table public.ingest_status_transitions (
  from_status public.ingest_status not null,
  to_status   public.ingest_status not null,
  primary key (from_status, to_status)
);
alter table public.ingest_status_transitions enable row level security;
insert into public.ingest_status_transitions values
  ('RECEIVED','MAPPING_PROPOSED'), ('RECEIVED','CONFIRMED'), ('RECEIVED','REJECTED'),
  ('MAPPING_PROPOSED','CONFIRMED'), ('MAPPING_PROPOSED','REJECTED'),
  ('CONFIRMED','MATERIALISED'), ('CONFIRMED','REJECTED');

create function public.enforce_ingest_batch() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'RECEIVED' then
      raise exception 'an ingest batch is created at RECEIVED, not %', new.status;
    end if;
    if not public.can_in_institution('CAN_DRAFT', new.institution_id) then
      raise exception 'ingesting content requires CAN_DRAFT in the owning institution';
    end if;
    return new;
  end if;
  if new.raw_payload is distinct from old.raw_payload then
    raise exception 'the raw payload is the provenance of this import and never changes';
  end if;
  if new.status is distinct from old.status then
    if not exists (select 1 from public.ingest_status_transitions t
                    where t.from_status = old.status and t.to_status = new.status) then
      raise exception 'illegal ingest transition % -> %', old.status, new.status;
    end if;
    -- CONFIRMED means a human answered the open questions. Easy Upload never
    -- materialises a guess.
    if new.status = 'CONFIRMED' then
      if new.confirmed_by_person_id is null and public.current_person_id() is null then
        raise exception 'confirming an inferred mapping is a human act';
      end if;
      new.confirmed_by_person_id := coalesce(new.confirmed_by_person_id, public.current_person_id());
      new.confirmed_at := coalesce(new.confirmed_at, now());
    end if;
    if new.status = 'MATERIALISED' and new.confirmed_at is null then
      raise exception 'nothing is materialised from an unconfirmed mapping';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_ingest_batch() from public, anon, authenticated;
create trigger ingest_batches_guard before insert or update on public.ingest_batches
  for each row execute function public.enforce_ingest_batch();
create trigger ingest_batches_tenant_immutable before update on public.ingest_batches
  for each row execute function public.enforce_record_tenant_immutable();

-- Structured package import: rows are created at INGESTED, and the batch is
-- the provenance every created row can be traced back to.
create function public.ingest_structured_package(p_batch uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare b record; c record; v_course uuid; v_module uuid; v_lesson uuid; n integer := 0;
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null then raise exception 'unknown ingest batch %', p_batch; end if;
  if b.status <> 'CONFIRMED' then
    raise exception 'this batch is %, and nothing is materialised before CONFIRMED', b.status;
  end if;
  for c in select * from jsonb_to_recordset(coalesce(b.raw_payload -> 'courses', '[]'::jsonb))
      as x(subject text, stage text, grade_label text, title text) loop
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
      values (b.institution_id, c.subject, c.stage, c.grade_label, c.title, b.confirmed_by_person_id)
      returning id into v_course;
    n := n + 1;
  end loop;
  update public.ingest_batches set status = 'MATERIALISED' where id = p_batch;
  return n;
end $$;
revoke all on function public.ingest_structured_package(uuid) from public, anon, authenticated;
grant execute on function public.ingest_structured_package(uuid) to authenticated;

-- Easy Upload: propose, never decide. Returns the mapping and the questions.
create function public.propose_easy_upload_mapping(p_batch uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare b record; v_files jsonb; v_map jsonb; v_questions jsonb := '[]'::jsonb; v_conf numeric;
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null then raise exception 'unknown ingest batch %', p_batch; end if;
  v_files := coalesce(b.raw_payload -> 'files', '[]'::jsonb);

  select jsonb_agg(jsonb_build_object(
           'path', f ->> 'path',
           'inferred_role', case
             when (f ->> 'path') ~* '\.(png|jpe?g|webp|svg)$' then 'LESSON_MEDIA_IMAGE'
             when (f ->> 'path') ~* '\.(mp3|wav|m4a)$'        then 'LESSON_MEDIA_AUDIO'
             when (f ->> 'path') ~* '\.(mp4|mov|webm)$'       then 'LESSON_MEDIA_VIDEO'
             when (f ->> 'path') ~* '\.(md|markdown|txt)$'    then 'LESSON_BODY'
             when (f ->> 'path') ~* '\.(csv|tsv|xlsx)$'       then 'ITEM_TABLE'
             else 'UNRECOGNISED' end))
    into v_map from jsonb_array_elements(v_files) f;
  v_map := coalesce(v_map, '[]'::jsonb);

  -- every unrecognised file, and every audio or video without a sibling
  -- transcript, is a question for a human rather than a guess
  select coalesce(jsonb_agg(q), '[]'::jsonb) into v_questions from (
    select jsonb_build_object('path', e ->> 'path', 'question',
             case when (e ->> 'inferred_role') = 'UNRECOGNISED'
                  then 'Berkas ini belum dikenali. Apa perannya dalam pelajaran?'
                  else 'Berkas audio/video memerlukan transkrip. Mana transkripnya?' end) q
      from jsonb_array_elements(v_map) e
     where (e ->> 'inferred_role') in ('UNRECOGNISED','LESSON_MEDIA_AUDIO','LESSON_MEDIA_VIDEO')) x;

  select case when jsonb_array_length(v_map) = 0 then 0
              else round((jsonb_array_length(v_map) - jsonb_array_length(v_questions))::numeric
                         / jsonb_array_length(v_map), 3) end into v_conf;

  update public.ingest_batches
     set inferred_mapping = v_map, mapping_confidence = v_conf, open_questions = v_questions,
         status = case when status = 'RECEIVED' then 'MAPPING_PROPOSED' else status end
   where id = p_batch;
  return jsonb_build_object('mapping', v_map, 'confidence', v_conf, 'open_questions', v_questions);
end $$;
revoke all on function public.propose_easy_upload_mapping(uuid) from public, anon, authenticated;
grant execute on function public.propose_easy_upload_mapping(uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['learning_assignments','assessment_assignments','ingest_batches'] loop
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format($f$create policy %1$s_select on public.%1$I for select to authenticated
      using (public.can_in_institution('CAN_DRAFT', institution_id)
          or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id))$f$, t);
    execute format($f$create policy %1$s_insert on public.%1$I for insert to authenticated
      with check (public.can_in_institution('CAN_DRAFT', institution_id)
               or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id))$f$, t);
    execute format($f$create policy %1$s_update on public.%1$I for update to authenticated
      using (public.can_in_institution('CAN_DRAFT', institution_id)
          or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id))
      with check (public.can_in_institution('CAN_DRAFT', institution_id)
               or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id))$f$, t);
  end loop;
  foreach t in array array['learning_assignment_status_transitions',
                           'assessment_assignment_status_transitions','ingest_status_transitions'] loop
    execute format('grant select on public.%I to authenticated', t);
    execute format($f$create policy %1$s_select on public.%1$I for select to authenticated
      using (public.current_person_id() is not null)$f$, t);
  end loop;
end $$;
grant select on public.learning_assignment_release_moves to authenticated;
create policy learning_assignment_release_moves_select on public.learning_assignment_release_moves
  for select to authenticated
  using (public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id));

insert into public.record_class_registry values
  ('learning_assignments',   'INSTITUTION_SCOPED', 'an assignment belongs to a class, not a learner'),
  ('assessment_assignments', 'INSTITUTION_SCOPED', 'an assignment belongs to a class, not a learner'),
  ('ingest_batches',         'INSTITUTION_SCOPED', 'imported content belongs to the institution'),
  ('learning_assignment_release_moves', 'INSTITUTION_SCOPED', 'an audited authoring act');

-- foreign keys the evidence schema deferred until these tables existed
alter table public.assessment_sessions
  add constraint assessment_sessions_learning_assignment_fkey
    foreign key (learning_assignment_id) references public.learning_assignments(id),
  add constraint assessment_sessions_assessment_assignment_fkey
    foreign key (assessment_assignment_id) references public.assessment_assignments(id);


-- ---------------------------------------------------------------------------
-- Repair, forward-only: 0025's evidence-reclassification guard called
-- audit_write(text, text, UUID, uuid, TEXT). The real signature is
-- (text, text, TEXT, uuid, JSONB). plpgsql resolves a call at run time, so the
-- migration applied cleanly and the mistake would have surfaced the first time
-- anyone actually reclassified a session -- the audit write would have failed
-- and taken the reclassification with it. Found while writing the release-move
-- audit here, which had the same shape. The body is otherwise 0025's.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_evidence_override() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_current public.evidence_class; v_actor uuid;
begin
  if tg_op <> 'INSERT' then
    raise exception 'an evidence reclassification is append-only: file another override';
  end if;
  select s.institution_id into v_inst from public.assessment_sessions s where s.id = new.session_id;
  if v_inst is null then raise exception 'unknown session %', new.session_id; end if;
  new.institution_id := v_inst;

  v_actor := public.current_person_id();
  if v_actor is null then
    raise exception 'reclassifying evidence is a human act and needs a known person';
  end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', v_inst) then
    raise exception 'reclassifying evidence requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;
  new.decided_by_person_id := v_actor;

  v_current := public.effective_evidence_class(new.session_id);
  new.from_class := v_current;

  if public.evidence_class_min(v_current, new.to_class) <> new.to_class then
    raise exception 'an override may only reduce eligibility: % -> % would promote it',
      v_current, new.to_class;
  end if;

  perform public.audit_write('EVIDENCE_RECLASSIFIED', 'assessment_sessions',
    new.session_id::text, v_inst,
    jsonb_build_object('from_class', v_current, 'to_class', new.to_class, 'reason', new.reason));
  return new;
end $$;
revoke all on function public.enforce_evidence_override() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text;
begin
  -- INV-27: nothing here writes to a session. Closing a window must never
  -- sweep the sessions that are running.
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind = 'f'
     and p.proname in ('enforce_assignment_status','move_learning_assignment_release',
                       'enforce_assignment_release_pin','enforce_ingest_batch',
                       'ingest_structured_package','propose_easy_upload_mapping')
     and pg_get_functiondef(p.oid) ~* '(update|delete\s+from|insert\s+into)\s+public\.assessment_sessions';
  if bad is not null then
    raise exception 'assignment/ingest function(s) write to sessions (INV-27): %', bad;
  end if;

  -- CLOSED is reachable and terminal; nothing leaves it
  select string_agg(from_status::text, ', ') into bad
    from public.assessment_assignment_status_transitions where from_status = 'CLOSED';
  if bad is not null then raise exception 'CLOSED has outgoing transitions: %', bad; end if;
  select count(*) into n from public.assessment_assignment_status_transitions
   where to_status = 'CLOSED';
  if n < 3 then raise exception 'CLOSED is reachable from only % state(s)', n; end if;

  -- INV-32: no provider-named object anywhere in the schema
  select string_agg(table_name || '.' || column_name, ', ') into bad
    from information_schema.columns
   where table_schema in ('public','telemetry')
     and (column_name ~* '(openai|anthropic|claude|gemini|gpt|llama|mistral|cohere|vertex|bedrock)');
  if bad is not null then raise exception 'a provider-named column exists (INV-32): %', bad; end if;
  select string_agg(table_name, ', ') into bad from information_schema.tables
   where table_schema in ('public','telemetry')
     and table_name ~* '(openai|anthropic|claude|gemini|gpt|llama|mistral|cohere|vertex|bedrock)';
  if bad is not null then raise exception 'a provider-named table exists (INV-32): %', bad; end if;
  select string_agg(t.typname, ', ') into bad from pg_type t
    join pg_namespace ns on ns.oid = t.typnamespace
   where ns.nspname in ('public','telemetry') and t.typtype = 'e'
     and t.typname ~* '(openai|anthropic|claude|gemini|gpt|llama|mistral|cohere|vertex|bedrock)';
  if bad is not null then raise exception 'a provider-named enum exists (INV-32): %', bad; end if;

  -- the raw payload is provenance and cannot be rewritten
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='enforce_ingest_batch';
  if def not like '%raw_payload is distinct from old.raw_payload%' then
    raise exception 'the raw import payload can be rewritten';
  end if;
  if def not like '%nothing is materialised from an unconfirmed mapping%' then
    raise exception 'an unconfirmed mapping can be materialised';
  end if;

  -- a release move records before it moves
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='move_learning_assignment_release';
  if position('insert into public.learning_assignment_release_moves' in def)
     > position('update public.learning_assignments set plp_release_id' in def) then
    raise exception 'the release move changes the assignment before recording it';
  end if;
  if def not like '%audit_write%' then raise exception 'a release move is not audited'; end if;

  -- No source-pattern assertion for audit_write argument types: two FABLE-01
  -- callers legitimately pass an already-text id, so a textual check produces
  -- false positives, and the real question -- does the call type-check -- is
  -- only answerable by walking the path. F02-T20 performs a release move and
  -- F02-T17 performs a reclassification, so both audit writes are exercised
  -- rather than inspected. That is how 0025's mismatch was found.

  -- the deferred provenance foreign keys are in place
  select string_agg(conname, ', ') into bad from pg_constraint
   where conrelid = 'public.assessment_sessions'::regclass and contype = 'f'
     and conname in ('assessment_sessions_learning_assignment_fkey',
                     'assessment_sessions_assessment_assignment_fkey');
  if bad is null or array_length(string_to_array(bad, ', '), 1) <> 2 then
    raise exception 'the assignment provenance foreign keys are missing';
  end if;

  -- standing hygiene
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon' and table_name <> 'published_lessons';
  if n > 0 then raise exception 'anon holds % grant(s) beyond the published view', n; end if;
  select count(*) into n from pg_tables where schemaname in ('public','telemetry') and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select count(*) into n from pg_policies
   where schemaname in ('public','telemetry') and (qual='true' or with_check='true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;

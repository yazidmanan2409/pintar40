-- ---------------------------------------------------------------------------
-- WP5A, PART TWO. AN IMPORT THAT SURVIVES THE POWER GOING OUT.
--
-- A school provisions a thousand people. The administrator's laptop closes,
-- the network drops, the building loses power. What PINTAR must NOT do is
-- forget, half-finish, or ask them to upload the spreadsheet again and guess.
--
-- SO THE JOB IS DATABASE STATE, NOT BROWSER STATE. The browser observes; it
-- never owns. Every row of the import has its own durable state, and the
-- answer to "how far did we get" is counted from rows that actually committed
-- -- never from requests sent, rows parsed, or loop iterations.
--
-- THERE IS NO BACKGROUND WORKER IN PINTAR, and this does not pretend there is.
-- Rather than invent a queue platform, `import_advance` is a RESUMABLE
-- SERVER-DRIVEN STEP: each call provisions a bounded chunk of still-pending
-- rows and commits it. A later call -- from the same browser, a different
-- browser, or a cron a year from now -- continues from durable state with no
-- memory of what came before. The limitation is real and is stated here
-- rather than papered over: progress happens while somebody is calling, but
-- NOTHING IS LOST when nobody is.
--
-- WHOLE-FILE ATOMICITY IS DELIBERATELY NOT USED. It cannot coexist with
-- interruption recovery or with a pilot checkpoint: a thousand-row transaction
-- that dies at row 900 leaves nothing, which is the opposite of resumable.
-- The atomic unit is ONE ROW. A row provisions completely or not at all, and a
-- row that fails does not take its neighbours with it.
--
-- THE PILOT IS HUMAN ERROR CONTAINMENT, NOT A PERFORMANCE TACTIC. Above 100
-- rows the first 50 are provisioned for real and then everything stops until a
-- person looks at them and says they are right. PINTAR will not continue
-- because 50 rows succeeded technically -- succeeding technically is exactly
-- what a thousand wrong rows also do. Fifty is a product number. The chunk
-- size is an engineering number. They are not the same number and nothing
-- here conflates them.
-- ---------------------------------------------------------------------------

create type public.import_job_state as enum (
  'DRAFT',                        -- rows are being assembled; nothing is promised
  'AWAITING_CONFIRMATION',        -- validated clean; waiting for a human to say go
  'PILOT_IMPORTING',              -- >100: provisioning the first 50 and nothing else
  'AWAITING_PILOT_VERIFICATION',  -- the 50 are real and committed; a human must look
  'REMAINDER_IMPORTING',          -- verified; the rest may go
  'IMPORTING',                    -- <=100: no pilot checkpoint applies
  'COMPLETED',
  'FAILED'
);
comment on type public.import_job_state is
  'WP5A. There is no separate VALIDATED state: validation is what MOVES a job to '
  'AWAITING_CONFIRMATION, and a distinct VALIDATED row would be indistinguishable from it in durable '
  'state. A state nobody can tell apart is a state nobody maintains.';

create type public.import_row_state as enum ('PENDING', 'PROVISIONED', 'FAILED');

-- THE PILOT SIZE AND THE THRESHOLD ARE PRODUCT NUMBERS, so they are written
-- once, here, where a test can read them -- not spelled into four functions.
create function public.import_pilot_threshold() returns integer
language sql immutable parallel safe set search_path = public, pg_temp as $$ select 100 $$;
create function public.import_pilot_size() returns integer
language sql immutable parallel safe set search_path = public, pg_temp as $$ select 50 $$;
comment on function public.import_pilot_threshold() is
  'Above this many rows, an import must stop after a real pilot batch and wait for a human. A product '
  'number, not a performance tuning knob.';
comment on function public.import_pilot_size() is
  'How many rows that pilot batch contains. A product number: the administrator is verifying a result, '
  'not acknowledging a warning.';
revoke all on function public.import_pilot_threshold() from public, anon, authenticated;
revoke all on function public.import_pilot_size() from public, anon, authenticated;
grant execute on function public.import_pilot_threshold() to authenticated;
grant execute on function public.import_pilot_size() to authenticated;

create table public.import_jobs (
  id               uuid primary key default gen_random_uuid(),
  institution_id   uuid not null references public.institutions(id),
  created_by_person_id uuid not null references public.persons(id),
  state            public.import_job_state not null default 'DRAFT',
  row_count        integer not null default 0 check (row_count >= 0),
  created_at       timestamptz not null default now(),
  confirmed_by_person_id uuid references public.persons(id),
  confirmed_at     timestamptz,
  -- §22: WHO looked at the pilot and WHEN. Persisted, because "somebody
  -- clicked" is not evidence a month later.
  pilot_verified_by_person_id uuid references public.persons(id),
  pilot_verified_at timestamptz,
  completed_at     timestamptz,
  failure_reason   text,
  constraint import_jobs_confirmation_is_paired
    check ((confirmed_by_person_id is null) = (confirmed_at is null)),
  constraint import_jobs_pilot_verification_is_paired
    check ((pilot_verified_by_person_id is null) = (pilot_verified_at is null)),
  -- nothing provisions before a human confirms
  constraint import_jobs_importing_was_confirmed
    check (state in ('DRAFT', 'AWAITING_CONFIRMATION') or confirmed_at is not null),
  -- and nothing past the pilot moves before a human verifies
  constraint import_jobs_remainder_was_verified
    check (state <> 'REMAINDER_IMPORTING' or pilot_verified_at is not null),
  constraint import_jobs_completed_has_a_moment
    check ((state = 'COMPLETED') = (completed_at is not null))
);

create table public.import_rows (
  job_id           uuid not null references public.import_jobs(id) on delete cascade,
  -- ORDINAL IS THE ROW'S DURABLE IDENTITY. It is what makes the pilot "the
  -- first 50" rather than "50 of them", what makes a resume deterministic,
  -- and what makes a retry idempotent without the browser remembering
  -- anything.
  ordinal          integer not null check (ordinal >= 1),
  payload          jsonb not null,
  state            public.import_row_state not null default 'PENDING',
  person_id        uuid references public.persons(id),
  institutional_id text,
  provisioned_at   timestamptz,
  failure_reason   text,
  primary key (job_id, ordinal),
  -- §6/§29: A ROW IS COMPLETE ONLY IF IT REALLY IS. The outcome columns and
  -- the state move together, so a progress count taken from `state` cannot
  -- disagree with what was actually written.
  constraint import_rows_provisioned_is_whole
    check ((state = 'PROVISIONED') = (person_id is not null and institutional_id is not null
                                      and provisioned_at is not null)),
  constraint import_rows_failed_says_why
    check ((state = 'FAILED') = (failure_reason is not null))
);

create index import_rows_pending_idx on public.import_rows (job_id, ordinal)
  where state = 'PENDING';
create index import_jobs_institution_idx on public.import_jobs (institution_id, created_at desc);

alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
grant select on public.import_jobs to authenticated;
grant select on public.import_rows to authenticated;

-- READS ARE THIS SCHOOL'S ONLY. Another school's administrator holds the
-- capability over their OWN root and gets nothing here.
create policy import_jobs_select on public.import_jobs for select to authenticated
  using (public.can_on_node('CAN_PROVISION_PEOPLE', institution_id));
create policy import_rows_select on public.import_rows for select to authenticated
  using (exists (select 1 from public.import_jobs j
                  where j.id = job_id
                    and public.can_on_node('CAN_PROVISION_PEOPLE', j.institution_id)));

insert into public.record_class_registry values
  ('import_jobs', 'INSTITUTION_SCOPED', 'one school''s provisioning run'),
  ('import_rows', 'INSTITUTION_SCOPED', 'the durable state of one row of one school''s provisioning run');

-- ────────────────────────────────── the caller's own school, or nothing
create function public.import_job_for_admin(p_job uuid) returns public.import_jobs
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare j public.import_jobs;
begin
  select * into j from public.import_jobs where id = p_job;
  -- ONE SENTENCE FOR BOTH REFUSALS, so a job id that belongs to another school
  -- and a job id that is nobody's are indistinguishable from outside.
  if j.id is null or not public.can_on_node('CAN_PROVISION_PEOPLE', j.institution_id) then
    raise exception 'no such import job for this school';
  end if;
  return j;
end $$;
revoke all on function public.import_job_for_admin(uuid) from public, anon, authenticated;

-- ─────────────────────────────────────── 1. open a job and put rows in it
create function public.import_open(p_institution uuid, p_rows jsonb)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_job uuid; v_n int;
begin
  v_me := public.current_person_id();
  if v_me is null or p_institution is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'opening an import takes an institution and an array of normalized rows';
  end if;
  if not public.can_on_node('CAN_PROVISION_PEOPLE', p_institution) then
    raise exception 'bulk provisioning is for an institution administrator of this school';
  end if;

  insert into public.import_jobs (institution_id, created_by_person_id) values (p_institution, v_me)
  returning import_jobs.id into v_job;

  insert into public.import_rows (job_id, ordinal, payload)
  select v_job, r.ord, r.val from jsonb_array_elements(p_rows) with ordinality as r(val, ord);
  get diagnostics v_n = row_count;

  update public.import_jobs set row_count = v_n where import_jobs.id = v_job;
  -- NOTHING IS PROVISIONED BY UPLOADING. The job is DRAFT and every row is
  -- PENDING; no person, identity, membership or role exists yet.
  return v_job;
end $$;
comment on function public.import_open(uuid, jsonb) is
  'Opens a DRAFT import job holding normalized rows. Provisions nothing: a file that has been uploaded '
  'and mapped is not a decision.';
revoke all on function public.import_open(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.import_open(uuid, jsonb) to authenticated;

-- ────────────────────────── 2. validate, which touches nothing durable
-- The row checker is its own function so the preview and the authoritative
-- re-check at provisioning time cannot drift into two different opinions.
create function public.import_row_problems(p_institution uuid, p_payload jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_bad jsonb := '[]'::jsonb; v_name text; v_node uuid; v_role text; v_person uuid;
begin
  v_name := btrim(coalesce(p_payload ->> 'display_name', ''));
  begin v_node := nullif(p_payload ->> 'node_id', '')::uuid;
  exception when others then v_bad := v_bad || to_jsonb('node_id is not a uuid'::text); end;
  begin v_person := nullif(p_payload ->> 'person_id', '')::uuid;
  exception when others then v_bad := v_bad || to_jsonb('person_id is not a uuid'::text); end;
  v_role := nullif(p_payload ->> 'role', '');

  if v_name = '' or length(v_name) > 200 then
    v_bad := v_bad || to_jsonb('display_name is missing or too long'::text);
  end if;

  -- An existing person may be named only if this caller can already see them;
  -- otherwise a uuid probe becomes an existence oracle. NO MATCHING IS DONE:
  -- PINTAR never decides on its own that two people at two schools are one
  -- person, and this is the line where that temptation would live.
  if v_person is not null then
    if not exists (select 1 from public.persons p where p.id = v_person)
       or not public.person_visible_to_me(v_person) then
      v_bad := v_bad || to_jsonb('person_id is not a person you may name'::text);
    elsif exists (select 1 from public.institutional_identities ii
                   where ii.person_id = v_person and ii.institution_id = p_institution) then
      v_bad := v_bad || to_jsonb('this person already holds an institutional identity here'::text);
    end if;
  end if;

  if v_node is not null then
    if not exists (select 1 from public.org_nodes n
                    where n.id = v_node and n.institution_id = p_institution) then
      v_bad := v_bad || to_jsonb('node_id is not an organizational node of this institution'::text);
    elsif not public.can_on_node('CAN_PROVISION_PEOPLE', v_node) then
      v_bad := v_bad || to_jsonb('node_id is outside your provisioning scope'::text);
    end if;
  end if;

  if v_role is not null then
    if not exists (select 1 from unnest(enum_range(null::public.app_role)) e where e::text = v_role) then
      v_bad := v_bad || to_jsonb('role is not a role this platform has'::text);
    elsif v_role in ('SYSTEM_ADMIN', 'INSTITUTION_ADMIN') then
      v_bad := v_bad || to_jsonb('this role is not granted by bulk provisioning'::text);
    elsif v_node is null then
      v_bad := v_bad || to_jsonb('a role needs an organizational node to be scoped to'::text);
    end if;
  end if;
  return v_bad;
end $$;
revoke all on function public.import_row_problems(uuid, jsonb) from public, anon, authenticated;

create function public.import_validate(p_job uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.import_jobs; v_findings jsonb := '[]'::jsonb; r record; v_bad jsonb; v_dupes jsonb;
begin
  j := public.import_job_for_admin(p_job);
  if j.state not in ('DRAFT', 'AWAITING_CONFIRMATION') then
    raise exception 'this import has already been confirmed and cannot be validated again';
  end if;

  -- duplicates WITHIN the file, by the same key the provisioning step uses
  select coalesce(jsonb_object_agg(k, true), '{}'::jsonb) into v_dupes from (
    select lower(btrim(coalesce(ir.payload ->> 'display_name', ''))) || '|'
           || coalesce(ir.payload ->> 'person_id', '') as k
      from public.import_rows ir where ir.job_id = p_job
     group by 1 having count(*) > 1) d;

  for r in select ir.ordinal, ir.payload from public.import_rows ir
            where ir.job_id = p_job order by ir.ordinal loop
    v_bad := public.import_row_problems(j.institution_id, r.payload);
    if v_dupes ? (lower(btrim(coalesce(r.payload ->> 'display_name', ''))) || '|'
                  || coalesce(r.payload ->> 'person_id', '')) then
      v_bad := v_bad || to_jsonb('duplicate row within this import'::text);
    end if;
    v_findings := v_findings || jsonb_build_object(
      'ordinal', r.ordinal, 'ok', jsonb_array_length(v_bad) = 0, 'problems', v_bad);
  end loop;

  -- VALIDATION MOVES THE JOB AND NOTHING ELSE. No person, no identity, no
  -- membership, no role: the only durable change is that a human may now be
  -- asked to confirm.
  if not exists (select 1 from jsonb_array_elements(v_findings) f where (f ->> 'ok')::boolean is false) then
    update public.import_jobs set state = 'AWAITING_CONFIRMATION' where import_jobs.id = p_job;
  end if;

  return jsonb_build_object('job_id', p_job, 'row_count', j.row_count,
    'ok', not exists (select 1 from jsonb_array_elements(v_findings) f where (f ->> 'ok')::boolean is false),
    'pilot_required', j.row_count > public.import_pilot_threshold(),
    'pilot_size', public.import_pilot_size(),
    'rows', v_findings);
end $$;
comment on function public.import_validate(uuid) is
  'Validates every row of a DRAFT import and, when clean, moves it to AWAITING_CONFIRMATION. Provisions '
  'nothing. The row checker it uses is the same one the provisioning step re-runs, so a preview and the '
  'authoritative check cannot hold two different opinions.';
revoke all on function public.import_validate(uuid) from public, anon, authenticated;
grant execute on function public.import_validate(uuid) to authenticated;

-- ───────────────────────────── 3. the preview a human decides on
create function public.import_preview(p_job uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare j public.import_jobs; v_new int; v_linked int; v_roles jsonb;
begin
  j := public.import_job_for_admin(p_job);
  select count(*) filter (where ir.payload ->> 'person_id' is null),
         count(*) filter (where ir.payload ->> 'person_id' is not null)
    into v_new, v_linked
    from public.import_rows ir where ir.job_id = p_job;
  select coalesce(jsonb_object_agg(k, c), '{}'::jsonb) into v_roles from (
    select coalesce(ir.payload ->> 'role', 'STUDENT') as k, count(*) as c
      from public.import_rows ir where ir.job_id = p_job group by 1) x;

  return jsonb_build_object(
    'job_id', p_job, 'state', j.state, 'row_count', j.row_count,
    'new_persons', v_new, 'existing_persons_linked', v_linked,
    'institutional_ids_to_assign', j.row_count,
    -- SAID OUT LOUD, because it is the thing an administrator is most likely
    -- to assume wrongly about a screen that says "provision 1,000 people".
    'accounts_activated', 0,
    'by_role', v_roles,
    'pilot_required', j.row_count > public.import_pilot_threshold(),
    'pilot_size', public.import_pilot_size());
end $$;
comment on function public.import_preview(uuid) is
  'What this import intends to do, for the screen a human confirms on. STABLE, so the database refuses '
  'to let it write: a preview that could provision is one nobody can trust.';
revoke all on function public.import_preview(uuid) from public, anon, authenticated;
grant execute on function public.import_preview(uuid) to authenticated;

-- ───────────────────────────────── 4. the human says go
create function public.import_confirm(p_job uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.import_jobs; v_me uuid; v_bad int := 0; r record; v_next public.import_job_state;
begin
  j := public.import_job_for_admin(p_job);
  v_me := public.current_person_id();

  -- §26. DOUBLE-CLICK IS ONE CONFIRMATION. Answered first, so a second click
  -- neither re-confirms nor errors.
  if j.state <> 'AWAITING_CONFIRMATION' then
    if j.confirmed_at is not null then
      return jsonb_build_object('job_id', p_job, 'state', j.state, 'already_confirmed', true);
    end if;
    raise exception 'this import has not been validated, so there is nothing to confirm';
  end if;

  -- §20. REVALIDATE ON THE WORLD AS IT IS NOW. A preview taken ten minutes
  -- ago is not authority: a node may have moved, a grant may have been
  -- revoked, somebody else may have provisioned the same person.
  for r in select ir.ordinal, ir.payload from public.import_rows ir
            where ir.job_id = p_job and ir.state = 'PENDING' loop
    if jsonb_array_length(public.import_row_problems(j.institution_id, r.payload)) > 0 then
      v_bad := v_bad + 1;
    end if;
  end loop;
  if v_bad > 0 then
    raise exception '% row(s) no longer pass validation, whatever an earlier preview said', v_bad;
  end if;

  v_next := case when j.row_count > public.import_pilot_threshold()
                 then 'PILOT_IMPORTING'::public.import_job_state
                 else 'IMPORTING'::public.import_job_state end;
  update public.import_jobs
     set state = v_next, confirmed_by_person_id = v_me, confirmed_at = now()
   where import_jobs.id = p_job;

  perform public.audit_write('import.confirmed', 'import_jobs', p_job::text, j.institution_id,
    jsonb_build_object('row_count', j.row_count,
                       'pilot_required', j.row_count > public.import_pilot_threshold()));
  return jsonb_build_object('job_id', p_job, 'state', v_next, 'row_count', j.row_count,
    'pilot_required', j.row_count > public.import_pilot_threshold());
end $$;
comment on function public.import_confirm(uuid) is
  'The human authorization to begin. Revalidates authoritatively rather than trusting a preview, and a '
  'second confirmation is a no-op rather than a second import.';
revoke all on function public.import_confirm(uuid) from public, anon, authenticated;
grant execute on function public.import_confirm(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
 ('import_open', 'STAFF',
  'Opens a DRAFT bulk-provisioning job from normalized rows. Provisions nothing.',
  'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
 ('import_validate', 'STAFF',
  'Validates every row and, when clean, moves the job to AWAITING_CONFIRMATION. Provisions nothing.',
  'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
 ('import_preview', 'STAFF',
  'What the import intends to do, for the confirmation screen. Writes nothing.',
  'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
 ('import_confirm', 'STAFF',
  'The human authorization to begin provisioning, revalidated on the world as it is now. Audited as '
  'import.confirmed.',
  'CAPABILITY', 'CAN_PROVISION_PEOPLE')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ────────────────────── 5. the resumable step that actually provisions
-- ONE CALL IS ONE COMMIT BOUNDARY. A Postgres function runs inside the
-- caller's transaction, so when this returns and the caller commits, every
-- row it marked PROVISIONED really is. A later call sees only what is still
-- PENDING and cannot redo what is done -- which is what makes a retry after
-- an uncertain network response safe, and what makes a power cut cost
-- nothing but the chunk that was in flight.
create function public.import_advance(p_job uuid, p_max_rows integer default 25)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  j public.import_jobs; r record; v_limit int; v_done int := 0; v_failed int := 0;
  v_ceiling int; v_person uuid; v_id text; v_bad jsonb; v_period uuid; v_enr uuid;
  v_name text; v_node uuid; v_role text; v_pending int; v_pilot int;
begin
  j := public.import_job_for_admin(p_job);
  if j.state not in ('PILOT_IMPORTING', 'REMAINDER_IMPORTING', 'IMPORTING') then
    -- §36R. Nothing provisions from a job nobody confirmed, and nothing
    -- provisions past the pilot from a job nobody verified.
    raise exception 'this import is % and is not provisioning', j.state;
  end if;
  v_limit := greatest(1, least(coalesce(p_max_rows, 25), 200));

  -- §22. THE PILOT CEILING. While the pilot is running, ordinals above 50 do
  -- not exist as far as this function is concerned. It is a ceiling on WHICH
  -- rows may be touched, not a count of how many -- so an interrupted pilot
  -- resumes into the pilot and never leaks into the remainder.
  v_ceiling := case when j.state = 'PILOT_IMPORTING' then public.import_pilot_size()
                    else j.row_count end;

  for r in select ir.ordinal, ir.payload from public.import_rows ir
            where ir.job_id = p_job and ir.state = 'PENDING' and ir.ordinal <= v_ceiling
            order by ir.ordinal
            limit v_limit
            for update loop
    -- §21/§29. THE ATOMIC UNIT IS ONE ROW. A row provisions completely or not
    -- at all, and a row that fails does not take its neighbours with it.
    begin
      v_bad := public.import_row_problems(j.institution_id, r.payload);
      if jsonb_array_length(v_bad) > 0 then
        raise exception '%', v_bad ->> 0;
      end if;

      v_name := btrim(r.payload ->> 'display_name');
      v_node := nullif(r.payload ->> 'node_id', '')::uuid;
      v_role := nullif(r.payload ->> 'role', '');
      v_person := nullif(r.payload ->> 'person_id', '')::uuid;

      -- §30. A PERSON, AND NO ACCOUNT. Nothing here reaches an
      -- authentication table: the person exists institutionally and has
      -- activated nothing.
      if v_person is null then
        insert into public.persons (display_name) values (v_name) returning persons.id into v_person;
      end if;

      -- idempotent by construction: a person who already holds an identity
      -- here gets that one back rather than a second number
      v_id := public.issue_institutional_id(v_person, j.institution_id);

      if v_node is not null then
        select ap.id into v_period from public.academic_periods ap
         where ap.institution_id = j.institution_id order by ap.created_at desc limit 1;
        if v_period is not null then
          insert into public.enrollments
            (person_id, institution_id, academic_period_id, programme_id, status)
          values (v_person, j.institution_id, v_period,
                  nullif(r.payload ->> 'programme_id', '')::uuid, 'PENDING')
          returning enrollments.id into v_enr;
          insert into public.memberships (enrollment_id, node_id, academic_period_id)
          values (v_enr, v_node, v_period);
        end if;
      end if;

      if v_role is not null then
        insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
        values (v_person, v_role::public.app_role, v_node, now() + interval '1 year');
      end if;

      -- §6. THE COUNTER MOVES WITH THE WORK, NOT BEFORE IT. This row's state
      -- and its outcome columns are written together, inside the same
      -- subtransaction that did the work, and the CHECK on the table refuses
      -- to let them come apart.
      update public.import_rows
         set state = 'PROVISIONED', person_id = v_person, institutional_id = v_id,
             provisioned_at = now(), failure_reason = null
       where import_rows.job_id = p_job and import_rows.ordinal = r.ordinal;
      v_done := v_done + 1;
    exception when others then
      update public.import_rows
         set state = 'FAILED', failure_reason = left(sqlerrm, 300)
       where import_rows.job_id = p_job and import_rows.ordinal = r.ordinal;
      v_failed := v_failed + 1;
    end;
  end loop;

  -- WHERE THE JOB STANDS NOW, counted from rows rather than from a tally
  -- somebody incremented.
  select count(*) filter (where ir.state = 'PENDING' and ir.ordinal <= v_ceiling)
    into v_pending from public.import_rows ir where ir.job_id = p_job;

  if j.state = 'PILOT_IMPORTING' and v_pending = 0 then
    select count(*) filter (where ir.state = 'PROVISIONED') into v_pilot
      from public.import_rows ir
     where ir.job_id = p_job and ir.ordinal <= public.import_pilot_size();
    if v_pilot = public.import_pilot_size() then
      -- §22. STOP. The remaining rows are untouched and stay that way until a
      -- person says the 50 are right. Succeeding technically is exactly what
      -- a thousand wrong rows also do.
      update public.import_jobs set state = 'AWAITING_PILOT_VERIFICATION' where import_jobs.id = p_job;
      perform public.audit_write('import.pilot_completed', 'import_jobs', p_job::text, j.institution_id,
        jsonb_build_object('pilot_size', public.import_pilot_size(), 'row_count', j.row_count));
    else
      update public.import_jobs set state = 'FAILED',
             failure_reason = format('%s of the %s pilot rows could not be provisioned',
                                     public.import_pilot_size() - v_pilot, public.import_pilot_size())
       where import_jobs.id = p_job;
    end if;
  elsif j.state in ('IMPORTING', 'REMAINDER_IMPORTING') and v_pending = 0 then
    -- §29. NOT COMPLETED WHILE ANYTHING IS UNFINISHED.
    if exists (select 1 from public.import_rows ir where ir.job_id = p_job and ir.state = 'FAILED') then
      update public.import_jobs set state = 'FAILED',
             failure_reason = 'some rows could not be provisioned and need attention'
       where import_jobs.id = p_job;
    else
      update public.import_jobs set state = 'COMPLETED', completed_at = now()
       where import_jobs.id = p_job and import_jobs.state <> 'COMPLETED';
      perform public.audit_write('import.completed', 'import_jobs', p_job::text, j.institution_id,
        jsonb_build_object('row_count', j.row_count));
    end if;
  end if;

  return public.import_progress(p_job) || jsonb_build_object('provisioned_now', v_done,
                                                             'failed_now', v_failed);
end $$;
comment on function public.import_advance(uuid, integer) is
  'Provisions a bounded chunk of still-pending rows and returns the job''s durable progress. One call is '
  'one commit boundary; a later call continues from database state with no memory of the earlier one, '
  'which is what makes a power cut cost only the chunk in flight. Refuses to run unless a human has '
  'confirmed, and refuses to pass row 50 unless a human has verified the pilot.';
revoke all on function public.import_advance(uuid, integer) from public, anon, authenticated;
grant execute on function public.import_advance(uuid, integer) to authenticated;

-- ────────────────────── 6. the human looks at the fifty and says yes
create function public.import_verify_pilot(p_job uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare j public.import_jobs; v_me uuid;
begin
  j := public.import_job_for_admin(p_job);
  v_me := public.current_person_id();

  -- §36X. VERIFYING TWICE IS VERIFYING ONCE. Answered first, so a double
  -- click does not release anything a second time.
  if j.pilot_verified_at is not null then
    return jsonb_build_object('job_id', p_job, 'state', j.state, 'already_verified', true,
                              'pilot_verified_at', j.pilot_verified_at);
  end if;
  if j.state <> 'AWAITING_PILOT_VERIFICATION' then
    raise exception 'this import is not waiting for pilot verification';
  end if;

  update public.import_jobs
     set pilot_verified_by_person_id = v_me, pilot_verified_at = now(), state = 'REMAINDER_IMPORTING'
   where import_jobs.id = p_job;

  perform public.audit_write('import.pilot_verified', 'import_jobs', p_job::text, j.institution_id,
    jsonb_build_object('pilot_size', public.import_pilot_size(),
                       'remaining', j.row_count - public.import_pilot_size()));
  return jsonb_build_object('job_id', p_job, 'state', 'REMAINDER_IMPORTING',
                            'released', j.row_count - public.import_pilot_size());
end $$;
comment on function public.import_verify_pilot(uuid) is
  'An authorized human states that the committed pilot batch is correct, which is what releases the rest. '
  'Records who and when, because "somebody clicked" is not evidence a month later. Never happens on a '
  'timeout.';
revoke all on function public.import_verify_pilot(uuid) from public, anon, authenticated;
grant execute on function public.import_verify_pilot(uuid) to authenticated;

-- ────────────────────────────── 7. progress, counted from what committed
create function public.import_progress(p_job uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare j public.import_jobs; v_done int; v_failed int; v_pending int; v_pilot_done int;
begin
  j := public.import_job_for_admin(p_job);
  select count(*) filter (where ir.state = 'PROVISIONED'),
         count(*) filter (where ir.state = 'FAILED'),
         count(*) filter (where ir.state = 'PENDING')
    into v_done, v_failed, v_pending
    from public.import_rows ir where ir.job_id = p_job;
  select count(*) filter (where ir.state = 'PROVISIONED') into v_pilot_done
    from public.import_rows ir
   where ir.job_id = p_job and ir.ordinal <= public.import_pilot_size();

  -- EVERY NUMBER HERE IS COUNTED FROM ROWS THAT COMMITTED. Nothing counts a
  -- request sent, a row parsed, an attempt made or a transaction that later
  -- rolled back -- a rolled-back row never reached PROVISIONED, so it cannot
  -- be counted by a query that only counts PROVISIONED.
  return jsonb_build_object(
    'job_id', p_job, 'institution_id', j.institution_id, 'state', j.state,
    'total', j.row_count, 'completed', v_done, 'remaining', v_pending, 'failed', v_failed,
    'pilot_required', j.row_count > public.import_pilot_threshold(),
    'pilot_size', public.import_pilot_size(),
    'pilot_completed', v_pilot_done,
    'pilot_verified', j.pilot_verified_at is not null,
    'pilot_verified_at', j.pilot_verified_at,
    'confirmed_at', j.confirmed_at,
    'completed_at', j.completed_at,
    'failure_reason', j.failure_reason);
end $$;
comment on function public.import_progress(uuid) is
  'The authoritative read model behind whatever WP5B draws. Every number is counted from rows that '
  'actually committed, so displayed progress and durable progress are the same thing.';
revoke all on function public.import_progress(uuid) from public, anon, authenticated;
grant execute on function public.import_progress(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
 ('import_advance', 'STAFF',
  'Provisions a bounded chunk of pending rows and returns durable progress. Resumable: a later call '
  'continues from database state. Audited at pilot completion and at job completion.',
  'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
 ('import_verify_pilot', 'STAFF',
  'Records an authorized human''s verification of the committed pilot batch, which releases the '
  'remainder. Audited as import.pilot_verified.',
  'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
 ('import_progress', 'STAFF',
  'Durable progress for one import job, counted from committed rows. Writes nothing.',
  'CAPABILITY', 'CAN_PROVISION_PEOPLE')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014). STRUCTURAL HERE, BEHAVIOURAL IN F06-P17/P18.
--
-- Every act this migration governs needs an authenticated administrator --
-- `can_on_node` answers false for the owner running a migration -- so the
-- lifecycle is measured where actors exist. What is decidable here is the
-- shape: that the withholding promises are constraints rather than habits,
-- that the read paths cannot write, and that nothing in the provisioning path
-- reaches an authentication table.
-- ---------------------------------------------------------------------------
do $$
declare v_vol char; v_body text; v_n int; v_bad text;
begin
  -- THE READ PATHS CANNOT WRITE, and it is the database that says so rather
  -- than the author. A preview that could provision is one nobody can trust.
  foreach v_bad in array array['public.import_preview(uuid)', 'public.import_progress(uuid)'] loop
    select p.provolatile into v_vol from pg_proc p where p.oid = v_bad::regprocedure;
    if v_vol <> 's' then
      raise exception '% is not STABLE, so nothing stops it writing (volatility %)', v_bad, v_vol;
    end if;
  end loop;

  -- NOTHING IN THE PROVISIONING PATH REACHES AN AUTHENTICATION TABLE.
  --
  -- COMMENTS ARE STRIPPED FIRST, and that is not a detail. Written naively
  -- this check fails on its own prose -- the function says in a comment that
  -- it reaches no authentication table, and a text sweep cannot tell a
  -- promise from a reference. That is the defeat WP1 recorded as E-1,
  -- arriving here by accident. What is swept is the CODE.
  select string_agg(l, E'\n') into v_body from (
    select regexp_replace(l, '--.*$', '') as l
      from unnest(string_to_array(
             pg_get_functiondef('public.import_advance(uuid,integer)'::regprocedure), E'\n')) as l) x;
  if v_body like '%auth.users%' or v_body like '%public.accounts%' then
    raise exception 'bulk provisioning reaches an authentication table; provisioned would mean active';
  end if;
  -- and it does still refuse to run on a job nobody confirmed
  if v_body not like '%is not provisioning%' then
    raise exception 'import_advance no longer refuses a job that is not in a provisioning state';
  end if;

  -- THE PRODUCT NUMBERS ARE THE RULED ONES, in one place.
  if public.import_pilot_threshold() <> 100 or public.import_pilot_size() <> 50 then
    raise exception 'the pilot rule is % over %, not 50 over 100',
      public.import_pilot_size(), public.import_pilot_threshold();
  end if;

  -- THE WITHHOLDING PROMISES ARE CONSTRAINTS, not conventions a later edit
  -- could drop: nothing provisions unconfirmed, nothing past the pilot moves
  -- unverified, and a row cannot claim to be done with no work behind it.
  foreach v_bad in array array['import_jobs_importing_was_confirmed',
                               'import_jobs_remainder_was_verified',
                               'import_jobs_completed_has_a_moment',
                               'import_rows_provisioned_is_whole',
                               'import_rows_failed_says_why'] loop
    if not exists (select 1 from pg_constraint c where c.conname = v_bad and c.contype = 'c') then
      raise exception 'the check constraint % is gone, so its promise is only a habit', v_bad;
    end if;
  end loop;

  -- READS ARE SCOPED AND THERE IS NO CLIENT WRITE PATH AT ALL.
  foreach v_bad in array array['import_jobs', 'import_rows', 'institutional_identities'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || v_bad)::regclass) then
      raise exception 'RLS is not enabled on %', v_bad;
    end if;
    if exists (select 1 from pg_policy p
                where p.polrelid = ('public.' || v_bad)::regclass and p.polcmd <> 'r') then
      raise exception '% carries a client write policy', v_bad;
    end if;
    select string_agg(g.privilege_type, ', ') into v_body from information_schema.role_table_grants g
     where g.table_schema = 'public' and g.table_name = v_bad
       and g.grantee in ('anon', 'authenticated') and g.privilege_type <> 'SELECT';
    if v_body is not null then
      raise exception 'a client role may write % directly: %', v_bad, v_body;
    end if;
  end loop;

  -- AND THE PILOT CEILING IS READ FROM THE RULED NUMBER rather than spelled
  -- into the advance path as a literal somebody could edit past.
  select string_agg(l, E'\n') into v_body from (
    select regexp_replace(l, '--.*$', '') as l
      from unnest(string_to_array(
             pg_get_functiondef('public.import_advance(uuid,integer)'::regprocedure), E'\n')) as l) x;
  if v_body not like '%import_pilot_size()%' then
    raise exception 'the pilot ceiling is not taken from import_pilot_size()';
  end if;

  raise notice '0100 verified: the preview and the progress read model are STABLE so the database refuses '
    'to let them write; the provisioning path reaches no authentication table, with comments stripped '
    'before the sweep because otherwise it fails on its own promise; the pilot rule is 50 over 100 and '
    'the advance path reads that number rather than repeating it; nothing provisions unconfirmed and '
    'nothing past the pilot moves unverified, both as CHECK constraints; a row cannot claim PROVISIONED '
    'with no work behind it; and no client role may write a job, a row or an identity at all';
end $$;

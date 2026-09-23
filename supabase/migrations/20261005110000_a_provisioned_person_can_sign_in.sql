-- ---------------------------------------------------------------------------
-- A PROVISIONED PERSON CAN SIGN IN — AND NOBODY ELSE CAN MAKE THEMSELVES ONE.
--
-- The coherence assessment executed the whole onboarding journey through the
-- product and found three breaks in one chain:
--
--   F-01  an institution provisions a person (person, role, institutional ID)
--         and nothing ever gives them an account: no product path creates the
--         Auth identity a sign-in needs, and their enrolment stays PENDING, so
--         even an account would open no assessment;
--   F-02  the public Auth signup endpoint creates an Auth user, and this
--         trigger turned every one of them into a permanent PINTAR person and
--         account, with a display name the stranger chose;
--   F-03  the intake validator accepts role STUDENT, and the provisioner then
--         wrote it into role_assignments, which refuses it.
--
-- THE REPAIR, AS ONE LIFECYCLE
--   provision (intake, unchanged)  ->  ACTIVATE (new)  ->  sign in (unchanged)
--
--   * authorize_account_activation(person, kind, email, card) — asked by an
--     administrator holding CAN_PROVISION_PEOPLE in the person's institution
--     (or a SYSTEM_ADMIN). It decides, audits, and writes ONE short-lived,
--     single-use ACTIVATION GRANT: this email address becomes this person.
--     The one route that holds the service key (/api/akun/aktivasi) then asks
--     Auth to create the identity, and this trigger consumes the grant that
--     matches the new user's email AT INSERT TIME, links the identity to the
--     EXISTING person, and moves their PENDING enrolments to ACTIVE, because
--     an enrolment begins when the learner can attend.
--   * authorize_new_person(display_name, email) — a SYSTEM_ADMIN's path to a
--     person no institution has provisioned yet (a school's first
--     administrator); the grant carries the name instead of a person.
--   * the trigger REFUSES to invent a person for any other Auth user, outside
--     day zero and local fixtures. FAIL-CLOSED: the decision is `is true`, so
--     an unknown input (a setting a connection never set is NULL, not '')
--     refuses rather than admits (NEW-1).
--   * persons_awaiting_account() — the list the activation screen reads.
--
-- WHY A GRANT AND NOT app_metadata (NEW-2). GoTrue's admin createUser INSERTs
-- the user with app_metadata = {provider, providers} and applies the caller's
-- app_metadata in a LATER update (internal/api/admin.go, adminUserCreate), so
-- an AFTER INSERT trigger never sees it. What a trigger can see at insert is
-- the email. The grant binds that email to a person, for minutes, once, and
-- only because an authorized administrator asked for it immediately before.
--
-- Signup is ALSO disabled at the Auth service (config.toml; hosted by the Auth
-- workflow). This trigger is the second lock: if that setting is ever turned
-- back on, a sign-up fails instead of provisioning.
-- ---------------------------------------------------------------------------

-- F-03 ------------------------------------------------------------------------
create or replace function public.import_advance(p_job uuid, p_max_rows integer default 25)
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

      -- F-03. A LEARNER IS AUTHORIZED BY ENROLMENT, NOT BY A ROLE (doc 05). The
      -- validator accepts role STUDENT as "a learner", and so does this step
      -- now: the membership above IS the learner's authorization, and STUDENT
      -- is not a role a role assignment may carry.
      if v_role is not null and v_role <> 'STUDENT' then
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

revoke all on function public.import_advance(uuid, integer) from public, anon, authenticated;
grant execute on function public.import_advance(uuid, integer) to authenticated;

-- NEW-2: the activation grant ----------------------------------------------------
create table public.account_activation_grants (
  id              uuid primary key default gen_random_uuid(),
  email           text not null check (email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+$'),
  person_id       uuid references public.persons(id),
  display_name    text,
  kind            public.account_kind not null,
  card_number     text check (card_number is null or card_number ~ '^[0-9]{10}$'),
  institution_id  uuid references public.institutions(id),
  authorized_by   uuid not null references public.persons(id),
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '10 minutes',
  consumed_at     timestamptz,
  consumed_by     uuid,
  -- a grant names a person to link, or a name to create one with; never both
  constraint account_activation_grants_target check ((person_id is null) <> (display_name is null)),
  constraint account_activation_grants_card check ((kind = 'CLASSROOM_CARD') = (card_number is not null)),
  constraint account_activation_grants_consumed check ((consumed_at is null) = (consumed_by is null))
);
comment on table public.account_activation_grants is
  'F-01/NEW-2: a single-use, minutes-long binding of an email address to a person, written by '
  'authorize_account_activation/authorize_new_person and consumed by handle_new_auth_user at the '
  'moment Auth inserts that user. Readable and writable by no client role.';
create index account_activation_grants_live on public.account_activation_grants (email)
  where consumed_at is null;
alter table public.account_activation_grants enable row level security;
revoke all on public.account_activation_grants from public, anon, authenticated;

-- F-02 / F-01: the trigger links by grant, and refuses to invent -------------------
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid; v_kind public.account_kind := 'EMAIL'; v_card text; v_env text;
        v_grant public.account_activation_grants; v_allowed boolean;
begin
  -- 1. an authorized activation: the live grant for this address, consumed once
  select g.* into v_grant from public.account_activation_grants g
   where g.email = lower(coalesce(new.email, '')) and g.consumed_at is null and g.expires_at > now()
   order by g.created_at desc limit 1
   for update;
  if v_grant.id is not null then
    update public.account_activation_grants
       set consumed_at = now(), consumed_by = new.id
     where id = v_grant.id;
    if v_grant.person_id is null then
      insert into public.persons (display_name) values (v_grant.display_name) returning id into v_person;
    else
      v_person := v_grant.person_id;
      if exists (select 1 from public.accounts a where a.person_id = v_person) then
        raise exception 'this person already has an account' using errcode = 'PR010';
      end if;
      -- an enrolment begins when the learner can attend (audited by enrollments_audit)
      update public.enrollments set status = 'ACTIVE' where person_id = v_person and status = 'PENDING';
    end if;
    insert into public.accounts (person_id, auth_user_id, kind, card_number)
    values (v_person, new.id, v_grant.kind, v_grant.card_number);
    return new;
  end if;

  -- 2. anything else creates a person only where PINTAR creates its own
  --    (local fixtures, the synthetic seed off production) or on day zero.
  --    FAIL-CLOSED (NEW-1): every term is NULL-safe and the decision is
  --    `is not true`, so an input nobody set cannot admit a sign-up.
  select environment into v_env from public.platform_environment;
  v_allowed := coalesce(public.synthetic_fixtures_permitted(), false)
            or (coalesce(v_env, 'production') <> 'production'
                and coalesce(current_setting('app.seed_intent', true), '') = 'synthetic')
            or not exists (select 1 from public.role_assignments ra
                            where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                              and now() >= ra.valid_from and now() < ra.valid_until);
  if v_allowed is not true then
    raise exception 'PINTAR creates no identity from a sign-up: an institution provisions people and an administrator activates them'
      using errcode = 'PR010';
  end if;
  -- a seed writes auth.users directly and may name its person and account
  -- shape there; GoTrue never does at insert (NEW-2), so for it these are the
  -- defaults: a new person, an EMAIL account
  v_person := nullif(new.raw_app_meta_data->>'person_id','')::uuid;
  v_kind := coalesce(nullif(new.raw_app_meta_data->>'account_kind','')::public.account_kind, 'EMAIL');
  v_card := nullif(new.raw_app_meta_data->>'card_number','');
  if v_person is null then
    insert into public.persons (display_name)
    values (coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(coalesce(new.email,'Pelajar'),'@',1)))
    returning id into v_person;
  end if;
  insert into public.accounts (person_id, auth_user_id, kind, card_number) values (v_person, new.id, v_kind, v_card);
  return new;
end $$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- F-01: who may be activated, and by whom -------------------------------------
create function public.persons_awaiting_account()
returns table (person_id uuid, display_name text, institutional_id text, institution_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.display_name, ii.institutional_id, ii.institution_id
    from public.institutional_identities ii
    join public.persons p on p.id = ii.person_id
   where not exists (select 1 from public.accounts a where a.person_id = p.id)
     and (public.is_system_admin() or public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id))
   order by ii.institution_id, p.display_name
$$;
revoke all on function public.persons_awaiting_account() from public, anon, authenticated;
grant execute on function public.persons_awaiting_account() to authenticated;

create function public.authorize_account_activation(
  p_person uuid, p_kind text, p_email text, p_card_number text default null)
returns table (display_name text, institution_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_name text; v_inst uuid; v_email text;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception 'activating an account requires CAN_PROVISION_PEOPLE in the person''s institution';
  end if;
  select p.display_name into v_name from public.persons p where p.id = p_person;
  if v_name is null then raise exception 'unknown person'; end if;
  if p_kind not in ('EMAIL', 'CLASSROOM_CARD') then
    raise exception 'an account is EMAIL or CLASSROOM_CARD, not %', p_kind;
  end if;
  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'an account needs a valid email address';
  end if;
  if (p_kind = 'CLASSROOM_CARD') <> (p_card_number is not null)
     or (p_card_number is not null and p_card_number !~ '^[0-9]{10}$') then
    raise exception 'a classroom card account names its ten-digit card, and only a card account does';
  end if;
  if exists (select 1 from public.accounts a where a.person_id = p_person) then
    raise exception 'this person already has an account';
  end if;
  insert into public.account_activation_grants (email, person_id, kind, card_number, institution_id, authorized_by)
  values (v_email, p_person, p_kind::public.account_kind, p_card_number, v_inst, v_actor);
  -- the address itself is Auth's to hold, never logged here
  perform public.audit_write('account.activation_authorized', 'persons', p_person::text, v_inst,
    jsonb_build_object('person_id', p_person, 'kind', p_kind, 'actor', v_actor));
  display_name := v_name; institution_id := v_inst; return next;
end $$;
revoke all on function public.authorize_account_activation(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.authorize_account_activation(uuid, text, text, text) to authenticated;

create function public.authorize_new_person(p_display_name text, p_email text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_name text; v_email text;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  if not public.is_system_admin() then
    raise exception 'creating a person outside an institution''s intake requires an active SYSTEM_ADMIN';
  end if;
  v_name := btrim(coalesce(p_display_name, ''));
  if v_name = '' or length(v_name) > 200 then raise exception 'a person needs a display name'; end if;
  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'an account needs a valid email address';
  end if;
  insert into public.account_activation_grants (email, display_name, kind, authorized_by)
  values (v_email, v_name, 'EMAIL', v_actor);
  perform public.audit_write('account.new_person_authorized', 'persons', null, null,
    jsonb_build_object('display_name', v_name, 'actor', v_actor));
  return v_name;
end $$;
revoke all on function public.authorize_new_person(text, text) from public, anon, authenticated;
grant execute on function public.authorize_new_person(text, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('persons_awaiting_account', 'STAFF',
   'Provisioned people who hold no account yet, in the institutions where the caller holds '
   'CAN_PROVISION_PEOPLE (every institution for a SYSTEM_ADMIN). Person id, display name, '
   'institutional ID and institution; no email, no role.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('authorize_account_activation', 'STAFF',
   'Decides and audits the activation of one provisioned person''s account; creates nothing. '
   'The service-role route creates the Auth identity only after this returns.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('authorize_new_person', 'STAFF',
   'A SYSTEM_ADMIN authorizes a person no institution has provisioned yet (a school''s first '
   'administrator); audited; the service-role route creates the identity.', 'SYSTEM_ADMIN', null)
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014): the lifecycle, end to end, rolled back.
-- Inserts are shaped as GoTrue shapes them: app_metadata carries only
-- {provider, providers} at INSERT; nothing PINTAR wrote is visible yet.
-- ---------------------------------------------------------------------------
do $$
declare v_inst uuid; v_period uuid; v_sys_u uuid; v_sys uuid; v_p uuid; v_enr uuid; v_u uuid;
        v_raised boolean; n int; v_state text; v_gotrue jsonb := '{"provider":"email","providers":["email"]}';
begin
  -- The probe builds a synthetic world, which a production-marked database
  -- refuses by design (INV-16 admits the synthetic seed intent only off
  -- production). There the structure is what can be asserted; the behaviour
  -- is F09-A01..A03 and F09-C01's, proven in CI on every push.
  if (select environment from public.platform_environment) = 'production' then
    if pg_get_functiondef('public.handle_new_auth_user()'::regprocedure) not like '%PR010%'
       or pg_get_functiondef('public.handle_new_auth_user()'::regprocedure) not like '%is not true%' then
      raise exception '0112: the Auth trigger does not refuse a self-provisioned identity fail-closed';
    end if;
    raise notice '0112: production-marked database; structural check only (behaviour: F09)';
    return;
  end if;
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0112 school', 'probe-0112-school', true, true) returning id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 1, current_date + 300) returning id into v_period;
    insert into auth.users (id, email, raw_app_meta_data) values (gen_random_uuid(), 'probe-0112-sys@local.invalid', v_gotrue)
    returning id into v_sys_u;
    select a.person_id into v_sys from public.accounts a where a.auth_user_id = v_sys_u;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_sys, 'SYSTEM_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days');
    insert into public.persons (display_name) values ('Siswa Probe 0112') returning id into v_p;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_p, v_inst, v_period, 'PENDING') returning id into v_enr;
    perform set_config('app.seed_intent', '', true);

    -- (1) F-02: with an active SYSTEM_ADMIN and no fixtures, a bare sign-up is refused
    if public.synthetic_fixtures_permitted() then
      raise notice '0112: fixtures permitted in this database; the refusal probe is skipped here';
    else
      v_raised := false;
      begin
        insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
        values (gen_random_uuid(), 'probe-0112-stranger@local.invalid', v_gotrue, '{"display_name":"Kepala Sekolah"}');
      exception when sqlstate 'PR010' then v_raised := true;
      end;
      if not v_raised then raise exception '0112: a bare sign-up still provisions a PINTAR person'; end if;
    end if;

    -- (2) F-01: a live grant links the identity Auth inserts to the provisioned
    --     person and starts the enrolment -- with nothing in app_metadata
    insert into public.account_activation_grants (email, person_id, kind, authorized_by)
    values ('probe-0112-learner@local.invalid', v_p, 'EMAIL', v_sys);
    insert into auth.users (id, email, raw_app_meta_data)
    values (gen_random_uuid(), 'Probe-0112-Learner@local.invalid', v_gotrue)
    returning id into v_u;
    select count(*) into n from public.accounts a where a.auth_user_id = v_u and a.person_id = v_p;
    if n <> 1 then raise exception '0112: the activated identity is not linked to the provisioned person'; end if;
    select status::text into v_state from public.enrollments where id = v_enr;
    if v_state <> 'ACTIVE' then raise exception '0112: activation left the enrolment %', v_state; end if;
    select count(*) into n from public.account_activation_grants g
     where g.email = 'probe-0112-learner@local.invalid' and g.consumed_by = v_u;
    if n <> 1 then raise exception '0112: the grant was not consumed by the identity it created'; end if;

    raise exception 'PROBE_0112_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0112_ROLLBACK' then raise; end if;
  end;
  raise notice '0112 verified: a bare sign-up provisions nobody once a SYSTEM_ADMIN exists; a granted identity links to the provisioned person at insert and starts their enrolment';
end $$;

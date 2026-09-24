-- ---------------------------------------------------------------------------
-- ACTIVATION IS GRANTED, NOT INFERRED — AND A SIGN-UP NOBODY ASKED FOR FAILS
-- CLOSED.
--
-- Probe attempt 006 drove 20261005110000 through a real GoTrue and found both
-- of its locks open (docs/audit/SYSTEMIC-REPAIR-01-REPORT.md §4.4):
--
--   NEW-1  the F-02 refusal read current_setting('app.seed_intent', true),
--          which is NULL -- not '' -- on a connection that never set it, and
--          every GoTrue connection is one. `NULL = 'synthetic'` is NULL, the
--          OR chain collapsed to NULL, and `if NULL then raise` does not raise:
--          every real sign-up provisioned a person.
--   NEW-2  activation linked through app_metadata, but GoTrue's admin
--          createUser INSERTs the user with app_metadata = {provider,
--          providers} and applies the caller's app_metadata in a LATER update
--          (internal/api/admin.go, adminUserCreate). The AFTER INSERT trigger
--          never saw the link: locally it invented a second person, on
--          production it would have refused every activation.
--
-- THE REPAIR
--   * account_activation_grants — a single-use, minutes-long binding of one
--     email address to one person (or, for a SYSTEM_ADMIN's new person, to a
--     name), written ONLY by the two authorize functions after they decide and
--     audit, and consumed by the trigger at the moment Auth inserts a user
--     with that address. The email is what a trigger can see at insert.
--   * handle_new_auth_user — links by grant first; otherwise creates a person
--     only for local fixtures, the synthetic seed off production, or day zero,
--     and decides FAIL-CLOSED: every term NULL-safe, refusal unless the
--     allow-condition `is true`.
--   * authorize_account_activation(person, kind, email, card) and
--     authorize_new_person(name, email) replace the earlier signatures (which
--     created nothing and so could link nothing); both now write the grant.
--
-- 20261005110000 is left byte-identical (forward-only). Signup is also closed
-- at the hosted Auth service (disable_signup, Auth boundary attempt 004).
-- ---------------------------------------------------------------------------

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

-- the earlier signatures decided but could not link; they are replaced, not overloaded
drop function public.authorize_account_activation(uuid, text, text);
drop function public.authorize_new_person(text);

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

-- the registry names stay; the notes say what the functions now do
update public.client_rpc_registry
   set note = 'Decides and audits the activation of one provisioned person''s account and writes one '
           || 'single-use, minutes-long activation grant for the given address (a card account names its '
           || 'card); the service-role route then asks Auth to create the identity, which the Auth trigger '
           || 'links by consuming the grant.'
 where function_name = 'authorize_account_activation';
update public.client_rpc_registry
   set note = 'A SYSTEM_ADMIN authorizes a person no institution has provisioned yet (a school''s first '
           || 'administrator); audited; writes an activation grant carrying the name, which the Auth '
           || 'trigger turns into the person when Auth creates the identity.'
 where function_name = 'authorize_new_person';

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
      raise exception '0113: the Auth trigger does not refuse a self-provisioned identity fail-closed';
    end if;
    raise notice '0113: production-marked database; structural check only (behaviour: F09)';
    return;
  end if;
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0113 school', 'probe-0113-school', true, true) returning id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 1, current_date + 300) returning id into v_period;
    insert into auth.users (id, email, raw_app_meta_data) values (gen_random_uuid(), 'probe-0113-sys@local.invalid', v_gotrue)
    returning id into v_sys_u;
    select a.person_id into v_sys from public.accounts a where a.auth_user_id = v_sys_u;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_sys, 'SYSTEM_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days');
    insert into public.persons (display_name) values ('Siswa Probe 0113') returning id into v_p;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_p, v_inst, v_period, 'PENDING') returning id into v_enr;
    perform set_config('app.seed_intent', '', true);

    -- (1) F-02: with an active SYSTEM_ADMIN and no fixtures, a bare sign-up is refused
    if public.synthetic_fixtures_permitted() then
      raise notice '0113: fixtures permitted in this database; the refusal probe is skipped here';
    else
      v_raised := false;
      begin
        insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
        values (gen_random_uuid(), 'probe-0113-stranger@local.invalid', v_gotrue, '{"display_name":"Kepala Sekolah"}');
      exception when sqlstate 'PR010' then v_raised := true;
      end;
      if not v_raised then raise exception '0113: a bare sign-up still provisions a PINTAR person'; end if;
    end if;

    -- (2) F-01: a live grant links the identity Auth inserts to the provisioned
    --     person and starts the enrolment -- with nothing in app_metadata
    insert into public.account_activation_grants (email, person_id, kind, authorized_by)
    values ('probe-0113-learner@local.invalid', v_p, 'EMAIL', v_sys);
    insert into auth.users (id, email, raw_app_meta_data)
    values (gen_random_uuid(), 'Probe-0113-Learner@local.invalid', v_gotrue)
    returning id into v_u;
    select count(*) into n from public.accounts a where a.auth_user_id = v_u and a.person_id = v_p;
    if n <> 1 then raise exception '0113: the activated identity is not linked to the provisioned person'; end if;
    select status::text into v_state from public.enrollments where id = v_enr;
    if v_state <> 'ACTIVE' then raise exception '0113: activation left the enrolment %', v_state; end if;
    select count(*) into n from public.account_activation_grants g
     where g.email = 'probe-0113-learner@local.invalid' and g.consumed_by = v_u;
    if n <> 1 then raise exception '0113: the grant was not consumed by the identity it created'; end if;

    raise exception 'PROBE_0113_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0113_ROLLBACK' then raise; end if;
  end;
  raise notice '0113 verified: a bare sign-up provisions nobody once a SYSTEM_ADMIN exists; a granted identity links to the provisioned person at insert and starts their enrolment';
end $$;

-- ---------------------------------------------------------------------------
-- THE BOOTSTRAP IS INSTALLATION INITIALISATION, NOT ADMINISTRATOR RECOVERY.
--
-- `bootstrap_first_system_admin` shipped with one condition: no ACTIVE
-- SYSTEM_ADMIN. That made it reopen whenever a tenant revoked or let expire
-- its last administrator — a recovery door nobody asked for, reachable with
-- the operator's key. Sauron's final ruling: it opens once per installation,
-- and after it has succeeded it refuses forever, whatever happens to the
-- administrators afterwards.
--
-- So success now leaves a DURABLE, AUTHORITATIVE, CONSUMED state of its own,
-- rather than being inferred from whether any administrator happens to be
-- alive. `platform_bootstrap` holds at most one row, is written once by the
-- bootstrap itself, and refuses UPDATE and DELETE by trigger: there is no
-- ordinary path that un-consumes an installation.
--
-- NO BACKFILL, AND THE REASON IS NOT AN OVERSIGHT. The bootstrap function
-- ships in this same release and has never been consumed on any installation —
-- hosted carries no administrator at all, and the release rehearsal ran only
-- against disposable local databases. There is therefore no prior act to
-- record, and inventing a consumed row for a database that never bootstrapped
-- would be recording something that did not happen.
--
-- ADMINISTRATOR RECOVERY IS NOT BUILT, and this migration does not open a
-- second door in its place. A tenant that loses its last administrator is an
-- operational matter for whoever holds the database, not a product feature.
--
-- Everything else is preserved exactly: service-role only, `authenticated` and
-- `anon` refused twice over, INV-16 untouched for every ordinary grant, and
-- normal role governance the moment the first administrator exists.
-- ---------------------------------------------------------------------------

create table public.platform_bootstrap (
  singleton   boolean     primary key default true,
  consumed_at timestamptz not null default now(),
  person_id   uuid        not null references public.persons(id),
  constraint platform_bootstrap_is_singleton check (singleton)
);
alter table public.platform_bootstrap enable row level security;
revoke all on table public.platform_bootstrap from public, anon, authenticated;
comment on table public.platform_bootstrap is
  'One row, written once, when this installation bootstrapped its first SYSTEM_ADMIN. Its presence is what closes bootstrap_first_system_admin permanently. No client role may read or write it.';

create or replace function public.platform_bootstrap_is_final()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception 'the installation initialisation record is written once and never changed or removed';
end $$;
revoke all on function public.platform_bootstrap_is_final() from public, anon, authenticated;

create trigger platform_bootstrap_final
  before update or delete on public.platform_bootstrap
  for each row execute function public.platform_bootstrap_is_final();

-- ---------------------------------------------------------------------------
-- THE GUARD. One added conjunct in the day-zero clause: an installation that
-- has been initialised has no day zero left. Every other line is as it was.
-- ---------------------------------------------------------------------------
create or replace function public.role_assignments_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_env text; v_target_inst uuid;
begin
  if tg_op = 'DELETE' then raise exception 'role assignments are revoked, never deleted (audit)'; end if;
  if tg_op = 'UPDATE' then
    if new.person_id <> old.person_id or new.role <> old.role or new.scope_node_id is distinct from old.scope_node_id
       or new.institution_id is distinct from old.institution_id or new.valid_from <> old.valid_from
       or new.valid_until <> old.valid_until or new.granted_by is distinct from old.granted_by then
      raise exception 'a role assignment is immutable; revoke and grant a new one';
    end if;
    if old.revoked_at is not null then raise exception 'assignment already revoked'; end if;
    return new;
  end if;

  if new.scope_node_id is not null then
    select institution_id into v_target_inst from public.org_nodes where id = new.scope_node_id;
    if v_target_inst is null then raise exception 'scope node not found'; end if;
    new.institution_id := v_target_inst;
  end if;
  v_actor := public.current_person_id();
  if auth.uid() is null then
    -- DAY ZERO, AND ONLY DAY ZERO. The marker only `bootstrap_first_system_admin`
    -- sets, naming this very person; the role SYSTEM_ADMIN and no other; no
    -- active SYSTEM_ADMIN anywhere; and an installation that has never been
    -- initialised. The last is what makes this a one-time door rather than a
    -- standing recovery path.
    if current_setting('pintar.bootstrap_first_admin', true) = new.person_id::text
       and new.role = 'SYSTEM_ADMIN'
       and not exists (select 1 from public.platform_bootstrap)
       and not exists (select 1 from public.role_assignments ra
                        where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                          and now() >= ra.valid_from and now() < ra.valid_until) then
      return new;
    end if;

    select environment into v_env from public.platform_environment;
    if v_env = 'production' or current_setting('app.seed_intent', true) is distinct from 'synthetic' then
      raise exception 'role assignments require an authenticated grantor (INV-16)';
    end if;
    return new;
  end if;
  if v_actor is null then raise exception 'grantor has no person (INV-16)'; end if;
  if v_actor = new.person_id then raise exception 'self-grant is never allowed (INV-16)'; end if;
  new.granted_by := v_actor;
  if new.role in ('SYSTEM_ADMIN','INSTITUTION_ADMIN') or new.scope_node_id is null then
    if not public.is_system_admin() then
      raise exception 'only an active SYSTEM_ADMIN may grant % (INV-16)', new.role;
    end if;
  else
    if not public.has_scope('INSTITUTION_ADMIN', new.scope_node_id) then
      raise exception 'grantor lacks INSTITUTION_ADMIN scope over the target node (INV-16)';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.role_assignments_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- THE BOOTSTRAP. Consumed state is checked first and written on success.
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_first_system_admin(
  p_email       text,
  p_valid_until timestamptz default now() + interval '365 days'
) returns uuid
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_claims jsonb; v_role text; v_uid uuid; v_person uuid; v_id uuid; v_when timestamptz;
begin
  -- 1. NOT A CLIENT, BY TWO INDEPENDENT MEASURES.
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or (v_role is not null and v_role <> 'service_role') then
    raise exception 'the day-zero bootstrap is an operator action, not a signed-in one';
  end if;

  -- 2. ONCE PER INSTALLATION, FOR EVER. This is the durable fact, and it is
  --    checked before anything about who is or is not currently an
  --    administrator: revoking every SYSTEM_ADMIN does not give an
  --    installation a second day zero.
  select b.consumed_at into v_when from public.platform_bootstrap b;
  if v_when is not null then
    raise exception 'this installation was already initialised on %: the bootstrap is a one-time act, and further administrators are granted through grant_role (INV-16)', v_when;
  end if;

  -- 3. AND NOT WHILE AN ADMINISTRATOR IS ALIVE — which covers an installation
  --    that acquired one by some path other than this function.
  if exists (select 1 from public.role_assignments ra
              where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                and now() >= ra.valid_from and now() < ra.valid_until) then
    raise exception 'this PINTAR already has an active SYSTEM_ADMIN: grant the next one through grant_role (INV-16)';
  end if;

  if p_email is null or p_valid_until is null or p_valid_until <= now() then
    raise exception 'the first administrator needs an email and a validity that has not already passed';
  end if;

  -- 4. THE IDENTITY IS AUTH'S TO CREATE, NOT THIS FUNCTION'S.
  select u.id into v_uid from auth.users u where u.email = p_email;
  if v_uid is null then
    raise exception 'no identity for %: create the user in Supabase Auth first, then bootstrap', p_email;
  end if;
  select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
  if v_person is null then
    raise exception 'the identity for % has no person record', p_email;
  end if;

  -- 5. ONE ASSIGNMENT, GLOBAL SCOPE, NO GRANTOR — and the installation is
  --    consumed in the same transaction, so a bootstrap that succeeded and a
  --    bootstrap that is recorded are the same event.
  perform set_config('pintar.bootstrap_first_admin', v_person::text, true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
  values (v_person, 'SYSTEM_ADMIN', null, now(), p_valid_until)
  returning id into v_id;
  perform set_config('pintar.bootstrap_first_admin', '', true);

  insert into public.platform_bootstrap (person_id) values (v_person);

  perform public.audit_write('role.first_system_admin_bootstrapped', 'role_assignments', v_id::text, null,
    jsonb_build_object('person_id', v_person, 'email', p_email, 'valid_until', p_valid_until,
                       'reason', 'installation initialisation: this PINTAR had never been bootstrapped'));
  return v_person;
end $$;
revoke all on function public.bootstrap_first_system_admin(text, timestamptz) from public, anon, authenticated;
grant execute on function public.bootstrap_first_system_admin(text, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014)
-- ---------------------------------------------------------------------------
do $$
declare v_uid uuid; v_person uuid; v_other_u uuid; v_other uuid; v_raised boolean; v_msg text; n int;
begin
  -- structural
  if has_function_privilege('authenticated',
       'public.bootstrap_first_system_admin(text,timestamptz)'::regprocedure, 'execute')
     or has_function_privilege('anon',
       'public.bootstrap_first_system_admin(text,timestamptz)'::regprocedure, 'execute') then
    raise exception 'the bootstrap is reachable by a client role';
  end if;
  if has_table_privilege('authenticated', 'public.platform_bootstrap', 'select')
     or has_table_privilege('anon', 'public.platform_bootstrap', 'select') then
    raise exception 'the initialisation record is readable by a client role';
  end if;
  select count(*) into n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relname = 'platform_bootstrap' and c.relrowsecurity;
  if n <> 1 then raise exception 'platform_bootstrap does not carry RLS'; end if;

  ------------------------------------------------------------------ behavioural
  begin
    update public.role_assignments set revoked_at = now()
     where role = 'SYSTEM_ADMIN' and revoked_at is null;

    perform set_config('app.seed_intent', 'synthetic', true);
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0109-first@local.invalid')
    returning id into v_uid;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0109-second@local.invalid')
    returning id into v_other_u;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
    select a.person_id into v_other from public.accounts a where a.auth_user_id = v_other_u;
    perform set_config('app.seed_intent', '', true);

    -- (1) day zero still works, and now leaves a record
    if public.bootstrap_first_system_admin('probe-0109-first@local.invalid') <> v_person then
      raise exception 'the bootstrap bound the wrong person';
    end if;
    select count(*) into n from public.platform_bootstrap where person_id = v_person;
    if n <> 1 then raise exception 'the bootstrap left % initialisation record(s)', n; end if;

    -- (2) THE RULING: revoke every administrator and it STILL refuses
    update public.role_assignments set revoked_at = now()
     where role = 'SYSTEM_ADMIN' and revoked_at is null;
    select count(*) into n from public.role_assignments
     where role = 'SYSTEM_ADMIN' and revoked_at is null and now() < valid_until;
    if n <> 0 then raise exception 'the probe failed to leave the installation without an administrator'; end if;
    v_raised := false;
    begin
      perform public.bootstrap_first_system_admin('probe-0109-second@local.invalid');
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'already initialised' then
      raise exception 'the bootstrap reopened after every administrator was revoked: %', coalesce(v_msg, '(accepted)');
    end if;

    -- (3) and the record itself cannot be undone
    v_raised := false;
    begin
      delete from public.platform_bootstrap;
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised then raise exception 'the initialisation record was deleted'; end if;
    v_raised := false;
    begin
      update public.platform_bootstrap set consumed_at = now() - interval '1 year';
    exception when others then v_raised := true; end;
    if not v_raised then raise exception 'the initialisation record was rewritten'; end if;

    -- (4) and the guard's day-zero clause is shut too: the marker no longer
    --     opens it even with no administrator alive
    perform set_config('pintar.bootstrap_first_admin', v_other::text, true);
    v_raised := false;
    begin
      insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
      values (v_other, 'SYSTEM_ADMIN', null, now(), now() + interval '1 day');
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    perform set_config('pintar.bootstrap_first_admin', '', true);
    if not v_raised or v_msg !~ 'authenticated grantor' then
      raise exception 'the marker opened the guard on an initialised installation: %', coalesce(v_msg, '(accepted)');
    end if;

    raise exception 'WP8E_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('pintar.bootstrap_first_admin', '', true);
    if sqlerrm <> 'WP8E_PROBE_UNDO' then
      raise exception 'installation-initialisation verification failed: %', sqlerrm;
    end if;
  end;
end $$;

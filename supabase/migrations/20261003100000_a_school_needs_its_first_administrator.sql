-- ---------------------------------------------------------------------------
-- DAY ZERO — THE FIRST SYSTEM ADMINISTRATOR.
--
-- The release rehearsal found the one thing a freshly deployed PINTAR cannot
-- do: acquire its first administrator. INV-16 is doing exactly what it says —
-- a role assignment needs an authenticated grantor, a grantor may never grant
-- to themselves, and SYSTEM_ADMIN may only be granted by an active
-- SYSTEM_ADMIN — and on an empty database there is no authenticated anybody.
-- L3-F01 removed the seeded administrator deliberately, so the absence is a
-- decision, not an oversight. What was missing is the one door that opens
-- before anyone exists and closes the moment somebody does.
--
-- THE SHAPE OF THE DOOR.
--   * It is reachable only by the SERVICE ROLE — the operator's key, held by
--     whoever deploys. `authenticated` and `anon` are not granted it and are
--     refused by the function's own first check as well, so a future grant
--     made by mistake would still not open it to a client.
--   * It works only while NO ACTIVE SYSTEM_ADMIN EXISTS. The instant one does,
--     it refuses, and normal PINTAR role governance owns every assignment
--     after it.
--   * It creates NOTHING except one role assignment. The identity itself is
--     Supabase Auth's to create; this function requires that the operator has
--     already created it and refuses if they have not.
--   * It is audited, by a name of its own.
--
-- WHAT IT DOES NOT DO. It does not weaken INV-16 for anybody else. The
-- authenticated path through `role_assignments_guard` is byte-identical: no
-- self-grant, no grant of SYSTEM_ADMIN or INSTITUTION_ADMIN without an active
-- SYSTEM_ADMIN, no grant outside the grantor's scope. The new clause lives
-- inside the branch that already handled "no authenticated grantor", and it
-- requires a session-local marker this function sets and clears — the same
-- idiom WP7B uses for `pintar.feedback_opening`.
--
-- ONE CONSEQUENCE, STATED RATHER THAN DISCOVERED. Because the condition is
-- "no ACTIVE SYSTEM_ADMIN" and not "none has ever existed", a school that
-- revokes or lets expire its last administrator can be given a new one through
-- this door. That is deliberate: the alternative locks a tenant out of its own
-- system permanently over an administrative mistake. It is not a widening —
-- reaching it still requires the operator's service-role key, which already
-- grants far more than this.
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
    -- DAY ZERO, AND ONLY DAY ZERO. Every condition must hold: the marker only
    -- `bootstrap_first_system_admin` sets, naming this very person; the role
    -- SYSTEM_ADMIN and no other; and not one active SYSTEM_ADMIN anywhere in
    -- the database. The moment one exists this branch is unreachable and the
    -- two clauses below are the only ones left.
    if current_setting('pintar.bootstrap_first_admin', true) = new.person_id::text
       and new.role = 'SYSTEM_ADMIN'
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

create or replace function public.bootstrap_first_system_admin(
  p_email       text,
  p_valid_until timestamptz default now() + interval '365 days'
) returns uuid
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_claims jsonb; v_role text; v_uid uuid; v_person uuid; v_id uuid;
begin
  -- 1. NOT A CLIENT, BY TWO INDEPENDENT MEASURES. The EXECUTE grant is the
  --    real gate — `authenticated` and `anon` do not hold it. This check is
  --    the second one, so that a grant made by mistake later would still not
  --    open the door to a signed-in human.
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or (v_role is not null and v_role <> 'service_role') then
    raise exception 'the day-zero bootstrap is an operator action, not a signed-in one';
  end if;

  -- 2. ONLY WHILE THERE IS NO ADMINISTRATOR.
  if exists (select 1 from public.role_assignments ra
              where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                and now() >= ra.valid_from and now() < ra.valid_until) then
    raise exception 'this PINTAR already has an active SYSTEM_ADMIN: grant the next one through grant_role (INV-16)';
  end if;

  if p_email is null or p_valid_until is null or p_valid_until <= now() then
    raise exception 'the first administrator needs an email and a validity that has not already passed';
  end if;

  -- 3. THE IDENTITY IS AUTH'S TO CREATE, NOT THIS FUNCTION'S. The operator
  --    creates the user in Supabase Auth first; PINTAR's own trigger gives it
  --    a person and an account. This binds a role to what already exists.
  select u.id into v_uid from auth.users u where u.email = p_email;
  if v_uid is null then
    raise exception 'no identity for %: create the user in Supabase Auth first, then bootstrap', p_email;
  end if;
  select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
  if v_person is null then
    raise exception 'the identity for % has no person record', p_email;
  end if;

  -- 4. ONE ASSIGNMENT, GLOBAL SCOPE, NO GRANTOR — because there is nobody to
  --    be the grantor, and recording a false one would be worse than a null.
  perform set_config('pintar.bootstrap_first_admin', v_person::text, true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
  values (v_person, 'SYSTEM_ADMIN', null, now(), p_valid_until)
  returning id into v_id;
  perform set_config('pintar.bootstrap_first_admin', '', true);

  perform public.audit_write('role.first_system_admin_bootstrapped', 'role_assignments', v_id::text, null,
    jsonb_build_object('person_id', v_person, 'email', p_email, 'valid_until', p_valid_until,
                       'reason', 'day-zero bootstrap: no active SYSTEM_ADMIN existed'));
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
  -- structural: the door is the operator's and nobody else's
  if has_function_privilege('authenticated',
       'public.bootstrap_first_system_admin(text,timestamptz)'::regprocedure, 'execute')
     or has_function_privilege('anon',
       'public.bootstrap_first_system_admin(text,timestamptz)'::regprocedure, 'execute') then
    raise exception 'the day-zero bootstrap is reachable by a client role';
  end if;
  if not has_function_privilege('service_role',
       'public.bootstrap_first_system_admin(text,timestamptz)'::regprocedure, 'execute') then
    raise exception 'the day-zero bootstrap is not reachable by the service role';
  end if;
  -- the ordinary clauses are still in the guard, word for word
  if pg_get_functiondef('public.role_assignments_guard()'::regprocedure)
       not like '%self-grant is never allowed (INV-16)%'
     or pg_get_functiondef('public.role_assignments_guard()'::regprocedure)
       not like '%only an active SYSTEM_ADMIN may grant%'
     or pg_get_functiondef('public.role_assignments_guard()'::regprocedure)
       not like '%grantor lacks INSTITUTION_ADMIN scope over the target node (INV-16)%' then
    raise exception 'the ordinary INV-16 clauses are no longer in the guard';
  end if;

  ------------------------------------------------------------------ behavioural
  begin
    -- Day zero is reached by revoking every active SYSTEM_ADMIN inside this
    -- probe, which the guard permits as an ordinary revocation, and the whole
    -- thing is rolled back.
    update public.role_assignments set revoked_at = now()
     where role = 'SYSTEM_ADMIN' and revoked_at is null;

    perform set_config('app.seed_intent', 'synthetic', true);
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0108-first@local.invalid')
    returning id into v_uid;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0108-second@local.invalid')
    returning id into v_other_u;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
    select a.person_id into v_other from public.accounts a where a.auth_user_id = v_other_u;
    perform set_config('app.seed_intent', '', true);

    -- (1) IT WORKS ON DAY ZERO
    if public.bootstrap_first_system_admin('probe-0108-first@local.invalid') <> v_person then
      raise exception 'the bootstrap bound the wrong person';
    end if;
    select count(*) into n from public.role_assignments
     where person_id = v_person and role = 'SYSTEM_ADMIN' and revoked_at is null;
    if n <> 1 then raise exception 'the bootstrap wrote % assignment(s)', n; end if;
    select count(*) into n from public.audit_log where action = 'role.first_system_admin_bootstrapped';
    if n <> 1 then raise exception 'the bootstrap wrote % audit row(s)', n; end if;

    -- (2) AND REFUSES THE SECOND TIME, FOREVER AFTER
    v_raised := false;
    begin
      perform public.bootstrap_first_system_admin('probe-0108-second@local.invalid');
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'already has an active SYSTEM_ADMIN' then
      raise exception 'a second bootstrap was accepted: %', coalesce(v_msg, '(accepted)');
    end if;

    -- (3) ORDINARY INV-16 IS UNCHANGED: without the marker, an unauthenticated
    --     insert is still refused for the reason it always was.
    v_raised := false;
    begin
      insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
      values (v_other, 'SYSTEM_ADMIN', null, now(), now() + interval '1 day');
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'authenticated grantor' then
      raise exception 'an unmarked unauthenticated grant was accepted: %', coalesce(v_msg, '(accepted)');
    end if;

    -- (4) AND THE MARKER ALONE IS NOT A KEY: an administrator now exists, so
    --     setting it by hand changes nothing.
    perform set_config('pintar.bootstrap_first_admin', v_other::text, true);
    v_raised := false;
    begin
      insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
      values (v_other, 'SYSTEM_ADMIN', null, now(), now() + interval '1 day');
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    perform set_config('pintar.bootstrap_first_admin', '', true);
    if not v_raised or v_msg !~ 'authenticated grantor' then
      raise exception 'the marker opened the door while an administrator existed: %', coalesce(v_msg, '(accepted)');
    end if;

    raise exception 'WP8D_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('pintar.bootstrap_first_admin', '', true);
    if sqlerrm <> 'WP8D_PROBE_UNDO' then
      raise exception 'day-zero bootstrap verification failed: %', sqlerrm;
    end if;
  end;
end $$;

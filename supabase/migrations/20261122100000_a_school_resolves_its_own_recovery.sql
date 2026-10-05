-- D-101, answered 5 Oct (Yazid): a credential is recovered at the nearest available independent authority, and a
-- replaced credential ends its sessions.
--
-- (1) A School Admin may assist with PIN recovery for another person under that school's authority, staff and learners
--     alike, where the recovery journey permits it; never themselves; never across the school's boundary. "Under the
--     school's authority" is BOB-21's own definition (D-049), not a new one: the school's number, a role there other
--     than Platform Admin, or a learner there. A Platform Admin is above every school: only another Platform Admin
--     assists them. Nobody, the Platform Admin included, resets their own recovery with an administrator's authority.
-- (2) An active School Admin may appoint another person the school has as School Admin, at the school itself;
--     confirmed on the screen, audited as every grant is (role.granted, the grantor and their role). Below a school, and
--     SYSTEM_ADMIN anywhere, stay the Platform Admin's; self-grant stays refused.
-- (3) A lost, replaced or re-issued credential ends the person's sessions: a recovered password, a re-issued class card
--     and an assisted PIN reset. Auth already ends its own sessions on a password change, but PINTAR's session record
--     stayed open, and PostgREST's pre-request refuses only an ended record, so a token issued before the change was
--     still served for the rest of its life (up to an hour). The record is now ended in the change's own transaction.
--     An activation has nothing before it to end; «Keluar» and «Keluar dari semua perangkat» are unchanged.
--
-- Unchanged: first-time activation, a person's own forgotten-password recovery (its flow), removing a co-admin
-- (revoke_role already admits a School Admin over the school's assignments), and every other authority boundary.

-- ═══════════════════════════════════════════════════════════════ (1) the authority question
-- The school through which the caller, an active School Admin, may assist this person: one that has them by its
-- number, a role there other than Platform Admin, or a learner there. Null for anyone else, and for oneself.
create function public.recovery_assist_school(p_person uuid)
returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select mine.institution_id
    from public.role_assignments mine
    join public.org_nodes o on o.institution_id = mine.institution_id and o.kind = 'INSTITUTION'
   where mine.person_id = public.current_person_id() and p_person is distinct from public.current_person_id()
     and mine.role = 'INSTITUTION_ADMIN' and mine.revoked_at is null and now() >= mine.valid_from and now() < mine.valid_until
     and public.has_scope('INSTITUTION_ADMIN', o.id)
     and (exists (select 1 from public.institutional_identities ii
                   where ii.person_id = p_person and ii.institution_id = mine.institution_id)
          or exists (select 1 from public.role_assignments ra
                      where ra.person_id = p_person and ra.institution_id = mine.institution_id
                        and ra.role <> 'SYSTEM_ADMIN' and ra.revoked_at is null and now() < ra.valid_until)
          or exists (select 1 from public.enrollments e
                      where e.person_id = p_person and e.institution_id = mine.institution_id
                        and e.status in ('PENDING', 'ACTIVE')))
   order by mine.institution_id
   limit 1
$$;
revoke all on function public.recovery_assist_school(uuid) from public, anon, authenticated, service_role;

-- May the caller assist this person's recovery? Never oneself; a Platform Admin only by another Platform Admin; the
-- Platform Admin anyone else; a School Admin a person their school has.
create function public.recovery_may_assist(p_person uuid)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if p_person is null or v_me is null or p_person = v_me then return false; end if;
  if exists (select 1 from public.role_assignments ra
              where ra.person_id = p_person and ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                and now() >= ra.valid_from and now() < ra.valid_until) then
    return public.is_system_admin();
  end if;
  if public.is_system_admin() then return true; end if;
  return public.recovery_assist_school(p_person) is not null;
end $$;
revoke all on function public.recovery_may_assist(uuid) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════ (3) ending a person's sessions
-- Every session of one Auth user: each Auth session recorded (one a browser never showed a page with has no row yet),
-- then ended through sesi_akhiri_inti -- recorded with the reason, so the rest of its token's life is refused; its Auth
-- session deleted, so no refresh succeeds; audited -- and any Auth session left deleted. Internal.
create function public.sesi_akhiri_orang(p_auth_user uuid, p_alasan text)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n int := 0; x record; v_mode text;
begin
  if p_auth_user is null then return 0; end if;
  select case when a.kind = 'CLASSROOM_CARD' then 'CARD' else 'SHARED' end into v_mode
    from public.accounts a where a.auth_user_id = p_auth_user;
  insert into public.device_sessions (session_id, auth_user_id, mode)
  select s.id, s.user_id, coalesce(v_mode, 'SHARED') from auth.sessions s where s.user_id = p_auth_user
  on conflict (session_id) do nothing;
  for x in select d.session_id from public.device_sessions d
            where d.auth_user_id = p_auth_user and d.ended_at is null for update loop
    perform public.sesi_akhiri_inti(x.session_id, p_alasan);
    n := n + 1;
  end loop;
  delete from auth.sessions where user_id = p_auth_user;
  return n;
end $$;
revoke all on function public.sesi_akhiri_orang(uuid, text) from public, anon, authenticated, service_role;

alter table public.device_sessions drop constraint device_sessions_ended_reason_check;
alter table public.device_sessions add constraint device_sessions_ended_reason_check
  check (ended_reason in ('PIN_GAGAL', 'KUNCI_HABIS', 'KELUAR', 'KELUAR_SEMUA', 'KREDENSIAL_DIGANTI'));

-- ═══════════════════════════════════════════════════════════════ (1) the lookup and the reset
-- One PINTAR ID's person and the state of their PIN recovery, for the Platform Admin or a School Admin. A person the
-- caller may not assist answers as an ID nobody holds; one's own ID is refused by its own code.
create or replace function public.recovery_status(p_typed_id text)
returns table (person_id uuid, display_name text, pintar_id text, state text, locked_until timestamptz,
               new_pin_required boolean, has_email_account boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_id text := public.pintar_id_canonical(p_typed_id); l public.recovery_ladder; v_orang uuid;
        v_me uuid := public.current_person_id();
begin
  if not public.is_system_admin()
     and not exists (select 1 from public.role_assignments ra
                      where ra.person_id = v_me and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null
                        and now() >= ra.valid_from and now() < ra.valid_until) then
    raise exception using errcode = '42501',
      message = 'a person''s recovery state is for SYSTEM_ADMIN, or an INSTITUTION_ADMIN of a school that has the person (D-101)';
  end if;
  if v_id is null then return; end if;
  select p.id into v_orang from public.persons p where p.pintar_id = v_id and not public.adalah_persona(p.id);
  if v_orang is null then return; end if;
  if v_orang = v_me then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_SELF',
      message = 'nobody looks up or resets their own recovery with an administrator''s authority (D-101)';
  end if;
  if not public.recovery_may_assist(v_orang) then return; end if;
  select * into l from public.recovery_ladder r where r.typed_id = v_id;
  return query
    select p.id, p.display_name, p.pintar_id,
           case when l.level = 3 then 'SUSPENDED'
                when l.locked_until is not null and l.locked_until > clock_timestamp() then 'LOCKED'
                else 'NORMAL' end,
           case when l.locked_until > clock_timestamp() then l.locked_until end,
           coalesce((select pp.reset_required from public.person_pins pp where pp.person_id = p.id), false),
           exists (select 1 from public.accounts a where a.person_id = p.id and a.kind = 'EMAIL')
      from public.persons p
     where p.id = v_orang;
end $$;
revoke all on function public.recovery_status(text) from public, anon;
grant execute on function public.recovery_status(text) to authenticated;

-- The assisted reset: the nearest authority's, audited with its reason; the ladder back to 0 and a new PIN required
-- (recovery_restore_core); and, the old PIN being replaced, every session of the person ended.
create or replace function public.admin_reset_recovery(p_person uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a record;
begin
  if p_person is not null and p_person = public.current_person_id() then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_SELF',
      message = 'nobody resets their own recovery with an administrator''s authority (D-101)';
  end if;
  if not public.recovery_may_assist(p_person) then
    raise exception using errcode = '42501',
      message = 'resetting a person''s recovery requires SYSTEM_ADMIN, or INSTITUTION_ADMIN of a school that has the person (D-101)';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a reset states its reason';
  end if;
  perform public.recovery_restore_core(p_person, 'ADMIN_RESET', btrim(p_reason));
  for a in select ac.auth_user_id from public.accounts ac where ac.person_id = p_person loop
    perform public.sesi_akhiri_orang(a.auth_user_id, 'KREDENSIAL_DIGANTI');
  end loop;
end $$;
revoke all on function public.admin_reset_recovery(uuid, text) from public, anon;
grant execute on function public.admin_reset_recovery(uuid, text) to authenticated;

-- The restore of 20261021100000, its audit row now naming the school whose admin acted (null for the Platform Admin
-- and for a person's own email recovery), so audit_write records that admin's role there.
create or replace function public.recovery_restore_core(p_person uuid, p_via text, p_reason text)
returns void
language plpgsql set search_path = public, pg_temp as $$
declare v_id text;
begin
  select p.pintar_id into v_id from public.persons p where p.id = p_person;
  if v_id is null then
    raise exception using errcode = 'PR040', detail = 'IDENTITY_NOT_FOUND', message = 'no such person';
  end if;
  insert into public.recovery_ladder (typed_id) values (v_id) on conflict do nothing;
  update public.recovery_ladder
     set level = 0, failures = 0, locked_until = null, last_failure_at = null, suspended_at = null, updated_at = clock_timestamp()
   where typed_id = v_id;
  update public.person_pins pp set reset_required = true where pp.person_id = p_person;
  perform public.audit_write('identity.recovery_restored', 'persons', p_person::text, public.recovery_assist_school(p_person),
    jsonb_build_object('via', p_via) || case when p_reason is null then '{}'::jsonb else jsonb_build_object('reason', p_reason) end);
end $$;
revoke all on function public.recovery_restore_core(uuid, text, text) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════ (3) the password guard
-- 20261116100000's guard, with one more step: a recovered password or a re-issued card replaces a lost credential, so
-- every session of it ends in the write's own transaction (before Auth's own sign-out of them, which follows the write).
create or replace function public.auth_password_write_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_purpose text; v_via text; v_person uuid; v_id text;
begin
  if new.encrypted_password is not distinct from old.encrypted_password
     or coalesce(new.encrypted_password, '') = '' then
    return new;
  end if;
  delete from public.password_write_permits p
   where p.auth_user_id = new.id and p.expires_at > clock_timestamp()
  returning p.purpose into v_purpose;
  if v_purpose is null then
    raise exception using errcode = 'PR040', detail = 'PASSWORD_WRITE_REFUSED',
      message = 'a password is set only through PINTAR''s own activation and recovery';
  end if;
  if v_purpose = 'ACTIVATION' then
    update public.account_setup s set password_set_at = clock_timestamp()
      from public.accounts a where a.id = s.account_id and a.auth_user_id = new.id and s.state = 'REQUIRED';
  elsif v_purpose = 'RECOVERY' then
    select g.via into v_via from public.password_recovery_grants g
     where g.auth_user_id = new.id order by g.created_at desc limit 1;
    delete from public.password_recovery_grants g where g.auth_user_id = new.id;
    if v_via = 'EMAIL' then
      select a.person_id, p.pintar_id into v_person, v_id
        from public.accounts a join public.persons p on p.id = a.person_id
       where a.auth_user_id = new.id and a.kind = 'EMAIL' limit 1;
      if exists (select 1 from public.recovery_ladder l where l.typed_id = v_id and l.level = 3) then
        perform public.recovery_restore_core(v_person, 'EMAIL_RECOVERY', null);
      end if;
    end if;
  end if;
  if v_purpose in ('RECOVERY', 'CARD_REISSUE') then
    perform public.sesi_akhiri_orang(new.id, 'KREDENSIAL_DIGANTI');
  end if;
  perform public.audit_write('identity.password_set', 'auth.users', new.id::text, null,
    jsonb_build_object('purpose', v_purpose));
  return new;
end $$;
revoke all on function public.auth_password_write_guard() from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════ (2) a second School Admin
-- The guard of 20261111100000, with one branch changed: INSTITUTION_ADMIN at a school's own node goes the way of every
-- school-scoped grant (an INSTITUTION_ADMIN over that node, and a person the school has), so a School Admin appoints
-- another there. INSTITUTION_ADMIN below a school stays the Platform Admin's, as do SYSTEM_ADMIN and an unscoped grant.
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
    if new.revoked_reason is distinct from old.revoked_reason and new.revoked_at is null then
      raise exception 'a revocation''s reason is written with the revocation, never on its own (D-093)';
    end if;
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
  if new.role = 'SYSTEM_ADMIN' or new.scope_node_id is null then
    if not public.is_system_admin() then
      raise exception 'only an active SYSTEM_ADMIN may grant % (INV-16)', new.role;
    end if;
  elsif new.role = 'INSTITUTION_ADMIN'
        and not exists (select 1 from public.org_nodes o where o.id = new.scope_node_id and o.kind = 'INSTITUTION') then
    if not public.is_system_admin() then
      raise exception 'only an active SYSTEM_ADMIN may grant % below a school''s own node; an INSTITUTION_ADMIN appoints another at the school itself (INV-16, D-101)', new.role;
    end if;
  else
    if not public.has_scope('INSTITUTION_ADMIN', new.scope_node_id) then
      raise exception 'grantor lacks INSTITUTION_ADMIN scope over the target node (INV-16)';
    end if;
    -- BOB-21 (D-049): a person the grant's own school already has -- its
    -- number, a role there, or a learner there. Never "visible to me".
    if not public.is_system_admin()
       and not exists (select 1 from public.institutional_identities ii
                        where ii.person_id = new.person_id and ii.institution_id = v_target_inst)
       and not exists (select 1 from public.role_assignments ra
                        where ra.person_id = new.person_id and ra.institution_id = v_target_inst
                          and ra.role <> 'SYSTEM_ADMIN' and ra.revoked_at is null and now() < ra.valid_until)
       and not exists (select 1 from public.enrollments e
                        where e.person_id = new.person_id and e.institution_id = v_target_inst
                          and e.status in ('PENDING', 'ACTIVE')) then
      raise exception using
        errcode = '42501',
        detail  = 'GRANT_NO_SCHOOL_RELATIONSHIP',
        message = 'a school-scoped role is granted only to a person the school already has: its institutional ID, '
               || 'a role there or a learner enrolment there (D-049)';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.role_assignments_guard() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════ the declarations
update public.client_rpc_registry r
   set authorization_kind = x.kind::public.rpc_authorization_kind, authorization_requirement = x.req, note = x.note
  from (values
    ('recovery_status', 'SCOPE', 'INSTITUTION_ADMIN',
     'BOB-28, D-101 (1): one PINTAR ID''s person and the state of their PIN recovery (NORMAL, LOCKED until, SUSPENDED; a '
     || 'new PIN awaited), for the Platform Admin or a School Admin of a school that has the person (its number, a role '
     || 'there, a learner there). A person the caller may not assist answers as an ID nobody holds; one''s own ID is '
     || 'refused RECOVERY_SELF. Never a PIN or a hash.'),
    ('admin_reset_recovery', 'SCOPE', 'INSTITUTION_ADMIN',
     'BOB-24, D-101 (1)(3): the nearest authority restores a person''s PIN recovery with a stated reason, audited with '
     || 'the school that acted; forces a new PIN and ends every session of the person. The Platform Admin, or a School '
     || 'Admin of a school that has the person; a Platform Admin only by another; never oneself (RECOVERY_SELF).')
  ) as x(fn, kind, req, note)
 where r.function_name = x.fn;

do $$
begin
  if has_function_privilege('authenticated', 'public.sesi_akhiri_orang(uuid,text)', 'execute')
     or has_function_privilege('authenticated', 'public.recovery_may_assist(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.recovery_assist_school(uuid)', 'execute') then
    raise exception 'D-101: an internal authority or session function is a client''s';
  end if;
  if (select count(*) from public.client_rpc_registry
       where function_name in ('recovery_status', 'admin_reset_recovery')
         and authorization_kind = 'SCOPE' and authorization_requirement = 'INSTITUTION_ADMIN') <> 2 then
    raise exception 'D-101: the lookup and the reset are not declared as the School Admin''s scope';
  end if;
  raise notice 'D-101 verified: the nearest authority recovers, never oneself; a replaced credential ends its sessions';
end $$;

-- L-1, Sharon's correction (AUTH-SUSPENDED-SIGNIN-CORRECTION.md §6b, §6c): a locked account is given no password by a
-- recovery grant or an activation.
--
--   * THE DEFECT: recovery_grant_permit (20261115100000) issued the one-minute password-write permit for any live grant,
--     and password_write_permit (20261112100000) did so for any activation whose set-up is required, without asking
--     whether the person is locked (suspended or closed; an anonymised person is closed). Auth's admin password write
--     ignores the ban. So a grant obtained before a suspension set a password during it, live at reinstatement.
--   * THE CORRECTION, AT USE (Sharon §6c: stateless, so it covers a grant issued in the moment after a lock commits and
--     any grant path added later):
--       - recovery_grant_permit: a grant lives only while no lock has covered any moment of its life. A person locked
--         now, or locked at any time since the grant was issued (a suspension since ended included), has no live grant:
--         the existing RECOVERY_GRANT_INVALID, the answer of an expired grant, so nothing new is told apart. A grant
--         issued after reinstatement lives as before.
--       - password_write_permit (ACTIVATION): a locked person's activation gives no permit. The refusal is PR040
--         ACCOUNT_LOCKED, read only by the service role's activation route, which answers it as it answers any locked
--         person in the wizard (401 BELUM_MASUK) and logs the reason without the identifier.
--   * NOT in auth_password_write_guard: an email correction legitimately clears the password through that guard.
--   * UNCHANGED: what suspension is, session ending, reinstatement, akun_kunci, the PIN ladder (a locked person who
--     keeps trying their right PIN climbs it; at level 3 the PIN must be reset after reinstatement, by design).
--   * The core stays on 4.0 objects only.

create or replace function public.recovery_grant_permit(p_token_hash text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_GRANT_INVALID', message = 'no live recovery grant';
  end if;
  select g.auth_user_id into v_user from public.password_recovery_grants g
   where g.token_hash = p_token_hash and g.expires_at > clock_timestamp()
     -- L-1 (Sharon §6b): no lock covered any moment of the grant's life
     and not exists (select 1 from public.accounts a join public.person_suspensions s on s.person_id = a.person_id
                      where a.auth_user_id = g.auth_user_id
                        and (s.ended_at is null or s.ended_at >= g.created_at));
  if v_user is null then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_GRANT_INVALID', message = 'no live recovery grant';
  end if;
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (v_user, 'RECOVERY', clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
  return v_user;
end $$;
revoke all on function public.recovery_grant_permit(text) from public, anon, authenticated;
grant execute on function public.recovery_grant_permit(text) to service_role;

create or replace function public.password_write_permit(p_auth_user uuid, p_purpose text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_purpose is distinct from 'ACTIVATION' then
    raise exception using errcode = '22023', message = 'password_write_permit: not a known purpose';
  end if;
  if not exists (select 1 from public.accounts a join public.account_setup s on s.account_id = a.id
                  where a.auth_user_id = p_auth_user and a.kind = 'EMAIL' and s.state = 'REQUIRED'
                    and not public.adalah_persona(a.person_id)) then
    raise exception using errcode = 'PR040', detail = 'SETUP_NOT_REQUIRED',
      message = 'a password is set at activation only while the set-up is required';
  end if;
  -- L-1 (Sharon §6b): a locked person's activation creates no credential
  if exists (select 1 from public.accounts a where a.auth_user_id = p_auth_user and public.orang_ditangguhkan(a.person_id)) then
    raise exception using errcode = 'PR040', detail = 'ACCOUNT_LOCKED',
      message = 'a locked account is given no password';
  end if;
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (p_auth_user, p_purpose, clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
end $$;
revoke all on function public.password_write_permit(uuid, text) from public, anon, authenticated;
grant execute on function public.password_write_permit(uuid, text) to service_role;

-- the migration's own check: both permits consult the lock, neither is reachable by a client, and the guard is untouched
do $$
declare r text;
begin
  if position('person_suspensions' in pg_get_functiondef('public.recovery_grant_permit(text)'::regprocedure)) = 0 then
    raise exception 'L-1: recovery_grant_permit does not consult the lock';
  end if;
  if position('orang_ditangguhkan' in pg_get_functiondef('public.password_write_permit(uuid,text)'::regprocedure)) = 0 then
    raise exception 'L-1: password_write_permit does not consult the lock';
  end if;
  if position('ditangguhkan' in pg_get_functiondef('public.auth_password_write_guard()'::regprocedure)) > 0
     or position('person_suspensions' in pg_get_functiondef('public.auth_password_write_guard()'::regprocedure)) > 0 then
    raise exception 'L-1: the lock belongs in the permits, not in the password guard';
  end if;
  foreach r in array array['anon', 'authenticated'] loop
    if has_function_privilege(r, 'public.recovery_grant_permit(text)', 'execute')
       or has_function_privilege(r, 'public.password_write_permit(uuid,text)', 'execute') then
      raise exception 'L-1: % may call a password permit', r;
    end if;
  end loop;
end $$;

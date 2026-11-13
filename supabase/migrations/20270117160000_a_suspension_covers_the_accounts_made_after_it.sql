-- L1-F2 · A suspension covers the accounts made after it, and L1-R2 · no password-write permit survives a lock
-- (docs/completion-4.1/SUSPENSION-COVERS-NEW-ACCOUNTS.md §2a, Sharon's three design points, and §2b, her L1-R2 design,
-- settled 12 Nov: the delete covers RECOVERY and ACTIVATION only).
--
-- (1) THE LOCK GOES ON THE LINK. One AFTER INSERT trigger on public.accounts locks that account's Auth user when the
--     person is suspended or closed (orang_ditangguhkan: an open person_suspensions row, CLOSED_AT_REQUEST included).
--     Every way of creating an account ends in that insert, so one trigger covers them all, and any added later.
--     - No authentication window: the account row is inserted by handle_new_auth_user inside Auth's own insert of the
--       user, in one transaction, so the lock commits with the user or not at all; and an Auth user that cannot be
--       linked is refused (PR010), so an unlinked user that could authenticate never exists.
--     - It locks the person's row FOR SHARE before reading their state. tangguhkan_akun holds that row FOR UPDATE, so
--       whichever comes second waits and sees the first.
-- (2) AUTH CANNOT CLEAR THE LOCK. A BEFORE UPDATE OF banned_until trigger on auth.users keeps the lock while the
--     linked person is suspended or closed. Reinstatement still works because aktifkan_kembali_akun and
--     buka_kembali_akun end the suspension row first and only then call akun_kunci(false).
-- (3) L1-R2. akun_kunci locks the person's accounts rows FOR UPDATE, in id order, and when it locks, deletes their
--     RECOVERY and ACTIVATION permits (a CARD_REISSUE permit is left alone: a school's reissue of a locked learner's
--     card is intended, and opens nothing until reinstatement). recovery_grant_permit and password_write_permit take
--     the account row FOR SHARE first and only then run their existing lock check, as a later statement. Either the
--     permit commits first and the delete removes it, or the issuer waits and its check sees the suspension.
--
-- LOCK ORDER (no cycle): the suspending act takes the person's row (FOR UPDATE), then the person's accounts rows (FOR
-- UPDATE, id order). The link trigger takes the person's row (FOR SHARE) inside an insert into accounts: it holds no
-- accounts row lock that the suspending act waits for (the new row is invisible to it until commit). The issuers take
-- only the account row (FOR SHARE).

-- ═══════════════════════════════════════════════════════════ (1) the lock on the link
create or replace function public.akun_baru_terkunci()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.auth_user_id is null then return null; end if;
  -- Sharon §2a point 2: the person's row first, against the suspending act's FOR UPDATE
  perform 1 from public.persons p where p.id = new.person_id for share;
  if public.orang_ditangguhkan(new.person_id) then
    update auth.users set banned_until = public.akun_terkunci_sampai() where id = new.auth_user_id;
  end if;
  return null;
end $$;
revoke all on function public.akun_baru_terkunci() from public, anon, authenticated, service_role;
create trigger _l1f2_accounts_terkunci after insert on public.accounts
  for each row execute function public.akun_baru_terkunci();

-- ═══════════════════════════════════════════════════════════ (2) Auth cannot clear the lock
create or replace function public.kunci_tetap_jaga()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.banned_until is distinct from public.akun_terkunci_sampai()
     and exists (select 1 from public.accounts a where a.auth_user_id = new.id and public.orang_ditangguhkan(a.person_id)) then
    new.banned_until := public.akun_terkunci_sampai();
  end if;
  return new;
end $$;
revoke all on function public.kunci_tetap_jaga() from public, anon, authenticated, service_role;
create trigger pintar_kunci_tetap_jaga before update of banned_until on auth.users
  for each row execute function public.kunci_tetap_jaga();

-- ═══════════════════════════════════════════════════════════ (3) L1-R2: no password-write permit survives a lock
create or replace function public.akun_kunci(p_person uuid, p_kunci boolean)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; n int := 0;
begin
  -- L1-R2 (Sharon §2b point 2): the person's accounts rows, FOR UPDATE, in id order; an issuer holding one FOR SHARE
  -- finishes first, and its permit is then committed and deleted below
  for a in select ac.auth_user_id from public.accounts ac where ac.person_id = p_person and ac.auth_user_id is not null
            order by ac.id for update of ac loop
    update auth.users set banned_until = case when p_kunci then public.akun_terkunci_sampai() else null end where id = a.auth_user_id;
    if p_kunci then n := n + public.sesi_akhiri_orang(a.auth_user_id, 'DITANGGUHKAN'); end if;
  end loop;
  -- L1-R2 (point 1): a lock leaves no RECOVERY or ACTIVATION permit; a CARD_REISSUE permit is not this lock's to take
  if p_kunci then
    delete from public.password_write_permits w
     where w.purpose in ('RECOVERY', 'ACTIVATION')
       and w.auth_user_id in (select ac.auth_user_id from public.accounts ac where ac.person_id = p_person and ac.auth_user_id is not null);
  end if;
  return n;
end $$;
revoke all on function public.akun_kunci(uuid, boolean) from public, anon, authenticated, service_role;

-- The issuers: the account row FOR SHARE first; then the existing check, as a later statement (READ COMMITTED: a fresh
-- snapshot, so a suspension that committed while this waited is seen). A refused issuer gives its ordinary answer.
create or replace function public.recovery_grant_permit(p_token_hash text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid; v_calon uuid;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_GRANT_INVALID', message = 'no live recovery grant';
  end if;
  -- L1-R2 (Sharon §2b point 2): whose grant it is, then that account row FOR SHARE, before the lock is read
  select g.auth_user_id into v_calon from public.password_recovery_grants g where g.token_hash = p_token_hash;
  perform 1 from public.accounts a where a.auth_user_id = v_calon for share;
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
  -- L1-R2 (Sharon §2b point 2): the account row FOR SHARE, before the lock is read
  perform 1 from public.accounts a where a.auth_user_id = p_auth_user for share;
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

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only. selftest/db/l1f2.sql and selftest/l1f2-balapan.test.ts prove the behaviour.
-- ---------------------------------------------------------------------------
do $$
declare v text;
begin
  if not exists (select 1 from pg_trigger where tgname = '_l1f2_accounts_terkunci' and tgrelid = 'public.accounts'::regclass)
     or not exists (select 1 from pg_trigger where tgname = 'pintar_kunci_tetap_jaga' and tgrelid = 'auth.users'::regclass) then
    raise exception 'L1-F2: the lock on the link or its guard is not in place';
  end if;
  v := pg_get_functiondef('public.akun_kunci(uuid,boolean)'::regprocedure);
  if position('for update of ac' in v) = 0 or position('''RECOVERY'', ''ACTIVATION''' in v) = 0 then
    raise exception 'L1-R2: akun_kunci does not lock the accounts or delete the two purposes';
  end if;
  if position('for share' in pg_get_functiondef('public.recovery_grant_permit(text)'::regprocedure)) = 0
     or position('for share' in pg_get_functiondef('public.password_write_permit(uuid,text)'::regprocedure)) = 0 then
    raise exception 'L1-R2: an issuer does not take the account row first';
  end if;
  if has_function_privilege('authenticated', 'public.akun_baru_terkunci()'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.kunci_tetap_jaga()'::regprocedure, 'execute') then
    raise exception 'L1-F2: a trigger function is client-callable';
  end if;
end $$;

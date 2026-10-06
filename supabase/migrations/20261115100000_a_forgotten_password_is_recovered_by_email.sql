-- BOB-27 (Gate 4; IDENTITY-4.0 §9, D-055(f), D-057(a), C8): A FORGOTTEN PASSWORD IS RECOVERED BY EMAIL.
--
-- «Lupa password?» → an email address or a username → a code, carried by PINTAR's own email → the code is checked →
-- a new password → every session of the person ends → this browser signs in with the new password → PINTAR tells the
-- owner their password changed. Answered alike for every name (C1, C3, D2; D-098(c)'s waits apply).
--
--   (1) recovery_code_target(name): who may be sent a recovery code: an EMAIL account whose set-up is COMPLETE (it
--       has a password), by its address or its username. Never a persona, a class card, or an account still in
--       activation (it activates instead; the screen says so to everybody). Service role only.
--   (2) A checked code signs NOBODY in. It gives a RECOVERY GRANT: single use, ten minutes, held by the browser as an
--       httpOnly cookie whose SHA-256 alone is stored here (password_recovery_grants). The grant allows exactly one
--       thing, a new password (IDENTITY-4.0 §3: recovery only permits setting a new password). Gate 5's PIN recovery
--       issues the same grant (via 'PIN').
--   (3) recovery_grant_permit(hash): a live grant gives the one-minute RECOVERY password permit (BOB-26's door, the
--       only way a password hash is written). The guard on auth.users consumes the permit, and on a RECOVERY write
--       also ends the person's grants, in the hash's own transaction. Auth's admin endpoint then ends every session of
--       the person (D-055(f): other sessions ended; failures and lockouts end nothing).

-- ═══════════════════════════════════════════════════════ (1) who may recover
create function public.recovery_code_target(p_identitas text)
returns table (auth_user_id uuid, nama text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v text := lower(btrim(coalesce(p_identitas, '')));
begin
  if v = '' or length(v) > 320 then return; end if;
  return query
    select a.auth_user_id, p.display_name
      from public.accounts a
      join public.account_setup s on s.account_id = a.id and s.state = 'COMPLETE'
      join public.persons p on p.id = a.person_id
      join auth.users u on u.id = a.auth_user_id
     where a.kind = 'EMAIL' and not public.adalah_persona(a.person_id)
       and (lower(u.email) = v
            or (position('@' in v) = 0
                and exists (select 1 from public.person_usernames pu where pu.person_id = a.person_id and pu.username = v)))
     limit 1;
end $$;

-- ═══════════════════════════════════════════════════════ (2) the recovery grant
create table public.password_recovery_grants (
  token_hash    text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  auth_user_id  uuid not null references auth.users (id) on delete cascade,
  via           text not null check (via in ('EMAIL', 'PIN')),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null
);
create index password_recovery_grants_user on public.password_recovery_grants (auth_user_id);
alter table public.password_recovery_grants enable row level security;
revoke all on table public.password_recovery_grants from public, anon, authenticated, service_role;
comment on table public.password_recovery_grants is
  'BOB-27 (Gate 4): a checked recovery code''s grant, single use, ten minutes; the SHA-256 of the browser''s httpOnly '
  'token only. Allows one new password and nothing else. Written by recovery_grant_issue, read by recovery_grant_permit, '
  'ended by the password guard.';

create function public.recovery_grant_issue(p_auth_user uuid, p_token_hash text, p_via text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or p_via is null or p_via not in ('EMAIL', 'PIN') then
    raise exception using errcode = '22023', message = 'recovery_grant_issue: a token''s SHA-256 and EMAIL or PIN';
  end if;
  if not exists (select 1 from public.accounts a join public.account_setup s on s.account_id = a.id
                  where a.auth_user_id = p_auth_user and a.kind = 'EMAIL' and s.state = 'COMPLETE'
                    and not public.adalah_persona(a.person_id)) then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_NOT_ELIGIBLE',
      message = 'a password is recovered only for an active email account';
  end if;
  delete from public.password_recovery_grants where auth_user_id = p_auth_user;
  insert into public.password_recovery_grants (token_hash, auth_user_id, via, expires_at)
  values (p_token_hash, p_auth_user, p_via, clock_timestamp() + interval '10 minutes');
  perform public.audit_write('identity.recovery_verified', 'auth.users', p_auth_user::text, null,
    jsonb_build_object('via', p_via, 'outcome', 'GRANTED'));
end $$;

-- ═══════════════════════════════════════════ (3) a live grant gives the permit
alter table public.password_write_permits drop constraint password_write_permits_purpose_check;
alter table public.password_write_permits add constraint password_write_permits_purpose_check
  check (purpose in ('ACTIVATION', 'RECOVERY'));

create function public.recovery_grant_permit(p_token_hash text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_GRANT_INVALID', message = 'no live recovery grant';
  end if;
  select g.auth_user_id into v_user from public.password_recovery_grants g
   where g.token_hash = p_token_hash and g.expires_at > clock_timestamp();
  if v_user is null then
    raise exception using errcode = 'PR040', detail = 'RECOVERY_GRANT_INVALID', message = 'no live recovery grant';
  end if;
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (v_user, 'RECOVERY', clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
  return v_user;
end $$;

-- THE GUARD, as BOB-26 wrote it, and a RECOVERY write also ends the person's grants (single use) and is recorded
-- as a recovery.
create or replace function public.auth_password_write_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_purpose text;
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
    delete from public.password_recovery_grants g where g.auth_user_id = new.id;
  end if;
  perform public.audit_write('identity.password_set', 'auth.users', new.id::text, null,
    jsonb_build_object('purpose', v_purpose));
  return new;
end $$;

revoke all on function public.recovery_code_target(text) from public, anon, authenticated;
grant execute on function public.recovery_code_target(text) to service_role;
revoke all on function public.recovery_grant_issue(uuid, text, text) from public, anon, authenticated;
grant execute on function public.recovery_grant_issue(uuid, text, text) to service_role;
revoke all on function public.recovery_grant_permit(text) from public, anon, authenticated;
grant execute on function public.recovery_grant_permit(text) to service_role;
revoke all on function public.auth_password_write_guard() from public, anon, authenticated, service_role;

-- The three signed-out doors, declared as Gate 3's are: the public path and the handler it is rewritten to.
insert into public.public_surface_registry (surface, kind, object, note, parent) values
  ('recovery_code', 'ROUTE', '/masuk/lupa/kode',
   'BOB-27: ask for a password recovery code with an email or a username. POST only, same origin only. The same answer '
   || 'for every name (C1); D-098(c)''s waits first, alike for every name; only an active (COMPLETE) email account is sent a '
   || 'code, after the answer has gone. Listed in the proxy''s PUBLIC_PATHS.', null),
  ('recovery_code_api', 'ENDPOINT', '/api/masuk/lupa/kode',
   'The handler /masuk/lupa/kode is rewritten to: email_sending_wait, code_request_pace, recovery_code_target, '
   || 'email_resend_seconds and BOB-25''s send, service-role. Signed out, the proxy refuses this spelling itself.', 'recovery_code'),
  ('recovery_check', 'ROUTE', '/masuk/lupa/periksa',
   'BOB-27: type the recovery code. POST only, same origin only. One code (KODE_TIDAK_COCOK) for wrong, expired, used or '
   || 'nobody''s; counted per name (CODE_VERIFY). A match signs nobody in: it gives the browser a ten-minute, single-use '
   || 'recovery grant (httpOnly). Listed in PUBLIC_PATHS.', null),
  ('recovery_check_api', 'ENDPOINT', '/api/masuk/lupa/periksa',
   'The handler /masuk/lupa/periksa is rewritten to: identity_attempt and identity_attempt_settle (CODE_VERIFY), '
   || 'recovery_code_target and recovery_grant_issue, service-role, and Auth''s verifyOtp on a client that keeps no '
   || 'session. Signed out, the proxy refuses this spelling itself.', 'recovery_check'),
  ('recovery_password', 'ROUTE', '/masuk/lupa/password',
   'BOB-27: the new password, with the recovery grant. POST only, same origin only. Every session of the person ends; '
   || 'this browser signs in with the new password; the owner is told by email. Listed in PUBLIC_PATHS.', null),
  ('recovery_password_api', 'ENDPOINT', '/api/masuk/lupa/password',
   'The handler /masuk/lupa/password is rewritten to: recovery_grant_permit, service-role, and Auth''s admin password '
   || 'write and password sign-in. Signed out, the proxy refuses this spelling itself.', 'recovery_password');

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare r text;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.password_recovery_grants'::regclass)
     or exists (select 1 from pg_policy where polrelid = 'public.password_recovery_grants'::regclass) then
    raise exception 'BOB-27: password_recovery_grants must have RLS and no policy';
  end if;
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if has_table_privilege(r, 'public.password_recovery_grants', 'select') then
      raise exception 'BOB-27: % can read the recovery grants', r;
    end if;
  end loop;
  foreach r in array array['anon', 'authenticated'] loop
    if has_function_privilege(r, 'public.recovery_code_target(text)', 'execute')
       or has_function_privilege(r, 'public.recovery_grant_issue(uuid,text,text)', 'execute')
       or has_function_privilege(r, 'public.recovery_grant_permit(text)', 'execute') then
      raise exception 'BOB-27: % can reach a recovery function', r;
    end if;
  end loop;
  if not exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'pintar_password_write_guard' and tgenabled <> 'D') then
    raise exception 'BOB-27: the password write guard is not on auth.users';
  end if;
end $$;

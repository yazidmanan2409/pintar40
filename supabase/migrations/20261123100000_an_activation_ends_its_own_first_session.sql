-- D-102 (owner ruling, 5 Oct): AN ACTIVATION ENDS ITS OWN FIRST SESSION.
--
-- The activation wizard runs in the session the emailed code began. When it sets the person's first password, Auth
-- ends that session and the route signs the person straight back in (src/app/api/aktifkan/password/route.ts), but
-- PINTAR's record of the wizard's session stayed open, and PostgREST's pre-request refuses only an ended one: a token
-- issued before the first password was still served for the rest of its life, up to an hour (the Golden School's
-- finding, JOURNEY-LOG item 33).
--
-- The one change: when the password guard takes an ACTIVATION write, it ends every session of the person through
-- D-101's own core (sesi_akhiri_orang), in the same transaction as the hash, with a reason of its own,
-- PASSWORD_PERTAMA: a first password, not a replaced credential (D-101(3)). A write that does not happen ends
-- nothing: no permit or an expired one (refused here), a password Auth refuses (never written), a step before the
-- password. The route's sign-in right after is the new session, untouched. Everything else in the guard is
-- 20261122100000's, verbatim; no other function, route or screen changes.

-- ═══════════════════════════════════════════════════════════════ (1) the reason a session ended
alter table public.device_sessions drop constraint device_sessions_ended_reason_check;
alter table public.device_sessions add constraint device_sessions_ended_reason_check
  check (ended_reason in ('PIN_GAGAL', 'KUNCI_HABIS', 'KELUAR', 'KELUAR_SEMUA', 'KREDENSIAL_DIGANTI', 'PASSWORD_PERTAMA'));

-- ═══════════════════════════════════════════════════════════════ (2) the password guard
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
  elsif v_purpose = 'ACTIVATION' then
    perform public.sesi_akhiri_orang(new.id, 'PASSWORD_PERTAMA');
  end if;
  perform public.audit_write('identity.password_set', 'auth.users', new.id::text, null,
    jsonb_build_object('purpose', v_purpose));
  return new;
end $$;
revoke all on function public.auth_password_write_guard() from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════ verified
do $$
begin
  if pg_get_functiondef('public.auth_password_write_guard()'::regprocedure)
       !~ 'elsif v_purpose = ''ACTIVATION'' then\s+perform public\.sesi_akhiri_orang\(new\.id, ''PASSWORD_PERTAMA''\);' then
    raise exception 'D-102: the password guard does not end the activation''s sessions at the first password';
  end if;
  if pg_get_constraintdef((select oid from pg_constraint where conname = 'device_sessions_ended_reason_check'))
       !~ 'PASSWORD_PERTAMA' then
    raise exception 'D-102: device_sessions does not accept the first password as a reason';
  end if;
  if has_function_privilege('authenticated', 'public.auth_password_write_guard()', 'execute') then
    raise exception 'D-102: the password guard is a client''s';
  end if;
  raise notice 'D-102 verified: an activation''s first password ends the session it began in';
end $$;

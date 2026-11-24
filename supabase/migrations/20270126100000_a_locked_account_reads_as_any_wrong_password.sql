-- CI-2 (ruling 98; OD-1, ruling 100). A LOCKED ACCOUNT READS, AT AUTH ITSELF, AS ANY WRONG PASSWORD.
--
-- L-78 (audit 79; Sharon, AUDIT79-L78.md): a closed or suspended account was banned in Supabase Auth (auth.users.banned_until,
-- 20270116130000), and Auth's token endpoint, public with the anon key, answered «user_banned» before it checked the password.
-- Anyone who knew an address, or a card number (card-<n>@…), learnt the account's state without its secret.
--
-- The fix, Sharon's option (iii), with her binding pre-build review (CI-2-PREBUILD-918ed195.md):
--   * a lock ROTATES the account's Auth password to a random secret of the same bcrypt cost (so a right and a wrong password
--     cost Auth the same), clears its one-time tokens and revokes its sessions and refresh tokens (akun_rotasi). Nothing is
--     banned: every password reads Auth's ordinary «invalid_credentials», for an address and a card alike;
--   * the per-request check (pintar_permintaan.periksa, V6) is unchanged: a locked person's surviving token answers nothing;
--   * ruling 100: reinstatement and reopening re-key again, so a password, PIN or link set during the lock is never a way
--     back in. A staff member then makes a new password by recovery; a learner gets a new card and PIN from the school's
--     re-issue, which writes the derived Auth password (authorize_card_reissue + /api/akun/kartu-kelas, unchanged);
--   * an account made for a locked person is rotated at once (pintar_kunci_tetap_jaga's re-ban is dropped);
--   * admin_akun_dapat_masuk reads PINTAR's own lock, never banned_until; the anonymisation rotates, revokes and clears;
--   * F-4: every ban of today is lifted, and every account of a locked person rotated, bounded to the count read first.
-- Only Auth credential, token and session columns are written: no person, suspension, request, audit or result row changes
-- (one audit row records the conversion). Who may lock and unlock is unchanged: the same functions decide.

-- 1. The rotation: one place, for every lock, unlock and anonymisation
create or replace function public.akun_rotasi(p_auth_user uuid, p_alasan text)
 returns integer
 language plpgsql
 security definer
 set search_path = public, pg_temp as $$
declare v_biaya int; v_hash text; n int := 0;
begin
  if p_auth_user is null then return 0; end if;
  -- the account's own bcrypt cost (GoTrue's is 10), so Auth spends on the random secret what it spends on the real one
  select coalesce(nullif(substring(u.encrypted_password from '^\$2[aby]\$([0-9]{2})\$'), '')::int, 10)
    into v_biaya from auth.users u where u.id = p_auth_user for no key update;
  if not found then return 0; end if;
  v_hash := extensions.crypt(encode(extensions.gen_random_bytes(32), 'hex'), extensions.gen_salt('bf', greatest(4, least(v_biaya, 15))));
  -- the password guard knows this write by the GUC, for this one user, in this transaction only
  perform set_config('pintar.kunci_rotasi', p_auth_user::text, true);
  update auth.users u set encrypted_password = v_hash, recovery_token = '', confirmation_token = '', email_change_token_new = '',
         email_change_token_current = '', reauthentication_token = '', phone_change_token = '', email_change = '',
         email_change_confirm_status = 0
   where u.id = p_auth_user;
  perform set_config('pintar.kunci_rotasi', '', true);
  -- Sharon (a) 1: a link sent before the lock fails after it
  delete from auth.one_time_tokens t where t.user_id = p_auth_user;
  delete from auth.flow_state f where f.user_id = p_auth_user;
  -- every session (its device_sessions row ended, PINTAR's own record) and every refresh token
  n := public.sesi_akhiri_orang(p_auth_user, p_alasan);
  delete from auth.refresh_tokens t where t.user_id = p_auth_user::text;
  return n;
end $$;
revoke all on function public.akun_rotasi(uuid, text) from public, anon, authenticated, service_role;

-- 2. The password guard: the rotation's own write passes; nothing else changes
create or replace function public.auth_password_write_guard() 
 returns trigger 
 language plpgsql 
 security definer 
 set search_path = public, pg_temp as $$
declare v_purpose text; v_via text; v_person uuid; v_id text;
begin
  if new.encrypted_password is not distinct from old.encrypted_password
     or coalesce(new.encrypted_password, '') = '' then
    return new;
  end if;
  -- CI-2 (ruling 98): the lock's own rotation (akun_rotasi), a random secret nobody holds and no one is told. It needs no
  -- permit and is no password set: no identity.password_set row, no session ended here (the rotation ends them itself)
  if current_setting('pintar.kunci_rotasi', true) = new.id::text then
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

-- 3. The lock and the unlock: both rotate (ruling 100: the unlock re-keys, so nothing set during the lock survives it)
create or replace function public.akun_kunci(p_person uuid, p_kunci boolean)
 returns integer
 language plpgsql
 security definer
 set search_path = public, pg_temp as $$
declare a record; n int := 0;
begin
  -- L1-R2 and L1-F2, unchanged: the person's auth.users rows, then their accounts rows FOR UPDATE, in id order
  perform 1 from auth.users u where u.id in (select ac.auth_user_id from public.accounts ac where ac.person_id = p_person)
   order by u.id for no key update;
  for a in select ac.auth_user_id from public.accounts ac where ac.person_id = p_person and ac.auth_user_id is not null
            order by ac.id for update of ac loop
    n := n + public.akun_rotasi(a.auth_user_id, case when p_kunci then 'DITANGGUHKAN' else 'KREDENSIAL_DIGANTI' end);
  end loop;
  -- L1-R2 (point 1), unchanged: a lock leaves no RECOVERY or ACTIVATION permit; a CARD_REISSUE permit is not this lock's
  if p_kunci then
    delete from public.password_write_permits w
     where w.purpose in ('RECOVERY', 'ACTIVATION')
       and w.auth_user_id in (select ac.auth_user_id from public.accounts ac where ac.person_id = p_person and ac.auth_user_id is not null);
  end if;
  return n;
end $$;

-- 4. An account made (or moved) for a locked person: rotated and revoked at once (Sharon addition 1). The re-ban guard goes
create or replace function public.akun_baru_terkunci()
 returns trigger
 language plpgsql
 security definer
 set search_path = public, pg_temp as $$
begin
  if new.auth_user_id is null then return null; end if;
  if tg_op = 'UPDATE' and new.auth_user_id is not distinct from old.auth_user_id and new.person_id is not distinct from old.person_id then
    return null;
  end if;
  -- Sharon §2a point 2, unchanged: the person's row first, against the suspending act's FOR UPDATE
  perform 1 from public.persons p where p.id = new.person_id for share;
  if public.orang_ditangguhkan(new.person_id) then
    perform public.akun_rotasi(new.auth_user_id, 'DITANGGUHKAN');
  end if;
  return null;
end $$;
drop trigger if exists _l1f2_accounts_terkunci on public.accounts;
create trigger _l1f2_accounts_terkunci after insert or update of auth_user_id, person_id on public.accounts
  for each row execute function public.akun_baru_terkunci();
drop trigger if exists pintar_kunci_tetap_jaga on auth.users;
drop function if exists public.kunci_tetap_jaga();

-- 5. Z8 item 8's reader: PINTAR's own lock (Sharon addition 2). admin_dapat_dipakai's person checks are unchanged
create or replace function public.admin_akun_dapat_masuk(p_person uuid)
 returns boolean
 language sql
 stable security definer
 set search_path = public, pg_temp as $$
  select exists (select 1 from public.accounts ac join auth.users u on u.id = ac.auth_user_id
                  where ac.person_id = p_person and not public.orang_ditangguhkan(p_person))
$$;

-- 6. The anonymisation (Sharon (d)): every account rotated, revoked and cleared; nothing reaches the unlock
create or replace function public.hapus_data_pribadi(p_request uuid, p_catatan text) 
 returns jsonb 
 language plpgsql 
 security definer 
 set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); r public.account_requests; v_pid text; a record; v_foto boolean; v_lama text;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  -- L1-F4 (Sharon, result review of 3a63a2b2): the person row FIRST, before the request and before any check, so a
  -- reopen (which takes the same row first) and this deletion never pass each other
  perform 1 from public.persons p where p.id = (select q.person_id from public.account_requests q where q.id = p_request) for update;
  select * into r from public.account_requests q where q.id = p_request for update;
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 2): a request already carried out answers with its person and
  -- writes nothing, so the route's second press removes a photo file the first could not
  if r.id is not null and r.kind = 'DELETE_PERSONAL_DATA' and r.status = 'DONE'
     and exists (select 1 from public.persons p where p.id = r.person_id and p.anonymized_at is not null) then
    return jsonb_build_object('ok', true, 'orang', r.person_id, 'sudah', true);
  end if;
  if r.id is null or r.kind <> 'DELETE_PERSONAL_DATA' or r.status not in ('RECEIVED', 'IN_PROGRESS') then
    perform public.akun_tolak('ACCOUNT_REQUEST_INVALID');
  end if;
  select p.pintar_id, p.photo_path is not null into v_pid, v_foto from public.persons p where p.id = r.person_id for update;
  if not exists (select 1 from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null and s.category = 'CLOSED_AT_REQUEST') then
    perform public.akun_tolak('ACCOUNT_NOT_CLOSED');
  end if;
  -- L1-F4 (Sharon, interim review of ea3c4b6f): under this lock, history is told from a live attachment by what is
  -- live now and what the closure recorded, never by timestamps. A live enrolment or placement cannot be history
  -- (minta_akun refuses a closure while one exists, under the same lock); a live role, open transfer or evaluator
  -- grant is history only if the closure listed it. A closure with no record is read as having held nothing.
  if exists (select 1 from public.enrollments e where e.person_id = r.person_id and e.status in ('PENDING', 'ACTIVE'))
     or exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
                 where e.person_id = r.person_id and m.valid_to is null and e.status in ('PENDING', 'ACTIVE'))
     or exists (select 1 from public.person_suspensions x
                 cross join lateral (select coalesce(x.dipegang_saat_tutup, '{"peran":[],"pindah":[],"penilai":[]}'::jsonb) d) h
                 cross join lateral (select public.orang_dipegang(r.person_id) k) kini
                 where x.person_id = r.person_id and x.ended_at is null and x.category = 'CLOSED_AT_REQUEST'
                   and (exists (select 1 from jsonb_array_elements_text(kini.k -> 'peran') i where not (h.d -> 'peran') ? i.value)
                        or exists (select 1 from jsonb_array_elements_text(kini.k -> 'pindah') i where not (h.d -> 'pindah') ? i.value)
                        or exists (select 1 from jsonb_array_elements_text(kini.k -> 'penilai') i where not (h.d -> 'penilai') ? i.value))) then
    perform public.akun_tolak('ACCOUNT_LIVE_ATTACHMENT');
  end if;
  update public.persons set display_name = v_pid, photo_path = null, anonymized_at = now() where id = r.person_id;
  -- L1-F4 (Sharon; the Chief Architect): no request to reopen is left that could only be refused
  update public.account_requests q set status = 'DECLINED', decided_by = v_actor, decided_at = now(),
         decision_note = 'Data pribadi orang ini sudah dihapus; akunnya tidak dibuka kembali.'
   where q.person_id = r.person_id and q.kind = 'REOPEN' and q.status in ('RECEIVED', 'IN_PROGRESS');
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 1 on 6faef690): a class card's address (card-<number>@…) is not
  -- personal data and its own guard refuses any change, so only the email accounts are retired
  for a in select ac.id, ac.auth_user_id from public.accounts ac
            where ac.person_id = r.person_id and ac.auth_user_id is not null and ac.kind = 'EMAIL' loop
    perform set_config('pintar.anonimkan_email', a.id::text, true);
    select lower(u.email) into v_lama from auth.users u where u.id = a.auth_user_id;
    update auth.users set email = 'anonim-' || a.auth_user_id::text || '@pintar.invalid', email_change = '',
                          raw_user_meta_data = '{}'::jsonb where id = a.auth_user_id;
    -- GoTrue keeps the address again in the identity; it is not synced by the update above
    update auth.identities set identity_data = jsonb_build_object('sub', a.auth_user_id::text,
                                                                  'email', 'anonim-' || a.auth_user_id::text || '@pintar.invalid')
     where user_id = a.auth_user_id;
    -- CORRECTED IN PLACE (undeployed; Sharon's addendum on dc84af22): GoTrue's own copies of the address. Its audit log
    -- keeps the event and loses the address; a one-time token (recovery, confirmation) is removed, since it is useless
    -- for an address that no longer exists.
    update auth.audit_log_entries x
       set payload = ((x.payload::jsonb - 'actor_username' - 'actor_name')
                   || case when jsonb_typeof(x.payload::jsonb -> 'traits') = 'object'
                           then jsonb_build_object('traits', (x.payload::jsonb -> 'traits') - 'user_email' - 'email')
                           else '{}'::jsonb end)::json,
           -- CORRECTED IN PLACE (undeployed; Sharon's re-verification at 435a2856): GoTrue's record of where each event
           -- came from is the person's too; the IP goes, the event stays
           ip_address = ''
     where x.payload ->> 'actor_id' = a.auth_user_id::text or x.payload -> 'traits' ->> 'user_id' = a.auth_user_id::text
        -- (same correction) an entry naming the address under neither id, a failed sign-in, is found by the address
        -- itself, read before it was replaced
        or lower(x.payload -> 'traits' ->> 'user_email') = v_lama or lower(x.payload ->> 'actor_username') = v_lama;
    -- a session left behind keeps the device's IP and browser; the account is closed, so none is needed
    delete from auth.refresh_tokens t where t.user_id = a.auth_user_id::text;
    delete from auth.sessions s where s.user_id = a.auth_user_id;
    delete from auth.one_time_tokens t where t.user_id = a.auth_user_id;
  end loop;
  -- CI-2 (Sharon (d)): every account of the person, a class card's too, is rotated, its one-time tokens cleared and its
  -- sessions and refresh tokens revoked, as any lock does (the closure already did; this holds whatever happened since).
  -- The person stays locked for ever (L1-F4): nothing here reaches the unlock
  for a in select ac.id, ac.auth_user_id from public.accounts ac
            where ac.person_id = r.person_id and ac.auth_user_id is not null order by ac.id loop
    perform public.akun_rotasi(a.auth_user_id, 'DITANGGUHKAN');
  end loop;
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 3): the name and email where else PINTAR copied them. Each address
  -- becomes an address of no one, unique per row; a name becomes the PINTAR ID; an import row keeps no payload. The audit
  -- log keeps its history of corrections (INV-18), as the person is told.
  update public.account_activation_grants g
     set email = 'anonim-' || g.id::text || '@pintar.invalid',
         display_name = case when g.display_name is null then null else v_pid end
   where g.person_id = r.person_id
      or g.consumed_by in (select ac.auth_user_id from public.accounts ac where ac.person_id = r.person_id);
  update public.email_corrections c
     set old_email = 'anonim-' || c.id::text || '-lama@pintar.invalid', new_email = 'anonim-' || c.id::text || '@pintar.invalid'
   where c.person_id = r.person_id;
  update public.card_conversions c set new_email = 'anonim-' || c.id::text || '@pintar.invalid' where c.person_id = r.person_id;
  update public.import_rows ir set payload = '{}'::jsonb where ir.person_id = r.person_id;
  -- what the person wrote with a request to reopen (owner ruling 2) is theirs too
  update public.account_requests q set pesan = null where q.person_id = r.person_id and q.pesan is not null;
  perform set_config('pintar.identity_correction', 'on', true);
  update public.person_usernames un set username = 'anonim.' || lower(v_pid) where un.person_id = r.person_id;
  perform set_config('pintar.identity_correction', '', true);
  -- B1 (blocker 3): the person's sign-in record keeps kind, instant and person; its origin and hash go
  perform set_config('pintar.akuntabilitas_anonimkan', r.person_id::text, true);
  update public.accountability_events e set network_origin = null, identifier_hash = null
   where e.person_id = r.person_id and (e.network_origin is not null or e.identifier_hash is not null);
  perform set_config('pintar.akuntabilitas_anonimkan', '', true);
  update public.account_requests set status = 'DONE', decided_by = v_actor, decided_at = now(),
         decision_note = nullif(btrim(coalesce(p_catatan, '')), '') where id = r.id;
  perform public.audit_write('account.personal_data_deleted', 'persons', r.person_id::text, null,
    jsonb_build_object('person_id', r.person_id, 'request_id', r.id, 'removed', jsonb_build_array('name', 'sign_in_email', 'username', 'copies', 'sign_in_origins')
                         || case when v_foto then jsonb_build_array('photo') else '[]'::jsonb end,
                       'kept', jsonb_build_array('results', 'certificates_as_issued', 'audit_log'),
                       'actor_role', public.audit_actor_role(null)));
  -- the person, so the server route that called this removes every file in their photo folder from storage
  -- (Sharon §16 finding 2: a database cannot delete a stored file; storage.protect_delete refuses it)
  return jsonb_build_object('ok', true, 'orang', r.person_id);
end $$;

-- 7. The Admin PINTAR's account view: whether the person holds a class card (Daisy CI2-KATA §1 and §2)
create or replace function public.akun_keadaan(p_person uuid) 
 returns jsonb 
 language plpgsql 
 stable security definer 
 set search_path = public, pg_temp as $$
begin
  if public.current_person_id() is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  return jsonb_build_object(
    'person_id', p_person,
    'nama', (select p.display_name from public.persons p where p.id = p_person),
    'pintar_id', (select p.pintar_id from public.persons p where p.id = p_person),
    'anonim', (select p.anonymized_at is not null from public.persons p where p.id = p_person),
    -- CI-2 (Daisy CI2-KATA §1 and §2): a learner's class card, so the confirmation names the fresh credential that applies
    'kartu', exists (select 1 from public.accounts a where a.person_id = p_person and a.kind = 'CLASSROOM_CARD'),
    'tangguh', (select jsonb_build_object('kategori', s.category, 'sejak', s.started_at, 'catatan', s.note)
                  from public.person_suspensions s where s.person_id = p_person and s.ended_at is null));
end $$;


-- 7b. F-5 (PINTAR's /masuk/lupa and /aktifkan routes): with no ban, Auth would accept a code for a locked person, so
--     PINTAR's own code targets leave a locked person out. A code request then sends nothing, and a code typed reads
--     exactly as for an address nobody has: the ordinary answer, as Auth's «user_banned» gave before
create or replace function public.recovery_code_target(p_identitas text)
 returns table(auth_user_id uuid, nama text)
 language plpgsql
 stable security definer
 set search_path = public, pg_temp as $$
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
       -- CI-2 F-5: a locked person is nobody to send a code to or check one for (Auth no longer refuses them itself)
       and not public.orang_ditangguhkan(a.person_id)
       and (lower(u.email) = v
            or (position('@' in v) = 0
                and exists (select 1 from public.person_usernames pu where pu.person_id = a.person_id and pu.username = v)))
     limit 1;
end $$;

create or replace function public.activation_code_target(p_email text)
 returns table(auth_user_id uuid, nama text)
 language sql
 stable security definer
 set search_path = public, pg_temp as $$
  select a.auth_user_id, p.display_name
    from auth.users u
    join public.accounts a on a.auth_user_id = u.id and a.kind = 'EMAIL'
    join public.account_setup s on s.account_id = a.id and s.state = 'REQUIRED'
    join public.persons p on p.id = a.person_id
   where lower(u.email) = lower(btrim(coalesce(p_email, ''))) and btrim(coalesce(p_email, '')) <> ''
     and not public.adalah_persona(a.person_id)
     -- CI-2 F-5: as recovery_code_target
     and not public.orang_ditangguhkan(a.person_id)
   limit 1
$$;

-- ADR-0021: every function this file creates revokes PUBLIC's EXECUTE here; each keeps exactly the grants it had
revoke all on function public.auth_password_write_guard() from public, anon, authenticated, service_role;
revoke all on function public.akun_kunci(uuid, boolean) from public, anon, authenticated, service_role;
revoke all on function public.akun_baru_terkunci() from public, anon, authenticated, service_role;
revoke all on function public.admin_akun_dapat_masuk(uuid) from public, anon, authenticated;
revoke all on function public.hapus_data_pribadi(uuid, text) from public, anon;
revoke all on function public.akun_keadaan(uuid) from public, anon;
revoke all on function public.recovery_code_target(text) from public, anon, authenticated;
revoke all on function public.activation_code_target(text) from public, anon, authenticated;

-- 8. F-4: today's bans lifted, and every account of a locked person rotated and revoked; bounded to the count read first.
--    Staging only today (synthetic accounts); production has no ban (verified under PR-22, not here)
do $$
declare v_dikunci int; v_dilarang int; v_n int := 0; a record;
begin
  select count(*) into v_dikunci from public.accounts ac join auth.users u on u.id = ac.auth_user_id where public.orang_ditangguhkan(ac.person_id);
  select count(*) into v_dilarang from auth.users u where u.banned_until is not null;
  update auth.users set banned_until = null where banned_until is not null;
  for a in select ac.auth_user_id from public.accounts ac join auth.users u on u.id = ac.auth_user_id
            where public.orang_ditangguhkan(ac.person_id) order by ac.id loop
    perform public.akun_rotasi(a.auth_user_id, 'DITANGGUHKAN');
    v_n := v_n + 1;
  end loop;
  if v_n <> v_dikunci then
    raise exception 'CI-2 F-4: % accounts of locked persons were read and % rotated', v_dikunci, v_n;
  end if;
  if exists (select 1 from auth.users u where u.banned_until is not null) then
    raise exception 'CI-2 F-4: an Auth user is still banned';
  end if;
  if exists (select 1 from auth.refresh_tokens t join public.accounts ac on ac.auth_user_id::text = t.user_id::text
              where t.revoked is not true and public.orang_ditangguhkan(ac.person_id)) then
    raise exception 'CI-2 F-4: a locked person keeps a live refresh token';
  end if;
  perform public.audit_write('account.lock_converted', 'auth.users', '20270126100000', null,
    jsonb_build_object('rotated', v_n, 'bans_lifted', v_dilarang, 'migration', '20270126100000'));
end $$;

-- ---------------------------------------------------------------------------
-- PLATFORM SUSPENSION AND L1–L4 (owner, 9 Nov: «Easy to join. Easy to leave. Never held hostage.»; §5b and §9 of
-- ACCOUNT-LIFECYCLE-INVENTORY.md). One mechanism, four uses that never read alike:
--
-- SUSPENSION (§5b), the PINTAR Administrator only: tangguhkan_akun(person, category, note) with a category (SECURITY,
--   ADMINISTRATIVE, OTHER: OTHER needs a 10–300 note; owner ruling 3, 9 Nov: no DISCIPLINARY, since a school's discipline
--   is never a platform-wide suspension) is enforced at once: every session of the person's
--   accounts ends (sesi_akhiri_orang, recorded DITANGGUHKAN), the Auth users are banned so sign-in is refused, and the
--   per-request check refuses any request still carrying a token (PT403 AKUN_DITANGGUHKAN). Nothing educational is
--   touched: sittings, results, certificates and attribution stay. aktifkan_kembali_akun(person, reason) lifts it, with
--   a reason. A School Administrator never suspends: their act is E3/E5 at their own school.
-- L2 REQUESTS, by the person: minta_akun(kind) records «Tutup akun saya» (CLOSE) or «Hapus data pribadi saya»
--   (DELETE_PERSONAL_DATA) as a request the person can see (RECEIVED → DONE, or why not) and the platform's queue
--   holds, audited. A learner's request is made through the school with the family (owner decision 1, recommendation;
--   pending F-16), so a person with a live enrolment is refused here with that sentence.
-- L3 CLOSURE, executed at once on the person's one confirmation (owner decision 2, recommendation, staff and adult
--   accounts): the suspension mechanism with its own category CLOSED_AT_REQUEST, never shown as a suspension; the
--   request is DONE. Reopening is by the person's request, through the PINTAR Administrator (aktifkan_kembali_akun).
-- L4 DELETION OF WHAT NEEDS NO RETENTION, by the PINTAR Administrator, from the queue, and only for a closed account:
--   the profile photo, the name (replaced by the person's PINTAR ID, anonymized_at set) and the sign-in email (retired).
--   Kept by rule and listed to the person: results and sittings (attributed to the anonymised person), certificates
--   (name_as_issued is the certificate's own record, INV-30), the audit log (INV-18). Retention durations and anything
--   with a legal retention wait for counsel (F-16 / OD-5); nothing is deleted by invention.
-- Refusals are PR140 with the code in DETAIL.
-- ---------------------------------------------------------------------------

create table public.person_suspensions (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references public.persons(id),
  -- CORRECTED IN PLACE (undeployed; owner ruling 3, 9 Nov): DISCIPLINARY removed
  category      text not null check (category in ('SECURITY', 'ADMINISTRATIVE', 'OTHER', 'CLOSED_AT_REQUEST')),
  note          text check (note is null or char_length(note) <= 300),
  started_by    uuid not null references public.persons(id),
  started_at    timestamptz not null default now(),
  ended_by      uuid references public.persons(id),
  ended_at      timestamptz,
  end_reason    text check (end_reason is null or char_length(btrim(end_reason)) between 10 and 300),
  constraint person_suspension_end_pairs check ((ended_at is null) = (ended_by is null) and (ended_at is null) = (end_reason is null))
);
create unique index person_suspensions_one_open on public.person_suspensions (person_id) where ended_at is null;
alter table public.person_suspensions enable row level security;
revoke all on table public.person_suspensions from public, anon, authenticated;
insert into public.record_class_registry values
  ('person_suspensions', 'PORTABLE',
   'a platform-level suspension or a closure at the person''s request; read through functions only, never a school''s');

create table public.account_requests (
  id            uuid primary key default gen_random_uuid(),
  person_id     uuid not null references public.persons(id),
  -- CORRECTED IN PLACE (undeployed; owner ruling 2, 9 Nov): REOPEN, a closed account's request to be reopened, made
  -- from outside (minta_buka_kembali); pesan is what the person wrote with it, so the PINTAR Administrator can reach them
  kind          text not null check (kind in ('CLOSE', 'DELETE_PERSONAL_DATA', 'REOPEN')),
  status        text not null default 'RECEIVED' check (status in ('RECEIVED', 'IN_PROGRESS', 'DONE', 'DECLINED')),
  created_at    timestamptz not null default now(),
  decided_by    uuid references public.persons(id),
  decided_at    timestamptz,
  decision_note text check (decision_note is null or char_length(decision_note) <= 300),
  pesan         text check (pesan is null or char_length(pesan) between 10 and 500)
);
create unique index account_requests_one_open on public.account_requests (person_id, kind) where status in ('RECEIVED', 'IN_PROGRESS');
alter table public.account_requests enable row level security;
revoke all on table public.account_requests from public, anon, authenticated;
insert into public.record_class_registry values
  ('account_requests', 'PORTABLE', 'L2: a person''s own request to close their account or delete their personal data');

alter table public.device_sessions drop constraint device_sessions_ended_reason_check;
alter table public.device_sessions add constraint device_sessions_ended_reason_check
  check (ended_reason in ('PIN_GAGAL', 'KUNCI_HABIS', 'KELUAR', 'KELUAR_SEMUA', 'KREDENSIAL_DIGANTI', 'PASSWORD_PERTAMA', 'DITANGGUHKAN'));

create or replace function public.akun_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR140',
    detail  = p_code,
    message = case p_code
      when 'ACCOUNT_NOT_ALLOWED'        then 'this is the PINTAR Administrator''s act'
      when 'ACCOUNT_SELF'               then 'an administrator does not suspend their own account'
      when 'ACCOUNT_UNKNOWN'            then 'no such person'
      when 'ACCOUNT_CATEGORY_INVALID'   then 'the category is one of the listed ones'
      when 'ACCOUNT_NOTE_REQUIRED'      then 'the note or reason is 10 to 300 characters'
      when 'ACCOUNT_ALREADY_SUSPENDED'  then 'this account is already suspended or closed'
      when 'ACCOUNT_NOT_SUSPENDED'      then 'this account is not suspended or closed'
      when 'ACCOUNT_CONFIRM_REQUIRED'   then 'the request needs its one confirmation'
      when 'ACCOUNT_LEARNER_VIA_SCHOOL' then 'a learner''s request is made through the school with the family'
      when 'ACCOUNT_REQUEST_OPEN'       then 'this request has already been made and is in hand'
      when 'ACCOUNT_REQUEST_INVALID'    then 'this is not an open request to delete personal data'
      when 'ACCOUNT_NOT_CLOSED'         then 'personal data is deleted only from a closed account'
      -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 5 on 6faef690)
      when 'ACCOUNT_PLATFORM_ROLE'      then 'a person holding a platform role does not close their own account'
      -- owner ruling 2 (9 Nov)
      when 'ACCOUNT_REOPEN_VIA_REQUEST' then 'a closed account is reopened only from its request, after identity verification'
      else 'the account could not be changed' end;
end $$;
revoke all on function public.akun_tolak(text) from public, anon, authenticated;

-- is this person suspended or closed now (no data beyond the yes or no)
create or replace function public.orang_ditangguhkan(p_person uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.person_suspensions s where s.person_id = p_person and s.ended_at is null)
$$;
revoke all on function public.orang_ditangguhkan(uuid) from public, anon, authenticated;

-- every session ends and sign-in is refused (the Auth users banned); or both undone
create or replace function public.akun_kunci(p_person uuid, p_kunci boolean)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; n int := 0;
begin
  for a in select ac.auth_user_id from public.accounts ac where ac.person_id = p_person and ac.auth_user_id is not null loop
    update auth.users set banned_until = case when p_kunci then 'infinity'::timestamptz else null end where id = a.auth_user_id;
    if p_kunci then n := n + public.sesi_akhiri_orang(a.auth_user_id, 'DITANGGUHKAN'); end if;
  end loop;
  return n;
end $$;
revoke all on function public.akun_kunci(uuid, boolean) from public, anon, authenticated, service_role;

create or replace function public.tangguhkan_akun(p_person uuid, p_kategori text, p_catatan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); v_note text := nullif(btrim(coalesce(p_catatan, '')), ''); v_n int;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  if p_person = v_actor then perform public.akun_tolak('ACCOUNT_SELF'); end if;
  perform 1 from public.persons where id = p_person for update;
  if not found then perform public.akun_tolak('ACCOUNT_UNKNOWN'); end if;
  if p_kategori is null or p_kategori not in ('SECURITY', 'ADMINISTRATIVE', 'OTHER') then
    perform public.akun_tolak('ACCOUNT_CATEGORY_INVALID');
  end if;
  if (p_kategori = 'OTHER' and (v_note is null or char_length(v_note) < 10)) or char_length(coalesce(v_note, '')) > 300 then
    perform public.akun_tolak('ACCOUNT_NOTE_REQUIRED');
  end if;
  if public.orang_ditangguhkan(p_person) then perform public.akun_tolak('ACCOUNT_ALREADY_SUSPENDED'); end if;
  insert into public.person_suspensions (person_id, category, note, started_by) values (p_person, p_kategori, v_note, v_actor);
  v_n := public.akun_kunci(p_person, true);
  perform public.audit_write('account.suspended', 'persons', p_person::text, null,
    jsonb_build_object('person_id', p_person, 'reason_code', p_kategori, 'reason', v_note, 'sessions_ended', v_n,
                       'actor_role', public.audit_actor_role(null)));
  return jsonb_build_object('ok', true, 'sesi_diakhiri', v_n);
end $$;
revoke all on function public.tangguhkan_akun(uuid, text, text) from public, anon, authenticated;
grant execute on function public.tangguhkan_akun(uuid, text, text) to authenticated;

create or replace function public.aktifkan_kembali_akun(p_person uuid, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); v_alasan text := btrim(coalesce(p_alasan, '')); v_s public.person_suspensions;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  if p_person = v_actor then perform public.akun_tolak('ACCOUNT_SELF'); end if;
  select * into v_s from public.person_suspensions s where s.person_id = p_person and s.ended_at is null for update;
  if v_s.id is null then perform public.akun_tolak('ACCOUNT_NOT_SUSPENDED'); end if;
  -- CORRECTED IN PLACE (undeployed; owner ruling 2): a closure at the person's request is undone only from their
  -- request to reopen, after identity verification (buka_kembali_akun); this lifts a suspension
  if v_s.category = 'CLOSED_AT_REQUEST' then perform public.akun_tolak('ACCOUNT_REOPEN_VIA_REQUEST'); end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.akun_tolak('ACCOUNT_NOTE_REQUIRED'); end if;
  update public.person_suspensions set ended_at = now(), ended_by = v_actor, end_reason = v_alasan where id = v_s.id;
  perform public.akun_kunci(p_person, false);
  perform public.audit_write(case when v_s.category = 'CLOSED_AT_REQUEST' then 'account.reopened' else 'account.reactivated' end,
    'persons', p_person::text, null,
    jsonb_build_object('person_id', p_person, 'reason', v_alasan, 'from', jsonb_build_object('category', v_s.category),
                       'actor_role', public.audit_actor_role(null)));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.aktifkan_kembali_akun(uuid, text) from public, anon, authenticated;
grant execute on function public.aktifkan_kembali_akun(uuid, text) to authenticated;

-- the platform's view of one person: who, whether suspended or closed (and how), and their requests
create or replace function public.akun_keadaan(p_person uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.current_person_id() is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  return jsonb_build_object(
    'person_id', p_person,
    'nama', (select p.display_name from public.persons p where p.id = p_person),
    'pintar_id', (select p.pintar_id from public.persons p where p.id = p_person),
    'anonim', (select p.anonymized_at is not null from public.persons p where p.id = p_person),
    'tangguh', (select jsonb_build_object('kategori', s.category, 'sejak', s.started_at, 'catatan', s.note)
                  from public.person_suspensions s where s.person_id = p_person and s.ended_at is null));
end $$;
revoke all on function public.akun_keadaan(uuid) from public, anon, authenticated;
grant execute on function public.akun_keadaan(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ L2 / L3: the person's own requests
create or replace function public.minta_akun(p_kind text, p_konfirmasi boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); v_id uuid; v_n int;
begin
  if v_me is null then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  if p_kind is null or p_kind not in ('CLOSE', 'DELETE_PERSONAL_DATA') then perform public.akun_tolak('ACCOUNT_REQUEST_INVALID'); end if;
  if not coalesce(p_konfirmasi, false) then perform public.akun_tolak('ACCOUNT_CONFIRM_REQUIRED'); end if;
  perform 1 from public.persons where id = v_me for update;
  if exists (select 1 from public.enrollments e where e.person_id = v_me and e.status in ('PENDING', 'ACTIVE')) then
    perform public.akun_tolak('ACCOUNT_LEARNER_VIA_SCHOOL');
  end if;
  if exists (select 1 from public.account_requests r where r.person_id = v_me and r.kind = p_kind and r.status in ('RECEIVED', 'IN_PROGRESS')) then
    perform public.akun_tolak('ACCOUNT_REQUEST_OPEN');
  end if;
  if p_kind = 'CLOSE' then
    if public.orang_ditangguhkan(v_me) then perform public.akun_tolak('ACCOUNT_ALREADY_SUSPENDED'); end if;
    -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 5): reopening needs another live PINTAR Administrator, so a
    -- person holding a platform role does not close their own account (the last one would lock the platform out); the
    -- role is ended first, by another administrator
    if public.is_system_admin() then perform public.akun_tolak('ACCOUNT_PLATFORM_ROLE'); end if;
    insert into public.account_requests (person_id, kind, status, decided_by, decided_at) values (v_me, 'CLOSE', 'DONE', v_me, now())
    returning id into v_id;
    insert into public.person_suspensions (person_id, category, started_by) values (v_me, 'CLOSED_AT_REQUEST', v_me);
    perform public.audit_write('account.closed_at_request', 'persons', v_me::text, null,
      jsonb_build_object('person_id', v_me, 'request_id', v_id, 'reason_code', 'CLOSED_AT_REQUEST'));
    v_n := public.akun_kunci(v_me, true);
  else
    insert into public.account_requests (person_id, kind) values (v_me, 'DELETE_PERSONAL_DATA') returning id into v_id;
    perform public.audit_write('account.deletion_requested', 'persons', v_me::text, null,
      jsonb_build_object('person_id', v_me, 'request_id', v_id));
  end if;
  return jsonb_build_object('ok', true, 'permintaan', v_id);
end $$;
revoke all on function public.minta_akun(text, boolean) from public, anon, authenticated;
grant execute on function public.minta_akun(text, boolean) to authenticated;

create or replace function public.permintaan_akun_saya()
returns table (id uuid, kind text, status text, created_at timestamptz, decided_at timestamptz, decision_note text)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.id, r.kind, r.status, r.created_at, r.decided_at, r.decision_note
    from public.account_requests r where r.person_id = public.current_person_id() order by r.created_at desc
$$;
revoke all on function public.permintaan_akun_saya() from public, anon, authenticated;
grant execute on function public.permintaan_akun_saya() to authenticated;

create or replace function public.permintaan_akun_antrean()
-- CORRECTED IN PLACE (undeployed; owner ruling 2): with what the person wrote (pesan), for a request to reopen
returns table (id uuid, person_id uuid, nama text, pintar_id text, kind text, status text, created_at timestamptz, ditutup boolean, pesan text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.current_person_id() is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  return query
    select r.id, r.person_id, p.display_name, p.pintar_id, r.kind, r.status, r.created_at,
           exists (select 1 from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null and s.category = 'CLOSED_AT_REQUEST'),
           r.pesan
      from public.account_requests r join public.persons p on p.id = r.person_id
     where r.status in ('RECEIVED', 'IN_PROGRESS') order by r.created_at;
end $$;
revoke all on function public.permintaan_akun_antrean() from public, anon, authenticated;
grant execute on function public.permintaan_akun_antrean() to authenticated;

-- L4: the email account's guard (20261217100000's text) with one more governed exception, the retirement of a closed
-- account's sign-in email by hapus_data_pribadi, marked per account for the one statement.
create or replace function public.auth_email_correction_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_akun public.accounts; r public.email_corrections;
begin
  if new.email is not distinct from old.email then
    return new;
  end if;
  select a.* into v_akun from public.accounts a where a.auth_user_id = new.id and a.kind = 'EMAIL';
  if v_akun.id is null then
    return new;
  end if;
  -- L4 (owner, 9 Nov): this very change retires a closed account's sign-in email (hapus_data_pribadi), marked for this account
  if coalesce(current_setting('pintar.anonimkan_email', true), '') = v_akun.id::text then
    perform set_config('pintar.anonimkan_email', '', true);
    return new;
  end if;
  -- D-152(a): this very change converted the account from a card (auth_card_email_guard, earlier on this row)
  if coalesce(current_setting('pintar.kartu_jadi_email', true), '') = v_akun.id::text then
    perform set_config('pintar.kartu_jadi_email', '', true);
    return new;
  end if;
  select c.* into r from public.email_corrections c
   where c.account_id = v_akun.id and c.consumed_at is null and c.expires_at > clock_timestamp()
     and c.new_email = lower(btrim(coalesce(new.email, '')))
   order by c.created_at desc limit 1
   for update;
  if r.id is null then
    raise exception using errcode = 'PR040', detail = 'EMAIL_CHANGE_REFUSED',
      message = 'an email account''s address changes only through a governed correction (D-120 QN1)';
  end if;
  update public.email_corrections set consumed_at = clock_timestamp() where id = r.id;

  new.confirmation_token := '';
  new.recovery_token := '';
  new.email_change := '';
  new.email_change_token_new := '';
  new.email_change_token_current := '';
  new.reauthentication_token := '';
  delete from auth.one_time_tokens t where t.user_id = new.id;

  if not r.activated then
    new.encrypted_password := '';
    update public.account_setup s set password_set_at = null, name_confirmed_at = null
     where s.account_id = v_akun.id and s.state = 'REQUIRED';
    update public.person_pins set reset_required = true where person_id = v_akun.person_id;
  end if;
  perform public.sesi_akhiri_orang(new.id, 'KREDENSIAL_DIGANTI');

  perform public.audit_write('identity.email_corrected', 'persons', v_akun.person_id::text, r.institution_id,
    jsonb_build_object('person_id', v_akun.person_id, 'reason', r.reason,
                       'from', jsonb_build_object('email', r.old_email),
                       'to', jsonb_build_object('email', r.new_email),
                       'activated', r.activated,
                       'authorized_by', r.authorized_by, 'actor_role', r.authorized_role,
                       'authorized_at', r.created_at, 'correction_id', r.id, 'outcome', 'EMAIL_CORRECTED'));
  return new;
end $$;
revoke all on function public.auth_email_correction_guard() from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ owner ruling 2 (9 Nov): reopening a closed account
-- «A simple external request channel accessible without signing in, using an existing support mechanism where possible.
-- Only an authorized Admin PINTAR may approve reopening after identity verification. No automatic restoration and no new
-- ticketing system.» The existing request queue (account_requests, the PINTAR Administrator's queue on Keamanan) holds
-- it. minta_buka_kembali is called only by its server route (/api/akun/buka-kembali, service role), from a page
-- reachable from the sign-in screen: the person names their sign-in email or PINTAR ID and writes how they can be
-- reached. Only a closed account (CLOSED_AT_REQUEST) records a request, once while it is open; the answer is the same
-- for any address, so it tells no one whether an account exists. It reopens nothing.
create or replace function public.minta_buka_kembali(p_identitas text, p_pesan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id text := lower(btrim(coalesce(p_identitas, ''))); v_pesan text := btrim(coalesce(p_pesan, '')); v_person uuid; v_req uuid;
begin
  -- depends only on what was typed, never on an account
  if v_id = '' or char_length(v_id) > 254 or char_length(v_pesan) < 10 or char_length(v_pesan) > 500 then
    return jsonb_build_object('ok', false, 'kode', 'ACCOUNT_NOTE_REQUIRED');
  end if;
  select p.id into v_person from public.persons p where lower(p.pintar_id) = v_id;
  if v_person is null then
    select a.person_id into v_person from public.accounts a join auth.users u on u.id = a.auth_user_id
     where lower(u.email) = v_id and a.kind = 'EMAIL' limit 1;
  end if;
  -- CORRECTED IN PLACE (undeployed; Daisy at 435a2856, §2.4): what signing in takes, the username too (signin_resolve)
  if v_person is null then
    select pu.person_id into v_person from public.person_usernames pu where pu.username = v_id;
  end if;
  if v_person is not null
     and exists (select 1 from public.person_suspensions s where s.person_id = v_person and s.ended_at is null and s.category = 'CLOSED_AT_REQUEST')
     and not exists (select 1 from public.account_requests q where q.person_id = v_person and q.kind = 'REOPEN' and q.status in ('RECEIVED', 'IN_PROGRESS')) then
    insert into public.account_requests (person_id, kind, pesan) values (v_person, 'REOPEN', v_pesan) returning id into v_req;
    perform public.audit_write('account.reopen_requested', 'persons', v_person::text, null,
      jsonb_build_object('person_id', v_person, 'request_id', v_req));
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.minta_buka_kembali(text, text) from public, anon, authenticated;
grant execute on function public.minta_buka_kembali(text, text) to service_role;

-- the PINTAR Administrator approves it, saying how the person's identity was verified (10–300 characters)
create or replace function public.buka_kembali_akun(p_request uuid, p_cara_verifikasi text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); v_cara text := btrim(coalesce(p_cara_verifikasi, ''));
        r public.account_requests; v_s public.person_suspensions; v_peran jsonb;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  select * into r from public.account_requests q where q.id = p_request for update;
  if r.id is null or r.kind <> 'REOPEN' or r.status not in ('RECEIVED', 'IN_PROGRESS') then perform public.akun_tolak('ACCOUNT_REQUEST_INVALID'); end if;
  if r.person_id = v_actor then perform public.akun_tolak('ACCOUNT_SELF'); end if;
  select * into v_s from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null for update;
  if v_s.id is null or v_s.category <> 'CLOSED_AT_REQUEST' then perform public.akun_tolak('ACCOUNT_NOT_CLOSED'); end if;
  if char_length(v_cara) < 10 or char_length(v_cara) > 300 then perform public.akun_tolak('ACCOUNT_NOTE_REQUIRED'); end if;
  update public.person_suspensions set ended_at = now(), ended_by = v_actor, end_reason = v_cara where id = v_s.id;
  -- the owner (9 Nov): reopening restores signing in, never a former authority. Any school role still live from before
  -- the closure ends now, each through the role guard and its own role.revoked row; a school gives it again if it
  -- still applies. (A person holding a platform role cannot have closed their account: ACCOUNT_PLATFORM_ROLE.)
  select coalesce(jsonb_agg(jsonb_build_object('id', ra.id, 'role', ra.role, 'scope_node_id', ra.scope_node_id) order by ra.id), '[]')
    into v_peran from public.role_assignments ra
   where ra.person_id = r.person_id and ra.revoked_at is null and ra.role <> 'SYSTEM_ADMIN';
  update public.role_assignments ra set revoked_at = now(), revoked_by = v_actor,
         revoked_reason = 'Akun dibuka kembali: peran dari sebelum akun ditutup tidak dipulihkan'
   where ra.person_id = r.person_id and ra.revoked_at is null and ra.role <> 'SYSTEM_ADMIN';
  perform public.akun_kunci(r.person_id, false);
  update public.account_requests set status = 'DONE', decided_by = v_actor, decided_at = now(), decision_note = v_cara where id = r.id;
  perform public.audit_write('account.reopened', 'persons', r.person_id::text, null,
    jsonb_build_object('person_id', r.person_id, 'request_id', r.id, 'reason', v_cara, 'identity_verified', true, 'roles_ended', v_peran,
                       'from', jsonb_build_object('category', v_s.category), 'actor_role', public.audit_actor_role(null)));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.buka_kembali_akun(uuid, text) from public, anon, authenticated;
grant execute on function public.buka_kembali_akun(uuid, text) to authenticated;

-- the door is public (the person cannot sign in), declared as Gate 3's to Gate 5's are, its handler as its child
insert into public.public_surface_registry (surface, kind, object, note, parent) values
  ('reopen_request', 'ROUTE', '/masuk/buka-kembali/kirim',
   'Owner ruling 2 (9 Nov): a closed account asks to be reopened. POST only, same origin only. The sign-in email or PINTAR '
   || 'ID and a message of 10-500 characters; the same answer for every address, no sooner than a fixed wait; only a '
   || 'closed account''s request is recorded, once while open, and nothing is reopened. Listed in the proxy''s PUBLIC_PATHS, '
   || 'with its page /masuk/buka-kembali.', null),
  ('reopen_request_api', 'ENDPOINT', '/api/masuk/buka-kembali/kirim',
   'The handler /masuk/buka-kembali/kirim is rewritten to: minta_buka_kembali, service-role only. Signed out, the proxy '
   || 'refuses this spelling itself.', 'reopen_request')
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════ L4: what needs no retention, removed
create or replace function public.hapus_data_pribadi(p_request uuid, p_catatan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); r public.account_requests; v_pid text; a record; v_foto boolean; v_lama text;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
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
  if not exists (select 1 from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null and s.category = 'CLOSED_AT_REQUEST') then
    perform public.akun_tolak('ACCOUNT_NOT_CLOSED');
  end if;
  select p.pintar_id, p.photo_path is not null into v_pid, v_foto from public.persons p where p.id = r.person_id for update;
  update public.persons set display_name = v_pid, photo_path = null, anonymized_at = now() where id = r.person_id;
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
  update public.account_requests set status = 'DONE', decided_by = v_actor, decided_at = now(),
         decision_note = nullif(btrim(coalesce(p_catatan, '')), '') where id = r.id;
  perform public.audit_write('account.personal_data_deleted', 'persons', r.person_id::text, null,
    jsonb_build_object('person_id', r.person_id, 'request_id', r.id, 'removed', jsonb_build_array('name', 'sign_in_email', 'username', 'copies')
                         || case when v_foto then jsonb_build_array('photo') else '[]'::jsonb end,
                       'kept', jsonb_build_array('results', 'certificates_as_issued', 'audit_log'),
                       'actor_role', public.audit_actor_role(null)));
  -- the person, so the server route that called this removes every file in their photo folder from storage
  -- (Sharon §16 finding 2: a database cannot delete a stored file; storage.protect_delete refuses it)
  return jsonb_build_object('ok', true, 'orang', r.person_id);
end $$;
revoke all on function public.hapus_data_pribadi(uuid, text) from public, anon, authenticated;
grant execute on function public.hapus_data_pribadi(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ the per-request check, with the suspension
-- 20261120100000's definition, unchanged, with one addition after maintenance: a token of a suspended or closed person
-- is refused (PT403 AKUN_DITANGGUHKAN); the status read and leaving still pass.
create or replace function pintar_permintaan.periksa()
returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_sesi uuid; v_peran text; r public.device_sessions; v_jalur text; v_blok text; v_orang uuid;
begin
  begin
    v_peran := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  exception when others then
    v_peran := null;
  end;
  if v_peran is distinct from 'authenticated' then
    return;
  end if;
  v_jalur := current_setting('request.path', true);
  -- #148 (D-094, D-100): maintenance; the status read and leaving always pass
  if v_jalur not in ('/rpc/pintar_status_saya', '/rpc/sesi_akhiri_saya') then
    v_blok := public.maintenance_block_for_me();
    if v_blok = 'EMERGENCY' then
      raise exception using errcode = 'PT503', message = 'PINTAR_DIHENTIKAN';
    elsif v_blok = 'PLANNED' then
      raise exception using errcode = 'PT503', message = 'PINTAR_PEMELIHARAAN';
    end if;
  end if;
  -- §5b / L3: a suspended or closed person's token answers nothing, whatever the path (the status read and leaving pass)
  if coalesce(v_jalur, '') not in ('/rpc/pintar_status_saya', '/rpc/sesi_akhiri_saya') then
    v_orang := public.current_person_id();
    if v_orang is not null and public.orang_ditangguhkan(v_orang) then
      raise exception using errcode = 'PT403', message = 'AKUN_DITANGGUHKAN';
    end if;
  end if;
  -- the lock screen's own questions pass: where it stands, and leaving
  if v_jalur in ('/rpc/sesi_periksa', '/rpc/sesi_akhiri_saya') then
    return;
  end if;
  v_sesi := public.sesi_saya();
  if v_sesi is null then return; end if;
  select * into r from public.device_sessions s where s.session_id = v_sesi;
  if not found then return; end if;
  case public.sesi_keadaan(r, clock_timestamp())
    when 'TERKUNCI' then raise exception using errcode = 'PT423', message = 'SESI_TERKUNCI';
    when 'BERAKHIR' then raise exception using errcode = 'PT401', message = 'SESI_BERAKHIR';
    else return;
  end case;
end $$;
revoke all on function pintar_permintaan.periksa() from public;
grant execute on function pintar_permintaan.periksa() to anon, authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('tangguhkan_akun', 'STAFF', '§5b: suspends a PINTAR identity with a category and note; sessions end, sign-in refused, every request refused; evidence untouched. PINTAR Administrator only. PR140.', 'SYSTEM_ADMIN', null),
  ('aktifkan_kembali_akun', 'STAFF', '§5b: lifts a suspension with a 10-300 reason; a closed account is reopened only from its request (buka_kembali_akun). PINTAR Administrator only. PR140.', 'SYSTEM_ADMIN', null),
  ('buka_kembali_akun', 'STAFF', 'Owner ruling 2: reopens a closed account from its REOPEN request, with how identity was verified (10-300); the request DONE; audited account.reopened. PINTAR Administrator only. PR140.', 'SYSTEM_ADMIN', null),
  ('akun_keadaan', 'STAFF', '§5b: one person''s suspension or closure as the platform sees it. PINTAR Administrator only.', 'SYSTEM_ADMIN', null),
  ('permintaan_akun_antrean', 'STAFF', 'L2: the open close and delete-personal-data requests. PINTAR Administrator only.', 'SYSTEM_ADMIN', null),
  ('hapus_data_pribadi', 'STAFF', 'L4: for a closed account''s open request, removes the photo, the name (the PINTAR ID instead, anonymized_at) and the sign-in email; results, certificates as issued and the audit log are kept. PINTAR Administrator only. PR140.', 'SYSTEM_ADMIN', null),
  ('minta_akun', 'LEARNER', 'L2 / L3: the person''s own request with its one confirmation: CLOSE executes at once (CLOSED_AT_REQUEST: sessions end, sign-in refused, records kept); DELETE_PERSONAL_DATA goes to the platform''s queue. A learner''s request is made through the school. PR140.', null, null),
  ('permintaan_akun_saya', 'LEARNER', 'L2: the person''s own requests and what became of them.', null, null)
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if has_function_privilege('authenticated', 'public.akun_kunci(uuid, boolean)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.orang_ditangguhkan(uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.akun_tolak(text)'::regprocedure, 'execute') then
    raise exception '§5b: an internal helper is callable by a client';
  end if;
  if has_function_privilege('authenticated', 'public.minta_buka_kembali(text, text)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.minta_buka_kembali(text, text)'::regprocedure, 'execute') then
    raise exception 'owner ruling 2: the reopening request is its server route''s alone';
  end if;
  if has_function_privilege('anon', 'public.minta_akun(text, boolean)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.tangguhkan_akun(uuid, text, text)'::regprocedure, 'execute') then
    raise exception '§5b: an anonymous caller can suspend or close';
  end if;
end $$;

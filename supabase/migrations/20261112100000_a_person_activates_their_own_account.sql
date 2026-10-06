-- BOB-26: A PERSON ACTIVATES THEIR OWN ACCOUNT (identity Gate 3, D-054, D-057(d),
-- D-077, D-079). The database half of activation and password sign-in; the
-- routes are src/app/api/aktifkan/*, src/app/api/masuk/password and
-- src/app/api/akun/kartu*, and the contract is
-- docs/coordination/handover/BOB-26-CONTRACT.md.
--
--   (1) who may be sent an activation code, and who a sign-in name resolves to:
--       two service-role lookups, so the signed-out routes never touch a table
--       and anon executes nothing (FABLE-01, C1, C9)
--   (2) BOB-24's attempt counter gains the password sign-in's scope: the
--       per-account backoff, keyed by an HMAC whether or not the account exists
--   (3) A PASSWORD IS WRITTEN ONLY THROUGH A PERMIT. A trigger on auth.users
--       refuses any new password hash unless PINTAR's own route asked for it,
--       once, within the minute. So a signed-in session alone can neither set
--       nor change a password through Auth's own endpoint (the Gate 0 finding),
--       whatever Auth's settings say; the settings are a second lock (§ the
--       canonical file, supabase/auth-identitas.json)
--   (4) D-077: a person's name is governed identity data. Self-editing is
--       revoked (it was a defect: any signed-in person, a class card included,
--       could rename themselves just before a certificate was sealed). What is
--       left: the one confirmation at activation (with one correction), and the
--       platform admin's audited correction. Historical certificates keep
--       name_as_issued (INV-30); nothing here touches them
--   (5) the wizard's state and its finish: completion needs the username, the
--       PIN, the password and the name's confirmation
--   (6) the card's data, read at render time (D-059); staff only (C17)
--   (7) the complete list of an import's names, for the one confirmation
--       (D-077(4), DAISY-20 (3))
--
-- REFUSALS carry SQLSTATE PR040 and a stable code in DETAIL (D-011), as BOB-24's.

-- ═══════════════════════════════════════════════════════════════ helpers
-- A staff person: an active role assignment (students are enrolments, never
-- role assignments). C17: only staff see a PINTAR ID or get a card in 4.0.
create or replace function public.adalah_staf(p_person uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.role_assignments ra
                  where ra.person_id = p_person and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until)
$$;

-- A name as PINTAR keeps it: trimmed, runs of white space made one, 1 to 200
-- characters (authorize_new_person's bound), no control character. NULL when
-- it cannot be one.
create or replace function public.nama_kanonik(p text)
returns text
language sql immutable set search_path = public, pg_temp as $$
  select case when v = '' or length(v) > 200 or v ~ '[[:cntrl:]]' then null else v end
    from (select btrim(regexp_replace(coalesce(p, ''), '[[:space:]]+', ' ', 'g')) as v) x
$$;

-- The caller's EMAIL account's set-up row, for update.
create or replace function public.setup_saya()
returns public.account_setup
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.identitas_staf_saya(); r public.account_setup;
begin
  select s.* into r from public.account_setup s join public.accounts a on a.id = s.account_id
   where a.person_id = v_person and a.kind = 'EMAIL' order by s.created_at limit 1 for update of s;
  if r.account_id is null then
    raise exception using errcode = 'PR040', detail = 'IDENTITY_NOT_ELIGIBLE', message = 'this account has no set-up';
  end if;
  return r;
end $$;

-- ═══════════════════════════════════════════════════════════ (5) set-up state
alter table public.account_setup
  add column password_set_at   timestamptz,
  add column name_confirmed_at timestamptz;

-- ═══════════════════════════════════════════════════ (1) the signed-out lookups
-- Who may be sent an activation code (C1): an existing EMAIL account whose
-- set-up is REQUIRED, not an evaluation persona. No row for anyone else, and
-- the route answers every address the same.
create or replace function public.activation_code_target(p_email text)
returns table (auth_user_id uuid, nama text)
language sql stable security definer set search_path = public, pg_temp as $$
  select a.auth_user_id, p.display_name
    from auth.users u
    join public.accounts a on a.auth_user_id = u.id and a.kind = 'EMAIL'
    join public.account_setup s on s.account_id = a.id and s.state = 'REQUIRED'
    join public.persons p on p.id = a.person_id
   where lower(u.email) = lower(btrim(coalesce(p_email, ''))) and btrim(coalesce(p_email, '')) <> ''
     and not public.adalah_persona(a.person_id)
   limit 1
$$;

-- What a sign-in name resolves to (C9): an address, or a username, to the
-- address of that person's EMAIL account. NULL for anything else: an unknown
-- name, a class card's address, a persona. Server-side only; there is no
-- anonymous lookup.
create or replace function public.signin_resolve(p_identitas text)
returns text
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v text := lower(btrim(coalesce(p_identitas, ''))); v_email text;
begin
  if v = '' or length(v) > 320 then return null; end if;
  if position('@' in v) > 0 then
    select u.email into v_email from auth.users u
      join public.accounts a on a.auth_user_id = u.id and a.kind = 'EMAIL'
     where lower(u.email) = v and not public.adalah_persona(a.person_id) limit 1;
  else
    select u.email into v_email from public.person_usernames pu
      join public.accounts a on a.person_id = pu.person_id and a.kind = 'EMAIL'
      join auth.users u on u.id = a.auth_user_id
     where pu.username = v and not public.adalah_persona(a.person_id) limit 1;
  end if;
  return v_email;
end $$;

-- The resend countdown every code screen shows (C3): BOB-25's one-a-minute
-- limit for an address and a kind, read, not restated.
create or replace function public.email_resend_seconds()
returns integer
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(max(l.window_seconds), 60) from public.email_send_limits l where l.scope = 'ADDRESS_KIND'
$$;

-- Would BOB-25's limits let this send go now? The same rule as
-- email_send_reserve, read only. The code route asks it BEFORE a code is
-- issued, because issuing one replaces the code already in the person's inbox:
-- a resend the limits then refused would leave them with no working code. The
-- reservation itself (kirimEmail) still decides, under its lock.
create or replace function public.email_send_would_allow(p_kind text, p_recipient_hash text)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare l record; n integer;
begin
  if p_recipient_hash is null or p_recipient_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'email_send_would_allow takes the recipient''s SHA-256, never an address';
  end if;
  for l in select * from public.email_send_limits loop
    select count(*) into n from public.email_send_log s
     where s.outcome <> 'REFUSED_LIMIT'
       and s.requested_at > now() - make_interval(secs => l.window_seconds)
       and (l.scope = 'GLOBAL'
            or (s.recipient_hash = p_recipient_hash and (l.scope = 'ADDRESS' or s.kind = p_kind)));
    if n >= l.max_sends then return false; end if;
  end loop;
  return true;
end $$;

-- ═════════════════════════════════════════ (2) the password sign-in's backoff
alter table public.identity_attempts drop constraint identity_attempts_scope_check;
alter table public.identity_attempts add constraint identity_attempts_scope_check
  check (scope in ('CODE_VERIFY', 'PASSWORD_SIGNIN'));

-- BOB-24's rule, unchanged, for either scope: 5 free within 15 minutes, then
-- 30 s after the last, doubling, at most 300 s.
create or replace function public.identity_attempt(p_scope text, p_kunci text)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_jendela constant interval := interval '15 minutes';
  v_nu timestamptz; v_waktu timestamptz[]; v_n int; v_sampai timestamptz;
begin
  if p_scope is null or p_scope not in ('CODE_VERIFY', 'PASSWORD_SIGNIN') or p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'identity_attempt: not a known scope and key';
  end if;
  insert into public.identity_attempts (scope, kunci) values (p_scope, p_kunci) on conflict do nothing;
  select a.percobaan into v_waktu from public.identity_attempts a where a.scope = p_scope and a.kunci = p_kunci for update;
  v_nu := clock_timestamp();
  v_waktu := array(select t from unnest(v_waktu) t where t > v_nu - v_jendela order by t);
  v_n := cardinality(v_waktu);
  if v_n >= 5 then
    v_sampai := v_waktu[v_n] + make_interval(secs => least(300, 30 * (2 ^ least(v_n - 5, 8)))::int);
    if v_sampai > v_nu then
      update public.identity_attempts set percobaan = v_waktu, diperbarui = v_nu where scope = p_scope and kunci = p_kunci;
      return greatest(1, ceil(extract(epoch from v_sampai - v_nu)))::int;
    end if;
  end if;
  update public.identity_attempts set percobaan = v_waktu || v_nu, diperbarui = v_nu where scope = p_scope and kunci = p_kunci;
  delete from public.identity_attempts
   where (scope, kunci) in (select a.scope, a.kunci from public.identity_attempts a
                             where a.diperbarui < v_nu - v_jendela for update skip locked);
  return 0;
end $$;

create or replace function public.identity_attempt_settle(p_scope text, p_kunci text, p_hasil text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_scope is null or p_scope not in ('CODE_VERIFY', 'PASSWORD_SIGNIN') or p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$'
     or p_hasil is null or p_hasil not in ('OK', 'NOT_JUDGED') then
    raise exception using errcode = '22023', message = 'identity_attempt_settle: a known scope, key and OK or NOT_JUDGED';
  end if;
  if p_hasil = 'OK' then
    delete from public.identity_attempts where scope = p_scope and kunci = p_kunci;
  else
    update public.identity_attempts set percobaan = percobaan[1:greatest(cardinality(percobaan) - 1, 0)]
     where scope = p_scope and kunci = p_kunci;
  end if;
end $$;

-- ═══════════════════════════════════════ (3) a password is written by permit
create table public.password_write_permits (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  purpose      text not null check (purpose in ('ACTIVATION')),
  expires_at   timestamptz not null
);
alter table public.password_write_permits enable row level security;
revoke all on table public.password_write_permits from public, anon, authenticated, service_role;

-- The activation route's permit, asked for just before it sets the password
-- through Auth's admin endpoint. Only for an EMAIL account whose set-up is
-- REQUIRED (Gate 4 and 5 add their own purposes). Single use, one minute.
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
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (p_auth_user, p_purpose, clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
end $$;

-- THE GUARD. Any new, non-empty password hash on auth.users needs a live
-- permit for that user, which it consumes. Clearing a hash (Auth's own clean-up
-- of an unconfirmed identity) and leaving it unchanged pass. Without a permit
-- the write is refused, and Auth's endpoint answers an error: no password
-- changes. An activation permit also records the step on the set-up row, in
-- the same transaction as the hash itself.
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
  end if;
  perform public.audit_write('identity.password_set', 'auth.users', new.id::text, null,
    jsonb_build_object('purpose', v_purpose));
  return new;
end $$;
create trigger pintar_password_write_guard before update of encrypted_password on auth.users
  for each row execute function public.auth_password_write_guard();

-- ═══════════════════════════════════════════════════ (4) the name (D-077)
-- (2) Self-editing is closed. photo_path keeps its grant.
revoke update (display_name) on public.persons from authenticated;

-- (1) The one confirmation at activation, with at most one correction before
-- it. p_name NULL (or the same name) is «Sudah benar» as it is.
create or replace function public.confirm_my_name(p_name text default null)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.identitas_staf_saya(); s public.account_setup := public.setup_saya();
        v_lama text; v_baru text;
begin
  if s.state <> 'REQUIRED' then
    raise exception using errcode = 'PR040', detail = 'SETUP_COMPLETE', message = 'the set-up is already complete';
  end if;
  if s.name_confirmed_at is not null then
    raise exception using errcode = 'PR040', detail = 'NAME_ALREADY_CONFIRMED', message = 'the name has been confirmed; a later correction is the platform administrator''s';
  end if;
  select p.display_name into v_lama from public.persons p where p.id = v_person for update;
  v_baru := coalesce(public.nama_kanonik(p_name), case when p_name is null then v_lama end);
  if v_baru is null then
    raise exception using errcode = 'PR040', detail = 'NAME_INVALID', message = 'a name is 1 to 200 characters with no control character';
  end if;
  if v_baru is distinct from v_lama then
    update public.persons set display_name = v_baru where id = v_person;
    perform public.audit_write('identity.name_corrected_at_activation', 'persons', v_person::text, null,
      jsonb_build_object('from', v_lama, 'to', v_baru));
  end if;
  update public.account_setup set name_confirmed_at = clock_timestamp() where account_id = s.account_id;
  perform public.audit_write('identity.name_confirmed', 'persons', v_person::text, null,
    jsonb_build_object('name', v_baru, 'corrected', v_baru is distinct from v_lama));
  return v_baru;
end $$;

-- (3) The one governed correction afterwards: the platform admin only, with a
-- reason, audited (the correct_username precedent, C9). A school admin cannot
-- change a name a person carries across schools.
create or replace function public.correct_person_name(p_person uuid, p_name text, p_reason text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_lama text; v_baru text := public.nama_kanonik(p_name);
begin
  if not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'correcting a person''s name requires the platform administrator (SYSTEM_ADMIN)';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a correction states its reason';
  end if;
  select p.display_name into v_lama from public.persons p where p.id = p_person for update;
  if not found then
    raise exception using errcode = 'PR040', detail = 'IDENTITY_NOT_FOUND', message = 'no such person';
  end if;
  if v_baru is null then
    raise exception using errcode = 'PR040', detail = 'NAME_INVALID', message = 'a name is 1 to 200 characters with no control character';
  end if;
  if v_baru = v_lama then
    raise exception using errcode = 'PR040', detail = 'NAME_UNCHANGED', message = 'that is already the person''s name';
  end if;
  update public.persons set display_name = v_baru where id = p_person;
  perform public.audit_write('identity.name_corrected', 'persons', p_person::text, null,
    jsonb_build_object('from', v_lama, 'to', v_baru, 'reason', btrim(p_reason)));
  return v_baru;
end $$;

-- ═════════════════════════════════════════ (5) the wizard's state and finish
create or replace function public.my_setup_progress()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.current_person_id(); s public.account_setup; v_state text := public.my_setup_state();
        v_user text; v_pin boolean; v_nama text; v_staf boolean;
begin
  if v_state = 'NOT_APPLICABLE' then
    return jsonb_build_object('state', v_state);
  end if;
  select st.* into s from public.account_setup st join public.accounts a on a.id = st.account_id
   where a.person_id = v_person and a.kind = 'EMAIL' order by st.created_at limit 1;
  select u.username into v_user from public.person_usernames u where u.person_id = v_person;
  v_pin := exists (select 1 from public.person_pins pp where pp.person_id = v_person and not pp.reset_required);
  select p.display_name into v_nama from public.persons p where p.id = v_person;
  v_staf := public.adalah_staf(v_person);
  return jsonb_build_object(
    'state', v_state,
    'username', v_user,
    'password', s.password_set_at is not null,
    'pin', v_pin,
    'name', v_nama,
    'name_confirmed', s.name_confirmed_at is not null,
    'staff', v_staf,
    'pintar_id', case when v_staf then (select p.pintar_id from public.persons p where p.id = v_person) end);
end $$;

-- Completion needs all four now: the username, the PIN, the password (set
-- through the permit) and the name's confirmation.
create or replace function public.complete_my_setup()
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.identitas_staf_saya(); s public.account_setup := public.setup_saya(); v_kurang text[] := '{}';
begin
  if s.state = 'COMPLETE' then return 'COMPLETE'; end if;
  if not exists (select 1 from public.person_usernames u where u.person_id = v_person) then v_kurang := array_append(v_kurang, 'USERNAME'); end if;
  if s.password_set_at is null then v_kurang := array_append(v_kurang, 'PASSWORD'); end if;
  if not exists (select 1 from public.person_pins pp where pp.person_id = v_person and not pp.reset_required) then v_kurang := array_append(v_kurang, 'PIN'); end if;
  if s.name_confirmed_at is null then v_kurang := array_append(v_kurang, 'NAME'); end if;
  if cardinality(v_kurang) > 0 then
    raise exception using errcode = 'PR040', detail = 'SETUP_INCOMPLETE',
      message = 'still to do: ' || array_to_string(v_kurang, ', ');
  end if;
  update public.account_setup set state = 'COMPLETE', completed_at = coalesce(completed_at, now()) where account_id = s.account_id;
  perform public.audit_write('identity.setup_completed', 'persons', v_person::text, null, '{}'::jsonb);
  return 'COMPLETE';
end $$;

-- ═════════════════════════════════════════════ (6) the card's data (D-059)
-- Stable identity (the current canonical name, the PINTAR ID) and the current
-- context, read now from role assignments. A statement, never authority.
create or replace function public.my_identity_card()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.identitas_staf_saya();
begin
  if not public.adalah_staf(v_person) then
    raise exception using errcode = 'PR040', detail = 'IDENTITY_NOT_ELIGIBLE', message = 'a PINTAR card is a staff person''s in 4.0 (C17)';
  end if;
  return (
    select jsonb_build_object(
      'name', p.display_name,
      'pintar_id', p.pintar_id,
      'contexts', coalesce((
        select jsonb_agg(jsonb_build_object('role', k.role, 'institution', k.name) order by k.urutan, k.name)
          from (select distinct ra.role::text as role, i.name,
                       case ra.role::text when 'SYSTEM_ADMIN' then 1 when 'INSTITUTION_ADMIN' then 2 when 'DEAN' then 3
                                          when 'HEAD_OF_DEPARTMENT' then 4 else 5 end as urutan
                  from public.role_assignments ra left join public.institutions i on i.id = ra.institution_id
                 where ra.person_id = p.id and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until) k),
        '[]'::jsonb))
      from public.persons p where p.id = v_person);
end $$;

-- ═══════════════════════════════════════ (7) every name an import will record
-- The complete list, paged, under the same authority as import_preview (the
-- job's own school, CAN_PROVISION_PEOPLE), so every name can be read before
-- the one confirmation (D-077(2)).
create or replace function public.import_preview_names(p_job uuid, p_after integer default 0, p_limit integer default 200)
returns table (baris integer, nama text, peran text, baru boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public.import_job_for_admin(p_job);
  return query
    select ir.ordinal, ir.payload ->> 'display_name', coalesce(ir.payload ->> 'role', 'STUDENT'),
           (ir.payload ->> 'person_id') is null
      from public.import_rows ir
     where ir.job_id = p_job and ir.ordinal > coalesce(p_after, 0)
     order by ir.ordinal
     limit least(greatest(coalesce(p_limit, 200), 1), 500);
end $$;

-- ═══════════════════════════════════════════════════════════════ surfaces
revoke all on function public.adalah_staf(uuid) from public, anon, authenticated, service_role;
revoke all on function public.nama_kanonik(text) from public, anon, authenticated, service_role;
revoke all on function public.setup_saya() from public, anon, authenticated, service_role;
revoke all on function public.auth_password_write_guard() from public, anon, authenticated, service_role;
revoke all on function public.email_resend_seconds() from public, anon, authenticated;
revoke all on function public.email_send_would_allow(text, text) from public, anon, authenticated;
grant execute on function public.email_send_would_allow(text, text) to service_role;
revoke all on function public.activation_code_target(text) from public, anon, authenticated;
revoke all on function public.signin_resolve(text) from public, anon, authenticated;
revoke all on function public.password_write_permit(uuid, text) from public, anon, authenticated;
grant execute on function public.email_resend_seconds() to service_role;
grant execute on function public.activation_code_target(text) to service_role;
grant execute on function public.signin_resolve(text) to service_role;
grant execute on function public.password_write_permit(uuid, text) to service_role;
-- replaced here, so restated here (ADR-0021: each migration revokes what it creates)
revoke all on function public.identity_attempt(text, text) from public, anon, authenticated;
revoke all on function public.identity_attempt_settle(text, text, text) from public, anon, authenticated;
grant execute on function public.identity_attempt(text, text) to service_role;
grant execute on function public.identity_attempt_settle(text, text, text) to service_role;
revoke all on function public.complete_my_setup() from public, anon;
grant execute on function public.complete_my_setup() to authenticated;
revoke all on function public.confirm_my_name(text) from public, anon;
revoke all on function public.correct_person_name(uuid, text, text) from public, anon;
revoke all on function public.my_setup_progress() from public, anon;
revoke all on function public.my_identity_card() from public, anon;
revoke all on function public.import_preview_names(uuid, integer, integer) from public, anon;
grant execute on function public.confirm_my_name(text) to authenticated;
grant execute on function public.correct_person_name(uuid, text, text) to authenticated;
grant execute on function public.my_setup_progress() to authenticated;
grant execute on function public.my_identity_card() to authenticated;
grant execute on function public.import_preview_names(uuid, integer, integer) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('confirm_my_name', 'LEARNER', 'BOB-26 (D-077), self-service identity, the caller''s own: the caller confirms their own name once during activation, with at most one correction before it, audited (old and new name); refused once confirmed or once the set-up is complete.', null, null),
  ('my_setup_progress', 'LEARNER', 'BOB-26, self-service identity, the caller''s own: where the caller''s own activation stands (username, password, PIN, name confirmed), and their PINTAR ID only when they are staff (C17).', null, null),
  ('my_identity_card', 'LEARNER', 'BOB-26 (D-059), self-service identity, the caller''s own: the caller''s own card data, the current name, the PINTAR ID and the current role and school read now; staff only (C17).', null, null),
  ('correct_person_name', 'STAFF', 'BOB-26 (D-077(3)): the platform administrator corrects a person''s canonical name, with a stated reason, audited (from, to, reason). Refuses everyone else; historical certificates keep name_as_issued.', 'SYSTEM_ADMIN', null),
  ('import_preview_names', 'STAFF', 'BOB-26 (D-077(4)): every name an import job will record, paged, for the one confirmation. Writes nothing.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE');

-- The three signed-out doors are anonymous surfaces, declared as the card's
-- sign-in is (BOB-12): the public path, and the handler it is rewritten to as
-- its child. Each holds the service-role client (F01-S03) for its own
-- service-role functions and nothing else; anon executes none of them.
insert into public.public_surface_registry (surface, kind, object, note, parent) values
  ('activation_code', 'ROUTE', '/aktifkan/kode',
   'BOB-26: ask for an activation code. POST only, same origin only; GET answers 303 /aktifkan. The same answer for every '
   || 'well-formed address (C1): only an existing EMAIL account whose set-up is REQUIRED is sent a code, after the answer '
   || 'has gone. Listed in the proxy''s PUBLIC_PATHS.', null),
  ('activation_code_api', 'ENDPOINT', '/api/aktifkan/kode',
   'The handler /aktifkan/kode is rewritten to (next.config.ts): activation_code_target, email_resend_seconds, '
   || 'email_send_would_allow and BOB-25''s send, service-role. Signed out, the proxy refuses this spelling itself.', 'activation_code'),
  ('activation_check', 'ROUTE', '/aktifkan/periksa',
   'BOB-26: type the activation code; a match signs the email account in. POST only, same origin only. One code '
   || '(KODE_TIDAK_COCOK) for wrong, expired, used or nobody''s; counted per address (CODE_VERIFY). Listed in PUBLIC_PATHS.', null),
  ('activation_check_api', 'ENDPOINT', '/api/aktifkan/periksa',
   'The handler /aktifkan/periksa is rewritten to: identity_attempt and identity_attempt_settle (CODE_VERIFY), '
   || 'service-role, and Auth''s verifyOtp. Signed out, the proxy refuses this spelling itself.', 'activation_check'),
  ('password_signin', 'ROUTE', '/masuk/password',
   'BOB-26: sign in with an email or a username and a password. POST only, same origin only. One code '
   || '(MASUK_TIDAK_COCOK) for every failure, answered no sooner than a fixed floor; counted per account '
   || '(PASSWORD_SIGNIN). Listed in PUBLIC_PATHS.', null),
  ('password_signin_api', 'ENDPOINT', '/api/masuk/password',
   'The handler /masuk/password is rewritten to: signin_resolve, identity_attempt and identity_attempt_settle '
   || '(PASSWORD_SIGNIN), service-role, and Auth''s password grant. Signed out, the proxy refuses this spelling itself.', 'password_signin');

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare r text;
begin
  if has_column_privilege('authenticated', 'public.persons', 'display_name', 'UPDATE') then
    raise exception 'BOB-26: a signed-in person can still change their own name directly';
  end if;
  if not has_column_privilege('authenticated', 'public.persons', 'photo_path', 'UPDATE') then
    raise exception 'BOB-26: the photo''s update was taken away with the name''s';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.password_write_permits'::regclass)
     or exists (select 1 from pg_policy where polrelid = 'public.password_write_permits'::regclass) then
    raise exception 'BOB-26: password_write_permits must have RLS and no policy';
  end if;
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if has_table_privilege(r, 'public.password_write_permits', 'select') or has_table_privilege(r, 'public.password_write_permits', 'insert') then
      raise exception 'BOB-26: % holds a grant on password_write_permits', r;
    end if;
  end loop;
  foreach r in array array['anon', 'authenticated'] loop
    if has_function_privilege(r, 'public.activation_code_target(text)', 'execute')
       or has_function_privilege(r, 'public.signin_resolve(text)', 'execute')
       or has_function_privilege(r, 'public.password_write_permit(uuid,text)', 'execute') then
      raise exception 'BOB-26: % can reach a signed-out lookup or the password permit', r;
    end if;
  end loop;
  if not exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'pintar_password_write_guard' and tgenabled <> 'D') then
    raise exception 'BOB-26: the password write guard is not on auth.users';
  end if;
  if public.nama_kanonik('  Bagas   Saputra ') <> 'Bagas Saputra' or public.nama_kanonik('   ') is not null
     or public.nama_kanonik(repeat('a', 201)) is not null or public.nama_kanonik(E'Bagas\tSaputra') <> 'Bagas Saputra' then
    raise exception 'BOB-26: names are not kept as ruled';
  end if;
end $$;

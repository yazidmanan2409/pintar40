-- BOB-28 (Gate 5; IDENTITY-4.0 §3-§5, C5-C7, C12, D-056, D-057(b), D-088(e)): A FORGOTTEN PASSWORD IS RECOVERED
-- BY PINTAR ID + PIN, AND A LOST CLASS CARD IS RE-ISSUED.
--
--   (1) recovery_by_pin(id, PIN, grant hash): BOB-24's ladder (recovery_attempt) decides; a match on an active email
--       account gives Gate 4's recovery grant (via 'PIN'), so the new password goes through the same door. The ladder
--       is the TYPED ID's, so an ID nobody holds walks exactly the same steps. The answer says which threshold this
--       attempt crossed (locked, suspended) or that it recovered, so the route can tell the owner and the platform
--       admin (C7); only for an ID that is a person's, and never anything secret.
--   (2) Per address too (BOB-12's per-IP part): identity_attempts gains the scope RECOVERY_PIN, keyed by the route's
--       HMAC of the caller's address, BOB-24's rule unchanged (5 free in 15 minutes, then 30 s doubling to 300 s).
--   (3) Restore path (1) (C5): a password set through an EMAIL recovery grant while the person's PIN recovery is
--       SUSPENDED restores it in the same transaction: the ladder back to 0 and a NEW PIN required. Path (2), the
--       platform admin's audited reset (admin_reset_recovery, BOB-24), gets its lookup (recovery_status) and the
--       security record its readable list (security_event_list): the platform admin's only.
--   (4) A security notice is never silenced by other email to the same address (BOB-25's gate note): notices count
--       only under the GLOBAL limit, and no other kind counts them. Their own bound is the ladder: a notice goes only
--       at a threshold of an ID that is a person's.
--   (5) D-088(e): a lost or damaged class card is RE-ISSUED. A new card number and PIN for the same account, so the
--       same person, sign-in identity and history; the old number signs nobody in; the re-issue records who, as what,
--       when and why (HILANG or RUSAK). Decided as activation is: authorize_card_reissue asks the CALLER's authority
--       (CAN_PROVISION_PEOPLE in the learner's school) and writes a two-minute re-issue grant and a one-minute
--       password permit (purpose CARD_REISSUE); the route then changes the card's Auth address and password in one
--       admin write; a guard on auth.users lets a class card's address change only against a live re-issue grant,
--       consumes it, moves accounts.card_number and writes the audit row in Auth's own transaction.

-- ═══════════════════════════════════════════════════════════ (2) per address
alter table public.identity_attempts drop constraint identity_attempts_scope_check;
alter table public.identity_attempts add constraint identity_attempts_scope_check
  check (scope in ('CODE_VERIFY', 'PASSWORD_SIGNIN', 'RECOVERY_PIN'));

-- BOB-24's rule, unchanged, for each scope: 5 free within 15 minutes, then 30 s after the last, doubling, at most 300 s.
create or replace function public.identity_attempt(p_scope text, p_kunci text)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_jendela constant interval := interval '15 minutes';
  v_nu timestamptz; v_waktu timestamptz[]; v_n int; v_sampai timestamptz;
begin
  if p_scope is null or p_scope not in ('CODE_VERIFY', 'PASSWORD_SIGNIN', 'RECOVERY_PIN') or p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$' then
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
  if p_scope is null or p_scope not in ('CODE_VERIFY', 'PASSWORD_SIGNIN', 'RECOVERY_PIN') or p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$'
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

-- ═══════════════════════════════════════════════ (1) recovery by ID + PIN
--   outcome          MALFORMED | WRONG | LOCKED | SUSPENDED (recovery_attempt's), OK (a grant was given), or
--                    NOT_ELIGIBLE (the PIN matched, but the person has no active email account to recover)
--   wait_seconds     LOCKED's wait
--   notice           TERKUNCI | DITANGGUHKAN (this attempt crossed that threshold) | PULIH_PIN (a grant was given);
--                    only for an ID that is a person's
--   owner_auth_user  the person's email account, to tell them; null when they have none
create function public.recovery_by_pin(p_typed_id text, p_pin text, p_token_hash text)
returns table (outcome text, wait_seconds integer, notice text, owner_auth_user uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id text := public.pintar_id_canonical(p_typed_id);
  v_sebelum smallint; v_sesudah smallint; v_hasil text; v_tunggu integer;
  v_person uuid; v_pemilik uuid; v_aktif boolean;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'recovery_by_pin: a grant token''s SHA-256';
  end if;
  if v_id is null then
    outcome := 'MALFORMED'; return next; return;
  end if;
  -- the ladder row is held across the attempt, so the level before and after are this attempt's own
  insert into public.recovery_ladder (typed_id) values (v_id) on conflict do nothing;
  select l.level into v_sebelum from public.recovery_ladder l where l.typed_id = v_id for update;
  select a.outcome, a.wait_seconds into v_hasil, v_tunggu from public.recovery_attempt(v_id, p_pin) a;
  select l.level into v_sesudah from public.recovery_ladder l where l.typed_id = v_id;

  select p.id into v_person from public.persons p where p.pintar_id = v_id;
  if v_person is not null and not public.adalah_persona(v_person) then
    select a.auth_user_id, coalesce(s.state = 'COMPLETE', false) into v_pemilik, v_aktif
      from public.accounts a left join public.account_setup s on s.account_id = a.id
     where a.person_id = v_person and a.kind = 'EMAIL'
     order by a.created_at limit 1;
  else
    v_person := null;
  end if;

  outcome := v_hasil; wait_seconds := v_tunggu;
  if v_hasil = 'OK' then
    if v_pemilik is not null and v_aktif then
      perform public.recovery_grant_issue(v_pemilik, p_token_hash, 'PIN');
      notice := 'PULIH_PIN';
    else
      outcome := 'NOT_ELIGIBLE';
    end if;
  elsif v_person is not null and v_sesudah > v_sebelum then
    notice := case when v_sesudah = 3 then 'DITANGGUHKAN' else 'TERKUNCI' end;
  end if;
  owner_auth_user := case when notice is not null then v_pemilik end;
  return next;
end $$;

-- ═══════════════════════════════════════════════ (3) restore path (1), and the permit's purposes
alter table public.password_write_permits drop constraint password_write_permits_purpose_check;
alter table public.password_write_permits add constraint password_write_permits_purpose_check
  check (purpose in ('ACTIVATION', 'RECOVERY', 'CARD_REISSUE'));

-- THE GUARD, as BOB-27 left it; a RECOVERY write through an EMAIL grant while the person's PIN recovery is suspended
-- also restores it (C5 path (1)): the ladder to 0 and a new PIN required, in the hash's own transaction.
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
  perform public.audit_write('identity.password_set', 'auth.users', new.id::text, null,
    jsonb_build_object('purpose', v_purpose));
  return new;
end $$;

-- ═══════════════════════════════════════════════ restore path (2): the platform admin's lookup and record
-- One PINTAR ID's person and the state of their PIN recovery. The platform admin's only; nothing for an ID nobody
-- holds. NORMAL, LOCKED (until when) or SUSPENDED; whether a new PIN is awaited.
create function public.recovery_status(p_typed_id text)
returns table (person_id uuid, display_name text, pintar_id text, state text, locked_until timestamptz,
               new_pin_required boolean, has_email_account boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_id text := public.pintar_id_canonical(p_typed_id); l public.recovery_ladder;
begin
  if not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'a person''s recovery state is the platform administrator''s (SYSTEM_ADMIN)';
  end if;
  if v_id is null then return; end if;
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
     where p.pintar_id = v_id and not public.adalah_persona(p.id);
end $$;

-- The security and recovery record (audit actions identity.* and the card re-issue), newest first, each with the
-- PINTAR ID it concerns: the ladder's typed ID, or the person's. The platform admin's only.
create function public.security_event_list(p_limit integer default 100)
returns table (at timestamptz, action text, pintar_id text, summary jsonb)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'the security record is the platform administrator''s (SYSTEM_ADMIN)';
  end if;
  return query
    select l.at, l.action,
           case l.target_table
             when 'recovery_ladder' then l.target_id
             when 'persons' then (select p.pintar_id from public.persons p where p.id::text = l.target_id)
             when 'auth.users' then (select p.pintar_id from public.accounts a join public.persons p on p.id = a.person_id
                                      where a.auth_user_id::text = l.target_id limit 1)
           end,
           l.summary
      from public.audit_log l
     where l.action like 'identity.%' or l.action = 'account.card_reissued'
     order by l.at desc, l.id desc
     limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;

-- ═══════════════════════════════════════════ (4) a security notice is never silenced by other email
create or replace function public.email_send_reserve(p_kind text, p_recipient_hash text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare l record; n integer; v_id uuid;
begin
  if p_recipient_hash is null or p_recipient_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'email_send_reserve takes the recipient''s SHA-256, never an address';
  end if;
  perform pg_advisory_xact_lock(hashtext('pintar.email_send'));
  for l in select * from public.email_send_limits order by
             case scope when 'ADDRESS_KIND' then 1 when 'ADDRESS' then 2 else 3 end, window_seconds loop
    -- BOB-28: a security notice counts only under GLOBAL, and no address limit counts notices
    continue when p_kind = 'PEMBERITAHUAN_KEAMANAN' and l.scope <> 'GLOBAL';
    select count(*) into n from public.email_send_log s
     where s.outcome <> 'REFUSED_LIMIT'
       and s.requested_at > now() - make_interval(secs => l.window_seconds)
       and (l.scope = 'GLOBAL'
            or (s.recipient_hash = p_recipient_hash and s.kind <> 'PEMBERITAHUAN_KEAMANAN'
                and (l.scope = 'ADDRESS' or s.kind = p_kind)));
    if n >= l.max_sends then
      insert into public.email_send_log (kind, recipient_hash, outcome, limit_scope, settled_at)
      values (p_kind, p_recipient_hash, 'REFUSED_LIMIT', l.scope, now()) returning id into v_id;
      return jsonb_build_object('log_id', v_id, 'allowed', false, 'limit_scope', l.scope);
    end if;
  end loop;
  insert into public.email_send_log (kind, recipient_hash) values (p_kind, p_recipient_hash) returning id into v_id;
  return jsonb_build_object('log_id', v_id, 'allowed', true, 'limit_scope', null);
end $$;

create or replace function public.email_send_would_allow(p_kind text, p_recipient_hash text)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare l record; n integer;
begin
  if p_recipient_hash is null or p_recipient_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'email_send_would_allow takes the recipient''s SHA-256, never an address';
  end if;
  for l in select * from public.email_send_limits loop
    continue when p_kind = 'PEMBERITAHUAN_KEAMANAN' and l.scope <> 'GLOBAL';
    select count(*) into n from public.email_send_log s
     where s.outcome <> 'REFUSED_LIMIT'
       and s.requested_at > now() - make_interval(secs => l.window_seconds)
       and (l.scope = 'GLOBAL'
            or (s.recipient_hash = p_recipient_hash and s.kind <> 'PEMBERITAHUAN_KEAMANAN'
                and (l.scope = 'ADDRESS' or s.kind = p_kind)));
    if n >= l.max_sends then return false; end if;
  end loop;
  return true;
end $$;

-- ═══════════════════════════════════════════════════════ (5) a lost card is re-issued
create table public.card_reissues (
  id               uuid primary key default gen_random_uuid(),
  person_id        uuid not null references public.persons (id),
  account_id       uuid not null references public.accounts (id),
  old_card_number  text not null check (old_card_number ~ '^[0-9]+$'),
  new_card_number  text not null check (new_card_number ~ '^[0-9]{10}$'),
  reason           text not null check (reason in ('HILANG', 'RUSAK')),
  institution_id   uuid references public.institutions (id),
  authorized_by    uuid not null references public.persons (id),
  authorized_role  text,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null,
  consumed_at      timestamptz
);
create index card_reissues_account on public.card_reissues (account_id);
alter table public.card_reissues enable row level security;
revoke all on table public.card_reissues from public, anon, authenticated, service_role;
comment on table public.card_reissues is
  'BOB-28 (D-088(e)): a class card re-issue''s grant: who authorized it, as what, why, the old and the new card number. '
  'Written by authorize_card_reissue, consumed by the auth.users guard when Auth moves the card''s address; the audit '
  'row account.card_reissued is written there.';

-- The class-card holders in the schools where the caller may provision people (every school for a SYSTEM_ADMIN):
-- who a lost card can be re-issued for. The card number's last four digits only; never a PIN (none is kept).
create function public.card_holders()
returns table (person_id uuid, display_name text, institutional_id text, institution_id uuid, card_last4 text)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.display_name, ii.institutional_id, ii.institution_id, right(a.card_number, 4)
    from public.institutional_identities ii
    join public.persons p on p.id = ii.person_id
    join public.accounts a on a.person_id = p.id and a.kind = 'CLASSROOM_CARD'
   where public.is_system_admin() or public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   order by ii.institution_id, p.display_name
$$;

create function public.authorize_card_reissue(p_person uuid, p_reason text, p_new_card text)
returns table (auth_user_id uuid, display_name text)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_nama text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501', message = 're-issuing a card requires CAN_PROVISION_PEOPLE in the learner''s school';
  end if;
  if p_reason is null or p_reason not in ('HILANG', 'RUSAK') then
    raise exception using errcode = 'PR040', detail = 'REASON_INVALID', message = 'a re-issue says why: HILANG or RUSAK';
  end if;
  if p_new_card is null or p_new_card !~ '^[0-9]{10}$' then
    raise exception using errcode = '22023', message = 'authorize_card_reissue: a ten-digit card number';
  end if;
  select a.* into v_akun from public.accounts a where a.person_id = p_person and a.kind = 'CLASSROOM_CARD' for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_NOT_FOUND', message = 'this person has no class card to re-issue';
  end if;
  if exists (select 1 from public.accounts a where a.card_number = p_new_card)
     or exists (select 1 from public.card_reissues r where r.new_card_number = p_new_card
                   and r.consumed_at is null and r.expires_at > clock_timestamp()) then
    raise exception using errcode = 'PR040', detail = 'CARD_NUMBER_TAKEN', message = 'that card number is taken';
  end if;
  select p.display_name into v_nama from public.persons p where p.id = p_person;
  delete from public.card_reissues r where r.account_id = v_akun.id and r.consumed_at is null;
  insert into public.card_reissues (person_id, account_id, old_card_number, new_card_number, reason, institution_id,
                                    authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_akun.card_number, p_new_card, p_reason, v_inst, v_actor,
          public.audit_actor_role(v_inst), clock_timestamp() + interval '2 minutes');
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (v_akun.auth_user_id, 'CARD_REISSUE', clock_timestamp() + interval '1 minute')
  on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at;
  -- D-093 T3: no audit row here. This is an intention; 'account.card_reissued' is written when Auth moves the card.
  auth_user_id := v_akun.auth_user_id; display_name := v_nama; return next;
end $$;

-- A class card's sign-in address changes only against a live re-issue grant for exactly the new card's address
-- (the same domain); the grant is consumed, the account's card number moves, and the re-issue is audited, all in
-- Auth's own transaction. Email accounts are not this guard's.
create function public.auth_card_email_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_akun public.accounts; r public.card_reissues;
begin
  if new.email is not distinct from old.email then
    return new;
  end if;
  select a.* into v_akun from public.accounts a where a.auth_user_id = new.id and a.kind = 'CLASSROOM_CARD';
  if v_akun.id is null then
    return new;
  end if;
  select c.* into r from public.card_reissues c
   where c.account_id = v_akun.id and c.consumed_at is null and c.expires_at > clock_timestamp()
     and lower(coalesce(new.email, '')) = 'card-' || c.new_card_number || '@' || split_part(lower(coalesce(old.email, '')), '@', 2)
   order by c.created_at desc limit 1
   for update;
  if r.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_ADDRESS_REFUSED',
      message = 'a class card''s sign-in address changes only through a re-issue';
  end if;
  update public.card_reissues set consumed_at = clock_timestamp() where id = r.id;
  update public.accounts set card_number = r.new_card_number where id = v_akun.id;
  perform public.audit_write('account.card_reissued', 'persons', v_akun.person_id::text, r.institution_id,
    jsonb_build_object('person_id', v_akun.person_id, 'reason', r.reason,
                       'from', jsonb_build_object('card_number', r.old_card_number),
                       'to', jsonb_build_object('card_number', r.new_card_number),
                       'authorized_by', r.authorized_by, 'actor_role', r.authorized_role,
                       'authorized_at', r.created_at, 'reissue_id', r.id, 'outcome', 'CARD_REISSUED'));
  return new;
end $$;
create trigger pintar_card_email_guard before update of email on auth.users
  for each row execute function public.auth_card_email_guard();

-- ═══════════════════════════════════════════════════════════════ surfaces
revoke all on function public.identity_attempt(text, text) from public, anon, authenticated;
revoke all on function public.identity_attempt_settle(text, text, text) from public, anon, authenticated;
grant execute on function public.identity_attempt(text, text) to service_role;
grant execute on function public.identity_attempt_settle(text, text, text) to service_role;
revoke all on function public.recovery_by_pin(text, text, text) from public, anon, authenticated;
grant execute on function public.recovery_by_pin(text, text, text) to service_role;
revoke all on function public.auth_password_write_guard() from public, anon, authenticated, service_role;
revoke all on function public.auth_card_email_guard() from public, anon, authenticated, service_role;
revoke all on function public.email_send_reserve(text, text) from public, anon, authenticated;
grant execute on function public.email_send_reserve(text, text) to service_role;
revoke all on function public.email_send_would_allow(text, text) from public, anon, authenticated;
grant execute on function public.email_send_would_allow(text, text) to service_role;
revoke all on function public.recovery_status(text) from public, anon;
revoke all on function public.security_event_list(integer) from public, anon;
revoke all on function public.card_holders() from public, anon;
revoke all on function public.authorize_card_reissue(uuid, text, text) from public, anon;
grant execute on function public.recovery_status(text) to authenticated;
grant execute on function public.security_event_list(integer) to authenticated;
grant execute on function public.card_holders() to authenticated;
grant execute on function public.authorize_card_reissue(uuid, text, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('recovery_status', 'STAFF', 'BOB-28: one PINTAR ID''s person and the state of their PIN recovery (NORMAL, LOCKED until, SUSPENDED; '
   || 'a new PIN awaited), for the platform administrator''s audited reset. Nothing for an ID nobody holds; never a PIN or a hash.',
   'SYSTEM_ADMIN', null),
  ('security_event_list', 'STAFF', 'BOB-28: the identity security and recovery record (identity.*, account.card_reissued), newest '
   || 'first, each with the PINTAR ID it concerns. The platform administrator''s only.', 'SYSTEM_ADMIN', null),
  ('card_holders', 'STAFF', 'BOB-28 (D-088(e)): the class-card holders in the schools where the caller holds CAN_PROVISION_PEOPLE '
   || '(every school for a SYSTEM_ADMIN): person id, name, school number, the card number''s last four digits. Never a PIN.',
   'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('authorize_card_reissue', 'STAFF', 'BOB-28 (D-088(e)): decides the re-issue of one learner''s lost or damaged class card '
   || '(HILANG or RUSAK) and writes its two-minute grant and one-minute password permit; changes nothing itself. The '
   || 'service-role route moves the card''s address and password after it; the auth.users guard consumes the grant and audits.',
   'CAPABILITY', 'CAN_PROVISION_PEOPLE');

-- The signed-out doors, declared as Gate 3's and Gate 4's are, and the public ID page the card's QR names.
insert into public.public_surface_registry (surface, kind, object, note, parent) values
  ('recovery_pin', 'ROUTE', '/masuk/lupa/pin',
   'BOB-28: recover with a PINTAR ID and the personal PIN. POST only, same origin only. The ladder is the typed ID''s '
   || '(3 wrong: 1 hour, then 4 hours, then suspended), so an ID nobody holds answers the same; counted per address too. '
   || 'A match signs nobody in: it gives the browser Gate 4''s ten-minute, single-use recovery grant. Listed in PUBLIC_PATHS.', null),
  ('recovery_pin_api', 'ENDPOINT', '/api/masuk/lupa/pin',
   'The handler /masuk/lupa/pin is rewritten to: identity_attempt and identity_attempt_settle (RECOVERY_PIN), '
   || 'recovery_by_pin, service-role. Signed out, the proxy refuses this spelling itself.', 'recovery_pin'),
  ('identity_page', 'ROUTE', '/id/[pintarId]',
   'IDENTITY-4.0 §5: the page a PINTAR card''s QR opens. The same page for every well-formed ID: it reads nothing and '
   || 'reveals neither existence, name nor school; it offers «Masuk ke PINTAR» and recovery with the PIN, which is '
   || '/masuk/lupa/pin itself (one counter, one ladder). Listed in the proxy''s PUBLIC_PREFIXES.', null);

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare r text;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.card_reissues'::regclass)
     or exists (select 1 from pg_policy where polrelid = 'public.card_reissues'::regclass) then
    raise exception 'BOB-28: card_reissues must have RLS and no policy';
  end if;
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if has_table_privilege(r, 'public.card_reissues', 'select') then
      raise exception 'BOB-28: % can read the card re-issues', r;
    end if;
  end loop;
  foreach r in array array['anon', 'authenticated'] loop
    if has_function_privilege(r, 'public.recovery_by_pin(text,text,text)', 'execute')
       or has_function_privilege(r, 'public.recovery_attempt(text,text)', 'execute') then
      raise exception 'BOB-28: % can reach PIN recovery', r;
    end if;
  end loop;
  if has_function_privilege('anon', 'public.card_holders()', 'execute')
     or has_function_privilege('anon', 'public.authorize_card_reissue(uuid,text,text)', 'execute')
     or has_function_privilege('anon', 'public.recovery_status(text)', 'execute') then
    raise exception 'BOB-28: a signed-out caller can reach a re-issue or the recovery state';
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'pintar_card_email_guard' and tgenabled <> 'D')
     or not exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'pintar_password_write_guard' and tgenabled <> 'D') then
    raise exception 'BOB-28: a guard is missing from auth.users';
  end if;
end $$;

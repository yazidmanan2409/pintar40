-- CR-13 (D-120 QN1): A STAFF MEMBER'S WRONG EMAIL IS CORRECTED, BY WHOM AND WHEN THE OWNER RULED.
--
-- «Before activation: the school admin who provisioned the person corrects it; any outstanding code dies; audited
-- with a reason. After activation (the email is then a credential channel): platform admin only, audited with a
-- reason, with a notice to both the old and the new address. Students have no email (M2).» (D-120, QN1)
--
-- Until now a mistyped staff email could be fixed only in SQL (J2.21), and nothing guarded an email account's address
-- in Auth at all. The split is the class card re-issue's (BOB-28, 20261116100000):
--   1. authorize_email_correction(person, new address, reason), asked with the CALLER's own client, decides by the
--      account's set-up state. Not yet activated (REQUIRED): CAN_PROVISION_PEOPLE in the person's school, the right
--      that provisioned them (authorize_account_activation's), or the platform admin, who provisions a school's first
--      administrator. Activated (anything else): the platform admin only. Its yes is a two-minute, single-use grant for
--      exactly that address (email_corrections). No audit row yet: it is an intention (D-093 T3).
--   2. The route moves the address through Auth's admin endpoint. The new guard on auth.users lets an EMAIL account's
--      address change only against a live grant for exactly the new address and consumes it; in Auth's own
--      transaction every outstanding code dies (the user's one-time tokens), every session ends, and the correction is
--      audited: identity.email_corrected, with the reason, the old and the new address, whether the account had been
--      activated, who and as what.
--   3. Before activation, a set-up begun through the wrong address is undone, so whoever holds that inbox keeps
--      nothing: the password is cleared, the PIN is to be chosen again and the name is to be confirmed again (the
--      person may then correct it once, as at any activation). A username already chosen stays: it is no credential,
--      and only the platform admin may change one (correct_username).
--   4. After activation the route tells the old and the new address, and PINTAR's security recipient, through the
--      existing sender (EMAIL_DIKOREKSI). The password and the set-up stay the person's own.
-- No other path changes an email account's address: an unguarded change is refused (EMAIL_CHANGE_REFUSED). The class
-- card's own guard (auth_card_email_guard) is unchanged and still answers for card addresses only.
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

-- ═══════════════════════════════════════════════════════════════ (1) the grant
create table public.email_corrections (
  id              uuid primary key default gen_random_uuid(),
  person_id       uuid not null references public.persons (id),
  account_id      uuid not null references public.accounts (id),
  old_email       text not null,
  new_email       text not null check (new_email = lower(btrim(new_email))),
  activated       boolean not null,
  reason          text not null check (btrim(reason) <> '' and length(reason) <= 500),
  institution_id  uuid references public.institutions (id),
  authorized_by   uuid not null references public.persons (id),
  authorized_role text,
  created_at      timestamptz not null default clock_timestamp(),
  expires_at      timestamptz not null,
  consumed_at     timestamptz
);
create index email_corrections_account_idx on public.email_corrections (account_id) where consumed_at is null;
alter table public.email_corrections enable row level security;
revoke all on table public.email_corrections from public, anon, authenticated, service_role;
comment on table public.email_corrections is
  'CR-13 (D-120 QN1): an email correction''s grant: who authorized it, as what, why, the old and the new address, '
  'and whether the account had been activated. Written by authorize_email_correction, consumed by the auth.users '
  'guard when Auth moves the address; the audit row identity.email_corrected is written there.';

create function public.authorize_email_correction(p_person uuid, p_email text, p_reason text)
returns table (auth_user_id uuid, old_email text, activated boolean, pintar_id text)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_lama text;
        v_baru text := lower(btrim(coalesce(p_email, ''))); v_alasan text := btrim(coalesce(p_reason, ''));
        v_aktif boolean; v_id text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'correcting an email requires CAN_PROVISION_PEOPLE in the person''s school, or the platform administrator';
  end if;
  select a.* into v_akun from public.accounts a
   where a.person_id = p_person and a.kind = 'EMAIL' and not public.adalah_persona(a.person_id)
   for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'EMAIL_ACCOUNT_NOT_FOUND', message = 'this person has no email account';
  end if;
  -- activated: anything but a set-up still REQUIRED (an account without a set-up row was never activated by the wizard
  -- and is treated as the credential channel it is)
  v_aktif := not exists (select 1 from public.account_setup s where s.account_id = v_akun.id and s.state = 'REQUIRED');
  if v_aktif and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'after activation an email is corrected by the platform administrator only (D-120 QN1)';
  end if;
  if v_alasan = '' or length(v_alasan) > 500 then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a correction states its reason (1 to 500 characters)';
  end if;
  if v_baru !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_baru) > 254 or v_baru ~ '^card-[0-9]{10}@' then
    raise exception using errcode = 'PR040', detail = 'EMAIL_INVALID', message = 'that is not an email address a person can be given';
  end if;
  select lower(u.email) into v_lama from auth.users u where u.id = v_akun.auth_user_id;
  if v_baru = v_lama then
    raise exception using errcode = 'PR040', detail = 'EMAIL_UNCHANGED', message = 'that is already the person''s email';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_baru)
     or exists (select 1 from public.email_corrections c where c.new_email = v_baru and c.consumed_at is null
                   and c.expires_at > clock_timestamp() and c.account_id <> v_akun.id)
     or exists (select 1 from public.account_activation_grants g where g.email = v_baru and g.consumed_at is null
                   and g.expires_at > clock_timestamp()) then
    raise exception using errcode = 'PR040', detail = 'EMAIL_TAKEN', message = 'that address belongs to another account';
  end if;
  select p.pintar_id into v_id from public.persons p where p.id = p_person;
  delete from public.email_corrections c where c.account_id = v_akun.id and c.consumed_at is null;
  insert into public.email_corrections (person_id, account_id, old_email, new_email, activated, reason, institution_id,
                                        authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_lama, v_baru, v_aktif, v_alasan, v_inst, v_actor, public.audit_actor_role(v_inst),
          clock_timestamp() + interval '2 minutes');
  -- D-093 T3: no audit row here. This is an intention; 'identity.email_corrected' is written when Auth moves it.
  auth_user_id := v_akun.auth_user_id; old_email := v_lama; activated := v_aktif; pintar_id := v_id; return next;
end $$;
revoke all on function public.authorize_email_correction(uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.authorize_email_correction(uuid, text, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('authorize_email_correction', 'STAFF', 'CR-13 (D-120 QN1): decides the correction of one staff member''s wrong email, with a reason: '
   || 'before activation CAN_PROVISION_PEOPLE in the person''s school or the platform administrator, after it the platform '
   || 'administrator only; writes a two-minute grant for exactly the new address and changes nothing itself. The service-role '
   || 'route moves the address after it; the auth.users guard consumes the grant, ends codes and sessions and audits.',
   'CAPABILITY', 'CAN_PROVISION_PEOPLE');

-- ═══════════════════════════════════════════════════════════════ (2) the guard
-- An EMAIL account's sign-in address changes only against a live correction grant for exactly the new address; the
-- grant is consumed, every outstanding code and session ends, a set-up begun through the old address is undone, and
-- the correction is audited, all in Auth's own transaction. Class card addresses are auth_card_email_guard's; a user
-- with no account yet (Auth's own insert path) is neither's.
create function public.auth_email_correction_guard()
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

  -- every outstanding code dies: a code sent to the old address must not open the account under the new one
  new.confirmation_token := '';
  new.recovery_token := '';
  new.email_change := '';
  new.email_change_token_new := '';
  new.email_change_token_current := '';
  new.reauthentication_token := '';
  delete from auth.one_time_tokens t where t.user_id = new.id;

  -- before activation, whatever was begun through the old address is undone
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
create trigger pintar_email_correction_guard before update of email on auth.users
  for each row execute function public.auth_email_correction_guard();

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
begin
  if has_function_privilege('anon', 'public.authorize_email_correction(uuid,text,text)', 'execute')
     or has_function_privilege('service_role', 'public.authorize_email_correction(uuid,text,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.authorize_email_correction(uuid,text,text)', 'execute') then
    raise exception 'authorize_email_correction is reached by the wrong roles';
  end if;
  if has_table_privilege('authenticated', 'public.email_corrections', 'select')
     or has_table_privilege('service_role', 'public.email_corrections', 'select') then
    raise exception 'email_corrections is readable';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'pintar_email_correction_guard' and tgrelid = 'auth.users'::regclass) then
    raise exception 'the email correction guard is not on auth.users';
  end if;
end $$;

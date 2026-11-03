-- D-152(a) (Batch 4): A CLASS-CARD LEARNER WHO BECOMES STAFF DOES SO THROUGH AN EMAIL ACCOUNT, AS THE SAME PERSON.
--
-- CR-91 (D-145(a), 20261212100000) made a class card a learner's alone: no person holds a class-card account and a
-- staff role. That left one real case without a path (batch-1/04 §3): a learner who becomes staff (an assistant, a
-- graduate who returns to teach). The only account they have is a card, a staff role is refused over it
-- (STAFF_ROLE_FOR_CARD), and an account's kind never changed. Replacing the person, or adding a second account, would
-- split their identity, their PINTAR ID and their history.
--
-- Now the card ACCOUNT itself becomes an EMAIL account, the person and the account row unchanged. The split is the
-- card re-issue's and the email correction's (BOB-28, CR-13):
--   1. authorize_card_conversion(person, address, reason), asked with the CALLER's own client: CAN_PROVISION_PEOPLE in
--      the learner's school (the right that issued the card) or the platform admin; a reason of 10 to 500 characters;
--      a well-formed address no account uses; a person who holds a class card. Its yes is a two-minute, single-use
--      grant for exactly that address (card_conversions). No audit row yet: it is an intention (D-093 T3).
--   2. The route moves the card's sign-in address to the new address through Auth's admin endpoint. The card's own
--      guard on auth.users (auth_card_email_guard, re-emitted here) consumes a live grant for exactly that address
--      and, in Auth's own transaction: the account's kind becomes EMAIL and its card number goes (the same row, the
--      same Auth user, the same person); the card's PIN no longer signs in (the password is cleared); every
--      outstanding code and session ends; the account's set-up starts REQUIRED, so the person activates it as any
--      staff member does, with a code to the new address (username, PIN, password, name); the conversion is audited
--      (account.card_converted_to_email: the reason, the old card, the new address, who and as what).
--   3. Nothing else changes. CR-91's two triggers are unchanged and still decide: a staff role is refused while the
--      card exists, and granted once the account is an email account. Everything keyed by the person (enrolments,
--      results, certificates, the PINTAR ID, the audit trail) stays with them; nothing is copied or moved.
-- The email account's own guard (auth_email_correction_guard) is re-emitted with one line: the same address change the
-- card guard has just converted is not asked for an email-correction grant (a transaction-local marker naming that
-- account, consumed at once). Every other change of an email account's address is refused as before.
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

-- ═══════════════════════════════════════════════════════════════ (1) the grant
create table public.card_conversions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons(id),
  account_id uuid not null references public.accounts(id),
  old_card_number text not null,
  new_email text not null,
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  institution_id uuid references public.institutions(id),
  authorized_by uuid not null references public.persons(id),
  authorized_role text,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
alter table public.card_conversions enable row level security;
revoke all on public.card_conversions from public, anon, authenticated, service_role;

create function public.authorize_card_conversion(p_person uuid, p_email text, p_reason text)
returns table (auth_user_id uuid, display_name text)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_nama text;
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501',
      message = 'converting a class card requires CAN_PROVISION_PEOPLE in the learner''s school';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 10 and 500 then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a conversion says why (10 to 500 characters)';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception using errcode = 'PR040', detail = 'EMAIL_INVALID', message = 'not an email address';
  end if;
  select a.* into v_akun from public.accounts a where a.person_id = p_person and a.kind = 'CLASSROOM_CARD' for update;
  if v_akun.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_NOT_FOUND', message = 'this person has no class card to convert';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email)
     or exists (select 1 from public.card_conversions c where c.new_email = v_email
                   and c.consumed_at is null and c.expires_at > clock_timestamp() and c.account_id <> v_akun.id) then
    raise exception using errcode = 'PR040', detail = 'EMAIL_TAKEN', message = 'that address is already an account''s';
  end if;
  select p.display_name into v_nama from public.persons p where p.id = p_person;
  delete from public.card_conversions c where c.account_id = v_akun.id and c.consumed_at is null;
  insert into public.card_conversions (person_id, account_id, old_card_number, new_email, reason, institution_id,
                                       authorized_by, authorized_role, expires_at)
  values (p_person, v_akun.id, v_akun.card_number, v_email, btrim(p_reason), v_inst, v_actor,
          public.audit_actor_role(v_inst), clock_timestamp() + interval '2 minutes');
  -- D-093 T3: no audit row here. 'account.card_converted_to_email' is written when Auth moves the address.
  auth_user_id := v_akun.auth_user_id; display_name := v_nama; return next;
end $$;
revoke all on function public.authorize_card_conversion(uuid, text, text) from public, anon, service_role;
grant execute on function public.authorize_card_conversion(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════ (2) the card's guard
-- 20261116100000's text, with the conversion branch first. A class card's sign-in address changes only against a live
-- grant: a conversion's for exactly the new address, or a re-issue's for exactly the new card's address.
create or replace function public.auth_card_email_guard()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_akun public.accounts; r public.card_reissues; k public.card_conversions;
begin
  if new.email is not distinct from old.email then
    return new;
  end if;
  select a.* into v_akun from public.accounts a where a.auth_user_id = new.id and a.kind = 'CLASSROOM_CARD';
  if v_akun.id is null then
    return new;
  end if;

  -- D-152(a): the card account becomes an email account
  select c.* into k from public.card_conversions c
   where c.account_id = v_akun.id and c.consumed_at is null and c.expires_at > clock_timestamp()
     and c.new_email = lower(btrim(coalesce(new.email, '')))
   order by c.created_at desc limit 1
   for update;
  if k.id is not null then
    update public.card_conversions set consumed_at = clock_timestamp() where id = k.id;
    update public.accounts set kind = 'EMAIL', card_number = null where id = v_akun.id;
    insert into public.account_setup (account_id, state) values (v_akun.id, 'REQUIRED')
    on conflict (account_id) do update set state = 'REQUIRED', completed_at = null, password_set_at = null,
                                           name_confirmed_at = null;
    -- the card's PIN signs nobody in; every outstanding code dies
    new.encrypted_password := '';
    new.confirmation_token := '';
    new.recovery_token := '';
    new.email_change := '';
    new.email_change_token_new := '';
    new.email_change_token_current := '';
    new.reauthentication_token := '';
    delete from auth.one_time_tokens t where t.user_id = new.id;
    update public.person_pins set reset_required = true where person_id = v_akun.person_id;
    perform public.sesi_akhiri_orang(new.id, 'KREDENSIAL_DIGANTI');
    -- the email account's guard, next on this row, is told that this one change is this conversion's
    perform set_config('pintar.kartu_jadi_email', v_akun.id::text, true);
    perform public.audit_write('account.card_converted_to_email', 'persons', v_akun.person_id::text, k.institution_id,
      jsonb_build_object('person_id', v_akun.person_id, 'reason', k.reason,
                         'from', jsonb_build_object('card_number', k.old_card_number),
                         'to', jsonb_build_object('email', k.new_email),
                         'authorized_by', k.authorized_by, 'actor_role', k.authorized_role,
                         'authorized_at', k.created_at, 'conversion_id', k.id, 'outcome', 'CARD_CONVERTED'));
    return new;
  end if;

  select c.* into r from public.card_reissues c
   where c.account_id = v_akun.id and c.consumed_at is null and c.expires_at > clock_timestamp()
     and lower(coalesce(new.email, '')) = 'card-' || c.new_card_number || '@' || split_part(lower(coalesce(old.email, '')), '@', 2)
   order by c.created_at desc limit 1
   for update;
  if r.id is null then
    raise exception using errcode = 'PR040', detail = 'CARD_ADDRESS_REFUSED',
      message = 'a class card''s sign-in address changes only through a re-issue or a conversion';
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
revoke all on function public.auth_card_email_guard() from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════ (3) the email account's guard
-- 20261203100000's text with the conversion's one exception at the top.
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

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('authorize_card_conversion', 'STAFF',
   'D-152(a) (Batch 4): a class-card learner who becomes staff: CAN_PROVISION_PEOPLE in the learner''s school or the '
   || 'platform admin authorises converting the card account to an email account (a reason, an unused address); a '
   || 'two-minute grant for exactly that address, consumed by the card guard on auth.users, which keeps the same '
   || 'account, Auth user and person, clears the card''s PIN, ends sessions, starts the set-up REQUIRED and audits '
   || 'account.card_converted_to_email. CR-91 is unchanged.',
   'CAPABILITY', 'CAN_PROVISION_PEOPLE');

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
begin
  if has_function_privilege('anon', 'public.authorize_card_conversion(uuid,text,text)', 'execute')
     or has_function_privilege('service_role', 'public.authorize_card_conversion(uuid,text,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.authorize_card_conversion(uuid,text,text)', 'execute') then
    raise exception 'authorize_card_conversion is reached by the wrong roles';
  end if;
  if has_table_privilege('authenticated', 'public.card_conversions', 'select')
     or has_table_privilege('service_role', 'public.card_conversions', 'select') then
    raise exception 'card_conversions is readable';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'pintar_card_email_guard' and tgrelid = 'auth.users'::regclass)
     or not exists (select 1 from pg_trigger where tgname = 'pintar_email_correction_guard' and tgrelid = 'auth.users'::regclass) then
    raise exception 'a guard on auth.users is missing';
  end if;
  -- the card guard must run before the email guard on the same row: triggers fire in name order
  if 'pintar_card_email_guard' >= 'pintar_email_correction_guard' then
    raise exception 'the guards no longer fire in the order the conversion needs';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'role_assignments_card_holds_no_role')
     or not exists (select 1 from pg_trigger where tgname = 'accounts_card_is_learners') then
    raise exception 'CR-91''s triggers are missing';
  end if;
end $$;

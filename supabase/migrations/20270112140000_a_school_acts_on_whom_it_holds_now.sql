-- SI-D03 (System Integrity, 9 Nov). A school acts on a person's credentials only while it holds the person now.
--
-- Found by the account-lifecycle inventory and confirmed by Sharon (review of 89374424). Five credential paths took
-- their school from the person's registration number (institutional_identities), which is permanent:
--   recovery_assist_school (admin_reset_recovery), authorize_card_reissue, authorize_card_conversion,
--   authorize_email_correction, authorize_account_activation.
-- So a former school kept power over a learner who had transferred or withdrawn: a reset that ends every session,
-- a new sign-in card, a card converted to an email of the caller's choice, an activation email redirected. Recovery
-- also read a role's end and not its start. F37-S01 and F37-S02 were red on 6070cd60 and 44aec55c.
--
-- The owner's rule (9 Nov): a historical registration alone confers no credential-management authority; current
-- affiliation and narrowly defined onboarding keep it. sekolah_memegang(person, school) is true when the school
--   * places the person now: a role that has started, has not ended and is not revoked, or a PENDING/ACTIVE
--     enrolment; or
--   * is onboarding them: it issued their registration number, has never enrolled them (no enrolment of any status),
--     no other school places them now, and they have never activated an account (no account, or one still in its
--     REQUIRED setup). A role at the school does not end onboarding while the person has never activated, so the
--     approved CR-91 transitions hold (F23-C07: a Guru never activated whose role was revoked or expired is given a
--     learner's card by the same school; F23-C01: a teacher hired for later is activated now). Once a person has
--     activated, only current placement decides: a retired teacher's former school keeps no power over the account.
--     (Sharon proposed «no role, past or present»; F23-C07's approved rule needs the never-activated form. Flagged
--     for her review.)
-- The registration numbers, enrolments and transfers are not touched: the record stays; only the authority moves.
-- Each path keeps its own capability check (CAN_PROVISION_PEOPLE, or the school's active INSTITUTION_ADMIN) and
-- its own refusal; only the school it may act from narrows.

create or replace function public.sekolah_memegang(p_person uuid, p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_person is not null and p_institution is not null and (
    exists (select 1 from public.role_assignments ra
             where ra.person_id = p_person and ra.institution_id = p_institution and ra.role <> 'SYSTEM_ADMIN'
               and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)
    or exists (select 1 from public.enrollments e
                where e.person_id = p_person and e.institution_id = p_institution and e.status in ('PENDING', 'ACTIVE'))
    or (exists (select 1 from public.institutional_identities ii
                 where ii.person_id = p_person and ii.institution_id = p_institution)
        and not exists (select 1 from public.enrollments e
                         where e.person_id = p_person and e.institution_id = p_institution)
        and not exists (select 1 from public.accounts a
                         where a.person_id = p_person
                           and not exists (select 1 from public.account_setup st
                                            where st.account_id = a.id and st.state = 'REQUIRED'))
        and not exists (select 1 from public.role_assignments ra
                         where ra.person_id = p_person and ra.institution_id is distinct from p_institution
                           and ra.role <> 'SYSTEM_ADMIN' and ra.revoked_at is null
                           and now() >= ra.valid_from and now() < ra.valid_until)
        and not exists (select 1 from public.enrollments e
                         where e.person_id = p_person and e.institution_id <> p_institution
                           and e.status in ('PENDING', 'ACTIVE'))))
$$;
-- internal: read only by the definer functions below, never by a client
revoke all on function public.sekolah_memegang(uuid, uuid) from public, anon, authenticated;

-- the recovery reset's school (admin_reset_recovery through recovery_may_assist)
CREATE OR REPLACE FUNCTION public.recovery_assist_school(p_person uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select mine.institution_id
    from public.role_assignments mine
    join public.org_nodes o on o.institution_id = mine.institution_id and o.kind = 'INSTITUTION'
   where mine.person_id = public.current_person_id() and p_person is distinct from public.current_person_id()
     and mine.role = 'INSTITUTION_ADMIN' and mine.revoked_at is null and now() >= mine.valid_from and now() < mine.valid_until
     and public.has_scope('INSTITUTION_ADMIN', o.id)
     -- SI-D03: the person is placed at this school now, or the school is onboarding them
     and public.sekolah_memegang(p_person, mine.institution_id)
   order by mine.institution_id
   limit 1
$function$;
revoke all on function public.recovery_assist_school(uuid) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.authorize_card_reissue(p_person uuid, p_reason text, p_new_card text)
 RETURNS TABLE(auth_user_id uuid, display_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
#variable_conflict use_column
declare v_actor uuid := public.current_person_id(); v_inst uuid; v_akun public.accounts; v_nama text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
     and public.sekolah_memegang(p_person, ii.institution_id)   -- SI-D03: the school holds the person now
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
  -- CR-91 (D-145(a)): never a card for a person who holds a staff role (the account invariant should make this
  -- unreachable; it is refused here by name all the same)
  if public.memegang_peran_staf(p_person) then
    raise exception using errcode = '42501', detail = 'CARD_FOR_STAFF',
      message = 'a class card is for learners only: this person holds a staff role (CR-91)';
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
end;
$function$;
revoke all on function public.authorize_card_reissue(uuid, text, text) from public, anon, authenticated;
grant execute on function public.authorize_card_reissue(uuid, text, text) to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.authorize_card_conversion(p_person uuid, p_email text, p_reason text)
 RETURNS TABLE(auth_user_id uuid, display_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
     and public.sekolah_memegang(p_person, ii.institution_id)   -- SI-D03: the school holds the person now
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
end;
$function$;
revoke all on function public.authorize_card_conversion(uuid, text, text) from public, anon, authenticated;
grant execute on function public.authorize_card_conversion(uuid, text, text) to authenticated;

CREATE OR REPLACE FUNCTION public.authorize_email_correction(p_person uuid, p_email text, p_reason text)
 RETURNS TABLE(auth_user_id uuid, old_email text, activated boolean, pintar_id text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
     and public.sekolah_memegang(p_person, ii.institution_id)   -- SI-D03: the school holds the person now
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
end;
$function$;
revoke all on function public.authorize_email_correction(uuid, text, text) from public, anon, authenticated;
grant execute on function public.authorize_email_correction(uuid, text, text) to authenticated;

CREATE OR REPLACE FUNCTION public.authorize_account_activation(p_person uuid, p_kind text, p_email text, p_card_number text DEFAULT NULL::text)
 RETURNS TABLE(display_name text, institution_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid; v_name text; v_inst uuid; v_email text;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
     and public.sekolah_memegang(p_person, ii.institution_id)   -- SI-D03: the school holds the person now
   limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception 'activating an account requires CAN_PROVISION_PEOPLE in the person''s institution';
  end if;
  select p.display_name into v_name from public.persons p where p.id = p_person;
  if v_name is null then raise exception 'unknown person'; end if;
  if p_kind not in ('EMAIL', 'CLASSROOM_CARD') then
    raise exception 'an account is EMAIL or CLASSROOM_CARD, not %', p_kind;
  end if;
  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'an account needs a valid email address';
  end if;
  if (p_kind = 'CLASSROOM_CARD') <> (p_card_number is not null)
     or (p_card_number is not null and p_card_number !~ '^[0-9]{10}$') then
    raise exception 'a classroom card account names its ten-digit card, and only a card account does';
  end if;
  if exists (select 1 from public.accounts a where a.person_id = p_person) then
    raise exception 'this person already has an account';
  end if;
  -- CR-91 (D-145(a)): a class card is a learner's alone. Refused before any grant is written.
  if p_kind = 'CLASSROOM_CARD' and public.memegang_peran_staf(p_person) then
    raise exception using errcode = '42501', detail = 'CARD_FOR_STAFF',
      message = 'a class card is for learners only: this person holds a staff role and activates with email (CR-91)';
  end if;
  insert into public.account_activation_grants (email, person_id, kind, card_number, institution_id, authorized_by,
                                                authorized_role)
  values (v_email, p_person, p_kind::public.account_kind, p_card_number, v_inst, v_actor,
          public.audit_actor_role(v_inst));
  -- D-093 T3: no audit row here. This is an intention; 'account.activated' is written when the account exists.
  display_name := v_name; institution_id := v_inst; return next;
end;
$function$;
revoke all on function public.authorize_account_activation(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.authorize_account_activation(uuid, text, text, text) to authenticated, service_role;

-- verification: every credential path asks sekolah_memegang; none authorizes on a registration number alone
do $$
declare v_f text; v_src text;
begin
  foreach v_f in array array['recovery_assist_school', 'authorize_card_reissue', 'authorize_card_conversion',
                             'authorize_email_correction', 'authorize_account_activation'] loop
    select string_agg(prosrc, ' ') into v_src from pg_proc where proname = v_f and pronamespace = 'public'::regnamespace;
    if v_src is null or position('sekolah_memegang' in v_src) = 0 then
      raise exception 'SI-D03: % does not ask whether the school holds the person now', v_f;
    end if;
  end loop;
  select prosrc into v_src from pg_proc where proname = 'recovery_assist_school' and pronamespace = 'public'::regnamespace;
  if position('institutional_identities' in v_src) > 0 then
    raise exception 'SI-D03: recovery_assist_school still reads institutional_identities itself';
  end if;
  if has_function_privilege('authenticated', 'public.sekolah_memegang(uuid, uuid)', 'execute')
     or has_function_privilege('anon', 'public.sekolah_memegang(uuid, uuid)', 'execute') then
    raise exception 'SI-D03: sekolah_memegang is a client function';
  end if;
end $$;

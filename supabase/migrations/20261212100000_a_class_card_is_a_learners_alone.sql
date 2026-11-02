-- CR-91 (Batch 1; F-3 ruled by the owner, D-145(a)): A CLASS CARD IS A LEARNER'S ALONE.
--
-- The finding (docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md, CR-91): a class card (ten digits and a short
-- PIN) could be activated for any provisioned person, staff included, and a card session carries the person's full
-- capabilities, because every capability check derives from current_person_id() and role_assignments. The owner ruled
-- Option A: class cards are for learners only; staff activate with email; educators who also learn (J9) do so with
-- their own email account and working context.
--
-- WHY AN INVARIANT, NOT A SESSION FILTER. Capability is read from role_assignments in some 219 places (helpers and
-- policies). Withholding staff power per session would have to reach every one of them and would rest on a claim.
-- Instead the database never lets the two meet on one person: A CLASSROOM_CARD ACCOUNT AND A STAFF ROLE THAT IS NOT
-- REVOKED AND NOT EXPIRED (future-dated included) NEVER BELONG TO THE SAME PERSON. A card session therefore has no
-- staff capability to carry, whichever path made the account or the grant. Enforced from both sides:
--   accounts_card_is_learners        BEFORE INSERT OR UPDATE OF person_id, kind ON accounts: every way an account
--                                    comes to exist (the activation grant, the seed/day-zero branch of
--                                    handle_new_auth_user, any future path) or is re-pointed
--   role_assignments_card_holds_no_role  BEFORE INSERT ON role_assignments: every grant path (grant_role, the first
--                                    administrator, the installation bootstrap, the importer, a seed)
-- and refused early, by name (42501, detail CARD_FOR_STAFF), where an administrator asks:
--   authorize_account_activation (a card for a staff person), authorize_card_reissue (likewise).
-- The application adds its own two checks (D-145(a): «in the database and application»): Aktivasi offers a card only
-- where persons_awaiting_account says boleh_kartu, and the card sign-in route asks kartu_bukan_staf() as the new
-- session and ends it if the answer is no.
--
-- EXISTING DATA. Staging held 1,353 card accounts and none whose person has an active staff role (read 2 Nov). The
-- closing block REFUSES the migration if any person holds both, so a database where the rule is already broken
-- (production has not been read since 23 Sep) stops here, intact, rather than being silently "fixed": resolving such
-- a person is an owner decision (revoke the role, or replace the card with an email account).
--
-- Proven red → green by selftest/db/fable23.sql (F23-C01 … F23-C06) and selftest/cr91.test.ts.

create or replace function public.memegang_peran_staf(p_person uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  -- any staff role not revoked and not yet expired, a future-dated one included: a card cannot be issued now and
  -- the grant take effect later
  select exists (select 1 from public.role_assignments ra
                  where ra.person_id = p_person and ra.revoked_at is null and now() < ra.valid_until)
$$;
revoke all on function public.memegang_peran_staf(uuid) from public, anon, authenticated, service_role;

create or replace function public.accounts_card_is_learners()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.kind = 'CLASSROOM_CARD' and public.memegang_peran_staf(new.person_id) then
    raise exception using errcode = '42501', detail = 'CARD_FOR_STAFF',
      message = 'a class card is for learners only: this person holds a staff role (CR-91)';
  end if;
  return new;
end $$;
revoke all on function public.accounts_card_is_learners() from public, anon, authenticated, service_role;
create trigger accounts_card_is_learners
  before insert or update of person_id, kind on public.accounts
  for each row execute function public.accounts_card_is_learners();

create or replace function public.role_assignments_card_holds_no_role()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.accounts a where a.person_id = new.person_id and a.kind = 'CLASSROOM_CARD') then
    raise exception using errcode = '42501', detail = 'STAFF_ROLE_FOR_CARD',
      message = 'a staff role is never granted to a class-card account; the person needs an email account (CR-91)';
  end if;
  return new;
end $$;
revoke all on function public.role_assignments_card_holds_no_role() from public, anon, authenticated, service_role;
create trigger role_assignments_card_holds_no_role
  before insert on public.role_assignments
  for each row execute function public.role_assignments_card_holds_no_role();

-- 20261111100000's body, with the CR-91 refusal
create or replace function public.authorize_account_activation(
  p_person uuid, p_kind text, p_email text, p_card_number text default null)
returns table (display_name text, institution_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_name text; v_inst uuid; v_email text;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select ii.institution_id into v_inst from public.institutional_identities ii
   where ii.person_id = p_person and public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id)
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
end $$;
revoke all on function public.authorize_account_activation(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.authorize_account_activation(uuid, text, text, text) to authenticated;

-- 20261116100000's body, with the CR-91 refusal
create or replace function public.authorize_card_reissue(p_person uuid, p_reason text, p_new_card text)
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
end $$;
revoke all on function public.authorize_card_reissue(uuid, text, text) from public, anon, authenticated;
grant execute on function public.authorize_card_reissue(uuid, text, text) to authenticated;

-- Aktivasi's list, now saying whether a card may be offered (the return type grows, so the function is re-made)
drop function public.persons_awaiting_account();
create function public.persons_awaiting_account()
returns table (person_id uuid, display_name text, institutional_id text, institution_id uuid, boleh_kartu boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.display_name, ii.institutional_id, ii.institution_id, not public.memegang_peran_staf(p.id)
    from public.institutional_identities ii
    join public.persons p on p.id = ii.person_id
   where not exists (select 1 from public.accounts a where a.person_id = p.id)
     and (public.is_system_admin() or public.can_on_node('CAN_PROVISION_PEOPLE', ii.institution_id))
   order by ii.institution_id, p.display_name
$$;
revoke all on function public.persons_awaiting_account() from public, anon, authenticated;
grant execute on function public.persons_awaiting_account() to authenticated;

-- The card sign-in's own question, asked by the new session: is this session a card whose person holds a staff
-- role? False for everything else (an email account, no account). The invariant should make it always true; the
-- route ends the session if it is not.
create or replace function public.kartu_bukan_staf()
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  -- the caller's own person (current_person_id: one account per person), never an argument
  select not exists (select 1 from public.accounts a
                      where a.person_id = public.current_person_id() and a.kind = 'CLASSROOM_CARD'
                        and public.memegang_peran_staf(a.person_id))
$$;
revoke all on function public.kartu_bukan_staf() from public, anon, authenticated;
grant execute on function public.kartu_bukan_staf() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('kartu_bukan_staf', 'LEARNER', 'CR-91 (D-145(a)), the caller''s own session: the card sign-in route asks it as the new '
   || 'session; false only for a class card whose person holds a staff role, and the route then ends the session. Reads '
   || 'the caller''s own account only; decides nothing else.', null, null);
update public.client_rpc_registry
   set note = note || ' CR-91 (D-145(a)): boleh_kartu is false for a person holding a staff role; a card is a learner''s alone.'
 where function_name = 'persons_awaiting_account' and note not like '%CR-91%';

do $$
declare v int;
begin
  -- THE INVARIANT HOLDS ON THIS DATABASE: no person holds a class card and a staff role that is not revoked or expired
  select count(*) into v from public.accounts a
   where a.kind = 'CLASSROOM_CARD' and public.memegang_peran_staf(a.person_id);
  if v > 0 then
    raise exception 'CR-91: % person(s) hold a class card and a staff role; resolve them (owner decision) before this rule can stand', v;
  end if;
  -- both sides are guarded
  if not exists (select 1 from pg_trigger where tgname = 'accounts_card_is_learners' and tgrelid = 'public.accounts'::regclass)
     or not exists (select 1 from pg_trigger where tgname = 'role_assignments_card_holds_no_role'
                                               and tgrelid = 'public.role_assignments'::regclass) then
    raise exception 'CR-91: the card/staff invariant is not guarded from both sides';
  end if;
  -- the administrators' two doors refuse by name
  if position('CARD_FOR_STAFF' in pg_get_functiondef('public.authorize_account_activation(uuid,text,text,text)'::regprocedure)) = 0
     or position('CARD_FOR_STAFF' in pg_get_functiondef('public.authorize_card_reissue(uuid,text,text)'::regprocedure)) = 0 then
    raise exception 'CR-91: an administrator could still ask for a card for a staff person';
  end if;
  -- the helper is nobody's to call; the sign-in check is the session's own
  if has_function_privilege('authenticated', 'public.memegang_peran_staf(uuid)', 'execute')
     or has_function_privilege('anon', 'public.kartu_bukan_staf()', 'execute') then
    raise exception 'CR-91: a helper is reachable by a client it is not for';
  end if;
end $$;

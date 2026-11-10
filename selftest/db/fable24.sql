-- FABLE-24 database suite: Batch 4 (D-152) — administration, identity and account management.
--
-- Ordering: depends on fable01.sql (the role switches), fable06/11/12 (fixture helpers) and fable23.sql (f23_raised).
-- Never applied as a migration; never present in production.
--
--   F24-K01  A CARD LEARNER BECOMES STAFF THROUGH AN EMAIL ACCOUNT (D-152(a), CR-91 kept): the school admin converts a
--            class-card learner's account to an email account (authorize_card_conversion, then Auth moves the
--            address); the SAME account row, the same Auth user and the same person remain, so every record keyed by
--            the person (enrolments, PINTAR ID, audit) stays; the card number signs nobody in; the account is an EMAIL
--            account whose set-up is REQUIRED, so the person activates it with a code to the new address; the
--            conversion is audited (account.card_converted_to_email: reason, the old card, the new address, by whom);
--            only then may a staff role be granted, and the person then holds a role and no class card (CR-91)
--   F24-O01  FINDING A PERSON TO CORRECT (W2.1-W2.3): orang_berakun's scope (the platform admin everyone; a school
--            admin their school's people; a Guru nobody), at most 50 a page, and per row only the corrections the
--            database accepts from this reader (email before activation for the school admin; everything for the
--            platform admin)
--   F24-P01  A TRANSFER BY NAME (W2.15, F-10): the directory by exact name or code, audited; the sending school asks
--            with no school year; the receiving school sees the learner's name only, accepts into its own year, executes
--   F24-P03  THE TRANSFER KEEPS HISTORY AND ISOLATION (promotion gate, condition 3)
--   F24-P02  THE TRANSFER'S REFUSALS: the wrong side accepting or asking, the wrong year, no reason, twice, a short or
--            unauthorised search
--   F24-E01  STUCK SENDS (W2.19, J1.9): email_send_stuck lists, for the platform admin only, the sends still waiting on
--            the email server after N minutes, with their age; fresh and accepted sends are not listed
--   F24-H01  MAINTENANCE A PAGE AT A TIME (W2.10): maintenance_list pages windows and notices (20) and narrows them to
--            a school in the database
--   F24-K03  AN INTERRUPTED CONVERSION (promotion gate, condition 2): nothing half-done, CR-91 intact, a recovery path
--   F24-K02  THE CONVERSION'S REFUSALS: without a reason (REASON_REQUIRED), to a Guru and to another school's
--            administrator (42501), for a person with no class card (CARD_NOT_FOUND), to an address an account
--            already uses (EMAIL_TAKEN), to a malformed address (EMAIL_INVALID); a card's address moved without a live
--            grant, or to an address other than the granted one, is still refused (CARD_ADDRESS_REFUSED); after a
--            conversion, an unguarded change of the new email address is refused (EMAIL_CHANGE_REFUSED)
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb of problems, a sentinel to undo the
-- lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f23_raised(text)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null then
    raise exception 'apply fable01, fable06, fable11, fable12 and fable23.sql before fable24.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f24_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f24_note(jsonb, text, text) to authenticated, anon;

create or replace function selftest.run_fable24()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  v_snap text; v_snap2 text;
  v_a uuid; v_node uuid; v_murid uuid; v_lain uuid; v_akun public.accounts; v_akun2 public.accounts; v_uid uuid;
  v_err text; v_n int; v_b boolean; v_kartu text; v_email text; v_jejak jsonb; v_ra uuid; v_pid text; v_guru uuid;
  v_adm_b uuid; v_w_b uuid; v_enrol int; v_beta uuid; v_beta_per uuid; v_alpha_per uuid; v_en uuid; v_tf uuid; v_siswa uuid; v_bnama text; v_bkelas uuid; v_akelas uuid;
begin
  begin
    select i.id into v_a from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
    select n.id into v_node from public.org_nodes n where n.institution_id = v_a and n.kind = 'INSTITUTION' limit 1;
    if v_a is null or v_node is null then raise exception 'the fixture lacks the alpha school or its node'; end if;

    -- alpha gives numbers: it reserves a namespace first if the fixture has none (rolled back with the rest; fable23's step)
    if (select x.namespace from public.institutions x where x.id = v_a) is null then
      for v_n in 1..50 loop
        v_err := upper(substr(md5(v_tag || v_n::text), 1, 3));
        exit when not exists (select 1 from public.institutions x where upper(x.namespace) = v_err);
      end loop;
      update public.institutions set namespace = v_err where institutions.id = v_a;
    end if;
    -- a class-card learner of alpha, with a PINTAR ID: made the way Aktivasi makes one (F23-C07's path)
    v_kartu := '92' || lpad((floor(random() * 1e8))::bigint::text, 8, '0');
    v_email := 'f24-' || v_tag || '@local.invalid';
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.persons (display_name) values ('Murid Kartu F24 ' || v_tag) returning persons.id into v_murid;
    insert into public.persons (display_name) values ('Guru Surel F24 ' || v_tag) returning persons.id into v_lain;
    perform public.issue_institutional_id(v_murid, v_a);
    perform public.issue_institutional_id(v_lain, v_a);
    perform set_config('app.seed_intent', '', true);
    perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    perform * from public.authorize_account_activation(v_murid, 'CLASSROOM_CARD',
      'card-' || v_kartu || '@cards.synthetic.pintar.test', v_kartu);
    perform selftest.as_owner();
    insert into auth.users (id, email) values (gen_random_uuid(), 'card-' || v_kartu || '@cards.synthetic.pintar.test');
    select a.* into v_akun from public.accounts a where a.person_id = v_murid;
    if v_akun.id is null or v_akun.kind <> 'CLASSROOM_CARD' then raise exception 'the fixture card account was not made'; end if;
    -- RESTATED FOR SI-D03 (owner, 9 Nov: historical registration alone confers no credential authority; Sharon's
    -- review of 89374424): the card learner is enrolled at alpha, as a class-card learner is. The fixture had given the
    -- card with no enrolment, so after activation alpha neither placed nor was onboarding the person and, rightly, may
    -- no longer convert or correct their account. No assertion changes.
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    select v_murid, v_a, ap.id, 'ACTIVE' from public.academic_periods ap where ap.institution_id = v_a order by ap.created_at limit 1;
    if not found then raise exception 'the fixture lacks an academic period at alpha'; end if;
    select ii.institutional_id into v_pid from public.institutional_identities ii where ii.person_id = v_murid limit 1;
    perform audit_write('selftest.f24_marker', 'persons', v_murid::text, v_a, jsonb_build_object('person_id', v_murid));
    v_guru  := selftest.f11_user('f24-guru-'  || v_tag || '@local.invalid', 'EDUCATOR', v_a);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F24 tetangga ' || v_tag, 'f24x-' || v_tag, true, true) returning institutions.id into v_w_b;
    perform set_config('app.seed_intent', '', true);
    v_adm_b := selftest.f11_user('f24-adm-b-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_w_b);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-K02  THE REFUSALS (before the real conversion)
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      for r in select * from (values
          (v_murid, v_email, 'kurang', 'PR040 REASON_REQUIRED', 'no reason'),
          (v_murid, 'bukan-alamat', 'Diangkat menjadi asisten guru di sekolah ini.', 'PR040 EMAIL_INVALID', 'a malformed address'),
          (v_murid, 'alpha-admin@synthetic.pintar.test', 'Diangkat menjadi asisten guru di sekolah ini.', 'PR040 EMAIL_TAKEN', 'a taken address'),
          (v_lain, v_email, 'Diangkat menjadi asisten guru di sekolah ini.', 'PR040 CARD_NOT_FOUND', 'a person with no card'))
        as t(p, e, alasan, mau, apa) loop
        v_err := selftest.f23_raised(format('select * from public.authorize_card_conversion(%L::uuid, %L, %L)', r.p, r.e, r.alasan));
        if v_err is distinct from r.mau then
          v_probs := selftest.f24_note(v_probs, 'F24-K02', format('%s answered %s, not %s', r.apa, coalesce(v_err, 'a grant'), r.mau));
        end if;
      end loop;
      for r in select * from (values (v_guru, 'a Guru'), (v_adm_b, 'another school''s administrator')) as t(u, siapa) loop
        perform selftest.as_user_uid(r.u);
        v_err := selftest.f23_raised(format('select * from public.authorize_card_conversion(%L::uuid, %L, %L)',
          v_murid, v_email, 'Diangkat menjadi asisten guru di sekolah ini.'));
        if v_err is null or v_err not like '42501%' then
          v_probs := selftest.f24_note(v_probs, 'F24-K02', format('%s converting the card answered %s', r.siapa, coalesce(v_err, 'a grant')));
        end if;
      end loop;
      -- the card's address moved with no grant: refused
      perform selftest.as_owner();
      v_err := selftest.f23_raised(format('update auth.users set email = %L where id = %L::uuid', v_email, v_akun.auth_user_id));
      if v_err is distinct from 'PR040 CARD_ADDRESS_REFUSED' then
        v_probs := selftest.f24_note(v_probs, 'F24-K02', 'a card''s address moved to an email with no grant answered ' || coalesce(v_err, 'done'));
      end if;
      -- a grant for one address does not move it to another
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      perform * from public.authorize_card_conversion(v_murid, v_email, 'Diangkat menjadi asisten guru di sekolah ini.');
      perform selftest.as_owner();
      v_err := selftest.f23_raised(format('update auth.users set email = %L where id = %L::uuid', 'lain-' || v_email, v_akun.auth_user_id));
      if v_err is distinct from 'PR040 CARD_ADDRESS_REFUSED' then
        v_probs := selftest.f24_note(v_probs, 'F24-K02', 'a grant moved the card to another address: ' || coalesce(v_err, 'done'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-K02', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-K03  AN INTERRUPTED CONVERSION (the Batch 4 promotion gate, condition 2), part 1: before Auth's write
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      -- K02 left one live grant and no Auth write: the route was interrupted between its two steps
      select a.* into v_akun2 from public.accounts a where a.person_id = v_murid;
      if v_akun2.kind <> 'CLASSROOM_CARD' or v_akun2.card_number is distinct from v_akun.card_number
         or exists (select 1 from public.account_setup s where s.account_id = v_akun.id and s.state = 'REQUIRED') then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'a grant with no Auth write changed the account: ' || row_to_json(v_akun2)::text);
      end if;
      if not exists (select 1 from auth.users u where u.id = v_akun.auth_user_id
                       and lower(u.email) = 'card-' || v_kartu || '@cards.synthetic.pintar.test') then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'a grant with no Auth write moved the card''s sign-in address');
      end if;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, %L::timestamptz)',
        v_murid, 'EDUCATOR', v_node, now() + interval '1 year'));
      if v_err is distinct from '42501 STAFF_ROLE_FOR_CARD' then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'with a grant pending, a staff role over the card answered ' || coalesce(v_err, 'a grant'));
      end if;
      -- a retry replaces the pending grant: one live grant, never two
      perform * from public.authorize_card_conversion(v_murid, v_email, 'Diangkat menjadi asisten guru di sekolah ini.');
      perform selftest.as_owner();
      select count(*) into v_n from public.card_conversions c where c.account_id = v_akun.id and c.consumed_at is null;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-K03', format('a retry left %s pending grants', v_n)); end if;
      -- the grant runs out before Auth writes (a slow or failed route): the write is refused and nothing changes
      update public.card_conversions set expires_at = clock_timestamp() - interval '1 second'
       where account_id = v_akun.id and consumed_at is null;
      v_err := selftest.f23_raised(format('update auth.users set email = %L where id = %L::uuid', v_email, v_akun.auth_user_id));
      if v_err is distinct from 'PR040 CARD_ADDRESS_REFUSED' then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'an expired grant still moved the card: ' || coalesce(v_err, 'done'));
      end if;
      if (select a.kind from public.accounts a where a.id = v_akun.id) <> 'CLASSROOM_CARD' then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'after the refused write the account is no longer the card');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-K03', 'part 1 threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-K01  THE CONVERSION
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select count(*) into v_enrol from public.audit_log a where a.target_id = v_murid::text;
      -- before: a staff role over the card is refused (CR-91, unchanged)
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, %L::timestamptz)',
        v_murid, 'EDUCATOR', v_node, now() + interval '1 year'));
      if v_err is distinct from '42501 STAFF_ROLE_FOR_CARD' then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'a staff role over the card answered ' || coalesce(v_err, 'a grant'));
      end if;
      -- the school admin authorises; Auth moves the address (the route's admin write)
      select c.auth_user_id into v_uid from public.authorize_card_conversion(v_murid, v_email,
        'Diangkat menjadi asisten guru di sekolah ini.') c;
      perform selftest.as_owner();
      if v_uid is distinct from v_akun.auth_user_id then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the grant names another Auth user');
      end if;
      update auth.users set email = v_email where users.id = v_akun.auth_user_id;
      select a.* into v_akun2 from public.accounts a where a.person_id = v_murid;
      if v_akun2.id is distinct from v_akun.id or v_akun2.auth_user_id is distinct from v_akun.auth_user_id
         or v_akun2.kind <> 'EMAIL' or v_akun2.card_number is not null then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', format('the account after reads %s', row_to_json(v_akun2)));
      end if;
      select count(*) into v_n from public.accounts a where a.person_id = v_murid;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-K01', format('%s accounts for the person', v_n)); end if;
      if not exists (select 1 from public.account_setup s where s.account_id = v_akun.id and s.state = 'REQUIRED'
                       and s.password_set_at is null and s.name_confirmed_at is null) then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the account''s set-up is not REQUIRED, from the start');
      end if;
      if exists (select 1 from auth.users u where u.id = v_akun.auth_user_id and coalesce(u.encrypted_password, '') <> '') then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the card''s PIN still signs the account in');
      end if;
      if exists (select 1 from auth.users u where lower(u.email) = 'card-' || v_kartu || '@cards.synthetic.pintar.test') then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the card''s sign-in address still exists');
      end if;
      select t.auth_user_id::text into v_err from public.activation_code_target(v_email) t;
      if v_err is distinct from v_akun.auth_user_id::text then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the new address is not offered an activation code');
      end if;
      select a.summary into v_jejak from public.audit_log a
       where a.action = 'account.card_converted_to_email' and a.target_id = v_murid::text order by a.id desc limit 1;
      if v_jejak is null or v_jejak ->> 'reason' <> 'Diangkat menjadi asisten guru di sekolah ini.'
         or v_jejak #>> '{from,card_number}' <> v_kartu or v_jejak #>> '{to,email}' <> v_email or v_jejak ->> 'authorized_by' is null then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the conversion''s audit row reads ' || coalesce(v_jejak::text, 'nothing'));
      end if;
      -- the person and what is keyed by them are unchanged
      if not exists (select 1 from public.institutional_identities ii where ii.person_id = v_murid and ii.institutional_id = v_pid) then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'the PINTAR ID did not stay with the person');
      end if;
      select count(*) into v_n from public.audit_log a where a.target_id = v_murid::text;
      if v_n < v_enrol + 1 or not exists (select 1 from public.audit_log a where a.action = 'selftest.f24_marker' and a.target_id = v_murid::text) then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', format('the person''s audit trail went from %s to %s rows', v_enrol, v_n));
      end if;
      -- now the staff role is granted, and CR-91 holds: a role, no card
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, %L::timestamptz)',
        v_murid, 'EDUCATOR', v_node, now() + interval '1 year'));
      perform selftest.as_owner();
      if v_err is not null then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'after the conversion the staff role was refused: ' || v_err);
      end if;
      if not public.memegang_peran_staf(v_murid)
         or exists (select 1 from public.accounts a where a.person_id = v_murid and a.kind = 'CLASSROOM_CARD') then
        v_probs := selftest.f24_note(v_probs, 'F24-K01', 'after the grant the person does not hold a role and no card');
      end if;
      -- K02's last refusal: the new address is an email account's, guarded as every other is
      v_err := selftest.f23_raised(format('update auth.users set email = %L where id = %L::uuid', 'lagi-' || v_email, v_akun.auth_user_id));
      if v_err is distinct from 'PR040 EMAIL_CHANGE_REFUSED' then
        v_probs := selftest.f24_note(v_probs, 'F24-K02', 'after the conversion an unguarded address change answered ' || coalesce(v_err, 'done'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-K01', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-K03  part 2: after Auth's write, when the answer never reached the screen
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      -- the admin presses again: the card is gone, so it is refused, and nothing is converted twice
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select * from public.authorize_card_conversion(%L::uuid, %L, %L)',
        v_murid, 'kedua-' || v_email, 'Diangkat menjadi asisten guru di sekolah ini.'));
      if v_err is distinct from 'PR040 CARD_NOT_FOUND' then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'a second conversion of the converted account answered ' || coalesce(v_err, 'a grant'));
      end if;
      -- the person is not stranded: until they activate, the school corrects a wrong address (the supported path)
      v_err := selftest.f23_raised(format('select * from public.authorize_email_correction(%L::uuid, %L, %L)',
        v_murid, 'benar-' || v_email, 'Alamat yang diberikan salah ketik'));
      if v_err is not null then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'the school could not correct the converted person''s address before activation: ' || v_err);
      end if;
      perform selftest.as_owner();
      update auth.users set email = 'benar-' || v_email where users.id = v_akun.auth_user_id;
      select t.auth_user_id::text into v_err from public.activation_code_target('benar-' || v_email) t;
      if v_err is distinct from v_akun.auth_user_id::text then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'the corrected address is not offered an activation code');
      end if;
      select count(*) into v_n from public.accounts a where a.person_id = v_murid;
      if v_n <> 1 or (select a.kind from public.accounts a where a.id = v_akun.id) <> 'EMAIL' then
        v_probs := selftest.f24_note(v_probs, 'F24-K03', 'after the recovery the person does not hold exactly one email account');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-K03', 'part 2 threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-O01  FINDING A PERSON TO CORRECT (W2.1-W2.3)
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      -- an alpha Guru whose set-up is still REQUIRED: the school admin may correct their email, not their name
      v_n := 0;
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      select count(*) into v_n from public.orang_berakun('alpha-guru@synthetic.pintar.test') o where o.boleh_identitas and o.boleh_email and o.activated;
      if v_n <> 1 then
        v_probs := selftest.f24_note(v_probs, 'F24-O01', format('the platform admin finds the activated alpha Guru %s time(s) with every correction', v_n));
      end if;
      select count(*) into v_n from public.orang_berakun('beta-admin@synthetic.pintar.test') o;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-O01', 'the platform admin does not find beta''s admin'); end if;
      select count(*) into v_n from public.orang_berakun('alpha-guru@synthetic.pintar.test', 0, 20,
        (select i.id from public.institutions i where i.slug like 'synth-beta-%' limit 1)) o;
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-O01', 'narrowed to beta, the platform admin still finds alpha''s Guru'); end if;
      -- the PINTAR ID (persons.pintar_id, not the school's nomor induk) is returned and found as typed: any case, 4+4
      declare v_pid text; v_ppid uuid;
      begin
        perform selftest.as_owner();
        select p.id, p.pintar_id into v_ppid, v_pid from public.persons p join public.accounts a on a.person_id = p.id
         where a.kind = 'EMAIL' and p.pintar_id is not null and not public.adalah_persona(p.id) limit 1;
        perform selftest.as_user('sysadmin@synthetic.pintar.test');
        if v_pid is null then
          v_probs := selftest.f24_note(v_probs, 'F24-O01', 'no person with an email account has a PINTAR ID to search by');
        else
          select count(*) into v_n from public.orang_berakun(lower(substr(v_pid, 1, 4) || ' ' || substr(v_pid, 5))) o
           where o.person_id = v_ppid and o.pintar_id = v_pid;
          if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-O01', 'a person is not found by their PINTAR ID typed 4+4 in lower case'); end if;
        end if;
      end;
      select count(*) into v_n from public.orang_berakun(null, 0, 500) o;
      if v_n > 50 then v_probs := selftest.f24_note(v_probs, 'F24-O01', format('a page holds %s rows (at most 50)', v_n)); end if;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select count(*) into v_n from public.orang_berakun('alpha-guru@synthetic.pintar.test') o where not o.boleh_identitas and not o.boleh_email;
      if v_n <> 1 then
        v_probs := selftest.f24_note(v_probs, 'F24-O01', 'the school admin does not find the activated alpha Guru, or is offered a correction the database refuses');
      end if;
      select count(*) into v_n from public.orang_berakun(v_email) o where o.person_id = v_murid and o.boleh_email and not o.activated and not o.boleh_identitas;
      if v_n <> 1 then
        v_probs := selftest.f24_note(v_probs, 'F24-O01', 'the school admin is not offered the email correction of a person not yet activated');
      end if;
      select count(*) into v_n from public.orang_berakun('beta-admin@synthetic.pintar.test') o;
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-O01', 'alpha''s admin finds beta''s admin'); end if;
      perform selftest.as_user('alpha-guru@synthetic.pintar.test');
      select count(*) into v_n from public.orang_berakun(null) o;
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-O01', format('a Guru finds %s person(s)', v_n)); end if;
      -- the corrections the list offers still decide for themselves
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.correct_person_name(%L::uuid, %L, %L)', v_murid, 'Nama Lain F24', 'salah ketik'));
      if v_err is null or v_err not like '42501%' then
        v_probs := selftest.f24_note(v_probs, 'F24-O01', 'a school admin corrected a name: ' || coalesce(v_err, 'done'));
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-O01', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-P01 / P02  A TRANSFER BY NAME, ACCEPTED BY THE RECEIVING SCHOOL (W2.15, F-10)
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select i.id into v_beta from public.institutions i where i.slug like 'synth-beta-%' limit 1;
      select ap.id into v_beta_per from public.academic_periods ap where ap.institution_id = v_beta order by ap.starts_on desc nulls last limit 1;
      select ap.id into v_alpha_per from public.academic_periods ap where ap.institution_id = v_a limit 1;
      select a.person_id into v_siswa from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-siswa-1@synthetic.pintar.test';
      select e.id into v_en from public.enrollments e where e.person_id = v_siswa and e.institution_id = v_a and e.status = 'ACTIVE' limit 1;
      if v_beta is null or v_beta_per is null or v_en is null then
        raise exception 'the fixture lacks beta, a beta school year or an alpha enrolment';
      end if;
      -- P03: the learner's identity and history before the transfer (nomor induk, PINTAR ID, sittings, results, certificates)
      v_snap := (select md5(coalesce((select string_agg(ii.institution_id::text || ':' || ii.institutional_id, ',' order by ii.institution_id) from public.institutional_identities ii where ii.person_id = v_siswa), '')
          || '|' || coalesce((select p.pintar_id from public.persons p where p.id = v_siswa), '')
          || '|' || coalesce((select string_agg(x.id::text || ':' || x.status::text, ',' order by x.id) from public.assessment_sessions x where x.person_id = v_siswa), '')
          || '|' || coalesce((select string_agg(x.id::text, ',' order by x.id) from public.official_results x where x.person_id = v_siswa), '')
          || '|' || coalesce((select string_agg(x.id::text, ',' order by x.id) from public.certificates x where x.person_id = v_siswa), '')));
      -- the directory: exact name or code, audited; nothing partial (alpha's admin cannot read beta's row: the name is
      -- read here, as the owner, and typed as a person would)
      select x.name into v_bnama from public.institutions x where x.id = v_beta;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select count(*) into v_n from public.cari_sekolah_tujuan(upper(v_bnama)) c where c.institution_id = v_beta;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-P01', 'beta is not found by its exact name'); end if;
      select count(*) into v_n from public.cari_sekolah_tujuan(left(v_bnama, 9)) c;
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-P01', format('a partial name found %s school(s)', v_n)); end if;
      perform selftest.as_owner();
      select count(*) into v_n from public.audit_log a where a.action = 'directory.school_searched' and a.at > now() - interval '1 minute';
      if v_n < 2 then v_probs := selftest.f24_note(v_probs, 'F24-P01', format('%s directory search(es) audited of 2', v_n)); end if;
      -- the sending school asks; the period is the receiving school's
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_tf := public.transfer_minta(v_en, v_beta, 'Pindah domisili mengikuti orang tua');
      perform selftest.as_owner();
      if not exists (select 1 from public.transfers t where t.id = v_tf and t.status = 'REQUESTED' and t.to_academic_period_id is null
                        and t.requested_by_institution = v_a) then
        v_probs := selftest.f24_note(v_probs, 'F24-P01', 'the request is not REQUESTED by alpha with no school year');
      end if;
      -- the receiving school sees the learner's name only
      perform selftest.as_user('beta-admin@synthetic.pintar.test');
      select count(*) into v_n from public.pindah_masuk(v_beta) m where m.transfer_id = v_tf and m.nama_murid is not null and m.dari_sekolah is not null;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-P01', 'beta''s admin does not see the incoming request with the learner''s name'); end if;
      select count(*) into v_n from public.persons p where p.id = v_siswa;
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-P01', 'beta reads the learner''s person row before the transfer is executed'); end if;
      v_err := selftest.f23_raised(format('select public.transfer_execute(%L::uuid)', v_tf));
      if v_err is null then v_probs := selftest.f24_note(v_probs, 'F24-P01', 'an unaccepted transfer was executed'); end if;
      -- refusals on the receiving side
      v_err := selftest.f23_raised(format('select public.transfer_terima(%L::uuid, %L::uuid)', v_tf, v_alpha_per));
      if v_err is distinct from 'PR040 PERIOD_INVALID' then
        v_probs := selftest.f24_note(v_probs, 'F24-P02', 'accepting into the sending school''s year answered ' || coalesce(v_err, 'done'));
      end if;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.transfer_terima(%L::uuid, %L::uuid)', v_tf, v_beta_per));
      if v_err is null or v_err not like '42501%' then
        v_probs := selftest.f24_note(v_probs, 'F24-P02', 'the sending school accepted its own request: ' || coalesce(v_err, 'done'));
      end if;
      select count(*) into v_n from public.pindah_masuk() m where m.transfer_id = v_tf;
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-P02', 'the sending school sees its request as incoming'); end if;
      for r in select * from (values
          (v_en, v_a, 'Pindah', 'PR040 DESTINATION_INVALID', 'to its own school'),
          (v_en, v_beta, 'x', 'PR040 REASON_REQUIRED', 'with no reason'),
          (v_en, v_beta, 'Pindah lagi', 'PR040 TRANSFER_OPEN', 'a second open request')) as t(en, ke, alasan, mau, apa) loop
        v_err := selftest.f23_raised(format('select public.transfer_minta(%L::uuid, %L::uuid, %L)', r.en, r.ke, r.alasan));
        if v_err is distinct from r.mau then
          v_probs := selftest.f24_note(v_probs, 'F24-P02', format('a request %s answered %s, not %s', r.apa, coalesce(v_err, 'done'), r.mau));
        end if;
      end loop;
      v_err := selftest.f23_raised('select * from public.cari_sekolah_tujuan(''ab'')');
      if v_err is distinct from 'PR040 QUERY_TOO_SHORT' then
        v_probs := selftest.f24_note(v_probs, 'F24-P02', 'a two-letter search answered ' || coalesce(v_err, 'rows'));
      end if;
      perform selftest.as_user('alpha-guru@synthetic.pintar.test');
      v_err := selftest.f23_raised('select * from public.cari_sekolah_tujuan(''Sekolah Sintetis Beta'')');
      if v_err is null or v_err not like '42501%' then
        v_probs := selftest.f24_note(v_probs, 'F24-P02', 'a Guru searched the directory: ' || coalesce(v_err, 'rows'));
      end if;
      perform selftest.as_user('beta-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.transfer_minta(%L::uuid, %L::uuid, %L)', v_en, v_beta, 'Pindah ke sini'));
      if v_err is null or v_err not like '42501%' then
        v_probs := selftest.f24_note(v_probs, 'F24-P02', 'the receiving school asked for another school''s learner: ' || coalesce(v_err, 'done'));
      end if;
      -- the receiving school accepts into its own year AND names the Kelas the learner is placed in (cross-batch
      -- integration, 6 Nov: an executed transfer used to leave the learner in no class at all); a place of the
      -- sending school, or none, is refused
      perform selftest.as_owner();
      select n.id into v_bkelas from public.org_nodes n where n.institution_id = v_beta and n.kind = 'CLASS' and n.is_active
         and coalesce(n.academic_period_id, v_beta_per) = v_beta_per order by n.name limit 1;
      select n.id into v_akelas from public.org_nodes n where n.institution_id = v_a and n.kind = 'CLASS' and n.is_active limit 1;
      if v_bkelas is null or v_akelas is null then raise exception 'the fixture lacks an active Kelas in beta''s year or in alpha'; end if;
      perform selftest.as_user('beta-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.transfer_terima(%L::uuid, %L::uuid, null, %L::uuid)', v_tf, v_beta_per, v_akelas));
      if v_err is distinct from 'PR040 PLACE_INVALID' then
        v_probs := selftest.f24_note(v_probs, 'F24-P02', 'accepting into the sending school''s Kelas answered ' || coalesce(v_err, 'done'));
      end if;
      v_err := selftest.f23_raised(format('select public.transfer_terima(%L::uuid, %L::uuid)', v_tf, v_beta_per));
      if v_err is distinct from 'PR040 PLACE_INVALID' then
        v_probs := selftest.f24_note(v_probs, 'F24-P02', 'accepting with no Kelas answered ' || coalesce(v_err, 'done'));
      end if;
      perform public.transfer_terima(v_tf, v_beta_per, null, v_bkelas);
      perform public.transfer_execute(v_tf);
      perform selftest.as_owner();
      -- the learner stands in exactly one open placement, the chosen Kelas, on the new enrolment, in beta's year
      select count(*) into v_n from public.memberships m join public.enrollments e on e.id = m.enrollment_id
       where e.person_id = v_siswa and m.valid_to is null;
      if v_n <> 1 or not exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
                                  where e.person_id = v_siswa and e.institution_id = v_beta and m.node_id = v_bkelas
                                    and m.academic_period_id = v_beta_per and m.valid_to is null) then
        v_probs := selftest.f24_note(v_probs, 'F24-P01', format('after execution the learner has %s open placement(s), not one in beta''s chosen Kelas', v_n));
      end if;
      if not exists (select 1 from public.enrollments e where e.person_id = v_siswa and e.institution_id = v_beta and e.status = 'ACTIVE'
                        and e.academic_period_id = v_beta_per)
         or not exists (select 1 from public.enrollments e where e.id = v_en and e.status = 'ENDED' and e.end_reason = 'TRANSFERRED_OUT') then
        v_probs := selftest.f24_note(v_probs, 'F24-P01', 'the executed transfer did not move the enrolment into beta''s year');
      end if;
      -- transfers_audit records each step for both schools: requested, authorized, executed
      select count(*) into v_n from public.audit_log a where a.target_id = v_tf::text
         and a.action in ('transfer.requested', 'transfer.authorized', 'transfer.executed');
      if v_n <> 6 then v_probs := selftest.f24_note(v_probs, 'F24-P01', format('%s audit rows for the three steps (6: each for both schools)', v_n)); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-P01', 'threw: ' || sqlerrm);
      v_probs := selftest.f24_note(v_probs, 'F24-P02', 'not reached: the transfer block threw');
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-P03  THE TRANSFER KEEPS HISTORY AND ISOLATION (the Batch 4 promotion gate, condition 3)
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      if v_tf is null or not exists (select 1 from public.transfers t where t.id = v_tf and t.status = 'EXECUTED') then
        raise exception 'P01 did not execute its transfer';
      end if;
      -- identity and history are the person's and unchanged: alpha's nomor induk, the PINTAR ID, sittings, results,
      -- certificates; the alpha enrolment is kept, ENDED, never deleted
      v_snap2 := (select md5(coalesce((select string_agg(ii.institution_id::text || ':' || ii.institutional_id, ',' order by ii.institution_id) from public.institutional_identities ii where ii.person_id = v_siswa), '')
          || '|' || coalesce((select p.pintar_id from public.persons p where p.id = v_siswa), '')
          || '|' || coalesce((select string_agg(x.id::text || ':' || x.status::text, ',' order by x.id) from public.assessment_sessions x where x.person_id = v_siswa), '')
          || '|' || coalesce((select string_agg(x.id::text, ',' order by x.id) from public.official_results x where x.person_id = v_siswa), '')
          || '|' || coalesce((select string_agg(x.id::text, ',' order by x.id) from public.certificates x where x.person_id = v_siswa), '')));
      if v_snap2 is distinct from v_snap then
        v_probs := selftest.f24_note(v_probs, 'F24-P03', 'the learner''s identity or history changed with the transfer');
      end if;
      if not exists (select 1 from public.enrollments e where e.id = v_en and e.institution_id = v_a and e.status = 'ENDED') then
        v_probs := selftest.f24_note(v_probs, 'F24-P03', 'the alpha enrolment is not kept as ENDED history');
      end if;
      -- isolation as INV-13 and INV-25 draw it: alpha's admin still reads alpha's history but never the learner's future
      -- at beta; beta's admin reads the enrolment it received and the PORTABLE history that existed at the transfer
      -- (enrolments, record_class_registry), but nothing INSTITUTION_SCOPED of alpha's: its audit trail
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select count(*) into v_n from public.enrollments e where e.id = v_en;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-P03', 'alpha can no longer read its own ended enrolment'); end if;
      select count(*) into v_n from public.enrollments e where e.person_id = v_siswa and e.institution_id = v_beta;
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-P03', 'alpha reads the learner''s new enrolment at beta'); end if;
      perform selftest.as_user('beta-admin@synthetic.pintar.test');
      select count(*) into v_n from public.enrollments e where e.person_id = v_siswa and e.institution_id = v_beta and e.status = 'ACTIVE';
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-P03', 'beta cannot read the enrolment it received'); end if;
      select count(*) into v_n from public.enrollments e where e.id = v_en;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-P03', 'beta cannot read the learner''s portable enrolment history (INV-25)'); end if;
      select count(*) into v_n from public.audit_log a where a.institution_id = v_a and a.target_id = v_siswa::text;
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-P03', format('beta reads %s of alpha''s audit rows about the learner (INSTITUTION_SCOPED)', v_n)); end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-P03', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-E01  STUCK SENDS (W2.19, J1.9)
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      insert into public.email_send_log (id, requested_at, kind, recipient_hash, outcome)
      values ('00000000-0000-4000-8000-0000000f2401', now() - interval '45 minutes', 'KODE_AKTIVASI', repeat('a', 64), 'PENDING'),
             ('00000000-0000-4000-8000-0000000f2402', now() - interval '1 minute', 'KODE_AKTIVASI', repeat('b', 64), 'PENDING');
      insert into public.email_send_log (id, requested_at, kind, recipient_hash, outcome, smtp_code, settled_at)
      values ('00000000-0000-4000-8000-0000000f2403', now() - interval '50 minutes', 'KODE_AKTIVASI', repeat('c', 64), 'SENT', 250, now() - interval '49 minutes');
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      select count(*) into v_n from public.email_send_stuck(10) x where x.id = '00000000-0000-4000-8000-0000000f2401' and x.minutes >= 45;
      if v_n <> 1 then v_probs := selftest.f24_note(v_probs, 'F24-E01', 'a send pending for 45 minutes is not listed as stuck'); end if;
      select count(*) into v_n from public.email_send_stuck(10) x
       where x.id in ('00000000-0000-4000-8000-0000000f2402', '00000000-0000-4000-8000-0000000f2403');
      if v_n <> 0 then v_probs := selftest.f24_note(v_probs, 'F24-E01', 'a fresh pending send or an accepted one is listed as stuck'); end if;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised('select * from public.email_send_stuck(10)');
      if v_err is null or v_err not like '42501%' then
        v_probs := selftest.f24_note(v_probs, 'F24-E01', 'a school admin read the stuck sends: ' || coalesce(v_err, 'rows'));
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-E01', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F24-H01  MAINTENANCE WINDOWS AND NOTICES A PAGE AT A TIME (W2.10, CR-49, CAP-10)
    -- ═══════════════════════════════════════════════════════════════════════
    declare v_sys uuid; v_page1 jsonb; v_page2 jsonb; v_wb uuid; v_ids uuid[];
    begin
      perform selftest.as_owner();
      select a.person_id into v_sys from public.accounts a join auth.users u on u.id = a.auth_user_id
       where lower(u.email) = 'sysadmin@synthetic.pintar.test';
      select i.id into v_beta from public.institutions i where i.slug like 'synth-beta-%' limit 1;
      -- 21 of alpha's windows (one more than a page), one of beta's, 21 platform notices, all a month away
      with w as (
        insert into public.maintenance_windows (kind, platform, institution_ids, starts_at, ends_at, reason, created_by_person_id, created_at)
        select 'PLANNED', false, array[v_a], now() + interval '30 days', now() + interval '30 days 1 hour', 'F24-H01 ' || g, v_sys,
               now() + make_interval(secs => g)
          from generate_series(1, 21) g returning maintenance_windows.id)
      select array_agg(w.id) into v_ids from w;
      insert into public.maintenance_windows (kind, platform, institution_ids, starts_at, ends_at, reason, created_by_person_id, created_at)
      values ('PLANNED', false, array[v_beta], now() + interval '30 days', now() + interval '30 days 1 hour', 'F24-H01 beta', v_sys,
              now() + interval '1 minute') returning maintenance_windows.id into v_wb;
      insert into public.broadcast_notices (platform, message, publish_at, expires_at, created_by_person_id, created_at)
      select true, 'F24-H01 ' || g, now() + interval '30 days', now() + interval '31 days', v_sys, now() + make_interval(secs => g)
        from generate_series(1, 21) g;

      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      v_page1 := public.maintenance_list(1, 1, null);
      if jsonb_array_length(v_page1 -> 'pemeliharaan') <> 20 or (v_page1 ->> 'lagi_pemeliharaan')::boolean is not true
         or jsonb_array_length(v_page1 -> 'pengumuman') <> 20 or (v_page1 ->> 'lagi_pengumuman')::boolean is not true then
        v_probs := selftest.f24_note(v_probs, 'F24-H01', 'the first page is not 20 of each with more to follow: '
          || jsonb_array_length(v_page1 -> 'pemeliharaan') || '/' || jsonb_array_length(v_page1 -> 'pengumuman'));
      end if;
      -- the notices' second page holds the 21st (a page is cut before it is numbered)
      v_page2 := public.maintenance_list(1, 2, null);
      select count(*) into v_n from jsonb_array_elements(v_page2 -> 'pengumuman') e where e ->> 'pesan' like 'F24-H01 %';
      if v_n < 1 then v_probs := selftest.f24_note(v_probs, 'F24-H01', 'the notices'' second page is empty'); end if;
      -- narrowed to alpha: alpha's windows only, the 21 across two pages with none repeated, no platform notice
      v_page1 := public.maintenance_list(1, 1, v_a);
      v_page2 := public.maintenance_list(2, 1, v_a);
      if exists (select 1 from jsonb_array_elements((v_page1 -> 'pemeliharaan') || (v_page2 -> 'pemeliharaan')) e where (e ->> 'id')::uuid = v_wb) then
        v_probs := selftest.f24_note(v_probs, 'F24-H01', 'beta''s window is listed in alpha''s context');
      end if;
      select count(distinct e ->> 'id') into v_n from jsonb_array_elements((v_page1 -> 'pemeliharaan') || (v_page2 -> 'pemeliharaan')) e
       where (e ->> 'id')::uuid = any (v_ids);
      if v_n <> 21 or jsonb_array_length(v_page1 -> 'pemeliharaan') <> 20 then
        v_probs := selftest.f24_note(v_probs, 'F24-H01', 'alpha''s 21 windows are not found once each across two pages: ' || v_n);
      end if;
      if exists (select 1 from jsonb_array_elements(v_page1 -> 'pengumuman') e where (e ->> 'platform')::boolean) then
        v_probs := selftest.f24_note(v_probs, 'F24-H01', 'a platform-wide notice is listed in a school''s context');
      end if;
      -- the defect the browser filter had: alpha's admin, in alpha's context, sees alpha's windows
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_page1 := public.maintenance_list(1, 1, v_a);
      select count(*) into v_n from jsonb_array_elements(v_page1 -> 'pemeliharaan') e where (e ->> 'id')::uuid = any (v_ids);
      if v_n <> 20 then
        v_probs := selftest.f24_note(v_probs, 'F24-H01', 'alpha''s admin sees ' || v_n || ' of alpha''s windows on the first page');
      end if;
      -- a Guru is refused, as #148
      perform selftest.as_user('alpha-guru@synthetic.pintar.test');
      v_err := selftest.f23_raised('select public.maintenance_list()');
      if v_err is null then v_probs := selftest.f24_note(v_probs, 'F24-H01', 'a Guru read the maintenance list'); end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f24_note(v_probs, 'F24-H01', 'threw: ' || sqlerrm);
    end;

    raise exception 'F24_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F24_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in select * from unnest(
      array['F24-K01', 'F24-K02', 'F24-K03', 'F24-O01', 'F24-P01', 'F24-P02', 'F24-P03', 'F24-E01', 'F24-H01'],
      array['D-152(a) -- a card learner becomes staff through an email account', 'D-152(a) -- the conversion''s refusals',
            'D-152(a) -- an interrupted conversion',
            'W2.1-W2.3 -- finding a person to correct', 'W2.15 -- a transfer by name, accepted by the receiving school',
            'W2.15 -- the transfer''s refusals', 'W2.15 -- the transfer keeps history and isolation', 'W2.19 -- stuck sends', 'W2.10 -- maintenance listed a page at a time'],
      array[
        'the school admin converts a class-card learner''s account: the same account row, Auth user, person and PINTAR '
          || 'ID; an EMAIL account whose set-up is REQUIRED (the new address is offered an activation code); the card''s '
          || 'PIN and address sign nobody in; audited with the reason, the old card and the new address; a staff role '
          || 'refused before (STAFF_ROLE_FOR_CARD) is granted after, and the person holds a role and no card (CR-91)',
        'refused without a reason, to a malformed or taken address, for a person with no card, to a Guru and to another '
          || 'school''s administrator; a card''s address moved without a grant or to another address is refused; after '
          || 'the conversion the new address is guarded as every email account''s (EMAIL_CHANGE_REFUSED)',
        'interrupted before Auth''s write: the account is still the card (same number, sign-in address, no set-up), a '
          || 'staff role is still refused (STAFF_ROLE_FOR_CARD), a retry leaves one pending grant, an expired grant''s '
          || 'write is refused (CARD_ADDRESS_REFUSED) and changes nothing; after a write whose answer was lost: a second '
          || 'conversion is refused (CARD_NOT_FOUND), the school corrects a wrong address before activation and the '
          || 'corrected address is offered the activation code; the person holds exactly one email account',
        'orang_berakun: the platform admin finds an activated alpha Guru with every correction and beta''s admin, a person by '
          || 'their PINTAR ID typed 4+4 in lower case (the PINTAR ID returned, not the nomor induk), and not '
          || 'alpha''s Guru when narrowed to beta; a page is '
          || 'at most 50; alpha''s admin finds the activated Guru with no correction offered, the converted person (not yet '
          || 'activated) with the email correction only, and not beta''s admin; a Guru finds nobody; a school admin''s name '
          || 'correction is still refused 42501',
        'alpha''s admin finds beta by its exact name (any case), nothing by part of it, every search audited; asks for '
          || 'a learner''s transfer to beta with no school year; beta''s admin sees the request with the learner''s name '
          || 'but not the learner''s person row; an unaccepted transfer is not executed; beta accepts it into its own '
          || 'school year and executes it: the learner is enrolled in beta''s year and the alpha enrolment ENDED; the '
          || 'request, the acceptance and the execution are audited for both schools',
        'accepting into the sending school''s year (PERIOD_INVALID); the sending school accepting its own request (42501) '
          || 'or seeing it as incoming; a request to its own school (DESTINATION_INVALID), with no reason '
          || '(REASON_REQUIRED), twice (TRANSFER_OPEN); a two-letter search (QUERY_TOO_SHORT); a Guru searching (42501); '
          || 'the receiving school asking for another school''s learner (42501)',
        'the learner''s nomor induk at alpha, PINTAR ID, sittings, results and certificates are unchanged by the transfer; '
          || 'the alpha enrolment is kept as ENDED history; alpha''s admin still reads it but not the beta enrolment; '
          || 'beta''s admin reads the enrolment it received and the portable enrolment history (INV-25) but none of alpha''s '
          || 'audit rows about the learner (INSTITUTION_SCOPED)',
        'email_send_stuck: the platform admin is shown a send pending for 45 minutes with its age, not one pending for a '
          || 'minute nor one the server accepted; a school admin is refused 42501',
        'maintenance_list: 20 windows and 20 notices a page with more to follow, the notices'' second page holding the rest; narrowed to alpha, alpha''s 21 windows '
          || 'once each across two pages, beta''s window and every platform notice left out; alpha''s admin sees alpha''s '
          || 'windows in alpha''s context (the browser''s name-for-id filter showed none); a Guru is refused'
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false; detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F24-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-24 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable24() from public;

-- FABLE-23 database suite: Batch 1 (D-145) — CR-91, a class card is a learner's alone.
--
-- Ordering: depends on fable01.sql (the role switches). Never applied as a migration; never present in production.
--
--   F23-C01  ASKING FOR A CARD (the administrator's door): Aktivasi's list says boleh_kartu false for a person who holds
--            a staff role (one that starts tomorrow included) and true for a learner; authorize_account_activation
--            refuses a card for the staff person by name (42501 CARD_FOR_STAFF) and writes no grant, and still grants
--            the same person an email account and the learner a card
--   F23-C02  THE ACCOUNT SIDE (every way an account comes to exist): a card account for a staff person is refused
--            through a planted activation grant consumed by Auth's insert, through the seed branch of
--            handle_new_auth_user, and by re-pointing an existing card account to a staff person; nothing is left
--   F23-C03  THE GRANT SIDE (every way a role arrives): a staff role for a class-card learner is refused through
--            grant_role by the school's administrator, through a Platform Admin, and through the seed path
--            (42501 STAFF_ROLE_FOR_CARD); an email learner may still be given a role
--   F23-C04  LEGACY DATA (a card and a staff role planted together, guards switched off inside the test only): the
--            card sign-in's question kartu_bukan_staf() answers false for that session, so the route ends it;
--            authorize_card_reissue refuses the person by name; every ordinary card session answers true
--   F23-C05  NO STAFF POWER THROUGH A CARD: the seeded world holds no person with a class card and a staff role; a
--            card session can provision nobody, review nothing, administer no school, and is no Admin platform
--   F23-C06  EDUCATOR AS LEARNER IS INTACT (J9): a Guru who is enrolled keeps one EMAIL account and holds Belajar and
--            Mengajar
--   F23-C07  ROLE TRANSITIONS: a Guru not yet activated whose role is revoked (revoke_role, with its reason) and a
--            person whose role has expired are no longer staff, so Aktivasi offers a card and the card is granted;
--            once either holds the card, granting a staff role again is refused (42501 STAFF_ROLE_FOR_CARD), so the
--            card never carries a staff role in either direction
--   F23-W01  ONE STEP, ONE TRANSACTION (W1.13): langkah_konten moves the whole tree as the caller (items, lessons,
--            modules, the course; the approver stamped on each); a step refused at its LAST table (the course) leaves
--            items, lessons and modules exactly where they were, never a mixed tree
--   F23-W02  THE SEND-BACK (W1.6): kembalikan_paket by the head of department (CAN_REVIEW, not the author), with a
--            reason, moves the whole tree IN_REVIEW -> VALIDATION_FAILED and records the outcome and an audit row;
--            refused by name to the author and to a Dekan (SENDBACK_NOT_REVIEWER), without a reason
--            (SENDBACK_REASON_MISSING), off a package not in review (SENDBACK_NOT_IN_REVIEW), to a reviewer who wrote
--            the package (SENDBACK_REVIEWER_IS_AUTHOR); the edge taken any other way is an illegal transition
--   F23-W03  THE AUTHOR'S CORRECTION PATH (W1.6): a correction of the sent-back draft is accepted in its line (no
--            REVISION_NOT_RELEASED), a correction of a draft nobody sent back still is not; the author may also mark
--            the sent-back draft structured again
--   F23-W04  WHO REVIEWED AND APPROVED (W1.8): an approval records an APPROVED outcome naming the reviewer and the
--            author; the school's author and reviewer read the package's outcomes, another school's administrator reads
--            none; an outcome cannot be changed or removed (PR080)
--   F23-W05  THE HISTORY'S NAMES (W1.8): the author cannot read the reviewer's person row, yet nama_riwayat_paket
--            names the reviewer to the author and the reviewer, to another school's administrator nobody, and to no one
--            a person not recorded on the packages
--   F23-T01  APPROVED v1 WORDING IN THE DATABASE (W4.1): a coaching finding names where it is in the workbook's words
--            («kolom Isi pelajaran», never «kolom body_markdown»); no coaching rule says «siswa» (C29, C30); the
--            bank-wide finding is «Bank soal untuk paket ini» (D23)
--
-- Depends also on fable11.sql and fable12.sql (their fixture helpers: f11_user, f11_batch, f12_paket, f12_course).
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb of problems, a sentinel to undo the
-- lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply fable01.sql before fable23.sql: the role switches are missing';
  end if;
  if to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null
     or to_regprocedure('selftest.f12_course(uuid,jsonb)') is null
     or to_regprocedure('selftest.as_user_uid(uuid)') is null then
    raise exception 'apply fable06.sql, fable11.sql and fable12.sql before fable23.sql: the fixture helpers are missing';
  end if;
end $$;

create or replace function selftest.f23_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f23_note(jsonb, text, text) to authenticated, anon;

-- What a statement raised, as «sqlstate detail»; null when it did not raise.
create or replace function selftest.f23_raised(p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return v_state || ' ' || coalesce(nullif(v_detail, ''), '-');
end $$;
revoke all on function selftest.f23_raised(text) from public;
grant execute on function selftest.f23_raised(text) to authenticated, anon;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable23()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_a uuid; v_node uuid; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS');
  v_staf uuid; v_besok uuid; v_murid uuid; v_kartu_p uuid; v_surel_p uuid; v_lama uuid; v_lama_u uuid;
  v_err text; v_n int; v_m int; v_b boolean; v_got text; v_card text; v_bekas uuid; v_habis uuid; v_ra uuid;
  v_w uuid; v_w_b uuid; v_adm_w uuid; v_kajur uuid; v_dean uuid; v_guru uuid; v_adm_b uuid; v_guru_p uuid; v_kajur_p uuid;
  v_c1 uuid; v_c2 uuid; v_c3 uuid; v_c4 uuid; v_batch uuid; v_j jsonb;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
begin
  perform selftest.as_owner();
  begin
    select i.id into v_a from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
    select n.id into v_node from public.org_nodes n where n.institution_id = v_a and n.kind = 'INSTITUTION' limit 1;
    select a.person_id into v_kartu_p from public.accounts a join auth.users u on u.id = a.auth_user_id
     where u.email = 'card-7001@cards.synthetic.pintar.test';
    select a.person_id into v_surel_p from public.accounts a join auth.users u on u.id = a.auth_user_id
     where u.email = 'alpha-siswa-1@synthetic.pintar.test';
    if v_a is null or v_node is null or v_kartu_p is null or v_surel_p is null then
      raise exception 'the fixture lacks the alpha school, its node, card 7001 or an email learner';
    end if;

    -- alpha gives numbers: it reserves a namespace first if the fixture has none (rolled back with the rest)
    if (select x.namespace from public.institutions x where x.id = v_a) is null then
      for v_n in 1..50 loop
        v_got := upper(substr(md5(v_tag || v_n::text), 1, 3));
        exit when not exists (select 1 from public.institutions x where upper(x.namespace) = v_got);
      end loop;
      update public.institutions set namespace = v_got where institutions.id = v_a;
    end if;
    -- three provisioned people in alpha, none with an account yet: a Guru, a Guru from tomorrow, a learner
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.persons (display_name) values ('Guru F23 ' || v_tag) returning persons.id into v_staf;
    insert into public.persons (display_name) values ('Guru Besok F23 ' || v_tag) returning persons.id into v_besok;
    insert into public.persons (display_name) values ('Murid F23 ' || v_tag) returning persons.id into v_murid;
    perform public.issue_institutional_id(v_staf, v_a);
    perform public.issue_institutional_id(v_besok, v_a);
    perform public.issue_institutional_id(v_murid, v_a);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (v_staf, 'EDUCATOR', v_node, now() + interval '1 year');
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_besok, 'EDUCATOR', v_node, now() + interval '1 day', now() + interval '1 year');
    perform set_config('app.seed_intent', '', true);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-C01  ASKING FOR A CARD
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      for r in select * from (values (v_staf, false, 'the Guru'), (v_besok, false, 'the Guru from tomorrow'),
                                     (v_murid, true, 'the learner')) as t(p, mau, siapa) loop
        select w.boleh_kartu into v_b from public.persons_awaiting_account() w where w.person_id = r.p;
        if v_b is distinct from r.mau then
          v_probs := selftest.f23_note(v_probs, 'F23-C01', format('Aktivasi says boleh_kartu %s for %s, not %s', v_b, r.siapa, r.mau));
        end if;
      end loop;
      for r in select * from (values (v_staf, '9100000001', 'the Guru'), (v_besok, '9100000002', 'the Guru from tomorrow')) as t(p, kartu, siapa) loop
        v_err := selftest.f23_raised(format(
          'select * from public.authorize_account_activation(%L::uuid, %L, %L, %L)', r.p, 'CLASSROOM_CARD',
          'card-' || r.kartu || '@cards.synthetic.pintar.test', r.kartu));
        if v_err is distinct from '42501 CARD_FOR_STAFF' then
          v_probs := selftest.f23_note(v_probs, 'F23-C01', format('a card for %s answered %s, not 42501 CARD_FOR_STAFF', r.siapa, coalesce(v_err, 'a grant')));
        end if;
      end loop;
      perform selftest.as_owner();
      select count(*) into v_n from public.account_activation_grants g where g.person_id in (v_staf, v_besok) and g.kind = 'CLASSROOM_CARD';
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-C01', format('%s card grant(s) were written for staff', v_n));
      end if;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select * from public.authorize_account_activation(%L::uuid, %L, %L)',
        v_staf, 'EMAIL', 'guru-f23-' || v_tag || '@local.invalid'));
      if v_err is not null then
        v_probs := selftest.f23_note(v_probs, 'F23-C01', 'the Guru was refused an email account: ' || v_err);
      end if;
      v_err := selftest.f23_raised(format('select * from public.authorize_account_activation(%L::uuid, %L, %L, %L)',
        v_murid, 'CLASSROOM_CARD', 'card-9100000003@cards.synthetic.pintar.test', '9100000003'));
      if v_err is not null then
        v_probs := selftest.f23_note(v_probs, 'F23-C01', 'the learner was refused a card: ' || v_err);
      end if;
      perform selftest.as_owner();
      -- Auth creates the identity, the trigger consumes the grant: the learner now holds an alpha class card
      insert into auth.users (id, email) values (gen_random_uuid(), 'card-9100000003@cards.synthetic.pintar.test');
      if not exists (select 1 from public.accounts a where a.person_id = v_murid and a.kind = 'CLASSROOM_CARD') then
        v_probs := selftest.f23_note(v_probs, 'F23-C01', 'the learner''s granted card did not become an account');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-C01', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-C02  THE ACCOUNT SIDE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      -- (a) a grant planted straight into the table (as if an older function had written it), consumed by Auth's insert
      v_card := '9200000001';
      insert into public.account_activation_grants (email, person_id, kind, card_number, institution_id, authorized_by)
      select 'card-' || v_card || '@cards.synthetic.pintar.test', v_besok, 'CLASSROOM_CARD', v_card, v_a, a.person_id
        from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test';
      v_err := selftest.f23_raised(format('insert into auth.users (id, email) values (gen_random_uuid(), %L)',
        'card-' || v_card || '@cards.synthetic.pintar.test'));
      if v_err is distinct from '42501 CARD_FOR_STAFF' then
        v_probs := selftest.f23_note(v_probs, 'F23-C02', 'a planted card grant for staff, consumed by Auth, answered ' || coalesce(v_err, 'an account'));
      end if;
      -- (b) the seed branch, which names its own person and account shape
      perform set_config('app.seed_intent', 'synthetic', true);
      v_err := selftest.f23_raised(format(
        'insert into auth.users (id, email, raw_app_meta_data) values (gen_random_uuid(), %L, %L::jsonb)',
        'card-9200000002@cards.synthetic.pintar.test',
        json_build_object('person_id', v_staf, 'account_kind', 'CLASSROOM_CARD', 'card_number', '9200000002')));
      perform set_config('app.seed_intent', '', true);
      if v_err is distinct from '42501 CARD_FOR_STAFF' then
        v_probs := selftest.f23_note(v_probs, 'F23-C02', 'the seed branch made a card for staff: ' || coalesce(v_err, 'an account'));
      end if;
      -- (c) an existing card account re-pointed to a staff person
      v_err := selftest.f23_raised(format('update public.accounts set person_id = %L::uuid where person_id = %L::uuid',
        v_staf, v_kartu_p));
      if v_err is distinct from '42501 CARD_FOR_STAFF' then
        v_probs := selftest.f23_note(v_probs, 'F23-C02', 'a card account re-pointed to staff answered ' || coalesce(v_err, 'done'));
      end if;
      select count(*) into v_n from public.accounts a where a.person_id in (v_staf, v_besok) and a.kind = 'CLASSROOM_CARD';
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-C02', format('%s card account(s) exist for staff', v_n));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-C02', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-C03  THE GRANT SIDE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      for r in select * from (values ('alpha-admin@synthetic.pintar.test', 'the school''s administrator', v_murid),
                                     ('sysadmin@synthetic.pintar.test', 'a Platform Admin', v_kartu_p)) as t(email, siapa, p) loop
        perform selftest.as_user(r.email);
        v_err := selftest.f23_raised(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, %L::timestamptz)',
          r.p, 'EDUCATOR', v_node, now() + interval '1 year'));
        if v_err is distinct from '42501 STAFF_ROLE_FOR_CARD' then
          v_probs := selftest.f23_note(v_probs, 'F23-C03', format('%s granting a card learner a Guru role answered %s', r.siapa, coalesce(v_err, 'a grant')));
        end if;
      end loop;
      perform selftest.as_owner();
      perform set_config('app.seed_intent', 'synthetic', true);
      v_err := selftest.f23_raised(format(
        'insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values (%L::uuid, %L, %L::uuid, %L::timestamptz)',
        v_kartu_p, 'HEAD_OF_DEPARTMENT', v_node, now() + interval '1 year'));
      perform set_config('app.seed_intent', '', true);
      if v_err is distinct from '42501 STAFF_ROLE_FOR_CARD' then
        v_probs := selftest.f23_note(v_probs, 'F23-C03', 'the seed path gave a card learner a role: ' || coalesce(v_err, 'a grant'));
      end if;
      select count(*) into v_n from public.role_assignments ra where ra.person_id in (v_kartu_p, v_murid);
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-C03', format('the card learner holds %s role(s)', v_n));
      end if;
      -- an email learner may still be given a role (the rule is about the card, not about learners)
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, %L::timestamptz)',
        v_surel_p, 'EDUCATOR', v_node, now() + interval '1 year'));
      perform selftest.as_owner();
      if v_err is not null then
        v_probs := selftest.f23_note(v_probs, 'F23-C03', 'an email learner could not be given a role: ' || v_err);
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-C03', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-C04  LEGACY DATA
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      -- plant what this rule forbids, as a database from before it might hold: guards off inside this test only
      alter table public.role_assignments disable trigger role_assignments_card_holds_no_role;
      alter table public.accounts disable trigger accounts_card_is_learners;
      insert into public.persons (display_name) values ('Guru Berkartu F23 ' || v_tag) returning persons.id into v_lama;
      perform public.issue_institutional_id(v_lama, v_a);
      insert into auth.users (id, email, raw_app_meta_data) values (gen_random_uuid(), 'card-9300000001@cards.synthetic.pintar.test',
        json_build_object('person_id', v_lama, 'account_kind', 'CLASSROOM_CARD', 'card_number', '9300000001')::jsonb)
      returning auth.users.id into v_lama_u;
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
      values (v_lama, 'EDUCATOR', v_node, now() + interval '1 year');
      perform set_config('app.seed_intent', '', true);
      alter table public.accounts enable trigger accounts_card_is_learners;
      alter table public.role_assignments enable trigger role_assignments_card_holds_no_role;

      perform selftest.as_user('card-9300000001@cards.synthetic.pintar.test');
      v_b := public.kartu_bukan_staf();
      perform selftest.as_owner();
      if v_b is not false then
        v_probs := selftest.f23_note(v_probs, 'F23-C04', 'a card whose person holds a staff role is not told apart at sign-in');
      end if;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      v_err := selftest.f23_raised(format('select * from public.authorize_card_reissue(%L::uuid, %L, %L)', v_lama, 'HILANG', '9300000002'));
      perform selftest.as_owner();
      if v_err is distinct from '42501 CARD_FOR_STAFF' then
        v_probs := selftest.f23_note(v_probs, 'F23-C04', 'a card was re-issued for a staff person: ' || coalesce(v_err, 'granted'));
      end if;
      for r in select * from (values ('card-7001@cards.synthetic.pintar.test'), ('alpha-guru@synthetic.pintar.test'),
                                     ('alpha-siswa-1@synthetic.pintar.test')) as t(email) loop
        perform selftest.as_user(r.email);
        v_b := public.kartu_bukan_staf();
        perform selftest.as_owner();
        if v_b is not true then
          v_probs := selftest.f23_note(v_probs, 'F23-C04', r.email || ' is refused at sign-in');
        end if;
      end loop;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-C04', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-C05  NO STAFF POWER THROUGH A CARD
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      select count(*) into v_n from public.accounts a
       where a.kind = 'CLASSROOM_CARD' and public.memegang_peran_staf(a.person_id) and a.person_id <> coalesce(v_lama, gen_random_uuid());
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-C05', format('%s person(s) hold a class card and a staff role', v_n));
      end if;
      perform selftest.as_user('card-7001@cards.synthetic.pintar.test');
      if public.can_on_node('CAN_PROVISION_PEOPLE', v_a) or public.can_in_institution('CAN_REVIEW', v_a)
         or public.has_scope('INSTITUTION_ADMIN', v_node) or public.is_system_admin() then
        v_probs := selftest.f23_note(v_probs, 'F23-C05', 'a card session carries a staff capability');
      end if;
      select count(*) into v_n from public.persons_awaiting_account();
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-C05', format('a card session is offered %s person(s) to activate', v_n));
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-C05', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-C06  EDUCATOR AS LEARNER IS INTACT
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      select string_agg(a.kind::text, ',') into v_got from public.accounts a join auth.users u on u.id = a.auth_user_id
       where a.person_id = (select a2.person_id from public.accounts a2 join auth.users u2 on u2.id = a2.auth_user_id
                             where u2.email = 'siklus-guru@synthetic.pintar.test');
      if v_got is distinct from 'EMAIL' then
        v_probs := selftest.f23_note(v_probs, 'F23-C06', 'the enrolled Guru does not hold exactly one EMAIL account: ' || coalesce(v_got, 'none'));
      end if;
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      select string_agg(k.tujuan, ' ' order by k.tujuan) into v_got
        from (select distinct tujuan from public.konteks_tempat_saya()) k;
      perform selftest.as_owner();
      if v_got is distinct from 'BELAJAR MENGAJAR' then
        v_probs := selftest.f23_note(v_probs, 'F23-C06', 'the enrolled Guru holds «' || coalesce(v_got, '') || '», not Belajar and Mengajar');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-C06', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-C07  ROLE TRANSITIONS
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.persons (display_name) values ('Guru Berhenti F23 ' || v_tag) returning persons.id into v_bekas;
      insert into public.persons (display_name) values ('Guru Lalu F23 ' || v_tag) returning persons.id into v_habis;
      perform public.issue_institutional_id(v_bekas, v_a);
      perform public.issue_institutional_id(v_habis, v_a);
      insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
      values (v_bekas, 'EDUCATOR', v_node, now() + interval '1 year') returning role_assignments.id into v_ra;
      insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
      values (v_habis, 'EDUCATOR', v_node, now() - interval '2 days', now() - interval '1 day');
      perform set_config('app.seed_intent', '', true);

      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select w.boleh_kartu into v_b from public.persons_awaiting_account() w where w.person_id = v_bekas;
      if v_b is distinct from false then
        v_probs := selftest.f23_note(v_probs, 'F23-C07', format('before the revocation Aktivasi says boleh_kartu %s for the Guru', v_b));
      end if;
      perform public.revoke_role(v_ra, 'Tidak lagi mengajar; menjadi murid');
      for r in select * from (values (v_bekas, '9100000071', 'the revoked Guru'), (v_habis, '9100000072', 'the expired Guru')) as t(p, kartu, siapa) loop
        select w.boleh_kartu into v_b from public.persons_awaiting_account() w where w.person_id = r.p;
        if v_b is distinct from true then
          v_probs := selftest.f23_note(v_probs, 'F23-C07', format('Aktivasi says boleh_kartu %s for %s', v_b, r.siapa));
        end if;
        v_err := selftest.f23_raised(format('select * from public.authorize_account_activation(%L::uuid, %L, %L, %L)',
          r.p, 'CLASSROOM_CARD', 'card-' || r.kartu || '@cards.synthetic.pintar.test', r.kartu));
        if v_err is not null then
          v_probs := selftest.f23_note(v_probs, 'F23-C07', format('%s was refused a card: %s', r.siapa, v_err));
        end if;
      end loop;
      perform selftest.as_owner();
      insert into auth.users (id, email) values (gen_random_uuid(), 'card-9100000071@cards.synthetic.pintar.test'),
                                                (gen_random_uuid(), 'card-9100000072@cards.synthetic.pintar.test');
      select count(*) into v_n from public.accounts a where a.person_id in (v_bekas, v_habis) and a.kind = 'CLASSROOM_CARD';
      if v_n <> 2 then
        v_probs := selftest.f23_note(v_probs, 'F23-C07', format('%s of the 2 granted cards became accounts', v_n));
      end if;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      for r in select * from (values (v_bekas, 'the revoked Guru'), (v_habis, 'the expired Guru')) as t(p, siapa) loop
        v_err := selftest.f23_raised(format('select public.grant_role(%L::uuid, %L::public.app_role, %L::uuid, %L::timestamptz)',
          r.p, 'EDUCATOR', v_node, now() + interval '1 year'));
        if v_err is distinct from '42501 STAFF_ROLE_FOR_CARD' then
          v_probs := selftest.f23_note(v_probs, 'F23-C07', format('re-granting %s a Guru role over the card answered %s', r.siapa, coalesce(v_err, 'a grant')));
        end if;
      end loop;
      perform selftest.as_owner();
      if exists (select 1 from public.persons p where p.id in (v_bekas, v_habis) and public.memegang_peran_staf(p.id)) then
        v_probs := selftest.f23_note(v_probs, 'F23-C07', 'a card holder holds a staff role');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-C07', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- THE CONTENT WORKFLOW: its own school, people and packages (fable12's helpers)
    -- ═══════════════════════════════════════════════════════════════════════
    perform selftest.as_owner();
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F23 ' || v_tag, 'f23w-' || v_tag, true, true) returning institutions.id into v_w;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F23 tetangga ' || v_tag, 'f23x-' || v_tag, true, true) returning institutions.id into v_w_b;
    perform set_config('app.seed_intent', '', true);
    v_adm_w := selftest.f11_user('f23-adm-'   || v_tag || '@local.invalid', 'INSTITUTION_ADMIN',  v_w);
    v_kajur := selftest.f11_user('f23-kajur-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_w);
    v_dean  := selftest.f11_user('f23-dekan-' || v_tag || '@local.invalid', 'DEAN',               v_w);
    v_guru  := selftest.f11_user('f23-guru-'  || v_tag || '@local.invalid', 'EDUCATOR',           v_w);
    v_adm_b := selftest.f11_user('f23-adm-b-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN',  v_w_b);
    select a.person_id into v_guru_p  from public.accounts a where a.auth_user_id = v_guru;
    select a.person_id into v_kajur_p from public.accounts a where a.auth_user_id = v_kajur;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-W01  ONE STEP, ONE TRANSACTION
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_c1 := selftest.f12_course(v_w, selftest.f12_paket('Wujud Zat ' || v_tag,
        'Bagaimana air berubah bila dipanaskan terus?', 'Air menguap menjadi gas', 'Air menjadi lebih padat'));
      v_c2 := selftest.f12_course(v_w, selftest.f12_paket('Cahaya ' || v_tag,
        'Ke mana cahaya bergerak di udara bebas?', 'Lurus ke segala arah', 'Selalu melengkung ke bawah'));
      -- the whole tree, approved by the head of department in one call
      perform selftest.as_user_uid(v_kajur);
      perform public.langkah_konten(v_c1, 'APPROVED');
      perform selftest.as_owner();
      select count(*) into v_n from (
        select status, reviewed_by_person_id from public.items i where i.lesson_id in
          (select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = v_c1)
        union all select status, reviewed_by_person_id from public.lessons l
          where l.module_id in (select m.id from public.modules m where m.course_id = v_c1)
        union all select m.status, m.reviewed_by_person_id from public.modules m where m.course_id = v_c1
        union all select c.status, c.reviewed_by_person_id from public.courses c where c.id = v_c1) x
       where x.status <> 'APPROVED' or x.reviewed_by_person_id is distinct from v_kajur_p;
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-W01', format('%s row(s) of the approved tree are not APPROVED by its reviewer', v_n));
      end if;
      -- a step refused at its last table: the course stands where its tree does not (planted with its guard off)
      alter table public.courses disable trigger courses_status_guard;
      update public.courses set status = 'VALIDATED' where courses.id = v_c2;
      alter table public.courses enable trigger courses_status_guard;
      perform selftest.as_user_uid(v_kajur);
      v_err := selftest.f23_raised(format('select public.langkah_konten(%L::uuid, %L)', v_c2, 'APPROVED'));
      perform selftest.as_owner();
      if v_err is null then
        v_probs := selftest.f23_note(v_probs, 'F23-W01', 'a step whose course could not take it went through');
      end if;
      select count(*) into v_n from (
        select status from public.items i where i.lesson_id in
          (select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = v_c2)
        union all select status from public.lessons l where l.module_id in (select m.id from public.modules m where m.course_id = v_c2)
        union all select m.status from public.modules m where m.course_id = v_c2) x
       where x.status <> 'IN_REVIEW';
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-W01', format('the refused step left %s row(s) of the tree moved: a mixed tree', v_n));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-W01', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-W02  THE SEND-BACK
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_c3 := selftest.f12_course(v_w, selftest.f12_paket('Energi ' || v_tag,
        'Energi apa yang dimiliki benda yang bergerak?', 'Energi gerak', 'Energi kimia saja'));
      for r in select * from (values (v_guru, 'the author', '42501 SENDBACK_NOT_REVIEWER'),
                                     (v_dean, 'a Dekan', '42501 SENDBACK_NOT_REVIEWER')) as t(u, siapa, mau) loop
        perform selftest.as_user_uid(r.u);
        v_err := selftest.f23_raised(format('select public.kembalikan_paket(%L::uuid, %L)', v_c3, 'Soal pertama belum jelas maksudnya.'));
        if v_err is distinct from r.mau then
          v_probs := selftest.f23_note(v_probs, 'F23-W02', format('%s sending it back answered %s, not %s', r.siapa, coalesce(v_err, 'done'), r.mau));
        end if;
      end loop;
      perform selftest.as_user_uid(v_kajur);
      v_err := selftest.f23_raised(format('select public.kembalikan_paket(%L::uuid, %L)', v_c3, 'kurang'));
      if v_err is distinct from 'PR040 SENDBACK_REASON_MISSING' then
        v_probs := selftest.f23_note(v_probs, 'F23-W02', 'a send-back without a reason answered ' || coalesce(v_err, 'done'));
      end if;
      v_err := selftest.f23_raised(format('select public.kembalikan_paket(%L::uuid, %L)', v_c1, 'Sudah disetujui, tetapi dicoba lagi.'));
      if v_err is distinct from 'PR040 SENDBACK_NOT_IN_REVIEW' then
        v_probs := selftest.f23_note(v_probs, 'F23-W02', 'sending back an approved package answered ' || coalesce(v_err, 'done'));
      end if;
      -- the edge taken any other way: the author's own step, under CAN_DRAFT
      perform selftest.as_user_uid(v_guru);
      v_err := selftest.f23_raised(format('select public.langkah_konten(%L::uuid, %L)', v_c3, 'VALIDATION_FAILED'));
      if v_err is null or v_err not like 'P0001%' then
        v_probs := selftest.f23_note(v_probs, 'F23-W02', 'the send-back edge taken without kembalikan_paket answered ' || coalesce(v_err, 'done'));
      end if;
      -- a reviewer who wrote the package
      perform selftest.as_user_uid(v_kajur);
      v_c4 := selftest.f12_course(v_w, selftest.f12_paket('Bunyi ' || v_tag,
        'Bunyi merambat melalui apa?', 'Melalui benda perantara', 'Hanya melalui ruang hampa'));
      v_err := selftest.f23_raised(format('select public.kembalikan_paket(%L::uuid, %L)', v_c4, 'Penyusun mengembalikan sendiri.'));
      if v_err is distinct from 'PR040 SENDBACK_REVIEWER_IS_AUTHOR' then
        v_probs := selftest.f23_note(v_probs, 'F23-W02', 'the author sending back their own package answered ' || coalesce(v_err, 'done'));
      end if;
      -- and the real one
      v_err := selftest.f23_raised(format('select public.kembalikan_paket(%L::uuid, %L)', v_c3, 'Soal pertama belum jelas maksudnya.'));
      perform selftest.as_owner();
      if v_err is not null then
        v_probs := selftest.f23_note(v_probs, 'F23-W02', 'the head of department could not send it back: ' || v_err);
      end if;
      select count(*) into v_n from (
        select status from public.items i where i.lesson_id in
          (select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = v_c3)
        union all select status from public.lessons l where l.module_id in (select m.id from public.modules m where m.course_id = v_c3)
        union all select m.status from public.modules m where m.course_id = v_c3
        union all select c.status from public.courses c where c.id = v_c3) x
       where x.status <> 'VALIDATION_FAILED';
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-W02', format('%s row(s) of the sent-back tree are not VALIDATION_FAILED', v_n));
      end if;
      select count(*) into v_n from public.content_review_outcomes o
       where o.course_id = v_c3 and o.outcome = 'SENT_BACK' and o.reason = 'Soal pertama belum jelas maksudnya.'
         and o.reviewer_person_id = v_kajur_p and o.author_person_id = v_guru_p;
      if v_n <> 1 then
        v_probs := selftest.f23_note(v_probs, 'F23-W02', format('%s SENT_BACK outcome(s) with the reason, reviewer and author', v_n));
      end if;
      select count(*) into v_n from public.audit_log a
       where a.action = 'content.sent_back' and a.target_id = v_c3::text and a.summary ->> 'reason' = 'Soal pertama belum jelas maksudnya.';
      if v_n <> 1 then
        v_probs := selftest.f23_note(v_probs, 'F23-W02', format('%s content.sent_back audit row(s)', v_n));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-W02', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-W03  THE AUTHOR'S CORRECTION PATH
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      for r in select * from (values (v_c3, true, 'the sent-back draft'), (v_c4, false, 'a draft nobody sent back')) as t(c, boleh, apa) loop
        v_batch := selftest.f11_batch(v_w, 'STRUCTURED_PACKAGE', selftest.f12_paket('Koreksi ' || v_tag,
          'Energi apa yang dimiliki benda yang sedang bergerak?', 'Energi gerak', 'Energi kimia saja'));
        update public.ingest_batches set revises_course_id = r.c, change_summary = 'Soal pertama diperjelas maksudnya.'
         where ingest_batches.id = v_batch;
        v_j := public.prepare_ingest_batch(v_batch);
        v_b := exists (select 1 from jsonb_array_elements(v_j -> 'problems') x where x ->> 'code' = 'REVISION_NOT_RELEASED');
        if v_b = r.boleh then
          v_probs := selftest.f23_note(v_probs, 'F23-W03', format('a correction of %s %s refused as not released',
            r.apa, case when r.boleh then 'was' else 'was not' end));
        end if;
      end loop;
      v_err := selftest.f23_raised(format('select public.langkah_konten(%L::uuid, %L)', v_c3, 'STRUCTURED'));
      if v_err is not null then
        v_probs := selftest.f23_note(v_probs, 'F23-W03', 'the author could not mark the sent-back draft structured again: ' || v_err);
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-W03', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-W04  WHO REVIEWED AND APPROVED
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      select count(*) into v_n from public.content_review_outcomes o
       where o.course_id = v_c1 and o.outcome = 'APPROVED' and o.reviewer_person_id = v_kajur_p
         and o.author_person_id = v_guru_p and o.reason is null;
      if v_n <> 1 then
        v_probs := selftest.f23_note(v_probs, 'F23-W04', format('%s APPROVED outcome(s) naming the reviewer and the author', v_n));
      end if;
      for r in select * from (values (v_guru, 2, 'the author'), (v_kajur, 2, 'the reviewer'), (v_adm_b, 0, 'another school''s administrator')) as t(u, mau, siapa) loop
        perform selftest.as_user_uid(r.u);
        select count(*) into v_n from public.content_review_outcomes o where o.course_id in (v_c1, v_c3);
        perform selftest.as_owner();
        if v_n <> r.mau then
          v_probs := selftest.f23_note(v_probs, 'F23-W04', format('%s reads %s outcome(s), not %s', r.siapa, v_n, r.mau));
        end if;
      end loop;
      v_err := selftest.f23_raised(format('update public.content_review_outcomes set reason = %L where course_id = %L::uuid', 'diubah kemudian', v_c3));
      if v_err is distinct from 'PR080 REVIEW_OUTCOME_FIXED' then
        v_probs := selftest.f23_note(v_probs, 'F23-W04', 'changing an outcome answered ' || coalesce(v_err, 'done'));
      end if;
      v_err := selftest.f23_raised(format('delete from public.content_review_outcomes where course_id = %L::uuid', v_c1));
      if v_err is distinct from 'PR080 REVIEW_OUTCOME_FIXED' then
        v_probs := selftest.f23_note(v_probs, 'F23-W04', 'removing an outcome answered ' || coalesce(v_err, 'done'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-W04', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-W05  THE HISTORY'S NAMES (W1.8, Batch 3 integration)
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      -- the author's own row security does not reach the reviewer's person row: the reason the function exists
      perform selftest.as_user_uid(v_guru);
      select count(*) into v_n from public.persons p where p.id = v_kajur_p;
      perform selftest.as_owner();
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-W05', format('the author reads the reviewer''s person row directly (%s): the case this measures has changed', v_n));
      end if;
      for r in select * from (values (v_guru, 1, 'the author'), (v_kajur, 1, 'the reviewer'), (v_adm_b, 0, 'another school''s administrator')) as t(u, mau, siapa) loop
        perform selftest.as_user_uid(r.u);
        select count(*) into v_n from public.nama_riwayat_paket(array[v_c1, v_c3]) x
         where x.person_id = v_kajur_p and x.display_name is not null and x.display_name <> '';
        -- what the reader is told in all, beyond the reviewer: no one but the people recorded on the two packages
        select count(*) into v_m from public.nama_riwayat_paket(array[v_c1, v_c3]) x
         where x.person_id not in (select o.reviewer_person_id from public.content_review_outcomes o where o.course_id in (v_c1, v_c3)
                                   union select n.written_by_person_id from public.course_revision_notes n
                                    where n.course_id in (v_c1, v_c3) and n.written_by_person_id is not null);
        perform selftest.as_owner();
        if r.mau = 1 and v_n < 1 then
          v_probs := selftest.f23_note(v_probs, 'F23-W05', format('%s is not told the reviewer''s name', r.siapa));
        elsif r.mau = 0 and v_n <> 0 then
          v_probs := selftest.f23_note(v_probs, 'F23-W05', format('%s is told the reviewer''s name', r.siapa));
        end if;
        if v_m <> 0 then
          v_probs := selftest.f23_note(v_probs, 'F23-W05', format('%s is told %s name(s) of people not recorded on the packages', r.siapa, v_m));
        end if;
      end loop;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-W05', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F23-T01  APPROVED v1 WORDING IN THE DATABASE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_batch := selftest.f11_batch(v_w, 'STRUCTURED_PACKAGE', jsonb_set(
        selftest.f12_paket('Kata F23 ' || v_tag, 'Berapa hasil dua ditambah tiga?', 'Lima', 'Enam'),
        '{courses,0,modules,0,lessons,0,body_markdown}', to_jsonb('Jangan bilang jawabanmu salah; periksa langkahnya.'::text)));
      perform public.prepare_ingest_batch(v_batch);
      v_j := public.confirm_ingest_batch(v_batch);
      v_c1 := (v_j -> 'courses' ->> 0)::uuid;
      perform public.validate_course_content(v_c1);
      perform selftest.as_owner();
      select string_agg(f.lokasi, ' | ') into v_got from public.coaching_findings f where f.course_id = v_c1;
      if v_got is null or v_got not like '%kolom Isi pelajaran%' or v_got ~ 'kolom (body_markdown|stem|title|summary|rationale|body)\M' then
        v_probs := selftest.f23_note(v_probs, 'F23-T01', 'the finding''s location is not in the workbook''s words: ' || coalesce(v_got, 'no finding'));
      end if;
      select count(*) into v_n from public.doctrine_lexicon l
       where l.label ~* '\msiswa\M' or l.mengapa_penting ~* '\msiswa\M' or l.cara_memperbaiki ~* '\msiswa\M';
      if v_n <> 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-T01', format('%s coaching rule(s) still say «siswa»', v_n));
      end if;
      v_got := pg_get_functiondef('public.run_mcq_quality(uuid)'::regprocedure);
      if v_got ~* '\msiswa\M' or position('Bank soal untuk paket ini' in v_got) = 0 then
        v_probs := selftest.f23_note(v_probs, 'F23-T01', 'the question-quality findings still carry pre-v1 wording');
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f23_note(v_probs, 'F23-T01', 'threw: ' || sqlerrm);
    end;

    raise exception 'F23_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F23_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in select * from unnest(
      array['F23-C01', 'F23-C02', 'F23-C03', 'F23-C04', 'F23-C05', 'F23-C06', 'F23-C07', 'F23-W01', 'F23-W02', 'F23-W03', 'F23-W04', 'F23-W05', 'F23-T01'],
      array['CR-91 -- asking for a card', 'CR-91 -- the account side', 'CR-91 -- the grant side',
            'CR-91 -- legacy data', 'CR-91 -- no staff power through a card', 'CR-91 / J9 -- educator as learner', 'CR-91 -- role transitions',
            'W1.13 -- one step, one transaction', 'W1.6 -- the send-back', 'W1.6 -- the author''s correction path',
            'W1.8 -- who reviewed and approved', 'W1.8 -- the history''s names', 'W4.1 -- approved v1 wording in the database'],
      array[
        'Aktivasi says boleh_kartu false for a Guru and for a Guru whose role starts tomorrow, true for a learner; a card '
          || 'for either Guru is refused 42501 CARD_FOR_STAFF and no card grant is written; the same Guru is granted an '
          || 'email account and the learner a card',
        'a card account for staff is refused 42501 CARD_FOR_STAFF through a planted grant consumed by Auth''s insert, '
          || 'through the seed branch, and by re-pointing card 7001''s account to a Guru; no card account exists for staff',
        'a Guru role for a class-card learner is refused 42501 STAFF_ROLE_FOR_CARD through grant_role by the school''s '
          || 'administrator (an alpha card learner) and by a Platform Admin (card 7001), and a Kepala departemen role '
          || 'through the seed path; neither card learner holds a role; an email learner may still be given one',
        'with a card and a staff role planted together (guards off inside the test only), kartu_bukan_staf() answers '
          || 'false for that session and authorize_card_reissue refuses the person 42501 CARD_FOR_STAFF; card 7001, an '
          || 'email Guru and an email learner answer true',
        'no person in the seeded world holds a class card and a staff role; card 7001''s session can provision nobody, '
          || 'review nothing, administer no school, is no Admin platform and is offered nobody to activate',
        'the enrolled Guru holds exactly one EMAIL account and, through it, Belajar and Mengajar',
        'a Guru whose role was revoked (with its reason) and a person whose role expired are offered a card and granted '
          || 'it; once either holds the card, a Guru role is refused 42501 STAFF_ROLE_FOR_CARD; neither card holder holds '
          || 'a staff role',
        'langkah_konten approves the whole tree as the head of department, every item, lesson, module and the course '
          || 'stamped with them; a step refused at the course leaves items, lessons and modules IN_REVIEW, never mixed',
        'kembalikan_paket by the head of department with a reason moves the whole tree to VALIDATION_FAILED and records '
          || 'one SENT_BACK outcome (reason, reviewer, author) and one content.sent_back audit row; refused to the author '
          || 'and a Dekan (42501 SENDBACK_NOT_REVIEWER), without a reason (SENDBACK_REASON_MISSING), off an approved '
          || 'package (SENDBACK_NOT_IN_REVIEW), to a reviewer who wrote it (SENDBACK_REVIEWER_IS_AUTHOR); the edge taken '
          || 'through the author''s own step is an illegal transition',
        'a correction of the sent-back draft is accepted in its line (no REVISION_NOT_RELEASED); a correction of a draft '
          || 'nobody sent back is still refused as not released; the author marks the sent-back draft structured again',
        'the approval recorded one APPROVED outcome naming the head of department and the author; the author and the '
          || 'reviewer each read the two outcomes, another school''s administrator none; changing or removing an outcome '
          || 'is refused PR080 REVIEW_OUTCOME_FIXED',
        'the author cannot read the reviewer''s person row, yet nama_riwayat_paket tells the author and the reviewer the '
          || 'reviewer''s name for the two packages, and another school''s administrator nothing; nobody is told a name not '
          || 'recorded on the packages',
        'a lesson that says «salah» is found at «kolom Isi pelajaran», never at the database column; no coaching rule '
          || 'says «siswa»; the question-quality findings say «murid» and «Bank soal untuk paket ini»'
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

  id := 'F23-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-23 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable23() from public;

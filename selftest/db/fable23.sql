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
--            Mengajar; enrolling a staff member for professional learning still works
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
  v_err text; v_n int; v_b boolean; v_got text; v_card text;
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

    raise exception 'F23_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F23_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in select * from unnest(
      array['F23-C01', 'F23-C02', 'F23-C03', 'F23-C04', 'F23-C05', 'F23-C06'],
      array['CR-91 -- asking for a card', 'CR-91 -- the account side', 'CR-91 -- the grant side',
            'CR-91 -- legacy data', 'CR-91 -- no staff power through a card', 'CR-91 / J9 -- educator as learner'],
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
        'the enrolled Guru holds exactly one EMAIL account and, through it, Belajar and Mengajar'
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

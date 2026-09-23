-- FABLE-09 database suite: the systemic repair. An answer is never lost to a
-- finish (R1), and a provisioned person can sign in while a stranger cannot
-- provision themselves (F-01, F-02, F-03).
--
-- Ordering: depends on fable01.sql (the role-switch helpers), fable03.sql (the
-- learning-cycle fixture and its answer helpers) and fable06.sql
-- (as_user_uid). Never applied as a migration; never present in production.
--
-- WHAT THIS SUITE IS FOR. The coherence assessment found two families the
-- earlier suites could not see, because each suite stopped at the edge of one
-- component. R1: the player, the receipt and the finish each behaved as
-- documented, and together a learner's last answers could be scored as
-- unanswered. F-01..F-03: the intake, the Auth trigger and the sign-in each
-- behaved as documented, and together a provisioned learner could never sign
-- in while anyone who could reach the sign-in page could create a person.
-- Every test here asserts the JOINT, signed in as the person who meets it.
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply fable01.sql before fable09.sql';
  end if;
  if to_regprocedure('selftest.cycle_fixture()') is null
     or to_regprocedure('selftest.purge_cycle_evidence()') is null then
    raise exception 'apply fable03.sql before fable09.sql';
  end if;
  if to_regprocedure('selftest.as_user_uid(uuid)') is null then
    raise exception 'apply fable06.sql before fable09.sql';
  end if;
  if to_regprocedure('public.finish_my_session(uuid, jsonb)') is null then
    raise exception 'fable09.sql needs the finish-manifest migration';
  end if;
  if to_regprocedure('public.authorize_account_activation(uuid, text, text)') is null then
    raise exception 'fable09.sql needs the account-activation migration';
  end if;
end $$;

create or replace function selftest.f09_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id],
                   coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
revoke all on function selftest.f09_note(jsonb, text, text) from public;
grant execute on function selftest.f09_note(jsonb, text, text) to authenticated;

-- A person with an account, an auth user and (optionally) one role, built the
-- way the fixtures build them: through the Auth trigger, under the synthetic
-- seed intent.
create or replace function selftest.f09_user(p_email text, p_role public.app_role, p_node uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid; v_person uuid;
begin
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into auth.users (id, email) values (gen_random_uuid(), p_email) returning id into v_uid;
  select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
  if p_role is not null then
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, p_role, p_node, now() - interval '1 day', now() + interval '365 days');
  end if;
  perform set_config('app.seed_intent', '', true);
  return v_uid;
end $$;
revoke all on function selftest.f09_user(text, public.app_role, uuid) from public;

-- The SQLSTATE and DETAIL a call raised, as one value, so a test can assert on
-- the code a client branches on rather than on message text.
create or replace function selftest.f09_raised(p_sql text)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text; v_msg text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
  return jsonb_build_object('code', v_state, 'detail', v_detail, 'message', v_msg);
end $$;
revoke all on function selftest.f09_raised(text) from public;
grant execute on function selftest.f09_raised(text) to authenticated, anon;

-- The answer a learner client would send for a delivered item, right or
-- wrong, in the shape its type takes. SECURITY DEFINER for the reason
-- answer_paper() is: the display-position mapping is unreachable by a learner.
create or replace function selftest.f09_answer(p_presented_item uuid, p_correct boolean)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_session uuid; v_item uuid; v_type public.item_type; v jsonb;
begin
  select p.session_id, p.item_id into v_session, v_item from public.presented_items p where p.id = p_presented_item;
  select i.item_type into v_type from public.items i where i.id = v_item;
  if v_type = 'MCQ_MULTI' then
    select to_jsonb(coalesce(array_agg(d.display_position order by d.display_position), '{}'::int[])) into v
      from public.option_display_order(v_session, v_item) d
      join public.item_options o on o.item_id = v_item and o.label = d.label
     where o.is_correct = p_correct;
  else
    select to_jsonb(d.display_position) into v
      from public.option_display_order(v_session, v_item) d
      join public.item_options o on o.item_id = v_item and o.label = d.label
     where o.is_correct = p_correct
     order by d.display_position limit 1;
  end if;
  return jsonb_build_object('posisi', v);
end $$;
revoke all on function selftest.f09_answer(uuid, boolean) from public;
grant execute on function selftest.f09_answer(uuid, boolean) to authenticated;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable09()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  f record; r record; n int; v_tag text;
  s1 uuid; s2 uuid; v_pi uuid; v_pi2 uuid; v_other_pi uuid; v_pos jsonb; v_pos2 jsonb;
  v_err jsonb; v_res uuid; v_res2 uuid; v_manifest jsonb; v_state text;
  v_def uuid; v_email text := 'siklus-email@synthetic.pintar.test';
  v_inst uuid; v_other uuid; v_period uuid; v_cls uuid;
  v_adm_u uuid; v_adm2_u uuid; v_guru_u uuid; v_sys_u uuid;
  v_p uuid; v_p2 uuid; v_enr uuid; v_u uuid; v_job uuid; v_ns text; v_out jsonb;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  m_codes int := 0; m_pending int := 0; m_refused int := 0; m_grace int := 0;
  m_signup int := 0; m_act_denied int := 0; m_imported int := 0;
begin
  perform selftest.as_owner();
  begin
    select * into f from selftest.cycle_fixture();
    if f.course is null then
      raise exception 'the learning-cycle fixture is absent: apply supabase/seed/learning_cycle.sql';
    end if;
    perform selftest.purge_cycle_evidence();

    -- ═══════════════════════════════════════════════════════════════════════
    -- F09-R01  A CONFLICT AND A CLOSED SESSION ARE TOLD APART BY CODE.
    -- The player could not distinguish "this number is taken, renumber" from
    -- "this session is over", so it held both forever or dropped both. Each
    -- now carries its own SQLSTATE, and the conflict names the server's
    -- high-water mark so the client can renumber above it.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user(v_email);
      s1 := public.start_learning_session(f.aa_pre);
      select p.id into v_pi from public.presented_items p where p.session_id = s1 order by p.position limit 1;
      v_pos := selftest.f09_answer(v_pi, true);
      v_pos2 := selftest.f09_answer(v_pi, false);
      perform public.record_answer(v_pi, 1, v_pos);
      perform public.record_answer(v_pi, 2, v_pos2);

      -- the same seq with the same answer is an acknowledgement, not an error
      v_err := selftest.f09_raised(format(
        'select public.record_answer(%L::uuid, 2, %L::jsonb)', v_pi, v_pos2));
      if v_err is not null then
        v_probs := selftest.f09_note(v_probs, 'F09-R01', 'a replayed identical receipt was refused: ' || (v_err ->> 'message'));
      end if;

      -- a different answer at a taken seq (a second tab, a restored outbox)
      v_err := selftest.f09_raised(format(
        'select public.record_answer(%L::uuid, 1, %L::jsonb)', v_pi, v_pos2));
      if v_err ->> 'code' is distinct from 'PR001' then
        v_probs := selftest.f09_note(v_probs, 'F09-R01',
          format('a seq conflict raised %s, not PR001', coalesce(v_err ->> 'code', 'nothing')));
      elsif v_err ->> 'detail' is distinct from '2' then
        v_probs := selftest.f09_note(v_probs, 'F09-R01',
          format('the conflict names %s as the server''s high-water mark; it holds 2', coalesce(v_err ->> 'detail', 'nothing')));
      else
        m_codes := m_codes + 1;
      end if;
      -- renumbering above the mark is accepted, and it is the answer that counts
      v_err := selftest.f09_raised(format(
        'select public.record_answer(%L::uuid, 3, %L::jsonb)', v_pi, v_pos));
      if v_err is not null then
        v_probs := selftest.f09_note(v_probs, 'F09-R01', 'the renumbered answer was refused: ' || (v_err ->> 'message'));
      end if;

      -- another learner's item is a terminal refusal, never a conflict
      perform selftest.as_user('card-7002@cards.synthetic.pintar.test');
      v_err := selftest.f09_raised(format(
        'select public.record_answer(%L::uuid, 9, %L::jsonb)', v_pi, v_pos));
      if v_err ->> 'code' is distinct from 'PR002' then
        v_probs := selftest.f09_note(v_probs, 'F09-R01',
          format('answering someone else''s session raised %s, not PR002', coalesce(v_err ->> 'code', 'nothing')));
      else
        m_codes := m_codes + 1;
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f09_note(v_probs, 'F09-R01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F09-R02  FINISH DECLARES WHAT THE LEARNER GAVE; THE SERVER HOLDS IT OR
    --          REFUSES. A finish that raced the outbox scored the paper
    --          without the answers still travelling.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user(v_email);
      if s1 is null then raise exception 'F09-R01 left no session'; end if;
      select p.id into v_pi2 from public.presented_items p
       where p.session_id = s1 order by p.position offset 1 limit 1;

      -- the learner answered the second item at seq 1; the server has nothing
      v_manifest := jsonb_build_object(v_pi::text, 3, v_pi2::text, 1);
      v_err := selftest.f09_raised(format('select public.finish_my_session(%L::uuid, %L::jsonb)', s1, v_manifest));
      if v_err ->> 'code' is distinct from 'PR006' then
        v_probs := selftest.f09_note(v_probs, 'F09-R02',
          format('a finish over an answer the server does not hold raised %s, not PR006', coalesce(v_err ->> 'code', 'nothing')));
      elsif position(v_pi2::text in coalesce(v_err ->> 'detail', '')) = 0
            or position(v_pi::text in coalesce(v_err ->> 'detail', '')) > 0 then
        v_probs := selftest.f09_note(v_probs, 'F09-R02',
          'the refusal does not name exactly the item still travelling: ' || coalesce(v_err ->> 'detail', 'nothing'));
      else
        m_pending := m_pending + 1;
      end if;
      -- a seq above what the server holds is pending too
      v_err := selftest.f09_raised(format('select public.finish_my_session(%L::uuid, %L::jsonb)',
        s1, jsonb_build_object(v_pi::text, 4)));
      if v_err ->> 'code' is distinct from 'PR006' then
        v_probs := selftest.f09_note(v_probs, 'F09-R02', 'a manifest seq above the held one was accepted');
      else m_pending := m_pending + 1; end if;
      -- an item from another session does not satisfy this one
      select p.id into v_other_pi from public.presented_items p where p.session_id <> s1 limit 1;
      if v_other_pi is not null then
        v_err := selftest.f09_raised(format('select public.finish_my_session(%L::uuid, %L::jsonb)',
          s1, jsonb_build_object(v_other_pi::text, 1)));
        if v_err ->> 'code' is distinct from 'PR006' then
          v_probs := selftest.f09_note(v_probs, 'F09-R02', 'another session''s item satisfied this session''s manifest');
        else m_pending := m_pending + 1; end if;
      end if;
      -- a malformed manifest is refused, not treated as empty
      v_err := selftest.f09_raised(format('select public.finish_my_session(%L::uuid, %L::jsonb)', s1, '[1,2]'));
      if v_err is null then
        v_probs := selftest.f09_note(v_probs, 'F09-R02', 'an array manifest was accepted');
      end if;

      -- and none of the refusals scored anything
      perform selftest.as_owner();
      select s.status::text into v_state from public.assessment_sessions s where s.id = s1;
      select count(*) into n from public.assessment_results x where x.session_id = s1;
      if n <> 0 or v_state = 'FINALIZED' then
        v_probs := selftest.f09_note(v_probs, 'F09-R02',
          format('a refused finish still scored the session (%s, %s result row(s))', v_state, n));
      end if;

      -- once the answer arrives, the same finish succeeds, and only once
      perform selftest.as_user(v_email);
      v_pos := selftest.f09_answer(v_pi2, true);
      perform public.record_answer(v_pi2, 1, v_pos);
      v_res := public.finish_my_session(s1, v_manifest);
      v_res2 := public.finish_my_session(s1, v_manifest);
      if v_res is null or v_res2 is distinct from v_res then
        v_probs := selftest.f09_note(v_probs, 'F09-R02', 'a repeated finish computed a second result');
      end if;
      perform selftest.as_owner();
      select count(*) into n from public.assessment_results x where x.session_id = s1;
      if n <> 1 then
        v_probs := selftest.f09_note(v_probs, 'F09-R02', format('%s result rows for one finished session', n));
      end if;

      -- after the finish, an answer is a TERMINAL refusal the player stops on
      perform selftest.as_user(v_email);
      v_err := selftest.f09_raised(format(
        'select public.record_answer(%L::uuid, 5, %L::jsonb)', v_pi, v_pos));
      if v_err ->> 'code' is distinct from 'PR002' then
        v_probs := selftest.f09_note(v_probs, 'F09-R02',
          format('an answer into a finalized session raised %s, not PR002', coalesce(v_err ->> 'code', 'nothing')));
      else m_refused := m_refused + 1; end if;
      -- and another learner cannot finish it
      perform selftest.as_user('card-7002@cards.synthetic.pintar.test');
      v_err := selftest.f09_raised(format('select public.finish_my_session(%L::uuid, null)', s1));
      if v_err ->> 'code' is distinct from 'PR002' then
        v_probs := selftest.f09_note(v_probs, 'F09-R02', 'another learner could finish this session');
      else m_refused := m_refused + 1; end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f09_note(v_probs, 'F09-R02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F09-R03  AN EXPIRED SESSION WAITS OUT ITS LATE-SYNC WINDOW. An answer
    --          given before the deadline and received inside the grace window
    --          is scorable (doc 04 §3); scoring the paper the moment the clock
    --          ran out threw it away. Only the learner's own verified manifest
    --          closes the window early.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user(v_email);
      s2 := public.start_learning_session(f.aa_post);
      select p.id into v_pi from public.presented_items p where p.session_id = s2 order by p.position limit 1;
      v_pos := selftest.f09_answer(v_pi, true);
      perform public.record_answer(v_pi, 1, v_pos);

      -- the clock runs out a minute ago; the definition grants ten minutes
      perform selftest.as_owner();
      select s.assessment_definition_id into v_def from public.assessment_sessions s where s.id = s2;
      alter table public.assessment_definitions disable trigger user;
      update public.assessment_definitions set late_sync_grace_seconds = 600 where assessment_definitions.id = v_def;
      alter table public.assessment_definitions enable trigger user;
      alter table public.assessment_sessions disable trigger user;
      update public.assessment_sessions set authoritative_deadline = now() - interval '1 minute' where assessment_sessions.id = s2;
      alter table public.assessment_sessions enable trigger user;

      -- the answer still travelling arrives, and it counts
      perform selftest.as_user(v_email);
      select p.id into v_pi2 from public.presented_items p
       where p.session_id = s2 order by p.position offset 1 limit 1;
      v_pos := selftest.f09_answer(v_pi2, true);
      select x.outcome into v_state from public.record_answer(v_pi2, 1, v_pos) x;
      if v_state is null or v_state like '%retained_unscored%' then
        v_probs := selftest.f09_note(v_probs, 'F09-R03',
          format('an answer inside the grace window came back %s', coalesce(v_state, 'nothing')));
      end if;

      -- the unattended close (the deadline sweep, a second tab's bare finish)
      -- may not score it while the window is open
      perform selftest.as_owner();
      v_err := selftest.f09_raised(format('select public.finalize_session(%L::uuid)', s2));
      if v_err ->> 'code' is distinct from 'PR007' then
        v_probs := selftest.f09_note(v_probs, 'F09-R03',
          format('closing an expired session inside its grace window raised %s, not PR007', coalesce(v_err ->> 'code', 'nothing')));
      else m_grace := m_grace + 1; end if;
      perform selftest.as_user(v_email);
      v_err := selftest.f09_raised(format('select public.finish_my_session(%L::uuid, null)', s2));
      if v_err ->> 'code' is distinct from 'PR007' then
        v_probs := selftest.f09_note(v_probs, 'F09-R03', 'a finish without a manifest closed the grace window');
      else m_grace := m_grace + 1; end if;
      -- the setting that marks a verified manifest is not a key on its own:
      -- it opens only the session it names
      perform set_config('pintar.manifest_verified', s1::text, true);
      v_err := selftest.f09_raised(format('select public.finish_my_session(%L::uuid, null)', s2));
      perform set_config('pintar.manifest_verified', '', true);
      if v_err ->> 'code' is distinct from 'PR007' then
        v_probs := selftest.f09_note(v_probs, 'F09-R03', 'a marker naming another session closed this one''s window');
      else m_grace := m_grace + 1; end if;

      -- an answer held in ANOTHER session does not satisfy this one's manifest
      select p.id into v_other_pi from public.presented_items p where p.session_id = s1 limit 1;
      v_err := selftest.f09_raised(format('select public.finish_my_session(%L::uuid, %L::jsonb)',
        s2, jsonb_build_object(v_pi::text, 1, v_other_pi::text, 1)));
      if v_err ->> 'code' is distinct from 'PR006' then
        v_probs := selftest.f09_note(v_probs, 'F09-R03',
          format('another session''s answer satisfied this session''s manifest (%s)', coalesce(v_err ->> 'code', 'accepted')));
      end if;

      -- the learner's own manifest, satisfied, closes it and both answers count
      v_res := public.finish_my_session(s2, jsonb_build_object(v_pi::text, 1, v_pi2::text, 1));
      perform selftest.as_owner();
      select (x.delta_inputs ->> 'answered')::int into n from public.assessment_results x where x.id = v_res;
      if coalesce(n, 0) < 2 then
        v_probs := selftest.f09_note(v_probs, 'F09-R03',
          format('the closed paper counts %s answered item(s); both the live and the late answer should count', coalesce(n, 0)));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f09_note(v_probs, 'F09-R03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    ------------------------------------------------ the identity fixture
    v_tag := substr(md5(random()::text), 1, 8);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F09', 'f09-' || v_tag, true, true) returning institutions.id into v_inst;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F09 tetangga', 'f09b-' || v_tag, true, true) returning institutions.id into v_other;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 30, current_date + 300) returning academic_periods.id into v_period;
    perform set_config('app.seed_intent', '', true);
    v_adm_u  := selftest.f09_user('f09-admin-'  || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_inst);
    v_adm2_u := selftest.f09_user('f09-admin2-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_other);
    v_guru_u := selftest.f09_user('f09-guru-'   || v_tag || '@local.invalid', 'EDUCATOR',          v_inst);
    v_sys_u  := selftest.f09_user('f09-sys-'    || v_tag || '@local.invalid', 'SYSTEM_ADMIN',      v_inst);
    -- a school that gives numbers first reserves its namespace
    for i in 1..50 loop
      v_ns := upper(substr(md5(v_tag || i::text), 1, 3));
      exit when not exists (select 1 from public.institutions x where upper(x.namespace) = v_ns);
    end loop;
    update public.institutions set namespace = v_ns where institutions.id = v_inst;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F09-A01  A SIGN-UP CREATES NOBODY (F-02). Once an installation has an
    --          administrator, the only identities that become PINTAR people
    --          are the ones PINTAR asked Auth to create.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      -- the fixtures marker is what lets the seeds create people; a real
      -- installation never carries it, so it is off for this test
      update public.platform_environment set local_fixtures_enabled = false;
      if public.synthetic_fixtures_permitted() then
        raise exception 'the fixtures marker could not be cleared for this test';
      end if;

      v_err := selftest.f09_raised(format(
        'insert into auth.users (id, email) values (gen_random_uuid(), %L)', 'f09-orang-asing-' || v_tag || '@local.invalid'));
      if v_err ->> 'code' is distinct from 'PR010' then
        v_probs := selftest.f09_note(v_probs, 'F09-A01',
          format('a bare sign-up raised %s, not PR010', coalesce(v_err ->> 'code', 'nothing -- it created a person')));
      else m_signup := m_signup + 1; end if;

      -- user_metadata is writable by the signer; it is not the marker
      v_err := selftest.f09_raised(format(
        'insert into auth.users (id, email, raw_user_meta_data) values (gen_random_uuid(), %L, %L::jsonb)',
        'f09-palsu-' || v_tag || '@local.invalid', '{"pintar_provisioned":"true","person_id":"' || gen_random_uuid() || '"}'));
      if v_err ->> 'code' is distinct from 'PR010' then
        v_probs := selftest.f09_note(v_probs, 'F09-A01', 'a sign-up that wrote the marker into user_metadata was accepted');
      else m_signup := m_signup + 1; end if;

      -- a person_id that names nobody is refused, not silently invented
      v_err := selftest.f09_raised(format(
        'insert into auth.users (id, email, raw_app_meta_data) values (gen_random_uuid(), %L, %L::jsonb)',
        'f09-hantu-' || v_tag || '@local.invalid', jsonb_build_object('person_id', gen_random_uuid())));
      if v_err ->> 'code' is distinct from 'PR010' then
        v_probs := selftest.f09_note(v_probs, 'F09-A01', 'an identity naming a person who does not exist was accepted');
      else m_signup := m_signup + 1; end if;

      -- and the synthetic seed intent is not a production key
      update public.platform_environment set environment = 'production';
      perform set_config('app.seed_intent', 'synthetic', true);
      v_err := selftest.f09_raised(format(
        'insert into auth.users (id, email) values (gen_random_uuid(), %L)', 'f09-niat-' || v_tag || '@local.invalid'));
      perform set_config('app.seed_intent', '', true);
      if v_err ->> 'code' is distinct from 'PR010' then
        v_probs := selftest.f09_note(v_probs, 'F09-A01', 'the synthetic seed intent created a person on production');
      else m_signup := m_signup + 1; end if;

      -- the marker only the admin API can write is honoured
      insert into auth.users (id, email, raw_app_meta_data)
      values (gen_random_uuid(), 'f09-admin-baru-' || v_tag || '@local.invalid', '{"pintar_provisioned":"true"}'::jsonb)
      returning auth.users.id into v_u;
      select count(*) into n from public.accounts a where a.auth_user_id = v_u;
      if n <> 1 then
        v_probs := selftest.f09_note(v_probs, 'F09-A01', 'an identity the admin API marked as provisioned got no account');
      end if;
    exception when others then
      v_probs := selftest.f09_note(v_probs, 'F09-A01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F09-A02  A PROVISIONED PERSON CAN BE ACTIVATED, AND SIGNS IN AS
    --          THEMSELVES (F-01). Provisioning deliberately activates nothing;
    --          before this, nothing did.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      insert into public.persons (display_name) values ('Murid F09 ' || v_tag) returning persons.id into v_p;
      perform public.issue_institutional_id(v_p, v_inst);
      insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      values (v_p, v_inst, v_period, 'PENDING') returning enrollments.id into v_enr;

      -- the school's administrator is offered them; nobody else is
      perform selftest.as_user_uid(v_adm_u);
      select count(*) into n from public.persons_awaiting_account() w where w.person_id = v_p;
      if n <> 1 then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'the school''s administrator is not offered the provisioned person');
      end if;
      select count(*) into n from public.persons_awaiting_account() w
       where exists (select 1 from public.accounts a where a.person_id = w.person_id);
      if n <> 0 then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', format('%s person(s) who already hold an account are offered', n));
      end if;
      foreach v_state in array array['admin2', 'guru'] loop
        perform selftest.as_user_uid(case v_state when 'admin2' then v_adm2_u else v_guru_u end);
        select count(*) into n from public.persons_awaiting_account() w where w.person_id = v_p;
        if n <> 0 then
          v_probs := selftest.f09_note(v_probs, 'F09-A02', v_state || ' is offered a person outside their authority');
        end if;
        v_err := selftest.f09_raised(format(
          'select * from public.authorize_account_activation(%L::uuid, %L, %L)', v_p, 'EMAIL', 'murid@local.invalid'));
        if v_err is null then
          v_probs := selftest.f09_note(v_probs, 'F09-A02', v_state || ' could authorize an activation');
        else m_act_denied := m_act_denied + 1; end if;
      end loop;
      perform selftest.as_anon();
      v_err := selftest.f09_raised('select * from public.persons_awaiting_account()');
      if v_err is null then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'an anonymous caller can read who awaits an account');
      else m_act_denied := m_act_denied + 1; end if;
      perform selftest.as_owner();

      -- the administrator's own malformed requests are refused
      perform selftest.as_user_uid(v_adm_u);
      for r in select * from unnest(array['PASSWORD', 'EMAIL'], array['x@local.invalid', 'bukan-surel']) as t(kind, email) loop
        v_err := selftest.f09_raised(format(
          'select * from public.authorize_account_activation(%L::uuid, %L, %L)', v_p, r.kind, r.email));
        if v_err is null then
          v_probs := selftest.f09_note(v_probs, 'F09-A02', format('activation as %s with %s was authorized', r.kind, r.email));
        end if;
      end loop;
      -- an institution administrator cannot create a person outside the intake
      v_err := selftest.f09_raised(format('select public.authorize_new_person(%L)', 'Orang Baru'));
      if v_err is null then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'an institution administrator could create a person outside the intake');
      else m_act_denied := m_act_denied + 1; end if;

      -- the real request is authorized and audited
      select count(*) into n from public.authorize_account_activation(v_p, 'EMAIL', 'murid-' || v_tag || '@local.invalid');
      perform selftest.as_owner();
      if n <> 1 then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'the administrator''s activation was not authorized');
      end if;
      select count(*) into n from public.audit_log l
       where l.action = 'account.activation_authorized' and l.target_id = v_p::text;
      if n <> 1 then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', format('%s audit row(s) for one activation', n));
      end if;

      -- what the route then asks Auth to create: the link, in app_metadata
      update public.platform_environment set local_fixtures_enabled = false;
      insert into auth.users (id, email, raw_app_meta_data)
      values (gen_random_uuid(), 'murid-' || v_tag || '@local.invalid',
              jsonb_build_object('person_id', v_p, 'account_kind', 'EMAIL'))
      returning auth.users.id into v_u;
      select count(*) into n from public.accounts a where a.auth_user_id = v_u and a.person_id = v_p;
      if n <> 1 then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'the activated identity is not the provisioned person');
      end if;
      select e.status::text into v_state from public.enrollments e where e.id = v_enr;
      if v_state <> 'ACTIVE' then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'activation left the enrolment ' || v_state);
      end if;

      -- signed in, they are themselves
      perform selftest.as_user_uid(v_u);
      if public.current_person_id() is distinct from v_p then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'the activated learner signs in as someone else');
      end if;
      -- and they leave the list; a second activation is refused
      perform selftest.as_user_uid(v_adm_u);
      select count(*) into n from public.persons_awaiting_account() w where w.person_id = v_p;
      if n <> 0 then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'an activated person is still offered for activation');
      end if;
      v_err := selftest.f09_raised(format(
        'select * from public.authorize_account_activation(%L::uuid, %L, null)', v_p, 'CLASSROOM_CARD'));
      if v_err is null then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'a person with an account could be activated a second time');
      else m_act_denied := m_act_denied + 1; end if;

      -- a SYSTEM_ADMIN may authorize a person no institution has yet
      perform selftest.as_user_uid(v_sys_u);
      v_err := selftest.f09_raised(format('select public.authorize_new_person(%L)', 'Admin Sekolah Baru'));
      if v_err is not null then
        v_probs := selftest.f09_note(v_probs, 'F09-A02', 'a SYSTEM_ADMIN could not authorize a new person: ' || (v_err ->> 'message'));
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f09_note(v_probs, 'F09-A02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F09-A03  THE INTAKE ENROLS A LEARNER (F-03). The validator accepted
    --          role STUDENT; the provisioning step then tried to grant it as a
    --          role and failed every such row, so a school's learner list
    --          could not be imported at all.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_inst, v_inst, 'FACULTY', 'F') returning org_nodes.id into v_cls;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_inst, v_cls, 'DEPARTMENT', 'D') returning org_nodes.id into v_cls;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_inst, v_cls, 'PROGRAMME', 'P') returning org_nodes.id into v_cls;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_inst, v_cls, 'COHORT', 'Angkatan', v_period) returning org_nodes.id into v_cls;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_inst, v_cls, 'CLASS', '7A', v_period) returning org_nodes.id into v_cls;

      -- the fixture's namespace is the one this import numbers under
      perform selftest.as_user_uid(v_adm_u);
      v_job := public.import_open(v_inst, jsonb_build_array(
        jsonb_build_object('display_name', 'Siswa Impor Satu ' || v_tag, 'node_id', v_cls, 'role', 'STUDENT'),
        jsonb_build_object('display_name', 'Siswa Impor Dua '  || v_tag, 'node_id', v_cls)));
      perform public.import_validate(v_job);
      perform public.import_confirm(v_job);
      v_out := public.import_advance(v_job, 10);
      perform selftest.as_owner();
      if (v_out ->> 'state') <> 'COMPLETED' or (v_out ->> 'completed')::int <> 2 then
        v_probs := selftest.f09_note(v_probs, 'F09-A03',
          format('a two-learner import ended %s with %s completed: %s', v_out ->> 'state', v_out ->> 'completed',
                 (select string_agg(ir.failure_reason, '; ') from public.import_rows ir where ir.job_id = v_job)));
      end if;
      select p.id into v_p2 from public.persons p where p.display_name = 'Siswa Impor Satu ' || v_tag;
      select count(*) into n from public.enrollments e
        join public.memberships m on m.enrollment_id = e.id
       where e.person_id = v_p2 and m.node_id = v_cls and e.status = 'PENDING';
      if n <> 1 then
        v_probs := selftest.f09_note(v_probs, 'F09-A03', 'the STUDENT row was not enrolled in its class');
      else m_imported := m_imported + 1; end if;
      select count(*) into n from public.role_assignments ra where ra.person_id = v_p2;
      if n <> 0 then
        v_probs := selftest.f09_note(v_probs, 'F09-A03', 'a learner was given a role assignment');
      end if;
      -- and the imported learner is who activation offers next
      perform selftest.as_user_uid(v_adm_u);
      select count(*) into n from public.persons_awaiting_account() w where w.person_id = v_p2;
      if n <> 1 then
        v_probs := selftest.f09_note(v_probs, 'F09-A03', 'the imported learner is not offered for activation');
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f09_note(v_probs, 'F09-A03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    raise exception 'F09_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    perform set_config('pintar.manifest_verified', '', true);
    if sqlerrm <> 'F09_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  for r in
    select * from unnest(
      array['F09-R01','F09-R02','F09-R03','F09-A01','F09-A02','F09-A03'],
      array['R1 -- a conflict and a closed session are told apart by code',
            'R1 -- finish declares what the learner gave; the server holds it or refuses',
            'R1 -- an expired session waits out its late-sync window',
            'F-02 -- a sign-up creates nobody',
            'F-01 -- a provisioned person can be activated and signs in as themselves',
            'F-03 -- the intake enrols a learner'],
      array[
        format('a different answer at a taken client_seq raises PR001 and names the server''s high-water '
            || 'mark, so the player renumbers above it and the answer is kept; an identical replay is an '
            || 'acknowledgement; an answer into someone else''s session raises PR002, the terminal code '
            || 'the player stops on (%s coded refusal(s))', m_codes),
        format('a finish whose manifest names an answer the server does not hold raises PR006 naming '
            || 'exactly that item, and scores nothing; a seq above the held one is pending too (%s '
            || 'pending refusal(s)); once the answer arrives the same finish '
            || 'succeeds, a repeat returns the same result, and afterwards an answer and another '
            || 'learner''s finish are each PR002 (%s)', m_pending, m_refused),
        format('an answer received inside the grace window after the deadline is scorable; neither the '
            || 'unattended close, nor a finish without a manifest, nor a marker naming another session '
            || 'may score the paper while the window is open (%s PR007 refusal(s)); an answer held in '
            || 'another session does not satisfy its manifest; the learner''s own '
            || 'satisfied manifest closes it and both the live and the late answer count', m_grace),
        format('with an administrator present and no fixtures marker, a bare sign-up, a sign-up that '
            || 'wrote the marker into user_metadata, an identity naming a person who does not exist, and '
            || 'the synthetic seed intent on production are each refused with PR010 (%s); the marker '
            || 'only the admin API can write is honoured', m_signup),
        format('the school''s administrator is offered the provisioned person and nobody already holding '
            || 'an account; another school''s administrator, an educator and an anonymous caller are '
            || 'refused, as are malformed requests and an institution administrator creating a person '
            || 'outside the intake (%s refusal(s)). The authorized activation is audited once, the '
            || 'identity Auth creates links to the provisioned person and starts their enrolment, they '
            || 'sign in as themselves, and a second activation is refused', m_act_denied),
        format('an import row with role STUDENT completes, is enrolled in its class and receives no role '
            || 'assignment (%s), and the imported learner is who activation offers next', m_imported)
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false;
      detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F09-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-09 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable09() from public;
grant execute on function selftest.run_fable09() to authenticated;

-- FABLE-21 database suite: the closure's landing L2 (D-127, D-128, D-129).
--
-- Ordering: depends on fable01.sql (role switches, pass_mark), fable03.sql (answer_paper), fable05.sql (f05_actor),
-- fable11.sql (f11_batch, the raised-error reader) and fable12.sql (f12_course, f12_advance). Never applied as a
-- migration; never present in production.
--
--   F21-D01  FD-5 (D-127 §4, D-129(c)): the author's difficulty, end to end. A chapter whose author marked two questions
--            Mudah, one Sedang and two Sulit (0.3, 0.5, 0.7: what the workbook and every PINTAR package write) is imported,
--            and each question is stored with exactly that value; the band reads each as its author wrote it; the
--            teacher's Uji Cepat choices name each by the author's word; and a drawn paper that asks for two Mudah and one
--            Sedang carries the author's two Mudah and the Sedang, never a Sulit
--   F21-I01  FD-7 (DG-32): Tinjauan Integritas's waiting list. Two observations of one sitting wait for a reviewer who may
--            review them, and for nobody else (the sitting's own learner sees none); a Kepala departemen whose department
--            does not hold the sitting's class sees them with no referral offered, and the server indeed refuses that
--            referral; once a review is recorded on the sitting both leave, for every reviewer; an observation made after
--            the review waits again
--   F21-R01  FD-9 (D-127 Q8; DG-30): a saved rule's lifecycle. A rule saved for a chapter still being drafted is a draft
--            (INGESTED), moves with the chapter through the steps to approval, and is the released chapter's Uji
--            Penguasaan rule (release_cycle_definition); a new rule for the chapter once it has moved on is refused by
--            name («a rule is set while its chapter is still being drafted»), and nothing is saved
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb of problems, a sentinel to undo the
-- lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null or to_regprocedure('selftest.as_owner()') is null
     or to_regprocedure('selftest.pass_mark(uuid, uuid, integer)') is null
     or to_regprocedure('selftest.f05_actor(text, public.app_role, uuid)') is null
     or to_regprocedure('selftest.f12_course(uuid, jsonb)') is null
     or to_regprocedure('selftest.f12_advance(uuid, public.content_status)') is null then
    raise exception 'apply fable01.sql, fable05.sql, fable11.sql and fable12.sql before fable21.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f21_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f21_note(jsonb, text, text) to authenticated, anon;

-- A one-lesson chapter whose five questions carry the author's difficulty as the workbook writes it (unggah-kontrak.ts
-- KESULITAN): each stem names the word its author chose, so a test can read the word back from the stem.
create or replace function selftest.f21_paket(p_title text)
returns jsonb language sql immutable as $$
  select jsonb_build_object('courses', jsonb_build_array(jsonb_build_object(
    'title', p_title, 'subject', 'Matematika', 'stage', 'SD', 'grade_label', 'Kelas 5',
    'modules', jsonb_build_array(jsonb_build_object('title', 'Satuan panjang', 'lessons', jsonb_build_array(
      jsonb_build_object('title', 'Tangga satuan', 'body_markdown', 'Setiap turun satu anak tangga, nilainya dikali sepuluh.',
        'items', (select jsonb_agg(jsonb_build_object(
            'stem', format('[%s %s] Berapa cm dalam %s m?', q.kata, q.n, q.m), 'use', 'POST_TEST', 'difficulty', q.nilai,
            'options', jsonb_build_array(
              jsonb_build_object('label', 'A', 'body', (q.m * 100) || ' cm', 'is_correct', true,
                                 'rationale', 'Dari m ke cm turun dua anak tangga: dikali seratus.'),
              jsonb_build_object('label', 'B', 'body', (q.m * 10) || ' cm', 'is_correct', false,
                                 'rationale', 'Baru turun satu anak tangga; dari m ke cm ada dua.')))
            order by q.n)
          from (values ('Mudah', 1, 3, '0.3'), ('Mudah', 2, 4, '0.3'), ('Sedang', 3, 5, '0.5'),
                       ('Sulit', 4, 6, '0.7'), ('Sulit', 5, 7, '0.7')) as q(kata, n, m, nilai)))))))))
$$;
revoke all on function selftest.f21_paket(text) from public;
grant execute on function selftest.f21_paket(text) to authenticated;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable21()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_tag text; v_kk uuid; v_b uuid; v_hod uuid; v_course uuid; v_mod uuid; v_rel uuid; v_kj jsonb;
  v_node uuid; v_guru text; v_row record; v_sess uuid; v_kata text; v_harap text; v_n int;
  v_ia uuid; v_isess uuid; v_iroot uuid; v_idept uuid; v_ikadep text; v_isig1 uuid; v_isig2 uuid; v_isig3 uuid;
  v_imurid uuid; v_ilist jsonb;
  v_rc uuid; v_rbatch uuid; v_rj jsonb; v_rdef uuid; v_rrel uuid; v_rpakai uuid; v_rtolak jsonb; v_rhod uuid;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F21-D01  FD-5: THE AUTHOR'S MUDAH IS MUDAH, FROM THE IMPORT TO THE TEACHER'S SCREEN AND THE DRAWN PAPER
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select i.id into v_kk from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
      select i.id into v_b from public.institutions i where i.slug like 'synth-beta-%' limit 1;
      -- the class of the beta school's first learner, who sits the paper
      select m.node_id into v_node from public.memberships m
        join public.org_nodes n on n.id = m.node_id
        join public.enrollments e on e.id = m.enrollment_id
        join public.accounts a on a.person_id = e.person_id
        join auth.users u on u.id = a.auth_user_id
       where u.email = 'beta-siswa-1@synthetic.pintar.test' and n.kind = 'CLASS' and m.valid_to is null
       limit 1;
      -- a second platform admin for the two-person steps, inside the rolled-back transaction (as F20-K01)
      select a.person_id into v_hod from public.accounts a join auth.users u on u.id = a.auth_user_id
       where u.email = 'alpha-hod@synthetic.pintar.test';
      if v_kk is null or v_b is null or v_node is null or v_hod is null then
        raise exception 'the fixture lacks the library, the beta school, its learner''s class or a second person';
      end if;
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, valid_from, valid_until)
      values (v_hod, 'SYSTEM_ADMIN', now() - interval '1 day', now() + interval '1 day');
      perform set_config('app.seed_intent', '', true);

      -- 1. imported as the workbook writes it
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      v_course := selftest.f12_course(v_kk, selftest.f21_paket('Kesulitan F21 ' || v_tag));
      perform selftest.as_owner();
      select m.id into v_mod from public.modules m where m.course_id = v_course;

      -- 2. stored exactly as the author's representation: nothing converts it on the way in
      for r in select i.stem, i.predicted_difficulty from public.items i join public.lessons l on l.id = i.lesson_id
                where l.module_id = v_mod loop
        v_kata := substring(r.stem from '^\[(\w+) ');
        v_harap := case v_kata when 'Mudah' then '0.300' when 'Sedang' then '0.500' when 'Sulit' then '0.700' end;
        if r.predicted_difficulty::text is distinct from v_harap then
          v_probs := selftest.f21_note(v_probs, 'F21-D01', format('the author''s «%s» was stored as %s, not %s',
            v_kata, coalesce(r.predicted_difficulty::text, 'nothing'), v_harap));
        end if;
        -- 3. the band reads it as its author wrote it
        if public.difficulty_band(r.predicted_difficulty) is distinct from upper(v_kata) then
          v_probs := selftest.f21_note(v_probs, 'F21-D01', format('the author''s «%s» (%s) is read as %s',
            v_kata, r.predicted_difficulty, public.difficulty_band(r.predicted_difficulty)));
        end if;
      end loop;
      select count(*) into v_n from public.items i join public.lessons l on l.id = i.lesson_id where l.module_id = v_mod;
      if v_n <> 5 then
        v_probs := selftest.f21_note(v_probs, 'F21-D01', format('the chapter arrived with %s question(s), not 5', v_n));
      end if;

      -- published by two people and given to the beta school (F20-K01's path)
      perform selftest.as_user('alpha-hod@synthetic.pintar.test');
      perform selftest.f12_advance(v_course, 'APPROVED');
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      v_kj := public.create_release(v_course);
      v_rel := (v_kj ->> 'release')::uuid;
      perform selftest.as_user('alpha-hod@synthetic.pintar.test');
      perform public.freeze_release(v_rel);
      for r in select f.id from public.mcq_quality_findings f where f.course_id = v_course and f.acknowledged_at is null loop
        perform public.acknowledge_finding('MCQ_QUALITY', r.id, 'F21-D01');
      end loop;
      for r in select f.id from public.coaching_findings f where f.course_id = v_course and f.acknowledged_at is null loop
        perform public.acknowledge_finding('COACHING', r.id, 'F21-D01');
      end loop;
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      perform public.publish_release(v_rel);
      perform public.grant_release_distribution(v_rel, v_b, 'F21-D01');
      perform selftest.as_owner();
      perform selftest.pass_mark(v_b, v_course);
      v_guru := 'f21-guru-b-' || v_tag || '@synthetic.pintar.test';
      perform selftest.f05_actor(v_guru, 'EDUCATOR', v_b);

      -- 4. the teacher's screen: the Uji Cepat choices name each question by its author's word
      perform selftest.as_user(v_guru);
      for r in select c.stem, c.band from public.quick_assessment_choices(v_node, v_mod) c loop
        v_kata := substring(r.stem from '^\[(\w+) ');
        if r.band is distinct from upper(v_kata) then
          v_probs := selftest.f21_note(v_probs, 'F21-D01', format('the teacher is shown the author''s «%s» as %s', v_kata, r.band));
        end if;
      end loop;
      perform selftest.as_owner();

      -- 5. the selection: a paper asking for two MUDAH and one SEDANG (launch_quick_assessment's mix for three)
      perform selftest.as_user(v_guru);
      select * into v_row from public.launch_quick_assessment(v_node, v_mod, 3, 30);
      perform selftest.as_owner();
      if (select d.difficulty_mix from public.assessment_definitions d where d.id = v_row.assessment_definition_id)
         is distinct from '{"MUDAH": 2, "SEDANG": 1}'::jsonb then
        v_probs := selftest.f21_note(v_probs, 'F21-D01', format('the launched paper asks for %s, not two MUDAH and one SEDANG',
          (select d.difficulty_mix from public.assessment_definitions d where d.id = v_row.assessment_definition_id)));
      end if;
      perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
      v_sess := public.start_learning_session(v_row.assessment_assignment_id);
      perform selftest.as_owner();
      select string_agg(substring(i.stem from '^\[(\w+ \d)'), ', ' order by substring(i.stem from '^\[(\w+ \d)'))
        into v_kata
        from public.presented_items p join public.items i on i.id = p.item_id where p.session_id = v_sess;
      if v_kata is distinct from 'Mudah 1, Mudah 2, Sedang 3' then
        v_probs := selftest.f21_note(v_probs, 'F21-D01', format('the paper asking for two Mudah and one Sedang drew: %s',
          coalesce(v_kata, 'nothing')));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f21_note(v_probs, 'F21-D01', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F21-I01  FD-7: A REVIEWED SITTING LEAVES THE WAITING LIST; NO REFUSED REFERRAL IS OFFERED
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      select i.id into v_ia from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
      select s.id, s.class_node_id into v_isess, v_node from public.assessment_sessions s
       where s.institution_id = v_ia and s.class_node_id is not null and not public.session_is_professional(s.id)
       order by s.created_at limit 1;
      -- a faculty of the school: a department sits under one
      select n.id into v_iroot from public.org_nodes n where n.institution_id = v_ia and n.kind = 'FACULTY' order by n.created_at limit 1;
      if v_ia is null or v_isess is null or v_iroot is null then
        raise exception 'the fixture lacks the alpha school, a sitting in one of its classes or a faculty';
      end if;
      select a.auth_user_id into v_imurid from public.assessment_sessions s join public.accounts a on a.person_id = s.person_id
       where s.id = v_isess;
      -- a department that does not hold the sitting's class, and its Kepala departemen
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_ia, v_iroot, 'DEPARTMENT', 'Departemen F21 ' || v_tag) returning org_nodes.id into v_idept;
      v_ikadep := 'f21-kadep-' || v_tag || '@synthetic.pintar.test';
      perform selftest.f05_actor(v_ikadep, 'HEAD_OF_DEPARTMENT', v_idept);
      -- two observations of the sitting, before any review
      insert into public.integrity_signals (session_id, institution_id, category, observed_at)
      values (v_isess, v_ia, 'NAVIGATION', now() - interval '2 minutes') returning integrity_signals.id into v_isig1;
      insert into public.integrity_signals (session_id, institution_id, category, observed_at)
      values (v_isess, v_ia, 'VISIBILITY_CHANGE', now() - interval '1 minute') returning integrity_signals.id into v_isig2;

      -- the school's admin: both wait, and both may be passed to the school
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select coalesce(jsonb_agg(jsonb_build_object('s', w.signal_id, 'r', w.may_refer)), '[]'::jsonb) into v_ilist
        from public.integrity_signals_awaiting_review() w where w.session_id = v_isess;
      perform selftest.as_owner();
      if jsonb_array_length(v_ilist) <> 2 or exists (select 1 from jsonb_array_elements(v_ilist) x where (x ->> 'r')::boolean is not true) then
        v_probs := selftest.f21_note(v_probs, 'F21-I01', format('the school admin is shown %s for the sitting''s two observations, each to be referable', v_ilist));
      end if;
      -- a Kepala departemen of another department: both wait, and no referral is offered, because the server refuses it
      perform selftest.as_user(v_ikadep);
      select coalesce(jsonb_agg(jsonb_build_object('s', w.signal_id, 'r', w.may_refer)), '[]'::jsonb) into v_ilist
        from public.integrity_signals_awaiting_review() w where w.session_id = v_isess;
      v_kata := selftest.f11_raised(format('select public.record_integrity_review(%L, %L, %L)', v_isig2, 'REFERRED_TO_INSTITUTION', 'F21-I01')) ->> 'code';
      perform selftest.as_owner();
      if jsonb_array_length(v_ilist) <> 2 or exists (select 1 from jsonb_array_elements(v_ilist) x where (x ->> 'r')::boolean is not false) then
        v_probs := selftest.f21_note(v_probs, 'F21-I01', format('another department''s Kepala departemen is shown %s, not the two observations with no referral', v_ilist));
      end if;
      if v_kata is null then
        v_probs := selftest.f21_note(v_probs, 'F21-I01', 'the server accepted the referral the list said this reviewer may not make');
      end if;
      -- the sitting's own learner sees nothing
      perform selftest.as_user_uid(v_imurid);
      select count(*) into v_n from public.integrity_signals_awaiting_review() w where w.session_id = v_isess;
      perform selftest.as_owner();
      if v_n <> 0 then
        v_probs := selftest.f21_note(v_probs, 'F21-I01', format('the sitting''s own learner is shown %s observation(s)', v_n));
      end if;

      -- the admin reviews the sitting: both observations leave, for every reviewer
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      perform public.record_integrity_review(v_isig2, 'NO_CONCERN', 'F21-I01');
      select count(*) into v_n from public.integrity_signals_awaiting_review() w where w.session_id = v_isess;
      perform selftest.as_owner();
      if v_n <> 0 then
        v_probs := selftest.f21_note(v_probs, 'F21-I01', format('after the review the sitting still shows %s observation(s) as waiting', v_n));
      end if;
      perform selftest.as_user(v_ikadep);
      select count(*) into v_n from public.integrity_signals_awaiting_review() w where w.session_id = v_isess;
      perform selftest.as_owner();
      if v_n <> 0 then
        v_probs := selftest.f21_note(v_probs, 'F21-I01', format('after the admin''s review another reviewer is still shown %s', v_n));
      end if;
      -- the signals are not rewritten by any of this (doc 16)
      if (select count(*) from public.integrity_signals where session_id = v_isess) <> 2 then
        v_probs := selftest.f21_note(v_probs, 'F21-I01', 'the review changed the observations themselves');
      end if;
      -- an observation made after the review waits again
      insert into public.integrity_signals (session_id, institution_id, category, observed_at)
      values (v_isess, v_ia, 'RECONNECT', now() + interval '1 minute') returning integrity_signals.id into v_isig3;
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select coalesce(jsonb_agg(w.signal_id), '[]'::jsonb) into v_ilist from public.integrity_signals_awaiting_review() w where w.session_id = v_isess;
      perform selftest.as_owner();
      if v_ilist is distinct from jsonb_build_array(v_isig3) then
        v_probs := selftest.f21_note(v_probs, 'F21-I01', format('an observation after the review is not the one waiting: %s', v_ilist));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f21_note(v_probs, 'F21-I01', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F21-R01  FD-9: A RULE IS SET WHILE ITS CHAPTER IS DRAFTED, MOVES WITH IT, AND IS THE RELEASED CHAPTER'S RULE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      select i.id into v_kk from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
      select a.person_id into v_rhod from public.accounts a join auth.users u on u.id = a.auth_user_id
       where u.email = 'alpha-hod@synthetic.pintar.test';
      -- the second platform admin, unless F21-D01 already made her one in this transaction
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, valid_from, valid_until)
      select v_rhod, 'SYSTEM_ADMIN', now() - interval '1 day', now() + interval '1 day'
       where not exists (select 1 from public.role_assignments ra where ra.person_id = v_rhod and ra.role = 'SYSTEM_ADMIN'
                          and ra.revoked_at is null and ra.valid_until > now());
      perform set_config('app.seed_intent', '', true);
      -- a chapter imported and still being drafted
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      v_rbatch := selftest.f11_batch(v_kk, 'STRUCTURED_PACKAGE', selftest.f12_paket('Aturan F21 ' || v_tag, 'Berapa hasil dua ditambah tiga?', 'Lima', 'Enam'));
      perform public.prepare_ingest_batch(v_rbatch);
      v_rj := public.confirm_ingest_batch(v_rbatch);
      v_rc := (v_rj -> 'courses' ->> 0)::uuid;
      -- the chapter's own Uji Penguasaan rule (made by the import), changed while the chapter is a draft: a new version
      select d.id into v_rpakai from public.assessment_definitions d
       where d.course_id = v_rc and d.mode = 'POST_TEST' and not d.is_ad_hoc order by d.version desc limit 1;
      if v_rpakai is null then raise exception 'the import made no Uji Penguasaan rule for the chapter'; end if;
      select ss.assessment_definition_id into v_rdef from public.save_assessment_definition(v_rpakai, jsonb_build_object('item_count', 5)) ss;
      perform selftest.as_owner();
      if v_rdef is not distinct from v_rpakai then
        v_probs := selftest.f21_note(v_probs, 'F21-R01', 'a change of the paper''s size was not saved as a new version (INV-29)');
      end if;
      if (select d.status::text from public.assessment_definitions d where d.id = v_rdef) is distinct from 'INGESTED' then
        v_probs := selftest.f21_note(v_probs, 'F21-R01', 'the rule saved for a chapter being drafted is not a draft');
      end if;
      -- it moves with the chapter, through approval by a second person, and the released chapter reads it
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      perform selftest.f12_advance(v_rc, 'STRUCTURED');
      perform selftest.f12_advance(v_rc, 'VALIDATED');
      perform selftest.f12_advance(v_rc, 'IN_REVIEW');
      perform selftest.as_user('alpha-hod@synthetic.pintar.test');
      perform selftest.f12_advance(v_rc, 'APPROVED');
      perform selftest.as_owner();
      if (select d.status::text from public.assessment_definitions d where d.id = v_rdef) is distinct from 'APPROVED' then
        v_probs := selftest.f21_note(v_probs, 'F21-R01', format('the rule did not move with its chapter to approval: it is %s',
          (select d.status::text from public.assessment_definitions d where d.id = v_rdef)));
      end if;
      -- a new rule, or a new version, for the chapter now that it has moved on: refused by name, nothing saved
      select count(*) into v_n from public.assessment_definitions d where d.course_id = v_rc;
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      v_rtolak := selftest.f11_raised(format('select public.save_assessment_definition(null, %L::jsonb)', jsonb_build_object(
        'institution_id', v_kk, 'course_id', v_rc, 'mode', 'POST_TEST', 'title', 'Aturan terlambat F21 ' || v_tag,
        'bank_type', 'TEST', 'item_count', 5)));
      v_rj := selftest.f11_raised(format('select public.save_assessment_definition(%L, %L::jsonb)', v_rdef, jsonb_build_object('item_count', 6)));
      perform selftest.as_owner();
      if coalesce(v_rtolak ->> 'message', '') !~ '^a rule is set while its chapter is still being drafted'
         or coalesce(v_rj ->> 'message', '') !~ '^a rule is set while its chapter is still being drafted' then
        v_probs := selftest.f21_note(v_probs, 'F21-R01', format('for an approved chapter a new rule was answered %s and a new version %s, not refused by name',
          coalesce(v_rtolak::text, 'with a save'), coalesce(v_rj::text, 'with a save')));
      end if;
      if (select count(*) from public.assessment_definitions d where d.course_id = v_rc) <> v_n then
        v_probs := selftest.f21_note(v_probs, 'F21-R01', 'a refused rule was saved anyway');
      end if;
      -- released by two people, the chapter's Uji Penguasaan is the rule set while it was drafted
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      v_rj := public.create_release(v_rc);
      v_rrel := (v_rj ->> 'release')::uuid;
      perform selftest.as_user('alpha-hod@synthetic.pintar.test');
      perform public.freeze_release(v_rrel);
      for r in select f.id from public.mcq_quality_findings f where f.course_id = v_rc and f.acknowledged_at is null loop
        perform public.acknowledge_finding('MCQ_QUALITY', r.id, 'F21-R01');
      end loop;
      for r in select f.id from public.coaching_findings f where f.course_id = v_rc and f.acknowledged_at is null loop
        perform public.acknowledge_finding('COACHING', r.id, 'F21-R01');
      end loop;
      perform selftest.as_user('sysadmin@synthetic.pintar.test');
      perform public.publish_release(v_rrel);
      perform selftest.as_owner();
      select (public.release_cycle_definition(v_rrel, 'POST_TEST')).id into v_rpakai;
      if v_rpakai is distinct from v_rdef then
        v_probs := selftest.f21_note(v_probs, 'F21-R01', format('the released chapter''s Uji Penguasaan reads %s, not the rule set while it was drafted', coalesce(v_rpakai::text, 'nothing')));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f21_note(v_probs, 'F21-R01', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    raise exception 'F21-ROLLBACK';
  exception when others then
    if sqlerrm <> 'F21-ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in
    select * from unnest(
      array['F21-D01', 'F21-I01', 'F21-R01'],
      array['FD-5, D-127 §4, D-129(c) -- the author''s difficulty is read as the author wrote it, end to end',
            'FD-7, DG-32 -- a reviewed sitting leaves the waiting list; no refused referral is offered',
            'FD-9, D-127 Q8 -- a rule is set while its chapter is drafted, moves with it, and is the released chapter''s rule'],
      array[
        'a chapter whose author marked two questions Mudah, one Sedang and two Sulit is imported with each stored as 0.3, 0.5 '
          || 'and 0.7 (no conversion on the way in); difficulty_band reads each as MUDAH, SEDANG and SULIT; the teacher''s Uji '
          || 'Cepat choices name each by its author''s word; and a paper asking for two MUDAH and one SEDANG draws the author''s '
          || 'two Mudah and the Sedang, never a Sulit',
        'two observations of one sitting wait for the school admin, each referable, and for another department''s Kepala '
          || 'departemen with no referral offered, which the server indeed refuses; the sitting''s learner sees none; once the '
          || 'admin records a review both leave for every reviewer, the observations themselves unchanged; an observation '
          || 'made after the review waits again',
        'the chapter''s Uji Penguasaan rule changed while the chapter is being drafted is a new version and a draft, moves with '
          || 'the chapter to approval, and is the released chapter''s Uji Penguasaan rule; once the chapter has moved on a new rule '
          || 'and a new version are each refused by name and nothing is saved'
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

  id := 'F21-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-21 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable21() from public;

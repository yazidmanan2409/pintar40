-- FABLE-20 database suite: the closure's batch 3 behaviour (D-118 §2, D-120, D-121).
--
-- Ordering: depends on fable01.sql (role switches), fable03.sql (answer_paper), fable04.sql (the bootstrap fixture,
-- its attempt and its certificate purge) and fable11.sql (the raised-error reader). Never applied as a migration;
-- never present in production.
--
--   F20-Q10  D-121(a)(b), Q10 Alternative 4: mastery is the school's sealed mark, binary; the descriptor is PINTAR's
--            fixed scale (Cukup ≥ 70%, Baik ≥ 80%, Sangat Baik ≥ 90%) with nothing below 70%, so a learner who passes
--            a 60% mark at 65% is certified with no descriptor. The new scoring version is the current one and a
--            published version's descriptors cannot be edited or lost by the next publication; a session started
--            under the old version keeps its descriptor (prospective only); the certificate's evidence carries the
--            mastery result, the descriptor (none) and the version; the engine version moves (D-060(b))
--   F20-F01  D-121(a), INV-29: a result is stamped with the scoring version its session was started under, even when a
--            newer version is published before the learner finishes
--   F20-N01  D-121(c), D-095(c)(g), review F5 / T4: «Belum mengerjakan Uji Penguasaan». A learner placed in the class
--            with no official Uji Penguasaan result there (never started, an enrolment still PENDING, or a sitting not
--            finished) counts in the not-yet state, never in a performance band; an assessed learner never counts as
--            not yet, a failed safety gate included; the class's sample is every learner the distribution counts
--   F20-S01  CR-02, D-078(c), D-077(d), D-076(e): a certificate is sealed at issuance. Renaming the school afterwards
--            changes neither the certificate the learner reads nor its public check; the course is the one the
--            certificate's own release teaches; the language is fixed; a seal can never be edited
--   F20-C01  CR-01, D-080(2)(9), D-120 Q1: a certificate's number is the holder's PINTAR ID and their own five-digit
--            sequence, `<PINTAR ID>/<NNNNN>`; the holder's next certificate takes the next number; the sequence is never
--            reset or reused; «Awalan nomor» is retired, and no saved template changes the number
--   F20-M01  CR-50, D-063 M1/M5, D-120 Q9: a package carries the misconception definitions its options name. Two schools
--            import the same chapter with the same code: both succeed, each owns its own row, each option names its own
--            school's row; the same school re-imports the same text: reused, one row; a different text under a held
--            code is refused by name and nothing changes; an option naming a code the package does not define is
--            refused, even when the school holds it
--   F20-M02  CR-50, D-063 M2/M3/M4: an option can name only its own school's definition, whatever the route (a direct
--            insert as another school's author is refused); definitions are append-only for a school; the three
--            readers join a definition on the option's own school
--   F20-M03  CR-50 (the closure evidence): a chapter whose every wrong option carries a defined misconception
--            publishes its review with no WEAK_MISCONCEPTION_LINKAGE finding (31 a chapter on today's content)
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb of problems, a sentinel to undo the
-- lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null or to_regprocedure('selftest.as_owner()') is null
     or to_regprocedure('selftest.boot_attempt(boolean)') is null or to_regprocedure('selftest.purge_certificates()') is null
     or to_regprocedure('selftest.answer_paper(uuid, boolean, boolean)') is null
     or to_regprocedure('selftest.f11_raised(text)') is null then
    raise exception 'apply fable01.sql, fable03.sql, fable04.sql and fable11.sql before fable20.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f20_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;

-- The refusal's code: PR040's DETAIL, else the SQLSTATE; NULL when it ran.
create or replace function selftest.f20_kode(p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v jsonb := selftest.f11_raised(p_sql);
begin
  if v is null then return null; end if;
  return case when v ->> 'code' = 'PR040' then v ->> 'detail' else v ->> 'code' end;
end $$;

-- A finished official attempt of the bootstrap learner restated at the mastery, the sealed mark and (optionally) the
-- scoring version a test names. The harness edits its own fixture with its guards off, inside the suite's
-- rolled-back transaction; the product never writes these columns after the fact.
create or replace function selftest.f20_at(p_session uuid, p_mastery numeric, p_mark numeric, p_version text default null)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  alter table public.assessment_results disable trigger assessment_results_write;
  alter table public.assessment_sessions disable trigger assessment_sessions_the_pass_mark_is_sealed;
  alter table public.assessment_sessions disable trigger assessment_sessions_provenance;
  update public.assessment_results set mastery = p_mastery where session_id = p_session;
  update public.assessment_sessions set pass_mark = p_mark, scoring_policy_version = coalesce(p_version, scoring_policy_version)
   where id = p_session;
  alter table public.assessment_results enable trigger assessment_results_write;
  alter table public.assessment_sessions enable trigger assessment_sessions_the_pass_mark_is_sealed;
  alter table public.assessment_sessions enable trigger assessment_sessions_provenance;
end $$;
-- The next free scoring version name (the registry's shape is pintar-scoring/<n>): a probe never collides with a
-- version a migration owns
create or replace function selftest.f20_next_version()
returns text language sql stable set search_path = public, pg_temp as $$
  select 'pintar-scoring/' || (coalesce(max(substring(p.version from '[0-9]+$')::int), 0) + 1) from public.scoring_policy p
$$;
revoke all on function selftest.f20_next_version() from public;

revoke all on function selftest.f20_note(jsonb, text, text), selftest.f20_kode(text),
  selftest.f20_at(uuid, numeric, numeric, text) from public;
-- read as the person a test impersonates, as f18_kode is
grant execute on function selftest.f20_kode(text) to authenticated, anon;

-- An official Uji Penguasaan for another learner of the bootstrap class, copied from the bootstrap attempt
-- (fable06's harness) and restated at a mastery and safety gate; with p_finished false the sitting is only started.
create or replace function selftest.f20_sitting(p_template uuid, p_person uuid, p_class uuid, p_mastery numeric,
                                                 p_gate boolean, p_finished boolean default true)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_s uuid; v_item uuid; v_inst uuid;
begin
  v_s := selftest.wp6_evidence_session(p_template, p_person, p_class, null, null);
  if not p_finished then return v_s; end if;
  select p.item_id, p.institution_id into v_item, v_inst from public.presented_items p
   where p.session_id = p_template order by p.position limit 1;
  perform selftest.wp6_answer(v_s, v_item, v_inst, 'A', 1::smallint);
  alter table public.assessment_results disable trigger assessment_results_write;
  update public.assessment_results set mastery = p_mastery, safety_gate_passed = p_gate where session_id = v_s;
  alter table public.assessment_results enable trigger assessment_results_write;
  return v_s;
end $$;
revoke all on function selftest.f20_sitting(uuid, uuid, uuid, numeric, boolean, boolean) from public;

-- The class's readiness distribution as the engine computes it: the boundary bound to the class, the live catalogue.
create or replace function selftest.f20_kesiapan(p_class uuid, p_inst uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v jsonb;
begin
  perform set_config('pintar.metric_boundary_node', p_class::text, true);
  v := public.calc_class_readiness_distribution(p_class, p_inst, public.current_metric_catalogue());
  perform set_config('pintar.metric_boundary_node', '', true);
  return v;
end $$;
revoke all on function selftest.f20_kesiapan(uuid, uuid) from public;

-- A one-question structured package (the shape F11-P02 imports) whose wrong option names p_code, carrying p_defs as its
-- «Miskonsepsi» sheet (D-063 M5)
create or replace function selftest.f20_paket(p_title text, p_code text, p_defs jsonb)
returns jsonb language sql immutable as $$
  select jsonb_build_object('courses', jsonb_build_array(
    jsonb_build_object('title', p_title, 'subject', 'IPA', 'stage', 'SMP', 'grade_label', 'Kelas 7',
      'modules', jsonb_build_array(jsonb_build_object('title', 'Energi', 'lessons', jsonb_build_array(
        jsonb_build_object('title', 'Energi kinetik', 'body_markdown', 'Benda yang bergerak memiliki energi kinetik.',
          'items', jsonb_build_array(jsonb_build_object('stem', 'Benda manakah yang memiliki energi kinetik?', 'use', 'POST_TEST',
            'options', jsonb_build_array(
              jsonb_build_object('label', 'A', 'body', 'Bola yang menggelinding di lantai datar', 'is_correct', true,
                                 'rationale', 'Bola itu bergerak.'),
              jsonb_strip_nulls(jsonb_build_object('label', 'B', 'body', 'Batu besar yang diam di tanah', 'is_correct', false,
                                 'rationale', 'Batu itu tidak bergerak.', 'misconception_code', p_code)))))))))))
  ) || case when p_defs is null then '{}'::jsonb else jsonb_build_object('misconceptions', p_defs) end
$$;
revoke all on function selftest.f20_paket(text, text, jsonb) from public;
grant execute on function selftest.f20_paket(text, text, jsonb) to authenticated;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable20()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; k text; v_tag text; v_sess uuid; v_bands jsonb; v_cur text; v_e record; v_c record; v_probe text;
  v_aa uuid; v_ver text; v_res text; v_inst uuid; v_class uuid; v_period uuid; v_d0 jsonb; v_d1 jsonb;
  v_p uuid[] := '{}'; v_pid uuid; v_enr uuid; i int; v_beda jsonb;
  v_cert uuid; v_tok text; v_nama_lama text; v_v record; v_d jsonb; v_pintar text; v_n1 text; v_n2 text; v_kursus text;
  v_sa uuid; v_sb uuid; v_ga uuid; v_gb uuid; v_kode text; v_defs jsonb; v_batch uuid; v_hj jsonb; v_course uuid; v_item uuid;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F20-Q10  THE DESCRIPTOR IS PINTAR'S FIXED SCALE, AND NOTHING BELOW 70%
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      v_cur := public.scoring_policy_version();
      select p.predikat_bands into v_bands from public.scoring_policy p where p.version = v_cur;
      if exists (select 1 from jsonb_array_elements(v_bands) b where (b ->> 'min')::numeric < 0.70) then
        v_probs := selftest.f20_note(v_probs, 'F20-Q10', format('the current scoring version %s still names a descriptor below 70%%: %s', v_cur, v_bands));
      end if;
      if (select jsonb_agg(jsonb_build_array((b ->> 'min')::numeric, b ->> 'predikat') order by (b ->> 'min')::numeric desc)
            from jsonb_array_elements(v_bands) b) is distinct from '[[0.90, "Sangat Baik"], [0.80, "Baik"], [0.70, "Cukup"]]'::jsonb then
        v_probs := selftest.f20_note(v_probs, 'F20-Q10', format('the current descriptors are not Sangat Baik ≥ 90%%, Baik ≥ 80%%, Cukup ≥ 70%%: %s', v_bands));
      end if;
      if public.engine_version() is distinct from 'pintar-engine/2' then
        v_probs := selftest.f20_note(v_probs, 'F20-Q10', format('the engine version is still %s although finalization changed (D-060(b))', public.engine_version()));
      end if;

      -- a published version's descriptors are part of it (INV-29): never edited in place
      begin
        update public.scoring_policy set predikat_bands = '[]'::jsonb where version = 'pintar-scoring/1';
        v_probs := selftest.f20_note(v_probs, 'F20-Q10', 'pintar-scoring/1''s descriptors could be edited in place');
        raise exception 'F20-UNDO';
      exception when others then null;
      end;

      -- and the next publication carries them forward, rather than a column default naming «Perlu Pendampingan»
      begin
        v_probe := selftest.f20_next_version();
        perform selftest.as_user('sysadmin@synthetic.pintar.test');
        perform public.publish_scoring_policy(v_probe, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
          '{}'::jsonb, 'selftest probe');
        perform selftest.as_owner();
        if (select p.predikat_bands from public.scoring_policy p where p.version = v_probe) is distinct from v_bands then
          v_probs := selftest.f20_note(v_probs, 'F20-Q10', format('a version published after %s did not carry its descriptors forward: %s',
            v_cur, (select p.predikat_bands from public.scoring_policy p where p.version = v_probe)));
        end if;
        raise exception 'F20-UNDO';
      exception when others then
        perform selftest.as_owner();
        if sqlerrm <> 'F20-UNDO' then
          v_probs := selftest.f20_note(v_probs, 'F20-Q10', 'publishing a probe version failed: ' || left(sqlerrm, 120));
        end if;
      end;

      -- end to end: an official Uji Penguasaan at a school mark of 60%
      perform selftest.purge_certificates();
      v_sess := selftest.boot_attempt(true);
      perform selftest.as_owner();
      select s.scoring_policy_version into v_ver from public.assessment_sessions s where s.id = v_sess;
      if v_ver is distinct from v_cur then
        v_probs := selftest.f20_note(v_probs, 'F20-Q10', format('a new attempt was stamped %s, not the current %s', v_ver, v_cur));
      end if;
      for r in select * from (values (0.55::numeric, false, null::text), (0.65, true, null), (0.70, true, 'Cukup'),
                                     (0.79, true, 'Cukup'), (0.80, true, 'Baik'), (0.90, true, 'Sangat Baik'), (1.00, true, 'Sangat Baik'))
                      t(m, layak, predikat) loop
        perform selftest.f20_at(v_sess, r.m, 0.60);
        select * into v_e from public.certificate_eligibility(v_sess);
        if v_e.eligible is distinct from r.layak or v_e.passed is distinct from r.layak
           or (r.layak and v_e.predikat is distinct from r.predikat) then
          v_probs := selftest.f20_note(v_probs, 'F20-Q10', format('at a 60%% mark, %s%% read eligible %s, passed %s, descriptor %s; expected %s, %s, %s',
            round(r.m * 100), v_e.eligible, v_e.passed, coalesce(v_e.predikat, 'none'), r.layak, r.layak, coalesce(r.predikat, 'none')));
        end if;
      end loop;
      -- D-121(b): the evidence of a certificate at 65% carries the mastery result, no descriptor and the version
      perform selftest.f20_at(v_sess, 0.65, 0.60);
      select * into v_c from public.certificate_prepare(v_sess, 1::smallint);
      if v_c.canonical_payload -> 'result' ->> 'passed' is distinct from 'true'
         or jsonb_typeof(v_c.canonical_payload -> 'result' -> 'predikat') is distinct from 'null'
         or (v_c.canonical_payload -> 'result' ->> 'score')::numeric is distinct from 0.65
         or v_c.canonical_payload ->> 'scoring_policy_version' is distinct from v_cur then
        v_probs := selftest.f20_note(v_probs, 'F20-Q10', 'the certificate at 65% does not carry passed, no descriptor, its score and the version: '
          || (v_c.canonical_payload -> 'result')::text || ' ' || coalesce(v_c.canonical_payload ->> 'scoring_policy_version', 'no version'));
      end if;
      if (select s.pass_mark from public.assessment_sessions s where s.id = v_sess) is distinct from 0.60 then
        v_probs := selftest.f20_note(v_probs, 'F20-Q10', 'the threshold the attempt was judged against is not kept on it');
      end if;
      -- prospective only: an attempt started under pintar-scoring/1 keeps its descriptor
      perform selftest.purge_certificates();
      v_sess := selftest.boot_attempt(true);
      perform selftest.as_owner();
      perform selftest.f20_at(v_sess, 0.65, 0.60, 'pintar-scoring/1');
      select * into v_e from public.certificate_eligibility(v_sess);
      if v_e.eligible is distinct from true or v_e.predikat is distinct from 'Perlu Pendampingan' then
        v_probs := selftest.f20_note(v_probs, 'F20-Q10', format('an attempt under pintar-scoring/1 at 65%% now reads %s / %s: the old version''s meaning changed',
          v_e.eligible, coalesce(v_e.predikat, 'none')));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f20_note(v_probs, 'F20-Q10', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F20-F01  A RESULT IS DECIDED UNDER ITS SESSION'S OWN VERSION
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.purge_certificates();
      perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
      select m.post_test_assignment into v_aa from public.my_learning_assignments() m limit 1;
      v_sess := public.start_learning_session(v_aa);
      perform selftest.answer_paper(v_sess, true);
      perform selftest.as_owner();
      select s.scoring_policy_version into v_ver from public.assessment_sessions s where s.id = v_sess;
      begin
        v_probe := selftest.f20_next_version();
        perform selftest.as_user('sysadmin@synthetic.pintar.test');
        perform public.publish_scoring_policy(v_probe, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
          '{}'::jsonb, 'selftest probe');
        perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
        perform public.finish_my_session(v_sess);
        perform selftest.as_owner();
        select r2.scoring_policy_version into v_res from public.assessment_results r2
         where r2.session_id = v_sess and r2.supersedes_result_id is null;
        if v_res is distinct from v_ver then
          v_probs := selftest.f20_note(v_probs, 'F20-F01', format('a session started under %s was finished after %s was published and its result reads %s',
            v_ver, v_probe, coalesce(v_res, 'nothing')));
        end if;
        raise exception 'F20-UNDO';
      exception when others then
        perform selftest.as_owner();
        if sqlerrm <> 'F20-UNDO' then
          v_probs := selftest.f20_note(v_probs, 'F20-F01', 'the test could not run: ' || left(sqlerrm, 160));
        end if;
      end;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f20_note(v_probs, 'F20-F01', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F20-N01  «BELUM MENGERJAKAN UJI PENGUASAAN»: THE NOT-YET STATE IS PRODUCED
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.purge_certificates();
      v_sess := selftest.boot_attempt(true);
      perform selftest.as_owner();
      select s.institution_id, s.class_node_id, s.academic_period_id into v_inst, v_class, v_period
        from public.assessment_sessions s where s.id = v_sess;
      v_d0 := selftest.f20_kesiapan(v_class, v_inst);
      -- five more learners placed in the class: two never started (one enrolment still PENDING), one with a sitting
      -- started and not finished, one assessed at 45%, one at 95% whose safety gate failed
      for i in 1..5 loop
        insert into public.persons (display_name) values ('F20 Murid ' || i || ' ' || v_tag) returning persons.id into v_pid;
        insert into public.enrollments (person_id, institution_id, academic_period_id, status)
        values (v_pid, v_inst, v_period, case when i = 2 then 'PENDING' else 'ACTIVE' end::public.enrollment_status)
        returning enrollments.id into v_enr;
        insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_enr, v_class, v_period);
        v_p := v_p || v_pid;
      end loop;
      perform selftest.f20_sitting(v_sess, v_p[3], v_class, null, null, false);
      perform selftest.f20_sitting(v_sess, v_p[4], v_class, 0.45, true);
      perform selftest.f20_sitting(v_sess, v_p[5], v_class, 0.95, false);
      v_d1 := selftest.f20_kesiapan(v_class, v_inst);
      select jsonb_object_agg(ks.kunci, coalesce((v_d1 -> 'value' ->> ks.kunci)::int, 0) - coalesce((v_d0 -> 'value' ->> ks.kunci)::int, 0))
        into v_beda
        from (select jsonb_object_keys(coalesce(v_d1 -> 'value', '{}'::jsonb)) as kunci
              union select jsonb_object_keys(coalesce(v_d0 -> 'value', '{}'::jsonb))) ks;
      if coalesce((v_beda ->> 'kesiapan.belum_post_test')::int, 0) <> 3 then
        v_probs := selftest.f20_note(v_probs, 'F20-N01', format('the three learners without an Uji Penguasaan result moved «Belum mengerjakan» by %s, not 3',
          coalesce(v_beda ->> 'kesiapan.belum_post_test', 'nothing (the state is never produced)')));
      end if;
      if coalesce((v_beda ->> 'kesiapan.butuh_pendampingan')::int, 0) <> 2
         or exists (select 1 from jsonb_each_text(v_beda) b where b.key not in ('kesiapan.belum_post_test', 'kesiapan.butuh_pendampingan')
                     and b.value::int <> 0) then
        v_probs := selftest.f20_note(v_probs, 'F20-N01', format('the 45%% learner and the 95%% learner whose gate failed did not both count in the lowest band, and only there: %s', v_beda));
      end if;
      if coalesce((v_d1 ->> 'sample')::int, 0) - coalesce((v_d0 ->> 'sample')::int, 0) <> 5 then
        v_probs := selftest.f20_note(v_probs, 'F20-N01', format('the sample grew by %s for five learners placed in the class',
          coalesce((v_d1 ->> 'sample')::int, 0) - coalesce((v_d0 ->> 'sample')::int, 0)));
      end if;
      -- the bootstrap learner, assessed at 100%, is in a band, never not-yet
      if coalesce((v_d0 -> 'value' ->> 'kesiapan.siap_sertifikasi')::int, 0) < 1 then
        v_probs := selftest.f20_note(v_probs, 'F20-N01', 'the learner assessed at 100% is not in the top band: ' || coalesce(v_d0::text, 'nothing'));
      end if;
      -- a learner who left the class is not counted there as not yet
      update public.memberships set valid_to = now(), close_reason = 'MOVED' where enrollment_id in
        (select e.id from public.enrollments e where e.person_id = v_p[1]) and node_id = v_class;
      if coalesce((selftest.f20_kesiapan(v_class, v_inst) -> 'value' ->> 'kesiapan.belum_post_test')::int, 0)
         <> coalesce((v_d1 -> 'value' ->> 'kesiapan.belum_post_test')::int, 0) - 1 then
        v_probs := selftest.f20_note(v_probs, 'F20-N01', 'a learner moved out of the class still counts there as not yet');
      end if;
    exception when others then
      perform selftest.as_owner();
      perform set_config('pintar.metric_boundary_node', '', true);
      v_probs := selftest.f20_note(v_probs, 'F20-N01', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F20-S01  THE CERTIFICATE IS SEALED AT ISSUANCE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.purge_certificates();
      v_sess := selftest.boot_attempt(true);
      perform selftest.as_owner();
      select c.certificate_id into v_cert from public.certificate_prepare(v_sess, 1::smallint) c;
      perform public.certificate_seal(v_cert, 1::smallint, repeat('a', 64));
      select c.verification_token, i.name, i.id into v_tok, v_nama_lama, v_inst
        from public.certificates c join public.institutions i on i.id = c.institution_id where c.id = v_cert;
      select co.title into v_kursus from public.certificates c join public.assessment_sessions s on s.id = c.session_id
        join public.plp_releases rl on rl.id = s.plp_release_id join public.courses co on co.id = rl.course_id where c.id = v_cert;
      if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'certificates'
                      and column_name in ('institution_as_issued', 'course_title_as_issued', 'language_as_issued')
                     having count(*) = 3) then
        v_probs := selftest.f20_note(v_probs, 'F20-S01', 'a certificate keeps no school name, course or language of its own: they are read live');
      end if;
      -- the school is renamed after the certificate was issued
      update public.institutions set name = v_nama_lama || ' (nama baru ' || v_tag || ')' where institutions.id = v_inst;
      select * into v_v from public.verify_certificate(v_tok);
      if v_v.institution is distinct from v_nama_lama then
        v_probs := selftest.f20_note(v_probs, 'F20-S01', format('after the school was renamed the public check reads «%s», not the name it was issued under', v_v.institution));
      end if;
      perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
      begin
        select to_jsonb(m) into v_d from public.my_certificate(v_sess) m;
      exception when others then v_d := null;
      end;
      perform selftest.as_owner();
      if v_d is null or v_d ->> 'institution_as_issued' is distinct from v_nama_lama
         or v_d ->> 'course_title_as_issued' is distinct from v_kursus or v_d ->> 'language_as_issued' is distinct from 'id' then
        v_probs := selftest.f20_note(v_probs, 'F20-S01', format('the learner''s certificate does not read the sealed school «%s», course «%s» and language id: %s',
          v_nama_lama, v_kursus, coalesce(v_d::text, 'nothing')));
      end if;
      -- a seal is never edited
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'certificates'
                  and column_name = 'institution_as_issued') then
        k := selftest.f20_kode(format('update public.certificates set institution_as_issued = %L where id = %L', 'Sekolah Lain', v_cert));
        if k is null then
          v_probs := selftest.f20_note(v_probs, 'F20-S01', 'a certificate''s sealed school name could be edited');
        end if;
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f20_note(v_probs, 'F20-S01', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F20-C01  THE NUMBER IS THE HOLDER'S PINTAR ID AND THEIR OWN SEQUENCE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select p.pintar_id into v_pintar from public.persons p join public.accounts a on a.person_id = p.id
        join auth.users u on u.id = a.auth_user_id where u.email = 'boot-siswa@bootstrap.pintar.test';
      -- a template saved with the old «Awalan nomor», if that can still be done, must change nothing
      if to_regprocedure('public.save_certificate_template(uuid, uuid, uuid, text, text)') is not null then
        v_probs := selftest.f20_note(v_probs, 'F20-C01', '«Awalan nomor» is still saved (save_certificate_template takes a number prefix)');
      end if;
      perform selftest.purge_certificates();
      v_sess := selftest.boot_attempt(true);
      perform selftest.as_owner();
      select c.canonical_payload ->> 'certificate_number' into v_n1 from public.certificate_prepare(v_sess, 1::smallint) c;
      if v_n1 !~ ('^' || v_pintar || '/[0-9]{5}$') then
        v_probs := selftest.f20_note(v_probs, 'F20-C01', format('the number is %s, not the holder''s PINTAR ID %s and a five-digit sequence', v_n1, v_pintar));
      end if;
      perform selftest.purge_certificates();
      v_sess := selftest.boot_attempt(true);
      perform selftest.as_owner();
      select c.canonical_payload ->> 'certificate_number' into v_n2 from public.certificate_prepare(v_sess, 1::smallint) c;
      if v_n1 ~ '/[0-9]{5}$' and v_n2 ~ '/[0-9]{5}$'
         and (substring(v_n2 from '([0-9]{5})$')::int <> substring(v_n1 from '([0-9]{5})$')::int + 1
              or regexp_replace(v_n2, '/[0-9]{5}$', '') is distinct from v_pintar) then
        v_probs := selftest.f20_note(v_probs, 'F20-C01', format('the holder''s next certificate is %s after %s, not the next number of their own', v_n2, v_n1));
      end if;
      -- the sequence is never reset or reused
      if to_regclass('public.certificate_number_counters') is null then
        v_probs := selftest.f20_note(v_probs, 'F20-C01', 'there is no per-person counter (BOB-48)');
      else
        k := selftest.f20_kode('delete from public.certificate_number_counters');
        if k is null then v_probs := selftest.f20_note(v_probs, 'F20-C01', 'a holder''s counter could be deleted, so a number could be reused'); end if;
        k := selftest.f20_kode('update public.certificate_number_counters set last_sequence = 0');
        if k is null then v_probs := selftest.f20_note(v_probs, 'F20-C01', 'a holder''s counter could be set back, so a number could be reused'); end if;
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f20_note(v_probs, 'F20-C01', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F20-M01 .. M03  CR-50: MISCONCEPTION LINKAGE (D-063 M1-M5, D-120 Q9)
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.institutions (name, slug, is_synthetic, is_active)
      values ('Sekolah F20 A ' || v_tag, 'f20a-' || v_tag, true, true) returning institutions.id into v_sa;
      insert into public.institutions (name, slug, is_synthetic, is_active)
      values ('Sekolah F20 B ' || v_tag, 'f20b-' || v_tag, true, true) returning institutions.id into v_sb;
      perform set_config('app.seed_intent', '', true);
      v_ga := selftest.f11_user('f20-guru-a-' || v_tag || '@local.invalid', 'EDUCATOR', v_sa);
      v_gb := selftest.f11_user('f20-guru-b-' || v_tag || '@local.invalid', 'EDUCATOR', v_sb);
      v_kode := 'MK-F20-' || upper(v_tag);
      v_defs := jsonb_build_array(jsonb_build_object('code', v_kode, 'label', 'Mengira benda diam punya energi gerak',
        'description', 'Peserta didik menganggap benda besar selalu memiliki energi kinetik.',
        'remediation', 'Tanyakan dulu: apakah bendanya bergerak? Energi kinetik hanya ada pada benda yang bergerak.'));

      -- M01: the same chapter into two schools, each its own row
      foreach v_pid in array array[v_ga, v_gb] loop
        perform selftest.as_user_uid(v_pid);
        v_batch := selftest.f11_batch(case when v_pid = v_ga then v_sa else v_sb end, 'STRUCTURED_PACKAGE',
                                      selftest.f20_paket('Energi ' || v_tag, v_kode, v_defs));
        v_hj := public.prepare_ingest_batch(v_batch);
        if (v_hj ->> 'ok')::boolean is true then v_hj := public.confirm_ingest_batch(v_batch); end if;
        perform selftest.as_owner();
        if (v_hj ->> 'ok')::boolean is not true then
          v_probs := selftest.f20_note(v_probs, 'F20-M01', format('school %s could not import a chapter carrying its definition: %s',
            case when v_pid = v_ga then 'A' else 'B' end, left(coalesce((v_hj -> 'problems')::text, v_hj::text), 160)));
        end if;
      end loop;
      select count(*) into i from public.misconception_taxonomy t where t.code = v_kode and t.institution_id in (v_sa, v_sb);
      if i <> 2 or (select count(distinct t.institution_id) from public.misconception_taxonomy t where t.code = v_kode
                     and t.institution_id in (v_sa, v_sb)) <> 2 then
        v_probs := selftest.f20_note(v_probs, 'F20-M01', format('the two schools hold %s row(s) for %s; each should own its own', i, v_kode));
      end if;
      if exists (select 1 from public.item_options o where o.misconception_code = v_kode and o.institution_id in (v_sa, v_sb)
                  and not exists (select 1 from public.misconception_taxonomy t where t.code = o.misconception_code
                                   and t.institution_id = o.institution_id)) then
        v_probs := selftest.f20_note(v_probs, 'F20-M01', 'an option names a definition its own school does not hold');
      end if;
      -- T3: the same school, the same text again: reused
      perform selftest.as_user_uid(v_ga);
      v_batch := selftest.f11_batch(v_sa, 'STRUCTURED_PACKAGE', selftest.f20_paket('Energi lagi ' || v_tag, v_kode, v_defs));
      v_hj := public.prepare_ingest_batch(v_batch);
      if (v_hj ->> 'ok')::boolean is true then v_hj := public.confirm_ingest_batch(v_batch); end if;
      perform selftest.as_owner();
      if (v_hj ->> 'ok')::boolean is not true
         or (select count(*) from public.misconception_taxonomy t where t.code = v_kode and t.institution_id = v_sa) <> 1 then
        v_probs := selftest.f20_note(v_probs, 'F20-M01', 'the same school re-importing the same definition was not reused as one row: '
          || left(coalesce((v_hj -> 'problems')::text, ''), 120));
      end if;
      -- T4: a different text under a held code: refused by name, nothing changed
      perform selftest.as_user_uid(v_ga);
      v_batch := selftest.f11_batch(v_sa, 'STRUCTURED_PACKAGE', selftest.f20_paket('Energi beda ' || v_tag, v_kode,
        jsonb_build_array(jsonb_build_object('code', v_kode, 'label', 'Teks lain', 'description', 'Penjelasan lain.', 'remediation', 'Cara lain.'))));
      v_hj := public.prepare_ingest_batch(v_batch);
      perform selftest.as_owner();
      if (v_hj ->> 'ok')::boolean is not false
         or not exists (select 1 from jsonb_array_elements(v_hj -> 'problems') x where x ->> 'code' = 'MISCONCEPTION_DEFINITION_DIFFERS')
         or (select t.label from public.misconception_taxonomy t where t.code = v_kode and t.institution_id = v_sa) is distinct from 'Mengira benda diam punya energi gerak' then
        v_probs := selftest.f20_note(v_probs, 'F20-M01', 'a different text under a code the school holds was not refused MISCONCEPTION_DEFINITION_DIFFERS: '
          || left(v_hj::text, 140));
      end if;
      -- T5: an option naming a code the package does not define: refused, though school A holds it
      perform selftest.as_user_uid(v_ga);
      v_batch := selftest.f11_batch(v_sa, 'STRUCTURED_PACKAGE', selftest.f20_paket('Energi tanpa definisi ' || v_tag, v_kode, null));
      v_hj := public.prepare_ingest_batch(v_batch);
      perform selftest.as_owner();
      if (v_hj ->> 'ok')::boolean is not false
         or not exists (select 1 from jsonb_array_elements(v_hj -> 'problems') x where x ->> 'code' = 'OPTION_MISCONCEPTION_UNKNOWN') then
        v_probs := selftest.f20_note(v_probs, 'F20-M01', 'an option naming a code its package does not define was accepted: ' || left(v_hj::text, 140));
      end if;

    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f20_note(v_probs, 'F20-M01', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    begin
      if v_sa is null or v_sb is null then raise exception 'F20-M01 did not set the two schools up'; end if;
      -- M02 T2: a direct insert by school B's author naming a definition only school A holds
      insert into public.misconception_taxonomy (code, institution_id, label, description, remediation)
      values (v_kode || '-A', v_sa, 'Hanya milik A', 'Penjelasan milik A.', 'Cara milik A.');
      select o.item_id into v_item from public.item_options o where o.institution_id = v_sb and o.misconception_code = v_kode limit 1;
      if v_item is null then
        select i2.id into v_item from public.items i2 where i2.institution_id = v_sb limit 1;
      end if;
      if v_item is null then
        v_probs := selftest.f20_note(v_probs, 'F20-M02', 'school B holds no question to test the link with');
      else
        k := selftest.f20_kode(format('insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, misconception_code) '
          || 'values (%L, %L, %L, %L, false, %L, %L)', v_item, v_sb, 'Z', 'Pilihan uji', 'Alasan uji', v_kode || '-A'));
        if k is null then
          v_probs := selftest.f20_note(v_probs, 'F20-M02', 'an option of school B was linked to a definition only school A holds');
        end if;
      end if;
      -- M4: append-only for the school's own author
      perform selftest.as_user_uid(v_ga);
      k := selftest.f20_kode(format('update public.misconception_taxonomy set label = %L where code = %L and institution_id = %L',
                                    'Diubah', v_kode, v_sa));
      perform selftest.as_owner();
      if k is null and (select t.label from public.misconception_taxonomy t where t.code = v_kode and t.institution_id = v_sa) = 'Diubah' then
        v_probs := selftest.f20_note(v_probs, 'F20-M02', 'a school''s author could edit a definition in place (it is append-only)');
      end if;
      -- M3: the three readers join on the option's own school
      if pg_get_functiondef('public.session_misconceptions(uuid)'::regprocedure) !~ 'mt\.institution_id = o\.institution_id'
         or pg_get_functiondef('public.reading_map(uuid)'::regprocedure) !~ 'mt\.institution_id = o2\.institution_id'
         or pg_get_viewdef('public.service_cohort_misconceptions'::regclass) !~ 'mt\.institution_id = o\.institution_id' then
        v_probs := selftest.f20_note(v_probs, 'F20-M02', 'a misconception reader still joins a definition on its code alone');
      end if;

    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f20_note(v_probs, 'F20-M02', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    begin
      -- M03: a chapter whose wrong options are all coded publishes its review with no weak-linkage finding. Never vacuous:
      -- the chapter reviewed must hold a coded wrong option
      select c.id into v_course from public.courses c
       where c.institution_id = v_sa
         and exists (select 1 from public.item_options o join public.items i2 on i2.id = o.item_id
                       join public.lessons l on l.id = i2.lesson_id join public.modules m on m.id = l.module_id
                      where m.course_id = c.id and o.misconception_code is not null)
       order by c.created_at limit 1;
      if v_course is null then
        v_probs := selftest.f20_note(v_probs, 'F20-M03', 'no imported chapter with a coded wrong option to review');
      else
        perform selftest.as_user_uid(v_ga);
        perform public.run_mcq_quality(v_course);
        perform selftest.as_owner();
        select count(*) into i from public.mcq_quality_findings f where f.course_id = v_course and f.pattern_class = 'WEAK_MISCONCEPTION_LINKAGE';
        if i <> 0 then
          v_probs := selftest.f20_note(v_probs, 'F20-M03', format('a chapter whose every wrong option is coded still shows %s WEAK_MISCONCEPTION_LINKAGE finding(s)', i));
        end if;
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f20_note(v_probs, 'F20-M03', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    raise exception 'F20-ROLLBACK';
  exception when others then
    if sqlerrm <> 'F20-ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in
    select * from unnest(
      array['F20-Q10', 'F20-F01', 'F20-N01', 'F20-S01', 'F20-C01', 'F20-M01', 'F20-M02', 'F20-M03'],
      array['D-121(a)(b), Q10 Alternative 4 -- mastery is the school''s mark; the descriptor is PINTAR''s fixed scale, none below 70%',
            'D-121(a), INV-29 -- a result is decided under its session''s own scoring version',
            'D-121(c), D-095(c)(g) -- «Belum mengerjakan Uji Penguasaan» is produced and stays apart from the bands',
            'CR-02, D-078(c), D-077(d) -- a certificate is sealed at issuance: school, course, language',
            'CR-01, D-080(2)(9) -- the number is the holder''s PINTAR ID and their own sequence',
            'CR-50, D-063 M1/M5, D-120 Q9 -- a package carries its definitions; each school owns its own',
            'CR-50, D-063 M2/M3/M4 -- an option names only its own school''s definition; append-only; readers per school',
            'CR-50 -- a coded chapter has no weak-linkage finding'],
      array[
        'the current scoring version names Sangat Baik ≥ 90%, Baik ≥ 80% and Cukup ≥ 70% and nothing below; the engine version is '
          || 'pintar-engine/2; a published version''s descriptors cannot be edited in place and the next publication carries them '
          || 'forward; an official Uji Penguasaan at a 60% mark is not eligible at 55%, eligible with no descriptor at 65%, '
          || 'Cukup at 70% and 79%, Baik at 80%, Sangat Baik at 90% and 100%; the certificate at 65% carries passed, no descriptor, '
          || 'its score and the version, and the attempt keeps the 60% it was judged against; an attempt started under '
          || 'pintar-scoring/1 at 65% still reads «Perlu Pendampingan» (prospective only)',
        'a Uji Penguasaan started under one version, with a newer version published before the learner finishes, is stamped with '
          || 'the version it was started under',
        'five learners placed in the official class: the two never started (one enrolment PENDING) and the one whose sitting is '
          || 'unfinished add 3 to «Belum mengerjakan Uji Penguasaan»; the one assessed at 45% and the one at 95% whose safety '
          || 'gate failed add 2 to the lowest band and nothing elsewhere; the sample grows by 5; the learner assessed at 100% is '
          || 'in the top band; a learner moved out of the class no longer counts there',
        'a certificate issued and sealed, then the school renamed: the public check and the learner''s certificate still read the '
          || 'school''s name as issued, the course the certificate''s release teaches and the language id; the sealed school name '
          || 'cannot be edited',
        'the holder''s certificate is numbered <PINTAR ID>/<five digits>, their next certificate the next number of their own; the '
          || 'per-person counter can be neither deleted nor set back; «Awalan nomor» can no longer be saved',
        'two schools import the same chapter carrying its «Miskonsepsi» definition: both succeed, each owns its own row under the '
          || 'code and each option names its own school''s row; the same school re-imports the same text and it is reused (one row); '
          || 'a different text under the held code is refused MISCONCEPTION_DEFINITION_DIFFERS and nothing changes; an option naming '
          || 'a code its package does not define is refused OPTION_MISCONCEPTION_UNKNOWN although the school holds it',
        'school B''s author cannot insert an option naming a definition only school A holds (the composite key refuses it); a school''s '
          || 'author cannot edit a definition in place; session_misconceptions, reading_map and service_cohort_misconceptions join a '
          || 'definition on the option''s own school',
        'a chapter whose every wrong option carries a defined misconception is reviewed by run_mcq_quality with no '
          || 'WEAK_MISCONCEPTION_LINKAGE finding'
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

  id := 'F20-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-20 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable20() from public;

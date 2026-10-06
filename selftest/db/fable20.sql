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

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable20()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; k text; v_tag text; v_sess uuid; v_bands jsonb; v_cur text; v_e record; v_c record; v_probe text;
  v_aa uuid; v_ver text; v_res text; v_inst uuid; v_class uuid; v_period uuid; v_d0 jsonb; v_d1 jsonb;
  v_p uuid[] := '{}'; v_pid uuid; v_enr uuid; i int; v_beda jsonb;
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

    raise exception 'F20-ROLLBACK';
  exception when others then
    if sqlerrm <> 'F20-ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in
    select * from unnest(
      array['F20-Q10', 'F20-F01', 'F20-N01'],
      array['D-121(a)(b), Q10 Alternative 4 -- mastery is the school''s mark; the descriptor is PINTAR''s fixed scale, none below 70%',
            'D-121(a), INV-29 -- a result is decided under its session''s own scoring version',
            'D-121(c), D-095(c)(g) -- «Belum mengerjakan Uji Penguasaan» is produced and stays apart from the bands'],
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
          || 'in the top band; a learner moved out of the class no longer counts there'
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

-- FABLE-39 · D2-R (ruling 89; D2-CERTIFICATE-CONDITIONS-SPEC.md §6 and rev. 4, §7): A CERTIFYING SITTING OFFERS NO HELP AND
-- ITS RESULT DISCLOSES COUNTS ONLY; THE PUBLIC READ DROPS THE BAND; THE ATTEMPT ORDINAL IS FIXED AT THE START.
--
-- Build map: docs/completion-4.1/d2r/D2R-BUILD-MAP.md §4 (the ids below are its case ids).
--
-- One world, built on the bootstrap tenant inside one block that is always rolled back (F39_UNDO):
--   * a Pemetaan Awal (PRE_TEST): an Uji Cepat the bootstrap teacher launches, given the PRE_TEST mode before the learner
--     starts it (the bootstrap world has no cycle pre-test), sat with every answer wrong (the PRE_TEST pins);
--   * her Uji Penguasaan (POST_TEST), opened (R-d), then answered all right and finished (R-h; its certificate, R-c);
--   * an Asesmen Mandiri (STANDALONE): an Uji Cepat the bootstrap teacher launches, given the STANDALONE mode before the
--     learner starts it, so that its sitting is started by the ordinary start path; extended by the admin (R-e), answered
--     all wrong and finished (R-h);
--   * an Uji Cepat (QUICK), opened (the QUICK pin), answered all wrong and finished (its review keeps explanations).
-- Every assistance probe runs as the learner, through open_assistance itself (a direct call, as a client would make it),
-- on a question whose hesitation window has passed (selftest.age_item_view).
--
--   D2R-D01  POST_TEST refuses levels 1, 2 and 3 by a direct call; its policy row allows no assistance
--   D2R-D02  STANDALONE, the same
--   D2R-D03  POST_TEST: assistance_state offers nothing (no window, never due) and session_state gives the player no window
--   D2R-D04  STANDALONE, the same
--   D2R-D06  PINS: Pemetaan Awal and Uji Cepat still serve all three levels; PRACTICE and PUBLIC_DEMO keep their policy
--   D2R-D07  an open sitting keeps the policy captured at its start, whatever the policy row says later
--   D2R-D08  the lint: certifies ⇒ not allows_assistance, and it names the mode that breaks it
--   D2R-D09  TEST, EXAM and PAPER still refuse (pin)
--   D2R-H01  POST_TEST: session_review refuses a direct call
--   D2R-H02  STANDALONE, the same
--   D2R-H03  POST_TEST: reading_map gives no reasons and no strength verdict; every line is revisit-advice
--   D2R-H04  STANDALONE, the same, on a sitting with sections below the mark
--   D2R-H05  both: session_outcome carries the counts and the decision, and no per-objective mastery
--   D2R-H07  both: hasil_koreksi_saya carries no correction reason
--   D2R-H12  PINS: Pemetaan Awal's reading map keeps its levels and reasons; the Uji Cepat's review keeps its explanations
--   D2R-H14  the disclosure follows the sitting's captured policy, not a later edit of the policy row
--   D2R-H16  session_answers returns no correctness, key or explanation (by its result type, so a new column is caught)
--   D2R-C01  verify_certificate returns no band for a banded certificate, its OUT columns unchanged
--   D2R-C04  the band stays in certificate_eligibility and the sealed payload; assert_public_surface() still passes
--   D2R-E01  extra time is recorded on the sitting and its audit, shown to staff, and on no public surface or payload
--   D2R-F01  the attempt ordinal is set at the start, equals the lineage count then, and is on no public surface

create schema if not exists selftest;

create or replace function selftest.f39_note(p jsonb, k text, m text) returns jsonb
language sql immutable as $$ select jsonb_set(p, array[k], coalesce(p -> k, '[]'::jsonb) || to_jsonb(m)) $$;
revoke all on function selftest.f39_note(jsonb, text, text) from public;
grant execute on function selftest.f39_note(jsonb, text, text) to authenticated;

-- The highest level a direct open_assistance call serves on this question, as the current user (0: none). The window is
-- passed first: the view is recorded (assistance_state), then aged past any window this fixture sets.
create or replace function selftest.f39_layan(p_pi uuid) returns integer
language plpgsql set search_path = public, pg_temp as $$
declare n integer := 0; l integer;
begin
  begin perform public.assistance_state(p_pi); exception when others then null; end;
  perform selftest.age_item_view(p_pi, 3600);
  for l in 1..3 loop
    begin
      perform public.open_assistance(p_pi, l::smallint);
      n := l;
    exception when others then exit;
    end;
  end loop;
  return n;
end $$;
revoke all on function selftest.f39_layan(uuid) from public;
grant execute on function selftest.f39_layan(uuid) to authenticated;

-- The names a learner-facing result must never carry (H16, and the TypeScript guard's list).
create or replace function selftest.f39_terlarang(p_result text) returns text
language sql immutable as $$
  select string_agg(k, ', ' order by k) from unnest(array['benar', 'alasan', 'arah', 'kunci', 'is_correct', 'rationale']) k
   where p_result ~* ('(^|[^a-z_])' || k || '([^a-z_]|$)')
$$;
revoke all on function selftest.f39_terlarang(text) from public;
grant execute on function selftest.f39_terlarang(text) to authenticated;

-- An Uji Cepat the bootstrap teacher launches in the first class; with p_mode, its definition is given that mode before
-- anyone starts it. Returns the assessment assignment.
create or replace function selftest.f39_luncur(p_mode text default null) returns uuid
language plpgsql set search_path = public, pg_temp as $$
declare f record; v_kelas uuid; q record;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select n.id into v_kelas from public.org_nodes n where n.institution_id = f.inst and n.kind = 'CLASS' order by n.created_at, n.id limit 1;
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  select * into q from public.launch_quick_assessment(v_kelas, f.modul, 3, 20);
  perform selftest.as_owner();
  if p_mode is not null then
    update public.assessment_definitions set mode = p_mode::public.assessment_mode where id = q.assessment_definition_id;
  end if;
  return q.assessment_assignment_id;
end $$;
revoke all on function selftest.f39_luncur(text) from public;
grant execute on function selftest.f39_luncur(text) to authenticated;

create or replace function selftest.f39_pertama(p_session uuid) returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id from public.presented_items p where p.session_id = p_session order by p.position limit 1
$$;
revoke all on function selftest.f39_pertama(uuid) from public;
grant execute on function selftest.f39_pertama(uuid) to authenticated;

create or replace function selftest.run_fable39()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $f39$
declare
  SISWA constant text := 'boot-siswa@bootstrap.pintar.test';
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  v_pre_aa uuid; v_post_aa uuid; v_sa_aa uuid; v_q_aa uuid; v_o_aa uuid;
  v_pre uuid; v_post uuid; v_sa uuid; v_q uuid; v_o uuid;
  n integer; v_n2 integer; v_ok boolean; v_detail text; v_j jsonb; v_t text; v_cert uuid; v_tok text; v_payload jsonb;
  v_st record; v_ss record; v_v record; v_e record; v_mode text;
  k text;
begin
  begin
    perform selftest.as_owner();
    perform selftest.purge_certificates();

    -- ═════════════════════════════════════════════════ the policy rows (D01, D02, D06, D09)
    for v_mode, v_ok in values ('POST_TEST', false), ('STANDALONE', false), ('TEST', false), ('EXAM', false), ('PAPER', false),
                               ('PRE_TEST', true), ('PRACTICE', true), ('QUICK', true), ('PUBLIC_DEMO', true) loop
      if (select m.allows_assistance from public.mode_policy m where m.mode::text = v_mode) is distinct from v_ok then
        v_probs := selftest.f39_note(v_probs,
          case when v_mode in ('POST_TEST') then 'D2R-D01' when v_mode = 'STANDALONE' then 'D2R-D02'
               when v_mode in ('TEST', 'EXAM', 'PAPER') then 'D2R-D09' else 'D2R-D06' end,
          format('mode_policy.allows_assistance for %s is %s, expected %s', v_mode,
                 (select m.allows_assistance from public.mode_policy m where m.mode::text = v_mode), v_ok));
      end if;
    end loop;
    for v_mode in select unnest(array['PRE_TEST', 'PRACTICE', 'QUICK', 'PUBLIC_DEMO']) loop
      if (select m.certifies from public.mode_policy m where m.mode::text = v_mode) then
        v_probs := selftest.f39_note(v_probs, 'D2R-D06', v_mode || ' certifies');
      end if;
    end loop;

    -- ═════════════════════════════════════════════════ the lint (D08)
    select a.ok, a.detail into v_ok, v_detail from public.assert_mode_policy_complete() a;
    if not v_ok then v_probs := selftest.f39_note(v_probs, 'D2R-D08', 'the mode policy lint fails: ' || v_detail); end if;
    begin
      update public.mode_policy set allows_assistance = true where mode = 'POST_TEST';
      select a.ok, a.detail into v_ok, v_detail from public.assert_mode_policy_complete() a;
      if v_ok or v_detail !~ 'certifying mode\(s\) allowing assistance: [^;]*POST_TEST' then
        v_probs := selftest.f39_note(v_probs, 'D2R-D08', 'with POST_TEST allowing assistance the lint did not name it: ' || coalesce(v_detail, ''));
      end if;
      raise exception 'F39_LINT_UNDO';
    exception when others then
      if sqlerrm <> 'F39_LINT_UNDO' then v_probs := selftest.f39_note(v_probs, 'D2R-D08', 'the lint probe failed: ' || left(sqlerrm, 160)); end if;
    end;

    -- ═════════════════════════════════════════════════ Pemetaan Awal: help served (D06), then all wrong (H12)
    v_pre_aa := selftest.f39_luncur('PRE_TEST');
    perform selftest.as_user(SISWA);
    v_pre := public.start_learning_session(v_pre_aa);
    select s.mode::text into v_t from public.assessment_sessions s where s.id = v_pre;
    if v_t is distinct from 'PRE_TEST' then raise exception 'the Pemetaan Awal started as %, not PRE_TEST', v_t; end if;
    n := selftest.f39_layan(selftest.f39_pertama(v_pre));
    if n <> 3 then v_probs := selftest.f39_note(v_probs, 'D2R-D06', format('Pemetaan Awal served %s of 3 assistance levels', n)); end if;
    perform selftest.answer_paper(v_pre, false);
    perform public.finish_my_session(v_pre);

    -- ═════════════════════════════════════════════════ Uji Penguasaan, open: no help (D01, D03)
    select m.post_test_assignment into v_post_aa from public.my_learning_assignments() m limit 1;
    if v_post_aa is null then raise exception 'the bootstrap learner has no Uji Penguasaan'; end if;
    perform selftest.pre_finished_for(v_post_aa);
    v_post := public.start_learning_session(v_post_aa);
    n := selftest.f39_layan(selftest.f39_pertama(v_post));
    if n <> 0 then v_probs := selftest.f39_note(v_probs, 'D2R-D01', format('a direct open_assistance on an Uji Penguasaan served level %s', n)); end if;
    select * into v_st from public.assistance_state(selftest.f39_pertama(v_post));
    if v_st.window_seconds is not null or v_st.due then
      v_probs := selftest.f39_note(v_probs, 'D2R-D03', format('assistance_state on an Uji Penguasaan gives a window of %s seconds, due %s', v_st.window_seconds, v_st.due));
    end if;
    select * into v_ss from public.session_state(v_post);
    if v_ss.hesitation_window_seconds is not null then
      v_probs := selftest.f39_note(v_probs, 'D2R-D03', format('session_state gives the player a %s-second window on an Uji Penguasaan', v_ss.hesitation_window_seconds));
    end if;
    -- F01: the ordinal, set at the start
    perform selftest.as_owner();
    begin
      select (to_jsonb(s) ->> 'percobaan_ke')::integer into n from public.assessment_sessions s where s.id = v_post;
      if n is distinct from 1 then v_probs := selftest.f39_note(v_probs, 'D2R-F01', format('the first Uji Penguasaan carries percobaan_ke %s, expected 1', n)); end if;
    exception when others then v_probs := selftest.f39_note(v_probs, 'D2R-F01', 'percobaan_ke could not be read: ' || left(sqlerrm, 120));
    end;
    perform selftest.as_user(SISWA);
    perform selftest.answer_paper(v_post, true);
    perform public.finish_my_session(v_post);

    -- ═════════════════════════════════════════════════ Asesmen Mandiri, open: no help (D02, D04), extended (E01)
    v_sa_aa := selftest.f39_luncur('STANDALONE');
    perform selftest.as_user(SISWA);
    v_sa := public.start_learning_session(v_sa_aa);
    select s.mode::text into v_t from public.assessment_sessions s where s.id = v_sa;
    if v_t is distinct from 'STANDALONE' then raise exception 'the Asesmen Mandiri started as %, not STANDALONE', v_t; end if;
    n := selftest.f39_layan(selftest.f39_pertama(v_sa));
    if n <> 0 then v_probs := selftest.f39_note(v_probs, 'D2R-D02', format('a direct open_assistance on an Asesmen Mandiri served level %s', n)); end if;
    select * into v_st from public.assistance_state(selftest.f39_pertama(v_sa));
    if v_st.window_seconds is not null or v_st.due then
      v_probs := selftest.f39_note(v_probs, 'D2R-D04', format('assistance_state on an Asesmen Mandiri gives a window of %s seconds, due %s', v_st.window_seconds, v_st.due));
    end if;
    select * into v_ss from public.session_state(v_sa);
    if v_ss.hesitation_window_seconds is not null then
      v_probs := selftest.f39_note(v_probs, 'D2R-D04', format('session_state gives the player a %s-second window on an Asesmen Mandiri', v_ss.hesitation_window_seconds));
    end if;
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    perform public.extend_session_deadline(v_sa, 10, 'F39 extra time');
    perform selftest.as_user(SISWA);
    perform selftest.answer_paper(v_sa, false);
    perform public.finish_my_session(v_sa);

    -- ═════════════════════════════════════════════════ Uji Cepat: help served (D06), all wrong
    v_q_aa := selftest.f39_luncur(null);
    perform selftest.as_user(SISWA);
    v_q := public.start_learning_session(v_q_aa);
    n := selftest.f39_layan(selftest.f39_pertama(v_q));
    if n <> 3 then v_probs := selftest.f39_note(v_probs, 'D2R-D06', format('an Uji Cepat served %s of 3 assistance levels', n)); end if;
    perform selftest.answer_paper(v_q, false);
    perform public.finish_my_session(v_q);

    -- ═════════════════════════════════════════════════ R-h, both certifying modes, by direct calls as the learner
    for v_t, k in values ('D2R-H01', v_post::text), ('D2R-H02', v_sa::text) loop
      begin
        select count(*) into n from public.session_review(k::uuid);
        v_probs := selftest.f39_note(v_probs, v_t, format('session_review answered a certifying sitting with %s per-question row(s)', n));
      exception when others then
        if sqlerrm !~ 'counts only' then v_probs := selftest.f39_note(v_probs, v_t, 'session_review refused, but not as a certifying result: ' || left(sqlerrm, 120)); end if;
      end;
    end loop;
    for v_t, k in values ('D2R-H03', v_post::text), ('D2R-H04', v_sa::text) loop
      select count(*) filter (where r.alasan is not null) into n from public.reading_map(k::uuid) r;
      if n > 0 then v_probs := selftest.f39_note(v_probs, v_t, format('reading_map gives %s reason(s) on a certifying sitting', n)); end if;
    end loop;
    -- the levels, apart: a KUAT (or any level other than revisit-advice) is a verdict on mastery (74b)
    select string_agg(distinct r.tingkat, ', ') into v_detail from public.reading_map(v_post) r where r.tingkat is distinct from 'BACA_LAGI';
    if v_detail is not null then v_probs := selftest.f39_note(v_probs, 'D2R-H03', 'reading_map gives level(s) ' || v_detail || ' on a certifying sitting'); end if;
    select string_agg(distinct r.tingkat, ', '), count(*) into v_detail, n from public.reading_map(v_sa) r;
    if v_detail is distinct from 'BACA_LAGI' or n = 0 then
      v_probs := selftest.f39_note(v_probs, 'D2R-H04', format('an all-wrong Asesmen Mandiri has %s reading-map line(s) at level(s) %s, expected only BACA_LAGI', n, coalesce(v_detail, 'none')));
    end if;
    for v_t, k, v_ok in values ('post', v_post::text, true), ('sa', v_sa::text, false) loop
      v_j := public.session_outcome(k::uuid);
      if v_j ? 'per_domain' then v_probs := selftest.f39_note(v_probs, 'D2R-H05', v_t || ': session_outcome carries per_domain (a mastery figure per objective)'); end if;
      if (v_j ->> 'lulus') is distinct from v_ok::text then v_probs := selftest.f39_note(v_probs, 'D2R-H05', format('%s: lulus is %s, expected %s', v_t, v_j ->> 'lulus', v_ok)); end if;
      select count(*) into n from public.presented_items p where p.session_id = k::uuid;
      if (v_j -> 'ringkasan' ->> 'item_total')::integer is distinct from n
         or (v_j -> 'ringkasan' ->> 'correct')::integer is distinct from (case when v_ok then n else 0 end) then
        v_probs := selftest.f39_note(v_probs, 'D2R-H05', format('%s: the counts read %s of %s, expected %s of %s', v_t,
          v_j -> 'ringkasan' ->> 'correct', v_j -> 'ringkasan' ->> 'item_total', case when v_ok then n else 0 end, n));
      end if;
      if v_ok = false and jsonb_typeof(v_j -> 'baca_lagi') is distinct from 'array' then
        v_probs := selftest.f39_note(v_probs, 'D2R-H05', v_t || ': no revisit list (baca_lagi) on a result below the mark');
      end if;
      v_j := public.hasil_koreksi_saya(k::uuid);
      if v_j ? 'alasan' then v_probs := selftest.f39_note(v_probs, 'D2R-H07', v_t || ': hasil_koreksi_saya carries a correction reason (alasan)'); end if;
    end loop;

    -- ═════════════════════════════════════════════════ the pins (H12)
    select count(*) filter (where r.alasan is not null and r.alasan <> r.pernyataan), string_agg(distinct r.tingkat, ', ')
      into n, v_detail from public.reading_map(v_pre) r;
    if n = 0 or v_detail = 'BACA_LAGI' then
      v_probs := selftest.f39_note(v_probs, 'D2R-H12', format('Pemetaan Awal''s reading map lost its reasons or levels (%s reason(s), levels %s)', n, coalesce(v_detail, 'none')));
    end if;
    begin
      select count(*), count(r.alasan) into n, v_n2 from public.session_review(v_q) r;
      if n = 0 or v_n2 = 0 then v_probs := selftest.f39_note(v_probs, 'D2R-H12', format('the Uji Cepat''s review has %s row(s), %s explained', n, v_n2)); end if;
    exception when others then v_probs := selftest.f39_note(v_probs, 'D2R-H12', 'the Uji Cepat''s review refused: ' || left(sqlerrm, 120));
    end;

    -- ═════════════════════════════════════════════════ H16: session_answers' result carries nothing it must not
    v_detail := selftest.f39_terlarang(pg_get_function_result('public.session_answers(uuid)'::regprocedure));
    if v_detail is not null then v_probs := selftest.f39_note(v_probs, 'D2R-H16', 'session_answers returns ' || v_detail); end if;
    select count(*) into n from public.session_answers(v_post);
    if n = 0 then v_probs := selftest.f39_note(v_probs, 'D2R-H16', 'session_answers returned none of the learner''s own answers'); end if;

    -- ═════════════════════════════════════════════════ H14 and D07: the captured policy decides, not the row
    perform selftest.as_owner();
    begin
      update public.mode_policy set certifies = false where mode = 'POST_TEST';
      perform selftest.as_user(SISWA);
      begin
        select count(*) into n from public.session_review(v_post);
        v_probs := selftest.f39_note(v_probs, 'D2R-H14', format('with the policy row edited after the sitting, session_review answered it with %s row(s)', n));
      exception when others then null;
      end;
      perform selftest.as_owner();
      raise exception 'F39_H14_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'F39_H14_UNDO' then v_probs := selftest.f39_note(v_probs, 'D2R-H14', 'the probe failed: ' || left(sqlerrm, 160)); end if;
    end;
    begin
      -- a sitting started while its mode still allowed help, the policy then changed: it keeps what it started with
      update public.mode_policy set allows_assistance = true where mode = 'STANDALONE';
      v_o_aa := selftest.f39_luncur('STANDALONE');
      perform selftest.as_user(SISWA);
      v_o := public.start_learning_session(v_o_aa);
      perform selftest.as_owner();
      update public.mode_policy set allows_assistance = false where mode = 'STANDALONE';
      perform selftest.as_user(SISWA);
      n := selftest.f39_layan(selftest.f39_pertama(v_o));
      if n <> 3 then v_probs := selftest.f39_note(v_probs, 'D2R-D07', format('an open sitting started while help was allowed served %s of 3 levels after the policy changed', n)); end if;
      perform selftest.as_owner();
      raise exception 'F39_D07_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'F39_D07_UNDO' then v_probs := selftest.f39_note(v_probs, 'D2R-D07', 'the probe failed: ' || left(sqlerrm, 160)); end if;
    end;

    -- ═════════════════════════════════════════════════ R-c: the certificate (C01, C04)
    perform selftest.as_owner();
    select c.certificate_id into v_cert from public.certificate_prepare(v_post, 1::smallint) c;
    perform public.certificate_seal(v_cert, 1::smallint, repeat('a', 64));
    select c.verification_token, c.canonical_payload into v_tok, v_payload from public.certificates c where c.id = v_cert;
    if (v_payload -> 'result' ->> 'predikat') is null then
      v_probs := selftest.f39_note(v_probs, 'D2R-C04', 'the sealed payload of an all-right Uji Penguasaan carries no band (the fixture is not banded)');
    end if;
    select * into v_e from public.certificate_eligibility(v_post);
    if (to_jsonb(v_e) ->> 'predikat') is null then v_probs := selftest.f39_note(v_probs, 'D2R-C04', 'certificate_eligibility no longer gives the band'); end if;
    select * into v_v from public.verify_certificate(v_tok);
    if v_v.validity is distinct from 'BERLAKU' then v_probs := selftest.f39_note(v_probs, 'D2R-C01', 'the issued certificate did not verify'); end if;
    if v_v.predikat is not null then v_probs := selftest.f39_note(v_probs, 'D2R-C01', 'verify_certificate gives the band «' || v_v.predikat || '» publicly'); end if;
    if pg_get_function_result('public.verify_certificate(text)'::regprocedure)
       <> 'TABLE(pass boolean, predikat text, institution text, date text, validity text)' then
      v_probs := selftest.f39_note(v_probs, 'D2R-C01', 'verify_certificate''s OUT columns changed: ' || pg_get_function_result('public.verify_certificate(text)'::regprocedure));
    end if;
    select a.ok, a.detail into v_ok, v_detail from public.assert_public_surface() a;
    if not v_ok then v_probs := selftest.f39_note(v_probs, 'D2R-C04', 'assert_public_surface fails: ' || v_detail); end if;

    -- ═════════════════════════════════════════════════ R-e and R-f: recorded, staff-only, on no public surface
    select s.deadline_extended_count into n from public.assessment_sessions s where s.id = v_sa;
    if n is distinct from 1 then v_probs := selftest.f39_note(v_probs, 'D2R-E01', format('the extended sitting records %s extension(s), expected 1', n)); end if;
    if not exists (select 1 from public.audit_log l where l.action = 'assessment_session.deadline_extended' and l.target_id = v_sa::text) then
      v_probs := selftest.f39_note(v_probs, 'D2R-E01', 'the extension is not on the audit record');
    end if;
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    begin
      select d.diperpanjang into n from public.daftar_pengerjaan(
        (select s.class_node_id from public.assessment_sessions s where s.id = v_sa), v_sa_aa) d where d.sesi_id = v_sa;
      if n is distinct from 1 then v_probs := selftest.f39_note(v_probs, 'D2R-E01', format('the teacher''s sittings read shows %s extension(s), expected 1', n)); end if;
    exception when others then v_probs := selftest.f39_note(v_probs, 'D2R-E01', 'the teacher could not read the sittings: ' || left(sqlerrm, 120));
    end;
    perform selftest.as_owner();
    foreach k in array array['diperpanjang', 'deadline', 'perpanjang', 'percobaan', 'attempt', 'tenggat'] loop
      if v_payload::text ~* k then v_probs := selftest.f39_note(v_probs, case when k in ('percobaan', 'attempt') then 'D2R-F01' else 'D2R-E01' end, 'the sealed payload carries «' || k || '»'); end if;
      if pg_get_function_result('public.verify_certificate(text)'::regprocedure) ~* k then
        v_probs := selftest.f39_note(v_probs, case when k in ('percobaan', 'attempt') then 'D2R-F01' else 'D2R-E01' end, 'verify_certificate returns «' || k || '»');
      end if;
      if exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'certificate_identity_snapshots' and c.column_name ~* k) then
        v_probs := selftest.f39_note(v_probs, case when k in ('percobaan', 'attempt') then 'D2R-F01' else 'D2R-E01' end, 'the identity snapshot has a «' || k || '» column');
      end if;
    end loop;
    -- F01: every sitting of this world carries the lineage count at its start (none had another before it)
    begin
      select count(*) into n from public.assessment_sessions s where s.id in (v_pre, v_post, v_sa, v_q)
         and (to_jsonb(s) ->> 'percobaan_ke')::integer is distinct from 1;
      if n > 0 then v_probs := selftest.f39_note(v_probs, 'D2R-F01', format('%s first sitting(s) do not carry percobaan_ke 1', n)); end if;
      -- and it is fixed: no writer may move it after the start
      begin
        execute format('update public.assessment_sessions set percobaan_ke = 7 where id = %L', v_post);
        v_probs := selftest.f39_note(v_probs, 'D2R-F01', 'the ordinal of a started sitting was changed');
      exception when others then null;
      end;
    exception when others then v_probs := selftest.f39_note(v_probs, 'D2R-F01', 'percobaan_ke could not be read: ' || left(sqlerrm, 120));
    end;

    raise exception 'F39_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F39_UNDO' then v_fatal := 'the probe itself failed: ' || left(sqlerrm, 240); end if;
  end;

  for id, area in values
    ('D2R-D01', 'D2-R R-d -- an Uji Penguasaan refuses every level of help, by a direct call'),
    ('D2R-D02', 'D2-R R-d -- an Asesmen Mandiri refuses every level of help, by a direct call'),
    ('D2R-D03', 'D2-R R-d -- an Uji Penguasaan offers no help to the player'),
    ('D2R-D04', 'D2-R R-d -- an Asesmen Mandiri offers no help to the player'),
    ('D2R-D06', 'D2-R R-d -- Pemetaan Awal, Uji Cepat, practice and the demo keep their help (owner''s condition)'),
    ('D2R-D07', 'D2-R R-d -- an open sitting keeps the policy captured at its start'),
    ('D2R-D08', 'D2-R R-d -- the lint: a certifying mode allows no help'),
    ('D2R-D09', 'D2-R R-d -- TEST, EXAM and PAPER still refuse help'),
    ('D2R-H01', 'D2-R R-h -- an Uji Penguasaan''s review is refused to the learner'),
    ('D2R-H02', 'D2-R R-h -- an Asesmen Mandiri''s review is refused to the learner'),
    ('D2R-H03', 'D2-R R-h -- an Uji Penguasaan''s reading map gives no reasons and no verdict'),
    ('D2R-H04', 'D2-R R-h -- an Asesmen Mandiri''s reading map is revisit-advice only'),
    ('D2R-H05', 'D2-R R-h -- a certifying outcome carries counts and the decision, no mastery per objective'),
    ('D2R-H07', 'D2-R R-h -- a certifying correction read carries no reason'),
    ('D2R-H12', 'D2-R R-h -- Pemetaan Awal and Uji Cepat keep their explanations'),
    ('D2R-H14', 'D2-R R-h -- disclosure follows the sitting''s captured policy'),
    ('D2R-H16', 'D2-R R-h -- the learner''s own answers carry no correctness or key'),
    ('D2R-C01', 'D2-R R-c -- the public read gives no band, its contract unchanged'),
    ('D2R-C04', 'D2-R R-c -- the band stays in eligibility and the sealed payload'),
    ('D2R-E01', 'D2-R R-e -- extra time recorded, shown to staff, on no public surface'),
    ('D2R-F01', 'D2-R R-f -- the attempt ordinal is fixed at the start, on no public surface') loop
    if v_fatal <> '' then ok := false; detail := v_fatal;
    elsif v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> id) x));
    else
      ok := true;
      detail := case id
        when 'D2R-D01' then 'POST_TEST''s policy row allows no help; on the learner''s open Uji Penguasaan, past its window, a direct open_assistance call is refused at level 1, so 2 and 3 are never reached'
        when 'D2R-D02' then 'STANDALONE''s policy row allows no help; on an open Asesmen Mandiri started by the ordinary start path, past its window, a direct open_assistance call is refused at level 1'
        when 'D2R-D03' then 'on the open Uji Penguasaan, assistance_state gives no window and is never due, and session_state gives the player no window, so it schedules no help'
        when 'D2R-D04' then 'on the open Asesmen Mandiri, assistance_state gives no window and is never due, and session_state gives the player no window'
        when 'D2R-D06' then 'Pemetaan Awal and an Uji Cepat each served levels 1, 2 and 3 past their window; PRE_TEST, PRACTICE, QUICK and PUBLIC_DEMO still allow help and none certifies'
        when 'D2R-D07' then 'an Asesmen Mandiri started while its mode allowed help still served all three levels after the policy row stopped allowing it: the sitting reads what it captured'
        when 'D2R-D08' then 'assert_mode_policy_complete passes, and with POST_TEST allowing help it names POST_TEST'
        when 'D2R-D09' then 'TEST, EXAM and PAPER allow no help'
        when 'D2R-H01' then 'session_review refuses the learner''s own finished Uji Penguasaan, by a direct call, as a certifying result (counts only)'
        when 'D2R-H02' then 'session_review refuses the learner''s own finished Asesmen Mandiri, by a direct call, as a certifying result'
        when 'D2R-H03' then 'reading_map on the all-right Uji Penguasaan gives no reason and no level other than revisit-advice (no KUAT)'
        when 'D2R-H04' then 'reading_map on the all-wrong Asesmen Mandiri gives its sections as revisit-advice (BACA_LAGI) only, with no reason drawn from the wrong options'
        when 'D2R-H05' then 'session_outcome on both carries lulus and the counts (all right; none of n) and no per_domain; the result below the mark carries its revisit list'
        when 'D2R-H07' then 'hasil_koreksi_saya on both carries no correction reason'
        when 'D2R-H12' then 'Pemetaan Awal''s reading map keeps its levels and the misconception reasons; the Uji Cepat''s review keeps its rows and explanations'
        when 'D2R-H14' then 'with POST_TEST''s policy row edited to not certify after the sitting, session_review still refuses it'
        when 'D2R-H16' then 'session_answers returns the learner''s own answer positions and no correctness, key or explanation column'
        when 'D2R-C01' then 'the issued all-right Uji Penguasaan verifies BERLAKU with no band; verify_certificate''s OUT columns are unchanged'
        when 'D2R-C04' then 'the band is in certificate_eligibility and the sealed payload; assert_public_surface passes'
        when 'D2R-E01' then 'the admin''s extension is on the sitting (deadline_extended_count 1) and its audit row, the teacher''s sittings read shows it, and neither the sealed payload, verify_certificate nor the identity snapshot carries it'
        else 'every sitting of the world carries percobaan_ke 1, the lineage count at its start; it cannot be changed afterwards; no public read, payload or snapshot carries it'
      end;
    end if;
    return next;
  end loop;
  id := 'F39-DONE'; area := 'FABLE-39 reached its end'; ok := v_fatal = ''; detail := case when ok then 'done' else v_fatal end;
  return next;
end $f39$;
revoke all on function selftest.run_fable39() from public;

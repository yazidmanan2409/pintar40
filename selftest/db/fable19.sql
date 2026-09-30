-- FABLE-19 database suite: BOB-50, a single Uji Cepat does not issue a
-- certificate (D-082(d)). Migration 20261031100000.
--
-- Ordering: depends on fable01.sql (role switches), fable03.sql and
-- fable04.sql (the bootstrap fixture, its certified attempt and the paper
-- helper). Never applied as a migration; never present in production.
--
--   F19-Q01  a finished Uji Cepat, all correct, on the bootstrap school (started
--            under the old policy, finished under the new): not
--            certificate-eligible (its mode does not certify), certificate_prepare
--            raises for it, and no certificate row exists for it
--   F19-Q02  the cycle's Uji Penguasaan still certifies: the same learner's
--            POST_TEST attempt is eligible and a certificate is prepared
--   F19-Q03  the policy and its lint: QUICK does not certify, the change is
--            audited, and the lint passes; flip QUICK back to certifying and the
--            lint names it
--   F19-Q04  an Uji Cepat in progress when the policy changes finishes with the
--            same verdict: started while QUICK certified and finished after, its
--            session_outcome is a pass, identical under either policy
--
-- EVERY ROW IS ROLLED BACK. The suite works in its own subtransaction, notes
-- problems per id, raises a sentinel to undo everything, then emits.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null or to_regprocedure('selftest.boot_fixture()') is null
     or to_regprocedure('selftest.boot_attempt(boolean)') is null or to_regprocedure('selftest.answer_paper(uuid,boolean,boolean)') is null
     or to_regprocedure('selftest.purge_certificates()') is null then
    raise exception 'apply fable01.sql, fable03.sql and fable04.sql before fable19.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f19_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f19_note(jsonb, text, text) to authenticated, anon;

create or replace function selftest.run_fable19()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_probs jsonb := '{}'::jsonb; v_fatal text := ''; f record; v_kelas uuid; q record; v_s uuid; v_post uuid;
  e record; n int; v_ok boolean; v_detail text; v_prep int; v_raised text; v_o1 jsonb; v_o2 jsonb; v_pol boolean;
begin
  perform selftest.as_owner();
  begin
    perform selftest.purge_certificates();
    select * into f from selftest.boot_fixture();
    select nd.id into v_kelas from public.org_nodes nd where nd.institution_id = f.inst and nd.kind = 'CLASS' order by nd.created_at, nd.id limit 1;

    -- ═══════════════════════════════════════════ F19-Q01 an Uji Cepat
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    select * into q from public.launch_quick_assessment(v_kelas, f.modul, 3, 20);
    perform selftest.as_owner();
    perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
    -- the sitting starts under the policy before D-082(d) (QUICK certifying)
    -- and finishes under the policy the migrations left (v_pol)
    perform selftest.as_owner();
    select m.certifies into v_pol from public.mode_policy m where m.mode = 'QUICK';
    update public.mode_policy set certifies = true where mode = 'QUICK';
    perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
    v_s := public.start_learning_session(q.assessment_assignment_id);
    perform selftest.answer_paper(v_s, true);
    perform selftest.as_owner();
    update public.mode_policy set certifies = v_pol where mode = 'QUICK';
    perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
    perform public.finish_my_session(v_s);
    v_o1 := public.session_outcome(v_s);
    perform selftest.as_owner();
    if (select ss.mode::text from public.assessment_sessions ss where ss.id = v_s) is distinct from 'QUICK' then
      v_probs := selftest.f19_note(v_probs, 'F19-Q01', 'the fixture''s Uji Cepat session is not a QUICK session');
    end if;
    select * into e from public.certificate_eligibility(v_s);
    if e.eligible then
      v_probs := selftest.f19_note(v_probs, 'F19-Q01', 'a finished Uji Cepat is certificate-eligible (' || coalesce(e.reason, '') || ')');
    elsif e.reason !~ 'does not certify' then
      v_probs := selftest.f19_note(v_probs, 'F19-Q01', 'the Uji Cepat was refused, but not because its mode does not certify: ' || coalesce(e.reason, ''));
    end if;
    v_raised := null;
    begin
      select count(*) into v_prep from public.certificate_prepare(v_s, 1::smallint);
    exception when others then v_prep := 0; v_raised := sqlerrm;
    end;
    if v_prep > 0 then v_probs := selftest.f19_note(v_probs, 'F19-Q01', 'certificate_prepare prepared a certificate for an Uji Cepat');
    elsif v_raised is null then v_probs := selftest.f19_note(v_probs, 'F19-Q01', 'certificate_prepare did not refuse an Uji Cepat');
    elsif v_raised !~ 'does not certify' then
      v_probs := selftest.f19_note(v_probs, 'F19-Q01', 'certificate_prepare refused the Uji Cepat, but not because its mode does not certify: ' || left(v_raised, 160));
    end if;

    -- ═══════════════════════════════════════════ F19-Q04 the verdict is the sitting's
    update public.mode_policy set certifies = true where mode = 'QUICK';
    perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
    v_o2 := public.session_outcome(v_s);
    perform selftest.as_owner();
    update public.mode_policy set certifies = v_pol where mode = 'QUICK';
    if (select ss.status::text from public.assessment_sessions ss where ss.id = v_s) not in ('SUBMITTED', 'FINALIZED') then
      v_probs := selftest.f19_note(v_probs, 'F19-Q04', 'the Uji Cepat in progress did not finish (status ' || coalesce((select ss.status::text from public.assessment_sessions ss where ss.id = v_s), '?') || ')');
    end if;
    if v_o1 is null or not coalesce((v_o1 ->> 'lulus')::boolean, false) then
      v_probs := selftest.f19_note(v_probs, 'F19-Q04', 'the all-correct Uji Cepat finished after the change is not a pass: ' || coalesce(v_o1::text, 'no outcome'));
    end if;
    if v_o1 is distinct from v_o2 then
      v_probs := selftest.f19_note(v_probs, 'F19-Q04', 'the Uji Cepat''s verdict depends on the certificate policy: ' || coalesce(v_o1::text, 'null') || ' with QUICK not certifying, ' || coalesce(v_o2::text, 'null') || ' with it certifying');
    end if;
    select count(*) into n from public.certificates c where c.session_id = v_s;
    if n > 0 then v_probs := selftest.f19_note(v_probs, 'F19-Q01', format('%s certificate row(s) exist for an Uji Cepat', n)); end if;

    -- ═══════════════════════════════════════════ F19-Q02 the cycle's Uji Penguasaan
    v_post := selftest.boot_attempt(true);
    perform selftest.as_owner();
    select * into e from public.certificate_eligibility(v_post);
    if not coalesce(e.eligible, false) then
      v_probs := selftest.f19_note(v_probs, 'F19-Q02', 'the cycle''s Uji Penguasaan, all correct, is not eligible: ' || coalesce(e.reason, ''));
    end if;
    begin
      select count(*) into v_prep from public.certificate_prepare(v_post, 1::smallint);
    exception when others then
      v_prep := 0;
      v_probs := selftest.f19_note(v_probs, 'F19-Q02', 'certificate_prepare refused the cycle''s Uji Penguasaan: ' || left(sqlerrm, 160));
    end;
    if v_prep <> 1 or not exists (select 1 from public.certificates c where c.session_id = v_post and c.status = 'ELIGIBLE') then
      v_probs := selftest.f19_note(v_probs, 'F19-Q02', 'no certificate was prepared for the cycle''s Uji Penguasaan');
    end if;

    -- ═══════════════════════════════════════════ F19-Q03 the policy and its lint
    if (select m.certifies from public.mode_policy m where m.mode = 'QUICK') then
      v_probs := selftest.f19_note(v_probs, 'F19-Q03', 'QUICK certifies');
    end if;
    foreach v_detail in array array['POST_TEST', 'TEST', 'EXAM', 'STANDALONE', 'PAPER'] loop
      if not (select m.certifies from public.mode_policy m where m.mode::text = v_detail) then
        v_probs := selftest.f19_note(v_probs, 'F19-Q03', v_detail || ' no longer certifies (only QUICK changes)');
      end if;
    end loop;
    if not exists (select 1 from public.audit_log l where l.action = 'mode_policy.changed' and l.target_id = 'QUICK'
                    and l.summary -> 'certifies' ->> 'to' = 'false' and l.summary ->> 'decision' = 'D-082(d)') then
      v_probs := selftest.f19_note(v_probs, 'F19-Q03', 'the change of QUICK''s policy was not audited');
    end if;
    select a.ok, a.detail into v_ok, v_detail from public.assert_mode_policy_complete() a;
    if not v_ok then v_probs := selftest.f19_note(v_probs, 'F19-Q03', 'the mode policy lint fails: ' || v_detail); end if;
    update public.mode_policy set certifies = true where mode = 'QUICK';
    select a.ok, a.detail into v_ok, v_detail from public.assert_mode_policy_complete() a;
    if v_ok or v_detail !~ 'certifying that must not: QUICK' then
      v_probs := selftest.f19_note(v_probs, 'F19-Q03', 'with QUICK certifying again the lint did not name it: ' || coalesce(v_detail, ''));
    end if;

    raise exception 'F19_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F19_UNDO' then v_fatal := 'the probe itself failed: ' || left(sqlerrm, 240); end if;
  end;

  for id, area in values
    ('F19-Q01', 'BOB-50 -- a single Uji Cepat issues no certificate'),
    ('F19-Q02', 'BOB-50 -- the cycle''s Uji Penguasaan still certifies'),
    ('F19-Q03', 'BOB-50 -- the policy and its lint'),
    ('F19-Q04', 'BOB-50 -- an Uji Cepat in progress keeps its verdict') loop
    if v_fatal <> '' then ok := false; detail := v_fatal;
    elsif v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> id) x));
    else
      ok := true;
      detail := case id
        when 'F19-Q01' then 'the bootstrap teacher launched an Uji Cepat; the learner started it while QUICK still certified and finished it all correct after: '
          || 'certificate_eligibility refuses it because its mode does not certify, certificate_prepare raises for the same reason and no certificate row exists. Every row rolled back'
        when 'F19-Q04' then 'the Uji Cepat started before the change and finished after it finished, a pass, and its session_outcome is identical with QUICK certifying or not'
        when 'F19-Q02' then 'the same learner''s all-correct Uji Penguasaan (POST_TEST) is eligible and a certificate is prepared for it'
        else 'QUICK does not certify while POST_TEST, TEST, EXAM, STANDALONE and PAPER still do; the change is audited as D-082(d); '
          || 'assert_mode_policy_complete passes, and with QUICK certifying again it names QUICK'
      end;
    end if;
    return next;
  end loop;
  id := 'F19-DONE'; area := 'suite'; ok := true; detail := 'FABLE-19 suite complete';
  return next;
end $$;
revoke all on function selftest.run_fable19() from public;

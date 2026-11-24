-- R-1 (Z-READINESS register; 4.1 closure, Sharon's ruling: «R-1 stays a 4.1 item, permission integrity»). A LEARNER WHO HAS
-- DEPARTED, after leaving, after a transfer or after a rollover, CAN NEITHER START, RESUME, ANSWER NOR SUBMIT BY ADDRESS,
-- AND THE SITTING ENDS WITH THE ENROLMENT. Re-checked on claude/next-base after A3 changed the start path; rides
-- claude/d2r as its own commit (rev. 4 §7). Reuses fable39's helpers (selftest.f39_luncur, f39_pertama, f39_note).
--
-- Each path runs in its own block, always rolled back, on the bootstrap tenant. Before the departure: the bootstrap
-- teacher launches two Uji Cepat in the learner's class; the learner opens a sitting of the first (A) and is given the
-- second (B) but does not start it. Then:
--   R1-K01  LEAVING: the school's admin ends the enrolment (akhiri_pendaftaran, WITHDRAWN)
--   R1-K02  A TRANSFER: the school asks (transfer_minta), the receiving school accepts and executes it
--   R1-K03  A ROLLOVER: the class moves up into the next school year (kenaikan_tetapkan)
-- and, as the learner, by direct calls (an address typed in is no more than these):
--   (e) the open sitting A has ended (TERMINATED), with the departure;
--   (a) starting B is refused;
--   (b) resuming A is refused (may_continue_session is not ok; session_paper and assistance_state refuse);
--   (c) record_answer on A's question and finish_my_session on A are refused, and A gains no response.

create or replace function selftest.run_r1()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $r1$
declare
  SISWA constant text := 'boot-siswa@bootstrap.pintar.test';
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  f record; v_jalur text; v_siswa uuid; v_en uuid; v_aa_a uuid; v_aa_b uuid; v_s uuid; v_pi uuid; v_n integer; v_ok boolean;
  v_beta uuid; v_bper uuid; v_bkelas uuid; v_tf uuid;
  v_kelas uuid; v_coh uuid; v_prog uuid; v_per uuid; v_next uuid; v_coh2 uuid; v_c2 uuid; v_dec jsonb;
  v_resp_awal integer;
begin
  foreach v_jalur in array array['R1-K01', 'R1-K02', 'R1-K03'] loop
    begin
      perform selftest.as_owner();
      select * into f from selftest.boot_fixture();
      select a.person_id into v_siswa from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = SISWA;
      select e.id into v_en from public.enrollments e where e.person_id = v_siswa and e.institution_id = f.inst and e.status = 'ACTIVE'
       order by e.created_at desc limit 1;
      if v_en is null then raise exception 'the bootstrap learner has no live enrolment'; end if;
      v_aa_a := selftest.f39_luncur(null);
      v_aa_b := selftest.f39_luncur(null);
      perform selftest.as_user(SISWA);
      v_s := public.start_learning_session(v_aa_a);
      v_pi := selftest.f39_pertama(v_s);
      perform public.record_answer(v_pi, 1, jsonb_build_object('posisi', 1));
      perform selftest.as_owner();
      select count(*) into v_resp_awal from public.responses r where r.session_id = v_s;

      -- ═══════════════════════════════════════ the departure
      if v_jalur = 'R1-K01' then
        perform selftest.as_user('boot-admin@bootstrap.pintar.test');
        perform public.akhiri_pendaftaran(v_en, 'WITHDRAWN', 'R-1: keluar', null);   -- the school's today (its own clock), never UTC's current_date
      elsif v_jalur = 'R1-K02' then
        select i.id into v_beta from public.institutions i where i.slug like 'synth-beta-%' limit 1;
        select ap.id into v_bper from public.academic_periods ap where ap.institution_id = v_beta order by ap.starts_on desc nulls last limit 1;
        select n.id into v_bkelas from public.org_nodes n where n.institution_id = v_beta and n.kind = 'CLASS' and n.is_active
           and coalesce(n.academic_period_id, v_bper) = v_bper order by n.name limit 1;
        if v_bkelas is null then raise exception 'the fixture has no receiving school with a class'; end if;
        perform selftest.as_user('boot-admin@bootstrap.pintar.test');
        v_tf := public.transfer_minta(v_en, v_beta, 'R-1: pindah sekolah');
        perform selftest.as_user('beta-admin@synthetic.pintar.test');
        perform public.transfer_terima(v_tf, v_bper, null, v_bkelas);
        perform public.transfer_execute(v_tf);
      else
        select n.id, n.parent_id, n.academic_period_id into v_kelas, v_coh, v_per
          from public.org_nodes n where n.institution_id = f.inst and n.kind = 'CLASS' order by n.created_at, n.id limit 1;
        select n.parent_id, coalesce(v_per, n.academic_period_id) into v_prog, v_per from public.org_nodes n where n.id = v_coh;
        insert into public.academic_periods (institution_id, name, starts_on, ends_on)
        values (f.inst, 'R-1 tahun berikut', (select ap.ends_on + 1 from public.academic_periods ap where ap.id = v_per),
                (select ap.ends_on + 366 from public.academic_periods ap where ap.id = v_per)) returning academic_periods.id into v_next;
        insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
        values (f.inst, v_prog, 'COHORT', 'R-1 Tingkat berikut', v_next) returning org_nodes.id into v_coh2;
        insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
        values (f.inst, v_coh2, 'CLASS', 'R-1 Kelas berikut', v_next) returning org_nodes.id into v_c2;
        perform selftest.as_user('boot-admin@bootstrap.pintar.test');
        select jsonb_agg(jsonb_build_object('person_id', b.person_id, 'keputusan', 'NAIK', 'kelas_tujuan', v_c2)) into v_dec
          from (select (pl ->> 'person_id') as person_id from jsonb_array_elements(public.kenaikan_rencana(v_kelas) -> 'murid') pl) b;
        perform public.kenaikan_tetapkan(v_kelas, v_next, v_dec, true, true);
      end if;

      -- ═══════════════════════════════════════ (e) the sitting ended with the enrolment
      perform selftest.as_owner();
      if (select s.status::text from public.assessment_sessions s where s.id = v_s) is distinct from 'TERMINATED' then
        v_probs := selftest.f39_note(v_probs, v_jalur, format('the open sitting is %s after the departure, not TERMINATED',
          (select s.status from public.assessment_sessions s where s.id = v_s)));
      end if;

      perform selftest.as_user(SISWA);
      -- (a) a new start by address
      begin
        perform public.start_learning_session(v_aa_b);
        v_probs := selftest.f39_note(v_probs, v_jalur, 'a new sitting was started by address after the departure');
      exception when others then null;
      end;
      -- (b) resuming the sitting
      select c.ok into v_ok from public.may_continue_session(v_s) c;
      if v_ok then v_probs := selftest.f39_note(v_probs, v_jalur, 'may_continue_session lets the departed learner resume'); end if;
      begin
        perform public.assistance_state(v_pi);
        v_probs := selftest.f39_note(v_probs, v_jalur, 'assistance_state answered on the ended sitting');
      exception when others then null;
      end;
      -- (c) answering and submitting
      begin
        perform public.record_answer(v_pi, 2, jsonb_build_object('posisi', 2));
        v_probs := selftest.f39_note(v_probs, v_jalur, 'record_answer was accepted after the departure');
      exception when others then null;
      end;
      begin
        perform public.finish_my_session(v_s);
        v_probs := selftest.f39_note(v_probs, v_jalur, 'finish_my_session was accepted after the departure');
      exception when others then null;
      end;
      perform selftest.as_owner();
      select count(*) into v_n from public.responses r where r.session_id = v_s;
      if v_n <> v_resp_awal then v_probs := selftest.f39_note(v_probs, v_jalur, format('the sitting gained %s response(s) after the departure', v_n - v_resp_awal)); end if;
      if exists (select 1 from public.assessment_sessions s where s.person_id = v_siswa and s.assessment_assignment_id = v_aa_b) then
        v_probs := selftest.f39_note(v_probs, v_jalur, 'a sitting of the second assignment exists');
      end if;

      raise exception 'R1_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'R1_UNDO' then v_probs := selftest.f39_note(v_probs, v_jalur, 'the probe itself failed: ' || left(sqlerrm, 200)); end if;
    end;
  end loop;

  for id, area in values
    ('R1-K01', 'R-1 -- a learner who has left: no start, resume, answer or submit by address; the sitting ends'),
    ('R1-K02', 'R-1 -- a learner transferred away: no start, resume, answer or submit by address; the sitting ends'),
    ('R1-K03', 'R-1 -- a learner rolled over into the next year: no start, resume, answer or submit by address; the sitting ends') loop
    if v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> id) x));
    else
      ok := true;
      detail := case id
        when 'R1-K01' then 'after akhiri_pendaftaran (WITHDRAWN) the open sitting is TERMINATED; starting the second assignment, may_continue_session, assistance_state, record_answer and finish_my_session are each refused; no response or sitting is added'
        when 'R1-K02' then 'after transfer_minta, transfer_terima and transfer_execute to the receiving school the open sitting is TERMINATED; start, resume, answer and submit are each refused; nothing is added'
        else 'after kenaikan_tetapkan moves the class into the next school year the open sitting of the old class is TERMINATED; start, resume, answer and submit are each refused; nothing is added'
      end;
    end if;
    return next;
  end loop;
  id := 'R1-DONE'; area := 'R-1 reached its end'; ok := true; detail := 'done';
  return next;
end $r1$;
revoke all on function selftest.run_r1() from public;

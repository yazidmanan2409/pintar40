-- FABLE-04 database-layer selftest. Sibling of fable01/02/03.sql, same row
-- shape, same throwaway `selftest` schema, same CI-01 privilege preamble.
--
-- It runs against the D1 BOOTSTRAP FIXTURE (supabase/seed/official_bootstrap.sql),
-- which is the one non-synthetic tenant in the project. That is the whole point
-- of D1: the positive certificate path needs OFFICIAL evidence, and OFFICIAL
-- evidence needs a tenant that is genuinely not synthetic. Nothing here marks
-- anything OFFICIAL by hand -- the class arrives because
-- `derive_evidence_class` sees a non-synthetic institution, the ordinary way.
--
-- The NEGATIVE half runs against the synthetic cycle fixture, and must run
-- there: "a SYNTHETIC session can never reach ELIGIBLE" is only a real test if
-- a SYNTHETIC session exists to try it with.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.pick_position(uuid,uuid,boolean)') is null then
    raise exception 'apply fable01.sql and fable03.sql before fable04.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.boot_fixture()
returns table (inst uuid, course uuid, modul uuid, la uuid, aa uuid, defn uuid, release uuid)
language sql stable set search_path = public, pg_temp as $$
  select i.id, co.id, m.id, la.id, aa.id, d.id, rl.id
    from public.institutions i
    join public.courses co on co.institution_id = i.id
    join public.modules m on m.course_id = co.id
    join public.plp_releases rl on rl.course_id = co.id and rl.status = 'PUBLISHED'
    join public.learning_assignments la on la.plp_release_id = rl.id
    join public.assessment_assignments aa on aa.learning_assignment_id = la.id
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
   where i.is_official_bootstrap
   limit 1
$$;
revoke all on function selftest.boot_fixture() from public;

-- Runs one full OFFICIAL attempt and returns its session. SECURITY DEFINER so
-- it can read the bank to answer correctly; it raises rather than returning a
-- session with zero answers, because a silent zero-answer run would pass tests
-- that prove nothing (the FABLE-03 `answer_paper` lesson).
create or replace function selftest.boot_attempt(p_all_correct boolean default true)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare aa uuid; s uuid; v_row record; v_pos int; n int := 0;
begin
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  select m.post_test_assignment into aa from public.my_learning_assignments() m limit 1;
  if aa is null then raise exception 'the bootstrap learner sees no post-test assignment'; end if;
  s := public.start_learning_session(aa);
  n := selftest.answer_paper(s, p_all_correct);
  if n = 0 then raise exception 'the bootstrap attempt answered nothing'; end if;
  perform public.finish_my_session(s);
  perform selftest.as_owner();
  return s;
end $$;
revoke all on function selftest.boot_attempt(boolean) from public;

create or replace function selftest.purge_certificates() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  alter table public.integrity_signals disable trigger integrity_signals_write;
  delete from public.integrity_signals where session_id in (
    select ss.id from public.assessment_sessions ss
     join public.institutions i on i.id = ss.institution_id where i.is_official_bootstrap);
  alter table public.integrity_signals enable trigger integrity_signals_write;
  -- certificates are never deleted by the product; the harness removes only
  -- its own rows, and only on a fixture tenant, by disabling its own guard
  alter table public.certificates disable trigger certificates_write;
  alter table public.certificate_identity_snapshots disable trigger snapshots_immutable;
  delete from public.certificates where institution_id in
    (select id from public.institutions where is_official_bootstrap);
  delete from public.certificate_identity_snapshots where institution_id in
    (select id from public.institutions where is_official_bootstrap);
  alter table public.certificates enable trigger certificates_write;
  alter table public.certificate_identity_snapshots enable trigger snapshots_immutable;

  -- Evidence is append-only by design, so the harness must disable its own
  -- guards to clear a re-runnable fixture -- and re-enable them immediately.
  -- It touches ONLY the bootstrap tenant, and never a production path: in CI
  -- the database is new every run and these deletes find nothing.
  alter table public.assessment_results disable trigger assessment_results_write;
  alter table public.responses disable trigger responses_write;
  alter table public.presented_items disable trigger presented_items_immutable;
  alter table public.presented_item_views disable trigger presented_item_views_write;
  alter table public.assessment_sessions disable trigger assessment_sessions_status;
  delete from public.assessment_results where institution_id in
    (select id from public.institutions where is_official_bootstrap);
  delete from public.responses where institution_id in
    (select id from public.institutions where is_official_bootstrap);
  delete from public.presented_item_views where session_id in (
    select ss.id from public.assessment_sessions ss
     join public.institutions i on i.id = ss.institution_id where i.is_official_bootstrap);
  delete from public.presented_items where institution_id in
    (select id from public.institutions where is_official_bootstrap);
  delete from public.assessment_sessions where institution_id in
    (select id from public.institutions where is_official_bootstrap);
  alter table public.assessment_results enable trigger assessment_results_write;
  alter table public.responses enable trigger responses_write;
  alter table public.presented_items enable trigger presented_items_immutable;
  alter table public.presented_item_views enable trigger presented_item_views_write;
  alter table public.assessment_sessions enable trigger assessment_sessions_status;
end $$;
revoke all on function selftest.purge_certificates() from public;

-- ---------------------------------------------------------------------------
-- Adversarial MCQ banks (doc 16 §4, INV-35).
--
-- Four banks, each carrying exactly ONE of the four named patterns, plus a
-- clean control. Written as a fixture builder rather than a seed on purpose:
-- these banks exist to be measured and then repaired inside a test, and a
-- permanently seeded bank of deliberately bad questions would sit in every
-- other phase's fixtures pretending to be content.
--
-- Each bank is constructed to trip its own detector and NONE of the others,
-- which is the property that makes "Publish Readiness named the correct
-- finding" mean something. Every distractor carries a misconception code, or
-- WEAK_MISCONCEPTION_LINKAGE would fire on all five and the naming assertion
-- would pass for the wrong reason.
-- ---------------------------------------------------------------------------
create or replace function selftest.adversarial_item(
  p_lesson uuid, p_inst uuid, p_author uuid, p_stem text,
  p_correct_label text, p_bodies jsonb, p_code text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_item uuid; k text;
begin
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, author_person_id)
  values (p_lesson, p_inst, 'MCQ_SINGLE', 'PRACTICE', p_stem, p_author)
  returning id into v_item;
  for k in select jsonb_object_keys(p_bodies) order by 1 loop
    insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
    values (v_item, p_inst, k, p_bodies ->> k, k = p_correct_label,
            case when k = p_correct_label then 'Ini yang sesuai dengan aturannya.'
                 else 'Ini keliru; lihat catatan miskonsepsinya.' end,
            case when k = p_correct_label then null else p_code end);
  end loop;
  return v_item;
end $$;
revoke all on function selftest.adversarial_item(uuid, uuid, uuid, text, text, jsonb, text) from public;

-- The banks are built, measured, repaired and removed inside one test. This
-- deletes them by the title prefix the builder stamps, so a failed run leaves
-- nothing behind for the next one to measure.
-- The real signing loop needs a certificate that exists, is ELIGIBLE, and has
-- its canonical payload readable from OUTSIDE the database, because the only
-- honest end-to-end test of INV-05 is one where SQL builds the payload,
-- TypeScript signs it with the real key, SQL stores the signature, and a fresh
-- process reads both back and recomputes. F04-S04 drives that loop; this is the
-- half of it that has to be SQL.
create or replace function selftest.issue_material()
returns table (certificate_id uuid, canonical_payload jsonb, key_version smallint)
-- invoker, not definer: boot_attempt() impersonates the learner with
-- `set role`, which a SECURITY DEFINER body may not do. Same reason
-- boot_attempt itself is an invoker function.
language plpgsql set search_path = public, pg_temp as $$
declare v_sess uuid; v_row record;
begin
  perform selftest.purge_certificates();
  v_sess := selftest.boot_attempt(true);
  perform selftest.as_owner();
  select * into v_row from public.certificate_prepare(v_sess, 1::smallint);
  if v_row.certificate_id is null then raise exception 'no certificate was prepared'; end if;
  certificate_id := v_row.certificate_id;
  select c.canonical_payload, (c.canonical_payload ->> 'key_version')::smallint
    into canonical_payload, key_version
    from public.certificates c where c.id = certificate_id;
  return next;
end $$;
revoke all on function selftest.issue_material() from public;

create or replace function selftest.purge_adversarial()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_course uuid;
begin
  for v_course in select id from public.courses where title like 'Bank uji %' loop
    delete from public.item_options o where o.item_id in (
      select i.id from public.items i join public.lessons l on l.id = i.lesson_id
        join public.modules m on m.id = l.module_id where m.course_id = v_course);
    delete from public.items i where i.lesson_id in (
      select l.id from public.lessons l join public.modules m on m.id = l.module_id
       where m.course_id = v_course);
    delete from public.mcq_quality_findings where course_id = v_course;
    delete from public.coaching_findings where course_id = v_course;
    delete from public.lessons l where l.module_id in (select id from public.modules where course_id = v_course);
    delete from public.modules where course_id = v_course;
    delete from public.courses where id = v_course;
  end loop;
end $$;
revoke all on function selftest.purge_adversarial() from public;

create or replace function selftest.adversarial_bank(p_kind text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_author uuid; v_course uuid; v_mod uuid; v_lesson uuid; v_code text;
  i int; v_label text;
begin
  select id into v_inst from public.institutions
   where is_synthetic and slug like 'synth-siklus-%' order by created_at desc limit 1;
  if v_inst is null then raise exception 'no learning-cycle tenant to build adversarial banks in'; end if;
  select person_id into v_author from public.accounts a
    join auth.users u on u.id = a.auth_user_id
   where u.email = 'siklus-guru@synthetic.pintar.test';
  if v_author is null then
    select author_person_id into v_author from public.courses where institution_id = v_inst limit 1;
  end if;
  select code into v_code from public.misconception_taxonomy where institution_id = v_inst order by code limit 1;

  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
  values (v_inst, 'IPA', 'SD', 'V', 'Bank uji ' || p_kind || ' ' || gen_random_uuid()::text, v_author)
  returning id into v_course;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
  values (v_course, v_inst, 1, 'Modul uji', v_author) returning id into v_mod;
  insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown, author_person_id)
  values (v_mod, v_inst, 1, 'Pelajaran uji', '# uji', v_author) returning id into v_lesson;

  if p_kind = 'CORRECT_OPTION_LENGTH_IMBALANCE' then
    -- the correct option is far longer than every distractor, and nothing else
    for i in 1..4 loop
      perform selftest.adversarial_item(v_lesson, v_inst, v_author,
        format('Berapakah hasil hitungan nomor %s pada tabel itu?', i), 'B',
        jsonb_build_object(
          'A', 'Dua belas satuan saja',
          'B', 'Dua belas satuan penuh yang diperoleh setelah seluruh tabel dijumlahkan dari baris teratas hingga baris paling bawah dengan teliti',
          'C', 'Tiga belas satuan saja',
          'D', 'Empat belas satuan saja'),
        v_code);
    end loop;

  elsif p_kind = 'ANSWER_POSITION_SKEW' then
    -- ten items, seven of them answered at the same position
    for i in 1..10 loop
      v_label := case when i <= 7 then 'A' else 'C' end;
      perform selftest.adversarial_item(v_lesson, v_inst, v_author,
        format('Manakah bilangan yang tepat untuk kotak nomor %s?', i), v_label,
        jsonb_build_object(
          'A', 'Bilangan dua puluh satu', 'B', 'Bilangan dua puluh dua',
          'C', 'Bilangan dua puluh tiga', 'D', 'Bilangan dua puluh empat'),
        v_code);
    end loop;

  elsif p_kind = 'IMPLAUSIBLE_DISTRACTOR' then
    -- one distractor nobody would ever choose, sitting beside three real ones
    for i in 1..4 loop
      perform selftest.adversarial_item(v_lesson, v_inst, v_author,
        format('Manakah satuan yang tepat untuk pengukuran nomor %s?', i), 'A',
        jsonb_build_object(
          'A', 'Sentimeter, karena benda itu diukur dengan penggaris pendek',
          'B', 'Milimeter, karena benda itu diukur dengan penggaris pendek',
          'C', 'Kilometer, karena benda itu diukur dengan penggaris pendek',
          'D', 'Ya'),
        v_code);
    end loop;

  elsif p_kind = 'STEM_REVEALS_ANSWER' then
    -- a distinctive word in the question appears only in the right answer
    for i in 1..4 loop
      perform selftest.adversarial_item(v_lesson, v_inst, v_author,
        format('Pada percobaan nomor %s, proses fotosintesis terjadi di bagian mana?', i), 'D',
        jsonb_build_object(
          'A', 'Di bagian akar tanaman itu', 'B', 'Di bagian batang tanaman itu',
          'C', 'Di bagian bunga tanaman itu',
          'D', 'Di daun, tempat fotosintesis berlangsung'),
        v_code);
    end loop;

  elsif p_kind = 'CLEAN' then
    -- the control: nothing wrong with it, so READY must be reachable at all
    for i in 1..4 loop
      v_label := case i % 4 when 0 then 'A' when 1 then 'B' when 2 then 'C' else 'D' end;
      perform selftest.adversarial_item(v_lesson, v_inst, v_author,
        format('Manakah bilangan yang tepat untuk kotak nomor %s?', i), v_label,
        jsonb_build_object(
          'A', 'Bilangan tiga puluh satu', 'B', 'Bilangan tiga puluh dua',
          'C', 'Bilangan tiga puluh tiga', 'D', 'Bilangan tiga puluh empat'),
        v_code);
    end loop;
  else
    raise exception 'unknown adversarial bank kind %', p_kind;
  end if;

  return v_course;
end $$;
revoke all on function selftest.adversarial_bank(text) from public;

create or replace function selftest.run_fable04()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  f record; s uuid; c record; n int; n2 int; v_ok boolean; v_detail text;
  v_tok text; v_cert uuid; e record; v record; v_row record;
  v_before text; v_after text; v_pos int; v_inst uuid; v_sess uuid;
  bad text; v_def2 uuid; v_course uuid; v_status text; v_blockers text[];
  v_demo uuid; v_enr uuid;
  t0 timestamptz := clock_timestamp();
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  if f.inst is null then
    test_id := 'F04-T01'; invariant := '-'; ok := false;
    detail := 'the D1 bootstrap fixture is absent: apply supabase/seed/official_bootstrap.sql';
    return next; return;
  end if;
  perform selftest.purge_certificates();

  -- =========================================================================
  -- F04-T01 mode extension is additive: no sealed content hash moved
  -- =========================================================================
  ok := true; detail := '';
  select count(*) into n from public.plp_releases where content_sha256 is not null;
  select count(*) into n2 from public.plp_releases rel
   where rel.content_sha256 is not null and rel.content_sha256 <> public.course_content_sha256(rel.course_id);
  if n = 0 then ok := false; detail := 'no sealed release to compare; the invariance claim is untested; '; end if;
  if n2 > 0 then ok := false; detail := detail || format('%s sealed release(s) no longer hash to their stored value; ', n2); end if;
  select count(*) into n2 from pg_enum en join pg_type ty on ty.oid=en.enumtypid where ty.typname='assessment_mode';
  if n2 <> 9 then ok := false; detail := detail || format('assessment_mode has %s labels, expected 9; ', n2); end if;
  test_id := 'F04-T01'; invariant := 'INV-04 / ADR-0006';
  if ok then detail := format('%s sealed release(s) hash identically after five labels were added; assessment_mode carries 9', n); end if;
  return next;

  -- =========================================================================
  -- F04-T02 INV-29: the version resolves, results keep their policy, a
  -- recomputation writes a NEW linked row
  -- =========================================================================
  ok := true; detail := '';
  s := selftest.boot_attempt(true);
  select scoring_policy_version, engine_version into v_before, v_after
    from public.assessment_results where session_id = s and supersedes_result_id is null;
  if v_before is null or not exists (select 1 from public.scoring_policy where version = v_before) then
    ok := false; detail := detail || 'the result''s scoring policy version resolves to no registry row; ';
  end if;
  if v_after is null then ok := false; detail := detail || 'no engine version stamped; '; end if;
  -- publish a second policy; the old result must still resolve to the old one
  -- The probe policy and the recomputation are real writes, so they run inside
  -- a subtransaction that is unwound at the end of this test: a scoring policy
  -- can never be deleted (INV-29), and leaving one behind would make the suite
  -- non-idempotent on a long-lived local stack.
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  begin
    perform public.publish_scoring_policy('pintar-scoring/2', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
      '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, 'selftest probe');
  exception when unique_violation then null;
  when others then
    ok := false; detail := detail || 'publishing a second policy failed: ' || left(sqlerrm, 60) || '; ';
  end;
  perform selftest.as_owner();
  select scoring_policy_version into v_after from public.assessment_results
   where session_id = s and supersedes_result_id is null;
  if v_after is distinct from v_before then
    ok := false; detail := detail || 'an existing result changed policy version when a new one was published; ';
  end if;
  if public.scoring_policy_version() <> 'pintar-scoring/2' then
    ok := false; detail := detail || 'the current policy did not advance; ';
  end if;
  -- a correction is a new linked row, never an edit
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  begin
    v_cert := public.recompute_result(s, 'selftest probe');
  exception when others then
    ok := false; detail := detail || 'recompute_result failed: ' || left(sqlerrm, 60) || '; ';
  end;
  perform selftest.as_owner();
  select count(*) into n from public.assessment_results where session_id = s;
  select count(*) into n2 from public.assessment_results
   where session_id = s and supersedes_result_id is not null;
  if n <> 2 or n2 <> 1 then
    ok := false; detail := detail || format('%s result row(s), %s linked; expected 2 and 1; ', n, n2);
  end if;
  test_id := 'F04-T02'; invariant := 'INV-29';
  if ok then detail := format('the result resolves to %s and stays there when %s is published; a recomputation wrote a new linked row and left the original',
    v_before, public.scoring_policy_version()); end if;
  return next;

  -- =========================================================================
  -- F04-T03 INV-26 / INV-12: every mode has a policy; EXAM stays unreachable
  -- =========================================================================
  ok := true; detail := '';
  select aa2.ok, aa2.detail into v_ok, v_detail from public.assert_mode_policy_complete() aa2;
  if not v_ok then ok := false; detail := detail || v_detail || '; '; end if;
  foreach bad in array array['assemble_session','grade_response','evaluate_session','finalize_session','sanitized_item'] loop
    select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.proname = bad;
    if n <> 1 then ok := false; detail := detail || format('%s has %s implementations; ', bad, n); end if;
  end loop;
  if (select max_bank_tier from public.mode_policy where mode='QUICK') = 'EXAM' then
    ok := false; detail := detail || 'QUICK reaches the EXAM tier; ';
  end if;
  test_id := 'F04-T03'; invariant := 'INV-26 / INV-12';
  if ok then detail := format('%s mode(s) each carry a policy; the five engine functions have one implementation each; the EXAM tier is reachable only from EXAM and PAPER',
    (select count(*) from public.mode_policy)); end if;
  return next;

  -- =========================================================================
  -- F04-T04 Quick Assessment: capability-gated, bounded, EXAM unreachable
  -- =========================================================================
  ok := true; detail := '';
  select id into v_inst from public.org_nodes where institution_id = f.inst and kind='CLASS' limit 1;
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  v_cert := null;   -- reused here as the launched definition id
  begin
    select q.assessment_definition_id into v_cert
      from public.launch_quick_assessment(v_inst, f.modul, 5, 20) q;
    if v_cert is null then ok := false; detail := detail || 'the educator launched nothing; '; end if;
  exception when others then
    ok := false; detail := detail || 'an in-scope educator was refused: ' || left(sqlerrm, 70) || '; ';
  end;
  if v_cert is not null
     and (select bank_type from public.assessment_definitions where id = v_cert) = 'EXAM' then
    ok := false; detail := detail || 'a quick assessment was created at the EXAM tier (INV-12); ';
  end if;
  -- 0049: a second launch inside the same clock minute. This runs inside the
  -- suite's transaction, so now() is identical for both by construction rather
  -- than by luck -- which is exactly how the defect surfaced. Before 0049 the
  -- second teacher got a raw unique violation.
  v_def2 := null;
  begin
    select q.assessment_definition_id into v_def2
      from public.launch_quick_assessment(v_inst, f.modul, 5, 20) q;
  exception when others then
    ok := false; detail := detail || 'a second launch in the same minute was refused: ' || left(sqlerrm, 70) || '; ';
  end;
  if v_def2 is not null then
    if v_def2 = v_cert then ok := false; detail := detail || 'the second launch returned the first definition; '; end if;
    select count(*) into n from public.assessment_definitions d1, public.assessment_definitions d2
     where d1.id = v_cert and d2.id = v_def2 and d1.title = d2.title;
    if n <> 0 then ok := false; detail := detail || 'two launches in one minute share a title; '; end if;
    select count(*) into n from public.assessment_definitions
     where id in (v_cert, v_def2) and (version <> 1 or title !~ '^Kuis Cepat');
    if n <> 0 then ok := false; detail := detail || 'the collision was resolved by bumping version or by losing the label; '; end if;
  end if;
  -- bounds are the server's
  begin
    perform public.launch_quick_assessment(v_inst, f.modul, 99, 20);
    ok := false; detail := detail || 'a 99-question quick assessment was accepted; ';
  exception when others then null; end;
  -- a DEAN holds no capability anywhere
  perform selftest.as_user('alpha-dean@synthetic.pintar.test');
  begin
    perform public.launch_quick_assessment(v_inst, f.modul, 5, 20);
    ok := false; detail := detail || 'a DEAN launched a quick assessment; ';
  exception when others then null; end;
  -- an educator outside this class's scope
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  begin
    perform public.launch_quick_assessment(v_inst, f.modul, 5, 20);
    ok := false; detail := detail || 'an out-of-scope educator launched a quick assessment; ';
  exception when others then null; end;
  perform selftest.as_owner();
  test_id := 'F04-T04'; invariant := 'doc 07 §5 / INV-12';
  if ok then detail := 'an in-scope educator launches in one call at the TEST tier and a second launch in the same minute succeeds with its own title (0049); '
    || 'a DEAN, an out-of-scope educator and an out-of-bounds size are each refused'; end if;
  return next;

  -- =========================================================================
  -- F04-T05 INV-28: late sync inside the grace is scored; beyond it the work
  -- is retained and excluded
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.purge_certificates();
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  declare v_aa uuid; v_pi uuid; v_p int; begin
    select m.post_test_assignment into v_aa from public.my_learning_assignments() m limit 1;
    v_sess := public.start_learning_session(v_aa);
    select pp.presented_item_id into v_pi from public.session_paper(v_sess) pp limit 1;
    v_p := selftest.pick_position(v_sess, v_pi, true);
    perform public.record_answer(v_pi, 1, jsonb_build_object('posisi', v_p), now(), 'LIVE');
    perform selftest.as_owner();
    -- push the deadline into the past, inside the 300s grace the definition sets
    update public.assessment_sessions set authoritative_deadline = now() - interval '60 seconds'
     where id = v_sess;
    perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
    perform public.record_answer(v_pi, 2, jsonb_build_object('posisi', v_p), now(), 'LIVE');
    perform selftest.as_owner();
    select receipt_mode::text, is_final into v_row from public.responses
     where presented_item_id = v_pi and client_seq = 2;
    if v_row.receipt_mode <> 'LATE_SYNC' then
      ok := false; detail := detail || format('a reply after the deadline was recorded as %s; ', v_row.receipt_mode);
    end if;
    if not v_row.is_final then ok := false; detail := detail || 'an in-grace reply was excluded from scoring; '; end if;
    -- now beyond the grace
    update public.assessment_sessions set authoritative_deadline = now() - interval '3 hours'
     where id = v_sess;
    perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
    perform public.record_answer(v_pi, 3, jsonb_build_object('posisi', v_p), now(), 'LIVE');
    perform selftest.as_owner();
    select receipt_mode::text, is_final into v_row from public.responses
     where presented_item_id = v_pi and client_seq = 3;
    if v_row.is_final then
      ok := false; detail := detail || 'a reply beyond the grace window was scored; ';
    end if;
    select count(*) into n from public.responses where presented_item_id = v_pi;
    if n <> 3 then ok := false; detail := detail || format('%s response rows; the beyond-grace work was not retained; ', n); end if;
  end;
  test_id := 'F04-T05'; invariant := 'INV-28 / doc 07';
  if ok then detail := 'a reply inside the governed grace is LATE_SYNC and scored; beyond it the work is retained as evidence and excluded from scoring; all three receipts survive'; end if;
  return next;

  -- =========================================================================
  -- F04-T06 doc 04 §5: termination names a cause and an actor; extension audited
  -- =========================================================================
  ok := true; detail := '';
  select count(*) into n from public.responses where session_id = v_sess;
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  begin
    perform public.extend_session_deadline(v_sess, 30, 'selftest probe');
  exception when others then
    ok := false; detail := detail || 'an authorized extension was refused: ' || left(sqlerrm, 60) || '; ';
  end;
  begin
    perform public.extend_session_deadline(v_sess, 9999, 'probe');
    ok := false; detail := detail || 'an unbounded extension was accepted; ';
  exception when others then null; end;
  begin
    perform public.terminate_session(v_sess, 'SECURITY_INTERVENTION', 'selftest probe');
  exception when others then
    ok := false; detail := detail || 'an authorized termination was refused: ' || left(sqlerrm, 60) || '; ';
  end;
  perform selftest.as_owner();
  select status::text, termination_cause::text, terminated_by_person_id into v_row
    from public.assessment_sessions where id = v_sess;
  if v_row.status <> 'TERMINATED' or v_row.termination_cause is null or v_row.terminated_by_person_id is null then
    ok := false; detail := detail || 'a terminated session does not carry its cause and actor; ';
  end if;
  select count(*) into n2 from public.responses where session_id = v_sess;
  if n2 <> n then ok := false; detail := detail || 'recorded work was discarded by the termination; '; end if;
  select count(*) into n from public.audit_log
   where action in ('assessment_session.terminated','assessment_session.deadline_extended');
  if n < 2 then ok := false; detail := detail || 'the termination and extension were not both audited; '; end if;
  -- a learner cannot end their own or anyone's session
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  begin
    perform public.terminate_session(v_sess, 'ADMINISTRATIVE_TERMINATION', 'probe');
    ok := false; detail := detail || 'a learner terminated a session; ';
  exception when others then null; end;
  perform selftest.as_owner();
  test_id := 'F04-T06'; invariant := 'doc 04 §5 / INV-17';
  if ok then detail := format('an extension is bounded and audited; a termination names one of the four causes and its actor, retains all %s response(s), and a learner cannot perform one', n2); end if;
  return next;

  -- =========================================================================
  -- F04-T07 doc 06 §7: integrity signals recorded, never scored
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.purge_certificates();
  s := selftest.boot_attempt(true);
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  perform public.record_integrity_signal(s, 'VISIBILITY_CHANGE', jsonb_build_object('hidden_ms', 1200));
  perform public.record_integrity_signal(s, 'RECONNECT', '{}'::jsonb);
  perform selftest.as_owner();
  select count(*) into n from public.integrity_signals where session_id = s;
  if n <> 2 then ok := false; detail := detail || format('%s signal(s) recorded, expected 2; ', n); end if;
  select aa2.ok, aa2.detail into v_ok, v_detail from public.assert_integrity_never_scores() aa2;
  if not v_ok then ok := false; detail := detail || v_detail || '; '; end if;
  -- another learner cannot plant a signal on this session
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  begin
    perform public.record_integrity_signal(s, 'NAVIGATION', '{}'::jsonb);
    ok := false; detail := detail || 'a second learner recorded a signal on this session; ';
  exception when others then null; end;
  perform selftest.as_owner();
  test_id := 'F04-T07'; invariant := 'doc 06 §7 / INV-11-shaped';
  if ok then detail := format('%s signal(s) recorded on the learner''s own session; no scoring function or view can read the table and it carries no verdict column; a second learner is refused', n); end if;
  return next;

  -- =========================================================================
  -- F04-T08 D1: OFFICIAL arrives the ordinary way, and only here
  -- =========================================================================
  ok := true; detail := '';
  select aa2.ok, aa2.detail into v_ok, v_detail from public.assert_official_evidence_bootstrap() aa2;
  if not v_ok then ok := false; detail := detail || v_detail || '; '; end if;
  select evidence_class::text into bad from public.assessment_results
   where session_id = s and supersedes_result_id is null;
  if bad <> 'OFFICIAL' then ok := false; detail := detail || format('bootstrap evidence is %s, not OFFICIAL; ', bad); end if;
  select count(*) into n from public.institutions where not is_synthetic and not is_official_bootstrap;
  if n > 0 then ok := false; detail := detail || format('%s non-synthetic tenant(s) outside the bootstrap; ', n); end if;
  -- the guard refuses a second official tenant
  begin
    insert into public.institutions (slug, name, is_synthetic) values ('probe-official', 'Probe', false);
    ok := false; detail := detail || 'a non-synthetic institution was created outside the bootstrap; ';
  exception when others then null; end;
  -- monotonicity untouched
  if public.evidence_class_min('SYNTHETIC','OFFICIAL') <> 'SYNTHETIC' then
    ok := false; detail := detail || 'evidence-class monotonicity changed; ';
  end if;
  test_id := 'F04-T08'; invariant := 'D1 / INV-20 / INV-21';
  if ok then detail := 'the bootstrap tenant is the only non-synthetic one, its evidence derives OFFICIAL the ordinary way, a second official tenant is refused, and min(derived, override) is unchanged'; end if;
  return next;

  -- =========================================================================
  -- F04-T09 §8: a certificate is issued once, idempotently
  -- =========================================================================
  ok := true; detail := '';
  select * into e from public.certificate_eligibility(s);
  if not e.eligible then ok := false; detail := detail || 'an OFFICIAL passing session is not eligible: ' || e.reason || '; '; end if;
  select * into c from public.certificate_prepare(s, 1::smallint);
  v_cert := c.certificate_id;
  perform public.certificate_seal(v_cert, 1::smallint, repeat('a', 64));
  -- a second prepare observes the first rather than minting a second
  select * into c from public.certificate_prepare(s, 1::smallint);
  if c.certificate_id <> v_cert then ok := false; detail := detail || 'a second prepare minted a second certificate; '; end if;
  if not c.already_sealed then ok := false; detail := detail || 'the second prepare did not see the sealed certificate; '; end if;
  select count(*) into n from public.certificates where session_id = s;
  if n <> 1 then ok := false; detail := detail || format('%s certificate rows for one session; ', n); end if;
  -- the payload carries every protected field
  select canonical_payload into v_detail from public.certificates where id = v_cert;
  foreach bad in array array['certificate_number','identity_snapshot_hash','result','issued_at',
                             'plp_release_id','release_content_sha256','assessment_definition_id',
                             'assessment_definition_version','scoring_policy_version','key_version'] loop
    if not (v_detail::jsonb ? bad) then
      ok := false; detail := detail || format('the payload omits %s; ', bad);
    end if;
  end loop;
  -- immutability
  begin
    update public.certificates set canonical_payload = '{}'::jsonb where id = v_cert;
    ok := false; detail := detail || 'a certificate payload was edited in place; ';
  exception when others then null; end;
  begin
    delete from public.certificates where id = v_cert;
    ok := false; detail := detail || 'a certificate was deleted; ';
  exception when others then null; end;
  begin
    update public.certificate_identity_snapshots set name_as_issued = 'Tampered'
     where id = (select snapshot_id from public.certificates where id = v_cert);
    ok := false; detail := detail || 'an identity snapshot was edited (INV-30); ';
  exception when others then null; end;
  test_id := 'F04-T09'; invariant := 'INV-05 / INV-30 / §8';
  if ok then detail := 'one certificate per session; a second prepare observes it; the payload carries all ten protected fields; payload, row and snapshot are each immutable'; end if;
  return next;

  -- =========================================================================
  -- F04-T10 D3a/D3b: the token is opaque; the public payload is closed
  -- =========================================================================
  ok := true; detail := '';
  select verification_token, certificate_number into v_row from public.certificates where id = v_cert;
  v_tok := v_row.verification_token;
  if length(v_tok) < 43 then ok := false; detail := detail || 'the verification token is too short to be high-entropy; '; end if;
  if strpos(v_tok, v_row.certificate_number) > 0 or strpos(v_row.certificate_number, v_tok) > 0 then
    ok := false; detail := detail || 'the token is derivable from the certificate number; ';
  end if;
  if v_tok = s::text or strpos(v_tok, s::text) > 0 then
    ok := false; detail := detail || 'the token contains the session id; ';
  end if;
  if v_tok ~ '^[0-9]+$' then ok := false; detail := detail || 'the token is a sequence; '; end if;
  select aa2.ok, aa2.detail into v_ok, v_detail from public.assert_public_surface() aa2;
  if not v_ok then ok := false; detail := detail || v_detail || '; '; end if;
  -- §9 wants the anonymous principal exercised, not a privilege query about
  -- it. anon reaches the one declared projection and nothing beyond it.
  begin
    perform selftest.as_anon();
    select count(*) into n from public.verify_certificate(v_tok);
    perform selftest.as_owner();
    if n <> 1 then ok := false; detail := detail || 'anon could not verify an issued certificate; '; end if;
  exception when others then
    ok := false; detail := detail || format('anon was refused the public projection: %s; ', sqlerrm);
  end;
  perform selftest.as_owner();
  begin
    perform selftest.as_anon();
    perform public.certificate_eligibility(s);
    perform selftest.as_owner();
    ok := false; detail := detail || 'anon reached an engine function beyond the public projection; ';
  exception when others then null; end;
  perform selftest.as_owner();
  select count(*) into n from pg_proc p2 join pg_namespace ns2 on ns2.oid = p2.pronamespace
   where ns2.nspname = 'public' and has_function_privilege('anon', p2.oid, 'EXECUTE')
     and p2.proname <> 'verify_certificate';
  if n <> 0 then
    ok := false; detail := detail || format('%s function(s) beyond the declared projection are anon-executable; ', n);
  end if;
  select * into v from public.verify_certificate(v_tok);
  if v.institution is null or v.validity <> 'BERLAKU' then
    ok := false; detail := detail || 'the public projection did not resolve an issued certificate; ';
  end if;
  -- an unknown token yields nothing at all, not a distinguishable error
  select count(*) into n from public.verify_certificate(repeat('z', 43));
  if n <> 0 then ok := false; detail := detail || 'an unknown token resolved to a row; '; end if;
  -- revocation changes the public answer and keeps the row
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  perform public.revoke_certificate(v_cert, 'selftest probe');
  perform selftest.as_owner();
  select * into v from public.verify_certificate(v_tok);
  if v.validity <> 'DICABUT' then ok := false; detail := detail || 'revocation did not change the public response; '; end if;
  select count(*) into n from public.certificates where id = v_cert;
  if n <> 1 then ok := false; detail := detail || 'revocation removed the row; '; end if;
  test_id := 'F04-T10'; invariant := 'D3a / D3b / INV-38';
  if ok then detail := 'the token is opaque and derivable from nothing; the public payload is exactly the five enumerated fields and reads no identity column; '
    || 'an unknown token yields no row; revocation changes the answer and keeps the row; the anonymous principal reaches verify_certificate and nothing else'; end if;
  return next;

  -- =========================================================================
  -- F04-T11 INV-20: non-OFFICIAL evidence can never reach ELIGIBLE
  -- =========================================================================
  ok := true; detail := '';
  select s2.id into v_sess from public.assessment_sessions s2
    join public.institutions i on i.id = s2.institution_id
   where i.is_synthetic and s2.status = 'FINALIZED' limit 1;
  if v_sess is null then
    -- run one on the synthetic cycle fixture so the negative half is real
    perform selftest.as_user('siklus-email@synthetic.pintar.test');
    declare v_aa2 uuid; begin
      select m.post_test_assignment into v_aa2 from public.my_learning_assignments() m limit 1;
      if v_aa2 is not null then
        v_sess := public.start_learning_session(v_aa2);
        -- answer_paper, not an inline loop: the cycle fixture carries
        -- MCQ_MULTI items and the multi shape is {"posisi": [n, ...]}
        perform selftest.answer_paper(v_sess, true);
        perform public.finish_my_session(v_sess);
      end if;
    end;
    perform selftest.as_owner();
  end if;
  if v_sess is null then
    ok := false; detail := 'no synthetic session available; the negative half of INV-20 is untested; ';
  else
    select * into e from public.certificate_eligibility(v_sess);
    if e.eligible then ok := false; detail := detail || 'a SYNTHETIC session reached ELIGIBLE; '; end if;
    if e.reason !~ 'OFFICIAL' then
      ok := false; detail := detail || format('it was refused, but not for its evidence class: %s; ', e.reason);
    end if;
    select count(*) into n from public.official_sessions where id = v_sess;
    if n <> 0 then ok := false; detail := detail || 'a SYNTHETIC session appears in official_sessions; '; end if;
    begin
      perform public.certificate_prepare(v_sess, 1::smallint);
      ok := false; detail := detail || 'a certificate was prepared for a SYNTHETIC session; ';
    exception when others then null; end;
  end if;
  select aa2.ok, aa2.detail into v_ok, v_detail from public.assert_evidence_consumer_boundary() aa2;
  if not v_ok then ok := false; detail := detail || v_detail || '; '; end if;
  test_id := 'F04-T11'; invariant := 'INV-20';
  if ok then detail := 'a SYNTHETIC session is refused eligibility for its evidence class, appears in no official view, and cannot be prepared; the raw-evidence grant boundary holds'; end if;
  return next;

  -- =========================================================================
  -- F04-T12 §9 cross-tenant: every certificate RPC refuses a foreign learner
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  begin
    perform public.my_certificate(s);
    ok := false; detail := detail || 'a learner from another tenant read this certificate; ';
  exception when others then null; end;
  perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
  begin
    perform public.my_certificate(s);
    ok := false; detail := detail || 'a learner from a third tenant read this certificate; ';
  exception when others then null; end;
  begin
    perform public.revoke_certificate(v_cert, 'probe');
    ok := false; detail := detail || 'a learner revoked a certificate; ';
  exception when others then null; end;
  perform selftest.as_owner();
  -- The internal engine is unreachable by any client role. verify_certificate
  -- is deliberately NOT in this list: 0048 grants it to anon, and F04-T10
  -- asserts that grant by name and by set equality. Leaving it here and
  -- quietly dropping the assertion when it went red is exactly the move that
  -- turns a suite into decoration.
  foreach bad in array array['certificate_prepare','certificate_seal','certificate_eligibility'] loop
    select string_agg(rr.rolname, ', ') into v_detail from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace, unnest(array['anon','authenticated']) rr(rolname)
     where ns.nspname='public' and p.proname = bad
       and has_function_privilege(rr.rolname, p.oid, 'EXECUTE');
    if v_detail is not null then
      ok := false; detail := detail || format('%s is executable by %s; ', bad, v_detail);
    end if;
  end loop;
  -- and the one exposed projection is exposed to anon ONLY -- a signed-in
  -- learner reaching it would be a second, unclassified path to the same data
  if has_function_privilege('authenticated', 'public.verify_certificate(text)'::regprocedure, 'EXECUTE') then
    ok := false; detail := detail || 'verify_certificate is executable by authenticated as well as anon; ';
  end if;
  test_id := 'F04-T12'; invariant := 'INV-13 / §7';
  if ok then detail := 'learners from two other tenants are refused on the read and the revoke; the three internal certificate functions are executable by no client role, and the public projection by anon only'; end if;
  return next;

  -- =========================================================================
  -- F04-T13 D2: the record class, and a transfer carrying neither
  -- =========================================================================
  ok := true; detail := '';
  foreach bad in array array['certificates','certificate_identity_snapshots'] loop
    if not exists (select 1 from public.record_class_registry
                    where table_name = bad and portability = 'INSTITUTION_SCOPED') then
      ok := false; detail := detail || format('%s is not INSTITUTION_SCOPED; ', bad);
    end if;
  end loop;
  select count(*) into n from public.record_class_registry where portability = 'PORTABLE';
  if exists (select 1 from public.record_class_registry
              where portability = 'PORTABLE' and table_name like 'certificate%') then
    ok := false; detail := detail || 'a certificate table is marked portable; D2 says otherwise; ';
  end if;
  test_id := 'F04-T13'; invariant := 'D2 / INV-25';
  if ok then detail := format('both certificate tables are INSTITUTION_SCOPED, so a transfer carries neither; %s portable class(es) remain, and no certificate table is among them', n); end if;
  return next;

  -- =========================================================================
  -- F04-T15 INV-35 / doc 16 §4: the four adversarial MCQ banks. Each must make
  -- Publish Readiness name ITS OWN finding and no other, and each must clear to
  -- READY when the content is actually repaired -- not when the finding is
  -- acknowledged away, which would test the acknowledgement flow and nothing
  -- about the detector.
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.purge_adversarial();
  foreach bad in array array['CORRECT_OPTION_LENGTH_IMBALANCE','ANSWER_POSITION_SKEW',
                             'IMPLAUSIBLE_DISTRACTOR','STEM_REVEALS_ANSWER'] loop
    v_course := selftest.adversarial_bank(bad);
    perform public.run_mcq_quality(v_course);
    select p.status, p.blockers into v_status, v_blockers from public.publish_readiness(v_course) p;

    if v_status = 'READY' then
      ok := false; detail := detail || format('%s: the bank published clean; ', bad);
    end if;
    -- BLOCKED for the ERROR pattern, ACTION_REQUIRED for the warnings
    if bad = 'STEM_REVEALS_ANSWER' and v_status <> 'BLOCKED' then
      ok := false; detail := detail || format('%s reported %s, not BLOCKED; ', bad, v_status);
    elsif bad <> 'STEM_REVEALS_ANSWER' and v_status <> 'ACTION_REQUIRED' then
      ok := false; detail := detail || format('%s reported %s, not ACTION_REQUIRED; ', bad, v_status);
    end if;
    -- named, and named uniquely: a bank that trips all four would satisfy a
    -- "contains" assertion and prove nothing about which detector fired
    if not exists (select 1 from unnest(v_blockers) b where b like 'mutu soal: ' || bad || '%') then
      ok := false; detail := detail || format('%s was not named in the blockers (%s); ',
                                              bad, array_to_string(v_blockers, ' | '));
    end if;
    select count(distinct mf.pattern_class) into n from public.mcq_quality_findings mf
     where mf.course_id = v_course and mf.acknowledged_at is null;
    if n <> 1 then
      ok := false; detail := detail || format('%s raised %s distinct pattern(s), not 1; ', bad, n);
    end if;

    -- and now repair the CONTENT, not the finding
    if bad = 'CORRECT_OPTION_LENGTH_IMBALANCE' then
      update public.item_options o set body = 'Dua belas satuan penuh'
       where o.is_correct and o.item_id in (select i.id from public.items i
              join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
             where m.course_id = v_course);
    elsif bad = 'ANSWER_POSITION_SKEW' then
      -- spread the correct answer across the four positions
      with ranked as (
        select i.id, (row_number() over (order by i.created_at, i.id)) rn
          from public.items i join public.lessons l on l.id = i.lesson_id
          join public.modules m on m.id = l.module_id where m.course_id = v_course)
      update public.item_options o
         set is_correct = (o.label = (array['A','B','C','D'])[(r.rn % 4) + 1])
        from ranked r where r.id = o.item_id;
    elsif bad = 'IMPLAUSIBLE_DISTRACTOR' then
      update public.item_options o set body = 'Meter, karena benda itu diukur dengan penggaris pendek'
       where o.label = 'D' and o.item_id in (select i.id from public.items i
              join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
             where m.course_id = v_course);
    else
      update public.items i set stem = replace(i.stem, 'proses fotosintesis terjadi', 'proses itu terjadi')
       where i.lesson_id in (select l.id from public.lessons l
              join public.modules m on m.id = l.module_id where m.course_id = v_course);
    end if;

    perform public.run_mcq_quality(v_course);
    select p.status, p.blockers into v_status, v_blockers from public.publish_readiness(v_course) p;
    if v_status <> 'READY' then
      ok := false; detail := detail || format('%s did not clear to READY after the repair (%s: %s); ',
                                              bad, v_status, array_to_string(v_blockers, ' | '));
    end if;
  end loop;

  -- the control: a bank with none of the four patterns must reach READY on its
  -- own, or "READY after repair" would only be proving that READY is reachable
  v_course := selftest.adversarial_bank('CLEAN');
  perform public.run_mcq_quality(v_course);
  select p.status into v_status from public.publish_readiness(v_course) p;
  if v_status <> 'READY' then
    ok := false; detail := detail || format('the clean control bank reported %s; ', v_status);
  end if;
  perform selftest.purge_adversarial();
  test_id := 'F04-T15'; invariant := 'INV-35 / doc 16 §4';
  if ok then detail := 'four adversarial banks, each raising exactly its own pattern, each named by Publish Readiness '
    || 'as BLOCKED or ACTION_REQUIRED, and each clearing to READY only after the content itself is repaired; '
    || 'a clean control bank reaches READY unaided'; end if;
  return next;

  -- =========================================================================
  -- F04-T16 doc 16 §4: the eligibility-probe set. A PUBLIC_DEMO session opened
  -- on the OFFICIAL tenant -- so the channel, and only the channel, is what
  -- degrades it -- then walked at every surface that consumes evidence:
  -- analytics, psychometrics, Question Health and certificate eligibility.
  -- The SYNTHETIC half of the same walk is F04-T11; this is the half that was
  -- untestable before D1 gave the suite a non-synthetic tenant to contrast
  -- against.
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_owner();
  select en.id into v_enr from public.enrollments en
    join public.accounts ac on ac.person_id = en.person_id
    join auth.users au on au.id = ac.auth_user_id
   where en.institution_id = f.inst and au.email = 'boot-siswa@bootstrap.pintar.test'
     and en.status = 'ACTIVE' limit 1;
  if v_enr is null then
    ok := false; detail := 'the bootstrap learner has no active enrolment; the PUBLIC_DEMO probe cannot run; ';
  else
    -- The mode is the definition's own formal stage, NOT 'PUBLIC_DEMO'. Opening
    -- it in PUBLIC_DEMO mode would be refused by §8's "only formal stages
    -- certify" before the evidence class was ever consulted, and the probe
    -- would pass while proving the wrong thing. Here the mode certifies, the
    -- tenant is official, and the delivery channel is the single difference.
    v_demo := public.open_assessment_session(
      v_enr, f.defn, f.release, 'PUBLIC_DEMO',
      (select d.mode from public.assessment_definitions d where d.id = f.defn),
      public.engine_version(), public.scoring_policy_version());
    perform public.assemble_session(v_demo);

    -- it is the channel that decides, on a tenant whose other sessions are OFFICIAL
    if public.effective_evidence_class(v_demo) <> 'PUBLIC_DEMO' then
      ok := false; detail := detail || format('a PUBLIC_DEMO session on the official tenant derived %s; ',
                                              public.effective_evidence_class(v_demo));
    end if;

    -- analytics: the three official_* views
    foreach bad in array array['official_sessions','official_responses','official_results'] loop
      execute format('select count(*) from public.%I v where %s = $1', bad,
                     case bad when 'official_sessions' then 'v.id' else 'v.session_id' end)
        into n using v_demo;
      if n <> 0 then ok := false; detail := detail || format('a PUBLIC_DEMO session reached %s; ', bad); end if;
    end loop;

    -- psychometrics and Question Health: every view that derives an empirical
    -- number does so from official_responses, so none of them may see it
    select count(*) into n from public.service_item_statistics st
     where st.item_id in (select p2.item_id from public.presented_items p2 where p2.session_id = v_demo)
       and st.evidence_count > 0
       and exists (select 1 from public.responses r2 join public.presented_items p3 on p3.id = r2.presented_item_id
                    where p3.session_id = v_demo);
    -- the item may legitimately carry statistics from OFFICIAL attempts; what
    -- must be true is that this session contributed none of them
    select count(*) into n2 from public.official_responses r3 where r3.session_id = v_demo;
    if n2 <> 0 then ok := false; detail := detail || 'PUBLIC_DEMO responses entered the psychometrics source view; '; end if;
    select count(*) into n from public.service_distractor_uptake du
     where du.item_id in (select p4.item_id from public.presented_items p4 where p4.session_id = v_demo)
       and du.chosen_count > (select count(*) from public.official_responses r4
                               join public.presented_items p5 on p5.id = r4.presented_item_id
                              where p5.item_id = du.item_id and (r4.value->>'pilihan') = du.label);
    if n <> 0 then ok := false; detail := detail || 'distractor uptake counted a PUBLIC_DEMO response; '; end if;

    -- Question Health: no row may be raised from this session's evidence
    select count(*) into n from public.question_health qh
     where qh.item_id in (select p6.item_id from public.presented_items p6 where p6.session_id = v_demo)
       and qh.state <> 'INSUFFICIENT_EVIDENCE'
       and not exists (select 1 from public.official_responses r5
                        join public.presented_items p7 on p7.id = r5.presented_item_id
                       where p7.item_id = qh.item_id);
    if n <> 0 then ok := false; detail := detail || 'Question Health moved off INSUFFICIENT_EVIDENCE on PUBLIC_DEMO evidence alone; '; end if;

    -- certificate eligibility, and the refusal must name the evidence class
    select * into e from public.certificate_eligibility(v_demo);
    if e.eligible then ok := false; detail := detail || 'a PUBLIC_DEMO session reached ELIGIBLE; '; end if;
    if e.reason !~ 'OFFICIAL' then
      ok := false; detail := detail || format('refused, but not for its evidence class: %s; ', e.reason);
    end if;
    begin
      perform public.certificate_prepare(v_demo, 1::smallint);
      ok := false; detail := detail || 'a certificate was prepared for a PUBLIC_DEMO session; ';
    exception when others then null; end;

    -- and it is a real session, not an empty one that would pass every check
    select count(*) into n from public.presented_items where session_id = v_demo;
    if n = 0 then ok := false; detail := detail || 'the PUBLIC_DEMO probe drew no items, so it proves nothing; '; end if;
  end if;
  perform selftest.as_owner();
  test_id := 'F04-T16'; invariant := 'INV-20 / doc 16 §4';
  if ok then detail := format('a PUBLIC_DEMO session of %s item(s) opened on the OFFICIAL tenant derives PUBLIC_DEMO from the channel alone, '
    || 'reaches none of the three official views, contributes to no psychometric or Question Health figure, '
    || 'is refused certificate eligibility for its evidence class and cannot be prepared', n); end if;
  return next;

  -- =========================================================================
  -- F04-T17 ADR-0011 / INV-04: the ad-hoc exemption, on all three verbs,
  -- against a course that is really sealed.
  --
  -- This exists because 0046's own probe is conditional on a sealed course and
  -- migrations run BEFORE seeds, so on a from-empty replay it proves nothing —
  -- and the one environment that did run it (CI's upgrade path, on seeded
  -- data) failed on the verb 0046 forgot. Fixtures always exist here.
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_owner();
  -- aliased co/rl: `c` and `r` are record variables in this function
  v_course := (select co.id from public.courses co
                 join public.plp_releases rl on rl.course_id = co.id
                where co.institution_id = f.inst
                  and rl.status in ('FROZEN','PUBLISHED','SUPERSEDED') limit 1);
  if v_course is null then
    ok := false; detail := 'no sealed course in the bootstrap tenant; this test would prove nothing; ';
  elsif not public.content_is_sealed(v_course) then
    ok := false; detail := 'the probe course is not sealed; this test would prove nothing; ';
  else
    -- a release-bound definition is still refused
    begin
      insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
        item_count, difficulty_mix, safety_critical_minimum, passing_rules, shuffle_policy,
        allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit, status)
      values (f.inst, v_course, 'probe taught ' || gen_random_uuid()::text, 'TEST', 'TEST', 3,
              jsonb_build_object('MUDAH', 3), 0, jsonb_build_object('mastery_min', 0.6),
              'ITEMS_AND_OPTIONS', false, false, 0, 1, 'INGESTED');
      ok := false; detail := detail || 'a release-bound definition was created under a sealed course; ';
    exception when others then
      if sqlerrm !~ 'frozen course' then
        ok := false; detail := detail || format('refused, but not as taught content: %s; ', left(sqlerrm, 60));
      end if;
    end;

    -- an ad-hoc one is permitted, and moves no sealed hash
    insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
      item_count, difficulty_mix, safety_critical_minimum, passing_rules, shuffle_policy,
      allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit, status, is_ad_hoc)
    values (f.inst, v_course, 'probe ad-hoc ' || gen_random_uuid()::text, 'QUICK', 'TEST', 3,
            jsonb_build_object('MUDAH', 3), 0, jsonb_build_object('mastery_min', 0.6),
            'ITEMS_AND_OPTIONS', false, false, 0, 1, 'INGESTED', true)
    returning id into v_def2;
    select count(*) into n from public.plp_releases rl
     where rl.content_sha256 is not null
       and rl.content_sha256 <> public.course_content_sha256(rl.course_id);
    if n <> 0 then ok := false; detail := detail || format('creating an ad-hoc definition moved %s sealed hash(es); ', n); end if;

    -- it may be edited as an ad-hoc instrument ...
    begin
      update public.assessment_definitions set item_count = 4 where id = v_def2;
    exception when others then
      ok := false; detail := detail || format('an ad-hoc definition could not be edited: %s; ', left(sqlerrm, 60));
    end;
    -- ... but never promoted into the release
    begin
      update public.assessment_definitions set is_ad_hoc = false where id = v_def2;
      ok := false; detail := detail || 'an ad-hoc definition was promoted into a release; ';
    exception when others then
      if sqlerrm !~ 'never becomes part of a release' then
        ok := false; detail := detail || format('the promotion was refused for the wrong reason: %s; ', left(sqlerrm, 60));
      end if;
    end;
    -- and it can be removed again. This is the verb 0046 forgot.
    begin
      delete from public.assessment_definitions where id = v_def2;
    exception when others then
      ok := false; detail := detail || format('an ad-hoc definition could not be removed: %s; ', left(sqlerrm, 60));
    end;
    select count(*) into n from public.assessment_definitions where id = v_def2;
    if n <> 0 then ok := false; detail := detail || 'the ad-hoc definition survived its delete; '; end if;
    select count(*) into n from public.plp_releases rl
     where rl.content_sha256 is not null
       and rl.content_sha256 <> public.course_content_sha256(rl.course_id);
    if n <> 0 then ok := false; detail := detail || format('removing an ad-hoc definition moved %s sealed hash(es); ', n); end if;
  end if;
  test_id := 'F04-T17'; invariant := 'INV-04 / ADR-0011';
  if ok then detail := 'under a sealed course a release-bound definition is refused and an ad-hoc one is created, edited and removed, '
    || 'moving no sealed release hash and never becoming part of a release'; end if;
  return next;

  -- =========================================================================
  -- F04-T14 the standing gates still hold with the whole phase present
  -- =========================================================================
  ok := true; detail := '';
  for bad in select unnest(array['assert_telemetry_write_only','assert_evidence_consumer_boundary',
                                 'assert_learner_rpcs_are_guarded','assert_engine_takes_no_identity',
                                 'assert_public_surface','assert_audit_write_arity',
                                 'assert_mode_policy_complete','assert_integrity_never_scores',
                                 'assert_official_evidence_bootstrap']) loop
    execute format('select ok, detail from public.%I()', bad) into v_ok, v_detail;
    if not v_ok then ok := false; detail := detail || bad || ': ' || v_detail || '; '; end if;
  end loop;
  test_id := 'F04-T14'; invariant := 'phase gate';
  if ok then detail := 'nine standing assertions all report clean with every FABLE-04 object present'; end if;
  return next;

  perform selftest.purge_certificates();
  perform selftest.as_owner();
  test_id := 'F04-DONE'; invariant := '-'; ok := true;
  detail := format('elapsed %s ms', round(extract(epoch from clock_timestamp() - t0) * 1000));
  return next;
end $$;
revoke all on function selftest.run_fable04() from public;

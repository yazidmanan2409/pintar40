-- FABLE-02 database-layer selftest. Sibling of fable01.sql, same row shape,
-- same throwaway `selftest` schema.
--
-- Why these assertions live here and not in a migration: they need seeded
-- institutions and persons, and `supabase db reset` applies migrations BEFORE
-- the seed. A migration must replay against an empty database, so its own
-- verification block stays structural; anything that needs a data row belongs
-- in this runner, which runs after the seed. Migration
-- 20260912114854_content_lifecycle originally carried this proof inline and
-- failed every clean-database replay for exactly that reason.
--
-- Ordering: this file depends on fable01.sql having been applied first, for the
-- role-switch helpers. selftest/run.ts applies them in that order and the
-- assertion below states the dependency rather than leaving it implicit.
-- Most assertions run as the owner -- they are about triggers, which fire for
-- every role -- but the freeze and publish gates are *about* who the caller
-- is, so those steps switch to a real persona. Never applied as a migration.

create schema if not exists selftest;

-- Same privilege preamble as fable01.sql: a clean database grants nothing on a
-- new schema, and the harness switches roles (CI-01).
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply selftest/db/fable01.sql before fable02.sql: the role-switch helpers are missing';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Fixture teardown.
--
-- The taught-content immutability trigger (INV-04) correctly refuses to delete
-- content under a frozen course, so a probe that reaches FROZEN cannot be
-- removed the ordinary way. The harness owns these tables, so it disables that
-- one trigger for the duration of the delete and re-enables it immediately.
-- Nothing is weakened anywhere that matters: this file is never applied as a
-- migration and never present in production, the window is a single statement,
-- and because run_fable02() is entered as one statement any failure rolls the
-- disable back with everything else.
-- ---------------------------------------------------------------------------
create or replace function selftest.purge_probe_content(p_prefix text) returns void
language plpgsql set search_path = public, pg_temp as $$
declare t text; tables text[] := array['courses','modules','lessons','learning_objectives',
                                       'items','item_options','assessment_definitions'];
begin
  foreach t in array tables loop
    execute format('alter table public.%1$I disable trigger %1$s_taught_immutable', t);
  end loop;

  -- evidence first: presented items are write-once and sessions carry
  -- immutable provenance, so the same trigger-disable applies. Sessions exist
  -- only for probe courses, so this removes nothing a real run would keep.
  alter table public.presented_items disable trigger presented_items_immutable;
  alter table public.responses disable trigger responses_write;
  alter table public.assessment_results disable trigger assessment_results_write;
  alter table public.assessment_sessions disable trigger assessment_sessions_provenance;
  alter table public.assessment_sessions disable trigger assessment_sessions_status;
  alter table telemetry.hesitation_events disable trigger hesitation_events_write;
  alter table telemetry.assistance_events disable trigger assistance_events_write;
  alter table public.integrity_signals disable trigger integrity_signals_write;
  delete from telemetry.hesitation_events he using public.assessment_sessions s,
                                                public.plp_releases r, public.courses c
   where he.session_id = s.id and s.plp_release_id = r.id and r.course_id = c.id
     and c.title like p_prefix || '%';
  delete from telemetry.assistance_events ae using public.assessment_sessions s,
                                                public.plp_releases r, public.courses c
   where ae.session_id = s.id and s.plp_release_id = r.id and r.course_id = c.id
     and c.title like p_prefix || '%';
  delete from public.integrity_signals isg using public.assessment_sessions s,
                                              public.plp_releases r, public.courses c
   where isg.session_id = s.id and s.plp_release_id = r.id and r.course_id = c.id
     and c.title like p_prefix || '%';
  alter table telemetry.hesitation_events enable trigger hesitation_events_write;
  alter table telemetry.assistance_events enable trigger assistance_events_write;
  alter table public.integrity_signals enable trigger integrity_signals_write;
  delete from public.evidence_class_overrides eo using public.assessment_sessions s,
                                                    public.plp_releases r, public.courses c
   where eo.session_id = s.id and s.plp_release_id = r.id and r.course_id = c.id
     and c.title like p_prefix || '%';
  delete from public.assessment_results ar using public.assessment_sessions s,
                                            public.plp_releases r, public.courses c
   where ar.session_id = s.id and s.plp_release_id = r.id and r.course_id = c.id
     and c.title like p_prefix || '%';
  delete from public.responses rs using public.assessment_sessions s,
                                       public.plp_releases r, public.courses c
   where rs.session_id = s.id and s.plp_release_id = r.id and r.course_id = c.id
     and c.title like p_prefix || '%';
  delete from public.presented_items pi using public.assessment_sessions s,
                                            public.plp_releases r, public.courses c
   where pi.session_id = s.id and s.plp_release_id = r.id and r.course_id = c.id
     and c.title like p_prefix || '%';
  delete from public.assessment_sessions s using public.plp_releases r, public.courses c
   where s.plp_release_id = r.id and r.course_id = c.id and c.title like p_prefix || '%';
  alter table public.presented_items enable trigger presented_items_immutable;
  alter table public.responses enable trigger responses_write;
  alter table public.assessment_results enable trigger assessment_results_write;
  alter table public.assessment_sessions enable trigger assessment_sessions_provenance;
  alter table public.assessment_sessions enable trigger assessment_sessions_status;

  delete from public.learning_assignment_release_moves mv using public.learning_assignments la,
                                                              public.courses c
   where mv.learning_assignment_id = la.id and la.course_id = c.id
     and c.title like p_prefix || '%';
  delete from public.assessment_assignments aa using public.assessment_definitions ad,
                                                    public.courses c
   where aa.assessment_definition_id = ad.id and ad.course_id = c.id
     and c.title like p_prefix || '%';
  delete from public.learning_assignments la using public.courses c
   where la.course_id = c.id and c.title like p_prefix || '%';
  delete from public.ingest_batches ib
   where ib.raw_payload::text like '%' || p_prefix || '%';
  delete from public.coaching_findings f using public.courses c
   where f.course_id = c.id and c.title like p_prefix || '%';
  delete from public.mcq_quality_findings f using public.courses c
   where f.course_id = c.id and c.title like p_prefix || '%';
  delete from public.question_health qh using public.items i, public.lessons l,
                                           public.modules m, public.courses c
   where qh.item_id = i.id and i.lesson_id = l.id and l.module_id = m.id and m.course_id = c.id
     and c.title like p_prefix || '%';
  delete from public.plp_releases r using public.courses c
   where r.course_id = c.id and c.title like p_prefix || '%';
  delete from public.assessment_definitions a using public.courses c
   where c.title like p_prefix || '%'
     and (a.course_id = c.id
       or a.module_id in (select m.id from public.modules m where m.course_id = c.id));
  delete from public.item_options o where o.item_id in (
    select i.id from public.items i
      join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
     where c.title like p_prefix || '%');
  delete from public.items i where i.lesson_id in (
    select l.id from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
     where c.title like p_prefix || '%');
  delete from public.learning_objectives lo where lo.lesson_id in (
    select l.id from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
     where c.title like p_prefix || '%');
  delete from public.lessons l where l.module_id in (
    select m.id from public.modules m join public.courses c on c.id = m.course_id
     where c.title like p_prefix || '%');
  delete from public.modules m using public.courses c
   where m.course_id = c.id and c.title like p_prefix || '%';
  delete from public.courses c where c.title like p_prefix || '%';

  foreach t in array tables loop
    execute format('alter table public.%1$I enable trigger %1$s_taught_immutable', t);
  end loop;
end $$;
revoke all on function selftest.purge_probe_content(text) from public;

-- ---------------------------------------------------------------------------
-- INV-28 concurrency fixture. A single connection cannot prove that the unique
-- index -- rather than a preceding SELECT -- arbitrates a race: both shapes
-- pass. selftest/run.ts therefore drives two real psql connections through
-- these three helpers, and the assertion lives here where the rest of the
-- contract does.
-- ---------------------------------------------------------------------------
create or replace function selftest.concurrency_fixture() returns uuid
language plpgsql set search_path = public, pg_temp as $$
declare v_inst uuid; v_guru uuid; v_hod uuid; v_enr uuid;
        c uuid; m uuid; l uuid; i uuid; r uuid; d uuid; s uuid; pi uuid;
begin
  perform selftest.purge_probe_content('selftest conc');
  select a.person_id into v_guru from public.accounts a join auth.users u on u.id=a.auth_user_id
   where u.email='alpha-guru@synthetic.pintar.test';
  select a.person_id into v_hod from public.accounts a join auth.users u on u.id=a.auth_user_id
   where u.email='alpha-hod@synthetic.pintar.test';
  select ra.institution_id into v_inst from public.role_assignments ra
   where ra.person_id=v_hod and ra.revoked_at is null limit 1;
  select e.id into v_enr from public.enrollments e join public.accounts a on a.person_id=e.person_id
    join auth.users u on u.id=a.auth_user_id
   where u.email='alpha-siswa-1@synthetic.pintar.test' and e.institution_id=v_inst limit 1;

  insert into public.courses (institution_id,subject,stage,grade_label,title,author_person_id)
    values (v_inst,'Selftest','SD','V','selftest conc probe',v_guru) returning id into c;
  insert into public.modules (course_id,institution_id,ordinal,title,author_person_id)
    values (c,v_inst,1,'M',v_guru) returning id into m;
  insert into public.lessons (module_id,institution_id,ordinal,title,author_person_id)
    values (m,v_inst,1,'L',v_guru) returning id into l;
  insert into public.items (lesson_id,institution_id,item_type,bank_type,stem,author_person_id)
    values (l,v_inst,'MCQ_SINGLE','PRACTICE','soal',v_guru) returning id into i;
  insert into public.plp_releases (institution_id,course_id,version_label,author_person_id)
    values (v_inst,c,'1.0.0',v_guru) returning id into r;
  insert into public.assessment_definitions (institution_id,course_id,title,mode,bank_type,item_count,author_person_id)
    values (v_inst,c,'D','QUICK','PRACTICE',5,v_guru) returning id into d;
  s := public.open_assessment_session(v_enr, d, r, 'ONLINE', 'QUICK', 'engine-0', public.scoring_policy_version());
  update public.assessment_sessions set status='IN_PROGRESS' where id=s;
  insert into public.presented_items (session_id,item_id,position) values (s,i,1) returning id into pi;
  return pi;
end $$;
revoke all on function selftest.concurrency_fixture() from public;

-- Given the receipt both connections raced for, decide whether the database
-- arbitrated correctly: exactly one row, and it holds the payload of whichever
-- connection won -- never a blend, never two rows, never an overwrite.
create or replace function selftest.concurrency_verdict(p_presented uuid, p_expect_rows int)
returns table (ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare n int; digests text;
begin
  select count(*), string_agg(distinct r.value_digest, ',') into n, digests
    from public.responses r where r.presented_item_id = p_presented and r.client_seq = 1;
  ok := (n = p_expect_rows);
  detail := format('%s row(s) on the contested receipt, %s distinct digest(s)', n,
                   coalesce(array_length(string_to_array(digests, ','), 1), 0));
  return next;
end $$;
revoke all on function selftest.concurrency_verdict(uuid, int) from public;

create or replace function selftest.concurrency_teardown() returns void
language plpgsql set search_path = public, pg_temp as $$
begin perform selftest.purge_probe_content('selftest conc'); end $$;
revoke all on function selftest.concurrency_teardown() from public;

create or replace function selftest.run_fable02()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_guru uuid; v_hod uuid; v_admin uuid;
  v_course uuid; v_module uuid; v_lesson uuid; v_lesson2 uuid; v_obj uuid; v_item uuid;
  v_release uuid; v_sha text; v_sha2 text; h1 text; h3 text;
  v_beta uuid; v_hop uuid;
  v_course2 uuid; v_mod2 uuid; v_les2 uuid; v_ip uuid; v_it uuid; v_ie uuid;
  v_def_p uuid; v_def_t uuid; v_def_e uuid; v_group uuid;
  v_bcourse uuid; v_bmod uuid; v_bles uuid;
  v_enr uuid; v_sess uuid; v_rel2 uuid; v_pi uuid; v_class public.evidence_class; v_seed bigint;
  v_r1 uuid; v_r2 uuid; v_out text; v_res1 uuid; v_res2 uuid; v_res3 uuid;
  v_hes uuid; v_sig uuid; v_real uuid; v_real_enr uuid; v_osess uuid; v_ap uuid;
  v_rel3 uuid; v_status text; v_blockers text[]; v_find uuid;
  v_la uuid; v_aa uuid; v_rel4 uuid; v_batch uuid; v_map jsonb; v_node uuid;
  v_pre uuid; v_ie2 uuid; v_grp uuid; v_cohort uuid;
  v_frozen timestamptz; v_published timestamptz;
  n int; n2 int;
  v_inv11_ok boolean; v_inv11_detail text;
  v_inv20_ok boolean; v_inv20 text;
  t0 timestamptz := clock_timestamp();
begin
  -- ------------------------------------------------------------- fixtures
  -- Personas, not "the first row by id": the publish gate is about who the
  -- caller is, so every fixture is pinned to a persona whose capabilities are
  -- known. The seed deletes and recreates its auth users on every run, so the
  -- email join returns exactly the current generation.
  select a.person_id into v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id
   where u.email = 'alpha-guru@synthetic.pintar.test';
  select a.person_id into v_hod from public.accounts a join auth.users u on u.id = a.auth_user_id
   where u.email = 'alpha-hod@synthetic.pintar.test';
  select a.person_id into v_admin from public.accounts a join auth.users u on u.id = a.auth_user_id
   where u.email = 'alpha-admin@synthetic.pintar.test';
  if v_guru is null or v_hod is null or v_admin is null then
    raise exception 'FABLE-02 selftest fixtures missing: run the synthetic seed first';
  end if;
  -- the institution is derived from the admin's own assignment, so the course
  -- is always in the institution whose CAN_PUBLISH holder we later use.
  select ra.institution_id into v_inst from public.role_assignments ra
   where ra.person_id = v_admin and ra.revoked_at is null and ra.role = 'INSTITUTION_ADMIN'
   limit 1;

  perform selftest.purge_probe_content('selftest ');

  -- F02-T01 the transition graph is an allow-list: rows start at INGESTED,
  -- skips are refused, the listed path is permitted.
  ok := true; detail := '';
  begin
    insert into public.courses (institution_id, subject, stage, grade_label, title, status, author_person_id)
      values (v_inst, 'Selftest', 'SMA', 'X', 'selftest lifecycle probe', 'VALIDATED', v_guru);
    ok := false; detail := detail || 'insert at VALIDATED accepted; ';
  exception when others then null; end;

  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Selftest', 'SMA', 'X', 'selftest lifecycle probe', v_guru)
    returning id into v_course;

  begin
    update public.courses set status = 'VALIDATED' where id = v_course;
    ok := false; detail := detail || 'skip INGESTED->VALIDATED accepted; ';
  exception when others then null; end;

  begin
    update public.courses set status = 'STRUCTURED' where id = v_course;
    update public.courses set status = 'VALIDATED'  where id = v_course;
    update public.courses set status = 'IN_REVIEW'  where id = v_course;
  exception when others then
    ok := false; detail := detail || 'legal path refused: ' || sqlerrm || '; ';
  end;
  test_id := 'F02-T01'; invariant := 'INV-22';
  if ok then detail := 'created at INGESTED only; skip refused; listed path permitted'; end if;
  return next;

  -- F02-T02 APPROVED requires a reviewer who is not the author (§2).
  ok := true; detail := '';
  begin
    update public.courses set status = 'APPROVED', reviewed_by_person_id = v_guru where id = v_course;
    ok := false; detail := detail || 'author approved their own content; ';
  exception when others then null; end;
  begin
    update public.courses set status = 'APPROVED', reviewed_by_person_id = null where id = v_course;
    ok := false; detail := detail || 'APPROVED accepted without a reviewer; ';
  exception when others then null; end;
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  update public.courses set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_course;
  perform selftest.as_owner();
  select count(*) into n from public.courses where id = v_course and reviewed_at is not null;
  if n <> 1 then ok := false; detail := detail || 'reviewed_at not stamped; '; end if;
  -- ADDED IN FABLE-05 (0057). The reviewer separation was enforced; the
  -- CAPABILITY was not. An EDUCATOR holds CAN_DRAFT, passes the content UPDATE
  -- policy, and could approve a colleague's work by naming the colleague.
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  begin
    update public.courses set status = 'FROZEN' where id = v_course;
    ok := false; detail := detail || 'an EDUCATOR sealed content without CAN_FREEZE_RELEASE; ';
  exception when others then null; end;
  perform selftest.as_owner();
  test_id := 'F02-T02'; invariant := 'doc 04 §1 / INV-19';
  if ok then detail := 'self-approval and reviewer-less approval refused; an approval without CAN_REVIEW is refused and an EDUCATOR cannot seal; distinct reviewer stamped'; end if;
  return next;

  -- F02-T03 nothing reverses out of a sealed state, and PUBLISHED is a human
  -- CAN_PUBLISH act (INV-32) even on the course row itself.
  ok := true; detail := '';
  -- sealing needs CAN_FREEZE_RELEASE, which the owner connection does not have
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  update public.courses set status = 'FROZEN' where id = v_course;
  perform selftest.as_owner();
  begin
    update public.courses set status = 'APPROVED' where id = v_course;
    ok := false; detail := detail || 'reversal FROZEN->APPROVED accepted; ';
  exception when others then null; end;
  begin
    update public.courses set status = 'SUPERSEDED' where id = v_course;
    ok := false; detail := detail || 'unlisted jump FROZEN->SUPERSEDED accepted; ';
  exception when others then null; end;
  begin
    update public.courses set status = 'PUBLISHED' where id = v_course;
    ok := false; detail := detail || 'the owner connection, which has no person, published; ';
  exception when others then null; end;
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  update public.courses set status = 'PUBLISHED' where id = v_course;
  get diagnostics n = row_count;
  perform selftest.as_owner();
  if n <> 1 then ok := false; detail := detail || 'CAN_PUBLISH holder could not publish; '; end if;
  test_id := 'F02-T03'; invariant := 'INV-04/INV-22/INV-32';
  if ok then detail := 'no reversal or unlisted jump out of a sealed state; FROZEN->PUBLISHED only for a CAN_PUBLISH person'; end if;
  return next;

  -- F02-T04 authorship is provenance: stamped on insert, never rewritten.
  ok := true; detail := '';
  select count(*) into n from public.courses where id = v_course and author_person_id = v_guru;
  if n <> 1 then ok := false; detail := detail || 'author not preserved from insert; '; end if;
  begin
    update public.courses set author_person_id = v_hod where id = v_course;
    ok := false; detail := detail || 'author_person_id rewritten; ';
  exception when others then null; end;
  test_id := 'F02-T04'; invariant := 'INV-33 (content)';
  if ok then detail := 'author stamped at insert and immutable thereafter'; end if;
  return next;

  -- ----------------------------------------------------------------------
  -- A small but complete course for the hash contract (ADR-0004).
  -- ----------------------------------------------------------------------
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Matematika', 'SD', 'V', 'selftest hash probe', v_guru) returning id into v_course;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_course, v_inst, 1, 'Pecahan', v_guru) returning id into v_module;
  insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown, author_person_id)
    values (v_module, v_inst, 1, 'Mengenal pecahan', 'ringkasan singkat', '# Pecahan', v_guru)
    returning id into v_lesson;
  insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown, author_person_id)
    values (v_module, v_inst, 2, 'Menjumlahkan pecahan', '# Penjumlahan', v_guru)
    returning id into v_lesson2;
  insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
    values (v_lesson, v_inst, 'TP-1', 'Menyebutkan bagian pecahan', 'UNDERSTAND', true)
    returning id into v_obj;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, petunjuk,
                            objective_ids, predicted_difficulty, author_person_id)
    values (v_lesson, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Berapa nilai 1/2 + 1/4?',
            'Samakan penyebutnya lebih dulu', array[v_obj], 0.400, v_guru)
    returning id into v_item;
  insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale) values
    (v_item, v_inst, 'A', '3/4', true,  'penyebut disamakan menjadi 4'),
    (v_item, v_inst, 'B', '2/6', false, 'pembilang dan penyebut dijumlahkan langsung'),
    (v_item, v_inst, 'C', '1/8', false, 'pecahan dikalikan, bukan dijumlahkan');
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
                                             item_count, author_person_id)
    values (v_inst, v_course, 'Ulangan pecahan', 'POST_TEST', 'PRACTICE', 10, v_guru);

  -- F02-T05 the hash is deterministic, blind to metadata, and sensitive to
  -- both taught content and the order that is data (ADR-0004 §1–§3).
  ok := true; detail := '';
  h1 := public.course_content_sha256(v_course);
  if h1 is null or h1 !~ '^[0-9a-f]{64}$' then
    ok := false; detail := detail || 'no well-formed hash computed; ';
  end if;
  if public.course_content_sha256(v_course) is distinct from h1 then
    ok := false; detail := detail || 'two consecutive computations disagreed; ';
  end if;

  update public.items set empirical_difficulty = 0.512, empirical_discrimination = 0.310,
                          empirical_evidence_count = 120 where id = v_item;
  update public.lessons set page_citation = 'hal. 42', source_version_id = null where id = v_lesson;
  update public.courses set status = 'STRUCTURED' where id = v_course;
  if public.course_content_sha256(v_course) is distinct from h1 then
    ok := false; detail := detail || 'empirical/provenance/status metadata moved the hash; ';
  end if;

  update public.item_options set body = '3/4 (diperbaiki)' where item_id = v_item and label = 'A';
  h3 := public.course_content_sha256(v_course);
  if h3 = h1 then ok := false; detail := detail || 'an edited option body left the hash unchanged; '; end if;
  update public.item_options set body = '3/4' where item_id = v_item and label = 'A';
  if public.course_content_sha256(v_course) is distinct from h1 then
    ok := false; detail := detail || 'the hash did not return after the edit was reverted; ';
  end if;

  -- lesson order is pedagogically meaningful, so swapping it must be visible
  update public.lessons set ordinal = 99 where id = v_lesson;
  update public.lessons set ordinal = 1  where id = v_lesson2;
  update public.lessons set ordinal = 2  where id = v_lesson;
  if public.course_content_sha256(v_course) = h1 then
    ok := false; detail := detail || 'reordering the lessons left the hash unchanged; ';
  end if;
  update public.lessons set ordinal = 99 where id = v_lesson2;
  update public.lessons set ordinal = 1  where id = v_lesson;
  update public.lessons set ordinal = 2  where id = v_lesson2;
  if public.course_content_sha256(v_course) is distinct from h1 then
    ok := false; detail := detail || 'the hash did not return after the order was restored; ';
  end if;
  test_id := 'F02-T05'; invariant := 'INV-04 (ADR-0004)';
  if ok then detail := 'deterministic; blind to empirical/provenance/status; moves on taught edits and on lesson order'; end if;
  return next;

  -- F02-T06 the hash addresses content, not rows: identical content
  -- re-inserted under new uuids, new timestamps and a different physical and
  -- insertion order hashes the same.
  ok := true; detail := '';
  delete from public.item_options where item_id = v_item;
  delete from public.items where id = v_item;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, petunjuk,
                            objective_ids, predicted_difficulty, author_person_id)
    values (v_lesson, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Berapa nilai 1/2 + 1/4?',
            'Samakan penyebutnya lebih dulu', array[v_obj], 0.400, v_guru)
    returning id into v_item;
  -- inserted C, B, A: option order comes from `label`, never from insertion
  insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale) values
    (v_item, v_inst, 'C', '1/8', false, 'pecahan dikalikan, bukan dijumlahkan'),
    (v_item, v_inst, 'B', '2/6', false, 'pembilang dan penyebut dijumlahkan langsung'),
    (v_item, v_inst, 'A', '3/4', true,  'penyebut disamakan menjadi 4');
  if public.course_content_sha256(v_course) is distinct from h1 then
    ok := false; detail := detail || 'a uuid, a timestamp or a row order leaked into the hash; ';
  end if;
  test_id := 'F02-T06'; invariant := 'INV-04 (ADR-0004 §2)';
  if ok then detail := 'identical content under new uuids, timestamps and insertion order hashes identically'; end if;
  return next;

  -- F02-T07 freezing a release computes the hash, stamps it, and seals the
  -- taught content behind it (INV-04) -- including lesson media (§6).
  ok := true; detail := '';
  begin
    insert into public.plp_releases (institution_id, course_id, version_label, content_sha256, author_person_id)
      values (v_inst, v_course, '9.9.9', repeat('a', 64), v_guru);
    ok := false; detail := detail || 'a client-supplied content_sha256 was accepted; ';
  exception when others then null; end;

  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course, '1.0.0', v_guru) returning id into v_release;
  update public.plp_releases set status = 'STRUCTURED' where id = v_release;
  update public.plp_releases set status = 'VALIDATED'  where id = v_release;
  update public.plp_releases set status = 'IN_REVIEW'  where id = v_release;
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_release;
  perform selftest.as_signed_in();
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'FROZEN'     where id = v_release;
  perform selftest.as_signed_in();
  perform selftest.as_owner();
  select content_sha256, frozen_at into v_sha, v_frozen from public.plp_releases where id = v_release;
  if v_sha is distinct from h1 then
    ok := false; detail := detail || 'the stored freeze hash differs from the computed one; ';
  end if;
  if v_frozen is null then ok := false; detail := detail || 'frozen_at was not stamped; '; end if;

  begin
    update public.plp_releases set content_sha256 = repeat('b', 64) where id = v_release;
    ok := false; detail := detail || 'content_sha256 was rewritten after the freeze; ';
  exception when others then null; end;

  begin
    update public.lessons set body_markdown = 'diubah setelah beku' where id = v_lesson;
    ok := false; detail := detail || 'a frozen lesson body was edited; ';
  exception when others then null; end;
  begin
    update public.lessons set media = '[{"path":"pecahan.png"}]'::jsonb where id = v_lesson;
    ok := false; detail := detail || 'media was written on a frozen lesson (§6); ';
  exception when others then null; end;
  begin
    update public.item_options set rationale = 'diubah' where item_id = v_item and label = 'A';
    ok := false; detail := detail || 'a frozen option rationale was edited; ';
  exception when others then null; end;
  begin
    insert into public.lessons (module_id, institution_id, ordinal, title, author_person_id)
      values (v_module, v_inst, 9, 'pelajaran baru setelah beku', v_guru);
    ok := false; detail := detail || 'a lesson was added under a frozen course; ';
  exception when others then null; end;
  begin
    delete from public.item_options where item_id = v_item and label = 'C';
    ok := false; detail := detail || 'a frozen option was deleted; ';
  exception when others then null; end;

  -- but a frozen row still accumulates measured statistics and still moves
  -- through the lifecycle, and neither touches the hash
  update public.items set empirical_evidence_count = 300 where id = v_item;
  update public.lessons set page_citation = 'hal. 43' where id = v_lesson;
  if public.course_content_sha256(v_course) is distinct from h1 then
    ok := false; detail := detail || 'a metadata update on sealed content moved the hash; ';
  end if;
  test_id := 'F02-T07'; invariant := 'INV-04';
  if ok then detail := 'freeze computes and stamps the hash; taught columns, media, inserts and deletes are refused; metadata still moves'; end if;
  return next;

  -- F02-T08 publication is a human CAN_PUBLISH act; no service or ingest path
  -- reaches it (INV-32).
  ok := true; detail := '';
  begin
    update public.plp_releases set status = 'PUBLISHED' where id = v_release;
    ok := false; detail := detail || 'the owner connection, which has no person, published; ';
  exception when others then null; end;

  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  begin
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set status = 'PUBLISHED' where id = v_release;
    get diagnostics n = row_count;
    perform selftest.as_signed_in();
    if n > 0 then ok := false; detail := detail || 'an EDUCATOR published; '; end if;
    if n = 0 then ok := false; detail := detail || 'the EDUCATOR could not see the release at all; '; end if;
  exception when others then null; end;

  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  begin
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set status = 'PUBLISHED' where id = v_release;
    get diagnostics n = row_count;
    perform selftest.as_signed_in();
    if n > 0 then ok := false; detail := detail || 'a HEAD_OF_DEPARTMENT published without CAN_PUBLISH; '; end if;
    if n = 0 then ok := false; detail := detail || 'the HEAD_OF_DEPARTMENT could not see the release at all; '; end if;
  exception when others then null; end;

  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'PUBLISHED' where id = v_release;
  get diagnostics n = row_count;
  perform selftest.as_signed_in();
  perform selftest.as_owner();
  if n <> 1 then ok := false; detail := detail || 'the CAN_PUBLISH holder could not publish; '; end if;
  select published_at, content_sha256 into v_published, v_sha2 from public.plp_releases where id = v_release;
  if v_published is null then ok := false; detail := detail || 'published_at was not stamped; '; end if;
  if v_sha2 is distinct from h1 then
    ok := false; detail := detail || 'publication changed the frozen hash; ';
  end if;
  test_id := 'F02-T08'; invariant := 'INV-32';
  if ok then detail := 'refused with no person, for EDUCATOR and for HEAD_OF_DEPARTMENT; accepted for INSTITUTION_ADMIN; published_at stamped, hash untouched'; end if;
  return next;

  -- F02-T09 sealing is a human CAN_FREEZE_RELEASE act, and it is a DIFFERENT
  -- authority from publishing: HEAD_OF_DEPARTMENT can seal but not publish.
  -- A second release on the same course, driven to APPROVED as the Head of
  -- Department -- from 0057 APPROVED carries its own CAN_REVIEW gate, and the
  -- HoD holds it -- then frozen by each caller in turn.
  ok := true; detail := '';
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course, '2.0.0', v_guru) returning id into v_release;
  update public.plp_releases set status = 'STRUCTURED' where id = v_release;
  update public.plp_releases set status = 'VALIDATED'  where id = v_release;
  update public.plp_releases set status = 'IN_REVIEW'  where id = v_release;
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_release;
  perform selftest.as_signed_in();
  perform selftest.as_owner();

  begin
    update public.plp_releases set status = 'FROZEN' where id = v_release;
    ok := false; detail := detail || 'the owner connection, which has no person, sealed content; ';
  exception when others then null; end;

  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  begin
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set status = 'FROZEN' where id = v_release;
    get diagnostics n = row_count;
    perform selftest.as_signed_in();
    if n > 0 then ok := false; detail := detail || 'an EDUCATOR sealed content without CAN_FREEZE_RELEASE; '; end if;
    if n = 0 then ok := false; detail := detail || 'the EDUCATOR could not see the release at all; '; end if;
  exception when others then null; end;

  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'FROZEN' where id = v_release;
  get diagnostics n = row_count;
  perform selftest.as_signed_in();
  if n <> 1 then ok := false; detail := detail || 'the CAN_FREEZE_RELEASE holder could not seal; '; end if;
  -- the same caller holds CAN_FREEZE_RELEASE but not CAN_PUBLISH
  begin
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set status = 'PUBLISHED' where id = v_release;
    get diagnostics n = row_count;
    perform selftest.as_signed_in();
    if n > 0 then ok := false; detail := detail || 'the sealing role also published; '; end if;
  exception when others then null; end;
  perform selftest.as_owner();
  select content_sha256, frozen_at into v_sha2, v_frozen from public.plp_releases where id = v_release;
  if v_sha2 is distinct from h1 then ok := false; detail := detail || 'the second release sealed a different hash; '; end if;
  if v_frozen is null then ok := false; detail := detail || 'frozen_at was not stamped by the authorised seal; '; end if;
  test_id := 'F02-T09'; invariant := 'doc 04 §1 / INV-04';
  if ok then detail := 'sealing refused with no person and for EDUCATOR; accepted for HEAD_OF_DEPARTMENT, which still cannot publish'; end if;
  return next;

  -- F02-T10 a content record never changes tenant. Regression for the defect
  -- the FABLE-02 checkpoint found (probe 2d): a person holding CAN_DRAFT in
  -- one institution and CAN_FREEZE_RELEASE in another could carry a release
  -- across in a single statement and seal it there. RLS admitted it -- USING
  -- sees the old row, WITH CHECK the new one, and CAN_DRAFT held on both sides
  -- -- and the status trigger then read the capability from the institution
  -- the same statement was writing. Fixed in 20260912130904 by making
  -- institution_id immutable and by deriving the capability from OLD.
  ok := true; detail := '';
  select ra.institution_id into v_beta from public.role_assignments ra
    join public.accounts a on a.person_id = ra.person_id
    join auth.users u on u.id = a.auth_user_id
   where u.email = 'beta-admin@synthetic.pintar.test' and ra.revoked_at is null limit 1;

  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course, '3.0.0', v_guru) returning id into v_release;
  update public.plp_releases set status = 'STRUCTURED' where id = v_release;
  update public.plp_releases set status = 'VALIDATED'  where id = v_release;
  update public.plp_releases set status = 'IN_REVIEW'  where id = v_release;
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_release;
  perform selftest.as_signed_in();
  perform selftest.as_owner();

  -- the EDUCATOR of institution A is legitimately made HEAD_OF_DEPARTMENT in
  -- institution B, through grant_role: a direct insert is refused by the
  -- INV-16 anti-escalation guard, which is correct and not what is under test.
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  v_hop := public.grant_role(v_guru, 'HEAD_OF_DEPARTMENT',
             (select id from public.org_nodes where institution_id = v_beta and kind = 'DEPARTMENT' limit 1),
             now() + interval '1 year');
  perform selftest.as_owner();

  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  begin
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set institution_id = v_beta, status = 'FROZEN' where id = v_release;
    get diagnostics n = row_count;
    perform selftest.as_signed_in();
    if n > 0 then ok := false; detail := detail || 'a release was carried into another institution and sealed there; '; end if;
  exception when others then null; end;
  begin
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set institution_id = v_beta where id = v_release;
    get diagnostics n = row_count;
    perform selftest.as_signed_in();
    if n > 0 then ok := false; detail := detail || 'a release changed institution; '; end if;
  exception when others then null; end;
  begin
    update public.courses set institution_id = v_beta where id = v_course;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'a course changed institution; '; end if;
  exception when others then null; end;
  perform selftest.as_owner();

  select count(*) into n from public.plp_releases
   where id = v_release and institution_id = v_inst and status = 'APPROVED';
  if n <> 1 then ok := false; detail := detail || 'the release did not survive intact in its own institution; '; end if;
  select count(*) into n from public.courses where id = v_course and institution_id = v_inst;
  if n <> 1 then ok := false; detail := detail || 'the course did not stay in its own institution; '; end if;

  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  perform public.revoke_role(v_hop);
  perform selftest.as_owner();
  test_id := 'F02-T10'; invariant := 'INV-01 (tenant isolation)';
  if ok then detail := 'institution_id is immutable on content and releases; a caller privileged in two institutions cannot carry a record across, with or without a seal in the same statement'; end if;
  return next;

  -- F02-T11 three-tier bank isolation: EXAM never leaks down (INV-12).
  ok := true; detail := '';
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Matematika', 'SD', 'VI', 'selftest bank probe', v_guru) returning id into v_course2;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_course2, v_inst, 1, 'Bank', v_guru) returning id into v_mod2;
  insert into public.lessons (module_id, institution_id, ordinal, title, author_person_id)
    values (v_mod2, v_inst, 1, 'Bank', v_guru) returning id into v_les2;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, author_person_id)
    values (v_les2, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'soal latihan', v_guru) returning id into v_ip;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, author_person_id)
    values (v_les2, v_inst, 'MCQ_SINGLE', 'TEST', 'soal ulangan', v_guru) returning id into v_it;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, author_person_id)
    values (v_les2, v_inst, 'MCQ_SINGLE', 'EXAM', 'soal ujian', v_guru) returning id into v_ie;
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, item_count, author_person_id)
    values (v_inst, v_course2, 'Latihan', 'QUICK', 'PRACTICE', 5, v_guru) returning id into v_def_p;
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, item_count, author_person_id)
    values (v_inst, v_course2, 'Ulangan', 'POST_TEST', 'TEST', 5, v_guru) returning id into v_def_t;
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, item_count, author_person_id)
    values (v_inst, v_course2, 'Ujian', 'STANDALONE', 'EXAM', 5, v_guru) returning id into v_def_e;

  -- a PRACTICE definition reaches only PRACTICE
  select count(*) into n from public.eligible_items_for_definition(v_def_p);
  if n <> 1 then ok := false; detail := detail || format('PRACTICE definition drew %s item(s), expected 1; ', n); end if;
  if exists (select 1 from public.eligible_items_for_definition(v_def_p) where bank_type <> 'PRACTICE') then
    ok := false; detail := detail || 'a PRACTICE definition reached a higher tier; ';
  end if;
  -- a TEST definition reaches PRACTICE and TEST, never EXAM
  select count(*) into n from public.eligible_items_for_definition(v_def_t);
  if n <> 2 then ok := false; detail := detail || format('TEST definition drew %s item(s), expected 2; ', n); end if;
  if exists (select 1 from public.eligible_items_for_definition(v_def_t) where bank_type = 'EXAM') then
    ok := false; detail := detail || 'a TEST definition reached an EXAM item; ';
  end if;
  -- an EXAM definition reaches all three
  select count(*) into n from public.eligible_items_for_definition(v_def_e);
  if n <> 3 then ok := false; detail := detail || format('EXAM definition drew %s item(s), expected 3; ', n); end if;

  -- a parallel group is drawn as a unit, so it may not mix tiers: otherwise
  -- drawing the PRACTICE sibling would hand over the EXAM one
  v_group := gen_random_uuid();
  update public.items set parallel_group = v_group where id = v_ip;
  begin
    update public.items set parallel_group = v_group where id = v_ie;
    ok := false; detail := detail || 'a parallel group mixed PRACTICE and EXAM tiers; ';
  exception when others then null; end;
  -- nor institutions
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_beta, 'Matematika', 'SD', 'VI', 'selftest bank probe beta', v_guru) returning id into v_bcourse;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_bcourse, v_beta, 1, 'Bank', v_guru) returning id into v_bmod;
  insert into public.lessons (module_id, institution_id, ordinal, title, author_person_id)
    values (v_bmod, v_beta, 1, 'Bank', v_guru) returning id into v_bles;
  begin
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, parallel_group, author_person_id)
      values (v_bles, v_beta, 'MCQ_SINGLE', 'PRACTICE', 'soal beta', v_group, v_guru);
    ok := false; detail := detail || 'a parallel group spanned two institutions; ';
  exception when others then null; end;
  test_id := 'F02-T11'; invariant := 'INV-12';
  if ok then detail := 'PRACTICE draws 1, TEST draws 2, EXAM draws 3; EXAM never leaks down; a parallel group cannot mix tiers or institutions'; end if;
  return next;

  -- F02-T12 a session derives its provenance and cannot have it rewritten
  -- (INV-33); evidence_class is derived, never asserted.
  ok := true; detail := '';
  select e.id into v_enr from public.enrollments e
    join public.accounts a on a.person_id = e.person_id
    join auth.users u on u.id = a.auth_user_id
   where u.email = 'alpha-siswa-1@synthetic.pintar.test' and e.institution_id = v_inst limit 1;
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course2, '1.0.0', v_guru) returning id into v_rel2;

  v_sess := public.open_assessment_session(v_enr, v_def_p, v_rel2, 'ONLINE', 'QUICK',
                                           'engine-0', public.scoring_policy_version());
  select evidence_class, shuffle_seed into v_class, v_seed
    from public.assessment_sessions where id = v_sess;
  -- the seeded tenant is synthetic, so it can never produce OFFICIAL evidence
  if v_class <> 'SYNTHETIC' then
    ok := false; detail := detail || format('evidence_class was %s on a synthetic tenant; ', v_class);
  end if;
  select count(*) into n from public.assessment_sessions s
    join public.enrollments e on e.id = s.enrollment_id
   where s.id = v_sess and s.person_id = e.person_id
     and s.institution_id = e.institution_id and s.academic_period_id = e.academic_period_id;
  if n <> 1 then ok := false; detail := detail || 'provenance was not derived from the enrolment; '; end if;

  -- provenance is unrewritable, including evidence_class itself
  begin
    update public.assessment_sessions set evidence_class = 'OFFICIAL' where id = v_sess;
    ok := false; detail := detail || 'evidence_class was rewritten to OFFICIAL; ';
  exception when others then null; end;
  begin
    update public.assessment_sessions set enrollment_id = v_enr, person_id = v_guru where id = v_sess;
    ok := false; detail := detail || 'person_id was rewritten; ';
  exception when others then null; end;
  begin
    update public.assessment_sessions set engine_version = 'engine-9' where id = v_sess;
    ok := false; detail := detail || 'engine_version was rewritten; ';
  exception when others then null; end;
  begin
    update public.assessment_sessions set institution_id = v_beta where id = v_sess;
    ok := false; detail := detail || 'a session changed institution; ';
  exception when others then null; end;

  -- but operational state still moves, or Phase 3 could not run a session
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_sess;
  update public.assessment_sessions set authoritative_deadline = now() + interval '1 hour' where id = v_sess;
  get diagnostics n = row_count;
  if n <> 1 then ok := false; detail := detail || 'the authoritative deadline could not be extended; '; end if;
  select count(*) into n from public.assessment_sessions where id = v_sess and started_at is not null;
  if n <> 1 then ok := false; detail := detail || 'started_at was not stamped; '; end if;
  test_id := 'F02-T12'; invariant := 'INV-33';
  if ok then detail := 'provenance derived from the enrolment and immutable; evidence_class derived as SYNTHETIC; operational state still moves'; end if;
  return next;

  -- F02-T13 a delivery record is written once; the session lifecycle is an
  -- allow-list and fails closed.
  ok := true; detail := '';
  insert into public.presented_items (session_id, item_id, position)
    values (v_sess, v_ip, 1) returning id into v_pi;
  select count(*) into n from public.presented_items
   where id = v_pi and institution_id = v_inst;
  if n <> 1 then ok := false; detail := detail || 'the delivery record did not inherit the session institution; '; end if;
  begin
    update public.presented_items set position = 2 where id = v_pi;
    ok := false; detail := detail || 'a presented item was edited; ';
  exception when others then null; end;
  begin
    delete from public.presented_items where id = v_pi;
    ok := false; detail := detail || 'a presented item was deleted; ';
  exception when others then null; end;
  begin
    insert into public.presented_items (session_id, item_id, position)
      values (v_sess, (select i.id from public.items i where i.institution_id = v_beta limit 1), 2);
    ok := false; detail := detail || 'an item from another institution was presented; ';
  exception when others then null; end;

  -- lifecycle: unlisted jumps refused, terminal states are terminal
  begin
    update public.assessment_sessions set status = 'CREATED' where id = v_sess;
    ok := false; detail := detail || 'a session reversed to CREATED; ';
  exception when others then null; end;
  begin
    update public.assessment_sessions set status = 'FINALIZED' where id = v_sess;
    ok := false; detail := detail || 'IN_PROGRESS jumped straight to FINALIZED; ';
  exception when others then null; end;
  begin
    update public.assessment_sessions set status = 'TERMINATED' where id = v_sess;
    ok := false; detail := detail || 'TERMINATED accepted without a reason; ';
  exception when others then null; end;
  update public.assessment_sessions set status = 'SUBMITTED' where id = v_sess;
  update public.assessment_sessions set status = 'FINALIZED' where id = v_sess;
  select count(*) into n from public.assessment_sessions
   where id = v_sess and status = 'FINALIZED' and finalized_at is not null;
  if n <> 1 then ok := false; detail := detail || 'the legal path to FINALIZED was refused; '; end if;
  begin
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_sess;
    ok := false; detail := detail || 'a FINALIZED session was reopened; ';
  exception when others then null; end;
  test_id := 'F02-T13'; invariant := 'INV-33 / doc 04 §5';
  if ok then detail := 'a delivery record is write-once and tenant-bound; the session graph refuses reversals, jumps and reasonless termination'; end if;
  return next;

  -- F02-T14 INV-28: a receipt is anchored to the delivery record, a replay is
  -- acknowledged, a conflicting replay is refused, and a new sequence appends.
  ok := true; detail := '';
  -- a fresh session: F02-T13 drove the previous one to FINALIZED, and a
  -- finalized session correctly accepts no further evidence
  v_sess := public.open_assessment_session(v_enr, v_def_p, v_rel2, 'ONLINE', 'QUICK',
                                           'engine-0', public.scoring_policy_version());
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_sess;
  insert into public.presented_items (session_id, item_id, position)
    values (v_sess, v_ip, 1) returning id into v_pi;

  select response_id, outcome into v_r1, v_out from public.submit_response(v_pi, 1, '{"pilihan":"A"}'::jsonb);
  if v_out <> 'RECORDED' then ok := false; detail := detail || format('first submission returned %s; ', v_out); end if;

  -- the same receipt with the same answer: acknowledged, not duplicated
  select response_id, outcome into v_r2, v_out from public.submit_response(v_pi, 1, '{"pilihan":"A"}'::jsonb);
  if v_out <> 'ACKNOWLEDGED' then ok := false; detail := detail || format('replay returned %s; ', v_out); end if;
  if v_r2 is distinct from v_r1 then ok := false; detail := detail || 'a replay created a second row; '; end if;
  select count(*) into n from public.responses where presented_item_id = v_pi and client_seq = 1;
  if n <> 1 then ok := false; detail := detail || format('%s rows share one receipt; ', n); end if;

  -- transport metadata differing must not make a replay look new
  select response_id, outcome into v_r2, v_out from public.submit_response(
    v_pi, 1, '{"pilihan":"A"}'::jsonb, now(), 'LATE_SYNC', true);
  if v_out <> 'ACKNOWLEDGED' or v_r2 is distinct from v_r1 then
    ok := false; detail := detail || 'transport metadata changed the identity of a replay; ';
  end if;

  -- the same receipt with a different answer: refused, and the first survives
  begin
    perform public.submit_response(v_pi, 1, '{"pilihan":"B"}'::jsonb);
    ok := false; detail := detail || 'a conflicting replay was accepted; ';
  exception when others then null; end;
  select count(*) into n from public.responses
   where presented_item_id = v_pi and client_seq = 1 and value_digest = public.content_digest('{"pilihan": "A"}');
  if n <> 1 then ok := false; detail := detail || 'the original answer did not survive the conflict; '; end if;

  -- a new sequence is a new answer, appended
  select response_id, outcome into v_r2, v_out from public.submit_response(v_pi, 2, '{"pilihan":"B"}'::jsonb);
  if v_out <> 'RECORDED' or v_r2 = v_r1 then ok := false; detail := detail || 'a new client_seq did not append; '; end if;
  select count(*) into n from public.responses where presented_item_id = v_pi;
  if n <> 2 then ok := false; detail := detail || format('expected 2 responses, found %s; ', n); end if;

  -- evidence is never rewritten in place
  begin
    update public.responses set value = '{"pilihan":"C"}'::jsonb where id = v_r1;
    ok := false; detail := detail || 'a response was rewritten; ';
  exception when others then null; end;
  -- and session/institution came from the delivery record, not the caller
  select count(*) into n from public.responses r join public.presented_items p on p.id = r.presented_item_id
   where r.id = v_r1 and r.session_id = p.session_id and r.institution_id = p.institution_id;
  if n <> 1 then ok := false; detail := detail || 'the response was not anchored to its delivery record; '; end if;
  test_id := 'F02-T14'; invariant := 'INV-28';
  if ok then detail := 'receipt anchored to the delivery record; replay acknowledged as one row; conflicting replay refused; new sequence appends; no rewrite'; end if;
  return next;

  -- F02-T15 INV-29: scoring provenance is required and immutable; a
  -- recomputation is a new linked row, and the lineage is a line.
  ok := true; detail := '';
  begin
    insert into public.assessment_results (session_id, institution_id, person_id, evidence_class,
                                           engine_version, scoring_policy_version)
      values (v_sess, v_inst, v_guru, 'SYNTHETIC', 'engine-1', null);
    ok := false; detail := detail || 'a result was written without a scoring policy version; ';
  exception when others then null; end;

  insert into public.assessment_results (session_id, institution_id, person_id, evidence_class,
                                         engine_version, scoring_policy_version, mastery)
    values (v_sess, v_inst, v_guru, 'OFFICIAL', 'engine-1', public.scoring_policy_version(), 0.7500)
    returning id into v_res1;
  -- provenance is derived from the session, not accepted
  select count(*) into n from public.assessment_results r join public.assessment_sessions s on s.id = r.session_id
   where r.id = v_res1 and r.institution_id = s.institution_id and r.person_id = s.person_id
     and r.evidence_class = s.evidence_class;
  if n <> 1 then ok := false; detail := detail || 'result provenance was not derived from the session; '; end if;

  begin
    update public.assessment_results set mastery = 0.9900 where id = v_res1;
    ok := false; detail := detail || 'a result was rewritten; ';
  exception when others then null; end;

  -- a second root for the same session is refused
  begin
    insert into public.assessment_results (session_id, institution_id, person_id, evidence_class,
                                           engine_version, scoring_policy_version)
      values (v_sess, v_inst, v_guru, 'OFFICIAL', 'engine-1', public.scoring_policy_version());
    ok := false; detail := detail || 'a session grew a second root result; ';
  exception when others then null; end;

  -- a recomputation is a new row carrying its own provenance
  insert into public.assessment_results (session_id, institution_id, person_id, evidence_class,
                                         engine_version, scoring_policy_version, mastery,
                                         supersedes_result_id, recomputation_reason)
    values (v_sess, v_inst, v_guru, 'OFFICIAL', 'engine-2', public.scoring_policy_version(), 0.8000, v_res1, 'policy revision')
    returning id into v_res2;
  -- the lineage cannot fork: a second successor for the same predecessor
  begin
    insert into public.assessment_results (session_id, institution_id, person_id, evidence_class,
                                           engine_version, scoring_policy_version,
                                           supersedes_result_id, recomputation_reason)
      values (v_sess, v_inst, v_guru, 'OFFICIAL', 'engine-3', public.scoring_policy_version(), v_res1, 'fork attempt');
    ok := false; detail := detail || 'the lineage forked; ';
  exception when others then null; end;
  -- nor supersede across sessions
  begin
    insert into public.assessment_results (session_id, institution_id, person_id, evidence_class,
                                           engine_version, scoring_policy_version,
                                           supersedes_result_id, recomputation_reason)
      values (v_sess, v_inst, v_guru, 'OFFICIAL', 'engine-3', public.scoring_policy_version(), v_res1, 'x');
    ok := false; detail := detail || 'a cross-lineage supersession was accepted; ';
  exception when others then null; end;
  -- the chain is walkable and unambiguous
  select count(*) into n from public.assessment_results where session_id = v_sess;
  if n <> 2 then ok := false; detail := detail || format('lineage has %s rows, expected 2; ', n); end if;
  select count(*) into n from public.assessment_results
   where session_id = v_sess and supersedes_result_id is null;
  if n <> 1 then ok := false; detail := detail || 'the lineage does not have exactly one root; '; end if;
  test_id := 'F02-T15'; invariant := 'INV-29';
  if ok then detail := 'scoring provenance required and derived; results immutable; recomputation is a new linked row; lineage cannot fork or cross sessions'; end if;
  return next;

  -- F02-T16 INV-11: telemetry is physically separate and append-only, and a
  -- hesitation event carries the definition's configured window, not a constant.
  --
  -- NARROWED IN FABLE-03, AND STRICTLY STRONGER. This test used to assert that
  -- nothing in `public` REFERENCES telemetry at all, with one named exception
  -- for the write trigger. That was right while nothing produced telemetry.
  -- FABLE-03 §6 requires a learner-facing path that RECORDS hesitation and
  -- assistance, and PostgREST exposes only `public`, so such a function must
  -- live there and must name the schema. The rule is now what INV-11 actually
  -- says -- "never influences scoring" -- expressed as: a function in `public`
  -- may WRITE telemetry and may never READ it. A scoring path that cannot read
  -- a value cannot be influenced by it, and unlike an exception list this
  -- constrains every future function rather than excusing chosen ones.
  --
  -- The rule has exactly one definition, public.assert_telemetry_write_only(),
  -- so this test and 0033's verification block cannot drift apart; that
  -- migration also proves it bites, by planting a public function that reads
  -- telemetry, asserting the check goes red, and dropping it again.
  ok := true; detail := '';
  select a.ok, a.detail into v_inv11_ok, v_inv11_detail from public.assert_telemetry_write_only() a;
  if not v_inv11_ok then ok := false; detail := detail || v_inv11_detail || '; '; end if;
  select count(*) into n from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid
    join pg_class dep on dep.oid = rw.ev_class
    join pg_class ref on ref.oid = d.refobjid
    join pg_namespace rns on rns.oid = ref.relnamespace
    join pg_namespace dns on dns.oid = dep.relnamespace
   where rns.nspname = 'telemetry' and dns.nspname = 'public';
  if n > 0 then ok := false; detail := detail || format('%s view(s) in public read telemetry; ', n); end if;

  -- the definition configures no window yet, so there is no such event
  begin
    insert into telemetry.hesitation_events (session_id, presented_item_id, institution_id,
                                             window_seconds, dwell_seconds)
      values (v_sess, v_pi, v_inst, 30, 12.5);
    ok := false; detail := detail || 'a hesitation event was recorded with no configured window; ';
  exception when others then null; end;

  update public.assessment_definitions set hesitation_window_seconds = 45 where id = v_def_p;
  -- the caller's 999 must be ignored in favour of the definition's 45
  insert into telemetry.hesitation_events (session_id, presented_item_id, institution_id,
                                           window_seconds, dwell_seconds)
    values (v_sess, v_pi, v_inst, 999, 12.5) returning id into v_hes;
  select count(*) into n from telemetry.hesitation_events where id = v_hes and window_seconds = 45;
  if n <> 1 then ok := false; detail := detail || 'the hesitation window did not come from the definition; '; end if;
  begin
    update telemetry.hesitation_events set dwell_seconds = 1 where id = v_hes;
    ok := false; detail := detail || 'a telemetry event was rewritten; ';
  exception when others then null; end;

  -- an integrity signal is an observation, and carries no verdict column
  insert into public.integrity_signals (session_id, institution_id, category, observation)
    values (v_sess, v_inst, 'VISIBILITY_CHANGE', '{"hidden_ms":4200}'::jsonb) returning id into v_sig;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='integrity_signals'
     and column_name ~* '(verdict|cheat|guilt|suspicio|penalt|violation|flagged|confirmed)';
  if n > 0 then ok := false; detail := detail || 'integrity_signals grew a verdict column; '; end if;
  begin
    update public.integrity_signals set category = 'NAVIGATION' where id = v_sig;
    ok := false; detail := detail || 'an integrity signal was rewritten; ';
  exception when others then null; end;

  -- no client role reaches telemetry
  select count(*) into n from information_schema.role_table_grants
   where table_schema='telemetry' and grantee in ('anon','authenticated');
  if n > 0 then ok := false; detail := detail || 'a client role can read telemetry; '; end if;
  test_id := 'F02-T16'; invariant := 'INV-11';
  if ok then detail := 'telemetry is a separate schema no public view or function reads; events are append-only; the hesitation window comes from the definition; signals carry no verdict'; end if;
  return next;

  -- F02-T17 INV-20: official_* is the only evidence read path, non-official
  -- evidence never appears in it, and a reclassification may only weaken.
  ok := true; detail := '';
  -- the seeded tenant is synthetic, so none of its evidence is ever official
  select count(*) into n from public.official_sessions where id = v_sess;
  if n <> 0 then ok := false; detail := detail || 'a SYNTHETIC session appeared in official_sessions; '; end if;
  select count(*) into n from public.official_responses where session_id = v_sess;
  if n <> 0 then ok := false; detail := detail || 'a SYNTHETIC session''s responses appeared in official_responses; '; end if;
  select count(*) into n from public.official_results where session_id = v_sess;
  if n <> 0 then ok := false; detail := detail || 'a SYNTHETIC session''s results appeared in official_results; '; end if;

  -- the analytics role reads the three views and nothing else
  select count(*) into n from information_schema.role_table_grants
   where grantee = 'analytics'
     and table_name not in ('official_sessions','official_responses','official_results');
  if n > 0 then ok := false; detail := detail || format('the analytics role holds %s grant(s) on raw tables; ', n); end if;

  -- the positive case needs a NON-synthetic tenant, and institutions are
  -- never deleted. It therefore runs inside a subtransaction that is rolled
  -- back deliberately: plpgsql variables survive the rollback, the rows do not.
  -- FABLE-04 D1 changed what "a non-synthetic tenant" means outside production:
  -- exactly one may exist, the declared bootstrap tenant, and 0042 refuses a
  -- second. That guard is asserted here rather than worked around, and the
  -- positive case then runs on the tenant the decision actually created.
  begin
    insert into public.institutions (name, slug, is_synthetic)
      values ('Selftest Nyata', 'selftest-nyata-' || gen_random_uuid()::text, false);
    ok := false; detail := detail || 'a second non-synthetic institution was accepted outside production; ';
  exception when others then null; end;
  -- NARROWED FOR ADR-0020: `is_official_bootstrap` now selects two tenants; this
  -- fixture means D1's.
  select id into v_real from public.institutions
   where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP';
  if v_real is null then
    ok := false;
    detail := detail || 'no bootstrap tenant exists to carry the OFFICIAL case; ';
  end if;
  begin
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
      values (v_real, 'TA', '2026-07-13', '2027-06-26') returning id into v_ap;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      values (v_guru, v_real, v_ap, 'ACTIVE') returning id into v_real_enr;
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
      values (v_real, 'M', 'SD', 'V', 'selftest official probe', v_guru) returning id into v_course2;
    insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
      values (v_real, v_course2, '1.0.0', v_guru) returning id into v_rel2;
    insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
                                               item_count, author_person_id)
      values (v_real, v_course2, 'D', 'QUICK', 'PRACTICE', 5, v_guru) returning id into v_def_p;
    v_osess := public.open_assessment_session(v_real_enr, v_def_p, v_rel2, 'ONLINE', 'QUICK', 'e', public.scoring_policy_version());
    select count(*) into n from public.official_sessions where id = v_osess;
    if n <> 1 then ok := false; detail := detail || 'an OFFICIAL session did not appear in official_sessions; '; end if;

    -- a real reclassification, walked rather than assumed. 0025 called
    -- audit_write with the wrong argument shape and nothing noticed, because
    -- no test had ever filed an override -- and on a synthetic tenant none
    -- ever could, since SYNTHETIC is already the floor and an override may
    -- only weaken. It is reachable only here, on genuinely official evidence.
    perform selftest.as_user('sysadmin@synthetic.pintar.test');
    perform public.grant_role(v_guru, 'INSTITUTION_ADMIN', v_real, now() + interval '1 year');
    perform selftest.as_owner();
    perform selftest.as_user('alpha-guru@synthetic.pintar.test');
    insert into public.evidence_class_overrides (session_id, institution_id, from_class, to_class,
                                                 reason, decided_by_person_id)
      values (v_osess, v_real, 'OFFICIAL', 'PREVIEW', 'diturunkan setelah insiden', v_guru);
    perform selftest.as_owner();
    if public.effective_evidence_class(v_osess) <> 'PREVIEW' then
      ok := false; detail := detail || 'a weakening override did not take effect; ';
    end if;
    select count(*) into n from public.audit_log
     where action = 'EVIDENCE_RECLASSIFIED' and target_id = v_osess::text;
    if n < 1 then ok := false; detail := detail || 'the reclassification was not audited; '; end if;
    select count(*) into n from public.official_sessions where id = v_osess;
    if n <> 0 then ok := false; detail := detail || 'a downgraded session stayed in official_sessions; '; end if;
    perform selftest.as_user('alpha-guru@synthetic.pintar.test');
    begin
      insert into public.evidence_class_overrides (session_id, institution_id, from_class, to_class,
                                                   reason, decided_by_person_id)
        values (v_osess, v_real, 'PREVIEW', 'OFFICIAL', 'promosi', v_guru);
      ok := false; detail := detail || 'an override promoted evidence back to OFFICIAL; ';
    exception when others then null; end;
    perform selftest.as_owner();
    -- and an override may only weaken it
    begin
      insert into public.evidence_class_overrides (session_id, institution_id, from_class, to_class, reason,
                                                   decided_by_person_id)
        values (v_osess, v_real, 'OFFICIAL', 'OFFICIAL', 'no-op', v_guru);
      ok := false; detail := detail || 'a no-op override was accepted; ';
    exception when others then null; end;
    raise exception 'selftest rollback marker';
  exception when others then
    if sqlerrm <> 'selftest rollback marker' then
      ok := false; detail := detail || 'official-view probe aborted: ' || left(sqlerrm, 80) || '; ';
    end if;
  end;
  -- INV-20 as AMENDED (baseline 2026-09-12, which reached the repository only
  -- after FABLE-03): the exclusion must be structural -- a consumer holds no
  -- direct grant on a raw evidence table. 0036 makes that a callable assertion
  -- so it stops being satisfied only by the absence of a consumer.
  select a.ok, a.detail into v_inv20_ok, v_inv20 from public.assert_evidence_consumer_boundary() a;
  if not v_inv20_ok then ok := false; detail := detail || v_inv20 || '; '; end if;
  test_id := 'F02-T17'; invariant := 'INV-20';
  if ok then detail := 'non-official evidence never reaches official_*; an OFFICIAL session does; the analytics role holds no grant on a raw evidence table; ' || v_inv20; end if;
  return next;

  -- F02-T18 RESTATED BY D-032 (BOB-14). Spec §8 made published lesson prose
  -- PINTAR's one public surface; the schools are real now, so it is none.
  -- The view still shows only a PUBLISHED release's prose (read here as its
  -- owner), but no client role reads it: not anon, and not a signed-in
  -- teacher, whose lesson text comes only through paths that check school,
  -- class and assignment. anon holds no table grant at all, and the
  -- item-bearing aggregates stay service-role only.
  ok := true; detail := '';
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Matematika', 'SD', 'V', 'selftest view probe', v_guru) returning id into v_course2;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_course2, v_inst, 1, 'M', v_guru) returning id into v_mod2;
  insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown, author_person_id)
    values (v_mod2, v_inst, 1, 'Pelajaran terbuka', '# isi', v_guru) returning id into v_les2;
  -- no published release yet, so nothing is public
  select count(*) into n from public.published_lessons where id = v_les2;
  if n <> 0 then ok := false; detail := detail || 'an unpublished lesson was publicly visible; '; end if;

  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course2, '1.0.0', v_guru) returning id into v_rel3;
  update public.plp_releases set status = 'STRUCTURED' where id = v_rel3;
  update public.plp_releases set status = 'VALIDATED'  where id = v_rel3;
  update public.plp_releases set status = 'IN_REVIEW'  where id = v_rel3;
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_rel3;
  perform selftest.as_signed_in();
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'FROZEN' where id = v_rel3;
  perform selftest.as_signed_in();
  perform selftest.as_owner();
  -- FROZEN is sealed but not yet available
  select count(*) into n from public.published_lessons where id = v_les2;
  if n <> 0 then ok := false; detail := detail || 'a FROZEN release made a lesson public; '; end if;
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'PUBLISHED' where id = v_rel3;
  perform selftest.as_signed_in();
  perform selftest.as_owner();
  select count(*) into n from public.published_lessons where id = v_les2;
  if n <> 1 then ok := false; detail := detail || 'a PUBLISHED release did not make the lesson public; '; end if;

  -- no client role reads the view: anon, and a signed-in teacher of the school
  perform selftest.as_anon();
  begin
    select count(*) into n from public.published_lessons where id = v_les2;
    ok := false; detail := detail || format('anon read %s published lesson(s) through the view; ', n);
  exception when insufficient_privilege then null; end;
  begin
    select count(*) into n from public.items;
    if n > 0 then ok := false; detail := detail || 'anon read item content; '; end if;
  exception when others then null; end;
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  begin
    select count(*) into n from public.published_lessons;
    ok := false; detail := detail || format('a signed-in teacher read %s lesson(s) through the public view; ', n);
  exception when insufficient_privilege then null; end;
  perform selftest.as_owner();
  select count(*) into n from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon';
  if n > 0 then ok := false; detail := detail || format('anon holds %s table grant(s); ', n); end if;
  if not coalesce((select c.reloptions::text[] @> array['security_invoker=true'] from pg_class c
                    where c.oid = 'public.published_lessons'::regclass), false) then
    ok := false; detail := detail || 'published_lessons runs as its owner; ';
  end if;

  -- item-bearing aggregates are service-role only
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    select count(*) into n from public.service_item_statistics;
    ok := false; detail := detail || 'an INSTITUTION_ADMIN read the item statistics view; ';
  exception when others then null; end;
  perform selftest.as_owner();
  test_id := 'F02-T18'; invariant := 'INV-01 / doc 04 §9';
  if ok then detail := 'the lesson view shows only a PUBLISHED release''s prose, and no client role reads it (D-032): anon and a signed-in teacher are refused, the view runs as its reader, anon holds no table grant, and item-bearing aggregates are service-role only'; end if;
  return next;

  -- F02-T19 §9/INV-35: the validator coaches, and readiness gates publication.
  -- Two courses on purpose: freezing a release seals its course, so the
  -- blocked path and the ready path cannot be the same rows.
  ok := true; detail := '';
  if exists (select 1 from public.validate_learner_text('Pilih salah satu cara berikut')) then
    ok := false; detail := detail || 'the validator flagged legitimate Indonesian; ';
  end if;
  if not exists (select 1 from public.validate_learner_text('Jawabanmu salah dan kamu gagal')) then
    ok := false; detail := detail || 'the validator missed a judgement word; ';
  end if;

  -- course A: learner-facing text that breaks doctrine
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Matematika', 'SD', 'V', 'selftest readiness blocked probe', v_guru) returning id into v_course2;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_course2, v_inst, 1, 'M', v_guru) returning id into v_mod2;
  insert into public.lessons (module_id, institution_id, ordinal, title, author_person_id)
    values (v_mod2, v_inst, 1, 'L', v_guru) returning id into v_les2;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, arah_berpikir, author_person_id)
    values (v_les2, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Berapa 1/2 + 1/4?',
            'Kalau hasilnya salah, ulangi', v_guru) returning id into v_it;
  perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
  n := public.validate_course_content(v_course2);
  perform selftest.as_owner();
  select count(*) into n from public.coaching_findings
   where course_id = v_course2 and severity = 'ERROR' and target_field = 'arah_berpikir';
  if n < 1 then ok := false; detail := detail || 'the validator did not flag the scaffold text; '; end if;
  select count(*) into n from public.coaching_findings
   where course_id = v_course2 and (btrim(mengapa_penting) = '' or btrim(cara_memperbaiki) = '');
  if n > 0 then ok := false; detail := detail || 'a finding carried no concrete fix; '; end if;

  select status, blockers into v_status, v_blockers from public.publish_readiness(v_course2);
  if v_status <> 'BLOCKED' then
    ok := false; detail := detail || format('readiness was %s with an ERROR finding; ', v_status);
  end if;
  if array_length(v_blockers, 1) is null then
    ok := false; detail := detail || 'readiness reported no blocker; ';
  end if;

  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course2, '1.0.0', v_guru) returning id into v_rel3;
  update public.plp_releases set status = 'STRUCTURED' where id = v_rel3;
  update public.plp_releases set status = 'VALIDATED'  where id = v_rel3;
  update public.plp_releases set status = 'IN_REVIEW'  where id = v_rel3;
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_rel3;
  perform selftest.as_signed_in();
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'FROZEN' where id = v_rel3;
  perform selftest.as_signed_in();
  perform selftest.as_owner();
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    perform selftest.as_release_writer();  -- D-041
    update public.plp_releases set status = 'PUBLISHED' where id = v_rel3;
    perform selftest.as_signed_in();
    ok := false; detail := detail || 'a BLOCKED course was published; ';
  exception when others then null; end;
  perform selftest.as_owner();

  -- course B: the same shape with coaching text that holds up
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Matematika', 'SD', 'V', 'selftest readiness ready probe', v_guru) returning id into v_course2;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_course2, v_inst, 1, 'M', v_guru) returning id into v_mod2;
  insert into public.lessons (module_id, institution_id, ordinal, title, author_person_id)
    values (v_mod2, v_inst, 1, 'L', v_guru) returning id into v_les2;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, arah_berpikir, author_person_id)
    values (v_les2, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Berapa 1/2 + 1/4?',
            'Samakan penyebutnya lebih dulu', v_guru) returning id into v_it;
  perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
  n := public.validate_course_content(v_course2);
  perform selftest.as_owner();
  select status into v_status from public.publish_readiness(v_course2);
  if v_status <> 'READY' then
    ok := false; detail := detail || format('clean coaching text still read %s; ', v_status);
  end if;
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course2, '1.0.0', v_guru) returning id into v_rel3;
  update public.plp_releases set status = 'STRUCTURED' where id = v_rel3;
  update public.plp_releases set status = 'VALIDATED'  where id = v_rel3;
  update public.plp_releases set status = 'IN_REVIEW'  where id = v_rel3;
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_rel3;
  perform selftest.as_signed_in();
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'FROZEN' where id = v_rel3;
  perform selftest.as_signed_in();
  perform selftest.as_owner();
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  perform selftest.as_release_writer();  -- D-041
  update public.plp_releases set status = 'PUBLISHED' where id = v_rel3;
  get diagnostics n = row_count;
  perform selftest.as_signed_in();
  perform selftest.as_owner();
  if n <> 1 then ok := false; detail := detail || 'a READY course could not be published; '; end if;
  test_id := 'F02-T19'; invariant := 'INV-35';
  if ok then detail := 'the validator coaches and spares legitimate subject language; an ERROR blocks readiness and publication; clean text publishes'; end if;
  return next;

  -- F02-T20 §10/INV-27: assignment is not publication, CLOSED stops new
  -- sessions only, and a release move on an ACTIVE assignment is audited.
  ok := true; detail := '';
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Matematika', 'SD', 'V', 'selftest assignment probe', v_guru) returning id into v_course2;
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course2, '1.0.0', v_guru) returning id into v_rel3;
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course2, '2.0.0', v_guru) returning id into v_rel4;
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
                                             item_count, author_person_id)
    values (v_inst, v_course2, 'Ujian kelas', 'POST_TEST', 'PRACTICE', 5, v_guru) returning id into v_def_p;
  select n.id into v_node from public.org_nodes n
   where n.institution_id = v_inst and n.kind = 'CLASS' limit 1;

  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
                                           academic_period_id)
    values (v_inst, v_rel3, v_course2, v_node,
            (select academic_period_id from public.enrollments where id = v_enr))
    returning id into v_la;
  -- an EDUCATOR holds CAN_ASSIGN_LEARNING; a plain reviewer does not
  perform selftest.as_user('alpha-dean@synthetic.pintar.test');
  begin
    update public.learning_assignments set status = 'ACTIVE' where id = v_la;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'a DEAN activated an assignment; '; end if;
  exception when others then null; end;
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  update public.learning_assignments set status = 'ACTIVE' where id = v_la;
  get diagnostics n = row_count;
  perform selftest.as_owner();
  if n <> 1 then ok := false; detail := detail || 'an EDUCATOR could not activate an assignment; '; end if;
  select count(*) into n from public.learning_assignments
   where id = v_la and assigned_by_person_id is not null and assigned_at is not null;
  if n <> 1 then ok := false; detail := detail || 'the assigning act was not stamped; '; end if;

  -- the release cannot be swapped behind the record
  begin
    update public.learning_assignments set plp_release_id = v_rel4 where id = v_la;
    ok := false; detail := detail || 'a release was swapped without a recorded move; ';
  exception when others then null; end;
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  perform public.move_learning_assignment_release(v_la, v_rel4, 'koreksi materi');
  perform selftest.as_owner();
  select count(*) into n from public.learning_assignments where id = v_la and plp_release_id = v_rel4;
  if n <> 1 then ok := false; detail := detail || 'the release move did not take effect; '; end if;
  select count(*) into n from public.learning_assignment_release_moves
   where learning_assignment_id = v_la and from_release_id = v_rel3 and to_release_id = v_rel4
     and btrim(reason) <> '' and moved_by_person_id is not null;
  if n <> 1 then ok := false; detail := detail || 'the release move was not recorded in full; '; end if;
  select count(*) into n from public.audit_log
   where action = 'LEARNING_RELEASE_MOVED' and target_id = v_la::text;
  if n < 1 then ok := false; detail := detail || 'the release move was not audited; '; end if;

  -- INV-27: closing an assessment assignment touches no session
  insert into public.assessment_assignments (institution_id, assessment_definition_id, node_id,
                                             academic_period_id)
    values (v_inst, v_def_p, v_node, (select academic_period_id from public.enrollments where id = v_enr))
    returning id into v_aa;
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  update public.assessment_assignments set status = 'SCHEDULED' where id = v_aa;
  update public.assessment_assignments set status = 'OPEN' where id = v_aa;
  perform selftest.as_owner();
  select count(*) into n from public.assessment_sessions where status = 'IN_PROGRESS';
  v_find := null;
  update public.assessment_assignments set status = 'CLOSED' where id = v_aa;
  select count(*) into n2 from public.assessment_sessions where status = 'IN_PROGRESS';
  if n <> n2 then ok := false; detail := detail || 'closing an assignment changed a running session (INV-27); '; end if;
  begin
    update public.assessment_assignments set status = 'OPEN' where id = v_aa;
    ok := false; detail := detail || 'a CLOSED assignment reopened; ';
  exception when others then null; end;
  test_id := 'F02-T20'; invariant := 'INV-27 / doc 04 §4';
  if ok then detail := 'assigning needs CAN_ASSIGN_LEARNING and is stamped; a release move is recorded and audited before it applies; CLOSED is terminal and touches no running session'; end if;
  return next;

  -- F02-T21 §11: provenance lands before rows, and Easy Upload never guesses.
  ok := true; detail := '';
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  insert into public.ingest_batches (institution_id, source_kind, raw_payload, producer_identifier)
    values (v_inst, 'EASY_UPLOAD',
            jsonb_build_object('label','selftest ingest probe','files', jsonb_build_array(
              jsonb_build_object('path','pelajaran.md'),
              jsonb_build_object('path','diagram.png'),
              jsonb_build_object('path','narasi.mp3'),
              jsonb_build_object('path','entah.xyz'))),
            'contoh-produsen-v1')
    returning id into v_batch;
  perform selftest.as_owner();

  begin
    update public.ingest_batches set raw_payload = '{}'::jsonb where id = v_batch;
    ok := false; detail := detail || 'the raw import payload was rewritten; ';
  exception when others then null; end;

  perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
  v_map := public.propose_easy_upload_mapping(v_batch);
  perform selftest.as_owner();
  if (v_map -> 'open_questions') = '[]'::jsonb then
    ok := false; detail := detail || 'Easy Upload asked nothing about an unrecognised file; ';
  end if;
  if (v_map ->> 'confidence')::numeric >= 1 then
    ok := false; detail := detail || 'Easy Upload reported full confidence with open questions; ';
  end if;
  select count(*) into n from public.ingest_batches where id = v_batch and status = 'MAPPING_PROPOSED';
  if n <> 1 then ok := false; detail := detail || 'the batch did not move to MAPPING_PROPOSED; '; end if;

  -- nothing is materialised from an unconfirmed mapping
  begin
    update public.ingest_batches set status = 'MATERIALISED' where id = v_batch;
    ok := false; detail := detail || 'an unconfirmed mapping was materialised; ';
  exception when others then null; end;
  begin
    perform selftest.as_draft_author();  -- 0085: an authoring act now names its actor
    perform public.ingest_structured_package(v_batch);
    perform selftest.as_owner();
    ok := false; detail := detail || 'a structured import ran before confirmation; ';
  exception when others then null; end;

  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  update public.ingest_batches set status = 'CONFIRMED' where id = v_batch;
  perform selftest.as_owner();
  select count(*) into n from public.ingest_batches
   where id = v_batch and confirmed_by_person_id is not null and confirmed_at is not null;
  if n <> 1 then ok := false; detail := detail || 'confirmation did not record who confirmed; '; end if;

  -- INV-32: the producer is metadata, and no schema object is named after one
  select count(*) into n from information_schema.columns
   where table_schema in ('public','telemetry')
     and column_name ~* '(openai|anthropic|claude|gemini|gpt|llama|mistral|cohere)';
  if n > 0 then ok := false; detail := detail || 'a provider-named column exists; '; end if;
  select count(*) into n from public.ingest_batches
   where id = v_batch and producer_identifier = 'contoh-produsen-v1';
  if n <> 1 then ok := false; detail := detail || 'the producer identifier was not kept as metadata; '; end if;
  test_id := 'F02-T21'; invariant := 'INV-32 / doc 09';
  if ok then detail := 'the raw payload is immutable provenance; Easy Upload proposes and asks rather than guessing; nothing materialises unconfirmed; the producer is metadata, not a schema object'; end if;
  return next;

  -- F02-T22 INV-02/INV-03: the doctrine constraints refuse bad content at the
  -- database, not in a form validator.
  ok := true; detail := '';
  insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Matematika', 'SD', 'V', 'selftest doctrine probe', v_guru) returning id into v_course2;
  insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_course2, v_inst, 1, 'M', v_guru) returning id into v_mod2;
  insert into public.lessons (module_id, institution_id, ordinal, title, author_person_id)
    values (v_mod2, v_inst, 1, 'L', v_guru) returning id into v_les2;
  begin
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, petunjuk, author_person_id)
      values (v_les2, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Berapa 1/2 + 1/4?', 'Kunci: A', v_guru);
    ok := false; detail := detail || 'a hint naming the answer was saved; ';
  exception when others then null; end;
  begin
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, arah_berpikir, author_person_id)
      values (v_les2, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Berapa 1/2 + 1/4?', 'Pilih antara A atau C', v_guru);
    ok := false; detail := detail || 'a hint narrowing to two options was saved; ';
  exception when others then null; end;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, petunjuk, author_person_id)
    values (v_les2, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Berapa 1/2 + 1/4?',
            'Samakan penyebutnya lebih dulu', v_guru) returning id into v_it;
  begin
    insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale)
      values (v_it, v_inst, 'A', '3/4', true, '   ');
    ok := false; detail := detail || 'an option with an empty rationale was saved; ';
  exception when others then null; end;
  insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale)
    values (v_it, v_inst, 'A', '3/4', true, 'penyebut disamakan menjadi 4');
  test_id := 'F02-T22'; invariant := 'INV-02/INV-03';
  if ok then detail := 'a hint that names or narrows the answer is refused; an option without a rationale is refused; legitimate coaching saves'; end if;
  return next;

  -- F02-T23 INV-24: a post-test excludes every pre-test item AND every sibling.
  ok := true; detail := '';
  v_grp := gen_random_uuid();
  update public.items set parallel_group = v_grp where id = v_it;
  insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, parallel_group, author_person_id)
    values (v_les2, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Berapa 1/4 + 1/2?', v_grp, v_guru)
    returning id into v_ie2;
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course2, '1.0.0', v_guru) returning id into v_rel3;
  insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
                                             item_count, author_person_id)
    values (v_inst, v_course2, 'Pra', 'PRE_TEST', 'PRACTICE', 5, v_guru) returning id into v_def_p;
  select n.id into v_node from public.org_nodes n
   where n.institution_id = v_inst and n.kind = 'CLASS' limit 1;
  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
                                           academic_period_id)
    values (v_inst, v_rel3, v_course2, v_node,
            (select academic_period_id from public.enrollments where id = v_enr))
    returning id into v_la;

  v_pre := public.open_assessment_session(v_enr, v_def_p, v_rel3, 'ONLINE', 'PRE_TEST', 'e', public.scoring_policy_version(),
                                          null, null, null, v_la);
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_pre;
  insert into public.presented_items (session_id, item_id, position) values (v_pre, v_it, 1);

  select count(*) into n from public.excluded_items_for_post_test(
    (select person_id from public.enrollments where id = v_enr), v_la);
  if n <> 2 then
    ok := false; detail := detail || format('the exclusion returned %s item(s), expected the item and its sibling; ', n);
  end if;
  select count(*) into n from public.excluded_items_for_post_test(
    (select person_id from public.enrollments where id = v_enr), v_la) x where x.item_id = v_ie2;
  if n <> 1 then ok := false; detail := detail || 'the parallel sibling was not excluded; '; end if;
  -- and the drawable set honours it
  select count(*) into n from public.drawable_items_for_definition(
    v_def_p, (select person_id from public.enrollments where id = v_enr), null, v_la)
   where item_id in (v_it, v_ie2);
  if n <> 0 then ok := false; detail := detail || 'an excluded item was still drawable; '; end if;
  test_id := 'F02-T23'; invariant := 'INV-24';
  if ok then detail := 'a post-test excludes every pre-test item and every parallel sibling of one; the drawable set honours the exclusion'; end if;
  return next;

  -- F02-T24 INV-13 and the predicted/empirical rule.
  ok := true; detail := '';
  -- the seed never writes an empirical value, and no column defaults to one.
  -- Scoped to seeded content: F02-T05 and F02-T07 deliberately write an
  -- empirical value on their own probe item, to prove that doing so does not
  -- move the content hash. Counting those here would make this test contradict
  -- the one that earns them.
  select count(*) into n from public.items i
    join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
   where c.title not like 'selftest %'
     and (i.empirical_difficulty is not null or i.empirical_discrimination is not null
       or i.empirical_evidence_count is not null);
  if n > 0 then ok := false; detail := detail || format('%s seeded item(s) carry an empirical value; ', n); end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='items'
     and column_name like 'empirical%' and column_default is not null;
  if n > 0 then ok := false; detail := detail || 'an empirical column carries a default; '; end if;
  -- INV-13: the cohort view is scoped per institution, so two tenants never
  -- see each other's rows even when the same misconception code exists
  select count(*) into n from public.service_cohort_misconceptions
   where institution_id not in (select id from public.institutions where is_synthetic);
  if n > 0 then ok := false; detail := detail || 'the cohort view leaked a non-synthetic institution; '; end if;
  select count(*) into n from pg_attribute
   where attrelid = 'public.service_cohort_misconceptions'::regclass
     and attname in ('person_id','enrollment_id') and attnum > 0;
  if n > 0 then ok := false; detail := detail || 'the cohort view exposes a learner identity; '; end if;
  if not exists (select 1 from pg_attribute where attrelid = 'public.service_cohort_misconceptions'::regclass
                  and attname = 'institution_id' and attnum > 0) then
    ok := false; detail := detail || 'the cohort view is not tenant-scoped; ';
  end if;
  test_id := 'F02-T24'; invariant := 'INV-13 / doc 02';
  if ok then detail := 'no seeded item carries an empirical value and no empirical column defaults to one; the cohort view is tenant-scoped and carries no learner identity'; end if;
  return next;

  perform selftest.purge_probe_content('selftest ');

  test_id := 'F02-DONE'; invariant := '-'; ok := true;
  detail := format('elapsed %s ms', round(extract(epoch from clock_timestamp() - t0) * 1000));
  return next;
end $$;

-- The entrypoint is entered over the owner connection only.
revoke all on function selftest.run_fable02() from public;

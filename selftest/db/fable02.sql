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

create or replace function selftest.run_fable02()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_guru uuid; v_hod uuid; v_admin uuid;
  v_course uuid; v_module uuid; v_lesson uuid; v_lesson2 uuid; v_obj uuid; v_item uuid;
  v_release uuid; v_sha text; v_sha2 text; h1 text; h3 text;
  v_beta uuid; v_hop uuid;
  v_frozen timestamptz; v_published timestamptz;
  n int;
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
  update public.courses set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_course;
  select count(*) into n from public.courses where id = v_course and reviewed_at is not null;
  if n <> 1 then ok := false; detail := detail || 'reviewed_at not stamped; '; end if;
  test_id := 'F02-T02'; invariant := 'doc 04 §1';
  if ok then detail := 'self-approval and reviewer-less approval refused; distinct reviewer stamped'; end if;
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
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_release;
  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  update public.plp_releases set status = 'FROZEN'     where id = v_release;
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
    update public.plp_releases set status = 'PUBLISHED' where id = v_release;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'an EDUCATOR published; '; end if;
    if n = 0 then ok := false; detail := detail || 'the EDUCATOR could not see the release at all; '; end if;
  exception when others then null; end;

  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  begin
    update public.plp_releases set status = 'PUBLISHED' where id = v_release;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'a HEAD_OF_DEPARTMENT published without CAN_PUBLISH; '; end if;
    if n = 0 then ok := false; detail := detail || 'the HEAD_OF_DEPARTMENT could not see the release at all; '; end if;
  exception when others then null; end;

  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  update public.plp_releases set status = 'PUBLISHED' where id = v_release;
  get diagnostics n = row_count;
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
  -- A second release on the same course, driven to APPROVED as the owner --
  -- APPROVED carries no capability gate -- then frozen by each caller in turn.
  ok := true; detail := '';
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course, '2.0.0', v_guru) returning id into v_release;
  update public.plp_releases set status = 'STRUCTURED' where id = v_release;
  update public.plp_releases set status = 'VALIDATED'  where id = v_release;
  update public.plp_releases set status = 'IN_REVIEW'  where id = v_release;
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_release;

  begin
    update public.plp_releases set status = 'FROZEN' where id = v_release;
    ok := false; detail := detail || 'the owner connection, which has no person, sealed content; ';
  exception when others then null; end;

  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  begin
    update public.plp_releases set status = 'FROZEN' where id = v_release;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'an EDUCATOR sealed content without CAN_FREEZE_RELEASE; '; end if;
    if n = 0 then ok := false; detail := detail || 'the EDUCATOR could not see the release at all; '; end if;
  exception when others then null; end;

  perform selftest.as_user('alpha-hod@synthetic.pintar.test');
  update public.plp_releases set status = 'FROZEN' where id = v_release;
  get diagnostics n = row_count;
  if n <> 1 then ok := false; detail := detail || 'the CAN_FREEZE_RELEASE holder could not seal; '; end if;
  -- the same caller holds CAN_FREEZE_RELEASE but not CAN_PUBLISH
  begin
    update public.plp_releases set status = 'PUBLISHED' where id = v_release;
    get diagnostics n = row_count;
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
  update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_hod where id = v_release;

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
    update public.plp_releases set institution_id = v_beta, status = 'FROZEN' where id = v_release;
    get diagnostics n = row_count;
    if n > 0 then ok := false; detail := detail || 'a release was carried into another institution and sealed there; '; end if;
  exception when others then null; end;
  begin
    update public.plp_releases set institution_id = v_beta where id = v_release;
    get diagnostics n = row_count;
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

  perform selftest.purge_probe_content('selftest ');

  test_id := 'F02-DONE'; invariant := '-'; ok := true;
  detail := format('elapsed %s ms', round(extract(epoch from clock_timestamp() - t0) * 1000));
  return next;
end $$;

-- The entrypoint is entered over the owner connection only.
revoke all on function selftest.run_fable02() from public;

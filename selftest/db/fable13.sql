-- FABLE-13 database suite: BOB-04, a lesson is assigned whole (D-008, audit B4).
--
-- Ordering: depends on fable01.sql (role switches), fable03.sql (answer_paper,
-- over the seeded learning-cycle school), fable11.sql (f11_user, f11_batch,
-- f11_raised, f11_note) and fable12.sql (f12_advance). Never applied as a
-- migration; never present in production.
--
-- It works inside the seeded learning-cycle school (supabase/seed/
-- learning_cycle.sql): its teacher uploads a package, its head of department
-- reviews, its admin releases, and its email learner -- a member of the class
-- -- takes the cycle.
--
--   F13-P01  a package's course carries its PRE_TEST and POST_TEST, reviewed
--            with it; assigning the published release makes the learning
--            assignment and both tests, open, in one call, audited
--   F13-P02  the learner completes pre -> lesson -> post -> result, and each
--            test draws only the questions marked for it
--   F13-N01  a lesson that cannot make a whole cycle is refused with its code
--            and makes nothing: no pre-test, a post-test that shares parallel
--            groups with the pre-test (INV-24; made after upload, as hand-authored
--            content still could), an unpublished release, a second
--            assignment, a bad window, a class that is not one, and people who
--            may not assign
--   F13-N02  a stranger asking for someone's cycle gets a code, not the cycle
--   F13-N03  the upload refuses a parallel group that holds both a pre-test and
--            a post-test question, naming every row of it (D-040)
--   F13-K13..K15  C1w F-1, Sharon's correction (C1W-F1-CORRECTION.md §0): the learner's own review of a corrected
--            answer returns no sealed rationale; see f13_ulasan.
--   F13-K01..K12  C1w F-1 (O41-21): after a governed key correction, every view that
--            marks an answer or derives a misconception or remediation from it reads
--            the key in force; uncorrected sittings read as before; history and the
--            catalogue unchanged. Over the official bootstrap school (fable04.sql's
--            boot_fixture, fable06.sql's f06p10_person); see selftest.f13_kunci below.
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f12_advance(uuid, public.content_status)') is null
     or to_regprocedure('selftest.answer_paper(uuid, boolean, boolean)') is null then
    raise exception 'apply fable03.sql and fable12.sql before fable13.sql';
  end if;
end $$;

-- A package of one lesson: p_pre questions for the pre-test, p_post for the
-- post-test, one practice question. Each pre question has its own parallel
-- group; the post questions share them when p_overlap, and have their own
-- otherwise.
create or replace function selftest.f13_paket(p_title text, p_pre int, p_post int, p_overlap boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object('courses', jsonb_build_array(jsonb_build_object(
    'title', p_title, 'subject', 'Matematika', 'stage', 'SD', 'grade_label', 'Kelas 5',
    'modules', jsonb_build_array(jsonb_build_object('title', 'Bab satu', 'lessons', jsonb_build_array(
      jsonb_build_object('title', 'Pelajaran satu', 'body_markdown', 'Isi pelajaran untuk murid kelas lima.',
        'items',
          coalesce((select jsonb_agg(jsonb_build_object(
              '_row', jsonb_build_object('sheet', 'Soal', 'row', k + 1),
              'stem', format('Pertanyaan awal nomor %s tentang pecahan?', k), 'use', 'PRE_TEST',
              'parallel_group', 'A' || k,
              'options', jsonb_build_array(
                jsonb_build_object('label', 'A', 'body', format('Pilihan tepat %s', k), 'is_correct', true, 'rationale', 'Ini tepat.'),
                jsonb_build_object('label', 'B', 'body', format('Pilihan lain %s', k), 'is_correct', false, 'rationale', 'Ini belum tepat.'))))
             from generate_series(1, p_pre) k), '[]'::jsonb)
          || coalesce((select jsonb_agg(jsonb_build_object(
              '_row', jsonb_build_object('sheet', 'Soal', 'row', p_pre + k + 1),
              'stem', format('Pertanyaan akhir nomor %s tentang pecahan?', k), 'use', 'POST_TEST',
              'parallel_group', case when p_overlap then 'A' || k else 'B' || k end,
              'options', jsonb_build_array(
                jsonb_build_object('label', 'A', 'body', format('Pilihan tepat %s', k), 'is_correct', true, 'rationale', 'Ini tepat.'),
                jsonb_build_object('label', 'B', 'body', format('Pilihan lain %s', k), 'is_correct', false, 'rationale', 'Ini belum tepat.'))))
             from generate_series(1, p_post) k), '[]'::jsonb)
          || jsonb_build_array(jsonb_build_object(
              'stem', 'Pertanyaan latihan tentang pecahan?',
              'options', jsonb_build_array(
                jsonb_build_object('label', 'A', 'body', 'Pilihan tepat latihan', 'is_correct', true, 'rationale', 'Ini tepat.'),
                jsonb_build_object('label', 'B', 'body', 'Pilihan lain latihan', 'is_correct', false, 'rationale', 'Ini belum tepat.'))))
      )))))))
$$;
revoke all on function selftest.f13_paket(text, int, int, boolean) from public;
grant execute on function selftest.f13_paket(text, int, int, boolean) to authenticated;

-- A package taken all the way to a PUBLISHED release, by the people the
-- capabilities name: the teacher uploads, the head of department approves and
-- freezes, the admin creates and publishes. Returns the course and release.
-- p_publish false stops at FROZEN.
-- the earlier three-argument form, so a reload onto an existing database is not ambiguous
drop function if exists selftest.f13_release(uuid, jsonb, boolean);
create or replace function selftest.f13_release(p_inst uuid, p_paket jsonb, p_publish boolean default true,
                                                p_overlap boolean default false)
returns table (course uuid, release uuid)
language plpgsql set search_path = public, pg_temp as $$
declare v_batch uuid; v jsonb; r record;
begin
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v_batch := selftest.f11_batch(p_inst, 'STRUCTURED_PACKAGE', p_paket);
  perform public.prepare_ingest_batch(v_batch);
  v := public.confirm_ingest_batch(v_batch);
  if (v ->> 'ok')::boolean is not true then raise exception 'the fixture package did not materialise: %', left(v::text, 160); end if;
  course := (v -> 'courses' ->> 0)::uuid;
  -- p_overlap: after the upload (which refuses it, D-040), each post-test
  -- question joins the parallel group of a pre-test question, as hand-authored
  -- content still could -- so assign_release's own INV-24 check is exercised
  if p_overlap then
    perform selftest.as_owner();
    with pre as (select i.parallel_group g, row_number() over (order by i.stem) n from public.items i
                   join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
                  where m.course_id = course and i.cycle_role = 'PRE_TEST'),
         post as (select i.id, row_number() over (order by i.stem) n from public.items i
                   join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
                  where m.course_id = course and i.cycle_role = 'POST_TEST')
    update public.items it set parallel_group = pre.g from post join pre on pre.n = post.n where it.id = post.id;
    perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  end if;
  perform selftest.f12_advance(course, 'STRUCTURED');
  perform selftest.f12_advance(course, 'VALIDATED');
  perform selftest.f12_advance(course, 'IN_REVIEW');
  perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
  perform selftest.f12_advance(course, 'APPROVED');
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  release := (public.create_release(course) ->> 'release')::uuid;
  perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
  v := public.freeze_release(release);
  if (v ->> 'ok')::boolean is not true then raise exception 'the fixture release did not freeze: %', left(v::text, 160); end if;
  for r in select f.id from public.mcq_quality_findings f where f.course_id = course and f.acknowledged_at is null loop
    perform public.acknowledge_finding('MCQ_QUALITY', r.id, 'F13');
  end loop;
  for r in select f.id from public.coaching_findings f where f.course_id = course and f.acknowledged_at is null loop
    perform public.acknowledge_finding('COACHING', r.id, 'F13');
  end loop;
  if p_publish then
    perform selftest.as_user('siklus-admin@synthetic.pintar.test');
    perform public.publish_release(release);
  end if;
  perform selftest.as_owner();
  return next;
end $$;
revoke all on function selftest.f13_release(uuid, jsonb, boolean, boolean) from public;
grant execute on function selftest.f13_release(uuid, jsonb, boolean, boolean) to authenticated;

-- A refusal's stable code, or null when the call went through.
create or replace function selftest.f13_code(p_sql text)
returns text language sql set search_path = public, pg_temp as $$
  select case when e is null then null when e ->> 'code' = 'PR050' then e ->> 'detail'
              else coalesce(e ->> 'code', '?') || ' ' || left(coalesce(e ->> 'message', ''), 120) end
    from selftest.f11_raised(p_sql) e
$$;
revoke all on function selftest.f13_code(text) from public;
grant execute on function selftest.f13_code(text) to authenticated, anon;

-- ═══════════════════════════════════════════════════════════════ F13-K: THE KEY IN FORCE (C1w F-1, O41-21)
-- C1W-F1-CORRECTION.md §5, §9. After a governed key correction every view that marks an answer, or derives a
-- misconception or a remediation from that marking, reads the key in force for the sitting (the basis of
-- hasil_murid_id, through kunci_berlaku_sesi), never the sealed key; a sitting with no governed correction reads as
-- it did. Over the official bootstrap school (only OFFICIAL evidence reaches the class figures): a package whose
-- «Pertanyaan awal nomor 1» (X, a Pemetaan Awal question, so its reading map is the learner's) has two options, A (the sealed key) and B, each naming a misconception of the
-- package's own; a class of eleven, six choosing B on X (wrong by the sealed key, right once the key is corrected to
-- B) and five choosing A (the converse); every other answer right. The school's administrator proposes A -> B and its
-- head of department confirms. Everything is one subtransaction, undone.
--
--   F13-K01  row 1 · service_cohort_misconceptions and the catalogue figure class.misconceptions: before, B's
--            misconception (six learners) and not A's; after, A's (five) and not B's.
--   F13-K23  F1-R1b's marker: every question's ada_tak_terkait is whether a wrong option, by the key shown, has no code
--   F13-K02  row 2 · teacher_question_evidence: X answered rightly by the six; B is the key shown, A is was_key, the
--            question says key_corrected; each of the six is marked right and each of the five wrong.
--   F13-K03  row 3 · reading_map: a learner of the six is no longer sent to B's remediation; a learner of the five is
--            sent to A's.
--   F13-K04  row 4 · session_misconceptions: the same for one sitting.
--   F13-K05  row 5 · service_item_statistics and item.correctness_rate: X's correct count is the six, not the five.
--   F13-K06..K10  the uncorrected world, one per view (K06 the cohort view, K07 the teacher's evidence, K08 the reading
--            map, K09 session_misconceptions, K10 the item statistics): before the correction, and after it for every
--            sitting and question it did not reach, each view's rows are byte-identical to the same view reading the
--            sealed key (selftest.f13_kunci_segel: the corrected definition with its key-in-force fragments put back
--            to the sealed read the migration replaced).
--   F13-K11  history: the sealed question, its options and release, every original result and every response are
--            byte-identical after the correction and after every view above was read; each sitting's original marking
--            is still read through riwayat_hasil_sesi (SEALED, then KEY_CORRECTED, current).
--   F13-K12  the catalogue: class.misconceptions' rows in every catalogue version, the live version, its sources and
--            its calculator are what they were (pinned), so its definition, name, version and denominator did not move.

-- The corrected definitions put back to the sealed-key read they replaced (20270117100000), in this transaction:
-- the same fragment pairs the migration's own check reverses. p_only names one object, or all when null. Raises when a
-- fragment is not where it is expected, so a comparison is never made against a definition that did not move.
create or replace function selftest.f13_kunci_segel(p_only text default null)
returns void language plpgsql set search_path = public, pg_temp as $$
declare r record; v_def text; v_back text; p text[];
begin
  for r in select * from (values
    ('tqe', 'f', 'public.teacher_question_evidence(uuid,uuid)'),
    ('sm',  'f', 'public.session_misconceptions(uuid)'),
    ('rm',  'f', 'public.reading_map(uuid)'),
    ('scm', 'v', 'public.service_cohort_misconceptions'),
    ('sis', 'v', 'public.service_item_statistics')) x(k, kind, obj)
   where p_only is null or x.k = p_only
  loop
    if r.kind = 'f' then v_def := pg_get_functiondef(r.obj::regprocedure);
    else v_def := pg_get_viewdef(r.obj::regclass); end if;
    v_back := v_def;
    foreach p slice 1 in array (case r.k
      when 'tqe' then array[
        -- F1-R1b's marker (20270117140000 step 6b), read by the sealed key like every other line of this reading
        array[E'and not coalesce(q.kunci ? o2.label, o2.is_correct) and o2.misconception_code is null),\n', E'and not o2.is_correct and o2.misconception_code is null),\n'],
        array[E'  kunci as (               -- F-1 (O41-21): the key in force for these sittings, where a governed correction recorded one\n    select k.session_id, k.item_id, k.kunci, k.pada from sit st cross join lateral public.kunci_berlaku_sesi(st.id) k\n  ),\n', ''],
        array[E'public.nilai_jawaban_berlaku(st.id, p.item_id, f.value) end as nilai,\n           kk.kunci, kk.pada\n', E'public.grade_response(p.item_id, f.value) end as nilai\n'],
        array[E'      left join kunci kk on kk.session_id = st.id and kk.item_id = p.item_id\n', ''],
        array[E'           count(*) as disajikan,\n           nullif((jsonb_agg(to_jsonb(j.kunci) order by j.pada desc) filter (where j.kunci is not null)) -> 0,\n                  to_jsonb(public.soal_kunci(j.item_id))) as kunci   -- the key in force, where it is not the sealed one\n', E'           count(*) as disajikan\n'],
        array[E'''is_key'', coalesce(q.kunci ? o.label, o.is_correct))\n                                                      || case when q.kunci is null then ''{}''::jsonb else jsonb_build_object(''was_key'', o.is_correct) end\n', E'''is_key'', o.is_correct)\n'],
        array[E'             || case when q.kunci is null then ''{}''::jsonb else jsonb_build_object(''key_corrected'', true) end\n', '']]
      when 'sm' then array[
        array[E'    left join public.kunci_berlaku_sesi(p_session) kb on kb.item_id = f.item_id   -- F-1 (O41-21): the key in force\n', ''],
        array['and not coalesce(o.label = any (kb.kunci), o.is_correct)', 'and not o.is_correct']]
      when 'rm' then array[
        array[E' end as score,\n           kb.kunci   -- F-1 (O41-21): the key in force, where a governed correction recorded one\n', E' end as score\n'],
        array[E'      left join public.kunci_berlaku_sesi(p_session) kb on kb.item_id = f.item_id\n', ''],
        array['and not coalesce(o2.label = any (g2.kunci), o2.is_correct)', 'and not o2.is_correct']]
      when 'scm' then array[
        array['FROM (((((academic_responses r', 'FROM ((((academic_responses r'],
        array[E'\n             LEFT JOIN kunci_berlaku_sesi() kb(session_id, item_id, kunci, pada) ON (((kb.session_id = s.id) AND (kb.item_id = p.item_id))))', ''],
        array['NOT COALESCE((o.label = ANY (kb.kunci)), o.is_correct)', 'NOT o.is_correct']]
      when 'sis' then array[
        array['FROM ((((items i', 'FROM (((items i'],
        array[E'\n     LEFT JOIN kunci_berlaku_sesi() kb(session_id, item_id, kunci, pada) ON (((kb.session_id = r.session_id) AND (kb.item_id = i.id))))', ''],
        array['COALESCE((o.label = ANY (kb.kunci)), o.is_correct)', 'o.is_correct']]
      end)
    loop
      if position(p[1] in v_back) = 0 then
        raise exception 'f13_kunci_segel: % does not carry the key-in-force fragment «%»', r.obj, left(p[1], 70);
      end if;
      v_back := replace(v_back, p[1], p[2]);
    end loop;
    if r.kind = 'f' then execute v_back;
    else execute 'create or replace view ' || r.obj || ' as ' || v_back;
    end if;
  end loop;
end $$;
revoke all on function selftest.f13_kunci_segel(text) from public;

-- An answer by its option's label: the display position the learner's paper shows it at.
create or replace function selftest.f13_kunci_label(p_presented uuid, p_label text)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('posisi', d.display_position)
    from public.presented_items p cross join lateral public.option_display_order(p.session_id, p.item_id) d
   where p.id = p_presented and d.label = p_label
$$;
revoke all on function selftest.f13_kunci_label(uuid, text) from public;
grant execute on function selftest.f13_kunci_label(uuid, text) to authenticated;

-- One learner sits one test of the class: X answered with p_x, every other question rightly; handed in.
create or replace function selftest.f13_kunci_duduk(p_uid uuid, p_aa uuid, p_x uuid, p_x_label text)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_s uuid; r record;
begin
  perform selftest.as_user_uid(p_uid);
  v_s := public.start_learning_session(p_aa);
  for r in select p.id, p.item_id from public.presented_items p where p.session_id = v_s order by p.position loop
    perform public.record_answer(r.id, 1,
      case when r.item_id = p_x then selftest.f13_kunci_label(r.id, p_x_label) else selftest.f09_answer(r.id, true) end);
  end loop;
  perform public.finish_my_session(v_s);
  perform selftest.as_owner();
  return v_s;
end $$;
revoke all on function selftest.f13_kunci_duduk(uuid, uuid, uuid, text) from public;

-- What each view answers, as one comparable text per view (rows sorted where the view has no order of its own).
create or replace function selftest.f13_kunci_baca(p_kelas uuid, p_aa uuid, p_guru uuid, p_sesi jsonb, p_x uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v jsonb := '{}'::jsonb; k text; s uuid;
begin
  perform selftest.as_owner();
  v := v || jsonb_build_object('scm_kelas', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text), '[]'::jsonb)
                                               from public.service_cohort_misconceptions x where x.class_node_id = p_kelas));
  v := v || jsonb_build_object('scm_lain', (select md5(coalesce(string_agg(to_jsonb(x)::text, '|' order by to_jsonb(x)::text), ''))
                                              from public.service_cohort_misconceptions x where x.class_node_id is distinct from p_kelas));
  v := v || jsonb_build_object('sis_x', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text), '[]'::jsonb)
                                           from public.service_item_statistics x where x.item_id = p_x));
  v := v || jsonb_build_object('sis_lain', (select md5(coalesce(string_agg(to_jsonb(x)::text, '|' order by to_jsonb(x)::text), ''))
                                              from public.service_item_statistics x where x.item_id <> p_x));
  for k, s in select e.key, (e.value #>> '{}')::uuid from jsonb_each(p_sesi) e loop
    v := v || jsonb_build_object('sm_' || k, (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text), '[]'::jsonb)
                                                from public.session_misconceptions(s) x));
    perform selftest.as_user_uid((select a.auth_user_id from public.accounts a join public.assessment_sessions ss on ss.person_id = a.person_id where ss.id = s));
    v := v || jsonb_build_object('rm_' || k, (select coalesce(jsonb_agg(to_jsonb(x) order by x.peringkat), '[]'::jsonb) from public.reading_map(s) x));
    perform selftest.as_owner();
  end loop;
  perform selftest.as_user_uid(p_guru);
  v := v || jsonb_build_object('tqe', public.teacher_question_evidence(p_aa, p_kelas));
  perform selftest.as_owner();
  return v;
end $$;
revoke all on function selftest.f13_kunci_baca(uuid, uuid, uuid, jsonb, uuid) from public;

-- Sealed content, original results and responses of the class's sittings, as one fingerprint.
create or replace function selftest.f13_kunci_sidik(p_course uuid, p_sesi uuid[])
returns text language sql stable set search_path = public, pg_temp as $$
  select md5(coalesce((select string_agg(to_jsonb(i)::text || coalesce((select string_agg(to_jsonb(o)::text, ',' order by o.label) from public.item_options o where o.item_id = i.id), ''), '|' order by i.id)
                  from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = p_course), '')
          || '#' || coalesce((select r.content_sha256 from public.plp_releases r where r.course_id = p_course), '')
          || '#' || coalesce((select public.course_content_sha256(p_course)), '')
          || '#' || coalesce((select string_agg(to_jsonb(r)::text, '|' order by r.id) from public.responses r where r.session_id = any (p_sesi)), '')
          || '#' || coalesce((select string_agg(to_jsonb(p)::text, '|' order by p.id) from public.presented_items p where p.session_id = any (p_sesi)), '')
          || '#' || coalesce((select string_agg(to_jsonb(r)::text, '|' order by r.id) from public.assessment_results r where r.session_id = any (p_sesi) and r.supersedes_result_id is null), ''))
$$;
revoke all on function selftest.f13_kunci_sidik(uuid, uuid[]) from public;

-- The F13-K world, in the caller's transaction: a class of p_n learners of the official bootstrap school (the first p_b
-- choose B on X, the rest A), its teacher, the package published by the school's people and its Pemetaan Awal sat.
-- Returns the ids the suite reads. Also the fixture of the F-1 evidence (the whole-world identity and the cohort
-- view's plan on a class-sized class).
-- p_c (F13-K24): X gains a third option C, wrong, with a rationale: '-' with no misconception code, else that code
drop function if exists selftest.f13_kunci_dunia(int, int);
create or replace function selftest.f13_kunci_dunia(p_n int default 11, p_b int default 6, p_c text default null)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare
  f record; v_tag text := substr(md5(random()::text), 1, 8); v_inst uuid; v_k5 uuid; v_par uuid; v_per uuid; v_prog uuid;
  v_kelas uuid; v_guru uuid; v_guru_p uuid; v_b uuid; v jsonb; v_course uuid; v_rel uuid; v_la uuid; v_pre uuid; v_post uuid;
  v_x uuid; v_u uuid; v_p uuid; v_e uuid; i int; v_sesi jsonb := '{}'::jsonb; v_semua uuid[] := '{}'; v_s uuid;
begin
  perform selftest.as_owner();
    select * into f from selftest.boot_fixture();
    if f.inst is null then raise exception 'the bootstrap school is absent'; end if;
    v_inst := f.inst;
    select la.node_id, la.academic_period_id into v_k5, v_per from public.learning_assignments la where la.id = f.la;
    select n2.parent_id into v_par from public.org_nodes n2 where n2.id = v_k5;
    select e.programme_id into v_prog from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
     where mm.node_id = v_k5 and mm.valid_to is null limit 1;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_par, 'CLASS', 'Kelas F13K ' || v_tag, v_per) returning id into v_kelas;
    select a.person_id, a.auth_user_id into v_guru_p, v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id
     where u.email = 'boot-guru@bootstrap.pintar.test';
    insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
    values (v_guru_p, 'EDUCATOR', v_kelas, v_inst, now() - interval '1 day', now() + interval '365 days');
    for i in 1..p_n loop
      v_u := selftest.f06p10_person('f13k-' || v_tag || '-' || i);
      select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (v_p, v_inst, v_per, v_prog, 'ACTIVE') returning id into v_e;
      insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_kelas, v_per);
      v_sesi := v_sesi || jsonb_build_object('u' || i, v_u);
    end loop;
    perform set_config('app.seed_intent', '', true);

    -- the package, with two misconceptions of its own on X's options, uploaded by the school's teacher and taken
    -- through review, lock and publication by the school's own people
    v := selftest.f13_paket('F13K ' || v_tag, 3, 2, false);
    v := jsonb_set(v, '{courses,0,modules,0,lessons,0,objective}', '{"statement": "Memahami pecahan senilai."}');
    v := jsonb_set(v, '{misconceptions}', jsonb_build_array(
           jsonb_build_object('code', 'F13K-A', 'label', 'Keliru A', 'description', 'Memilih A pada soal ini.', 'remediation', 'Ulangi bagian A.'),
           jsonb_build_object('code', 'F13K-B', 'label', 'Keliru B', 'description', 'Memilih B pada soal ini.', 'remediation', 'Ulangi bagian B.')));
    v := jsonb_set(v, '{courses,0,modules,0,lessons,0,items,0,options,0,misconception_code}', '"F13K-A"');
    v := jsonb_set(v, '{courses,0,modules,0,lessons,0,items,0,options,1,misconception_code}', '"F13K-B"');
    if p_c is not null then
      v := jsonb_set(v, '{courses,0,modules,0,lessons,0,items,0,options}', (v #> '{courses,0,modules,0,lessons,0,items,0,options}')
             || jsonb_build_array(jsonb_build_object('label', 'C', 'body', 'Pilihan ketiga', 'is_correct', false, 'rationale', 'Ini juga belum tepat.')
                                  || case when p_c = '-' then '{}'::jsonb else jsonb_build_object('misconception_code', p_c) end));
    end if;
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    v_b := selftest.f11_batch(v_inst, 'STRUCTURED_PACKAGE', v);
    perform public.prepare_ingest_batch(v_b);
    v := public.confirm_ingest_batch(v_b);
    if (v ->> 'ok')::boolean is not true then raise exception 'the package did not materialise: %', left(v::text, 200); end if;
    v_course := (v -> 'courses' ->> 0)::uuid;
    perform selftest.f12_advance(v_course, 'STRUCTURED');
    perform selftest.f12_advance(v_course, 'VALIDATED');
    perform selftest.f12_advance(v_course, 'IN_REVIEW');
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    perform selftest.f12_advance(v_course, 'APPROVED');
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    v_rel := (public.create_release(v_course) ->> 'release')::uuid;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    v := public.freeze_release(v_rel);
    if (v ->> 'ok')::boolean is not true then raise exception 'the release did not freeze: %', left(v::text, 200); end if;
    perform public.acknowledge_finding('MCQ_QUALITY', x.id, 'F13K') from public.mcq_quality_findings x where x.course_id = v_course and x.acknowledged_at is null;
    perform public.acknowledge_finding('COACHING', x.id, 'F13K') from public.coaching_findings x where x.course_id = v_course and x.acknowledged_at is null;
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    perform public.publish_release(v_rel);
    perform selftest.as_owner();
    perform selftest.pass_mark(v_inst, v_course);
    select i2.id into v_x from public.items i2 join public.lessons l on l.id = i2.lesson_id join public.modules m2 on m2.id = l.module_id
     where m2.course_id = v_course and i2.stem like 'Pertanyaan awal nomor 1%';
    if (select string_agg(o.label || ':' || o.is_correct || ':' || coalesce(o.misconception_code, '-'), ',' order by o.label) from public.item_options o where o.item_id = v_x)
       is distinct from (case when p_c is null then 'A:true:F13K-A,B:false:F13K-B' else 'A:true:F13K-A,B:false:F13K-B,C:false:' || p_c end) then
      raise exception 'X is not the question this suite needs';
    end if;
    perform selftest.as_user_uid(v_guru);
    v := public.assign_release(v_rel, v_kelas, now(), null);
    perform selftest.as_owner();
    v_la := (v ->> 'learning_assignment')::uuid; v_pre := (v ->> 'pre_assignment')::uuid; v_post := (v ->> 'post_assignment')::uuid;

    -- the class sits: the first p_b learners choose B on X, the rest choose A
    for i in 1..p_n loop
      v_u := (v_sesi ->> ('u' || i))::uuid;
      v_s := selftest.f13_kunci_duduk(v_u, v_pre, v_x, case when i <= p_b then 'B' else 'A' end);
      v_sesi := v_sesi || jsonb_build_object('s' || i, v_s);
      v_semua := v_semua || v_s;
    end loop;
    if (select count(*) from public.official_sessions o where o.id = any (v_semua)) <> p_n then
      raise exception 'the class''s sittings are not official evidence';
    end if;

  return jsonb_build_object('inst', v_inst, 'kelas', v_kelas, 'guru', v_guru, 'course', v_course, 'rel', v_rel, 'la', v_la,
                            'pre', v_pre, 'post', v_post, 'x', v_x, 'sesi', v_sesi, 'semua', to_jsonb(v_semua));
end $$;
revoke all on function selftest.f13_kunci_dunia(int, int, text) from public;

create or replace function selftest.f13_kunci()
returns table (id text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v_inst uuid; v_kelas uuid; v_guru uuid; v jsonb; v_course uuid; v_pre uuid; v_x uuid; i int;
  v_sesi jsonb := '{}'::jsonb; v_semua uuid[] := '{}'; v_k uuid; v_cat text; v_sebelum jsonb; v_sebelum_segel jsonb; v_sesudah jsonb; v_sesudah_segel jsonb; v_sidik text;
  v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_t text; v_q jsonb; n int; m int; v_fig jsonb;
  v_rem_a text; v_rem_b text;
begin
  perform selftest.as_owner();
  begin
    v := selftest.f13_kunci_dunia(11, 6);
    v_inst := (v ->> 'inst')::uuid; v_kelas := (v ->> 'kelas')::uuid; v_guru := (v ->> 'guru')::uuid; v_course := (v ->> 'course')::uuid;
    v_pre := (v ->> 'pre')::uuid; v_x := (v ->> 'x')::uuid; v_sesi := v -> 'sesi';
    v_semua := array(select jsonb_array_elements_text(v -> 'semua')::uuid);

    -- ── the uncorrected world: each view as it reads now, and as the sealed key reads it
    v_sebelum := selftest.f13_kunci_baca(v_kelas, v_pre, v_guru, jsonb_build_object('w', v_sesi -> 's1', 'r', v_sesi -> 's7'), v_x);
    begin
      perform selftest.f13_kunci_segel();
      v_sebelum_segel := selftest.f13_kunci_baca(v_kelas, v_pre, v_guru, jsonb_build_object('w', v_sesi -> 's1', 'r', v_sesi -> 's7'), v_x);
      raise exception 'F13K_SEGEL_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'F13K_SEGEL_UNDO' then v_sebelum_segel := jsonb_build_object('gagal', sqlerrm); end if;
    end;
    v_sidik := selftest.f13_kunci_sidik(v_course, v_semua);

    -- ── the correction: the school's administrator proposes B, its head of department confirms
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    v_k := (public.ajukan_koreksi_kunci(v_x, array['B'], 'uji F13K: kunci jawaban soal ini keliru') ->> 'koreksi')::uuid;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    v := public.tegaskan_koreksi_kunci(v_k);
    perform selftest.as_owner();
    if (v ->> 'ok')::boolean is not true or (v ->> 'dihitung_ulang')::int <> 11 then
      raise exception 'the correction did not recalculate the eleven sittings: %', left(v::text, 200);
    end if;

    v_sesudah := selftest.f13_kunci_baca(v_kelas, v_pre, v_guru, jsonb_build_object('w', v_sesi -> 's1', 'r', v_sesi -> 's7'), v_x);
    begin
      perform selftest.f13_kunci_segel();
      v_sesudah_segel := selftest.f13_kunci_baca(v_kelas, v_pre, v_guru, jsonb_build_object('w', v_sesi -> 's1', 'r', v_sesi -> 's7'), v_x);
      raise exception 'F13K_SEGEL_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'F13K_SEGEL_UNDO' then v_sesudah_segel := jsonb_build_object('gagal', sqlerrm); end if;
    end;

    -- ═══ F13-K01  the cohort view and the catalogue figure
    v_t := (select string_agg(x ->> 'misconception_code' || ':' || (x ->> 'learners') || ':' || (x ->> 'occurrences'), ',' order by x ->> 'misconception_code')
              from jsonb_array_elements(v_sebelum -> 'scm_kelas') x where x ->> 'misconception_code' like 'F13K-%');
    if v_t is distinct from 'F13K-B:6:6' then
      v_probs := selftest.f11_note(v_probs, 'F13-K01', 'before the correction the class''s misconceptions were ' || coalesce(v_t, 'none') || ' (expected F13K-B:6:6)');
    end if;
    v_t := (select string_agg(x ->> 'misconception_code' || ':' || (x ->> 'learners') || ':' || (x ->> 'occurrences'), ',' order by x ->> 'misconception_code')
              from jsonb_array_elements(v_sesudah -> 'scm_kelas') x where x ->> 'misconception_code' like 'F13K-%');
    if v_t is distinct from 'F13K-A:5:5' then
      v_probs := selftest.f11_note(v_probs, 'F13-K01', 'after the correction the class''s misconceptions were ' || coalesce(v_t, 'none')
        || ' (expected F13K-A:5:5: the six who chose B are right by the key in force, the five who chose A are not)');
    end if;
    v_cat := public.current_metric_catalogue();
    perform selftest.as_user_uid(v_guru);
    v_fig := public.metric_evaluate('class.misconceptions', v_kelas, v_inst, v_cat);
    perform selftest.as_owner();
    v_t := (select string_agg(x ->> 'code' || ':' || (x ->> 'occurrences'), ',' order by x ->> 'code') from jsonb_array_elements(v_fig -> 'value') x where x ->> 'code' like 'F13K-%');
    if v_t is distinct from 'F13K-A:5' then
      v_probs := selftest.f11_note(v_probs, 'F13-K01', 'after the correction the figure class.misconceptions listed ' || coalesce(v_t, 'nothing')
        || ' (expected F13K-A:5; the envelope said ' || coalesce(v_fig ->> 'status', '?') || ')');
    end if;

    -- ═══ F13-K02  the teacher's per-question evidence
    v_q := (select x from jsonb_array_elements(v_sesudah -> 'tqe' -> 'questions') x where (x ->> 'item_id')::uuid = v_x);
    v_t := concat_ws('|', v_q ->> 'right', v_q ->> 'presented', v_q ->> 'key_corrected',
             (select string_agg(o ->> 'label' || ':' || (o ->> 'is_key') || ':' || coalesce(o ->> 'was_key', '-'), ',' order by o ->> 'label') from jsonb_array_elements(v_q -> 'options') o));
    if v_t is distinct from '6|11|true|A:false:true,B:true:false' then
      v_probs := selftest.f11_note(v_probs, 'F13-K02', 'after the correction the teacher''s question X read ' || coalesce(v_t, 'nothing')
        || ' (expected 6|11|true|A:false:true,B:true:false: six right, B the key in force, A the original key)');
    end if;
    -- ═══ F13-K23  the marker (F1-R1b, Sharon §3a.1; Daisy §6a): before and after, every question says whether a wrong
    -- option, by the key the view shows, has no misconception code; X's two options are both coded, so X says no
    select count(*) into n from (select x from jsonb_array_elements(v_sebelum -> 'tqe' -> 'questions') x
                                 union all select x from jsonb_array_elements(v_sesudah -> 'tqe' -> 'questions') x) q(x)
     where (q.x ->> 'ada_tak_terkait')::boolean is distinct from exists (
             select 1 from jsonb_array_elements(q.x -> 'options') o
               join public.item_options io on io.item_id = (q.x ->> 'item_id')::uuid and io.label = o ->> 'label'
              where not (o ->> 'is_key')::boolean and io.misconception_code is null);
    if n > 0 or (v_q ->> 'ada_tak_terkait') is distinct from 'false'
       or not exists (select 1 from jsonb_array_elements(v_sesudah -> 'tqe' -> 'questions') x where (x ->> 'ada_tak_terkait')::boolean) then
      v_probs := selftest.f11_note(v_probs, 'F13-K23', n || ' question reading(s) whose marker is not what their wrong options'' codes say; X reads '
        || coalesce(v_q ->> 'ada_tak_terkait', 'nothing') || ' (expected false: both coded); and the package should hold at least one unlinked question');
    end if;
    select count(*) filter (where (a ->> 'right')::boolean and a ->> 'chosen' = 'B'), count(*) filter (where not (a ->> 'right')::boolean and a ->> 'chosen' = 'A')
      into n, m
      from jsonb_array_elements(v_sesudah -> 'tqe' -> 'learners') l, jsonb_array_elements(l -> 'answers') a where (a ->> 'item_id')::uuid = v_x;
    if n <> 6 or m <> 5 then
      v_probs := selftest.f11_note(v_probs, 'F13-K02', format('after the correction %s learner(s) who chose B were marked right (expected 6) and %s who chose A wrong (expected 5)', n, m));
    end if;

    -- ═══ F13-K03  the reading map's remediation
    v_rem_a := 'Ulangi bagian A.'; v_rem_b := 'Ulangi bagian B.';
    if position(v_rem_b in (v_sebelum -> 'rm_w')::text) = 0 then
      v_probs := selftest.f11_note(v_probs, 'F13-K03', 'before the correction a learner who chose B was not sent to B''s remediation (the fixture did not take)');
    end if;
    if position(v_rem_b in (v_sesudah -> 'rm_w')::text) > 0 then
      v_probs := selftest.f11_note(v_probs, 'F13-K03', 'after the correction a learner who chose B (right by the key in force) is still sent to B''s remediation');
    end if;
    if position(v_rem_a in (v_sesudah -> 'rm_r')::text) = 0 then
      v_probs := selftest.f11_note(v_probs, 'F13-K03', 'after the correction a learner who chose A (wrong by the key in force) is not sent to A''s remediation');
    end if;

    -- ═══ F13-K04  session_misconceptions
    v_t := concat_ws('|', (select string_agg(x ->> 'misconception_code', ',') from jsonb_array_elements(v_sebelum -> 'sm_w') x),
                          (select string_agg(x ->> 'misconception_code', ',') from jsonb_array_elements(v_sesudah -> 'sm_w') x),
                          (select string_agg(x ->> 'misconception_code', ',') from jsonb_array_elements(v_sesudah -> 'sm_r') x));
    if v_t is distinct from 'F13K-B|F13K-A' or jsonb_array_length(v_sesudah -> 'sm_w') <> 0 then
      v_probs := selftest.f11_note(v_probs, 'F13-K04', 'session_misconceptions read ' || coalesce(v_t, 'nothing')
        || ' (expected before F13K-B for a learner who chose B; after, nothing for that learner and F13K-A for one who chose A)');
    end if;

    -- ═══ F13-K05  the item statistics
    -- (item.correctness_rate is this view's correctness_rate, withheld below its minimum of 30; the view is read here)
    v_t := concat_ws('|', (v_sebelum -> 'sis_x' -> 0 ->> 'correct_count'), (v_sesudah -> 'sis_x' -> 0 ->> 'correct_count'), (v_sesudah -> 'sis_x' -> 0 ->> 'evidence_count'),
                          (v_sesudah -> 'sis_x' -> 0 ->> 'correctness_rate'));
    if v_t is distinct from '5|6|11|0.5455' then
      v_probs := selftest.f11_note(v_probs, 'F13-K05', 'X''s correct count before|after|evidence|item.correctness_rate read ' || coalesce(v_t, 'nothing')
        || ' (expected 5|6|11|0.5455: after the correction the six who chose B are counted right)');
    end if;

    -- ═══ F13-K06..K10  the uncorrected world, view by view
    for i, v_t in select * from (values (6, 'scm'), (7, 'tqe'), (8, 'rm'), (9, 'sm'), (10, 'sis')) z(a, b) loop
      if v_sebelum_segel ? 'gagal' or v_sesudah_segel ? 'gagal' then
        v_probs := selftest.f11_note(v_probs, 'F13-K' || lpad(i::text, 2, '0'), 'the sealed-key reading could not be formed: '
          || left(coalesce(v_sebelum_segel ->> 'gagal', v_sesudah_segel ->> 'gagal'), 160));
        continue;
      end if;
      -- before the correction: every key of this view identical
      if exists (select 1 from jsonb_each(v_sebelum) e where e.key like v_t || '%' and e.value is distinct from v_sebelum_segel -> e.key) then
        v_probs := selftest.f11_note(v_probs, 'F13-K' || lpad(i::text, 2, '0'), 'before any correction the view did not read as the sealed key does: '
          || (select string_agg(e.key, ',') from jsonb_each(v_sebelum) e where e.key like v_t || '%' and e.value is distinct from v_sebelum_segel -> e.key));
      end if;
    end loop;
    -- after the correction, what it did not reach: other classes and questions, and the other questions of X's own class
    if v_sesudah_segel ? 'gagal' then
      null;   -- said above, for each view
    else
    if (v_sesudah ->> 'scm_lain') is distinct from (v_sesudah_segel ->> 'scm_lain') or (v_sesudah ->> 'scm_lain') is distinct from (v_sebelum ->> 'scm_lain') then
      v_probs := selftest.f11_note(v_probs, 'F13-K06', 'after the correction another class''s misconceptions moved');
    end if;
    if exists (select 1 from jsonb_array_elements(v_sesudah -> 'tqe' -> 'questions') x where (x ->> 'item_id')::uuid <> v_x
                 and x is distinct from (select y from jsonb_array_elements(v_sesudah_segel -> 'tqe' -> 'questions') y where y ->> 'item_id' = x ->> 'item_id'))
       or exists (select 1 from jsonb_array_elements(v_sesudah -> 'tqe' -> 'questions') x where (x ->> 'item_id')::uuid <> v_x and (x ? 'key_corrected'
                    or exists (select 1 from jsonb_array_elements(x -> 'options') o where o ? 'was_key'))) then
      v_probs := selftest.f11_note(v_probs, 'F13-K07', 'after the correction a question it did not reach reads differently from the sealed key, or says it was corrected');
    end if;
    if (v_sesudah ->> 'sis_lain') is distinct from (v_sesudah_segel ->> 'sis_lain') or (v_sesudah ->> 'sis_lain') is distinct from (v_sebelum ->> 'sis_lain') then
      v_probs := selftest.f11_note(v_probs, 'F13-K10', 'after the correction another question''s statistics moved');
    end if;
    end if;

    -- ═══ F13-K11  history
    if selftest.f13_kunci_sidik(v_course, v_semua) is distinct from v_sidik then
      v_probs := selftest.f11_note(v_probs, 'F13-K11', 'the sealed question, its options and release, an original result or a response changed');
    end if;
    perform selftest.as_user_uid(v_guru);
    v := public.riwayat_hasil_sesi((v_sesi ->> 's1')::uuid);
    perform selftest.as_owner();
    v_t := (select string_agg((e ->> 'jenis') || ':' || (e ->> 'penguasaan') || ':' || (e ->> 'kini'), ',' order by (e ->> 'urutan')::int) from jsonb_array_elements(v -> 'rantai') e);
    if v_t is distinct from 'SEALED:0.6667:false,KEY_CORRECTED:1.0000:true' then
      v_probs := selftest.f11_note(v_probs, 'F13-K11', 'the teacher''s chain of a corrected sitting read ' || coalesce(v_t, 'nothing') || ' (expected the sealed 0.6667, then the correction 1.0000, current)');
    end if;
    if (select count(*) from public.assessment_result_bases b where b.session_id = any (v_semua)) <> 11 then
      v_probs := selftest.f11_note(v_probs, 'F13-K11', 'the sittings do not carry exactly one basis each');
    end if;

    -- ═══ F13-K12  the catalogue (pinned at 2ea60c85, before this correction)
    v_t := concat_ws('|', v_cat,
      (select md5(string_agg(to_jsonb(d)::text, '|' order by d.catalogue_version)) from public.metric_definitions d where d.metric_id = 'class.misconceptions'),
      (select count(*)::text from public.metric_catalogue),
      (select md5(string_agg(m.source_relation, ',' order by m.source_relation)) from public.metric_sources m where m.catalogue_version = v_cat),
      (select md5(pg_get_functiondef(p.oid)) from pg_proc p where p.oid = 'public.calc_class_misconceptions(uuid,uuid,text)'::regprocedure),
      (select s.governing_scope from public.metric_calculator_scope s where s.calculation_key = 'class_misconceptions'));
    if v_t is distinct from 'MC-10|49285ccb34bdf1a65dd9059947050e5a|10|eed6175b42734f186a794517dd5d14c9|b3eb73c41195fa0c685f878cc5ee504f|NODE' then
      v_probs := selftest.f11_note(v_probs, 'F13-K12', 'class.misconceptions'' catalogue rows, version, sources or calculator moved: ' || v_t);
    end if;

    raise exception 'F13K_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F13K_UNDO' then v_fatal := sqlerrm; end if;
  end;

  for id, detail in select * from (values
    ('F13-K01', 'row 1 (C1w F-1): service_cohort_misconceptions, the source of class.misconceptions, reads the key in force: before the correction B''s misconception (six learners), after it A''s (five) and not B''s; the figure itself lists A''s'),
    ('F13-K02', 'row 2 (C1w F-1): teacher_question_evidence marks by the key in force: X right for the six who chose B, B shown as the key, A as the original key (was_key), the question key_corrected'),
    ('F13-K03', 'row 3 (C1w F-1): reading_map no longer sends a learner who chose B to B''s remediation once B is the key, and sends one who chose A to A''s'),
    ('F13-K04', 'row 4 (C1w F-1): session_misconceptions reads the key in force: nothing for a learner who chose B, A''s for one who chose A'),
    ('F13-K05', 'row 5 (C1w F-1): service_item_statistics, the source of item.correctness_rate, counts X right by the key in force (6 of 11, 0.5455)'),
    ('F13-K06', 'requirement 3: service_cohort_misconceptions over an uncorrected world reads byte for byte as the sealed key does; after the correction another class is unchanged'),
    ('F13-K23', 'F1-R1b (Sharon §3a.1; Daisy §6a): the teacher''s per-question marker says, for every question before and after the correction, whether a wrong option by the key the view shows has no misconception code'),
    ('F13-K07', 'requirement 3: teacher_question_evidence over an uncorrected world reads byte for byte as before; after the correction the questions it did not reach are unchanged and say nothing of a correction'),
    ('F13-K08', 'requirement 3: reading_map over an uncorrected world reads byte for byte as the sealed key does'),
    ('F13-K09', 'requirement 3: session_misconceptions over an uncorrected world reads byte for byte as the sealed key does'),
    ('F13-K10', 'requirement 3: service_item_statistics over an uncorrected world reads byte for byte as the sealed key does; after the correction every other question is unchanged'),
    ('F13-K11', 'requirement 2: the sealed question, options and release, every original result and response byte-identical after the correction and every read; the original marking read through riwayat_hasil_sesi (SEALED 0.6667, then KEY_CORRECTED 1.0000, current); one basis per sitting'),
    ('F13-K12', 'requirement 4: class.misconceptions'' definition rows in every catalogue version, the live version, its sources, its calculator and governing scope are as pinned before the correction')
  ) z loop
    if v_fatal <> '' then
      ok := false; detail := 'the F13-K world could not run: ' || left(v_fatal, 220);
    elsif v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id), (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> id) x));
    else
      ok := true;
    end if;
    return next;
  end loop;
end $$;
revoke all on function selftest.f13_kunci() from public;

-- ═══════════════════════════════════════ F13-K13..K15 · the learner's own review of a corrected answer (F-1, Sharon §0)
-- C1W-F1-CORRECTION.md §0 item 2: in session_review, where the chosen answer's mark by the key in force differs from its
-- sealed mark, no rationale is returned (null). A pre-test has no review, so this world corrects a POST-TEST question:
-- the class sits its pre-test and its post-test; on the post-test's first question Y the first learner chooses B, the
-- second A; Y's key is then corrected from A to B by the school's own two people. Everything is undone.
--
--   F13-K13  the now-right answer: the learner who chose B reads Y marked right (benar true) and no rationale (before the
--            correction: wrong, with B's sealed «Ini belum tepat.»)
--   F13-K14  the now-wrong answer: the learner who chose A reads Y marked wrong and no rationale (before: right, with A's
--            sealed «Ini tepat.»), never the sealed rationale calling it right
--   F13-K15  what the correction did not reach: before it, every row of both reviews carries the chosen option's sealed
--            mark and rationale; after it, every row but Y's is byte-identical to before

-- One learner's review of one sitting, as that learner reads it.
create or replace function selftest.f13_ulasan_baca(p_sesi uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v jsonb;
begin
  perform selftest.as_user_uid((select a.auth_user_id from public.accounts a join public.assessment_sessions s on s.person_id = a.person_id
                                 where s.id = p_sesi));
  v := (select coalesce(jsonb_agg(to_jsonb(x) order by x.posisi), '[]'::jsonb) from public.session_review(p_sesi) x);
  perform selftest.as_owner();
  return v;
end $$;
revoke all on function selftest.f13_ulasan_baca(uuid) from public;

create or replace function selftest.f13_ulasan()
returns table (id text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v jsonb; v_sesi jsonb; v_post uuid; v_y uuid; v_y_stem text; v_k uuid; i int; v_u uuid;
  v_w uuid; v_r uuid; v_sebelum_w jsonb; v_sebelum_r jsonb; v_sesudah_w jsonb; v_sesudah_r jsonb;
  v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_t text; x jsonb;
begin
  perform selftest.as_owner();
  begin
    v := selftest.f13_kunci_dunia(2, 1);
    v_sesi := v -> 'sesi'; v_post := (v ->> 'post')::uuid;
    select i2.id, i2.stem into v_y, v_y_stem from public.items i2 join public.lessons l on l.id = i2.lesson_id join public.modules m2 on m2.id = l.module_id
     where m2.course_id = (v ->> 'course')::uuid and i2.stem like 'Pertanyaan akhir nomor 1%';
    if (select string_agg(o.label || ':' || o.is_correct || ':' || coalesce(o.rationale, '-'), ',' order by o.label) from public.item_options o where o.item_id = v_y)
       is distinct from 'A:true:Ini tepat.,B:false:Ini belum tepat.' then
      raise exception 'Y is not the question this test needs';
    end if;
    -- the post-test: the first learner chooses B on Y, the second A; every other answer right
    v_w := selftest.f13_kunci_duduk((v_sesi ->> 'u1')::uuid, v_post, v_y, 'B');
    v_r := selftest.f13_kunci_duduk((v_sesi ->> 'u2')::uuid, v_post, v_y, 'A');
    v_sebelum_w := selftest.f13_ulasan_baca(v_w);
    v_sebelum_r := selftest.f13_ulasan_baca(v_r);

    -- the correction: the school's administrator proposes B, its head of department confirms
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    v_k := (public.ajukan_koreksi_kunci(v_y, array['B'], 'uji F13K: kunci soal akhir ini keliru') ->> 'koreksi')::uuid;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    v := public.tegaskan_koreksi_kunci(v_k);
    perform selftest.as_owner();
    if (v ->> 'ok')::boolean is not true or (v ->> 'dihitung_ulang')::int <> 2 then
      raise exception 'the correction did not recalculate the two post-test sittings: %', left(v::text, 200);
    end if;
    v_sesudah_w := selftest.f13_ulasan_baca(v_w);
    v_sesudah_r := selftest.f13_ulasan_baca(v_r);

    -- ═══ F13-K13  the now-right answer
    v_t := concat_ws('|',
      (select (e ->> 'benar') || ':' || coalesce(e ->> 'alasan', '-') from jsonb_array_elements(v_sebelum_w) e where e ->> 'stem' = v_y_stem),
      (select (e ->> 'benar') || ':' || coalesce(e ->> 'alasan', '-') from jsonb_array_elements(v_sesudah_w) e where e ->> 'stem' = v_y_stem));
    if v_t is distinct from 'false:Ini belum tepat.|true:-' then
      v_probs := selftest.f11_note(v_probs, 'F13-K13', 'the learner who chose B read Y (before|after) ' || coalesce(v_t, 'nothing')
        || ' (expected false:Ini belum tepat.|true:-: right by the key in force, and no sealed rationale calling it wrong)');
    end if;

    -- ═══ F13-K14  the now-wrong answer
    v_t := concat_ws('|',
      (select (e ->> 'benar') || ':' || coalesce(e ->> 'alasan', '-') from jsonb_array_elements(v_sebelum_r) e where e ->> 'stem' = v_y_stem),
      (select (e ->> 'benar') || ':' || coalesce(e ->> 'alasan', '-') from jsonb_array_elements(v_sesudah_r) e where e ->> 'stem' = v_y_stem));
    if v_t is distinct from 'true:Ini tepat.|false:-' then
      v_probs := selftest.f11_note(v_probs, 'F13-K14', 'the learner who chose A read Y (before|after) ' || coalesce(v_t, 'nothing')
        || ' (expected true:Ini tepat.|false:-: wrong by the key in force, and no sealed rationale calling it right)');
    end if;

    -- ═══ F13-K15  what the correction did not reach
    if jsonb_array_length(v_sebelum_w) < 2 or jsonb_array_length(v_sebelum_r) < 2 then
      v_probs := selftest.f11_note(v_probs, 'F13-K15', 'a review has fewer than two rows: nothing to compare');
    end if;
    for x in select e from jsonb_array_elements(v_sebelum_w || v_sebelum_r) e loop
      if (x ->> 'benar') is distinct from (case when x ->> 'alasan' = 'Ini tepat.' then 'true' when x ->> 'alasan' = 'Ini belum tepat.' then 'false' end) then
        v_probs := selftest.f11_note(v_probs, 'F13-K15', 'before any correction the row «' || left(x ->> 'stem', 40) || '» read '
          || coalesce(x ->> 'benar', '-') || ':' || coalesce(x ->> 'alasan', '-') || ', not its option''s sealed mark and rationale');
      end if;
    end loop;
    if (select jsonb_agg(e order by e ->> 'posisi') from jsonb_array_elements(v_sesudah_w || v_sesudah_r) e where e ->> 'stem' <> v_y_stem)
       is distinct from (select jsonb_agg(e order by e ->> 'posisi') from jsonb_array_elements(v_sebelum_w || v_sebelum_r) e where e ->> 'stem' <> v_y_stem) then
      v_probs := selftest.f11_note(v_probs, 'F13-K15', 'after the correction a row it did not reach (not Y) reads differently from before');
    end if;
    if jsonb_array_length(v_sesudah_w) <> jsonb_array_length(v_sebelum_w) or jsonb_array_length(v_sesudah_r) <> jsonb_array_length(v_sebelum_r) then
      v_probs := selftest.f11_note(v_probs, 'F13-K15', 'after the correction a review has a different number of rows');
    end if;

    raise exception 'F13U_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F13U_UNDO' then v_fatal := sqlerrm; end if;
  end;

  for id, detail in select * from (values
    ('F13-K13', 'F-1 (Sharon §0): the learner''s own review of a post-test question whose key was corrected to their answer: marked right by the key in force, with no rationale (the sealed «Ini belum tepat.» before the correction)'),
    ('F13-K14', 'F-1 (Sharon §0): the learner''s own review of a post-test question whose corrected key is no longer their answer: marked wrong, with no rationale, never the sealed «Ini tepat.» calling it right'),
    ('F13-K15', 'F-1 (Sharon §0): before the correction every row of both reviews carries its chosen option''s sealed mark and rationale; after it every row but the corrected question''s is byte-identical')
  ) z loop
    if v_fatal <> '' then
      ok := false; detail := 'the F13-K13 world could not run: ' || left(v_fatal, 220);
    elsif v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id), (select string_agg(y, '; ') from jsonb_array_elements_text(v_probs -> id) y));
    else
      ok := true;
    end if;
    return next;
  end loop;
end $$;
revoke all on function selftest.f13_ulasan() from public;


-- ═══════════════════════════════════════ F13-K16..K21 · a key correction withdraws the explanations it makes stale (F1-R1b)
-- C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md §0, §3d; INV-03 as amended (ADR-0025). F-1's world: X's key corrected
-- from A to B, both options flip. Everything is undone.
--
--   F13-K16  the corrected copy: A's and B's rationale and misconception code withdrawn, each naming the correction; the
--            correction's record holds what they said, written once; the revision that was sat keeps its options
--   F13-K17  the constraint: an option inserted with no rationale and no reference, with an empty rationale, or with both
--            a rationale and a reference: each refused
--   F13-K18  the reference from any other path: a direct update setting it, and an insert carrying it with no source
--            option holding it: each refused
--   F13-K19  a copy of the corrected revision (create_course_revision) carries the withdrawn state; writing a rationale
--            on the copy clears the reference
--   F13-K20  the release digest: every release's stored digest is what course_content_sha256 recomputes, the corrected
--            revision's included (a null rationale hashes as '~')
--   F13-K22  explanations owed: a copy of the corrected revision is refused the step to VALIDATED while an option is
--            still withdrawn, and goes through once its rationale is written (the confirming act is exempt: F13-K16)
--   F13-K21  a second correction flipping the key back: the options stay withdrawn under the first correction, nothing is
--            restored, and the second correction's record holds nothing for them

create or replace function selftest.f13_penjelasan()
returns table (id text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v jsonb; v_x uuid; v_x2 uuid; v_x3 uuid; v_k uuid; v_k2 uuid; v_c2 uuid; v_draf uuid; v_xd uuid; v_lain uuid;
  v_sidik text; v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_t text; n int;
begin
  perform selftest.as_owner();
  begin
    v := selftest.f13_kunci_dunia(2, 1);
    v_x := (v ->> 'x')::uuid;
    v_sidik := (select string_agg(to_jsonb(o)::text, '|' order by o.label) from public.item_options o where o.item_id = v_x);
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    v_k := (public.ajukan_koreksi_kunci(v_x, array['B'], 'uji F13K: kunci jawaban soal ini keliru') ->> 'koreksi')::uuid;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    v := public.tegaskan_koreksi_kunci(v_k);
    perform selftest.as_owner();
    if (v ->> 'ok')::boolean is not true then raise exception 'the correction did not confirm: %', left(v::text, 200); end if;
    select k.corrected_item_id, k.corrected_course_id into v_x2, v_c2 from public.key_corrections k where k.id = v_k;

    -- ═══ F13-K16  the corrected copy, and the record
    v_t := (select string_agg(o.label || ':' || o.is_correct || ':' || coalesce(o.rationale, '-') || ':' || coalesce(o.misconception_code, '-')
                              || ':' || case when o.rationale_withdrawn_by = v_k then 'k' else '-' end, ',' order by o.label)
              from public.item_options o where o.item_id = v_x2);
    if v_t is distinct from 'A:false:-:-:k,B:true:-:-:k' then
      v_probs := selftest.f11_note(v_probs, 'F13-K16', 'the corrected copy''s options read ' || coalesce(v_t, 'nothing')
        || ' (expected A:false:-:-:k,B:true:-:-:k: both flipped, both withdrawn under this correction)');
    end if;
    v_t := (select string_agg((x ->> 'label') || ':' || (x ->> 'rationale') || ':' || coalesce(x ->> 'misconception_code', '-'), ',' order by x ->> 'label')
              from public.key_corrections k, jsonb_array_elements(k.penjelasan_dihapus) x where k.id = v_k);
    if v_t is distinct from 'A:Ini tepat.:F13K-A,B:Ini belum tepat.:F13K-B' then
      v_probs := selftest.f11_note(v_probs, 'F13-K16', 'the correction''s record of what it withdrew reads ' || coalesce(v_t, 'nothing'));
    end if;
    if (select string_agg(to_jsonb(o)::text, '|' order by o.label) from public.item_options o where o.item_id = v_x) is distinct from v_sidik then
      v_probs := selftest.f11_note(v_probs, 'F13-K16', 'the revision that was sat had its options changed');
    end if;
    v_t := selftest.f13_code(format('update public.key_corrections set penjelasan_dihapus = %L where id = %L', '[]', v_k));
    if v_t is null then v_probs := selftest.f11_note(v_probs, 'F13-K16', 'the record of what was withdrawn was rewritten after the decision'); end if;

    -- ═══ F13-K19  a copy carries the state; writing a rationale clears it
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    v_draf := public.create_course_revision(v_c2);
    perform selftest.as_owner();
    select i.id into v_xd from public.items i where i.supersedes_item_id = v_x2 and public.soal_kursus(i.id) = v_draf;
    v_t := (select string_agg(o.label || ':' || coalesce(o.rationale, '-') || ':' || case when o.rationale_withdrawn_by = v_k then 'k' else '-' end, ',' order by o.label)
              from public.item_options o where o.item_id = v_xd);
    if v_t is distinct from 'A:-:k,B:-:k' then
      v_probs := selftest.f11_note(v_probs, 'F13-K19', 'the copy''s options read ' || coalesce(v_t, 'nothing') || ' (expected A:-:k,B:-:k: carried)');
    end if;
    update public.item_options set rationale = 'Penjelasan baru untuk kunci yang benar.' where item_id = v_xd and label = 'B';
    v_t := (select coalesce(o.rationale_withdrawn_by::text, '-') from public.item_options o where o.item_id = v_xd and o.label = 'B');
    if v_t is distinct from '-' then v_probs := selftest.f11_note(v_probs, 'F13-K19', 'writing a rationale did not clear the reference'); end if;

    -- ═══ F13-K17  the constraint, on the draft copy's question
    v_t := concat_ws('|',
      coalesce(selftest.f13_code(format($q$insert into public.item_options (item_id, institution_id, label, body, is_correct) select %L, i.institution_id, 'E', 'Pilihan E', false from public.items i where i.id = %L$q$, v_xd, v_xd)), 'went through'),
      coalesce(selftest.f13_code(format($q$insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale) select %L, i.institution_id, 'E', 'Pilihan E', false, '  ' from public.items i where i.id = %L$q$, v_xd, v_xd)), 'went through'),
      coalesce(selftest.f13_code(format($q$insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, rationale_withdrawn_by) select %L, i.institution_id, 'E', 'Pilihan E', false, 'Ada.', %L from public.items i where i.id = %L$q$, v_xd, v_k, v_xd)), 'went through'));
    if v_t !~ '^23514 [^|]*\|23514 [^|]*\|23514 ' then
      v_probs := selftest.f11_note(v_probs, 'F13-K17', 'no rationale | an empty one | both a rationale and a reference answered ' || v_t
        || ' (expected each refused by the check)');
    end if;

    -- ═══ F13-K18  the reference from any other path
    select i.id into v_lain from public.items i where public.soal_kursus(i.id) = v_draf and i.id <> v_xd limit 1;
    v_t := concat_ws('|',
      coalesce(selftest.f13_code(format($q$update public.item_options set rationale = null, rationale_withdrawn_by = %L where item_id = %L and label = 'A'$q$, v_k, v_lain)), 'went through'),
      coalesce(selftest.f13_code(format($q$insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale_withdrawn_by) select %L, i.institution_id, 'E', 'Pilihan E', false, %L from public.items i where i.id = %L$q$, v_xd, v_k, v_xd)), 'went through'));
    if v_t !~ '^42501 [^|]*\|42501 ' then
      v_probs := selftest.f11_note(v_probs, 'F13-K18', 'a direct update setting the reference | an insert carrying it with no source answered ' || v_t || ' (expected each refused)');
    end if;

    -- ═══ F13-K22  explanations owed: the copy steps past STRUCTURED only once every option has its rationale again
    -- (A is still withdrawn here; B was written under F13-K19). Undone, so the draft stays as the tests below expect.
    begin
      perform selftest.as_user('boot-guru@bootstrap.pintar.test');
      perform public.langkah_konten(v_draf, 'STRUCTURED');
      v_t := coalesce(selftest.f13_code(format('select public.langkah_konten(%L, %L)', v_draf, 'VALIDATED')), 'went through');
      if v_t !~ '^PR040 a question whose key was corrected' then
        v_probs := selftest.f11_note(v_probs, 'F13-K22', 'stepping the copy on with A''s rationale still withdrawn answered ' || v_t
          || ' (expected refused: the explanation is owed)');
      end if;
      update public.item_options set rationale = 'Penjelasan baru untuk pilihan A.' where item_id = v_xd and label = 'A';
      v_t := coalesce(selftest.f13_code(format('select public.langkah_konten(%L, %L)', v_draf, 'VALIDATED')), 'went through');
      if v_t <> 'went through' then
        v_probs := selftest.f11_note(v_probs, 'F13-K22', 'with every rationale written again the step answered ' || v_t || ' (expected it to go through)');
      end if;
      if exists (select 1 from public.item_options o where o.item_id = v_xd and (o.rationale is null or o.rationale_withdrawn_by is not null)) then
        v_probs := selftest.f11_note(v_probs, 'F13-K22', 'an option still reads as withdrawn after its rationale was written');
      end if;
      raise exception 'F13P_K22_UNDO';
    exception when others then
      if sqlerrm <> 'F13P_K22_UNDO' then v_probs := selftest.f11_note(v_probs, 'F13-K22', 'the step world failed: ' || left(sqlerrm, 200)); end if;
    end;
    perform selftest.as_owner();

    -- ═══ F13-K20  every release's digest recomputes to its stored value
    select count(*) into n from public.plp_releases r
     where r.content_sha256 is not null and r.content_sha256 is distinct from public.course_content_sha256(r.course_id);
    if n > 0 then v_probs := selftest.f11_note(v_probs, 'F13-K20', n || ' release(s) whose stored digest is not what their content recomputes to'); end if;
    if not exists (select 1 from public.plp_releases r where r.course_id = v_c2 and r.content_sha256 = public.course_content_sha256(v_c2)) then
      v_probs := selftest.f11_note(v_probs, 'F13-K20', 'the corrected revision''s release digest is not reproducible');
    end if;

    -- ═══ F13-K21  a second correction flips the key back: nothing is restored
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    perform public.buang_draf(v_draf, 'uji F13K: draf tidak dipakai');
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    v_k2 := (public.ajukan_koreksi_kunci(v_x2, array['A'], 'uji F13K: kunci dikembalikan seperti semula') ->> 'koreksi')::uuid;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    v := public.tegaskan_koreksi_kunci(v_k2);
    perform selftest.as_owner();
    select k.corrected_item_id into v_x3 from public.key_corrections k where k.id = v_k2;
    v_t := (select string_agg(o.label || ':' || o.is_correct || ':' || coalesce(o.rationale, '-') || ':' || case when o.rationale_withdrawn_by = v_k then 'k1' else '-' end, ',' order by o.label)
              from public.item_options o where o.item_id = v_x3)
          || '|' || coalesce((select jsonb_array_length(k.penjelasan_dihapus)::text from public.key_corrections k where k.id = v_k2), '-');
    if v_t is distinct from 'A:true:-:k1,B:false:-:k1|0' then
      v_probs := selftest.f11_note(v_probs, 'F13-K21', 'after the key was corrected back the options read ' || coalesce(v_t, 'nothing')
        || ' (expected A:true:-:k1,B:false:-:k1|0: still withdrawn under the first correction, nothing restored, nothing recorded twice)');
    end if;

    raise exception 'F13P_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F13P_UNDO' then v_fatal := sqlerrm; end if;
  end;

  for id, detail in select * from (values
    ('F13-K16', 'F1-R1b: the corrected copy''s flipped options lose their rationale and misconception code, each naming the correction; the correction''s record holds what they said, written once; the revision that was sat keeps its options'),
    ('F13-K17', 'F1-R1b (INV-03 as amended): an option with no rationale and no reference, an empty rationale, or both: each refused by the check'),
    ('F13-K18', 'F1-R1b: the reference set by a direct update, or carried by an insert with no source option holding it: each refused by the trigger'),
    ('F13-K19', 'F1-R1b: a copy of the corrected revision carries the withdrawn state, and writing a rationale on it clears the reference'),
    ('F13-K20', 'F1-R1b: every release''s stored digest is what its content recomputes to, the corrected revision''s included'),
    ('F13-K21', 'F1-R1b: a second correction flipping the key back restores nothing; the options stay withdrawn under the first, and the second records nothing for them'),
    ('F13-K22', 'F1-R1b (§3 point 5): a copy of the corrected revision steps past STRUCTURED only once every withdrawn option has its rationale again; the confirming act alone is exempt')
  ) z loop
    if v_fatal <> '' then
      ok := false; detail := 'the F13-K16 world could not run: ' || left(v_fatal, 220);
    elsif v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id), (select string_agg(y, '; ') from jsonb_array_elements_text(v_probs -> id) y));
    else
      ok := true;
    end if;
    return next;
  end loop;
end $$;
revoke all on function selftest.f13_penjelasan() from public;

-- ═══════════════════════════════════════ F13-K24 · the marker is "any", not "all" (F1-R1b; Daisy §6a)
-- World 1: X with three options, A (the sealed key, linked), B (wrong, linked), C (wrong, not linked). The teacher's
-- per-question view marks X before the correction and after it (A to B: A and C are then wrong, C still not linked).
-- Under "all wrong options unlinked" X would not be marked: plant bob04-20. World 2: the same with C linked: X is not
-- marked, before or after. Everything is undone.
create or replace function selftest.f13_tanda()
returns table (id text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
#variable_conflict use_column
declare v jsonb; v_x uuid; v_k uuid; v_t text := ''; v_fatal text := ''; v_c text;
begin
  perform selftest.as_owner();
  foreach v_c in array array['-', 'F13K-A'] loop
  begin
    v := selftest.f13_kunci_dunia(2, 1, v_c);
    v_x := (v ->> 'x')::uuid;
    perform selftest.as_user_uid((v ->> 'guru')::uuid);
    v_t := v_t || case when v_t = '' then '' else ';' end || coalesce((select x ->> 'ada_tak_terkait' from jsonb_array_elements(public.teacher_question_evidence((v ->> 'pre')::uuid, (v ->> 'kelas')::uuid) -> 'questions') x
                      where (x ->> 'item_id')::uuid = v_x), 'nothing');
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');
    v_k := (public.ajukan_koreksi_kunci(v_x, array['B'], 'uji F13K: kunci jawaban soal ini keliru') ->> 'koreksi')::uuid;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    perform public.tegaskan_koreksi_kunci(v_k);
    perform selftest.as_user_uid((v ->> 'guru')::uuid);
    v_t := v_t || '|' || coalesce((select x ->> 'ada_tak_terkait' from jsonb_array_elements(public.teacher_question_evidence((v ->> 'pre')::uuid, (v ->> 'kelas')::uuid) -> 'questions') x
                      where (x ->> 'item_id')::uuid = v_x), 'nothing');
    raise exception 'F13T_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F13T_UNDO' then v_fatal := sqlerrm; end if;
  end;
  end loop;
  id := 'F13-K24';
  if v_fatal <> '' then
    ok := false; detail := 'the F13-K24 world could not run: ' || left(v_fatal, 220);
  elsif v_t is distinct from 'true|true;false|false' then
    ok := false; detail := 'X was marked ' || v_t || ' (C not linked: before|after; C linked: before|after) (expected true|true;false|false: one wrong option not linked is enough, and all linked clears it)';
  else
    ok := true; detail := 'F1-R1b (Daisy §6a): a question with one wrong option linked and one not is marked, before and after a key correction, and with all its wrong options linked is not; the marker is "any", not "all"';
  end if;
  return next;
end $$;
revoke all on function selftest.f13_tanda() from public;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable13()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; n int; m int; v jsonb; v_code text; v_state text; v_tag text;
  v_inst uuid; v_cls uuid; v_root uuid; v_other_cls uuid; v_dean uuid;
  v_course uuid; v_rel uuid; v_la uuid; v_aa_pre uuid; v_aa_post uuid; v_def_pre uuid; v_def_post uuid;
  v_s_pre uuid; v_s_post uuid; v_lesson uuid;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  m_steps int := 0; m_refused int := 0;
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);
    select i.id into v_inst from public.institutions i where i.slug like 'synth-siklus-%' order by i.created_at desc limit 1;
    if v_inst is null then raise exception 'the seeded learning-cycle school is not there'; end if;
    select n.id into v_cls from public.org_nodes n where n.institution_id = v_inst and n.kind = 'CLASS' order by n.created_at limit 1;
    select n.id into v_root from public.org_nodes n where n.institution_id = v_inst and n.kind = 'INSTITUTION' limit 1;
    select n.id into v_other_cls from public.org_nodes n
     where n.kind = 'CLASS' and n.institution_id <> v_inst and n.is_active and n.academic_period_id is not null limit 1;
    v_dean := selftest.f11_user('f13-dekan-' || v_tag || '@local.invalid', 'DEAN', v_inst);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-P01  THE COURSE CARRIES ITS TESTS; ASSIGNING MAKES THE WHOLE CYCLE.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select * into r from selftest.f13_release(v_inst, selftest.f13_paket('Pecahan F13 ' || v_tag, 3, 2, false), false);
      v_course := r.course; v_rel := r.release;
      select d.id into v_def_pre from public.assessment_definitions d
       where d.course_id = v_course and d.mode = 'PRE_TEST' and d.item_count = 3 and d.status = 'APPROVED' and not d.is_ad_hoc;
      select d.id into v_def_post from public.assessment_definitions d
       where d.course_id = v_course and d.mode = 'POST_TEST' and d.item_count = 2 and d.status = 'APPROVED' and not d.is_ad_hoc;
      if v_def_pre is null or v_def_post is null then
        v_probs := selftest.f11_note(v_probs, 'F13-P01', 'the course does not carry an approved pre-test of 3 and post-test of 2 questions');
      else m_steps := m_steps + 1; end if;

      -- frozen but not published: not yet assignable
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', v_rel, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_RELEASE_NOT_PUBLISHED' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'an unpublished release answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;

      perform selftest.as_user('siklus-admin@synthetic.pintar.test');
      perform public.publish_release(v_rel);
      -- D-088(b), BOB-49: published, but the school has not set this lesson's pass mark: not yet assignable either
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', v_rel, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_PASS_MARK_MISSING' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a lesson with no school pass mark answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;
      -- the school's admin sets it, as on Konfigurasi
      perform selftest.as_user('siklus-admin@synthetic.pintar.test');
      perform public.set_school_pass_mark(v_inst, v_course, 70, 'F13: ketetapan sekolah');
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v := public.assign_release(v_rel, v_cls, null, now() + interval '30 days');
      perform selftest.as_owner();
      v_la := (v ->> 'learning_assignment')::uuid;
      v_aa_pre := (v ->> 'pre_assignment')::uuid;
      v_aa_post := (v ->> 'post_assignment')::uuid;
      select count(*) into n from public.learning_assignments la
       where la.id = v_la and la.status = 'ACTIVE' and la.plp_release_id = v_rel and la.node_id = v_cls
         and la.learning_cycle = jsonb_build_object('pre_test', v_def_pre, 'post_test', v_def_post);
      select count(*) into m from public.assessment_assignments a
       where a.learning_assignment_id = v_la and a.status = 'OPEN' and a.node_id = v_cls
         and ((a.id = v_aa_pre and a.assessment_definition_id = v_def_pre)
           or (a.id = v_aa_post and a.assessment_definition_id = v_def_post));
      if (v ->> 'ok')::boolean is not true or n <> 1 or m <> 2 then
        v_probs := selftest.f11_note(v_probs, 'F13-P01', format('assigning answered %s; %s active learning assignment(s), %s open test(s) of 2',
          left(v::text, 120), n, m));
      else m_steps := m_steps + 1; end if;
      select count(*) into n from public.audit_log al where al.target_id = v_la::text and al.action = 'LEARNING_ASSIGNED';
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F13-P01', format('%s LEARNING_ASSIGNED audit row(s), expected 1', n));
      else m_steps := m_steps + 1; end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-P01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-P02  THE LEARNER COMPLETES PRE -> LESSON -> POST -> RESULT, AND EACH
    --          TEST DRAWS ONLY ITS OWN QUESTIONS.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_def_pre is null or v_def_post is null then raise exception 'F13-P01 made no tests to draw from'; end if;
      -- the draw follows the marks, exactly (read from the definitions, so it
      -- speaks even when the assignment below could not be made)
      select count(*) into n from public.eligible_items_for_definition(v_def_pre) e
        join public.items i on i.id = e.item_id where i.cycle_role = 'PRE_TEST';
      select count(*) into m from public.eligible_items_for_definition(v_def_pre);
      if n <> 3 or m <> 3 then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the pre-test may draw %s question(s), %s of them marked for it; expected 3 and 3', m, n));
      end if;
      select count(*) into n from public.eligible_items_for_definition(v_def_post) e
        join public.items i on i.id = e.item_id where i.cycle_role = 'POST_TEST';
      select count(*) into m from public.eligible_items_for_definition(v_def_post);
      if n <> 2 or m <> 2 then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the post-test may draw %s question(s), %s of them marked for it; expected 2 and 2', m, n));
      end if;

      if v_la is null then raise exception 'F13-P01 made no assignment to take'; end if;
      perform selftest.as_user('siklus-email@synthetic.pintar.test');
      select * into r from public.my_cycle_state(v_la);
      if r.pre_assignment is distinct from v_aa_pre or r.post_assignment is distinct from v_aa_post then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', 'the learner''s cycle does not show both tests');
      end if;
      v_s_pre := public.start_learning_session(v_aa_pre);
      perform selftest.answer_paper(v_s_pre, true);
      perform public.finish_my_session(v_s_pre);
      select lesson_id into v_lesson from public.learner_lessons(v_la) limit 1;
      perform public.record_lesson_progress(v_la, v_lesson, 1, 1);
      v_s_post := public.start_learning_session(v_aa_post);
      perform selftest.answer_paper(v_s_post, true);
      perform public.finish_my_session(v_s_post);
      v := public.session_outcome(v_s_post);
      select * into r from public.my_cycle_state(v_la);
      perform selftest.as_owner();
      if v is null or r.pre_status is distinct from 'FINALIZED' or r.post_status is distinct from 'FINALIZED' then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the cycle ended at pre %s, post %s, outcome %s',
          r.pre_status, r.post_status, coalesce(left(v::text, 80), 'none')));
      end if;
      select count(*) filter (where i.cycle_role = 'PRE_TEST'), count(*) into n, m
        from public.presented_items p join public.items i on i.id = p.item_id where p.session_id = v_s_pre;
      if n <> 3 or m <> 3 then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the pre-test presented %s question(s), %s marked for it', m, n));
      end if;
      select count(*) filter (where i.cycle_role = 'POST_TEST'), count(*) into n, m
        from public.presented_items p join public.items i on i.id = p.item_id where p.session_id = v_s_post;
      if n <> 2 or m <> 2 then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the post-test presented %s question(s), %s marked for it', m, n));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-P02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-N01  A LESSON THAT CANNOT MAKE A WHOLE CYCLE IS REFUSED, WITH ITS
    --          CODE, AND MAKES NOTHING.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_rel is null then raise exception 'F13-P01 made no release to probe'; end if;
      for r in
        select * from (values
          ('a second assignment to the class',  'siklus-guru@synthetic.pintar.test', format('select public.assign_release(%L, %L, null, null)', v_rel, v_cls), 'ASSIGN_EXISTS'),
          ('a window that closes before it opens', 'siklus-guru@synthetic.pintar.test', format('select public.assign_release(%L, %L, %L, %L)', v_rel, v_cls, now() + interval '2 days', now() + interval '1 day'), 'ASSIGN_WINDOW_INVALID'),
          ('the school itself instead of a class', 'siklus-guru@synthetic.pintar.test', format('select public.assign_release(%L, %L, null, null)', v_rel, v_root), 'ASSIGN_CLASS_INVALID'),
          ('an unknown release',                 'siklus-guru@synthetic.pintar.test', format('select public.assign_release(%L, %L, null, null)', gen_random_uuid(), v_cls), 'ASSIGN_NOT_ALLOWED')
        ) t(label, who, stmt, want)
      loop
        perform selftest.as_user(r.who);
        v_code := selftest.f13_code(r.stmt);
        perform selftest.as_owner();
        if v_code is distinct from r.want then
          v_probs := selftest.f11_note(v_probs, 'F13-N01', format('%s answered %s, expected %s', r.label, coalesce(v_code, 'ok'), r.want));
        else m_refused := m_refused + 1; end if;
      end loop;
      -- a DEAN may not assign
      perform selftest.as_user_uid(v_dean);
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', v_rel, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_NOT_ALLOWED' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a DEAN assigning answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;
      -- another school's class: this school's content is not theirs to teach
      if v_other_cls is not null then
        perform selftest.as_user('siklus-guru@synthetic.pintar.test');
        v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', v_rel, v_other_cls));
        perform selftest.as_owner();
        if v_code is distinct from 'ASSIGN_NOT_ALLOWED' then
          v_probs := selftest.f11_note(v_probs, 'F13-N01', 'another school''s class answered ' || coalesce(v_code, 'ok -- it was assigned'));
        else m_refused := m_refused + 1; end if;
      end if;

      -- a lesson with no pre-test
      select * into r from selftest.f13_release(v_inst, selftest.f13_paket('Tanpa pemetaan F13 ' || v_tag, 0, 2, false));
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', r.release, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_PRE_TEST_MISSING' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a lesson with no pre-test answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;
      select count(*) into n from public.learning_assignments la where la.plp_release_id = r.release;
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a refused assignment left a learning assignment behind'); end if;

      -- a lesson whose post-test shares every parallel group with the pre-test
      select * into r from selftest.f13_release(v_inst, selftest.f13_paket('Paralel F13 ' || v_tag, 2, 2, false), true, true);
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', r.release, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_CYCLE_OVERLAP' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a post-test sharing parallel groups with the pre-test answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;
      select count(*) into n from public.learning_assignments la where la.plp_release_id = r.release;
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a refused overlapping cycle left a learning assignment behind'); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-N01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-N02  A STRANGER'S QUESTION ABOUT SOMEONE'S CYCLE GETS A CODE.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_la is null then raise exception 'F13-P01 made no assignment to ask about'; end if;
      perform selftest.as_user_uid(v_dean);
      v_code := selftest.f13_code(format('select * from public.my_cycle_state(%L)', v_la));
      perform selftest.as_owner();
      if v_code is distinct from 'CYCLE_NOT_ASSIGNED' then
        v_probs := selftest.f11_note(v_probs, 'F13-N02', 'a stranger asking for a learner''s cycle answered ' || coalesce(v_code, 'ok -- the cycle'));
      end if;
      perform selftest.as_user('siklus-email@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select * from public.my_cycle_state(%L)', gen_random_uuid()));
      perform selftest.as_owner();
      if v_code is distinct from 'CYCLE_NOT_ASSIGNED' then
        v_probs := selftest.f11_note(v_probs, 'F13-N02', 'an unknown assignment answered ' || coalesce(v_code, 'ok'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-N02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-N03  THE UPLOAD REFUSES A PARALLEL GROUP THAT SPANS BOTH TESTS
    --          (D-040), NAMING EVERY ROW OF IT, AND ACCEPTS SEPARATE GROUPS.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v := public.prepare_ingest_batch(selftest.f11_batch(v_inst, 'STRUCTURED_PACKAGE',
             selftest.f13_paket('Campur F13 ' || v_tag, 2, 2, true)));
      perform selftest.as_owner();
      select string_agg(distinct x ->> 'code', ','), string_agg((x ->> 'sheet') || ' ' || (x ->> 'row'), ',' order by (x ->> 'row')::int)
        into v_code, v_state from jsonb_array_elements(v -> 'problems') x;
      if (v ->> 'ok')::boolean is not false or v_code is distinct from 'ITEM_PARALLEL_CYCLE_MIXED'
         or v_state is distinct from 'Soal 2,Soal 3,Soal 4,Soal 5' then
        v_probs := selftest.f11_note(v_probs, 'F13-N03', format('a package whose groups span both tests answered %s at %s',
          coalesce(v_code, 'ok'), coalesce(v_state, 'no row')));
      end if;
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v := public.prepare_ingest_batch(selftest.f11_batch(v_inst, 'STRUCTURED_PACKAGE',
             selftest.f13_paket('Terpisah F13 ' || v_tag, 2, 2, false)));
      perform selftest.as_owner();
      if (v ->> 'ok')::boolean is not true then
        v_probs := selftest.f11_note(v_probs, 'F13-N03', 'a package with separate groups was refused: ' || left((v -> 'problems')::text, 160));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-N03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    raise exception 'F13_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F13_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  for r in
    select * from unnest(
      array['F13-P01', 'F13-P02', 'F13-N01', 'F13-N02', 'F13-N03'],
      array['BOB-04 -- a course carries its pre-test and post-test, and assigning makes the whole cycle',
            'BOB-04 -- a learner completes pre, lesson, post and result, each test drawing its own questions',
            'BOB-04 -- a lesson that cannot make a whole cycle is refused with its code and makes nothing',
            'BOB-04 -- a stranger asking for a learner''s cycle gets a code',
            'BOB-04 -- the upload refuses a parallel group spanning both tests, naming its rows (D-040)'],
      array[
        format('a teacher''s package of 3 pre-test, 2 post-test and 1 practice question became a course carrying an '
          || 'approved PRE_TEST of 3 and POST_TEST of 2, reviewed with it; once published, the teacher''s assign_release '
          || 'made an ACTIVE learning assignment naming both and two OPEN test assignments for the class, audited '
          || 'once (%s of 3)', m_steps),
        'each test may draw exactly the questions marked for it (3 and 2, no practice question); the class''s learner '
          || 'saw both in their cycle, took the pre-test (3 pre-test questions presented), the lesson and the post-test '
          || '(2 post-test questions presented), and has an outcome with both sessions FINALIZED',
        format('%s refusal(s), each PR050 with its code: a frozen, unpublished release; a published lesson whose pass '
          || 'mark the school has not set (ASSIGN_PASS_MARK_MISSING, D-088(b)); a second assignment; a window '
          || 'that closes before it opens; the school instead of a class; an unknown release; a DEAN; another school''s '
          || 'class; a lesson with no pre-test (ASSIGN_PRE_TEST_MISSING); and a post-test sharing every parallel group '
          || 'with the pre-test (ASSIGN_CYCLE_OVERLAP, INV-24) -- the last two leaving no learning assignment', m_refused),
        'my_cycle_state answered PR050 CYCLE_NOT_ASSIGNED to a DEAN asking about a learner''s assignment and to a '
          || 'learner asking about an unknown one',
        'a package whose two pre-test questions share their parallel groups with its two post-test questions came back '
          || 'ok=false with ITEM_PARALLEL_CYCLE_MIXED and nothing else, at Soal rows 2, 3, 4 and 5 -- every question of '
          || 'those groups; the same package with separate groups prepared cleanly'
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

  -- C1w F-1 (O41-21): the key in force, its own world, undone before it returns
  for r in select * from selftest.f13_kunci() loop
    id := r.id; area := 'C1w F-1 -- every view of a corrected answer marks it by the key in force (O41-21)';
    ok := r.ok; detail := r.detail;
    return next;
  end loop;
  -- F1-R1b: a key correction withdraws the explanations it makes stale, its own world, undone
  for r in select * from selftest.f13_penjelasan() loop
    id := r.id; area := 'C1w F1-R1b -- a key correction withdraws the explanations it makes stale';
    ok := r.ok; detail := r.detail;
    return next;
  end loop;
  -- F1-R1b: the marker is "any", not "all" (F13-K24), its own world, undone
  for r in select * from selftest.f13_tanda() loop
    id := r.id; area := 'C1w F1-R1b -- a key correction withdraws the explanations it makes stale';
    ok := r.ok; detail := r.detail;
    return next;
  end loop;
  -- C1w F-1, Sharon's correction (§0): the learner's own review of a corrected answer, its own world, undone
  for r in select * from selftest.f13_ulasan() loop
    id := r.id; area := 'C1w F-1 -- the learner''s review of a corrected answer gives no sealed rationale (Sharon §0)';
    ok := r.ok; detail := r.detail;
    return next;
  end loop;

  id := 'F13-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-13 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable13() from public;
grant execute on function selftest.run_fable13() to authenticated;

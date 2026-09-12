-- 0032 — forward-only repair: run_mcq_quality() raised on every call.
--
-- WHAT WAS WRONG. 0026 writes five MCQ-quality patterns. Four use a plain
-- INSERT ... SELECT, where an unknown literal is coerced to the target
-- column's type. The fifth, STEM_REVEALS_ANSWER, uses INSERT ... SELECT
-- DISTINCT, and DISTINCT forces the select list's types to be resolved before
-- the assignment is considered -- so 'ERROR' resolves to text and the
-- statement is rejected against finding_severity. Because the failure is in
-- planning, not execution, it does not depend on any row matching: every call
-- to run_mcq_quality() raised, on every course, including an empty one.
--
-- HOW IT SURVIVED FABLE-02. Nothing called it. The phase's own acceptance test
-- for the validator and the publish gate (F02-T19) exercises
-- validate_course_content() and publish_readiness() and never
-- run_mcq_quality(), so the function shipped with no caller and its first real
-- call is FABLE-03's content fixture, which has to publish a release. The
-- regression added with this migration is therefore a behavioural one -- it
-- calls the function -- rather than another structural assertion, because a
-- structural assertion is what would have missed this.
--
-- WHY IT IS FIXED HERE. The publish gate is on FABLE-03's own path: the phase
-- seeds a course and publishes a release through it. This is the narrow case
-- the standing rule allows -- a defect found inside the subsystem being used,
-- repaired forward-only, with nothing else bundled in. 0026 is not edited; the
-- function is replaced whole, with only the cast changed.

create or replace function public.run_mcq_quality(p_course uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; n integer;
begin
  select institution_id into v_inst from public.courses where id = p_course;
  if v_inst is null then raise exception 'unknown course %', p_course; end if;
  delete from public.mcq_quality_findings where course_id = p_course and acknowledged_at is null;

  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, i.id, 'CORRECT_OPTION_LENGTH_IMBALANCE', 'WARNING',
         'Soal "' || left(i.stem, 40) || '"',
         'Pilihan benar jauh lebih panjang daripada pengecohnya.',
         'Siswa yang paham pola ujian bisa memilih yang terpanjang tanpa menguasai materinya.',
         'Panjangkan pengecoh yang masuk akal atau ringkaskan pilihan benar; jangan samakan panjangnya secara kosmetik.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course
     and (select length(o.body) from public.item_options o where o.item_id = i.id and o.is_correct limit 1)
         > 2 * (select coalesce(max(length(o.body)), 0) from public.item_options o
                 where o.item_id = i.id and not o.is_correct);

  -- the only changed line: the severity literal is cast, because SELECT
  -- DISTINCT resolves the select list before assignment coercion applies
  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select distinct v_inst, p_course, i.id, 'STEM_REVEALS_ANSWER', 'ERROR'::public.finding_severity,
         'Soal "' || left(i.stem, 40) || '"',
         'Kata khas pada pertanyaan hanya muncul di pilihan yang benar.',
         'Kecocokan kata memberi jawabannya tanpa penalaran apa pun.',
         'Ganti kata itu di pertanyaan, atau pakai kata yang sama di pengecoh yang masuk akal.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
    join public.item_options oc on oc.item_id = i.id and oc.is_correct
    join lateral unnest(string_to_array(lower(oc.body), ' ')) w(token) on length(w.token) >= 6
   where m.course_id = p_course
     and lower(i.stem) like '%' || w.token || '%'
     and not exists (select 1 from public.item_options od
                      where od.item_id = i.id and not od.is_correct
                        and lower(od.body) like '%' || w.token || '%');

  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, i.id, 'IMPLAUSIBLE_DISTRACTOR', 'WARNING',
         'Soal "' || left(i.stem, 40) || '"',
         'Ada pengecoh yang terlalu pendek dibanding yang lain sehingga tidak meyakinkan.',
         'Pengecoh yang tidak mungkin dipilih mempersempit soal menjadi tebakan di antara sisanya.',
         'Tulis ulang pengecoh itu dari kesalahan berpikir yang nyata, lalu tautkan ke miskonsepsinya.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course
     and exists (select 1 from public.item_options o where o.item_id = i.id and not o.is_correct
                   and length(o.body) * 3 < (select avg(length(o2.body)) from public.item_options o2
                                              where o2.item_id = i.id));

  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, i.id, 'WEAK_MISCONCEPTION_LINKAGE', 'WARNING',
         'Soal "' || left(i.stem, 40) || '"',
         'Tidak satu pun pengecoh tertaut ke miskonsepsi.',
         'Tanpa tautan itu, jawaban salah tidak bisa dijelaskan atau diremediasi.',
         'Tautkan setiap pengecoh ke kode miskonsepsi yang menjelaskan mengapa siswa memilihnya.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course and i.item_type in ('MCQ_SINGLE','MCQ_MULTI')
     and not exists (select 1 from public.item_options o
                      where o.item_id = i.id and not o.is_correct and o.misconception_code is not null)
     and exists (select 1 from public.item_options o where o.item_id = i.id and not o.is_correct);

  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, null, 'ANSWER_POSITION_SKEW', 'WARNING',
         'Bank soal untuk kursus ini',
         'Jawaban benar terlalu sering berada di posisi yang sama.',
         'Pola posisi bisa dipelajari dan dipakai tanpa menguasai materi.',
         'Sebarkan posisi jawaban benar saat menulis, atau aktifkan pengacakan pilihan pada definisi asesmen.'
   where (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id
           join public.modules m on m.id = l.module_id where m.course_id = p_course) >= 10
     and (select max(c) * 2 > sum(c) from (
            select count(*) c from public.item_options o
              join public.items i on i.id = o.item_id
              join public.lessons l on l.id = i.lesson_id
              join public.modules m on m.id = l.module_id
             where m.course_id = p_course and o.is_correct group by o.label) x);

  select count(*) into n from public.mcq_quality_findings where course_id = p_course;
  return n;
end $$;
revoke all on function public.run_mcq_quality(uuid) from public, anon;
grant execute on function public.run_mcq_quality(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003). This one is behavioural on purpose: the
-- defect was invisible to every structural check that could be written about
-- the function, and only calling it reveals it. The probe runs inside a
-- subtransaction that is rolled back, so it leaves no course behind.
-- ---------------------------------------------------------------------------
do $$
declare v_inst uuid; v_course uuid; v_n integer;
begin
  -- the cast is present in the stored definition, whichever way the schema
  -- qualification is rendered back
  if pg_get_functiondef('public.run_mcq_quality(uuid)'::regprocedure)
     !~ 'ERROR''::(public\.)?finding_severity' then
    raise exception 'the STEM_REVEALS_ANSWER severity literal is still uncast';
  end if;

  select id into v_inst from public.institutions limit 1;
  if v_inst is null then return; end if;   -- clean database: nothing to call it on yet

  begin
    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_inst, 'Uji', 'SD', 'Kelas 1', 'Probe run_mcq_quality') returning id into v_course;
    v_n := public.run_mcq_quality(v_course);
    if v_n is null then raise exception 'run_mcq_quality returned null'; end if;
    raise exception 'probe complete' using errcode = 'PT999';   -- unwind the probe course
  exception
    when sqlstate 'PT999' then null;
    when others then
      raise exception 'run_mcq_quality still fails on a fresh course: %', sqlerrm;
  end;
end $$;

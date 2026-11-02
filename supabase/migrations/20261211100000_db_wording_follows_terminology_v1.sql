-- W4.1 (Batch 1, D-145(c)): approved Terminology v1 wording that lives in the database, not in hle.ts.
--
-- D-068(f): strings held in migrations or seeds change by migrations of their own. Applied here, all approved
-- in docs/coordination/ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md (rows in TERMINOLOGY-V1-CHANGE-IMPACT.md):
--   C29  run_mcq_quality's two finding texts: «siswa» → «murid»
--   C30  doctrine_lexicon's coaching rows: «siswa» → «murid» (labels and texts)
--   D23  the bank-wide finding's location: «Bank soal untuk kursus ini» → «Bank soal untuk paket ini» (ruling 2,
--        short form)
--   UX-17 a coaching finding names WHERE in words: the workbook's own column title («kolom Isi pelajaran»,
--        «kolom Pertanyaan»), never the database column («kolom body_markdown», «kolom stem»). The title is held
--        beside the registered column, so a field registered later must bring its title (NOT NULL).
-- B15/B16 (evaluation persona labels) are seed rows only (supabase/seed/human_evaluation.sql); staging holds no
-- evaluation_personas row (read 2 Nov), so no data migration is needed for them.
-- NOT applied, and why:
--   C31 seed display names: retained by the freeze (ruling 7, «data is not terminology»).
--   The English rule «judgemental English term» and the RV-15 bootstrap school name: no approved Indonesian wording
--   exists; they wait for an owner or Daisy ruling rather than an invented word.
--   Anything awaiting Dr Gladys (W4.2): not touched.
-- Findings already stored keep the words they were written with (they are a record); unacknowledged findings are
-- rewritten the next time their package is checked, as before. Signatures, grants and behaviour are unchanged.

alter table public.learner_readable_fields add column judul_kolom text;
update public.learner_readable_fields f set judul_kolom = t.judul
  from (values
    ('lessons','title','Judul pelajaran'),
    ('lessons','summary','Ringkasan'),
    ('lessons','body_markdown','Isi pelajaran'),
    ('items','stem','Pertanyaan'),
    ('items','stimulus','Bacaan'),
    ('items','petunjuk','Petunjuk'),
    ('items','arah_berpikir','Arah berpikir'),
    ('item_options','body','Teks pilihan'),
    ('item_options','rationale','Alasan'),
    ('misconception_taxonomy','remediation','Cara membantu'),
    ('learning_objectives','statement','Tujuan pembelajaran')
  ) as t(tabel, kolom, judul)
 where f.table_name = t.tabel and f.column_name = t.kolom;
alter table public.learner_readable_fields alter column judul_kolom set not null;
alter table public.learner_readable_fields add constraint learner_readable_fields_judul_kolom_isi
  check (btrim(judul_kolom) <> '');

update public.doctrine_lexicon set
  mengapa_penting = 'Menyebut pekerjaan murid "salah" menutup percakapan dan memindahkan fokus dari cara berpikir ke penilaian diri.'
 where term_pattern = '\ysalah\y(?!\s+satu)';
update public.doctrine_lexicon set
  label = 'kata menghakimi tentang murid',
  cara_memperbaiki = 'Ganti dengan langkah konkret berikutnya yang bisa dicoba murid.'
 where term_pattern = '\y(gagal|bodoh|malas)\y';
update public.doctrine_lexicon set
  label = 'status internal bocor ke teks murid',
  mengapa_penting = 'Nama status internal tidak berarti apa pun bagi murid dan membocorkan cara kerja sistem.'
 where term_pattern = '\y(INGESTED|STRUCTURED|VALIDATED|VALIDATION_FAILED|IN_REVIEW|APPROVED|FROZEN|SUPERSEDED)\y';
update public.doctrine_lexicon set
  label = 'istilah bukti internal bocor ke teks murid',
  cara_memperbaiki = 'Hapus dari teks yang dibaca murid.'
 where term_pattern = '\y(evidence_class|OFFICIAL|PREVIEW|SYNTHETIC|PUBLIC_DEMO)\y';

create or replace function public.validate_course_content(p_course uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare f record; r record; v_inst uuid; v_sql text; n integer := 0;
begin
  select institution_id into v_inst from public.courses where id = p_course;
  if v_inst is null then raise exception 'unknown course %', p_course; end if;
  if not public.can_in_institution('CAN_DRAFT', v_inst) then
    raise exception 'validating course content requires CAN_DRAFT in the owning institution';
  end if;
  delete from public.coaching_findings where course_id = p_course and acknowledged_at is null;

  for f in select * from public.learner_readable_fields loop
    -- every branch yields the same three columns, so the insert below does not
    -- care which table it is walking
    v_sql := case f.table_name
      when 'lessons' then format($q$
        select l.id as tid, l.%1$I as txt,
               'Pelajaran "' || l.title || '", kolom ' || %2$L as lokasi
          from public.lessons l join public.modules m on m.id = l.module_id
         where m.course_id = $1$q$, f.column_name, f.judul_kolom)
      when 'items' then format($q$
        select i.id as tid, i.%1$I as txt,
               'Soal "' || left(i.stem, 40) || '", kolom ' || %2$L as lokasi
          from public.items i join public.lessons l on l.id = i.lesson_id
          join public.modules m on m.id = l.module_id where m.course_id = $1$q$, f.column_name, f.judul_kolom)
      when 'item_options' then format($q$
        select o.id as tid, o.%1$I as txt,
               'Pilihan ' || o.label || ' pada soal "' || left(i.stem, 30) || '", kolom ' || %2$L as lokasi
          from public.item_options o join public.items i on i.id = o.item_id
          join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
         where m.course_id = $1$q$, f.column_name, f.judul_kolom)
      when 'learning_objectives' then format($q$
        select lo.id as tid, lo.%1$I as txt,
               'Tujuan ' || lo.code || ', kolom ' || %2$L as lokasi
          from public.learning_objectives lo join public.lessons l on l.id = lo.lesson_id
          join public.modules m on m.id = l.module_id where m.course_id = $1$q$, f.column_name, f.judul_kolom)
      -- misconception_taxonomy is keyed by a text code, not a uuid, so it is
      -- validated per institution rather than per course; FABLE-02 registers
      -- the field and the taxonomy sweep lands with the ingestion migration
      -- that first writes taxonomy rows.
      else null end;
    if v_sql is null then continue; end if;
    for r in execute v_sql using p_course loop
      insert into public.coaching_findings (institution_id, course_id, target_table, target_id,
        target_field, severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
      select v_inst, p_course, f.table_name, r.tid, f.column_name, v.severity,
             r.lokasi, v.label, v.mengapa_penting, v.cara_memperbaiki
        from public.validate_learner_text(r.txt) v;
      get diagnostics n = row_count;
    end loop;
  end loop;
  select count(*) into n from public.coaching_findings where course_id = p_course;
  return n;
end $$;

create or replace function public.run_mcq_quality(p_course uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; n integer;
begin
  select institution_id into v_inst from public.courses where id = p_course;
  if v_inst is null then raise exception 'unknown course %', p_course; end if;
  if not public.can_in_institution('CAN_DRAFT', v_inst) then
    raise exception 'running the MCQ quality pass requires CAN_DRAFT in the owning institution';
  end if;
  delete from public.mcq_quality_findings where course_id = p_course and acknowledged_at is null;

  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, i.id, 'CORRECT_OPTION_LENGTH_IMBALANCE', 'WARNING',
         'Soal "' || left(i.stem, 40) || '"',
         'Pilihan benar jauh lebih panjang daripada pengecohnya.',
         'Murid yang paham pola ujian bisa memilih yang terpanjang tanpa menguasai materinya.',
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
         'Tautkan setiap pengecoh ke kode miskonsepsi yang menjelaskan mengapa murid memilihnya.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course and i.item_type in ('MCQ_SINGLE','MCQ_MULTI')
     and not exists (select 1 from public.item_options o
                      where o.item_id = i.id and not o.is_correct and o.misconception_code is not null)
     and exists (select 1 from public.item_options o where o.item_id = i.id and not o.is_correct);

  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, null, 'ANSWER_POSITION_SKEW', 'WARNING',
         'Bank soal untuk paket ini',
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

do $$
declare v text;
begin
  -- every registered learner-readable column names itself in the workbook's words
  if exists (select 1 from public.learner_readable_fields where judul_kolom is null or btrim(judul_kolom) = '') then
    raise exception 'W4.1: a learner-readable column has no title in words';
  end if;
  if (select count(*) from public.learner_readable_fields) <> 11 then
    raise exception 'W4.1: expected the 11 registered learner-readable columns';
  end if;
  -- the validator builds its location from the title, never from the column name
  v := pg_get_functiondef('public.validate_course_content(uuid)'::regprocedure);
  if position('kolom %1$s' in v) > 0 or position('f.judul_kolom' in v) = 0 then
    raise exception 'W4.1: validate_course_content still names the database column in a finding''s location';
  end if;
  -- no coaching text a teacher reads says «siswa» (C29, C30); the bank is «paket» (D23)
  v := pg_get_functiondef('public.run_mcq_quality(uuid)'::regprocedure);
  if v ~* '\msiswa\M' or position('Bank soal untuk kursus ini' in v) > 0 or position('Bank soal untuk paket ini' in v) = 0 then
    raise exception 'W4.1: run_mcq_quality still carries pre-v1 wording';
  end if;
  if exists (select 1 from public.doctrine_lexicon
              where label ~* '\msiswa\M' or mengapa_penting ~* '\msiswa\M' or cara_memperbaiki ~* '\msiswa\M') then
    raise exception 'W4.1: a coaching rule still says «siswa»';
  end if;
  if (select count(*) from public.doctrine_lexicon) <> 6 then
    raise exception 'W4.1: the coaching lexicon lost or gained a rule';
  end if;
end $$;

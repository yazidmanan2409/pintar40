-- FABLE-11 database suite: BOB-02, a lesson arrives whole (D-007, D-008,
-- audit B2 and M8).
--
-- Ordering: depends on fable01.sql (the role-switch helpers) and fable06.sql
-- (as_user_uid). Never applied as a migration; never present in production.
--
--   F11-P01  the sample workbook becomes a real course in the chosen school,
--            whole: chapters, lessons, objectives, questions tagged for the
--            pre-test and post-test, options with their reasons, media at the
--            path students read -- and not before its media are uploaded
--   F11-P02  a structured package reaches its confirmation (bug B) and
--            materialises through the same door; a course-only package and the
--            old ingest_structured_package still work
--   F11-P03  a save that fails inside the materialiser undoes the confirmation:
--            the batch waits again, and a second confirmation saves it
--   F11-N01  a broken package comes back as codes at their sheet and row, and
--            writes nothing
--   F11-N02  only someone who may draft in the batch's school may prepare or
--            confirm it; a foreign and an unknown batch answer alike; the
--            platform library is not a school
--   F11-P04  BOB-11: a school's staff who may draft or review preview the
--            school's unpublished lesson media; nobody else does
--   F11-N03  a media upload URL is granted only for a file the package names,
--            in its own school, while the batch awaits confirmation
--
-- THE SAMPLE is selftest/fixtures/bob02/contoh-pelajaran.xlsx as
-- bukuKerjaKePaket turns it into JSON; BOB02-K01 fails if the literal below
-- stops being exactly that.
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply fable01.sql before fable11.sql';
  end if;
  if to_regprocedure('selftest.as_user_uid(uuid)') is null then
    raise exception 'apply fable06.sql before fable11.sql';
  end if;
end $$;

create or replace function selftest.f11_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id],
                   coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
revoke all on function selftest.f11_note(jsonb, text, text) from public;
grant execute on function selftest.f11_note(jsonb, text, text) to authenticated, anon;

create or replace function selftest.f11_user(p_email text, p_role public.app_role, p_node uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid; v_person uuid;
begin
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into auth.users (id, email) values (gen_random_uuid(), p_email) returning id into v_uid;
  select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
  if p_role is not null then
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, p_role, p_node, now() - interval '1 day', now() + interval '365 days');
  end if;
  perform set_config('app.seed_intent', '', true);
  return v_uid;
end $$;
revoke all on function selftest.f11_user(text, public.app_role, uuid) from public;

create or replace function selftest.f11_raised(p_sql text)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text; v_msg text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
  return jsonb_build_object('code', v_state, 'detail', v_detail, 'message', v_msg);
end $$;
revoke all on function selftest.f11_raised(text) from public;
grant execute on function selftest.f11_raised(text) to authenticated, anon;

-- A batch, inserted the way the Studio actions insert it: as the signed-in
-- person, through the table's own guard.
create or replace function selftest.f11_batch(p_inst uuid, p_kind public.ingest_source_kind, p_payload jsonb)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v uuid;
begin
  insert into public.ingest_batches (institution_id, source_kind, raw_payload)
  values (p_inst, p_kind, p_payload) returning ingest_batches.id into v;
  return v;
end $$;
revoke all on function selftest.f11_batch(uuid, public.ingest_source_kind, jsonb) from public;
grant execute on function selftest.f11_batch(uuid, public.ingest_source_kind, jsonb) to authenticated;

-- An upload, as the storage service records one.
create or replace function selftest.f11_uploaded(p_path text)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into storage.objects (bucket_id, name) values ('assets', p_path)
$$;
revoke all on function selftest.f11_uploaded(text) from public;

-- THE SAMPLE WORKBOOK, as bukuKerjaKePaket turns it into a lesson package.
create or replace function selftest.f11_contoh()
returns jsonb language sql immutable as $contoh$
  select '{"courses":[{"_row":{"sheet":"Kursus","row":2},"title":"Pecahan untuk Kelas 4","subject":"Matematika","stage":"SD","grade_label":"Kelas 4","konteks":"Akademik","modules":[{"_row":{"sheet":"Bab","row":2},"ordinal":"1","title":"Mengenal pecahan","lessons":[{"_row":{"sheet":"Pelajaran","row":2},"ordinal":"1","title":"Apa itu pecahan?","summary":"Pecahan menyatakan bagian dari keseluruhan.","body_markdown":"Bayangkan sebuah kue dipotong menjadi empat bagian sama besar. Satu potong adalah 1/4 dari kue.\n\nAngka di atas disebut pembilang, angka di bawah disebut penyebut.","objective":{"statement":"Murid dapat menjelaskan arti pembilang dan penyebut.","bloom":"UNDERSTAND"},"media":[{"file":"Kue Empat Potong.png"}],"items":[{"_row":{"sheet":"Soal","row":2},"ref":"S1","item_type":"MCQ_SINGLE","stem":"Pada pecahan 3/5, angka 5 disebut apa?","petunjuk":"Ingat letak angka pada pecahan.","use":"PRE_TEST","difficulty":"0.3","options":[{"_row":{"sheet":"Pilihan","row":2},"label":"A","body":"Pembilang","is_correct":false,"rationale":"Pembilang adalah angka di atas garis pecahan."},{"_row":{"sheet":"Pilihan","row":3},"label":"B","body":"Penyebut","is_correct":true,"rationale":"Angka di bawah garis pecahan menyatakan banyaknya bagian seluruhnya."}]},{"_row":{"sheet":"Soal","row":3},"ref":"S2","item_type":"MCQ_SINGLE","stem":"Pada pecahan 2/7, angka 7 disebut apa?","use":"POST_TEST","difficulty":"0.3","options":[{"_row":{"sheet":"Pilihan","row":4},"label":"A","body":"Penyebut","is_correct":true,"rationale":"Angka di bawah garis adalah penyebut."},{"_row":{"sheet":"Pilihan","row":5},"label":"B","body":"Pembilang","is_correct":false,"rationale":"Pembilang ada di atas garis."}]}]}]},{"_row":{"sheet":"Bab","row":3},"ordinal":"2","title":"Pecahan senilai","lessons":[{"_row":{"sheet":"Pelajaran","row":3},"ordinal":"1","title":"Pecahan yang senilai","summary":"Dua pecahan senilai menyatakan bagian yang sama.","body_markdown":"1/2 dan 2/4 menyatakan bagian yang sama dari sebuah kue. Kalikan pembilang dan penyebut dengan bilangan yang sama untuk mendapatkan pecahan senilai.","objective":{"statement":"Murid dapat menentukan pecahan yang senilai.","bloom":"APPLY"},"media":[{"file":"penjelasan-senilai.mp3","transcript":"Guru menjelaskan bahwa satu per dua sama dengan dua per empat."}],"items":[{"_row":{"sheet":"Soal","row":4},"ref":"S3","item_type":"MCQ_SINGLE","stem":"Manakah yang senilai dengan 1/2?","use":"PRE_TEST","difficulty":"0.5","options":[{"_row":{"sheet":"Pilihan","row":6},"label":"A","body":"2/4","is_correct":true,"rationale":"Dua per empat sama dengan setengah."},{"_row":{"sheet":"Pilihan","row":7},"label":"B","body":"1/3","is_correct":false,"rationale":"Sepertiga lebih kecil daripada setengah."},{"_row":{"sheet":"Pilihan","row":8},"label":"C","body":"2/3","is_correct":false,"rationale":"Dua per tiga lebih besar daripada setengah."}]},{"_row":{"sheet":"Soal","row":5},"ref":"S4","item_type":"MCQ_MULTI","stem":"Pilih semua pecahan yang senilai dengan 1/3.","use":"POST_TEST","difficulty":"0.5","options":[{"_row":{"sheet":"Pilihan","row":9},"label":"A","body":"2/6","is_correct":true,"rationale":"Pembilang dan penyebut 1/3 dikali 2."},{"_row":{"sheet":"Pilihan","row":10},"label":"B","body":"3/9","is_correct":true,"rationale":"Pembilang dan penyebut 1/3 dikali 3."},{"_row":{"sheet":"Pilihan","row":11},"label":"C","body":"1/6","is_correct":false,"rationale":"Penyebutnya dikali tetapi pembilangnya tidak."}]}]},{"_row":{"sheet":"Pelajaran","row":4},"ordinal":"2","title":"Menyederhanakan pecahan","body_markdown":"Bagi pembilang dan penyebut dengan faktor persekutuan terbesar.","media":[],"items":[{"_row":{"sheet":"Soal","row":6},"ref":"S5","stem":"Bentuk paling sederhana dari 4/8 adalah ...","options":[{"_row":{"sheet":"Pilihan","row":12},"label":"A","body":"1/2","is_correct":true,"rationale":"4 dan 8 dibagi 4."},{"_row":{"sheet":"Pilihan","row":13},"label":"B","body":"2/4","is_correct":false,"rationale":"Masih bisa dibagi 2 lagi."}]}]}]}]}]}'::jsonb
$contoh$;
revoke all on function selftest.f11_contoh() from public;
grant execute on function selftest.f11_contoh() to authenticated;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable11()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; n int; v_tag text; v jsonb; v_err jsonb; v_err2 jsonb; v_codes text[]; v_want text[];
  v_a uuid; v_b uuid; v_kanon uuid; v_adm uuid; v_adm_b uuid; v_dean uuid; v_guru uuid; v_sys uuid; v_adm_p uuid;
  v_batch uuid; v_batch2 uuid; v_batch3 uuid; v_course uuid; v_path text; v_state text;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  m_whole int := 0; m_struct int := 0; m_codes int := 0; m_refused int := 0; m_media int := 0; m_preview int := 0;
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F11 ' || v_tag, 'f11a-' || v_tag, true, true) returning institutions.id into v_a;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F11 tetangga ' || v_tag, 'f11b-' || v_tag, true, true) returning institutions.id into v_b;
    perform set_config('app.seed_intent', '', true);
    select i.id into v_kanon from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
    v_adm   := selftest.f11_user('f11-adm-'   || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_a);
    v_adm_b := selftest.f11_user('f11-adm-b-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_b);
    v_dean  := selftest.f11_user('f11-dekan-' || v_tag || '@local.invalid', 'DEAN',              v_a);
    v_guru  := selftest.f11_user('f11-guru-'  || v_tag || '@local.invalid', 'EDUCATOR',          v_a);
    v_sys   := selftest.f11_user('f11-sys-'   || v_tag || '@local.invalid', 'SYSTEM_ADMIN',      v_b);
    select a.person_id into v_adm_p from public.accounts a where a.auth_user_id = v_adm;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F11-P01  THE SAMPLE WORKBOOK BECOMES A REAL COURSE IN THE CHOSEN SCHOOL,
    --          WHOLE -- and not before its media are uploaded.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_adm);
      v_batch := selftest.f11_batch(v_a, 'EASY_UPLOAD', selftest.f11_contoh() || '{"format":"pintar-buku-kerja/1"}');
      v := public.prepare_ingest_batch(v_batch);
      if (v ->> 'ok')::boolean is not true then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the sample workbook was refused: ' || left((v -> 'problems')::text, 200));
      end if;
      if (v -> 'counts') is distinct from '{"courses":1,"modules":2,"lessons":3,"items":5,"options":12,"media":2}'::jsonb then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the sample was counted ' || coalesce((v -> 'counts')::text, 'nothing'));
      end if;
      select count(*) into n from jsonb_array_elements(v -> 'media') x
       where x ->> 'path' in (format('pelajaran/%s/%s/kue-empat-potong.png', v_a, v_batch),
                             format('pelajaran/%s/%s/penjelasan-senilai.mp3', v_a, v_batch));
      if n <> 2 then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the media paths are not pelajaran/<school>/<batch>/<file>: ' || coalesce((v -> 'media')::text, ''));
      end if;

      -- confirming before the files arrive makes nothing and names each file
      v := public.confirm_ingest_batch(v_batch);
      select array_agg(x ->> 'code' order by x ->> 'code') into v_codes from jsonb_array_elements(v -> 'problems') x;
      if (v ->> 'ok')::boolean is not false or v_codes is distinct from array['MEDIA_NOT_UPLOADED', 'MEDIA_NOT_UPLOADED'] then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', 'a package was confirmed before its media were uploaded: ' || left(v::text, 160));
      end if;
      perform selftest.as_owner();
      select count(*) into n from public.courses c where c.institution_id = v_a;
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F11-P01', 'a refused confirmation wrote a course'); end if;

      perform selftest.f11_uploaded(format('pelajaran/%s/%s/kue-empat-potong.png', v_a, v_batch));
      perform selftest.f11_uploaded(format('pelajaran/%s/%s/penjelasan-senilai.mp3', v_a, v_batch));
      perform selftest.as_user_uid(v_adm);
      v := public.confirm_ingest_batch(v_batch);
      v_course := (v -> 'courses' ->> 0)::uuid;
      perform selftest.as_owner();
      if (v ->> 'ok')::boolean is not true or v_course is null then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the confirmed sample made no course: ' || left(v::text, 200));
        raise exception 'no course';
      end if;

      -- the course, in the chosen school, authored by the person who confirmed
      select count(*) into n from public.courses c
       where c.id = v_course and c.institution_id = v_a and c.title = 'Pecahan untuk Kelas 4' and c.subject = 'Matematika'
         and c.stage = 'SD' and c.grade_label = 'Kelas 4' and c.status = 'INGESTED' and c.author_person_id = v_adm_p;
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the course is not the sample''s, in the chosen school, by its confirmer'); end if;
      -- two chapters, in order; three lessons with their text and objectives
      select string_agg(m.ordinal || ':' || m.title, '|' order by m.ordinal) into v_state
        from public.modules m where m.course_id = v_course;
      if v_state is distinct from '1:Mengenal pecahan|2:Pecahan senilai' then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the chapters are ' || coalesce(v_state, 'none'));
      end if;
      select count(*) into n from public.lessons l join public.modules m on m.id = l.module_id
       where m.course_id = v_course and btrim(coalesce(l.body_markdown, '')) <> '';
      if n <> 3 then v_probs := selftest.f11_note(v_probs, 'F11-P01', format('%s lesson(s) with their text, expected 3', n)); end if;
      select count(*) into n from public.learning_objectives lo join public.lessons l on l.id = lo.lesson_id
        join public.modules m on m.id = l.module_id where m.course_id = v_course;
      if n <> 2 then v_probs := selftest.f11_note(v_probs, 'F11-P01', format('%s objective(s), expected 2', n)); end if;
      select count(*) into n from public.learning_objectives lo join public.lessons l on l.id = lo.lesson_id
        join public.modules m on m.id = l.module_id where m.course_id = v_course and lo.bloom = 'APPLY' and l.title = 'Pecahan yang senilai';
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the "Menerapkan" objective did not become APPLY'); end if;
      -- media at the path students read, audio with its transcript
      select count(*) into n from public.lessons l join public.modules m on m.id = l.module_id,
             jsonb_array_elements(l.media) e
       where m.course_id = v_course
         and ((e ->> 'jenis' = 'gambar' and e ->> 'path' = format('pelajaran/%s/%s/kue-empat-potong.png', v_a, v_batch))
           or (e ->> 'jenis' = 'audio' and e ->> 'path' = format('pelajaran/%s/%s/penjelasan-senilai.mp3', v_a, v_batch)
               and btrim(coalesce(e ->> 'transcript', '')) <> ''));
      if n <> 2 then v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the lessons do not carry their media at the read path'); end if;
      -- D-008: which assessment each question is for, and its bank
      select string_agg(format('%s:%s:%s:%s', i.stem like '%3/5%' or i.stem like '%1/2?%', coalesce(i.cycle_role::text, '-'),
                               i.bank_type, i.item_type), '|' order by i.stem)
        into v_state
        from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
       where m.course_id = v_course;
      select count(*) filter (where i.cycle_role = 'PRE_TEST' and i.bank_type = 'TEST'),
             count(*) filter (where i.cycle_role = 'POST_TEST' and i.bank_type = 'TEST'),
             count(*) filter (where i.cycle_role is null and i.bank_type = 'PRACTICE')
        into n, m_struct, m_codes
        from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
       where m.course_id = v_course;
      if (n, m_struct, m_codes) is distinct from (2, 2, 1) then
        v_probs := selftest.f11_note(v_probs, 'F11-P01',
          format('%s pre-test, %s post-test and %s practice question(s), expected 2, 2 and 1: %s', n, m_struct, m_codes, v_state));
      end if;
      m_struct := 0; m_codes := 0;
      -- the multi-answer question keeps both its answers; every option its reason
      select count(*) into n from public.items i join public.item_options o on o.item_id = i.id
        join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
       where m.course_id = v_course and i.item_type = 'MCQ_MULTI' and o.is_correct;
      if n <> 2 then v_probs := selftest.f11_note(v_probs, 'F11-P01', format('the multi-answer question has %s correct option(s), expected 2', n)); end if;
      select count(*), count(*) filter (where btrim(o.rationale) <> '') into n, m_whole
        from public.item_options o join public.items i on i.id = o.item_id
        join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = v_course;
      if n <> 12 or m_whole <> 12 then v_probs := selftest.f11_note(v_probs, 'F11-P01', format('%s option(s), %s with a reason; expected 12 and 12', n, m_whole)); end if;
      -- RESTATED BY D-040: a parallel group means equivalent questions, so the
      -- sample's pre-test and post-test questions share none -- the sample was
      -- regrouped exactly as the SD 5 Bab 1 workbook was, and has no group
      select count(distinct i.parallel_group), count(*) filter (where i.parallel_group is not null) into n, m_whole
        from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
       where m.course_id = v_course;
      if (n, m_whole) is distinct from (0, 0) then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', format('%s parallel group(s) over %s question(s), expected none (D-040)', n, m_whole));
      end if;
      m_whole := 0;
      -- the batch says what happened and who did it
      select count(*) into n from public.ingest_batches b
       where b.id = v_batch and b.status = 'MATERIALISED' and b.confirmed_by_person_id = v_adm_p and b.confirmed_at is not null;
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the batch does not record its confirmation'); end if;
      select count(*) into n from public.audit_log l where l.target_id = v_batch::text
         and l.action in ('ingest.prepared', 'ingest.materialised') and l.actor_person_id = v_adm_p;
      if n <> 2 then v_probs := selftest.f11_note(v_probs, 'F11-P01', format('%s audit row(s); one prepare and one materialisation were expected', n)); end if;
      -- and a second confirmation is refused, not a second course
      perform selftest.as_user_uid(v_adm);
      v_err := selftest.f11_raised(format('select public.confirm_ingest_batch(%L::uuid)', v_batch));
      perform selftest.as_owner();
      if v_err ->> 'code' is distinct from 'PR030' or v_err ->> 'detail' is distinct from 'PACKAGE_STATE_INVALID' then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', 'a second confirmation answered ' || coalesce(v_err::text, 'ok -- a second course'));
      end if;
      select count(*) into n from public.courses c where c.institution_id = v_a;
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F11-P01', format('%s course(s) from one confirmed workbook', n)); end if;
      -- the same content, freshly imported, passes the text validator's reading
      m_whole := 1;
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'no course' then
        v_probs := selftest.f11_note(v_probs, 'F11-P01', 'the test could not run: ' || left(sqlerrm, 150));
      end if;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F11-P02  PAKET TERSTRUKTUR REACHES ITS CONFIRMATION (bug B), and the
    --          older entry points still work through the same materialiser.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_batch2 := selftest.f11_batch(v_a, 'STRUCTURED_PACKAGE', jsonb_build_object('courses', jsonb_build_array(
        jsonb_build_object('title', 'Paket Mesin', 'subject', 'IPA', 'stage', 'SMP', 'grade_label', 'Kelas 7',
          'modules', jsonb_build_array(jsonb_build_object('title', 'Energi', 'lessons', jsonb_build_array(
            jsonb_build_object('title', 'Energi kinetik', 'body_markdown', 'Benda yang bergerak memiliki energi kinetik.',
              'items', jsonb_build_array(jsonb_build_object('stem', 'Benda manakah yang memiliki energi kinetik?', 'use', 'POST_TEST',
                'options', jsonb_build_array(
                  jsonb_build_object('label', 'A', 'body', 'Bola yang menggelinding', 'is_correct', true, 'rationale', 'Bola itu bergerak.'),
                  jsonb_build_object('label', 'B', 'body', 'Batu yang diam', 'is_correct', false, 'rationale', 'Batu itu tidak bergerak.'))))))))))));
      v := public.prepare_ingest_batch(v_batch2);
      perform selftest.as_owner();
      -- what today's /studio/unggah lists as awaiting confirmation: not yet
      -- confirmed, with open questions
      select count(*) into n from public.ingest_batches b
       where b.id = v_batch2 and b.status = 'MAPPING_PROPOSED' and b.confirmed_at is null
         and jsonb_array_length(b.open_questions) = 1 and b.open_questions -> 0 ->> 'code' = 'PACKAGE_CONFIRM';
      if (v ->> 'ok')::boolean is not true or n <> 1 then
        v_probs := selftest.f11_note(v_probs, 'F11-P02', 'a prepared structured package is not offered for confirmation: ' || left(v::text, 160));
      else m_struct := m_struct + 1; end if;
      perform selftest.as_user_uid(v_guru);
      v := public.confirm_ingest_batch(v_batch2);
      perform selftest.as_owner();
      select count(*) into n from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
       where m.course_id = (v -> 'courses' ->> 0)::uuid and i.cycle_role = 'POST_TEST';
      if (v ->> 'ok')::boolean is not true or n <> 1 then
        v_probs := selftest.f11_note(v_probs, 'F11-P02', 'the confirmed structured package did not materialise whole: ' || left(v::text, 160));
      else m_struct := m_struct + 1; end if;

      -- a course-only package, as the earlier contract allowed
      perform selftest.as_user_uid(v_guru);
      v_batch3 := selftest.f11_batch(v_a, 'STRUCTURED_PACKAGE', '{"courses":[{"title":"Hanya Kursus","subject":"IPS","stage":"SMP","grade_label":"Kelas 8"}]}');
      perform public.prepare_ingest_batch(v_batch3);
      v := public.confirm_ingest_batch(v_batch3);
      if (v ->> 'ok')::boolean is not true then
        v_probs := selftest.f11_note(v_probs, 'F11-P02', 'a course-only package was refused: ' || left(v::text, 160));
      else m_struct := m_struct + 1; end if;

      -- and the old entry point, on a batch confirmed the old way, now makes
      -- the whole hierarchy instead of an empty course
      v_batch3 := selftest.f11_batch(v_a, 'STRUCTURED_PACKAGE', jsonb_build_object('courses', jsonb_build_array(
        (selftest.f11_contoh() -> 'courses' -> 0) || '{"title":"Jalur Lama"}'::jsonb)));
      update public.ingest_batches set status = 'CONFIRMED' where ingest_batches.id = v_batch3;
      n := public.ingest_structured_package(v_batch3);
      perform selftest.as_owner();
      select count(*) into m_codes from public.items i join public.lessons l on l.id = i.lesson_id
        join public.modules m on m.id = l.module_id join public.courses c on c.id = m.course_id
       where c.institution_id = v_a and c.title = 'Jalur Lama';
      if n <> 1 or m_codes <> 5 then
        v_probs := selftest.f11_note(v_probs, 'F11-P02', format('ingest_structured_package made %s course(s) holding %s question(s), expected 1 and 5', n, m_codes));
      else m_struct := m_struct + 1; end if;
      m_codes := 0;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F11-P02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F11-P03  A SAVE THAT FAILS LEAVES NOTHING BEHIND: the batch is back at
    --          MAPPING_PROPOSED, no course, the error kept -- and once the fault
    --          is gone the same batch confirms into its course.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_batch2 := selftest.f11_batch(v_a, 'STRUCTURED_PACKAGE', jsonb_build_object('courses', jsonb_build_array(
        jsonb_build_object('title', 'Paket Gagal Simpan ' || v_tag, 'subject', 'IPA', 'stage', 'SMP', 'grade_label', 'Kelas 7',
          'modules', jsonb_build_array(jsonb_build_object('title', 'Gaya', 'lessons', jsonb_build_array(
            jsonb_build_object('title', 'Gaya dorong', 'body_markdown', 'Dorongan dapat menggerakkan benda.',
              'items', jsonb_build_array(jsonb_build_object('stem', 'F11P03 dorongan menggerakkan apa?', 'use', 'POST_TEST',
                'options', jsonb_build_array(
                  jsonb_build_object('label', 'A', 'body', 'Benda', 'is_correct', true, 'rationale', 'Dorongan adalah gaya.'),
                  jsonb_build_object('label', 'B', 'body', 'Bayangan', 'is_correct', false, 'rationale', 'Bayangan tidak bermassa.'))))))))))));
      v := public.prepare_ingest_batch(v_batch2);
      if (v ->> 'ok')::boolean is not true then raise exception 'the recovery fixture did not prepare: %', left(v::text, 120); end if;

      -- the planted fault: the materialiser's item insert fails for this stem only
      perform selftest.as_owner();
      execute $plant$
        create function selftest.f11_gagal() returns trigger language plpgsql as $f$
        begin
          if new.stem like 'F11P03 %' then raise exception 'F11P03 planted save failure'; end if;
          return new;
        end $f$;
        create trigger f11_gagal before insert on public.items for each row execute function selftest.f11_gagal();
      $plant$;

      perform selftest.as_user_uid(v_guru);
      v := public.confirm_ingest_batch(v_batch2);
      perform selftest.as_owner();
      if (v ->> 'ok')::boolean is not false or v -> 'problems' -> 0 ->> 'code' is distinct from 'PACKAGE_COULD_NOT_BE_SAVED' then
        v_probs := selftest.f11_note(v_probs, 'F11-P03', 'the failed save answered ' || left(v::text, 160));
      end if;
      select b.status::text into v_state from public.ingest_batches b where b.id = v_batch2;
      if v_state is distinct from 'MAPPING_PROPOSED' then
        v_probs := selftest.f11_note(v_probs, 'F11-P03', 'after a failed save the batch is ' || coalesce(v_state, 'gone'));
      end if;
      select count(*) into n from public.ingest_batches b
       where b.id = v_batch2 and b.validation_result -> 'materialise_error' ->> 'message' like '%F11P03 planted save failure%';
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F11-P03', 'the failed save did not keep the database''s error'); end if;
      select count(*) into n from public.courses c where c.institution_id = v_a and c.title = 'Paket Gagal Simpan ' || v_tag;
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F11-P03', format('a failed save left %s course(s)', n)); end if;

      -- the fault is removed; the same batch now confirms into its course
      execute 'drop trigger f11_gagal on public.items; drop function selftest.f11_gagal()';
      perform selftest.as_user_uid(v_guru);
      begin
        v := public.confirm_ingest_batch(v_batch2); v_err := null;
      exception when others then
        v := null; v_err := jsonb_build_object('code', sqlstate, 'message', sqlerrm);
      end;
      perform selftest.as_owner();
      select count(*) into n from public.courses c where c.institution_id = v_a and c.title = 'Paket Gagal Simpan ' || v_tag;
      select b.status::text into v_state from public.ingest_batches b where b.id = v_batch2;
      if v_err is not null or (v ->> 'ok')::boolean is not true or n <> 1 or v_state is distinct from 'MATERIALISED' then
        v_probs := selftest.f11_note(v_probs, 'F11-P03', format('a second confirmation after the fault answered %s; %s course(s), batch %s',
          left(coalesce(v_err, v)::text, 160), n, coalesce(v_state, 'gone')));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F11-P03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F11-N01  A BROKEN PACKAGE COMES BACK AS CODES AT THEIR SHEET AND ROW,
    --          AND WRITES NOTHING.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_adm);
      v_batch3 := selftest.f11_batch(v_a, 'EASY_UPLOAD', jsonb_build_object('courses', jsonb_build_array(jsonb_build_object(
        '_row', jsonb_build_object('sheet', 'Kursus', 'row', 2),
        'title', ' ', 'subject', 'Matematika', 'stage', 'SD', 'grade_label', 'Kelas 4', 'learning_context', 'HOBI',
        'modules', jsonb_build_array(
          jsonb_build_object('_row', jsonb_build_object('sheet', 'Bab', 'row', 2), 'ordinal', '1', 'title', 'Satu',
            'lessons', jsonb_build_array(jsonb_build_object('_row', jsonb_build_object('sheet', 'Pelajaran', 'row', 2),
              'ordinal', '1', 'title', 'Tanpa isi', 'body_markdown', '',
              'media', jsonb_build_array(jsonb_build_object('file', 'suara.mp3'), jsonb_build_object('file', 'catatan.docx')),
              'items', jsonb_build_array(
                jsonb_build_object('_row', jsonb_build_object('sheet', 'Soal', 'row', 2), 'ref', 'S1', 'stem', 'Soal satu',
                  'petunjuk', 'Jawabannya adalah B', 'use', 'UJIAN', 'difficulty', '7', 'parallel_group', 'P1',
                  'options', jsonb_build_array(jsonb_build_object('_row', jsonb_build_object('sheet', 'Pilihan', 'row', 2),
                    'label', 'A', 'body', 'Satu', 'is_correct', false, 'rationale', 'Alasan'))),
                jsonb_build_object('_row', jsonb_build_object('sheet', 'Soal', 'row', 3), 'ref', 's1', 'stem', 'Soal dua',
                  'parallel_group', 'p1', 'options', jsonb_build_array(
                    jsonb_build_object('_row', jsonb_build_object('sheet', 'Pilihan', 'row', 3), 'label', 'A', 'body', 'Satu', 'is_correct', true, 'rationale', 'Benar'),
                    jsonb_build_object('_row', jsonb_build_object('sheet', 'Pilihan', 'row', 4), 'label', 'A', 'body', 'Dua', 'is_correct', true, 'rationale', ''),
                    jsonb_build_object('_row', jsonb_build_object('sheet', 'Pilihan', 'row', 5), 'label', 'C', 'body', 'Tiga', 'is_correct', false,
                                       'rationale', 'Salah', 'misconception_code', 'TIDAK-ADA-KODE-INI'))))))),
          jsonb_build_object('_row', jsonb_build_object('sheet', 'Bab', 'row', 3), 'ordinal', '1', 'title', 'Kembar'))))));
      v := public.prepare_ingest_batch(v_batch3);
      select array_agg(distinct x ->> 'code' order by x ->> 'code') into v_codes from jsonb_array_elements(v -> 'problems') x;
      v_want := array['COURSE_CONTEXT_UNKNOWN', 'COURSE_TITLE_MISSING', 'ITEM_CORRECT_TOO_MANY',
                      'ITEM_DIFFICULTY_INVALID', 'ITEM_HINT_REVEALS_ANSWER', 'ITEM_OPTIONS_TOO_FEW', 'ITEM_PARALLEL_TIER_MIXED',
                      'ITEM_REF_REPEATED', 'ITEM_USE_UNKNOWN', 'LESSON_TEXT_MISSING', 'MEDIA_KIND_UNKNOWN',
                      'MEDIA_TRANSCRIPT_MISSING', 'MODULE_NUMBER_REPEATED', 'OPTION_LABEL_REPEATED',
                      'OPTION_MISCONCEPTION_UNKNOWN', 'OPTION_REASON_MISSING'];
      if (v ->> 'ok')::boolean is not false or v_codes is distinct from v_want then
        v_probs := selftest.f11_note(v_probs, 'F11-N01', format('the broken package answered %s; missing %s; unexpected %s',
          v ->> 'ok',
          (select string_agg(w, ',') from unnest(v_want) w where w <> all (coalesce(v_codes, '{}'))),
          (select string_agg(w, ',') from unnest(coalesce(v_codes, '{}')) w where w <> all (v_want))));
      else m_codes := array_length(v_codes, 1); end if;
      -- each at its row
      for r in select * from unnest(
          array['COURSE_TITLE_MISSING', 'MODULE_NUMBER_REPEATED', 'LESSON_TEXT_MISSING', 'ITEM_REF_REPEATED', 'OPTION_LABEL_REPEATED', 'OPTION_REASON_MISSING'],
          array['Kursus', 'Bab', 'Pelajaran', 'Soal', 'Pilihan', 'Pilihan'], array[2, 3, 2, 3, 4, 4]) as t(code, sheet, row) loop
        if not exists (select 1 from jsonb_array_elements(v -> 'problems') x
                        where x ->> 'code' = r.code and x ->> 'sheet' = r.sheet and (x ->> 'row')::int = r.row) then
          v_probs := selftest.f11_note(v_probs, 'F11-N01', format('%s is not reported at %s row %s', r.code, r.sheet, r.row));
        end if;
      end loop;
      -- a problem is a code and a place, never the database's words
      select count(*) into n from jsonb_array_elements(v -> 'problems') x
       where (x ->> 'code') !~ '^[A-Z_]+$'
          or exists (select 1 from jsonb_object_keys(x) k where k not in ('code', 'sheet', 'row', 'field', 'path', 'file'));
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F11-N01', format('%s problem(s) carry more than a code and a place', n)); end if;
      -- and nothing is offered for confirmation, and a confirmation makes nothing
      v := public.confirm_ingest_batch(v_batch3);
      perform selftest.as_owner();
      select count(*) into n from public.ingest_batches b where b.id = v_batch3 and b.open_questions = '[]'::jsonb and b.confirmed_at is null;
      if (v ->> 'ok')::boolean is not false or n <> 1 then
        v_probs := selftest.f11_note(v_probs, 'F11-N01', 'a broken package was offered or accepted for confirmation');
      end if;
      select count(*) into n from public.courses c where c.institution_id = v_a and c.subject = 'Matematika' and c.title = ' ';
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F11-N01', 'a broken package wrote a course'); end if;
      -- an empty package is a problem too, not an empty success
      perform selftest.as_user_uid(v_adm);
      v_batch3 := selftest.f11_batch(v_a, 'EASY_UPLOAD', '{"files":[]}');
      v := public.prepare_ingest_batch(v_batch3);
      perform selftest.as_owner();
      if (v ->> 'ok')::boolean is not false or v -> 'problems' -> 0 ->> 'code' is distinct from 'PACKAGE_EMPTY' then
        v_probs := selftest.f11_note(v_probs, 'F11-N01', 'an empty package answered ' || left(v::text, 120));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F11-N01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F11-N02  ONLY SOMEONE WHO MAY DRAFT IN THE BATCH'S SCHOOL MAY PREPARE OR
    --          CONFIRM IT; the platform library is not a school (M8).
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_adm);
      v_batch3 := selftest.f11_batch(v_a, 'STRUCTURED_PACKAGE', '{"courses":[{"title":"Rahasia","subject":"IPA","stage":"SD","grade_label":"Kelas 5"}]}');
      perform selftest.as_owner();
      for r in select * from unnest(array[v_dean, v_adm_b], array['a DEAN at the school', 'another school''s admin']) as t(uid, label) loop
        foreach v_path in array array['prepare_ingest_batch', 'confirm_ingest_batch'] loop
          perform selftest.as_user_uid(r.uid);
          v_err := selftest.f11_raised(format('select public.%I(%L::uuid)', v_path, v_batch3));
          perform selftest.as_owner();
          if v_err ->> 'code' = 'PR030' and v_err ->> 'detail' = 'PACKAGE_NOT_ALLOWED' then m_refused := m_refused + 1;
          else v_probs := selftest.f11_note(v_probs, 'F11-N02', format('%s: %s answered %s', r.label, v_path, coalesce(v_err::text, 'ok -- it was accepted'))); end if;
        end loop;
      end loop;
      -- a foreign batch and an unknown one answer alike
      perform selftest.as_user_uid(v_adm_b);
      v_err  := selftest.f11_raised(format('select public.prepare_ingest_batch(%L::uuid)', v_batch3));
      v_err2 := selftest.f11_raised(format('select public.prepare_ingest_batch(%L::uuid)', gen_random_uuid()));
      perform selftest.as_owner();
      if v_err is distinct from v_err2 then
        v_probs := selftest.f11_note(v_probs, 'F11-N02', 'a foreign batch and an unknown batch answer differently');
      end if;
      -- anonymous callers cannot reach either
      perform selftest.as_anon();
      v_err := selftest.f11_raised(format('select public.confirm_ingest_batch(%L::uuid)', v_batch3));
      perform selftest.as_owner();
      if v_err ->> 'code' is distinct from '42501' then
        v_probs := selftest.f11_note(v_probs, 'F11-N02', 'an anonymous caller reached confirm_ingest_batch: ' || coalesce(v_err::text, 'ok'));
      else m_refused := m_refused + 1; end if;
      -- M8: the platform's library is not where a school's workbook goes. RESTATED FOR CR-51 (D-120 Q7, a changed
      -- requirement): the platform admin prepares the library's standard content through the same import, and every
      -- school role stays refused there, even one holding CAN_DRAFT in the library itself
      if v_kanon is not null then
        perform selftest.f05_actor('kanonik-penyusun@pintar.test', 'EDUCATOR', v_kanon);
        perform selftest.as_user('kanonik-penyusun@pintar.test');
        v_batch3 := selftest.f11_batch(v_kanon, 'EASY_UPLOAD', selftest.f11_contoh());
        v_err := selftest.f11_raised(format('select public.prepare_ingest_batch(%L::uuid)', v_batch3));
        perform selftest.as_owner();
        if v_err ->> 'code' = 'PR030' and v_err ->> 'detail' = 'PACKAGE_SCHOOL_NOT_ALLOWED' then m_refused := m_refused + 1;
        else v_probs := selftest.f11_note(v_probs, 'F11-N02', 'a package for the platform library answered ' || coalesce(v_err::text, 'ok -- it was accepted')); end if;
        perform selftest.as_user_uid(v_sys);
        v_batch3 := selftest.f11_batch(v_kanon, 'EASY_UPLOAD', selftest.f11_contoh());
        v_err := selftest.f11_raised(format('select public.prepare_ingest_batch(%L::uuid)', v_batch3));
        perform selftest.as_owner();
        if v_err is not null then
          v_probs := selftest.f11_note(v_probs, 'F11-N02', 'the platform admin''s package for the library was refused (D-120 Q7): ' || v_err::text);
        end if;
      else
        v_probs := selftest.f11_note(v_probs, 'F11-N02', 'no PLATFORM_CANONICAL institution exists to test M8 against');
      end if;
      select count(*) into n from public.courses c where c.title = 'Rahasia' and c.institution_id = v_a;
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F11-N02', 'a refused caller made a course'); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F11-N02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F11-N03  A MEDIA UPLOAD URL IS GRANTED ONLY FOR A FILE THE PACKAGE
    --          NAMES, IN ITS OWN SCHOOL, WHILE THE BATCH AWAITS CONFIRMATION.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_adm);
      v_batch3 := selftest.f11_batch(v_a, 'EASY_UPLOAD', selftest.f11_contoh());
      perform public.prepare_ingest_batch(v_batch3);
      v_path := format('pelajaran/%s/%s/kue-empat-potong.png', v_a, v_batch3);
      for r in select * from unnest(
          array[v_adm, v_guru, v_adm, v_adm, v_adm, v_adm_b, v_dean],
          array[v_path, v_path,
                format('pelajaran/%s/%s/lain.png', v_a, v_batch3),
                format('pelajaran/%s/%s/kue-empat-potong.png', v_b, v_batch3),
                format('pelajaran/%s/kue-empat-potong.png', v_a),
                v_path, v_path],
          array[true, true, false, false, false, false, false],
          array['the school''s admin, a named file', 'a teacher who may draft, a named file', 'a file the package does not name',
                'the batch under another school''s id', 'a path without its batch', 'another school''s admin', 'a DEAN']) as t(uid, p, want, label) loop
        perform selftest.as_user_uid(r.uid);
        if public.may_upload_package_media(r.p) is distinct from r.want then
          v_probs := selftest.f11_note(v_probs, 'F11-N03', format('%s: upload %s', r.label, case when r.want then 'refused' else 'granted' end));
        else m_media := m_media + 1; end if;
      end loop;
      -- once the batch is materialised its paths are closed
      perform selftest.as_owner();
      perform selftest.f11_uploaded(v_path);
      perform selftest.f11_uploaded(format('pelajaran/%s/%s/penjelasan-senilai.mp3', v_a, v_batch3));
      perform selftest.as_user_uid(v_adm);
      v := public.confirm_ingest_batch(v_batch3);
      if (v ->> 'ok')::boolean is not true then raise exception 'the upload fixture did not confirm: %', left(v::text, 120); end if;
      if public.may_upload_package_media(v_path) then
        v_probs := selftest.f11_note(v_probs, 'F11-N03', 'a materialised batch still grants uploads');
      else m_media := m_media + 1; end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F11-N03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F11-P04  BOB-11 (M9): A SCHOOL'S STAFF PREVIEW ITS UNPUBLISHED MEDIA, and
    --          nobody else does. P01's course is INGESTED, released to no one,
    --          so no learner's assignment names its audio.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      v_path := format('pelajaran/%s/%s/penjelasan-senilai.mp3', v_a, v_batch);
      for r in select * from unnest(
          array[v_adm, v_guru, v_sys, v_dean, v_adm_b, v_adm],
          array[v_path, v_path, v_path, v_path, v_path, format('pelajaran/%s/%s/tidak-disebut.mp3', v_a, v_batch)],
          array[true, true, true, false, false, false],
          array['the school''s admin', 'a drafting teacher of the school', 'a platform admin',
                'a DEAN of the school (no draft, no review)', 'another school''s admin',
                'the school''s admin, for a path no lesson names']
        ) as t(who, pth, harap, label) loop
        perform selftest.as_user_uid(r.who);
        if public.may_preview_lesson_media(r.pth) is not distinct from r.harap then m_preview := m_preview + 1;
        else
          v_probs := selftest.f11_note(v_probs, 'F11-P04',
            format('%s was %s', r.label, case when r.harap then 'refused a preview' else 'let preview' end));
        end if;
        perform selftest.as_owner();
      end loop;
      -- the learner's question is unchanged: nobody here is assigned the course
      perform selftest.as_user_uid(v_adm);
      if public.may_read_lesson_media(v_path) then
        v_probs := selftest.f11_note(v_probs, 'F11-P04', 'the learner''s question now answers an unassigned admin');
      end if;
      perform selftest.as_owner();
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F11-P04', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    raise exception 'F11_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F11_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  for r in
    select * from unnest(
      array['F11-P01', 'F11-P02', 'F11-P03', 'F11-N01', 'F11-N02', 'F11-N03', 'F11-P04'],
      array['BOB-02 -- the sample workbook becomes a real course in the chosen school, whole',
            'BOB-02 -- a structured package reaches its confirmation and materialises',
            'BOB-02 -- a failed save leaves the batch waiting and a second confirmation saves it',
            'BOB-02 -- a broken package comes back as codes at their row and writes nothing',
            'BOB-02 -- only a drafter in the batch''s school prepares or confirms it (M8)',
            'BOB-02 -- a media upload is granted only for a named file of a waiting batch',
            'BOB-11 -- a school''s staff preview its unpublished media, and nobody else does'],
      array[
        'the sample workbook, prepared and confirmed by the school''s INSTITUTION_ADMIN, became one INGESTED course of '
          || 'that school authored by its confirmer, with 2 chapters, 3 lessons with their text, 2 objectives (Menerapkan '
          || 'as APPLY), 5 questions -- 2 PRE_TEST and 2 POST_TEST (bank TEST), 1 practice (bank PRACTICE), one '
          || 'multi-answer question keeping both answers -- 12 options each with its reason, no parallel group across the tests (D-040), and '
          || 'its image and audio (with transcript) at pelajaran/<school>/<batch>/<file>; a confirmation before the '
          || 'media were uploaded made nothing and named both files MEDIA_NOT_UPLOADED; the batch records who confirmed; '
          || 'prepare and materialisation are each audited once; a second confirmation is PR030 PACKAGE_STATE_INVALID',
        format('a prepared structured package is MAPPING_PROPOSED, unconfirmed, with one PACKAGE_CONFIRM open question '
          || '-- exactly what /studio/unggah lists for confirmation -- and a teacher''s confirmation materialises it '
          || 'whole; a course-only package still works, and ingest_structured_package on an old-style CONFIRMED batch '
          || 'now makes the whole hierarchy (%s of 4)', m_struct),
        'with a planted fault in the materialiser''s item insert, confirm_ingest_batch answered ok=false '
          || 'PACKAGE_COULD_NOT_BE_SAVED, the batch was back at MAPPING_PROPOSED with the database''s error in '
          || 'validation_result.materialise_error and no course written; with the fault removed, a second confirmation '
          || 'of the same batch answered ok, made its one course and left the batch MATERIALISED',
        format('a package with sixteen distinct faults answered ok=false with exactly those %s codes, each at its '
          || 'sheet and row where the package named one, and nothing but a code and a place; it was not offered for '
          || 'confirmation, a confirmation made nothing, and an empty package is PACKAGE_EMPTY', m_codes),
        format('a DEAN and another school''s admin are PR030 PACKAGE_NOT_ALLOWED on prepare and confirm, a foreign and '
          || 'an unknown batch answer identically, an anonymous caller cannot execute confirm, and a school role''s '
          || 'package for the platform library (CAN_DRAFT there) is PACKAGE_SCHOOL_NOT_ALLOWED while the platform admin''s '
          || 'is accepted (D-120 Q7) (%s refusal(s))', m_refused),
        format('may_upload_package_media grants the school''s admin and a drafting teacher a file the package names, and '
          || 'refuses an unnamed file, another school''s id, a path without its batch, another school''s admin and a '
          || 'DEAN; once the batch is materialised it grants nothing (%s of 8)', m_media),
        format('may_preview_lesson_media lets the school''s admin, a drafting teacher and a platform admin hear the '
          || 'unreleased course''s audio, and refuses a DEAN of the school, another school''s admin and a path no lesson '
          || 'names (%s of 6); may_read_lesson_media still answers only a learner the course is assigned to', m_preview)
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

  id := 'F11-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-11 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable11() from public;
grant execute on function selftest.run_fable11() to authenticated;

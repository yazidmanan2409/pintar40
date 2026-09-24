-- L3-F03. Four mutating, client-exposed, SECURITY DEFINER STAFF RPCs carried no
-- authorization predicate at all. They were granted to `authenticated` and they
-- resolved their institution from the argument they were handed, so any signed-in
-- person who knew a course or batch id reached them — including a DEAN, who holds
-- no capability anywhere (INV-19), and including a DEAN of a different institution
-- (INV-13).
--
-- Layer-3 drove two of them. A capability-less DEAN of `pintar-human-evaluation`
-- called `run_mcq_quality` against a course owned by `pintar-bootstrap-official`
-- and its first statement — `delete from mcq_quality_findings ... where
-- acknowledged_at is null` — removed that tenant's finding. `validate_course_content`
-- accepted the same DEAN and opens with the same shape of delete over
-- `coaching_findings`. The other two, `ingest_structured_package` and
-- `propose_easy_upload_mapping`, are unguarded code paths that no fixture could
-- drive, because no seed creates an `ingest_batches` row: recorded as unguarded,
-- not as demonstrated.
--
-- The intended contract was not invented here. Doc 05 gives DEAN ❌ on both the
-- "Ingest (Easy Upload / Structured Package Import)" row and the "Read Publish
-- Readiness + MCQ Quality Findings" row, and gives EDUCATOR ✅ on both; the
-- capability EDUCATOR holds over content is CAN_DRAFT. `client_rpc_registry`
-- already declared it in prose for two of them — "content validator; CAN_DRAFT"
-- and "authoring ingestion; CAN_DRAFT" — and nothing compared the declaration
-- with the implementation. The primitive reused is the one
-- `create_course_revision` already uses over the same table: resolve the owning
-- institution from the argument, then `can_in_institution('CAN_DRAFT', …)`.
--
-- The check is placed after the row is resolved (the institution comes from it)
-- and BEFORE the first delete, insert or update. Nothing here relies on RLS:
-- these are SECURITY DEFINER and RLS does not run for them, which is the whole
-- reason the guard has to be in the body.
--
-- Signatures, return types and every other behaviour are unchanged.

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
               'Pelajaran "' || l.title || '", kolom %1$s' as lokasi
          from public.lessons l join public.modules m on m.id = l.module_id
         where m.course_id = $1$q$, f.column_name)
      when 'items' then format($q$
        select i.id as tid, i.%1$I as txt,
               'Soal "' || left(i.stem, 40) || '", kolom %1$s' as lokasi
          from public.items i join public.lessons l on l.id = i.lesson_id
          join public.modules m on m.id = l.module_id where m.course_id = $1$q$, f.column_name)
      when 'item_options' then format($q$
        select o.id as tid, o.%1$I as txt,
               'Pilihan ' || o.label || ' pada soal "' || left(i.stem, 30) || '", kolom %1$s' as lokasi
          from public.item_options o join public.items i on i.id = o.item_id
          join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
         where m.course_id = $1$q$, f.column_name)
      when 'learning_objectives' then format($q$
        select lo.id as tid, lo.%1$I as txt,
               'Tujuan ' || lo.code || ', kolom %1$s' as lokasi
          from public.learning_objectives lo join public.lessons l on l.id = lo.lesson_id
          join public.modules m on m.id = l.module_id where m.course_id = $1$q$, f.column_name)
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

create or replace function public.ingest_structured_package(p_batch uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare b record; c record; v_course uuid; v_module uuid; v_lesson uuid; n integer := 0;
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null then raise exception 'unknown ingest batch %', p_batch; end if;
  if not public.can_in_institution('CAN_DRAFT', b.institution_id) then
    raise exception 'materialising an ingest batch requires CAN_DRAFT in the owning institution';
  end if;
  if b.status <> 'CONFIRMED' then
    raise exception 'this batch is %, and nothing is materialised before CONFIRMED', b.status;
  end if;
  for c in select * from jsonb_to_recordset(coalesce(b.raw_payload -> 'courses', '[]'::jsonb))
      as x(subject text, stage text, grade_label text, title text) loop
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
      values (b.institution_id, c.subject, c.stage, c.grade_label, c.title, b.confirmed_by_person_id)
      returning id into v_course;
    n := n + 1;
  end loop;
  update public.ingest_batches set status = 'MATERIALISED' where id = p_batch;
  return n;
end $$;

create or replace function public.propose_easy_upload_mapping(p_batch uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare b record; v_files jsonb; v_map jsonb; v_questions jsonb := '[]'::jsonb; v_conf numeric;
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null then raise exception 'unknown ingest batch %', p_batch; end if;
  if not public.can_in_institution('CAN_DRAFT', b.institution_id) then
    raise exception 'proposing an upload mapping requires CAN_DRAFT in the owning institution';
  end if;
  v_files := coalesce(b.raw_payload -> 'files', '[]'::jsonb);

  select jsonb_agg(jsonb_build_object(
           'path', f ->> 'path',
           'inferred_role', case
             when (f ->> 'path') ~* '\.(png|jpe?g|webp|svg)$' then 'LESSON_MEDIA_IMAGE'
             when (f ->> 'path') ~* '\.(mp3|wav|m4a)$'        then 'LESSON_MEDIA_AUDIO'
             when (f ->> 'path') ~* '\.(mp4|mov|webm)$'       then 'LESSON_MEDIA_VIDEO'
             when (f ->> 'path') ~* '\.(md|markdown|txt)$'    then 'LESSON_BODY'
             when (f ->> 'path') ~* '\.(csv|tsv|xlsx)$'       then 'ITEM_TABLE'
             else 'UNRECOGNISED' end))
    into v_map from jsonb_array_elements(v_files) f;
  v_map := coalesce(v_map, '[]'::jsonb);

  -- every unrecognised file, and every audio or video without a sibling
  -- transcript, is a question for a human rather than a guess
  select coalesce(jsonb_agg(q), '[]'::jsonb) into v_questions from (
    select jsonb_build_object('path', e ->> 'path', 'question',
             case when (e ->> 'inferred_role') = 'UNRECOGNISED'
                  then 'Berkas ini belum dikenali. Apa perannya dalam pelajaran?'
                  else 'Berkas audio/video memerlukan transkrip. Mana transkripnya?' end) q
      from jsonb_array_elements(v_map) e
     where (e ->> 'inferred_role') in ('UNRECOGNISED','LESSON_MEDIA_AUDIO','LESSON_MEDIA_VIDEO')) x;

  select case when jsonb_array_length(v_map) = 0 then 0
              else round((jsonb_array_length(v_map) - jsonb_array_length(v_questions))::numeric
                         / jsonb_array_length(v_map), 3) end into v_conf;

  update public.ingest_batches
     set inferred_mapping = v_map, mapping_confidence = v_conf, open_questions = v_questions,
         status = case when status = 'RECEIVED' then 'MAPPING_PROPOSED' else status end
   where id = p_batch;
  return jsonb_build_object('mapping', v_map, 'confidence', v_conf, 'open_questions', v_questions);
end $$;

-- ADR-0021: `create or replace` keeps the privileges these functions already
-- carried; they are restated so the grant surface is legible in the migration
-- that last touched the body.
revoke all on function public.validate_course_content(uuid) from public, anon, authenticated;
revoke all on function public.run_mcq_quality(uuid) from public, anon, authenticated;
revoke all on function public.ingest_structured_package(uuid) from public, anon, authenticated;
revoke all on function public.propose_easy_upload_mapping(uuid) from public, anon, authenticated;
grant execute on function public.validate_course_content(uuid) to authenticated;
grant execute on function public.run_mcq_quality(uuid) to authenticated;
grant execute on function public.ingest_structured_package(uuid) to authenticated;
grant execute on function public.propose_easy_upload_mapping(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). Every row is built here and rolled back;
-- nothing below assumes a seeded persona, a seeded course or a seeded batch.
--
-- The claim is not "an exception was raised". It is: the DEAN is refused BY THE
-- CAPABILITY, the refusal happens BEFORE the delete each of these opens with,
-- and an actor that does hold CAN_DRAFT still gets the behaviour it had before.
-- ---------------------------------------------------------------------------
do $$
declare
  v_inst uuid; v_course uuid;
  v_batch uuid; v_uid_draft uuid; v_uid_dean uuid; v_p_draft uuid; v_p_dean uuid;
  n int; v_raised boolean; v_msg text; v_fn text;
begin
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe inst 0085', 'probe-inst-0085', true, true) returning id into v_inst;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0085-draft@local.invalid')
    returning id into v_uid_draft;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0085-dean@local.invalid')
    returning id into v_uid_dean;
    select a.person_id into v_p_draft from public.accounts a where a.auth_user_id = v_uid_draft;
    select a.person_id into v_p_dean  from public.accounts a where a.auth_user_id = v_uid_dean;

    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_p_draft, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days'),
           (v_p_dean,  'DEAN',              v_inst, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    -- the objects the four endpoints take as their argument
    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_inst, 'Probe', 'SD', '5', 'Probe course 0085') returning id into v_course;
    -- the batch is created by the actor that holds CAN_DRAFT, because its own
    -- INSERT trigger already requires it, and walked to CONFIRMED through the
    -- declared transitions. That guard is what stops a stranger MAKING a batch;
    -- it says nothing about who may materialise one that already exists, which
    -- is the hole this migration closes.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_draft, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_draft::text, true);
    insert into public.ingest_batches (institution_id, source_kind, raw_payload, status)
    values (v_inst, 'STRUCTURED_PACKAGE', jsonb_build_object('courses', '[]'::jsonb, 'files', '[]'::jsonb),
            'RECEIVED')
    returning id into v_batch;
    update public.ingest_batches set status = 'CONFIRMED' where id = v_batch;

    -- a finding that must still be there after a refused call: the delete these
    -- endpoints open with is the destructive effect authorization has to precede
    insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
      severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
    values (v_inst, v_course, null, 'PROBE_0085', 'WARNING', 'probe', 'probe', 'probe', 'probe');

    -- ---------------------------------------------------------------- DEAN --
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_dean, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_dean::text, true);

    if public.can_in_institution('CAN_DRAFT', v_inst) then
      raise exception 'the probe DEAN holds CAN_DRAFT; the negative case is not a negative case';
    end if;

    foreach v_fn in array array['run_mcq_quality', 'validate_course_content',
                                'ingest_structured_package', 'propose_easy_upload_mapping'] loop
      v_raised := false;
      begin
        if v_fn in ('run_mcq_quality', 'validate_course_content') then
          execute format('select public.%I($1)', v_fn) using v_course;
        else
          execute format('select public.%I($1)', v_fn) using v_batch;
        end if;
      exception when others then
        v_raised := true; v_msg := sqlerrm;
      end;
      if not v_raised then
        raise exception '% accepted a call from a DEAN holding no capability (INV-19)', v_fn;
      end if;
      if v_msg !~ 'CAN_DRAFT' then
        raise exception '% refused a DEAN, but not by the capability it declares: %', v_fn, v_msg;
      end if;
    end loop;

    -- authorization ran before the delete
    select count(*) into n from public.mcq_quality_findings
     where course_id = v_course and pattern_class = 'PROBE_0085';
    if n <> 1 then
      raise exception 'a refused call still reached the delete: % probe finding(s) survived, expected 1', n;
    end if;

    -- ------------------------------------------------------- CAN_DRAFT ------
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_draft, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_draft::text, true);

    if not public.can_in_institution('CAN_DRAFT', v_inst) then
      raise exception 'the probe author does not hold CAN_DRAFT; the positive case proves nothing';
    end if;

    perform public.run_mcq_quality(v_course);
    perform public.validate_course_content(v_course);
    perform public.propose_easy_upload_mapping(v_batch);
    perform public.ingest_structured_package(v_batch);

    -- and the authorized call did reach the delete, so the guard is a guard and
    -- not a second refusal in front of a path that never ran
    select count(*) into n from public.mcq_quality_findings
     where course_id = v_course and pattern_class = 'PROBE_0085';
    if n <> 0 then
      raise exception 'an authorized MCQ quality pass did not clear the stale probe finding';
    end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug = 'probe-inst-0085';
  if n <> 0 then raise exception 'the probe left its institution behind'; end if;

  -- structural: each of the four now names the capability in its own body
  foreach v_fn in array array['run_mcq_quality', 'validate_course_content',
                              'ingest_structured_package', 'propose_easy_upload_mapping'] loop
    if (select prosrc from pg_proc where proname = v_fn and pronamespace = 'public'::regnamespace)
         !~ 'can_in_institution' then
      raise exception '% does not call can_in_institution', v_fn;
    end if;
  end loop;

  raise notice '0085 verified: four authoring RPCs refuse a capability-less actor before they mutate';
end $$;

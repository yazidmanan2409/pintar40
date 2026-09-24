-- ---------------------------------------------------------------------------
-- BOB-02 — A LESSON ARRIVES WHOLE (D-007, D-008, audit B2 and M8).
--
-- Nothing a school uploaded could become a lesson. Three defects, one cause:
-- the import stopped at the course row.
--
--   * ingest_structured_package created `courses` and nothing else -- no
--     chapter, lesson, question or option -- so even a perfect package made
--     an empty course.
--   * "Paket Terstruktur" materialised a batch that was still RECEIVED, which
--     the function refuses ("nothing is materialised before CONFIRMED"), and
--     nothing ever confirmed a structured batch.
--   * "Unggah Mudah" confirmed by writing status 'MAPPED', which is not an
--     ingest_status at all.
--
-- ONE PACKAGE FORMAT, ONE MATERIALISER. The structured package JSON that
-- already existed (courses[] with subject, stage, grade_label, title,
-- learning_context) gains an optional hierarchy under each course:
--
--   courses[] { title, subject, stage, grade_label, learning_context? (or the
--               workbook's konteks label),
--     modules[] { ordinal?, title,                               -- Bab
--       lessons[] { ordinal?, title, summary?, body_markdown,    -- Pelajaran
--                   objective? { statement, bloom? },
--                   media[] { file, transcript? },
--         items[] { ref?, item_type?, stem, stimulus?, petunjuk?, -- Soal
--                   use?  PRE_TEST | POST_TEST,                  -- D-008
--                   difficulty? 0..1, parallel_group? (a label),
--           options[] { label, body, is_correct, rationale,      -- Pilihan
--                       misconception_code? } } } } }
--
-- Any object may carry "_row": {"sheet": "...", "row": n}; a problem found in
-- it names that row, which is how the workbook parser's rows come back to the
-- administrator. The Excel workbook (D-007) is parsed on the server into
-- exactly this JSON, so the workbook, "Unggah Mudah" and "Paket Terstruktur"
-- all arrive through the same three steps:
--
--   1. a batch is inserted at RECEIVED (the existing table write, CAN_DRAFT);
--   2. prepare_ingest_batch(p_batch) checks the whole package and answers
--      { ok, problems[], media[], counts } -- every problem a stable code with
--      its sheet, row and field (D-011), never database text -- and moves the
--      batch to MAPPING_PROPOSED with one pending confirmation;
--   3. confirm_ingest_batch(p_batch), a human act, checks it again (including
--      that every media file was uploaded), confirms it (the batch records
--      who), and materialises course → modules → lessons → objectives →
--      items → options in one transaction, answering { ok, courses[] }.
--
-- D-008: a question marked "Pemetaan awal" or "Cek penguasaan" is stored with
-- items.cycle_role PRE_TEST or POST_TEST (new, nullable), which is what BOB-04
-- draws the pre-test and post-test from. Tagged questions are bank TEST,
-- untagged ones PRACTICE.
--
-- MEDIA go to storage under pelajaran/<school>/<batch>/<file>, a path the
-- student read route accepts and may_read_lesson_media matches exactly. The
-- upload route signs that path only while the batch awaits confirmation and
-- only for a file the package names (may_upload_package_media).
--
-- M8: a package is refused for the platform's canonical library tenant
-- (PACKAGE_SCHOOL_NOT_ALLOWED); it becomes a course of the school chosen.
--
-- REFUSALS of the call itself are SQLSTATE PR030 with the stable code in
-- DETAIL: PACKAGE_NOT_ALLOWED (no CAN_DRAFT in the batch's school, or no such
-- batch), PACKAGE_STATE_INVALID (already confirmed, materialised or
-- rejected), PACKAGE_SCHOOL_NOT_ALLOWED.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. D-008: WHICH ASSESSMENT A QUESTION IS FOR
-- ---------------------------------------------------------------------------
alter table public.items
  add column cycle_role public.assessment_mode
    constraint items_cycle_role_pre_or_post check (cycle_role is null or cycle_role in ('PRE_TEST', 'POST_TEST'));
comment on column public.items.cycle_role is
  'D-008: PRE_TEST for a question the workbook marks "Pemetaan awal", POST_TEST for "Cek penguasaan", '
  'null for practice. BOB-04 draws the cycle''s two assessments from it. Never shown to a learner.';

-- ---------------------------------------------------------------------------
-- 2. INTERNAL HELPERS (not client-callable)
-- ---------------------------------------------------------------------------
create function public.package_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR030',
    detail  = p_code,
    message = case p_code
      when 'PACKAGE_NOT_ALLOWED'       then 'preparing or confirming a lesson package requires CAN_DRAFT in the owning institution'
      when 'PACKAGE_STATE_INVALID'     then 'this package has already been confirmed, materialised or rejected'
      when 'PACKAGE_SCHOOL_NOT_ALLOWED' then 'a lesson package becomes a course of a school, not of the platform library'
      else 'the lesson package could not be processed' end;
end $$;
revoke all on function public.package_refuse(text) from public, anon, authenticated;

-- A media file name as it is stored: lower case, spaces as dashes, nothing a
-- storage path cannot carry. Null when nothing sensible remains.
create function public.package_media_name(p_file text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select nullif(btrim(regexp_replace(regexp_replace(lower(btrim(coalesce(p_file, ''))), '\s+', '-', 'g'),
                                     '[^a-z0-9_.-]', '', 'g'), '.-'), '')
$$;
revoke all on function public.package_media_name(text) from public, anon, authenticated;

create function public.package_media_kind(p_name text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select case
    when p_name ~ '\.(png|jpe?g|webp|svg|gif)$' then 'gambar'
    when p_name ~ '\.(mp3|m4a|wav|ogg)$'       then 'audio'
    when p_name ~ '\.(mp4|webm)$'               then 'video'
    when p_name ~ '\.pdf$'                      then 'pdf'
    else null end
$$;
revoke all on function public.package_media_kind(text) from public, anon, authenticated;

-- A course's learning context: the machine key, or the workbook's own label
-- ("Akademik", "Pengembangan profesi"). The screens never name the backend's
-- vocabulary (UX1-AJAR-KONTEKS-01), so the label is translated here. Null for
-- neither, or for a value that is not one.
create function public.package_context(p_course jsonb)
returns public.learning_context language sql immutable set search_path = public, pg_temp as $$
  select coalesce(
    (select e from unnest(enum_range(null::public.learning_context)) e
      where e::text = nullif(btrim(p_course ->> 'learning_context'), '')),
    case lower(btrim(coalesce(p_course ->> 'konteks', '')))
      when 'akademik' then 'ACADEMIC'::public.learning_context
      when 'pengembangan profesi' then 'PROFESSIONAL_DEVELOPMENT'::public.learning_context end)
$$;
revoke all on function public.package_context(jsonb) from public, anon, authenticated;

-- One problem, located. The object's own "_row" names the sheet and row it
-- came from; the path names it in the JSON for a machine producer.
create function public.package_problem(p_code text, p_obj jsonb, p_path text, p_field text)
returns jsonb language sql immutable set search_path = public, pg_temp as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'code', p_code,
    'sheet', p_obj -> '_row' ->> 'sheet',
    'row', case when (p_obj -> '_row' ->> 'row') ~ '^[0-9]+$' then (p_obj -> '_row' ->> 'row')::int end,
    'field', p_field,
    'path', p_path))
$$;
revoke all on function public.package_problem(text, jsonb, text, text) from public, anon, authenticated;

create function public.package_text(p jsonb, p_key text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select nullif(btrim(case when jsonb_typeof(p -> p_key) in ('string', 'number') then p ->> p_key end), '')
$$;
revoke all on function public.package_text(jsonb, text) from public, anon, authenticated;

create function public.package_array(p jsonb, p_key text)
returns jsonb language sql immutable set search_path = public, pg_temp as $$
  select case when jsonb_typeof(p -> p_key) = 'array' then p -> p_key else '[]'::jsonb end
$$;
revoke all on function public.package_array(jsonb, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. THE CHECK. Everything the materialiser needs to be true, found before a
--    single row is written, each finding a stable code at its sheet and row.
--    Returns { problems[], media[], counts }. p_batch (may be null) is only
--    used to compute media storage paths.
-- ---------------------------------------------------------------------------
create function public.lesson_package_check(p_institution uuid, p_package jsonb, p_batch uuid)
returns jsonb language plpgsql stable set search_path = public, pg_temp as $$
declare
  v_p jsonb := '[]'::jsonb; v_media jsonb := '[]'::jsonb;
  c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  ci int; mi int; li int; ii int; oi int; di int;
  n_c int := 0; n_m int := 0; n_l int := 0; n_i int := 0; n_o int := 0;
  v_path text; v_t text; v_ord text; v_kind text; v_name text; v_n int; v_correct int;
  v_mords text[]; v_lords text[]; v_refs text[]; v_labels text[]; v_names text[];
  v_groups jsonb; v_type text; v_use text;
begin
  if jsonb_typeof(p_package) is distinct from 'object' or jsonb_typeof(p_package -> 'courses') is distinct from 'array'
     or jsonb_array_length(p_package -> 'courses') = 0 then
    return jsonb_build_object('problems', jsonb_build_array(public.package_problem('PACKAGE_EMPTY', null, 'courses', null)),
                              'media', '[]'::jsonb, 'counts', '{}'::jsonb);
  end if;
  if jsonb_array_length(p_package -> 'courses') > 20 then
    v_p := v_p || public.package_problem('PACKAGE_TOO_LARGE', null, 'courses', null);
  end if;

  ci := 0;
  for c in select * from jsonb_array_elements(p_package -> 'courses') loop
    v_path := format('courses[%s]', ci); ci := ci + 1; n_c := n_c + 1;
    if jsonb_typeof(c) is distinct from 'object' then
      v_p := v_p || public.package_problem('PACKAGE_SHAPE_INVALID', null, v_path, null); continue;
    end if;
    if public.package_text(c, 'title') is null then v_p := v_p || public.package_problem('COURSE_TITLE_MISSING', c, v_path, 'title'); end if;
    if public.package_text(c, 'subject') is null then v_p := v_p || public.package_problem('COURSE_SUBJECT_MISSING', c, v_path, 'subject'); end if;
    if public.package_text(c, 'stage') is null then v_p := v_p || public.package_problem('COURSE_STAGE_MISSING', c, v_path, 'stage'); end if;
    if public.package_text(c, 'grade_label') is null then v_p := v_p || public.package_problem('COURSE_GRADE_MISSING', c, v_path, 'grade_label'); end if;
    foreach v_t in array array['title', 'subject', 'stage', 'grade_label'] loop
      if length(coalesce(public.package_text(c, v_t), '')) > 200 then
        v_p := v_p || public.package_problem('TEXT_TOO_LONG', c, v_path, v_t);
      end if;
    end loop;
    v_t := public.package_text(c, 'learning_context');
    if v_t is not null and not exists (select 1 from unnest(enum_range(null::public.learning_context)) e where e::text = v_t) then
      v_p := v_p || public.package_problem('COURSE_CONTEXT_UNKNOWN', c, v_path, 'learning_context');
    end if;
    if public.package_text(c, 'konteks') is not null and public.package_context(c) is null then
      v_p := v_p || public.package_problem('COURSE_CONTEXT_UNKNOWN', c, v_path, 'konteks');
    end if;

    v_mords := '{}'; v_refs := '{}'; v_groups := '{}'::jsonb;
    mi := 0;
    for m in select * from jsonb_array_elements(public.package_array(c, 'modules')) loop
      v_path := format('courses[%s].modules[%s]', ci - 1, mi); mi := mi + 1; n_m := n_m + 1;
      if jsonb_typeof(m) is distinct from 'object' then
        v_p := v_p || public.package_problem('PACKAGE_SHAPE_INVALID', null, v_path, null); continue;
      end if;
      v_ord := coalesce(public.package_text(m, 'ordinal'), mi::text);
      if v_ord !~ '^[0-9]{1,3}$' or v_ord::int < 1 then
        v_p := v_p || public.package_problem('MODULE_NUMBER_INVALID', m, v_path, 'ordinal');
      elsif v_ord::int::text = any (v_mords) then
        v_p := v_p || public.package_problem('MODULE_NUMBER_REPEATED', m, v_path, 'ordinal');
      else v_mords := v_mords || v_ord::int::text; end if;
      if public.package_text(m, 'title') is null then v_p := v_p || public.package_problem('MODULE_TITLE_MISSING', m, v_path, 'title');
      elsif length(public.package_text(m, 'title')) > 200 then v_p := v_p || public.package_problem('TEXT_TOO_LONG', m, v_path, 'title'); end if;

      v_lords := '{}';
      li := 0;
      for l in select * from jsonb_array_elements(public.package_array(m, 'lessons')) loop
        v_path := format('courses[%s].modules[%s].lessons[%s]', ci - 1, mi - 1, li); li := li + 1; n_l := n_l + 1;
        if jsonb_typeof(l) is distinct from 'object' then
          v_p := v_p || public.package_problem('PACKAGE_SHAPE_INVALID', null, v_path, null); continue;
        end if;
        v_ord := coalesce(public.package_text(l, 'ordinal'), li::text);
        if v_ord !~ '^[0-9]{1,3}$' or v_ord::int < 1 then
          v_p := v_p || public.package_problem('LESSON_NUMBER_INVALID', l, v_path, 'ordinal');
        elsif v_ord::int::text = any (v_lords) then
          v_p := v_p || public.package_problem('LESSON_NUMBER_REPEATED', l, v_path, 'ordinal');
        else v_lords := v_lords || v_ord::int::text; end if;
        if public.package_text(l, 'title') is null then v_p := v_p || public.package_problem('LESSON_TITLE_MISSING', l, v_path, 'title');
        elsif length(public.package_text(l, 'title')) > 200 then v_p := v_p || public.package_problem('TEXT_TOO_LONG', l, v_path, 'title'); end if;
        if public.package_text(l, 'body_markdown') is null then
          v_p := v_p || public.package_problem('LESSON_TEXT_MISSING', l, v_path, 'body_markdown');
        elsif length(public.package_text(l, 'body_markdown')) > 50000 then
          v_p := v_p || public.package_problem('TEXT_TOO_LONG', l, v_path, 'body_markdown');
        end if;
        if length(coalesce(public.package_text(l, 'summary'), '')) > 1000 then
          v_p := v_p || public.package_problem('TEXT_TOO_LONG', l, v_path, 'summary');
        end if;
        if jsonb_typeof(l -> 'objective') = 'object' then
          if public.package_text(l -> 'objective', 'statement') is null then
            v_p := v_p || public.package_problem('OBJECTIVE_STATEMENT_MISSING', l, v_path, 'objective');
          end if;
          v_t := public.package_text(l -> 'objective', 'bloom');
          if v_t is not null and not exists (select 1 from unnest(enum_range(null::public.bloom_level)) e where e::text = v_t) then
            v_p := v_p || public.package_problem('OBJECTIVE_THINKING_UNKNOWN', l, v_path, 'objective.bloom');
          end if;
        end if;

        -- media: a file the package names, and a transcript for sound or film
        v_names := '{}';
        di := 0;
        for md in select * from jsonb_array_elements(public.package_array(l, 'media')) loop
          di := di + 1;
          v_name := public.package_media_name(public.package_text(md, 'file'));
          v_kind := public.package_media_kind(coalesce(v_name, ''));
          if v_name is null or length(v_name) > 110 or v_name !~ '^[a-z0-9][a-z0-9_.-]*$' then
            v_p := v_p || public.package_problem('MEDIA_NAME_INVALID', l, v_path || format('.media[%s]', di - 1), 'media');
          elsif v_kind is null then
            v_p := v_p || public.package_problem('MEDIA_KIND_UNKNOWN', l, v_path || format('.media[%s]', di - 1), 'media');
          elsif v_name = any (v_names) then
            v_p := v_p || public.package_problem('MEDIA_NAME_CLASH', l, v_path || format('.media[%s]', di - 1), 'media');
          else
            v_names := v_names || v_name;
            if v_kind in ('audio', 'video') and public.package_text(md, 'transcript') is null then
              v_p := v_p || public.package_problem('MEDIA_TRANSCRIPT_MISSING', l, v_path || format('.media[%s]', di - 1), 'media');
            end if;
            if not exists (select 1 from jsonb_array_elements(v_media) x where x ->> 'name' = v_name) then
              v_media := v_media || jsonb_build_object(
                'file', public.package_text(md, 'file'), 'name', v_name, 'kind', v_kind,
                'path', case when p_batch is null then null
                             else format('pelajaran/%s/%s/%s', p_institution, p_batch, v_name) end);
            elsif (select x ->> 'file' from jsonb_array_elements(v_media) x where x ->> 'name' = v_name limit 1)
                  is distinct from public.package_text(md, 'file') then
              -- two different files that become one stored name
              v_p := v_p || public.package_problem('MEDIA_NAME_CLASH', l, v_path || format('.media[%s]', di - 1), 'media');
            end if;
          end if;
        end loop;

        ii := 0;
        for i in select * from jsonb_array_elements(public.package_array(l, 'items')) loop
          v_path := format('courses[%s].modules[%s].lessons[%s].items[%s]', ci - 1, mi - 1, li - 1, ii); ii := ii + 1; n_i := n_i + 1;
          if jsonb_typeof(i) is distinct from 'object' then
            v_p := v_p || public.package_problem('PACKAGE_SHAPE_INVALID', null, v_path, null); continue;
          end if;
          v_t := public.package_text(i, 'ref');
          if v_t is not null then
            if lower(v_t) = any (v_refs) then v_p := v_p || public.package_problem('ITEM_REF_REPEATED', i, v_path, 'ref');
            else v_refs := v_refs || lower(v_t); end if;
          end if;
          v_type := coalesce(public.package_text(i, 'item_type'), 'MCQ_SINGLE');
          if v_type not in ('MCQ_SINGLE', 'MCQ_MULTI') then
            v_p := v_p || public.package_problem('ITEM_TYPE_UNKNOWN', i, v_path, 'item_type');
          end if;
          if public.package_text(i, 'stem') is null then v_p := v_p || public.package_problem('ITEM_QUESTION_MISSING', i, v_path, 'stem');
          elsif length(public.package_text(i, 'stem')) > 4000 then v_p := v_p || public.package_problem('TEXT_TOO_LONG', i, v_path, 'stem'); end if;
          if length(coalesce(public.package_text(i, 'stimulus'), '')) > 20000 then
            v_p := v_p || public.package_problem('TEXT_TOO_LONG', i, v_path, 'stimulus');
          end if;
          if public.hint_reveals_answer_shape(public.package_text(i, 'petunjuk')) then
            v_p := v_p || public.package_problem('ITEM_HINT_REVEALS_ANSWER', i, v_path, 'petunjuk');
          end if;
          v_use := public.package_text(i, 'use');
          if v_use is not null and v_use not in ('PRE_TEST', 'POST_TEST') then
            v_p := v_p || public.package_problem('ITEM_USE_UNKNOWN', i, v_path, 'use');
          end if;
          v_t := public.package_text(i, 'difficulty');
          if v_t is not null and (v_t !~ '^(0(\.[0-9]{1,3})?|1(\.0{1,3})?)$') then
            v_p := v_p || public.package_problem('ITEM_DIFFICULTY_INVALID', i, v_path, 'difficulty');
          end if;
          -- a parallel group is one tier: practice and assessment questions do not mix
          v_t := public.package_text(i, 'parallel_group');
          if v_t is not null then
            if length(v_t) > 60 then v_p := v_p || public.package_problem('TEXT_TOO_LONG', i, v_path, 'parallel_group');
            elsif v_groups ? lower(v_t) and (v_groups ->> lower(v_t)) is distinct from (v_use is not null)::text then
              v_p := v_p || public.package_problem('ITEM_PARALLEL_TIER_MIXED', i, v_path, 'parallel_group');
            else v_groups := v_groups || jsonb_build_object(lower(v_t), (v_use is not null)::text); end if;
          end if;

          v_n := jsonb_array_length(public.package_array(i, 'options'));
          if v_n < 2 then v_p := v_p || public.package_problem('ITEM_OPTIONS_TOO_FEW', i, v_path, 'options');
          elsif v_n > 5 then v_p := v_p || public.package_problem('ITEM_OPTIONS_TOO_MANY', i, v_path, 'options'); end if;
          v_correct := 0; v_labels := '{}';
          oi := 0;
          for o in select * from jsonb_array_elements(public.package_array(i, 'options')) loop
            v_path := format('courses[%s].modules[%s].lessons[%s].items[%s].options[%s]', ci - 1, mi - 1, li - 1, ii - 1, oi); oi := oi + 1; n_o := n_o + 1;
            if jsonb_typeof(o) is distinct from 'object' then
              v_p := v_p || public.package_problem('PACKAGE_SHAPE_INVALID', null, v_path, null); continue;
            end if;
            v_t := upper(coalesce(public.package_text(o, 'label'), ''));
            if v_t !~ '^[A-E]$' then v_p := v_p || public.package_problem('OPTION_LABEL_INVALID', o, v_path, 'label');
            elsif v_t = any (v_labels) then v_p := v_p || public.package_problem('OPTION_LABEL_REPEATED', o, v_path, 'label');
            else v_labels := v_labels || v_t; end if;
            if public.package_text(o, 'body') is null then v_p := v_p || public.package_problem('OPTION_TEXT_MISSING', o, v_path, 'body');
            elsif length(public.package_text(o, 'body')) > 2000 then v_p := v_p || public.package_problem('TEXT_TOO_LONG', o, v_path, 'body'); end if;
            if public.package_text(o, 'rationale') is null then v_p := v_p || public.package_problem('OPTION_REASON_MISSING', o, v_path, 'rationale');
            elsif length(public.package_text(o, 'rationale')) > 2000 then v_p := v_p || public.package_problem('TEXT_TOO_LONG', o, v_path, 'rationale'); end if;
            if jsonb_typeof(o -> 'is_correct') = 'boolean' then
              if (o ->> 'is_correct')::boolean then v_correct := v_correct + 1; end if;
            elsif o ? 'is_correct' and jsonb_typeof(o -> 'is_correct') <> 'null' then
              v_p := v_p || public.package_problem('OPTION_CORRECT_INVALID', o, v_path, 'is_correct');
            end if;
            v_t := public.package_text(o, 'misconception_code');
            if v_t is not null and not exists (select 1 from public.misconception_taxonomy mt where mt.code = v_t) then
              v_p := v_p || public.package_problem('OPTION_MISCONCEPTION_UNKNOWN', o, v_path, 'misconception_code');
            end if;
          end loop;
          v_path := format('courses[%s].modules[%s].lessons[%s].items[%s]', ci - 1, mi - 1, li - 1, ii - 1);
          if v_n >= 2 and v_correct = 0 then
            v_p := v_p || public.package_problem('ITEM_CORRECT_MISSING', i, v_path, 'options');
          elsif v_type = 'MCQ_SINGLE' and v_correct > 1 then
            v_p := v_p || public.package_problem('ITEM_CORRECT_TOO_MANY', i, v_path, 'options');
          end if;
        end loop;
      end loop;
    end loop;
  end loop;

  if n_i > 2000 or n_l > 500 then
    v_p := v_p || public.package_problem('PACKAGE_TOO_LARGE', null, 'courses', null);
  end if;
  return jsonb_build_object('problems', v_p, 'media', v_media,
    'counts', jsonb_build_object('courses', n_c, 'modules', n_m, 'lessons', n_l, 'items', n_i,
                                 'options', n_o, 'media', jsonb_array_length(v_media)));
end $$;
revoke all on function public.lesson_package_check(uuid, jsonb, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. THE MATERIALISER. Runs only on a package the check passed; everything is
--    written at INGESTED, authored by the confirming person, in the batch's
--    school. Returns the new course ids in package order.
-- ---------------------------------------------------------------------------
create function public.lesson_package_materialise(p_batch uuid)
returns uuid[] language plpgsql set search_path = public, pg_temp as $$
declare
  b public.ingest_batches; c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  mi int; li int; v_course uuid; v_module uuid; v_lesson uuid; v_item uuid; v_obj uuid;
  v_courses uuid[] := '{}'; v_media jsonb; v_name text; v_groups jsonb; v_group uuid; v_g text; v_use text;
begin
  select * into b from public.ingest_batches where id = p_batch;
  for c in select * from jsonb_array_elements(b.raw_payload -> 'courses') loop
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id, learning_context)
    values (b.institution_id, public.package_text(c, 'subject'), public.package_text(c, 'stage'),
            public.package_text(c, 'grade_label'), public.package_text(c, 'title'), b.confirmed_by_person_id,
            coalesce(public.package_context(c), 'ACADEMIC'::public.learning_context))
    returning id into v_course;
    v_courses := v_courses || v_course;
    v_groups := '{}'::jsonb;
    mi := 0;
    for m in select * from jsonb_array_elements(public.package_array(c, 'modules')) loop
      mi := mi + 1;
      insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
      values (v_course, b.institution_id, coalesce(public.package_text(m, 'ordinal'), mi::text)::smallint,
              public.package_text(m, 'title'), b.confirmed_by_person_id)
      returning id into v_module;
      li := 0;
      for l in select * from jsonb_array_elements(public.package_array(m, 'lessons')) loop
        li := li + 1;
        select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'jenis', public.package_media_kind(public.package_media_name(public.package_text(x, 'file'))),
                 'path', format('pelajaran/%s/%s/%s', b.institution_id, b.id, public.package_media_name(public.package_text(x, 'file'))),
                 'nama', public.package_text(x, 'file'),
                 'transcript', public.package_text(x, 'transcript')))), '[]'::jsonb)
          into v_media from jsonb_array_elements(public.package_array(l, 'media')) x;
        insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown, media, author_person_id)
        values (v_module, b.institution_id, coalesce(public.package_text(l, 'ordinal'), li::text)::smallint,
                public.package_text(l, 'title'), public.package_text(l, 'summary'),
                public.package_text(l, 'body_markdown'), v_media, b.confirmed_by_person_id)
        returning id into v_lesson;
        v_obj := null;
        if jsonb_typeof(l -> 'objective') = 'object' then
          insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
          values (v_lesson, b.institution_id, format('B%sP%s', mi, li),
                  public.package_text(l -> 'objective', 'statement'),
                  coalesce(public.package_text(l -> 'objective', 'bloom'), 'UNDERSTAND')::public.bloom_level, true)
          returning id into v_obj;
        end if;
        for i in select * from jsonb_array_elements(public.package_array(l, 'items')) loop
          v_use := public.package_text(i, 'use');
          v_g := lower(public.package_text(i, 'parallel_group'));
          v_group := null;
          if v_g is not null then
            if not (v_groups ? v_g) then v_groups := v_groups || jsonb_build_object(v_g, gen_random_uuid()); end if;
            v_group := (v_groups ->> v_g)::uuid;
          end if;
          insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, stimulus, petunjuk,
                                    objective_ids, parallel_group, predicted_difficulty, cycle_role, author_person_id)
          values (v_lesson, b.institution_id,
                  coalesce(public.package_text(i, 'item_type'), 'MCQ_SINGLE')::public.item_type,
                  case when v_use is null then 'PRACTICE' else 'TEST' end::public.bank_type,
                  public.package_text(i, 'stem'), public.package_text(i, 'stimulus'), public.package_text(i, 'petunjuk'),
                  case when v_obj is null then '{}'::uuid[] else array[v_obj] end, v_group,
                  public.package_text(i, 'difficulty')::numeric, v_use::public.assessment_mode, b.confirmed_by_person_id)
          returning id into v_item;
          for o in select * from jsonb_array_elements(public.package_array(i, 'options')) loop
            insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
            values (v_item, b.institution_id, upper(public.package_text(o, 'label')), public.package_text(o, 'body'),
                    coalesce((o ->> 'is_correct')::boolean, false), public.package_text(o, 'rationale'),
                    public.package_text(o, 'misconception_code'));
          end loop;
        end loop;
      end loop;
    end loop;
  end loop;
  return v_courses;
end $$;
revoke all on function public.lesson_package_materialise(uuid) from public, anon, authenticated;

-- The batch a package call acts on, once the caller may draft in its school.
create function public.package_batch(p_batch uuid)
returns public.ingest_batches language plpgsql stable set search_path = public, pg_temp as $$
declare b public.ingest_batches;
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null or not public.can_in_institution('CAN_DRAFT', b.institution_id) then
    perform public.package_refuse('PACKAGE_NOT_ALLOWED');
  end if;
  if exists (select 1 from public.institutions x where x.id = b.institution_id and x.tenant_kind = 'PLATFORM_CANONICAL') then
    perform public.package_refuse('PACKAGE_SCHOOL_NOT_ALLOWED');
  end if;
  return b;
end $$;
revoke all on function public.package_batch(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. PREPARE — check the package, name the media paths, await a human.
-- ---------------------------------------------------------------------------
create function public.prepare_ingest_batch(p_batch uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b public.ingest_batches; v jsonb; v_ok boolean;
begin
  b := public.package_batch(p_batch);
  if b.status not in ('RECEIVED', 'MAPPING_PROPOSED') then perform public.package_refuse('PACKAGE_STATE_INVALID'); end if;
  v := public.lesson_package_check(b.institution_id, b.raw_payload, b.id);
  v_ok := jsonb_array_length(v -> 'problems') = 0;
  update public.ingest_batches
     set validation_result = v || jsonb_build_object('ok', v_ok, 'checked_at', now()),
         inferred_mapping = v -> 'media',
         mapping_confidence = case when v_ok then 1 else 0 end,
         -- one pending confirmation: a person looks at the counts and confirms
         open_questions = case when v_ok then jsonb_build_array(jsonb_build_object(
                            'code', 'PACKAGE_CONFIRM', 'counts', v -> 'counts')) else '[]'::jsonb end,
         status = case when status = 'RECEIVED' then 'MAPPING_PROPOSED'::public.ingest_status else status end
   where ingest_batches.id = b.id;
  perform public.audit_write('ingest.prepared', 'ingest_batches', b.id::text, b.institution_id,
    jsonb_build_object('ok', v_ok, 'problems', jsonb_array_length(v -> 'problems'), 'counts', v -> 'counts'));
  return jsonb_build_object('ok', v_ok, 'batch', b.id, 'problems', v -> 'problems',
                            'media', v -> 'media', 'counts', v -> 'counts');
end $$;
revoke all on function public.prepare_ingest_batch(uuid) from public, anon, authenticated;
grant execute on function public.prepare_ingest_batch(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. CONFIRM — the human act. Check again, including that every media file
--    arrived in storage; confirm; materialise; all or nothing.
-- ---------------------------------------------------------------------------
create function public.confirm_ingest_batch(p_batch uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b public.ingest_batches; v jsonb; v_missing jsonb; v_courses uuid[]; v_state text; v_msg text;
begin
  b := public.package_batch(p_batch);
  -- one confirmation at a time per batch: a double click is one course
  perform 1 from public.ingest_batches where ingest_batches.id = b.id for update;
  select * into b from public.ingest_batches where ingest_batches.id = b.id;
  if b.status not in ('RECEIVED', 'MAPPING_PROPOSED') then perform public.package_refuse('PACKAGE_STATE_INVALID'); end if;

  v := public.lesson_package_check(b.institution_id, b.raw_payload, b.id);
  select coalesce(jsonb_agg(jsonb_build_object('code', 'MEDIA_NOT_UPLOADED', 'field', 'media', 'path', x ->> 'path',
                                               'file', x ->> 'file')), '[]'::jsonb)
    into v_missing
    from jsonb_array_elements(v -> 'media') x
   where not exists (select 1 from storage.objects so where so.bucket_id = 'assets' and so.name = x ->> 'path');
  if jsonb_array_length(v -> 'problems') > 0 or jsonb_array_length(v_missing) > 0 then
    return jsonb_build_object('ok', false, 'batch', b.id, 'problems', (v -> 'problems') || v_missing,
                              'media', v -> 'media', 'counts', v -> 'counts');
  end if;

  -- the confirmation and the save are one unit: a failure undoes both, so the
  -- batch is never left CONFIRMED without its course and can be confirmed again
  begin
    update public.ingest_batches set status = 'CONFIRMED' where ingest_batches.id = b.id;
    v_courses := public.lesson_package_materialise(b.id);
  exception when others then
    -- the check should have found it; if it did not, nothing is written, the
    -- batch is back where it was, and the database's words stay in the batch
    get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
    update public.ingest_batches
       set validation_result = validation_result || jsonb_build_object('materialise_error',
             jsonb_build_object('sqlstate', v_state, 'message', left(v_msg, 300)))
     where ingest_batches.id = b.id;
    return jsonb_build_object('ok', false, 'batch', b.id,
      'problems', jsonb_build_array(jsonb_build_object('code', 'PACKAGE_COULD_NOT_BE_SAVED')),
      'media', v -> 'media', 'counts', v -> 'counts');
  end;
  update public.ingest_batches set status = 'MATERIALISED', open_questions = '[]'::jsonb where ingest_batches.id = b.id;
  perform public.audit_write('ingest.materialised', 'ingest_batches', b.id::text, b.institution_id,
    jsonb_build_object('courses', to_jsonb(v_courses), 'counts', v -> 'counts', 'source_kind', b.source_kind));
  return jsonb_build_object('ok', true, 'batch', b.id, 'courses', to_jsonb(v_courses), 'counts', v -> 'counts');
end $$;
revoke all on function public.confirm_ingest_batch(uuid) from public, anon, authenticated;
grant execute on function public.confirm_ingest_batch(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. MEDIA UPLOAD AUTHORITY — for /api/assets/upload-url. A path is signable
--    only while its batch awaits confirmation, by someone who may draft in the
--    batch's school, and only for a file the package names.
-- ---------------------------------------------------------------------------
create function public.may_upload_package_media(p_path text)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare m text[]; b public.ingest_batches;
begin
  m := regexp_match(coalesce(p_path, ''),
         '^pelajaran/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([a-z0-9][a-z0-9_.-]{0,109})$');
  if m is null then return false; end if;
  select * into b from public.ingest_batches where id = m[2]::uuid;
  if b.id is null or b.institution_id <> m[1]::uuid or b.status not in ('RECEIVED', 'MAPPING_PROPOSED') then
    return false;
  end if;
  if not public.can_in_institution('CAN_DRAFT', b.institution_id) then return false; end if;
  return exists (select 1 from jsonb_array_elements(coalesce(b.inferred_mapping, '[]'::jsonb)) x
                  where jsonb_typeof(x) = 'object' and x ->> 'path' = p_path);
end $$;
revoke all on function public.may_upload_package_media(text) from public, anon, authenticated;
grant execute on function public.may_upload_package_media(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. THE EXISTING ENTRY POINT, NOW WHOLE. ingest_structured_package keeps its
--    signature, its refusals and its contract (CONFIRMED in, MATERIALISED
--    out, a course count back) and materialises the full hierarchy through
--    the same check and materialiser. A package the check refuses raises
--    PR030 PACKAGE_INVALID with the first problem's code in the message.
-- ---------------------------------------------------------------------------
create or replace function public.ingest_structured_package(p_batch uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare b record; v jsonb; v_courses uuid[];
begin
  select * into b from public.ingest_batches where id = p_batch;
  if b.id is null then raise exception 'unknown ingest batch %', p_batch; end if;
  if not public.can_in_institution('CAN_DRAFT', b.institution_id) then
    raise exception 'materialising an ingest batch requires CAN_DRAFT in the owning institution';
  end if;
  if b.status <> 'CONFIRMED' then
    raise exception 'this batch is %, and nothing is materialised before CONFIRMED', b.status;
  end if;
  -- an empty package keeps its earlier meaning here: nothing to make, and the
  -- batch is done (F06-N06 relies on it to prove the guard admits a drafter)
  if jsonb_typeof(b.raw_payload -> 'courses') = 'array' and jsonb_array_length(b.raw_payload -> 'courses') = 0 then
    update public.ingest_batches set status = 'MATERIALISED' where id = p_batch;
    return 0;
  end if;
  v := public.lesson_package_check(b.institution_id, b.raw_payload, b.id);
  if jsonb_array_length(v -> 'problems') > 0 then
    raise exception using errcode = 'PR030', detail = 'PACKAGE_INVALID',
      message = format('the package has %s problem(s), the first %s; prepare_ingest_batch names them all',
                       jsonb_array_length(v -> 'problems'), v -> 'problems' -> 0 ->> 'code');
  end if;
  v_courses := public.lesson_package_materialise(b.id);
  update public.ingest_batches set status = 'MATERIALISED' where id = p_batch;
  return coalesce(array_length(v_courses, 1), 0);
end $$;
revoke all on function public.ingest_structured_package(uuid) from public, anon, authenticated;
grant execute on function public.ingest_structured_package(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. THE REGISTRY (L3-F02): declared, with the capability each enforces.
-- ---------------------------------------------------------------------------
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('prepare_ingest_batch', 'STAFF',
   'BOB-02: checks a lesson package (the workbook, Unggah Mudah or Paket Terstruktur) and answers every '
   || 'problem as a stable code at its sheet and row, the media storage paths and the counts; moves the '
   || 'batch to MAPPING_PROPOSED with one pending confirmation. Writes no content. Audited.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('confirm_ingest_batch', 'STAFF',
   'BOB-02: the human confirmation. Re-checks the package and that every media file is in storage, '
   || 'confirms the batch (recording who) and materialises course, modules, lessons, objectives, items '
   || 'and options in one transaction. Audited. Refusals are PR030 with a stable code in DETAIL.',
   'CAPABILITY', 'CAN_DRAFT'),
  ('may_upload_package_media', 'STAFF',
   'BOB-02: whether the caller may be handed a signed upload URL for pelajaran/<school>/<batch>/<file>: '
   || 'the batch awaits confirmation, the caller holds CAN_DRAFT in its school, and the package names the file.',
   'CAPABILITY', 'CAN_DRAFT')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

update public.client_rpc_registry
   set note = 'Materialises a CONFIRMED structured package in full -- course, modules, lessons, objectives, '
           || 'items and options -- through the same check and materialiser as confirm_ingest_batch; CAN_DRAFT.'
 where function_name = 'ingest_structured_package';

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014). Structural everywhere; behavioural off
-- production (a synthetic school cannot exist there). selftest/db/fable11.sql
-- proves it on every run.
-- ---------------------------------------------------------------------------
do $$
declare v_inst uuid; v_uid uuid; v_batch uuid; v jsonb; n int;
begin
  select count(*) into n from public.client_rpc_registry
   where function_name in ('prepare_ingest_batch', 'confirm_ingest_batch', 'may_upload_package_media')
     and exposure = 'STAFF' and authorization_kind = 'CAPABILITY' and authorization_requirement = 'CAN_DRAFT';
  if n <> 3 then raise exception 'BOB-02: % of 3 package functions are declared', n; end if;
  select count(*) into n from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and (p.proname like 'package\_%' or p.proname like 'lesson\_package\_%')
     and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute'));
  if n <> 0 then raise exception 'BOB-02: % internal package helper(s) are client-callable', n; end if;

  if (select environment from public.platform_environment) = 'production' then
    raise notice 'BOB-02: production-marked database; structural check only (behaviour: F11)';
    return;
  end if;

  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe BOB-02 school', 'probe-bob02-school', true, true) returning id into v_inst;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-bob02-adm@local.invalid') returning id into v_uid;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    select a.person_id, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days'
      from public.accounts a where a.auth_user_id = v_uid;
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);

    insert into public.ingest_batches (institution_id, source_kind, raw_payload)
    values (v_inst, 'STRUCTURED_PACKAGE', jsonb_build_object('courses', jsonb_build_array(jsonb_build_object(
      'title', 'Pecahan', 'subject', 'Matematika', 'stage', 'SD', 'grade_label', 'Kelas 4',
      'modules', jsonb_build_array(jsonb_build_object('title', 'Bab 1', 'lessons', jsonb_build_array(jsonb_build_object(
        'title', 'Pecahan senilai', 'body_markdown', 'Dua pecahan senilai menyatakan bagian yang sama.',
        'items', jsonb_build_array(jsonb_build_object('stem', 'Manakah yang senilai dengan 1/2?', 'use', 'PRE_TEST',
          'options', jsonb_build_array(
            jsonb_build_object('label', 'A', 'body', '2/4', 'is_correct', true, 'rationale', 'Dua per empat sama dengan setengah.'),
            jsonb_build_object('label', 'B', 'body', '1/3', 'is_correct', false, 'rationale', 'Sepertiga lebih kecil dari setengah.'))))))))))))
    returning id into v_batch;
    v := public.prepare_ingest_batch(v_batch);
    if (v ->> 'ok')::boolean is not true then raise exception 'BOB-02: a sound package was refused: %', v -> 'problems'; end if;
    v := public.confirm_ingest_batch(v_batch);
    if (v ->> 'ok')::boolean is not true then raise exception 'BOB-02: confirming a sound package failed: %', v -> 'problems'; end if;
    select count(*) into n from public.item_options o join public.items i on i.id = o.item_id
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id = (v -> 'courses' ->> 0)::uuid and i.cycle_role = 'PRE_TEST';
    if n <> 2 then raise exception 'BOB-02: the materialised course holds % option(s) of its pre-test question, expected 2', n; end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'BOB02_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'BOB02_PROBE_UNDO' then
      raise exception 'lesson-package verification failed: %', sqlerrm;
    end if;
  end;
end $$;

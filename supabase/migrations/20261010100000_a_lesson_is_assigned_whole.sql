-- BOB-04 -- A LESSON IS ASSIGNED WHOLE: its pre-test and post-test come with
-- it (D-008, audit B4).
--
-- THE DEAD END. A teacher's "Sediakan" wrote a learning assignment and nothing
-- else: no assessment of the cycle. /belajar/[tugas]/pemetaan found no
-- pre-test and answered 404, so every assigned lesson stopped at its door.
-- Only the seeds ever built a whole cycle, by hand.
--
-- THE SHAPE.
--   1. A lesson package's course gets its PRE_TEST and POST_TEST definitions
--      when it is materialised, from the questions marked "Pemetaan awal" and
--      "Cek penguasaan" (items.cycle_role, BOB-02). They are made BEFORE the
--      course can be sealed, because a definition is taught content: it is
--      part of the release's content hash and cannot be added under a frozen
--      course (INV-04). So they are reviewed with the course and frozen with it.
--   2. The draw follows the marks. Where a definition's questions carry a
--      cycle_role, a PRE_TEST or POST_TEST definition draws only the questions
--      marked for it -- never the other test's, never a practice question.
--      Content without marks (the seeded cycle) draws as it always has.
--   3. assign_release(release, class, from, until) is the one way a release is
--      assigned: the learning assignment and both assessment assignments, open,
--      in one transaction -- or a PR050 refusal naming what is missing. It
--      checks now that both tests can be drawn for every learner, INV-24
--      included: a post-test whose questions all share a parallel group with a
--      pre-test question can never be drawn once the pre-test is taken, and is
--      refused as ASSIGN_CYCLE_OVERLAP instead of failing a learner mid-cycle.
--   4. my_cycle_state refuses a stranger with a code, so the learner pages can
--      render a state instead of an error.
--   5. (D-040) The upload refuses a package whose parallel group holds both a
--      pre-test and a post-test question, naming every such row
--      (ITEM_PARALLEL_CYCLE_MIXED), so the author learns it before a teacher
--      meets ASSIGN_CYCLE_OVERLAP.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. THE MATERIALISER, now making the course's two tests.
-- ---------------------------------------------------------------------------
create or replace function public.lesson_package_materialise(p_batch uuid)
returns uuid[] language plpgsql set search_path = public, pg_temp as $$
declare
  b public.ingest_batches; c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  mi int; li int; v_course uuid; v_module uuid; v_lesson uuid; v_item uuid; v_obj uuid;
  v_courses uuid[] := '{}'; v_media jsonb; v_name text; v_groups jsonb; v_group uuid; v_g text; v_use text;
  v_mode public.assessment_mode; v_n int; v_title text; v_version int;
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
    -- D-008 (BOB-04): the course's pre-test and post-test, made here -- before
    -- the course can be sealed, so they are reviewed with it and frozen with it
    -- -- from the questions marked for each. Every marked question is drawn.
    foreach v_mode in array array['PRE_TEST', 'POST_TEST']::public.assessment_mode[] loop
      select count(*) into v_n from public.items it
        join public.lessons ls on ls.id = it.lesson_id join public.modules ms on ms.id = ls.module_id
       where ms.course_id = v_course and it.cycle_role = v_mode;
      continue when v_n = 0;
      v_title := case v_mode when 'PRE_TEST' then 'Pemetaan awal — ' else 'Cek penguasaan — ' end
                 || public.package_text(c, 'title');
      select coalesce(max(ad.version), 0) + 1 into v_version from public.assessment_definitions ad
       where ad.institution_id = b.institution_id and ad.title = v_title and ad.mode = v_mode;
      insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, version,
        item_count, difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
        shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit, author_person_id)
      values (b.institution_id, v_course, v_title, v_mode, 'TEST', v_version,
        v_n, '{}'::jsonb, 0,
        case v_mode when 'POST_TEST' then '{"mastery_min":0.6}'::jsonb else '{}'::jsonb end, 25,
        'ITEMS_AND_OPTIONS', v_mode = 'POST_TEST', true, 120,
        case v_mode when 'PRE_TEST' then 1 else 2 end, b.confirmed_by_person_id);
    end loop;
  end loop;
  return v_courses;
end $$;
revoke all on function public.lesson_package_materialise(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1b. THE UPLOAD REFUSES A GROUP THAT SPANS BOTH TESTS (D-040). The course's
--     tests draw every marked question, so a pre-test and a post-test question
--     in one parallel group would leave the post-test short for every learner
--     who took the pre-test. The author learns it at upload, at the rows.
-- ---------------------------------------------------------------------------
create or replace function public.lesson_package_check(p_institution uuid, p_package jsonb, p_batch uuid)
returns jsonb language plpgsql stable set search_path = public, pg_temp as $$
declare
  v_p jsonb := '[]'::jsonb; v_media jsonb := '[]'::jsonb;
  c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  ci int; mi int; li int; ii int; oi int; di int;
  n_c int := 0; n_m int := 0; n_l int := 0; n_i int := 0; n_o int := 0;
  v_path text; v_t text; v_ord text; v_kind text; v_name text; v_n int; v_correct int;
  v_mords text[]; v_lords text[]; v_refs text[]; v_labels text[]; v_names text[];
  v_groups jsonb; v_type text; v_use text; v_cycle jsonb; v_e jsonb;
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

    v_mords := '{}'; v_refs := '{}'; v_groups := '{}'::jsonb; v_cycle := '{}'::jsonb;
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
            -- D-040: remember which test each grouped question is for, with its row
            if v_use in ('PRE_TEST', 'POST_TEST') then
              v_cycle := jsonb_set(v_cycle, array[lower(v_t)], coalesce(v_cycle -> lower(v_t), '[]'::jsonb)
                         || jsonb_build_array(jsonb_build_object('use', v_use, 'item', i, 'path', v_path)));
            end if;
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
    -- D-040 (BOB-04): a parallel group means equivalent questions, and a
    -- learner's post-test never holds a sibling of their pre-test (INV-24), so
    -- a group never holds both a Pemetaan awal and a Cek penguasaan question.
    -- Every question of such a group is named at its sheet and row.
    for v_t in select k from jsonb_object_keys(v_cycle) k loop
      if exists (select 1 from jsonb_array_elements(v_cycle -> v_t) e where e ->> 'use' = 'PRE_TEST')
         and exists (select 1 from jsonb_array_elements(v_cycle -> v_t) e where e ->> 'use' = 'POST_TEST') then
        for v_e in select e from jsonb_array_elements(v_cycle -> v_t) e loop
          v_p := v_p || public.package_problem('ITEM_PARALLEL_CYCLE_MIXED', v_e -> 'item', v_e ->> 'path', 'parallel_group');
        end loop;
      end if;
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
-- 2. THE DRAW FOLLOWS THE MARKS.
-- ---------------------------------------------------------------------------
create or replace function public.definition_follows_cycle_roles(p_definition uuid)
returns boolean language sql stable set search_path = public, pg_temp as $$
  select d.mode in ('PRE_TEST', 'POST_TEST') and exists (
    select 1 from public.items i
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where i.cycle_role is not null
       and ((d.course_id is not null and m.course_id = d.course_id)
         or (d.module_id is not null and l.module_id = d.module_id)))
    from public.assessment_definitions d where d.id = p_definition
$$;
revoke all on function public.definition_follows_cycle_roles(uuid) from public, anon, authenticated;

create or replace function public.eligible_items_for_definition(p_definition uuid)
returns table (item_id uuid, parallel_group uuid, bank_type public.bank_type)
language sql stable set search_path = public, pg_temp as $function$
  select i.id, i.parallel_group, i.bank_type
    from public.assessment_definitions d
    join public.lessons l on true
    join public.modules m on m.id = l.module_id
    join public.items i on i.lesson_id = l.id
   where d.id = p_definition
     and i.institution_id = d.institution_id
     and public.item_is_drawable(i.bank_type, d.bank_type)
     and ((d.course_id is not null and m.course_id = d.course_id)
       or (d.module_id is not null and l.module_id = d.module_id))
     -- BOB-04 (D-008): where the questions are marked, a cycle test draws only
     -- the questions marked for it
     and (not public.definition_follows_cycle_roles(d.id) or i.cycle_role = d.mode)
  union all
  -- AD-HOC ONLY (ADR-0018). Authorized canonical content, under the same tier
  -- and scope tests as the branch above. The owner test is what makes this
  -- branch incapable of duplicating a row from branch (a): every row here is
  -- owned by someone other than the definition's institution.
  select a.item_id, a.parallel_group, a.bank_type
    from public.assessment_definitions d
    join public.authorized_canonical_items() a
      on a.consuming_institution_id = d.institution_id
   where d.id = p_definition
     and d.is_ad_hoc
     and a.owner_institution_id is distinct from d.institution_id
     and public.item_is_drawable(a.bank_type, d.bank_type)
     and ((d.course_id is not null and a.course_id = d.course_id)
       or (d.module_id is not null and a.module_id = d.module_id))
$function$;
-- privileges as before: the Studio's own reads may call it; anon may not
revoke all on function public.eligible_items_for_definition(uuid) from public, anon;
grant execute on function public.eligible_items_for_definition(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. ASSIGN -- the whole cycle, or a code.
-- ---------------------------------------------------------------------------
create function public.assign_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR050',
    detail  = p_code,
    message = case p_code
      when 'ASSIGN_NOT_ALLOWED'           then 'assigning learning requires CAN_ASSIGN_LEARNING in the class''s institution'
      when 'ASSIGN_CLASS_INVALID'         then 'learning is assigned to an active class or cohort with an academic period'
      when 'ASSIGN_RELEASE_NOT_PUBLISHED' then 'only a PUBLISHED release is assigned'
      when 'ASSIGN_WINDOW_INVALID'        then 'the assignment closes before it opens'
      when 'ASSIGN_EXISTS'                then 'this release is already assigned to this class'
      when 'ASSIGN_PRE_TEST_MISSING'      then 'the lesson has no approved pre-test (Pemetaan awal)'
      when 'ASSIGN_POST_TEST_MISSING'     then 'the lesson has no approved post-test (Cek penguasaan)'
      when 'ASSIGN_PRE_TEST_TOO_SHORT'    then 'the pre-test asks for more questions than the lesson has for it'
      when 'ASSIGN_POST_TEST_TOO_SHORT'   then 'the post-test asks for more questions than the lesson has for it'
      when 'ASSIGN_CYCLE_OVERLAP'         then 'the post-test cannot be drawn apart from the pre-test and its parallel questions (INV-24)'
      when 'CYCLE_NOT_ASSIGNED'           then 'this learning assignment is not assigned to you'
      else 'the assignment could not be made' end;
end $$;
revoke all on function public.assign_refuse(text) from public, anon, authenticated;

-- The cycle definition of a release's course for one mode: approved, not
-- ad hoc; the course-wide one before a module's, the newest version first.
create function public.release_cycle_definition(p_release uuid, p_mode public.assessment_mode)
returns public.assessment_definitions language sql stable set search_path = public, pg_temp as $$
  select d.* from public.plp_releases r
    join public.assessment_definitions d on d.institution_id = r.institution_id
   where r.id = p_release and d.mode = p_mode and not d.is_ad_hoc and d.status = 'APPROVED'
     and (d.course_id = r.course_id
          or d.module_id in (select m.id from public.modules m where m.course_id = r.course_id))
   order by (d.course_id is null), d.version desc, d.created_at desc
   limit 1
$$;
revoke all on function public.release_cycle_definition(uuid, public.assessment_mode) from public, anon, authenticated;

create function public.assign_release(p_release uuid, p_node uuid, p_from timestamptz, p_until timestamptz)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r public.plp_releases; n public.org_nodes; d_pre public.assessment_definitions; d_post public.assessment_definitions;
  v_pre_n int; v_post_n int; v_post_free int; v_la uuid; v_pre uuid; v_post uuid; v_from timestamptz;
begin
  select * into r from public.plp_releases where id = p_release;
  select * into n from public.org_nodes where id = p_node;
  -- an unknown release or class, another school's class, and content this
  -- school may not teach all answer alike
  if r.id is null or n.id is null or not public.can_in_institution('CAN_ASSIGN_LEARNING', n.institution_id)
     or (r.institution_id <> n.institution_id and not public.release_is_distributed_to(r.id, n.institution_id)) then
    perform public.assign_refuse('ASSIGN_NOT_ALLOWED');
  end if;
  if n.kind not in ('CLASS', 'COHORT') or not n.is_active or n.academic_period_id is null then
    perform public.assign_refuse('ASSIGN_CLASS_INVALID');
  end if;
  if r.status <> 'PUBLISHED' then perform public.assign_refuse('ASSIGN_RELEASE_NOT_PUBLISHED'); end if;
  v_from := coalesce(p_from, now());
  if p_until is not null and p_until <= v_from then perform public.assign_refuse('ASSIGN_WINDOW_INVALID'); end if;
  -- one assignment of a release per class at a time; a double click is one
  perform 1 from public.org_nodes where id = n.id for update;
  if exists (select 1 from public.learning_assignments la
              where la.plp_release_id = r.id and la.node_id = n.id and la.status in ('DRAFT', 'ACTIVE')) then
    perform public.assign_refuse('ASSIGN_EXISTS');
  end if;

  d_pre := public.release_cycle_definition(r.id, 'PRE_TEST');
  if d_pre.id is null then perform public.assign_refuse('ASSIGN_PRE_TEST_MISSING'); end if;
  d_post := public.release_cycle_definition(r.id, 'POST_TEST');
  if d_post.id is null then perform public.assign_refuse('ASSIGN_POST_TEST_MISSING'); end if;

  -- both tests can be drawn for every learner, INV-24 included: the post-test
  -- never repeats a pre-test question or one of its parallel siblings
  select count(*) into v_pre_n from public.eligible_items_for_definition(d_pre.id);
  if v_pre_n < d_pre.item_count then perform public.assign_refuse('ASSIGN_PRE_TEST_TOO_SHORT'); end if;
  select count(*) into v_post_n from public.eligible_items_for_definition(d_post.id);
  if v_post_n < d_post.item_count then perform public.assign_refuse('ASSIGN_POST_TEST_TOO_SHORT'); end if;
  select count(*) into v_post_free
    from public.eligible_items_for_definition(d_post.id) e
   where e.item_id not in (select p.item_id from public.eligible_items_for_definition(d_pre.id) p)
     and (e.parallel_group is null
          or e.parallel_group not in (select p.parallel_group from public.eligible_items_for_definition(d_pre.id) p
                                       where p.parallel_group is not null));
  if v_post_free < d_post.item_count then perform public.assign_refuse('ASSIGN_CYCLE_OVERLAP'); end if;

  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id,
    available_from, available_until, learning_cycle)
  values (n.institution_id, r.id, r.course_id, n.id, n.academic_period_id, p_from, p_until,
          jsonb_build_object('pre_test', d_pre.id, 'post_test', d_post.id))
  returning id into v_la;
  update public.learning_assignments set status = 'ACTIVE' where id = v_la;

  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id,
    node_id, academic_period_id, opens_at, closes_at)
  values (n.institution_id, d_pre.id, v_la, n.id, n.academic_period_id, v_from, p_until)
  returning id into v_pre;
  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id,
    node_id, academic_period_id, opens_at, closes_at)
  values (n.institution_id, d_post.id, v_la, n.id, n.academic_period_id, v_from, p_until)
  returning id into v_post;
  update public.assessment_assignments set status = 'SCHEDULED' where id in (v_pre, v_post);
  update public.assessment_assignments set status = 'OPEN' where id in (v_pre, v_post);

  perform public.audit_write('LEARNING_ASSIGNED', 'learning_assignments', v_la::text, n.institution_id,
    jsonb_build_object('plp_release_id', r.id, 'node_id', n.id, 'pre_test', d_pre.id, 'post_test', d_post.id,
                       'available_from', p_from, 'available_until', p_until));
  return jsonb_build_object('ok', true, 'learning_assignment', v_la, 'pre_assignment', v_pre, 'post_assignment', v_post);
end $$;
revoke all on function public.assign_release(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.assign_release(uuid, uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. THE LEARNER'S CYCLE, refusing a stranger with a code.
-- ---------------------------------------------------------------------------
create or replace function public.my_cycle_state(p_learning_assignment uuid)
returns table (pre_assignment uuid, pre_session uuid, pre_status public.session_status,
               post_assignment uuid, post_session uuid, post_status public.session_status)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare v_person uuid;
begin
  v_person := public.current_person_id();
  if v_person is null
     or not exists (select 1 from public.my_learning_assignments() m
                     where m.learning_assignment_id = p_learning_assignment) then
    perform public.assign_refuse('CYCLE_NOT_ASSIGNED');
  end if;
  return query
  with aa as (
    select a.id, d.mode
      from public.assessment_assignments a
      join public.assessment_definitions d on d.id = a.assessment_definition_id
     where a.learning_assignment_id = p_learning_assignment
  ),
  latest as (
    select distinct on (s.mode) s.mode, s.id, s.status
      from public.assessment_sessions s
     where s.person_id = v_person and s.learning_assignment_id = p_learning_assignment
     order by s.mode, s.created_at desc
  )
  select (select id from aa where mode = 'PRE_TEST'),
         (select id from latest where mode = 'PRE_TEST'),
         (select status from latest where mode = 'PRE_TEST'),
         (select id from aa where mode = 'POST_TEST'),
         (select id from latest where mode = 'POST_TEST'),
         (select status from latest where mode = 'POST_TEST');
end $function$;
revoke all on function public.my_cycle_state(uuid) from public, anon;
grant execute on function public.my_cycle_state(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. THE REGISTRY (L3-F02).
-- ---------------------------------------------------------------------------
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('assign_release', 'STAFF',
   'BOB-04 (D-008): assigns a PUBLISHED release to a class -- the learning assignment and its pre-test and '
   || 'post-test assessment assignments, open, in one transaction -- after checking both tests can be drawn for '
   || 'every learner (INV-24 included). Audited. Refusals are PR050 with a stable code in DETAIL.',
   'CAPABILITY', 'CAN_ASSIGN_LEARNING')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014). Structural; selftest/db/fable13.sql proves
-- the behaviour on every run.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.client_rpc_registry
                  where function_name = 'assign_release' and authorization_kind = 'CAPABILITY'
                    and authorization_requirement = 'CAN_ASSIGN_LEARNING') then
    raise exception 'BOB-04: assign_release is not declared';
  end if;
  if has_function_privilege('anon', 'public.assign_release(uuid, uuid, timestamptz, timestamptz)'::regprocedure, 'execute') then
    raise exception 'BOB-04: an anonymous caller can assign learning';
  end if;
  if has_function_privilege('authenticated', 'public.assign_refuse(text)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.release_cycle_definition(uuid, public.assessment_mode)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.definition_follows_cycle_roles(uuid)'::regprocedure, 'execute') then
    raise exception 'BOB-04: an internal helper is client-callable';
  end if;
  if pg_get_functiondef('public.lesson_package_materialise(uuid)'::regprocedure) !~ 'assessment_definitions' then
    raise exception 'BOB-04: the materialiser no longer makes the course''s tests';
  end if;
end $$;

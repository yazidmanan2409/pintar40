-- CR-50 (D-063 M1-M5, D-120 Q9): A MISCONCEPTION DEFINITION BELONGS TO THE CONTENT'S OWNER, AND A PACKAGE CARRIES ITS OWN.
--
-- D-120 Q9: «canonical national / PINTAR content owns the shared misconception definitions; school-created content owns
-- separate school definitions.» D-063's mechanism delivers exactly that, unchanged: a definition is owned by the
-- institution whose content names it. For PINTAR's canonical content that is the PLATFORM_CANONICAL tenant (ADR-0015),
-- so every school a canonical chapter is distributed to shares one definition per code; a school's own content names its
-- own rows. CR-50 closes before Dr Gladys (closure register amendment 1): until now no package could register a code, so
-- every wrong option arrived uncoded and each chapter's review carried about 31 WEAK_MISCONCEPTION_LINKAGE findings a
-- head of department had to acknowledge one by one.
--
--   M1  the key is (institution_id, code): each owner holds its own row under a code; no global collision, and a second
--       owner's import neither fails nor learns that another holds the code
--   M2  an option names a definition of its own institution only (a composite foreign key, for every route)
--   M3  session_misconceptions, reading_map and service_cohort_misconceptions join a definition on the option's own
--       institution; their bodies are otherwise unchanged
--   M4  definitions are append-only for an owner: UPDATE is revoked from authenticated (a changed meaning is a new code)
--   M5  a package carries «Miskonsepsi» (misconceptions: [{code, label, description, remediation}]): the check validates
--       each, requires every option's code to be defined in the same package, reuses a held code with the same text and
--       refuses a different text (MISCONCEPTION_DEFINITION_DIFFERS); the materialiser writes the definitions first
--
-- CATALOGUE: unchanged (D-060(c)): where every link is same-owner, which M2 now guarantees and the guard below verifies for
-- existing rows, the readers return exactly what they returned. ENGINE: unchanged (feedback, not grading).

-- ═══════════════════════════════════════════════════════════ 1. the guard: no option links across owners today
do $$
declare n int; t int;
begin
  select count(*) into n from public.item_options o
   where o.misconception_code is not null
     and not exists (select 1 from public.misconception_taxonomy mt
                      where mt.code = o.misconception_code and mt.institution_id = o.institution_id);
  if n > 0 then
    raise exception 'CR-50: % option(s) name a misconception only another institution holds; not repaired silently (D-063 §4)', n;
  end if;
  select count(*) into t from public.misconception_taxonomy;
  raise notice 'CR-50: % misconception definition(s) before the key change; 0 cross-owner links', t;
end $$;

-- ═══════════════════════════════════════════════════════════ 2. M1, M2: the keys
alter table public.item_options drop constraint item_options_misconception_code_fkey;
alter table public.misconception_taxonomy drop constraint misconception_taxonomy_pkey;
alter table public.misconception_taxonomy add constraint misconception_taxonomy_pkey primary key (institution_id, code);
alter table public.item_options add constraint item_options_misconception_fkey
  foreign key (institution_id, misconception_code) references public.misconception_taxonomy (institution_id, code);
create index if not exists item_options_misconception_idx on public.item_options (institution_id, misconception_code)
  where misconception_code is not null;

-- ═══════════════════════════════════════════════════════════ 3. M3: the readers
CREATE OR REPLACE FUNCTION public.session_misconceptions(p_session uuid)
 RETURNS TABLE(item_id uuid, misconception_code text, label text, remediation text, lesson_id uuid, page_citation text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select f.item_id, o.misconception_code, mt.label, mt.remediation, i.lesson_id, i.page_citation
    from public.session_final_responses(p_session) f
    join public.items i on i.id = f.item_id
    join public.item_options o on o.item_id = f.item_id
                             and o.label = (f.value ->> 'pilihan')
                             and not o.is_correct
    join public.misconception_taxonomy mt on mt.code = o.misconception_code and mt.institution_id = o.institution_id
   where o.misconception_code is not null
$function$;
revoke all on function public.session_misconceptions(uuid) from public, anon, authenticated;
grant execute on function public.session_misconceptions(uuid) to service_role;

CREATE OR REPLACE FUNCTION public.reading_map(p_session uuid)
 RETURNS TABLE(peringkat smallint, tingkat text, kode text, pernyataan text, modul text, pelajaran text, halaman text, alasan text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  return query
  with graded as (
    select f.item_id, f.value, f.is_safety_critical,
           case when f.value is null then 0 else public.grade_response(f.item_id, f.value) end as score
      from public.session_final_responses(p_session) f
  ),
  per_objective as (
    select lo.id as objective_id, lo.code, lo.statement, lo.is_core,
           l.id as lesson_id, l.title as lesson_title, l.page_citation,
           m.title as module_title, m.ordinal as module_ordinal, l.ordinal as lesson_ordinal,
           count(*)::integer as total,
           sum(g.score)::integer as benar,
           bool_or(g.is_safety_critical and g.score = 0) as safety_missed
      from graded g
      join public.items i on i.id = g.item_id
      join public.learning_objectives lo on lo.id = any (i.objective_ids)
      join public.lessons l on l.id = lo.lesson_id
      join public.modules m on m.id = l.module_id
     group by lo.id, lo.code, lo.statement, lo.is_core, l.id, l.title, l.page_citation,
              m.title, m.ordinal, l.ordinal
  ),
  ranked as (
    select po.*,
           case when po.safety_missed                         then 1
                when po.benar::numeric / po.total < 0.5       then 2
                when po.benar::numeric / po.total < 0.8       then 3
                else                                               4 end as tier
      from per_objective po
  )
  select row_number() over (order by r.tier, r.module_ordinal, r.lesson_ordinal,
                                     r.code collate "C")::smallint,
         case r.tier when 1 then 'PERLU_SEGERA' when 2 then 'WAJIB'
                     when 3 then 'DISARANKAN'  else 'KUAT' end,
         r.code, r.statement, r.module_title, r.lesson_title, r.page_citation,
         coalesce(
           (select string_agg(distinct mt.remediation, ' ') from graded g2
              join public.items i2 on i2.id = g2.item_id
              join public.item_options o2 on o2.item_id = g2.item_id
                                         and o2.label = (g2.value ->> 'pilihan')
                                         and not o2.is_correct
              join public.misconception_taxonomy mt on mt.code = o2.misconception_code and mt.institution_id = o2.institution_id
             where r.objective_id = any (i2.objective_ids)),
           r.statement)
    from ranked r
   order by 1;
end $function$;
revoke all on function public.reading_map(uuid) from public, anon;
grant execute on function public.reading_map(uuid) to authenticated, service_role;

create or replace view public.service_cohort_misconceptions with (security_invoker = true) as
 SELECT s.institution_id,
    s.cohort_node_id,
    s.class_node_id,
    o.misconception_code,
    mt.label,
    mt.remediation,
    count(*)::integer AS occurrences
   FROM academic_responses r
     JOIN assessment_sessions s ON s.id = r.session_id
     JOIN presented_items p ON p.id = r.presented_item_id
     JOIN item_options o ON o.item_id = p.item_id AND o.label = (r.value ->> 'pilihan'::text) AND NOT o.is_correct
     JOIN misconception_taxonomy mt ON mt.code = o.misconception_code AND mt.institution_id = o.institution_id
  WHERE o.misconception_code IS NOT NULL
  GROUP BY s.institution_id, s.cohort_node_id, s.class_node_id, o.misconception_code, mt.label, mt.remediation;
revoke all on public.service_cohort_misconceptions from public, anon, authenticated;
grant select on public.service_cohort_misconceptions to service_role;

-- ═══════════════════════════════════════════════════════════ 4. M4: append-only
revoke update on public.misconception_taxonomy from authenticated;

-- ═══════════════════════════════════════════════════════════ 5. M5: the package carries its definitions
CREATE OR REPLACE FUNCTION public.lesson_package_check(p_institution uuid, p_package jsonb, p_batch uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_p jsonb := '[]'::jsonb; v_media jsonb := '[]'::jsonb;
  c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  ci int; mi int; li int; ii int; oi int; di int;
  n_c int := 0; n_m int := 0; n_l int := 0; n_i int := 0; n_o int := 0;
  v_path text; v_t text; v_ord text; v_kind text; v_name text; v_n int; v_correct int;
  v_mords text[]; v_lords text[]; v_refs text[]; v_labels text[]; v_names text[];
  v_groups jsonb; v_type text; v_use text; v_cycle jsonb; v_e jsonb;
  v_codes text[] := '{}'; mc jsonb; mci int := 0; v_mt public.misconception_taxonomy;
begin
  if jsonb_typeof(p_package) is distinct from 'object' or jsonb_typeof(p_package -> 'courses') is distinct from 'array'
     or jsonb_array_length(p_package -> 'courses') = 0 then
    return jsonb_build_object('problems', jsonb_build_array(public.package_problem('PACKAGE_EMPTY', null, 'courses', null)),
                              'media', '[]'::jsonb, 'counts', '{}'::jsonb);
  end if;
  if jsonb_array_length(p_package -> 'courses') > 20 then
    v_p := v_p || public.package_problem('PACKAGE_TOO_LARGE', null, 'courses', null);
  end if;

  -- D-063 M5, D-120 Q9: THE PACKAGE CARRIES THE MISCONCEPTION DEFINITIONS ITS OPTIONS NAME («Miskonsepsi»), and each
  -- becomes the importing owner's own (the school's; the PINTAR library's for canonical content). Only the importing
  -- owner's rows are read: nothing about another school is revealed, and nothing can collide with it.
  if p_package ? 'misconceptions' and jsonb_typeof(p_package -> 'misconceptions') is distinct from 'array' then
    v_p := v_p || public.package_problem('PACKAGE_SHAPE_INVALID', null, 'misconceptions', null);
  end if;
  for mc in select * from jsonb_array_elements(case when jsonb_typeof(p_package -> 'misconceptions') = 'array'
                                                    then p_package -> 'misconceptions' else '[]'::jsonb end) loop
    v_path := format('misconceptions[%s]', mci); mci := mci + 1;
    if jsonb_typeof(mc) is distinct from 'object' then
      v_p := v_p || public.package_problem('PACKAGE_SHAPE_INVALID', null, v_path, null); continue;
    end if;
    v_t := public.package_text(mc, 'code');
    if v_t is null or v_t !~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' or length(v_t) not between 3 and 40 then
      v_p := v_p || public.package_problem('MISCONCEPTION_CODE_INVALID', mc, v_path, 'code'); continue;
    end if;
    if v_t = any (v_codes) then
      v_p := v_p || public.package_problem('MISCONCEPTION_REPEATED', mc, v_path, 'code'); continue;
    end if;
    v_codes := v_codes || v_t;
    if public.package_text(mc, 'label') is null then
      v_p := v_p || public.package_problem('MISCONCEPTION_TEXT_MISSING', mc, v_path, 'label'); continue;
    elsif public.package_text(mc, 'description') is null then
      v_p := v_p || public.package_problem('MISCONCEPTION_TEXT_MISSING', mc, v_path, 'description'); continue;
    elsif public.package_text(mc, 'remediation') is null then
      v_p := v_p || public.package_problem('MISCONCEPTION_TEXT_MISSING', mc, v_path, 'remediation'); continue;
    end if;
    if length(public.package_text(mc, 'label')) > 200 then
      v_p := v_p || public.package_problem('TEXT_TOO_LONG', mc, v_path, 'label');
    elsif length(public.package_text(mc, 'description')) > 2000 then
      v_p := v_p || public.package_problem('TEXT_TOO_LONG', mc, v_path, 'description');
    elsif length(public.package_text(mc, 'remediation')) > 2000 then
      v_p := v_p || public.package_problem('TEXT_TOO_LONG', mc, v_path, 'remediation');
    end if;
    -- a code the importing owner already holds: the same text is reused; a different text is refused, nothing changed
    select * into v_mt from public.misconception_taxonomy t where t.institution_id = p_institution and t.code = v_t;
    if found and (btrim(v_mt.label) is distinct from public.package_text(mc, 'label')
                  or btrim(v_mt.description) is distinct from public.package_text(mc, 'description')
                  or btrim(v_mt.remediation) is distinct from public.package_text(mc, 'remediation')) then
      v_p := v_p || public.package_problem('MISCONCEPTION_DEFINITION_DIFFERS', mc, v_path, 'code');
    end if;
  end loop;

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
            -- D-063 M5: defined in this package, whatever the school already holds (the package is whole)
            if v_t is not null and not (v_t = any (v_codes)) then
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
end $function$;
revoke all on function public.lesson_package_check(uuid, jsonb, uuid) from public, anon;

CREATE OR REPLACE FUNCTION public.lesson_package_materialise(p_batch uuid)
 RETURNS uuid[]
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  b public.ingest_batches; c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  mi int; li int; v_course uuid; v_module uuid; v_lesson uuid; v_item uuid; v_obj uuid;
  v_courses uuid[] := '{}'; v_media jsonb; v_name text; v_groups jsonb; v_group uuid; v_g text; v_use text;
  v_mode public.assessment_mode; v_n int; v_title text; v_version int;
begin
  select * into b from public.ingest_batches where id = p_batch;
  -- D-063 M5: the package's definitions first, the importing owner's own; then its options can name only them (M2).
  -- A definition already held with a different text is refused here too, so a concurrent import cannot slip one in
  -- between the check and this write.
  insert into public.misconception_taxonomy (code, institution_id, label, description, remediation)
  select public.package_text(x, 'code'), b.institution_id, public.package_text(x, 'label'),
         public.package_text(x, 'description'), public.package_text(x, 'remediation')
    from jsonb_array_elements(case when jsonb_typeof(b.raw_payload -> 'misconceptions') = 'array'
                                   then b.raw_payload -> 'misconceptions' else '[]'::jsonb end) x
  on conflict (institution_id, code) do nothing;
  if exists (select 1 from jsonb_array_elements(case when jsonb_typeof(b.raw_payload -> 'misconceptions') = 'array'
                                                     then b.raw_payload -> 'misconceptions' else '[]'::jsonb end) x
               join public.misconception_taxonomy t on t.institution_id = b.institution_id and t.code = public.package_text(x, 'code')
              where btrim(t.label) is distinct from public.package_text(x, 'label')
                 or btrim(t.description) is distinct from public.package_text(x, 'description')
                 or btrim(t.remediation) is distinct from public.package_text(x, 'remediation')) then
    raise exception using errcode = 'PR040', detail = 'MISCONCEPTION_DEFINITION_DIFFERS',
      message = 'a misconception this school already holds arrived with a different text';
  end if;
  for c in select * from jsonb_array_elements(b.raw_payload -> 'courses') loop
    -- D-085 M10: a correction is a new course in the line of the one it corrects (supersedes_course_id is set
    -- here, at insert, as the lineage pointer requires); package_revision_problems has checked it
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id, learning_context,
                                supersedes_course_id)
    values (b.institution_id, public.package_text(c, 'subject'), public.package_text(c, 'stage'),
            public.package_text(c, 'grade_label'), public.package_text(c, 'title'), b.confirmed_by_person_id,
            coalesce(public.package_context(c), 'ACADEMIC'::public.learning_context), b.revises_course_id)
    returning id into v_course;
    if b.revises_course_id is not null then
      insert into public.course_revision_notes (course_id, institution_id, supersedes_course_id, summary, written_by_person_id)
      values (v_course, b.institution_id, b.revises_course_id, btrim(b.change_summary), b.confirmed_by_person_id);
      perform public.audit_write('COURSE_CORRECTION_UPLOADED', 'courses', v_course::text, b.institution_id,
        jsonb_build_object('corrects', b.revises_course_id, 'batch', b.id, 'summary', btrim(b.change_summary)));
    end if;
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
end $function$;
revoke all on function public.lesson_package_materialise(uuid) from public, anon;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
begin
  if (select array_agg(a.attname::text order by k.ord) from pg_constraint c
        cross join lateral unnest(c.conkey) with ordinality k(attnum, ord)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
       where c.conname = 'misconception_taxonomy_pkey') is distinct from array['institution_id', 'code'] then
    raise exception 'M1: the key is not (institution_id, code)';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'item_options_misconception_fkey'
                  and pg_get_constraintdef(oid) ~ 'FOREIGN KEY \(institution_id, misconception_code\)') then
    raise exception 'M2: options do not reference their own institution''s definition';
  end if;
  if pg_get_functiondef('public.session_misconceptions(uuid)'::regprocedure) !~ 'mt\.institution_id = o\.institution_id'
     or pg_get_functiondef('public.reading_map(uuid)'::regprocedure) !~ 'mt\.institution_id = o2\.institution_id'
     or pg_get_viewdef('public.service_cohort_misconceptions'::regclass) !~ 'mt\.institution_id = o\.institution_id' then
    raise exception 'M3: a reader still joins a definition on its code alone';
  end if;
  if has_table_privilege('authenticated', 'public.misconception_taxonomy', 'update') then
    raise exception 'M4: definitions are not append-only';
  end if;
end $$;

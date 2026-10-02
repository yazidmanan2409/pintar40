-- D-085 M10 -- A SEALED CHAPTER KEEPS ITS TESTS' QUESTIONS, AND SO DOES ITS CORRECTION.
--
-- Two defects, both found while mapping M10 ("correct forward, never rewrite backward") and both shown in the
-- database before this was written (rolled back):
--
--   1. Which questions a chapter's Pemetaan Awal and Uji Penguasaan draw is items.cycle_role (BOB-04, D-008). It was
--      not among the columns enforce_taught_content_immutable freezes once the course is sealed, so a teacher with
--      CAN_DRAFT could move a published chapter's question in or out of its tests: the release's tests changed under
--      every class already given it, while its content hash did not (cycle_role is not hashed). The column is now
--      frozen with the rest of the question. The hash is not changed: released hashes stay verifiable.
--   2. create_course_revision copied every question but not its cycle_role (the function predates the column), so a
--      revision of a chapter with five marked questions had none, and its two tests drew from one pool. The copy now
--      carries it.
--
-- Nothing else in either function changes; each is re-emitted from its latest text (20260929100000 and
-- 20260928100000) with the one line, and the lines CI's plants replace are kept verbatim.

create or replace function public.enforce_taught_content_immutable() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_course uuid; v_cols text[]; v_col text; v_row jsonb; v_new jsonb; v_old jsonb;
begin
  if tg_op = 'DELETE' then v_row := to_jsonb(old); else v_row := to_jsonb(new); end if;

  case tg_table_name
    when 'courses' then
      v_course := (v_row ->> 'id')::uuid;
      -- `learning_context` JOINED THIS LIST IN 0102 and is the only change to
      -- this function. It is evidence provenance, not editable metadata: once
      -- the course is sealed, committed evidence exists under the context it
      -- had, and moving the context afterwards reinterprets that evidence
      -- retroactively -- academic findings vanish, or professional-development
      -- answers arrive in a class's academic figures with remediation
      -- attached. Both were measured before this line was written.
      v_cols := array['subject','stage','grade_label','title','learning_context'];
    when 'modules' then
      v_course := (v_row ->> 'course_id')::uuid;
      v_cols := array['course_id','ordinal','title'];
    when 'lessons' then
      select m.course_id into v_course from public.modules m
       where m.id = (v_row ->> 'module_id')::uuid;
      v_cols := array['module_id','ordinal','title','summary','body_markdown',
                      'worked_examples','media'];
    when 'learning_objectives' then
      select m.course_id into v_course from public.lessons l
        join public.modules m on m.id = l.module_id
       where l.id = (v_row ->> 'lesson_id')::uuid;
      v_cols := array['lesson_id','code','statement','bloom','is_core'];
    when 'items' then
      select m.course_id into v_course from public.lessons l
        join public.modules m on m.id = l.module_id
       where l.id = (v_row ->> 'lesson_id')::uuid;
      -- D-085 M10: 'cycle_role' too. Which questions a chapter's Pemetaan Awal and Uji Penguasaan draw
      -- (BOB-04, D-008) is part of what was reviewed and released; once sealed it does not move.
      v_cols := array['lesson_id','item_type','bank_type','stem','stimulus','petunjuk',
                      'arah_berpikir','objective_ids','is_safety_critical',
                      'predicted_difficulty','parallel_group','cycle_role'];
    when 'item_options' then
      select m.course_id into v_course from public.items i
        join public.lessons l on l.id = i.lesson_id
        join public.modules m on m.id = l.module_id
       where i.id = (v_row ->> 'item_id')::uuid;
      v_cols := array['item_id','label','body','is_correct','rationale','misconception_code'];
    when 'assessment_definitions' then
      if (v_row ->> 'course_id') is not null then
        v_course := (v_row ->> 'course_id')::uuid;
      else
        select m.course_id into v_course from public.modules m
         where m.id = (v_row ->> 'module_id')::uuid;
      end if;
      v_cols := array['course_id','module_id','title','mode','bank_type','version','item_count',
                      'difficulty_mix','safety_critical_minimum','passing_rules',
                      'hesitation_window_seconds','shuffle_policy','allows_pause',
                      'offline_tolerant','late_sync_grace_seconds','attempt_limit','is_ad_hoc'];
    else
      raise exception 'taught-content immutability trigger attached to an unexpected table: %.%',
        tg_table_schema, tg_table_name;
  end case;

  -- ADDED IN 0046. An ad-hoc assessment is not taught content: it is outside
  -- the release payload, so creating one changes no sealed hash. It may never
  -- become release-bound, and every other row is governed exactly as before.
  --
  -- The exemption is a statement about the ROW, so it covers all three verbs.
  -- The first version of this file covered INSERT and UPDATE and forgot DELETE,
  -- which meant an ad-hoc quick assessment launched over a sealed course -- the
  -- only kind that matters -- could be created and then never removed, and this
  -- migration's own probe could not apply to any database holding sealed
  -- content. See the header for how that was found and why it is repaired here
  -- rather than forward. UPDATE and DELETE read OLD, never the row being
  -- written, so a taught definition cannot be relabelled ad-hoc and then
  -- removed: that UPDATE is refused further down, exactly as it always was.
  if tg_table_name = 'assessment_definitions' then
    if tg_op = 'INSERT' and coalesce((v_row ->> 'is_ad_hoc')::boolean, false) then
      return new;
    end if;
    if tg_op = 'UPDATE' and coalesce((to_jsonb(old) ->> 'is_ad_hoc')::boolean, false) then
      if not coalesce((to_jsonb(new) ->> 'is_ad_hoc')::boolean, false) then
        raise exception 'an ad-hoc assessment never becomes part of a release (INV-04)';
      end if;
      return new;
    end if;
    if tg_op = 'DELETE' and coalesce((to_jsonb(old) ->> 'is_ad_hoc')::boolean, false) then
      return old;
    end if;
  end if;

  if v_course is null or not public.content_is_sealed(v_course) then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'taught content cannot be added under a frozen course (INV-04): %.%',
      tg_table_schema, tg_table_name;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'taught content cannot be deleted once frozen (INV-04): %.%',
      tg_table_schema, tg_table_name;
  end if;

  v_new := to_jsonb(new); v_old := to_jsonb(old);
  foreach v_col in array v_cols loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception '%.%.% is immutable once the course is frozen (INV-04)',
        tg_table_schema, tg_table_name, v_col;
    end if;
  end loop;
  return new;
end $$;

create or replace function public.create_course_revision(p_course uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  src record; v_actor uuid; v_new_course uuid; n_open int;
  v_mod record; v_new_mod uuid; v_les record; v_new_les uuid;
  v_lo record; v_it record; v_new_item uuid; v_def record; v_version int;
  v_obj uuid[]; v_pg uuid;
  -- old id -> new id, for the two columns that are not reachable by walking
  -- the tree: objective_ids (an array on items) and parallel_group.
  v_lo_map jsonb := '{}'::jsonb;
  v_pg_map jsonb := '{}'::jsonb;
  n_mod int := 0; n_les int := 0; n_lo int := 0; n_item int := 0; n_opt int := 0; n_def int := 0;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'a revision requires an authenticated actor'; end if;

  select * into src from public.courses where id = p_course;
  if src.id is null then raise exception 'unknown course %', p_course; end if;

  if not public.can_in_institution('CAN_DRAFT', src.institution_id) then
    raise exception 'revising a course requires CAN_DRAFT in the owning institution';
  end if;

  -- An unsealed course is edited directly; a revision of it would produce two
  -- editable successors of the same thing and mean nothing.
  if not public.content_is_sealed(p_course) then
    raise exception 'this course is not sealed; edit it directly rather than revising it';
  end if;

  -- Two divergent open successors is a state with no correct resolution.
  --
  -- "Open" means still editable, which is the same question `content_is_sealed`
  -- already answers -- NOT "its course row has not reached PUBLISHED". A course
  -- row never reaches PUBLISHED in this system: publication is a property of a
  -- RELEASE, and the course stays at APPROVED/FROZEN behind it. Asking the
  -- course's status would have made the FIRST revision of any course the last
  -- one it could ever have, permanently, which is not a rule anyone stated.
  select count(*) into n_open from public.courses c
   where c.supersedes_course_id = p_course
     and not public.content_is_sealed(c.id);
  if n_open > 0 then
    raise exception 'an open revision of this course already exists; finish or abandon it first';
  end if;

  -- The successor inherits `learning_context` from what it supersedes
  -- (20260928100000) and, since D-085 M10 (20261105100000), each question's
  -- cycle_role. Everything else is the function 20260915120000 wrote.
  insert into public.courses
    (institution_id, subject, stage, grade_label, title, status,
     author_person_id, supersedes_course_id, learning_context)
  values (src.institution_id, src.subject, src.stage, src.grade_label, src.title, 'INGESTED',
          v_actor, p_course, src.learning_context)
  returning id into v_new_course;

  for v_mod in select * from public.modules where course_id = p_course order by ordinal loop
    insert into public.modules
      (course_id, institution_id, ordinal, title, status, author_person_id, supersedes_module_id)
    values (v_new_course, src.institution_id, v_mod.ordinal, v_mod.title, 'INGESTED',
            coalesce(v_mod.author_person_id, v_actor), v_mod.id)
    returning id into v_new_mod;
    n_mod := n_mod + 1;

    for v_les in select * from public.lessons where module_id = v_mod.id order by ordinal loop
      insert into public.lessons
        (module_id, institution_id, ordinal, title, summary, body_markdown, worked_examples,
         media, source_version_id, page_citation, status, author_person_id, supersedes_lesson_id)
      values (v_new_mod, src.institution_id, v_les.ordinal, v_les.title, v_les.summary,
              v_les.body_markdown, v_les.worked_examples, v_les.media, v_les.source_version_id,
              v_les.page_citation, 'INGESTED', coalesce(v_les.author_person_id, v_actor), v_les.id)
      returning id into v_new_les;
      n_les := n_les + 1;

      for v_lo in select * from public.learning_objectives where lesson_id = v_les.id order by code loop
        insert into public.learning_objectives
          (lesson_id, institution_id, code, statement, bloom, is_core,
           supersedes_learning_objective_id)
        values (v_new_les, src.institution_id, v_lo.code, v_lo.statement, v_lo.bloom, v_lo.is_core,
                v_lo.id)
        returning id into v_pg;
        v_lo_map := v_lo_map || jsonb_build_object(v_lo.id::text, v_pg);
        n_lo := n_lo + 1;
      end loop;
    end loop;
  end loop;

  -- Items come after every objective exists, because an item names its
  -- objectives by id and the copy must name the COPIES.
  for v_it in
    select i.* from public.items i
      join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course
     order by i.created_at, i.id
  loop
    select array_agg(coalesce((v_lo_map ->> o::text)::uuid, o) order by ord)
      into v_obj
      from unnest(v_it.objective_ids) with ordinality as t(o, ord);

    if v_it.parallel_group is not null then
      if not (v_pg_map ? v_it.parallel_group::text) then
        v_pg_map := v_pg_map || jsonb_build_object(v_it.parallel_group::text, gen_random_uuid());
      end if;
      v_pg := (v_pg_map ->> v_it.parallel_group::text)::uuid;
    else
      v_pg := null;
    end if;

    insert into public.items
      (lesson_id, institution_id, item_type, bank_type, stem, stimulus, petunjuk, arah_berpikir,
       objective_ids, is_safety_critical, parallel_group, predicted_difficulty,
       -- empirical_difficulty, empirical_discrimination and empirical_evidence_count are
       -- DELIBERATELY ABSENT. The copy has no evidence of its own and must not
       -- claim another item's. Asserted in the terminal block.
       -- D-085 M10: cycle_role is copied, so a corrected chapter keeps its Pemetaan Awal and
       -- Uji Penguasaan questions (D-008); without it both tests drew from one pool
       source_version_id, page_citation, status, author_person_id, supersedes_item_id, cycle_role)
    select (select l2.id from public.lessons l2 where l2.supersedes_lesson_id = v_it.lesson_id
              and l2.institution_id = src.institution_id
              and exists (select 1 from public.modules m2
                           where m2.id = l2.module_id and m2.course_id = v_new_course)),
           src.institution_id, v_it.item_type, v_it.bank_type, v_it.stem, v_it.stimulus,
           v_it.petunjuk, v_it.arah_berpikir, coalesce(v_obj, '{}'::uuid[]),
           v_it.is_safety_critical, v_pg, v_it.predicted_difficulty,
           v_it.source_version_id, v_it.page_citation, 'INGESTED',
           coalesce(v_it.author_person_id, v_actor), v_it.id, v_it.cycle_role
    returning id into v_new_item;
    n_item := n_item + 1;

    insert into public.item_options
      (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
    select v_new_item, src.institution_id, o.label, o.body, o.is_correct, o.rationale,
           o.misconception_code
      from public.item_options o where o.item_id = v_it.id order by o.label;
  end loop;

  select count(*) into n_opt from public.item_options io
    join public.items i on i.id = io.item_id
    join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = v_new_course;

  -- Assessment definitions follow the content they measure. An ad-hoc
  -- instrument is not taught content, never enters a release, and is not
  -- copied (ADR-0011).
  for v_def in
    select d.* from public.assessment_definitions d
     where not d.is_ad_hoc
       and (d.course_id = p_course
         or d.module_id in (select id from public.modules where course_id = p_course))
  loop
    -- (institution_id, title, mode, version) is unique, and the copy keeps the
    -- instrument's name. A copy is therefore the next version of that named
    -- instrument -- which is what it is.
    select coalesce(max(version), 0) + 1 into v_version
      from public.assessment_definitions
     where institution_id = src.institution_id and title = v_def.title and mode = v_def.mode;

    insert into public.assessment_definitions
      (institution_id, course_id, module_id, title, mode, bank_type, version, item_count,
       difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
       shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
       author_person_id, status, is_ad_hoc)
    values (src.institution_id,
            case when v_def.course_id is not null then v_new_course else null end,
            case when v_def.module_id is not null
                 then (select m2.id from public.modules m2
                        where m2.course_id = v_new_course and m2.supersedes_module_id = v_def.module_id)
                 else null end,
            v_def.title, v_def.mode, v_def.bank_type, v_version, v_def.item_count,
            v_def.difficulty_mix, v_def.safety_critical_minimum, v_def.passing_rules,
            v_def.hesitation_window_seconds, v_def.shuffle_policy, v_def.allows_pause,
            v_def.offline_tolerant, v_def.late_sync_grace_seconds, v_def.attempt_limit,
            coalesce(v_def.author_person_id, v_actor), 'INGESTED', false);
    n_def := n_def + 1;
  end loop;

  perform public.audit_write('COURSE_REVISION_CREATED', 'courses', v_new_course::text,
    src.institution_id,
    jsonb_build_object('source_course_id', p_course, 'new_course_id', v_new_course,
                       'modules', n_mod, 'lessons', n_les, 'learning_objectives', n_lo,
                       'items', n_item, 'item_options', n_opt, 'assessment_definitions', n_def,
                       'empirical_values_copied', 0));
  return v_new_course;
end $$;
revoke all on function public.create_course_revision(uuid) from public, anon, authenticated;
grant execute on function public.create_course_revision(uuid) to authenticated;

do $$
declare v_src text;
begin
  v_src := pg_get_functiondef('public.enforce_taught_content_immutable()'::regprocedure);
  if position('''predicted_difficulty'',''parallel_group'',''cycle_role''' in v_src) = 0 then
    raise exception 'M10: a sealed question''s cycle_role is frozen with it';
  end if;
  v_src := pg_get_functiondef('public.create_course_revision(uuid)'::regprocedure);
  if position('supersedes_item_id, cycle_role)' in v_src) = 0 or position('v_it.id, v_it.cycle_role' in v_src) = 0
     or position(E'       objective_ids, is_safety_critical, parallel_group, predicted_difficulty,' in v_src) = 0
     or position(E'           v_it.is_safety_critical, v_pg, v_it.predicted_difficulty,' in v_src) = 0 then
    raise exception 'M10: a revision copies each question''s cycle_role, and keeps the lines the plants read';
  end if;
  raise notice 'M10 verified: a sealed chapter''s test questions are fixed, and a revision keeps them';
end $$;

-- ---------------------------------------------------------------------------------------------------------------
-- A3 · ATTEMPTS COUNT ACROSS AN ASSESSMENT'S VERSIONS (ruling 46). DRAFT, local to claude/a3.
--
-- The owner, 17 Nov (ruling 46, at 181638b9): "A3: COUNT ACROSS VERSIONS. Attempt limits apply across published
-- versions of the same assessment. Preserve version-specific history and audit evidence. Any exceptional reset
-- requires explicit authorisation."
--
-- Sharon's design (A3-PREBUILD-ac25e9b1.md addendum, 478c8750): an explicit, immutable lineage, not a derived one.
--   * assessment_definitions.lineage_root_definition_id, NOT NULL, immutable once set; a new definition is its own root.
--   * salin_kursus_revisi (a course's revision, and C1w's key correction through it) and save_assessment_definition (a
--     new version of a definition) set it to the source's root.
--   * Existing rows are backfilled from the course or module chain (supersedes_course_id, supersedes_module_id) plus
--     title and mode; the migration refuses unless every revision finds at most one predecessor
--     (garis_definisi_periksa).
--   * may_start's count and the start's key use the lineage root, within the school and the school year (10 Nov).
--
-- What does not change: a sitting's own definition and version (never rewritten); scoring, results, certificates and
-- audit, which read the sitting's own definition; and nothing resets an attempt. Before this migration every revision
-- made by salin_kursus_revisi, and every new version saved, gave a fresh allowance (F37-R06, C1W-S05, red on 2e94a2c9).
--
-- Not a backfill link: a draft-stage version saved in the same chapter before this migration (save_assessment_definition,
-- only while the chapter is INGESTED, so never sat) is its own root; from now on a new version carries its root.
-- ---------------------------------------------------------------------------------------------------------------

alter table public.assessment_definitions
  add column lineage_root_definition_id uuid references public.assessment_definitions(id);
comment on column public.assessment_definitions.lineage_root_definition_id is
  'A3, ruling 46: the first definition of this assessment''s line; attempt limits count across the line. Immutable.';

-- A definition's predecessors: the same-titled, same-mode, not-ad-hoc definitions of the school in the course or the
-- module its own course or module supersedes. Read only; used by the backfill and by garis_definisi_periksa.
create function public.garis_definisi_pendahulu(p_definition uuid)
returns setof uuid language sql stable security definer set search_path = public, pg_temp as $$
  select d0.id
    from public.assessment_definitions d
    join public.assessment_definitions d0
      on d0.institution_id = d.institution_id and d0.title = d.title and d0.mode = d.mode
     and not d0.is_ad_hoc and d0.id <> d.id
   where d.id = p_definition and not d.is_ad_hoc
     and ((d.course_id is not null
           and d0.course_id = (select c.supersedes_course_id from public.courses c where c.id = d.course_id))
       or (d.module_id is not null
           and d0.module_id = (select m.supersedes_module_id from public.modules m where m.id = d.module_id)))
$$;
revoke all on function public.garis_definisi_pendahulu(uuid) from public, anon, authenticated;

-- The line check: refuses if any definition has more than one predecessor (an ambiguous line); returns 0 otherwise.
create function public.garis_definisi_periksa()
returns integer language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r record;
begin
  for r in select d.id, count(*) n from public.assessment_definitions d
             cross join lateral public.garis_definisi_pendahulu(d.id) p group by d.id having count(*) > 1 order by d.id limit 1 loop
    raise exception 'A3, ruling 46: definition % has % predecessors in the course or module it supersedes; its line is ambiguous', r.id, r.n
      using errcode = 'P0001';
  end loop;
  return 0;
end $$;
revoke all on function public.garis_definisi_periksa() from public, anon, authenticated;

-- The backfill: strict, then from the roots outward
do $$
declare n int;
begin
  perform public.garis_definisi_periksa();
  update public.assessment_definitions d set lineage_root_definition_id = d.id
   where not exists (select 1 from public.garis_definisi_pendahulu(d.id));
  loop
    update public.assessment_definitions d set lineage_root_definition_id = p.lineage_root_definition_id
      from public.assessment_definitions p
     where d.lineage_root_definition_id is null and p.id = (select x from public.garis_definisi_pendahulu(d.id) x)
       and p.lineage_root_definition_id is not null;
    get diagnostics n = row_count;
    exit when n = 0;
  end loop;
  if exists (select 1 from public.assessment_definitions where lineage_root_definition_id is null) then
    raise exception 'A3, ruling 46: % definition(s) found no root (a cycle in the course or module chain)',
      (select count(*) from public.assessment_definitions where lineage_root_definition_id is null);
  end if;
end $$;
alter table public.assessment_definitions alter column lineage_root_definition_id set not null;
create index assessment_definitions_lineage_root on public.assessment_definitions (lineage_root_definition_id);

-- The guard: a new definition without a root is its own; a root named is a root of the same school; a root never changes
create function public.definisi_garis_jaga()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if new.lineage_root_definition_id is null or new.lineage_root_definition_id = new.id then
      new.lineage_root_definition_id := new.id;
    elsif not exists (select 1 from public.assessment_definitions r where r.id = new.lineage_root_definition_id
                        and r.lineage_root_definition_id = r.id and r.institution_id = new.institution_id) then
      raise exception 'A3, ruling 46: a definition''s lineage root is a root definition of the same school' using errcode = 'P0001';
    end if;
  elsif new.lineage_root_definition_id is distinct from old.lineage_root_definition_id then
    raise exception 'A3, ruling 46: a definition''s lineage root never changes' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.definisi_garis_jaga() from public, anon, authenticated;
create trigger assessment_definitions_lineage_root before insert or update of lineage_root_definition_id
  on public.assessment_definitions for each row execute function public.definisi_garis_jaga();

CREATE OR REPLACE FUNCTION public.salin_kursus_revisi(p_course uuid, p_new_course uuid, p_actor uuid, p_satu_penulis boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  src record; v_new_course uuid := p_new_course;
  v_mod record; v_new_mod uuid; v_les record; v_new_les uuid;
  v_lo record; v_it record; v_new_item uuid; v_def record; v_version int;
  v_obj uuid[]; v_pg uuid;
  v_lo_map jsonb := '{}'::jsonb;
  v_pg_map jsonb := '{}'::jsonb;
  n_mod int := 0; n_les int := 0; n_lo int := 0; n_item int := 0; n_opt int := 0; n_def int := 0;
begin
  select * into src from public.courses where id = p_course;

  for v_mod in select * from public.modules where course_id = p_course order by ordinal loop
    insert into public.modules
      (course_id, institution_id, ordinal, title, status, author_person_id, supersedes_module_id)
    values (v_new_course, src.institution_id, v_mod.ordinal, v_mod.title, 'INGESTED',
            case when p_satu_penulis then p_actor else coalesce(v_mod.author_person_id, p_actor) end, v_mod.id)
    returning id into v_new_mod;
    n_mod := n_mod + 1;

    for v_les in select * from public.lessons where module_id = v_mod.id order by ordinal loop
      insert into public.lessons
        (module_id, institution_id, ordinal, title, summary, body_markdown, worked_examples,
         media, source_version_id, page_citation, status, author_person_id, supersedes_lesson_id)
      values (v_new_mod, src.institution_id, v_les.ordinal, v_les.title, v_les.summary,
              v_les.body_markdown, v_les.worked_examples, v_les.media, v_les.source_version_id,
              v_les.page_citation, 'INGESTED',
              case when p_satu_penulis then p_actor else coalesce(v_les.author_person_id, p_actor) end, v_les.id)
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

    -- empirical_difficulty, empirical_discrimination and empirical_evidence_count are DELIBERATELY ABSENT: the copy
    -- has no evidence of its own and must not claim another item's. cycle_role is copied (D-085 M10).
    insert into public.items
      (lesson_id, institution_id, item_type, bank_type, stem, stimulus, petunjuk, arah_berpikir,
       objective_ids, is_safety_critical, parallel_group, predicted_difficulty,
       source_version_id, page_citation, status, author_person_id, supersedes_item_id, cycle_role)
    select (select l2.id from public.lessons l2 where l2.supersedes_lesson_id = v_it.lesson_id
              and l2.institution_id = src.institution_id
              and exists (select 1 from public.modules m2
                           where m2.id = l2.module_id and m2.course_id = v_new_course)),
           src.institution_id, v_it.item_type, v_it.bank_type, v_it.stem, v_it.stimulus,
           v_it.petunjuk, v_it.arah_berpikir, coalesce(v_obj, '{}'::uuid[]),
           v_it.is_safety_critical, v_pg, v_it.predicted_difficulty,
           v_it.source_version_id, v_it.page_citation, 'INGESTED',
           case when p_satu_penulis then p_actor else coalesce(v_it.author_person_id, p_actor) end, v_it.id, v_it.cycle_role
    returning id into v_new_item;
    n_item := n_item + 1;

    insert into public.item_options
      (item_id, institution_id, label, body, is_correct, rationale, misconception_code, rationale_withdrawn_by)
    select v_new_item, src.institution_id, o.label, o.body, o.is_correct, o.rationale,
           o.misconception_code, o.rationale_withdrawn_by   -- F1-R1b: the withdrawn state travels with its copy
      from public.item_options o where o.item_id = v_it.id order by o.label;
  end loop;

  select count(*) into n_opt from public.item_options io
    join public.items i on i.id = io.item_id
    join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = v_new_course;

  for v_def in
    select d.* from public.assessment_definitions d
     where not d.is_ad_hoc
       and (d.course_id = p_course
         or d.module_id in (select id from public.modules where course_id = p_course))
  loop
    select coalesce(max(version), 0) + 1 into v_version
      from public.assessment_definitions
     where institution_id = src.institution_id and title = v_def.title and mode = v_def.mode;

    insert into public.assessment_definitions
      (institution_id, course_id, module_id, title, mode, bank_type, version, item_count,
       difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
       shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
       author_person_id, status, is_ad_hoc, lineage_root_definition_id)
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
            case when p_satu_penulis then p_actor else coalesce(v_def.author_person_id, p_actor) end, 'INGESTED', false,
            -- A3, ruling 46: a revision of a definition carries its source's lineage root (the count spans the line)
            v_def.lineage_root_definition_id);
    n_def := n_def + 1;
  end loop;

  perform public.audit_write('COURSE_REVISION_CREATED', 'courses', v_new_course::text,
    src.institution_id,
    jsonb_build_object('source_course_id', p_course, 'new_course_id', v_new_course,
                       'modules', n_mod, 'lessons', n_les, 'learning_objectives', n_lo,
                       'items', n_item, 'item_options', n_opt, 'assessment_definitions', n_def,
                       'empirical_values_copied', 0));
  return v_new_course;
end $function$
;

CREATE OR REPLACE FUNCTION public.save_assessment_definition(p_definition uuid, p_payload jsonb)
 RETURNS TABLE(assessment_definition_id uuid, created_new_version boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_old jsonb := '{}'::jsonb; b record; v_actor uuid; v_inst uuid; v_mode public.assessment_mode;
  v_course uuid; v_module uuid; v_new uuid; v_changed boolean := false; v_version int;
  -- INV-29: the fields whose change alters how an existing result would be
  -- INTERPRETED. Named, not inferred, so adding a field is a decision.
  v_interpretive text[] := array['mode','bank_type','item_count','difficulty_mix',
    'safety_critical_minimum','passing_rules','shuffle_policy','hesitation_window_seconds',
    'allows_pause','offline_tolerant','late_sync_grace_seconds','attempt_limit'];
  v_col text; v_sum int;
  v_stage public.content_status;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'saving a definition requires an authenticated actor'; end if;

  if p_definition is not null then
    select to_jsonb(d) into v_old from public.assessment_definitions d where d.id = p_definition;
    if v_old is null then raise exception 'unknown assessment definition %', p_definition; end if;
    if (v_old ->> 'is_ad_hoc')::boolean then
      raise exception 'an ad-hoc instrument is launched, not configured in the builder (ADR-0011)';
    end if;
    v_inst := (v_old ->> 'institution_id')::uuid;
    v_course := coalesce((p_payload ->> 'course_id')::uuid, (v_old ->> 'course_id')::uuid);
    v_module := coalesce((p_payload ->> 'module_id')::uuid, (v_old ->> 'module_id')::uuid);
    v_mode := coalesce((p_payload ->> 'mode')::public.assessment_mode,
                       (v_old ->> 'mode')::public.assessment_mode);
  else
    v_inst := (p_payload ->> 'institution_id')::uuid;
    v_course := (p_payload ->> 'course_id')::uuid;
    v_module := (p_payload ->> 'module_id')::uuid;
    v_mode := (p_payload ->> 'mode')::public.assessment_mode;
    if v_inst is null or v_mode is null then
      raise exception 'a new definition names its institution and its mode';
    end if;
  end if;

  if not public.can_in_institution('CAN_DRAFT', v_inst) then
    raise exception 'configuring an assessment definition requires CAN_DRAFT in the owning institution';
  end if;
  if num_nonnulls(v_course, v_module) <> 1 then
    raise exception 'a definition is scoped to exactly one of a course or a module';
  end if;

  -- the scope belongs to the same institution; a definition never reaches
  -- across a tenant boundary (INV-13)
  if v_course is not null and not exists (
       select 1 from public.courses c where c.id = v_course and c.institution_id = v_inst) then
    raise exception 'that course belongs to another institution (INV-13)';
  end if;
  if v_module is not null and not exists (
       select 1 from public.modules m where m.id = v_module and m.institution_id = v_inst) then
    raise exception 'that module belongs to another institution (INV-13)';
  end if;

  select * into b from public.assessment_definition_bounds where mode = v_mode;
  if b.mode is null then raise exception 'no platform bounds are published for mode %', v_mode; end if;

  -- INV-29 again, from the other side: the interpretation of a result is the
  -- scoring policy's, and a definition may not name a rule the registry has
  -- never published.
  if (p_payload ? 'passing_rules') and (p_payload -> 'passing_rules') ? 'mastery_min' then
    if not exists (select 1 from public.scoring_policy sp where sp.superseded_by is null) then
      raise exception 'no scoring policy is in force; a passing rule cannot be interpreted';
    end if;
  end if;

  declare
    v_item_count smallint := coalesce((p_payload ->> 'item_count')::smallint,
                                      (v_old ->> 'item_count')::smallint);
    v_hes integer := case when p_payload ? 'hesitation_window_seconds'
                          then (p_payload ->> 'hesitation_window_seconds')::integer
                          else (v_old ->> 'hesitation_window_seconds')::integer end;
    v_grace integer := coalesce((p_payload ->> 'late_sync_grace_seconds')::integer,
                                (v_old ->> 'late_sync_grace_seconds')::integer, 0);
    v_attempt smallint := case when p_payload ? 'attempt_limit'
                               then (p_payload ->> 'attempt_limit')::smallint
                               else (v_old ->> 'attempt_limit')::smallint end;
    v_pause boolean := coalesce((p_payload ->> 'allows_pause')::boolean,
                                (v_old ->> 'allows_pause')::boolean, false);
    v_offline boolean := coalesce((p_payload ->> 'offline_tolerant')::boolean,
                                  (v_old ->> 'offline_tolerant')::boolean, false);
    v_shuffle text := coalesce(p_payload ->> 'shuffle_policy', v_old ->> 'shuffle_policy', 'NONE');
    v_mix jsonb := coalesce(p_payload -> 'difficulty_mix', v_old -> 'difficulty_mix', '{}'::jsonb);
    v_safety smallint := coalesce((p_payload ->> 'safety_critical_minimum')::smallint,
                                  (v_old ->> 'safety_critical_minimum')::smallint, 0);
    v_rules jsonb := coalesce(p_payload -> 'passing_rules', v_old -> 'passing_rules', '{}'::jsonb);
    v_bank public.bank_type := coalesce((p_payload ->> 'bank_type')::public.bank_type,
                                        (v_old ->> 'bank_type')::public.bank_type);
    v_title text := coalesce(p_payload ->> 'title', v_old ->> 'title');
  begin
    if v_item_count is null or v_item_count < b.item_count_min or v_item_count > b.item_count_max then
      raise exception 'mode % carries between % and % questions, not %',
        v_mode, b.item_count_min, b.item_count_max, v_item_count;
    end if;
    if v_hes is not null and (v_hes < b.hesitation_window_min or v_hes > b.hesitation_window_max) then
      raise exception 'the hesitation window for mode % is between % and % seconds, not %',
        v_mode, b.hesitation_window_min, b.hesitation_window_max, v_hes;
    end if;
    if v_grace > b.late_sync_grace_max then
      raise exception 'the late-sync grace for mode % is at most % seconds, not %',
        v_mode, b.late_sync_grace_max, v_grace;
    end if;
    if v_attempt is not null and b.attempt_limit_max is not null and v_attempt > b.attempt_limit_max then
      raise exception 'mode % permits at most % attempt(s), not %', v_mode, b.attempt_limit_max, v_attempt;
    end if;
    if v_pause and not b.allows_pause_permitted then
      raise exception 'mode % does not pause', v_mode;
    end if;
    if v_offline and not b.offline_tolerant_permitted then
      raise exception 'mode % does not tolerate an offline client', v_mode;
    end if;
    if v_shuffle not in ('NONE','ITEMS','ITEMS_AND_OPTIONS') then
      raise exception 'unknown shuffle policy %', v_shuffle;
    end if;
    if v_title is null or btrim(v_title) = '' then
      raise exception 'a definition carries a title a teacher can recognise';
    end if;
    -- the difficulty mix is a set of counts and must add up to the paper
    select coalesce(sum((value)::int), 0) into v_sum from jsonb_each_text(v_mix);
    if v_sum <> 0 and v_sum <> v_item_count then
      raise exception 'the difficulty mix totals % but the paper carries % questions', v_sum, v_item_count;
    end if;
    if v_safety > v_item_count then
      raise exception 'the safety-critical minimum (%) exceeds the paper size (%)', v_safety, v_item_count;
    end if;

    if p_definition is null then
      -- FD-9: a new rule, or a new version of one, is set while its chapter is still being drafted
      select c.status into v_stage from public.courses c
       where c.id = coalesce(v_course, (select m.course_id from public.modules m where m.id = v_module));
      if v_stage is distinct from 'INGESTED' then
        raise exception 'a rule is set while its chapter is still being drafted; this chapter is %', coalesce(v_stage::text, 'unknown');
      end if;
      select coalesce(max(version), 0) + 1 into v_version from public.assessment_definitions
       where institution_id = v_inst and title = v_title and mode = v_mode;
      insert into public.assessment_definitions
        (institution_id, course_id, module_id, title, mode, bank_type, version, item_count,
         difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
         shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
         author_person_id, status, is_ad_hoc)
      values (v_inst, v_course, v_module, v_title, v_mode, v_bank, v_version, v_item_count,
              v_mix, v_safety, v_rules, v_hes, v_shuffle, v_pause, v_offline, v_grace, v_attempt,
              v_actor, 'INGESTED', false)
      returning id into v_new;
      v_changed := true;
    else
      -- INV-29: does this change alter interpretation?
      foreach v_col in array v_interpretive loop
        if (jsonb_build_object('mode', v_mode, 'bank_type', v_bank, 'item_count', v_item_count,
              'difficulty_mix', v_mix, 'safety_critical_minimum', v_safety, 'passing_rules', v_rules,
              'shuffle_policy', v_shuffle, 'hesitation_window_seconds', v_hes,
              'allows_pause', v_pause, 'offline_tolerant', v_offline,
              'late_sync_grace_seconds', v_grace, 'attempt_limit', v_attempt) -> v_col)
           is distinct from (v_old -> v_col) then
          v_changed := true;
        end if;
      end loop;

      if v_changed then
        -- FD-9: a new rule, or a new version of one, is set while its chapter is still being drafted
        select c.status into v_stage from public.courses c
         where c.id = coalesce(v_course, (select m.course_id from public.modules m where m.id = v_module));
        if v_stage is distinct from 'INGESTED' then
          raise exception 'a rule is set while its chapter is still being drafted; this chapter is %', coalesce(v_stage::text, 'unknown');
        end if;
        select coalesce(max(version), 0) + 1 into v_version from public.assessment_definitions
         where institution_id = v_inst and title = v_title and mode = v_mode;
        insert into public.assessment_definitions
          (institution_id, course_id, module_id, title, mode, bank_type, version, item_count,
           difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
           shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
           author_person_id, status, is_ad_hoc, lineage_root_definition_id)
        values (v_inst, v_course, v_module, v_title, v_mode, v_bank, v_version, v_item_count,
                v_mix, v_safety, v_rules, v_hes, v_shuffle, v_pause, v_offline, v_grace, v_attempt,
                v_actor, 'INGESTED', false,
                -- A3, ruling 46: a new version of this definition is on its line (the count spans the line)
                (select d.lineage_root_definition_id from public.assessment_definitions d where d.id = p_definition))
        returning id into v_new;
      else
        update public.assessment_definitions set title = v_title where id = p_definition;
        v_new := p_definition;
      end if;
    end if;

    perform public.audit_write(
      case when p_definition is null then 'ASSESSMENT_DEFINITION_CREATED'
           when v_changed then 'ASSESSMENT_DEFINITION_VERSIONED'
           else 'ASSESSMENT_DEFINITION_RELABELLED' end,
      'assessment_definitions', v_new::text, v_inst,
      jsonb_build_object('from_definition', p_definition, 'mode', v_mode,
                         'interpretation_changed', v_changed));
  end;

  assessment_definition_id := v_new;
  created_new_version := v_changed;
  return next;
end $function$
;

CREATE OR REPLACE FUNCTION public.may_start_assessment(p_assessment_assignment uuid)
 RETURNS TABLE(ok boolean, reason text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_aa public.assessment_assignments; v_d public.assessment_definitions;
  v_person uuid; v_enrol uuid; v_attempts integer;
begin
  v_person := public.current_person_id();
  if v_person is null then ok := false; reason := 'NO_PERSON'; return next; return; end if;
  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  if v_aa.id is null then ok := false; reason := 'UNKNOWN_ASSIGNMENT'; return next; return; end if;
  if v_aa.status <> 'OPEN' then
    ok := false; reason := 'ASSIGNMENT_' || v_aa.status::text; return next; return;
  end if;
  if (v_aa.opens_at is not null and now() < v_aa.opens_at)
     or (v_aa.closes_at is not null and now() >= v_aa.closes_at) then
    ok := false; reason := 'OUTSIDE_WINDOW'; return next; return;
  end if;
  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id
     and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;
  if v_enrol is null then ok := false; reason := 'NO_ACTIVE_ENROLMENT'; return next; return; end if;
  -- ACTIVE membership under the assigned node: PUBLISH is not ASSIGN, and an
  -- assignment reaches a learner only through the class or cohort they are in.
  if not exists (select 1 from public.memberships m
                   join public.org_nodes n on n.id = m.node_id
                  where m.enrollment_id = v_enrol and m.valid_to is null
                    and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id])) then
    ok := false; reason := 'NO_ACTIVE_MEMBERSHIP'; return next; return;
  end if;
  -- C1w (O41-11): a release its publisher withdrew starts no new sitting
  if v_aa.learning_assignment_id is not null and exists (select 1 from public.learning_assignments la
       join public.plp_releases rr on rr.id = la.plp_release_id
      where la.id = v_aa.learning_assignment_id and rr.withdrawn_at is not null) then
    ok := false; reason := 'RELEASE_WITHDRAWN'; return next; return;
  end if;
  select * into v_d from public.assessment_definitions where id = v_aa.assessment_definition_id;
  if v_d.attempt_limit is not null then
    select count(*) into v_attempts from public.assessment_sessions s
     where s.person_id = v_person
       -- owner ruling 1 (20270113140000): the same assessment under any assignment, not this assignment alone
       and (s.assessment_assignment_id = p_assessment_assignment
            -- A3, ruling 46 (the owner, 17 Nov): attempt limits apply across published versions of the same assessment.
            -- A sitting keeps its own definition and version (never rewritten); only the count spans the line.
            or (s.assessment_definition_id in (select x.id from public.assessment_definitions x
                                                 where x.lineage_root_definition_id = v_d.lineage_root_definition_id)
                -- owner ruling (10 Nov): another assignment counts within one school and one school year
                and s.institution_id = v_aa.institution_id
                and exists (select 1 from public.assessment_assignments a2 where a2.id = s.assessment_assignment_id
                              and a2.academic_period_id is not distinct from v_aa.academic_period_id)))
       -- Sharon F2 and addendum (20270113140000): an ending by the school's own act is not an attempt
       and coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION');
    -- A1 (O41-16): one more start for each independently approved request
    if v_attempts >= v_d.attempt_limit + public.percobaan_izin_jumlah(v_person, p_assessment_assignment) then
      ok := false; reason := 'ATTEMPT_LIMIT_REACHED'; return next; return;
    end if;
  end if;
  -- ADDED IN 20261229100000 (W6.10, D-186; ADM-15). The Uji Penguasaan of a chapter given with a Pemetaan Awal waits
  -- for that Pemetaan Awal to be finished. The screens held this order; a direct call did not.
  if v_aa.learning_assignment_id is not null and v_d.mode = 'POST_TEST'
     and exists (select 1 from public.assessment_assignments a
                   join public.assessment_definitions d on d.id = a.assessment_definition_id
                  where a.learning_assignment_id = v_aa.learning_assignment_id and d.mode = 'PRE_TEST')
     and not exists (select 1 from public.assessment_sessions s
                      where s.person_id = v_person and s.learning_assignment_id = v_aa.learning_assignment_id
                        and s.mode = 'PRE_TEST' and s.status = 'FINALIZED') then
    ok := false; reason := 'PRE_TEST_NOT_FINALIZED'; return next; return;
  end if;
  -- A2b, the place and T−15 (Sharon: the same answer as the sitting-insert trigger, for the screen)
  reason := (public.maintenance_mulai_tolak(v_person,
               coalesce((select m.node_id from public.memberships m join public.org_nodes n on n.id = m.node_id
                          where m.enrollment_id = v_enrol and m.valid_to is null and n.kind = 'CLASS'
                            and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]) order by m.valid_from desc limit 1),
                        v_aa.node_id))).kode;
  if reason is not null then ok := false; return next; return; end if;
  ok := true; reason := 'OK'; return next;
end $function$
;

CREATE OR REPLACE FUNCTION public.start_learning_session(p_assessment_assignment uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_person uuid; v_ok boolean; v_reason text;
  v_aa public.assessment_assignments; v_la public.learning_assignments;
  v_d public.assessment_definitions; v_enrol uuid; v_session uuid;
  v_deadline timestamptz; v_cohort uuid; v_class uuid;
  v_release uuid; v_course uuid;
  v_kunci_def uuid;
begin
  v_person := public.current_person_id();
  -- CORRECTED IN PLACE (undeployed; Sharon §13 on 6faef690, Low): a share lock on the assessment assignment, so
  -- «Akhiri penugasan» (which locks it for update before it counts open sittings) never misses a start under way.
  -- A3-R1 (Sharon, 16 Nov 22:37, 5ac3645d): taken FIRST, before the start's key is read. An assignment's definition is
  -- moved by the release move and by koreksi_kunci_pindah (C1w), each holding this row FOR UPDATE; under the share lock
  -- no move can commit, so the key read below is the definition this start will count and sit (F37-R03).
  -- A3-R1 (Sharon, 16 Nov 22:46, 78b4de2d; F37-R04): and BEFORE IT, the learning assignment FOR KEY SHARE, when the
  -- assignment has one. «Akhiri penugasan» and both moves lock the learning assignment FOR UPDATE and then its assessment
  -- assignments; a start that held its assessment assignment and then needed the learning assignment (the sitting's
  -- foreign key takes it FOR KEY SHARE) could deadlock with «Akhiri» (proven: F37-R04 on eaa37aea). Taken first, the
  -- start queues behind «Akhiri» before it holds anything «Akhiri» waits for, and the insert's KEY SHARE is already held.
  -- An assignment's learning_assignment_id is never updated (only filtered on), so the unlocked read of it is safe; an
  -- ad-hoc assignment has none and takes no lock here.
  perform 1 from public.learning_assignments
   where id = (select aa.learning_assignment_id from public.assessment_assignments aa where aa.id = p_assessment_assignment)
     for key share;
  perform 1 from public.assessment_assignments where id = p_assessment_assignment for share;
  -- A3-R1 (Sharon's N-5, A3-PREBUILD-ac25e9b1.md §2; F37-R02): ONE START AT A TIME PER LEARNER AND ASSESSMENT, keyed by
  -- what the attempt count counts. may_start_assessment counts the learner's sittings of this definition and version
  -- under ANY assignment in the school and year (20270113140000), so a lock per (learner, assignment) let two starts on
  -- two open assignments of one definition take different locks and both insert (proven: two sittings against a limit
  -- of one). A3, ruling 46: the key is (learner, the definition's LINEAGE ROOT), read under the share lock above, the
  -- scope of may_start's count, which spans an assessment's published versions. The assignment's definition cannot
  -- move while the share lock is held, and a definition's lineage root never changes (assessment_definitions_lineage_root,
  -- A3-LN1); a version is not part of the key (an ad-hoc definition's version is mutable). Held to the end of the
  -- transaction, so the second start counts the first
  -- sitting and is refused; taken before the count, as SI-D02's was. No deadlock (Sharon, 5ac3645d): starts share the
  -- assignment row and then serialise on the key; the moves and «Akhiri» wait on the share lock and take no advisory
  -- lock; no start waits on an assignment while it holds a key. An unknown assignment has no key and takes no lock;
  -- may_start refuses it (UNKNOWN_ASSIGNMENT).
  if v_person is not null then
    select d.lineage_root_definition_id into v_kunci_def
      from public.assessment_assignments a join public.assessment_definitions d on d.id = a.assessment_definition_id
     where a.id = p_assessment_assignment;
    if v_kunci_def is not null then
      perform pg_advisory_xact_lock(hashtextextended(
        'start_learning_session:garis:' || v_person::text || ':' || v_kunci_def::text, 0));
    end if;
  end if;
  select e.ok, e.reason into v_ok, v_reason from public.may_start_assessment(p_assessment_assignment) e;
  -- A2b start-path: the maintenance refusals by their own code, as the sitting-insert trigger raises them
  if not v_ok and v_reason = 'MAINTENANCE_PLACE' then perform public.maintenance_tolak_tempat(); end if;
  if not v_ok and v_reason = 'MAINTENANCE_NO_NEW_START' then perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START'); end if;
  if not v_ok then raise exception 'cannot start this assessment: % (INV-27)', v_reason; end if;

  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  select * into v_d  from public.assessment_definitions where id = v_aa.assessment_definition_id;

  -- CHANGED IN 0062. An ad-hoc assignment names no learning assignment by
  -- construction, and until then that refusal ended the Quick Assessment flow
  -- before a learner could answer anything. Everything else about the session
  -- is unchanged: same opener, same assembler, same provenance guard, same
  -- evidence derivation.
  if v_aa.learning_assignment_id is null and not coalesce(v_d.is_ad_hoc, false) then
    raise exception 'this phase starts learning-cycle sessions only; the assignment names no learning assignment';
  end if;
  if v_aa.learning_assignment_id is not null then
    select * into v_la from public.learning_assignments where id = v_aa.learning_assignment_id;
    if v_la.status <> 'ACTIVE' then
      raise exception 'the learning assignment is % and assigns nothing', v_la.status;
    end if;
  end if;

  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;

  -- the learner's own class/cohort under the assigned node, for exposure
  -- cooling and cohort aggregates
  select (array_agg(n.id) filter (where n.kind = 'CLASS'))[1],
         (array_agg(n.id) filter (where n.kind = 'COHORT'))[1]
    into v_class, v_cohort
    from public.memberships m join public.org_nodes n on n.id = m.node_id
   where m.enrollment_id = v_enrol and m.valid_to is null
     and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]);

  -- owner decision 5 (9 Nov): the sitting records the Angkatan that applies NOW, at the sitting. A learner PINTAR
  -- places is a member of a Kelas, never of the COHORT node, so the class's own Angkatan (the nearest COHORT above it
  -- in the structure as it stands at this moment) is the learner's. Recorded once, immutable (INV-33): a later move
  -- of the class or the learner never rewrites it.
  -- With a class, its Angkatan is the one recorded, whatever other membership the learner holds; open_assessment_session
  -- checks it again where it is written (Sharon's finding 3).
  if v_class is not null then
    v_cohort := null;
    select n.id into v_cohort
      from public.org_nodes k join public.org_nodes n on n.id = any (k.jalur) and n.kind = 'COHORT'
     where k.id = v_class
     order by array_position(k.jalur, n.id) desc limit 1;
  end if;

  if v_aa.closes_at is not null then v_deadline := v_aa.closes_at; end if;

  if v_aa.learning_assignment_id is not null then
    -- the release is the one the LEARNING assignment binds, never "the newest"
    v_release := v_la.plp_release_id;
    -- ADDED IN 0102. An ACTIVE assignment is not a licence to write evidence
    -- over content that can still be edited. The ad-hoc arm below has asked
    -- this question since 0063; this arm never did, so a school could answer
    -- its own unfinished chapter and the session's release binding -- the
    -- frozen answer to "what did this learner see" -- pinned nothing. Same
    -- rule, one predicate, both arms.
    if not public.release_starts_new_sessions(v_release) then
      raise exception
        'this assignment is over material that cannot begin a new attempt: the chapter it binds has not been published';
    end if;
  else
    -- ADDED IN 0062, CORRECTED IN 0063, NARROWED CORRECTLY IN 0064. An ad-hoc
    -- paper binds a module or a course, not a release, so the release is
    -- resolved from the content the definition is bound to: this school's own
    -- release of that course, or -- for canonical content -- one it holds an
    -- ACTIVE grant for.
    --
    -- `status in ('PUBLISHED','SUPERSEDED')` is "sealed, AND was published",
    -- which is exactly what the session binding needs and nothing more. Sealed,
    -- because `enforce_taught_content_immutable` only fires on a sealed course
    -- and an unsealed release therefore pins nothing (that was F1). Published,
    -- because doc 08 puts publication upstream of use -- so FROZEN, the one
    -- sealed status that was never published, stays refused.
    --
    -- SUPERSEDED is admitted deliberately. Release status gates new sessions
    -- nowhere else in this system, correction is never automatic here
    -- (ADR-0016), and the audited lever for "stop using this" is withdrawing the
    -- DISTRIBUTION, which `release_is_distributed_to` already enforces below.
    --
    -- That predicate is the same one the session guard re-applies immediately
    -- afterwards, so a grant withdrawn between launch and start refuses here
    -- rather than producing a session the guard would then reject.
    select coalesce(v_d.course_id, m.course_id) into v_course
      from public.modules m where m.id = v_d.module_id;
    if v_course is null then v_course := v_d.course_id; end if;
    select r.id into v_release
      from public.plp_releases r
     where r.course_id = v_course
       and r.status in ('PUBLISHED', 'SUPERSEDED') and r.withdrawn_at is null   -- C1w (O41-11)
       and (r.institution_id = v_aa.institution_id
         or public.release_is_distributed_to(r.id, v_aa.institution_id))
     -- a live PUBLISHED release wins over a SUPERSEDED one for the same course:
     -- `published_at desc nulls last` puts the later publication first.
     order by (r.institution_id = v_aa.institution_id) desc,
              (r.status = 'PUBLISHED') desc,
              r.published_at desc nulls last, r.created_at desc
     limit 1;
    -- C1w (O41-11): the material its publisher withdrew starts no new sitting, said as may_start_assessment says it
    if v_release is null and exists (select 1 from public.plp_releases r where r.course_id = v_course and r.withdrawn_at is not null
         and (r.institution_id = v_aa.institution_id or public.release_is_distributed_to(r.id, v_aa.institution_id))) then
      raise exception 'cannot start this assessment: RELEASE_WITHDRAWN (INV-27)';
    end if;
    if v_release is null then
      raise exception
        'this quick assessment is over material this school cannot use right now: either the chapter has not been published, or it is no longer shared with you';
    end if;
  end if;

  v_session := public.open_assessment_session(
    v_enrol, v_d.id, v_release, 'ONLINE', v_d.mode,
    public.engine_version(), public.scoring_policy_version(),
    v_class, v_cohort, v_deadline, v_aa.learning_assignment_id, v_aa.id);

  perform public.percobaan_tandai(v_session);   -- A1 (O41-16): a granted attempt is marked
  perform public.assemble_session(v_session);
  return v_session;
end $function$
;

-- ADR-0021: each function this migration (re)defines has EXECUTE revoked from PUBLIC here, and keeps exactly its grants
revoke all on function public.salin_kursus_revisi(uuid, uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.salin_kursus_revisi(uuid, uuid, uuid, boolean) to service_role;
revoke all on function public.save_assessment_definition(uuid, jsonb) from public, anon;
grant execute on function public.save_assessment_definition(uuid, jsonb) to authenticated, service_role;
revoke all on function public.may_start_assessment(uuid) from public, anon;
grant execute on function public.may_start_assessment(uuid) to authenticated, service_role;
revoke all on function public.start_learning_session(uuid) from public, anon;
grant execute on function public.start_learning_session(uuid) to authenticated, service_role;

do $$
declare v text;
begin
  if exists (select 1 from public.assessment_definitions d where not exists (
       select 1 from public.assessment_definitions r where r.id = d.lineage_root_definition_id
          and r.lineage_root_definition_id = r.id and r.institution_id = d.institution_id)) then
    raise exception 'A3, ruling 46: a definition''s lineage root is not a root of its own school';
  end if;
  perform public.garis_definisi_periksa();
  v := (select prosrc from pg_proc where oid = 'public.start_learning_session(uuid)'::regprocedure);
  if position('start_learning_session:garis:' in v) = 0 or position('select d.lineage_root_definition_id into v_kunci_def' in v) = 0
     or position('v_kunci_versi' in v) > 0 then
    raise exception 'A3, ruling 46: the start''s key is not the lineage root';
  end if;
  if position('for key share' in v) = 0 or position('for key share' in v) > position('for share' in v)
     or position('for share' in v) > position('select d.lineage_root_definition_id into v_kunci_def' in v)
     or position('select d.lineage_root_definition_id into v_kunci_def' in v) > position('perform pg_advisory_xact_lock(' in v)
     or position('perform pg_advisory_xact_lock(' in v) > position('from public.may_start_assessment(' in v) then
    raise exception 'A3, ruling 46: the start''s lock order moved (Sharon, 78b4de2d)';
  end if;
  v := (select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure);
  if position('x.lineage_root_definition_id = v_d.lineage_root_definition_id' in v) = 0 or position('assessment_definition_version = v_d.version' in v) > 0 then
    raise exception 'A3, ruling 46: may_start does not count across the line';
  end if;
  if position('v_def.lineage_root_definition_id' in (select prosrc from pg_proc where oid = 'public.salin_kursus_revisi(uuid,uuid,uuid,boolean)'::regprocedure)) = 0
     or position('where d.id = p_definition))' in (select prosrc from pg_proc where oid = 'public.save_assessment_definition(uuid,jsonb)'::regprocedure)) = 0 then
    raise exception 'A3, ruling 46: a revision or a new version does not carry its root';
  end if;
end $$;

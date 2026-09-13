-- 0054 -- course revision by copy-forward, with lineage (E1).
--
-- THE PROBLEM. FABLE-05 §6 requires a SUPERSEDED chain and §7 requires a v1.0
-- -> v1.1 correction on a live assignment. Neither was buildable: once a course
-- is sealed, `content_is_sealed` and `enforce_taught_content_immutable` refuse
-- every edit, and there was no other way to produce a successor. A correction
-- had nowhere to go.
--
-- THE SHAPE YAZID APPROVED (2026-09-13, E1). A correction is a NEW COURSE,
-- deep-copied from the sealed one, carrying a lineage pointer on every node it
-- creates. The original is preserved permanently and stays immutable; every
-- session, result and certificate already bound to it stays bound to it. The
-- successor follows the ordinary lifecycle and its release chains to the
-- predecessor through the existing `plp_releases.supersedes_release_id`.
--
-- THIS WORKS *AROUND* IMMUTABILITY, NEVER THROUGH IT. Nothing here relaxes
-- `content_is_sealed` or `enforce_taught_content_immutable`; both are untouched
-- and both still refuse every write to the predecessor. The revision only ever
-- INSERTs, into a new course that is not sealed, which is why the seal needs no
-- exception. The terminal block proves the predecessor's stored content hash is
-- byte-identical before and after.
--
-- WHY LINEAGE IS SET AT COPY TIME AND NOWHERE ELSE. Only the copy knows which
-- new row corresponds to which old one. An hour later nothing does -- titles
-- and ordinals are not identities and a revision is expected to change them. It
-- is cheap now and impossible to backfill, so all five pointers are set here.
--
-- ONE READING, FLAGGED FOR THE AUDITOR. The brief says the revision lands "at
-- DRAFT". The content lifecycle has no DRAFT state; its entry state is
-- INGESTED, and `enforce_content_status` refuses any other status at insert
-- (INV-22). I read "DRAFT" as the brief's calm-surface word for the entry state
-- rather than a demand for a tenth status, and the copy lands at INGESTED. A
-- new status would have been a state-machine change nobody asked for. ADR-0016.
--
-- EMPIRICAL VALUES ARE NOT COPIED. A revised item has no evidence of its own.
-- Carrying `empirical_difficulty` forward would state a measurement that was
-- never taken on that item -- the fabricated-empirical-value failure doc 02
-- forbids by name. Asserted below, and again in F05-T13.

alter table public.courses
  add column supersedes_course_id uuid references public.courses(id);
alter table public.modules
  add column supersedes_module_id uuid references public.modules(id);
alter table public.lessons
  add column supersedes_lesson_id uuid references public.lessons(id);
alter table public.learning_objectives
  add column supersedes_learning_objective_id uuid references public.learning_objectives(id);
alter table public.items
  add column supersedes_item_id uuid references public.items(id);

alter table public.courses
  add constraint courses_lineage_is_not_self check (supersedes_course_id <> id);
alter table public.modules
  add constraint modules_lineage_is_not_self check (supersedes_module_id <> id);
alter table public.lessons
  add constraint lessons_lineage_is_not_self check (supersedes_lesson_id <> id);
alter table public.learning_objectives
  add constraint learning_objectives_lineage_is_not_self
  check (supersedes_learning_objective_id <> id);
alter table public.items
  add constraint items_lineage_is_not_self check (supersedes_item_id <> id);

create index courses_supersedes on public.courses (supersedes_course_id)
  where supersedes_course_id is not null;
create index items_supersedes on public.items (supersedes_item_id)
  where supersedes_item_id is not null;

comment on column public.courses.supersedes_course_id is
  'The sealed course this one was copied forward from (E1, ADR-0016). Set at copy '
  'time, immutable, acyclic. item_options inherit lineage through their item.';

-- ---------------------------------------------------------------------------
-- 1. Lineage is immutable and acyclic.
--
-- A generic trigger rather than five near-identical ones: the column name is
-- the trigger argument, so a sixth lineage column later is one line, not a
-- sixth copy of the same logic that can drift from the other five.
-- ---------------------------------------------------------------------------
create function public.enforce_lineage_pointer() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_col text := tg_argv[0]; v_new jsonb := to_jsonb(new); v_old jsonb;
  v_target uuid; v_cursor uuid; v_depth int := 0;
begin
  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception
        '%.% is lineage: it is set when the row is copied and never afterwards (ADR-0016)',
        tg_table_name, v_col;
    end if;
    return new;
  end if;

  v_target := (v_new ->> v_col)::uuid;
  if v_target is null then return new; end if;

  -- Walk the chain the new pointer joins. A pointer is set at insert to a row
  -- that already exists, so the graph is a DAG by construction -- but "by
  -- construction" is an argument, and this is a check.
  v_cursor := v_target;
  while v_cursor is not null loop
    v_depth := v_depth + 1;
    if v_depth > 64 then
      raise exception 'lineage chain on %.% is deeper than 64; refusing as a probable cycle',
        tg_table_name, v_col;
    end if;
    if v_cursor = (v_new ->> 'id')::uuid then
      raise exception 'a lineage chain may not cycle (%.%)', tg_table_name, v_col;
    end if;
    execute format('select %I from public.%I where id = $1', v_col, tg_table_name)
      into v_cursor using v_cursor;
  end loop;
  return new;
end $$;
revoke all on function public.enforce_lineage_pointer() from public, anon, authenticated;

create trigger courses_lineage before insert or update on public.courses
  for each row execute function public.enforce_lineage_pointer('supersedes_course_id');
create trigger modules_lineage before insert or update on public.modules
  for each row execute function public.enforce_lineage_pointer('supersedes_module_id');
create trigger lessons_lineage before insert or update on public.lessons
  for each row execute function public.enforce_lineage_pointer('supersedes_lesson_id');
create trigger learning_objectives_lineage before insert or update on public.learning_objectives
  for each row execute function public.enforce_lineage_pointer('supersedes_learning_objective_id');
create trigger items_lineage before insert or update on public.items
  for each row execute function public.enforce_lineage_pointer('supersedes_item_id');

-- ---------------------------------------------------------------------------
-- 2. The chain, read in both directions.
--
-- "A course in this course's lineage chain" means ancestors, descendants and
-- itself -- a release correction can go forward to a successor and, if a
-- revision is abandoned, back to the predecessor it came from. One definition,
-- because 0055's widened release-move check and the Studio surface must not be
-- able to disagree about what the chain is.
-- ---------------------------------------------------------------------------
create function public.course_lineage_chain(p_course uuid)
returns table (course_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  with recursive up as (
    select c.id, c.supersedes_course_id, 0 as depth
      from public.courses c where c.id = p_course
    union all
    select c.id, c.supersedes_course_id, up.depth + 1
      from public.courses c join up on c.id = up.supersedes_course_id
     where up.depth < 64
  ), down as (
    select c.id, 0 as depth from public.courses c where c.id = p_course
    union all
    select c.id, down.depth + 1
      from public.courses c join down on c.supersedes_course_id = down.id
     where down.depth < 64
  )
  select id from up
  union
  select id from down
$$;
revoke all on function public.course_lineage_chain(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. The revision operation.
-- ---------------------------------------------------------------------------
create function public.create_course_revision(p_course uuid)
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
  select count(*) into n_open from public.courses c
   where c.supersedes_course_id = p_course
     and c.status not in ('PUBLISHED', 'SUPERSEDED');
  if n_open > 0 then
    raise exception 'an open revision of this course already exists; finish or abandon it first';
  end if;

  insert into public.courses
    (institution_id, subject, stage, grade_label, title, status,
     author_person_id, supersedes_course_id)
  values (src.institution_id, src.subject, src.stage, src.grade_label, src.title, 'INGESTED',
          v_actor, p_course)
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
       source_version_id, page_citation, status, author_person_id, supersedes_item_id)
    select (select l2.id from public.lessons l2 where l2.supersedes_lesson_id = v_it.lesson_id
              and l2.institution_id = src.institution_id
              and exists (select 1 from public.modules m2
                           where m2.id = l2.module_id and m2.course_id = v_new_course)),
           src.institution_id, v_it.item_type, v_it.bank_type, v_it.stem, v_it.stimulus,
           v_it.petunjuk, v_it.arah_berpikir, coalesce(v_obj, '{}'::uuid[]),
           v_it.is_safety_critical, v_pg, v_it.predicted_difficulty,
           v_it.source_version_id, v_it.page_citation, 'INGESTED',
           coalesce(v_it.author_person_id, v_actor), v_it.id
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
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('create_course_revision', 'STAFF',
   'Deep-copies a sealed course into a new INGESTED course with lineage on every node. '
   'CAN_DRAFT in the OWNING institution, so only PINTAR revises canonical content and only '
   'a school revises its own. Copies no empirical value and no ad-hoc definition. Audited.');

-- ---------------------------------------------------------------------------
-- Terminal verification. Builds a whole course, revises it, and rolls it all
-- back (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  v_inst uuid; v_uid uuid; v_person uuid; v_reviewer uuid; v_node uuid;
  v_course uuid; v_mod uuid; v_les uuid; v_lo1 uuid; v_lo2 uuid; v_item uuid;
  v_rev uuid; n int; v_raised boolean; v_hash_before text; v_hash_after text;
  v_period uuid;
begin
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe inst 0054', 'probe-inst-0054', true, true) returning id into v_inst;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0054@local.invalid')
    returning id into v_uid;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;

    -- the institution's root node is created by institutions_after_insert
    select id into v_node from public.org_nodes where id = v_inst;
    if v_node is null then raise exception 'the probe institution has no root node'; end if;

    -- The grant is made BEFORE the actor's own claim is set, through the
    -- declared synthetic-seed path, because INV-16 refuses a self-grant and a
    -- migration has no second authenticated administrator to act as.
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, 'INSTITUTION_ADMIN', v_node, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);

    if not public.can_in_institution('CAN_DRAFT', v_inst) then
      raise exception 'the probe actor does not hold CAN_DRAFT; every probe below would be vacuous';
    end if;

    -- a small but complete course
    insert into public.courses (institution_id, subject, stage, grade_label, title, status)
    values (v_inst, 'Matematika', 'SMA', 'X', 'probe course 0054', 'INGESTED') returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title, status)
    values (v_course, v_inst, 1, 'probe module', 'INGESTED') returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, status)
    values (v_mod, v_inst, 1, 'probe lesson', 'INGESTED') returning id into v_les;
    insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
    values (v_les, v_inst, 'TP-1', 'probe objective one', 'UNDERSTAND', true) returning id into v_lo1;
    insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
    values (v_les, v_inst, 'TP-2', 'probe objective two', 'APPLY', false) returning id into v_lo2;

    insert into public.items
      (lesson_id, institution_id, item_type, bank_type, stem, objective_ids, status,
       predicted_difficulty, empirical_difficulty, empirical_discrimination, empirical_evidence_count)
    values (v_les, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'probe stem', array[v_lo1, v_lo2], 'INGESTED',
            0.5, 0.42, 0.31, 128)
    returning id into v_item;
    insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale)
    values (v_item, v_inst, 'A', 'right', true, 'because'),
           (v_item, v_inst, 'B', 'wrong', false, 'misconception');

    -- an unsealed course is refused
    v_raised := false;
    begin
      perform public.create_course_revision(v_course);
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'an unsealed course was revised; it should be edited directly';
      end if;
      if sqlerrm !~ 'not sealed' then
        raise exception 'the unsealed course was refused for the wrong reason: %', sqlerrm;
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the unsealed probe did not run'; end if;

    -- seal it the way the system does: a release reaching FROZEN
    insert into public.plp_releases (institution_id, course_id, version_label, status)
    values (v_inst, v_course, '1.0.0', 'INGESTED');
    update public.plp_releases set status = 'STRUCTURED' where course_id = v_course;
    update public.plp_releases set status = 'VALIDATED' where course_id = v_course;
    update public.plp_releases set status = 'IN_REVIEW' where course_id = v_course;
    insert into public.persons (display_name) values ('probe reviewer 0054') returning id into v_reviewer;
    update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_reviewer
     where course_id = v_course;
    update public.plp_releases set status = 'FROZEN' where course_id = v_course;

    if not public.content_is_sealed(v_course) then raise exception 'the probe course did not seal'; end if;
    select content_sha256 into v_hash_before from public.plp_releases where course_id = v_course;
    if v_hash_before is null then raise exception 'freezing did not stamp a content hash'; end if;

    -- the revision
    v_rev := public.create_course_revision(v_course);
    if v_rev is null then raise exception 'create_course_revision returned nothing'; end if;

    -- every node carries lineage
    select count(*) into n from public.courses where id = v_rev and supersedes_course_id = v_course
      and status = 'INGESTED' and institution_id = v_inst;
    if n <> 1 then raise exception 'the revision course is not shaped as ADR-0016 requires'; end if;
    select count(*) into n from public.modules where course_id = v_rev and supersedes_module_id is null;
    if n <> 0 then raise exception '% copied module(s) carry no lineage', n; end if;
    select count(*) into n from public.lessons l join public.modules m on m.id = l.module_id
     where m.course_id = v_rev and l.supersedes_lesson_id is null;
    if n <> 0 then raise exception '% copied lesson(s) carry no lineage', n; end if;
    select count(*) into n from public.learning_objectives lo
      join public.lessons l on l.id = lo.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id = v_rev and lo.supersedes_learning_objective_id is null;
    if n <> 0 then raise exception '% copied objective(s) carry no lineage', n; end if;
    select count(*) into n from public.items i
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id = v_rev and i.supersedes_item_id is null;
    if n <> 0 then raise exception '% copied item(s) carry no lineage', n; end if;

    -- THE required assertion: no empirical value crossed over
    select count(*) into n from public.items i
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id = v_rev
       and (i.empirical_difficulty is not null or i.empirical_discrimination is not null
         or i.empirical_evidence_count is not null);
    if n <> 0 then
      raise exception '% revised item(s) inherited an empirical value they have no evidence for', n;
    end if;
    -- and the source still has its own, untouched
    select count(*) into n from public.items where id = v_item and empirical_difficulty = 0.42;
    if n <> 1 then raise exception 'the revision disturbed the source item''s empirical values'; end if;

    -- objective_ids were remapped to the COPIES, not left pointing at the original
    select count(*) into n from public.items i
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id = v_rev and (v_lo1 = any (i.objective_ids) or v_lo2 = any (i.objective_ids));
    if n <> 0 then raise exception 'a revised item still names the predecessor''s objectives'; end if;
    select count(*) into n from public.items i
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id = v_rev and cardinality(i.objective_ids) = 2;
    if n <> 1 then raise exception 'the revised item lost its objective links'; end if;

    -- options and rationales came with it (INV-03)
    select count(*) into n from public.item_options o join public.items i on i.id = o.item_id
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where m.course_id = v_rev and o.rationale is not null;
    if n <> 2 then raise exception 'the revised item has % option(s) with rationales, expected 2', n; end if;

    -- the predecessor is untouched, hash included
    select content_sha256 into v_hash_after from public.plp_releases where course_id = v_course;
    if v_hash_after is distinct from v_hash_before then
      raise exception 'the predecessor''s stored content hash changed across the revision';
    end if;
    if public.course_content_sha256(v_course) is distinct from v_hash_before then
      raise exception 'the predecessor''s recomputed hash no longer matches its stored one';
    end if;

    -- a second open revision is refused
    v_raised := false;
    begin
      perform public.create_course_revision(v_course);
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a second open revision of the same course was permitted';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the second-revision probe did not run'; end if;

    -- lineage is immutable
    v_raised := false;
    begin
      update public.courses set supersedes_course_id = null where id = v_rev;
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then raise exception 'a lineage pointer could be cleared'; end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the lineage immutability probe did not run'; end if;

    -- a cycle is refused
    v_raised := false;
    begin
      insert into public.courses (id, institution_id, subject, stage, grade_label, title, status,
                                  supersedes_course_id)
      values (v_course, v_inst, 'X', 'SMA', 'X', 'cycle probe', 'INGESTED', v_rev);
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then raise exception 'a lineage cycle was permitted'; end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the cycle probe did not run'; end if;

    -- the chain reads both ways and contains exactly the two courses
    select count(*) into n from public.course_lineage_chain(v_course);
    if n <> 2 then raise exception 'the lineage chain from the predecessor has % member(s)', n; end if;
    select count(*) into n from public.course_lineage_chain(v_rev);
    if n <> 2 then raise exception 'the lineage chain from the successor has % member(s)', n; end if;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  select count(*) into n from public.courses where title = 'probe course 0054';
  if n <> 0 then raise exception 'the probe left its course behind'; end if;

  -- structural: the immutability and sealing guards were not touched
  select count(*) into n from pg_trigger t join pg_class c on c.oid = t.tgrelid
    join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and not t.tgisinternal
     and t.tgfoid = 'public.enforce_taught_content_immutable()'::regprocedure;
  if n <> 7 then
    raise exception 'taught-content immutability is attached to % table(s), expected 7', n;
  end if;
  if pg_get_functiondef('public.content_is_sealed(uuid)'::regprocedure) !~ 'SUPERSEDED' then
    raise exception 'content_is_sealed no longer treats SUPERSEDED as sealed';
  end if;

  raise notice '0054 verified: lineage on five tables, revision copies no empirical value, predecessor untouched';
end $$;

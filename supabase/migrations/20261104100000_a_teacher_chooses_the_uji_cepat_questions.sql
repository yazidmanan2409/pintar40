-- D-085 T2 -- A TEACHER CHOOSES THE UJI CEPAT'S QUESTIONS, AND THE CLASS GETS EXACTLY THOSE.
--
-- T2 (verbatim intent): the teacher opens Uji Cepat → chooses the relevant
-- question bank/topic → sees the available authorised questions → tick, tick,
-- tick → reviews the selected questions → launches; "the teacher controls
-- which questions are selected"; "questions come from the existing authorised
-- question bank/content available to that teacher"; no authoring in the flow.
-- Until now the teacher picked a chapter and a count, and every learner's
-- session drew its own random subset at start; the questions were never shown.
--
-- WHAT CHANGES, AND THE ONE PLACE IT BINDS. Every draw rule -- the launch's
-- count check, the one-owner guard and each learner's assembly -- reads
-- eligible_items_for_definition. For QUICK neither exposure cooling (EXAM tier
-- only) nor INV-24 (needs a learning assignment, which an ad-hoc assignment
-- has not) removes anything, so a selection stored once and admitted by that
-- one function makes every learner's paper exactly the chosen questions, in
-- each learner's own shuffled order (ITEMS_AND_OPTIONS, unchanged).
--
--   1. quick_assessment_selections: the chosen questions of an ad-hoc QUICK
--      definition. Written only by the launcher below, never changed, never
--      added to once a session cites the definition; no client privilege.
--   2. eligible_items_for_definition: one added line in each branch,
--      quick_selection_admits(d.id, i.id) -- true for a definition with no
--      selection (every other instrument draws as before) and, with one, only
--      for its chosen items. Nothing else in the function moves.
--   3. quick_assessment_choices(class, chapter): what the teacher ticks from --
--      the chapter's questions an Uji Cepat for this class may draw (the same
--      tier, scope and authorisation as the launch; the learner-supported
--      question types), each with its lesson, topic, stem and options. No key,
--      no reason: T2 asks to see and choose the questions, and M5 shows the key
--      with the class's answers once something is handed in.
--   4. launch_selected_quick_assessment(class, chapter, items[], minutes): the
--      existing launch_quick_assessment does the launch itself, unchanged (who
--      may, which chapter, the window, the instrument, the assignment, its
--      audit line, the school's sealed pass mark); then every chosen question is
--      checked against that instrument's own eligible set, two versions of one
--      question (a parallel group) are refused, the difficulty mix is cleared
--      (the teacher chose the questions, so no band is asked for) and the
--      selection is stored and audited. A refusal at any point leaves nothing.
--
-- Refusals of the new parts are SQLSTATE PR050 with the code in DETAIL, as the
-- school pass mark's (BOB-49): QUICK_SELECTION_COUNT, QUICK_SELECTION_NOT_OFFERED,
-- QUICK_SELECTION_SIBLINGS. launch_quick_assessment's own refusals pass through
-- as they are. launch_quick_assessment(uuid, uuid, integer, integer) is not
-- re-created: CI's tour-8 plant and BOB32-K01 read its text.

-- ---------------------------------------------------------------------------
-- 1. The chosen questions.
-- ---------------------------------------------------------------------------
create table public.quick_assessment_selections (
  definition_id uuid not null references public.assessment_definitions(id),
  item_id uuid not null references public.items(id),
  institution_id uuid not null references public.institutions(id),
  ordinal smallint not null check (ordinal between 1 and 100),
  chosen_at timestamptz not null default now(),
  primary key (definition_id, item_id),
  unique (definition_id, ordinal)
);
alter table public.quick_assessment_selections enable row level security;
revoke all on public.quick_assessment_selections from public, anon, authenticated;

create or replace function public.quick_selection_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op <> 'INSERT' then
    raise exception using errcode = 'PR080', message = 'the questions chosen for an Uji Cepat are never changed',
      detail = 'QUICK_SELECTION_FIXED';
  end if;
  if not exists (select 1 from public.assessment_definitions d
                  where d.id = new.definition_id and d.mode = 'QUICK' and d.is_ad_hoc
                    and d.institution_id = new.institution_id) then
    raise exception using errcode = 'PR080', message = 'questions are chosen only for an Uji Cepat of the school that gives it',
      detail = 'QUICK_SELECTION_FIXED';
  end if;
  if exists (select 1 from public.assessment_sessions s
               join public.assessment_assignments aa on aa.id = s.assessment_assignment_id
              where aa.assessment_definition_id = new.definition_id) then
    raise exception using errcode = 'PR080', message = 'an Uji Cepat already sat keeps the questions it was given',
      detail = 'QUICK_SELECTION_FIXED';
  end if;
  return new;
end $$;
revoke all on function public.quick_selection_guard() from public, anon, authenticated;
create trigger quick_assessment_selections_are_fixed
  before insert or update or delete on public.quick_assessment_selections
  for each row execute function public.quick_selection_guard();

-- Read inside the draw, which may run as the learner (invoker) as well as inside
-- the definer engine; the table itself grants nobody anything.
create or replace function public.quick_selection_admits(p_definition uuid, p_item uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select not exists (select 1 from public.quick_assessment_selections q where q.definition_id = p_definition)
      or exists (select 1 from public.quick_assessment_selections q
                  where q.definition_id = p_definition and q.item_id = p_item)
$$;
revoke all on function public.quick_selection_admits(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The draw admits only the chosen questions, where some were chosen.
-- ---------------------------------------------------------------------------
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
     -- D-085 T2: an Uji Cepat whose questions the teacher chose draws only those
     and public.quick_selection_admits(d.id, i.id)
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
     -- D-085 T2, as above
     and public.quick_selection_admits(d.id, a.item_id)
$function$;
-- privileges as before: the Studio's own reads may call it; anon may not
revoke all on function public.eligible_items_for_definition(uuid) from public, anon;
grant execute on function public.eligible_items_for_definition(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. What the teacher chooses from.
-- ---------------------------------------------------------------------------
create or replace function public.quick_assessment_choices(p_node uuid, p_module uuid)
returns table (item_id uuid, lesson_ordinal smallint, lesson_title text, topic text, stem text, stimulus text,
               item_type public.item_type, options jsonb, band text, parallel_group uuid, cycle_role public.assessment_mode)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_kind public.org_kind; v_course uuid; v_owner uuid; v_tier public.bank_type;
begin
  select n.institution_id, n.kind into v_inst, v_kind from public.org_nodes n where n.id = p_node;
  if v_inst is null or v_kind not in ('CLASS', 'COHORT') or not public.can_on_node('CAN_QUICK_ASSESSMENT', p_node) then
    raise exception using errcode = '42501',
      message = 'the questions for an Uji Cepat are shown to whoever may launch one for this class';
  end if;
  select m.course_id, c.institution_id into v_course, v_owner
    from public.modules m join public.courses c on c.id = m.course_id where m.id = p_module;
  if v_course is null then
    raise exception using errcode = 'P0002', message = 'unknown chapter';
  end if;
  -- the launch's own rule (ADR-0018): the school's own chapter, or PINTAR's distributed to it
  if v_owner is distinct from v_inst and not exists (
      select 1 from public.plp_releases r
       where r.course_id = v_course
         and public.release_is_distributed_to(r.id, v_inst)
         and public.caller_may_read_distributed_release(r.id)) then
    raise exception using errcode = '42501', message = 'that chapter belongs to another institution (INV-13)';
  end if;
  select mp.max_bank_tier into v_tier from public.mode_policy mp where mp.mode = 'QUICK';
  return query
    select i.id, l.ordinal, l.title,
           (select lo.statement from public.learning_objectives lo where lo.id = i.objective_ids[1]),
           i.stem, i.stimulus, i.item_type,
           (select coalesce(jsonb_agg(jsonb_build_object('label', o.label, 'body', o.body) order by o.label), '[]'::jsonb)
              from public.item_options o where o.item_id = i.id),
           public.difficulty_band(i.predicted_difficulty), i.parallel_group, i.cycle_role
      from public.items i
      join public.lessons l on l.id = i.lesson_id
     where l.module_id = p_module
       and public.item_is_drawable(i.bank_type, v_tier)
       and exists (select 1 from public.item_type_learner_support s where s.item_type = i.item_type)
       and (i.institution_id = v_inst
            or (v_owner is distinct from v_inst and i.institution_id = v_owner
                and exists (select 1 from public.authorized_canonical_items() a
                             where a.item_id = i.id and a.consuming_institution_id = v_inst)))
     order by l.ordinal, i.created_at, i.id;
end $$;
revoke all on function public.quick_assessment_choices(uuid, uuid) from public, anon, authenticated;
grant execute on function public.quick_assessment_choices(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Launch with the chosen questions.
-- ---------------------------------------------------------------------------
create or replace function public.launch_selected_quick_assessment(p_node uuid, p_module uuid, p_items uuid[], p_minutes integer)
returns table (assessment_definition_id uuid, assessment_assignment_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_n int; v_sent int; v_min int; v_max int; v_def uuid; v_assign uuid; v_inst uuid; v_bad int; v_sib int;
begin
  v_sent := coalesce(cardinality(p_items), 0);
  select count(distinct x) into v_n from unnest(coalesce(p_items, '{}'::uuid[])) x where x is not null;
  select b.item_count_min, b.item_count_max into v_min, v_max from public.assessment_definition_bounds b where b.mode = 'QUICK';
  if v_n <> v_sent or v_n < coalesce(v_min, 3) or v_n > coalesce(v_max, 20) then
    raise exception using errcode = 'PR050', detail = 'QUICK_SELECTION_COUNT',
      message = format('an Uji Cepat is given between %s and %s questions the teacher chose, each once; %s were sent',
                       coalesce(v_min, 3), coalesce(v_max, 20), v_sent);
  end if;

  -- the launch itself, as it always was: who may, which chapter, the window,
  -- the instrument and its assignment (the school's pass mark sealed on it)
  select * into v_def, v_assign from public.launch_quick_assessment(p_node, p_module, v_n, p_minutes);
  select d.institution_id into v_inst from public.assessment_definitions d where d.id = v_def;

  -- every chosen question is one this instrument may draw, of a type a learner can answer
  select count(*) into v_bad from unnest(p_items) x
   where x not in (select e.item_id from public.eligible_items_for_definition(v_def) e)
      or not exists (select 1 from public.items i join public.item_type_learner_support s on s.item_type = i.item_type
                      where i.id = x);
  if v_bad > 0 then
    raise exception using errcode = 'PR050', detail = 'QUICK_SELECTION_NOT_OFFERED',
      message = format('%s of the chosen questions are not offered for an Uji Cepat on this chapter', v_bad);
  end if;
  -- two versions of one question cannot both be on a paper
  select count(*) into v_sib from (
    select i.parallel_group from public.items i
     where i.id = any(p_items) and i.parallel_group is not null
     group by i.parallel_group having count(*) > 1) g;
  if v_sib > 0 then
    raise exception using errcode = 'PR050', detail = 'QUICK_SELECTION_SIBLINGS',
      message = 'two of the chosen questions are versions of the same question; choose one of them';
  end if;

  -- the teacher chose the questions, so no difficulty band is asked of the draw
  update public.assessment_definitions set difficulty_mix = '{}'::jsonb where id = v_def;
  insert into public.quick_assessment_selections (definition_id, item_id, institution_id, ordinal)
  select v_def, u.x, v_inst, u.ord::smallint from unnest(p_items) with ordinality as u(x, ord);

  perform public.audit_write('quick_assessment.selected', 'assessment_definitions', v_def::text, v_inst,
    jsonb_build_object('definition', v_def, 'assignment', v_assign, 'node', p_node, 'module', p_module,
                       'items', to_jsonb(p_items)));
  assessment_definition_id := v_def; assessment_assignment_id := v_assign;
  return next;
end $$;
revoke all on function public.launch_selected_quick_assessment(uuid, uuid, uuid[], integer) from public, anon, authenticated;
grant execute on function public.launch_selected_quick_assessment(uuid, uuid, uuid[], integer) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('quick_assessment_choices', 'STAFF',
   'D-085 T2: the questions a chapter offers an Uji Cepat for this class (lesson, topic, stem, options; no key, no reason), '
   'for whoever holds CAN_QUICK_ASSESSMENT over the class; the launch''s own chapter rule.', null, null),
  ('launch_selected_quick_assessment', 'STAFF',
   'D-085 T2: launch_quick_assessment, then the teacher''s chosen questions checked against the instrument''s own eligible '
   'set and stored; every learner''s paper is exactly those. Audited.', 'CAPABILITY', 'CAN_QUICK_ASSESSMENT')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare v_src text;
begin
  v_src := pg_get_functiondef('public.eligible_items_for_definition(uuid)'::regprocedure);
  if position('     and (not public.definition_follows_cycle_roles(d.id) or i.cycle_role = d.mode)' in v_src) = 0
     or (length(v_src) - length(replace(v_src, 'quick_selection_admits', ''))) / length('quick_selection_admits') <> 2 then
    raise exception 'T2: the draw keeps BOB-04''s line and admits the chosen questions in both branches';
  end if;
  v_src := pg_get_functiondef('public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure);
  if position('v_label := ''Uji Cepat' in v_src) = 0 then
    raise exception 'T2: launch_quick_assessment is left as it was';
  end if;
  v_src := pg_get_functiondef('public.launch_selected_quick_assessment(uuid,uuid,uuid[],integer)'::regprocedure);
  if v_src !~ 'from public\.launch_quick_assessment\(p_node, p_module, v_n, p_minutes\)'
     or v_src !~ 'eligible_items_for_definition\(v_def\)' or v_src !~ 'difficulty_mix = ''\{\}''' then
    raise exception 'T2: the chosen launch goes through the launch, checks against the instrument''s own eligible set, asks no band';
  end if;
  v_src := pg_get_functiondef('public.quick_assessment_choices(uuid,uuid)'::regprocedure);
  if v_src ~* 'is_correct|rationale|misconception' or v_src !~ 'CAN_QUICK_ASSESSMENT' then
    raise exception 'T2: the choices are shown to who may launch, without key or reason';
  end if;
  if has_table_privilege('authenticated', 'public.quick_assessment_selections', 'select')
     or has_table_privilege('authenticated', 'public.quick_assessment_selections', 'insert')
     or has_function_privilege('anon', 'public.quick_assessment_choices(uuid,uuid)', 'execute')
     or has_function_privilege('anon', 'public.launch_selected_quick_assessment(uuid,uuid,uuid[],integer)', 'execute') then
    raise exception 'T2: no client touches the selection table; anon calls neither function';
  end if;
  raise notice 'T2 verified: the teacher''s chosen questions are the paper; the launch and the draw otherwise unchanged';
end $$;

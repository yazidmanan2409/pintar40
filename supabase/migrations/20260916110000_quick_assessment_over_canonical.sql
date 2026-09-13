-- 0062 -- the launch and the learner path for a Quick Assessment over
-- authorized canonical content. ADR-0018.
--
-- 0061 decided what may be DRAWN. This decides what may be LAUNCHED, and by
-- whom, and how a learner reaches it.
--
-- DEFECT FOUND BY BUILDING (1): THE LAUNCHER REBRANDS THE DEFINITION'S TENANT.
-- `launch_quick_assessment` reads the class's institution into `v_inst`, and
-- then OVERWRITES it with the module's course's institution:
--
--     select m.course_id, c.institution_id into v_course, v_inst
--       from public.modules m join public.courses c ...
--
-- For institution-owned content the two are identical and the overwrite is
-- invisible -- which is why it survived FABLE-04. The moment eligibility
-- follows authorization it stops being invisible: the ad-hoc definition, the
-- assessment assignment and the audit row would all have been stamped with the
-- CANONICAL tenant's id, for a quick assessment a school launched for its own
-- class. That is precisely the failure 0059 repaired one layer down.
--
-- It fails closed today rather than silently -- 0059's assignment guard refuses
-- a definition owned by another institution when no learning assignment carries
-- a grant, and a quick assessment carries none -- so nothing in any database is
-- wrong. But the repair belongs here, and it is not cosmetic: it is the reason
-- the whole chain below lines up. With the school as the definition's owner,
-- 0059's guard passes on its FIRST branch, `enforce_session_provenance` passes
-- on its first branch, and the evidence is the school's by the ordinary model
-- rather than by a special case.
--
-- DEFERRED GAP FOUND BY BUILDING (2): A QUICK ASSESSMENT COULD NOT BE TAKEN.
-- `start_learning_session` refuses any assignment that names no learning
-- assignment -- 'this phase starts learning-cycle sessions only' -- and a quick
-- assessment names none by construction. So since FABLE-04 a quick assessment
-- could be launched and never answered, canonical or not. That was a deliberate
-- phase boundary, not a defect, but ADR-0018's acceptance requires a learner to
-- complete one, so the boundary closes here for AD-HOC assignments only, in the
-- existing function, through the existing opener and the existing assembler.
-- There is no second engine and no second entry point (INV-26).
--
-- WHAT THE RELAXATION IS. The flat same-institution refusal becomes: the
-- module is this school's, OR its course carries a release actively distributed
-- to this school which this caller may read. Two named predicates, called, not
-- restated -- `release_is_distributed_to` carries the
-- `owner.tenant_kind = 'PLATFORM_CANONICAL'` conjunct that makes School B ->
-- School C structurally impossible. The unauthorized case keeps its existing
-- message so every refusal that exists today refuses for the same reason and by
-- the same words.
--
-- ONE CONTENT OWNER PER AD-HOC PAPER, AT CREATION (ADR-0018). Checked here,
-- before the assignment exists, by the guard 0061 installed -- and checked
-- again at draw time, so a paper built past this function is refused too.

create or replace function public.launch_quick_assessment(p_node uuid, p_module uuid, p_item_count integer, p_minutes integer)
 RETURNS TABLE(assessment_definition_id uuid, assessment_assignment_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_actor uuid; v_inst uuid; v_course uuid; v_tier public.bank_type;
  v_period uuid; v_def uuid; v_assign uuid; v_drawable int; v_kind public.org_kind;
  v_label text; v_title text; v_try int;
  -- ADDED IN 0062. The module's owner is a SEPARATE fact from the assigning
  -- school's, and conflating them is the defect this migration repairs.
  v_module_inst uuid; v_canonical boolean := false;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;

  select n.institution_id, n.kind, n.academic_period_id into v_inst, v_kind, v_period
    from public.org_nodes n where n.id = p_node;
  if v_inst is null then raise exception 'unknown class %', p_node; end if;
  if v_kind not in ('CLASS','COHORT') then
    raise exception 'a quick assessment is launched for a class or cohort, not a %', v_kind;
  end if;
  if not public.can_on_node('CAN_QUICK_ASSESSMENT', p_node) then
    raise exception 'launching a quick assessment requires CAN_QUICK_ASSESSMENT over this class';
  end if;

  -- CHANGED IN 0062. `v_inst` stays the ASSIGNING school's -- it is the tenant
  -- of the class, the definition, the assignment and the audit line. The
  -- module's owner is read into its own variable and then TESTED, never copied.
  select m.course_id, c.institution_id into v_course, v_module_inst
    from public.modules m join public.courses c on c.id = m.course_id where m.id = p_module;
  if v_course is null then raise exception 'unknown module %', p_module; end if;

  if v_module_inst is distinct from v_inst then
    -- ADR-0018: eligibility for an ad-hoc paper follows AUTHORIZATION. The
    -- predicate carries the whole rule, including the tenant-kind conjunct
    -- that makes one school's grant unusable by another; restating any part of
    -- it here would create a second answer to the same question.
    select exists (
      select 1 from public.plp_releases r
       where r.course_id = v_course
         and public.release_is_distributed_to(r.id, v_inst)
         and public.caller_may_read_distributed_release(r.id))
      into v_canonical;
    if not v_canonical then
      raise exception 'that module belongs to another institution (INV-13)';
    end if;
  end if;

  if p_item_count is null or p_item_count < 3 or p_item_count > 20 then
    raise exception 'a quick assessment carries between 3 and 20 questions, not %', p_item_count;
  end if;
  if p_minutes is null or p_minutes < 5 or p_minutes > 60 then
    raise exception 'a quick assessment runs between 5 and 60 minutes, not %', p_minutes;
  end if;

  select m.max_bank_tier into v_tier from public.mode_policy m where m.mode = 'QUICK';
  if v_tier is null then raise exception 'QUICK has no mode policy row'; end if;
  if v_tier = 'EXAM' then
    raise exception 'the QUICK mode policy reaches the EXAM tier; that is an INV-12 violation, not a configuration';
  end if;

  -- REPAIRED IN 0049. The title was the minute stamp alone, and
  -- (institution_id, title, mode, version) is UNIQUE: two educators in one
  -- institution launching inside the same minute produced a raw unique
  -- violation on the second launch. In a phase whose stated target is "about
  -- one minute from intent to learners answering" that is not a corner case,
  -- it is the normal case at the start of a period.
  --
  -- The title stays a human label -- a teacher recognises "Kuis Cepat" and the
  -- time -- and takes a counter only when it has to. The counter is NOT a
  -- version: two quick assessments launched in the same minute are different
  -- instruments, not revisions of one, and overloading `version` would make
  -- the definition history lie.
  v_label := 'Kuis Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI');
  v_title := v_label;
  v_try := 1;
  loop
    begin
      insert into public.assessment_definitions (
        institution_id, module_id, title, mode, bank_type, item_count,
        safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit,
        allows_pause, offline_tolerant, hesitation_window_seconds, shuffle_policy,
        status, author_person_id, is_ad_hoc)
      values (
        -- THE ASSIGNING SCHOOL, always. Over canonical content this row is the
        -- school's instrument about someone else's chapter; the chapter's owner
        -- is recorded where it belongs, on the items and the release the
        -- session cites.
        v_inst, p_module,
        v_title,
        'QUICK', v_tier, p_item_count,
        0, jsonb_build_object('SEDANG', greatest(p_item_count / 2, 1), 'MUDAH', p_item_count - greatest(p_item_count / 2, 1)),
        jsonb_build_object('mastery_min', 0.6), 1,
        false, false, 25, 'ITEMS_AND_OPTIONS',
        'INGESTED', v_actor,
        -- INV-04: an ad-hoc instrument is outside the taught-content release, which
        -- is the only reason it may be created over a course that is already sealed
        true)
      returning id into v_def;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 200 then
        raise exception 'too many quick assessments launched in this minute for this institution';
      end if;
      v_title := v_label || ' (' || v_try || ')';
    end;
  end loop;

  -- ADDED IN 0062 (ADR-0018). One content owner per ad-hoc paper, decided in
  -- the ADR and enforced at creation -- before the assignment exists, so a
  -- refused launch leaves no half-built instrument behind.
  perform public.enforce_ad_hoc_single_owner(v_def);

  select count(*) into v_drawable from public.drawable_items_for_definition(v_def);
  if v_drawable < p_item_count then
    raise exception 'this module has % drawable question(s) at the % tier; a % question quick assessment cannot be filled',
      v_drawable, v_tier, p_item_count;
  end if;

  insert into public.assessment_assignments (
    institution_id, assessment_definition_id, node_id, academic_period_id,
    opens_at, closes_at, assigned_by_person_id, assigned_at)
  values (v_inst, v_def, p_node, v_period, now(), now() + make_interval(mins => p_minutes),
          v_actor, now())
  returning id into v_assign;
  update public.assessment_assignments set status = 'SCHEDULED' where id = v_assign;
  update public.assessment_assignments set status = 'OPEN' where id = v_assign;

  perform public.audit_write('quick_assessment.launched', 'assessment_assignments', v_assign::text,
    v_inst,
    jsonb_build_object('definition', v_def, 'assignment', v_assign, 'node', p_node,
                       'items', p_item_count, 'minutes', p_minutes, 'tier', v_tier, 'ad_hoc', true,
                       -- provenance, not authority: which owner's chapter this
                       -- instrument is about. The authorization itself lives in
                       -- the distribution row and its own audit line.
                       'content_owner', v_module_inst, 'over_canonical', v_canonical));
  assessment_definition_id := v_def; assessment_assignment_id := v_assign;
  return next;
end $function$;

-- ---------------------------------------------------------------------------
-- The learner path. Spliced, not retyped: the learning-cycle body below is
-- 0060's, with one branch added for an ad-hoc assignment.
-- ---------------------------------------------------------------------------
create or replace function public.start_learning_session(p_assessment_assignment uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $function$
declare
  v_person uuid; v_ok boolean; v_reason text;
  v_aa public.assessment_assignments; v_la public.learning_assignments;
  v_d public.assessment_definitions; v_enrol uuid; v_session uuid;
  v_deadline timestamptz; v_cohort uuid; v_class uuid;
  v_release uuid; v_course uuid;
begin
  v_person := public.current_person_id();
  select e.ok, e.reason into v_ok, v_reason from public.may_start_assessment(p_assessment_assignment) e;
  if not v_ok then raise exception 'cannot start this assessment: % (INV-27)', v_reason; end if;

  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  select * into v_d  from public.assessment_definitions where id = v_aa.assessment_definition_id;

  -- CHANGED IN 0062. An ad-hoc assignment names no learning assignment by
  -- construction, and until now that refusal ended the Quick Assessment flow
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

  if v_aa.closes_at is not null then v_deadline := v_aa.closes_at; end if;

  if v_aa.learning_assignment_id is not null then
    -- the release is the one the LEARNING assignment binds, never "the newest"
    v_release := v_la.plp_release_id;
  else
    -- ADDED IN 0062. An ad-hoc paper binds a module or a course, not a release,
    -- so the release is resolved from the content the definition is bound to:
    -- this school's own release of that course, or -- for canonical content --
    -- the release it holds an ACTIVE grant for. `release_is_distributed_to` is
    -- the same predicate the session guard re-applies immediately afterwards,
    -- so a grant withdrawn between launch and start refuses here rather than
    -- producing a session the guard would then reject.
    select coalesce(v_d.course_id, m.course_id) into v_course
      from public.modules m where m.id = v_d.module_id;
    if v_course is null then v_course := v_d.course_id; end if;
    select r.id into v_release
      from public.plp_releases r
     where r.course_id = v_course
       and (r.institution_id = v_aa.institution_id
         or public.release_is_distributed_to(r.id, v_aa.institution_id))
     order by (r.institution_id = v_aa.institution_id) desc,
              r.published_at desc nulls last, r.created_at desc
     limit 1;
    if v_release is null then
      raise exception
        'this quick assessment is over material with no release this school may use; ask the teacher to publish the chapter or check the authorization';
    end if;
  end if;

  v_session := public.open_assessment_session(
    v_enrol, v_d.id, v_release, 'ONLINE', v_d.mode,
    public.engine_version(), public.scoring_policy_version(),
    v_class, v_cohort, v_deadline, v_aa.learning_assignment_id, v_aa.id);

  perform public.assemble_session(v_session);
  return v_session;
end $function$;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
--
-- The behavioural half runs the whole journey -- canonical chapter, release,
-- grant, school, class, educator, learner -- inside a rolled-back
-- subtransaction, because the two things this migration changes are only
-- visible end to end: which tenant owns the instrument, and whether a learner
-- can reach it at all. Both were wrong before, and neither is legible from the
-- function text alone.
-- ---------------------------------------------------------------------------
do $$
declare
  v_src text; n int;
  v_canon uuid; v_school uuid; v_other uuid; v_fac uuid; v_dep uuid; v_prog uuid;
  v_coh uuid; v_class uuid; v_period uuid;
  v_course uuid; v_mod uuid; v_les uuid; v_rel uuid;
  v_uid uuid; v_person uuid; v_luid uuid; v_learner uuid; v_enrol uuid;
  v_row record; v_sess uuid; v_d record; v_refused boolean;
begin
  -- === structural ==========================================================
  v_src := pg_get_functiondef('public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure);

  -- the defect: the module's owner must not be read into the assigning
  -- school's variable
  if v_src ~ 'into v_course, v_inst' then
    raise exception 'launch_quick_assessment still overwrites the assigning school with the module''s owner';
  end if;
  if v_src !~ 'v_module_inst' then
    raise exception 'launch_quick_assessment does not keep the module''s owner as a separate fact';
  end if;
  -- the unauthorized case still refuses by the same words
  if v_src !~ 'that module belongs to another institution \(INV-13\)' then
    raise exception 'the INV-13 refusal is gone from launch_quick_assessment';
  end if;
  -- authorization is the predicate, not a restatement of it
  if v_src !~ 'release_is_distributed_to' then
    raise exception 'launch_quick_assessment does not call the distribution predicate';
  end if;
  if v_src ~ 'PLATFORM_CANONICAL' then
    raise exception 'launch_quick_assessment restates the tenant-kind rule instead of calling the predicate';
  end if;
  -- the boundary is checked at creation
  if v_src !~ 'enforce_ad_hoc_single_owner' then
    raise exception 'launch_quick_assessment does not check the single-owner boundary at creation';
  end if;
  -- 0049's repair is still in place
  if v_src !~ 'unique_violation' or v_src !~ 'v_title := v_label' then
    raise exception 'the 0049 title-collision repair was lost in this rewrite';
  end if;

  -- the learner path opens for ad-hoc assignments and for nothing else new
  v_src := pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure);
  if v_src !~ 'is_ad_hoc' then
    raise exception 'start_learning_session does not gate the new branch on is_ad_hoc';
  end if;
  if v_src !~ 'this phase starts learning-cycle sessions only' then
    raise exception 'the non-ad-hoc refusal is gone from start_learning_session';
  end if;

  -- exposure is unchanged: this migration grants nothing to anyone
  if has_function_privilege('anon', 'public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.start_learning_session(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'this migration made a learner or staff entry point anon-executable';
  end if;
  if not has_function_privilege('authenticated', 'public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure, 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.start_learning_session(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'an existing authenticated grant was dropped by this migration';
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    select i2.id into v_canon from public.institutions i2 where i2.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
    if v_canon is null then raise exception 'no PLATFORM_CANONICAL tenant exists at 0062'; end if;

    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0062 school', 'probe-0062-school', true, true) returning id into v_school;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0062 other', 'probe-0062-other', true, true) returning id into v_other;

    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_school, '2026/2027', current_date - 30, current_date + 300) returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_school, v_school, 'FACULTY', 'F') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_school, v_fac, 'DEPARTMENT', 'D') returning id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_school, v_dep, 'PROGRAMME', 'P') returning id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_school, v_prog, 'COHORT', 'C', v_period) returning id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_school, v_coh, 'CLASS', 'K', v_period) returning id into v_class;

    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_canon, 'Matematika', 'SD', 'Kelas 5', 'probe 0062 canonical') returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title)
    values (v_course, v_canon, 1, 'probe modul') returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown)
    values (v_mod, v_canon, 1, 'probe pelajaran', 'isi') returning id into v_les;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, predicted_difficulty)
    select v_les, v_canon, 'MCQ_SINGLE', 'PRACTICE', 'probe soal ' || g,
           case when g <= 2 then 0.8 else null end
      from generate_series(1, 4) g;
    insert into public.plp_releases (institution_id, course_id, version_label)
    values (v_canon, v_course, '9.0.2') returning id into v_rel;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0062-guru@local.invalid')
    returning id into v_uid;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0062-murid@local.invalid')
    returning id into v_luid;
    select a.person_id into v_learner from public.accounts a where a.auth_user_id = v_luid;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, 'EDUCATOR', v_school, now() - interval '1 day', now() + interval '1 day');
    perform set_config('app.seed_intent', '', true);
    insert into public.enrollments (person_id, institution_id, academic_period_id, status, valid_from)
    values (v_learner, v_school, v_period, 'ACTIVE', now() - interval '1 day') returning id into v_enrol;
    insert into public.memberships (enrollment_id, node_id, academic_period_id, valid_from)
    values (v_enrol, v_class, v_period, now() - interval '1 day');

    perform set_config('request.jwt.claims', json_build_object('sub', v_uid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);

    -- (1) with no grant, the launch is refused by the existing words
    v_refused := false;
    begin
      perform public.launch_quick_assessment(v_class, v_mod, 3, 30);
    exception when others then
      v_refused := sqlerrm ~ 'another institution \(INV-13\)';
    end;
    if not v_refused then
      raise exception 'a school launched a quick assessment over canonical content it holds no grant for';
    end if;

    -- (2) under an active grant it succeeds, and the instrument is the
    --     SCHOOL'S -- the repair this migration exists for
    insert into public.release_distributions
      (plp_release_id, institution_id, status, authorized_by_person_id)
    values (v_rel, v_school, 'ACTIVE', v_person);

    select * into v_row from public.launch_quick_assessment(v_class, v_mod, 3, 30);
    select d.institution_id as di, a.institution_id as ai, d.is_ad_hoc as adhoc, d.module_id as mid
      into v_d
      from public.assessment_definitions d
      join public.assessment_assignments a on a.assessment_definition_id = d.id
     where d.id = v_row.assessment_definition_id;
    if v_d.di is distinct from v_school then
      raise exception 'the quick assessment definition is owned by the wrong tenant';
    end if;
    if v_d.ai is distinct from v_school then
      raise exception 'the quick assessment assignment is owned by the wrong tenant';
    end if;
    if not v_d.adhoc then raise exception 'a quick assessment was created non-ad-hoc'; end if;
    if v_d.mid is distinct from v_mod then
      raise exception 'the quick assessment is not bound to the canonical module';
    end if;
    if not exists (select 1 from public.audit_log
                    where action = 'quick_assessment.launched'
                      and target_id = v_row.assessment_assignment_id::text
                      and institution_id = v_school) then
      raise exception 'the launch was audited against the wrong institution';
    end if;

    -- (3) the learner reaches it, over the canonical release, with the
    --     school's own evidence
    perform set_config('request.jwt.claims', json_build_object('sub', v_luid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_luid::text, true);
    v_sess := public.start_learning_session(v_row.assessment_assignment_id);
    select ss.institution_id as si, ss.plp_release_id as ri, ss.evidence_class::text as ec,
           ss.enrollment_id as ei, ss.class_node_id as ci
      into v_d from public.assessment_sessions ss where ss.id = v_sess;
    if v_d.si is distinct from v_school then
      raise exception 'the session is not the consuming school''s';
    end if;
    if v_d.ri is distinct from v_rel then
      raise exception 'the session does not cite the canonical release';
    end if;
    if v_d.ei is null or v_d.ci is null then
      raise exception 'the school''s own enrolment and class are missing from the provenance';
    end if;
    if v_d.ec is distinct from public.derive_evidence_class(v_school, 'ONLINE')::text then
      raise exception 'evidence_class is not what the school''s own cap model derives';
    end if;
    select count(*) into n from public.presented_items pi
      join public.items i on i.id = pi.item_id
     where pi.session_id = v_sess and i.institution_id = v_canon;
    if n <> 3 then
      raise exception 'the paper presented % canonical item(s), not 3', n;
    end if;
    select count(*) into n from public.courses c
     where c.id = v_course and c.institution_id = v_school;
    if n <> 0 then raise exception 'the canonical course became school-owned'; end if;

    raise exception 'PROBE_0062_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0062_ROLLBACK' then raise; end if;
  end;
end $$;

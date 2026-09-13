-- 0063 -- an ad-hoc session cites a PUBLISHED release, or it does not start.
-- ADR-0018, amended. Found by Claude 1's second reading of Task 1; reproduced
-- here before being repaired.
--
-- WHAT WAS WRONG. 0062 opened the learner path for ad-hoc assignments and
-- resolved the release the session would cite:
--
--     where r.course_id = v_course
--       and (r.institution_id = v_aa.institution_id
--         or public.release_is_distributed_to(r.id, v_aa.institution_id))
--
-- with NO status filter. A school authoring its own course holds a release row
-- at INGESTED long before it publishes anything, and that row satisfies the
-- own-institution arm. So a quick assessment over the school's own unfinished
-- chapter opened a session and cited an UNSEALED release.
--
-- WHY THAT IS A CONTRACT VIOLATION AND NOT A ROUGH EDGE. Doc 07: "a later
-- content correction (a new PLP release) never retroactively changes a past
-- session's recorded result -- the session's `plp_release_id` binding is
-- exactly what makes this safe". Doc 08 says the same binding is what lets
-- anyone "always ask what did this learner see and get a frozen, unambiguous
-- answer". Both guarantees are conditional on the cited release being SEALED.
-- An unsealed one is not: `enforce_taught_content_immutable` only fires when
-- `content_is_sealed(course)` is true, so the very items the learner answered
-- can still be edited in place afterwards, and the binding then pins nothing.
--
-- REPRODUCED, NOT REASONED. Against a seeded database at 0062: a school's own
-- course with an INGESTED release, a quick assessment launched over it, a
-- learner session opened citing that release -- and then the stem of a
-- presented item updated successfully after the fact. The evidence was
-- OFFICIAL-eligible and would have reached results, and in FABLE-06 it would
-- have reached item statistics computed over items that can still change.
--
-- WHY 0062 IS WHERE IT APPEARED. Before 0062 no ad-hoc session could start at
-- all -- that refusal is the deferred gap 0062 closed. Non-ad-hoc sessions take
-- their release from the learning assignment, which is pinned elsewhere. So
-- 0062 is the first migration in which an unsealed release became citable, and
-- the completion report's claim that such a case "is refused in plain language"
-- was true only when the course carried no release row whatsoever. It was
-- written as a general statement and was not tested. It is tested now.
--
-- THE REPAIR IS ONE CLAUSE, AND IT NARROWS. `r.status = 'PUBLISHED'`, applied
-- to the whole predicate rather than to one arm, so the rule is stated once and
-- holds for both:
--
--   * the school's own content -- doc 08's "publication is not assignment:
--     publishing a release makes it available within the institution" is the
--     baseline's own reason for putting publication upstream of use, and
--     PUBLISHED implies sealed, which is what the binding needs;
--   * canonical content -- `grant_release_distribution` already refuses to
--     distribute anything that is not PUBLISHED, so the authorized path was
--     never exposed. Stating it here anyway means THIS path no longer depends
--     on a check that lives in a different function: a distribution row written
--     by any means other than that RPC cannot make an unsealed release citable.
--
-- No new capability, no new object, no new policy, no architecture decision,
-- and nothing in the canonical path Task 1 was written for changes. A school
-- that has not published the chapter is refused in plain language -- which is
-- what the completion report claimed, and is now true.

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

  if v_aa.closes_at is not null then v_deadline := v_aa.closes_at; end if;

  if v_aa.learning_assignment_id is not null then
    -- the release is the one the LEARNING assignment binds, never "the newest"
    v_release := v_la.plp_release_id;
  else
    -- ADDED IN 0062, CORRECTED IN 0063. An ad-hoc paper binds a module or a
    -- course, not a release, so the release is resolved from the content the
    -- definition is bound to: this school's own release of that course, or --
    -- for canonical content -- the release it holds an ACTIVE grant for.
    --
    -- `r.status = 'PUBLISHED'` is the correction, and it applies to BOTH arms
    -- deliberately. A session's `plp_release_id` is only the frozen answer to
    -- "what did this learner see" if the release it names is sealed, and an
    -- unpublished release is not: its items can still be edited in place. The
    -- canonical arm cannot reach an unpublished release through the authorized
    -- path anyway -- `grant_release_distribution` refuses to distribute one --
    -- but stating the rule here means this path does not depend on a check
    -- that lives in another function.
    --
    -- `release_is_distributed_to` is the same predicate the session guard
    -- re-applies immediately afterwards, so a grant withdrawn between launch
    -- and start refuses here rather than producing a session the guard would
    -- then reject.
    select coalesce(v_d.course_id, m.course_id) into v_course
      from public.modules m where m.id = v_d.module_id;
    if v_course is null then v_course := v_d.course_id; end if;
    select r.id into v_release
      from public.plp_releases r
     where r.course_id = v_course
       and r.status = 'PUBLISHED'
       and (r.institution_id = v_aa.institution_id
         or public.release_is_distributed_to(r.id, v_aa.institution_id))
     order by (r.institution_id = v_aa.institution_id) desc,
              r.published_at desc nulls last, r.created_at desc
     limit 1;
    if v_release is null then
      raise exception
        'this quick assessment is over material that has not been published for this school; publish the chapter first, or check that it is still shared with you';
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
-- Claude 1's non-blocking finding 18, recorded where a reader will meet it.
--
-- The accessor is COURSE-scoped: it requires that some release of the item's
-- course be distributed, not that the item belong to the distributed release.
-- Those are the same set today, and the property that makes them the same is
-- copy-forward (ADR-0016): a correction is a NEW course, so a course's item set
-- is stable and every release of one course describes the same content. That is
-- an argued equivalence, not an enforced one, and this comment names it so a
-- later change to the revision model cannot quietly invalidate it.
-- ---------------------------------------------------------------------------
comment on function public.authorized_canonical_items() is
  'Canonical item rows an institution is authorized to use, by distribution rather than '
  'ownership. Carries no eligibility logic: tier, scope, cooling and exclusion all remain in '
  'eligible_items_for_definition, which is the only engine (INV-26). COURSE-scoped rather than '
  'release-scoped: equivalent only because copy-forward (ADR-0016) makes a course''s item set '
  'stable, so every release of one course describes the same content. If revisions ever edit a '
  'course in place, this must become release-scoped.';

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
--
-- The behavioural half builds the exact case that was wrong -- a school's own
-- course carrying only an unpublished release -- inside a rolled-back
-- subtransaction, and requires the refusal. It also proves the refusal is not
-- vacuous: the paper has enough drawable items, so what refuses is the release
-- resolution and nothing else.
-- ---------------------------------------------------------------------------
do $$
declare
  v_src text; n int;
  v_school uuid; v_fac uuid; v_dep uuid; v_prog uuid; v_coh uuid; v_class uuid; v_period uuid;
  v_course uuid; v_mod uuid; v_les uuid; v_rel uuid;
  v_uid uuid; v_person uuid; v_luid uuid; v_learner uuid; v_enrol uuid;
  v_row record; v_refused boolean; v_msg text;
begin
  -- === structural ==========================================================
  v_src := pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure);

  if v_src !~ 'r\.status = ''PUBLISHED''' then
    raise exception 'the ad-hoc release resolution does not require a PUBLISHED release';
  end if;
  -- the ad-hoc gate and the non-ad-hoc refusal both survive the rewrite
  if v_src !~ 'is_ad_hoc' then
    raise exception 'start_learning_session lost the is_ad_hoc gate';
  end if;
  if v_src !~ 'this phase starts learning-cycle sessions only' then
    raise exception 'the non-ad-hoc refusal is gone from start_learning_session';
  end if;
  -- the learning-cycle arm still takes its release from the assignment, not
  -- from this resolution: correcting the ad-hoc arm must not touch it
  if v_src !~ 'v_release := v_la\.plp_release_id' then
    raise exception 'the learning-cycle release binding was disturbed by this repair';
  end if;
  -- exposure unchanged
  if has_function_privilege('anon', 'public.start_learning_session(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'start_learning_session became anon-executable';
  end if;
  if not has_function_privilege('authenticated', 'public.start_learning_session(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'start_learning_session lost its authenticated grant';
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0063 school', 'probe-0063-school', true, true) returning id into v_school;
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

    -- the school's OWN course, mid-authoring: a release row exists and is not
    -- published. This is the ordinary state of a package being built.
    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_school, 'Matematika', 'SD', 'Kelas 5', 'probe 0063 own course') returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title)
    values (v_course, v_school, 1, 'probe modul') returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown)
    values (v_mod, v_school, 1, 'probe pelajaran', 'isi') returning id into v_les;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, predicted_difficulty)
    select v_les, v_school, 'MCQ_SINGLE', 'PRACTICE', 'probe soal ' || g,
           case when g <= 2 then 0.8 else null end
      from generate_series(1, 4) g;
    insert into public.plp_releases (institution_id, course_id, version_label)
    values (v_school, v_course, '0.1.0') returning id into v_rel;
    if (select r.status from public.plp_releases r where r.id = v_rel) = 'PUBLISHED' then
      raise exception 'the probe built a PUBLISHED release; the refusal below would be vacuous';
    end if;
    if public.content_is_sealed(v_course) then
      raise exception 'the probe course is sealed; it is not the case this migration repairs';
    end if;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0063-guru@local.invalid')
    returning id into v_uid;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0063-murid@local.invalid')
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

    -- the launch itself still succeeds: a teacher may build a quick assessment
    -- over their own draft chapter. What must not happen is a learner sitting
    -- it against an unsealed release.
    select * into v_row from public.launch_quick_assessment(v_class, v_mod, 3, 30);
    if v_row.assessment_assignment_id is null then
      raise exception 'the launch failed, so the session refusal below would prove nothing';
    end if;
    select count(*) into n from public.drawable_items_for_definition(v_row.assessment_definition_id);
    if n < 3 then
      raise exception 'the probe paper has only % drawable item(s); the refusal would be about the pool, not the release', n;
    end if;

    perform set_config('request.jwt.claims', json_build_object('sub', v_luid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_luid::text, true);
    v_refused := false; v_msg := '';
    begin
      perform public.start_learning_session(v_row.assessment_assignment_id);
    exception when others then
      v_msg := sqlerrm;
      v_refused := sqlerrm ~ 'has not been published for this school';
    end;
    if not v_refused then
      raise exception 'a learner sat a quick assessment against an unpublished release (%)',
        coalesce(nullif(v_msg, ''), 'no error raised');
    end if;
    select count(*) into n from public.assessment_sessions ss
     where ss.assessment_assignment_id = v_row.assessment_assignment_id;
    if n <> 0 then
      raise exception 'the refused start left % session row(s) behind', n;
    end if;

    raise exception 'PROBE_0063_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0063_ROLLBACK' then raise; end if;
  end;
end $$;

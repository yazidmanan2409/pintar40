-- 0064 -- supersession is not withdrawal. ADR-0018, amended again.
--
-- 0063 fixed F1 by requiring the release an ad-hoc session cites to be
-- `PUBLISHED`. That fixed the defect and overshot it. Claude 1's addendum said
-- so, and they are right; this is the correction.
--
-- WHAT F1 ACTUALLY NEEDED. The session's `plp_release_id` is the frozen answer
-- to "what did this learner see" only if the release it names is SEALED --
-- otherwise its items can still be edited in place. Plus publication: this
-- repository's own `content_status_transitions` records the FROZEN -> PUBLISHED
-- edge as "made available to the institution", so a sealed release that was
-- never published must not be citable. That pair is exactly
-- `PUBLISHED | SUPERSEDED`: the two content statuses that are both sealed AND
-- were published. `FROZEN` is the one sealed status that never was, and stays
-- refused.
--
-- A NOTE ON WHERE THAT RULE IS QUOTED FROM. 0063 attributed it to a doc 08
-- clause -- "publication is not assignment" -- that does not appear in THIS
-- repository's copy of doc 08. That copy predates the 2026-09-12 baseline
-- amendment: of sixteen baseline documents here, exactly one (doc 03) carries
-- the amendment marker. Claude 1 reports the clause is a section heading in the
-- amended copy, and its amendment header lists "publication vs assignment
-- separated" among that amendment's changes; I cannot see that copy from here,
-- so I record what I checked and what I was told, and claim neither as the
-- other. What was wrong was not the attribution but the METHOD: the clause was
-- carried from review into a migration comment without opening any copy of the
-- source. 0063 is applied and forward-only, so the correction of record lives
-- in ADR-0018. This migration grounds the same rule in text that IS here and is
-- machine-readable, which is stronger than a prose citation either way.
--
-- WHAT 0063 ADDED ON TOP, AND WHY IT WAS WRONG. Requiring `PUBLISHED` alone also
-- refused a release that had been published and later superseded. I argued that
-- was right because superseding is how a correction propagates. Two things I
-- did not check say otherwise, and I checked them this time before deciding:
--
--   1. THE SYSTEM ALREADY ANSWERED THIS, IN THE OTHER PATH. Release status does
--      not gate new sessions anywhere else. `enforce_session_provenance` checks
--      ownership and distribution, never status, and a learner can start a NEW
--      learning-cycle session against a SUPERSEDED release today -- measured,
--      not assumed. 0063 made the ad-hoc path stricter than the learning-cycle
--      path for the same content, which is a difference nobody asked for.
--
--   2. CORRECTION IS NEVER AUTOMATIC HERE. ADR-0016 kept `NOT_STARTED_ONLY`,
--      an audit row per move, and "the refusal of any automatic move": moving a
--      school onto a corrected release is an explicit, audited act on the
--      learning assignment. 0063 performed that move's effect automatically and
--      silently, triggered by something the CONTENT OWNER did elsewhere. Doc 08
--      is consistent with this: an in-progress session "stays bound to the
--      release it was created under, even if that release is superseded".
--
-- And the operational cost was real: a consuming school can neither publish
-- canonical content nor grant itself a successor, so under 0063 a canonical
-- supersede silently stopped Quick Assessment for every school holding the old
-- grant until each was granted the new release, one at a time.
--
-- THE LEVER THAT DOES STOP USE IS THE AUDITED ONE. Withdrawing the DISTRIBUTION
-- (`withdraw_release_distribution`) already refuses the next session through
-- `release_is_distributed_to`, with an audit row. That is the platform's answer
-- to "stop using this", and 0063 duplicated it in an unaudited, automatic form.
--
-- ONE THING WORTH RECORDING RATHER THAN CHANGING. `withdraw_release` sets a
-- release to `SUPERSEDED` too, so that status means both "replaced by a
-- successor" and "withdrawn by its owner", and this predicate admits both. That
-- is not a new looseness introduced here: the learning-cycle path admits a new
-- session against a withdrawn release today, which was measured before writing
-- this. Whether a withdrawn RELEASE should stop new sessions is a platform-wide
-- question for both paths, decided in one place, with an ADR -- not something to
-- bolt onto quick assessments alone. QAC-T12 pins the behaviour as it is, so a
-- later decision changes a test rather than discovering a surprise.
--
-- THE MESSAGE. What remains refused is a chapter that was never published, or
-- one the school no longer holds a grant for. The refusal now names both
-- plainly instead of saying "not published" about content that is published but
-- no longer shared.

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
       and r.status in ('PUBLISHED', 'SUPERSEDED')
       and (r.institution_id = v_aa.institution_id
         or public.release_is_distributed_to(r.id, v_aa.institution_id))
     -- a live PUBLISHED release wins over a SUPERSEDED one for the same course:
     -- `published_at desc nulls last` puts the later publication first.
     order by (r.institution_id = v_aa.institution_id) desc,
              (r.status = 'PUBLISHED') desc,
              r.published_at desc nulls last, r.created_at desc
     limit 1;
    if v_release is null then
      raise exception
        'this quick assessment is over material this school cannot use right now: either the chapter has not been published, or it is no longer shared with you';
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
-- The behavioural half proves the two REFUSALS this predicate keeps, in a
-- rolled-back subtransaction: an INGESTED release (F1's case -- unsealed, so the
-- binding would pin nothing) and a FROZEN one (sealed, but never published).
-- Both are reachable from an empty database.
--
-- The ADMISSION -- that a SUPERSEDED release now opens a session, and that the
-- items it presents are still immutable -- is asserted structurally here and
-- proven behaviourally in QAC-T11 state (d) and QAC-T12, with a CI plant. The
-- reason is not laziness: the only legal path to SUPERSEDED runs through
-- PUBLISHED, and `enforce_release_publish_readiness` gates that on a course
-- passing the real quality gate. Reproducing that fixture inside a migration
-- would mean carrying a full publishable package here, where the suite already
-- has one. Stated rather than skipped quietly.
-- ---------------------------------------------------------------------------
do $$
declare
  v_src text; n int;
  v_school uuid; v_fac uuid; v_dep uuid; v_prog uuid; v_coh uuid; v_class uuid; v_period uuid;
  v_course uuid; v_mod uuid; v_les uuid; v_rel uuid; v_hod uuid;
  v_uid uuid; v_person uuid; v_luid uuid; v_learner uuid; v_enrol uuid;
  v_ruid uuid; v_reviewer uuid;
  v_row record; v_sess uuid; v_refused boolean; v_msg text; t text;
begin
  -- === structural ==========================================================
  v_src := pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure);

  if v_src !~ 'PUBLISHED'', ''SUPERSEDED' then
    raise exception 'the ad-hoc release resolution is not "sealed and was published"';
  end if;
  -- 0063 wrote the over-strict rule as `and r.status = 'PUBLISHED'` in the WHERE
  -- clause. The `and` matters: the ORDER BY below legitimately contains
  -- `(r.status = 'PUBLISHED') desc` as a tie-breaker, and an assertion that
  -- could not tell the two apart fired on this migration's own text.
  if v_src ~ 'and r\.status = ''PUBLISHED''' then
    raise exception '0063''s over-strict equality is still present in the WHERE clause';
  end if;
  -- and the tie-breaker IS present: a live release wins over a withdrawn one
  -- published later for the same course, which `published_at desc` alone would
  -- get backwards
  if v_src !~ '\(r\.status = ''PUBLISHED''\) desc' then
    raise exception 'the live-release tie-breaker is missing from the ordering';
  end if;
  -- the admission's safety rests on SUPERSEDED being a SEALED status, so the
  -- items a session presents stay immutable. Read from the live function rather
  -- than assumed.
  if pg_get_functiondef('public.content_is_sealed(uuid)'::regprocedure) !~ 'SUPERSEDED' then
    raise exception 'SUPERSEDED is no longer a sealed status; admitting it would reopen F1';
  end if;
  -- FROZEN must not be reachable: it is the sealed status that was never published
  if v_src ~ '''FROZEN''' then
    raise exception 'the ad-hoc release resolution admits FROZEN';
  end if;
  if v_src !~ 'v_release := v_la\.plp_release_id' then
    raise exception 'the learning-cycle release binding was disturbed by this repair';
  end if;
  if has_function_privilege('anon', 'public.start_learning_session(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'start_learning_session became anon-executable';
  end if;
  if not has_function_privilege('authenticated', 'public.start_learning_session(uuid)'::regprocedure, 'EXECUTE') then
    raise exception 'start_learning_session lost its authenticated grant';
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0064 school', 'probe-0064-school', true, true) returning id into v_school;
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

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0064-guru@local.invalid')
    returning id into v_uid;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0064-penelaah@local.invalid')
    returning id into v_ruid;
    select a.person_id into v_reviewer from public.accounts a where a.auth_user_id = v_ruid;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0064-murid@local.invalid')
    returning id into v_luid;
    select a.person_id into v_learner from public.accounts a where a.auth_user_id = v_luid;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, 'INSTITUTION_ADMIN', v_school, now() - interval '1 day', now() + interval '1 day');
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_reviewer, 'INSTITUTION_ADMIN', v_school, now() - interval '1 day', now() + interval '1 day');
    perform set_config('app.seed_intent', '', true);
    insert into public.enrollments (person_id, institution_id, academic_period_id, status, valid_from)
    values (v_learner, v_school, v_period, 'ACTIVE', now() - interval '1 day') returning id into v_enrol;
    insert into public.memberships (enrollment_id, node_id, academic_period_id, valid_from)
    values (v_enrol, v_class, v_period, now() - interval '1 day');

    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_school, 'Matematika', 'SD', 'Kelas 5', 'probe 0064 own course', v_person) returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_course, v_school, 1, 'probe modul', v_person) returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown, author_person_id)
    values (v_mod, v_school, 1, 'probe pelajaran', 'isi', v_person) returning id into v_les;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, predicted_difficulty)
    select v_les, v_school, 'MCQ_SINGLE', 'PRACTICE', 'probe soal ' || g,
           case when g <= 2 then 0.8 else null end
      from generate_series(1, 4) g;
    insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_school, v_course, '1.0.0', v_person) returning id into v_rel;

    perform set_config('request.jwt.claims', json_build_object('sub', v_uid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);

    -- (1) F1's case, still refused: the release is INGESTED, the course unsealed
    if public.content_is_sealed(v_course) then
      raise exception 'the probe course is sealed before the release moves; case (1) is not F1''s';
    end if;
    select * into v_row from public.launch_quick_assessment(v_class, v_mod, 3, 30);
    perform set_config('request.jwt.claims', json_build_object('sub', v_luid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_luid::text, true);
    v_refused := false;
    begin
      perform public.start_learning_session(v_row.assessment_assignment_id);
    exception when others then v_refused := sqlerrm ~ 'cannot use right now'; end;
    if not v_refused then
      raise exception 'F1 reappeared: a learner sat a quick assessment against an unsealed release';
    end if;

    -- (2) FROZEN: sealed, but never published. Refused, because the transition
    --     table calls FROZEN -> PUBLISHED "made available to the institution"
    --     -- the half of the rule 0064 keeps.
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);
    foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      update public.plp_releases set status = t::public.content_status where id = v_rel;
    end loop;
    -- APPROVED needs a reviewer who is not the author, so the second admin acts
    perform set_config('request.jwt.claims', json_build_object('sub', v_ruid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_ruid::text, true);
    update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_reviewer where id = v_rel;
    update public.plp_releases set status = 'FROZEN' where id = v_rel;
    if not public.content_is_sealed(v_course) then
      raise exception 'a FROZEN release does not seal its course; case (2) is not what it claims';
    end if;
    if (select r.published_at from public.plp_releases r where r.id = v_rel) is not null then
      raise exception 'the FROZEN probe release carries a publication time; it was published after all';
    end if;

    perform set_config('request.jwt.claims', json_build_object('sub', v_uid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);
    select * into v_row from public.launch_quick_assessment(v_class, v_mod, 3, 30);
    perform set_config('request.jwt.claims', json_build_object('sub', v_luid::text)::text, true);
    perform set_config('request.jwt.claim.sub', v_luid::text, true);
    v_refused := false;
    begin
      perform public.start_learning_session(v_row.assessment_assignment_id);
    exception when others then v_refused := sqlerrm ~ 'cannot use right now'; end;
    if not v_refused then
      raise exception 'a learner sat a quick assessment against a FROZEN, never-published release';
    end if;

    raise exception 'PROBE_0064_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0064_ROLLBACK' then raise; end if;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 0102 -- MUTABLE CONTENT PRODUCES NO COMMITTED EVIDENCE, and a sealed
-- course's learning context stops being editable.
--
-- WHAT WAS WRONG, reproduced through the ordinary product path before it was
-- repaired. WP6A's closure review asked whether adding `learning_context` to
-- the sealed-content guard was enough. It was not, and the reason was not the
-- column list -- it was the guard's activation condition. Measured on a
-- database seeded from this repository, with NO owner-side write anywhere:
-- the educator authored a course and a release with CAN_DRAFT, the
-- administrator activated the assignments with CAN_ASSIGN_LEARNING, and the
-- learner sat the assessment through start_learning_session / record_answer /
-- finish_my_session. The release was never published, so
-- `content_is_sealed(course)` was false the whole way through -- and yet:
--
--   official session: 1        result: 1        course sealed: NO
--   item.correctness_rate                     have 1
--   class.misconceptions   status ok, sample 3, WITH remediation attached
--
-- Then the same educator moved the context, twice, and was allowed to both
-- times:
--
--   ACADEMIC -> PROFESSIONAL_DEVELOPMENT   item.correctness_rate  1 -> 0
--                                          class.misconceptions   ok -> have 0
--   PROFESSIONAL_DEVELOPMENT -> ACADEMIC   item.correctness_rate  0 -> 1
--                                          class.misconceptions   restored
--
-- A class's real misconception finding, remediation and all, disappeared and
-- came back because somebody edited one column on a course. That is the
-- defect, and the sealed-content guard could never have caught it, because the
-- course it was asked about had never been sealed.
--
-- WHY THE HOLE WAS IN THIS PATH AND NOT THE OTHER. 0063 asked exactly this
-- question for the ad-hoc arm of `start_learning_session` and refused an
-- unsealed release, quoting the contract the binding rests on: the session's
-- `plp_release_id` is "the frozen answer to what did this learner see" only
-- if the release it names is sealed, because
-- `enforce_taught_content_immutable` fires nowhere else. 0064 then corrected
-- 0063's overshoot to `PUBLISHED | SUPERSEDED` -- "the two content statuses
-- that are both sealed AND were published" -- and recorded, in the same
-- breath, that the learning-cycle arm "admits a new session against a
-- SUPERSEDED release today, which was measured before writing this", and that
-- making one arm stricter than the other for the same content "is a
-- difference nobody asked for". This migration removes the difference in the
-- direction 0064 pointed: the learning-cycle arm now asks the same question.
--
-- THE STARTABLE STATE IS THE REPOSITORY'S, NOT A NEW ONE. Two questions are
-- not the same question:
--
--   1. is the content immutable enough to carry committed evidence?
--      -- answered by `content_is_sealed`: FROZEN, PUBLISHED, SUPERSEDED.
--   2. may this release begin a NEW learner attempt?
--      -- answered since 0063/0064 by PUBLISHED | SUPERSEDED.
--
-- (2) is strictly inside (1), which is the whole point: anything that can
-- produce evidence is already sealed, so the context protection below can
-- never be too late again. FROZEN is refused by (2) because
-- `content_status_transitions` records FROZEN -> PUBLISHED as "made available
-- to the institution": a release that was sealed and never published was
-- never made available. SUPERSEDED is ADMITTED by (2), deliberately and not
-- by omission: supersession is not withdrawal (0064, ADR-0016), correction is
-- never automatic here, and the audited lever for "stop using this" is
-- withdrawing the DISTRIBUTION, which `release_is_distributed_to` already
-- enforces. Whether a WITHDRAWN release should stop new sessions is the
-- platform-wide question 0064 recorded for both paths and one ADR; it is not
-- decided here, and this migration leaves it exactly where it was.
--
-- WHAT THIS DOES NOT DO. No capability changes, no role changes, no new
-- policy, no context-conversion operation, and no change to any WP6A evidence
-- source. Quick Assessment is not touched: its arm keeps its own text, its
-- own ordering and its own distribution test, and the terminal block asserts
-- that it still does.
-- ---------------------------------------------------------------------------

-- ─────────────── the startable state, named once instead of twice
create function public.release_starts_new_sessions(p_release uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.plp_releases r
                  where r.id = p_release
                    and r.status in ('PUBLISHED', 'SUPERSEDED'))
$$;
comment on function public.release_starts_new_sessions(uuid) is
  'May this release begin a NEW learner attempt? PUBLISHED or SUPERSEDED -- the two content '
  'statuses that are both sealed and were published (0063, 0064). Sealed, because a session''s '
  'release binding is the frozen answer to "what did this learner see" only while the content '
  'cannot change underneath it. Published, because content_status_transitions records '
  'FROZEN -> PUBLISHED as "made available to the institution". Not a second lifecycle: this is '
  'the rule the ad-hoc path has enforced since 0063, given a name so both paths cite one source.';
revoke all on function public.release_starts_new_sessions(uuid) from public, anon, authenticated;

-- ─────────────── the ordinary learning-cycle path asks the same question
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
-- ADR-0021 restated rather than assumed. `create or replace` does not reset
-- privileges, so these two lines change nothing -- they say, where a reader
-- and the authoring-time check both look, exactly what this function already
-- held: not PUBLIC, not anon, executable by authenticated and service_role.
revoke all on function public.start_learning_session(uuid) from public, anon;
grant execute on function public.start_learning_session(uuid) to authenticated, service_role;

-- ─────────────── and a sealed course's context stops being editable
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
      v_cols := array['lesson_id','item_type','bank_type','stem','stimulus','petunjuk',
                      'arah_berpikir','objective_ids','is_safety_critical',
                      'predicted_difficulty','parallel_group'];
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
revoke all on function public.enforce_taught_content_immutable() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0014). Structural first, then a behavioural half in a
-- rolled-back subtransaction.
--
-- THE POSITIVE HALF OF THE START PATH IS NOT HERE, and that is 0064's
-- precedent rather than an omission: reaching PUBLISHED means carrying a
-- package through the real publish gate, and the suite already has one. This
-- block proves what it can prove from an empty database -- that the two
-- questions differ, and that a FROZEN release is sealed AND unstartable -- and
-- F06-P21 drives the published case end to end with a real learner.
-- ---------------------------------------------------------------------------
do $$
declare
  v_def text; v_sealed_def text; n int; v_bad text;
  v_inst uuid; v_period uuid; v_fac uuid; v_dep uuid; v_prog uuid; v_coh uuid; v_cls uuid;
  v_adm_u uuid; v_adm uuid; v_edu_u uuid; v_edu uuid; v_lrn_u uuid; v_lrn uuid;
  v_course uuid; v_mod uuid; v_les uuid; v_item uuid; v_defn uuid; v_rel uuid;
  v_la uuid; v_aa uuid; v_enr uuid; v_sess uuid; v_raised boolean; v_msg text;
  v_ctx text; v_pdc uuid; v_acc uuid; v_rev uuid; t text;
begin
  ----------------------------------------------------------------- structural
  if has_function_privilege('authenticated', 'public.release_starts_new_sessions(uuid)', 'execute')
     or has_function_privilege('anon', 'public.release_starts_new_sessions(uuid)', 'execute') then
    raise exception 'the startable-state predicate is client-executable; it is an internal rule';
  end if;

  v_def := pg_get_functiondef('public.release_starts_new_sessions(uuid)'::regprocedure);
  if v_def !~ '''PUBLISHED''' or v_def !~ '''SUPERSEDED''' then
    raise exception 'the startable-state predicate no longer admits the two published-and-sealed statuses';
  end if;
  -- EVERY STATUS IT ADMITS IS A SEALED STATUS. Read out of the two live
  -- function bodies rather than asserted: this is the containment the context
  -- protection below depends on, so it is checked, not assumed.
  v_sealed_def := pg_get_functiondef('public.content_is_sealed(uuid)'::regprocedure);
  foreach t in array array['PUBLISHED', 'SUPERSEDED'] loop
    if v_sealed_def !~ ('''' || t || '''') then
      raise exception '% starts new sessions but is not a sealed status; evidence could outrun the freeze', t;
    end if;
  end loop;

  v_def := pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure);
  if v_def !~ 'release_starts_new_sessions' then
    raise exception 'the learning-cycle arm does not ask whether the release may start a session';
  end if;
  if v_def !~ 'v_release := v_la\.plp_release_id' then
    raise exception 'the learning-cycle release binding was disturbed by this repair';
  end if;
  -- QUICK ASSESSMENT IS UNTOUCHED, asserted the same three ways 0064 asserted it
  if v_def !~ 'PUBLISHED'', ''SUPERSEDED' then
    raise exception 'the ad-hoc release resolution lost its "sealed and was published" rule';
  end if;
  if v_def !~ '\(r\.status = ''PUBLISHED''\) desc' then
    raise exception 'the ad-hoc live-release tie-breaker is missing from the ordering';
  end if;
  if v_def ~ '''FROZEN''' then
    raise exception 'a release resolution in this function admits FROZEN';
  end if;
  if has_function_privilege('anon', 'public.start_learning_session(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.start_learning_session(uuid)', 'execute') then
    raise exception 'start_learning_session''s grants changed';
  end if;

  v_def := pg_get_functiondef('public.enforce_taught_content_immutable()'::regprocedure);
  if v_def !~ '''learning_context''' then
    raise exception 'learning_context is not protected by the sealed-content guard';
  end if;
  foreach t in array array['subject','stage','grade_label','title'] loop
    if v_def !~ ('''' || t || '''') then
      raise exception 'the sealed-content guard stopped protecting courses.%', t;
    end if;
  end loop;
  foreach t in array array['courses','modules','lessons','learning_objectives','items',
                           'item_options','assessment_definitions'] loop
    if v_def !~ ('''' || t || '''') then
      raise exception 'the sealed-content guard lost its % branch', t;
    end if;
  end loop;
  -- AND THE EXEMPTION 0043 ADDED SURVIVES. This function is replaced here by
  -- splicing the live definition and adding one token; the first attempt
  -- spliced 0017's original instead and silently reverted the ad-hoc
  -- exemption, which FABLE-04 caught within the minute. The assertion is
  -- cheaper than the lesson.
  if v_def !~ 'is_ad_hoc' then
    raise exception 'the sealed-content guard lost the ad-hoc definition exemption (ADR-0018)';
  end if;
  select count(*) into n from information_schema.columns
   where table_schema = 'public' and table_name = 'courses' and column_name = 'learning_context'
     and is_nullable = 'NO' and column_default like '%ACADEMIC%';
  if n <> 1 then raise exception 'courses.learning_context is no longer NOT NULL defaulting to ACADEMIC'; end if;

  --------------------------------------------------------------- behavioural
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0102 school', 'probe-0102-school', true, true) returning id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 30, current_date + 300) returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'F') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D') returning id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep, 'PROGRAMME', 'P') returning id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'C', v_period) returning id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'K', v_period) returning id into v_cls;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0102-adm@local.invalid')
    returning id into v_adm_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0102-edu@local.invalid')
    returning id into v_edu_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0102-lrn@local.invalid')
    returning id into v_lrn_u;
    select a.person_id into v_adm from public.accounts a where a.auth_user_id = v_adm_u;
    select a.person_id into v_edu from public.accounts a where a.auth_user_id = v_edu_u;
    select a.person_id into v_lrn from public.accounts a where a.auth_user_id = v_lrn_u;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_adm, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days'),
           (v_edu, 'EDUCATOR',          v_cls,  now() - interval '1 day', now() + interval '365 days');
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_lrn, v_inst, v_period, 'ACTIVE') returning id into v_enr;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr, v_cls, v_period);
    perform set_config('app.seed_intent', '', true);

    -- an ordinary authoring package, and a release that was never published
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id)
    values (v_inst, 'Matematika', 'SD', '5', 'Bab belum diterbitkan', v_edu) returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
    values (v_course, v_inst, 1, 'Modul', v_edu) returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown, author_person_id)
    values (v_mod, v_inst, 1, 'Pelajaran', 'Isi pelajaran.', v_edu) returning id into v_les;
    for n in 1..4 loop
      insert into public.items (lesson_id, institution_id, item_type, bank_type, stem,
                                predicted_difficulty, author_person_id)
      values (v_les, v_inst, 'MCQ_SINGLE', 'TEST', 'Soal ' || n, 0.75, v_edu) returning id into v_item;
      insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale)
      values (v_item, v_inst, 'A', 'benar', true, 'Tepat.'),
             (v_item, v_inst, 'B', 'salah', false, 'Belum tepat.');
    end loop;
    insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type,
      item_count, difficulty_mix, safety_critical_minimum, passing_rules,
      hesitation_window_seconds, shuffle_policy, allows_pause, offline_tolerant,
      late_sync_grace_seconds, attempt_limit, author_person_id)
    values (v_inst, v_course, 'Uji bab belum diterbitkan', 'POST_TEST', 'TEST',
            3, '{"MUDAH":3}'::jsonb, 0, '{}'::jsonb, 25, 'ITEMS_AND_OPTIONS', true, true,
            120, 2, v_edu)
    returning id into v_defn;
    insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_course, '1.0.0', v_edu) returning id into v_rel;
    insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
                                             academic_period_id)
    values (v_inst, v_rel, v_course, v_cls, v_period) returning id into v_la;
    insert into public.assessment_assignments (institution_id, assessment_definition_id,
                                               learning_assignment_id, node_id, academic_period_id)
    values (v_inst, v_defn, v_la, v_cls, v_period) returning id into v_aa;

    -- assigned by the capability holder, exactly as before this migration
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_u::text, true);
    update public.learning_assignments   set status = 'ACTIVE'    where id = v_la;
    update public.assessment_assignments set status = 'SCHEDULED' where id = v_aa;
    update public.assessment_assignments set status = 'OPEN'      where id = v_aa;

    -- (1) THE LEARNER IS ENTITLED AND IS STILL REFUSED, because the content is
    --     still editable. Entitlement is untouched: may_start_assessment, which
    --     decides authorization, still says OK.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_lrn_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_lrn_u::text, true);
    select e.reason into v_msg from public.may_start_assessment(v_aa) e;
    if v_msg <> 'OK' then
      raise exception 'the probe learner is not entitled (%); the refusal below would prove nothing', v_msg;
    end if;
    v_raised := false;
    begin
      v_sess := public.start_learning_session(v_aa);
    exception when others then v_raised := true; v_msg := sqlerrm;
    end;
    if not v_raised then
      raise exception 'an entitled learner started a session over content that can still be edited';
    end if;
    if v_msg !~ 'published' then
      raise exception 'the refusal does not name publication: %', v_msg;
    end if;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    select count(*) into n from public.assessment_sessions s where s.assessment_assignment_id = v_aa;
    if n <> 0 then raise exception 'the refused start left % session row(s) behind', n; end if;

    -- (2) THE TWO QUESTIONS ARE NOT THE SAME QUESTION. Walked to FROZEN
    --     through the declared transitions by the actor holding
    --     CAN_FREEZE_RELEASE: sealed, and still unstartable.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_u::text, true);
    foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      update public.plp_releases set status = t::public.content_status where id = v_rel;
    end loop;
    update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_adm where id = v_rel;
    update public.plp_releases set status = 'FROZEN' where id = v_rel;
    if not public.content_is_sealed(v_course) then
      raise exception 'a course with a frozen release is not sealed; the containment claim is wrong';
    end if;
    if public.release_starts_new_sessions(v_rel) then
      raise exception 'a release that was sealed but never published starts new sessions';
    end if;

    -- (3) AND NOW THE CONTEXT IS FROZEN TOO, for the actor who could move it
    --     freely one statement ago.
    v_raised := false;
    begin
      update public.courses set learning_context = 'PROFESSIONAL_DEVELOPMENT' where id = v_course;
    exception when others then v_raised := true; v_msg := sqlerrm;
    end;
    if not v_raised then
      raise exception 'a sealed course''s learning context was reclassified by an ordinary edit';
    end if;
    if v_msg !~ 'learning_context' then
      raise exception 'the refusal is not about the context: %', v_msg;
    end if;
    select c.learning_context::text into v_ctx from public.courses c where c.id = v_course;
    if v_ctx <> 'ACADEMIC' then raise exception 'the refused edit moved the context to %', v_ctx; end if;

    -- (4) CREATION AND REVISION ARE UNCHANGED. A new course is not sealed, so
    --     the guard returns early and both contexts are still establishable.
    v_pdc := public.create_course(v_inst, 'Pengembangan', 'Guru', '-', 'PD 0102',
                                  'PROFESSIONAL_DEVELOPMENT');
    v_acc := public.create_course(v_inst, 'Matematika', 'SD', '6', 'Akademik 0102');
    if (select c.learning_context::text from public.courses c where c.id = v_pdc)
         <> 'PROFESSIONAL_DEVELOPMENT'
       or (select c.learning_context::text from public.courses c where c.id = v_acc) <> 'ACADEMIC' then
      raise exception 'the authoritative creation path stopped establishing the requested context';
    end if;
    insert into public.plp_releases (institution_id, course_id, version_label, author_person_id)
    values (v_inst, v_pdc, '1.0.0', v_edu) returning id into v_rel;
    foreach t in array array['STRUCTURED','VALIDATED','IN_REVIEW'] loop
      update public.plp_releases set status = t::public.content_status where id = v_rel;
    end loop;
    update public.plp_releases set status = 'APPROVED', reviewed_by_person_id = v_adm where id = v_rel;
    update public.plp_releases set status = 'FROZEN' where id = v_rel;
    v_rev := public.create_course_revision(v_pdc);
    if (select c.learning_context::text from public.courses c where c.id = v_rev)
         <> 'PROFESSIONAL_DEVELOPMENT' then
      raise exception 'a revision of a sealed professional-development course lost its context';
    end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug = 'probe-0102-school';
  if n <> 0 then raise exception 'the probe left its school behind'; end if;

  raise notice '0102 verified: the startable state is PUBLISHED|SUPERSEDED and is named once; the '
    'learning-cycle arm now asks it, and an entitled learner over still-editable content is REFUSED '
    'and leaves no session row; a release sealed but never published is sealed AND unstartable, so '
    'the two questions are measurably different; a sealed course''s learning_context is immutable to '
    'the same actor who could move it a statement earlier; creation still establishes either context '
    'and a revision of a sealed professional-development course still inherits it; and Quick '
    'Assessment''s own rule, ordering and refusals are untouched';
end $$;

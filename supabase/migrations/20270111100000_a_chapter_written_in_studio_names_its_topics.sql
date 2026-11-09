-- MC-9: A CHAPTER WRITTEN IN STUDIO NAMES ITS TOPICS; ONE EVIDENCE RULE; ONE DISCLOSURE RULE
-- (Reporting Quality Gate, owner directive 9 Nov 2026; owner rulings O3, D5, D6, D7, D8; Sharon's reviews of 94160304)
--
-- 1. TOPICS ARE NAMED BY THEIR OBJECTIVES IN A STUDIO CHAPTER (D-088(g)). A definition made by Studio belongs to the
--    COURSE (module_id null). calc_class_topic_mastery, calc_institution_competency_outcomes and tujuan_belum_tercapai
--    now find each per_domain code's objective among the lessons of the definition's module, or of every module of
--    its course, in the chapter's order. A code that maps to no objective is still kept by its code. A topic carries
--    `title` (its lesson's short title) only where that lesson has exactly one objective.
--
-- 2. ONE EVIDENCE RULE (decision 8), stated in full above the calculators: a sitting's EFFECTIVE result is its latest
--    computed official result (a recomputation is never another attempt); a learner's CURRENT result in a chapter is
--    the effective result of their latest sitting of it (by finalisation, never by recomputation); their BASELINE is
--    their earliest Pemetaan Awal. Current mastery (Pemahaman, per bab, per topik, school competencies, Angkatan, the
--    bands, the class's dots and the named learners) reads the current result; Kenaikan reads current − baseline over
--    the pairs with both (MC-8 took each test's HIGHEST result); the safety gate rate is a measure of sittings.
--    Certificates follow their own sealed evidence and are not changed here.
--
-- 3. THE POPULATION IS PEOPLE. Every sample is distinct learners (count(distinct person)), never results or sittings.
--
-- 4. ONE DISCLOSURE RULE (decisions 6 and 7), stated in full above the calculators: each row withholds its mean below
--    its own governed minimum and gives `needed`; a figure that combines cells (a class's learners in a chapter or a
--    topic) is shown only when every cell reaches its minimum, otherwise it is WITHHELD with its meaning unchanged
--    (`withheld`, and the evaluator says «laporan.metrik.dilindungi»), never recomputed without the small cell; withheld
--    rows are listed after shown ones by name or identifier, never by their hidden values. Kenaikan's before → after
--    pair answers only when it cannot be set against the chapter rows. Misconception patterns are gated on distinct
--    learners (MC-9 minimum 5, owner approval); occurrences stay occurrences.
--
-- 5. THE ANGKATAN IS HISTORY (decision 5). A sitting records its class's Angkatan as the structure stands when it is
--    sat (start_learning_session); open_assessment_session refuses a named Angkatan that is not the class's, or, with
--    no class, not one the enrolment is placed in. A sitting that recorded none stays in the explicit «Angkatan tidak
--    tercatat» row, never placed by today's structure, and still counts in every figure that needs no Angkatan.
--
-- 6. «Per bab» (class.chapter_mastery, ruling O3): a new class metric, a class's chapters kept apart.
--
-- CATALOGUE: MC-8 → MC-9 (D-060(a)). Every MC-8 definition, tier, threshold and source is carried unchanged except
-- class.misconceptions' minimum (3 → 5); MC-9 adds class.chapter_mastery and four content/catalogue sources
-- (`modules`, `plp_releases`, `courses`, `metric_definitions`). MC-8 stays as it is (D-060(e)). The evaluator changes
-- in one place (section «the evaluator says WITHHELD»).

-- ═══════════════════════════════════════════════════════════ CATALOGUE MC-9
insert into public.metric_catalogue (version, note)
select 'MC-9',
       'MC-9 (Reporting Quality Gate; owner rulings O3, D5-D8). EVIDENCE: a sitting''s effective result is its latest '
       'computed official result (a recomputation is not an attempt); current mastery is the effective result of a '
       'learner''s latest sitting of a chapter''s Uji Penguasaan; Kenaikan is current minus the earliest Pemetaan Awal '
       'over the (learner, chapter) pairs with both (no highest result is read anywhere); the safety gate rate is over '
       'sittings, gated on learners. POPULATION: every sample is distinct learners. DISCLOSURE: every row (chapter, '
       'topic, competency, Angkatan, misconception pattern) withholds its value below its own minimum and gives needed; a '
       'figure combining cells (a class''s learners in a chapter or topic) is withheld, meaning unchanged, unless every '
       'cell reaches its minimum; withheld rows are ordered by name or identifier, never by value. COHORT: a sitting '
       'records its class''s Angkatan when sat, checked where written; none recorded stays «not recorded». NAMES: '
       'topics resolve to their objectives in a Studio chapter (course-level definition). DEFINITIONS: MC-8''s, except '
       'class.misconceptions minimum 3 -> 5; adds class.chapter_mastery (per chapter, current mastery). SOURCES: MC-8''s '
       'plus modules, plp_releases, courses, metric_definitions'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-9');

update public.metric_catalogue set superseded_by = 'MC-9'
 where version = 'MC-8' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-9', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       -- owner approval (9 Nov): a misconception pattern is a class pattern only over the class minimum of learners
       case when d.metric_id = 'class.misconceptions' then 5 else d.minimum_sample end, d.allowed_visualizations, d.allowed_audiences,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-8'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-9' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-9', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-8'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-9' and x.tier_key = t.tier_key);

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-9', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-8'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-9' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why)
select 'MC-9', m.source_relation, m.why
  from public.metric_sources m where m.catalogue_version = 'MC-8'
on conflict (catalogue_version, source_relation) do nothing;

insert into public.metric_sources (catalogue_version, source_relation, why) values
  ('MC-9', 'metric_definitions', 'catalogue, not evidence: a calculator withholding a row under its own minimum reads that minimum from the catalogue it is evaluated under'),
  ('MC-9', 'plp_releases', 'content, not evidence: the chapter (release) a sitting belongs to, to keep a class''s chapters apart (class.chapter_mastery, owner ruling O3)'),
  ('MC-9', 'courses', 'content, not evidence: the chapter''s title, so a chapter row is named (class.chapter_mastery)'),
  ('MC-9', 'modules', 'content, not evidence: the modules of the course an assessment names (a chapter written in Studio), so a per_domain code resolves to that chapter''s objective (D-088(g))')
on conflict (catalogue_version, source_relation) do nothing;

-- ═══════════════════════════════════════════════════════════ «Per bab»: a class's chapters kept apart (owner ruling O3)
-- «Pemahaman» averages a class's current results over all its chapters (decision 7: its population is unchanged), so
-- a new class figure keeps each chapter apart: per chapter (the release the sitting belongs to), its learners (each
-- counted once, by their current result in it) and their mean. A chapter under the minimum gives its learners and no
-- mean, and then Pemahaman is withheld too (the disclosure rule). Its definition copies class.comprehension's scope,
-- evidence class, minimum, visualizations and audiences. The sample is the class's learners with any chapter's result.
insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key, deprecated, deprecation_note_key)
select 'MC-9', 'class.chapter_mastery', 'metrik.bab.label', 'metrik.bab.arti', d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences, 'class_chapter_mastery', false, null
  from public.metric_definitions d
 where d.catalogue_version = 'MC-9' and d.metric_id = 'class.comprehension'
   and not exists (select 1 from public.metric_definitions x where x.catalogue_version = 'MC-9' and x.metric_id = 'class.chapter_mastery');

insert into public.metric_calculator_scope (calculation_key, governing_scope, why) values
  ('class_chapter_mastery', 'NODE', 'keys on scoped_official_sessions.class_node_id: the class the caller names, its chapters kept apart (owner ruling O3)')
on conflict (calculation_key) do nothing;



-- the sitting records the Angkatan that applies when it is sat (owner decision 5)
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
-- ADR-0021: re-emitted, so its grants are stated again here: the learner's own call (authenticated), nobody else
revoke all on function public.start_learning_session(uuid) from public, anon;
grant execute on function public.start_learning_session(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ the learner's objectives not yet reached
-- the body of 20261225100000, with the chapter's objective found the same way
create or replace function public.tujuan_belum_tercapai(p_class uuid, p_learner uuid)
returns table (objective_id uuid, statement text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[];
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null or p_learner is null then return; end if;

  select n.institution_id, n.jalur into v_inst, v_jalur
    from public.org_nodes n where n.id = p_class and n.kind = 'CLASS';
  if v_inst is null then return; end if;

  -- the audiences the catalogue gives the learner's record, less the learner's own
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;

  -- the reader stands over THIS class
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me
                    and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud)
                    and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;

  -- the learner is in this class now
  if not exists (select 1 from public.memberships m
                   join public.enrollments e on e.id = m.enrollment_id
                  where m.node_id = p_class and m.valid_to is null
                    and e.person_id = p_learner and e.institution_id = v_inst
                    and e.status in ('PENDING', 'ACTIVE')) then
    return;
  end if;

  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with latest as (
        -- each of the learner's official Uji Penguasaan attempts in this class, its EFFECTIVE result: the one nothing
        -- supersedes (D11, structural; a recalculation stamped earlier than its original is still the one read)
        select distinct on (r.session_id) r.session_id, r.per_domain, s.assessment_definition_id, s.finalized_at
          from public.scoped_official_results r
          join public.scoped_official_sessions s on s.id = r.session_id
         where not exists (select 1 from public.scoped_official_results q where q.supersedes_result_id = r.id)
           and s.institution_id = v_inst
           and s.class_node_id = p_class
           and s.person_id = p_learner
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by r.session_id, r.computed_at desc, (r.supersedes_result_id is not null) desc
      ), per_objective as (
        select kv.key as code,
               (kv.value ->> 'penguasaan')::numeric as penguasaan,
               a.pass_mark,
               l.finalized_at, l.session_id,
               (select o.id
                  from public.assessment_definitions ad
                  join public.modules mo on mo.id = ad.module_id or (ad.module_id is null and mo.course_id = ad.course_id)
                  join public.lessons le on le.module_id = mo.id
                  join public.learning_objectives o on o.lesson_id = le.id
                 where ad.id = l.assessment_definition_id and o.code = kv.key
                 order by mo.ordinal, le.ordinal, o.id
                 limit 1) as objective_id
          from latest l
          join public.assessment_sessions a on a.id = l.session_id,
               lateral jsonb_each(coalesce(l.per_domain, '{}'::jsonb)) kv(key, value)
         where jsonb_typeof(kv.value) = 'object'
           and jsonb_typeof(kv.value -> 'penguasaan') = 'number'
      ), newest as (
        -- the learner's most recent attempt that recorded each objective
        select distinct on (coalesce(p.objective_id::text, p.code)) p.*
          from per_objective p
         order by coalesce(p.objective_id::text, p.code), p.finalized_at desc nulls last, p.session_id
      )
      select x.objective_id, coalesce(lo.statement, x.code) as statement
        from newest x
        left join public.learning_objectives lo on lo.id = x.objective_id
       where x.pass_mark is not null and x.penguasaan < x.pass_mark
       order by coalesce(lo.statement, x.code), x.code;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
revoke all on function public.tujuan_belum_tercapai(uuid, uuid) from public, anon;
grant execute on function public.tujuan_belum_tercapai(uuid, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ a class's target, for whoever reads its report (owner ruling O2)
-- The class target a report draws (the mark each Uji Penguasaan given to the class sealed) was read from
-- assessment_assignments, which only CAN_DRAFT and CAN_ASSIGN_LEARNING may read, so a Dekan (and a Kepala departemen
-- without those) saw no target and no «di bawah target». This gives the reader of a class's figures exactly that and
-- nothing else: per chapter (release) of the class, its sealed Uji Penguasaan mark. Who may read it: whoever may already
-- read the assignments, or an audience of the class's own figures under the live catalogue (class.topic_mastery's
-- audiences, over this class: audience_on_node, the rule metric_evaluate applies). No window, no learner, no item,
-- no answer, no other class. Read-only.
create or replace function public.target_kelas(p_class uuid)
returns table (plp_release_id uuid, pass_mark numeric)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_aud public.app_role[];
begin
  if p_class is null or public.current_person_id() is null then return; end if;
  select n.institution_id into v_inst from public.org_nodes n where n.id = p_class and n.kind = 'CLASS';
  if v_inst is null then return; end if;
  select m.allowed_audiences into v_aud from public.metric_definitions m
   where m.catalogue_version = public.current_metric_catalogue() and m.metric_id = 'class.topic_mastery';
  if not (public.can_in_institution('CAN_DRAFT', v_inst) or public.can_in_institution('CAN_ASSIGN_LEARNING', v_inst)
          or (v_aud is not null and public.audience_on_node(v_aud, p_class))) then
    return;
  end if;
  return query
    select la.plp_release_id, aa.pass_mark
      from public.assessment_assignments aa
      join public.assessment_definitions d on d.id = aa.assessment_definition_id and d.mode = 'POST_TEST'
      left join public.learning_assignments la on la.id = aa.learning_assignment_id
     where aa.node_id = p_class and aa.status in ('OPEN', 'CLOSED');
end $$;
revoke all on function public.target_kelas(uuid) from public, anon;
grant execute on function public.target_kelas(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('target_kelas', 'STAFF', 'Owner ruling O2 (9 Nov): the class target a report draws, per chapter of the class: the mark '
   || 'each Uji Penguasaan given to the class sealed, nothing else. For a reader of the assignments (CAN_DRAFT, '
   || 'CAN_ASSIGN_LEARNING) or an audience of the class''s own figures over this class (class.topic_mastery, '
   || 'audience_on_node); anyone else gets nothing.',
   'DELEGATED', 'audience_on_node')
on conflict (function_name) do nothing;

-- ═══════════════════════════════════════════════════════════ the source-family guard knows MC-9's content
-- assert_academic_sources_are_context_bound admits a calculator's relations by family. MC-9's calculators read the
-- rest of the chapter (modules, plp_releases, courses) and the catalogue's own minimum (metric_definitions): content
-- and reference data, never evidence. They are admitted by name, and the guard's own check that a content relation
-- holds no learner now covers them too. Nothing else in the guard changes.
CREATE OR REPLACE FUNCTION public.assert_academic_sources_are_context_bound()
 RETURNS TABLE(ok boolean, detail text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_bad text := ''; v_def text; v_rel text; n_checked int := 0;
begin
  -- EVERY RESPONSE-DERIVED ACADEMIC SOURCE READS THE ACADEMIC BOUNDARY, and
  -- none of them reaches past it to official_responses or responses.
  foreach v_rel in array array['service_item_statistics', 'service_distractor_uptake',
                               'service_cohort_misconceptions'] loop
    n_checked := n_checked + 1;
    v_def := lower(pg_get_viewdef(('public.' || v_rel)::regclass, true));
    if v_def not like '%academic_responses%' then
      v_bad := v_bad || format('%s does not read the academic evidence boundary; ', v_rel);
    end if;
    if v_def ~ '\mofficial_responses\M' or v_def ~ '\mpublic\.responses\M' then
      v_bad := v_bad || format('%s reaches past the academic boundary to raw responses; ', v_rel);
    end if;
  end loop;

  -- THE CREDENTIAL SOURCE COUNTS ACADEMIC CREDENTIALS. A PD certificate is
  -- valid and verifiable; it is simply not one of these.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_certificates'::regclass, true));
  if v_def not like '%academic_certificates%' then
    v_bad := v_bad || 'the credential metric source does not read academic certificates; ';
  end if;

  -- AND THE BOUNDARIES THEMSELVES STILL ASK THE QUESTION.
  foreach v_rel in array array['academic_responses', 'academic_certificates'] loop
    n_checked := n_checked + 1;
    if to_regclass('public.' || v_rel) is null then
      v_bad := v_bad || format('%s is gone; ', v_rel);
    else
      v_def := lower(pg_get_viewdef(('public.' || v_rel)::regclass, true));
      if v_def not like '%learning_context%' or v_def not like '%academic%' then
        v_bad := v_bad || format('%s no longer narrows by learning context; ', v_rel);
      end if;
      -- fail closed: an outer join would admit rows whose provenance cannot
      -- be resolved, which is how "unknown" becomes "academic"
      if v_def ~ '\mleft join\M' or v_def ~ '\mright join\M' or v_def ~ '\mfull join\M' then
        v_bad := v_bad || format('%s resolves provenance with an outer join, so unknown becomes academic; ', v_rel);
      end if;
      -- AND IT READS ITS SOURCE WITH THE CALLER'S RIGHTS, like the OFFICIAL
      -- boundary it sits beside. A definer view in an invoker chain quietly
      -- changes whose rights the rows are filtered for.
      if not exists (select 1 from pg_class cl
                      where cl.oid = ('public.' || v_rel)::regclass
                        and cl.reloptions::text like '%security_invoker=true%') then
        v_bad := v_bad || format('%s does not read its source with the caller''s rights; ', v_rel);
      end if;
    end if;
  end loop;

  -- THE FOURTH FAMILY. Eleven of the sixteen calculators reach evidence
  -- through the session/result pair rather than through responses or
  -- certificates, so the guard names that narrowing too -- otherwise it would
  -- cover three of the four families and read as if it covered all of them,
  -- which is the same mistake as the crown test it replaces.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_official_sessions'::regclass, true));
  if v_def not like '%row_in_learning_context%' then
    v_bad := v_bad || 'the session evidence source no longer narrows by learning context; ';
  end if;
  if v_def not like '%row_in_metric_boundary%' then
    v_bad := v_bad || 'the session evidence source lost WP1''s organizational boundary; ';
  end if;
  n_checked := n_checked + 1;
  v_def := lower(pg_get_viewdef('public.scoped_official_results'::regclass, true));
  if v_def not like '%scoped_official_sessions%' then
    v_bad := v_bad || 'the result source no longer inherits the session source''s narrowing; ';
  end if;

  -- AND EVERY CALCULATOR REACHES EVIDENCE THROUGH ONE OF THOSE FAMILIES.
  -- A seventeenth metric pointed at a raw relation fails here by name.
  select string_agg(distinct cl.relname, ', ' order by cl.relname) into v_def
    from public.metric_definitions m
    join pg_proc p on p.proname = 'calc_' || m.calculation_key
                  and p.pronamespace = 'public'::regnamespace
    join pg_depend d on d.objid = p.oid and d.classid = 'pg_proc'::regclass
    join pg_class cl on cl.oid = d.refobjid and cl.relkind in ('v', 'r')
   where m.catalogue_version = public.current_metric_catalogue()
     and cl.relname not in ('scoped_official_sessions', 'scoped_official_results',
                            'scoped_service_item_statistics', 'scoped_service_distractor_uptake',
                            'scoped_service_cohort_misconceptions', 'scoped_certificates',
                            'readiness_tiers',
                            -- D-088(g): THE CONTENT FAMILY. What a chapter teaches -- its assessment's
                            -- chapter, its lessons, their objectives and statements. No learner evidence:
                            -- checked below, none of them carries a person.
                            'assessment_definitions', 'lessons', 'learning_objectives',
                            -- MC-9 (Reporting Quality Gate, 9 Nov): the rest of the chapter, so a Studio chapter's
                            -- objectives and a class's chapters are found (modules, plp_releases, courses), and the
                            -- catalogue's own minimum a row is withheld under (metric_definitions, like readiness_tiers)
                            'modules', 'plp_releases', 'courses', 'metric_definitions',
                            -- D-121(c): THE PLACEMENT FAMILY. Who is placed in a class now, for the not-yet state: no
                            -- evidence, checked below.
                            'scoped_class_placements');
  if v_def is not null then
    v_bad := v_bad || format('a calculator reaches a relation outside the narrowed source families: %s; ', v_def);
  end if;
  n_checked := n_checked + 1;

  -- D-088(g): THE CONTENT FAMILY HOLDS NO LEARNER. A relation admitted above as
  -- content must never carry a person, or it would be evidence by another name.
  n_checked := n_checked + 1;
  select string_agg(distinct c.table_name, ', ') into v_def
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name in ('assessment_definitions', 'lessons', 'learning_objectives', 'modules', 'plp_releases', 'courses', 'metric_definitions')
     and c.column_name in ('person_id', 'enrollment_id', 'session_id', 'learner_id');
  if v_def is not null then
    v_bad := v_bad || format('a content-family relation carries a learner: %s; ', v_def);
  end if;

  -- D-121(c): THE PLACEMENT FAMILY CARRIES THE BOUNDARY AND NO EVIDENCE. It names learners (that is its job), so it
  -- must keep the organizational boundary every scoped source keeps, read only CLASS placements (academic classes;
  -- professional learning sits in cohorts), and reach no session, result, response or certificate.
  n_checked := n_checked + 1;
  if to_regclass('public.scoped_class_placements') is not null then
    v_def := lower(pg_get_viewdef('public.scoped_class_placements'::regclass, true));
    if v_def not like '%row_in_metric_boundary%' then
      v_bad := v_bad || 'the placement source lost the organizational boundary; ';
    end if;
    if v_def not like '%''class''%' then
      v_bad := v_bad || 'the placement source is not narrowed to class placements; ';
    end if;
    if v_def ~ '\m(assessment_sessions|assessment_results|official_\w+|academic_\w+|responses|certificates)\M' then
      v_bad := v_bad || 'the placement source reaches evidence; ';
    end if;
  end if;

  -- AND A REVISION STILL INHERITS.
  n_checked := n_checked + 1;
  v_def := lower(pg_get_functiondef('public.create_course_revision(uuid)'::regprocedure));
  if v_def not like '%learning_context%' then
    v_bad := v_bad || 'create_course_revision does not carry the learning context forward; ';
  end if;

  if v_bad <> '' then
    return query select false, v_bad;
  else
    return query select true, format(
      '%s academic source(s) and boundary(ies) checked: every response-derived aggregate reads '
      || 'academic_responses and none reaches raw responses, the credential source counts academic '
      || 'certificates, both boundaries still narrow by learning context and resolve provenance with '
      || 'inner joins so unknown provenance is absent rather than assumed academic, and a course '
      || 'revision carries its predecessor''s context forward', n_checked);
  end if;
end $function$;
revoke all on function public.assert_academic_sources_are_context_bound() from public, anon, authenticated;


-- ═══════════════════════════════════════════════════════════ ONE EVIDENCE RULE (owner decision 8)
-- Every calculator below reads assessment evidence through the same three steps, written out in each body (a
-- calculator reads only its declared sources, so the rule is restated rather than shared through a new relation):
--   (1) a SITTING's effective result is, STRUCTURALLY, the one result of its lineage that no other result supersedes
--       (owner decision D11; the constraints give exactly one per sitting, whatever the timestamps): every reader keeps
--       only rows with no successor (NOT EXISTS … q.supersedes_result_id = r.id); the ordering by computed_at that
--       follows is a harmless remnant. A recomputation is never a second attempt (INV-29);
--   (2) a learner's CURRENT result in a chapter (plp release) is the effective result of their LATEST sitting of that
--       chapter's Uji Penguasaan in the scope read (by when the sitting was finalised, never by when a result was
--       recomputed, so recomputing an old sitting cannot make it «latest"); a lower later score is the current score;
--   (3) a learner's BASELINE in a chapter is the effective result of their EARLIEST Pemetaan Awal sitting of it.
-- Current mastery (Pemahaman, per bab, per topik, school competencies, Angkatan) reads (2). Kenaikan reads (2) − (3)
-- over the (learner, chapter) pairs that have both. Nothing reads a learner's highest result. The safety gate rate is
-- deliberately a measure of SITTINGS (each sitting's effective result, its meaning key says «bagian hasil»); its
-- population gate is learners. A learner's own history (learner.result) lists every sitting's effective result.
-- Certificates are not read here: they follow their own sealed evidence (certificate_eligibility, unchanged).
--
-- ═══════════════════════════════════════════════════════════ ONE DISCLOSURE RULE (owner decisions 6 and 7)
-- The smallest group a report names is a CELL: one class's learners in one chapter (for a topic, in that topic).
--   * A row (a chapter, a topic, a school competency, an Angkatan) gives its mean only when its own learners reach the
--     catalogue's minimum for that row's metric; otherwise its learners and `needed`, never a zero.
--   * A figure that COMBINES cells (Pemahaman over a class's chapters; a school competency over its classes; an
--     Angkatan over its classes and chapters; the school's Kenaikan over its classes) is shown only when every cell it
--     combines reaches the minimum that the cell's own row is governed by. Otherwise the combined figure is WITHHELD,
--     never recomputed without the small cell: its meaning is kept (decision 7) and the small cell cannot be recovered
--     by subtracting the visible rows from it (Sharon's finding 1). A withheld figure says so: `withheld`
--     {reason 'subgroup', needed}, and its sample is still every learner who sat (participation is never zero).
--   * Kenaikan's before → after pair (kenaikan_awal_akhir) gives post means over PAIRS, a subset of a chapter's
--     learners; it answers only when every chapter it includes is shown and, in every shown chapter, the paired
--     learners are all of the chapter's learners or the unpaired ones themselves reach the minimum.
--   * Withheld rows are listed after every shown row, in the order of their names, never by their hidden means
--     (Sharon's finding 2).
-- A missing minimum withholds every mean (a comparison with NULL is never true).

CREATE OR REPLACE FUNCTION public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH eff AS (
          SELECT DISTINCT ON (r.session_id) r.session_id, s.person_id, s.plp_release_id, s.finalized_at, s.created_at, r.mastery
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_class_comprehension.p_institution) AND (s.class_node_id = calc_class_comprehension.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         ), cur AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.mastery
            FROM eff e
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at DESC NULLS LAST, e.created_at DESC, e.session_id DESC
         ), cell_minimum AS (
          SELECT d.minimum_sample AS k
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_class_comprehension.p_catalogue) AND (d.metric_id = 'class.chapter_mastery'::text))
         ), cells AS (
          SELECT c.plp_release_id, count(DISTINCT c.person_id) AS n
            FROM cur c
           GROUP BY c.plp_release_id
         ), disclosable AS (
          SELECT 1 AS y
            FROM cell_minimum m
           WHERE ((m.k IS NOT NULL) AND (NOT (EXISTS ( SELECT 1 FROM cells x WHERE (x.n < m.k)))))
         )
  SELECT (jsonb_build_object(
           'value', ( SELECT round(avg(c.mastery), 4) FROM cur c WHERE (EXISTS ( SELECT 1 FROM disclosable))),
           'sample', ( SELECT count(DISTINCT c.person_id) FROM cur c))
         || COALESCE(( SELECT jsonb_build_object('withheld', jsonb_build_object('reason', 'subgroup', 'needed', ( SELECT m.k FROM cell_minimum m), 'chapters', ( SELECT count(*) FROM cells)))
                          WHERE ((NOT (EXISTS ( SELECT 1 FROM disclosable))) AND (EXISTS ( SELECT 1 FROM cur)))), '{}'::jsonb)) AS jsonb_build_object;
END;
revoke all on function public.calc_class_comprehension(uuid, uuid, text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.calc_class_chapter_mastery(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH eff AS (
          SELECT DISTINCT ON (r.session_id) r.session_id, s.person_id, s.plp_release_id, s.finalized_at, s.created_at, r.mastery
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_class_chapter_mastery.p_institution) AND (s.class_node_id = calc_class_chapter_mastery.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         ), cur AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.mastery
            FROM eff e
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at DESC NULLS LAST, e.created_at DESC, e.session_id DESC
         ), minimum AS (
          SELECT d.minimum_sample
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_class_chapter_mastery.p_catalogue) AND (d.metric_id = 'class.chapter_mastery'::text))
         ), rows AS (
          SELECT l.plp_release_id,
             count(DISTINCT l.person_id) AS learners,
             round(avg(l.mastery), 4) AS mean_mastery
            FROM cur l
           GROUP BY l.plp_release_id
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_agg(jsonb_build_object('plp_release_id', x.plp_release_id, 'chapter', c.title, 'learners', x.learners,
                 'needed', ( SELECT m.minimum_sample FROM minimum m), 'mean_mastery',
                 ( SELECT x.mean_mastery WHERE (x.learners >= ( SELECT m.minimum_sample FROM minimum m))))
                 ORDER BY c.title, x.plp_release_id) AS jsonb_agg
            FROM ((rows x
              JOIN plp_releases pr ON ((pr.id = x.plp_release_id)))
              JOIN courses c ON ((c.id = pr.course_id)))), '[]'::jsonb), 'sample', ( SELECT count(DISTINCT l.person_id) AS count
            FROM cur l)) AS jsonb_build_object;
END;
revoke all on function public.calc_class_chapter_mastery(uuid, uuid, text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH eff AS (
          SELECT DISTINCT ON (r.session_id) r.session_id, s.person_id, s.plp_release_id, s.assessment_definition_id, s.finalized_at, s.created_at, r.per_domain
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_class_topic_mastery.p_institution) AND (s.class_node_id = calc_class_topic_mastery.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         ), cur AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.assessment_definition_id, e.per_domain
            FROM eff e
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at DESC NULLS LAST, e.created_at DESC, e.session_id DESC
         ), minimum AS (
          SELECT md.minimum_sample AS k
            FROM metric_definitions md
           WHERE ((md.catalogue_version = calc_class_topic_mastery.p_catalogue) AND (md.metric_id = 'class.topic_mastery'::text))
         ), t AS (
          SELECT kv.key AS code,
             kv.value AS recorded,
             c.person_id,
             ( SELECT o.id
                    FROM (((assessment_definitions ad
                      JOIN modules mo ON (((mo.id = ad.module_id) OR ((ad.module_id IS NULL) AND (mo.course_id = ad.course_id)))))
                      JOIN lessons l ON ((l.module_id = mo.id)))
                      JOIN learning_objectives o ON ((o.lesson_id = l.id)))
                   WHERE ((ad.id = c.assessment_definition_id) AND (o.code = kv.key))
                   ORDER BY mo.ordinal, l.ordinal, o.id
                  LIMIT 1) AS objective_id
            FROM cur c,
             LATERAL jsonb_each(COALESCE(c.per_domain, '{}'::jsonb)) kv(key, value)
           WHERE ((jsonb_typeof(kv.value) = 'object'::text) AND (jsonb_typeof((kv.value -> 'penguasaan'::text)) = 'number'::text))
         ), d AS (
          SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             min(( SELECT lt.title WHERE (( SELECT count(*) AS count FROM learning_objectives o2 WHERE (o2.lesson_id = lo.lesson_id)) = 1))) AS title,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(DISTINCT t.person_id) AS n
            FROM ((t
              LEFT JOIN learning_objectives lo ON ((lo.id = t.objective_id)))
              LEFT JOIN lessons lt ON ((lt.id = lo.lesson_id)))
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)
         ), shown AS (
          SELECT d.objective_id, d.code, d.statement, d.title, d.n,
             ( SELECT d.avg_score WHERE (d.n >= ( SELECT m.k FROM minimum m))) AS mean_score
            FROM d
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_agg(jsonb_build_object('objective_id', x.objective_id, 'code', x.code, 'competency', x.statement, 'title', x.title,
                 'mean_score', x.mean_score, 'needed', ( SELECT m.k FROM minimum m), 'learners', x.n)
                 ORDER BY (x.mean_score IS NULL), x.mean_score, x.statement, x.code) FROM shown x), '[]'::jsonb),
           'sample', COALESCE(( SELECT max(x.n) FROM shown x), (0)::bigint)) AS jsonb_build_object;
END;
revoke all on function public.calc_class_topic_mastery(uuid, uuid, text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH eff AS (
          SELECT DISTINCT ON (r.session_id) r.session_id, s.person_id, s.plp_release_id, s.class_node_id, s.assessment_definition_id, s.finalized_at, s.created_at, r.per_domain
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_institution_competency_outcomes.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         ), cur AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.class_node_id, e.assessment_definition_id, e.per_domain
            FROM eff e
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at DESC NULLS LAST, e.created_at DESC, e.session_id DESC
         ), movers AS (
          SELECT l.class_node_id, l.plp_release_id, count(DISTINCT l.person_id) AS n
            FROM (( SELECT DISTINCT e.person_id, e.plp_release_id, e.class_node_id FROM eff e WHERE (e.class_node_id IS NOT NULL)) l
              JOIN cur c ON (((c.person_id = l.person_id) AND (c.plp_release_id = l.plp_release_id))))
           WHERE (c.class_node_id IS DISTINCT FROM l.class_node_id)
           GROUP BY l.class_node_id, l.plp_release_id
         ), minimum AS (
          SELECT md.minimum_sample AS k
            FROM metric_definitions md
           WHERE ((md.catalogue_version = calc_institution_competency_outcomes.p_catalogue) AND (md.metric_id = 'institution.competency_outcomes'::text))
         ), cell_minimum AS (
          SELECT md.minimum_sample AS k
            FROM metric_definitions md
           WHERE ((md.catalogue_version = calc_institution_competency_outcomes.p_catalogue) AND (md.metric_id = 'class.topic_mastery'::text))
         ), t AS (
          SELECT kv.key AS code,
             kv.value AS recorded,
             c.person_id,
             c.class_node_id,
             c.plp_release_id AS rel,
             ( SELECT o.id
                    FROM (((assessment_definitions ad
                      JOIN modules mo ON (((mo.id = ad.module_id) OR ((ad.module_id IS NULL) AND (mo.course_id = ad.course_id)))))
                      JOIN lessons l ON ((l.module_id = mo.id)))
                      JOIN learning_objectives o ON ((o.lesson_id = l.id)))
                   WHERE ((ad.id = c.assessment_definition_id) AND (o.code = kv.key))
                   ORDER BY mo.ordinal, l.ordinal, o.id
                  LIMIT 1) AS objective_id
            FROM cur c,
             LATERAL jsonb_each(COALESCE(c.per_domain, '{}'::jsonb)) kv(key, value)
           WHERE ((jsonb_typeof(kv.value) = 'object'::text) AND (jsonb_typeof((kv.value -> 'penguasaan'::text)) = 'number'::text))
         ), cells AS (
          SELECT COALESCE((t.objective_id)::text, t.code) AS row_key, t.class_node_id, count(DISTINCT t.person_id) AS n
            FROM t
           GROUP BY COALESCE((t.objective_id)::text, t.code), t.class_node_id
         ), d AS (
          SELECT t.objective_id,
             COALESCE((t.objective_id)::text, t.code) AS row_key,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             min(( SELECT lt.title WHERE (( SELECT count(*) AS count FROM learning_objectives o2 WHERE (o2.lesson_id = lo.lesson_id)) = 1))) AS title,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(DISTINCT t.person_id) AS n,
             array_agg(DISTINCT t.rel) AS rels
            FROM ((t
              LEFT JOIN learning_objectives lo ON ((lo.id = t.objective_id)))
              LEFT JOIN lessons lt ON ((lt.id = lo.lesson_id)))
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)
         ), shown AS (
          SELECT d.objective_id, d.code, d.statement, d.title, d.n,
             -- Sharon (e8a5efb9): whether a SMALL CELL withholds it, apart from movers ('class' vs 'moved')
             ((( SELECT cm.k FROM cell_minimum cm) IS NULL)
              OR (EXISTS ( SELECT 1 FROM cells c WHERE ((c.row_key = d.row_key) AND (c.n < ( SELECT cm.k FROM cell_minimum cm)))))) AS by_size,
             ( SELECT d.avg_score
                 WHERE ((d.n >= ( SELECT m.k FROM minimum m))
                   AND (( SELECT cm.k FROM cell_minimum cm) IS NOT NULL)
                   AND (NOT (EXISTS ( SELECT 1 FROM cells c WHERE ((c.row_key = d.row_key) AND (c.n < ( SELECT cm.k FROM cell_minimum cm))))))
                   AND (NOT (EXISTS ( SELECT 1 FROM movers mv WHERE ((mv.plp_release_id = ANY (d.rels)) AND (mv.n < ( SELECT cm.k FROM cell_minimum cm)))))))) AS mean_score
            FROM d
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_agg(jsonb_build_object('objective_id', x.objective_id, 'code', x.code, 'competency', x.statement, 'title', x.title,
                 'mean_score', x.mean_score, 'needed', ( SELECT m.k FROM minimum m), 'learners', x.n,
                 'withheld', COALESCE(( SELECT 'learners'::text WHERE (NOT (x.n >= ( SELECT m.k FROM minimum m)))),
                                      ( SELECT 'class'::text WHERE ((x.mean_score IS NULL) AND x.by_size)),
                                      ( SELECT 'moved'::text WHERE (x.mean_score IS NULL))))
                 ORDER BY (x.mean_score IS NULL), x.mean_score DESC, x.statement, x.code) FROM shown x), '[]'::jsonb),
           'sample', COALESCE(( SELECT max(x.n) FROM shown x), (0)::bigint)) AS jsonb_build_object;
END;
revoke all on function public.calc_institution_competency_outcomes(uuid, uuid, text) from public, anon, authenticated;

-- «Perbandingan angkatan» (decisions 5, 6, 8): each Angkatan is the sittings' RECORDED cohort (a sitting that recorded
-- none stays in the explicit «not recorded» row, still counted in every figure that needs no cohort); its mean is over
-- its learners' current results. A row's mean is shown only when its learners reach the minimum AND every cell it
-- draws on (a class's learners in a chapter) is a shown chapter row whose learners all fall in ONE Angkatan or in
-- Angkatan portions that themselves reach the cell minimum; otherwise a row minus the class's chapter rows would give
-- the small portion.
CREATE OR REPLACE FUNCTION public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH eff AS (
          SELECT DISTINCT ON (r.session_id) r.session_id, s.person_id, s.plp_release_id, s.class_node_id, s.cohort_node_id, s.finalized_at, s.created_at, r.mastery
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_institution_cohort_comparison.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         ), cur AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.class_node_id, e.cohort_node_id, e.mastery
            FROM eff e
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at DESC NULLS LAST, e.created_at DESC, e.session_id DESC
         ), movers AS (
          SELECT l.class_node_id, l.plp_release_id, count(DISTINCT l.person_id) AS n
            FROM (( SELECT DISTINCT e.person_id, e.plp_release_id, e.class_node_id FROM eff e WHERE (e.class_node_id IS NOT NULL)) l
              JOIN cur c ON (((c.person_id = l.person_id) AND (c.plp_release_id = l.plp_release_id))))
           WHERE (c.class_node_id IS DISTINCT FROM l.class_node_id)
           GROUP BY l.class_node_id, l.plp_release_id
         ), minimum AS (
          SELECT d.minimum_sample AS k
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_institution_cohort_comparison.p_catalogue) AND (d.metric_id = 'institution.cohort_comparison'::text))
         ), cell_minimum AS (
          SELECT d.minimum_sample AS k
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_institution_cohort_comparison.p_catalogue) AND (d.metric_id = 'class.chapter_mastery'::text))
         ), portions AS (
          SELECT c.cohort_node_id, c.class_node_id, c.plp_release_id, count(DISTINCT c.person_id) AS n
            FROM cur c
           GROUP BY c.cohort_node_id, c.class_node_id, c.plp_release_id
         ), cells AS (
          SELECT p.class_node_id, p.plp_release_id, sum(p.n) AS n, min(p.n) AS smallest, count(*) AS parts
            FROM portions p
           GROUP BY p.class_node_id, p.plp_release_id
         ), small_cells AS (
          -- Sharon (e8a5efb9): `by_size` says whether the cell itself is small; a cell withheld only for its movers is not,
          -- and its rows say so (withheld 'moved'), never «a class took it with too few learners»
          SELECT c.class_node_id, c.plp_release_id,
             (((NOT (c.n >= ( SELECT cm.k FROM cell_minimum cm))) OR ((c.parts > 1) AND (NOT (c.smallest >= ( SELECT cm.k FROM cell_minimum cm)))))
              OR (( SELECT cm.k FROM cell_minimum cm) IS NULL)) IS TRUE AS by_size
            FROM cells c
           WHERE ((NOT (c.n >= ( SELECT cm.k FROM cell_minimum cm))) OR ((c.parts > 1) AND (NOT (c.smallest >= ( SELECT cm.k FROM cell_minimum cm)))))
              OR (( SELECT cm.k FROM cell_minimum cm) IS NULL)
              -- owner decision 10: a class's chapter row also holds learners whose school-current sitting is elsewhere
              -- (they moved and re-sat); 1–4 of them would be the difference between that row and the Angkatan's
              OR (EXISTS ( SELECT 1 FROM movers mv WHERE ((mv.class_node_id = c.class_node_id) AND (mv.plp_release_id = c.plp_release_id) AND (mv.n < ( SELECT cm.k FROM cell_minimum cm)))))
         ), rows AS (
          SELECT l.cohort_node_id,
             count(DISTINCT l.person_id) AS learners,
             round(avg(l.mastery), 4) AS mean_mastery,
             bool_or((EXISTS ( SELECT 1 FROM small_cells sc
                         WHERE ((sc.class_node_id IS NOT DISTINCT FROM l.class_node_id) AND (sc.plp_release_id = l.plp_release_id))))) AS touches_small,
             bool_or((EXISTS ( SELECT 1 FROM small_cells sc
                         WHERE ((sc.class_node_id IS NOT DISTINCT FROM l.class_node_id) AND (sc.plp_release_id = l.plp_release_id) AND sc.by_size)))) AS touches_size
            FROM cur l
           GROUP BY l.cohort_node_id
         ), shown AS (
          SELECT x.cohort_node_id, x.learners, x.touches_size,
             ( SELECT x.mean_mastery WHERE ((x.learners >= ( SELECT m.k FROM minimum m)) AND (NOT x.touches_small))) AS mean_mastery
            FROM rows x
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_agg(jsonb_build_object('cohort_node_id', x.cohort_node_id, 'recorded', (x.cohort_node_id IS NOT NULL), 'learners', x.learners,
                 'needed', ( SELECT m.k FROM minimum m), 'mean_mastery', x.mean_mastery,
                 'withheld', COALESCE(( SELECT 'learners'::text WHERE (NOT (x.learners >= ( SELECT m.k FROM minimum m)))),
                                      ( SELECT 'class'::text WHERE ((x.mean_mastery IS NULL) AND x.touches_size)),
                                      ( SELECT 'moved'::text WHERE (x.mean_mastery IS NULL))))
                 ORDER BY (x.cohort_node_id IS NULL), (x.mean_mastery IS NULL), x.mean_mastery DESC, x.cohort_node_id) FROM shown x), '[]'::jsonb),
           'sample', ( SELECT count(DISTINCT l.person_id) FROM cur l)) AS jsonb_build_object;
END;
revoke all on function public.calc_institution_cohort_comparison(uuid, uuid, text) from public, anon, authenticated;

-- «Soal wajib» (decision 8 D, Sharon's finding 5, owner decision D12): a measure of SITTINGS, by its approved meaning
-- («bagian hasil Uji Penguasaan»): passed sittings over the sittings whose test HAS required questions, each sitting by
-- its effective result. A sitting with none is not applicable: it is outside the rate and counted as `not_applicable`;
-- with only such sittings there is no rate, said as «tidak berlaku», never 100%. Its population gate is LEARNERS (with
-- an applicable sitting): four learners who sat three times each are four, not twelve. `sittings` is the rate's base.
CREATE OR REPLACE FUNCTION public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH x AS (
          SELECT DISTINCT ON (r.session_id) r.safety_gate_passed,
             s.person_id,
             -- owner decision D12: a sitting whose test holds no required question has no gate to pass; it is NOT
             -- APPLICABLE, never a pass (the engine records the vacuous gate as passed, and its safety_total as 0)
             (COALESCE(((r.delta_inputs ->> 'safety_total'::text))::integer, 1) > 0) AS applicable
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_institution_safety_gate_pass_rate.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         )
  SELECT (jsonb_build_object(
           'value', ( SELECT round(((count(*) FILTER (WHERE a.safety_gate_passed))::numeric / (NULLIF(count(*), 0))::numeric), 4) FROM x a WHERE a.applicable),
           'sample', ( SELECT count(DISTINCT a.person_id) FROM x a WHERE a.applicable),
           'sittings', ( SELECT count(*) FROM x a WHERE a.applicable),
           'not_applicable', ( SELECT count(*) FROM x a WHERE (NOT a.applicable)))
         || COALESCE(( SELECT jsonb_build_object('withheld', jsonb_build_object('reason', 'not_applicable', 'sittings', count(*)))
                          FROM x a WHERE (NOT a.applicable) HAVING ((count(*) > 0) AND (NOT (EXISTS ( SELECT 1 FROM x b WHERE b.applicable))))), '{}'::jsonb)) AS jsonb_build_object;
END;
revoke all on function public.calc_institution_safety_gate_pass_rate(uuid, uuid, text) from public, anon, authenticated;

-- «Kenaikan» (decision 8 B): over every (learner, chapter) with a baseline and a current result in the class, the mean
-- of current − baseline. Its unit is the (learner, chapter) PAIR, the governed contract since MC-8 (H31): a learner with
-- two chapters' pairs counts twice; `sample` is the learners (the minimum's population) and `pairs` the pairs, so the
-- page says both and never calls the figure a per-learner average. Owner (historical disclosure, Sharon's finding 4):
-- like Pemahaman it is WITHHELD while any chapter's pairs are 1–4, or the same class's figure read before and after a
-- small chapter is sat would give that chapter's mean gain (K₂·(pA+pB) − K₁·pA)/pB; formula and meaning unchanged. MC-8 took the HIGHEST result of each test (max over every result row, recomputed versions
-- included); a later, lower Uji Penguasaan now counts, and a recomputation replaces rather than competes.
CREATE OR REPLACE FUNCTION public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH eff AS (
          SELECT DISTINCT ON (r.session_id) r.session_id, s.person_id, s.plp_release_id, s.mode, s.finalized_at, s.created_at, r.mastery
            FROM (scoped_official_sessions s
              JOIN scoped_official_results r ON ((r.session_id = s.id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_class_net_gain.p_institution) AND (s.class_node_id = calc_class_net_gain.p_node) AND (s.mode = ANY (ARRAY['PRE_TEST'::assessment_mode, 'POST_TEST'::assessment_mode])))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         ), pre AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.mastery
            FROM eff e
           WHERE (e.mode = 'PRE_TEST'::assessment_mode)
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at NULLS LAST, e.created_at, e.session_id
         ), post AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.mastery
            FROM eff e
           WHERE (e.mode = 'POST_TEST'::assessment_mode)
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at DESC NULLS LAST, e.created_at DESC, e.session_id DESC
         ), pairs AS (
          SELECT a.person_id, a.plp_release_id, (b.mastery - a.mastery) AS gain
            FROM (pre a
              JOIN post b ON (((b.person_id = a.person_id) AND (b.plp_release_id = a.plp_release_id))))
           WHERE ((a.mastery IS NOT NULL) AND (b.mastery IS NOT NULL))
         ), cell_minimum AS (
          SELECT d.minimum_sample AS k
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_class_net_gain.p_catalogue) AND (d.metric_id = 'class.chapter_mastery'::text))
         ), cells AS (
          SELECT p.plp_release_id, count(DISTINCT p.person_id) AS n FROM pairs p GROUP BY p.plp_release_id
         ), disclosable AS (
          SELECT 1 AS y FROM cell_minimum m WHERE ((m.k IS NOT NULL) AND (NOT (EXISTS ( SELECT 1 FROM cells c WHERE (c.n < m.k)))))
         )
  SELECT (jsonb_build_object(
           'value', ( SELECT round(avg(p.gain), 4) FROM pairs p WHERE (EXISTS ( SELECT 1 FROM disclosable))),
           'sample', ( SELECT count(DISTINCT p.person_id) FROM pairs p), 'pairs', ( SELECT count(*) FROM pairs p))
         || COALESCE(( SELECT jsonb_build_object('withheld', jsonb_build_object('reason', 'subgroup', 'needed', ( SELECT m.k FROM cell_minimum m)))
                          WHERE ((NOT (EXISTS ( SELECT 1 FROM disclosable))) AND (EXISTS ( SELECT 1 FROM pairs)))), '{}'::jsonb)) AS jsonb_build_object;
END;
revoke all on function public.calc_class_net_gain(uuid, uuid, text) from public, anon, authenticated;

-- The school's Kenaikan: the same pairing over the school. A pair is a CLASS's when both its sittings are in that
-- class (a class's own Kenaikan reads exactly those), otherwise it belongs to no class. Shown only when every cell of
-- pairs (a class, or no class, in one chapter) is none or reaches the class minimum; otherwise the school figure minus
-- the shown classes' Kenaikan, or the same figure read before and after, would give the small cell's.
CREATE OR REPLACE FUNCTION public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH eff AS (
          SELECT DISTINCT ON (r.session_id) r.session_id, s.person_id, s.plp_release_id, s.class_node_id, s.mode, s.finalized_at, s.created_at, r.mastery
            FROM (scoped_official_sessions s
              JOIN scoped_official_results r ON ((r.session_id = s.id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_institution_net_gain.p_institution) AND (s.mode = ANY (ARRAY['PRE_TEST'::assessment_mode, 'POST_TEST'::assessment_mode])))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         ), pre AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.class_node_id, e.mastery
            FROM eff e
           WHERE (e.mode = 'PRE_TEST'::assessment_mode)
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at NULLS LAST, e.created_at, e.session_id
         ), post AS (
          SELECT DISTINCT ON (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.class_node_id, e.mastery
            FROM eff e
           WHERE (e.mode = 'POST_TEST'::assessment_mode)
           ORDER BY e.person_id, e.plp_release_id, e.finalized_at DESC NULLS LAST, e.created_at DESC, e.session_id DESC
         ), pairs AS (
          SELECT a.person_id, a.plp_release_id, (b.mastery - a.mastery) AS gain,
             ( SELECT b.class_node_id WHERE (a.class_node_id = b.class_node_id)) AS cell
            FROM (pre a
              JOIN post b ON (((b.person_id = a.person_id) AND (b.plp_release_id = a.plp_release_id))))
           WHERE ((a.mastery IS NOT NULL) AND (b.mastery IS NOT NULL))
         ), cell_minimum AS (
          SELECT d.minimum_sample AS k
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_institution_net_gain.p_catalogue) AND (d.metric_id = 'class.net_gain'::text))
         ), cells AS (
          SELECT p.cell, p.plp_release_id, count(DISTINCT p.person_id) AS n
            FROM pairs p
           GROUP BY p.cell, p.plp_release_id
         ), disclosable AS (
          SELECT 1 AS y
            FROM cell_minimum m
           WHERE ((m.k IS NOT NULL) AND (NOT (EXISTS ( SELECT 1 FROM cells c WHERE (c.n < m.k)))))
         )
  SELECT (jsonb_build_object(
           'value', ( SELECT round(avg(p.gain), 4) FROM pairs p WHERE (EXISTS ( SELECT 1 FROM disclosable))),
           'sample', ( SELECT count(DISTINCT p.person_id) FROM pairs p), 'pairs', ( SELECT count(*) FROM pairs p))
         || COALESCE(( SELECT jsonb_build_object('withheld', jsonb_build_object('reason', 'subgroup', 'needed', ( SELECT m.k FROM cell_minimum m)))
                          WHERE ((NOT (EXISTS ( SELECT 1 FROM disclosable))) AND (EXISTS ( SELECT 1 FROM pairs)))), '{}'::jsonb)) AS jsonb_build_object;
END;
revoke all on function public.calc_institution_net_gain(uuid, uuid, text) from public, anon, authenticated;

-- «Kesiapan» (bands): a learner's CURRENT standing in the class, by the effective result of their latest Uji
-- Penguasaan sitting in it (its approved meaning: «menurut Uji Penguasaan terakhir mereka»). MC-8 ordered every
-- result row by when it was COMPUTED, so recomputing an old sitting made it the «latest»; the latest sitting now is
-- the one finalised last. Counts of learners, not means; the population is unchanged.
CREATE OR REPLACE FUNCTION public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH eff AS (
          SELECT DISTINCT ON (r.session_id) r.session_id, s.person_id, s.finalized_at, s.created_at, r.mastery, r.safety_gate_passed
            FROM (scoped_official_sessions s
              JOIN scoped_official_results r ON ((r.session_id = s.id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_class_readiness_distribution.p_institution) AND (s.class_node_id = calc_class_readiness_distribution.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC
         ), assessed AS (
          SELECT DISTINCT ON (e.person_id) e.person_id,
             e.mastery,
             e.safety_gate_passed
            FROM eff e
           ORDER BY e.person_id, e.finalized_at DESC NULLS LAST, e.created_at DESC, e.session_id DESC
         ), bands AS (
          SELECT COALESCE(t.tier_key, lowest.tier_key) AS tier_key,
             count(*) AS n
            FROM ((assessed learner
              LEFT JOIN LATERAL ( SELECT t2.tier_key
                    FROM readiness_tiers t2
                   WHERE ((t2.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND (t2.min_mastery IS NOT NULL) AND (learner.mastery >= t2.min_mastery) AND (learner.mastery < t2.max_mastery) AND (learner.safety_gate_passed IS NOT FALSE))
                  LIMIT 1) t ON (true))
              LEFT JOIN LATERAL ( SELECT t3.tier_key
                    FROM readiness_tiers t3
                   WHERE ((t3.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND (t3.min_mastery IS NOT NULL))
                   ORDER BY t3.min_mastery
                  LIMIT 1) lowest ON (true))
           GROUP BY COALESCE(t.tier_key, lowest.tier_key)
         ), placed AS (
          SELECT DISTINCT pl.person_id
            FROM scoped_class_placements pl
           WHERE ((pl.institution_id = calc_class_readiness_distribution.p_institution) AND (pl.class_node_id = calc_class_readiness_distribution.p_node))
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_object_agg(b.tier_key, b.n) AS jsonb_object_agg
            FROM bands b), '{}'::jsonb), 'sample', ( SELECT count(*) AS count
            FROM assessed), 'population', jsonb_build_object('placed', ( SELECT count(*) AS count
            FROM placed), 'assessed', ( SELECT count(*) AS count
            FROM assessed), 'not_yet', ( SELECT count(*) AS count
            FROM placed p
           WHERE (NOT (EXISTS ( SELECT 1
                    FROM assessed a
                   WHERE (a.person_id = p.person_id))))))) AS jsonb_build_object;
END;
revoke all on function public.calc_class_readiness_distribution(uuid, uuid, text) from public, anon, authenticated;

-- «Miskonsepsi» (owner approval, Sharon's item 8): a pattern is a class pattern only when it was seen in enough
-- LEARNERS. The occurrences stay the occurrences (a measure of answers); each pattern's gate is its distinct learners
-- against the class minimum (MC-9: 5, as every class figure), and a pattern below it is not listed: `withheld` says
-- how many. The sample is the learners with any recorded misconception in the class. A teacher still reads each of
-- their learners' own results.
CREATE OR REPLACE VIEW public.service_cohort_misconceptions AS
 WITH x AS (
         SELECT s.institution_id, s.cohort_node_id, s.class_node_id, s.person_id, o.misconception_code, mt.label, mt.remediation
           FROM ((((academic_responses r
             JOIN assessment_sessions s ON ((s.id = r.session_id)))
             JOIN presented_items p ON ((p.id = r.presented_item_id)))
             JOIN item_options o ON (((o.item_id = p.item_id) AND (o.label = (r.value ->> 'pilihan'::text)) AND (NOT o.is_correct))))
             JOIN misconception_taxonomy mt ON (((mt.code = o.misconception_code) AND (mt.institution_id = o.institution_id))))
          WHERE (o.misconception_code IS NOT NULL)
        ), per_class AS (
         SELECT x.institution_id, x.class_node_id, x.misconception_code, count(DISTINCT x.person_id) AS learners
           FROM x
          GROUP BY x.institution_id, x.class_node_id, x.misconception_code
        ), class_total AS (
         SELECT x.institution_id, x.class_node_id, count(DISTINCT x.person_id) AS learners
           FROM x
          GROUP BY x.institution_id, x.class_node_id
        )
 SELECT x.institution_id,
    x.cohort_node_id,
    x.class_node_id,
    x.misconception_code,
    x.label,
    x.remediation,
    (count(*))::integer AS occurrences,
    (max(pc.learners))::integer AS learners,
    (max(ct.learners))::integer AS class_learners
   FROM ((x
     LEFT JOIN per_class pc ON (((pc.institution_id = x.institution_id) AND (NOT (pc.class_node_id IS DISTINCT FROM x.class_node_id)) AND (pc.misconception_code = x.misconception_code))))
     LEFT JOIN class_total ct ON (((ct.institution_id = x.institution_id) AND (NOT (ct.class_node_id IS DISTINCT FROM x.class_node_id)))))
  GROUP BY x.institution_id, x.cohort_node_id, x.class_node_id, x.misconception_code, x.label, x.remediation;

CREATE OR REPLACE VIEW public.scoped_service_cohort_misconceptions AS
 SELECT institution_id,
    cohort_node_id,
    class_node_id,
    misconception_code,
    label,
    remediation,
    occurrences,
    learners,
    class_learners
   FROM service_cohort_misconceptions m
  WHERE row_in_metric_boundary(institution_id, COALESCE(class_node_id, cohort_node_id), NULL::uuid);

CREATE OR REPLACE FUNCTION public.calc_class_misconceptions(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH minimum AS (
          SELECT d.minimum_sample AS k
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_class_misconceptions.p_catalogue) AND (d.metric_id = 'class.misconceptions'::text))
         ), p AS (
          SELECT m.misconception_code, m.label, m.remediation, sum(m.occurrences) AS occurrences, max(m.learners) AS learners, max(m.class_learners) AS class_learners
            FROM scoped_service_cohort_misconceptions m
           WHERE ((m.institution_id = calc_class_misconceptions.p_institution) AND (m.class_node_id = calc_class_misconceptions.p_node))
           GROUP BY m.misconception_code, m.label, m.remediation
         ), shown AS (
          SELECT p.misconception_code, p.label, p.remediation, p.occurrences
            FROM p
           WHERE (p.learners >= ( SELECT m.k FROM minimum m))
         )
  SELECT (jsonb_build_object(
           'value', COALESCE(( SELECT jsonb_agg(jsonb_build_object('code', s.misconception_code, 'label', s.label, 'remediation', s.remediation, 'occurrences', s.occurrences)
                     ORDER BY s.occurrences DESC, s.misconception_code) FROM shown s), '[]'::jsonb),
           'sample', COALESCE(( SELECT max(p.class_learners) FROM p), (0)::bigint))
         || COALESCE(( SELECT jsonb_build_object('withheld', jsonb_build_object('reason', 'patterns', 'count', count(*), 'needed', ( SELECT m.k FROM minimum m)))
                          FROM p WHERE (NOT (p.learners >= COALESCE(( SELECT m.k FROM minimum m), 2147483647))) HAVING (count(*) > 0)), '{}'::jsonb)) AS jsonb_build_object;
END;
revoke all on function public.calc_class_misconceptions(uuid, uuid, text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ Kenaikan's before → after pair (Sharon's finding 1)
-- The pair is the mean baseline and the mean current result over exactly calc_class_net_gain's pairs (decision 8), so
-- akhir − awal is still the Kenaikan figure. Its «akhir» is a mean of current results over PAIRED learners, a part of
-- each chapter's learners, so beside the chapter rows it could give a withheld chapter's mean, or the mean of a
-- chapter's few unpaired learners. It is given only when, in every chapter of the class: no pair is in a withheld
-- chapter, and in a shown chapter the unpaired learners are none or themselves reach the minimum. Otherwise the row says how many pairs
-- there are and gives no means (awal and akhir null): the page says the pair is withheld, not that there is none.
create or replace function public.kenaikan_awal_akhir(p_class uuid)
returns table (awal numeric, akhir numeric, pasangan integer, orang integer)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_ok text; v_k integer; v_aman boolean;
begin
  if public.current_person_id() is null or p_class is null then return; end if;
  select n.institution_id into v_inst from public.org_nodes n where n.id = p_class and n.kind = 'CLASS';
  if v_inst is null then return; end if;
  -- the reader's own Kenaikan: its audiences, minimum and boundary decide; anything but «ok» answers nothing
  v_ok := public.metric_evaluate('class.net_gain', p_class, v_inst) ->> 'status';
  if v_ok is distinct from 'ok' then return; end if;
  select d.minimum_sample into v_k from public.metric_definitions d
   where d.catalogue_version = public.current_metric_catalogue() and d.metric_id = 'class.chapter_mastery';
  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with eff as (
        select distinct on (r.session_id) r.session_id, s.person_id, s.plp_release_id, s.mode, s.finalized_at, s.created_at, r.mastery
          from public.scoped_official_sessions s
          join public.scoped_official_results r on r.session_id = s.id
         where not exists (select 1 from public.scoped_official_results q where q.supersedes_result_id = r.id) and s.institution_id = v_inst and s.class_node_id = p_class
           and s.mode = any (array['PRE_TEST'::public.assessment_mode, 'POST_TEST'::public.assessment_mode])
         order by r.session_id, r.computed_at desc, (r.supersedes_result_id is not null) desc
      ), pre as (
        select distinct on (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.mastery
          from eff e where e.mode = 'PRE_TEST'::public.assessment_mode
         order by e.person_id, e.plp_release_id, e.finalized_at nulls last, e.created_at, e.session_id
      ), post as (
        select distinct on (e.person_id, e.plp_release_id) e.person_id, e.plp_release_id, e.mastery
          from eff e where e.mode = 'POST_TEST'::public.assessment_mode
         order by e.person_id, e.plp_release_id, e.finalized_at desc nulls last, e.created_at desc, e.session_id desc
      ), pairs as (
        select a.person_id, a.plp_release_id, a.mastery as pre, b.mastery as post
          from pre a join post b on b.person_id = a.person_id and b.plp_release_id = a.plp_release_id
         where a.mastery is not null and b.mastery is not null
      ), chapters as (
        select b.plp_release_id, count(distinct b.person_id) as n,
               count(distinct p.person_id) as paired
          from post b left join pairs p on p.person_id = b.person_id and p.plp_release_id = b.plp_release_id
         group by b.plp_release_id
      ), safe as (
        select v_k is not null and not exists (
                 select 1 from chapters c
                  where (c.paired > 0 and c.n < v_k)
                     -- a SHOWN chapter's few unpaired learners: its mean minus akhir would give theirs (a withheld
                     -- chapter's are not exposed: nothing shown can be subtracted from)
                     or (c.n >= v_k and c.n - c.paired > 0 and c.n - c.paired < v_k)) as ok
      )
      select (select round(avg(g.pre), 4) where (select ok from safe)),
             (select round(avg(g.post), 4) where (select ok from safe)),
             count(*)::integer, count(distinct g.person_id)::integer
        from pairs g
      having count(*) > 0;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $$;
revoke all on function public.kenaikan_awal_akhir(uuid) from public, anon;
grant execute on function public.kenaikan_awal_akhir(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ the class's dots and the named learners: the same «latest»
-- (decision 8 C): a recomputed old sitting never becomes a learner's latest. Otherwise unchanged.
CREATE OR REPLACE FUNCTION public.sebaran_murid_kelas(p_class uuid)
 RETURNS TABLE(mastery numeric, tier_key text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[]; v_lowest text;
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null then return; end if;
  select n.institution_id, n.jalur into v_inst, v_jalur from public.org_nodes n where n.id = p_class and n.kind = 'CLASS'
     and n.member_kind = 'LEARNER';   -- a class of learners only (D-069: a PD class is never drawn by result)
  if v_inst is null then return; end if;
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud) and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;
  select t.tier_key into v_lowest from public.readiness_tiers t
   where t.catalogue_version = v_cat and t.min_mastery is not null order by t.min_mastery limit 1;
  if v_lowest is null then return; end if;
  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with learner as (
        select distinct on (x.person_id) x.person_id, x.mastery, x.safety_gate_passed
           from (select distinct on (r.session_id) r.session_id, s.person_id, s.finalized_at, s.created_at, r.mastery, r.safety_gate_passed
          from public.scoped_official_sessions s
          join public.scoped_official_results r on r.session_id = s.id
         where not exists (select 1 from public.scoped_official_results q where q.supersedes_result_id = r.id) and s.institution_id = v_inst and s.class_node_id = p_class
           and s.mode = 'POST_TEST'::public.assessment_mode
          order by r.session_id, r.computed_at desc, (r.supersedes_result_id is not null) desc) x
         -- decision 8: the learner's latest SITTING (finalised last), each sitting by its effective result
         order by x.person_id, x.finalized_at desc nulls last, x.created_at desc, x.session_id desc
      )
      select round(l.mastery, 4),
             coalesce((select t2.tier_key from public.readiness_tiers t2
                        where t2.catalogue_version = v_cat and t2.min_mastery is not null
                          and l.mastery >= t2.min_mastery and l.mastery < t2.max_mastery
                          and l.safety_gate_passed is not false
                        limit 1), v_lowest)
        from learner l
       order by 1, 2;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $function$;
revoke all on function public.sebaran_murid_kelas(uuid) from public, anon;
grant execute on function public.sebaran_murid_kelas(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.murid_perlu_penguatan(p_class uuid)
 RETURNS TABLE(person_id uuid, display_name text, benar integer, total integer, soal_wajib_tepat boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_me uuid; v_inst uuid; v_jalur uuid[]; v_cat text; v_aud public.app_role[]; v_lowest text;
begin
  v_me := public.current_person_id();
  if v_me is null or p_class is null then return; end if;

  select n.institution_id, n.jalur into v_inst, v_jalur
    from public.org_nodes n where n.id = p_class and n.kind = 'CLASS'
     and n.member_kind = 'LEARNER';   -- a class of learners: a PD class's participants are never named by band (D-069)
  if v_inst is null then return; end if;

  -- the audiences the catalogue gives a learner's record, less the learner's own
  v_cat := public.current_metric_catalogue();
  select array(select a from unnest(m.allowed_audiences) a where a <> 'STUDENT') into v_aud
    from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  if v_aud is null or cardinality(v_aud) = 0 then return; end if;

  -- the reader stands over THIS class
  if not exists (select 1 from public.role_assignments ra
                  where ra.person_id = v_me
                    and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role = any (v_aud)
                    and ra.scope_node_id is not null
                    and v_jalur @> array[ra.scope_node_id]) then
    return;
  end if;

  -- the lowest band of the catalogue in force
  select t.tier_key into v_lowest from public.readiness_tiers t
   where t.catalogue_version = v_cat and t.min_mastery is not null
   order by t.min_mastery limit 1;
  if v_lowest is null then return; end if;

  begin
    perform set_config('pintar.metric_boundary_node', p_class::text, true);
    perform set_config('pintar.metric_boundary_person', '', true);
    return query
      with learner as (
        -- calc_class_readiness_distribution's reading: the latest official Uji Penguasaan result in this class
        select distinct on (x.person_id) x.person_id, x.mastery, x.safety_gate_passed, x.per_domain
           from (select distinct on (r.session_id) r.session_id, s.person_id, s.finalized_at, s.created_at, r.mastery, r.safety_gate_passed, r.per_domain
          from public.scoped_official_sessions s
          join public.scoped_official_results r on r.session_id = s.id
         where not exists (select 1 from public.scoped_official_results q where q.supersedes_result_id = r.id) and s.institution_id = v_inst and s.class_node_id = p_class
           and s.mode = 'POST_TEST'::public.assessment_mode
          order by r.session_id, r.computed_at desc, (r.supersedes_result_id is not null) desc) x
         -- decision 8: the learner's latest SITTING (finalised last), each sitting by its effective result
         order by x.person_id, x.finalized_at desc nulls last, x.created_at desc, x.session_id desc
      ), banded as (
        select l.person_id, l.safety_gate_passed, l.per_domain,
               coalesce((select t2.tier_key from public.readiness_tiers t2
                          where t2.catalogue_version = v_cat and t2.min_mastery is not null
                            and l.mastery >= t2.min_mastery and l.mastery < t2.max_mastery
                            and l.safety_gate_passed is not false
                          limit 1), v_lowest) as tier_key
          from learner l
      )
      select b.person_id, p.display_name,
             (select coalesce(sum((kv.value ->> 'benar')::int), 0)::int from jsonb_each(coalesce(b.per_domain, '{}'::jsonb)) kv
               where jsonb_typeof(kv.value) = 'object' and jsonb_typeof(kv.value -> 'benar') = 'number'),
             (select coalesce(sum((kv.value ->> 'total')::int), 0)::int from jsonb_each(coalesce(b.per_domain, '{}'::jsonb)) kv
               where jsonb_typeof(kv.value) = 'object' and jsonb_typeof(kv.value -> 'total') = 'number'),
             b.safety_gate_passed
        from banded b
        join public.persons p on p.id = b.person_id
       where b.tier_key = v_lowest
         and exists (select 1 from public.memberships m
                       join public.enrollments e on e.id = m.enrollment_id
                      where m.node_id = p_class and m.valid_to is null
                        and e.person_id = b.person_id and e.institution_id = v_inst
                        and e.status in ('PENDING', 'ACTIVE'))
       order by p.display_name, b.person_id;
    perform set_config('pintar.metric_boundary_node', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    raise;
  end;
end $function$;
revoke all on function public.murid_perlu_penguatan(uuid) from public, anon;
grant execute on function public.murid_perlu_penguatan(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ the recorded Angkatan is checked where it is written
CREATE OR REPLACE FUNCTION public.open_assessment_session(p_enrollment uuid, p_definition uuid, p_plp_release uuid, p_channel evidence_channel, p_mode assessment_mode, p_engine_version text, p_scoring_policy_version text, p_class_node uuid DEFAULT NULL::uuid, p_cohort_node uuid DEFAULT NULL::uuid, p_authoritative_deadline timestamp with time zone DEFAULT NULL::timestamp with time zone, p_learning_assignment uuid DEFAULT NULL::uuid, p_assessment_assignment uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid; v_version integer; v_inst uuid; v_cohort uuid;
begin
  select d.version into v_version from public.assessment_definitions d where d.id = p_definition;
  if v_version is null then raise exception 'unknown assessment definition %', p_definition; end if;
  select e.institution_id into v_inst from public.enrollments e where e.id = p_enrollment;

  -- an assignment named here belongs to the same institution as the enrolment,
  -- or the provenance would name two tenants at once
  if p_learning_assignment is not null
     and not exists (select 1 from public.learning_assignments la
                      where la.id = p_learning_assignment and la.institution_id = v_inst) then
    raise exception 'the learning assignment does not belong to the enrolment''s institution';
  end if;
  if p_assessment_assignment is not null
     and not exists (select 1 from public.assessment_assignments aa
                      where aa.id = p_assessment_assignment and aa.institution_id = v_inst) then
    raise exception 'the assessment assignment does not belong to the enrolment''s institution';
  end if;
  -- INV-27 read from the other side: a CLOSED window starts nothing new
  if p_assessment_assignment is not null
     and exists (select 1 from public.assessment_assignments aa
                  where aa.id = p_assessment_assignment and aa.status = 'CLOSED') then
    raise exception 'this assessment assignment is CLOSED and starts no new session (INV-27)';
  end if;

  -- OWNER DECISION 5 / Sharon's finding 3: the Angkatan a sitting records is HISTORICAL FACT (immutable, INV-33), so it
  -- is never taken on a caller's word. With a class, it is the class's Angkatan in the structure as it stands at the
  -- sitting (the nearest COHORT above the class); a different one is refused. Without a class, a named Angkatan must
  -- be a COHORT of the enrolment's school where the enrolment is placed now (an open membership at or below it). None
  -- found: none recorded («Angkatan tidak tercatat»), never a guess.
  if p_class_node is not null then
    if not exists (select 1 from public.org_nodes k where k.id = p_class_node and k.institution_id = v_inst) then
      raise exception 'the class does not belong to the enrolment''s institution';
    end if;
    select n.id into v_cohort
      from public.org_nodes k join public.org_nodes n on n.id = any (k.jalur) and n.kind = 'COHORT'
     where k.id = p_class_node
     order by array_position(k.jalur, n.id) desc limit 1;
    if p_cohort_node is not null and p_cohort_node is distinct from v_cohort then
      raise exception 'the Angkatan named is not the class''s Angkatan at this sitting (decision 5): a sitting records its history, never a caller''s claim';
    end if;
  elsif p_cohort_node is not null then
    if not exists (select 1 from public.org_nodes c
                     join public.memberships m on m.enrollment_id = p_enrollment and m.valid_to is null
                     join public.org_nodes w on w.id = m.node_id
                    where c.id = p_cohort_node and c.kind = 'COHORT' and c.institution_id = v_inst
                      and (w.id = c.id or w.jalur @> array[c.id])) then
      raise exception 'the Angkatan named is not one the enrolment is placed in now (decision 5)';
    end if;
    v_cohort := p_cohort_node;
  end if;

  insert into public.assessment_sessions (
    person_id, institution_id, academic_period_id,           -- overwritten by the trigger
    enrollment_id, class_node_id, cohort_node_id, plp_release_id,
    assessment_definition_id, assessment_definition_version,
    engine_version, scoring_policy_version, evidence_channel,
    evidence_class,                                          -- overwritten by the trigger
    mode, authoritative_deadline, learning_assignment_id, assessment_assignment_id)
  values (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    p_enrollment, p_class_node, v_cohort, p_plp_release,
    p_definition, v_version, p_engine_version, p_scoring_policy_version, p_channel,
    'OFFICIAL',
    p_mode, p_authoritative_deadline, p_learning_assignment, p_assessment_assignment)
  returning id into v_id;
  return v_id;
end $function$;
revoke all on function public.open_assessment_session(uuid, uuid, uuid, evidence_channel, assessment_mode, text, text, uuid, uuid, timestamp with time zone, uuid, uuid) from public, anon, authenticated;
grant execute on function public.open_assessment_session(uuid, uuid, uuid, evidence_channel, assessment_mode, text, text, uuid, uuid, timestamp with time zone, uuid, uuid) to service_role;

-- ═══════════════════════════════════════════════════════════ a recomputed sitting says so (owner decision E1, 9 Nov)
-- A certificate, and the learner's own result page (session_outcome), keep a sitting's ORIGINAL sealed result; reports
-- read its latest audited recomputation (INV-29). learner.result, the record a teacher reads, now says for each sitting
-- whether its result was recomputed and, if so, what the sealed original was, so the page can say why a report and a
-- certificate differ. The value it reports is unchanged (the effective result); nothing about certificates changes.
CREATE OR REPLACE FUNCTION public.calc_learner_result(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('session_id', x.session_id, 'mode', x.mode, 'mastery', x.mastery, 'safety_gate_passed', x.safety_gate_passed,
          'recomputed', (x.supersedes_result_id IS NOT NULL),
          'sealed_mastery', ( SELECT o.mastery FROM scoped_official_results o WHERE ((o.session_id = x.session_id) AND (o.supersedes_result_id IS NULL) AND (x.supersedes_result_id IS NOT NULL))),
          'recomputation_reason', x.recomputation_reason)
          ORDER BY x.finalized_at), '[]'::jsonb), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.session_id,
             s.mode,
             r.mastery,
             r.safety_gate_passed,
             r.supersedes_result_id,
             r.recomputation_reason,
             s.finalized_at
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE (NOT (EXISTS ( SELECT 1 FROM scoped_official_results q WHERE (q.supersedes_result_id = r.id))) AND (s.institution_id = calc_learner_result.p_institution) AND (s.person_id = calc_learner_result.p_node))
           ORDER BY r.session_id, r.computed_at DESC, (r.supersedes_result_id IS NOT NULL) DESC) x;
END;
revoke all on function public.calc_learner_result(uuid, uuid, text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ one recalculation per sitting, refused by design (D11)
-- recompute_result supersedes a sitting's ORIGINAL result; a second recalculation used to meet the constraint
-- results_one_successor as a raw unique-violation error. 4.0 keeps the limit of one authorised recalculation per sitting
-- (owner decision D11) and now refuses the second with a designed message; nothing else changes.
CREATE OR REPLACE FUNCTION public.recompute_result(p_session uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_prev public.assessment_results; v_e record; v_id uuid;
begin
  if not public.is_system_admin() then
    raise exception 'recomputation requires SYSTEM_ADMIN (INV-29: it is an audited act)';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a recomputation records why it happened';
  end if;
  select * into v_prev from public.assessment_results
   where session_id = p_session and supersedes_result_id is null;
  if v_prev.id is null then raise exception 'session % has no root result to recompute', p_session; end if;
  if exists (select 1 from public.assessment_results r where r.supersedes_result_id = v_prev.id) then
    raise exception 'this sitting has already been recalculated once; PINTAR 4.0 allows one authorised recalculation per sitting (owner decision D11)'
      using errcode = 'PR011', hint = 'RECOMPUTE_LIMIT';
  end if;

  select * into v_e from public.evaluate_session(p_session);
  -- Sharon (e8a5efb9): two concurrent calls can both pass the check above; the loser meets results_one_successor and
  -- gets the same designed refusal, never a raw unique violation
  begin
  insert into public.assessment_results (
    session_id, institution_id, person_id, evidence_class,
    engine_version, scoring_policy_version, mastery, per_domain,
    safety_gate_passed, delta_inputs, supersedes_result_id, recomputation_reason)
  values (
    p_session, '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000', 'SYNTHETIC',
    public.engine_version(), public.scoring_policy_version(), v_e.mastery, v_e.per_domain,
    v_e.safety_gate_passed,
    jsonb_build_object('item_total', v_e.item_total, 'answered', v_e.answered,
                       'correct', v_e.correct, 'safety_total', v_e.safety_total,
                       'safety_correct', v_e.safety_correct),
    v_prev.id, p_reason)
  returning id into v_id;
  exception when unique_violation then
    raise exception 'this sitting has already been recalculated once; PINTAR 4.0 allows one authorised recalculation per sitting (owner decision D11)'
      using errcode = 'PR011', hint = 'RECOMPUTE_LIMIT';
  end;
  perform public.audit_write('assessment_result.recomputed', 'assessment_results', v_id::text,
    v_prev.institution_id,
    jsonb_build_object('session_id', p_session, 'supersedes', v_prev.id,
                       'new_result', v_id, 'reason', p_reason));
  return v_id;
end $function$;
-- ADR-0021: re-created here, so its EXECUTE is revoked from PUBLIC here; the grants it had before are kept
revoke all on function public.recompute_result(uuid, text) from public, anon;
grant execute on function public.recompute_result(uuid, text) to authenticated, service_role;

-- D14: the learner may be told, neutrally, that a sitting of theirs was recalculated. They keep seeing the sealed result
-- (session_outcome, certificates); this says only whether a recalculation exists, for their own sitting, nothing more.
create or replace function public.sesi_saya_dihitung_ulang(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.assessment_sessions s
                   join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is not null
                  where s.id = p_session and s.person_id = public.current_person_id())
$$;
revoke all on function public.sesi_saya_dihitung_ulang(uuid) from public, anon;
grant execute on function public.sesi_saya_dihitung_ulang(uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
select 'sesi_saya_dihitung_ulang', 'LEARNER', 'D14: whether the caller''s own sitting was recalculated after it was sealed; a yes/no about their own sitting, no figure', a.authorization_kind, a.authorization_requirement
  from public.client_rpc_registry a where a.function_name = 'session_outcome'
on conflict (function_name) do nothing;

-- ═══════════════════════════════════════════════════════════ the evaluator says WITHHELD, not «no evidence» (decision 7)
-- One change to migration 20261206100000's body: a calculator that withholds a figure to protect a smaller group
-- returns `withheld`; the evaluator then says «laporan.metrik.dilindungi» (evidence exists; the figure is withheld)
-- instead of «belum ada bukti», and passes `withheld` through, as it passes `population`. Nothing above the
-- authorization line changes; no value is emitted on any path it did not emit on before.
CREATE OR REPLACE FUNCTION public.metric_evaluate(p_metric_id text, p_node uuid, p_institution uuid, p_catalogue_version text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_cat text; d public.metric_definitions; v_out jsonb; v_permitted boolean;
  v_me uuid; v_gov text; v_governing uuid; v_bind_node uuid; v_bind_person uuid;
  v_have numeric; v_ready public.evidence_readiness_state;
begin
  v_cat := coalesce(p_catalogue_version, public.current_metric_catalogue());
  if v_cat is null then
    raise exception 'no live metric catalogue: a report cannot cite a version that does not exist';
  end if;
  if not exists (select 1 from public.metric_catalogue c where c.version = v_cat) then
    raise exception 'no such catalogue version: %', v_cat;
  end if;
  v_me := public.current_person_id();

  select * into d from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = p_metric_id;

  if d.metric_id is null then
    return jsonb_build_object('status', 'unavailable',
                              'statement_key', 'laporan.metrik.tidak_dikenal');
  end if;

  select s.governing_scope into v_gov
    from public.metric_calculator_scope s where s.calculation_key = d.calculation_key;
  if v_gov is null then
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  v_governing := case v_gov
                   when 'NODE'   then p_node
                   when 'TENANT' then p_institution
                   else null
                 end;

  -- AUTHORIZATION FIRST, and R5 CHANGES NOTHING ABOVE THIS LINE. Readiness is
  -- a fact about a population's evidence; a reader with no right to the
  -- population has no right to that fact either.
  v_permitted := false;
  if public.is_system_admin() then
    v_permitted := true;
    v_bind_node := coalesce(v_governing, p_institution);
  elsif v_gov = 'LEARNER' then
    if v_me is not null and p_node = v_me and 'STUDENT' = any(d.allowed_audiences) then
      v_permitted := true; v_bind_person := v_me;
    else
      v_bind_node := public.audience_scope_over_learner(d.allowed_audiences, p_node, p_institution);
      v_permitted := v_bind_node is not null;
    end if;
  elsif v_gov = 'ITEM' then
    v_permitted := exists (select 1 from public.role_assignments ra
                            where ra.person_id = v_me and ra.institution_id = p_institution
                              and ra.revoked_at is null
                              and now() >= ra.valid_from and now() < ra.valid_until
                              and ra.role = any(d.allowed_audiences));
    if v_permitted then v_bind_node := p_institution; end if;
  else
    v_permitted := public.audience_on_node(d.allowed_audiences, v_governing);
    if v_permitted then v_bind_node := v_governing; end if;
  end if;

  if not v_permitted then
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  if d.deprecated then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'deprecated', 'label_key', d.label_key,
                              'statement_key', coalesce(d.deprecation_note_key, 'laporan.metrik.diganti'));
  end if;

  begin
    perform set_config('pintar.metric_boundary_node',   coalesce(v_bind_node::text, ''),   true);
    perform set_config('pintar.metric_boundary_person', coalesce(v_bind_person::text, ''), true);
    execute format('select public.%I($1, $2, $3)', 'calc_' || d.calculation_key)
       into v_out using p_node, p_institution, v_cat;
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
    raise;
  end;

  v_have  := coalesce((v_out ->> 'sample')::numeric, 0);
  v_ready := public.evidence_readiness(v_have, d.minimum_sample);

  -- A COUNT THAT CLEARS THE MINIMUM BUT PRODUCED NO FIGURE HAS NOT PRODUCED
  -- THE INTERPRETATION. Returning `ok` with a null value would hand a consumer
  -- an interpretation that does not exist, and §4 is explicit that a
  -- calculator returning zero, NULL or an empty object must not become one.
  -- The structure required to say this particular thing is not there, so this
  -- is NOT_YET_EVALUABLE rather than a quiet null.
  if v_ready = 'SUFFICIENT_EVIDENCE'
     and (v_out -> 'value' is null or jsonb_typeof(v_out -> 'value') = 'null') then
    v_ready := 'NOT_YET_EVALUABLE';
  end if;

  if v_ready <> 'SUFFICIENT_EVIDENCE' then
    -- `status` keeps its existing vocabulary so every consumer written against
    -- it goes on working unchanged; `readiness` is the new, finer truth beside
    -- it. No value is emitted on this path and none ever was.
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'below_minimum', 'label_key', d.label_key,
                              'readiness', v_ready,
                              'statement_key',
                              case
                                -- decision 7: evidence exists and clears the minimum, but the figure would disclose a
                                -- smaller group, so it is WITHHELD: never «no evidence», never zero
                                -- D12: only tests with no required question: the gate does not apply
                                when v_ready = 'NOT_YET_EVALUABLE' and v_out -> 'withheld' ->> 'reason' = 'not_applicable'
                                  then 'laporan.metrik.tidak_berlaku'
                                when v_ready = 'NOT_YET_EVALUABLE' and jsonb_typeof(v_out -> 'withheld') = 'object'
                                  then 'laporan.metrik.dilindungi'
                                when v_ready = 'NOT_YET_EVALUABLE' then 'laporan.metrik.belum_ada_bukti'
                                else 'laporan.metrik.belum_cukup_data'
                              end,
                              'have', v_have,
                              'needed', d.minimum_sample)
           -- CR-81 (D-123(3)): who is in the population is no performance figure; it is said whatever the floor
           || case when v_out ? 'population' then jsonb_build_object('population', v_out -> 'population') else '{}'::jsonb end
           || case when jsonb_typeof(v_out -> 'withheld') = 'object' then jsonb_build_object('withheld', v_out -> 'withheld') else '{}'::jsonb end
           -- owner (9 Nov): Kenaikan is a mean over (learner, chapter) PAIRS; how many is said beside the learners
           || case when jsonb_typeof(v_out -> 'pairs') = 'number' then jsonb_build_object('pairs', v_out -> 'pairs') else '{}'::jsonb end
           -- Daisy's B1 (e8a5efb9): below the minimum too, the gate says how many results are not applicable, so «1 murid»
           -- is never read as the school's participation
           || case when (v_out ->> 'not_applicable')::numeric > 0 then jsonb_build_object('not_applicable', v_out -> 'not_applicable') else '{}'::jsonb end;
  end if;

  return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                            'status', 'ok', 'scope', d.scope,
                            'readiness', v_ready,
                            'label_key', d.label_key, 'meaning_key', d.meaning_key,
                            'allowed_visualizations', to_jsonb(d.allowed_visualizations),
                            'value', v_out -> 'value', 'sample', v_out -> 'sample')
         || case when v_out ? 'population' then jsonb_build_object('population', v_out -> 'population') else '{}'::jsonb end
         -- decision 7: what a shown figure leaves out to protect a small group (misconception patterns) is said
         || case when jsonb_typeof(v_out -> 'withheld') = 'object' then jsonb_build_object('withheld', v_out -> 'withheld') else '{}'::jsonb end
         || case when jsonb_typeof(v_out -> 'pairs') = 'number' then jsonb_build_object('pairs', v_out -> 'pairs') else '{}'::jsonb end
         || case when (v_out ->> 'not_applicable')::numeric > 0 then jsonb_build_object('not_applicable', v_out -> 'not_applicable') else '{}'::jsonb end
         -- D12: the gate's value is a share of SITTINGS (applicable ones); how many is said beside the learners
         || case when jsonb_typeof(v_out -> 'sittings') = 'number' then jsonb_build_object('sittings', v_out -> 'sittings') else '{}'::jsonb end;
end $function$;
revoke all on function public.metric_evaluate(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.metric_evaluate(text, uuid, uuid, text) to authenticated;


-- ═══════════════════════════════════════════════════════════ verification
-- The catalogue is compared TABLE BY TABLE with MC-8 (Sharon's finding 6): every difference is one this migration
-- names, and nothing else differs. The calculators' BEHAVIOUR (per-row withholding, the cell rule, distinct learners,
-- the latest sitting, the recorded Angkatan, the 80% → 60% retake, the reconstruction case) is proven by running them
-- in selftest/db/fable35.sql (F35-*), which fails when any guarantee is removed; the checks here are the structural
-- floor that a later migration cannot quietly drop.
do $$
declare f text; v_def text; n int;
begin
  -- definitions: MC-8's, column by column, except class.misconceptions' minimum; plus class.chapter_mastery
  select count(*) into n from (select * from public.metric_definitions where catalogue_version = 'MC-9') a
    full join (select * from public.metric_definitions where catalogue_version = 'MC-8') b on b.metric_id = a.metric_id
   where coalesce(a.metric_id, '') <> 'class.chapter_mastery'
     and (a.metric_id is null or b.metric_id is null
          or (a.label_key, a.meaning_key, a.scope, a.evidence_class, a.allowed_visualizations, a.allowed_audiences,
              a.calculation_key, a.deprecated, a.deprecation_note_key)
             is distinct from (b.label_key, b.meaning_key, b.scope, b.evidence_class, b.allowed_visualizations,
              b.allowed_audiences, b.calculation_key, b.deprecated, b.deprecation_note_key)
          or (a.minimum_sample is distinct from b.minimum_sample and a.metric_id <> 'class.misconceptions'));
  if n <> 0 then raise exception 'MC-9 changes % MC-8 definition(s) beyond the ones this migration names', n; end if;
  if (select minimum_sample from public.metric_definitions where catalogue_version = 'MC-9' and metric_id = 'class.misconceptions') is distinct from 5 then
    raise exception 'class.misconceptions is not gated on the class minimum of five learners';
  end if;
  if (select count(*) from public.metric_definitions where catalogue_version = 'MC-9')
     <> (select count(*) from public.metric_definitions where catalogue_version = 'MC-8') + 1 then
    raise exception 'MC-9 adds a definition other than class.chapter_mastery';
  end if;
  if not exists (select 1 from public.metric_definitions a join public.metric_definitions b
               on b.catalogue_version = 'MC-9' and b.metric_id = 'class.comprehension'
              where a.catalogue_version = 'MC-9' and a.metric_id = 'class.chapter_mastery'
                and (a.scope, a.evidence_class, a.minimum_sample, a.allowed_visualizations, a.allowed_audiences)
                    is not distinct from (b.scope, b.evidence_class, b.minimum_sample, b.allowed_visualizations, b.allowed_audiences)) then
    raise exception 'class.chapter_mastery is not governed as class.comprehension is';
  end if;
  -- tiers and question-health thresholds: identical
  if exists ((select tier_key, ordinal, min_mastery, max_mastery, requires_safety_gate, applies_without_post_test
                from public.readiness_tiers where catalogue_version = 'MC-9'
              except select tier_key, ordinal, min_mastery, max_mastery, requires_safety_gate, applies_without_post_test
                from public.readiness_tiers where catalogue_version = 'MC-8')
             union all
             (select tier_key, ordinal, min_mastery, max_mastery, requires_safety_gate, applies_without_post_test
                from public.readiness_tiers where catalogue_version = 'MC-8'
              except select tier_key, ordinal, min_mastery, max_mastery, requires_safety_gate, applies_without_post_test
                from public.readiness_tiers where catalogue_version = 'MC-9')) then
    raise exception 'MC-9''s readiness tiers are not MC-8''s';
  end if;
  if exists ((select signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key
                from public.question_health_thresholds where catalogue_version = 'MC-9'
              except select signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key
                from public.question_health_thresholds where catalogue_version = 'MC-8')
             union all
             (select signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key
                from public.question_health_thresholds where catalogue_version = 'MC-8'
              except select signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key
                from public.question_health_thresholds where catalogue_version = 'MC-9')) then
    raise exception 'MC-9''s question-health thresholds are not MC-8''s';
  end if;
  -- sources: exactly MC-8's plus the four named
  if exists ((select source_relation::text from public.metric_sources where catalogue_version = 'MC-9'
              except (select source_relation::text from public.metric_sources where catalogue_version = 'MC-8'
                      union select unnest(array['modules', 'plp_releases', 'courses', 'metric_definitions'])))
             union all
             (select source_relation::text from public.metric_sources where catalogue_version = 'MC-8'
              except select source_relation::text from public.metric_sources where catalogue_version = 'MC-9')) then
    raise exception 'MC-9''s declared sources are not MC-8''s plus modules, plp_releases, courses and metric_definitions';
  end if;
  -- the stored note says what the code does (Sharon's finding 4)
  if (select note from public.metric_catalogue where version = 'MC-9') ~* 'when the session recorded none|org_nodes' then
    raise exception 'the MC-9 note still describes a cohort fallback this migration does not perform';
  end if;
  -- structural floor of the two rules
  foreach f in array array['calc_class_topic_mastery(uuid,uuid,text)', 'calc_institution_competency_outcomes(uuid,uuid,text)',
                           'tujuan_belum_tercapai(uuid,uuid)'] loop
    if pg_get_functiondef(('public.' || f)::regprocedure) !~* 'mo\.course_id = ad\.course_id' then
      raise exception '% does not find the objective of a chapter whose assessment names its course', f;
    end if;
  end loop;
  foreach f in array array['calc_class_comprehension(uuid,uuid,text)', 'calc_class_chapter_mastery(uuid,uuid,text)',
                           'calc_class_topic_mastery(uuid,uuid,text)', 'calc_institution_competency_outcomes(uuid,uuid,text)',
                           'calc_institution_cohort_comparison(uuid,uuid,text)', 'calc_class_net_gain(uuid,uuid,text)',
                           'calc_institution_net_gain(uuid,uuid,text)', 'calc_class_readiness_distribution(uuid,uuid,text)',
                           'kenaikan_awal_akhir(uuid)', 'sebaran_murid_kelas(uuid)', 'murid_perlu_penguatan(uuid)',
                           'calc_institution_safety_gate_pass_rate(uuid,uuid,text)', 'calc_learner_result(uuid,uuid,text)',
                           'tujuan_belum_tercapai(uuid,uuid)'] loop
    v_def := pg_get_functiondef(('public.' || f)::regprocedure);
    -- the two per-sitting readers (their approved meaning) need no latest-sitting rule
    if f !~ '^calc_(institution_safety_gate_pass_rate|learner_result)' and v_def !~* 'finalized_at desc nulls last' then
      raise exception '% does not read a learner''s latest SITTING (decision 8)', f;
    end if;
    if v_def ~* 'max\(\s*case' then
      raise exception '% reads a highest result (decision 8)', f;
    end if;
    if v_def !~* 'q\.supersedes_result_id = r\.id' then
      raise exception '% does not select the effective result structurally (the result nothing supersedes, D11)', f;
    end if;
  end loop;
  foreach f in array array['calc_class_comprehension(uuid,uuid,text)', 'calc_institution_net_gain(uuid,uuid,text)',
                           'calc_class_misconceptions(uuid,uuid,text)'] loop
    if pg_get_functiondef(('public.' || f)::regprocedure) !~* '''withheld''' then
      raise exception '% does not say what it withholds (decision 7)', f;
    end if;
  end loop;
  if pg_get_functiondef('public.calc_institution_cohort_comparison(uuid,uuid,text)'::regprocedure) ~* 'org_nodes' then
    raise exception 'the cohort comparison reads today''s structure';
  end if;
  if pg_get_functiondef('public.open_assessment_session(uuid,uuid,uuid,public.evidence_channel,public.assessment_mode,text,text,uuid,uuid,timestamptz,uuid,uuid)'::regprocedure) !~* 'not the class''''s Angkatan' then
    raise exception 'open_assessment_session records a caller''s Angkatan unchecked';
  end if;
  if pg_get_functiondef('public.metric_evaluate(text,uuid,uuid,text)'::regprocedure) !~* 'laporan\.metrik\.dilindungi' then
    raise exception 'the evaluator does not say a withheld figure is withheld';
  end if;
  if public.current_metric_catalogue() is distinct from 'MC-9' then
    raise exception 'the live metric catalogue is %, not MC-9', public.current_metric_catalogue();
  end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the metric closure did not survive: %', (select a.detail from public.assert_metric_closure() a);
  end if;
end $$;

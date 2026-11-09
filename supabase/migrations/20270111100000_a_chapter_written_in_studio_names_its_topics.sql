-- A CHAPTER WRITTEN IN STUDIO NAMES ITS TOPICS BY THEIR OBJECTIVES (Reporting Quality Gate, owner directive 9 Nov 2026).
--
-- The defect, found by opening Ringkasan Kelas as its Guru in a class taught two chapters written in Studio
-- (audit/fixtures/laporan-lokal.mjs): «Penguasaan per topik» listed four topics named «B1P1»…«B1P4», each averaged
-- over both chapters' Uji Penguasaan (learners: 36 sittings in a class of 22). D-088(g) (migration 20261031100000,
-- MC-4) resolves each per_domain code to the objective of the session's own chapter, so that a topic is named by
-- what was learned and two chapters' equal codes are never averaged as one. It looked for that objective only in
-- the definition's MODULE (assessment_definitions.module_id). A definition made by Studio's intake belongs to the
-- COURSE (course_id set, module_id null), the shape release_cycle_definition already accepts, so for every chapter
-- written in Studio the objective was never found: objective_id null, the bare code shown, and equal codes merged.
-- Only the seeded demonstration chapter (a module-level definition) was named correctly, which is why no test saw it.
--
-- The correction, at the source, in the three readers of that rule:
--   * calc_class_topic_mastery (class.topic_mastery: Ringkasan Kelas A, «Lihat bukti», KisiTopik)
--   * calc_institution_competency_outcomes (institution.competency_outcomes: Ringkasan Sekolah A)
--   * tujuan_belum_tercapai (Ringkasan Kelas E «Pelajari lagi», the learner's page)
-- each find the objective among the lessons of the definition's chapter: its module when it names one, otherwise every
-- module of its course, in the chapter's own order (module, then lesson). Nothing else changes: the same declared
-- sources plus `modules` (content, not evidence), the same latest-result-per-session rule, the same means, the same
-- sample, the same rounding and order, the same refusals. A code that maps to no objective is still kept by its code.
--
-- THE SAMPLE IS PEOPLE (the 5-learner minimum; H31's rule for Kenaikan, MC-8): class.comprehension, class.topic_mastery
-- and institution.competency_outcomes counted their sample, and each topic's `learners`, in RESULTS (one per sitting),
-- so a class that sat two chapters showed «Pemahaman · Dari 36 murid» with 24 learners, and three learners who sat two
-- chapters (six results) cleared a minimum of five. Their sample is now the learners counted (count(distinct
-- person)); the means are unchanged, still over every latest result.
--
-- OWNER DECISION 6 (9 Nov): every row a calculator returns for a subgroup (a topic, a school competency, a chapter, an
-- Angkatan) withholds its mean when its own learners are fewer than the catalogue's minimum for that metric (read from
-- the governed definition, never assumed), and gives `needed`. «Pemahaman» averages only the chapters whose own
-- learners reach the minimum, so a withheld chapter cannot be recovered from the class figure and its visible
-- neighbours. A topic carries `title`, its lesson's short title, only where that lesson has exactly one objective (one
-- lesson, one objective: the title names it unambiguously; otherwise the statement alone names it).
--
-- And, found on the same walk: «Perbandingan angkatan» (institution.cohort_comparison) named its only row «—», because
-- a session records a cohort only for a learner placed on the COHORT node itself, which no PINTAR placement does. Its
-- calculator now takes the COHORT above the session's class when the session recorded none (section 3).
--
-- CATALOGUE: MC-8 → MC-9 (D-060(a): three calculators' figures change for the same evidence). Every definition, minimum
-- sample, audience, tier, threshold and source is MC-8's, plus two structural sources, `modules` and `org_nodes`. MC-8 stays as it is (D-060(e)). ENGINE: unchanged.

-- ═══════════════════════════════════════════════════════════ CATALOGUE MC-9
insert into public.metric_catalogue (version, note)
select 'MC-9',
       'class.topic_mastery and institution.competency_outcomes resolve each objective in the session''s chapter whether '
       'its assessment names the module or the course (a chapter written in Studio), so its topics are named by their '
       'statements and two chapters'' equal codes are never averaged as one; every definition, minimum sample, '
       'audience, tier, threshold and source is MC-8''s, plus modules and org_nodes; class.comprehension, class.topic_mastery '
       'and institution.competency_outcomes count their sample in learners, not results; and institution.cohort_comparison '
       'takes the Angkatan above a session''s Kelas when the session recorded none'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-9');

update public.metric_catalogue set superseded_by = 'MC-9'
 where version = 'MC-8' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-9', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences,
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

-- ═══════════════════════════════════════════════════════════ the two calculators

CREATE OR REPLACE FUNCTION public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('objective_id', d.objective_id, 'code', d.code, 'competency', d.statement, 'title', d.title,
             'mean_score', ( SELECT d.avg_score WHERE (d.n >= ( SELECT md.minimum_sample FROM metric_definitions md WHERE ((md.catalogue_version = calc_class_topic_mastery.p_catalogue) AND (md.metric_id = 'class.topic_mastery'::text))))),
             'needed', ( SELECT md.minimum_sample FROM metric_definitions md WHERE ((md.catalogue_version = calc_class_topic_mastery.p_catalogue) AND (md.metric_id = 'class.topic_mastery'::text))),
             'learners', d.n) ORDER BY d.avg_score, d.statement, d.code), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             min(( SELECT lt.title WHERE (( SELECT count(*) AS count FROM learning_objectives o2 WHERE (o2.lesson_id = lo.lesson_id)) = 1))) AS title,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(DISTINCT t.person_id) AS n
            FROM ((( SELECT kv.key AS code,
                     kv.value AS recorded,
                     latest.person_id,
                     ( SELECT o.id
                            FROM (((assessment_definitions ad
                              JOIN modules mo ON ((mo.id = ad.module_id OR (ad.module_id IS NULL AND mo.course_id = ad.course_id))))
                              JOIN lessons l ON ((l.module_id = mo.id)))
                              JOIN learning_objectives o ON ((o.lesson_id = l.id)))
                           WHERE ((ad.id = latest.assessment_definition_id) AND (o.code = kv.key))
                           ORDER BY mo.ordinal, l.ordinal, o.id
                          LIMIT 1) AS objective_id
                    FROM ( SELECT DISTINCT ON (r.session_id) r.per_domain,
                             r.session_id,
                             s.person_id,
                             s.assessment_definition_id
                            FROM (scoped_official_results r
                              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
                           WHERE ((s.institution_id = calc_class_topic_mastery.p_institution) AND (s.class_node_id = calc_class_topic_mastery.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
                           ORDER BY r.session_id, r.computed_at DESC) latest,
                     LATERAL jsonb_each(COALESCE(latest.per_domain, '{}'::jsonb)) kv(key, value)
                   WHERE ((jsonb_typeof(kv.value) = 'object'::text) AND (jsonb_typeof((kv.value -> 'penguasaan'::text)) = 'number'::text))) t
              LEFT JOIN learning_objectives lo ON ((lo.id = t.objective_id)))
              LEFT JOIN lessons lt ON ((lt.id = lo.lesson_id)))
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)) d;
END;
revoke all on function public.calc_class_topic_mastery(uuid, uuid, text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('objective_id', d.objective_id, 'code', d.code, 'competency', d.statement, 'title', d.title,
             'mean_score', ( SELECT d.avg_score WHERE (d.n >= ( SELECT md.minimum_sample FROM metric_definitions md WHERE ((md.catalogue_version = calc_institution_competency_outcomes.p_catalogue) AND (md.metric_id = 'institution.competency_outcomes'::text))))),
             'needed', ( SELECT md.minimum_sample FROM metric_definitions md WHERE ((md.catalogue_version = calc_institution_competency_outcomes.p_catalogue) AND (md.metric_id = 'institution.competency_outcomes'::text))),
             'learners', d.n) ORDER BY d.avg_score DESC, d.statement, d.code), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             min(( SELECT lt.title WHERE (( SELECT count(*) AS count FROM learning_objectives o2 WHERE (o2.lesson_id = lo.lesson_id)) = 1))) AS title,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(DISTINCT t.person_id) AS n
            FROM ((( SELECT kv.key AS code,
                     kv.value AS recorded,
                     latest.person_id,
                     ( SELECT o.id
                            FROM (((assessment_definitions ad
                              JOIN modules mo ON ((mo.id = ad.module_id OR (ad.module_id IS NULL AND mo.course_id = ad.course_id))))
                              JOIN lessons l ON ((l.module_id = mo.id)))
                              JOIN learning_objectives o ON ((o.lesson_id = l.id)))
                           WHERE ((ad.id = latest.assessment_definition_id) AND (o.code = kv.key))
                           ORDER BY mo.ordinal, l.ordinal, o.id
                          LIMIT 1) AS objective_id
                    FROM ( SELECT DISTINCT ON (r.session_id) r.per_domain,
                             r.session_id,
                             s.person_id,
                             s.assessment_definition_id
                            FROM (scoped_official_results r
                              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
                           WHERE ((s.institution_id = calc_institution_competency_outcomes.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
                           ORDER BY r.session_id, r.computed_at DESC) latest,
                     LATERAL jsonb_each(COALESCE(latest.per_domain, '{}'::jsonb)) kv(key, value)
                   WHERE ((jsonb_typeof(kv.value) = 'object'::text) AND (jsonb_typeof((kv.value -> 'penguasaan'::text)) = 'number'::text))) t
              LEFT JOIN learning_objectives lo ON ((lo.id = t.objective_id)))
              LEFT JOIN lessons lt ON ((lt.id = lo.lesson_id)))
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)) d;
END;
revoke all on function public.calc_institution_competency_outcomes(uuid, uuid, text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ «Pemahaman»: the sample is people
CREATE OR REPLACE FUNCTION public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH latest AS (
          SELECT DISTINCT ON (r.session_id) r.mastery,
             s.person_id,
             s.plp_release_id
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_class_comprehension.p_institution) AND (s.class_node_id = calc_class_comprehension.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC
         ), eligible AS (
          SELECT l.plp_release_id
            FROM latest l
           GROUP BY l.plp_release_id
          HAVING (count(DISTINCT l.person_id) >= ( SELECT md.minimum_sample
                    FROM metric_definitions md
                   WHERE ((md.catalogue_version = calc_class_comprehension.p_catalogue) AND (md.metric_id = 'class.comprehension'::text))))
         )
  SELECT jsonb_build_object('value', round(avg(l.mastery), 4), 'sample', count(DISTINCT l.person_id)) AS jsonb_build_object
    FROM latest l
   WHERE (l.plp_release_id IN ( SELECT e.plp_release_id FROM eligible e));
END;
revoke all on function public.calc_class_comprehension(uuid, uuid, text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ «Perbandingan angkatan» (owner decisions 5 and 6)
-- A session records a cohort only when the learner holds a membership on the COHORT node itself, and every placement
-- PINTAR makes is a membership of a Kelas, so every real sitting so far recorded none and the comparison showed one
-- unnamed row «—» for the whole school.
-- DECISION 5: a sitting keeps the Angkatan that applied when it was sat. start_learning_session now records it (below);
-- a sitting that recorded none stays in an explicit «not recorded» row (cohort_node_id null): it is never placed by
-- today's structure, which would present a guess as history. No evidence is changed (INV-33).
-- DECISION 6 and Sharon's review: the sample is the learners counted once (count(distinct person)), never a sum over
-- rows; each row's mean is withheld when its own learners are fewer than the catalogue's minimum (read from the
-- governed definition; a missing minimum withholds every mean); the mean is over each sitting's latest result.
CREATE OR REPLACE FUNCTION public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH latest AS (
          SELECT DISTINCT ON (r.session_id) s.person_id,
             s.cohort_node_id,
             r.mastery
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_institution_cohort_comparison.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC
         ), minimum AS (
          SELECT d.minimum_sample
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_institution_cohort_comparison.p_catalogue) AND (d.metric_id = 'institution.cohort_comparison'::text))
         ), rows AS (
          SELECT l.cohort_node_id,
             count(DISTINCT l.person_id) AS learners,
             round(avg(l.mastery), 4) AS mean_mastery
            FROM latest l
           GROUP BY l.cohort_node_id
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_agg(jsonb_build_object('cohort_node_id', x.cohort_node_id, 'recorded', (x.cohort_node_id IS NOT NULL), 'learners', x.learners,
                 'needed', ( SELECT m.minimum_sample FROM minimum m), 'mean_mastery',
                 ( SELECT x.mean_mastery WHERE (x.learners >= ( SELECT m.minimum_sample FROM minimum m))))
                 ORDER BY (x.cohort_node_id IS NULL), (x.learners >= ( SELECT m.minimum_sample FROM minimum m)) DESC, x.mean_mastery DESC NULLS LAST) AS jsonb_agg
            FROM rows x), '[]'::jsonb), 'sample', ( SELECT count(DISTINCT l.person_id) AS count
            FROM latest l)) AS jsonb_build_object;
END;
revoke all on function public.calc_institution_cohort_comparison(uuid, uuid, text) from public, anon, authenticated;

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
  if v_cohort is null and v_class is not null then
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

-- ═══════════════════════════════════════════════════════════ «Soal wajib»: the sample is people (Sharon's finding 2)
-- The safety gate's school figure counted its sample in results (4 learners × 3 chapters = 12 ≥ 10). The rate is
-- unchanged (passed results over results); the sample is the learners counted, as for every other figure.
CREATE OR REPLACE FUNCTION public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(((count(*) FILTER (WHERE x.safety_gate_passed))::numeric / (NULLIF(count(*), 0))::numeric), 4), 'sample', count(DISTINCT x.person_id)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.safety_gate_passed,
             s.person_id
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_institution_safety_gate_pass_rate.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC) x;
END;
revoke all on function public.calc_institution_safety_gate_pass_rate(uuid, uuid, text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ «Per bab»: a class's chapters kept apart (owner ruling O3)
-- A class taught several chapters reads its bands and «Pemahaman» over each learner's LATEST Uji Penguasaan, whichever
-- chapter it was (their governed contract, unchanged). So an earlier chapter's need is never silently lost, a new
-- class figure keeps each chapter apart: per chapter (the release the sitting belongs to), its learners (each counted
-- once: their latest result in that chapter) and their mean mastery. A chapter with fewer learners than the minimum
-- gives its count and no mean. The sample is the class's learners with any chapter's result.
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

CREATE OR REPLACE FUNCTION public.calc_class_chapter_mastery(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 WITH latest AS (
          SELECT DISTINCT ON (s.person_id, s.plp_release_id) s.person_id,
             s.plp_release_id,
             r.mastery
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_class_chapter_mastery.p_institution) AND (s.class_node_id = calc_class_chapter_mastery.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY s.person_id, s.plp_release_id, r.computed_at DESC
         ), minimum AS (
          SELECT d.minimum_sample
            FROM metric_definitions d
           WHERE ((d.catalogue_version = calc_class_chapter_mastery.p_catalogue) AND (d.metric_id = 'class.chapter_mastery'::text))
         ), rows AS (
          SELECT l.plp_release_id,
             count(DISTINCT l.person_id) AS learners,
             round(avg(l.mastery), 4) AS mean_mastery
            FROM latest l
           GROUP BY l.plp_release_id
         )
  SELECT jsonb_build_object('value', COALESCE(( SELECT jsonb_agg(jsonb_build_object('plp_release_id', x.plp_release_id, 'chapter', c.title, 'learners', x.learners,
                 'needed', ( SELECT m.minimum_sample FROM minimum m), 'mean_mastery',
                 ( SELECT x.mean_mastery WHERE (x.learners >= ( SELECT m.minimum_sample FROM minimum m))))
                 ORDER BY c.title, x.plp_release_id) AS jsonb_agg
            FROM ((rows x
              JOIN plp_releases pr ON ((pr.id = x.plp_release_id)))
              JOIN courses c ON ((c.id = pr.course_id)))), '[]'::jsonb), 'sample', ( SELECT count(DISTINCT l.person_id) AS count
            FROM latest l)) AS jsonb_build_object;
END;
revoke all on function public.calc_class_chapter_mastery(uuid, uuid, text) from public, anon, authenticated;


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
        -- each of the learner's official Uji Penguasaan attempts in this class, its latest result
        select distinct on (r.session_id) r.session_id, r.per_domain, s.assessment_definition_id, s.finalized_at
          from public.scoped_official_results r
          join public.scoped_official_sessions s on s.id = r.session_id
         where s.institution_id = v_inst
           and s.class_node_id = p_class
           and s.person_id = p_learner
           and s.mode = 'POST_TEST'::public.assessment_mode
         order by r.session_id, r.computed_at desc
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

-- ═══════════════════════════════════════════════════════════ verification (structure only)
do $$
declare f text; v_def text; n int;
begin
  foreach f in array array['calc_class_topic_mastery(uuid,uuid,text)', 'calc_institution_competency_outcomes(uuid,uuid,text)',
                           'tujuan_belum_tercapai(uuid,uuid)'] loop
    v_def := pg_get_functiondef(('public.' || f)::regprocedure);
    if v_def !~* 'mo\.course_id = ad\.course_id' then
      raise exception '% does not find the objective of a chapter whose assessment names its course', f;
    end if;
  end loop;
  foreach f in array array['calc_class_topic_mastery(uuid,uuid,text)', 'calc_institution_competency_outcomes(uuid,uuid,text)',
                           'calc_class_comprehension(uuid,uuid,text)'] loop
    if pg_get_functiondef(('public.' || f)::regprocedure) !~* 'count\(distinct (t|x|l)\.person_id\)' then
      raise exception '% does not count its sample in people', f;
    end if;
  end loop;
  -- every MC-8 definition, tier and threshold is carried column by column; MC-9 adds class.chapter_mastery only
  select count(*) into n from public.metric_definitions a
    full join public.metric_definitions b on b.metric_id = a.metric_id and b.catalogue_version = 'MC-8'
   where a.catalogue_version = 'MC-9' and a.metric_id <> 'class.chapter_mastery'
     and (b.metric_id is null or (a.label_key, a.meaning_key, a.scope, a.evidence_class, a.minimum_sample,
          a.allowed_visualizations, a.allowed_audiences, a.calculation_key, a.deprecated)
          is distinct from (b.label_key, b.meaning_key, b.scope, b.evidence_class, b.minimum_sample,
          b.allowed_visualizations, b.allowed_audiences, b.calculation_key, b.deprecated));
  if n <> 0 or (select count(*) from public.metric_definitions where catalogue_version = 'MC-9')
             <> (select count(*) from public.metric_definitions where catalogue_version = 'MC-8') + 1 then
    raise exception 'MC-9 does not carry MC-8''s definitions unchanged plus class.chapter_mastery';
  end if;
  if exists (select 1 from public.readiness_tiers a full join public.readiness_tiers b
               on b.tier_key = a.tier_key and b.catalogue_version = 'MC-8'
              where a.catalogue_version = 'MC-9'
                and (b.tier_key is null or (a.ordinal, a.min_mastery, a.max_mastery, a.requires_safety_gate, a.applies_without_post_test)
                     is distinct from (b.ordinal, b.min_mastery, b.max_mastery, b.requires_safety_gate, b.applies_without_post_test))) then
    raise exception 'MC-9''s readiness tiers are not MC-8''s';
  end if;
  -- the corrected bodies (Sharon's review): counted in people, a row under the minimum gives no mean, scoped structure
  if pg_get_functiondef('public.calc_institution_cohort_comparison(uuid,uuid,text)'::regprocedure) !~* 'count\(distinct l\.person_id\)'
     or pg_get_functiondef('public.calc_institution_cohort_comparison(uuid,uuid,text)'::regprocedure) ~* 'org_nodes'
     or pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure) !~* 'n\.kind = ''COHORT'''
     or pg_get_functiondef('public.calc_institution_safety_gate_pass_rate(uuid,uuid,text)'::regprocedure) !~* 'count\(distinct x\.person_id\)' then
    raise exception 'the cohort comparison or the safety gate does not count people, or reads raw org_nodes';
  end if;
  if public.current_metric_catalogue() is distinct from 'MC-9' then
    raise exception 'the live metric catalogue is %, not MC-9', public.current_metric_catalogue();
  end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the metric closure did not survive: %', (select a.detail from public.assert_metric_closure() a);
  end if;
end $$;

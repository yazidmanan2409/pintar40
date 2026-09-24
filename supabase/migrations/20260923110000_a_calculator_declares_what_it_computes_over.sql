-- 0093 -- a calculator declares what it computes over, and the engine binds it.
--
-- 0092 built the room. This puts the calculators in it, and replaces 0091's
-- inference with a declaration.
--
-- WHAT IS REMOVED. `metric_computes_tenant_wide(text)` is dropped, not left
-- beside the new contract. Two authorization classifiers disagreeing is worse
-- than either alone, and the one being removed is the one that was measured
-- wrong three separate ways.
--
-- WHAT REPLACES IT. `metric_calculator_scope` says, for each calculator, what
-- organizational thing it computes over:
--
--   NODE     one organizational node, the one the caller names.
--   TENANT   the whole school, whatever node the caller names.
--   LEARNER  one person.
--   ITEM     one question, which has no organizational home at all.
--
-- The declaration is a migration-reviewed row, not a guess about SQL. It is
-- deliberately NOT `metric_definitions.scope`, which describes the SUBJECT of a
-- metric for presentation -- what the number is about -- and is not an
-- organizational boundary. Those are different questions and the catalogue
-- answers only the first: `institution.cohort_comparison` is about cohorts and
-- says COHORT, while computing over every cohort in the school. Both statements
-- are true of it, and only one of them is an authorization fact. Nothing in
-- this file reads `metric_definitions.scope`.
--
-- WHY A WRONG DECLARATION IS NOT A LEAK, which is the point of doing it this
-- way rather than by proof. The declaration decides REFUSAL; 0092's boundary
-- decides WHAT CAN BE READ. Declare a tenant-wide calculator as NODE and the
-- engine binds the caller's node -- so the calculator, however it is written,
-- sees that node's subtree and the answer is narrow rather than wide. The
-- failure mode of a mistaken declaration is a number that is too small or a
-- refusal that should have been an allow. It is never somebody else's data.
--
-- That is why this file does not try to prove the declaration true. It cannot
-- be proved true -- three separate attempts were measured and defeated, the
-- last of which satisfied the parser's own column-dependency record while
-- restricting nothing -- and after 0092 it does not need to be.

-- ─────────────────────────────────────────────── 1. the contract

create table if not exists public.metric_calculator_scope (
  calculation_key  text primary key,
  governing_scope  text not null
    check (governing_scope in ('NODE','TENANT','LEARNER','ITEM')),
  why              text not null,
  declared_at      timestamptz not null default now()
);

alter table public.metric_calculator_scope enable row level security;

comment on table public.metric_calculator_scope is
  'What organizational thing each calculator computes over, declared per calculator and reviewed as a '
  'migration. Read by metric_evaluate to resolve the governing node and the boundary. NOT '
  'metric_definitions.scope, which describes a metric''s subject for presentation and is not an '
  'authorization boundary.';

insert into public.metric_calculator_scope (calculation_key, governing_scope, why) values
  ('class_comprehension',            'NODE',
   'keys on scoped_official_sessions.class_node_id: the class the caller names'),
  ('class_misconceptions',           'NODE',
   'keys on the cohort-misconception view''s class_node_id'),
  ('class_net_gain',                 'NODE',
   'keys on class_node_id, pre and post for that class'),
  ('class_participants',             'NODE',
   'keys on class_node_id'),
  ('class_readiness_distribution',   'NODE',
   'keys on class_node_id; readiness_tiers is versioned reference data, not evidence'),
  ('class_topic_mastery',            'NODE',
   'keys on class_node_id. Its catalogue row says LESSON, which describes the SUBJECT -- topics within a '
   'lesson -- and not the organizational boundary. This declaration is the boundary; that one is the label'),
  ('institution_cohort_comparison',  'TENANT',
   'groups every cohort in the school and never reads the node it is given. Its catalogue row says COHORT, '
   'which describes what the comparison is BETWEEN. The school is what it is OVER'),
  ('institution_competency_outcomes','TENANT', 'reads the whole tenant; the node is not consulted'),
  ('institution_net_gain',           'TENANT', 'reads the whole tenant; the node is not consulted'),
  ('institution_participants',       'TENANT', 'reads the whole tenant; the node is not consulted'),
  ('institution_safety_gate_pass_rate','TENANT','reads the whole tenant; the node is not consulted'),
  ('institution_verified_credentials','TENANT','counts the school''s credentials, seen where their holders are'),
  ('item_correctness_rate',          'ITEM',
   'keys on item_id. Items carry a lesson and an institution and no organizational node, and inventing a '
   'question-to-department ownership model is a content-governance decision rather than a boundary repair'),
  ('item_distractor_uptake',         'ITEM', 'keys on item_id; see item_correctness_rate'),
  ('item_position_effect',           'ITEM', 'keys on item_id; see item_correctness_rate'),
  ('learner_result',                 'LEARNER', 'keys on person_id: one named learner''s own record')
on conflict (calculation_key) do update
   set governing_scope = excluded.governing_scope, why = excluded.why;

-- RLS ON AND NO POLICY AT ALL, which is INV-36's default read literally: the
-- table is closed to every client role. Nothing outside the database needs it
-- -- `metric_evaluate` reads it as the definer -- and the first version of this
-- file gave it a `using (true)` select policy, which F01-T13 and F05-T21 both
-- refused by name. They were right to: a permissive policy is a permissive
-- policy whatever the table holds, and "this one is only a declaration" is
-- exactly the argument those lints exist to refuse. No grant is issued either,
-- so there is no policy for a future edit to loosen.

-- ─────────────────────────────────────────────── 2. catalogue MC-2

-- ONE VERSION ADVANCEMENT, CARRYING TWO THINGS AND NOTHING ELSE.
--
--   (a) the declared sources become the SCOPED ones, which is what makes
--       assert_metric_closure refuse a calculator that reaches for raw
--       evidence -- the closure guard already enforces "only declared
--       sources", so switching the declaration is the whole enforcement;
--
--   (b) learner.result's audiences are reconciled with the Management ruling.
--
-- Nothing else moves. institution.cohort_comparison keeps its COHORT row,
-- class.topic_mastery keeps its LESSON row, every label, threshold, audience
-- and visualization is copied forward unchanged. A catalogue version is not a
-- tidying opportunity.
--
-- LEARNER.RESULT, AND WHY IT HAD TO CHANGE HERE. Measured on the baseline:
--
--   HEAD_OF_DEPARTMENT -> ok            (and no audit row)
--   DEAN               -> not_permitted
--   EDUCATOR           -> ok
--   INSTITUTION_ADMIN  -> ok
--
-- That is one identifiable learner's mastery and safety-gate outcome, per
-- session, reached through the metric route with nothing recorded. It is
-- Management individual learner detail in substance, and the only thing
-- separating it from the audited path is which door it came through. So:
--
--   STUDENT   stays. A learner reading their own record.
--   EDUCATOR  stays. Teaching access to a learner in their own class, already
--             contained, and deliberately NOT a Management audit event --
--             turning ordinary teaching into an audited disclosure would make
--             the log useless and the classroom worse.
--   HEAD_OF_DEPARTMENT and DEAN are removed from this route. They reach the
--             same learner through management_learner_detail, which records it.
--   INSTITUTION_ADMIN is removed. Administrative authority is not academic
--             learner-detail access.
--
-- DEAN was never in this list, so its removal is nominal -- what changes for a
-- dean is that they GAIN the audited path in 0095, not that they lose this one.
insert into public.metric_catalogue (version, note)
select 'MC-2',
       'source-bound authorization: calculators read organizationally scoped sources, and learner.result '
       'is reconciled with the Management individual-detail ruling'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-2');

update public.metric_catalogue set superseded_by = 'MC-2'
 where version = 'MC-1' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-2', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations,
       case when d.metric_id = 'learner.result'
            then array['STUDENT','EDUCATOR']::public.app_role[]
            else d.allowed_audiences end,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-1'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-2' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-2', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-1'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-2' and x.tier_key = t.tier_key);

-- QUESTION-HEALTH THRESHOLDS ARE CARRIED FORWARD TOO, and finding out that
-- they had to be was a measurement rather than a plan:
-- `assert_question_health_observes_only` went red on the first build with
-- "catalogue MC-2 wires no question-health signal at all".
--
-- THE GAP IS IN `publish_metric_catalogue` ITSELF, not in this file.
-- That function copies `metric_definitions` and `readiness_tiers` forward and
-- stops -- so the product's own publication path would produce the same broken
-- state, for anyone who publishes MC-3. It is recorded as a residual rather
-- than repaired here: changing a STAFF endpoint is not one of the two things
-- this catalogue version is authorized to carry.
--
-- These rows are copied UNCHANGED. Carrying a version's own content forward is
-- what an advancement IS; it is not the cleanup the ruling forbids.
insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-2', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-1'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-2' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why) values
  ('MC-2', 'scoped_official_sessions',
   'who sat which assessment, in which class and cohort -- narrowed to the bound boundary'),
  ('MC-2', 'scoped_official_results',
   'mastery, the safety gate and per-domain outcomes, for sessions inside the boundary'),
  ('MC-2', 'scoped_service_cohort_misconceptions',
   'named misconceptions and their remediation, per cohort, inside the boundary'),
  ('MC-2', 'scoped_certificates',
   'issued and unrevoked credentials, seen where their holders are'),
  ('MC-2', 'scoped_service_item_statistics',
   'per-item correctness and response time over OFFICIAL evidence in the bound tenant'),
  ('MC-2', 'scoped_service_distractor_uptake',
   'which options were chosen and which never were, in the bound tenant'),
  ('MC-2', 'readiness_tiers',
   'the versioned bands a mastery figure resolves into -- reference data, not evidence, and therefore '
   'carries no boundary of its own')
on conflict (catalogue_version, source_relation) do nothing;

-- ─────────────────────────────────────────────── 3. the calculators, pointed at the scoped sources
--
-- SIXTEEN BODIES, RE-EMITTED WITH ONE CHANGE EACH: the relation they read.
-- Not one line of arithmetic, grouping, ordering or filtering moves. A
-- boundary repair that quietly changed a number would be a different change
-- wearing this one's name, and F06-P13 asserts the numbers are identical at
-- institution-root scope rather than trusting this sentence.
--
-- `readiness_tiers` is deliberately NOT scoped: it is the versioned band
-- table a mastery figure resolves into -- reference data the catalogue owns,
-- carrying no learner, no session and no node.
--
-- THE FIRST ATTEMPT AT THIS SUBSTITUTION MISSED THE PARENTHESISED JOINS --
-- `(official_results r JOIN official_sessions s ...)` -- and left nine
-- calculators reading raw evidence. The closure invariant named all nine
-- before this file ever ran to completion, which is the guard doing exactly
-- the job it is being given here.
CREATE OR REPLACE FUNCTION public.calc_class_comprehension(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg(x.mastery), 4), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.mastery
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_class_comprehension.p_institution) AND (s.class_node_id = calc_class_comprehension.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC) x;
END
;

CREATE OR REPLACE FUNCTION public.calc_class_misconceptions(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('code', m.misconception_code, 'label', m.label, 'remediation', m.remediation, 'occurrences', m.occurrences) ORDER BY m.occurrences DESC), '[]'::jsonb), 'sample', COALESCE(sum(m.occurrences), (0)::bigint)) AS jsonb_build_object
    FROM scoped_service_cohort_misconceptions m
   WHERE ((m.institution_id = calc_class_misconceptions.p_institution) AND (m.class_node_id = calc_class_misconceptions.p_node));
END
;

CREATE OR REPLACE FUNCTION public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg((g.post - g.pre)), 4), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT s.person_id,
             max(
                 CASE
                     WHEN s.mode = 'PRE_TEST'::assessment_mode THEN r.mastery
                     ELSE NULL::numeric
                 END) AS pre,
             max(
                 CASE
                     WHEN s.mode = 'POST_TEST'::assessment_mode THEN r.mastery
                     ELSE NULL::numeric
                 END) AS post
            FROM (scoped_official_sessions s
              JOIN scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_class_net_gain.p_institution) AND (s.class_node_id = calc_class_net_gain.p_node) AND (s.mode = ANY (ARRAY['PRE_TEST'::assessment_mode, 'POST_TEST'::assessment_mode])))
           GROUP BY s.person_id) g
   WHERE ((g.pre IS NOT NULL) AND (g.post IS NOT NULL));
END
;

CREATE OR REPLACE FUNCTION public.calc_class_participants(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', count(DISTINCT s.person_id), 'sample', count(DISTINCT s.person_id)) AS jsonb_build_object
    FROM scoped_official_sessions s
   WHERE ((s.institution_id = calc_class_participants.p_institution) AND (s.class_node_id = calc_class_participants.p_node));
END
;

CREATE OR REPLACE FUNCTION public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_object_agg(d.tier_key, d.n), '{}'::jsonb), 'sample', COALESCE(sum(d.n), (0)::numeric)) AS jsonb_build_object
    FROM ( SELECT COALESCE(t.tier_key, lowest.tier_key, nopost.tier_key) AS tier_key,
             count(*) AS n
            FROM (((( SELECT DISTINCT ON (s.person_id) s.person_id,
                     r.mastery,
                     r.safety_gate_passed
                    FROM (scoped_official_sessions s
                      JOIN scoped_official_results r ON ((r.session_id = s.id)))
                   WHERE ((s.institution_id = calc_class_readiness_distribution.p_institution) AND (s.class_node_id = calc_class_readiness_distribution.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
                   ORDER BY s.person_id, r.computed_at DESC) learner
              LEFT JOIN LATERAL ( SELECT t2.tier_key
                    FROM readiness_tiers t2
                   WHERE ((t2.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND (t2.min_mastery IS NOT NULL) AND (learner.mastery >= t2.min_mastery) AND (learner.mastery < t2.max_mastery) AND (learner.safety_gate_passed IS NOT FALSE))
                  LIMIT 1) t ON (true))
              LEFT JOIN LATERAL ( SELECT t3.tier_key
                    FROM readiness_tiers t3
                   WHERE ((t3.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND (t3.min_mastery IS NOT NULL))
                   ORDER BY t3.min_mastery
                  LIMIT 1) lowest ON (true))
              LEFT JOIN LATERAL ( SELECT t4.tier_key
                    FROM readiness_tiers t4
                   WHERE ((t4.catalogue_version = calc_class_readiness_distribution.p_catalogue) AND t4.applies_without_post_test)
                  LIMIT 1) nopost ON (true))
           GROUP BY COALESCE(t.tier_key, lowest.tier_key, nopost.tier_key)) d;
END
;

CREATE OR REPLACE FUNCTION public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_object_agg(d.domain, d.avg_score), '{}'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT kv.key AS domain,
             round(avg(((kv.value #>> '{}'::text[]))::numeric), 4) AS avg_score,
             count(*) AS n
            FROM ( SELECT DISTINCT ON (r.session_id) r.per_domain,
                     r.session_id
                    FROM (scoped_official_results r
                      JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
                   WHERE ((s.institution_id = calc_class_topic_mastery.p_institution) AND (s.class_node_id = calc_class_topic_mastery.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
                   ORDER BY r.session_id, r.computed_at DESC) latest,
             LATERAL jsonb_each(COALESCE(latest.per_domain, '{}'::jsonb)) kv(key, value)
           WHERE (jsonb_typeof(kv.value) = 'number'::text)
           GROUP BY kv.key) d;
END
;

CREATE OR REPLACE FUNCTION public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('cohort_node_id', c.cohort_node_id, 'learners', c.learners, 'mean_mastery', c.mean_mastery) ORDER BY c.mean_mastery DESC NULLS LAST), '[]'::jsonb), 'sample', COALESCE(sum(c.learners), (0)::numeric)) AS jsonb_build_object
    FROM ( SELECT s.cohort_node_id,
             count(DISTINCT s.person_id) AS learners,
             round(avg(r.mastery), 4) AS mean_mastery
            FROM (scoped_official_sessions s
              JOIN scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_institution_cohort_comparison.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
           GROUP BY s.cohort_node_id) c;
END
;

CREATE OR REPLACE FUNCTION public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('competency', d.domain, 'mean_score', d.avg_score, 'learners', d.n) ORDER BY d.avg_score DESC), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT kv.key AS domain,
             round(avg(((kv.value #>> '{}'::text[]))::numeric), 4) AS avg_score,
             count(*) AS n
            FROM ( SELECT DISTINCT ON (r.session_id) r.per_domain,
                     r.session_id
                    FROM (scoped_official_results r
                      JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
                   WHERE ((s.institution_id = calc_institution_competency_outcomes.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
                   ORDER BY r.session_id, r.computed_at DESC) latest,
             LATERAL jsonb_each(COALESCE(latest.per_domain, '{}'::jsonb)) kv(key, value)
           WHERE (jsonb_typeof(kv.value) = 'number'::text)
           GROUP BY kv.key) d;
END
;

CREATE OR REPLACE FUNCTION public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg((g.post - g.pre)), 4), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT s.person_id,
             max(
                 CASE
                     WHEN s.mode = 'PRE_TEST'::assessment_mode THEN r.mastery
                     ELSE NULL::numeric
                 END) AS pre,
             max(
                 CASE
                     WHEN s.mode = 'POST_TEST'::assessment_mode THEN r.mastery
                     ELSE NULL::numeric
                 END) AS post
            FROM (scoped_official_sessions s
              JOIN scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_institution_net_gain.p_institution) AND (s.mode = ANY (ARRAY['PRE_TEST'::assessment_mode, 'POST_TEST'::assessment_mode])))
           GROUP BY s.person_id) g
   WHERE ((g.pre IS NOT NULL) AND (g.post IS NOT NULL));
END
;

CREATE OR REPLACE FUNCTION public.calc_institution_participants(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', count(DISTINCT s.person_id), 'sample', count(DISTINCT s.person_id)) AS jsonb_build_object
    FROM scoped_official_sessions s
   WHERE (s.institution_id = calc_institution_participants.p_institution);
END
;

CREATE OR REPLACE FUNCTION public.calc_institution_safety_gate_pass_rate(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(((count(*) FILTER (WHERE x.safety_gate_passed))::numeric / (NULLIF(count(*), 0))::numeric), 4), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.safety_gate_passed
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_institution_safety_gate_pass_rate.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC) x;
END
;

CREATE OR REPLACE FUNCTION public.calc_institution_verified_credentials(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', count(*) FILTER (WHERE (c.revoked_at IS NULL)), 'sample', count(*)) AS jsonb_build_object
    FROM scoped_certificates c
   WHERE (c.institution_id = calc_institution_verified_credentials.p_institution);
END
;

CREATE OR REPLACE FUNCTION public.calc_item_correctness_rate(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', max(st.correctness_rate), 'sample', COALESCE(max(st.evidence_count), 0)) AS jsonb_build_object
    FROM scoped_service_item_statistics st
   WHERE ((st.institution_id = calc_item_correctness_rate.p_institution) AND (st.item_id = calc_item_correctness_rate.p_node));
END
;

CREATE OR REPLACE FUNCTION public.calc_item_distractor_uptake(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('label', u.label, 'is_correct', u.is_correct, 'misconception_code', u.misconception_code, 'chosen', u.chosen_count) ORDER BY u.label), '[]'::jsonb), 'sample', COALESCE(sum(u.chosen_count), (0)::bigint)) AS jsonb_build_object
    FROM scoped_service_distractor_uptake u
   WHERE ((u.institution_id = calc_item_distractor_uptake.p_institution) AND (u.item_id = calc_item_distractor_uptake.p_node));
END
;

CREATE OR REPLACE FUNCTION public.calc_item_position_effect(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', jsonb_build_object('first_position', max(st.first_position), 'last_position', max(st.last_position), 'mean_response_seconds', max(st.mean_response_seconds)), 'sample', COALESCE(max(st.evidence_count), 0)) AS jsonb_build_object
    FROM scoped_service_item_statistics st
   WHERE ((st.institution_id = calc_item_position_effect.p_institution) AND (st.item_id = calc_item_position_effect.p_node));
END
;

CREATE OR REPLACE FUNCTION public.calc_learner_result(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('session_id', x.session_id, 'mode', x.mode, 'mastery', x.mastery, 'safety_gate_passed', x.safety_gate_passed) ORDER BY x.finalized_at), '[]'::jsonb), 'sample', count(*)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.session_id,
             s.mode,
             r.mastery,
             r.safety_gate_passed,
             s.finalized_at
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_learner_result.p_institution) AND (s.person_id = calc_learner_result.p_node))
           ORDER BY r.session_id, r.computed_at DESC) x;
END
;


-- ADR-0021, by family. Sixteen calculators are created together under one
-- prefix; the risk in a family is omitting one NAME, and a loop cannot omit
-- one. The resulting count is asserted below, as the ADR requires.
do $$
declare r record; n int := 0;
begin
  for r in select p.oid::regprocedure::text as sig from pg_proc p
             join pg_namespace ns on ns.oid = p.pronamespace
            where ns.nspname = 'public' and p.proname like 'calc\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    n := n + 1;
  end loop;
  if n <> 16 then raise exception 'revoked % calculator(s), expected 16', n; end if;
end $$;

-- ─────────────────────────────────────────────── 4. which node let the caller in

-- For a learner-shaped metric read by STAFF, the boundary is the node the
-- reader's own assignment stands on -- the same assignment that authorized
-- them. Returning it rather than merely answering yes/no is what lets the
-- engine bind the boundary to the authority it actually used.
create or replace function public.audience_scope_over_learner(
  p_audiences public.app_role[], p_learner uuid, p_institution uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_person uuid; v_node uuid;
begin
  if p_audiences is null or p_learner is null or p_institution is null then return null; end if;
  v_person := public.current_person_id();
  if v_person is null then return null; end if;
  select ra.scope_node_id into v_node
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
    join public.org_nodes n on n.id = m.node_id
    join public.role_assignments ra on ra.person_id = v_person
   where e.person_id = p_learner
     and e.institution_id = p_institution
     and n.institution_id = p_institution
     and ra.revoked_at is null
     and now() >= ra.valid_from and now() < ra.valid_until
     and ra.role = any (p_audiences)
     and ra.scope_node_id is not null
     and n.jalur @> array[ra.scope_node_id]
   order by cardinality(n.jalur) desc
   limit 1;
  return v_node;
exception when others then return null;
end $$;

comment on function public.audience_scope_over_learner(public.app_role[], uuid, uuid) is
  'The node whose assignment authorizes this reader over this learner, or NULL. The engine binds the '
  'boundary to the authority it used rather than to the tenant.';

revoke all on function public.audience_scope_over_learner(public.app_role[], uuid, uuid)
  from public, anon, authenticated;

-- AND ITS PREDECESSOR IS DROPPED, not left beside it. 0091's
-- `audience_over_learner` answered the same question with a boolean; the engine
-- now needs the NODE, because that node is the boundary it binds. Nothing calls
-- the boolean form any more, and a dead authorization primitive sitting next to
-- a live one is the second classifier this work exists to remove -- the next
-- caller reaches for whichever name they meet first.
drop function if exists public.audience_over_learner(public.app_role[], uuid, uuid);

-- ─────────────────────────────────────────────── 5. the evaluator

-- 0091's two-axis rule is unchanged: the catalogue AUDIENCE and organizational
-- CONTAINMENT must both pass, carried by ONE role assignment. What changes is
-- where the governing node comes from -- a declaration instead of a guess --
-- and that the engine now BINDS a boundary before dispatch, so the calculator
-- is answering a question about a set of rows it could not have widened.
create or replace function public.metric_evaluate(
  p_metric_id text, p_node uuid, p_institution uuid, p_catalogue_version text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_cat text; d public.metric_definitions; v_out jsonb; v_permitted boolean;
  v_me uuid; v_gov text; v_governing uuid; v_bind_node uuid; v_bind_person uuid;
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

  -- Nothing exists to authorize against, and nothing about a metric is
  -- disclosed by saying an id is not in the catalogue.
  if d.metric_id is null then
    return jsonb_build_object('status', 'unavailable',
                              'statement_key', 'laporan.metrik.tidak_dikenal');
  end if;

  -- THE DECLARATION, READ RATHER THAN INFERRED. A calculator with no row is
  -- not evaluated at all: an undeclared calculator is an unknown boundary, and
  -- an unknown boundary is a refusal.
  select s.governing_scope into v_gov
    from public.metric_calculator_scope s where s.calculation_key = d.calculation_key;
  if v_gov is null then
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  -- WHICH NODE GOVERNS, AND WHICH BOUNDARY THE CALCULATOR WILL WORK INSIDE.
  -- For everything organizational these are the same node. For a learner they
  -- differ: the governing check is about the person, the boundary is the
  -- authority used. For an item there is no organizational node at all, and
  -- the boundary is the tenant.
  v_governing := case v_gov
                   when 'NODE'   then p_node
                   when 'TENANT' then p_institution
                   else null
                 end;

  -- AUTHORIZATION FIRST. Every status below this line says something about a
  -- real metric -- that it was retired, that it has too little evidence -- and
  -- none of it may reach someone with no right to the metric. 0072 checked
  -- deprecation above this point and leaked exactly that.
  v_permitted := false;
  if public.is_system_admin() then
    v_permitted := true;
    v_bind_node := coalesce(v_governing, p_institution);
  elsif v_gov = 'LEARNER' then
    if v_me is not null and p_node = v_me and 'STUDENT' = any(d.allowed_audiences) then
      v_permitted := true; v_bind_person := v_me;          -- a learner's own record
    else
      v_bind_node := public.audience_scope_over_learner(d.allowed_audiences, p_node, p_institution);
      v_permitted := v_bind_node is not null;
    end if;
  elsif v_gov = 'ITEM' then
    -- a question is a tenant-level asset with no node to be contained by, so
    -- the audience-in-tenant rule it has always had is what governs it
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
    -- Carries no metric id, no label, no catalogue version. The caller already
    -- knows what it asked for; a reader must not learn it from here.
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  if d.deprecated then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'deprecated', 'label_key', d.label_key,
                              'statement_key', coalesce(d.deprecation_note_key, 'laporan.metrik.diganti'));
  end if;

  -- THE BOUNDARY IS BOUND HERE AND NOWHERE ELSE, and it is cleared again
  -- whatever the calculator does -- including raising. A boundary left standing
  -- would be the next evaluation's, which is the one bug this shape must not
  -- have.
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

  if coalesce((v_out ->> 'sample')::numeric, 0) < d.minimum_sample then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'below_minimum', 'label_key', d.label_key,
                              'statement_key', 'laporan.metrik.belum_cukup_data',
                              'have', coalesce((v_out ->> 'sample')::numeric, 0),
                              'needed', d.minimum_sample);
  end if;

  return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                            'status', 'ok', 'scope', d.scope,
                            'label_key', d.label_key, 'meaning_key', d.meaning_key,
                            'allowed_visualizations', to_jsonb(d.allowed_visualizations),
                            'value', v_out -> 'value', 'sample', v_out -> 'sample');
end $$;

revoke all on function public.metric_evaluate(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.metric_evaluate(text, uuid, uuid, text) to authenticated;

-- THE INFERENCE IS REMOVED, not deprecated in place.
drop function if exists public.metric_computes_tenant_wide(text);

-- ─────────────────────────────────────────────── 6. the closure invariant, extended
--
-- EXTENDED RATHER THAN JOINED BY A SECOND ONE. assert_metric_closure already
-- owns the relationship between the catalogue and the calculators; the
-- governing-scope contract is one more edge of that same relationship. A
-- parallel invariant system would be a second place to forget.
--
-- AND GUARD (2e) IS NOW LOAD-BEARING FOR AUTHORIZATION, not only for
-- provenance: it already refuses a calculator that reads a relation the
-- catalogue has not declared, and MC-2 declares only the scoped sources. So a
-- calculator that reaches past its boundary to raw `official_sessions` does not
-- ship. Nothing new had to be built for that; the declaration moved.
CREATE OR REPLACE FUNCTION public.assert_metric_closure()
 RETURNS TABLE(ok boolean, detail text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare problems text[] := '{}'; bad text; n int; v_cat text;
begin
  v_cat := public.current_metric_catalogue();

  -- (1) CARDINALITY. Cheap, real, and deliberately not carrying the property.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'metric_evaluate';
  if n <> 1 then
    problems := problems || format('%s metric_evaluate function(s): there must be exactly one', n);
  end if;

  -- (2a) BIJECTION. Every catalogue metric has a calculator, and every
  --      calculator is named by the catalogue. An orphan calculator is an
  --      un-catalogued computation sitting in the schema.
  select string_agg(distinct d.metric_id, ', ') into bad
    from public.metric_definitions d
   where d.catalogue_version = v_cat
     and not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                      where ns.nspname = 'public' and p.proname = 'calc_' || d.calculation_key);
  if bad is not null then
    problems := problems || ('catalogue metric(s) with no calculator: ' || bad);
  end if;
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname like 'calc\_%'
     and not exists (select 1 from public.metric_definitions d
                      where d.catalogue_version = v_cat
                        and 'calc_' || d.calculation_key = p.proname);
  if bad is not null then
    problems := problems || ('calculator(s) no live catalogue metric names: ' || bad);
  end if;

  -- (2b) VACUITY GUARD ONE: a string-bodied calculator records no dependencies
  --      at all and would satisfy every check below trivially.
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname like 'calc\_%' and p.prosqlbody is null;
  if bad is not null then
    problems := problems ||
      ('calculator(s) without a parsed body, whose reads are therefore unrecorded: ' || bad);
  end if;

  -- (2c) VACUITY GUARD TWO: one level of user-defined function indirection
  --      empties the relation set. Measured: `begin atomic select inner()`
  --      records zero relation dependencies and one FUNCTION dependency -- so
  --      "at least one dependency" does not catch it either. A calculator's
  --      pg_proc dependency set must be empty, or itself a declared calculator.
  select string_agg(distinct p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    join pg_depend dep on dep.objid = p.oid and dep.classid = 'pg_proc'::regclass
                      and dep.refclassid = 'pg_proc'::regclass
   where ns.nspname = 'public' and p.proname like 'calc\_%'
     and (select p2.proname from pg_proc p2 where p2.oid = dep.refobjid) not like 'calc\_%';
  if bad is not null then
    problems := problems ||
      ('calculator(s) reading through an undeclared helper, which hides their real input set: ' || bad);
  end if;

  -- (2d) and a calculator that reads NOTHING is not computing from evidence
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname like 'calc\_%'
     and not exists (select 1 from pg_depend dep
                      where dep.objid = p.oid and dep.classid = 'pg_proc'::regclass
                        and dep.refclassid = 'pg_class'::regclass);
  if bad is not null then
    problems := problems || ('calculator(s) that read no relation at all: ' || bad);
  end if;

  -- (2e) THE CLOSURE ITSELF. Every relation a calculator reads -- as recorded
  --      by the PARSER, not by a comment -- must be a declared catalogue
  --      source. A new service view is then a catalogue change.
  select string_agg(distinct p.proname || ' -> ' || dep.refobjid::regclass::text, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    join pg_depend dep on dep.objid = p.oid and dep.classid = 'pg_proc'::regclass
                      and dep.refclassid = 'pg_class'::regclass
   where ns.nspname = 'public' and p.proname like 'calc\_%'
     and not exists (select 1 from public.metric_sources ms
                      where ms.catalogue_version = v_cat
                        and ms.source_relation = dep.refobjid::regclass::text);
  if bad is not null then
    problems := problems || ('calculator(s) reading an undeclared source: ' || bad);
  end if;

  -- (3) THE GOVERNING-SCOPE CONTRACT (0093). Authorization no longer guesses
  --     what a calculator computes over -- it reads a declared row. So the
  --     declaration has to be complete and in bijection with the calculators,
  --     the same way the calculators are with the catalogue.
  select string_agg(distinct d.calculation_key, ', ') into bad
    from public.metric_definitions d
   where d.catalogue_version = v_cat
     and not exists (select 1 from public.metric_calculator_scope s
                      where s.calculation_key = d.calculation_key);
  if bad is not null then
    problems := problems || ('calculator(s) with no declared governing scope: ' || bad ||
      ' -- an undeclared boundary is an unknown boundary, and metric_evaluate refuses it');
  end if;

  select string_agg(s.calculation_key, ', ') into bad
    from public.metric_calculator_scope s
   where not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                      where ns.nspname = 'public' and p.proname = 'calc_' || s.calculation_key);
  if bad is not null then
    problems := problems || ('governing-scope row(s) naming no calculator: ' || bad);
  end if;

  select string_agg(s.calculation_key || '=' || s.governing_scope, ', ') into bad
    from public.metric_calculator_scope s
   where s.governing_scope not in ('NODE','TENANT','LEARNER','ITEM');
  if bad is not null then
    problems := problems || ('governing scope(s) outside the declared set: ' || bad);
  end if;

  -- VACUITY GUARD. A contract that says the same thing about every calculator
  -- is not separating anything, and would read green while governing nothing.
  select count(distinct s.governing_scope) into n
    from public.metric_calculator_scope s
    join public.metric_definitions d
      on d.calculation_key = s.calculation_key and d.catalogue_version = v_cat;
  if n < 2 then
    problems := problems ||
      format('the governing-scope contract holds %s distinct value(s) across the live catalogue: it is '
          || 'classifying nothing', n);
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'catalogue %s: one evaluator; %s calculator(s) in bijection with the catalogue, every one parsed at '
      || 'creation, reading no undeclared helper, reading only the %s declared source(s) -- which since '
      || 'MC-2 are the organizationally SCOPED ones, so a calculator reaching for raw evidence fails here '
      || '-- and every one carrying exactly one declared governing scope',
      v_cat,
      (select count(*) from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
        where ns.nspname='public' and p.proname like 'calc\_%'),
      (select count(*) from public.metric_sources where catalogue_version = v_cat))
    else array_to_string(problems, '; ') end;
  return next;
end $function$

;

revoke all on function public.assert_metric_closure() from public, anon, authenticated;

-- ─────────────────────────────────────────────── 7. verification (ADR-0014)

do $$
declare
  v_cat text; n int; n_node int; n_tenant int; v_before jsonb; v_after jsonb;
  bad text;
begin
  v_cat := public.current_metric_catalogue();
  if v_cat <> 'MC-2' then raise exception 'the live catalogue is % and not MC-2', v_cat; end if;

  -- (1) ONE VERSION ADVANCEMENT, CARRYING ONLY WHAT IT WAS AUTHORIZED TO CARRY.
  --     Every definition is identical to MC-1's except learner.result's
  --     audience, asserted column by column rather than promised in a header.
  select string_agg(d2.metric_id, ', ') into bad
    from public.metric_definitions d2
    join public.metric_definitions d1
      on d1.catalogue_version = 'MC-1' and d1.metric_id = d2.metric_id
   where d2.catalogue_version = 'MC-2'
     and (d1.label_key, d1.meaning_key, d1.scope, d1.evidence_class, d1.minimum_sample,
          d1.allowed_visualizations, d1.calculation_key, d1.deprecated, d1.deprecation_note_key)
         is distinct from
         (d2.label_key, d2.meaning_key, d2.scope, d2.evidence_class, d2.minimum_sample,
          d2.allowed_visualizations, d2.calculation_key, d2.deprecated, d2.deprecation_note_key);
  if bad is not null then raise exception 'MC-2 changed more than audiences on: %', bad; end if;

  select string_agg(d2.metric_id, ', ') into bad
    from public.metric_definitions d2
    join public.metric_definitions d1
      on d1.catalogue_version = 'MC-1' and d1.metric_id = d2.metric_id
   where d2.catalogue_version = 'MC-2'
     and d1.allowed_audiences is distinct from d2.allowed_audiences;
  if bad is distinct from 'learner.result' then
    raise exception 'MC-2 changed audiences on [%], expected learner.result alone', coalesce(bad,'nothing');
  end if;
  select d.allowed_audiences::text into bad from public.metric_definitions d
   where d.catalogue_version = 'MC-2' and d.metric_id = 'learner.result';
  if bad <> '{STUDENT,EDUCATOR}' then
    raise exception 'learner.result audiences are % and not {STUDENT,EDUCATOR}', bad;
  end if;
  select count(*) into n from public.metric_definitions where catalogue_version = 'MC-2';
  if n <> (select count(*) from public.metric_definitions where catalogue_version = 'MC-1') then
    raise exception 'MC-2 carries % definition(s), MC-1 carried a different number', n;
  end if;

  -- (2) THE CONTRACT IS COMPLETE AND SEPARATES.
  select count(*) filter (where s.governing_scope = 'NODE'),
         count(*) filter (where s.governing_scope = 'TENANT')
    into n_node, n_tenant
    from public.metric_calculator_scope s
    join public.metric_definitions d
      on d.calculation_key = s.calculation_key and d.catalogue_version = 'MC-2';
  if n_node = 0 or n_tenant = 0 then
    raise exception 'the contract declares % NODE and % TENANT: it is not separating', n_node, n_tenant;
  end if;

  -- (3) THE INVARIANT REFUSES EACH WAY THE CONTRACT CAN BE BROKEN. Asserted by
  --     breaking it, because an invariant nobody has watched fail is a promise.
  declare v_ok boolean; v_detail text;
  begin
    select a.ok into v_ok from public.assert_metric_closure() a;
    if not v_ok then raise exception 'the closure invariant is already red before anything was planted'; end if;

    delete from public.metric_calculator_scope where calculation_key = 'class_participants';
    select a.ok, a.detail into v_ok, v_detail from public.assert_metric_closure() a;
    if v_ok or v_detail !~ 'no declared governing scope' then
      raise exception 'a MISSING declaration did not turn the invariant red for its own reason: %', v_detail;
    end if;
    insert into public.metric_calculator_scope (calculation_key, governing_scope, why)
    values ('class_participants', 'NODE', 'restored');

    insert into public.metric_calculator_scope (calculation_key, governing_scope, why)
    values ('no_such_calculator_0093', 'NODE', 'names nothing');
    select a.ok, a.detail into v_ok, v_detail from public.assert_metric_closure() a;
    if v_ok or v_detail !~ 'naming no calculator' then
      raise exception 'a declaration naming no calculator did not turn the invariant red: %', v_detail;
    end if;
    delete from public.metric_calculator_scope where calculation_key = 'no_such_calculator_0093';

    -- a calculator reaching past its boundary to raw evidence: guard (2e),
    -- now load-bearing for authorization because MC-2 declares only the
    -- scoped sources
    create or replace function public.calc_class_participants(
      p_node uuid, p_institution uuid, p_catalogue text)
    returns jsonb language sql stable set search_path = public, pg_temp
    begin atomic
      select jsonb_build_object('value', count(distinct s.person_id), 'sample', count(distinct s.person_id))
        from official_sessions s
       where s.institution_id = p_institution and s.class_node_id = p_node;
    end;
    -- ADR-0021 by name, for the probe's own replacement. `create or replace`
    -- preserves grants and this block rolls back, so nothing is exposed either
    -- way -- but F06-S01 reads the FILE, and a reader of the file cannot tell.
    -- It refused this migration until the revoke was here, which is the check
    -- working rather than a formality.
    revoke all on function public.calc_class_participants(uuid, uuid, text)
      from public, anon, authenticated;
    select a.ok, a.detail into v_ok, v_detail from public.assert_metric_closure() a;
    if v_ok or v_detail !~ 'undeclared source' then
      raise exception 'a calculator reading RAW evidence did not turn the invariant red: %', v_detail;
    end if;
    raise exception 'PLANTS_UNDO';
  exception when others then
    if sqlerrm <> 'PLANTS_UNDO' then raise; end if;
  end;

  -- (4) AND IT IS GREEN AGAIN once the plants are gone.
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the closure invariant did not return to green after the plants were rolled back';
  end if;

  raise notice '0093 verified: MC-2 advanced the catalogue carrying only the scoped source declarations and learner.result''s audience -- every other definition identical to MC-1 column by column; the governing-scope contract is complete, in bijection with the calculators and separating; and the closure invariant was watched to go red for a MISSING declaration, for a declaration naming no calculator, and for a calculator reaching past its boundary to raw evidence, then green again with every plant rolled back';
end $$;

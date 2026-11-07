-- «KENAIKAN» PAIRS EACH LEARNER'S PEMETAAN AWAL WITH THE UJI PENGUASAAN OF THE SAME CHAPTER (7 Nov 2026).
--
-- The defect, found by Daisy measuring the report specimens against the calculators (hand-off H31): the class and
-- the school figure «Kenaikan» (class.net_gain, institution.net_gain) grouped a learner's official results by PERSON
-- only, taking their highest Pemetaan Awal and their highest Uji Penguasaan over every chapter they ever sat. A class
-- or a school that has taught more than one chapter therefore subtracted one chapter's pre-test from another
-- chapter's post-test: a learner with Bab 1 pre 30% / post 80% and Bab 2 pre 70% / post 75% was reported as a gain of
-- 80 − 70 = 10, where the two chapters' gains are 50 and 5.
--
-- The correction, at the source: the gain is measured per learner PER CHAPTER (plp_release_id, the release both
-- tests belong to), and the figure is the mean of those paired gains. Within one chapter the highest of each test is
-- kept, exactly as before (a re-sit does not lower a learner's record). A chapter with only one of the two tests
-- contributes nothing, as before.
--
-- THE SAMPLE STAYS PEOPLE. `sample` is what metric_evaluate compares with the catalogue's minimum (5 for a class, 10
-- for a school) before a figure may be shown; it remains count(distinct person), so a few learners who sat many
-- chapters can never make a small group's figure visible. Only `value` changes meaning: the mean over paired
-- chapters instead of over people's unrelated maxima.
--
-- Same declared sources (scoped_official_sessions, scoped_official_results), same signature, same SQL-standard body
-- (BEGIN ATOMIC), so assert_metric_closure keeps holding; checked below.
--
-- CATALOGUE: MC-7 → MC-8 (D-060(a): a calculator's meaning changed). Every definition, minimum sample, audience, tier,
-- threshold and source is MC-7's. MC-7 stays as it is (D-060(e)).
-- ENGINE: unchanged (no grading, assembly or finalization semantics).

-- ═══════════════════════════════════════════════════════════ CATALOGUE MC-8
insert into public.metric_catalogue (version, note)
select 'MC-8',
       'class.net_gain and institution.net_gain pair each learner''s Pemetaan Awal with the Uji Penguasaan of the same '
       'chapter (release) and average those gains; their sample is still the people counted; every definition, minimum '
       'sample, audience, tier, threshold and source is MC-7''s'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-8');

update public.metric_catalogue set superseded_by = 'MC-8'
 where version = 'MC-7' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-8', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-7'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-8' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-8', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-7'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-8' and x.tier_key = t.tier_key);

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-8', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-7'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-8' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why)
select 'MC-8', m.source_relation, m.why
  from public.metric_sources m where m.catalogue_version = 'MC-7'
on conflict (catalogue_version, source_relation) do nothing;

-- ═══════════════════════════════════════════════════════════ the two calculators

CREATE OR REPLACE FUNCTION public.calc_class_net_gain(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg((g.post - g.pre)), 4), 'sample', count(DISTINCT g.person_id)) AS jsonb_build_object
    FROM ( SELECT s.person_id,
             s.plp_release_id,
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
           GROUP BY s.person_id, s.plp_release_id) g
   WHERE ((g.pre IS NOT NULL) AND (g.post IS NOT NULL));
END;
revoke all on function public.calc_class_net_gain(uuid, uuid, text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.calc_institution_net_gain(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', round(avg((g.post - g.pre)), 4), 'sample', count(DISTINCT g.person_id)) AS jsonb_build_object
    FROM ( SELECT s.person_id,
             s.plp_release_id,
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
           GROUP BY s.person_id, s.plp_release_id) g
   WHERE ((g.pre IS NOT NULL) AND (g.post IS NOT NULL));
END;
revoke all on function public.calc_institution_net_gain(uuid, uuid, text) from public, anon, authenticated;

do $$
declare v_def text; f text;
begin
  foreach f in array array['calc_class_net_gain', 'calc_institution_net_gain'] loop
    v_def := pg_get_functiondef(('public.' || f || '(uuid,uuid,text)')::regprocedure);
    if v_def !~* 'group by s\.person_id, s\.plp_release_id' then
      raise exception '% does not pair the two tests within one chapter', f;
    end if;
    if v_def !~* 'count\(distinct g\.person_id\)' then
      raise exception '% no longer counts its sample in people', f;
    end if;
    if (select p.prosqlbody is null from pg_proc p where p.oid = ('public.' || f || '(uuid,uuid,text)')::regprocedure) then
      raise exception '% lost its parsed body', f;
    end if;
  end loop;
  if public.current_metric_catalogue() is distinct from 'MC-8' then
    raise exception 'the live metric catalogue is %, not MC-8', public.current_metric_catalogue();
  end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the metric closure did not survive: %', (select a.detail from public.assert_metric_closure() a);
  end if;
end $$;

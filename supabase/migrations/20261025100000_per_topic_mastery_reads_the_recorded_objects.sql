-- BOB-37: PER-TOPIC MASTERY CAN SHOW (EDU-12, X-10).
--
-- THE DEFECT. `assessment_results.per_domain` holds one object per objective,
-- `{benar, total, penguasaan}`: the scoring's own shape since it was first
-- written (20260913091500, evaluate_session), and evaluate_session is its only
-- writer. calc_class_topic_mastery and calc_institution_competency_outcomes
-- (last emitted in 20260923110000) kept only values whose JSON type is
-- `number`. No stored value ever was one, so both always answered nothing: the
-- teacher's «Penguasaan per bagian» and the school's competency outcomes could
-- never appear, whatever had been sat.
--
-- THE CORRECTION, and nothing else. Both calculators now read each objective's
-- recorded `penguasaan`. They read it rather than recomputing from benar/total
-- because penguasaan is what the scoring recorded for that learner and that
-- objective, stamped with the result's scoring_policy_version. A calculator
-- that recomputed it would be a second scoring engine. The metrics' meaning is
-- the average of those per-learner figures: «Rata-rata penguasaan kelas pada
-- tiap topik» and «Rata-rata penguasaan pada tiap ranah yang diukur». An entry
-- with no numeric penguasaan is not counted. Everything else in both bodies is 20260923110000's, unchanged: the
-- scoped sources, the latest result per session, the POST_TEST filter, the
-- rounding, the grouping, the `sample` (the most learners any one objective
-- has) and the output shape the surfaces already read.
--
-- D-060 (a): this changes what two metric calculations return, so the
-- migration PUBLISHES CATALOGUE MC-3. It is MC-2 copied forward as
-- publish_metric_catalogue does: definitions and readiness tiers. The
-- question-health thresholds and the declared sources are copied too, as
-- 20260923110000 found MC-2 had to (publish_metric_catalogue stops at the
-- tiers). Every minimum sample, audience, label, meaning, scope,
-- visualization, threshold and source is identical, which is asserted below
-- column by column. MC-2 stays as it is (D-060 (e)). engine_version is
-- unchanged: nothing here grades, assembles or finalizes.
--
-- NO STORED RESULT IS REWRITTEN. The calculators read `per_domain`; nothing in
-- this file writes assessment_results or any evidence table.

-- ─────────────────────────────────────────────── 1. catalogue MC-3

insert into public.metric_catalogue (version, note)
select 'MC-3',
       'per-topic mastery reads the recorded per-objective objects: class.topic_mastery and '
       'institution.competency_outcomes average each learner''s recorded penguasaan (BOB-37); '
       'every definition, minimum sample and audience is MC-2''s'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-3');

update public.metric_catalogue set superseded_by = 'MC-3'
 where version = 'MC-2' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-3', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-2'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-3' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-3', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-2'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-3' and x.tier_key = t.tier_key);

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-3', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-2'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-3' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why)
select 'MC-3', m.source_relation, m.why
  from public.metric_sources m where m.catalogue_version = 'MC-2'
on conflict (catalogue_version, source_relation) do nothing;

-- ─────────────────────────────────────────────── 2. the two calculators

create or replace function public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text)
 returns jsonb
 language sql
 stable
 set search_path to 'public', 'pg_temp'
begin atomic
 select jsonb_build_object('value', coalesce(jsonb_object_agg(d.domain, d.avg_score), '{}'::jsonb),
                           'sample', coalesce(max(d.n), (0)::bigint))
   from (select kv.key as domain,
                round(avg((kv.value ->> 'penguasaan')::numeric), 4) as avg_score,
                count(*) as n
           from (select distinct on (r.session_id) r.per_domain, r.session_id
                   from (scoped_official_results r
                     join scoped_official_sessions s on ((s.id = r.session_id)))
                  where ((s.institution_id = calc_class_topic_mastery.p_institution)
                     and (s.class_node_id = calc_class_topic_mastery.p_node)
                     and (s.mode = 'POST_TEST'::assessment_mode))
                  order by r.session_id, r.computed_at desc) latest,
                lateral jsonb_each(coalesce(latest.per_domain, '{}'::jsonb)) kv(key, value)
          where ((jsonb_typeof(kv.value) = 'object'::text)
             and (jsonb_typeof(kv.value -> 'penguasaan') = 'number'::text))
          group by kv.key) d;
end;
revoke all on function public.calc_class_topic_mastery(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text)
 returns jsonb
 language sql
 stable
 set search_path to 'public', 'pg_temp'
begin atomic
 select jsonb_build_object('value', coalesce(jsonb_agg(jsonb_build_object('competency', d.domain,
                                                                          'mean_score', d.avg_score,
                                                                          'learners', d.n)
                                                       order by d.avg_score desc), '[]'::jsonb),
                           'sample', coalesce(max(d.n), (0)::bigint))
   from (select kv.key as domain,
                round(avg((kv.value ->> 'penguasaan')::numeric), 4) as avg_score,
                count(*) as n
           from (select distinct on (r.session_id) r.per_domain, r.session_id
                   from (scoped_official_results r
                     join scoped_official_sessions s on ((s.id = r.session_id)))
                  where ((s.institution_id = calc_institution_competency_outcomes.p_institution)
                     and (s.mode = 'POST_TEST'::assessment_mode))
                  order by r.session_id, r.computed_at desc) latest,
                lateral jsonb_each(coalesce(latest.per_domain, '{}'::jsonb)) kv(key, value)
          where ((jsonb_typeof(kv.value) = 'object'::text)
             and (jsonb_typeof(kv.value -> 'penguasaan') = 'number'::text))
          group by kv.key) d;
end;
revoke all on function public.calc_institution_competency_outcomes(uuid, uuid, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────── 3. terminal verification

do $$
declare v_cat text; bad text; v text;
begin
  v_cat := public.current_metric_catalogue();
  if v_cat is distinct from 'MC-3' then
    raise exception 'BOB-37: the live catalogue is % and not MC-3', v_cat;
  end if;

  -- MC-3 is MC-2, column by column, in both directions
  select string_agg(coalesce(d3.metric_id, d2.metric_id), ', ') into bad
    from (select * from public.metric_definitions where catalogue_version = 'MC-3') d3
    full join (select * from public.metric_definitions where catalogue_version = 'MC-2') d2
      on d2.metric_id = d3.metric_id
   where d3.metric_id is null or d2.metric_id is null
      or (d3.label_key, d3.meaning_key, d3.scope, d3.evidence_class, d3.minimum_sample,
          d3.allowed_visualizations, d3.allowed_audiences, d3.calculation_key, d3.deprecated,
          d3.deprecation_note_key)
         is distinct from
         (d2.label_key, d2.meaning_key, d2.scope, d2.evidence_class, d2.minimum_sample,
          d2.allowed_visualizations, d2.allowed_audiences, d2.calculation_key, d2.deprecated,
          d2.deprecation_note_key);
  if bad is not null then raise exception 'BOB-37: MC-3 is not MC-2 on: %', bad; end if;

  if exists (select t.tier_key, t.ordinal, t.min_mastery, t.max_mastery, t.requires_safety_gate, t.applies_without_post_test
               from public.readiness_tiers t where t.catalogue_version = 'MC-3'
             except
             select t.tier_key, t.ordinal, t.min_mastery, t.max_mastery, t.requires_safety_gate, t.applies_without_post_test
               from public.readiness_tiers t where t.catalogue_version = 'MC-2')
     or (select count(*) from public.readiness_tiers where catalogue_version = 'MC-3')
        <> (select count(*) from public.readiness_tiers where catalogue_version = 'MC-2') then
    raise exception 'BOB-37: MC-3''s readiness tiers are not MC-2''s';
  end if;
  if exists (select q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
               from public.question_health_thresholds q where q.catalogue_version = 'MC-3'
             except
             select q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
               from public.question_health_thresholds q where q.catalogue_version = 'MC-2')
     or (select count(*) from public.question_health_thresholds where catalogue_version = 'MC-3')
        <> (select count(*) from public.question_health_thresholds where catalogue_version = 'MC-2') then
    raise exception 'BOB-37: MC-3''s question-health thresholds are not MC-2''s';
  end if;
  if exists (select m.source_relation from public.metric_sources m where m.catalogue_version = 'MC-3'
             except select m.source_relation from public.metric_sources m where m.catalogue_version = 'MC-2')
     or (select count(*) from public.metric_sources where catalogue_version = 'MC-3')
        <> (select count(*) from public.metric_sources where catalogue_version = 'MC-2') then
    raise exception 'BOB-37: MC-3''s declared sources are not MC-2''s';
  end if;

  -- both calculators read the recorded object, and neither keeps only bare numbers
  foreach v in array array['public.calc_class_topic_mastery(uuid,uuid,text)',
                           'public.calc_institution_competency_outcomes(uuid,uuid,text)'] loop
    if pg_get_functiondef(v::regprocedure) !~ $r$'penguasaan'$r$
       or pg_get_functiondef(v::regprocedure) ~ $r$jsonb_typeof\(kv\.value\) = 'number'$r$ then
      raise exception 'BOB-37: % does not read the recorded penguasaan', v;
    end if;
    if has_function_privilege('anon', v, 'execute') or has_function_privilege('authenticated', v, 'execute') then
      raise exception 'BOB-37: % is callable by a client role', v;
    end if;
  end loop;

  -- the closure invariant holds over the new catalogue
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'BOB-37: the metric closure invariant is red over MC-3: %',
      (select a.detail from public.assert_metric_closure() a);
  end if;
end $$;

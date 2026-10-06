-- CR-81 (D-122(3), D-123(3)): THE PERFORMANCE BANDS ARE READ OVER THE ASSESSED, AND THE CLASS'S POPULATION IS SAID APART.
--
-- «The performance-band denominator and the minimum-sample floor for showing those bands use assessed learners only.
-- "Belum mengerjakan" belongs to class/readiness population reporting, never to the performance distribution
-- denominator … The 24 who haven't sat the assessment must not dilute the bars or help satisfy the sample-size floor.»
-- (D-123(3))
--
-- MC-6 (20261130100000, D-121(c)) built the not-yet state by counting every learner placed in the class in the readiness
-- distribution: «Belum mengerjakan Uji Penguasaan» was one of its keys and the sample, the floor's count, was every
-- learner placed. So a class of 30 with 6 assessed passed the floor of 5 on its 30, and each band's bar was drawn
-- against 30.
--
-- Now (catalogue MC-7):
--   * calc_class_readiness_distribution's value is the bands of the ASSESSED only (the latest official Uji Penguasaan
--     result in the class, as before; a failed safety gate is the lowest band, as before), and its sample, which the
--     floor reads, is the number assessed;
--   * beside them it reports the class's POPULATION: the learners placed in the class now, the learners assessed there,
--     and those placed with no result there yet («Belum mengerjakan Uji Penguasaan»). A learner who has left the class
--     keeps the band their work there earned (M9) and is counted as assessed, not as placed;
--   * metric_evaluate passes a calculator's population through in both its envelopes, so a class nobody has sat yet
--     still says who is waiting (D-121(c)), while its bands stay withheld until five are assessed. Who is in a class is
--     not a performance figure; no other calculator reports a population, so every other envelope is unchanged.
-- What the school's mark makes of each result (achieved mastery or below it) is not here: it needs the sealed mark of
-- each assignment, a new governed source, and is S6's question.
--
-- CATALOGUE: MC-6 → MC-7 (D-060(a): a calculator's meaning changed). Every definition, minimum sample, audience, tier,
-- threshold and source is MC-6's. MC-6 stays as it is (D-060(e)).
-- ENGINE: unchanged (no grading, assembly or finalization semantics).

-- ═══════════════════════════════════════════════════════════ CATALOGUE MC-7
insert into public.metric_catalogue (version, note)
select 'MC-7',
       'the readiness distribution''s bands and its sample are the assessed learners only; the class''s population '
       '(placed, assessed, not yet) is reported beside them and said whatever the floor (D-123(3), D-122(3)); every '
       'definition, minimum sample, audience, tier, threshold and source is MC-6''s'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-7');

update public.metric_catalogue set superseded_by = 'MC-7'
 where version = 'MC-6' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-7', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-6'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-7' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-7', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-6'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-7' and x.tier_key = t.tier_key);

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-7', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-6'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-7' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why)
select 'MC-7', m.source_relation, m.why
  from public.metric_sources m where m.catalogue_version = 'MC-6'
on conflict (catalogue_version, source_relation) do nothing;

-- ═══════════════════════════════════════════════════════════ the calculator
create or replace function public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb
language sql stable set search_path = public, pg_temp
begin atomic
  with assessed as (
    -- the latest official Uji Penguasaan result of each learner in this class
    select distinct on (s.person_id) s.person_id, r.mastery, r.safety_gate_passed
      from scoped_official_sessions s
      join scoped_official_results r on r.session_id = s.id
     where s.institution_id = p_institution and s.class_node_id = p_node and s.mode = 'POST_TEST'
     order by s.person_id, r.computed_at desc
  ), bands as (
    -- banded as before; a failed safety gate falls to the lowest band
    select coalesce(t.tier_key, lowest.tier_key) as tier_key, count(*) as n
      from assessed learner
      left join lateral (select t2.tier_key from readiness_tiers t2
                          where t2.catalogue_version = p_catalogue and t2.min_mastery is not null
                            and learner.mastery >= t2.min_mastery and learner.mastery < t2.max_mastery
                            and learner.safety_gate_passed is not false
                          limit 1) t on true
      left join lateral (select t3.tier_key from readiness_tiers t3
                          where t3.catalogue_version = p_catalogue and t3.min_mastery is not null
                          order by t3.min_mastery limit 1) lowest on true
     group by coalesce(t.tier_key, lowest.tier_key)
  ), placed as (
    -- placed in this class now (D-088(i))
    select distinct pl.person_id from scoped_class_placements pl
     where pl.institution_id = p_institution and pl.class_node_id = p_node
  )
  select jsonb_build_object(
           'value', coalesce((select jsonb_object_agg(b.tier_key, b.n) from bands b), '{}'::jsonb),
           'sample', (select count(*) from assessed),
           'population', jsonb_build_object(
             'placed', (select count(*) from placed),
             'assessed', (select count(*) from assessed),
             'not_yet', (select count(*) from placed p where not exists (select 1 from assessed a where a.person_id = p.person_id))));
end;
revoke all on function public.calc_class_readiness_distribution(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.calc_class_readiness_distribution(uuid, uuid, text) to service_role;

-- ═══════════════════════════════════════════════════════════ the evaluator passes a population through
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
                              case v_ready
                                when 'NOT_YET_EVALUABLE' then 'laporan.metrik.belum_ada_bukti'
                                else 'laporan.metrik.belum_cukup_data'
                              end,
                              'have', v_have,
                              'needed', d.minimum_sample)
           -- CR-81 (D-123(3)): who is in the population is no performance figure; it is said whatever the floor
           || case when v_out ? 'population' then jsonb_build_object('population', v_out -> 'population') else '{}'::jsonb end;
  end if;

  return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                            'status', 'ok', 'scope', d.scope,
                            'readiness', v_ready,
                            'label_key', d.label_key, 'meaning_key', d.meaning_key,
                            'allowed_visualizations', to_jsonb(d.allowed_visualizations),
                            'value', v_out -> 'value', 'sample', v_out -> 'sample')
         || case when v_out ? 'population' then jsonb_build_object('population', v_out -> 'population') else '{}'::jsonb end;
end $function$;

revoke all on function public.metric_evaluate(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.metric_evaluate(text, uuid, uuid, text) to authenticated;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
declare n int;
begin
  if public.current_metric_catalogue() is distinct from 'MC-7' then
    raise exception 'MC-7 is not the live catalogue';
  end if;
  -- every definition is MC-6's, column by column
  select count(*) into n from public.metric_definitions a
    full join public.metric_definitions b on b.metric_id = a.metric_id and b.catalogue_version = 'MC-6'
   where a.catalogue_version = 'MC-7'
     and (b.metric_id is null or (a.label_key, a.meaning_key, a.scope, a.evidence_class, a.minimum_sample,
          a.allowed_visualizations, a.allowed_audiences, a.calculation_key, a.deprecated)
          is distinct from (b.label_key, b.meaning_key, b.scope, b.evidence_class, b.minimum_sample,
          b.allowed_visualizations, b.allowed_audiences, b.calculation_key, b.deprecated));
  if n <> 0 or (select count(*) from public.metric_definitions where catalogue_version = 'MC-7')
             <> (select count(*) from public.metric_definitions where catalogue_version = 'MC-6') then
    raise exception 'MC-7 does not carry MC-6''s definitions unchanged';
  end if;
  if position('population' in pg_get_functiondef('public.calc_class_readiness_distribution(uuid,uuid,text)'::regprocedure)) = 0
     or position('population' in pg_get_functiondef('public.metric_evaluate(text,uuid,uuid,text)'::regprocedure)) = 0 then
    raise exception 'the population is not reported and passed through';
  end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the metric closure invariant is red after MC-7';
  end if;
end $$;

-- D-121(c): «BELUM MENGERJAKAN UJI PENGUASAAN», BUILT. D-095(c) defined the teacher's distribution with "no Uji
-- Penguasaan, a distinct not-yet state"; the metric catalogue has carried that tier since MC-1
-- (kesiapan.belum_post_test, applies_without_post_test) and the copy table its words, but nothing produced it (review F5,
-- READINESS-TIERS-TERMINOLOGY T4, D-095(g)): calc_class_readiness_distribution counted only learners with an official
-- Uji Penguasaan result in the class, and its not-yet fallback could never be reached because the lowest band always
-- answered first. A class nobody had tested read as empty, and a teacher could not see who was still to be tested,
-- which is the first thing a teacher acts on.
--
-- Now the distribution is of the learners placed in the class:
--   * a learner with an official Uji Penguasaan result in the class is banded as before (the latest result; a failed
--     safety gate falls to the lowest band, D-095(c) «or a required item missed»), and never counts as not yet;
--   * a learner placed in the class (an open placement of a PENDING or ACTIVE enrolment, D-088(i)) with no such result
--     there counts in the not-yet state and in no band: never started, an unfinished sitting, only a Pemetaan Awal, or
--     tested in another class before a move;
--   * the class's sample is every learner the distribution counts, so the state shows while a class is still untested
--     (the minimum-sample floor applies to that total).
-- A learner who has left the class keeps the band their work there earned (class calculators read the session's own
-- class, M9), and is not counted there as not yet.
--
-- The placements come from a new metric source, scoped_class_placements: the same organizational boundary as every
-- scoped_* source (row_in_metric_boundary), synthetic schools and evaluation personas excluded, as official evidence
-- excludes them.
--
-- CATALOGUE: MC-5 → MC-6 (D-060(a): a calculator's meaning changed and a metric source was added). Every definition,
-- minimum sample, audience, tier and threshold is MC-5's. MC-5 stays as it is (D-060(e)).
-- ENGINE: unchanged (no grading, assembly or finalization semantics).

-- ═══════════════════════════════════════════════════════════ the placements, as a metric source
create or replace view public.scoped_class_placements as
  select e.person_id, e.institution_id, m.node_id as class_node_id, m.enrollment_id
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
    join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
    join public.institutions i on i.id = e.institution_id
   where m.valid_to is null
     and e.status in ('PENDING', 'ACTIVE')
     and not i.is_synthetic
     and not exists (select 1 from public.evaluation_personas p where p.person_id = e.person_id)
     and public.row_in_metric_boundary(e.institution_id, m.node_id, e.person_id);
comment on view public.scoped_class_placements is
  'The learners placed in a class now (D-088(i): open placements of PENDING or ACTIVE enrolments), inside the metric '
  'boundary, synthetic schools and evaluation personas excluded. Read by calc_class_readiness_distribution for the '
  'not-yet state (D-121(c)).';
revoke all on public.scoped_class_placements from public, anon, authenticated;
grant select on public.scoped_class_placements to service_role;

-- ═══════════════════════════════════════════════════════════ CATALOGUE MC-6
insert into public.metric_catalogue (version, note)
select 'MC-6',
       'the readiness distribution counts every learner placed in the class: an official Uji Penguasaan result there is '
       'banded as before; none is «Belum mengerjakan Uji Penguasaan» (kesiapan.belum_post_test), never a band '
       '(D-121(c), D-095(c)(g), review F5 / T4); scoped_class_placements is a new source; every definition, minimum '
       'sample, audience, tier and threshold is MC-5''s'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-6');

update public.metric_catalogue set superseded_by = 'MC-6'
 where version = 'MC-5' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-6', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-5'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-6' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-6', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-5'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-6' and x.tier_key = t.tier_key);

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-6', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-5'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-6' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why)
select 'MC-6', m.source_relation, m.why
  from public.metric_sources m where m.catalogue_version = 'MC-5'
on conflict (catalogue_version, source_relation) do nothing;
insert into public.metric_sources (catalogue_version, source_relation, why)
values ('MC-6', 'scoped_class_placements',
        'the learners placed in a class now, for the readiness distribution''s not-yet state (D-121(c))')
on conflict (catalogue_version, source_relation) do nothing;

-- ═══════════════════════════════════════════════════════════ the calculator
create or replace function public.calc_class_readiness_distribution(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb
language sql stable set search_path = public, pg_temp
begin atomic
  select jsonb_build_object('value', coalesce(jsonb_object_agg(d.tier_key, d.n), '{}'::jsonb),
                            'sample', coalesce(sum(d.n), 0))
    from (
      -- assessed: the latest official Uji Penguasaan result in this class, banded; a failed gate is the lowest band
      select coalesce(t.tier_key, lowest.tier_key) as tier_key, count(*) as n
        from (select distinct on (s.person_id) s.person_id, r.mastery, r.safety_gate_passed
                from scoped_official_sessions s
                join scoped_official_results r on r.session_id = s.id
               where s.institution_id = p_institution and s.class_node_id = p_node and s.mode = 'POST_TEST'
               order by s.person_id, r.computed_at desc) learner
        left join lateral (select t2.tier_key from readiness_tiers t2
                            where t2.catalogue_version = p_catalogue and t2.min_mastery is not null
                              and learner.mastery >= t2.min_mastery and learner.mastery < t2.max_mastery
                              and learner.safety_gate_passed is not false
                            limit 1) t on true
        left join lateral (select t3.tier_key from readiness_tiers t3
                            where t3.catalogue_version = p_catalogue and t3.min_mastery is not null
                            order by t3.min_mastery limit 1) lowest on true
       group by coalesce(t.tier_key, lowest.tier_key)
      union all
      -- not yet: placed in this class now, with no official Uji Penguasaan result here
      select nopost.tier_key, count(*) as n
        from scoped_class_placements pl
        join lateral (select t4.tier_key from readiness_tiers t4
                       where t4.catalogue_version = p_catalogue and t4.applies_without_post_test
                       limit 1) nopost on true
       where pl.institution_id = p_institution and pl.class_node_id = p_node
         and not exists (select 1 from scoped_official_sessions s2
                           join scoped_official_results r2 on r2.session_id = s2.id
                          where s2.person_id = pl.person_id and s2.institution_id = p_institution
                            and s2.class_node_id = p_node and s2.mode = 'POST_TEST')
       group by nopost.tier_key
    ) d;
end;
revoke all on function public.calc_class_readiness_distribution(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.calc_class_readiness_distribution(uuid, uuid, text) to service_role;

-- ═══════════════════════════════════════════════════════════ the guard admits the placement family, with its checks
-- assert_academic_sources_are_context_bound (20260928100000, D-088(g)) names every relation a calculator may read; a new
-- source joins it only with checks of its own: the organizational boundary kept, class placements only, no evidence.
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
     and c.table_name in ('assessment_definitions', 'lessons', 'learning_objectives')
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

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
declare v_ok boolean; v_detail text;
begin
  if public.current_metric_catalogue() <> 'MC-6' then raise exception 'MC-6 is not the live catalogue'; end if;
  if not exists (select 1 from public.metric_sources where catalogue_version = 'MC-6' and source_relation = 'scoped_class_placements') then
    raise exception 'scoped_class_placements is not a declared MC-6 source';
  end if;
  if (select count(*) from public.metric_definitions where catalogue_version = 'MC-6')
     <> (select count(*) from public.metric_definitions where catalogue_version = 'MC-5') then
    raise exception 'MC-6 does not carry every MC-5 definition';
  end if;
  select c.ok, c.detail into v_ok, v_detail from public.assert_metric_closure() c;
  if not v_ok then raise exception 'metric closure broken: %', v_detail; end if;
  select c.ok, c.detail into v_ok, v_detail from public.assert_academic_sources_are_context_bound() c;
  if not v_ok then raise exception 'academic sources: %', v_detail; end if;
end $$;

-- D-088(g) (Yazid, 2 Oct) -- A TOPIC IS NAMED BY ITS OBJECTIVE, AND TWO
-- OBJECTIVES ARE NEVER AVERAGED AS ONE.
--
-- THE DEFECT (WAITING 8; HOD-J03, EDU-12). «Penguasaan per bagian» and the
-- school's competency outcomes group each learner's recorded per-objective
-- mastery by the key `assessment_results.per_domain` uses: the objective's
-- CODE. Codes are set at import as B{module}P{lesson} and repeat across
-- chapters, so a class that sat two chapters had «B1P1» of both averaged as
-- one topic, and every reader saw a code instead of what was learned.
--
-- THE RULING, option (a): the calculators group by the session's own
-- objective and return its readable statement, with `learning_objectives`
-- declared as a metric source in a new catalogue, MC-4 (D-060).
--
-- HOW A CODE BECOMES THE SESSION'S OWN OBJECTIVE. The scoring keyed
-- per_domain by the codes of the objectives of the questions the session
-- presented, which are the lessons of its assessment's chapter (a POST_TEST
-- definition always names its module: assessment_definitions_scope_one). So
-- the objective is the one with that code among the lessons of the session's
-- definition's module (the first lesson's, should one module repeat a code).
-- That path reads three CONTENT relations and no learner evidence:
-- assessment_definitions, lessons, learning_objectives. They are declared as
-- MC-4's sources beside MC-3's scoped ones; the learner evidence is still read
-- only through scoped_official_results and scoped_official_sessions, so the
-- boundary is exactly MC-3's. A code that maps to no objective (a result with
-- no chapter behind it) is kept, named by its code, never dropped or merged.
--
-- THE SHAPE. class.topic_mastery was an object {code: mean}; it is now the
-- list institution.competency_outcomes already was, one row per objective:
-- {objective_id, code, competency (the statement), mean_score, learners}.
-- institution.competency_outcomes gains objective_id and code, and its
-- `competency` is now the statement. Means, rounding, the latest result per
-- session, the POST_TEST filter and `sample` (the most learners any one
-- objective has) are MC-3's, unchanged.
--
-- D-060 (a): MC-4 is MC-3 copied forward -- definitions, readiness tiers,
-- question-health thresholds, sources -- plus the three declared sources;
-- every definition column is asserted identical below. MC-3 stays as it is
-- (D-060 (e)). engine_version is unchanged. NO STORED RESULT IS REWRITTEN.

-- ─────────────────────────────────────────────── 1. catalogue MC-4

insert into public.metric_catalogue (version, note)
select 'MC-4',
       'a topic is named by its objective: class.topic_mastery and institution.competency_outcomes group by the '
       'session''s own objective (its chapter''s lesson with that code) and return its statement (D-088(g)); '
       'every definition, minimum sample and audience is MC-3''s'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-4');

update public.metric_catalogue set superseded_by = 'MC-4'
 where version = 'MC-3' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-4', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-3'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-4' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-4', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-3'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-4' and x.tier_key = t.tier_key);

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-4', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-3'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-4' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why)
select 'MC-4', m.source_relation, m.why
  from public.metric_sources m where m.catalogue_version = 'MC-3'
on conflict (catalogue_version, source_relation) do nothing;

insert into public.metric_sources (catalogue_version, source_relation, why) values
  ('MC-4', 'assessment_definitions', 'content, not evidence: the chapter (module) a session''s assessment names, so a per_domain code resolves to that chapter''s objective (D-088(g))'),
  ('MC-4', 'lessons',                'content, not evidence: the lessons of that chapter, whose objectives the session''s questions carried (D-088(g))'),
  ('MC-4', 'learning_objectives',    'content, not evidence: the objective itself and its readable statement, so a topic is named by what was learned and two chapters'' equal codes are never averaged as one (D-088(g))')
on conflict (catalogue_version, source_relation) do nothing;

-- ─────────────────────────────────────────────── 2. the two calculators

create or replace function public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text)
 returns jsonb
 language sql
 stable
 set search_path to 'public', 'pg_temp'
begin atomic
 select jsonb_build_object('value', coalesce(jsonb_agg(jsonb_build_object('objective_id', d.objective_id,
                                                                          'code', d.code,
                                                                          'competency', d.statement,
                                                                          'mean_score', d.avg_score,
                                                                          'learners', d.n)
                                                       order by d.avg_score, d.statement, d.code), '[]'::jsonb),
                           'sample', coalesce(max(d.n), (0)::bigint))
   from (select t.objective_id,
                min(t.code) as code,
                coalesce(min(lo.statement), min(t.code)) as statement,
                round(avg((t.recorded ->> 'penguasaan')::numeric), 4) as avg_score,
                count(*) as n
           from (select kv.key as code,
                        kv.value as recorded,
                        (select o.id
                           from (public.assessment_definitions ad
                             join public.lessons l on ((l.module_id = ad.module_id)))
                             join public.learning_objectives o on ((o.lesson_id = l.id))
                          where ((ad.id = latest.assessment_definition_id) and (o.code = kv.key))
                          order by l.ordinal, o.id
                         limit 1) as objective_id
                   from (select distinct on (r.session_id) r.per_domain, r.session_id, s.assessment_definition_id
                           from (scoped_official_results r
                             join scoped_official_sessions s on ((s.id = r.session_id)))
                          where ((s.institution_id = calc_class_topic_mastery.p_institution)
                             and (s.class_node_id = calc_class_topic_mastery.p_node)
                             and (s.mode = 'POST_TEST'::assessment_mode))
                          order by r.session_id, r.computed_at desc) latest,
                        lateral jsonb_each(coalesce(latest.per_domain, '{}'::jsonb)) kv(key, value)
                  where ((jsonb_typeof(kv.value) = 'object'::text)
                     and (jsonb_typeof(kv.value -> 'penguasaan') = 'number'::text))) t
             left join public.learning_objectives lo on ((lo.id = t.objective_id))
          group by t.objective_id, coalesce((t.objective_id)::text, t.code)) d;
end;
revoke all on function public.calc_class_topic_mastery(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text)
 returns jsonb
 language sql
 stable
 set search_path to 'public', 'pg_temp'
begin atomic
 select jsonb_build_object('value', coalesce(jsonb_agg(jsonb_build_object('objective_id', d.objective_id,
                                                                          'code', d.code,
                                                                          'competency', d.statement,
                                                                          'mean_score', d.avg_score,
                                                                          'learners', d.n)
                                                       order by d.avg_score desc, d.statement, d.code), '[]'::jsonb),
                           'sample', coalesce(max(d.n), (0)::bigint))
   from (select t.objective_id,
                min(t.code) as code,
                coalesce(min(lo.statement), min(t.code)) as statement,
                round(avg((t.recorded ->> 'penguasaan')::numeric), 4) as avg_score,
                count(*) as n
           from (select kv.key as code,
                        kv.value as recorded,
                        (select o.id
                           from (public.assessment_definitions ad
                             join public.lessons l on ((l.module_id = ad.module_id)))
                             join public.learning_objectives o on ((o.lesson_id = l.id))
                          where ((ad.id = latest.assessment_definition_id) and (o.code = kv.key))
                          order by l.ordinal, o.id
                         limit 1) as objective_id
                   from (select distinct on (r.session_id) r.per_domain, r.session_id, s.assessment_definition_id
                           from (scoped_official_results r
                             join scoped_official_sessions s on ((s.id = r.session_id)))
                          where ((s.institution_id = calc_institution_competency_outcomes.p_institution)
                             and (s.mode = 'POST_TEST'::assessment_mode))
                          order by r.session_id, r.computed_at desc) latest,
                        lateral jsonb_each(coalesce(latest.per_domain, '{}'::jsonb)) kv(key, value)
                  where ((jsonb_typeof(kv.value) = 'object'::text)
                     and (jsonb_typeof(kv.value -> 'penguasaan') = 'number'::text))) t
             left join public.learning_objectives lo on ((lo.id = t.objective_id))
          group by t.objective_id, coalesce((t.objective_id)::text, t.code)) d;
end;
revoke all on function public.calc_institution_competency_outcomes(uuid, uuid, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────── 2b. the source guard names the content family

-- assert_academic_sources_are_context_bound (20260928100000) admits a calculator's
-- relation only from the narrowed EVIDENCE families. The three content relations
-- above are not evidence; they are named as their own family, and the guard now
-- also fails if any of them ever carries a learner. Everything else in its body
-- is unchanged.
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
                            'assessment_definitions', 'lessons', 'learning_objectives');
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

-- ─────────────────────────────────────────────── 3. terminal verification

do $$
declare v_cat text; bad text; v text;
begin
  v_cat := public.current_metric_catalogue();
  if v_cat is distinct from 'MC-4' then
    raise exception 'D-088(g): the live catalogue is % and not MC-4', v_cat;
  end if;

  -- MC-4 is MC-3, column by column, in both directions
  select string_agg(coalesce(d4.metric_id, d3.metric_id), ', ') into bad
    from (select * from public.metric_definitions where catalogue_version = 'MC-4') d4
    full join (select * from public.metric_definitions where catalogue_version = 'MC-3') d3
      on d3.metric_id = d4.metric_id
   where d4.metric_id is null or d3.metric_id is null
      or (d4.label_key, d4.meaning_key, d4.scope, d4.evidence_class, d4.minimum_sample,
          d4.allowed_visualizations, d4.allowed_audiences, d4.calculation_key, d4.deprecated,
          d4.deprecation_note_key)
         is distinct from
         (d3.label_key, d3.meaning_key, d3.scope, d3.evidence_class, d3.minimum_sample,
          d3.allowed_visualizations, d3.allowed_audiences, d3.calculation_key, d3.deprecated,
          d3.deprecation_note_key);
  if bad is not null then raise exception 'D-088(g): MC-4 is not MC-3 on: %', bad; end if;

  if (select count(*) from public.readiness_tiers where catalogue_version = 'MC-4')
       <> (select count(*) from public.readiness_tiers where catalogue_version = 'MC-3')
     or (select count(*) from public.question_health_thresholds where catalogue_version = 'MC-4')
       <> (select count(*) from public.question_health_thresholds where catalogue_version = 'MC-3') then
    raise exception 'D-088(g): MC-4 did not carry MC-3''s readiness tiers and question-health thresholds';
  end if;
  -- the sources are MC-3's plus exactly the three content relations
  select string_agg(x, ', ') into bad from (
    (select m.source_relation as x from public.metric_sources m where m.catalogue_version = 'MC-4'
     except select m.source_relation from public.metric_sources m where m.catalogue_version = 'MC-3')
    except select unnest(array['assessment_definitions', 'lessons', 'learning_objectives'])) y;
  if bad is not null then raise exception 'D-088(g): MC-4 declares an unexpected source: %', bad; end if;
  if (select count(*) from public.metric_sources where catalogue_version = 'MC-4')
     <> (select count(*) from public.metric_sources where catalogue_version = 'MC-3') + 3 then
    raise exception 'D-088(g): MC-4''s sources are not MC-3''s plus the three content relations';
  end if;

  -- both calculators resolve the objective and name it by its statement
  foreach v in array array['public.calc_class_topic_mastery(uuid,uuid,text)',
                           'public.calc_institution_competency_outcomes(uuid,uuid,text)'] loop
    if pg_get_functiondef(v::regprocedure) !~ 'learning_objectives'
       or pg_get_functiondef(v::regprocedure) !~ $r$'competency', d\.statement$r$
       or pg_get_functiondef(v::regprocedure) !~ $r$'penguasaan'$r$ then
      raise exception 'D-088(g): % does not group by the objective and name it', v;
    end if;
    if has_function_privilege('anon', v, 'execute') or has_function_privilege('authenticated', v, 'execute') then
      raise exception 'D-088(g): % is callable by a client role', v;
    end if;
  end loop;

  if not (select a.ok from public.assert_academic_sources_are_context_bound() a) then
    raise exception 'D-088(g): the academic source guard is red over MC-4: %',
      (select a.detail from public.assert_academic_sources_are_context_bound() a);
  end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'D-088(g): the metric closure invariant is red over MC-4: %',
      (select a.detail from public.assert_metric_closure() a);
  end if;
end $$;

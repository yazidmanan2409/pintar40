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
  ('MC-9', 'org_nodes', 'structure, not evidence: the Tingkat (COHORT) above a session''s own class, so a learner placed in a Kelas is counted in its Angkatan (institution.cohort_comparison); only the node''s id is read'),
  ('MC-9', 'modules', 'content, not evidence: the modules of the course an assessment names (a chapter written in Studio), so a per_domain code resolves to that chapter''s objective (D-088(g))')
on conflict (catalogue_version, source_relation) do nothing;

-- ═══════════════════════════════════════════════════════════ the two calculators

CREATE OR REPLACE FUNCTION public.calc_class_topic_mastery(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('objective_id', d.objective_id, 'code', d.code, 'competency', d.statement, 'mean_score', d.avg_score, 'learners', d.n) ORDER BY d.avg_score, d.statement, d.code), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(DISTINCT t.person_id) AS n
            FROM (( SELECT kv.key AS code,
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
           GROUP BY t.objective_id, COALESCE((t.objective_id)::text, t.code)) d;
END;
revoke all on function public.calc_class_topic_mastery(uuid, uuid, text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.calc_institution_competency_outcomes(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('objective_id', d.objective_id, 'code', d.code, 'competency', d.statement, 'mean_score', d.avg_score, 'learners', d.n) ORDER BY d.avg_score DESC, d.statement, d.code), '[]'::jsonb), 'sample', COALESCE(max(d.n), (0)::bigint)) AS jsonb_build_object
    FROM ( SELECT t.objective_id,
             min(t.code) AS code,
             COALESCE(min(lo.statement), min(t.code)) AS statement,
             round(avg(((t.recorded ->> 'penguasaan'::text))::numeric), 4) AS avg_score,
             count(DISTINCT t.person_id) AS n
            FROM (( SELECT kv.key AS code,
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
 SELECT jsonb_build_object('value', round(avg(x.mastery), 4), 'sample', count(DISTINCT x.person_id)) AS jsonb_build_object
    FROM ( SELECT DISTINCT ON (r.session_id) r.mastery,
             s.person_id
            FROM (scoped_official_results r
              JOIN scoped_official_sessions s ON ((s.id = r.session_id)))
           WHERE ((s.institution_id = calc_class_comprehension.p_institution) AND (s.class_node_id = calc_class_comprehension.p_node) AND (s.mode = 'POST_TEST'::assessment_mode))
           ORDER BY r.session_id, r.computed_at DESC) x;
END;
revoke all on function public.calc_class_comprehension(uuid, uuid, text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ «Perbandingan angkatan»
-- A session records a cohort only when the learner holds a membership on the COHORT node itself (start_learning_session).
-- Every placement PINTAR makes (Pendataan, Pindah, tempatkan_murid) is a membership of a Kelas, so every real sitting
-- recorded none and the comparison showed one unnamed row «—» for the whole school. The cohort is now the session's
-- own, else the COHORT above the session's class. The sample (the learners counted) and the means are unchanged.
CREATE OR REPLACE FUNCTION public.calc_institution_cohort_comparison(p_node uuid, p_institution uuid, p_catalogue text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
BEGIN ATOMIC
 SELECT jsonb_build_object('value', COALESCE(jsonb_agg(jsonb_build_object('cohort_node_id', c.cohort_node_id, 'learners', c.learners, 'mean_mastery', c.mean_mastery) ORDER BY c.mean_mastery DESC NULLS LAST), '[]'::jsonb), 'sample', COALESCE(sum(c.learners), (0)::numeric)) AS jsonb_build_object
    FROM ( SELECT COALESCE(s.cohort_node_id, ( SELECT n.id
                    FROM (org_nodes k
                      JOIN org_nodes n ON (((n.id = ANY (k.jalur)) AND (n.kind = 'COHORT'::org_kind))))
                   WHERE (k.id = s.class_node_id)
                   ORDER BY (array_position(k.jalur, n.id)) DESC
                  LIMIT 1)) AS cohort_node_id,
             count(DISTINCT s.person_id) AS learners,
             round(avg(r.mastery), 4) AS mean_mastery
            FROM (scoped_official_sessions s
              JOIN scoped_official_results r ON ((r.session_id = s.id)))
           WHERE ((s.institution_id = calc_institution_cohort_comparison.p_institution) AND (s.mode = 'POST_TEST'::assessment_mode))
           GROUP BY 1) c;
END;
revoke all on function public.calc_institution_cohort_comparison(uuid, uuid, text) from public, anon, authenticated;

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

-- ═══════════════════════════════════════════════════════════ verification (structure only)
do $$
declare f text; v_def text;
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
    if pg_get_functiondef(('public.' || f)::regprocedure) !~* 'count\(distinct (t|x)\.person_id\)' then
      raise exception '% does not count its sample in people', f;
    end if;
  end loop;
  if public.current_metric_catalogue() is distinct from 'MC-9' then
    raise exception 'the live metric catalogue is %, not MC-9', public.current_metric_catalogue();
  end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the metric closure did not survive: %', (select a.detail from public.assert_metric_closure() a);
  end if;
end $$;

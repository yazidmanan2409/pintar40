-- Owner ruling (10 Nov, on Daisy's TINJAUAN-6faef690 §1) and two defects #97 exposed. Red first: F38-W06, F38-W07, F38-W08.
--
-- 1. A WITHDRAWN ASSIGNMENT IS NOT COUNTED. «Ditarik» means the assignment was given by mistake. Its sittings, answers,
--    results and audit history are kept, but they leave the class's learning figures: every class and school figure
--    reads scoped_official_sessions (and scoped_official_results through it), the class misconceptions read
--    service_cohort_misconceptions, and target_kelas names a lesson's pass mark as a class target. Each now leaves out
--    a sitting or a target of a WITHDRAWN learning assignment. An ENDED assignment («Diakhiri», the normal close)
--    keeps counting. The exclusion follows the assignment's status, so it holds for results made before the
--    withdrawal and for any figure computed after it; nothing is deleted or rewritten.
--
-- 2. A FINISHED RESULT STAYS SEEN (defect). my_learning_assignments lists ACTIVE assignments only, and Hasil Belajar,
--    my_cycle_state and learner_lessons read through it, so ending a lesson (its normal close) hid the learner's own
--    finished result. my_learning_history lists the learner's assignments that are ACTIVE, ENDED or WITHDRAWN, with
--    their status, under the same membership rule; the two read functions accept it. Starting and recording work
--    (record_lesson_progress, may_read_lesson_media, start_learning_session, may_start_assessment) are unchanged:
--    closing a lesson stops new work and no longer hides its outcome.
--
-- 3. A SITTING THE SCHOOL ENDED SAYS SO (defect). submit_session refused a TERMINATED sitting with no code, so the
--    player said «Ada jawaban yang belum tersimpan…». It now raises PR003 (SESSION_ENDED_BY_SCHOOL), which the player
--    tells as an administrative close.
--
-- Replaced from their own current definitions where they are long (the anchors are checked first), so nothing else in
-- them changes.

-- CATALOGUE: MC-9 → MC-10 (D-060(a)). The figures change: a withdrawn assignment's sittings leave them. Every MC-9
-- definition, tier, threshold and source is carried unchanged; MC-10 adds learning_assignments as a source (its status).

insert into public.metric_catalogue (version, note)
select 'MC-10',
       'MC-10 (owner ruling, 10 Nov). EVIDENCE: a sitting of a learning assignment the teacher WITHDREW (given by '
       'mistake) is kept with its answers, result and audit history and is not counted in any class or school figure; '
       'an ENDED assignment (the normal close) keeps counting. DEFINITIONS, TIERS, THRESHOLDS: MC-9''s. SOURCES: MC-9''s '
       'plus learning_assignments'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-10');

update public.metric_catalogue set superseded_by = 'MC-10'
 where version = 'MC-9' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-10', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-9'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-10' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-10', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-9'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-10' and x.tier_key = t.tier_key);

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-10', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-9'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-10' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why)
select 'MC-10', m.source_relation, m.why
  from public.metric_sources m where m.catalogue_version = 'MC-9'
on conflict (catalogue_version, source_relation) do nothing;

insert into public.metric_sources (catalogue_version, source_relation, why) values
  ('MC-10', 'learning_assignments', 'status, not evidence: a sitting of a WITHDRAWN assignment is kept and not counted (owner ruling, 10 Nov)')
on conflict (catalogue_version, source_relation) do nothing;

-- ───────────────────────────────────────────── 1. withdrawn sittings leave the figures

create or replace function public.dari_penugasan_ditarik(p_learning_assignment uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_learning_assignment is not null
     and exists (select 1 from public.learning_assignments la where la.id = p_learning_assignment and la.status = 'WITHDRAWN');
$$;
revoke all on function public.dari_penugasan_ditarik(uuid) from public, anon, authenticated;

create or replace view public.scoped_official_sessions as
  select s.id, s.person_id, s.institution_id, s.enrollment_id, s.academic_period_id,
         s.class_node_id, s.cohort_node_id, s.plp_release_id,
         s.assessment_definition_id, s.assessment_definition_version,
         s.engine_version, s.scoring_policy_version, s.evidence_channel, s.mode,
         s.status, s.started_at, s.submitted_at, s.finalized_at, s.created_at
    from public.official_sessions s
   where public.row_in_metric_boundary(s.institution_id,
                                       coalesce(s.class_node_id, s.cohort_node_id), s.person_id)
     and public.row_in_learning_context(s.plp_release_id)
     -- owner ruling (10 Nov): a sitting of a withdrawn assignment is kept and not counted
     and not exists (select 1 from public.assessment_sessions x
                      where x.id = s.id and public.dari_penugasan_ditarik(x.learning_assignment_id));

do $$
declare v_def text := pg_get_viewdef('public.service_cohort_misconceptions'::regclass);
        v_old text := 'WHERE (o.misconception_code IS NOT NULL)';
begin
  if position(v_old in v_def) = 0 then
    raise exception 'the withdrawn ruling: service_cohort_misconceptions'' filter is not where it was';
  end if;
  execute 'create or replace view public.service_cohort_misconceptions as '
       || replace(v_def, v_old, v_old || ' AND (NOT public.dari_penugasan_ditarik(s.learning_assignment_id))');
end $$;

do $$
declare v_def text := pg_get_functiondef((select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                           where n.nspname = 'public' and p.proname = 'target_kelas'));
        v_old text := 'where aa.node_id = p_class and aa.status in (''OPEN'', ''CLOSED'');';
begin
  if position(v_old in v_def) = 0 then raise exception 'the withdrawn ruling: target_kelas''s filter is not where it was'; end if;
  execute replace(v_def, v_old,
    'where aa.node_id = p_class and aa.status in (''OPEN'', ''CLOSED'')'
    || E'\n       and not public.dari_penugasan_ditarik(aa.learning_assignment_id);  -- owner ruling (10 Nov)');
end $$;

-- ───────────────────────────────────────────── 2. a finished result stays seen

create or replace function public.my_learning_history()
returns table (learning_assignment_id uuid, course_id uuid, plp_release_id uuid, subject text, stage text,
               grade_label text, title text, pre_test_assignment uuid, post_test_assignment uuid, status text)
language sql stable security definer set search_path = public, pg_temp as $$
  select la.id, la.course_id, la.plp_release_id,
         c.subject, c.stage, c.grade_label, c.title,
         (select aa.id from public.assessment_assignments aa
            join public.assessment_definitions d on d.id = aa.assessment_definition_id
           where aa.learning_assignment_id = la.id and d.mode = 'PRE_TEST' limit 1),
         (select aa.id from public.assessment_assignments aa
            join public.assessment_definitions d on d.id = aa.assessment_definition_id
           where aa.learning_assignment_id = la.id and d.mode = 'POST_TEST' limit 1),
         la.status::text
    from public.learning_assignments la
    join public.courses c on c.id = la.course_id
   where la.status in ('ACTIVE', 'ENDED', 'WITHDRAWN')
     and exists (select 1 from public.enrollments e
                   join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
                   join public.org_nodes n on n.id = m.node_id
                  where e.person_id = public.current_person_id() and e.status = 'ACTIVE'
                    and (n.id = la.node_id or n.jalur @> array[la.node_id]))
$$;
revoke all on function public.my_learning_history() from public, anon;
grant execute on function public.my_learning_history() to authenticated, service_role;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('my_learning_history', 'LEARNER', 'what was and is assigned to the caller, with its status: a closed lesson''s outcome stays seen (10 Nov)');

do $$
declare f text; v_def text; v_old text := 'public.my_learning_assignments()';
begin
  foreach f in array array['my_cycle_state', 'learner_lessons'] loop
    v_def := pg_get_functiondef((select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                  where n.nspname = 'public' and p.proname = f));
    if position(v_old in v_def) = 0 then raise exception '% no longer reads my_learning_assignments', f; end if;
    execute replace(v_def, v_old, 'public.my_learning_history()');
  end loop;
end $$;

-- ───────────────────────────────────────────── 3. a sitting the school ended says so

do $$
declare v_def text := pg_get_functiondef('public.submit_session(uuid)'::regprocedure);
        v_old text := 'raise exception ''this session was ended and accepts no submission'';';
begin
  if position(v_old in v_def) = 0 then raise exception 'submit_session''s TERMINATED refusal is not where it was'; end if;
  execute replace(v_def, v_old,
    'raise exception using errcode = ''PR003'', detail = ''SESSION_ENDED_BY_SCHOOL'','
    || ' message = ''this session was ended and accepts no submission'';');
end $$;

-- ───────────────────────────────────────────── checks

do $$
begin
  if position('dari_penugasan_ditarik' in pg_get_viewdef('public.scoped_official_sessions'::regclass)) = 0
     or position('dari_penugasan_ditarik' in pg_get_viewdef('public.service_cohort_misconceptions'::regclass)) = 0 then
    raise exception 'the withdrawn ruling did not reach the figures';
  end if;
  if has_function_privilege('authenticated', 'public.dari_penugasan_ditarik(uuid)', 'execute') then
    raise exception 'dari_penugasan_ditarik is client-callable';
  end if;
  if public.current_metric_catalogue() is distinct from 'MC-10' then raise exception 'MC-10 is not the live catalogue'; end if;
  if (select count(*) from pg_proc p where p.proname in ('my_cycle_state', 'learner_lessons')
        and p.prosrc like '%my_learning_history()%') <> 2 then
    raise exception 'the read functions do not accept a closed lesson';
  end if;
  if (select count(*) from pg_proc p where p.proname in ('record_lesson_progress', 'may_read_lesson_media')
        and p.prosrc like '%my_learning_assignments()%') <> 2 then
    raise exception 'new work no longer requires an active assignment';
  end if;
end $$;

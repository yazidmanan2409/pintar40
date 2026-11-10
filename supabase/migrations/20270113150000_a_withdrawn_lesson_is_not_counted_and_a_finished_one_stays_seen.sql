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
-- 2. A FINISHED RESULT STAYS SEEN (defect). my_learning_assignments lists ACTIVE assignments only, and Hasil Belajar and
--    my_cycle_state read through it, so ending a lesson (its normal close) hid the learner's own finished result.
--    my_learning_history lists the learner's assignments that are ACTIVE, ENDED or WITHDRAWN, with their status, over
--    every Kelas the learner was in that year; my_cycle_state accepts it (corrected in place, see §2). Starting and recording work
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
--
-- CORRECTED IN PLACE (undeployed; Sharon's addendum on dc84af22, and the owner's two rulings of 10 Nov). Red first:
-- F38-W09..W12.
--   * A figure evaluated under a catalogue keeps that catalogue's population. metric_evaluate records the version it
--     evaluates (pintar.metric_catalogue, transaction-local, cleared on every exit as the boundary is); the exclusion
--     applies only under a catalogue that lists learning_assignments as a source (MC-10 and later). A reader outside
--     metric_evaluate (no version set) reads the live catalogue's population.
--   * The learner's own result (learner.result) keeps a withdrawn sitting and marks it (ditarik): it is kept, and it is
--     theirs; it is left out of every aggregate. metric_evaluate says so with pintar.ditarik_tampil for that calculator.
--   * Verified credentials (scoped_certificates) leave a withdrawn assignment's certificate out; the certificate itself
--     is not revoked and its public check is unchanged.
--   * Owner ruling (10 Nov): question health (service_item_statistics, service_distractor_uptake) leaves withdrawn
--     answers out; the answers and the exposure records are kept.

create or replace function public.dari_penugasan_ditarik(p_learning_assignment uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_learning_assignment is not null
     and exists (select 1 from public.learning_assignments la where la.id = p_learning_assignment and la.status = 'WITHDRAWN');
$$;
revoke all on function public.dari_penugasan_ditarik(uuid) from public, anon, authenticated;

-- whether a figure being computed now leaves this assignment's sittings out
create or replace function public.ditarik_dikecualikan(p_learning_assignment uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.dari_penugasan_ditarik(p_learning_assignment)
     and coalesce(current_setting('pintar.ditarik_tampil', true), '') <> 'ya'
     and (nullif(current_setting('pintar.metric_catalogue', true), '') is null
          or exists (select 1 from public.metric_sources m
                      where m.catalogue_version = current_setting('pintar.metric_catalogue', true)
                        and m.source_relation = 'learning_assignments'));
$$;
revoke all on function public.ditarik_dikecualikan(uuid) from public, anon, authenticated;

create or replace function public.sesi_ditarik_dikecualikan(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select public.ditarik_dikecualikan(x.learning_assignment_id) from public.assessment_sessions x where x.id = p_session), false);
$$;
revoke all on function public.sesi_ditarik_dikecualikan(uuid) from public, anon, authenticated;

create or replace function public.sesi_dari_penugasan_ditarik(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select public.dari_penugasan_ditarik(x.learning_assignment_id) from public.assessment_sessions x where x.id = p_session), false);
$$;
revoke all on function public.sesi_dari_penugasan_ditarik(uuid) from public, anon, authenticated;

create or replace view public.scoped_official_sessions as
  select s.id, s.person_id, s.institution_id, s.enrollment_id, s.academic_period_id,
         s.class_node_id, s.cohort_node_id, s.plp_release_id,
         s.assessment_definition_id, s.assessment_definition_version,
         s.engine_version, s.scoring_policy_version, s.evidence_channel, s.mode,
         s.status, s.started_at, s.submitted_at, s.finalized_at, s.created_at,
         -- Sharon (addendum): whether the sitting's assignment was withdrawn, so a learner's own result marks it from its
         -- declared source (a calculator reads no relation the catalogue does not name)
         public.sesi_dari_penugasan_ditarik(s.id) as ditarik
    from public.official_sessions s
   where public.row_in_metric_boundary(s.institution_id,
                                       coalesce(s.class_node_id, s.cohort_node_id), s.person_id)
     and public.row_in_learning_context(s.plp_release_id)
     -- owner ruling (10 Nov): a sitting of a withdrawn assignment is kept and not counted (under MC-10 and later)
     and not public.sesi_ditarik_dikecualikan(s.id);

do $$
declare v_def text := pg_get_viewdef('public.service_cohort_misconceptions'::regclass);
        v_old text := 'WHERE (o.misconception_code IS NOT NULL)';
begin
  if position(v_old in v_def) = 0 then
    raise exception 'the withdrawn ruling: service_cohort_misconceptions'' filter is not where it was';
  end if;
  execute 'create or replace view public.service_cohort_misconceptions as '
       || replace(v_def, v_old, v_old || ' AND (NOT public.ditarik_dikecualikan(s.learning_assignment_id))');
end $$;

do $$
declare v_def text := pg_get_functiondef((select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                           where n.nspname = 'public' and p.proname = 'target_kelas'));
        v_old text := 'where aa.node_id = p_class and aa.status in (''OPEN'', ''CLOSED'');';
begin
  if position(v_old in v_def) = 0 then raise exception 'the withdrawn ruling: target_kelas''s filter is not where it was'; end if;
  execute replace(v_def, v_old,
    'where aa.node_id = p_class and aa.status in (''OPEN'', ''CLOSED'')'
    || E'\n       and not public.ditarik_dikecualikan(aa.learning_assignment_id);  -- owner ruling (10 Nov)');
end $$;

-- verified credentials (Sharon's addendum): the certificate stays; the count leaves it out
do $$
declare v_def text := pg_get_viewdef('public.scoped_certificates'::regclass);
        v_old text := 'WHERE person_in_metric_boundary(institution_id, person_id);';
begin
  if position(v_old in v_def) = 0 then raise exception 'the withdrawn ruling: scoped_certificates'' filter is not where it was'; end if;
  execute 'create or replace view public.scoped_certificates as '
       || replace(v_def, v_old, 'WHERE person_in_metric_boundary(institution_id, person_id) AND NOT public.sesi_ditarik_dikecualikan(session_id);');
end $$;

-- question health (owner ruling, 10 Nov)
do $$
declare v_def text;
        v_old text := 'JOIN academic_responses r ON ((r.presented_item_id = p.id))';
        v_old2 text := 'JOIN academic_responses r ON (((r.presented_item_id = p.id) AND ((r.value ->> ''pilihan''::text) = o.label)))';
begin
  v_def := pg_get_viewdef('public.service_item_statistics'::regclass);
  if position(v_old in v_def) = 0 then raise exception 'service_item_statistics'' join is not where it was'; end if;
  execute 'create or replace view public.service_item_statistics as '
       || replace(v_def, v_old, 'JOIN academic_responses r ON ((r.presented_item_id = p.id) AND (NOT public.sesi_ditarik_dikecualikan(r.session_id)))');
  v_def := pg_get_viewdef('public.service_distractor_uptake'::regclass);
  if position(v_old2 in v_def) = 0 then raise exception 'service_distractor_uptake''s join is not where it was'; end if;
  execute 'create or replace view public.service_distractor_uptake as '
       || replace(v_def, v_old2, 'JOIN academic_responses r ON (((r.presented_item_id = p.id) AND ((r.value ->> ''pilihan''::text) = o.label)) AND (NOT public.sesi_ditarik_dikecualikan(r.session_id)))');
end $$;

-- metric_evaluate records the version it evaluates, and whether it is reading one learner's own result
do $$
declare v_def text := pg_get_functiondef((select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                           where n.nspname = 'public' and p.proname = 'metric_evaluate'));
        v_set text := 'perform set_config(''pintar.metric_boundary_person'', coalesce(v_bind_person::text, ''''), true);';
        v_clr text := 'perform set_config(''pintar.metric_boundary_person'', '''', true);';
begin
  if position(v_set in v_def) = 0 or position(v_clr in v_def) = 0 then
    raise exception 'metric_evaluate''s boundary is not where it was';
  end if;
  v_def := replace(v_def, v_set, v_set
    || E'\n    perform set_config(''pintar.metric_catalogue'', v_cat, true);  -- Sharon (addendum): the version evaluated'
    || E'\n    perform set_config(''pintar.ditarik_tampil'', case when d.calculation_key = ''learner_result'' then ''ya'' else '''' end, true);');
  v_def := replace(v_def, v_clr, v_clr
    || ' perform set_config(''pintar.metric_catalogue'', '''', true); perform set_config(''pintar.ditarik_tampil'', '''', true);');
  execute v_def;
end $$;

-- the learner's own result marks a withdrawn sitting
do $$
declare v_def text := pg_get_functiondef((select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                           where n.nspname = 'public' and p.proname = 'calc_learner_result'));
        v_old text := '''recomputation_reason'', x.recomputation_reason)';
        v_sel text := 's.finalized_at';
begin
  if position(v_old in v_def) = 0 or position(v_sel in v_def) = 0 then raise exception 'calc_learner_result''s row is not where it was'; end if;
  v_def := replace(v_def, v_old, '''recomputation_reason'', x.recomputation_reason, ''ditarik'', x.ditarik)');
  -- the inner select carries the sitting's own flag from scoped_official_sessions
  v_def := regexp_replace(v_def, 's\.finalized_at\s*FROM', 's.finalized_at, s.ditarik FROM');
  execute v_def;
end $$;

-- ───────────────────────────────────────────── 2. a finished result stays seen
--
-- CORRECTED IN PLACE (undeployed; Sharon's addendum on dc84af22). Red first: F38-W13.
--   * The outcome stays seen, not the content: learner_lessons stays on the learner's live assignments, so a closed or
--     withdrawn lesson's body, worked examples and media are not returned. Only my_cycle_state (which sittings, which
--     state) reads the history.
--   * The history follows the learner, not the current Kelas: every Kelas the learner was a member of in that
--     assignment's school year, so a lesson of last year stays listed after Kenaikan. kini says whether it is a Kelas the
--     learner is in now.

create or replace function public.my_learning_history()
returns table (learning_assignment_id uuid, course_id uuid, plp_release_id uuid, subject text, stage text,
               grade_label text, title text, pre_test_assignment uuid, post_test_assignment uuid, status text, kini boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select la.id, la.course_id, la.plp_release_id,
         c.subject, c.stage, c.grade_label, c.title,
         (select aa.id from public.assessment_assignments aa
            join public.assessment_definitions d on d.id = aa.assessment_definition_id
           where aa.learning_assignment_id = la.id and d.mode = 'PRE_TEST' limit 1),
         (select aa.id from public.assessment_assignments aa
            join public.assessment_definitions d on d.id = aa.assessment_definition_id
           where aa.learning_assignment_id = la.id and d.mode = 'POST_TEST' limit 1),
         la.status::text,
         exists (select 1 from public.enrollments e
                   join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
                   join public.org_nodes n on n.id = m.node_id
                  where e.person_id = public.current_person_id() and e.status = 'ACTIVE'
                    and (n.id = la.node_id or n.jalur @> array[la.node_id]))
    from public.learning_assignments la
    join public.courses c on c.id = la.course_id
   where la.status in ('ACTIVE', 'ENDED', 'WITHDRAWN')
     and exists (select 1 from public.enrollments e
                   join public.memberships m on m.enrollment_id = e.id
                   join public.org_nodes n on n.id = m.node_id
                  where e.person_id = public.current_person_id()
                    and m.academic_period_id is not distinct from la.academic_period_id
                    and (n.id = la.node_id or n.jalur @> array[la.node_id]))
$$;
revoke all on function public.my_learning_history() from public, anon;
grant execute on function public.my_learning_history() to authenticated, service_role;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('my_learning_history', 'LEARNER', 'what was and is assigned to the caller, with its status and whether it is a Kelas of theirs now: a closed lesson''s outcome stays seen (10 Nov)');

do $$
declare v_def text; v_old text := 'public.my_learning_assignments()';
begin
  v_def := pg_get_functiondef((select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                where n.nspname = 'public' and p.proname = 'my_cycle_state'));
  if position(v_old in v_def) = 0 then raise exception 'my_cycle_state no longer reads my_learning_assignments'; end if;
  execute replace(v_def, v_old, 'public.my_learning_history()');
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

-- ───────────────────────────────────────────── 4. a lesson no longer shared keeps its name
--
-- CORRECTED IN PLACE (undeployed; the owner on Sharon's addendum, 10 Nov). Red first: F38-W14. A Guru cannot read
-- PINTAR's course rows (courses_select is CAN_DRAFT in the course's own school), and distributed_releases names only
-- what is shared now, so an assignment of a lesson PINTAR stopped sharing was named nowhere. No assignment records a
-- title, so no storage is added: this returns, for one Kelas, each assignment's course title and nothing else (no
-- content, no outline), to whoever may give material at that school (CAN_ASSIGN_LEARNING), as the class page does.
-- The title is the course's current one.

create or replace function public.judul_materi_kelas(p_kelas uuid)
returns table (learning_assignment_id uuid, title text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  select n.institution_id into v_inst from public.org_nodes n where n.id = p_kelas;
  if v_inst is null or not public.can_in_institution('CAN_ASSIGN_LEARNING', v_inst) then
    raise exception using errcode = '42501', message = 'a Kelas''s lesson titles are for who may give material at its school';
  end if;
  return query
    select la.id, c.title from public.learning_assignments la join public.courses c on c.id = la.course_id
     where la.node_id = p_kelas and la.institution_id = v_inst;
end $$;
revoke all on function public.judul_materi_kelas(uuid) from public, anon;
grant execute on function public.judul_materi_kelas(uuid) to authenticated, service_role;
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('judul_materi_kelas', 'STAFF', 'the course title of each assignment of one Kelas, nothing else: a lesson no longer shared stays named (10 Nov)',
   'CAPABILITY', 'CAN_ASSIGN_LEARNING');

-- ───────────────────────────────────────────── checks

do $$
begin
  if position('sesi_ditarik_dikecualikan' in pg_get_viewdef('public.scoped_official_sessions'::regclass)) = 0
     or position('ditarik_dikecualikan' in pg_get_viewdef('public.service_cohort_misconceptions'::regclass)) = 0
     or position('sesi_ditarik_dikecualikan' in pg_get_viewdef('public.scoped_certificates'::regclass)) = 0
     or position('sesi_ditarik_dikecualikan' in pg_get_viewdef('public.service_item_statistics'::regclass)) = 0
     or position('sesi_ditarik_dikecualikan' in pg_get_viewdef('public.service_distractor_uptake'::regclass)) = 0 then
    raise exception 'the withdrawn ruling did not reach every figure';
  end if;
  if has_function_privilege('authenticated', 'public.dari_penugasan_ditarik(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.ditarik_dikecualikan(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.sesi_ditarik_dikecualikan(uuid)', 'execute') then
    raise exception 'a withdrawn-ruling helper is client-callable';
  end if;
  if public.current_metric_catalogue() is distinct from 'MC-10' then raise exception 'MC-10 is not the live catalogue'; end if;
  if (select count(*) from pg_proc p where p.proname = 'my_cycle_state' and p.prosrc like '%my_learning_history()%') <> 1
     or (select count(*) from pg_proc p where p.proname = 'learner_lessons' and p.prosrc like '%my_learning_history()%') <> 0 then
    raise exception 'the outcome, and only the outcome, of a closed lesson is read';
  end if;
  if (select count(*) from pg_proc p where p.proname in ('record_lesson_progress', 'may_read_lesson_media', 'learner_lessons')
        and p.prosrc like '%my_learning_assignments()%') <> 3 then
    raise exception 'new work or a lesson''s content no longer requires an active assignment';
  end if;
end $$;

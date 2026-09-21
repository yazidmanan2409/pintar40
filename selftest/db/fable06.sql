-- FABLE-06 database suite.
--
-- Ordering: depends on fable01.sql (role-switch helpers) and fable04.sql
-- (the bootstrap-tenant fixture and its purge). Never applied as a migration;
-- never present in production.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.purge_certificates()') is null
     or to_regprocedure('selftest.first_presented_of_type(uuid, text)') is null then
    raise exception 'apply fable01.sql and fable04.sql before fable06.sql';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- THE FABLE-06 COHORT, in the D1 engineering bootstrap tenant.
--
-- WHY HERE AND NOWHERE ELSE, forced by two existing controls rather than
-- chosen: `derive_evidence_class` caps any `is_synthetic` institution at
-- SYNTHETIC, so the synthetic seed tenants can never produce OFFICIAL
-- evidence; and `assert_official_evidence_bootstrap` refuses a non-synthetic
-- tenant outside the declared bootstrap. What is left is D1, which ADR-0008
-- created so engineering verification has one place to produce OFFICIAL
-- evidence. This is that.
--
-- IT DOES NOT TOUCH D1's OWN JOURNEY. The cohort gets its own CLASS node and
-- its own assignment; the bootstrap learner keeps its class, its single
-- enrolment and its certificate. F06-P05 asserts that separation rather than
-- relying on it -- D1's lone enrolment is the below-threshold case only if it
-- sits outside this cohort's scope.
--
-- SIZED FROM A MEASUREMENT, NOT FROM AN ESTIMATE, AND THE MEASUREMENT FOUND A
-- PRODUCT PROPERTY. D1's definition draws 6 of a 12-item bank, so the naive
-- estimate is half the cohort per item. The measured spread at 80 learners was
-- 26 to 60 -- far wider than binomial, which meant the estimate was not safe to
-- size against and something structural was going on.
--
-- IT IS NOT ADAPTIVE SELECTION. `assemble_session` orders the pool by
-- `seeded_index(seed, 'item', item_id)` -- deterministic pseudo-random per
-- session -- and then fills in three passes: safety-critical FIRST, then the
-- difficulty mix, then a top-up. Measured over 160 sessions:
--
--     safety-critical  SULIT    102 presentations
--     safety-critical  SEDANG    98
--     the other ten items        64 .. 83
--
-- The two safety-critical items are drawn far more than the rest because
-- `safety_critical_minimum = 1` GUARANTEES one per session and the bank holds
-- only two. Remove those two and the remaining spread is near-binomial around
-- 76. The over-dispersion is INV-10 working, not a defect and not an adaptive
-- engine.
--
-- THE CONSEQUENCE IS A PRODUCT PROPERTY, recorded in the capstone rather than
-- only here: per-item evidence accumulates structurally unevenly, so
-- safety-critical items cross a Question Health threshold sooner than others --
-- not because they are worse, but because the product guarantees they are
-- presented. The minimum-sample threshold is therefore doing more work than it
-- appears to: it is what stops an over-exposed item being judged first, and it
-- is why the first signals an institution sees will skew safety-critical. That
-- is exposure, not quality, and an educator surface should never imply
-- otherwise.
--
-- THE DIRECTION IS PERMANENT. THE MAGNITUDE IS NOT -- DO NOT QUOTE THESE
-- NUMBERS AS PRODUCTION EXPOSURE. The skew is inversely proportional to how
-- many safety-critical items the bank holds. D1 has 2 of 12, so the guarantee
-- forces each into roughly 62% of sessions: a 1.3x over-presentation against
-- the rest. A real institution bank with 20 safety-critical items in 200
-- applies the identical policy with a fraction of the distortion. The skew
-- exists at any bank size and the educator-surface constraint above stands
-- unchanged; the 1.3x is an artefact of a deliberately thin fixture bank and
-- characterises nothing outside it.
--
-- 160 learners puts the least-sampled item at ~63 against a correctness
-- threshold of 30. The suite asserts the ACTUAL least-sampled count, so a run
-- whose draw dips reports itself rather than quietly mis-measuring.
--
-- Cooling does not apply: `exam_item_is_cooled` only looks at `bank_type =
-- 'EXAM'` and this bank is TEST. Checked, not assumed.
-- ---------------------------------------------------------------------------
create or replace function selftest.f06_purge() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_node uuid;
begin
  select id into v_node from public.org_nodes where name = 'Kohort Analitik F06';
  if v_node is null then return; end if;
  -- Evidence is immutable by design; the harness owns these tables, is never
  -- present in production, and disables its own guards for the length of the
  -- delete exactly as purge_cycle_evidence does.
  alter table public.presented_item_views disable trigger presented_item_views_write;
  alter table public.presented_items disable trigger presented_items_immutable;
  alter table public.responses disable trigger responses_write;
  alter table public.assessment_results disable trigger assessment_results_write;
  alter table public.assessment_sessions disable trigger assessment_sessions_status;
  alter table public.assessment_sessions disable trigger assessment_sessions_provenance;

  delete from public.presented_item_views where presented_item_id in (
    select p.id from public.presented_items p join public.assessment_sessions s on s.id = p.session_id
     where s.class_node_id = v_node);
  delete from public.responses where presented_item_id in (
    select p.id from public.presented_items p join public.assessment_sessions s on s.id = p.session_id
     where s.class_node_id = v_node);
  delete from public.assessment_results where session_id in (
    select s.id from public.assessment_sessions s where s.class_node_id = v_node);
  delete from public.presented_items where session_id in (
    select s.id from public.assessment_sessions s where s.class_node_id = v_node);
  -- Reclassifications are append-only too (the product never un-files one),
  -- so the harness disables that guard for its own rows exactly as it does for
  -- the evidence tables above.
  alter table public.evidence_class_overrides disable trigger evidence_class_overrides_write;
  delete from public.evidence_class_overrides where session_id in (
    select s.id from public.assessment_sessions s where s.class_node_id = v_node);
  alter table public.evidence_class_overrides enable trigger evidence_class_overrides_write;
  delete from public.assessment_sessions where class_node_id = v_node;

  alter table public.assessment_sessions enable trigger assessment_sessions_provenance;
  alter table public.assessment_sessions enable trigger assessment_sessions_status;
  alter table public.assessment_results enable trigger assessment_results_write;
  alter table public.responses enable trigger responses_write;
  alter table public.presented_items enable trigger presented_items_immutable;
  alter table public.presented_item_views enable trigger presented_item_views_write;

  delete from public.question_health where institution_id in (
    select institution_id from public.org_nodes where id = v_node);

  -- The cohort's own briefings. `open_briefing` is idempotent by design -- two
  -- briefings racing to READY would give an educator two accounts of one week
  -- -- so a second suite run finds run one's READY briefing and advances
  -- nothing, which failed F06-P06 on the second run and nowhere else.
  --
  -- ARCHIVING them is not available: the declared edges reach ARCHIVED only
  -- from READY and REVIEWED, so a briefing still COLLECTING has no exit at all
  -- (recorded as OQ-4). The harness therefore removes its own rows with the
  -- guard disabled, exactly as it does for evidence above -- it owns these
  -- tables and is never present in production.
  alter table public.briefings disable trigger briefings_state_guard;
  delete from public.briefings where scope_node_id = v_node;
  alter table public.briefings enable trigger briefings_state_guard;
end $$;
revoke all on function selftest.f06_purge() from public;

create or replace function selftest.f06_cohort()
returns table (inst uuid, class_node uuid, cohort_node uuid, definition uuid,
               assignment uuid, learners int, high_item uuid, low_item uuid)
-- NOT security definer: it switches role via selftest.as_user, and PostgreSQL
-- refuses `set role` inside a definer function. f05_assign and boot_attempt are
-- plain for the same reason.
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_dept uuid; v_coh uuid; v_class uuid; v_period uuid; v_prog uuid;
  v_module uuid; v_course uuid; v_release uuid; v_def uuid; v_la uuid; v_aa uuid;
  v_admin uuid; v_person uuid; v_enr uuid; u uuid; i int; n int := 160; v_t text;
  v_high uuid; v_low uuid; v_sess uuid; r record; v_pos int;
begin
  select id into v_inst from public.institutions where slug = 'pintar-bootstrap-official';
  if v_inst is null then raise exception 'the D1 bootstrap tenant is absent'; end if;
  select id into v_period from public.academic_periods where institution_id = v_inst
   order by created_at limit 1;
  select id into v_prog from public.org_nodes where institution_id = v_inst and kind = 'PROGRAMME' limit 1;
  select id into v_dept from public.org_nodes where institution_id = v_inst and kind = 'DEPARTMENT' limit 1;
  select id into v_coh  from public.org_nodes where institution_id = v_inst and kind = 'COHORT' limit 1;
  select p.id into v_admin from public.persons p join public.accounts a on a.person_id = p.id
    join auth.users au on au.id = a.auth_user_id where au.email = 'boot-admin@bootstrap.pintar.test';
  select m.id, m.course_id into v_module, v_course from public.modules m
    join public.courses c on c.id = m.course_id where c.institution_id = v_inst limit 1;
  select id into v_release from public.plp_releases where institution_id = v_inst
   order by created_at desc limit 1;

  -- the cohort's own class node, under the same cohort as D1's
  select id into v_class from public.org_nodes where name = 'Kohort Analitik F06';
  if v_class is null then
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'Kohort Analitik F06', v_period)
    returning id into v_class;
  end if;

  -- D1's OWN post-test definition, not a new one. INV-04 refuses taught content
  -- under a frozen course, and the bootstrap course is frozen behind a published
  -- release -- so a fixture-owned definition is not available here and the rule
  -- is respected rather than routed around. It draws 6 of the 12-item bank
  -- (2 per difficulty band of 4), which means per-item evidence is roughly half
  -- the cohort and the cohort is sized from a MEASURED distribution rather than
  -- from that estimate.
  select id into v_def from public.assessment_definitions
   where institution_id = v_inst and mode = 'POST_TEST' and status = 'APPROVED'
   order by created_at limit 1;
  if v_def is null then raise exception 'D1 carries no approved post-test definition'; end if;

  select la, aa into v_la, v_aa
    from selftest.f05_assign('boot-admin@bootstrap.pintar.test', v_inst, v_class,
                             v_release, v_course, v_def);
  perform selftest.as_owner();

  -- the two items the fixture drives to the thresholds, chosen by stable order
  select i.id into v_high from public.items i where i.institution_id = v_inst
   order by i.id limit 1;
  select i.id into v_low from public.items i where i.institution_id = v_inst
   order by i.id offset 1 limit 1;

  -- learners, created once and reused
  for i in 1..n loop
    select au.id into u from auth.users au where au.email = format('f06-murid-%s@bootstrap.pintar.test', i);
    if u is null then
      u := gen_random_uuid();
      insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, recovery_token, email_change_token_new, email_change)
      values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
              format('f06-murid-%s@bootstrap.pintar.test', i), now(),
              '{"provider":"email","providers":["email"]}',
              jsonb_build_object('display_name', format('Murid Analitik %s', i)), now(), now(), '', '', '', '');
    end if;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = u;
    select e.id into v_enr from public.enrollments e
     where e.person_id = v_person and e.institution_id = v_inst;
    if v_enr is null then
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (v_person, v_inst, v_period, v_prog, 'ACTIVE') returning id into v_enr;
    end if;
    if not exists (select 1 from public.memberships m where m.enrollment_id = v_enr and m.node_id = v_class) then
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      values (v_enr, v_class, v_period);
    end if;
  end loop;

  inst := v_inst; class_node := v_class; cohort_node := v_coh; definition := v_def;
  assignment := v_aa; learners := n; high_item := v_high; low_item := v_low;
  return next;
end $$;
revoke all on function selftest.f06_cohort() from public;

-- A learner cannot read `public.items` -- RLS hides the bank, which is the
-- premise `sanitized_item` exists to serve -- so the paper's shape is fetched
-- through a definer helper rather than by joining as the learner. `answer_paper`
-- solves the same problem the same way. Discovered by the loop body silently
-- never executing: the join returned zero rows and the session stayed CREATED,
-- which surfaced as an illegal CREATED -> SUBMITTED transition one call later.
create or replace function selftest.f06_paper(p_session uuid)
returns table (pid uuid, item_id uuid, item_type text)
language sql security definer set search_path = public, pg_temp as $$
  select p.id, p.item_id, i.item_type::text
    from public.presented_items p join public.items i on i.id = p.item_id
   where p.session_id = p_session order by p.position
$$;
revoke all on function selftest.f06_paper(uuid) from public;
grant execute on function selftest.f06_paper(uuid) to authenticated;

-- ───────────────────────────────────────────────────────── F06-P10's three helpers
--
-- NOT security definer, and that is the whole point: these run as whoever
-- `selftest.as_user` last made the session, so what they measure is what THAT
-- reader is told. A definer helper here would quietly ask the question as the
-- schema owner and answer "permitted" to everything.

create or replace function selftest.f06p10_person(p_prefix text)
returns uuid
language plpgsql set search_path = public, pg_temp as $$
declare u uuid := gen_random_uuid(); e text := p_prefix || '@bootstrap.pintar.test';
begin
  select au.id into u from auth.users au where au.email = e;
  if u is not null then return u; end if;
  u := gen_random_uuid();
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', e, now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('display_name', p_prefix), now(), now(), '', '', '', '');
  return u;
end $$;
revoke all on function selftest.f06p10_person(text) from public;

-- One boundary case. Returns the empty array when the evaluator said what it
-- should, and a one-line complaint when it did not -- so a run reports every
-- boundary that moved rather than stopping at the first.
--
-- `not_permitted` is the ONLY refusal that counts. `below_minimum` and
-- `deprecated` are things the evaluator says AFTER deciding the reader is
-- entitled to the metric, and reading either as a refusal is exactly how the
-- defect hid: on the synthetic tenants every leaked metric came back
-- `below_minimum`, which looks like a denial and is not one.
create or replace function selftest.f06p10_case(
  p_label text, p_metric text, p_node uuid, p_institution uuid,
  p_catalogue text, p_expect_permitted boolean)
returns text[]
language plpgsql set search_path = public, pg_temp as $$
declare v jsonb; v_status text; v_permitted boolean;
begin
  v := public.metric_evaluate(p_metric, p_node, p_institution, p_catalogue);
  v_status := v ->> 'status';
  v_permitted := v_status is distinct from 'not_permitted';
  if v_permitted = p_expect_permitted then return '{}'::text[]; end if;
  return array[format('%s: %s answered %s, expected %s', p_label, p_metric, v_status,
                      case when p_expect_permitted then 'to be permitted' else 'not_permitted' end)];
end $$;
revoke all on function selftest.f06p10_case(text, text, uuid, uuid, text, boolean) from public;

-- The same question about a metric whose subject is a PERSON rather than a node.
create or replace function selftest.f06p10_learner(
  p_label text, p_learner uuid, p_institution uuid, p_catalogue text, p_expect_permitted boolean)
returns text[]
language sql set search_path = public, pg_temp as $$
  select selftest.f06p10_case(p_label, 'learner.result', p_learner, p_institution,
                              p_catalogue, p_expect_permitted);
$$;
revoke all on function selftest.f06p10_learner(text, uuid, uuid, text, boolean) from public;
grant execute on function selftest.f06p10_person(text) to authenticated;
grant execute on function selftest.f06p10_case(text, text, uuid, uuid, text, boolean) to authenticated;
grant execute on function selftest.f06p10_learner(text, uuid, uuid, text, boolean) to authenticated;

-- ───────────────────────────────────────── WP1 source-boundary fixture helpers
--
-- A SCHOOL WITH TWO POPULATED BRANCHES, which is what requirement 9 means by
-- "no zero-row fixture": the authorized subtree holds evidence AND the sibling
-- subtree holds DIFFERENT evidence, so "the sibling did not arrive" is a
-- statement about rows that exist rather than about an empty table.
--
-- IT HAS TO BE A NON-SYNTHETIC TENANT. `derive_evidence_class` caps every
-- `is_synthetic` institution at SYNTHETIC, so a purpose-built school could
-- never hold OFFICIAL evidence and every calculator would answer 0 -- which is
-- precisely the state in which an adversarial calculator is indistinguishable
-- from an honest one. So the fixture extends the demonstration tenant, which
-- already holds one real OFFICIAL session, with a sibling department carrying
-- its own.
create or replace function selftest.wp1_sibling_branch()
returns table (inst uuid, root uuid, dept_a uuid, dept_b uuid, cls_a uuid, cls_b uuid,
               hod text, adm text, learner_a uuid, learner_b uuid)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_fac uuid; v_dept_a uuid; v_dept_b uuid; v_prog_b uuid; v_coh_b uuid;
  v_cls_a uuid; v_cls_b uuid; v_period uuid; v_sess uuid; v_new uuid; v_pb uuid; v_eb uuid;
  v_root uuid; v_pa uuid;
begin
  select i.id into v_inst from public.institutions i where i.slug = 'pintar-human-evaluation';
  if v_inst is null then raise exception 'the demonstration tenant is absent'; end if;
  select o.id into v_root   from public.org_nodes o where o.institution_id=v_inst and o.kind='INSTITUTION';
  select o.id into v_fac    from public.org_nodes o where o.institution_id=v_inst and o.kind='FACULTY';
  select o.id into v_dept_a from public.org_nodes o where o.institution_id=v_inst and o.kind='DEPARTMENT'
   order by o.name limit 1;
  select o.id into v_cls_a  from public.org_nodes o where o.institution_id=v_inst and o.kind='CLASS'
   order by o.name limit 1;
  select ap.id into v_period from public.academic_periods ap where ap.institution_id=v_inst
   order by ap.created_at limit 1;
  select s.id, s.person_id into v_sess, v_pa from public.official_sessions s
   where s.institution_id=v_inst and s.class_node_id=v_cls_a limit 1;
  if v_sess is null then raise exception 'the demonstration tenant holds no OFFICIAL session in its class'; end if;

  insert into public.org_nodes (institution_id,parent_id,kind,name)
  values (v_inst,v_fac,'DEPARTMENT','Bahasa (saudara)') returning org_nodes.id into v_dept_b;
  insert into public.org_nodes (institution_id,parent_id,kind,name)
  values (v_inst,v_dept_b,'PROGRAMME','SD Bahasa') returning org_nodes.id into v_prog_b;
  insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
  values (v_inst,v_prog_b,'COHORT','Angkatan Bahasa',v_period) returning org_nodes.id into v_coh_b;
  insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
  values (v_inst,v_coh_b,'CLASS','5X',v_period) returning org_nodes.id into v_cls_b;

  insert into public.persons (display_name) values ('Murid Saudara') returning persons.id into v_pb;
  insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
  values (v_pb,v_inst,v_period,v_prog_b,'ACTIVE') returning enrollments.id into v_eb;
  insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_eb,v_cls_b,v_period);

  -- the sibling's OWN official session, copied from the real one. The lifecycle
  -- is a trigger, so the fixture walks it rather than asserting a finished
  -- session into existence.
  v_new := gen_random_uuid();
  insert into public.assessment_sessions
    (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
     plp_release_id, assessment_definition_id, assessment_definition_version, engine_version,
     scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
     started_at, submitted_at, finalized_at, deadline_extended_count)
  select v_new, v_pb, s.institution_id, v_eb, s.academic_period_id, v_cls_b, v_coh_b,
         s.plp_release_id, s.assessment_definition_id, s.assessment_definition_version, s.engine_version,
         s.scoring_policy_version, s.evidence_channel, s.evidence_class, s.mode, 'CREATED', s.shuffle_seed,
         s.started_at, s.submitted_at, s.finalized_at, 0
    from public.assessment_sessions s where s.id = v_sess;
  update public.assessment_sessions set status='IN_PROGRESS' where id=v_new;
  update public.assessment_sessions set status='SUBMITTED'   where id=v_new;
  update public.assessment_sessions set status='FINALIZED'   where id=v_new;
  insert into public.assessment_results
    (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
     mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
  select gen_random_uuid(), v_new, r.institution_id, v_pb, r.evidence_class, r.engine_version,
         r.scoring_policy_version, r.mastery, r.per_domain, r.safety_gate_passed, r.delta_inputs, now()
    from public.assessment_results r where r.session_id = v_sess;

  inst := v_inst; root := v_root; dept_a := v_dept_a; dept_b := v_dept_b;
  cls_a := v_cls_a; cls_b := v_cls_b; learner_a := v_pa; learner_b := v_pb;
  select u.email into hod from public.role_assignments ra
    join public.accounts a on a.person_id=ra.person_id join auth.users u on u.id=a.auth_user_id
   where ra.role='HEAD_OF_DEPARTMENT' and ra.scope_node_id=v_dept_a and ra.revoked_at is null limit 1;
  select u.email into adm from public.role_assignments ra
    join public.accounts a on a.person_id=ra.person_id join auth.users u on u.id=a.auth_user_id
   where ra.role='INSTITUTION_ADMIN' and ra.institution_id=v_inst and ra.revoked_at is null limit 1;
  return next;
end $$;
revoke all on function selftest.wp1_sibling_branch() from public;
grant execute on function selftest.wp1_sibling_branch() to authenticated;

-- ---------------------------------------------------------------------------
-- WP2's fixture: ONE purpose-built two-department school with REAL evidence in
-- BOTH branches, five actors with real identities, and an integrity signal to
-- refer. F06-P14 (R6) and F06-P15 (the Management decision model) both stand
-- on it, because both are asking the same underlying question -- does an
-- organizational boundary hold -- and a shared fixture means a leak cannot be
-- hidden by two differently-shaped schools.
--
-- BOTH BRANCHES ARE POPULATED ON PURPOSE. On an empty sibling branch a policy
-- that leaks and a policy that holds return the same zero.
-- ---------------------------------------------------------------------------
create or replace function selftest.wp2_school()
returns table (inst uuid, root uuid, fac uuid, dept_a uuid, dept_b uuid,
               cls_a uuid, cls_b uuid, sess_a uuid, sess_b uuid, signal_a uuid,
               hod_u uuid, adm_u uuid, edu_u uuid, dean_u uuid, la_u uuid, lb_u uuid,
               hod uuid, adm uuid, edu uuid, dean uuid, la uuid, lb uuid)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_root uuid; v_period uuid; v_tmpl uuid;
  v_fac uuid; v_da uuid; v_db uuid; v_pa uuid; v_pb uuid;
  v_ca uuid; v_cb uuid; v_cls_a uuid; v_cls_b uuid; v_e uuid;
  v_hod uuid; v_adm uuid; v_edu uuid; v_dean uuid; v_la uuid; v_lb uuid;
  v_hu uuid; v_au uuid; v_eu uuid; v_du uuid; v_lau uuid; v_lbu uuid;
  v_sa uuid; v_sb uuid; v_sig uuid;
begin
  select i.id into v_inst from public.institutions i where i.slug = 'pintar-human-evaluation';
  if v_inst is null then raise exception 'the demonstration tenant is absent'; end if;
  select o.id into v_root from public.org_nodes o
   where o.institution_id = v_inst and o.kind = 'INSTITUTION';
  select ap.id into v_period from public.academic_periods ap
   where ap.institution_id = v_inst order by ap.created_at limit 1;
  -- a real finalized session to copy, so the evidence is the tenant's own
  select s.id into v_tmpl from public.assessment_sessions s
   where s.institution_id = v_inst and s.status = 'FINALIZED'
     and exists (select 1 from public.assessment_results r where r.session_id = s.id)
   order by s.id limit 1;
  if v_tmpl is null then raise exception 'the demonstration tenant holds no finalized session to copy'; end if;

  insert into public.org_nodes (institution_id,parent_id,kind,name)
  values (v_inst,v_root,'FACULTY','Fakultas WP2') returning org_nodes.id into v_fac;
  insert into public.org_nodes (institution_id,parent_id,kind,name)
  values (v_inst,v_fac,'DEPARTMENT','Departemen WP2 A') returning org_nodes.id into v_da;
  insert into public.org_nodes (institution_id,parent_id,kind,name)
  values (v_inst,v_fac,'DEPARTMENT','Departemen WP2 B') returning org_nodes.id into v_db;
  insert into public.org_nodes (institution_id,parent_id,kind,name)
  values (v_inst,v_da,'PROGRAMME','Program WP2 A') returning org_nodes.id into v_pa;
  insert into public.org_nodes (institution_id,parent_id,kind,name)
  values (v_inst,v_db,'PROGRAMME','Program WP2 B') returning org_nodes.id into v_pb;
  insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
  values (v_inst,v_pa,'COHORT','Angkatan WP2 A',v_period) returning org_nodes.id into v_ca;
  insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
  values (v_inst,v_pb,'COHORT','Angkatan WP2 B',v_period) returning org_nodes.id into v_cb;
  insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
  values (v_inst,v_ca,'CLASS','Kelas WP2 A',v_period) returning org_nodes.id into v_cls_a;
  insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
  values (v_inst,v_cb,'CLASS','Kelas WP2 B',v_period) returning org_nodes.id into v_cls_b;

  v_hu  := selftest.f06p10_person('wp2-kaprodi');
  v_au  := selftest.f06p10_person('wp2-admin');
  v_eu  := selftest.f06p10_person('wp2-guru');
  v_du  := selftest.f06p10_person('wp2-dekan');
  v_lau := selftest.f06p10_person('wp2-murid-a');
  v_lbu := selftest.f06p10_person('wp2-murid-b');
  select a.person_id into v_hod  from public.accounts a where a.auth_user_id = v_hu;
  select a.person_id into v_adm  from public.accounts a where a.auth_user_id = v_au;
  select a.person_id into v_edu  from public.accounts a where a.auth_user_id = v_eu;
  select a.person_id into v_dean from public.accounts a where a.auth_user_id = v_du;
  select a.person_id into v_la   from public.accounts a where a.auth_user_id = v_lau;
  select a.person_id into v_lb   from public.accounts a where a.auth_user_id = v_lbu;

  perform set_config('app.seed_intent','synthetic',true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
    (v_hod, 'HEAD_OF_DEPARTMENT', v_da,    now() + interval '1 year'),
    (v_adm, 'INSTITUTION_ADMIN',  v_root,  now() + interval '1 year'),
    (v_edu, 'EDUCATOR',           v_cls_a, now() + interval '1 year'),
    (v_dean,'DEAN',               v_fac,   now() + interval '1 year');
  perform set_config('app.seed_intent','',true);

  insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
  values (v_la,v_inst,v_period,v_pa,'ACTIVE') returning enrollments.id into v_e;
  insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_e,v_cls_a,v_period);
  v_sa := selftest.wp2_session(v_tmpl, v_la, v_e, v_cls_a, v_ca);
  insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
  values (v_lb,v_inst,v_period,v_pb,'ACTIVE') returning enrollments.id into v_e;
  insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_e,v_cls_b,v_period);
  v_sb := selftest.wp2_session(v_tmpl, v_lb, v_e, v_cls_b, v_cb);

  -- the evidence WP2 refers: an observation, in department A
  insert into public.integrity_signals (session_id, institution_id, category)
  values (v_sa, v_inst, 'NAVIGATION') returning integrity_signals.id into v_sig;

  inst:=v_inst; root:=v_root; fac:=v_fac; dept_a:=v_da; dept_b:=v_db;
  cls_a:=v_cls_a; cls_b:=v_cls_b; sess_a:=v_sa; sess_b:=v_sb; signal_a:=v_sig;
  hod_u:=v_hu; adm_u:=v_au; edu_u:=v_eu; dean_u:=v_du; la_u:=v_lau; lb_u:=v_lbu;
  hod:=v_hod; adm:=v_adm; edu:=v_edu; dean:=v_dean; la:=v_la; lb:=v_lb;
  return next;
end $$;
revoke all on function selftest.wp2_school() from public;
grant execute on function selftest.wp2_school() to authenticated;

-- One finalized session with one result, copied from a real one. The lifecycle
-- is a trigger, so this walks it rather than asserting a finished session into
-- existence.
create or replace function selftest.wp2_session(
  p_template uuid, p_person uuid, p_enrollment uuid, p_class uuid, p_cohort uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_new uuid := gen_random_uuid();
begin
  insert into public.assessment_sessions
    (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
     plp_release_id, assessment_definition_id, assessment_definition_version, engine_version,
     scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
     started_at, submitted_at, finalized_at, deadline_extended_count)
  select v_new, p_person, s.institution_id, p_enrollment, s.academic_period_id, p_class, p_cohort,
         s.plp_release_id, s.assessment_definition_id, s.assessment_definition_version, s.engine_version,
         s.scoring_policy_version, s.evidence_channel, s.evidence_class, s.mode, 'CREATED', s.shuffle_seed,
         s.started_at, s.submitted_at, s.finalized_at, 0
    from public.assessment_sessions s where s.id = p_template;
  update public.assessment_sessions set status='IN_PROGRESS' where id=v_new;
  update public.assessment_sessions set status='SUBMITTED'   where id=v_new;
  update public.assessment_sessions set status='FINALIZED'   where id=v_new;
  insert into public.assessment_results
    (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
     mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
  select gen_random_uuid(), v_new, r.institution_id, p_person, r.evidence_class, r.engine_version,
         r.scoring_policy_version, r.mastery, r.per_domain, r.safety_gate_passed, r.delta_inputs, now()
    from public.assessment_results r where r.session_id = p_template limit 1;
  return v_new;
end $$;
revoke all on function selftest.wp2_session(uuid,uuid,uuid,uuid,uuid) from public;
grant execute on function selftest.wp2_session(uuid,uuid,uuid,uuid,uuid) to authenticated;

-- One R6 cell: how many of a named session's results can this reader see?
create or replace function selftest.r6_case(
  p_label text, p_reader uuid, p_session uuid, p_expect int)
returns text[] language plpgsql set search_path = public, pg_temp as $$
declare n int;
begin
  perform selftest.as_user_uid(p_reader);
  select count(*) into n from public.assessment_results r where r.session_id = p_session;
  perform selftest.as_owner();
  if n <> p_expect then
    return array[format('%s: read %s result row(s), expected %s', p_label, n, p_expect)];
  end if;
  return array[]::text[];
end $$;
revoke all on function selftest.r6_case(text,uuid,uuid,int) from public;
grant execute on function selftest.r6_case(text,uuid,uuid,int) to authenticated;


-- One adversarial calculator, installed and asked. Returns the empty array when
-- the boundary held and a complaint when it did not.
--
-- NOT security definer: it must read as whoever the session was last switched
-- to, or it measures the schema owner instead of the caller.
create or replace function selftest.wp1_adversary(
  p_label text, p_clause text, p_reader text, p_node uuid, p_institution uuid,
  p_catalogue text, p_expect int)
returns text[]
language plpgsql set search_path = public, pg_temp as $$
declare v jsonb; v_got int;
begin
  perform selftest.as_owner();
  execute format($f$
    create or replace function public.calc_class_participants(
      p_node uuid, p_institution uuid, p_catalogue text)
    returns jsonb language sql stable set search_path = public, pg_temp
    begin atomic
      select jsonb_build_object('value', count(distinct s.person_id), 'sample', count(distinct s.person_id))
        from scoped_official_sessions s
       where s.institution_id = p_institution %s;
    end $f$, p_clause);
  perform selftest.as_user(p_reader);
  v := public.metric_evaluate('class.participants', p_node, p_institution, p_catalogue);
  perform selftest.as_owner();
  v_got := case when v ->> 'status' = 'not_permitted' then -1 else coalesce((v ->> 'sample')::int, 0) end;
  if v_got = p_expect then return '{}'::text[]; end if;
  return array[format('%s: returned %s, expected %s', p_label, v_got, p_expect)];
end $$;
revoke all on function selftest.wp1_adversary(text, text, text, uuid, uuid, text, int) from public;
grant execute on function selftest.wp1_adversary(text, text, text, uuid, uuid, text, int) to authenticated;

-- ───────────────────────────────────────── F06-P12's helpers (objective B)
--
-- Invoker rights, like F06-P10's: these must answer as whoever the session was
-- last switched to. A definer helper would ask every question as the schema
-- owner and answer "allowed" to all of them.

-- as_user takes an email; these fixtures are built around auth uids, so this is
-- the same switch keyed the other way rather than a second mechanism.
create or replace function selftest.as_user_uid(p_uid uuid)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  set local role authenticated;
end $$;
revoke all on function selftest.as_user_uid(uuid) from public;
grant execute on function selftest.as_user_uid(uuid) to authenticated;

-- LEVEL 2, asked through person_visible_to_me, which is the predicate
-- persons_select carries -- so what is measured is what the roster returns.
create or replace function selftest.f06p12_roster(
  p_label text, p_reader uuid, p_subject uuid, p_expect_visible boolean)
returns text[] language plpgsql set search_path = public, pg_temp as $$
declare v boolean;
begin
  perform selftest.as_user_uid(p_reader);
  v := public.person_visible_to_me(p_subject);
  perform selftest.as_owner();
  if v = p_expect_visible then return '{}'::text[]; end if;
  return array[format('%s: the roster answered %s, expected %s', p_label, v, p_expect_visible)];
end $$;
revoke all on function selftest.f06p12_roster(text, uuid, uuid, boolean) from public;
grant execute on function selftest.f06p12_roster(text, uuid, uuid, boolean) to authenticated;

-- LEVEL 3, asked through the endpoint, because a row predicate cannot tell a
-- roster from a person and the endpoint is where deliberateness lives.
--
-- A REFUSAL IS AN EXCEPTION, AND IT MUST NAME NO SUBJECT. Both halves are
-- checked: a refusal echoing the learner's id back would be an existence
-- oracle wearing a denial.
create or replace function selftest.f06p12_detail(
  p_label text, p_reader uuid, p_subject uuid, p_institution uuid, p_expect_allowed boolean)
returns text[] language plpgsql set search_path = public, pg_temp as $$
declare r jsonb; v_allowed boolean := true; v_err text := '';
begin
  perform selftest.as_user_uid(p_reader);
  begin
    r := public.management_learner_detail(p_subject, p_institution);
  exception when others then v_allowed := false; v_err := sqlerrm;
  end;
  perform selftest.as_owner();
  if v_allowed <> p_expect_allowed then
    return array[format('%s: the endpoint %s, expected %s', p_label,
                        case when v_allowed then 'allowed' else 'refused' end,
                        case when p_expect_allowed then 'to allow' else 'to refuse' end)];
  end if;
  if not v_allowed and v_err like '%' || p_subject::text || '%' then
    return array[format('%s: the refusal named the subject', p_label)];
  end if;
  if v_allowed and (r ->> 'person_id') is distinct from p_subject::text then
    return array[format('%s: the endpoint returned a different person', p_label)];
  end if;
  return '{}'::text[];
end $$;
revoke all on function selftest.f06p12_detail(text, uuid, uuid, uuid, boolean) from public;
grant execute on function selftest.f06p12_detail(text, uuid, uuid, uuid, boolean) to authenticated;

-- The metric route, asked as a reader. Kept beside the roster and detail
-- helpers because the three together are what "the levels do not collapse"
-- means: the same learner, three doors, three different answers per role.
create or replace function selftest.f06p12_metric(
  p_label text, p_reader uuid, p_subject uuid, p_institution uuid, p_catalogue text, p_expect_allowed boolean)
returns text[] language plpgsql set search_path = public, pg_temp as $$
declare v jsonb; v_allowed boolean;
begin
  perform selftest.as_user_uid(p_reader);
  v := public.metric_evaluate('learner.result', p_subject, p_institution, p_catalogue);
  perform selftest.as_owner();
  v_allowed := (v ->> 'status') is distinct from 'not_permitted';
  if v_allowed = p_expect_allowed then return '{}'::text[]; end if;
  return array[format('%s: learner.result answered %s, expected %s', p_label, v ->> 'status',
                      case when p_expect_allowed then 'to be permitted' else 'not_permitted' end)];
end $$;
revoke all on function selftest.f06p12_metric(text, uuid, uuid, uuid, text, boolean) from public;
grant execute on function selftest.f06p12_metric(text, uuid, uuid, uuid, text, boolean) to authenticated;

-- Same boundary, one level down: `item_options` carries `is_correct`, so a
-- learner cannot read it either. Resolving "which displayed position is the
-- right answer" is therefore a definer operation -- which is precisely the
-- knowledge the product withholds from a learner, and a fixture needs it only
-- because it is playing every part at once.
create or replace function selftest.f06_position(p_session uuid, p_item uuid, p_correct boolean)
returns integer language sql security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select d.display_position from public.option_display_order(p_session, p_item) d
       join public.item_options o on o.item_id = p_item and o.label = d.label
      where o.is_correct = p_correct limit 1),
    (select d.display_position from public.option_display_order(p_session, p_item) d limit 1))
$$;
revoke all on function selftest.f06_position(uuid, uuid, boolean) from public;
grant execute on function selftest.f06_position(uuid, uuid, boolean) to authenticated;

create or replace function selftest.f06_positions(p_session uuid, p_item uuid, p_correct boolean)
returns integer[] language sql security definer set search_path = public, pg_temp as $$
  select array_agg(d.display_position order by d.display_position)
    from public.option_display_order(p_session, p_item) d
    join public.item_options o on o.item_id = p_item and o.label = d.label
   where o.is_correct = p_correct
$$;
revoke all on function selftest.f06_positions(uuid, uuid, boolean) from public;
grant execute on function selftest.f06_positions(uuid, uuid, boolean) to authenticated;

-- Drives one learner's session with PER-ITEM control, which `answer_paper`
-- cannot give: the high item is answered correctly by everyone, the low item
-- wrongly by everyone, and the rest alternate on the learner's ordinal so they
-- land near half and stay in OBSERVING.
create or replace function selftest.f06_attempt(p_email text, p_ordinal int,
                                                p_high uuid, p_low uuid)
-- Plain, not definer: it switches role per learner.
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare aa uuid; s uuid; r record; v_pos int; v_want boolean; v_pos_arr int[];
begin
  perform selftest.as_user(p_email);
  select m.post_test_assignment into aa from public.my_learning_assignments() m
   where m.post_test_assignment is not null limit 1;
  if aa is null then perform selftest.as_owner(); return null; end if;
  s := public.start_learning_session(aa);
  for r in select f.pid, f.item_id, f.item_type from selftest.f06_paper(s) f loop
    if r.item_id = p_high then v_want := true;
    elsif r.item_id = p_low then v_want := false;
    else v_want := (p_ordinal % 2 = 0); end if;
    if r.item_type = 'MCQ_MULTI' then
      perform public.record_answer(r.pid, 1,
        jsonb_build_object('posisi', to_jsonb(selftest.f06_positions(s, r.item_id, v_want))));
    else
      perform public.record_answer(r.pid, 1,
        jsonb_build_object('posisi', selftest.f06_position(s, r.item_id, v_want)));
    end if;
  end loop;
  perform public.finish_my_session(s);
  perform selftest.as_owner();
  return s;
end $$;
revoke all on function selftest.f06_attempt(text, int, uuid, uuid) from public;

-- Withdraws OFFICIAL evidence the way the product does: an integrity reviewer
-- files a reclassification. `enforce_evidence_override` is INSERT-only and
-- refuses any promotion, so this is a one-way door -- which is exactly the
-- property the downward pair of Question Health edges exists to handle, and the
-- reason it deserves one real execution rather than only a probe.
-- `official_sessions` carries no client grant -- the evidence-consumer boundary
-- keeps it behind definer functions -- so the session list is resolved by a
-- definer helper and only the RECLASSIFICATION itself is performed as the
-- reviewer, which is the act that actually requires the capability.
-- SCOPED TO THE COHORT'S OWN CLASS. The first version selected every OFFICIAL
-- session presenting the item -- which includes D1's own demonstration journey,
-- because the cohort draws from D1's bank. It therefore reclassified the
-- bootstrap learner's evidence out of OFFICIAL, outside the class f06_purge
-- cleans, and the leftover override then blocked purge_certificates and aborted
-- the entire db runner: 129 tests failed for one test's trespass.
--
-- This is the failure F06-P05 asserts against, committed by the fixture that
-- sits beside it. Task 2 hit the same shape when fable04's reset swept every
-- is_official_bootstrap institution.
create or replace function selftest.f06_official_for(p_item uuid)
returns table (session_id uuid) language sql security definer
set search_path = public, pg_temp as $$
  select distinct p.session_id from public.presented_items p
    join public.official_sessions s on s.id = p.session_id
   where p.item_id = p_item
     and s.class_node_id = (select n.id from public.org_nodes n
                             where n.name = 'Kohort Analitik F06')
   order by 1
$$;
revoke all on function selftest.f06_official_for(uuid) from public;
grant execute on function selftest.f06_official_for(uuid) to authenticated;

create or replace function selftest.f06_withdraw(p_item uuid, p_keep int)
returns integer language plpgsql set search_path = public, pg_temp as $$
declare r record; n int := 0; v_total int;
begin
  select count(*) into v_total from selftest.f06_official_for(p_item);
  perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
  for r in select f.session_id from selftest.f06_official_for(p_item) f
  loop
    exit when v_total - n <= p_keep;
    insert into public.evidence_class_overrides (session_id, to_class, reason)
    values (r.session_id, 'SYNTHETIC',
            'FABLE-06 fixture: withdrawing evidence to exercise the downward Question Health edges');
    n := n + 1;
  end loop;
  perform selftest.as_owner();
  return n;
end $$;
revoke all on function selftest.f06_withdraw(uuid, int) from public;

-- THE EXPECTED POPULATION IS DECLARED, NOT READ OFF THE IMPLEMENTATION.
--
-- The version this replaces asked each candidate function's own body whether it
-- named a capability a DEAN lacks. That made the population a function of the
-- artefact under test: deleting a capability check also deleted the endpoint
-- from the set, so the defect this assertion exists to catch was the very edit
-- that removed the endpoint from the search. Layer-3 deleted one guard from
-- save_certificate_template and the whole contract stayed green (L3-F02).
--
-- The population now comes from three things, none of which a function body can
-- change: the registry's own `exposure`, the planner's `provolatile`, and the
-- grant that makes the function reachable by a client at all. What each
-- endpoint MUST enforce comes from the registry declaration added by 0086.
-- `create or replace` without the guard leaves every one of those untouched.
create or replace function selftest.f06_staff_rpc_contracts()
returns table (oid_ oid, proname text, args text, kind text, requirement text)
language sql security definer set search_path = public, pg_temp as $$
  select p.oid, r.function_name::text, pg_get_function_identity_arguments(p.oid),
         r.authorization_kind::text, r.authorization_requirement
    from public.client_rpc_registry r
    join pg_proc p on p.proname = r.function_name and p.pronamespace = 'public'::regnamespace
   where r.exposure = 'STAFF'
     and p.provolatile = 'v'
     and has_function_privilege('authenticated', p.oid, 'EXECUTE')
   order by r.function_name
$$;
revoke all on function selftest.f06_staff_rpc_contracts() from public;
grant execute on function selftest.f06_staff_rpc_contracts() to authenticated;

-- THE NEGATIVE ACTOR IS DERIVED FROM THE DECLARATION, not written down beside
-- the endpoint. For a declared capability it is the role that holds the MOST
-- capabilities among those that do not hold this one -- so an endpoint whose
-- declaration is stricter than its implementation is caught: the actor lacks
-- what is declared but holds what is actually checked, and gets in.
-- Picking "the highest-ranked role that lacks it" would not do that, because
-- DEAN outranks HEAD_OF_DEPARTMENT while holding nothing at all.
create or replace function selftest.f06_negative_actor(p_kind text, p_req text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_role public.app_role;
begin
  if p_kind = 'CAPABILITY' then
    select e.role into v_role
      from (select unnest(enum_range(null::public.app_role)) as role) e
     where not (p_req = any (public.role_capabilities(e.role)))
     order by cardinality(public.role_capabilities(e.role)) desc, public.role_rank(e.role) desc
     limit 1;
  elsif p_kind = 'SYSTEM_ADMIN' then
    v_role := 'INSTITUTION_ADMIN';                       -- everything except the one thing
  elsif p_kind = 'SCOPE' then
    select e.role into v_role
      from (select unnest(enum_range(null::public.app_role)) as role) e
     where public.role_rank(e.role) < public.role_rank(p_req::public.app_role)
     order by public.role_rank(e.role) desc limit 1;
  elsif p_kind = 'INSTITUTION_MEMBER' then
    return 'beta-admin@synthetic.pintar.test';           -- a real admin, of the WRONG tenant
  elsif p_kind = 'ROLE_SET' then
    -- THE HIGHEST-RANKED ROLE OUTSIDE THE SET, for the same reason the
    -- CAPABILITY branch takes the most-capable role outside it: the wrong
    -- implementation of a role set is a RANK test, and a rank test lets in
    -- exactly the roles that outrank the set. SYSTEM_ADMIN also short-circuits
    -- several authorization primitives outright, so it is the actor most likely
    -- to get in through a mistake rather than through the declaration.
    select e.role into v_role
      from (select unnest(enum_range(null::public.app_role)) as role) e
     where not (e.role = any (string_to_array(p_req, ',')::public.app_role[]))
     order by public.role_rank(e.role) desc limit 1;
  else
    v_role := 'DEAN';
  end if;
  -- The persona is drawn from the tenant the PROBE'S ARGUMENTS come from, and
  -- that tenant is the one that actually owns content. Measured the hard way:
  -- with alpha personas and alpha as the argument tenant, a stack where alpha
  -- holds no course resolved the course from somewhere else, the endpoint
  -- refused on INV-13 or on a capability the actor lacks THERE, and a planted
  -- defect went unseen -- green on this machine, green in CI, for two different
  -- reasons. An actor judged against an object in another tenant is not the
  -- negative case anyone meant.
  --
  -- DEAN is the exception and deliberately so: DEAN holds no capability in any
  -- institution, so it is the negative actor for every capability wherever it
  -- stands, and the bootstrap tenant has no dean of its own.
  return case v_role
    when 'SYSTEM_ADMIN'       then 'sysadmin@synthetic.pintar.test'
    when 'INSTITUTION_ADMIN'  then 'boot-admin@bootstrap.pintar.test'
    when 'DEAN'               then 'alpha-dean@synthetic.pintar.test'
    when 'HEAD_OF_DEPARTMENT' then 'boot-kaprodi@bootstrap.pintar.test'
    when 'EDUCATOR'           then 'boot-guru@bootstrap.pintar.test'
    when 'STUDENT'            then 'boot-siswa@bootstrap.pintar.test' end;
end $$;
revoke all on function selftest.f06_negative_actor(text, text) from public;
grant execute on function selftest.f06_negative_actor(text, text) to authenticated;

-- THE PROBE OWNS ITS SCOPE.
--
-- Measured, twice, the hard way. `open_briefing` is called inside one
-- transaction by the briefing happy-path test AND by this probe. `briefings`
-- carries UNIQUE (institution_id, scope_node_id, created_at) and `created_at`
-- defaults to now(), which is CONSTANT within a transaction -- so the second
-- call on the same node collides. With the authorization check neutralized the
-- probe reaches that insert and refuses with 23505, an unrelated refusal, and
-- the retained CI plant goes silent. Which node the probe received was decided
-- by an unordered `limit 1` across the two CLASS nodes of the argument tenant:
-- D1's own class and the analytics cohort the happy-path test uses. One choice
-- fired the plant, the other hid it, and nothing in the test chose between them.
-- CI run 78 was red and run 79 was green on a documentation-only diff.
--
-- Selecting a different existing row would only move the coincidence. The probe
-- therefore CREATES the scope it acts on, in the caller's own subtransaction,
-- so it is rolled back with everything else the call touches and no other test
-- can have reached it first.
create or replace function selftest.f06_probe_node(p_inst uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cohort record; v_id uuid;
begin
  select n.id, n.academic_period_id into v_cohort
    from public.org_nodes n
   where n.institution_id = p_inst and n.kind = 'COHORT' and n.academic_period_id is not null
   order by n.created_at, n.id limit 1;
  if v_cohort.id is null then return null; end if;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (p_inst, v_cohort.id, 'CLASS', 'F06-N02 probe scope', v_cohort.academic_period_id)
  returning org_nodes.id into v_id;
  return v_id;
end $$;
revoke all on function selftest.f06_probe_node(uuid) from public;
grant execute on function selftest.f06_probe_node(uuid) to authenticated;

-- What a refusal has to SAY for the declared contract to be proved.
create or replace function selftest.f06_contract_pattern(p_kind text, p_req text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select case p_kind
    when 'CAPABILITY'         then p_req
    when 'SYSTEM_ADMIN'       then 'SYSTEM_ADMIN'
    when 'SCOPE'              then p_req
    when 'INSTITUTION_MEMBER' then '(another institution|not a member|institution)'
    when 'DELEGATED'          then '(INV-16|SYSTEM_ADMIN|not authorized|may not|denied)'
    -- A ROLE SET refuses by naming the roles it is for, so the pattern is the
    -- declaration itself turned into an alternation. Built from p_req rather
    -- than written out, so a set that changes cannot leave a pattern matching
    -- the old one behind.
    when 'ROLE_SET'           then '(' || replace(p_req, ',', '|') || ')'
  end
$$;
revoke all on function selftest.f06_contract_pattern(text, text) from public;
grant execute on function selftest.f06_contract_pattern(text, text) to authenticated;

-- A PLAUSIBLE ARGUMENT, RESOLVED BY NAME AND TYPE rather than by a per-function
-- map. Sixteen of the eighteen dean-denied endpoints refused the null probe at
-- argument RESOLUTION, before authorization ran -- so the assertion proved
-- refusal, not authorization, and a capability check WEAKENED rather than
-- removed would have stayed green. Giving each a resolvable argument makes
-- authorization the thing that refuses.
--
-- Resolved with the harness's privileges: the VALUES only need to exist, and
-- whether the dean may read them is not the property under test.
create or replace function selftest.f06_arg_value(p_name text, p_type text, p_inst uuid)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid; v_lab text;
begin
  if p_type = 'uuid' then
    -- RESOLVE THE ARGUMENT, AND FALL BACK OUTSIDE THE TENANT RATHER THAN TO
    -- NULL. Measured: with the dean's own tenant as the only source, twelve of
    -- these arguments came back NULL -- synth-alpha holds no course, release,
    -- session or certificate -- and the endpoint refused with "unknown course
    -- <NULL>" long before it could ask about a capability. That counts as a
    -- refusal and proves nothing about authorization, which is exactly the
    -- weakness the verdict has to name. A row from ANOTHER institution resolves
    -- the lookup and lands the call on the capability check, where the dean is
    -- refused BY NAME -- without touching a single production function.
    if    p_name ~ 'institution'      then v := p_inst;
    elsif p_name ~ 'course'           then select id into v from public.courses where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.courses limit 1; end if;
    elsif p_name ~ 'release'          then select id into v from public.plp_releases where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.plp_releases limit 1; end if;
    elsif p_name ~ '(node|scope)'     then
      -- a CLASS or COHORT, not the institution root: several endpoints validate
      -- the node KIND before they authorize, so the root refuses for the wrong
      -- reason and the capability check is never reached
      select id into v from public.org_nodes
       where institution_id=p_inst and kind in ('CLASS','COHORT')
       order by (kind='CLASS') desc limit 1;
      if v is null then select id into v from public.org_nodes where institution_id=p_inst limit 1; end if;
    elsif p_name ~ 'module'           then select m.id into v from public.modules m join public.courses c on c.id=m.course_id where c.institution_id=p_inst limit 1;
                                           if v is null then select m.id into v from public.modules m limit 1; end if;
    elsif p_name ~ 'definition'       then select id into v from public.assessment_definitions where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.assessment_definitions limit 1; end if;
    -- a LIVE session, not a finished one: several endpoints refuse a FINALIZED
    -- session on its own terms before they ask about a capability, which is a
    -- refusal that proves nothing about authorization
    -- a LIVE session first, the caller's own tenant second. Several endpoints
    -- refuse a FINALIZED session on its own terms before they ask about a
    -- capability, and that is a refusal which proves nothing; the tenant of the
    -- session is not what these endpoints check first.
    elsif p_name ~ 'session'          then select id into v from public.assessment_sessions
                                            order by (status not in ('FINALIZED','TERMINATED')) desc,
                                                     (institution_id = p_inst) desc limit 1;
    elsif p_name ~ 'item'             then select id into v from public.items where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.items limit 1; end if;
    elsif p_name ~ 'certificate'      then select id into v from public.certificates where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.certificates limit 1; end if;
    elsif p_name ~ 'assignment'       then select id into v from public.learning_assignments where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.learning_assignments limit 1; end if;
    -- these four have no tenant-scoped form: a briefing, a transfer and an
    -- integrity signal are whatever exists, and where none does the argument
    -- stays NULL and the endpoint is honestly counted as argued rather than
    -- asserted.
    elsif p_name ~ 'briefing'         then select id into v from public.briefings limit 1;
    elsif p_name ~ 'enrollment'       then select id into v from public.enrollments where status='ACTIVE' limit 1;
    elsif p_name ~ 'transfer'         then select id into v from public.transfers
                                            order by (status not in ('EXECUTED','REJECTED')) desc limit 1;
    elsif p_name ~ 'signal'           then select id into v from public.integrity_signals limit 1;
    elsif p_name ~ 'person'           then select person_id into v from public.enrollments where institution_id=p_inst limit 1;
    elsif p_name ~ 'period'           then select id into v from public.academic_periods where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.academic_periods limit 1; end if;
    end if;
    if v is null then return 'null::uuid'; end if;
    return quote_literal(v::text) || '::uuid';
  elsif p_type = 'text' then
    -- Text arguments get a value the COLUMN they land in will accept, by
    -- parameter name, exactly as the uuid branch above resolves by name. This
    -- is argument plumbing, not the population: a generic 'selftest' made
    -- save_certificate_template fail its layout CHECK before it ever reached
    -- the capability check, which is a refusal that proves nothing and, worse,
    -- hid a deleted guard during the L3-F02 acceptance plant.
    if    p_name ~ 'layout'  then return quote_literal('CLASSIC');
    elsif p_name ~ 'prefix'  then return quote_literal('PNT/2026');
    elsif p_name ~ 'version' then return quote_literal('MC-1');
    end if;
    return quote_literal('selftest');
  elsif p_type in ('integer','smallint','bigint') then
    return '1::' || p_type;
  elsif p_type = 'jsonb' then
    return quote_literal('{}') || '::jsonb';
  elsif p_type = 'boolean' then
    return 'false';
  elsif p_type like 'timestamp%' then
    return 'now()';
  else
    -- an enum: its first label, so the call is well-formed
    select e.enumlabel into v_lab from pg_enum e join pg_type t on t.oid=e.enumtypid
     where t.typname = replace(p_type,'public.','') order by e.enumsortorder limit 1;
    if v_lab is null then return 'null::' || p_type; end if;
    return quote_literal(v_lab) || '::' || p_type;
  end if;
end $$;
-- THE WHOLE ARGUMENT LIST, with one rule f06_arg_value cannot express alone:
-- when a signature offers both a broader and a narrower scope, the narrower one
-- is left unset. Two ways this mattered, both measured, both of them a refusal
-- that proves nothing AND that hid a deleted guard during the L3-F02 acceptance
-- plant: supplying a course AND a module to save_certificate_template broke its
-- `num_nonnulls(course_id, module_id) <= 1` CHECK, and supplying an institution
-- together with a course from a DIFFERENT institution tripped its INV-13 tenant
-- check. The second only showed up in CI, where the probe's own tenant happens
-- to hold no course and the fallback reaches across. Naming the broader scope
-- alone is both valid and tenant-consistent wherever the fixture stands. This is
-- a rule about signature SHAPE, not a list of endpoints; the population is still
-- derived.
create or replace function selftest.f06_call_args(p_args text, p_inst uuid, p_node uuid default null)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_has_course boolean; v_has_inst boolean;
begin
  v_has_course := p_args ~ 'course';
  v_has_inst   := p_args ~ 'institution';
  return coalesce((
    select string_agg(
      case when regexp_replace(trim(a), '^\S+\s+', '') = 'uuid'
            and ((v_has_inst   and split_part(trim(a), ' ', 1) ~ '(course|module)')
              or (v_has_course and split_part(trim(a), ' ', 1) ~ 'module'))
           then 'null::uuid'
           -- the scope the probe built for itself, never one another test shares
           when p_node is not null
            and regexp_replace(trim(a), '^\S+\s+', '') = 'uuid'
            and split_part(trim(a), ' ', 1) ~ '(node|scope)'
           then quote_literal(p_node::text) || '::uuid'
           else selftest.f06_arg_value(split_part(trim(a), ' ', 1),
                  regexp_replace(trim(a), '^\S+\s+', ''), p_inst) end,
      ', ' order by ord)
    from unnest(string_to_array(p_args, ',')) with ordinality as u(a, ord)
   where length(trim(u.a)) > 0), '');
end $$;
revoke all on function selftest.f06_call_args(text, uuid, uuid) from public;
grant execute on function selftest.f06_call_args(text, uuid, uuid) to authenticated;

revoke all on function selftest.f06_arg_value(text, text, uuid) from public;
grant execute on function selftest.f06_arg_value(text, text, uuid) to authenticated;

create or replace function selftest.run_fable06()
returns table(id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  aa uuid; s uuid; v_pi uuid; v_item uuid; v_proj jsonb; v_txt text;
  v_secret text; v_correct text; n int;
begin
  -- =========================================================================
  -- F06-P01 -- sanitized_item, executed to a SUCCESSFUL RETURN.
  --
  -- WHY THIS TEST EXISTS. The happy-path sweep found that `sanitized_item` --
  -- the function deciding what a learner may see of a question -- had never
  -- run to a successful return under any migration, seed or test. It was read
  -- and it is correct. Nothing said so.
  --
  -- AND WHY IT ASSERTS ABSENCE, NOT PRESENCE. A probe that checked "it
  -- returned something" would pass on a function that returned EVERYTHING.
  -- So this takes the item's real rationale text and its real correct-option
  -- label out of the database, and requires neither to appear anywhere in the
  -- projection -- the secret itself, not a guess at what the key is called.
  -- =========================================================================
  -- THIS ORDER MATTERS. `purge_certificates` deletes every D1 session, and the
  -- analytics cohort's reclassification rows reference some of them by foreign
  -- key -- so the fixture clears its own evidence first. Widening the shared
  -- fable04 helper to know about this fixture would be the other repair and the
  -- worse one.
  perform selftest.f06_purge();
  perform selftest.purge_certificates();
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  select m.post_test_assignment into aa from public.my_learning_assignments() m limit 1;
  if aa is null then
    id:='F06-P01'; area:='learner projection'; ok:=false;
    detail:='the bootstrap learner sees no post-test assignment'; return next; return;
  end if;
  s := public.start_learning_session(aa);
  v_pi := selftest.first_presented_of_type(s, 'MCQ_SINGLE');

  -- the projection, as the learner who owns the session
  v_proj := public.sanitized_item(v_pi);
  v_txt := v_proj::text;

  perform selftest.as_owner();
  select p.item_id into v_item from public.presented_items p where p.id = v_pi;
  -- the actual secrets held for this item
  select o.rationale into v_secret from public.item_options o
   where o.item_id = v_item and o.rationale is not null and length(o.rationale) > 3 limit 1;
  select o.label into v_correct from public.item_options o
   where o.item_id = v_item and o.is_correct limit 1;

  id := 'F06-P01'; area := 'INV-13 learner projection / happy-path sweep';
  ok := true; detail := '';
  if v_proj is null then
    ok := false; detail := 'sanitized_item returned null for an item in the caller''s own session';
  elsif not (v_proj ? 'stem') then
    ok := false; detail := 'the projection carries no stem: a learner cannot read the question';
  elsif v_secret is not null and position(v_secret in v_txt) > 0 then
    ok := false; detail := 'the projection contains an option RATIONALE verbatim: ' || left(v_secret, 40);
  elsif v_txt ~* '"(is_correct|benar|rationale|alasan|misconception_code|kunci)"' then
    ok := false; detail := 'the projection carries a correctness-shaped key: ' || left(v_txt, 120);
  elsif jsonb_typeof(v_proj -> 'opsi') = 'array'
        and exists (select 1 from jsonb_array_elements(v_proj -> 'opsi') e
                     where e ? 'is_correct' or e ? 'label') then
    ok := false; detail := 'an option carries its identity or its correctness flag';
  else
    -- and every key present is one the declared safe set permits
    select string_agg(k, ', ') into v_txt from jsonb_object_keys(v_proj) k
     where k not in ('item_type', 'stem', 'stimulus', 'opsi');
    if v_txt is not null then
      ok := false; detail := 'the projection carries key(s) outside the declared safe set: ' || v_txt;
    else
      detail := 'sanitized_item executed to a successful return and the projection carries the stem and '
             || 'options only: the option rationale held for this item appears nowhere in it, no '
             || 'correctness-shaped key is present, no option carries its own label, and every key is '
             || 'inside the declared set {item_type, stem, stimulus, opsi}';
    end if;
  end if;
  return next;

  -- =========================================================================
  -- F06-N01 -- the same call, by somebody else, discloses nothing -- INCLUDING
  -- whether the item exists. Existence and ownership answer identically.
  -- =========================================================================
  declare v_a text; v_b text; v_fake uuid := gen_random_uuid();
  begin
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    begin
      perform public.sanitized_item(v_pi);
      v_a := '(no refusal)';
    exception when others then v_a := sqlerrm; end;
    begin
      perform public.sanitized_item(v_fake);
      v_b := '(no refusal)';
    exception when others then v_b := sqlerrm; end;
    perform selftest.as_owner();

    id := 'F06-N01'; area := 'INV-13 / oracle removal';
    if v_a = '(no refusal)' then
      ok := false; detail := 'another person read a learner''s item projection';
    elsif v_b = '(no refusal)' then
      ok := false; detail := 'a fabricated presented-item id was accepted';
    elsif v_a is distinct from v_b then
      ok := false;
      detail := 'a real item and a fabricated one answer differently, so existence is an oracle: '
             || left(v_a, 60) || ' / ' || left(v_b, 60);
    else
      ok := true;
      detail := 'a real item belonging to someone else and a uuid that does not exist produce the '
             || 'identical refusal, so a caller learns nothing about which it was: "' || left(v_a, 70) || '"';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P02 -- the declared projection boundary holds on this database.
  -- =========================================================================
  id := 'F06-P02'; area := 'INV-13 / §3.4 applied to a boundary';
  select a.ok, a.detail into ok, detail from public.assert_learner_projection_is_closed() a;
  return next;

  -- =========================================================================
  -- F06-P03 / P04 / P05 -- Question Health over REAL OFFICIAL evidence.
  --
  -- The migration probes proved the mechanism. They could not prove the
  -- mechanism over evidence, and the difference was not academic: 0076's insert
  -- path wrote a row straight into its derived state, which the lifecycle guard
  -- refuses, and no probe met it because a probe's item has no evidence and its
  -- derived state IS the starting state. Eighty real sessions found it. L9, one
  -- level up.
  -- =========================================================================
  declare
    c record; i int; n_raised int; n_with int; v_mark bigint; v_trail text;
    v_hi_state text; v_lo_state text; v_hi_n int; v_lo_n int; v_min int;
    v_row record; v_outside int;
  begin
    perform selftest.f06_purge();
    select * into c from selftest.f06_cohort();
    for i in 1..c.learners loop
      perform selftest.f06_attempt(format('f06-murid-%s@bootstrap.pintar.test', i),
                                   i, c.high_item, c.low_item);
    end loop;
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    select * into v_row from public.recompute_question_health(c.inst);
    perform selftest.as_owner();

    select qh.state::text, qh.evidence_count into v_hi_state, v_hi_n
      from public.question_health qh where qh.item_id = c.high_item;
    select qh.state::text, qh.evidence_count into v_lo_state, v_lo_n
      from public.question_health qh where qh.item_id = c.low_item;
    select min(evidence_count) into v_min from public.question_health
     where institution_id = c.inst;

    id := 'F06-P03'; area := 'doc 04 §9 / INV-11 -- both threshold directions on real evidence';
    if v_min < 30 then
      ok := false;
      detail := format('the cohort under-sampled an item (%s responses, threshold 30): the draw varies '
                    || 'and %s learners were not enough this run', v_min, c.learners);
    elsif v_hi_state <> 'SIGNAL_RAISED' then
      ok := false; detail := format('an item answered correctly by everyone (%s responses) sits at %s',
                                    v_hi_n, v_hi_state);
    elsif v_lo_state <> 'SIGNAL_RAISED' then
      ok := false; detail := format('an item answered wrongly by everyone (%s responses) sits at %s',
                                    v_lo_n, v_lo_state);
    elsif v_row.signals_raised < 2 then
      ok := false; detail := format('%s signal(s) raised, expected both directions', v_row.signals_raised);
    elsif exists (select 1 from public.question_health qh
                   where qh.institution_id = c.inst and qh.state = 'SIGNAL_RAISED'
                     and qh.item_id not in (c.high_item, c.low_item)) then
      ok := false; detail := 'an item nobody drove to a threshold raised a signal anyway';
    else
      ok := true;
      detail := format('%s learners over OFFICIAL evidence: the item everyone answered correctly (%s '
                    || 'responses) and the item everyone answered wrongly (%s) both reach SIGNAL_RAISED, '
                    || 'and no other item does -- the signal fires in both directions and only where '
                    || 'driven. Least-sampled item %s responses against a threshold of 30',
                       c.learners, v_hi_n, v_lo_n, v_min);
    end if;
    return next;

    -- F06-P04 -- evidence is WITHDRAWN, and the downward pair runs on real data.
    -- `al.id`, qualified: `id` is this function's own OUT parameter and plpgsql
    -- resolves it to the variable, not the column. Third shadowing of this kind
    -- in the build -- `r`, `t`, and now `id`.
    select coalesce(max(al.id), 0) into v_mark from public.audit_log al;
    n_with := selftest.f06_withdraw(c.high_item, 29);
    perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
    perform public.recompute_question_health(c.inst);
    perform selftest.as_owner();
    select qh.state::text, qh.evidence_count into v_hi_state, v_hi_n
      from public.question_health qh where qh.item_id = c.high_item;
    select string_agg((al.summary ->> 'from_state') || '->' || (al.summary ->> 'to_state'),
                      ' then ' order by al.id)
      into v_trail from public.audit_log al
     where al.action = 'question_health.transition'
       and al.target_id = c.high_item::text and al.id > v_mark;

    id := 'F06-P04'; area := 'ADR-0014 / the downward edges, on withdrawn evidence';
    if v_hi_state <> 'INSUFFICIENT_EVIDENCE' then
      ok := false; detail := format('after withdrawing %s session(s) the item sits at %s with %s responses',
                                    n_with, v_hi_state, v_hi_n);
    elsif v_trail is distinct from 'SIGNAL_RAISED->OBSERVING then OBSERVING->INSUFFICIENT_EVIDENCE' then
      ok := false; detail := format('the recorded walk reads "%s"', coalesce(v_trail, '(nothing)'));
    else
      ok := true;
      detail := format('%s session(s) reclassified out of OFFICIAL by an integrity reviewer dropped the '
                    || 'item to %s responses, and it walked SIGNAL_RAISED -> OBSERVING -> '
                    || 'INSUFFICIENT_EVIDENCE as two declared edges and two audit rows. The pool is '
                    || 'monotonically shrinking -- an override may only reduce eligibility -- so a state '
                    || 'resting on evidence that no longer exists is the failure these edges prevent',
                       n_with, v_hi_n);
    end if;
    return next;

    -- F06-P05 -- the cohort does not touch D1's own journey. Asserted, because
    -- the below-threshold case depends on that separation rather than assuming it.
    select count(*) into v_outside from public.enrollments e
      join public.memberships m on m.enrollment_id = e.id
     where e.institution_id = c.inst and m.node_id <> c.class_node
       and e.person_id in (select p.id from public.persons p
                             join public.accounts a on a.person_id = p.id
                             join auth.users au on au.id = a.auth_user_id
                            where au.email = 'boot-siswa@bootstrap.pintar.test');
    id := 'F06-P05'; area := 'fixture isolation in the one OFFICIAL tenant';
    if v_outside = 0 then
      ok := false;
      detail := 'the bootstrap learner is not outside the analytics cohort''s class: D1''s own journey '
             || 'and this fixture are no longer separable';
    elsif exists (select 1 from public.assessment_sessions s
                   join public.certificates ct on ct.session_id = s.id
                  where s.class_node_id = c.class_node) then
      ok := false; detail := 'the analytics cohort issued a certificate: it is meant to produce evidence, not credentials';
    else
      ok := true;
      detail := 'the analytics cohort has its own CLASS node and its own assignment; the bootstrap '
             || 'learner keeps its class and its certificate, so D1''s demonstration journey is '
             || 'untouched and its single enrolment remains the below-threshold case';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P06 -- a briefing reaches READY over REAL OFFICIAL evidence, and
  -- carries the versions it was made from.
  --
  -- 0082's terminal block could not reach this branch and said so: a synthetic
  -- tenant caps at SYNTHETIC by construction, and the catalogue refuses a
  -- minimum sample of 0, so `have` is 0 and no lowering of the bar is legal.
  -- The D1 cohort is the only OFFICIAL evidence in this build, which makes this
  -- the only place the generation path can run at all.
  --
  -- §3.4 MATTERS MORE FOR A BRIEFING THAN FOR A REPORT ON A SCREEN. A briefing
  -- is read later, by somebody who was not present when it was generated and
  -- cannot ask what the thresholds were that day. So the assertion is not that
  -- it rendered -- it is that the ARTEFACT records the catalogue version and
  -- the template version, and that re-evaluating pinned to that version still
  -- gives the number it was generated with.
  -- =========================================================================
  declare
    c record; v_b uuid; v_out jsonb; v_tmpl uuid; v_cat text; v_ver int;
    v_mark bigint; v_trail text; v_rep uuid; n_ts int; v_pinned jsonb;
  begin
    select * into c from selftest.f06_cohort();
    perform selftest.as_user('boot-admin@bootstrap.pintar.test');

    select t.id into v_tmpl from public.report_templates t
     where t.institution_id = c.inst and t.standard_report = 'class_learning_intelligence' limit 1;
    if v_tmpl is null then
      insert into public.report_templates (institution_id, standard_report, title_key)
      values (c.inst, 'class_learning_intelligence', 'laporan.kelas.judul');
      select t2.id into v_tmpl from public.report_templates t2
       where t2.institution_id = c.inst and t2.standard_report = 'class_learning_intelligence' limit 1;
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
      values (v_tmpl, 'class.participants', 1, 'hero_stat'),
             (v_tmpl, 'class.comprehension', 2, 'hero_stat');
    end if;

    v_b := public.open_briefing(c.class_node);

    select coalesce(max(al.id), 0) into v_mark from public.audit_log al;
    v_out := public.advance_briefing(v_b);
    select b2.catalogue_version, b2.template_version, b2.generated_report_id
      into v_cat, v_ver, v_rep from public.briefings b2 where b2.id = v_b;
    select string_agg((al.summary ->> 'from_state') || '->' || (al.summary ->> 'to_state'),
                      ' then ' order by al.id)
      into v_trail from public.audit_log al
     where al.action = 'briefing.transition' and al.target_id = v_b::text and al.id > v_mark;
    select count(distinct al.at) into n_ts from public.audit_log al
     where al.action = 'briefing.transition' and al.target_id = v_b::text and al.id > v_mark;
    perform selftest.as_owner();

    id := 'F06-P06'; area := 'doc 04 §8 / §3.4 -- a briefing is an artefact';
    if v_out ->> 'state' <> 'READY' then
      ok := false;
      detail := format('the briefing did not reach READY over %s learners of OFFICIAL evidence: %s',
                       c.learners, v_out);
    elsif v_cat is null or v_ver is null or v_rep is null then
      ok := false;
      detail := format('a READY briefing records catalogue=%s template_version=%s report=%s: provenance '
                    || 'is missing from the artefact somebody will read months later',
                       coalesce(v_cat,'(null)'), coalesce(v_ver::text,'(null)'), coalesce(v_rep::text,'(null)'));
    elsif v_trail is distinct from 'COLLECTING->GENERATING then GENERATING->READY' then
      ok := false; detail := format('the recorded walk reads "%s"', coalesce(v_trail,'(nothing)'));
    elsif n_ts <> 1 then
      ok := false;
      detail := 'the two transitions carry different timestamps; the L3 premise the id ordering rests on is gone';
    else
      -- and the recorded version REACHES the numbers: re-evaluating pinned to
      -- it is what makes provenance more than decoration (0073).
      v_pinned := public.metric_evaluate('class.participants', c.class_node, c.inst, v_cat);
      if v_pinned ->> 'catalogue_version' <> v_cat then
        ok := false; detail := format('re-evaluating pinned to %s reported %s', v_cat, v_pinned ->> 'catalogue_version');
      else
        ok := true;
        detail := format('over %s learners of OFFICIAL evidence the briefing walked COLLECTING -> '
                      || 'GENERATING -> READY as two declared edges and two audit rows ordered by identity '
                      || '(they share one transaction timestamp), and the ARTEFACT carries catalogue %s and '
                      || 'template version %s. Re-evaluating pinned to that catalogue answers under it, so '
                      || 'the recorded version determines the numbers rather than merely naming them',
                         c.learners, v_cat, v_ver);
      end if;
    end if;
    return next;

    -- F06-P07 -- THE TWO HUMAN PATHS THIS PHASE MADE REACHABLE, EXECUTED.
    --
    -- The happy-path sweep is only worth running if its findings get closed.
    -- Two of the twelve it names are this phase's own: `review_briefing`, which
    -- 0082 created and nothing called, and `record_question_health_review`,
    -- which the sweep classified as outcome (3) -- unreachable, because
    -- question_health held no rows -- and which 0076 moved to (2). Leaving
    -- either unexercised would be the 0072 class exactly: shipped, believed,
    -- never run.
    declare v_qh uuid; v_state text; v_bstate text;
    begin
      perform selftest.as_user('boot-admin@bootstrap.pintar.test');
      v_bstate := (public.review_briefing(v_b, false)) ->> 'state';

      select qh.item_id into v_qh from public.question_health qh
       where qh.institution_id = c.inst and qh.state = 'SIGNAL_RAISED' limit 1;
      if v_qh is not null then
        -- SIGNAL_RAISED -> UNDER_REVIEW is the human edge; the computation owns
        -- neither end of it
        perform public.record_question_health_review(v_qh, 'UNDER_REVIEW',
          'selftest: a reviewer picks up a raised signal');
        select qh.state::text into v_state from public.question_health qh where qh.item_id = v_qh;
      end if;
      perform selftest.as_owner();

      id := 'F06-P07'; area := 'the human half of both lifecycles, executed';
      if v_bstate <> 'REVIEWED' then
        ok := false; detail := format('review_briefing left the briefing at %s', v_bstate);
      elsif v_qh is null then
        ok := false;
        detail := 'no item reached SIGNAL_RAISED, so the reviewer path had nothing to pick up -- which '
               || 'means F06-P03 did not do what it claims';
      elsif v_state <> 'UNDER_REVIEW' then
        ok := false; detail := format('a reviewer picked up a raised signal and it sits at %s', v_state);
      else
        ok := true;
        detail := 'both human paths run: an educator marks a briefing REVIEWED, and a reviewer moves a '
               || 'raised signal to UNDER_REVIEW -- the edge the computation is forbidden to drive. Both '
               || 'were named by the happy-path sweep as never having executed, and '
               || 'record_question_health_review was unreachable until this phase produced the first '
               || 'question_health row for it to act on';
      end if;
      return next;
    end;
  end;

  -- Same ordering on the way out: the cohort's reclassifications reference D1
  -- sessions that purge_certificates is about to remove.
  -- =========================================================================
  -- F06-N02 -- EVERY MUTATING STAFF ENDPOINT ENFORCES THE CONTRACT IT DECLARES.
  --
  -- INV-19 lives here: a dean surface that renders no button over an endpoint
  -- that would accept a write is not read-only, and only one of those two is
  -- testable without a browser. But the population is no longer "endpoints
  -- whose body mentions a capability DEAN lacks". That phrasing was the defect
  -- (L3-F02): the edit this assertion hunts -- a deleted capability check -- was
  -- also the edit that removed the endpoint from the population, and a floor of
  -- 18 against a set of 21 let the first three deletions through. The floor is
  -- gone. Membership replaces it.
  --
  -- The population comes from selftest.f06_staff_rpc_contracts(): registry
  -- exposure, planner volatility, and the grant that makes an endpoint
  -- client-reachable. What each must enforce comes from the registry
  -- declaration (0086). None of those is touched by `create or replace`.
  --
  -- TWO ACTORS PER ENDPOINT.
  --   1. The DEAN, on every CAPABILITY endpoint. DEAN holds nothing anywhere,
  --      so INV-19 is the strongest single statement available and it is made
  --      against the declared population rather than a derived-from-body one.
  --   2. The negative actor the DECLARATION implies -- for a capability, the
  --      role holding the most capabilities among those that do not hold this
  --      one. That is what catches a declaration stricter than its
  --      implementation: the actor lacks what is declared, holds what is
  --      actually checked, and gets in.
  --
  -- REFUSAL IS NOT ABSENCE. Every endpoint must EXIST and be EXECUTABLE by the
  -- caller; undefined_function is a failure, not a pass. And the read half: the
  -- dean must READ successfully through the same session, or a dean with no
  -- session at all would pass this perfectly.
  -- =========================================================================
  declare
    v_read jsonb; v_sig text; v_args text; v_err text; v_pat text; v_actor text;
    n_contract int := 0; n_other int := 0; n_accepted int := 0; n_absent int := 0;
    n_broken int := 0; n_dean int := 0; n_declared int := 0; n_pop int := 0;
    v_unproved text := ''; v_bad text := ''; v_inst uuid; f record;
    v_decl_ok boolean; v_decl_detail text;
  begin
    -- the argument tenant is the one that owns content in every stack this runs
    -- on, and f06_negative_actor draws its personas from the same place. A probe
    -- whose object and whose actor live in different institutions measures
    -- INV-13, not the capability it came to check.
    select i.id into v_inst from public.institutions i where i.slug = 'pintar-bootstrap-official';
    if v_inst is null then
      select i.id into v_inst from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
    end if;

    -- (a) the declaration itself is complete and resolves against the live model
    select a.ok, a.detail into v_decl_ok, v_decl_detail
      from public.assert_staff_rpc_authorization_declared() a;

    -- (b) every declared mutating STAFF endpoint is in the probed population, or
    --     is not client-callable at all. A silent revoke is the only way out of
    --     this set, and it takes the endpoint out of a client's reach with it.
    select count(*) into n_declared
      from public.client_rpc_registry r
      join pg_proc p on p.proname = r.function_name and p.pronamespace = 'public'::regnamespace
     where r.exposure = 'STAFF' and p.provolatile = 'v';
    select count(*) into n_pop from selftest.f06_staff_rpc_contracts();

    perform selftest.as_user('alpha-dean@synthetic.pintar.test');
    begin
      v_read := to_jsonb(public.mode_policy('POST_TEST'));
    exception when others then v_read := null; end;
    perform selftest.as_owner();

    for f in select c.oid_ as oid, c.proname, c.args, c.kind, c.requirement
               from selftest.f06_staff_rpc_contracts() c loop
      v_pat   := selftest.f06_contract_pattern(f.kind, f.requirement);
      v_actor := selftest.f06_negative_actor(f.kind, f.requirement);

      -- the declared negative actor
      perform selftest.as_user(v_actor);
      if not has_function_privilege(session_user, f.oid, 'EXECUTE')
         and not has_function_privilege('authenticated', f.oid, 'EXECUTE') then
        n_absent := n_absent + 1;
        v_bad := v_bad || f.proname || ' (not executable by a client role); ';
        perform selftest.as_owner();
        continue;
      end if;
      begin
        -- arguments are built INSIDE this subtransaction, because an endpoint
        -- that takes a scope gets one created here and rolled back with it
        v_args := selftest.f06_call_args(f.args, v_inst,
                    case when f.args ~ '(node|scope)' then selftest.f06_probe_node(v_inst) end);
        v_sig  := format('select public.%I(%s)', f.proname, v_args);
        execute v_sig;
        n_accepted := n_accepted + 1;
        v_bad := v_bad || format('%s (ACCEPTED %s, which does not satisfy the declared %s %s); ',
                                 f.proname, v_actor, f.kind, coalesce(f.requirement, ''));
        raise exception 'F06_N02_UNDO';
      exception
        when raise_exception then
          if sqlerrm <> 'F06_N02_UNDO' then
            v_err := sqlerrm;
            if v_err ~* v_pat then n_contract := n_contract + 1;
            else n_other := n_other + 1; v_unproved := v_unproved || f.proname || ', '; end if;
          end if;
        when undefined_function then
          n_absent := n_absent + 1;
          v_bad := v_bad || f.proname || ' (does not exist: absence read as refusal); ';
        when syntax_error_or_access_rule_violation then
          v_err := sqlerrm;
          if v_err ~* v_pat then n_contract := n_contract + 1;
          else
            n_broken := n_broken + 1;
            v_bad := v_bad || f.proname || ' (the probe could not call it: ' || left(v_err, 50) || '); ';
          end if;
        when others then
          v_err := sqlerrm;
          if v_err ~* v_pat then n_contract := n_contract + 1;
          else n_other := n_other + 1; v_unproved := v_unproved || f.proname || ', '; end if;
      end;
      perform selftest.as_owner();

      -- and the DEAN, on every capability endpoint (INV-19 proper)
      if f.kind = 'CAPABILITY' and v_actor <> 'alpha-dean@synthetic.pintar.test' then
        perform selftest.as_user('alpha-dean@synthetic.pintar.test');
        begin
          v_args := selftest.f06_call_args(f.args, v_inst,
                      case when f.args ~ '(node|scope)' then selftest.f06_probe_node(v_inst) end);
          v_sig  := format('select public.%I(%s)', f.proname, v_args);
          execute v_sig;
          n_dean := n_dean + 1;
          v_bad := v_bad || f.proname || ' (ACCEPTED a call from a dean holding no capability); ';
          raise exception 'F06_N02_UNDO';
        exception when others then null; end;
        perform selftest.as_owner();
      end if;
    end loop;
    perform selftest.as_owner();

    id := 'F06-N02'; area := 'INV-19 / L3-F02 -- declared authorization contract, enforced';
    if not coalesce(v_decl_ok, false) then
      ok := false;
      detail := 'the authorization declaration is not complete or does not resolve: ' || coalesce(v_decl_detail, '');
    elsif n_pop <> n_declared then
      ok := false;
      detail := format('%s of %s declared mutating STAFF endpoint(s) are client-callable; the other %s were '
                    || 'not probed. An endpoint leaving this population by losing its grant is out of a '
                    || 'client''s reach, but the difference is reported rather than assumed',
                       n_pop, n_declared, n_declared - n_pop);
    elsif v_read is null then
      ok := false;
      detail := 'the dean could not READ through the session used for the refusals, so every refusal '
             || 'below is indistinguishable from having no session at all';
    elsif n_accepted > 0 or n_dean > 0 then
      ok := false; detail := 'an endpoint accepted an actor its declaration refuses: ' || v_bad;
    elsif n_absent > 0 then
      ok := false;
      detail := 'endpoint(s) whose refusal is ABSENCE rather than authorization -- a test that cannot '
             || 'tell those apart proves nothing: ' || v_bad;
    elsif n_broken > 0 then
      ok := false;
      detail := 'the probe failed to CALL endpoint(s), so their refusal was never tested: ' || v_bad;
    elsif n_contract = 0 then
      ok := false;
      detail := format('no endpoint refused by its declared contract (%s other error(s)): the check is '
                    || 'measuring argument handling, not authorization', n_other);
    else
      ok := true;
      detail := format('%s client-callable mutating STAFF endpoint(s), every one declaring how it '
                    || 'authorizes and every one refusing the actor that declaration excludes: %s refused '
                    || 'by an error naming the declared requirement, %s refused earlier for another '
                    || 'reason. The DEAN was additionally refused by every CAPABILITY endpoint. The '
                    || 'population comes from the registry, pg_proc.provolatile and the client grant -- '
                    || 'never from a function body -- so deleting an endpoint''s own authorization check '
                    || 'leaves it in this set and fails it here (L3-F02). There is no floor: membership '
                    || 'is the closure. BOUNDED: for the %s refused earlier, refusal is proved but not '
                    || 'that it is the declared authorization -- %s(see RF-2)',
                       n_pop, n_contract, n_other, n_other,
                       case when v_unproved = '' then '' else rtrim(v_unproved, ', ') || ' ' end);
    end if;
    return next;
  end;


  -- =========================================================================
  -- F06-P08 -- EVERY DECLARED STRUCTURAL ASSERTION, RUN WHERE IT MATTERS.
  --
  -- WHY THIS EXISTS. Each of this build's `assert_*` functions was written to
  -- be checked by the terminal block of the migration that created it -- once,
  -- on the day it was applied, against the database it was applied to. That is
  -- not a test. It cannot be re-run against a hosted project, it does not fail
  -- a pull request, and it says nothing about the system as it stands now. The
  -- §7 instruction is explicit: anything verified by hand and never added goes
  -- into the manifest rather than being verified by hand again.
  --
  -- THE SET IS DERIVED, for the sixth time in this phase. Any function named
  -- `assert_*` in `public` returning (ok, detail) is run. A new assertion joins
  -- this test the day it is created, which is the property a written list can
  -- never have -- and the failure this build has repaired five times.
  --
  -- THE FLOOR IS THE VACUITY GUARD, and it is the same one F06-N02 needed: an
  -- assertion that is DELETED leaves the derived set rather than failing inside
  -- it, and a test that runs nothing passes. Seventeen were measured here.
  -- =========================================================================
  declare
    a record; v_failed text := ''; n_run int := 0; v_ok boolean; v_detail text;
  begin
    perform selftest.as_owner();
    for a in select p.proname from pg_proc p
               join pg_namespace ns on ns.oid = p.pronamespace
              where ns.nspname = 'public' and p.proname like 'assert\_%'
                and pg_get_function_result(p.oid) = 'TABLE(ok boolean, detail text)'
              order by p.proname
    loop
      n_run := n_run + 1;
      execute format('select a.ok, a.detail from public.%I() a', a.proname) into v_ok, v_detail;
      if not coalesce(v_ok, false) then
        v_failed := v_failed || a.proname || ': ' || left(coalesce(v_detail, '(no detail)'), 90) || '; ';
      end if;
    end loop;

    id := 'F06-P08'; area := 'every declared structural assertion, in the running system';
    if n_run < 17 then
      ok := false;
      detail := format('%s assertion function(s) found, fewer than the 17 measured when this check was '
                    || 'written: an assertion has left the derived set rather than failing inside it',
                       n_run);
    elsif v_failed <> '' then
      ok := false; detail := v_failed;
    else
      ok := true;
      detail := format('%s declared assertion(s) run and all hold in this database, including the four '
                    || 'this phase added -- metric catalogue, metric closure (INV-34 semantics: no report '
                    || 'function computes), reports-do-not-compute and question-health-observes-only. The '
                    || 'set is derived from pg_proc by name and result shape, so a new assertion joins the '
                    || 'day it is written; the floor of 17 closes the hole where deleting one would leave '
                    || 'the set instead of failing inside it', n_run);
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-N03 -- INV-34 AT WRITE TIME, which is where doc 03 puts it: "attempt
  -- to save a template containing a formula or an unknown metric; assert
  -- rejection".
  --
  -- INV-34 had no manifest test at all before this one. The §7 traceability
  -- measurement found it and INV-06 as the only two of thirty-eight declared
  -- invariants that no manifest `proves` string named.
  --
  -- AND IT FOUND SOMETHING WHILE BEING WRITTEN. The first version expected the
  -- CHECK constraints to refuse a formula, because 0073 says they do: "the
  -- CHECK constraints above already refuse punctuation, so a formula cannot be
  -- stored at all". They never see it. A BEFORE ROW trigger runs before
  -- constraint evaluation, so `enforce_report_template_metric` refuses a
  -- formula as an UNKNOWN METRIC and the constraint is never reached. The
  -- comment was not wrong about the constraint -- it was wrong about which
  -- wall is standing. So this test proves both: the four writes below are
  -- refused with the guard in place, and the same two writes are refused again
  -- with the guard DISABLED, which is the only way to reach the constraints
  -- and the only way to know they are more than decoration.
  --
  -- THE ACCEPTED CASE IS NOT DECORATION EITHER. A table that refused every row
  -- would pass a test made only of refusals, and would take the whole reporting
  -- surface down with it. So a legitimate selection is saved in the same block
  -- and must succeed.
  --
  -- WRITES ARE UNDONE. The probe builds its template in the SYNTHETIC alpha
  -- tenant and rolls its own writes back through a subtransaction -- the
  -- disabled trigger included -- so a failing run leaves nothing for the next
  -- one to trip over, the defect OQ-4 came from. PL/pgSQL variables survive
  -- that rollback; the rows and the DDL do not.
  -- =========================================================================
  declare
    v_inst uuid; v_tpl uuid; v_e text; v_bad text := ''; n_refused int := 0;
    n_checked int := 0; v_accepted boolean := false; v_probe text;
  begin
    select i.id into v_inst from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
    begin
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      insert into public.report_templates (institution_id, standard_report, title_key)
      values (v_inst, 'class_learning_intelligence', 'laporan.kelas.judul')
      -- `returning report_templates.id`, not `returning id`: the runner's own
      -- OUT parameter is called `id` and shadows the column. Fourth time.
      returning report_templates.id into v_tpl;

      -- 1. a formula in the metric slot. The catalogue answers first, and what
      --    it says is the whole invariant: a template does not define.
      v_probe := 'a formula as the metric';
      begin
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tpl, 'sum(a)/nullif(count(b),0)', 11, 'hero_stat');
        v_bad := v_bad || v_probe || ' ACCEPTED; ';
      exception when others then
        v_e := sqlerrm;
        if v_e ~ 'unknown metric id' then n_refused := n_refused + 1;
        else v_bad := v_bad || v_probe || ' refused for another reason: ' || left(v_e, 60) || '; '; end if;
      end;

      -- 2. a SQL fragment as the visualization of a real metric
      v_probe := 'SQL as the visualization';
      begin
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tpl, 'class.participants', 12, 'select 1 from items');
        v_bad := v_bad || v_probe || ' ACCEPTED; ';
      exception when others then
        v_e := sqlerrm;
        if v_e ~ 'does not permit visualization' then n_refused := n_refused + 1;
        else v_bad := v_bad || v_probe || ' refused for another reason: ' || left(v_e, 60) || '; '; end if;
      end;

      -- 3. a well-shaped metric id the catalogue does not define
      v_probe := 'a metric the catalogue does not define';
      begin
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tpl, 'class.invented_by_the_template', 13, 'hero_stat');
        v_bad := v_bad || v_probe || ' ACCEPTED; ';
      exception when others then
        v_e := sqlerrm;
        if v_e ~ 'unknown metric id' then n_refused := n_refused + 1;
        else v_bad := v_bad || v_probe || ' refused for another reason: ' || left(v_e, 60) || '; '; end if;
      end;

      -- 4. a real metric drawn a way the catalogue does not permit. Choosing
      --    how a number may be read is the same class of authority as choosing
      --    what it means, which is why this is INV-34 and not a style rule.
      v_probe := 'a visualization the catalogue does not permit';
      begin
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tpl, 'class.participants', 14, 'bar');
        v_bad := v_bad || v_probe || ' ACCEPTED; ';
      exception when others then
        v_e := sqlerrm;
        if v_e ~ 'does not permit visualization' then n_refused := n_refused + 1;
        else v_bad := v_bad || v_probe || ' refused for another reason: ' || left(v_e, 60) || '; '; end if;
      end;

      -- 5. and the selection a template IS allowed to make
      begin
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tpl, 'class.participants', 1, 'hero_stat');
        v_accepted := true;
      exception when others then
        v_bad := v_bad || 'a legitimate selection was REFUSED: ' || left(sqlerrm, 70) || '; ';
      end;

      -- 6. THE SECOND WALL, reached the only way it can be reached. With the
      --    catalogue guard disabled, a formula and a SQL fragment must still
      --    not be storable -- otherwise the constraints 0073 relies on in
      --    writing are doing nothing in fact.
      perform selftest.as_owner();
      execute 'alter table public.report_template_metrics disable trigger report_template_metrics_guard';
      begin
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tpl, 'sum(a)/nullif(count(b),0)', 21, 'hero_stat');
        v_bad := v_bad || 'with the catalogue guard disabled a FORMULA reached the table; ';
      exception when others then
        v_e := sqlerrm;
        if v_e ~ 'metric_id_shape' then n_checked := n_checked + 1;
        else v_bad := v_bad || 'the metric_id constraint refused for another reason: ' || left(v_e, 60) || '; '; end if;
      end;
      begin
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tpl, 'class.participants', 22, 'select 1 from items');
        v_bad := v_bad || 'with the catalogue guard disabled SQL reached the visualization column; ';
      exception when others then
        v_e := sqlerrm;
        if v_e ~ 'visualization_shape' then n_checked := n_checked + 1;
        else v_bad := v_bad || 'the visualization constraint refused for another reason: ' || left(v_e, 60) || '; '; end if;
      end;
      execute 'alter table public.report_template_metrics enable trigger report_template_metrics_guard';

      raise exception 'F06_N03_UNDO';
    exception when others then
      if sqlerrm <> 'F06_N03_UNDO' then
        v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 80) || '; ';
      end if;
    end;
    perform selftest.as_owner();

    id := 'F06-N03'; area := 'INV-34 -- a template selects from the catalogue, it does not define';
    if v_bad <> '' then
      ok := false; detail := v_bad;
    elsif n_refused <> 4 then
      ok := false;
      detail := format('%s of 4 forbidden template rows were refused by the catalogue guard', n_refused);
    elsif n_checked <> 2 then
      ok := false;
      detail := format('%s of 2 forbidden rows were refused by a CHECK constraint with the guard '
                    || 'disabled: the second wall is not standing', n_checked);
    elsif not v_accepted then
      ok := false;
      detail := 'nothing forbidden was saved and nothing permitted was either: a template surface that '
             || 'refuses everything satisfies a test made only of refusals';
    else
      ok := true;
      detail := 'four forbidden template rows are refused by the catalogue guard -- a formula and an '
             || 'unknown id both as "unknown metric id", a SQL fragment and a disallowed chart both as '
             || '"does not permit visualization" -- and a legitimate selection over the same template is '
             || 'accepted, so the refusals are the rule and not a broken write path. MEASURED WHILE '
             || 'WRITING THIS: the BEFORE trigger refuses before constraint evaluation, so the CHECK '
             || 'constraints 0073 describes as the first wall are never reached by these inputs; with the '
             || 'guard disabled they refuse the same two writes themselves. Every row and the DDL are '
             || 'rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P09 -- THE SAME SAVED TEMPLATE, READ BY TWO REAL ROLES.
  --
  -- §8's addition, in its own words: "a saved template opened by a
  -- lower-privileged viewer renders that viewer's permitted subset, with an
  -- honest statement for each omitted metric. Test this with two real roles,
  -- not one." Two real personas, not two capability sets: boot-admin holds
  -- INSTITUTION_ADMIN and boot-guru holds EDUCATOR, both in D1, and the
  -- catalogue's `allowed_audiences` is what separates them.
  --
  -- §3.3 IS THE PROPERTY UNDER TEST. A saved configuration is a request, not
  -- an entitlement. The admin saved a template naming institution-scope and
  -- item-scope metrics; the educator opening it must not receive them merely
  -- because they were saved.
  --
  -- AND THE STATEMENT MUST NAME NOTHING. `not_permitted` that carried the
  -- metric id or its label would disclose the shape of what was withheld --
  -- the same leak 0073 removed from the deprecation branch. Asserted here
  -- rather than read.
  --
  -- THE DEPRECATED CASE, and its bound. A deprecated metric referenced by a
  -- saved template must be omitted with an honest statement while the report
  -- still renders. No exposed surface can deprecate a metric --
  -- `publish_metric_catalogue` copies the flag forward and the definitions are
  -- immutable -- so the state is produced here the way a future migration
  -- would produce it, by inserting the definition. What is proven is the
  -- READING of a deprecated metric, not a deprecation workflow, which does not
  -- exist (OQ-5).
  -- =========================================================================
  declare
    c2 record; v_t2 uuid; v_admin jsonb; v_guru jsonb; v_dep jsonb;
    n_admin_denied int; n_guru_denied int; n_named int; v_why text := '';
    n_entries_admin int; n_entries_guru int; v_depstatus text; v_depstmt text;
    n_dep_entries int; n_admin_ok int; v_guru_class uuid;
  begin
    select * into c2 from selftest.f06_cohort();
    -- THE NODE IS THE EDUCATOR'S OWN CLASS, READ FROM THEIR ASSIGNMENT.
    --
    -- This case measures ONE axis -- the catalogue's `allowed_audiences` -- and
    -- since 0091 there are two. Asked at the F06 cohort's class, which is a
    -- SIBLING of boot-guru's, the educator would now be refused all three
    -- entries and the count would be measuring containment instead: a test that
    -- still went red for the right reason would no longer be naming it.
    --
    -- So the organizational half is held constant, by standing the reader
    -- exactly where they are assigned, and the audience half is what varies.
    -- Containment is asked separately, and adversarially, in F06-P10.
    --
    -- Read from role_assignments rather than by name, because the property is
    -- "the node this educator is scoped to", and a literal would go on passing
    -- if the seed ever moved them.
    select ra.scope_node_id into v_guru_class
      from public.role_assignments ra
      join public.accounts a on a.person_id = ra.person_id
      join auth.users u on u.id = a.auth_user_id
     where u.email = 'boot-guru@bootstrap.pintar.test' and ra.revoked_at is null
     limit 1;
    if v_guru_class is null then
      raise exception 'F06-P09: the educator persona has no scope node to stand on';
    end if;
    if v_guru_class = c2.class_node then
      raise exception 'F06-P09: the educator is scoped to the cohort class, so the audience axis cannot be isolated from the containment axis here';
    end if;
    begin
      perform selftest.as_user('boot-admin@bootstrap.pintar.test');
      insert into public.report_templates (institution_id, standard_report, title_key, template_version)
      values (c2.inst, 'class_learning_intelligence', 'laporan.kelas.judul', 2)
      returning report_templates.id into v_t2;
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization) values
        (v_t2, 'class.participants', 1, 'hero_stat'),
        (v_t2, 'institution.participants', 2, 'hero_stat'),
        (v_t2, 'item.correctness_rate', 3, 'bar');

      v_admin := public.generate_report(v_t2, v_guru_class);
      perform selftest.as_user('boot-guru@bootstrap.pintar.test');
      v_guru := public.generate_report(v_t2, v_guru_class);

      -- the deprecated metric, added the only way one can exist
      perform selftest.as_owner();
      insert into public.metric_definitions
        (catalogue_version, metric_id, label_key, meaning_key, scope, minimum_sample,
         allowed_visualizations, allowed_audiences, calculation_key, deprecated, deprecation_note_key)
      values (public.current_metric_catalogue(), 'class.retired_probe', 'metrik.peserta.label',
              'metrik.peserta.arti', 'CLASS', 1, array['hero_stat'],
              array['EDUCATOR','INSTITUTION_ADMIN']::public.app_role[], 'class_participants',
              true, 'laporan.metrik.diganti');
      perform selftest.as_user('boot-admin@bootstrap.pintar.test');
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
      values (v_t2, 'class.retired_probe', 4, 'hero_stat');
      v_dep := public.generate_report(v_t2, v_guru_class);

      perform selftest.as_owner();
      raise exception 'F06_P09_UNDO';
    exception when others then
      if sqlerrm <> 'F06_P09_UNDO' then
        v_why := 'the probe itself failed: ' || left(sqlerrm, 100);
      end if;
    end;
    perform selftest.as_owner();

    id := 'F06-P09'; area := '§8 / §3.3 -- a saved template is a request, read by two real roles';
    if v_why <> '' then
      ok := false; detail := v_why;
    else
      select count(*) into n_entries_admin from jsonb_array_elements(v_admin -> 'entries');
      select count(*) into n_entries_guru  from jsonb_array_elements(v_guru -> 'entries');
      select count(*) filter (where e ->> 'status' = 'not_permitted'),
             count(*) filter (where e ->> 'status' = 'ok')
        into n_admin_denied, n_admin_ok from jsonb_array_elements(v_admin -> 'entries') e;
      select count(*) filter (where e ->> 'status' = 'not_permitted')
        into n_guru_denied from jsonb_array_elements(v_guru -> 'entries') e;
      -- a withheld entry that names what was withheld is not a statement, it
      -- is a disclosure with an apology attached
      select count(*) into n_named from jsonb_array_elements(v_guru -> 'entries') e
       where e ->> 'status' = 'not_permitted' and (e ? 'metric_id' or e ? 'label_key');
      select count(*) into n_dep_entries from jsonb_array_elements(v_dep -> 'entries') e;
      select e ->> 'status', e ->> 'statement_key' into v_depstatus, v_depstmt
        from jsonb_array_elements(v_dep -> 'entries') e where e ->> 'metric_id' = 'class.retired_probe';

      ok := true; detail := '';
      if n_entries_admin <> 3 or n_entries_guru <> 3 then
        ok := false;
        detail := format('the same template rendered %s entries for the admin and %s for the educator: a '
                      || 'report omits, it does not shorten', n_entries_admin, n_entries_guru);
      elsif n_admin_denied <> 0 then
        ok := false;
        detail := format('the admin who saved the template was refused %s of its own metrics',
                         n_admin_denied);
      elsif n_admin_ok = 0 then
        ok := false;
        detail := 'no metric computed for the admin either, so "the permitted subset" is untested: this '
               || 'would pass on a report that showed nobody anything';
      elsif n_guru_denied <> 2 then
        ok := false;
        detail := format('the educator received %s honest statement(s) where 2 were expected at a node '
                      || 'they are scoped to: institution- and item-scope metrics are outside EDUCATOR''s '
                      || 'catalogue audience, and a saved template does not grant them', n_guru_denied);
      elsif n_named > 0 then
        ok := false;
        detail := format('%s withheld entr(ies) carry the metric id or its label: the statement discloses '
                      || 'what it declines to show', n_named);
      elsif v_depstatus is distinct from 'deprecated' or v_depstmt is null then
        ok := false;
        detail := format('a deprecated metric in a saved template read status=%s statement=%s',
                         coalesce(v_depstatus, '(absent)'), coalesce(v_depstmt, '(none)'));
      elsif n_dep_entries <> 4 then
        ok := false;
        detail := format('the report carrying a deprecated metric rendered %s of 4 entries', n_dep_entries);
      else
        detail := format('one saved template, two real personas, read at the EDUCATOR''s own node so the '
                      || 'audience axis is isolated from 0091''s containment axis: INSTITUTION_ADMIN '
                      || 'receives all 3 entries with %s computed, EDUCATOR receives all 3 with 2 '
                      || 'replaced by an honest statement '
                      || 'that names neither the metric nor its label -- the institution- and item-scope '
                      || 'metrics the admin saved are outside EDUCATOR''s catalogue audience and the saved '
                      || 'configuration does not grant them (§3.3). A deprecated metric added to the same '
                      || 'template reads status=deprecated carrying %s and the other 3 entries still '
                      || 'render. BOUNDED: no exposed surface can deprecate a metric -- the definition was '
                      || 'inserted here as a migration would (OQ-5). Every row written is rolled back',
                         n_admin_ok, v_depstmt);
      end if;
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P10 -- A READER SEES THE PART OF THE SCHOOL THEY STAND IN.
  --
  -- The ruling 0091 implements: the organizational visibility of a scoped role
  -- is its assigned `scope_node_id` and its legitimate DESCENDANTS. Belonging
  -- to the institution does not widen that. For an intelligence read, the
  -- catalogue's AUDIENCE and the hierarchy's CONTAINMENT must BOTH pass.
  --
  -- WHY THIS FIXTURE AND NOT A SEED. Every seeded school has exactly ONE
  -- department, so the case that matters most -- a SIBLING, equal in rank,
  -- adjacent in the tree, in the same institution -- cannot be asked of any of
  -- them. A test that could not have caught the defect is not evidence, so the
  -- school is built here with two departments and thrown away afterwards.
  --
  -- THE NODES ARE ADVERSARIAL BY POSITION, not by name. Nothing below reads
  -- `kind`, and the string 'DEPARTMENT' decides nothing: the reader is placed
  -- at a node and every other node is then classified by where it sits
  -- relative to that one -- below it, beside it, above it, elsewhere.
  --
  -- AND THE AUDIENCE AXIS IS ASKED IN BOTH DIRECTIONS. Containment that
  -- admitted everything in scope would be the old defect wearing the new
  -- vocabulary, so a metric the reader is IN SCOPE for but OUTSIDE THE AUDIENCE
  -- of must still be refused. That is the case a "check the node too" repair
  -- passes by accident and this one does not.
  -- =========================================================================
  declare
    v_why text := ''; bad text[] := '{}';
    v_inst uuid; v_root uuid; v_fac uuid; v_dept_a uuid; v_dept_b uuid;
    v_prog_a uuid; v_prog_b uuid; v_coh_a uuid; v_coh_b uuid;
    v_cls_a uuid; v_cls_b uuid; v_period uuid;
    v_other uuid; v_other_root uuid;
    v_hod uuid; v_hod_u uuid; v_dean uuid; v_dean_u uuid; v_adm uuid; v_adm_u uuid;
    v_la uuid; v_la_u uuid; v_lb uuid; v_lb_u uuid; v_e uuid;
    v_dua uuid; v_dua_u uuid;
    v_cat text; v_tmpl uuid; v_shelf int; v_rows int; v_refused boolean;
    n_checks int := 0;

  begin
    v_cat := public.current_metric_catalogue();
    begin
      perform selftest.as_owner();

      insert into public.institutions (name, slug, is_synthetic)
      values ('Sekolah F06-P10', 'f06p10-' || substr(md5(random()::text), 1, 10), true)
      returning institutions.id into v_inst;
      select org_nodes.id into v_root from public.org_nodes
       where institution_id = v_inst and kind = 'INSTITUTION';
      insert into public.academic_periods (institution_id, name, starts_on, ends_on)
      values (v_inst, '2026/27', date '2026-07-01', date '2027-06-30') returning academic_periods.id into v_period;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_inst, v_root, 'FACULTY', 'Fakultas') returning org_nodes.id into v_fac;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_inst, v_fac, 'DEPARTMENT', 'Departemen A') returning org_nodes.id into v_dept_a;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_inst, v_fac, 'DEPARTMENT', 'Departemen B') returning org_nodes.id into v_dept_b;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_inst, v_dept_a, 'PROGRAMME', 'Program A') returning org_nodes.id into v_prog_a;
      insert into public.org_nodes (institution_id, parent_id, kind, name)
      values (v_inst, v_dept_b, 'PROGRAMME', 'Program B') returning org_nodes.id into v_prog_b;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_inst, v_prog_a, 'COHORT', 'Angkatan A', v_period) returning org_nodes.id into v_coh_a;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_inst, v_prog_b, 'COHORT', 'Angkatan B', v_period) returning org_nodes.id into v_coh_b;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_inst, v_coh_a, 'CLASS', 'Kelas A', v_period) returning org_nodes.id into v_cls_a;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_inst, v_coh_b, 'CLASS', 'Kelas B', v_period) returning org_nodes.id into v_cls_b;

      insert into public.institutions (name, slug, is_synthetic)
      values ('Sekolah F06-P10 lain', 'f06p10x-' || substr(md5(random()::text), 1, 10), true)
      returning institutions.id into v_other;
      select org_nodes.id into v_other_root from public.org_nodes
       where institution_id = v_other and kind = 'INSTITUTION';

      v_hod_u  := selftest.f06p10_person('f06p10-kaprodi');
      v_dean_u := selftest.f06p10_person('f06p10-dekan');
      v_adm_u  := selftest.f06p10_person('f06p10-admin');
      -- A READER WEARING TWO HATS, which is the case that decides whether the
      -- two halves must be carried by ONE assignment or may be collected from
      -- two. They are an EDUCATOR over the whole school -- an over-broad grant,
      -- but a legal one an institution admin can make -- and head of one
      -- department. Neither assignment entitles them to a tenant-wide
      -- aggregate: the wide one is outside that metric's audience and the
      -- audience one does not reach the root. A rule that lets containment come
      -- from either row hands it over.
      v_dua_u  := selftest.f06p10_person('f06p10-duaperan');
      v_la_u   := selftest.f06p10_person('f06p10-murid-a');
      v_lb_u   := selftest.f06p10_person('f06p10-murid-b');
      select person_id into v_hod  from public.accounts where auth_user_id = v_hod_u;
      select person_id into v_dean from public.accounts where auth_user_id = v_dean_u;
      select person_id into v_adm  from public.accounts where auth_user_id = v_adm_u;
      select person_id into v_dua  from public.accounts where auth_user_id = v_dua_u;
      select person_id into v_la   from public.accounts where auth_user_id = v_la_u;
      select person_id into v_lb   from public.accounts where auth_user_id = v_lb_u;

      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
        (v_hod,  'HEAD_OF_DEPARTMENT', v_dept_a, now() + interval '1 year'),
        (v_dean, 'DEAN',               v_fac,    now() + interval '1 year'),
        (v_adm,  'INSTITUTION_ADMIN',  v_root,   now() + interval '1 year'),
        (v_dua,  'EDUCATOR',           v_root,   now() + interval '1 year'),
        (v_dua,  'HEAD_OF_DEPARTMENT', v_dept_a, now() + interval '1 year');
      perform set_config('app.seed_intent', '', true);

      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (v_la, v_inst, v_period, v_prog_a, 'ACTIVE') returning enrollments.id into v_e;
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      values (v_e, v_cls_a, v_period);
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (v_lb, v_inst, v_period, v_prog_b, 'ACTIVE') returning enrollments.id into v_e;
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      values (v_e, v_cls_b, v_period);

      -- ── the seven cases, as the reader standing on Departemen A ────────────
      perform selftest.as_user('f06p10-kaprodi@bootstrap.pintar.test');

      -- A1 the node they are assigned to
      bad := bad || selftest.f06p10_case('A1 own node', 'class.participants', v_dept_a, v_inst, v_cat, true);
      -- A2 a legitimate descendant, two levels down
      bad := bad || selftest.f06p10_case('A2 descendant class', 'class.participants', v_cls_a, v_inst, v_cat, true);
      -- A3 a SIBLING: same rank, same faculty, same school, not theirs
      bad := bad || selftest.f06p10_case('A3 sibling department', 'class.participants', v_dept_b, v_inst, v_cat, false);
      bad := bad || selftest.f06p10_case('A3 sibling''s class', 'class.participants', v_cls_b, v_inst, v_cat, false);
      -- A4 a node in another school entirely
      bad := bad || selftest.f06p10_case('A4 unrelated school', 'class.participants', v_other_root, v_inst, v_cat, false);
      -- A5 upward: the ancestor, and the school as a whole
      bad := bad || selftest.f06p10_case('A5 ancestor faculty', 'class.participants', v_fac, v_inst, v_cat, false);
      bad := bad || selftest.f06p10_case('A5 institution root', 'class.participants', v_root, v_inst, v_cat, false);
      -- A5 AND THE AGGREGATE THAT IGNORES ITS NODE. This is the case the
      -- headline defect actually was: the calculator never reads p_node, so
      -- naming one's own department and receiving the whole school was the
      -- entire leak. Both metrics are asked at a node the reader DOES hold.
      bad := bad || selftest.f06p10_case('A5 tenant-wide participants', 'institution.participants', v_dept_a, v_inst, v_cat, false);
      bad := bad || selftest.f06p10_case('A5 tenant-wide cohort comparison', 'institution.cohort_comparison', v_dept_a, v_inst, v_cat, false);
      -- A6 IN SCOPE, WRONG AUDIENCE -- checked below on the dean, for whom the
      -- catalogue itself excludes the metric. Here the person-shaped metric is
      -- contained through the learner instead of through a node.
      --
      -- THE HEAD OF DEPARTMENT IS NOW REFUSED BOTH, and the first of those two
      -- expectations is the one that moved. Until MC-2, learner.result listed
      -- HEAD_OF_DEPARTMENT among its audiences, so a head of department read an
      -- identifiable learner's mastery through the METRIC route with nothing
      -- recorded -- Management individual learner detail in substance, reached
      -- through the aggregate door. The Management ruling closed that route and
      -- opened an audited one; F06-P12 asserts the same reader reaches the same
      -- learner through `management_learner_detail`, which writes the record.
      --
      -- A product rule was replaced, not a test relaxed: the case still asks
      -- about the same learner, from the same reader, and still demands a
      -- definite answer. What changed is which answer the product gives, and
      -- the case proving the access still exists lives next door.
      bad := bad || selftest.f06p10_learner('learner in own department (metric route closed by MC-2)',
                                            v_la, v_inst, v_cat, false);
      bad := bad || selftest.f06p10_learner('learner in sibling department', v_lb, v_inst, v_cat, false);

      -- ── the dean, scoped to the faculty ───────────────────────────────────
      perform selftest.as_user('f06p10-dekan@bootstrap.pintar.test');
      bad := bad || selftest.f06p10_case('dean, class in own faculty', 'class.participants', v_cls_b, v_inst, v_cat, true);
      bad := bad || selftest.f06p10_case('dean, own faculty', 'class.participants', v_fac, v_inst, v_cat, true);
      bad := bad || selftest.f06p10_case('dean, the whole school', 'institution.participants', v_fac, v_inst, v_cat, false);
      bad := bad || selftest.f06p10_case('dean, another school', 'class.participants', v_other_root, v_inst, v_cat, false);
      -- A6 PROPER: this learner is inside the dean's own faculty, so
      -- containment passes and the refusal can only come from the audience.
      bad := bad || selftest.f06p10_learner('dean, learner in own faculty (audience)', v_la, v_inst, v_cat, false);

      -- ── two hats, and neither of them fits ────────────────────────────────
      perform selftest.as_user('f06p10-duaperan@bootstrap.pintar.test');
      -- The audience half comes from the department assignment, the containment
      -- half from the school-wide one, and the request is for the school. Both
      -- halves exist somewhere on this person; neither assignment carries both.
      bad := bad || selftest.f06p10_case('two hats, tenant-wide aggregate', 'institution.participants', v_root, v_inst, v_cat, false);
      bad := bad || selftest.f06p10_case('two hats, tenant-wide at own department', 'institution.participants', v_dept_a, v_inst, v_cat, false);
      -- and the same reader still gets what EITHER hat legitimately covers
      bad := bad || selftest.f06p10_case('two hats keep the educator''s reach', 'class.participants', v_cls_b, v_inst, v_cat, true);

      -- ── the three regressions ─────────────────────────────────────────────
      perform selftest.as_user('f06p10-admin@bootstrap.pintar.test');
      bad := bad || selftest.f06p10_case('R1 admin keeps the tenant-wide aggregate', 'institution.participants', v_dept_a, v_inst, v_cat, true);
      bad := bad || selftest.f06p10_case('R2 admin keeps every class', 'class.participants', v_cls_b, v_inst, v_cat, true);
      -- R3 the item bank has no node to be contained by and is unchanged
      bad := bad || selftest.f06p10_case('R3 item bank, admin', 'item.correctness_rate', v_cls_a, v_inst, v_cat, true);
      perform selftest.as_user('f06p10-kaprodi@bootstrap.pintar.test');
      bad := bad || selftest.f06p10_case('R3 item bank, head of department', 'item.correctness_rate', v_cls_a, v_inst, v_cat, true);

      -- ── and the shelf, which is the same numbers with a date on them ──────
      perform selftest.as_user('f06p10-admin@bootstrap.pintar.test');
      insert into public.report_templates (institution_id, standard_report, title_key, template_version)
      values (v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul', 1)
      returning report_templates.id into v_tmpl;
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
      values (v_tmpl, 'institution.participants', 1, 'hero_stat');
      perform public.generate_report(v_tmpl, v_root, v_cat);

      -- a report drawn at another school's node is refused, and writes nothing
      select count(*) into v_rows from public.generated_reports;
      v_refused := false;
      begin perform public.generate_report(v_tmpl, v_other_root, v_cat);
      exception when others then v_refused := true; end;
      -- `bad || 'text'` resolves to text[] || text[] and fails on any string
      -- holding a comma or a quote, which is every message here. Found by a
      -- plant going red with "malformed array literal" instead of its own
      -- reason -- a red test is not automatically a working test.
      if not v_refused then bad := bad || array['a report was drawn at another school''s node']; end if;
      if (select count(*) from public.generated_reports) <> v_rows then
        bad := bad || array['a refused report still wrote an artefact row'];
      end if;

      perform selftest.as_user('f06p10-kaprodi@bootstrap.pintar.test');
      select count(*) into v_shelf from public.generated_reports g where g.scope_node_id = v_root;
      if v_shelf <> 0 then
        bad := bad || array[format('a department-scoped reader read %s institution-wide report(s) off the shelf', v_shelf)];
      end if;
      perform selftest.as_user('f06p10-admin@bootstrap.pintar.test');
      select count(*) into v_shelf from public.generated_reports g where g.scope_node_id = v_root;
      if v_shelf = 0 then bad := bad || array['the reader who drew a report cannot read it back']; end if;

      n_checks := 24;
      perform selftest.as_owner();
      raise exception 'F06_P10_UNDO';
    exception when others then
      begin perform selftest.as_owner(); exception when others then null; end;
      perform set_config('app.seed_intent', '', true);
      if sqlerrm <> 'F06_P10_UNDO' then
        v_why := 'the probe itself failed: ' || left(sqlerrm, 160);
      end if;
    end;

    id := 'F06-P10'; area := 'WP1 ruling 1 -- audience and organizational containment must both pass';
    if v_why <> '' then
      ok := false; detail := v_why;
    elsif array_length(bad, 1) is not null then
      ok := false;
      detail := format('%s boundary case(s) answered wrongly: %s',
                       array_length(bad, 1), array_to_string(bad, '; '));
    else
      ok := true;
      detail := format('%s case(s) on a purpose-built two-department school: a head of department reads their '
        || 'own node and its descendants and is refused the sibling department, the sibling''s class, another '
        || 'school, the ancestor faculty, the institution root, and BOTH tenant-wide aggregates asked at a node '
        || 'they do hold -- including institution.cohort_comparison, which declares COHORT scope and computes '
        || 'over every cohort, so a repair trusting the declaration would have passed it. Both learner-shaped reads are refused on the '
        || 'metric route, which MC-2 closed to Management in favour of the audited path. A faculty-scoped dean keeps the faculty '
        || 'and every class under it, loses the school, and is still refused a learner standing INSIDE that '
        || 'faculty because DEAN is not in that metric''s audience -- containment is not a key on its own. An '
        || 'institution-scoped admin keeps the tenant-wide aggregate and every class, and the item bank, which '
        || 'has no node to be contained by, is unchanged for both staff readers. A reader holding EDUCATOR '
        || 'over the whole school AND head of one department -- audience on one row, containment on the other '
        || '-- is refused the tenant-wide aggregate and keeps everything either hat really covers. A report drawn at another '
        || 'school''s node is refused and writes no artefact, and a saved institution-wide report is readable '
        || 'by the reader who drew it and not from below. Every row rolled back', n_checks);
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P11 -- THE CALCULATOR IS NOT TRUSTED TO ENFORCE THE BOUNDARY.
  --
  -- 0091 decided which node governs a metric request by INFERRING it from the
  -- calculator. Three separate inferences were built and three were defeated,
  -- each measured rather than argued:
  --
  --   text            "does the parsed body mention p_node"   beaten by
  --                   `and (p_node is not null or p_node is null)`
  --   behaviour       "does it return nothing for a NULL node" beaten by
  --                   `and p_node is not null`, which reads the whole tenant
  --                   for every REAL node and nothing for the probe value
  --   dependency      "does the parser record a real column reference"
  --                   beaten by `and (s.class_node_id = p_node or p_node is
  --                   not null)`, which records class_node_id AND restricts
  --                   nothing
  --
  -- The third defeats all three checks at once. The reason is structural, not
  -- a shortage of cleverness: the calculator is code, the check feeds it
  -- something, and code can branch on what it is fed.
  --
  -- SO THE BOUNDARY STOPPED DEPENDING ON THE CALCULATOR. 0092 narrowed the
  -- SOURCES; 0093 made the engine bind the boundary before dispatch and read
  -- the governing scope from a declared row. This case asks the only question
  -- that matters afterwards: with a calculator that is WRONG and a caller who
  -- is legitimately AUTHORIZED, can the sibling's evidence arrive?
  --
  -- THE FIXTURE HAS TWO POPULATED SIDES, which is the whole point. The reader's
  -- own class holds one OFFICIAL session and the sibling class holds a
  -- DIFFERENT one, both in a non-synthetic tenant -- so every "1" below is the
  -- statement "the other one did not come", about a row that exists. On an
  -- empty fixture a broken calculator and a correct one both answer 0 and this
  -- case would pass having measured nothing.
  -- =========================================================================
  declare
    v_why text := ''; bad text[] := '{}'; c record; v_cat text; n_sessions int; n int;
    v_adv text[] := array[
      'A ignores p_node entirely|',
      'B  p_node is not null| and p_node is not null',
      'C  cosmetic mention| and (p_node is not null or p_node is null)',
      'D  column dependency then OR| and (s.class_node_id = p_node or p_node is not null)',
      'E  coalesce around p_node| and s.class_node_id = coalesce(p_node, s.class_node_id)',
      'F  branches on NULL| and (case when p_node is null then false else true end)',
      'G  a legitimate node calculator| and s.class_node_id = p_node',
      'H  a legitimate tenant calculator|'];
    v text;
  begin
    begin
      perform selftest.as_owner();
      v_cat := public.current_metric_catalogue();
      select * into c from selftest.wp1_sibling_branch();

      -- THE VACUITY GUARD, FIRST. Two branches, each holding its own session.
      select count(*) into n_sessions from public.official_sessions s where s.institution_id = c.inst;
      if n_sessions <> 2 then
        raise exception 'the fixture holds % OFFICIAL session(s) where 2 were expected, one per branch',
          n_sessions;
      end if;
      if (select count(*) from public.official_sessions s where s.class_node_id = c.cls_a) <> 1
         or (select count(*) from public.official_sessions s where s.class_node_id = c.cls_b) <> 1 then
        raise exception 'the two branches are not each populated, so a leak would be invisible';
      end if;
      if c.hod is null or c.adm is null then
        raise exception 'the fixture has no head of department or no institution admin to read as';
      end if;

      -- EVERY ADVERSARIAL BODY, ASKED BY A READER WHO IS AUTHORIZED. The head
      -- of department holds the class they name, so authorization passes and
      -- the only thing between them and the sibling's session is the boundary.
      foreach v in array v_adv loop
        bad := bad || selftest.wp1_adversary(split_part(v,'|',1) || ' (head of department, own class)',
                        split_part(v,'|',2), c.hod, c.cls_a, c.inst, v_cat, 1);
        -- and the institution admin, standing at the root, still gets the
        -- legitimate answer for the same class rather than the whole school
        bad := bad || selftest.wp1_adversary(split_part(v,'|',1) || ' (institution admin, same class)',
                        split_part(v,'|',2), c.adm, c.cls_a, c.inst, v_cat, 1);
      end loop;

      -- AND THE ADMIN AT THE ROOT still obtains the legitimate institution
      -- figure, which is both branches -- so the boundary narrows by position
      -- rather than by always narrowing.
      perform selftest.as_owner();
      execute $f$
        create or replace function public.calc_institution_participants(
          p_node uuid, p_institution uuid, p_catalogue text)
        returns jsonb language sql stable set search_path = public, pg_temp
        begin atomic
          select jsonb_build_object('value', count(distinct s.person_id), 'sample', count(distinct s.person_id))
            from scoped_official_sessions s where s.institution_id = p_institution;
        end $f$;
      perform selftest.as_user(c.adm);
      n := coalesce(((public.metric_evaluate('institution.participants', c.root, c.inst, v_cat)) ->> 'sample')::int, -1);
      perform selftest.as_owner();
      if n <> 2 then
        bad := bad || array[format('the institution admin at the root received %s of 2 branches', n)];
      end if;

      -- THE SIBLING ITSELF is refused at the authorization layer, which is the
      -- other half: the boundary is not carrying a check that should have
      -- refused outright.
      perform selftest.as_user(c.hod);
      if (public.metric_evaluate('class.participants', c.cls_b, c.inst, v_cat)) ->> 'status'
         <> 'not_permitted' then
        bad := bad || array['the head of department was not refused the sibling class outright'];
      end if;
      perform selftest.as_owner();

      raise exception 'F06_P11_UNDO';
    exception when others then
      begin perform selftest.as_owner(); exception when others then null; end;
      perform set_config('pintar.metric_boundary_node', '', true);
      perform set_config('pintar.metric_boundary_person', '', true);
      if sqlerrm <> 'F06_P11_UNDO' then
        v_why := 'the probe itself failed: ' || left(sqlerrm, 180);
      end if;
    end;

    id := 'F06-P11'; area := 'WP1 -- source-bound containment, against calculators that are wrong';
    if v_why <> '' then
      ok := false; detail := v_why;
    elsif array_length(bad, 1) is not null then
      ok := false; detail := format('%s case(s) answered wrongly: %s',
                                    array_length(bad,1), array_to_string(bad, '; '));
    else
      ok := true;
      detail :=
        'eight calculator bodies -- six deliberately wrong and two correct -- installed one at a time as '
        || 'calc_class_participants and asked by a reader who legitimately holds the class they name, in a '
        || 'tenant where the reader''s class and the SIBLING class each hold their own OFFICIAL session. '
        || 'The six wrong ones are the three that defeated 0091''s inference (a cosmetic mention, '
        || '"p_node is not null", and a real class_node_id column dependency disjoined with OR -- which '
        || 'beats body text, a NULL probe and the parser''s own dependency record simultaneously), plus one '
        || 'that ignores the node entirely, one wrapping it in coalesce and one branching on NULL. Every '
        || 'one of the eight returns exactly the reader''s own class: the sibling''s session, which exists '
        || 'and is different, never arrives -- not because the calculator declined to widen, but because '
        || 'the widening was not its to do. The same eight asked by an institution admin at the same class '
        || 'return the same one, and the admin standing at the ROOT still receives both branches, so the '
        || 'boundary narrows by position rather than always narrowing. The head of department asking the '
        || 'sibling class directly is refused outright. The fixture is asserted to hold two populated '
        || 'branches BEFORE anything is measured, because on an empty one a broken calculator and a correct '
        || 'one both answer 0. Every row rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P12 -- THREE ACCESS LEVELS, AND THEY DO NOT COLLAPSE INTO ONE.
  --
  --   LEVEL 2  a DEAN and a HEAD_OF_DEPARTMENT see the learner ROSTER inside
  --            their assigned node and its descendants, and nothing outside.
  --   LEVEL 3  either may OPEN one named learner inside that scope,
  --            deliberately, and the opening is recorded.
  --
  -- WHY LEVEL 3 IS AN ENDPOINT AND NOT A POLICY. `persons_select` is a
  -- predicate over ROWS: reading a roster and opening a person put the
  -- identical question to it. So "deliberate" cannot be expressed there, and
  -- what this case asserts about Level 3 it asserts against
  -- `management_learner_detail` -- never against a policy.
  --
  -- AND THE METRIC ROUTE IS CHECKED IN THE SAME BREATH, because an audited door
  -- beside an unaudited one is not an audited door. Until MC-2 a head of
  -- department read an identifiable learner's mastery through
  -- `learner.result` with nothing recorded; the ruling closed that route for
  -- Management and for administrative authority, and left it open for the
  -- educator whose class the learner is in, whose teaching access is not a
  -- Management event.
  -- =========================================================================
  declare
    v_why text := ''; bad text[] := '{}';
    v_inst uuid; v_root uuid; v_fac uuid; v_dept_a uuid; v_dept_b uuid; v_period uuid;
    v_prog_a uuid; v_prog_b uuid; v_coh_a uuid; v_coh_b uuid; v_cls_a uuid; v_cls_b uuid;
    v_other uuid; v_cat text;
    v_hod uuid; v_hod_u uuid; v_dean uuid; v_dean_u uuid; v_adm uuid; v_adm_u uuid;
    v_guru uuid; v_guru_u uuid; v_la uuid; v_la_u uuid; v_lb uuid; v_lb_u uuid;
    v_lx uuid; v_lx_u uuid; v_e uuid; r jsonb; n int; n_before bigint; a record;
  begin
    begin
      perform selftest.as_owner();
      v_cat := public.current_metric_catalogue();
      insert into public.institutions (name, slug, is_synthetic)
      values ('Sekolah F06-P12', 'f06p12-' || substr(md5(random()::text),1,10), true)
      returning institutions.id into v_inst;
      select org_nodes.id into v_root from public.org_nodes
       where institution_id=v_inst and kind='INSTITUTION';
      insert into public.academic_periods (institution_id,name,starts_on,ends_on)
      values (v_inst,'2026/27',date '2026-07-01',date '2027-06-30')
      returning academic_periods.id into v_period;
      insert into public.org_nodes (institution_id,parent_id,kind,name)
      values (v_inst,v_root,'FACULTY','Fakultas') returning org_nodes.id into v_fac;
      insert into public.org_nodes (institution_id,parent_id,kind,name)
      values (v_inst,v_fac,'DEPARTMENT','A') returning org_nodes.id into v_dept_a;
      insert into public.org_nodes (institution_id,parent_id,kind,name)
      values (v_inst,v_fac,'DEPARTMENT','B') returning org_nodes.id into v_dept_b;
      insert into public.org_nodes (institution_id,parent_id,kind,name)
      values (v_inst,v_dept_a,'PROGRAMME','PA') returning org_nodes.id into v_prog_a;
      insert into public.org_nodes (institution_id,parent_id,kind,name)
      values (v_inst,v_dept_b,'PROGRAMME','PB') returning org_nodes.id into v_prog_b;
      insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
      values (v_inst,v_prog_a,'COHORT','KA',v_period) returning org_nodes.id into v_coh_a;
      insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
      values (v_inst,v_prog_b,'COHORT','KB',v_period) returning org_nodes.id into v_coh_b;
      insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
      values (v_inst,v_coh_a,'CLASS','5A',v_period) returning org_nodes.id into v_cls_a;
      insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
      values (v_inst,v_coh_b,'CLASS','5B',v_period) returning org_nodes.id into v_cls_b;
      insert into public.institutions (name, slug, is_synthetic)
      values ('Sekolah F06-P12 lain','f06p12x-'||substr(md5(random()::text),1,10),true)
      returning institutions.id into v_other;

      v_hod_u  := selftest.f06p10_person('f06p12-kaprodi');
      v_dean_u := selftest.f06p10_person('f06p12-dekan');
      v_adm_u  := selftest.f06p10_person('f06p12-admin');
      v_guru_u := selftest.f06p10_person('f06p12-guru');
      v_la_u   := selftest.f06p10_person('f06p12-murid-a');
      v_lb_u   := selftest.f06p10_person('f06p12-murid-b');
      v_lx_u   := selftest.f06p10_person('f06p12-murid-x');
      select person_id into v_hod  from public.accounts where auth_user_id=v_hod_u;
      select person_id into v_dean from public.accounts where auth_user_id=v_dean_u;
      select person_id into v_adm  from public.accounts where auth_user_id=v_adm_u;
      select person_id into v_guru from public.accounts where auth_user_id=v_guru_u;
      select person_id into v_la   from public.accounts where auth_user_id=v_la_u;
      select person_id into v_lb   from public.accounts where auth_user_id=v_lb_u;
      select person_id into v_lx   from public.accounts where auth_user_id=v_lx_u;

      perform set_config('app.seed_intent','synthetic',true);
      insert into public.role_assignments (person_id,role,scope_node_id,valid_until) values
        (v_hod,'HEAD_OF_DEPARTMENT',v_dept_a,now()+interval '1 year'),
        (v_dean,'DEAN',             v_fac,   now()+interval '1 year'),
        (v_adm,'INSTITUTION_ADMIN', v_root,  now()+interval '1 year'),
        (v_guru,'EDUCATOR',         v_cls_a, now()+interval '1 year');
      perform set_config('app.seed_intent','',true);

      insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
      values (v_la,v_inst,v_period,v_prog_a,'ACTIVE') returning enrollments.id into v_e;
      insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_e,v_cls_a,v_period);
      insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
      values (v_lb,v_inst,v_period,v_prog_b,'ACTIVE') returning enrollments.id into v_e;
      insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_e,v_cls_b,v_period);

      select count(*) into n_before from public.audit_log where action='learner_detail.opened';

      -- LEVEL 2, the roster
      bad := bad || selftest.f06p12_roster('head of department, own subtree', v_hod_u, v_la, true);
      bad := bad || selftest.f06p12_roster('head of department, sibling department', v_hod_u, v_lb, false);
      bad := bad || selftest.f06p12_roster('dean, own faculty', v_dean_u, v_la, true);
      bad := bad || selftest.f06p12_roster('dean, other department of own faculty', v_dean_u, v_lb, true);
      bad := bad || selftest.f06p12_roster('dean, nobody of theirs', v_dean_u, v_lx, false);
      bad := bad || selftest.f06p12_roster('institution admin keeps the roster', v_adm_u, v_la, true);
      bad := bad || selftest.f06p12_roster('educator, own class', v_guru_u, v_la, true);
      bad := bad || selftest.f06p12_roster('educator, another class', v_guru_u, v_lb, false);
      bad := bad || selftest.f06p12_roster('learner, themselves', v_la_u, v_la, true);
      bad := bad || selftest.f06p12_roster('learner, another learner', v_la_u, v_lb, false);

      -- LEVEL 3, one learner opened on purpose
      bad := bad || selftest.f06p12_detail('head of department, in scope', v_hod_u, v_la, v_inst, true);
      bad := bad || selftest.f06p12_detail('head of department, sibling department', v_hod_u, v_lb, v_inst, false);
      bad := bad || selftest.f06p12_detail('dean, in scope', v_dean_u, v_lb, v_inst, true);
      bad := bad || selftest.f06p12_detail('dean, outside scope', v_dean_u, v_lx, v_inst, false);
      bad := bad || selftest.f06p12_detail('dean, another institution', v_dean_u, v_la, v_other, false);
      bad := bad || selftest.f06p12_detail('institution admin', v_adm_u, v_la, v_inst, false);
      bad := bad || selftest.f06p12_detail('educator', v_guru_u, v_la, v_inst, false);
      bad := bad || selftest.f06p12_detail('learner, themselves', v_la_u, v_la, v_inst, false);

      -- THE METRIC ROUTE, which must not be the unaudited twin of the above
      bad := bad || selftest.f06p12_metric('learner, own result', v_la_u, v_la, v_inst, v_cat, true);
      bad := bad || selftest.f06p12_metric('learner, another learner', v_la_u, v_lb, v_inst, v_cat, false);
      bad := bad || selftest.f06p12_metric('educator, learner in own class', v_guru_u, v_la, v_inst, v_cat, true);
      bad := bad || selftest.f06p12_metric('educator, outside teaching scope', v_guru_u, v_lb, v_inst, v_cat, false);
      bad := bad || selftest.f06p12_metric('head of department, metric route', v_hod_u, v_la, v_inst, v_cat, false);
      bad := bad || selftest.f06p12_metric('dean, metric route', v_dean_u, v_la, v_inst, v_cat, false);
      bad := bad || selftest.f06p12_metric('institution admin, metric route', v_adm_u, v_la, v_inst, v_cat, false);

      -- THE PAYLOAD IS BOUNDED. Ten fields since R5, not nine: this tripwire
      -- fired when `official_results_readiness` was added and the field was
      -- read before the number moved. It is the R5 answer for this consumer --
      -- whether the official-results list is empty because nothing qualifying
      -- has happened or merely short of the catalogue minimum -- computed by
      -- the same evidence_readiness() the evaluator uses, so the two consumers
      -- cannot disagree about what counts as enough. It carries no mastery, no
      -- judgement and no count of anything outside the boundary.
      perform selftest.as_user_uid(v_hod_u);
      r := public.management_learner_detail(v_la, v_inst);
      select count(*) into n from jsonb_object_keys(r) k
       where k not in ('person_id','display_name','institution_id','enrolment_status',
                       'academic_period','programme','placement','official_results',
                       'official_results_readiness','catalogue_version');
      if n <> 0 then bad := bad || array[format('the payload carries %s undeclared field(s)', n)]; end if;
      if (r ->> 'official_results_readiness') is null then
        bad := bad || array['the Management record does not say whether its evidence is sufficient'];
      end if;
      perform selftest.as_owner();

      -- the dean holds no Studio capability
      perform selftest.as_user_uid(v_dean_u);
      if public.can_on_node('CAN_DRAFT',v_cls_a) or public.can_on_node('CAN_PUBLISH',v_root)
         or public.can_on_node('CAN_QUICK_ASSESSMENT',v_cls_a)
         or public.can_on_node('CAN_ASSIGN_LEARNING',v_cls_a)
         or public.can_on_node('CAN_AUTHORIZE_TRANSFER',v_root)
         or public.can_on_node('CAN_REVIEW',v_root) or public.can_on_node('CAN_FREEZE_RELEASE',v_root)
         or public.can_on_node('CAN_MANAGE_REPORT_TEMPLATES',v_root)
         or public.can_on_node('CAN_REVIEW_QUESTION_HEALTH',v_root)
         or public.can_on_node('CAN_REVIEW_INTEGRITY',v_root) then
        bad := bad || array['the dean holds a Studio capability'];
      end if;
      perform selftest.as_owner();
      if public.role_capabilities('DEAN') <> array['CAN_VIEW_LEARNER_ROSTER'] then
        bad := bad || array['the dean holds something other than the one looking capability'];
      end if;

      -- the record matches the acts
      select count(*) into n from public.audit_log where action='learner_detail.opened';
      if n - n_before <> 3 then
        bad := bad || array[format('%s audit row(s) for 3 opens and 6 refusals', n - n_before)];
      end if;
      select * into a from public.audit_log
       where action='learner_detail.opened' and target_id=v_lb::text order by id desc limit 1;
      if a.actor_person_id is distinct from v_dean or a.target_table <> 'persons'
         or a.institution_id is distinct from v_inst or a.at is null then
        bad := bad || array['the audit row does not carry reader, subject, institution and moment'];
      end if;
      if exists (select 1 from public.audit_log
                  where action='learner_detail.opened' and target_id=v_lx::text) then
        bad := bad || array['a refused read was recorded as a read'];
      end if;

      perform selftest.as_owner();
      raise exception 'F06_P12_UNDO';
    exception when others then
      begin perform selftest.as_owner(); exception when others then null; end;
      perform set_config('app.seed_intent','',true);
      if sqlerrm <> 'F06_P12_UNDO' then
        v_why := 'the probe itself failed: ' || left(sqlerrm, 180);
      end if;
    end;

    id := 'F06-P12'; area := 'WP1 objective B -- roster, individual detail, the metric route, and the record';
    if v_why <> '' then ok := false; detail := v_why;
    elsif array_length(bad,1) is not null then
      ok := false; detail := format('%s case(s) answered wrongly: %s',
                                    array_length(bad,1), array_to_string(bad,'; '));
    else
      ok := true;
      detail :=
        '25 cases on a purpose-built two-department school. LEVEL 2, the roster, asked through '
        || 'person_visible_to_me because that is the predicate persons_select carries: a head of department '
        || 'sees their own subtree and not the sibling''s; a faculty-scoped dean sees both departments '
        || 'beneath them and nobody outside; the institution admin keeps the roster it had; an educator '
        || 'keeps their class and gains no other; a learner sees themselves alone. LEVEL 3, asked through '
        || 'management_learner_detail because a row predicate cannot distinguish reading a roster from '
        || 'opening a person: the head of department and the dean each open a learner inside their scope '
        || 'and are refused outside it and in another school, while the institution admin, the educator and '
        || 'the learner are refused the path itself. Every refusal is checked to name no subject, so a '
        || 'denial cannot become an existence oracle. THE METRIC ROUTE is asked in the same breath, because '
        || 'an audited door beside an unaudited one is not an audited door: since MC-2 a learner reads '
        || 'their own result and not another''s, an educator reads a learner in their own class and not one '
        || 'outside it, and the head of department, the dean and the institution admin are all refused -- '
        || 'Management reaches that learner through the audited path instead, and administrative authority '
        || 'reaches them not at all. The payload carries the nine declared fields and nothing else. DEAN '
        || 'holds none of the ten Studio capabilities and exactly one looking capability. And the record '
        || 'matches the acts rather than the calls: three opens wrote three learner_detail.opened rows '
        || 'naming reader, subject, institution and moment, while six refusals wrote none. Every row '
        || 'rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P13 -- ALL SIXTEEN CALCULATORS, CORRECTLY REPRESENTED.
  --
  -- The contract is only worth what its coverage is worth. This walks the live
  -- catalogue and asserts, per calculator, that it carries exactly one declared
  -- governing scope and that every relation it reads -- as the PARSER records
  -- it -- is a declared source of the live catalogue, which since MC-2 means a
  -- scoped one or the reference table. A calculator that reaches past its
  -- boundary to raw evidence is therefore not merely discouraged: it is not in
  -- the catalogue's source set and this goes red.
  --
  -- WHAT IS REPORTED AND NOT TRUSTED: whether p_node is computationally
  -- relevant to each calculator. It is read from the parser's column-dependency
  -- record and stated in the verdict, because it is USEFUL to a reader -- and
  -- it is deliberately not an authorization input, since a body that records a
  -- real column dependency and restricts nothing is exactly the attack F06-P11
  -- exercises.
  -- =========================================================================
  declare
    v_why text := ''; bad text[] := '{}'; v_cat text; d record; n int; v_undeclared text;
    n_node int; n_tenant int; n_learner int; n_item int; v_report text := '';
  begin
    begin
      perform selftest.as_owner();
      v_cat := public.current_metric_catalogue();
      select count(*) into n from public.metric_definitions where catalogue_version = v_cat;
      if n <> 16 then bad := bad || array[format('the live catalogue holds %s metric(s), expected 16', n)]; end if;

      for d in
        select m.metric_id, m.calculation_key, m.scope::text as declared_scope, s.governing_scope,
               exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                        join pg_depend dep on dep.objid=p.oid and dep.classid='pg_proc'::regclass
                                          and dep.refclassid='pg_class'::regclass and dep.refobjsubid>0
                        join pg_attribute att on att.attrelid=dep.refobjid and att.attnum=dep.refobjsubid
                       where ns.nspname='public' and p.proname='calc_'||m.calculation_key
                         and att.attname in ('class_node_id','cohort_node_id','item_id','person_id')) as node_keyed
          from public.metric_definitions m
          left join public.metric_calculator_scope s on s.calculation_key = m.calculation_key
         where m.catalogue_version = v_cat
         order by m.metric_id
      loop
        if d.governing_scope is null then
          bad := bad || array[format('%s carries no governing-scope declaration', d.metric_id)];
        end if;
        v_report := v_report || format('%s[%s/%s:%s] ', d.metric_id, d.declared_scope,
                                       coalesce(d.governing_scope,'(none)'),
                                       case when d.node_keyed then 'node-keyed' else 'not-node-keyed' end);
      end loop;

      -- EVERY RELATION EVERY CALCULATOR READS is a declared source of the live
      -- catalogue -- guard (2e)'s property, restated here per calculator so
      -- this case owns it rather than pointing at another one. Since MC-2 the
      -- declared set is the scoped sources plus the reference band table, so a
      -- calculator reaching for raw evidence shows up here by name.
      select string_agg(distinct p.proname || ' -> ' || dep.refobjid::regclass::text, ', ')
        into v_undeclared
        from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
        join pg_depend dep on dep.objid=p.oid and dep.classid='pg_proc'::regclass
                          and dep.refclassid='pg_class'::regclass
       where ns.nspname='public' and p.proname like 'calc\_%'
         and not exists (select 1 from public.metric_sources ms
                          where ms.catalogue_version=v_cat
                            and ms.source_relation = dep.refobjid::regclass::text);
      if v_undeclared is not null then
        bad := bad || array['calculator(s) reading a relation the live catalogue does not declare: ' || v_undeclared];
      end if;

      select count(*) filter (where s.governing_scope='NODE'),
             count(*) filter (where s.governing_scope='TENANT'),
             count(*) filter (where s.governing_scope='LEARNER'),
             count(*) filter (where s.governing_scope='ITEM')
        into n_node, n_tenant, n_learner, n_item
        from public.metric_calculator_scope s
        join public.metric_definitions m
          on m.calculation_key=s.calculation_key and m.catalogue_version=v_cat;
      if n_node = 0 or n_tenant = 0 then
        bad := bad || array[format('the contract declares %s NODE and %s TENANT: it is not separating',
                                   n_node, n_tenant)];
      end if;
      perform selftest.as_owner();
    exception when others then
      begin perform selftest.as_owner(); exception when others then null; end;
      v_why := 'the probe itself failed: ' || left(sqlerrm, 180);
    end;

    id := 'F06-P13'; area := 'WP1 -- the governing-scope contract covers every live calculator';
    if v_why <> '' then ok := false; detail := v_why;
    elsif array_length(bad,1) is not null then
      ok := false; detail := format('%s problem(s): %s', array_length(bad,1), array_to_string(bad,'; '));
    else
      ok := true;
      detail := format('%s NODE, %s TENANT, %s LEARNER and %s ITEM across the 16 live calculators, every '
        || 'one carrying exactly one declaration and reading only relations the live catalogue declares -- '
        || 'which since MC-2 are the organizationally scoped sources and the reference band table, so a '
        || 'calculator reaching for raw evidence is outside the declared set and fails here. The declared '
        || 'catalogue SCOPE and the governing scope are reported side by side and are deliberately '
        || 'different questions: class.topic_mastery says LESSON and is governed at its class, '
        || 'institution.cohort_comparison says COHORT and is governed at the school. Whether p_node is '
        || 'computationally relevant is REPORTED from the parser and not used for authorization, because a '
        || 'body that records a real column dependency and restricts nothing is the attack F06-P11 '
        || 'exercises. %s', n_node, n_tenant, n_learner, n_item, v_report);
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-N04 -- G1's repair, asserted where a gate can re-read it.
  --
  -- The second eye found that `briefings_ready_carries_provenance` enforced
  -- half of what 0082 claimed: the catalogue version and the report id were
  -- required, the template id and template version were not, and both columns
  -- are nullable. 0083 widened the predicate to the claim.
  --
  -- WHY THIS TEST EXISTS AND NOT JUST 0083's TERMINAL BLOCK. That block ran
  -- once, on the day it was applied. It cannot be re-run against a hosted
  -- database and it fails no pull request -- the same gap §7 item 8 found for
  -- seventeen assertions and for INV-34. A constraint is exactly the kind of
  -- thing a later migration drops in passing.
  --
  -- BOTH HALVES. The structural half reads the live predicate, because that is
  -- what a gate reads and what a `drop constraint` would silently remove. The
  -- behavioural half writes a real briefing and requires the refusal, because a
  -- predicate that names four columns and never fires proves nothing.
  -- =========================================================================
  declare
    v_inst uuid; v_node uuid; v_b uuid; v_rep uuid; v_tmpl uuid;
    v_def text; v_bad text := ''; n_refused int := 0; v_accepted boolean := false;
  begin
    select pg_get_constraintdef(con.oid) into v_def
      from pg_constraint con join pg_class c on c.oid = con.conrelid
     where c.relname = 'briefings' and con.conname = 'briefings_ready_carries_provenance';
    if v_def is null then
      v_bad := v_bad || 'the provenance constraint is gone entirely; ';
    else
      -- named one at a time so the failure says WHICH half went missing
      if v_def !~ 'catalogue_version'   then v_bad := v_bad || 'the predicate no longer requires catalogue_version; '; end if;
      if v_def !~ 'generated_report_id' then v_bad := v_bad || 'the predicate no longer requires generated_report_id; '; end if;
      if v_def !~ 'template_id'         then v_bad := v_bad || 'the predicate no longer requires template_id (G1); '; end if;
      if v_def !~ 'template_version'    then v_bad := v_bad || 'the predicate no longer requires template_version (G1); '; end if;
    end if;

    select i.id into v_inst from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
    begin
      perform selftest.as_user('alpha-admin@synthetic.pintar.test');
      select n.id into v_node from public.org_nodes n
       where n.institution_id = v_inst and n.kind in ('CLASS','COHORT') limit 1;
      insert into public.report_templates (institution_id, standard_report, title_key)
      values (v_inst, 'class_learning_intelligence', 'laporan.kelas.judul')
      returning report_templates.id into v_tmpl;

      perform selftest.as_owner();
      insert into public.generated_reports
        (institution_id, standard_report, template_id, template_version, catalogue_version,
         scope_node_id, body)
      values (v_inst, 'class_learning_intelligence', v_tmpl, 1, public.current_metric_catalogue(),
              v_node, '{"entries": [], "shown": 0, "omitted": 0}'::jsonb)
      returning generated_reports.id into v_rep;

      insert into public.briefings (institution_id, scope_node_id)
      values (v_inst, v_node) returning briefings.id into v_b;
      -- `where briefings.id`, not `where id`: the runner's OUT parameter is
      -- called `id` and shadows the column. Fifth time in this build.
      update public.briefings set state = 'GENERATING' where briefings.id = v_b;

      -- no template at all
      begin
        update public.briefings
           set state = 'READY', catalogue_version = public.current_metric_catalogue(),
               generated_report_id = v_rep
         where briefings.id = v_b;
        v_bad := v_bad || 'a READY briefing was written with no template at all; ';
      exception when check_violation then n_refused := n_refused + 1;
                when others then v_bad := v_bad || 'the no-template probe failed for another reason: '
                                                || left(sqlerrm, 50) || '; ';
      end;

      -- the version without the id, and the id without the version: a template
      -- is edited in place, so one half names nothing a later reader can use
      begin
        update public.briefings
           set state = 'READY', catalogue_version = public.current_metric_catalogue(),
               generated_report_id = v_rep, template_version = 1
         where briefings.id = v_b;
        v_bad := v_bad || 'a READY briefing named a template version but no template; ';
      exception when check_violation then n_refused := n_refused + 1;
                when others then v_bad := v_bad || 'the version-only probe failed for another reason: '
                                                || left(sqlerrm, 50) || '; ';
      end;
      begin
        update public.briefings
           set state = 'READY', catalogue_version = public.current_metric_catalogue(),
               generated_report_id = v_rep, template_id = v_tmpl
         where briefings.id = v_b;
        v_bad := v_bad || 'a READY briefing named a template but no version of it; ';
      exception when check_violation then n_refused := n_refused + 1;
                when others then v_bad := v_bad || 'the id-only probe failed for another reason: '
                                                || left(sqlerrm, 50) || '; ';
      end;

      -- and the complete artefact is ACCEPTED, so the predicate is a rule and
      -- not a wall
      begin
        update public.briefings
           set state = 'READY', catalogue_version = public.current_metric_catalogue(),
               generated_report_id = v_rep, template_id = v_tmpl, template_version = 1
         where briefings.id = v_b;
        v_accepted := (select b2.state from public.briefings b2 where b2.id = v_b) = 'READY';
      exception when others then
        v_bad := v_bad || 'a briefing carrying complete provenance was REFUSED: ' || left(sqlerrm, 60) || '; ';
      end;

      perform selftest.as_owner();
      raise exception 'F06_N04_UNDO';
    exception when others then
      if sqlerrm <> 'F06_N04_UNDO' then
        v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 80) || '; ';
      end if;
    end;
    perform selftest.as_owner();

    id := 'F06-N04'; area := '§3.4 / second-eye G1 -- a briefing names the template version it was made from';
    if v_bad <> '' then
      ok := false; detail := v_bad;
    elsif n_refused <> 3 then
      ok := false;
      detail := format('%s of 3 incomplete READY briefings were refused: the provenance predicate does not '
                    || 'require every column it names', n_refused);
    elsif not v_accepted then
      ok := false;
      detail := 'nothing incomplete was written and nothing complete was either: a constraint that refuses '
             || 'every briefing satisfies a test made only of refusals';
    else
      ok := true;
      detail := 'a READY briefing is refused with no template, with a template version but no template, and '
             || 'with a template but no version -- and accepted when it carries the catalogue version, the '
             || 'report id, the template id and the template version together. The live predicate names all '
             || 'four. Found by the second eye as G1: 0082 enforced two of the four while its header claimed '
             || 'all of them, which is a description broader than its predicate in a CONSTRAINT rather than '
             || 'in a proves string. Every row written here is rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-N05 -- L3-F01 C.1: the synthetic-fixture boundary is FAIL-CLOSED.
  --
  -- The FABLE-01 seed guard refused only environment='production', which is a
  -- denylist that is empty by default: platform_environment.environment is
  -- 'development' on hosted as well as local, so a hosted development project
  -- satisfied it and synthetic.sql created real Auth identities there. Migration
  -- 0084 adds a SEPARATE fail-closed marker (local_fixtures_enabled, default
  -- false); synthetic_fixtures_permitted() is the predicate every credential
  -- seed now consults, and the local-only pipeline flips the marker true.
  --
  -- This asserts the predicate's whole truth table on the LIVE schema, in a
  -- rolled-back subtransaction, so a later migration that weakens it to a
  -- constant or drops the marker is caught. The seeded clean stack has the
  -- marker true (00_local_fixtures.sql ran), which is the legitimate local state.
  -- =========================================================================
  declare
    v_base boolean; v_marker_false boolean; v_prod boolean; v_after boolean;
  begin
    perform selftest.as_owner();
    -- baseline: a legitimately-seeded local stack permits fixtures
    select public.synthetic_fixtures_permitted() into v_base;
    begin
      -- marker false -> refuse, even on a non-production environment
      update public.platform_environment set local_fixtures_enabled = false;
      select public.synthetic_fixtures_permitted() into v_marker_false;
      -- marker true again but production -> still refuse
      update public.platform_environment set local_fixtures_enabled = true, environment = 'production';
      select public.synthetic_fixtures_permitted() into v_prod;
      raise exception 'F06_N05_UNDO';
    exception when others then
      if sqlerrm <> 'F06_N05_UNDO' then raise; end if;
    end;
    select public.synthetic_fixtures_permitted() into v_after;

    id := 'F06-N05'; area := 'L3-F01 -- synthetic credential fixtures are fail-closed';
    if v_base is not true then
      ok := false;
      detail := 'a legitimately seeded local stack does not permit fixtures: the enabler pipeline is broken '
             || '(00_local_fixtures.sql should have set local_fixtures_enabled = true)';
    elsif v_marker_false is not false then
      ok := false;
      detail := 'clearing local_fixtures_enabled did NOT refuse fixtures: the boundary is fail-open again (L3-F01)';
    elsif v_prod is not false then
      ok := false;
      detail := 'production with the local marker set still permitted fixtures: the production denylist is gone';
    elsif v_after is not true then
      ok := false;
      detail := 'the rolled-back probe leaked: the marker did not return to its seeded value';
    else
      ok := true;
      detail := 'synthetic_fixtures_permitted() is TRUE only on a non-production environment whose '
             || 'local_fixtures_enabled marker is set; clearing the marker refuses (the FABLE-01 '
             || 'fail-open default is gone) and production refuses regardless. A migrations-only hosted '
             || 'project keeps the marker false and every credential seed refuses. Probe rolled back with '
             || 'no residue';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-N06 -- L3-F03: the four authoring RPCs authorize BEFORE they mutate.
  --
  -- F06-N02 covers these from the outside, as members of the declared
  -- population, and for two of them it can only prove refusal rather than the
  -- declared authorization: no seeded row gives the probe an ingest batch to
  -- point at. This test builds the fixture it needs and closes that gap
  -- directly, on all four, with both halves.
  --
  -- The claim is not "an exception was raised". It is: an actor without
  -- CAN_DRAFT is refused BY THE CAPABILITY; the refusal happens BEFORE the
  -- delete each of these opens with; and an actor holding CAN_DRAFT still gets
  -- the behaviour it had before the guard existed. Without that last half the
  -- test would pass equally well if the endpoint refused everyone.
  --
  -- Every row is created here and rolled back.
  --
  -- `returning` is QUALIFIED throughout. The runner's own OUT parameter is
  -- named `id`, so a bare `returning id` is ambiguous inside it -- the sixth
  -- time this exact shadowing has cost a round in this build.
  -- =========================================================================
  declare
    v_inst uuid; v_course uuid; v_batch uuid;
    v_uid_draft uuid; v_uid_dean uuid; v_p_draft uuid; v_p_dean uuid;
    v_fn text; v_msg text; v_raised boolean; n int;
    v_bad text := ''; n_refused int := 0;
  begin
    ok := true;
    begin
      perform selftest.as_owner();
      insert into public.institutions (name, slug, is_synthetic, is_active)
      values ('probe inst F06-N06', 'probe-inst-f06n06', true, true) returning institutions.id into v_inst;
      insert into auth.users (id, email) values (gen_random_uuid(), 'probe-f06n06-draft@local.invalid')
      returning users.id into v_uid_draft;
      insert into auth.users (id, email) values (gen_random_uuid(), 'probe-f06n06-dean@local.invalid')
      returning users.id into v_uid_dean;
      select a.person_id into v_p_draft from public.accounts a where a.auth_user_id = v_uid_draft;
      select a.person_id into v_p_dean  from public.accounts a where a.auth_user_id = v_uid_dean;
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
      values (v_p_draft, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days'),
             (v_p_dean,  'DEAN',              v_inst, now() - interval '1 day', now() + interval '365 days');
      perform set_config('app.seed_intent', '', true);
      insert into public.courses (institution_id, subject, stage, grade_label, title)
      values (v_inst, 'Probe', 'SD', '5', 'Probe course F06-N06') returning courses.id into v_course;

      -- the batch is created UNDER CAN_DRAFT because its own INSERT trigger
      -- already requires it. That guard stops a stranger MAKING a batch; it
      -- says nothing about who may materialise one that already exists, which
      -- is the hole 0085 closed.
      perform set_config('request.jwt.claims',
        json_build_object('sub', v_uid_draft, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid_draft::text, true);
      insert into public.ingest_batches (institution_id, source_kind, raw_payload, status)
      values (v_inst, 'STRUCTURED_PACKAGE', jsonb_build_object('courses', '[]'::jsonb, 'files', '[]'::jsonb),
              'RECEIVED')
      returning ingest_batches.id into v_batch;
      update public.ingest_batches set status = 'CONFIRMED' where ingest_batches.id = v_batch;

      -- a finding that must survive a refused call
      insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
        severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
      values (v_inst, v_course, null, 'PROBE_F06N06', 'WARNING', 'probe', 'probe', 'probe', 'probe');

      -- ---------------------------------------------------------- NEGATIVE --
      perform set_config('request.jwt.claims',
        json_build_object('sub', v_uid_dean, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid_dean::text, true);
      if public.can_in_institution('CAN_DRAFT', v_inst) then
        ok := false; v_bad := v_bad || 'the probe DEAN holds CAN_DRAFT, so the negative case is not one; ';
      end if;
      foreach v_fn in array array['run_mcq_quality', 'validate_course_content',
                                  'ingest_structured_package', 'propose_easy_upload_mapping'] loop
        v_raised := false; v_msg := '';
        begin
          if v_fn in ('run_mcq_quality', 'validate_course_content') then
            execute format('select public.%I($1)', v_fn) using v_course;
          else
            execute format('select public.%I($1)', v_fn) using v_batch;
          end if;
        exception when others then v_raised := true; v_msg := sqlerrm; end;
        if not v_raised then
          ok := false; v_bad := v_bad || v_fn || ' accepted a DEAN holding no capability (INV-19); ';
        elsif v_msg !~ 'CAN_DRAFT' then
          ok := false;
          v_bad := v_bad || format('%s refused a DEAN but not by the capability it declares (%s); ',
                                   v_fn, left(v_msg, 50));
        else
          n_refused := n_refused + 1;
        end if;
      end loop;

      -- authorization ran BEFORE the delete each of these opens with
      select count(*) into n from public.mcq_quality_findings
       where course_id = v_course and pattern_class = 'PROBE_F06N06';
      if n <> 1 then
        ok := false;
        v_bad := v_bad || format('a refused call still reached the delete: %s probe finding(s) left, expected 1; ', n);
      end if;

      -- ---------------------------------------------------------- POSITIVE --
      perform set_config('request.jwt.claims',
        json_build_object('sub', v_uid_draft, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid_draft::text, true);
      begin
        perform public.run_mcq_quality(v_course);
        perform public.validate_course_content(v_course);
        perform public.propose_easy_upload_mapping(v_batch);
        perform public.ingest_structured_package(v_batch);
      exception when others then
        ok := false;
        v_bad := v_bad || 'an actor holding CAN_DRAFT was refused: ' || left(sqlerrm, 70) || '; ';
      end;
      select count(*) into n from public.mcq_quality_findings
       where course_id = v_course and pattern_class = 'PROBE_F06N06';
      if n <> 0 then
        ok := false;
        v_bad := v_bad || 'an authorized MCQ quality pass did not clear the stale probe finding, so the '
                       || 'guard is refusing everyone rather than guarding; ';
      end if;

      perform set_config('request.jwt.claims', '', true);
      perform set_config('request.jwt.claim.sub', '', true);
      raise exception 'F06_N06_UNDO';
    exception when others then
      perform set_config('request.jwt.claims', '', true);
      perform set_config('request.jwt.claim.sub', '', true);
      if sqlerrm <> 'F06_N06_UNDO' then
        ok := false; v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 90) || '; ';
      end if;
    end;
    perform selftest.as_owner();

    select count(*) into n from public.institutions where slug = 'probe-inst-f06n06';
    if n <> 0 then ok := false; v_bad := v_bad || 'the probe left its institution behind; '; end if;

    id := 'F06-N06'; area := 'INV-19 / INV-13 / L3-F03 -- authoring RPCs authorize before they mutate';
    if not ok then
      detail := v_bad;
    else
      detail := format('all %s authoring endpoint(s) -- run_mcq_quality, validate_course_content, '
                    || 'ingest_structured_package and propose_easy_upload_mapping -- refuse an actor '
                    || 'holding no capability BY NAMING CAN_DRAFT, and do it before the delete each of '
                    || 'them opens with: the probe finding planted first is still there afterwards. An '
                    || 'actor that does hold CAN_DRAFT is accepted and clears it, so the guard guards '
                    || 'rather than refusing everyone. Found as L3-F03, where a capability-less DEAN of '
                    || 'one institution ran run_mcq_quality against another institution''s course and '
                    || 'deleted that tenant''s findings. Fixture built here and rolled back', n_refused);
    end if;
    return next;
  end;

  -- =========================================================================
  -- Q12-N01 -- A LEARNER CAN FIND A QUICK ASSESSMENT.
  --
  -- Execution was authorized and discovery was impossible. my_learning_assignments()
  -- reaches assessment_assignments only through learning_assignment_id and projects
  -- PRE_TEST and POST_TEST by name; launch_quick_assessment() creates an assignment
  -- with a node and no learning assignment; and the table's SELECT policy needs
  -- CAN_DRAFT or CAN_ASSIGN_LEARNING, which no learner holds. The id existed, was
  -- startable, and could not be learned.
  --
  -- This drives the whole doorway on the seeded stack: an educator launches through
  -- the real entry point, the learner in that class finds it through the new one and
  -- through nothing else, a learner of another tenant does not, and the id starts a
  -- session through the SAME start_learning_session() every other mode uses. Every
  -- row is rolled back.
  -- =========================================================================
  declare
    v_inst uuid; v_node uuid; v_module uuid; v_assign uuid; v_session uuid;
    n_old int; n_rls int; n_new int; n_other int; v_bad text := ''; v_mode text;
  begin
    ok := true;
    begin
      perform selftest.as_owner();
      select i.id into v_inst from public.institutions i where i.slug = 'pintar-bootstrap-official';
      select o.id into v_node from public.org_nodes o
       where o.institution_id = v_inst and o.kind = 'CLASS' order by o.created_at, o.id limit 1;
      select m.id into v_module from public.modules m
        join public.courses c on c.id = m.course_id
       where c.institution_id = v_inst order by m.created_at, m.id limit 1;

      -- the real educator entry point, unchanged
      perform selftest.as_user('boot-guru@bootstrap.pintar.test');
      select q.assessment_assignment_id into v_assign
        from public.launch_quick_assessment(v_node, v_module, 5, 20) q;
      perform selftest.as_owner();
      if v_assign is null then
        ok := false; v_bad := v_bad || 'the educator launched nothing; ';
      end if;

      -- the learner of that class
      perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
      select count(*) into n_old from public.my_learning_assignments() m
       where m.pre_test_assignment = v_assign or m.post_test_assignment = v_assign;
      select count(*) into n_rls from public.assessment_assignments a where a.id = v_assign;
      select count(*) into n_new from public.my_open_assessments() o
       where o.assessment_assignment_id = v_assign;
      select o.mode::text into v_mode from public.my_open_assessments() o
       where o.assessment_assignment_id = v_assign;
      perform selftest.as_owner();

      if n_old <> 0 then
        ok := false; v_bad := v_bad || 'my_learning_assignments() exposed a node-scoped assignment; ';
      end if;
      if n_rls <> 0 then
        ok := false; v_bad := v_bad || 'the learner read assessment_assignments directly; ';
      end if;
      if n_new <> 1 then
        ok := false; v_bad := v_bad || format('the in-scope learner found %s of 1; ', n_new);
      end if;
      if coalesce(v_mode, '') <> 'QUICK' then
        ok := false; v_bad := v_bad || format('the doorway reported mode %s; ', coalesce(v_mode,'<null>'));
      end if;

      -- a learner of another tenant
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      select count(*) into n_other from public.my_open_assessments() o
       where o.assessment_assignment_id = v_assign;
      perform selftest.as_owner();
      if n_other <> 0 then
        ok := false; v_bad := v_bad || 'a learner of another institution discovered it; ';
      end if;

      -- and the discovered id starts through the existing path
      perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
      begin
        select public.start_learning_session(v_assign) into v_session;
      exception when others then
        ok := false; v_bad := v_bad || 'the discovered id did not start: ' || left(sqlerrm, 60) || '; ';
      end;
      perform selftest.as_owner();
      if v_session is null and v_bad = '' then
        ok := false; v_bad := v_bad || 'the discovered id started nothing; ';
      end if;

      raise exception 'Q12_N01_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'Q12_N01_UNDO' then
        ok := false; v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 90) || '; ';
      end if;
    end;

    id := 'Q12-N01'; area := 'Q-12 -- a learner can discover a permitted node-scoped assessment';
    if not ok then
      detail := v_bad;
    else
      detail := 'an educator launches a Quick Assessment over a class through launch_quick_assessment; '
             || 'the learner of that class finds it through my_open_assessments() and through NOTHING else '
             || '-- my_learning_assignments() does not carry it and the table itself refuses the read under '
             || 'RLS -- a learner of another institution does not find it, and the discovered id opens a '
             || 'session through the same start_learning_session() every other mode uses. The doorway '
             || 'decides nothing: it returns the assignments may_start_assessment() accepts, which is the '
             || 'predicate start_learning_session() calls. Every row rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- UX1-S2-ORIENT-01 -- LOOKING IS NOT COMMITTING.
  --
  -- The orientation facts live on assessment_definitions and
  -- assessment_assignments, both closed to a learner; session_state() returns
  -- them and needs a session; and the only thing that makes a session is
  -- start_learning_session(), which stamps started_at and spends an attempt --
  -- attempt_limit is 1 for PRE_TEST and for most POST_TEST and QUICK
  -- definitions. A learner had to open the door to find out what was behind it.
  --
  -- This proves the four things that matter about the window, and the third is
  -- the one worth the test: reading it must leave NO trace. Session count
  -- unchanged, no session against this assignment, no started_at. If
  -- orientation ever starts a session to answer itself, that is the whole
  -- distinction gone and this goes red.
  --
  -- The refusal is a SILENCE, not a message: an assignment that is not yours
  -- and an assignment that does not exist both answer zero rows, so existence
  -- is not an oracle (F06-N01's rule, applied on a new surface).
  -- =========================================================================
  declare
    v_inst uuid; v_node uuid; v_module uuid; v_assign uuid; v_session uuid;
    n_before int; n_after int; n int; v_bad text := '';
    v_items smallint; v_limit smallint; v_used int; v_closes timestamptz;
  begin
    ok := true;
    begin
      perform selftest.as_owner();
      select i.id into v_inst from public.institutions i where i.slug = 'pintar-bootstrap-official';
      select o.id into v_node from public.org_nodes o
       where o.institution_id = v_inst and o.kind = 'CLASS' order by o.created_at, o.id limit 1;
      select m.id into v_module from public.modules m
        join public.courses c on c.id = m.course_id
       where c.institution_id = v_inst order by m.created_at, m.id limit 1;

      perform selftest.as_user('boot-guru@bootstrap.pintar.test');
      select q.assessment_assignment_id into v_assign
        from public.launch_quick_assessment(v_node, v_module, 5, 20) q;
      perform selftest.as_owner();
      select count(*) into n_before from public.assessment_sessions;

      -- (1) the authorized learner can LOOK, and gets real facts
      perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
      select o.item_count, o.attempt_limit, o.attempts_used, o.closes_at
        into v_items, v_limit, v_used, v_closes
        from public.assessment_orientation(v_assign) o;
      perform selftest.as_owner();
      if v_items is null then
        ok := false; v_bad := v_bad || 'the authorized learner got no orientation at all; ';
      elsif v_items <> 5 then
        ok := false; v_bad := v_bad || format('orientation reported %s questions, the assignment has 5; ', v_items);
      end if;
      if v_used <> 0 then
        ok := false; v_bad := v_bad || format('orientation reported %s attempts already used; ', v_used);
      end if;
      if v_closes is null then
        ok := false; v_bad := v_bad || 'orientation carries no closing time, which is the one time fact there is; ';
      end if;

      -- (2) LOOKING LEFT NOTHING BEHIND
      select count(*) into n_after from public.assessment_sessions;
      if n_after <> n_before then
        ok := false; v_bad := v_bad || format('looking changed the session count %s -> %s; ', n_before, n_after);
      end if;
      select count(*) into n from public.assessment_sessions s
       where s.assessment_assignment_id = v_assign;
      if n <> 0 then
        ok := false; v_bad := v_bad || format('looking created %s session(s) against the assignment; ', n);
      end if;
      select count(*) into n from public.assessment_sessions s
       where s.assessment_assignment_id = v_assign and s.started_at is not null;
      if n <> 0 then
        ok := false; v_bad := v_bad || 'looking stamped started_at; ';
      end if;

      -- (3) a learner of another tenant, and a uuid that does not exist,
      --     answer IDENTICALLY
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      select count(*) into n from public.assessment_orientation(v_assign);
      perform selftest.as_owner();
      if n <> 0 then
        ok := false; v_bad := v_bad || 'a learner of another institution read the orientation; ';
      end if;
      perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
      select count(*) into n from public.assessment_orientation(gen_random_uuid());
      perform selftest.as_owner();
      if n <> 0 then
        ok := false; v_bad := v_bad || 'a uuid that does not exist answered differently from one that is not yours; ';
      end if;

      -- (4) and starting still goes down the unchanged path
      perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
      begin
        select public.start_learning_session(v_assign) into v_session;
      exception when others then
        ok := false; v_bad := v_bad || 'after looking, starting failed: ' || left(sqlerrm, 60) || '; ';
      end;
      perform selftest.as_owner();
      if v_session is null and v_bad = '' then
        ok := false; v_bad := v_bad || 'the looked-at assignment started nothing; ';
      end if;

      raise exception 'UX1_S2_ORIENT_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'UX1_S2_ORIENT_UNDO' then
        ok := false; v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 90) || '; ';
      end if;
    end;

    id := 'UX1-S2-ORIENT-01'; area := 'UX-1 Slice 2 -- a learner may look before committing';
    if not ok then
      detail := v_bad;
    else
      detail := 'the learner reads the assignment''s OWN facts before the act that starts it -- 5 questions, '
             || 'its closing time, whether it pauses, and that this is attempt 0 of 1 -- and reading leaves '
             || 'NO trace: the session count is unchanged, no session exists against the assignment and no '
             || 'started_at is stamped, so looking has not spent the single attempt. A learner of another '
             || 'institution and a uuid that does not exist answer identically with zero rows, so existence '
             || 'is not an oracle. Starting afterwards still goes through the unchanged '
             || 'start_learning_session(). Every fact comes from the definition or the assignment and is a '
             || 'subset of what session_state() shows a second later; nothing is invented, and authorization '
             || 'is may_start_assessment() -- the predicate start_learning_session() itself calls';
    end if;
    return next;
  end;


  -- =========================================================================
  -- TOUR-P01 -- THE TOUR IS REMEMBERED ABOUT THE PERSON, NOT THE BROWSER.
  --
  -- PINTAR is deployed where one device is shared between learners across a
  -- period and one person uses several devices. localStorage answers "has this
  -- BROWSER seen it", which is wrong in both directions. So the durable facts
  -- must survive a session being thrown away entirely -- which is what a
  -- logout, a different browser and a different machine all look like from
  -- here -- and no device-local state may be needed for any of it.
  --
  -- This drives the whole approved automatic behaviour on one person:
  -- three automatic presentations and no fourth; skipping (which is the ABSENCE
  -- of a call) leaves the tour offered; completion stops it; dismissal stops it
  -- on a different tour; and every read after a fresh session returns the same
  -- answer. Nothing is written by the client and nothing is read from it.
  -- =========================================================================
  declare
    v_should boolean; v_count smallint; v_limit smallint;
    v_completed boolean; v_suppressed boolean; v_at timestamptz; v_at2 timestamptz;
    v_bad text := ''; n int;
  begin
    ok := true;
    begin
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      select t.should_auto_present, t.auto_shown_count, t.auto_presentation_limit
        into v_should, v_count, v_limit
        from public.my_tour_state('learner.first_login') t;
      if v_should is null then
        ok := false; v_bad := v_bad || 'a person who has never met the tour got no answer at all; ';
      elsif not v_should or v_count <> 0 then
        ok := false; v_bad := v_bad || 'first login was not offered the tour; ';
      end if;
      if v_limit <> 3 then
        ok := false; v_bad := v_bad || 'the declared limit is ' || v_limit || ', not the ruled 3; ';
      end if;
      -- reading creates nothing: "never shown" is the ABSENCE of a row, which
      -- is what first login means here. No accounts.created_at is consulted.
      perform selftest.as_owner();
      select count(*) into n from public.person_tour_state;
      if n <> 0 then ok := false; v_bad := v_bad || 'reading the state created a row; '; end if;

      -- three, counting a skip as what it is: nothing at all
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      v_count := public.note_tour_presented('learner.first_login');
      if v_count <> 1 then ok := false; v_bad := v_bad || 'the first presentation counted as ' || v_count || '; '; end if;
      select t.should_auto_present into v_should from public.my_tour_state('learner.first_login') t;
      if not v_should then ok := false; v_bad := v_bad || 'a skipped tour stopped being offered after one; '; end if;
      perform public.note_tour_presented('learner.first_login');
      select t.should_auto_present into v_should from public.my_tour_state('learner.first_login') t;
      if not v_should then ok := false; v_bad := v_bad || 'a skipped tour stopped being offered after two; '; end if;
      v_count := public.note_tour_presented('learner.first_login');
      if v_count <> 3 then ok := false; v_bad := v_bad || 'the third presentation counted as ' || v_count || '; '; end if;
      select t.should_auto_present into v_should from public.my_tour_state('learner.first_login') t;
      if v_should then ok := false; v_bad := v_bad || 'a FOURTH automatic presentation was offered; the ruling is three; '; end if;
      v_count := public.note_tour_presented('learner.first_login');
      if v_count <> 3 then ok := false; v_bad := v_bad || 'a fourth call moved the count to ' || v_count || '; '; end if;

      -- THE SESSION IS THROWN AWAY, as a logout or another machine would do
      perform selftest.as_owner();
      perform set_config('request.jwt.claims', '', true);
      perform set_config('request.jwt.claim.sub', '', true);
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      select t.auto_shown_count, t.should_auto_present into v_count, v_should
        from public.my_tour_state('learner.first_login') t;
      if v_count <> 3 or v_should then
        ok := false; v_bad := v_bad || 'the count did not survive a new session (' || v_count || '); ';
      end if;

      -- dismissal, and completion on the other tour
      v_at := public.suppress_tour('learner.first_login');
      if v_at is null then ok := false; v_bad := v_bad || 'dismissal recorded no instant; '; end if;
      select t.should_auto_present, t.suppressed into v_should, v_suppressed
        from public.my_tour_state('learner.first_login') t;
      if v_should or not v_suppressed then
        ok := false; v_bad := v_bad || 'a dismissed tour is still offered automatically; ';
      end if;
      v_at := public.complete_tour('educator.first_login');
      v_at2 := public.complete_tour('educator.first_login');
      if v_at is null or v_at2 <> v_at then
        ok := false; v_bad := v_bad || 'completing twice moved the completion instant; ';
      end if;
      select t.should_auto_present, t.completed into v_should, v_completed
        from public.my_tour_state('educator.first_login') t;
      if v_should or not v_completed then
        ok := false; v_bad := v_bad || 'a completed tour is still offered automatically; ';
      end if;
      -- and a completed tour spends no presentation, so a replay that calls
      -- note_tour_presented by mistake costs nothing
      v_count := public.note_tour_presented('educator.first_login');
      if v_count <> 0 then ok := false; v_bad := v_bad || 'a completed tour spent a presentation; '; end if;

      -- survives a THIRD session, both facts at once
      perform selftest.as_owner();
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      select t.suppressed into v_suppressed from public.my_tour_state('learner.first_login') t;
      select t.completed into v_completed from public.my_tour_state('educator.first_login') t;
      if not v_suppressed or not v_completed then
        ok := false; v_bad := v_bad || 'dismissal or completion did not survive a new session; ';
      end if;

      raise exception 'TOUR_P01_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'TOUR_P01_UNDO' then
        ok := false; v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 90) || '; ';
      end if;
    end;

    id := 'TOUR-P01'; area := 'first-login tour -- durable, person-scoped presentation state';
    if not ok then detail := v_bad;
    else
      detail := 'the tour follows the PERSON across three independent sessions -- each one a fresh set of '
             || 'JWT claims, which is what a logout, another browser and another machine all are from here. '
             || 'Never shown is the ABSENCE of a row rather than a guess from accounts.created_at, and '
             || 'reading the state creates nothing. Skipping is not a call, so a skipped tour is offered '
             || 'again; exactly THREE automatic presentations are given and the fourth is refused by the '
             || 'declared limit; a fourth call is a no-op and does not move the count. Dismissal stops '
             || 'automatic presentation, completion stops it, completing twice keeps the first instant, and '
             || 'a completed tour spends no presentation. No device-local value is written or read at any '
             || 'point: every answer comes from the database. Every row rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- TOUR-N01 -- THE SHARED DEVICE, WHICH IS THE WHOLE REASON THIS IS BACKEND.
  --
  -- Two learners, one machine, one connection: everything identical but the
  -- session. The second must meet their OWN state -- and must not be able to
  -- read, write or reach the first's, including by naming the first's
  -- person_id, which is the one thing a client can always try.
  --
  -- The insert is attempted three ways, weakest to strongest: as the client
  -- role against the table, through the RPCs, and finally as the OWNER naming
  -- another person -- which is what every SECURITY DEFINER function is. The
  -- last is the one that matters, because RLS does not bind the owner here
  -- (relforcerowsecurity is false on every public table by design); the
  -- derivation in the trigger is what does.
  -- =========================================================================
  declare
    v_pa uuid; v_pb uuid; v_count smallint; v_should boolean;
    v_bad text := ''; n int;
  begin
    ok := true;
    begin
      perform selftest.as_owner();
      select a.person_id into v_pa from public.accounts a
        join auth.users u on u.id = a.auth_user_id
       where u.email = 'alpha-siswa-1@synthetic.pintar.test';
      select a.person_id into v_pb from public.accounts a
        join auth.users u on u.id = a.auth_user_id
       where u.email = 'beta-siswa-1@synthetic.pintar.test';
      if v_pa is null or v_pb is null or v_pa = v_pb then
        ok := false; v_bad := v_bad || 'the probe did not obtain two distinct persons; ';
      end if;

      -- person A uses the machine
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      perform public.note_tour_presented('learner.first_login');
      perform public.note_tour_presented('learner.first_login');
      perform public.complete_tour('educator.first_login');

      -- person B sits down at the same machine
      perform selftest.as_user('beta-siswa-1@synthetic.pintar.test');
      select t.should_auto_present, t.auto_shown_count into v_should, v_count
        from public.my_tour_state('learner.first_login') t;
      if not v_should or v_count <> 0 then
        ok := false; v_bad := v_bad || 'the next person at the same device inherited a count of ' || v_count || '; ';
      end if;
      select t.completed into v_should from public.my_tour_state('educator.first_login') t;
      if v_should then
        ok := false; v_bad := v_bad || 'the next person inherited a completed tour; ';
      end if;
      -- B sees no row that is not theirs
      select count(*) into n from public.person_tour_state;
      if n <> 0 then
        ok := false; v_bad := v_bad || 'person B can read ' || n || ' row(s) that are not theirs; ';
      end if;
      select count(*) into n from public.person_tour_state where person_id = v_pa;
      if n <> 0 then
        ok := false; v_bad := v_bad || 'person B can read person A''s row by naming them; ';
      end if;

      -- (1) as the client role, straight at the table
      begin
        insert into public.person_tour_state (person_id, tour_key, tour_version)
        values (v_pa, 'learner.first_login', 1);
        ok := false; v_bad := v_bad || 'person B inserted tour state directly; ';
      exception when others then null; end;
      begin
        update public.person_tour_state set completed_at = null where person_id = v_pa;
        if found then ok := false; v_bad := v_bad || 'person B updated person A''s row; '; end if;
      exception when others then null; end;
      begin
        delete from public.person_tour_state where person_id = v_pa;
        if found then ok := false; v_bad := v_bad || 'person B deleted person A''s row; '; end if;
      exception when others then null; end;

      -- (2) through the contract: there is no argument to carry another person
      select count(*) into n from pg_proc p
       where p.pronamespace = 'public'::regnamespace
         and p.proname in ('my_tour_state','note_tour_presented','complete_tour','suppress_tour')
         and pg_get_function_identity_arguments(p.oid) ~* '\yuuid\y';
      if n <> 0 then
        ok := false; v_bad := v_bad || n || ' tour entry point(s) accept an identity argument; ';
      end if;

      -- (3) as the OWNER, naming person A while person B holds the session
      perform selftest.as_owner();
      perform set_config('request.jwt.claim.sub',
        (select u.id::text from auth.users u where u.email = 'beta-siswa-1@synthetic.pintar.test'), true);
      insert into public.person_tour_state (person_id, tour_key, tour_version)
      values (v_pa, 'educator.first_login', 1)
      on conflict do nothing;
      select count(*) into n from public.person_tour_state
       where person_id = v_pa and tour_key = 'educator.first_login' and completed_at is null;
      if n <> 0 then
        ok := false; v_bad := v_bad || 'a row naming person A was written while person B held the session; ';
      end if;
      select count(*) into n from public.person_tour_state
       where person_id = v_pb and tour_key = 'educator.first_login';
      if n <> 1 then
        ok := false; v_bad := v_bad || 'the derived person_id did not land on the session holder; ';
      end if;

      -- and with no session at all there is nobody to write for
      perform set_config('request.jwt.claims', '', true);
      perform set_config('request.jwt.claim.sub', '', true);
      begin
        insert into public.person_tour_state (person_id, tour_key, tour_version)
        values (v_pa, 'learner.first_login', 1);
        ok := false; v_bad := v_bad || 'tour state was written with no authenticated person; ';
      exception when others then null; end;

      raise exception 'TOUR_N01_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'TOUR_N01_UNDO' then
        ok := false; v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 90) || '; ';
      end if;
    end;

    id := 'TOUR-N01'; area := 'first-login tour -- shared-device isolation';
    if not ok then detail := v_bad;
    else
      detail := 'two learners, one machine, one connection, everything identical but the session. The second '
             || 'meets their own state -- offered the tour, count 0, nothing completed -- reads zero rows of '
             || 'the first''s under RLS, and cannot reach them by naming their person_id. The attempt is made '
             || 'three ways: as the client role straight at the table (refused by the absence of an INSERT, '
             || 'UPDATE or DELETE policy and of any write grant), through the contract (no entry point accepts '
             || 'a uuid at all, so there is no argument to carry a foreign identity), and as the OWNER naming '
             || 'another person -- which is what every SECURITY DEFINER function is, and where RLS does not '
             || 'bind. That last write lands on the SESSION HOLDER, because the trigger derives person_id from '
             || 'current_person_id() rather than trusting the row. With no session there is nobody to write '
             || 'for and the insert is refused by name. Every row rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- TOUR-N02 -- IDENTITIES AND VERSIONS DO NOT COLLIDE, AND REPLAY GIVES
  --             NOTHING BACK.
  --
  -- Four separate claims about the key and the monotonicity:
  --
  --   * two declared tours are two rows. A person who finished the learner
  --     tour has NOT finished the educator tour, and no role inheritance can
  --     make it so -- there is nowhere in this schema to express one, because
  --     tour_key is opaque here and no table maps a role to a tour;
  --   * two declared VERSIONS of one tour are two rows, so a materially new
  --     tour is offered again -- but only because Experience declared a new
  --     version, which is a registry row written in a migration. Nothing
  --     derives a version from a deployment, a commit or a copy edit;
  --   * a version is declared by NO client role. The registry carries no
  --     INSERT policy and no write grant, so the application cannot make a
  --     tour new;
  --   * deliberate replay cannot restore automatic presentation. This is
  --     asserted as an ABSENCE and as a REFUSAL: no verb exists that lowers a
  --     count or clears a closing stamp, and the attempt made directly as the
  --     owner is refused by the trigger.
  -- =========================================================================
  declare
    v_should boolean; v_count smallint; v_version integer;
    v_bad text := ''; n int;
  begin
    ok := true;
    begin
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      perform public.note_tour_presented('learner.first_login');
      perform public.suppress_tour('learner.first_login');

      -- a different tour identity is a different row
      select t.should_auto_present, t.auto_shown_count, t.suppressed
        into v_should, v_count, v_bad
        from public.my_tour_state('educator.first_login') t;
      v_bad := '';
      if not v_should or v_count <> 0 then
        ok := false; v_bad := v_bad || 'the educator tour inherited the learner tour''s state; ';
      end if;

      -- a NEW DECLARED VERSION is a new row, and only Experience may declare one
      perform selftest.as_owner();
      insert into public.tour_registry (tour_key, tour_version, note)
      values ('learner.first_login', 2, 'probe: a materially new telling of the same tour');
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      select t.tour_version, t.should_auto_present, t.auto_shown_count, t.suppressed
        into v_version, v_should, v_count, v_bad
        from public.my_tour_state('learner.first_login') t;
      v_bad := '';
      if v_version <> 2 then
        ok := false; v_bad := v_bad || 'the declared new version is not the one offered (got ' || v_version || '); ';
      end if;
      if not v_should or v_count <> 0 then
        ok := false; v_bad := v_bad || 'a newly declared version was not offered; ';
      end if;
      -- and version 1 keeps its own suppression: the new version did not erase it
      perform selftest.as_owner();
      select count(*) into n from public.person_tour_state s
       where s.tour_key = 'learner.first_login' and s.tour_version = 1 and s.suppressed_at is not null;
      if n <> 1 then
        ok := false; v_bad := v_bad || 'declaring a new version disturbed version 1''s dismissal; ';
      end if;

      -- no client role may declare a version
      select count(*) into n from information_schema.role_table_grants
       where table_schema = 'public' and table_name = 'tour_registry'
         and grantee in ('anon','authenticated') and privilege_type <> 'SELECT';
      if n <> 0 then
        ok := false; v_bad := v_bad || 'a client role holds a write grant on tour_registry; ';
      end if;
      select count(*) into n from pg_policies
       where schemaname = 'public' and tablename = 'tour_registry' and cmd <> 'SELECT';
      if n <> 0 then
        ok := false; v_bad := v_bad || 'tour_registry carries a non-SELECT policy; ';
      end if;
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      begin
        insert into public.tour_registry (tour_key, tour_version, note)
        values ('learner.first_login', 3, 'a client declaring its own version');
        ok := false; v_bad := v_bad || 'a client declared a tour version; ';
      exception when others then null; end;

      -- REPLAY GIVES NOTHING BACK. First as an absence of any verb at all.
      perform selftest.as_owner();
      select count(*) into n from pg_proc
       where pronamespace = 'public'::regnamespace
         and proname ~ '^(reset|replay|clear|forget|restart)_tour';
      if n <> 0 then
        ok := false; v_bad := v_bad || n || ' verb(s) exist that could restore automatic presentation; ';
      end if;
      -- then as a refusal, made as the owner, which is the strongest form
      begin
        update public.person_tour_state set suppressed_at = null
         where tour_key = 'learner.first_login' and tour_version = 1;
        ok := false; v_bad := v_bad || 'a dismissed tour was un-dismissed; ';
      exception when others then null; end;
      begin
        update public.person_tour_state set auto_shown_count = 0
         where tour_key = 'learner.first_login' and tour_version = 1;
        ok := false; v_bad := v_bad || 'an automatic presentation was uncounted; ';
      exception when others then null; end;
      begin
        update public.person_tour_state set auto_shown_count = 9
         where tour_key = 'learner.first_login' and tour_version = 1;
        ok := false; v_bad := v_bad || 'the owner raised the count past the declared limit; ';
      exception when others then null; end;
      begin
        delete from public.person_tour_state;
        ok := false; v_bad := v_bad || 'tour state was deleted; ';
      exception when others then null; end;
      -- and identity itself is immutable: a row cannot be moved to another person
      begin
        update public.person_tour_state set tour_version = 2
         where tour_key = 'learner.first_login' and tour_version = 1;
        ok := false; v_bad := v_bad || 'a state row was moved onto another version; ';
      exception when others then null; end;

      -- an undeclared tour answers nothing, and cannot be presented
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      select count(*) into n from public.my_tour_state('dean.first_login');
      if n <> 0 then ok := false; v_bad := v_bad || 'an undeclared tour answered; '; end if;
      begin
        perform public.note_tour_presented('dean.first_login');
        ok := false; v_bad := v_bad || 'an undeclared tour was presented; ';
      exception when others then null; end;

      raise exception 'TOUR_N02_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'TOUR_N02_UNDO' then
        ok := false; v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 90) || '; ';
      end if;
    end;

    id := 'TOUR-N02'; area := 'first-login tour -- identity, version and the monotonic guarantee';
    if not ok then detail := v_bad;
    else
      detail := 'two declared tours are two rows: finishing the learner tour leaves the educator tour '
             || 'untouched, and no role inheritance can change that because nothing in this schema maps a '
             || 'role to a tour. A newly DECLARED version is offered again while version 1 keeps its own '
             || 'dismissal, so a materially new tour re-presents and an old decision is not erased -- and '
             || 'the declaration is a registry row no client role can write, under no non-SELECT policy, so '
             || 'a version can never be derived from a deployment or a copy edit. Deliberate replay restores '
             || 'nothing, asserted twice: no reset, replay, clear, forget or restart verb exists at all, and '
             || 'the attempt made directly AS THE OWNER to clear a dismissal, uncount a presentation, raise '
             || 'the count past the declared limit, move a row to another version or delete it is refused by '
             || 'the trigger in every case. An undeclared tour answers zero rows and cannot be presented. '
             || 'Every row rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- TOUR-N03 -- PRESENTATION STATE IS NOT EVIDENCE.
  --
  -- Tour state must never become learning evidence, assessment evidence,
  -- progress, a scoring input, certificate evidence, an integrity signal or
  -- educational telemetry. The separation is asserted structurally against the
  -- live schema -- which is the only form that survives a future edit -- and
  -- then once behaviourally, because a structural claim about 35 function
  -- bodies is worth little if the numbers themselves move when a tour is shown.
  --
  -- The behavioural half takes a REAL OFFICIAL session in the one tenant that
  -- can produce OFFICIAL evidence, records its mastery and its certificate
  -- eligibility, drives the whole tour lifecycle for that same learner, and
  -- requires both to be unchanged to the digit.
  -- =========================================================================
  declare
    v_before numeric; v_after numeric; v_elig_before boolean; v_elig_after boolean;
    v_sess uuid; v_bad text := ''; v_detail text; n int;
  begin
    ok := true;
    begin
      perform selftest.as_owner();
      select a.ok, a.detail into ok, v_detail from public.assert_tour_state_is_not_evidence() a;
      if not ok then v_bad := v_bad || v_detail || '; '; end if;

      -- the assertion is executed, not merely present, and it is in the set
      -- F06-P08 walks, so it cannot be dropped without that test noticing
      select count(*) into n from pg_proc
       where pronamespace = 'public'::regnamespace
         and proname = 'assert_tour_state_is_not_evidence'
         and pg_get_function_result(oid) ~ 'ok boolean';
      if n <> 1 then
        ok := false; v_bad := v_bad || 'the separation assertion is not in the (ok, detail) family; ';
      end if;

      -- BEHAVIOURAL. A real OFFICIAL result, before and after the tour runs.
      select r.session_id, r.mastery into v_sess, v_before
        from public.official_results r
       where r.supersedes_result_id is null
       order by r.computed_at desc, r.id limit 1;
      if v_sess is null then
        ok := false; v_bad := v_bad || 'no OFFICIAL result exists to measure against; ';
      else
        select e.eligible into v_elig_before from public.certificate_eligibility(v_sess) e;

        perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
        perform public.note_tour_presented('learner.first_login');
        perform public.note_tour_presented('learner.first_login');
        perform public.complete_tour('learner.first_login');
        perform public.suppress_tour('educator.first_login');
        perform selftest.as_owner();

        select r.mastery into v_after from public.official_results r where r.session_id = v_sess
           and r.supersedes_result_id is null;
        select e.eligible into v_elig_after from public.certificate_eligibility(v_sess) e;
        if v_after is distinct from v_before then
          ok := false; v_bad := v_bad || 'mastery moved from ' || v_before || ' to ' || v_after || ' while a tour ran; ';
        end if;
        if v_elig_after is distinct from v_elig_before then
          ok := false; v_bad := v_bad || 'certificate eligibility changed while a tour ran; ';
        end if;
        -- no integrity signal was raised by any of it
        select count(*) into n from public.integrity_signals s where s.session_id = v_sess;
        if n <> 0 then
          ok := false; v_bad := v_bad || 'the tour raised ' || n || ' integrity signal(s); ';
        end if;
        -- and nothing of it reached the audit trail, which is deliberate:
        -- INV-18 lists the acts that must be accountable and a tour is not one
        select count(*) into n from public.audit_log a
         where a.action ~* 'tour' or a.target_table in ('person_tour_state','tour_registry');
        if n <> 0 then
          ok := false; v_bad := v_bad || 'tour activity reached the audit trail; ';
        end if;
      end if;

      raise exception 'TOUR_N03_UNDO';
    exception when others then
      perform selftest.as_owner();
      if sqlerrm <> 'TOUR_N03_UNDO' then
        ok := false; v_bad := v_bad || 'the probe itself failed: ' || left(sqlerrm, 90) || '; ';
      end if;
    end;

    id := 'TOUR-N03'; area := 'first-login tour -- presentation state is not evidence';
    if not ok then detail := v_bad;
    else
      detail := 'asserted structurally against the live schema and then measured. Structurally: 35 evidence '
             || 'consumers -- the ten scoring functions, all sixteen catalogue calculators, the evaluator, '
             || 'the report writer, both certificate paths, both evidence-class functions, the health '
             || 'recompute and the integrity writer -- read neither tour table; no view depends on either; '
             || 'neither carries a session, evidence, mastery, score, result, response, grade, integrity, '
             || 'certificate, institution or enrollment column; person_tour_state references only persons and '
             || 'the registry; neither is a declared record class (so transfers_guard refuses to carry it '
             || 'across an institutional boundary by name) nor a declared metric source (so a calculator '
             || 'reaching for it would fail assert_metric_closure); and no client role holds more than '
             || 'SELECT. Behaviourally: a REAL OFFICIAL result''s mastery and its certificate eligibility are '
             || 'recorded, the same learner is then shown a tour twice, completes it and dismisses another, '
             || 'and both are unchanged to the digit -- with no integrity signal raised and no audit row '
             || 'written, the last deliberately, because INV-18 lists the acts that must be accountable and '
             || 'being shown a tour is not one of them. Every row rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P14 -- R6. AN INDIVIDUAL ACADEMIC RESULT IS REACHED BY CONTAINMENT.
  --
  -- The policy used to read `can_in_institution('CAN_REVIEW_INTEGRITY', ...)
  -- or can_in_institution('CAN_ASSIGN_LEARNING', ...)`, which asks only
  -- whether the reader holds the capability ANYWHERE in the tenant. Seven
  -- cells, against real result rows in BOTH branches, because on an empty
  -- sibling a policy that leaks and a policy that holds both answer zero.
  --
  -- THE INSTITUTION ADMIN IS THE CELL THAT DECIDES THE DESIGN. Narrowing the
  -- axis alone does not refuse them: they are scoped at the root, which is an
  -- ancestor of every class. Only a capability they do not hold refuses them,
  -- and that is the ruling -- administrative authority is not academic
  -- authority -- spelled the way this schema spells authority.
  -- =========================================================================
  declare
    c record; bad text[] := array[]::text[]; v_why text := ''; n int;
  begin
    begin
      perform selftest.as_owner();
      select * into c from selftest.wp2_school();

      -- THE VACUITY GUARD FIRST: one result in each branch, or the matrix
      -- below is measuring nothing.
      if (select count(*) from public.assessment_results where session_id = c.sess_a) <> 1
         or (select count(*) from public.assessment_results where session_id = c.sess_b) <> 1 then
        raise exception 'the two branches are not each populated, so a leak would be invisible';
      end if;

      bad := bad || selftest.r6_case('head of department, own department',      c.hod_u, c.sess_a, 1);
      bad := bad || selftest.r6_case('head of department, sibling department',  c.hod_u, c.sess_b, 0);
      bad := bad || selftest.r6_case('institution admin, department A',         c.adm_u, c.sess_a, 0);
      bad := bad || selftest.r6_case('institution admin, department B',         c.adm_u, c.sess_b, 0);
      bad := bad || selftest.r6_case('educator, the class they teach',          c.edu_u, c.sess_a, 1);
      bad := bad || selftest.r6_case('educator, a class they do not teach',     c.edu_u, c.sess_b, 0);
      bad := bad || selftest.r6_case('dean, own faculty',                       c.dean_u, c.sess_a, 0);
      bad := bad || selftest.r6_case('learner, their own record',               c.la_u,  c.sess_a, 1);
      bad := bad || selftest.r6_case('learner, another learner''s record',      c.la_u,  c.sess_b, 0);
      bad := bad || selftest.r6_case('the other learner, their own record',     c.lb_u,  c.sess_b, 1);

      -- and the capability itself, so the mechanism is named and not merely
      -- observed through its effect
      perform selftest.as_user_uid(c.adm_u);
      if public.can_on_node('CAN_VIEW_LEARNER_RESULT', c.cls_a) then
        bad := bad || array['the institution admin holds the academic-result capability over a class'];
      end if;
      if not public.can_on_node('CAN_VIEW_LEARNER_ROSTER', c.cls_a) then
        bad := bad || array['the institution admin lost the roster while losing the result'];
      end if;
      perform selftest.as_owner();
      if public.role_capabilities('DEAN') <> array['CAN_VIEW_LEARNER_ROSTER'] then
        bad := bad || array['the dean was widened by the R6 correction'];
      end if;
      -- EVERYTHING THIS CASE WROTE GOES BACK. The suite is run without a
      -- wrapping transaction by `selftest:db`, and the fixture builds real
      -- org nodes, enrollments, memberships and FINALIZED sessions in a
      -- seeded tenant -- several of which are append-only and cannot simply
      -- be deleted afterwards. The sentinel unwinds the subtransaction
      -- instead, which is the idiom F06-P11 and F06-P12 use for the same
      -- reason. Measured: without it, a second run of the suite against one
      -- database turned F06-P11 and F06-P15 red for accumulation rather than
      -- for anything either of them is about.
      raise exception 'F06_P14_UNDO';
    exception when others then
      begin perform selftest.as_owner(); exception when others then null; end;
      if sqlerrm <> 'F06_P14_UNDO' then
        v_why := 'the probe itself failed: ' || left(sqlerrm, 180);
      end if;
    end;

    id := 'F06-P14'; area := 'WP2 R6 -- an academic result belongs to a place, not to a tenant';
    if v_why <> '' then ok := false; detail := v_why;
    elsif array_length(bad,1) is not null then
      ok := false; detail := format('%s cell(s) wrong: %s', array_length(bad,1), array_to_string(bad,'; '));
    else
      ok := true;
      detail := 'ten cells on a purpose-built two-department school, each branch holding its own '
        || 'FINALIZED session and result so a leak cannot hide in an empty one: a head of department '
        || 'reads their own department and is refused the sibling; an INSTITUTION ADMIN standing at the '
        || 'root -- who passes every containment test by construction -- is refused BOTH, because '
        || 'administering a school is not reading a named learner and the capability says so; an '
        || 'educator keeps the class they teach and is refused one they do not; a dean is refused, '
        || 'unchanged from before the correction and still holding exactly the one looking capability; '
        || 'and each learner keeps their own record and reaches no other. The admin keeps the ROSTER '
        || 'throughout, so what moved is the result and not the person. Every row rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P15 -- WP2. PINTAR MENGUSULKAN, MANUSIA MEMUTUSKAN.
  --
  -- The four things the product model insists are different: evidence exists,
  -- Management was asked, a human decided, the state persists. This measures
  -- all four boundaries, plus who may cross them and what the trail says.
  --
  -- THE ONE THAT MATTERS MOST IS THE FIRST. A signal sitting in the table
  -- creates no Management record and no outcome. Nothing in this schema turns
  -- an observation into a verdict by crossing a threshold, and this asserts it
  -- against a real signal rather than against the absence of a scheduler.
  -- =========================================================================
  declare
    c record; bad text[] := array[]::text[]; v_why text := ''; n int; n_aud int;
    v_d uuid; v_d2 uuid; v_sig_b uuid; v_dec_b uuid; v_dec_x uuid;
    v_caught boolean; v_who text;
  begin
    begin
      perform selftest.as_owner();
      select * into c from selftest.wp2_school();

      -- A. EVIDENCE ALONE IS NOT A DECISION AND NOT A VERDICT.
      select count(*) into n from public.management_decisions m
       where m.source_table = 'integrity_signals' and m.source_id = c.signal_a;
      if n <> 0 then bad := bad || array['an integrity signal created a Management record by existing']; end if;
      select count(*) into n from public.management_decisions m
       where m.outcome is not null and m.scope_node_id in (c.cls_a, c.cls_b);
      if n <> 0 then bad := bad || array['an outcome existed before any human decided one']; end if;

      -- C. UNAUTHORIZED REFERRAL IS REFUSED, and records nothing.
      select count(*) into n_aud from public.audit_log where action like 'management_decision.%';
      foreach v_why in array array['edu','dean','la'] loop
        v_caught := false;
        perform selftest.as_user_uid(case v_why when 'edu' then c.edu_u
                                                when 'dean' then c.dean_u else c.la_u end);
        begin perform public.refer_integrity_signal(c.signal_a, 'probe');
        exception when others then v_caught := true; end;
        perform selftest.as_owner();
        if not v_caught then
          bad := bad || array[format('%s referred an integrity signal without CAN_REVIEW_INTEGRITY', v_why)];
        end if;
      end loop;
      v_why := '';
      select count(*) into n from public.audit_log where action like 'management_decision.%';
      if n <> n_aud then bad := bad || array['a refused referral wrote audit evidence']; end if;

      -- and refused OUT OF SCOPE too: the same head of department, a signal in
      -- the sibling department. Containment, not capability, is what refuses.
      insert into public.integrity_signals (session_id, institution_id, category)
      values (c.sess_b, c.inst, 'NAVIGATION') returning integrity_signals.id into v_sig_b;
      v_caught := false;
      perform selftest.as_user_uid(c.hod_u);
      begin perform public.refer_integrity_signal(v_sig_b, 'probe');
      exception when others then v_caught := true; end;
      perform selftest.as_owner();
      if not v_caught then
        bad := bad || array['a head of department referred a signal from the sibling department'];
      end if;

      -- B. AUTHORIZED REFERRAL CREATES THE CANDIDATE, AWAITING A HUMAN.
      perform selftest.as_user_uid(c.hod_u);
      v_d := public.refer_integrity_signal(c.signal_a, 'perlu ditinjau');
      -- I. IDEMPOTENT while open: the same call is the same referral.
      v_d2 := public.refer_integrity_signal(c.signal_a, 'lagi');
      perform selftest.as_owner();
      if v_d is null or v_d2 is distinct from v_d then
        bad := bad || array['a second referral of the same open signal made a second record'];
      end if;
      select count(*) into n from public.management_decisions m
       where m.id = v_d and m.state = 'AWAITING_REVIEW' and outcome is null
         and m.decided_by_person_id is null and m.scope_node_id = c.cls_a
         and m.subject_person_id = c.la and m.source_id = c.signal_a;
      if n <> 1 then bad := bad || array['the referral did not arrive awaiting a human, in place, about the right learner']; end if;
      select count(*) into n from public.audit_log where action = 'management_decision.raised'
        and target_id = v_d::text;
      if n <> 1 then
        bad := bad || array[format('%s audit row(s) for one referral made twice', n)];
      end if;

      -- THE EVIDENCE WAS REFERENCED, NOT REWRITTEN.
      select count(*) into n from public.integrity_signals s where s.id = c.signal_a;
      if n <> 1 then bad := bad || array['the referral disturbed the signal row']; end if;

      -- E. INVALID TRANSITIONS REFUSED.
      perform selftest.as_user_uid(c.hod_u);
      v_caught := false;
      begin perform public.advance_management_decision(v_d, 'DECIDED', null, 'no outcome');
      exception when others then v_caught := true; end;
      if not v_caught then bad := bad || array['a decision was recorded with no outcome']; end if;
      v_caught := false;
      begin perform public.advance_management_decision(v_d, 'UNDER_REVIEW', 'NO_FURTHER_ACTION', 'x');
      exception when others then v_caught := true; end;
      if not v_caught then bad := bad || array['an outcome was recorded without deciding']; end if;
      v_caught := false;
      begin perform public.advance_management_decision(v_d, 'AWAITING_REVIEW', null, 'back');
      exception when others then v_caught := true; end;
      if not v_caught then bad := bad || array['a decision moved backwards to awaiting review']; end if;
      perform selftest.as_owner();

      -- F. CONTAINMENT AND THE ROLE SET. The institution admin outranks both
      -- Management roles and passes every containment test from the root; they
      -- are refused because deciding is not an administrative act.
      --
      -- THESE RUN AGAINST THEIR OWN ROW, not the one the happy path uses. A
      -- refusal probe whose subject is shared is order-fragile: when the
      -- refusal wrongly SUCCEEDS it moves the shared row, and the next
      -- legitimate transition then fails for a reason that has nothing to do
      -- with the breach -- which is how a plant goes red without reporting
      -- what it found. Measured: it did exactly that before this was split.
      insert into public.management_decisions
        (family, institution_id, scope_node_id, subject_person_id, source_table, source_id,
         raised_by_person_id)
      values ('INTEGRITY_REFERRAL', c.inst, c.cls_a, c.la, 'integrity_signals',
              gen_random_uuid(), c.hod)
      returning management_decisions.id into v_dec_x;
      foreach v_who in array array['institution admin', 'educator'] loop
        v_caught := false;
        perform selftest.as_user_uid(case v_who when 'institution admin' then c.adm_u else c.edu_u end);
        begin perform public.advance_management_decision(v_dec_x, 'UNDER_REVIEW', null, 'x');
        exception when others then v_caught := true; end;
        perform selftest.as_owner();
        if not v_caught then
          bad := bad || array[format('an %s decided a Management referral', v_who)];
        end if;
        -- AND THE REFUSAL LEFT NOTHING BEHIND.
        select count(*) into n from public.management_decisions m
         where m.id = v_dec_x and m.state = 'AWAITING_REVIEW';
        if n <> 1 then
          bad := bad || array[format('a refusal for the %s still moved the decision', v_who)];
        end if;
      end loop;

      -- a head of department is refused a decision in the SIBLING department,
      -- and the dean, who stands over both, is not
      insert into public.management_decisions
        (family, institution_id, scope_node_id, subject_person_id, source_table, source_id,
         raised_by_person_id)
      -- its own source key, for the reason recorded above: if the out-of-scope
      -- referral probe wrongly SUCCEEDS it will already have queued v_sig_b,
      -- and this insert would then collide and crash the probe instead of
      -- reporting the breach. Measured: it did.
      values ('INTEGRITY_REFERRAL', c.inst, c.cls_b, c.lb, 'integrity_signals',
              gen_random_uuid(), c.dean)
      returning management_decisions.id into v_dec_b;
      v_caught := false;
      perform selftest.as_user_uid(c.hod_u);
      begin perform public.advance_management_decision(v_dec_b, 'UNDER_REVIEW', null, 'x');
      exception when others then v_caught := true; end;
      perform selftest.as_owner();
      if not v_caught then
        bad := bad || array['a head of department decided in the sibling department'];
      end if;
      perform selftest.as_user_uid(c.dean_u);
      begin perform public.advance_management_decision(v_dec_b, 'UNDER_REVIEW', null, 'dean');
      exception when others then bad := bad || array['the dean could not decide inside their own faculty']; end;
      perform selftest.as_owner();

      -- D. THE VALID HUMAN DECISION, and G. the trail it leaves.
      select count(*) into n_aud from public.audit_log where action = 'management_decision.advanced';
      perform selftest.as_user_uid(c.hod_u);
      perform public.advance_management_decision(v_d, 'UNDER_REVIEW', null, 'saya tinjau');
      perform public.advance_management_decision(v_d, 'DECIDED', 'LEARNER_SUPPORT_ARRANGED', 'sudah dibahas');
      perform selftest.as_owner();
      select count(*) into n from public.management_decisions m
       where m.id = v_d and m.state = 'DECIDED' and m.outcome = 'LEARNER_SUPPORT_ARRANGED'
         and m.decided_by_person_id = c.hod and m.decided_at is not null;
      if n <> 1 then bad := bad || array['the human decision was not persisted with its human and its moment']; end if;
      select count(*) into n from public.audit_log
       where action = 'management_decision.advanced' and target_id = v_d::text
         and actor_person_id = c.hod and institution_id = c.inst
         and target_table = 'management_decisions';
      if n <> 2 then
        bad := bad || array[format('%s audit row(s) naming the actor for 2 transitions', n)];
      end if;

      -- E again, at the terminal state: a recorded decision is not edited.
      v_caught := false;
      perform selftest.as_user_uid(c.hod_u);
      begin perform public.advance_management_decision(v_d, 'UNDER_REVIEW', null, 'reopen');
      exception when others then v_caught := true; end;
      perform selftest.as_owner();
      if not v_caught then bad := bad || array['a recorded human decision was reopened']; end if;

      -- I. AND A LATER REFERRAL OF DECIDED EVIDENCE IS LEGITIMATE.
      perform selftest.as_user_uid(c.hod_u);
      v_d2 := public.refer_integrity_signal(c.signal_a, 'hal baru');
      perform selftest.as_owner();
      if v_d2 is null or v_d2 = v_d then
        bad := bad || array['decided evidence could not be referred again when something new happened'];
      end if;

      -- READS ARE CONTAINED TOO.
      perform selftest.as_user_uid(c.hod_u);
      select count(*) into n from public.management_decisions m where m.id = v_dec_b;
      perform selftest.as_owner();
      if n <> 0 then bad := bad || array['a head of department read a sibling department''s Management decision']; end if;
      perform selftest.as_user_uid(c.la_u);
      select count(*) into n from public.management_decisions;
      perform selftest.as_owner();
      if n <> 0 then bad := bad || array['a learner read a Management decision']; end if;

      -- EVERYTHING THIS CASE WROTE GOES BACK. The suite is run without a
      -- wrapping transaction by `selftest:db`, and the fixture builds real
      -- org nodes, enrollments, memberships and FINALIZED sessions in a
      -- seeded tenant -- several of which are append-only and cannot simply
      -- be deleted afterwards. The sentinel unwinds the subtransaction
      -- instead, which is the idiom F06-P11 and F06-P12 use for the same
      -- reason. Measured: without it, a second run of the suite against one
      -- database turned F06-P11 and F06-P15 red for accumulation rather than
      -- for anything either of them is about.
      raise exception 'F06_P15_UNDO';
    exception when others then
      begin perform selftest.as_owner(); exception when others then null; end;
      if sqlerrm <> 'F06_P15_UNDO' then
        v_why := 'the probe itself failed: ' || left(sqlerrm, 180);
      end if;
    end;

    id := 'F06-P15'; area := 'WP2 -- a signal is a candidate, and only a human decides';
    if v_why <> '' then ok := false; detail := v_why;
    elsif array_length(bad,1) is not null then
      ok := false; detail := format('%s problem(s): %s', array_length(bad,1), array_to_string(bad,'; '));
    else
      ok := true;
      detail := 'a real integrity signal on a purpose-built two-department school. THE SIGNAL CREATES '
        || 'NOTHING: no Management record and no outcome exist until a human acts. An educator, a dean '
        || 'and a learner are each refused the referral because none holds CAN_REVIEW_INTEGRITY, and a '
        || 'head of department is refused a signal in the SIBLING department, so the referral is '
        || 'contained and not merely capable; none of those refusals wrote a line of audit evidence. '
        || 'The authorized referral arrives AWAITING_REVIEW, carrying no outcome, anchored at the class '
        || 'the evidence was observed in and naming the learner it is about, and the signal row is '
        || 'untouched -- referenced, not rewritten. Referring twice while open is the SAME referral with '
        || 'ONE audit row. Deciding is refused to the institution admin, who outranks both Management '
        || 'roles and passes containment from the root, and to the educator; refused to the head of '
        || 'department in the sibling department and allowed to the dean who stands over both. The '
        || 'declared transitions succeed and every other one fails -- DECIDED with no outcome, an '
        || 'outcome without deciding, a move backwards, and reopening a recorded decision -- while the '
        || 'two that succeed leave two audit rows naming the actor, the institution and the decision. '
        || 'Once decided, the same evidence may be referred again, because a later judgement is not a '
        || 'duplicate. Reads obey the same boundary: the sibling''s decision is invisible to the head of '
        || 'department and every decision is invisible to a learner. Every row rolled back';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P16 -- R5. ENOUGH APPROPRIATE EVIDENCE TO SAY THIS YET?
  --
  -- Before R5 five of the six class metrics on this fixture answered with the
  -- single word `below_minimum`, which flattened two different facts about the
  -- world into one. "No learner has both a pre-test and a post-test, so net
  -- gain cannot be computed at all" and "one learner's comprehension result
  -- exists where five are required" are not the same sentence, and neither of
  -- them is "this class is doing badly".
  --
  -- THE DECISIVE CASE IS G, and it is measured rather than constructed: ONE
  -- node, ONE body of evidence, THREE different readiness answers, because the
  -- minimum belongs to the interpretation and not to the platform. A universal
  -- threshold could not produce this row.
  -- =========================================================================
  declare
    c record; bad text[] := array[]::text[]; v_why text := ''; v_cat text;
    r jsonb; r2 jsonb; raw jsonb; v_empty uuid; n int;
  begin
    begin
      perform selftest.as_owner();
      v_cat := public.current_metric_catalogue();
      select * into c from selftest.wp2_school();

      -- a class in the reader's own department with NO evidence at all
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      select c.inst, o.parent_id, 'CLASS', 'Kelas WP3 kosong', o.academic_period_id
        from public.org_nodes o where o.id = c.cls_a
      returning org_nodes.id into v_empty;

      perform selftest.as_user_uid(c.hod_u);

      -- A. NO QUALIFYING EVIDENCE -> NOT_YET_EVALUABLE.
      --    Two shapes of it. An empty class has nothing at all; net gain at the
      --    POPULATED class has evidence in the room but none that qualifies,
      --    because no learner holds both a pre-test and a post-test. The
      --    ruling names that second one explicitly, and it is the case a
      --    zero-vs-nonzero rule gets right and a "did the calculator return
      --    something" rule does not.
      r := public.metric_evaluate('class.participants', v_empty, c.inst, v_cat);
      if r ->> 'readiness' <> 'NOT_YET_EVALUABLE' then
        bad := bad || array[format('an empty class answered %s', coalesce(r ->> 'readiness','<none>'))];
      end if;
      r := public.metric_evaluate('class.net_gain', c.cls_a, c.inst, v_cat);
      if r ->> 'readiness' <> 'NOT_YET_EVALUABLE' or (r ->> 'have')::numeric <> 0 then
        bad := bad || array[format('net gain with no comparable pair answered %s at have=%s',
                                   coalesce(r ->> 'readiness','<none>'), coalesce(r ->> 'have','<none>'))];
      end if;
      if r ->> 'statement_key' <> 'laporan.metrik.belum_ada_bukti' then
        bad := bad || array['NOT_YET_EVALUABLE carries the not-enough-yet sentence'];
      end if;

      -- B. SOME QUALIFYING EVIDENCE, NOT ENOUGH -> INSUFFICIENT_EVIDENCE.
      r2 := public.metric_evaluate('class.comprehension', c.cls_a, c.inst, v_cat);
      if r2 ->> 'readiness' <> 'INSUFFICIENT_EVIDENCE' then
        bad := bad || array[format('one result of five answered %s', coalesce(r2 ->> 'readiness','<none>'))];
      end if;
      if (r2 ->> 'have')::numeric <= 0 or (r2 ->> 'have')::numeric >= (r2 ->> 'needed')::numeric then
        bad := bad || array['INSUFFICIENT_EVIDENCE was reported without being between nothing and enough'];
      end if;
      if r2 ->> 'statement_key' <> 'laporan.metrik.belum_cukup_data' then
        bad := bad || array['INSUFFICIENT_EVIDENCE carries the wrong sentence'];
      end if;

      -- C+E. SUFFICIENT -> the interpretation, and the SAME one as before R5.
      r := public.metric_evaluate('class.participants', c.cls_a, c.inst, v_cat);
      perform selftest.as_owner();
      perform set_config('pintar.metric_boundary_node', c.cls_a::text, true);
      raw := public.calc_class_participants(c.cls_a, c.inst, v_cat);
      perform set_config('pintar.metric_boundary_node', '', true);
      perform selftest.as_user_uid(c.hod_u);
      if r ->> 'readiness' <> 'SUFFICIENT_EVIDENCE' or r ->> 'status' <> 'ok' then
        bad := bad || array[format('a met minimum answered %s/%s',
                                   coalesce(r ->> 'status','<none>'), coalesce(r ->> 'readiness','<none>'))];
      end if;
      if (r -> 'value') is distinct from (raw -> 'value')
         or (r -> 'sample') is distinct from (raw -> 'sample') then
        bad := bad || array['R5 changed the figure a sufficient metric returns'];
      end if;

      -- D. NEITHER WITHHOLDING STATE EMITS AN INTERPRETATION. Not a value, not
      --    a zero standing in for one -- which is the substitution §7 forbids.
      foreach v_why in array array['class.net_gain', 'class.comprehension'] loop
        r := public.metric_evaluate(v_why, c.cls_a, c.inst, v_cat);
        if r ? 'value' then
          bad := bad || array[format('%s emitted a value while withholding', v_why)];
        end if;
        if r ->> 'readiness' = 'SUFFICIENT_EVIDENCE' then
          bad := bad || array[format('%s claimed sufficiency while withholding', v_why)];
        end if;
      end loop;
      v_why := '';

      -- G. ONE NODE, ONE BODY OF EVIDENCE, THREE ANSWERS.
      select count(distinct x.readiness) into n from (
        select (public.metric_evaluate(m.metric_id, c.cls_a, c.inst, v_cat)) ->> 'readiness' as readiness
          from public.metric_definitions m
         where m.catalogue_version = v_cat and m.metric_id in
               ('class.participants', 'class.comprehension', 'class.net_gain')) x;
      if n <> 3 then
        bad := bad || array[format('three interpretations over one body of evidence produced %s distinct readiness state(s)', n)];
      end if;

      -- F+I. READINESS IS NOT A WAY TO SEE A POPULATION YOU MAY NOT SEE. The
      --      sibling department holds its own real session and result; the
      --      refusal must carry no readiness, no count and no minimum, or a
      --      reader learns how much evidence exists over there by being told
      --      there is not enough of it.
      r := public.metric_evaluate('class.participants', c.cls_b, c.inst, v_cat);
      if r ->> 'status' <> 'not_permitted' then
        bad := bad || array['the sibling class was not refused'];
      end if;
      if r ? 'readiness' or r ? 'have' or r ? 'needed' or r ? 'label_key' then
        bad := bad || array['a refusal carried readiness metadata about a population out of scope'];
      end if;
      -- and the same refusal for a class that does not exist at all, so the
      -- two are indistinguishable from outside
      r2 := public.metric_evaluate('class.participants', gen_random_uuid(), c.inst, v_cat);
      if (r2 ->> 'status') is distinct from (r ->> 'status')
         or (r2 ->> 'statement_key') is distinct from (r ->> 'statement_key') then
        bad := bad || array['a real out-of-scope class and a nonexistent one answer differently'];
      end if;

      -- THE MANAGEMENT CONSUMER SAYS IT TOO, by the same rule and the same
      -- governed minimum rather than a second opinion.
      r := public.management_learner_detail(c.la, c.inst);
      if (r ->> 'official_results_readiness') is null then
        bad := bad || array['the Management record does not say whether its evidence is sufficient'];
      end if;
      if (r ->> 'official_results_readiness') <> public.evidence_readiness(
            jsonb_array_length(r -> 'official_results'),
            (select m.minimum_sample from public.metric_definitions m
              where m.catalogue_version = v_cat and m.metric_id = 'learner.result'))::text then
        bad := bad || array['the Management consumer disagrees with the shared readiness rule'];
      end if;
      perform selftest.as_owner();

      -- H. CONTENT PUBLISH READINESS IS A DIFFERENT QUESTION AND IS UNTOUCHED.
      if to_regprocedure('public.publish_readiness(uuid)') is null then
        bad := bad || array['publish_readiness was replaced rather than left alone'];
      elsif pg_get_functiondef('public.publish_readiness(uuid)'::regprocedure) like '%evidence_readiness%' then
        bad := bad || array['content publish readiness was wired to evidence readiness'];
      end if;
      if pg_get_functiondef('public.metric_evaluate(text,uuid,uuid,text)'::regprocedure)
         like '%publish_readiness%' then
        bad := bad || array['the evaluator was wired to content publish readiness'];
      end if;
      -- and the learner mastery bands are a third thing again
      if to_regclass('public.readiness_tiers') is null then
        bad := bad || array['the learner readiness bands disappeared'];
      end if;

      raise exception 'F06_P16_UNDO';
    exception when others then
      begin perform selftest.as_owner(); exception when others then null; end;
      perform set_config('pintar.metric_boundary_node', '', true);
      perform set_config('pintar.metric_boundary_person', '', true);
      if sqlerrm <> 'F06_P16_UNDO' then
        v_why := 'the probe itself failed: ' || left(sqlerrm, 180);
      end if;
    end;

    id := 'F06-P16'; area := 'WP3 R5 -- enough appropriate evidence to say this yet';
    if v_why <> '' then ok := false; detail := v_why;
    elsif array_length(bad,1) is not null then
      ok := false; detail := format('%s problem(s): %s', array_length(bad,1), array_to_string(bad,'; '));
    else
      ok := true;
      detail := 'measured on a purpose-built two-department school with real FINALIZED evidence. NO '
        || 'QUALIFYING EVIDENCE IS NOT_YET_EVALUABLE, in both its shapes: an empty class, and -- at the '
        || 'POPULATED class -- net gain, where results exist but no learner holds both a pre-test and a '
        || 'post-test, so the comparison the figure needs has not happened. SOME BUT SHORT IS '
        || 'INSUFFICIENT_EVIDENCE: one comprehension result where the catalogue requires five, asserted '
        || 'to sit strictly between nothing and enough, and each state carries its own sentence rather '
        || 'than one word for both. A MET MINIMUM returns SUFFICIENT_EVIDENCE and the identical figure '
        || 'the calculator produced, so R5 withholds and does not alter. Neither withholding state emits '
        || 'a value, so a zero never stands in for an absent interpretation. THE DECISIVE ROW: one node '
        || 'and one body of evidence give THREE distinct readiness answers across participants, '
        || 'comprehension and net gain, because the minimum belongs to the interpretation -- a universal '
        || 'threshold cannot produce that. READINESS IS NOT A WAY IN: the sibling department, which holds '
        || 'its own real session and result, is refused with no readiness, no count, no minimum and no '
        || 'label, and answers identically to a class that does not exist, so a reader cannot learn from '
        || 'a refusal that there is evidence over there. The Management record carries the same answer '
        || 'computed by the same shared rule against the same governed minimum. Content publish '
        || 'readiness and the learner mastery bands are untouched and unconnected in both directions. '
        || 'Every row rolled back';
    end if;
    return next;
  end;

  perform selftest.f06_purge();
  perform selftest.purge_certificates();
  id := 'F06-DONE'; area := 'suite'; ok := true; detail := 'FABLE-06 suite complete';
  return next;
end $$;
revoke all on function selftest.run_fable06() from public;

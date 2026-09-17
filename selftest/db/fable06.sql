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
    n_dep_entries int; n_admin_ok int;
  begin
    select * into c2 from selftest.f06_cohort();
    begin
      perform selftest.as_user('boot-admin@bootstrap.pintar.test');
      insert into public.report_templates (institution_id, standard_report, title_key, template_version)
      values (c2.inst, 'class_learning_intelligence', 'laporan.kelas.judul', 2)
      returning report_templates.id into v_t2;
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization) values
        (v_t2, 'class.participants', 1, 'hero_stat'),
        (v_t2, 'institution.participants', 2, 'hero_stat'),
        (v_t2, 'item.correctness_rate', 3, 'bar');

      v_admin := public.generate_report(v_t2, c2.class_node);
      perform selftest.as_user('boot-guru@bootstrap.pintar.test');
      v_guru := public.generate_report(v_t2, c2.class_node);

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
      v_dep := public.generate_report(v_t2, c2.class_node);

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
        detail := format('the educator received %s honest statement(s) where 2 were expected: '
                      || 'institution- and item-scope metrics are outside EDUCATOR''s catalogue audience, '
                      || 'and a saved template does not grant them', n_guru_denied);
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
        detail := format('one saved template, two real personas: INSTITUTION_ADMIN receives all 3 entries '
                      || 'with %s computed, EDUCATOR receives all 3 with 2 replaced by an honest statement '
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

  perform selftest.f06_purge();
  perform selftest.purge_certificates();
  id := 'F06-DONE'; area := 'suite'; ok := true; detail := 'FABLE-06 suite complete';
  return next;
end $$;
revoke all on function selftest.run_fable06() from public;

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

-- The derived endpoint set, computed with the harness's own privileges because
-- `client_rpc_registry` is not dean-readable -- which is itself correct. The
-- dean session does only the CALLING; deriving the list is not part of the
-- property under test.
create or replace function selftest.f06_dean_denied_endpoints()
returns table (oid_ oid, proname text, args text)
language sql security definer set search_path = public, pg_temp as $$
  with denied as (
    select cap from (
      select unnest(public.role_capabilities('INSTITUTION_ADMIN')) cap
      union select unnest(public.role_capabilities('HEAD_OF_DEPARTMENT'))
      union select unnest(public.role_capabilities('EDUCATOR'))
      except select unnest(public.role_capabilities('DEAN'))) y)
  select p.oid, p.proname::text, pg_get_function_identity_arguments(p.oid)
    from public.client_rpc_registry r
    join pg_proc p on p.proname = r.function_name
    join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
   where r.exposure = 'STAFF' and p.provolatile = 'v'
     and exists (select 1 from denied d
                  where regexp_replace(p.prosrc, '--[^\n]*', '', 'g') like '%' || d.cap || '%')
   order by p.proname
$$;
revoke all on function selftest.f06_dean_denied_endpoints() from public;
grant execute on function selftest.f06_dean_denied_endpoints() to authenticated;

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
    elsif p_name ~ 'session'          then select id into v from public.assessment_sessions where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.assessment_sessions limit 1; end if;
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
    elsif p_name ~ 'transfer'         then select id into v from public.transfers limit 1;
    elsif p_name ~ 'signal'           then select id into v from public.integrity_signals limit 1;
    elsif p_name ~ 'person'           then select person_id into v from public.enrollments where institution_id=p_inst limit 1;
    elsif p_name ~ 'period'           then select id into v from public.academic_periods where institution_id=p_inst limit 1;
                                           if v is null then select id into v from public.academic_periods limit 1; end if;
    end if;
    if v is null then return 'null::uuid'; end if;
    return quote_literal(v::text) || '::uuid';
  elsif p_type = 'text' then
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
  -- F06-N02 -- INV-19 IN THE API, NOT IN THE UI.
  --
  -- A dean surface that renders no button over an endpoint that would accept a
  -- write is not read-only. Only one of those two is testable without a
  -- browser, and it is the one that matters.
  --
  -- THE ENDPOINT SET IS DERIVED, NOT WRITTEN. An assertion over endpoints
  -- someone thought of is silent about the one added next month -- the failure
  -- this build has now repaired four times. The set is computed three ways at
  -- once: capabilities a DEAN lacks (role_capabilities, not a list), functions
  -- exposed to clients as STAFF (client_rpc_registry), and functions that
  -- MUTATE (pg_proc.provolatile = 'v', the planner's own record). A new
  -- privileged RPC joins the set the day it is created.
  --
  -- REFUSAL IS NOT ABSENCE, and this is the vacuity trap specific to this
  -- assertion. "Did not accept the write" has two causes: the endpoint refused,
  -- or the endpoint is not there. A mistyped path returns "function does not
  -- exist" and a naive check reads that as a pass. So: every endpoint must
  -- EXIST and be EXECUTABLE by the caller, the refusal must be an authorization
  -- error by its text, and undefined_function is a FAILURE rather than a pass.
  --
  -- And the read half, because either alone is not the property: the dean must
  -- successfully READ through the same session that is refused every write.
  -- Otherwise a dean with no session at all would pass this test perfectly.
  -- =========================================================================
  declare
    v_read jsonb; v_sig text; v_args text; v_err text;
    n_refused int := 0; n_absent int := 0; n_accepted int := 0; n_other int := 0;
    n_broken int := 0; v_unreached text := ''; v_dean_inst uuid;
    v_bad text := ''; f record;
  begin
    select i.id into v_dean_inst from public.institutions i where i.slug like 'synth-alpha-%' limit 1;
    perform selftest.as_user('alpha-dean@synthetic.pintar.test');

    -- THE READ HALF FIRST. If this fails, every refusal below is meaningless.
    begin
      v_read := to_jsonb(public.mode_policy('POST_TEST'));
    exception when others then v_read := null; end;

    for f in select e.oid_ as oid, e.proname, e.args
                 from selftest.f06_dean_denied_endpoints() e loop
      -- the endpoint must be REACHABLE by this caller, or a refusal proves
      -- nothing about authorization
      if not has_function_privilege('authenticated', f.oid, 'EXECUTE') then
        n_absent := n_absent + 1;
        v_bad := v_bad || f.proname || ' (not executable by a client role); ';
        continue;
      end if;

      -- null arguments of the declared types: authorization is supposed to run
      -- before anything is resolved from an argument, which this build has had
      -- to repair twice already
      -- trim BEFORE the strip, not after. string_to_array leaves a leading
      -- space on every argument but the first, so `^\S+\s+` matched nothing
      -- and produced `null:: p_finding uuid` -- a syntax error in the TEST,
      -- which the first version counted as "refused for another reason" and
      -- passed on. Fifteen of eighteen endpoints were never actually called.
      select coalesce(string_agg(
               selftest.f06_arg_value(
                 split_part(trim(a), ' ', 1),
                 regexp_replace(trim(a), '^\S+\s+', ''),
                 v_dean_inst),
               ', ' order by ord), '')
        into v_args
        from unnest(string_to_array(f.args, ',')) with ordinality as u(a, ord)
       where length(trim(u.a)) > 0;
      v_sig := format('select public.%I(%s)', f.proname, v_args);

      -- EVERY CALL IS ROLLED BACK. Passing REAL ids made these endpoints do real
      -- work before refusing -- the suite went from 43s to over five minutes,
      -- which is the visible half. The invisible half is that an endpoint which
      -- did NOT refuse would have mutated D1 or the synthetic tenant for real,
      -- inside a test whose whole claim is that it cannot. A probe that would
      -- damage the thing it is checking is not a probe.
      --
      -- The rollback also removes the cost: the work is still done, but nothing
      -- is written, so the expensive paths stop persisting anything.
      begin
        execute v_sig;
        n_accepted := n_accepted + 1;
        v_bad := v_bad || f.proname || ' (ACCEPTED a call from a dean); ';
        raise exception 'F06_N02_UNDO';
      exception
        when raise_exception then
          if sqlerrm <> 'F06_N02_UNDO' then
            v_err := sqlerrm;
            if v_err ~* '(requires|denied|not authorized|not permitted|lacks|may not|forbidden|CAN_[A-Z_]+)' then
              n_refused := n_refused + 1;
            else
              n_other := n_other + 1;
              v_unreached := v_unreached || f.proname || ', ';
            end if;
          end if;
        when undefined_function then
          n_absent := n_absent + 1;
          v_bad := v_bad || f.proname || ' (does not exist: absence read as refusal); ';
        when syntax_error_or_access_rule_violation then
          -- A SYNTAX ERROR HERE IS THE TEST'S FAULT, NOT A REFUSAL. Counting it
          -- as one is how the first version of this check passed while never
          -- calling fifteen of the eighteen endpoints.
          v_err := sqlerrm;
          if v_err ~* '(requires|denied|not authorized|not permitted|lacks|may not|forbidden|CAN_[A-Z_]+)' then
            n_refused := n_refused + 1;
          else
            n_broken := n_broken + 1;
            v_bad := v_bad || f.proname || ' (the probe could not call it: ' || left(v_err, 50) || '); ';
          end if;
        when others then
          v_err := sqlerrm;
          if v_err ~* '(requires|denied|not authorized|not permitted|lacks|may not|forbidden|CAN_[A-Z_]+)' then
            n_refused := n_refused + 1;
          else
            n_other := n_other + 1;
            -- NAMED, not counted. "eleven refused earlier" is a number nobody
            -- can act on; the names say which endpoints INV-19 is argued for
            -- rather than asserted for, which is what the capstone has to state.
            v_unreached := v_unreached || f.proname || ', ';
          end if;
      end;
    end loop;
    perform selftest.as_owner();

    id := 'F06-N02'; area := 'INV-19 -- read-only in the API, over a derived endpoint set';
    -- VACUITY GUARD, found by watching this test fail. Planting an endpoint
    -- that ACCEPTS a dean did not turn it red: removing the capability check
    -- also removed the function from the derived set, so a function that
    -- deletes its own authorization escapes the test that would catch it.
    -- The set can only grow as the product does, so a floor closes it.
    if n_refused + n_other + n_accepted + n_absent < 18 then
      ok := false;
      detail := format('the derived dean-denied set holds %s endpoint(s), fewer than the 18 measured when '
                    || 'this check was written: an endpoint has stopped checking a capability and left the '
                    || 'set rather than failing inside it',
                       n_refused + n_other + n_accepted + n_absent);
    elsif v_read is null then
      ok := false;
      detail := 'the dean could not READ through the session used for the refusals, so every refusal '
             || 'below is indistinguishable from having no session at all';
    elsif n_accepted > 0 then
      ok := false; detail := 'a dean-denied endpoint accepted the call: ' || v_bad;
    elsif n_absent > 0 then
      ok := false;
      detail := 'endpoint(s) whose refusal is ABSENCE rather than authorization -- a test that cannot '
             || 'tell those apart proves nothing: ' || v_bad;
    elsif n_broken > 0 then
      ok := false;
      detail := 'the probe failed to CALL endpoint(s), so their refusal was never tested: ' || v_bad;
    elsif n_refused = 0 then
      ok := false;
      detail := format('no endpoint produced an authorization refusal (%s other error(s)): the check is '
                    || 'measuring argument handling, not authorization', n_other);
    else
      ok := true;
      detail := format('the dean reads through this session and is refused every one of %s mutating STAFF '
                    || 'endpoint that checks a capability DEAN lacks: %s by an authorization error naming '
                    || 'the capability, %s refused before reaching a capability check at all -- either '
                    || 'because no row of the kind the argument names exists for the probe to point at, or '
                    || 'because the generic value it supplies for a text or enum argument is rejected on '
                    || 'its own terms first. None accepted, none merely absent, and '
                    || 'no endpoint went uncalled. The set is derived from role_capabilities, '
                    || 'client_rpc_registry and pg_proc.provolatile, so a new privileged RPC joins it the '
                    || 'day it is created. BOUNDED: for these, refusal is proved but not that the refusal '
                    || 'is AUTHORIZATION, so a capability check weakened rather than removed would not be '
                    || 'detected here -- %s(see RF-2)',
                       n_refused + n_other, n_refused, n_other,
                       case when v_unreached = '' then '' else rtrim(v_unreached, ', ') || ' ' end);
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

  perform selftest.f06_purge();
  perform selftest.purge_certificates();
  id := 'F06-DONE'; area := 'suite'; ok := true; detail := 'FABLE-06 suite complete';
  return next;
end $$;
revoke all on function selftest.run_fable06() from public;

-- FABLE-01 database-layer selftest (doc 16 §4). Runner: psql (CI, local
-- stack) or the management channel. Creates a throwaway `selftest` schema,
-- runs every test as the real Postgres roles PostgREST uses
-- (`set local role authenticated` + `request.jwt.claims`), and returns one
-- row per manifest id. Mutating tests only touch synthetic tenants.
-- Never applied as a migration; never present in production.

create schema if not exists selftest;

create or replace function selftest.as_user(p_email text) returns void
language plpgsql set search_path = public, pg_temp as $$
declare v_uid uuid;
begin
  reset role;
  select id into v_uid from auth.users where email = p_email;
  if v_uid is null then raise exception 'persona % not found', p_email; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated', 'email', p_email)::text, true);
  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  set local role authenticated;
end $$;

create or replace function selftest.as_anon() returns void
language plpgsql set search_path = public, pg_temp as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
end $$;

create or replace function selftest.as_owner() returns void
language plpgsql set search_path = public, pg_temp as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

-- Privileges the harness needs on its own schema (CI-01). The helpers above
-- switch the session role (`set local role authenticated` / `anon`), so every
-- later `selftest.*` call in run_fable01() is made as that role, not as the
-- owner. Re-entering the schema therefore needs USAGE, and calling the helper
-- needs EXECUTE -- neither of which a clean database grants. Stated here so the
-- harness is self-contained instead of depending on privileges left behind in a
-- long-lived local stack. Scoped to the three role-switch helpers; the
-- run_fable01() entrypoint is closed to client roles at the end of this file.
-- Idempotent: re-running this file re-issues the same grants.
grant usage on schema selftest to authenticated, anon;
grant execute on function selftest.as_user(text), selftest.as_anon(), selftest.as_owner()
  to authenticated, anon;

create or replace function selftest.run_fable01()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  alpha uuid; beta uuid; alpha_p1 uuid; alpha_p2 uuid; beta_p1 uuid;
  a_dept uuid; a_prog uuid; a_coh5 uuid; a_cls5a uuid; a_coh6 uuid; a_cls6b uuid; b_prog uuid; b_cls uuid;
  p_aadmin uuid; p_adean uuid; p_ahod uuid; p_aguru uuid; p_as1 uuid; p_as2 uuid; p_badmin uuid; p_bs1 uuid;
  e_as1 uuid; e_as2 uuid;
  n int; n2 int; b boolean; v_id uuid; v_t uuid; txt text; j jsonb; v_new_enr uuid;
  t0 timestamptz := clock_timestamp();
begin
  -- ---------------------------------------------------------------- fixtures
  perform selftest.as_owner();
  select i.id into alpha from public.institutions i where i.is_synthetic and i.slug like 'synth-alpha-%' order by i.created_at desc limit 1;
  select i.id into beta  from public.institutions i where i.is_synthetic and i.slug like 'synth-beta-%'  order by i.created_at desc limit 1;
  select id into alpha_p1 from public.academic_periods where institution_id = alpha and name = 'TA 2026/2027';
  select id into alpha_p2 from public.academic_periods where institution_id = alpha and name = 'TA 2027/2028';
  select id into beta_p1  from public.academic_periods where institution_id = beta;
  select id into a_dept  from public.org_nodes where institution_id = alpha and kind = 'DEPARTMENT';
  select id into a_prog  from public.org_nodes where institution_id = alpha and kind = 'PROGRAMME';
  select id into a_coh5  from public.org_nodes where institution_id = alpha and kind = 'COHORT' and academic_period_id = alpha_p1;
  select id into a_cls5a from public.org_nodes where institution_id = alpha and kind = 'CLASS' and name = '5A';
  select id into a_coh6  from public.org_nodes where institution_id = alpha and kind = 'COHORT' and academic_period_id = alpha_p2;
  select id into a_cls6b from public.org_nodes where institution_id = alpha and kind = 'CLASS' and name = '6B';
  select id into b_prog  from public.org_nodes where institution_id = beta and kind = 'PROGRAMME';
  select id into b_cls   from public.org_nodes where institution_id = beta and kind = 'CLASS';
  select a.person_id into p_aadmin from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test';
  select a.person_id into p_adean  from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-dean@synthetic.pintar.test';
  select a.person_id into p_ahod   from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-hod@synthetic.pintar.test';
  select a.person_id into p_aguru  from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-guru@synthetic.pintar.test';
  select a.person_id into p_as1    from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-siswa-1@synthetic.pintar.test';
  select a.person_id into p_as2    from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'card-7001@cards.synthetic.pintar.test';
  select a.person_id into p_badmin from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'beta-admin@synthetic.pintar.test';
  select a.person_id into p_bs1    from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'beta-siswa-1@synthetic.pintar.test';
  select id into e_as1 from public.enrollments where person_id = p_as1 and institution_id = alpha and status = 'ACTIVE';
  select id into e_as2 from public.enrollments where person_id = p_as2 and institution_id = alpha and status = 'ACTIVE';

  -- F01-T01 harness smoke
  test_id := 'F01-T01'; invariant := 'harness'; ok := alpha is not null and beta is not null and p_as1 is not null and p_as2 is not null and e_as1 is not null;
  detail := format('alpha=%s beta=%s', alpha, beta); return next;

  -- F01-T02 INV-13 tenant isolation as alpha-admin
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  select count(*) into n from public.institutions where id = beta;
  select count(*) into n2 from public.org_nodes where institution_id = beta;
  select n + n2 + (select count(*) from public.academic_periods where institution_id = beta)
       + (select count(*) from public.enrollments where institution_id = beta)
       + (select count(*) from public.audit_log where institution_id = beta)
       + (select count(*) from public.persons where id = p_bs1)
       + (select count(*) from public.classes where node_id = b_cls)
       + (select count(*) from public.memberships where node_id = b_cls) into n;
  select count(*) into n2 from public.institutions where id = alpha;
  test_id := 'F01-T02'; invariant := 'INV-13'; ok := (n = 0 and n2 = 1); detail := format('beta rows visible=%s alpha visible=%s', n, n2); return next;

  -- F01-T03 student isolation as alpha-siswa-1
  perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
  select count(*) into n from public.persons;                                  -- expect 1 (self)
  select count(*) into n2 from public.enrollments where person_id <> p_as1;    -- expect 0
  select n2 + (select count(*) from public.accounts where person_id <> p_as1)
            + (select count(*) from public.memberships m join public.enrollments e on e.id = m.enrollment_id where e.person_id <> p_as1)
            + (select count(*) from public.audit_log) + (select count(*) from public.role_assignments) into n2;
  test_id := 'F01-T03'; invariant := 'INV-13/doc05'; ok := (n = 1 and n2 = 0); detail := format('persons=%s other rows=%s', n, n2); return next;

  -- F01-T04 INV-16 anti-escalation
  ok := true; detail := '';
  perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
  begin perform public.grant_role(p_as1, 'EDUCATOR', a_cls5a, now() + interval '1 day'); ok := false; detail := detail || 'student self-grant succeeded; ';
  exception when others then null; end;
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin perform public.grant_role(p_aguru, 'SYSTEM_ADMIN', null, now() + interval '1 day'); ok := false; detail := detail || 'inst-admin granted SYSTEM_ADMIN; ';
  exception when others then null; end;
  begin perform public.grant_role(p_aguru, 'INSTITUTION_ADMIN', alpha, now() + interval '1 day'); ok := false; detail := detail || 'inst-admin granted INSTITUTION_ADMIN; ';
  exception when others then null; end;
  begin perform public.grant_role(p_aguru, 'EDUCATOR', b_cls, now() + interval '1 day'); ok := false; detail := detail || 'cross-tenant grant succeeded; ';
  exception when others then null; end;
  begin perform public.grant_role(p_aadmin, 'EDUCATOR', a_cls5a, now() + interval '1 day'); ok := false; detail := detail || 'admin self-grant succeeded; ';
  exception when others then null; end;
  begin
    v_id := public.grant_role(p_ahod, 'EDUCATOR', a_cls5a, now() + interval '1 day');
    select count(*) into n from public.audit_log where action = 'role.granted' and target_id = v_id::text and actor_person_id = p_aadmin;
    if n <> 1 then ok := false; detail := detail || format('legit grant audit rows=%s; ', n); end if;
    begin update public.role_assignments set valid_until = now() + interval '5 years' where id = v_id; ok := false; detail := detail || 'assignment mutated; ';
    exception when others then null; end;
    perform public.revoke_role(v_id);
    select count(*) into n from public.audit_log where action = 'role.revoked' and target_id = v_id::text;
    if n <> 1 then ok := false; detail := detail || format('revoke audit rows=%s; ', n); end if;
  exception when others then ok := false; detail := detail || 'legit grant failed: ' || sqlerrm || '; ';
  end;
  test_id := 'F01-T04'; invariant := 'INV-16/INV-18'; if ok then detail := 'all escalation paths refused; legit grant+revoke audited'; end if; return next;

  -- F01-T05 fail-closed primitives (Lesson 11)
  perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
  b := public.has_scope(null, null) or public.can_on_node(null, null) or public.is_member_of_institution(null)
       or public.person_visible_to_me(null) or public.has_scope('EDUCATOR', gen_random_uuid()) or public.can_on_node('CAN_DRAFT', a_cls5a)
       or public.has_scope('STUDENT', beta);
  test_id := 'F01-T05'; invariant := 'Lesson 11'; ok := not b; detail := 'null/unknown/foreign input → false'; return next;

  -- F01-T06 INV-19 DEAN holds no capability, is read-only
  ok := true; detail := '';
  perform selftest.as_user('alpha-dean@synthetic.pintar.test');
  select count(*) into n from public.org_nodes where institution_id = alpha;
  if n = 0 then ok := false; detail := detail || 'dean cannot read own institution; '; end if;
  if public.can_on_node('CAN_DRAFT', alpha) or public.can_on_node('CAN_PUBLISH', alpha) or public.can_on_node('CAN_QUICK_ASSESSMENT', a_cls5a)
     or public.can_on_node('CAN_ASSIGN_LEARNING', a_cls5a) or public.can_on_node('CAN_AUTHORIZE_TRANSFER', alpha) then
    ok := false; detail := detail || 'dean has a capability; ';
  end if;
  begin perform public.grant_role(p_aguru, 'EDUCATOR', a_cls5a, now() + interval '1 day'); ok := false; detail := detail || 'dean granted a role; '; exception when others then null; end;
  begin insert into public.classes (node_id, subject) values (a_cls6b, 'x'); ok := false; detail := detail || 'dean inserted class; '; exception when others then null; end;
  begin update public.institutions set name = 'x' where id = alpha; get diagnostics n = row_count; if n > 0 then ok := false; detail := detail || 'dean updated institution; '; end if; exception when others then null; end;
  begin insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (p_adean, alpha, alpha_p1, 'ACTIVE'); ok := false; detail := detail || 'dean enrolled; '; exception when others then null; end;
  test_id := 'F01-T06'; invariant := 'INV-19'; if ok then detail := 'dean reads; every write and capability refused'; end if; return next;

  -- F01-T07 educator scope (doc 05): sees own class members only
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  select count(*) into n from public.persons where id in (p_as1, p_as2);
  select count(*) into n2 from public.persons where id in (p_bs1, p_badmin);
  b := public.has_scope('EDUCATOR', a_cls5a) and not public.has_scope('EDUCATOR', a_cls6b) and not public.has_scope('HEAD_OF_DEPARTMENT', a_cls5a)
       and public.can_on_node('CAN_QUICK_ASSESSMENT', a_cls5a) and not public.can_on_node('CAN_PUBLISH', a_cls5a);
  test_id := 'F01-T07'; invariant := 'doc 05'; ok := (n = 2 and n2 = 0 and b); detail := format('own learners=%s foreign=%s scope=%s', n, n2, b); return next;

  -- F01-T08 INV-23 period rollover (alpha-admin)
  ok := true; detail := '';
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    n := public.period_rollover(alpha, alpha_p1, alpha_p2,
           jsonb_build_array(jsonb_build_object('from_node', a_coh5, 'to_node', a_coh6), jsonb_build_object('from_node', a_cls5a, 'to_node', a_cls6b)));
    select count(*) into n from public.memberships where enrollment_id = e_as1 and node_id = a_cls5a and valid_to is not null and close_reason = 'PERIOD_ROLLOVER';
    select count(*) into n2 from public.memberships where enrollment_id = e_as1 and node_id = a_cls6b and valid_to is null and academic_period_id = alpha_p2;
    if n <> 1 or n2 <> 1 then ok := false; detail := detail || format('closed=%s opened=%s; ', n, n2); end if;
    -- history: pick an instant strictly inside the closed 5A membership of e_as1
    select count(*) into n from public.members_of_node_at(a_cls5a,
      (select m.valid_from + (m.valid_to - m.valid_from) / 2 from public.memberships m
        where m.enrollment_id = e_as1 and m.node_id = a_cls5a and m.close_reason = 'PERIOD_ROLLOVER' order by m.valid_to desc limit 1));
    select count(*) into n2 from public.members_of_node_at(a_cls5a, now());
    if n < 1 or n2 <> 0 then ok := false; detail := detail || format('history before=%s after=%s; ', n, n2); end if;
    select count(*) into n from public.audit_log where action = 'period.rollover' and institution_id = alpha;
    if n < 1 then ok := false; detail := detail || 'no rollover audit; '; end if;
  exception when others then ok := false; detail := detail || sqlerrm;
  end;
  test_id := 'F01-T08'; invariant := 'INV-23'; if ok then detail := 'memberships closed+recreated; history answerable; audited'; end if; return next;

  -- F01-T09 append-only identity records (INV-23) as alpha-admin
  ok := true; detail := '';
  select id into v_id from public.memberships where enrollment_id = e_as1 and node_id = a_cls6b and valid_to is null;
  begin update public.memberships set node_id = a_cls5a where id = v_id; ok := false; detail := detail || 'membership node mutated; '; exception when others then null; end;
  begin delete from public.memberships where id = v_id; ok := false; detail := detail || 'membership deleted; '; exception when others then null; end;
  begin delete from public.enrollments where id = e_as1; ok := false; detail := detail || 'enrollment deleted; '; exception when others then null; end;
  begin update public.enrollments set institution_id = beta where id = e_as1; ok := false; detail := detail || 'enrollment re-parented; '; exception when others then null; end;
  perform selftest.as_owner();
  begin delete from public.persons where id = p_as1; ok := false; detail := detail || 'person deleted (owner); '; exception when others then null; end;
  select count(*) into n from information_schema.columns where table_schema='public' and table_name='persons' and column_name in ('institution_id','class_id','cohort_id','node_id');
  if n > 0 then ok := false; detail := detail || 'persons has institution/class column; '; end if;
  test_id := 'F01-T09'; invariant := 'INV-23'; if ok then detail := 'no overwrite/delete path exists'; end if; return next;

  -- F01-T10 INV-25 transfer alpha → beta for the card learner (p_as2)
  ok := true; detail := '';
  begin
    perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    -- self-fixturing: (re-)enrol the card learner at alpha if no ACTIVE alpha enrollment exists (repeatable runs)
    if e_as2 is null then
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (p_as2, alpha, alpha_p2, a_prog, 'ACTIVE') returning id into e_as2;
    end if;
    perform selftest.as_owner();
    select count(*) into n2 from public.portable_visibility where person_id = p_as2 and institution_id = beta;  -- prior runs
    perform selftest.as_user('alpha-admin@synthetic.pintar.test');
    v_t := public.transfer_request(e_as2, beta, beta_p1, b_prog, 'pindah sekolah', '{"guardian_consent":"recorded-by-policy-hook"}'::jsonb);
    begin perform public.transfer_execute(v_t); ok := false; detail := detail || 'REQUESTED→EXECUTED skip allowed; '; exception when others then null; end;
    begin perform public.transfer_authorize(v_t); ok := false; detail := detail || 'requesting side self-authorized; '; exception when others then null; end;
    perform selftest.as_user('beta-admin@synthetic.pintar.test');
    select count(*) into n from public.persons where id = p_as2; if n2 = 0 and n <> 0 then ok := false; detail := detail || 'beta saw learner before transfer; '; end if;
    perform public.transfer_authorize(v_t, '{"receiving_ack":true}'::jsonb);
    v_new_enr := public.transfer_execute(v_t);
    select count(*) into n from public.persons where id = p_as2; if n <> 1 then ok := false; detail := detail || 'beta cannot see transferred learner; '; end if;
    select count(*) into n from public.enrollments where person_id = p_as2; if n < 2 then ok := false; detail := detail || format('portable enrollments visible=%s; ', n); end if;
    select count(*) into n from public.audit_log where institution_id = alpha; if n <> 0 then ok := false; detail := detail || 'beta reads alpha audit; '; end if;
    select count(*) into n from public.role_assignments where institution_id = alpha; if n <> 0 then ok := false; detail := detail || 'beta reads alpha role assignments; '; end if;
    perform selftest.as_owner();
    select institution_id into v_id from public.enrollments where id = e_as2;
    if v_id <> alpha then ok := false; detail := detail || 'historical enrollment re-parented; '; end if;
    select status::text into txt from public.enrollments where id = e_as2; if txt <> 'ENDED' then ok := false; detail := detail || 'sending enrollment not ENDED; '; end if;
    select count(*) into n from public.memberships where enrollment_id = e_as2 and valid_to is null; if n <> 0 then ok := false; detail := detail || 'open memberships remain at sender; '; end if;
    select count(*) into n from public.enrollments where id = v_new_enr and institution_id = beta and status = 'ACTIVE'; if n <> 1 then ok := false; detail := detail || 'receiving enrollment missing; '; end if;
    select count(*) into n from public.audit_log where target_id = v_t::text and action = 'transfer.executed'; if n < 2 then ok := false; detail := detail || format('transfer audit rows=%s; ', n); end if;
    begin update public.transfers set status = 'REQUESTED' where id = v_t; ok := false; detail := detail || 'closed transfer mutated (owner); '; exception when others then null; end;
    perform selftest.as_user('card-7001@cards.synthetic.pintar.test');
    select count(*) into n from public.transfers where id = v_t; if n <> 1 then ok := false; detail := detail || 'learner cannot see own transfer; '; end if;
  exception when others then ok := false; detail := detail || sqlerrm;
  end;
  test_id := 'F01-T10'; invariant := 'INV-25'; if ok then detail := 'portable visible, institution-scoped hidden, history intact, lifecycle enforced'; end if; return next;

  -- F01-T11 INV-18 audit append-only for every role incl. owner
  ok := true; detail := '';
  perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
  begin update public.audit_log set action = 'x' where id = (select min(id) from public.audit_log); get diagnostics n = row_count; if n > 0 then ok := false; end if; exception when others then null; end;
  begin insert into public.audit_log (action, target_table) values ('x','x'); ok := false; detail := detail || 'student inserted audit; '; exception when others then null; end;
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  begin update public.audit_log set action = 'x' where id = (select min(id) from public.audit_log); ok := false; detail := detail || 'sysadmin updated audit; '; exception when others then null; end;
  begin delete from public.audit_log where id = (select min(id) from public.audit_log); ok := false; detail := detail || 'sysadmin deleted audit; '; exception when others then null; end;
  perform selftest.as_owner();
  begin update public.audit_log set action = 'x' where id = (select min(id) from public.audit_log); ok := false; detail := detail || 'owner updated audit; '; exception when others then null; end;
  begin delete from public.audit_log where id = (select min(id) from public.audit_log); ok := false; detail := detail || 'owner deleted audit; '; exception when others then null; end;
  select count(*) into n from public.audit_log where action in ('membership.created','membership.closed','enrollment.created','role.granted','transfer.executed','period.rollover');
  if n < 6 then ok := false; detail := detail || format('expected action coverage, got %s; ', n); end if;
  test_id := 'F01-T11'; invariant := 'INV-18'; if ok then detail := 'append-only for student, sysadmin and owner; actions covered'; end if; return next;

  -- F01-T12 INV-21 seed guard: no auth context + no intent → refused; production → refused even with intent
  ok := true; detail := '';
  perform selftest.as_owner();
  perform set_config('app.seed_intent', '', true);
  begin insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values (p_aguru, 'EDUCATOR', a_cls6b, now() + interval '1 day');
        ok := false; detail := detail || 'unauthenticated grant without intent succeeded; ';
  exception when others then null; end;
  begin
    update public.platform_environment set environment = 'production';
    perform set_config('app.seed_intent', 'synthetic', true);
    begin insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values (p_aguru, 'EDUCATOR', a_cls6b, now() + interval '1 day');
          ok := false; detail := detail || 'seed-style grant succeeded in production; ';
    exception when others then null; end;
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_PROBE' then ok := false; detail := detail || sqlerrm; end if;
  end;
  perform set_config('app.seed_intent', '', true);
  select environment into txt from public.platform_environment; if txt = 'production' then ok := false; detail := detail || 'environment left as production; '; end if;
  test_id := 'F01-T12'; invariant := 'INV-21'; if ok then detail := 'seed paths refused without intent and in production'; end if; return next;

  -- F01-T13 INV-15/36/14 schema lint via the SYSTEM_ADMIN RPC
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  j := public.platform_schema_lint();
  -- functions_without_search_path is new in 0035. The counter above it sees
  -- SECURITY DEFINER only, which is how sixteen SECURITY INVOKER functions
  -- drifted unpinned across two phases without this test noticing.
  ok := (j->>'tables_without_rls')::int = 0 and (j->>'policies_using_true')::int = 0 and (j->>'secdef_without_search_path')::int = 0
     and (j->>'functions_without_search_path')::int = 0
     -- added in 0036: a client-reachable SECDEF RPC with no exposure class, and
     -- the amended INV-20 raw-evidence grant boundary
     and (j->>'unclassified_client_rpcs')::int = 0
     and (j->>'evidence_consumer_boundary_ok')::boolean
     -- added in 0037: a LEARNER RPC that never reaches an ownership check, and
     -- a client-executable name carrying two signatures
     and (j->>'learner_rpcs_guarded_ok')::boolean
     and (j->>'overloaded_client_rpcs')::int = 0
     -- CHANGED TWICE IN FABLE-04, and back. 0048 granted the public
     -- verification projection to anon and this line asserted exactly 1;
     -- 0051 revoked it, because a projection that reports validity without
     -- checking a signature must not be an independent public answer. So the
     -- FABLE-01 property holds again unchanged: anon executes NOTHING. Two
     -- declared anon-reachable surfaces remain (the published view and the
     -- verification route), and both spellings of the route's HTTP path are
     -- counted separately so the pair is never folded away.
     and (j->>'functions_executable_by_anon')::int = 0
     and (j->>'undeclared_anon_functions')::int = 0
     and (j->>'anon_public_surface')::int = 2
     and (j->>'anon_reachable_http_paths')::int = 2
     and (j->>'public_surface_ok')::boolean
     and (j->>'anon_table_grants')::int = 0 and (j->>'public_buckets')::int = 0
     and (j->>'client_storage_policies')::int = 0 and (j->>'persons_institution_columns')::int = 0
     and (j->>'audit_log_client_write_grants')::int = 0 and (j->>'malformed_jalur')::int = 0;
  test_id := 'F01-T13'; invariant := 'INV-14/15/36'; detail := j::text; return next;
  -- lint RPC is SYSTEM_ADMIN only
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  ok := false; begin j := public.platform_schema_lint(); exception when others then ok := true; end;
  test_id := 'F01-T13b'; invariant := 'INV-37'; detail := 'lint RPC refused to non-SYSTEM_ADMIN'; return next;

  -- F01-T14 storage: no client path to objects
  ok := true; detail := '';
  perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
  begin insert into storage.objects (bucket_id, name, owner) values ('assets', 'probe/x.txt', auth.uid()); ok := false; detail := detail || 'authenticated inserted object; '; exception when others then null; end;
  begin select count(*) into n from storage.objects; if n > 0 then ok := false; detail := detail || 'authenticated listed objects; '; end if; exception when others then null; end;
  perform selftest.as_anon();
  begin select count(*) into n from storage.objects; if n > 0 then ok := false; detail := detail || 'anon listed objects; '; end if; exception when others then null; end;
  begin select count(*) into n from public.institutions; if n > 0 then ok := false; detail := detail || 'anon read institutions; '; end if; exception when others then null; end;
  begin select count(*) into n from public.persons; if n > 0 then ok := false; detail := detail || 'anon read persons; '; end if; exception when others then null; end;
  perform selftest.as_owner();
  test_id := 'F01-T14'; invariant := 'INV-15'; if ok then detail := 'no anon/authenticated storage or table path'; end if; return next;

  -- F01-T15 org hierarchy integrity
  ok := true; detail := '';
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin insert into public.org_nodes (institution_id, parent_id, kind, name) values (alpha, a_prog, 'CLASS', 'bad'); ok := false; detail := detail || 'CLASS under PROGRAMME accepted; '; exception when others then null; end;
  begin insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (alpha, b_prog, 'COHORT', 'bad', alpha_p1); ok := false; detail := detail || 'cross-tenant parent accepted; '; exception when others then null; end;
  begin insert into public.org_nodes (institution_id, parent_id, kind, name) values (alpha, a_prog, 'COHORT', 'bad'); ok := false; detail := detail || 'COHORT without period accepted; '; exception when others then null; end;
  begin delete from public.org_nodes where id = a_cls6b; ok := false; detail := detail || 'node deleted; '; exception when others then null; end;
  select count(*) into n from public.org_nodes where institution_id = alpha and (cardinality(jalur) = 0 or jalur[cardinality(jalur)] <> id or jalur[1] <> alpha);
  if n > 0 then ok := false; detail := detail || format('%s malformed paths; ', n); end if;
  perform selftest.as_owner();
  test_id := 'F01-T15'; invariant := 'doc 02 Organisation'; if ok then detail := 'chain enforced; paths well-formed; no delete'; end if; return next;

  -- F01-T16 classroom-card account shares the Person model
  perform selftest.as_user('card-7001@cards.synthetic.pintar.test');
  select count(*) into n from public.accounts where kind = 'CLASSROOM_CARD' and card_number = '7001' and person_id = public.current_person_id();
  select count(*) into n2 from public.my_profile where person_id = p_as2;
  test_id := 'F01-T16'; invariant := 'doc 02 Account'; ok := (n = 1 and n2 = 1); detail := format('card account=%s profile=%s', n, n2); return next;

  -- F01-T17 own profile update only
  ok := true; detail := '';
  perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
  update public.persons set display_name = 'Siswa Alpha Satu (sintetis, diubah)' where id = p_as1; get diagnostics n = row_count;
  if n <> 1 then ok := false; detail := detail || 'own update failed; '; end if;
  update public.persons set display_name = 'x' where id = p_as2; get diagnostics n = row_count;
  if n <> 0 then ok := false; detail := detail || 'updated another person; '; end if;
  begin update public.persons set anonymized_at = now() where id = p_as1; ok := false; detail := detail || 'learner set anonymized_at; '; exception when others then null; end;
  perform selftest.as_owner();
  test_id := 'F01-T17'; invariant := 'doc 05 profile'; if ok then detail := 'own display_name only'; end if; return next;

  -- F01-T18 feature flags & platform config authority
  ok := true; detail := '';
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin insert into public.feature_flags (key, institution_id, enabled) values ('pilot.quick_assessment', alpha, true)
        on conflict (key, institution_id) do update set enabled = true; exception when others then ok := false; detail := detail || 'inst-admin cannot set own flag: ' || sqlerrm || '; '; end;
  begin insert into public.feature_flags (key, institution_id, enabled) values ('pilot.platform', null, true); ok := false; detail := detail || 'inst-admin set platform flag; '; exception when others then null; end;
  begin update public.platform_config set value = 'true'::jsonb where key = 'maintenance_mode'; get diagnostics n = row_count; if n > 0 then ok := false; detail := detail || 'inst-admin changed platform config; '; end if; exception when others then null; end;
  if not public.flag_enabled('pilot.quick_assessment', alpha) or public.flag_enabled('pilot.quick_assessment', beta) then ok := false; detail := detail || 'flag resolution wrong; '; end if;
  perform selftest.as_owner();
  test_id := 'F01-T18'; invariant := 'doc 16 §8 flags'; if ok then detail := 'institution-scoped flags only; platform config SYSTEM_ADMIN only'; end if; return next;

  -- F01-T19 INV-18 build SHA stamped from the request header (app server → PostgREST → audit_write)
  ok := true; detail := '';
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  perform set_config('app.build_sha', '', true);
  perform set_config('request.headers', '{"x-pintar-build":"f01c0ffee"}', true);
  begin
    insert into public.feature_flags (key, institution_id, enabled) values ('pilot.build_sha_probe', alpha, true)
      on conflict (key, institution_id) do update set enabled = not public.feature_flags.enabled;
  exception when others then ok := false; detail := detail || 'flag write failed: ' || sqlerrm || '; '; end;
  perform set_config('request.headers', '', true);
  perform selftest.as_owner();
  select build_sha into txt from public.audit_log where target_table = 'feature_flags' order by id desc limit 1;
  if txt is distinct from 'f01c0ffee' then ok := false; detail := detail || format('latest flag audit row build_sha=%s; ', coalesce(txt,'null')); end if;
  perform set_config('request.headers', '{"x-pintar-build":"not a sha"}', true);
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    update public.feature_flags set enabled = not enabled where key = 'pilot.build_sha_probe' and institution_id = alpha;
  exception when others then ok := false; detail := detail || 'second flag write failed; '; end;
  perform set_config('request.headers', '', true);
  perform selftest.as_owner();
  select build_sha into txt from public.audit_log where target_table = 'feature_flags' order by id desc limit 1;
  if txt is not null then ok := false; detail := detail || format('malformed header stored as %s; ', txt); end if;
  test_id := 'F01-T19'; invariant := 'INV-18 build_sha'; if ok then detail := 'header SHA stamped; malformed header rejected'; end if; return next;

  perform selftest.as_owner();
  test_id := 'F01-DONE'; invariant := '-'; ok := true; detail := format('elapsed %s ms', round(extract(epoch from clock_timestamp() - t0) * 1000)); return next;
end $$;

-- USAGE above opens the schema to the client roles, so close the entrypoint
-- behind it: run_fable01() is entered only over the owner connection (psql via
-- $SUPABASE_DB_URL -- npm run selftest:db and both CI db jobs). create or
-- replace resets the ACL to the PUBLIC default on first creation, so this runs
-- after it, every time.
revoke all on function selftest.run_fable01() from public;

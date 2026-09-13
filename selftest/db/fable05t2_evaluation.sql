-- Task 2 database-layer selftest: Human Evaluation persona switching
-- (ADR-0020). Sibling of fable01..05 and fable05t1, same row shape, same
-- throwaway `selftest` schema.
--
-- WHAT IT RUNS AGAINST. The seeded Human Evaluation school -- one school, one
-- journey, five perspectives -- rather than a fixture of its own. A second
-- fixture would let the demonstration and the thing being tested drift apart,
-- and the demonstration is what Dr Gladys will actually use.
--
-- EVERY NEGATIVE IS BUILT AS FAR AS THE ROW THAT WOULD EXPRESS IT and then
-- shown to fail BY NAME. A refusal that fires for the wrong reason is recorded
-- as a failure here, because a control that refuses by accident is not a
-- control.
--
-- WHAT THIS FILE CANNOT TEST, STATED RATHER THAN OMITTED. Negative 7 -- an
-- expired evaluation session refuses the next action -- rests on the persona's
-- ACCESS TOKEN expiring, and this suite authenticates with `set_config`, which
-- bypasses JWT verification by construction. Nothing here could distinguish a
-- live token from a dead one. Negative 7's named test is therefore EVAL-S01,
-- over the sign-in path; what this file pins instead is the database half: the
-- recorded expiry is the token's, and no persona holds a credential that could
-- be used to obtain a fresh one.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null then
    raise exception 'apply fable01.sql before this file: the actor helper is missing';
  end if;
end $$;

create or replace function selftest.eval_fixture()
returns table (inst uuid, evaluator uuid, evaluator_uid uuid,
               per_student uuid, per_educator uuid, per_dean uuid,
               student_uid uuid, dean_uid uuid, student_person uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select i.id,
         ev.person_id,
         (select a.auth_user_id from public.accounts a where a.person_id = ev.person_id),
         (select p.id from public.evaluation_personas p where p.institution_id = i.id and p.role_perspective='STUDENT'),
         (select p.id from public.evaluation_personas p where p.institution_id = i.id and p.role_perspective='EDUCATOR'),
         (select p.id from public.evaluation_personas p where p.institution_id = i.id and p.role_perspective='DEAN'),
         (select a.auth_user_id from public.accounts a
            join public.evaluation_personas p on p.person_id = a.person_id
           where p.institution_id = i.id and p.role_perspective='STUDENT'),
         (select a.auth_user_id from public.accounts a
            join public.evaluation_personas p on p.person_id = a.person_id
           where p.institution_id = i.id and p.role_perspective='DEAN'),
         (select p.person_id from public.evaluation_personas p
           where p.institution_id = i.id and p.role_perspective='STUDENT')
    from public.institutions i
    join public.evaluation_evaluators ev on ev.revoked_at is null
   where i.official_evidence_purpose = 'HUMAN_EVALUATION'
   limit 1;
$$;

create or replace function selftest.eval_reset() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.evaluation_sessions set ended_at = now(), ended_reason = 'selftest reset'
   where ended_at is null;
end $$;

-- `audit_write` carries no client grant -- its 30-odd call sites are all inside
-- SECURITY DEFINER functions -- so the suite reaches it through one of its own.
-- SECURITY DEFINER changes the executing ROLE; it does not change `auth.uid()`,
-- which is read from the JWT claim, so the row is still written as the persona.
create or replace function selftest.eval_audit(p_inst uuid)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return public.audit_write('selftest.evaluation.probe', 'selftest', null, p_inst, '{}'::jsonb);
end $$;

create or replace function selftest.run_evaluation()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  f record; n int; v_refused boolean; v_msg text; v_row record; v_audit bigint;
  v_session uuid; v_exp timestamptz; v_real_person uuid; v_other_inst uuid;
  t0 timestamptz := clock_timestamp();
begin
  select * into f from selftest.eval_fixture();
  if f.inst is null then
    test_id := 'EVAL-T00'; invariant := 'fixture';
    ok := false; detail := 'the Human Evaluation school is not seeded; apply seed/human_evaluation.sql';
    return next; return;
  end if;
  perform selftest.eval_reset();

  -- === POSITIVE: five personas, the hub, and the pairing ===================
  ok := true; detail := '';
  select count(*) into n from public.evaluation_personas where institution_id = f.inst;
  if n <> 5 then ok := false; detail := detail || format('the school offers %s persona(s), not five; ', n); end if;
  select count(*) into n from public.evaluation_personas
   where institution_id = f.inst and role_perspective = 'SYSTEM_ADMIN';
  if n <> 0 then ok := false; detail := detail || 'a SYSTEM_ADMIN persona exists; '; end if;
  select count(*) into n from public.evaluation_personas p
   where p.institution_id = f.inst
     and p.role_perspective in ('STUDENT','EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN');
  if n <> 5 then ok := false; detail := detail || 'the five perspectives are not the frozen role model''s; '; end if;
  test_id := 'EVAL-T01'; invariant := 'ADR-0020 persona model';
  if ok then detail := 'the evaluation school offers exactly five personas, drawn from the frozen role model, '
    || 'and no SYSTEM_ADMIN perspective exists to be offered'; end if;
  return next;

  -- === NEGATIVE 1: a non-evaluator cannot enter =============================
  ok := true; detail := '';
  perform selftest.as_user('peraga-guru@evaluasi.pintar.test');
  v_refused := false; v_msg := '';
  begin
    perform * from public.evaluation_hub();
  exception when others then v_refused := true; v_msg := sqlerrm; end;
  perform selftest.as_owner();
  if not v_refused then
    ok := false; detail := detail || 'a non-evaluator reached the evaluation hub; ';
  elsif v_msg !~ 'not available to this account' then
    ok := false; detail := detail || format('refused for the wrong reason: %s; ', v_msg);
  end if;
  test_id := 'EVAL-N01'; invariant := 'ADR-0020 evaluator authorization';
  if ok then detail := 'a person who is not a live evaluator is refused BY NAME at the hub, not shown an '
    || 'empty list that would confirm the facility exists'; end if;
  return next;

  -- === NEGATIVE 2: an institution administrator cannot self-grant ==========
  ok := true; detail := '';
  perform selftest.as_user('peraga-admin@evaluasi.pintar.test');
  v_refused := false; v_msg := '';
  begin
    insert into public.evaluation_evaluators (person_id, note)
    select p.person_id, 'self' from public.evaluation_personas p
     where p.institution_id = f.inst and p.role_perspective = 'INSTITUTION_ADMIN';
  exception when others then v_refused := true; v_msg := sqlerrm; end;
  if not v_refused then ok := false; detail := detail || 'an institution admin inserted an evaluator row directly; '; end if;
  v_refused := false;
  begin
    perform public.grant_evaluator(
      (select p.person_id from public.evaluation_personas p
        where p.institution_id = f.inst and p.role_perspective = 'INSTITUTION_ADMIN'), 'self');
  exception when others then v_refused := true; end;
  if not v_refused then ok := false; detail := detail || 'an institution admin called grant_evaluator; '; end if;
  perform selftest.as_owner();
  -- and evaluator status is structurally unreachable through role_assignments
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
              where t.typname = 'app_role' and e.enumlabel ilike '%evaluat%') then
    ok := false; detail := detail || 'app_role gained an evaluator value; ';
  end if;
  test_id := 'EVAL-N02'; invariant := 'INV-16 / ADR-0020 threat row 3';
  if ok then detail := 'an institution administrator cannot acquire evaluator status by any path: the table '
    || 'refuses the insert, grant_evaluator is not on the client surface, and evaluator status is not a role '
    || 'so role_assignments cannot carry it'; end if;
  return next;

  -- === NEGATIVE 3: a person not on the allow-list cannot be assumed ========
  ok := true; detail := '';
  select p.id into v_real_person from public.persons p
    join public.enrollments e on e.person_id = p.id
   where e.institution_id <> f.inst
     and not exists (select 1 from public.evaluation_personas ep where ep.person_id = p.id)
   limit 1;
  v_refused := false; v_msg := '';
  begin
    perform * from public.assume_persona(f.evaluator, v_real_person, now() + interval '1 hour');
  exception when others then v_refused := true; v_msg := sqlerrm; end;
  if not v_refused then
    ok := false; detail := detail || 'a real learner''s person id was accepted where a persona id belongs; ';
  elsif v_msg !~ 'not a demonstration persona' then
    ok := false; detail := detail || format('refused for the wrong reason: %s; ', v_msg);
  end if;
  -- and the allow-list itself refuses a row pointing at that person
  v_refused := false; v_msg := '';
  begin
    insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
    values (v_real_person, f.inst, 'penyusup', 'STUDENT', 80);
  exception when others then v_refused := true; v_msg := sqlerrm; end;
  if not v_refused then
    ok := false; detail := detail || 'a real person was admitted to the allow-list; ';
  elsif v_msg !~ 'not a real person' then
    ok := false; detail := detail || format('the allow-list refusal fired for the wrong reason: %s; ', v_msg);
  end if;
  test_id := 'EVAL-N03'; invariant := 'ADR-0020 threat row 2';
  if ok then detail := 'a real learner''s id is refused as a persona id, and a persona row pointing at a real '
    || 'person -- one holding an enrolment elsewhere -- is refused by name at the allow-list'; end if;
  return next;

  -- === NEGATIVE 4: no persona can be authenticated outside the Hub =========
  ok := true; detail := '';
  select count(*) into n from public.evaluation_personas pe
    join public.accounts a on a.person_id = pe.person_id
    join auth.users u on u.id = a.auth_user_id
   where coalesce(u.encrypted_password, '') <> '';
  if n <> 0 then
    ok := false; detail := detail || format('%s persona account(s) carry a password; ', n);
  end if;
  -- assume_persona is unreachable from a client role, so nothing but the server
  -- can open a persona session at all
  if has_function_privilege('authenticated', 'public.assume_persona(uuid, uuid, timestamptz)'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.assume_persona(uuid, uuid, timestamptz)'::regprocedure, 'EXECUTE') then
    ok := false; detail := detail || 'assume_persona is reachable by a client role; ';
  end if;
  if exists (select 1 from public.client_rpc_registry r where r.function_name = 'assume_persona') then
    ok := false; detail := detail || 'assume_persona is declared as a client entry point; ';
  end if;
  test_id := 'EVAL-N04'; invariant := 'ADR-0020 threat rows 4 and 6';
  if ok then detail := 'no persona account carries a credential anybody could use, and assume_persona is '
    || 'reachable only by the server: a persona session cannot be created outside the assume flow'; end if;
  return next;

  -- === NEGATIVE 5: no persona-to-persona transition ========================
  --
  -- NEGATIVES 5 AND 6 ARE ONE CONTROL, and this test says so rather than
  -- staging two. Once `assume_persona` moved behind the service role (0070) a
  -- persona cannot call it at all, and its evaluator holds a live session until
  -- they exit -- so changing persona REQUIRES returning to the Hub. Both halves
  -- are proved: the persona is refused by privilege, and the evaluator is
  -- refused by name.
  ok := true; detail := '';
  select * into v_row from public.assume_persona(f.evaluator, f.per_student, now() + interval '1 hour');
  v_session := v_row.evaluation_session_id;
  perform selftest.as_user('peraga-siswa@evaluasi.pintar.test');
  v_refused := false; v_msg := '';
  begin
    perform * from public.assume_persona(f.evaluator, f.per_educator, now() + interval '1 hour');
  exception when others then v_refused := true; v_msg := sqlerrm; end;
  perform selftest.as_owner();
  if not v_refused then
    ok := false; detail := detail || 'a persona reached assume_persona and switched directly; ';
  elsif v_msg !~ 'permission denied' then
    ok := false; detail := detail || format('the persona was refused for the wrong reason: %s; ', v_msg);
  end if;
  test_id := 'EVAL-N05'; invariant := 'ADR-0020 lifecycle';
  if ok then detail := 'a persona cannot reach the assumption path at all -- it is revoked from every client '
    || 'role -- so a persona-to-persona transition is impossible by privilege rather than by a check that '
    || 'could be forgotten. Returning to the Hub and exiting is the only route, enforced by the live-session '
    || 'refusal proved in EVAL-N06'; end if;
  return next;

  -- === NEGATIVE 6: two simultaneous personas are refused ===================
  ok := true; detail := '';
  v_refused := false; v_msg := '';
  begin
    perform * from public.assume_persona(f.evaluator, f.per_educator, now() + interval '1 hour');
  exception when others then v_refused := true; v_msg := sqlerrm; end;
  if not v_refused then
    ok := false; detail := detail || 'one evaluator holds two live personas; ';
  elsif v_msg !~ 'already viewing as someone' then
    ok := false; detail := detail || format('refused for the wrong reason: %s; ', v_msg);
  end if;
  select count(*) into n from public.evaluation_sessions
   where evaluator_person_id = f.evaluator and ended_at is null;
  if n <> 1 then ok := false; detail := detail || format('%s live session(s) for one evaluator; ', n); end if;
  test_id := 'EVAL-N06'; invariant := 'ADR-0020 lifecycle';
  if ok then detail := 'one effective persona at a time: the second assumption is refused by name and the '
    || 'unique index makes a concurrent one impossible'; end if;
  return next;

  -- === PROPERTY: the dual-identity audit ===================================
  ok := true; detail := '';
  perform selftest.as_user('peraga-siswa@evaluasi.pintar.test');
  v_audit := selftest.eval_audit(f.inst);
  perform selftest.as_owner();
  if (select al.actor_person_id from public.audit_log al where al.id = v_audit)
       is distinct from f.student_person then
    ok := false; detail := detail || 'the acting identity is not the persona''s; ';
  end if;
  if (select al.evaluation_actor_person_id from public.audit_log al where al.id = v_audit)
       is distinct from f.evaluator then
    ok := false; detail := detail || 'the evaluation actor is not the evaluator''s: the action reads as genuine; ';
  end if;
  if (select al.evaluation_session_id from public.audit_log al where al.id = v_audit)
       is distinct from v_session then
    ok := false; detail := detail || 'the audit row does not name the evaluation session; ';
  end if;
  if not (select a.ok from public.assert_evaluation_audit_complete() a) then
    ok := false; detail := detail || (select a.detail from public.assert_evaluation_audit_complete() a) || '; ';
  end if;
  test_id := 'EVAL-P01'; invariant := 'INV-18 / ADR-0020 threat row 5';
  if ok then detail := 'an action taken as a persona carries BOTH identities -- whose authorization was '
    || 'exercised and who actually did it -- and the trail-wide property holds: audit_write is the only '
    || 'writer and stamps from a live-session lookup'; end if;
  return next;

  -- === NEGATIVE 8: the persona is refused what that persona is refused =====
  ok := true; detail := '';
  perform selftest.eval_reset();
  select * into v_row from public.assume_persona(f.evaluator, f.per_dean, now() + interval '1 hour');
  v_session := v_row.evaluation_session_id;
  perform selftest.as_user('peraga-kepala@evaluasi.pintar.test');
  -- INV-19: leadership reads, it does not author. The boundary is EXERCISED --
  -- the DEAN is a real DEAN here, and the capability answer is the database's.
  if public.can_in_institution('CAN_DRAFT', f.inst) then
    ok := false; detail := detail || 'the DEAN persona holds CAN_DRAFT (INV-19); ';
  end if;
  if public.can_in_institution('CAN_PUBLISH', f.inst) then
    ok := false; detail := detail || 'the DEAN persona holds CAN_PUBLISH; ';
  end if;
  v_refused := false;
  begin
    perform * from public.studio_package_state(
      (select c.id from public.courses c where c.institution_id = f.inst limit 1));
  exception when others then v_refused := true; end;
  select count(*) into n from public.studio_home();
  if n <> 0 then
    ok := false; detail := detail || format('the DEAN persona sees %s Studio institution(s); ', n);
  end if;
  -- and leadership CAN still read, or the refusal would be indistinguishable
  -- from having no session at all
  if not public.is_member_of_institution(f.inst) then
    ok := false; detail := detail || 'the DEAN persona is not a member of its own school; ';
  end if;
  perform selftest.as_owner();
  test_id := 'EVAL-N08'; invariant := 'INV-19 demonstrated, not bypassed';
  if ok then detail := 'the assumed DEAN is refused exactly what a DEAN is refused -- no CAN_DRAFT, no '
    || 'CAN_PUBLISH, no Studio -- while remaining a member of its own school, so the refusal is the '
    || 'boundary being exercised rather than the session being absent'; end if;
  return next;

  -- === NEGATIVE 7 (database half) ==========================================
  ok := true; detail := '';
  perform selftest.eval_reset();
  v_exp := now() + interval '7 hours';
  select * into v_row from public.assume_persona(f.evaluator, f.per_student, v_exp);
  if v_row.expires_at is distinct from v_exp then
    ok := false; detail := detail || format('the session expiry %s is not the token''s %s; ', v_row.expires_at, v_exp);
  end if;
  if (select s.expires_at from public.evaluation_sessions s where s.id = v_row.evaluation_session_id)
       is distinct from v_exp then
    ok := false; detail := detail || 'the stored expiry is not the token''s; ';
  end if;
  perform selftest.eval_reset();
  v_refused := false;
  begin
    perform * from public.assume_persona(f.evaluator, f.per_student, now() - interval '1 second');
  exception when others then v_refused := true; end;
  if not v_refused then ok := false; detail := detail || 'a session opened on an already-dead token; '; end if;
  test_id := 'EVAL-N07'; invariant := 'ADR-0020 escape / negative 7 (database half)';
  if ok then detail := 'the recorded expiry is the token''s to the instant -- not capped, not offset, so a '
    || 'session can never be shorter than the token it describes -- and a dead token opens nothing. The '
    || 'ENFORCEMENT is the token itself and is pinned by EVAL-S01: this suite authenticates with set_config '
    || 'and bypasses JWT verification by construction, so nothing here could distinguish a live token from '
    || 'a dead one'; end if;
  return next;

  -- === POSITIVE: exit is server-side ======================================
  ok := true; detail := '';
  perform selftest.eval_reset();
  select * into v_row from public.assume_persona(f.evaluator, f.per_student, now() + interval '1 hour');
  v_session := v_row.evaluation_session_id;
  perform selftest.as_user('peraga-siswa@evaluasi.pintar.test');
  select count(*) into n from public.evaluation_state();
  if n <> 1 then ok := false; detail := detail || 'the indicator does not see the live session; '; end if;
  perform public.exit_persona();
  select count(*) into n from public.evaluation_state();
  if n <> 0 then ok := false; detail := detail || 'the indicator survives the session; '; end if;
  perform selftest.as_owner();
  if (select s.ended_at from public.evaluation_sessions s where s.id = v_session) is null then
    ok := false; detail := detail || 'exit did not end the session server-side; ';
  end if;
  if (select al.evaluation_actor_person_id from public.audit_log al
       where al.action = 'evaluation.exit' and al.target_id = v_session::text) is distinct from f.evaluator then
    ok := false; detail := detail || 'the exit event does not carry both identities; ';
  end if;
  test_id := 'EVAL-P02'; invariant := 'ADR-0020 lifecycle / INV-17';
  if ok then detail := 'exit ends the pairing in the database, not just in a cookie; the indicator is gone '
    || 'because it reads the session; and the exit event itself carries both identities because it is '
    || 'audited before the session closes'; end if;
  return next;

  -- === NEGATIVE 10 and 11: production and the bounded purpose ==============
  ok := true; detail := '';
  perform selftest.eval_reset();
  -- 11a: an unapproved purpose is impossible BY TYPE
  v_refused := false;
  begin
    execute $x$ select 'NOT_A_REAL_PURPOSE'::public.official_evidence_purpose $x$;
  exception when others then v_refused := true; end;
  if not v_refused then ok := false; detail := detail || 'an unapproved official_evidence_purpose is accepted; '; end if;
  -- 11b: a second institution under the same purpose is refused
  v_refused := false;
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active,
                                     is_official_bootstrap, official_evidence_purpose)
    values ('duplikat evaluasi', 'duplikat-evaluasi', false, true, true, 'HUMAN_EVALUATION')
    returning id into v_other_inst;
  exception when others then v_refused := true; end;
  if not v_refused then ok := false; detail := detail || 'two institutions occupy HUMAN_EVALUATION; '; end if;
  -- 10: the production refusal is the trigger's, read from the live function
  if pg_get_functiondef('public.enforce_evaluation_not_in_production()'::regprocedure) !~ 'production' then
    ok := false; detail := detail || 'the evaluation tables carry no production refusal; ';
  end if;
  select count(*) into n from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
   where not tg.tgisinternal and c.relname in ('evaluation_personas','evaluation_evaluators','evaluation_sessions')
     and tg.tgfoid = 'public.enforce_evaluation_not_in_production()'::regprocedure;
  if n <> 3 then
    ok := false; detail := detail || format('%s of 3 evaluation tables refuse production; ', n);
  end if;
  if pg_get_functiondef('public.enforce_official_bootstrap()'::regprocedure) !~ 'official_evidence_purpose' then
    ok := false; detail := detail || 'the purpose is not refused in production alongside the flag; ';
  end if;
  test_id := 'EVAL-N1011'; invariant := 'INV-21 / ADR-0020 §5';
  if ok then detail := 'an unapproved purpose cannot be spelled at all, a second institution cannot occupy '
    || 'an approved one, all three evaluation tables refuse production by trigger, and the purpose is '
    || 'refused there independently of the flag'; end if;
  return next;

  -- === NEGATIVE 9: no persona credential in any artefact ==================
  ok := true; detail := '';
  select count(*) into n from public.audit_log al
   where al.summary::text ~* 'password|encrypted_password|refresh_token|access_token';
  if n <> 0 then ok := false; detail := detail || format('%s audit row(s) carry credential-shaped text; ', n); end if;
  select count(*) into n from public.evaluation_sessions s
   where s::text ~* 'password|refresh_token';
  if n <> 0 then ok := false; detail := detail || 'an evaluation session row carries credential-shaped text; '; end if;
  select count(*) into n from public.evaluation_personas pe
    join public.accounts a on a.person_id = pe.person_id
    join auth.users u on u.id = a.auth_user_id
   where coalesce(u.encrypted_password, '') <> '';
  if n <> 0 then ok := false; detail := detail || format('%s persona(s) carry a password; ', n); end if;
  test_id := 'EVAL-N09'; invariant := 'ADR-0020 threat row 4';
  if ok then detail := 'no persona credential exists to leak: the accounts carry no password, and no audit '
    || 'row or session row carries credential-shaped text'; end if;
  return next;

  -- === PROPERTY: evidence, and the boundary ================================
  ok := true; detail := '';
  if pg_get_functiondef('public.derive_evidence_class(uuid, public.evidence_channel)'::regprocedure)
       ~* 'official_evidence_purpose|is_official_bootstrap|tenant_kind' then
    ok := false; detail := detail || 'derive_evidence_class reads a tenant-axis input it must not; ';
  end if;
  -- the evaluation school's evidence is OFFICIAL through the ORDINARY cap
  -- model -- proved by the same expression that proves it for the D1 tenant
  if public.derive_evidence_class(f.inst, 'ONLINE') <> 'OFFICIAL' then
    ok := false; detail := detail || 'the evaluation school does not derive OFFICIAL evidence; ';
  end if;
  if (select public.derive_evidence_class(i.id, 'ONLINE') from public.institutions i
       where i.official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP') <> 'OFFICIAL' then
    ok := false; detail := detail || 'the D1 tenant no longer derives OFFICIAL; the comparison is void; ';
  end if;
  select count(*) into n from public.assessment_sessions s
    join public.enrollments e on e.id = s.enrollment_id
   where e.institution_id = f.inst and s.evidence_class = 'OFFICIAL' and s.status = 'FINALIZED';
  if n < 1 then ok := false; detail := detail || 'the demonstration journey produced no OFFICIAL evidence; '; end if;
  if not (select a.ok from public.assert_evaluation_boundary() a) then
    ok := false; detail := detail || (select a.detail from public.assert_evaluation_boundary() a) || '; ';
  end if;
  if not (select a.ok from public.assert_official_evidence_bootstrap() a) then
    ok := false; detail := detail || (select a.detail from public.assert_official_evidence_bootstrap() a) || '; ';
  end if;
  test_id := 'EVAL-P03'; invariant := 'INV-20 / ADR-0020 §5';
  if ok then detail := 'the evaluation school''s evidence is OFFICIAL through the ordinary cap model -- the '
    || 'same expression that proves it for the D1 tenant -- and derive_evidence_class reads neither the '
    || 'flag, nor tenant_kind, nor the purpose'; end if;
  return next;

  -- === PROPERTY: nothing in the authorization root learned about evaluation
  ok := true; detail := '';
  foreach v_msg in array array['current_person_id()','is_system_admin()','is_member_of_institution(uuid)',
                               'has_scope(public.app_role, uuid)','can_in_institution(text, uuid)',
                               'role_assignments_guard()','derive_evidence_class(uuid, public.evidence_channel)'] loop
    if pg_get_functiondef(('public.' || v_msg)::regprocedure) ~* 'evaluation' then
      ok := false; detail := detail || format('%s learned about evaluation; ', v_msg);
    end if;
  end loop;
  select count(*) into n from pg_policies
   where schemaname = 'public' and (coalesce(qual,'') || coalesce(with_check,'')) ~* 'evaluation_';
  if n <> 0 then ok := false; detail := detail || format('%s RLS policy/policies read an evaluation table; ', n); end if;
  test_id := 'EVAL-P04'; invariant := 'ADR-0020 §3.1 -- the single most important property';
  if ok then detail := 'no authorization root and no RLS policy knows the evaluation facility exists: a '
    || 'persona is authorized because it IS the persona, and evaluation changes who you are rather than '
    || 'what you may do'; end if;
  return next;

  perform selftest.eval_reset();
  test_id := 'EVAL-DONE'; invariant := 'suite';
  ok := true;
  detail := format('Task 2 evaluation suite complete in %s ms',
                   round(extract(milliseconds from clock_timestamp() - t0)));
  return next;
end $$;

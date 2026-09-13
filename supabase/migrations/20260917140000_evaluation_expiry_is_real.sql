-- 0069 -- an expired evaluation session refuses the next ACTION, not just the
-- next visit to the Hub. Task 2 negative 7, raised as a gate blocker.
--
-- WHAT WAS WRONG IN 0068. Expiry was enforced at the evaluation surface and in
-- the application proxy, and 0068's header said so plainly. That is an
-- APPLICATION boundary, not an expiry boundary: a persona holding an ordinary
-- authenticated session could still call any authenticated RPC directly,
-- because its JWT says yes and nothing else was consulted. The threat model's
-- escape condition -- the effective persona must not persist past expiry -- was
-- not met.
--
-- WHAT MAY NOT BE DONE ABOUT IT. No evaluation check goes into
-- `current_person_id`, `is_member_of_institution`, `has_scope`,
-- `can_in_institution`, `role_assignments_guard` or any RLS predicate.
-- ADR-0020 forbids it.
--
-- ===========================================================================
-- WHAT WAS MEASURED, BEFORE CHOOSING. Two closures looked credible. Only one
-- survives contact with this schema.
--
-- THE AUTHORIZATION MODEL, lever by lever:
--
--   role_assignments.valid_until in the past -> is_member_of_institution FALSE,
--     can_in_institution FALSE, has_scope FALSE. Complete, through predicates
--     that already read it.
--   ...but role_assignments are IMMUTABLE. The guard refuses an UPDATE of
--     valid_until outright, so a standing grant can never be narrowed; the
--     bound would have to be written when the grant is MADE.
--   ...and a grant made at assume time is REFUSED BY INV-16. `assume_persona`
--     runs as the evaluator, `role_assignments_guard` reads
--     `current_person_id()`, and an evaluator holds no INSTITUTION_ADMIN scope
--     over the target node: "grantor lacks INSTITUTION_ADMIN scope over the
--     target node (INV-16)". Measured, not reasoned.
--
--     The only ways past that are to teach `role_assignments_guard` about
--     evaluation -- an authorization path -- or to clear the JWT inside
--     `assume_persona` so the guard takes its seed path, which would hand a
--     client-reachable function the ability to grant any role to any person.
--     Both are refused. So the time-bounded-grant closure is NOT AVAILABLE in
--     this schema, for role personas as well as for STUDENT.
--
--   enrollments.valid_to -> cannot be set on an ACTIVE enrolment at all: a
--     CHECK ties it to ENDED/CANCELLED. It is a closure record, not a bound.
--   status = 'ENDED' -> closes my_learning_assignments and the scored paths
--     (INV-17) but leaves is_member_of_institution TRUE, because membership
--     tests `<> 'CANCELLED'`.
--   status = 'CANCELLED' -> UNREACHABLE. ACTIVE -> CANCELLED is refused by the
--     enrolment state machine.
--
-- ===========================================================================
-- THE CLOSURE, AND IT IS THE ONLY ONE: THE PERSONA'S OWN TOKEN.
--
-- The evaluation session expires exactly when the persona's ACCESS TOKEN
-- expires, and the persona's session is minted WITHOUT refresh material. At
-- that instant the JWT is rejected by the platform before any PINTAR code runs:
-- `auth.uid()` is null, `current_person_id()` is null, and every authenticated
-- path refuses -- learner, staff, read and write alike, for all five personas
-- including STUDENT. No predicate changed, no evaluation logic anywhere, and no
-- scheduler: the bound is the token's own `exp`.
--
-- WHAT THIS MIGRATION CONTRIBUTES, since the token is minted outside the
-- database: it makes the database INCAPABLE of recording an expiry the token
-- does not support. `assume_persona` now takes the token's expiry and stores
-- `least(token exp, policy maximum)`. A caller can only ever SHORTEN the
-- session; there is no argument that lengthens it. The indicator, the audit row
-- and every report therefore describe a window the token actually bounds.
--
-- WHAT WOULD FALSIFY THE CLOSURE, stated so it can be tested rather than
-- trusted: persisting a refresh token for a persona session, or minting the
-- persona session by any path that can renew it. Neither is visible from here;
-- both are pinned by a static test over the sign-in path (EVAL-S01), and that
-- test is the named negative for this control.
--
-- WHAT IS HONESTLY NOT CLOSED IN THE DATABASE. Until the token expires, a
-- persona is an ordinary authorized person and PINTAR treats it as one -- which
-- is the design, not a defect: the evaluator is meant to experience the
-- persona's real authorization. The database cannot shorten that window, and
-- this migration does not pretend to. The probe below asserts that gap
-- POSITIVELY, so that if a later change closes it, this fires and the record
-- has to be corrected deliberately rather than drifting.

-- ---------------------------------------------------------------------------
-- The one-argument form is DROPPED rather than kept alongside: an entry point
-- that sets its own expiry is the defect, and leaving it callable would leave
-- the defect callable. An overload would also have moved
-- `overloaded_client_rpcs`.
-- ---------------------------------------------------------------------------
drop function public.assume_persona(uuid);
delete from public.client_rpc_registry where function_name = 'assume_persona';

create function public.assume_persona(p_persona uuid, p_token_expires_at timestamptz)
returns table (evaluation_session_id uuid, persona_auth_user_id uuid,
               label text, expires_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_me uuid; v_persona public.evaluation_personas; v_uid uuid; v_session uuid;
        v_expires timestamptz;
begin
  -- No persona-to-persona transition, checked FIRST -- see 0068.
  if exists (select 1 from public.evaluation_sessions s
              where s.persona_auth_user_id = auth.uid() and s.ended_at is null) then
    raise exception 'return to the evaluation hub before viewing as someone else';
  end if;

  v_me := public.current_person_id();
  if not exists (select 1 from public.evaluation_evaluators e
                  where e.person_id = v_me and e.revoked_at is null) then
    raise exception 'evaluation mode is not available to this account';
  end if;
  if exists (select 1 from public.evaluation_sessions s
              where s.evaluator_person_id = v_me and s.ended_at is null) then
    raise exception 'you are already viewing as someone; exit evaluation first';
  end if;

  select * into v_persona from public.evaluation_personas where id = p_persona;
  if v_persona.id is null then
    raise exception 'that is not a demonstration persona';
  end if;
  select a.auth_user_id into v_uid from public.accounts a where a.person_id = v_persona.person_id;
  if v_uid is null then
    raise exception 'that persona has no account to sign in as';
  end if;

  -- THE EXPIRY IS THE TOKEN'S, CAPPED BY POLICY, AND CAN ONLY BE SHORTENED.
  -- `least` is what makes a caller-supplied value safe: a caller passing a
  -- far-future expiry gets the policy cap, a caller passing a near one gets
  -- their own, and no argument lengthens the session. That is the whole
  -- property -- this value is what the indicator shows and what the audit
  -- record claims, and it must never claim more than the token allows.
  if p_token_expires_at is null then
    raise exception 'a persona session must state when its token expires';
  end if;
  v_expires := least(p_token_expires_at, now() + interval '2 hours');
  if v_expires <= now() then
    raise exception 'that persona session has already expired';
  end if;

  insert into public.evaluation_sessions (evaluator_person_id, persona_id, persona_auth_user_id, expires_at)
  values (v_me, v_persona.id, v_uid, v_expires) returning id into v_session;

  perform public.audit_write('evaluation.assume', 'evaluation_sessions', v_session::text,
                             v_persona.institution_id,
                             jsonb_build_object('persona', v_persona.label,
                                                'role_perspective', v_persona.role_perspective,
                                                'expires_at', v_expires,
                                                'token_expires_at', p_token_expires_at));
  return query select v_session, v_uid, v_persona.label, v_expires;
end $function$;

revoke all on function public.assume_persona(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.assume_persona(uuid, timestamptz) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('assume_persona', 'PLATFORM',
   'records the evaluator/persona pairing and returns the account to sign in as -- an identifier, never a credential. The session expires at least(token exp, two hours): a caller can shorten it, never lengthen it, so the recorded window never claims more than the persona''s token allows');

-- ---------------------------------------------------------------------------
-- The boundary assertion gains the one thing the database can guarantee about
-- expiry: that it never records a window longer than policy allows.
-- ---------------------------------------------------------------------------
create or replace function public.assert_evaluation_boundary()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; bad text; v_env text;
        n_personas int; n_evaluators int; n_live int;
begin
  select environment into v_env from public.platform_environment;
  select count(*) into n_personas from public.evaluation_personas;
  select count(*) into n_evaluators from public.evaluation_evaluators where revoked_at is null;
  select count(*) into n_live from public.evaluation_sessions where ended_at is null;

  if v_env = 'production' and (n_personas > 0 or n_evaluators > 0 or n_live > 0) then
    problems := problems || 'the evaluation facility has rows in production'::text;
  end if;

  select string_agg(distinct pe.label || ' (' || ra.role::text || ')', ', ') into bad
    from public.evaluation_personas pe
    join public.role_assignments ra on ra.person_id = pe.person_id and ra.revoked_at is null
   where ra.role = 'SYSTEM_ADMIN' or ra.scope_node_id is null;
  if bad is not null then
    problems := problems || ('persona(s) holding platform-wide authority: ' || bad);
  end if;

  -- ADDED IN 0069. No session claims a window longer than the policy cap. This
  -- is the database's whole contribution to the expiry control: it cannot mint
  -- the token, but it can refuse to describe a longer one than exists.
  select count(*)::text into bad from public.evaluation_sessions s
   where s.expires_at > s.started_at + interval '2 hours';
  if bad <> '0' then
    problems := problems || (bad || ' evaluation session(s) recorded an expiry beyond the policy maximum');
  end if;
  -- and assume_persona still derives it rather than choosing it
  if pg_get_functiondef('public.assume_persona(uuid, timestamptz)'::regprocedure)
       !~ 'least\(p_token_expires_at' then
    problems := problems || 'assume_persona no longer caps the recorded expiry at the token''s'::text;
  end if;

  select string_agg(distinct pe.label, ', ') into bad
    from public.evaluation_personas pe
   where exists (select 1 from public.role_assignments ra
                  where ra.person_id = pe.person_id and ra.revoked_at is null
                    and ra.institution_id is distinct from pe.institution_id)
      or exists (select 1 from public.enrollments e
                  where e.person_id = pe.person_id and e.status <> 'CANCELLED'
                    and e.institution_id is distinct from pe.institution_id);
  if bad is not null then
    problems := problems || ('persona(s) reaching outside the evaluation institution: ' || bad);
  end if;

  select string_agg(distinct pe.label, ', ') into bad
    from public.evaluation_personas pe join public.institutions i on i.id = pe.institution_id
   where i.official_evidence_purpose is distinct from 'HUMAN_EVALUATION';
  if bad is not null then
    problems := problems || ('persona(s) outside the evaluation institution: ' || bad);
  end if;

  select string_agg(distinct p.id::text, ', ') into bad
    from public.persons p
   where exists (select 1 from public.evaluation_personas pe where pe.person_id = p.id)
     and exists (select 1 from public.evaluation_evaluators ev
                  where ev.person_id = p.id and ev.revoked_at is null);
  if bad is not null then
    problems := problems || ('person(s) who are both evaluator and persona: ' || bad);
  end if;

  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
              where t.typname = 'app_role' and e.enumlabel ilike '%evaluat%') then
    problems := problems || 'app_role gained an evaluator value: evaluator status became a role'::text;
  end if;

  select count(*)::text into bad from public.evaluation_sessions s
   where s.ended_at is null
     and not exists (select 1 from public.evaluation_evaluators e
                      where e.person_id = s.evaluator_person_id and e.revoked_at is null);
  if bad <> '0' then
    problems := problems || (bad || ' live evaluation session(s) whose evaluator is revoked');
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'environment=%s; %s persona(s), %s live evaluator(s), %s live session(s); no persona holds '
      || 'platform-wide authority or reaches outside the evaluation institution, and no session claims '
      || 'a window longer than its token allows',
      v_env, n_personas, n_evaluators, n_live)
    else array_to_string(problems, '; ') end;
  return next;
end $function$;
revoke all on function public.assert_evaluation_boundary() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_refused boolean; v_msg text; v_src text;
  v_inst uuid; v_period uuid; v_fac uuid; v_dept uuid; v_prog uuid; v_coh uuid; v_cls uuid;
  u_ev uuid := gen_random_uuid(); p_ev uuid;
  u_guru uuid := gen_random_uuid(); p_guru uuid;
  per_guru uuid; v_row record; v_session uuid;
begin
  -- === structural ==========================================================
  if exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
              where ns.nspname='public' and p.proname='assume_persona'
                and pg_get_function_identity_arguments(p.oid) = 'uuid') then
    raise exception 'the one-argument assume_persona survives; it sets its own expiry';
  end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname='public' and p.proname='assume_persona';
  if n <> 1 then raise exception 'assume_persona is overloaded % ways', n; end if;
  v_src := pg_get_functiondef('public.assume_persona(uuid, timestamptz)'::regprocedure);
  if v_src !~ 'least\(p_token_expires_at' then
    raise exception 'assume_persona does not cap the recorded expiry at the token''s';
  end if;
  -- no authorization root learned about evaluation. Re-asserted here because
  -- THIS is the migration that was tempted, and `role_assignments_guard` is
  -- named explicitly because it is the one INV-16 refused.
  foreach v_msg in array array['current_person_id()','is_system_admin()','is_member_of_institution(uuid)',
                               'has_scope(public.app_role, uuid)','can_in_institution(text, uuid)',
                               'role_assignments_guard()'] loop
    if pg_get_functiondef(('public.' || v_msg)::regprocedure) ~* 'evaluation' then
      raise exception '% learned about evaluation; negative 7 was closed the forbidden way', v_msg;
    end if;
  end loop;
  -- and assume_persona does not clear the JWT to slip past a guard
  if v_src ~ 'seed_intent' or v_src ~ 'request\.jwt' then
    raise exception 'assume_persona manipulates the caller''s identity context';
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    select i.id into v_inst from public.institutions i
     where i.official_evidence_purpose = 'HUMAN_EVALUATION';
    if v_inst is null then
      insert into public.institutions (name, slug, is_synthetic, is_active,
                                       is_official_bootstrap, official_evidence_purpose)
      values ('probe 0069 evaluation', 'probe-0069-evaluation', false, true, true, 'HUMAN_EVALUATION')
      returning id into v_inst;
    end if;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, 'probe 0069', current_date - 30, current_date + 300) returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'probe F 0069') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'probe D 0069') returning id into v_dept;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dept, 'PROGRAMME', 'probe P 0069') returning id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'probe C 0069', v_period) returning id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'probe K 0069', v_period) returning id into v_cls;

    insert into auth.users (id, email) values (u_ev, 'probe0069-evaluator@local.invalid');
    select a.person_id into p_ev from public.accounts a where a.auth_user_id = u_ev;
    insert into auth.users (id, email) values (u_guru, 'probe0069-guru@local.invalid');
    select a.person_id into p_guru from public.accounts a where a.auth_user_id = u_guru;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_guru, 'EDUCATOR', v_cls, now() + interval '10 years');
    insert into public.evaluation_evaluators (person_id, note) values (p_ev, 'probe');
    perform set_config('app.seed_intent', '', true);
    insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
    values (p_guru, v_inst, 'probe guru', 'EDUCATOR', 95) returning id into per_guru;

    perform set_config('request.jwt.claims', json_build_object('sub', u_ev::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_ev::text, true);

    -- (1) a null token expiry is refused: the session must know what bounds it
    v_refused := false;
    begin
      perform * from public.assume_persona(per_guru, null);
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a persona was assumed with no token expiry'; end if;

    -- (2) an already-expired token is refused outright
    v_refused := false;
    begin
      perform * from public.assume_persona(per_guru, now() - interval '1 minute');
    exception when others then v_refused := true; v_msg := sqlerrm; end;
    if not v_refused then raise exception 'a persona was assumed with an already-expired token'; end if;

    -- (3) A CALLER CANNOT LENGTHEN THE SESSION. This is the property the whole
    --     argument rests on: the recorded window never claims more than the
    --     token allows, whatever the caller passes.
    select * into v_row from public.assume_persona(per_guru, now() + interval '99 hours');
    if v_row.expires_at > now() + interval '2 hours' + interval '5 seconds' then
      raise exception 'a caller lengthened the evaluation session to %', v_row.expires_at;
    end if;

    -- exit the ordinary way, as the persona, so (4) can assume again
    perform set_config('request.jwt.claims', json_build_object('sub', u_guru::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_guru::text, true);
    perform public.exit_persona();
    perform set_config('request.jwt.claims', json_build_object('sub', u_ev::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_ev::text, true);

    -- (4) and a caller CAN shorten it
    select * into v_row from public.assume_persona(per_guru, now() + interval '10 minutes');
    if v_row.expires_at > now() + interval '11 minutes' then
      raise exception 'a short token expiry was not honoured: %', v_row.expires_at;
    end if;

    -- (5) THE HONEST HALF, asserted positively. Until the token expires the
    --     persona is an ordinary authorized person and PINTAR treats it as one
    --     -- which is the design. The database has no lever that changes this:
    --     role grants are immutable and cannot be made at assume (INV-16
    --     refuses an evaluator as grantor), and enrolment membership has no
    --     time bound any predicate reads. If a later change closes it, this
    --     fires and 0069's header, EVAL-S01 and the completion report all have
    --     to be corrected deliberately.
    perform set_config('request.jwt.claims', json_build_object('sub', u_guru::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_guru::text, true);
    if not public.is_member_of_institution(v_inst) then
      raise exception
        'a persona is no longer authorized while its evaluation session is live -- the database gained an '
        'expiry lever it did not have; 0069''s header and the report must be corrected';
    end if;

    -- (6) INV-16 still refuses an evaluator as a grantor. Measured here rather
    --     than asserted in prose, because it is the reason the time-bounded
    --     grant closure does not exist.
    perform set_config('request.jwt.claims', json_build_object('sub', u_ev::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_ev::text, true);
    v_refused := false; v_msg := '';
    begin
      insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
      values (p_guru, 'EDUCATOR', v_cls, now() + interval '1 hour');
    exception when others then v_refused := true; v_msg := sqlerrm; end;
    if not v_refused then
      raise exception 'an evaluator granted a role; INV-16 no longer refuses it and leg B is now available';
    end if;
    if v_msg !~ 'INV-16' then
      raise exception 'the grantor refusal fired for the wrong reason: %', v_msg;
    end if;

    raise exception 'PROBE_0069_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0069_ROLLBACK' then raise; end if;
  end;
end $$;

-- 0068 -- the Evaluation Hub surface: list, assume, exit, and the indicator's
-- own source of truth. ADR-0020, Task 2 §8.
--
-- WHAT THESE FOUR FUNCTIONS ARE, AND WHAT THEY ARE NOT. They are the evaluation
-- SURFACE. Not one of them decides an authorization outcome for anything else in
-- the platform: `assume_persona` records a pairing and hands the caller the
-- account to sign in as; the actual authorization the evaluator then experiences
-- belongs to the persona's own session and is decided by the same predicates as
-- for any other person, unchanged and unaware. That separation is the design.
--
-- WHERE THE CREDENTIAL IS, WHICH IS NOWHERE HERE. `assume_persona` returns the
-- persona's auth user id -- an identifier, not a secret. The credential is
-- derived server-side by the application from a server-only pepper, exactly as
-- classroom-card PINs are (FABLE-01 §2), and never enters the database, a
-- response, a log or the repository. Nothing in this migration can leak one
-- because nothing in this migration has one.
--
-- THE EXPIRY BOUNDARY, STATED RATHER THAN IMPLIED. An evaluation session's
-- expiry is enforced HERE -- at the evaluation surface -- and by the application
-- proxy on the next request, which ends the session and terminates the persona's
-- auth session. It is deliberately NOT enforced inside PINTAR's authorization
-- path: doing so would put evaluation logic in the authorization root, which
-- ADR-0020 forbids. The consequence is precise and worth being honest about: an
-- expired persona session that has not yet met the proxy can still act as the
-- persona until it does -- and every action it takes is still stamped with both
-- identities, because `audit_write` keys on `ended_at`, not on expiry. Expiry
-- bounds a demonstration; it was never a containment boundary, and the audit
-- trail is what does not depend on it.

-- ---------------------------------------------------------------------------
-- 1. The Hub. What the evaluator may assume, and nothing about anyone else.
-- ---------------------------------------------------------------------------
create function public.evaluation_hub()
returns table (persona_id uuid, label text, role_perspective public.app_role,
               institution_name text, ordinal smallint)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
begin
  -- An allow-list is only a control if the gate in front of it is one. A caller
  -- who is not a live evaluator gets a refusal, not an empty list: an empty list
  -- would tell them the facility exists and they are merely unlucky.
  if not exists (select 1 from public.evaluation_evaluators e
                  where e.person_id = public.current_person_id() and e.revoked_at is null) then
    raise exception 'evaluation mode is not available to this account';
  end if;
  return query
    select p.id, p.label, p.role_perspective, i.name, p.ordinal
      from public.evaluation_personas p
      join public.institutions i on i.id = p.institution_id
     order by p.ordinal;
end $function$;

-- ---------------------------------------------------------------------------
-- 2. Assume. The allow-list is consulted here and the pairing is recorded here.
-- ---------------------------------------------------------------------------
create function public.assume_persona(p_persona uuid)
returns table (evaluation_session_id uuid, persona_auth_user_id uuid,
               label text, expires_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_me uuid; v_persona public.evaluation_personas; v_uid uuid; v_session uuid;
        v_expires timestamptz;
begin
  -- NO PERSONA-TO-PERSONA TRANSITION, and this check is FIRST.
  --
  -- The caller here is the persona, not the evaluator, so the evaluator gate
  -- below would refuse them anyway -- with "not available to this account",
  -- which is true, unhelpful, and hides the actual rule. Written below that gate
  -- this check was dead for exactly the caller it exists for, which the probe
  -- caught. The same ordering mistake as 0066's evaluator/persona exclusion.
  --
  -- It discloses nothing: the predicate is true only for someone who IS
  -- currently a persona, so anyone else falls through to the gate as before.
  if exists (select 1 from public.evaluation_sessions s
              where s.persona_auth_user_id = auth.uid() and s.ended_at is null) then
    raise exception 'return to the evaluation hub before viewing as someone else';
  end if;

  v_me := public.current_person_id();
  if not exists (select 1 from public.evaluation_evaluators e
                  where e.person_id = v_me and e.revoked_at is null) then
    raise exception 'evaluation mode is not available to this account';
  end if;

  -- One effective persona at a time. The unique index refuses this too; the
  -- named refusal is here so the evaluator is told why rather than shown a
  -- constraint violation.
  if exists (select 1 from public.evaluation_sessions s
              where s.evaluator_person_id = v_me and s.ended_at is null) then
    raise exception 'you are already viewing as someone; exit evaluation first';
  end if;

  -- THE ALLOW-LIST. A person who is not a row here cannot be assumed, and the
  -- refusal names the shape of the mistake without confirming whether the id
  -- belongs to a real person -- which would make this an existence oracle over
  -- `persons`.
  select * into v_persona from public.evaluation_personas where id = p_persona;
  if v_persona.id is null then
    raise exception 'that is not a demonstration persona';
  end if;

  select a.auth_user_id into v_uid from public.accounts a where a.person_id = v_persona.person_id;
  if v_uid is null then
    raise exception 'that persona has no account to sign in as';
  end if;

  v_expires := now() + interval '2 hours';
  insert into public.evaluation_sessions (evaluator_person_id, persona_id, persona_auth_user_id, expires_at)
  values (v_me, v_persona.id, v_uid, v_expires) returning id into v_session;

  -- Assumption is itself an audited event, written as the EVALUATOR: at this
  -- moment auth.uid() is still theirs, so the row records who entered rather
  -- than who was entered as.
  perform public.audit_write('evaluation.assume', 'evaluation_sessions', v_session::text,
                             v_persona.institution_id,
                             jsonb_build_object('persona', v_persona.label,
                                                'role_perspective', v_persona.role_perspective,
                                                'expires_at', v_expires));
  return query select v_session, v_uid, v_persona.label, v_expires;
end $function$;

-- ---------------------------------------------------------------------------
-- 3. Exit. Called while the caller IS the persona.
-- ---------------------------------------------------------------------------
create function public.exit_persona()
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_session uuid; v_label text; v_inst uuid;
begin
  select s.id, p.label, p.institution_id into v_session, v_label, v_inst
    from public.evaluation_sessions s join public.evaluation_personas p on p.id = s.persona_id
   where s.persona_auth_user_id = auth.uid() and s.ended_at is null
   limit 1;
  if v_session is null then
    raise exception 'there is no evaluation session to leave';
  end if;
  -- Audited BEFORE the session is closed, so the row that records the exit is
  -- itself stamped with both identities. Closing first would have made the exit
  -- the one action in evaluation mode that reads as genuine.
  perform public.audit_write('evaluation.exit', 'evaluation_sessions', v_session::text, v_inst,
                             jsonb_build_object('persona', v_label));
  update public.evaluation_sessions
     set ended_at = now(), ended_reason = 'exited'
   where id = v_session;
  return v_session;
end $function$;

-- ---------------------------------------------------------------------------
-- 4. The indicator's source of truth.
--
-- ADR-0020: "the indicator's presence is a property of the session, not of the
-- page." So the banner reads this, on the server, on every render -- it cannot
-- be dismissed, cannot be lost on refresh, and cannot be faked by client state
-- because client state is not consulted.
-- ---------------------------------------------------------------------------
create function public.evaluation_state()
returns table (evaluation_session_id uuid, label text, role_perspective public.app_role,
               institution_name text, expires_at timestamptz, expired boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
begin
  return query
    select s.id, p.label, p.role_perspective, i.name, s.expires_at, (s.expires_at <= now())
      from public.evaluation_sessions s
      join public.evaluation_personas p on p.id = s.persona_id
      join public.institutions i on i.id = p.institution_id
     where s.persona_auth_user_id = auth.uid() and s.ended_at is null
     limit 1;
end $function$;

-- ---------------------------------------------------------------------------
-- 5. Exposure. Every one of these is a deliberate decision, with a registry row
--    in the same statement -- a grant is an exposure decision (L1).
--
--    PLATFORM, not STAFF and not LEARNER: these are not part of anyone's
--    institutional work. `evaluation_state` is the exception in kind but not in
--    class -- a persona calls it, and a persona is whatever role it is -- but
--    what it exposes is the evaluation session, which is platform material.
-- ---------------------------------------------------------------------------
revoke all on function public.evaluation_hub() from public, anon, authenticated;
revoke all on function public.assume_persona(uuid) from public, anon, authenticated;
revoke all on function public.exit_persona() from public, anon, authenticated;
revoke all on function public.evaluation_state() from public, anon, authenticated;

grant execute on function public.evaluation_hub() to authenticated;
grant execute on function public.assume_persona(uuid) to authenticated;
grant execute on function public.exit_persona() to authenticated;
grant execute on function public.evaluation_state() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note) values
  ('evaluation_hub', 'PLATFORM',
   'lists the demonstration personas a live evaluator may assume; refuses everyone else by name rather than returning an empty list'),
  ('assume_persona', 'PLATFORM',
   'records the evaluator/persona pairing and returns the account to sign in as -- an identifier, never a credential'),
  ('exit_persona', 'PLATFORM',
   'ends the caller''s own evaluation session server-side; audited before it closes so the exit itself carries both identities'),
  ('evaluation_state', 'PLATFORM',
   'the evaluation-mode indicator''s source of truth: read from the session on every render, never from client state');

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_refused boolean; v_msg text;
  v_inst uuid; v_other uuid; v_period uuid;
  u_ev uuid := gen_random_uuid(); p_ev uuid;
  u_ev2 uuid := gen_random_uuid(); p_ev2 uuid;
  u_a uuid := gen_random_uuid(); p_a uuid;
  u_b uuid := gen_random_uuid(); p_b uuid;
  u_out uuid := gen_random_uuid(); p_out uuid;
  per_a uuid; per_b uuid; v_row record; v_session uuid; v_audit bigint;
begin
  -- === structural ==========================================================
  foreach v_msg in array array['evaluation_hub','assume_persona','exit_persona','evaluation_state'] loop
    if not exists (select 1 from public.client_rpc_registry r where r.function_name = v_msg) then
      raise exception '% is granted to a client role with no exposure decision recorded (L1)', v_msg;
    end if;
    if exists (select 1 from public.client_rpc_registry r
                where r.function_name = v_msg and r.exposure <> 'PLATFORM') then
      raise exception '% is classified as something other than PLATFORM', v_msg;
    end if;
  end loop;
  -- the anonymous surface did not move
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n <> 0 then
    raise exception '% function(s) became anon-executable; this task adds no anonymous surface', n;
  end if;
  -- and no authorization root learned about evaluation. Re-asserted here as
  -- well as in 0066 because this is the migration that could most plausibly
  -- have been tempted.
  foreach v_msg in array array['current_person_id()','is_system_admin()','is_member_of_institution(uuid)',
                               'has_scope(public.app_role, uuid)','can_in_institution(text, uuid)'] loop
    if pg_get_functiondef(('public.' || v_msg)::regprocedure) ~* 'evaluation' then
      raise exception '% learned about evaluation; ADR-0020 forbids exactly this', v_msg;
    end if;
  end loop;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    if exists (select 1 from public.institutions where official_evidence_purpose = 'HUMAN_EVALUATION') then
      raise exception 'HUMAN_EVALUATION is already occupied; this probe cannot run';
    end if;
    insert into public.institutions (name, slug, is_synthetic, is_active,
                                     is_official_bootstrap, official_evidence_purpose)
    values ('probe 0068 evaluation', 'probe-0068-evaluation', false, true, true, 'HUMAN_EVALUATION')
    returning id into v_inst;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0068 real school', 'probe-0068-real', true, true) returning id into v_other;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_other, '2026/2027', current_date - 30, current_date + 300) returning id into v_period;

    insert into auth.users (id, email) values (u_ev, 'probe0068-evaluator@local.invalid');
    select a.person_id into p_ev from public.accounts a where a.auth_user_id = u_ev;
    insert into auth.users (id, email) values (u_ev2, 'probe0068-outsider@local.invalid');
    select a.person_id into p_ev2 from public.accounts a where a.auth_user_id = u_ev2;
    insert into auth.users (id, email) values (u_a, 'probe0068-persona-a@local.invalid');
    select a.person_id into p_a from public.accounts a where a.auth_user_id = u_a;
    insert into auth.users (id, email) values (u_b, 'probe0068-persona-b@local.invalid');
    select a.person_id into p_b from public.accounts a where a.auth_user_id = u_b;
    insert into auth.users (id, email) values (u_out, 'probe0068-real-learner@local.invalid');
    select a.person_id into p_out from public.accounts a where a.auth_user_id = u_out;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status, valid_from)
    values (p_out, v_other, v_period, 'ACTIVE', now() - interval '1 day');

    insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
    values (p_a, v_inst, 'Murid', 'STUDENT', 1) returning id into per_a;
    insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
    values (p_b, v_inst, 'Guru', 'EDUCATOR', 2) returning id into per_b;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.evaluation_evaluators (person_id, note) values (p_ev, 'probe');
    perform set_config('app.seed_intent', '', true);

    -- (N1) a NON-EVALUATOR cannot enter evaluation mode, and is refused rather
    --      than shown an empty list
    perform set_config('request.jwt.claims', json_build_object('sub', u_ev2::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_ev2::text, true);
    v_refused := false; v_msg := '';
    begin
      perform * from public.evaluation_hub();
    exception when others then v_refused := true; v_msg := sqlerrm; end;
    if not v_refused then raise exception 'a non-evaluator reached the evaluation hub'; end if;
    if v_msg !~ 'not available to this account' then
      raise exception 'the non-evaluator refusal fired for the wrong reason: %', v_msg;
    end if;
    v_refused := false;
    begin
      perform * from public.assume_persona(per_a);
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a non-evaluator assumed a persona'; end if;

    -- (P1) the evaluator sees exactly the personas, in order
    perform set_config('request.jwt.claims', json_build_object('sub', u_ev::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_ev::text, true);
    select count(*) into n from public.evaluation_hub();
    if n <> 2 then raise exception 'the hub listed % persona(s), expected 2', n; end if;

    -- (N3) a person NOT on the allow-list cannot be assumed, including a real
    --      learner's id passed where a persona id belongs
    v_refused := false; v_msg := '';
    begin
      perform * from public.assume_persona(p_out);
    exception when others then v_refused := true; v_msg := sqlerrm; end;
    if not v_refused then
      raise exception 'a real person''s id was accepted as a persona';
    end if;
    if v_msg !~ 'not a demonstration persona' then
      raise exception 'the allow-list refusal fired for the wrong reason: %', v_msg;
    end if;

    -- (P2) assume, and the pairing is recorded with both identities on its own
    --      audit row
    select * into v_row from public.assume_persona(per_a);
    v_session := v_row.evaluation_session_id;
    if v_row.persona_auth_user_id is distinct from u_a then
      raise exception 'assume_persona returned the wrong account';
    end if;
    if not exists (select 1 from public.audit_log al
                    where al.action = 'evaluation.assume' and al.target_id = v_session::text
                      and al.actor_person_id = p_ev) then
      raise exception 'persona assumption was not audited as the evaluator''s own act';
    end if;

    -- (N6) two simultaneous personas are refused
    v_refused := false; v_msg := '';
    begin
      perform * from public.assume_persona(per_b);
    exception when others then v_refused := true; v_msg := sqlerrm; end;
    if not v_refused then raise exception 'an evaluator holds two live personas'; end if;
    if v_msg !~ 'already viewing as someone' then
      raise exception 'the simultaneous-persona refusal fired for the wrong reason: %', v_msg;
    end if;

    -- (N5) persona-to-persona switching, from INSIDE the persona's session, is
    --      refused with its own message -- the transition is what is refused,
    --      not the target
    perform set_config('request.jwt.claims', json_build_object('sub', u_a::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_a::text, true);
    v_refused := false; v_msg := '';
    begin
      perform * from public.assume_persona(per_b);
    exception when others then v_refused := true; v_msg := sqlerrm; end;
    if not v_refused then raise exception 'a persona switched directly to another persona'; end if;
    if v_msg !~ 'return to the evaluation hub' then
      raise exception 'the persona-to-persona refusal fired for the wrong reason: %', v_msg;
    end if;

    -- (P3) the indicator reads from the session, and the persona's own actions
    --      carry both identities
    select count(*) into n from public.evaluation_state();
    if n <> 1 then raise exception 'the indicator does not see the live session'; end if;
    if (select s.label from public.evaluation_state() s) <> 'Murid' then
      raise exception 'the indicator names the wrong persona';
    end if;
    -- written to a variable first. Calling a VOLATILE function inside a WHERE
    -- clause against a table evaluates it per scanned row -- so the first
    -- version of this wrote a fistful of audit rows and then compared the wrong
    -- one. The insert is the statement; the read is a separate statement.
    v_audit := public.audit_write('probe.as.persona', 'probe', null, v_inst, '{}'::jsonb);
    if (select al.evaluation_actor_person_id from public.audit_log al where al.id = v_audit)
         is distinct from p_ev then
      raise exception 'an action taken as the persona does not name the evaluator';
    end if;
    if (select al.actor_person_id from public.audit_log al where al.id = v_audit)
         is distinct from p_a then
      raise exception 'the acting identity is not the persona''s';
    end if;

    -- (P4) exit ends the session, and the exit itself is stamped
    v_session := public.exit_persona();
    if (select s.ended_at from public.evaluation_sessions s where s.id = v_session) is null then
      raise exception 'exit did not end the session server-side';
    end if;
    if (select al.evaluation_actor_person_id from public.audit_log al
         where al.action = 'evaluation.exit' and al.target_id = v_session::text) is distinct from p_ev then
      raise exception 'the exit event does not carry both identities';
    end if;
    select count(*) into n from public.evaluation_state();
    if n <> 0 then raise exception 'the indicator survives the session it reads from'; end if;

    -- (P5) and after exiting, the evaluator may assume again -- the refusal in
    --      (N6) was about simultaneity, not a one-shot
    perform set_config('request.jwt.claims', json_build_object('sub', u_ev::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_ev::text, true);
    select * into v_row from public.assume_persona(per_b);
    if v_row.persona_auth_user_id is distinct from u_b then
      raise exception 'the second assumption returned the wrong account';
    end if;

    -- and the trail-wide property still holds over everything written here
    if not (select a.ok from public.assert_evaluation_audit_complete() a) then
      raise exception 'the dual-identity property is false over this probe: %',
        (select a.detail from public.assert_evaluation_audit_complete() a);
    end if;

    raise exception 'PROBE_0068_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0068_ROLLBACK' then raise; end if;
  end;
end $$;

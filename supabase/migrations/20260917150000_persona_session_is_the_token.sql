-- 0070 -- negative 7, closed on the inequality that actually matters.
--
-- WHAT 0069 GOT BACKWARDS. It stored `least(token exp, two hours)` and defended
-- that as "a caller can shorten the session, never lengthen it". That protects
-- the SAFE direction and permits the DANGEROUS one:
--
--   session expiry AFTER token expiry  -> token dead, session "live".
--                                         Everything refused. Fails closed.
--   session expiry BEFORE token expiry -> session "expired", token ALIVE.
--                                         A direct RPC still succeeds.
--
-- `least()` produces the second relationship whenever the project's JWT TTL
-- exceeds two hours. Shortening is the operation that had to be refused.
--
-- AND THE CAP RESTED ON A NUMBER NOBODY CAN SEE. The project's JWT TTL is a
-- dashboard setting: it is not returned by the management API this build can
-- reach, and it is not visible to CI. So the two-hour cap was correct only if
-- the TTL happened to be shorter, and no test either side could write would
-- notice if someone raised it -- which is exactly what gets raised during a
-- 150-tester pilot so people stop re-authenticating all morning, in the one
-- context this facility runs. A control whose correctness depends on a value no
-- test can see is not a control.
--
-- THE INVARIANT, AS IT MUST HOLD:
--
--     No persona access token may remain usable after
--     evaluation_sessions.expires_at. The two are the SAME INSTANT, derived
--     server-side from the token actually minted.
--
-- So there is no cap, no arithmetic and no policy maximum here. `expires_at` is
-- assigned from the token's `exp` and nothing else, and the verification block
-- asserts that syntactically -- no `least(`, no `+ interval`, a direct
-- assignment -- because an assertion that merely read "the expiry is derived"
-- would be satisfied by any expression at all.
--
-- WANTING SHORTER EVALUATION SESSIONS IS A REAL WISH AND THIS IS NOT WHERE IT
-- IS GRANTED. A shorter session can only be honest if the TOKEN is shorter;
-- shortening the record while the token lives is precisely the hole. If two
-- hours is wanted, the project's JWT TTL is the setting that delivers it.
--
-- ===========================================================================
-- THE FOURTH LEG, WHICH DEFEATS THE OTHER THREE: THE CREDENTIAL.
--
-- 0068 and 0069 described `assume_persona` as returning "the account to sign in
-- as", and the seed gave every persona a derived password. If the evaluator can
-- ever authenticate as a persona INDEPENDENTLY -- a password, a magic link they
-- can request again -- then token lifetime bounds nothing. They re-authenticate
-- and hold a fresh token indefinitely, WITH NO EVALUATION SESSION IN EXISTENCE:
-- no expiry to cross, no `ended_at`, and -- worse than the original hole -- NO
-- DUAL-IDENTITY STAMP, because `audit_write` finds no live session to key on.
-- The action records as genuine. The other three legs bound a session; this one
-- bypasses the concept of one.
--
-- So: persona accounts carry no credential anybody can use. The seed sets no
-- password, and this migration asserts that no persona account has one --
-- measured against `auth.users`, not promised in a comment. Sign-in is
-- server-mediated only, minted inside the assume flow with the service role.
--
-- AND THE BROWSER DOES NOT GET TO SAY WHEN ITS OWN TOKEN EXPIRES. Same
-- trust-class rule as the evaluation actor in 0067. `assume_persona` is
-- therefore revoked from `authenticated` and granted to `service_role` alone:
-- it is reachable only from the server that minted the token and read its `exp`.
-- It leaves the client RPC registry for the same reason -- it is no longer a
-- client entry point. `evaluation_hub` still refuses a non-evaluator from the
-- browser, and `assume_persona` still refuses an evaluator id that is not a
-- live evaluator, so a compromised server cannot assume as somebody who may not.

drop function public.assume_persona(uuid, timestamptz);
delete from public.client_rpc_registry where function_name = 'assume_persona';

create function public.assume_persona(p_evaluator uuid, p_persona uuid,
                                      p_token_expires_at timestamptz)
returns table (evaluation_session_id uuid, persona_auth_user_id uuid,
               label text, expires_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_persona public.evaluation_personas; v_uid uuid; v_session uuid; v_expires timestamptz;
begin
  if not exists (select 1 from public.evaluation_evaluators e
                  where e.person_id = p_evaluator and e.revoked_at is null) then
    raise exception 'evaluation mode is not available to that account';
  end if;

  -- ONE LIVE SESSION PER EVALUATOR, and this single check now closes BOTH
  -- lifecycle rules -- simultaneous personas AND persona-to-persona switching.
  --
  -- 0068 had a second check for the transition, keyed on whether `auth.uid()`
  -- was itself a live persona. Moving this function behind the service role
  -- killed it: the caller is now always the server, whose `auth.uid()` is never
  -- a persona's, so that branch could not fire and the refusal it named was
  -- dead code. Removed rather than left as reassurance.
  --
  -- Nothing is lost. A persona cannot reach this function at all, and its
  -- evaluator still holds a live session until they exit -- so changing persona
  -- REQUIRES returning to the Hub and exiting first, which is the rule. One
  -- control, named once, that actually fires.
  if exists (select 1 from public.evaluation_sessions s
              where s.evaluator_person_id = p_evaluator and s.ended_at is null) then
    raise exception 'that evaluator is already viewing as someone; exit evaluation first';
  end if;

  select * into v_persona from public.evaluation_personas where id = p_persona;
  if v_persona.id is null then
    raise exception 'that is not a demonstration persona';
  end if;
  select a.auth_user_id into v_uid from public.accounts a where a.person_id = v_persona.person_id;
  if v_uid is null then
    raise exception 'that persona has no account to sign in as';
  end if;
  if exists (select 1 from public.evaluation_sessions s
              where s.persona_auth_user_id = v_uid and s.ended_at is null) then
    raise exception 'that persona is already in use';
  end if;

  -- THE SAME INSTANT. Assigned, not computed: no cap, no arithmetic, no policy
  -- maximum. Any expression here would be a second opinion about when the token
  -- dies, and the token does not take second opinions.
  if p_token_expires_at is null then
    raise exception 'a persona session must state when its token expires';
  end if;
  v_expires := p_token_expires_at;
  if v_expires <= now() then
    raise exception 'that persona token has already expired';
  end if;

  insert into public.evaluation_sessions (evaluator_person_id, persona_id, persona_auth_user_id, expires_at)
  values (p_evaluator, v_persona.id, v_uid, v_expires) returning id into v_session;

  perform public.audit_write('evaluation.assume', 'evaluation_sessions', v_session::text,
                             v_persona.institution_id,
                             jsonb_build_object('persona', v_persona.label,
                                                'role_perspective', v_persona.role_perspective,
                                                'evaluator_person_id', p_evaluator,
                                                'token_expires_at', v_expires));
  return query select v_session, v_uid, v_persona.label, v_expires;
end $function$;

-- Not a client entry point. The browser cannot reach it, so the browser cannot
-- claim an expiry for a token it did not mint.
revoke all on function public.assume_persona(uuid, uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.assume_persona(uuid, uuid, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- The boundary assertion: the coupling, and the absence of credentials.
-- ---------------------------------------------------------------------------
create or replace function public.assert_evaluation_boundary()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; bad text; v_env text; v_src text;
        n_personas int; n_evaluators int; n_live int; n_cred int;
begin
  select environment into v_env from public.platform_environment;
  select count(*) into n_personas from public.evaluation_personas;
  select count(*) into n_evaluators from public.evaluation_evaluators where revoked_at is null;
  select count(*) into n_live from public.evaluation_sessions where ended_at is null;

  if v_env = 'production' and (n_personas > 0 or n_evaluators > 0 or n_live > 0) then
    problems := problems || 'the evaluation facility has rows in production'::text;
  end if;

  -- NO PERSONA HOLDS A USABLE CREDENTIAL. The fourth leg, measured against
  -- auth.users rather than asserted: a persona anyone can authenticate as
  -- independently makes every expiry in this design irrelevant, and produces
  -- actions that carry no evaluation actor at all.
  begin
    select count(*) into n_cred from public.evaluation_personas pe
      join public.accounts a on a.person_id = pe.person_id
      join auth.users u on u.id = a.auth_user_id
     where coalesce(u.encrypted_password, '') <> '';
  exception when undefined_table or undefined_column then n_cred := 0; end;
  if n_cred > 0 then
    problems := problems || format(
      '%s persona account(s) carry a password: an evaluator could authenticate as them independently, '
      || 'outside any evaluation session and with no dual-identity stamp', n_cred);
  end if;

  -- THE COUPLING. Asserted syntactically, because "the expiry is derived" is
  -- satisfied by any expression at all -- including the least() that was the
  -- defect.
  v_src := pg_get_functiondef('public.assume_persona(uuid, uuid, timestamptz)'::regprocedure);
  if v_src !~ 'v_expires\s*:=\s*p_token_expires_at\s*;' then
    problems := problems || 'assume_persona no longer sets the session expiry to the token''s exactly'::text;
  end if;
  if v_src ~ 'least\s*\(' or v_src ~ 'p_token_expires_at\s*[-+]' then
    problems := problems ||
      'assume_persona caps or offsets the token expiry: a session shorter than its token leaves the token usable'::text;
  end if;
  -- and it is not reachable from a browser, which is what stops a caller
  -- claiming an expiry for a token it did not mint
  if has_function_privilege('authenticated', 'public.assume_persona(uuid, uuid, timestamptz)'::regprocedure, 'EXECUTE')
     or has_function_privilege('anon', 'public.assume_persona(uuid, uuid, timestamptz)'::regprocedure, 'EXECUTE') then
    problems := problems || 'assume_persona is reachable by a client role: the browser can claim its own expiry'::text;
  end if;

  select string_agg(distinct pe.label || ' (' || ra.role::text || ')', ', ') into bad
    from public.evaluation_personas pe
    join public.role_assignments ra on ra.person_id = pe.person_id and ra.revoked_at is null
   where ra.role = 'SYSTEM_ADMIN' or ra.scope_node_id is null;
  if bad is not null then
    problems := problems || ('persona(s) holding platform-wide authority: ' || bad);
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
      'environment=%s; %s persona(s) none of which carries a password, %s live evaluator(s), %s live '
      || 'session(s); every session expires at its own token''s instant, and assume_persona is reachable '
      || 'only by the server that minted it',
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
  n int; v_refused boolean; v_msg text; v_src text; v_exp timestamptz;
  v_inst uuid; v_period uuid;
  u_ev uuid := gen_random_uuid(); p_ev uuid;
  u_p uuid := gen_random_uuid(); p_p uuid;
  per uuid; v_row record;
begin
  -- === structural ==========================================================
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname='public' and p.proname='assume_persona';
  if n <> 1 then raise exception 'assume_persona is overloaded % ways', n; end if;
  v_src := pg_get_functiondef('public.assume_persona(uuid, uuid, timestamptz)'::regprocedure);
  -- the coupling, matched as SYNTAX rather than as the word "derived"
  if v_src !~ 'v_expires\s*:=\s*p_token_expires_at\s*;' then
    raise exception 'the session expiry is not assigned from the token exactly';
  end if;
  if v_src ~ 'least\s*\(' then
    raise exception 'assume_persona caps the token expiry; the failing inequality is back';
  end if;
  if v_src ~ 'interval\s*''\d+ hour' then
    raise exception 'assume_persona applies a policy window to the token expiry';
  end if;
  -- unreachable from a browser
  if has_function_privilege('authenticated', 'public.assume_persona(uuid, uuid, timestamptz)'::regprocedure, 'EXECUTE') then
    raise exception 'assume_persona is executable by authenticated: the browser can claim its own expiry';
  end if;
  if not has_function_privilege('service_role', 'public.assume_persona(uuid, uuid, timestamptz)'::regprocedure, 'EXECUTE') then
    raise exception 'assume_persona is not executable by the server that mints the token';
  end if;
  if exists (select 1 from public.client_rpc_registry r where r.function_name = 'assume_persona') then
    raise exception 'assume_persona is still declared as a client entry point';
  end if;
  -- and the authorization roots still know nothing about evaluation
  foreach v_msg in array array['current_person_id()','is_system_admin()','is_member_of_institution(uuid)',
                               'has_scope(public.app_role, uuid)','can_in_institution(text, uuid)',
                               'role_assignments_guard()'] loop
    if pg_get_functiondef(('public.' || v_msg)::regprocedure) ~* 'evaluation' then
      raise exception '% learned about evaluation', v_msg;
    end if;
  end loop;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    select i.id into v_inst from public.institutions i
     where i.official_evidence_purpose = 'HUMAN_EVALUATION';
    if v_inst is null then
      insert into public.institutions (name, slug, is_synthetic, is_active,
                                       is_official_bootstrap, official_evidence_purpose)
      values ('probe 0070 evaluation', 'probe-0070-evaluation', false, true, true, 'HUMAN_EVALUATION')
      returning id into v_inst;
    end if;
    insert into auth.users (id, email) values (u_ev, 'probe0070-evaluator@local.invalid');
    select a.person_id into p_ev from public.accounts a where a.auth_user_id = u_ev;
    insert into auth.users (id, email) values (u_p, 'probe0070-persona@local.invalid');
    select a.person_id into p_p from public.accounts a where a.auth_user_id = u_p;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.evaluation_evaluators (person_id, note) values (p_ev, 'probe');
    perform set_config('app.seed_intent', '', true);
    insert into public.evaluation_personas (person_id, institution_id, label, role_perspective, ordinal)
    values (p_p, v_inst, 'probe murid', 'STUDENT', 90) returning id into per;

    -- (1) THE EXPIRY IS THE TOKEN'S, TO THE INSTANT. Not capped, not rounded.
    v_exp := now() + interval '11 hours';
    select * into v_row from public.assume_persona(p_ev, per, v_exp);
    if v_row.expires_at is distinct from v_exp then
      raise exception 'the session expiry (%) is not the token''s (%)', v_row.expires_at, v_exp;
    end if;
    if (select s.expires_at from public.evaluation_sessions s where s.id = v_row.evaluation_session_id)
         is distinct from v_exp then
      raise exception 'the stored session expiry is not the token''s';
    end if;

    -- (2) an already-dead token cannot open a session
    perform set_config('request.jwt.claims', json_build_object('sub', u_p::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_p::text, true);
    perform public.exit_persona();
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    v_refused := false;
    begin
      perform * from public.assume_persona(p_ev, per, now() - interval '1 second');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a session was opened on an already-expired token'; end if;

    -- (3) a person who is not a live evaluator cannot be assumed FOR, even by
    --     the server -- a compromised server cannot invent an evaluator
    v_refused := false;
    begin
      perform * from public.assume_persona(p_p, per, now() + interval '1 hour');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a non-evaluator was named as the evaluator of a session'; end if;

    -- (4) NO PERSONA CARRIES A CREDENTIAL. The probe's own persona has none;
    --     give it one and the boundary assertion must say so by name.
    if not (select a.ok from public.assert_evaluation_boundary() a) then
      raise exception 'the boundary is false before the credential is planted: %',
        (select a.detail from public.assert_evaluation_boundary() a);
    end if;
    update auth.users set encrypted_password = 'planted' where id = u_p;
    if (select a.ok from public.assert_evaluation_boundary() a) then
      raise exception 'a persona was given a password and the boundary assertion did not notice';
    end if;
    if (select a.detail from public.assert_evaluation_boundary() a) !~ 'carry a password' then
      raise exception 'the credential problem was not named: %',
        (select a.detail from public.assert_evaluation_boundary() a);
    end if;

    raise exception 'PROBE_0070_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0070_ROLLBACK' then raise; end if;
  end;
end $$;

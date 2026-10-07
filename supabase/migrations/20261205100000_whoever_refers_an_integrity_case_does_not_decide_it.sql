-- CR-76 (W-2; D-122(4), D-123(4)): WHOEVER REFERS AN INTEGRITY CASE DOES NOT DECIDE IT.
--
-- «The person who refers an integrity case cannot make its final decision.» (D-123(4)) «The referring HOD can provide
-- evidence/context, but another authorised person should make the disposition … If only one eligible decision-maker
-- exists, PINTAR should show the case as waiting for an independent decision, not quietly permit self-approval.»
-- (D-122(4))
--
-- Until now advance_management_decision (20260924110000) asked only whether the caller held a Management role over the
-- decision's node. A head of department over a class may both review its integrity observation in Studio (CAN_REVIEW_
-- INTEGRITY) and decide in /pimpinan, so the person who referred a case could take it up and decide it alone (the
-- batch 3 walks' finding W-2, read from the code).
--
-- The existing role and escalation model only; no new role:
--   1. advance_management_decision refuses the person who raised an INTEGRITY_REFERRAL both of its moves: taking it up
--      (UNDER_REVIEW, «Saya yang menangani», which begins the disposition) and deciding it (DECIDED). The refusal comes
--      after the scope check, so a reader outside the decision's node is refused exactly as before. Every other
--      HEAD_OF_DEPARTMENT or DEAN standing over the node moves it as before; the state machine is unchanged.
--   2. The table says it too: an INTEGRITY_REFERRAL decided by the person who raised it cannot be written by any path.
--   3. management_decision_independent_decider(decision): whether anyone other than the referrer holds an active
--      Management role over the decision's node now (management_scope_over_node's own rule, for another person). The
--      referrer's card uses it to say truthfully whether the case can be decided at all, and who can change that (the
--      school admin, who grants the roles). Answered only to a reader who may see the decision; null to anyone else.
-- Other decision families are untouched.
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

-- ═══════════════════════════════════════════════════════════════ (1) the decision
create or replace function public.advance_management_decision(
  p_decision uuid, p_to public.management_decision_state,
  p_outcome public.management_decision_outcome, p_note text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; d record;
begin
  v_actor := public.current_person_id();
  if v_actor is null or p_decision is null or p_to is null then
    raise exception 'deciding is for a HEAD_OF_DEPARTMENT or DEAN standing over this decision';
  end if;
  select m.id, m.institution_id, m.scope_node_id, m.state, m.family, m.raised_by_person_id
    into d from public.management_decisions m where m.id = p_decision;
  if d.id is null or not public.management_scope_over_node(d.scope_node_id) then
    raise exception 'deciding is for a HEAD_OF_DEPARTMENT or DEAN standing over this decision';
  end if;
  -- CR-76 (D-123(4)): whoever referred an integrity case neither takes it up nor decides it; another person does
  if d.family = 'INTEGRITY_REFERRAL' and d.raised_by_person_id = v_actor then
    raise exception using errcode = 'PR040', detail = 'REFERRER_CANNOT_DECIDE',
      message = 'the person who referred an integrity case does not decide it; another authorised person does (D-123)';
  end if;
  -- THE WHOLE STATE MACHINE. Anything not named here is refused, including
  -- every move out of DECIDED: a recorded human decision is not edited later,
  -- and new information becomes a new referral rather than a rewritten one.
  if not ((d.state = 'AWAITING_REVIEW' and p_to in ('UNDER_REVIEW', 'DECIDED'))
       or (d.state = 'UNDER_REVIEW'    and p_to = 'DECIDED')) then
    raise exception 'a management decision does not move from % to %', d.state, p_to;
  end if;
  if (p_to = 'DECIDED') <> (p_outcome is not null) then
    raise exception 'DECIDED carries an outcome and no other state carries one';
  end if;
  if p_to = 'DECIDED' then
    update public.management_decisions
       set state = 'DECIDED', outcome = p_outcome, decided_by_person_id = v_actor,
           decided_at = now(), decision_note = p_note
     where management_decisions.id = p_decision;
  else
    update public.management_decisions set state = p_to where management_decisions.id = p_decision;
  end if;
  perform public.audit_write('management_decision.advanced', 'management_decisions', p_decision::text,
    d.institution_id,
    jsonb_build_object('family', d.family, 'from_state', d.state, 'to_state', p_to,
                       'outcome', p_outcome, 'scope_node_id', d.scope_node_id));
  return p_decision;
end $$;
revoke all on function public.advance_management_decision(uuid, public.management_decision_state, public.management_decision_outcome, text)
  from public, anon, authenticated;
grant execute on function public.advance_management_decision(uuid, public.management_decision_state, public.management_decision_outcome, text)
  to authenticated;

-- ═══════════════════════════════════════════════════════════════ (2) the table
alter table public.management_decisions add constraint management_decisions_referrer_does_not_decide
  check (family <> 'INTEGRITY_REFERRAL' or decided_by_person_id is null or decided_by_person_id <> raised_by_person_id)
  not valid;
do $$
declare n int;
begin
  select count(*) into n from public.management_decisions
   where family = 'INTEGRITY_REFERRAL' and decided_by_person_id = raised_by_person_id;
  if n = 0 then
    alter table public.management_decisions validate constraint management_decisions_referrer_does_not_decide;
  else
    -- a decision already recorded is not rewritten (20260924110000); it stays as history, and no new one can be written
    raise notice 'CR-76: % integrity referral(s) decided by their referrer before this rule stay as recorded', n;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════ (3) is there anyone else?
create function public.management_decision_independent_decider(p_decision uuid)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); d record; v_jalur uuid[];
begin
  select m.id, m.scope_node_id, m.raised_by_person_id into d
    from public.management_decisions m where m.id = p_decision;
  -- only a reader who may see the decision is answered (management_decisions_select's own rule)
  if d.id is null or v_me is null
     or not (d.raised_by_person_id = v_me or public.management_scope_over_node(d.scope_node_id)) then
    return null;
  end if;
  select o.jalur into v_jalur from public.org_nodes o where o.id = d.scope_node_id;
  if v_jalur is null then return false; end if;
  return exists (
    select 1 from public.role_assignments ra
     where ra.person_id <> d.raised_by_person_id and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and ra.role = any (public.management_learner_roles())
       and ra.scope_node_id is not null and v_jalur @> array[ra.scope_node_id]);
end $$;
comment on function public.management_decision_independent_decider(uuid) is
  'CR-76 (D-123(4)): whether anyone other than the person who raised this decision holds an active Management role '
  '(HEAD_OF_DEPARTMENT or DEAN) over its node now: who could decide an integrity case its referrer may not. Null to a '
  'reader who may not see the decision.';
revoke all on function public.management_decision_independent_decider(uuid) from public, anon, authenticated, service_role;
grant execute on function public.management_decision_independent_decider(uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note)
values ('management_decision_independent_decider', 'STAFF',
        'CR-76: answers the referrer of an integrity case (or a Management reader over it) whether another person may '
        'decide it, so /pimpinan can say truthfully that it waits for an independent decision. Writes nothing.')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
begin
  if position('REFERRER_CANNOT_DECIDE' in pg_get_functiondef('public.advance_management_decision(uuid,public.management_decision_state,public.management_decision_outcome,text)'::regprocedure)) = 0 then
    raise exception 'advance_management_decision does not refuse the referrer';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'management_decisions_referrer_does_not_decide') then
    raise exception 'the table does not refuse a referrer''s own decision';
  end if;
  if has_function_privilege('anon', 'public.management_decision_independent_decider(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.management_decision_independent_decider(uuid)', 'execute') then
    raise exception 'management_decision_independent_decider is reached by the wrong roles';
  end if;
end $$;

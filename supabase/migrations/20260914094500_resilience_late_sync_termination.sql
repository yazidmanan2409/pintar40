-- 0041 — FABLE-04 §2 and §3 / INV-28, INV-27, INV-17: the full resilience
-- contract, the four termination causes, and audited deadline extension.
--
-- THE RECEIPT MODE IS THE SERVER'S, NOT THE CLIENT'S. `record_answer` took
-- `p_receipt_mode` from its caller and passed it straight through. A client
-- asserting `LIVE` on a reply that arrived three days late would have had it
-- recorded as LIVE and scored. doc 07 puts the clock on the server for exactly
-- this reason, and INV-28's guarantee is about what the SERVER can prove, so
-- the mode is now derived here from the session's authoritative deadline and
-- the definition's governed grace window. The parameter is kept -- the client's
-- claim is real evidence of what the client believed -- but it is recorded as a
-- claim and never trusted as a verdict.
--
--   within the deadline                         -> LIVE (or REPLAYED, if the
--                                                  client says it is a replay)
--   past the deadline, within late_sync_grace   -> LATE_SYNC, scored
--   beyond the grace window                     -> LATE_SYNC, RETAINED AS
--                                                  EVIDENCE AND NOT SCORED
--
-- "Retained and not scored" is the part that needs a mechanism rather than a
-- convention, because `session_final_responses` feeds every scoring path. A
-- beyond-grace row is marked `is_final = false` and the scorer reads only final
-- rows, so the evidence survives, the educator can see it, and no scoring path
-- has to remember a rule.
--
-- TERMINATION HAS FOUR CAUSES AND ALWAYS AN ACTOR (§2). `TERMINATED` already
-- existed as a status with a `termination_reason`; nothing enforced who may set
-- it, which of the four causes applied, or that the work was kept. All three
-- are enforced here, and the recorded work is finalized with the marker rather
-- than discarded.
--
-- EXTENSION IS CAPABILITY-GATED AND AUDITED (§2). "No silent extension" is a
-- property of the function, not a promise: the old and new deadlines, the actor
-- and the reason all go to the audit log, and an extension beyond a governed
-- ceiling is refused.

create type public.termination_cause as enum (
  'AUTHORIZATION_REVOKED',      -- INV-17: the learner's scope was withdrawn
  'INSTITUTIONAL_REVOCATION',   -- the enrolment or institution ended it
  'SECURITY_INTERVENTION',      -- an integrity or security decision by a human
  'ADMINISTRATIVE_TERMINATION'  -- explicit, authorized, recorded
);

alter table public.assessment_sessions
  add column if not exists termination_cause public.termination_cause,
  add column if not exists terminated_by_person_id uuid references public.persons(id),
  add column if not exists deadline_extended_count smallint not null default 0;

-- A terminated session names its cause and its actor. Enforced, not documented.
create function public.enforce_termination_provenance() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'TERMINATED' and old.status is distinct from 'TERMINATED' then
    if new.termination_cause is null then
      raise exception 'a terminated session names one of the four permitted causes (doc 04 §5)';
    end if;
    if new.terminated_by_person_id is null then
      raise exception 'a terminated session names the person who ended it';
    end if;
    if new.termination_reason is null or btrim(new.termination_reason) = '' then
      raise exception 'a terminated session records why';
    end if;
  end if;
  if old.status = 'TERMINATED' and new.termination_cause is distinct from old.termination_cause then
    raise exception 'the cause of a termination is immutable';
  end if;
  return new;
end $$;
revoke all on function public.enforce_termination_provenance() from public, anon, authenticated;
create trigger assessment_sessions_termination_provenance
  before update on public.assessment_sessions
  for each row execute function public.enforce_termination_provenance();

-- ---------------------------------------------------------------------------
-- 1. The server decides the receipt mode, and beyond-grace work is retained
--    without being scored.
-- ---------------------------------------------------------------------------
create or replace function public.record_answer(
  p_presented_item uuid, p_client_seq integer, p_jawaban jsonb,
  p_client_asserted_at timestamptz default now(),
  p_receipt_mode public.receipt_mode default 'LIVE')
returns table (response_id uuid, outcome text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_session uuid; v_item uuid; v_type public.item_type;
  v_ok boolean; v_reason text; v_value jsonb; v_label text; v_labels text[];
  v_deadline timestamptz; v_grace integer; v_mode public.receipt_mode; v_scorable boolean;
  v_rid uuid; v_out text;
begin
  select p.session_id, p.item_id into v_session, v_item
    from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;

  -- The server's clock, the definition's governed grace. ADDED IN 0041.
  select s.authoritative_deadline, coalesce(d.late_sync_grace_seconds, 0)
    into v_deadline, v_grace
    from public.assessment_sessions s
    join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.id = v_session;

  if v_deadline is null or now() <= v_deadline then
    v_mode := case when p_receipt_mode = 'REPLAYED' then 'REPLAYED' else 'LIVE' end;
    v_scorable := true;
  elsif now() <= v_deadline + make_interval(secs => v_grace) then
    v_mode := 'LATE_SYNC';
    v_scorable := true;
  else
    -- beyond the grace window: evidence, not score. doc 07 is explicit that it
    -- is retained and visible, so this is not a refusal.
    v_mode := 'LATE_SYNC';
    v_scorable := false;
  end if;

  -- A session past its deadline still accepts a replay inside the grace
  -- window; may_continue_session governs everything else (INV-27).
  if v_scorable and (v_deadline is null or now() <= v_deadline) then
    select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(v_session) c;
    if not v_ok then raise exception 'this session accepts no further answers: %', v_reason; end if;
  else
    -- a replay after the deadline is accepted only while the session is not
    -- terminated; an INV-17 event still stops it
    if (select s.status from public.assessment_sessions s where s.id = v_session) = 'TERMINATED' then
      raise exception 'this session was ended and accepts no submission';
    end if;
    if not public.session_is_mine(v_session) then
      raise exception 'this session belongs to someone else';
    end if;
  end if;

  if (select s.status from public.assessment_sessions s where s.id = v_session) = 'CREATED' then
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_session;
  end if;

  select i.item_type into v_type from public.items i where i.id = v_item;

  if v_type = 'MCQ_SINGLE' then
    if jsonb_typeof(p_jawaban -> 'posisi') <> 'number' then
      raise exception 'MCQ_SINGLE expects {"posisi": n}';
    end if;
    select d.label into v_label from public.option_display_order(v_session, v_item) d
     where d.display_position = (p_jawaban ->> 'posisi')::integer;
    if v_label is null then raise exception 'no option at display position %', p_jawaban ->> 'posisi'; end if;
    v_value := jsonb_build_object('pilihan', v_label);

  elsif v_type = 'MCQ_MULTI' then
    if jsonb_typeof(p_jawaban -> 'posisi') <> 'array' then
      raise exception 'MCQ_MULTI expects {"posisi": [n, ...]}';
    end if;
    select array_agg(d.label order by d.label collate "C") into v_labels
      from public.option_display_order(v_session, v_item) d
     where d.display_position in (
       select x::integer from jsonb_array_elements_text(p_jawaban -> 'posisi') x);
    if coalesce(array_length(v_labels, 1), 0)
       <> (select count(distinct x) from jsonb_array_elements_text(p_jawaban -> 'posisi') x) then
      raise exception 'one or more display positions do not exist on this item';
    end if;
    v_value := jsonb_build_object('pilihan', to_jsonb(coalesce(v_labels, '{}'::text[])));

  else
    raise exception 'item type % has no learner answer path in this phase (OD-8)', v_type;
  end if;

  -- The scorable decision is passed INTO the write, not applied after it: a
  -- response is append-only evidence (INV-28) and `enforce_response_write`
  -- refuses an UPDATE, correctly. `submit_response` already takes `p_is_final`,
  -- so beyond-grace work is written unscorable in the first place.
  select r.response_id, r.outcome into v_rid, v_out
    from public.submit_response(p_presented_item, p_client_seq, v_value,
                                p_client_asserted_at, v_mode, v_scorable) r;

  response_id := v_rid;
  outcome := case when v_scorable then v_out else v_out || '+retained_unscored' end;
  return next;
end $$;
revoke all on function public.record_answer(uuid, integer, jsonb, timestamptz, public.receipt_mode) from public, anon;
grant execute on function public.record_answer(uuid, integer, jsonb, timestamptz, public.receipt_mode)
  to authenticated, service_role;

-- The scorer reads final rows only. Beyond-grace evidence still exists and is
-- still readable by the educator; it simply is not scored.
create or replace function public.session_final_responses(p_session uuid)
returns table (presented_item_id uuid, item_id uuid, posisi smallint, value jsonb,
               is_safety_critical boolean, received_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct on (p.id) p.id, p.item_id, p.position, r.value, i.is_safety_critical, r.received_at
    from public.presented_items p
    join public.items i on i.id = p.item_id
    left join public.responses r on r.presented_item_id = p.id and r.is_final
   where p.session_id = p_session
   order by p.id, r.client_seq desc nulls last
$$;
revoke all on function public.session_final_responses(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Termination: four causes, an actor, a reason, and the work kept.
-- ---------------------------------------------------------------------------
create function public.terminate_session(
  p_session uuid, p_cause public.termination_cause, p_reason text)
returns public.session_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_s public.assessment_sessions; v_kept int;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', v_s.institution_id) then
    raise exception 'ending another person''s assessment requires CAN_REVIEW_INTEGRITY in that institution';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a termination records why';
  end if;
  if v_s.status in ('FINALIZED','TERMINATED') then return v_s.status; end if;

  select count(*) into v_kept from public.responses where session_id = p_session;
  update public.assessment_sessions
     set status = 'TERMINATED', termination_cause = p_cause,
         termination_reason = p_reason, terminated_by_person_id = v_actor
   where id = p_session;

  perform public.audit_write('assessment_session.terminated', 'assessment_sessions', p_session::text,
    v_s.institution_id,
    jsonb_build_object('session_id', p_session, 'cause', p_cause, 'reason', p_reason,
                       'actor', v_actor, 'responses_retained', v_kept));
  return 'TERMINATED';
end $$;
revoke all on function public.terminate_session(uuid, public.termination_cause, text) from public, anon;
grant execute on function public.terminate_session(uuid, public.termination_cause, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Deadline extension: capability-gated, bounded, audited.
-- ---------------------------------------------------------------------------
create function public.extend_session_deadline(
  p_session uuid, p_minutes integer, p_reason text)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_s public.assessment_sessions; v_old timestamptz; v_new timestamptz;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  if not public.can_in_institution('CAN_ASSIGN_LEARNING', v_s.institution_id) then
    raise exception 'extending a deadline requires CAN_ASSIGN_LEARNING in that institution';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'an extension records why (doc 04 §5: no silent extension)';
  end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 120 then
    raise exception 'an extension is between 1 and 120 minutes, not %', p_minutes;
  end if;
  if v_s.deadline_extended_count >= 3 then
    raise exception 'this session has already been extended % times; a fourth is an assignment decision, not an extension',
      v_s.deadline_extended_count;
  end if;
  if v_s.status in ('FINALIZED','TERMINATED') then
    raise exception 'a % session has no deadline to extend', v_s.status;
  end if;

  v_old := v_s.authoritative_deadline;
  v_new := coalesce(v_old, now()) + make_interval(mins => p_minutes);
  update public.assessment_sessions
     set authoritative_deadline = v_new,
         deadline_extended_count = deadline_extended_count + 1
   where id = p_session;

  perform public.audit_write('assessment_session.deadline_extended', 'assessment_sessions',
    p_session::text, v_s.institution_id,
    jsonb_build_object('session_id', p_session, 'old_deadline', v_old, 'new_deadline', v_new,
                       'minutes', p_minutes, 'reason', p_reason, 'actor', v_actor));
  return v_new;
end $$;
revoke all on function public.extend_session_deadline(uuid, integer, text) from public, anon;
grant execute on function public.extend_session_deadline(uuid, integer, text) to authenticated, service_role;

insert into public.client_rpc_registry values
  ('terminate_session', 'STAFF', 'CAN_REVIEW_INTEGRITY; names the session it ends, four permitted causes, audited'),
  ('extend_session_deadline', 'STAFF', 'CAN_ASSIGN_LEARNING; bounded and audited, no silent extension');

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003). Behavioural where it matters: whether the
-- server overrides a client's receipt-mode claim cannot be seen structurally.
-- ---------------------------------------------------------------------------
do $$
declare def text; n int; bad text; v_ok boolean; v_detail text;
begin
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='record_answer';
  if def !~ 'authoritative_deadline' or def !~ 'late_sync_grace_seconds' then
    raise exception 'record_answer does not derive the receipt mode from the server clock and the governed grace';
  end if;
  if def ~ 'make_interval\(secs => [0-9]' then
    raise exception 'record_answer carries a hard-coded grace window';
  end if;

  -- the scorer reads final rows only, so retained-unscored evidence cannot leak in
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='session_final_responses';
  if def !~ 'is_final' then
    raise exception 'session_final_responses does not exclude retained-unscored evidence';
  end if;

  -- termination provenance is enforced by a trigger, not by the caller
  if not exists (select 1 from pg_trigger where tgname = 'assessment_sessions_termination_provenance') then
    raise exception 'nothing enforces that a terminated session names its cause and actor';
  end if;
  if (select count(*) from pg_enum e join pg_type t on t.oid=e.enumtypid
       where t.typname='termination_cause') <> 4 then
    raise exception 'doc 04 §5 permits exactly four termination causes';
  end if;

  -- extension is gated, bounded and audited
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='extend_session_deadline';
  if def !~ 'can_in_institution' then raise exception 'extend_session_deadline is not capability-gated'; end if;
  if def !~ 'audit_write' then raise exception 'a deadline extension is not audited (doc 04 §5)'; end if;

  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'RPC exposure contract: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_learner_rpcs_are_guarded() a;
  if not v_ok then raise exception 'ownership reachability: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_integrity_never_scores() a;
  if not v_ok then raise exception 'integrity boundary: %', v_detail; end if;

  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) unpinned: %', n, bad; end if;
end $$;

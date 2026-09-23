-- ---------------------------------------------------------------------------
-- R1 — AN ANSWER IS NEVER LOST TO A FINISH (F-07, F-08).
--
-- The coherence assessment reproduced, in a real browser against the running
-- build, two ways a learner's answer disappears:
--
--   F-07  after a reload the client numbered a CHANGED answer with a
--         client_seq the server already held for the replayed one; the server
--         correctly refused the conflicting receipt, and the client treated
--         the refusal as "offline" for ever;
--   F-08  Finish finalized the session while those answers were still in the
--         client's outbox, so they were scored as unanswered.
--
-- The client half is repaired in ItemPlayer. This migration is the half that
-- makes the invariant a DATABASE property, so a client that skips its own gate
-- is still refused:
--
--   I-R1.  An assessment may never become final while response evidence the
--          learner has taken remains unresolved, and a reconstructed client
--          sequence may never cost a later answer.
--
-- WHAT CHANGES
--   1. Refusals carry STABLE CODES rather than prose alone, so a client can
--      tell "renumber and resend" from "this session is over" from "try again":
--        PR001  receipt conflict        — DETAIL = the highest client_seq held
--        PR002  session accepts nothing — terminal (final, terminated, not
--                                          yours, enrolment ended)
--        PR006  pending evidence        — DETAIL = presented items not yet held
--        PR007  late-sync window open   — DETAIL = when it closes
--      The messages are unchanged; only errcode/detail are added.
--   2. finish_my_session takes a MANIFEST — {presented_item_id: client_seq}, the
--      highest seq the learner took per item — and refuses to finalize until
--      the server holds a receipt at or above every one of them.
--   3. An EXPIRED session is finalized only once its late-sync grace window has
--      closed, unless the finishing learner's manifest has just been verified:
--      answers still travelling inside the grace window are part of the paper.
--
-- WHAT DOES NOT CHANGE. The idempotency key, INV-28's semantics, scoring, the
-- deadline, and every authorization predicate. finish_my_session keeps its name
-- (the registry closes over names) and its one-argument form still resolves
-- through the default, so existing callers are untouched; the old signature is
-- dropped so no overload exists.
-- ---------------------------------------------------------------------------

-- 1a. the conflict carries its code and the server's high-water mark ---------
create or replace function public.submit_response(
  p_presented_item uuid,
  p_client_seq integer,
  p_value jsonb,
  p_client_asserted_at timestamptz default null,
  p_receipt_mode public.receipt_mode default 'LIVE',
  p_is_final boolean default false
) returns table (response_id uuid, outcome text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_existing uuid; v_digest text; v_stored text; v_max integer;
begin
  v_digest := public.content_digest(p_value::text);

  insert into public.responses (presented_item_id, session_id, institution_id, client_seq,
                                value, value_digest, client_asserted_at, receipt_mode, is_final)
  values (p_presented_item,
          '00000000-0000-0000-0000-000000000000',   -- overwritten by the trigger
          '00000000-0000-0000-0000-000000000000',   -- overwritten by the trigger
          p_client_seq, p_value, v_digest, p_client_asserted_at, p_receipt_mode, p_is_final)
  on conflict on constraint responses_idempotency_key do nothing
  returning id into v_id;

  if v_id is not null then
    response_id := v_id; outcome := 'RECORDED'; return next; return;
  end if;

  select r.id, r.value_digest into v_existing, v_stored from public.responses r
   where r.presented_item_id = p_presented_item and r.client_seq = p_client_seq;
  if v_existing is null then
    raise exception 'idempotency key conflicted but no response is visible; refusing to guess';
  end if;
  if v_stored = v_digest then
    response_id := v_existing; outcome := 'ACKNOWLEDGED'; return next; return;
  end if;
  select max(r.client_seq) into v_max from public.responses r
   where r.presented_item_id = p_presented_item;
  raise exception 'receipt (%, %) already carries a different answer: a new answer needs a new client_seq (INV-28)',
    p_presented_item, p_client_seq
    using errcode = 'PR001', detail = coalesce(v_max, p_client_seq)::text;
end $$;

-- 1b. a response into a closed session is a TERMINAL refusal -----------------
create or replace function public.enforce_response_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session uuid; v_inst uuid; v_status public.session_status;
begin
  if tg_op <> 'INSERT' then
    raise exception 'a response is evidence: append a new client_seq, never rewrite one (INV-28)';
  end if;
  select p.session_id, p.institution_id into v_session, v_inst
    from public.presented_items p where p.id = new.presented_item_id;
  if v_session is null then
    raise exception 'unknown presented item %', new.presented_item_id;
  end if;
  new.session_id := v_session;
  new.institution_id := v_inst;

  select s.status into v_status from public.assessment_sessions s where s.id = v_session;
  if v_status in ('FINALIZED','TERMINATED') then
    raise exception 'the session is % and accepts no further responses', v_status
      using errcode = 'PR002';
  end if;

  new.value_digest := public.content_digest(new.value::text);
  return new;
end $$;

-- 1c. record_answer: every refusal that means "this session is over" is PR002
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
    v_mode := 'LATE_SYNC';
    v_scorable := false;
  end if;

  if v_scorable and (v_deadline is null or now() <= v_deadline) then
    select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(v_session) c;
    if not v_ok then
      raise exception 'this session accepts no further answers: %', v_reason
        using errcode = 'PR002', detail = v_reason;
    end if;
  else
    if (select s.status from public.assessment_sessions s where s.id = v_session) = 'TERMINATED' then
      raise exception 'this session was ended and accepts no submission' using errcode = 'PR002';
    end if;
    if not public.session_is_mine(v_session) then
      raise exception 'this session belongs to someone else' using errcode = 'PR002';
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

  select r.response_id, r.outcome into v_rid, v_out
    from public.submit_response(p_presented_item, p_client_seq, v_value,
                                p_client_asserted_at, v_mode, v_scorable) r;

  response_id := v_rid;
  outcome := case when v_scorable then v_out else v_out || '+retained_unscored' end;
  return next;
end $$;

-- 3. an EXPIRED session waits out its late-sync window -----------------------
create or replace function public.finalize_session(p_session uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_s public.assessment_sessions; v_e record; v_id uuid; v_grace integer; v_closes timestamptz;
begin
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;

  select r.id into v_id from public.assessment_results r
   where r.session_id = p_session and r.supersedes_result_id is null;
  if v_id is not null then return v_id; end if;

  perform public.session_enforce_deadline(p_session);
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.status not in ('SUBMITTED','EXPIRED') then
    raise exception 'a session is scored from SUBMITTED or EXPIRED, not % (doc 04 §5)', v_s.status;
  end if;

  -- I-R1: answers still travelling inside the governed late-sync window are
  -- part of this paper. Only the finishing learner's verified manifest (which
  -- proves nothing of theirs is still travelling) may close it early.
  if v_s.status = 'EXPIRED' and v_s.authoritative_deadline is not null then
    select coalesce(d.late_sync_grace_seconds, 0) into v_grace
      from public.assessment_definitions d where d.id = v_s.assessment_definition_id;
    v_closes := v_s.authoritative_deadline + make_interval(secs => v_grace);
    if now() <= v_closes
       and current_setting('pintar.manifest_verified', true) is distinct from p_session::text then
      raise exception 'the late-sync window for this session is still open; answers may still arrive'
        using errcode = 'PR007', detail = v_closes::text;
    end if;
  end if;

  select * into v_e from public.evaluate_session(p_session);

  insert into public.assessment_results (
    session_id, institution_id, person_id, evidence_class,
    engine_version, scoring_policy_version, mastery, per_domain,
    safety_gate_passed, delta_inputs)
  values (
    p_session, '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000', 'SYNTHETIC',
    public.engine_version(), public.scoring_policy_version(), v_e.mastery, v_e.per_domain,
    v_e.safety_gate_passed,
    jsonb_build_object('item_total', v_e.item_total, 'answered', v_e.answered,
                       'correct', v_e.correct, 'safety_total', v_e.safety_total,
                       'safety_correct', v_e.safety_correct))
  returning id into v_id;

  update public.assessment_sessions set status = 'FINALIZED' where id = p_session;
  return v_id;
end $$;

-- 2. Finish declares what the learner took; the server holds it or refuses ---
drop function public.finish_my_session(uuid);
create function public.finish_my_session(p_session uuid, p_manifest jsonb default null)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_missing jsonb;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else' using errcode = 'PR002';
  end if;

  -- repeated Finish observes the existing result; it never computes a second
  select r.id into v_id from public.assessment_results r
   where r.session_id = p_session and r.supersedes_result_id is null;
  if v_id is not null then return v_id; end if;

  if p_manifest is not null then
    if jsonb_typeof(p_manifest) <> 'object' then
      raise exception 'the finish manifest is {presented_item_id: client_seq}';
    end if;
    -- a manifest entry is satisfied by a receipt at or above its seq for a
    -- presented item OF THIS SESSION; anything else is pending
    select coalesce(jsonb_agg(m.k order by m.k), '[]'::jsonb) into v_missing
      from jsonb_each_text(p_manifest) m(k, v)
     where m.k !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or m.v !~ '^[0-9]{1,9}$'
        or not exists (
             select 1 from public.presented_items p
               join public.responses r on r.presented_item_id = p.id
              where p.id = m.k::uuid and p.session_id = p_session
                and r.client_seq >= m.v::integer);
    if jsonb_array_length(v_missing) > 0 then
      raise exception 'answers the learner gave are not yet held by the server; the assessment is not finalised over them'
        using errcode = 'PR006', detail = v_missing::text;
    end if;
    perform set_config('pintar.manifest_verified', p_session::text, true);
  end if;

  perform public.submit_session(p_session);
  return public.finalize_session(p_session);
end $$;
revoke all on function public.finish_my_session(uuid, jsonb) from public, anon;
grant execute on function public.finish_my_session(uuid, jsonb) to authenticated, service_role;

-- ADR-0021: every function this migration (re)creates carries its grants here
revoke all on function public.submit_response(uuid, integer, jsonb, timestamptz,
  public.receipt_mode, boolean) from public, anon, authenticated;
grant execute on function public.submit_response(uuid, integer, jsonb, timestamptz,
  public.receipt_mode, boolean) to service_role;
revoke all on function public.enforce_response_write() from public, anon, authenticated;
revoke all on function public.record_answer(uuid, integer, jsonb, timestamptz, public.receipt_mode) from public, anon;
grant execute on function public.record_answer(uuid, integer, jsonb, timestamptz, public.receipt_mode)
  to authenticated, service_role;
revoke all on function public.finalize_session(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification block: structural only; the behaviour is proven by F09-R01..F09-R03.
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'finish_my_session';
  if n <> 1 then raise exception 'finish_my_session must exist exactly once (no overload), found %', n; end if;
  if not has_function_privilege('authenticated', 'public.finish_my_session(uuid, jsonb)', 'execute') then
    raise exception 'finish_my_session is not callable by a learner';
  end if;
  if has_function_privilege('anon', 'public.finish_my_session(uuid, jsonb)', 'execute') then
    raise exception 'finish_my_session is callable anonymously';
  end if;
  if pg_get_functiondef('public.finalize_session(uuid)'::regprocedure) not like '%PR007%' then
    raise exception 'finalize_session does not guard the late-sync window';
  end if;
  if pg_get_functiondef('public.submit_response(uuid,integer,jsonb,timestamptz,public.receipt_mode,boolean)'::regprocedure)
     not like '%PR001%' then
    raise exception 'the receipt conflict carries no code';
  end if;
end $$;

-- A3 · EVERY WRITER OF A SITTING TAKES ITS ROW (THE PLAN §5.5 D5; A3-COMPLETION.md, Sharon §3 condition 2; A3-3).
--
-- A3-E01, the enumeration test, found four writers that update a sitting with no row lock: terminate_session,
-- extend_session_deadline, finalize_session and percobaan_tandai. Each now takes the sitting FOR UPDATE after the learner
-- (FOR KEY SHARE) and the shared fence, and before it reads the sitting for a decision, so no staff or service write
-- interleaves with a learner write or a recovery (D5: they are not checked against the controller, but they are bound by
-- the same row lock and the one lock order). Nothing else in their bodies changes. Each is redefined IN FULL from its
-- live body (pg_get_functiondef at 4c5f6383), never patched by text; the grants are restated as they were.
--
-- METRIC CATALOGUE AND ENGINE: unchanged (D-060). finalize_session scores exactly as before; only its row lock is new.

CREATE OR REPLACE FUNCTION public.terminate_session(p_session uuid, p_cause termination_cause, p_reason text)
 RETURNS session_status
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid; v_s public.assessment_sessions; v_kept int;
begin
  -- A2a D6.2: the learner, the shared fence, then protection read under it
  if public.pengerjaan_pagar(p_session) then perform public.pengerjaan_tolak('SITTING_CLASS_STOPPED'); end if;
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  -- A2A-L01 (Sharon, A2A-L01-FINDING-f09da528.md): the learner first, before the sitting is touched
  perform 1 from public.persons where id = v_s.person_id for key share;
  -- A3 (D5; Sharon §3, condition 2): the sitting FOR UPDATE, after the learner and the fence, before it is read for a decision
  select * into v_s from public.assessment_sessions where id = p_session for update;
  -- SI-D01 (Sharon, finding A): an academic sitting is ended over its place; a professional-learning one by the platform
  if not (case when public.release_is_professional(v_s.plp_release_id)
               then public.is_system_admin()   -- SI-D01 (finding 1): a professional-learning sitting is the platform's
               else public.boleh_atas_sesi(v_s.id, 'CAN_REVIEW_INTEGRITY') end) then
    raise exception 'ending another person''s assessment requires CAN_REVIEW_INTEGRITY over the class (or Angkatan) it was given in';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a termination records why';
  end if;
  if v_s.status in ('FINALIZED','TERMINATED') then return v_s.status; end if;

  perform public.maintenance_jaga_sesi(p_session);   -- A2b: the place, read at the write
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
end;
$function$;

CREATE OR REPLACE FUNCTION public.extend_session_deadline(p_session uuid, p_minutes integer, p_reason text)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid; v_s public.assessment_sessions; v_old timestamptz; v_new timestamptz;
begin
  -- A2a D6.2: the learner, the shared fence, then protection read under it
  if public.pengerjaan_pagar(p_session) then perform public.pengerjaan_tolak('SITTING_CLASS_STOPPED'); end if;
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  -- A3 (D5; Sharon §3, condition 2): the sitting FOR UPDATE; pengerjaan_pagar has taken the learner and the fence
  select * into v_s from public.assessment_sessions where id = p_session for update;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  -- A1 (blocker 1): CAN_MANAGE_SITTINGS over the sitting's place; a professional-learning sitting is the platform's
  if not public.boleh_atas_sesi(v_s.id, 'CAN_MANAGE_SITTINGS') then
    raise exception 'extending a deadline requires CAN_MANAGE_SITTINGS over the class (or Angkatan) the sitting was given in';
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
  perform public.maintenance_jaga_sesi(p_session);   -- A2b: the place, read at the write
  -- A1 (O41-20): under the row lock, a sitting whose deadline has passed ends by it first
  perform public.pengerjaan_putus_tenggat(p_session, true);
  select * into v_s from public.assessment_sessions where id = p_session;
  -- A1 (O41-17): a held sitting gains no time
  if public.pengerjaan_ditahan(v_s) then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
  if v_s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
    raise exception 'a % session has no deadline to extend', v_s.status;
  end if;

  v_old := public.pengerjaan_tenggat_efektif(p_session);
  if v_old is null then perform public.pengerjaan_tolak('SITTING_NO_DEADLINE'); end if;
  v_new := v_old + make_interval(mins => p_minutes);
  update public.assessment_sessions
     set authoritative_deadline = v_new,
         deadline_extended_count = deadline_extended_count + 1
   where id = p_session;

  perform public.audit_write('assessment_session.deadline_extended', 'assessment_sessions',
    p_session::text, v_s.institution_id,
    jsonb_build_object('session_id', p_session, 'old_deadline', v_old, 'new_deadline', v_new,
                       'minutes', p_minutes, 'reason', p_reason, 'actor', v_actor));
  return v_new;
end $function$;

CREATE OR REPLACE FUNCTION public.finalize_session(p_session uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_s public.assessment_sessions; v_e record; v_id uuid; v_grace integer; v_closes timestamptz;
begin
  -- A2a D6.2: the learner, the shared fence, then protection read under it
  if public.pengerjaan_pagar(p_session) then perform public.pengerjaan_tolak('SITTING_CLASS_STOPPED'); end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  -- A2A-L01 (Sharon, A2A-L01-FINDING-f09da528.md): the learner first, before the sitting is touched
  perform 1 from public.persons where id = v_s.person_id for key share;
  -- A3 (D5; Sharon §3, condition 2): the sitting FOR UPDATE, after the learner and the fence, before it is read for a decision
  select * into v_s from public.assessment_sessions where id = p_session for update;

  select r.id into v_id from public.assessment_results r
   where r.session_id = p_session and r.supersedes_result_id is null;
  if v_id is not null then return v_id; end if;

  perform public.pengerjaan_putus_tenggat(p_session, false);
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

  -- D-121(a): the scoring version the session was started under, never a newer one published meanwhile
  insert into public.assessment_results (
    session_id, institution_id, person_id, evidence_class,
    engine_version, scoring_policy_version, mastery, per_domain,
    safety_gate_passed, delta_inputs)
  values (
    p_session, '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000', 'SYNTHETIC',
    public.engine_version(), coalesce(v_s.scoring_policy_version, public.scoring_policy_version()), v_e.mastery, v_e.per_domain,
    v_e.safety_gate_passed,
    jsonb_build_object('item_total', v_e.item_total, 'answered', v_e.answered,
                       'correct', v_e.correct, 'safety_total', v_e.safety_total,
                       'safety_correct', v_e.safety_correct))
  returning id into v_id;

  update public.assessment_sessions set status = 'FINALIZED' where id = p_session;
  return v_id;
end $function$;

CREATE OR REPLACE FUNCTION public.percobaan_tandai(p_session uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare s public.assessment_sessions; v_batas integer; v_req uuid;
begin
  -- A3 (D5; Sharon §3, condition 2): the sitting FOR UPDATE (reached only from start_learning_session, after its
  -- insert, so the row is this transaction's own and the lock never waits)
  select * into s from public.assessment_sessions where id = p_session for update;
  if s.id is null or s.assessment_assignment_id is null or s.attempt_request_id is not null then return; end if;
  select d.attempt_limit into v_batas from public.assessment_definitions d where d.id = s.assessment_definition_id;
  if v_batas is null or public.percobaan_terpakai(s.person_id, s.assessment_assignment_id) <= v_batas then return; end if;
  select r.id into v_req from public.attempt_requests r
   where r.person_id = s.person_id and r.assessment_assignment_id in (select public.percobaan_penugasan_segaris(s.assessment_assignment_id)) and r.status = 'APPROVED'
   order by (exists (select 1 from public.assessment_sessions x where x.attempt_request_id = r.id
                       and coalesce(x.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION'))),
            r.decided_at, r.id
   limit 1;
  if v_req is not null then
    update public.assessment_sessions set attempt_request_id = v_req where id = p_session;
  end if;
end
$function$;

-- the grants, restated as they were (ADR-0021: a function created here revokes PUBLIC here)
revoke all on function public.terminate_session(uuid, public.termination_cause, text) from public, anon, authenticated;
grant execute on function public.terminate_session(uuid, public.termination_cause, text) to service_role;
grant execute on function public.terminate_session(uuid, public.termination_cause, text) to authenticated;

revoke all on function public.extend_session_deadline(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.extend_session_deadline(uuid, integer, text) to service_role;
grant execute on function public.extend_session_deadline(uuid, integer, text) to authenticated;

revoke all on function public.finalize_session(uuid) from public, anon, authenticated;
grant execute on function public.finalize_session(uuid) to service_role;

revoke all on function public.percobaan_tandai(uuid) from public, anon, authenticated;
grant execute on function public.percobaan_tandai(uuid) to service_role;

do $$
declare f text; b text;
begin
  foreach f in array array['terminate_session', 'extend_session_deadline', 'finalize_session', 'percobaan_tandai'] loop
    select prosrc into b from pg_proc where proname = f and pronamespace = 'public'::regnamespace;
    if b !~* 'from\s+public\.assessment_sessions\s+where\s+id\s*=\s*p_session\s+for\s+update' then
      raise exception 'A3-3: % does not take its sitting FOR UPDATE', f;
    end if;
  end loop;
end $$;

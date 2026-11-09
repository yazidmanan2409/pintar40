-- SI-D01, Sharon's re-review finding 1 (9 Nov; owner's priority 2). A professional-learning sitting is the platform's to
-- end or extend, as it already is to read and decide (boleh_atas_sesi: a PD sitting is the platform administrator's).
-- 20270112130000 moved the academic branch of terminate_session and extend_session_deadline to the sitting's place but
-- kept can_in_institution for a PD sitting: a capability anywhere in the school, so a school's Kepala departemen ended a
-- colleague's PD sitting it could not read and any Guru extended one. F37-D08 was red on af009738.
-- Only the PD branch changes; the academic branch, the reasons, the limits and the audit are as they were.

CREATE OR REPLACE FUNCTION public.terminate_session(p_session uuid, p_cause termination_cause, p_reason text)
 RETURNS session_status
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid; v_s public.assessment_sessions; v_kept int;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
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
revoke all on function public.terminate_session(uuid, termination_cause, text) from public, anon, authenticated;
grant execute on function public.terminate_session(uuid, termination_cause, text) to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.extend_session_deadline(p_session uuid, p_minutes integer, p_reason text)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid; v_s public.assessment_sessions; v_old timestamptz; v_new timestamptz;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
  if v_s.id is null then raise exception 'unknown session %', p_session; end if;
  -- SI-D01 (Sharon, finding A): an academic sitting's deadline is extended over its place; a professional-learning one
  -- by the platform
  if not (case when public.release_is_professional(v_s.plp_release_id)
               then public.is_system_admin()   -- SI-D01 (finding 1): a professional-learning sitting is the platform's
               else public.boleh_atas_sesi(v_s.id, 'CAN_ASSIGN_LEARNING') end) then
    raise exception 'extending a deadline requires CAN_ASSIGN_LEARNING over the class (or Angkatan) the sitting was given in';
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
end;
$function$;
revoke all on function public.extend_session_deadline(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.extend_session_deadline(uuid, integer, text) to authenticated, service_role;

-- verification: no function that ends or extends another person's sitting asks can_in_institution
do $$
declare v_f text;
begin
  foreach v_f in array array['terminate_session', 'extend_session_deadline'] loop
    if position('can_in_institution' in (select string_agg(prosrc, ' ') from pg_proc where proname = v_f and pronamespace = 'public'::regnamespace)) > 0 then
      raise exception 'SI-D01: % still asks can_in_institution', v_f;
    end if;
    if position('is_system_admin' in (select string_agg(prosrc, ' ') from pg_proc where proname = v_f and pronamespace = 'public'::regnamespace)) = 0 then
      raise exception 'SI-D01: % does not give a professional-learning sitting to the platform', v_f;
    end if;
  end loop;
end $$;

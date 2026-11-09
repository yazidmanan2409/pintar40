-- ---------------------------------------------------------------------------
-- SYSTEM INTEGRITY GATE · SI-D01, Sharon's re-review of 53ab41fe (9 Nov) and the owner's direction (9 Nov).
--
--   A (HIGH). Three acts on another person's sitting still decided school-wide: record_integrity_review (deciding an
--      observation, which also closes D5's qualifying case), terminate_session (ending a running sitting) and
--      extend_session_deadline. Each now decides over the sitting's place (its Kelas, else its Angkatan). A
--      professional-learning sitting keeps its own rule for ending and extending (put to Sharon); its observations
--      remain the platform's (BOB-46).
--   B. refer_integrity_signal anchored on the class alone while the list offered referral over the Angkatan: it now
--      anchors on the place, as may_refer does.
--   C. sesi_tempat / sesi_tempat_koreksi answered a node id for any sitting to anyone signed in. Replaced, for row
--      security and the functions, by boolean predicates of the caller (boleh_atas_sesi, boleh_koreksi_sesi), which
--      return nothing about the sitting; the two helpers are withdrawn from authenticated.
--   Low. lesson_progress's «or was» is tied in time: the membership must not have ended before the assignment was made.
--   Low. D5's audit row names the undecided observation(s) that qualified the investigation.
--   OWNER (9 Nov): «preserve school-wide oversight through aggregate counts for other departments. Individual case
--      details and actions remain limited to authorized scopes.» integrity_signals_awaiting_review lists only what the
--      reader stands over; integrity_signals_waiting_elsewhere gives each school's COUNT of observations waiting outside
--      the reader's scope. This replaces the presentation contract FD-7 / DG-32 (F21-I01, restated).
-- ---------------------------------------------------------------------------

-- C. may the caller exercise a capability over the place this sitting was given in (no data about the sitting)
create or replace function public.boleh_atas_sesi(p_session uuid, p_capability text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select case when public.session_is_professional(s.id) then public.is_system_admin()
                               else coalesce(s.class_node_id, s.cohort_node_id) is not null
                                    and public.can_on_node(p_capability, coalesce(s.class_node_id, s.cohort_node_id)) end
                     from public.assessment_sessions s where s.id = p_session), false)
$$;
revoke all on function public.boleh_atas_sesi(uuid, text) from public, anon, authenticated;
grant execute on function public.boleh_atas_sesi(uuid, text) to authenticated;

-- C. may the caller reclassify this sitting (its place, else, with neither, the school's root)
create or replace function public.boleh_koreksi_sesi(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select case when public.session_is_professional(s.id) then public.is_system_admin()
                               else public.sesi_tempat_koreksi(s.id) is not null
                                    and public.can_on_node('CAN_REVIEW_INTEGRITY', public.sesi_tempat_koreksi(s.id)) end
                     from public.assessment_sessions s where s.id = p_session), false)
$$;
revoke all on function public.boleh_koreksi_sesi(uuid) from public, anon, authenticated;
grant execute on function public.boleh_koreksi_sesi(uuid) to authenticated;

drop policy integrity_signals_select on public.integrity_signals;
create policy integrity_signals_select on public.integrity_signals for select to authenticated using (
  public.boleh_atas_sesi(session_id, 'CAN_REVIEW_INTEGRITY'));

drop policy evidence_class_overrides_select on public.evidence_class_overrides;
create policy evidence_class_overrides_select on public.evidence_class_overrides for select to authenticated using (
  public.boleh_koreksi_sesi(session_id));
drop policy evidence_class_overrides_insert on public.evidence_class_overrides;
create policy evidence_class_overrides_insert on public.evidence_class_overrides for insert to authenticated with check (
  public.boleh_koreksi_sesi(session_id));

revoke all on function public.sesi_tempat(uuid) from public, anon, authenticated;
revoke all on function public.sesi_tempat_koreksi(uuid) from public, anon, authenticated;
delete from public.client_rpc_registry where function_name in ('sesi_tempat', 'sesi_tempat_koreksi');
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('boleh_atas_sesi', 'PLATFORM', 'SI-D01: whether the caller holds a capability over the place a sitting was given in; '
   || 'a boolean of the caller only, for row security and the integrity functions.', null, null),
  ('boleh_koreksi_sesi', 'PLATFORM', 'SI-D01: whether the caller may reclassify a sitting (its place, else the school''s '
   || 'root); a boolean of the caller only.', null, null);

-- A.
CREATE OR REPLACE FUNCTION public.record_integrity_review(p_signal uuid, p_decision text, p_note text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid; sig record;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'recording an integrity review requires an authenticated actor'; end if;
  if p_decision not in ('NO_CONCERN', 'DISCUSSED_WITH_LEARNER', 'REFERRED_TO_INSTITUTION') then
    raise exception
      'an integrity review records what the reviewer did, not a verdict about the learner: unknown decision %',
      p_decision;
  end if;

  select s.id, s.institution_id, s.session_id, s.category into sig
    from public.integrity_signals s where s.id = p_signal;
  if sig.id is null then raise exception 'unknown integrity signal %', p_signal; end if;
  -- SI-D01 (Sharon, finding A): decided over the sitting's place, not anywhere in the school
  if not public.boleh_atas_sesi(sig.session_id, 'CAN_REVIEW_INTEGRITY')
     -- BOB-46 (D-069(c)): a professional-learning signal reaches no school role
     or (public.session_is_professional(sig.session_id) and not public.is_system_admin()) then
    raise exception 'reviewing an integrity signal requires CAN_REVIEW_INTEGRITY over the class (or Angkatan) the sitting was given in';
  end if;

  -- No second log table (doc 16): the decision is an audit row, and the signal
  -- row itself is not mutated into carrying an outcome. W2.7: the row says it is
  -- this observation's decision (scope 'signal'), not its sitting's.
  perform public.audit_write('INTEGRITY_SIGNAL_REVIEWED', 'integrity_signals', p_signal::text,
    sig.institution_id,
    jsonb_build_object('session_id', sig.session_id, 'category', sig.category,
                       'decision', p_decision, 'note', p_note, 'scope', 'signal'));

  -- BOB-39: a referral is Management's to consider, so it reaches their queue.
  -- Same transaction: if the referral is refused, so is the review.
  if p_decision = 'REFERRED_TO_INSTITUTION' then
    perform public.refer_integrity_signal(p_signal, p_note);
  end if;
  return p_signal;
end $function$;

revoke all on function public.record_integrity_review(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_integrity_review(uuid, text, text) to authenticated;
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
  -- SI-D01 (Sharon, finding A): an academic sitting is ended over its place; a professional-learning one keeps its rule
  if not (case when public.release_is_professional(v_s.plp_release_id)
               then public.can_in_institution('CAN_REVIEW_INTEGRITY', v_s.institution_id)
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
end $function$;

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
  -- keeps its rule
  if not (case when public.release_is_professional(v_s.plp_release_id)
               then public.can_in_institution('CAN_ASSIGN_LEARNING', v_s.institution_id)
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
end $function$;

-- B.
CREATE OR REPLACE FUNCTION public.refer_integrity_signal(p_signal uuid, p_note text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_actor uuid; v_sig record; v_open uuid; v_id uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null or p_signal is null then
    raise exception 'referring an integrity signal requires an authenticated actor and a signal';
  end if;

  select s.id, s.institution_id, s.session_id, s.category,
         coalesce(ses.class_node_id, ses.cohort_node_id) as class_node_id, ses.person_id, public.release_is_professional(ses.plp_release_id) as pd
    into v_sig
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
   where s.id = p_signal;

  -- AUTHORIZATION BEFORE ANYTHING ELSE, and one message for every refusal, so
  -- an unknown signal and a signal in the next department are indistinguishable
  -- from outside (SI-D01, Sharon finding B: the place is the Kelas, else the Angkatan, as may_refer says). BOB-46: a professional-learning signal is one no school role
  -- may reach, so it is answered the same way.
  if v_sig.id is null or v_sig.class_node_id is null
     or not public.can_on_node('CAN_REVIEW_INTEGRITY', v_sig.class_node_id)
     or (v_sig.pd and not public.is_system_admin()) then
    raise exception 'referring an integrity signal requires CAN_REVIEW_INTEGRITY over the node it was observed in';
  end if;
  -- D-069(c), R8: recorded, never referred -- Admin platform included
  if v_sig.pd then perform public.professional_refuse('PD_SIGNAL_NOT_REFERRED'); end if;

  -- IDEMPOTENT. A second referral of the same still-open signal is the same
  -- referral; it returns the existing row and writes no second audit record,
  -- because nothing happened the first one did not already record.
  select d.id into v_open from public.management_decisions d
   where d.family = 'INTEGRITY_REFERRAL' and d.source_table = 'integrity_signals'
     and d.source_id = p_signal and d.state <> 'DECIDED';
  if v_open is not null then return v_open; end if;

  insert into public.management_decisions
    (family, institution_id, scope_node_id, subject_person_id, source_table, source_id,
     state, raised_by_person_id, raised_note)
  values ('INTEGRITY_REFERRAL', v_sig.institution_id, v_sig.class_node_id, v_sig.person_id,
          'integrity_signals', p_signal, 'AWAITING_REVIEW', v_actor, p_note)
  returning management_decisions.id into v_id;

  perform public.audit_write('management_decision.raised', 'management_decisions', v_id::text,
    v_sig.institution_id,
    jsonb_build_object('family', 'INTEGRITY_REFERRAL', 'source_table', 'integrity_signals',
                       'source_id', p_signal, 'scope_node_id', v_sig.class_node_id,
                       'category', v_sig.category));
  return v_id;
end $function$;

revoke all on function public.terminate_session(uuid, public.termination_cause, text) from public, anon, authenticated;
grant execute on function public.terminate_session(uuid, public.termination_cause, text) to authenticated;
revoke all on function public.extend_session_deadline(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.extend_session_deadline(uuid, integer, text) to authenticated;
revoke all on function public.refer_integrity_signal(uuid, text) from public, anon, authenticated;
grant execute on function public.refer_integrity_signal(uuid, text) to authenticated;

-- Low. «or was», tied in time: a membership that ended before the assignment was made does not carry it
drop policy lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select to authenticated using (
  person_id = public.current_person_id()
  or case when public.release_is_professional(plp_release_id)
          then public.professional_progress_readable(person_id, plp_release_id, institution_id)
          else exists (select 1 from public.learning_assignments la
                        where la.plp_release_id = lesson_progress.plp_release_id
                          and la.institution_id = lesson_progress.institution_id
                          and public.can_on_node('CAN_ASSIGN_LEARNING', la.node_id)
                          and exists (select 1 from public.memberships m
                                        join public.enrollments e on e.id = m.enrollment_id
                                        join public.org_nodes n on n.id = m.node_id
                                       where e.person_id = lesson_progress.person_id
                                         and e.institution_id = lesson_progress.institution_id
                                         and n.jalur @> array[la.node_id]
                                         and (m.valid_to is null or m.valid_to > la.created_at))) end);

-- OWNER (9 Nov): the list gives individual cases only over the reader's scope ...
create or replace function public.integrity_signals_awaiting_review()
returns table (signal_id uuid, session_id uuid, institution_id uuid, category public.integrity_category,
               observed_at timestamptz, may_refer boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.id, s.session_id, s.institution_id, s.category, s.observed_at,
         not public.session_is_professional(s.session_id)
    from public.integrity_signals s
   where public.current_person_id() is not null
     and public.boleh_atas_sesi(s.session_id, 'CAN_REVIEW_INTEGRITY')
     and not public.integrity_signal_decided(s.id)
   order by s.observed_at desc, s.id
   limit 200
$$;
revoke all on function public.integrity_signals_awaiting_review() from public, anon, authenticated;
grant execute on function public.integrity_signals_awaiting_review() to authenticated;

-- ... and school-wide oversight as a COUNT PER DEPARTMENT (Sharon, 9 Nov): per school where the reader holds
-- CAN_REVIEW_INTEGRITY, how many academic observations still wait in each department outside the reader's own scope;
-- no sitting, category, time or person. A place under no department is counted under a null department.
create or replace function public.integrity_signals_waiting_elsewhere()
returns table (institution_id uuid, department_id uuid, department_name text, waiting integer)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.institution_id, d.id, d.name, count(*)::integer
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
    left join public.org_nodes p on p.id = coalesce(ses.class_node_id, ses.cohort_node_id)
    left join lateral (select dn.id, dn.name from public.org_nodes dn
                        where dn.id = any(p.jalur) and dn.kind = 'DEPARTMENT' limit 1) d on true
   where public.current_person_id() is not null
     and public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id)
     and not public.session_is_professional(s.session_id)
     and not public.boleh_atas_sesi(s.session_id, 'CAN_REVIEW_INTEGRITY')
     and not public.integrity_signal_decided(s.id)
   group by s.institution_id, d.id, d.name
$$;
revoke all on function public.integrity_signals_waiting_elsewhere() from public, anon, authenticated;
grant execute on function public.integrity_signals_waiting_elsewhere() to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('integrity_signals_waiting_elsewhere', 'STAFF', 'Owner, 9 Nov: school-wide integrity oversight as a count only: per '
   || 'school and department, the observations waiting outside the reader''s own scope. Read only.', null, null);

-- Low. D5's audit names the undecided observation(s) that qualified the opening
create or replace function public.jawaban_untuk_pemeriksaan(p_session uuid, p_alasan text)
returns table (posisi integer, item_id uuid, jawaban jsonb, diterima_pada timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_alasan text := btrim(coalesce(p_alasan, '')); v_kasus uuid[];
begin
  if public.current_person_id() is null or p_session is null
     or public.session_is_professional(p_session)
     or not public.boleh_atas_sesi(p_session, 'CAN_REVIEW_INTEGRITY') then
    raise exception using errcode = '42501', detail = 'INVESTIGATION_NOT_ALLOWED',
      message = 'an investigation requires CAN_REVIEW_INTEGRITY over the sitting it opens';
  end if;
  select s.institution_id into v_inst from public.assessment_sessions s where s.id = p_session;
  if length(v_alasan) < 10 or length(v_alasan) > 500 then
    raise exception using errcode = '22023', detail = 'INVESTIGATION_REASON',
      message = 'an investigation states its reason (10 to 500 characters)';
  end if;
  select array_agg(g.id order by g.observed_at) into v_kasus from public.integrity_signals g
   where g.session_id = p_session and not public.integrity_signal_decided(g.id);
  if v_kasus is null then
    raise exception using errcode = '42501', detail = 'INVESTIGATION_NO_CASE',
      message = 'answers are opened only for a sitting with an integrity observation still undecided';
  end if;

  perform public.audit_write('integrity.answers_opened', 'assessment_sessions', p_session::text, v_inst,
    jsonb_build_object('reason', v_alasan, 'signals', to_jsonb(v_kasus)));

  return query
    select pi.position::integer, pi.item_id, r.value, r.received_at
      from public.presented_items pi
      join public.responses r on r.presented_item_id = pi.id and r.is_final
     where pi.session_id = p_session
     order by pi.position;
end $$;
revoke all on function public.jawaban_untuk_pemeriksaan(uuid, text) from public, anon, authenticated;
grant execute on function public.jawaban_untuk_pemeriksaan(uuid, text) to authenticated;

do $$
declare v_f text;
begin
  foreach v_f in array array['record_integrity_review', 'terminate_session', 'extend_session_deadline'] loop
    if position('boleh_atas_sesi' in (select string_agg(prosrc, ' ') from pg_proc where proname = v_f and pronamespace = 'public'::regnamespace)) = 0 then
      raise exception 'SI-D01 (finding A): % does not decide over the sitting''s place', v_f;
    end if;
  end loop;
  if position('coalesce(ses.class_node_id, ses.cohort_node_id)' in (select prosrc from pg_proc where oid = 'public.refer_integrity_signal(uuid,text)'::regprocedure)) = 0 then
    raise exception 'SI-D01 (finding B): refer_integrity_signal does not anchor on the place';
  end if;
  if has_function_privilege('authenticated', 'public.sesi_tempat(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.sesi_tempat_koreksi(uuid)', 'execute') then
    raise exception 'SI-D01 (finding C): a place helper still answers a signed-in caller';
  end if;
  if position('can_in_institution' in (select prosrc from pg_proc where oid = 'public.integrity_signals_awaiting_review()'::regprocedure)) > 0 then
    raise exception 'owner, 9 Nov: the waiting list gives individual cases only over the reader''s scope';
  end if;
  if position('''signals''' in (select prosrc from pg_proc where oid = 'public.jawaban_untuk_pemeriksaan(uuid,text)'::regprocedure)) = 0 then
    raise exception 'D5: the investigation audit does not name its qualifying observation';
  end if;
end $$;

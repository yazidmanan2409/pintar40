-- ---------------------------------------------------------------------------
-- A1 · SITTING CONTROL, the database half (docs/completion-4.1/batches/A1-COMPLETION.md, «Pre-build review: outcome»;
-- owner rulings O41-16, O41-17, O41-20). In 4.0 extend_session_deadline and terminate_session existed with no screen,
-- nothing granted another attempt, a window was changed by a raw unaudited update, a sitting its learner abandoned was
-- never closed, and a suspension left the learner's sitting open.
--
-- (1) THE SITTING-MANAGEMENT CAPABILITY, CAN_MANAGE_SITTINGS (Sharon, blocker 1): held by EDUCATOR, HEAD_OF_DEPARTMENT
--     and INSTITUTION_ADMIN; decided over the sitting's own place, coalesce(class, Angkatan), as boleh_atas_sesi decides.
--     Ending for an integrity cause stays terminate_session's (CAN_REVIEW_INTEGRITY), untouched. A professional-learning
--     sitting stays the platform's: its extension and its ending are as 4.0 left them, and no new act is offered on it
--     (a held one is resumed or closed by the platform admin, who alone holds it).
-- (2) EXTRA TIME: extend_session_deadline, now decided by that capability; tambah_waktu_pengerjaan is the screens' entry
--     with designed refusals. A sitting past its deadline has ended and is not extended; a held one is not extended.
-- (3) THE TEACHER ENDS ONE SITTING, akhiri_pengerjaan(sitting, SCORED | NOT_COUNTED, reason) (blocker 2):
--       SCORED       a hand-in on the learner's behalf: SUBMITTED, then FINALIZED by finalize_session itself, so the
--                    result is an ordinary one; the teacher and the reason are recorded on the sitting.
--       NOT_COUNTED  the existing ADMINISTRATIVE_TERMINATION: answers kept, no result, not an attempt.
-- (4) AN ABANDONED SITTING (blocker 3; O41-20): ONE function, pengerjaan_putus_tenggat, decides the ending. The lazy
--     check (session_enforce_deadline, now a call to it) and the scheduled entry point (pengerjaan_tutup_terjadwal,
--     service level) both call it. At its effective deadline the sitting ends (EXPIRED, marked DEADLINE) and is scored
--     on the answers recorded once the definition's late-sync window has closed (doc 04 §3 and I-R1 are unchanged: an
--     answer still travelling inside that window is part of the paper). A sitting with no deadline of its own ends
--     when its assessment's window closes (marked WINDOW_CLOSED); with neither it ends when its assignment ends, as
--     akhiri_penugasan already does. Only a sitting this rule expired is scored by it: an EXPIRED sitting from before
--     this migration carries no marking and is never touched. A held sitting is skipped.
--     NO SCHEDULER IS ENABLED HERE: this migration builds the entry point only, and whatever schedules it is a
--     separate decision (pg_cron's own grants and tables do not fit the recovery suite's proven profile as it stands).
--     The lazy path keeps working without a job.
-- (5) A HELD («frozen») SITTING (O41-17): its own recorded state on the sitting, never PAUSED (the learner's own).
--     tangguhkan_akun writes it in its own transaction for every open sitting of the person, at every school: since
--     when, why, and the remaining time. While held, an answer, a hand-in and an extension are refused, and the ending
--     rule skips it. Lifting the suspension changes nothing. The class's teacher then resumes it (lanjutkan_pengerjaan:
--     the deadline becomes now plus the stored remaining time, no more; a closed window does not block it) or closes
--     it (tutup_pengerjaan_ditahan: not counted, as an administrative ending).
-- (6) ANOTHER ATTEMPT (O41-16): minta_percobaan records the teacher's request and grants nothing. putuskan_percobaan
--     is a holder of CAN_REVIEW_INTEGRITY over the sitting's place: never the requester, never the learner, never a
--     SYSTEM_ADMIN. An approval lets the learner start one more sitting, marked with the request that granted it;
--     nothing earlier is touched.
-- (7) THE WINDOW, ubah_jadwal_penugasan(assignment, from, until, reason): audited with before and after; a sitting
--     already open keeps the deadline it was given; an ended or withdrawn assignment is never reopened.
-- (8) THE READS: daftar_pengerjaan (the teacher's list for one class and one instrument), percobaan_antrean (the
--     approver's queue), pengerjaan_saya (the learner's own sitting: how it ended, never why).
-- Refusals are PR170 with the code in DETAIL (pengerjaan_tolak). Every act writes an audit row.
-- ---------------------------------------------------------------------------

create or replace function public.pengerjaan_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR170',
    detail  = p_code,
    message = case p_code
      when 'SITTING_NOT_ALLOWED'          then 'managing a sitting requires CAN_MANAGE_SITTINGS over the class (or Angkatan) it was given in'
      when 'SITTING_PROFESSIONAL'         then 'this act is not offered on a professional-learning sitting'
      when 'SITTING_REASON_REQUIRED'      then 'the reason is 10 to 300 characters'
      when 'SITTING_NOTE_TOO_LONG'        then 'the note is at most 300 characters'
      when 'SITTING_ALREADY_ENDED'        then 'the sitting ended before this change was saved'
      when 'SITTING_FROZEN'               then 'the sitting is held; it is resumed or closed by its class''s teacher'
      when 'SITTING_NOT_FROZEN'           then 'the sitting is not held'
      when 'SITTING_LEARNER_SUSPENDED'    then 'a held sitting is resumed or closed once its learner''s account is active again'
      when 'SITTING_END_KIND_INVALID'     then 'a sitting is ended scored (SCORED) or not counted (NOT_COUNTED)'
      when 'SITTING_MINUTES_INVALID'      then 'extra time is 1 to 120 minutes'
      when 'SITTING_EXTEND_LIMIT'         then 'this sitting has already been given extra time three times'
      when 'SITTING_NO_DEADLINE'          then 'this sitting has no deadline to extend'
      when 'ATTEMPT_NOT_LIMITED'          then 'this assessment has no attempt limit, so nothing is requested'
      when 'ATTEMPT_SITTING_OPEN'         then 'another attempt is not requested while a sitting is open'
      when 'ATTEMPT_NOT_NEEDED'           then 'the learner can still start this assessment'
      when 'ATTEMPT_REQUEST_OPEN'         then 'a request for this learner and assessment is already waiting'
      when 'ATTEMPT_DECISION_NOT_ALLOWED' then 'a request is decided by a holder of CAN_REVIEW_INTEGRITY over the class it concerns, never a platform admin'
      when 'ATTEMPT_OWN_REQUEST'          then 'nobody decides their own request'
      when 'ATTEMPT_ALREADY_DECIDED'      then 'this request has already been decided'
      when 'ATTEMPT_REASON_REQUIRED'      then 'declining records why, in 10 to 300 characters'
      when 'WINDOW_NOT_ALLOWED'           then 'changing an assignment''s window requires CAN_ASSIGN_LEARNING over the class it was given to'
      when 'WINDOW_ASSIGNMENT_ENDED'      then 'an ended or withdrawn assignment is not reopened'
      when 'WINDOW_INVALID'               then 'the window opens at a given time and closes later, after now'
      when 'WINDOW_UNCHANGED'             then 'the window is already as given'
      when 'WINDOW_NOT_CHANGEABLE'        then 'this assignment''s window cannot be changed now'
      when 'SITTING_JOB_NOT_SERVICE'      then 'this is the scheduler''s entry point, not a signed-in one'
      else 'the sitting could not be changed' end;
end $$;
revoke all on function public.pengerjaan_tolak(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (1) the capability
-- 20260926100000's map with CAN_MANAGE_SITTINGS added to the three school roles that teach or run a school. Not the
-- platform admin's and not a dean's.
CREATE OR REPLACE FUNCTION public.role_capabilities(r app_role)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select case r
    when 'SYSTEM_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT','CAN_PROVISION_PEOPLE']
    -- PROVISIONING IS INSTITUTIONAL ADMINISTRATION, which is this role's job.
    when 'INSTITUTION_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_PROVISION_PEOPLE','CAN_MANAGE_SITTINGS']
    -- NOT HERE. WP4 calls a head of department Management; Management is
    -- academic judgement and provisioning is not, so neither they nor a dean
    -- gains it by being senior.
    when 'HEAD_OF_DEPARTMENT' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_REVIEW_QUESTION_HEALTH','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT','CAN_MANAGE_SITTINGS']
    when 'EDUCATOR' then array['CAN_DRAFT','CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT',
      'CAN_VIEW_LEARNER_ROSTER','CAN_VIEW_LEARNER_RESULT','CAN_MANAGE_SITTINGS']
    when 'DEAN' then array['CAN_VIEW_LEARNER_ROSTER']
    when 'STUDENT' then array[]::text[]
  end
$function$;
revoke all on function public.role_capabilities(app_role) from public, anon, authenticated;
grant execute on function public.role_capabilities(app_role) to authenticated;

-- ═══════════════════════════════════════════════════════════ what a sitting records
-- Operational state, never provenance (enforce_session_provenance names its columns and none of these is one). No
-- client role is granted any of them: a learner is told how a sitting ended through pengerjaan_saya, never why.
alter table public.assessment_sessions
  add column closure_kind             text,
  add column closure_at               timestamptz,
  add column closure_deadline         timestamptz,
  add column closure_by_person_id     uuid references public.persons(id),
  add column closure_reason           text,
  add column frozen_at                timestamptz,
  add column frozen_cause             text,
  add column frozen_suspension_id     uuid references public.person_suspensions(id),
  add column frozen_remaining_seconds integer,
  add column unfrozen_at              timestamptz,
  add column unfrozen_by_person_id    uuid references public.persons(id),
  add column attempt_request_id       uuid,
  add constraint assessment_sessions_closure_kind_check
    check (closure_kind in ('DEADLINE', 'WINDOW_CLOSED', 'TEACHER_SCORED', 'TEACHER_NOT_COUNTED')),
  add constraint assessment_sessions_closure_shape
    check ((closure_kind is null and closure_at is null and closure_deadline is null and closure_by_person_id is null and closure_reason is null)
        or (closure_kind in ('DEADLINE', 'WINDOW_CLOSED') and closure_at is not null and closure_deadline is not null
            and closure_by_person_id is null and closure_reason is null)
        or (closure_kind in ('TEACHER_SCORED', 'TEACHER_NOT_COUNTED') and closure_at is not null and closure_deadline is null
            and closure_by_person_id is not null and char_length(btrim(closure_reason)) between 10 and 300)),
  add constraint assessment_sessions_frozen_cause_check check (frozen_cause in ('ACCOUNT_SUSPENDED')),
  add constraint assessment_sessions_frozen_shape
    check ((frozen_at is null and frozen_cause is null and frozen_suspension_id is null and frozen_remaining_seconds is null
            and unfrozen_at is null and unfrozen_by_person_id is null)
        or (frozen_at is not null and frozen_cause is not null
            and (frozen_remaining_seconds is null or frozen_remaining_seconds >= 0)
            and (unfrozen_at is null) = (unfrozen_by_person_id is null)));
create index assessment_sessions_open_deadline_idx on public.assessment_sessions (authoritative_deadline)
  where status in ('CREATED', 'IN_PROGRESS', 'PAUSED');
create index assessment_sessions_deadline_unscored_idx on public.assessment_sessions (closure_at)
  where status = 'EXPIRED' and closure_kind is not null;

-- ═══════════════════════════════════════════════════════════ (6) a request for another attempt
create table public.attempt_requests (
  id                       uuid primary key default gen_random_uuid(),
  institution_id           uuid not null references public.institutions(id),
  person_id                uuid not null references public.persons(id),
  assessment_assignment_id uuid not null references public.assessment_assignments(id),
  session_id               uuid not null references public.assessment_sessions(id),
  requested_by_person_id   uuid not null references public.persons(id),
  requested_at             timestamptz not null default now(),
  reason                   text not null check (char_length(btrim(reason)) between 10 and 300),
  status                   text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'DECLINED')),
  decided_by_person_id     uuid references public.persons(id),
  decided_at               timestamptz,
  decision_reason          text check (decision_reason is null or char_length(btrim(decision_reason)) <= 300),
  constraint attempt_requests_decision_shape
    check ((status = 'PENDING' and decided_by_person_id is null and decided_at is null and decision_reason is null)
        or (status = 'APPROVED' and decided_by_person_id is not null and decided_at is not null)
        or (status = 'DECLINED' and decided_by_person_id is not null and decided_at is not null
            and char_length(btrim(decision_reason)) >= 10)),
  -- independent approval, in the row itself: never the requester, never the learner
  constraint attempt_requests_independent
    check (decided_by_person_id is null or (decided_by_person_id <> requested_by_person_id and decided_by_person_id <> person_id)),
  constraint attempt_requests_not_the_learner check (requested_by_person_id <> person_id)
);
create unique index attempt_requests_one_pending on public.attempt_requests (person_id, assessment_assignment_id) where status = 'PENDING';
create index attempt_requests_institution_idx on public.attempt_requests (institution_id, status);
alter table public.attempt_requests enable row level security;
revoke all on table public.attempt_requests from public, anon, authenticated;
insert into public.record_class_registry values
  ('attempt_requests', 'INSTITUTION_SCOPED',
   'A1: a teacher''s request for another attempt and its independent decision; read through functions only, never a learner''s');
create trigger attempt_requests_tenant_immutable before update on public.attempt_requests
  for each row execute function public.enforce_record_tenant_immutable();
alter table public.assessment_sessions
  add constraint assessment_sessions_attempt_request_fkey foreign key (attempt_request_id) references public.attempt_requests(id);

-- A request is decided once and is otherwise never rewritten or deleted.
create or replace function public.attempt_requests_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then raise exception 'a request for another attempt is kept, never deleted'; end if;
  if old.status <> 'PENDING' then raise exception 'a decided request is not rewritten'; end if;
  if (to_jsonb(new) - 'status' - 'decided_by_person_id' - 'decided_at' - 'decision_reason')
     is distinct from (to_jsonb(old) - 'status' - 'decided_by_person_id' - 'decided_at' - 'decision_reason') then
    raise exception 'only the decision of a request is written after it was made';
  end if;
  return new;
end $$;
revoke all on function public.attempt_requests_guard() from public, anon, authenticated;
create trigger attempt_requests_guard before update or delete on public.attempt_requests
  for each row execute function public.attempt_requests_guard();

-- ═══════════════════════════════════════════════════════════ the sitting's own state, guarded where it is written
-- Whatever function writes them: how a sitting ended is written once; the request that granted a sitting is written
-- once; and a held sitting neither moves on (it can only be ended as TERMINATED by the school's own acts) nor has its
-- deadline changed. So a path added later cannot hand in, expire, score or extend a held sitting.
create or replace function public.pengerjaan_jaga() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if old.closure_kind is not null
     and (new.closure_kind is distinct from old.closure_kind or new.closure_at is distinct from old.closure_at
          or new.closure_deadline is distinct from old.closure_deadline
          or new.closure_by_person_id is distinct from old.closure_by_person_id
          or new.closure_reason is distinct from old.closure_reason) then
    raise exception 'how a sitting ended is recorded once';
  end if;
  if old.attempt_request_id is not null and new.attempt_request_id is distinct from old.attempt_request_id then
    raise exception 'the request that granted a sitting is recorded once';
  end if;
  if old.frozen_at is not null and old.unfrozen_at is null and new.frozen_at is not null and new.unfrozen_at is null then
    if new.status is distinct from old.status and new.status <> 'TERMINATED' then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
    if new.authoritative_deadline is distinct from old.authoritative_deadline then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
    if new.frozen_at is distinct from old.frozen_at or new.frozen_cause is distinct from old.frozen_cause
       or new.frozen_suspension_id is distinct from old.frozen_suspension_id
       or new.frozen_remaining_seconds is distinct from old.frozen_remaining_seconds then
      raise exception 'what a held sitting recorded when it was held is not rewritten';
    end if;
  end if;
  if new.frozen_at is not null and new.unfrozen_at is null and (old.frozen_at is null or old.unfrozen_at is not null)
     and old.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
    raise exception 'only an open sitting is held';
  end if;
  return new;
end $$;
revoke all on function public.pengerjaan_jaga() from public, anon, authenticated;
create trigger assessment_sessions_a1_state before update on public.assessment_sessions
  for each row execute function public.pengerjaan_jaga();

-- ═══════════════════════════════════════════════════════════ small questions every act asks
create or replace function public.pengerjaan_ditahan(s public.assessment_sessions)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select s.frozen_at is not null and s.unfrozen_at is null and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
$$;
revoke all on function public.pengerjaan_ditahan(public.assessment_sessions) from public, anon, authenticated;

-- The effective deadline: the sitting's own, else the closing time of the assessment's window as it stands now.
create or replace function public.pengerjaan_tenggat_efektif(p_session uuid)
returns timestamptz language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(s.authoritative_deadline,
                  (select aa.closes_at from public.assessment_assignments aa where aa.id = s.assessment_assignment_id))
    from public.assessment_sessions s where s.id = p_session
$$;
revoke all on function public.pengerjaan_tenggat_efektif(uuid) from public, anon, authenticated;

-- May the caller manage this ACADEMIC sitting: CAN_MANAGE_SITTINGS over its own place. Never a professional one.
create or replace function public.boleh_kelola_pengerjaan(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select not public.session_is_professional(s.id)
                          and coalesce(s.class_node_id, s.cohort_node_id) is not null
                          and public.can_on_node('CAN_MANAGE_SITTINGS', coalesce(s.class_node_id, s.cohort_node_id))
                     from public.assessment_sessions s where s.id = p_session), false)
$$;
revoke all on function public.boleh_kelola_pengerjaan(uuid) from public, anon, authenticated;

-- The sittings that count against an attempt limit, as may_start_assessment counts them (20270113140000): the same
-- assessment under any assignment, within one school and one school year; an ending by the school's own act excused.
create or replace function public.percobaan_terpakai(p_person uuid, p_assessment_assignment uuid)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select count(*)::integer
    from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
    join public.assessment_sessions s
      on s.person_id = p_person
     and (s.assessment_assignment_id = aa.id
          or (s.assessment_definition_id = d.id and s.assessment_definition_version = d.version
              and s.institution_id = aa.institution_id
              and exists (select 1 from public.assessment_assignments a2 where a2.id = s.assessment_assignment_id
                            and a2.academic_period_id is not distinct from aa.academic_period_id)))
     and coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION')
   where aa.id = p_assessment_assignment
$$;
revoke all on function public.percobaan_terpakai(uuid, uuid) from public, anon, authenticated;

-- How many further attempts an independent approval has granted this learner on this assessment assignment.
create or replace function public.percobaan_izin_jumlah(p_person uuid, p_assessment_assignment uuid)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select count(*)::integer from public.attempt_requests r
   where r.person_id = p_person and r.assessment_assignment_id = p_assessment_assignment and r.status = 'APPROVED'
$$;
revoke all on function public.percobaan_izin_jumlah(uuid, uuid) from public, anon, authenticated;

-- A sitting started beyond the ordinary limit is marked with the approved request that granted it.
create or replace function public.percobaan_tandai(p_session uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_batas integer; v_req uuid;
begin
  select * into s from public.assessment_sessions where id = p_session;
  if s.id is null or s.assessment_assignment_id is null or s.attempt_request_id is not null then return; end if;
  select d.attempt_limit into v_batas from public.assessment_definitions d where d.id = s.assessment_definition_id;
  if v_batas is null or public.percobaan_terpakai(s.person_id, s.assessment_assignment_id) <= v_batas then return; end if;
  select r.id into v_req from public.attempt_requests r
   where r.person_id = s.person_id and r.assessment_assignment_id = s.assessment_assignment_id and r.status = 'APPROVED'
   order by (exists (select 1 from public.assessment_sessions x where x.attempt_request_id = r.id
                       and coalesce(x.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION'))),
            r.decided_at, r.id
   limit 1;
  if v_req is not null then
    update public.assessment_sessions set attempt_request_id = v_req where id = p_session;
  end if;
end $$;
revoke all on function public.percobaan_tandai(uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (4) THE ONE FUNCTION THAT DECIDES A DEADLINE ENDING
-- Called by the lazy check and by the scheduled entry point, and by nothing else that decides. Under the sitting's row
-- lock:
--   * a held sitting is skipped;
--   * an open sitting whose effective deadline has passed ends: EXPIRED, marked DEADLINE (its own deadline) or
--     WINDOW_CLOSED (it had none and its assessment's window closed), with the deadline it ended at; audited;
--   * with p_nilai, a sitting THIS RULE expired is scored by finalize_session on the answers recorded, once the
--     definition's late-sync window has closed (the learner's own verified manifest still closes it early, in
--     finalize_session, as before). A scoring failure leaves it EXPIRED and marked, to be scored on the next call.
-- An EXPIRED sitting with no marking (every expiry before this migration) is returned as it is.
create or replace function public.pengerjaan_putus_tenggat(p_session uuid, p_nilai boolean)
returns public.session_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.assessment_sessions; v_tenggat timestamptz; v_jenis text; v_grace integer; v_kept integer;
begin
  select * into v from public.assessment_sessions where id = p_session for update;
  if v.id is null then raise exception 'unknown session %', p_session; end if;
  if public.pengerjaan_ditahan(v) then return v.status; end if;

  if v.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
    v_tenggat := v.authoritative_deadline; v_jenis := 'DEADLINE';
    if v_tenggat is null then
      select aa.closes_at into v_tenggat from public.assessment_assignments aa where aa.id = v.assessment_assignment_id;
      v_jenis := 'WINDOW_CLOSED';
    end if;
    if v_tenggat is null or now() < v_tenggat then return v.status; end if;
    select count(*) into v_kept from public.responses r where r.session_id = p_session;
    update public.assessment_sessions
       set status = 'EXPIRED', closure_kind = v_jenis, closure_at = now(), closure_deadline = v_tenggat
     where id = p_session;
    perform public.audit_write('assessment_session.ended_by_deadline', 'assessment_sessions', p_session::text, v.institution_id,
      jsonb_build_object('session_id', p_session, 'kind', v_jenis, 'deadline', v_tenggat,
                         'from', jsonb_build_object('status', v.status), 'to', jsonb_build_object('status', 'EXPIRED'),
                         'responses_retained', v_kept,
                         'noticed_by', case when public.current_person_id() is null then 'schedule' else 'request' end));
    select * into v from public.assessment_sessions where id = p_session;
  end if;

  if p_nilai and v.status = 'EXPIRED' and v.closure_kind in ('DEADLINE', 'WINDOW_CLOSED')
     and not exists (select 1 from public.assessment_results r where r.session_id = p_session) then
    if v.authoritative_deadline is not null then
      select coalesce(d.late_sync_grace_seconds, 0) into v_grace
        from public.assessment_definitions d where d.id = v.assessment_definition_id;
      if now() <= v.authoritative_deadline + make_interval(secs => v_grace) then return v.status; end if;
    end if;
    begin
      perform public.finalize_session(p_session);
      return 'FINALIZED';
    exception when others then
      raise warning 'A1: sitting % ended by its deadline and could not be scored yet: % (%)', p_session, sqlerrm, sqlstate;
      return 'EXPIRED';
    end;
  end if;
  return v.status;
end $$;
revoke all on function public.pengerjaan_putus_tenggat(uuid, boolean) from public, anon, authenticated;

-- The lazy check: the same decision, asked when a sitting is next touched.
create or replace function public.session_enforce_deadline(p_session uuid)
returns public.session_status
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return public.pengerjaan_putus_tenggat(p_session, true);
end $$;
revoke all on function public.session_enforce_deadline(uuid) from public, anon, authenticated;

-- finalize_session asked the lazy check before scoring; it now asks the decision without its scoring half (it is the
-- scoring half). Every other line is as 20261129100000 left it.
do $$
declare v_def text := pg_get_functiondef('public.finalize_session(uuid)'::regprocedure);
        v_old text := 'perform public.session_enforce_deadline(p_session);';
begin
  if position(v_old in v_def) = 0 then raise exception 'A1: finalize_session no longer asks the deadline where it did'; end if;
  execute replace(v_def, v_old, 'perform public.pengerjaan_putus_tenggat(p_session, false);');
end $$;

-- The scheduled entry point. Service level only (no signed-in actor, as operator_found_school): a scheduler calls it
-- every few minutes. It asks the one function about every open sitting whose effective deadline has passed and every
-- sitting that rule expired and has not scored yet; one sitting's failure never stops the rest.
create or replace function public.pengerjaan_tutup_terjadwal(p_batas integer default 500)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_claims jsonb; v_role text; s record; v_st public.session_status; v_periksa int := 0; v_nilai int := 0;
        v_tunggu int := 0; v_gagal jsonb := '[]'::jsonb;
begin
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or auth.uid() is not null or (v_role is not null and v_role <> 'service_role') then
    perform public.pengerjaan_tolak('SITTING_JOB_NOT_SERVICE');
  end if;
  for s in
    select a.id
      from public.assessment_sessions a
     where (a.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
            and not (a.frozen_at is not null and a.unfrozen_at is null)
            and coalesce(a.authoritative_deadline,
                         (select aa.closes_at from public.assessment_assignments aa where aa.id = a.assessment_assignment_id)) <= now())
        or (a.status = 'EXPIRED' and a.closure_kind in ('DEADLINE', 'WINDOW_CLOSED')
            and not exists (select 1 from public.assessment_results r where r.session_id = a.id))
     order by a.created_at, a.id
     limit greatest(1, least(coalesce(p_batas, 500), 5000))
  loop
    v_periksa := v_periksa + 1;
    begin
      v_st := public.pengerjaan_putus_tenggat(s.id, true);
      if v_st = 'FINALIZED' then v_nilai := v_nilai + 1; elsif v_st = 'EXPIRED' then v_tunggu := v_tunggu + 1; end if;
    exception when others then
      v_gagal := v_gagal || jsonb_build_object('session_id', s.id, 'sqlstate', sqlstate, 'message', left(sqlerrm, 200));
    end;
  end loop;
  return jsonb_build_object('ok', true, 'diperiksa', v_periksa, 'dinilai', v_nilai, 'menunggu', v_tunggu, 'gagal', v_gagal);
end $$;
revoke all on function public.pengerjaan_tutup_terjadwal(integer) from public, anon, authenticated;
grant execute on function public.pengerjaan_tutup_terjadwal(integer) to service_role;

-- ═══════════════════════════════════════════════════════════ the learner's side
-- What a learner's own acts are answered on a sitting that is held or that the teacher ended. Only the learner is told:
-- anyone else falls through to the function's own ownership refusal.
--   held                  PR170 SITTING_FROZEN, for an answer, a hand-in and the learner's own pause or resume
--   ended, scored         an answer: PR002 SESSION_ENDED_SCORED (a hand-in is answered with the result, as any finished sitting)
--   ended, not counted    an answer: PR002 SESSION_ENDED_NOT_COUNTED; a hand-in: PR003 SESSION_ENDED_NOT_COUNTED
-- A sitting ended with its assignment keeps 4.0's answers (PR002; PR003 SESSION_ENDED_BY_SCHOOL), unchanged.
create or replace function public.pengerjaan_gerbang(p_session uuid, p_untuk text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions;
begin
  select * into s from public.assessment_sessions where id = p_session;
  if s.id is null or s.person_id is distinct from public.current_person_id() then return; end if;
  if public.pengerjaan_ditahan(s) then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
  if s.closure_kind = 'TEACHER_NOT_COUNTED' and p_untuk in ('ANSWER', 'SUBMIT') then
    raise exception using errcode = case p_untuk when 'SUBMIT' then 'PR003' else 'PR002' end,
      detail = 'SESSION_ENDED_NOT_COUNTED', message = 'this session was ended by the teacher and is not counted';
  end if;
  if s.closure_kind = 'TEACHER_SCORED' and p_untuk = 'ANSWER' then
    raise exception using errcode = 'PR002', detail = 'SESSION_ENDED_SCORED',
      message = 'this session was handed in by the teacher and accepts no further answers';
  end if;
end $$;
revoke all on function public.pengerjaan_gerbang(uuid, text) from public, anon, authenticated;

do $$
declare v_def text; v_old text;
begin
  -- an answer
  v_def := pg_get_functiondef((select p.oid from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'record_answer'));
  v_old := 'if v_session is null then raise exception ''unknown presented item %'', p_presented_item; end if;';
  if position(v_old in v_def) = 0 then raise exception 'A1: record_answer no longer resolves its sitting where it did'; end if;
  execute replace(v_def, v_old, v_old || E'\n  perform public.pengerjaan_gerbang(v_session, ''ANSWER'');   -- A1');
  -- a hand-in
  v_def := pg_get_functiondef('public.submit_session(uuid)'::regprocedure);
  v_old := 'v_status := public.session_enforce_deadline(p_session);';
  if position(v_old in v_def) = 0 then raise exception 'A1: submit_session no longer asks the deadline where it did'; end if;
  execute replace(v_def, v_old, E'perform public.pengerjaan_gerbang(p_session, ''SUBMIT'');   -- A1\n  ' || v_old);
  -- the learner's own pause and resume
  v_old := 'select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(p_session) c;';
  v_def := pg_get_functiondef('public.pause_session(uuid)'::regprocedure);
  if position(v_old in v_def) = 0 then raise exception 'A1: pause_session is not where it was'; end if;
  execute replace(v_def, v_old, E'perform public.pengerjaan_gerbang(p_session, ''PAUSE'');   -- A1\n  ' || v_old);
  v_def := pg_get_functiondef('public.resume_session(uuid)'::regprocedure);
  if position(v_old in v_def) = 0 then raise exception 'A1: resume_session is not where it was'; end if;
  execute replace(v_def, v_old, E'perform public.pengerjaan_gerbang(p_session, ''PAUSE'');   -- A1\n  ' || v_old);
end $$;

-- The receipt itself: whatever path writes a response, a held sitting accepts none. Every other line is 20260914094500's.
create or replace function public.enforce_response_write()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_session uuid; v_inst uuid; v_s public.assessment_sessions;
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

  select * into v_s from public.assessment_sessions s where s.id = v_session;
  if v_s.status in ('FINALIZED','TERMINATED') then
    raise exception 'the session is % and accepts no further responses', v_s.status
      using errcode = 'PR002';
  end if;
  -- A1 (O41-17): a held sitting records nothing
  if public.pengerjaan_ditahan(v_s) then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;

  new.value_digest := public.content_digest(new.value::text);
  return new;
end $$;
revoke all on function public.enforce_response_write() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (2) extra time
-- 20270112150000's function with A1's four changes, each marked: the named capability decides (a professional sitting
-- stays the platform's, through boleh_atas_sesi); a sitting past its effective deadline has ended and is not revived;
-- a held sitting is not extended; and extra time is added to the effective deadline, so a sitting timed by its window
-- alone gains time instead of being cut short at «now».
create or replace function public.extend_session_deadline(p_session uuid, p_minutes integer, p_reason text)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_s public.assessment_sessions; v_old timestamptz; v_new timestamptz;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;
  select * into v_s from public.assessment_sessions where id = p_session;
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
end $$;
revoke all on function public.extend_session_deadline(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.extend_session_deadline(uuid, integer, text) to authenticated;

-- The screens' entry: the same act, every refusal a designed code.
create or replace function public.tambah_waktu_pengerjaan(p_session uuid, p_menit integer, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); s public.assessment_sessions; v_alasan text := btrim(coalesce(p_alasan, ''));
        v_lama timestamptz; v_baru timestamptz;
begin
  select * into s from public.assessment_sessions where id = p_session for update;
  if v_actor is null or s.id is null or not public.boleh_atas_sesi(s.id, 'CAN_MANAGE_SITTINGS') then
    perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED');
  end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.pengerjaan_tolak('SITTING_REASON_REQUIRED'); end if;
  if p_menit is null or p_menit < 1 or p_menit > 120 then perform public.pengerjaan_tolak('SITTING_MINUTES_INVALID'); end if;
  perform public.pengerjaan_putus_tenggat(p_session, true);
  select * into s from public.assessment_sessions where id = p_session;
  if s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then perform public.pengerjaan_tolak('SITTING_ALREADY_ENDED'); end if;
  if public.pengerjaan_ditahan(s) then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
  if s.deadline_extended_count >= 3 then perform public.pengerjaan_tolak('SITTING_EXTEND_LIMIT'); end if;
  v_lama := public.pengerjaan_tenggat_efektif(p_session);
  if v_lama is null then perform public.pengerjaan_tolak('SITTING_NO_DEADLINE'); end if;
  v_baru := public.extend_session_deadline(p_session, p_menit, v_alasan);
  return jsonb_build_object('ok', true, 'tenggat_lama', v_lama, 'tenggat_baru', v_baru);
end $$;
revoke all on function public.tambah_waktu_pengerjaan(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.tambah_waktu_pengerjaan(uuid, integer, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (3) the teacher ends one sitting
create or replace function public.akhiri_pengerjaan(p_session uuid, p_cara text, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); s public.assessment_sessions; v_alasan text := btrim(coalesce(p_alasan, ''));
        v_dari public.session_status; v_kept integer; v_jawab integer; v_hasil uuid;
begin
  select * into s from public.assessment_sessions where id = p_session for update;
  if v_actor is null or s.id is null then perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED'); end if;
  if public.session_is_professional(s.id) then
    perform public.pengerjaan_tolak(case when public.is_system_admin() then 'SITTING_PROFESSIONAL' else 'SITTING_NOT_ALLOWED' end);
  end if;
  if not public.boleh_kelola_pengerjaan(s.id) then perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED'); end if;
  if p_cara is null or p_cara not in ('SCORED', 'NOT_COUNTED') then perform public.pengerjaan_tolak('SITTING_END_KIND_INVALID'); end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.pengerjaan_tolak('SITTING_REASON_REQUIRED'); end if;

  -- a sitting past its deadline has ended by it; the teacher's choice does not replace that ending
  perform public.pengerjaan_putus_tenggat(p_session, true);
  select * into s from public.assessment_sessions where id = p_session;
  if s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then perform public.pengerjaan_tolak('SITTING_ALREADY_ENDED'); end if;
  if public.pengerjaan_ditahan(s) then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
  v_dari := s.status;
  select count(*), count(distinct r.presented_item_id) into v_kept, v_jawab from public.responses r where r.session_id = p_session;

  if p_cara = 'SCORED' then
    -- a hand-in on the learner's behalf: the learner's own path (CREATED or PAUSED, then IN_PROGRESS, then SUBMITTED),
    -- then the existing scoring. The teacher and the reason are recorded with the hand-in.
    if s.status in ('CREATED', 'PAUSED') then
      update public.assessment_sessions set status = 'IN_PROGRESS' where id = p_session;
    end if;
    update public.assessment_sessions
       set status = 'SUBMITTED', closure_kind = 'TEACHER_SCORED', closure_at = now(),
           closure_by_person_id = v_actor, closure_reason = v_alasan
     where id = p_session;
    v_hasil := public.finalize_session(p_session);
    perform public.audit_write('assessment_session.handed_in_by_teacher', 'assessment_sessions', p_session::text, s.institution_id,
      jsonb_build_object('session_id', p_session, 'reason', v_alasan, 'actor', v_actor,
                         'from', jsonb_build_object('status', v_dari), 'to', jsonb_build_object('status', 'FINALIZED'),
                         'result_id', v_hasil, 'responses_retained', v_kept, 'items_answered', v_jawab, 'counted', true));
    return jsonb_build_object('ok', true, 'status', 'FINALIZED', 'cara', 'SCORED', 'dihitung', true);
  end if;

  update public.assessment_sessions
     set status = 'TERMINATED', termination_cause = 'ADMINISTRATIVE_TERMINATION',
         termination_reason = v_alasan, terminated_by_person_id = v_actor,
         closure_kind = 'TEACHER_NOT_COUNTED', closure_at = now(), closure_by_person_id = v_actor, closure_reason = v_alasan
   where id = p_session;
  perform public.audit_write('assessment_session.terminated', 'assessment_sessions', p_session::text, s.institution_id,
    jsonb_build_object('session_id', p_session, 'cause', 'ADMINISTRATIVE_TERMINATION', 'reason', v_alasan, 'actor', v_actor,
                       'act', 'teacher_not_counted', 'from', jsonb_build_object('status', v_dari),
                       'to', jsonb_build_object('status', 'TERMINATED'), 'responses_retained', v_kept, 'counted', false));
  return jsonb_build_object('ok', true, 'status', 'TERMINATED', 'cara', 'NOT_COUNTED', 'dihitung', false);
end $$;
revoke all on function public.akhiri_pengerjaan(uuid, text, text) from public, anon, authenticated;
grant execute on function public.akhiri_pengerjaan(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (5) a held sitting
-- Every open sitting of one person, at every school, held now. A sitting whose deadline has already passed ends by it
-- first and is not held. The remaining time is whole seconds, rounded down, so a resume never gains time.
create or replace function public.pengerjaan_tahan_orang(p_person uuid, p_suspension uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare s record; v public.assessment_sessions; v_tenggat timestamptz; v_sisa integer; n integer := 0;
begin
  for s in select a.id from public.assessment_sessions a
            where a.person_id = p_person and a.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
              and not (a.frozen_at is not null and a.unfrozen_at is null)
            order by a.id for update loop
    if public.pengerjaan_putus_tenggat(s.id, true) not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then continue; end if;
    select * into v from public.assessment_sessions where id = s.id;
    v_tenggat := public.pengerjaan_tenggat_efektif(s.id);
    v_sisa := case when v_tenggat is null then null else greatest(0, floor(extract(epoch from (v_tenggat - now())))::integer) end;
    update public.assessment_sessions
       set frozen_at = now(), frozen_cause = 'ACCOUNT_SUSPENDED', frozen_suspension_id = p_suspension,
           frozen_remaining_seconds = v_sisa, unfrozen_at = null, unfrozen_by_person_id = null
     where id = s.id;
    perform public.audit_write('assessment_session.frozen', 'assessment_sessions', s.id::text, v.institution_id,
      jsonb_build_object('session_id', s.id, 'cause', 'ACCOUNT_SUSPENDED', 'suspension_id', p_suspension,
                         'status', v.status, 'deadline', v_tenggat, 'remaining_seconds', v_sisa,
                         'from', jsonb_build_object('frozen', false), 'to', jsonb_build_object('frozen', true)));
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.pengerjaan_tahan_orang(uuid, uuid) from public, anon, authenticated;

-- 20270113130000's suspension with one addition, marked A1: the person's open sittings are held in this transaction.
create or replace function public.tangguhkan_akun(p_person uuid, p_kategori text, p_catatan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); v_note text := nullif(btrim(coalesce(p_catatan, '')), ''); v_n int;
        v_id uuid; v_ditahan int;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  if p_person = v_actor then perform public.akun_tolak('ACCOUNT_SELF'); end if;
  perform 1 from public.persons where id = p_person for update;
  if not found then perform public.akun_tolak('ACCOUNT_UNKNOWN'); end if;
  if p_kategori is null or p_kategori not in ('SECURITY', 'ADMINISTRATIVE', 'OTHER') then
    perform public.akun_tolak('ACCOUNT_CATEGORY_INVALID');
  end if;
  if (p_kategori = 'OTHER' and (v_note is null or char_length(v_note) < 10)) or char_length(coalesce(v_note, '')) > 300 then
    perform public.akun_tolak('ACCOUNT_NOTE_REQUIRED');
  end if;
  if public.orang_ditangguhkan(p_person) then perform public.akun_tolak('ACCOUNT_ALREADY_SUSPENDED'); end if;
  insert into public.person_suspensions (person_id, category, note, started_by) values (p_person, p_kategori, v_note, v_actor)
  returning id into v_id;
  v_n := public.akun_kunci(p_person, true);
  -- A1 (O41-17): access to every open sitting of this person is frozen at once, with the time each had left
  v_ditahan := public.pengerjaan_tahan_orang(p_person, v_id);
  perform public.audit_write('account.suspended', 'persons', p_person::text, null,
    jsonb_build_object('person_id', p_person, 'reason_code', p_kategori, 'reason', v_note, 'sessions_ended', v_n,
                       'sittings_frozen', v_ditahan, 'actor_role', public.audit_actor_role(null)));
  return jsonb_build_object('ok', true, 'sesi_diakhiri', v_n, 'pengerjaan_ditahan', v_ditahan);
end $$;
revoke all on function public.tangguhkan_akun(uuid, text, text) from public, anon, authenticated;
grant execute on function public.tangguhkan_akun(uuid, text, text) to authenticated;

-- Who resumes or closes a held sitting: the capability over its place; a professional-learning one, the platform admin.
create or replace function public.pengerjaan_ditahan_periksa(p_session uuid)
returns public.assessment_sessions language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions;
begin
  select * into s from public.assessment_sessions where id = p_session for update;
  if public.current_person_id() is null or s.id is null or not public.boleh_atas_sesi(s.id, 'CAN_MANAGE_SITTINGS') then
    perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED');
  end if;
  if s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then perform public.pengerjaan_tolak('SITTING_ALREADY_ENDED'); end if;
  if not public.pengerjaan_ditahan(s) then perform public.pengerjaan_tolak('SITTING_NOT_FROZEN'); end if;
  -- nothing resumes, and nothing is closed, while the account is still suspended
  if public.orang_ditangguhkan(s.person_id) then perform public.pengerjaan_tolak('SITTING_LEARNER_SUSPENDED'); end if;
  return s;
end $$;
revoke all on function public.pengerjaan_ditahan_periksa(uuid) from public, anon, authenticated;

create or replace function public.lanjutkan_pengerjaan(p_session uuid, p_catatan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); s public.assessment_sessions;
        v_catatan text := nullif(btrim(coalesce(p_catatan, '')), ''); v_baru timestamptz;
begin
  s := public.pengerjaan_ditahan_periksa(p_session);
  if char_length(coalesce(v_catatan, '')) > 300 then perform public.pengerjaan_tolak('SITTING_NOTE_TOO_LONG'); end if;
  -- the preserved remaining time, from now: no more. A sitting that had no deadline has none again.
  v_baru := case when s.frozen_remaining_seconds is null then s.authoritative_deadline
                 else now() + make_interval(secs => s.frozen_remaining_seconds) end;
  update public.assessment_sessions
     set unfrozen_at = now(), unfrozen_by_person_id = v_actor, authoritative_deadline = v_baru
   where id = p_session;
  perform public.audit_write('assessment_session.resumed', 'assessment_sessions', p_session::text, s.institution_id,
    jsonb_build_object('session_id', p_session, 'actor', v_actor, 'note', v_catatan,
                       'from', jsonb_build_object('frozen', true, 'frozen_at', s.frozen_at, 'deadline', s.authoritative_deadline,
                                                  'remaining_seconds', s.frozen_remaining_seconds),
                       'to', jsonb_build_object('frozen', false, 'deadline', v_baru)));
  return jsonb_build_object('ok', true, 'tenggat', v_baru, 'sisa_detik', s.frozen_remaining_seconds);
end $$;
revoke all on function public.lanjutkan_pengerjaan(uuid, text) from public, anon, authenticated;
grant execute on function public.lanjutkan_pengerjaan(uuid, text) to authenticated;

create or replace function public.tutup_pengerjaan_ditahan(p_session uuid, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); s public.assessment_sessions; v_alasan text := btrim(coalesce(p_alasan, ''));
        v_kept integer;
begin
  s := public.pengerjaan_ditahan_periksa(p_session);
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.pengerjaan_tolak('SITTING_REASON_REQUIRED'); end if;
  select count(*) into v_kept from public.responses r where r.session_id = p_session;
  update public.assessment_sessions
     set status = 'TERMINATED', termination_cause = 'ADMINISTRATIVE_TERMINATION',
         termination_reason = v_alasan, terminated_by_person_id = v_actor,
         closure_kind = 'TEACHER_NOT_COUNTED', closure_at = now(), closure_by_person_id = v_actor, closure_reason = v_alasan
   where id = p_session;
  perform public.audit_write('assessment_session.terminated', 'assessment_sessions', p_session::text, s.institution_id,
    jsonb_build_object('session_id', p_session, 'cause', 'ADMINISTRATIVE_TERMINATION', 'reason', v_alasan, 'actor', v_actor,
                       'act', 'frozen_closed',
                       'from', jsonb_build_object('status', s.status, 'frozen', true, 'frozen_at', s.frozen_at,
                                                  'remaining_seconds', s.frozen_remaining_seconds),
                       'to', jsonb_build_object('status', 'TERMINATED'), 'responses_retained', v_kept, 'counted', false));
  return jsonb_build_object('ok', true, 'status', 'TERMINATED', 'dihitung', false);
end $$;
revoke all on function public.tutup_pengerjaan_ditahan(uuid, text) from public, anon, authenticated;
grant execute on function public.tutup_pengerjaan_ditahan(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (6) another attempt
-- may_start_assessment's limit is raised by each approved request for this learner and assessment assignment; every
-- other line, and the lock order (20270112120000), is unchanged. start_learning_session marks the sitting it opens.
do $$
declare v_def text := pg_get_functiondef('public.may_start_assessment(uuid)'::regprocedure);
        v_old text := 'if v_attempts >= v_d.attempt_limit then';
begin
  if position(v_old in v_def) = 0 then raise exception 'A1: may_start_assessment''s attempt limit is not where it was'; end if;
  execute replace(v_def, v_old,
    '-- A1 (O41-16): one more start for each independently approved request' || E'\n    '
    || 'if v_attempts >= v_d.attempt_limit + public.percobaan_izin_jumlah(v_person, p_assessment_assignment) then');
  v_def := pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure);
  v_old := 'perform public.assemble_session(v_session);';
  if position(v_old in v_def) = 0 then raise exception 'A1: start_learning_session no longer assembles where it did'; end if;
  execute replace(v_def, v_old, E'perform public.percobaan_tandai(v_session);   -- A1 (O41-16): a granted attempt is marked\n  ' || v_old);
end $$;

create or replace function public.minta_percobaan(p_session uuid, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); s public.assessment_sessions; v_alasan text := btrim(coalesce(p_alasan, ''));
        v_batas integer; v_pakai integer; v_izin integer; v_id uuid;
begin
  select * into s from public.assessment_sessions where id = p_session for update;
  if v_actor is null or s.id is null then perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED'); end if;
  if public.session_is_professional(s.id) then
    perform public.pengerjaan_tolak(case when public.is_system_admin() then 'SITTING_PROFESSIONAL' else 'SITTING_NOT_ALLOWED' end);
  end if;
  if not public.boleh_kelola_pengerjaan(s.id) or s.person_id = v_actor then perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED'); end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.pengerjaan_tolak('SITTING_REASON_REQUIRED'); end if;
  select d.attempt_limit into v_batas from public.assessment_definitions d where d.id = s.assessment_definition_id;
  if s.assessment_assignment_id is null or v_batas is null then perform public.pengerjaan_tolak('ATTEMPT_NOT_LIMITED'); end if;
  -- one request at a time for this learner and assessment (the unique index is the last word under a race)
  perform pg_advisory_xact_lock(hashtextextended('minta_percobaan:' || s.person_id::text || ':' || s.assessment_assignment_id::text, 0));
  if exists (select 1 from public.attempt_requests r where r.person_id = s.person_id
               and r.assessment_assignment_id = s.assessment_assignment_id and r.status = 'PENDING') then
    perform public.pengerjaan_tolak('ATTEMPT_REQUEST_OPEN');
  end if;
  -- never while a sitting of this assessment is open (a held one is open): it is ended or resumed first
  perform public.pengerjaan_putus_tenggat(x.id, true) from public.assessment_sessions x
   where x.person_id = s.person_id and x.assessment_assignment_id = s.assessment_assignment_id
     and x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED');
  if exists (select 1 from public.assessment_sessions x where x.person_id = s.person_id
               and x.assessment_assignment_id = s.assessment_assignment_id and x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) then
    perform public.pengerjaan_tolak('ATTEMPT_SITTING_OPEN');
  end if;
  v_pakai := public.percobaan_terpakai(s.person_id, s.assessment_assignment_id);
  v_izin := public.percobaan_izin_jumlah(s.person_id, s.assessment_assignment_id);
  if v_pakai < v_batas + v_izin then perform public.pengerjaan_tolak('ATTEMPT_NOT_NEEDED'); end if;

  insert into public.attempt_requests (institution_id, person_id, assessment_assignment_id, session_id, requested_by_person_id, reason)
  values (s.institution_id, s.person_id, s.assessment_assignment_id, s.id, v_actor, v_alasan)
  returning id into v_id;
  perform public.audit_write('attempt_request.requested', 'attempt_requests', v_id::text, s.institution_id,
    jsonb_build_object('request_id', v_id, 'session_id', s.id, 'person_id', s.person_id,
                       'assessment_assignment_id', s.assessment_assignment_id, 'reason', v_alasan, 'actor', v_actor,
                       'attempts_used', v_pakai, 'attempt_limit', v_batas, 'attempts_granted', v_izin,
                       'from', jsonb_build_object('status', null), 'to', jsonb_build_object('status', 'PENDING')));
  return jsonb_build_object('ok', true, 'id', v_id, 'status', 'PENDING');
end $$;
revoke all on function public.minta_percobaan(uuid, text) from public, anon, authenticated;
grant execute on function public.minta_percobaan(uuid, text) to authenticated;

-- May the caller decide requests over this place: a school role's CAN_REVIEW_INTEGRITY over it, and never a platform
-- admin (an academic sitting's further attempt is the school's decision).
create or replace function public.boleh_putuskan_percobaan(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select not public.is_system_admin()
                          and not public.session_is_professional(s.id)
                          and coalesce(s.class_node_id, s.cohort_node_id) is not null
                          and public.can_on_node('CAN_REVIEW_INTEGRITY', coalesce(s.class_node_id, s.cohort_node_id))
                     from public.assessment_sessions s where s.id = p_session), false)
$$;
revoke all on function public.boleh_putuskan_percobaan(uuid) from public, anon, authenticated;

create or replace function public.putuskan_percobaan(p_permintaan uuid, p_setuju boolean, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); r public.attempt_requests;
        v_alasan text := nullif(btrim(coalesce(p_alasan, '')), ''); v_status text;
begin
  select * into r from public.attempt_requests x where x.id = p_permintaan for update;
  if v_actor is null or r.id is null then perform public.pengerjaan_tolak('ATTEMPT_DECISION_NOT_ALLOWED'); end if;
  -- never the requester, whatever else they hold; never the learner
  if r.requested_by_person_id = v_actor then perform public.pengerjaan_tolak('ATTEMPT_OWN_REQUEST'); end if;
  if r.person_id = v_actor or not public.boleh_putuskan_percobaan(r.session_id) then
    perform public.pengerjaan_tolak('ATTEMPT_DECISION_NOT_ALLOWED');
  end if;
  if r.status <> 'PENDING' then perform public.pengerjaan_tolak('ATTEMPT_ALREADY_DECIDED'); end if;
  if p_setuju is null then perform public.pengerjaan_tolak('ATTEMPT_REASON_REQUIRED'); end if;
  if (not p_setuju and char_length(coalesce(v_alasan, '')) < 10) or char_length(coalesce(v_alasan, '')) > 300 then
    perform public.pengerjaan_tolak('ATTEMPT_REASON_REQUIRED');
  end if;
  v_status := case when p_setuju then 'APPROVED' else 'DECLINED' end;
  update public.attempt_requests
     set status = v_status, decided_by_person_id = v_actor, decided_at = now(), decision_reason = v_alasan
   where id = r.id;
  perform public.audit_write(case when p_setuju then 'attempt_request.approved' else 'attempt_request.declined' end,
    'attempt_requests', r.id::text, r.institution_id,
    jsonb_build_object('request_id', r.id, 'session_id', r.session_id, 'person_id', r.person_id,
                       'assessment_assignment_id', r.assessment_assignment_id, 'requested_by', r.requested_by_person_id,
                       'reason', v_alasan, 'actor', v_actor,
                       'from', jsonb_build_object('status', 'PENDING'), 'to', jsonb_build_object('status', v_status)));
  return jsonb_build_object('ok', true, 'id', r.id, 'status', v_status);
end $$;
revoke all on function public.putuskan_percobaan(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.putuskan_percobaan(uuid, boolean, text) to authenticated;

-- The approver's queue: the waiting requests of one school over places the caller may decide. A request the caller
-- made themself is listed (milik_sendiri) and is not theirs to decide. Nobody else reads it: empty, not an error.
create or replace function public.percobaan_antrean(p_institution uuid)
returns table (id uuid, person_id uuid, nama text, kelas_id uuid, kelas text, assessment_assignment_id uuid, judul text,
               mode public.assessment_mode, diminta_oleh uuid, nama_peminta text, diminta_pada timestamptz, alasan text,
               percobaan_terpakai integer, batas_percobaan integer, milik_sendiri boolean,
               kursus text, hasil_terakhir numeric, target numeric)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if v_me is null then perform public.pengerjaan_tolak('ATTEMPT_DECISION_NOT_ALLOWED'); end if;
  return query
    select r.id, r.person_id, p.display_name, n.id, n.name, r.assessment_assignment_id, d.title, d.mode,
           r.requested_by_person_id, q.display_name, r.requested_at, r.reason,
           public.percobaan_terpakai(r.person_id, r.assessment_assignment_id), d.attempt_limit::integer,
           r.requested_by_person_id = v_me,
           (select c.title from public.plp_releases pr join public.courses c on c.id = pr.course_id where pr.id = s.plp_release_id),
           -- the last result and its target only for a reader who may see this learner's results (a head of department;
           -- a school admin decides without them: 20260924100000, an administrator is not an examiner)
           case when public.can_on_node('CAN_VIEW_LEARNER_RESULT', coalesce(s.class_node_id, s.cohort_node_id))
                then (select ar.mastery from public.assessment_results ar where ar.session_id = s.id
                       order by ar.computed_at desc, ar.id desc limit 1) end,
           case when public.can_on_node('CAN_VIEW_LEARNER_RESULT', coalesce(s.class_node_id, s.cohort_node_id)) then s.pass_mark end
      from public.attempt_requests r
      join public.assessment_sessions s on s.id = r.session_id
      join public.persons p on p.id = r.person_id
      join public.persons q on q.id = r.requested_by_person_id
      join public.assessment_definitions d on d.id = s.assessment_definition_id
      left join public.org_nodes n on n.id = coalesce(s.class_node_id, s.cohort_node_id)
     where r.institution_id = p_institution and r.status = 'PENDING'
       and public.boleh_putuskan_percobaan(r.session_id)
     order by r.requested_at, r.id;
end $$;
revoke all on function public.percobaan_antrean(uuid) from public, anon, authenticated;
grant execute on function public.percobaan_antrean(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ (7) the window
-- One lesson assignment's window and its assessments' with it, as assign_release wrote them together. Decided as
-- «Akhiri penugasan» is (CAN_ASSIGN_LEARNING over the class it was given to); never a professional-learning one here.
-- No sitting is touched: one already open keeps its own deadline, and one with no deadline of its own follows the
-- window as it now stands (the ending rule reads it when it is asked).
create or replace function public.ubah_jadwal_penugasan(p_la uuid, p_dari timestamptz, p_sampai timestamptz, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); la public.learning_assignments; v_alasan text := btrim(coalesce(p_alasan, ''));
        v_sebelum jsonb; v_sesudah jsonb; v_terbuka integer;
begin
  select * into la from public.learning_assignments x where x.id = p_la for update;
  if v_actor is null or la.id is null or public.release_is_professional(la.plp_release_id)
     or not public.can_on_node('CAN_ASSIGN_LEARNING', la.node_id) then
    perform public.pengerjaan_tolak('WINDOW_NOT_ALLOWED');
  end if;
  if la.status <> 'ACTIVE' then perform public.pengerjaan_tolak('WINDOW_ASSIGNMENT_ENDED'); end if;
  if p_dari is null or (p_sampai is not null and (p_sampai <= p_dari or p_sampai <= now())) then
    perform public.pengerjaan_tolak('WINDOW_INVALID');
  end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.pengerjaan_tolak('SITTING_REASON_REQUIRED'); end if;
  perform 1 from public.assessment_assignments aa where aa.learning_assignment_id = p_la order by aa.id for update;
  if la.available_from is not distinct from p_dari and la.available_until is not distinct from p_sampai
     and not exists (select 1 from public.assessment_assignments aa where aa.learning_assignment_id = p_la and aa.status in ('SCHEDULED', 'OPEN')
                       and (aa.opens_at is distinct from p_dari or aa.closes_at is distinct from p_sampai)) then
    perform public.pengerjaan_tolak('WINDOW_UNCHANGED');
  end if;
  v_sebelum := jsonb_build_object('available_from', la.available_from, 'available_until', la.available_until,
    'assessments', (select coalesce(jsonb_agg(jsonb_build_object('id', aa.id, 'opens_at', aa.opens_at, 'closes_at', aa.closes_at, 'status', aa.status) order by aa.id), '[]'::jsonb)
                      from public.assessment_assignments aa where aa.learning_assignment_id = p_la));
  begin
    update public.learning_assignments set available_from = p_dari, available_until = p_sampai where id = p_la;
    -- an assessment already CLOSED is left as it is: nothing here reopens anything
    update public.assessment_assignments set opens_at = p_dari, closes_at = p_sampai
     where learning_assignment_id = p_la and status in ('SCHEDULED', 'OPEN');
  exception when others then
    -- the assignment's own guards (content no longer shared with this school, a sealed pass mark) refuse in their words
    raise warning 'A1: the window of % could not be changed: % (%)', p_la, sqlerrm, sqlstate;
    perform public.pengerjaan_tolak('WINDOW_NOT_CHANGEABLE');
  end;
  v_sesudah := jsonb_build_object('available_from', p_dari, 'available_until', p_sampai,
    'assessments', (select coalesce(jsonb_agg(jsonb_build_object('id', aa.id, 'opens_at', aa.opens_at, 'closes_at', aa.closes_at, 'status', aa.status) order by aa.id), '[]'::jsonb)
                      from public.assessment_assignments aa where aa.learning_assignment_id = p_la));
  select count(*) into v_terbuka from public.penugasan_sesi(p_la) x where x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED');
  perform public.audit_write('learning_assignment.window_changed', 'learning_assignments', p_la::text, la.institution_id,
    jsonb_build_object('reason', v_alasan, 'actor', v_actor, 'node_id', la.node_id, 'from', v_sebelum, 'to', v_sesudah,
                       'open_sittings_kept', v_terbuka));
  return jsonb_build_object('ok', true, 'dari', p_dari, 'sampai', p_sampai, 'sesi_terbuka', v_terbuka);
end $$;
revoke all on function public.ubah_jadwal_penugasan(uuid, timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.ubah_jadwal_penugasan(uuid, timestamptz, timestamptz, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (8) the reads
-- The teacher's list: one row per learner of one class for one instrument (one assessment assignment), with the state
-- of that learner's LATEST sitting given in this class. No score, no rank, in the order of the names.
--   keadaan  NOT_STARTED · OPEN · FROZEN · HANDED_IN · ENDED_SCORED · ENDED_NOT_COUNTED · ENDED_BY_DEADLINE ·
--            ENDED_WITH_ASSIGNMENT (the assignment was ended or withdrawn) · ENDED_OTHER (a departure or an integrity
--            ending) · EXPIRED_UNSCORED (an expiry from before the deadline rule, never scored)
create or replace function public.daftar_pengerjaan(p_kelas uuid, p_assessment_assignment uuid)
returns table (person_id uuid, nama text, sesi_id uuid, jumlah_sesi integer, keadaan text, status public.session_status,
               mulai timestamptz, tenggat timestamptz, sisa_detik integer, diperpanjang integer,
               ditahan_sejak timestamptz, sisa_ditahan_detik integer, murid_aktif boolean,
               berakhir_pada timestamptz, dihitung boolean,
               percobaan_terpakai integer, batas_percobaan integer, percobaan_diizinkan boolean, izin_belum_dipakai boolean,
               permintaan_id uuid, permintaan_status text, permintaan_pada timestamptz, permintaan_alasan text,
               permintaan_oleh_saya boolean, keputusan_pada timestamptz, keputusan_alasan text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); aa public.assessment_assignments; v_batas integer;
begin
  select * into aa from public.assessment_assignments x where x.id = p_assessment_assignment;
  if v_me is null or aa.id is null
     or not exists (select 1 from public.org_nodes n where n.id = p_kelas and (n.id = aa.node_id or n.jalur @> array[aa.node_id]))
     or exists (select 1 from public.learning_assignments la where la.id = aa.learning_assignment_id and public.release_is_professional(la.plp_release_id))
     or not public.can_on_node('CAN_MANAGE_SITTINGS', p_kelas) then
    perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED');
  end if;
  select d.attempt_limit into v_batas from public.assessment_definitions d where d.id = aa.assessment_definition_id;
  return query
    with murid as (
      select e.person_id as pid from public.memberships m join public.enrollments e on e.id = m.enrollment_id
       where m.node_id = p_kelas and m.valid_to is null and e.status = 'ACTIVE'
      union
      select s.person_id from public.assessment_sessions s
       where s.assessment_assignment_id = aa.id and coalesce(s.class_node_id, s.cohort_node_id) = p_kelas
    )
    select m.pid, p.display_name, s.id,
           (select count(*)::integer from public.assessment_sessions x where x.person_id = m.pid and x.assessment_assignment_id = aa.id
               and coalesce(x.class_node_id, x.cohort_node_id) = p_kelas),
           case when s.id is null then 'NOT_STARTED'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and s.frozen_at is not null and s.unfrozen_at is null then 'FROZEN'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and t.tenggat is not null and t.tenggat <= now() then 'ENDED_BY_DEADLINE'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then 'OPEN'
                when s.closure_kind = 'TEACHER_SCORED' then 'ENDED_SCORED'
                when s.closure_kind = 'TEACHER_NOT_COUNTED' then 'ENDED_NOT_COUNTED'
                when s.closure_kind in ('DEADLINE', 'WINDOW_CLOSED') then 'ENDED_BY_DEADLINE'
                when s.status in ('SUBMITTED', 'FINALIZED') then 'HANDED_IN'
                when s.status = 'EXPIRED' then 'EXPIRED_UNSCORED'
                when s.status = 'TERMINATED' and s.termination_cause = 'ADMINISTRATIVE_TERMINATION' then 'ENDED_WITH_ASSIGNMENT'
                else 'ENDED_OTHER' end,
           s.status, coalesce(s.started_at, s.created_at), t.tenggat,
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and not (s.frozen_at is not null and s.unfrozen_at is null) and t.tenggat is not null
                then greatest(0, floor(extract(epoch from (t.tenggat - now())))::integer) end,
           s.deadline_extended_count::integer,
           case when s.frozen_at is not null and s.unfrozen_at is null then s.frozen_at end,
           case when s.frozen_at is not null and s.unfrozen_at is null then s.frozen_remaining_seconds end,
           not public.orang_ditangguhkan(m.pid),
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then null
                else coalesce(s.closure_at, s.finalized_at, s.submitted_at) end,
           case when s.id is null then null
                else coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION') end,
           public.percobaan_terpakai(m.pid, aa.id), v_batas,
           s.attempt_request_id is not null,
           exists (select 1 from public.attempt_requests g where g.person_id = m.pid and g.assessment_assignment_id = aa.id
                     and g.status = 'APPROVED'
                     and not exists (select 1 from public.assessment_sessions x where x.attempt_request_id = g.id)),
           q.id, q.status, q.requested_at, q.reason, q.requested_by_person_id = v_me, q.decided_at, q.decision_reason
      from murid m
      join public.persons p on p.id = m.pid
      left join lateral (select x.* from public.assessment_sessions x
                          where x.person_id = m.pid and x.assessment_assignment_id = aa.id
                            and coalesce(x.class_node_id, x.cohort_node_id) = p_kelas
                          -- the latest; at one instant, the open one, then the granted one
                          order by x.created_at desc, (x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) desc,
                                   (x.attempt_request_id is not null) desc, x.id desc limit 1) s on true
      left join lateral (select coalesce(s.authoritative_deadline, aa.closes_at) as tenggat) t on true
      left join lateral (select g.* from public.attempt_requests g
                          where g.person_id = m.pid and g.assessment_assignment_id = aa.id
                          order by g.requested_at desc, g.id desc limit 1) q on true
     order by p.display_name, m.pid;
end $$;
revoke all on function public.daftar_pengerjaan(uuid, uuid) from public, anon, authenticated;
grant execute on function public.daftar_pengerjaan(uuid, uuid) to authenticated;

-- The learner's own sitting: how it stands and how it ended, so the player can say the right notice. Never a reason,
-- never who.
create or replace function public.pengerjaan_saya(p_session uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions;
begin
  select * into s from public.assessment_sessions where id = p_session;
  if s.id is null or s.person_id is distinct from public.current_person_id() then
    perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED');
  end if;
  return jsonb_build_object(
    'status', s.status,
    'ditahan', public.pengerjaan_ditahan(s),
    'dilanjutkan', s.unfrozen_at is not null and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED'),
    'penutupan', case when s.closure_kind in ('DEADLINE', 'WINDOW_CLOSED') then 'DEADLINE'
                      when s.closure_kind is not null then s.closure_kind
                      when s.status = 'TERMINATED' and s.termination_cause = 'ADMINISTRATIVE_TERMINATION' then 'ASSIGNMENT_ENDED'
                      when s.status = 'TERMINATED' then 'OTHER' end,
    'dihitung', coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION'),
    'tenggat', public.pengerjaan_tenggat_efektif(s.id),
    'diperpanjang', s.deadline_extended_count,
    'percobaan_diizinkan', s.attempt_request_id is not null);
end $$;
revoke all on function public.pengerjaan_saya(uuid) from public, anon, authenticated;
grant execute on function public.pengerjaan_saya(uuid) to authenticated;

-- Whether an approved further attempt waits for the caller on this assessment: the one thing a learner is told about a
-- request (never that one waits, never that one was declined).
create or replace function public.percobaan_saya(p_assessment_assignment uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.attempt_requests g
                  where g.person_id = public.current_person_id() and g.assessment_assignment_id = p_assessment_assignment
                    and g.status = 'APPROVED'
                    and not exists (select 1 from public.assessment_sessions x where x.attempt_request_id = g.id))
$$;
revoke all on function public.percobaan_saya(uuid) from public, anon, authenticated;
grant execute on function public.percobaan_saya(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ the declarations
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('percobaan_saya', 'LEARNER',
   'A1 (O41-16): whether an approved further attempt waits for the caller on one assessment assignment. Says nothing '
   || 'of a waiting or a declined request.', null, null),
  ('extend_session_deadline', 'STAFF',
   'CAN_MANAGE_SITTINGS over the sitting''s place (A1; a professional-learning sitting: the platform admin); bounded and '
   || 'audited, no silent extension; a sitting past its deadline or held is not extended',
   'CAPABILITY', 'CAN_MANAGE_SITTINGS'),
  ('tambah_waktu_pengerjaan', 'STAFF',
   'A1: extra time (1-120 minutes, three times at most) on one open sitting with a 10-300 reason, through '
   || 'extend_session_deadline; audited assessment_session.deadline_extended. Refusals PR170.',
   'CAPABILITY', 'CAN_MANAGE_SITTINGS'),
  ('akhiri_pengerjaan', 'STAFF',
   'A1: the class''s teacher ends one open sitting with a 10-300 reason, choosing SCORED (a hand-in on the learner''s '
   || 'behalf: SUBMITTED then FINALIZED by the existing scoring, an ordinary result, an attempt) or NOT_COUNTED '
   || '(ADMINISTRATIVE_TERMINATION: answers kept, no result, not an attempt). Audited. Refusals PR170.',
   'CAPABILITY', 'CAN_MANAGE_SITTINGS'),
  ('lanjutkan_pengerjaan', 'STAFF',
   'A1 (O41-17): resumes a held sitting once its learner is reinstated: the deadline becomes now plus the remaining '
   || 'time stored when it was held, no more; a closed window does not block it. Audited. Refusals PR170.',
   'CAPABILITY', 'CAN_MANAGE_SITTINGS'),
  ('tutup_pengerjaan_ditahan', 'STAFF',
   'A1 (O41-17): closes a held sitting once its learner is reinstated, as not counted (ADMINISTRATIVE_TERMINATION), '
   || 'answers kept, with a 10-300 reason. Audited. Refusals PR170.',
   'CAPABILITY', 'CAN_MANAGE_SITTINGS'),
  ('minta_percobaan', 'STAFF',
   'A1 (O41-16): the class''s teacher requests one more attempt for a learner whose attempts are used up, with a '
   || '10-300 reason. Grants nothing. Audited attempt_request.requested. Refusals PR170.',
   'CAPABILITY', 'CAN_MANAGE_SITTINGS'),
  ('putuskan_percobaan', 'STAFF',
   'A1 (O41-16): approves or declines a request for another attempt: CAN_REVIEW_INTEGRITY over the sitting''s place, '
   || 'never the requester, never the learner, never a platform admin. Declining needs a 10-300 reason. Audited.',
   'CAPABILITY', 'CAN_REVIEW_INTEGRITY'),
  ('percobaan_antrean', 'STAFF',
   'A1: the waiting requests for another attempt at one school that the caller may decide (CAN_REVIEW_INTEGRITY over '
   || 'the place, not a platform admin); the caller''s own request is marked and is not theirs to decide.',
   'CAPABILITY', 'CAN_REVIEW_INTEGRITY'),
  ('ubah_jadwal_penugasan', 'STAFF',
   'A1: changes a live lesson assignment''s window and its open assessments'' with it, with a 10-300 reason; audited '
   || 'with before and after. An open sitting keeps its own deadline; an ended assignment is never reopened.',
   'CAPABILITY', 'CAN_ASSIGN_LEARNING'),
  ('daftar_pengerjaan', 'STAFF',
   'A1: for one class and one assessment assignment, each learner''s latest sitting: not started, open (since when, '
   || 'time left), held (remaining time, whether reinstated), handed in, ended scored or not counted, ended by its '
   || 'deadline; attempts used, the request''s state and whether the sitting was a granted attempt. No score, no rank.',
   'CAPABILITY', 'CAN_MANAGE_SITTINGS'),
  ('pengerjaan_saya', 'LEARNER',
   'A1: the caller''s own sitting: its status, whether it is held, how it ended (by its deadline, handed in by the '
   || 'teacher, not counted, with its assignment), its deadline. Never a reason and never who.', null, null)
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only.
-- ---------------------------------------------------------------------------
do $$
declare v_src text; f text;
begin
  if not ('CAN_MANAGE_SITTINGS' = any (public.role_capabilities('EDUCATOR')))
     or not ('CAN_MANAGE_SITTINGS' = any (public.role_capabilities('HEAD_OF_DEPARTMENT')))
     or not ('CAN_MANAGE_SITTINGS' = any (public.role_capabilities('INSTITUTION_ADMIN')))
     or 'CAN_MANAGE_SITTINGS' = any (public.role_capabilities('SYSTEM_ADMIN'))
     or 'CAN_MANAGE_SITTINGS' = any (public.role_capabilities('DEAN'))
     or 'CAN_MANAGE_SITTINGS' = any (public.role_capabilities('STUDENT')) then
    raise exception 'A1: CAN_MANAGE_SITTINGS is not held by exactly the teacher, the head of department and the school admin';
  end if;
  if 'CAN_REVIEW_INTEGRITY' = any (public.role_capabilities('EDUCATOR')) then
    raise exception 'A1: a teacher gained integrity authority';
  end if;
  -- one decision: the lazy check is a call to it, and nothing else writes EXPIRED
  if position('pengerjaan_putus_tenggat(p_session, true)' in (select prosrc from pg_proc where oid = 'public.session_enforce_deadline(uuid)'::regprocedure)) = 0
     or position('pengerjaan_putus_tenggat(s.id, true)' in (select prosrc from pg_proc where oid = 'public.pengerjaan_tutup_terjadwal(integer)'::regprocedure)) = 0 then
    raise exception 'A1: the lazy check and the scheduled entry point do not both call the one deciding function';
  end if;
  select string_agg(p.proname, ', ') into f from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.prosrc ~* 'assessment_sessions\s+set\s+status\s*=\s*''EXPIRED''' and p.proname <> 'pengerjaan_putus_tenggat';
  if f is not null then raise exception 'A1: % also expires a sitting', f; end if;
  -- the gates are where the learner's acts begin
  foreach f in array array['record_answer', 'submit_session', 'pause_session', 'resume_session'] loop
    select p.prosrc into v_src from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = f;
    if position('pengerjaan_gerbang(' in v_src) = 0 then raise exception 'A1: % does not ask whether the sitting is held', f; end if;
  end loop;
  if position('percobaan_izin_jumlah' in (select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure)) = 0
     or position('percobaan_tandai' in (select prosrc from pg_proc where oid = 'public.start_learning_session(uuid)'::regprocedure)) = 0
     or position('pengerjaan_putus_tenggat(p_session, false)' in (select prosrc from pg_proc where oid = 'public.finalize_session(uuid)'::regprocedure)) = 0
     or position('pengerjaan_tahan_orang' in (select prosrc from pg_proc where oid = 'public.tangguhkan_akun(uuid, text, text)'::regprocedure)) = 0 then
    raise exception 'A1: a granted attempt, the scoring''s deadline question or the suspension''s hold is not wired';
  end if;
  -- the two counts of «an attempt» say the same thing
  if position('not in (''INSTITUTIONAL_REVOCATION'', ''ADMINISTRATIVE_TERMINATION'')' in (select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure)) = 0
     or position('a2.academic_period_id is not distinct from v_aa.academic_period_id' in (select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure)) = 0 then
    raise exception 'A1: may_start_assessment no longer counts attempts as percobaan_terpakai mirrors them';
  end if;
  -- no client reaches an internal helper, the scheduler''s entry point or the new columns
  foreach f in array array['pengerjaan_tolak(text)', 'pengerjaan_putus_tenggat(uuid, boolean)', 'session_enforce_deadline(uuid)',
      'pengerjaan_tutup_terjadwal(integer)', 'pengerjaan_gerbang(uuid, text)', 'pengerjaan_tahan_orang(uuid, uuid)',
      'boleh_kelola_pengerjaan(uuid)', 'boleh_putuskan_percobaan(uuid)', 'percobaan_terpakai(uuid, uuid)',
      'percobaan_izin_jumlah(uuid, uuid)', 'percobaan_tandai(uuid)', 'pengerjaan_tenggat_efektif(uuid)',
      'pengerjaan_ditahan_periksa(uuid)', 'finalize_session(uuid)'] loop
    if has_function_privilege('authenticated', ('public.' || f)::regprocedure, 'execute')
       or has_function_privilege('anon', ('public.' || f)::regprocedure, 'execute') then
      raise exception 'A1: % is callable by a client', f;
    end if;
  end loop;
  foreach f in array array['tambah_waktu_pengerjaan(uuid, integer, text)', 'akhiri_pengerjaan(uuid, text, text)',
      'lanjutkan_pengerjaan(uuid, text)', 'tutup_pengerjaan_ditahan(uuid, text)', 'minta_percobaan(uuid, text)',
      'putuskan_percobaan(uuid, boolean, text)', 'percobaan_antrean(uuid)',
      'ubah_jadwal_penugasan(uuid, timestamptz, timestamptz, text)', 'daftar_pengerjaan(uuid, uuid)', 'pengerjaan_saya(uuid)',
      'percobaan_saya(uuid)'] loop
    if has_function_privilege('anon', ('public.' || f)::regprocedure, 'execute') then
      raise exception 'A1: an anonymous caller can call %', f;
    end if;
  end loop;
  if exists (select 1 from information_schema.column_privileges c
              where c.table_schema = 'public' and c.table_name = 'assessment_sessions' and c.grantee in ('anon', 'authenticated')
                and (c.column_name like 'closure_%' or c.column_name like 'frozen_%' or c.column_name like 'unfrozen_%'
                     or c.column_name = 'attempt_request_id')) then
    raise exception 'A1: a client role reads why or by whom a sitting was ended or held';
  end if;
  if exists (select 1 from information_schema.role_table_grants g
              where g.table_schema = 'public' and g.table_name = 'attempt_requests' and g.grantee in ('anon', 'authenticated')) then
    raise exception 'A1: a client role reaches attempt_requests directly';
  end if;
  -- no scheduler was enabled by this migration
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'A1: pg_cron is present in this database; this migration did not enable it and schedules nothing';
  end if;
  raise notice 'A1 verified: CAN_MANAGE_SITTINGS is the teacher''s, the head''s and the school admin''s; one function decides a deadline ending for the lazy check and the scheduled entry point; a held sitting is its own state; another attempt needs an independent approval';
end $$;

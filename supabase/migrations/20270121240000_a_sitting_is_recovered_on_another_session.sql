-- A3 · A SITTING IS RECOVERED ON ANOTHER SESSION (THE PLAN §5.5 D7, D10, D12; A3-PEMULIHAN.md as Sharon ruled it,
-- 547b3707 and 11:03; Bob's ruling on RECOVERY_NOT_NEEDED; Daisy's A3-KODE-PEMULIHAN.md §1 and §6).
--
-- Three acts, and nothing else writes the permission:
--   * lanjutkan_di_sini(p_session): the learner continues on this verified session. The generation rises by one and the
--     controller becomes sesi_saya(). An Uji Penguasaan needs the newest permission for this sitting and learner.
--   * izinkan_lanjut(p_session, p_alasan): the class's teacher (CAN_MANAGE_SITTINGS over the sitting's place) allows an
--     open Uji Penguasaan, single use, for 10 minutes (D-3). A low-stakes sitting is refused RECOVERY_NOT_NEEDED.
--   * minta_izin_lanjut(p_session): the learner, from a session that is not the controller, asks for it. It sets
--     lanjut_diminta_pada once and grants nothing; a recovery clears it.
--
-- THE ROW LOCK CARRIES THE PERMISSION (Sharon): every act takes the person and the shared fence (pengerjaan_pagar),
-- then the sitting FOR UPDATE, and only then reads or writes the permission. That lock is what makes a permission
-- single-use and "only the newest counts" hold under concurrency. The permission read never moves before it.
-- ORDER (A2A-L01): persons (1), FENCE (7), assessment_sessions (9), pengerjaan_izin_lanjut (10).
-- Ownership (or, for the teacher, authority) comes first: an unknown sitting answers SITTING_NOT_CONTROLLER (S9). A
-- null session is refused SITTING_NOT_CONTROLLER (S11). A recovery adds no time, changes no answer and uses no attempt.
--
-- METRIC CATALOGUE AND ENGINE: unchanged (D-060). Nothing is scored here.

alter table public.assessment_sessions add column lanjut_diminta_pada timestamptz;
comment on column public.assessment_sessions.lanjut_diminta_pada is
  'A3 (Sharon §6.3): when the learner asked a teacher to allow this Uji Penguasaan to continue on another session; set only by minta_izin_lanjut, cleared by a recovery; it grants nothing';

create table public.pengerjaan_izin_lanjut (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.assessment_sessions(id),
  person_id        uuid not null references public.persons(id),
  diizinkan_oleh   uuid not null references public.persons(id),
  alasan           text not null check (char_length(alasan) between 10 and 300),
  dibuat_pada      timestamptz not null default now(),
  berlaku_sampai   timestamptz not null,
  dipakai_pada     timestamptz,
  dipakai_generasi integer check (dipakai_generasi >= 2),
  check ((dipakai_pada is null) = (dipakai_generasi is null))
);
comment on table public.pengerjaan_izin_lanjut is
  'A3 D7: a teacher''s permission for one Uji Penguasaan sitting and its learner to continue on another session; single use, 10 minutes (D-3); only the newest per sitting counts. Written only by izinkan_lanjut and lanjutkan_di_sini, each under the sitting FOR UPDATE';
create index pengerjaan_izin_lanjut_sesi on public.pengerjaan_izin_lanjut (session_id, dibuat_pada desc, id desc);
alter table public.pengerjaan_izin_lanjut enable row level security;
revoke all on table public.pengerjaan_izin_lanjut from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.pengerjaan_tolak(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
      when 'SITTING_CLASS_STOPPED'        then 'the class is stopped by an Admin PINTAR; this can be done once the stop has ended; nothing was changed'
      when 'SITTING_FENCE_BUSY'           then 'PINTAR is processing a stop or its end; nothing was changed; try again in a moment'
      when 'SITTING_EMERGENCY_HELD'       then 'the sitting is held during a stop; it is not ended, scored or re-timed'
      when 'SITTING_NOT_CONTROLLER'       then 'this sitting is written by one signed-in session at a time, and this is not it; nothing was saved'
      when 'RECOVERY_NOT_AUTHORISED'      then 'this Uji Penguasaan continues on another session only once the class''s teacher allows it'
      when 'RECOVERY_AUTHORISATION_EXPIRED' then 'the teacher''s permission to continue has lapsed; it lasts 10 minutes'
      when 'RECOVERY_AUTHORISATION_USED'  then 'the teacher''s permission to continue has already been used once'
      when 'RECOVERY_NOTHING'             then 'there is nothing to continue: the sitting is finished or closed, or already continues here'
      when 'RECOVERY_NOT_NEEDED'          then 'this sitting needs no permission to continue'
      else 'the sitting could not be changed' end;
end $function$;

revoke all on function public.pengerjaan_tolak(text) from public, anon, authenticated;
grant execute on function public.pengerjaan_tolak(text) to service_role;

create or replace function public.lanjutkan_di_sini(p_session uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_sesi uuid; z public.pengerjaan_izin_lanjut; v_baru integer;
begin
  -- the learner and the shared fence, then the sitting FOR UPDATE, never the row before the fence
  if public.pengerjaan_pagar(p_session) then perform public.pengerjaan_tolak('SITTING_CLASS_STOPPED'); end if;
  select * into s from public.assessment_sessions where id = p_session for update;
  -- ownership first (S9): an unknown sitting and another person's answer alike
  if s.id is null or s.person_id is distinct from public.current_person_id() then
    perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER');
  end if;
  v_sesi := public.sesi_saya();
  if v_sesi is null then perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER'); end if;   -- S11
  -- D10: a held sitting is not recovered; the deadline rule runs first, and what it ends is not recovered
  if public.pengerjaan_ditahan(s) then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
  perform public.pengerjaan_putus_tenggat(p_session, true);
  select * into s from public.assessment_sessions where id = p_session;
  if s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then perform public.pengerjaan_tolak('RECOVERY_NOTHING'); end if;
  -- already the controller: nothing to do, nothing consumed (Sharon §6.1)
  if s.pengendali_sesi = v_sesi then return s.generasi; end if;
  v_baru := s.generasi + 1;
  if s.mode = 'POST_TEST' then
    -- the newest permission for THIS sitting and THIS learner alone counts (S5), read under the sitting's lock
    select * into z from public.pengerjaan_izin_lanjut i
     where i.session_id = p_session and i.person_id = s.person_id order by i.dibuat_pada desc, i.id desc limit 1;
    if z.id is null then perform public.pengerjaan_tolak('RECOVERY_NOT_AUTHORISED'); end if;
    if z.dipakai_pada is not null then perform public.pengerjaan_tolak('RECOVERY_AUTHORISATION_USED'); end if;
    if z.berlaku_sampai <= now() then perform public.pengerjaan_tolak('RECOVERY_AUTHORISATION_EXPIRED'); end if;
  end if;
  -- the recovery: a new generation, the verified session; nothing else on the sitting changes (S6). The sitting is
  -- written before the permission (A2A-L01: assessment_sessions 9, then pengerjaan_izin_lanjut 10)
  update public.assessment_sessions set generasi = v_baru, pengendali_sesi = v_sesi, lanjut_diminta_pada = null
   where id = p_session;
  perform public.audit_write('assessment_session.recovered', 'assessment_sessions', p_session::text, s.institution_id,
    jsonb_build_object('session_id', p_session, 'generation_from', s.generasi, 'generation_to', v_baru,
                       'allowed_by', z.diizinkan_oleh, 'permission_id', z.id,
                       'by', case when z.id is null then 'LEARNER_AFTER_SIGN_IN' else 'TEACHER_PERMISSION' end));
  insert into public.integrity_signals (session_id, institution_id, category, observation)
  values (p_session, s.institution_id, 'RECONNECT',
          jsonb_build_object('kind', 'RECOVERY', 'generation_from', s.generasi, 'generation_to', v_baru));
  -- the permission is consumed last: every write that locks the sitting (its row, the signal's key) comes before it
  if z.id is not null then
    update public.pengerjaan_izin_lanjut set dipakai_pada = now(), dipakai_generasi = v_baru where id = z.id;
  end if;
  return v_baru;
end $$;

create or replace function public.izinkan_lanjut(p_session uuid, p_alasan text)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_alasan text := btrim(coalesce(p_alasan, '')); v_sampai timestamptz;
        v_guru uuid := public.current_person_id();
begin
  -- the teacher first (FOR KEY SHARE), before the fence: the permission names them, so no person row is waited on after
  -- the sitting (as stop_pintar_now does with its actor)
  perform 1 from public.persons where id = v_guru for key share;
  if public.pengerjaan_pagar(p_session) then perform public.pengerjaan_tolak('SITTING_CLASS_STOPPED'); end if;
  select * into s from public.assessment_sessions where id = p_session for update;
  -- authority first (S9): an unknown sitting and one outside the caller's place answer alike
  if s.id is null or not public.boleh_atas_sesi(s.id, 'CAN_MANAGE_SITTINGS') then
    perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER');
  end if;
  if public.sesi_saya() is null then perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER'); end if;   -- S11
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.pengerjaan_tolak('SITTING_REASON_REQUIRED'); end if;
  if s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then perform public.pengerjaan_tolak('RECOVERY_NOTHING'); end if;
  -- a low-stakes sitting needs no permission (Sharon §6.2; Bob: the existing galat.action_not_allowed)
  if s.mode is distinct from 'POST_TEST' then perform public.pengerjaan_tolak('RECOVERY_NOT_NEEDED'); end if;
  insert into public.pengerjaan_izin_lanjut (session_id, person_id, diizinkan_oleh, alasan, berlaku_sampai)
  values (p_session, s.person_id, v_guru, v_alasan, now() + interval '10 minutes')
  returning berlaku_sampai into v_sampai;
  perform public.audit_write('assessment_session.recovery_allowed', 'assessment_sessions', p_session::text, s.institution_id,
    jsonb_build_object('session_id', p_session, 'reason', v_alasan, 'until', v_sampai));
  return v_sampai;
end $$;

create or replace function public.minta_izin_lanjut(p_session uuid)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_sesi uuid; z public.pengerjaan_izin_lanjut; v_pada timestamptz;
begin
  if public.pengerjaan_pagar(p_session) then perform public.pengerjaan_tolak('SITTING_CLASS_STOPPED'); end if;
  select * into s from public.assessment_sessions where id = p_session for update;
  if s.id is null or s.person_id is distinct from public.current_person_id() then
    perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER');
  end if;
  v_sesi := public.sesi_saya();
  if v_sesi is null then perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER'); end if;
  if s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then perform public.pengerjaan_tolak('RECOVERY_NOTHING'); end if;
  if s.mode is distinct from 'POST_TEST' then perform public.pengerjaan_tolak('RECOVERY_NOT_NEEDED'); end if;
  -- the controller's own session, or a sitting already allowed, has nothing to ask for
  if s.pengendali_sesi = v_sesi then perform public.pengerjaan_tolak('RECOVERY_NOTHING'); end if;
  select * into z from public.pengerjaan_izin_lanjut i
   where i.session_id = p_session and i.person_id = s.person_id order by i.dibuat_pada desc, i.id desc limit 1;
  if z.id is not null and z.dipakai_pada is null and z.berlaku_sampai > now() then
    perform public.pengerjaan_tolak('RECOVERY_NOTHING');
  end if;
  -- once: a repeat (or «Coba lagi») leaves the first request as it was
  update public.assessment_sessions set lanjut_diminta_pada = coalesce(lanjut_diminta_pada, now())
   where id = p_session returning lanjut_diminta_pada into v_pada;
  return v_pada;
end $$;

revoke all on function public.lanjutkan_di_sini(uuid) from public, anon, authenticated;
grant execute on function public.lanjutkan_di_sini(uuid) to authenticated, service_role;
revoke all on function public.izinkan_lanjut(uuid, text) from public, anon, authenticated;
grant execute on function public.izinkan_lanjut(uuid, text) to authenticated, service_role;
revoke all on function public.minta_izin_lanjut(uuid) from public, anon, authenticated;
grant execute on function public.minta_izin_lanjut(uuid) to authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('lanjutkan_di_sini', 'LEARNER', 'A3 D7: the learner continues their open sitting on this verified session; the generation rises by one; an Uji Penguasaan needs the newest teacher permission (single use, 10 minutes). Refusals PR170.', null, null),
  ('minta_izin_lanjut', 'LEARNER', 'A3 (Sharon §6.3): the learner asks the class''s teacher to allow an Uji Penguasaan to continue on this session; sets lanjut_diminta_pada once; grants nothing. Refusals PR170.', null, null),
  ('izinkan_lanjut', 'STAFF', 'A3 D7: the class''s teacher allows an open Uji Penguasaan to continue on another session, single use, 10 minutes, with a 10-300 reason. Audited. Refusals PR170.', 'CAPABILITY', 'CAN_MANAGE_SITTINGS');

do $$
begin
  if (select count(*) from public.client_rpc_registry where function_name in ('lanjutkan_di_sini', 'minta_izin_lanjut', 'izinkan_lanjut')) <> 3
  then raise exception 'A3: the recovery acts are not registered'; end if;
  if has_table_privilege('authenticated', 'public.pengerjaan_izin_lanjut', 'select') then raise exception 'A3: the permission is readable by a client role'; end if;
end $$;

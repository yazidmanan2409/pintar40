-- A3 · ONE WRITER PER SITTING: the controller (THE PLAN §5.5 D1–D8, G3; A3-COMPLETION.md; Sharon's pre-build review
-- afc3fb10 with its addendum, the codes' order 7fa4de5d, the harness session 8df83c47).
--
-- WHAT THIS DOES, AND ONLY THIS. It is the first of G3's database steps; the recovery act, the teacher's authorisation,
-- the service list's enumeration test and the finish manifest follow in their own commits.
--   * assessment_sessions gains the controlling Auth session (pengendali_sesi) and a generation (generasi, from 1, only
--     grows: D1, D3). responses gains the generation under which each was acknowledged (D8), set by a trigger from its
--     sitting, never by a client.
--   * The gate, pengerjaan_gerbang, called by record_answer, submit_session, pause_session, resume_session and now
--     note_item_view, runs in this order:
--     - the person FOR KEY SHARE and the shared fence (pengerjaan_pagar);
--     - THEN the sitting FOR UPDATE (never the row before the fence: A2a's activation takes the fence exclusively and then
--       touches sittings);
--     - then ownership (a caller who is not the learner is left to the boundary's own refusal, as before);
--     - then the controller check;
--     - then A1's hold and closure checks, unchanged; the hold is not asked of an item view ('VIEW'), as before A3.
--   * The controller is the verified session id in the claims (sesi_saya(), D2); no function takes it as a parameter. A
--     null session is refused SITTING_NOT_CONTROLLER (S11), never read as "any writer". A sitting open when this lands
--     has no controller; its learner's first write claims it, once (D6).
--   * start_learning_session refuses a caller with no session. The new sitting's controller is set at its insert, by a
--     trigger, from the verified claims (assessment_sessions_pengendali): the start itself writes no sitting, and a
--     sitting inserted with no session (the service, the harness's copies) has none, so its learner's first write claims it.
--     Any sitting inserted with no session, not only one open when A3 lands, stays claimable that way, once (Sharon).
--   * session_final_responses: the final answer is the highest (generation, client_seq) (D8).
--   * pengerjaan_tolak (PR170) gains SITTING_NOT_CONTROLLER (D12). An unknown sitting reaches the boundary's own refusal.
--
-- LOCK ORDER (A2A-L01's ranks): persons (1) KEY SHARE, FENCE (7) shared, assessment_sessions (9) FOR UPDATE. No lock of a
-- lower rank is taken after the sitting row lock (Sharon §3, condition 1). Every function below is redefined IN FULL from
-- its live body (pg_get_functiondef at b5cd166a), never patched by text.

alter table public.assessment_sessions
  add column pengendali_sesi uuid,
  add column generasi integer not null default 1 check (generasi >= 1);
comment on column public.assessment_sessions.pengendali_sesi is
  'A3 D1: the verified Auth session id (sesi_saya()) that may write this sitting; null only for a sitting open when A3 landed, claimed by its first learner write';
comment on column public.assessment_sessions.generasi is
  'A3 D1/D3: the controller generation; set to 1 at the start and raised only by a recovery, inside the database';

alter table public.responses add column generasi integer not null default 1 check (generasi >= 1);
comment on column public.responses.generasi is 'A3 D8: the sitting''s generation when this response was acknowledged';

create or replace function public.assessment_sessions_pengendali()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  -- D2/D3: the server decides who controls a new sitting, from the verified claims, never from the row the writer sent
  new.pengendali_sesi := public.sesi_saya();
  new.generasi := 1;
  return new;
end $$;
revoke all on function public.assessment_sessions_pengendali() from public, anon, authenticated;
create trigger assessment_sessions_pengendali before insert on public.assessment_sessions
  for each row execute function public.assessment_sessions_pengendali();

create or replace function public.responses_generasi_isi()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  -- the server decides the generation (D3): whatever a writer supplied, the sitting's. Read through the presented item,
  -- never new.session_id: submit_response inserts a placeholder session that another trigger overwrites, and triggers
  -- of one event fire in name order (A3-C04 found this one firing first)
  select s.generasi into new.generasi
    from public.presented_items p join public.assessment_sessions s on s.id = p.session_id
   where p.id = new.presented_item_id;
  new.generasi := coalesce(new.generasi, 1);
  return new;
end $$;
revoke all on function public.responses_generasi_isi() from public, anon, authenticated;
create trigger responses_generasi_isi before insert on public.responses
  for each row execute function public.responses_generasi_isi();

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
      else 'the sitting could not be changed' end;
end $function$;

CREATE OR REPLACE FUNCTION public.pengerjaan_gerbang(p_session uuid, p_untuk text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare s public.assessment_sessions; v_sesi uuid;
begin
  -- A2a D6.2: the learner, the shared fence, then protection read under it
  if public.pengerjaan_pagar(p_session) then perform public.pengerjaan_tolak('SITTING_CLASS_STOPPED'); end if;
  -- A3 (D4; Sharon §3): then the sitting's row lock, never before the fence
  select * into s from public.assessment_sessions where id = p_session for update;
  -- ownership first (Sharon 7fa4de5d): a caller who is not the learner is left to the boundary's own refusal, as before
  if s.id is null or s.person_id is distinct from public.current_person_id() then return; end if;
  -- A3 (D1, D2, D6; S11): the controller is the verified Auth session. None is refused; an uncontrolled sitting (open
  -- when this migration landed) is claimed once by its learner's first write; any other session is refused.
  v_sesi := public.sesi_saya();
  if v_sesi is null then perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER'); end if;
  if s.pengendali_sesi is null then
    update public.assessment_sessions set pengendali_sesi = v_sesi where id = p_session;
  elsif s.pengendali_sesi <> v_sesi then
    perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER');
  end if;
  -- A1's hold refuses an answer, a hand-in and the learner's own pause or resume, never an item view (Sharon V-1: before
  -- A3 the view ran only the fence; D4 asked of it only the controller check)
  if p_untuk <> 'VIEW' and public.pengerjaan_ditahan(s) then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
  if s.closure_kind = 'TEACHER_NOT_COUNTED' and p_untuk in ('ANSWER', 'SUBMIT') then
    raise exception using errcode = case p_untuk when 'SUBMIT' then 'PR003' else 'PR002' end,
      detail = 'SESSION_ENDED_NOT_COUNTED', message = 'this session was ended by the teacher and is not counted';
  end if;
  if s.closure_kind = 'TEACHER_SCORED' and p_untuk = 'ANSWER' then
    raise exception using errcode = 'PR002', detail = 'SESSION_ENDED_SCORED',
      message = 'this session was handed in by the teacher and accepts no further answers';
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.start_learning_session(p_assessment_assignment uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_person uuid; v_ok boolean; v_reason text;
  v_aa public.assessment_assignments; v_la public.learning_assignments;
  v_d public.assessment_definitions; v_enrol uuid; v_session uuid;
  v_deadline timestamptz; v_cohort uuid; v_class uuid;
  v_release uuid; v_course uuid;
  v_kunci_def uuid;
begin
  v_person := public.current_person_id();
  -- A3 (D2, D6; Sharon S11): a sitting is written by the verified Auth session that started it. A caller with no
  -- session id (sesi_saya() null) is refused, never treated as any writer.
  if public.sesi_saya() is null then perform public.pengerjaan_tolak('SITTING_NOT_CONTROLLER'); end if;
  -- CORRECTED IN PLACE (undeployed; Sharon §13 on 6faef690, Low): a share lock on the assessment assignment, so
  -- «Akhiri penugasan» (which locks it for update before it counts open sittings) never misses a start under way.
  -- A3-R1 (Sharon, 16 Nov 22:37, 5ac3645d): taken FIRST, before the start's key is read. An assignment's definition is
  -- moved by the release move and by koreksi_kunci_pindah (C1w), each holding this row FOR UPDATE; under the share lock
  -- no move can commit, so the key read below is the definition this start will count and sit (F37-R03).
  -- A3-R1 (Sharon, 16 Nov 22:46, 78b4de2d; F37-R04): and BEFORE IT, the learning assignment FOR KEY SHARE, when the
  -- assignment has one. «Akhiri penugasan» and both moves lock the learning assignment FOR UPDATE and then its assessment
  -- assignments; a start that held its assessment assignment and then needed the learning assignment (the sitting's
  -- foreign key takes it FOR KEY SHARE) could deadlock with «Akhiri» (proven: F37-R04 on eaa37aea). Taken first, the
  -- start queues behind «Akhiri» before it holds anything «Akhiri» waits for, and the insert's KEY SHARE is already held.
  -- An assignment's learning_assignment_id is never updated (only filtered on), so the unlocked read of it is safe; an
  -- ad-hoc assignment has none and takes no lock here.
  perform 1 from public.learning_assignments
   where id = (select aa.learning_assignment_id from public.assessment_assignments aa where aa.id = p_assessment_assignment)
     for key share;
  perform 1 from public.assessment_assignments where id = p_assessment_assignment for share;
  -- A3-R1 (Sharon's N-5, A3-PREBUILD-ac25e9b1.md §2; F37-R02): ONE START AT A TIME PER LEARNER AND ASSESSMENT, keyed by
  -- what the attempt count counts. may_start_assessment counts the learner's sittings of this definition and version
  -- under ANY assignment in the school and year (20270113140000), so a lock per (learner, assignment) let two starts on
  -- two open assignments of one definition take different locks and both insert (proven: two sittings against a limit
  -- of one). A3, ruling 46: the key is (learner, the definition's LINEAGE ROOT), read under the share lock above, the
  -- scope of may_start's count, which spans an assessment's published versions. The assignment's definition cannot
  -- move while the share lock is held, and a definition's lineage root never changes (assessment_definitions_lineage_root,
  -- A3-LN1); a version is not part of the key (an ad-hoc definition's version is mutable). Held to the end of the
  -- transaction, so the second start counts the first
  -- sitting and is refused; taken before the count, as SI-D02's was. No deadlock (Sharon, 5ac3645d): starts share the
  -- assignment row and then serialise on the key; the moves and «Akhiri» wait on the share lock and take no advisory
  -- lock; no start waits on an assignment while it holds a key. An unknown assignment has no key and takes no lock;
  -- may_start refuses it (UNKNOWN_ASSIGNMENT).
  if v_person is not null then
    select d.lineage_root_definition_id into v_kunci_def
      from public.assessment_assignments a join public.assessment_definitions d on d.id = a.assessment_definition_id
     where a.id = p_assessment_assignment;
    if v_kunci_def is not null then
      perform pg_advisory_xact_lock(hashtextextended(
        'start_learning_session:garis:' || v_person::text || ':' || v_kunci_def::text, 0));
    end if;
  end if;
  select e.ok, e.reason into v_ok, v_reason from public.may_start_assessment(p_assessment_assignment) e;
  -- A2b start-path: the maintenance refusals by their own code, as the sitting-insert trigger raises them
  if not v_ok and v_reason = 'MAINTENANCE_PLACE' then perform public.maintenance_tolak_tempat(); end if;
  if not v_ok and v_reason = 'MAINTENANCE_NO_NEW_START' then perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START'); end if;
  if not v_ok then raise exception 'cannot start this assessment: % (INV-27)', v_reason; end if;

  select * into v_aa from public.assessment_assignments where id = p_assessment_assignment;
  select * into v_d  from public.assessment_definitions where id = v_aa.assessment_definition_id;

  -- CHANGED IN 0062. An ad-hoc assignment names no learning assignment by
  -- construction, and until then that refusal ended the Quick Assessment flow
  -- before a learner could answer anything. Everything else about the session
  -- is unchanged: same opener, same assembler, same provenance guard, same
  -- evidence derivation.
  if v_aa.learning_assignment_id is null and not coalesce(v_d.is_ad_hoc, false) then
    raise exception 'this phase starts learning-cycle sessions only; the assignment names no learning assignment';
  end if;
  if v_aa.learning_assignment_id is not null then
    select * into v_la from public.learning_assignments where id = v_aa.learning_assignment_id;
    if v_la.status <> 'ACTIVE' then
      raise exception 'the learning assignment is % and assigns nothing', v_la.status;
    end if;
  end if;

  select e.id into v_enrol from public.enrollments e
   where e.person_id = v_person and e.institution_id = v_aa.institution_id and e.status = 'ACTIVE'
   order by e.created_at desc limit 1;

  -- the learner's own class/cohort under the assigned node, for exposure
  -- cooling and cohort aggregates
  select (array_agg(n.id) filter (where n.kind = 'CLASS'))[1],
         (array_agg(n.id) filter (where n.kind = 'COHORT'))[1]
    into v_class, v_cohort
    from public.memberships m join public.org_nodes n on n.id = m.node_id
   where m.enrollment_id = v_enrol and m.valid_to is null
     and (n.id = v_aa.node_id or n.jalur @> array[v_aa.node_id]);

  -- owner decision 5 (9 Nov): the sitting records the Angkatan that applies NOW, at the sitting. A learner PINTAR
  -- places is a member of a Kelas, never of the COHORT node, so the class's own Angkatan (the nearest COHORT above it
  -- in the structure as it stands at this moment) is the learner's. Recorded once, immutable (INV-33): a later move
  -- of the class or the learner never rewrites it.
  -- With a class, its Angkatan is the one recorded, whatever other membership the learner holds; open_assessment_session
  -- checks it again where it is written (Sharon's finding 3).
  if v_class is not null then
    v_cohort := null;
    select n.id into v_cohort
      from public.org_nodes k join public.org_nodes n on n.id = any (k.jalur) and n.kind = 'COHORT'
     where k.id = v_class
     order by array_position(k.jalur, n.id) desc limit 1;
  end if;

  if v_aa.closes_at is not null then v_deadline := v_aa.closes_at; end if;

  if v_aa.learning_assignment_id is not null then
    -- the release is the one the LEARNING assignment binds, never "the newest"
    v_release := v_la.plp_release_id;
    -- ADDED IN 0102. An ACTIVE assignment is not a licence to write evidence
    -- over content that can still be edited. The ad-hoc arm below has asked
    -- this question since 0063; this arm never did, so a school could answer
    -- its own unfinished chapter and the session's release binding -- the
    -- frozen answer to "what did this learner see" -- pinned nothing. Same
    -- rule, one predicate, both arms.
    if not public.release_starts_new_sessions(v_release) then
      raise exception
        'this assignment is over material that cannot begin a new attempt: the chapter it binds has not been published';
    end if;
  else
    -- ADDED IN 0062, CORRECTED IN 0063, NARROWED CORRECTLY IN 0064. An ad-hoc
    -- paper binds a module or a course, not a release, so the release is
    -- resolved from the content the definition is bound to: this school's own
    -- release of that course, or -- for canonical content -- one it holds an
    -- ACTIVE grant for.
    --
    -- `status in ('PUBLISHED','SUPERSEDED')` is "sealed, AND was published",
    -- which is exactly what the session binding needs and nothing more. Sealed,
    -- because `enforce_taught_content_immutable` only fires on a sealed course
    -- and an unsealed release therefore pins nothing (that was F1). Published,
    -- because doc 08 puts publication upstream of use -- so FROZEN, the one
    -- sealed status that was never published, stays refused.
    --
    -- SUPERSEDED is admitted deliberately. Release status gates new sessions
    -- nowhere else in this system, correction is never automatic here
    -- (ADR-0016), and the audited lever for "stop using this" is withdrawing the
    -- DISTRIBUTION, which `release_is_distributed_to` already enforces below.
    --
    -- That predicate is the same one the session guard re-applies immediately
    -- afterwards, so a grant withdrawn between launch and start refuses here
    -- rather than producing a session the guard would then reject.
    select coalesce(v_d.course_id, m.course_id) into v_course
      from public.modules m where m.id = v_d.module_id;
    if v_course is null then v_course := v_d.course_id; end if;
    select r.id into v_release
      from public.plp_releases r
     where r.course_id = v_course
       and r.status in ('PUBLISHED', 'SUPERSEDED') and r.withdrawn_at is null   -- C1w (O41-11)
       and (r.institution_id = v_aa.institution_id
         or public.release_is_distributed_to(r.id, v_aa.institution_id))
     -- a live PUBLISHED release wins over a SUPERSEDED one for the same course:
     -- `published_at desc nulls last` puts the later publication first.
     order by (r.institution_id = v_aa.institution_id) desc,
              (r.status = 'PUBLISHED') desc,
              r.published_at desc nulls last, r.created_at desc
     limit 1;
    -- C1w (O41-11): the material its publisher withdrew starts no new sitting, said as may_start_assessment says it
    if v_release is null and exists (select 1 from public.plp_releases r where r.course_id = v_course and r.withdrawn_at is not null
         and (r.institution_id = v_aa.institution_id or public.release_is_distributed_to(r.id, v_aa.institution_id))) then
      raise exception 'cannot start this assessment: RELEASE_WITHDRAWN (INV-27)';
    end if;
    if v_release is null then
      raise exception
        'this quick assessment is over material this school cannot use right now: either the chapter has not been published, or it is no longer shared with you';
    end if;
  end if;

  v_session := public.open_assessment_session(
    v_enrol, v_d.id, v_release, 'ONLINE', v_d.mode,
    public.engine_version(), public.scoring_policy_version(),
    v_class, v_cohort, v_deadline, v_aa.learning_assignment_id, v_aa.id);

  perform public.percobaan_tandai(v_session);   -- A1 (O41-16): a granted attempt is marked
  perform public.assemble_session(v_session);
  return v_session;
end
$function$;

CREATE OR REPLACE FUNCTION public.note_item_view(p_presented_item uuid)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_session uuid; v_at timestamptz;
begin
  select p.session_id into v_session from public.presented_items p where p.id = p_presented_item;
  if v_session is null then raise exception 'unknown presented item %', p_presented_item; end if;
  -- A2a D6.2: the learner, the shared fence, then protection read under it
  -- A3 (D4): the item view is a learner boundary; the gate takes the fence, the sitting row and the controller check
  perform public.pengerjaan_gerbang(v_session, 'VIEW');
  if not public.session_is_mine(v_session) then
    raise exception 'this session belongs to someone else';
  end if;
  insert into public.presented_item_views (presented_item_id, session_id, institution_id)
  values (p_presented_item, v_session, '00000000-0000-0000-0000-000000000000')
  on conflict (presented_item_id) do nothing;
  select first_viewed_at into v_at from public.presented_item_views
   where presented_item_id = p_presented_item;
  return v_at;
end $function$;

CREATE OR REPLACE FUNCTION public.session_final_responses(p_session uuid)
 RETURNS TABLE(presented_item_id uuid, item_id uuid, posisi smallint, value jsonb, is_safety_critical boolean, received_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select distinct on (p.id) p.id, p.item_id, p.position, r.value, i.is_safety_critical, r.received_at
    from public.presented_items p
    join public.items i on i.id = p.item_id
    left join public.responses r on r.presented_item_id = p.id and r.is_final
   where p.session_id = p_session
   -- A3 (D8): the final answer is the one with the highest (generation, client_seq)
   order by p.id, r.generasi desc nulls last, r.client_seq desc nulls last
$function$;

-- the grants, restated as they were (ADR-0021: a function created here revokes PUBLIC here)
revoke all on function public.pengerjaan_tolak(text) from public, anon, authenticated;
grant execute on function public.pengerjaan_tolak(text) to service_role;

revoke all on function public.pengerjaan_gerbang(uuid, text) from public, anon, authenticated;
grant execute on function public.pengerjaan_gerbang(uuid, text) to service_role;

revoke all on function public.start_learning_session(uuid) from public, anon, authenticated;
grant execute on function public.start_learning_session(uuid) to service_role;
grant execute on function public.start_learning_session(uuid) to authenticated;

revoke all on function public.note_item_view(uuid) from public, anon, authenticated;
grant execute on function public.note_item_view(uuid) to service_role;
grant execute on function public.note_item_view(uuid) to authenticated;

revoke all on function public.session_final_responses(uuid) from public, anon, authenticated;
grant execute on function public.session_final_responses(uuid) to service_role;

-- the migration's own check: the gate takes the sitting row lock after the fence and checks the controller; the start
-- refuses a null session; the final answer orders by generation; both triggers exist
do $$
declare v text;
begin
  v := pg_get_functiondef('public.pengerjaan_gerbang(uuid, text)'::regprocedure);
  if position('pengerjaan_pagar' in v) = 0 or position('for update' in v) = 0 or position('pengendali_sesi' in v) = 0
     or position('pengerjaan_pagar' in v) > position('for update' in v) then
    raise exception 'A3: the gate does not take the fence, then the sitting row lock, then check the controller';
  end if;
  if position('sesi_saya() is null' in pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure)) = 0 then
    raise exception 'A3: the start does not refuse a caller with no session';
  end if;
  if position('generasi desc' in pg_get_functiondef('public.session_final_responses(uuid)'::regprocedure)) = 0 then
    raise exception 'A3: the final answer does not order by generation';
  end if;
  if (select count(*) from pg_trigger where tgname in ('assessment_sessions_pengendali', 'responses_generasi_isi') and not tgisinternal) <> 2 then
    raise exception 'A3: a controller trigger is missing';
  end if;
end $$;

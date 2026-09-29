-- BOB-35: A CORRECTED-RELEASE MOVE NEVER LEAVES MIXED PROVENANCE (INV-04, INV-29).
--
-- THE INVARIANT (Yazid, 29 Sep): the release/content provenance recorded for an
-- assessment session and certificate must correspond to the content and
-- assessment definitions actually used by that learner. A corrected-release
-- move must never create mixed old/new provenance.
--
-- THE DEFECT. move_learning_assignment_release (20260915130000) moved only the
-- learning assignment's release and course. The cycle's PRE_TEST and POST_TEST
-- assessment_assignments kept the old course's definitions, so
-- start_learning_session recorded the NEW release (the learning assignment's)
-- while eligible_items_for_definition drew from the OLD definition's course. A
-- session, and a certificate signed from it (certificate_prepare cites the
-- session's plp_release_id and that release's content hash), cited v1.1 for
-- v1.0's items. F05-T14b reproduced it: 6 of 6 presented items from v1.0.
--
-- THE CORRECTION, as ruled (coordinator, 29 Sep), and nothing else:
--  (a) AT THE ROOT. A new session whose plp_release_id is not a release of its
--      definition's course (or its module's course) is refused, PR060
--      SESSION_RELEASE_MISMATCH; and one under a learning assignment must still
--      match that assignment's release and definition once it holds the
--      assignment's row (a start racing a move). INSERT only: existing rows are never
--      re-validated or rewritten, and every path that opens a session (the
--      learning cycle, Uji Cepat, any later one) is held by it.
--  (b) THE MOVE CARRIES THE CYCLE. In the same transaction the cycle's PRE_TEST
--      and POST_TEST assessment_assignments are repointed to the target
--      release's cycle definitions -- release_cycle_definition, the selection
--      assign_release uses -- and learning_cycle names them. A target with no
--      such definition refuses the move, PR060 RELEASE_MOVE_NO_CYCLE_DEFINITION.
--  (c) NO MOVE ONCE THE CYCLE HAS STARTED. A learner's pre-test and post-test
--      must never come from two releases (net gain, INV-24), so the move is
--      refused, PR060 RELEASE_MOVE_STARTED, once any session exists under the
--      assignment. learners_left_in_place is therefore 0 by construction. A
--      correction after a class has started is a new assignment.
--
-- The move's body is 20260915130000's, re-emitted with (b) and (c) added and
-- every earlier refusal, the lineage and owner widening, the move row, the
-- release pin it satisfies and the audit line as they were (the audit gains
-- the cycle's definitions).
--
-- NO BACKFILL, NO REWRITE. No session, presented item, result or certificate
-- is touched. The seeded database holds no session whose recorded release's
-- course is not its items' course (measured; the closure query is F05-T14b's).
--
-- D-060: nothing here grades, assembles or draws a paper, or computes a metric;
-- neither the metric catalogue version nor engine_version moves.

-- ────────────────────────────────────────────────────────── (a) at the root
--
-- AND UNDER CONCURRENCY (the gate's finding, corrected in place under D-026).
-- start_learning_session reads its learning assignment and assessment
-- assignment with plain SELECTs, so a start that read them before a move
-- committed would insert a session on the release and definition the move is
-- replacing, one that agrees with itself and so passes the check above. A
-- session that names a learning assignment therefore takes FOR KEY SHARE on
-- it: the lightest lock that waits for the move's FOR UPDATE, and one that
-- concurrent starts share. It then re-reads the assignment's CURRENT release
-- and its assessment assignment's CURRENT definition (this function is
-- VOLATILE, so under READ COMMITTED each read sees a committed move) and
-- refuses a session that no longer matches them, SESSION_RELEASE_MISMATCH;
-- the learner's retry starts on the new release. In the other order the start
-- holds the lock, the move waits, sees the session and refuses
-- RELEASE_MOVE_STARTED. The cost on the start path (D-031) is one shared row
-- lock and two primary-key reads per session.
create function public.enforce_session_release_is_its_course() returns trigger
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_def_course uuid; v_rel_course uuid; v_la_release uuid; v_aa_definition uuid;
begin
  select coalesce(d.course_id, m.course_id) into v_def_course
    from public.assessment_definitions d
    left join public.modules m on m.id = d.module_id
   where d.id = new.assessment_definition_id;
  select r.course_id into v_rel_course from public.plp_releases r where r.id = new.plp_release_id;
  if v_def_course is null or v_rel_course is null or v_def_course <> v_rel_course then
    raise exception using errcode = 'PR060', detail = 'SESSION_RELEASE_MISMATCH',
      message = 'a session records a release of the course its definition draws from, or none is opened (INV-04, INV-29)';
  end if;
  if new.learning_assignment_id is not null then
    perform 1 from public.learning_assignments la where la.id = new.learning_assignment_id for key share;
    select la.plp_release_id into v_la_release from public.learning_assignments la where la.id = new.learning_assignment_id;
    if new.assessment_assignment_id is not null then
      select aa.assessment_definition_id into v_aa_definition
        from public.assessment_assignments aa where aa.id = new.assessment_assignment_id;
    end if;
    if v_la_release is distinct from new.plp_release_id
       or (new.assessment_assignment_id is not null and v_aa_definition is distinct from new.assessment_definition_id) then
      raise exception using errcode = 'PR060', detail = 'SESSION_RELEASE_MISMATCH',
        message = 'the assignment moved to another release while this attempt was starting: start again (INV-04, INV-24)';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_session_release_is_its_course() from public, anon, authenticated;
create trigger assessment_sessions_release_is_its_course before insert on public.assessment_sessions
  for each row execute function public.enforce_session_release_is_its_course();

-- ─────────────────────────────────────────── (b) and (c) the move itself
create or replace function public.move_learning_assignment_release(
  p_assignment uuid, p_to_release uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; v_actor uuid; v_moved int; v_left int; v_id uuid;
        v_target record; v_ok boolean;
        v_aa record; v_def public.assessment_definitions; v_cycle jsonb := '{}'::jsonb; v_repoint jsonb := '[]'::jsonb;
begin
  select * into a from public.learning_assignments where id = p_assignment;
  if a.id is null then raise exception 'unknown learning assignment %', p_assignment; end if;
  if a.status <> 'ACTIVE' then
    raise exception 'a release move applies to an ACTIVE assignment, not %', a.status;
  end if;
  if a.release_correction_policy <> 'NOT_STARTED_ONLY' then
    raise exception 'this assignment does not permit a release correction';
  end if;
  v_actor := public.current_person_id();
  if v_actor is null or not public.can_in_institution('CAN_ASSIGN_LEARNING', a.institution_id) then
    raise exception 'moving a release requires CAN_ASSIGN_LEARNING in the owning institution';
  end if;

  select r.id, r.institution_id, r.course_id into v_target
    from public.plp_releases r where r.id = p_to_release;
  if v_target.id is null then raise exception 'unknown release %', p_to_release; end if;

  -- WIDENED IN 0055, on two axes that are independent of each other.
  --
  -- Course: the target may be a release of this assignment's course, or of any
  -- course in that course's lineage chain -- because under E1 a correction IS a
  -- new course, and without this every revision would be refused (ADR-0016).
  if not exists (select 1 from public.course_lineage_chain(a.course_id) c
                  where c.course_id = v_target.course_id) then
    raise exception
      'the target release is not another release of this course or of a course in its lineage';
  end if;

  -- Owner: the target belongs to this institution, or is canonical content
  -- distributed to it (ADR-0015). School B's release stays refused to School C.
  v_ok := (v_target.institution_id = a.institution_id)
       or public.release_is_distributed_to(p_to_release, a.institution_id);
  if not v_ok then
    raise exception
      'the target release belongs to another institution and is not canonical content distributed to this one';
  end if;

  -- BOB-35 (c): ONCE THE CYCLE HAS STARTED, NO MOVE. A learner's pre-test and
  -- post-test never come from two releases. This row lock is what a starting
  -- session's FOR KEY SHARE (assessment_sessions_release_is_its_course) waits
  -- on: a start that raced the move is refused there, and a start that got the
  -- lock first is a session this check then sees.
  perform 1 from public.learning_assignments where id = p_assignment for update;
  if exists (select 1 from public.assessment_sessions s
              where s.learning_assignment_id = p_assignment
                 or s.assessment_assignment_id in (select aa.id from public.assessment_assignments aa
                                                    where aa.learning_assignment_id = p_assignment)) then
    raise exception using errcode = 'PR060', detail = 'RELEASE_MOVE_STARTED',
      message = 'a learner has already started this assignment, so its release is not moved: a correction after a start is a new assignment (INV-24)';
  end if;

  -- BOB-35 (b): THE CYCLE MOVES WITH IT, to the target release's own cycle
  -- definitions, chosen exactly as assign_release chooses them.
  for v_aa in
    select aa.id, aa.assessment_definition_id as from_def, d.mode
      from public.assessment_assignments aa
      join public.assessment_definitions d on d.id = aa.assessment_definition_id
     where aa.learning_assignment_id = p_assignment and d.mode in ('PRE_TEST', 'POST_TEST')
     order by d.mode
  loop
    v_def := public.release_cycle_definition(p_to_release, v_aa.mode);
    if v_def.id is null then
      raise exception using errcode = 'PR060', detail = 'RELEASE_MOVE_NO_CYCLE_DEFINITION',
        message = format('the target release has no approved %s definition, so the cycle cannot move with it', v_aa.mode);
    end if;
    update public.assessment_assignments set assessment_definition_id = v_def.id where id = v_aa.id;
    v_cycle := v_cycle || jsonb_build_object(case v_aa.mode when 'PRE_TEST' then 'pre_test' else 'post_test' end, v_def.id);
    v_repoint := v_repoint || jsonb_build_object('mode', v_aa.mode, 'from', v_aa.from_def, 'to', v_def.id);
  end loop;

  -- who has already started: by (c), nobody. Kept as the move row records it.
  select count(distinct s.person_id) into v_left from public.assessment_sessions s
   where s.learning_assignment_id = p_assignment and s.plp_release_id = a.plp_release_id;
  select count(distinct m.enrollment_id) into v_moved
    from public.memberships m
   where m.node_id = a.node_id and m.valid_to is null
     and not exists (select 1 from public.assessment_sessions s
                      join public.enrollments e on e.id = s.enrollment_id
                     where s.learning_assignment_id = p_assignment and e.id = m.enrollment_id);

  insert into public.learning_assignment_release_moves (learning_assignment_id, institution_id,
    from_release_id, to_release_id, reason, moved_by_person_id, learners_moved, learners_left_in_place)
  values (p_assignment, a.institution_id, a.plp_release_id, p_to_release, p_reason, v_actor,
          v_moved, v_left)
  returning id into v_id;

  -- The assignment follows the release onto the successor course. Leaving
  -- course_id behind would make the row name one course and teach another.
  update public.learning_assignments
     set plp_release_id = p_to_release, course_id = v_target.course_id,
         learning_cycle = coalesce(learning_cycle, '{}'::jsonb) || v_cycle
   where id = p_assignment;

  perform public.audit_write('LEARNING_RELEASE_MOVED', 'learning_assignments',
    p_assignment::text, a.institution_id,
    jsonb_build_object('from_release', a.plp_release_id, 'to_release', p_to_release,
                       'from_course', a.course_id, 'to_course', v_target.course_id,
                       'learners_moved', v_moved, 'learners_left_in_place', v_left,
                       'cycle', v_repoint, 'reason', p_reason));
  return v_id;
end $$;
revoke all on function public.move_learning_assignment_release(uuid, uuid, text) from public, anon;
grant execute on function public.move_learning_assignment_release(uuid, uuid, text) to authenticated;

-- ─────────────────────────────────────────────── terminal verification
do $$
declare v text;
begin
  if not exists (select 1 from pg_trigger t where t.tgrelid = 'public.assessment_sessions'::regclass
                  and t.tgname = 'assessment_sessions_release_is_its_course' and not t.tgisinternal
                  and (t.tgtype & 4) <> 0 and (t.tgtype & 16) = 0) then
    raise exception 'BOB-35: the session trigger is not BEFORE INSERT only';
  end if;
  v := pg_get_functiondef('public.move_learning_assignment_release(uuid, uuid, text)'::regprocedure);
  if v !~ 'RELEASE_MOVE_STARTED' or v !~ 'RELEASE_MOVE_NO_CYCLE_DEFINITION' or v !~ 'release_cycle_definition' then
    raise exception 'BOB-35: the move does not carry the cycle and refuse a started one';
  end if;
  if has_function_privilege('anon', 'public.move_learning_assignment_release(uuid, uuid, text)', 'execute')
     or has_function_privilege('authenticated', 'public.enforce_session_release_is_its_course()', 'execute') then
    raise exception 'BOB-35: a grant is wrong';
  end if;
end $$;

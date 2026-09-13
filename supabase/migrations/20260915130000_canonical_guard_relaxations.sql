-- 0055 -- the two guard relaxations, and the lineage-aware release move.
--
-- These are the only two places in the system that stand between a learner and
-- canonical content. Both currently say "the enrolment's institution owns this
-- object"; both become "the enrolment's institution owns it, OR it is a
-- PLATFORM_CANONICAL tenant's object that this institution holds an active
-- distribution grant for".
--
-- WHAT IS DELIBERATELY *NOT* WIDENED. Neither relaxation admits one school's
-- object to another school. Both read `release_is_distributed_to`, which is
-- conjunctive -- canonical ownership AND an active grant -- so there is no row
-- a school can create that makes School B's release reachable from School C.
-- That refusal is proven in the terminal block by building exactly that row and
-- showing it still fails.
--
-- THE DEFINITION CHECK IS THE SUBTLER HALF. A canonical assessment definition
-- is not itself distributed -- grants are on releases. So a definition is
-- admitted when it is owned by the SAME canonical tenant as the session's
-- release AND that release is distributed to the enrolment's institution.
-- Binding the definition to the release rather than granting it independently
-- means no second grant surface exists, and a school cannot reach a canonical
-- definition it was never given the content for.
--
-- THE RELEASE-MOVE INTERACTION, HANDLED NOT DISCOVERED. `move_learning_-
-- assignment_release` required `r.course_id = a.course_id`. Under E1 (0054) a
-- revision is a NEW course, so a v1.0 -> v1.1 correction -- the exact thing
-- FABLE-05 §7 is about -- would have been refused on its first use, every time.
-- The check widens to "a release of this course, or of a course in this
-- course's lineage chain", and the assignment's own `course_id` moves with it
-- so the row stays coherent. `NOT_STARTED_ONLY`, the audit row per move and the
-- refusal of any automatic move are all unchanged. ADR-0015, ADR-0016.

create or replace function public.enforce_session_provenance() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_person uuid; v_inst uuid; v_period uuid; v_col text;
  v_new jsonb; v_old jsonb; v_release_owner uuid;
  v_provenance text[] := array['person_id','institution_id','enrollment_id','academic_period_id',
    'class_node_id','cohort_node_id','learning_assignment_id','assessment_assignment_id',
    'plp_release_id','assessment_definition_id','assessment_definition_version',
    'engine_version','scoring_policy_version','evidence_channel','evidence_class','mode',
    'shuffle_seed','created_at'];
begin
  if tg_op = 'INSERT' then
    -- the enrollment is the authoritative binding; person, institution and
    -- period are read from it, never accepted alongside it
    select e.person_id, e.institution_id, e.academic_period_id
      into v_person, v_inst, v_period
      from public.enrollments e where e.id = new.enrollment_id;
    if v_person is null then
      raise exception 'unknown enrollment %', new.enrollment_id;
    end if;
    new.person_id := v_person;
    new.institution_id := v_inst;
    new.academic_period_id := v_period;

    -- evidence_class is derived, never asserted. CHANGED IN NOTHING: it is
    -- still derived from the ENROLMENT's institution, so a session over
    -- canonical content carries the school's class, not the canonical tenant's.
    new.evidence_class := public.derive_evidence_class(v_inst, new.evidence_channel);

    -- The release belongs to the enrolment's institution, or it is canonical
    -- content that institution has been authorized to teach (0055, ADR-0015).
    select r.institution_id into v_release_owner
      from public.plp_releases r where r.id = new.plp_release_id;
    if v_release_owner is null then
      raise exception 'unknown release %', new.plp_release_id;
    end if;
    if v_release_owner <> v_inst
       and not public.release_is_distributed_to(new.plp_release_id, v_inst) then
      raise exception
        'the release does not belong to the enrolment''s institution, and is not canonical content distributed to it';
    end if;

    -- The definition belongs to the enrolment's institution, or to the SAME
    -- canonical tenant that owns the distributed release. A canonical
    -- definition is never reachable on its own: it rides the release's grant.
    if not exists (select 1 from public.assessment_definitions d
                    where d.id = new.assessment_definition_id and d.institution_id = v_inst) then
      if not exists (select 1 from public.assessment_definitions d
                      join public.institutions i on i.id = d.institution_id
                     where d.id = new.assessment_definition_id
                       and i.tenant_kind = 'PLATFORM_CANONICAL'
                       and d.institution_id = v_release_owner
                       and public.release_is_distributed_to(new.plp_release_id, v_inst)) then
        raise exception
          'the assessment definition does not belong to the enrolment''s institution, and is not canonical content distributed to it';
      end if;
    end if;
    return new;
  end if;

  v_new := to_jsonb(new); v_old := to_jsonb(old);
  foreach v_col in array v_provenance loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception 'assessment_sessions.% is provenance and immutable after insert (INV-33)', v_col;
    end if;
  end loop;
  return new;
end $$;

create or replace function public.move_learning_assignment_release(
  p_assignment uuid, p_to_release uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; v_actor uuid; v_moved int; v_left int; v_id uuid;
        v_target record; v_ok boolean;
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

  -- who has already started: anyone with a session on the current release
  -- under this assignment. They keep it; their provenance is immutable and
  -- nothing here touches a session row.
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
     set plp_release_id = p_to_release, course_id = v_target.course_id
   where id = p_assignment;

  perform public.audit_write('LEARNING_RELEASE_MOVED', 'learning_assignments',
    p_assignment::text, a.institution_id,
    jsonb_build_object('from_release', a.plp_release_id, 'to_release', p_to_release,
                       'from_course', a.course_id, 'to_course', v_target.course_id,
                       'learners_moved', v_moved, 'learners_left_in_place', v_left,
                       'reason', p_reason));
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Terminal verification. Builds two schools, a canonical tenant's release and
-- a grant, and rolls it all back (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  v_canon uuid; v_a uuid; v_b uuid; v_person uuid; v_uid uuid;
  v_ccourse uuid; v_crel uuid; v_bcourse uuid; v_brel uuid; n int;
begin
  select id into v_canon from public.institutions where tenant_kind = 'PLATFORM_CANONICAL' limit 1;
  if v_canon is null then raise exception 'no canonical tenant to probe with'; end if;

  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe A 0055', 'probe-a-0055', true, true) returning id into v_a;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe B 0055', 'probe-b-0055', true, true) returning id into v_b;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0055@local.invalid')
    returning id into v_uid;
    select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;

    insert into public.courses (institution_id, subject, stage, grade_label, title, status, author_person_id)
    values (v_canon, 'Matematika', 'SMA', 'X', 'probe canonical 0055', 'INGESTED', v_person)
    returning id into v_ccourse;
    insert into public.plp_releases (institution_id, course_id, version_label, status, author_person_id)
    values (v_canon, v_ccourse, '1.0.0', 'INGESTED', v_person) returning id into v_crel;

    insert into public.courses (institution_id, subject, stage, grade_label, title, status, author_person_id)
    values (v_b, 'Matematika', 'SMA', 'X', 'probe B course 0055', 'INGESTED', v_person)
    returning id into v_bcourse;
    insert into public.plp_releases (institution_id, course_id, version_label, status, author_person_id)
    values (v_b, v_bcourse, '1.0.0', 'INGESTED', v_person) returning id into v_brel;

    -- A: no grant yet
    if public.release_is_distributed_to(v_crel, v_a) then
      raise exception 'the canonical release is reachable before any grant exists';
    end if;

    insert into public.release_distributions
      (plp_release_id, institution_id, authorized_by_person_id, reason)
    values (v_crel, v_a, v_person, 'probe');

    if not public.release_is_distributed_to(v_crel, v_a) then
      raise exception 'the grant did not take effect';
    end if;

    -- THE refusal that matters: School B's release, granted to School A by a
    -- row that should mean nothing, is still refused.
    insert into public.release_distributions
      (plp_release_id, institution_id, authorized_by_person_id, reason)
    values (v_brel, v_a, v_person, 'probe institution-to-institution');
    if public.release_is_distributed_to(v_brel, v_a) then
      raise exception
        'a school-to-school distribution row took effect; tenant isolation for institution content is broken';
    end if;

    -- and a third school is not admitted by A's grant
    if public.release_is_distributed_to(v_crel, v_b) then
      raise exception 'the canonical grant to A admitted B';
    end if;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.release_distributions;
  if n <> 0 then raise exception 'the probe left % grant(s) behind', n; end if;

  -- Structural: both relaxed guards read the ONE predicate, not a second
  -- inlined copy of it that could drift. A future edit that inlines the
  -- condition instead turns this red.
  if pg_get_functiondef('public.enforce_session_provenance()'::regprocedure)
       !~ 'release_is_distributed_to' then
    raise exception 'the session provenance guard does not read the distribution predicate';
  end if;
  if pg_get_functiondef('public.move_learning_assignment_release(uuid,uuid,text)'::regprocedure)
       !~ 'release_is_distributed_to' then
    raise exception 'the release-move guard does not read the distribution predicate';
  end if;
  if pg_get_functiondef('public.move_learning_assignment_release(uuid,uuid,text)'::regprocedure)
       !~ 'course_lineage_chain' then
    raise exception 'the release-move guard does not read the lineage chain; every revision would be refused';
  end if;
  -- the old equality is gone; leaving it would refuse every revision
  if pg_get_functiondef('public.move_learning_assignment_release(uuid,uuid,text)'::regprocedure)
       ~ 'r\.course_id = a\.course_id' then
    raise exception 'the release-move guard still requires an exact course match';
  end if;
  -- and NOT_STARTED_ONLY is still the gate
  if pg_get_functiondef('public.move_learning_assignment_release(uuid,uuid,text)'::regprocedure)
       !~ 'NOT_STARTED_ONLY' then
    raise exception 'the release-move guard lost its correction-policy check';
  end if;
  -- INV-33's provenance list is intact
  if pg_get_functiondef('public.enforce_session_provenance()'::regprocedure)
       !~ 'INV-33' then
    raise exception 'the session provenance guard lost its immutability branch';
  end if;

  raise notice '0055 verified: canonical ownership admitted, school-to-school still refused, lineage move enabled';
end $$;

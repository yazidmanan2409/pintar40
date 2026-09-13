-- 0059 -- an assignment belongs to the school that made it, not to whoever
-- wrote the content.
--
-- THE DEFECT, FOUND BY BUILDING. `enforce_assignment_status()` stamps
-- `new.institution_id` from the ASSIGNED ARTEFACT -- the release for a learning
-- assignment, the definition for an assessment assignment:
--
--     select r.institution_id into v_inst from public.plp_releases r ...
--     new.institution_id := v_inst;
--
-- For institution-owned content that is invisible, because the school that owns
-- the release is the school that owns the class. For canonical content it is
-- wrong in the exact way FABLE-05 §5.5 forbids: the assignment a school makes
-- over PINTAR's release would be stamped with the CANONICAL tenant's id. Today
-- that simply fails -- the RLS WITH CHECK refuses, because a school holds no
-- capability in the canonical tenant -- and a school therefore cannot assign
-- canonical content at all. Had it succeeded it would have been worse: a
-- canonical tenant holding assignment rows for other people's classes, and a
-- `CAN_ASSIGN_LEARNING` check asking the wrong tenant's question.
--
-- THE FIX IS THE RULE §5.5 ALREADY STATES. An assignment is institution-scoped:
-- it belongs to the institution of the NODE it is assigned to -- the class, the
-- cohort -- which is the school making the decision. The artefact is then
-- checked rather than copied: it must be owned by that same institution, or be
-- canonical content that institution holds an active distribution grant for.
-- That is the same conjunctive predicate 0055's two guards read, so there is
-- still exactly one definition of "may this school use this content".
--
-- NOTHING MOVES FOR INSTITUTION CONTENT. When the node's institution and the
-- artefact's owner are the same -- every assignment that exists today -- the new
-- stamp writes the same value the old one did. The terminal block proves that
-- over every existing row rather than asserting it. ADR-0015.

create or replace function public.enforce_assignment_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_owner uuid; v_release uuid; v_legal boolean;
begin
  -- THE ASSIGNMENT'S TENANT IS THE NODE'S TENANT. The school that owns the
  -- class owns the decision to teach something to it (FABLE-05 §5.5).
  select n.institution_id into v_inst from public.org_nodes n where n.id = new.node_id;
  if v_inst is null then raise exception 'the assigned class or cohort does not exist'; end if;
  new.institution_id := v_inst;

  if tg_table_name = 'learning_assignments' then
    select r.institution_id into v_owner from public.plp_releases r where r.id = new.plp_release_id;
    v_release := new.plp_release_id;
  else
    select d.institution_id into v_owner from public.assessment_definitions d
     where d.id = new.assessment_definition_id;
    -- a canonical definition is never reachable on its own: it rides the
    -- learning assignment's release grant, exactly as in the session guard
    select l.plp_release_id into v_release from public.learning_assignments l
     where l.id = new.learning_assignment_id;
  end if;
  if v_owner is null then raise exception 'the assigned artefact does not exist'; end if;

  -- The artefact is this school's, or it is canonical content this school has
  -- been authorized to teach. Same predicate as the session guard (0055).
  if v_owner <> v_inst
     and not (v_release is not null and public.release_is_distributed_to(v_release, v_inst)) then
    raise exception
      'the assigned content belongs to another institution and is not canonical content distributed to this one';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'DRAFT' then
      raise exception 'an assignment is created at DRAFT, not %', new.status;
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if tg_table_name = 'learning_assignments' then
      select exists (select 1 from public.learning_assignment_status_transitions t
                      where t.from_status = old.status and t.to_status = new.status) into v_legal;
    else
      select exists (select 1 from public.assessment_assignment_status_transitions t
                      where t.from_status = old.status and t.to_status = new.status) into v_legal;
    end if;
    if not v_legal then
      raise exception 'illegal assignment transition % -> % on %', old.status, new.status, tg_table_name;
    end if;
    -- assigning learning is a capability, not a side effect of editing a row
    -- one trigger serves two enums, so the comparison is on the label.
    -- CHANGED IN 0059: asked of the ASSIGNING school, which is the tenant that
    -- must hold the capability -- not of whoever authored the content.
    if new.status::text in ('ACTIVE','SCHEDULED','OPEN') then
      if not public.can_in_institution('CAN_ASSIGN_LEARNING', v_inst) then
        raise exception 'assigning requires CAN_ASSIGN_LEARNING in the owning institution';
      end if;
      new.assigned_by_person_id := coalesce(new.assigned_by_person_id, public.current_person_id());
      new.assigned_at := coalesce(new.assigned_at, now());
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Terminal verification.
--
-- The first half is a property over the rows that already exist, which is the
-- honest way to show a rewritten stamp changes nothing: for every assignment in
-- the database, the node's institution and the artefact owner's institution
-- already agree, so old rule and new rule produce the same value.
-- ---------------------------------------------------------------------------
do $$
declare n int; v_canon uuid; v_raised boolean;
begin
  select count(*) into n from public.learning_assignments a
    join public.org_nodes nd on nd.id = a.node_id
    join public.plp_releases r on r.id = a.plp_release_id
   where nd.institution_id is distinct from a.institution_id
      or (r.institution_id is distinct from a.institution_id
          and not public.release_is_distributed_to(a.plp_release_id, a.institution_id));
  if n <> 0 then
    raise exception '% existing learning assignment(s) disagree with the node-scoped rule', n;
  end if;

  select count(*) into n from public.assessment_assignments a
    join public.org_nodes nd on nd.id = a.node_id
   where nd.institution_id is distinct from a.institution_id;
  if n <> 0 then
    raise exception '% existing assessment assignment(s) are not scoped to their node''s institution', n;
  end if;

  -- structural: the stamp reads the node, and the capability question is asked
  -- of the assigning school
  if pg_get_functiondef('public.enforce_assignment_status()'::regprocedure)
       !~ 'from public\.org_nodes n where n\.id = new\.node_id' then
    raise exception 'the assignment tenant is no longer read from the node';
  end if;
  if pg_get_functiondef('public.enforce_assignment_status()'::regprocedure)
       !~ 'release_is_distributed_to' then
    raise exception 'the assignment guard does not read the distribution predicate';
  end if;

  -- and an assignment over content belonging to neither this school nor a
  -- distributing canonical tenant is refused. Built and rolled back.
  select id into v_canon from public.institutions where tenant_kind = 'PLATFORM_CANONICAL' limit 1;
  declare v_a uuid; v_b uuid; v_node uuid; v_course uuid; v_rel uuid; v_period uuid;
          v_fac uuid; v_dep uuid; v_prog uuid; v_coh uuid;
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe A 0059', 'probe-a-0059', true, true) returning id into v_a;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe B 0059', 'probe-b-0059', true, true) returning id into v_b;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_a, '2026/27', date '2026-07-01', date '2027-06-30') returning id into v_period;
    -- the containment chain is INSTITUTION > FACULTY > DEPARTMENT > PROGRAMME
    -- > COHORT > CLASS, and org_nodes_before_write enforces it
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_a, v_a, 'FACULTY', 'probe faculty 0059') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_a, v_fac, 'DEPARTMENT', 'probe department 0059') returning id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_a, v_dep, 'PROGRAMME', 'probe programme 0059') returning id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_a, v_prog, 'COHORT', 'probe cohort 0059', v_period) returning id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_a, v_coh, 'CLASS', 'probe class 0059', v_period) returning id into v_node;

    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_b, 'Matematika', 'SD', 'Kelas 5', 'probe B course 0059') returning id into v_course;
    insert into public.plp_releases (institution_id, course_id, version_label)
    values (v_b, v_course, '1.0.0') returning id into v_rel;

    v_raised := false;
    begin
      insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id,
        academic_period_id, learning_cycle)
      values (v_a, v_rel, v_course, v_node, v_period, '{}'::jsonb);
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a school assigned another school''s release';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the cross-school assignment probe did not run'; end if;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug like 'probe-%-0059';
  if n <> 0 then raise exception 'the probe left % institution(s) behind', n; end if;

  raise notice '0059 verified: an assignment is scoped to its node''s institution, and its content is checked not copied';
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- EDUCATOR AS LEARNER (BOB-43 to BOB-47; D-069, D-070 with (g)-(i);
-- docs/coordination/design/EDUCATOR-AS-LEARNER-TICKETS.md).
--
-- A school can make a Bagian for its educators' professional learning, place
-- an existing Guru in it as a participant, and teach them there, without the
-- Guru ever becoming a «Murid» and without one academic reading moving.
--
--   BOB-43  a place knows its purpose. One value per org node, set on the
--           Bagian when it is created, inherited by the hidden Reguler and
--           every Tingkat and Kelas below, never changed. Material whose
--           course context differs from its place's is refused on both
--           assignment tables, for every write path (PR050
--           ASSIGN_CONTEXT_MISMATCH). Siapkan asks the database which
--           releases a Kelas may be given.
--   BOB-44  enrol an existing person: one audited action that places a person
--           who currently holds a staff role at the school (D-070(c)) in a
--           professional-learning Kelas or Tingkat, reusing their enrolment
--           for the period. The staff-role rule is enforced on memberships,
--           so the intake and a direct insert meet it too; an enrolment never
--           mixes the two purposes.
--   BOB-45  the meaning reaches the screens as a kind (LEARNER/PARTICIPANT),
--           never as the context: org_nodes.member_kind,
--           member_kind(enrollments), school_structure. Management's learner
--           record and the briefing count academic learners only.
--   BOB-46  professional-learning evidence is closed by default at the
--           database (PD rows only; every academic branch is carried over
--           unchanged): sessions to the participant and the ruled audiences;
--           progress likewise but not Admin sekolah; answers and presented
--           items to the participant (and Admin platform's existing read);
--           integrity signals to no school role, and never referred.
--   BOB-47  the ruled audiences read a professional-learning record per place,
--           scores through learner.result in catalogue MC-5 (D-060(a)): the
--           PD gate admits a PD result only inside that read, at that place.
--
-- src stays context-blind (R10, UX1-AJAR-KONTEKS-01): the Konfigurasi form
-- passes a boolean, every read returns a kind.
--
-- NO STORED ROW IS REWRITTEN except the backfill of the new column, which
-- gives every existing place below a school's Jenjang the value ACADEMIC: no
-- professional-learning place exists before this migration.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────── 0. the pre-check (read-only)
-- Every node will be ACADEMIC, so an assignment of professional-development
-- material anywhere is a mismatch the boundary would have refused. Expected 0
-- on the local seed, staging and production; reported, never repaired.
do $$
declare n_la int; n_aa int;
begin
  select count(*) into n_la
    from public.learning_assignments la
    join public.plp_releases r on r.id = la.plp_release_id
    join public.courses c on c.id = r.course_id
   where c.learning_context <> 'ACADEMIC';
  select count(*) into n_aa
    from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
    left join public.modules m on m.id = d.module_id
    join public.courses c on c.id = coalesce(d.course_id, m.course_id)
   where c.learning_context <> 'ACADEMIC';
  raise notice 'BOB-43 pre-check: % learning assignment(s) and % assessment assignment(s) carry material whose context differs from the value their place receives (ACADEMIC)', n_la, n_aa;
end $$;

-- ═══════════════════════════════════════════════════════════ 1. BOB-43

alter table public.org_nodes add column learning_context public.learning_context;

-- every place below a Jenjang is academic today; the school and its Jenjang carry none
update public.org_nodes set learning_context = 'ACADEMIC'
 where kind not in ('INSTITUTION', 'FACULTY');

-- THE KIND A MEMBER OF THIS PLACE IS. What every staff surface reads instead of
-- the context: «Murid» for a LEARNER, «Peserta» for a PARTICIPANT (DAISY-33).
alter table public.org_nodes add column member_kind text generated always as (
  case learning_context when 'PROFESSIONAL_DEVELOPMENT' then 'PARTICIPANT'
                        when 'ACADEMIC' then 'LEARNER' end) stored;

comment on column public.org_nodes.learning_context is
  'BOB-43 (D-069(d)): what this place is for. Set on the Bagian when it is created (ACADEMIC unless created for '
  'educators'' professional learning), inherited by every node below it, never changed; null above the Bagian.';
comment on column public.org_nodes.member_kind is
  'BOB-45: the kind a member of this place is, LEARNER (academic) or PARTICIPANT (professional learning). Staff '
  'surfaces read this, never learning_context (R10).';

create or replace function public.org_nodes_before_write()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare p record;
begin
  if new.kind = 'INSTITUTION' then
    if new.parent_id is not null then raise exception 'institution root has no parent'; end if;
    if new.id <> new.institution_id then raise exception 'institution root node id must equal institutions.id'; end if;
    new.jalur := array[new.id];
  else
    if new.parent_id is null then raise exception 'non-root node requires a parent'; end if;
    select * into p from public.org_nodes where id = new.parent_id;
    if p.id is null then raise exception 'parent not found'; end if;
    if p.institution_id <> new.institution_id then raise exception 'parent belongs to another institution (INV-13)'; end if;
    if public.org_kind_level(p.kind) + 1 <> public.org_kind_level(new.kind) then
      raise exception 'invalid containment: % cannot be a child of %', new.kind, p.kind;
    end if;
    new.jalur := p.jalur || new.id;
  end if;
  if new.kind in ('COHORT','CLASS') then
    if new.academic_period_id is null then raise exception '% requires an academic period', new.kind; end if;
    if not exists (select 1 from public.academic_periods ap where ap.id = new.academic_period_id and ap.institution_id = new.institution_id) then
      raise exception 'academic period belongs to another institution';
    end if;
    if new.kind = 'CLASS' and p.academic_period_id <> new.academic_period_id then
      raise exception 'class must share its cohort''s academic period';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.institution_id <> old.institution_id then
    raise exception 'nodes never change institution';
  end if;

  -- BOB-43: WHAT THE PLACE IS FOR. The Bagian says it (academic unless created
  -- for professional learning); everything below takes its Bagian's; nothing
  -- above a Bagian has one. Set at creation, never changed: an unused Bagian
  -- with the wrong value is replaced, not edited (D-069(d)).
  if tg_op = 'UPDATE' and new.learning_context is distinct from old.learning_context then
    raise exception 'a place''s learning_context is set when it is created and never changes (D-069(d))';
  end if;
  if new.kind in ('INSTITUTION', 'FACULTY') then
    if new.learning_context is not null then
      raise exception 'a school and its Jenjang carry no learning_context; a Bagian does';
    end if;
  elsif new.kind = 'DEPARTMENT' then
    if tg_op = 'INSERT' then new.learning_context := coalesce(new.learning_context, 'ACADEMIC'); end if;
  else
    if tg_op = 'INSERT' and new.learning_context is not null
       and new.learning_context is distinct from p.learning_context then
      raise exception 'a % takes its Bagian''s learning_context', new.kind;
    end if;
    if tg_op = 'INSERT' then new.learning_context := p.learning_context; end if;
    -- a move under a Bagian of the other purpose
    if new.learning_context is distinct from p.learning_context then
      raise exception 'a % never moves under a Bagian of another learning_context (D-069(d))', new.kind;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.org_nodes_before_write() from public, anon, authenticated;

-- org_nodes_before_write fires only when a node's parent, kind, school or year changes, so the value's own
-- immutability is a trigger of its own, on the column itself
create or replace function public.org_nodes_context_fixed()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.learning_context is distinct from old.learning_context then
    raise exception 'a place''s learning_context is set when it is created and never changes (D-069(d))';
  end if;
  return new;
end $$;
revoke all on function public.org_nodes_context_fixed() from public, anon, authenticated;
create trigger org_nodes_context_fixed before update of learning_context on public.org_nodes
  for each row execute function public.org_nodes_context_fixed();

-- create_bagian learns one choice. A boolean, so the form that asks it (DAISY-32)
-- never names the context (R10). Two-argument callers keep their meaning.
drop function public.create_bagian(uuid, text);
create function public.create_bagian(p_institution uuid, p_name text, p_for_educators boolean default false)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.org_nodes; v_name text; v_jenjang uuid; v_id uuid; v_reguler uuid;
begin
  r := public.structure_node(p_institution);
  perform public.structure_lock(r.institution_id);
  if r.kind <> 'INSTITUTION' then perform public.structure_refuse('STRUCTURE_PARENT_INVALID'); end if;
  v_name := public.structure_clean_name(p_name);
  if public.structure_name_taken(r.id, 'DEPARTMENT', v_name, null, null, null) then
    perform public.structure_refuse('STRUCTURE_NAME_TAKEN');
  end if;
  v_jenjang := public.structure_jenjang(r.id);
  insert into public.org_nodes (institution_id, parent_id, kind, name, learning_context)
  values (r.id, v_jenjang, 'DEPARTMENT', v_name,
          case when coalesce(p_for_educators, false) then 'PROFESSIONAL_DEVELOPMENT' else 'ACADEMIC' end::public.learning_context)
  returning id into v_id;
  v_reguler := public.structure_reguler(v_id);
  perform public.audit_write('structure.bagian_created', 'org_nodes', v_id::text, r.id,
    jsonb_build_object('name', v_name, 'jenjang', v_jenjang, 'reguler', v_reguler,
                       'for_educators', coalesce(p_for_educators, false)));
  return v_id;
end $$;
revoke all on function public.create_bagian(uuid, text, boolean) from public, anon;
grant execute on function public.create_bagian(uuid, text, boolean) to authenticated;
update public.client_rpc_registry
   set note = 'BOB-01: creates a Bagian (DEPARTMENT) under the school''s hidden Jenjang, making the Jenjang on first '
           || 'need and a hidden Reguler (PROGRAMME) with it. BOB-43: p_for_educators makes it a place for educators'' '
           || 'professional learning, inherited below and never changed. Audited. Refusals are PR020 with a stable code '
           || 'in DETAIL.'
 where function_name = 'create_bagian';

-- THE REFUSAL. assign_refuse learns its one new code.
create or replace function public.assign_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR050',
    detail  = p_code,
    message = case p_code
      when 'ASSIGN_NOT_ALLOWED'           then 'assigning learning requires CAN_ASSIGN_LEARNING in the class''s institution'
      when 'ASSIGN_CLASS_INVALID'         then 'learning is assigned to an active class or cohort with an academic period'
      when 'ASSIGN_RELEASE_NOT_PUBLISHED' then 'only a PUBLISHED release is assigned'
      when 'ASSIGN_WINDOW_INVALID'        then 'the assignment closes before it opens'
      when 'ASSIGN_EXISTS'                then 'this release is already assigned to this class'
      when 'ASSIGN_PRE_TEST_MISSING'      then 'the lesson has no approved pre-test (Pemetaan awal)'
      when 'ASSIGN_POST_TEST_MISSING'     then 'the lesson has no approved post-test (Cek penguasaan)'
      when 'ASSIGN_PRE_TEST_TOO_SHORT'    then 'the pre-test asks for more questions than the lesson has for it'
      when 'ASSIGN_POST_TEST_TOO_SHORT'   then 'the post-test asks for more questions than the lesson has for it'
      when 'ASSIGN_CYCLE_OVERLAP'         then 'the post-test cannot be drawn apart from the pre-test and its parallel questions (INV-24)'
      when 'CYCLE_NOT_ASSIGNED'           then 'this learning assignment is not assigned to you'
      when 'ASSIGN_CONTEXT_MISMATCH'      then 'this material is for another learning_context than the place it is given to (BOB-43)'
      else 'the assignment could not be made' end;
end $$;
revoke all on function public.assign_refuse(text) from public, anon, authenticated;

-- THE BOUNDARY, on both assignment tables, for every write path. The material's
-- context is its course's (a learning assignment's release; an assessment
-- definition's course or its chapter's); the place's is its node's. A place
-- above a Bagian has none, so nothing attaches there.
create or replace function public.assignment_material_context(p_release uuid, p_definition uuid)
returns public.learning_context language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when p_release is not null then
      (select c.learning_context from public.plp_releases r join public.courses c on c.id = r.course_id
        where r.id = p_release)
    else
      (select c.learning_context from public.assessment_definitions d
         left join public.modules m on m.id = d.module_id
         join public.courses c on c.id = coalesce(d.course_id, m.course_id)
        where d.id = p_definition)
  end
$$;
revoke all on function public.assignment_material_context(uuid, uuid) from public, anon, authenticated;

create or replace function public.enforce_assignment_context()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_place public.learning_context; v_material public.learning_context;
begin
  if tg_table_name = 'learning_assignments' then
    if tg_op = 'UPDATE' and new.node_id = old.node_id and new.plp_release_id = old.plp_release_id then
      return new;
    end if;
    v_material := public.assignment_material_context(new.plp_release_id, null);
  else
    if tg_op = 'UPDATE' and new.node_id = old.node_id
       and new.assessment_definition_id = old.assessment_definition_id then
      return new;
    end if;
    v_material := public.assignment_material_context(null, new.assessment_definition_id);
  end if;
  select n.learning_context into v_place from public.org_nodes n where n.id = new.node_id;
  -- fail closed: unknown provenance on either side is a mismatch, never "academic"
  if v_place is null or v_material is null or v_place <> v_material then
    perform public.assign_refuse('ASSIGN_CONTEXT_MISMATCH');
  end if;
  return new;
end $$;
revoke all on function public.enforce_assignment_context() from public, anon, authenticated;

create trigger learning_assignments_context_matches_place
  before insert or update on public.learning_assignments
  for each row execute function public.enforce_assignment_context();
create trigger assessment_assignments_context_matches_place
  before insert or update on public.assessment_assignments
  for each row execute function public.enforce_assignment_context();

-- SIAPKAN asks which of the releases it holds this place may be given, so src
-- never compares contexts itself. It answers only a reader who may assign or
-- draft in that school, and only about the ids it was handed.
create or replace function public.releases_matching_place(p_node uuid, p_releases uuid[])
returns setof uuid language sql stable security definer set search_path = public, pg_temp as $$
  select r.id
    from public.org_nodes n
    join public.plp_releases r on r.id = any (p_releases)
    join public.courses c on c.id = r.course_id
   where n.id = p_node
     and c.learning_context = n.learning_context
     and (public.can_in_institution('CAN_ASSIGN_LEARNING', n.institution_id)
          or public.can_in_institution('CAN_DRAFT', n.institution_id))
$$;
revoke all on function public.releases_matching_place(uuid, uuid[]) from public, anon;
grant execute on function public.releases_matching_place(uuid, uuid[]) to authenticated;

-- THE STANDING ASSERTION, run by F06-P08 with the others.
create or replace function public.assert_assignments_match_their_place()
returns table (ok boolean, detail text) language plpgsql stable set search_path = public, pg_temp as $$
declare n_la int; n_aa int; n_nodes int; n_above int;
begin
  select count(*) into n_la from public.learning_assignments la
    join public.org_nodes n on n.id = la.node_id
   where n.learning_context is distinct from public.assignment_material_context(la.plp_release_id, null);
  select count(*) into n_aa from public.assessment_assignments aa
    join public.org_nodes n on n.id = aa.node_id
   where n.learning_context is distinct from public.assignment_material_context(null, aa.assessment_definition_id);
  -- every place below a Bagian carries its Bagian's value, and nothing above one carries any
  select count(*) into n_nodes from public.org_nodes c join public.org_nodes p on p.id = c.parent_id
   where c.kind not in ('INSTITUTION', 'FACULTY', 'DEPARTMENT')
     and c.learning_context is distinct from p.learning_context;
  select count(*) into n_above from public.org_nodes n
   where (n.kind in ('INSTITUTION', 'FACULTY') and n.learning_context is not null)
      or (n.kind not in ('INSTITUTION', 'FACULTY') and n.learning_context is null);
  if n_la + n_aa + n_nodes + n_above > 0 then
    return query select false, format('%s learning and %s assessment assignment(s) whose material''s context differs '
      || 'from their place''s; %s place(s) not carrying their parent''s; %s place(s) with a value where none belongs '
      || 'or none where one does', n_la, n_aa, n_nodes, n_above);
  else
    return query select true, 'every assignment''s material shares its place''s learning context, every place below a '
      || 'Bagian carries its Bagian''s, and nothing above a Bagian carries one (BOB-43)';
  end if;
end $$;
revoke all on function public.assert_assignments_match_their_place() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ 2. BOB-44

create or replace function public.professional_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR090',
    detail  = p_code,
    message = case p_code
      when 'PD_NOT_ALLOWED'             then 'enrolling for professional learning requires CAN_PROVISION_PEOPLE at the place''s school'
      when 'PD_PLACE_INVALID'           then 'a participant is placed in an active Kelas or Tingkat with an academic period'
      when 'PD_PLACE_NOT_FOR_EDUCATORS' then 'this place is not for educators'' professional learning'
      when 'PD_PERSON_NOT_STAFF'        then 'only a person who currently holds a staff role at the school is placed in professional learning (D-070(c))'
      when 'PD_ALREADY_ENROLLED'        then 'this person is already a participant here'
      when 'PD_OTHER_PURPOSE'           then 'an enrolment is for learning or for professional learning, never both'
      when 'PD_SIGNAL_NOT_REFERRED'     then 'a professional-learning integrity signal is recorded and never referred (D-069(c))'
      when 'PD_RECORD_NOT_ALLOWED'      then 'this professional-learning record is for its facilitator, the Kepala departemen over it, the Dekan and Admin sekolah'
      else 'the professional-learning action could not be completed' end;
end $$;
revoke all on function public.professional_refuse(text) from public, anon, authenticated;

-- D-070(c): a current staff role at the school -- unrevoked, within its
-- validity, scoped inside that school.
create or replace function public.person_holds_staff_role_at(p_person uuid, p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id
     where ra.person_id = p_person and s.institution_id = p_institution
       and ra.role in ('EDUCATOR', 'HEAD_OF_DEPARTMENT', 'DEAN', 'INSTITUTION_ADMIN')
       and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)
$$;
revoke all on function public.person_holds_staff_role_at(uuid, uuid) from public, anon, authenticated;

-- ON MEMBERSHIPS, for every path (C1, the intake, a class move, the rollover,
-- a direct insert): a professional-learning place takes only a current staff
-- member of the school, checked when they are placed (D-070(g): a role that
-- lapses later removes nothing); and one enrolment is for one purpose.
create or replace function public.memberships_purpose()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ctx public.learning_context; v_inst uuid; v_person uuid;
begin
  select n.learning_context, n.institution_id into v_ctx, v_inst from public.org_nodes n where n.id = new.node_id;
  select e.person_id into v_person from public.enrollments e where e.id = new.enrollment_id;
  if v_ctx = 'PROFESSIONAL_DEVELOPMENT' and not public.person_holds_staff_role_at(v_person, v_inst) then
    perform public.professional_refuse('PD_PERSON_NOT_STAFF');
  end if;
  if exists (select 1 from public.memberships m join public.org_nodes n on n.id = m.node_id
              where m.enrollment_id = new.enrollment_id and m.id <> new.id
                and n.learning_context is distinct from v_ctx) then
    perform public.professional_refuse('PD_OTHER_PURPOSE');
  end if;
  return new;
end $$;
revoke all on function public.memberships_purpose() from public, anon, authenticated;
create trigger memberships_purpose before insert on public.memberships
  for each row execute function public.memberships_purpose();

-- C1: ENROL AN EXISTING PERSON. No person, account or institutional number is
-- made; display_role is untouched; the enrolment is ACTIVE when the person can
-- sign in and PENDING otherwise, so activation keeps its meaning.
create or replace function public.enrol_for_professional_learning(p_person uuid, p_node uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare n public.org_nodes; v_enr uuid; v_status public.enrollment_status; v_reused boolean := true; v_m uuid;
begin
  select * into n from public.org_nodes o where o.id = p_node;
  if n.id is null or not public.can_in_institution('CAN_PROVISION_PEOPLE', n.institution_id) then
    perform public.professional_refuse('PD_NOT_ALLOWED');
  end if;
  if n.kind not in ('CLASS', 'COHORT') or not n.is_active or n.academic_period_id is null then
    perform public.professional_refuse('PD_PLACE_INVALID');
  end if;
  if n.learning_context is distinct from 'PROFESSIONAL_DEVELOPMENT' then
    perform public.professional_refuse('PD_PLACE_NOT_FOR_EDUCATORS');
  end if;
  -- an unknown person, another school's and one without a current staff role here answer alike
  if p_person is null or not public.person_holds_staff_role_at(p_person, n.institution_id) then
    perform public.professional_refuse('PD_PERSON_NOT_STAFF');
  end if;
  -- one placement at a time per person: a double click is one
  perform 1 from public.persons p where p.id = p_person for update;

  select e.id, e.status into v_enr, v_status from public.enrollments e
   where e.person_id = p_person and e.institution_id = n.institution_id
     and e.academic_period_id = n.academic_period_id and e.status in ('PENDING', 'ACTIVE')
   order by e.created_at desc limit 1;
  if v_enr is not null and exists (select 1 from public.memberships m
                                    where m.enrollment_id = v_enr and m.node_id = n.id and m.valid_to is null) then
    perform public.professional_refuse('PD_ALREADY_ENROLLED');
  end if;
  if v_enr is null then
    v_reused := false;
    v_status := case when exists (select 1 from public.accounts a where a.person_id = p_person)
                     then 'ACTIVE' else 'PENDING' end;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (p_person, n.institution_id, n.academic_period_id, v_status) returning id into v_enr;
  end if;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (v_enr, n.id, n.academic_period_id) returning id into v_m;

  perform public.audit_write('professional_learning.enrolled', 'memberships', v_m::text, n.institution_id,
    jsonb_build_object('person_id', p_person, 'node_id', n.id, 'enrollment_id', v_enr,
                       'enrollment_reused', v_reused, 'enrollment_status', v_status));
  return jsonb_build_object('ok', true, 'membership', v_m, 'enrollment', v_enr, 'enrollment_status', v_status,
                            'enrollment_reused', v_reused);
end $$;
revoke all on function public.enrol_for_professional_learning(uuid, uuid) from public, anon;
grant execute on function public.enrol_for_professional_learning(uuid, uuid) to authenticated;

-- THE FORM'S TWO READS (DAISY-32): the places this reader may enrol into, and
-- the people D-070(c) allows. Both answer nothing to anyone else.
create or replace function public.professional_learning_places(p_institution uuid)
returns table (node_id uuid, level text, name text, tingkat text, academic_year text)
language sql stable security definer set search_path = public, pg_temp as $$
  select n.id, case n.kind when 'COHORT' then 'TINGKAT' else 'KELAS' end, n.name,
         case n.kind when 'CLASS' then t.name end, ap.name
    from public.org_nodes n
    left join public.org_nodes t on t.id = n.parent_id and n.kind = 'CLASS'
    left join public.academic_periods ap on ap.id = n.academic_period_id
   where n.institution_id = p_institution and n.kind in ('COHORT', 'CLASS') and n.is_active
     and n.learning_context = 'PROFESSIONAL_DEVELOPMENT'
     and public.can_in_institution('CAN_PROVISION_PEOPLE', p_institution)
   order by ap.name, coalesce(t.name, n.name), n.kind, n.name
$$;
revoke all on function public.professional_learning_places(uuid) from public, anon;
grant execute on function public.professional_learning_places(uuid) to authenticated;

create or replace function public.professional_learning_candidates(p_institution uuid)
returns table (person_id uuid, display_name text)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.display_name
    from public.persons p
   where public.can_in_institution('CAN_PROVISION_PEOPLE', p_institution)
     and public.person_holds_staff_role_at(p.id, p_institution)
   order by p.display_name, p.id
$$;
revoke all on function public.professional_learning_candidates(uuid) from public, anon;
grant execute on function public.professional_learning_candidates(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ 3. BOB-45

-- The kind of an enrolment, as a PostgREST computed field: PARTICIPANT when its
-- places are for professional learning (an enrolment never mixes the two),
-- LEARNER otherwise. Read with the caller's rights.
create or replace function public.member_kind(e public.enrollments)
returns text language sql stable set search_path = public, pg_temp as $$
  select case when exists (select 1 from public.memberships m join public.org_nodes n on n.id = m.node_id
                            where m.enrollment_id = e.id and n.member_kind = 'PARTICIPANT')
              then 'PARTICIPANT' else 'LEARNER' end
$$;
revoke all on function public.member_kind(public.enrollments) from public, anon;
grant execute on function public.member_kind(public.enrollments) to authenticated;

-- school_structure returns each place's kind as well (DAISY-32 shows it, read-only)
drop function public.school_structure(uuid);
create function public.school_structure(p_institution uuid)
returns table (node_id uuid, level text, parent_id uuid, name text, academic_year text, is_active boolean,
               active_members integer, member_kind text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.org_nodes r where r.id = p_institution and r.kind = 'INSTITUTION')
     or not public.has_scope('INSTITUTION_ADMIN', p_institution) then
    perform public.structure_refuse('STRUCTURE_NOT_ALLOWED');
  end if;
  -- BOB-08 (f): the canonical library is a tenant, not a school
  if (select i.tenant_kind from public.institutions i where i.id = p_institution) is distinct from 'INSTITUTION' then
    perform public.structure_refuse('STRUCTURE_NOT_A_SCHOOL');
  end if;
  return query
    select n.id,
           case n.kind when 'DEPARTMENT' then 'BAGIAN' when 'COHORT' then 'TINGKAT' else 'KELAS' end,
           -- the parent the screen shows: none for a Bagian, the Bagian above
           -- the hidden Reguler for a Tingkat, the Tingkat for a Kelas
           case n.kind when 'DEPARTMENT' then null::uuid
                       when 'COHORT' then (select pr.parent_id from public.org_nodes pr where pr.id = n.parent_id)
                       else n.parent_id end,
           n.name, ap.name, n.is_active,
           case when n.kind = 'DEPARTMENT' then null::int
                else (select count(*)::int from public.memberships m
                       where m.node_id = n.id and m.valid_to is null) end,
           n.member_kind
      from public.org_nodes n
      left join public.academic_periods ap on ap.id = n.academic_period_id
     where n.institution_id = p_institution
       and n.kind in ('DEPARTMENT', 'COHORT', 'CLASS')
     order by public.org_kind_level(n.kind), lower(n.name), ap.name, n.id;
end $$;
revoke all on function public.school_structure(uuid) from public, anon;
grant execute on function public.school_structure(uuid) to authenticated;
update public.client_rpc_registry
   set note = 'BOB-01: the Bagian, Tingkat and Kelas of one school, with the parent the screen shows, the academic year, '
           || 'the active flag and the count of students placed; BOB-45: and the kind a member of each place is '
           || '(LEARNER or PARTICIPANT). For an Admin sekolah or Admin platform of that school; refuses everyone else '
           || 'with PR020 STRUCTURE_NOT_ALLOWED.'
 where function_name = 'school_structure';

-- MANAGEMENT'S LEARNER RECORD lists academic placements only; a professional-
-- learning participant is seen on the professional-learning record (D-070(a)).
-- In a school with no professional-learning place every line below returns
-- exactly what it did.
create or replace function public.management_learner_detail(p_person uuid, p_institution uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid; v_roles public.app_role[]; v_boundary uuid; v_cat text;
  v_person record; v_enr record; v_placement jsonb; v_history jsonb; v_results jsonb;
  v_min integer; v_ready public.evidence_readiness_state;
begin
  v_me := public.current_person_id();
  v_roles := public.management_learner_roles();

  if v_me is null or p_person is null or p_institution is null then
    raise exception 'opening a learner''s record is for a HEAD_OF_DEPARTMENT or DEAN standing over that learner';
  end if;
  v_boundary := public.audience_scope_over_learner(v_roles, p_person, p_institution);
  if v_boundary is null then
    raise exception 'opening a learner''s record is for a HEAD_OF_DEPARTMENT or DEAN standing over that learner';
  end if;

  select p.id, p.display_name into v_person from public.persons p where p.id = p_person;

  -- BOB-45: the learner's enrolment, never a professional-learning one
  select e.status, e.academic_period_id, e.programme_id into v_enr
    from public.enrollments e
   where e.person_id = p_person and e.institution_id = p_institution
     and public.member_kind(e) = 'LEARNER'
   order by e.created_at desc limit 1;

  -- D-088(i): where the learner is NOW (open placements of a current
  -- enrolment), and apart from it the places they have left, with when and why;
  -- BOB-45: academic places only
  select coalesce(jsonb_agg(jsonb_build_object('node_id', n.id, 'kind', n.kind, 'name', n.name)
                            order by cardinality(n.jalur)), '[]'::jsonb)
    into v_placement
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
    join public.org_nodes n on n.id = m.node_id
   where e.person_id = p_person and e.institution_id = p_institution
     and n.institution_id = p_institution and n.member_kind = 'LEARNER'
     and m.valid_to is null and e.status in ('PENDING', 'ACTIVE');

  select coalesce(jsonb_agg(jsonb_build_object('node_id', n.id, 'kind', n.kind, 'name', n.name,
                                               'academic_year', ap.name,
                                               'from', m.valid_from, 'until', m.valid_to,
                                               'reason', m.close_reason)
                            order by m.valid_to desc, cardinality(n.jalur)), '[]'::jsonb)
    into v_history
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
    join public.org_nodes n on n.id = m.node_id
    left join public.academic_periods ap on ap.id = m.academic_period_id
   where e.person_id = p_person and e.institution_id = p_institution
     and n.institution_id = p_institution and n.member_kind = 'LEARNER'
     and m.valid_to is not null;

  v_cat := public.current_metric_catalogue();
  if v_cat is not null then
    begin
      perform set_config('pintar.metric_boundary_node', v_boundary::text, true);
      perform set_config('pintar.metric_boundary_person', '', true);
      v_results := public.calc_learner_result(p_person, p_institution, v_cat) -> 'value';
      perform set_config('pintar.metric_boundary_node', '', true);
    exception when others then
      perform set_config('pintar.metric_boundary_node', '', true);
      raise;
    end;
    select m.minimum_sample into v_min from public.metric_definitions m
     where m.catalogue_version = v_cat and m.metric_id = 'learner.result';
  end if;
  v_ready := public.evidence_readiness(
               case when jsonb_typeof(v_results) = 'array' then jsonb_array_length(v_results) else 0 end,
               v_min);

  perform public.audit_write('learner_detail.opened', 'persons', p_person::text, p_institution,
    jsonb_build_object('roles', to_jsonb(v_roles)));

  return jsonb_build_object(
    'person_id', v_person.id,
    'display_name', v_person.display_name,
    'institution_id', p_institution,
    'enrolment_status', v_enr.status,
    'academic_period', (select ap.name from public.academic_periods ap where ap.id = v_enr.academic_period_id),
    'programme', (select n.name from public.org_nodes n where n.id = v_enr.programme_id),
    'placement', coalesce(v_placement, '[]'::jsonb),
    'placement_history', coalesce(v_history, '[]'::jsonb),
    'official_results', coalesce(v_results, '[]'::jsonb),
    'official_results_readiness', v_ready,
    'catalogue_version', v_cat);
end $$;
revoke all on function public.management_learner_detail(uuid, uuid) from public, anon;
grant execute on function public.management_learner_detail(uuid, uuid) to authenticated;

-- THE BRIEFING counts academic POST_TEST participants only.
create or replace function public.release_is_professional(p_release uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select c.learning_context = 'PROFESSIONAL_DEVELOPMENT'
                     from public.plp_releases r join public.courses c on c.id = r.course_id
                    where r.id = p_release), false)
$$;
revoke all on function public.release_is_professional(uuid) from public, anon;
grant execute on function public.release_is_professional(uuid) to authenticated;

create or replace function public.advance_briefing(p_briefing uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare b public.briefings; v_cat text; d public.metric_definitions; v_have int;
        v_rep jsonb; v_tmpl uuid; v_ver int;
begin
  select * into b from public.briefings where id = p_briefing for update;
  if b.id is null then raise exception 'no such briefing'; end if;
  if not public.can_in_institution('CAN_ASSIGN_LEARNING', b.institution_id)
     and not public.is_system_admin() then
    raise exception 'advancing a briefing requires CAN_ASSIGN_LEARNING in that institution';
  end if;
  if b.state <> 'COLLECTING' then
    return jsonb_build_object('state', b.state, 'changed', false);
  end if;

  v_cat := public.current_metric_catalogue();
  select * into d from public.metric_definitions
   where catalogue_version = v_cat and metric_id = 'class.comprehension';
  if d.metric_id is null then raise exception 'catalogue % carries no class.comprehension', v_cat; end if;

  -- BOB-45: academic participants only; a professional-learning post-test is nobody's class figure
  select count(distinct s.person_id) into v_have
    from public.official_sessions s
   where s.institution_id = b.institution_id and s.class_node_id = b.scope_node_id
     and s.mode = 'POST_TEST'
     and not public.release_is_professional(s.plp_release_id);

  update public.briefings set have = v_have, needed = d.minimum_sample where id = p_briefing;

  if v_have < d.minimum_sample then
    perform public.audit_write('briefing.holding', 'briefings', p_briefing::text, b.institution_id,
      jsonb_build_object('have', v_have, 'needed', d.minimum_sample, 'catalogue_version', v_cat));
    return jsonb_build_object('state', 'COLLECTING', 'changed', false,
                              'have', v_have, 'needed', d.minimum_sample);
  end if;

  -- COLLECTING -> GENERATING, one declared edge at a time. Each edge is audited
  -- separately: two hops in one call are two events, and `at` cannot separate
  -- them (L3), so the trail is ordered by identity.
  update public.briefings set state = 'GENERATING' where id = p_briefing;
  perform public.audit_write('briefing.transition', 'briefings', p_briefing::text, b.institution_id,
    jsonb_build_object('from_state', 'COLLECTING', 'to_state', 'GENERATING',
                       'have', v_have, 'needed', d.minimum_sample, 'catalogue_version', v_cat));

  select t.id, t.template_version into v_tmpl, v_ver from public.report_templates t
   where t.institution_id = b.institution_id and t.standard_report = 'class_learning_intelligence'
   order by t.template_version desc limit 1;
  if v_tmpl is null then
    -- back to COLLECTING by a DECLARED edge rather than by staying put: the
    -- attempt happened and the trail should say so
    update public.briefings set state = 'COLLECTING' where id = p_briefing;
    perform public.audit_write('briefing.transition', 'briefings', p_briefing::text, b.institution_id,
      jsonb_build_object('from_state', 'GENERATING', 'to_state', 'COLLECTING',
                         'reason', 'no class template', 'catalogue_version', v_cat));
    return jsonb_build_object('state', 'COLLECTING', 'changed', true, 'have', v_have,
                              'needed', d.minimum_sample);
  end if;

  v_rep := public.generate_report(v_tmpl, b.scope_node_id, v_cat);

  update public.briefings
     set state = 'READY',
         catalogue_version = v_cat,
         template_id = v_tmpl,
         template_version = v_ver,
         generated_report_id = (v_rep ->> 'generated_report_id')::uuid,
         body = v_rep
   where id = p_briefing;
  perform public.audit_write('briefing.transition', 'briefings', p_briefing::text, b.institution_id,
    jsonb_build_object('from_state', 'GENERATING', 'to_state', 'READY',
                       'catalogue_version', v_cat, 'template_version', v_ver,
                       'generated_report_id', v_rep ->> 'generated_report_id'));

  return jsonb_build_object('state', 'READY', 'changed', true,
                            'catalogue_version', v_cat, 'template_version', v_ver,
                            'have', v_have, 'needed', d.minimum_sample);
end $$;
revoke all on function public.advance_briefing(uuid) from public, anon;
grant execute on function public.advance_briefing(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ 4. BOB-46

-- WHO STANDS OVER A PROFESSIONAL-LEARNING PLACE (D-069(b)): the facilitator (a
-- Guru whose scope covers it), the Kepala departemen whose scope covers it, the
-- school's Dekan and Admin sekolah, and Admin platform. Nobody else.
create or replace function public.professional_audience(p_node uuid)
returns text[] language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_jalur uuid[]; v_inst uuid; v_out text[] := '{}'; v_more text[];
begin
  v_me := public.current_person_id();
  if v_me is null then return v_out; end if;
  if public.is_system_admin() then v_out := v_out || 'PLATFORM'::text; end if;
  select n.jalur, n.institution_id into v_jalur, v_inst from public.org_nodes n where n.id = p_node;
  if v_jalur is null then return v_out; end if;
  select array_agg(distinct case ra.role when 'EDUCATOR' then 'FACILITATOR' when 'HEAD_OF_DEPARTMENT' then 'HEAD'
                                          when 'DEAN' then 'DEAN' else 'ADMIN' end)
    into v_more
    from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id
   where ra.person_id = v_me and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
     and s.institution_id = v_inst
     and ((ra.role in ('EDUCATOR', 'HEAD_OF_DEPARTMENT') and v_jalur @> array[ra.scope_node_id])
          or ra.role in ('DEAN', 'INSTITUTION_ADMIN'));
  return v_out || coalesce(v_more, '{}');
exception when others then return '{}';
end $$;
revoke all on function public.professional_audience(uuid) from public, anon;
grant execute on function public.professional_audience(uuid) to authenticated;

create or replace function public.session_is_professional(p_session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select public.release_is_professional(s.plp_release_id)
                     from public.assessment_sessions s where s.id = p_session), false)
$$;
revoke all on function public.session_is_professional(uuid) from public, anon;
grant execute on function public.session_is_professional(uuid) to authenticated;

-- PROGRESS carries no place, so it is read through the participant's own
-- professional-learning placement where that release is given.
create or replace function public.professional_progress_readable(p_person uuid, p_release uuid, p_institution uuid)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.is_system_admin() then return true; end if;
  return exists (
    select 1 from public.memberships m
      join public.enrollments e on e.id = m.enrollment_id
      join public.org_nodes n on n.id = m.node_id
     where e.person_id = p_person and e.institution_id = p_institution
       and n.learning_context = 'PROFESSIONAL_DEVELOPMENT'
       and exists (select 1 from public.learning_assignments la
                    where la.plp_release_id = p_release and n.jalur @> array[la.node_id])
       and public.professional_audience(n.id) && array['FACILITATOR', 'HEAD', 'DEAN']);
exception when others then return false;
end $$;
revoke all on function public.professional_progress_readable(uuid, uuid, uuid) from public, anon;
grant execute on function public.professional_progress_readable(uuid, uuid, uuid) to authenticated;

-- THE POLICIES. Each keeps its academic branch exactly as it was (the ELSE);
-- a professional-learning row is answered by the THEN.
drop policy assessment_sessions_select on public.assessment_sessions;
create policy assessment_sessions_select on public.assessment_sessions for select to authenticated using (
  person_id = public.current_person_id()
  or case when public.release_is_professional(plp_release_id)
          then public.professional_audience(coalesce(class_node_id, cohort_node_id))
               && array['FACILITATOR', 'HEAD', 'DEAN', 'ADMIN', 'PLATFORM']
          else public.can_in_institution('CAN_REVIEW_INTEGRITY', institution_id)
               or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id) end);

drop policy lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select to authenticated using (
  person_id = public.current_person_id()
  or case when public.release_is_professional(plp_release_id)
          then public.professional_progress_readable(person_id, plp_release_id, institution_id)
          else public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id) end);

drop policy responses_select on public.responses;
create policy responses_select on public.responses for select to authenticated using (
  exists (select 1 from public.assessment_sessions s
           where s.id = responses.session_id
             and (s.person_id = public.current_person_id()
                  or case when public.release_is_professional(s.plp_release_id)
                          then public.is_system_admin()
                          else public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id) end)));

drop policy presented_items_select on public.presented_items;
create policy presented_items_select on public.presented_items for select to authenticated using (
  exists (select 1 from public.assessment_sessions s
           where s.id = presented_items.session_id
             and (s.person_id = public.current_person_id()
                  or case when public.release_is_professional(s.plp_release_id)
                          then public.is_system_admin()
                          else public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id) end)));

drop policy integrity_signals_select on public.integrity_signals;
create policy integrity_signals_select on public.integrity_signals for select to authenticated using (
  case when public.session_is_professional(session_id)
       then public.is_system_admin()
       else public.can_in_institution('CAN_REVIEW_INTEGRITY', institution_id) end);

-- REFERRAL is refused for a professional-learning signal, for everyone; a school
-- role cannot review one at all, and is answered as for any signal it may not reach.
create or replace function public.record_integrity_review(p_signal uuid, p_decision text, p_note text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
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
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', sig.institution_id)
     -- BOB-46 (D-069(c)): a professional-learning signal reaches no school role
     or (public.session_is_professional(sig.session_id) and not public.is_system_admin()) then
    raise exception 'reviewing an integrity signal requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;

  -- No second log table (doc 16): the decision is an audit row, and the signal
  -- row itself is not mutated into carrying an outcome.
  perform public.audit_write('INTEGRITY_SIGNAL_REVIEWED', 'integrity_signals', p_signal::text,
    sig.institution_id,
    jsonb_build_object('session_id', sig.session_id, 'category', sig.category,
                       'decision', p_decision, 'note', p_note));

  -- BOB-39: a referral is Management's to consider, so it reaches their queue.
  -- Same transaction: if the referral is refused, so is the review.
  if p_decision = 'REFERRED_TO_INSTITUTION' then
    perform public.refer_integrity_signal(p_signal, p_note);
  end if;
  return p_signal;
end $$;
revoke all on function public.record_integrity_review(uuid, text, text) from public, anon;
grant execute on function public.record_integrity_review(uuid, text, text) to authenticated;

create or replace function public.refer_integrity_signal(p_signal uuid, p_note text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_sig record; v_open uuid; v_id uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null or p_signal is null then
    raise exception 'referring an integrity signal requires an authenticated actor and a signal';
  end if;

  select s.id, s.institution_id, s.session_id, s.category,
         ses.class_node_id, ses.person_id, public.release_is_professional(ses.plp_release_id) as pd
    into v_sig
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
   where s.id = p_signal;

  -- AUTHORIZATION BEFORE ANYTHING ELSE, and one message for every refusal, so
  -- an unknown signal and a signal in the next department are indistinguishable
  -- from outside. BOB-46: a professional-learning signal is one no school role
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
end $$;
revoke all on function public.refer_integrity_signal(uuid, text) from public, anon;
grant execute on function public.refer_integrity_signal(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ 5. BOB-47

-- CATALOGUE MC-5 (D-060(a)): MC-4 copied forward, every definition, tier,
-- threshold and source unchanged. What changes is who learner.result admits a
-- professional-learning row to: besides its owner, the ruled audiences, and
-- only inside professional_learning_record at that place. No academic
-- calculator's sources or readings move. MC-4 stays as it is (D-060(e)).
insert into public.metric_catalogue (version, note)
select 'MC-5',
       'a professional-learning result reaches its ruled audiences: learner.result admits a PD row to the facilitator, '
       'the Kepala departemen over the place and the Dekan, only through the professional-learning record at that '
       'place (BOB-47, D-069(b)); every definition, minimum sample, audience and source is MC-4''s'
 where not exists (select 1 from public.metric_catalogue where version = 'MC-5');

update public.metric_catalogue set superseded_by = 'MC-5'
 where version = 'MC-4' and superseded_by is null;

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
   minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
   deprecated, deprecation_note_key)
select 'MC-5', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
       d.minimum_sample, d.allowed_visualizations, d.allowed_audiences,
       d.calculation_key, d.deprecated, d.deprecation_note_key
  from public.metric_definitions d where d.catalogue_version = 'MC-4'
   and not exists (select 1 from public.metric_definitions x
                    where x.catalogue_version = 'MC-5' and x.metric_id = d.metric_id);

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
   requires_safety_gate, applies_without_post_test)
select 'MC-5', t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
       t.requires_safety_gate, t.applies_without_post_test
  from public.readiness_tiers t where t.catalogue_version = 'MC-4'
   and not exists (select 1 from public.readiness_tiers x
                    where x.catalogue_version = 'MC-5' and x.tier_key = t.tier_key);

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key)
select 'MC-5', q.signal_key, q.min_evidence, q.low_watermark, q.high_watermark, q.unwired_reason_key
  from public.question_health_thresholds q where q.catalogue_version = 'MC-4'
   and not exists (select 1 from public.question_health_thresholds x
                    where x.catalogue_version = 'MC-5' and x.signal_key = q.signal_key);

insert into public.metric_sources (catalogue_version, source_relation, why)
select 'MC-5', m.source_relation, m.why
  from public.metric_sources m where m.catalogue_version = 'MC-4'
on conflict (catalogue_version, source_relation) do nothing;

-- THE PD GATE'S SECOND KEY. Set only by professional_learning_record, after it
-- has checked the reader's audience, to the same place it binds the node
-- boundary to; and only a professional-learning place opens it.
create or replace function public.metric_professional_place_admits()
returns boolean language plpgsql stable set search_path = public, pg_temp as $$
declare v_place uuid;
begin
  v_place := nullif(current_setting('pintar.metric_professional_place', true), '')::uuid;
  if v_place is null or v_place is distinct from public.metric_boundary_node() then return false; end if;
  return exists (select 1 from public.org_nodes n
                  where n.id = v_place and n.learning_context = 'PROFESSIONAL_DEVELOPMENT');
exception when others then return false;
end $$;
revoke all on function public.metric_professional_place_admits() from public, anon, authenticated;

create or replace function public.row_in_learning_context(p_release uuid)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_ctx public.learning_context;
begin
  -- FAIL CLOSED WHEN PROVENANCE CANNOT BE RESOLVED. A row whose release is
  -- absent, or whose release resolves to no course, has no context to be
  -- judged by -- and "no answer" must not be read as "academic", because
  -- academic is the historical default and would swallow it. Neither case is
  -- reachable through the schema (assessment_sessions.plp_release_id and
  -- plp_releases.course_id are both NOT NULL, and both are foreign keys), so
  -- this refuses nothing that exists; it decides what happens if that ever
  -- stops being true.
  if p_release is null then return false; end if;
  select c.learning_context into v_ctx
    from public.plp_releases pr join public.courses c on c.id = pr.course_id
   where pr.id = p_release;
  if v_ctx is null then return false; end if;
  if v_ctx = 'ACADEMIC' then return true; end if;

  -- PROFESSIONAL DEVELOPMENT IS THE PERSON'S OWN. WP1's person binding is
  -- set only when somebody is reading their own record; every aggregate and
  -- every reader-standing-over-somebody binds a NODE instead.
  if public.metric_boundary_person() is not null then return true; end if;
  -- MC-5 (BOB-47, D-069(b)): AND THE RULED AUDIENCES, inside their record. The
  -- node boundary already confines the rows to that place.
  return public.metric_professional_place_admits();
exception when others then return false;
end $$;
revoke all on function public.row_in_learning_context(uuid) from public, anon, authenticated;

-- A sitting belongs to a package when it names it, or when the assessment it sits was given with it.
create or replace function public.session_of_learning_assignment(s public.assessment_sessions, p_la uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select s.learning_assignment_id = p_la
      or exists (select 1 from public.assessment_assignments aa
                  where aa.id = s.assessment_assignment_id and aa.learning_assignment_id = p_la)
$$;
revoke all on function public.session_of_learning_assignment(public.assessment_sessions, uuid) from public, anon, authenticated;

-- THE RECORD (D-070(a)): per participant and package, what each audience may
-- see. Completion is the Uji Penguasaan finished, whatever the outcome
-- (D-070(b)). Admin sekolah never receives progress or a result.
create or replace function public.professional_learning_record(p_node uuid)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare n public.org_nodes; v_aud text[]; v_full boolean; v_cat text; v_out jsonb := '[]'::jsonb;
        p record; la record; v_res jsonb; v_pkgs jsonb; v_pre text; v_post text; v_post_s uuid;
        v_total int; v_done int; v_started boolean; v_r jsonb; v_pass numeric; v_pkg jsonb;
begin
  select * into n from public.org_nodes o where o.id = p_node;
  v_aud := case when n.id is null then '{}'::text[] else public.professional_audience(n.id) end;
  if n.id is null or n.learning_context is distinct from 'PROFESSIONAL_DEVELOPMENT'
     or n.kind not in ('DEPARTMENT', 'COHORT', 'CLASS')
     or not (v_aud && array['FACILITATOR', 'HEAD', 'DEAN', 'ADMIN']) then
    perform public.professional_refuse('PD_RECORD_NOT_ALLOWED');
  end if;
  v_full := v_aud && array['FACILITATOR', 'HEAD', 'DEAN'];
  v_cat := public.current_metric_catalogue();

  for p in
    select x.* from (
      select distinct on (e.person_id) e.person_id, e.status, pe.display_name
        from public.memberships m
        join public.enrollments e on e.id = m.enrollment_id
        join public.org_nodes mn on mn.id = m.node_id
        join public.persons pe on pe.id = e.person_id
       where mn.jalur @> array[n.id] and mn.learning_context = 'PROFESSIONAL_DEVELOPMENT'
         and m.valid_to is null and e.status in ('PENDING', 'ACTIVE')
       order by e.person_id, e.created_at desc) x
     order by x.display_name, x.person_id
  loop
    v_res := '[]'::jsonb;
    if v_full and v_cat is not null then
      begin
        perform set_config('pintar.metric_boundary_node', n.id::text, true);
        perform set_config('pintar.metric_boundary_person', '', true);
        perform set_config('pintar.metric_professional_place', n.id::text, true);
        v_res := coalesce(public.calc_learner_result(p.person_id, n.institution_id, v_cat) -> 'value', '[]'::jsonb);
        perform set_config('pintar.metric_professional_place', '', true);
        perform set_config('pintar.metric_boundary_node', '', true);
      exception when others then
        perform set_config('pintar.metric_professional_place', '', true);
        perform set_config('pintar.metric_boundary_node', '', true);
        raise;
      end;
    end if;

    v_pkgs := '[]'::jsonb;
    for la in
      -- every package given at the participant's place or above it
      select l.id, l.plp_release_id, l.course_id, c.title
        from public.learning_assignments l
        join public.courses c on c.id = l.course_id
       where l.status <> 'DRAFT'
         and exists (select 1 from public.memberships m
                       join public.enrollments e on e.id = m.enrollment_id
                       join public.org_nodes mn on mn.id = m.node_id
                      where e.person_id = p.person_id and m.valid_to is null
                        and mn.jalur @> array[n.id] and mn.jalur @> array[l.node_id])
       order by c.title, l.id
    loop
      select case when bool_or(s.status in ('SUBMITTED', 'FINALIZED')) then 'SELESAI'
                  when count(*) > 0 then 'SEDANG' else 'BELUM' end
        into v_pre from public.assessment_sessions s
       where public.session_of_learning_assignment(s, la.id) and s.person_id = p.person_id and s.mode = 'PRE_TEST';
      select case when bool_or(s.status in ('SUBMITTED', 'FINALIZED')) then 'SELESAI'
                  when count(*) > 0 then 'SEDANG' else 'BELUM' end
        into v_post from public.assessment_sessions s
       where public.session_of_learning_assignment(s, la.id) and s.person_id = p.person_id and s.mode = 'POST_TEST';
      select count(*) into v_total from public.lessons ls join public.modules md on md.id = ls.module_id
       where md.course_id = la.course_id;
      select count(*) into v_done from public.lesson_progress lp
       where lp.person_id = p.person_id and lp.plp_release_id = la.plp_release_id
         and lp.total_positions is not null and lp.total_positions > 0
         and lp.furthest_position >= lp.total_positions;
      v_started := v_pre <> 'BELUM' or v_post <> 'BELUM'
                   or exists (select 1 from public.lesson_progress lp
                               where lp.person_id = p.person_id and lp.plp_release_id = la.plp_release_id);
      v_pkg := jsonb_build_object('learning_assignment_id', la.id, 'title', la.title, 'started', v_started,
                                  'pre_test', v_pre, 'post_test', v_post, 'completed', v_post = 'SELESAI');
      if v_full then
        -- the score is learner.result's (MC-5), its verdict the mark sealed on that attempt (D-088(b))
        select s.id, s.pass_mark into v_post_s, v_pass from public.assessment_sessions s
         where public.session_of_learning_assignment(s, la.id) and s.person_id = p.person_id and s.mode = 'POST_TEST'
           and s.status = 'FINALIZED'
         order by s.finalized_at desc nulls last limit 1;
        select x.value into v_r from jsonb_array_elements(v_res) x where x.value ->> 'session_id' = v_post_s::text limit 1;
        v_pkg := v_pkg || jsonb_build_object(
          'lessons_done', v_done, 'lessons_total', v_total,
          'result', case when v_r is null then null else jsonb_build_object(
                      'mastery', (v_r ->> 'mastery')::numeric,
                      'passed', case when v_pass is null then null
                                     else coalesce((v_r ->> 'safety_gate_passed')::boolean, false)
                                          and (v_r ->> 'mastery')::numeric >= v_pass end) end);
      end if;
      v_pkgs := v_pkgs || jsonb_build_array(v_pkg);
    end loop;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'person_id', p.person_id, 'display_name', p.display_name, 'member_kind', 'PARTICIPANT',
      'enrolment_status', p.status, 'packages', v_pkgs));
  end loop;

  return jsonb_build_object('node_id', n.id, 'name', n.name,
    'level', case n.kind when 'DEPARTMENT' then 'BAGIAN' when 'COHORT' then 'TINGKAT' else 'KELAS' end,
    'columns', case when v_full then 'FULL' else 'COMPLETION' end,
    'catalogue_version', case when v_full then v_cat end,
    'participants', v_out);
end $$;
revoke all on function public.professional_learning_record(uuid) from public, anon;
grant execute on function public.professional_learning_record(uuid) to authenticated;

-- WHERE EACH AUDIENCE FINDS IT (DAISY-34): the professional-learning Kelas this
-- reader may open the record of. Never part of a decision queue or a figure.
create or replace function public.professional_record_places()
returns table (node_id uuid, name text, institution_id uuid, academic_year text)
language sql stable security definer set search_path = public, pg_temp as $$
  select n.id, n.name, n.institution_id, ap.name
    from public.org_nodes n
    left join public.academic_periods ap on ap.id = n.academic_period_id
   where n.kind = 'CLASS' and n.is_active and n.learning_context = 'PROFESSIONAL_DEVELOPMENT'
     and n.institution_id in (select s.institution_id from public.role_assignments ra
                                join public.org_nodes s on s.id = ra.scope_node_id
                               where ra.person_id = public.current_person_id() and ra.revoked_at is null
                                 and now() >= ra.valid_from and now() < ra.valid_until)
     and public.professional_audience(n.id) && array['FACILITATOR', 'HEAD', 'DEAN', 'ADMIN']
   order by ap.name, n.name, n.id
$$;
revoke all on function public.professional_record_places() from public, anon;
grant execute on function public.professional_record_places() to authenticated;

-- THE CLOSURE, EXTENDED: no academic calculator can read a PD row. The second
-- key is set by one function, which checks its audience first and clears it;
-- the gate reads it only where the node boundary is that very place.
create or replace function public.assert_professional_results_reach_only_their_audience()
returns table (ok boolean, detail text) language plpgsql stable set search_path = public, pg_temp as $$
declare v_bad text := ''; v_setters text; v_def text;
begin
  select string_agg(p.proname, ', ' order by p.proname) into v_setters
    from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
     and p.proname not like 'assert\_%'
     and pg_get_functiondef(p.oid) like '%pintar.metric_professional_place%';
  if v_setters is distinct from 'metric_professional_place_admits, professional_learning_record' then
    v_bad := v_bad || format('the professional-place key is named by %s, not only by its reader and the record; ', v_setters);
  end if;
  v_def := pg_get_functiondef('public.professional_learning_record(uuid)'::regprocedure);
  if v_def not like '%professional_audience%' or v_def not like '%PD_RECORD_NOT_ALLOWED%'
     or (length(v_def) - length(replace(v_def, 'set_config(''pintar.metric_professional_place'', ''''', ''))) = 0 then
    v_bad := v_bad || 'the record does not check its audience before opening the gate, or never closes it; ';
  end if;
  v_def := pg_get_functiondef('public.metric_professional_place_admits()'::regprocedure);
  if v_def not like '%metric_boundary_node()%' or v_def not like '%PROFESSIONAL_DEVELOPMENT%' then
    v_bad := v_bad || 'the gate''s second key does not require the node boundary to be that professional place; ';
  end if;
  if has_function_privilege('authenticated', 'public.metric_professional_place_admits()', 'execute') then
    v_bad := v_bad || 'a client can call the gate''s key; ';
  end if;
  v_def := pg_get_functiondef('public.row_in_learning_context(uuid)'::regprocedure);
  if v_def not like '%metric_boundary_person()%' or v_def not like '%metric_professional_place_admits()%' then
    v_bad := v_bad || 'row_in_learning_context lost a key of the PD gate; ';
  end if;
  if v_bad <> '' then return query select false, v_bad; end if;
  return query select true, 'a professional-learning row reaches a reading only as its owner''s own record or inside '
    || 'professional_learning_record, which checks the reader''s audience, binds the node boundary and the '
    || 'professional place to the same PD place, and clears both; no other function names the key, and no client '
    || 'can call it (BOB-47)';
end $$;
revoke all on function public.assert_professional_results_reach_only_their_audience() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ 6. the registry

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('releases_matching_place', 'STAFF', 'BOB-43: of the release ids handed in, those this place may be given (the material''s '
   || 'context is the place''s). For CAN_ASSIGN_LEARNING or CAN_DRAFT in the place''s school; answers nobody else. '
   || 'Siapkan offers only these.', 'CAPABILITY', 'CAN_ASSIGN_LEARNING'),
  ('enrol_for_professional_learning', 'STAFF', 'BOB-44 (C1): places an existing person who currently holds a staff role '
   || 'at the school in a professional-learning Kelas or Tingkat as a participant, reusing their enrolment for the period '
   || '(ACTIVE when they can sign in, PENDING otherwise). Creates no person, account or number. Audited. Refusals PR090.',
   'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('professional_learning_places', 'STAFF', 'BOB-44: the active professional-learning Kelas and Tingkat of a school, '
   || 'for its CAN_PROVISION_PEOPLE holders; empty for everyone else.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('professional_learning_candidates', 'STAFF', 'BOB-44 (D-070(c)): the people who currently hold a staff role at a '
   || 'school, for its CAN_PROVISION_PEOPLE holders; empty for everyone else.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('member_kind', 'STAFF', 'BOB-45: computed field of an enrolment, LEARNER or PARTICIPANT, read under the caller''s '
   || 'own row security. The kind, never the context (R10).', null, null),
  ('release_is_professional', 'PLATFORM', 'BOB-46 policy helper: whether a release''s course is for professional '
   || 'learning. Takes no identity and returns no data.', null, null),
  ('session_is_professional', 'PLATFORM', 'BOB-46 policy helper: whether a session''s release is for professional '
   || 'learning. Takes no identity and returns no data.', null, null),
  ('professional_audience', 'PLATFORM', 'BOB-46 policy helper: the ruled audiences (D-069(b)) the caller stands in over '
   || 'one place: FACILITATOR, HEAD, DEAN, ADMIN, PLATFORM. Takes no identity.', null, null),
  ('professional_progress_readable', 'PLATFORM', 'BOB-46 policy helper behind lesson_progress_select for a '
   || 'professional-learning row: the caller is the facilitator, Kepala departemen or Dekan over the participant''s '
   || 'professional-learning place where that release is given. Returns a boolean only.', null, null),
  ('professional_learning_record', 'STAFF', 'BOB-47 (D-070(a)): the read-only professional-learning record of one '
   || 'place, per participant and package, for the facilitator, the Kepala departemen over it and the Dekan (with '
   || 'progress and the result, through learner.result in MC-5) and Admin sekolah (enrolment, participation and '
   || 'completion only). Refuses everyone else, PR090 PD_RECORD_NOT_ALLOWED.', 'INSTITUTION_MEMBER', null),
  ('professional_record_places', 'STAFF', 'BOB-47 / DAISY-34: the professional-learning Kelas whose record the caller '
   || 'may open, for the links from each audience''s home.', null, null);

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare v_cat text;
begin
  if (select count(*) from public.org_nodes where kind not in ('INSTITUTION', 'FACULTY') and learning_context is null) > 0 then
    raise exception 'BOB-43: a place below a Jenjang carries no learning context';
  end if;
  if not (select a.ok from public.assert_assignments_match_their_place() a) then
    raise notice 'BOB-43: %', (select a.detail from public.assert_assignments_match_their_place() a);
  end if;
  v_cat := public.current_metric_catalogue();
  if v_cat is distinct from 'MC-5' then raise exception 'BOB-47: the live catalogue is % and not MC-5', v_cat; end if;
  if exists (select * from (select metric_id, label_key, meaning_key, scope, evidence_class, minimum_sample,
                                   allowed_visualizations, allowed_audiences, calculation_key, deprecated,
                                   deprecation_note_key
                              from public.metric_definitions where catalogue_version = 'MC-5') d5
             full join (select metric_id, label_key, meaning_key, scope, evidence_class, minimum_sample,
                               allowed_visualizations, allowed_audiences, calculation_key, deprecated,
                               deprecation_note_key
                          from public.metric_definitions where catalogue_version = 'MC-4') d4 using (metric_id)
             where d5 is distinct from d4) then
    raise exception 'BOB-47: MC-5 is not MC-4, definition by definition';
  end if;
  if not (select a.ok from public.assert_metric_catalogue() a) then
    raise exception 'BOB-47: %', (select a.detail from public.assert_metric_catalogue() a);
  end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'BOB-47: %', (select a.detail from public.assert_metric_closure() a);
  end if;
  if not (select a.ok from public.assert_academic_sources_are_context_bound() a) then
    raise exception 'BOB-47: %', (select a.detail from public.assert_academic_sources_are_context_bound() a);
  end if;
  if not (select a.ok from public.assert_professional_results_reach_only_their_audience() a) then
    raise exception 'BOB-47: %', (select a.detail from public.assert_professional_results_reach_only_their_audience() a);
  end if;
  if not (select a.ok from public.assert_staff_rpc_authorization_declared() a) then
    raise exception 'BOB-44/47: %', (select a.detail from public.assert_staff_rpc_authorization_declared() a);
  end if;
end $$;

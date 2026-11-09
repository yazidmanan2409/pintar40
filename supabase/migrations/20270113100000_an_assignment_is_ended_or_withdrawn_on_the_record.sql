-- ---------------------------------------------------------------------------
-- W2.21 (owner, 9 Nov: INCLUDE in 4.0). A LESSON ASSIGNMENT IS ENDED OR WITHDRAWN ON THE RECORD.
--
-- The Action & Consequence inventory (gap 1) found that a learning assignment could never leave ACTIVE: the states
-- ENDED and WITHDRAWN existed (20260912201500) but nothing wrote them, the client grants were withdrawn by design
-- (20261110100000, S10: «a future need … becomes an audited function»), and ASSIGN_EXISTS then refused giving the same
-- lesson to the class again. The owner's ruling:
--   «a governed way for the authorized educator to end or withdraw an assignment. Preserve completed work and
--    historical evidence, handle in-progress learners explicitly, prevent unauthorized new starts, and audit the
--    action. Do not conflate assignment withdrawal with unpublishing the underlying lesson package.»
--
-- So:
--   * akhiri_penugasan_pratinjau(assignment): what ending would touch, read-only: the learners who finished, the
--     learners with a sitting still open (by name), and those who never started.
--   * akhiri_penugasan(assignment, kind, reason, end_open_sittings): one transaction.
--       - kind ENDED («Selesai»: the work has run its course) or WITHDRAWN («Ditarik»: given by mistake). Both stop
--         every new start: the learning assignment leaves ACTIVE (start_learning_session refuses anything else) and its
--         assessment assignments CLOSE (may_start_assessment refuses a closed one; INV-27: closing stops new sessions
--         only).
--       - a reason of 5–300 characters is required.
--       - a sitting still open is never swept silently. Without the explicit confirmation the act is refused
--         ASSIGN_IN_PROGRESS and nothing changes. With it, a sitting past its deadline EXPIRES (session_enforce_deadline)
--         and one still open is TERMINATED as ADMINISTRATIVE_TERMINATION with the reason, its answers kept, and the
--         same assessment_session.terminated audit row terminate_session writes.
--       - a finished sitting, its result, its certificate and lesson progress are never touched.
--       - one learning_assignment.ended / learning_assignment.withdrawn audit row with every count.
--   * Who: CAN_ASSIGN_LEARNING over the class (or Angkatan) the lesson was given to, decided over that place as
--     SI-D01 decided every act on a class's evidence; a professional-learning assignment is the platform's, as its
--     sittings are (20270112150000).
--   * The lesson package is untouched: its release stays PUBLISHED and may be given to this class again (ASSIGN_EXISTS
--     counts only a DRAFT or ACTIVE assignment).
-- Refusals are PR050 with the code in DETAIL, as assign_release's are.
-- ---------------------------------------------------------------------------

-- FOUND BY PENUGASAN-A01 (9 Nov; F38-W05 red first): the licence check of enforce_assignment_status (20260915170000:
-- «the artefact is this school's, or canonical content this school has been authorized to teach») ran on EVERY update,
-- so an assignment of a lesson PINTAR had stopped sharing could never be closed: exactly when the school most needs to
-- end it. The check now guards what starts teaching (an insert, and a move into ACTIVE, SCHEDULED or OPEN), and a move
-- into CLOSED, ENDED or WITHDRAWN, which changes nothing but the status, needs no licence. Opening a closed assessment
-- is still refused (CLOSED has no way back in the transition tables). Otherwise the function is its 20260915170000
-- definition, unchanged.
create or replace function public.enforce_assignment_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_owner uuid; v_release uuid; v_legal boolean; v_ending boolean;
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

  -- W2.21: ending is a status move and nothing else; it needs no licence to teach
  v_ending := tg_op = 'UPDATE' and new.status is distinct from old.status
              and new.status::text in ('CLOSED', 'ENDED', 'WITHDRAWN')
              and (to_jsonb(new) - 'status' - 'institution_id') = (to_jsonb(old) - 'status' - 'institution_id');

  -- The artefact is this school's, or it is canonical content this school has
  -- been authorized to teach. Same predicate as the session guard (0055).
  if not v_ending and v_owner <> v_inst
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
revoke all on function public.enforce_assignment_status() from public, anon, authenticated;

create or replace function public.penugasan_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR050',
    detail  = p_code,
    message = case p_code
      when 'ASSIGN_NOT_ALLOWED'      then 'ending an assignment requires CAN_ASSIGN_LEARNING over the class it was given to'
      when 'ASSIGN_NOT_LIVE'         then 'this assignment has already ended or been withdrawn'
      when 'ASSIGN_KIND_INVALID'     then 'an assignment is ended (ENDED) or withdrawn (WITHDRAWN)'
      when 'ASSIGN_REASON_REQUIRED'  then 'ending an assignment records why, in 5 to 300 characters'
      when 'ASSIGN_IN_PROGRESS'      then 'learners still have a sitting open; confirm that it ends, with its answers kept'
      else 'the assignment could not be ended' end;
end $$;
revoke all on function public.penugasan_tolak(text) from public, anon, authenticated;

-- may the caller end this assignment (no data about it)
create or replace function public.boleh_akhiri_penugasan(p_la uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select case when public.release_is_professional(la.plp_release_id) then public.is_system_admin()
                               else public.can_on_node('CAN_ASSIGN_LEARNING', la.node_id) end
                     from public.learning_assignments la where la.id = p_la), false)
$$;
revoke all on function public.boleh_akhiri_penugasan(uuid) from public, anon, authenticated;

-- the sittings an assignment holds (through its learning assignment or one of its assessment assignments)
create or replace function public.penugasan_sesi(p_la uuid)
returns setof public.assessment_sessions language sql stable security definer set search_path = public, pg_temp as $$
  select s.* from public.assessment_sessions s
   where s.learning_assignment_id = p_la
      or s.assessment_assignment_id in (select a.id from public.assessment_assignments a where a.learning_assignment_id = p_la)
$$;
revoke all on function public.penugasan_sesi(uuid) from public, anon, authenticated;

create or replace function public.akhiri_penugasan_pratinjau(p_la uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_la public.learning_assignments; v jsonb;
begin
  select * into v_la from public.learning_assignments where id = p_la;
  if v_la.id is null or not public.boleh_akhiri_penugasan(p_la) then perform public.penugasan_tolak('ASSIGN_NOT_ALLOWED'); end if;
  with sesi as (select * from public.penugasan_sesi(p_la)),
  anggota as (
    select distinct e.person_id
      from public.memberships m join public.enrollments e on e.id = m.enrollment_id
      join public.org_nodes n on n.id = m.node_id
     where m.valid_to is null and e.status in ('PENDING', 'ACTIVE')
       and (n.id = v_la.node_id or n.jalur @> array[v_la.node_id]))
  select jsonb_build_object(
    'status', v_la.status,
    'kursus', (select c.title from public.courses c where c.id = v_la.course_id),
    'kelas', (select n.name from public.org_nodes n where n.id = v_la.node_id),
    'selesai', (select count(distinct s.person_id) from sesi s where s.status in ('SUBMITTED', 'FINALIZED')),
    'berjalan', coalesce((select jsonb_agg(jsonb_build_object('person_id', b.person_id, 'nama', p.display_name) order by p.display_name)
                            from (select distinct s.person_id from sesi s where s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) b
                            join public.persons p on p.id = b.person_id), '[]'::jsonb),
    'belum_mulai', (select count(*) from anggota a where not exists (select 1 from sesi s where s.person_id = a.person_id)))
  into v;
  return v;
end $$;
revoke all on function public.akhiri_penugasan_pratinjau(uuid) from public, anon, authenticated;
grant execute on function public.akhiri_penugasan_pratinjau(uuid) to authenticated;

create or replace function public.akhiri_penugasan(p_la uuid, p_jenis text, p_alasan text, p_akhiri_yang_berjalan boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid; v_la public.learning_assignments; s record; v_open int := 0; v_expired int := 0; v_ended int := 0;
  v_done int; v_closed int; v_kept int; v_alasan text := btrim(coalesce(p_alasan, ''));
begin
  v_actor := public.current_person_id();
  select * into v_la from public.learning_assignments where id = p_la for update;
  if v_actor is null or v_la.id is null or not public.boleh_akhiri_penugasan(p_la) then
    perform public.penugasan_tolak('ASSIGN_NOT_ALLOWED');
  end if;
  if p_jenis is null or p_jenis not in ('ENDED', 'WITHDRAWN') then perform public.penugasan_tolak('ASSIGN_KIND_INVALID'); end if;
  if v_la.status <> 'ACTIVE' and not (v_la.status = 'DRAFT' and p_jenis = 'WITHDRAWN') then
    perform public.penugasan_tolak('ASSIGN_NOT_LIVE');
  end if;
  -- CORRECTED IN PLACE (undeployed; Daisy, TINJAUAN-6faef690): 10 characters, as every other reason in PINTAR
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.penugasan_tolak('ASSIGN_REASON_REQUIRED'); end if;

  -- CORRECTED IN PLACE (undeployed; Sharon §13 on 6faef690, Low): the assessments are locked before the open sittings
  -- are counted. start_learning_session takes a share lock on its assessment assignment, so a start already under way
  -- finishes first and its sitting is counted and swept here; one that comes after waits, then finds it CLOSED.
  perform 1 from public.assessment_assignments aa where aa.learning_assignment_id = p_la order by aa.id for update;

  select count(*) into v_open from public.penugasan_sesi(p_la) x where x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED');
  if v_open > 0 and not coalesce(p_akhiri_yang_berjalan, false) then perform public.penugasan_tolak('ASSIGN_IN_PROGRESS'); end if;

  -- a sitting still open: past its deadline it expires; otherwise it is ended, its answers kept, on the record
  for s in select x.id, x.institution_id from public.penugasan_sesi(p_la) x
            where x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') order by x.id for update loop
    perform public.session_enforce_deadline(s.id);
    if (select x.status from public.assessment_sessions x where x.id = s.id) in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
      select count(*) into v_kept from public.responses r where r.session_id = s.id;
      update public.assessment_sessions
         set status = 'TERMINATED', termination_cause = 'ADMINISTRATIVE_TERMINATION',
             termination_reason = v_alasan, terminated_by_person_id = v_actor
       where id = s.id;
      perform public.audit_write('assessment_session.terminated', 'assessment_sessions', s.id::text, s.institution_id,
        jsonb_build_object('session_id', s.id, 'cause', 'ADMINISTRATIVE_TERMINATION', 'reason', v_alasan,
                           'actor', v_actor, 'responses_retained', v_kept, 'learning_assignment_id', p_la));
      v_ended := v_ended + 1;
    else
      v_expired := v_expired + 1;
    end if;
  end loop;

  select count(distinct x.person_id) into v_done from public.penugasan_sesi(p_la) x where x.status in ('SUBMITTED', 'FINALIZED');

  -- no new start: the assessments close, then the assignment leaves ACTIVE
  update public.assessment_assignments set status = 'CLOSED'
   where learning_assignment_id = p_la and status <> 'CLOSED';
  get diagnostics v_closed = row_count;
  update public.learning_assignments set status = p_jenis::public.learning_assignment_status where id = p_la;

  perform public.audit_write(case p_jenis when 'ENDED' then 'learning_assignment.ended' else 'learning_assignment.withdrawn' end,
    'learning_assignments', p_la::text, v_la.institution_id,
    jsonb_build_object('kind', p_jenis, 'reason', v_alasan, 'from_status', v_la.status, 'node_id', v_la.node_id,
                       'plp_release_id', v_la.plp_release_id, 'learners_finished', v_done,
                       'sittings_ended', v_ended, 'sittings_expired', v_expired, 'assessments_closed', v_closed));
  return jsonb_build_object('ok', true, 'status', p_jenis, 'selesai', v_done, 'diakhiri', v_ended, 'kedaluwarsa', v_expired);
end $$;
revoke all on function public.akhiri_penugasan(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.akhiri_penugasan(uuid, text, text, boolean) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('akhiri_penugasan_pratinjau', 'STAFF',
   'W2.21: what ending a lesson assignment would touch, read-only: learners finished, learners with a sitting open (by '
   || 'name), learners not started. CAN_ASSIGN_LEARNING over the class (a professional-learning one: the platform).',
   'CAPABILITY', 'CAN_ASSIGN_LEARNING'),
  ('akhiri_penugasan', 'STAFF',
   'W2.21: ends (ENDED) or withdraws (WITHDRAWN) a lesson assignment with a reason, in one transaction: its assessments '
   || 'close, no new start; an open sitting only with explicit confirmation (expired past its deadline, else '
   || 'TERMINATED as ADMINISTRATIVE_TERMINATION, answers kept); finished work untouched; audited. The release stays '
   || 'published. Refusals PR050 with a code in DETAIL.',
   'CAPABILITY', 'CAN_ASSIGN_LEARNING')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if has_function_privilege('anon', 'public.akhiri_penugasan(uuid, text, text, boolean)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.akhiri_penugasan_pratinjau(uuid)'::regprocedure, 'execute') then
    raise exception 'W2.21: an anonymous caller can end an assignment';
  end if;
  if has_function_privilege('authenticated', 'public.penugasan_sesi(uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.boleh_akhiri_penugasan(uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.penugasan_tolak(text)'::regprocedure, 'execute') then
    raise exception 'W2.21: an internal helper is callable by a client';
  end if;
end $$;

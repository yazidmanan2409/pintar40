-- Account lifecycle, Sharon's review of 89374424 and the owner's priority 4 (9 Nov). Three corrections:
--
-- 1. A placement changes only through its governed functions (D2). `authenticated` held table INSERT and UPDATE on
--    enrollments and memberships, with RLS allowing the School Admin, so an enrolment could be ended through PostgREST
--    with no stated reason, no audit and its memberships left open, and a membership inserted past the placement
--    function. No application code writes either table directly. The grants and their write policies are withdrawn;
--    move_learner_to_class («Pindah kelas»), the one writer that ran with the caller's rights, becomes SECURITY DEFINER
--    and keeps its own check (INSTITUTION_ADMIN over the place the learner is in and the Kelas they move to).
-- 2. One live enrolment per person, school, year and programme: nothing prevented two PENDING/ACTIVE enrolments of one
--    learner in one school and academic year (a repeated transfer to a school the learner is already in created one).
--    The canonical model (docs/rebuild/02, «Institution Enrollment»: person, institution, period, programme where
--    applicable; concurrently where policy permits) keeps the programme in the key, so two programmes stay possible.
--    (Sharon proposed person, institution and period; the programme is added for the canonical model: for her review.)
-- 3. Historical educator attribution (D3): person_visible_to_me kept a staff member visible to the school's
--    administrator only through a live role, so a teacher whose only link was a role lost their name, and their authored
--    work its author, once the role was revoked. A role held there, now or ever, keeps them visible.
-- F37-L01..L03 were red on 84f0b0ed.

-- 1.
revoke insert, update on public.enrollments, public.memberships from authenticated, anon;
drop policy enrollments_insert on public.enrollments;
drop policy enrollments_update on public.enrollments;
drop policy memberships_insert on public.memberships;
drop policy memberships_update on public.memberships;
alter function public.move_learner_to_class(uuid, uuid) security definer;
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('move_learner_to_class', 'STAFF', 'J3.6 «Pindah kelas»: moves a learner''s current placement to another Kelas of the same '
   || 'school and year; SECURITY DEFINER since the lifecycle correction (clients no longer write memberships).',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;
revoke all on function public.move_learner_to_class(uuid, uuid) from public, anon, authenticated;
grant execute on function public.move_learner_to_class(uuid, uuid) to authenticated, service_role;

-- 2.
create unique index enrollments_one_live_per_school_year on public.enrollments
  (person_id, institution_id, academic_period_id, coalesce(programme_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('PENDING', 'ACTIVE');

-- 3.
CREATE OR REPLACE FUNCTION public.person_visible_to_me(p_person uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_me uuid;
begin
  if p_person is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  if v_me = p_person then return true; end if;
  if public.is_system_admin() then return true; end if;
  if exists (select 1 from public.enrollments e
              where e.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', e.institution_id)) then
    return true;
  end if;
  if exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
              where e.person_id = p_person and public.can_on_node('CAN_VIEW_LEARNER_ROSTER', m.node_id)) then
    return true;
  end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then
    return true;
  end if;
  -- D-048: the school's own staff -- the school's number, or a role held there
  if exists (select 1 from public.institutional_identities ii
              where ii.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', ii.institution_id)) then
    return true;
  end if;
  -- D-048 and the lifecycle (owner, 9 Nov: historical educator attribution survives a revocation): a role held there,
  -- now or ever, keeps the person's name visible to that school's administrator, so their authored work keeps its author
  if exists (select 1 from public.role_assignments ra
              where ra.person_id = p_person and ra.role <> 'SYSTEM_ADMIN'
                and ra.institution_id is not null
                and public.has_scope('INSTITUTION_ADMIN', ra.institution_id)) then
    return true;
  end if;
  return false;
exception when others then return false;
end;
$function$;
revoke all on function public.person_visible_to_me(uuid) from public, anon, authenticated;
grant execute on function public.person_visible_to_me(uuid) to authenticated, service_role;

-- verification
do $$
begin
  if has_table_privilege('authenticated', 'public.enrollments', 'insert') or has_table_privilege('authenticated', 'public.enrollments', 'update')
     or has_table_privilege('authenticated', 'public.memberships', 'insert') or has_table_privilege('authenticated', 'public.memberships', 'update') then
    raise exception 'lifecycle: a client can still write enrollments or memberships directly';
  end if;
  if not (select prosecdef from pg_proc where oid = 'public.move_learner_to_class(uuid, uuid)'::regprocedure) then
    raise exception 'lifecycle: move_learner_to_class runs with the caller''s rights, which no longer reach the tables';
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'enrollments_one_live_per_school_year') then
    raise exception 'lifecycle: two live enrolments of one person in one school and year are not prevented';
  end if;
  if position('ra.revoked_at is null and now() < ra.valid_until' in (select prosrc from pg_proc where oid = 'public.person_visible_to_me(uuid)'::regprocedure)) > 0 then
    raise exception 'lifecycle: a revoked role still hides the person''s name from their school';
  end if;
end $$;

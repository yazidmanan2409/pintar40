-- D-088(i) (Yazid, 2 Oct) -- LEARNER-LEVEL ACCESS FOLLOWS THE CURRENT PLACEMENT.
--
-- `audience_scope_over_learner` is the one governed answer to "does this
-- reader stand over this learner?": the teacher's view of one learner (M4,
-- `learner.result` through metric_evaluate), the head of department's or
-- dean's learner record (management_learner_detail) and every learner-subject
-- metric. It joined EVERY membership the learner ever had, so after a class
-- move (M9) or a rollover the old class's teacher and head of department still
-- stood over the learner for those reads (WAITING 10, 1 Oct).
--
-- Yazid ruled option (a): authority follows current responsibility. Only an
-- OPEN placement of a CURRENT enrolment (PENDING or ACTIVE) carries a reader
-- over a learner. The old class's figures keep the learner's past work: class
-- calculators read the session's own class (class_node_id, M9), not this.
--
-- And the learner record no longer lists ended placements as if current:
-- `placement` is where the learner is now; `placement_history` is the places
-- they have left, each with its year, dates and close reason (MOVED,
-- PERIOD_ROLLOVER, ENROLLMENT_ENDED). Everything else in both bodies is
-- 20260923110000's and 20260925100000's, unchanged; no table, policy or grant
-- changes.

create or replace function public.audience_scope_over_learner(
  p_audiences public.app_role[], p_learner uuid, p_institution uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_person uuid; v_node uuid;
begin
  if p_audiences is null or p_learner is null or p_institution is null then return null; end if;
  v_person := public.current_person_id();
  if v_person is null then return null; end if;
  select ra.scope_node_id into v_node
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
    join public.org_nodes n on n.id = m.node_id
    join public.role_assignments ra on ra.person_id = v_person
   where e.person_id = p_learner
     and e.institution_id = p_institution
     and n.institution_id = p_institution
     -- D-088(i): where the learner is now, never where they were
     and m.valid_to is null
     and e.status in ('PENDING', 'ACTIVE')
     and ra.revoked_at is null
     and now() >= ra.valid_from and now() < ra.valid_until
     and ra.role = any (p_audiences)
     and ra.scope_node_id is not null
     and n.jalur @> array[ra.scope_node_id]
   order by cardinality(n.jalur) desc
   limit 1;
  return v_node;
exception when others then return null;
end $$;
comment on function public.audience_scope_over_learner(public.app_role[], uuid, uuid) is
  'The node whose assignment authorizes this reader over this learner, or NULL. Only the learner''s open placements '
  'of a current enrolment count (D-088(i)). The engine binds the boundary to the authority it used.';

revoke all on function public.audience_scope_over_learner(public.app_role[], uuid, uuid)
  from public, anon, authenticated;

create or replace function public.management_learner_detail(p_person uuid, p_institution uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

  select e.status, e.academic_period_id, e.programme_id into v_enr
    from public.enrollments e
   where e.person_id = p_person and e.institution_id = p_institution
   order by e.created_at desc limit 1;

  -- D-088(i): where the learner is NOW (open placements of a current
  -- enrolment), and apart from it the places they have left, with when and why
  select coalesce(jsonb_agg(jsonb_build_object('node_id', n.id, 'kind', n.kind, 'name', n.name)
                            order by cardinality(n.jalur)), '[]'::jsonb)
    into v_placement
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
    join public.org_nodes n on n.id = m.node_id
   where e.person_id = p_person and e.institution_id = p_institution
     and n.institution_id = p_institution
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
     and n.institution_id = p_institution
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


revoke all on function public.management_learner_detail(uuid, uuid) from public, anon, authenticated;
grant execute on function public.management_learner_detail(uuid, uuid) to authenticated;

-- ───────────────────────────────────────────────────────────── assertions
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.audience_scope_over_learner(public.app_role[],uuid,uuid)'::regprocedure);
  if v_def !~ 'm\.valid_to is null' or v_def !~ $r$e\.status in \('PENDING', 'ACTIVE'\)$r$ then
    raise exception 'D-088(i): audience_scope_over_learner still reads placements the learner has left';
  end if;
  if not (select p.prosecdef from pg_proc p where p.oid = 'public.audience_scope_over_learner(public.app_role[],uuid,uuid)'::regprocedure)
     or has_function_privilege('authenticated', 'public.audience_scope_over_learner(public.app_role[],uuid,uuid)', 'execute') then
    raise exception 'D-088(i): audience_scope_over_learner changed its security or its grant';
  end if;
  v_def := pg_get_functiondef('public.management_learner_detail(uuid,uuid)'::regprocedure);
  if v_def !~ 'placement_history' or v_def !~ 'audience_scope_over_learner' or v_def !~ 'learner_detail\.opened' then
    raise exception 'D-088(i): management_learner_detail lost its history, its authorization or its audit row';
  end if;
  if has_function_privilege('anon', 'public.management_learner_detail(uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.management_learner_detail(uuid,uuid)', 'execute') then
    raise exception 'D-088(i): management_learner_detail''s grant changed';
  end if;
end $$;

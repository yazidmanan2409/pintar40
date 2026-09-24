-- 0095 -- a head of department and a dean may open one learner, on purpose,
-- and the opening is recorded.
--
-- THE RULING, in three levels that must not be collapsed into one:
--
--   LEVEL 1  aggregate intelligence -- 0091's audience-and-containment rule,
--            now standing on 0092/0093's source-bound boundary. Not touched.
--   LEVEL 2  a scoped learner ROSTER. DEAN and HEAD_OF_DEPARTMENT see the
--            learners inside their assigned node and its descendants. A roster
--            read is not an individual act and is not audited row by row.
--   LEVEL 3  one named learner's academic record, opened DELIBERATELY. That is
--            an act, it is auditable, and it needs no approval, no case, no
--            purpose code and no free-text justification.
--
-- WHY A ROW PREDICATE COULD NOT BE LEVEL 3. `persons_select` is
-- `using (person_visible_to_me(id))`. A SELECT policy is a predicate over ROWS:
-- `select * from persons` and `select ... where id = $1` put the identical
-- question to it. Nothing distinguishes reading a roster from opening a person,
-- so "deliberate" cannot be expressed there -- not by tightening the predicate,
-- not by any edit to `person_visible_to_me`. Level 3 is therefore an ENDPOINT,
-- and arriving through it IS the deliberateness. `open_briefing` already works
-- this way: a staff read that records that it happened.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- LEVEL 2: THE ROSTER STOPS BEING AN ACCIDENT OF RANK.
--
-- Three predicates carried Management roster visibility, all by the same line:
-- `has_scope('EDUCATOR', node)`. `has_scope` compares role RANK, and DEAN ranks
-- above EDUCATOR -- so a dean saw a roster because of a ladder, while holding
-- not one capability an educator holds. It worked, it was contained by `jalur`,
-- and a reader had no way to tell whether it was meant.
--
-- It is now `can_on_node('CAN_VIEW_LEARNER_ROSTER', node)`: the capability
-- model this schema uses everywhere else, on the SAME assignment that supplies
-- the containment.
--
-- THE ROW SET IS UNCHANGED, and that is the point rather than a caveat. The
-- capability goes to EDUCATOR, HEAD_OF_DEPARTMENT, DEAN, INSTITUTION_ADMIN and
-- SYSTEM_ADMIN -- precisely the roles with rank >= EDUCATOR, and STUDENT cannot
-- hold a role assignment at all (`role_assignments_role_check`). Nobody gains a
-- row and nobody loses one. What changes is that the sentence says what it
-- means.
--
-- ONE MEASURED DIFFERENCE, and it fails closed: `has_scope` answers TRUE for a
-- SYSTEM_ADMIN before it looks the node up, so it answered true for a node that
-- does not exist; `can_on_node` looks the node up first and answers false. No
-- policy passes a non-existent node, and false is the better answer.
--
-- DEAN GAINS ONE CAPABILITY AND IT IS NOT A STUDIO POWER. Every other
-- capability in this model authorises AUTHORING -- drafting, reviewing,
-- freezing, publishing, assigning, transferring. This one authorises LOOKING at
-- who is in your part of the school, which is what INV-19 has always let a dean
-- do; until now it happened by rank instead of by name.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- LEVEL 3: WHY A CAPABILITY WOULD HAVE BEEN THE WRONG MECHANISM FOR IT.
--
-- `selftest.f06_negative_actor` derives the negative actor for a
-- CAPABILITY-declared endpoint from the live capability model, and F06-N02
-- additionally probes the DEAN against EVERY capability endpoint and requires a
-- refusal, because "DEAN holds no capability in any institution" is the premise
-- that makes the dean the universal negative actor. That premise is already
-- softened by the roster capability above, and hanging Level 3 on a capability
-- too would turn a working derived test into one that demands the dean be
-- refused the very thing this ruling grants.
--
-- So Level 3 is declared as a ROLE SET, which is what the ruling says:
-- HEAD_OF_DEPARTMENT and DEAN, and no one else. The set lives in
-- `management_learner_roles()` and is compared with the registry's declared
-- requirement by `assert_staff_rpc_authorization_declared`, so the declaration
-- and the implementation cannot drift apart silently.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE PAYLOAD, AND WHY EACH PART OF IT.
--
--   person.display_name   the point of identifiable access, and already visible
--                         to these readers through the roster.
--   institution_id        context, and INV-13's own key.
--   enrolment status,     placement. Already visible through `enrollments`,
--   period, programme,    `memberships` and `org_nodes` to a reader standing
--   placement nodes       over the node.
--   official_results      the academic record, produced by `calc_learner_result`
--                         -- the DECLARED computation for this learner over
--                         OFFICIAL evidence -- run inside the boundary 0092
--                         established, so it returns the learner's record AS
--                         SEEN FROM the reader's own authority and not from the
--                         tenant.
--   catalogue_version     provenance, as every other number here cites.
--
-- DELIBERATELY NOT RETURNED: the photo path (not academic); certificates (no
-- staff read path exists -- `certificates_select` is the holder alone -- so
-- returning them would be a NEW disclosure rather than the minimum); sessions,
-- responses and presented items (raw evidence); integrity signals (a separate
-- capability, explicitly out of scope); anything about accounts, cards or
-- authentication.
--
-- THE REFUSAL DISCLOSES NOTHING. A learner out of scope, a learner in another
-- institution and a uuid that is nobody all receive the same refusal, naming
-- the roles the path is for and not the subject. Authorization is therefore
-- decided BEFORE the learner is looked up.
--
-- NO AUDIT ROW IS WRITTEN FOR A REFUSAL. The record means "an authorized
-- Management user opened identifiable learner detail"; a refused call opened
-- nothing, and recording one would put a learner's name against an access that
-- never happened. The row and the payload are written in the same transaction,
-- so a returned payload and a recorded open cannot come apart.

-- ─────────────────────────────────────────────── 1. the roster, said out loud
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
      'CAN_VIEW_LEARNER_ROSTER']
    when 'INSTITUTION_ADMIN' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE','CAN_PUBLISH',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_AUTHORIZE_TRANSFER',
      'CAN_REVIEW_QUESTION_HEALTH','CAN_MANAGE_REPORT_TEMPLATES','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER']
    when 'HEAD_OF_DEPARTMENT' then array['CAN_DRAFT','CAN_REVIEW','CAN_FREEZE_RELEASE',
      'CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT','CAN_REVIEW_QUESTION_HEALTH','CAN_REVIEW_INTEGRITY',
      'CAN_VIEW_LEARNER_ROSTER']
    when 'EDUCATOR' then array['CAN_DRAFT','CAN_ASSIGN_LEARNING','CAN_QUICK_ASSESSMENT',
      'CAN_VIEW_LEARNER_ROSTER']
    -- DEAN HOLDS EXACTLY ONE, AND IT IS NOT A STUDIO POWER. F01-T06 asks about
    -- the Studio five and still gets no from a dean.
    when 'DEAN' then array['CAN_VIEW_LEARNER_ROSTER']
    when 'STUDENT' then array[]::text[]
  end
$function$

;

revoke all on function public.role_capabilities(app_role) from public, anon, authenticated;
grant execute on function public.role_capabilities(app_role) to authenticated;

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
  return false;
exception when others then return false;
end $function$

;
revoke all on function public.person_visible_to_me(uuid) from public, anon, authenticated;
grant execute on function public.person_visible_to_me(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.enrollment_readable(p_id uuid, p_person uuid, p_institution uuid, p_created_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_me uuid;
begin
  if p_id is null or p_person is null or p_institution is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  if p_person = v_me then return true; end if;
  if public.has_scope('INSTITUTION_ADMIN', p_institution) then return true; end if;
  if exists (select 1 from public.memberships m where m.enrollment_id = p_id and public.can_on_node('CAN_VIEW_LEARNER_ROSTER', m.node_id)) then return true; end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = p_person and p_created_at <= pv.granted_at
                and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then return true; end if;
  return false;
exception when others then return false;
end $function$

;
revoke all on function public.enrollment_readable(uuid,uuid,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.enrollment_readable(uuid,uuid,uuid,timestamptz) to authenticated;

CREATE OR REPLACE FUNCTION public.membership_readable(p_enrollment uuid, p_node uuid, p_created_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_me uuid; v_person uuid;
begin
  if p_enrollment is null or p_node is null then return false; end if;
  v_me := public.current_person_id();
  if v_me is null then return false; end if;
  if public.can_on_node('CAN_VIEW_LEARNER_ROSTER', p_node) then return true; end if;
  select person_id into v_person from public.enrollments where id = p_enrollment;
  if v_person is null then return false; end if;
  if v_person = v_me then return true; end if;
  if exists (select 1 from public.portable_visibility pv
              where pv.person_id = v_person and p_created_at <= pv.granted_at
                and public.has_scope('INSTITUTION_ADMIN', pv.institution_id)) then return true; end if;
  return false;
exception when others then return false;
end $function$

;
revoke all on function public.membership_readable(uuid,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.membership_readable(uuid,uuid,timestamptz) to authenticated;


-- ─────────────────────────────────────────────── 2. who Management is, in one place

create or replace function public.management_learner_roles()
returns public.app_role[]
language sql
immutable
parallel safe
set search_path = public, pg_temp
as $$
  select array['HEAD_OF_DEPARTMENT','DEAN']::public.app_role[]
$$;

comment on function public.management_learner_roles() is
  'The roles the ruling names for individual learner detail. Read by the endpoint AND compared with the '
  'registry''s declared requirement by assert_staff_rpc_authorization_declared, so declaration and '
  'implementation cannot drift. INSTITUTION_ADMIN is absent on purpose: administrative authority is not '
  'academic Management authority. SYSTEM_ADMIN is absent on purpose: system administration is not an '
  'academic role.';

revoke all on function public.management_learner_roles() from public, anon, authenticated;
grant execute on function public.management_learner_roles() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note)
values ('management_learner_roles', 'PLATFORM',
        'the roles the individual learner-detail path is for, declared once and read by both the endpoint and the assertion')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note;

-- ─────────────────────────────────────────────── 3. Level 3

create or replace function public.management_learner_detail(p_person uuid, p_institution uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid; v_roles public.app_role[]; v_boundary uuid; v_cat text;
  v_person record; v_enr record; v_placement jsonb; v_results jsonb;
begin
  v_me := public.current_person_id();
  v_roles := public.management_learner_roles();

  -- AUTHORIZATION BEFORE THE LOOKUP, so a refusal says the same thing about a
  -- learner in the next department, a learner in the next school and a uuid
  -- that is nobody. The node returned is the one whose assignment authorized
  -- this reader -- 0091's rule applied to a person -- and it is also the
  -- boundary the record will be read inside.
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

  -- WHERE THIS LEARNER SITS, read through memberships -- the same route the
  -- roster takes -- and bounded to this tenant (INV-13).
  select coalesce(jsonb_agg(jsonb_build_object('node_id', n.id, 'kind', n.kind, 'name', n.name)
                            order by cardinality(n.jalur)), '[]'::jsonb)
    into v_placement
    from public.memberships m
    join public.enrollments e on e.id = m.enrollment_id
    join public.org_nodes n on n.id = m.node_id
   where e.person_id = p_person and e.institution_id = p_institution
     and n.institution_id = p_institution;

  -- THE ACADEMIC RECORD, from the catalogue's own calculator, READ INSIDE THE
  -- BOUNDARY 0092 established. This path does not get to read wider than the
  -- metric path would: the same narrowing applies, bound to the same authority
  -- that let the reader in, and cleared again whatever happens.
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
  end if;

  -- THE ACT, RECORDED. Not a reason, not a case, not a judgement: who, whom,
  -- when, where. `briefing.opened` is the naming this follows. It is written in
  -- the same transaction as the payload is built, so a returned record and a
  -- recorded open cannot come apart.
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
    'official_results', coalesce(v_results, '[]'::jsonb),
    'catalogue_version', v_cat);
end $$;

comment on function public.management_learner_detail(uuid, uuid) is
  'LEVEL 3: one named learner, opened deliberately by a Management role standing over them, and recorded. '
  'Arriving through this endpoint IS the deliberateness -- a row predicate cannot tell a roster from a '
  'person, which is why this is not a policy.';

revoke all on function public.management_learner_detail(uuid, uuid) from public, anon, authenticated;
grant execute on function public.management_learner_detail(uuid, uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('management_learner_detail', 'STAFF',
        'One learner''s academic record, opened on purpose by a head of department or a dean standing over '
        'them, and written to the audit log as learner_detail.opened. Refuses out of scope without naming '
        'the subject, and records nothing when it refuses.',
        'ROLE_SET', 'HEAD_OF_DEPARTMENT,DEAN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ─────────────────────────────────────────────── 4. the declaration must resolve

CREATE OR REPLACE FUNCTION public.assert_staff_rpc_authorization_declared()
 RETURNS TABLE(ok boolean, detail text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare n_total int; n_undeclared int; v_bad text := ''; d record;
        v_caps text[]; v_roles text[]; v_one text;
begin
  select array(select distinct unnest(public.role_capabilities(e.role))
                 from (select unnest(enum_range(null::public.app_role)) as role) e)
    into v_caps;

  select count(*) into n_total
    from public.client_rpc_registry cr
    join pg_proc p on p.proname = cr.function_name and p.pronamespace = 'public'::regnamespace
   where cr.exposure = 'STAFF' and p.provolatile = 'v';

  select count(*) into n_undeclared
    from public.client_rpc_registry cr
    join pg_proc p on p.proname = cr.function_name and p.pronamespace = 'public'::regnamespace
   where cr.exposure = 'STAFF' and p.provolatile = 'v' and cr.authorization_kind is null;

  for d in select cr.function_name, cr.authorization_kind, cr.authorization_requirement
             from public.client_rpc_registry cr
             join pg_proc p on p.proname = cr.function_name and p.pronamespace = 'public'::regnamespace
            where cr.exposure = 'STAFF' and p.provolatile = 'v' and cr.authorization_kind is not null loop
    if d.authorization_kind = 'CAPABILITY' and not (d.authorization_requirement = any (v_caps)) then
      v_bad := v_bad || format('%s declares capability %s, which no role holds; ',
                               d.function_name, d.authorization_requirement);
    elsif d.authorization_kind = 'SCOPE'
      and not exists (select 1 from unnest(enum_range(null::public.app_role)) e
                       where e::text = d.authorization_requirement) then
      v_bad := v_bad || format('%s declares scope role %s, which is not an app_role; ',
                               d.function_name, d.authorization_requirement);
    elsif d.authorization_kind = 'ROLE_SET' then
      -- (i) every named role is real, and (ii) the set is the one the
      --     IMPLEMENTATION reads. A declaration that drifts from the function
      --     it describes is the defect this whole table exists to prevent, and
      --     for a role set it is a one-word edit away.
      v_roles := string_to_array(coalesce(d.authorization_requirement, ''), ',');
      if v_roles is null or cardinality(v_roles) = 0 then
        v_bad := v_bad || format('%s declares an empty role set; ', d.function_name);
      else
        foreach v_one in array v_roles loop
          if not exists (select 1 from unnest(enum_range(null::public.app_role)) r
                          where r::text = trim(v_one)) then
            v_bad := v_bad || format('%s declares role %s, which is not an app_role; ',
                                     d.function_name, v_one);
          end if;
        end loop;
        if (select array(select trim(x) from unnest(v_roles) x order by 1))
           is distinct from
           (select array(select r::text from unnest(public.management_learner_roles()) r order by 1)) then
          v_bad := v_bad || format('%s declares a role set the implementation does not read; ',
                                   d.function_name);
        end if;
      end if;
    elsif d.authorization_kind = 'DELEGATED' then
      if to_regclass('public.' || d.authorization_requirement) is null then
        v_bad := v_bad || format('%s delegates to %s, which is not a table; ',
                                 d.function_name, d.authorization_requirement);
      elsif not exists (select 1 from pg_trigger t
                         where t.tgrelid = to_regclass('public.' || d.authorization_requirement)
                           and not t.tgisinternal and t.tgenabled <> 'D') then
        v_bad := v_bad || format('%s delegates to %s, which carries no enabled trigger to delegate to; ',
                                 d.function_name, d.authorization_requirement);
      end if;
    end if;
  end loop;

  if n_undeclared > 0 then
    ok := false;
    detail := format('%s of %s mutating STAFF endpoint(s) declare no authorization kind', n_undeclared, n_total);
  elsif v_bad <> '' then
    ok := false; detail := v_bad;
  else
    ok := true;
    detail := format('%s mutating STAFF endpoint(s), every one declaring an authorization kind whose '
                  || 'requirement resolves against the live capability model, the role enum, a declared '
                  || 'role set the implementation itself reads, or a guarded table', n_total);
  end if;
  return next;
end $function$

;

revoke all on function public.assert_staff_rpc_authorization_declared() from public, anon, authenticated;

-- ─────────────────────────────────────────────── 5. verification (ADR-0014)

do $$
declare
  v_inst uuid; v_root uuid; v_fac uuid; v_dept_a uuid; v_dept_b uuid; v_period uuid;
  v_prog_a uuid; v_prog_b uuid; v_coh_a uuid; v_coh_b uuid; v_cls_a uuid; v_cls_b uuid;
  v_other uuid; v_hod uuid; v_hod_u uuid; v_dean uuid; v_dean_u uuid;
  v_adm uuid; v_adm_u uuid; v_guru uuid; v_guru_u uuid;
  v_la uuid; v_la_u uuid; v_lb uuid; v_lb_u uuid; v_lx uuid; v_lx_u uuid;
  v_e uuid; r jsonb; n int; n_before bigint; a record; v_caught boolean;
begin
  begin
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah Probe 0095', 'probe-0095-' || substr(md5(random()::text),1,8), true)
    returning institutions.id into v_inst;
    select org_nodes.id into v_root from public.org_nodes
     where institution_id = v_inst and kind = 'INSTITUTION';
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/27', date '2026-07-01', date '2027-06-30')
    returning academic_periods.id into v_period;
    insert into public.org_nodes (institution_id,parent_id,kind,name)
    values (v_inst,v_root,'FACULTY','Fakultas') returning org_nodes.id into v_fac;
    insert into public.org_nodes (institution_id,parent_id,kind,name)
    values (v_inst,v_fac,'DEPARTMENT','A') returning org_nodes.id into v_dept_a;
    insert into public.org_nodes (institution_id,parent_id,kind,name)
    values (v_inst,v_fac,'DEPARTMENT','B') returning org_nodes.id into v_dept_b;
    insert into public.org_nodes (institution_id,parent_id,kind,name)
    values (v_inst,v_dept_a,'PROGRAMME','PA') returning org_nodes.id into v_prog_a;
    insert into public.org_nodes (institution_id,parent_id,kind,name)
    values (v_inst,v_dept_b,'PROGRAMME','PB') returning org_nodes.id into v_prog_b;
    insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
    values (v_inst,v_prog_a,'COHORT','KA',v_period) returning org_nodes.id into v_coh_a;
    insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
    values (v_inst,v_prog_b,'COHORT','KB',v_period) returning org_nodes.id into v_coh_b;
    insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
    values (v_inst,v_coh_a,'CLASS','5A',v_period) returning org_nodes.id into v_cls_a;
    insert into public.org_nodes (institution_id,parent_id,kind,name,academic_period_id)
    values (v_inst,v_coh_b,'CLASS','5B',v_period) returning org_nodes.id into v_cls_b;
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah Lain 0095', 'probe-0095x-' || substr(md5(random()::text),1,8), true)
    returning institutions.id into v_other;

    -- `on_auth_user_created` writes the person and the account, so those are
    -- READ back rather than inserted: a probe that built its own identity rows
    -- would be testing a person the product cannot produce.
    insert into auth.users (id,email) values (gen_random_uuid(),'probe0095-hod@probe.invalid')  returning auth.users.id into v_hod_u;
    insert into auth.users (id,email) values (gen_random_uuid(),'probe0095-dean@probe.invalid') returning auth.users.id into v_dean_u;
    insert into auth.users (id,email) values (gen_random_uuid(),'probe0095-adm@probe.invalid')  returning auth.users.id into v_adm_u;
    insert into auth.users (id,email) values (gen_random_uuid(),'probe0095-guru@probe.invalid') returning auth.users.id into v_guru_u;
    insert into auth.users (id,email) values (gen_random_uuid(),'probe0095-la@probe.invalid')   returning auth.users.id into v_la_u;
    insert into auth.users (id,email) values (gen_random_uuid(),'probe0095-lb@probe.invalid')   returning auth.users.id into v_lb_u;
    insert into auth.users (id,email) values (gen_random_uuid(),'probe0095-lx@probe.invalid')   returning auth.users.id into v_lx_u;
    select person_id into v_hod  from public.accounts where auth_user_id = v_hod_u;
    select person_id into v_dean from public.accounts where auth_user_id = v_dean_u;
    select person_id into v_adm  from public.accounts where auth_user_id = v_adm_u;
    select person_id into v_guru from public.accounts where auth_user_id = v_guru_u;
    select person_id into v_la   from public.accounts where auth_user_id = v_la_u;
    select person_id into v_lb   from public.accounts where auth_user_id = v_lb_u;
    select person_id into v_lx   from public.accounts where auth_user_id = v_lx_u;

    -- INV-16 wants an authenticated grantor and there is none inside a
    -- migration. The declared-synthetic marker is the door 0088's probe uses.
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
      (v_hod,'HEAD_OF_DEPARTMENT',v_dept_a, now() + interval '1 year'),
      (v_dean,'DEAN',             v_fac,    now() + interval '1 year'),
      (v_adm,'INSTITUTION_ADMIN', v_root,   now() + interval '1 year'),
      (v_guru,'EDUCATOR',         v_cls_a,  now() + interval '1 year');
    perform set_config('app.seed_intent', '', true);

    insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
    values (v_la,v_inst,v_period,v_prog_a,'ACTIVE') returning enrollments.id into v_e;
    insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_e,v_cls_a,v_period);
    insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
    values (v_lb,v_inst,v_period,v_prog_b,'ACTIVE') returning enrollments.id into v_e;
    insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_e,v_cls_b,v_period);

    ---------------------------------------------------------------- LEVEL 2
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_hod_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_hod_u::text, true);
    if not public.person_visible_to_me(v_la) then
      raise exception 'B1/B2: a head of department cannot see a learner in their own department';
    end if;
    if public.person_visible_to_me(v_lb) then
      raise exception 'B3: a head of department sees a learner in the sibling department';
    end if;

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_dean_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_dean_u::text, true);
    if not public.person_visible_to_me(v_la) or not public.person_visible_to_me(v_lb) then
      raise exception 'B4: a faculty-scoped dean cannot see a learner inside their faculty';
    end if;
    if public.person_visible_to_me(v_lx) then
      raise exception 'B5: a dean sees a person outside their scope';
    end if;

    ---------------------------------------------------------------- LEVEL 3
    select count(*) into n_before from public.audit_log where action = 'learner_detail.opened';

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_hod_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_hod_u::text, true);
    r := public.management_learner_detail(v_la, v_inst);
    if r ->> 'person_id' is distinct from v_la::text then
      raise exception 'the head of department opened somebody else';
    end if;
    if r ->> 'display_name' is null or jsonb_typeof(r -> 'official_results') <> 'array'
       or jsonb_array_length(r -> 'placement') = 0 then
      raise exception 'the learner came back without identity, record or placement';
    end if;
    select count(*) into n from jsonb_object_keys(r) k
     where k not in ('person_id','display_name','institution_id','enrolment_status',
                     'academic_period','programme','placement','official_results','catalogue_version');
    if n <> 0 then raise exception 'the payload carries % undeclared field(s)', n; end if;

    v_caught := false;
    begin perform public.management_learner_detail(v_lb, v_inst);
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'a head of department opened the sibling department''s learner'; end if;

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_dean_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_dean_u::text, true);
    r := public.management_learner_detail(v_lb, v_inst);
    if r ->> 'person_id' is distinct from v_lb::text then raise exception 'the dean opened somebody else'; end if;
    v_caught := false;
    begin perform public.management_learner_detail(v_lx, v_inst);
    exception when others then
      v_caught := true;
      if sqlerrm like '%' || v_lx::text || '%' then raise exception 'the refusal named the subject'; end if;
    end;
    if not v_caught then raise exception 'a dean opened a learner outside their scope'; end if;
    v_caught := false;
    begin perform public.management_learner_detail(v_la, v_other);
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'a learner was opened against another institution (INV-13)'; end if;

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_u::text, true);
    v_caught := false;
    begin perform public.management_learner_detail(v_la, v_inst);
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'an institution admin reached the Management detail path'; end if;
    if not public.person_visible_to_me(v_la) then
      raise exception 'the institution admin lost the roster';
    end if;
    -- and the metric route is closed to them too, by MC-2
    r := public.metric_evaluate('learner.result', v_la, v_inst, public.current_metric_catalogue());
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'an institution admin still reads learner.result: %', r ->> 'status';
    end if;

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_guru_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_guru_u::text, true);
    if not public.person_visible_to_me(v_la) or public.person_visible_to_me(v_lb) then
      raise exception 'an educator''s roster moved';
    end if;
    v_caught := false;
    begin perform public.management_learner_detail(v_la, v_inst);
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'an educator reached the Management detail path'; end if;
    -- the educator keeps the metric route for their own learner, and only theirs
    r := public.metric_evaluate('learner.result', v_la, v_inst, public.current_metric_catalogue());
    if r ->> 'status' = 'not_permitted' then
      raise exception 'an educator lost learner.result for a learner in their own class';
    end if;
    r := public.metric_evaluate('learner.result', v_lb, v_inst, public.current_metric_catalogue());
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'an educator read learner.result outside their teaching scope';
    end if;

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_la_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_la_u::text, true);
    if not public.person_visible_to_me(v_la) or public.person_visible_to_me(v_lb) then
      raise exception 'a learner''s own visibility moved';
    end if;
    r := public.metric_evaluate('learner.result', v_la, v_inst, public.current_metric_catalogue());
    if r ->> 'status' = 'not_permitted' then raise exception 'a learner lost their own result'; end if;
    r := public.metric_evaluate('learner.result', v_lb, v_inst, public.current_metric_catalogue());
    if r ->> 'status' <> 'not_permitted' then raise exception 'a learner read another learner''s result'; end if;
    v_caught := false;
    begin perform public.management_learner_detail(v_la, v_inst);
    exception when others then v_caught := true; end;
    if not v_caught then raise exception 'a learner reached the Management detail path'; end if;

    -- the dean holds no Studio capability
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_dean_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_dean_u::text, true);
    if public.can_on_node('CAN_DRAFT', v_cls_a) or public.can_on_node('CAN_PUBLISH', v_root)
       or public.can_on_node('CAN_QUICK_ASSESSMENT', v_cls_a)
       or public.can_on_node('CAN_ASSIGN_LEARNING', v_cls_a)
       or public.can_on_node('CAN_AUTHORIZE_TRANSFER', v_root)
       or public.can_on_node('CAN_REVIEW', v_root) or public.can_on_node('CAN_FREEZE_RELEASE', v_root)
       or public.can_on_node('CAN_MANAGE_REPORT_TEMPLATES', v_root)
       or public.can_on_node('CAN_REVIEW_QUESTION_HEALTH', v_root)
       or public.can_on_node('CAN_REVIEW_INTEGRITY', v_root) then
      raise exception 'the dean holds a Studio capability';
    end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if public.role_capabilities('DEAN') <> array['CAN_VIEW_LEARNER_ROSTER'] then
      raise exception 'the dean holds something other than the one looking capability';
    end if;

    ---------------------------------------------------------------- the record
    select count(*) into n from public.audit_log where action = 'learner_detail.opened';
    if n - n_before <> 2 then
      raise exception '% audit row(s) for 2 successful opens and 6 refusals', n - n_before;
    end if;
    select * into a from public.audit_log
     where action = 'learner_detail.opened' and target_id = v_la::text order by id desc limit 1;
    if a.actor_person_id is distinct from v_hod or a.target_table <> 'persons'
       or a.institution_id is distinct from v_inst or a.at is null then
      raise exception 'the audit row does not carry reader, subject, institution and moment';
    end if;
    if exists (select 1 from public.audit_log
                where action = 'learner_detail.opened' and target_id = v_lx::text) then
      raise exception 'a refused read was recorded as a read';
    end if;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('app.seed_intent', '', true);
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;
  raise notice '0095 verified: the roster is a named capability rather than a rank accident and the same '
    'people see the same names; a head of department and a dean open a learner inside their scope and are '
    'refused outside it, in another school, and without the refusal naming the subject; an institution '
    'admin reaches neither the Management path NOR learner.result while keeping the roster; an educator '
    'keeps learner.result for their own class and is refused outside it and on the Management path; a '
    'learner keeps their own result and reaches neither another learner nor the Management path; the dean '
    'holds no Studio capability; and two opens wrote two audit rows naming reader, subject, institution '
    'and moment while six refusals wrote none';
end $$;

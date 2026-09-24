-- 0092 -- the organizational boundary exists before the calculator sees data.
--
-- WHAT 0091 GOT RIGHT AND WHAT IT GOT WRONG. 0091 required a reader to hold
-- both the catalogue AUDIENCE and organizational CONTAINMENT over the node a
-- metric was asked at, and that part stands. What it got wrong was HOW it
-- decided which node governs a request: it read the calculator's parsed body
-- and asked whether `p_node` appeared in it.
--
-- THAT QUESTION CANNOT BE ANSWERED BY LOOKING AT THE CALCULATOR. Measured on
-- this schema, against the very metric the leak was found on:
--
--   and (p_node is not null)                     -- reads the whole tenant for
--                                                -- every real node, returns
--                                                -- nothing for NULL
--   and (p_node is not null or p_node is null)   -- mentions the node inertly
--   and (s.class_node_id = p_node
--        or p_node is not null)                  -- records a real column
--                                                -- dependency on class_node_id
--                                                -- AND restricts nothing
--
-- The first defeats a body-text check. The second defeats it too. The third
-- defeats a text check, a NULL behavioural probe, AND a check against the
-- parser's own column-dependency record -- all three -- and still hands a
-- department-scoped reader the whole school. Every one of them was run here
-- and every one of them worked.
--
-- The reason is structural rather than a shortage of cleverness: the
-- calculator is code, the check feeds it something, and code can branch on
-- what it is fed. A fourth check would be a move in a game the calculator
-- always plays last.
--
-- SO THE BOUNDARY STOPS DEPENDING ON THE CALCULATOR. This migration builds the
-- room the calculator will be allowed to work in; 0093 puts it in there. The
-- engine resolves the legitimate boundary from an explicit declaration, binds
-- it, and the calculator reads sources that carry the boundary in their own
-- definition. A calculator may then use its node correctly, ignore it, mention
-- it decoratively or branch on it wrongly -- and none of that can widen what
-- it sees, because the widening is not its to do.
--
-- THE THREAT MODEL IS ORDINARY MISTAKES, and it is stated rather than implied.
-- A migration author who deliberately ships privileged SQL can clear the
-- binding, and nothing here pretends otherwise -- PostgreSQL does not enforce
-- volatility, so even a `stable` calculator may call `set_config` or write.
-- Repository review, the migration series and CI are the control for that.
-- What this closes is the case that actually happens: ordinary SQL, written by
-- someone who is not attacking anything, that is wider than it meant to be.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE BINDING IS TRANSACTION-LOCAL AND HAS TWO SHAPES.
--
--   NODE   the usual one. Rows are visible when their own organizational node
--          sits at or below the bound node -- the same `jalur` containment
--          `can_on_node` uses, read in the other direction.
--   PERSON the learner reading their own record, who holds no role assignment
--          and therefore stands at no node at all. Without this shape,
--          self-access would fail closed to nothing, which would be a
--          regression dressed as a security improvement.
--
-- Exactly one shape is ever set. Neither set means NO ROWS -- there is no
-- unbound reading, and in particular no silent fall back to the tenant.
--
-- A ROW WITH NO ORGANIZATIONAL NODE is visible only at the institution root.
-- Sessions carry a class and a cohort; one carrying neither belongs to the
-- school and to no part of it, so the only boundary that contains it is the
-- school itself. That is the fail-closed reading and it keeps the
-- institution-root total identical to what it is today.

-- ─────────────────────────────────────────────── 1. reading the binding

create or replace function public.metric_boundary_node()
returns uuid
language plpgsql
stable
set search_path = public, pg_temp
as $$
begin
  return nullif(current_setting('pintar.metric_boundary_node', true), '')::uuid;
exception when others then return null;   -- unset, blank or not a uuid: no boundary
end $$;

comment on function public.metric_boundary_node() is
  'The organizational node the engine bound for this evaluation, or NULL. NULL means no rows, never the '
  'whole tenant.';

revoke all on function public.metric_boundary_node() from public, anon, authenticated;

create or replace function public.metric_boundary_person()
returns uuid
language plpgsql
stable
set search_path = public, pg_temp
as $$
begin
  return nullif(current_setting('pintar.metric_boundary_person', true), '')::uuid;
exception when others then return null;
end $$;

comment on function public.metric_boundary_person() is
  'The one person the engine bound for this evaluation, for a learner reading their own record. A learner '
  'holds no role assignment and stands at no node, so without this shape self-access would fail closed.';

revoke all on function public.metric_boundary_person() from public, anon, authenticated;

-- ─────────────────────────────────────────────── 2. what the boundary admits

-- A ROW THAT CARRIES AN ORGANIZATIONAL NODE. `p_node` is the row's own most
-- specific node; `p_person` is its subject.
create or replace function public.row_in_metric_boundary(
  p_institution uuid, p_node uuid, p_person uuid)
returns boolean
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare v_node uuid; v_person uuid; v_jalur uuid[]; v_binst uuid;
begin
  if p_institution is null then return false; end if;
  v_person := public.metric_boundary_person();
  if v_person is not null then
    -- the one-person shape: nothing else is visible, whatever node the row sits on
    return p_person is not null and p_person = v_person;
  end if;
  v_node := public.metric_boundary_node();
  if v_node is null then return false; end if;           -- unbound reads nothing
  select n.institution_id into v_binst from public.org_nodes n where n.id = v_node;
  if v_binst is null or v_binst <> p_institution then return false; end if;   -- INV-13
  if p_node is null then
    -- belongs to the school and to no part of it: only the root contains it
    return v_node = p_institution;
  end if;
  select n.jalur into v_jalur from public.org_nodes n where n.id = p_node;
  if v_jalur is null then return false; end if;
  return v_jalur @> array[v_node];
exception when others then return false;
end $$;

comment on function public.row_in_metric_boundary(uuid, uuid, uuid) is
  'Is this evidence row inside the boundary the engine bound? Containment is jalur, the same predicate '
  'can_on_node uses. Fails closed on an unbound, unknown or cross-tenant boundary.';

revoke all on function public.row_in_metric_boundary(uuid, uuid, uuid) from public, anon, authenticated;

-- A ROW ABOUT A PERSON THAT CARRIES NO NODE OF ITS OWN -- a certificate. The
-- person's own memberships decide, so a credential is seen where its holder is.
create or replace function public.person_in_metric_boundary(p_institution uuid, p_person uuid)
returns boolean
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare v_node uuid; v_bperson uuid; v_binst uuid;
begin
  if p_institution is null or p_person is null then return false; end if;
  v_bperson := public.metric_boundary_person();
  if v_bperson is not null then return p_person = v_bperson; end if;
  v_node := public.metric_boundary_node();
  if v_node is null then return false; end if;
  select n.institution_id into v_binst from public.org_nodes n where n.id = v_node;
  if v_binst is null or v_binst <> p_institution then return false; end if;
  if v_node = p_institution then
    return exists (select 1 from public.enrollments e
                    where e.person_id = p_person and e.institution_id = p_institution);
  end if;
  return exists (
    select 1 from public.memberships m
      join public.enrollments e on e.id = m.enrollment_id
      join public.org_nodes n on n.id = m.node_id
     where e.person_id = p_person and e.institution_id = p_institution
       and n.jalur @> array[v_node]);
exception when others then return false;
end $$;

comment on function public.person_in_metric_boundary(uuid, uuid) is
  'A credential has no node of its own, so its holder''s memberships decide where it is seen.';

revoke all on function public.person_in_metric_boundary(uuid, uuid) from public, anon, authenticated;

-- A ROW ABOUT A TENANT-LEVEL ASSET. An item carries no organizational node and
-- this migration does not invent one: `items` has a lesson and an institution
-- and nothing else, and a question-to-department ownership model is a content
-- governance decision, not a boundary repair. So the boundary for item evidence
-- is the TENANT -- which preserves the approved audience-in-tenant behaviour
-- while still refusing to read anything when nothing is bound.
create or replace function public.tenant_in_metric_boundary(p_institution uuid)
returns boolean
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare v_node uuid;
begin
  if p_institution is null then return false; end if;
  if public.metric_boundary_person() is not null then return false; end if;
  v_node := public.metric_boundary_node();
  if v_node is null then return false; end if;
  return exists (select 1 from public.org_nodes n
                  where n.id = v_node and n.institution_id = p_institution);
exception when others then return false;
end $$;

comment on function public.tenant_in_metric_boundary(uuid) is
  'Item evidence has no organizational home, so its boundary is the tenant. Still fails closed when '
  'nothing is bound: there is no unbound read anywhere in this layer.';

revoke all on function public.tenant_in_metric_boundary(uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────── 3. the sources, with the boundary in them

create or replace view public.scoped_official_sessions as
  select s.* from public.official_sessions s
   where public.row_in_metric_boundary(
           s.institution_id, coalesce(s.class_node_id, s.cohort_node_id), s.person_id);

create or replace view public.scoped_official_results as
  select r.* from public.official_results r
   where exists (select 1 from public.scoped_official_sessions s where s.id = r.session_id);

create or replace view public.scoped_service_cohort_misconceptions as
  select m.* from public.service_cohort_misconceptions m
   where public.row_in_metric_boundary(
           m.institution_id, coalesce(m.class_node_id, m.cohort_node_id), null);

create or replace view public.scoped_certificates as
  select c.* from public.certificates c
   where public.person_in_metric_boundary(c.institution_id, c.person_id);

create or replace view public.scoped_service_item_statistics as
  select st.* from public.service_item_statistics st
   where public.tenant_in_metric_boundary(st.institution_id);

create or replace view public.scoped_service_distractor_uptake as
  select u.* from public.service_distractor_uptake u
   where public.tenant_in_metric_boundary(u.institution_id);

-- NO CLIENT ROLE IS GRANTED ANYTHING HERE. These exist for calculators, which
-- run inside a SECURITY DEFINER evaluator; a client reaching them directly
-- would be reading evidence, which assert_evidence_consumer_boundary governs.
comment on view public.scoped_official_sessions is
  'official_sessions, narrowed to the boundary the engine bound. The narrowing is in the SOURCE so that a '
  'calculator cannot decline to apply it.';

-- ─────────────────────────────────────────────── 4. verification (ADR-0014)

do $$
declare
  v_inst uuid; v_root uuid; v_fac uuid; v_dept_a uuid; v_dept_b uuid; v_period uuid;
  v_prog_a uuid; v_prog_b uuid; v_coh_a uuid; v_coh_b uuid; v_cls_a uuid; v_cls_b uuid;
  v_pa uuid; v_pb uuid; v_ea uuid; v_eb uuid; n int; v_other uuid;
begin
  begin
    -- A SCHOOL WITH TWO POPULATED SIDES. Both branches carry a session, so
    -- "the sibling is not visible" is a statement about rows that exist.
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah Probe 0092', 'probe-0092-' || substr(md5(random()::text),1,8), true)
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
    values ('Sekolah Lain 0092', 'probe-0092x-' || substr(md5(random()::text),1,8), true)
    returning institutions.id into v_other;

    insert into public.persons (display_name) values ('Murid A') returning persons.id into v_pa;
    insert into public.persons (display_name) values ('Murid B') returning persons.id into v_pb;
    insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
    values (v_pa,v_inst,v_period,v_prog_a,'ACTIVE') returning enrollments.id into v_ea;
    insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_ea,v_cls_a,v_period);
    insert into public.enrollments (person_id,institution_id,academic_period_id,programme_id,status)
    values (v_pb,v_inst,v_period,v_prog_b,'ACTIVE') returning enrollments.id into v_eb;
    insert into public.memberships (enrollment_id,node_id,academic_period_id) values (v_eb,v_cls_b,v_period);

    -- (1) THE BOUNDARY ADMITS AND REFUSES BY POSITION.
    perform set_config('pintar.metric_boundary_person', '', true);
    perform set_config('pintar.metric_boundary_node', v_dept_a::text, true);
    if not public.row_in_metric_boundary(v_inst, v_cls_a, v_pa) then
      raise exception 'a row in the bound department was refused';
    end if;
    if public.row_in_metric_boundary(v_inst, v_cls_b, v_pb) then
      raise exception 'a row in the SIBLING department was admitted';
    end if;
    if public.row_in_metric_boundary(v_inst, v_fac, null) then
      raise exception 'a row on the ancestor faculty was admitted';
    end if;
    if public.row_in_metric_boundary(v_inst, null, v_pa) then
      raise exception 'a row with no node was admitted below the root';
    end if;

    perform set_config('pintar.metric_boundary_node', v_root::text, true);
    if not public.row_in_metric_boundary(v_inst, v_cls_b, v_pb)
       or not public.row_in_metric_boundary(v_inst, null, v_pa) then
      raise exception 'the institution root did not contain its own school';
    end if;

    -- (2) EVERY FAIL-CLOSED ROUTE ANSWERS NO ROWS.
    perform set_config('pintar.metric_boundary_node', '', true);
    if public.row_in_metric_boundary(v_inst, v_cls_a, v_pa)
       or public.tenant_in_metric_boundary(v_inst)
       or public.person_in_metric_boundary(v_inst, v_pa) then
      raise exception 'an UNBOUND read was admitted: the boundary fell back to something';
    end if;
    perform set_config('pintar.metric_boundary_node', 'not-a-uuid', true);
    if public.row_in_metric_boundary(v_inst, v_cls_a, v_pa) or public.tenant_in_metric_boundary(v_inst) then
      raise exception 'a malformed boundary was admitted';
    end if;
    perform set_config('pintar.metric_boundary_node', gen_random_uuid()::text, true);
    if public.row_in_metric_boundary(v_inst, v_cls_a, v_pa) or public.tenant_in_metric_boundary(v_inst) then
      raise exception 'a boundary naming no node was admitted';
    end if;
    perform set_config('pintar.metric_boundary_node', v_other::text, true);
    if public.row_in_metric_boundary(v_inst, v_cls_a, v_pa) or public.tenant_in_metric_boundary(v_inst) then
      raise exception 'a boundary from ANOTHER INSTITUTION was admitted (INV-13)';
    end if;

    -- (3) THE ONE-PERSON SHAPE sees itself and nothing beside it.
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', v_pa::text, true);
    if not public.row_in_metric_boundary(v_inst, v_cls_a, v_pa) then
      raise exception 'a learner could not see their own row';
    end if;
    if public.row_in_metric_boundary(v_inst, v_cls_a, v_pb) then
      raise exception 'a learner saw a classmate''s row';
    end if;
    if public.tenant_in_metric_boundary(v_inst) then
      raise exception 'the one-person shape opened the item bank';
    end if;

    -- (4) AND EVERY SCOPED SOURCE CARRIES THE PREDICATE, as the PARSER records
    --     it rather than as its text reads. A scoped view that forgot to narrow
    --     would be the whole repair undone quietly.
    perform set_config('pintar.metric_boundary_person', '', true);
    --     A source is scoped DIRECTLY when it calls a boundary predicate, or
    --     TRANSITIVELY when it reads another scoped source that does --
    --     `scoped_official_results` is the second kind, because a result carries
    --     no node of its own and takes its place in the school from its session.
    --     This check was written admitting only the first kind and immediately
    --     refused that view, which is the check working: the answer was to say
    --     what the architecture means, not to drop the case.
    select count(*) into n
      from (values ('scoped_official_sessions'), ('scoped_official_results'),
                   ('scoped_service_cohort_misconceptions'), ('scoped_certificates'),
                   ('scoped_service_item_statistics'), ('scoped_service_distractor_uptake')) v(rel)
     where not exists (
       select 1 from pg_rewrite rw
         join pg_depend dep on dep.objid = rw.oid and dep.classid = 'pg_rewrite'::regclass
                           and dep.refclassid = 'pg_proc'::regclass
         join pg_proc p on p.oid = dep.refobjid
        where rw.ev_class = ('public.' || v.rel)::regclass
          and p.proname in ('row_in_metric_boundary','person_in_metric_boundary','tenant_in_metric_boundary'))
       and not exists (
       select 1 from pg_rewrite rw
         join pg_depend dep on dep.objid = rw.oid and dep.classid = 'pg_rewrite'::regclass
                           and dep.refclassid = 'pg_class'::regclass
         join pg_class c2 on c2.oid = dep.refobjid
         join pg_namespace n2 on n2.oid = c2.relnamespace
        where rw.ev_class = ('public.' || v.rel)::regclass
          and n2.nspname = 'public' and c2.relname like 'scoped\_%' and c2.relname <> v.rel);
    if n <> 0 then
      raise exception '% scoped source(s) are narrowed neither by a boundary predicate nor through another scoped source', n;
    end if;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;
  raise notice '0092 verified: the boundary admits its own subtree and refuses the sibling, the ancestor and '
    'a row with no node; an unbound, malformed, unknown or cross-tenant boundary reads nothing at all rather '
    'than falling back to the tenant; the one-person shape sees one person and does not open the item bank; '
    'and all six scoped sources depend on a boundary predicate as the parser records it';
end $$;

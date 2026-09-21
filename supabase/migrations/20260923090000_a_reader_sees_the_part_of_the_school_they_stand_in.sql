-- 0091 -- intelligence is bounded by where the reader stands, not by which
-- school they belong to.
--
-- THE RULING. "The organizational visibility of a scoped role is its assigned
-- scope_node_id and its legitimate descendants. Institution membership alone
-- does NOT widen that scope." For an intelligence or reporting read, ROLE /
-- AUDIENCE authorization and ORGANIZATIONAL-SCOPE authorization must BOTH pass.
--
-- WHAT WAS WRONG, MEASURED ON THIS SCHEMA RATHER THAN INFERRED.
-- `metric_evaluate` took a node and never compared it to the caller's scope:
--
--     or exists (select 1 from public.role_assignments ra
--                 where ra.person_id = v_me and ra.institution_id = p_institution
--                   ... and ra.role = any(d.allowed_audiences))
--
-- `p_node` appeared exactly twice in the body below that line -- once in the
-- learner self-check, once as a parameter to the calculator -- and nowhere in
-- the authorization. So the node was an INPUT TO THE CALCULATION and never a
-- SUBJECT OF THE DECISION. A Head of Department scoped to one department, asked
-- against the demonstration tenant, returned:
--
--     class.participants   on their own class     status=ok  value=1
--     institution.participants                    status=ok  value=1   <--
--
-- The second is the whole school, read by a role standing in one department.
--
-- AND THE SECOND CHANNEL. `generated_reports_select` was
-- `is_member_of_institution(institution_id)`, so even with the evaluator
-- repaired, yesterday's institution-wide report stayed readable by anyone in
-- the building. A boundary with a second door is not a boundary.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE NODE A REQUEST IS ACTUALLY ABOUT IS NOT ALWAYS THE NODE IT NAMES.
--
-- This is the part that took measurement rather than design, and it is why the
-- obvious repair -- "compare p_node to the caller's scope" -- would have left
-- the headline leak open. Six of the sixteen live calculators NEVER READ
-- `p_node` at all; they aggregate the whole tenant and ignore what they were
-- pointed at:
--
--     calc_institution_participants(p_node, p_institution, p_catalogue)
--       ... where s.institution_id = p_institution     -- p_node unused
--
-- Containing such a request at `p_node` would be theatre: the caller names
-- their own department, passes containment, and receives the institution. The
-- governing node of those requests is the institution ROOT, whatever was named.
--
-- THE CATALOGUE CANNOT BE ASKED, BECAUSE IT DOES NOT KNOW. `metric_definitions`
-- declares a `scope`, and one of the six declares COHORT while computing over
-- every cohort in the school (`institution.cohort_comparison`). Reading the
-- declaration would have re-opened the leak through the mis-declared row. The
-- declaration is recorded as a finding; it is not what this migration trusts.
--
-- SO THE CALCULATION IS ASKED INSTEAD, and it answers from the parser:
-- `pg_get_function_sqlbody` renders a calculator's PARSED body, which excludes
-- the signature -- so "does this body mention p_node" separates the six from
-- the ten exactly. This rests on a property the schema already enforces rather
-- than on a new promise: `assert_metric_closure` refuses any calculator whose
-- `prosqlbody is null`, and refuses one that reads through a helper. A future
-- calculator that evades the question does not reach a release.
--
-- AND IT FAILS CLOSED. No parsed body -> the answer is "tenant-wide", which is
-- the STRICTER reading: a calculator nobody can inspect is governed at the
-- institution root, where only an institution-scoped role stands.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT IS DELIBERATELY NOT CONTAINED, said out loud rather than left to be
-- discovered.
--
-- ITEM-scope metrics (`item.correctness_rate` and its two siblings) are NOT
-- given an organizational boundary, because they do not have one to be given:
-- `items` carries `lesson_id` and `institution_id` and no node, the bank is a
-- tenant-level asset, and Head of Department holds CAN_REVIEW_QUESTION_HEALTH
-- over it. Inventing a mapping from a question to a department would be
-- inventing a product concept, which this work package forbids. They keep the
-- audience-in-tenant rule they have always had, and that is a reported boundary
-- rather than an oversight.
--
-- THE WORD "DEPARTMENT" APPEARS NOWHERE BELOW as a mechanism. Nothing here
-- tests `kind = 'DEPARTMENT'`, and nothing here is about Head of Department in
-- particular. The rule is the same sentence for every scoped role -- an
-- EDUCATOR on one class, a DEAN on one faculty, an INSTITUTION_ADMIN on the
-- root -- expressed in the containment the hierarchy already carries
-- (`jalur @> array[scope_node_id]`, the same predicate `can_on_node` uses).
-- A DEAN scoped to a FACULTY therefore stops receiving institution-wide
-- aggregates. That is the ruling applied, not a side effect of it.
--
-- ONE ASSIGNMENT MUST CARRY BOTH HALVES, following `can_on_node`'s shape rather
-- than inventing a looser one: the role that puts the caller in the audience is
-- the same row whose scope must contain the node. Holding EDUCATOR on a class
-- and DEAN on a faculty does not compose into DEAN over the class's data.
--
-- LEARNER_IN_INSTITUTION IS CONTAINED TOO, through the learner rather than
-- through a node: a staff reader must stand over a node the learner is a
-- member of. The learner's own self-read is untouched.
--
-- NOT TOUCHED HERE: `person_visible_to_me`, `has_scope`, and every capability
-- in `role_capabilities`. Rank-based person visibility is the subject of a
-- separate ruling and is reported, not changed.

-- ─────────────────────────────────────────────── 1. does a calculator read its node

create or replace function public.metric_computes_tenant_wide(p_calculation_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not coalesce((
    select pg_get_function_sqlbody(p.oid) ~ '\mp_node\M'
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'calc_' || p_calculation_key
     limit 1), false);
$$;

comment on function public.metric_computes_tenant_wide(text) is
  'True when a calculator never reads the node it is given and therefore aggregates the whole tenant. '
  'Answered from the PARSED body, which excludes the signature. Unknown or unparsed answers true, which '
  'is the stricter reading: such a request is governed at the institution root.';

revoke all on function public.metric_computes_tenant_wide(text) from public, anon, authenticated;

-- ─────────────────────────────────────────────── 2. audience and containment, on one assignment

create or replace function public.audience_on_node(p_audiences public.app_role[], p_node uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_jalur uuid[]; v_person uuid;
begin
  if p_audiences is null or p_node is null then return false; end if;
  v_person := public.current_person_id();
  if v_person is null then return false; end if;
  select jalur into v_jalur from public.org_nodes where id = p_node;
  -- Not an organizational node -- a lesson id, an item id, a stale uuid. There
  -- is no containment to test, so there is no permission to give.
  if v_jalur is null then return false; end if;
  return coalesce((
    select true from public.role_assignments ra
     where ra.person_id = v_person and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and ra.role = any (p_audiences)
       and ra.scope_node_id is not null and v_jalur @> array[ra.scope_node_id]
     limit 1), false);
exception when others then return false;
end $$;

comment on function public.audience_on_node(public.app_role[], uuid) is
  'One live assignment that is BOTH in the audience AND scoped at or above the node. No SYSTEM_ADMIN '
  'branch: the caller short-circuits on is_system_admin() before reaching this.';

revoke all on function public.audience_on_node(public.app_role[], uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────── 3. the same question about a named learner

create or replace function public.audience_over_learner(
  p_audiences public.app_role[], p_learner uuid, p_institution uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_person uuid;
begin
  if p_audiences is null or p_learner is null or p_institution is null then return false; end if;
  v_person := public.current_person_id();
  if v_person is null then return false; end if;
  -- The learner is reached THROUGH the organization, not around it: some node
  -- they are a member of must sit under a node this reader stands on, and both
  -- must be this tenant's (INV-13).
  return exists (
    select 1
      from public.memberships m
      join public.enrollments e on e.id = m.enrollment_id
      join public.org_nodes n on n.id = m.node_id
      join public.role_assignments ra on ra.person_id = v_person
     where e.person_id = p_learner
       and e.institution_id = p_institution
       and n.institution_id = p_institution
       and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and ra.role = any (p_audiences)
       and ra.scope_node_id is not null
       and n.jalur @> array[ra.scope_node_id]);
exception when others then return false;
end $$;

comment on function public.audience_over_learner(public.app_role[], uuid, uuid) is
  'Containment for a metric whose subject is a person: the reader stands over a node the learner belongs '
  'to. Mirrors person_visible_to_me''s membership branch in shape, but is keyed on the catalogue audience '
  'rather than on role rank.';

revoke all on function public.audience_over_learner(public.app_role[], uuid, uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────── 4. does the reader stand at or above this node

create or replace function public.node_in_my_scope(p_node uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_jalur uuid[]; v_person uuid;
begin
  if p_node is null then return false; end if;
  if public.is_system_admin() then return true; end if;
  v_person := public.current_person_id();
  if v_person is null then return false; end if;
  select jalur into v_jalur from public.org_nodes where id = p_node;
  if v_jalur is null then return false; end if;
  return coalesce((
    select true from public.role_assignments ra
     where ra.person_id = v_person and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and ra.scope_node_id is not null and v_jalur @> array[ra.scope_node_id]
     limit 1), false);
exception when others then return false;
end $$;

comment on function public.node_in_my_scope(uuid) is
  'Containment alone, with no role rank and no capability in it: is this node at or below somewhere the '
  'caller is assigned. Used where the question really is only "is this part of the school mine to read".';

revoke all on function public.node_in_my_scope(uuid) from public, anon, authenticated;
-- Executable by `authenticated` because an RLS policy runs as the QUERYING
-- role, not as the policy's author -- so a predicate the client may not execute
-- is a policy that refuses everyone. `person_visible_to_me` is exposed for the
-- same reason and carries the same class; `assert_engine_takes_no_identity`
-- refuses a client-executable definer function that declares none.
grant execute on function public.node_in_my_scope(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note)
values ('node_in_my_scope', 'PLATFORM',
        'containment predicate used by policies: is this node at or below somewhere the caller is assigned')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note;

-- ─────────────────────────────────────────────── 5. the evaluator

create or replace function public.metric_evaluate(
  p_metric_id text, p_node uuid, p_institution uuid, p_catalogue_version text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_cat text; d public.metric_definitions; v_out jsonb; v_permitted boolean;
  v_me uuid; v_governing uuid;
begin
  v_cat := coalesce(p_catalogue_version, public.current_metric_catalogue());
  if v_cat is null then
    raise exception 'no live metric catalogue: a report cannot cite a version that does not exist';
  end if;
  if not exists (select 1 from public.metric_catalogue c where c.version = v_cat) then
    raise exception 'no such catalogue version: %', v_cat;
  end if;
  v_me := public.current_person_id();

  select * into d from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = p_metric_id;

  -- Nothing exists to authorize against, and nothing about a metric is
  -- disclosed by saying an id is not in the catalogue.
  if d.metric_id is null then
    return jsonb_build_object('status', 'unavailable',
                              'statement_key', 'laporan.metrik.tidak_dikenal');
  end if;

  -- WHICH NODE THIS REQUEST IS ACTUALLY ABOUT. A calculator that never reads
  -- its node computes over the tenant however it was pointed, so the truthful
  -- governing node is the institution root -- which only an institution-scoped
  -- assignment contains. ITEM and LEARNER_IN_INSTITUTION name something that is
  -- not an organizational node at all and are handled on their own terms below.
  v_governing := case
    when d.scope in ('ITEM', 'LEARNER_IN_INSTITUTION') then null
    when public.metric_computes_tenant_wide(d.calculation_key) then p_institution
    else p_node
  end;

  -- AUTHORIZATION FIRST. Every status below this line says something about a
  -- real metric -- that it was retired, that it has too little evidence -- and
  -- none of it may reach someone with no right to the metric. 0072 checked
  -- deprecation above this point and leaked exactly that.
  --
  -- TWO HALVES, BOTH REQUIRED (0091). Being in the catalogue's audience is a
  -- statement about the KIND of thing the reader may see. Standing over the
  -- node is a statement about WHICH school this is. Membership of the
  -- institution answers neither on its own, and until 0091 it answered both.
  v_permitted := public.is_system_admin()
    -- a learner's own result
    or (d.scope = 'LEARNER_IN_INSTITUTION' and v_me is not null and p_node = v_me
        and 'STUDENT' = any(d.allowed_audiences))
    -- a named learner, reached through a node the reader stands over
    or (d.scope = 'LEARNER_IN_INSTITUTION'
        and public.audience_over_learner(d.allowed_audiences, p_node, p_institution))
    -- a question: a tenant-level asset with no node to be contained by, so the
    -- audience-in-tenant rule it has always had is what governs it
    or (d.scope = 'ITEM'
        and exists (select 1 from public.role_assignments ra
                     where ra.person_id = v_me and ra.institution_id = p_institution
                       and ra.revoked_at is null
                       and now() >= ra.valid_from and now() < ra.valid_until
                       and ra.role = any(d.allowed_audiences)))
    -- everything organizational
    or public.audience_on_node(d.allowed_audiences, v_governing);

  if not v_permitted then
    -- Carries no metric id, no label, no catalogue version. The caller already
    -- knows what it asked for; a reader must not learn it from here.
    return jsonb_build_object('status', 'not_permitted',
                              'statement_key', 'laporan.metrik.bukan_untuk_anda');
  end if;

  if d.deprecated then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'deprecated', 'label_key', d.label_key,
                              'statement_key', coalesce(d.deprecation_note_key, 'laporan.metrik.diganti'));
  end if;

  -- 'calc_' || key, matching the bijection assert_metric_closure checks. 0072
  -- built this name without the prefix and shipped broken: its terminal block
  -- exercised only `unavailable` and `not_permitted`, both of which return
  -- BEFORE this line. Watching the guards fail is not the same as watching the
  -- happy path succeed, and only the latter reaches a dispatch.
  execute format('select public.%I($1, $2, $3)', 'calc_' || d.calculation_key)
     into v_out using p_node, p_institution, v_cat;

  if coalesce((v_out ->> 'sample')::numeric, 0) < d.minimum_sample then
    return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                              'status', 'below_minimum', 'label_key', d.label_key,
                              'statement_key', 'laporan.metrik.belum_cukup_data',
                              'have', coalesce((v_out ->> 'sample')::numeric, 0),
                              'needed', d.minimum_sample);
  end if;

  return jsonb_build_object('metric_id', p_metric_id, 'catalogue_version', v_cat,
                            'status', 'ok', 'scope', d.scope,
                            'label_key', d.label_key, 'meaning_key', d.meaning_key,
                            'allowed_visualizations', to_jsonb(d.allowed_visualizations),
                            'value', v_out -> 'value', 'sample', v_out -> 'sample');
end $$;

revoke all on function public.metric_evaluate(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.metric_evaluate(text, uuid, uuid, text) to authenticated;

-- ─────────────────────────────────────────────── 6. the report

create or replace function public.generate_report(
  p_template uuid, p_scope_node uuid, p_catalogue_version text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare t public.report_templates; v_cat text; v_entries jsonb := '[]'::jsonb;
        v_row record; v_one jsonb; v_id uuid; n_ok int; n_omitted int;
begin
  select * into t from public.report_templates where id = p_template;
  if t.id is null then raise exception 'no such report template'; end if;
  v_cat := coalesce(p_catalogue_version, public.current_metric_catalogue());

  -- Reading a report requires standing in the institution, but NOT the
  -- capability that saved the template. A template is a request, not an
  -- entitlement: what the reader may see is decided per metric, below.
  if not public.is_member_of_institution(t.institution_id) then
    raise exception 'that report belongs to another institution';
  end if;

  -- INV-13, ON THE NODE AS WELL AS ON THE TEMPLATE (0091). `p_scope_node`
  -- arrives from a query string on both report surfaces and was forwarded
  -- unread -- so a node belonging to another school reached the calculators
  -- and, whatever they returned, a `generated_reports` row was written naming
  -- it. The evaluator refuses each metric; this refuses the ARTEFACT.
  if not exists (select 1 from public.org_nodes n
                  where n.id = p_scope_node and n.institution_id = t.institution_id) then
    raise exception 'that scope node belongs to another institution';
  end if;

  for v_row in
    select m.metric_id, m.ordinal, m.visualization
      from public.report_template_metrics m
     where m.template_id = p_template
     order by m.ordinal
  loop
    v_one := public.metric_evaluate(v_row.metric_id, p_scope_node, t.institution_id, v_cat);
    v_entries := v_entries || jsonb_build_array(
      v_one || jsonb_build_object('ordinal', v_row.ordinal, 'visualization', v_row.visualization));
  end loop;

  -- COUNTING THE REPORT'S OWN ENTRIES, which is the one thing a report layer
  -- may legitimately count. It is a description of the artefact -- how many
  -- slots were filled, how many carry a statement instead -- not a number
  -- derived from evidence.
  --
  -- Written this way because assertion 3 refused the obvious `n_ok := n_ok + 1`
  -- and that refusal was right. Bookkeeping and analytics are indistinguishable
  -- to a text check, so the ban on arithmetic stays absolute and the exception
  -- is a single named aggregate over the function's own output.
  select count(*) filter (where e ->> 'status' = 'ok'),
         count(*) filter (where e ->> 'status' <> 'ok')
    into n_ok, n_omitted
    from jsonb_array_elements(v_entries) e;

  insert into public.generated_reports
    (institution_id, standard_report, template_id, template_version, catalogue_version,
     scope_node_id, generated_by_person_id, body)
  values (t.institution_id, t.standard_report, t.id, t.template_version, v_cat,
          p_scope_node, public.current_person_id(),
          jsonb_build_object('title_key', t.title_key, 'branding', t.branding,
                             'entries', v_entries,
                             'shown', n_ok, 'omitted', n_omitted))
  returning id into v_id;

  return jsonb_build_object('generated_report_id', v_id, 'catalogue_version', v_cat,
                            'template_version', t.template_version,
                            'title_key', t.title_key, 'branding', t.branding,
                            'entries', v_entries, 'shown', n_ok, 'omitted', n_omitted);
end $$;

revoke all on function public.generate_report(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.generate_report(uuid, uuid, text) to authenticated;

-- ─────────────────────────────────────────────── 7. and the artefact, once it is written

-- A SAVED REPORT IS THE SAME NUMBERS WITH A DATE ON IT. Leaving the read at
-- `is_member_of_institution` would mean the evaluator refuses a metric live and
-- hands it over an hour later from the shelf. The reader must stand over the
-- node the report was drawn at -- or have drawn it themselves, because a person
-- may always re-read what they were already shown.
drop policy if exists generated_reports_select on public.generated_reports;
create policy generated_reports_select on public.generated_reports
  for select to authenticated
  using (
    generated_by_person_id = public.current_person_id()
    or public.is_system_admin()
    or public.node_in_my_scope(scope_node_id)
  );

-- ─────────────────────────────────────────────── 8. verification (ADR-0014)

do $$
declare
  v_inst uuid; v_root uuid; v_fac uuid; v_dept_a uuid; v_dept_b uuid;
  v_prog_a uuid; v_coh_a uuid; v_cls_a uuid;
  v_prog_b uuid; v_coh_b uuid; v_cls_b uuid;
  v_period uuid; v_other_inst uuid; v_other_root uuid;
  v_hod uuid; v_hod_uid uuid; v_dean uuid; v_dean_uid uuid; v_adm uuid; v_adm_uid uuid;
  v_learner_a uuid; v_learner_a_uid uuid; v_learner_b uuid; v_learner_b_uid uuid;
  v_enr_a uuid; v_enr_b uuid;
  v_cat text; r jsonb; n int; v_six int; v_ten int;
begin
  begin
    v_cat := public.current_metric_catalogue();
    if v_cat is null then raise exception 'no live catalogue to verify against'; end if;

    -- (1) THE DISCRIMINATOR, ON THE LIVE CATALOGUE. Six calculators ignore the
    --     node they are given; ten read it. Asserted as counts so a future
    --     calculator cannot quietly join the wrong side.
    select count(*) filter (where public.metric_computes_tenant_wide(d.calculation_key)),
           count(*) filter (where not public.metric_computes_tenant_wide(d.calculation_key))
      into v_six, v_ten
      from public.metric_definitions d where d.catalogue_version = v_cat;
    if v_six = 0 or v_ten = 0 then
      raise exception 'the tenant-wide discriminator separates nothing: % tenant-wide, % node-reading',
        v_six, v_ten;
    end if;
    -- and it is not merely answering "true" to everything it is handed
    if not public.metric_computes_tenant_wide('no_such_calculator_0091') then
      raise exception 'an unknown calculator was not treated as tenant-wide: the fallback is open';
    end if;
    if public.metric_computes_tenant_wide('class_participants') then
      raise exception 'a calculator that reads its node was called tenant-wide';
    end if;
    if not public.metric_computes_tenant_wide('institution_participants') then
      raise exception 'a calculator that ignores its node was not called tenant-wide';
    end if;

    -- (2) A SCHOOL WITH TWO DEPARTMENTS, because no seed has one and A3 cannot
    --     be asked without a sibling. Built here, rolled back below.
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah Probe 0091', 'probe-0091-' || substr(md5(random()::text), 1, 8), true)
    returning id into v_inst;
    -- `institutions_after_insert` writes the root node, whose id IS the
    -- institution's (org_nodes_before_write enforces that equality). Reading it
    -- rather than re-inserting it is also the fact this migration relies on
    -- when it governs a tenant-wide request at `p_institution`.
    select id into v_root from public.org_nodes
     where institution_id = v_inst and kind = 'INSTITUTION';
    if v_root is distinct from v_inst then
      raise exception 'the institution root node is not the institution id: % vs %', v_root, v_inst;
    end if;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/27', date '2026-07-01', date '2027-06-30') returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_root, 'FACULTY', 'Fakultas') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'Departemen A') returning id into v_dept_a;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'Departemen B') returning id into v_dept_b;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dept_a, 'PROGRAMME', 'Program A') returning id into v_prog_a;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dept_b, 'PROGRAMME', 'Program B') returning id into v_prog_b;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog_a, 'COHORT', 'Angkatan A', v_period) returning id into v_coh_a;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog_b, 'COHORT', 'Angkatan B', v_period) returning id into v_coh_b;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh_a, 'CLASS', 'Kelas A', v_period) returning id into v_cls_a;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh_b, 'CLASS', 'Kelas B', v_period) returning id into v_cls_b;

    -- an unrelated school, for A4
    insert into public.institutions (name, slug, is_synthetic)
    values ('Sekolah Lain 0091', 'probe-0091-lain-' || substr(md5(random()::text), 1, 8), true)
    returning id into v_other_inst;
    select id into v_other_root from public.org_nodes
     where institution_id = v_other_inst and kind = 'INSTITUTION';

    -- THREE READERS, STANDING AT THREE HEIGHTS. `on_auth_user_created` writes
    -- the person and the account, so those are READ back rather than inserted:
    -- a probe that built its own identity rows would be testing a person the
    -- product cannot produce.
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0091-hod@probe.invalid')
    returning id into v_hod_uid;
    select person_id into v_hod from public.accounts where auth_user_id = v_hod_uid;
    -- INV-16 wants an authenticated grantor and there is none inside a
    -- migration. The declared-synthetic marker is the same door 0088's probe
    -- uses, and it is closed again as soon as the grants are written.
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_until)
    values (v_hod, 'HEAD_OF_DEPARTMENT', v_dept_a, v_inst, now() + interval '1 year');

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0091-dean@probe.invalid')
    returning id into v_dean_uid;
    select person_id into v_dean from public.accounts where auth_user_id = v_dean_uid;
    insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_until)
    values (v_dean, 'DEAN', v_fac, v_inst, now() + interval '1 year');

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0091-adm@probe.invalid')
    returning id into v_adm_uid;
    select person_id into v_adm from public.accounts where auth_user_id = v_adm_uid;
    insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_until)
    values (v_adm, 'INSTITUTION_ADMIN', v_root, v_inst, now() + interval '1 year');
    perform set_config('app.seed_intent', '', true);
    if v_hod is null or v_dean is null or v_adm is null then
      raise exception 'a probe reader has no person row';
    end if;

    -- ONE LEARNER IN EACH DEPARTMENT, so the containment of a metric whose
    -- subject is a PERSON can be asked in both directions.
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0091-murid-a@probe.invalid')
    returning id into v_learner_a_uid;
    select person_id into v_learner_a from public.accounts where auth_user_id = v_learner_a_uid;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_learner_a, v_inst, v_period, v_prog_a, 'ACTIVE') returning id into v_enr_a;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr_a, v_cls_a, v_period);

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe0091-murid-b@probe.invalid')
    returning id into v_learner_b_uid;
    select person_id into v_learner_b from public.accounts where auth_user_id = v_learner_b_uid;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_learner_b, v_inst, v_period, v_prog_b, 'ACTIVE') returning id into v_enr_b;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr_b, v_cls_b, v_period);

    -- (3) THE SEVEN CASES, as the Head of Department.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_hod_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_hod_uid::text, true);

    -- A1 own node
    r := public.metric_evaluate('class.participants', v_dept_a, v_inst, v_cat);
    if r ->> 'status' = 'not_permitted' then raise exception 'A1: refused on own node'; end if;
    -- A2 descendant
    r := public.metric_evaluate('class.participants', v_cls_a, v_inst, v_cat);
    if r ->> 'status' = 'not_permitted' then raise exception 'A2: refused on own descendant'; end if;
    -- A3 sibling
    r := public.metric_evaluate('class.participants', v_cls_b, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'A3: a sibling department''s class answered %', r ->> 'status';
    end if;
    r := public.metric_evaluate('class.participants', v_dept_b, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'A3: the sibling department itself answered %', r ->> 'status';
    end if;
    -- A4 unrelated
    r := public.metric_evaluate('class.participants', v_other_root, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'A4: an unrelated school''s node answered %', r ->> 'status';
    end if;
    -- A5 ancestor and institution
    r := public.metric_evaluate('class.participants', v_fac, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'A5: an ancestor faculty answered %', r ->> 'status';
    end if;
    r := public.metric_evaluate('institution.participants', v_dept_a, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'A5: a tenant-wide aggregate answered % from a department-scoped role',
        r ->> 'status';
    end if;
    -- the mis-declared one, which is the reason the declaration is not trusted
    r := public.metric_evaluate('institution.cohort_comparison', v_dept_a, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'A5: institution.cohort_comparison answered % though it aggregates every cohort',
        r ->> 'status';
    end if;
    -- A METRIC WHOSE SUBJECT IS A PERSON is contained through the learner:
    -- the reader must stand over a node the learner belongs to.
    r := public.metric_evaluate('learner.result', v_learner_a, v_inst, v_cat);
    if r ->> 'status' = 'not_permitted' then
      raise exception 'a learner inside the reader''s own department was refused';
    end if;
    r := public.metric_evaluate('learner.result', v_learner_b, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'a learner in the SIBLING department answered %', r ->> 'status';
    end if;

    -- (4) A7 NO REGRESSION. The admin stands on the root, so the tenant-wide
    --     aggregate is theirs; and an in-scope class is still readable.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_uid::text, true);
    r := public.metric_evaluate('institution.participants', v_dept_a, v_inst, v_cat);
    if r ->> 'status' = 'not_permitted' then
      raise exception 'A7: an institution-scoped admin lost the tenant-wide aggregate';
    end if;
    r := public.metric_evaluate('class.participants', v_cls_b, v_inst, v_cat);
    if r ->> 'status' = 'not_permitted' then
      raise exception 'A7: an institution-scoped admin lost a class in their own school';
    end if;
    r := public.metric_evaluate('item.correctness_rate', v_cls_a, v_inst, v_cat);
    if r ->> 'status' = 'not_permitted' then
      raise exception 'A7: the item bank stopped being readable by its declared audience';
    end if;

    -- and the DEAN, scoped to a faculty, keeps the faculty and loses the school
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_dean_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_dean_uid::text, true);
    r := public.metric_evaluate('class.participants', v_cls_b, v_inst, v_cat);
    if r ->> 'status' = 'not_permitted' then
      raise exception 'a faculty-scoped dean lost a class inside their own faculty';
    end if;
    r := public.metric_evaluate('institution.participants', v_fac, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'a faculty-scoped dean still receives the whole school: %', r ->> 'status';
    end if;
    -- A6 PROPER: in scope, and still refused, because the audience half is the
    -- one that fails. The learner sits in this dean's own faculty and DEAN is
    -- absent from learner.result's audiences -- so containment alone is not a
    -- key, exactly as audience alone was not one.
    r := public.metric_evaluate('learner.result', v_learner_a, v_inst, v_cat);
    if r ->> 'status' <> 'not_permitted' then
      raise exception 'A6: a dean read a learner inside their scope but outside the audience: %',
        r ->> 'status';
    end if;

    -- (5) THE REPORT ARTEFACT refuses a node from another school outright.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_uid::text, true);
    declare v_tmpl uuid; v_before int; v_after int; v_refused boolean := false;
    begin
      insert into public.report_templates (institution_id, standard_report, title_key, template_version)
      values (v_inst, 'class_learning_intelligence', 'laporan.kelas.judul', 1) returning id into v_tmpl;
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
      values (v_tmpl, 'class.participants', 1, 'hero_stat');
      select count(*) into v_before from public.generated_reports;
      begin
        perform public.generate_report(v_tmpl, v_other_root, v_cat);
      exception when others then v_refused := true;
      end;
      select count(*) into v_after from public.generated_reports;
      if not v_refused then raise exception 'a report was drawn at another school''s node'; end if;
      if v_after <> v_before then
        raise exception 'a refused report still wrote % artefact row(s)', v_after - v_before;
      end if;
      -- and the same template at a node in its own school still works
      perform public.generate_report(v_tmpl, v_cls_a, v_cat);
    end;

    -- (6) THE SHELF IS NOT A SECOND DOOR. The admin's institution-wide report
    --     is not readable by the department-scoped reader.
    declare v_tmpl2 uuid; v_seen int;
    begin
      insert into public.report_templates (institution_id, standard_report, title_key, template_version)
      values (v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul', 1)
      returning id into v_tmpl2;
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
      values (v_tmpl2, 'institution.participants', 1, 'hero_stat');
      perform public.generate_report(v_tmpl2, v_root, v_cat);

      perform set_config('request.jwt.claims',
        json_build_object('sub', v_hod_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_hod_uid::text, true);
      set local role authenticated;
      select count(*) into v_seen from public.generated_reports g where g.scope_node_id = v_root;
      reset role;
      if v_seen <> 0 then
        raise exception 'a department-scoped reader read % institution-wide report(s) off the shelf', v_seen;
      end if;

      -- and the reader who drew one still reads their own
      perform set_config('request.jwt.claims',
        json_build_object('sub', v_adm_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_adm_uid::text, true);
      set local role authenticated;
      select count(*) into v_seen from public.generated_reports g where g.scope_node_id = v_root;
      reset role;
      if v_seen = 0 then raise exception 'the reader who generated a report cannot read it back'; end if;
    end;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    begin reset role; exception when others then null; end;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;
  raise notice '0091 verified: audience and organizational containment must both pass -- own node and '
    'descendant answer, sibling, unrelated, ancestor and tenant-wide refuse, a faculty-scoped dean keeps '
    'the faculty and loses the school, an institution-scoped admin keeps both, the item bank is unchanged, '
    'a report at another school''s node writes no artefact, and a saved institution-wide report is not '
    'readable from below';
end $$;

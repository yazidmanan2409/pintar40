-- ---------------------------------------------------------------------------
-- W8-02 — AN INSTITUTION ASSEMBLES ITS OWN REPORT.
--
-- PINTAR 4.0 requires that authorized institutions may assemble reusable
-- report templates from an approved subset of PINTAR's canonical metrics.
-- Everything that requirement needs existed except the act itself: the
-- catalogue, the template tables, the capability, the guards and
-- `generate_report` were all built, and `report_templates` held zero rows in
-- every environment — local, CI and hosted — because nothing in the product
-- could write one. The two summary surfaces read a template, found none, and
-- rendered their empty state permanently; `src/lib/pengajar.ts` names its four
-- metrics inline and says why.
--
-- This is the missing act and nothing else.
--
-- WHAT AN INSTITUTION DECIDES: which metrics appear, in which order, drawn as
-- which of the visualizations the catalogue permits, under which title, for
-- which of the three standard reports.
--
-- WHAT IT DOES NOT DECIDE, AND CANNOT REACH FROM HERE: what a metric means,
-- how it is computed, what evidence it may read, who may read it, or what the
-- minimum sample is. Those are PINTAR's, they live in `metric_definitions`,
-- and this function takes no argument that could touch them. A template
-- SELECTS; it does not define. The existing triggers enforce that rule and
-- this function deliberately leans on them rather than restating it, so there
-- is one place where the approved subset is decided.
--
-- AUTHORIZATION IS THE FIRST GATE (RF-2's lesson). The capability is checked
-- against the institution named in the call before any argument is resolved,
-- so a refusal is an authorization refusal and not a lookup that failed. The
-- row guards then re-check it on every write, which is what makes the RPC a
-- convenience rather than the authority.
-- ---------------------------------------------------------------------------

create or replace function public.save_report_template(
  p_institution      uuid,
  p_standard_report  text,
  p_title_key        text,
  p_metrics          jsonb,
  p_template         uuid default null
) returns uuid
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_version int; v_inst uuid; v_entry jsonb; v_ord smallint := 0; n int;
begin
  -- 1. AUTHORIZATION, BEFORE ANYTHING IS RESOLVED.
  if p_institution is null
     or not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', p_institution) then
    raise exception 'assembling a report template requires CAN_MANAGE_REPORT_TEMPLATES in that institution';
  end if;

  -- 2. the shape of the request
  if p_metrics is null or jsonb_typeof(p_metrics) <> 'array' then
    raise exception 'a report template is a list of metrics to show, and none was given';
  end if;
  n := jsonb_array_length(p_metrics);
  if n = 0 then
    raise exception 'a report template must show at least one metric';
  end if;
  -- A STANDARD REPORT, NOT A CANVAS. The cap is a product boundary, not a
  -- technical one: a template that names forty metrics is a report nobody
  -- reads and an evaluation nobody budgeted for.
  if n > 12 then
    raise exception 'a report template shows at most 12 metrics, and this one names %', n;
  end if;

  -- 3. the template itself. An update must belong to the institution the
  --    caller was authorized for -- naming someone else's template here must
  --    not borrow this caller's capability.
  if p_template is null then
    insert into public.report_templates
      (institution_id, template_version, standard_report, title_key, branding)
    values (p_institution, 1, p_standard_report, p_title_key, '{}'::jsonb)
    returning id, template_version into v_id, v_version;
  else
    select t.institution_id, t.template_version into v_inst, v_version
      from public.report_templates t where t.id = p_template;
    if v_inst is null then raise exception 'no such report template'; end if;
    if v_inst <> p_institution then
      raise exception 'that report template belongs to another institution';
    end if;
    -- A NEW VERSION, NOT A SILENT EDIT. `generated_reports` records the
    -- template version it was made from, so a report already issued keeps
    -- saying which assembly produced it.
    v_version := v_version + 1;
    update public.report_templates
       set template_version = v_version,
           standard_report  = p_standard_report,
           title_key        = p_title_key
     where id = p_template
    returning id into v_id;
    delete from public.report_template_metrics where template_id = v_id;
  end if;

  -- 4. the selection. Every row goes through `enforce_report_template_metric`,
  --    which is where "from the approved subset" is decided: the metric must
  --    exist in the LIVE catalogue, must not be deprecated, and the
  --    visualization must be one that metric permits.
  for v_entry in select * from jsonb_array_elements(p_metrics) loop
    if v_entry ->> 'metric_id' is null or v_entry ->> 'visualization' is null then
      raise exception 'each entry names a metric_id and a visualization; entry % names %',
        v_ord + 1, v_entry;
    end if;
    v_ord := v_ord + 1;
    insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
    values (v_id, v_entry ->> 'metric_id', v_ord, v_entry ->> 'visualization');
  end loop;

  -- 5. CONFIGURING A SCHOOL'S REPORTING IS AN ACT OF ADMINISTRATION. It names
  --    the template and its version, and carries no figure: a template is a
  --    request for numbers, never a number.
  perform public.audit_write('report_template.saved', 'report_templates', v_id::text, p_institution,
    jsonb_build_object('standard_report', p_standard_report, 'title_key', p_title_key,
                       'template_version', v_version, 'metrics', n,
                       'catalogue_version', public.current_metric_catalogue()));
  return v_id;
end $$;
revoke all on function public.save_report_template(uuid, text, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.save_report_template(uuid, text, text, jsonb, uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('save_report_template', 'STAFF',
        'Assembles one of an institution''s reusable report templates from PINTAR''s canonical metric '
        'catalogue: which metrics, in which order, drawn how. It takes no argument that could define or '
        'change a metric, a formula or an audience, and the row guards re-check the capability on every '
        'write, so it is a convenience over the tables and never the authority.',
        'CAPABILITY', 'CAN_MANAGE_REPORT_TEMPLATES')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014): a school with a live administrator
-- assembles a template, generates the report it was built for, revises the
-- template, and is refused everything it may not do. Rolled back whole.
-- ---------------------------------------------------------------------------
do $$
declare v_inst uuid; v_period uuid; v_fac uuid; v_dep uuid; v_prog uuid; v_coh uuid;
        v_adm_u uuid; v_adm uuid; v_out_u uuid; v_out uuid; v_other uuid;
        v_tpl uuid; v_tpl2 uuid; v_cat text; v_m1 text; v_m2 text; v_v1 text; v_v2 text;
        v_raised boolean; v_msg text; v_body jsonb; n int;
begin
  -- structural: declared, client-callable, and the rule is not
  select count(*) into n from public.client_rpc_registry
   where function_name = 'save_report_template' and exposure = 'STAFF'
     and authorization_kind = 'CAPABILITY'
     and authorization_requirement = 'CAN_MANAGE_REPORT_TEMPLATES';
  if n <> 1 then raise exception 'save_report_template is not declared as a capability-gated STAFF endpoint'; end if;
  if not has_function_privilege('authenticated',
       'public.save_report_template(uuid,text,text,jsonb,uuid)'::regprocedure, 'execute') then
    raise exception 'save_report_template is not reachable by a client';
  end if;
  -- it cannot define a metric: nothing in its body writes the catalogue
  if pg_get_functiondef('public.save_report_template(uuid,text,text,jsonb,uuid)'::regprocedure)
       ~* '(insert|update|delete)[^;]*\ymetric_(definitions|catalogue|sources)\y' then
    raise exception 'save_report_template writes the metric catalogue';
  end if;

  ------------------------------------------------------------------ behavioural
  begin
    v_cat := public.current_metric_catalogue();
    select m.metric_id, m.allowed_visualizations[1] into v_m1, v_v1
      from public.metric_definitions m
     where m.catalogue_version = v_cat and not m.deprecated and m.scope = 'INSTITUTION'
     order by m.metric_id limit 1;
    select m.metric_id, m.allowed_visualizations[1] into v_m2, v_v2
      from public.metric_definitions m
     where m.catalogue_version = v_cat and not m.deprecated and m.scope = 'INSTITUTION'
       and m.metric_id <> v_m1
     order by m.metric_id limit 1;
    if v_m1 is null or v_m2 is null then
      raise exception 'the live catalogue offers fewer than two institution metrics';
    end if;

    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0107 school', 'probe-0107-school', true, true) returning id into v_inst;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0107 other', 'probe-0107-other', true, true) returning id into v_other;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 30, current_date + 300) returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'F') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D') returning id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep, 'PROGRAMME', 'P') returning id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'C', v_period) returning id into v_coh;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0107-admin@local.invalid')
    returning id into v_adm_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0107-dekan@local.invalid')
    returning id into v_out_u;
    select a.person_id into v_adm from public.accounts a where a.auth_user_id = v_adm_u;
    select a.person_id into v_out from public.accounts a where a.auth_user_id = v_out_u;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_adm, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days'),
           (v_out, 'DEAN',              v_fac,  now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    -- (1) A DEAN HOLDS THE REPORT AND NOT THE CONFIGURATION. Refused by the
    --     capability's name, before any argument is looked at.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_out_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_out_u::text, true);
    v_raised := false;
    begin
      perform public.save_report_template(v_inst, 'institution_learning_intelligence',
        'laporan.institusi.judul', jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', v_v1)));
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'CAN_MANAGE_REPORT_TEMPLATES' then
      raise exception 'a dean assembled a report template: %', coalesce(v_msg, '(accepted)');
    end if;

    -- (2) THE ADMINISTRATOR ASSEMBLES ONE, and it is a real template.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_u::text, true);
    v_tpl := public.save_report_template(v_inst, 'institution_learning_intelligence',
      'laporan.institusi.judul',
      jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', v_v1),
                        jsonb_build_object('metric_id', v_m2, 'visualization', v_v2)));
    select count(*) into n from public.report_template_metrics where template_id = v_tpl;
    if n <> 2 then raise exception 'the saved template carries % metric(s), expected 2', n; end if;
    select count(*) into n from public.report_template_metrics
     where template_id = v_tpl and metric_id = v_m1 and ordinal = 1;
    if n <> 1 then raise exception 'the template did not keep the order it was given'; end if;

    -- (3) AND THE ENGINE IT WAS BUILT FOR RUNS ON IT.
    v_body := public.generate_report(v_tpl, v_prog, v_cat);
    if jsonb_array_length(v_body -> 'entries') <> 2 then
      raise exception 'the generated report carries % entry(ies)', jsonb_array_length(v_body -> 'entries');
    end if;
    select count(*) into n from public.generated_reports where template_id = v_tpl;
    if n <> 1 then raise exception 'generating the report wrote % artefact row(s)', n; end if;

    -- (4) REVISION IS A NEW VERSION, NOT A SILENT EDIT.
    v_tpl2 := public.save_report_template(v_inst, 'institution_learning_intelligence',
      'laporan.institusi.judul',
      jsonb_build_array(jsonb_build_object('metric_id', v_m2, 'visualization', v_v2)), v_tpl);
    if v_tpl2 <> v_tpl then raise exception 'revising the template created a second one'; end if;
    select template_version into n from public.report_templates where id = v_tpl;
    if n <> 2 then raise exception 'the revised template is at version %, expected 2', n; end if;
    select count(*) into n from public.report_template_metrics where template_id = v_tpl;
    if n <> 1 then raise exception 'the revision left % metric row(s), expected 1', n; end if;
    -- the report already issued still says which assembly produced it
    select count(*) into n from public.generated_reports
     where template_id = v_tpl and template_version = 1;
    if n <> 1 then raise exception 'the issued report lost the version it was made from'; end if;

    -- (5) WHAT AN INSTITUTION MAY NOT DO. A metric outside the catalogue, a
    --     visualization the catalogue does not permit for that metric, an
    --     empty selection, and another school's template.
    v_raised := false;
    begin
      perform public.save_report_template(v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
        jsonb_build_array(jsonb_build_object('metric_id', 'institution.invented_by_the_school',
                                             'visualization', v_v1)));
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'unknown metric' then
      raise exception 'a school defined its own metric: %', coalesce(v_msg, '(accepted)');
    end if;

    v_raised := false;
    begin
      perform public.save_report_template(v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
        jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', 'pie_of_everything')));
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'does not permit visualization' then
      raise exception 'a school chose a visualization the catalogue forbids: %', coalesce(v_msg, '(accepted)');
    end if;

    v_raised := false;
    begin
      perform public.save_report_template(v_inst, 'institution_learning_intelligence',
        'laporan.institusi.judul', '[]'::jsonb);
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised then raise exception 'an empty report template was accepted'; end if;

    v_raised := false;
    begin
      perform public.save_report_template(v_other, 'institution_learning_intelligence',
        'laporan.institusi.judul',
        jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', v_v1)));
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'CAN_MANAGE_REPORT_TEMPLATES' then
      raise exception 'an administrator assembled a template for another school: %', coalesce(v_msg, '(accepted)');
    end if;

    -- (6) THE ACT IS ON THE RECORD, AND CARRIES NO FIGURE.
    select count(*) into n from public.audit_log
     where action = 'report_template.saved' and target_id = v_tpl::text;
    if n <> 2 then raise exception 'the two saves wrote % audit row(s)', n; end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'WP8C_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'WP8C_PROBE_UNDO' then
      raise exception 'WP8-02 verification failed: %', sqlerrm;
    end if;
  end;
end $$;

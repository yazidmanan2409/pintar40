-- ---------------------------------------------------------------------------
-- W8-03 and W8-04 — two bounded corrections found by the WP8 reconnaissance.
--
-- W8-03. A REPORT TEMPLATE COULD NAME A RETIRED METRIC.
-- `enforce_report_template_metric` checked that a metric exists in the live
-- catalogue and that the visualization is one the catalogue permits. It did
-- not check `deprecated`. The consequence was not a wrong number — the
-- evaluator refuses a deprecated metric at read time and the report carries a
-- statement instead — but an institution could spend its attention assembling
-- a template around a metric PINTAR has retired, and find out only when the
-- report came back with a slot that says nothing. Retiring a metric is a
-- PINTAR-owned decision; a template that selects from the catalogue should be
-- told at the moment it selects.
--
-- EXISTING ROWS ARE NOT DISTURBED. The check refuses a metric that is
-- deprecated AT THE TIME IT IS ADDED. A metric deprecated after a template
-- already names it keeps its row, and the evaluator goes on saying so per
-- report: a catalogue decision must not silently rewrite what an institution
-- assembled.
--
-- W8-04. A CLIENT GRANT THAT COULD NEVER WORK.
-- `drawable_items_for_definition` is granted to `authenticated` and is not in
-- `client_rpc_registry`. It is deliberately SECURITY INVOKER — 0029 asserts
-- that it is — so that the bank-tier, cooling and INV-24 rules run with the
-- caller's own rights, and it calls `excluded_items_for_post_test`, which is
-- SECURITY DEFINER and owner-only. A client that actually called it would get
-- `permission denied for function excluded_items_for_post_test`. It is an
-- internal helper of the assembler, reached only from SECURITY DEFINER
-- callers that run as the owner, and the grant is dead surface. The lint that
-- would have caught it only looks at SECURITY DEFINER functions, which is why
-- it stood.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_report_template_metric()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cat text; d public.metric_definitions; v_inst uuid;
begin
  v_cat := public.current_metric_catalogue();
  if v_cat is null then raise exception 'no live metric catalogue'; end if;

  select * into d from public.metric_definitions m
   where m.catalogue_version = v_cat and m.metric_id = new.metric_id;
  if d.metric_id is null then
    raise exception 'unknown metric id %: a template selects from the catalogue, it does not define',
      new.metric_id;
  end if;
  -- W8-03: a retired metric is not part of the approved subset.
  if d.deprecated then
    raise exception 'metric % is deprecated: a template may only select a metric the catalogue still offers',
      new.metric_id;
  end if;
  if not (new.visualization = any (d.allowed_visualizations)) then
    raise exception 'metric % does not permit visualization %: the catalogue decides how a metric may be read',
      new.metric_id, new.visualization;
  end if;

  select t.institution_id into v_inst from public.report_templates t where t.id = new.template_id;
  if not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', v_inst) then
    raise exception 'editing a report template requires CAN_MANAGE_REPORT_TEMPLATES in the owning institution';
  end if;
  return new;
end $$;
revoke all on function public.enforce_report_template_metric() from public, anon, authenticated;

revoke execute on function public.drawable_items_for_definition(uuid, uuid, uuid, uuid) from authenticated;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014)
-- ---------------------------------------------------------------------------
do $$
declare v_inst uuid; v_tpl uuid; v_cat text; v_metric text; v_viz text;
        v_adm_u uuid; v_adm uuid; v_raised boolean; v_msg text; n int;
begin
  -- W8-04, structurally: the helper is no longer client surface, and it is
  -- still SECURITY INVOKER, which is the property 0029 protects.
  if has_function_privilege('authenticated',
       'public.drawable_items_for_definition(uuid,uuid,uuid,uuid)'::regprocedure, 'execute') then
    raise exception 'drawable_items_for_definition is still granted to authenticated';
  end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'drawable_items_for_definition' and p.prosecdef;
  if n > 0 then raise exception 'drawable_items_for_definition became SECURITY DEFINER'; end if;
  -- and the assembler still reaches it, so the revoke did not break delivery
  if pg_get_functiondef('public.assemble_session(uuid)'::regprocedure)
       not like '%drawable_items_for_definition%' then
    raise exception 'the assembler no longer calls drawable_items_for_definition';
  end if;

  ------------------------------------------------------------------ behavioural
  begin
    v_cat := public.current_metric_catalogue();
    if v_cat is null then raise exception 'no live metric catalogue to verify against'; end if;
    select m.metric_id, m.allowed_visualizations[1] into v_metric, v_viz
      from public.metric_definitions m
     where m.catalogue_version = v_cat and not m.deprecated
     order by m.metric_id limit 1;
    if v_metric is null then raise exception 'the live catalogue offers no live metric'; end if;

    -- The guards on these tables ask who is writing, so the probe needs a real
    -- administrator rather than the owner's anonymous rights.
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0106 school', 'probe-0106-school', true, true) returning id into v_inst;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0106-admin@local.invalid')
    returning id into v_adm_u;
    select a.person_id into v_adm from public.accounts a where a.auth_user_id = v_adm_u;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_adm, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_u::text, true);

    insert into public.report_templates (institution_id, template_version, standard_report, title_key, branding)
    values (v_inst, 1, 'institution_learning_intelligence', 'laporan.probe', '{}'::jsonb)
    returning id into v_tpl;

    -- a live metric is accepted
    insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
    values (v_tpl, v_metric, 1, v_viz);

    -- THE ONLY WAY A METRIC IS RETIRED: a new catalogue version that carries
    -- the flag, published by PINTAR. `metric_definitions` refuses UPDATE by
    -- trigger, and no exposed surface raises the flag (OQ-5), so the probe
    -- retires it the way a future PINTAR migration would -- by superseding the
    -- live version -- rather than by doctoring the one that is live.
    insert into public.metric_catalogue (version, note)
    values ('MC-9106', 'probe: one metric retired, rolled back');
    insert into public.metric_definitions
      (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
       minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
       deprecated, deprecation_note_key)
    select 'MC-9106', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
           d.minimum_sample, d.allowed_visualizations, d.allowed_audiences, d.calculation_key,
           d.metric_id = v_metric,
           case when d.metric_id = v_metric then 'metrik.pensiun.probe' else d.deprecation_note_key end
      from public.metric_definitions d where d.catalogue_version = v_cat;
    update public.metric_catalogue set superseded_by = 'MC-9106' where version = v_cat;
    if public.current_metric_catalogue() <> 'MC-9106' then
      raise exception 'the probe catalogue did not become live, so the refusal below would prove nothing';
    end if;

    -- the retired metric is refused BY NAME
    v_raised := false;
    begin
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
      values (v_tpl, v_metric, 2, v_viz);
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised or v_msg !~ 'deprecated' then
      raise exception 'a deprecated metric was accepted into a template: %', coalesce(v_msg, '(accepted)');
    end if;

    -- and the row that was already there is untouched: a catalogue decision
    -- does not rewrite what an institution already assembled
    select count(*) into n from public.report_template_metrics
     where template_id = v_tpl and metric_id = v_metric;
    if n <> 1 then raise exception 'the existing template entry was disturbed (% row(s))', n; end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'WP8B_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'WP8B_PROBE_UNDO' then
      raise exception 'WP8-B verification failed: %', sqlerrm;
    end if;
  end;
end $$;

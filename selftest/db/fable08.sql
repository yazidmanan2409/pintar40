-- FABLE-08 / WP8 database suite: integration, hardening, deployment readiness.
--
-- Ordering: depends on fable01.sql (the role-switch helpers). Never applied as
-- a migration; never present in production.
--
-- WHAT THIS SUITE IS FOR. WP8's findings share one shape: a component that was
-- built, and a path to it that nobody had walked as an ordinary authorized
-- human. The seeds and the suites build their worlds as the table owner, where
-- grants do not apply and capabilities are never asked for, so a school that
-- could not add a class and a report engine nobody could configure both sat
-- green for a whole build.
--
-- So every test here signs in. `selftest.as_user` sets the claim AND the role,
-- which is what makes a missing EXECUTE grant visible; a test that only set a
-- claim would have missed W8-01 exactly as everything before it did.
--
-- EVERY ROW IS ROLLED BACK, the way FABLE-07 does it: one subtransaction,
-- verdicts collected in a jsonb of problems, a sentinel to undo the lot, and
-- the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply fable01.sql before fable08.sql';
  end if;
  if to_regprocedure('public.save_report_template(uuid, text, text, jsonb, uuid)') is null then
    raise exception 'fable08.sql needs the WP8 report-configuration migration';
  end if;
  if to_regprocedure('public.assert_client_writes_are_reachable()') is null then
    raise exception 'fable08.sql needs the WP8 reachability assertion';
  end if;
  if to_regprocedure('public.bootstrap_first_system_admin(text, timestamptz)') is null then
    raise exception 'fable08.sql needs the day-zero bootstrap migration';
  end if;
  if to_regclass('public.platform_bootstrap') is null then
    raise exception 'fable08.sql needs the installation-initialisation migration';
  end if;
  if to_regprocedure('public.persons_awaiting_first_role()') is null then
    raise exception 'fable08.sql needs the first-role discovery migration';
  end if;
end $$;

create or replace function selftest.f08_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id],
                   coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
revoke all on function selftest.f08_note(jsonb, text, text) from public;
-- granted because the suite records findings while impersonating the reader it
-- is testing; it is pure text and reads nothing
grant execute on function selftest.f08_note(jsonb, text, text) to authenticated;

-- A person with an account, an auth user and one role. Returns the auth user
-- id, which is what `as_user` needs.
create or replace function selftest.f08_user(p_email text, p_role public.app_role, p_node uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid; v_person uuid;
begin
  select id into v_uid from auth.users where email = p_email;
  if v_uid is null then
    insert into auth.users (id, email) values (gen_random_uuid(), p_email) returning id into v_uid;
  end if;
  select a.person_id into v_person from public.accounts a where a.auth_user_id = v_uid;
  if p_role is not null then
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_person, p_role, p_node, now() - interval '1 day', now() + interval '365 days');
  end if;
  return v_uid;
end $$;
revoke all on function selftest.f08_user(text, public.app_role, uuid) from public;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable08()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_other uuid; v_period uuid; v_fac uuid; v_dep uuid; v_prog uuid;
  v_coh uuid; v_cls uuid; v_tag text; v_bag uuid; v_tahun text; m_direct int := 0;
  v_adm_u uuid; v_dean_u uuid; v_adm2_u uuid; v_guru_u uuid;
  v_tpl uuid; v_tpl_again uuid; v_cat text; v_m1 text; v_m2 text; v_v1 text; v_v2 text;
  v_body jsonb; v_msg text; v_raised boolean; v_big jsonb;
  v_probs jsonb := '{}'::jsonb; v_fatal text := ''; r record; n int; i int;
  v_ok boolean; v_detail text;
  m_depth int := 0; m_ladder_refusals int := 0; m_build_denied int := 0;
  m_tables int := 0; m_triggers int := 0;
  m_entries int := 0; m_version int := 0; m_cfg_denied int := 0; m_audit int := 0;
  m_boot_denied int := 0; v_first_u uuid; v_first uuid; v_second_u uuid; v_second uuid;
  m_wait_denied int := 0; v_fresh_u uuid; v_fresh uuid; v_sysadmin_u uuid;
  m_d093 int := 0; v_audit_before bigint;
  m_t2 int := 0; v_ra uuid; v_b_tutup uuid; v_sum jsonb;
begin
  perform selftest.as_owner();
  begin
    ---------------------------------------------------------------- fixture
    -- Built as the owner, deliberately: the fixture is not the thing under
    -- test. Everything a test asserts about is done signed in.
    v_tag := substr(md5(random()::text), 1, 8);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F08', 'f08-' || v_tag, true, true) returning institutions.id into v_inst;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F08 tetangga', 'f08b-' || v_tag, true, true) returning institutions.id into v_other;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 30, current_date + 300) returning academic_periods.id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'F') returning org_nodes.id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D') returning org_nodes.id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep, 'PROGRAMME', 'P') returning org_nodes.id into v_prog;

    v_adm_u  := selftest.f08_user('f08-admin-'  || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_inst);
    v_dean_u := selftest.f08_user('f08-dekan-'  || v_tag || '@local.invalid', 'DEAN',              v_fac);
    v_adm2_u := selftest.f08_user('f08-admin2-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_other);
    v_guru_u := selftest.f08_user('f08-guru-'   || v_tag || '@local.invalid', 'EDUCATOR',          v_prog);
    perform set_config('app.seed_intent', '', true);

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

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P01  W8-01: A SCHOOL BUILDS ITS OWN SHAPE, SIGNED IN.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      -- THE GRANT ITSELF, ASSERTED DIRECTLY, and not only through the write
      -- below. plpgsql caches a statement's plan per function per session and
      -- checks function-execute permission when that plan is built: this
      -- suite's fixture writes org_nodes as the owner first, so a later write
      -- as the administrator can reuse a plan whose permission was checked for
      -- postgres. The behavioural half proves the path works; this half is
      -- what a FRESH session would meet, which is where the defect was found.
      if not has_function_privilege('authenticated',
           'public.org_kind_level(public.org_kind)'::regprocedure, 'execute') then
        v_probs := selftest.f08_note(v_probs, 'F08-P01',
          'the ladder helper is not executable by a client, so a fresh session building an org node is refused');
      end if;

      -- RESTATED FOR BOB-08 (a). The school builds through BOB-01's structure
      -- functions, the one way in; a direct write to org_nodes is refused.
      v_tahun := public.structure_current_year_start()::text || '/' || (public.structure_current_year_start() + 1)::text;
      perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');
      begin
        insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
        values (v_inst, v_prog, 'COHORT', 'Langsung', v_period);
        v_probs := selftest.f08_note(v_probs, 'F08-P01', 'an administrator still writes org_nodes directly');
      exception when insufficient_privilege then m_direct := m_direct + 1;
      end;
      begin
        insert into public.academic_periods (institution_id, name, starts_on, ends_on)
        values (v_inst, 'Langsung', current_date, current_date + 1);
        v_probs := selftest.f08_note(v_probs, 'F08-P01', 'an administrator still writes academic_periods directly');
      exception when insufficient_privilege then m_direct := m_direct + 1;
      end;
      begin
        v_bag := public.create_bagian(v_inst, 'Bagian ' || v_tag);
        v_coh := public.create_tingkat(v_bag, 'Kelas 7', v_tahun);
        v_cls := public.create_kelas(v_coh, '7A', v_tahun);
      exception when others then
        v_probs := selftest.f08_note(v_probs, 'F08-P01',
          'an institution administrator could not build their own org tree: ' || left(sqlerrm, 120));
      end;

      if v_cls is not null then
        -- the ladder trigger ran with the writer's own rights
        select array_length(n.jalur, 1) into m_depth from public.org_nodes n where n.id = v_cls;
        if coalesce(m_depth, 0) <> 6 then
          v_probs := selftest.f08_note(v_probs, 'F08-P01',
            format('the class carries a jalur of %s entries, so the ladder trigger did not run',
                   coalesce(m_depth, 0)));
        end if;
        -- and the reader can see what they built
        select count(*) into n from public.org_nodes n where n.id = v_cls;
        if n <> 1 then
          v_probs := selftest.f08_note(v_probs, 'F08-P01', 'the administrator cannot read the class they just created');
        end if;
      end if;

      -- THE RULES ARE UNCHANGED. The ladder still refuses a step that is not a
      -- step, even to the table's owner.
      perform selftest.as_owner();
      for r in select * from unnest(array['CLASS', 'PROGRAMME'], array[v_fac, v_inst]) as t(kind, parent) loop
        begin
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
          values (v_inst, r.parent, r.kind::public.org_kind, 'salah ' || r.kind, v_period);
          v_probs := selftest.f08_note(v_probs, 'F08-P01',
            format('a %s was accepted directly under its grandparent: the grant weakened the ladder', r.kind));
        exception when others then m_ladder_refusals := m_ladder_refusals + 1;
        end;
      end loop;

      -- AND AUTHORIZATION IS UNCHANGED. Neither a dean, nor an educator, nor
      -- the neighbouring school's administrator may build here.
      for r in select * from unnest(array['f08-dekan-', 'f08-guru-', 'f08-admin2-']) as t(who) loop
        begin
          perform selftest.as_user(r.who || v_tag || '@local.invalid');
          perform public.create_bagian(v_inst, 'tak berwenang');
          v_probs := selftest.f08_note(v_probs, 'F08-P01',
            r.who || 'built an org node in a school they do not administer');
        exception when others then m_build_denied := m_build_denied + 1;
        end;
      end loop;
      perform selftest.as_owner();
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P01', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P02  THE STANDING ASSERTION, AND THAT IT IS MEASURING SOMETHING.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      select a.ok, a.detail into v_ok, v_detail from public.assert_client_writes_are_reachable() a;
      if not v_ok then
        v_probs := selftest.f08_note(v_probs, 'F08-P02', 'the assertion is red: ' || left(v_detail, 150));
      end if;
      -- NON-VACUITY: it must be looking at real tables and real triggers. An
      -- assertion over an empty population is green and says nothing.
      select count(distinct c.oid) into m_tables
        from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
       where ns.nspname = 'public' and c.relkind = 'r'
         and (has_table_privilege('authenticated', c.oid, 'insert')
           or has_table_privilege('authenticated', c.oid, 'update')
           or has_table_privilege('authenticated', c.oid, 'delete'));
      select count(*) into m_triggers
        from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
        join pg_trigger t on t.tgrelid = c.oid and not t.tgisinternal
        join pg_proc p on p.oid = t.tgfoid
       where ns.nspname = 'public' and c.relkind = 'r' and not p.prosecdef
         and (has_table_privilege('authenticated', c.oid, 'insert')
           or has_table_privilege('authenticated', c.oid, 'update')
           or has_table_privilege('authenticated', c.oid, 'delete'));
      if m_tables < 10 or m_triggers < 1 then
        v_probs := selftest.f08_note(v_probs, 'F08-P02',
          format('the assertion sweeps %s table(s) and %s invoker trigger(s): too few to be measuring anything',
                 m_tables, m_triggers));
      end if;
      -- and it is owner-run, like every other assertion
      if has_function_privilege('authenticated',
           'public.assert_client_writes_are_reachable()'::regprocedure, 'execute') then
        v_probs := selftest.f08_note(v_probs, 'F08-P02', 'the assertion is client-callable');
      end if;
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P02', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P03  W8-02: AN INSTITUTION ASSEMBLES A REPORT, AND THE ENGINE RUNS.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_m1 is null or v_m2 is null then
        v_probs := selftest.f08_note(v_probs, 'F08-P03', 'the live catalogue offers fewer than two institution metrics');
      else
        perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');
        v_tpl := public.save_report_template(v_inst, 'institution_learning_intelligence',
          'laporan.institusi.judul',
          jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', v_v1),
                            jsonb_build_object('metric_id', v_m2, 'visualization', v_v2)));
        select count(*) into m_entries from public.report_template_metrics where template_id = v_tpl;
        if m_entries <> 2 then
          v_probs := selftest.f08_note(v_probs, 'F08-P03',
            format('the saved template carries %s metric(s), expected 2', m_entries));
        end if;
        select count(*) into n from public.report_template_metrics
         where template_id = v_tpl and metric_id = v_m1 and ordinal = 1;
        if n <> 1 then
          v_probs := selftest.f08_note(v_probs, 'F08-P03', 'the template did not keep the order it was given');
        end if;

        -- the engine that was unreachable now has something to run on
        v_body := public.generate_report(v_tpl, v_prog, v_cat);
        if jsonb_array_length(v_body -> 'entries') <> 2 then
          v_probs := selftest.f08_note(v_probs, 'F08-P03',
            format('the generated report carries %s entry(ies)', jsonb_array_length(v_body -> 'entries')));
        end if;
        -- authorization still filters per metric: each entry carries a status
        -- the evaluator decided, not a number the template demanded
        select count(*) into n from jsonb_array_elements(v_body -> 'entries') e
         where e ->> 'status' is null;
        if n <> 0 then
          v_probs := selftest.f08_note(v_probs, 'F08-P03', format('%s report entry(ies) carry no status', n));
        end if;

        -- REVISION IS A NEW VERSION, and a report already issued keeps saying
        -- which assembly produced it.
        v_tpl_again := public.save_report_template(v_inst, 'institution_learning_intelligence',
          'laporan.institusi.judul',
          jsonb_build_array(jsonb_build_object('metric_id', v_m2, 'visualization', v_v2)), v_tpl);
        if v_tpl_again <> v_tpl then
          v_probs := selftest.f08_note(v_probs, 'F08-P03', 'revising the template created a second one');
        end if;
        select t.template_version into m_version from public.report_templates t where t.id = v_tpl;
        if m_version <> 2 then
          v_probs := selftest.f08_note(v_probs, 'F08-P03', format('the revised template is at version %s', m_version));
        end if;
        select count(*) into n from public.generated_reports
         where template_id = v_tpl and template_version = 1;
        if n <> 1 then
          v_probs := selftest.f08_note(v_probs, 'F08-P03', 'the issued report lost the version it was made from');
        end if;

        -- CONFIGURING IS AN ACT OF ADMINISTRATION, and it is on the record
        select count(*) into m_audit from public.audit_log
         where action = 'report_template.saved' and target_id = v_tpl::text;
        if m_audit <> 2 then
          v_probs := selftest.f08_note(v_probs, 'F08-P03', format('two saves wrote %s audit row(s)', m_audit));
        end if;
        -- and the record carries no figure from the evidence
        select count(*) into n from public.audit_log
         where action = 'report_template.saved' and target_id = v_tpl::text
           and (summary ? 'value' or summary ? 'sample' or summary ? 'have');
        if n <> 0 then
          v_probs := selftest.f08_note(v_probs, 'F08-P03', 'a configuration audit row carries a figure');
        end if;
        perform selftest.as_owner();
      end if;
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P03', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P04  WHAT AN INSTITUTION MAY NOT DO TO PINTAR'S CATALOGUE.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');

      -- a metric of its own invention
      v_raised := false;
      begin
        perform public.save_report_template(v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
          jsonb_build_array(jsonb_build_object('metric_id', 'institution.invented_here', 'visualization', v_v1)));
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised or v_msg !~ 'unknown metric' then
        v_probs := selftest.f08_note(v_probs, 'F08-P04',
          'a school defined its own metric: ' || coalesce(v_msg, '(accepted)'));
      else m_cfg_denied := m_cfg_denied + 1; end if;

      -- a way of drawing the catalogue does not permit for that metric
      v_raised := false;
      begin
        perform public.save_report_template(v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
          jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', 'pie_of_everything')));
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised or v_msg !~ 'does not permit visualization' then
        v_probs := selftest.f08_note(v_probs, 'F08-P04',
          'a school chose a forbidden visualization: ' || coalesce(v_msg, '(accepted)'));
      else m_cfg_denied := m_cfg_denied + 1; end if;

      -- a template that shows nothing, and one that shows everything
      v_raised := false;
      begin
        perform public.save_report_template(v_inst, 'institution_learning_intelligence',
          'laporan.institusi.judul', '[]'::jsonb);
      exception when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f08_note(v_probs, 'F08-P04', 'an empty report template was accepted');
      else m_cfg_denied := m_cfg_denied + 1; end if;

      v_big := '[]'::jsonb;
      for i in 1..13 loop
        v_big := v_big || jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', v_v1));
      end loop;
      v_raised := false;
      begin
        perform public.save_report_template(v_inst, 'institution_learning_intelligence',
          'laporan.institusi.judul', v_big);
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised or v_msg !~ 'at most 12' then
        v_probs := selftest.f08_note(v_probs, 'F08-P04',
          'a thirteen-metric template was accepted: ' || coalesce(v_msg, '(accepted)'));
      else m_cfg_denied := m_cfg_denied + 1; end if;

      -- another school's reporting
      v_raised := false;
      begin
        perform public.save_report_template(v_other, 'institution_learning_intelligence', 'laporan.institusi.judul',
          jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', v_v1)));
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised or v_msg !~ 'CAN_MANAGE_REPORT_TEMPLATES' then
        v_probs := selftest.f08_note(v_probs, 'F08-P04',
          'an administrator assembled a template for another school: ' || coalesce(v_msg, '(accepted)'));
      else m_cfg_denied := m_cfg_denied + 1; end if;

      -- AND THE CATALOGUE ITSELF IS OUT OF REACH, not merely unasked for: the
      -- administrator cannot write a definition directly either.
      v_raised := false;
      begin
        update public.metric_definitions set minimum_sample = 1
         where catalogue_version = v_cat and metric_id = v_m1;
        if not found then v_raised := true; end if;
      exception when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f08_note(v_probs, 'F08-P04', 'an institution administrator edited a metric definition');
      else m_cfg_denied := m_cfg_denied + 1; end if;
      perform selftest.as_owner();
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P04', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P05  AUTHORIZATION IS THE FIRST GATE (RF-2's lesson, on the new
    --          endpoint). A caller without the capability is refused BY THE
    --          CAPABILITY even when every other argument is unusable -- so the
    --          refusal proves authorization and not a lookup that failed.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      for r in select * from unnest(array['f08-dekan-', 'f08-guru-', 'f08-admin2-']) as t(who) loop
        perform selftest.as_user(r.who || v_tag || '@local.invalid');
        -- a well-formed request they are simply not authorized for
        v_raised := false;
        begin
          perform public.save_report_template(v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
            jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', v_v1)));
        exception when others then v_raised := true; v_msg := sqlerrm; end;
        if not v_raised or v_msg !~ 'CAN_MANAGE_REPORT_TEMPLATES' then
          v_probs := selftest.f08_note(v_probs, 'F08-P05',
            r.who || 'assembled a report template: ' || coalesce(v_msg, '(accepted)'));
        end if;
        -- and the same refusal when nothing else could have resolved
        v_raised := false;
        begin
          perform public.save_report_template(v_inst, 'not_a_standard_report', 'LAPORAN SALAH', null,
            gen_random_uuid());
        exception when others then v_raised := true; v_msg := sqlerrm; end;
        if not v_raised or v_msg !~ 'CAN_MANAGE_REPORT_TEMPLATES' then
          v_probs := selftest.f08_note(v_probs, 'F08-P05',
            format('%s was refused by something other than the capability: %s', r.who, coalesce(v_msg, '(accepted)')));
        end if;
      end loop;
      -- an unidentified session is refused by the same sentence
      perform selftest.as_anon();
      v_raised := false;
      begin
        perform public.save_report_template(v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
          jsonb_build_array(jsonb_build_object('metric_id', v_m1, 'visualization', v_v1)));
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised then
        v_probs := selftest.f08_note(v_probs, 'F08-P05', 'an anonymous caller assembled a report template');
      end if;
      perform selftest.as_owner();
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P05', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P06  W8-03 and W8-04: a retired metric, and a grant that could
    --          never work.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();

      -- W8-04: not client surface, still invoker, and delivery still reaches it
      if has_function_privilege('authenticated',
           'public.drawable_items_for_definition(uuid,uuid,uuid,uuid)'::regprocedure, 'execute') then
        v_probs := selftest.f08_note(v_probs, 'F08-P06',
          'drawable_items_for_definition is still client surface');
      end if;
      select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
       where ns.nspname = 'public' and p.proname = 'drawable_items_for_definition' and p.prosecdef;
      if n > 0 then
        v_probs := selftest.f08_note(v_probs, 'F08-P06', 'drawable_items_for_definition became SECURITY DEFINER');
      end if;
      if pg_get_functiondef('public.assemble_session(uuid)'::regprocedure)
           not like '%drawable_items_for_definition%' then
        v_probs := selftest.f08_note(v_probs, 'F08-P06', 'the assembler no longer calls the drawable set');
      end if;
      -- THE DELIVERY PATH STILL WORKS, which is the property the revoke could
      -- have broken: the seeded learner's assignment still assembles a paper.
      select count(*) into n from public.drawable_items_for_definition(
        (select aa.assessment_definition_id from public.assessment_assignments aa
          order by aa.created_at, aa.id limit 1));
      if n = 0 then
        v_probs := selftest.f08_note(v_probs, 'F08-P06', 'the seeded definition draws no items: delivery is broken');
      end if;

      -- W8-03: a retired metric is refused at selection, and a metric retired
      -- AFTER a template named it keeps its row.
      if v_tpl is not null and v_m2 is not null then
        insert into public.metric_catalogue (version, note)
        values ('MC-9108', 'F08 probe: one metric retired, rolled back');
        insert into public.metric_definitions
          (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
           minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
           deprecated, deprecation_note_key)
        select 'MC-9108', d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
               d.minimum_sample, d.allowed_visualizations, d.allowed_audiences, d.calculation_key,
               d.metric_id = v_m2,
               case when d.metric_id = v_m2 then 'metrik.pensiun.probe' else d.deprecation_note_key end
          from public.metric_definitions d where d.catalogue_version = v_cat;
        update public.metric_catalogue set superseded_by = 'MC-9108' where version = v_cat;
        if public.current_metric_catalogue() <> 'MC-9108' then
          v_probs := selftest.f08_note(v_probs, 'F08-P06', 'the probe catalogue did not become live');
        end if;

        perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');
        v_raised := false;
        begin
          perform public.save_report_template(v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
            jsonb_build_array(jsonb_build_object('metric_id', v_m2, 'visualization', v_v2)));
        exception when others then v_raised := true; v_msg := sqlerrm; end;
        if not v_raised or v_msg !~ 'deprecated' then
          v_probs := selftest.f08_note(v_probs, 'F08-P06',
            'a retired metric was accepted into a template: ' || coalesce(v_msg, '(accepted)'));
        end if;
        perform selftest.as_owner();
        -- the template that already named it is untouched
        select count(*) into n from public.report_template_metrics
         where template_id = v_tpl and metric_id = v_m2;
        if n <> 1 then
          v_probs := selftest.f08_note(v_probs, 'F08-P06',
            format('retiring a metric disturbed a template that already named it (%s row(s))', n));
        end if;
      end if;
      perform selftest.as_owner();
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P06', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P07  DAY ZERO: the first administrator, and the door that shuts.
    --          Last, because reaching day zero means revoking every active
    --          SYSTEM_ADMIN in this fixture's world -- which the sentinel
    --          below undoes with everything else.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into auth.users (id, email) values (gen_random_uuid(), 'f08-first-' || v_tag || '@local.invalid')
      returning users.id into v_first_u;
      insert into auth.users (id, email) values (gen_random_uuid(), 'f08-second-' || v_tag || '@local.invalid')
      returning users.id into v_second_u;
      select a.person_id into v_first from public.accounts a where a.auth_user_id = v_first_u;
      select a.person_id into v_second from public.accounts a where a.auth_user_id = v_second_u;
      perform set_config('app.seed_intent', '', true);

      -- (a) A CLIENT CANNOT REACH IT AT ALL. Not granted, and refused by the
      --     function's own first check even if it ever were.
      for r in select * from unnest(array['authenticated', 'anon']) as t(who) loop
        begin
          if r.who = 'anon' then perform selftest.as_anon();
          else perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid'); end if;
          perform public.bootstrap_first_system_admin('f08-first-' || v_tag || '@local.invalid');
          v_probs := selftest.f08_note(v_probs, 'F08-P07',
            'a ' || r.who || ' session called the day-zero bootstrap');
        exception when others then m_boot_denied := m_boot_denied + 1;
        end;
      end loop;
      perform selftest.as_owner();

      -- (b) AND THE OPERATOR CANNOT EITHER, WHILE AN ADMINISTRATOR EXISTS.
      --     The seeded world has one, so this is the ordinary state.
      select count(*) into n from public.role_assignments
       where role = 'SYSTEM_ADMIN' and revoked_at is null and now() < valid_until;
      if n = 0 then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'the fixture world has no active SYSTEM_ADMIN, so the refusal below proves nothing');
      end if;
      set local role service_role;
      v_raised := false;
      begin
        perform public.bootstrap_first_system_admin('f08-first-' || v_tag || '@local.invalid');
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      set local role postgres;
      if not v_raised or v_msg !~ 'already has an active SYSTEM_ADMIN' then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'the bootstrap ran while an administrator existed: ' || coalesce(v_msg, '(accepted)'));
      else m_boot_denied := m_boot_denied + 1; end if;

      -- (c) DAY ZERO, reached honestly: every active SYSTEM_ADMIN revoked
      --     through the guard's own revocation path.
      update public.role_assignments set revoked_at = now()
       where role = 'SYSTEM_ADMIN' and revoked_at is null;
      set local role service_role;
      begin
        if public.bootstrap_first_system_admin('f08-first-' || v_tag || '@local.invalid') <> v_first then
          v_probs := selftest.f08_note(v_probs, 'F08-P07', 'the bootstrap bound the wrong person');
        end if;
      exception when others then
        v_probs := selftest.f08_note(v_probs, 'F08-P07', 'the day-zero bootstrap failed: ' || left(sqlerrm, 120));
      end;
      -- (d) and shuts behind itself, naming the DURABLE fact rather than who
      --     happens to be an administrator
      v_raised := false;
      begin
        perform public.bootstrap_first_system_admin('f08-second-' || v_tag || '@local.invalid');
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      set local role postgres;
      if not v_raised or v_msg !~ 'already initialised' then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'a second bootstrap was accepted: ' || coalesce(v_msg, '(accepted)'));
      else m_boot_denied := m_boot_denied + 1; end if;

      select count(*) into n from public.platform_bootstrap;
      if n <> 1 then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          format('the bootstrap left %s initialisation record(s), expected exactly one', n));
      end if;

      select count(*) into n from public.role_assignments
       where person_id = v_first and role = 'SYSTEM_ADMIN' and revoked_at is null and scope_node_id is null;
      if n <> 1 then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          format('the bootstrap left %s global SYSTEM_ADMIN assignment(s) for the first admin', n));
      end if;
      select count(*) into n from public.audit_log
       where action = 'role.first_system_admin_bootstrapped' and target_id in
             (select ra.id::text from public.role_assignments ra where ra.person_id = v_first);
      if n <> 1 then
        v_probs := selftest.f08_note(v_probs, 'F08-P07', format('the bootstrap wrote %s audit row(s)', n));
      end if;

      -- (e) ORDINARY INV-16 IS UNTOUCHED. The marker is not a key, an
      --     unauthenticated grant is still refused, a signed-in grantor still
      --     may not grant themselves, and only an active SYSTEM_ADMIN may
      --     grant SYSTEM_ADMIN.
      perform set_config('pintar.bootstrap_first_admin', v_second::text, true);
      v_raised := false;
      begin
        insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
        values (v_second, 'SYSTEM_ADMIN', null, now(), now() + interval '1 day');
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      perform set_config('pintar.bootstrap_first_admin', '', true);
      if not v_raised or v_msg !~ 'authenticated grantor' then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'the marker opened the door while an administrator existed: ' || coalesce(v_msg, '(accepted)'));
      else m_boot_denied := m_boot_denied + 1; end if;

      perform selftest.as_user('f08-first-' || v_tag || '@local.invalid');
      v_raised := false;
      begin
        perform public.grant_role(v_first, 'INSTITUTION_ADMIN', v_inst, now() + interval '30 days');
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised or v_msg !~ 'self-grant' then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'the bootstrapped administrator granted themselves: ' || coalesce(v_msg, '(accepted)'));
      else m_boot_denied := m_boot_denied + 1; end if;

      perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');
      v_raised := false;
      begin
        perform public.grant_role(v_second, 'SYSTEM_ADMIN', null, now() + interval '30 days');
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      if not v_raised or v_msg !~ 'SYSTEM_ADMIN' then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'an institution administrator granted SYSTEM_ADMIN: ' || coalesce(v_msg, '(accepted)'));
      else m_boot_denied := m_boot_denied + 1; end if;

      -- and the bootstrapped administrator governs normally from here
      perform selftest.as_user('f08-first-' || v_tag || '@local.invalid');
      begin
        perform public.grant_role(v_second, 'INSTITUTION_ADMIN', v_inst, now() + interval '30 days');
      exception when others then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'the bootstrapped administrator cannot govern: ' || left(sqlerrm, 120));
      end;
      perform selftest.as_owner();

      -- (f) THE RULING: initialisation is not administrator recovery. Revoke
      --     every SYSTEM_ADMIN there is -- the installation now has none at
      --     all -- and the door is still shut, because what closed it was the
      --     durable record of the act and not the existence of an admin.
      update public.role_assignments set revoked_at = now()
       where role = 'SYSTEM_ADMIN' and revoked_at is null;
      select count(*) into n from public.role_assignments
       where role = 'SYSTEM_ADMIN' and revoked_at is null and now() < valid_until;
      if n <> 0 then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'the probe could not leave the installation without an administrator, so the refusal below proves nothing');
      end if;
      set local role service_role;
      v_raised := false;
      begin
        perform public.bootstrap_first_system_admin('f08-second-' || v_tag || '@local.invalid');
      exception when others then v_raised := true; v_msg := sqlerrm; end;
      set local role postgres;
      if not v_raised or v_msg !~ 'already initialised' then
        v_probs := selftest.f08_note(v_probs, 'F08-P07',
          'the bootstrap reopened after every administrator was revoked: ' || coalesce(v_msg, '(accepted)'));
      else m_boot_denied := m_boot_denied + 1; end if;

      -- and the record cannot be undone to reopen it
      v_raised := false;
      begin delete from public.platform_bootstrap;
      exception when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f08_note(v_probs, 'F08-P07', 'the initialisation record was deleted');
      else m_boot_denied := m_boot_denied + 1; end if;
      perform selftest.as_owner();
    exception when others then
      begin set local role postgres; exception when others then null; end;
      v_probs := selftest.f08_note(v_probs, 'F08-P07', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P08  A PERSON WITH NO PAST CAN BE GIVEN THEIR FIRST ROLE.
    --          The configuration studio offered only people reachable through
    --          an enrolment, a transfer or an existing role -- every one of
    --          them a prior relationship -- so a school's first administrator,
    --          who by definition has none, could not be selected at all.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_owner();
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into auth.users (id, email) values (gen_random_uuid(), 'f08-fresh-' || v_tag || '@local.invalid')
      returning users.id into v_fresh_u;
      select a.person_id into v_fresh from public.accounts a where a.auth_user_id = v_fresh_u;
      update public.persons set display_name = 'Calon Kepala ' || v_tag where persons.id = v_fresh;
      v_sysadmin_u := selftest.f08_user('f08-sys-' || v_tag || '@local.invalid', 'SYSTEM_ADMIN', v_inst);
      perform set_config('app.seed_intent', '', true);

      -- (a) REACHABLE THROUGH NONE OF THE THREE EXISTING SOURCES
      select count(*) into n from public.enrollments e where e.person_id = v_fresh;
      if n <> 0 then v_probs := selftest.f08_note(v_probs, 'F08-P08', 'the fresh person is enrolled'); end if;
      select count(*) into n from public.transfers t where t.person_id = v_fresh;
      if n <> 0 then v_probs := selftest.f08_note(v_probs, 'F08-P08', 'the fresh person has a transfer'); end if;
      select count(*) into n from public.role_assignments ra where ra.person_id = v_fresh;
      if n <> 0 then v_probs := selftest.f08_note(v_probs, 'F08-P08', 'the fresh person already holds a role'); end if;

      -- (b) AND THE SYSTEM ADMIN FINDS THEM ANYWAY, BY NAME
      perform selftest.as_user('f08-sys-' || v_tag || '@local.invalid');
      select count(*) into n from public.persons_awaiting_first_role()
       where person_id = v_fresh and display_name = 'Calon Kepala ' || v_tag;
      if n <> 1 then
        v_probs := selftest.f08_note(v_probs, 'F08-P08',
          'the person holding nothing is not offered for a first role');
      end if;
      -- it is the COMPLEMENT of the studio's three sources, not a directory:
      -- everyone who already holds something is absent
      select count(*) into n from public.persons_awaiting_first_role() w
       where exists (select 1 from public.role_assignments ra
                      where ra.person_id = w.person_id and ra.revoked_at is null)
          or exists (select 1 from public.enrollments e where e.person_id = w.person_id)
          or exists (select 1 from public.transfers t where t.person_id = w.person_id);
      if n <> 0 then
        v_probs := selftest.f08_note(v_probs, 'F08-P08',
          format('%s person(s) who already hold something are offered as awaiting a first role', n));
      end if;

      -- (c) THE GRANT THE LIST EXISTS FOR IS ACCEPTED, at the institution root
      begin
        perform public.grant_role(v_fresh, 'INSTITUTION_ADMIN', v_inst, now() + interval '365 days');
      exception when others then
        v_probs := selftest.f08_note(v_probs, 'F08-P08',
          'the discovered person could not be granted a first role: ' || left(sqlerrm, 120));
      end;
      select count(*) into n from public.persons_awaiting_first_role() where person_id = v_fresh;
      if n <> 0 then
        v_probs := selftest.f08_note(v_probs, 'F08-P08', 'a person who now holds a role is still waiting');
      end if;

      -- (d) AND ORDINARY ONBOARDING CONTINUES from that grant
      -- (restated for BOB-08 (a): through the structure functions)
      perform selftest.as_user('f08-fresh-' || v_tag || '@local.invalid');
      begin
        perform public.create_bagian(v_inst, 'Bagian baru ' || v_tag);
      exception when others then
        v_probs := selftest.f08_note(v_probs, 'F08-P08',
          'the newly granted administrator cannot onboard their school: ' || left(sqlerrm, 120));
      end;

      -- (e) NOBODY ELSE MAY ASK, and the reply is a refusal rather than rows
      for r in select * from unnest(array['f08-admin-', 'f08-dekan-', 'f08-guru-']) as t(who) loop
        perform selftest.as_user(r.who || v_tag || '@local.invalid');
        begin
          perform public.persons_awaiting_first_role();
          v_probs := selftest.f08_note(v_probs, 'F08-P08',
            r.who || 'read the list of people awaiting a first role');
        exception when others then
          if sqlerrm !~ 'SYSTEM_ADMIN' then
            v_probs := selftest.f08_note(v_probs, 'F08-P08',
              r.who || 'was refused for the wrong reason: ' || left(sqlerrm, 90));
          else m_wait_denied := m_wait_denied + 1; end if;
        end;
      end loop;
      perform selftest.as_anon();
      begin
        perform public.persons_awaiting_first_role();
        v_probs := selftest.f08_note(v_probs, 'F08-P08', 'an anonymous caller read the waiting list');
      exception when others then m_wait_denied := m_wait_denied + 1;
      end;
      perform selftest.as_owner();

      -- (f) AND VISIBILITY WAS NOT WIDENED TO ACHIEVE ANY OF IT
      if pg_get_functiondef('public.person_visible_to_me(uuid)'::regprocedure) ~* '\yawaiting\y' then
        v_probs := selftest.f08_note(v_probs, 'F08-P08', 'person_visible_to_me was taught about this list');
      end if;
      if pg_get_functiondef('public.persons_awaiting_first_role()'::regprocedure)
           not like '%person_visible_to_me%' then
        v_probs := selftest.f08_note(v_probs, 'F08-P08', 'the read does not defer to person_visible_to_me');
      end if;
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P08', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P09  D-093 T1 (owner ruling 3 Oct, O4): AN OPERATIONAL STATE HAS ONE PATH.
    -- A teacher may not move an assignment window or close it by writing the table, a school's administrator may
    -- not change the school's own is_synthetic (which decides whether its evidence is OFFICIAL) or is_active, and
    -- nobody signed in writes classes.status: each is refused by privilege (42501), not merely filtered to zero
    -- rows. The posture of the installation is the deployment system's alone, and its change is on the record from
    -- and to. The governed paths stay: assign_release and launch_quick_assessment keep opening windows as SECURITY
    -- DEFINER functions a teacher may call (walked as the teacher in F13 and Q12).
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('f08-guru-' || v_tag || '@local.invalid');
      if not public.can_in_institution('CAN_ASSIGN_LEARNING', v_inst) then
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'the fixture teacher cannot assign here, so the refusals below would prove nothing');
      end if;
      begin
        update public.assessment_assignments set closes_at = now() + interval '30 days' where institution_id = v_inst;
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a teacher still moves an assessment window by writing the table');
      exception when insufficient_privilege then m_d093 := m_d093 + 1; end;
      begin
        update public.assessment_assignments set status = 'CLOSED' where institution_id = v_inst;
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a teacher still closes an assessment by writing the table');
      exception when insufficient_privilege then m_d093 := m_d093 + 1; end;
      begin
        update public.learning_assignments set available_until = now() where institution_id = v_inst;
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a teacher still ends a lesson window by writing the table');
      exception when insufficient_privilege then m_d093 := m_d093 + 1; end;
      begin
        insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id)
        values (v_inst, gen_random_uuid(), gen_random_uuid(), v_prog, v_period);
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a teacher still inserts an assignment row directly');
      exception
        when insufficient_privilege then m_d093 := m_d093 + 1;
        when others then
          v_probs := selftest.f08_note(v_probs, 'F08-P09',
            'a teacher''s direct insert reached the row checks instead of a privilege refusal: ' || left(sqlerrm, 80));
      end;

      perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');
      begin
        update public.institutions set is_synthetic = not is_synthetic where institutions.id = v_inst;
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a school administrator still changes the school''s is_synthetic directly');
      exception
        when insufficient_privilege then m_d093 := m_d093 + 1;
        when others then   -- a row guard, not the privilege: outside production the bootstrap guard can refuse it
          v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a school administrator still changes the school''s is_synthetic directly (stopped only by a row guard: ' || left(sqlerrm, 60) || ')');
      end;
      begin
        update public.institutions set is_active = false where institutions.id = v_inst;
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a school administrator still changes the school''s is_active directly');
      exception
        when insufficient_privilege then m_d093 := m_d093 + 1;
        when others then   -- a row guard, not the privilege: outside production the bootstrap guard can refuse it
          v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a school administrator still changes the school''s is_active directly (stopped only by a row guard: ' || left(sqlerrm, 60) || ')');
      end;
      begin
        update public.classes set status = 'ENDED' where node_id = v_prog;
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a school administrator still writes classes.status directly');
      exception
        when insufficient_privilege then m_d093 := m_d093 + 1;
        when others then   -- a row guard, not the privilege: outside production the bootstrap guard can refuse it
          v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a school administrator still writes classes.status directly (stopped only by a row guard: ' || left(sqlerrm, 60) || ')');
      end;
      perform selftest.as_owner();

      -- the grants themselves, as a fresh session meets them, and the posture's
      foreach v_msg in array array['learning_assignments','assessment_assignments','institutions','classes'] loop
        if has_table_privilege('authenticated', 'public.' || v_msg, 'insert')
           or has_table_privilege('authenticated', 'public.' || v_msg, 'update') then
          v_probs := selftest.f08_note(v_probs, 'F08-P09', format('authenticated still holds a write grant on %s', v_msg));
        end if;
        if not has_table_privilege('authenticated', 'public.' || v_msg, 'select') then
          v_probs := selftest.f08_note(v_probs, 'F08-P09', format('authenticated lost its read of %s', v_msg));
        end if;
      end loop;
      if has_table_privilege('service_role', 'public.platform_environment', 'update')
         or has_table_privilege('service_role', 'public.platform_environment', 'insert')
         or has_table_privilege('service_role', 'public.platform_environment', 'delete') then
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'service_role can still change the installation''s posture');
      end if;
      -- the governed paths are intact: definer functions a teacher may call
      if not (select bool_and(p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute'))
                from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
               where ns.nspname = 'public' and p.proname in ('assign_release', 'launch_quick_assessment')) then
        v_probs := selftest.f08_note(v_probs, 'F08-P09', 'a governed assignment path is no longer a definer function a teacher may call');
      end if;

      -- the deployment system's change of posture is recorded, from and to; a save that changes nothing is not
      select coalesce(max(audit_log.id), 0) into v_audit_before from public.audit_log;
      update public.platform_environment set environment = environment;
      update public.platform_environment
         set local_fixtures_enabled = not local_fixtures_enabled;
      select count(*) into n from public.audit_log a
       where a.id > v_audit_before and a.action = 'platform_environment.changed'
         and a.summary -> 'from' ->> 'local_fixtures_enabled' is distinct from a.summary -> 'to' ->> 'local_fixtures_enabled'
         and a.summary ->> 'database_role' is not null;
      if n <> 1 then
        v_probs := selftest.f08_note(v_probs, 'F08-P09', format('the posture change was recorded %s time(s), expected once with from and to', n));
      end if;
      update public.platform_environment set local_fixtures_enabled = not local_fixtures_enabled;   -- back as it was
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P09', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F08-P10  D-093 T2 (D-097): AN OPERATIONAL CHANGE SAYS WHAT IT WAS.
    -- A revocation and a deactivation are refused without a reason (D-097(a)) and, given one, are on the record with
    -- what they changed from and to, the reason, and the role the administrator acted under -- the deactivation naming
    -- every place it closed. A revocation is not written twice. The inert switches record from and to, and a save that
    -- changes nothing writes nothing.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select ra.id into v_ra from public.role_assignments ra
        join public.accounts ac on ac.person_id = ra.person_id
       where ac.auth_user_id = v_guru_u and ra.role = 'EDUCATOR' and ra.revoked_at is null limit 1;
      perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');
      -- 1. role revoke: no reason, no revocation
      begin
        execute format('select public.revoke_role(%L::uuid, %L)', v_ra, '   ');
        v_probs := selftest.f08_note(v_probs, 'F08-P10', 'a role was revoked without a reason');
      exception when others then
        if sqlerrm ~ 'reason' then m_t2 := m_t2 + 1;
        else v_probs := selftest.f08_note(v_probs, 'F08-P10', 'a role revocation without a reason was refused for something else: ' || left(sqlerrm, 80)); end if;
      end;
      execute format('select public.revoke_role(%L::uuid, %L)', v_ra, 'pindah tugas ke sekolah lain');
      begin
        execute format('select public.revoke_role(%L::uuid, %L)', v_ra, 'kedua kali');
        v_probs := selftest.f08_note(v_probs, 'F08-P10', 'a revoked role was revoked a second time');
      exception when others then m_t2 := m_t2 + 1; end;
      perform selftest.as_owner();
      select a.summary into v_sum from public.audit_log a
       where a.action = 'role.revoked' and a.target_id = v_ra::text order by a.id desc limit 1;
      if (select count(*) from public.audit_log a where a.action = 'role.revoked' and a.target_id = v_ra::text) <> 1 then
        v_probs := selftest.f08_note(v_probs, 'F08-P10', 'the revocation is not on the record exactly once');
      end if;
      if v_sum ->> 'reason' is distinct from 'pindah tugas ke sekolah lain'
         or v_sum -> 'from' ->> 'state' is distinct from 'ACTIVE' or v_sum -> 'to' ->> 'state' is distinct from 'REVOKED'
         or v_sum ->> 'actor_role' is distinct from 'INSTITUTION_ADMIN' then
        v_probs := selftest.f08_note(v_probs, 'F08-P10',
          'the revocation''s record lacks its reason, from and to, or the actor''s role: ' || left(coalesce(v_sum::text, 'none'), 160));
      end if;
      if (select ra.revoked_reason from public.role_assignments ra where ra.id = v_ra) is distinct from 'pindah tugas ke sekolah lain' then
        v_probs := selftest.f08_note(v_probs, 'F08-P10', 'the assignment does not keep why it was revoked');
      end if;

      -- 2. structure deactivation: no reason, no deactivation; given one, every closed place is named
      perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');
      v_b_tutup := public.create_bagian(v_inst, 'Bagian tutup ' || v_tag);
      begin
        execute format('select public.deactivate_school_node(%L::uuid, %L)', v_b_tutup, '');
        v_probs := selftest.f08_note(v_probs, 'F08-P10', 'a place was deactivated without a reason');
      exception when others then
        if sqlerrm ~ 'reason' then m_t2 := m_t2 + 1;
        else v_probs := selftest.f08_note(v_probs, 'F08-P10', 'a deactivation without a reason was refused for something else: ' || left(sqlerrm, 80)); end if;
      end;
      execute format('select public.deactivate_school_node(%L::uuid, %L)', v_b_tutup, 'digabung dengan Bagian lain');
      perform selftest.as_owner();
      -- G1, closed in audit_write: a row whose writer names no role still names the acting administrator's
      select a.summary into v_sum from public.audit_log a
       where a.action = 'structure.bagian_created' and a.target_id = v_b_tutup::text order by a.id desc limit 1;
      if v_sum ->> 'actor_role' is distinct from 'INSTITUTION_ADMIN' then
        v_probs := selftest.f08_note(v_probs, 'F08-P10',
          'a row written by the school administrator does not name their role (G1): ' || left(coalesce(v_sum::text, 'none'), 120));
      end if;
      select a.summary into v_sum from public.audit_log a
       where a.action = 'structure.deactivated' and a.target_id = v_b_tutup::text order by a.id desc limit 1;
      if v_sum ->> 'reason' is distinct from 'digabung dengan Bagian lain'
         or (v_sum -> 'from' ->> 'is_active') is distinct from 'true' or (v_sum -> 'to' ->> 'is_active') is distinct from 'false'
         or v_sum ->> 'actor_role' is distinct from 'INSTITUTION_ADMIN'
         or coalesce(jsonb_array_length(v_sum -> 'deactivated'), 0) <> 2 then
        v_probs := selftest.f08_note(v_probs, 'F08-P10',
          'the deactivation''s record lacks its reason, from and to, the actor''s role or the places it closed (a Bagian and its hidden Reguler): '
          || left(coalesce(v_sum::text, 'none'), 160));
      end if;

      -- 3. the inert switches: from and to, and nothing for a save that changes nothing
      perform selftest.as_owner();
      -- (the states T1 left to the owner: a school's active flag and a class's status, recorded from and to)
      select coalesce(max(audit_log.id), 0) into v_audit_before from public.audit_log;
      update public.institutions set is_active = is_active where institutions.id = v_inst;
      update public.institutions set is_active = false where institutions.id = v_inst;
      insert into public.classes (node_id, subject) values (v_cls, 'F08 kelas') on conflict (node_id) do nothing;
      update public.classes set status = 'ACTIVE' where node_id = v_cls and status = 'SCHEDULED';
      select count(*) into n from public.audit_log a
       where a.id > v_audit_before and a.action in ('institution.state_changed', 'class.status_changed')
         and a.summary -> 'from' is not null and a.summary -> 'to' is not null and a.summary -> 'from' <> a.summary -> 'to'
         and a.summary ->> 'database_role' is not null;
      if n <> 2 then
        v_probs := selftest.f08_note(v_probs, 'F08-P10',
          format('a school''s active flag and a class''s status changed by the owner were recorded %s time(s), expected 2 with from and to', n));
      end if;
      update public.institutions set is_active = true where institutions.id = v_inst;
      select coalesce(max(audit_log.id), 0) into v_audit_before from public.audit_log;
      update public.platform_config set value = value where key = 'maintenance_mode';
      update public.platform_config set value = to_jsonb(not (value::text)::boolean) where key = 'maintenance_mode';
      select count(*) into n from public.audit_log a where a.id > v_audit_before and a.action = 'platform_config.updated';
      select a.summary into v_sum from public.audit_log a
       where a.id > v_audit_before and a.action = 'platform_config.updated' order by a.id desc limit 1;
      if n <> 1 or v_sum -> 'from' is null or v_sum -> 'to' is null or v_sum -> 'from' = v_sum -> 'to' then
        v_probs := selftest.f08_note(v_probs, 'F08-P10',
          format('a platform setting change wrote %s row(s); expected one, from and to: %s', n, left(coalesce(v_sum::text, 'none'), 120)));
      end if;
      perform selftest.as_user('f08-admin-' || v_tag || '@local.invalid');
      select coalesce(max(audit_log.id), 0) into v_audit_before from public.audit_log;
      insert into public.feature_flags (key, institution_id, enabled) values ('f08.d093.' || v_tag, v_inst, true);
      update public.feature_flags set enabled = true where key = 'f08.d093.' || v_tag and institution_id = v_inst;
      update public.feature_flags set enabled = false where key = 'f08.d093.' || v_tag and institution_id = v_inst;
      perform selftest.as_owner();
      select count(*) into n from public.audit_log a where a.id > v_audit_before and a.target_table = 'feature_flags';
      select a.summary into v_sum from public.audit_log a
       where a.id > v_audit_before and a.action = 'feature_flag.UPDATE' order by a.id desc limit 1;
      if n <> 2 or (v_sum -> 'from' ->> 'enabled') is distinct from 'true' or (v_sum -> 'to' ->> 'enabled') is distinct from 'false'
         or v_sum ->> 'actor_role' is distinct from 'INSTITUTION_ADMIN' then
        v_probs := selftest.f08_note(v_probs, 'F08-P10',
          format('a feature flag''s three saves (one unchanged) wrote %s row(s), expected 2 with from, to and the actor''s role: %s',
                 n, left(coalesce(v_sum::text, 'none'), 120)));
      end if;
    exception when others then
      v_probs := selftest.f08_note(v_probs, 'F08-P10', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    raise exception 'F08_UNDO';

  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F08_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  for r in
    select * from unnest(
      array['F08-P01','F08-P02','F08-P03','F08-P04','F08-P05','F08-P06','F08-P07','F08-P08','F08-P09','F08-P10'],
      array['WP8 -- a school can build its own shape, signed in',
            'WP8 -- no client-writable table runs a trigger the client cannot execute',
            'WP8 -- an institution assembles a report and the engine runs on it',
            'WP8 -- the catalogue is PINTAR''s, and a template only selects from it',
            'WP8 -- authorization is the first gate on the new endpoint',
            'WP8 -- a retired metric, and a grant that could never work',
            'WP8 -- the first administrator, and the door that shuts behind them',
            'WP8 -- a person with no past can be given their first role',
            'D-093 -- an operational state has one path',
            'D-093 -- an operational change says what it was'],
      array[
        format('an institution administrator signs in and builds a Bagian, a Tingkat and a Kelas in their '
            || 'own school through BOB-01''s structure functions, and the Kelas carries a jalur %s deep; '
            || 'restated for BOB-08 (a), the same administrator''s direct writes to org_nodes and '
            || 'academic_periods are refused (%s of 2). The ladder helper stays executable by a client. '
            || 'The rules did not move: %s ladder violation(s) are refused even to the owner, and %s '
            || 'actor(s) without administration here -- a dean, an educator and the neighbouring school''s '
            || 'administrator -- are refused', m_depth, m_direct, m_ladder_refusals, m_build_denied),
        format('the standing assertion holds across %s client-writable table(s) and the %s '
            || 'invoker-rights trigger(s) on them, and it is owner-run: a client-executable assertion '
            || 'about client executability would be answering about itself', m_tables, m_triggers),
        format('the administrator assembles a %s-metric template from the live catalogue, in the order '
            || 'given, and generate_report runs on it and returns an entry per metric each carrying the '
            || 'status the evaluator decided. Revising it makes version %s rather than editing in place, '
            || 'and the report already issued still names version 1 as the assembly that produced it. '
            || 'The act is on the record %s time(s) and carries no figure', m_entries, m_version, m_audit),
        format('%s refusals: a metric of the school''s own invention, a way of drawing the catalogue '
            || 'does not permit for that metric, a template that shows nothing, one that shows thirteen, '
            || 'one assembled for the neighbouring school, and an attempt to edit a metric definition '
            || 'directly. A template selects; it does not define, and it cannot reach what defines',
            m_cfg_denied),
        'a dean, an educator and another school''s administrator are each refused by the capability''s '
            || 'name -- and refused by the SAME name when the call is otherwise unusable: a null metric '
            || 'list, an invented standard report and a template id that does not exist. So the refusal '
            || 'is authorization and not a lookup that failed, which is the shape RF-2 named. An '
            || 'anonymous caller is refused too',
        'the drawable-set helper is no longer granted to a client that could never have used it -- it '
            || 'is invoker-rights by design and calls an owner-only function -- while the assembler '
            || 'still reaches it and a seeded definition still draws its items, so delivery is intact. '
            || 'And a metric retired by a new catalogue version is refused at the moment a template '
            || 'selects it, while the template that named it before the retirement keeps its row: a '
            || 'catalogue decision does not silently rewrite what a school assembled',
        format('a freshly deployed PINTAR can acquire its first administrator and no second one. %s '
            || 'refusals: a signed-in session and an anonymous one cannot reach the door at all, the '
            || 'operator cannot open it while an administrator exists, it shuts behind the first one, '
            || 'the session marker is not a key on its own, the bootstrapped administrator may not '
            || 'grant themselves, and an institution administrator still may not grant SYSTEM_ADMIN. '
            || 'On day zero -- reached by revoking every active SYSTEM_ADMIN through the guard''s own '
            || 'revocation path -- the operator binds exactly one global assignment to an identity '
            || 'Supabase Auth already created, it is on the audit record once, and normal PINTAR role '
            || 'governance takes over: that administrator grants the next one through grant_role. AND '
            || 'INITIALISATION IS NOT RECOVERY: with the record written, revoking every SYSTEM_ADMIN '
            || 'in the installation does not reopen it, and the record itself cannot be deleted',
            m_boot_denied),
        format('the person a school needs most -- its first administrator, created moments ago and '
            || 'holding no enrolment, no transfer and no role -- is offered to a SYSTEM_ADMIN by '
            || 'name, asserted against all three of the sources that could not reach them. The grant '
            || 'the list exists for is accepted at the institution root, the person leaves the list '
            || 'the moment they hold something, and ordinary onboarding continues from there: they '
            || 'build their own cohort. %s refusals -- an institution administrator, a dean, an '
            || 'educator and an anonymous caller -- each by the SYSTEM_ADMIN name. Visibility was '
            || 'not widened to do any of it: the read defers to person_visible_to_me and that '
            || 'predicate knows nothing about this list', m_wait_denied),
        format('%s of 7 direct writes refused by privilege: a teacher who may assign cannot move or close an '
            || 'assessment window, end a lesson window or insert an assignment by writing the table; a school''s '
            || 'administrator cannot change the school''s is_synthetic (which decides whether its evidence is '
            || 'OFFICIAL) or is_active, or write classes.status. Reads are unchanged, the governed paths '
            || '(assign_release, launch_quick_assessment) are still definer functions a teacher may call, '
            || 'service_role cannot change the installation''s posture, and the deployment system''s change of '
            || 'posture is on the record once, from and to, while a save that changes nothing is not', m_d093),
        format('%s of 3 refusals: a role revocation and a deactivation without a reason, and a second revocation of '
            || 'the same role. Given a reason, each is on the record once with what it changed from and to, the '
            || 'reason and the role the administrator acted under (INSTITUTION_ADMIN); the assignment keeps why it '
            || 'was revoked; the deactivation names both places it closed (the Bagian and its hidden Reguler). The '
            || 'inert switches record from and to, and a save that changes nothing writes nothing (D-097). Every row '
            || 'written while a person acts names their role, including from writers that do not name it (G1). The '
            || 'states T1 left to the owner -- a school''s active flag, a class''s status -- are recorded from and to', m_t2)
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false;
      detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F08-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-08 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable08() from public;
grant execute on function selftest.run_fable08() to authenticated;

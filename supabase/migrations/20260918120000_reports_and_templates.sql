-- 0073 -- Standard Reports, Institution Report Templates, and the assertion
-- that no report function computes.
--
-- INV-34: a template selects, orders, visualizes, titles and brands. Never a
-- formula, never SQL, never a redefinition. 0071 made the MEANING unreachable
-- from a template by putting it in the catalogue; this migration makes the
-- template itself incapable of carrying one, and asserts that the report layer
-- above it does not quietly become a second calculator.
--
-- =========================================================================
-- TWO DEFECTS IN 0072's EVALUATOR, FIXED HERE. Both are mine.
--
-- (1) DEPRECATION WAS CHECKED BEFORE AUTHORIZATION. A viewer with no right to
--     a metric who asked for a deprecated one received `status: 'deprecated'`
--     and a note key -- learning that the metric exists, that it was retired,
--     and receiving text about it. Authorization now runs first, so every
--     status that says anything ABOUT a metric is only reachable by someone
--     entitled to the metric.
--
-- (2) THE REFUSAL ENVELOPE ECHOED WHAT IT WITHHELD. `not_permitted` carried
--     `metric_id` and `catalogue_version`. The caller already knows what it
--     asked for, so returning it buys nothing -- and a surface that renders an
--     envelope would have published a catalogue key to a reader who may not
--     see the metric. The refusal now carries a status and a statement key and
--     nothing else.
--
-- THE CATALOGUE VERSION IS NOW ADDRESSABLE, which it was not.
-- `calc_class_readiness_distribution` filters `catalogue_version = p_catalogue`
-- and tier rows are immutable, so the numbers ARE pinned to a version -- but
-- 0072's evaluator resolved `current_metric_catalogue()` itself, so nothing
-- could reach the pin. A report recording MC-1 and re-evaluated after a bump
-- to MC-2 would silently have used MC-2, which makes recorded provenance
-- decorative. `p_catalogue_version` defaults to the live version and may name
-- a historical one. A DEFAULT, not an overload: the lint counts overloaded
-- client RPCs, so the function is dropped and recreated rather than added to.
-- =========================================================================

-- ---------------------------------------------------------------------------
-- Templates. An institution's saved customization, and nothing more.
-- ---------------------------------------------------------------------------
create table public.report_templates (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null references public.institutions(id),
  template_version  integer not null default 1,
  standard_report   text not null,
  title_key         text not null,
  branding          jsonb not null default '{}'::jsonb,
  created_by_person_id uuid references public.persons(id),
  created_at        timestamptz not null default now(),
  constraint report_templates_standard_report_shape
    check (standard_report in ('class_learning_intelligence','institution_learning_intelligence','learner_result')),
  constraint report_templates_title_is_hle
    check (title_key ~ '^[a-z][a-z0-9_.]+$'),
  constraint report_templates_version_positive check (template_version > 0),
  unique (institution_id, standard_report, template_version)
);
alter table public.report_templates enable row level security;

-- The selection. One row per chosen metric: which, in what order, drawn how.
-- `metric_id` is a foreign key into the live catalogue at SAVE time and is
-- re-checked at EXECUTION -- a catalogue bump may retire it, and that is a
-- statement to the reader rather than an error.
create table public.report_template_metrics (
  template_id   uuid not null references public.report_templates(id) on delete cascade,
  metric_id     text not null,
  ordinal       smallint not null,
  visualization text not null,
  primary key (template_id, metric_id),
  unique (template_id, ordinal),
  constraint report_template_metrics_metric_id_shape
    check (metric_id ~ '^[a-z][a-z0-9_.]{2,60}$'),
  constraint report_template_metrics_visualization_shape
    check (visualization ~ '^[a-z][a-z0-9_]{2,40}$')
);
alter table public.report_template_metrics enable row level security;

-- ---------------------------------------------------------------------------
-- INV-34, enforced at write time.
--
-- The CHECK constraints above already refuse punctuation, so a formula or a
-- SQL fragment cannot be stored in `metric_id` or `visualization` at all. This
-- trigger adds the two things a regex cannot know: that the metric EXISTS in
-- the live catalogue, and that the chosen visualization is one the catalogue
-- permits for it. A template that could name an arbitrary visualization would
-- be redefining how a metric may be read, which is the same class of authority
-- as redefining what it means.
-- ---------------------------------------------------------------------------
create function public.enforce_report_template_metric()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
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
  if not (new.visualization = any (d.allowed_visualizations)) then
    raise exception 'metric % does not permit visualization %: the catalogue decides how a metric may be read',
      new.metric_id, new.visualization;
  end if;

  select t.institution_id into v_inst from public.report_templates t where t.id = new.template_id;
  if not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', v_inst) then
    raise exception 'editing a report template requires CAN_MANAGE_REPORT_TEMPLATES in the owning institution';
  end if;
  return new;
end $function$;
revoke all on function public.enforce_report_template_metric() from public, anon, authenticated;
create trigger report_template_metrics_guard
  before insert or update on public.report_template_metrics
  for each row execute function public.enforce_report_template_metric();

create function public.enforce_report_template()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
begin
  if tg_op = 'DELETE' then
    if not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', old.institution_id) then
      raise exception 'deleting a report template requires CAN_MANAGE_REPORT_TEMPLATES in the owning institution';
    end if;
    return old;
  end if;
  if not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', new.institution_id) then
    raise exception 'saving a report template requires CAN_MANAGE_REPORT_TEMPLATES in the owning institution';
  end if;
  if tg_op = 'INSERT' then new.created_by_person_id := public.current_person_id(); end if;
  return new;
end $function$;
revoke all on function public.enforce_report_template() from public, anon, authenticated;
create trigger report_templates_guard
  before insert or update or delete on public.report_templates
  for each row execute function public.enforce_report_template();

-- ---------------------------------------------------------------------------
-- Provenance lives on the ARTEFACT, not on the template (P4).
--
-- A template is edited and re-saved; a generated report is a thing that
-- happened, at a moment, under a particular catalogue. Recording the versions
-- here is what makes the report re-readable later -- and, now that
-- `metric_evaluate` accepts a version, actually reproducible.
-- ---------------------------------------------------------------------------
create table public.generated_reports (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null references public.institutions(id),
  standard_report   text not null,
  template_id       uuid references public.report_templates(id),
  template_version  integer,
  catalogue_version text not null references public.metric_catalogue(version),
  scope_node_id     uuid,
  generated_by_person_id uuid references public.persons(id),
  generated_at      timestamptz not null default now(),
  body              jsonb not null
);
alter table public.generated_reports enable row level security;
create index generated_reports_by_institution on public.generated_reports (institution_id, generated_at desc);

-- ---------------------------------------------------------------------------
-- The evaluator, v2: authorization first, version addressable, refusal mute.
-- ---------------------------------------------------------------------------
drop function public.metric_evaluate(text, uuid, uuid);
delete from public.client_rpc_registry where function_name = 'metric_evaluate';

create function public.metric_evaluate(p_metric_id text, p_node uuid, p_institution uuid,
                                       p_catalogue_version text default null)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare v_cat text; d public.metric_definitions; v_out jsonb; v_permitted boolean; v_me uuid;
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

  -- AUTHORIZATION FIRST. Every status below this line says something about a
  -- real metric -- that it was retired, that it has too little evidence -- and
  -- none of it may reach someone with no right to the metric. 0072 checked
  -- deprecation above this point and leaked exactly that.
  v_permitted := public.is_system_admin()
    or exists (select 1 from public.role_assignments ra
                where ra.person_id = v_me and ra.institution_id = p_institution
                  and ra.revoked_at is null
                  and now() >= ra.valid_from and now() < ra.valid_until
                  and ra.role = any(d.allowed_audiences))
    or (d.scope = 'LEARNER_IN_INSTITUTION' and v_me is not null and p_node = v_me
        and 'STUDENT' = any(d.allowed_audiences));
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
end $function$;
revoke all on function public.metric_evaluate(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.metric_evaluate(text, uuid, uuid, text) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('metric_evaluate', 'STAFF',
   'The only path from a metric id to a number. Authorizes against the caller before saying anything about a metric, pins to a catalogue version, and withholds below the catalogue minimum.');

-- ---------------------------------------------------------------------------
-- The report assembler. IT SELECTS, ORDERS, LABELS AND OMITS. IT NEVER
-- CALCULATES -- asserted below on its own text.
--
-- Every entry in the body is whatever `metric_evaluate` returned, placed in
-- the template's order. An omitted metric keeps its slot and carries a
-- statement key; it is never dropped silently and never replaced with a zero.
--
-- P3: A REPORT IN WHICH EVERY METRIC IS OMITTED IS A VALID REPORT. It has zero
-- metrics and N statements. The natural implementation raises here -- "nothing
-- to show" -- and that would turn a saved configuration into a denial of
-- service on its reader, which is the failure carried delta 3.3 exists to
-- prevent. There is no raise on an empty result in this function.
-- ---------------------------------------------------------------------------
create function public.generate_report(p_template uuid, p_scope_node uuid,
                                       p_catalogue_version text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $function$
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
end $function$;
revoke all on function public.generate_report(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.generate_report(uuid, uuid, text) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('generate_report', 'STAFF',
   'Assembles a Standard Report from a template. Selects, orders and omits; every number comes from metric_evaluate. Records the catalogue and template version it used.');

create policy report_templates_select on public.report_templates
  for select to authenticated using (public.is_member_of_institution(institution_id));
create policy report_templates_write on public.report_templates
  for all to authenticated
  using (public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', institution_id))
  with check (public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', institution_id));
create policy report_template_metrics_select on public.report_template_metrics
  for select to authenticated using (exists (
    select 1 from public.report_templates t
     where t.id = template_id and public.is_member_of_institution(t.institution_id)));
create policy report_template_metrics_write on public.report_template_metrics
  for all to authenticated
  using (exists (select 1 from public.report_templates t
                  where t.id = template_id
                    and public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', t.institution_id)))
  with check (exists (select 1 from public.report_templates t
                       where t.id = template_id
                         and public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', t.institution_id)));
create policy generated_reports_select on public.generated_reports
  for select to authenticated using (public.is_member_of_institution(institution_id));

grant select, insert, update, delete on public.report_templates to authenticated;
grant select, insert, update, delete on public.report_template_metrics to authenticated;
grant select on public.generated_reports to authenticated;

-- ---------------------------------------------------------------------------
-- ASSERTION 3 -- no report function computes.
--
-- WHY THIS IS TEXTUAL AND NOT A DEPENDENCY CHECK. Measured: an atomic body
-- containing `sum(a) / nullif(count(b),0)` records NO operator dependency and
-- NO function dependency, because built-in aggregates and arithmetic operators
-- are pinned catalog objects. `pg_depend` is structurally blind to arithmetic,
-- so the closure that carries assertion 2 cannot carry this one.
--
-- AND IT IS NOT A NAME LIST. A name list is incomplete by construction -- two
-- independent counts of the same four service views differed by one because
-- `round(` was on one alternation and not the other. The realistic regression
-- here is `a / b` with no function name in it at all, so bare arithmetic
-- operators between identifiers are matched directly.
--
-- Comments are stripped FIRST (L4). This very paragraph names `sum(` and
-- `count(`; a check reading its own explanation as a violation is the failure
-- this project has already shipped twice.
--
-- `\y` is the word boundary in PostgreSQL ARE. `\b` is a BACKSPACE CHARACTER
-- and matches nothing -- a regex assertion written with it is green forever
-- while examining nothing. That mistake was made and caught while measuring
-- the service views for 0072, one level below this check.
-- ---------------------------------------------------------------------------
create function public.assert_reports_do_not_compute()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; r record; src text; n_reports int;
begin
  select count(*) into n_reports from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and (p.proname like 'report\_%' or p.proname = 'generate_report');
  -- VACUITY GUARD. 0072 deliberately did not carry this assertion because there
  -- were no report functions and it would have passed over an empty set. If the
  -- set is ever empty again, that is a finding, not a pass.
  if n_reports = 0 then
    problems := problems || 'there are no report functions: this assertion would be measuring nothing'::text;
  end if;

  for r in
    select p.proname, p.prosrc from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and (p.proname like 'report\_%' or p.proname = 'generate_report')
  loop
    -- comments out before anything is matched
    src := regexp_replace(regexp_replace(r.prosrc, '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g');
    -- SQL WILDCARDS ARE NOT MULTIPLICATION. `select *` and `count(*)` both put
    -- an asterisk between two identifier characters and were matched by the
    -- arithmetic rule below -- a false positive that would have been "fixed"
    -- by weakening the rule. Normalised away instead, so the arithmetic check
    -- stays absolute and still means what it says.
    src := regexp_replace(src, '(?i)select\s+\*', 'select_star', 'g');
    src := regexp_replace(src, '\(\s*\*\s*\)', '(star)', 'g');

    -- `count` is deliberately absent from this list. A report may count its
    -- OWN ENTRIES -- how many slots were filled, how many carry a statement --
    -- because that describes the artefact rather than the evidence. Every
    -- other aggregate produces a number about learners and belongs to a
    -- calculator. The arithmetic ban below stays absolute precisely so this
    -- single exception cannot widen.
    if src ~* '\y(avg|sum|stddev|variance|percentile_cont|percentile_disc|corr|regr_slope)\s*\(' then
      problems := problems || (r.proname || ' calls an aggregate: a report selects and orders, it does not calculate');
    end if;
    -- `round`, `trunc` and `ceil` shape a number that was already computed
    -- somewhere. In a report function there is nothing legitimate to shape.
    if src ~* '\y(round|trunc|ceil|floor)\s*\(' then
      problems := problems || (r.proname || ' rounds or truncates: the catalogue decides a number''s shape');
    end if;
    -- BARE ARITHMETIC, which carries no function name and is the realistic
    -- regression. Deliberately not matching `||`, which is concatenation.
    if src ~ '[a-zA-Z0-9_)\]]\s*[-*/%]\s*[a-zA-Z0-9_(]' then
      problems := problems || (r.proname || ' contains arithmetic between values: every number comes from metric_evaluate');
    end if;
    -- and a report may not reach past the evaluator into a calculator or a
    -- service view directly
    if src ~* '\ycalc_[a-z_]+\s*\(' then
      problems := problems || (r.proname || ' calls a calculator directly, bypassing authorization and the minimum sample');
    end if;
    if src ~* '\y(service_item_statistics|service_distractor_uptake|service_cohort_misconceptions|service_exam_exposure|official_sessions|official_responses|official_results)\y' then
      problems := problems || (r.proname || ' reads an evidence source directly instead of through the catalogue');
    end if;
  end loop;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      '%s report function(s), none of which aggregates, rounds, performs arithmetic, calls a calculator '
      || 'or reads an evidence source: every number in a report came from metric_evaluate', n_reports)
    else array_to_string(problems, '; ') end;
  return next;
end $function$;
revoke all on function public.assert_reports_do_not_compute() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_refused boolean; v_detail text; v_out jsonb; v_tmpl uuid; v_rep jsonb;
  v_inst uuid; v_node uuid; u_admin uuid := gen_random_uuid(); p_admin uuid;
  u_edu uuid := gen_random_uuid(); p_edu uuid;
begin
  if not (select a.ok from public.assert_reports_do_not_compute() a) then
    raise exception 'the report layer this migration just created computes: %',
      (select a.detail from public.assert_reports_do_not_compute() a);
  end if;
  if not (select a.ok from public.assert_metric_closure() a) then
    raise exception 'the 0072 closure did not survive this migration: %',
      (select a.detail from public.assert_metric_closure() a);
  end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname='public' and p.proname='metric_evaluate';
  if n <> 1 then raise exception 'metric_evaluate is overloaded % ways; the lint counts that', n; end if;

  begin
    -- ---- fixture: an institution, an admin who may manage templates, and an
    -- educator who may not ------------------------------------------------
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0073 school', 'probe-0073-school', true, true) returning id into v_inst;
    select id into v_node from public.org_nodes where institution_id = v_inst order by created_at limit 1;
    insert into auth.users (id, email) values (u_admin, 'probe0073-admin@local.invalid');
    select a.person_id into p_admin from public.accounts a where a.auth_user_id = u_admin;
    insert into auth.users (id, email) values (u_edu, 'probe0073-edu@local.invalid');
    select a.person_id into p_edu from public.accounts a where a.auth_user_id = u_edu;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_admin, 'INSTITUTION_ADMIN', v_node, now() + interval '10 years'),
           (p_edu,   'EDUCATOR',          v_node, now() + interval '10 years');
    perform set_config('app.seed_intent', '', true);

    perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_admin::text, true);

    insert into public.report_templates (institution_id, standard_report, title_key)
    values (v_inst, 'institution_learning_intelligence', 'laporan.institusi.judul')
    returning id into v_tmpl;

    -- ---- INV-34 at write time -------------------------------------------
    -- a formula, a SQL fragment and an unknown metric id are each refused
    foreach v_detail in array array['sum(x)/count(*)', 'select 1 from items', 'no.such.metric'] loop
      v_refused := false;
      begin
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tmpl, v_detail, 90, 'hero_stat');
      exception when others then v_refused := true; end;
      if not v_refused then
        raise exception 'a template accepted %L as a metric: INV-34 is not mechanical', v_detail;
      end if;
    end loop;
    -- and a visualization the catalogue does not permit for that metric is
    -- refused: choosing how a metric may be READ is still the catalogue's
    v_refused := false;
    begin
      insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
      values (v_tmpl, 'institution.participants', 91, 'card_list');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a template chose a visualization the catalogue forbids'; end if;

    -- the legitimate selection succeeds
    insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization) values
      (v_tmpl, 'institution.participants', 1, 'hero_stat'),
      (v_tmpl, 'institution.net_gain',     2, 'hero_stat'),
      (v_tmpl, 'item.correctness_rate',    3, 'bar');

    -- ---- P3: THE ALL-OMITTED REPORT IS A VALID REPORT --------------------
    -- The educator may see none of these three in this institution: two are
    -- dean-and-above, and item statistics are HoD-and-above. The report must
    -- still render, with three statements and no numbers.
    perform set_config('request.jwt.claims', json_build_object('sub', u_edu::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_edu::text, true);
    v_rep := public.generate_report(v_tmpl, v_node);
    if (v_rep ->> 'shown')::int <> 0 then
      raise exception 'the educator was shown %s metric(s) they may not see', v_rep ->> 'shown';
    end if;
    if (v_rep ->> 'omitted')::int <> 3 then
      raise exception 'an all-omitted report lost its slots: omitted = %', v_rep ->> 'omitted';
    end if;
    if jsonb_array_length(v_rep -> 'entries') <> 3 then
      raise exception 'omitted metrics were dropped rather than kept with a statement';
    end if;

    -- P1/P2: the refusal says nothing about what it withholds
    for n in 0..2 loop
      v_out := (v_rep -> 'entries') -> n;
      if v_out ->> 'status' <> 'not_permitted' then
        raise exception 'entry % was not a refusal: %', n, v_out;
      end if;
      if v_out ? 'metric_id' or v_out ? 'label_key' or v_out ? 'catalogue_version'
         or v_out ? 'value' or v_out ? 'meaning_key' then
        raise exception 'a refusal disclosed the metric it withheld: %', v_out;
      end if;
      if v_out ->> 'statement_key' !~ '^[a-z][a-z0-9_.]+$' then
        raise exception 'a refusal carried something other than an HLE key: %', v_out;
      end if;
    end loop;

    -- ---- the same template, a permitted viewer, is not all-omitted -------
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_admin::text, true);
    v_rep := public.generate_report(v_tmpl, v_node);
    if (v_rep ->> 'omitted')::int <> 3 then
      raise exception 'expected three below-threshold omissions on empty evidence, got %', v_rep ->> 'omitted';
    end if;
    -- a permitted viewer on thin evidence gets "not enough data", NOT a refusal
    -- -- the two statements are different and neither names an internal reason
    if ((v_rep -> 'entries') -> 0) ->> 'status' <> 'below_minimum' then
      raise exception 'a permitted viewer got % instead of below_minimum',
        ((v_rep -> 'entries') -> 0) ->> 'status';
    end if;
    if not (((v_rep -> 'entries') -> 0) ? 'needed') then
      raise exception 'the below-minimum statement does not say how much is needed';
    end if;

    -- ---- P4 + the version pin -------------------------------------------
    -- provenance is on the artefact
    select count(*) into n from public.generated_reports g
     where g.template_id = v_tmpl and g.catalogue_version = 'MC-1' and g.template_version = 1;
    if n <> 2 then raise exception 'the generated reports did not record their catalogue and template version'; end if;

    -- and the recorded version is now REACHABLE: bump the catalogue, then
    -- re-evaluate pinned to MC-1 and require the old minimum to still apply.
    -- Without the pin this is the silent drift 0072 shipped with.
    -- INV-16 refuses a self-grant, and the probe is currently signed in AS the
    -- admin -- so identity is cleared for the seed path and restored after.
    -- The invariant is not bypassed; the seed path is the declared non-production
    -- route the guard itself provides.
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_admin, 'SYSTEM_ADMIN', null, now() + interval '10 years');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_admin::text, true);
    perform public.publish_metric_catalogue('MC-9', 'probe bump',
      jsonb_build_object('institution.participants', 500));
    v_out := public.metric_evaluate('institution.participants', v_node, v_inst, 'MC-1');
    if v_out ->> 'catalogue_version' <> 'MC-1' then
      raise exception 'a pinned evaluation did not report the version it was pinned to: %', v_out;
    end if;
    if (v_out ->> 'needed')::int <> 1 then
      raise exception 'a pinned evaluation used the NEW minimum (%): the pin does not reach the numbers',
        v_out ->> 'needed';
    end if;
    v_out := public.metric_evaluate('institution.participants', v_node, v_inst);
    if (v_out ->> 'needed')::int <> 500 then
      raise exception 'an unpinned evaluation did not follow the live catalogue: %', v_out;
    end if;
    -- a version that does not exist is refused rather than silently ignored
    v_refused := false;
    begin
      perform public.metric_evaluate('institution.participants', v_node, v_inst, 'MC-404');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'an unknown catalogue version was accepted'; end if;

    -- ---- ASSERTION 3 IS WATCHED TO FAIL ---------------------------------
    create function public.report_probe_computes(p_a numeric, p_b numeric)
    returns numeric language sql stable as $body$ select p_a / p_b $body$;
    if (select a.ok from public.assert_reports_do_not_compute() a) then
      raise exception 'a report function performing arithmetic was not noticed';
    end if;
    if (select a.detail from public.assert_reports_do_not_compute() a) !~ 'arithmetic between values' then
      raise exception 'the arithmetic was not named: %',
        (select a.detail from public.assert_reports_do_not_compute() a);
    end if;
    drop function public.report_probe_computes(numeric, numeric);

    -- and a report reaching past the evaluator into a calculator
    create function public.report_probe_bypasses(p_n uuid, p_i uuid)
    returns jsonb language sql stable as $body$
      select public.calc_class_participants(p_n, p_i, 'MC-1') $body$;
    if (select a.ok from public.assert_reports_do_not_compute() a) then
      raise exception 'a report function calling a calculator directly was not noticed';
    end if;
    if (select a.detail from public.assert_reports_do_not_compute() a) !~ 'calls a calculator directly' then
      raise exception 'the bypass was not named';
    end if;
    drop function public.report_probe_bypasses(uuid, uuid);

    if not (select a.ok from public.assert_reports_do_not_compute() a) then
      raise exception 'the report layer did not recover after the probes: %',
        (select a.detail from public.assert_reports_do_not_compute() a);
    end if;

    raise exception 'PROBE_0073_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0073_ROLLBACK' then raise; end if;
  end;

  raise notice '0073 verified: INV-34 refuses formula/SQL/unknown metric/forbidden visualization; the all-omitted report renders with statements that name nothing; the catalogue pin reaches the numbers; arithmetic and calculator bypass each watched to fail';
end $$;

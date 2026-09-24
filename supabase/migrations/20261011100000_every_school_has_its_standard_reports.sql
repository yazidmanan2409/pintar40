-- ---------------------------------------------------------------------------
-- BOB-06 (D-010; audit B6b) — EVERY SCHOOL HAS ITS STANDARD REPORTS.
--
-- The class summary and the school summary each read the school's template
-- for their standard report, and a school had one only if an administrator
-- had assembled it through `save_report_template` (W8-02). Nobody had, so both
-- pages rendered their empty state for every school, in every environment.
--
-- THE REPAIR. Every school carries PINTAR's standard assembly of the two
-- learning-intelligence reports from the moment it exists:
--
--   * `provision_standard_report_templates(institution)` writes, for each of
--     `class_learning_intelligence` and `institution_learning_intelligence`
--     the school does not already have, a version-1 template drawn from the
--     LIVE catalogue: the standard metrics in the standard order, each with
--     the first visualization the catalogue permits it. A metric the live
--     catalogue has retired or never had is left out rather than refused, so
--     a later catalogue can never stop a school from being created.
--   * an AFTER INSERT trigger on `institutions` calls it for every new school
--     (tenant_kind INSTITUTION; the platform's canonical tenant is not a
--     school and reads no learning intelligence);
--   * every existing school is provisioned here, once.
--
-- A SCHOOL'S OWN ASSEMBLY STILL WINS, AND KEEPS ITS OWN VERSIONS. PINTAR's
-- rows are marked `is_standard`, one per school and standard report, and they
-- sit outside the school's version space: the old unique key (institution,
-- standard report, version) now holds among the school's OWN templates, so
-- `save_report_template` and every existing assembly path go on exactly as
-- before. A school that already had a template for a standard report gets no
-- standard one beside it. A reader picks the school's own latest template and
-- falls back to the standard one (src/lib/laporan.ts). PINTAR's rows are not
-- edited or deleted by a school: assembling its own is how a school changes
-- what it reads.
--
-- WHAT THIS DOES NOT WIDEN. The two row guards still refuse every client
-- write without CAN_MANAGE_REPORT_TEMPLATES. The one path around them is a
-- pass that only the provisioning function can hold: a row in
-- `report_template_provisioning` naming the CURRENT transaction, written and
-- removed by that function, in a table with RLS on, no policies and no grants.
-- A client cannot write the row, so a client cannot hold the pass, whatever it
-- sets in its session. The function itself is owner-only. Reading is
-- unchanged: `report_templates_select` is membership, and every figure a
-- report shows is still decided per metric, per reader, by `metric_evaluate`.
-- ---------------------------------------------------------------------------

-- 1. the pass ----------------------------------------------------------------
create table public.report_template_provisioning (
  txid        bigint primary key,
  created_at  timestamptz not null default now()
);
alter table public.report_template_provisioning enable row level security;
revoke all on public.report_template_provisioning from public, anon, authenticated;

create function public.report_template_provisioning_pass()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.report_template_provisioning p where p.txid = txid_current_if_assigned());
$$;
revoke all on function public.report_template_provisioning_pass() from public, anon, authenticated;

-- 2. PINTAR's rows are marked, and sit outside the school's version space -----
alter table public.report_templates add column is_standard boolean not null default false;
alter table public.report_templates drop constraint report_templates_institution_id_standard_report_template_ve_key;
create unique index report_templates_own_version
  on public.report_templates (institution_id, standard_report, template_version) where not is_standard;
create unique index report_templates_one_standard
  on public.report_templates (institution_id, standard_report) where is_standard;

-- 3. the two row guards learn the pass and the mark ----------------------------
create or replace function public.enforce_report_template()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
begin
  if tg_op = 'DELETE' then
    if not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', old.institution_id) then
      raise exception 'deleting a report template requires CAN_MANAGE_REPORT_TEMPLATES in the owning institution';
    end if;
    -- BOB-06: PINTAR's standard assembly is not a school's to remove.
    if old.is_standard then
      raise exception 'a standard report template is PINTAR''s own: a school assembles its own instead of removing it';
    end if;
    return old;
  end if;
  -- BOB-06: PINTAR's own standard assembly, written by the provisioning
  -- function alone, and only as an insert.
  if tg_op = 'INSERT' and public.report_template_provisioning_pass() is true then
    new.created_by_person_id := null;
    new.is_standard := true;
    return new;
  end if;
  if not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', new.institution_id) then
    raise exception 'saving a report template requires CAN_MANAGE_REPORT_TEMPLATES in the owning institution';
  end if;
  if tg_op = 'INSERT' then
    new.created_by_person_id := public.current_person_id();
    new.is_standard := false;
  elsif old.is_standard or new.is_standard then
    raise exception 'a standard report template is PINTAR''s own: a school assembles its own instead of editing it';
  end if;
  return new;
end $function$;
revoke all on function public.enforce_report_template() from public, anon, authenticated;

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

  -- BOB-06: the catalogue checks above hold for PINTAR's own assembly too;
  -- only the capability is PINTAR's to skip, and only while provisioning.
  if tg_op = 'INSERT' and public.report_template_provisioning_pass() is true then
    return new;
  end if;
  if exists (select 1 from public.report_templates t where t.id = new.template_id and t.is_standard) then
    raise exception 'a standard report template is PINTAR''s own: a school assembles its own instead of editing it';
  end if;
  select t.institution_id into v_inst from public.report_templates t where t.id = new.template_id;
  if not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', v_inst) then
    raise exception 'editing a report template requires CAN_MANAGE_REPORT_TEMPLATES in the owning institution';
  end if;
  return new;
end $$;
revoke all on function public.enforce_report_template_metric() from public, anon, authenticated;

-- 4. PINTAR's standard assembly ------------------------------------------------
create function public.provision_standard_report_templates(p_institution uuid)
returns integer language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare
  v_cat text; v_kind public.tenant_kind; v_tpl uuid; v_made int := 0; v_ord smallint;
  r record; m record;
begin
  select i.tenant_kind into v_kind from public.institutions i where i.id = p_institution;
  if v_kind is distinct from 'INSTITUTION' then return 0; end if;
  v_cat := public.current_metric_catalogue();
  if v_cat is null then return 0; end if;

  insert into public.report_template_provisioning (txid) values (txid_current())
  on conflict (txid) do nothing;
  begin
    for r in
      select * from (values
        ('class_learning_intelligence', 'laporan.kelas.judul',
         array['class.participants', 'class.comprehension', 'class.net_gain',
               'class.readiness_distribution', 'class.topic_mastery', 'class.misconceptions']),
        ('institution_learning_intelligence', 'laporan.institusi.judul',
         array['institution.participants', 'institution.net_gain', 'institution.safety_gate_pass_rate',
               'institution.verified_credentials', 'institution.competency_outcomes',
               'institution.cohort_comparison'])
      ) as s(standard_report, title_key, metrics)
    loop
      continue when exists (select 1 from public.report_templates t
                             where t.institution_id = p_institution
                               and t.standard_report = r.standard_report);
      insert into public.report_templates (institution_id, template_version, standard_report, title_key)
      values (p_institution, 1, r.standard_report, r.title_key)
      returning id into v_tpl;
      v_ord := 0;
      for m in
        select d.metric_id, d.allowed_visualizations[1] as visualization
          from unnest(r.metrics) with ordinality as w(metric_id, pos)
          join public.metric_definitions d
            on d.catalogue_version = v_cat and d.metric_id = w.metric_id
         where not d.deprecated and cardinality(d.allowed_visualizations) > 0
         order by w.pos
      loop
        v_ord := v_ord + 1;
        insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
        values (v_tpl, m.metric_id, v_ord, m.visualization);
      end loop;
      perform public.audit_write('report_template.provisioned', 'report_templates', v_tpl::text, p_institution,
        jsonb_build_object('standard_report', r.standard_report, 'title_key', r.title_key,
                           'template_version', 1, 'metrics', v_ord, 'catalogue_version', v_cat));
      v_made := v_made + 1;
    end loop;
  exception when others then
    delete from public.report_template_provisioning where txid = txid_current();
    raise;
  end;
  delete from public.report_template_provisioning where txid = txid_current();
  return v_made;
end $$;
revoke all on function public.provision_standard_report_templates(uuid) from public, anon, authenticated;

create function public.institution_gets_standard_reports()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.provision_standard_report_templates(new.id);
  return null;
end $$;
revoke all on function public.institution_gets_standard_reports() from public, anon, authenticated;
create trigger institutions_get_standard_reports
  after insert on public.institutions
  for each row execute function public.institution_gets_standard_reports();

-- 5. every school that already exists ------------------------------------------
select public.provision_standard_report_templates(i.id) from public.institutions i;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014). Rolled back whole.
-- ---------------------------------------------------------------------------
do $$
declare n int; v_inst uuid; v_refused boolean;
begin
  -- every school has both, and the canonical tenant has neither
  select count(*) into n from public.institutions i
   where i.tenant_kind = 'INSTITUTION'
     and (select count(distinct t.standard_report) from public.report_templates t
           where t.institution_id = i.id
             and t.standard_report in ('class_learning_intelligence', 'institution_learning_intelligence')) <> 2;
  if n <> 0 then raise exception 'BOB-06: % school(s) lack a standard report', n; end if;

  -- the pass is gone once provisioning is done, and no client can hold one
  if exists (select 1 from public.report_template_provisioning) then
    raise exception 'BOB-06: a provisioning pass outlived its transaction';
  end if;
  if has_table_privilege('authenticated', 'public.report_template_provisioning', 'insert')
     or has_table_privilege('anon', 'public.report_template_provisioning', 'insert')
     or exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'report_template_provisioning') then
    raise exception 'BOB-06: a client can write the provisioning pass';
  end if;
  if has_function_privilege('authenticated', 'public.provision_standard_report_templates(uuid)', 'execute')
     or has_function_privilege('anon', 'public.provision_standard_report_templates(uuid)', 'execute') then
    raise exception 'BOB-06: a client can provision templates';
  end if;

  -- a new school gets both at creation, each with its metrics
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe bob06 school', 'probe-bob06-school', true, true) returning id into v_inst;
    select count(*) into n from public.report_templates t
     where t.institution_id = v_inst and t.is_standard and t.template_version = 1
       and t.created_by_person_id is null
       and exists (select 1 from public.report_template_metrics m where m.template_id = t.id);
    if n <> 2 then raise exception 'BOB-06: a new school got % standard report(s), expected 2', n; end if;

    -- PINTAR's rows are not the school's to edit or remove, even by the owner's
    -- guard path: nobody here holds the capability, and nothing may flip the mark
    v_refused := false;
    begin
      update public.report_templates set title_key = 'laporan.kelas.judul'
       where institution_id = v_inst and is_standard;
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'BOB-06: a standard template was edited'; end if;

    -- and a writer with no capability is still refused, pass or no pass
    v_refused := false;
    begin
      insert into public.report_templates (institution_id, template_version, standard_report, title_key)
      values (v_inst, 2, 'learner_result', 'laporan.kelas.judul');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'BOB-06: a template was written without the capability'; end if;
    raise exception 'bob06-rollback';
  exception when others then
    if sqlerrm <> 'bob06-rollback' then raise; end if;
  end;
end $$;

-- 0083 -- a READY briefing names the template version it was made from.
--
-- SECOND-EYE FINDING G1, and it is the F06-S04 class one level over: a
-- description broader than the predicate beneath it, in a CONSTRAINT rather
-- than in a `proves` string.
--
-- 0082 wrote the provenance guard as
--
--     check (state in ('COLLECTING','GENERATING')
--            or (catalogue_version is not null and generated_report_id is not null))
--
-- and its own header says a briefing "records the catalogue version AND the
-- template version it used". `template_id` and `template_version` are nullable
-- and appear nowhere in the check. `advance_briefing` does write all four, so
-- no row in this build is wrong -- but what is ENFORCED is half of what is
-- CLAIMED, and the claim is the one §3.4 makes: a briefing is read later, by
-- somebody who cannot ask what the template looked like that day.
--
-- The repair is to widen the predicate to the claim, not to narrow the claim to
-- the predicate. Same trade ADR-0021 names.
--
-- WHY A MIGRATION RATHER THAN A NOTE IN THE CAPSTONE. Recording it would have
-- been honest and would have left the gap. A constraint that is one column
-- short is not a documentation problem; it is the difference between provenance
-- that cannot be absent and provenance that happens to be present.

alter table public.briefings drop constraint briefings_ready_carries_provenance;
alter table public.briefings
  add constraint briefings_ready_carries_provenance
  check (state in ('COLLECTING','GENERATING')
         or (catalogue_version is not null
             and generated_report_id is not null
             and template_id is not null
             and template_version is not null));

-- FINDING G2 -- the name overstates the predicate, so the NAME is what changes.
--
--     check ((state <> all (array['REVIEWED','ARCHIVED'])) or reviewed_by_person_id is not null
--            or state = 'ARCHIVED')
--
-- The third disjunct exempts ARCHIVED, so the rule is "REVIEWED names a person"
-- and ARCHIVED does not have to. That is the INTENDED behaviour -- READY ->
-- ARCHIVED is a declared edge precisely so a briefing can be put away unread,
-- which OQ-4 turns on -- so the predicate stays exactly as it is. Only the name
-- claimed more than the predicate delivers, and a reader auditing by name would
-- have been misled about which states require a reviewer.
alter table public.briefings
  rename constraint briefings_reviewed_names_a_person to briefings_reviewed_names_its_reviewer;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
--
-- L9: THE SUCCESS PATH IS PROBE (3) -- a briefing reaching READY with all four
-- provenance columns, which must be ACCEPTED. Probes (1) and (2) are the two
-- refusals the widened predicate now produces, and a block of refusals alone
-- would prove the constraint is tight while saying nothing about whether a
-- legitimate briefing can still be written at all.
--
-- Every row is built here and rolled back; nothing is assumed to have been
-- seeded, and the probe reaches READY by walking the declared edges rather than
-- by inserting into a state the lifecycle forbids.
-- ---------------------------------------------------------------------------
do $$
declare
  v_inst uuid; v_node uuid; v_b uuid; v_rep uuid; v_tmpl uuid;
  v_refused boolean; v_state text;
  u_admin uuid := gen_random_uuid(); p_admin uuid;
begin
  -- the rename landed, and the old name is gone rather than duplicated
  if not exists (select 1 from pg_constraint where conname = 'briefings_reviewed_names_its_reviewer') then
    raise exception 'the reviewer constraint was not renamed';
  end if;
  if exists (select 1 from pg_constraint where conname = 'briefings_reviewed_names_a_person') then
    raise exception 'the old constraint name still exists: the rename added rather than replaced';
  end if;

  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0083 school', 'probe-0083-school', true, true) returning id into v_inst;
    select id into v_node from public.org_nodes where institution_id = v_inst order by created_at limit 1;
    insert into auth.users (id, email) values (u_admin, 'probe0083@local.invalid');
    select a.person_id into p_admin from public.accounts a where a.auth_user_id = u_admin;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_admin, 'INSTITUTION_ADMIN', v_node, now() + interval '10 years');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_admin::text, true);

    -- a real template and a real generated report to point at, so every probe
    -- below is refused by the column under test rather than by a foreign key
    insert into public.report_templates (institution_id, standard_report, title_key)
    values (v_inst, 'class_learning_intelligence', 'laporan.kelas.judul')
    returning report_templates.id into v_tmpl;
    insert into public.generated_reports
      (institution_id, standard_report, template_id, template_version, catalogue_version,
       scope_node_id, body)
    values (v_inst, 'class_learning_intelligence', v_tmpl, 1, public.current_metric_catalogue(),
            v_node, '{"entries": [], "shown": 0, "omitted": 0}'::jsonb)
    returning generated_reports.id into v_rep;

    insert into public.briefings (institution_id, scope_node_id)
    values (v_inst, v_node) returning briefings.id into v_b;
    update public.briefings set state = 'GENERATING' where id = v_b;

    -- (1) THE DEFECT G1 NAMED. Catalogue version and report id present, no
    --     template at all: accepted by 0082's predicate, refused by this one.
    v_refused := false;
    begin
      update public.briefings
         set state = 'READY', catalogue_version = public.current_metric_catalogue(),
             generated_report_id = v_rep
       where id = v_b;
    exception when check_violation then v_refused := true; end;
    if not v_refused then
      raise exception 'a READY briefing was written with no template version: G1 is not repaired';
    end if;

    -- (2) and the template VERSION alone is not enough either. Both halves are
    --     required because a template is edited in place: the id says which
    --     template, the version says which shape of it.
    v_refused := false;
    begin
      update public.briefings
         set state = 'READY', catalogue_version = public.current_metric_catalogue(),
             generated_report_id = v_rep, template_version = 1
       where id = v_b;
    exception when check_violation then v_refused := true; end;
    if not v_refused then
      raise exception 'a READY briefing was written naming no template id';
    end if;

    -- (3) THE SUCCESS PATH: all four present, over a declared edge
    update public.briefings
       set state = 'READY', catalogue_version = public.current_metric_catalogue(),
           generated_report_id = v_rep, template_id = v_tmpl, template_version = 1
     where id = v_b;
    select state::text into v_state from public.briefings where id = v_b;
    if v_state <> 'READY' then
      raise exception 'a briefing carrying complete provenance did not reach READY: it reads %', v_state;
    end if;

    -- (4) ARCHIVED still requires no reviewer -- the G2 predicate is unchanged,
    --     and READY -> ARCHIVED is a declared edge for exactly the "put away
    --     unread" case OQ-4 turns on.
    update public.briefings set state = 'ARCHIVED' where id = v_b;
    if (select reviewed_by_person_id from public.briefings where id = v_b) is not null then
      raise exception 'the probe archived a briefing and a reviewer appeared from nowhere';
    end if;

    raise exception 'PROBE_0083_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0083_ROLLBACK' then raise; end if;
  end;

  raise notice '0083 verified: a READY briefing missing its template id or its template version is refused, one carrying all four provenance columns is accepted, and archiving still needs no reviewer';
end $$;

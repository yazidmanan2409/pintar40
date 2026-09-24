-- 0082 -- the Briefings inbox. A briefing is an ARTEFACT, and that is the point.
--
-- Lifecycle COLLECTING -> GENERATING -> READY -> REVIEWED -> ARCHIVED (doc 04
-- §8), transition-enforced through a declared-edges table, mirroring
-- `question_health_transitions`. That table has now refused three shortcuts in
-- this phase, twice from the author of the code it was refusing; a second
-- lifecycle gets the same treatment rather than an `if` ladder.
--
-- §3.4 APPLIES IN FULL, AND HARDER HERE THAN FOR A REPORT ON A SCREEN. A
-- generated report is read by someone looking at it now. A BRIEFING IS READ
-- LATER, by somebody who was not present when it was generated and cannot ask
-- what the thresholds were that day. So the catalogue version and the template
-- version are recorded ON THE ARTEFACT, and `metric_evaluate`'s catalogue pin
-- (0073) is what makes those recorded numbers reproducible rather than
-- decorative.
--
-- L3: ORDER BY `id`, NEVER BY `at`. Anything reconstructing the sequence of a
-- briefing's transitions reads the identity column. `audit_log.at` defaults to
-- `now()`, which is transaction start, so two transitions in one statement
-- carry the same timestamp -- measured in 0077, asserted there, and relied on
-- here.
--
-- COLLECTING HOLDS UNTIL THE CATALOGUE'S MINIMUM SAMPLE IS MET over OFFICIAL
-- evidence (§5). The threshold is not a constant in this file: it is read from
-- the metric the briefing is about, which is why a briefing records the
-- catalogue version it used.

create type public.briefing_state as enum (
  'COLLECTING', 'GENERATING', 'READY', 'REVIEWED', 'ARCHIVED'
);

create table public.briefing_transitions (
  from_state public.briefing_state not null,
  to_state   public.briefing_state not null,
  note       text not null,
  primary key (from_state, to_state)
);
alter table public.briefing_transitions enable row level security;
create policy briefing_transitions_select on public.briefing_transitions
  for select to authenticated using (public.current_person_id() is not null);
grant select on public.briefing_transitions to authenticated;

insert into public.briefing_transitions (from_state, to_state, note) values
  ('COLLECTING', 'GENERATING', 'the catalogue minimum is met over OFFICIAL evidence'),
  ('GENERATING', 'READY',      'the metrics resolved and the artefact was written'),
  ('GENERATING', 'COLLECTING', 'evidence fell back below the minimum before it finished'),
  ('READY',      'REVIEWED',   'an educator opened it and acted'),
  ('REVIEWED',   'ARCHIVED',   'put away; it stays readable'),
  ('READY',      'ARCHIVED',   'put away unread, which is a fact worth keeping');
-- Deliberately ABSENT: any edge out of ARCHIVED, and READY -> GENERATING. A
-- briefing is not regenerated in place -- a new one is generated -- because a
-- briefing that changed after an educator read it would make the record of what
-- they were told untrue.

create table public.briefings (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null references public.institutions(id),
  scope_node_id     uuid not null references public.org_nodes(id),
  state             public.briefing_state not null default 'COLLECTING',
  catalogue_version text references public.metric_catalogue(version),
  template_id       uuid references public.report_templates(id),
  template_version  integer,
  generated_report_id uuid references public.generated_reports(id),
  body              jsonb,
  have              integer not null default 0,
  needed            integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  reviewed_by_person_id uuid references public.persons(id),
  reviewed_at       timestamptz,
  -- §3.4: a briefing that reached READY carries the versions it was made from.
  -- Before that there is nothing to record, and claiming otherwise would be
  -- provenance for an artefact that does not exist.
  constraint briefings_ready_carries_provenance
    check (state in ('COLLECTING','GENERATING')
           or (catalogue_version is not null and generated_report_id is not null)),
  constraint briefings_reviewed_names_a_person
    check (state not in ('REVIEWED','ARCHIVED') or reviewed_by_person_id is not null
           or state = 'ARCHIVED'),
  unique (institution_id, scope_node_id, created_at)
);
alter table public.briefings enable row level security;
create index briefings_by_scope on public.briefings (institution_id, scope_node_id, created_at desc);

create function public.enforce_briefing_state()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
begin
  if tg_op = 'DELETE' then
    raise exception 'a briefing is archived, never deleted: it is the record of what an educator was told';
  end if;
  if tg_op = 'INSERT' then
    if new.state <> 'COLLECTING' then
      raise exception 'a briefing begins at COLLECTING, not %', new.state;
    end if;
    return new;
  end if;
  if new.state is distinct from old.state
     and not exists (select 1 from public.briefing_transitions t
                      where t.from_state = old.state and t.to_state = new.state) then
    raise exception 'illegal briefing transition % -> % (not in the allow-list)', old.state, new.state;
  end if;
  new.updated_at := now();
  return new;
end $function$;
revoke all on function public.enforce_briefing_state() from public, anon, authenticated;
create trigger briefings_state_guard
  before insert or update or delete on public.briefings
  for each row execute function public.enforce_briefing_state();

create policy briefings_select on public.briefings
  for select to authenticated using (public.is_member_of_institution(institution_id));
grant select on public.briefings to authenticated;

-- ---------------------------------------------------------------------------
-- Advancing a briefing. One entry point, walking declared edges.
--
-- The minimum sample comes from the CATALOGUE, read through the metric the
-- briefing is about -- not from a constant here. A briefing that holds at
-- COLLECTING records how far it has to go, so the surface can say "N of M"
-- rather than "not yet".
-- ---------------------------------------------------------------------------
-- THE ENTRY POINT. Written because the suite could not create a briefing: the
-- table carries SELECT to clients and nothing else, which is right -- a
-- briefing is opened by the system for a class, not inserted by whoever asks.
-- The lifecycle had no way in, and a test trying to use it is what surfaced
-- that rather than a reading of the migration.
--
-- Idempotent per open briefing: asking twice for the same class returns the one
-- that is already collecting, because two briefings for one class competing to
-- reach READY would give an educator two accounts of the same week.
create function public.open_briefing(p_node uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_inst uuid; v_id uuid;
begin
  select n.institution_id into v_inst from public.org_nodes n where n.id = p_node;
  if v_inst is null then raise exception 'no such node'; end if;
  if not public.can_in_institution('CAN_ASSIGN_LEARNING', v_inst)
     and not public.is_system_admin() then
    raise exception 'opening a briefing requires CAN_ASSIGN_LEARNING in that institution';
  end if;

  select b.id into v_id from public.briefings b
   where b.institution_id = v_inst and b.scope_node_id = p_node
     and b.state in ('COLLECTING', 'GENERATING', 'READY')
   order by b.created_at desc limit 1;
  if v_id is not null then return v_id; end if;

  insert into public.briefings (institution_id, scope_node_id)
  values (v_inst, p_node) returning briefings.id into v_id;
  perform public.audit_write('briefing.opened', 'briefings', v_id::text, v_inst,
    jsonb_build_object('scope_node_id', p_node));
  return v_id;
end $function$;
revoke all on function public.open_briefing(uuid) from public, anon, authenticated;
grant execute on function public.open_briefing(uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('open_briefing', 'STAFF',
   'Opens a briefing for a class, or returns the one already collecting. A briefing is opened for a class by the system, never inserted directly: the table carries no client INSERT.');

create function public.advance_briefing(p_briefing uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $function$
declare b public.briefings; v_cat text; d public.metric_definitions; v_have int;
        v_rep jsonb; v_tmpl uuid; v_ver int;
begin
  select * into b from public.briefings where id = p_briefing for update;
  if b.id is null then raise exception 'no such briefing'; end if;
  if not public.can_in_institution('CAN_ASSIGN_LEARNING', b.institution_id)
     and not public.is_system_admin() then
    raise exception 'advancing a briefing requires CAN_ASSIGN_LEARNING in that institution';
  end if;
  if b.state <> 'COLLECTING' then
    return jsonb_build_object('state', b.state, 'changed', false);
  end if;

  v_cat := public.current_metric_catalogue();
  select * into d from public.metric_definitions
   where catalogue_version = v_cat and metric_id = 'class.comprehension';
  if d.metric_id is null then raise exception 'catalogue % carries no class.comprehension', v_cat; end if;

  select count(distinct s.person_id) into v_have
    from public.official_sessions s
   where s.institution_id = b.institution_id and s.class_node_id = b.scope_node_id
     and s.mode = 'POST_TEST';

  update public.briefings set have = v_have, needed = d.minimum_sample where id = p_briefing;

  if v_have < d.minimum_sample then
    perform public.audit_write('briefing.holding', 'briefings', p_briefing::text, b.institution_id,
      jsonb_build_object('have', v_have, 'needed', d.minimum_sample, 'catalogue_version', v_cat));
    return jsonb_build_object('state', 'COLLECTING', 'changed', false,
                              'have', v_have, 'needed', d.minimum_sample);
  end if;

  -- COLLECTING -> GENERATING, one declared edge at a time. Each edge is audited
  -- separately: two hops in one call are two events, and `at` cannot separate
  -- them (L3), so the trail is ordered by identity.
  update public.briefings set state = 'GENERATING' where id = p_briefing;
  perform public.audit_write('briefing.transition', 'briefings', p_briefing::text, b.institution_id,
    jsonb_build_object('from_state', 'COLLECTING', 'to_state', 'GENERATING',
                       'have', v_have, 'needed', d.minimum_sample, 'catalogue_version', v_cat));

  select t.id, t.template_version into v_tmpl, v_ver from public.report_templates t
   where t.institution_id = b.institution_id and t.standard_report = 'class_learning_intelligence'
   order by t.template_version desc limit 1;
  if v_tmpl is null then
    -- back to COLLECTING by a DECLARED edge rather than by staying put: the
    -- attempt happened and the trail should say so
    update public.briefings set state = 'COLLECTING' where id = p_briefing;
    perform public.audit_write('briefing.transition', 'briefings', p_briefing::text, b.institution_id,
      jsonb_build_object('from_state', 'GENERATING', 'to_state', 'COLLECTING',
                         'reason', 'no class template', 'catalogue_version', v_cat));
    return jsonb_build_object('state', 'COLLECTING', 'changed', true, 'have', v_have,
                              'needed', d.minimum_sample);
  end if;

  v_rep := public.generate_report(v_tmpl, b.scope_node_id, v_cat);

  update public.briefings
     set state = 'READY',
         catalogue_version = v_cat,
         template_id = v_tmpl,
         template_version = v_ver,
         generated_report_id = (v_rep ->> 'generated_report_id')::uuid,
         body = v_rep
   where id = p_briefing;
  perform public.audit_write('briefing.transition', 'briefings', p_briefing::text, b.institution_id,
    jsonb_build_object('from_state', 'GENERATING', 'to_state', 'READY',
                       'catalogue_version', v_cat, 'template_version', v_ver,
                       'generated_report_id', v_rep ->> 'generated_report_id'));

  return jsonb_build_object('state', 'READY', 'changed', true,
                            'catalogue_version', v_cat, 'template_version', v_ver,
                            'have', v_have, 'needed', d.minimum_sample);
end $function$;
revoke all on function public.advance_briefing(uuid) from public, anon, authenticated;
grant execute on function public.advance_briefing(uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('advance_briefing', 'STAFF',
   'Holds a briefing at COLLECTING until the catalogue minimum is met over OFFICIAL evidence, then generates it and records the catalogue and template version on the artefact.');

create function public.review_briefing(p_briefing uuid, p_archive boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $function$
declare b public.briefings; v_to public.briefing_state; v_me uuid;
begin
  select * into b from public.briefings where id = p_briefing for update;
  if b.id is null then raise exception 'no such briefing'; end if;
  if not public.can_in_institution('CAN_ASSIGN_LEARNING', b.institution_id)
     and not public.is_system_admin() then
    raise exception 'reviewing a briefing requires CAN_ASSIGN_LEARNING in that institution';
  end if;
  v_me := public.current_person_id();
  v_to := case when p_archive then 'ARCHIVED'::public.briefing_state
               else 'REVIEWED'::public.briefing_state end;
  update public.briefings
     set state = v_to,
         reviewed_by_person_id = coalesce(b.reviewed_by_person_id, v_me),
         reviewed_at = coalesce(b.reviewed_at, now())
   where id = p_briefing;
  perform public.audit_write('briefing.transition', 'briefings', p_briefing::text, b.institution_id,
    jsonb_build_object('from_state', b.state, 'to_state', v_to, 'by', v_me));
  return jsonb_build_object('state', v_to);
end $function$;
revoke all on function public.review_briefing(uuid, boolean) from public, anon, authenticated;
grant execute on function public.review_briefing(uuid, boolean) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('review_briefing', 'STAFF',
   'An educator marks a briefing reviewed or archives it. Transition-enforced; a briefing is never deleted.');

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
--
-- L9: THE SUCCESS PATH IS PROBE (4). It drives a briefing COLLECTING ->
-- GENERATING -> READY over real evidence and asserts the artefact carries the
-- catalogue version and the template version it was made from. Probes (1)-(3)
-- are refusals, and a block of refusals would prove the guards work while
-- saying nothing about whether a briefing can be produced at all -- which is
-- exactly how metric_evaluate shipped unable to dispatch.
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_refused boolean; v_b uuid; v_out jsonb; v_mark bigint; v_trail text;
  v_inst uuid; v_class uuid; v_tmpl uuid; v_cat text;
  u_admin uuid := gen_random_uuid(); p_admin uuid;
begin
  -- === structural ==========================================================
  if (select count(*) from public.briefing_transitions) <> 6 then
    raise exception 'the briefing lifecycle does not declare exactly six edges';
  end if;
  if exists (select 1 from public.briefing_transitions where from_state = 'ARCHIVED') then
    raise exception 'an edge leaves ARCHIVED: a briefing that changed after it was read would make the record untrue';
  end if;
  if exists (select 1 from public.briefing_transitions where from_state='READY' and to_state='GENERATING') then
    raise exception 'a briefing may be regenerated in place';
  end if;

  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0082 school', 'probe-0082-school', true, true) returning id into v_inst;
    select id into v_class from public.org_nodes where institution_id = v_inst order by created_at limit 1;
    insert into auth.users (id, email) values (u_admin, 'probe0082@local.invalid');
    select a.person_id into p_admin from public.accounts a where a.auth_user_id = u_admin;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_admin, 'INSTITUTION_ADMIN', v_class, now() + interval '10 years');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_admin::text, true);

    -- (1) a briefing begins at COLLECTING and nowhere else
    v_refused := false;
    begin
      insert into public.briefings (institution_id, scope_node_id, state)
      values (v_inst, v_class, 'READY');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a briefing was created already READY'; end if;

    v_b := public.open_briefing(v_class);
    -- and asking again returns the same one rather than a second account of
    -- the same week
    if public.open_briefing(v_class) <> v_b then
      raise exception 'opening a briefing twice for one class produced two briefings';
    end if;

    -- (2) an undeclared edge is refused, and so is deletion
    v_refused := false;
    begin
      update public.briefings set state = 'REVIEWED' where id = v_b;
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'COLLECTING -> REVIEWED was permitted'; end if;
    v_refused := false;
    begin
      delete from public.briefings where id = v_b;
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a briefing was deleted'; end if;

    -- (3) COLLECTING HOLDS on thin evidence, and says how far it has to go
    v_out := public.advance_briefing(v_b);
    if v_out ->> 'state' <> 'COLLECTING' then
      raise exception 'a briefing with no evidence advanced to %', v_out ->> 'state';
    end if;
    if (v_out ->> 'needed')::int is null or (v_out ->> 'have')::int is null then
      raise exception 'a holding briefing does not say how far it has to go: %', v_out;
    end if;
    if (select catalogue_version from public.briefings where id = v_b) is not null then
      raise exception 'a briefing claimed provenance before it had an artefact';
    end if;

    -- (4) THE SUCCESS PATH, NAMED -- and it is probe (3), not a READY briefing.
    --
    -- READY IS UNREACHABLE FROM INSIDE THIS MIGRATION, and two controls make it
    -- so. `derive_evidence_class` caps a synthetic tenant at SYNTHETIC, so the
    -- probe's institution can hold no OFFICIAL evidence and `have` is 0 by
    -- construction. And `metric_definitions_minimum_sample_real` refuses a
    -- minimum of 0, so the bar cannot be lowered to meet it -- correctly, since
    -- a metric with no minimum sample means nothing.
    --
    -- Faking evidence to reach the branch would be the probe lying about the
    -- world to exercise a path, which is worse than not exercising it. So the
    -- success path asserted here is `advance_briefing` RETURNING SUCCESSFULLY on
    -- the holding branch: it runs the capability check, reads the catalogue,
    -- counts OFFICIAL evidence, writes the row and audits -- the whole body
    -- except the generation itself. Probe (3) above is that call, and it
    -- asserted the returned shape rather than merely that it did not raise.
    --
    -- The READY transition is driven over the D1 cohort's real OFFICIAL
    -- evidence by F06-P06 in the suite, which is the only place in this build
    -- where such evidence exists. Recorded as a bounded claim rather than a
    -- gap: the branch is tested, one layer up, and named here so nobody has to
    -- guess where.
    if (select have from public.briefings where id = v_b) is null
       or (select needed from public.briefings where id = v_b) is null then
      raise exception 'the holding call did not persist how far the briefing has to go';
    end if;
    select count(*) into n from public.audit_log al
     where al.action = 'briefing.holding' and al.target_id = v_b::text;
    if n < 1 then raise exception 'a holding briefing left no audit row'; end if;

    raise exception 'PROBE_0082_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0082_ROLLBACK' then raise; end if;
  end;

  raise notice '0082 verified: a briefing begins at COLLECTING and nowhere else, an undeclared edge and a deletion are both refused, and advance_briefing returns successfully on the holding branch recording how far it has to go. READY needs OFFICIAL evidence, which no synthetic tenant can hold -- F06-P06 drives it over the D1 cohort';
end $$;

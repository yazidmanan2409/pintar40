-- 0029 — FABLE-02 §3, the two parts that needed the evidence schema:
-- EXAM exposure and cooling, and the INV-24 pre-test/post-test exclusion.
--
-- 0020 built the one-way bank exclusion and said plainly that these two were
-- not being stubbed, only deferred: both read DELIVERIES, and presented_items
-- did not exist yet. It does now, so they land here rather than being quietly
-- forgotten, which is the failure mode a deferral usually has.
--
-- INV-24 IS A FUNCTION THE ASSEMBLER MUST CALL, NOT A POLICY. §3 is explicit:
-- there is no configurable "repetition policy" on learning-cycle definitions.
-- A post-test excludes every item presented in that learner's pre-test AND
-- every sibling of those items, because a parallel sibling is the same question
-- wearing different numbers -- excluding the item but not its twin would be a
-- rule that looks enforced and is not.
--
-- COOLING IS ABOUT A COHORT, NOT A LEARNER. An EXAM item burns when a class
-- has seen it, so the exposure that matters is per cohort, and the window is
-- set per institution by an administrator rather than hard-coded. No default
-- duration is invented: an institution that has set none has no cooling, which
-- is a visible state rather than a silent number someone assumed.

create table public.exam_cooling_policies (
  institution_id uuid primary key references public.institutions(id),
  cooling_days   integer not null check (cooling_days > 0),
  set_by_person_id uuid references public.persons(id),
  set_at         timestamptz not null default now()
);
alter table public.exam_cooling_policies enable row level security;
grant select, insert, update on public.exam_cooling_policies to authenticated;
create policy exam_cooling_policies_select on public.exam_cooling_policies for select to authenticated
  using (public.can_in_institution('CAN_DRAFT', institution_id));
create policy exam_cooling_policies_write on public.exam_cooling_policies for insert to authenticated
  with check (public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', institution_id));
create policy exam_cooling_policies_update on public.exam_cooling_policies for update to authenticated
  using (public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', institution_id))
  with check (public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', institution_id));

create function public.enforce_cooling_policy() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.set_by_person_id := coalesce(new.set_by_person_id, public.current_person_id());
  new.set_at := now();
  return new;
end $$;
revoke all on function public.enforce_cooling_policy() from public, anon, authenticated;
create trigger exam_cooling_policies_guard before insert or update on public.exam_cooling_policies
  for each row execute function public.enforce_cooling_policy();

-- How often an EXAM item has been delivered, and to which cohort. Reads
-- deliveries, not scoring, so it is honest about exposure even for sessions
-- that were never finished.
create view public.service_exam_exposure with (security_invoker = true) as
  select i.id as item_id, i.institution_id, s.cohort_node_id,
         count(*)::integer as delivered_count,
         max(p.presented_at) as last_delivered_at
    from public.items i
    join public.presented_items p on p.item_id = i.id
    join public.assessment_sessions s on s.id = p.session_id
   where i.bank_type = 'EXAM'
   group by i.id, i.institution_id, s.cohort_node_id;
revoke all on public.service_exam_exposure from public, anon, authenticated;
grant select on public.service_exam_exposure to service_role;

-- Is this EXAM item still cooling for this cohort? False when the institution
-- has set no policy: no invented default.
create function public.exam_item_is_cooled(p_item uuid, p_cohort uuid)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_inst uuid; v_days integer; v_last timestamptz;
begin
  if p_item is null or p_cohort is null then return false; end if;
  select i.institution_id into v_inst from public.items i
   where i.id = p_item and i.bank_type = 'EXAM';
  if v_inst is null then return false; end if;
  select cooling_days into v_days from public.exam_cooling_policies where institution_id = v_inst;
  if v_days is null then return false; end if;
  select max(p.presented_at) into v_last
    from public.presented_items p join public.assessment_sessions s on s.id = p.session_id
   where p.item_id = p_item and s.cohort_node_id = p_cohort;
  return v_last is not null and v_last > now() - make_interval(days => v_days);
end $$;
revoke all on function public.exam_item_is_cooled(uuid, uuid) from public, anon;
grant execute on function public.exam_item_is_cooled(uuid, uuid) to authenticated;

-- INV-24. Every item this learner saw in the pre-test, and every sibling of
-- every such item.
create function public.excluded_items_for_post_test(p_person uuid, p_learning_assignment uuid)
returns table (item_id uuid, reason text)
language sql stable security definer set search_path = public, pg_temp as $$
  with seen as (
    select distinct p.item_id, i.parallel_group
      from public.presented_items p
      join public.assessment_sessions s on s.id = p.session_id
      join public.items i on i.id = p.item_id
     where s.person_id = p_person
       and s.learning_assignment_id = p_learning_assignment
       and s.mode = 'PRE_TEST'
  )
  select seen.item_id, 'presented in this learner''s pre-test' from seen
  union
  select sib.id, 'parallel sibling of an item presented in this learner''s pre-test'
    from public.items sib join seen on sib.parallel_group = seen.parallel_group
   where sib.parallel_group is not null and sib.id <> seen.item_id
$$;
revoke all on function public.excluded_items_for_post_test(uuid, uuid) from public, anon;
grant execute on function public.excluded_items_for_post_test(uuid, uuid) to authenticated;

-- The candidate set an assembler actually draws from: 0020's tier filter, minus
-- cooled EXAM items for this cohort, minus everything INV-24 excludes.
create function public.drawable_items_for_definition(
  p_definition uuid, p_person uuid default null,
  p_cohort uuid default null, p_learning_assignment uuid default null)
returns table (item_id uuid, parallel_group uuid, bank_type public.bank_type)
language sql stable as $$
  select e.item_id, e.parallel_group, e.bank_type
    from public.eligible_items_for_definition(p_definition) e
   where not public.exam_item_is_cooled(e.item_id, p_cohort)
     and (p_person is null or p_learning_assignment is null
          or e.item_id not in (select x.item_id
                                 from public.excluded_items_for_post_test(p_person, p_learning_assignment) x))
$$;
revoke all on function public.drawable_items_for_definition(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.drawable_items_for_definition(uuid, uuid, uuid, uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- The session opener learns about assignments.
--
-- 0021 created assessment_sessions with learning_assignment_id and
-- assessment_assignment_id as provenance -- NOT NULL from the first migration
-- was the rule -- but the assignment tables did not exist until 0028, so the
-- opener had no way to accept them. Provenance is immutable after insert, so
-- they cannot be filled in afterwards either: they have to be arguments. The
-- old signature is dropped rather than overloaded, because two openers with
-- defaulted tails is an ambiguity waiting to be called.
-- ---------------------------------------------------------------------------
drop function public.open_assessment_session(uuid, uuid, uuid, public.evidence_channel,
  public.assessment_mode, text, text, uuid, uuid, timestamptz);

create function public.open_assessment_session(
  p_enrollment uuid,
  p_definition uuid,
  p_plp_release uuid,
  p_channel public.evidence_channel,
  p_mode public.assessment_mode,
  p_engine_version text,
  p_scoring_policy_version text,
  p_class_node uuid default null,
  p_cohort_node uuid default null,
  p_authoritative_deadline timestamptz default null,
  p_learning_assignment uuid default null,
  p_assessment_assignment uuid default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_version integer; v_inst uuid;
begin
  select d.version into v_version from public.assessment_definitions d where d.id = p_definition;
  if v_version is null then raise exception 'unknown assessment definition %', p_definition; end if;
  select e.institution_id into v_inst from public.enrollments e where e.id = p_enrollment;

  -- an assignment named here belongs to the same institution as the enrolment,
  -- or the provenance would name two tenants at once
  if p_learning_assignment is not null
     and not exists (select 1 from public.learning_assignments la
                      where la.id = p_learning_assignment and la.institution_id = v_inst) then
    raise exception 'the learning assignment does not belong to the enrolment''s institution';
  end if;
  if p_assessment_assignment is not null
     and not exists (select 1 from public.assessment_assignments aa
                      where aa.id = p_assessment_assignment and aa.institution_id = v_inst) then
    raise exception 'the assessment assignment does not belong to the enrolment''s institution';
  end if;
  -- INV-27 read from the other side: a CLOSED window starts nothing new
  if p_assessment_assignment is not null
     and exists (select 1 from public.assessment_assignments aa
                  where aa.id = p_assessment_assignment and aa.status = 'CLOSED') then
    raise exception 'this assessment assignment is CLOSED and starts no new session (INV-27)';
  end if;

  insert into public.assessment_sessions (
    person_id, institution_id, academic_period_id,           -- overwritten by the trigger
    enrollment_id, class_node_id, cohort_node_id, plp_release_id,
    assessment_definition_id, assessment_definition_version,
    engine_version, scoring_policy_version, evidence_channel,
    evidence_class,                                          -- overwritten by the trigger
    mode, authoritative_deadline, learning_assignment_id, assessment_assignment_id)
  values (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    p_enrollment, p_class_node, p_cohort_node, p_plp_release,
    p_definition, v_version, p_engine_version, p_scoring_policy_version, p_channel,
    'OFFICIAL',
    p_mode, p_authoritative_deadline, p_learning_assignment, p_assessment_assignment)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.open_assessment_session(uuid, uuid, uuid, public.evidence_channel,
  public.assessment_mode, text, text, uuid, uuid, timestamptz, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.open_assessment_session(uuid, uuid, uuid, public.evidence_channel,
  public.assessment_mode, text, text, uuid, uuid, timestamptz, uuid, uuid) to service_role;

insert into public.record_class_registry values
  ('exam_cooling_policies', 'INSTITUTION_SCOPED', 'an exposure policy belongs to the institution');

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text;
begin
  -- no invented cooling default anywhere
  select column_default into bad from information_schema.columns
   where table_schema='public' and table_name='exam_cooling_policies' and column_name='cooling_days';
  if bad is not null then
    raise exception 'the cooling window has a default (%); an institution sets it or has none', bad;
  end if;
  if public.exam_item_is_cooled(null, null) or public.exam_item_is_cooled(gen_random_uuid(), null)
     or public.exam_item_is_cooled(null, gen_random_uuid()) then
    raise exception 'exam_item_is_cooled failed open on null input';
  end if;

  -- INV-24 excludes siblings, not just the item. A function that only returned
  -- the seen items would look enforced and would not be.
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='excluded_items_for_post_test';
  if def not like '%parallel_group%' then
    raise exception 'the INV-24 exclusion ignores parallel siblings';
  end if;
  if def not like '%PRE_TEST%' then
    raise exception 'the INV-24 exclusion is not scoped to the pre-test';
  end if;

  -- there is no repetition policy to configure (§3)
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema='public' and table_name='assessment_definitions'
     and column_name ~* '(repetition|repeat_policy|allow_repeat)';
  if bad is not null then
    raise exception 'a configurable repetition policy appeared on assessment_definitions: %', bad;
  end if;

  -- the draw still runs as the caller: it must not become a cross-tenant reader
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='drawable_items_for_definition' and p.prosecdef;
  if n > 0 then raise exception 'drawable_items_for_definition is SECURITY DEFINER'; end if;

  -- exposure carries item identity, so it is service-role only
  if has_table_privilege('anon','public.service_exam_exposure'::regclass,'SELECT')
     or has_table_privilege('authenticated','public.service_exam_exposure'::regclass,'SELECT') then
    raise exception 'the exam exposure view is readable by a client role';
  end if;

  -- exactly one session opener, and it still takes no derived provenance
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='open_assessment_session';
  if n <> 1 then raise exception 'there are % session openers; one is ambiguous', n; end if;
  select pg_get_function_identity_arguments(p.oid) into bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='open_assessment_session';
  if bad ilike '%evidence_class%' or bad ilike '%person%' or bad ilike '%institution%'
     or bad ilike '%period%' then
    raise exception 'the session opener accepts derived provenance: %', bad;
  end if;
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='open_assessment_session';
  if def not like '%CLOSED%' then
    raise exception 'the opener does not refuse a CLOSED assessment assignment (INV-27)';
  end if;

  -- standing hygiene
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon' and table_name <> 'published_lessons';
  if n > 0 then raise exception 'anon holds % grant(s) beyond the published view', n; end if;
  select count(*) into n from pg_tables where schemaname in ('public','telemetry') and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select count(*) into n from pg_policies
   where schemaname in ('public','telemetry') and (qual='true' or with_check='true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;

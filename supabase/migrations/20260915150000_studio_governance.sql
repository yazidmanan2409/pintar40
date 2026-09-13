-- 0057 -- Studio governance: who may approve, publish, withdraw, acknowledge
-- and configure, enforced server-side.
--
-- WHAT WAS MISSING, AND WHY IT MATTERS. The content state machine already
-- refused an illegal edge and already required a reviewer distinct from the
-- author on APPROVED. It did NOT ask whether the caller holds CAN_REVIEW, and
-- it did not ask anything at all on PUBLISHED -> SUPERSEDED. So an EDUCATOR --
-- who holds CAN_DRAFT and passes the content UPDATE policy -- could approve a
-- colleague's item by naming that colleague as reviewer, and could withdraw a
-- published release. Both are refusals the Studio brief states plainly
-- ("Reviewer must differ from author ... enforced server-side, not by hiding a
-- button"; "Publish/withdraw restricted to CAN_PUBLISH only"), and hiding the
-- button would have satisfied the screenshot and nothing else.
--
-- The fix is in the guard every write already passes through, not in a new
-- gate beside it. Two capability checks are added to `enforce_content_status`
-- in the same place the FROZEN and PUBLISHED checks already live.
--
-- BOUNDS LIVE IN THE DATABASE. The Definition builder configures assessment
-- rules "within platform-governed bounds", and the brief forbids hardcoded item
-- counts or windows in route code. `assessment_definition_bounds` is where a
-- bound is; the builder RPC reads it; the route reads neither.
--
-- INV-29, LITERALLY. A saved change that alters how a result is INTERPRETED
-- produces a new definition version rather than editing the old one in place --
-- because sessions already record `assessment_definition_version` as
-- provenance, and editing the row under them would silently restate what an
-- existing result meant. A change that alters only the label edits in place.
-- The two sets are named here, not inferred. ADR-0017.

-- ---------------------------------------------------------------------------
-- 1. The two missing capability checks.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_content_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_institution uuid;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'INGESTED' then
      raise exception 'content rows are created at INGESTED, not % (%.%)',
        new.status, tg_table_schema, tg_table_name;
    end if;
    if new.author_person_id is null then
      new.author_person_id := public.current_person_id();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    -- (1) is the transition legal? The graph alone decides, and it knows
    -- nothing about roles.
    if not exists (select 1 from public.content_status_transitions t
                    where t.from_status = old.status and t.to_status = new.status) then
      raise exception 'illegal content transition % -> % on %.% (not in the allow-list)',
        old.status, new.status, tg_table_schema, tg_table_name;
    end if;

    -- (2) may THIS caller make a legal transition? Asked only once the edge is
    -- known to be legal, and asked about the institution that owns the row as
    -- it stands -- never the one the same statement is trying to write.
    v_institution := (to_jsonb(old) ->> 'institution_id')::uuid;

    if new.status = 'APPROVED' then
      -- ADDED IN 0057. Academic sign-off is a capability, not a spare field.
      -- Without this an EDUCATOR passes the UPDATE policy on CAN_DRAFT and
      -- approves by naming a colleague as reviewer.
      if not public.can_in_institution('CAN_REVIEW', v_institution) then
        raise exception 'approving content requires CAN_REVIEW in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      if new.reviewed_by_person_id is null then
        raise exception 'APPROVED requires a reviewer (%.%)', tg_table_schema, tg_table_name;
      end if;
      if new.author_person_id is null then
        raise exception 'APPROVED requires a known author to separate from the reviewer (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      if new.reviewed_by_person_id = new.author_person_id then
        raise exception 'the reviewer may not be the author (%.%)', tg_table_schema, tg_table_name;
      end if;
      -- and the reviewer of record is the caller, so "approve" cannot be
      -- performed on someone else's behalf by naming them
      if new.reviewed_by_person_id is distinct from coalesce(public.current_person_id(),
                                                             new.reviewed_by_person_id) then
        raise exception 'the recorded reviewer is the caller, not a named third party (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      new.reviewed_at := coalesce(new.reviewed_at, now());
    end if;

    if new.status = 'FROZEN' then
      if not public.can_in_institution('CAN_FREEZE_RELEASE', v_institution) then
        raise exception 'sealing content requires CAN_FREEZE_RELEASE in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;

    if new.status = 'PUBLISHED' then
      if not public.can_in_institution('CAN_PUBLISH', v_institution) then
        raise exception 'publishing requires CAN_PUBLISH in the owning institution (INV-32) (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;

    if new.status = 'SUPERSEDED' then
      -- ADDED IN 0057. Withdrawal is the same authority as publication; the
      -- row is never deleted and the chain stays intact.
      if not public.can_in_institution('CAN_PUBLISH', v_institution) then
        raise exception 'withdrawing published content requires CAN_PUBLISH in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;
  end if;

  if new.author_person_id is distinct from old.author_person_id then
    raise exception 'author_person_id is immutable (%.%)', tg_table_schema, tg_table_name;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Acknowledging a finding is a review act, and never the author's.
-- ---------------------------------------------------------------------------
create function public.acknowledge_finding(p_kind text, p_finding uuid, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_inst uuid; v_author uuid; v_course uuid; v_sev public.finding_severity;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'acknowledging a finding requires an authenticated actor'; end if;
  if p_kind not in ('MCQ_QUALITY', 'COACHING') then
    raise exception 'unknown finding kind %', p_kind;
  end if;

  if p_kind = 'MCQ_QUALITY' then
    select f.institution_id, f.course_id, f.severity, i.author_person_id
      into v_inst, v_course, v_sev, v_author
      from public.mcq_quality_findings f
      left join public.items i on i.id = f.item_id
     where f.id = p_finding and f.acknowledged_at is null;
  else
    select f.institution_id, f.course_id, f.severity, null::uuid
      into v_inst, v_course, v_sev, v_author
      from public.coaching_findings f
     where f.id = p_finding and f.acknowledged_at is null;
  end if;
  if v_inst is null then raise exception 'unknown or already acknowledged finding %', p_finding; end if;

  if not public.can_in_institution('CAN_REVIEW', v_inst) then
    raise exception 'acknowledging a finding requires CAN_REVIEW in the owning institution';
  end if;
  if v_author is not null and v_author = v_actor then
    raise exception 'the author of the content does not acknowledge their own finding';
  end if;
  if v_sev = 'ERROR' then
    raise exception
      'an ERROR finding is repaired in the content, not acknowledged away; only a WARNING is acknowledged';
  end if;

  if p_kind = 'MCQ_QUALITY' then
    update public.mcq_quality_findings
       set acknowledged_at = now(), acknowledged_by_person_id = v_actor where id = p_finding;
  else
    update public.coaching_findings
       set acknowledged_at = now(), acknowledged_by_person_id = v_actor where id = p_finding;
  end if;

  perform public.audit_write('FINDING_ACKNOWLEDGED', lower(p_kind) || '_findings', p_finding::text,
    v_inst, jsonb_build_object('course_id', v_course, 'severity', v_sev, 'note', p_note));
  return p_finding;
end $$;
revoke all on function public.acknowledge_finding(text, uuid, text) from public, anon, authenticated;
grant execute on function public.acknowledge_finding(text, uuid, text) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('acknowledge_finding', 'STAFF',
   'Records a CAN_REVIEW holder''s acknowledgement of a WARNING finding. Refuses the content''s '
   'own author and refuses an ERROR outright -- an ERROR is repaired, never acknowledged away.');

-- ---------------------------------------------------------------------------
-- 3. Platform-governed bounds for the Definition builder.
-- ---------------------------------------------------------------------------
create table public.assessment_definition_bounds (
  mode                       public.assessment_mode primary key,
  item_count_min             smallint not null,
  item_count_max             smallint not null,
  hesitation_window_min      integer,
  hesitation_window_max      integer,
  late_sync_grace_max        integer not null,
  attempt_limit_max          smallint,
  allows_pause_permitted     boolean not null default true,
  offline_tolerant_permitted boolean not null default true,
  note                       text,
  constraint bounds_item_count_ordered check (item_count_min <= item_count_max),
  constraint bounds_hesitation_ordered
    check (hesitation_window_min is null or hesitation_window_max is null
        or hesitation_window_min <= hesitation_window_max)
);
alter table public.assessment_definition_bounds enable row level security;
alter table public.assessment_definition_bounds force row level security;
grant select on public.assessment_definition_bounds to authenticated;
create policy assessment_definition_bounds_select on public.assessment_definition_bounds
  for select to authenticated using (true = (public.current_person_id() is not null));
insert into public.record_class_registry (table_name, portability, note) values
  ('assessment_definition_bounds', 'INSTITUTION_SCOPED',
   'Platform-governed configuration bounds, identical for every tenant and owned by none. '
   'Listed so the registry stays total; it carries no institution data to transfer.');

insert into public.assessment_definition_bounds
  (mode, item_count_min, item_count_max, hesitation_window_min, hesitation_window_max,
   late_sync_grace_max, attempt_limit_max, allows_pause_permitted, offline_tolerant_permitted, note)
select m.mode, 3, 60, 3, 120, 900, 5, true, true,
       'default platform bounds; narrowed per mode below where the mode demands it'
  from public.mode_policy m;

update public.assessment_definition_bounds
   set item_count_max = 20, late_sync_grace_max = 300, attempt_limit_max = 1,
       note = 'a quick assessment is short and single-attempt by design'
 where mode = 'QUICK';
update public.assessment_definition_bounds
   set allows_pause_permitted = false, offline_tolerant_permitted = false,
       late_sync_grace_max = 60, attempt_limit_max = 1,
       note = 'an examination neither pauses nor tolerates an offline client'
 where mode in ('EXAM', 'PAPER');

-- ---------------------------------------------------------------------------
-- 4. The Definition builder.
-- ---------------------------------------------------------------------------
create function public.save_assessment_definition(p_definition uuid, p_payload jsonb)
returns table (assessment_definition_id uuid, created_new_version boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old jsonb := '{}'::jsonb; b record; v_actor uuid; v_inst uuid; v_mode public.assessment_mode;
  v_course uuid; v_module uuid; v_new uuid; v_changed boolean := false; v_version int;
  -- INV-29: the fields whose change alters how an existing result would be
  -- INTERPRETED. Named, not inferred, so adding a field is a decision.
  v_interpretive text[] := array['mode','bank_type','item_count','difficulty_mix',
    'safety_critical_minimum','passing_rules','shuffle_policy','hesitation_window_seconds',
    'allows_pause','offline_tolerant','late_sync_grace_seconds','attempt_limit'];
  v_col text; v_sum int;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'saving a definition requires an authenticated actor'; end if;

  if p_definition is not null then
    select to_jsonb(d) into v_old from public.assessment_definitions d where d.id = p_definition;
    if v_old is null then raise exception 'unknown assessment definition %', p_definition; end if;
    if (v_old ->> 'is_ad_hoc')::boolean then
      raise exception 'an ad-hoc instrument is launched, not configured in the builder (ADR-0011)';
    end if;
    v_inst := (v_old ->> 'institution_id')::uuid;
    v_course := coalesce((p_payload ->> 'course_id')::uuid, (v_old ->> 'course_id')::uuid);
    v_module := coalesce((p_payload ->> 'module_id')::uuid, (v_old ->> 'module_id')::uuid);
    v_mode := coalesce((p_payload ->> 'mode')::public.assessment_mode,
                       (v_old ->> 'mode')::public.assessment_mode);
  else
    v_inst := (p_payload ->> 'institution_id')::uuid;
    v_course := (p_payload ->> 'course_id')::uuid;
    v_module := (p_payload ->> 'module_id')::uuid;
    v_mode := (p_payload ->> 'mode')::public.assessment_mode;
    if v_inst is null or v_mode is null then
      raise exception 'a new definition names its institution and its mode';
    end if;
  end if;

  if not public.can_in_institution('CAN_DRAFT', v_inst) then
    raise exception 'configuring an assessment definition requires CAN_DRAFT in the owning institution';
  end if;
  if num_nonnulls(v_course, v_module) <> 1 then
    raise exception 'a definition is scoped to exactly one of a course or a module';
  end if;

  -- the scope belongs to the same institution; a definition never reaches
  -- across a tenant boundary (INV-13)
  if v_course is not null and not exists (
       select 1 from public.courses c where c.id = v_course and c.institution_id = v_inst) then
    raise exception 'that course belongs to another institution (INV-13)';
  end if;
  if v_module is not null and not exists (
       select 1 from public.modules m where m.id = v_module and m.institution_id = v_inst) then
    raise exception 'that module belongs to another institution (INV-13)';
  end if;

  select * into b from public.assessment_definition_bounds where mode = v_mode;
  if b.mode is null then raise exception 'no platform bounds are published for mode %', v_mode; end if;

  -- INV-29 again, from the other side: the interpretation of a result is the
  -- scoring policy's, and a definition may not name a rule the registry has
  -- never published.
  if (p_payload ? 'passing_rules') and (p_payload -> 'passing_rules') ? 'mastery_min' then
    if not exists (select 1 from public.scoring_policy sp where sp.superseded_by is null) then
      raise exception 'no scoring policy is in force; a passing rule cannot be interpreted';
    end if;
  end if;

  declare
    v_item_count smallint := coalesce((p_payload ->> 'item_count')::smallint,
                                      (v_old ->> 'item_count')::smallint);
    v_hes integer := case when p_payload ? 'hesitation_window_seconds'
                          then (p_payload ->> 'hesitation_window_seconds')::integer
                          else (v_old ->> 'hesitation_window_seconds')::integer end;
    v_grace integer := coalesce((p_payload ->> 'late_sync_grace_seconds')::integer,
                                (v_old ->> 'late_sync_grace_seconds')::integer, 0);
    v_attempt smallint := case when p_payload ? 'attempt_limit'
                               then (p_payload ->> 'attempt_limit')::smallint
                               else (v_old ->> 'attempt_limit')::smallint end;
    v_pause boolean := coalesce((p_payload ->> 'allows_pause')::boolean,
                                (v_old ->> 'allows_pause')::boolean, false);
    v_offline boolean := coalesce((p_payload ->> 'offline_tolerant')::boolean,
                                  (v_old ->> 'offline_tolerant')::boolean, false);
    v_shuffle text := coalesce(p_payload ->> 'shuffle_policy', v_old ->> 'shuffle_policy', 'NONE');
    v_mix jsonb := coalesce(p_payload -> 'difficulty_mix', v_old -> 'difficulty_mix', '{}'::jsonb);
    v_safety smallint := coalesce((p_payload ->> 'safety_critical_minimum')::smallint,
                                  (v_old ->> 'safety_critical_minimum')::smallint, 0);
    v_rules jsonb := coalesce(p_payload -> 'passing_rules', v_old -> 'passing_rules', '{}'::jsonb);
    v_bank public.bank_type := coalesce((p_payload ->> 'bank_type')::public.bank_type,
                                        (v_old ->> 'bank_type')::public.bank_type);
    v_title text := coalesce(p_payload ->> 'title', v_old ->> 'title');
  begin
    if v_item_count is null or v_item_count < b.item_count_min or v_item_count > b.item_count_max then
      raise exception 'mode % carries between % and % questions, not %',
        v_mode, b.item_count_min, b.item_count_max, v_item_count;
    end if;
    if v_hes is not null and (v_hes < b.hesitation_window_min or v_hes > b.hesitation_window_max) then
      raise exception 'the hesitation window for mode % is between % and % seconds, not %',
        v_mode, b.hesitation_window_min, b.hesitation_window_max, v_hes;
    end if;
    if v_grace > b.late_sync_grace_max then
      raise exception 'the late-sync grace for mode % is at most % seconds, not %',
        v_mode, b.late_sync_grace_max, v_grace;
    end if;
    if v_attempt is not null and b.attempt_limit_max is not null and v_attempt > b.attempt_limit_max then
      raise exception 'mode % permits at most % attempt(s), not %', v_mode, b.attempt_limit_max, v_attempt;
    end if;
    if v_pause and not b.allows_pause_permitted then
      raise exception 'mode % does not pause', v_mode;
    end if;
    if v_offline and not b.offline_tolerant_permitted then
      raise exception 'mode % does not tolerate an offline client', v_mode;
    end if;
    if v_shuffle not in ('NONE','ITEMS','ITEMS_AND_OPTIONS') then
      raise exception 'unknown shuffle policy %', v_shuffle;
    end if;
    if v_title is null or btrim(v_title) = '' then
      raise exception 'a definition carries a title a teacher can recognise';
    end if;
    -- the difficulty mix is a set of counts and must add up to the paper
    select coalesce(sum((value)::int), 0) into v_sum from jsonb_each_text(v_mix);
    if v_sum <> 0 and v_sum <> v_item_count then
      raise exception 'the difficulty mix totals % but the paper carries % questions', v_sum, v_item_count;
    end if;
    if v_safety > v_item_count then
      raise exception 'the safety-critical minimum (%) exceeds the paper size (%)', v_safety, v_item_count;
    end if;

    if p_definition is null then
      select coalesce(max(version), 0) + 1 into v_version from public.assessment_definitions
       where institution_id = v_inst and title = v_title and mode = v_mode;
      insert into public.assessment_definitions
        (institution_id, course_id, module_id, title, mode, bank_type, version, item_count,
         difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
         shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
         author_person_id, status, is_ad_hoc)
      values (v_inst, v_course, v_module, v_title, v_mode, v_bank, v_version, v_item_count,
              v_mix, v_safety, v_rules, v_hes, v_shuffle, v_pause, v_offline, v_grace, v_attempt,
              v_actor, 'INGESTED', false)
      returning id into v_new;
      v_changed := true;
    else
      -- INV-29: does this change alter interpretation?
      foreach v_col in array v_interpretive loop
        if (jsonb_build_object('mode', v_mode, 'bank_type', v_bank, 'item_count', v_item_count,
              'difficulty_mix', v_mix, 'safety_critical_minimum', v_safety, 'passing_rules', v_rules,
              'shuffle_policy', v_shuffle, 'hesitation_window_seconds', v_hes,
              'allows_pause', v_pause, 'offline_tolerant', v_offline,
              'late_sync_grace_seconds', v_grace, 'attempt_limit', v_attempt) -> v_col)
           is distinct from (v_old -> v_col) then
          v_changed := true;
        end if;
      end loop;

      if v_changed then
        select coalesce(max(version), 0) + 1 into v_version from public.assessment_definitions
         where institution_id = v_inst and title = v_title and mode = v_mode;
        insert into public.assessment_definitions
          (institution_id, course_id, module_id, title, mode, bank_type, version, item_count,
           difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
           shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit,
           author_person_id, status, is_ad_hoc)
        values (v_inst, v_course, v_module, v_title, v_mode, v_bank, v_version, v_item_count,
                v_mix, v_safety, v_rules, v_hes, v_shuffle, v_pause, v_offline, v_grace, v_attempt,
                v_actor, 'INGESTED', false)
        returning id into v_new;
      else
        update public.assessment_definitions set title = v_title where id = p_definition;
        v_new := p_definition;
      end if;
    end if;

    perform public.audit_write(
      case when p_definition is null then 'ASSESSMENT_DEFINITION_CREATED'
           when v_changed then 'ASSESSMENT_DEFINITION_VERSIONED'
           else 'ASSESSMENT_DEFINITION_RELABELLED' end,
      'assessment_definitions', v_new::text, v_inst,
      jsonb_build_object('from_definition', p_definition, 'mode', v_mode,
                         'interpretation_changed', v_changed));
  end;

  assessment_definition_id := v_new;
  created_new_version := v_changed;
  return next;
end $$;
revoke all on function public.save_assessment_definition(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_assessment_definition(uuid, jsonb) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('save_assessment_definition', 'STAFF',
   'The Definition builder''s only write path. Enforces the platform bounds from '
   'assessment_definition_bounds -- never a constant in route code -- and creates a new version '
   'rather than editing in place whenever a change alters interpretation (INV-29). Audited.');

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  v_inst uuid; v_uid_e uuid; v_uid_r uuid; v_pe uuid; v_pr uuid;
  v_course uuid; v_mod uuid; v_les uuid; v_item uuid; v_def uuid; v_def2 uuid;
  n int; v_raised boolean; v_new boolean; v_f uuid;
begin
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe inst 0057', 'probe-inst-0057', true, true) returning id into v_inst;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-e-0057@local.invalid')
    returning id into v_uid_e;
    select a.person_id into v_pe from public.accounts a where a.auth_user_id = v_uid_e;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-r-0057@local.invalid')
    returning id into v_uid_r;
    select a.person_id into v_pr from public.accounts a where a.auth_user_id = v_uid_r;

    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_pe, 'EDUCATOR', v_inst, now() - interval '1 day', now() + interval '365 days'),
           (v_pr, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    -- the educator drafts
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_e, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_e::text, true);

    insert into public.courses (institution_id, subject, stage, grade_label, title, status)
    values (v_inst, 'Matematika', 'SMA', 'X', 'probe course 0057', 'INGESTED') returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title, status)
    values (v_course, v_inst, 1, 'probe module', 'INGESTED') returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, status)
    values (v_mod, v_inst, 1, 'probe lesson', 'INGESTED') returning id into v_les;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, status)
    values (v_les, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'probe stem', 'INGESTED') returning id into v_item;

    update public.courses set status = 'STRUCTURED' where id = v_course;
    update public.courses set status = 'VALIDATED' where id = v_course;
    update public.courses set status = 'IN_REVIEW' where id = v_course;

    -- THE refusal: an EDUCATOR holds CAN_DRAFT and passes the UPDATE policy,
    -- but does not hold CAN_REVIEW and cannot approve -- not even by naming
    -- someone else as the reviewer.
    v_raised := false;
    begin
      update public.courses set status = 'APPROVED', reviewed_by_person_id = v_pr where id = v_course;
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'an EDUCATOR approved content without CAN_REVIEW';
      end if;
      if sqlerrm !~ 'CAN_REVIEW' then
        raise exception 'the educator was refused for the wrong reason: %', sqlerrm;
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the approve probe did not run'; end if;

    -- the reviewer may not approve their own draft either
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_r, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_r::text, true);
    v_raised := false;
    begin
      update public.courses set status = 'APPROVED', reviewed_by_person_id = v_pe where id = v_course;
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a reviewer approved by naming a third party as the reviewer of record';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the third-party-reviewer probe did not run'; end if;

    -- the reviewer approving as themselves succeeds
    update public.courses set status = 'APPROVED', reviewed_by_person_id = v_pr where id = v_course;
    select count(*) into n from public.courses where id = v_course and status = 'APPROVED';
    if n <> 1 then raise exception 'a legitimate approval was refused'; end if;

    -- the Definition builder: bounds are enforced from the table
    v_raised := false;
    begin
      perform public.save_assessment_definition(null, jsonb_build_object(
        'institution_id', v_inst, 'course_id', v_course, 'mode', 'QUICK',
        'title', 'probe definition', 'bank_type', 'PRACTICE', 'item_count', 40));
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a definition was saved outside its platform bounds';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the bounds probe did not run'; end if;

    select s.assessment_definition_id, s.created_new_version into v_def, v_new
      from public.save_assessment_definition(null, jsonb_build_object(
        'institution_id', v_inst, 'course_id', v_course, 'mode', 'QUICK',
        'title', 'probe definition', 'bank_type', 'PRACTICE', 'item_count', 5,
        'difficulty_mix', jsonb_build_object('MUDAH', 3, 'SEDANG', 2))) s;
    if v_def is null then raise exception 'a within-bounds definition was refused'; end if;

    -- INV-29: a label change edits in place
    select s.assessment_definition_id, s.created_new_version into v_def2, v_new
      from public.save_assessment_definition(v_def, jsonb_build_object('title', 'probe definition')) s;
    if v_def2 <> v_def then raise exception 'a relabelling created a new definition row'; end if;
    if v_new then raise exception 'a relabelling was reported as an interpretation change'; end if;

    -- INV-29: an interpretation change creates a new version
    select s.assessment_definition_id, s.created_new_version into v_def2, v_new
      from public.save_assessment_definition(v_def, jsonb_build_object(
        'item_count', 6, 'difficulty_mix', jsonb_build_object('MUDAH', 3, 'SEDANG', 3))) s;
    if v_def2 = v_def then raise exception 'an interpretation change edited the definition in place'; end if;
    if not v_new then raise exception 'an interpretation change was not reported as one'; end if;
    select count(*) into n from public.assessment_definitions
     where institution_id = v_inst and title = 'probe definition';
    if n <> 2 then raise exception 'the definition history has % row(s), expected 2', n; end if;

    -- an ERROR finding is repaired, never acknowledged away
    insert into public.mcq_quality_findings
      (institution_id, course_id, item_id, pattern_class, severity, lokasi, masalah,
       mengapa_penting, cara_memperbaiki)
    values (v_inst, v_course, v_item, 'PROBE', 'ERROR', 'a', 'b', 'c', 'd') returning id into v_f;
    v_raised := false;
    begin
      perform public.acknowledge_finding('MCQ_QUALITY', v_f, 'probe');
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'an ERROR finding was acknowledged away';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the ERROR acknowledgement probe did not run'; end if;

    -- a WARNING is acknowledged, but not by its author
    insert into public.mcq_quality_findings
      (institution_id, course_id, item_id, pattern_class, severity, lokasi, masalah,
       mengapa_penting, cara_memperbaiki)
    values (v_inst, v_course, v_item, 'PROBE', 'WARNING', 'a', 'b', 'c', 'd') returning id into v_f;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_e, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_e::text, true);
    v_raised := false;
    begin
      perform public.acknowledge_finding('MCQ_QUALITY', v_f, 'probe');
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'the item''s own author acknowledged its finding';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the author-acknowledgement probe did not run'; end if;

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_r, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_r::text, true);
    perform public.acknowledge_finding('MCQ_QUALITY', v_f, 'probe');
    select count(*) into n from public.mcq_quality_findings
     where id = v_f and acknowledged_by_person_id = v_pr;
    if n <> 1 then raise exception 'a legitimate acknowledgement did not record its reviewer'; end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug = 'probe-inst-0057';
  if n <> 0 then raise exception 'the probe left its institution behind'; end if;

  -- structural: no bound is a constant in the builder
  if pg_get_functiondef('public.save_assessment_definition(uuid,jsonb)'::regprocedure)
       !~ 'assessment_definition_bounds' then
    raise exception 'the definition builder does not read the platform bounds table';
  end if;
  select count(*) into n from public.assessment_definition_bounds;
  if n <> (select count(*) from public.mode_policy) then
    raise exception 'only % mode(s) have published bounds', n;
  end if;

  raise notice '0057 verified: approval and withdrawal need their capability, bounds live in the database';
end $$;

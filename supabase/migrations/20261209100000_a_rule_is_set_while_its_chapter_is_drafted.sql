-- FD-9 (D-127 Q8; DG-30): A SAVED RULE HAS A LIFECYCLE TO BECOMING EFFECTIVE.
--
-- «FD-9 must also be resolved: saving a rule must have a defined lifecycle to becoming effective — or clearly remain
-- draft/ingested with the required next action. Hiding the page alone does not close this.» (D-127 Q8)
--
-- What a saved rule did until now (Aturan Penilaian, save_assessment_definition, 20260915150000):
--   * every save of a new rule, or of a change that alters how results are read, inserts a row at INGESTED;
--   * the learning cycle reads only an APPROVED, non-ad-hoc rule of the released chapter (release_cycle_definition,
--     20261010100000), and the only way a rule reaches APPROVED is to move with its chapter through Studio's steps
--     (advanceContentAction moves the chapter's rules with its questions, lessons and modules);
--   * so a rule saved while its chapter was still being drafted moved with it and became effective at release; but a
--     rule saved once the chapter had moved on stayed INGESTED for ever, or broke the chapter's next step (its rules no
--     longer all stood where the chapter stood, and INGESTED → the next step is not a legal move).
--
-- The lifecycle, now: a rule is set while its chapter is still being drafted (INGESTED). It then moves with the
-- chapter through Tinjau (Struktur, Validasi, Tinjau, Disetujui) and is sealed with it; the released chapter's
-- approved rule is the one its learning cycle uses. A new rule, or a new version, for a chapter that has moved on is
-- refused by name: the next action is the chapter's correction, which starts from an upload (D-085 M10), and the rule
-- is set on that draft. Renaming a rule changes no reading and stays possible. Studio's step moves only the rules
-- standing where the chapter stands, its modules' rules among them (src/app/studio/actions.ts).
--
-- Everything else is save_assessment_definition as it was: authority, bounds, INV-13, INV-29 versioning, audit.

create or replace function public.save_assessment_definition(p_definition uuid, p_payload jsonb)
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
  v_stage public.content_status;
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
      -- FD-9: a new rule, or a new version of one, is set while its chapter is still being drafted
      select c.status into v_stage from public.courses c
       where c.id = coalesce(v_course, (select m.course_id from public.modules m where m.id = v_module));
      if v_stage is distinct from 'INGESTED' then
        raise exception 'a rule is set while its chapter is still being drafted; this chapter is %', coalesce(v_stage::text, 'unknown');
      end if;
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
        -- FD-9: a new rule, or a new version of one, is set while its chapter is still being drafted
        select c.status into v_stage from public.courses c
         where c.id = coalesce(v_course, (select m.course_id from public.modules m where m.id = v_module));
        if v_stage is distinct from 'INGESTED' then
          raise exception 'a rule is set while its chapter is still being drafted; this chapter is %', coalesce(v_stage::text, 'unknown');
        end if;
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

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
declare v_src text := pg_get_functiondef('public.save_assessment_definition(uuid,jsonb)'::regprocedure);
begin
  if array_length(string_to_array(v_src, 'is still being drafted; this chapter is'), 1) - 1 <> 2 then
    raise exception 'a new rule or a new version can still be saved onto a chapter that has moved on';
  end if;
  if position('can_in_institution(''CAN_DRAFT''' in v_src) = 0 or position('INV-13' in v_src) = 0
     or position('assessment_definition_bounds' in v_src) = 0 then
    raise exception 'the rule''s authority, tenancy or bounds were lost';
  end if;
end $$;

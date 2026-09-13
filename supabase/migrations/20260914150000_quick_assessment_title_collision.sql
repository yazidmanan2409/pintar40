-- 0049 — the Quick Assessment title collided with itself.
--
-- FOUND BY. The FABLE-04 suite run as one statement rather than four. F04-T04
-- launched, and the launch failed with
--   duplicate key value violates unique constraint
--   "assessment_definitions_institution_id_title_mode_version_key"
--
-- WHY IT IS A PRODUCT DEFECT AND NOT A TEST ARTEFACT. `launch_quick_assessment`
-- titled every definition `'Kuis Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI')`
-- and the constraint is UNIQUE (institution_id, title, mode, version). Two
-- educators in one institution launching within the same clock minute is the
-- normal case at the start of a period, not a corner case -- and §5 sets the
-- target at "about one minute from intent to learners answering". The second
-- teacher would have received a raw Postgres unique violation through an
-- interface whose whole promise is one action. Nothing in the schema, the
-- engine or the tests would have reported it until a real school hit it.
--
-- THE REPAIR. Forward only, and it changes exactly one thing: the title takes
-- a `(2)`, `(3)` … suffix when the plain label is already taken. `version` is
-- deliberately NOT the discriminator -- two quick assessments launched in the
-- same minute are different instruments, not revisions of one, and overloading
-- `version` would make the definition history lie.
--
-- The body below is the LIVE definition spliced with that one change, not a
-- rewrite. This build has already been bitten once by retyping a function from
-- memory: 0046's rewritten `content_canonical_payload` moved two sealed
-- release hashes, and only the terminal block caught it.
--
-- WHERE THE BEHAVIOURAL PROOF LIVES. Not here. A migration runs before the
-- seeds, so at this point no institution, educator, class or module exists to
-- launch anything for, and a reproduction written here could only be vacuous
-- or fabricate its own tenant past the INV-21 seed guards. The terminal block
-- therefore asserts what it can actually see -- that the repair is present and
-- that the constraint which caused the bug is still there, so the defect can
-- never be "fixed" by dropping it -- and F04-T04 reproduces the collision
-- against the seeded bootstrap tenant on every run, launching twice inside one
-- transaction so the two launches share a minute by construction.

create or replace function public.launch_quick_assessment(p_node uuid, p_module uuid, p_item_count integer, p_minutes integer)
 RETURNS TABLE(assessment_definition_id uuid, assessment_assignment_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_actor uuid; v_inst uuid; v_course uuid; v_tier public.bank_type;
  v_period uuid; v_def uuid; v_assign uuid; v_drawable int; v_kind public.org_kind;
  v_label text; v_title text; v_try int;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'no person in this session'; end if;

  select n.institution_id, n.kind, n.academic_period_id into v_inst, v_kind, v_period
    from public.org_nodes n where n.id = p_node;
  if v_inst is null then raise exception 'unknown class %', p_node; end if;
  if v_kind not in ('CLASS','COHORT') then
    raise exception 'a quick assessment is launched for a class or cohort, not a %', v_kind;
  end if;
  if not public.can_on_node('CAN_QUICK_ASSESSMENT', p_node) then
    raise exception 'launching a quick assessment requires CAN_QUICK_ASSESSMENT over this class';
  end if;

  select m.course_id, c.institution_id into v_course, v_inst
    from public.modules m join public.courses c on c.id = m.course_id where m.id = p_module;
  if v_course is null then raise exception 'unknown module %', p_module; end if;
  if v_inst is distinct from (select institution_id from public.org_nodes where id = p_node) then
    raise exception 'that module belongs to another institution (INV-13)';
  end if;

  if p_item_count is null or p_item_count < 3 or p_item_count > 20 then
    raise exception 'a quick assessment carries between 3 and 20 questions, not %', p_item_count;
  end if;
  if p_minutes is null or p_minutes < 5 or p_minutes > 60 then
    raise exception 'a quick assessment runs between 5 and 60 minutes, not %', p_minutes;
  end if;

  select m.max_bank_tier into v_tier from public.mode_policy m where m.mode = 'QUICK';
  if v_tier is null then raise exception 'QUICK has no mode policy row'; end if;
  if v_tier = 'EXAM' then
    raise exception 'the QUICK mode policy reaches the EXAM tier; that is an INV-12 violation, not a configuration';
  end if;

  -- REPAIRED IN 0049. The title was the minute stamp alone, and
  -- (institution_id, title, mode, version) is UNIQUE: two educators in one
  -- institution launching inside the same minute produced a raw unique
  -- violation on the second launch. In a phase whose stated target is "about
  -- one minute from intent to learners answering" that is not a corner case,
  -- it is the normal case at the start of a period.
  --
  -- The title stays a human label -- a teacher recognises "Kuis Cepat" and the
  -- time -- and takes a counter only when it has to. The counter is NOT a
  -- version: two quick assessments launched in the same minute are different
  -- instruments, not revisions of one, and overloading `version` would make
  -- the definition history lie.
  v_label := 'Kuis Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI');
  v_title := v_label;
  v_try := 1;
  loop
    begin
      insert into public.assessment_definitions (
        institution_id, module_id, title, mode, bank_type, item_count,
        safety_critical_minimum, difficulty_mix, passing_rules, attempt_limit,
        allows_pause, offline_tolerant, hesitation_window_seconds, shuffle_policy,
        status, author_person_id, is_ad_hoc)
      values (
        v_inst, p_module,
        v_title,
        'QUICK', v_tier, p_item_count,
        0, jsonb_build_object('SEDANG', greatest(p_item_count / 2, 1), 'MUDAH', p_item_count - greatest(p_item_count / 2, 1)),
        jsonb_build_object('mastery_min', 0.6), 1,
        false, false, 25, 'ITEMS_AND_OPTIONS',
        'INGESTED', v_actor,
        -- INV-04: an ad-hoc instrument is outside the taught-content release, which
        -- is the only reason it may be created over a course that is already sealed
        true)
      returning id into v_def;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 200 then
        raise exception 'too many quick assessments launched in this minute for this institution';
      end if;
      v_title := v_label || ' (' || v_try || ')';
    end;
  end loop;

  select count(*) into v_drawable from public.drawable_items_for_definition(v_def);
  if v_drawable < p_item_count then
    raise exception 'this module has % drawable question(s) at the % tier; a % question quick assessment cannot be filled',
      v_drawable, v_tier, p_item_count;
  end if;

  insert into public.assessment_assignments (
    institution_id, assessment_definition_id, node_id, academic_period_id,
    opens_at, closes_at, assigned_by_person_id, assigned_at)
  values (v_inst, v_def, p_node, v_period, now(), now() + make_interval(mins => p_minutes),
          v_actor, now())
  returning id into v_assign;
  update public.assessment_assignments set status = 'SCHEDULED' where id = v_assign;
  update public.assessment_assignments set status = 'OPEN' where id = v_assign;

  perform public.audit_write('quick_assessment.launched', 'assessment_assignments', v_assign::text,
    v_inst,
    jsonb_build_object('definition', v_def, 'assignment', v_assign, 'node', p_node,
                       'items', p_item_count, 'minutes', p_minutes, 'tier', v_tier, 'ad_hoc', true));
  assessment_definition_id := v_def; assessment_assignment_id := v_assign;
  return next;
end $function$;

revoke all on function public.launch_quick_assessment(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.launch_quick_assessment(uuid, uuid, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare v_src text; n int;
begin
  v_src := pg_get_functiondef('public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure);

  -- the repair is present, and the title is no longer inserted as a bare stamp
  if v_src !~ 'unique_violation' then
    raise exception 'launch_quick_assessment does not handle the title collision';
  end if;
  if v_src !~ 'v_title := v_label' then
    raise exception 'launch_quick_assessment does not disambiguate the title';
  end if;
  -- the values list supplies the variable, not the stamp expression
  if v_src !~ E'\\n\\s*v_title,\\n' then
    raise exception 'the insert does not use the disambiguated title variable';
  end if;
  if v_src ~ E'\\n\\s*''Kuis Cepat' then
    raise exception 'the insert still builds the title inline; the collision path is unreachable';
  end if;

  -- the counter is not the version column
  if v_src ~ 'version *:= *v_try' or v_src ~ 'v_try[^\n]*version' then
    raise exception 'the collision is resolved by bumping version, which it must not be';
  end if;

  -- and the constraint that caused the defect is still enforced, so no later
  -- "repair" can consist of dropping it
  select count(*) into n from pg_constraint
   where conrelid = 'public.assessment_definitions'::regclass
     and contype = 'u'
     and pg_get_constraintdef(oid) = 'UNIQUE (institution_id, title, mode, version)';
  if n <> 1 then
    raise exception 'the (institution_id, title, mode, version) uniqueness is gone; the defect was removed by weakening the schema';
  end if;

  -- the exposure did not change
  if has_function_privilege('anon', 'public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure, 'EXECUTE') then
    raise exception 'launch_quick_assessment became anon-executable';
  end if;
  if not has_function_privilege('authenticated', 'public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure, 'EXECUTE') then
    raise exception 'launch_quick_assessment lost its authenticated grant';
  end if;
end $$;

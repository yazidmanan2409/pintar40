-- BOB-33: A QUICK ASSESSMENT IS DATED IN THE SCHOOL'S TIME, IN NUMBERS.
--
-- The title launch_quick_assessment gives a new Uji Cepat was
--   'Uji Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI')
-- which reads «Uji Cepat — 29 Sep 2026 06:08» for a launch at 13:08 in
-- Jakarta: the month in English, and the time in the database session's zone
-- (UTC), seven hours behind the school. A launch before 07:00 in Jakarta even
-- carried the previous day's date.
--
-- WHAT THIS MIGRATION CHANGES, AND NOTHING ELSE. The label, through a helper a
-- test can drive: quick_assessment_label(at) is `at` in Asia/Jakarta (as the
-- school year already is, 20261012100000) as YYYY-MM-DD HH24:MI, so a launch
-- at 13:08 WIB reads «Uji Cepat — 2026-09-29 13:08», the same in both
-- languages. The function body is 0090's (20260922100000), re-emitted verbatim
-- but for that one line: the collision loop, every refusal sentence
-- (BOB32-K01 reads them from the latest definition), the release resolution,
-- the INV-13 refusal, the single-owner boundary and the audit line are
-- byte-for-byte what they were.
--
-- NO BACKFILL. Stored titles keep the stamp they were created with (0090's
-- rule: a teacher saw those words that day, and the title is part of a UNIQUE
-- key). Instruments launched before this migration read «29 Sep 2026 06:08».
--
-- THE HELPER IS NOT A CLIENT ENTRY POINT: no execute for public, anon or
-- authenticated. launch_quick_assessment, running as its owner, calls it.

create or replace function public.quick_assessment_label(p_at timestamptz)
returns text
language sql stable set search_path = public, pg_temp as $$
  select to_char(p_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI')
$$;
comment on function public.quick_assessment_label(timestamptz) is
  'BOB-33: the stamp in a Uji Cepat title, the moment in Asia/Jakarta as YYYY-MM-DD HH24:MI. Called by launch_quick_assessment only.';
revoke all on function public.quick_assessment_label(timestamptz) from public, anon, authenticated;

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
  -- ADDED IN 0062. The module's owner is a SEPARATE fact from the assigning
  -- school's, and conflating them is the defect this migration repairs.
  v_module_inst uuid; v_canonical boolean := false;
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

  -- CHANGED IN 0062. `v_inst` stays the ASSIGNING school's -- it is the tenant
  -- of the class, the definition, the assignment and the audit line. The
  -- module's owner is read into its own variable and then TESTED, never copied.
  select m.course_id, c.institution_id into v_course, v_module_inst
    from public.modules m join public.courses c on c.id = m.course_id where m.id = p_module;
  if v_course is null then raise exception 'unknown module %', p_module; end if;

  if v_module_inst is distinct from v_inst then
    -- ADR-0018: eligibility for an ad-hoc paper follows AUTHORIZATION. The
    -- predicate carries the whole rule, including the tenant-kind conjunct
    -- that makes one school's grant unusable by another; restating any part of
    -- it here would create a second answer to the same question.
    select exists (
      select 1 from public.plp_releases r
       where r.course_id = v_course
         and public.release_is_distributed_to(r.id, v_inst)
         and public.caller_may_read_distributed_release(r.id))
      into v_canonical;
    if not v_canonical then
      raise exception 'that module belongs to another institution (INV-13)';
    end if;
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
  -- The title stays a human label -- a teacher recognises "Uji Cepat" and the
  -- time -- and takes a counter only when it has to. The counter is NOT a
  -- version: two quick assessments launched in the same minute are different
  -- instruments, not revisions of one, and overloading `version` would make
  -- the definition history lie.
  --
  -- RENAMED IN 0090. 'Kuis Cepat' until this migration; "Uji Cepat" is the
  -- ruled Indonesian name, and "kuis" was one of four names this one thing had.
  -- Forward-only: rows written before this read the old label and keep it.
  --
  -- DATED IN JAKARTA IN BOB-33. The stamp was the current time formatted with
  -- an English month abbreviation, in the database session's time zone (UTC):
  -- a teacher in WIB launching at 07:15 read 00:15, and one launching before
  -- 07:00 read the previous day's date. Now it is quick_assessment_label(now()):
  -- Jakarta time, the numeric date, the same in both languages. Forward-only
  -- again: stored titles keep their stamp.
  v_label := 'Uji Cepat — ' || public.quick_assessment_label(now());
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
        -- THE ASSIGNING SCHOOL, always. Over canonical content this row is the
        -- school's instrument about someone else's chapter; the chapter's owner
        -- is recorded where it belongs, on the items and the release the
        -- session cites.
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

  -- ADDED IN 0062 (ADR-0018). One content owner per ad-hoc paper, decided in
  -- the ADR and enforced at creation -- before the assignment exists, so a
  -- refused launch leaves no half-built instrument behind.
  perform public.enforce_ad_hoc_single_owner(v_def);

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
                       'items', p_item_count, 'minutes', p_minutes, 'tier', v_tier, 'ad_hoc', true,
                       -- provenance, not authority: which owner's chapter this
                       -- instrument is about. The authorization itself lives in
                       -- the distribution row and its own audit line.
                       'content_owner', v_module_inst, 'over_canonical', v_canonical));
  assessment_definition_id := v_def; assessment_assignment_id := v_assign;
  return next;
end $function$;
-- ADR-0021: the surface this file leaves behind, as 0049 and 0090 left it.
revoke all on function public.launch_quick_assessment(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.launch_quick_assessment(uuid, uuid, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare v_src text; v_lama text;
begin
  -- the 23:30 UTC launch is the next day in Jakarta, in numbers
  if public.quick_assessment_label('2026-09-29 23:30:00+00') <> '2026-09-30 06:30' then
    raise exception 'BOB-33: the label is not Jakarta time as YYYY-MM-DD HH24:MI: %',
      public.quick_assessment_label('2026-09-29 23:30:00+00');
  end if;
  v_src := pg_get_functiondef('public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure);
  if v_src !~ 'public\.quick_assessment_label\(now\(\)\)' or v_src ~ 'Mon YYYY' then
    raise exception 'BOB-33: launch_quick_assessment does not label with quick_assessment_label(now())';
  end if;
  -- nothing else in the function moved: every refusal sentence of 0090 is here
  foreach v_lama in array array[
    'no person in this session', 'unknown class %', 'a quick assessment is launched for a class or cohort, not a %',
    'launching a quick assessment requires CAN_QUICK_ASSESSMENT over this class', 'unknown module %',
    'that module belongs to another institution (INV-13)', 'a quick assessment carries between 3 and 20 questions, not %',
    'a quick assessment runs between 5 and 60 minutes, not %', 'QUICK has no mode policy row',
    'too many quick assessments launched in this minute for this institution',
    'this module has % drawable question(s) at the % tier; a % question quick assessment cannot be filled'] loop
    if position(v_lama in v_src) = 0 then
      raise exception 'BOB-33: a refusal of launch_quick_assessment was lost: %', v_lama;
    end if;
  end loop;
  if v_src !~ 'enforce_ad_hoc_single_owner' or v_src !~ 'release_is_distributed_to' then
    raise exception 'BOB-33: a boundary of launch_quick_assessment was lost';
  end if;
  if has_function_privilege('anon', 'public.quick_assessment_label(timestamptz)', 'execute')
     or has_function_privilege('authenticated', 'public.quick_assessment_label(timestamptz)', 'execute') then
    raise exception 'BOB-33: a client can call quick_assessment_label';
  end if;
  if has_function_privilege('anon', 'public.launch_quick_assessment(uuid,uuid,integer,integer)', 'execute')
     or not has_function_privilege('authenticated', 'public.launch_quick_assessment(uuid,uuid,integer,integer)', 'execute') then
    raise exception 'BOB-33: launch_quick_assessment''s grants moved';
  end if;
end $$;

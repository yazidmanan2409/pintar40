-- 0090 -- the instrument a learner opens is called what the product calls it.
--
-- MEASURED, NOT ASSUMED. Reconciliation found four names for one thing, and all
-- four are live at this commit:
--
--   * the DATABASE writes the learner-visible instrument title as
--     'Kuis Cepat -- ' || <stamp>, in `launch_quick_assessment` (0049, carried
--     forward unchanged by 0067);
--   * the copy table calls the MODE 'Penilaian cepat' / 'Quick assessment';
--   * the educator surface calls it 'Uji Cepat' / 'Quick Assessment';
--   * Studio calls it 'kuis'.
--
-- The product ruling is: ID "Uji Cepat", EN "Quick Assessment".
--
-- WHAT THIS MIGRATION CHANGES, AND NOTHING ELSE. Exactly one string: the label
-- this function generates for a definition it is creating. The body below is
-- 0067's, re-emitted verbatim -- the collision loop, the release resolution,
-- the INV-13 refusal, the distribution predicate, the single-owner boundary and
-- the audit line are byte-for-byte what they were -- because a terminology
-- repair that quietly moved a boundary would be a different change wearing this
-- one's name. 0067's own terminal block re-reads several of those, so the
-- checks below re-assert them here against the replacement.
--
-- WHAT THIS MIGRATION DELIBERATELY DOES NOT DO: it does not backfill. Existing
-- definitions keep the title they were created with. Their title is part of
-- UNIQUE (institution_id, title, mode, version), sessions cite the definition,
-- and a teacher who launched an instrument saw the words that were on it that
-- day. Rewriting those rows would edit the record of what happened, which is
-- ADR-0016's rule read in the other direction: correction is never retroactive.
-- So the change is forward-only and the boundary is visible -- instruments
-- launched before this migration read "Kuis Cepat", instruments launched after
-- read "Uji Cepat", and nothing pretends otherwise.
--
-- NO INTERNAL IDENTIFIER IS RENAMED. `assessment_mode.QUICK`,
-- `launch_quick_assessment`, `CAN_QUICK_ASSESSMENT` and every column keep their
-- names. This is user-facing terminology, and a broad rename of implementation
-- identifiers would be a large forward-only edit for no user-visible gain.
--
-- FRONTEND COPY IS NOT TOUCHED. `src/lib/hle.ts` still carries
-- 'studio.nav.kuis', 'studio.kuis.judul' and the mode's own telling. Those are
-- Experience's to normalise; this migration reports them rather than reaching
-- across the boundary. See the residual register.
-- ---------------------------------------------------------------------------

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
  v_label := 'Uji Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI');
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
-- ADR-0021, and F06-S01 refused this file until it was here. `create or
-- replace` preserves the grants a previous migration left, so the runtime
-- surface is unchanged either way -- but a reader of THIS file cannot tell that
-- from the file, and the rule is that a migration which creates a function
-- states the surface it leaves behind. These are 0049's grants, restated.
revoke all on function public.launch_quick_assessment(uuid, uuid, integer, integer) from public, anon;
grant execute on function public.launch_quick_assessment(uuid, uuid, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). The instrument is built here and rolled
-- back; nothing below assumes a seeded persona, class or module.
--
-- The claim is: a launch performed now carries the ruled name, the collision
-- path still disambiguates without touching `version`, and none of the five
-- boundaries 0067 put in this body left with the rename.
-- ---------------------------------------------------------------------------
do $$
declare
  v_inst uuid; v_period uuid; v_root uuid; v_fac uuid; v_dept uuid; v_prog uuid;
  v_cohort uuid; v_class uuid; v_course uuid; v_module uuid;
  v_uid_t uuid; v_p_t uuid; v_lesson uuid;
  v_def1 uuid; v_def2 uuid; v_title1 text; v_title2 text; v_src text; n int;
begin
  begin
    insert into public.institutions (id, name, slug, is_synthetic, is_active)
    values (gen_random_uuid(), 'probe inst 0090', 'probe-inst-0090', true, true)
    returning institutions.id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/27', current_date - 30, current_date + 300)
    returning academic_periods.id into v_period;
    select o.id into v_root from public.org_nodes o
     where o.institution_id = v_inst and o.kind = 'INSTITUTION';
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_root, 'FACULTY', 'F') returning org_nodes.id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D') returning org_nodes.id into v_dept;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dept, 'PROGRAMME', 'P') returning org_nodes.id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'K', v_period) returning org_nodes.id into v_cohort;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_cohort, 'CLASS', 'A', v_period) returning org_nodes.id into v_class;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0090-t@local.invalid')
    returning users.id into v_uid_t;
    select a.person_id into v_p_t from public.accounts a where a.auth_user_id = v_uid_t;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_p_t, 'EDUCATOR', v_class, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_inst, 'Probe', 'SD', '5', 'Probe course 0090') returning courses.id into v_course;
    insert into public.modules (institution_id, course_id, ordinal, title)
    values (v_inst, v_course, 1, 'Probe module 0090') returning modules.id into v_module;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown)
    values (v_module, v_inst, 1, 'Probe pelajaran 0090', 'isi') returning lessons.id into v_lesson;
    -- enough drawable questions for two three-question launches in one minute
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem)
    select v_lesson, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'Probe 0090 soal ' || g
      from generate_series(1, 6) g;

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_t, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_t::text, true);

    select q.assessment_definition_id into v_def1
      from public.launch_quick_assessment(v_class, v_module, 3, 30) q;
    select d.title into v_title1 from public.assessment_definitions d where d.id = v_def1;
    if v_title1 !~ '^Uji Cepat' then
      raise exception 'a quick assessment launched now is titled %, not the ruled name', v_title1;
    end if;
    if v_title1 ~ 'Kuis' then
      raise exception 'the old name survived in %', v_title1;
    end if;

    -- 0049's defect, re-driven: a second launch inside the same clock minute.
    -- now() is identical for both by construction, which is how it surfaced.
    select q.assessment_definition_id into v_def2
      from public.launch_quick_assessment(v_class, v_module, 3, 30) q;
    select d.title into v_title2 from public.assessment_definitions d where d.id = v_def2;
    if v_def2 = v_def1 then raise exception 'the second launch returned the first definition'; end if;
    if v_title2 = v_title1 then raise exception 'two launches in one minute share a title'; end if;
    if v_title2 !~ '^Uji Cepat' then
      raise exception 'the disambiguated title lost the label: %', v_title2;
    end if;
    select count(*) into n from public.assessment_definitions
     where id in (v_def1, v_def2) and version <> 1;
    if n <> 0 then raise exception 'the collision was resolved by bumping version'; end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug = 'probe-inst-0090';
  if n <> 0 then raise exception 'the probe left its institution behind'; end if;

  -- --------------------------------------------------------- STRUCTURAL ----
  -- 0067's five boundaries, re-asserted against the replacement body so a
  -- terminology edit cannot have carried one of them away.
  v_src := pg_get_functiondef('public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure);
  if v_src !~ 'unique_violation' then
    raise exception 'the title collision path left with the rename';
  end if;
  if v_src !~ 'v_title := v_label' then
    raise exception 'the title is no longer disambiguated';
  end if;
  if v_src ~ 'version *:= *v_try' or v_src ~ 'v_try[^\n]*version' then
    raise exception 'the collision is resolved by bumping version, which it must not be';
  end if;
  if v_src !~ 'release_is_distributed_to' then
    raise exception 'launch_quick_assessment no longer calls the distribution predicate';
  end if;
  if v_src !~ 'enforce_ad_hoc_single_owner' then
    raise exception 'the single-owner boundary left with the rename';
  end if;
  -- Comment-stripped, because the note above the assignment names the old label
  -- on purpose: what must be gone is the GENERATED string, not the history.
  v_src := regexp_replace(v_src, '--[^\n]*', '', 'g');
  if v_src ~ 'Kuis Cepat' then
    raise exception 'the function still generates the old name';
  end if;
  if v_src !~ E'v_label := ''Uji Cepat' then
    raise exception 'the function does not generate the ruled name';
  end if;

  -- The grants are still the ones 0067 left.
  if has_function_privilege('anon', 'public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure, 'EXECUTE') then
    raise exception 'anon may launch a quick assessment';
  end if;
  if not has_function_privilege('authenticated', 'public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure, 'EXECUTE') then
    raise exception 'an educator may no longer launch a quick assessment';
  end if;
  -- and its declared authorization is untouched
  select count(*) into n from public.client_rpc_registry
   where function_name = 'launch_quick_assessment'
     and exposure = 'STAFF' and authorization_kind = 'CAPABILITY'
     and authorization_requirement = 'CAN_QUICK_ASSESSMENT';
  if n <> 1 then raise exception 'the declared authorization of launch_quick_assessment changed'; end if;

  raise notice '0090 verified: a quick assessment is titled "Uji Cepat", and nothing else moved';
end $$;

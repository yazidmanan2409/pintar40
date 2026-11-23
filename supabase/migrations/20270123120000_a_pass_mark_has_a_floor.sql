-- ---------------------------------------------------------------------------------------------------------------
-- Z · K-07 (ruling 78; the owner's refinement 6 of ruling 81): A PASS MARK HAS A FLOOR. A mark of 0 was allowed
-- everywhere, so any score met the target and only the must-be-right gate stood between a learner and «tercapai».
-- Red first: Z-K07-01.
--
--   * The floor is per column, in that column's own unit (read on staging, 23 Nov, read only): school_pass_marks.percent
--     is a whole percentage, 1 to 100; assessment_assignments.pass_mark and assessment_sessions.pass_mark are FRACTIONS,
--     0.01 to 1.00. Null stays allowed (333 legacy or diagnostic sessions on staging have none).
--   * Each floor is a new CHECK added NOT VALID, so it holds for every new or changed row at once and no existing row is
--     read or rewritten by the ALTER. It is then VALIDATED only where a read in this migration finds no row below it
--     (staging had none of 38, 182 and 1,779); where any is found, it stays NOT VALID and the count is raised as a
--     NOTICE for the release log, and no row is updated.
--   * set_school_pass_mark refuses below 1 in its own words (22023), restated in full from its live definition.
--     The seal triggers copy the school's mark (percent / 100) to the assignment and every attempt, so the fraction
--     floor follows from the percent one; it is a constraint all the same, for every other writer.
-- ---------------------------------------------------------------------------------------------------------------

alter table public.school_pass_marks
  add constraint school_pass_marks_percent_floor check (percent >= 1 and percent <= 100) not valid;
alter table public.assessment_assignments
  add constraint assessment_assignments_pass_mark_floor check (pass_mark is null or (pass_mark >= 0.01 and pass_mark <= 1)) not valid;
alter table public.assessment_sessions
  add constraint assessment_sessions_pass_mark_floor check (pass_mark is null or (pass_mark >= 0.01 and pass_mark <= 1)) not valid;

do $$
declare n bigint;
begin
  select count(*) into n from public.school_pass_marks where not (percent >= 1 and percent <= 100);
  if n = 0 then alter table public.school_pass_marks validate constraint school_pass_marks_percent_floor;
  else raise notice 'Z K-07: % school_pass_marks row(s) below the floor; school_pass_marks_percent_floor stays NOT VALID', n; end if;
  select count(*) into n from public.assessment_assignments where pass_mark is not null and not (pass_mark >= 0.01 and pass_mark <= 1);
  if n = 0 then alter table public.assessment_assignments validate constraint assessment_assignments_pass_mark_floor;
  else raise notice 'Z K-07: % assessment_assignments row(s) below the floor; the constraint stays NOT VALID', n; end if;
  select count(*) into n from public.assessment_sessions where pass_mark is not null and not (pass_mark >= 0.01 and pass_mark <= 1);
  if n = 0 then alter table public.assessment_sessions validate constraint assessment_sessions_pass_mark_floor;
  else raise notice 'Z K-07: % assessment_sessions row(s) below the floor; the constraint stays NOT VALID', n; end if;
end $$;

CREATE OR REPLACE FUNCTION public.set_school_pass_mark(p_institution uuid, p_course uuid, p_percent integer, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_person uuid; v_root uuid; v_now public.school_pass_marks; v_id uuid;
begin
  v_person := public.current_person_id();
  -- the school's administrator (D-081 Q2), as every school-administration act is asked (period_rollover): a head of
  -- department, a dean or a teacher is refused; the audit row names who set it
  if v_person is null or p_institution is null or not public.has_scope('INSTITUTION_ADMIN', p_institution) then
    raise exception using errcode = '42501',
      message = 'a school''s pass mark is set by that school''s INSTITUTION_ADMIN';
  end if;
  -- Z K-07: a pass mark of 0 lets any score pass (the gate only); the floor is 1
  if p_percent is null or p_percent < 1 or p_percent > 100 then
    raise exception using errcode = '22023', message = 'a pass mark is a whole-number percentage from 1 to 100';
  end if;
  if p_reason is null or btrim(p_reason) = '' or length(btrim(p_reason)) > 300 then
    raise exception using errcode = '22023', message = 'a pass mark is set with a short reason (at most 300 characters)';
  end if;
  v_root := public.course_lineage_root(p_course);
  if v_root is null or not exists (select 1 from public.school_lesson_lines(p_institution) l where l.course_id = v_root) then
    raise exception using errcode = 'P0002', message = 'that lesson is not found among the lessons this school can give';
  end if;

  -- one writer per school and lesson at a time, so the history stays a line
  perform pg_advisory_xact_lock(hashtextextended('school_pass_mark:' || p_institution::text || ':' || v_root::text, 0));
  v_now := public.school_pass_mark_current(p_institution, v_root);
  if v_now.id is not null and v_now.percent = p_percent then
    return jsonb_build_object('id', v_now.id, 'changed', false, 'percent', v_now.percent);
  end if;

  insert into public.school_pass_marks (institution_id, course_id, percent, reason, set_by_person_id, supersedes_id)
  values (p_institution, v_root, p_percent, btrim(p_reason), v_person, v_now.id)
  returning id into v_id;
  perform public.audit_write('school_pass_mark.set', 'school_pass_marks', v_id::text, p_institution,
    jsonb_build_object('course_id', v_root, 'percent', p_percent, 'previous_percent', v_now.percent,
                       'supersedes_id', v_now.id, 'reason', btrim(p_reason)));
  return jsonb_build_object('id', v_id, 'changed', true, 'percent', p_percent);
end $function$;
revoke all on function public.set_school_pass_mark(uuid, uuid, integer, text) from public, anon, authenticated, service_role;
grant execute on function public.set_school_pass_mark(uuid, uuid, integer, text) to authenticated;

do $$
begin
  if (select count(*) from pg_constraint where conname in ('school_pass_marks_percent_floor', 'assessment_assignments_pass_mark_floor',
                                                           'assessment_sessions_pass_mark_floor')) <> 3 then
    raise exception 'Z K-07: a pass-mark floor is missing';
  end if;
  if pg_get_functiondef('public.set_school_pass_mark(uuid,uuid,integer,text)'::regprocedure) !~ 'p_percent < 1' then
    raise exception 'Z K-07: set_school_pass_mark accepts a mark below 1';
  end if;
end $$;

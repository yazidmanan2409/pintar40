-- Sharon F2 (Medium, review of 7a2c1751) and owner ruling 1 (9 Nov). Red first: F38-H02, F38-O01.
--
-- WHAT COUNTS AS AN ATTEMPT. may_start_assessment counted a learner's sittings of ONE assessment assignment against
-- the definition's attempt_limit. Two corrections:
--   * Sharon F2: a sitting TERMINATED as INSTITUTIONAL_REVOCATION is not counted. A departure ends a learner's open
--     sitting so; on a correction or a return the learner found that attempt spent by the school's own act. Every other
--     sitting still counts: finished, expired, ended for an integrity or administrative reason.
--   * Owner ruling 1: «Preserve applicable attempt limits across reassignment of the same assessment. Reassignment alone
--     must not reset attempts.» Since W2.21 a lesson can be ended and given to the class again, which creates a new
--     assessment assignment of the same definition. The count is now over the learner's sittings of the same assessment
--     (its definition and version, the identity a sitting already records), under any assignment. A genuinely new
--     assessment (a new definition, a new version of it, every Uji Cepat) brings its own allowance. No reset is built.
--
-- CORRECTED IN PLACE (undeployed; Sharon's addendum on dc84af22 and the owner's ruling of 10 Nov). Red first: F38-O04.
--   * Owner ruling (10 Nov): the count is within one school and one school year. A sitting of this very assignment always
--     counts; a sitting of another assignment of the same assessment counts when it was at the same school and its
--     assignment is of the same school year (found by F37-R01 on the clean suite: a sitting's own recorded period need
--     not be its assignment's). A learner repeating the year, or one who moved school, starts a fresh allowance; a
--     reassignment or a class change within the year does not.
--   * Sharon (addendum): a sitting the teacher ended with the assignment (ADMINISTRATIVE_TERMINATION) is the school's own
--     act, as a departure is, and is not counted. An integrity ending (SECURITY_INTERVENTION) and an expiry still are.
--
-- The function body is replaced from its own current definition, that one count changed, so the lock order
-- (20270112120000: start_learning_session locks before it calls this) and every other reason are unchanged.
-- CORRECTED IN PLACE (undeployed): ruling 1 added to F2's correction.

do $$
declare v_def text := pg_get_functiondef('public.may_start_assessment(uuid)'::regprocedure);
        v_old text := 'where s.person_id = v_person and s.assessment_assignment_id = p_assessment_assignment;';
begin
  if position(v_old in v_def) = 0 then
    raise exception 'Sharon F2: may_start_assessment''s attempt count is not where it was';
  end if;
  execute replace(v_def, v_old,
    'where s.person_id = v_person'
    || E'\n       -- owner ruling 1 (20270113140000): the same assessment under any assignment, not this assignment alone'
    || E'\n       and (s.assessment_assignment_id = p_assessment_assignment'
    || E'\n            or (s.assessment_definition_id = v_d.id and s.assessment_definition_version = v_d.version'
    || E'\n                -- owner ruling (10 Nov): another assignment counts within one school and one school year'
    || E'\n                and s.institution_id = v_aa.institution_id'
    || E'\n                and exists (select 1 from public.assessment_assignments a2 where a2.id = s.assessment_assignment_id'
    || E'\n                              and a2.academic_period_id is not distinct from v_aa.academic_period_id)))'
    || E'\n       -- Sharon F2 and addendum (20270113140000): an ending by the school''s own act is not an attempt'
    || E'\n       and coalesce(s.termination_cause::text, '''') not in (''INSTITUTIONAL_REVOCATION'', ''ADMINISTRATIVE_TERMINATION'');');
end $$;

do $$
declare v_src text := (select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure);
begin
  if position('INSTITUTIONAL_REVOCATION' in v_src) = 0 or position('ADMINISTRATIVE_TERMINATION' in v_src) = 0
     or position('PRE_TEST_NOT_FINALIZED' in v_src) = 0
     or position('s.assessment_definition_version = v_d.version' in v_src) = 0
     or position('a2.academic_period_id is not distinct from v_aa.academic_period_id' in v_src) = 0
     or position('s.institution_id = v_aa.institution_id' in v_src) = 0 then
    raise exception 'F2 / ruling 1 / 10 Nov: may_start_assessment does not count the same assessment within one school and year without a sitting the school ended, or lost its order check';
  end if;
  if has_function_privilege('anon', 'public.may_start_assessment(uuid)', 'execute') then
    raise exception 'Sharon F2: the signed-out role may call may_start_assessment';
  end if;
end $$;

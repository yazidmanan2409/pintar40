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
    || E'\n            or (s.assessment_definition_id = v_d.id and s.assessment_definition_version = v_d.version))'
    || E'\n       and s.termination_cause is distinct from ''INSTITUTIONAL_REVOCATION'';  -- Sharon F2 (20270113140000)');
end $$;

do $$
declare v_src text := (select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure);
begin
  if position('INSTITUTIONAL_REVOCATION' in v_src) = 0 or position('PRE_TEST_NOT_FINALIZED' in v_src) = 0
     or position('s.assessment_definition_version = v_d.version' in v_src) = 0 then
    raise exception 'F2 / ruling 1: may_start_assessment does not count the same assessment across assignments without a sitting the school ended, or lost its order check';
  end if;
  if has_function_privilege('anon', 'public.may_start_assessment(uuid)', 'execute') then
    raise exception 'Sharon F2: the signed-out role may call may_start_assessment';
  end if;
end $$;

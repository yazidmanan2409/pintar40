-- Sharon F2 (Medium, review of 7a2c1751): a sitting the school ended is not an attempt the learner used. Red first:
-- F38-H02.
--
-- may_start_assessment counted every sitting of an assignment against the definition's attempt_limit. A departure
-- (akhiri_pendaftaran) ends a learner's open sitting as INSTITUTIONAL_REVOCATION; on a correction or a return to the
-- same class the learner found that attempt spent by the school's own act, and with an attempt limit of 1 could never
-- sit the assessment again. The count now leaves out sittings TERMINATED as INSTITUTIONAL_REVOCATION. Every other
-- sitting still counts: one the learner finished, one that expired, one ended for an integrity or administrative
-- reason (those are decisions about this learner's attempt, not about their place at the school).
--
-- The function body is replaced from its own current definition, that one predicate added, so the lock order
-- (20270112120000: start_learning_session locks before it calls this) and every other reason are unchanged.

do $$
declare v_def text := pg_get_functiondef('public.may_start_assessment(uuid)'::regprocedure);
        v_old text := 'where s.person_id = v_person and s.assessment_assignment_id = p_assessment_assignment;';
begin
  if position(v_old in v_def) = 0 then
    raise exception 'Sharon F2: may_start_assessment''s attempt count is not where it was';
  end if;
  execute replace(v_def, v_old,
    'where s.person_id = v_person and s.assessment_assignment_id = p_assessment_assignment'
    || E'\n       and s.termination_cause is distinct from ''INSTITUTIONAL_REVOCATION'';  -- Sharon F2 (20270113140000)');
end $$;

do $$
declare v_src text := (select prosrc from pg_proc where oid = 'public.may_start_assessment(uuid)'::regprocedure);
begin
  if position('INSTITUTIONAL_REVOCATION' in v_src) = 0 or position('PRE_TEST_NOT_FINALIZED' in v_src) = 0 then
    raise exception 'Sharon F2: may_start_assessment does not leave out a sitting the school ended, or lost its order check';
  end if;
  if has_function_privilege('anon', 'public.may_start_assessment(uuid)', 'execute') then
    raise exception 'Sharon F2: the signed-out role may call may_start_assessment';
  end if;
end $$;

-- wp7-d — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 4. P-D, AUDIT LINKAGE. Every other mutating endpoint in PINTAR audits
--    itself, so an audit row here is the change a careful engineer would
--    make on purpose. audit_write derives the actor from auth.uid(): the
--    row is the respondent, timestamped, beside their answers.
-- P-D AUDIT LINKAGE: the submission writes the respondent beside their answers.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.submit_feedback(uuid,jsonb)'::regprocedure);
  src := replace(orig,
    '  return jsonb_build_object(''outcome'', ''recorded'', ''answers'', n_written);',
    '  perform public.audit_write(''feedback.submitted'', ''feedback_responses'', p_cycle::text,
      c.institution_id, jsonb_build_object(''person_id'', v_me, ''answers'', p_answers));
  return jsonb_build_object(''outcome'', ''recorded'', ''answers'', n_written);');
  if src = orig then raise exception 'the plant did not reach the submission return'; end if;
  execute src;
end $d$;

-- wp7-a — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 1. P-A, THE IDENTITY LEAK. The response table learns who wrote each row
--    and the submission fills it in. This is the defect the whole design
--    exists to prevent, and the boundary check has to see it as a COLUMN
--    rather than as a behaviour: nothing else in the suite would notice a
--    person_id that is written but never read back.
-- P-A IDENTITY LEAK: the response table learns who wrote each row.
-- Matched line by line rather than across lines, so the plant does not depend
-- on how the function body happens to be indented.
alter table public.feedback_responses add column person_id uuid references public.persons(id);
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.submit_feedback(uuid,jsonb)'::regprocedure);
  src := replace(orig, '(cycle_id, institution_id, question_key, option_key)',
                       '(cycle_id, institution_id, question_key, option_key, person_id)');
  src := replace(src, 'k, p_answers ->> k', 'k, p_answers ->> k, v_me');
  if src = orig then raise exception 'the plant did not reach the submit_feedback body'; end if;
  execute src;
end $d$;

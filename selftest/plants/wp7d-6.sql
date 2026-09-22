-- wp7d-6 — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 14. P6, TOCTOU. Opening stops re-validating the subject, on the
--     reasoning that the caller could only have got this id from
--     discovery. Discovery is current state, never a token.
-- P6 TOCTOU: opening stops re-validating the subject, on the reasoning that
-- the caller could only have got this id from discovery.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.open_feedback_cycle(uuid,uuid)'::regprocedure);
  src := replace(orig, 'if not exists (select 1 from public.feedback_subject_candidates(p_node) c',
                       'if false and not exists (select 1 from public.feedback_subject_candidates(p_node) c');
  if src = orig then raise exception 'the plant did not reach the subject re-validation'; end if;
  execute src;
end $d$;

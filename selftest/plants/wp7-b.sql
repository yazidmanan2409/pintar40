-- wp7-b — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 2. P-B, THE THRESHOLD LEAK. A withheld cycle reports how short it fell.
--    `have` and `needed` are exactly what metric_evaluate returns below its
--    minimum, so this is the plausible mistake -- reusing the readiness
--    shape for an anonymity floor -- and the test refuses it by naming the
--    three keys that MAY be present rather than guessing at the rest.
-- P-B THRESHOLD LEAK: a withheld cycle reports how short it fell.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.feedback_result(uuid)'::regprocedure);
  src := replace(orig,
    'return jsonb_build_object(''cycle_id'', c.id, ''state'', ''WITHHELD'', ''statement_key'', v_statement);',
    'return jsonb_build_object(''cycle_id'', c.id, ''state'', ''WITHHELD'', ''statement_key'', v_statement,
       ''have'', (select count(*) from public.feedback_opportunities o where o.cycle_id = p_cycle and o.consumed),
       ''needed'', (select t.minimum_responses from public.feedback_thresholds t where t.version = c.threshold_version));');
  if src = orig then raise exception 'the plant did not reach the withheld branch'; end if;
  execute src;
end $d$;

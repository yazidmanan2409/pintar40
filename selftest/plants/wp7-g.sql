-- wp7-g — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 7. P-G, THE LIVE AGGREGATE. The result moves as each answer arrives, which
--    is differencing with a refresh button: read, watch one learner submit,
--    read again.
-- P-G LIVE AGGREGATE: the result moves as each answer arrives.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.feedback_result(uuid)'::regprocedure);
  src := replace(orig,
    '''statement_key'', ''umpanbalik.hasil.belum_ditutup'');',
    '''statement_key'', ''umpanbalik.hasil.belum_ditutup'',
       ''total_responses'', (select count(*) from public.feedback_opportunities o
                              where o.cycle_id = p_cycle and o.consumed));');
  if src = orig then raise exception 'the plant did not reach the open branch'; end if;
  execute src;
end $d$;

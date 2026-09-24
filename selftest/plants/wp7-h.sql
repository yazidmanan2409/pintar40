-- wp7-h — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 8. P-H, ELIGIBILITY DRIFT. The snapshot is replaced by membership as it
--    stands now -- the shape anyone would write without thinking about the
--    learner who leaves the class mid-cycle. That learner was there when the
--    class was asked and their answer is already counted; under current
--    membership they are refused, the published total drops from six to five
--    and the marginals stop summing to it.
-- P-H ELIGIBILITY DRIFT: the snapshot is replaced by membership as it stands
-- now, so the learner who has moved on since the class was asked -- and whose
-- answer is already counted -- is refused, and the published total drops.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.submit_feedback(uuid,jsonb)'::regprocedure);
  src := replace(orig,
    'if not exists (select 1 from public.feedback_opportunities o',
    'if not exists (select 1 from public.feedback_cycles f
                   join public.members_of_node_at(f.scope_node_id, now()) m on m.person_id = v_me');
  src := replace(src,
    'where o.cycle_id = p_cycle and o.person_id = v_me) then',
    'where f.id = p_cycle) then');
  if src = orig then raise exception 'the plant did not reach the eligibility check'; end if;
  execute src;
end $d$;

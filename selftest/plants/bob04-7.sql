-- bob04-7 — A STRANGER READS SOMEONE'S CYCLE. The membership check is gone.
-- Re-aimed (20270113150000): my_cycle_state checks membership through my_learning_history().
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.my_cycle_state(uuid)'::regprocedure);
  src := replace(orig, $p$     or not exists (select 1 from public.my_learning_history() m
                     where m.learning_assignment_id = p_learning_assignment) then$p$, $p$ then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

-- bob39-2 — THE REFERRER DECIDES THEIR OWN CASE (CR-76, D-123(4)). advance_management_decision forgets who raised an
-- integrity referral, so the Head of Department who referred it may take it up and decide it alone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.advance_management_decision(uuid, public.management_decision_state, public.management_decision_outcome, text)'::regprocedure);
  src := replace(orig, $p$if d.family = 'INTEGRITY_REFERRAL' and d.raised_by_person_id = v_actor then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

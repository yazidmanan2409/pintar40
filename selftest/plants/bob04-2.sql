-- bob04-2 — THE DRAW IGNORES THE MARKS. A cycle test draws every test question and every practice question of the course.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.eligible_items_for_definition(uuid)'::regprocedure);
  src := replace(orig, $p$     and (not public.definition_follows_cycle_roles(d.id) or i.cycle_role = d.mode)$p$, $p$$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

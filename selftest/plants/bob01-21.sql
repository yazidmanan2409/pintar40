-- bob01-21 — BOB-20 (D-048): SEEING BECOMES GRANTING. The role guard stops asking whether the grantor administers the target node, so a school's admin could give a role at another school; F10-V03 must see it.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.role_assignments_guard()'::regprocedure);
  src := replace(orig, $p$if not public.has_scope('INSTITUTION_ADMIN', new.scope_node_id) then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

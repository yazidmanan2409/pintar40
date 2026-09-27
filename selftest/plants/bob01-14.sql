-- bob01-14 — THE NATIONAL LIBRARY TAKES A STRUCTURE AGAIN (BOB-08 f). structure_node no longer asks what kind of tenant it is.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.structure_node(uuid)'::regprocedure);
  src := replace(orig, $p$is distinct from 'INSTITUTION' then$p$, $p$is distinct from 'INSTITUTION' and false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

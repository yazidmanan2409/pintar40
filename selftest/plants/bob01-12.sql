-- bob01-12 — A DEACTIVATED PLACE TAKES PEOPLE AGAIN (BOB-08 b). The place trigger lets everything through.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_place_is_active()'::regprocedure);
  src := replace(orig, $p$  if v_node is null then return new; end if;$p$, $p$  return new;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

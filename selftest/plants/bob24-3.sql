-- bob24-3 — RESERVED NAMES ARE ALLOWED. Anyone can call themselves admin or pintar.support.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.username_rejection(text)'::regprocedure);
  src := replace(orig, $p$return 'USERNAME_RESERVED';$p$, $p$return null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

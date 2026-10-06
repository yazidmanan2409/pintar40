-- bob24-2 — A TYPED O, I OR L IS NOT READ AS 0 OR 1. An ID read aloud or copied by hand no longer finds its person.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.pintar_id_canonical(text)'::regprocedure);
  src := replace(orig, $p$'OIL', '011'$p$, $p$'', ''$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

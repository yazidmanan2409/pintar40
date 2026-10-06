-- bob01-13 — ANY YEAR IS ACCEPTED AGAIN (BOB-08 c). The window around the current school year is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.structure_year_start(text)'::regprocedure);
  src := replace(orig, $p$  if y < kini - 1 or y > kini + 1 then$p$, $p$  if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

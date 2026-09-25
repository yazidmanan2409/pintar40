-- bob06-3 — A SCHOOL MAY REMOVE PINTAR'S STANDARD REPORT. The delete refusal is skipped.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_report_template()'::regprocedure);
  src := replace(orig, $p$    if old.is_standard then$p$, $p$    if false and old.is_standard then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

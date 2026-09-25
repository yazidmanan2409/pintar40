-- bob06-5 — A SCHOOL MAY EDIT PINTAR'S STANDARD REPORT IN PLACE. The update refusal is skipped.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_report_template()'::regprocedure);
  src := replace(orig, $p$  elsif old.is_standard or new.is_standard then$p$, $p$  elsif false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

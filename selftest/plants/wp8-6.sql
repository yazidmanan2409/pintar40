-- wp8-6 — A RETIRED METRIC IS OFFERED AGAIN. The deprecation check goes, and
-- an institution may assemble a template around a metric PINTAR has withdrawn.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_report_template_metric()'::regprocedure);
  src := replace(orig, 'if d.deprecated then', 'if false and d.deprecated then');
  if src = orig then raise exception 'the plant did not reach the deprecation check'; end if;
  execute src;
end $d$;

-- wp8-4 — A SCHOOL DEFINES ITS OWN METRIC. The guard stops checking that the
-- metric it is handed exists in PINTAR's live catalogue, which is the whole
-- boundary between selecting and defining.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_report_template_metric()'::regprocedure);
  src := replace(orig, 'if d.metric_id is null then', 'if false and d.metric_id is null then');
  if src = orig then raise exception 'the plant did not reach the catalogue check'; end if;
  execute src;
end $d$;

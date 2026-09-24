-- bob06-6 — THE STANDARD ASSEMBLY IS WRITTEN OUT OF ORDER. The provisioner reverses the standard order.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.provision_standard_report_templates(uuid)'::regprocedure);
  src := replace(orig, $p$order by w.pos$p$, $p$order by w.pos desc$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

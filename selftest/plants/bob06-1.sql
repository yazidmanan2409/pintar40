-- bob06-1 — A NEW SCHOOL GETS NO STANDARD REPORTS (B6b). The provisioner returns before writing anything.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.provision_standard_report_templates(uuid)'::regprocedure);
  src := replace(orig, $p$if v_kind is distinct from 'INSTITUTION' then return 0; end if;$p$, $p$return 0;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

-- bob02-2 — AN OPTION WITHOUT ITS REASON PASSES THE CHECK (INV-03). The problem is found only when the database refuses the row.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.lesson_package_check(uuid,jsonb,uuid)'::regprocedure);
  src := replace(orig, $p$if public.package_text(o, 'rationale') is null then v_p := v_p || public.package_problem('OPTION_REASON_MISSING', o, v_path, 'rationale');$p$, $p$if false then null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

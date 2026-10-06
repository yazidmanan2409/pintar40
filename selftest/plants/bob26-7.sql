-- bob26-7 — ANY SCHOOL READS THE NAMES. import_preview_names forgets to ask whose job it is.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.import_preview_names(uuid, integer, integer)'::regprocedure);
  src := replace(orig, $p$perform public.import_job_for_admin(p_job);$p$, '');
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

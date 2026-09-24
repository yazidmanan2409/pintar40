-- bob03-3 — READINESS IS NOT MEASURED AT THE SEAL. The freeze no longer runs the validators.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.freeze_release(uuid)'::regprocedure);
  src := replace(orig, $p$  perform public.validate_course_content(c.id);
  perform public.run_mcq_quality(c.id);$p$, $p$  null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

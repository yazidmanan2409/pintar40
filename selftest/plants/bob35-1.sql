-- bob35-1 — A SESSION MAY CITE ANOTHER COURSE'S RELEASE. The root check at insert lets everything through.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_session_release_is_its_course()'::regprocedure);
  src := replace(orig, $p$if v_def_course is null or v_rel_course is null or v_def_course <> v_rel_course then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

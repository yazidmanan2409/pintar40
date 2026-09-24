-- bob04-1 — A COURSE ARRIVES WITHOUT ITS TESTS. The materialiser makes no pre-test or post-test.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.lesson_package_materialise(uuid)'::regprocedure);
  src := replace(orig, $p$      continue when v_n = 0;$p$, $p$      continue;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

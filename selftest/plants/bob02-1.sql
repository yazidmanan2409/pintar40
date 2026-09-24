-- bob02-1 — THE OPTIONS ARE DROPPED. The materialiser writes each question and none of its options.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.lesson_package_materialise(uuid)'::regprocedure);
  src := replace(orig, $p$for o in select * from jsonb_array_elements(public.package_array(i, 'options')) loop$p$, $p$for o in select * from jsonb_array_elements('[]'::jsonb) loop$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

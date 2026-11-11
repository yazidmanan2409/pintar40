-- bob02-6 — D-008 IS FORGOTTEN. The materialiser drops which assessment each question is for.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.lesson_package_materialise(uuid)'::regprocedure);
  src := replace(orig, $p$v_use::public.assessment_mode, b.confirmed_by_person_id,$p$, $p$null, b.confirmed_by_person_id,$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

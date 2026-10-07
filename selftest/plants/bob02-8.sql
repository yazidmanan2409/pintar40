-- bob02-8 — M8 RETURNS. A package may become a course of the platform's library instead of a school's. RESTATED FOR
-- CR-51 (D-120 Q7): the library now takes the platform admin's package, so the defect is a SCHOOL ROLE's package
-- accepted there: the platform-admin condition is dropped and anybody who may draft in the library may import into it.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.package_batch(uuid)'::regprocedure);
  src := replace(orig, $p$and not public.is_system_admin() then$p$, $p$and false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

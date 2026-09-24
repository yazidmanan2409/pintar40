-- bob02-8 — M8 RETURNS. A package may become a course of the platform's library instead of a school's.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.package_batch(uuid)'::regprocedure);
  src := replace(orig, $p$and x.tenant_kind = 'PLATFORM_CANONICAL') then$p$, $p$and false) then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

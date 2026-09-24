-- bob01-11 — THE LIST IS FOR EVERYONE. school_structure stops asking has_scope,
-- so any signed-in person can read a school's structure.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.school_structure(uuid)'::regprocedure);
  src := replace(orig, 'or not public.has_scope(''INSTITUTION_ADMIN'', p_institution) then', 'then');
  if src = orig then raise exception 'the plant did not reach the authorization clause'; end if;
  execute src;
end $d$;

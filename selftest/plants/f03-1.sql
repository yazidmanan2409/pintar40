-- f03-1 — THE INTAKE GRANTS STUDENT AS A ROLE. import_advance passes role
-- STUDENT to role_assignments again, which fails every learner row.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.import_advance(uuid,integer)'::regprocedure);
  src := replace(orig, 'if v_role is not null and v_role <> ''STUDENT'' then', 'if v_role is not null then');
  if src = orig then raise exception 'the plant did not reach the STUDENT clause'; end if;
  execute src;
end $d$;

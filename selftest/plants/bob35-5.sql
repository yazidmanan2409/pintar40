-- bob35-5 — A START THAT RACED THE MOVE IS KEPT. The session is checked against itself only, never against its assignment's current release.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_session_release_is_its_course()'::regprocedure);
  src := replace(orig, $p$    if v_la_release is distinct from new.plp_release_id$p$, $p$    if false and v_la_release is distinct from new.plp_release_id$p$);
  src := replace(src, $p$       or (new.assessment_assignment_id is not null and v_aa_definition is distinct from new.assessment_definition_id) then$p$,
                      $p$       then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

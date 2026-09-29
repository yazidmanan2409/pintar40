-- bob35-2 — THE MOVE LEAVES THE CYCLE BEHIND. The assignment moves; its PRE_TEST and POST_TEST stay on the old definitions.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.move_learning_assignment_release(uuid, uuid, text)'::regprocedure);
  src := replace(orig, $p$update public.assessment_assignments set assessment_definition_id = v_def.id where id = v_aa.id;$p$, $p$$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

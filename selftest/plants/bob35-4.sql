-- bob35-4 — A TARGET WITH NO CYCLE DEFINITION IS MOVED TO. The cycle silently keeps the old definition.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.move_learning_assignment_release(uuid, uuid, text)'::regprocedure);
  src := replace(orig, $p$    if v_def.id is null then
      raise exception$p$, $p$    if v_def.id is null then continue; end if;
    if false then
      raise exception$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

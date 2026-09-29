-- bob24-1 — A PINTAR ID CAN BE CHANGED. The immutability refusal is gone, so an ID can be rewritten or cleared and redrawn.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.persons_pintar_id_guard()'::regprocedure);
  src := replace(orig, $p$if tg_op = 'UPDATE' and old.pintar_id is not null and new.pintar_id is distinct from old.pintar_id then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

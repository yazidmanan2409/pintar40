-- bob26-4 — FINISHED WITHOUT THE NAME. complete_my_setup stops asking for the name's confirmation.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.complete_my_setup()'::regprocedure);
  src := replace(orig, $p$if s.name_confirmed_at is null then v_kurang := array_append(v_kurang, 'NAME'); end if;$p$, '');
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

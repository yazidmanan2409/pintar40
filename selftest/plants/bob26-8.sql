-- bob26-8 — FINISHED WITHOUT A PASSWORD. complete_my_setup stops asking for the password written at activation.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.complete_my_setup()'::regprocedure);
  src := replace(orig, $p$if s.password_set_at is null then v_kurang := array_append(v_kurang, 'PASSWORD'); end if;$p$, '');
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

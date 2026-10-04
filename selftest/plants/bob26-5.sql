-- bob26-5 — ANYONE CORRECTS A NAME. correct_person_name forgets that it is the platform admin's.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.correct_person_name(uuid, text, text)'::regprocedure);
  src := replace(orig, $p$if not public.is_system_admin() then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

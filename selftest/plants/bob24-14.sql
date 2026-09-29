-- bob24-14 — SET-UP COMPLETES WITHOUT A PIN. complete_my_setup checks the username only.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.complete_my_setup()'::regprocedure);
  src := replace(orig, $p$or not exists (select 1 from public.person_pins pp where pp.person_id = v_person and not pp.reset_required)$p$, $p$$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

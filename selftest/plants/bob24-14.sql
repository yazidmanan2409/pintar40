-- bob24-14 — SET-UP COMPLETES WITHOUT A PIN. complete_my_setup stops asking for the PIN.
-- RESTATED FOR BOB-26: complete_my_setup was rewritten (20261112100000); the
-- same defect is planted in its new PIN clause.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.complete_my_setup()'::regprocedure);
  src := replace(orig, $p$if not exists (select 1 from public.person_pins pp where pp.person_id = v_person and not pp.reset_required) then v_kurang := array_append(v_kurang, 'PIN'); end if;$p$, $p$$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

-- bob24-10 — A RESTORE KEEPS THE OLD PIN. The recovery reset no longer forces a new PIN, so a known PIN survives it.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.recovery_restore_core(uuid, text, text)'::regprocedure);
  src := replace(orig, $p$update public.person_pins pp set reset_required = true where pp.person_id = p_person;$p$, $p$$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

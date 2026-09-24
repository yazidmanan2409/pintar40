-- bob03-1 — THE CREATOR BECOMES THE AUTHOR. The release is authored by whoever creates it, not by the course's author.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.create_release(uuid)'::regprocedure);
  src := replace(orig, $p$values (c.institution_id, c.id, v_label, c.author_person_id, v_prev.id)$p$, $p$values (c.institution_id, c.id, v_label, public.current_person_id(), v_prev.id)$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;

-- bob04-14 — C1w F-1 ROW 4 UNDONE. One sitting's misconceptions are read by the SEALED key again (not o.is_correct).
do $$
declare v text := pg_get_functiondef('public.session_misconceptions(uuid)'::regprocedure);
        v_in text := 'and not coalesce(o.label = any (kb.kunci), o.is_correct)';
begin
  if position(v_in in v) = 0 then raise exception 'bob04-14: session_misconceptions does not read the key in force where it did'; end if;
  execute replace(v, v_in, 'and not o.is_correct');
end $$;

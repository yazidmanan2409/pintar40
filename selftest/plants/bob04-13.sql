-- bob04-13 — C1w F-1 ROW 3 UNDONE. The reading map's remediation join takes the chosen option as wrong by the SEALED key
-- again: a learner right by the corrected key is sent to remediate it.
do $$
declare v text := pg_get_functiondef('public.reading_map(uuid)'::regprocedure);
        v_in text := 'and not coalesce(o2.label = any (g2.kunci), o2.is_correct)';
begin
  if position(v_in in v) = 0 then raise exception 'bob04-13: the reading map does not read the key in force where it did'; end if;
  execute replace(v, v_in, 'and not o2.is_correct');
end $$;

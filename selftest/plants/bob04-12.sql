-- bob04-12 — C1w F-1 ROW 2 UNDONE (the key shown). The teacher's per-question evidence shows the SEALED key as the key
-- again (is_key from item_options.is_correct): after a correction the teacher is shown the old key.
do $$
declare v text := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
        v_in text := '''is_key'', coalesce(q.kunci ? o.label, o.is_correct))';
begin
  if position(v_in in v) = 0 then raise exception 'bob04-12: the teacher''s evidence does not show the key in force where it did'; end if;
  execute replace(v, v_in, '''is_key'', o.is_correct)');
end $$;

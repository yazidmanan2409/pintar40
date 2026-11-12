-- bob04-20 — F1-R1b's marker read as "all" instead of "any": a question is marked only when none of its wrong options is
-- linked to a misconception.
do $$
declare v text := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
        a text := '''ada_tak_terkait'', exists (';
begin
  if position(a in v) = 0 or position('and o2.misconception_code is null)' in v) = 0 then
    raise exception 'bob04-20: the marker is not where it was';
  end if;
  execute replace(replace(v, a, '''ada_tak_terkait'', not exists ('), 'and o2.misconception_code is null)', 'and o2.misconception_code is not null)');
end $$;

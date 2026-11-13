-- bob04-21 — Daisy's refinement UNDONE: the teacher's marker reads the question's options again, not the answers in
-- its view, so a question whose unlinked wrong option nobody chose is marked, and tells the teacher nothing.
do $$
declare v text := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
        a int := position('''ada_tak_terkait'', exists (select 1 from jawab j2' in v);
        b int := position(E'and o2.misconception_code is null),\n' in v);
begin
  if a = 0 or b = 0 or b < a then raise exception 'bob04-21: the marker is not where it was'; end if;
  execute substr(v, 1, a - 1)
    || E'''ada_tak_terkait'', exists (select 1 from public.item_options o2 where o2.item_id = q.item_id\n'
    || E'                                           and not coalesce(q.kunci ? o2.label, o2.is_correct) and o2.misconception_code is null),\n'
    || substr(v, b + length(E'and o2.misconception_code is null),\n'));
end $$;

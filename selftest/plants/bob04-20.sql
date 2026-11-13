-- bob04-20 — F1-R1b's marker read as "all" instead of "any": a question is marked only when every wrong answer in the
-- view landed on an option not linked to a misconception. RESTATED (Daisy, 12 Nov: the teacher's marker reads the
-- answers in its view): "all" now means all the wrong answers, not all the wrong options.
do $$
declare v text := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
        a text := E'                                              and o2.misconception_code is null),\n';
begin
  if position('from jawab j2' in v) = 0 or position(a in v) = 0 then
    raise exception 'bob04-20: the marker is not where it was';
  end if;
  execute replace(v, a, E'                                              and o2.misconception_code is null)\n'
    || E'                                and not exists (select 1 from jawab j3 join public.item_options o3 on o3.item_id = j3.item_id and o3.label = j3.value ->> ''pilihan''\n'
    || E'                                                 where j3.item_id = q.item_id and j3.value is not null and coalesce(j3.nilai, 0) < 1\n'
    || E'                                                   and o3.misconception_code is not null),\n');
end $$;

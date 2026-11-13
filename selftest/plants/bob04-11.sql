-- bob04-11 — C1w F-1 ROW 2 UNDONE (the mark). The teacher's per-question evidence marks each answer by grade_response,
-- the sealed key, again (20261124100000's mark): a learner right by the corrected key is shown wrong.
do $$
declare v text := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
        v_in text := 'public.nilai_jawaban_berlaku(st.id, p.item_id, f.value) end as nilai,';
begin
  if position(v_in in v) = 0 then raise exception 'bob04-11: the teacher''s evidence does not mark by the key in force where it did'; end if;
  execute replace(v, v_in, 'public.grade_response(p.item_id, f.value) end as nilai,');
end $$;

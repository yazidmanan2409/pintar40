-- F1-R1b, Daisy's refinement (TINJAUAN-F1R1B-97a40ebb.md §1c item 3, on ux-1/daisy-experience at a13f30ff; the Chief
-- Architect's queue, "for Second Eye", item 2): the teacher's per-question marker says that answers in THIS view were not
-- counted among recurring misunderstandings. So it shows only when at least one answer in the view landed on a wrong
-- option that is not linked to a misunderstanding. Its second sentence is about answers («Jawaban pada pilihan itu tidak
-- masuk hitungan …»); on a question everyone answered correctly it told the teacher nothing.
--
--   * WHERE IT CHANGES: teacher_question_evidence only. In Studio the marker stays "any wrong option not linked": there it
--     is a fact about the question its author can act on.
--   * WHAT "WRONG" MEANS HERE: the answer was not right under its own sitting's key in force (nilai_jawaban_berlaku, as
--     the view's own count of right answers reads it), and the option it chose has no misconception code.
--   * STILL "ANY", NOT "ALL" (the owner's request on F13-K24): one such answer is enough.
--   * UNCHANGED: every other field of the view; the per-option facts; the misunderstanding figures.

do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
  v_old := E'               ''ada_tak_terkait'', exists (select 1 from public.item_options o2 where o2.item_id = q.item_id\n'
        || E'                                           and not coalesce(q.kunci ? o2.label, o2.is_correct) and o2.misconception_code is null),\n';
  if position(v_old in v_def) = 0 then raise exception 'F1-R1b: teacher_question_evidence does not mark where it did'; end if;
  execute replace(v_def, v_old,
       E'               -- F1-R1b, Daisy (12 Nov): an answer in this view landed on a wrong option not linked to a misunderstanding\n'
    || E'               ''ada_tak_terkait'', exists (select 1 from jawab j2\n'
    || E'                                             join public.item_options o2 on o2.item_id = j2.item_id and o2.label = j2.value ->> ''pilihan''\n'
    || E'                                            where j2.item_id = q.item_id and j2.value is not null and coalesce(j2.nilai, 0) < 1\n'
    || E'                                              and o2.misconception_code is null),\n');
end $$;

-- the migration's own check (ADR-0003: structural only; F13-K23 and F13-K24 prove the behaviour)
do $$
begin
  if position('from jawab j2' in pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure)) = 0 then
    raise exception 'F1-R1b: the teacher''s marker does not read the answers in its view';
  end if;
end $$;

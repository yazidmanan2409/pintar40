-- C1w F-1, Sharon's correction (C1W-F1-CORRECTION.md §0): the learner's own review (session_review) marks each answer
-- by the key in force (C1w), but returned the SEALED option's rationale beside it. After a governed key correction, a
-- learner whose answer is now right read a rationale calling it wrong, and one whose answer is now wrong read a
-- rationale calling it right.
--
--   * THE CORRECTION: where the chosen answer's mark by the key in force differs from its sealed mark, the review
--     returns no rationale for it (null). The mark stays the key in force's. Every other row, and every sitting with no
--     governed correction, is byte-identical: with no correction, nilai_jawaban_berlaku falls back to grade_response,
--     so the two marks are equal and the rationale is returned as before.
--   * The sealed content is not touched: the option keeps its authored rationale; only this reader withholds it.
--   * The migration's own check: removing the one fragment gives back the previous definition byte for byte.

do $$
declare v_def text := pg_get_functiondef('public.session_review(uuid)'::regprocedure);
        v_old text := E'           o.rationale,\n';
        v_new text := E'           case when public.nilai_jawaban_berlaku(p_session, f.item_id, f.value)\n'
                   || E'                     is distinct from public.grade_response(f.item_id, f.value)\n'
                   || E'                then null   -- F-1 (Sharon): a mark the key correction changed is not explained by the sealed key\n'
                   || E'                else o.rationale end,\n';
begin
  if (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old) <> 1 then
    raise exception 'F-1: session_review does not return the rationale where it did';
  end if;
  if position('public.nilai_jawaban_berlaku(p_session, f.item_id, f.value) = 1' in v_def) = 0 then
    raise exception 'F-1: session_review does not mark by the key in force (C1w)';
  end if;
  execute replace(v_def, v_old, v_new);
  if replace(pg_get_functiondef('public.session_review(uuid)'::regprocedure), v_new, v_old) is distinct from v_def then
    raise exception 'F-1: the corrected session_review is not the previous definition plus the one fragment';
  end if;
end $$;
revoke all on function public.session_review(uuid) from public, anon;

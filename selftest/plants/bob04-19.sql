-- bob04-19 — F1-R1b's teacher marker UNDONE. The per-question view never says that a wrong option is not linked to a
-- misconception.
-- RESTATED (Daisy's refinement, 12 Nov): it now turns F13-K24 red (world 1, an answer on an unlinked wrong option, reads
-- unmarked). F13-K23's world has no marked question under the refined meaning, so it cannot see a marker that is always off.
do $$
declare v text := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
begin
  if position('''ada_tak_terkait'', exists (' in v) = 0 then raise exception 'bob04-19: the marker is not where it was'; end if;
  execute replace(v, '''ada_tak_terkait'', exists (', '''ada_tak_terkait'', false and exists (');
end $$;

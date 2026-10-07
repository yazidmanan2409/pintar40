-- FD-5 (D-127 §4, D-129(c)): THE AUTHOR'S DIFFICULTY IS READ AS THE AUTHOR WROTE IT.
--
-- items.predicted_difficulty holds the AUTHOR'S difficulty. The workbook (unggah-kontrak.ts, KESULITAN) and every PINTAR
-- package write it Mudah 0.3, Sedang 0.5, Sulit 0.7: the higher, the harder. difficulty_band (20260913090000) read the
-- same column as a p-value («high means most learners get it right»), so an author's Mudah was drawn and shown as SULIT
-- and their Sulit as MUDAH: on the teacher's Uji Cepat choices (quick_assessment_choices) and in every paper drawn by a
-- difficulty mix (assemble_session's pool, and launch_quick_assessment's two MUDAH to one SEDANG).
--
-- The count (staging, read only, 7 Oct): 124 sealed questions of the four real schools and 729 of the synthetic school,
-- every one 0.3, 0.5 or 0.7; none in the PINTAR library. The value is in the sealed-content hash
-- (20260912124007_content_freeze_hash.sql:121) and frozen once a question is sealed (:292).
--
-- D-129(c), Option A: the reading is corrected, not the data. «The author's intended difficulty must be interpreted
-- consistently by PINTAR from ingestion through selection and human display. Existing sealed content must remain
-- cryptographically unchanged unless there is a compelling content-correction reason to reseal it.» So this migration
-- writes no row: no question, hash, release, import or package changes, and nothing is resealed. Papers already drawn
-- keep the questions they drew.
--
-- empirical_difficulty stays what it is, a measured p-value (high = most learners got it right). Nothing compares the
-- two today; a comparison would convert explicitly (1 - predicted_difficulty).
--
-- ENGINE and CATALOGUE: unchanged (the band is a reading of authored content, not a grading or metric rule).

create or replace function public.difficulty_band(p numeric) returns text
language sql immutable parallel safe set search_path = public, pg_temp as $$
  -- predicted_difficulty is the AUTHOR'S difficulty, the higher the harder: Mudah 0.3, Sedang 0.5, Sulit 0.7 (FD-5)
  select case when p is null then 'SEDANG' when p <= 0.4 then 'MUDAH'
              when p >= 0.7 then 'SULIT' else 'SEDANG' end
$$;
revoke all on function public.difficulty_band(numeric) from public, anon;
grant execute on function public.difficulty_band(numeric) to authenticated, service_role;

comment on function public.difficulty_band(numeric) is
  'The band of an author''s difficulty (FD-5, D-129(c)): at most 0.4 MUDAH, at least 0.7 SULIT, otherwise (and unset) '
  'SEDANG. The workbook and every PINTAR package write Mudah 0.3, Sedang 0.5, Sulit 0.7.';
comment on column public.items.predicted_difficulty is
  'The author''s difficulty, the higher the harder: Mudah 0.3, Sedang 0.5, Sulit 0.7 (FD-5, D-129(c)). Not a p-value; '
  'empirical_difficulty is the measured p-value. Sealed with the question (content hash).';

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
begin
  if public.difficulty_band(0.3) <> 'MUDAH' or public.difficulty_band(0.5) <> 'SEDANG'
     or public.difficulty_band(0.7) <> 'SULIT' or public.difficulty_band(null) <> 'SEDANG' then
    raise exception 'the author''s Mudah, Sedang and Sulit are not read as MUDAH, SEDANG and SULIT';
  end if;
  -- the readers still read the band through this one function
  if position('difficulty_band(i.predicted_difficulty)' in pg_get_functiondef('public.assemble_session(uuid)'::regprocedure)) = 0
     or position('difficulty_band(i.predicted_difficulty)' in
                 pg_get_functiondef('public.quick_assessment_choices(uuid,uuid)'::regprocedure)) = 0 then
    raise exception 'a paper''s draw or the teacher''s choices no longer read the band through difficulty_band';
  end if;
end $$;

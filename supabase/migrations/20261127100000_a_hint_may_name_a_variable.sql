-- STU-12 (N5): A HINT MAY NAME A VARIABLE; IT MAY STILL NOT NAME AN OPTION.
--
-- hint_reveals_answer_shape (20260912112712, INV-02) refused any single letter a-e after "the answer is", "not" or
-- between "atau"/"or", in either case. Options are lettered A-E in capitals (src/lib/unggah-kontrak.ts, labelPilihan),
-- but a mathematics hint names variables in small letters and an English hint uses the article "a": "Bandingkan nilai
-- a atau b", "whether c or d is larger" and "The answer is a whole number" were all refused (release checklist STU-12,
-- N5). Now a letter the old patterns find names an option only when it is a capital or bracketed, or, in "X atau Y",
-- follows an option word (pilihan, opsi, option, choice): "Jawabannya adalah B", "jawaban: (c)", "bukan A", "A atau C",
-- "(a) atau (b)", "pilihan a atau b" are still refused; small-letter variables pass. The three patterns, and where the
-- check applies (the coaching columns' CHECK constraints, assistance and import), are unchanged; the predicate only
-- refuses less, so no row that passed before can now fail, and the constraints need no revalidation.
--
-- Same signature, immutable and parallel safe, search_path pinned as 20260913120000 left it.

create or replace function public.hint_reveals_answer_shape(p_text text) returns boolean
language sql immutable parallel safe set search_path = public, pg_temp as $$
  with t(s) as (select p_text),
  -- each letter the three old patterns find, with what marks it as an option: an option word before it (o), a bracket
  -- (b), the letter itself (l). Every pattern is the old one, so nothing is refused that was not refused before.
  m(o, b, l) as (
    select null::text, x[1], x[2] from t, regexp_matches(s,
      '(?:jawab\w*|answer|kunci|key)[^.!?]{0,24}(?:adalah|ialah|is|:|=)\s*(\(?)([a-e])\)?\y', 'gi') x
    union all
    select null::text, x[1], x[2] from t, regexp_matches(s,
      '\y(?:bukan|not|selain|exclude[sd]?|eliminate)\s+(\(?)([a-e])\)?\y', 'gi') x
    union all
    -- "X atau Y": both letters capitals, or either bracketed, or an option word before them
    select x[1], coalesce(nullif(x[2], ''), x[4]), case when x[3] ~ '[A-E]' and x[5] ~ '[A-E]' then 'A' else 'a' end
      from t, regexp_matches(s,
      '\y((?:pilihan|opsi|option|choice)\s+)?(\(?)([a-e])\)?\s+(?:atau|or)\s+(\(?)([a-e])\)?\y', 'gi') x)
  select case when p_text is null or btrim(p_text) = '' then false
              else exists (select 1 from m where o is not null or b = '(' or l ~ '^[A-E]$') end
$$;

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
-- privileges as 20260912112903 set them: never PUBLIC or anon; the authoring and player paths call it as authenticated
revoke all on function public.hint_reveals_answer_shape(text) from public, anon;
grant execute on function public.hint_reveals_answer_shape(text) to authenticated;

-- verification: an option is still refused, a variable is not, the function keeps its kind, or nothing applies
do $$
declare v_vol char; v_par char; v_cfg text[];
begin
  if not public.hint_reveals_answer_shape('Jawabannya adalah B.') or not public.hint_reveals_answer_shape('bukan (c)')
     or not public.hint_reveals_answer_shape('A atau C') then
    raise exception 'STU-12: a hint that names an option is no longer refused (INV-02)';
  end if;
  if public.hint_reveals_answer_shape('Bandingkan nilai a atau b') or public.hint_reveals_answer_shape('The answer is a whole number') then
    raise exception 'STU-12 (N5): an ordinary hint is still refused as naming an option';
  end if;
  select p.provolatile, p.proparallel, p.proconfig into v_vol, v_par, v_cfg from pg_proc p
   where p.oid = 'public.hint_reveals_answer_shape(text)'::regprocedure;
  if v_vol <> 'i' or v_par <> 's' or not ('search_path=public, pg_temp' = any (v_cfg)) then
    raise exception 'hint_reveals_answer_shape is no longer immutable, parallel safe and pinned (its CHECK constraints rely on it)';
  end if;
  if has_function_privilege('anon', 'public.hint_reveals_answer_shape(text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.hint_reveals_answer_shape(text)', 'EXECUTE') then
    raise exception 'hint_reveals_answer_shape privileges differ from 20260912112903';
  end if;
end $$;

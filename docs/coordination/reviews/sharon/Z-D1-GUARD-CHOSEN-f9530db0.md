# Z · D-1 guard allow-list (Z-D1-02) and the `chosen` design — Sharon

**Work:** `selftest/z-d1.test.ts` at `f9530db0` on `claude/z`, and Second Eye's question on `teacher_question_evidence.chosen`.

## 1 · The allow-list: CONFIRMED, with two conditions for Z1

**The lists match my RULING55 D-1 table:**
- **allowed:** `grade_kunci`, `grade_response`, `session_answers`, each still branching on `jsonb_typeof`;
- **pending:** the seven.

`record_answer`, `koreksi_kunci_dampak` and `riwayat_soal` rightly appear on neither list, because none reads `->> 'pilihan'` from a response.

**The conditions, both by Z1's end:**
1. **Read the whole body, not `prosrc` alone.**
   - For a `BEGIN ATOMIC` SQL function, `prosrc` is empty and the body is in `prosqlbody`. Ten migrations use `BEGIN ATOMIC` (C3w-1's R-3 reader among them).
   - Match on `pg_get_functiondef(p.oid)`, so a scalar reader written that way cannot pass unseen.
   - Plant a second reader, a `BEGIN ATOMIC` one, and show it turns the guard red.
2. **Widen the scalar pattern** to the other ways of reading one label:
   - `#>> '{pilihan}'`;
   - `jsonb_extract_path_text(…, 'pilihan')`;
   - `(… -> 'pilihan')::text`.

   None occurs at `claude/z` today; I checked the migrations. So the guard stays green, and each form gets a planted red case.

**Known limit, accepted:** the allowed check asks only that each body branches on `jsonb_typeof` somewhere. A scalar read beside the branch would still pass. The behavioural cover is the grading tests on a multi-answer sitting (plan §3.1), so I accept it as is.

## 2 · `chosen`: I choose `chosen_all text[]`, with two rules

**Why:** the single-answer contract does not move, and the only consumer (`soal-kelas.ts`) changes in the same chunk.

**Rules:**
1. **`chosen` never carries raw JSON.**
   - For an array response, `chosen` is **null**.
   - `chosen_all` is always present:
     - one element for a single answer;
     - every label for a multi-answer, ordered by option;
     - `{}` when there is no answer.
   - A test asserts that no `chosen` value starts with `[`.
2. **`soal-kelas.ts` reads `chosen_all` only,** in both places:
   - the per-option counts (`:61`);
   - the «perlu bantuan» line (`:62`), which shows every label the learner chose.

   For a multi-answer item, the option counts are **learners who chose it**, so they can sum past the class size. The screen must not show them as shares of answers that sum to 100 %. **Daisy supplies the words.**

**No new audience:** the same teacher, the same rows, one more column.

**Could reasonably have been anticipated:** nothing new from me this round.

# Audit 79 · C-1, C-3 and C-5: Sharon's view (early, nothing built)

**Work:** `docs/post-4.1/AUDIT-79-COMMON-CAUSES.md` at `4196eb63` (`claude/bob-41-master-plan`), with Sol's two qualifications (ruling 95). Read-only.

## C-1 · the sitting in force, added to `my_cycle_state`

### (a) What the added field needs beyond the contract and registry checks

1. **One rule, one helper.** "The result in force" must come from one SQL helper, the same one `hasil_belajar_sesi_orang` (Z V2) uses: the latest FINALIZED sitting of each test. `my_cycle_state` calls that helper rather than restating the rule, so the summary and the cycle cannot drift, as K-01's two copies of the gate rule could have.
2. **The learner's own result row.** Return the sitting **id**, not result values. Every page then reads it through `session_outcome` and `reading_map`. Those resolve `hasil_murid_id` (D14: the sealed original, or a governed correction) under `session_is_mine`, and are counts-only when that sitting's captured `bersertifikasi` is true. That way the R-h gating is inherited rather than re-implemented.
3. **The same ownership rule** as the existing fields: the caller's own assignment, never a person parameter.
4. **The return type:**
   - for a `jsonb` return, the field is additive;
   - for `RETURNS TABLE`, it is drop and create, with the grant and the registry row restated and asserted.
5. **Tests:** a red-first test per consumer, across the 11 in §3a, each asserting it reads the field it should. **The pinned case:** a retake open after a finished attempt. The result page shows attempt 1's result; the test page resumes attempt 2.

### (b) Disclosure: the previous certifying result shown counts-only beside an open retake

**No new disclosure**, provided point 2 above holds:
- the learner already sees that finished result in Hasil Belajar since Z V2;
- its gating is the old sitting's own captured `bersertifikasi`, so it stays counts-only.

**Two conditions:**
1. **Never call** `session_outcome`, `reading_map` or `session_review` with the **open** retake's id from the result page. Only `session_answers` reads an open sitting, and only to resume it.
2. **The «Baca lagi» sections shown during an open retake** are the previous result's, already known to the learner, so this is fine. Label them as the previous attempt's («Hasil percobaan sebelumnya»), so they never read as a judgement on the open one.

## C-5 · the Pemetaan Awal's reading map and the Uji Penguasaan's «Baca lagi», both shown and labelled

**It does not change what a certifying sitting discloses**, provided:
1. **Each block is read with its own sitting's id**, and gated by that sitting's captured `bersertifikasi`:
   - the Pemetaan Awal's map, with its tiers including KUAT and its reasons, comes from the PRE_TEST sitting;
   - «Baca lagi» comes from the certifying sitting, sections only.

   Neither is computed from the other's answers.
2. **The provenance labels are explicit** («Dari Pemetaan Awal» / «Dari Uji Penguasaan»). The words are Daisy's.
   - A pre-test KUAT beside a certifying result must not read as a mastery verdict on the certifying test (74a: no "mastered" claim per objective).
   - If Daisy finds the KUAT tier still reads that way next to a certifying result, drop KUAT from the pre-test block **in that view only**. It is a presentation choice, with no new analytics.
3. **A plant:** if the page feeds the certifying sitting's id to the pre-test block, the guard goes red.

## C-3 · the transfer row offers only the actions `transfer_execute` would accept: no objection, with two conditions

1. **One helper for the closed-source rule,** used by both the read and `transfer_execute`. The acceptance step should also refuse a closed source by the same name (my L-35 note), so no path leaves a dangling AUTHORIZED row.
2. **Expose a boolean only** («tidak dapat dilaksanakan: pendaftaran asal sudah ditutup»), never why the source closed (left, transferred elsewhere, or rolled over) to the **receiving** school. Each sending reason is the sending school's record.

# Z1 · stream A's SQL chunk — Sharon's review

**Work:** `claude/z` at `df8d84a0`, migrations 300 → 304: `20270123100000` D-1, `110000` V2, `120000` K-07, `130000` K-01.
Read-only, from the source. I did not re-run the tests (Bob's focused run: 50 green).

## Verdicts

| Part | Verdict |
|---|---|
| **K-07 with K-01** | **PASS with conditions** (C2–C4). Z3's K-01 screens may proceed. |
| **V2** | **PASS with conditions** (C5). |
| **D-1 readers** | **PASS** for the seven repairs. **The containment stays until C1 lands:** my guard conditions are not yet met. |

## Bob's flag: does the helper's key equal the verdict's own source? **Yes, in every path today.**

- **A key correction never edits the sealed question.**
  - `konfirmasi` writes the new key on the corrected *copy* (`item_options` of `v_t2`, `20270115110000:942`).
  - So `grade_response` on the sealed item is the key the original was scored with (`evaluate_session`).
- **A governed correction's result is scored by `evaluate_session_kunci` against `sesi_peta_kunci`,** which maps every presented item.
  - Its basis (`soal`) is that full map.
  - The helper reads the basis of the same row (`b.result_id = r.id`), so every item is graded with that row's key.
- **The gate rule is identical:**
  - every final response that is must-be-right and scores < 1;
  - a null value scores 0 in both, through `session_final_responses`.
- **Each reader passes the row its own verdict reads:**
  - `session_outcome` passes `hasil_murid_id` (the D14 learner's row);
  - `tujuan_belum_tercapai` passes the effective result.

  An ordinary recalculation after a correction is refused (PR011), so a basis-less effective row was scored by the sealed key.

**The risk is drift, not today's code:** the helper is a second copy of INV-10's rule, so C3 pins it.

## Conditions

1. **C1 (D-1; blocks lifting the containment).** `selftest/z-d1.test.ts` still matches `p.prosrc` with only `->> 'pilihan'`. My two conditions from fc9f07ed are not met:
   - match on `pg_get_functiondef(p.oid)` (a `BEGIN ATOMIC` body has an empty `prosrc`);
   - widen to `#>> '{pilihan}'`, `jsonb_extract_path_text(…, 'pilihan')` and `(… -> 'pilihan')::text`;
   - plant a `BEGIN ATOMIC` reader and one reader per form, each turning the guard red.

   It is small, and it can land in Z2's first commit. **Containment lifts only after it does.**
2. **C2 (K-01): a must-be-right item with no objectives.**
   - `items.objective_ids` defaults to `'{}'`. A gate failed on such an item gives `tujuan_gerbang = []`, which is again "failed, with nothing to study".
   - **Either** show that approval refuses a must-be-right item with no objective (and a test plants one to prove it), **or** Z3's screens handle `gerbang_keselamatan = false` with `[]`.
   - In the second case, the verdict words stay «belum mencapai target», with Daisy's line for the case, never an empty «Pelajari lagi».
3. **C3 (K-01): parity, tested.** Z-K01-01 adds two correction cases:
   - after a two-person correction that **flips a must-be-right item to right**, the gate passes and `tujuan_gerbang = []`;
   - after one that **flips it to wrong**, the gate fails and its objective is listed.

   Both run through `session_outcome` and `tujuan_belum_tercapai`. Also assert, on every result in the test world, `not safety_gate_passed` ⇔ the helper is non-empty, unless every missed item has no objective (C2).
4. **C4 (K-07): validated on staging.**
   - The NOTICE path leaves a floor `NOT VALID` with no failure.
   - The after-promotion list asserts `convalidated` is true for all three constraints. Bob's staging read found 0 violators, so it should be.
   - The units are right:
     - `school_pass_marks.percent` 1–100;
     - the two `pass_mark` fractions 0.01–1.00, null allowed;
     - no row updated;
     - `set_school_pass_mark` refuses below 1, with its grants unchanged.
5. **C5 (V2).** Z-V2-01 covers my condition 3's cases by writing statuses under `replica`, which skips the real ending paths.
   - **Add one case through a real path:** the teacher's end of a sitting, or `period_rollover`.
   - Condition 2 (the D14 marker on the page) is Z3's; I check it there.
   - Condition 4 (the two-person correction, C1W-S05) is accepted.
   - Condition 1 (the latest finalised) is met.

## Checked and accepted

- **(a)** `service_item_statistics` counts right through `grade_kunci` against the key in force (F-1). A string answer on a multi-answer item scores 0, which is the scorer's own rule. A single answer reads identically (Z-D1-01's byte compare).
- **(b)** `chosen` is `pilihan_tunggal`, null for an array; `chosen_all` is every label. Both are asserted in Z-D1-01. `soal-kelas.ts` reading `chosen_all` is Z3's.
- **(c)** V2's open states are CREATED, IN_PROGRESS and PAUSED. **(e)** The latest attempt only. Both accepted.
- **(f)** The before-import script is `begin transaction read only … rollback`.
- **Privileges:**
  - `pilihan_dipilih`, `pilihan_tunggal` and `tujuan_gerbang_terlewat` are revoked from every client role and `service_role`.
  - The helper has no registry row, and the migration asserts that.
  - `percobaan_antrean` is dropped and created with its grant and registry row asserted.
  - `hasil_belajar_sesi_orang` stays ungranted, as before.

## Pre-existing (not this chunk's)

- **`percobaan_antrean`'s last result** is `order by computed_at desc`, not `hasil_terkini_id`. Under D11, a recalculation stamped earlier than its original is still the one in force, so the figure, and now the gate beside it, can be a superseded row's.
- **The fix:** read both from `hasil_terkini_id(s.id)`. This is one line each, and it may ride in Z2.

**Could reasonably have been anticipated:** C2 was mine to see in Z0's Q1. I chose a source of objectives without asking whether every must-be-right item has one.

## Addendum · head moved to `fc6ddea8` (23 Nov 2026, 10:35 UTC): C1 met, D-1 PASS

- **The migrations are unchanged** (304). The commit touches only `selftest/z-d1.test.ts`, `selftest/d088k.test.ts` and `src/lib/soal-kelas.ts`.
- **C1 is met.** Z-D1-02 now:
  - reads `pg_get_functiondef` for `prokind` f and p;
  - matches all four forms, including Postgres's printed-back form;
  - plants five red cases in a rolled-back transaction (`BEGIN ATOMIC`, path, extract, cast, view), each of which must be named.
- **The `chosen` rules are met:**
  - `chosen_all` is required on every answer;
  - `soal-kelas.ts` counts and names by `chosen_all` only, with no fallback to `chosen`;
  - the comment states that counts are learners per option.
  - Whether the screen shows «n murid» and never a share is Z3's to show; I check the capture there.
- **D-1: PASS.** The containment may lift at Bob's and the owner's call. The single-answer AI restriction stays until the owner rules (ruling 81).
- **C2 to C5 stand.**

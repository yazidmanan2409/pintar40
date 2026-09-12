# Content Freeze — SD5 Pecahan Pilot

Baseline frozen for the **August 10 Bug Bash**. Schema, seeded items, and
misconception taxonomy are fixed until after the bash unless an entry below
says otherwise.

---

## Content Freeze Exception #001 — SD5 fraction bank taxonomy codes

**Logged:** 2026-07-30
**Scope:** `soal` where `id_subjek = 'subj_matematika_sd5'` (75 items, 225 distractors)
**Status:** ACKNOWLEDGED — NOT FIXED. Baseline frozen. No new taxonomy codes
before the Bug Bash.

### Finding

24 of 225 distractors carry a `misconception_code` that does not match the
misconception their own `rasional` prose describes. The prose is correct; the
code is the part that is wrong. Two systematic clusters:

**Cluster A — wrong operation coded as wrong-denominators (13 items)**

    frac_011, 013, 014, 015, 024, 027, 041, 043, 044, 045, 052, 054, 068

Coded `FRACTION_ADD_DENOMINATORS` / `FRACTION_SUBTRACT_DENOMINATORS`, but the
rationale describes a learner who applied the wrong OPERATION to the
numerators (read `−` as `+`). Different error, different remediation: one
learner does not understand that the denominator names the piece size; the
other misread a sign.

**Cluster B — misidentified whole coded as numerator-only comparison (7 items)**

    frac_001, 002, 016, 031, 032, 057, 061

Coded `COMPARE_NUMERATOR_ONLY`, but the learner chose a wrong DENOMINATOR
(picked `3/5` when the pizza had 8 slices) — they do not yet know the
denominator is the whole. `COMPARE_NUMERATOR_ONLY` describes choosing `5/8`
over `3/8` by reading only the top number.

**Likely false positives (not counted as defects): 4 items**

    frac_004, 034, 058, 019

`LARGER_DENOMINATOR_MEANS_LARGER` where the prose mentions the numerator
while giving a correct comparison hint. The detection heuristic was lexical.

### Root cause

The taxonomy has **5 codes for 225 distractors**, with no code for "applied
the wrong operation" or "misidentified the whole". Authors reached for the
nearest available code, so the codes read as more precise than they are.

    76  COMPARE_NUMERATOR_ONLY
    44  FRACTION_ADD_DENOMINATORS
    36  LARGER_DENOMINATOR_MEANS_LARGER
    36  EQUIVALENT_MULTIPLY_ONE_SIDE
    33  FRACTION_SUBTRACT_DENOMINATORS

### Consequence accepted for the Bug Bash

Delivery, grading, and response logging are unaffected — only the *label* on
the diagnosis is imprecise, for roughly 9% of distractors.

**This shaped the results view.** The learner-facing per-item feedback shows
the AUTHORED rationale (`rasional_klinis.mengapa_distraktor_keliru`), which is
correct prose. Code-derived tips are secondary and only surface when **two or
more items share a code** — so a single miscoded item cannot put a misleading
tip in front of a child. See `lib/sd5-hasil-db.ts` (`AMBANG_KELOMPOK`).

Educator-facing aggregation by code should be treated as approximate until
this is resolved.

### Proposed post-bash fix (not scheduled)

Add `WRONG_OPERATION_ON_NUMERATORS` and `DENOMINATOR_NOT_WHOLE`; remap the 20
confirmed items. Requires review of a 20-row before/after table by whoever
owns item authoring. Cannot be done silently: `item_response_logs` rows
already logged against the old codes would need reconciling, so any remap
must record the mapping version.

---

## Related migrations (applied to staging 2026-07-30)

    0026_response_log_alignment.sql       response log columns + pintar_catat_respons()
    0027_seed_sd5_databank_rasional.sql   75 items + rasional_klinis (supersedes 0020)
    0028_distribute_answer_keys.sql       answer keys distributed across A–D

`0020_seed_sd5_databank.sql` must NOT be run — it aborts on
`trg_kelayakan_status` because it does not supply `rasional_klinis`.

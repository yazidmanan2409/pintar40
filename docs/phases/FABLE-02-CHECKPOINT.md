# FABLE-02 — checkpoint

Phase: PLP content model, lifecycle, evidence schema and the consumption
boundary. Migrations 0014–0029. Status at the last commit on `main`.

## Acceptance checklist → evidence

Every line of the phase prompt's checklist, and the acceptance id that proves
it. "Structural" means a migration's own verification block fails at apply
time; "behavioural" means a test in `selftest/db/fable02.sql` runs it against
seeded data.

| Checklist item | Evidence | Kind |
|---|---|---|
| INV-02 a hint naming or narrowing the answer fails | `F02-T22` | behavioural |
| INV-03 an option with an empty rationale fails | `F02-T22` | behavioural |
| INV-04 / INV-22 freeze hash, taught-content immutability, transition graph | `F02-T01`, `F02-T03`, `F02-T05`, `F02-T06`, `F02-T07` | behavioural |
| INV-32 PUBLISHED is a human `CAN_PUBLISH` act, no service path | `F02-T03`, `F02-T08` | behavioural |
| INV-35 Publish Readiness blocks on ERROR findings; FROZEN → PUBLISHED re-checks | `F02-T19` | behavioural |
| INV-12 EXAM never leaks down | `F02-T11` | behavioural |
| INV-24 post-test excludes pre-test items **and siblings** | `F02-T23` | behavioural |
| INV-13 cohort view differs per institution, no learner id | `F02-T24` | behavioural |
| INV-33 provenance required, derived and immutable | `F02-T12`, `F02-T13` | behavioural |
| INV-20 non-official evidence never reaches `official_*`; analytics holds no raw grant | `F02-T17`, `F02-S01` + CI red case | behavioural + static |
| INV-11 no scoring view or function references telemetry | `F02-T16` | behavioural + structural |
| INV-28 one row per receipt; conflicting replay refused | `F02-T14`, `F02-C01` | behavioural + concurrent |
| INV-29 scoring provenance required; results immutable; recomputation is a new row | `F02-T15` | behavioural |
| Predicted vs empirical: no seeded empirical value, no default | `F02-T24` | behavioural |
| INV-27 `CLOSED` stops new sessions only | `F02-T20` | behavioural |
| Release move on an ACTIVE assignment is audited | `F02-T20` | behavioural |
| INV-01 tenant isolation on content and evidence | `F02-T10`, `F02-T18` | behavioural |

## What is deliberately not here

- **Adversarial MCQ banks.** §9 says the Phase 2 fixtures include the
  adversarial banks from doc 16 §4. That document is not in this repository.
  `run_mcq_quality()` implements five pattern classes and `F02-T19` exercises
  the validator end to end, but the named adversarial fixtures are not
  reproduced from memory. They belong with doc 16 when it arrives.
- **`misconception_taxonomy` validation sweep.** The field is registered with
  the validator, but the taxonomy is keyed by a text code rather than scoped to
  a course, so the sweep lands with the ingestion migration that first writes
  taxonomy rows. Named in `0027`.
- **Everything the engine does.** Drawing, scoring, timing, delivery. FABLE-02
  owns the schema; FABLE-03 owns the engine that operates on it. The functions
  here — `drawable_items_for_definition`, `excluded_items_for_post_test`,
  `exam_item_is_cooled`, `publish_readiness` — are what the engine must call,
  not the engine.

## Defects this phase found in its own work

Both were found by testing, not review, and both are fixed with a regression.

1. **Cross-tenant release seal.** A person holding `CAN_DRAFT` in institution A
   and `CAN_FREEZE_RELEASE` in B could carry A's release into B and seal it in
   one statement: RLS evaluated `USING` on the old row and `WITH CHECK` on the
   new, and the status trigger read the capability from `NEW.institution_id`,
   which the same statement had just written. Root cause was a FABLE-01
   convention that FABLE-02 failed to carry forward — eleven institution-scoped
   tables with no tenant guard. Fixed in `0019`: `institution_id` immutable, and
   the capability read from `OLD`. Regression `F02-T10`.
2. **`audit_write` called with the wrong argument shape.** `0025`'s evidence
   reclassification guard passed `(uuid, text)` where the signature is
   `(text, jsonb)`. plpgsql resolves at run time, so the migration applied
   cleanly and it would have failed the first time anyone reclassified a
   session, taking the reclassification with it. Repaired forward-only in
   `0028`. It survived because on a synthetic tenant no override is possible at
   all — `SYNTHETIC` is the floor and an override may only weaken — so the path
   is reachable only on genuinely official evidence. `F02-T17` now walks it.

## Two invariants that changed, and why

- **`anon_table_grants = 0`** was right while nothing in the product was
  public. §8 requires a publicly readable lesson view, so the counter now
  excludes that one view and two new counters report the public surface
  explicitly. F01-T13 still asserts zero and now also reports
  `anon_public_surface: 1`. Narrowing a counter while leaving it named "zero"
  would have been the dishonest version of this change.
- **`open_assessment_session` gained two arguments** in `0029`. Session
  provenance included the assignment ids from `0021`, but the assignment tables
  did not exist until `0028`, and provenance is immutable after insert — so
  they could not be filled in later. The old signature was dropped rather than
  overloaded.

## Standing state

29 migrations replay from empty on a clean PostgreSQL cluster; the synthetic
seed applies; the selftest manifest runs green except `F01-R01`, which needs a
reachable Supabase API and passes in CI. Every schema-lint counter is zero,
`anon` holds exactly one grant, and the runner leaves no probe row behind.

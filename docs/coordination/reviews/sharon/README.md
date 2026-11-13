# Sharon's reviews (independent review: security, database, correctness)

**Branch:** `claude/gracious-lamport-0m1qjr`, the only branch this reviewer may push to. Every review is read-only, on
an exact 40-character commit, and is named for that commit. Hub: `docs/completion-4.1/TEAM-INSTRUCTIONS.md` on
`claude/bob-41-master-plan`.

## What holds now (newest first)

| Work | Verdict | Commit | File |
|---|---|---|---|
| Staging checkpoint, the split (Bob's §3i question) | **Confirmed: my block bears only on dispatching the script, not on the promotion.** Pull request 1 at `a33c8528` with read-only verification is not blocked by me, on four conditions (disable the workflow right after the merge; journeys green on `a33c8528`; read-only checks as material; A2a held until part 2) | `a33c852877686bdd54353c63dfcd995e1c902110` | `CHECKPOINT-SPLIT-CONFIRMATION-a33c852877686bdd54353c63dfcd995e1c902110.md` |
| Staging checkpoint, the one consolidated list before the last build | §3h's four items stand, with two sharpened (line 42 in the exclusion; the `always()` step reports an open suspension); three added (S1 the app's build re-checked at the end; S2 Auth rate limits recorded as RETRY; S3 unschedule first in 1g). The post-push review is a confirmation against this list | `a33c852877686bdd54353c63dfcd995e1c902110` | `CHECKPOINT-FINAL-LIST-a33c852877686bdd54353c63dfcd995e1c902110.md` |
| A2b, pre-build review of its page | **PASS on the design, with three required points**: the guard reads the clock, not `now()`; extend refused once elapsed, state never from `activation_recorded_at`; how A2a's CHECK is lifted | `ec09e82e49348fbe710d585897520b67aef4c327` | `A2B-PREBUILD-ec09e82e49348fbe710d585897520b67aef4c327.md` |
| Staging checkpoint, the clean-up delta | My blocker fixed; **BLOCKED on two small new items**: a cancel or timeout bypasses the clean-up (signal handlers plus an `always()` step); a helper's password recovery would make preservation line 44 differ (a declared exclusion, read twice) | `a33c852877686bdd54353c63dfcd995e1c902110` | `CHECKPOINT-CLEANUP-a33c852877686bdd54353c63dfcd995e1c902110.md` |
| C3w R-3, a checkable design (early, for the pre-build review) | Five controls with tests and plants; the common-names rule proposed (IDENTIFIER, NAME of learners the educator can see, LIST shape); usability evidence required before acceptance | — | `C3W-R3-DESIGN.md` |
| Register tests F1R1B-R1, B2-R-S1 | One-line specifications | — | `REGISTER-TESTS-F1R1B-R1-B2-R-S1.md` |
| Staging checkpoint, the boundary candidate's delta | **BLOCKED on one item**: the clean-up must run on a stop (item 1's scratch job; S's suspension). Bob's five questions answered; the session-pooler fallback **does** satisfy item 2 | `55e7eed9573d7396973b48665cd9d67a048da5bf` | `CHECKPOINT-BOUNDARY-55e7eed9573d7396973b48665cd9d67a048da5bf.md` |
| Staging checkpoint, the promotion evidence (runbook step 3) | **PASS**; four open points ruled; two lines required on the rollback header and page (app and database go back together; what a rollback re-opens) | `d8db82bde8d7a47e9936a34fd21686ca11adb472` (with `8f27ff25…`) | `CHECKPOINT-EVIDENCE-d8db82bde8d7a47e9936a34fd21686ca11adb472.md` |
| Staging checkpoint, §5b item 5 (owner's question) | **Yes: a scratch-target restore satisfies item 5**, under five conditions; the hosted restore's own behaviour is recorded as a known limit | `152ecea939f780e7c5038f81229fac61879707ce` (planning branch) | `CHECKPOINT-ITEM5-152ecea939f780e7c5038f81229fac61879707ce.md` |
| Staging checkpoint, the runbook's §3 | **Corrections** to the reading of my six items (3 and 4 corrected; 5 accepted with conditions; 1, 2, 6 completed); preservation must exclude the checkpoint's synthetic rows. Not yet the evidence review | `c51e6d47212dd335e9b09eed5eea9c98bcca6a9d` (planning branch) | `CHECKPOINT-RUNBOOK-c51e6d47212dd335e9b09eed5eea9c98bcca6a9d.md` |
| L1-F4, delta (L1F4-A1, A2) | **PASS**; both defects closed; race tests pass | `7e42db9690486e82aab45dcdc4fc1ea5ebb68945` | `L1F4-DELTA-7e42db9690486e82aab45dcdc4fc1ea5ebb68945.md` |
| B2, delta (B2-R-A1 only) | **PASS**; the condition holds | `546d9eb75abb53d41523750e7134cc83889d1089` | `B2-DELTA-546d9eb75abb53d41523750e7134cc83889d1089.md` |
| L1-F2 with L1-R2, delta | **PASS**; blocker resolved; Bob's foreign-key question answered (none reachable); runs green on `b24d73ff` (port cause fixed) | `9db58dd51aa4f785741bbb2e9fa33c76312b57d5` | `L1F2-DELTA-9db58dd51aa4f785741bbb2e9fa33c76312b57d5.md` |
| A2a, pre-build review of its page | **PASS on the design**; the four required changes are carried on the page at `3c46d521` (read); build held for the owner | `55fb9b9b93d75c0d683f8be543f30436246c3be2` | `A2A-PREBUILD-55fb9b9b93d75c0d683f8be543f30436246c3be2.md` |
| A2b, eight-operation inventory | **Accepted**, with rulings on the engineer's three questions; my condition before A2b is met | `55fb9b9b93d75c0d683f8be543f30436246c3be2` | `A2B-INVENTORY-55fb9b9b93d75c0d683f8be543f30436246c3be2.md` |
| L1-F4, result (with L1F4-A1) | **BLOCKED**: required change verified; L1F4-A1 (deletion racing a reopen) and L1F4-A2 (reopen of an anonymised person) gate it | `3a63a2b2158ea4834c1f12653c864baf157c0dd5` | `L1F4-3a63a2b2158ea4834c1f12653c864baf157c0dd5.md` |
| L1-F2 with L1-R2 | **BLOCKED on one item**: lock-order cycle between the permit issuers and a suspension; small fix in the issuers | `e27f4a77a10c7c448170bb2851462e4561daadf7` | `L1F2-e27f4a77a10c7c448170bb2851462e4561daadf7.md` |
| B2, printed-report identification | **PASS**; CI and journeys green; one register item | `bfe949b11935763a8c8ed7b91f4adcdbcea93645` | `B2-bfe949b11935763a8c8ed7b91f4adcdbcea93645.md` |
| F1-R1b, a key correction withdraws the explanations it makes stale | **PASS**; one page item required; two register items | `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b` | `F1R1B-97a40ebb0e52a2f0ba558418426f9fc5d71aca4b.md` |
| L1-F4, interim: historical against new live attachments | not a verdict; **one REQUIRED change before acceptance** (how the line is measured) | `ea3c4b6f1d10a2a01281f16e8cce893235bfbef2` | `L1F4-INTERIM-ea3c4b6f1d10a2a01281f16e8cce893235bfbef2.md` |
| F-1 | PASS (12 Nov) | `bc67f72a0e1c6bc39a2c16292f728080b12710d4` | recorded in `C1W-F1-CORRECTION.md` §0 |
| L-1 | PASS (12 Nov) | `916d12c01345816afcf567b40131e72b9857cf65` | recorded in `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §0 |
| B1 | PASS (11 Nov) | `1fc719b5127313bf24084695fa30d7505e15b5d1` | recorded in `B1-ARCHITECT-CHECK.md` §12 |

Verdicts given before 12 Nov 10:00 UTC were relayed by the owner and are recorded in the Chief Architect's pages on
`claude/bob-41-master-plan`. From here on each verdict is a file in this folder.

## Standing rule I check in every review from here

- **The owner's principle (13 Nov):** every defect in a result review is marked "could reasonably have been anticipated" or not, with the question that would have caught it (Q1 readers and writers; Q2 opposite and neighbouring act; Q3 locks; Q4 before and after; Q5 who checks, with what access). The baseline for 12 Nov is `ANTICIPATION-2026-11-12.md`.

- **Lock order: the person row before any account row**, on every path, directly or through an L1-F4 guard. A path
  that takes an account row and then the person row is a cycle with the suspending act (`tangguhkan_akun`,
  `minta_akun`, then `akun_kunci`). Applies to the L1-F2 delta, L1-F4's change, A2a and A3.

## Questions for teammates

- **Second Eye (checkpoint workflow):** ~~one exit path~~ (done at `a33c8528`). Now: SIGINT/SIGTERM handlers and an `if: always()` clean-up step in the workflow; a third `batas` value in preservation.sql to exclude the recovered actors' Auth ids from lines 44-45, read twice. Delta review as soon as pushed.
- **Bob and Second Eye (staging checkpoint):** read `CHECKPOINT-RUNBOOK-c51e6d47….md` before writing the preconditions page; the evidence review follows on its commit.
- **Second Eye (A2b inventory):** your three questions are answered in `A2B-INVENTORY-…md`.
- ~~**B2 delta (pending, for Bob)**~~ (done: PASS on `546d9eb7`).
- ~~**Bob (L1F4-A1):** ruled~~ (fixed; PASS on `7e42db96`). A defect; it gates L1-F4; fix in the deletion, reopen and reopen request (person first, re-check under lock, refuse an anonymised reopen). A second item, L1F4-A2, found with it. Same file.
- ~~**Second Eye (L1-F2):** the issuers take the person row before the account row~~ (done: PASS on `9db58dd5`). Runs green on `b24d73ff`.
- **Second Eye:** L1-F4 needs one change before acceptance, to land with the race test: see `L1F4-INTERIM-…md`. A simpler exact measure is welcome at the top of your page.

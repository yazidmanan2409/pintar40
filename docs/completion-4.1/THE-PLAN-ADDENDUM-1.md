# PINTAR 4.1 · THE PLAN · Addendum 1

> **DRAFT — NOT EFFECTIVE.** Prepared by the Chief Architect on 12 November 2026 (07:26 UTC) on the owner's ruling
> M-D. It takes effect only on the owner's explicit approval. One item (§5, the split of A2) also waits for Sharon's
> confirmation.
>
> **THE PLAN is unchanged.** `THE-PLAN.md`, owner approved at `17cf4a7e59ce7a8f11dd976e2c198ea08977e1ef`, stays
> byte-identical and remains the plan. This addendum records what has been added to it, where execution departs from
> its text and by whose ruling, and the owner's rulings of 12 November on its execution. **Where this addendum and
> THE PLAN differ, this addendum governs, and only on the points it names.**

## 1 · Where execution stands

| | State | Commit on `claude/system-integrity-4.0` |
|---|---|---|
| B0, A1, C1w | Closed | `3a190dbfaad5ed71484ae8fc91a1fe4608cf5345` |
| B1 | Closed | `1fc719b5127313bf24084695fa30d7505e15b5d1` |
| L-1 (suspended sign-in) | Closed | `916d12c01345816afcf567b40131e72b9857cf65` |
| F-1 (corrected answers read by the key in force) | Closed | `bc67f72a0e1c6bc39a2c16292f728080b12710d4` |
| B2 | Open for build | — |

Nothing is merged, promoted or deployed.

## 2 · The sequence, as it now stands

```
B1 ✔ ─► L-1 ✔ ─► F-1 ✔ ─► B2 ─► [staging checkpoint, if authorized] ─► A2a ─► A2b ─► C2w ─► A3 ─► C3w ─► Z
                           └ small corrections, around B2 and before the checkpoint: S-1, L1-F4, F1-R1b, L1-F2
E (provider evaluation): preparation running alongside from 12 November
```

The order of THE PLAN §3 is unchanged. What is added: the corrections, the checkpoint, and the split of A2.

## 3 · Corrections added to 4.1

Each is a defect in existing behaviour found while executing the plan. None adds a capability. Each has its own
brief, which holds its design, tests and rulings.

| Id | What it corrects | Ruling | Brief | State |
|---|---|---|---|---|
| **F-1** | After a key correction, derived views still marked answers by the original key | Mandatory before C1w's promotion (owner, 11 Nov) | `C1W-F1-CORRECTION.md` | Closed |
| **L-1** | A suspended or closed account's sign-in answered "service unavailable", disclosing its state; a recovery grant could set a password on a locked account | Approved (owner, 11 Nov) | `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` | Closed |
| **S-1** | The open phone drawer wider than the screen | Approved (owner, 11 Nov) | on the work branch | Built; Daisy verifies with B2 |
| **L1-F2** | A person suspended before having an account could be given an unlocked one | Option B (owner, 12 Nov) | `SUSPENSION-COVERS-NEW-ACCOUNTS.md` | Released; takes L1-R2 |
| **L1-F4** | An anonymised person could be re-attached | Approved; a certificate newly earned is recorded, not issued (owner, 12 Nov) | `ANONYMISED-PERSON-IS-TERMINAL.md` | Built; not accepted until its two-connection race test passes |
| **F1-R1b** | A key correction left stale explanations on the corrected revision | Option A; INV-03 amended narrowly, option A1 (owner, 12 Nov) | `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` | Built; in pre-flight |

**Register (non-blocking; each done before Z):** B1-R1 to R5 (in B2); L1-R1 (show "PIN reset required" at
reinstatement); L1-R2 (with L1-F2); F1-R2 («kunci diperbaiki» where Question Health shows a corrected item).

**Carried to later versions, not 4.1:** whether distractor uptake's key flag follows a corrected key (a catalogue
question, with the 4.5 item-statistics work); school-facing notices of unrecorded accountability events (needs an
attribution mechanism).

## 4 · Where execution departs from THE PLAN's text

| THE PLAN | What holds instead | By whose ruling |
|---|---|---|
| §5.1 D: the event's `institution_id`, one school | `institution_ids`, a snapshot computed in the database; a print belongs to the school that owns the printed resource; a school admin's reader returns only the caller's own school | Sharon (pre-build and result reviews of B1); Chief Architect |
| §5.1 D invariant 1: rows are insert-only | One governed exception: personal-data deletion clears the network origin and the identifier hash | Sharon |
| §5.2 D and F: the print's school; the default browser line naming the viewer | A learner's own-results print belongs to the schools whose evidence is on the printout (owner, 12 Nov). The default line names no person and marks the device's clock | Owner; Sharon; Daisy's wording |
| §5.2: the completeness of the accountability reader | The platform admin's reader carries a qualified notice when unrecorded events are detected (B1-R4) | Owner, 11 Nov |
| §5.3 H: "A2's shared multi-connection helper" | Built once, in L1-F2, and used by L1-F4, A2a and A3 | Chief Architect |
| §5.3 and §5.5: two enumeration tests | One enumeration of everything that writes a sitting, built in A2a with the attributes both batches need, extended in A3 | Chief Architect |
| §5.4 G.1: C2w's preconditions | Add: F1-R1b closed. The page states how a reviewer's note written before a key correction is shown, and uses a term distinct from the "no recorded misconception" marker | Chief Architect; Sharon's note of 12 Nov |
| §5.5 D7, D10: recovery after a reinstatement | The teacher's resume of a suspension-held Uji Penguasaan sitting carries the recovery authorization: one act | Chief Architect; for Sharon's and Daisy's review on A3's page |
| §8.5: five integrated journeys | A sixth, an account's life (suspend, neutral sign-in, reinstate, close, delete, never re-attach). Journey 3 gains a sitting on the corrected revision and the rewriting of withdrawn explanations | Owner, 12 Nov (supported) |
| `docs/rebuild/03-PINTAR-INVARIANTS.md`, INV-03 | Amended narrowly in the repository, with ADR-0025; the repository is the baseline of record (ADR-0019) | Owner, 12 Nov |

## 5 · The owner's rulings of 12 November 2026 on execution

| # | Ruling | What it means in practice |
|---|---|---|
| **M-A** | **Approved.** Begin the provider evaluation's no-cost preparation | The terms, licensing, data-handling and evaluation requirements are prepared now. **No spending, credential, network access or provider data transfer is authorized.** The requirements for the educator judges are brought to the owner to nominate them |
| **M-B** | **Approved for planning.** One staging checkpoint after B2 and the accepted open corrections, before A2 | Prepared: migration reconciliation, hosted Auth, the scheduler, restore and preservation verification. **The readiness evidence and the proposed boundary are brought to the owner before any staging action. This does not authorize promotion** |
| **M-C** | **Approved in principle.** A2 is built and reviewed as **A2a** (class scope, the emergency stop at class scope, and all of §5.3 D6) and **A2b** (D2, D3, D4, D8) | Existing designs and sequence preserved. **Subject to Sharon confirming** that the split weakens neither her nine scenarios, nor the cross-batch invariants, nor final acceptance. A material conflict comes back to the owner with options. *Status: awaiting her answer* |
| **M-D** | **Approved.** This addendum | THE PLAN byte-identical; this document effective only on approval |
| **Stacked verification** | **Approved with safeguards** | Up to three genuinely independent small corrections may share one full pre-flight, CI and journeys run on the exact combined candidate. Each keeps its own commit, red-first evidence, impact assessment and review. The combined candidate must be green before any is accepted. On a failure, isolate and re-run. **Never for a batch or for coupled corrections** |
| **§3 and §5 of the reassessment** | May proceed under existing authority | A short design review by Sharon before any correction is built; the impact analysis reads constraints and invariants; shared test infrastructure; the C2w handling; the account-lifecycle journey |
| **Proportion** | Keep the process proportionate | No new document, review cycle or gate unless it demonstrably improves correctness, reliability or efficiency |

## 6 · Dependencies that now hold

- **Promotion:** B1 not ahead of L-1 (met). C1w not ahead of F-1 (met) nor of F1-R1b. L1-F4 not accepted before its
  race test. No account on staging is suspended or closed until L-1 is promoted.
- **Build:** C2w after F1-R1b. A2a carries class scope, so A2b follows it. A3 after A2a (the fence and the lock
  order). C3w after the evaluation's report, the owner's choice of provider, the limits and network egress
  (unchanged from THE PLAN §5.6 G).
- **Corrections found from here on** are triaged at the batch boundary: into the batch if they are the batch's own;
  as a boundary correction with a short design review first; or onto the register for before Z. They are expected,
  not exceptional.

## 7 · What does not change

The scope of 4.1 and what is outside it; every design in THE PLAN §5 not named in §4 above; the rules of §4 and the
pre-flight of §4.1; the acceptance framework of §8 other than the journeys named; exact-commit reviews; the standing
principle. **Not authorized by THE PLAN or by this addendum:** any pull request, merge, staging promotion, production
deployment or production database change.

## 8 · Record

| Date | Entry |
|---|---|
| 12 Nov 2026 (07:26 UTC) | Drafted after the owner's rulings on the reassessment (`PLAN-REASSESSMENT-2026-11-12.md`). Not effective |

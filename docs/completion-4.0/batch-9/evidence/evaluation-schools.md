# The evaluation schools for Dr Gladys's team: staging walks (7 Nov 2026)

Owner decision «EVALUATOR ACCESS», Option 1: individual staff accounts, and synthetic schools, learners, content, results and certificates. Preparation is authorised; invitations are not.

The two schools were founded on 7 Nov through `found-school.yml`:
- **Sekolah Uji Evaluasi A** (`sekolah-uji-evaluasi-a`)
- **Sekolah Uji Evaluasi B** (`sekolah-uji-evaluasi-b`)

The walks ran against staging `main`:
- `ebc53ee2` (migration 197) until 06:21;
- after that, `002852ab` (P-6, migration 198, MC-8).

Every write in the walks is a press of PINTAR's own buttons.

## Sekolah Uji Evaluasi B
| Walk | Run | Result |
|---|---|---|
| GS-01–03 (first administrator) | 42334120019 | GREEN |
| GS-04–11 (setup, Studio publication) | 42334669314 | GREEN |
| GS-07, GS-12–16 (students) | 42335711337 | GREEN |
| GS-17–21 (reports, certificate, recovery, shared computer, public check, GS-22) | 42336620831 | GREEN |
| GS-17–21, a second run after P-6 | 42347750742 | **Not valid.** GS-22 runs once per school and had already added «Fajar», so the read-only recipe no longer held. See `staging-p6.md`. |

## Sekolah Uji Evaluasi A
| Walk | Run | Result |
|---|---|---|
| GS-01–03 | 42339737829 | GREEN |
| GS-04–11 | 42341128822 | GREEN |
| GS-07, GS-12–16 | 42349448056 | GREEN |
| GS-17–21 (the P-6 verification of record) | 42350628901 | GREEN, 18/18 |
| Administration P0–P8, receiving school B | 42352462155 | 8/9: **P6 failed** (a race in the walk, not the product; see below) |
| Studio end to end, Uji Cepat score, other school B | 42354502062 | GREEN |
| The Batch 5 walk | 42355726238 | GREEN |

### The administration walk's P6, and what it left behind
**What failed.** B's admin accepted the transfer of «Dimas Murid SEKOLAH-UJI-EVALUASI-A» into B's «Kelas 5A»: `transfer_terima` returned at 07:50:14 and the transfer is AUTHORIZED. Pressing «Laksanakan» then never reached staging; neither `transfer_execute` nor its first read appears in staging's edge log.

**Why.** The walk polled the database, which says AUTHORIZED before the browser has finished the acceptance's redirect. It then reloaded the same address and pressed «Laksanakan» on a page that the redirect replaced.

**Fix.** `6f94df6f` makes the staging walk wait for the answer's address and a quiet network, as the CI journey `admin-ujung` B4-W7 does, and reload with a distinct address.

**Evidence that the product path works:**
- the same acceptance and execution passed on staging in P-5 (run 42323858693; the learner placed in «Kelas 5A»);
- it passes in every CI journey.

The fixed walk has not yet run on staging: its steps run once per school (P0 needs Eka's class card, which P3 converted to an email account), so it cannot re-run on A.

**Left on staging after the walk** (since completed; see the next section).
- Transfer `a0d0ab7e`, A → B, was AUTHORIZED and not executed.
- The walk also converted Eka's class card to an email account (P3). It corrected the Dekan's name and username and then restored them (P2).

### The transfer completed afterwards: separate evidence (owner, 7 Nov, «DIMAS TRANSFER»)
The administration walk above stays recorded as **8/9**, with its timing failure.

On the owner's decision, transfer `a0d0ab7e` was then completed through the existing authorised action, with no direct write to the database:
- **Script:** `golden-school-pindah-lanjut.mjs`, selected by `lanjut: <transfer>` in the administration request.
- **Run:** 42357873628, **GREEN, 3/3**.
- **The press:** B's admin pressed «Laksanakan» on the learner's row in «Perpindahan murid». The transfer was EXECUTED at 09:02:21 UTC.

| Check | Read back (run 42357873628, and read-only SQL afterwards) |
|---|---|
| (1) Dimas is in B's «Kelas 5A» | One open placement: «Kelas 5A» at Sekolah Uji Evaluasi B, on an ACTIVE enrolment |
| (2) His A placement ended correctly | A's enrolment is ENDED (TRANSFERRED_OUT), with no open placement. A's «Kelas 5A» placement is CLOSED (ENROLLMENT_ENDED) and kept as history |
| (3) The receiving teacher sees him | B's Guru sees «Dimas Murid SEKOLAH-UJI-EVALUASI-A» on «Kelas 5A»'s class page (7 learners) |
| (4) His learner record is consistent | His institutional identities, PINTAR ID and official results are unchanged (the fingerprint before the press equals the one after) |
| (5) The audit trail is intact | transfer.requested, transfer.authorized and transfer.executed, each recorded twice (two rows per act), in order |

## Not yet done before invitations
- An evaluator-style staff account activated and signed in on staging, through the existing email verification.
- H29: the staff-bar gap below 1024 px, seen by a person on staging.
- The evaluator account plan filled in (roles and places). The document and the evaluator sheet are drafted in `../evaluator-accounts.md`, with no passwords, authentication secrets or PINs. Addresses are collected only when the evaluation is ready.

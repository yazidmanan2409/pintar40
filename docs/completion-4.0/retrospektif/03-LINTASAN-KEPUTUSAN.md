# The coordinated decision pass (D-178) · 4 Nov 2026

**Ruling (D-178):** the retrospective is accepted. Batch 0 is VERIFIED. Batches 1–6 are acceptance-incomplete. No promotion. The branch stays protected.

**The pass:** close the genuinely blocking decisions together, implement what they decide, rerun the affected tests and the full journeys, then assess readiness for the next batch. No further broad audit is commissioned now.

**The source of each item** is the register (`01-REGISTER.md`) and the summary (`02-RINGKASAN.md` §4). Nothing here is decided by engineering.

## 1. What is asked, of whom, in one round

| # | Decision | Decides | Where it is asked | Register rows |
|---|---|---|---|---|
| K1 | The words: Part A (A1–A10) and Part B (B1–B31) | **Dr Gladys** (A6 with the owner) | `DR-GLADYS-QUESTION-PACK.md`, one sitting. B28–B31 were added by the retrospective | R1-5, R2-4, R3-2, R3-3, R4-6, R4-7, R5-4, R5-6, R6-3 |
| K2 | X12: «paket» / «kursus» / «course», one consolidated decision, the workbook sheet included (C9) | **Dr Gladys and the owner** | `X12-TERMINOLOGY-PAKET.md`; pack A6 | R3-2 |
| K3 | C2 (the PD Kelas presentation), B4 (the card's school-less role), G1's screens | **Daisy, then the owner** | Daisy's C2, B4, E2 on `ux-1/daisy-experience` | R5-5, R5-6, R6-2 |
| K4 | F-11: the wordmark master and the font licence | **owner** | `F-OWNER-DECISIONS-REQUIRED-2026-11-02.md` | R6-4, R6-5 |
| K5 | D1's manual client protocol: a send path and synthetic inboxes (P6) | **owner** | `daisy-design-completion/05-D1-IMPLEMENTATION-TEST-PLAN.md` | R6-3 |
| K6 | F-4: the private content store, its access list, and regeneration before real use | **owner** | `batch-1/F4-EXPOSED-ITEM-INVENTORY.md` | R1-6 |
| K7 | The personal address in three files: keep it, or use a role address | **owner** | Batch 0 security report §4.1 | R1-7 |

**Not decisions, done at acceptance on the final screens:**
- the NVDA and TalkBack passes and the skip link's keyboard check (R2-9);
- the printed A4, CR80 and QR proofs (R6-1, R6-2).

These need K1 and K3 answered first, so the screens they read are final.

## 2. What each answer changes, and what is rerun

| Answer | Engineering change (one pass, at the shared source) | Tests that hold it | Rerun |
|---|---|---|---|
| K1 | the approved words into `src/lib/hle.ts` only; no screen writes its own | the key's own test (e.g. `R3-A5-01`, `D168-B2-1`, `D168-KATA-1`), and any test that quotes the old words, restated with the reason | the whole manifest; every walk (the walks read words) |
| K2 | one replacement across every user-facing occurrence. The workbook gets a new template version, and old workbooks still import. No identifier, column or file is renamed | a cross-feature check over every user-facing string; an import test over the existing templates | the manifest; `studio-ujung` (upload, both template versions); the journeys |
| K3 | C2 at `adaBuktiSoal`'s consumers; B4 in `susunKartu`; G1 in the chooser | `D168-C2-1`, `R5-PERSOAL-01`, `B6K-URUTAN-*`, `D168-E2-1` | `e1-navigasi`, `b5-ujung`, `d1-email` (the card block) |
| K4 | the master into `MerekKartu` and the D5 slots; DS stage 2 | `B6K-MEREK-01`, `D1E-K07` | `b6-cetak`, `d1-email`; then the print proofs |
| K5 | none in the code (the protocol is run, not built) | `D1E-K*` stay | D1's P6 by hand, recorded |
| K6 | the owner's store; any chapter used for real assessment regenerated | `sensitive-scan --tree`, SEC-G01/G02 | CI |
| K7 | the three files, if the owner says so (`.github/*-request.txt` stays the owner's) | the guard's allowlist entry removed | CI |

**Every change follows the process correction (D-178(e), `R-PROSES-01`).** An answer that leads to a change gets a line in `06-ENGINEERING-ITEMS-FROM-DESIGN.md` the day it is given. That line names its test, or the person it is blocked on. An «[auto]» line becomes a manifest id.

## 3. The exit, and then readiness

**The pass is done when:**
- every K row is answered, or explicitly deferred by the owner;
- its changes are built with their tests, each shown red first;
- the whole manifest and every walk are green locally;
- `ci` and the journeys are green on that head.

**Then** the per-batch verdicts in `02-RINGKASAN.md` §5 are reassessed, and readiness for the next batch is put to the owner. Promotion stays the owner's decision.

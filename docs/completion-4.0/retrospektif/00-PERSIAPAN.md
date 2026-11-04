# Retrospective integrity audit, Batches 0–6 · preparation · 4 Nov 2026

**Status:** complete (4 Nov). Started on the verified baseline `be8a68c2` (`ci` 41842329505, journeys 41842334345); ended on the corrected head `71b13d9b` (`ci` 41866159878, journeys 41866166979, both green). Findings and verdicts: `01-REGISTER.md`, `02-RINGKASAN.md`.

**Before that:** prepared, not started. The owner's directive (4 Nov) is to finish the approved implementation work and establish a verified code baseline first, then audit Batches 0–6 in order. **No next development batch starts until this audit has established the true condition of Batches 0–6.**

## 1. The baseline

- **Branch:** `claude/awesome-rubin-bqxp6p`.
- **Candidate:** the head that carries B1's compositions and D1, `be8a68c2` (with its record commits after it).
- **The baseline counts as verified** when `ci` and the journeys are green on that head. Their results are recorded in `d177-koreksi/README.md` §4e and §4f.
- **Until then the audit does not start.** A failing run is root-caused and fixed first, and that fix becomes the baseline.
- **The audit reads the baseline, not memory.** Each finding names the commit it was read at.

## 2. Method, per batch (the owner's ten steps)

Batches are taken in order, 0 to 6. For each batch:

1. Read its requirements and decisions: the inputs in §3.
2. Compare them with the implementation at the baseline: the source, the migrations and the copy table.
3. Verify the behaviour, roles and states it promised: run the named tests, and read what they actually assert.
4. Trace its dependencies, upstream and down: what later batches built on it, and whether that still holds.
5. Check authorization at the enforcement boundary: the database function or policy, not the page that hides a button.
6. Compare its screens with Daisy's grammar and the D-172 patterns (`ux-1/daisy-experience`, `X-KONSISTENSI`).
7. Check its terminology, actions, navigation, feedback, accessibility and responsive behaviour.
8. Review its tests for weakened assertions and false positives:
   - every restatement since the batch closed;
   - every exemption, allowance or skip;
   - every assertion that a fixture cannot fail. F03-R02 and D168-BENIH-1 are the model case.
9. Exercise its full journeys, exception states included: walks, journeys and HTTP tests on a reset stack.
10. Record each discrepancy in the register (§4), with its requirement ID, root cause, consumers and evidence.

**A fix is made at its root cause.** It gets a regression test that is shown red first, and the work continues automatically. **A batch is never called fully GREEN while one of its requirements is OPEN.**

## 3. The inputs, per batch

| Batch | Scope (E plan, `E-CRITICAL-PATH-EXECUTION-PLAN-2026-11-02.md`) | Its own record | Later corrections to read with it |
|---|---|---|---|
| 0 | W0.2 CI on the new image, W0.4 accessibility harness, W0.5 history scan | `batch-0/01`–`10`, `evidence/` | Phase 0 corrections 1–6 (`batch-0/05`) |
| 1 | W1.6/W1.8 data, W1.13, W4.1, W5.1 CR-91, W5.2 / F-4 keyed material | `batch-1/01`–`05`, `F4-EXPOSED-ITEM-INVENTORY.md` | the F03-R02 correction (`d177-koreksi` §4e): the F-4 synthetic seed's content stays as written |
| 2 | W3.1–W3.5, W3.14 (shared components, idle warning) | `batch-2/01`–`03` | D-172/D-173 shared-pattern corrections (E-K1…K9), E1+E2 navigation (`d177-koreksi` §4c) |
| 3 | Studio W1.1–W1.14, W2.4, W3.11, W3.17, W3.18; W6.5, W6.7 | `batch-3/01`–`06` | A1 (E-A1-1), A2 (E-A2-1), A3 (E-A3-1/2) |
| 4 | W2.1–W2.3, W2.8–W2.10, W2.13, W2.15, W2.19; W3.5 J2, W3.6 Konfigurasi, W3.7 | `batch-4/01`–`04` | B1 split and every section's pattern (`d177-koreksi` §4d, §4e), E-B1-1…5 |
| 5 | W3.8–W3.10, W3.12, W3.13, W3.15, W3.16; W2.5–W2.7, W2.12, W2.13 | `batch-5/01`–`04` | C1 (E-C1-1…7), C2 (E-C2-1…3) |
| 6 | W3.19–W3.22 (certificate, card, emails, wordmark; A4 print) | `batch-6/01`–`02`, `evidence/` | D1 (`d177-koreksi` §4f), D2, B4 (E-B4-1); F-11 still open |

**Read across all batches:**
- the decision log (`docs/coordination/DECISIONS.md`, D-001…D-177);
- the acceptance standard and ledger (`H-ACCEPTANCE-STANDARD-AND-LEDGER.md`);
- the final acceptance matrix (`G-…`), the open-work register (`C-…`) and the dependency map (`D-…`);
- Daisy's register and engineering items (`daisy-design-completion/01`, `06`).

## 4. The register: one, consolidated

The register is `retrospektif/01-REGISTER.md`. It has one row per requirement or finding:

| Column | Holds |
|---|---|
| ID | `R<batch>-<n>`, stable once given |
| Requirement | the source's own ID (W…, CR-…, J…, D-…, E-…) and a one-line statement |
| Status | **VERIFIED** (evidence at the baseline proves it); **OPEN** (not met, or not proven); **BLOCKED** (needs an owner, Dr Gladys, Daisy or an external action, named) |
| Evidence | test IDs, walk steps, CI and journey run IDs, files and lines, all at the commit named |
| Root cause | for OPEN: why it is not met. Was it never built, built to the wrong rule, or a test that cannot fail? |
| Consumers | the screens, functions, emails, reports and tests that depend on it |
| Correction | the commit that fixed it, and its red-then-green test |

**Historical evidence is preserved.** A batch's old reports are not rewritten. The register states what is true at the baseline, beside them.

## 5. Special attention (the owner's list), as checks

- **Requirements marked done but not implemented:** each closed W-item is traced to code and a test that would fail without it.
- **Correct permissions, wrong words:** each refusal and permission line is read rendered, per role.
- **Inconsistent shared concepts:** one term, one component, one rule per concept (D-168), checked across consumers.
- **Role and school-context transitions:** each role, in each context, through the chooser, rendered (E-E1-2 is the model).
- **Visible order versus keyboard order:** Tab walks against the DOM and the visual order, per surface.
- **Unreachable exception states:** each error and empty state is reached in a walk, or recorded as unreachable with its cause.
- **Reports and certificates out of scope:** each report and certificate surface is checked against its batch's scope.
- **Email, print and browser divergence:** the same facts in the screen, the A4 print and the email (D1 and B6P are the models).
- **Old links, templates and compatibility contracts:** E-B1-1 is the model. Every older address and template keeps working.
- **Tests loosened after failures:** every restatement and exemption since 2 Nov is listed and re-read against its original assertion.
- **Unverified accessibility, print or readiness claims:** each claim is traced to a run, or marked OPEN.

## 6. Already known, carried in (OPEN or BLOCKED until shown otherwise)

| Item | Batch | Status today | Needs |
|---|---|---|---|
| NVDA and TalkBack passes (E1+E2, every shell) | 2, 4, 5 | BLOCKED | a manual screen-reader run at acceptance |
| F-11 wordmark master and font licence; physical print proofs (A4, CR80, the QR on two phones) | 6 | BLOCKED | owner (brand) |
| D1 manual client protocol (P6) | 6 | BLOCKED | owner: a send path and synthetic inboxes |
| Copy awaiting approval: `config.kelompok.*`, `context.manage_label`, `email.bingkai.konteks`, E-B1-2, `d177-koreksi` §5 | 4, 6 | BLOCKED | Dr Gladys / copy approval |
| E-B1-3 the seed school's name | 4 | BLOCKED | Dr Gladys |
| E1's phone-bar question | 2 | BLOCKED | Daisy |
| H21; H22/X12 (the certificate list's column) | 5, 6 | BLOCKED | owner; Dr Gladys and owner |
| C2, B4, D2 designs under review | 5, 6 | BLOCKED | Daisy, then the owner |
| BOB18-A01 / BOB19-A01 local-only call counts | — | VERIFIED in CI only | (a harness limit, recorded, not a product gap) |

## 7. Deliverables (the owner's list)

1. A requirement-by-requirement account (the register).
2. The inconsistencies found and their corrections.
3. Cross-batch, role and security evidence.
4. The real blockers, kept apart from future (4.1, 4.5 and 5.0) scope.
5. A per-batch readiness verdict.
6. A recommendation on the next batch.

**Boundaries:**
- No 4.1, 4.5 or 5.0 features.
- No needless rewrites.
- No weakening of security.
- No staging or production change.
- No invitation to Dr Gladys's walkthrough.
- No promotion of the next batch.

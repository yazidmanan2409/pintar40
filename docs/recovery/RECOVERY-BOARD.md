# Recovery board

**The operational board since 1 October 2026 (D-084).** It replaced `docs/coordination/BOARD.md`, which stays as the
historical ticket record. One line per journey; states follow `EVIDENCE-MODEL.md`; a decision goes to `DECISIONS.md`
only when a product or architecture ruling is needed. The full picture, line by line, is
`docs/reports/PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md`.

**Updated 6 Oct 2026.** The 1 Oct version of this board is in git history (`e5a4173`).

**The application is frozen for the Dr Gladys walkthrough** (D-117), from Yazid's sign-in on 6 Oct evening until she signs off.

| | |
|---|---|
| Readiness gate (D-052) | **ENGINEERING COMPLETE** (declared 5 Oct). UI/UX POLISHED not started; an early human walkthrough on staging is under way (D-116, D-117) |
| Charter phase | 0 and 1 done; 2 largely done; 3 and 4 met; **5 not met** (the polish pass; roles beyond the spine not yet Level 3); **6 in progress**; 7 not met (L1 on Micro); 8 not started |
| `main` and staging | `12b480b`, frozen; application code = `3a7501b` (CI 37430770665, 35/35, 595 tests); staging machine-read GREEN, 165 of 165 (environment-facts 37438389611) |
| Level 3 | Sekolah Demo PINTAR, 6 Oct: GS-01 to GS-21 green. Unaided except GS-16, where the four extra students open their tests by a declared typed address. GS-00 rests on reads before and after the walk (GOLDEN-SCHOOL-CONTRACT «Status») |
| Production | `5b5b68d`, 111 migrations, untouched. #150 NOT PASS (checkpoint GREEN to proceed into owner setup, D-111) |
| HUMAN-ACCEPTED | **none yet**: Yazid's pass 6 Oct evening, Dr Gladys 7 Oct |

## Journeys

The counts are of `PINTAR-4.0-SCOPE-INVENTORY.md` lines at each line's highest state. Of the JOURNEY-PROVEN (JP) lines:
- † means a documented step covered the line although the contract's map does not name it;
- ‡ means the line was walked on the 162-migration set (`808ae6e`), so it is JP on that commit, not on `12b480b` (D-034).

| Journey | Owner | Lines | JP | TESTED | BUILT | NOT BUILT / other | What stands (first the break, then the open items) | Next action |
|---|---|---:|---:|---:|---:|---|---|---|
| J1 Platform operation | Bob | 9 | 2 (‡) | 4 | 2 | 1 NOT BUILT | No break in the spine. Open: J1.7 break-glass for the sole production admin (C-11); J1.5 PINTAR standard content end to end (Q7: D-029 vs M6); J1.6 the audit reader not walked; SYS-08 one platform admin | Owner rulings and C-11; after the freeze |
| J2 Identity | Bob | 21 | 11 | 6 | 4 | — | No break. Open: J2.7 the existing-staff transition not rehearsed; J2.10 the staff lock never walked; J2.21 wrong-email correction not built; J2.6 production still on the magic link | Phase 8 rehearsal; UI lane for J2.21 |
| J3 School setup | Daisy | 12 | 7 | 4 | 1 | — | No break. Open: year rollover, transfer and class move proven only in audits; J3.11 (every action leaves a trace) has no rule-level test | Further Level 3 journeys (Phase 5) |
| J4 Content | Daisy | 12 | 5 | 2 | 2 | 1 NOT BUILT, 1 OUT OF SCOPE, 1 UNVERIFIED | No break. Open: J4.10 misconception linkage not built (Q9; 31 false warnings per chapter at publish); J4.2 media out of scope (D-050); J4.8 "Question Bank workflows" never defined; J4.9 Question Health needs 30 answers per question | Owner ruling Q9 |
| J5 Teaching | Daisy | 14 | 3 | 9 | — | 2 NOT BUILT | No break. Open: J5.6 the Uji Cepat score (Q8); J5.9 deadline extension has no screen; Uji Cepat not a Level 3 journey | Ruling Q8; UI lane |
| J6 Learning | Bob | 15 | 8 | 6 | 1 | — | No break. Open: J6.7 pause and resume untested; J6.8 network loss proven in audits, not Level 3 | Phase 5 |
| J7 Evidence | Daisy | 9 | 6 | 1 | 2 | — | No break. Open: J7.5 briefings have no producer or display; the decision queue not walked; the «not yet» band (D-095(g)) | UI lane; Q10 |
| J8 Certificate | Bob | 8 | 3 | — | 3 | 2 NOT BUILT | No break. Open: **the certificate number conflicts with D-080(2)** (Q1); J8.3 sealing at issuance (BOB-48); J8.4 the frozen design (DAISY-36); J8.8 the photo screen; J8.7 key escrow (#150 B5) | Owner ruling Q1, then BOB-48 |
| J9 Educator as learner | Bob | 8 | — | 7 | — | 1 (demo content, off `main` by design) | Proven by audit C-12 (37366709177), not yet a Level 3 journey | C-13: Yazid's walk with Lana's packages |
| J10 Help and support | Daisy | 2 | — | 1 | 1 | — | «Laporkan masalah» built and tested, never walked in a browser; tier people not named (REL-13) | Walk after the freeze; owner names the tiers |
| X Universal rules | Coordinator | 12 | — | 2 | 9 | 1 NOT BUILT (X.12, the polish pass) | Rules shown by examples, not rule-level tests; U-PERF last measured 28 Sep | Daisy's gate, then the polish pass |
| R Instruments and release | Coordinator | 8 | — | 1 | 1 | 6 release conditions | REL-02 FAIL, REL-08 and REL-13 PARTIAL, REL-09 NOT VERIFIED; L1 NOT MET (D-089); #150 NOT PASS | The owner's #150 steps; Phase 8 |
| **Total** | | **130** | **45** (8†, 2‡) | **43** | **26** | 8 NOT BUILT · 1 OUT OF SCOPE · 1 UNVERIFIED · 6 release labels | HUMAN-ACCEPTED: 0 | |

## Held and parallel work

| Item | Where | State |
|---|---|---|
| Gate 3 work (BOB-26, BOB-50, BOB-51, DAISY-20, DAISY-39, DAISY-40) | `claude/quirky-meitner-a04smj` | **Landed** 4 Oct (D-098; JOURNEY-LOG 22); Gates 4–6 followed (items 24–26) |
| Daisy's design system | `ux-1/daisy-experience` | Documents only; READY TO VALIDATE; waits for her gate after the walkthrough (D-117(h)) |
| LANA-22 and LANA-23 (demonstration content) | `claude/adoring-feynman-njmjll` `f197e80` | CONTENT PASS; never on `main` (D-069(g)); for C-13 |
| Fiona's school-questions handbook | `claude/new-session-nfib2w` | On `main` (D-114); lane paused (D-115) |
| The corporate website's design grammar | `claude/hopeful-turing-43hvpr` | Not on `main`; its relation to 4.0 not recorded |

## Owner

- **Decisions:** 19 open (`PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md` §11).
- **Actions:** 15 open (§12). The most urgent:
  - add Dr Gladys on staging;
  - your own pass;
  - the staging pooler value and O2 for #150.

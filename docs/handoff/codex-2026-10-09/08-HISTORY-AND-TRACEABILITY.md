# 08 · History and traceability

**Handoff of PINTAR 4.0 from Claude to Codex. Written 8 Oct 2026, read-only, from `main` `8202139`.** Daisy's design lane is `origin/ux-1/daisy-experience`, head `cc96030`.

- Last commits come from `git log -1 --format='%h %ad' --date=short -- <path>` on `main`, unless the row names another branch.
- «NOT FOUND» means the path was searched in `docs/`, `ux/`, the repository root and the full history of every branch (`git log --all --name-only`), and nothing matched.
- Summaries below point to their originals. They are not substitutes for them.

---

## §1 Manifest of foundation documents

| # | Foundation item | Canonical path (on `main` unless stated) | Last commit | Notes |
|---|---|---|---|---|
| 1a | PINTAR 3.0 master documentation | `docs/product/PINTAR-COMPREHENSIVE-HANDOFF-2026-08-28.md` | `12bc092 2026-09-12` | A 3.0 handoff compiled 2026-08-28. It cites `handoff-package-2026-08-09/PINTAR-MASTER-HANDOFF-2026-08-09.md`, `PINTAR-DATABASE-SCHEMA-REFERENCE.md`, `CONSOLIDATION-PROVENANCE.md` and `STABILIZATION-BASELINE-PLAN.md`. **All four are NOT FOUND in the repository** |
| 1b | 3.0 binding operating context | `docs/product/GITHUB-TRANSITION-MASTER-CONTEXT.md` | `12bc092 2026-09-12` | «Saved verbatim 2026-08-09» |
| 1c | PINTAR 3.0 lessons learned | `docs/rebuild/01-REBUILD-LESSONS-LEARNED.md` (frozen baseline) | `c35e303 2026-09-13` | A post-mortem of 3.0, checked against `pintar-3.0-consolidated/` source. **That source tree is NOT FOUND in this repository** |
| 1d | 4.0 engineering lessons (build commentary) | `docs/ENGINEERING-LESSONS.md` | `d95c201 2026-09-16` | — |
| 2a | PINTAR Philosophy | `docs/product/PINTAR-3.0-PHILOSOPHY.md` | `12bc092 2026-09-12` | «binding product philosophy, synchronised 2026-08-02» |
| 2b | **PINTAR Doctrine** («Constitution I»; the «Learning Safety Doctrine») | **NOT FOUND in the repository** | — | It is referenced as a source PDF (`docs/rebuild/REBUILD-READINESS-REPORT.md` header: «the three source PDFs (Doctrine, Philosophy, Platform)»), as «PINTAR Doctrine (Constitution I)» (`docs/rebuild/15-FABLE-5.1-START-HERE.md:36`) and as «in `CLAUDE.md`» (`docs/product/PINTAR-3.0-PHILOSOPHY.md`). No Doctrine PDF and no `CLAUDE.md` exists on any branch. The doctrine is implemented in `doctrine_lexicon` (table) and checked in `selftest/db/fable03.sql`. The Platform PDF is also NOT FOUND |
| 3 | **Original consolidated 4.0 roadmap** | **NOT FOUND in the repository** as a single consolidated roadmap | — | Related documents that are *not* that roadmap: `fable-prompts/FABLE-00-MASTER-OVERVIEW-PROMPT.md` (`c35e303 2026-09-13`); `docs/phases/FABLE-03-06-ROADMAP.md` (`01f8cb5 2026-09-12`, the phase handoff); `docs/reports/ROADMAP-STATUS-2026-09-29.md` (`ae19985 2026-09-29`, a status report); `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` (the 4.0→5.5 view). The «Consolidated Architecture Amendment Instruction» named in the Readiness Report header is also NOT FOUND |
| 4 | Architecture stress-test findings | `docs/rebuild/REBUILD-READINESS-REPORT.md` §G (20 scenarios: 17 PASS, 3 PASS WITH CONDITION, 0 FAIL) and §H | `c35e303 2026-09-13` | — |
| 5 | Architecture baseline freeze | `docs/rebuild/00-ARCHITECTURE-BASELINE-FREEZE-RECORD.md`; pins in `docs/rebuild/BASELINE-MANIFEST.json` (`fb80710 2026-09-13`); ADR-0019 | `c35e303 2026-09-13` | FROZEN 2026-09-12. It cites `claude/FABLE-SYNCHRONIZATION-REPORT.md`, which is **NOT FOUND**. It cites doc 16 at `claude/…`; the file is `docs/rebuild/16-…` (`3b554c5 2026-09-13`) |
| 6a | Original implementation instructions (FABLE prompts) | `fable-prompts/FABLE-00` … `FABLE-06` (7 files) | `c35e303 2026-09-13` (all 7) | A duplicate copy in `docs/phases/` was deleted in `c556393 2026-09-13` (ADR-0019 «Assertion 6») |
| 6b | FABLE operating rules | `docs/rebuild/15-FABLE-5.1-START-HERE.md`, `docs/rebuild/14-FABLE-PROMPT-CROSSCHECK.md`, `docs/rebuild/16-PINTAR-ENGINEERING-AND-VERIFICATION-SYSTEM.md` | `c35e303` / `c35e303` / `3b554c5` (2026-09-13) | `FABLE-06-EXECUTION-PROMPT.md`, quoted by ADR-0021, is **NOT FOUND**. Prompts for the later FABLE-07…22 suites are **NOT FOUND**. Those suites were driven by BOB tickets and closure landings, as the `selftest/db/fable*.sql` headers show |
| 6c | Original 4.0 specifications | Core DB/Backend: `docs/handoff/PINTAR-4.0-CORE-DB-BACKEND-SPEC.md` (`c9e0736 2026-09-17`). Frontend: `claude/PINTAR-4.0-FRONTEND-IMPLEMENTATION-SPEC.md` (`5562a87 2026-09-17`) | as shown | The Experience and Continuity specifications, named in `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md:12`, are **NOT FOUND**. The scope inventory treats all four as «background evidence, not scope authority» |
| 7 | Canonical product requirements | `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md` («the frozen 4.0 target», D-086) | `6db8d73 2026-10-06` | Also `docs/coordination/RELEASE-CHECKLIST.md` (`f82e08a 2026-10-06`; the rendered v2.7 is `docs/reports/PINTAR-4.0-Release-Checklist-v2.7.pdf`), `docs/coordination/auth/IDENTITY-4.0.md` (`6310d31 2026-09-29`), and `docs/recovery/OWNER-RULINGS-M1-M10-T1-T4-2026-10-01.md` (`c968e18 2026-10-01`, D-085) |
| 8a | Design grammar, language and component system (Daisy) | **Branch `origin/ux-1/daisy-experience` only:** `docs/coordination/ux/sistem-desain/` (215 files: `project/01-colour.md`…`11-validation.md`, `tokens.json`, `design-system.json`, `components/*`) | `c42fecb 2026-10-08` on that branch. `project/README.md` `bb0f98a 2026-10-08`; `08-migration.md` `2f172e2 2026-10-05`; `11-validation.md` `c42fecb 2026-10-08` | **`main` holds no copy:** `git ls-tree main` returns 0 files under that path, and no `main` commit has ever touched it. APPLICATION READY was verified on `c42fecb` (D-136(b)) |
| 8b | Older design material on `main` | `docs/product/PINTAR-DESIGN-LANGUAGE.md` («PINTAR 2.0 — Design Language», `12bc092 2026-09-12`); `docs/coordination/design/PINTAR-DESIGN-SKILL-SPEC.md` (`1418922 2026-09-30`); `docs/coordination/handover/HANDOFF-DAISY-DESIGN-SYSTEM.md` (`92fe50b 2026-10-04`) | as shown | These predate token set v3. The tokens applied on `main` are v2 (`src/app/globals.css`) |
| 8c | Website design grammar (not the app) | `website/corporate-grammar/` on `origin/claude/hopeful-turing-43hvpr` only | `2f873af 2026-10-06` (that branch) | Pete's website lane. Not part of the application |
| 9a | Terminology v1 freeze package | `docs/coordination/ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md` (D-068) | `9779a7f 2026-09-30` | Companions: `TERMINOLOGY-V1-PROPOSAL.md` and `TERMINOLOGY-V1-CHANGE-IMPACT.md` (`1418922 2026-09-30`); `PINTAR-4.0-TERMINOLOGY-INVENTORY.md` (`6d437dd 2026-09-29`); `docs/coordination/design/READINESS-TIERS-TERMINOLOGY.md` (`a590dba 2026-10-03`) |
| 9b | Polish register | `docs/coordination/ux/UX-POLISH-REGISTER.md` | `1418922 2026-09-30` | — |
| 9c | Dr Gladys's consolidated terminology register (D-135(c)) | **NOT FOUND as a standalone file** | — | Its content is in `docs/reports/PINTAR-4.0-CLOSURE-L4-2026-10-08.md` §4 and the register inside guard L4-G01 (`selftest/l4.test.ts`) |
| 10 | Decisions and amendments | `docs/coordination/DECISIONS.md` (D-001…D-136; amendments are new entries that supersede, never silent edits) | `aad799b 2026-10-08` | Board: `docs/coordination/BOARD.md` (`bcba641 2026-10-06`) |
| 11a | Journey catalogue | `docs/recovery/PINTAR-4.0-HUMAN-JOURNEY-AND-REALITY-SCENARIO-CATALOGUE-2026-10-01.md` | `0a06223 2026-10-01` | Cross-check: `docs/recovery/PINTAR-4.0-JOURNEY-COVERAGE-CROSS-CHECK-2026-10-01.md` (`4ecdc87`). Ownership: `docs/recovery/JOURNEY-OWNERSHIP.md` (`1d832ef`) |
| 11b | Acceptance criteria | `docs/recovery/GOLDEN-SCHOOL-CONTRACT.md` (`d9d2187 2026-10-06`); `docs/coordination/RELEASE-CHECKLIST.md`; the Acceptance column of `docs/coordination/BOARD.md`; `docs/recovery/JOURNEY-LOG.md` (`d9d2187 2026-10-06`, 47 numbered items); executable criteria in `selftest/manifest.json` (651 tests) and `audit/journey.mjs` | as shown | — |
| 12 | 4.5/5.0 readiness requirements | **NOT FOUND as an approved requirements document** | — | Closest: `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` (`c80ffab 2026-09-29`; AMBER; follow-up D-060, BOB-35 and BOB-36). D-125 and `docs/reports/PINTAR-4.1-DEVICE-HANDOFF-AND-EXAM-BINDING-INTAKE-2026-10-07.md` (`578a1e9 2026-10-07`) cover 4.1. Decision clauses «carried into 4.5 and 5.0» are listed in `01-SYSTEM-AND-ARCHITECTURE.md` §6 |

---

## §2 Index of development evidence

### 2.1 Implementation phases and FABLE records

| Phase | Records | Database suite |
|---|---|---|
| FABLE-01 Foundation (12 Sep) | `docs/CHECKPOINT-FABLE-01.md`; `docs/audit/FABLE-01-mini-audit.md`; ADR-0001; first commits `367161b`…`b929c12` | `selftest/db/fable01.sql` |
| FABLE-02 PLP content model | `docs/phases/FABLE-02-CHECKPOINT.md`, `FABLE-02-HANDOFF.md` | `fable02.sql` |
| FABLE-03 Learning experience | `docs/phases/FABLE-03-CHECKPOINT.md`; `docs/reports/FABLE-01-03-TEST-AND-FIX-REPORT.md` | `fable03.sql` |
| FABLE-04 Certificates | `docs/phases/FABLE-04-COMPLETION-REPORT.md`; `docs/audit/FABLE-04-BOUNDARY-AUDIT.md` | `fable04.sql` |
| FABLE-05 Studio (gate `28e85a9` 13 Sep); Tasks 1–2 | `docs/phases/FABLE-05-COMPLETION-REPORT.md`, `TASK-1-COMPLETION-REPORT.md`, `TASK-2-COMPLETION-REPORT.md`, `CONTENT-FREEZE.md` | `fable05.sql`, `fable05t1_quick_canonical.sql`, `fable05t2_evaluation.sql` |
| FABLE-06 Intelligence and launch (15 Sep, `8c49d6d`) | `docs/phases/FABLE-06-HOSTED-ADDENDUM.md`, `FABLE-06-OPEN-QUESTIONS.md`; `docs/phases/PINTAR-4.0-STATE-OF-THE-SYSTEM.md` (`9b2cc5d 2026-09-16`) | `fable06.sql` |
| FABLE-07, -08 (WP7B feedback, WP8 hardening) | — | `fable07.sql`, `fable08.sql` |
| FABLE-09 Systemic repair (23 Sep) | `docs/audit/SYSTEM-COHERENCE-ASSESSMENT-01.md` (`aeff152`), `docs/audit/SYSTEMIC-REPAIR-01-REPORT.md` (`c358f58`) | `fable09.sql` |
| FABLE-10 … 19 (BOB-01, -02, -03, -04, -06, -12, -24, -25, -26, -50) | `docs/coordination/BOARD.md`; `docs/coordination/handover/HANDOFF-BOB-*.md` | `fable10.sql`…`fable19.sql` |
| FABLE-20 closure batch 3 · FABLE-21 L2 · FABLE-22 L3 | `docs/reports/PINTAR-4.0-CLOSURE-BATCH-3-2026-10-06.md`, `…-L2-2026-10-07.md`, `…-L3-2026-10-08.md` | `fable20.sql`, `fable21.sql`, `fable22.sql` |
| Recovery Phases 0–8 (D-084, 1 Oct) | `docs/recovery/RECOVERY-CHARTER.md`, `RECOVERY-BOARD.md`, `PHASE-1-STATUS.md`, `EVIDENCE-MODEL.md`, `STATUS-2026-10-01-*.md`, `PAUSE-NOTE-2026-10-01.md` | — |
| Closure (D-118 onward) | Batches 0, 3 and 3b; landings L1–L4 (`docs/reports/PINTAR-4.0-CLOSURE-*.md`) | — |

### 2.2 Prompts, briefs and handovers

- **Briefs:** `docs/coordination/briefs/`.
  - Lane briefs: `BOB.md`, `DAISY.md`, `LANA.md`, `COORDINATOR.md`.
  - Daisy batch briefs: `DAISY-BATCH-4*.md`.
  - Design rounds: `DAISY-KARTU-PINTAR-ROUND-1/2.md`, `DAISY-SERTIFIKAT-ROUND-1/2.md`.
  - Resume notes: `RESUME-2026-09-30.md` … `RESUME-2026-10-06.md`.
  - Lane plan: `LANES-2026-09-30-PM.md`.
  - Last commit: `5a00016 2026-10-08`.
- **Handovers:** `docs/coordination/handover/`.
  - `HANDOFF-BOB-10` … `HANDOFF-BOB-51`.
  - `BOB-25-CONTRACT.md`, `BOB-26-CONTRACT.md`.
  - `HANDOFF-DAISY-20/31/DESIGN-SYSTEM/WALK.md`.
  - `BOB-RESUME.md`, `DAISY-RESUME.md`.
  - Last commit: `92fe50b 2026-10-04`.
- **Other handoff records:**
  - `docs/handoff/*.md`: login and tour findings, `WP1-OBJECTIVE-B-STOP.md`.
  - `claude/UX-1-SLICE-0-1-SESSION-RECORD.md`, `claude/UX-1-SLICE-0-1-SECOND-EYE-HANDOFF.md`.
  - `docs/reports/PINTAR-4.0-MORNING-HANDOFF-2026-10-08.md`.
- **Phase prompts:** `fable-prompts/` (see §1 item 6a).

### 2.3 Decisions

`docs/coordination/DECISIONS.md`, D-001 (23 Sep) to D-136 (8 Oct). Clusters that matter for the history:

| Decisions | Subject |
|---|---|
| D-052, D-083 | Readiness is a sequence of gates, not a date |
| D-054 – D-059 | Identity 4.0 freeze |
| D-068 | Terminology v1 |
| D-084 – D-087 | Recovery charter, scope inventory |
| D-104 – D-111 | #150 backup and DR |
| D-117, D-118 | Gladys walkthrough gate, postponed; closure register |
| D-119 – D-124 | Closure batches, CI gate, Q10, CR-52 |
| D-126 – D-136 | Gladys pause, Working Context, L1–L4, terminology, owner directive, APPLICATION READY |

Owner rulings with their own tables:
- `docs/reports/PINTAR-4.0-OWNER-RULINGS-2026-10-06.md`
- `docs/reports/YAZID-DECISION-BRIEFS-2026-09-30.md`
- `docs/reports/PINTAR-4.0-Q10-GRADE-LABELS-2026-10-06.md`

### 2.4 Audits and independent reviews

| Record | Path or ID | Verdict |
|---|---|---|
| Layer-3 (FABLE-era) finding ledger, 16 Sep | `docs/audit/L3-FINDING-LEDGER.md` | Not the closure landing "L3" |
| Happy-path sweep, 15 Sep | `docs/audit/HAPPY-PATH-SWEEP-2026-09-15.md` (+ `.sql`) | — |
| INV re-pass | `docs/audit/INV-REPASS-AMENDED-DOC-03.md` | — |
| System coherence assessment 01, 23 Sep | `docs/audit/SYSTEM-COHERENCE-ASSESSMENT-01.md` | «NOT A RELEASE CANDIDATE» |
| Issues and status, 24 Sep | `docs/audit/PINTAR-4.0-ISSUES-AND-STATUS-2026-09-24.md` | — |
| CI cost audit, 28 Sep | `docs/coordination/ci/2026-09-28-ci-cost-audit.md` (+ Bob's review) | — |
| Post-login 60 s UX review, 29 Sep | `docs/reports/POST-LOGIN-60S-UX-REVIEW-2026-09-29.md` | D-061: four findings block EC |
| Architecture Horizon Review, 29 Sep (Second Eye) | `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` | AMBER |
| Project reality audit, 1 Oct | `docs/reports/PINTAR-4.0-PROJECT-REALITY-AUDIT-2026-10-01.md` (`da27d80`) | Discloses its own conflict of interest (§ intro) |
| Independent review of that audit, 1 Oct | `docs/reports/PINTAR-4.0-INDEPENDENT-REVIEW-2026-10-01.md`; response `…-AUDIT-RESPONSE-TO-INDEPENDENT-REVIEW-2026-10-01.md`; convergence `…-CONVERGENCE-REVIEW-2026-10-01.md` | → D-084 |
| Efficiency audits, 2 Oct | `docs/audits/PINTAR-4.0-WHOLE-SYSTEM-EFFICIENCY-AUDIT-2026-10-02.md`; `docs/reports/PINTAR-4.0-EFFICIENCY-AUDIT-2026-10-02.md` | → D-090, D-091 |
| D-101 conformance review | `docs/coordination/reviews/D-101-RECOVERY-AUTHORITY-CONFORMANCE.md` | — |
| #150 backup and DR review, 5–6 Oct | `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`; `CLOSURE-PLAN-150.md`; `EVIDENCE-INDEX-150.md` | **NOT PASS** (D-104) |
| DG-19 … DG-37 investigation, 7 Oct | `docs/reports/PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md` | Accepted GREEN by the Second Eye; → D-127 |
| DG-01 … DG-18 | **NOT FOUND as a record.** Only DG-11 is referenced (D-128(h); L4 report §4) | — |
| L3 criteria audit, 8 Oct | `docs/reports/PINTAR-4.0-L3-CRITERIA-AUDIT-2026-10-08.md` | 22 changed criteria, each classed RESTATED / STRENGTHENED / RESTATED-WITH-AUTHORITY |
| Second Eye reviews of L1–L4 and APPLICATION READY | Verdicts recorded in D-129, D-130, D-131, D-132, D-133, D-136; summaries in the L3 addendum and L4 report §7, §7.1, §9 | **The Second Eye's original review texts are NOT FOUND in the repository**; only the coordinator's records of them exist |
| Daisy validation | `docs/coordination/ux/sistem-desain/project/11-validation.md` (Daisy's branch, `c42fecb`); walk sheet `docs/reports/PINTAR-4.0-BATCH-4-WALK-SHEET-2026-10-07.md` | APPLICATION READY (D-136(b)) |
| Gladys walkthrough instruments | `docs/coordination/walkthrough-gladys/EVIDENCE.md`, `OBSERVER-SHEET.md` (`2ae8230 2026-10-06`) | POSTPONED (D-118) |

### 2.5 Defects and closure records

- **Closure register:** `docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md` (last `886554b 2026-10-07`, plus a PDF).
  - Rows CR-01 … CR-92 (92 table rows). CR-93 and CR-94 were added in the L3 report §8–§9.
  - Buckets A–E come from D-118(e).
  - §6 lists 13 contradictions between documents and the application.
- **Closure streams:** CR-83 … CR-90 (D-127(c)).
- **Open at handoff:** CR-52/S23q (D-123), CR-91 (HOLD), CR-92, L4 finding 6, #150 B-items.
- **Status reports:**
  - `PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md`
  - `PINTAR-4.0-CLOSURE-STATUS-2026-10-07.md`
  - `PINTAR-4.0-D127-WORKING-CONTEXT-AND-CLOSURE-STREAMS-2026-10-07.md`
- **Board tickets:** `docs/coordination/BOARD.md` (BOB-nn, DAISY-nn, LANA-nn, C-nn).
- **Releases:** `docs/coordination/RELEASES.md`.

### 2.6 CI runs and journey executions cited in reports

| Run | What | Source |
|---|---|---|
| 35850275026 / 35851746640 | CI 21/21 and the production deploy of `5b5b68d`, 23 Sep | RELEASES.md:12 |
| 35952344955 | Audit journeys on `78b0f55`, 24 Sep: 15 PASS, 5 FAIL, 1 BLOCKED; P0 13/79 | RELEASES.md:28 |
| 36964437916 | perf-l1 on staging Micro: fails D-031 at 1,000 students | D-089 |
| 37348856438, 37353180694, 37363240451, 37366709177; CI 37366706051 | C-12 walk; the defect; the fix; PASS 68/68; CI 35/35, 572 tests | JOURNEY-LOG item 35 |
| 37401454517, 37409454539, 37416489180, 37421222152, 37425505226 | #150 WP-A, WP-B, D-111, WP-C.1, WP-C.2 CI | `git log` on `docs/recovery/*150*` |
| 37455602363 (not evidence) / 37458146396 | S4: the first run invalid (wp7 isolation defect); the second authoritative, 18/18, 598/598 | D-121(e) |
| 37462540525, 37466487118 | Batch 0 | Batch 0 report |
| 37487347244, 37489874488, 37493596839 | Batch 3 | Batch 3 report |
| 37531719996 | CR-52 walk: S23q FAIL | CR-52 row; D-123 |
| 37547178658, 37549911642, 37551984401 | Batch 3b | Batch 3b report |
| 37580997224 / 37581007813 | L1 CI / journeys | L1 report |
| 37592132508 / 37592135705 | L2 CI / journeys | L2 report |
| 37703613326 (cancelled), 37705723825 | L3 journeys | L3 report §7 |
| 37726912124 / 37726914297; 37729629430; 37730111943 | L3 addendum CI / journeys; main E1; facts | L3 addendum |
| 37739842180 / 37739845001; 37742974393; 37743180546; 37742992546 (refused by GS-00), 37743250063, 37743344493; 37743909195 (avoidable full main run, 72 min) | BOB19-K01 Option B | BOB19 evidence report; D-133(a), (g) |
| 37762170301 / 37762173449; 37766144556; 37766343961 | L4 first landing `e7fb612` | L4 report header |
| 37775379355 / 37775382999; 37782331321; 37782586725 | L4 final `dab5c12`: CI 18/18; journeys crawl GREEN, 75 PASS, 1 FAIL (S23q); main E1; facts (staging = main) | D-136(a); L4 report §9 |

### 2.7 Regression failures and corrections (selected, with their records)

- **BOB-23's first fix broke BOB-22's fix.** Source: reality audit §2, row «Gates keep defects out».
- **The crawl was blind after Gate 6** (5 Oct, `d84e0a4`). It read one page per persona until L3 found it.
  - Fixed in `386ca72` and `d66485e`.
  - The crawl now reads 387 pages, where it read 14.
  - Source: L3 report table row «Journeys job A»; addendum header.
- **Journeys during L3 and L4:**
  - S23j, S23t, crawl width and four test failures were caused by L4 and fixed before CI (L4 report §6).
  - PENUTUPAN-M04 failed after the GREEN conditional and was fixed in `dab5c12` (L4 report §9).
- **F06-S04 failed on F22-A01's `proves`** and was fixed in `f27ffb3` (L3 addendum, item 3).
- **Instrument restatements:** C12k, S2, BD11 and the others are audited in the L3 criteria audit. «No FAIL or BLOCKED → NOTE or PASS reclassification» (§2 of that audit).

---

## §3 Timeline: declared completions against later defects

Each row gives the claim, the later finding and the correction, with dates and IDs. These are factual sequences from the records. Reasons are not inferred.

| # | Approved or declared | Later finding | Correction or status |
|---|---|---|---|
| 1 | **12 Sep:** architecture baseline FROZEN; 20 stress scenarios, 0 FAIL (`docs/rebuild/00…`, Readiness Report §G) | **2 Oct:** perf-l1 36964437916 shows Micro fails D-031 at 1,000 synchronized students (answer save p95 11.7 s, CPU 98%). The stress test had called load «an engineering concern» | D-089: compute stays Micro until capacity passes; D-112(d): the failure stays visible. **Open** (production capacity gate) |
| 2 | **15 Sep:** FABLE-06 «launch readiness measured» (`8c49d6d`) | `metric_evaluate` «shipped "unable to compute anything" with four passing refusal probes (15 Sep)» | Reality audit §11.1. Later metric work: Horizon Review §1; D-060 |
| 3 | **23 Sep:** production go-live (`5b5b68d`, `docs/deployment/GO-LIVE-2026-09-23.md`); «PINTAR 4.0 is live, secure and stable» (23 Sep report, quoted by the reality audit) | **23–24 Sep:** coherence assessment «NOT A RELEASE CANDIDATE» (`aeff152`); audit 35952344955 found six blockers and P0 at 13/79. Production «has not changed since» (reality audit §2) | Production is still `5b5b68d` with 111 migrations (facts 37782586725). **Open:** Gate 8 / REL release |
| 4 | **24–30 Sep:** «Audit #5x green»; «Gate 2E GATE PASS»; «Identity Gates 0–2E are done»; checklist v2.3 «63 of 84 P0 PASS, 0 FAIL» | **1 Oct (reality audit §2, FACT rows):** `journey.mjs`/`crawl.mjs` never set an exit code; PINTAR's email path had sent zero emails on staging; only Gate 0 complete by D-058's definition; of 10 sampled P0 PASS rows, 4 conflicted with their own evidence | D-084 recovery charter; D-086 scope inventory; Golden School contract |
| 5 | **30 Sep:** scope frozen (D-044(c), D-075) | D-077 through D-082(d,e) followed within 4 hours (reality audit §2) | D-118(f) and D-121(f): no scope expansion during closure; D-135: no reopening of approved decisions |
| 6 | **28 Sep:** U-PERF passes (`d5a40c6`) | **2 Oct:** the 1,000-student run fails (row 1) | Two different gates (D-046(b) vs D-031); both recorded |
| 7 | **29 Sep:** shipped 4.0 metric and engine labels | Horizon Review: BOB-35 and BOB-36 reproducibility defects; version labels drifted (`c80ffab`) | D-060; BOB-35/36 «block ENGINEERING COMPLETE» (BOARD.md:86-87) |
| 8 | **C-12 and ENGINEERING COMPLETE, 5 Oct** | **During C-12, before the declaration:** run 37353180694 (C12f) found the PD facilitator reading a participant's answers against D-069(b). Fixed by migration `20261124100000` (commit `c8623ad`, 19:24 UTC), with tests C12-S01 and C12-D01 red then green. Then C-12 PASS 37366709177 on `514d826`, and EC was declared in `30502fa` (21:34 UTC) | **After the declaration:** closure register §6 item 9 (6 Oct): «ENGINEERING COMPLETE (5 Oct) was declared with EC lines open: J8.3, J8.4, J8.8, J2.7, J1.5, and J4.10». `PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md:97`: J8.8 and J1.5 «are not done». They became register rows (for example CR-07, J8.8) |
| 9 | **#150 backup and DR review, 5–6 Oct** (ordered after EC) | Verdict **NOT PASS** (`docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`): «ENGINEERING COMPLETE (declared 5 Oct) does not soften this» | D-104 accepted NOT PASS; D-105–D-109 approved the work packages; D-111 «checkpoint GREEN to proceed … (not PASS)». **Still NOT PASS at handoff**; B-items wait on the owner and provider (D-106) |
| 10 | **6 Oct:** S4 measurement | Run 37455602363 «is not evidence, because of the wp7 isolation defect» | D-121(e): 37458146396 is the authoritative run (18/18, 598/598) |
| 11 | **Gate 6 lands 5 Oct (`d84e0a4`); every crawl stays GREEN** through L1 (D-129 GREEN) and L2 (37592135705, D-130 GREEN) | **7–8 Oct, during L3:** the crawl had walked one page per persona and stopped at `/perangkat`. Corrected, job A went red on two pre-existing 320 px overflows on `main` `886554b`: **CR-93** (`/lapor`) and **CR-94** (Konfigurasi roles list) | The owner approved a fix limited to 320 px; commit `36c89dd`, pin test PENUTUPAN-L01 (red, then green). Accepted by the Second Eye (L3 addendum). **CR-93/94 were corrected before D-133 L3 GREEN**, not after; they reveal that the L1 and L2 crawl evidence was blind |
| 12 | **L3 report (8 Oct)** answered the conditional hold: «L3 AMBER» | Hold items: C12k reconciled; S2's Studio rule; F22-A01 (fail-closed); **BOB19-K01** sent for a product ruling (L3 addendum, `232a469`) | Items 1–3 fixed in `3926a16` and `f27ffb3` (CI 37726912124). Option B ruled and built: `cf72af7` → `25536d2` → `7f1201b` → `e055840` → `8bc52f4` → `bf18bc0`. **D-133 L3 GREEN** (`6224d83`), with S23q/CR-52 as the documented exception. After it: an avoidable 72-minute main run, 37743909195, produced the landing rule D-133(g) |
| 13 | **L4 landed `e7fb612`** (8 Oct 09:35 UTC; CI 37762170301 18/18; journeys 37762173449). The report claimed no GREEN | Second Eye review 1, **AMBER**. Finding 1 (MAJOR): `public/contoh/contoh-buku-kerja-pintar.xlsx` (added in `9859efa`) exposed SD5 Bab 1's live Pemetaan Awal and Uji Penguasaan questions, keys and reasons to any signed-in person. It was served on staging from `e7fb612` until `dab5c12` deployed; production never had it. The proxy matcher (`src/proxy.ts:289-290`) excludes only `brand/` and `fonts/`, which agrees with the report's «signed-in» scope. Finding 2 (MAJOR): a refused edit lost its input. Findings 3–8 MINOR | Fix range `e1f8736..6d0eac7` (`c124e92` for findings 1, 2 and 4; `2750de3`; `060ed78`). Review 2, **AMBER (light)**: N1–N4 fixed in `aa18168`. Review 3, **GREEN conditional**. The local suite then found PENUTUPAN-M04: the example sat among the chapters, and it moved to `docs/onboarding/contoh/` (`dab5c12`). L4-C01 asserts that `public/` serves no data file. D-135(e) keeps the workbook withheld; D-136(a) gives L4 GREEN |
| 14 | **Daisy froze APPLICATION READY on `bb0f98a`** (8 Oct) | Second Eye: four document defects, D1–D4 | Corrected by the coordinator in `c42fecb`; verified on `c42fecb` (D-136(b)). **Not applied to the app** (D-136(c)) |
| 15 | **J4.8 Bank Soal** carried as EC with evidence «UNVERIFIED: D-050(d)» | **7 Oct:** S23q walked, FAIL (run 37531719996; CR-52) | D-123(1): an A item for Daisy S7 plus engineering. It stays the **one governed FAIL** in every journeys run since (37775382999 included). D-133(b) and D-135(f) forbid relaxing or reclassifying it. **Open** |
| 16 | Sealed content's author difficulty | **FD-5 (7 Oct):** Mudah/Sulit inverted at the interpretation boundary. 853 sealed questions are affected, and the value is part of the sealed hash (D-129(c)) | Option A corrects the interpretation, not the sealed evidence. D-130(b): CLOSED, with a staging comparison of 27 releases and 881 values |
| 17 | **CR-90** (browser session proof) in L1 | No pre-change browser reproduction was obtained | D-129(d): «preventive hardening added; no pre-change browser reproduction obtained», never to be rewritten as «red → green BD-11» |
| 18 | The daily CI spend check | Red since before L2 | D-130(g): pre-existing, recorded |

### 3.1 Findings reopened or corrected more than once

| Item | Sequence (commits and decisions) |
|---|---|
| **BOB19-K01** (who may read `persons_awaiting_first_role`, and where) | Created with BOB-19 (`f36f5e4`, 28 Sep) → restated by BOB-20 under ADR-0021 (`05bd52e`, `cfeb348`, 28 Sep) → re-pinned by L3 source-pin renames (L3 criteria audit row 19) → reopened as Second Eye hold item 4 (`232a469`, 8 Oct) → options A, B and C put to the owner → Option B restated (`e055840`) and built (`bf18bc0`) → its English copy approved (`463dfc3`) → leftover walk binding removed (`52868a0`). The database guard was not narrowed (D-133(e)) |
| **C12k criterion** | Original: lands on `/mengajar` → restated by D-132 C9 to «lands on `/`» (`f9ec4ff`, flagged in the L3 criteria audit row 1) → the restatement «had lost» the original intent → restored with «choosing Mengajar lands on /mengajar» (`3926a16`; addendum item 1) |
| **Example workbook (Q9)** | D-127 Q9 asked for a separate example → added to `public/` (`9859efa`) → withdrawn (`c124e92`) → moved out of the chapters folder (`dab5c12`) → kept withheld by D-135(e) |
| **Terminology** | D-068 froze v1 → D-128(g) forbade applying *Replace* terms → D-132(m) added semantic keys → D-134 allows approved v1 words → D-135(c) set one consolidated register. The «Uji Penguasaan» / «penilaian akhir» mix is still present until Daisy's polish (L4 report §7.1) |
| **Dr Gladys walkthrough** | D-116 (walk on 7 Oct) → D-117 (freeze) → D-118 (postponed; closure register) → D-126 (pause) → D-127 (natural-use session ruled; streams CR-83–CR-90) → D-128 (pause lifted for L1–L4) |
| **Readiness dates** | D-045 → D-052 (gates, not dates) → D-083 (5 Oct withdrawn; 1 Dec expectation) → D-112(d) (1 Nov and 1 Dec cohorts no longer commitments) |
| **Uji Cepat and the certificate** | «Uji Cepat: 9 items in 3 days; certificate: 6 tickets and 8+ design decisions» (reality audit §11.7). BOB-42 (D-067), BOB-50 (a single Uji Cepat issued a certificate, `fable19.sql`), D-078, D-080, D-121 |
| **Restated tests in L4** | S23t (instrument restated), PENUTUPAN-F01, EFF-K02, DAISY-30-TEKS-01, «restated, not weakened» (L4 report §3, §6) |

## Documents NOT FOUND (summary)

- The PINTAR Doctrine («Constitution I»), its source PDF and the Platform PDF.
- `CLAUDE.md`.
- The original consolidated 4.0 roadmap, and the «Consolidated Architecture Amendment Instruction».
- The 3.0 `handoff-package-2026-08-09/` files and the `pintar-3.0-consolidated/` source tree.
- `claude/FABLE-SYNCHRONIZATION-REPORT.md`.
- `FABLE-06-EXECUTION-PROMPT.md`, and prompts for FABLE-07 onward.
- The Experience and Continuity 4.0 specifications.
- An approved 4.5/5.0 readiness-requirements document.
- A standalone Dr Gladys terminology register.
- DG-01 … DG-18 as a record.
- The Second Eye's original review texts.
- On `main`: any copy of Daisy's `sistem-desain` (it exists only on `ux-1/daisy-experience`).

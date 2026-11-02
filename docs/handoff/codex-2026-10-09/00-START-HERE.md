# PINTAR 4.0 · Handoff to Codex: start here

**From:** Claude (the coordinator).
**Authority:** the project owner's Final Handoff Directive, 8–9 Oct 2026.
**Mode:** evidence preservation and transfer. Development stopped when the directive arrived. No code, test, migration, workflow, deployment or environment change was made after it. This package is documentation only.

**How to read it.**
- Statements here are either **verified** (re-read on 8 Oct from the repository, GitHub run records or the environment-facts run) or **recorded** (taken from an existing report or decision, and cited as such).
- An earlier GREEN or «complete» verdict is a recorded claim, never a fact by itself.
- Your job is independent verification against the original requirements, not a rebuild (09).

## 0. Read first: the 9 Oct evening delta

**[10-UPDATE-2026-10-09-EVENING.md](10-UPDATE-2026-10-09-EVENING.md)** records everything after this package was written (D-137 … D-140): main moved to 8851988, the Daisy application pass, fix batches A and B on the branch, the Golden School walks, the CI budget, and **Dr Gladys: NOT READY**. Sections 1–5 below are the 8 Oct state and are kept as written. Where 10 differs, 10 is the later fact. In particular, **S23q / CR-52 is CLOSED (D-137)**, not the open exception §5.1 describes (10 §7).

## 1. The state, verified 8 Oct 2026 (~13:20 UTC)

| Item | State | Source |
|---|---|---|
| Repository | `github.com/yazidmanan2409/pintar40` | |
| main | 8202139 (application code identical to **dab5c12**; later commits are documents only) | `git log` |
| Working branch | `claude/awesome-rubin-bqxp6p`. This package is committed there; see §4 | |
| Design lane | `ux-1/daisy-experience` at cc96030. APPLICATION READY verified on **c42fecb** | D-136(b); 03 |
| Other branches | Pete (website), Lana (lesson content), media, verify, Bob, Fiona, `gate/integration-*` snapshots | 05 |
| Staging | Vercel `pintar40-staging`, `staging.pintarselalu.com`, app **dab5c12**, Supabase `keijhmdtsgrfvnvocfvk` with **177** migrations, GREEN | facts run 37782586725 |
| Production | Vercel `pintar40`, `app.pintarselalu.com`, app **5b5b68d**. 661 code files differ from main; 111 migrations exist at its commit. Its database was **not read**: that needs owner permission. Supabase `trtlvibiybwixfumjrrx` | facts run 37782586725; 05 |
| Latest CI | 37775379355 on dab5c12: 18/18 jobs | 06 |
| Latest journeys | 37775382999 on dab5c12. Crawl A GREEN. Journey B **75 PASS, 1 FAIL: S23q (CR-52), a governed exception under D-123, unresolved, not a pass.** GitHub shows the run as `failure` for that reason | 06 |
| Golden School walk | **None on dab5c12.** The latest ran on earlier commits on 8 Oct | 06 |
| Branch protection | `main` reports `protected: false`. The landing rule is a procedure, not an enforced control | 05 |
| CI allowance | 1,792 of 1,900 minutes used, **108 left**. This is the coordinator's estimate method, not GitHub billing. One full CI plus journeys cycle costs about 125–147 | D-136(d); 06 |
| Human acceptance | **None recorded** for any capability | 02 |

## 2. The package

| # | Document | What it holds |
|---|---|---|
| 01 | [01-SYSTEM-AND-ARCHITECTURE.md](01-SYSTEM-AND-ARCHITECTURE.md) | Stack, code layout, architecture rules and ADRs, data model |
| 02 | [02-IMPLEMENTATION-INVENTORY.md](02-IMPLEMENTATION-INVENTORY.md) | 46 capabilities: requirement, code, database, screens, tests, defects, status, evidence |
| 03 | [03-DESIGN-AND-UX.md](03-DESIGN-AND-UX.md) | The design system (c42fecb), J1–J7, the unapplied migration map, copy and accessibility obligations |
| 04 | [04-SECURITY-AND-DATA.md](04-SECURITY-AND-DATA.md) | Authentication, authorization, RLS, grants, answer keys, integrity, certificates, publishing, transfers, audit and DR; **the L4 answer-key incident** |
| 05 | [05-INFRASTRUCTURE-AND-ACCESS.md](05-INFRASTRUCTURE-AND-ACCESS.md) | GitHub (45 workflows, landing rule, request files), Supabase, Vercel, and 65 secret/env **names** |
| 06 | [06-TESTS-AUDITS-AND-EVIDENCE.md](06-TESTS-AUDITS-AND-EVIDENCE.md) | The selftest (651 manifest entries), the crawl and journeys, the evidence model, a run index, a review index |
| 07 | [07-OPEN-WORK-AND-BLOCKERS.md](07-OPEN-WORK-AND-BLOCKERS.md) | Prioritised open work, and the genuine owner decisions |
| 08 | [08-HISTORY-AND-TRACEABILITY.md](08-HISTORY-AND-TRACEABILITY.md) | Manifest of foundation documents (with NOT FOUND items), evidence index, timeline of declared completions and later defects |
| 09 | [09-CODEX-FIRST-SESSION.md](09-CODEX-FIRST-SESSION.md) | Access to establish, read-only verification steps, what not to do |

### Canonical sources (linked, not copied)

- **Decisions:** `docs/coordination/DECISIONS.md` (to D-136).
- **Rebuild baseline:**
  - `docs/rebuild/00-ARCHITECTURE-BASELINE-FREEZE-RECORD.md` … `16-PINTAR-ENGINEERING-AND-VERIFICATION-SYSTEM.md`;
  - `BASELINE-MANIFEST.json`;
  - `REBUILD-READINESS-REPORT.md`.
- **Closure:**
  - `docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md`;
  - `PINTAR-4.0-CLOSURE-STATUS-2026-10-07.md`;
  - `PINTAR-4.0-CLOSURE-L4-2026-10-08.md`;
  - `PINTAR-4.0-MORNING-HANDOFF-2026-10-08.md`.
- **Terminology:** `docs/coordination/ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md`, `TERMINOLOGY-V1-CHANGE-IMPACT.md`, `UX-POLISH-REGISTER.md`.
- **Design system:** `ux-1/daisy-experience:docs/coordination/ux/sistem-desain/`. It is **not on main**.
- **Backup/DR:** `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`.
- **The 3.0 handoff:** `docs/product/PINTAR-COMPREHENSIVE-HANDOFF-2026-08-28.md`.

## 3. Missing historical evidence (searched; not recreated)

08 §1 has the full search. These are **NOT FOUND** on any branch:
- the PINTAR Doctrine / «Constitution I» source and the «Platform» PDF; `CLAUDE.md`, which cites them, does not exist in the repository;
- the original consolidated 4.0 roadmap and the «Consolidated Architecture Amendment Instruction»;
- an «approved 4.5/5.0 architecture-readiness requirements» document. The nearest is the Architecture Horizon Review of 29 Sep (AMBER, c80ffab), D-060, and decision clauses «carried into 4.5 and 5.0»;
- the 3.0 package files of 2026-08-09 and the `pintar-3.0-consolidated/` tree, which the 3.0 handoff cites;
- `claude/FABLE-SYNCHRONIZATION-REPORT.md`, which the freeze record cites; `FABLE-06-EXECUTION-PROMPT.md`; the prompts for FABLE-07 onward;
- the 4.0 Experience and Continuity specifications;
- the Second Eye's own review texts (only the coordinator's summaries in reports and decisions exist) and the DG-01 … DG-18 records;
- a standalone consolidated Dr Gladys terminology register. Its content is in the L4 report §4 and in the L4-G01 test register.

## 4. Where this package is, and why

This package is on **`claude/awesome-rubin-bqxp6p`**. It is **not on main**.

The landing rule lets main take a documents-only commit only on CI-skipped paths. Those are `docs/{coordination,reports,deployment}/**` of inert types. `docs/handoff/**` is not one of them, so pushing this package to main would start a full CI run, which the directive forbids.

To put it on main, either:
- the owner approves that CI run; or
- `ci.yml`'s skipped paths are widened. That is a configuration change, for the owner to authorise.

## 5. Headlines for the incoming team

1. **S23q / CR-52** (the question bank) fails in every journey run. It is a governed exception, not a pass (07 P1).
2. **The L4 answer-key incident** (04 §11):
   - **What was exposed:** a workbook with live SD 5 Bab 1 questions, keys and reasons, under `public/contoh/`.
   - **When:** on staging, for about 2 h 20 min on 8 Oct, from e7fb612 until dab5c12.
   - **Who could reach it:** any signed-in session, judged from the proxy's matcher in code; this was not tested on the running site.
   - **Fix:** removed in c124e92 and guarded by L4-C01.
   - **Not known:** whether anyone downloaded it; access logs were not read.
   - **Still in the repository:** the source workbooks and keys under `docs/onboarding/`.
3. **Production is far behind main** and has had no release since 23 Sep. A release is a deliberate owner step (D-004).
4. **Backup/DR is NOT PASS**: B3–B9 open (`docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`).
5. **The application pass** (the design system into `src/`) has not started. APPLICATION READY is a design freeze, not application readiness (03).
6. **Approved decisions are implementation authority** (D-135). Escalate to the owner only under D-135(b).

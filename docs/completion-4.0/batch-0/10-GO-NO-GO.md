# Batch 0 · Deliverable 10 · GO / NO-GO (2 Nov 2026)

**This report does not authorise anything.** It states what Batch 0 established and what Claude recommends. Batch 1 starts only on the owner's explicit authorisation (deliverable 9).

## 1. The exit gate, line by line

| Exit criterion (2 Nov authorisation) | Result | Evidence |
|---|---|---|
| CI compatibility restored or explicitly blocked | **RESTORED** on the development branch. `ci.yml` green unchanged on Ubuntu 26.04. The browser jobs needed a pin to 24.04 (Playwright 1.55 has no 26.04 build) | Deliverable 2; runs 41375753148, 41377378758 (red, cause), 41377773745 (after the pin: green), 41378821622 (Batch 0 head: green) |
| Local and branch verification passes | **PASS** | Local: tsc 0, eslint 0, full selftest **660/0** (1 CI-only justified skip). Branch: CI **18/18, selftest 661/0/0** on 0fb65bb and on the Batch 0 head 1a040d4; journeys A and B green |
| Accessibility harness works, with findings recorded | **PASS** (harness); the baseline is **not clean** and is recorded | Deliverable 3; `evidence/a11y-baseline-2026-11-02.json` |
| Security scan complete, critical findings escalated | **PASS**. **0 credentials.** Answer-key exposure escalated as F-4 (already known, decided public by D-143). New: two real-chapter copies under `audit/fixtures/` | Deliverable 4 |
| Safeguards tested | **PASS**: SEC-G01/G02 red then green; the pre-commit hook refused a planted personal address | Deliverable 4 §5 |
| Six corrections complete | **PASS** | Deliverable 5, with 07 and 08 |
| Plan consistent | **PASS**, with one owner choice open (F-5: production upgrade placement, option B recommended) | E, G, D as corrected |
| No boundary crossed | **PASS** (§3) | — |
| Evidence attached | **PASS** | Deliverables 1–10, run ids |

**No item is reported PASS that was not run.** These are not verified in Batch 0:
- the 14 pinned staging, perf and diagnose workflows (IMPLEMENTED — NOT VERIFIED);
- staging and the Golden School (not authorised);
- production.

## 2. Recommendation

**GO for the owner to authorise Batch 1, once START conditions S-2, S-3 and S-4 are given:**
- F-3 (CR-91);
- F-4a/F-4b (content store; fixture replacement and removal);
- a Batch 1 CI allowance.

**Before Batch 1's merge** (not its start):
- branch protection on `main` (M-1);
- the staging freeze lifted (M-2).

**Not GO for anything else:**
- not for staging or production changes;
- not for any later batch;
- not for a Dr Gladys walkthrough (Gate 6 is far off: G §5).

**Decisions the owner can take now that shorten the critical path** (E, schedule):
- **commission Daisy (F-12)**: the five designs gate batch 3;
- **send Dr Gladys the written terminology request (F-13, deliverable 8 §5)**;
- **engage counsel (F-16)**: the longest external lane;
- **create the C1 token (O2)**;
- **buy the font licence and run the print proofs (F-11)**.

## 3. Boundaries kept

| Not authorised | Kept |
|---|---|
| Batch 1 or later | Nothing of Batch 1 started |
| Production, staging, the freeze, migrations, deploys | **No write.** One read-only aggregate count on staging (`auth.users` by synthetic domain: 0 rows), to establish that the repository's synthetic passwords open nothing there |
| Merge or push to `main` | None. All work is on `claude/awesome-rubin-bqxp6p` |
| Repository visibility, permissions, history | Unchanged. No rewrite, no deletion, no rotation |
| Scope, foundation | No application code changed. Changes are to CI workflow runner labels, the audit harness, a guard script, selftests and documents |
| CI ceiling (400 min) | Used **187** rounded-up runner-minutes (158.5 compute) of 400 (deliverable 1 §4); 0 ms billed |

## 4. Roadmap compatibility (D-144): known concerns only

This section draws only on what Batch 0 already found. It is **not** the future-readiness review, which happens before final 4.0 acceptance against `docs/reports/ROADMAP-STATUS-2026-09-29.md` and `ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md`.

| Concern | Roadmap item it touches | Class | Note |
|---|---|---|---|
| **Regenerated assessment items must be new items, not edits of the exposed ones** (F-4d, 240 items) | 4.5 Question Intelligence, longitudinal trends | **ARCHITECTURAL RISK (procedural), mitigation known** | If an exposed item's stem is edited in place under the same identity, its history mixes compromised and clean statistics. Mitigation: publish regenerated items as new items through Studio and retire the exposed ones. No schema change; a rule for the content lead in Batch 1 (W5.2) |
| Stable person identity across schools and years (`persons.pintar_id`, migration 127; certificates by PINTAR ID) | 4.5 longitudinal evidence, Educator Growth; 4.1 continuity | **READY** | Identity is per person, not per enrolment |
| Device and session boundary (`device_sessions`, the PostgREST pre-request of 154, BOB-29 shared-computer lock) | 4.1 cross-device continuation, QR-assisted transfer | **READY WITH FUTURE EXTENSION** | 4.1 extends this boundary rather than replacing it. Known from Batch 0's migration analysis; not reviewed for 4.1 in depth |
| Institution model is school-only (D-006); universal terminology would suggest more (deliverable 8 §4) | None in the approved roadmap requires non-school institutions | **READY WITH FUTURE EXTENSION** | Do not broaden by labels |
| Point-in-time recovery off (D-103): up to 26 h of writes lost on a restore | Longitudinal evidence durability once real schools use it | Already decided (D-103) | Re-examine at PRODUCTION READY, not in 4.0 engineering |

**No BLOCKER is known.**

## 5. Open owner decisions arising from Batch 0

| # | Decision | Recommended |
|---|---|---|
| F-4a…f | Answer keys and content (deliverable 5 §2.7) | Private store; replace the fixtures; mark the chapters; regenerate before real use; no history rewrite |
| F-5 | Production upgrade placement | **Option B**: one production change, on the accepted candidate |
| §4.1 of deliverable 4 | The owner's personal address in three files | Replace with a role address in Batch 1 (after the freeze lifts) |
| R-1…R-5 | Branch protection; secret scanning and push protection; environment protection; fork-PR approval; review of non-git surfaces | All; R-1 before the next merge |
| F-13 (restated) | Send Dr Gladys deliverable 8 §5 | Yes, with the existing F-13 questions |

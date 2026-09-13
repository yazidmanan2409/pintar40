# PINTAR 4.0 Architecture Baseline — Freeze Record

**Status:** FROZEN — Approved by the product owner, 2026-09-12 (Asia/Jakarta).

| Item | Result |
|---|---|
| Architecture reconciliation (docs/rebuild/01–16 vs. amendment instruction) | PASS |
| FABLE synchronization (FABLE-00–06 vs. baseline) | PASS |
| Remaining architecture contradictions | NONE |
| Implementation authorization | YES — subject to the documented open decisions and phase gates |

**Governing principle:** CALM ON THE SURFACE. RIGOROUS UNDERNEATH.

## What is frozen

- `01`–`16` in docs/rebuild (including `claude/16-PINTAR-ENGINEERING-AND-VERIFICATION-SYSTEM.md`) and `REBUILD-READINESS-REPORT.md` (v2, the A–H baseline report).
- `FABLE-00`–`FABLE-06` as synchronized on 2026-09-12 (see `claude/FABLE-SYNCHRONIZATION-REPORT.md`).

From this point the Doctrine hierarchy applies to changes: the baseline
changes only through an ADR (doc 13) recording the decision, its
calm-surface check and its traceability — never by editing a frozen
document silently.

## Gates that travel with the freeze

- **Open decisions (MUST ASK, doc 11):** OD-1 accreditation framework · OD-3 source editions/ISBNs · OD-5 legal retention durations · OD-8 non-MCQ types with real content · OD-9 transfer authorization/consent policy · OD-10 certificate identity presentation · OD-11 public Mini-PINTAR in first release. None blocks FABLE-01.
- **Phase gates (doc 16 §6):** each FABLE phase ends with a green selftest manifest, a bounded mini audit, fixes, and an explicit gate before the next phase; critical-boundary audits at first RLS/storage, first certificate issuance, first eligibility view, first AI Gateway call, first transfer; final release audit.
- **Public Platform & Technical Specification page** must be updated at launch (readiness report F-1).

## Next step

FABLE-01 (Foundation) may begin only on the product owner's explicit
instruction to start, per FABLE-00's phase rules.

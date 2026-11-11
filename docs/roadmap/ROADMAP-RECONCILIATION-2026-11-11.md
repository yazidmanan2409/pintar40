# Roadmap reconciliation · 11 November 2026

> **Approved by the owner, 11 November 2026** (`OWNER-DECISIONS-2026-11-11.md` in this folder). The supporting record
> for `PINTAR-ROADMAP.md`.

**What was reconciled.** The earlier roadmap is the future-capability content of
`docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` (the "Horizon Review"), which D-144 (2 Nov) named as
authoritative, together with §21–22 of the Local Experience Layer study (2 Oct).
`docs/reports/ROADMAP-STATUS-2026-09-29.md` is a 4.0 status report and holds no future roadmap. The newer direction is
the owner's of 11 Nov 2026 (4.5 UNDERSTAND, 5.0 ACT & GROW), which takes precedence.

**Rule applied.** An earlier capability is kept where the new direction needs it, replaced where the new direction
does the same job better, deferred where no need is yet demonstrated, and retired only where it conflicts with the
direction.

## 1 · Dispositions

| Earlier capability (version) | Disposition | Reason | Source |
|---|---|---|---|
| **Question Intelligence** (4.5) | **Retained in 4.5, as a foundation** | Measurement quality must precede interpretation. Scope as the owner set it: difficulty, option and distractor behaviour, discrimination where sufficient, revision effects, reliability where supportable, insufficient evidence, instrument comparability | Owner, 11 Nov, §2 |
| **Question weighting** (4.5) | **Split.** Its prerequisite, "a recomputation uses the sitting's own scoring policy", is retained in 4.5. The feature itself is **deferred beyond 5.0** | Weighting changes what a score means, at the moment 4.5 is establishing whether scores are comparable. There is no evidence base for choosing weights until Question Intelligence exists. The prerequisite is version discipline that comparability needs regardless | Analysis; Horizon Review §2, §7; D-060 |
| **Report Intelligence** (4.5) | **Replaced** by Quiet Intelligence and the evidence and insight classification | The same aim, explaining a report, done with a stronger rule: every statement classed as recorded, derived, inferred or not concluded | Owner, 11 Nov, §5 |
| **Context Passport and Context QR** (4.5) | **Split.** Immutable snapshots, "as of" evaluation and versioned templates are **retained in 4.5** as "explainable history". The outward-facing passport and its QR are **deferred beyond 5.0** | A sealed formal evaluation and any explainable conclusion need to show exactly what was said at the time. An artefact for sharing context outside the school has no demonstrated need, and 4.1's print reference already traces a printed report | Analysis; Horizon Review friction 5, §7 |
| **Composable workflows** (5.0) | **Split.** Server-enforced progression and completion rules are **retained in 5.0**. The general composer is **deferred beyond 5.0**; 5.0 uses a small set of governed journey shapes | Interventions and prerequisites need journeys other than the one fixed cycle, and progression enforced only in pages is an integrity weakness. A general drag-and-drop composer is infrastructure ahead of need | Analysis; Horizon Review friction 2; failure-modes record ("speculative abstractions") |
| **Composable dashboards / 60-second dashboards** (5.0) | **Replaced** by Quiet Intelligence. The 60-second objective is kept as a usability principle: a reader knows within about a minute what needs attention. It authorizes no general dashboard composer | User-assembled dashboards multiply figures and comparisons, which is the opposite of "quiet" and invites unsupported comparison. Schools already choose a report's figures from the governed catalogue | Analysis; owner, 11 Nov, §4 (restrictions on unsupported comparisons) |
| **Plugin API** (5.5) | **Deferred beyond 5.0, uncommitted.** Reconsidered only against a demonstrated need | No present requirement. The project's own failure-modes record names a generic plugin system as a failure mode. If governed cross-school research ever needs external access, it gets purpose-built read accessors, not a general API | Owner, 11 Nov, §9; `docs/rebuild/12-PINTAR-FAILURE-MODES.md` |
| Performance Distribution; longitudinal trends (4.5) | **Retained in 4.5** inside Quiet Intelligence, subject to comparability | Same aim; now governed by sufficiency and comparability | Owner, 11 Nov |
| Misconception mapping (4.5) | **Retained in 4.5** as part of Question Intelligence and competency identity | — | Horizon Review §7; owner, 11 Nov, §8 |
| Conversational drill-down (4.5) | **Deferred beyond 5.0** | AI may phrase an approved conclusion; a conversational interface invites it to decide what evidence proves | Owner, 11 Nov, §5 |
| Adaptive unusual-access checks (4.5) | **Retained in 4.5** (operational) | Earlier ruling stands | D-088 |
| WhatsApp sign-in (4.5) | **Retained in 4.5** (operational) | Earlier ruling stands | O41-2 |
| Learning System Composer; student-created activities (5.0) | **Deferred beyond 5.0** | As the general composer above | Analysis |
| Certificates rendered from a snapshot (4.5) | **Retained in 4.5** under explainable history | — | Horizon Review friction 6 |
| Controlled theming (5.x) | **Deferred, unchanged** | Not affected by the new direction | Horizon Review §7 |

**New in the direction, absent from the earlier roadmap:** governed formal educator evaluation and its safeguards; the
educator protections; the evidence and insight classification; stable competency identity; educator-authored
prerequisites; Educator Growth and the Shared Growth Compact; interventions and the three intervention claims.

## 2 · The item-statistics findings (static inspection; runtime verification outstanding)

The owner asked that the state of the September findings be established, not assumed. The Horizon Review (friction 7)
recorded four. Read at `claude/system-integrity-4.0` `7dfe2bc8`, the statistics view is the September definition
(`supabase/migrations/20260928100000_academic_evidence_is_its_own_boundary.sql:109-125`) with one later change:
sittings on a withdrawn lesson are excluded (`supabase/migrations/20270113150000…:170-183`, owner ruling of 10 Nov).

**Incorrect calculations** (the view computes something, and it is not what its name says):

| # | Finding | Evidence |
|---|---|---|
| 1 | Every answer change is counted, not only the final answer | The view counts all rows of `academic_responses` (`:111`); nothing filters on `is_final` |
| 2 | A multiple-answer question is always read as wrong | An answer is matched to an option by one label only (`:124`, `r.value ->> 'pilihan'`) |
| 3 | Time on a question is measured from when the paper was assembled, not from when the learner first saw the question | `received_at − presented_at` (`:116`); the first-view record is not used |

**Analytical capability not yet implemented** (nothing is computed, so nothing is wrong):

| # | Finding | Evidence |
|---|---|---|
| 4 | Empirical difficulty and discrimination are never computed | No migration sets `items.empirical_*`; the columns are only excluded when a course is copied |

**Limits of this finding.**
- It was established by reading the migrations. **No database was run. Runtime verification is outstanding** and is
  part of early 4.5 work: each finding is to be reproduced with a test before anything is changed.
- The raw evidence is intact (answers are append-only, with `is_final`, the sequence and the first view recorded), so
  the statistics can be rebuilt correctly.

**Known limitation of existing outputs.** The September review recorded that Question Health reads these views. Where
a Question Health figure depends on them, it carries findings 1 to 3 today, in 4.0 and 4.1. Which figures depend on
which view is to be confirmed with the runtime verification.

**Not reopened.** 4.1 is not reopened to correct these findings (owner, 11 Nov). Question Intelligence remains an
early 4.5 foundation.

## 3 · Recorded, not decided here

- **Educator evaluation.** The Chief Architect's recommendation to replace formal evaluation drafts with
  educator-owned evidence summaries was considered by the owner and **not adopted**. The approved seven-step
  architecture stands, strengthened by the safeguards listed in the roadmap (A4, A5).
- **Misconception annotations and structured codes.** Supported in principle; a proposed 4.1 consideration that needs
  a separate technical review and the owner's approval. It is not part of C2w or of THE PLAN (roadmap, R-3).
- **Retention of educational evidence.** A separate governance decision; not a 4.1 engineering task (roadmap, R-2).

## 4 · Repository changes made with this record (owner's authorization, 11 Nov; branch `claude/roadmap-45-50`)

| # | Change | Kind |
|---|---|---|
| 1 | `docs/roadmap/PINTAR-ROADMAP.md` | new; authoritative for direction after 4.1 |
| 2 | `docs/roadmap/ROADMAP-RECONCILIATION-2026-11-11.md` | new; this record |
| 3 | `docs/roadmap/OWNER-DECISIONS-2026-11-11.md` | new; the owner's rulings, including the supersession of D-144's roadmap authority |
| 4 | A banner at the top of `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` | one paragraph added; nothing removed or rewritten |

Nothing else is changed. THE PLAN for 4.1, the 4.1 records, application code, migrations and tests are untouched.

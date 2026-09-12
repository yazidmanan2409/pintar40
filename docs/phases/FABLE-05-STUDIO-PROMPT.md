# FABLE-05 — Studio: Content Factory, Quality, Review, Publish Readiness, Freeze, Publish, Assign

*Synchronized to the Architecture Baseline (docs/rebuild/01–16). Controlling
documents for this phase: 02 (Learning content; Governance; AI Provider
Gateway and contexts), 04 §1–2, §4, §9, 05, 07 ("MCQ Quality"), 08, 09.
Two sections of the earlier prompt are superseded: the "±15% option-length
delta / all options balanced in length" rule (now exploitable-pattern
detection without cosmetic uniformity), and §8 "psychometric calibration
loop" with Rasch recalibration and auto-generated briefs (operational
Rasch/IRT and auto-drafted briefs are LATER; Question Health basic signals
and psychometric-ready evidence are the BUILD NOW replacements).*

Depends on Phases 1–4 (green and audit-gated). This is where the capability
model from Phase 1 §4 gets its UI, and where content enters the system as a
first-class workflow rather than direct seeding.

Target experience: for valid content, publishing feels closer to uploading
media than administering an LMS database — while underneath it remains fully
governed (calm on the surface, rigorous underneath).

## 1. Studio home ("Beranda")

Task-first, not a dashboard of everything: packages awaiting my action
(`Action Required`), items awaiting my review, blocked packages
(`Blocked`), Question Health signals awaiting decision. A card with zero
count simply does not render.

## 2. Content Factory — ingestion (`CAN_DRAFT`) (doc 02 "Content Ingestion")

Two paths, both landing at `INGESTED` and converging on the canonical PLP:

- **Easy Upload**: folder / ZIP / loose files. PINTAR recognizes likely
  asset roles and structure, infers what it safely can, and asks the
  uploader to confirm the rest in plain language — it never silently guesses
  a mapping that changes what a learner will see.
- **Structured Package Import**: machine-produced canonical package for
  industrial-scale ingestion.
- Manual authoring for individual items/lessons.

User-facing verbs are "Create Learning Package / Assessment / Video" —
never "Import / Parse / Validate". External tools (NotebookLM, Claude,
Gemini, any producer) are producers, not PINTAR's CMS; no vendor-specific
parser is built (PARK). AI-produced material carries **AI provenance**
(capability contract, provider/model id, request id, validation result) via
the `ai-gateway/` boundary — contracts and provenance only, no
multi-provider routing (FOUNDATION NOW). **Authoring Intelligence Context**
(privileged: sources, keys, misconception maps) exists only inside Studio/
server code paths and is never the context of any learner-facing
capability (INV-31).

## 3. MCQ Quality / Testwiseness (doc 07; Lesson 14; INV-35)

Before an item can leave `STRUCTURED`, the Phase 2 quality checks run and
their findings are surfaced as coaching (Lokasi · Masalah · Mengapa penting
· Cara memperbaiki), severity-graded:

- Detected patterns: correct-option length imbalance, grammatical cues,
  systematically more precise correct answers, implausible distractors,
  stem wording exposing the answer, answer-position patterns across a bank,
  over-use of all/none constructions, weak misconception linkage,
  suspicious bank-wide regularities.
- The purpose is detecting **exploitable patterns**, not cosmetic
  uniformity: options are **not** forced to identical lengths, and no fixed
  percentage threshold is the rule — a finding is raised when the pattern
  is exploitable (e.g. correct options systematically 2–3× longer across a
  bank), with the evidence shown.
- ERROR findings block Publish Readiness; WARNING findings must be
  acknowledged by `CAN_REVIEW` (not the author).
- Every wrong option keeps its authored rationale and misconception link
  (INV-03).
- Seeded, deterministic option shuffling in the engine (Phase 4) keeps
  correct-answer position evenly distributed; authoring guidance for AI
  producers (vary length, structure and specificity across options) is
  advice injected into the authoring contract, never a validation rule.

## 4. Review queue (`CAN_REVIEW`)

- Reviewer must differ from author on the same item (enforced server-side,
  not by hiding a button).
- Every validator and quality finding shown as coaching, never a raw
  error/stack trace.
- Approve transitions to APPROVED — a human sign-off, row still editable.
  **APPROVED ≠ FROZEN.**

## 5. Publish Readiness (doc 04 §1a) — a major Studio capability

For any package at STRUCTURED or later, one calm status with the exact
reasons:

| Surface state | Meaning |
|---|---|
| `Ready` | technical validation passed ∧ academic approval recorded ∧ FROZEN ∧ no unresolved ERROR finding ∧ WARNINGs acknowledged |
| `Action Required` | something a human can fix in Studio now — the list says what |
| `Blocked` | VALIDATION_FAILED, an ERROR finding, a missing rationale/misconception link, or a safety-language hit — the list says which |

Technical validation, academic validation and publish readiness are
separate underneath; the user sees one state and a plain-language list.
Preview (learner view, sanitized) is available from this screen.

**Acceptance requirement:** an administrator takes a complete, valid
externally generated chapter or book package, uploads it, understands
immediately whether it is publish-ready, corrects identified problems,
previews it, publishes it and assigns it to learners — with no developer,
database or AI-agent intervention.

## 6. Freeze & publish (`CAN_FREEZE_RELEASE`, `CAN_PUBLISH`)

- "Approve & Freeze" — the moment content becomes immutable and hash-locked
  (Phase 2 §2). Make the immutability consequence legible in the UI copy.
- Publish/withdraw restricted to `CAN_PUBLISH` only (Institution Admin,
  System Admin) and only when Readiness is `Ready`; the server re-checks.
  No AI or external tool can publish (INV-32). Withdrawing moves the release
  to SUPERSEDED, chain intact — never deleted.
- Publishing assigns nothing (PUBLISH ≠ ASSIGN).

## 7. Learning Assignment and release correction (`CAN_ASSIGN_LEARNING`; doc 08)

- Assign a published release to a class/cohort: subject/course,
  grade/context, academic period, availability window, required/optional,
  learning-cycle configuration (which generates the pre/post Assessment
  Assignments from two distinct definitions). Assigned-by/at recorded.
- **Release correction:** when v1.1 supersedes v1.0 on an ACTIVE assignment,
  Studio shows the three learner groups and the policy: completed → stay
  v1.0 (no action possible); active → pinned to v1.0 unless a governed
  intervention is explicitly chosen and justified (future sessions only);
  not-started → may be moved to v1.1 by explicit action. Every move is
  audited with actor, reason, affected learners, old/new release. Nothing
  moves automatically; no history is rewritten.

## 8. Item quality and Question Health surface (doc 04 §9)

Surfaces pre-publication quality findings, the media-completeness report
(transcripts), and — once Phase 6 computes them — Question Health signals
(`SIGNAL_RAISED`) with the evidence behind each (correctness rate,
distractor uptake, position effects over `OFFICIAL` evidence, minimum
sample shown). Reviewers with `CAN_REVIEW_QUESTION_HEALTH` record
`ACKNOWLEDGED_OK` or `ACTION_TAKEN` (→ a Curriculum-Improvement
Recommendation → a new content edit → a new release). PINTAR never states
"too easy", "invalid" or "curriculum wrong"; it shows evidence and possible
explanations. Predicted difficulty is shown as authored; empirical fields
appear only when legitimately computed, otherwise an honest "not enough
evidence yet". **No Rasch/IRT recalibration, no auto-drafted improvement
briefs in this phase (LATER).**

## 9. Media management

Asset upload UI wired to the Phase 1 §7 signed-upload contract exclusively
— confirm no code path in this phase's UI ever calls a client-side direct
storage `.upload()` with the anon key.

## 10. Configuration Studio panels (Phase 1 §10 shell)

- **Assessment Definition builder**: configure assessment rules without
  writing code — mode, pool draw, item count, difficulty mix, safety-gate
  minimum, passing rule, attempt limits, shuffle policy, pause/offline
  tolerance, hesitation window and late-sync grace **within platform-governed
  bounds**. Saving a rule that changes interpretation creates a new
  definition version. No hardcoded item counts or windows in route code.
- **Integrity review center**: review signals from Phase 4 (category-7
  evidence) grouped per session/class, coaching-framed for reviewers
  ("N signals for review"), with `CAN_REVIEW_INTEGRITY` human decisions
  recorded to the audit trail. Never an accusatory verdict to the learner;
  no automatic outcomes; no surveillance controls exist to configure.
  Anomaly records are integrity signals and audit rows — not a second log
  table.
- **Certificate template manager** (Phase 4): layouts and numbering
  prefixes per module/course; identity-presentation options limited to what
  OD-10 has decided.
- **Content & Question Banks**: bank tier and cooling administration;
  Question Health review list (§8).
- **Institution Report Templates** are Phase 6.

## 11. Middleware coverage (INV-37)

Confirm (don't assume) that server authorization covers every route added
in Phases 3–5, including in-progress learning and assessment routes. An
expired/revoked scope grant interrupts an active session on its next
server round-trip (INV-17); an assignment window closing or class ending
does **not** (INV-27).

## 12. Calm surface

No lifecycle enum (`VALIDATION_FAILED`, `FROZEN`…), evidence class or
version string is shown to Studio users as such; they see `Ready / Action
Required / Blocked`, "Approve", "Approve & Freeze", "Publish", "Assign".
Design tokens only.

## Acceptance checklist — selftest contract (must be green before Phase 6)

- [ ] An educator without `CAN_REVIEW` cannot approve their own drafted item
      via a direct API call; a reviewer cannot approve their own draft.
- [ ] INV-35: each adversarial fixture bank (2–3× longer correct options;
      ~70% one position; implausible distractors; stem-copied wording) yields
      `Blocked` with the correct finding named; a bank with naturally varied
      but non-exploitable option lengths yields no finding (no cosmetic
      uniformity rule).
- [ ] A finding is served in Lokasi/Masalah/Mengapa penting/Cara memperbaiki
      shape (assert the response shape).
- [ ] Scripted acceptance flow: upload a complete valid synthetic package
      via Easy Upload → `Ready` → publish → assign to a class → a learner in
      that class can start; a learner in another class cannot. Same via
      Structured Package Import. An ambiguous Easy Upload asks a
      confirmation question instead of guessing.
- [ ] Freezing via the API produces the same immutable, hash-locked result
      as the Phase 2 database-level test; publishing while `Blocked` is
      refused server-side.
- [ ] An Educator cannot publish/withdraw; a SERVICE/ingest path cannot set
      PUBLISHED (INV-32); DEAN is refused on every Studio endpoint (INV-19).
- [ ] PUBLISH ≠ ASSIGN: after publish, no learner can see the release until
      a Learning Assignment exists.
- [ ] Release correction: with completed, active and not-started synthetic
      learners on v1.0, moving to v1.1 leaves completed and active learners'
      sessions/results on v1.0, moves only the not-started set, writes one
      audit row per move, and refuses an automatic move.
- [ ] Uploading a lesson asset through Studio never results in a client
      holding anon-key write access (assert the upload goes through the
      server route).
- [ ] INV-17 / INV-27: revoking a scope grant mid-session interrupts on the
      next server round-trip; closing an assignment window does not.
- [ ] A non-admin role hitting the definition builder / integrity center /
      certificate template manager endpoints gets a clean refusal; saving a
      definition outside governed bounds is refused; changing an
      interpretation-affecting rule creates a new version (INV-29).
- [ ] Integrity: a recorded review decision produces an audit row; no
      endpoint returns a verdict field; no surveillance configuration exists.
- [ ] INV-31: a learner-assistance request originating from Studio preview
      still receives only the sanitized context.
- [ ] Schema-lint: no provider-named table/enum; empirical difficulty columns
      remain NULL after the whole Studio flow (nothing seeded).
- [ ] Copy inventory: no lifecycle enum or version string on any Studio
      screen.

Add these to the running `selftest` manifest — it must stay green across
Phases 1–5 together before Phase 6 starts. Then: mini audit (AI direct
publication paths, answer-key exposure in Studio preview, dummy fallbacks,
provider concepts, anonymous uploads); fix; gate.

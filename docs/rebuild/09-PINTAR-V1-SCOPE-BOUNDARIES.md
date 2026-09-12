# 09 — PINTAR V1 Scope Boundaries

Conservative by design. "Architectural awareness" means the schema/API
shape shouldn't make the feature impossible later — it does not mean
building any part of it now.

## A — MUST IMPLEMENT IN THIS REBUILD

- Full Dr. Gladys learning cycle (pre-test → reading map → lesson →
  post-test → results) for SD, SMA math/geography, and one university
  certification course.
- PLP content model with full lifecycle enforcement (doc 04 §1).
- Scoped roles/capabilities, tenant isolation, RLS-closed-by-default.
- Three-tier question bank isolation (PRACTICE/TEST/EXAM) with exposure
  cooling.
- Server-authoritative assessment engine per doc 07.
- Certificates with versioned signing keys and one canonical public
  verification route.
- Studio: import/author → review → freeze → publish, with the coaching
  validator (all six learner-read fields) and anti-bias distractor QA.
- Educator Class Learning Intelligence and Dean Institutional Learning
  Intelligence briefings, reading live cohort data (with honest
  insufficient-data states, never fabricated fallback data).
- Audit trail, CI with a committed lockfile, automated selftest suite per
  FABLE-00's self-test doctrine.
- Super Admin & Configuration Studio shell (system switches, multi-tenant
  setup, RBAC control, assessment preset builder, integrity/anti-cheat
  control center, certificate template manager) — the admin surfaces
  described in the uploaded blueprint conversations.

## B — ARCHITECTURAL AWARENESS ONLY (don't build yet, don't block later)

- **Cross-institution content licensing/sharing** — the domain model
  (doc 02) should not assume content is forever single-tenant, but no
  sharing UI/workflow ships in V1.
- **NotebookLM (or any specific AI vendor) direct-integration pipeline** —
  the PLP format must stay producer-agnostic (per the core philosophy);
  V1 ships the ingest/validate pipeline for a *structured* PLP-shaped
  payload, not a live NotebookLM API integration or a bespoke parser for
  its raw output format.
- **Rasch/IRT empirical difficulty recalibration** — the schema should
  hold the fields (`predicted_difficulty`, `empirical_difficulty_p`) and
  the aggregate views should exist per doc 02/07, but the actual
  statistical recalibration job can ship as a stub/manual trigger in V1,
  with the real model wired in once N≥30 real cohort data genuinely
  exists — building a statistically rigorous model against zero real data
  is premature.
- **Automated Content Improvement Briefs auto-generation** — the
  misconception-convergence threshold detection can exist; auto-drafting a
  brief document for the reviewer is a later enhancement. V1 surfaces the
  convergence finding; a human still writes the brief.
- **Accreditation-framework-specific reporting** (e.g. a named accreditor's
  exact rubric) — the Institutional Learning Intelligence report shows
  real cohort/competency data; a specific accreditation body's structured
  output format is confirmed with the product owner before being encoded
  (see doc 11).
- **Anti-cheat beyond tab-switch/focus-loss logging** — the Integrity
  Control Center logs anomalies (Phase 5); proctoring-grade detection
  (webcam, lockdown browser, etc.) is not V1.

## C — EXPLICITLY OUT OF SCOPE (do not implement)

- Multiple concurrent AI-vendor content factories running simultaneously —
  V1 ingests one structured PLP payload format regardless of which AI (or
  human) produced it; building adapters for several vendors' raw output
  formats at once is unnecessary until a second vendor is actually in use.
- Digital/NFC-embedded physical ID-card credentials (the "3D flip card"
  concept from the uploaded design conversations) — a real design
  direction, but a print/physical-goods feature, not a V1 software
  feature. The A4 printable certificate is in scope; the ID-1 card format
  is not, unless the product owner confirms otherwise.
- Vercel/DNS/deployment-specific configuration steps described in the old
  handoffs — infrastructure choices are made fresh for PINTAR 4.0's own
  deployment target, not inherited as a specific vendor/DNS recipe.
- Legacy `soal`-table bank, legacy verification route shape, and any other
  artifact of the old three-generations problem (doc 01, Lesson 5) — there
  is nothing to port, migrate, or keep compatible with.

## D — FUTURE IDEA / NOT YET A REQUIREMENT

- A generalized, self-serve AI-parser "Paste & Pre-flight Validator" for
  arbitrary NotebookLM-style markdown drift (mentioned in the uploaded
  Gemini critique as a Phase 4 risk) — interesting, not a commitment.
- Item-pool-exhaustion mitigation via larger generated pools (45–60 items
  per formal assessment) — worth remembering once real EXAM-tier volume
  exists; not a constraint on V1's schema beyond already supporting
  arbitrarily large pools per blueprint.
- A dedicated "Question Factory" AI-authoring automation layer.
- Any specific maritime/medical/other-vertical certification beyond the
  one university course already in scope for V1.

None of the B/C/D items may influence V1 implementation decisions unless
the product owner explicitly moves them into A.

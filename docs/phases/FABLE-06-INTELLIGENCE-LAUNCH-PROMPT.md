# FABLE-06 — Intelligence Layer: Metric Catalogue, Reports, Briefings, Question Health Signals, and Launch Readiness

*Synchronized to the Architecture Baseline (docs/rebuild/01–16). Controlling
documents for this phase: 02 (Intelligence), 04 §8–9, 05, 06, 09, 16, 03
(INV-19, 20, 34). PINTAR owns metric semantics; institutions customize the
telling, never the meaning. Everything here reads `OFFICIAL` evidence only,
through the eligibility views.*

Depends on Phases 1–5 (green and audit-gated), and specifically on real
`OFFICIAL` cohort data existing for real institutions before real briefings
are trusted — do not build this phase against fabricated data as the
permanent state; synthetic tenants are for tests only.

## The 3-lens model

| Lens | Audience | Question | Artefact | Read time |
|---|---|---|---|---|
| Student | Learner | "What should I study next?" | Peta Bacaan Personal (built in Phase 3) | — |
| Educator | Lecturer | "What should I teach next?" | Class Learning Intelligence (Standard Report + briefing) | ~60s |
| Institution | Dean | "Is this program working?" | Institutional Learning Intelligence (Standard Report + report) | ~90s |

Binding rule: educators and deans get narrative and decisions, never raw
analytics tables or charts without an accompanying sentence saying what to
do about them. Different roles receive different explanations of the same
underlying evidence: **the evidence stays the same; only the telling
changes.**

## 1. Canonical Metric Catalogue, Standard Reports, Institution Report Templates (doc 02; INV-34)

- **Canonical Metric Catalogue**: PINTAR-owned, versioned definitions —
  name, meaning, calculation, evidence eligibility (`OFFICIAL` only),
  minimum sample, allowed visualizations, allowed audiences. Includes the
  readiness tiers as catalogue definitions (e.g. `Siap Sertifikasi` = ≥80%
  and 100% safety gate; `Perlu Review` = 60–79%; `Butuh Pendampingan
  Ekstra` = <60% or failed safety gate; `Belum Post-Test` = pre-test only)
  — these thresholds are catalogue values with a version, not constants in
  a component, and any change is a new catalogue version.
- **Standard Reports**: PINTAR-defined assemblies of catalogue metrics for a
  role and purpose (Class Learning Intelligence; Institutional Learning
  Intelligence; learner results).
- **Institution Report Templates** (`CAN_MANAGE_REPORT_TEMPLATES`): an
  institution's saved customization — metric selection from the catalogue,
  ordering, supported visualization choice, title, branding. **Never a
  formula, never SQL, never a redefinition of a metric.** Template schema
  references metric ids only.
- **Historical report provenance** (FOUNDATION NOW): a generated report
  records the catalogue version and template version it used.
- Scheduled reports are LATER; cross-school benchmarking is PARK.

## 2. Class Learning Intelligence (`/edukator/ringkasan`)

Hero stats (participants / comprehension / net gain), a short executive
summary, pre/post gain bars, explicit "do not reteach" vs. "focus here"
topic lists, ranked misconception cards (claim, affected learner count,
likely root cause, chapter reference), a timed lesson-plan suggestion
(e.g. "10 min case review · 8 min discussion · skip"), and a readiness
distribution using the catalogue tiers.

Reads live from the Phase 2 `official_*`-backed cohort-misconception and
item-statistics views — never a dummy-data fallback. Below the catalogue's
minimum sample, show an honest "not enough data yet, N of M needed" state.
Quick Assessment sessions (Phase 4) contribute like any other `OFFICIAL`
evidence.

## 3. Institutional Learning Intelligence (`/dekan/ringkasan`)

Hero trio (participants / net gain / safety-gate pass rate), an
institutional executive summary, a cohort comparison table (within the
institution) with the programme-total row highlighted, strongest
competencies vs. curriculum-review-needed areas, verified-credential count,
and a generic competency-outcome block. The accreditation-framework
mapping is **OD-1 — MUST ASK**; build the generic competency shape and bind
a framework by configuration only when the product owner confirms it. Do
not encode a named accreditor's rubric on assumption.

Dean surfaces are read-only. Confirm no Studio capability leaks into this
role's UI or API surface (INV-19).

## 4. Question Health — PINTAR learns from evidence (doc 04 §9; doc 02)

Compute basic signals per item over `OFFICIAL` evidence only, once the
per-signal minimum-evidence threshold is met (no noisy warnings from tiny
samples): correctness rate (nearly-always-correct / nearly-always-wrong),
distractor uptake (never-chosen distractors, convergence on one
distractor), position effects, and a simple longitudinal series. Advance
the Phase 2 `QuestionHealth` lifecycle `INSUFFICIENT_EVIDENCE → OBSERVING →
SIGNAL_RAISED`; the review decisions live in Studio (Phase 5 §8). PINTAR
surfaces evidence and possible explanations (legitimate difficulty,
wording, distractors, prerequisite weakness, lesson weakness, widespread
misconception); it never records an autonomous conclusion. **PINTAR
observes, learns and highlights. Educators interpret and decide.**

Psychometric-ready evidence continues to accumulate (item-level, with
provenance). **Operational Rasch/IRT calibration, discrimination analysis,
drift detection, cohort comparison analytics and advanced anomaly detection
are LATER** — do not build them, do not stub them with realistic-looking
numbers; empirical fields stay honestly empty until a legitimate method
runs over sufficient evidence. The misconception-convergence finding feeds
a Curriculum-Improvement Recommendation for a human; auto-drafting the
brief text is LATER.

## 5. Briefings inbox (`/briefings`)

Lifecycle `COLLECTING → GENERATING → READY → REVIEWED → ARCHIVED` (doc 04
§8), transition-enforced. Story-first cards: gain, issue, recommended
action — in that order. `COLLECTING` holds until the catalogue's minimum
sample is met over `OFFICIAL` evidence.

## 6. Class window / at-a-glance components

Small always-visible classroom-status components (e.g. a "classroom window"
card summarizing current session activity, and the Quick Assessment launch
entry) for an educator's home screen — glanceable, not a second dashboard.

## 7. Launch readiness (doc 16)

- Confirm CI still passes with the full feature surface — re-run the
  deliberately-broken-PR check once more.
- Confirm every non-negotiable in FABLE-00 is true **in the running
  system**, not just in a migration file: RLS closed by default; storage
  private + signed-URL only; hint-leak CHECK; rationale required;
  versioned certificate keys and full signed payload; one verification
  route; tenant isolation; Person-centred identity with append-only
  memberships; pinned `search_path`; append-only audit trail populated;
  middleware covering learning/assessment routes with correct
  start-vs-continue semantics; validator scanning every learner-read
  field; structural evidence eligibility; one engine; scoring
  reproducibility versions; no provider concept in the schema; lockfile
  committed.
- Remove or gate every dev-only tool behind `NODE_ENV==='development'` one
  more time, explicitly, with a production build.
- **Retention:** the anonymization job and institution retention windows
  remain **disabled** until OD-5 is answered; confirm no default duration
  exists anywhere.
- **Transfer:** the workflow remains behind policy configuration until OD-9
  is answered; confirm the lifecycle works in synthetic tenants.
- **Public surfaces:** only certificate verification is public unless OD-11
  moved Mini-PINTAR to BUILD NOW.
- **Emergency deployment drill (doc 16 §8):** in staging with synthetic
  tenants, run a scripted "Friday 10:05" drill — hundreds of active
  synthetic sessions, an expand-first migration plus application deploy,
  outbox replay across the cut-over, rollback to N−1 without schema
  rollback — and assert zero lost responses, zero duplicates, unchanged
  historical results and certificates, no manual SQL. Record it in the
  state-of-the-system doc.
- **Final release audit** (doc 16 §5–6) by an independent/adversarial
  reviewer searching for every dangerous pattern; traceability from each
  invariant id to its test and audit evidence.
- Write a short "state of the system" doc mirroring this project's
  evidentiary discipline: for every claim, mark it VERIFIED (name the
  manifest test id), NOT YET VERIFIED, or DESIGNED/NOT IMPLEMENTED. File
  presence is never treated as proof of behavior.
- Update the public Platform & Technical Specification page at launch so it
  no longer describes the 3.0 lifecycle, "where possible" overlap, a fixed
  hesitation window, or 3.0 designations (readiness report F-1).

## Acceptance checklist — final automated gate

- [ ] An educator briefing renders from `OFFICIAL` seeded session data for
      at least one class, and an honest "not enough data" state renders for
      a class below the catalogue threshold; SYNTHETIC/PREVIEW/PUBLIC_DEMO
      sessions in the same tenant change nothing (INV-20).
- [ ] A dean report renders for at least one institution; no
      Studio-capability endpoint responds for the dean role (INV-19).
- [ ] INV-34: saving a template with a formula, SQL fragment or unknown
      metric id is refused; a saved template changes only selection/order/
      visualization/title/branding; two institutions with different
      templates get identical metric values for identical evidence.
- [ ] Readiness tiers resolve from the versioned catalogue, not a constant;
      a catalogue version bump is recorded on the next generated report.
- [ ] Question Health: seeded item A (nearly always correct) and item B
      (nearly always wrong) reach `SIGNAL_RAISED` only after the minimum
      threshold; an item below threshold stays `INSUFFICIENT_EVIDENCE`; no
      row contains an autonomous conclusion; a reviewer decision writes an
      audit row.
- [ ] Empirical difficulty columns are still NULL for every item that has
      not been through a legitimate method (i.e. all of them in this
      release); no code path writes them.
- [ ] Emergency deployment drill passes in staging as described in §7.
- [ ] The full `selftest` manifest (Phases 1–6) is green on a good PR and
      red on a deliberately broken one, run now.
- [ ] Every checklist item from Phases 1–5 is in the manifest — if any was
      not added, add it now rather than re-verifying by hand.
- [ ] Independent final audit report exists with zero unresolved findings
      of the doc 16 §5 dangerous patterns.
- [ ] The "state of the system" doc exists and every claim in it is tagged
      VERIFIED (naming the test) / NOT YET VERIFIED / DESIGNED-NOT-IMPLEMENTED.
- [ ] Copy/route inventory across all surfaces: no "PINTAR 4.0", no
      lifecycle enum, no evidence class, no version string on any user or
      public surface.

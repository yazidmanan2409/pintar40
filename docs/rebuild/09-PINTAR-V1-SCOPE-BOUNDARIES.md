# 09 — PINTAR V1 Scope Boundaries

*Baseline amendment (2026-09-12): restructured from A/B/C/D into
BUILD NOW / FOUNDATION NOW / LATER / PARK per the strategic review. Every
prior item is carried into one of the four categories; nothing was silently
dropped. Category names used by older documents map as: A → BUILD NOW,
B → FOUNDATION NOW, C/D → LATER or PARK as listed.*

Conservative by design. **FOUNDATION NOW** means the schema/API/domain
boundary exists so the capability is not made impossible later — it does
not mean building any part of the capability itself. Design extension
points, not speculative features. Do not implement LATER/PARK capabilities
merely because an extension point exists.

## BUILD NOW — foundation required for a trustworthy PINTAR

- Identity, institutions, Academic Periods, Enrollments, Memberships
  (Person-centred learner identity; dated, append-only history — doc 02).
- Learner Transfer domain (request → authorize → execute; portable vs
  institution-scoped record classes — doc 04 §3c, INV-25).
- Profile and profile-photo foundation, with the Certificate Identity
  Snapshot (INV-30).
- Full Dr. Gladys learning cycle (Pre-Test / Pemetaan Awal → Personal
  Reading Map / Peta Bacaan Personal → Learning → Post-Test / Uji
  Penguasaan → Results/Growth/Mastery) for SD, SMA math/geography, and one
  university certification course — with zero pre/post overlap (INV-24).
- One authoritative assessment engine with modes (doc 07, INV-26).
- Teacher Quick Assessment (surface over the engine, ~1 minute to launch).
- Assessment resilience: durable outbox, idempotent replay, authoritative
  timing, auditable extensions, exactly-once finalization (INV-27/28).
- Assessment integrity evidence (proportionate category-7 events; review
  signals for humans; no verdicts).
- Content Factory / Studio: Easy Upload and Structured Package Import
  converging on the canonical PLP; author → validate → review → freeze →
  publish with the coaching validator (all learner-read fields).
- Publish Readiness (READY / ACTION_REQUIRED / BLOCKED with exact
  blockers) — acceptance: an administrator publishes and assigns a valid
  externally generated chapter/book without developer, database or
  AI-agent intervention.
- MCQ Quality / Testwiseness checks with adversarial regression fixtures
  (doc 07, doc 16 §4).
- Content lifecycle and versioning (doc 04 §1, doc 08), incl. the
  release-correction / active-learner policy.
- Learning Assignment (PUBLISH ≠ ASSIGN) and Assessment Assignment.
- Certificates with versioned signing keys, signed release binding
  (INV-05), identity snapshot, and one canonical public verification route.
- Evidence provenance, channel and class with structural eligibility
  (doc 06, INV-20/33).
- Canonical Metric Catalogue, Standard Reports (Educator Class Learning
  Intelligence, Dean Institutional Learning Intelligence, learner results)
  and Institution Report Templates (selection/order/visual/title/branding
  only — INV-34), with honest insufficient-data states.
- Psychometric-ready evidence: authored/predicted difficulty separate from
  empirical fields; empirical fields honestly empty until legitimately
  computed.
- Question Health basic signals (correctness rate, distractor uptake,
  position effects) over eligible evidence with minimum-evidence
  thresholds; longitudinal Question Health lifecycle (doc 04 §9).
- Scoped roles/capabilities, tenant isolation, RLS closed by default,
  private storage with server-gated uploads, audit trail from day one.
- Super Admin & Configuration Studio shell (system switches, multi-tenant
  setup, RBAC control, assessment definition builder, integrity review
  center, certificate template manager, feature flags).
- Engineering system: GitHub as source of truth, CI, canonical ordered
  migrations tested against clean install and upgrade path, deployment
  traceable to source (doc 16).
- Persona harness: deterministic synthetic environment across learner,
  teacher, reviewer, institution admin, platform admin, public user, with
  synthetic evidence unmistakably non-production (doc 16 §3).
- Continuous and independent verification: builder verification,
  automated verification, independent/adversarial audit, bounded audit
  cadence (doc 16 §5–7).
- Established design language inherited from PINTAR 3.0 (doc 15).

## FOUNDATION NOW — architectural boundaries without full implementation

- Provider-neutral AI Provider Gateway (capability contracts, canonical
  schemas, validation, provenance, governance — doc 02); no multi-provider
  routing yet.
- AI provenance on AI-produced artefacts.
- AI trust boundaries: Authoring Intelligence Context vs Learner
  Assistance Intelligence Context (INV-31).
- Mini-PINTAR / public-experience isolation: reuse of renderer, engine,
  question model, diagnostic concepts and content releases under
  `PUBLIC_DEMO` mode/class; the public experience itself is sized by the
  product owner.
- Paper evidence channels (`PAPER_MANUAL_ENTRY`, `PAPER_IMPORTED`) in the
  evidence model; no paper workflow.
- Feature flags / pilot capability (for governed rollouts and the emergency
  deployment scenario — doc 16 §8).
- Integration boundary (a named place for future SSO/integrations; nothing
  built).
- Retention / anonymization: institution-configurable windows,
  identifiable-vs-derived distinction, anonymization job shape; **no legal
  durations invented** (OD-5).
- Platform/data versioning (engine_version, scoring_policy_version, metric
  catalogue versions — recorded now, exploited later).
- Historical report provenance (a generated report records the catalogue
  and template versions it used).
- Cross-student integrity-analysis foundation (signals recorded per
  session; no cross-session analysis yet).
- PINTAR Care foundations (support/case entity boundary only).
- Patent traceability / innovation register (a place to link architecture
  decisions to patent-related technical concepts — doc 13 trigger; content
  supplied by the product owner, never invented).
- Extensible item-type registry (source-reflective types added as real
  content requires them — OD-8).

## LATER — real capabilities, not in this baseline

- Operational Rasch/IRT empirical calibration (once sufficient legitimate
  `OFFICIAL` evidence exists; never seeded).
- Advanced Question Health: discrimination analysis, drift detection,
  sophisticated cohort comparisons, advanced anomaly analysis.
- Controlled-overlap / anchor-item assessment mode for psychometric linking
  (a distinct explicit mode; never a relaxation of INV-24).
- Sophisticated AI academic analysis; multi-provider AI routing.
- Full PINTAR Care; Integrity Case workflow (human-run cases over review
  signals).
- Paper assessment workflow (manual entry and import UIs over the
  foundation channels).
- Scheduled reports.
- Replacement-edition / cross-book intelligence.
- SSO / integrations.
- Cross-institution content sharing/licensing (distinct from learner
  Transfer, which is BUILD NOW).
- Broader institutional operations; parent experience.
- Sophisticated rollout controls beyond basic feature flags.
- Automated Content Improvement Brief auto-drafting (convergence detection
  is BUILD NOW; auto-writing the brief text is LATER).
- Accreditation-framework-specific report shapes (generic competency
  report is BUILD NOW; a named accreditor's rubric waits on OD-1).

## PARK — not built unless explicitly reconsidered

- Invasive default proctoring; webcam/microphone/screen surveillance;
  raw/system keylogging.
- OMR (optical mark recognition) for paper.
- Extensive offline platform beyond justified resilience/paper support.
- NFC / physical ID-1 credential card with flip animation (OD-6: parked).
- Cross-school benchmarking.
- Arbitrary SQL / custom metric formulas in reports.
- Speculative AR/VR; unnecessary gamification (confetti, badges as
  decoration); technology added because it is fashionable.
- A vendor-specific parser for any producer's raw output (NotebookLM or
  otherwise) — producers convert to the canonical package; PINTAR does not
  chase their formats. (The self-serve "Paste & Pre-flight Validator" idea
  for markdown drift stays parked for the same reason; Easy Upload is
  file/asset-role recognition, not a vendor-format parser.)
- Vercel/DNS/deployment-specific recipes inherited from old handoffs —
  infrastructure is chosen fresh (doc 16), not inherited.
- Legacy `soal`-table bank, legacy verification route shape, and any other
  artifact of the old three-generations problem (doc 01, Lesson 5; doc 10).

## Rules

- Moving an item between categories requires an explicit, recorded
  product-owner decision and an ADR (doc 13).
- If a phase prompt seems to imply building a LATER/PARK item, stop and
  flag it rather than proceeding.
- Extension points are designed against a named LATER capability, never
  against a hypothetical; the design-review question remains "what is the
  second real caller?"

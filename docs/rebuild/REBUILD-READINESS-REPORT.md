# PINTAR 4.0 Architecture Baseline — Candidate for Review and Freeze

*Version 2 (2026-09-12). Supersedes the 2026-09 "Rebuild Readiness
Report" (verdict then: YES WITH CONDITIONS). Produced by applying the
Consolidated Architecture Amendment Instruction to docs 01–15 after reading
every document and the three source PDFs (Doctrine, Philosophy, Platform)
directly. No implementation was performed. This is a candidate: it is not
frozen until the product owner's independent reconciliation passes.*

---

## A. Amendment Summary

Material changes made to the architecture package:

1. **Governing principle and authority hierarchy** added (doc 15): calm on
   the surface, rigorous underneath; Dr. Gladys → Doctrine/Philosophy →
   approved decisions → invariants → capabilities → implementation; 3.0 is
   reference, not authority.
2. **Product naming rule** (doc 15, doc 08): "PINTAR 4.0" is internal only;
   never on certificates, verification pages, emails, reports, PDFs, public
   APIs/docs or marketing.
3. **Learner identity transcends institutions** (doc 02, 04 §3a–3c, INV-23,
   INV-25): Person, Account, Academic Period, Institution Enrollment,
   Class/Cohort Membership (dated, append-only) and Transfer are first-class;
   the "cohort membership snapshot" and "Institution 1─* User" shapes are
   replaced; portable vs institution-scoped record classes defined.
4. **Evidence provenance and eligibility are structural** (doc 06, INV-20,
   INV-33): provenance fields, evidence channel (ONLINE / PAPER_MANUAL_ENTRY
   / PAPER_IMPORTED / PUBLIC_DEMO) and evidence class (OFFICIAL / PREVIEW /
   SYNTHETIC / PUBLIC_DEMO) recorded at write time; consumers read only
   eligibility views and hold no grant on raw evidence; the former "WHERE
   clause every aggregate must include" rule is withdrawn.
5. **Pre/post separation**: zero identical-item and zero `parallel_group`
   sibling overlap for the standard cycle (INV-24; doc 04 §6; doc 07); the
   blueprint opt-in overlap design and OD-2's "configurable" recommendation
   are withdrawn; anchor designs are a distinct LATER mode.
6. **One authoritative engine with modes** (doc 07, INV-26): learning cycle,
   practice, test, exam, Quick Assessment, public demo, paper (foundation);
   `CAN_FLASH_QUIZ` renamed `CAN_QUICK_ASSESSMENT`; "Assessment Blueprint"
   renamed "Assessment Definition" (versioned) to carry the mode and
   governed parameters.
7. **Start eligibility ≠ continue permission** (doc 04 §5, INV-17, INV-27):
   authoritative session deadline; continuation independent of the
   assignment window and class state; only revocation, scope revocation,
   security intervention or authorized termination interrupt; TERMINATED
   state; audited extensions.
8. **Assessment resilience** (doc 07, INV-28): durable client outbox,
   idempotency keys, exactly-once acceptance and finalization, offline
   answering only where the definition allows, governed late-sync grace;
   the acceptance scenario (17 + 8 answers, process killed) is written in.
9. **Historical scoring reproducibility** (doc 08, INV-29): Result binds
   release id+hash, definition version, engine version and scoring-policy
   version; corrections are new policy versions and new linked Result rows.
10. **Content lifecycle**: APPROVED ≠ FROZEN stated explicitly; **Publish
    Readiness** projection (READY / ACTION_REQUIRED / BLOCKED with exact
    blockers, INV-35); MCQ Quality Findings with severity; human-only
    publication (INV-32); Easy Upload and Structured Package Import as the
    two ingestion paths converging on the canonical PLP.
11. **PUBLISH ≠ ASSIGN** (doc 02, 04 §4): Learning Assignment entity and
    lifecycle, distinct from Assessment Assignment.
12. **Release-correction / active-learner policy** (doc 08): completed
    learners keep v1.0; active learners pinned unless governed
    intervention; not-started learners may be moved explicitly; every move
    audited; the old "new sessions automatically get N+1" wording replaced.
13. **Question Health** (doc 02, 04 §9): longitudinal lifecycle with
    minimum-evidence thresholds; signals for educator review; no autonomous
    conclusions; basic signals BUILD NOW, calibration/drift/discrimination
    LATER.
14. **MCQ Quality / Testwiseness** checks feeding Publish Readiness, with
    adversarial regression fixtures in the verification contract (doc 07,
    doc 16 §4, Lesson 14).
15. **Psychometrics honesty**: authored/predicted vs empirical difficulty
    separated; empirical fields honestly empty; no seeded values (doc 02).
16. **Hesitation Window** configurable within governed bounds; the 25 s
    value is a configuration, not architecture (doc 07).
17. **Certificate binding corrected** (INV-05, doc 02, doc 08, doc 10):
    release id + content hash, definition version, identity snapshot,
    result, issuance time, number and key version are inside the signed
    payload; the previous "outside the HMAC payload" design is withdrawn.
    **Certificate Identity Snapshot** added (INV-30).
18. **AI architecture** (doc 02, doc 05, INV-31, INV-32): AI Provider
    Gateway; Authoring vs Learner Assistance Intelligence Contexts;
    provider identity is provenance only; AI proposes → PINTAR validates →
    humans govern.
19. **Educator positioning, Teacher Quick Assessment surface, integrity
    evidence category (7) with human-only decisions** (docs 02, 05, 06, 07).
20. **Reporting**: Canonical Metric Catalogue, Standard Reports, Institution
    Report Templates (selection/order/visual/title/branding only; no
    SQL/formulas — INV-34).
21. **Mini-PINTAR, paper channels, retention/anonymization, departure/
    export** modelled as foundations (doc 06, doc 09).
22. **Engineering & Verification System** — new doc 16: GitHub truth,
    migration discipline (expand → compatible deploy → backfill → switch →
    contract), persona harness, versioned selftest contract, independent
    audit with dangerous-pattern search, bounded audit cadence,
    stop-patch-loop rule, the Friday-10:05 deployment stress scenario, and
    "the user is not middleware."
23. **Scope restructured** to BUILD NOW / FOUNDATION NOW / LATER / PARK
    (doc 09) with every prior A/B/C/D item carried.
24. **Anti-patterns table** added (doc 10 §2); Lessons 5, 12 and new Lesson
    14 updated (doc 01); failure modes extended (doc 12); ADR template gains
    calm-surface check and Requirement → Architecture → Implementation →
    Test → Audit Evidence trace (doc 13).
25. **Security non-negotiables** 1–14 mapped to invariants; INV-36/37/38
    added where none existed (RLS closed by default, service role/
    middleware/data-boundary, one verification route).
26. **Open decisions** reassessed (doc 11): OD-2, OD-6, OD-7 resolved;
    OD-4 reframed; OD-5 and OD-8 narrowed; OD-9 (transfer consent), OD-10
    (certificate identity presentation), OD-11 (Mini-PINTAR in first
    release) added.
27. **FABLE crosscheck** (doc 14): post-baseline re-crosscheck table added;
    the FABLE-00–06 prompt files were not in the project, so earlier
    "already applied" claims are recorded as UNVERIFIED.

## B. Document Change Matrix

| Document | Changed? | Why | Major changes |
|---|---|---|---|
| 01-REBUILD-LESSONS-LEARNED.md | Yes (minor) | Lessons remain historically accurate; three needed baseline pointers | Lesson 5 → INV-26; Lesson 12 → "user is not middleware" + doc 16; Lesson 14 added (MCQ cues, explicitly marked as carried from the review, not re-verified against 3.0 source); Lesson 3/6/8/9 gain baseline cross-refs |
| 02-PINTAR-CANONICAL-DOMAIN-MODEL.md | Yes (major) | Identity, evidence, content-factory, assignment, intelligence and AI concepts were missing or wrong | Person/Enrollment/Membership/Transfer/Academic Period; Evidence Provenance/Channel/Class; Ingestion paths; Publish Readiness; Learning Assignment; Assessment Definition + Modes; Quick Assessment; MCQ Quality Finding; Integrity Signal; Question Health; Metric Catalogue/Standard Report/Template; AI Gateway + two contexts + provenance; certificate binding corrected; identity snapshot; ERD rewritten |
| 03-PINTAR-INVARIANTS.md | Yes (major) | INV-05 was the critical correction; many decisions had no invariant | INV-05 rewritten; INV-10/11/13/15/17/18/19/20/21 strengthened; INV-23…INV-38 added |
| 04-PINTAR-STATE-MACHINES.md | Yes (major) | New lifecycles and changed session semantics | APPROVED≠FROZEN explicit; §1a Publish Readiness; §3a–3c Enrollment/Membership/Transfer; §4 Learning vs Assessment Assignment; §5 continue permission, TERMINATED, replay; §6 zero overlap; §7 snapshot; §9 Question Health lifecycle |
| 05-PINTAR-AUTHORIZATION-MATRIX.md | Yes | New capabilities and principals need cells | Rows for ingestion/readiness/findings, Learning Assignment, Quick Assessment, extensions/terminations, identity/enrollment/transfer, report templates, Question Health, integrity, eligibility override, AI contexts, PUBLIC surface; rename to `CAN_QUICK_ASSESSMENT` |
| 06-PINTAR-EVIDENCE-AND-TELEMETRY-CONTRACT.md | Yes (major) | Eligibility was procedural; provenance absent | Provenance table; channel/class; structural eligibility section; category 7; new events (replay, late sync, extension, termination, integrity, question health, override, transfer); retention rewritten incl. departure/export |
| 07-PINTAR-ASSESSMENT-ENGINE-CONTRACT.md | Yes (major) | Engine/mode unification, resilience, versions, AI boundary | Modes table; start vs continue; INV-24 exclusion in draw; resilience section with acceptance scenario; reproducibility; Quick Assessment surface; integrity; MCQ quality; hesitation governed |
| 08-PINTAR-CONTENT-VERSIONING-CONTRACT.md | Yes | Certificate binding wrong; correction policy absent | Binding inside payload; "what else must be versioned"; PUBLISH≠ASSIGN; release-correction policy table; naming rule |
| 09-PINTAR-V1-SCOPE-BOUNDARIES.md | Yes (major) | Category scheme and contents superseded | Restructured to BUILD NOW / FOUNDATION NOW / LATER / PARK; every prior item mapped; new items placed per the review |
| 10-PINTAR-REMOVED-AND-REJECTED-FEATURES.md | Yes | Anti-patterns needed a home; three pre-baseline designs now rejected | §2 anti-patterns table; rows for unsigned binding, hardwired 25 s, configurable overlap; NFC → PARK |
| 11-PINTAR-OPEN-DECISIONS.md | Yes | Several decisions resolved/reframed; new genuine ones | OD-2/6/7 resolved; OD-4 reframed; OD-5/8 narrowed; OD-9/10/11 added |
| 12-PINTAR-FAILURE-MODES.md | Yes | New failure classes created by new mechanisms | 12 rows added (evidence contamination, AI context, unsigned credential, identity drift, silent reassignment, membership overwrite, hardwired constants, metric redefinition, provider concepts, patch loop, complexity leak, second engine) |
| 13-PINTAR-ARCHITECTURAL-DECISION-LOG-TEMPLATE.md | Yes (minor) | Traceability and calm-surface check required | "Traces to" and "Calm-surface check" sections; new mandatory triggers |
| 14-FABLE-PROMPT-CROSSCHECK.md | Yes | Baseline changes the contracts the prompts target; prompts unavailable to verify | Post-baseline re-crosscheck table (all UNVERIFIED); original retained with baseline notes |
| 15-FABLE-5.1-START-HERE.md | Yes (major) | Orientation must carry the governing principle and new rules | Principle, hierarchy, naming, learner cycle, educator positioning, AI boundaries, design language, security non-negotiables, reading order incl. doc 16 |
| REBUILD-READINESS-REPORT.md | Replaced | Prior verdict superseded | This document |
| **16-PINTAR-ENGINEERING-AND-VERIFICATION-SYSTEM.md** | **New** | Engineering system, harness, verification contract, audit cadence, stop-patch-loop and deployment scenario belong in none of 01–15 | Sections 1–9 as listed in A-22 |

Not changed: none of the sixteen documents was left untouched; each change
above is tied to a specific amendment item, not churn.

## C. Updated Architecture Package

Docs 01–16 and this report, written to the project as the amended files.
The same files are delivered alongside this report as
`pintar-4.0-architecture-baseline-candidate.zip`.

## D. Architecture Decision Summary (newly resolved)

1. Learner identity is Person-centred; institutions attach through dated,
   append-only Enrollments and Memberships (INV-23).
2. Transfer is a first-class, explicit, authorized, audited domain
   capability, distinct from content sharing (INV-25).
3. Evidence provenance, channel and class are NOT NULL at write time;
   eligibility is enforced by views and grants, never per-query filters
   (INV-20, INV-33).
4. Zero pre/post overlap incl. parallel groups; anchor designs are a
   distinct LATER mode (INV-24).
5. One assessment engine; everything else is a mode or a surface (INV-26).
6. Start eligibility ≠ continue permission; sessions carry an
   authoritative deadline; only INV-17 events interrupt (INV-27).
7. Exactly-once response acceptance and finalization via idempotency keys
   and a durable client outbox; offline answering only where the definition
   allows; governed late-sync grace (INV-28).
8. Results bind release id+hash, definition version, engine version and
   scoring-policy version (INV-29).
9. Certificate signed payload includes the release binding and hash,
   definition version, identity snapshot, result, time, number, key
   version (INV-05); identity snapshot immutable (INV-30).
10. APPROVED ≠ FROZEN; Publish Readiness is a derived projection with
    exact blockers (INV-35); publication is human-only (INV-32).
11. PUBLISH ≠ ASSIGN; Learning Assignment carries the release-correction
    policy; reassignments are explicit and audited.
12. Question Health observes and highlights; humans decide; minimum
    evidence thresholds; OFFICIAL evidence only.
13. Predicted and empirical difficulty are separate; empirical values are
    never seeded.
14. Hesitation window and other pedagogical parameters are governed
    configuration within platform bounds, not constants.
15. AI is reached only through a provider-neutral gateway; learner-facing
    AI contexts are built from the sanitized item type only (INV-31/32).
16. PINTAR owns metric semantics; institutions customize presentation only
    (INV-34).
17. Integrity evidence is category-7, proportionate, never scoring, never
    verdicts; no surveillance in the baseline.
18. GitHub is source truth; migrations are canonical, ordered, tested
    against clean install and upgrade path; expand-first evolution; the
    user is not middleware; a versioned selftest contract; independent
    audit; bounded audit cadence; stop-patch-loop (doc 16).
19. Scope categories are BUILD NOW / FOUNDATION NOW / LATER / PARK, with
    extension points designed only against named LATER capabilities.
20. NotebookLM and every other producer are external; no vendor parser;
    Easy Upload and Structured Package Import converge on the canonical PLP
    (OD-7 resolved).
21. NFC/physical card parked (OD-6 resolved).

## E. Remaining Open Decisions (genuine only)

| ID | Decision | Nature | Gates |
|---|---|---|---|
| OD-1 | Accreditation framework(s) for the institutional report | Product | Institutional Standard Report accreditation shape |
| OD-3 | Source books/editions/ISBNs for V1 content | Product | Real content authoring (fixtures may proceed) |
| OD-5 | Legal retention durations and anonymize-vs-delete per record class | Legal/product | Enabling the retention job for a real institution |
| OD-8 | Which chapters need which non-MCQ item types | Product (depends on OD-3) | Type-specific content and polish |
| OD-9 | Transfer authorization and consent model (who authorizes; learner/guardian consent; unresponsive sender) | Business/legal | Exposing Transfer to real institutions |
| OD-10 | What the certificate presents from the identity snapshot (photo, name form, post-issuance changes) | Product/privacy | Certificate template for the first real institution |
| OD-11 | Whether a public Mini-PINTAR trial ships in the first release | Product scope | Any public surface beyond verification |

None of these blocks FABLE-01. Engineering-level choices (idempotency key
format, grace-window default value, threshold values per signal, token
set) are deliberately not listed — they are decided during engineering and
recorded as ADRs.

## F. Contradiction Report

Checked pairwise across Doctrine, Philosophy, Dr. Gladys cycle, Platform &
Technical Specification, the amended architecture, and the roadmap
(doc 09):

1. **Platform & Technical Specification (public page, "PINTAR 3.0 · PLP
   V1.0 · living document") vs baseline — documentation currency, not an
   architecture contradiction.** The page shows a five-state lifecycle
   (INGESTED → VALIDATED → APPROVED → FROZEN → PUBLISHED), "avoiding
   identical items where possible," a fixed "held for 25 seconds," a
   "Next.js 14" stack, and reports theta/SE/fit as current. The baseline
   supersedes each (eight-state lifecycle with VALIDATION_FAILED; zero
   overlap; governed window; stack chosen fresh; empirical fields honestly
   empty until legitimately computed). The page describes 3.0 and calls
   itself a living document; it must be updated when PINTAR ships — it is
   not authority over the baseline (doc 15 hierarchy). **Action:** update
   the public Platform page at launch; do not let it drive implementation.
2. **Doctrine ch. 2 ("HMAC-SHA256 binds identity, score, and issue time")
   vs INV-05** — no contradiction; the baseline payload is a strict
   superset (adds release id+hash, definition version, number, key
   version). The Doctrine's "verifiable proof" principle is strengthened,
   not changed.
3. **Doctrine ch. 5 persona "Learning Center Owner" vs role model** — the
   architecture has DEAN and INSTITUTION_ADMIN, no named "owner" role. Not
   a contradiction (the persona maps to institution-level read/operate
   roles), but the Doctrine's learning-centre-network framing (branches,
   centralized picture) is a multi-site institution shape the Organisation
   hierarchy supports (Institution → Faculty/Department/Programme). Noted;
   no change required.
4. **Amendment §10 (local recovery, offline answering) vs prior doc 07
   ("never reconstructs state from client-local storage alone"; server-side
   hesitation timer) — reconciled, not contradictory.** Session *state*
   remains server-authoritative; only unacknowledged *responses* live in a
   durable outbox; offline answering is definition-gated; no assistance or
   hesitation events occur offline; late replays are governed.
5. **INV-17 ("expired grant interrupts a session") vs INV-27 ("window
   closing doesn't")** — reconciled by defining the closed set of
   interrupting events; a Membership closing by period rollover is not a
   revocation and does not interrupt.
6. **Old OD-2 recommendation (configurable overlap) vs Dr. Gladys cycle
   requirement (zero overlap)** — resolved in favour of the cycle (highest
   authority); recommendation withdrawn.
7. **Old doc 09 category B "NotebookLM direct-integration pipeline" vs
   Philosophy/Platform vendor-neutrality** — resolved (OD-7): producer only;
   no parser.
8. **Old docs 02/03/08 (release id outside HMAC) vs Doctrine "any
   tampering with protected data can be detected"** — resolved by INV-05.
9. **Amendment §42 places "Mini-PINTAR isolation" in FOUNDATION NOW while
   §30 describes a reusable public experience** — not a contradiction, but
   an unstated scope decision; recorded as OD-11 rather than guessed.

**No contradiction remains between the Doctrine, the Philosophy, the Dr.
Gladys learning cycle, the amended architecture and the roadmap.** Item 1
is a public-documentation update owed at launch, not an architectural
conflict.

## G. Stress-Test Report

| # | Scenario | Verdict | Mechanism |
|---|---|---|---|
| 1 | 4,000-learner institution onboarding | **PASS** | Persons created/linked (existing Persons reused, never duplicated), one Enrollment each under an Academic Period, Memberships to classes/cohorts (doc 02, 04 §3a–3b); bulk operations are audited (INV-18); tenant isolation from the first row (INV-13); no per-learner class field to overwrite. Load is an engineering concern, not an architectural one. |
| 2 | 400 learners progressing to next academic year | **PASS** | Period rollover closes Memberships with `valid_to` and creates new ones under the new Academic Period (04 §3b, INV-23); "who was in 5A on date D" stays answerable; in-progress sessions are unaffected because a rollover is not an INV-17 event (INV-27). |
| 3 | Student transfer School B → School C preserving authorized history | **PASS WITH CONDITION** | Transfer lifecycle (04 §3c), portable vs institution-scoped record classes, evidence keeps its original `enrollment_id` (INV-25), audit (INV-18). *Condition:* the authorization/consent policy is OD-9 (business/legal) — the mechanism is complete, the policy is configuration awaiting the product owner. |
| 4 | Corrected chapter after 1,000 completions | **PASS** | New release v1.1 (doc 08); completed learners keep v1.0; active learners pinned unless governed intervention; not-started learners moved only by explicit audited action on the Learning Assignment (PUBLISH ≠ ASSIGN); certificates unaffected (signed to v1.0 id+hash). |
| 5 | NotebookLM replacement | **PASS** | NotebookLM is an external producer only; Easy Upload / Structured Package Import converge on the canonical PLP (doc 02); no provider concept in the model (INV-32); no parser to retire (doc 09 PARK). Replacement changes nothing inside PINTAR. |
| 6 | AI-provider replacement | **PASS** | AI Provider Gateway owns contracts/schemas/validation/provenance; provider is provenance metadata only (INV-32); Authoring vs Learner Assistance contexts are PINTAR's, not the provider's (INV-31). Switching providers is a gateway adapter change with no domain or schema impact. |
| 7 | Teacher surprise assessment | **PASS** | Quick Assessment surface (doc 07): Class → Quick Test → Topic → Count/Time → Launch, `CAN_QUICK_ASSESSMENT`, eligible class/bank within governed limits (doc 05); same engine, same evidence (INV-26); Assessment Assignment goes DRAFT → OPEN in one action (04 §4). |
| 8 | Power/network interruption | **PASS** | Durable outbox + idempotency keys + exactly-once acceptance (INV-28); server-authoritative state re-read on return; definition-gated offline answering; governed late-sync grace; finalize idempotent (doc 07). The 17 + 8 acceptance scenario is written into doc 07 and the verification contract (doc 16 §4). |
| 9 | Migration during hundreds of active assessments | **PASS** | Expand → compatible deployment → backfill → switch → contract (doc 16 §2); N and N−1 coexist; sessions stateless per request and server-authoritative; deadlines in the database, not process memory; replay covers cut-over failures (INV-28). |
| 10 | Scoring bug discovered six months later | **PASS** | Every Result carries engine and scoring-policy versions (INV-29); fix is a new policy version; affected results are identified by version, recomputed via a documented audited process that writes new linked Result rows; history is never edited (doc 08, INV-33); certificates issued on affected results are revoked/superseded, never patched (04 §7). |
| 11 | Learner profile photo changed after certificate issuance | **PASS** | Certificate Identity Snapshot taken at issuance; render and verification read the snapshot only (INV-30); profile edits are the learner's (doc 05) and never touch the certificate. *Note:* whether a photo appears at all is OD-10 — the mechanism passes regardless. |
| 12 | Certificate curriculum-release tampering | **PASS** | Release id **and** content hash are inside the signed payload (INV-05); altering the binding fails verification; keys versioned (INV-07); one verification route (INV-38); timing-safe compare (INV-06); adversarial fixture per protected field (doc 16 §4). This was the critical correction and is now closed. |
| 13 | 100k Mini-PINTAR anonymous sessions | **PASS WITH CONDITION** | PUBLIC_DEMO mode reuses engine/renderer/question model/releases (doc 07); evidence class PUBLIC_DEMO is structurally excluded from analytics, Question Health, psychometrics, mastery and certificates (INV-20); rate-limited public principal (doc 05); retention within the demo's own scope (doc 06). *Condition:* whether the public trial ships in the first release is OD-11; capacity is engineering. |
| 14 | Synthetic evidence attempting to contaminate analytics | **PASS** | Synthetic tenants flagged; every evidence row inherits SYNTHETIC (doc 06, doc 16 §3); consumers read eligibility views only and analytics roles have no raw-table grant; CI lint; harness asserts zero synthetic rows in official aggregates (INV-20, INV-33, doc 12). Not dependent on anyone remembering a filter. |
| 15 | Question A nearly always correct / Question B nearly always wrong | **PASS** | Question Health lifecycle (04 §9): minimum-evidence threshold → OBSERVING → SIGNAL_RAISED for human review → ACKNOWLEDGED_OK or ACTION_TAKEN → new release; no autonomous "too easy/invalid/curriculum wrong"; OFFICIAL evidence only. |
| 16 | Systematic MCQ answer-length cues | **PASS** | MCQ Quality Findings at STRUCTURED → VALIDATED (04 §1); ERROR-level findings BLOCK Publish Readiness (INV-35); adversarial fixtures (2–3× longer correct options, 70% one position, implausible distractors, stem-copied wording) are part of the verification contract (doc 16 §4); no forced equal lengths. |
| 17 | Unusual answer-pattern integrity signal | **PASS** | Category-7 integrity evidence (doc 06) recorded proportionately, never scoring; patterns raise review signals; `CAN_REVIEW_INTEGRITY` human decision audited; no automatic verdict, no surveillance (doc 05, doc 09 PARK). Cross-student analysis is FOUNDATION NOW; Integrity Case workflow LATER. |
| 18 | Institution departure / export / retention | **PASS WITH CONDITION** | Departure/export section (doc 06): authorized export of institution-scoped records and evidence; Persons and portable records remain the learners'; certificates stay verifiable; identifiable records anonymized/deleted per policy while anonymized aggregates survive. *Condition:* legal durations and anonymize-vs-delete choices are OD-5 — must not be invented. |
| 19 | Friday emergency security deployment during ~600 active assessments | **PASS** | Doc 16 §8 walks Git, CI (no gate skipped), expand-first migration, rolling deployment, feature flags + new scoring-policy version if semantics change (INV-29), continue permission unaffected (INV-27), outbox replay (INV-28), explicit audited terminations only if required (INV-17), rollback without schema rollback, monitoring, audit records with the SHA. No manual SQL anywhere in the path. |
| 20 | Future new item type without creating another assessment engine | **PASS** | Item types are an extensible, source-reflective registry rendered and scored by the one engine (doc 02, doc 07, INV-26); adding a type touches the item model, sanitizer allow-list (doc 07) and renderer — never assembly/scoring/gate; code-search CI flags a second engine (doc 12). Which types get real content is OD-8. |

Summary: 17 PASS, 3 PASS WITH CONDITION (each condition is a recorded
business/legal/product decision — OD-9, OD-11, OD-5 — not an architectural
gap), 0 FAIL.

## H. Final Recommendation

**READY TO FREEZE** — as the PINTAR 4.0 Architecture Baseline, subject to
the product owner's independent reconciliation, with these reasons and
these stated conditions.

Why ready:
1. Every amendment item (§1–§48 of the instruction) is reflected in a
   specific document and, where it is a rule, in a testable invariant
   (INV-01…INV-38) or an enforced lifecycle — not only in prose.
2. The one critical correction (certificate release binding outside the
   signature) is closed at the domain model, invariant, versioning
   contract, state machine and rejected-features level simultaneously; no
   document still states the old design as current.
3. The prior contradictions (configurable pre/post overlap; NotebookLM
   emphasis; procedural evidence exclusion; membership snapshots) are
   resolved in favour of the higher authority in every case, and the
   resolution is recorded in doc 11 rather than left implicit.
4. All twenty stress scenarios pass at the architecture level; the three
   conditions are business/legal/product policies the architecture already
   carries as configuration.
5. Nothing blocks FABLE-01. The remaining open decisions gate specific
   later phases and are the kind that must not be guessed.

Conditions that travel with the freeze (not reasons to delay it):
- **FABLE-00–06 must be re-crosschecked and amended against this baseline
  before FABLE-01 begins** (doc 14, post-baseline table). The prompt files
  were not in the project during this pass; every prior "already applied"
  claim about them is UNVERIFIED and must be checked by reading the files,
  not the earlier crosscheck.
- The public Platform & Technical Specification page describes 3.0 and
  must be updated at launch (F-1); it is not to be treated as spec.
- Two renames introduced by the baseline — `CAN_FLASH_QUIZ` →
  `CAN_QUICK_ASSESSMENT` and "Assessment Blueprint" → "Assessment
  Definition" — must be carried into the FABLE prompts; old names in old
  material are historical.
- Lesson 14 (MCQ testwiseness in 3.0) is carried from the strategic review
  and was not re-verified against 3.0 source here; it changes no
  architecture, but if the product owner wants it stated as a verified 3.0
  finding, that verification should be done once against the consolidated
  source.

Per the standing instruction, this verdict is not self-approving: the
baseline is frozen only after the product owner's independent
reconciliation against the amendment instruction passes.

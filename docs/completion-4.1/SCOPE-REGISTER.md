# PINTAR 4.1 · scope register (one source of truth) · opened 9 Nov 2026

**Authority.** The owner's 9 Nov directives:
- «PINTAR 4.1 updated owner directive»: sections A–E;
- the clarification of the three additions;
- the maintenance ruling;
- «apply lessons from 4.0»;
- «platform-wide consistency».

Earlier 4.1 approvals come from the repository, cited below. This register replaces nothing in
`docs/coordination/DECISIONS.md`. It records the owner's 9 Nov additions there by reference, because they were approved
outside the repository.

**Objective.** A complete, internally verified PINTAR 4.1 that Dr Gladys and her educators can test as one educational
experience.

**Acceptance plan (owner, O41-5, 9 Nov).** **One complete PINTAR 4.1 educator walkthrough** with Dr Gladys and her team,
**targeting mid-December 2026**:
- No early-December partial walkthrough and no two-wave acceptance.
- The walkthrough covers the whole approved 4.1 experience (C1–C8), AI-assisted question generation and controlled
  cross-device recovery included, after internal verification.
- The date is a planning target, not permission to skip testing.
- A preview of partly completed capabilities is never acceptance of the platform.

**States.** Every capability is held at one of these states, and none moves on an implementation report alone:
1. **Approved:** scope ruled.
2. **Truth defined:** the evidence's meaning, who may do what, immutability, correction, what learner and educator see,
   and insufficient evidence.
3. **Reviewed before build:** Sharon and/or Daisy, as relevant.
4. **Implemented:** at an exact commit.
5. **Verified:** red→green database tests at the service boundary, journeys, the clean suite, exact-SHA CI.
6. **Independently verified:** Sharon/Daisy on that exact commit.
7. **Human-accepted:** an educator's recorded session.

**Boundaries.**
- No merge or deployment without authorization.
- No invitation to Dr Gladys until the agreed 4.1 candidate is internally ready.
- The 4.0 foundation (the System Integrity Gate, the Reporting Quality Gate and its human NVDA/TalkBack check) stays a
  precondition and is not weakened.

---

## 0 · How each capability is developed (owner, 9 Nov)

**PLAN → PREPARE → REVIEW → REVISE → PREPARE → EXECUTE.**
1. Second Eye plans: the existing implementation, dependencies and boundaries.
2. Sharon and Daisy review the design independently, **before** implementation, proportionate to risk. Full review for
   C1 and C3; design plus result for C4, C5, C7 and C8; a short check for C2 and C6.
3. Second Eye revises the design.
4. Prepare the regression tests, failure cases, fixtures, acceptance criteria and implementation plan.
5. Execute with continuous testing and independent verification on the exact commit.

Each plan answers, for Daisy:
- which screens change, for whom;
- the states (empty, refused, failed, expired, «not yet»);
- what it reuses;
- what the mechanism decides that the wording depends on.

**Owner rulings carried into every capability (9 Nov):**
- **School time zone:** each school's IANA zone is stored data, set and audited. Every school-facing time and schedule
  uses it, never a hard-coded WIB. Instants stay in UTC.
- **AI provenance:** educators and reviewers see it; learners get approved questions with no mandatory AI label, hidden
  in the API and database, not only on screen.
- **Printing:** only the official «Cetak laporan» issues an audit-linked reference. A browser print carries none and
  claims no audit.

## 1 · The register

| # | Capability | Source | Approved scope (summary) | Already in 4.0 (reuse) | State |
|---|---|---|---|---|---|
| **C1** | **Controlled cross-device assessment recovery** | Owner 9 Nov §B.1; **D-125** (7 Oct, `DECISIONS.md:133`) and its intake `docs/reports/PINTAR-4.1-DEVICE-HANDOFF-AND-EXAM-BINDING-INTAKE-2026-10-07.md`; D-132(e) handoff seam | Designated low-stakes assessments: learner self-recovery after re-authentication. **Single-writer protection** and audit. Higher-stakes recovery needs **teacher authorization**. D-125 adds: Exam Mode (no handoff; an authoritative attempt controller with a generation, checked at every boundary that changes an attempt); failed-device EXAM recovery as its own design and proof gate; a handoff cause in the working context | `device_sessions`, the shared-computer PIN lock, durable answers and resume (J6.8, D-096), the stale-continuation guard; `EXAM` mode exists but nothing assigns it. **Residual accepted in 4.0:** two devices of one learner can write to one attempt | Approved. **D-125 requires a focused investigation (six questions, a threat model, red cases) before any build** |
| **C2** | **Misconception annotations** | Owner 9 Nov §B.2 | Authorized reviewers add **attributed** annotations to existing sealed content; the original stays immutable; sealed scores and reports never change retroactively | Option misconception codes and the class misconception report (MC-9, F36-M01); taught content is immutable (`enforce_taught_content_immutable`) | Approved; truth to define |
| **C3** | **AI-assisted question generation** | Owner 9 Nov §B.3 | Educators provide or select source material; the AI drafts questions; **educators review and approve before publication**; provenance kept (model, source material); independent review and publication safeguards; built on Studio editing, item lineage and review | Studio's upload → check → review → approve → release → publish (W6.5, F23-*), the content check (Decision 2), the Question Bank (QN5) | Approved; **the last implementation phase (O41-6)**. Preparation now: the provider evaluation, the architecture for Sharon and Daisy, the tests. Production build only after its entry gate (§4) |
| **C4** | **Question revision lineage** | Owner 9 Nov §B.4 | The relationship between original and revised questions is preserved; historical assessment integrity is kept; **no claim of statistical comparability** between revisions in 4.1 | `items_lineage` / `enforce_lineage_pointer`, `create_course_revision` (package level), F23-W06 (the replaced version is history) | Approved; truth to define |
| **C5** | **Key-event accountability logging** | Owner 9 Nov §C.5 and the clarification | Significant events only: login success and failure, explicit logout, print and export requests, sensitive access where warranted, important administrative and integrity actions. Actor, timestamp, action, scope/resource, outcome. Inspected only by authorized administrators. **No click, page-view or behavioural monitoring.** «Accountability, not surveillance.» | `audit_log`/`audit_write` (D-093, D-097), «Jejak audit» (S23j), `learner_detail.opened`, `integrity.answers_opened` (D5), identity attempts. **4.0 does not log refused sign-ins (O2)** | Approved; retention ruled (O41-4) |
| **C6** | **Discreet printed-report identification** | Owner 9 Nov §C.6 | A quiet, legible footer on every printed report: printed by (the signed-in person's name), date and time in the right zone, a unique print reference linked to its audit record, page n of m. Legible in monochrome; never obscures content. **Logs the print request, not that paper came out.** Certificates keep their QR verification, not duplicated | `@page laporan` already prints «Halaman n dari m»; `KepalaCetak`, `AksiLaporan` («Cetak laporan») shared by every report | Approved; depends on C5 |
| **C7** | **Scheduled maintenance pause and resume** | Owner 9 Nov §C.7, the clarification, and **the maintenance ruling (preserve D-094)** | School Administrators schedule for **one class or the whole school**: start, end, a reason list (routine maintenance, system update, fault repair, network/power maintenance, Other with a short explanation), their identity captured. In-app warnings to affected active users at **60, 30 and 15 minutes**; a person arriving inside the warning sees the time left. Pause and resume at the scheduled times, subject to service readiness; extend or resume early. **Per the owner's ruling: a sitting already running finishes normally (D-094 drain); no automatic pause, timer extension, forced submission or new scoring.** New affected activity is blocked as today, and an assessment cannot start when it cannot finish before the window. Enforced at the operation boundary; every significant event audited. **Reuse the 4.0 implementation; no second system.** School Administrators have no immediate pause | `20261120100000_maintenance_is_announced_and_drains.sql`: school and platform windows, T−15 start block, database refusal at T=0 with drain, audit; `maintenance_list` paged; Konfigurasi's maintenance section | Approved |
| **C8** | **PINTAR Administrator emergency override** | Owner 9 Nov §C.8 and the ruling | An immediate pause at **class, school or platform** scope, with a reason, explicit confirmation, immediate notice, audit; lifted only by an authorized PINTAR Administrator. Containment first: accepted answers and attempt state preserved; nothing silently submitted, scored, failed or discarded; governed recovery afterwards | The `EMERGENCY` window (Admin platform only, typed phrase and reason, PT503 `PINTAR_DIHENTIKAN`) for chosen schools or the platform | Approved; class scope to add |
| **X** | **Platform-wide consistency** (cross-cutting) | Owner 9 Nov, «platform-wide consistency» | One design grammar, one vocabulary (ID/EN), one interaction behaviour, the same educational rules wherever a concept appears, shared facts from one definition, **one permission boundary across UI, API, database, background work and exports**, accessibility and responsive behaviour on desktop, mobile and print | Daisy's grammar and shared components; `hle.ts` (all copy); the 4.0 gates' cross-surface checks (e.g. B6K-URUTAN-02, R-T1, SI-D01) | Applies to every row above and to 4.0 |

**Added to 4.1 (owner, 9 Nov, the educator-roles directive):**
- formal educator job-position records, distinct from PINTAR authorization roles (D-059(c));
- dated position history, and promotion, demotion and lateral employment movements;
- acting-appointment labels;
- future-effective role start dates, subject to review.

4.0 keeps the person-centred «Ubah peran & tanggung jawab» on the existing role assignments
(`docs/completion-4.0/acceptance/ACCOUNT-LIFECYCLE-INVENTORY.md` §11).

**Moved out of 4.1 (owner, O41-2, 9 Nov):**
- **WhatsApp sign-in (#147) moves to PINTAR 4.5.**
- Its history is kept:
  - D-098(c), 4 Oct (`docs/coordination/DECISIONS.md:106`), moved it from 4.0 to 4.1;
  - its design options A/B/C and the open provider cost are in `docs/recovery/JOURNEY-LOG.md:154`.
- The requirements are preserved unchanged for 4.5. **Not implemented in 4.1.**

**Not 4.1 unless the owner rules them in** (recorded as studied or candidate only):
- the Local Experience Layer (study, 2 Oct);
- small-class and over-time privacy aggregation (candidates in the reporting matrix);
- QR continuity.

## 2 · Truth before code, per capability (to be settled, with Sharon/Daisy, before building)

| # | Evidence meaning and immutability | Who may create / inspect / change / approve | Correction | Learner and educator see | Insufficient evidence | Review before build |
|---|---|---|---|---|---|---|
| C1 | An attempt has one writer at a time (a generation); a recovery is a new controller generation, never a second writer | learner (low-stakes, after re-authentication); teacher authorizes higher-stakes | none to evidence; recovery is audited | the learner: where they left off; the teacher: who recovered, when | an attempt that cannot be reconciled stays as it is, never auto-submitted | **Sharon** (single-writer, integrity), **Daisy** (recovery flow, wording) |
| C2 | An annotation is a new attributed row beside sealed content; sealed scores and reports unchanged | authorized reviewers create; readers per content audience | a new annotation, never an edit | where misconceptions are shown, marked as an annotation, with author and date | none shown | **Sharon** (no retroactive change), **Daisy** |
| C3 | A generated question is a *draft* with provenance (model, source, educator, prompt version) until an educator approves it; then the same item lifecycle as any other | educator generates and approves; independent review and publication as Studio's | through revision lineage (C4) | Studio: provenance and draft state; learners see only published items, no AI label required unless ruled | a failed or empty generation creates nothing | **Sharon** (provenance, integrity), **Daisy** (review flow); owner decisions §3 |
| C4 | A revised question links to its original; past sittings keep the version they were shown | Studio roles as for content | a new version, never an edit of a taught item | Studio: the lineage; reports: per version, no comparability claim | — | **Sharon** |
| C5 | An audit row is append-only: actor, time, action, scope, outcome | written by the system; read by authorized administrators of that scope | none (append-only) | administrators: «Jejak audit»; nobody: click trails | — | **Sharon** (what is «significant», retention, privacy) |
| C6 | A print reference is the id of a logged print request | written when «Cetak» is requested; read via the audit | — | every printed report: the footer | a print without the reference is a defect, caught by test | **Daisy** (footer composition, monochrome) |
| C7/C8 | A window is a scheduled or emergency state with an audit trail; running sittings drain (planned) or are contained (emergency) | School Admin: planned, own class or school; PINTAR Admin: emergency at any scope, and lifts it | extend, end early (audited) | affected users: the warnings, the pause screen with the resume time | a sitting that cannot finish before the window cannot start | **Sharon** (operation boundary, containment), **Daisy** (warnings, pause screen) |

## 3 · Owner decisions

| # | Decision | State |
|---|---|---|
| O41-1 | **C3 AI provider** | **Evaluation approved in principle (9 Nov, second ruling):** a controlled blind comparison of Anthropic, OpenAI and Google, **total spend ≤ US$25**, about 30 drafts each on identical authorized Indonesian material; a materially incorrect key is a critical defect; educators judge educational quality, Sharon provenance and data handling, Daisy language and workflow; official pricing and binding data terms confirmed **before** provisioning; no learner data; **no selection or integration before the owner reviews the results** (`C3-EVALUATION-PLAN.md`). **Principle ruled (9 Nov):** AI-generated questions enter official assessments only through the normal educator review, approval and publication safeguards. **Selection open:** the comparison is `C3-AI-PROVIDER-COMPARISON.md`. Recommendation: Claude Sonnet 5.5, subject to a small blind evaluation (Sharon for item quality, Daisy for language). The provider, its data terms, the evaluation's external calls, a spend cap and the key are the owner's to approve (escalated, new external cost) |
| O41-2 | **WhatsApp sign-in** | **Ruled (9 Nov): moved to PINTAR 4.5**, history and requirements preserved; not in 4.1 |
| O41-3 | **C1 stake levels** | **Ruled (9 Nov):** self-recovery for low-stakes assessments; **teacher-authorized recovery for Uji Penguasaan**; stricter **Exam Mode** controls. **The D-125 investigation is completed before implementation** (done: `C1-D125-INVESTIGATION.md`). **Second ruling (9 Nov):** transactionally enforced single-writer authority at every attempt boundary, **service-role operations included**; accepted evidence preserved; stale-device writes rejected; Sharon reviews the controller-generation design and Daisy the recovery journeys; **the C1 red cases are written before implementation**; **SI-D02 is proven by a deterministic concurrency test and, if confirmed, corrected in 4.0 before C1** |
| O41-4 | **Failed-sign-in logging** | **Ruled (9 Nov): 12 months' retention** for failed-sign-in accountability records. Only the necessary security information is kept: time, outcome, account or identifier hash, method, coarse network origin. **Never a password or verification code, and no behavioural surveillance.** Access is restricted to authorized administrators of that scope and the platform. In 4.1 this reverses 4.0's O2, through C5 |
| O41-5 | **Educator walkthrough** | **Ruled (9 Nov): one complete 4.1 walkthrough, mid-December 2026**, no partial or two-wave acceptance |
| O41-6 | **Sequence; C3 last** | **Ruled (9 Nov):** C3 is moved to the **last major implementation phase**. The dependency and completion order: (1) the 4.0 integrity and reporting foundations; (2) C4; (3) C2, C5, C6; (4) C7, C8; (5) C1; (6) C3. Parallel work continues where it is safe; this is an order of dependency and completion, not a stop on other work. C3's planning, the provider evaluation, Sharon's and Daisy's design review and its test preparation proceed early («Prepare thoroughly. Execute confidently.»). **No C3 production implementation until its dependencies are independently verified and the earlier capabilities are stable.** C3 stays fully in the 4.1 acceptance scope: complete and internally verified before the single walkthrough. The owner's reasoning: evaluate the providers early, build the feature last, so that AI-quality problems are found while there is time to fix them |

Everything else here is implementation detail, resolved by engineering with Sharon and Daisy, early.

## 4 · Dependencies and sequence

```
4.0 foundation (SI Gate, timezone, consistency, RQG human check) ──► precondition for everything below and the candidate
C4 revision lineage  ──► C2 (reads C4's item identity) and ──► C3
C5 key-event logging ──► C6 print identification (the reference is an audit row) and ──► C3 (provenance and audit)
C7 maintenance       ──► C8 emergency (one system; class scope shared)
C1 recovery          ──  touches every attempt boundary (highest risk); design revised for Sharon's five gaps first
C3 AI generation     ◄── C4, C5, a dependable Studio review/publication workflow, Daisy's Studio consistency applied
X consistency        ──  applied in every row; Daisy's and Sharon's cross-module checks
```

**Completion order (owner, O41-6):**
1. The 4.0 integrity and reporting foundations.
2. C4.
3. C2, C5, C6.
4. C7, C8.
5. C1.
6. **C3, last.**

Lanes run in parallel where it is safe. A capability may be built while an earlier one is finishing. It is **completed**
(state 5, verified) in this order, and nothing later is allowed to destabilize what an earlier one verified.

**C3's entry gate (owner, 9 Nov: dependency-based, not sequential).** C3 production implementation starts when its own
foundations are secure. These are **essential dependencies**, and each one blocks the start:
- C4 is independently verified (state 6): a draft is revised and approved through lineage.
- C5's audit write path, and the authorization model C3 uses (who may generate, review, approve), are verified.
- The Studio upload → check → review → approve → release → publish workflow passes its journeys on the current head.
- Daisy's consistency findings for the existing Studio screens are applied.
- The 4.0 foundation items that touch Studio, authorization or provenance are closed.
- Sharon and Daisy have reviewed C3's architecture.
- The owner has selected the provider from the evaluation results (O41-1).

These are **delivery preferences**, and none of them blocks C3's start:
- C2 (one exception: if C2 changes Studio's item screens, C2's Studio part is settled first, so the two share one design);
- C6, C7, C8;
- C1.

An open defect in an unrelated capability, such as a maintenance-screen defect, does not hold C3.

**What does not change:**
- C3 is still **completed last**.
- It passes the same complete acceptance as every capability: states 5 and 6 on the candidate's exact SHA.
- Nothing it adds may destabilize what another capability has verified.

**What C3 may do before the gate:**
- the evaluation kit, prepared now (`docs/completion-4.1/c3-eval/`), with the paid run following once provider terms and
  access are ready;
- the architecture and its review;
- the threat model;
- the test cases, written and held outside the manifest. None of these touches the
schema or the product.

Integration journeys (Admin → Teacher → Student with each capability) are extended **as each capability lands**, not at
the end.

## 5 · Effort (engineering days, including tests; reviews are elapsed time on top)

| # | Build + tests | Sharon / Daisy | Risk | Note |
|---|---|---|---|---|
| C1 | 10–14 (investigation 2–3; controller at every boundary; recovery flows; red cases) | both, twice (design, result) | **high** | touches start, answer, resume, submit, finish |
| C2 | 4–6 | both | low | new table and Studio surface |
| C3 | 8–12 (+ provider setup, + the blind evaluation 1–2) | both | **high** | last (O41-6). Preparation reduces the build: the architecture reviewed, the tests written, the provider chosen from the evaluation. The build is about 7–9 days after the gate |
| C4 | 3–5 | Sharon | medium | item-level lineage on top of the package lineage |
| C5 | 4–6 | Sharon | medium | sign-in events touch identity paths |
| C6 | 2–4 | Daisy | low | needs C5's print event |
| C7 | 5–7 | both | medium | class scope, reason list, 60/30/15 warnings without polling |
| C8 | 2–3 | Sharon | medium | class scope on the existing emergency kind |
| X | 4–6 across the period | both | — | audit of existing patterns before new screens; fixes in scope |
| 4.0 foundation | 4–6 (SI open rows, the final candidate's runs) | Sharon | — | already under way |
| **Total** | **≈ 46–69** | | | lanes A–D run in parallel; review and the clean suite serialise |

## 6 · Delivery to the mid-December walkthrough (O41-5)

**The calendar:**
- From 9 Nov to mid-December is about **5 weeks**.
- Internal readiness must come **before** the walkthrough is scheduled: the clean suite, exact-SHA CI and journeys on
  one candidate SHA, Sharon's and Daisy's independent verification, and the 4.0 foundation complete. That needs
  **about 1 week**.
- So all capability work targets **about 6 December**, leaving the week of 7–13 December for integrated verification and
  review of the single candidate.

**Feasibility:**
- At four parallel lanes, 46–69 engineering days fit about 4 weeks only if:
  - the C3 evaluation's paid run can happen in the second half of November. The kit is prepared now, and API access is not
    a blocker today;
  - C1's revised design passes Sharon's re-review by about 19 November;
  - review turnaround stays prompt.
- The two highest-risk capabilities set the date:
  - **C1:** the revised design, two reviews, twelve-plus boundaries.
  - **C3:** last by ruling (O41-6), so it has the least slack. The evaluation runs early so that AI-quality problems
    (wrong keys, weak Indonesian) are known three weeks before the build ends, not during it.

**Planned sequence (O41-6; four lanes, reviews early):**

| Week | Lane A (foundation, C5 → C6) | Lane B (C4 → C2; Studio) | Lane C (C7 → C8) | Lane D (C1; C3 preparation, then build) |
|---|---|---|---|---|
| 10–15 Nov | 4.0: SI-D01 closed on the exact SHA; school time zone; Daisy's meaning-changing inconsistencies. C5 truth + Sharon | C4 truth + Sharon; build | C7 truth: class scope, reason list, 60/30/15; Daisy on warnings | C1 design revised for Sharon's five gaps; ten red cases added. **C3:** architecture for Sharon/Daisy; evaluation material prepared |
| 16–22 Nov | C5 built, verified; C6 + Daisy | C4 verified → Sharon; C2 truth, build; **Daisy's Studio consistency applied** | C7 built | C1 re-review; red cases written red; build starts. **C3:** the blind evaluation runs (if authorized); results to the owner |
| 23–29 Nov | C6 verified; X consistency audit | C2 verified; Studio journeys green | C7 verified; C8 class scope, verified | C1 build: the controller at every boundary. **C3: entry gate checked (~26 Nov); build starts** |
| 30 Nov–6 Dec | X fixes; journeys extended | C3 review flow in Studio (with Lane D) | journeys; release readiness | C1 verified; recovery journeys. **C3 built, verified (~6 Dec)** |
| 7–13 Dec | **one candidate SHA:** clean suite, CI, journeys, Sharon and Daisy on that SHA, the 4.0 foundation | | | |

**Honest assessment (owner, 9 Nov):**
- **The dates in this table are forecasts, not promises.** The gate around 26 November and C3's verification around
  6 December leave little margin for an educational-quality problem that needs a redesign.
- **The walkthrough moves rather than present an AI question generator whose answers educators cannot trust.**
  - C3 is not shortened, and verification is not compressed.
  - If the evaluation or C3's own verification finds keys or language educators cannot trust, the fix is made and
    re-verified, and the walkthrough date follows.
- The same holds for C1: if its re-review slips past about 22 November, the walkthrough moves by that slip.
- The register's status log and each capability's state are the evidence; nobody, including Second Eye, reports a
  capability done on an implementation report.

## 7 · Status log (exact commits)

| Date | Capability | State | Commit | Evidence |
|---|---|---|---|---|
| 9 Nov | C3, C5 | owner's review of the plan: **C3's entry gate made dependency-based** (essential dependencies vs delivery preferences, §4); **O41-4 ruled: 12 months**; the evaluation kit prepared now, paid calls later; the dates are forecasts and the walkthrough moves before an untrusted generator is shown | (this commit) | the owner's review, 9 Nov |
| 9 Nov | all | **sequence ruled (O41-6): C3 last**, with an entry gate (§4); §4–§6 restated; evaluation and preparation early | (this commit) | the owner's sequencing decision, 9 Nov |
| 9 Nov | C1 | **design reviewed by Sharon** (`1f7b6fc2`): five gaps, three high (device identity from verified claims, never a parameter; generation decided by the server; final-answer selection across generations), a completed boundary list, one lock order, and ten missing red cases. **Next: revise the design** (Second Eye); Daisy reviews the recovery wording alongside | `1f7b6fc2` | Sharon's review, 9 Nov |
| 9 Nov | all | register opened; C1–C8 approved; WhatsApp sign-in moved to 4.5 (O41-2); one mid-December walkthrough (O41-5); O41-1 principle ruled, provider open; O41-3 ruled; O41-4 to prepare | (this commit) | the owner's 9 Nov directives |

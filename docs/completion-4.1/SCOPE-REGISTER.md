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

## 1 · The register

| # | Capability | Source | Approved scope (summary) | Already in 4.0 (reuse) | State |
|---|---|---|---|---|---|
| **C1** | **Controlled cross-device assessment recovery** | Owner 9 Nov §B.1; **D-125** (7 Oct, `DECISIONS.md:133`) and its intake `docs/reports/PINTAR-4.1-DEVICE-HANDOFF-AND-EXAM-BINDING-INTAKE-2026-10-07.md`; D-132(e) handoff seam | Designated low-stakes assessments: learner self-recovery after re-authentication. **Single-writer protection** and audit. Higher-stakes recovery needs **teacher authorization**. D-125 adds: Exam Mode (no handoff; an authoritative attempt controller with a generation, checked at every boundary that changes an attempt); failed-device EXAM recovery as its own design and proof gate; a handoff cause in the working context | `device_sessions`, the shared-computer PIN lock, durable answers and resume (J6.8, D-096), the stale-continuation guard; `EXAM` mode exists but nothing assigns it. **Residual accepted in 4.0:** two devices of one learner can write to one attempt | Approved. **D-125 requires a focused investigation (six questions, a threat model, red cases) before any build** |
| **C2** | **Misconception annotations** | Owner 9 Nov §B.2 | Authorized reviewers add **attributed** annotations to existing sealed content; the original stays immutable; sealed scores and reports never change retroactively | Option misconception codes and the class misconception report (MC-9, F36-M01); taught content is immutable (`enforce_taught_content_immutable`) | Approved; truth to define |
| **C3** | **AI-assisted question generation** | Owner 9 Nov §B.3 | Educators provide or select source material; the AI drafts questions; **educators review and approve before publication**; provenance kept (model, source material); independent review and publication safeguards; built on Studio editing, item lineage and review | Studio's upload → check → review → approve → release → publish (W6.5, F23-*), the content check (Decision 2), the Question Bank (QN5) | Approved; **owner decisions needed (§3)**; depends on C4 |
| **C4** | **Question revision lineage** | Owner 9 Nov §B.4 | The relationship between original and revised questions is preserved; historical assessment integrity is kept; **no claim of statistical comparability** between revisions in 4.1 | `items_lineage` / `enforce_lineage_pointer`, `create_course_revision` (package level), F23-W06 (the replaced version is history) | Approved; truth to define |
| **C5** | **Key-event accountability logging** | Owner 9 Nov §C.5 and the clarification | Significant events only: login success and failure, explicit logout, print and export requests, sensitive access where warranted, important administrative and integrity actions. Actor, timestamp, action, scope/resource, outcome. Inspected only by authorized administrators. **No click, page-view or behavioural monitoring.** «Accountability, not surveillance.» | `audit_log`/`audit_write` (D-093, D-097), «Jejak audit» (S23j), `learner_detail.opened`, `integrity.answers_opened` (D5), identity attempts. **4.0 does not log refused sign-ins (O2)** | Approved; one confirmation needed (§3) |
| **C6** | **Discreet printed-report identification** | Owner 9 Nov §C.6 | A quiet, legible footer on every printed report: printed by (the signed-in person's name), date and time in the right zone, a unique print reference linked to its audit record, page n of m. Legible in monochrome; never obscures content. **Logs the print request, not that paper came out.** Certificates keep their QR verification, not duplicated | `@page laporan` already prints «Halaman n dari m»; `KepalaCetak`, `AksiLaporan` («Cetak laporan») shared by every report | Approved; depends on C5 |
| **C7** | **Scheduled maintenance pause and resume** | Owner 9 Nov §C.7, the clarification, and **the maintenance ruling (preserve D-094)** | School Administrators schedule for **one class or the whole school**: start, end, a reason list (routine maintenance, system update, fault repair, network/power maintenance, Other with a short explanation), their identity captured. In-app warnings to affected active users at **60, 30 and 15 minutes**; a person arriving inside the warning sees the time left. Pause and resume at the scheduled times, subject to service readiness; extend or resume early. **Per the owner's ruling: a sitting already running finishes normally (D-094 drain); no automatic pause, timer extension, forced submission or new scoring.** New affected activity is blocked as today, and an assessment cannot start when it cannot finish before the window. Enforced at the operation boundary; every significant event audited. **Reuse the 4.0 implementation; no second system.** School Administrators have no immediate pause | `20261120100000_maintenance_is_announced_and_drains.sql`: school and platform windows, T−15 start block, database refusal at T=0 with drain, audit; `maintenance_list` paged; Konfigurasi's maintenance section | Approved |
| **C8** | **PINTAR Administrator emergency override** | Owner 9 Nov §C.8 and the ruling | An immediate pause at **class, school or platform** scope, with a reason, explicit confirmation, immediate notice, audit; lifted only by an authorized PINTAR Administrator. Containment first: accepted answers and attempt state preserved; nothing silently submitted, scored, failed or discarded; governed recovery afterwards | The `EMERGENCY` window (Admin platform only, typed phrase and reason, PT503 `PINTAR_DIHENTIKAN`) for chosen schools or the platform | Approved; class scope to add |
| **X** | **Platform-wide consistency** (cross-cutting) | Owner 9 Nov, «platform-wide consistency» | One design grammar, one vocabulary (ID/EN), one interaction behaviour, the same educational rules wherever a concept appears, shared facts from one definition, **one permission boundary across UI, API, database, background work and exports**, accessibility and responsive behaviour on desktop, mobile and print | Daisy's grammar and shared components; `hle.ts` (all copy); the 4.0 gates' cross-surface checks (e.g. B6K-URUTAN-02, R-T1, SI-D01) | Applies to every row above and to 4.0 |

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
| O41-4 | **Failed-sign-in logging** | **To prepare for the owner's final confirmation (9 Nov):** a proposed **12-month retention**, limited event details (time, outcome, account or identifier hash, method, coarse network origin; never the password or code), access limited to authorized administrators of that scope and the platform. It reverses 4.0's O2 only once confirmed |
| O41-5 | **Educator walkthrough** | **Ruled (9 Nov): one complete 4.1 walkthrough, mid-December 2026**, no partial or two-wave acceptance |

Everything else here is implementation detail, resolved by engineering with Sharon and Daisy, early.

## 4 · Dependencies and sequence

```
4.0 foundation (SI Gate open items; RQG human check)  ──►  precondition for the 4.1 candidate
C5 key-event logging ──► C6 print identification (the reference is an audit row)
C4 revision lineage  ──► C3 AI generation (a draft is revised and approved through lineage)
C2 annotations       ──  independent (beside sealed content; reads C4's item identity)
C7 maintenance       ──► C8 emergency (one system; class scope shared)
C1 recovery          ──  independent, but touches every attempt boundary (highest risk); investigation first
X consistency        ──  applied in every row; Daisy's and Sharon's cross-module checks
```

**Order:**
1. Lane A: C5 → C6.
2. Lane B: C7 → C8.
3. Lane C: C4 → C2, then C3 once O41-1 is decided.
4. Lane D: C1's investigation now, its build after Sharon's review of the design.
5. Integration journeys (Admin → Teacher → Student with each capability) are extended **as each capability lands**, not at
   the end.

## 5 · Effort (engineering days, including tests; reviews are elapsed time on top)

| # | Build + tests | Sharon / Daisy | Risk | Note |
|---|---|---|---|---|
| C1 | 10–14 (investigation 2–3; controller at every boundary; recovery flows; red cases) | both, twice (design, result) | **high** | touches start, answer, resume, submit, finish |
| C2 | 4–6 | both | low | new table and Studio surface |
| C3 | 8–12 (+ provider setup, + the blind evaluation 1–2) | both | **high** | selection waits on O41-1; build of the review flow and provenance can start on C4 now; needs C4 |
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
  - O41-1 is decided by mid-November;
  - the D-125 investigation for C1 does not enlarge C1 materially;
  - review turnaround stays prompt.
- The two highest-risk capabilities set the date:
  - **C1:** the investigation comes first and both reviews are needed.
  - **C3:** waits on the provider and C4.

**Planned sequence (four lanes, reviews early):**

| Week | Lane A | Lane B | Lane C | Lane D |
|---|---|---|---|---|
| 10–15 Nov | C5 truth + Sharon; build | C7 class scope, reason list; Daisy on warnings | C4 truth + Sharon; build | C1 D-125 investigation, threat model, red cases → Sharon |
| 16–22 Nov | C5 verified; C6 + Daisy | C7 warnings 60/30/15; C8 class scope | C4 verified; C2 truth + review; C3 review flow and provenance (provider-independent) | C1 design review; build starts |
| 23–29 Nov | C6 verified; X consistency audit | C7/C8 verified | C2 built; C3 generation once the provider is decided | C1 build: controller at every boundary |
| 30 Nov–6 Dec | X fixes; journeys extended | journeys | C3 verified | C1 verified; recovery journeys |
| 7–13 Dec | **one candidate SHA:** clean suite, CI, journeys, Sharon and Daisy on that SHA, the 4.0 foundation | | | |

**Honest assessment:**
- **Mid-December is achievable** if O41-1 is decided by about 15 November and C1's investigation confirms its estimated
  size.
- If either slips by a week, the walkthrough moves by a week.
- Verification is not compressed.
- The register's status log and each capability's state are the evidence; nobody, including Second Eye, reports a
  capability done on an implementation report.

## 7 · Status log (exact commits)

| Date | Capability | State | Commit | Evidence |
|---|---|---|---|---|
| 9 Nov | all | register opened; C1–C8 approved; WhatsApp sign-in moved to 4.5 (O41-2); one mid-December walkthrough (O41-5); O41-1 principle ruled, provider open; O41-3 ruled; O41-4 to prepare | (this commit) | the owner's 9 Nov directives |

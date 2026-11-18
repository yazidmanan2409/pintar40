# PINTAR 4.2, 4.5 and 5.0 · planning-completeness audit

**Bob, Chief Architect, 18 November 2026.** Requested by the owner on 18 Nov. It is a planning and verification
assignment. **It authorises no implementation and does not change the approved 4.1 schedule.**

**Status: Bob's audit, complete as a draft. Independent reviews are IN PROGRESS** (§7). Sharon, Daisy and Second Eye
each challenge it from their own discipline. Their findings are recorded in §7 as they arrive, disagreements included.
None is resolved silently. The readiness verdicts in §8 are final only once all three reviews are recorded.

---

## 0 · Authority, sources and method

### 0.1 Sources, in order of precedence

| # | Source | Where it is | Weight |
|---|---|---|---|
| S-a | **Explicit owner rulings** at their stated scope: O41-7 to O41-22; rulings 1–52 (`OWNER-RULINGS-4.1.md`); RD-1 to RD-10 | `docs/completion-4.1/`; `docs/roadmap/` on `claude/roadmap-45-50` | Governs |
| S-b | **The 11 November roadmap:** `PINTAR-ROADMAP.md`, `ROADMAP-RECONCILIATION-2026-11-11.md`, and the roadmap-folder `OWNER-DECISIONS-2026-11-11.md` | **Branch `claude/roadmap-45-50` only** (`2f419b52`). Not on `main` (see finding G-1) | Governs direction after 4.1 |
| S-c | **The reconciled 4.2 inventory:** the completion-folder `OWNER-DECISIONS-2026-11-11.md` §4, with `EXECUTION-PLAN.md` §4's two items | `main` | Governs the 4.2 list |
| S-d | **Consolidated Roadmap Revision 3.3,** owner-approved for adoption on 16 Nov, with the Rev 3.1 correction | `docs/roadmap/` on `claude/bob-41-master-plan`. Not on `main` (G-1) | The consolidated planning reference |
| S-e | 4.1 assessments that create later candidates: `EXTERNAL-AI-CONTENT-ASSESSMENT.md` (X-2 to X-4), `C3W-PAID-ADDON-ASSESSMENT.md` §3 and §9.4, `EXECUTION-PLAN.md` §5 | `claude/bob-41-master-plan` | Candidate status only |

**Read in full for this audit:** S-a to S-d. I also used S-e and the 4.1 build records where a later feature depends on
something 4.1 builds. **Not available, as Revision 3 also recorded:** the full September Horizon Review, the 5.5
coordination record and the efficiency audit. Nothing here relies on them beyond what S-b and S-d preserve.

### 0.2 Terms, kept distinct throughout

- **Approved direction:** a version assignment or architecture the owner has approved. It is **not** permission to build.
- **Implementation authorisation:** the owner's approval of a version plan. **No feature in 4.2, 4.5 or 5.0 has one
  today.**
- **Deferred:** moved by the owner from an earlier release to this one.
- **Candidate:** proposed only.
- **Unassigned:** no version yet.
- **[execution plan]:** assigned by `EXECUTION-PLAN.md` §4, not by the owner's own list.

### 0.3 Classification: readiness for *detailed execution planning*

The question asked is not "is it built?" but "can detailed execution planning start, and what must happen first?"

| Class | Meaning |
|---|---|
| **COMPLETE** | Version, purpose, users and owner direction are recorded, and no owner decision is open. Dependencies are identified and available by the time the version opens. The lifecycle questions in §3 are answerable from the records, and the team can write the plan now. *(It still needs implementation authorisation before any build.)* |
| **PARTIAL** | Direction is recorded. Some design, lifecycle or exception questions are open, but **the team can settle them inside planning** under existing authority, with no owner decision. |
| **UNRESOLVED** | **An owner decision is needed** (scope, policy, semantics or authority) before the plan can be completed. |
| **BLOCKED** | It depends on something that **does not yet exist or is not yet verified**: an earlier version's deliverable, an external, legal or ethical determination, or evidence. Planning cannot complete until that is resolved, whoever decides it. |

When more than one class applies, the worst one is shown. A feature is never classed COMPLETE because its first action
is clear.

### 0.4 The modules used in the cross-module matrix

| Code | Module |
|---|---|
| **ID** | Identity and accounts: persons, accounts, sign-in, credentials, lifecycle |
| **PRM** | Permissions and roles: scopes, grants, appointments, effective dates |
| **MEM** | School membership and structure: institutions, years, classes, enrolments, transfers, rollover |
| **ASM** | Assessment and sitting: assignments, sittings, controller, deadlines, maintenance, emergency |
| **CON** | Content and lineage: courses, items, revisions, releases, provenance, reviewer notes |
| **RES** | Results and scoring: the result chain, corrections, scoring policy |
| **REP** | Reporting: report figures, prints and print references, Question Health |
| **CRT** | Certificates: issuance, verification, review |
| **AUD** | Audit and accountability: `audit_log`, the B1 event store |
| **HIS** | History and retention: snapshots, reconstruction, retention, deletion |
| **INT** | Intelligence and interventions: measurement, classification, Quiet Intelligence, evaluation, growth |
| **AI** | AI drafting and provenance (C3w and its successors) |
| **JOB** | Scheduled jobs and recovery: `pg_cron`, the shared installer, restore |

---

## 1 · Feature-by-feature planning-completeness matrix

### 1.1 · 4.2 · Operational Maturity

The owner's deferrals, items 01–11 in S-c's order, then the two [execution plan] items and the candidates.

| ID | Feature | Purpose · users | Owner rulings | Dependencies | Current design status | Unresolved decisions | Class |
|---|---|---|---|---|---|---|---|
| 4.2-01 | **Exam Mode** | Educators administer, and learners sit, assessments under exam conditions | O41-9 (deferred; "builds on" A3); O41-3 narrowed | A3 (one writer, recovery, teacher authorisation); A1 controls; A2a/A2b; ruling 46 | **No definition of "exam conditions" exists in any record.** Rev 3 lists the questions only | **D-01:** what Exam Mode *is*: lockdown, invigilation, a fixed start, device rules, no navigation away, what the teacher may override. Only the owner can set its educational scope | **UNRESOLVED** |
| 4.2-02 | **Formal job positions, dated position history, acting appointments, future-dated role starts** | School admins record responsibilities; holders act in the right capacity | O41-8 (deferred) | B0 (last admin; role renewal); PRM; MEM; 4.2-03 | Existing roles have `valid_until` and renewal (B0). No position model | **D-02:** whether a position *confers* permission or only *describes* responsibility. Is acting cover a grant, a delegation or a label? This changes the authority model | **UNRESOLVED** |
| 4.2-03 | **One person holding roles at two schools** | A teacher or admin works in two schools from one identity | O41-12 (principle approved); 4.1 "no obstructing assumption" | H-02's minimum boundary; 4.2-02; A2b's work-scoped rule (R-1, ruling 31); A3's controller | Principle only. Rev 3 sets the minimum future-compatible boundary (identity ≠ membership, school-scoped dated grants, context selection, attributable audit) | Within authority: the context-switch design and the per-surface recheck. **No owner decision unless** it widens into the broader institution model | **PARTIAL** |
| 4.2-04 | **School data export** | Authorised staff obtain their school's data within their mandate | §4 deferral; THE PLAN D-4 (the export and its event arrive together); D-110 (school owns its data) | B1 event store; PRM; HIS; R-2 | `SCHOOL-DATA-EXPORT-4.0.md` exists as a 4.0 product note; datasets, formats and recipients are not designed | **D-04a:** which datasets, including learners' personal data and educator-related evidence (which 4.5 A5 will protect). **D-04b:** whether an export of educational evidence may precede R-2. An export creates a copy outside every retention rule (H-04) | **UNRESOLVED** |
| 4.2-05 | **Opening past reports; a period selector** | Report readers revisit an earlier period | §4 deferral; THE PLAN §5.2 | RES (correction chain, O41-21/22); REP; MEM (rollover, transfers); 4.5 A6 | Not designed. Rev 3 H-01 asks for the correction semantics | **D-05:** whether a past period shows the result *as it was then* or *as corrected now*. That is the line between this feature and 4.5's explainable history; if "as it was then", it pre-empts A6 | **UNRESOLVED** |
| 4.2-06 | **A school admin adding one person outside an import; correcting a name after activation** | School admins handle one person; fix a name | §4 deferral | ID (one identity per person; ruling 21, anonymised is terminal); CRT (sealed certificates carry the name); REP (prints); AUD | Single add: the import's rules exist, so it is a reuse. Name correction: not designed | **D-06:** a name corrected after a certificate was issued. Is the certificate reissued, reviewed (O41-19 covers score changes, not names), or left as issued with verification showing the current name? Only the owner can set what a sealed artefact means | **UNRESOLVED** |
| 4.2-07 | **Declining an account request** | Admins resolve a request; the requester learns the outcome | §4 deferral | ID; rulings 17 and 20 (sign-in must not disclose state); AUD | Not designed | Within authority: neutral wording (Daisy) consistent with rulings 17 and 20; repeated requests; audit. No owner decision expected | **PARTIAL** |
| 4.2-08 | **Password change while signed in** | A signed-in user changes their own credential | §4 deferral | ID; L-1 (neutral sign-in); the B1 events; sessions | Not designed. Learners sign in with a class card and PIN, so the audience is presumably staff | Within authority: re-authentication, ending other sessions, the B1 event, the audience (staff; and learners with a password?). **Confirm the audience in planning;** escalate only if learners are meant | **PARTIAL** |
| 4.2-09 | **The "classes without a teacher" view** | School admins find classes with no assigned teacher | §4 deferral | MEM; PRM; rollover | Read-only within school scope. Rev 3 asks which classes count | Within authority: current year, active classes, rollover behaviour | **COMPLETE** *(for planning)* |
| 4.2-10 | **PD corrections:** end a programme, remove a participant, the school ending its own PD sittings | Authorised admins correct professional-learning records | §4 deferral | PD records; CRT (PD certificates); AUD; the PD/academic separation | Not designed | Within authority mostly. **One owner question, D-10:** does removing a participant after a PD certificate was issued send it to review (as O41-19 does for scores)? | **UNRESOLVED** *(narrow)* |
| 4.2-11 | **Structure corrections:** reactivate or move a class; rename a school; undo a promotion run as a whole | Authorised admins correct structural mistakes | §4 deferral | MEM (rollover); RES; REP; CRT; ASM (open sittings); AUD; HIS | Not designed. Reactivate and move are bounded. Rename and undo are not | **D-11a:** after a school is renamed, which name do historical prints, certificates and verification show? **D-11b:** whether a promotion run can be undone once new-year work exists (new sittings, enrolments, results), or only before. It is a lifecycle rule with evidence consequences | **UNRESOLVED** |
| 4.2-12 | **Scheduled Question Health statistics** [execution plan] | Readers get a predictable refresh of existing outputs | EXECUTION-PLAN §4; RD-4 (four known defects; 4.1 not reopened); H-05 | JOB (shared installer, restore, DR-S14–16); REP | Scheduling is easy; **the figures it refreshes are known to be wrong in three ways** (RD-4) | **D-12:** whether to schedule known-defective figures before early 4.5's repair, with a disclosed limitation, or to move this item to 4.5 behind the repair. Owner, because it changes an assignment | **UNRESOLVED** |
| 4.2-13 | **A teacher's handover view after a colleague leaves** [execution plan] | A new teacher sees the departed colleague's open work | EXECUTION-PLAN §4 (not the owner's list) | PRM; MEM; ASM (A1 controls on open sittings); AUD; 4.2-03 | Not designed | Within authority: the new teacher gains no access beyond the class; original attribution is kept. **Confirm it is in scope**, since only the execution plan assigned it | **PARTIAL** |
| 4.2-C1 | **Assessment-specific time limits** *(candidate)* | Educators set a duration; learners see the time available | None. R-C explicitly does not authorise it | ASM (deadline vs duration, R-C); A1 extensions; A2a stop time; A2b drain; A3 recovery | Semantics not designed | **D-C1:** admit it to 4.2 or not. If admitted, its timing semantics need approval | **UNRESOLVED** |
| 4.2-C2 | **X-2, a paste-friendly import route** *(candidate)* | Teachers import AI-drafted content without an .xlsx | Ruling 41 | CON (the import); C3w provenance boundary | Assessed (`EXTERNAL-AI-CONTENT-ASSESSMENT.md`). Decided after the walkthrough | **D-C2:** admit it after the walkthrough evidence | **BLOCKED** *(on the walkthrough)* |
| 4.2-C3 | **X-3, a questions-only import into an existing package** *(candidate)* | Teachers add questions to a lesson | Ruling 41 | CON; C1w lineage | Assessed | **D-C3:** admit it | **UNRESOLVED** *(admission only)* |
| 4.2-C4 | **X-4, a self-declared "drafted with {AI}" field** *(candidate)* | Records the external AI, where known | Ruling 41 | CON; AI provenance (verified vs self-declared, C3w) | Assessed; the provenance boundary is in C3w's design | **D-C4:** admit it | **UNRESOLVED** *(admission only)* |
| 4.2-C5 | **The commercial side of AI drafting:** pricing, allowance, billing, school-admin purchasing and usage screens, the school-facing comparison | Schools buy and choose AI options | Rulings 38–40: "separate, later decisions"; "not to be requested before E's cost evidence" | E's results; C3w-2; ruling 44 (if no provider permits the workflow, integrated AI is removed) | Not designed | Version **unassigned**. Pricing waits for E's cost evidence by the owner's own instruction | **BLOCKED** *(on E and the owner's commercial decisions; not due)* |
| 4.2-R | **The carried non-blocking register** (`EXECUTION-PLAN.md` §5: Sharon's, Daisy's and the cosmetic items, "or in 4.2"), plus Z's carried items (A2B-R3 and others) | Engineering hygiene | O41-15 rule 4 | Varies | Listed | Triage at 4.2 planning. Several may fold into the rationalisation audit | **PARTIAL** |
| U-01 | **Retention enforcement** *(unassigned)* | Stewards enforce retention terms | Not in the owner's 4.2 list (Rev 3.1). R-2 pending | R-2; HIS; every module that holds evidence | `institutions.retention_days` exists and is unenforced | **R-2**, then a version | **BLOCKED** *(on R-2)* |
| U-02 | **The eight "later than 4.2 unless ruled in":** close or archive a school; a foundation above several schools; editable year dates and semesters; un-revoking a certificate; restoring a withdrawn release; schools adapting platform content; briefings; learner and family deletion (with counsel) | Various | §4: later than 4.2 | Varies; deletion needs R-2 and counsel | Not designed | Version for each, only if ruled in | Out of 4.2. Not classed |

**A precondition for the whole of 4.2 (Rev 3, TEAM-INSTRUCTIONS):** 4.1 accepted, then the codebase rationalisation and
performance audit, then 4.2 development. The audit has **no numeric target or measures yet**. They are agreed with the
owner after 4.1's acceptance (Rev 3, "Owner decisions" table).

### 1.2 · 4.5 · UNDERSTAND

| ID | Feature | Purpose · users | Owner rulings | Dependencies | Current design status | Unresolved decisions | Class |
|---|---|---|---|---|---|---|---|
| 4.5-01 | **Question Intelligence** (difficulty, option and distractor behaviour, discrimination where sufficient, revision effects, reliability where supportable) | Authors, reviewers and teachers judge question quality | RD-1, RD-3, RD-4 | 4.1: item lineage (C1w), the result chain, the provenance, the raw responses (`is_final`, first view); D-060 | Direction only. **The four RD-4 findings are unverified at runtime.** Which Question Health figures depend on them is unknown | Team: runtime reproduction, then corrected calculations. **Evidence:** sufficiency needs real sittings, and staging data is synthetic (G-4) | **BLOCKED** *(on runtime verification of RD-4)* |
| 4.5-02 | **Instrument comparability** (deterministic, human-confirmed) | Reviewers decide which assessments or revisions may be read together | RD-1; roadmap A1 | 4.5-01; C1w lineage; ruling 46 (attempts across versions, which is a different "same assessment" notion) | Direction only | Team: the deterministic rule. **Note:** ruling 46 already treats published versions as "the same assessment" for attempts. Comparability must not inherit that sameness (G-6) | **PARTIAL** |
| 4.5-03 | **Stable competency identity** (identity, equivalence and comparability kept separate) | One competency across lessons, items, years, schools and curriculum revisions | RD-9; R-5 pending | **R-5** (the national curriculum anchor); CON; O41-18 (who owns platform vs school content) | Direction only; the investigation has not started | **R-5.** Also **D-45-03:** who may map a school's own content to a competency, and whether a mapping is school-owned (D-110) | **UNRESOLVED** *(R-5)* |
| 4.5-04 | **The evidence and insight classification** (recorded, derived, inferred, not concluded) | Every statement PINTAR makes | RD-7 | REP and INT; versioned rules (D-060) | Principle adopted; structure not designed | Team | **PARTIAL** |
| 4.5-05 | **Quiet Intelligence,** including Performance Distribution, longitudinal patterns, educator-authored prerequisite hypotheses and recommendations | Teachers learn in about a minute what needs attention | RD-1, RD-2; the A3 direction | 4.5-01 to 4.5-04 | Direction only | Team: the screens (Daisy). **Source gap M-03:** a separate usefulness-measurement requirement is unverified. Rev 3 proposes walkthroughs and voluntary feedback | **BLOCKED** *(on 4.5-01 to 4.5-03)* |
| 4.5-06 | **Governed formal educator evaluation** (seven steps, ten safeguards) | Institutions evaluate educators; humans finalise and seal | RD-5; R-1 pending | **R-1**; 4.5-04; 4.5-07; 4.5-08; R-2; PRM (assessor authority); 4.2-02 (positions) | Architecture approved; policy absent | **R-1** in full (assessor, period, rubric, response window, sealing of the response, readership, retention). Also **D-45-06:** evaluation after the educator changes school, or holds roles at two (4.2-03) | **UNRESOLVED** *(R-1)* |
| 4.5-07 | **Educator protections** (visibility, layered access, access audit, developmental vs formal separation, correction and response, no unsupported comparison) | Educators, before any educator-related evidence is shared | RD-6 | PRM; AUD; R-1; R-2 | Requirements listed; no design | Team, inside R-1's bounds | **PARTIAL** *(design follows R-1)* |
| 4.5-08 | **Explainable history:** immutable snapshots, "as of" reconstruction, versioned templates; snapshot-rendered certificates | Anyone authorised sees what a report, evaluation or certificate said when issued | RD-1 (Context Passport split); reconciliation §1 | HIS; R-2 (what is kept); 4.2-05 (past reports, D-05); CRT | Direction only | **R-2** (how long a snapshot lives); D-05's boundary with 4.2 | **UNRESOLVED** *(R-2, D-05)* |
| 4.5-09 | **Misconception mapping** (inside Question Intelligence and competency identity) | Reviewers and teachers see which misunderstandings items reveal | Reconciliation §1; R-3 pending; ruling 29 | C2w reviewer notes (free text, immutable, not evidence); C1w option misconception codes; 4.5-03 | Direction only. C2w's notes are explicitly **not** evidence and **not** a taxonomy | **R-3** (structured codes) is still formally pending. **D-45-09:** whether C2w's free-text notes may ever feed mapping (today they may not: Rev 3 M-04, C2w D-rules) | **UNRESOLVED** *(R-3)* |
| 4.5-10 | **The scoring-policy prerequisite:** a recomputation uses the sitting's own scoring policy | Comparability and corrections | Reconciliation §1 (question weighting split) | RES; D-060 | Partly true already (C1w's O41-22 rescoring uses the original responses and the current key) | Team: verify across every recomputation path | **PARTIAL** |
| 4.5-11 | **WhatsApp sign-in** *(carried operational)* | A sign-in route for audiences to be defined | O41-2; #147 | ID (card and PIN; school-assisted recovery; ruling 17's neutral sign-in; ruling 19's locked accounts); a provider and its cost; R-2 (phone numbers are new personal data) | Inherited options only | **D-45-11:** which audience (staff only, or learners too). If learners, the provider's terms for minors must be checked, as ruling 44 did for AI. Provider and operating cost | **UNRESOLVED** |
| 4.5-12 | **Adaptive unusual-access checks on staff accounts** *(carried operational)* | Protects staff accounts | D-088 | ID; B1 events; AUD | Direction only | **D-45-12:** which signals are allowed. 4.5's own governance forbids behaviour tracking (no click, page-view or time-on-platform record). Security signals must be ruled distinct from evidence, with their own retention (G-7) | **UNRESOLVED** |
| 4.5-S | **Share & Learn** *(reported 4.5 direction, unreconciled)* | Unknown | Source unverified (M-03) | External access; HIS | None | Locate the authoritative record, or the owner restates it | **BLOCKED** *(source)* |

### 1.3 · 5.0 · ACT & GROW

| ID | Feature | Purpose · users | Owner rulings | Dependencies | Current design status | Unresolved decisions | Class |
|---|---|---|---|---|---|---|---|
| 5.0-01 | **Educator Growth and the Shared Growth Compact** | Educators pursue evidence-linked objectives under agreed visibility | RD-6; roadmap B1 | All of 4.5; 4.5-07 (protections); R-1 (separation from formal) | Direction only | **D-50-01:** the Compact's terms: who sees growth evidence, when it may be used, and how it is withdrawn | **BLOCKED** *(on 4.5)* + **UNRESOLVED** |
| 5.0-02 | **Interventions and follow-up** (recorded, for whom, when; longitudinal measurement; staggered starts) | Educators choose and examine actions | RD-8; roadmap B2; R-4 pending | 4.5-01 to 4.5-05; **R-4** | Direction only | **R-4** (approver, family communication, "necessary assistance"). It is research involving children, so it likely needs an ethics review the records do not yet name | **BLOCKED** *(R-4; 4.5)* |
| 5.0-03 | **The three intervention claims** | Every intervention statement | RD-8 | 4.5-04 (classification); 4.5-02 (comparability) | Principle adopted | Team, once 4.5 exists | **BLOCKED** *(on 4.5)* |
| 5.0-04 | **Governed journey shapes and server-enforced progression** | Learners follow intervention and prerequisite journeys | Reconciliation §1 (composer split) | ASM; the learning cycle; CON | Direction only. Today's progression is partly enforced in pages (the Horizon Review's friction 2) | Team: the small set of shapes. **Note:** server-side progression is needed regardless of interventions, as an integrity fix. Consider moving it earlier (G-8) | **PARTIAL** |
| 5.0-05 | **Institution-level improvement** (departments and schools, on aggregates) | Department heads and school leaders | Roadmap B5 | INT; PRM (department scope); small-cell aggregation (studied, not assigned); the broader institution model (unassigned) | Direction only | **D-50-05:** the minimum aggregate size and the department scope. **The broader institution model** is unassigned | **UNRESOLVED** |

### 1.4 · Totals

| Version | COMPLETE | PARTIAL | UNRESOLVED | BLOCKED | Not classed |
|---|---|---|---|---|---|
| **4.2** (20 items: the owner's list, the execution-plan items, the candidates, the register, U-01; U-02 not classed) | 1 | 5 | 11 | 3 | 1 group (U-02) |
| **4.5** (13 items) | 0 | 4 | 6 | 3 | — |
| **5.0** (5 items) | 0 | 1 | 1 | 3 | — |

*(5.0-01 is counted as BLOCKED.)*

---

## 2 · Cross-module impact and dependency matrix

**C** creates · **R** reads · **M** modifies · **A** affects (a consumer's meaning changes). An empty cell means no effect.

| Feature | ID | PRM | MEM | ASM | CON | RES | REP | CRT | AUD | HIS | INT | AI | JOB |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4.2-01 Exam Mode | R | R | R | **C M** | R | A | A | A | C | A | A | | |
| 4.2-02 Positions, acting | R | **C M** | R | | | | A | | C | A | A (4.5-06 assessor) | | A (future-dated starts need a job or a read-time rule) |
| 4.2-03 Two-school roles | R | **C M** | **M** | A (A2b R-1; A3) | A | | A | | C | A | A (4.5-06) | | |
| 4.2-04 Export | R | R | R | R | R | R | R | R | **C** (D-4) | **A** (copies outside retention) | A (educator evidence) | | maybe |
| 4.2-05 Past reports | | R | R | | | R | **C** | A | C (B1 print) | **A** (vs 4.5-08) | A | | |
| 4.2-06 Add one person; correct a name | **C M** | R | M | | | | A | **A** (sealed name) | C | A | | | |
| 4.2-07 Decline a request | M | R | | | | | | | C | | | | |
| 4.2-08 Password change | **M** | | | | | | | | C (B1) | | | | |
| 4.2-09 Classes without a teacher | | R | R | | | | C (view) | | | | | | |
| 4.2-10 PD corrections | | R | M | M (PD sittings) | | M (PD) | A | **A** (PD certificates) | C | A | | | |
| 4.2-11 Structure corrections | | R | **M** | **A** (open sittings) | | A | A | **A** (school name) | C | **A** | A | | |
| 4.2-12 Scheduled QH | | | | | R | R | **M** | | | | **A** (known defects) | | **C** |
| 4.2-13 Handover view | | **R** | R | R | | R | C (view) | | C | | | | |
| 4.2-C1 Time limits | | | | **C M** | M (definition) | A | A | A | C | | A | | maybe |
| 4.2-C2–C4 Import, AI field | | R | | | **C M** | | | | C | | A (provenance) | **A** | |
| 4.5-01 Question Intelligence | | R | | R | R | R | **M** (QH) | | | R | **C** | R | C |
| 4.5-02 Comparability | | R | | R | R | R | | | C | R | **C** | | |
| 4.5-03 Competency identity | | R | | | **M** (mapping) | | A | | C | R | **C** | A | |
| 4.5-04 Classification | | | | | | | **M** | | | **C** | **C** | A (AI phrasing) | |
| 4.5-05 Quiet Intelligence | | R | R | R | R | R | **C** | | C | R | **C** | A | maybe |
| 4.5-06 Formal evaluation | R | **C** (assessor) | R | R | R | R | R | | **C** | **C** (seal) | **C** | | |
| 4.5-07 Protections | R | **C M** | R | | | | | | **C** | A | A | | |
| 4.5-08 Explainable history | | R | R | | R | R | **A** | **M** (snapshot rendering) | C | **C** | R | | maybe |
| 4.5-09 Misconception mapping | | R | | | R (C2w notes: forbidden today) | R | A | | | | **C** | | |
| 4.5-11 WhatsApp sign-in | **C M** | | | | | | | | C | **A** (phone numbers, R-2) | | | |
| 4.5-12 Adaptive checks | **M** | R | | | | | | | **C** | **A** | (must stay separate) | | maybe |
| 5.0-01 Growth, Compact | R | **C** | R | | | R | R | | C | **C** | **C** | | |
| 5.0-02/03 Interventions, claims | | R | R | **A** (staggered starts) | R | R | A | | C | **C** | **C** | | |
| 5.0-04 Journey shapes | | R | R | **M** | **M** | A | A | A | C | A | A | | |
| 5.0-05 Institution-level | | **C** (department scope) | R | | | R | **C** (aggregates) | | C | R | **C** | | |

### 2.1 · Cross-version dependencies, with conflicting assumptions

| # | Dependency | Producer → consumer | Conflicting assumption found | Resolution path |
|---|---|---|---|---|
| X-1 | Correction chain → past reports → explainable history | 4.1 C1w → 4.2-05 → 4.5-08 | 4.2's "past report" and 4.5's "as of" both claim to show the past. Unless D-05 is decided, 4.2 either duplicates 4.5 or builds a weaker version 4.5 must replace | Owner D-05; the H-01 contract in both plans |
| X-2 | Effective-dated grants → assessor authority → evaluation readership | 4.2-02/03 → 4.5-06/07 | 4.5's assessor and readership rules assume a role model 4.2 has not designed. If 4.2 makes positions purely descriptive (D-02), 4.5 needs a separate assessor grant | Decide D-02 with 4.5-06 in view |
| X-3 | Question Health schedule → Question Intelligence | 4.2-12 → 4.5-01 | 4.2 schedules figures that 4.5 must first prove wrong, then repair (RD-4) | Owner D-12 |
| X-4 | Export → retention → explainable history | 4.2-04 → U-01 → 4.5-08 | An export before R-2 creates uncontrolled copies; 4.5 snapshots assume a retention rule that does not exist | R-2 before export of educational evidence (D-04b) |
| X-5 | Same-assessment notion (ruling 46) → comparability | 4.1 A3 → 4.5-02 | A3 groups published versions as "the same assessment" for attempts. Comparability must be decided per pair and human-confirmed (RD-1). Reusing A3's lineage root as a comparability key would silently assert equivalence | Write the distinction into 4.5-02's plan (G-6) |
| X-6 | Unusual-access signals → the no-behaviour-tracking rule | 4.5-12 ↔ 4.5 governance | Contradiction in the same version unless the signals are ruled out of the evidence boundary | Owner D-45-12 (G-7) |
| X-7 | Reviewer notes → misconception mapping | 4.1 C2w → 4.5-09 | C2w notes are "never evidence, never a taxonomy" (C2w D-rules). 4.5 might assume them as a mapping source | Keep them excluded unless R-3 rules otherwise |
| X-8 | Two-school roles → A3's controller, A2b's work scope | 4.1 → 4.2-03 | None found. A2b reads the place, not the person's only school; A3 binds the controller to the Auth session, not to a school. Verify both in 4.2's tests | Test only |
| X-9 | Name correction → sealed certificates → snapshot certificates | 4.2-06 → CRT → 4.5-08 | 4.2 changes a name that 4.1 seals and 4.5 re-renders | Owner D-06 |
| X-10 | School rename → print references, verification | 4.2-11 → B2, CRT | B2 prints carry the school as it was; verification shows status. The rename semantics decide which is "true" | Owner D-11a |
| X-11 | Server progression → interventions | 5.0-04 → 5.0-02 | Progression enforced in pages is an integrity weakness today, yet it waits for 5.0 | Consider earlier (G-8) |
| X-12 | Real evidence volume → all of 4.5 | Production use → 4.5-01, 02, 05 | 4.5 assumes years of sittings. **Production is at migration 111 with no real schools on 4.x.** Staging data is synthetic | G-4: production release and adoption are a hidden prerequisite |
| X-13 | E's outcome → C3w-2 → the commercial items | 4.1 E → 4.2-C5 | Ruling 44: if no provider permits the educator-only workflow, integrated AI leaves the roadmap. 4.2-C5 then disappears | Wait for E (judging in progress) |

---

## 3 · "And then what?" lifecycle and exception register

The standing principle's questions, asked of every significant feature (ruling 3; S-b's "How every version is built").
"Open" means the records do not answer the question. Where an answer is proposed, it is marked **(proposed)** and is not
a decision.

### 3.1 · 4.2

**4.2-01 Exam Mode**
- *And then what?* The sitting ends under exam conditions → scored → reported → possibly certified. **Open:** whether
  Exam Mode results carry a marker downstream (reports, 4.5 comparability: an exam sitting and a practice sitting are
  likely not comparable).
- *What else changed?* A1's teacher controls (which may be restricted in an exam), A3's recovery (teacher-authorised
  for Uji Penguasaan already), A2b drain, A2a stop.
- *Failure or interruption?* A3 covers the device; **open:** whether an exam may continue on another device at all, and
  who authorises it.
- *After correction, withdrawal, transfer, suspension, expiry or closure?* Correction and suspension follow O41-21/22 and
  O41-17. **Open:** a transfer mid-exam window.
- *Authority?* The invigilating teacher; **open:** whether an invigilator is a role (4.2-02).
- *What the user sees?* Open; Daisy.
- *Evidence?* None defined. **Needs D-01 first.**

**4.2-02 / 4.2-03 Positions, acting appointments, two-school roles**
- *And then what?* A grant takes effect, is used, then expires, is revoked or is replaced. Work done under it keeps its
  original actor and scope.
- *What else changed?* Every permission check; report audiences; the B1 events; 4.5 assessor eligibility.
- *Failure?* A grant expires while a view is open or an export is running. Rev 3's rule: recheck at the effect boundary.
  **Open:** which operations recheck mid-way (exports, long reports).
- *After expiry, revocation, transfer or suspension?* Suspension is person-level (ruling 19) and covers all schools.
  **Open:** whether suspension in school A suspends the person's role in school B. Rulings 17 and 19 are person-level,
  so presumably yes; **(proposed)** confirm in planning.
- *Authority?* Each school's admin over its own grants only. **Open:** who may grant an acting appointment that spans a
  head-of-department scope.
- *What the user sees?* A context selector; Daisy.
- *Evidence?* Switching, revocation, expiry during an action, history retained, and no cross-school leak (H-02).

**4.2-04 School data export**
- *And then what?* A file leaves PINTAR. **PINTAR loses all control over it.** The B1 event is the only record.
- *What else changed?* Retention (a copy exists outside every rule), educator protections (4.5-07, if educator evidence
  is included).
- *Failure or interruption?* A partial file; a repeated request; authority expiring during generation. **Open.**
- *After a later correction or deletion?* The export is stale. **Open:** whether exports are labelled "as of" and
  whether a later deletion request reaches them (it cannot technically; the policy must say so).
- *Authority?* **Open** (D-04a): school admin only, or the principal?
- *What the user sees?* Open.
- *Evidence?* Scope, refusal and audit paths, and a test that no other school's row is in a file.

**4.2-05 Past reports**
- *And then what?* A reader acts on a historical figure.
- *What else changed?* Prints (B2 references the period), 4.5-08.
- *After a correction?* **The central open question (D-05).**
- *After a transfer?* Ruling 25: evidence belongs to the school whose evidence it is. A past report after a transfer
  shows the learner in the old school's period only.
- *Evidence?* A report before and after a key correction, read for a past period; a transferred learner.

**4.2-06 Add one person; correct a name**
- *And then what?* The person exists once; a correction propagates to every current view.
- *What else changed?* Issued certificates and prints carry the old name (sealed). Verification. Activation (ID).
- *Failure?* A duplicate person created by a single add when an import already holds them. The import's duplicate rule
  must apply.
- *After closure or anonymisation?* Ruling 21: an anonymised person cannot be corrected or reattached.
- *Authority?* School admin. **Open:** whether a learner or parent may request a correction.
- *Evidence?* A duplicate refused; a name corrected after a certificate, with the certificate's handling per D-06.

**4.2-07 Decline a request / 4.2-08 Password change**
- *Decline, then what?* The requester learns an outcome without learning anything about other people's accounts
  (rulings 17 and 20). A repeat request is allowed or refused (open).
- *Password change, then what?* Other sessions end **(proposed)**, and the B1 event is recorded. If the user is
  suspended mid-change, L-1's neutral sign-in applies.
- *Evidence?* Neutral wording; sessions ended; audit row; a suspended user refused without disclosure.

**4.2-10 / 4.2-11 PD and structure corrections**
- *And then what?* A record changes or is superseded. Certificates and history may refer to it.
- *Undo a promotion run:* if any new-year sitting, enrolment change or result exists, **an undo would orphan or misplace
  evidence.** **(Proposed:)** undo only while no new-year evidence exists; otherwise per-learner corrections. That is
  owner D-11b.
- *Rename a school:* history keeps the name as issued **(proposed)**; current views show the new name. D-11a.
- *Reactivate a class:* its old sittings stay closed; it gains new work only.
- *Evidence?* Each correction with a dependent certificate, report and open sitting present.

**4.2-12 Scheduled Question Health**
- *And then what?* Readers trust fresher figures. **Known defective (RD-4).**
- *Failure?* A failed run leaves stale figures. Freshness must be visible.
- *After restore?* The job must be in the shared installer (DR-S14–16, A1-K01).
- *Evidence?* Freshness shown; a failed run visible; the limitation disclosed.

**4.2-13 Handover view**
- *And then what?* The new teacher acts on open work (A1 controls).
- *Authority?* Only within the class they now teach; the departed colleague keeps attribution.
- *Evidence?* No access beyond the class; attribution preserved.

### 3.2 · 4.5

**4.5-01/02 Question Intelligence and comparability**
- *And then what?* A reviewer revises a question, or a teacher reads a distribution.
- *What else changed?* Question Health figures change meaning once repaired. Old screenshots and prints show the old
  figures. **(Proposed:)** version the metric (D-060) and label pre-repair output.
- *Failure?* Insufficient evidence is a normal, designed outcome.
- *After a key correction (O41-22)?* The statistics use the in-force result chain and the raw `is_final` answers.
- *After a withdrawn release?* Sittings on a withdrawn lesson are already excluded (10 Nov ruling).
- *Evidence?* RD-4's four findings reproduced red first, then green; an "insufficient evidence" case.

**4.5-03 Competency identity (R-5)**
- *And then what?* Evidence across lessons joins under one competency.
- *After a curriculum revision?* Mappings must be versioned; old evidence keeps its mapping as it was **(proposed)**.
- *Authority?* **Open:** platform vs school content (O41-18 says who owns content, not who maps it).

**4.5-04/05 Classification and Quiet Intelligence**
- *And then what?* The teacher chooses whether to act (5.0).
- *Failure?* A stale calculation, a sparse sample or a lost permission gives "not concluded" or nothing, never a
  guess.
- *After the teacher leaves or transfers?* Access follows current grants (4.2-02/03).
- *What the user sees?* About one minute to priorities; denominators and limits on every figure.
- *Evidence?* Trace from raw evidence to the sentence a teacher reads; the "not concluded" path.

**4.5-06/07 Formal evaluation and protections**
- *And then what?* The educator receives a sealed evaluation and may respond (R-1).
- *What else changed?* Educator-related evidence becomes sensitive. Exports (4.2-04) must then exclude it or honour the
  protections.
- *Failure or interruption?* A draft prepared, then the period reopened? **Open (R-1).**
- *Late evidence?* It stays distinguishable from the sealed evidence (Rev 3, temporal consistency).
- *After the educator transfers or leaves?* **Open:** who keeps the evaluation, and who may read it (R-1, R-2).
- *Authority?* The assessor finalises. PINTAR never does.
- *Evidence?* A complete period: draft, adjustment with rationale, seal, receipt, response, with access audited.

**4.5-08 Explainable history**
- *And then what?* A disputed figure is checked against what was said then.
- *After retention expiry?* **Open (R-2):** an honest "no longer available".
- *Evidence?* A report and a certificate re-rendered identically after a later correction.

**4.5-11/12 WhatsApp and adaptive checks**
- *WhatsApp, then what?* A sign-in code arrives by a third party. **Failure:** the provider is down, so the fallback
  is card and PIN or email **(proposed)**. **After a number change or suspension?** Ruling 19: locked stays locked;
  no message reveals state (ruling 20).
- *Adaptive checks, then what?* A challenge or a refusal. **Failure:** a false positive locks a staff member out; B0's
  last-admin rule must hold.
- *Evidence?* Neutral refusals; the last admin never locked out by a check.

### 3.3 · 5.0

**5.0-01 Growth and the Compact**
- *And then what?* An educator keeps or shares a growth record.
- *Withdrawal?* **Open (D-50-01):** whether shared growth evidence can be withdrawn after someone has read it.
- *After the educator leaves?* Open.
- *Authority?* The educator chooses; the Compact limits who sees it.

**5.0-02/03 Interventions**
- *And then what?* Continue, modify or stop. Every statement uses one of the three claims.
- *A staggered start?* Only under R-4; a teacher can end it for a learner at any time.
- *After a transfer?* The learner leaves the cohort; that exclusion is stated.
- *Evidence?* Each claim level demonstrated, and refused when unsupported.

**5.0-04 Journey shapes**
- *Interrupted step?* Accepted progress is kept.
- *Changed scope?* No loss of accepted progress.

**5.0-05 Institution-level improvement**
- *Small groups?* Aggregation must not identify an individual (D-50-05).

---

## 4 · Integrated acceptance journeys for each version

These are **planning definitions**. Each version's execution plan restates them as tests on its exact candidate.

### 4.2 · eight journeys

| # | Journey | Covers | Success, refusals, recovery, history |
|---|---|---|---|
| **J42-1** | **First day at a new school year, with a new head of department** | 4.2-02, 4.2-09, 4.2-11, 4.2-13 | The admin rolls over the year; finds classes without a teacher; appoints an acting head (future-dated start); a departing teacher's classes are handed over. Refused: an expired grant. Undo of the run before any work exists **(per D-11b)**. History: last year's reports still name last year's teacher |
| **J42-2** | **A teacher at two schools** | 4.2-03 | One identity, two dated grants, a context switch. Refused: reading school B's report from school A's context. Suspension covers both schools. History: work keeps its original school |
| **J42-3** | **An exam day, with an interruption and a maintenance window announced** | 4.2-01, A3, A2b, A1 | Learners sit under exam conditions; one device fails and is recovered with authorisation; a planned window drains correctly; results reported. Refused: an unauthorised device switch. **Depends on D-01** |
| **J42-4** | **A school exports its data, then a correction lands** | 4.2-04, 4.2-05 | Export with its event; then a key correction; the past report shows the agreed semantics (D-05); the export is visibly "as of". Refused: another school's data; an expired role mid-export |
| **J42-5** | **A name mistake found after a certificate was issued** | 4.2-06, CRT | The name is corrected; the certificate is handled per D-06; verification shows the governed status |
| **J42-6** | **An account request declined; a password changed; a suspended user** | 4.2-07, 4.2-08, L-1 | Neutral wording throughout; sessions ended; nothing disclosed |
| **J42-7** | **A PD programme ended early** | 4.2-10 | Participants' records and certificates follow D-10 |
| **J42-8** | **A school renamed mid-year** | 4.2-11 | Prints, certificates and verification follow D-11a |

### 4.5 · six journeys

| # | Journey | Covers |
|---|---|---|
| **J45-1** | **A flawed question is found by Question Intelligence, corrected, then read again** | 4.5-01, C1w correction, 4.5-08: the fractions example in Rev 3. The distractor analysis flags it, the key is corrected, statistics recompute on the in-force chain, and history shows the old figure as issued |
| **J45-2** | **"Not concluded"** | 4.5-04/05: a small class, a sparse sample, an incomparable revision. The teacher sees why there is no conclusion and what would make one possible |
| **J45-3** | **A teacher's minute** | 4.5-05: priorities in about a minute, with denominators, exclusions and a recommended next step the teacher may ignore |
| **J45-4** | **A formal evaluation period, end to end** | 4.5-06/07: opened by the institution, draft, assessor adjustment with rationale, seal, educator receipt, response, access audit. Includes the educator transferring mid-period **(per R-1)** |
| **J45-5** | **What did that certificate say?** | 4.5-08: a certificate and a report re-rendered as issued, after a later correction and a school rename |
| **J45-6** | **Staff sign-in under the carried capabilities** | 4.5-11/12: WhatsApp sign-in (per D-45-11), a provider outage fallback, an unusual-access challenge, the last admin never locked out |

### 5.0 · four journeys

| # | Journey | Covers |
|---|---|---|
| **J50-1** | **The improvement cycle:** understand, choose, act, observe, compare, reflect, improve | 5.0-02/03, with every claim level shown and refused when unsupported |
| **J50-2** | **A staggered start, ended for one learner** | 5.0-02 under R-4: necessary assistance preserved |
| **J50-3** | **An educator's growth year** | 5.0-01: objectives, a shared record, a withdrawal per the Compact, and no path into formal evaluation |
| **J50-4** | **A department reviews its aggregates** | 5.0-05: small groups suppressed; no individual reachable from an aggregate |

---

## 5 · Outstanding decisions and risks register

### 5.1 · Decisions only the owner can make

Grouped by when they are needed. **None is needed for 4.1.** None is raised for decision now. They come back at each
version's planning window, as Rev 3 and DECISIONS-TO-TRACK already arrange.

| ID | Decision | Version | Needed by |
|---|---|---|---|
| **G-1** | **Merge the governing planning records into `main`** through the protected process. The 11 Nov roadmap (S-b) is only on `claude/roadmap-45-50`; Rev 3.3 and DECISIONS-TO-TRACK are only on `claude/bob-41-master-plan`. The owner's own rule (11 Nov): "Planning records become the authoritative repository record once merged into main." | All | **Before 4.2 planning.** Documentation-only; it can ride with any later docs PR |
| D-01 | What Exam Mode is | 4.2 | 4.2 planning |
| D-02 | Positions: permission-bearing or descriptive; acting cover | 4.2 (and 4.5-06) | 4.2 planning |
| D-04a/b | Export datasets; whether an export of educational evidence may precede R-2 | 4.2 | 4.2 planning |
| D-05 | Past reports: as then, or as corrected now (the 4.2/4.5 boundary) | 4.2 / 4.5 | 4.2 planning |
| D-06 | A name corrected after a certificate | 4.2 | 4.2 planning |
| D-10 | A PD participant removed after a PD certificate | 4.2 | 4.2 planning |
| D-11a/b | School rename semantics; promotion-run undo after new-year work | 4.2 | 4.2 planning |
| D-12 | Schedule Question Health before or after its repair | 4.2 / 4.5 | 4.2 planning |
| D-C1, C3, C4 | Admit the candidates (time limits; question-only import; the AI field) | 4.2 | 4.2 planning |
| D-C2 | Admit X-2 | 4.2 | After the walkthrough |
| R-1 | Formal evaluation policy | 4.5 | 4.5 planning |
| **R-2** | Retention, deletion and pseudonymisation | All | **Before production data** |
| R-3 | Structured misconception codes | 4.5 | 4.5 planning (C2w closed without it) |
| R-5 | Competency anchor | 4.5 | During 4.5 planning |
| D-45-03 | Who maps content to competencies | 4.5 | 4.5 planning |
| D-45-11 | WhatsApp audience (learners?) | 4.5 | 4.5 planning |
| D-45-12 | Which signals adaptive checks may use, given the no-tracking rule | 4.5 | 4.5 planning |
| R-4 | Staggered starts | 5.0 | 5.0 planning |
| D-50-01 | The Compact's terms | 5.0 | 5.0 planning |
| D-50-05 | Aggregate minimums; department scope | 5.0 | 5.0 planning |
| — | The broader institution model; Parent Portal; Share & Learn (source); unassigned items | Unassigned | Only if taken forward |
| — | The commercial side of AI drafting (rulings 38–40) | Unassigned | After E's cost evidence |

### 5.2 · Risks and general findings

| ID | Risk or finding | Severity | Effect | Mitigation |
|---|---|---|---|---|
| **G-1** | Governing planning records not on `main` | **High** (authority) | By the owner's own rule they are not yet the authoritative record | Merge, documentation only |
| G-2 | 4.2 has 12 open owner decisions and 1 planning-ready feature | High (schedule) | 4.2 planning will stall without a decision session | One structured decision pack at 4.1's Z, not piecemeal |
| G-3 | The rationalisation audit sits between 4.1 and 4.2 with no measures or time-box agreed | Medium | It can delay 4.2 indefinitely, or be skipped | Agree its measures and time-box at Z |
| **G-4** | **4.5 needs real evidence volume; production is at 111, and no real school runs 4.x** | **High** (value) | 4.5 Question Intelligence would produce "insufficient evidence" everywhere | Make production release and adoption an explicit milestone before 4.5's measurement work; R-2 is needed first anyway |
| G-5 | Retention (R-2) gates production data, export, snapshots, evaluation and deletion | High | It sits under five features in three versions | Bring R-2 forward as one policy decision with legal input |
| G-6 | Ruling 46's "same assessment" could leak into comparability | Medium | Silent equivalence | State the distinction in 4.5-02's plan |
| G-7 | Adaptive access checks vs the no-tracking principle | Medium | A contradiction inside 4.5 | D-45-12 |
| G-8 | Server-enforced progression waits for 5.0 though it is an integrity issue now | Medium | A known weakness persists through 4.2 and 4.5 | Consider it in the rationalisation audit or 4.2, as a defect, not a feature (owner decides if scope moves) |
| G-9 | E's outcome may remove integrated AI (ruling 44) | Medium | 4.2-C5 and C3w-2 disappear | None needed; known by design |
| G-10 | Share & Learn's source is unverified | Low | Possible lost commitment | Owner restates it, or it stays unassigned |
| G-11 | Educator evidence crosses export (4.2), evaluation (4.5) and growth (5.0) | High | 4.2 may ship an export that 4.5's protections then forbid | Decide D-04a with A5 in view |

---

## 6 · Approved direction vs implementation authorisation

| Version | Approved direction | Implementation authorisation |
|---|---|---|
| 4.2 | The owner's §4 deferrals (11 Nov); two execution-plan items | **None.** A version plan is to be written near Z and approved by the owner |
| 4.5 | RD-1 to RD-10, the A1–A6 groups; the carried O41-2 and D-088 | **None.** Separate planning and authorisation (S-b) |
| 5.0 | RD-6, RD-8, the B1–B5 groups | **None** |

---

## 7 · Independent reviews

Requested on 18 Nov. Each reviewer receives this document and challenges it from their discipline. **Findings are
recorded here verbatim in substance. Disagreements are listed, not resolved.**

| Reviewer | Brief | State | Findings | Disagreements with Bob |
|---|---|---|---|---|
| **Sharon** | Security, permissions, data integrity and evidence: §1 classes, §2 matrix, §3 failure answers, X-1 to X-13, G-1 to G-11 | Requested | — | — |
| **Daisy** | Journeys, consistency, explanations, accessibility, next actions: §3's "what the user sees", §4's journeys | Requested | — | — |
| **Second Eye** | Dependencies, failure scenarios, hidden assumptions, testability. Time-boxed so A3 is not delayed (owner: 4.1 continues independently) | Requested, after the C2w commit and V-2 | — | — |

---

## 8 · Readiness verdicts (provisional until §7 is complete)

### 4.2 · **NOT READY for detailed execution planning. READY for a scoping and decision session.**
- **1 of 20 items is planning-ready** (4.2-09); 5 are PARTIAL and can be planned by the team.
- **11 need an owner decision** (D-01, D-02, D-04, D-05, D-06, D-10, D-11, D-12, and admitting candidates C1, C3 and C4).
- **3 are BLOCKED:** X-2 on the walkthrough, retention on R-2, the commercial items on E.
- **Before implementation can be authorised:**
  1. 4.1 accepted;
  2. the rationalisation audit's measures agreed and the audit done;
  3. G-1 merged;
  4. one decision session on the D-items;
  5. the 4.2 plan written, reviewed by Sharon and Daisy, and approved by the owner.

### 4.5 · **NOT READY. BLOCKED at its foundation.**
- Its first group (Question Intelligence) is BLOCKED on RD-4's runtime verification, and in practice on real evidence
  volume (G-4).
- R-1, R-2, R-3 and R-5 are all pending.
- The carried capabilities need D-45-11 and D-45-12.
- **Before implementation can be authorised:**
  1. RD-4 reproduced at runtime (no-cost; can be scheduled after 4.1);
  2. R-2 decided (before production data in any case);
  3. R-1 and R-5 decided;
  4. a production-adoption path that yields evidence;
  5. the 4.5 plan approved.

### 5.0 · **NOT READY. BLOCKED on 4.5 by design.**
- Every 5.0 group depends on 4.5's measurement, comparability, competency identity, classification and protections.
- R-4 and the Compact's terms are pending.
- **The only item that could be planned earlier** is server-enforced progression (G-8), and only if the owner chooses
  to treat it as an integrity fix.

### Overall
The direction for all three versions is **coherent**: I found no circular dependency, and no contradiction between owner
rulings, except G-7, which is a tension inside 4.5's own text. The gaps are **decisions and evidence, not design
errors.** The most consequential are:
- **G-1:** the governing records are not yet on `main`;
- **R-2:** retention gates production data and five later features;
- **G-4:** 4.5 needs real data that production does not yet have.

## Revision record

| Date | Change |
|---|---|
| 18 Nov 2026 | Bob's audit. Reviews requested (§7) |

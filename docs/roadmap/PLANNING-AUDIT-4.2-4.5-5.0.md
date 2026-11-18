# PINTAR 4.2, 4.5 and 5.0 · planning-completeness audit

**Bob, Chief Architect, 18 November 2026.** Requested by the owner on 18 Nov. It is a planning and verification
assignment. **It authorises no implementation and does not change the approved 4.1 schedule.**

**Revision 2 (18 Nov, about 08:30 UTC):** targeted revisions after the owner's adviser review (§9). Verdicts now name
the exact decision, proof or delivery dependency for each feature instead of release-wide blocks; journeys and
decision outcomes are marked provisional; each owner decision carries a recommended answer.

**Status: Bob's audit, revision 3. Independent reviews: Sharon DONE (`72b964db`) and Daisy DONE (`f77bc2d6`), both recorded in §7 (revision 4); Second Eye IN PROGRESS** (§7). Sharon, Daisy and Second Eye
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

**A class describes one feature, not its release.** An open decision on one feature never stops planning of another.
Where one feature contains a settled part and an open part, it is split (for example 4.2-06a and 4.2-06b). The release
verdicts in §8 state what may be planned now and what waits, feature by feature.

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
| 4.2-03 | **One person holding roles at two schools** | A teacher or admin works in two schools from one identity | O41-12 (principle approved); 4.1 "no obstructing assumption" | H-02's minimum boundary; 4.2-02; A2b's work-scoped rule (R-1, ruling 31); A3's controller | Principle only. Rev 3 sets the minimum future-compatible boundary (identity ≠ membership, school-scoped dated grants, context selection, attributable audit) | Within authority: the context-switch design and the per-surface recheck. **D-03 (Sharon):** the authority rule between institutions: whether school A's admin can end any of the person's work at school B, and who suspends a two-school person | **UNRESOLVED** *(D-03; class changed after Sharon's review)* |
| 4.2-04 | **School data export** | Authorised staff obtain their school's data within their mandate | §4 deferral; THE PLAN D-4 (the export and its event arrive together); D-110 (school owns its data) | B1 event store; PRM; HIS; R-2 | `SCHOOL-DATA-EXPORT-4.0.md` exists as a 4.0 product note; datasets, formats and recipients are not designed | **D-04a:** which datasets, including learners' personal data and educator-related evidence (which 4.5 A5 will protect). **D-04b:** whether an export of educational evidence may precede R-2. An export creates a copy outside every retention rule (H-04) | **UNRESOLVED** |
| 4.2-05 | **Opening past reports; a period selector** | Report readers revisit an earlier period | §4 deferral; THE PLAN §5.2 | RES (correction chain, O41-21/22); REP; MEM (rollover, transfers); 4.5 A6 | Not designed. Rev 3 H-01 asks for the correction semantics | **D-05:** whether a past period shows the result *as it was then* or *as corrected now*. That is the line between this feature and 4.5's explainable history; if "as it was then", it pre-empts A6 | **UNRESOLVED** |
| 4.2-06a | **A school admin adding one person outside an import** | School admins add a single person without a bulk file | §4 deferral | ID (one identity per person; the import's duplicate rule; ruling 21, anonymised is terminal); MEM; AUD | A reuse of the import's existing identity and duplicate rules | Within authority | **PARTIAL** *(plannable now)* |
| 4.2-06b | **Correcting a name after activation** | School admins fix a misspelt name | §4 deferral | ID; CRT (sealed certificates carry the name); REP (prints); AUD | The correction itself can be designed now; only its effect on issued certificates is open | **D-06:** the effect on a certificate already issued (recommendation in §5.1) | **UNRESOLVED** *(certificate effect only)* |
| 4.2-07 | **Declining an account request** | Admins resolve a request; the requester learns the outcome | §4 deferral | ID; rulings 17 and 20 (sign-in must not disclose state); AUD | Not designed | Within authority: neutral wording (Daisy) consistent with rulings 17 and 20; repeated requests; audit. No owner decision expected | **PARTIAL** |
| 4.2-08 | **Password change while signed in** | A signed-in user changes their own credential | §4 deferral | ID; L-1 (neutral sign-in); the B1 events; sessions | Not designed. Learners sign in with a class card and PIN, so the audience is presumably staff | Within authority: re-authentication, ending other sessions, the B1 event, the audience (staff; and learners with a password?). **Confirm the audience in planning;** escalate only if learners are meant | **PARTIAL** |
| 4.2-09 | **The "classes without a teacher" view** | School admins find classes with no assigned teacher | §4 deferral | MEM; PRM; rollover | Read-only within school scope. Rev 3 asks which classes count | Within authority: current year, active classes, rollover behaviour | **COMPLETE** *(for planning)* |
| 4.2-10 | **PD corrections:** end a programme, remove a participant, the school ending its own PD sittings | Authorised admins correct professional-learning records | §4 deferral | PD records; CRT (PD certificates); AUD; the PD/academic separation | Not designed | Within authority mostly. **One owner question, D-10:** does removing a participant after a PD certificate was issued send it to review (as O41-19 does for scores)? | **UNRESOLVED** *(narrow)* |
| 4.2-11 | **Structure corrections:** reactivate or move a class; rename a school; undo a promotion run as a whole | Authorised admins correct structural mistakes | §4 deferral | MEM (rollover); RES; REP; CRT; ASM (open sittings); AUD; HIS | Not designed. Reactivate and move are bounded. Rename and undo are not | **D-11a:** after a school is renamed, which name do historical prints, certificates and verification show? **D-11b:** whether a promotion run can be undone once new-year work exists (new sittings, enrolments, results), or only before. It is a lifecycle rule with evidence consequences | **UNRESOLVED** |
| 4.2-12 | **Scheduled Question Health statistics** [execution plan] | Readers get a predictable refresh of existing outputs | EXECUTION-PLAN §4; RD-4 (three **suspected** calculation defects and one absent capability, from static inspection; 4.1 not reopened); H-05 | JOB (shared installer, restore, DR-S14–16); REP | Scheduling is simple. **Whether the refreshed figures are affected is not yet established:** RD-4's findings are unverified at runtime | **First, proof (team):** Second Eye reproduces each RD-4 finding and classes it as confirmed defect, missing capability or disproved concern, naming the Question Health outputs affected. **Then D-12** (recommendation in §5.1) | **UNRESOLVED** *(pending the runtime proof)* |
| 4.2-13 | **A teacher's handover view after a colleague leaves** [execution plan] | A new teacher sees the departed colleague's open work | EXECUTION-PLAN §4 (not the owner's list) | PRM; MEM; ASM (A1 controls on open sittings); AUD; 4.2-03 | Not designed | Within authority, **with Sharon's boundary:** class work only; never the leaver's drafts, reviewer notes or AI requests; original attribution kept. **Confirm it is in scope**, since only the execution plan assigned it | **PARTIAL** |
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
| 4.5-01 | **Question Intelligence** (difficulty, option and distractor behaviour, discrimination where sufficient, revision effects, reliability where supportable) | Authors, reviewers and teachers judge question quality | RD-1, RD-3, RD-4 | 4.1: item lineage (C1w), the result chain, the provenance, the raw responses (`is_final`, first view); D-060 | Direction only. **The four RD-4 findings are unverified at runtime.** Which Question Health figures depend on them is unknown | Team, under 4.5's planning approval: reproduce RD-4; verify formulas against known answers on controlled data; prove version handling and the "insufficient evidence" path. **Useful conclusions** on real classes need real sittings (G-4 restated) | **PARTIAL** *(foundation design and controlled verification can proceed; conclusions need real evidence)* |
| 4.5-02 | **Instrument comparability** (deterministic, human-confirmed) | Reviewers decide which assessments or revisions may be read together | RD-1; roadmap A1 | 4.5-01; C1w lineage; ruling 46 (attempts across versions, which is a different "same assessment" notion) | Direction only | Team: the deterministic rule. **Note:** ruling 46 already treats published versions as "the same assessment" for attempts. Comparability must not inherit that sameness (G-6) | **PARTIAL** |
| 4.5-03 | **Stable competency identity** (identity, equivalence and comparability kept separate) | One competency across lessons, items, years, schools and curriculum revisions | RD-9; R-5 pending | **R-5** (the national curriculum anchor); CON; O41-18 (who owns platform vs school content) | Direction only; the investigation has not started | **R-5.** Also **D-45-03:** who may map a school's own content to a competency, and whether a mapping is school-owned (D-110) | **UNRESOLVED** *(R-5)* |
| 4.5-04 | **The evidence and insight classification** (recorded, derived, inferred, not concluded) | Every statement PINTAR makes | RD-7 | REP and INT; versioned rules (D-060) | Principle adopted; structure not designed | Team | **PARTIAL** |
| 4.5-05 | **Quiet Intelligence,** including Performance Distribution, longitudinal patterns, educator-authored prerequisite hypotheses and recommendations | Teachers learn in about a minute what needs attention | RD-1, RD-2; the A3 direction | 4.5-01 to 4.5-04 | Direction only | Team: the screens (Daisy). **Source gap M-03:** a separate usefulness-measurement requirement is unverified. Rev 3 proposes walkthroughs and voluntary feedback | **PARTIAL** *(design can proceed in parallel; release depends on 4.5-01 to 4.5-03)* |
| 4.5-06 | **Governed formal educator evaluation** (seven steps, ten safeguards) | Institutions evaluate educators; humans finalise and seal | RD-5; R-1 pending | **R-1**; 4.5-04; 4.5-07; 4.5-08; R-2; PRM (assessor authority); 4.2-02 (positions) | Architecture approved; policy absent | **R-1** in full (assessor, period, rubric, response window, sealing of the response, readership, retention). Also **D-45-06:** evaluation after the educator changes school, or holds roles at two (4.2-03) | **UNRESOLVED** *(R-1)* |
| 4.5-07 | **Educator protections** (visibility, layered access, access audit, developmental vs formal separation, correction and response, no unsupported comparison) | Educators, before any educator-related evidence is shared | RD-6 | PRM; AUD; R-1; R-2 | Requirements listed; no design | Team, inside R-1's bounds | **UNRESOLVED** *(waits on R-1, by §0.3's worst-class rule; Sharon)* |
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
| 5.0-04 | **Governed journey shapes and server-enforced progression** | Learners follow intervention and prerequisite journeys | Reconciliation §1 (composer split) | ASM; the learning cycle; CON | Direction only. The reconciliation cites the Horizon Review's "friction 2" (progression enforced in pages); that review was unavailable to this audit, and **no current bypass has been demonstrated** | Team: the small set of shapes. **G-8 is an investigation, not a finding:** one reachable example, the rule it breaks and its consequence. If one exists, it is a defect with its own priority; if not, 5.0 placement stands | **PARTIAL** |
| 5.0-05 | **Institution-level improvement** (departments and schools, on aggregates) | Department heads and school leaders | Roadmap B5 | INT; PRM (department scope); small-cell aggregation (studied, not assigned); the broader institution model (unassigned) | Direction only | **D-50-05:** the minimum aggregate size and the department scope. **The broader institution model** is unassigned | **UNRESOLVED** |

### 1.4 · Totals

Committed scope, candidates and unassigned work are counted separately, so that optional or unassigned items do not
make the committed release look less mature than it is.

| Version and group | COMPLETE | PARTIAL | UNRESOLVED | BLOCKED |
|---|---|---|---|---|
| **4.2 committed** (the owner's §4 list and the two execution-plan items; 4.2-06 split: 14 items) | 1 (09) | 4 (06a, 07, 08, 13) | 9 (01, 02, 03, 04, 05, 06b, 10, 11, 12) | 0 |
| 4.2 register (4.2-R) | — | 1 | — | — |
| 4.2 candidates (C1–C5) | — | — | 3 (admission: C1, C3, C4) | 2 (C2 on the walkthrough; C5 on E) |
| Unassigned (U-01 retention enforcement) | — | — | — | 1 (R-2) |
| **4.5** (13 items) | 0 | 5 (01, 02, 04, 05, 10) | 7 (03, 06, 07, 08, 09, 11, 12) | 1 (S, source) |
| **5.0** (5 items) | 0 | 1 (04) | 1 (05) | 3 (01, 02, 03: on 4.5 by design; R-4) |

**Most of 4.2's nine UNRESOLVED items have a plannable part** (§8 lists them): the open decision is narrow, and a
recommended answer is in §5.1.

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
| 4.2-12 Scheduled QH | | | | | R | R | **M** | | | | **A** (suspected defects, RD-4) | | **C** |
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
| X-3 | Question Health schedule → Question Intelligence | 4.2-12 → 4.5-01 | 4.2 would refresh figures whose correctness RD-4 questions on static inspection only | Runtime proof first, then D-12 |
| X-4 | Export → retention → explainable history | 4.2-04 → U-01 → 4.5-08 | An exported file leaves PINTAR's technical control; it stays subject to the applicable handling obligations, and no retention policy can make it remotely revocable. 4.5 snapshots assume a retention rule that is not yet decided | Design now: authorised datasets and recipients, an export timestamp, the audit record, educator material excluded unless permitted. R-2 governs production use and disposition (D-04b) |
| X-5 | Same-assessment notion (ruling 46) → comparability | 4.1 A3 → 4.5-02 | A3 groups published versions as "the same assessment" for attempts. Comparability must be decided per pair and human-confirmed (RD-1). Reusing A3's lineage root as a comparability key would silently assert equivalence | Write the distinction into 4.5-02's plan (G-6) |
| X-6 | Unusual-access signals → the no-behaviour-tracking rule | 4.5-12 ↔ 4.5 governance | **A boundary to design, not a demonstrated contradiction.** Security events and learning-behaviour tracking differ in purpose, access and retention | Team proposes the minimum signals, who inspects them, retention, and their exclusion from analytics and evaluation; escalate only a proposal that crosses an existing prohibition (G-7) |
| X-7 | Reviewer notes → misconception mapping | 4.1 C2w → 4.5-09 | C2w notes are "never evidence, never a taxonomy" (C2w D-rules). 4.5 might assume them as a mapping source | Keep them excluded unless R-3 rules otherwise |
| X-8 | Two-school roles → A3's controller, A2b's work scope | 4.1 → 4.2-03 | None found. A2b reads the place, not the person's only school; A3 binds the controller to the Auth session, not to a school. Verify both in 4.2's tests | Test only |
| X-9 | Name correction → sealed certificates → snapshot certificates | 4.2-06 → CRT → 4.5-08 | 4.2 changes a name that 4.1 seals and 4.5 re-renders | Owner D-06 |
| X-10 | School rename → print references, verification | 4.2-11 → B2, CRT | B2 prints carry the school as it was; verification shows status. The rename semantics decide which is "true" | Owner D-11a |
| X-11 | Server progression → interventions | 5.0-04 → 5.0-02 | Unverified: whether any current approved completion or permission condition can be bypassed | Investigate (G-8) |
| X-12 | Real evidence → useful 4.5 conclusions | Production use → 4.5-01, 02, 05 | Building and verifying measurement needs only controlled data. **Conclusions about real classes** need real sittings, and production is at migration 111 with no real school on 4.x. Requirements differ by claim (G-4) | Treat adoption as a value and validation dependency, not a build prerequisite |
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
- *After expiry, revocation, transfer or suspension?* **Checked in the code (`main`):** account suspension
  (`tangguhkan_akun`) requires `is_system_admin()`, so **only a platform administrator can suspend a person**, and the
  suspension is person-wide. A school admin cannot suspend anyone. In a two-school design a school admin **ends their own
  school's grant**; that never touches the person's grant in the other school. Platform suspension stays a separate,
  platform-level act. **Bob's position (revision 2):** this settles the authority question from existing decisions.
  **Sharon's position (72b964db):** suspension was designed when a person had one school; the authority between two
  institutions is the owner's rule (D-03). **Revision 3 takes D-03 to the owner**, with the code's behaviour as the
  recommended answer (§5.1). The disagreement is recorded in §7.
- *Authority?* Each school's admin over its own grants only. **Open:** who may grant an acting appointment that spans a
  head-of-department scope.
- *What the user sees?* A context selector; Daisy.
- *Evidence?* Switching, revocation, expiry during an action, history retained, and no cross-school leak (H-02).

**4.2-04 School data export**
- *And then what?* A file leaves PINTAR's technical control. It remains subject to the applicable handling
  obligations, which the export screen states. The B1 event records who, what scope and when.
- *What else changed?* Retention (a copy exists outside every rule), educator protections (4.5-07, if educator evidence
  is included).
- *Failure or interruption?* A partial file; a repeated request; authority expiring during generation. **Open.**
- *After a later correction or deletion?* The export is stale. **(Proposed)** every export carries its "as of"
  timestamp; a later deletion cannot reach a downloaded file, and the handling obligations say so.
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
  evidence.** **(Proposed:)** undo only while no new-year evidence exists; otherwise per-learner corrections. Owner D-11b.
- *Rename a school:* history keeps the name as issued **(proposed)**; current views show the new name. D-11a.
- *Reactivate a class:* its old sittings stay closed; it gains new work only.
- *Evidence?* Each correction with a dependent certificate, report and open sitting present.

**4.2-12 Scheduled Question Health**
- *And then what?* Readers trust fresher figures. **Whether those figures are affected by RD-4 is unproven** until
  the runtime reproduction. **(Proposed)** no automatic refresh of a figure found misleading.
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

These are **planning definitions, provisional**. Each version's execution plan restates them as tests on its exact
candidate, against the scope finally admitted. Any outcome that depends on an open decision is marked **(per D-…)** or
**(proposed)** and is not a settled outcome.

### 4.2 · eight journeys

| # | Journey | Covers | Success, refusals, recovery, history |
|---|---|---|---|
| **J42-0** *(Daisy)* | **The teacher's and the learner's actual first day** | 4.2-09, 4.2-13, existing 4.1 paths | A teacher signs in for the first time in the new year, finds their classes, and assigns the first work; a learner with a new card signs in and starts it. This is the first-day experience; J42-1 is the admin's |
| **J42-1** | **First day at a new school year, with a new head of department** *(the admin's side)* | 4.2-02, 4.2-09, 4.2-11, 4.2-13 | The admin rolls over the year; finds classes without a teacher; appoints an acting head (future-dated start); a departing teacher's classes are handed over. Refused: an expired grant. Undo of the run before any work exists **(per D-11b)**. History: last year's reports still name last year's teacher |
| **J42-2** | **A teacher at two schools** | 4.2-03 | One identity, two dated grants, a context switch. Refused: reading school B's report from school A's context. School A's admin ends their grant: school B is unaffected. A platform suspension (platform admin only) covers both. History: work keeps its original school |
| **J42-3** | **An exam day, with an interruption and a maintenance window announced** | 4.2-01, A3, A2b, A1 | Learners sit under exam conditions; one device fails and is recovered with authorisation; a planned window drains correctly; results reported. Refused: an unauthorised device switch. **Depends on D-01** |
| **J42-4** | **A school exports its data, then a correction lands** | 4.2-04, 4.2-05 | Export with its event; then a key correction; the past report shows the agreed semantics (D-05); the export is visibly "as of". Refused: another school's data; an expired role mid-export |
| **J42-5** | **A name mistake found after a certificate was issued** | 4.2-06, CRT | The name is corrected; the certificate is handled per D-06; verification shows the governed status |
| **J42-6** | **An account request declined; a password changed; a suspended user** | 4.2-07, 4.2-08, L-1 | Neutral wording throughout; other sessions ended **(proposed)**; nothing disclosed |
| **J42-7** | **A PD programme ended early** | 4.2-10 | Participants' records and certificates follow D-10 |
| **J42-8** | **A school renamed mid-year** | 4.2-11 | Prints, certificates and verification follow D-11a |
| **J42-9** | **Question Health on a schedule** *(only if admitted after the runtime proof)* | 4.2-12 | A refresh runs; freshness is shown; a failed run is visible; a restore reinstalls the job; any figure with a confirmed limitation says so |
| **J42-11** *(Daisy)* | **An ordinary week**, the regression baseline | All committed 4.2 features | Assign, sit, mark, report and print across one week, with nothing unusual. Every 4.2 change must leave it identical |
| **J42-12** *(Daisy)* | **A mid-term transfer** | MEM, 4.2-05, ruling 25 | A learner moves school mid-term with open and finished work; past reports show each school's evidence only |
| **J42-13** *(Daisy)* | **A teacher leaving mid-term** | 4.2-13, M-4 (offboarding), 4.2-09 | Offboarding as one act; the class appears without a teacher; the handover view; the leaver's drafts and notes stay theirs |
| **J42-14** *(Daisy)* | **A lab session with a power or network cut** | 4.2-01, A3, A2a | A whole room loses power mid-sitting; recovery, time preserved, nothing double-recorded |
| **J42-10** | **External AI content imported** *(only for the candidates admitted)* | 4.2-C2–C4 | A teacher imports AI-drafted questions (paste route or questions-only), records the AI as self-declared, and the questions go through review, publication and a key correction like any other |

### 4.5 · six journeys

| # | Journey | Covers |
|---|---|---|
| **J45-1** | **A flawed question is found by Question Intelligence, corrected, then read again** | 4.5-01, C1w correction, 4.5-08: the fractions example in Rev 3. The distractor analysis flags it, the key is corrected, statistics recompute on the in-force chain, and history shows the old figure as issued |
| **J45-2** | **"Not concluded"** | 4.5-04/05: a small class, a sparse sample, an incomparable revision. The teacher sees why there is no conclusion and what would make one possible |
| **J45-3** | **A teacher's minute** | 4.5-05: priorities in about a minute, with denominators, exclusions and a recommended next step the teacher may ignore |
| **J45-4** | **A formal evaluation period, end to end** | 4.5-06/07: opened by the institution, draft, assessor adjustment with rationale, seal, educator receipt, response, access audit. Includes the educator transferring mid-period **(per R-1)** |
| **J45-5** | **What did that certificate say?** | 4.5-08: a certificate and a report re-rendered as issued, after a later correction and a school rename |
| **J45-7** *(Daisy)* | **Nothing needs attention, and a second visit** | 4.5-05: the quiet outcome, said plainly; a return visit shows what changed since |
| **J45-8** *(Daisy)* | **An author's Studio journey** | 4.5-01, 4.5-09: an author sees a question's quality and misconception evidence while revising it |
| **J45-6** | **Staff sign-in under the carried capabilities** | 4.5-11/12: WhatsApp sign-in (per D-45-11), a provider outage fallback, an unusual-access challenge, the last admin never locked out |

### 5.0 · four journeys

| # | Journey | Covers |
|---|---|---|
| **J50-1** | **The improvement cycle:** understand, choose, act, observe, compare, reflect, improve | 5.0-02/03, with every claim level shown and refused when unsupported |
| **J50-2** | **A staggered start, ended for one learner** | 5.0-02 under R-4: necessary assistance preserved |
| **J50-3** | **An educator's growth year** | 5.0-01: objectives, a shared record, a withdrawal per the Compact, and no path into formal evaluation |
| **J50-4** | **A department reviews its aggregates** | 5.0-05: small groups suppressed; no individual reachable from an aggregate |
| **J50-6** *(Daisy)* | **The family's side of a staggered start** | 5.0-02 under R-4: what a family is told, when, and what they can ask |
| **J50-5** | **A learner on a governed journey shape, interrupted** | 5.0-04: a step interrupted and resumed; a scope change; accepted progress never lost; the server refuses an out-of-order step |

---

## 5 · Outstanding decisions and risks register

### 5.1 · Decisions only the owner can make

Grouped by when they are needed. **None is needed for 4.1.** None is raised for decision now. They come back at each
version's planning window, as Rev 3 and DECISIONS-TO-TRACK already arrange.

Each is within the owner's remit: educational behaviour, authority, commercial scope or historical meaning.
Implementation mechanics stay with the team. **Every decision carries a concrete choice and Bob's recommended answer,
for the owner to accept, amend or reject.** None is asked now.

| ID | Decision | Bob's recommended answer | Needed by |
|---|---|---|---|
| **G-1** | Publish the governing planning records on `main` | A bounded documentation-only PR carrying the 11 Nov roadmap set, Rev 3.3 and DECISIONS-TO-TRACK. **This is a repository requirement; it does not make any approved ruling absent meanwhile** (see G-1 in §5.2) | Before 4.2 planning |
| D-01 | What Exam Mode is | A teacher-scheduled sitting with a fixed start window; device change only by A3's teacher-authorised recovery; A1 controls kept, each with a reason; **no lockdown or monitoring technology** (no behaviour tracking); results marked "exam" so 4.5 does not compare them with practice by default. **Accommodations (Daisy):** extra time as an accessibility accommodation stays available in Exam Mode, recorded with its reason | 4.2 planning |
| D-02 | Positions: permission-bearing or descriptive; acting cover | **Descriptive.** Permission stays in scoped, dated grants; an acting appointment is a dated grant with a reason that expires on its own | 4.2 planning |
| D-03 | Authority over a two-school person (Sharon) | A school admin ends only their own school's grant and work context; suspension stays a platform-admin act and is person-wide, as the code does today (`tangguhkan_akun` requires `is_system_admin()`). **What the owner confirms (Sharon):** that a suspension for one school's reason ends the person's work at every school | 4.2 planning |
| D-R2 | Assign R-2 to a version (Sharon: make it a 4.2 deliverable) | **Agree with Sharon:** prepare R-2 as a 4.2 deliverable, since it gates production adoption and every later conclusion (G-4/G-5). This is a version assignment, so it is the owner's | 4.2 planning, or earlier if production is sooner |
| D-04a/b | Export datasets; timing against R-2 | The school's own structure, people and academic records; **excluded by default (Sharon, G-11): all educator-related evidence** (per-teacher aggregates, C2w reviewer notes, C3w requests by requester, anything 4.5-07 will protect) until 4.5-07 exists, plus the B1 store and other schools' data. The owner may override; the plan must not assume it. Allowed before R-2 with an "as of" timestamp, the audit event and stated handling obligations (the school owns its data, D-110) | 4.2 planning |
| D-05 | Past reports: as then, or as corrected now; and who may read them | **As corrected now,** with a visible "corrected" marker and the date, consistent with O41-21. Exact as-issued reconstruction stays 4.5-08's. **Who reads (Sharon, D-05b):** current grants govern who may read; the period governs the content | 4.2 planning |
| D-06 | A name corrected after a certificate | The certificate stays as issued (sealed). Verification shows the current name and "name corrected on {date}". Reissue only on request, through the existing review | 4.2 planning |
| D-10 | A PD participant removed after a PD certificate | The certificate goes to review, as O41-19 does for corrected scores | 4.2 planning |
| D-11a/b | Rename semantics; promotion-run undo | (a) History and issued artefacts keep the name as issued; current views show the new name; verification shows the current name with "formerly …". (b) Undo only while no new-year evidence exists, with "evidence" defined broadly and the undo's lock scope bounded (Sharon); otherwise per-learner corrections | 4.2 planning |
| D-12 | Scheduling Question Health | Do not schedule a figure the runtime proof finds misleading. Correct it first (early 4.5 work brought forward only if small), or schedule the unaffected figures with any limitation shown | 4.2 planning, after the proof |
| D-C1 | Admit assessment-specific time limits | Not in 4.2 unless the walkthrough shows a need; R-C stands | 4.2 planning |
| D-C2 | Admit X-2 | Decide on the walkthrough's evidence | After the walkthrough |
| D-C3, C4 | Admit the questions-only import and the AI field | Admit both: small, they reuse C1w and C3w's self-declared boundary | 4.2 planning |
| R-1 | Formal evaluation policy | Bob prepares one policy proposal with options at 4.5 planning | 4.5 planning |
| **R-2** | Retention, deletion and pseudonymisation | **Bob prepares one recommended policy, with legal input and its consequences across the affected features,** for the owner to decide once | **Before production data** |
| R-3 | Structured misconception codes | Keep C2w notes outside evidence; decide codes inside 4.5-09's design | 4.5 planning |
| R-5 | Competency anchor | After the 4.5 investigation reports | During 4.5 planning |
| D-45-03 | Who maps content to competencies | The content owner of each item (O41-18), with independent confirmation | 4.5 planning |
| D-45-11 | WhatsApp audience | Staff only at first; learners only after a separate eligibility check, as ruling 44 did for AI | 4.5 planning |
| D-45-12 | Adaptive-check signals | Only if the team's design crosses a prohibition | 4.5 planning |
| R-4 | Staggered starts | A policy proposal at 5.0 planning, with an ethics review route | 5.0 planning |
| D-50-01 | The Compact's terms | A proposal at 5.0 planning | 5.0 planning |
| D-50-05 | Aggregate minimums; department scope | A minimum group size and the department scope, set with Sharon at 5.0 planning | 5.0 planning |
| — | The broader institution model; Parent Portal; Share & Learn (source); unassigned items | Unassigned | Only if taken forward |
| — | The commercial side of AI drafting (rulings 38–40) | Unassigned | After E's cost evidence |

### 5.2 · Risks and general findings

| ID | Risk or finding | Severity | Effect | Mitigation |
|---|---|---|---|---|
| **G-1** | Governing planning records not on `main` | Medium (record-keeping) | The rule is the completion-folder `OWNER-DECISIONS-2026-11-11.md` (on `main`), "Also ruled the same day": *"Planning records become the authoritative repository record once merged into `main` through the protected process."* It concerns the repository record. **The owner's explicit decisions stand regardless of where they are filed**, and the team does not treat an approved ruling as absent | A bounded documentation-only PR |
| G-2 | 4.2 has 12 open owner decisions, each now with a recommended answer | High (schedule) | 4.2 planning will stall without a decision session | One structured decision pack at 4.1's Z, not piecemeal |
| G-3 | The rationalisation audit sits between 4.1 and 4.2 with no measures or time-box agreed | Medium | It can delay 4.2 indefinitely, or be skipped | Agree its measures and time-box at Z |
| **G-4** | **Useful 4.5 conclusions need real school evidence; production is at 111 and no real school runs 4.x** | High (value) | Building, repairing and verifying measurement can use controlled data with known answers. What needs real sittings is **conclusions about real classes**, and the requirement differs by claim: item difficulty needs enough responses per item; discrimination needs more, across a range of ability; reliability needs enough complete sittings of one instrument; longitudinal improvement needs comparable instruments over time. This audit sets no number | Treat adoption as a **value and validation** dependency. Evidence collection starts with an authorised production rollout (after R-2). Foundation design and controlled verification can proceed under 4.5's planning approval |
| G-4/5 path | **One path (Sharon):** R-2 → production adoption (after the upgrade's blockers, REH-1, are cleared) → real evidence → 4.5 conclusions | High | Two refinements: RD-4's verification is not blocked by G-4 (synthetic data proves correctness); and the "insufficient evidence" thresholds are fixed and versioned **before** real data arrives, so they are not tuned on it | Recommended in D-R2 |
| G-5 | Retention (R-2) governs production data and every irreversible disposition | High | **What it blocks:** production use of educational evidence, and any deletion, pseudonymisation or snapshot expiry. **What it does not block:** designing export permissions, historical record structures and retention dependencies | Bob brings one recommended policy, with legal input |
| G-6 | Ruling 46's "same assessment" could leak into comparability | Medium | Silent equivalence | State the distinction in 4.5-02's plan |
| G-7 | Adaptive access checks beside the no-tracking principle | Low | A boundary to design, not a demonstrated contradiction | **Sharon's stated boundary, proposed:** sign-in events only; staff only; a separate, short-retention store never joined to evidence; enforced by grants, with a test. The owner still rules (D-45-12) |
| G-8 | Whether current progression can be bypassed | Unknown until investigated | If a current client can bypass an approved completion or permission condition, it is a defect | Second Eye checks now, cheaply, whether any RPC allows a step the page forbids, giving the rule, the path and the consequence. A demonstrated defect is classed and prioritised; otherwise 5.0 placement stands. **The rationalisation audit introduces no new educational behaviour without a scope decision** |
| G-9 | E's outcome may remove integrated AI (ruling 44) | Medium | 4.2-C5 and C3w-2 disappear | None needed; known by design |
| G-10 | Share & Learn's source is unverified | Low | Possible lost commitment | Owner restates it, or it stays unassigned |
| M-1 (Sharon) | Data-subject requests (access, correction, deletion by a person) have no owner or version | High | — | Into R-2's proposal |
| M-2 (Sharon) | A deletion must survive a backup restore | High | A restore can resurrect deleted personal data | Into R-2's proposal and the restore runbook |
| M-3 (Sharon) | The audit log is itself personal data | Medium | Retention and access of `audit_log` and B1 | Into R-2's proposal |
| M-4 (Sharon) | **Offboarding as one act:** grants, sessions, authored drafts, half-finished two-person reviews, the last admin | High | Today these end piecemeal | A 4.2 planning item beside 4.2-13 |
| M-5 (Sharon) | An SEC module: secrets, egress and data processors | Medium | Missing from §0.4's module list; C3w-2, WhatsApp and export all touch it | Added to the module list for plans |
| M-6 (Sharon) | **Who may read the past (D-05b):** current grants govern who reads; the period governs the content | Medium | Missing from D-05 | Adopted into D-05 |
| M-7 (Sharon) | The 111 → 4.x production upgrade as a named prerequisite | High | Precedes production adoption (G-4/5 path) | Named in §8 |
| M-8 (Sharon) | Small-cell suppression must start in 4.5 (Quiet Intelligence), not 5.0 | Medium | Small classes could identify individuals | Moved to 4.5-05's plan |
| D-V (Daisy) | Four reading patterns must be fixed once, before 4.2 planning, on one vocabulary page: «Keadaan per …», «Seperti saat diterbitkan», «diperbaiki», and «Belum dapat disimpulkan» with why and what would help. Refusals answer "unknown" and "forbidden" alike | Medium | Inconsistent history and refusal wording across 4.2, 4.5 and 5.0 | Daisy writes the page before 4.2 planning |
| D-A (Daisy) | Eight accessibility risks in the review, one of them inside D-01 (accommodations) | Medium | — | Carried into each version's plan from Daisy's review |
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
| **Sharon** | Security, permissions, data integrity and evidence: §1 classes, §2 matrix, §3 failure answers, X-1 to X-13, G-1 to G-11 | **Done on revision 1** (`63c66ba9`): `72b964db`, `docs/coordination/reviews/sharon/PLANNING-AUDIT-42-45-50-63c66ba9.md`. Her review stands on revision 1; she confirmed revision 3's §7 states it correctly | The §8 verdicts stand (on revision 1). G-7 is resolvable with a stated boundary; G-8 should be checked now. Gaps M-1 to M-8 added to §5.2. 4.2-13 agreed with a boundary. Proposed answers agreed except suspension (D-03); the promotion undo needs a broad definition of evidence and a bounded lock scope. **Adopted in revision 3:** 4.2-03 and 4.5-07 to UNRESOLVED; the G-11 default; the G-4/5 single path with both refinements; the G-7 boundary; G-8 checked now; M-1 to M-8; D-05b (current grants govern reading, the period governs content); the D-11b qualification | **1. Suspension authority:** Bob held it settled by the code (revision 2); Sharon holds it an inter-institution authority rule for the owner (D-03). **Revision 3 follows Sharon** and takes D-03 to the owner, with the code's behaviour as the recommendation. **2. R-2's version:** Sharon recommends making it a 4.2 deliverable; Bob agrees, but it is the owner's assignment (D-R2). No disagreement remains open between Bob and Sharon; both points are now owner decisions |
| **Daisy** | Journeys, consistency, explanations, accessibility, next actions: §3's "what the user sees", §4's journeys | **Done on revision 1** (`63c66ba9`): `f77bc2d6`, `docs/coordination/ux/roadmap/TINJAUAN-AUDIT-PERENCANAAN-63c66ba9.md` on `ux-1/daisy-experience` | Agrees with all three verdicts. Five 4.2 journeys missing, plus two for 4.5 and one for 5.0: **added in revision 4** (J42-0, J42-11 to J42-14, J45-7, J45-8, J50-6; renumbered where revision 2 had used the numbers). "Open; Daisy": **no new owner decision**; each item is within planning or waits on D-01, D-04a, D-05, D-06, D-12 or D-45-11. The vocabulary page (D-V) and eight accessibility risks (D-A), including accommodations in Exam Mode (now in D-01). Agrees on 4.2-09 (with mid-term vacancies included) and strongly agrees on G-8. **Her own V-3 (4.1):** Z-3 as designed would answer an unknown correction id differently from a forbidden one, an existence oracle. It must be revised before it lands as C3w-1's first commit; passed to Second Eye | **D-1 (Daisy):** move 4.2-12 to 4.5 rather than schedule figures that may be wrong. Bob's revision 2 recommendation is conditional: decide after the runtime proof, scheduling only figures shown sound. **Both go to the owner under D-12.** **D-2 (Daisy):** J42-1 is not the first-day experience. **Accepted:** J42-0 added. **D-3 (Daisy):** "about one minute" is a goal to be measured, not asserted. **Accepted:** 4.5-05's acceptance must measure it, consistent with the usefulness-measurement reconciliation (M-03) |
| **Second Eye** | Dependencies, failure scenarios, hidden assumptions, testability. Time-boxed so A3 is not delayed (owner: 4.1 continues independently) | Requested, after the C2w commit and V-2 | — | — |

---

## 8 · Readiness verdicts (revision 2; provisional until §7 is complete)

### 4.2 · **Ready for scope selection and detailed planning of bounded features. Final implementation approval awaits the identified decisions.**
- **Plannable now, by the team:** 4.2-09 (classes without a teacher); 4.2-06a (adding one person); 4.2-07 (declining
  a request); 4.2-08 (password change); 4.2-13 (handover view, with Sharon's boundary); offboarding as one act (M-4);
  and the register.
- **Plannable in part now; one narrow decision for the rest** (recommended answers in §5.1):
  - 4.2-02: the grant mechanics now, D-02 for positions;
  - 4.2-03: identity, dated grants and context switching now, D-03 for authority between schools;
  - 4.2-04: datasets, recipients and audit now, D-04;
  - 4.2-05: the selector and access rules now, D-05 for correction semantics;
  - 4.2-06b: the correction now, D-06 for certificates;
  - 4.2-10: D-10;
  - 4.2-11: reactivating or moving a class now, D-11 for rename and undo.
- **Waiting on proof:** 4.2-12, until the runtime reproduction of RD-4.
- **Waiting on a scope decision:** 4.2-01 Exam Mode (D-01), and the candidates.
- **Delivery sequence before 4.2 development:** 4.1 accepted; the rationalisation audit's measures agreed and the audit
  done; the 4.2 plan approved.

### 4.5 · **Foundation design and controlled verification can be planned. Useful conclusions and the policy-bound features cannot yet.**
- **Plannable now under a 4.5 planning approval:**
  - the RD-4 runtime reproduction;
  - measurement formulas verified on controlled data;
  - the classification;
  - comparability rules;
  - Quiet Intelligence's design;
  - the protections' requirements (their design follows R-1);
  - small-cell suppression (M-8);
  - versioned "insufficient evidence" thresholds, fixed before any real data;
  - the scoring-policy check.
- **Waiting on owner policy:**
  - R-1 (formal evaluation);
  - R-2 (retention: snapshots and production evidence; recommended as a 4.2 deliverable, D-R2);
  - R-3 (misconception codes);
  - R-5 (competency anchor);
  - D-45-11 (WhatsApp audience).
- **Waiting on evidence:** conclusions on real classes. The path is R-2, then the 111 → 4.x production upgrade (M-7,
  after REH-1), then adoption, then real evidence (G-4/5).
- **Waiting on its source:** Share & Learn.

### 5.0 · **Not ready for detailed planning, by design: it builds on 4.5's outputs.**
- **Can be prepared:** the R-4 and Compact proposals; the G-8 investigation; the governed journey shapes.
- **Waiting on 4.5's delivered foundations:** everything else.

### Overall
The direction is **coherent**:
- no circular dependency;
- no contradiction between owner rulings (G-7 is reclassified as a design boundary).

The gaps are decisions and evidence, not design errors. The most consequential are:
- **R-2**, which governs production data and disposition;
- **useful 4.5 conclusions need real school evidence** (G-4);
- **one 4.2 decision session**, with the recommended answers of §5.1, near Z.

## 9 · The owner's adviser review (18 Nov), and how revision 2 answers it

| # | Point | Response |
|---|---|---|
| 1 | Replace release-wide "not ready" with specific limits; split features; separate candidates and unassigned work from the headline | Adopted: §0.3, §1.4, §8; 4.2-06 split |
| 2 | Real data is a condition for useful conclusions, not a prerequisite for building measurement; requirements differ by claim | Adopted: G-4, X-12, 4.5-01, §8 |
| 3 | The four RD-4 findings are suspected, not known; prove each first; avoid refreshing misleading figures | Adopted: 4.2-12, X-3, §3.1, D-12. Second Eye's runtime reproduction is the proof step |
| 4 | Investigate server progression before calling it a defect | Adopted: G-8, X-11, 5.0-04 |
| 5 | Describe exactly what R-2 blocks; export precision; bring one recommended policy | Adopted: G-5, X-4, §3.1, R-2 row |
| 6 | Resolve who may suspend across schools | **Settled from the code:** only a platform admin can suspend (`tangguhkan_akun` requires `is_system_admin()`); a school admin ends their own school's grant only. §3.1, J42-2 |
| 7 | Unusual-access checks are a boundary to design | Adopted: G-7, X-6 |
| 8 | Journeys and outcomes provisional; coverage for admitted scope; recommendations with each owner decision | Adopted: §4 (J42-9, J42-10, J50-5 added), §5.1 |
| — | G-1 needs a precise citation; rulings are not absent meanwhile | Adopted: G-1 rows |
| — | Protect C2w's candidate; explain the extra commit | Answered to the owner in the session and recorded in `OWNER-RETURN-18NOV.md` |

## Revision record

| Date | Change |
|---|---|
| 18 Nov 2026 | Bob's audit. Reviews requested (§7) |
| 18 Nov 2026, revision 4 | Daisy's review (`f77bc2d6`) recorded in §7: eight journeys added, D-V and D-A, accommodations in D-01, her three disagreements (one to the owner under D-12, two accepted) |
| 18 Nov 2026, revision 3 | Sharon's review (`72b964db`) recorded in §7: two classes changed, D-03 and D-R2 added, the G-11 default, the G-4/5 path, the G-7 boundary, G-8 checked now, M-1 to M-8, the D-05b reader rule, the D-11b qualification |
| 18 Nov 2026, revision 2 | Targeted revisions after the owner's adviser review (§9): feature-level verdicts, 4.2-06 split, counts separated, G-4 restated, RD-4 status corrected, G-7 and G-8 recast, R-2's reach stated, suspension authority checked in the code, journeys provisional with three added, every owner decision given a recommended answer, G-1 cited precisely |

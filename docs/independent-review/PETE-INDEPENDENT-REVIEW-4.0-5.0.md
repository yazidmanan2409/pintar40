# PINTAR 4.0–5.0 · Independent Review, Track B

**Reviewer:** Pete. **Date:** 18 November 2026. **Status:** complete and frozen. Prepared without sight of any other reviewer's findings.

**Method.** Read-only. I read the governing records and the code, and sent four read-only investigators into the code for evidence with file and line references. I then re-checked the claims this report leans on most. Nothing was changed, merged or deployed. This file is not committed or pushed.

**Sources and their short names**

| Short name | What it is |
|---|---|
| `main` | Application code and migrations at `7ba18b03` (284 migrations, C2w merged) |
| `plan/` | `docs/` on `claude/bob-41-master-plan` at `861375e7`: Roadmap Rev 3.3, THE PLAN, owner rulings 1–54, planning audit rev 6, status of 18 Nov, Z readiness |
| `mig/` | `supabase/migrations/` on `main` |
| `ux/` | Daisy's notes on `ux-1/daisy-experience` |
| `a3` | The in-progress A3 branch at `547b3707` |

**Evidence labels used throughout**

- **Verified:** read in code or in a dated record.
- **Inferred:** my conclusion from what was read.
- **Not evidenced:** I looked and could not establish it.

**What I could not do.** I could not open staging or production in a browser, so no screen was seen rendered. I ran no tests. Sharon's review folder lives on a branch I did not check out; I used her findings only as the plan records quote them.

---

## A · Executive assessment

### The judgment in five sentences

1. **PINTAR's evidence core is the strongest part of the system, and it is strong.** Answers are append-only, results form a chain that cannot fork, a wrong key is corrected by two people with every earlier state kept, and figures are withheld when the numbers are too small.
2. **PINTAR is unvalidated by any real user.** Production holds one account and no assessments; the educator walkthrough has never taken place; every acceptance so far is the team's own.
3. **The teaching loop is open at the point that matters.** PINTAR tells a teacher what is weak and then offers nothing that acts on it, checks it, or remembers it. The roadmap closes that loop only in 5.0, behind three releases of prerequisites.
4. **The roadmap's later half assumes evidence that ordinary schools will not produce.** Item statistics need 30 responses per question, comparisons need comparable instruments, and cross-school pooling is excluded. A typical school will read "Belum cukup data" for most of 4.5.
5. **The critical path to a school is not a feature.** It is legal and privacy work, retention policy, capacity on real infrastructure, monitoring, support people and a content library. None of these has an owner-approved plan.

### Baseline: what is actually true today

| State | What is in it | Evidence |
|---|---|---|
| **Implemented and verified by the team on staging** | 4.0 (batches 0–9). 4.1 batches B0, A1, C1w, B1, B2, A2a, A2b, C2w | `plan/completion-4.1/Z-READINESS.md` §1; owner ruling 53 |
| **Implemented, not fully verified** | A3: the single-writer core is built; the recovery act and the teacher's authorisation are a proposal with red tests only | `a3/docs/completion-4.1/batches/A3-PEMULIHAN.md` |
| **Designed, not built** | C3w (integrated AI drafting); the provider evaluation is at teacher judging | `plan/completion-4.1/STATUS-2026-11-18.md` §4, §6 |
| **Deferred, with no plan** | 4.2: owner deferrals plus two execution-plan items; no version plan; 12 open owner decisions | Roadmap Rev 3.3; planning audit §5.1, G-2 |
| **Approved direction only** | 4.5 and 5.0: no plan, no authorisation | Planning audit §6 |
| **In production** | The September build at migration 111: 2 schools created by an operator, 1 person, 0 items, 0 sittings, 0 certificates | `plan/completion-4.1/rehearsal/stage2-production-counts-RESULT-2026-11-17.md` |
| **Human acceptance** | None. The walkthrough's conditions, observations and findings sections are empty. The owner recorded that Dr Gladys "tried to do the studio, but it wasnt fully developed" | `plan/coordination/walkthrough-gladys/EVIDENCE.md` §4–§6; `plan/coordination/DECISIONS.md` D-141 |
| **Unknown** | Whether production watch, off-site backup and the restore drill are switched on (repository variables, invisible in a checkout); what a skipped year rollover breaks; what a receiving school sees of a transferred learner's history | See G and D |

Two corrections to common shorthand follow from this table.

- **"Schools still use the September version" overstates it.** No school uses any version. Production is an empty September build.
- **"Staging acceptance" is engineering acceptance.** The roadmap itself says a staged pass "does not establish production or educator acceptance" (Rev 3.3, 4.0 definition of done). I agree, and the distinction carries more weight than the roadmap gives it.

### Strengths, with confidence

| Strength | Confidence |
|---|---|
| Evidence integrity: append-only responses, unforkable result chain, governed two-person key correction, certificates sealed and reviewed, never silently changed | High (verified in `mig/`) |
| Honest reporting: minimum sample rules, whole figures withheld when one cell is too small, no rankings, no teacher-against-teacher views, no causal or predictive wording | High (verified) |
| Answer safety on a poor connection: a local outbox, replay on reconnect, a finish that refuses until every answer is acknowledged | High (verified in `ItemPlayer.tsx`); not measured from Indonesia |
| Human authority over AI: no learner-facing AI, database-enforced acceptance and second-person review, no learner data sent out | High for design; not built |
| Engineering discipline: failing-first tests, 1,243 checks, 178 planted defects, independent security and screen review per batch | High that it exists; medium that it measures what users will feel |

### Weaknesses, with confidence

| Weakness | Confidence |
|---|---|
| No real-user evidence of any kind, with a five-release roadmap built on it | High |
| The insight-to-action loop is absent before 5.0 | High |
| The learner who fails reaches a dead end that only two adults can reopen | High |
| The certifying test allows hints and, on retake, most likely repeats the same questions | High on hints (verified); medium on repetition (inferred from the import defaults) |
| A multi-answer question type is live and is mishandled in the learner's review, the reading map and every statistic | High (verified) |
| Path to production has no plan: legal, retention, capacity, monitoring, support, content | High |
| 4.5 will mostly report insufficient evidence in ordinary schools | Medium (inferred from thresholds and class sizes) |
| Formal educator evaluation is the highest-risk item on the roadmap and has no evidence of demand | Medium (a judgment) |

---

## B · Version-by-version review

### 4.0 · Foundation

**What it is.** Identity and roles, the school-year lifecycle, content release, the learning cycle (Pemetaan Awal, Peta Bacaan, lessons, Uji Penguasaan, result), Uji Cepat, reports, certificates, professional learning, audit.

**Assessment.** Sound in what it protects. Thin in what it lets a teacher do next. The 10 November whole-platform assessment said the same of operations ("not yet in what it lets a school do"); I extend that to teaching.

**Findings that start here:** PETE-03 (content), PETE-05 (after failing), PETE-06 (certifying test), PETE-07 (multi-answer), PETE-08 (gain), PETE-10 (diagnostic), PETE-11 (set-up friction), PETE-15 (terminology), PETE-22 (school year and semesters).

### 4.1 · Integrity under correction and interruption

**What it is.** Sitting control, the question workbench and key correction, accountability records, print references, emergency stop, planned maintenance, reviewer notes, single-writer recovery, AI drafting.

**Assessment.** This is the best-specified release. It answers "what else did that change?" more thoroughly than any other part of the roadmap, particularly for a corrected key. Its weakness is proportion: it hardens rare events (a platform emergency at 50,000 sittings) before any common event has been observed in a classroom.

**Findings:** PETE-07 (RD-4 closed 4.1 to a defect that reaches learners), PETE-12 (a key-correction notice is in-app only), PETE-26 (AI drafting sequencing).

**Cross-version dependency I want named.** C3w produces AI-drafted questions. The only quality signal for a question is Question Health, which fires only at 5% or 95% correct, counts the wrong thing and is never refreshed (PETE-09). AI-drafted items will therefore enter classrooms with no working quality feedback until 4.5.

### 4.2 · Operational maturity

**What it is.** Thirteen administrative items: Exam Mode, positions and acting appointments, two-school roles, export, past reports, single-person add, name correction, handover, corrections of several kinds, password change, scheduled Question Health.

**Assessment.** A list of things an administrator could not do in November, assembled before any administrator has tried. It contains real needs (export, past reports, handover) beside speculative ones (positions, acting appointments, future-dated role starts). It contains nothing for the teacher's daily loop. It has 12 open owner decisions.

**Findings:** PETE-04 (the small loop belongs here), PETE-09, PETE-11, PETE-12, PETE-23, PETE-24.

### 4.5 · UNDERSTAND

**What it is.** Question Intelligence, comparability, competency identity, the four-class evidence statement, Quiet Intelligence, formal educator evaluation and its protections, explainable history, WhatsApp sign-in, unusual-access checks.

**Assessment.** The intellectual design is careful and I would keep its order: measurement before interpretation. Two problems are structural.

- **It needs data volume the product's own rules prevent** (PETE-16).
- **It bundles a helpful thing with a high-stakes thing.** Quiet Intelligence helps teachers. Formal evaluation judges them. Shipping them in one release teaches teachers to distrust the first (PETE-18).

**Findings:** PETE-16, PETE-17, PETE-18.

### 5.0 · ACT & GROW

**What it is.** Recorded interventions, three strengths of claim, the Shared Growth Compact, governed journeys, institution-level improvement.

**Assessment.** The three-claim discipline is exactly right and rare. The delivery risk is that recording an intervention is extra work for a teacher with nothing given back for months, and that the comparison will usually be refused for lack of comparable evidence (PETE-19).

### Cross-version connections that are missing or weak

| Connection | State | Finding |
|---|---|---|
| Insight (4.0) → action → re-check | Missing until 5.0 | PETE-04 |
| AI-drafted item (4.1) → quality signal | Missing until 4.5 | PETE-09 |
| Item authored now → competency anchor (4.5) | Not captured; back-mapping cost grows with every item | PETE-17 |
| Real school data → 4.5 conclusions | Blocked by retention policy, the production upgrade and adoption | PETE-01, PETE-02 |
| Teacher controls a sitting (4.1) → teacher evaluated on results (4.5) | A conflict of interest nobody has named | PETE-18 |
| Export (4.2) → educator protections (4.5) | Already caught by the team (G-11) | — |
| Corrected result → derived figures | Already caught by the roadmap (H-01) | — |

---

## C · Human-journey matrix

Each row asks **and then what?** and **what else did that change?** "Works" means the code path exists; it does not mean a person has done it.

| # | Journey | What exists | Missing step or exception | Failure and recovery | Downstream consequence | Finding |
|---|---|---|---|---|---|---|
| 1 | First-time school administrator | Operator founds the school; bulk import in five steps; cards printed per class | The admin must tell each person to activate: PINTAR sends nothing. No count of "account made, not activated". No tour for admins. Only the platform admin sets the time zone | A bad row means fix the file and start again | Before any teacher can assign, the admin must set a pass mark per lesson | PETE-11, PETE-13 |
| 2 | First-time teacher | Activation by email code; a seven-step tour; a suggestion card on the home page | A teacher with no working email cannot activate. An empty class list offers no next step | "Email belum sampai" depends on the platform admin's send log | The first thing a new teacher needs is content, and there may be none | PETE-03, PETE-13 |
| 3 | First-time student | Card and PIN; a five-step trail; one next action | A forgotten PIN is "ask your teacher"; the card session lasts 60 minutes | Card reissue by the admin | — | — |
| 4 | Teacher preparing lessons and assessments | Excel workbook of five sheets, or the item workbench; review by a second person; publish by an admin | A teacher can draft but cannot review or publish. No autosave in the Studio; the five-minute lock reloads the page | A concurrent edit is refused with a conflict | A small school needs three people to publish one quiz | PETE-03, PETE-14 |
| 5 | Student completing assessments | Outbox, replay, refusal to finish until acknowledged | Hints are allowed in the certifying test. A typed address reaches the Uji Penguasaan without reading the lessons | A3 will add one writer and teacher-authorised recovery | The certificate's meaning depends on conditions it does not record | PETE-06, PETE-10 |
| 6 | Teacher interpreting results | One evidence page: understanding, gain, per section, misconceptions, bands | Three different thresholds on one number. Gain compares 4 questions with 8 different ones | Small classes see "Belum cukup data" | Leaders read the same gain at school level | PETE-08, PETE-15 |
| 7 | Teacher helping struggling students | A re-read request; a targeted Uji Cepat built by hand | No action starts from the weak section. The re-read pre-ticks every lesson. No re-check. No record of what was tried | — | **And then what? Nothing.** Whether it helped is never shown | PETE-04 |
| 8 | Student who did not reach the target | A list of weak sections with links | No retake button. A new attempt needs the teacher's request, a written reason and a second approver. The correct answer is never shown | The learner waits, with no notification either way | Mastery learning stops at the first failure | PETE-05 |
| 9 | School leader interpreting evidence | A decision queue; class-by-class figures; no rankings | Nothing over time. A leader with many classes triggers an unbounded number of calculations | — | Leaders may misread descriptive gain as effectiveness | PETE-08, PETE-21 |
| 10 | Educator evaluation and growth | Nothing formal. An anonymous student-feedback round about a named educator exists in code and appears in no roadmap | 4.5 and 5.0 are direction only | — | See the conflict of interest above | PETE-18 |
| 11 | Student transferring schools | Two-sided request; evidence stays with the old school | Consent is an empty object. Attempts do not carry. What the new teacher can see of earlier results is not established | An open sitting is terminated with no result | The new teacher starts with no history | PETE-22 |
| 12 | Teacher correcting a published assessment | Two-person key correction with a preview of every effect | Schools are told in-app only. A flawed question that is not a key error cannot be voided or accept two answers | Certificate goes to review | Well handled; the best journey in the product | PETE-12 |
| 13 | Recovering an interrupted workflow | Answers survive; A1 lets a teacher add time or end a sitting | Studio edits are lost on a lock. Lesson reading shows no "not saved" sign | A3 pending | — | PETE-14 |
| 14 | School with limited connectivity | Answers are safe offline | Lessons need a live connection. No service worker. A 747 KB string table is imported by about 50 client components. No measurement from Indonesia | — | The assessment is robust; the learning is not | PETE-14 |
| 15 | School using integrated AI | Designed with strong guardrails | Not built; no pricing; no quality feedback on what it produces | Feature removed if no provider permits educator-only use | — | PETE-26, PETE-09 |
| 16 | School using its own AI | A written guide with prompts; the workbook import | Copying one table per sheet into five sheets. The simpler paste route is undecided until after the walkthrough | Errors named by sheet and row; nothing saved until clean | — | PETE-26 |
| 17 | User leaving or closing an account | Adults close their own; deletion by the platform admin; an anonymised person is terminal | A learner has wording only ("through the school and family"); no school-side path exists. Retention is undecided | A deletion can be resurrected by a restore (Sharon's M-2) | — | PETE-02 |
| 18 | **Start of a new school year** (added) | Promotion class by class; teachers never carried over | The year is fixed at 1 July to 30 June with no semesters. What breaks if rollover is skipped is not recorded | A promotion run cannot be undone as a whole | Every role expires yearly | PETE-22 |
| 19 | **Teacher needs marks for the report card** (added) | Per-learner results; a printable class summary | No recap of marks per learner per term; no period selector | — | Teachers re-type results by hand | PETE-23 |
| 20 | **Approver's day** (added) | Queues on the admin and leader home pages | Everything is pull-based; nobody is told a request is waiting | — | Requests wait as long as the approver stays away | PETE-12 |
| 21 | **Something breaks in production** (added) | An error page with a reference code; "Laporkan masalah" | No error tracking; the admin is not told a report arrived; support people are unnamed | — | The team learns of failures when someone reports them | PETE-21 |

---

## D · Gap and risk register

**Type:** *Defect* (observed today), *Risk* (will hurt later), *Opportunity* (an improvement).
**Scope:** *In scope* (fits approved scope), *Changes a decision* (needs an approved decision revisited), *New scope* (the owner decides), *Stay deferred*.
**Severity** is my judgment of consequence for learners and educators.

### Tier 1 · Strategic

#### PETE-01 · No real educator or school has used PINTAR 4.x
- **Versions / users:** all / everyone. **Type:** Risk. **Severity:** Critical. **Scope:** New scope (sequencing).
- **Evidence (verified):** production holds 1 person and 0 sittings (`plan/.../stage2-production-counts-RESULT-2026-11-17.md`). The walkthrough record's findings are empty (`plan/coordination/walkthrough-gladys/EVIDENCE.md`). "Human acceptance: none recorded for any journey" (`plan/completion-4.0/A-CURRENT-STATE-2026-11-02.md`). The planning audit says the same (G-4).
- **Problem.** 284 migrations, 113 routes and a roadmap to 5.0 rest on the team's reading of what schools need. The one planned human check is a guided walkthrough on a demo school, which tests comprehension, not use.
- **Consequences.** Every later release compounds any wrong assumption. 4.2 would be planned before the first lesson is taught.
- **Recommendation.** Insert a **classroom pilot** between the walkthrough and 4.2 planning: two or three teachers, one real class each, one chapter, three to four weeks, on the 4.1 candidate. Plan 4.2 from what they do, ask and abandon.
- **Alternatives.** (a) Walkthrough only, as planned: cheaper, weaker evidence. (b) A pilot with consenting adults in professional learning first: avoids children's data while the legal gate is open, and still tests the cycle.
- **Complexity.** Low in engineering; it depends on PETE-02.
- **Verification.** Completed observer sheets; counts of sittings, re-read requests and problem reports; a findings list classed as the walkthrough's already is.
- **Placement.** After the walkthrough; before the rationalisation milestone closes and before the 4.2 plan.
- **Confidence.** High.

#### PETE-02 · The path to a real school has no plan
- **Versions / users:** 4.0 onward / schools, families. **Type:** Risk. **Severity:** Critical. **Scope:** New scope.
- **Evidence (verified):** the legal gate (data-protection law, electronic-system registration, parental consent, retention) is "blocked, external" (`plan/completion-4.0/C-OPEN-WORK-REGISTER-2026-11-02.md` W9.11). The application has no privacy notice, terms or consent screen. Transfer consent is sent as an empty object (`main/src/app/konfigurasi/actions.ts:83,132`). Retention (R-2) is open and "needed before production data". Support people are unnamed (W9.16). There is one production administrator and no named second.
- **Problem.** These are not features, so no release owns them. They gate everything.
- **Consequences.** Without them the pilot cannot involve children, and 4.5 has no evidence to work with.
- **Recommendation.** Name a **Production Readiness** milestone with its own owner-approved list: counsel's answers, R-2, a school data agreement, a privacy notice in the product, named support people, a second administrator, and the technical items in PETE-21. Run it in parallel with A3 and C3w; it needs different people.
- **Alternatives.** Fold it into 4.2 (delays the pilot by a release); treat each gate separately as now (nobody owns the whole).
- **Complexity.** Mostly non-engineering.
- **Verification.** The 4.0 release checklist read GO, not "77 of 84, NO-GO".
- **Placement.** Now, in parallel.
- **Confidence.** High. Sharon's D-R2 recommends part of this; I go further by asking for one owned milestone.

#### PETE-03 · A new school has nothing to teach with
- **Versions / users:** 4.0–4.1 / teachers. **Type:** Risk. **Severity:** High. **Scope:** New scope.
- **Evidence.** Verified: production holds 0 items and 0 courses. Authoring is a five-sheet workbook or the item workbench; a teacher holds `CAN_DRAFT` only, review needs a second person and publishing needs an admin (`mig/20270114100000…:86-113`). A lesson cannot be assigned until the admin sets its pass mark (`mig/20261102100000…:312-316`). Not evidenced: a production-ready library aligned to the national curriculum; the repository shows pilot and synthetic chapters.
- **Problem.** PINTAR's own philosophy says "knowledge is the centre". On day one there is none, and making some takes three people and a spreadsheet.
- **Consequences.** The teacher's first question is "Soalnya mana?" Adoption stalls before the cycle is ever seen.
- **Recommendation.** Three things, smallest first. (1) Decide what library a pilot school receives, and say so before the pilot. (2) Admit the questions-only import now. (3) Let a teacher run an Uji Cepat from their own handful of questions with a lighter path, since Uji Cepat cannot certify.
- **Alternatives.** Rely on AI drafting to fill the gap: it adds cost and still needs the three-person chain.
- **Complexity.** Low to medium; the library is content work.
- **Verification.** Time from a new teacher's first sign-in to a first assigned chapter, in the pilot.
- **Placement.** Before the pilot; (2) and (3) in 4.2.
- **Confidence.** Medium: the size of the library is not evidenced.

#### PETE-04 · The teaching loop stops at the insight
- **Versions / users:** 4.0–5.0 / teachers, learners. **Type:** Opportunity. **Severity:** High. **Scope:** New scope (a thin slice of 5.0's intent, with none of its claims).
- **Evidence (verified):** the evidence page shows weak sections and repeated misconceptions with no link or button on either (`main/src/app/mengajar/[kelas]/bukti/page.tsx:181-229`). The pointer sentence is the same whatever the figure (`main/src/app/_intel.ts:38-58`). The re-read form pre-ticks every lesson, not the weak ones (`ulang/page.tsx:137`), and states "tidak ada tes baru". No teacher note, action log or before-and-after view exists.
- **Problem.** PINTAR answers "which students need my attention?" and then leaves. The owner's own question, "and then what?", has no answer in the product until 5.0.
- **Consequences.** Teachers get more information and no more leverage. The reports become something to glance at.
- **Recommendation.** Build the **small loop** from parts that already exist:
  1. From a weak section, one button: "Minta membaca lagi bagian ini", with that section's lessons and the learners below target already ticked.
  2. When the re-reading is done, offer a short Uji Cepat on that section with its questions already ticked.
  3. Show the two results side by side as *recorded* figures, with the number of learners and a fixed line that this is not proof the re-reading caused the change.
  4. Keep the pair on the class's record.
- **Why this is not 5.0 early.** It makes no comparison across instruments, no claim of improvement and no cohort design. It records what the teacher did as a by-product of doing it. It also gives 5.0 its raw material.
- **Alternatives.** Wait for 5.0 (the loop stays open for three releases); add a free-text teacher note only (cheap, but nobody will fill it in).
- **Complexity.** Medium. Uji Cepat, re-read requests and per-objective results all exist.
- **Verification.** In the pilot, the share of weak-section views that lead to an action, and whether teachers return to see the second result.
- **Placement.** 4.2. I rank this above every item now on the 4.2 list.
- **Confidence.** High on the gap; medium on the exact design.

### Tier 2 · The educational model

#### PETE-05 · A learner who misses the target reaches a dead end
- **Versions / users:** 4.0–4.1 / learners, teachers. **Type:** Defect in the learning design. **Severity:** High. **Scope:** Changes a decision (O41-16, the second approver).
- **Evidence (verified):** two attempts by default (`mig/20261202100000…:539-546`). After the last, the learner reads "tanyakan kepada guru langkah berikutnya" and has no retake button (`hasil/page.tsx:131-152, 239-243`). Another attempt needs the teacher's request with a 10–300 character reason, per learner, then approval by someone who is never the teacher (`mig/20270114100000…:785-800`). No bulk request or approval exists. The correct option is never shown to the learner (`mig/20260913091500…:257-283`).
- **Problem.** Mastery learning depends on study-and-retry. The approval rule exists because the test can certify; it then governs every retry, including the many where no certificate is at stake.
- **Consequences.** In a class where ten learners miss the target, the teacher writes ten reasons and a head of department approves ten times. Most teachers will stop asking.
- **Recommendation.** Separate the two purposes. A retry after a completed re-read is a *learning* retry: the teacher alone may grant it, for several learners at once. Keep the second approver for anything that would newly earn a certificate after the default attempts. Show the correct answer once a learner has no attempts left or the assignment has closed.
- **Alternatives.** Raise the default to three attempts (simple, blunt); keep the rule and add bulk approval only (reduces clicks, keeps the wait).
- **Complexity.** Medium; it touches the attempt and certificate rules.
- **Verification.** Tests that a learning retry cannot produce a certificate without the second approval; pilot counts of requests made and granted.
- **Placement.** 4.2.
- **Confidence.** High.

#### PETE-06 · The certifying test's conditions are weaker than the certificate's claim
- **Versions / users:** 4.0 / learners, anyone reading a certificate. **Type:** Defect in validity. **Severity:** High. **Scope:** Changes a decision (the mode policy).
- **Evidence.** Verified: the certifying mode allows assistance (`mig/20260914093000…:51-56`, `POST_TEST … allows_assistance true … certifies true`). Sittings are untimed (`mig/20270120120000…:6-10`). Exclusion on retake covers only pre-test items, not earlier attempts (`mig/20270115110000…:1075-1098`). Inferred: on imported chapters the second attempt presents the same questions in a new order, because every marked question is drawn. The certificate says "Sertifikat Penguasaan" with a grade band (`main/src/lib/sertifikat-lembar.ts`).
- **Problem.** A learner may open hints, see the questions, re-read and sit the same questions again. The certificate does not say so.
- **Consequences.** The certificate is the one artefact that leaves the school. Its credibility protects every other figure.
- **Recommendation.** The owner decides what the certificate asserts. My recommendation: no assistance in a certifying sitting; require enough questions that a second attempt draws at least a partly different set, or say on the result that the set repeated; record the attempt number with the result.
- **Alternatives.** Keep the conditions and rename the certificate to a completion record; disclose conditions on the verification page.
- **Complexity.** Low for the policy row; medium for parallel forms, because it needs more questions per chapter.
- **Verification.** A test that a certifying sitting refuses assistance; a count of repeated questions between attempts.
- **Placement.** Before the pilot issues any certificate.
- **Confidence.** High on hints; medium on repetition until checked at runtime.

#### PETE-07 · Multi-answer questions are live and mishandled where learners see it
- **Versions / users:** 4.0–4.1 / learners, teachers. **Type:** Defect. **Severity:** High. **Scope:** Changes a decision (RD-4's closure of 4.1).
- **Evidence (verified):** multi-answer questions can be authored and answered (`main/src/lib/unggah-kontrak.ts:42`; `ItemPlayer.tsx:547`). Scoring is correct. But the learner's review joins the chosen option by a single label (`mig/20260913091500…:278-282`), and a multi-answer response is an array, so the learner sees no "your answer" and no rationale. The same join feeds the reading map's remediation text, the misconception counts and the item statistics (`mig/20270117100000…:185-321`).
- **Problem.** The roadmap files this under Question Health and assigns it to early 4.5, with 4.1 closed to it. That framing misses that learners and teachers are affected now, outside Question Health.
- **Consequences.** A learner who misses a multi-answer question is told nothing about it. A misconception carried by such a question never appears to the teacher.
- **Recommendation.** Before any school uses 4.1, either fix the join in the four readers or switch off multi-answer authoring until 4.5. The second is a one-line policy and fully reversible.
- **Alternatives.** Leave as is and document the limitation: I do not recommend this.
- **Complexity.** Low for switching off; medium for the fix.
- **Verification.** A sitting with one multi-answer question: review shows the chosen options and rationale; the misconception is counted.
- **Placement.** 4.1, at Z.
- **Confidence.** High. This reproduces the team's own static finding and extends its reach; a runtime check should confirm it.

#### PETE-08 · "Kenaikan" compares four questions with eight different ones
- **Versions / users:** 4.0 / teachers, leaders. **Type:** Risk of misreading. **Severity:** Medium. **Scope:** In scope (wording), then 4.5.
- **Evidence (verified):** gain is the later result minus the earlier one, on disjoint questions of different length; the package set is 4 before and 8 after (`mig/20261228100000…:3-4`; `mig/20270111100000…:917-1019`). It is shown per class and per school. The screen warns that gain is not attainment, but says nothing about the instruments.
- **Problem.** With four questions each is worth 25 points, so one lucky guess moves a learner by a quarter. The pre-test is low-stakes; the post-test follows teaching and may be retaken. A positive gain is close to guaranteed.
- **Consequences.** A leader reads "+35" as teaching effectiveness. That reading will be invited to carry weight in 4.5.
- **Recommendation.** Now: show the question counts beside the figure and add one sentence on what gain cannot show. Withhold the school-level figure until 4.5's comparability work. In 4.5: treat gain as a claim that needs comparable instruments, like any other.
- **Alternatives.** Lengthen the Pemetaan Awal (costs class time).
- **Complexity.** Low.
- **Verification.** Daisy's copy review; a pilot check that teachers can say what the number means.
- **Placement.** 4.2 for wording; 4.5 for the rule.
- **Confidence.** High.

#### PETE-09 · Nobody who writes or uses a question can see how it performs
- **Versions / users:** 4.0–4.5 / teachers, authors. **Type:** Defect and opportunity. **Severity:** Medium. **Scope:** In scope (4.2's Question Health item), reshaped.
- **Evidence (verified):** the only signal fires when correctness is at most 5% or at least 95%, on 30 response rows that include every changed answer (`mig/20260918170000…:27-138`; `mig/20260928100000…:109-125`). Nothing calls the refresh. Teachers do not hold the right to see it. The item fields for empirical difficulty are never written.
- **Problem.** The 4.2 item schedules a refresh of a figure that is wrong. The team knows this (D-12). The larger gap is that the teacher, who is the person best placed to spot a bad question, is not in the audience at all.
- **Recommendation.** Do not schedule the current figure. In 4.2, give the teacher a plain per-question table on their own class: how many answered, how many chose each option, final answers only, no signal and no threshold. That is *recorded* evidence and needs no statistics. Leave discrimination and reliability to 4.5.
- **Alternatives.** Fix and schedule the existing signal (still invisible to teachers).
- **Complexity.** Low to medium; a per-question class view already exists (`/mengajar/[kelas]/soal`).
- **Verification.** Counts match final answers on a known set.
- **Placement.** 4.2.
- **Confidence.** High.

#### PETE-10 · The Pemetaan Awal costs class time and changes nothing the learner does
- **Versions / users:** 4.0 / learners. **Type:** Opportunity. **Severity:** Medium. **Scope:** In scope; it restores the original specification.
- **Evidence (verified):** the reading map is personal and well built, but its cards link to no lesson or page (`PetaBacaan.tsx:28-40`), lessons always come in fixed order, and every lesson must be read before the test is offered, including sections marked strong. That gate is on the screen only; a typed address skips it (`penguasaan/page.tsx:50-54`). Dr Gladys's specification gave each card a button to the chapter reference and a direct route to the test.
- **Problem.** A diagnostic that does not alter the path is a second test. It also produces the gain figure of PETE-08.
- **Recommendation.** Link each card to its lessons; order "continue" by the map's priority; let the school choose whether sections marked strong are optional. Make the screen and the server agree on the reading rule, whichever way it is decided.
- **Complexity.** Low to medium.
- **Alternatives.** Leave the map as information only and drop the reading gate from the screen (simpler, loses the steer).
- **Verification.** A learner with one weak section is taken there first; the screen and the server give the same answer to a typed address.
- **Placement.** 4.2.
- **Confidence.** High.

### Tier 3 · Experience and workflow

#### PETE-11 · Set-up is repeated and gated where a default would do
- **Versions / users:** 4.0–4.1 / teachers, admins. **Type:** Opportunity. **Severity:** Medium. **Scope:** In scope.
- **Evidence (verified):** assignment is one class at a time (`siapkan/page.tsx:248`). No lesson can be assigned until the admin sets its pass mark, and the teacher is told only that it "belum bisa disediakan" (`hle.ts:7623`). Uji Cepat starts with no question ticked. Extra attempts are requested one learner at a time.
- **Recommendation.** A school-wide default pass mark that applies until overridden; assign to several classes in one form; Uji Cepat offers a suggested set; requests and approvals in bulk. See section E for the automation class of each.
- **Complexity.** Low each.
- **Alternatives.** Keep the per-lesson pass mark and only improve the message to the teacher (cheaper, keeps the block).
- **Verification.** Count the forms a teacher submits to assign one chapter to three classes, before and after.
- **Placement.** 4.2.
- **Confidence.** High.

#### PETE-12 · PINTAR never tells anyone anything
- **Versions / users:** all / approvers, teachers, admins. **Type:** Risk. **Severity:** Medium. **Scope:** New scope (small).
- **Evidence (verified):** the only email is for identity and security. Every queue is seen only by opening its page. A problem report raises no alert for the admin. A key correction is announced in-app only, and its email was left unbuilt (`konfigurasi/page.tsx:660-680`).
- **Problem.** PINTAR adds second approvers by design, then relies on them to visit.
- **Recommendation.** One daily digest email to people with something waiting, listing counts and one link. No content about learners in the email. Decide separately whether WhatsApp, planned for sign-in in 4.5, should carry notices.
- **Alternatives.** An in-app bell (does not help someone who is not in the app).
- **Complexity.** Low; the mail path and the "waiting" queries exist.
- **Verification.** A request left waiting appears in the next day's digest; the email holds no learner name or result.
- **Placement.** 4.2.
- **Confidence.** High.

#### PETE-13 · Activation depends on email and gives the admin no view of who is stuck
- **Versions / users:** 4.0 / staff, admins. **Type:** Risk. **Severity:** Medium. **Scope:** In scope.
- **Evidence (verified):** staff activate only by email (`FormAktivasi.tsx`); no path exists for a teacher without a working address. PINTAR sends nothing when an account is made. The admin has a count of people without accounts, but no count or filter for accounts made and not activated.
- **Recommendation.** An activation status list with a filter and a printable slip per person. Ask in the pilot whether any staff lack usable email before building a card route for staff.
- **Alternatives.** A card-and-PIN route for staff (needs a security review).
- **Complexity.** Low.
- **Verification.** The admin can list every person with an account who has not finished activation.
- **Placement.** Before the pilot for the list; the rest on evidence.
- **Confidence.** Medium: how many teachers lack email is not evidenced.

#### PETE-14 · The assessment survives a bad connection; the learning does not
- **Versions / users:** 4.0–4.1 / learners, teachers. **Type:** Risk. **Severity:** Medium. **Scope:** In scope (the rationalisation milestone) and New scope (lesson caching).
- **Evidence.** Verified: no service worker or page caching; lesson progress has no "not saved" indicator; the Studio has no autosave and a five-minute lock reloads the page; the 747 KB string table is imported by about 50 client components; no measurement from Indonesia exists, and the one load test measured 1.8 s per answer from a runner in the United States. Not evidenced: real bundle size.
- **Recommendation.** Measure first, from Indonesia, on a low-cost Android phone and on a school lab's shared line. Then: split the string table by surface; cache the assigned chapter's lessons; autosave Studio drafts locally.
- **Alternatives.** Accept the current behaviour and tell pilot schools that lessons need a steady connection.
- **Complexity.** Low for measurement; medium for caching.
- **Verification.** Answer-save and page-load times at the 95th percentile, measured in Indonesia on the chosen phone; a lesson opens with the connection off.
- **Placement.** Measurement before the pilot; changes in the rationalisation milestone.
- **Confidence.** Medium until measured.

#### PETE-15 · Three thresholds and about 35 terms
- **Versions / users:** 4.0 / teachers. **Type:** Opportunity. **Severity:** Medium. **Scope:** In scope.
- **Evidence (verified):** a teacher meets roughly 35 product terms. One figure is judged against the school's target, PINTAR's fixed bands at 60 and 80, and a 60% amber line; Daisy has already recorded that 64% reads as below target on one page and developing on another. The safety-critical item is "soal wajib" to staff and "soal penting" to learners. "Sediakan" means two different acts.
- **Recommendation.** One verdict per number: on teacher screens, judge against the school's target only, and drop the fixed bands or move them behind a detail. One name per thing. Decide these before the handbook is resumed, since the handbook will otherwise teach the confusion.
- **Alternatives.** Keep the bands and explain them better (adds words to an already wordy page).
- **Complexity.** Low; mostly copy.
- **Verification.** Five teachers each say, unprompted, whether 64% is good or not, and agree.
- **Placement.** Before the walkthrough if possible; otherwise 4.2.
- **Confidence.** High.

### Tier 4 · The later roadmap

#### PETE-16 · 4.5 will starve for evidence under its own rules
- **Versions / users:** 4.5 / teachers, authors. **Type:** Risk. **Severity:** High. **Scope:** Changes a decision (the scope of the no-cross-school rule).
- **Evidence.** Verified: item statistics need 30; class figures need 5; school figures need 10 and are withheld if any cell is short (`mig/20270111100000…:566-581`). Cross-school comparison is excluded. Inferred: a school with one or two classes per grade produces 30 to 60 final answers per question per year, enough for difficulty and not for discrimination or reliability.
- **Problem.** The rule against comparing schools is right. Read broadly, it also forbids pooling answers to the *same library question* across schools, which is the only way a question's quality can be known.
- **Recommendation.** The owner rules that pooled, de-identified statistics **about a library question** are not a comparison of schools, provided no figure is ever shown per school and a minimum number of schools contribute. This serves the question, not the ranking.
- **Alternatives.** Keep the broad reading and accept "Belum cukup data" as the normal state of 4.5; lower the thresholds (I advise against this).
- **Complexity.** Medium; it needs Sharon's design for the boundary and a line in the school data agreement.
- **Verification.** A test that no pooled figure can be filtered to one school.
- **Placement.** Decide at 4.5 planning; write the agreement clause now (PETE-02).
- **Confidence.** Medium.

#### PETE-17 · Capture the curriculum reference now, before the back-mapping grows
- **Versions / users:** 4.1–4.5 / authors. **Type:** Opportunity. **Severity:** Medium. **Scope:** New scope (one optional field).
- **Evidence (verified):** questions link to school-written objective codes; no national anchor exists; the anchor decision (R-5) waits for 4.5.
- **Problem.** Every chapter authored before R-5 must later be mapped by hand, by someone other than its author.
- **Recommendation.** Add an optional curriculum-reference field to the objective in the workbook and the workbench now. It commits to no competency model and is used by nothing until 4.5.
- **Complexity.** Low.
- **Alternatives.** Wait for R-5 and map afterwards.
- **Verification.** The field survives import, revision and export, and nothing reads it.
- **Placement.** 4.2, or with C3w if cheap.
- **Confidence.** Medium: it assumes the anchor will be a national reference, which R-5 has not decided.

#### PETE-18 · Formal educator evaluation is the roadmap's highest-risk item
- **Versions / users:** 4.5 / teachers, leaders. **Type:** Risk. **Severity:** High. **Scope:** Changes a decision (RD-5's placement).
- **Evidence.** Verified: the lifecycle is carefully protected on paper. Verified: a teacher controls the sittings whose results would become evidence (add time, end as "not counted", request attempts; hints are allowed). Verified: an anonymous student-feedback round about a named educator already exists in code and is in no roadmap. Not evidenced: any school asking for evaluation inside PINTAR.
- **Problem.** Once results inform a teacher's evaluation, the teacher's control over those results is a conflict of interest, and every helpful insight becomes something to manage. No protection in the design removes that incentive.
- **Consequences.** Teachers stop trusting Quiet Intelligence in the same release that introduces it.
- **Recommendation.** Split 4.5. Ship measurement, the evidence classes, Quiet Intelligence and the protections first. Move formal evaluation to a later release, opened only when a pilot school asks for it and R-1 is written with that school. Rule on the existing feedback round now: keep it, hide it or remove it.
- **Alternatives.** Keep it in 4.5 but last, behind its own approval; exclude learner results from evaluation evidence altogether.
- **Complexity.** A planning change.
- **Verification.** At 4.5 planning: a written statement of which records can enter an evaluation, and a test that a teacher-ended or teacher-extended sitting is marked as such in that evidence.
- **Placement.** 4.5 planning.
- **Confidence.** Medium; this is a judgment about incentives, supported by the code facts above.

#### PETE-19 · 5.0 will be accurate and mostly empty
- **Versions / users:** 5.0 / teachers. **Type:** Risk. **Severity:** Medium. **Scope:** In scope (a design principle for the 5.0 plan).
- **Evidence (inferred):** recording an intervention is a separate act; the comparison needs comparable instruments and enough learners; both are scarce.
- **Recommendation.** Make the record a by-product. An intervention is something the teacher *did in PINTAR*: a targeted re-read, a targeted quiz, a re-opened attempt. PETE-04 creates those records two releases early.
- **Alternatives.** Keep a separate "record an intervention" form (complete, rarely used).
- **Complexity.** Low; a design rule.
- **Verification.** In the 5.0 journeys, an intervention record exists without the teacher filling in a separate form.
- **Placement.** 5.0 planning.
- **Confidence.** Medium.

### Tier 5 · Technical and operational

#### PETE-20 · The current text of a database function cannot be read anywhere
- **Versions / users:** all / engineers. **Type:** Risk. **Severity:** Medium. **Scope:** In scope (rationalisation).
- **Evidence (verified):** 1,215 function definitions for about 820 names; `start_learning_session` has seven full definitions and at least three text patches; roughly 19 to 25 migrations rewrite live functions by string replacement on `pg_get_functiondef` (for example `mig/20270119160000…:105-112`).
- **Problem.** Almost all business logic lives in these functions. To know what one does, a reader must replay the migrations.
- **Recommendation.** At each release, commit a generated snapshot of every function's current text, checked in CI against a fresh build. Stop patching by string replacement for new work. After production is upgraded, cut a new baseline.
- **Complexity.** Low for the snapshot; medium for the baseline.
- **Alternatives.** Squash all migrations now (risky before the production upgrade); or leave as is.
- **Verification.** CI fails when the committed snapshot differs from a freshly built database.
- **Placement.** The rationalisation milestone, as sequenced by ruling 54.
- **Confidence.** High.

#### PETE-21 · Production would fail quietly
- **Versions / users:** all / operators, schools. **Type:** Risk. **Severity:** High. **Scope:** In scope (production gates).
- **Evidence (verified):** no error tracking or health endpoint; the production watch, off-site backup and restore drill are each "off by default"; a failed scheduled job only raises a database warning; both databases are on the smallest tier, where the one load test failed with the connection pool exhausted (`main/docs/completion-4.0/A-CURRENT-STATE-2026-11-02.md:82-84`); recovery point is 24 hours with point-in-time recovery off; a restore of stored files has not been verified. The leader's page makes at least four calculations per class with no cap (`main/src/lib/pimpinan.ts:455-469`).
- **Recommendation.** Before the first school: error tracking; the three watches switched on and seen to fire; a tier that passes the load test; one measured restore including files; a cap or a stored summary for the leader's page.
- **Alternatives.** Go to the first school on the current set-up and rely on problem reports.
- **Complexity.** Low to medium.
- **Verification.** Each watch is made to fail once on purpose and is seen to raise its alarm; the load test passes on the chosen tier; one restore is timed end to end.
- **Placement.** The Production Readiness milestone (PETE-02).
- **Confidence.** High on what is absent; whether the three switches are on is not visible to me.

#### PETE-22 · The school calendar and the edges of a school year
- **Versions / users:** 4.0–4.2 / admins, teachers. **Type:** Risk. **Severity:** Medium. **Scope:** In scope and New scope.
- **Evidence.** Verified: the year is fixed at 1 July to 30 June with no semesters; a promotion run cannot be undone as a whole; every role expires yearly; a transfer sends an empty consent object and attempts do not carry. Not evidenced: what happens when rollover is skipped; what a receiving teacher sees of earlier results.
- **Recommendation.** Establish the two unknowns by test before the pilot crosses a year boundary. Bring "editable year dates and semesters" forward from "later than 4.2": Indonesian schools report by semester.
- **Alternatives.** Leave the calendar fixed and document it for pilot schools.
- **Complexity.** Low for the tests; medium for semesters.
- **Verification.** A test school crosses 1 July without a rollover and the result is written down; a transferred learner's new teacher is shown what they can and cannot see.
- **Placement.** Tests now; semesters decided at 4.2 planning.
- **Confidence.** Medium.

#### PETE-23 · Teachers will ask for marks for the report card
- **Versions / users:** 4.0–4.2 / teachers. **Type:** Opportunity. **Severity:** Medium. **Scope:** New scope.
- **Evidence.** Verified: there is no recap of results per learner across chapters for a period, and no period selector. Inferred: a teacher who uses PINTAR for a term will need those figures for the school's report card and will otherwise copy them by hand.
- **Recommendation.** A printable and downloadable class recap: learners down, chapters across, the result in force in each cell, for a chosen period. Recorded figures only; no average PINTAR invents.
- **Alternatives.** Leave it to the 4.2 school export (an admin's tool, not a teacher's).
- **Complexity.** Low to medium.
- **Verification.** The recap's figures equal the results in force for a known class and period.
- **Placement.** 4.2, confirmed by the pilot.
- **Confidence.** Medium: the demand is inferred.

#### PETE-24 · 4.2 is planned for administrators nobody has met
- **Versions / users:** 4.2 / admins. **Type:** Risk. **Severity:** Medium. **Scope:** Changes a decision (the 4.2 list).
- **Evidence (verified):** 13 items, 9 awaiting a decision; job positions, acting appointments and future-dated starts were already called "employment administration, not the educational experience" in the 10 November assessment.
- **Recommendation.** Keep export, past reports, adding one person, name correction, the handover view, classes without a teacher, declining a request and password change. Hold positions, acting appointments, future-dated starts, two-school roles, professional-learning corrections and Exam Mode until a pilot school needs them. Fill the space with PETE-04, 05, 09, 10, 11, 12 and 23.
- **Alternatives.** Keep the list and add the teacher items (a much larger 4.2).
- **Complexity.** A planning change.
- **Verification.** Each 4.2 item cites a pilot observation or an owner ruling.
- **Placement.** 4.2 planning.
- **Confidence.** Medium.

#### PETE-25 · The tests look inward
- **Versions / users:** all / engineers, users. **Type:** Risk. **Severity:** Medium. **Scope:** In scope.
- **Evidence (verified):** of 1,243 checks, 638 inspect the repository, 500 run in the database and 105 call the application over HTTP. No browser test runs in CI; browser walks run on demand. No screen-reader pass has ever been done. Every merge, promotion and spend waits on one person.
- **Recommendation.** Put five browser journeys in CI (sign in with a card, sit a test offline and back, assign a chapter, read the evidence page, request an attempt). Name a second production administrator. Do one screen-reader pass before the walkthrough.
- **Alternatives.** Keep browser walks on demand only.
- **Complexity.** Low to medium.
- **Verification.** A deliberately broken button on the assignment form fails CI.
- **Placement.** Before Z where cheap; otherwise rationalisation.
- **Confidence.** High.

#### PETE-26 · AI drafting is well governed and badly timed
- **Versions / users:** 4.1 / teachers. **Type:** Risk. **Severity:** Low to medium. **Scope:** In scope and Changes a decision (deciding the paste route after the walkthrough).
- **Evidence (verified):** the integrated add-on is the last 4.1 batch and gates Z's third journey; it has no pricing and no user. The free route asks a teacher to copy one table into each of five sheets.
- **Recommendation.** Do not let C3w-2 hold Z if the provider evaluation slips: Z's third journey can run on the local stand-in. Decide the simpler paste route now; the friction is visible without a walkthrough.
- **Alternatives.** Hold Z for C3w-2 as planned.
- **Complexity.** Low.
- **Verification.** Z's third journey passes on the local stand-in; the paste route is ruled on.
- **Placement.** 4.1.
- **Confidence.** Medium.

#### PETE-27 · "The current result" has more than one meaning
- **Versions / users:** 4.0–4.1 / learners, teachers. **Type:** Risk. **Severity:** Low. **Scope:** In scope.
- **Evidence (verified):** reports use the latest sitting, so "a lower later score is the current score" (`mig/20270111100000…:556-559`). After an ordinary recalculation the learner keeps the sealed original while the teacher reads the result in force; after a governed correction both read the corrected one (`mig/20270115110000…:38-40`).
- **Recommendation.** Write the rule once, in Daisy's vocabulary page, and test that a learner and their teacher never see different figures for the same sitting without a visible marker.
- **Alternatives.** Leave each reader's rule as it is and document the difference.
- **Complexity.** Low.
- **Verification.** For one sitting with a recalculated result, the learner's page and the teacher's page are compared.
- **Placement.** Z.
- **Confidence.** Medium; I did not trace every reader.

---

## E · UX and workflow simplification

### Where the software asks the teacher to understand it

1. **A lesson "cannot be given yet"** because someone else has not set a number (PETE-11).
2. **One figure, three judgments** (PETE-15).
3. **A failed learner needs two adults** (PETE-05).
4. **An insight with nowhere to go** (PETE-04).
5. **A diagnostic that does not steer** (PETE-10).
6. **Being sent back to the chooser with no reason given:** the four explanatory sentences are empty placeholders (`main/src/lib/istilah-menunggu.ts:73-90`).
7. **Empty states that end the journey:** 1 of 77 empty states offers a next step (`main/src/components/Kosong.tsx`).

The last two are small and in scope. They break the product's own rule that every screen offers the next useful action.

### Automation candidates

| Candidate | Class | Why |
|---|---|---|
| Apply a school default pass mark to a new lesson | **Safe** | The admin set the default; an override remains |
| Pre-tick the weak section's lessons and the learners below target in a re-read | **Safe** | A suggestion the teacher sees and can change |
| Suggest a set of questions for Uji Cepat | **Safe** | Uji Cepat cannot certify |
| Assign one release to several of the teacher's classes | **Safe** | Same act, same authority |
| Daily digest of what is waiting | **Safe** | Counts only |
| Remind people who have an account and have not activated | **Safe** | No learner data |
| Offer a learning retry when a re-read is complete | **Conditional** | Only if it cannot certify without the second approval (PETE-05) |
| Close and score an abandoned sitting | **Conditional** | Already built, with rules |
| Bulk approval of extra attempts | **Human decision** | The approver still decides; only the clicks are grouped |
| Skip lessons the map marks strong | **Human decision** | A school policy, then the teacher |
| Any change to a result, certificate or published key | **Human decision, always** | Keep as designed |

None of these is Contextual Intelligence. Each uses information the teacher has just looked at, on the screen where they looked at it.

### What to remove from the teacher's view

- The fixed readiness bands, wherever the school's target is shown.
- The second name for each thing listed in PETE-15.
- The separate "Langkah berikutnya" page of fixed cards, once actions sit on the evidence page itself.

---

## F · Independent strategic ideas

Five proposals. Each solves a problem evidenced above.

| # | Idea | Problem it solves | Benefit | Cost and risk | Roadmap fit |
|---|---|---|---|---|---|
| 1 | **The small loop** (PETE-04) | Insight without action | The first thing in PINTAR that helps a teacher teach, not only know | Medium; risk of over-reading the before-and-after pair, handled by fixed wording | 4.2 |
| 2 | **A classroom pilot before 4.2 is planned** (PETE-01) | No user evidence | Every later decision gets cheaper and better | Low in engineering; needs the readiness milestone | After the walkthrough |
| 3 | **Learning retries, separate from certifying attempts** (PETE-05) | The dead end after failing | Mastery learning actually works | Medium; must not weaken the certificate | 4.2 |
| 4 | **Pooled statistics for library questions** (PETE-16) | 4.5's evidence starvation | Question quality becomes knowable in small schools | Medium; needs a clear boundary and consent in the school agreement | 4.5, decided earlier |
| 5 | **Split 4.5: understanding first, evaluation later and on request** (PETE-18) | Trust | Teachers meet Quiet Intelligence as help | A planning change | 4.5 |

One smaller idea deserves a line. **The teacher's class table per question** (PETE-09) is recorded evidence that needs no statistics, and it is what teachers will use most.

---

## G · Technical and architectural assessment

**The architecture suits the responsibility.** Putting rules in the database, behind one set of permission helpers and append-only evidence tables, is a defensible choice for a system whose job is trustworthy records. I would not rewrite it.

| Area | Finding | Evidence | Verdict |
|---|---|---|---|
| Evidence lineage | Append-only answers; one result in force; chain cannot fork | `mig/20260912140823…:62-187` | Keep |
| Permissions | One vocabulary of helpers used by policies and functions; a registry that classes every client-callable function, and already caught a real leak | `mig/20260912004431…`; `mig/20260913140000…:22-45` | Keep; the registry sweep (G-8) is worth finishing |
| Concurrency | Row and advisory locks; idempotent answers; server-side deadlines; a per-learner start lock added after a two-connection test | `mig/20270112120000…` | Keep |
| Corrections | One transaction, a preview of effects, certificates reviewed, not rewritten | `mig/20270115110000…` | Keep |
| Background work | Two scheduled jobs, declared once; a failure only warns | `mig/20270116110000…`; `mig/20270119150000…:98-123` | Add a failure record and an alert |
| Maintainability | Functions patched as text; no readable current source | PETE-20 | Fix in rationalisation |
| Reports | Computed on read; unbounded fan-out for leaders | PETE-21 | Cap, or store a summary |
| Observability | None in production | PETE-21 | Fix before any school |
| Recovery | One staging restore of the database; files unverified; 24-hour recovery point | `main/docs/recovery/JOURNEY-LOG.md:480-488` | Measure before any school |
| Testing | Strong in the database, absent in the browser in CI | PETE-25 | Add five journeys |
| Client weight | A 747 KB string table shared by client components; 265 KB of global CSS | `main/src/lib/hle.ts`; `experience.css` | Measure, then split |
| AI gateway | 67 lines; no provider call exists anywhere | `main/src/ai-gateway/` | Nothing to assess yet |

**I found no evidence of a design error in the core.** The weaknesses are operational and at the edges. I respect the sequencing of ruling 54: none of the above should start before 4.1 is accepted, except the production-gate items, which are not rationalisation.

**One caution on the rationalisation milestone.** It is time-boxed in the roadmap and unmeasured in the record. Its baseline should be taken from Indonesia on real devices, or it will optimise the wrong path.

---

## H · Roadmap recommendations

**Preserve**
- The evidence core, the result chain and governed correction.
- Minimum sample rules, withholding, and the absence of rankings.
- Human authority over AI, and no learner-facing AI.
- The order of 4.5: measurement, then interpretation.
- The three strengths of claim in 5.0.
- Ruling 54's sequencing of the rationalisation milestone.

**Improve**
- The certifying test's conditions (PETE-06).
- Gain's wording now and its rule later (PETE-08).
- The reading map, so it steers (PETE-10).
- One verdict per figure (PETE-15).

**Add**
- A Production Readiness milestone (PETE-02, PETE-21).
- A classroom pilot (PETE-01).
- The small loop, learning retries, the per-question class table, the digest and the marks recap, all in 4.2.
- An optional curriculum reference on objectives (PETE-17).

**Remove or switch off**
- Multi-answer authoring until its readers are fixed (PETE-07).
- The scheduled refresh of the current Question Health figure (PETE-09).
- The fixed bands from teacher screens (PETE-15).

**Combine**
- Re-read, targeted quiz and the before-and-after pair into one flow (PETE-04).
- The legal, retention, support and operational gates into one owned milestone.

**Defer**
- Positions, acting appointments, future-dated starts, two-school roles, professional-learning corrections and Exam Mode, until a pilot school needs them.
- Formal educator evaluation, until a school asks and R-1 is written with it.
- WhatsApp sign-in, until the audience decision; consider it for notices first.

**Stay deferred, as the roadmap has them**
- Parent portal, outward sharing, the composer, question weighting, theming, Contextual Intelligence.

---

## I · The ten most consequential findings

Ranked by educational value, benefit to users, risk reduced and practicality.

| Rank | Finding | Why it ranks here |
|---|---|---|
| 1 | **PETE-01** No real user has touched 4.x | Everything else is a hypothesis until this changes |
| 2 | **PETE-04** The loop stops at the insight | The largest gain in real value for the least new machinery |
| 3 | **PETE-02** No plan for the path to a school | It gates the pilot, production and 4.5's evidence |
| 4 | **PETE-05** The dead end after failing | It defeats the mastery model the product is named for |
| 5 | **PETE-06** The certifying test allows hints | The certificate's credibility protects every other figure |
| 6 | **PETE-07** Multi-answer questions mishandled | A live defect, cheap to contain |
| 7 | **PETE-03** Nothing to teach with on day one | Adoption fails before the cycle is seen |
| 8 | **PETE-16** 4.5 starves under its own rules | Decides whether a whole release is useful |
| 9 | **PETE-18** Formal evaluation's incentives | The roadmap's largest risk to teacher trust |
| 10 | **PETE-21** Production would fail quietly | Cheap to fix before a school, costly after |

---

## J · Owner decision register

Only decisions that need the owner's judgment.

| ID | Decision | Alternatives | Trade-off | My recommendation |
|---|---|---|---|---|
| OD-P1 | Hold a classroom pilot before 4.2 is planned? | (a) Yes, with children after the legal gate. (b) Yes, first with adults in professional learning. (c) Walkthrough only | (a) is the best evidence and the slowest. (b) starts soonest. (c) keeps the schedule and the uncertainty | **(b), then (a)** |
| OD-P2 | Create one Production Readiness milestone with a named owner? | One milestone; or separate gates as now | One list makes the critical path visible; it also makes its length visible | **One milestone, now** |
| OD-P3 | What does a PINTAR certificate assert? | (a) Mastery under test conditions: no hints, varied questions. (b) Completion to a target, conditions disclosed. (c) As now | (a) needs more questions per chapter. (b) is honest and weaker. (c) is the easiest and the least defensible | **(a)** |
| OD-P4 | May a teacher alone grant a retry that cannot certify? | (a) Yes, in bulk, after a re-read. (b) Keep two people; add bulk. (c) As now | (a) changes O41-16 for one case. (b) keeps the wait | **(a)** |
| OD-P5 | Multi-answer questions before any school uses 4.1 | (a) Switch off authoring. (b) Fix the four readers in 4.1. (c) Leave to 4.5 | (a) is a day. (b) reopens RD-4's closure. (c) ships a known defect to learners | **(a) now; fix in 4.5** |
| OD-P6 | Put the small loop in 4.2? | (a) Yes, ahead of the administrative items. (b) Wait for 5.0 | (a) brings forward a slice of 5.0's intent without its claims | **(a)** |
| OD-P7 | Reshape 4.2 around a teacher's term? | (a) Hold the speculative administrative items. (b) Keep the list | (a) leaves some administrators waiting for things none has yet asked for | **(a)** |
| OD-P8 | Does "no cross-school comparison" forbid pooling answers about one library question? | (a) Pooling allowed, never shown per school. (b) Forbidden | (a) needs a clause in the school agreement. (b) leaves 4.5 mostly empty in small schools | **(a)** |
| OD-P9 | Where does formal educator evaluation sit? | (a) Out of 4.5, opened on a school's request. (b) Last in 4.5, separately approved. (c) As planned | (a) changes RD-5's placement. (c) risks trust in Quiet Intelligence | **(a)** |
| OD-P10 | The existing anonymous feedback round about a named educator | (a) Keep and put it on the roadmap with protections. (b) Hide until 4.5's protections exist. (c) Remove | It is evaluation-adjacent and unlisted | **(b)** |
| OD-P11 | Semesters | (a) Bring forward to 4.2. (b) Leave "later than 4.2" | Schools report by semester | **(a)**, confirmed by the pilot |

**Recommendations that need no owner decision** (within approved scope): PETE-08 wording, PETE-09's table, PETE-10's links, PETE-11, PETE-13's list, PETE-15, PETE-20, PETE-21, PETE-25, PETE-27, and the two small items in section E.

---

## Devil's advocate

### The strongest case against PINTAR as designed

1. **It is a records system that calls itself a learning system.** The care has gone into what happens to an answer after it is given. Almost none has gone into what a teacher does on Tuesday.
2. **It is over-built for zero users.** Fifty thousand sittings were stress-tested for an emergency stop before fifty learners sat one test.
3. **It asks a great deal of a school.** Three people to publish a quiz. Two to reopen a test. An administrator to set a number before a teacher may teach. A spreadsheet of five sheets.
4. **Its intelligence releases need data its own ethics deny it.** Small samples, no pooling, no comparisons.
5. **It will measure teachers with instruments teachers control.**
6. **It is maintained by one person's approvals** and a body of logic that cannot be read in one place.
7. **It solves problems Indonesian schools may not rank first.** Marks for the report card, content for the current curriculum and a working phone experience are absent, while explainable history and a growth compact are planned.

### Which of these hold

| Criticism | Verdict |
|---|---|
| 1 Records, not learning | **Largely justified.** PETE-04, 05 and 10 answer it, and cheaply |
| 2 Over-built | **Partly.** The integrity work is not waste; it is the product's reason to be trusted. The sequence was wrong: hardening preceded use |
| 3 Too demanding | **Justified** for a small school. The two-person rules are right where a certificate or a published key is at stake and too broad elsewhere |
| 4 Starved of data | **Justified**, and fixable by one ruling (PETE-16) |
| 5 Conflict of interest | **Justified** as a risk; avoidable by sequencing (PETE-18) |
| 6 One approver, unreadable logic | **Partly.** The approvals protect the owner; the logic is a real cost (PETE-20) |
| 7 Wrong problems first | **Not evidenced either way.** That is the point of PETE-01 |

### What should not change

- Append-only evidence and the result chain.
- The governed key correction, exactly as built.
- "Belum cukup data" as a normal, unembarrassed outcome.
- No rankings of learners, teachers or schools.
- AI drafts, educators decide; no AI in front of a learner.
- The plain voice of the copy: "Belum cukup bukan berarti buruk — artinya belum."
- The answer outbox.

---

## Section 13 · The explicit questions

**What is PINTAR trying to accomplish that its design may not fully support?**
It wants evidence to improve teaching. Its design guarantees the evidence and stops before the teaching. The product's own philosophy promises "Evidence → Improvement"; the code delivers evidence and a sentence pointing at another page.

**What have we designed correctly but made unnecessarily complicated?**
- The second approver: right for certificates, applied to every retry.
- The pass mark: right that the school sets it, wrong that its absence blocks a teacher.
- Honest thresholds: right to show them, wrong to show three.
- Content review: right for the library, heavy for one teacher's quick quiz.

**What have we overlooked through familiarity?**
- That nobody outside the team has used it.
- That a diagnostic which changes nothing is a second test.
- That the certifying test allows hints.
- That the school year has two semesters.
- That an approver has to be told.
- That the first thing a teacher needs is something to teach.

**Which five improvements would make the greatest real difference?**
1. The small loop from a weak section to a targeted re-read, a short check and a side-by-side result.
2. Learning retries a teacher can grant alone and in bulk, with the correct answer shown at the end.
3. A reading map that takes the learner to what they need first.
4. Content on day one, and a light path for a teacher's own quick quiz.
5. A recap of marks for the term, and a daily note of what is waiting.

**Which attractive ideas should we deliberately reject?**
- Automated recommendations of what to teach. The fixed pointer sentences are honest; a generated one would not be.
- Lowering the minimum sample sizes to make 4.5 look fuller.
- A teacher dashboard that users assemble.
- Comparing schools, in any form shown to a school.
- Using student results as automatic input to a teacher's evaluation.
- A parent portal before consent and retention are settled.
- More modes of assessment before one mode has been used in a classroom.

**What would I do differently, designing from the educator's side?**
I would start from a teacher's week and build outward. Monday: something to teach, already there. Wednesday: a five-minute check. Thursday: who is stuck, on what, and one button that does something about it. Friday: did it help. End of term: the marks. Every administrative and intelligence feature would have to earn its place by making one of those five moments easier. Much of 4.0 and 4.1 would survive unchanged, because those moments need trustworthy evidence. The order of work would be different, and so would 4.2.

**If 5.0 shipped exactly as planned, what would schools discover six months later?**
- **Most intervention comparisons read "belum dapat disimpulkan".** The claims are honest and the screens are empty, because classes are small and instruments are rarely comparable.
- **Few interventions are recorded at all.** Recording is separate work with a delayed return, so teachers do it in the first week and then stop.
- **The Growth Compact is signed and unused.** It governs evidence that does not accumulate.
- **Teachers have learned to manage their numbers.** If formal evaluation arrived in 4.5, the sittings they control now look better than the learning.
- **The questions teachers actually ask are still unanswered:** where are the questions for this week's topic, can this learner try again, and what do I put on the report card.
- **Leaders are reading gain as effectiveness,** because it is the one number that always goes up.
- **The team is still the only group that knows how the database works.**

Each of these can be anticipated now, and most can be prevented in 4.2.

---

## Consolidation aids

| Finding | Type | Scope | Confidence |
|---|---|---|---|
| PETE-01 | Risk | New scope | High |
| PETE-02 | Risk | New scope | High |
| PETE-03 | Risk | New scope | Medium |
| PETE-04 | Opportunity | New scope | High |
| PETE-05 | Defect (design) | Changes a decision | High |
| PETE-06 | Defect (validity) | Changes a decision | High / Medium |
| PETE-07 | Defect | Changes a decision | High |
| PETE-08 | Risk | In scope | High |
| PETE-09 | Defect / Opportunity | In scope | High |
| PETE-10 | Opportunity | In scope | High |
| PETE-11 | Opportunity | In scope | High |
| PETE-12 | Risk | New scope | High |
| PETE-13 | Risk | In scope | Medium |
| PETE-14 | Risk | In scope / New scope | Medium |
| PETE-15 | Opportunity | In scope | High |
| PETE-16 | Risk | Changes a decision | Medium |
| PETE-17 | Opportunity | New scope | Medium |
| PETE-18 | Risk | Changes a decision | Medium |
| PETE-19 | Risk | In scope | Medium |
| PETE-20 | Risk | In scope | High |
| PETE-21 | Risk | In scope | High |
| PETE-22 | Risk | In scope / New scope | Medium |
| PETE-23 | Opportunity | New scope | Medium |
| PETE-24 | Risk | Changes a decision | Medium |
| PETE-25 | Risk | In scope | High |
| PETE-26 | Risk | In scope / Changes a decision | Medium |
| PETE-27 | Risk | In scope | Medium |

**Where I may differ from the team's own audit.** The planning audit concludes that "the gaps are decisions and evidence, not design errors". I agree for the architecture. I disagree for the product: the open loop (PETE-04), the dead end (PETE-05) and the certifying conditions (PETE-06) are design gaps, and they sit in releases already called complete.

**Limits of this review.** No screen was seen rendered. No test was run. Demand claims (PETE-13, PETE-23, the semester point) are inferences about Indonesian schools, not observations; the pilot is how to replace them with facts.

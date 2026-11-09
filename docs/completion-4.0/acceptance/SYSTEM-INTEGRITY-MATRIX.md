# System Integrity Gate · matrix and completion register (opened 9 Nov 2026)

**Authority.** The owner's System Integrity directive («System Integrity Gate After Reporting»: P0–P2, chains A–E,
defect-class expansion, one inspectable matrix) and the 9 Nov assignment to start it while the Reporting Quality Gate
waits only on the human NVDA/TalkBack sessions.

**Gate status: OPEN.** Started 9 Nov. No module is GREEN yet: a module is GREEN only when its required scenarios pass
and its material cross-module defects are resolved, and the final integrated candidate has passed the clean-database
suite, exact-SHA CI, the journeys and the regression checks. **Existing green CI is not counted as proof of this gate.**

**Where the work lives.** The isolated branch is `claude/system-integrity-4.0`, made from `claude/awesome-rubin-bqxp6p`
at `83310bb3`. The Reporting Quality Gate's code candidate stays **`abce834d`**, untouched; nothing on this branch is
merged into it.

**Boundaries kept.** No new feature, no 4.1 work, no change to approved reporting behaviour, no merge, no deployment,
and no invitation to Dr Gladys.

---

## 1 · How this gate tests

1. **Static sweep of a defect class, across every component that shares the assumption** (the directive's
   «defect-class expansion»). Done in the database's own catalogue (`pg_proc`, `pg_policies`), so a function cannot be
   missed because it is in an older migration.
2. **A live multi-role probe.** Each person of the local report world (`audit/fixtures/laporan-lokal.mjs`) signs in and
   calls the product's own functions and tables directly, with no screen in between. Each answer is compared with the
   role contract (`audit/integritas-peran.mjs`).
3. **A confirmed defect** is corrected at its source and gets a database test, shown red without the fix and green with
   it, before anything else moves.
4. **Reuse.** The automated journeys (`audit/journey.mjs`, S1–S27v, L3, P1–P3) already walk chains A–E end to end.
   They are cited, not repeated, unless a correction touches them.

## 2 · Inventory (9 Nov)

| Class | What | Evidence |
|---|---|---|
| **Proven, not repeated** | Founding → school admin → structure → intake → class card → Guru → Studio 7 steps → Terbit → assign → pre/post → result → report → certificate → revocation → Pindah → rollover → Uji Cepat → Bank → audit → role revocation | journeys on `5919a370` (42442892785) and `abce834d` (234); CI 528 |
| **Proven, not repeated** | Reporting internals: the effective result, disclosure, recalculation, the denominators | `REPORTING-ACCEPTANCE-MATRIX.md` §13; F36-*, D78-* |
| **Proven, not repeated** | Classless learner recovery; the Studio home count (W1.16); the live content-check refusal | `aa4b1365`: F34-P01, F34-H01, `siap-jalan` R8–R10 |
| **Implemented, not sufficiently verified** | The dossiers' named gaps: platform admin on Aktivasi's card offer and in Studio; a staff role in one school with a card in another; Storage `profile/<id>`; the Uji Cepat result readers; «Yang menunggu» against the Aktivasi total | `batch-1/3/4 INTEGRATION-DOSSIER.md` |
| **Partial (words, not function)** | X12 «kursus/paket»; C3/C9; X2/X4 PD words; X7 | waits on Dr Gladys's terminology and Daisy (H §4) |
| **Blocked (person or owner)** | NVDA/TalkBack sessions; human journeys H1–H20; W6.2/W6.8 from Indonesia; the staging pass; a third-party penetration test | `SCREEN-READER-SETUP.md`; `HUMAN-ACCEPTANCE-JOURNEYS.md`; `W62-W68-REGIONAL.md` |

## 3 · The matrix

Verdicts:
- **OPEN**: not yet run in this gate.
- **PASS (scenario)**: the scenario ran and held; the module is not GREEN until its other scenarios and the final
  candidate pass.
- **DEFECT**: found and corrected, with the correction and its test named.

### P0-1 · Assessment, scoring, recalculation, repeated attempts, pass marks, mastery

| # | Scenario and roles | Expected | Actual | Evidence | Defect · severity | Correction · test | Verdict |
|---|---|---|---|---|---|---|---|
| A1 | Every database reader of `assessment_results` / `official_results`, after a recalculation (defect class «recomputed evidence counted twice») | each reads the result nothing supersedes, or the sealed root where O-B3 says so | 28 functions read results. 22 select by supersession; `certificate_eligibility` reads the sealed root (O-B3); `kesiapan_kelas_per_mapel` counts distinct learners (a recalculation cannot add one); `management_learner_detail` reads through `calc_learner_result`; the `assert_*` functions are guards that compute nothing | `pg_proc` sweep, 9 Nov | none | — | PASS (scenario) |
| A2 | The app reading results outside the database's functions | none | the app reads results only through RPCs (`grep src`); no direct table read | source sweep | none | — | PASS (scenario) |
| A3 | Pass marks: a later change of the school's mark must not rewrite an earlier sitting (defect class «current state for historical») | only the sealing step reads the current mark | `school_pass_mark_current` is read only by `seal_assignment_pass_mark` and the mark's own read/write functions; eligibility and outcomes use the mark sealed on the sitting (`assessment_sessions.pass_mark`) | `pg_proc` sweep | none | — | PASS (scenario) |
| A4 | One root result per sitting; one successor per result | enforced by the database | `assessment_results_one_root_per_session`, `results_one_successor`; `certificates_one_root_per_session` | `pg_indexes` | none | — | PASS (scenario) |
| A5 | Repeated attempts (80% then 60%), recalculation through `recompute_result` | the later sitting is current; the certificate and learner page keep the sealed result | as expected | F36-E01, F36-D14, F36-L01 (Reporting gate) | — | — | reused |

### P0-2 · Studio, review, approval, release, publication

| # | Scenario | Expected | Actual | Evidence | Defect | Correction | Verdict |
|---|---|---|---|---|---|---|---|
| S1 | Taught content changed after learners sat it | refused; a correction is a new version | `enforce_taught_content_immutable` on courses, modules, lessons, items, item_options, assessment_definitions; `enforce_release_freeze` on releases. Changing a key needed the trigger switched off (the recalculation fixture) | `pg_trigger`, 9 Nov | none | — | PASS (scenario) |
| S2 | Upload → validation → review → approval → release → publication → learner availability, with the content-check refusal | as built | walked | journeys S14–S19, S17t, S26f; `siap-jalan` R9 | — | — | reused |
| S3 | The platform administrator in Studio (`studio_home`, `nama_riwayat_paket`, the Bank) | only their own places | not run | — | — | — | **OPEN** |

### P0-3 · Identity, roles, organizational scope, authorization (chain D)

| # | Scenario and roles | Expected | Actual | Evidence | Defect · severity | Correction · test | Verdict |
|---|---|---|---|---|---|---|---|
| D1 | Definer functions executable by `authenticated` with no visible guard (the class «UI-only authorization») | each guards inside or through a shared helper | 36 had no guard by name; on inspection each calls a guard helper (`structure_node`, `import_job_for_admin`, `package_batch`, `can_in_institution`, `reads_school_settings`, `launch_quick_assessment`), returns only the caller's own rows, or is a constant | `pg_proc` sweep | none | — | PASS (scenario) |
| D2 | 7 people (learner, another learner, Guru 5B/5C, Kepala departemen Matematika, Kepala departemen IPA, Dekan, Admin sekolah) × 19 calls: reports, lists, direct table reads, 5 mutations attempted by the refused | the role contract | before: **3 FAIL** (2 were the probe counting a learner's own rows, corrected). **The real one: the IPA Kepala departemen read 48 answers of Kelas 5D's Matematika sittings from `responses`**, while results gave her nothing. Every mutation by a refused person was refused (P0001/42501) | `audit/integritas-peran.mjs`, 9 Nov | **SI-D01 · High** (privacy: per-learner evidence readable across departments within a school; staff only, no tenant crossing) | `20270112100000_an_answer_is_read_where_it_was_given.sql`: R6's axis applied to `responses`, `presented_items`, `integrity_signals`, `lesson_progress`. **F37-D01**: red on the old policies, green with the fix. Probe after: 134 calls, **0 FAIL** | **DEFECT corrected** (Sharon to review) |
| D3 | `session_status_transitions` readable by any signed-in person | not per-person data | it holds only the allowed status changes (from, to, note) | columns | none | — | PASS |
| D4 | `assessment_sessions` rows (status, timestamps, termination reason; no answer, no mark) are readable school-wide by `CAN_ASSIGN_LEARNING` and `CAN_REVIEW_INTEGRITY` | — | as designed in 20260912133821; the teacher's pages read it through row security | policy | **observation**, not changed | **for Sharon:** whether the session row should follow R6's axis too (it needs the app's readers changed) | OPEN (review) |
| D5 | The Admin sekolah reads answers (`CAN_REVIEW_INTEGRITY` at the root) though R6 withholds results from them | — | unchanged on purpose | role catalogue | **policy question** | **Owner, 9 Nov: not decided yet.** Sharon to establish whether the administrator's real responsibilities justify it. Owner's provisional preference: least privilege, with a clearly defined exception for legitimate investigations, not blanket access because of the role | OPEN (Sharon, then owner) |
| D6 | Role revocation, then the revoked person's next act | refused at the database | refused | journey S24 | — | — | reused |
| D7 | Dossier gaps: (a) a staff role in school A and a card in school B (owner, 9 Nov: «verify carefully»); (b) Storage `profile/<id>` read by another person; (c) the platform admin on Aktivasi's card offer | no card; refused | (b) no Storage policy grants a client role anything (INV-15, guarded in 20260912004550); the read route signs a URL only when `person_visible_to_me` (the persons row policy) allows it. (a) **F37-D02**: a person school 2 recorded and offered a card loses the offer once they hold a staff role in school 1. (c) not run | source; F37-D02 | none | — | (a) PASS; (b) PASS; (c) **OPEN** |

### P0-4 · Enrollment, placement, promotion, transfer, historical evidence (chain B)

| # | Scenario | Expected | Actual | Evidence | Defect | Correction | Verdict |
|---|---|---|---|---|---|---|---|
| B1 | A result after Pindah or rollover is read by the class the learner sat in (history), not the class they are in now | the result follows the sitting's `class_node_id` | `assessment_result_readable` → `can_on_node` on the session's class | policy | none | — | PASS (scenario) |
| B2 | Intake → placement → Pindah → rollover → the learner's certificate after a new year | as built | walked; the after-rollover certificate defect was fixed earlier (`7ea62753`) | journeys S9, S20, S25, S26c, S26d2, S27, S27v | — | — | reused |
| B3 | «Yang menunggu»'s Aktivasi count against the Aktivasi list for the same reader | equal | the same predicate in both (`menunggu_akun_boleh` is exactly the count's rule); **F37-B01**: equal for the school's admin and the platform admin, one school and every school | source; F37-B01 | none | — | PASS (scenario) |

### P0-5 · Certificates, issuance, revocation, verification

| # | Scenario | Expected | Actual | Evidence | Defect | Correction | Verdict |
|---|---|---|---|---|---|---|---|
| C1 | Eligibility after a recalculation, both directions (owner, 9 Nov: «verify carefully») | the sealed result decides (O-B3): 40% recalculated to 95% stays not eligible; 90% recalculated to 30% stays eligible | `certificate_eligibility` reads the root result and the mark sealed on the attempt; INV-20 through `official_sessions` | function source; F36-D14; **F37-C01** (clean seed: a sitting sealed under the mark and recalculated to 100% stays not eligible; one sealed over it and recalculated to 0% stays eligible) | none | — | PASS (scenario) |
| C2 | Revocation and the public check | the learner's list and the public check say revoked | walked | journeys S27v, P1 | — | — | reused |
| C3 | A refused person revoking a certificate | refused | refused for every non-admin person (P0001) | `integritas-peran` M04 | none | — | PASS |

### P1 (6–10) and P2 (11)

| Module | State |
|---|---|
| 6 · Teaching and learning journeys, interruptions, Uji Cepat | reused: journeys S21–S21i, S26d, S26e, S27h. **OPEN in this gate:** the Uji Cepat result page's readers at the database (dossier gap) |
| 7 · Question Bank, answer keys, rules, question integrity | reused: S23q; S1 above for keys. **OPEN:** key correction through a new version re-read by every consumer |
| 8 · School configuration downstream | reused: S7, S26, Konfigurasi links (E-B1-1). **OPEN:** a structure change against reports and lists |
| 9 · Audit trails and integrity signals | reused: S23i, S23r, S23j. SI-D01 narrowed `integrity_signals`. **OPEN:** every audited act has its row |
| 10 · Printing, exports | reused: the A4 walks. **OPEN:** print against the screen's figures per report |
| 11 · Navigation, accessibility, mobile, feedback, Daisy grammar | reused: E1+E2, the walks at 1280/390/320, axe. **Blocked:** the human screen-reader sessions |

## 4 · Defects found

| Id | Module | Defect | Severity | Correction | Regression | State |
|---|---|---|---|---|---|---|
| SI-D01 *(owner, 9 Nov: accepted as a necessary 4.0 correction; stays on the isolated branch until the full verification and Sharon's review; **not closed** until Sharon has assessed the completed authorization changes)* | P0-3 (chain D) | Answers, questions shown, integrity observations and lesson progress were readable by a capability held anywhere in the school, while the results scored from them follow the sitting's class (R6). A head of a sibling department read another department's answers; a Guru of another class read lesson progress | High (within-school privacy) | `20270112100000` (`16de2ec7`) | F37-D01 (red → green); `audit/integritas-peran.mjs` 0 FAIL | corrected; Sharon's review requested |

## 4d · SI-D03: a former school's account-level power (9 Nov)

**The finding.** It was found by the account-lifecycle inventory (`ACCOUNT-LIFECYCLE-INVENTORY.md`).
`recovery_assist_school` lets a school's admin reset the recovery of anyone holding its permanent registration
number. That reset ends every session and forces a new PIN.

**Red: F37-S01 at `6070cd60`.** School X's admin resets a learner who transferred to Y, and one who withdrew.

**The fix waits on two things:**
- Sharon's independent review (`REVIEW-REQUEST-SHARON-SI-D03.md`);
- the owner's safeguard: legitimate pending-onboarding assistance is kept.

`authorize_card_reissue` shares the rule; its red case is to be written.

## 4b · Sharon's review of SI-D01 (on `16de2ec7`, 9 Nov) and the owner's rulings

| # | Sharon's finding | Severity | Owner (9 Nov) | Correction (`20270112110000`) | Failing case → regression | Legitimate readers kept |
|---|---|---|---|---|---|---|
| 1 | `evidence_class_overrides` school-wide for reading **and inserting**; trigger the same: the IPA head could take a Matematika 5D sitting out of official evidence | High (write) | fix now | both policies and `enforce_evidence_override` on CAN_REVIEW_INTEGRITY over the sitting's place; **a sitting with neither a Kelas nor an Angkatan is reclassified over the school's root** (only the Admin sekolah and the platform; never a department's head; found by F02-T17, whose official sitting has no place); reading stays fail-closed; PD sittings the platform's | **F37-D03**: on `4f2d2c1b`'s rules B's head's insert returned OK; now 42501 | A's head and the Admin sekolah still reclassify (tried and undone in the test) |
| 2 | `lesson_progress` «or was» gave a former teacher what the learner read afterwards anywhere | Medium | fix | a learning assignment of that release on a node the reader holds, which the learner is or was in | **F37-D04**: A's Guru read chapter 2 (assigned to B); now not | A's Guru keeps chapter 1; B's Guru reads chapter 2; the learner both |
| 3 | A sitting with an Angkatan and no class could never be reviewed | Low–Medium | fix | every rule anchors on `coalesce(class_node_id, cohort_node_id)`; fail closed when neither | **F37-D05**: A's head read 0 observations and could not refer; now 1 and may refer | A's head and the Admin sekolah |
| 3b | *(found by F37-D05)* `integrity_signals_awaiting_review` lists every observation in the school to any holder of the capability, beyond what the table now gives | **question for Sharon** | — | **not changed**: narrowing it broke F21-I01, the list's approved contract (FD-7, DG-32: another department's head *sees* what waits, with no referral offered). Only `may_refer` moves to the sitting's place. Whether the list should show no more than the table now gives is put to Sharon | F37-D05: B's head sees it listed and may not refer | A's head and the Admin sekolah list and may refer it |
| 4 | The probe's «allowed» passed on an empty answer; T01, R01–R04, R09 expectations wrong | Medium (test correctness) | fix | `audit/integritas-peran.mjs`: allowed passes only on rows > 0 where the world holds rows, else NOT EXERCISED; audiences restated (R01/R04 the Guru only; R02/R03 none; T01 no Admin (R6); T03/T04 no Admin (D5); R09 includes the IPA head's own queue); T07 sittings and M06 reclassification added | to run on a rebuilt report world | — |
| item 1 | `assessment_sessions` school-wide (who sat what, when, ended, extensions) | Privacy | narrow after tests | CAN_REVIEW_INTEGRITY or CAN_ASSIGN_LEARNING over the place; the learner's own and the PD branch kept | **F37-D01**: B's head and B's Guru read the sitting row; now 0 | the class's Guru, A's head, the Admin sekolah (F37-D01); the teacher's pages read their own class's sittings (journeys to confirm) |
| D5 | The Admin sekolah reads every answer through integrity review | Policy | **APPROVED: least privilege** | answers and questions shown need CAN_REVIEW_INTEGRITY **and** CAN_VIEW_LEARNER_RESULT over the place (the Admin holds the first only, R6); `jawaban_untuk_pemeriksaan`: one sitting, a reason, only while an observation on it is undecided, an `integrity.answers_opened` audit row per open, refusals write nothing | **F37-D01** (the Admin read 1 answer and 1 question; now 0) and **F37-D06** | the Admin keeps observations, sittings, reclassification and the investigation path; A's head keeps answers |

All of F37 (D01–D06, B01, D02, C01) is red on `4f2d2c1b`'s rules where it tests a correction and green on `20270112110000`
(local, 9 Nov). **SI-D01 stays open** until the whole suite, CI and the journeys pass on the head carrying it and Sharon
has reviewed the completed changes.

## 4b-2 · Sharon's re-review of `53ab41fe` (9 Nov) and the owner's direction: dispositions

| Finding | Severity | Correction (`20270112130000`) | Regression | State |
|---|---|---|---|---|
| A: `record_integrity_review`, `terminate_session`, `extend_session_deadline` decided school-wide | High | each over the sitting's place (`boleh_atas_sesi`); PD sittings keep their rule for ending/extending (to Sharon), PD observations stay the platform's | **F37-D07** (B's head and B's Guru refused on all three; A's head succeeds); **F06-P22 restated** (outside the department a NO_CONCERN decision is now refused too, no review row) | corrected |
| B: referral offered over the Angkatan, refused by `refer_integrity_signal` | Medium | the function anchors on the place | F37-D05 (A's head's referral of the Angkatan-only sitting is accepted) | corrected |
| C: `sesi_tempat`/`sesi_tempat_koreksi` answered any signed-in caller | Low | boolean predicates of the caller (`boleh_atas_sesi`, `boleh_koreksi_sesi`); the place helpers withdrawn from `authenticated` | the migration's verification block | corrected |
| Waiting list (owner, 9 Nov: «aggregate counts for other departments; individual case details and actions limited to authorized scopes»; Sharon: per department) | — | `integrity_signals_awaiting_review` lists only the reader's scope; `integrity_signals_waiting_elsewhere` gives a count per school and department (no sitting, category, time or person); Studio · Integritas shows the count line | **F21-I01 restated** (FD-7/DG-32's presentation replaced, note in the test); F37-D05 | corrected; Daisy to review the count's presentation |
| Membership timing for lesson progress | Low | a membership that ended before the assignment was made does not carry it | policy (F37-D04 unchanged) | corrected |
| D5 audit linkage | Low | `integrity.answers_opened` records the qualifying observation ids | F37-D06 | corrected; PostgREST `db-tx-end` rollback override: to confirm |
| BOB43-D01 floor | Low | — | to replace the 12-set floor by the exact expected-empty (reader, table) sets | **open** |
| Probe M07–M09 and both answer-opening cases | — | — | `audit/integritas-peran.mjs` | **open** (needs a rebuilt report world) |

## 4c · SI-D02: an attempt limit under concurrent starts (9 Nov)

| | |
|---|---|
| Defect | `may_start_assessment` counted a learner's sittings against `attempt_limit`, then `start_learning_session` inserted, with no lock: two concurrent starts both passed (found by the D-125 investigation, red case 4; confirmed by Sharon's code reading) |
| Proof (owner: «do not assume the race is proven until the test demonstrates it») | deterministic two-connection test: attempt limit 1, no sitting yet; A started and held its transaction; **B's start completed in 0.07 s** while A held: both commits would leave two attempts. Both rolled back |
| Severity | High (educational integrity: an attempt limit on an Uji Penguasaan or Pemetaan Awal can be exceeded by a double tap or two devices) |
| Correction | `20270112120000_one_start_at_a_time.sql`: `pg_advisory_xact_lock` per (learner, assignment) at the top of `start_learning_session`, before the count; the function otherwise unchanged |
| Regression | **F37-R01** (`runAttemptLimitRace`): red on the function as it was («the second start completed while the first was held»), green with the fix (B waits on the lock while A holds). Also shown with A committing: B waits, then is refused `ATTEMPT_LIMIT_REACHED`; one sitting against a limit of one |
| Verdict | corrected; to be reviewed by Sharon with SI-D01's remaining findings |

## 5 · Run record (System Integrity branch)

| Head | Change | Clean suite (local) | CI | Journeys |
|---|---|---|---|---|
| `16de2ec7` | SI-D01 | **908 passed, 3 failed** (clean database, local). All three were SI-D01's own: F01-S01 (the migration had no terminal verification block); BOB43-D01 (the PD migration's equivalence guard encoded the old school-wide rule as its reference, and reported exactly the readers SI-D01 removes: another Bagian's head and the PD Bagian's head reading academic answers); F37-D01 (its fixture assumed the template's definition had a release) | 529 (superseded) | 236 (superseded); 235 cancelled (dispatched with a short SHA, refused by design) |
| `4f2d2c1b` | the three fixed: a verification block; **BOB43-D01 restated to the approved rule** (owner, 9 Nov, SI-D01 accepted), the session row's own condition kept and the membership join mirrored; F37's own chapter; F37-B01, F37-D02, F37-C01 added | targeted: 26 passed, 0 failed. **Whole suite: 911 passed, 3 failed**: F37-B01 and F37-D02 (the fixture found nobody waiting in a second school once the full suite had run) and C12-D01 (caused by F37: its block did not roll back, so its sittings stayed and C12's template choice took one). Corrected in the next head: F37 now ends in `f37-rollback` like fable36 | 530 running | 237 running |
| `3f279361` | SI-D01 completed after Sharon's review and D5 (§4b); F37 one rolled-back block | **906 passed, 12 failed**: F02-T17 (an official sitting with no place could no longer be reclassified by the school's admin), F06-S01 (the waiting list re-created without its revoke), F06-N02 (the investigation's refusal did not name its capability), F21-I01 (the list's narrowing broke its approved contract), F37 ×8 (the fixture needed someone waiting in a second school) | CI 530 on `4f2d2c1b`: **913 passed, 2 failed**, F37-B01 and F37-D02 (the same fixture) | 237 running on `4f2d2c1b` |
| `53ab41fe` | the five fixed: root fallback for reclassification only; revoke/grant; the capability named; the list's contract kept (3b to Sharon); F37 records its own waiting person | targeted: 97 passed, 0 failed. **Whole suite: 909 passed, 9 failed**: R-PROSES-01 (D-197 not yet reconciled in the hand-off list) and F37 ×8 (at F37's moment in a full run no school has reserved a namespace yet; the schools that have one are made by later suites) | 531 dispatched | after 237 |
| `c9eb8974` | D-197 reconciled; F37 reserves its own school's namespace (rolled back) | R-PROSES-01 and F37 ×8 green alone | CI 531 had run on `53ab41fe`: **910 passed, 9 failed**, the same nine as that row's local suite, all fixed in this head. It says nothing about later heads | 237 on `4f2d2c1b`: **passed** (historical, not the candidate) |
| `57235a5a` | Sharon's re-review (§4b-2): the three cross-class writes, referral, helpers; other departments see counts; F37-D07 | **Whole suite: 919 passed, 1 failed**: BOB32-K02. `record_integrity_review` closed with `end $function$;`, which the test's body reader does not recognise, so it charged `terminate_session`'s refusals to it. Corrected in the next head by the repository's usual `end;` / `$function$;` form; the functions are unchanged. BOB32-K02, F01-S01 and F06-S01 are green alone | dispatched | dispatched |
| next | BOB32-K02's terminator | the whole suite on the head | to dispatch | to dispatch |

## 6 · Execution order from here

1. Sharon's review of SI-D01, D4 and D5.
2. P0 OPEN rows: S3, D7, B3. Each is a database test, run red-first where it could fail.
3. P1 OPEN rows, then P2.
4. The final integrated candidate: clean suite, exact-SHA CI and journeys; Daisy only where a change is user-facing
   (none so far).

## 7 · What remains before Dr Gladys's walkthrough

Owner, 9 Nov: separate the engineering defects from the evidence that needs people, equipment or authorization, so
that the engineering work is not held up by the evidence.

| Kind | Items | Who unblocks it |
|---|---|---|
| **Engineering (this gate resolves it)** | the OPEN rows of §3; Sharon's findings on SI-D01; the final candidate's runs | Second Eye |
| **A person's evidence** | NVDA/TalkBack sessions; human journeys H1–H20 (by a person, recorded) | a tester; the owner's or an evaluator's session |
| **Equipment** | W6.2/W6.8 timing from Indonesia | an Indonesian runner (owner) |
| **Authorization** | the staging promotion and the signed-in staging pass; any merge | the owner |
| **Outside party** | a third-party penetration test (outside the suite; not an approved 4.0 deliverable unless the owner makes it one) | the owner |
| **Dr Gladys** | terminology X12, C3, C9 | Dr Gladys |


- **Reporting Quality Gate:** the human NVDA and TalkBack sessions (S5, S6, S9 on `abce834d`), then the owner's
  closing decision.
- **System Integrity Gate:** the OPEN rows above, Sharon's review, and the final candidate's runs, then the owner's
  decision.
- **Owner's earlier conditions:** the staging promotion and the signed-in pass (authorization needed); the regional
  W6.2/W6.8 figures (an Indonesian runner).
- **Dr Gladys's own items:** terminology (X12, C3, C9). These are hers to settle in or before the walkthrough; they are
  not engineering gaps.

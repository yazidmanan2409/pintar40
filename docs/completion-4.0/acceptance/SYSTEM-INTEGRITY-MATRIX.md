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
| SI-D01 *(owner, 9 Nov: accepted as a necessary 4.0 correction; stays on the isolated branch until the full verification and Sharon's review)* | P0-3 (chain D) | Answers, questions shown, integrity observations and lesson progress were readable by a capability held anywhere in the school, while the results scored from them follow the sitting's class (R6). A head of a sibling department read another department's answers; a Guru of another class read lesson progress | High (within-school privacy) | `20270112100000` (`16de2ec7`) | F37-D01 (red → green); `audit/integritas-peran.mjs` 0 FAIL | corrected; Sharon's review requested |

## 5 · Run record (System Integrity branch)

| Head | Change | Clean suite (local) | CI | Journeys |
|---|---|---|---|---|
| `16de2ec7` | SI-D01 | **908 passed, 3 failed** (clean database, local). All three were SI-D01's own: F01-S01 (the migration had no terminal verification block); BOB43-D01 (the PD migration's equivalence guard encoded the old school-wide rule as its reference, and reported exactly the readers SI-D01 removes: another Bagian's head and the PD Bagian's head reading academic answers); F37-D01 (its fixture assumed the template's definition had a release) | 529 (superseded) | 236 (superseded); 235 cancelled (dispatched with a short SHA, refused by design) |
| next | the three fixed: a verification block; **BOB43-D01 restated to the approved rule** (owner, 9 Nov, SI-D01 accepted), the session row's own condition kept and the membership join mirrored; F37's own chapter; F37-B01, F37-D02, F37-C01 added | targeted on the clean database: F01-S01, BOB43-D01, F37-D01, F37-B01, F37-D02, F37-C01: **26 passed, 0 failed**; the whole suite again on the head | to dispatch | to dispatch |

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

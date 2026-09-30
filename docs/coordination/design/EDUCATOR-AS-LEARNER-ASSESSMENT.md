# Educator as learner: architecture and implementation assessment

**Status:** READ-ONLY assessment, 30 Sep 2026. **§6 RULED the same day (D-069).** Ticket set proposed for approval in `EDUCATOR-AS-LEARNER-TICKETS.md`. Nothing has been implemented. Bob, Daisy and Lana stay paused until Gate 2E.

**Question:** what is the smallest safe PINTAR 4.0 change that demonstrates this journey: an existing Guru → enrolled in professional learning → reads the Bab 1 lessons → Bab 1 assessment → result → Bab 2 → assessment → completion?

**Principle (Yazid):** *A Guru remains a Guru.* One identity and no duplicate person. Learning comes through enrolment and context.

**Evidence base:** application code at `main` `daa5721` (identical in `src`, `supabase` and `selftest` to this branch). Three read-only code traces (identity and journey; metric isolation, visibility and certificates; content and copy), plus the coordinator's own reading of each claim this document depends on. File references are `path:line`. M = `supabase/migrations/`, S = `src/`, T = `selftest/`.

> **Correction to my first answer (30 Sep, "is it ready in 4.0?").**
>
> 1. **Scores.** I said teachers' results «would count as students'» in school-wide figures. For a course correctly labelled professional development, that was **wrong**. WP6A (M/20260927100000, M/20260928100000) already keeps PD evidence out of every catalogue figure (§4). It is still true in three places:
>    - rosters and headcounts;
>    - the row-level access rules on evidence;
>    - any course left at the default label, ACADEMIC.
> 2. **Enrolment.** I said Pendataan could enrol an existing person only by an internal ID. It is narrower than that: the intake **refuses** anyone who already holds a number at the school, and anything it does enrol stays PENDING until a *new* account is made (§2 D).
> 3. **Programme home.** I suggested a separate PINTAR-run programme. That is not the cleanest arrangement in 4.0 (§2 G).

---

## 1. Executive verdict: **AMBER**

**What already exists.** WP6A and WP6B built most of this on purpose.

- **Identity.** The same person teaches and learns. `display_role` stays EDUCATOR. No STUDENT role can exist. Learning is authorised by ACTIVE enrolment plus open membership, never by role.
- **The journey.** Lessons, Pemetaan Awal, Uji Penguasaan, Hasil and certificate all work for an enrolled Guru. No page is gated on role.
- **Content.** A workbook with Konteks «Pengembangan profesi» creates a PROFESSIONAL_DEVELOPMENT course. The context is sealed with the content and inherited by revisions.
- **Catalogue metrics.** All 16 calculators exclude a correctly labelled PD session, response, result and certificate. Two standing database assertions enforce this.
- **Certificates.** A PD certificate is a real, valid certificate, and it is kept out of the school's credential figure.

**Why not GREEN.** Three bounded gaps, none of them a redesign:

1. **No product path enrols an existing educator.** The only PENDING→ACTIVE transition is account activation, which an existing account holder has already passed. The intake refuses anyone who already holds a number. Today it can be done only by a direct database write.
2. **The hard boundary exists only at the metric-source layer.** The context lives on the course. Nothing else knows it:
   - Assignment does not check it. A PD course can be assigned to a student Kelas, and an ACADEMIC course to a PD Kelas.
   - Rosters and headcounts show an enrolled Guru as «Murid».
   - Row-level access to sessions, results, answers and integrity signals is the same for PD as for academic evidence.
   - The (unused) briefing counter reads raw evidence.
3. **Small copy items** on shared learner screens, and missing tests for the product path.

**Why not RED.** Nothing needs a new identity model, a new learner table, cross-tenant enrolment or a change to the metric engine. The one new semantic fact recommended (§5 C2: a place knows it is for professional learning) is set once, read in SQL, and needs no role check anywhere.

**Smallest safe change.** Five database-side changes, a handful of copy items, and tests (§5). Placement is a dedicated professional-learning Bagian → Tingkat → Kelas inside the school's own tenant. There is no fake school, and nothing goes in Pustaka PINTAR.

---

## 2. Current capability map

Classifications: **PASS** · **WORKS WITH EXISTING CONFIGURATION** · **SMALL GAP** · **ARCHITECTURAL GAP** · **NOT APPLICABLE**.

### A. Identity and role: PASS

| Check | Status | Evidence |
|---|---|---|
| No STUDENT role can be recorded | PASS | M/20260912004431:10 `check (role <> 'STUDENT')` |
| Learner = ACTIVE enrolment + open membership; no role read | PASS | `my_learning_assignments()` M/20260913093000:121-126 |
| An enrolled Guru's `display_role` stays EDUCATOR | PASS | `my_profile` M/20260912004431:237-243: highest held role first, STUDENT only as the fallback |
| Home after sign-in stays `/mengajar` (D-010) | PASS | S/app/masuk/actions.ts:129, S/lib/beranda.ts:46-47 |
| «Pembelajaran Saya» tab; educator shell on `/belajar` | PASS | S/components/CangkangPengalaman.tsx:143-146, 212-237 |
| An enrolled Guru creates no second person, account or number | PASS (F06-P19, T/db/fable06.sql:5234) | Only if enrolled with the existing `person_id`. See D. |
| Guru who also holds a senior role (HoD, Dean, Admin) | SMALL GAP | S/lib/tur.ts:215-218 gives them the plain learner shell and the first-login learner tour («tanyakan kepada guru»). No Kelas tab either. A Guru with EDUCATOR only is unaffected. |

### B. Content model: WORKS WITH EXISTING CONFIGURATION

- **Konteks → course context.**
  - Workbook column «Konteks» (S/lib/unggah-kontrak.ts:46, 62) → `package_context` (M/20261007100000:118-125) → stored on the course (M/20261010100000:48-51).
  - An unknown value is refused (`COURSE_CONTEXT_UNKNOWN`).
  - Sealed content locks the context (M/20260929100000:229), and revisions inherit it (M/20260928100000:221-229).
- **One workbook = one course.** A pre-test and post-test pair is built **once per course**, from every marked question in all its Bab (M/20261010100000:113-130). So "a Bab 1 assessment, then a Bab 2 assessment" means **two packages**, one per Bab. Each is its own course, release and assignment.
- **Required fields are free text.** Mata pelajaran, Jenjang and Kelas are required (unggah-kontrak.ts:58-61). They appear as the eyebrow on the educator's card and test pages, so educator-appropriate values are needed (for example «Pengembangan Kompetensi» · «Guru»).
- **Risks:**
  - **The label defaults to ACADEMIC.** Leaving Konteks blank makes an academic course (unggah-kontrak.ts:62 «Kosongkan untuk Akademik»; M/20261010100000:51). No screen can show a course's context, because a test forbids `src` from naming it (T/experience.test.ts:5868-5881). A mislabelled PD course is invisible until it has contaminated the figures (§4).
  - **The workbook-label path has no test.** The only PD import test uses the JSON key (T/db/fable06.sql:5784-5791).

### C. Learning journey

The rows below apply to a Guru with EDUCATOR only, signed in with email, holding an ACTIVE enrolment and membership in a Kelas to which a PUBLISHED PD release is assigned.

| Stage | Status | Evidence / note |
|---|---|---|
| Enrolment precondition | **SMALL GAP (blocking)** | See D. The schema accepts the rows; only the product action is missing. |
| Sign-in → home | PASS | `/mengajar`, unchanged |
| `/` entry page doors | SMALL GAP | S/components/tempat.ts:98 offers the Belajar door only when `displayRole === "STUDENT"` |
| «Pembelajaran Saya» → `/belajar` | PASS | Lists both Bab cards; educator persona; no child tour (S/app/belajar/page.tsx:84-86, 166) |
| Bab 1 card → lesson list | PASS | S/app/belajar/[tugas]/page.tsx:31-32; Bab titles above lessons; one progress count per course |
| Bab 1 Pemetaan Awal | WORKS WITH EXISTING CONFIGURATION | Required before Uji Penguasaan (S/…/penguasaan/page.tsx:33). One attempt. The package must mark pre-test questions. |
| Read Bab 1 lessons | PASS | `learner_lessons`, `may_read_lesson_media`, `record_lesson_progress` (M/20260913093000, M/20260913094000) |
| Bab 1 Uji Penguasaan | WORKS WITH EXISTING CONFIGURATION | Two attempts; pass at mastery 0.6 (package defaults, M/20261010100000:113-130) |
| Bab 1 Hasil, Lanjut | PASS | Read from the Guru's own session (`session_is_mine`); PD visible to its owner |
| Bab 2 (same five steps) | WORKS WITH EXISTING CONFIGURATION | Second package, second assignment to the same Kelas |
| Order Bab 1 before Bab 2 | ARCHITECTURAL GAP, **not needed for the demo** | There are no prerequisites. The facilitator can assign Bab 2 after Bab 1, or both at once, relying on the numbered titles. |
| "Completion" of the programme | ARCHITECTURAL GAP, **not needed for the demo** | Completion is per course: two post-tests, two certificates. No object represents "the programme is done". |
| Certificate per Bab | WORKS WITH EXISTING CONFIGURATION | Only from OFFICIAL evidence (INV-20, M/20260914103000:180-188). **Not in a synthetic school,** so not on staging (see §7). |

**Alternative considered:** one package with two Bab, plus a facilitator's Uji Cepat per Bab (`launch_quick_assessment`). It was rejected because an Uji Cepat sits outside the cycle, Hasil and certificate. The two-package form uses only the ordinary journey.

### D. Enrolment: SMALL GAP, and the blocker

- **The only PENDING→ACTIVE transition is in account activation** (M/20261005120000:85-89). That trigger also refuses "this person already has an account". Enrolment was designed to start when a learner first gets an account. An existing Guru passed that point long ago.
- **The intake refuses the Guru.** A row carrying their `person_id` is refused with "this person already holds an institutional identity here" (M/20261014100000:44-46; copy «Orang itu sudah punya nomor induk di sekolah ini», S/lib/hle.ts:1687). Staff rows are refused too (:67-78). A row *without* `person_id` would mint a second person (M/20261006100000:586-588), which D-054 forbids.
- **The screens offer no picker.** Nothing on the product surfaces places an existing person by name. The only «Orang» picker is Konfigurasi's `grant_role` (S/app/konfigurasi/page.tsx:498-515), and it creates no enrolment.
- **What remains open is a direct write.**
  - RLS still allows an INSTITUTION_ADMIN to insert enrolments and memberships (M/20260912004431:320-331). The enrolment guard allows ACTIVE on insert (M/20260912004321:68).
  - No `src` code does it. Every WP6 selftest and the local seed enrol this way (T/db/fable06.sql:615-672; supabase/seed/learning_cycle.sql:681-684).
- **Classified SMALL, not ARCHITECTURAL.** Tables, guards, RLS and every learner function already accept an educator's ACTIVE enrolment. What is missing is one authorised action with a surface (§5 C1).
- **A pitfall to design around.** `may_start_assessment` and `start_learning_session` use the Guru's **newest** ACTIVE enrolment at the school (M/20260913090000:266-269, M/20260929100000:125-127). The action must reuse an existing enrolment for the same school and period rather than add a second one.

### E. Metric isolation (hard boundary)

- **Catalogue: PASS.** A PD row enters the scoped sources only under a person binding (`row_in_learning_context`, M/20260927100000:84-98). That binding is set only when someone reads their own record (M/20260925100000:139-140).
- **Outside the catalogue: SMALL GAP.** Rosters, counts, RLS and the briefing do not know the context.

The whole analysis is in §4.

### F. Visibility of a Guru's PD evidence

The permission sources are:
- sessions: M/20260912133821:331-334;
- results: `assessment_result_readable` M/20260924100000:99-132;
- answers: M/20260912140823:220-224;
- integrity signals: M/20260912194342:140-141;
- certificates: holder only, M/20260914180000:130-131;
- capabilities by role: M/20260926100000:143-162.

**CURRENT BEHAVIOUR** is what any screen shows. **TECHNICAL CAPABILITY** is what the reader's own login can SELECT.

| Reader | CURRENT BEHAVIOUR | TECHNICAL CAPABILITY | PRODUCT DECISION REQUIRED |
|---|---|---|---|
| The Guru | Everything of their own: Hasil, certificate, lessons | Their own session, result, answers, certificate | No |
| Facilitator (Guru at the PD Kelas) | Roster listing the Guru as «Murid»; «Mengumpulkan n / m»; the names who have and have not submitted. No scores: `pengajar.ts` never selects results (S/lib/pengajar.ts:33-39). | Session rows (any educator in the school); **the Guru's mastery and per-part result** (CAN_VIEW_LEARNER_RESULT at the node) | **Yes:** may the facilitator see participation? Completion? Scores? |
| Any other Guru in the school | Nothing | **Session rows**: the sessions policy is school-wide for CAN_ASSIGN_LEARNING | **Yes** (default: nothing) |
| Kepala departemen | Roster and «Catatan murid» only if their Bagian covers the PD place; Studio «Integritas» shows the Guru's PD integrity signals **school-wide** | Sessions; answers and integrity signals school-wide; results within their scope | **Yes** |
| Dekan (scope = the whole school, D-006) | «Murid pada bagian ini» **lists the Guru**; «Catatan murid» opens with the PD placement and no PD results (M/20260925100000:244-270) | Roster only | **Yes** |
| Admin sekolah | Studio «Integritas» (school-wide); Konfigurasi lists the enrolment as «Peserta didik» | Sessions, answers, integrity signals | **Yes** |
| Management decision queue | A *referred* PD integrity signal arrives with the Guru as its subject (`refer_integrity_signal`, M/20261024100000:56-58) | as screen | **Yes:** may a PD signal reach Management? |
| Admin platform | Studio «Integritas» | Everything except the certificate | **Yes** (operational access) |
| The public | Verification by token: pass, predikat, school, date; **no course, no context** (S/app/verifikasi/[token]/page.tsx:118-137) | same | **Yes** (see I) |

WP6A's own note deferred this decision: "§12 says to decide no Management visibility here" (M/20260927100000:56-58). That source specification is not in the repository. The existing tests prove only the metric route and the Management RPC (F06-P19). **RLS reads are untested.**

### G. Cross-school: the smallest clean arrangement

| Arrangement | Verdict | Why |
|---|---|---|
| **A dedicated PD Bagian → Tingkat → Kelas inside the school's own tenant** | **Recommended for 4.0 and for the demo** | Everything already works there: upload, review, publish (four-eyes), assign, the journey. Tenancy is untouched. The Guru's identity stays in one school. Academic feedback stays unaffected (it already refuses any class a PD assignment reaches, M/20261001100000:125-138, so the PD place must not sit inside an academic Tingkat). |
| Pustaka PINTAR (canonical library) distributing to schools | **Later**, not 4.0 | ADR-0015's distribution check accepts a PD release. But: product upload into the canonical tenant is refused (M/20261007100000:461-463; authoring there is backlog, D-029); Siapkan offers only the school's own releases (S/lib/pengajar.ts:235-245), so a distributed release cannot be assigned from the UI; and the canonical tenant cannot hold enrolments (ADR-0015 §2). |
| A PINTAR-run "PD school" enrolling every educator | **Not recommended** | It would be a school that is not a school. Each Guru would hold an enrolment in a second tenant their school cannot see. It would add cross-tenant visibility questions that 4.0's tenancy rules deliberately don't answer. Nothing in the code needs it. |

**Demo placement:** one synthetic school on staging, plus the audit harness's real-posture school for the machine proof (§7). Nothing goes into production. Nothing goes into Pustaka PINTAR, where it cannot be uploaded through the product anyway.

### H. UI and copy

Shared learner screens say the same thing to a learner and an educator; UX1-AJAR-KATA-01 (T/experience.test.ts:5912) checks this. The content itself is governed by `content/EDUCATOR-LEARNING-CONTENT-STANDARD.md`. What remains:

| Item | Status | Note |
|---|---|---|
| `/` page: no Belajar door for a Guru | SMALL GAP | S/components/tempat.ts:98 reads the display role, not enrolment |
| Refusal pages: «Jika ini keliru, tanyakan kepada guru Anda.» | SMALL GAP | The staff line already exists (DAISY-17, hle.ts:1831-1832: «…tanyakan kepada yang mengurus PINTAR di sekolah Anda»). But the `/belajar` refusal pages pass no persona, and HalamanPenolakan.tsx:26 defaults to learner, so an educator gets the learner line. |
| Card and test eyebrows show `subject · grade_label` | WORKS WITH EXISTING CONFIGURATION | Content fields (see B) |
| Hint button «🧭 Perlu arah berpikir?»; hints at the UNIVERSITAS register (ItemPlayer.tsx:75-80) | WORKS WITH EXISTING CONFIGURATION | The emoji is left to UI/UX POLISHED (content standard note). Whether any generated hint addresses the reader as a student is **unverified**; check on the demo run. |
| Senior-role Guru gets the learner tour | SMALL GAP | See A. The demo uses a Guru with EDUCATOR only. |
| Rosters say «Murid» / «Murid terdaftar» / «Murid pada bagian ini» / «Peserta didik» for the Guru | SMALL GAP | Identity presentation to colleagues; see §4 and C3 |
| Certificate: «Sertifikat Penguasaan», «telah menuntaskan», `subject · title`, predikat bands down to «Perlu Pendampingan» | WORKS WITH EXISTING CONFIGURATION | No student wording (checked `sertifikat.*` and `verifikasi.*`) |
| «Cek penguasaan» / «Pemetaan awal» in generated test titles and assignment refusals | NOT APPLICABLE here | Already in the Terminology v1 change set (A11–A21) |

Every copy change belongs to Daisy's lane in UI/UX POLISHED, under Terminology v1 (D-068). No application string is changed by this assessment.

### I. Certificate: WORKS WITH EXISTING CONFIGURATION

- **How it is issued.** Issued per session (the post-test) through the ordinary route: `session_is_mine`, then `certificate_prepare` and `certificate_seal` (S/app/api/certificates/issue/route.ts:37-69). Nothing in it reads the context. That is by design: F06-P19 J.
- **The school figure.** A PD certificate is left out of `institution.verified_credentials` (via `academic_certificates`, M/20260928100000:91-100).
- **Numbering** is shared with academic certificates.
- **It needs OFFICIAL evidence**, so a synthetic school can never issue one (INV-20).
- **Verification page gap (product, not demo).** The public page shows no course. A verifier sees "school X, Sangat Baik" and cannot tell a Guru's PD certificate from a student's. The certificate itself names the course. This matters once PD certificates leave the school; it is a decision, not a defect.

### J. Content and copyright

- **The material.** «Strategi Pembelajaran», Dr. Siti Nurhasanah et al., EDU PUSTAKA 2019, ISBN 978-623-90461-7-0, «Hak Cipta Dilindungi». Use is **internal test and demonstration only**, and scope is **two chapters**.
- **Title marking.** Mark both packages in their course title so every surface that shows a title carries it: for example «[UJI INTERNAL] Strategi Pembelajaran — Bab 1». Put the full line, *INTERNAL TEST / DEMO CONTENT, NOT FOR PRODUCTION DISTRIBUTION*, plus the source citation, in the first lesson.
- **Where it may exist:**
  - staging's synthetic school only;
  - never production;
  - never Pustaka PINTAR (the product cannot upload there, M/20261007100000:461-463).
- **The repository.** The package should live on Lana's lane branch, in a folder marked internal demo, and **not be merged to `main`**. It should be removed after the demo unless a licence is obtained. The audit harness must not carry book-derived text: its PD fixture should be original filler (§7). *Decision 6.*
- **Production for "all educators".** This needs a licence from EDU PUSTAKA and the authors, or original PINTAR content that cites the book (*Decision 6*).
- **The book's scans** are not in the repository (checked: no PDF other than two reports).

### K. Regression

| Area touched by §5 | Suites that must stay green |
|---|---|
| Enrolment action | F-series identity and enrolment tests; activation (M/20261005120000 tests); intake (F11); D-054 no-duplicate checks |
| Place context + `assign_release` | `assign_release` refusal tests; learning-cycle tests; F07 feedback refusal (F07-P01/P11); BOB-35 corrected-release move |
| Rosters and counts | UX1 teacher-evidence tests; `/pimpinan` tests; journey S14–S23 (job A and job B) |
| RLS on evidence | Every educator evidence page; integrity (Boundary 7); certificate issue and verify; F06-P19 |
| Briefing | fable06.sql:1693-1696 |
| Always | `assert_metric_closure`, `assert_academic_sources_are_context_bound`, F06-P08, UX1-AJAR-KONTEKS-01 / KATA-01 / BELAJAR-01, one CI run and one audit-journeys run |

The highest-risk item is the RLS change (C4). It sits under every teacher and Management evidence screen, and the audit's job B (real-posture figures) is what proves it did not narrow academic access.

---

## 3. Assumption map

| # | Assumption | Reality | Consequence |
|---|---|---|---|
| 1 | An existing Guru can be enrolled | No product path; activation-only PENDING→ACTIVE; the intake refuses numbered persons | C1 |
| 2 | "Chapter 1 assessment", then "Chapter 2 assessment" | One pre/post pair per **course** | Two packages |
| 3 | The journey is lessons → assessment | Each course also has a Pemetaan Awal, required before Uji Penguasaan | Lana writes pre-test questions for each Bab |
| 4 | Bab 2 follows Bab 1 | No prerequisites | Facilitator assigns in order, or both with numbered titles |
| 5 | "Completion" is one event | Per course: two results, two certificates | The demo shows both cards complete |
| 6 | A Guru remains a Guru | True in identity, role, home and navigation. **False on colleagues' rosters («Murid»).** | C3 |
| 7 | Student metrics are unaffected | True for all 16 catalogue calculators **if** the course is labelled PD. False for rosters, counts, RLS and the briefing; false for a course left ACADEMIC; false for a Guru enrolled in a student Kelas. | §4; C2–C5 |
| 8 | Nobody else sees the Guru's results | True on screens. **Not true at the access-rule level** (facilitator and HoD capability). Integrity signals *are* shown to HoD and admin. | F; Decisions 1–2 |
| 9 | Content can reach "all educators" | Per school in 4.0; cross-school distribution is not usable from the UI | G; roadmap |
| 10 | Copy already suits educators | Mostly (neutral by test); five exceptions | H; Daisy |
| 11 | *(code)* A learner's enrolment starts at account activation | Written for students, whose account follows their enrolment | C1 |
| 12 | *(code)* Every membership is a student | Rosters, counts, the transfer picker and Management lists all assume it | C3 |
| 13 | *(code)* An org node carries no learning context | Stated as fact (M/20260930100000:105-111); it is why assignment cannot check the boundary | C2; Decision 3 |
| 14 | *(code)* `displayRole === "STUDENT"` means "learns" | tempat.ts:98 only; everywhere else uses enrolment | H |
| 15 | *(demo)* Staging can show a certificate and non-zero figures | A synthetic school produces SYNTHETIC evidence only: no certificate, every figure "0/5" | §7 splits the proof |

---

## 4. Metric contamination analysis

**Root cause.** The learning context is a property of the **course**. It is enforced in **one layer**: the metric sources (`scoped_official_sessions` via `row_in_learning_context`; `academic_responses`; `academic_certificates`). Everything that predates WP6A reads memberships and raw evidence, and cannot see the context. `src` is also *forbidden* to see it (T/experience.test.ts:5868-5881), so the fix cannot be a UI filter.

### 4.1 Clean: the metric catalogue

| Family | Calculators | Source | PD reaches it? |
|---|---|---|---|
| Class | participants, comprehension, net_gain, readiness_distribution, topic_mastery (BOB-37), misconceptions | scoped sessions/results; `academic_responses` | No |
| Institution | participants, net_gain, safety_gate_pass_rate, cohort_comparison, competency_outcomes (BOB-37), verified_credentials | scoped sessions/results; `academic_certificates` | No |
| Item | correctness_rate, position_effect, distractor_uptake | `academic_responses` | No |
| Learner | learner.result | scoped | Only to the Guru reading their own record (by design) |
| Question health | `recompute_question_health` | `academic_responses` | No (PD items never gain health evidence; acceptable) |

These are held by `assert_metric_closure` (M/20260923110000:726-869; MC-3 re-runs it, M/20261025100000:198-201) and `assert_academic_sources_are_context_bound` (M/20260928100000:450-557).

**Limit of the second assertion:** it works by string matching and covers `calc_*` only. It would not notice a `scoped_service_*` view rewritten over raw responses. That is no current defect, but it is a guard with a hole.

### 4.2 Where the Guru's learning still leaks

| # | Surface | What happens | Severity | Reaches the demo? |
|---|---|---|---|---|
| L1 | **Labelling default** | A course with Konteks left blank is ACADEMIC. A Guru's evidence on it enters every class and school figure («murid yang mengerjakan penilaian di sekolah ini»). No screen shows the label. | **High**: silent | Only by author error |
| L2 | **No boundary at assignment** | `assign_release` checks node kind and release status only (M/20261010100000:460-477). Siapkan lists every published release of the school (pengajar.ts:235-245). So an ACADEMIC course can land in the PD Kelas (the Guru's evidence becomes academic: L1 again), and a PD course can land in a student Kelas (students' evidence silently **disappears** from class figures, and that class loses feedback). | **High** | Every Guru in the demo school sees the demo releases in Siapkan |
| L3 | **Guru enrolled in a student Kelas** | Entitlement is by enrolment, so this is allowed. The local seed does it (seed/learning_cycle.sql:637-686). The Guru's tests in that class are academic evidence, indistinguishable from a student's. | **High** | No, if placed only in the PD Kelas |
| L4 | **Rosters and headcounts** | `faktaKelas` and `ringkasKelas` (pengajar.ts:172-192, 580-594) list the Guru as «Murid terdaftar». `daftarMurid` (pimpinan.ts:412-440) lists them in «Murid pada bagian ini»; the Dekan's is the whole school. `management_learner_detail` opens «Catatan murid» with the PD placement. The Konfigurasi transfer picker lists «Peserta didik». | Medium: identity presentation and student headcounts | **Yes** |
| L5 | **Submission counts and names** | `berjalan` and `siapa` (pengajar.ts:360-436) count and name PD sessions for whoever's scope covers the PD Kelas («Mengumpulkan n / m», «Keadaan hari ini», the Uji Cepat page). They cannot mix into an academic class's own assignment, because a session records its own course's release (M/20261022100000:65-75). | Low: confined to the PD Kelas | Yes (facilitator) |
| L6 | **RLS on evidence** | Sessions, results, answers and integrity signals are readable by roles beyond the Guru, whatever the context (§2 F) | Medium: privacy, not figures | Capability only; screens show integrity signals |
| L7 | **Integrity signals** | PD signals appear in Studio «Integritas» (HoD, admin) and can be referred into Management's queue with the Guru as subject | Medium: HR-sensitive | If a signal fires |
| L8 | **`advance_briefing`** | Counts `official_sessions` POST_TEST participants per class with no context filter (M/20260918180000:180-183) | Low: **latent**; nothing in `src` calls it | No |
| L9 | **`analytics` role** | NOLOGIN; holds SELECT on the unnarrowed `official_*` views (M/20260912194513:147-148) | Capability only | No |

### 4.3 What the boundary should be (recommendation)

Make **"this place is for professional learning"** a single fact, and have every consumer ask that fact rather than check roles:

- **One fact.** Set it on the Bagian when it is created, and let the subtree inherit it through `jalur`. It could equally be stored on the hidden PROGRAMME node. It cannot change once the place has members or assignments.
- **One boundary, enforced where material meets people.** `assign_release` refuses when the course's context differs from the place's. The enrolment action (C1) places a person into a professional-learning place only. Together these close L1, L2 and L3 in the database.
- **One derived predicate for readers.** Rosters, counts, Management lists, RLS and the briefing ask "is this membership, session or place professional learning?" through one SQL function, as the metric layer already does with `row_in_learning_context`. `src` stays context-blind (UX1-AJAR-KONTEKS-01 holds), because the database returns rows already filtered or already typed.

**Why not only derive it.** A place could instead be classified by the context of whatever is assigned there. The feedback rule already does exactly that (M/20261001100000:125-138). But a derived fact is empty before the first assignment, can flip later, and cannot stop the first wrong assignment. The explicit fact is a new fact, and the code currently says a node "carries no context of its own". Adding one is therefore Decision 3.

---

## 5. Minimum change package (described, not ticketed)

Engineering items C1–C5 and C7 are Bob's lane; C6 is Daisy's (UI/UX POLISHED). Nothing starts before Gate 2E and a ruling. Items marked **demo** are needed for the acceptance demo to hold the principle. Items marked **before real educators** can wait until PD is offered to a real school.

| # | Change | Scope | Needed for |
|---|---|---|---|
| **C1** | **Enrol an existing person for professional learning.** One authorised database action. The caller holds CAN_PROVISION_PEOPLE at the school, and the person is visible to them. It reuses the person's enrolment for that school and period, or creates one: **ACTIVE** if they already have an account, **PENDING** otherwise, so activation keeps its meaning. It then adds the membership and writes an audit row. It accepts only a professional-learning place, and refuses a duplicate membership. One small form in Konfigurasi, beside the existing «Orang» picker. Creates no person, account or number. | 1 function, 1 form, tests | **demo** |
| **C2** | **The place's context, and the assignment boundary.** The fact from §4.3, settable when a Bagian is created (Konfigurasi structure functions). `assign_release` refuses a context mismatch in either direction. Siapkan offers only releases that match the Kelas, through the database, so `src` stays context-blind. | 1 column or inherited fact, 1 check, 1 list read, structure form | **demo** |
| **C3** | **Rosters and counts tell participants apart.** In a professional-learning place, participants are not «Murid». The teacher roster and «Mengumpulkan n / m» in a PD Kelas use the participant wording. `daftarMurid`, «Catatan murid» placement and the Konfigurasi transfer picker leave out professional-learning memberships, unless Decision 1 says otherwise. All of this is decided in SQL, through the predicate. | ~6 read paths, wording keys | **demo** |
| **C4** | **Evidence access follows the context.** One predicate is added to the *non-self* branches of the policies on sessions, results (`assessment_result_readable`), answers and presented items, and integrity signals. Academic rows keep today's rules exactly. PD rows are readable by whomever Decision 1 names. Integrity-signal display and referral follow Decision 2. | ~5 policies, 1 function, the Studio «Integritas» read, `refer_integrity_signal` | **demo** (at least results and integrity) |
| **C5** | **Briefing counter reads context-bound evidence.** `advance_briefing` counts academic POST_TEST participants only. | 1 line + test | before real educators (latent) |
| **C6** | **Copy** (UI/UX POLISHED, Terminology v1): the `/` Belajar door from enrolment rather than display role; the `/belajar` refusal pages passing the educator persona, so they use the existing staff line of `tolak.arti`; participant wording for C3; the senior-role Guru's shell and tour (Decision 7). | hle keys + 2 components | demo (door, refusal); rest before real educators |
| **C7** | **Tests for the product path.** Covering: C1 through the product (no new person, account or number; ACTIVE vs PENDING; refusals); C2 negatives in both directions; the workbook-label path («Pengembangan profesi»); rosters with an enrolled Guru; the RLS matrix per Decision 1 for every reader in §2 F; a PD integrity signal and its referral; the briefing. Also make F06-P20's five class readings non-vacuous: today they read `cls_a` while the PD session is at `v_pdclass` (T/db/fable06.sql:5583-5624). Set the PD session's mode to POST_TEST explicitly (5555-5556). | selftests + audit job B steps (§7) | **demo** |
| — | *Not in the package:* prerequisites between courses, a programme-completion object, canonical PD authoring and distribution, the verification page showing the course, a PD-specific certificate design. | — | Roadmap (§8) |

**Versioning (D-060).** C2–C5 change no calculator, metric source or readiness rule, so no new catalogue version and no `engine_version` bump. Each hand-off states this. C4 changes access, not meaning.

**Size.** C1–C5 and C7 are one engineering batch: one CI run and one audit-journeys run. C6 rides UI/UX POLISHED. Lana writes two packages under the content standard, each with lessons, pre-test and post-test questions.

**If Yazid wants to see the learner screens sooner (not recommended as the acceptance demo).** With no code change, an operator could insert the enrolment and membership for a synthetic Guru in the staging synthetic school, and the journey would run. It would show the Guru as «Murid» to colleagues, bypass the boundary, and prove nothing about metrics (synthetic evidence). It would be a preview, not the demo. *Decision 4.*

---

## 6. Product decisions required from Yazid

None of these is inferred here. Where a default is named, it is the most restrictive *technically safe* setting to use until a ruling. It is not a policy recommendation.

1. **Who may see a Guru's professional-learning evidence**, and at what level? Levels: enrolment; participation or completion; scores and per-part results; answers. Readers: the facilitator, other Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform, Management screens. *Safe default: the Guru alone for scores, answers and results; the facilitator sees enrolment and whether each test is done; Management sees nothing (as WP6A §12 already left it).*
2. **Integrity signals from a PD test:** kept and shown to whom? May one be referred to Management? *Safe default: recorded, visible to no one else, not referable.*
3. **The boundary's form:** an explicit "professional-learning place" fact on the Bagian (recommended, §4.3), or classification derived from assignments.
4. **Demo route:** the product path (build C1–C5 and C7 first; recommended), or an operator-written preview now, understood as not being the demo.
5. **PD home in 4.0:** a dedicated Bagian → Tingkat → Kelas in each school (recommended). The alternative is to wait for canonical distribution. Also: who is the facilitator (a Guru at that Kelas), and may the school's Kepala departemen hold the PD Bagian?
6. **Content:**
   - **(a) Production.** A licence from EDU PUSTAKA and the authors, or original PINTAR content citing the book.
   - **(b) The demo package.** Kept on Lana's branch, never merged, deleted after the demo unless licensed.
   - **(c) Lana's route for the demo.** Close adaptation of the two chapters (internal only), or an original treatment from the start.
7. **Scope for 4.0:** may a Guru who also holds a senior role learn in 4.0? If yes, C6 must include their shell and tour (A); if no, the demo and pilot use Guru with EDUCATOR only.
8. **Certificates:** is a PD certificate part of the demo (proved in the audit harness, since staging cannot issue one)? Later: should the public verification page name the course?
9. **Placement on the roadmap:** within 4.0, after Gate 2E and alongside ENGINEERING COMPLETE? Or after the Educator Pilot? (§8)

---

## 7. Demo acceptance test

One Guru, one journey, two Bab. The proof runs in two venues, because a synthetic school cannot produce OFFICIAL evidence (INV-20): no certificate, and every figure reads "0/5".

- **Venue 1: the machine proof.** Audit harness job B, on its real-posture school «SD Zayd» (D-064; audit #52 S20–S23), extended with new steps. It uses an **original filler PD fixture** (two tiny Bab, no book text). This is where "student metrics unchanged" is non-vacuous: Kelas 1A's five students already produce «Pemahaman 75%», «+35 poin», Peserta 5.
- **Venue 2: Yazid's walk.** Staging, «Sekolah Uji Kinerja (sintetis)», with Lana's two INTERNAL TEST packages. Every screen is captured. Evidence there is SYNTHETIC, so no certificate step.

### Setup (both venues)

1. **Guru G:** an existing person with an email account and **EDUCATOR only**, teaching an academic Kelas (in Venue 1, Kelas 1A's teacher).
2. **Snapshot before:**
   - **For G:** person id, account, institutional number, role assignments, `my_profile.display_role`, home route.
   - **Row counts:** persons, accounts, enrolments, memberships.
   - **The 16 catalogue readings** for Kelas 1A, its Bagian and the school, as Guru, Kepala departemen and Dekan.
   - **Other screens:** the teacher roster and counts for Kelas 1A; `daftarMurid` for the Bagian and the school; the Konfigurasi enrolment list; `academic_responses` and `academic_certificates` counts; question health for Kelas 1A's items; the `advance_briefing` have.
3. **The PD place:** Bagian «Pengembangan Guru» (professional-learning, per C2) → Tingkat → Kelas; facilitator F holds Guru at that Kelas.
4. **The content:**
   - two packages, Konteks «Pengembangan profesi», titled «[UJI INTERNAL] … Bab 1» and «… Bab 2»;
   - uploaded, reviewed, frozen and published by two people;
   - F assigns Bab 1, then Bab 2.
5. **Enrolment:** Admin sekolah enrols G through C1.

### The journey

G signs in with email → lands on `/mengajar` → «Pembelajaran Saya» → Bab 1: Pemetaan Awal → lessons → Uji Penguasaan → Hasil → certificate (Venue 1) → Bab 2, the same → both cards complete. G then returns to «Kelas» and teaches Kelas 1A as before.

### Pass conditions

| # | Proof | How |
|---|---|---|
| P1 | **Same identity** | Persons +0, accounts +0, institutional numbers +0. Every session, result and certificate carries G's original person id. `display_role` = EDUCATOR before and after. Role assignments unchanged. Home `/mengajar`. The Kelas tab works. |
| P2 | **Student metrics unchanged** | All 16 catalogue readings at Kelas 1A, the Bagian and the school are byte-identical before and after (JSON compare). The on-screen figures still read «Pemahaman 75%», «+35 poin», Peserta 5. `academic_responses`, `academic_certificates`, question health and the briefing `have` are unchanged. |
| P3 | **Rosters unchanged; G shown correctly** | Kelas 1A's roster and counts are unchanged. The school and Bagian «Murid» lists are unchanged. In the PD Kelas, G appears in the participant wording, not «Murid». |
| P4 | **Evidence preserved** | Four FINALIZED sessions (2 pre-tests, 2 post-tests) and their results, readable by G on Hasil. Two sealed certificates, verifiable by token (Venue 1). Nothing deleted or rewritten. The course context cannot be changed after sealing. |
| P5 | **Visibility as ruled** | For F, another Guru, the Kepala departemen, the Dekan, Admin sekolah and a student: direct SELECT **and** screens match Decision 1 exactly. Integrity signals match Decision 2. |
| P6 | **Tenancy preserved** | Every new row belongs to G's school. Nothing in another school, the canonical tenant or production. A Guru of a second school sees nothing. |
| P7 | **The boundary holds** | Refused: an ACADEMIC release to the PD Kelas; a PD release to Kelas 1A; C1 into Kelas 1A; the intake with G's person id. Siapkan in Kelas 1A does not offer the PD releases. |
| P8 | **Content marking** | «[UJI INTERNAL]» is visible on every card, test and certificate title. The first lesson carries the notice and the citation. The packages are absent from Pustaka PINTAR and production. |
| P9 | **The educator's experience** | Venue 2 screenshots: no «tanyakan kepada guru», no child tour. The eyebrow reads the educator values. Lesson and question text meet the content standard (Lana's gate). |

**Evidence filed:**
- the audit run id and its step table;
- the before/after snapshots as JSON;
- the Venue 2 screenshots.

All three go on the board, following the C-03 and D-064 pattern.

---

## 8. Roadmap impact

- **Gate order is unchanged.** Nothing starts before Gate 2E (the Stellar Business move and the post-move mail check). Bob, Daisy and Lana stay paused. BOB-15, DAISY-12 and BOB-13 stay unstarted.
- **Engineering (C1–C5, C7).** One batch after the current queue: one CI run and one audit. It touches assignment and evidence access, which sit under every teacher and Management screen, so it is gated like BOB-37: real-posture figures proven unchanged in job B. If placed inside 4.0, it adds to ENGINEERING COMPLETE (D-052). It does not reorder BOB-42 or the identity gates.
- **UI/UX POLISHED (C6).** Four to five copy items under Terminology v1. They enter Daisy's queue with the rest of the change set.
- **Content (Lana).** Two packages, each with lessons, a pre-test and a post-test, written to the educator content standard. This work can proceed as soon as the ruling on Decision 6 is given, independently of the engineering batch. It is still docs-only work on her lane.
- **Release checklist.** No P0 check changes. If Yazid places PD in 4.0, two checks would be added at the next rescore: the boundary (P7) and visibility as ruled (P5).
- **After 4.0 ("all educators", across schools).** This needs:
  - authoring into Pustaka PINTAR (D-029 backlog);
  - Siapkan offering distributed releases;
  - each school's PD place enrolling its own Guru (C1 already serves this);
  - optionally, prerequisites, programme completion and a PD certificate design.

  None of these is needed for the demo, and none requires revisiting the 4.0 changes above.
- **Horizon review.** Consistent with the 4.0 → 5.5 review. No 4.5+ structure is introduced.

**Next step.** Yazid (with ChatGPT) rules on §6. The coordinator then turns the ruled items into tickets for placement after Gate 2E. Nothing is implemented before that.

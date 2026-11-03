# Batch 5 · Reports, learner workflows and assessment integrity: completion report (3 Nov 2026)

**Authority:** owner, 3 Nov: «PINTAR 4.0 — BATCH 4 ENGINEERING ACCEPTED / BATCH 5 DEVELOPMENT GO» (D-156).

**Where the work is:**
- Development branch `claude/awesome-rubin-bqxp6p`. The code head is `83f3bcc` (CI and the journeys green on it, §6); this report and the register changes follow it, documents only.
- Nothing is merged to `main`. Nothing is deployed to staging. Production is untouched. Dr Gladys's demonstration records are untouched. The staging freeze holds (D-155).

**Verdict: IMPLEMENTED AND VERIFIED ON THE BRANCH. Stopped at the promotion gate.**
- Every engineering item of the Batch 5 plan is built, with guards that are red on the base and green after.
- **W2.10 is now implemented** as a focused correction (§1.3). It stays unaccepted until it is verified on staging.
- Three items need Daisy (W3.8 body and print, W3.12, W3.16), one needs Dr Gladys's words (the metric labels), and one design conflict needs a ruling (the tour). All are in §5.

Five new migrations, 189–193 (staging has 188):

| # | Migration | What |
|---|---|---|
| 189 | `20261222100000_a_school_admin_finds_and_revokes_a_certificate` | `sertifikat_sekolah` (read only) |
| 190 | `20261223100000_each_integrity_observation_has_its_decision_and_its_outcome_is_seen` | `record_integrity_review` and the waiting list re-emitted; `integrity_reviews_recorded` |
| 191 | `20261224100000_people_awaiting_an_account_are_listed_a_page_at_a_time` | three paged or per-class reads |
| 192 | `20261225100000_a_teacher_sees_the_objectives_a_learner_has_not_yet_reached` | `tujuan_belum_tercapai` |
| 193 | `20261227100000_a_new_result_is_the_next_step` | the `result_views` table and two learner functions |

## 1. Requirement by requirement

The test ids are in `selftest/manifest.json`. B5-*, B5A-*, B5B-* and B5C-* are static source guards. F25-* and F26-* are database tests, every row rolled back. Walk ids refer to §2.3.

### 1.1 Assessment integrity

| Item | Done | Evidence |
|---|---|---|
| **W2.5 · certificate revocation** (CR-05; J8.5) | **«Sertifikat sekolah»** (`/konfigurasi/sertifikat`), linked from Konfigurasi. <br>• Daisy's Collection lists the school's issued certificates (Admin platform: every school), searched by number or holder, 20 to a page. <br>• «Cabut» on an issued certificate opens its panel. <br>• Daisy's form page with the destructive in-page Confirmation (GQ5: never the Dialog): a required reason; «Lanjutkan» commits nothing; the red act names the certificate; focus starts on «Batal»; it says what stays safe. <br>• The action checks the certificate's school against the working context, then calls `revoke_certificate` with the caller's own client. That function is unchanged: CAN_PUBLISH, reason, the first revocation stands, audited. <br>• The public check then says «Dicabut oleh penerbit». <br>• Read: `sertifikat_sekolah`, under exactly `revoke_certificate`'s rule. | B5-CABUT-K01; F26-C01, F26-C02; walk B5-W1 |
| **W2.7 · integrity review** (CR-75, CR-76, CR-77; J7.6) | • **One decision per observation:** each waiting observation has its own form with a labelled note. The database keeps an observation waiting until a decision is on it. Reviews recorded before W2.7 still cover their sitting, so nothing reviewed returns to the list. <br>• **The sitting is named by its learner**, the PINTAR ID beneath, then class and assessment. Its state is a badge in words. <br>• **A visible reviewed state:** «Sudah ditinjau», paged, gives each decided observation's decision, who, when and note. <br>• **The referrer sees the outcome** on the page they referred it from (Daisy GQ2): the case's named steps (Diteruskan → Ditinjau pimpinan → Diputuskan); once decided, the outcome, its time and the decision's note; while waiting, whether another leader can decide (CR-76). This shows only where `management_decisions`' own row security would show the case. <br>• **Found by the walk:** the learner's name had never been shown. `assessment_sessions` has a second key to persons (`terminated_by`, since 20260914094500), so the unnamed embed was ambiguous and PostgREST refused the read: every sitting read «—». The page now names the learner through `assessment_sessions_person_id_fkey`, held by the guard. Journey S23i now fails when the learner is not named. | B5-INTEGRITAS-K01; F26-I01; F21-I01 restated; journey S23r extended; walk B5-W2 |

### 1.2 Reports and leadership

| Item | Done | Evidence |
|---|---|---|
| **W3.8 · report pages** (RV-11; J7.2–J7.4; X.7) | **PARTIAL by design rule.** <br>• Both «Ringkasan Kelas» and «Ringkasan Sekolah» are in the staff shell, with the context's own places. <br>• They name the school, the class (class report) and the school year. The school report says its figures cover every school year, because they do. <br>• They follow the reader's language, keep «Kembali» and «Cetak», and print with no navigation. <br>• **The report body and the print layout have no Daisy composition** and are registered (§5). | B5A-LAPORAN-K01; walk B5-W4; `evidence/B5A/*-print.png`, `*.pdf` |
| **W3.9 · Pimpinan** (RV-9; X.5; J9.3) | • «(0/5)» is now the CR-46 sentence («Sekarang 0 murid; perlu 5.»). <br>• The class and school metrics are named for what they measure and never «Peserta». <br>• The cards are spaced. <br>• No calculation or visibility rule changed. | B5A-PIMPINAN-K01 |
| **W2.6 · briefings hidden** (CR-37; J7.5) | The class page's briefing promise, the dead `briefings` reader and the stale predicate are gone. | B5A-TAKLIMAT-K01 |

### 1.3 Administration (W2.10, the focused correction)

| Item | Done | Evidence |
|---|---|---|
| **W2.10 · the Aktivasi waiting list** (CR-49; D-153) | • The people waiting for an account are read **20 to a page by the database** (`persons_awaiting_account_page`), narrowed to the working context's school. <br>• They are searched by name or nomor induk, with the total; the pager keeps the words. <br>• The whole-class cards (M7) are offered from per-Kelas counts (`kelas_menunggu_akun`). That class's learners are read only when its run starts (`orang_kelas_menunggu_akun`). <br>• No page reads every waiting person. | B5-TUNGGU-K01; F26-W01; M7-K01 and CR91-K02 restated; walk B5-W3 (20 of 50 waiting on page 1, page 2, search to one) |

### 1.4 Teacher workflows

| Item | Done | Evidence |
|---|---|---|
| **W2.18 · J5.13** | • On the teacher's view of one learner: «Tujuan pembelajaran yang belum tercapai», each objective by its statement, from the class's own official Uji Penguasaan against the mark sealed on each attempt. <br>• No figure, item, answer or key. <br>• `tujuan_belum_tercapai` answers only the class's own teacher, and only for a learner placed in it. Any other reader gets an empty answer. | B5C-MURID-K01; F25-T01, F25-T02; walk B5-W5 |
| **UX-37** | • Each class's waiting work is on `/mengajar`, worked out by the same logic Langkah uses. <br>• «Sedang berjalan» rows open. | B5C-BERANDA-K01 |
| **UX-41** | «Penguasaan per tujuan pembelajaran» (Daisy's DAISY-29 words). The rows were already named by statement. | B5C-BUKTI-K01 |
| **UX-45** | A teacher's refusals end with the staff recovery line, never the learner's. | B5C-TOLAK-K01; UX1-AJAR-KATA-01 restated |

### 1.5 Learner workflows

| Item | Done | Evidence |
|---|---|---|
| **W3.10 · J4 residue** | • The learner bar wraps instead of pushing «Keluar» out: 640 and 320 px with no sideways scroll (Batch 0 baseline 674–699 px). <br>• The tabs are named «Belajar». <br>• The progress dots and step names are given to screen readers. <br>• «Sudah dijawab: n dari N.» in the Uji Penguasaan. <br>• «Halo, …» and the audio focus ring were already done and were measured. | B5B-LEBAR-K01, B5B-NAMA-K01, B5B-DIJAWAB-K01; walk B5-W6 |
| **W2.12 · RV-7, RV-8** (J6.5) | • No «Mulai Pemetaan Awal» where a chapter has none. Its refusal is in the shell. <br>• A missing recording says so and points to the full text (no media feature, D-050). | B5B-PEMETAAN-K01, B5B-MEDIA-K01 |
| **UX-40** | • A new, unseen result is the next action on Belajar. Opening it marks it seen; existing results are back-filled as seen. <br>• Migration 193: `result_views`, no client access, reached only through two functions scoped to `current_person_id()`. | B5B-HASIL-K01; `evidence/B5B/ux40-db-bukti.*` |
| **UX-46** | The certificate refusal goes back to «Sertifikat». | B5B-SERTIFIKAT-K01 |
| **W3.15 · the tour** (RV-19, UX-38) | • Non-modal: the landing stays usable; Esc still closes it. <br>• The ring stands clear of its target, and there is no focus box on the heading. <br>• At 320 px the sheet never covers the target (7 of 7 steps). | B5B-TUR-K01; UX1-TUR-AKSES-01 restated; `evidence/B5B/tur-*` |
| **W3.13 · J6 Peragaan band** | • Daisy's deep-ink band, a region named «MODE PERAGAAN». Its two ways out are the first stops after the skip link. <br>• Every title inside is prefixed «MODE PERAGAAN · ». <br>• «Anda sudah keluar dari peragaan.» shows after leaving. Leaving now also ends the evaluator's own sign-in. | B5B-PERAGAAN-K01; `evidence/B5B/j6-*` |
| **W2.16 · educator as learner** (CR-57 = DAISY-35) | • Items 1–4 are done: the Belajar door, refusal persona, an adult shell for a teaching senior, and no emoji. <br>• Item 5 (the PD Kelas «Lihat bukti» presentation) has no composition: registered. | B5B-AJAR-K01; UX1-AJAR-KONTEKS-01 restated |

### 1.6 Blocked on Daisy (registered, not invented)

- **W3.12:** the J3 navigation under L3.
- **W3.16:** the `/` chooser and its six words (needs Dr Gladys's words too).
- **W3.6:** carried from Batch 4.
- **UX-09:** also carried from Batch 4.

## 2. Verification

### 2.1 Local suites

**Full local suite (`npm run selftest:local`): 756 passed, 0 failed.**
- Conditions: on a freshly reset stack (192 migrations then; the integrity fix since adds no migration) and a production build, at `7d0022d`.
- One justified skip, F01-R04, whose evidence exists only inside CI.
- Record: `evidence/full-suite-local.txt`.
- The fix after it (`24c3928`, the integrity page's learner name) re-ran its targeted guards green: L4-K01 and B5-*.

The earlier merged run on the shared database had 12 failures. Each was:
- an agent worktree left on disk (F01-S01, DOC-P01);
- the lack of a build (F01-S03, UX1-S0-MUAT-01);
- shared-database state (EVAL-N09, TOUR-P01, BOB28-D01, D101-D01, D102-D01, DR-D02);
- or a real finding, now fixed: BOB07-K01 (the revocation action read the error's text) and PENUTUPAN-I01 (restated for per-observation forms).

All pass on the clean run.

### 2.2 CI

| Run | Head | Result |
|---|---|---|
| `ci` 41629701365 | `83f3bcc` | **success**, including the required `verdict` |
| End-to-end journeys 41629705082 | `83f3bcc` | **success** (job A, every role's screens, the Studio walk and the Batch 4 admin walk; job B, Gladys's path from an empty database, including S23i, S23r and C-12) |

**Superseded runs:**
- The runs on `1f18a0b` were cancelled when the integrity fix superseded them (D-119).
- On `24c3928`, `ci` 41625730169 was green. The journeys (41625734838) failed job B at C12a and S23t.
- Both failures were the journey scripts still reading Batch 5's old words: an h1 «Ringkasan Kelas», now the eyebrow over the class's name, and «Kenaikan», now «Rata-rata kenaikan penguasaan di kelas ini».
- `83f3bcc` updates the CI journey, `audit/c12.mjs` and the staging report walk (`audit/staging/golden-school-laporan.mjs`) to the new words, and the UX-41 heading likewise. No application code changed.

### 2.3 Browser walk

**`audit/b5-ujung.mjs`**, local production build. Every act is a person at a screen; SQL only prepares fixtures and reads results back.
- Run 3 was on a freshly reset stack: W1, W3, W4, W5 and W6 PASS.
- A freshly seeded stack has no alpha sitting to raise observations on, so W2 was run (run 2) after the full suite had created one, on the same code: PASS.
- Accessibility on every walked screen (`audit/a11y.mjs`): axe WCAG 2.2 AA clean, the skip link first, the page's own title, no sideways scroll at 320, 640, 1024 or 1280 px. The screens: `/konfigurasi/sertifikat`, `/studio/integritas`, `/aktivasi`, `/edukator/ringkasan`, the Guru's learner page, `/mengajar` and `/belajar`.
- Evidence: `evidence/walk/run3-fresh/`, `evidence/walk/run2-after-suite/`.

The walks:
- **B5-W1:** the platform admin revokes on the screen. «Lanjutkan» commits nothing; focus is on «Batal»; the certificate is REVOKED with the reason; `certificate.revoked` is audited; the public check says DICABUT; the list says «Dicabut».
- **B5-W2:** alpha's admin sees the sitting named, each observation its own form. One decision leaves the other waiting. The referral and its steps show. The dean decides on /pimpinan. The referrer reads «Diputuskan», «Keputusan: Pendampingan disiapkan», the dean's note and the next step, with no identifier or raw code.
- **B5-W3:** 20 of 50 waiting on page 1; page 2; search to exactly one.
- **B5-W4:** alpha's dean opens the class report in the shell, naming «Sekolah Sintetis Alpha», «5A», «TA 2026/2027». In print, no navigation.
- **B5-W5:** the Guru's learner page has «Tujuan pembelajaran yang belum tercapai».
- **B5-W6:** Belajar is 640/640 and 320/320 px wide.

Screen evidence from the parallel streams is in `evidence/B5A/` (reports at 1280, 320 and print; PDFs) and `evidence/B5B/` (widths, the tour at 320 px, the Peragaan band, RV-7, RV-8, the UX-40 database proof).

## 3. Boundaries kept

- **School isolation:** every new read checks capability in the target school:
  - `sertifikat_sekolah`: CAN_PUBLISH;
  - the integrity reads: CAN_REVIEW_INTEGRITY, with professional learning for Admin platform only;
  - the waiting-list reads: persons_awaiting_account's own rule;
  - `tujuan_belum_tercapai`: the class's teacher.
  
  Each is proven by red cases for another school, another class or another role (F25-T02, F26-C01, F26-I01, F26-W01).
- **Answer confidentiality:** no new read touches responses, items or keys. W2.18 returns objective statements only.
- **Sealed results and audit evidence:** a revocation keeps the certificate row and its first reason. Integrity decisions stay audit rows and never mutate the observation. The referral outcome is read under `management_decisions`' own row security.
- **The database decides every act.** The service key is not used by any new code.
- **Working context:** the revocation action is context-bound (F22's classification); the new read action is exempt by name, with its reason.
- **Metric catalogue and engine:** unchanged.

## 4. Tests restated (none weakened; each states why)

- **F21-I01** (FD-7 → W2.7): one decision now leaves exactly the sitting's other observation waiting. It is stronger than "the sitting leaves".
- **L4-K01:** the learner's name is read through the sitting's own person key, with the PINTAR ID.
- **PENUTUPAN-I01:** «Diteruskan» is offered per observation.
- **M7-K01, CR91-K02** (W2.10): the class grouping moved into the database. Who is in a class's set is executed there by F26-W01: each once, PENDING or ACTIVE, never with an account, an ended enrolment, a Tingkat or a staff role. The offer and the run are still asserted.
- **DAISY-02-KELUAR-01, DAISY-07-LAPORAN-01, HOD09-K01:** the report pages are in the staff shell.
- **UX1-TUR-AKSES-01:** the tour is non-modal (UX-38).
- **UX1-AJAR-KONTEKS-01:** a teaching senior gets the adult shell (DAISY-35 (3)).
- **UX1-AJAR-KATA-01:** `tolak.arti` has an educator telling (UX-45). The learning surface never renders it.
- **UX1-BRAND-02, UX1-TUR-ORANG-01:** the migration baseline 188 → 193, each migration read against the rule.

## 5. Remaining gaps and decisions needed

| # | What | Who |
|---|---|---|
| 1 | **W3.8:** the report body's composition and the A4 print layout (page breaks, margins, a repeated header line) | Daisy |
| 2 | **W2.16 item 5:** the PD Kelas «Lihat bukti» presentation | Daisy |
| 3 | **W3.12** (J3 navigation under L3), **W3.16** (the chooser and its six words), **W3.6**, **UX-09** | Daisy (+ Dr Gladys for words) |
| 4 | **Tour modality:** `08-migration.md` keeps the tour «unchanged in behaviour: today's one modal»; UX-38 and this batch make it non-modal. Which stands? | Owner or Daisy |
| 5 | **W3.9 metric labels:** «Murid yang dinilai di kelas ini», «Rata-rata kenaikan penguasaan di kelas ini» and their school forms replace «Peserta» / «Kenaikan». Terminology v1 ruling 8 had kept «Peserta» for the metric; J9.3 says it is the participant's word. | Dr Gladys (words) |
| 6 | Words written by engineering, for review. <br>• The revocation and integrity strings (`sertifikat.kelola.*`, `sertifikat.cabut.*`, `studio.integritas.*`), where Daisy gave the grammar but not the words. <br>• `laporan.cakupan.*` and `mengajar.murid1.tujuan*`. <br>• `lesson.media.tidak_ada*`, `aktivasi.tunggu.*` and `tolak.kembali_sertifikat`. | Dr Gladys / Daisy |
| 7 | **Behaviour change to note:** leaving MODE PERAGAAN now also ends the evaluator's sign-in, so the leaving line can be shown on `/masuk`. | Owner (accept or revert) |
| 8 | **Not exercised here:** the whole-class card run over the per-class read was not walked in a browser. It runs in CI's journey step M7. | — |
| 9 | **W9.12** (recovery readiness after a logical restore) and the Batch 9 items are unchanged | Batch 9 |

**Promotion would mean:** migrations 189–193 on staging's 188, all additive (functions, registry rows, one new table with a back-fill), and the staging walks for the new screens. Recovery and rollback planning follows the Batch 4 pattern and is prepared at the promotion gate.

## 6. CI on the code head

**Green on `83f3bcc`:** `ci` 41629701365 and end-to-end journeys 41629705082 (§2.2). The commits after it change documents only.

## STOP

Stopped at the Batch 5 promotion gate for owner review. Nothing has been merged or deployed.

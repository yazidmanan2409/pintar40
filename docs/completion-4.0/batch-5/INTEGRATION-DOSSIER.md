# Integration dossier · Batch 5 · reports, learner workflows and integrity, in the form of H §2

**Status:** drafted 8 Nov from the record. Batch 5 was merged as `main` `3412075` (PR #8, head `469dde2`) and verified on staging at 193 migrations (D-158). Its walk has been green on staging after every later promotion: P-1, P-5 and P-7. Every claim names its evidence; a check with gaps says so. **Human journey: not accepted (no recorded walk by a person).**

## 1. Dependencies

| Surface (page) | Reads and writes (database) | Read by |
|---|---|---|
| `/konfigurasi/sertifikat` (W2.5) | `sertifikat_sekolah` (migration `20261222100000`); `revoke_certificate`, unchanged | `/verifikasi/<token>` («Dicabut oleh penerbit»); the learner's list and certificate page (journey S27v) |
| `/studio/integritas` (W2.7) | `integrity_signals_awaiting_review`, `record_integrity_review` (both re-emitted), `integrity_reviews_recorded` (`20261223100000`); `management_decisions` under its own row security | `/pimpinan` (the dean decides); the referrer's page (the case's steps and outcome) |
| `/aktivasi` waiting list (W2.10) | `persons_awaiting_account_page`, `kelas_menunggu_akun`, `orang_kelas_menunggu_akun` (`20261224100000`) | the whole-class card run (M7) |
| The Guru's page for one learner (W2.18) | `tujuan_belum_tercapai` (`20261225100000`) | — |
| `/belajar` (UX-40) | `my_new_results`, `note_result_seen`; the table `result_views`, with no client access (`20261227100000`) | Belajar's next step (`src/lib/siklus.ts`) |
| `/mengajar` (UX-37) | the logic Langkah already uses | — |
| Ringkasan Kelas / Sekolah, `/pimpinan` (W3.8, W3.9) | the metric engine, unchanged (Batch 5 §3) | rebuilt in Batch 9 (D-195; `batch-9/INTEGRATION-DOSSIER.md`) |
| MODE PERAGAAN (W3.13) | `exit_persona`; the evaluator's session set aside (`src/lib/evaluation.ts`), and its ending on sign-out (`src/app/keluar/route.ts`) | the Hub, `/evaluasi?keluar=1` |
| The tour (W3.15) | `suppressed_at`; `src/lib/tur.ts` `akanMunculLagi` | Bantuan |
| Print | the shells' print rule | `audit/b6-cetak.mjs` (Batch 6), including `/pengembangan` (E-C1-5) |

## 2. Data contracts and consumers: one fact, one value

- **A revoked certificate reads «Dicabut» everywhere:**
  - the list, the public check and the audit row (walk B5-W1; staging K1, run 41719638878);
  - the public check opened in a browser by an anonymous visitor (register W2.5, journeys 42293038982);
  - the learner's own list and certificate page (journey S27v). P-5 found S27v failing after a new school year; fixed in `7ea62753` (`batch-9/evidence/staging-p5.md`).
- **The integrity outcome:** the referrer reads the decision the dean recorded on `/pimpinan`, through `management_decisions`' own row security (B5-W2, journey S23r; F26-I01).
- **The integrity page names the learner:** the embed through `assessment_sessions_person_id_fkey` (L4-K01). Before, PostgREST refused the ambiguous embed and every sitting read «—». That defect was traced to its source and fixed there (Batch 5 §1.1).
- **Waiting counts:** the paged total equals the waiting set (20 then 3 of 23). Each class's set is executed in the database: each person once, never with an account or a staff role (F26-W01; M7-K01 and CR91-K02 restated).
- **Objectives not reached:** taken from the class's official Uji Penguasaan against the mark sealed on each attempt (F25-T01).
- **`result_views`:** on staging, the back-fill wrote 1,330 rows, one for each of the 1,330 FINALIZED post-tests (`evidence/staging/migration-after.txt`).
- **Words:** the guards hold the approved «Peserta», «Kenaikan» and «Penguasaan per bagian» (B5A-PIMPINAN-K01, B5C-BUKTI-K01; D-157(a)). The walks read the same words (`audit/c12.mjs`, `audit/staging/golden-school-laporan.mjs`).

## 3. Authorisation and visibility, at the database

| Read or act | Given to | Refused (tested) | Evidence |
|---|---|---|---|
| `sertifikat_sekolah`; the revocation | CAN_PUBLISH at the certificate's school; Admin platform for every school | a Guru, a head of department, another school's admin; a revocation without a reason | F26-C01, F26-C02, BOB07-K01 |
| The integrity reads and decision | CAN_REVIEW_INTEGRITY at the school | another school; PD signals for every school role, and a platform referral refused (`PR090:PD_SIGNAL_NOT_REFERRED`) | F26-I01; journey C12g (D-069(c)) |
| The waiting-list reads | `persons_awaiting_account`'s own rule | another school | F26-W01 |
| `tujuan_belum_tercapai` | the class's own teacher, for a learner placed in the class | another class's teacher, another school's teacher, the admin with no teaching role, the teacher asking under another class; anonymous | F25-T02 |
| `result_views` | through two functions, scoped to `current_person_id()` | any direct client access | `evidence/B5B/ux40-db-bukti.*`; B5B-HASIL-K01 |
| The PD record and results | D-069(b)'s audiences | another Guru, another Kepala departemen, a student | journey C12f; BOB43-D01, BOB43-K01 |

- Every new function is SECURITY DEFINER with a pinned search_path, and none is open to anonymous callers. Three are internal. Read on staging after the merge (`batch-5/04` §2).
- No new code uses the service key (Batch 5 §3).

## 4. Design and terminology across connected surfaces

- **Approved words kept:** the words that were silently replaced were restored (D-157(a)). The walks were set back to them, and no application code changed for it (`batch-5/03` §4).
- **No academic word on a PD surface:**
  - «Lihat per soal» is offered only where the per-question page admits the reader. It derives from the page's own rule (`adaBuktiSoal`), on every link. R5-PERSOAL-01 is red on the three links that offered it (retrospective R5-5; H §4 X3).
  - A PD class's evidence page asks for no class metric (D168-C2-1, E-C2-2).
- **Navigation:** the report pages sit in the staff shell (DAISY-02-KELUAR-01, DAISY-07-LAPORAN-01, HOD09-K01). A teacher's refusals end with the staff line (B5C-TOLAK-K01, UX1-AJAR-KATA-01).
- **Gaps:**
  - «Peserta» names both the learners assessed and a PD participant (RV-9; W3.9's distinct words await Dr Gladys).
  - The PD footnote names the Kepala departemen as the reviewer of PD integrity signals (H §4 X4, open with Daisy and Dr Gladys).
  - «murid» on a PD class (E-C2-1): the presentation is blocked on C2.
  - The engineering-written strings await Dr Gladys (`02` Q3).

## 5. Exceptional conditions and multi-context journeys

- **Revoked:**
  - «Lanjutkan» commits nothing, focus starts on «Batal», the first revocation stands (B5-W1, staging K1);
  - a revoked sheet shows no QR or link (B6C-DATA-01, Batch 6).
- **Empty:**
  - nobody waiting, on the whole platform (staging K3);
  - no observation waiting (staging K2);
  - a chapter with no Pemetaan Awal is not offered one (B5B-PEMETAAN-K01);
  - a missing recording says so (B5B-MEDIA-K01).
- **Refused:** the certificate refusal goes back to «Sertifikat» (B5B-SERTIFIKAT-K01).
- **A platform administrator in «Seluruh platform»:**
  - revokes on the screen (B5-W1);
  - reads Aktivasi's list (staging K3: nobody waiting);
  - is refused a PD referral (C12g).
- **A person in two contexts:** the Guru learning as a participant is one person, still EDUCATOR, holding Mengajar and Belajar on the chooser (C12k, D-132).
- **A staff member who is also learning:** the Belajar door and the adult shell for a teaching senior (B5B-AJAR-K01, UX1-AJAR-KONTEKS-01); the Guru's path through both Bab (C12d).
- **Leaving a persona:** the evaluator returns to the Hub signed in, and sign-out ends both sessions (`audit/b5-fokus.mjs` F1).
  - Recorded, not a gap: a persona token copied out of the browser stays valid until it expires (`03` §6, ADR-0020).
- **Gaps:**
  - On staging, no observation was waiting and nobody waited for an account. So the per-observation decision, the referrer's outcome and a populated pager ran in CI only (`04` §3).
  - Staging holds no evaluation persona, so MODE PERAGAAN was not walked there. UX-40 and the tour were not walked there either.
  - The whole-class card run over the per-class read was never walked in a browser, only in CI's step M7 (`01` §5 item 8).
  - No test reads a learner who is placed at two schools on these pages.

## 6. Regression

- **Restated, none weakened, each with its reason** (`01` §4):
  - F21-I01, L4-K01, PENUTUPAN-I01;
  - M7-K01, CR91-K02;
  - DAISY-02-KELUAR-01, DAISY-07-LAPORAN-01, HOD09-K01;
  - UX1-TUR-AKSES-01, UX1-AJAR-KONTEKS-01, UX1-AJAR-KATA-01;
  - UX1-BRAND-02, UX1-TUR-ORANG-01.
- **The full local suite:** 756 passed, 0 failed (`evidence/full-suite-local-d920c58.txt`).
- **Rollback:** `ROLLBACK-189-193.sql` was tried in both directions, and F25 and F26 then passed 6/6 (`evidence/rollback/ROLLBACK-189-193-local-test.txt`).
- **Staging preservation:** the demonstration school and every record outside the test schools are identical before and after (`evidence/staging/preservation-before.txt`, `-after.txt`). Re-read unchanged at P-1 (`batch-8/evidence/staging-pascaperiksa-p1.md`).
- **Later promotions:** the Batch 5 walk stays green: P-1 42059820670, P-5 42326802001, P-7 42426258818.

## 7. End-to-end journeys

- **Job A:** the Batch 5 walk B5-W1–W6 and the focused checks F1–F2 (`audit/b5-ujung.mjs`, `audit/b5-fokus.mjs`).
- **Job B:** Gladys's path, with S23i, S23r, S23t and C-12 (C12a–C12k).
  - Journeys 41640031926 on `b8ba042`.
  - Journeys 41644821806 on `469dde2`.
- **On staging:** «Sekolah Uji B5 1104» (`04` §3).
  - GS-01–21: 41709137424, 41710125178, 41711982035, 41713430814.
  - The Batch 5 walk: 41719638878, K0–K5 6/6.
  - Accessibility: 41720925812.
- **Human journey:** not accepted (no recorded walk by a person).

## 8. Evidence

- **CI:**
  - `ci` 41640033654 on `b8ba042`;
  - `ci` 41644822454 on `469dde2`;
  - on the merge `3412075`, `ci` 41707829722: attempt 1 failed on runner infrastructure and is kept as failed; attempt 2 is green.
- **Staging migration:** `staging.yml` 41707829723.
- **Screens:** `evidence/walk/run4-fresh-ci-order/`, `evidence/fokus/fresh-ci-order/`, `evidence/B5A/`, `evidence/B5B/`.

## 9. Cross-feature UX consistency (D-172)

- **Destructive confirmation:** the in-page Confirmation, never the Dialog (Daisy GQ5): a required reason, a red act naming the thing, focus on «Batal» (B5-CABUT-K01).
- **Paging:** the collection pager draws «Berikutnya» in one grammar on Aktivasi and the certificate list (B5-TUNGGU-K01; staging K3's E-K2).
- **Refusals:** the staff recovery line for staff (B5C-TOLAK-K01).
- **The tour:** non-modal, dismissible and keyboard-operable (D-157(b); `b5-fokus` F2).
- **Widths:** 320–1280 px with no sideways scroll, and axe clean on each walked screen (`01` §2.3).
- **Gaps:**
  - No Daisy side-by-side comparison of Batch 5's screens with their equivalents is recorded.
  - C2's PD presentation is blocked.
  - No screen-reader pass by a person (W6.12).

## Verdict

- **Integration for Batch 5: partial.**
  - Checks 1–3 and 6–8 have evidence.
  - Checks 4, 5 and 9 have gaps: the RV-9 and X4 words, C2's presentation, the staging-unexercised exceptions, a person in two schools, Daisy's comparison and the screen reader.
- **UX consistency: partial. Human journey: not accepted.**
- Ledger note: H §3b's Batch 5 row says «no dossier». This dossier now exists, and the integration gate stays **partial**. The row's evidence should also say that W2.7's decision and W2.10's pager were proven in CI only, not on staging.

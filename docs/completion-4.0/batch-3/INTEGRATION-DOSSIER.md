# Integration dossier · Batch 3 · Studio and teaching (W1.1–W1.14, W2.4, W3.11, W3.17, W3.18, W6.5/W6.7), in the form of H §2

**Status:** drafted 8 Nov from the batch's records (`01`, `04`, `05`, `06`), the register (`C-OPEN-WORK-REGISTER` W1.x, W2.4, W3.11–W3.18, W6.5), the retrospective (`retrospektif/01-REGISTER.md` R3-1…R3-9, `04-REKONSILIASI-BALIK.md`) and the latest staging record (`batch-9/evidence/staging-p7.md`). Every test id below is in `selftest/manifest.json`. A check with gaps says so.

## 1. Dependencies

| Surface (page) | Reads / writes (database) | Read by |
|---|---|---|
| `/studio` (home) | `studio_home` (migration `20261216100000`: newest version per line only) | Konfigurasi «Yang menunggu» (ACTION_REQUIRED, AWAITING_MY_REVIEW; B4-MENUNGGU-K01) |
| `/studio/unggah` | the workbook contract (`src/lib/unggah-kontrak.ts`, `src/lib/xlsx.ts`), the example workbook (`src/components/unggah/contoh.ts`) | the package page |
| `/studio/paket/[course]` | `langkah_konten`, `kembalikan_paket`, `content_review_outcomes`, `course_revision_notes`, `nama_riwayat_paket` (`20261215100000`), `items`/`item_options` (`src/lib/soal-tinjauan.ts`) | Studio home; Siapkan (the release) |
| `/studio/bank` | `items`, `item_options` (CAN_DRAFT); `question_health` (CAN_REVIEW_QUESTION_HEALTH) | — |
| Studio tabs | `src/lib/studio-tab.ts` from role capabilities | every Studio page |
| `/mengajar/[kelas]/siapkan` | `assign_release`; `statusMateri` (`src/lib/pengajar.ts`) | the class page's «Materi untuk kelas ini» (same `statusMateri`); the learner's Belajar |
| `/mengajar/[kelas]/uji-cepat`, `…/hasil` | `launch_quick_assessment`; official results; `AMBANG_NILAI_KELAS` (`src/lib/hasil-ujicepat.ts`) | certificates (QUICK does not certify) |
| The PD course (C-12) | the same Studio path with Konteks «Pengembangan profesi» | `/pengembangan`, the PD record (Batch 5/9) |

## 2. Data contracts and consumers: one fact, one value

- **The waiting count:** Studio home and Konfigurasi «Yang menunggu» both read `studio_home`'s buckets. The superseded version is left out of all three (F23-W06, STUDIO3C-BERANDA-02, the list and the function together); B4-MENUNGGU-K01 names the same buckets.
- **A class's material state:** the Siapkan badge and the class page read one `statusMateri` / `nadaMateri` (STUDIO3C-SIAPKAN-01; walk U10/T10). Defect 2 (`batch-3/04` §6) was two readers of one fact; fixed at source (`05` §1.2).
- **Who reviewed:** «Riwayat perbaikan» names only what `content_review_outcomes` and `course_revision_notes` record (F23-W05, STUDIO3A-RIWAYAT-01).
- **Refusal codes:** each `kembalikan_paket` refusal reaches the screen by its code (`src/lib/galat-kontrak.ts`; STUDIO3A-KEMBALI-01); a published or withdrawn package still shows its refusal (BOB07-R01).
- **The question list:** every question is read, past the API's 1,000-row limit, and a failed read is not shown as a shorter package (R3-SOAL-01; R3-1).
- **The Uji Cepat figure:** the mean of official scores from five (D-176, D-170(a)), one threshold `AMBANG_NILAI_KELAS`; the count line is the shared `kalimatJumlahOrang` the reports use (MENGAJAR3-HASIL-01, R3-PESERTA-01).
- **The workbook:** the example builds to the same bytes and reads back as one «Contoh — » course (STUDIO3B-CONTOH-01).
- **Gap:** X12 (H §4): one object, three words: «paket» on screens, «kursus» in 15 Indonesian strings, the workbook sheet and the certificate list. It waits on C9 (Dr Gladys and the owner).

## 3. Authorisation and visibility, at the database

| Read / act | Given to | Refused (tested) | Evidence |
|---|---|---|---|
| `items`, `item_options` (questions, keys, reasons) | CAN_DRAFT in the school (Guru, Kepala departemen, Admin sekolah) | the learner; another school's teacher; another school's admin | D088H-S01, F23-W07; staging T10b (28 listed, 0 of another school), T11 (no key) |
| `question_health` | CAN_REVIEW_QUESTION_HEALTH | the Guru (no row, no count) | F23-W07; staging policies read in `06` §4 |
| `nama_riwayat_paket` | a Studio worker (CAN_DRAFT/CAN_REVIEW) on that package's school | the same school's Dekan, another school's admin, an unknown package id, `anon` (42501) | F23-W05 (a planted all-persons version failed on 8 counts); staging T16 (read-only, rolled back) |
| Content steps, send-back | the head of department (CAN_REVIEW, not the author) | a step refused mid-tree leaves no mixed tree | F23-W01, F23-W02, F23-W03 |
| `studio_home` buckets | the reader's own | — | F23-W06 |
| `launch_quick_assessment` | an in-scope educator | a Dekan, an out-of-scope educator, an out-of-bounds size | F04-T04 |
| A certificate from an Uji Cepat | nobody | `certificate_prepare` raises | F19-Q01, F19-Q03; walk U13–U15, staging T14 |

- The new function is SECURITY DEFINER with a pinned search_path and a STAFF registry row; `anon` cannot execute it on staging (`04` §2; `06` §2 for `studio_home`).
- **Gap:** no test asks `nama_riwayat_paket`, `studio_home` or the bank as the **platform administrator**; the platform admin's Studio tabs are proved from source only (PENUTUPAN-T01).
- **Gap:** the Uji Cepat result page's reader set has no database test in this batch; MENGAJAR3-HASIL-01 reads the source.

## 4. Design and terminology across connected surfaces

- **The same steps everywhere:** J1Terbit's steps on the package page and «✓ Terbit» / «Sekarang: …» on Studio home (STUDIO3A-J1-01, STUDIO3A-BERANDA-01); side by side with Daisy in `evidence/sisi/`, then after the closure in `evidence/sisi-penutupan/`.
- **Words:** «murid», no «(D-008)», the reader's locale (STUDIO3A-BAHASA-01, STUDIO3B-KATA-01); A4's corrected English (R3-A5-01; R3-2).
- **PD surfaces:** the Uji Cepat count line takes the place kind's noun (R3-PESERTA-01; `ketiadaan.jumlah.peserta`).
- **Navigation:** the package page's one h1 under Studio (B10, R3-3); the way on from «Sediakan» to the class page (U10, `05` §1.4).
- **Gaps:** X12 above; C3's «arah berpikir» and C9 BLOCKED on Dr Gladys (R3-2); B7, B9, B11's words await copy approval (R3-3); A1's new words are in Dr Gladys's pack B28 (register W1.2).

## 5. Exceptional conditions and multi-context journeys

- **Refused upload:** row, column and «Belum ada yang disimpan»; no course made (U1; staging T2).
- **Sent back, corrected, superseded:** the replaced version is history, not a task (F23-W06; U7a, T7a).
- **Half-done release:** created, lock refused; the page states the step, the reason and «Kunci terbitan» again (STUDIO3A-SEPARUH-01).
- **Empty lesson; failed or truncated read:** kept as «(0 soal)»; a failed read refused (D088H-K01, R3-SOAL-01).
- **Below the threshold:** no class figure below five scored, with the count and the threshold (D-176; MENGAJAR3-HASIL-01).
- **Window ended or not yet open:** «Selesai», «Dijadwalkan» (STUDIO3C-SIAPKAN-01).
- **A synthetic school:** the Uji Cepat score reads «Belum ada nilai» (`01` §5), so the walks use an official school.
- **A staff member who is also learning:** the Guru enrolled in the PD course made through Studio (journey C12c content, C12d the Guru's journey, `audit/c12.mjs`).
- **A person in two contexts:** the bank lists only the schools the reader browses (STUDIO3C-BANK-01); L3 decides Studio by the pair's capabilities (F22-P02).
- **A platform administrator in «Seluruh platform»:** «Seluruh platform» serves only Konfigurasi and Aktivasi (F22-P02). **Gap:** no walk or database test of the platform admin in Studio in a school context, or of what «Seluruh platform» shows when Studio is asked for.

## 6. Regression

- **Restated, rule unchanged, each marked:** DAISY-06-TERBIT-01, D140-STUDIO-01, POLISH2-STUDIO-01, STUDIO3A-AKUI-01, PENUTUPAN-T01 and BOB41-K01 («RESTATED FOR F-7»), D088H-K01 and D168-A1-1 (A1) (`01` §4, `05` §2, R3-1).
- **Migration baselines:** UX1-BRAND-02 moved 181 → 182 → 183 with the reading recorded.
- **Journeys that consume Studio:** S17, S17t, C12c and S26f were updated to the combined press and the grouped findings (`01` §6, runs 41456052964 → 41485237768).
- **Staging regressions:** GS-01–21 and accessibility green after each promotion (`04` §3, `06` §3).
- **Preservation:** Dr Gladys's school and every result row outside the test school byte-identical (`06` §5, md5 of whole rows).

## 7. End-to-end journeys

- **CI:** `audit/studio-ujung.mjs` U0–U15 with U7a, U7b (A1) and U10b, in journeys job A (`.github/workflows/audit-journeys.yml`); C-12 in job B (`audit/c12.mjs`).
- **Staging:** `audit/staging/golden-school-studio.mjs` T0–T16 with T7a, T10, T10b.
- **J-numbers:** J1 (J1Terbit), J4.1–J4.12, J5.4–J5.7.
- **Gap:** the staging walk has no step for A1's lesson-at-a-time review (no T7b; U7b runs in CI only).
- **Human journey:** not accepted (no recorded walk by a person). Dr Gladys's Studio attempt is what D-141 deferred.

## 8. Evidence

- **Branch:** CI 41485243098, journeys 41485237768 on `8a75689`; local walk JSON, log and screenshots in `evidence/w65/`.
- **Promotion (D-149):** CI 41521853943 on `82de96e`; merge `a5e2935`; Studio walk 41536379780 (one walk defect, T14) → 41540087994 PASS; a11y 41541778216.
- **Closure (D-150, D-151):** CI 41549315226 (713 passed); journeys 41556334574 (18/18) on `bbbeba4`; merge `cb1ff3e`; Studio walk 41570204639 19/19; a11y 41571909539.
- **A1 (R3-1):** CI 42383219451, journeys 42383221915 on `bd4c2c06`.
- **Later staging:** W6.5 42057142327 (`batch-8/evidence/staging-pascaperiksa-p1.md`); P-5 42325413782; P-7 42425742473, 19/19 (`batch-9/evidence/staging-p7.md`).

## 9. Cross-feature UX consistency (D-172)

- **One shared result and confirmation:** each step's result in the next panel (STUDIO3A-LANGKAH-01); the send-back is the one Confirmation, with focus in the reason (STUDIO3A-KEMBALI-01; walk U4).
- **One empty state:** Studio and Mengajar use `Kosong` (MENGAJAR3-KOSONG-01, R2-KOSONG-01); all 11 Studio surfaces on `pin-*` (STUDIO3B-KELAS-01, UX1-S0-TOKEN-01).
- **Forms:** «(opsional)» is one key (`bentuk.opsional`, R3-A5-01); dates in words (MENGAJAR3-JENDELA-01).
- **Badges:** a row's badge shows once at every width (R3-LENCANA-01; walk U5 at 1280 and 390 px).
- **Canonical patterns (D-173(b)):** the recount for A1 #10 (P1, P9, P15) holds by STUDIO3A-J1-01, D168-K2-1 and R3-SOAL-01 (`04-REKONSILIASI-BALIK.md` §6).
- **Widths, axe, keyboard:** the package page at 1280, 820, 390 and 320 px with a judged axe run and, at 1280, the keyboard (`audit/rb-ujung.mjs` RB1-A1).
- **Recorded exception:** the Uji Cepat launch's success leaves its form (W3.17, Daisy D5).
- **Gaps:**
  - no Daisy side-by-side for Studio beyond J1Terbit and J5;
  - K8 (the step list's marks) BLOCKED on Daisy (K3);
  - no screen-reader pass by a person (W6.12).

## Verdict

- **Integration for Batch 3: partial.** Checks 1, 6 and 8 complete. Checks 2, 3, 4, 5, 7 and 9 have gaps: X12's words; the platform administrator (at the database and walked); the Uji Cepat result's reader set at the database; Dr Gladys's copy; A1 not walked on staging; a person's screen-reader pass.
- **Human journey: not accepted** (no recorded walk by a person).

Ledger note: H §3b's design cell «A2–A5 open» is out of date. A2 (D-170(a)), A3 (D-176), A4 (D-171(b)) and A5 (D-173(a)) are accepted and built (R3-2, R3-3, R3-6). What stays open is copy: C3, C9, the words of B7, B9 and B11, and B28.

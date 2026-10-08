# PINTAR 4.0 · Handoff to Codex · 02 · Implementation inventory

**Prepared 8 Oct 2026 for the Codex team. Read-only inventory: no code, test or record was changed to write it, and no test, database or workflow was run for it.**

## 0. Scope, commit and method

**What this describes.** The application on `main` = `8202139`, whose code is identical to `dab5c12` (`aad799b` and `8202139` change documents only). Staging runs `dab5c12` with 177 of 177 migrations (environment-facts run 37782586725).

**What this does not describe.** Production runs an older commit, `5b5b68d`, with 111 migrations. Its database was not read (it needs the owner's permission). 661 code files differ from `main` (run 37782586725). **Nothing below is a statement about production.**

**Sources.**
- Routes: `src/app/**/page.tsx` and `route.ts`.
- Database: `supabase/migrations/` (177 files).
- Tests: `selftest/manifest.json` v185, with 651 entries in three runners: `db` (selftest/db/fable01–22.sql), `static` and `app`.
- Journeys: `audit/journey.mjs` (steps W0–S27h, P1–P3, BD11, L3D, L3A) and `audit/c12.mjs` (C12a–C12k), plus the crawl `audit/crawl.mjs` (14 synthetic personas, every reachable page, at 320 px).
- Requirements: the frozen scope `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md`, cited as J-lines (approved as O1, D-086); `docs/rebuild/03-PINTAR-INVARIANTS.md`, cited as INV-xx.
- Records: `docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md` (CR-xx); `docs/reports/PINTAR-4.0-CLOSURE-STATUS-2026-10-07.md`; the L1–L4 reports; `docs/coordination/DECISIONS.md` (D-001 to D-136).

**Reference runs.**
- CI **37775379355** on `dab5c12`: 18/18 jobs succeeded. The selftest contract exits non-zero on any failure, unreported id or unlisted id (manifest `entry`).
- Journeys **37775382999** on `dab5c12`:
  - Job A (crawl, every role at 320 px): GREEN.
  - Job B: **75 PASS, 1 FAIL**. The FAIL is **S23q**.
  - BD11 PASS on Chromium, Firefox and WebKit.
- Source of these results: the handoff facts and `PINTAR-4.0-CLOSURE-L4-2026-10-08.md` §9.
- **Not re-read:** this inventory did not download the runs' per-step artefacts. A step is called «PASS on 37775382999» because the run's tally names S23q as its only FAIL.

**How statuses were assigned.** Each capability has exactly one status.
- **IMPLEMENTED AND VERIFIED** requires both of these:
  - manifest tests that run in CI 37775379355 cover its core behaviour;
  - where it has a user-facing screen, a journey step of 37775382999 walks that screen.

  It is still given when known minor defects remain; they are listed.
- **IMPLEMENTED BUT NOT FULLY VERIFIED** applies when code and tests exist but one of these holds:
  - no journey step walks the screen;
  - only part of the behaviour is tested;
  - a held defect touches the capability.
- **PARTIALLY IMPLEMENTED** applies when a frozen requirement line or a ruled CR item is not built.
- **NOT IMPLEMENTED, BLOCKED and NOT APPLICABLE / DEFERRED BY APPROVED SCOPE** apply as their names say, each with its ruling or blocker cited.

**Read every status with these limits.**
- **S23q / CR-52** (the Question Bank as QN5 rules it) is an **unresolved, governed exception** (D-123(1), D-133(b)). It is **not a pass**, and the journey suite is **not fully green**.
- **Automated verification is not human acceptance.**
  - **No human acceptance of PINTAR 4.0 is recorded.**
  - D-136(c): APPLICATION READY is a design freeze, «not launch-ready, production-ready or human-accepted».
  - D-133(c): L3 GREEN does not mean ready to launch.
- **No overall completion percentage is given**, on purpose.

---

## 1. Summary

| # | Capability | Status | Key evidence |
|---|---|---|---|
| 1 | Platform operation: founding a school, first administrator, platform health | IMPLEMENTED AND VERIFIED | S2, S3, S4 (37775382999); C1-S01, F08-P07, F22-A02, BOB19-A01 |
| 2 | Sign-in and sign-out (class card, password) | IMPLEMENTED AND VERIFIED | S1b, S5, S11, S13, S21c, BD11, P2; BOB12-A01, F15-C01, F01-R05, L2-TIDAK-DIBUAT-01 |
| 3 | Account activation and provisioning (Gate 3, Aktivasi, class cards) | IMPLEMENTED BUT NOT FULLY VERIFIED | S1, S3, S10, S12, S20 walk it; CR-91 is held; the CR-13 and CR-14 screens are absent |
| 4 | Account recovery (Gates 4–5; D-101; D-102) | IMPLEMENTED BUT NOT FULLY VERIFIED | BOB27-A01, BOB28-A01..A03, D101-A01, D102-A01; no journey step |
| 5 | Shared-computer sessions and device question (Gate 6) | IMPLEMENTED BUT NOT FULLY VERIFIED | BOB29-A01..A03, BD11 (sign-out half); the lock is not walked (CR-17); CR-92 |
| 6 | Working context and chooser (L3) | IMPLEMENTED AND VERIFIED | L3D, L3A, BD11, C12k; F22-K01..K06, F22-A01, F22-P01..P05 |
| 7 | PINTAR ID and staff Digital Card | IMPLEMENTED BUT NOT FULLY VERIFIED | F16-I01, F16-X01, DAISY-20-C17-01; CR-21 (the card is not final) |
| 8 | School structure (Konfigurasi → Struktur sekolah) | IMPLEMENTED AND VERIFIED | S7, S7b, S26; F10-S01..S10, F10-C01..C03, DAISY-05-STRUKTUR-02 |
| 9 | Enrolment and intake (Pendataan) | IMPLEMENTED AND VERIFIED | S8, S9, S20; F06-P18, F09-A03, F10-M01/M02, UX1-DATA-* |
| 10 | Class move and year rollover | IMPLEMENTED AND VERIFIED | S25, S26c, S27; M9-S01, ADM09-S01, ADM19-S01, F01-T08 |
| 11 | Role grants (Peran & akses; BOB19 Option B; D-048/049) | IMPLEMENTED AND VERIFIED | S4, S12, S23d, S24, S26b; F10-V01..G03, F10-C04, F22-A02; L4 finding 6 is open |
| 12 | Transfers between schools | PARTIALLY IMPLEMENTED | F01-T10, F07-P10, FU1921-D01; the screen asks for typed codes (CR-41, W-7); no journey step |
| 13 | Content upload, import and workbook | IMPLEMENTED AND VERIFIED | S14, S15, S15c; F11-P01..P04, BOB02-*, DAISY-06-*, L4-C01 |
| 14 | Studio steps, review, release, publishing, correction | IMPLEMENTED AND VERIFIED | S17, S17t, S26f; F12-*, F05-T17/T22, DAISY-06-TERBIT-02, M10-* |
| 15 | PINTAR library (Pustaka PINTAR) and distribution | IMPLEMENTED AND VERIFIED | S15b, S26d; F05-T01..T15, QAC-T01..T12, F20-K01, M6-S01 |
| 16 | Question bank (Bank Soal) | PARTIALLY IMPLEMENTED | **S23q FAIL** (CR-52, governed exception D-123); F02-T11, BOB41-K01 |
| 17 | Question Health | IMPLEMENTED BUT NOT FULLY VERIFIED | F06-P03, F06-P04, F06-P07, F05-T20b, BOB41-K01; CR-36 (needs data volume) |
| 18 | Assessment rules (Aturan Asesmen) | IMPLEMENTED BUT NOT FULLY VERIFIED | F21-R01, PENUTUPAN-F01, L4-K01; no journey step; unlabelled inputs (L4 §4) |
| 19 | School pass mark (Batas ketuntasan) | IMPLEMENTED AND VERIFIED | S17b; BOB49-S01, BOB49-K01 |
| 20 | Learner home (Belajar) and lesson player | IMPLEMENTED AND VERIFIED | S19, S21c, S21e..S21h, S22b; W2-K01, W3-K01, W5-K01, J613-K01, J614-K01, L4-P01 |
| 21 | Pemetaan Awal and Uji Penguasaan (the learning cycle) | IMPLEMENTED AND VERIFIED | S19, S21, S21d; F13-P01/P02/N01/N02, F03-T01/T02, F02-T23 |
| 22 | Uji Cepat | PARTIALLY IMPLEMENTED | S26e, S27h; T2-S01, QAC-*, F19-Q01..Q04; the score is not built (CR-27, J5.6) |
| 23 | Scoring engine, mastery, bands | IMPLEMENTED AND VERIFIED | S21, S21d; F02-T15, F03-T07, F03-T10, F04-T02, F20-Q10, F20-F01, PITA-K01 |
| 24 | Certificate issuance, sealing, numbering | IMPLEMENTED AND VERIFIED | S21i, C12d; F04-T09, F20-S01, F20-C01, ADM18-K01, BOB50-A01 |
| 25 | Public certificate verification | IMPLEMENTED AND VERIFIED | P1, C12d; F04-T10, F04-S05, F01-R07, UX1-S1-QR-01 |
| 26 | Certificate presentation, print, revocation screen | PARTIALLY IMPLEMENTED | CR-03, CR-04, CR-05 open; CR-11 and CR-12 are release items |
| 27 | Student profile photo (J8.8) | NOT IMPLEMENTED | CR-07; no screen found |
| 28 | Teacher views (Mengajar) and evidence | IMPLEMENTED AND VERIFIED | S13, S18, S21b, S22, S22b; UX1-S3-*, W8-K01, EDU23-K01, M4-K01, D088K-S01 |
| 29 | Educator as learner (professional learning) | IMPLEMENTED AND VERIFIED | C12a..C12k; BOB43-D01, C12-D01, F06-P19..P21 |
| 30 | Leaders (Pimpinan) and management decisions | IMPLEMENTED AND VERIFIED | S16, S23, S23d, S23r; UX1-PIMPINAN-*, F06-P15, F06-P22, PENUTUPAN-W01 |
| 31 | Integrity review | IMPLEMENTED AND VERIFIED | S23i, S23r, C12g; F04-T07, F21-I01, PENUTUPAN-I01, L4-K01 |
| 32 | Reports, metrics, report templates | IMPLEMENTED AND VERIFIED | S16, S23, S23t; F06-P06..P16, F08-P03..P06, F14-P01/P02, DAISY-07-LAPORAN-02 |
| 33 | Briefings | NOT APPLICABLE / DEFERRED BY APPROVED SCOPE | QN4 «HIDE FOR 4.0» (D-120), CR-37 |
| 34 | Class feedback rounds (Umpan balik) | IMPLEMENTED BUT NOT FULLY VERIFIED | F07-P01..P15, F07-C01, UX1-UB-ALUR-01; no journey step; no scope source (scope inventory §11 B1) |
| 35 | Evaluation / demonstration room (MODE PERAGAAN) | IMPLEMENTED BUT NOT FULLY VERIFIED | EVAL-T01, EVAL-N01..N1011, EVAL-P01..P04, EVAL-S02; no journey step; no scope source (§11 B2) |
| 36 | «Laporkan masalah» | IMPLEMENTED AND VERIFIED | S23l; BOB15-K01/S01/D01; CR-78 is open |
| 37 | Email (PINTAR's own delivery path) | PARTIALLY IMPLEMENTED | F17-*, BOB25-*, BOB51-*, EMAILJUJUR-*; CR-22 (email standard, J2.15) is open |
| 38 | Maintenance scheduling and emergency stop | IMPLEMENTED BUT NOT FULLY VERIFIED | M148-K01/S01/D01/D02; no journey step |
| 39 | Audit trail | IMPLEMENTED AND VERIFIED | S23j; F01-T11, F01-T19, F08-P10, FU1921-D01; CR-79 is open |
| 40 | Backup and disaster recovery tooling | BLOCKED | #150 verdict **NOT PASS** (D-104..D-111); DR-S01..S17, DR-D01..D03 |
| 41 | Copy table and i18n (`src/lib/hle.ts`) | IMPLEMENTED AND VERIFIED | S21g; UX1-S0-HLE-01, UX1-S0-LANG-01, F06-R01, L4-G01 |
| 42 | Accessibility | IMPLEMENTED BUT NOT FULLY VERIFIED | UX1-S0-CONTRAST-01, UX1-MASUK-AKSES-01, UX1-TUR-AKSES-01; no NVDA or TalkBack pass (D-136(c)) |
| 43 | Responsive layout at 320 px | IMPLEMENTED AND VERIFIED | Crawl job A GREEN (37775382999); PENUTUPAN-L01, UX1-S0-MUAT-01 |
| 44 | Error and not-found pages | IMPLEMENTED AND VERIFIED | P3; BOB07-K03, DAISY-04-TIDAK-ADA-01 |
| 45 | Lesson media playback | NOT APPLICABLE / DEFERRED BY APPROVED SCOPE | D-050(b)(c), CR-53 (bucket E); BOB11-A01/A02 exist |
| 46 | Capacity and responsiveness | BLOCKED | D-089: perf-l1 36964437916 FAIL on Micro; CAP-08 is the owner's; CR-58 not re-measured |

**Count by status (46 capabilities):**

| Status | Count |
|---|---|
| IMPLEMENTED AND VERIFIED | 26 |
| IMPLEMENTED BUT NOT FULLY VERIFIED | 10 |
| PARTIALLY IMPLEMENTED | 5 |
| NOT IMPLEMENTED | 1 |
| BLOCKED | 2 |
| NOT APPLICABLE / DEFERRED BY APPROVED SCOPE | 2 |

---

## 2. Capabilities

### 1. Platform operation: founding a school, first administrator, platform health
1. **Requirement:**
   - J1.1 (D-085 M1), J1.2 (D-001), J1.3, J1.4 (ADM-01);
   - BOB19-K01 Option B (D-133(d));
   - D-084 C1.
2. **Implementation:**
   - `.github/workflows/found-school.yml`;
   - `src/app/konfigurasi/page.tsx` and `actions.ts`;
   - `src/lib/admin-pertama.ts`, `src/lib/persiapan-sekolah.ts`;
   - `src/components/konfigurasi/KartuKesehatan.tsx`.
3. **Database:**
   - `20261108100000_a_school_is_founded_by_a_versioned_step.sql`;
   - `20261003100000_a_school_needs_its_first_administrator.sql`;
   - `20261004100000_an_installation_is_initialised_once.sql`;
   - `20261004110000_a_new_person_can_be_given_their_first_role.sql` (`persons_awaiting_first_role`);
   - `role_assignments_guard` (latest in `20261122100000_…`).
4. **Screens and journeys:**
   - `/konfigurasi` (health card, «Menunjuk admin sekolah pertama»);
   - W0 (operator: first administrator), S2, S3, S4, S12b.
5. **Tests:** C1-S01, C1-K01, F08-P07, F08-P08, BOB19-K01, BOB19-A01, F22-A02, ADM02-K01, F01-T12.
6. **Defects and limitations:**
   - CR-69: a second production platform admin is not named (D-001 asks for one before 23 Sep 2027).
   - The database still lets an active SYSTEM_ADMIN grant any school role. The Option B restriction is enforced in server actions only (`PINTAR-4.0-L3-BOB19-OPTION-B-EVIDENCE-2026-10-08.md` §1).
   - W0 is an operator step in the journey, not a screen.
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:**
   - S2, S3 and S4 PASS on 37775382999;
   - F22-A02 and BOB19-A01 in CI 37775379355;
   - Golden School 37743344493 walked the first-admin path on staging (D-133(a)).

### 2. Sign-in and sign-out (class card, password)
1. **Requirement:**
   - J2.1, J2.5, J2.8, J2.9, J2.19;
   - D-009 as amended by D-055; D-010; D-054(a); D-082(a);
   - INV-21, INV-37.
2. **Implementation:**
   - `src/app/masuk/page.tsx` and `actions.ts`;
   - `src/app/api/masuk/kartu/route.ts`, `src/app/api/masuk/password/route.ts`;
   - `src/app/keluar/route.ts`, `src/app/auth/callback/`;
   - `src/lib/kartu-masuk.ts`, `src/lib/keluar.ts`, `src/lib/tujuan.ts`;
   - `src/proxy.ts`.
3. **Database:**
   - `20261005110000_a_provisioned_person_can_sign_in.sql`;
   - `20261019100000_a_card_waits_after_failures.sql` (`card_signin_attempt`, `card_signin_settle`);
   - `20260912004321_identity_enrollment.sql`;
   - `signin_resolve` (`20261112100000_…`).
4. **Screens and journeys:**
   - `/masuk`, `/keluar`;
   - S1b, S5, S11, S13, S21c, BD11, P2 (a stranger cannot sign up).
5. **Tests:**
   - F01-R05, F01-R06;
   - BOB12-K01, BOB12-K02, BOB12-A01;
   - F15-P01, F15-P02, F15-N01, F15-C01;
   - F09-A01, F09-C01;
   - L1-TUJUAN-01, L1-SENSUS-01, L2-KONTRAK-01, L2-TIDAK-DIBUAT-01;
   - UX1-MASUK-KONTRAK-01, UX1-MASUK-PRIVASI-01;
   - BOB05-K01, BOB05-R01, BOB06-R01;
   - DAISY-02-KELUAR-01, DAISY-13-KARTU-01, DAISY-13-KARTU-02.
6. **Defects and limitations:**
   - CR-25: production `5b5b68d` still offers the magic link (release item).
   - CR-24: the existing-staff transition has not been rehearsed (release item).
   - CR-90 (BD-11) closed in L1 (`PINTAR-4.0-CLOSURE-L1-2026-10-07.md`).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** the steps above PASS on 37775382999, BD11 on three engines; the tests run in CI 37775379355.

### 3. Account activation and provisioning (Gate 3, Aktivasi, class cards)
1. **Requirement:**
   - J2.2, J2.3, J2.4 (D-077), J2.16–J2.18, J2.21, J3.7 (D-085 M7);
   - D-019, D-054(b)–(d), D-102;
   - CR-13 (QN1, D-120/D-122(1)), CR-14.
2. **Implementation:**
   - Self-activation: `src/app/aktifkan/page.tsx`, `src/app/api/aktifkan/*` (kode, username, password, pin, nama, selesai);
   - Admin side: `src/app/aktivasi/page.tsx`, `src/app/api/akun/{aktivasi,kartu,kartu-kelas,pin,email}/route.ts`;
   - Contracts and screens: `src/lib/aktivasi.ts`, `src/lib/aktivasi-kontrak.ts`, `src/lib/koreksi-email-kontrak.ts`, `src/components/aktivasi/*`.
3. **Database:**
   - `20261005120000_activation_is_granted_not_inferred.sql`;
   - `20261021100000_an_identity_foundation.sql` (`person_usernames`, `person_pins`, `account_setup`);
   - `20261112100000_a_person_activates_their_own_account.sql` (`confirm_my_name`, `correct_person_name`, `password_write_permit`);
   - `20261123100000_an_activation_ends_its_own_first_session.sql`;
   - `20261203100000_a_wrong_email_is_corrected_by_whom_the_owner_ruled.sql`;
   - `20261114100000_a_refused_email_is_never_called_sent.sql`.
4. **Screens and journeys:**
   - `/aktifkan`, `/aktivasi`;
   - S1 (activation by emailed code and wizard), S3, S10 (class card), S12, S20 (a class set of cards, M7).
5. **Tests:**
   - F09-A02, F09-C02;
   - F16-U01, F16-P01, F16-S01, F16-C01..C03;
   - F18-N01..N05, F18-P01, F18-S01, F18-L01, F18-I01, F18-A01;
   - BOB26-A01..A04, BOB26-K01, BOB26-S01;
   - DAISY-20-*, DAISY-09-AKTIVASI-01;
   - D102-A01, D102-S01, D102-D01;
   - F20-E01, F20-E02, PENUTUPAN-E03, PENUTUPAN-A01;
   - M7-K01, F01-T16.
6. **Defects and limitations:**
   - **CR-91 (held, D-131):** a class-card account can be activated for any person waiting for an account, staff included (`src/components/aktivasi/FormAktivasi.tsx:197-212`, per the register).
   - **CR-13:** the email correction works on the server and the route, but there is no button. The register says the button «comes with Daisy's admin screens (S7)» (CLOSURE-STATUS §2). `api/akun/email` is referenced only by `src/lib/koreksi-email-kontrak.ts`.
   - **CR-14:** no screen corrects a person's name (`correct_person_name` exists; no reference to it found in `src/`).
   - **CR-15:** a username correction is an audited platform operation with no screen (bucket D).
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:**
   - S1, S3, S10, S12 and S20 PASS on 37775382999, and the tests above run in CI 37775379355.
   - The status is held below VERIFIED because of the held trust-boundary defect CR-91 and the missing correction screens.

### 4. Account recovery (Gates 4–5; school-assisted recovery, D-101; D-102)
1. **Requirement:** J2.11, J2.12, J2.13, J2.21; D-056; D-100(a); D-101(a)–(f); D-102; X.9.
2. **Implementation:**
   - Routes: `src/app/masuk/lupa/page.tsx`, `src/app/api/masuk/lupa/{kode,password,periksa,pin}/route.ts`, `src/app/api/keamanan/pemulihan/route.ts`;
   - Screens: `src/app/konfigurasi/keamanan/page.tsx`, `src/app/id/[pintarId]/page.tsx` (the page a card's QR opens);
   - Contracts: `src/lib/pemulihan.ts`, `src/lib/keamanan-kontrak.ts`.
3. **Database:**
   - `20261115100000_a_forgotten_password_is_recovered_by_email.sql`;
   - `20261116100000_a_forgotten_password_is_recovered_by_pintar_id_and_pin.sql` (`recovery_by_pin`, `card_reissues`, `authorize_card_reissue`);
   - `20261122100000_a_school_resolves_its_own_recovery.sql` (`recovery_assist_school`, `admin_reset_recovery`, `sesi_akhiri_orang`).
4. **Screens and journeys:** `/masuk/lupa`, `/konfigurasi/keamanan`, `/id/[pintarId]`. **No journey step** walks recovery: `masuk/lupa` and `keamanan` do not appear in `audit/journey.mjs`.
5. **Tests:**
   - BOB27-K01, BOB27-S01, BOB27-D01, BOB27-A01;
   - BOB28-K01, BOB28-S01, BOB28-D01, BOB28-A01..A03;
   - D101-A01, D101-A02, D101-S01, D101-D01;
   - F16-R01, F16-N01.
6. **Defects and limitations:**
   - CR-20 (security notices) is tested, but no notice was read in a staging mailbox walk (register).
   - D-113: the card check after a real recovery runs only on a rehearsal copy.
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:** the app tests run against the running app, Auth and the Mailpit sink in CI 37775379355. No journey step walks the screens.

### 5. Shared-computer sessions and the device question (Gate 6)
1. **Requirement:** J2.10, J2.20; D-055; D-099; D-132(e); CR-17; CR-92.
2. **Implementation:**
   - Pages: `src/app/perangkat/page.tsx`, `src/app/terkunci/page.tsx`;
   - Routes: `src/app/api/sesi/{buka,detak,keluar-semua,kunci,perangkat}/route.ts`;
   - Code: `src/lib/penjaga-sesi.ts`, `src/lib/sesi.ts`, `src/lib/tanda-keluar.ts`, `src/components/PenjagaSesi.tsx`, `src/proxy.ts`.
3. **Database:** `20261117100000_a_shared_computer_locks_and_resumes_with_the_pin.sql` (`device_sessions`, `device_contexts`, `sesi_periksa`, `sesi_kunci_saya`, `sesi_buka`, `sesi_akhiri_semua`).
4. **Screens and journeys:**
   - `/perangkat` («Komputer siapa ini?»), `/terkunci`;
   - BD11 (personal and shared, three engines; sign-out and Back);
   - S21c (two learners, one browser).
5. **Tests:** BOB29-K01, BOB29-S01, BOB29-D01, BOB29-A01..A03; PENUTUPAN-B01; F22-P03.
6. **Defects and limitations:**
   - **CR-92 (D-131):** «Komputer siapa ini?» opened from Akun saya preselects «shared» (`src/app/perangkat/page.tsx:28, 40`, per the register).
   - **CR-17:** the 5-minute lock, PIN resume and 60-minute end are tested (BOB29-*) but have not been walked as staff on «Komputer bersama».
   - D-125: device handoff and Exam Mode are deferred to 4.1.
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:**
   - BD11 and S21c PASS on 37775382999; the BOB29 app tests run in CI 37775379355.
   - The lock and resume have not been walked, and CR-92 is open.

### 6. Working context and chooser (L3)
1. **Requirement:**
   - CR-83 (D-127 Q1–Q3, Q11);
   - D-132 C1–C10, §2.4–§2.11; D-133;
   - design `docs/reports/PINTAR-4.0-L3-WORKING-CONTEXT-DESIGN-2026-10-07.md`.
2. **Implementation:**
   - `src/lib/konteks.ts`, `src/lib/konteks-server.ts`;
   - `src/components/NavKonteks.tsx`, `src/components/PemilihLingkup.tsx`;
   - `src/app/page.tsx` (the chooser), `src/app/akun/page.tsx`, `src/app/mulai/route.ts`.
3. **Database:** `20261210100000_a_session_knows_what_it_is_here_to_do.sql` (`konteks_tempat_saya`, `konteks_dipegang`, `konteks_tetapkan`, `konteks_saya`, `sesi_akhiri_inti`).
4. **Screens and journeys:** `/` (chooser), `/akun`; L3D (door × person table), L3A (two contexts on two devices), BD11, C12k.
5. **Tests:** F22-K01..K06, F22-A01, F22-P01..P05, UX1-AJAR-BELAJAR-01 (restated for L3).
6. **Defects and limitations:**
   - CR-91 and CR-92 are held outside L3 (D-131).
   - Six expressions are semantic keys awaiting Dr Gladys's words (D-131, D-132).
   - Context never widens authority (F22-K06, D-132 §2.11).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:**
   - L3D, L3A, BD11 and C12k PASS on 37775382999;
   - L3 GREEN with the S23q exception (D-133);
   - `PINTAR-4.0-CLOSURE-L3-2026-10-08.md`.

### 7. PINTAR ID and the staff Digital Card
1. **Requirement:** J2.16; J1.8 (C13); D-059; D-072; D-074; CR-21; CR-19.
2. **Implementation:**
   - `src/app/akun/page.tsx`, `src/app/id/[pintarId]/page.tsx`;
   - `src/app/api/akun/kartu/route.ts` and `kirim/route.ts`;
   - `src/lib/aktivasi-kontrak.ts` (`kanonikPintarId`), `src/lib/qr.ts`.
3. **Database:** `20261021100000_an_identity_foundation.sql` (`pintar_id_new`, `persons_pintar_id_guard`, `adalah_persona`).
4. **Screens and journeys:**
   - `/akun`, `/id/[pintarId]`;
   - S1 reaches the end of the wizard (the card is passed through, not asserted: CR-21 in the register).
5. **Tests:** F16-I01, F16-X01 (no persona holds a PIN or PINTAR ID), F18-N05, DAISY-20-C17-01, DAISY-20-LAYAR-01.
6. **Defects and limitations:**
   - **CR-21:** the card is not final. The physical proof is pending (D-074(12)), and so is the wordmark master (CR-56, the owner's licence).
   - **CR-12:** production keys go into escrow (#150 B5).
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:** the tests run in CI 37775379355. The card's final design is open by the register (CR-21, bucket A · DAISY).

### 8. School structure (Konfigurasi → Struktur sekolah)
1. **Requirement:** J3.3, J3.4; D-006, D-022, D-023, D-027; BOB-01, BOB-08.
2. **Implementation:**
   - `src/app/konfigurasi/page.tsx` and `actions.ts`;
   - `src/lib/struktur.ts`, `src/lib/struktur-kontrak.ts`;
   - `src/components/struktur/`.
3. **Database:**
   - `20261006100000_a_school_builds_its_own_structure.sql` (`create_bagian`, `create_tingkat`, `create_kelas`, `rename_school_node`, `school_structure`);
   - `20261012100000_a_school_structure_holds.sql`;
   - `20261002100000_a_school_can_build_its_own_shape.sql`;
   - `20260912004244_organisation.sql`.
4. **Screens and journeys:** `/konfigurasi` (Struktur sekolah); S7, S7b, S26 (deactivation refused with a reason; rename), C12b.
5. **Tests:** F10-S01..S10, F10-C01..C03, BOB01-K01..K03, BOB08-K01, DAISY-05-STRUKTUR-01, DAISY-05-STRUKTUR-02, F08-P01, F08-P02, D006-K01.
6. **Defects and limitations:** none recorded as open in the register for structure.
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S7, S7b and S26 PASS on 37775382999; the F10 suite runs in CI 37775379355.

### 9. Enrolment and intake (Pendataan)
1. **Requirement:** J3.5, J3.6; D-026; D-085 M5a; WP5A.
2. **Implementation:**
   - `src/app/pendataan/page.tsx`, `src/app/pendataan/[pekerjaan]/page.tsx`, `src/app/pendataan/actions.ts`;
   - `src/lib/pendataan.ts`, `src/lib/pendataan-kontrak.ts`;
   - `src/components/pendataan/`.
3. **Database:**
   - `20260926110000_an_import_that_survives_the_power_going_out.sql` (`import_jobs`, `import_rows`, `import_open`, `import_validate`, `import_confirm`, `import_advance`, `import_verify_pilot`);
   - `20260926100000_a_school_gives_a_person_a_number.sql`;
   - `20261014100000_the_intake_refuses_staff_rows.sql`;
   - `20261029100000_a_student_in_a_tingkat_is_placed_in_its_kelas.sql`.
4. **Screens and journeys:** `/pendataan`, `/pendataan/[pekerjaan]`; S8, S9, S12, S20.
5. **Tests:**
   - F06-P17, F06-P18 (1,000-row power-failure scenario);
   - F09-A03, F10-M01, F10-M02, BOB01-M01;
   - UX1-DATA-BERKAS-01, UX1-DATA-TAHAP-01, UX1-DATA-JUJUR-01, UX1-DATA-WENANG-01;
   - POLISH3-PENDATAAN-01, F18-I01.
6. **Defects and limitations:**
   - CR-16 is closed (batch 0).
   - The enrolment picker on Konfigurasi is a long select with no search (L4 §4, for Daisy).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S8, S9, S12 and S20 PASS on 37775382999; the tests run in CI 37775379355.

### 10. Class move and year rollover
1. **Requirement:** J3.4 (ADM-21), J3.6 (ADM-J09), J3.12 (D-085 M9); D-088(i); INV-23.
2. **Implementation:** `src/app/konfigurasi/page.tsx` («Pindah kelas», «Pergantian tahun ajaran»), `src/lib/pindah-kelas.ts`.
3. **Database:**
   - `20261027100000_a_student_moves_class_and_keeps_their_history.sql` (`move_learner_to_class`);
   - `20261028100000_a_new_year_carries_the_whole_class.sql` (`period_rollover`);
   - `20261030100000_learner_access_follows_the_current_placement.sql`;
   - `20260912004527_transfer_rollover.sql`.
4. **Screens and journeys:** S25, S26c, S26d2 (an ineligible learner after a move), S27.
5. **Tests:** M9-S01, M9-K01, ADM09-S01, ADM09-K01, ADM19-S01, D088I-S01, D088I-K01, F01-T08.
6. **Defects and limitations:** CR-43: a rollover changes the whole school with one press. The register asks that it be walked on a separate school.
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S25, S26c, S26d2 and S27 PASS on 37775382999.

### 11. Role grants (Peran & akses; BOB19 Option B; D-048, D-049; D-101)
1. **Requirement:** J3.5; J1.4; D-048, D-049, D-101(b)(e); D-133(d)(e); INV-16, INV-18, INV-19.
2. **Implementation:** `src/app/konfigurasi/page.tsx` and `actions.ts` (Peran & akses), `src/lib/admin-pertama.ts`, `src/lib/lingkup-peran.ts`.
3. **Database:**
   - `20260912004431_authorization.sql` (`grant_role`, `role_assignments`);
   - `20261017100000_a_school_admin_sees_its_own_staff.sql`;
   - `20261018100000_a_grant_needs_the_school.sql`;
   - `20261004110000_a_new_person_can_be_given_their_first_role.sql`;
   - `20261122100000_a_school_resolves_its_own_recovery.sql` (latest `role_assignments_guard`).
4. **Screens and journeys:** `/konfigurasi` (Peran & akses); S4, S6, S12, S23d, S24 (revoke), S26b (replacing a teacher).
5. **Tests:** F01-T04, F01-T22, F10-V01..V03, F10-G01..G03, F10-C04, F08-P08, F08-P10 (a revoke needs a reason), F22-A02, BOB20-A01, ADM06-K01, PENUTUPAN-L01.
6. **Defects and limitations:**
   - **L4 finding 6 (open):** the role list is unbounded, with a revoke form per row, until Daisy's Collection component exists (`PINTAR-4.0-CLOSURE-L4-2026-10-08.md` §7).
   - The database does not narrow SYSTEM_ADMIN grants (see capability 1).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S4, S12, S23d, S24 and S26b PASS on 37775382999; F22-A02 runs in CI 37775379355.

### 12. Transfers between schools
1. **Requirement:** J3.10 (ADM-19, P2); INV-25; CR-41 with W-7 (D-122, bucket A).
2. **Implementation:** `src/app/konfigurasi/page.tsx` and `actions.ts` (transfer form and paged list, L4 §2).
3. **Database:**
   - `20260912004527_transfer_rollover.sql`;
   - `20261121100000_a_record_keeps_what_it_said.sql` (a rejected transfer keeps its reasons).
4. **Screens and journeys:** `/konfigurasi` (transfers). **No journey step:** `transfer` does not occur in `audit/journey.mjs`. The register says the form «takes raw UUIDs no screen shows».
5. **Tests:** F01-T10, F04-T13, F07-P10, F07-P14, FU1921-D01, L4-K01 (transfers paged and named).
6. **Defects and limitations:**
   - **CR-41 / W-7:** the destination is asked for as typed codes; it needs a ruling and words for the pickers (L4 §4).
   - For Admin sekolah, the other school of a transfer shows «—» under the current row security (L4 §8, item 2).
7. **Status:** PARTIALLY IMPLEMENTED.
8. **Evidence:**
   - The database lifecycle is tested in CI 37775379355.
   - No usable screen path exists (CLOSURE-STATUS §2: «Not walkable: now an A item»).

### 13. Content upload, import and workbook
1. **Requirement:** J4.1, J4.6, J4.10; D-007, D-008, D-029, D-030, D-040, D-063; CR-50, CR-82, CR-88 (Q9).
2. **Implementation:**
   - Pages and actions: `src/app/studio/unggah/page.tsx`, `src/app/studio/actions.ts`;
   - Upload panel: `src/components/unggah/PanelUnggah.tsx`, `templat.ts`;
   - Readers and contracts: `src/lib/xlsx.ts`, `src/lib/unggah-kontrak.ts`;
   - Asset routes: `src/app/api/assets/{upload-url,read-url}/route.ts`;
   - Example workbook: `src/lib/contoh-buku-kerja.ts`; the build is kept at `docs/onboarding/contoh/` and is not served.
3. **Database:**
   - `20261007100000_a_lesson_arrives_whole.sql` (`prepare_ingest_batch`, `confirm_ingest_batch`, `lesson_package_check`, `lesson_package_materialise`, `ingest_structured_package`, `may_upload_package_media`);
   - `20260912201500_assignments_and_ingestion.sql`;
   - `20261202100000_a_misconception_belongs_to_its_contents_owner.sql`.
4. **Screens and journeys:** `/studio/unggah`; S14 (Excel workbook), S15 (Paket Terstruktur), S15c (SD 5 Matematika Bab 1, whole), C12c.
5. **Tests:**
   - F02-T21, F11-P01..P04, F11-N01..N03, F13-N03;
   - BOB02-X01, BOB02-X02, BOB02-K01..K03, BOB02-R01;
   - DAISY-06-TEMPLAT-01, DAISY-06-UNGGAH-01, DAISY-06-UNGGAH-02;
   - F20-M01..M03, PENUTUPAN-M04, PENUTUPAN-J01;
   - L4-C01 (nothing served from `public/`).
6. **Defects and limitations:**
   - **L4 finding 1 (MAJOR, fixed):** the example workbook carried live keys and was served from `public/` on staging from `e7fb612` until `dab5c12`. It was withdrawn (L4 §7), and Q9 stays withheld under D-135(e). Production never had it (handoff facts).
   - The JSON import is operator-only (CR-87, L2).
   - The «Miskonsepsi» sheet's template wording is owed (CLOSURE-STATUS §5).
   - Media playback is deferred (capability 45).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S14, S15 and S15c PASS on 37775382999; L4-C01 and the F11 suite run in CI 37775379355.

### 14. Studio steps, review, release, publishing and correction
1. **Requirement:**
   - J4.3, J4.4, J4.5, J4.12 (D-085 M10);
   - D-041, D-088(h), D-127 Q4/Q7/Q8;
   - INV-04, INV-22, INV-32, INV-33, INV-35;
   - CR-84, CR-87, CR-89.
2. **Implementation:**
   - Pages: `src/app/studio/page.tsx`, `paket/[course]/page.tsx`, `tinjau/page.tsx`, `pratinjau/[pelajaran]/page.tsx`;
   - Studio components: `src/components/studio/LangkahTerbit.tsx`, `langkah.ts`;
   - Studio libraries: `src/lib/studio-tab.ts`, `src/lib/terbitan-kontrak.ts`, `src/lib/soal-tinjauan.ts`;
   - Lesson renderer: `src/components/pelajaran/Halaman.tsx`.
3. **Database:**
   - `20260912114854_content_lifecycle.sql`, `20260912124007_content_freeze_hash.sql`;
   - `20260912200500_validator_and_publish_readiness.sql`;
   - `20261009100000_a_course_is_released.sql` (`create_release`, `freeze_release`, `publish_release`, `withdraw_release`);
   - `20261016100000_release_blockers_speak_in_codes.sql`;
   - `20261105100000_a_sealed_chapter_keeps_its_tests_questions.sql`, `20261106100000_a_correction_arrives_in_its_line.sql`;
   - `20261207100000_an_authors_difficulty_is_read_as_the_author_wrote_it.sql`.
4. **Screens and journeys:** S17 (seven steps, two people), S17t (review queue), S26d (Bab 2 published), S26f (correction published as 1.1.0), C12c.
5. **Tests:**
   - F02-T01..T10, F02-T19;
   - F05-T16, F05-T17, F05-T19, F05-T22;
   - F12-P01..P05, F12-N01..N03, BOB03-K01, BOB07-K02, BOB17-K01;
   - DAISY-06-TERBIT-01, DAISY-06-TERBIT-02, DAISY-16-HAMBATAN-01;
   - D088H-S01, D088H-K01;
   - M10-S01, M10-S02, M10-K01, M10-K02, DAISY-31-PINDAH-01/02;
   - PENUTUPAN-T01, PENUTUPAN-D01, F21-D01, L4-P01, FU1921-D01.
6. **Defects and limitations:**
   - The question review layout has no style yet (L4 §4, for Daisy).
   - Mode labels follow Terminology v1 only in part (D-134; L4 §7).
   - A staff word for one misconception is missing (L4 §4).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S17, S17t, S26d and S26f PASS on 37775382999; the tests run in CI 37775379355.

### 15. PINTAR library (Pustaka PINTAR) and distribution
1. **Requirement:** J1.5, J4.11 (D-085 M6); D-029; ADR-0018; CR-51 (D-120 Q7, D-122).
2. **Implementation:** `src/app/studio/kanonik/page.tsx`, `src/app/studio/kanonik/[terbitan]/page.tsx`; `src/lib/pengajar.ts` (`pintarDariDistribusi`).
3. **Database:**
   - `20260915100000_canonical_tenant_kind.sql`, `20260915110000_release_distributions.sql`, `20260915140000_canonical_read_path.sql`;
   - `20260916110000_quick_assessment_over_canonical.sql`, `20260916130000_supersession_is_not_withdrawal.sql`;
   - `20261103100000_a_teacher_sees_what_a_pintar_chapter_holds.sql`, `20261204100000_the_platform_admin_prepares_the_pintar_library.sql`.
4. **Screens and journeys:** S15b (the library is the platform admin's own place), S26d («Materi sekolah», M6), C12j.
5. **Tests:** F05-T01..T15, F05-C01, QAC-T01..T12, F20-K01, M6-S01, M6-K01, PENUTUPAN-P01.
6. **Defects and limitations:**
   - CR-51 asked that staging's Bab 1 be re-imported into the library (D-122). No closure record for it was found.
   - The second production platform admin needed for approval is CR-69 (open).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S15b and S26d PASS on 37775382999; the F05 and QAC suites run in CI 37775379355.

### 16. Question bank (Bank Soal)
1. **Requirement:**
   - J4.8 (D-050(a)(d));
   - QN5 (D-120): «browse, filter and review with the answer key and reason; no additional authoring workflow»;
   - CR-52; D-123(1); INV-12.
2. **Implementation:** `src/app/studio/bank/page.tsx`; `src/lib/kesehatan-soal.ts`.
3. **Database:** `20260912132335_bank_tier_isolation.sql`; `20260912200213_views_aggregates_question_health.sql`.
4. **Screens and journeys:** `/studio/bank`; **S23q**.
5. **Tests:** F02-T11 (three-tier isolation), BOB41-K01, POLISH2-STUDIO-01, L4-K01 (the bank's words).
6. **Defects and limitations:**
   - **CR-52, as walked on 7 Oct (register):**
     - browse lists the newest 40 only (14 older questions were unreachable);
     - there is no filter;
     - the key and reason are not on the bank and have no link.
   - D-123(1) asks for three things: useful filtering or search; every applicable question reachable; a natural review with key and reason.
   - Bank Soal's opposite difficulty scales go to CR-85 (D-130).
7. **Status:** PARTIALLY IMPLEMENTED.
8. **Evidence:**
   - **S23q FAIL on 37775382999.** This is the governed exception (D-123, D-133(b)), not a pass.
   - It has stayed the one FAIL on every journey run since D-123 (37705723825, 37720149799, 37739845001, 37762173449, 37775382999).

### 17. Question Health
1. **Requirement:** J4.9 (HOD-06, P2; D-061 #6 is EC); CR-36.
2. **Implementation:** `src/app/studio/bank/page.tsx` (review form); `src/lib/kesehatan-soal.ts`; `src/lib/kesehatan-skema.ts`.
3. **Database:**
   - `20260918150000_question_health_computation.sql`, `20260918160000_question_health_trail.sql`, `20260918170000_health_begins_at_the_beginning.sql`;
   - `20261208100000_a_reviewed_observation_leaves_the_waiting_list.sql`.
4. **Screens and journeys:** `/studio/bank`. No journey step walks a health review.
5. **Tests:** F06-P03, F06-P04, F06-P07, F05-T20, F05-T20b, BOB41-K01.
6. **Defects and limitations:**
   - CR-36: it needs 30 answers per question, so «the human journey cannot run on a demo» (register, outside the gate).
   - The measured difficulty and its evidence count need words (L4 §4).
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:** the database tests run in CI 37775379355. No walk exists.

### 18. Assessment rules (Aturan Asesmen)
1. **Requirement:** FD-9 (D-127 Q8; DG-30); CR-84, CR-87, CR-89; D-128(g); D-134 (term N9 «Aturan Asesmen»); INV-29.
2. **Implementation:** `src/app/studio/definisi/page.tsx`; `src/app/studio/actions.ts` (`saveDefinitionAction`); `src/components/koleksi/Penomoran.tsx`.
3. **Database:**
   - `20261209100000_a_rule_is_set_while_its_chapter_is_drafted.sql`;
   - `20260914091500_scoring_policy_registry.sql`, `20260914093000_mode_policy_quick_assessment_integrity.sql`.
4. **Screens and journeys:** `/studio/definisi`. **No journey step** (`studio/definisi` does not occur in `audit/journey.mjs`); the crawl renders it.
5. **Tests:** F21-R01, PENUTUPAN-F01, PENUTUPAN-T01, F05-T18, F04-T17, L4-K01, L4-G01.
6. **Defects and limitations (L4 §4):**
   - six inputs are labelled by placeholder only;
   - the limits line needs words;
   - `NONE / ITEMS / ITEMS_AND_OPTIONS` needs words;
   - it is not teacher UI (Q8; PENUTUPAN-T01).
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:** F21-R01 and PENUTUPAN-F01 run in CI 37775379355. No walk exists, and the labels are open.

### 19. School pass mark (Batas ketuntasan)
1. **Requirement:** J3.8; D-081; D-086(b); D-088(b).
2. **Implementation:** `src/app/konfigurasi/page.tsx` (Batas ketuntasan); `src/lib/batas-ketuntasan.ts`.
3. **Database:** `20261102100000_a_school_sets_its_own_pass_mark.sql` (`school_pass_marks`, `set_school_pass_mark`, `seal_assignment_pass_mark`, `seal_session_pass_mark`).
4. **Screens and journeys:** S17b (Sediakan is refused before the mark is set; the admin sets it); C12c.
5. **Tests:** BOB49-S01, BOB49-K01.
6. **Defects and limitations:** none recorded open.
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S17b PASS on 37775382999.

### 20. Learner home (Belajar) and lesson player
1. **Requirement:**
   - J6.1–J6.6, J6.9, J6.12–J6.14;
   - D-020, D-032, D-085 T1/W2;
   - INV-01, INV-17;
   - CR-29, CR-30, CR-31.
2. **Implementation:**
   - Pages: `src/app/belajar/page.tsx`, `src/app/belajar/[tugas]/{page,pelajaran/[pelajaran]/page,peta/page,lanjut/page,hasil/page}.tsx`;
   - Player: `src/app/belajar/_components/{LessonPlayer,ItemPlayer,PermukaanAsesmen}.tsx`;
   - Renderer and rules: `src/components/pelajaran/Halaman.tsx`, `src/lib/siklus.ts`, `src/lib/kumpulkan.ts`, `src/lib/bantuan-terjadwal.ts`.
3. **Database:**
   - `20260913090000_learning_cycle_delivery.sql`, `20260913093000_lesson_progress_and_assistance.sql`;
   - `20261008100000_lesson_content_is_not_public.sql`;
   - `20261005100000_an_answer_is_never_lost_to_a_finish.sql`;
   - `20261107100000_a_teacher_asks_learners_to_read_again.sql`.
4. **Screens and journeys:**
   - S19 (find Bab 1 and reach its pre-test);
   - S21 (reload, network loss, and «Kumpulkan» without «Simpan»);
   - S21c (shared browser), S21e (another device), S21f (nothing waiting), S21g (ID/EN), S21h (review);
   - S22b (read again).
5. **Tests:**
   - Placement and saving: W2-K01, W3-K01, W5-K01, BOB22-K01, BOB23-K01..K03;
   - Home and next action: J613-K01, J614-K01, UX1-S2-ORIENT-01, UX1-S2-POSISI-01, DAISY-10-SAPA-01/02, DAISY-26-BELAJAR-01, DAISY-30-TEKS-01, L4-P01;
   - Engine and network: F03-T03, F03-T05, F03-T06, F03-T11 (pause), F03-R01, F03-R02, F09-R01..R03, EFF-K01, STU12-K01.
6. **Defects and limitations:**
   - **CR-30:** network loss is to be re-run on a fresh specimen (register, B). S21 walks it on the journey stack.
   - **CR-31:** the second attempt stays on hold (D-112(b)).
   - **CR-46:** honest empty states («(0/5)» cards) are open, for Daisy.
   - Media playback is deferred (capability 45).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** the steps above PASS on 37775382999.

### 21. Pemetaan Awal and Uji Penguasaan (the learning cycle)
1. **Requirement:** J4.6, J6.5, J6.10, J6.11, J6.15 (D-085 M3); D-008, D-040; INV-24, INV-28; D-121.
2. **Implementation:** `src/app/belajar/[tugas]/pemetaan/page.tsx`, `penguasaan/page.tsx`, `lanjut/page.tsx`, `hasil/page.tsx`; `src/lib/siklus.ts`; `src/lib/assessment-engine/index.ts`.
3. **Database:**
   - `20261010100000_a_lesson_is_assigned_whole.sql` (`assign_release`, `release_cycle_definition`, `eligible_items_for_definition`, `my_cycle_state`);
   - `20260913091500_learning_cycle_scoring.sql`, `20260913094000_cycle_state.sql`;
   - `20260912202500_exposure_cooling_and_inv24.sql`, `20261109100000_the_draw_reads_its_marks_by_index.sql`.
4. **Screens and journeys:** S18, S19, S21 (five learners, pre- and post-test), S21d («Apa berikutnya»), C12d.
5. **Tests:** F13-P01, F13-P02, F13-N01, F13-N02, BOB04-K01, F02-T23, F03-T01, F03-T02, F03-T04, M3-K01, POLISH3-HASIL-01, DAISY-25-TEKS-01.
6. **Defects and limitations:**
   - Unlimited retries and automatic remediation are out of scope (scope inventory §10, M3).
   - CR-31 (second attempt) is on hold.
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S18, S19, S21 and S21d PASS on 37775382999; C12d PASS.

### 22. Uji Cepat
1. **Requirement:** J5.5, J5.6 (EDU-10, P1), J5.7, J5.11; D-015, D-067, D-082(d), D-085 T2, D-120 Q8 (CR-27), D-127 Q4 (CR-84).
2. **Implementation:**
   - Teacher: `src/app/mengajar/[kelas]/uji-cepat/page.tsx`, `src/app/mengajar/actions.ts`;
   - Learner: `src/app/belajar/asesmen/[penugasan]/page.tsx`;
   - Contract: `src/lib/ujicepat-kontrak.ts`.
3. **Database:**
   - `20260914120000_ad_hoc_assessments.sql`, `20261020100000_a_quick_assessment_is_dated_in_jakarta.sql`;
   - `20261023100000_a_launched_quick_assessment_keeps_its_rules.sql`;
   - `20261104100000_a_teacher_chooses_the_uji_cepat_questions.sql` (`launch_selected_quick_assessment`);
   - `20261113100000_a_quick_assessment_does_not_certify.sql`;
   - `20260920090000_a_learner_can_find_a_quick_assessment.sql`.
4. **Screens and journeys:** S26e (choose, tick, review, launch; the paper is exactly those questions), S27h (a head of department within the department).
5. **Tests:** F04-T04, F04-T04c, F04-T04d, QAC-T01..T12, QAC-S01, T2-S01, T2-K01, BOB42-S01, BOB32-K01, BOB32-K02, BOB34-K01, DAISY-27-TOLAK-01, F19-Q01..Q04, Q12-N01, UX1-S3-CEPAT-01.
6. **Defects and limitations:**
   - **CR-27:** the Uji Cepat score is not built. Q8 rules «the class outcome is primary, the learners' scores a drill-down» (D-120).
     - No score display was found in `src/app/mengajar/[kelas]/uji-cepat/page.tsx`.
     - CLOSURE-STATUS §3 lists CR-27 open under Daisy's screens.
   - **CR-34:** a Level 3 walk waits on CR-27.
   - Studio's second launcher was removed (CR-84, QAC-S01).
7. **Status:** PARTIALLY IMPLEMENTED.
8. **Evidence:** S26e and S27h PASS on 37775382999. J5.6 is not built.

### 23. Scoring engine, mastery and performance bands
1. **Requirement:**
   - J6.11, J6.15, J7.7, J7.8, J8.1;
   - D-060, D-081, D-095, D-121 (Q10 Alternative 4), D-123(3) (CR-81);
   - INV-08, INV-09, INV-10, INV-26, INV-28, INV-29;
   - doc `docs/rebuild/07-PINTAR-ASSESSMENT-ENGINE-CONTRACT.md`.
2. **Implementation:** `src/lib/assessment-engine/index.ts` (INV-26: the one module calling the engine RPCs, F03-S01); `src/lib/nilai-metrik.ts`.
3. **Database:**
   - `20260913091500_learning_cycle_scoring.sql`;
   - `20260914091500_scoring_policy_registry.sql`, `20260914094500_resilience_late_sync_termination.sql`;
   - `20261130100000_a_learner_not_yet_assessed_is_counted_as_such.sql`, `20261206100000_the_bands_are_read_over_the_assessed.sql`;
   - `20261025100000_per_topic_mastery_reads_the_recorded_objects.sql`.
4. **Screens and journeys:** results on `/belajar/[tugas]/hasil`; S21, S21d, S22.
5. **Tests:** F02-T13..T15, F02-C01, F03-T07, F03-T08, F03-T10, F03-S01, F04-T02, F04-T03, F04-T05, F04-T06, F20-Q10, F20-F01, F20-N01, F20-N02, PITA-K01, PENUTUPAN-K01, F06-P23.
6. **Defects and limitations:**
   - D-064: sufficiency proven on the test stack. «The first real pilot class is operational confirmation.»
   - CR-47: the not-yet band is closed (batch 3).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** the tests run in CI 37775379355; S21 and S21d PASS on 37775382999.

### 24. Certificate issuance, sealing and numbering
1. **Requirement:**
   - J8.1, J8.2, J8.3, J8.5 (numbers);
   - D-077(d), D-078, D-080(2)(9) (CR-01), D-082(d);
   - INV-05, INV-07, INV-20, INV-30.
2. **Implementation:**
   - Routes and pages: `src/app/api/certificates/issue/route.ts`, `src/app/belajar/[tugas]/sertifikat/page.tsx`, `src/app/belajar/sertifikat/page.tsx`;
   - Signing: `src/lib/certificates/{keyring,sign,verification}.ts`;
   - Screens and rules: `src/lib/sertifikat.ts`, `src/components/sertifikat/*`.
3. **Database:**
   - `20260914103000_certificates_core.sql` (`certificate_prepare`, `certificate_seal`, `revoke_certificate`);
   - `20261126100000_a_certificate_number_is_never_shared.sql`, `20261128100000_…`, `20261201100000_a_certificate_is_numbered_by_its_holder_and_sealed_at_issuance.sql`;
   - `20260917100000_official_evidence_purpose.sql`.
4. **Screens and journeys:** S21i (above target: listed and issued; below target: none; opening creates none), C12d (two PD certificates).
5. **Tests:** F04-T09, F04-T11..T13, F04-T16, F04-S02..S04, F20-S01, F20-C01, ADM18-K01, ADM18-K02, BOB50-A01, BOB50-S01, PENUTUPAN-S01, PENUTUPAN-Q10, UX1-S1-CERT-COLS-01, UX1-S1-CERT-ELIGIBLE-01, DAISY-40-SERTIFIKAT-01, EVAL-S02, F18-N04.
6. **Defects and limitations:**
   - Presentation is capability 26.
   - Production `CARD_PEPPER` and `CERT_SECRET_KEY_V1` escrow is CR-12 (#150 B5, D-066).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S21i and C12d PASS on 37775382999; the tests run in CI 37775379355.

### 25. Public certificate verification
1. **Requirement:** J8.6 (PUB-03 to PUB-06); D-080(8); INV-38.
2. **Implementation:** `src/app/verifikasi/[token]/page.tsx`, `src/app/api/verifikasi/[token]/route.ts`, `src/lib/certificates/verification.ts`.
3. **Database:**
   - `20260914110000_public_verification.sql` (`verify_certificate`, `public_surface_registry`);
   - `20260914140000_anon_verification_rpc.sql`, `20260914180000_verification_is_cryptographic.sql`.
4. **Screens and journeys:** `/verifikasi/[token]`; P1 (a random token gives the closed not-found), C12d (verified by token).
5. **Tests:** F04-T10, F04-S01, F04-S05, F01-R07, UX1-S1-QR-01.
6. **Defects and limitations:** CR-11: the domain `verifikasi.pintarselalu.com` is not set (DNS, release item).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** P1 and C12d PASS on 37775382999.

### 26. Certificate presentation, print and revocation screen
1. **Requirement:** J8.4 (D-076, D-078(d), D-080); J8.5 (ADM-18, revocation); CR-03, CR-04, CR-05, CR-06.
2. **Implementation:** `src/components/sertifikat/{KartuSertifikat,LembarA4,AksiCetak,KodeVerifikasi,SalinTautan}.tsx`.
3. **Database:** `revoke_certificate` (`20260914103000_certificates_core.sql`); `save_certificate_template` remains in the database (L2 report).
4. **Screens and journeys:** the certificate page (S21i). There is no revocation screen: `revoke_certificate` is not referenced in `src/`.
5. **Tests:** PENUTUPAN-Q10, UX1-S1-QR-01, UX1-S1-KAKI-01, ADM18-K02.
6. **Defects and limitations:**
   - **CR-03:** «NOT BUILT: the screen is not the frozen Modern design».
   - **CR-04:** print is PARTIAL.
   - **CR-05:** no revocation screen.
   - All three are listed open under Daisy's screens (CLOSURE-STATUS §3). No later closure record was found.
   - CR-06 (the raw layout picker) is gone (L2 report; L4 §1).
7. **Status:** PARTIALLY IMPLEMENTED.
8. **Evidence:** the register rows CR-03, CR-04 and CR-05, and CLOSURE-STATUS §3.

### 27. Student profile photo
1. **Requirement:** J8.8 (D-085 T4, D-086 G1); CR-07.
2. **Implementation:** the register says «the upload path and `persons.photo_path` exist; no screen». No profile-photo screen was found under `src/app`.
3. **Database:** `persons.photo_path` (per the register; the migration was not re-located for this inventory: unverified).
4. **Screens and journeys:** none.
5. **Tests:** F01-T17 (own-profile update; «the photo is the person's own»). No screen test.
6. **Defects and limitations:** CR-07 is open (CLOSURE-STATUS §3, Daisy's screens).
7. **Status:** NOT IMPLEMENTED.
8. **Evidence:** the register row CR-07 and CLOSURE-STATUS §3.

### 28. Teacher views (Mengajar) and evidence
1. **Requirement:**
   - J5.1–J5.4, J5.8, J5.10, J5.12–J5.14 (D-085 M3, M4, M5);
   - J7.1; D-088(k); D-064;
   - CR-28 (QN3), CR-35, CR-46.
2. **Implementation:**
   - Pages: `src/app/mengajar/page.tsx`, `src/app/mengajar/[kelas]/{page,bukti,langkah,murid/[orang],siapa,siapkan,soal,ulang,umpan-balik}/page.tsx`, `src/app/mengajar/actions.ts`;
   - Rules: `src/lib/pengajar.ts`, `src/lib/mengajar.ts`, `src/lib/soal-kelas.ts`, `src/lib/ulang-kontrak.ts`, `src/lib/penugasan-kontrak.ts`;
   - Components: `src/components/bukti/*`.
3. **Database:**
   - `20261101100000_a_teacher_sees_which_questions_the_class_found_hard.sql`;
   - `20261107100000_a_teacher_asks_learners_to_read_again.sql`;
   - `20261025100000_per_topic_mastery_reads_the_recorded_objects.sql`, `20261031100000_a_topic_is_named_by_its_objective.sql`;
   - `20260918110000_metric_evaluator.sql`.
4. **Screens and journeys:**
   - S13 (open class), S18 (Siapkan → Sediakan);
   - S21b (who handed in, who started, who has not);
   - S22 (Lihat bukti, Lihat per soal, a learner's record);
   - S22b (read again), S25, S26b.
5. **Tests:**
   - Teaching-context screens: UX1-S3-LINGKUP-01, UX1-S3-KOMIT-01, UX1-S3-BUKTI-01, UX1-S3-NAMA-01, UX1-S3-KATA-01;
   - Evidence and learners: W8-K01, W16-K01, EDU23-K01, M4-K01, D088K-S01, D088K-K01, D088G-S01, D088G-K01, M3R-S01, M3R-K01;
   - Next steps and scope: BOB40-K01, M9-K01, DAISY-26-MENGAJAR-01, F01-T07, F06-P23, DAISY-14-TANGGAL-01.
6. **Defects and limitations:**
   - **CR-28:** an assignment's window cannot be changed. The change is deferred until after go-live (QN3, D-120).
   - **CR-46:** empty states are open.
   - CR-35 is closed (batch 2).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S13, S18, S21b, S22 and S22b PASS on 37775382999.

### 29. Educator as learner (professional learning)
1. **Requirement:** J9.1–J9.8; D-069(a)–(m), D-070; INV-20.
2. **Implementation:**
   - Pages: `src/app/pengembangan/[simpul]/page.tsx`, the «Pembelajaran Saya» entry from `/mengajar`;
   - Code: `src/lib/pembelajaran.ts`, `src/lib/pengembangan.ts`, `src/lib/pengembangan-kontrak.ts`.
3. **Database:**
   - `20261118100000_an_educator_learns_as_a_participant.sql` (`enrol_for_professional_learning`, `ASSIGN_CONTEXT_MISMATCH`);
   - `20261124100000_a_professional_learning_answer_stays_the_participants_own.sql`;
   - `20260927100000_the_same_person_may_also_be_learning.sql`.
4. **Screens and journeys:** C12a–C12k (baseline, place, content, the Guru's journey, evidence, visibility, integrity, tenancy, boundary, marking, the hard gate byte-identical).
5. **Tests:** BOB43-K01, BOB43-S01, BOB43-D01, C12-S01, C12-D01, F06-P19, F06-P20, F06-P21, UX1-AJAR-KONTEKS-01, UX1-AJAR-KATA-01, UX1-AJAR-BELAJAR-01.
6. **Defects and limitations:**
   - CR-57: the polish is open (Daisy, within slices).
   - J9.8: the demonstration content is test fixtures under `audit/fixtures/`, never on production (scope inventory note).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** C12a–C12k PASS on 37775382999 (C12k with identical md5 of the readings, per L3 report on 37705723825).

### 30. Leaders (Pimpinan) and management decisions
1. **Requirement:** J7.2, J7.3, J7.5 (D-061 #2), J7.9; D-062(d); D-123/124 (CR-76); CR-38, CR-77.
2. **Implementation:**
   - Pages: `src/app/pimpinan/page.tsx`, `src/app/pimpinan/[simpul]/{page,murid/page,murid/[orang]/page}.tsx`, `src/app/pimpinan/actions.ts`;
   - Code: `src/lib/pimpinan.ts`, `src/lib/pimpinan-kontrak.ts`, `src/components/pimpinan/*`;
   - Summaries: `src/app/dekan/ringkasan/page.tsx`, `src/app/edukator/ringkasan/page.tsx`.
3. **Database:**
   - `20260924110000_pintar_proposes_a_human_decides.sql` (`management_decisions`, `advance_management_decision`, `refer_integrity_signal`);
   - `20261024100000_a_referral_reaches_the_decision_queue.sql`, `20261205100000_whoever_refers_an_integrity_case_does_not_decide_it.sql`;
   - `20260923130000_management_may_open_a_learner_on_purpose.sql`, `20260925100000_enough_evidence_to_say_it_yet.sql`.
4. **Screens and journeys:** S16, S23 (figures, print, roster, a learner's record), S23d (the dean; refused every place that writes), S23r (decision queue).
5. **Tests:** UX1-PIMPINAN-LINGKUP-01, -KEPUTUSAN-01, -KESIAPAN-01, -KATA-01, -AKSES-01; F06-P12, F06-P15, F06-P22, BOB39-K01, PENUTUPAN-W01, W10-K01, W11-K01, HOD05-K01, HOD09-K01, BOB06-K02, F06-N02.
6. **Defects and limitations:**
   - **CR-77:** a school admin who refers a case is refused /pimpinan and has no screen showing the outcome. The register records it as A; no closure record was found. S23r shows the referring head of department seeing the case decided.
   - CR-76 is closed (D-124(a)).
   - J7.9 (dean certificate aggregates, P2): no specific evidence found.
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S16, S23, S23d and S23r PASS on 37775382999.

### 31. Integrity review
1. **Requirement:** J7.6 (HOD-07, X-11); D-062(d), D-069(c), D-070(i); FD-7; CR-75; doc 06 §7; INV-11.
2. **Implementation:** `src/app/studio/integritas/page.tsx`; `src/app/studio/actions.ts`.
3. **Database:**
   - `20260912194342_telemetry_and_integrity.sql`, `20260914093000_mode_policy_quick_assessment_integrity.sql`;
   - `20261208100000_a_reviewed_observation_leaves_the_waiting_list.sql`, `20261205100000_…`.
4. **Screens and journeys:** S23i (observations, never a verdict; the reviewed sitting leaves the list), S23r, C12g (PD integrity not surfaced).
5. **Tests:** F02-T16, F04-T07, F06-P04, F06-P14, F21-I01, PENUTUPAN-I01, L4-K01 (a sitting named by learner · class · assessment).
6. **Defects and limitations:**
   - **CR-75 (W-1):** L4 item 8 replaced the 8-character id with names (L4 §1). The register's other CR-75 points (a labelled note; reviewing more than the newest signal) were not re-checked here: unverified.
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S23i, S23r and C12g PASS on 37775382999.

### 32. Reports, metrics and report templates
1. **Requirement:** J3.9 (ADM-17), J7.1–J7.4, J7.8; D-060, D-095, D-123(3); INV-20, INV-34; CR-40, CR-80, CR-81.
2. **Implementation:**
   - Pages: `src/app/edukator/ringkasan/page.tsx`, `src/app/dekan/ringkasan/page.tsx`, `src/app/konfigurasi/page.tsx` («Templat laporan»);
   - Code: `src/lib/laporan.ts`, `src/lib/laporan-kontrak.ts`, `src/lib/nilai-metrik.ts`;
   - Components: `src/components/laporan/*`, `src/components/bukti/NilaiLaporan.tsx`.
3. **Database:**
   - `20260918100000_metric_catalogue.sql`, `20260918110000_metric_evaluator.sql`, `20260918120000_reports_and_templates.sql` (`metric_evaluate`, `generate_report`);
   - `20261002120000_an_institution_assembles_its_own_report.sql` (`save_report_template`);
   - `20261011100000_every_school_has_its_standard_reports.sql`, `20260923090000_…`..`20260923110000_…` (calculator scope).
4. **Screens and journeys:** S16, S23 (print and back), S23d, S23t (the school's own template replaces the standard assembly).
5. **Tests:** F02-S01, F06-N03, F06-P06, F06-P09..P16, F08-P03..P06, F14-P01, F14-P02, F14-N01, BOB06-K01, BOB06-A01, DAISY-07-LAPORAN-01/02, W9-K01, W9-K02, PENUTUPAN-K01, F20-N02.
6. **Defects and limitations:**
   - CR-80: no template editor, accepted for 4.0 (D-123(6)).
   - Template titles and visualization names need words (L4 §4, §8).
   - CR-46 (empty states) is open.
   - CR-81 is closed (batch 3b).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S16, S23, S23d and S23t PASS on 37775382999.

### 33. Briefings
1. **Requirement:** J7.5 (DEA-04, P2); CR-37; QN4 (D-120): «HIDE FOR 4.0: no briefing producer is built merely to populate the existing empty surface».
2. **Implementation:** `src/lib/pengajar.ts` `ringkasan()` reads `briefings`. No call site was found in `src/app` or `src/components`, consistent with the surface being hidden; its UI state was not otherwise verified.
3. **Database:** `20260918180000_briefings.sql`, `20260918190000_a_briefing_names_its_template.sql`.
4. **Screens and journeys:** none.
5. **Tests:** F06-P06, F06-P07, F06-N04 (the database lifecycle).
6. **Defects and limitations:** nothing produces a briefing (register CR-37).
7. **Status:** NOT APPLICABLE / DEFERRED BY APPROVED SCOPE.
8. **Evidence:** D-120 QN4.

### 34. Class feedback rounds (Umpan balik kelas)
1. **Requirement:** **no 4.0 scope source.** Scope inventory §11 B1 is «FOR YAZID»; no later ruling was found.
2. **Implementation:**
   - Pages: `src/app/belajar/umpan-balik/[siklus]/page.tsx`, `src/app/mengajar/[kelas]/umpan-balik/page.tsx`, `src/app/pimpinan/[simpul]/umpan-balik/**`;
   - Code: `src/lib/umpanbalik.ts`, `src/lib/umpanbalik-kontrak.ts`.
3. **Database:** `20260930100000_a_class_speaks_and_no_one_is_named.sql` (`feedback_cycles`, `feedback_responses`, `feedback_results`, …); `20261001100000_management_can_name_the_teacher_it_asks_about.sql`.
4. **Screens and journeys:** **no journey step** (`umpan-balik` does not occur in `audit/journey.mjs`); the crawl renders the pages.
5. **Tests:** F07-P01..P15, F07-C01, UX1-UB-BISU-01, UX1-UB-BATAS-01, UX1-UB-KATA-01, UX1-UB-ALUR-01, UX1-UB-TUTUP-01, UX1-UB-KELOLA-01, UX1-UB-BUKA-01, UX1-UB-BUKA-ALUR-01.
6. **Defects and limitations:** the scope status is unresolved (§11 B1).
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:** the app tests run in CI 37775379355; no journey step exists.

### 35. Evaluation / demonstration room (MODE PERAGAAN)
1. **Requirement:** **no 4.0 scope source** for the hub itself (scope inventory §11 B2). It is constrained by J1.8 (C13, REL-04); ADR-0020.
2. **Implementation:** `src/app/evaluasi/page.tsx` and `actions.ts`; `src/app/api/evaluation/assume/route.ts`; `src/lib/evaluation.ts`; copy key `evaluasi.mode` = «MODE PERAGAAN» (`src/lib/hle.ts:3309`).
3. **Database:**
   - `20260917110000_evaluation_registry.sql`, `20260917120000_dual_identity_audit.sql`, `20260917130000_evaluation_hub.sql` (`assume_persona`, `exit_persona`);
   - `20260917140000_evaluation_expiry_is_real.sql`, `20260917150000_persona_session_is_the_token.sql`.
4. **Screens and journeys:** `/evaluasi`. **No journey step**: `evaluasi` occurs in neither `journey.mjs` nor `crawl.mjs`.
5. **Tests:** EVAL-S01, EVAL-S02, EVAL-T01, EVAL-N01..N09, EVAL-N1011, EVAL-P01..P04, F16-X01.
6. **Defects and limitations:** «The persona switch can mint nothing on production today (0 personas)» (§11 B2, as of 1 Oct).
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:** the database and static tests run in CI 37775379355. No walk exists.

### 36. «Laporkan masalah»
1. **Requirement:** J10.1 (REL-13); D-037(2); CR-44, CR-78 (D-122(5)).
2. **Implementation:**
   - Pages: `src/app/lapor/page.tsx`, `src/app/lapor/saya/page.tsx`, `src/app/lapor/actions.ts`;
   - Code: `src/lib/lapor-masalah.ts`, `src/lib/lapor-masalah-kontrak.ts`, `src/components/lapor/*`;
   - Triage: Konfigurasi «Laporan masalah».
3. **Database:** `20261119100000_a_staff_member_reports_a_problem.sql` (`support_reports`, `submit_support_report`, `move_support_report`, `may_read_support_screenshot`).
4. **Screens and journeys:** S23l (teacher reports; admin moves to «Ditangani»; platform admin to «Selesai»; the reporter reads each).
5. **Tests:** BOB15-K01, BOB15-S01, BOB15-D01, PENUTUPAN-L01.
6. **Defects and limitations:**
   - **CR-78:** «Laporan saya» is not reachable by navigation. The key `lapor.saya.buka` is used only in `src/lib/hle.ts`, and S23l reaches `/lapor/saya` by redirect and `goto`.
   - CR-44: tier people are an owner action (bucket D).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S23l PASS on 37775382999.

### 37. Email (PINTAR's own delivery path)
1. **Requirement:** J1.9 (D-085 M8), J2.14, J2.15 (POL); D-053, D-057, D-079, D-092, D-098(c); CR-22.
2. **Implementation:**
   - Delivery: `src/app/api/_email/{kirim,kode,pengaturan,identitas,keamanan,tunggu,uji}.ts`, `src/lib/email/{templat,identitas,alamat}.ts`, `src/components/email/`;
   - Test page: `src/app/konfigurasi/email-uji/page.tsx`, `src/app/api/email/uji/route.ts`.
3. **Database:** `20261026100000_pintar_sends_its_own_email.sql` (`email_send_limits`, `email_send_log`, `email_send_reserve`, `email_send_settle`); `20261114100000_a_refused_email_is_never_called_sent.sql`.
4. **Screens and journeys:** `/konfigurasi/email-uji`. Journey S1 uses the emailed activation code (on the journey stack).
5. **Tests:** F17-L01, F17-L02, F17-N01, F17-C01, BOB25-K01, BOB25-S01, BOB25-A01, BOB51-A01, BOB51-S01, EMAILJUJUR-K01, -L01, -D01, DAISY-19-EMAIL-01/02, DAISY-20-EMAIL-01.
6. **Defects and limitations:**
   - **CR-22:** «the canonical system is not done» (DAISY-37); the activation email is the first contact.
   - Staging has the SMTP settings PINTAR_SMTP_HOST/PORT/USER/PASSWORD (names only, facts run 37782586725). Delivery through the real provider is not evidenced by the reference runs.
   - D-053: mail capacity for the pilot is a release item.
7. **Status:** PARTIALLY IMPLEMENTED.
8. **Evidence:**
   - The delivery path is tested against Mailpit in CI 37775379355.
   - J2.15's email standard is open (CR-22; CLOSURE-STATUS §3).

### 38. Maintenance scheduling and emergency stop
1. **Requirement:** D-094 (recorded on 2 Oct as «not implemented»), completed by D-100(b)(#148 planned) and D-100 (#148 emergency); D-093 (audited operational state).
2. **Implementation:**
   - Pages: `src/app/pemeliharaan/page.tsx`, `src/app/konfigurasi/page.tsx` and `actions.ts` (scheduling, «Hentikan sekarang»);
   - Code: `src/lib/pemeliharaan.ts`, `src/lib/pemeliharaan-kontrak.ts`, `src/components/pemeliharaan/{PitaPemeliharaan,PengingatPemeliharaan}.tsx`;
   - `src/proxy.ts` sends stopped pages to `/pemeliharaan`.
3. **Database:**
   - `20261120100000_maintenance_is_announced_and_drains.sql` (`maintenance_windows`, `broadcast_notices`, `schedule_maintenance`, `change_maintenance`, `stop_pintar_now`, `publish_notice`, `withdraw_notice`, `pintar_status_saya`);
   - `20261110100000_an_operational_state_has_one_path.sql`, `20261111100000_an_operational_change_says_what_it_was.sql`.
4. **Screens and journeys:** `/pemeliharaan`, Konfigurasi. **No journey step** (`pemeliharaan` does not occur in `audit/journey.mjs` or `crawl.mjs`).
5. **Tests:** M148-K01, M148-S01, M148-D01 (planned: T-20 notice, T-15 no new start, drain), M148-D02 (emergency), F08-P09, F08-P10.
6. **Defects and limitations:**
   - Never walked by a person or a journey.
   - Whether the broadcast notices work beyond the maintenance notice: unverified (the migration defines `publish_notice`; no dedicated test id for standalone notices was found).
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:** M148-D01 and M148-D02 run in CI 37775379355 against the database, rolled back.

### 39. Audit trail
1. **Requirement:** J1.6 (SYS-07), J3.11 (ADM-20); D-093, D-097; INV-18; CR-39, CR-79 (W-6).
2. **Implementation:** `src/app/konfigurasi/page.tsx` («Jejak audit», paged, 50 a page: `UKURAN_JEJAK`, L4 §6).
3. **Database:**
   - `20260912004158_foundation_base.sql` (`audit_log`), `20260912051935_audit_log_no_service_writes.sql`, `20260912050956_build_sha_from_request.sql`;
   - `20260917120000_dual_identity_audit.sql`, `20261111100000_…`, `20261121100000_a_record_keeps_what_it_said.sql`.
4. **Screens and journeys:** S23j (a school admin reads only their school's newest 50; the platform admin reads across schools).
5. **Tests:** F01-T04, F01-T11, F01-T19, F08-P10, FU1921-S01, FU1921-D01, EVAL-P01, EFF-K02, L4-K01.
6. **Defects and limitations:**
   - **CR-79:** raw action codes (112, in three naming styles) and table names, waiting for words (L4 §4).
   - CR-13's addresses are kept off school-facing surfaces (D-122(1), D-123(5)).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S23j PASS on 37775382999.

### 40. Backup and disaster recovery tooling (#150)
1. **Requirement:** J8.7; D-066, D-103..D-111, D-113; `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`; `docs/recovery/CLOSURE-PLAN-150.md`; `docs/recovery/EVIDENCE-INDEX-150.md`.
2. **Implementation:**
   - Scripts: `scripts/recovery/*.mjs` (backup, escrow, restore-bundle, rehearsal, repoint, functional, drill), `scripts/release/{durable-secrets,restore-point}.mjs`;
   - Workflows: `backup-offsite.yml`, `escrow-durable-secrets.yml`, `restore-drill.yml`, `restore-rehearsal.yml`, `recovery-rehearsal.yml`, `production-watch.yml`, `deploy-supabase-production.yml`, `deploy-vercel-production.yml`;
   - Runbook: `docs/recovery/RUNBOOK-NATIVE-RESTORE.md`.
3. **Database:** `20261125100000_a_backup_reads_everything_and_writes_nothing.sql` (the `pintar_backup` credential; D-108, D-109); `docs/audit/launch-readiness.sql`.
4. **Screens and journeys:** none (operations).
5. **Tests:** DR-S01..S17, DR-D01, DR-D02, DR-D03.
6. **Defects and limitations:**
   - **Verdict NOT PASS for PRODUCTION READY (accepted by D-104).** «A» (PINTAR's own controls) is built and proven. «B» (provider and owner actions) is not done.
   - B3 is on hold: G6 refuses every production migration while the backup list cannot be read by machine.
   - B4/B5/B8/B9 await the owner's rulings; WP-D (recovery authority, B6) is not started; B7 (the watch) is off.
   - RPO is 24 h, provisional; no PITR (D-103).
7. **Status:** BLOCKED (on owner and provider actions).
8. **Evidence:** BACKUP-DR-REVIEW Part I «Verdict: NOT PASS»; EVIDENCE-INDEX-150; the DR-* tests run in CI 37775379355.

### 41. Copy table and i18n (`src/lib/hle.ts`)
1. **Requirement:** X.4; J6.14 (STU-20); D-011, D-014, D-068 (Terminology v1), D-134; INV-35 (doctrine).
2. **Implementation:**
   - `src/lib/hle.ts`: 4,834 lines; about 2,100 key entries by a line-pattern count (approximate);
   - Locale: `src/lib/locale.ts`, `locale-klien.ts`, `locale-kontrak.ts`;
   - Switcher: `src/components/PengalihBahasa.tsx`;
   - Pending words: `src/lib/istilah-menunggu.ts`.
3. **Database:** none specific (copy is application-side; database codes map through `galat-kontrak.ts`).
4. **Screens and journeys:** every screen; S21g (ID ↔ EN; the lesson text is not translated).
5. **Tests:** F01-S04, F05-S03, F06-S02, F06-R01, F06-S03, L4-G01, UX1-S0-HLE-01, UX1-S0-LANG-01, UX1-S0-SAPAAN-01, DAISY-01-SALIN-01, DAISY-04-KUNCI-01, DAISY-04-GALAT-01, UX1-MASUK-KATA-01, UX1-PIMPINAN-KATA-01, UX1-S3-KATA-01.
6. **Defects and limitations:**
   - Terminology v1 is applied only where L4 needed words (D-134; L4 §7). The rest of v1's change set is with Daisy's polish.
   - v1 row A9 is not applied (L4 §7.1).
   - The Dr Gladys terminology register lists words v1 lacks (L4 §4).
   - The owed copy is listed in the morning handoff (C1, C2, CR-13/50/76/81, «Tandai soal ini», «Menerbitkan…»).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** S21g PASS on 37775382999; UX1-S0-HLE-01 and L4-G01 run in CI 37775379355.

### 42. Accessibility
1. **Requirement:** X.11 (D-047); the WCAG AA contrast floor in the UX1 tests; D-136(c) (the NVDA/TalkBack pass is owed).
2. **Implementation:**
   - Tokens: `src/app/globals.css`, `src/app/experience.css`;
   - Shared components: `src/components/{TombolKirim,TandaTautan,KolomRahasia,SimpanIsian}.tsx`;
   - Tour dialog: `src/components/tur/`.
3. **Database:** none.
4. **Screens and journeys:** all. No journey asserts screen-reader output.
5. **Tests:** UX1-S0-CONTRAST-01, UX1-S0-TOKEN-01, UX1-MASUK-AKSES-01, UX1-TUR-AKSES-01, DAISY-08-PANEL-01, DAISY-17-KIRIM-01, DAISY-17-KIRIM-02, DAISY-18-DENGAR-01, DAISY-02-KELUAR-01.
6. **Defects and limitations:**
   - **No NVDA or TalkBack pass has been done** (D-136(c); morning handoff «Open»).
   - Daisy's APPLICATION READY design (verified on `c42fecb`, D-136(b)) is on her lane, `ux-1/daisy-experience`, and has not reached `main`. The application slices (`08-migration.md`) are still to come.
7. **Status:** IMPLEMENTED BUT NOT FULLY VERIFIED.
8. **Evidence:** the static tests run in CI 37775379355. Assistive technology has not been tested.

### 43. Responsive layout at 320 px
1. **Requirement:** X.6 (U-DEVICE); D-046; CR-93, CR-94 (the owner's ruling of 8 Oct).
2. **Implementation:** `src/app/experience.css`, `src/app/globals.css`.
3. **Database:** none.
4. **Screens and journeys:** crawl job A visits every reachable page for 14 personas at 320 px (`audit/crawl.mjs` `SEMPIT`).
5. **Tests:** UX1-S0-FAKTA-01, UX1-S3-FAKTA-01, UX1-S0-MUAT-01, DAISY-01-MASUK-01, PENUTUPAN-L01.
6. **Defects and limitations:**
   - The crawl only reads (it submits nothing).
   - CR-54 (the full polish pass) is open.
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** crawl job A GREEN on 37775382999. An earlier run (37705723825) was RED with 147 overflows, fixed by CR-93/94 (L3 report).

### 44. Error and not-found pages
1. **Requirement:** J10.2 (U-ERR, PUB-07); D-011; CR-45.
2. **Implementation:** `src/app/error.tsx`, `src/app/global-error.tsx`, `src/components/HalamanGalat.tsx`, `src/components/HalamanPenolakan.tsx`, `src/lib/galat-kontrak.ts`.
3. **Database:** stable refusal codes (e.g. PR020, PR040, PR050) across migrations, mapped in `galat-kontrak.ts` and `struktur-kontrak.ts`.
4. **Screens and journeys:** P3 (an unknown page shows PINTAR's own localized page).
5. **Tests:** BOB07-K01, BOB07-K02, BOB07-K03, BOB07-R01, DAISY-04-GALAT-01, DAISY-04-TIDAK-ADA-01, DAISY-04-KUNCI-01.
6. **Defects and limitations:** the reference code on a failure is kept on purpose (L4 §5).
7. **Status:** IMPLEMENTED AND VERIFIED.
8. **Evidence:** P3 PASS on 37775382999.

### 45. Lesson media playback
1. **Requirement:** J4.2 (ADM-10, STU-11, X-07); D-050(b)(c): out of scope for the testing phases, «never PASS»; still 4.0 eventually; CR-53 (bucket E).
2. **Implementation:** `src/app/api/assets/read-url/route.ts`; the lesson player.
3. **Database:** `20261015100000_lesson_media_play.sql`; `may_upload_package_media` (`20261007100000_…`).
4. **Screens and journeys:** none walk playback.
5. **Tests:** BOB11-A01, BOB11-A02, F11-P04, F11-N03.
6. **Defects and limitations:** not accepted by ruling; per D-050(b), the checklist rows stay «unresolved with an explicit out-of-scope note».
7. **Status:** NOT APPLICABLE / DEFERRED BY APPROVED SCOPE.
8. **Evidence:** D-050; register CR-53.

### 46. Capacity and responsiveness
1. **Requirement:** R.4, R.5, X.10; D-031, D-035, D-046(b), D-089; CAP-01..CAP-10; CR-49, CR-58.
2. **Implementation:**
   - Workflows: `perf-l1.yml`, `perf-staging.yml`;
   - Load harness: `audit/perf/`;
   - Region: `vercel.json` (region sin1, BOB18-K01).
3. **Database:** `20261013100000_pintar_answers_quickly.sql`.
4. **Screens and journeys:** none.
5. **Tests:** BOB18-K01, BOB18-A01, F01-T20, EFF-K02.
6. **Defects and limitations:**
   - **D-089:** perf-l1 run 36964437916 on Micro failed D-031 at 1,000 synchronized students (answer save p95 11.7 s, p99 29.7 s, pool exhausted; no answer lost). CAP-02 FAIL, CAP-07 PARTIAL.
   - CAP-08 (compute tier) is a pre-production owner decision.
   - Testers are limited to 50 at a time (D-089(d)). The owner's word: a real-app 50-student test before any 50-person session (handoff facts).
   - CR-58: not re-measured on current code.
   - CR-49: list paging (some lists paged in L4).
7. **Status:** BLOCKED (on the compute decision and re-measurement).
8. **Evidence:** D-089; register CR-58 (B) and CR-49 (D).

---

## 3. Gaps this inventory could not close

- **Per-step journey verdicts were not re-read** from the artefacts of 37775382999 (see §0).
- **Production `5b5b68d`** was not inspected. Which of the capabilities above exist there is unverified, apart from what the register states (e.g. CR-25, the magic link).
- **Register items whose 8 Oct state was not found in a later record.** These are reported as last recorded (register 6 Oct, CLOSURE-STATUS 7 Oct): CR-03, CR-04, CR-05, CR-07, CR-14, CR-21, CR-22, CR-27, CR-46, CR-51 (re-import), CR-75 (beyond names), CR-77.
- **No human acceptance** of any capability is recorded. Automated verification (CI, journeys, crawl) is the only verification claimed here.

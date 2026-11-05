# C · Open work register: the one list of everything left in 4.0 (2 Nov 2026)

**This is the authoritative completion register (mandate §13).** It supersedes, for status, the 9 Oct reconciliation and the 2 Nov plan. Those, and every source register, stay as history.

Each item keeps its original finding ids for traceability: CR (closure register), RV/OP/AP (application pass log), DG/FD (Dr Gladys investigation), UX (polish register), REL/CAP/STU/… (release checklist) and B (#150).

**Columns:**
- **Who:** E engineering · D Daisy (new design) · G Dr Gladys (words only, in writing) · Y owner · X external.
- **Batch:** see `E-CRITICAL-PATH-EXECUTION-PLAN`.
- **Status:** the mandate's statuses.

---

## W0 · Restart and platform

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W0.1 | Repository public **by the owner's choice** (D-143). Consequence work: W5.2 (answer keys and content sources out of the repository), W0.5 (history secret scan), and a pre-commit guard so no key, secret or real-person data is ever committed to a public repo | D-143 | E | 0–1 | IMPLEMENTED — NOT VERIFIED (guard and scan done in Batch 0, commit 0fb65bb, SEC-G01/G02 green in CI 41375753148; W5.2 remains, batch 1) |
| W0.2 | CI on GitHub's new runner image (Ubuntu 26.04, Node 24 for actions). **Batch 0 finding:** `ci.yml` green unchanged (41375753148, 661/0/0); every Playwright browser install fails on 26.04 (Playwright 1.55); 17 browser jobs pinned to ubuntu-24.04 (871767d). Later: Playwright upgrade, Node 24 action majors, Supabase CLI bump (`batch-0/02` §6) | W6.6 (2 Nov plan) | E | 0 | VERIFIED — INTERNAL ACCEPTANCE PENDING for `ci.yml` and `audit-journeys.yml` on the branch (`batch-0/02`); the 14 other pinned workflows IMPLEMENTED — NOT VERIFIED |
| W0.3 | Lift the staging freeze (D-140(d)/D-141(a)) on plan approval | D-141 | Y | 0 | BLOCKED — OWNER DECISION |
| W0.4 | Accessibility harness in the crawl: axe, title, skip link, keyboard walk, overflow and clipping at 320/640/1024/1280 px (`audit/a11y.mjs`, Batch 0). Baseline in `batch-0/03`. Next: public pages in the crawl (with W3.1) | design reconciliation §5; X.6 | E | 0 | VERIFIED — INTERNAL ACCEPTANCE PENDING (harness; the baseline itself is recorded, not clean) |
| W0.5 | Secret scan of the full reachable history (all branches and PR refs): **0 credentials**; the owner's own address; 43 + 4 answer-key files (`batch-0/04`) | A-CURRENT-STATE §1 | E | 0 | VERIFIED — INTERNAL ACCEPTANCE PENDING |

## W1 · Studio and content (J4, J5.4)

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W1.1 | Apply Daisy's **J1Terbit** composition to the package page: done steps collapsed, the current step in a panel, «✓ Diterbitkan», tab edge fade | J1; W3.1 (2 Nov) | E | 3 | NOT STARTED |
| W1.2 | **Question review layout**: replace the «wall of questions» and native ▶ markers | DG-25, RV-21, L4 §4 | **D** then E | 3 | BLOCKED — EXTERNAL DEPENDENCY (Daisy) |
| W1.3 | Aturan Asesmen: hints, limits in minutes and words, 44 px checkboxes and radios | RV-14, DG-28/29 residue | E | 3 | NOT STARTED |
| W1.4 | Release in fewer presses; every step confirms what it did | UX-15, UX-39 | E | 3 | NOT STARTED |
| W1.5 | Question check runnable before lock; findings acknowledged as a group; misconception feedback asserted in a browser | UX-01, J4.10 | E | 3 | NOT STARTED |
| W1.6 | **Send back to the author.** A review outcome other than approval: a new content-status transition (migration), a reason, an audit row, the author's correction path | UX-36, J4.3 | E | 1 (data) + 3 (UI) | VERIFIED — INTERNAL ACCEPTANCE PENDING (Batch 1 data part, staging 2 Nov; UI in Batch 3) |
| W1.7 | Studio home count cards link to their lists; the course list shows status | UX-34 | E | 3 | NOT STARTED |
| W1.8 | «Riwayat perbaikan» shows who reviewed and approved; «Kursus ini» → the package noun | J4.12, UX-13 | E | 1 (data) + 3 | VERIFIED — INTERNAL ACCEPTANCE PENDING (Batch 1 data part, staging 2 Nov; UI in Batch 3) |
| W1.9 | Wording: «siswa» → «murid» (UX-18); «(D-008)» removed (UX-43); Studio passes the locale (UX-25); 320 px select and code (RV-23) | UX-18/25/43, RV-23 | E | 3 | NOT STARTED |
| W1.10 | **An example-only workbook** (no live items or keys) offered beside the blank template | DG-36 | E (content) | 3 | NOT STARTED |
| W1.11 | Question Bank reachable by the people QN5 meant, after F-7 | J4.8 | E after Y | 3 | BUILT on the branch (F-7 ruled 2 Nov, D-150; batch-3/05); staging NOT RUN |
| W1.12 | The author is never offered «Sudah saya tinjau» (the database already refuses it) | J4.3 (new) | E | 3 | NOT STARTED |
| W1.13 | `advanceContentAction` writes items, lessons, modules, definitions and course separately. Make the step one transaction, or prove partial failure is safe | J4.3 (observation) | E | 1 | VERIFIED — INTERNAL ACCEPTANCE PENDING (Batch 1, staging 2 Nov) |
| W1.14 | The other Studio pages (unggah, tinjau, kanonik, definisi, bank, integritas, pratinjau) on 08-migration rows; no composition needed | design §2 | E | 3 | NOT STARTED |
| W1.15 | Dr Gladys's Studio notes: where and as whom she tried; add anything missing | D-141(b) | Y | now | BLOCKED — OWNER DECISION |

## W2 · Approved functions not built or incomplete

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W2.1 | **Correct a wrong email**: the screen (server and route exist; four choices confirmed D-122(1)) | CR-13, J2.21, ADM-08 | E | 4 | VERIFIED ON STAGING — INTERNAL ACCEPTANCE PENDING (Batch 4; D-155, staging walk 41612169706;: «Koreksi data orang»; F24-O01, B4-ORANG-K01, walk B4-W3) |
| W2.2 | **Correct a name**: screen over `correct_person_name` (platform admin per D-077(3); placement by D) | CR-14, J2.4 | E | 4 | VERIFIED ON STAGING — INTERNAL ACCEPTANCE PENDING (Batch 4; D-155, staging walk 41612169706;; walk B4-W1) |
| W2.3 | **Correct a username** without SQL (audited, platform admin), per F-8 | CR-15, J2.17 | E after Y | 4 | VERIFIED ON STAGING — INTERNAL ACCEPTANCE PENDING (Batch 4; D-155, staging walk 41612169706;, per F-8; walk B4-W2) |
| W2.4 | **Uji Cepat score**: class first, learners as a drill-down (D-120 Q8) | CR-27, J5.6 | E | 3 | NOT STARTED |
| W2.5 | **Revoke a certificate** (school admin screen; reason; audit) | CR-05, J8.5 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; /konfigurasi/sertifikat, migration 20261222100000; B5-CABUT-K01, F26-C01/C02, walk B5-W1) |
| W2.6 | Briefings hidden as ruled: remove the promise in `mengajar.langkah.quiet` and the stale comments | CR-37, J7.5 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; the briefing promise and its dead reader removed; B5A-TAKLIMAT-K01) |
| W2.7 | Integrity review: the referrer sees the outcome; one decision per signal; a visible reviewed state | CR-77, CR-75, J7.6 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; one decision per observation, «Sudah ditinjau», the referrer reads the case's steps and outcome; migration 20261223100000; B5-INTEGRITAS-K01, F26-I01, F21-I01 restated, journey S23r, walk B5-W2. The learner's name was never shown before (an ambiguous embed since 20260914094500): fixed) |
| W2.8 | **Profile photo** on the profile only (FileField; storage; not on the certificate) | CR-07, J8.8 | E | 4 | VERIFIED ON STAGING — INTERNAL ACCEPTANCE PENDING (Batch 4; D-155, staging walk 41612169706;; B4-FOTO-K01, walk B4-W10) |
| W2.9 | «Laporan saya» reachable from the account menu | CR-78, J10.1, X.1 | E | 4 | DONE (Batch 2: MenuAkun «Laporan saya»; verified in Batch 4) |
| W2.10 | Platform admin lists paged | CR-49, R.5 | E | 4 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; the Aktivasi waiting list paged in the database, the whole-class run reads one class; migration 20261224100000; B5-TUNGGU-K01, F26-W01, walk B5-W3. W2.10 complete on the branch; ACCEPTED only after staging verification) |
| W2.12 | No «Mulai Pemetaan Awal» offer without one (RV-7); the seeded lesson's missing audio (RV-8) | RV-7, RV-8, J6.5 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; RV-7 no Pemetaan Awal offer without one, its refusal in the shell; RV-8 a missing recording said in words; B5B-PEMETAAN-K01, B5B-MEDIA-K01) |
| W2.13 | Teacher and admin UX: «nomor induk» (UX-09); Konfigurasi waiting counts (UX-33); per-class flags (UX-37); new result as next action (UX-40); «Penguasaan per bagian» heading (UX-41); educator recovery line (UX-45); certificate refusal label (UX-46) | UX register | E | 4–5 | PARTIAL (Batch 4: UX-33. Batch 5, D-156, on the branch: UX-37 B5C-BERANDA-K01, UX-40 B5B-HASIL-K01 with migration 20261227100000, UX-41 rows named by objective (the heading keeps «Penguasaan per bagian» at the promotion gate: new words AWAIT DR GLADYS), UX-45 B5C-TOLAK-K01, UX-46 B5B-SERTIFIKAT-K01. UX-09 AWAITING DAISY) |
| W2.14 | «ditugaskan» residue in learner and Studio strings, under C2 (D-135(d)) | UX-19 | E | 7 | NOT STARTED |
| W2.15 | Transfers: walk end to end; destination by name per F-10 | CR-41, OP-4, RV-18, J3.10 | E after Y | 4 | VERIFIED ON STAGING — INTERNAL ACCEPTANCE PENDING (Batch 4; D-155, staging walk 41612169706;, per F-10; F24-P01/P02, B4-PINDAH-K01, walk B4-W6/W7) |
| W2.16 | Educator-as-learner polish | CR-57, J9.8 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; DAISY-35 items 1–4; item 5 (PD Kelas «Lihat bukti» presentation) AWAITING DAISY: no composition; B5B-AJAR-K01) |
| W2.17 | Names and reads proven at 10× staging's enrolments | FD-4, R.5 | E | 8 | VERIFIED LOCALLY (5 Nov) — W217-SKALA-01 (selftest/app.test.ts) seeds 13,300 more active enrolments in one school (10× staging's 1,323) and was red: Konfigurasi's enrolment read passed the statement timeout (57014, 8 s) even for a page of 50, because the enrolments policy (enrollment_readable, per row) runs on every enrolment a school ever had before ACTIVE can prune, and both people pickers (transfer, roles) were drawn empty. Fix: migration 20261230100000 `school_people_page` decides access once per school (INSTITUTION_ADMIN; «every school» for the platform administrator only) and reads the school's ACTIVE enrolments by index, a page of at most 50, searchable by name (`cari_orang`, copy B38). Held by F30-S01 (selftest/db/fable30.sql; a planted missing scope check is caught) and W217-SKALA-01 green (162 ms / 65 ms). EFF-K02 restated with the reason; migration baselines 195 → 196 |
| W2.18 | Teacher's view of one learner shows the objectives they struggle with | J5.13 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; tujuan_belum_tercapai, migration 20261225100000; B5C-MURID-K01, F25-T01/T02, walk B5-W5) |
| W2.19 | Email operational truth: a list of stuck sends; «accepted» vs «handed off» | J1.9 | E | 4 | VERIFIED ON STAGING — INTERNAL ACCEPTANCE PENDING (Batch 4; D-155, staging walk 41612169706;; F24-E01, walk B4-W9) |
| W2.20 | A production school-founding path (audited, versioned), per F-9 | J1.1 | E after Y | 9 | BLOCKED — OWNER DECISION |

## W3 · Daisy's design on every screen (X.12)

Status per screen: the design reconciliation found **J2, J5 and J6 not applied** and **J1, J3, J4 and J7 components only**. 63 routes in all.

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W3.1 | **Shell accessibility**: skip link «Langsung ke isi»; a page title per page (none exist) | every J record; WCAG 2.4.1/2.4.2 | E | 2 | NOT STARTED |
| W3.2 | Empty state = a sentence and an action (CR-46) | 08 Feedback; X.5 | E | 2 | NOT STARTED |
| W3.3 | Primitives: FileField (closes RV-5); one date helper with WIB and the date in words (RV-16); select chevron; 44 px Radio/Checkbox rows; Badge shape; Alert icon on `.pin-perhatian`; disabled-button reason; log-out icon; tab icon; Disclosure chevron on every `<details>` | 08 rows; RV-5, RV-16, RV-21 | E | 2 | NOT STARTED |
| W3.4 | Table / Collection (search, filter, pagination) as a shared component | CR-88; J2 | E | 2 | NOT STARTED |
| W3.5 | Account menu and the one Dialog (JQ2(a)); **J2 Kelas** roster as a Table | J2 | E | 2 (components) + 4 (screens) | DONE — PROMOTION PENDING (Batch 2 components; Batch 4 J2Kelas roster Table, B4-J2-K01) |
| W3.6 | **Konfigurasi**: page split or index; sections on the Collection pattern; RV-24, RV-18, RV-15, RV-16 | design §2 | **D** then E | 4 | BLOCKED — EXTERNAL DEPENDENCY (Daisy: no Konfigurasi composition). Batch 4: RV-16 dates and RV-18 (W2.15) done |
| W3.7 | Pendataan, Aktivasi: field widths, hints, label case | RV-22 | E | 4 | VERIFIED ON STAGING — INTERNAL ACCEPTANCE PENDING (Batch 4; D-155, staging walk 41612169706;; B4-BIDANG-K01, walk B4-W0) |
| W3.8 | **Report pages** Ringkasan Kelas / Sekolah: shell, class, school, period, print | RV-11; J7.2–7.4; X.7 | **D** then E | 5 | PARTIAL — the grammar-covered parts on the branch (Batch 5, D-156: staff shell, school / class / period named, print without navigation; B5A-LAPORAN-K01, walk B5-W4); the report body and print layout AWAIT DAISY (no composition) |
| W3.9 | Pimpinan: «(0/5)» explained; repeated labels («Peserta» in academic metrics vs J9.3); touching cards | RV-9 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) for «(0/5)» as the CR-46 sentence and the spaced cards (Batch 5, D-156; B5A-PIMPINAN-K01). The repeated labels stay Terminology v1's «Peserta» (ruling 8) and «Kenaikan» at the owner's promotion gate (3 Nov): distinct words AWAIT DR GLADYS (W4.2) |
| W3.10 | Learner (J4 residue): answer-count line, «Halo, …», accessible names; **the learner screens are 674–675 px wide in a 640 px window (1280 at 200 % zoom; Batch 0 baseline)**; the lesson's `<audio>` control has no visible focus indicator | J4; `batch-0/03` | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; 640 and 320 px with no sideways scroll, accessible names, the answer count; B5B-LEBAR-K01, B5B-NAMA-K01, B5B-DIJAWAB-K01, walk B5-W6) |
| W3.11 | **J5 Jendela** on Siapkan: date echo, «(opsional)», refusal under the field with focus; **J1 part two** «✓ Disediakan» | J5, J1 | E | 3 | NOT STARTED |
| W3.12 | **J3 navigation under L3**: the composition predates the working-context model; the rail (OP-1) and group labels (OP-2) | J3, OP-1, OP-2 | **D** (restate) or Y (accept deviation) | 5 | BLOCKED — EXTERNAL DEPENDENCY |
| W3.13 | **J6 Peragaan** evaluation band (region, title prefix, leaving line) | J6 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; the MODE PERAGAAN band, title prefix, leaving line; leaving returns the evaluator to the Hub signed in as themselves, sign-out ends both (D-157(c)); B5B-PERAGAAN-K01, b5-fokus F1) |
| W3.14 | **J7 idle warning**: top, heading, alert, layer tokens | J7 | E | 2 | NOT STARTED |
| W3.15 | Tour: focus box and ring; sheet not covering its target at 320 px; tour not blocking the landing | RV-19, UX-38 | E | 5 | IMPLEMENTED, PROMOTED TO STAGING AND VERIFIED (D-158) (Batch 5, D-156; the tour non-modal, ring clear of its target, sheet clear at 320 px; B5B-TUR-K01, UX1-TUR-AKSES-01 restated). Settled by the owner (D-157(b)): the tour stays non-modal, dismissible and keyboard accessible; keyboard operation, dismissal and continuation walked (b5-fokus F2) |
| W3.16 | The `/` chooser and the context control: Daisy's look; Dr Gladys's six words | CR-54 S2, D-132(m) | **D** + G then E | 5 | BLOCKED — EXTERNAL DEPENDENCY |
| W3.17 | Mengajar: badges at 320 px (RV-20); TombolKirim result words wherever a submit changes state | RV-20; 08 Actions | E | 3 | NOT STARTED |
| W3.18 | Studio and others: the remaining 08 rows per page; Tailwind-composed pages moved to `pin-*` | design §3 | E | 3–5 | IN PROGRESS |
| W3.19 | **Certificate as designed**, one A4 page, institution mark (CR-03/04) | J8.4 | E after F-11 | 6 | IMPLEMENTED ON THE BRANCH, PROMOTION PENDING (Batch 6, D-159/D-160): Daisy's frozen round-2 sheet in mm (header pair, record, the 0.75 mm gold line at 176 mm, the band «Diterbitkan oleh» with the school as text and no logo, the verification group, QR level Q), one clean A4 page (DAISY-36); B6C-*, journey STU17 print. **STILL AWAITING:** F-11 (the licensed wordmark master: today's logo holds the slot per D-160(a), so «SELALU» prints; the physical print proof that freezes the gold line and the phone scan of the denser QR, D-160(b)); a contract decision for the sage accent (no read tells the page a certificate is professional learning, so every sheet is plum); Firefox/Safari/real-device print |
| W3.20 | **Digital Card** final (CR-21); **identity emails** final (CR-22, J2.15); **wordmark** in the shell and emails (OP-3/AP-1) | CR-21, CR-22, OP-3 | E after F-11 | 6 | PARTIAL (Batch 6, D-159/D-160). **Digital Card: IMPLEMENTED ON THE BRANCH** (DAISY-24's frozen front and back, CR80 in mm, D-074 family colours by the first role alphabetically, the ochre line, the QR tile; «Akun saya» and the activation welcome; staff only; no photo; B6K-*, print walk P4). **Identity emails final: AWAITING DAISY** (DAISY-37 has no composition; the card in the email needs it). **Wordmark in the shell and emails: AWAITING F-11** (the licensed master). D-074(10), more than two role/school pairs: UNRESOLVED (nothing invented). Email status honest (D-160(d), B6E-*) |
| W3.21 | Republish the Design System page (v18 predates c42fecb) | 07 §4 | D | 6 | NOT STARTED — DAISY's (republishing her own Design System page; not engineering) |
| W3.22 | A4 print preview check per surface | 08 Print | E | 6 | IMPLEMENTED ON THE BRANCH, PROMOTION PENDING (Batch 6): the A4 print of each surface walked in a real browser (audit/b6-cetak.mjs in CI journeys: the staff and learner shells print no shell part, the class-card sheet only the set, two across, no card split; the Digital Card at CR80 actual size; the certificate one A4 page, journey STU17); Konfigurasi's section menu found printing and fixed (B6P-K01). Chromium only: Firefox, Safari and real devices not proved |

## W4 · Words

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W4.1 | Migrations for the v1 rows held in the database (C29, C30, D23 locations in words; C31, B15, B16; RV-15 seed name; one English finding) | OP-5, UX-17 | E | 1 | PARTLY IMPLEMENTED — VERIFIED ON STAGING (Batch 1: C29, C30, D23, UX-17, B15, B16; C31 retained; English rule and RV-15 await approved text) |
| W4.2 | **Dr Gladys's terminology decisions, asked in writing now:** «penilaian» strings after the inventory (OP-6); Bank Soal measured difficulty (OP-7); six context words (D-132(m)); the L4 §4 word list (shuffle values, limit units, misconception singular, visualization and report names) | OP-6, OP-7, D-132(m), L4 §4 | G (via Y) then E | ask now; apply 7 | BLOCKED — EXTERNAL DEPENDENCY |
| W4.3 | `auth.belum_siap` through the canonical copy review | L-copy | E | 7 | NOT STARTED |
| W4.4 | The compositions' new interface words into `hle.ts` («Langsung ke isi», «Ciutkan navigasi», «Buka/Tutup menu», «Disediakan», «Terkirim», «(opsional)», Table strings, the idle heading) | J1–J7 READMEs | E | with each screen | NOT STARTED |

## W5 · Security

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W5.1 | **CR-91** enforced in the database per F-3 (recommended: class cards for learners only; red → green tests) | CR-91, X.2, X.8 | E after Y | 1 | VERIFIED — INTERNAL ACCEPTANCE PENDING (Batch 1, D-145; staging 2 Nov) |
| W5.2 | Answer-key sources moved out of the repository per F-4; L4-C01 restated; summative items regenerated if exposure is confirmed | S1; D-032 | E after Y | 1 | PARTLY IMPLEMENTED (Batch 1: sources removed, L4-C01 restated; private store and regeneration: owner) |
| W5.3 | Branch protection on `main` (required CI, no force push), **required before the next merge to `main`**; settings proposed in `batch-0/04` §6 R-1 | 05 §1.1; D-143 | Y | before batch 1 merge | BLOCKED — OWNER DECISION |
| W5.4 | Re-run the security suite (RLS, isolation, sessions, credential privacy, audit) on the release candidate | 04 | E | 8 | VERIFIED LOCALLY (5 Nov), CI dispatched — `batch-8/evidence/w54-keamanan.md`: the whole manifest on the candidate (843/0 at c256cd69; on the upgraded tree 781 + the 62 a Docker failure interrupted, re-run green); launch-readiness 24/24 PASS (RLS closed, G7 rights and functions as released, append-only audit); secret scan 0 findings not allowed. **Found and fixed:** 4 production dependency advisories, one critical (Next.js 16.3.5) → Next 16.4.5 and `npm audit fix`, production 0; residue 8 moderate in the lint toolchain only (fix is a major downgrade), with reason. The first W2.17 run's 10 red rows were this suite catching an unregistered SECURITY DEFINER function, fixed before c256cd69 |

## W6 · Regression, evidence, accessibility

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W6.1 | **Universal rules as rule-level tests**: X.1, X.3, X.8, X.11, J3.11, J7.8 | CR-59 | E | 8 | VERIFIED (D-186, 5 Nov) on c9fec859: CI run 41972257722 (the rule-level tests below), journeys run 41972261935 (the N8 walk in e1-navigasi): **J3.11** held by F28-J311 (`selftest/db/fable28.sql`); **J7.8** by D060-J78-01 (`selftest/aturan.test.ts`; three applied migrations recorded as exceptions); **X.11** by DAISY-17-KIRIM-01 (forms) and X11-KLIEN-01 (client calls), with one defect found and fixed at its source: «Laporkan masalah» could be sent while its screenshot was still uploading, losing it, and a second pick could be overtaken by the first (`src/components/lapor/TangkapanLayar.tsx`; walk `audit/e1-navigasi.mjs` N8, red before: `docs/completion-4.0/batch-8/evidence/x11-merah-sebelum.txt`). **X.3** by X03-BERHASIL-01 (every call of a function that can answer ok: false reads it; every action's success is conditional on its call's error; no defect found). **X.8, internals** by X08-DALAM-01, with one defect fixed at its source: the learner's server actions answered the browser with the database error's own text (unused by any screen, readable in the network panel); they now answer the stable code and its detail only (`src/app/belajar/actions.ts`; red before: `docs/completion-4.0/batch-8/evidence/x08-merah-sebelum.txt`). X.8's no-oracle half stays held by the behaviour tests that read refusals as each role (F06-N01, F23–F26). **X.1** by X01-KLIK-01 (62 of 66 pages linked by clicking; 4 declared entrances that are not a click, each checked where PINTAR sends the person; no defect found) |
| W6.2 | U-PERF re-measured after L3 and the shell (≤ 3 s first screen; clicks < 3 s; p95) | CR-58, X.10 | E | 8 | PRE-CHECK GREEN LOCALLY (5 Nov); STAGING PENDING P-1 — `audit/perf/layar-pertama.mjs`: 15 first screens across 6 roles, worst of three ≤ 488 ms; now a regression gate in CI's journeys. The measurement of record is `perf-staging.yml` on the promoted candidate. `batch-8/evidence/w69-bukti-pemeriksaan.md` §2 |
| W6.3 | Level 3 coverage added: network loss (CR-30), educator as learner (J9), rollover, class move | CR-30, J6.8, J9 | E | 8 | VERIFIED (read 5 Nov, D-186): already walked in the Level 3 journey on every journeys run, `audit/journey.mjs`: S21 (`luringDi`: the network drops before «Simpan jawaban ini», the answer is kept on the device and sent when it returns), C12a–C12k (`audit/c12.mjs`, run from journey.mjs: the Guru learns as a participant; C12d drops the network in Bab 1's test), S25 (class move), S27 (year rollover). All 77 steps PASS on dc2d7f93, run 41954186068 job B. This row was stale since 2 Nov |
| W6.4 | Crawl: clipping as well as overflow; axe; 1024–1279 px | X.6 | E | 0 / 8 | VERIFIED LOCALLY (5 Nov), CI journeys green on 715f6f7d — the crawl checks clipping and the 1024 px rail (82e80117, 30deb670); 14 personas, 55 screens, 0 broken, 0 axe violations. One defect found and fixed: the Studio question review was 322 px wide at 320 px (a misconception code; `.pin-opsi-isi`); the keyboard walk now reads with reduced motion. `batch-8/evidence/w69-bukti-pemeriksaan.md` §1 |
| W6.5 | **Studio end-to-end proof** (Level 3, staging): a never-imported chapter; a Guru authors; a failed upload fixed; a head of department rejects once (W1.6) and then approves; the admin publishes; the teacher assigns; the learner opens. Plus per-row errors in a browser, and the HOD publish refusal | mandate §6; J4.1–J4.6 | E | 3 | NOT STARTED |
| W6.6 | PINTAR-standard chain walked: import → second platform admin approves → distribute → teacher assigns → learner. Bab 1 re-import as library content | J1.5, J4.11, CR-51 | E after F-6 | 8 | BLOCKED — OWNER DECISION |
| W6.7 | Uji Cepat at Level 3 incl. the score and no certificate | CR-34, J5.5, J5.7 | E | 3 | NOT STARTED |
| W6.8 | The real-app 50-student test on current main | owner instruction | E | 8 | BLOCKED — P-1: `perf-l1.yml` `mode=browser` writes synthetic sittings on staging and would measure Batch 5 today; it runs on the promoted candidate |
| W6.9 | Release checklist v2.8 regenerated; stale PASS rows re-proved (U-PERF, STU-12, ADM-18/X-09 wording) | 9 Oct update §1.2 | E | 8 | NOT STARTED |
| W6.10 | Browser walks for clauses proven only at HTTP or DB level, or on an older SHA: J1.6 maintenance; J1.8; J2.1 unknown address; J2.9 «Keluar semua»; J2.10 60-min/3-PIN end; J2.12 ladder and assisted reset; J2.18 resend; J2.20 long idle; J6.4 hints; J6.7 pause (STU-08); J10.2 forced 500; J2.7 synthetic staff transition | B-matrix | E | 8 | VERIFIED for the ten walked clauses on c9fec859 (5 Nov): `audit/b8-jalan.mjs` 9/9 PASS in journeys run 41972261935 job A (after rb-ujung), CI run 41972257722 green, journeys job B green; also 9/9 locally on a freshly reset database. The first CI run (41968151150, c3008a67) failed J2.18 only: job A's app had no PINTAR_SMTP_*, so «Lupa password» answered «sedang tidak dapat memproses» for the real account and the stranger alike (no leak, fails closed); job A now has PINTAR's own Mailpit (c9fec859), application unchanged. Outstanding: J2.7 (owner-authorised staging rehearsal) and J10.2 (static BOB07-K03 accepted for the current scope), both below. J1.6, J1.8, J2.1, J2.9, J2.10, J2.12, J2.18, J2.20, J6.4, J6.7 walked. The J1.8 walk found a defect: /akun under an evaluation persona reached the staff check, not a reason; fixed at source (`src/app/akun/page.tsx`, key `evaluasi.akun_tidak_ada`, Gladys pack B36), red evidence `batch-8/evidence/j18-merah-sebelum.txt`. A second defect, found while building J6.4/J6.7: the database let a learner start the Uji Penguasaan before the Pemetaan Awal was finished (only the screens held the order); migration 20261229100000 adds PRE_TEST_NOT_FINALIZED to may_start_assessment, held by F29-S01, red evidence `batch-8/evidence/f29-merah-sebelum.txt`; fixtures in fable03 and fable04 that sat the Uji Penguasaan alone now finish a Pemetaan Awal first, no assertion removed. Not walked: J10.2 forced 500 (no way to force one without adding production code; held by BOB07-K03, the error boundary's source); J2.7 synthetic staff transition BLOCKED on the owner |
| W6.11 | An independent review of the running application after each batch (D-140(b)) | governance | E (second reviewer) | every | per batch |
| W6.12 | **NVDA and TalkBack** pass; **200 % zoom**; colour vision; keyboard on real screens | L-a11y; W5 (2 Nov) | E | 7 | PARTIAL (5 Nov) — 200 % zoom (640 px), keyboard walk and contrast GREEN on 55 screens; colour vision under emulation: state never by colour alone. **NVDA and TalkBack need a person with the devices** (Windows, Android). `batch-8/evidence/w69-bukti-pemeriksaan.md` §1, §3, §4 |

## W9 · Operational readiness and release (Phases 4–5)

| Id | Item | Source | Who | Batch | Status |
|---|---|---|---|---|---|
| W9.1 | **#150 B3**: scoped token C1 (Backups: Read, production) → G6 can read backups. **Until then every production migration is refused** | B3; D-106 | Y (≈15 min) then E | now | BLOCKED — OWNER DECISION |
| W9.2 | Staging session-pooler host/port/user (pre-O3) | D-111(c) | Y | now | BLOCKED — OWNER DECISION |
| W9.3 | Compute tier chosen (Q2) on the first-deployment size (Q3); L1 rerun at that tier (CAP-02, CAP-07, CAP-08) | D-089; R.4 | Y then E | 9 | BLOCKED — OWNER DECISION |
| W9.4 | Auth IP forwarding and key; CAP-01 burst | D-092(c), A8 | Y then E | 9 | BLOCKED — OWNER DECISION |
| W9.5 | **#150 B4/B9**: off-platform backup on real infrastructure (O3 AWS S3 Singapore with Object Lock, O5 Storage keys, O6 C2); a green run, a planted red, a drill 24/24 | D-106(b)(g), D-107 | Y + X then E | 9 | BLOCKED — EXTERNAL DEPENDENCY |
| W9.6 | **#150 B5**: escrow to R1 + R2, separate custodians, possession proofs | D-109(c) | Y | 9 | BLOCKED — OWNER DECISION |
| W9.7 | **#150 B6**: second administrators on every account; offline recovery codes | D-106(d) | Y | 9 | BLOCKED — OWNER DECISION |
| W9.8 | **#150 B7**: production watch on (O10) | D-106 | Y at release | 10 | NOT STARTED |
| W9.9 | **#150 B8**: configuration reconstruction rehearsal (O8, billable restore) | D-106(f), D-111(g) | Y + E | 9 | IMPLEMENTED — NOT VERIFIED |
| W9.10 | **Production upgrade rehearsal** 111 → 177+ on a scratch copy of production (P1, CR-68); production DB read for the first time (with permission); the order of migration 162 (F-5) | P1; Q15 | Y + E | 9 | NOT STARTED |
| W9.11 | **Legal gate**: UU PDP, PSE registration, controller/processor, retention, parental consent; content rights (Q5); AI-tooling policy (Q6); commercial answers (Q19); privacy line on backup retention (O11) | D-117(m), CR-74 | Y + X (counsel) | 9 | BLOCKED — EXTERNAL DEPENDENCY |
| W9.12 | **Recovery readiness after a logical restore** (D-154; restore rehearsal 41594063773, 3 Nov): the documented restore keeps every PINTAR table's data, but the restored copy fails six launch-readiness checks: (1) the anonymous surface changed (10 / 19 / 509 anon functions); (2) the audit trail is not append-only (9 client write grants); (3) G7: anon holds rights on 142 public relations; (4) G7: authenticated's function grants differ (289 of 509); (5) G7: authenticated's table rights differ (228); (6) G7: the private `assets` bucket is missing. Also: PINTAR's auth.users triggers are not in the backup (the corrected step recreates them); the backup-list API answers 403 to the token (W9.1) | D-154; W9.9; #150 | E + Y | 9 | NOT STARTED |
| W9.12 | Break-glass for the sole production admin, rehearsed | C-11, J1.7 | Y + E | 9 | NOT STARTED |
| W9.13 | Production email: SMTP password, Gate 8 Auth settings, SPF/DKIM/DMARC pass in received headers | REL-08, CR-70 | Y then E | 10 | IN PROGRESS |
| W9.14 | Existing-staff transition rehearsed; magic link retired | CR-24, CR-25, J2.6, J2.7 | E | 10 | NOT STARTED |
| W9.15 | DNS `verifikasi.pintarselalu.com` | CR-11 | Y | 10 | BLOCKED — OWNER DECISION |
| W9.16 | Support tiers named; same-day answer | CR-71, REL-13 | Y | 9 | BLOCKED — OWNER DECISION |
| W9.17 | Mail capacity for the pilot; separate staging and production mailboxes or not | CR-73, R.6 | Y | 9 | NOT STARTED |
| W9.18 | Release mechanics: `RELEASE_SHA` in both deploy workflows; Node 20 in the production apply job; release evidence pack | D-004 | E | 10 | NOT STARTED |
| W9.19 | Efficiency items (Auth round trip, /pimpinan cache, prefetch, Konfigurasi paging) | CAP-09 | E (owner priority) | 8 | IN PROGRESS |

---

## Stale or incorrect closure claims found in Phase 0 (records kept; corrected here)

1. **CR-13** «closed (server and route)» overstates the line, because there is no screen. Appendix A «NOT BUILT» is also wrong, since the RPC and route exist. **IN PROGRESS.**
2. **CR-41** «form takes raw UUIDs»: named selects exist. The gap is the authorization ruling.
3. **CR-30** «OPEN»: S21 asserts network loss on every journeys run. What is missing is Level 3 coverage.
4. **J1.6 / CR-39** «audit reader not walked»: S23j walks it on 001a357.
5. **Appendix A (6 Oct)**: J4.8, J4.10, J7.5, J8.3, J8.4 (number), J10.1, J6.11 and J6.12/13 are all stale. Each is now covered on 001a357.
6. **U-PERF PASS, STU-12 PASS** (release checklist) rest on pre-L3 evidence. **Re-prove.**
7. **CR-18 / J2.18** closed on an older SHA. EVIDENCE-MODEL rule 3 says evidence does not carry forward. **Re-walk.**
8. **2 Nov plan W3.8** «Laporkan masalah still the old header»: wrong. `/lapor` uses the shell since 44cebee.
9. **RV-5** «not changeable without replacing the native control»: Daisy's FileField spec solves it without that. **Closable.**
10. **#150 B3** «on hold (D-105)» in the review and the 2 Nov plan: D-106 superseded D-105(d). B3 is required, and the owner action is O2.
11. **#150 B4/B9/B8** listed as «owner ruling» in the 2 Nov plan: D-106 already ruled them required. What remains is owner *actions*.
12. **ENGINEERING COMPLETE «declared 5 Oct»** while EC lines J1.5, J1.9, J2.7, J2.15, J2.17 and J2.21 were open. The declaration was premature.
13. **CR-51 «CLOSED (with residuals)»**: J1.5 cannot be completed as built without a second platform admin.
14. **CR-75 «Names shown (L4)»** (closure register, 6–9 Oct): the integrity page never showed a learner's name. Its read embedded the learner through an ambiguous key (a sitting also keys who terminated it, 20260914094500) and PostgREST refused it, so every sitting read «—». Found by the Batch 5 walk; fixed and held (L4-K01, B5-INTEGRITAS-K01, journey S23i).

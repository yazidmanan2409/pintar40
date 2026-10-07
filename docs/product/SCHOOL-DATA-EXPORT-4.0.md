# What a school can get out of PINTAR 4.0 today (D-110(b))

**Read only, from the code, 6 Oct 2026** (`main` at `67130c9`; `src/`, migrations, scripts and workflows as on
`cc2307e`). Nothing was built, changed or decided to write this. A capability is listed only where a page, button or
route exists and its authorisation was read; data that merely exists in a table is not counted. D-110 is the principle
(NO HOSTAGE DATA); this page is the fact. **Self-service school data export is a 4.5 candidate, not a 4.0 feature.**

## In one paragraph

A school cannot export its data in a structured form today. Nothing in `src/` produces a CSV, XLSX, JSON or PDF file
of school data: no route sets `Content-Disposition`, `text/csv` appears only as an accepted *upload* type, and the one
browser download (`createObjectURL`) is a blank template. What a school can take away is what it can **print** through
the browser (two summary reports, a learner's own certificate, a freshly issued class-card sheet). The PINTAR team has
**no tool that extracts one school's data**: the only extraction tooling backs up the whole database and every Storage
file, for all schools at once. Getting one school's data out would be new, unreviewed engineering work on production
data, which needs the owner's approval first.

## A. What a school can do itself

| What | Who | What it contains | How | Evidence |
|---|---|---|---|---|
| «Cetak laporan»: the class summary and the school summary | readers the database authorises at that school (educator, head of department, dean; a SYSTEM_ADMIN sees every school) | aggregates only: participants, comprehension, net gain, readiness, topic mastery, misconceptions (class); participants, net gain, safety-gate pass rate, verified credentials, competency outcomes, cohort comparison (school) | the browser's print (`window.print()`), "print or save as PDF" by the browser; no file is produced by PINTAR | `src/components/laporan/AksiLaporan.tsx:30`; `src/app/edukator/ringkasan/page.tsx`, `src/app/dekan/ringkasan/page.tsx`; `generate_report` in `supabase/migrations/20260923090000_a_reader_sees_the_part_of_the_school_they_stand_in.sql:358-431`; metrics in `20261011100000_every_school_has_its_standard_reports.sql:159-165`; test HOD09-K01 |
| A learner's own certificate: print or save as PDF, copy its link | the learner, for their own ISSUED certificate only | institution, name as issued, course, predikat, issue date, certificate number, verification link and QR | the browser's print; no server-made PDF (D-073, D-076) | `src/components/sertifikat/AksiCetak.tsx:5-13`; `src/app/belajar/[tugas]/sertifikat/page.tsx`; tests UX1-S1-QR-01, UX1-S1-CERT-ELIGIBLE-01, UX1-S1-KAKI-01. **No test asserts the print button for an ISSUED certificate** |
| Public certificate verification | anyone with the link | pass, predikat, institution, date, validity | `/verifikasi/[token]` page and `/api/verifikasi/[token]` (JSON) | `src/app/api/verifikasi/[token]/route.ts`; tests F04-T10, F04-S01, F04-S05, F01-R07 |
| A class-card sheet (Kartu kelas) | SYSTEM_ADMIN, or a holder of CAN_PROVISION_PEOPLE at the school | name, school number, card number, PIN, sign-in address; no photo | the browser's print, **only for cards issued in that browser session** (PINs are never stored, so existing cards cannot be re-printed; a card can be re-issued) | `src/components/aktivasi/LembarKartu.tsx:38`; `src/components/aktivasi/KartuUlang.tsx`; tests M7-K01, BOB28-A03, F09-A02 |
| The lesson workbook template (.xlsx) | Studio users holding CAN_DRAFT at a school | headings and guidance only: **no school data** | a browser download built on the page | `src/components/unggah/PanelUnggah.tsx:95-107`; tests DAISY-06-TEMPLAT-01, DAISY-06-UNGGAH-01/02 |
| A staff member's own PINTAR ID card | the staff member | name, PINTAR ID, its link, role and school | shown on `/akun`, emailed to the person's own address; not a file | `src/app/api/akun/kartu/route.ts`; tests F18-N05, BOB26-A04 |
| One Storage file at a time (a profile photo, lesson media, a support screenshot) | whoever may read that exact object | the one file | a short-lived signed link; no listing, no bulk download | `src/app/api/assets/read-url/route.ts:31-77` |

Every other screen (teacher evidence views, learner views for leaders, Konfigurasi tables, integrity reviews) can only
be printed with the browser's own Ctrl+P; none has an export or print control. Roster intake (`/pendataan`) is import
only.

## B. What the PINTAR team could supply by hand

- **Nothing scoped to one school exists.** No script, workflow or admin screen extracts one school's data.
- `scripts/recovery/backup.mjs` (`backup-offsite.yml`, on `main` since 6 Oct, **not yet active**: O3-O7) backs up the
  **whole** database and **every** Storage object, encrypted to the recovery keys; `restore-bundle.mjs` restores a
  whole bundle. Supabase's own daily backups are likewise whole-database.
- The SYSTEM_ADMIN screens show any school's summaries (printable, as in A) and, on screen only, the latest 50 audit
  rows, enrolments, roles and transfers. No downloads.
- So, for one school today, the only operator path would be to restore or query a whole-database copy by hand. There
  is no procedure or tool for it in the repository; doing it would be new engineering on production data and needs the
  owner's approval.

## C. What cannot be exported today

Looked for in every API route, the `src/` pages and components, the migrations' functions, `scripts/` and the
workflows; no export path was found for:

- raw answers and responses (`responses`, `presented_items`);
- results, evidence and mastery history (`assessment_results`, `lesson_progress`): on screen only;
- the audit log: on screen only, latest 50 rows;
- content the school authored (courses, lessons, items, options, releases): it can be imported from a workbook, not
  exported back to one;
- Storage files in bulk (one at a time only, as in A);
- user, roster, account, card-number, role and enrolment lists: on screen only;
- integrity signals and reviews: on screen only, latest 50;
- saved reports: each print run writes a `generated_reports` row, but no screen lists or reopens them;
- feedback rounds, support reports, and a staff list of issued certificates: on screen only.

## D. Related things that are documented but not built, or still open

- **Departure and export are designed, not built.** `docs/rebuild/06-PINTAR-EVIDENCE-AND-TELEMETRY-CONTRACT.md:150-156`:
  "an institution leaving PINTAR receives an authorized export of its institution-scoped records and its learners'
  evidence in a documented format; … certificates remain publicly verifiable; identifiable institution-scoped records
  are then anonymized/deleted per the retention policy". `docs/rebuild/04-PINTAR-STATE-MACHINES.md:112-114` describes an
  export for a transfer to a non-PINTAR school. Neither exists in code.
- **Retention and deletion are not built.** `institutions.retention_days` exists
  (`supabase/migrations/20260912004244_organisation.sql`) and nothing uses it; institutions and persons cannot be
  deleted at all (`institutions_no_delete`, `persons_no_delete`); the audit log cannot be deleted. OD-5
  (`docs/rebuild/11-PINTAR-OPEN-DECISIONS.md:80-95`) is "architecture resolved; legal durations open", and forbids
  inventing legal retention periods.
- **Backups outlive deletion.** Two layers, not one: **today**, Supabase's own daily backups, kept **7 days** (D-103);
  **once active** (built, not yet switched on: O3–O7), the independent encrypted copies, kept **35 days** (daily) and
  **12 months** (monthly) (D-107 D4). `docs/recovery/OFFSITE-BACKUP-DESIGN.md:74-76` notes that data removed from
  PINTAR remains in backups until they age out.
- **Student transfer between PINTAR schools is built, as a move inside PINTAR, not an export.** Only enrolments and
  memberships are portable (`supabase/migrations/20260912004527_transfer_rollover.sql:15-19`); certificates, content,
  the audit log and role assignments stay with the school. The authorise action sends an empty consent record
  (`src/app/konfigurasi/actions.ts:93`); consent rules, including a sending school that is unresponsive or no longer a
  customer, are open decision OD-9 (`docs/rebuild/11-PINTAR-OPEN-DECISIONS.md:134-148`). Tests F01-T10, F07-P10.
- `docs/recovery/PINTAR-4.0-SCOPE-INVENTORY.md` has no export or departure journey.

## What this means for an honest answer today

- "Can we download all our data?" — Not in 4.0. Today a school can print its summary reports and each learner's
  certificate, and certificates stay verifiable by link. A full export is a 4.5 candidate under D-110; until it is
  designed, there is no tool for it, even for the PINTAR team.
- "Can we open it in Excel?" — Nothing PINTAR produces today is a spreadsheet of school data.
- "What happens to our data if we leave?" — The principle is fixed (D-110: no hostage data, an orderly exit), but the
  exit journey, the export and the retention and deletion mechanism are not built, and the legal durations are
  not decided (OD-5).

These are the facts at the commit above; when any of it changes, this page changes with it.

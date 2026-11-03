# Batch 5 · Protected merge and staging verification (3–4 Nov 2026)

**Authority:**
- Owner, 3 Nov: «PINTAR 4.0 — BATCH 5 CONTROLLED PROMOTION — CONDITIONAL GO» (D-157).
- Owner, 4 Nov (WIB): «PINTAR 4.0 — Batch 5 Backup Check — CONDITIONAL GO» (D-158).

## Verdict: VERIFIED BATCH 5 STAGING CANDIDATE · not a declaration of full acceptance

- Batch 5 is merged through the protected path, and migrations 189–193 are applied to staging (193).
- Every staging walk is green on a fresh synthetic test school, «Sekolah Uji B5 1104» (`sekolah-uji-b5-1104`):
  - the Golden School regressions GS-01 to GS-21;
  - the Studio walk;
  - **the Batch 5 walk, 6 of 6**;
  - accessibility.
- Dr Gladys's demonstration school, and every existing result, official result, certificate and integrity record outside the test schools, are unchanged (whole-row digests).
- **The staging freeze is restored** (D-158).
- Production was not touched. No Batch 6 work.

## 1. The gate, the merge and what ran

| Item | Evidence |
|---|---|
| Backup (owner) | The latest physical staging backup is 2 Nov 23:40:21 UTC (3 Nov 06:40:21 WIB), with a restore available. The owner verified it from the dashboard. The merge, at 3 Nov 19:55:47 UTC, was about 20 h 15 min after it: inside the 24 h window. |
| Final CI evidence | PR #8's final head `469dde2`: `ci` 41644822454 green, journeys 41644821806 green. Code head `b8ba042`: `ci` 41640033654 and journeys 41640031926 green. |
| Prerequisites (read only, 19:55 UTC) | 188 migrations, digest `776956cb…` (= the repository's first 188). The two bodies 190 replaces are byte-identical to the repository's (`e1cd1099…`, `14e24ea3…`). None of 189–193's objects existed. Record: `evidence/staging/preservation-before.txt`. |
| Pull request | [PR #8](https://github.com/yazidmanan2409/pintar40/pull/8): mergeable state `clean`, no bypass |
| Merge | **`3412075`**, a merge commit pinned to `469dde2` (`expectedHeadSha`) |
| Triggered on `main` | `ci` 41707829722 and `staging.yml` 41707829723 (**success**: the migration). **No production workflow started.** The PR changed no production request file and no `supabase/config.toml`. |
| Recovery arrangement | `ROLLBACK-189-193.sql`, tested locally in both directions (`evidence/rollback/`), plus the physical backup. Not used. |

## 2. Migrations 189–193 on staging (read only, after)

- **193 migrations**, the last `20261227100000`; versions digest `fb01f70314e07f1451712c7e6436b59c`.
- **Thirteen new or replaced functions,** all SECURITY DEFINER with `search_path=public, pg_temp`. Anonymous callers can run none of them.
  - Ten are open to signed-in callers: `sertifikat_sekolah`, `integrity_reviews_recorded`, `integrity_signals_awaiting_review`, `record_integrity_review`, `persons_awaiting_account_page`, `kelas_menunggu_akun`, `orang_kelas_menunggu_akun`, `tujuan_belum_tercapai`, `my_new_results`, `note_result_seen`.
  - Three are internal, closed to signed-in callers too: `integrity_signal_decided`, `kelas_menunggu_akun_anggota`, `menunggu_akun_boleh`.
- **`result_views`** has row security and no policy. 193's back-fill wrote 1,330 rows, one for every FINALIZED post-test (1,330), with none missing.
- **Registry and triggers:** the 8 registry rows are present, and PINTAR's 4 triggers on `auth.users` are intact.
- Record: `evidence/staging/migration-after.txt`.

## 3. Staging walks

**School:** «Sekolah Uji B5 1104», founded by `found-school.yml` 41708808752. The other school, whose administrator must be told nobody, is «Sekolah Uji B4 1103».

| Check | Run | Result |
|---|---|---|
| Golden School GS-01–03 | 41709137424 | PASS |
| GS-04–11 (admin, structure, publication) | 41710125178 | PASS |
| GS-07, GS-12–16 (learners, class cards, the three tests) | 41711982035 | PASS |
| GS-17–21 (reports, certificate, recovery, shared computer, public check) | 41713430814 | PASS. Includes the report figures read with the approved words «Peserta» and «Kenaikan» (`audit/staging/golden-school-laporan.mjs`). |
| Studio walk | 41717420070 | PASS |
| **Batch 5 walk** (`audit/staging/golden-school-b5.mjs`) | 41719638878 | **PASS 6/6** |
| Accessibility and keyboard | 41720925812 | PASS |

**The Batch 5 walk on deployed staging.** Every write was a press of PINTAR's buttons by a person signed in through the real screens. The database was only read.

- **K0:** staging holds 193 migrations and the Batch 5 functions and table. The school, its class, its people and an ISSUED certificate are present.
- **K1 (W2.5):**
  - The school admin found certificate `6BQ4MMGB/00001` on «Sertifikat sekolah» and gave a reason.
  - «Lanjutkan» committed nothing: the certificate was still ISSUED.
  - The in-page confirmation started with focus on «Batal».
  - «Cabut sertifikat …» then revoked it: REVOKED with the reason, `certificate.revoked` audited with the reason, the public check DICABUT, the list «Dicabut».
  - No identifier appeared on the screen.
- **K2 (W2.7):**
  - «Tinjauan Integritas» opens for the school admin with «Sudah ditinjau», and no identifier appears.
  - **No observation was waiting**, so no decision form was offered, and none was walked.
  - Why there was none: an observation is raised only by a learner's own sitting. After GS-16, no Golden School learner has a sitting left, and the walk writes nothing to make one.
  - The per-observation decision and the referrer's outcome are walked in CI: job A B5-W2, and job B S23i and S23r, on `469dde2`.
- **K3 (W2.10):**
  - The Platform Operator, in «Seluruh platform», opened Aktivasi. **Nobody waits on the whole platform**, and none is listed.
  - So paging (20 per page, the count, «Berikutnya», the search) had no list to page on staging. It is walked in CI: job A B5-W3, 20 of 50 on page 1, page 2, the search to one.
- **K4 (W3.8):**
  - The Dekan opened «Kelas 5A»'s report inside the staff shell. It names «Sekolah Uji B5 1104», «Kelas 5A» and «2026/2027».
  - It keeps the approved «Peserta».
  - In print, no navigation or header shows.
- **K5 (W2.18):**
  - The Guru opened each of the class's six learner pages. Each has «Tujuan pembelajaran yang belum tercapai», with no identifier.
  - The two learners under the school's mark show their objectives by statement: 2 and 3.

**Accessibility (judged checks, all PASS):**
- The checks: JUDUL-NAMA (25 titles, none carrying a person's name), LEBAR-1280/1024/320, PAPAN-LEWATI, PAPAN-ISI, PAPAN-MENU-0/1/2, PAPAN-DIALOG-1/2, MENU-320 and JUDUL-DITOLAK.
- Recorded: 13 distinct screens (25 pages); axe clean on 13 of 13, and could not run on 0.

**Not walked on staging, and why:**
- **MODE PERAGAAN** (W3.13, the exit to the Hub): staging has no evaluation persona at all (`evaluation_personas` is empty, read only), so there is nothing to assume there. Walked in CI: job A `audit/b5-fokus.mjs` F1.
- **UX-40**, a new result as the next step: a learner's card PIN is shown once. Walked in CI.
- **The tour by keyboard:** walked in CI, F2.

## 4. Preservation

Staging, read-only. The same query was run before the merge and after the last walk: `evidence/staging/preservation.sql`, `-before.txt` and `-after.txt`.

| Record | Before the merge | After the last walk | Difference |
|---|---|---|---|
| Demonstration school (`sekolah-demo-pintar`): roles / results / official / certificates / enrolments / courses | 4 / 10 / 10 / 3 / 5 / 1 | 4 / 10 / 10 / 3 / 5 / 1 | 0 |
| Demonstration school: audit rows (last id) | 91 (6860) | 91 (6860) | 0 |
| Demonstration school: its people | `bd41b3c9…` | `bd41b3c9…` | **identical** |
| Demonstration school: its accounts | `7deebf17…` | `7deebf17…` | **identical** |
| Every result row outside the test schools | `2440c371…` | `2440c371…` | **identical** |
| Every official result row outside the test schools | `a14f4a40…` | `a14f4a40…` | **identical** |
| Every certificate row outside the test schools | `ffa43edd…` | `ffa43edd…` | **identical** |
| Every integrity signal outside the test schools | `666ff1ab…` | `666ff1ab…` | **identical** |
| Management decisions | none | none | 0 |
| All schools: results / official / certificates / courses / transfers | 1580 / 154 / 42 / 47 / 1 | 1592 / 166 / 45 / 50 / 1 | +12 / +12 / +3 / +3 / 0, **all in «Sekolah Uji B5 1104»** (12 / 12 / 3, one of them revoked by K1 / 3) |

- No reset.
- No write to the demonstration school.
- No existing assessment record was modified.

## 5. Still open: Batch 5 is not fully accepted

| Item | State |
|---|---|
| Dr Gladys | The «Peserta»/«Kenaikan» labels at class and school level (RV-9, W3.9); the UX-41 heading; the strings written by engineering. The approved words are in place. Questions: `02-PROMOTION-PRECONDITIONS.md`, condition 1. |
| Daisy | The W3.8 report body and A4 print composition; the PD Kelas «Lihat bukti» view; W3.12, W3.16, W3.6, UX-09 |
| Owner (recorded) | A persona access token copied before leaving MODE PERAGAAN stays valid until it expires: the existing accepted design (`03-FINISH-LINE-REPORT.md` §6) |
| W9.12 (Batch 9) | Recovery readiness after a logical restore. Storage objects are outside physical database backups. |
| Register housekeeping | W3.5 still reads «DONE — PROMOTION PENDING» from Batch 2/4, although Batch 4's staging walk P1 verified its Table. It is left for the owner's register pass. |

## 6. Freeze restored · STOP

Nothing changes on staging or `main` without a new owner authorisation (D-158). The development branch carries this report and the staging requests only. STOP at the Batch 5 staging-verification gate, for owner review.

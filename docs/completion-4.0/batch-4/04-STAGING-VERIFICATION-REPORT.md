# Batch 4 · Protected merge and staging verification (3 Nov 2026)

**Authority:** owner, 3 Nov:
- «BATCH 4 PROMOTION GATE — CONDITIONAL GO» (D-153);
- «RECOVERY GATE — HOLD» (D-154);
- «RECOVERY GATE CLEARED — GO».

## Verdict: VERIFIED BATCH 4 STAGING CANDIDATE · not a declaration of full acceptance

- Batch 4 is merged through the protected path, and migrations 184–188 are applied to staging (188).
- Every staging walk is green on a fresh synthetic test school, `sekolah-uji-b4-1103`:
  - the Golden School regressions GS-01 to GS-21;
  - the Studio walk;
  - **the Batch 4 administration walk, 9 of 9**;
  - accessibility.
- Dr Gladys's demonstration school and every existing result, official result and certificate are unchanged (whole-row digests).
- **The staging freeze is restored** (D-155).
- Production was not touched. No Batch 5 work.
- **Batch 4 is NOT fully accepted.** It remains short on:
  - W2.10, PARTIAL — INCOMPLETE: the Aktivasi waiting-for-account list is not paged;
  - W3.6: the Konfigurasi page split awaits Daisy's design;
  - Daisy's outstanding requirements: UX-09, W1.2, D1, D3.

## 1. Recovery point, pull request and CI

| Item | Evidence |
|---|---|
| Recovery point (D-154) | **The owner verified it** in the Supabase `pintar-staging` dashboard: a successful physical backup at 2 Nov 23:40:21 UTC (3 Nov 06:40:21 WIB), with a restore action available, less than 24 h before the migration. The rehearsal (41594063773) could not read the backup list (HTTP 403). Its logical restore keeps every PINTAR table's data, but not an equivalent environment: six failures, recorded for Batch 9 as W9.12, including Storage, which no database backup holds. Out-of-band schema rollback: `ROLLBACK-184-188.sql`, tested locally in both directions. |
| Pull request | [PR #7](https://github.com/yazidmanan2409/pintar40/pull/7) |
| Required check | `verdict · green only when every job ran and succeeded` was green on the owner-verified head `6215aad` (ci 41593789975) and on the final head `5f7245a` (ci 41596379905). `5f7245a` is `6215aad` plus the D-154 recovery-gate records (three documents, no code or migration). Merging `6215aad` itself would have meant rewriting the branch's history. |
| End-to-end journeys | 41587216584, green on `b66c4bb`. That run audited the head SHA, with the Batch 4 admin walk at 11/11. No application code, migration, journey script or workflow changed after it. |
| Merge | **`31e456d`**: a merge commit pinned to `5f7245a`, no bypass, mergeable state `clean` |
| Triggered on `main` | `ci` (41598785235, green) and `staging.yml` (41598785234, green: the migration). **No production workflow started.** Scheduled only: the production watch (skipped, as always) and the daily Actions-spend report (failed 08:34; a read-only cost report, touching neither staging nor production). |

## 2. Migrations 184–188 on staging

**Before the merge** (read-only; `02-PROMOTION-PRECONDITIONS.md`):
- 183 migrations, identical to the repository's first 183;
- the four replaced functions byte-identical to the repository's;
- the tables they touch empty.

**After** (read-only):
- **188 migrations**, the last `20261221100000`.
- The nine new or replaced functions are all SECURITY DEFINER with `search_path=public, pg_temp`. Anonymous callers cannot run them; signed-in callers can. They are:
  - `authorize_card_conversion`, `orang_berakun`;
  - `cari_sekolah_tujuan`, `transfer_minta`, `pindah_masuk`, `transfer_terima`, `transfer_execute`;
  - `email_send_stuck`, `maintenance_list(integer, integer, uuid)`.
- `card_conversions` has row security and no policy.
- `transfers.to_academic_period_id` is nullable, with `transfers_executed_has_period` in place.
- The eight registry rows are present.
- PINTAR's four triggers on `auth.users` are intact.

**Environment facts** (41599443519, GREEN): staging runs `31e456d`. GS-00 re-checked this before every walk.

## 3. Staging walks

**Fresh synthetic test school:** «Sekolah Uji B4 1103» (`sekolah-uji-b4-1103`, found-school 41599434543). **Receiving school for the transfer:** «Sekolah Uji B3C 1103», the Batch 3 closure's test school.

| Check | Run | Result |
|---|---|---|
| Golden School GS-01–03 | 41599554264 | PASS |
| GS-04–11 (admin, publication; Pendataan's school code, now the TextField) | 41600995169 | PASS |
| GS-07, GS-12–16 (learners, class cards) | 41603061215 | PASS |
| GS-17–21 (reports, certificate, recovery, shared computer, public check; GS-21's «Kartu hilang atau rusak» through the new server search) | 41605789257 | PASS |
| Studio walk (W6.5, W6.7, the Batch 3 closure checks; another school's admin told nobody) | 41608632487 | PASS |
| **Batch 4 administration walk** (`audit/staging/golden-school-pentadbiran.mjs`) | 41612169706 | **PASS 9/9** |
| Accessibility and keyboard | 41613954494 | PASS |

**The Batch 4 administration walk on deployed staging.** Every write was a press of PINTAR's buttons by a person signed in through the real screens. The database was only read.

- **P0:** staging holds 188 migrations and the Batch 4 functions. Both schools, the people and two class-card learners are present.
- **P1 (W3.5):** the Guru's class page is a Table (6 rows, the five Golden School learners among them), each name linking to the record.
- **P2 (W2.2, W2.3, F-8):**
  - The Platform Operator, in «Seluruh platform», corrected the Dekan's name, then their username, each with a reason.
  - `identity.name_corrected` and `identity.username_corrected` are in the audit log, with the reason.
  - Both were then put back the same way. The Dekan is as before.
- **P3 (D-152(a)):** Eka's class card became an email account.
  - The same account row, now EMAIL, has no card and set-up REQUIRED.
  - `account.card_converted_to_email` is in the audit log.
- **P4 (W2.1):**
  - The address was corrected before activation (`identity.email_corrected`).
  - The person activated with the code emailed to the corrected address and signed in.
  - No class card remains, so CR-91 no longer stands between them and a staff role.
- **P5 (W2.15, F-10):**
  - B4's admin found «Sekolah Uji B3C 1103» by its exact name (one result) and asked for Dimas's transfer, with a reason.
  - The request is REQUESTED, with its school year left to the receiving school.
  - `directory.school_searched` and `transfer.requested` are audited.
- **P6:**
  - B3C's admin saw the request with the learner's name, accepted it into B3C's school year, then executed it.
  - Dimas is enrolled at B3C, and the B4 enrolment is kept as ENDED history.
  - His nomor induk, PINTAR ID and official results are unchanged.
  - `transfer.authorized` and `transfer.executed` are audited.
- **P7 (W2.19, W2.10):**
  - «Email uji» shows «Pengiriman tertahan».
  - The system section lists 19 of 19 schools (a page is 20; staging has fewer).
  - **UX-33:** nothing waited for an import or an account at B4, so «Yang menunggu» was correctly not shown. The case where it shows, with its counts, is proved in CI's admin walk (B4-W8). It is not exercised on staging.
- **P8 (W2.8):** a profile photo was added, shown on «Akun saya» through the read route, and removed.

**Accessibility** (unchanged from Batch 3):
- All judged checks PASS: JUDUL-NAMA, LEBAR-1280/1024/320, PAPAN-LEWATI, PAPAN-ISI, PAPAN-MENU-0/1/2, PAPAN-DIALOG-1/2, MENU-320 and JUDUL-DITOLAK.
- Recorded, across 12 screens:
  - no screen is missing a title;
  - skip link 0, focus stuck 0;
  - axe clean on 12 of 12;
  - widths and clipping 0 at every size.
- One recorded note: the `/masuk` inputs' focus ring, the harness's known limit, unchanged since Batch 2.

## 4. Preservation

Staging, read-only. The same query was run before the merge and after the last walk (`evidence/preservation.sql`, `-before.txt`, `-after.txt`).

| Record | Before the merge | After the last walk | Difference |
|---|---|---|---|
| Demonstration school (`sekolah-demo-pintar`): roles / results / official / certificates / enrolments / courses | 4 / 10 / 10 / 3 / 5 / 1 | 4 / 10 / 10 / 3 / 5 / 1 | 0 |
| Demonstration school: audit rows (last id) | 91 (6860) | 91 (6860) | 0 |
| Demonstration school: its people (name, PINTAR ID, photo, username) | `bd41b3c9…` | `bd41b3c9…` | **identical** |
| Demonstration school: its accounts (kind, card, address) | `7deebf17…` | `7deebf17…` | **identical** |
| Every result row outside the test schools, md5 of whole rows | `2440c371…` | `2440c371…` | **identical** |
| Every official result row outside the test schools | `a14f4a40…` | `a14f4a40…` | **identical** |
| Every certificate row outside the test schools | `ffa43edd…` | `ffa43edd…` | **identical** |
| All schools: results / official / certificates / courses / transfers | 1568 / 142 / 39 / 44 / 0 | 1580 / 154 / 42 / 47 / 1 | +12 / +12 / +3 / +3 / +1, **all in the test schools** |

- No reset.
- No write to the demonstration school.
- No existing assessment record was modified.

## 5. Still open: Batch 4 is not fully accepted

| Item | State |
|---|---|
| **W2.10** | PARTIAL — INCOMPLETE (D-153): the Aktivasi waiting-for-account list is not paged. It is incomplete functionality, not an accepted deviation. |
| **W3.6** | The Konfigurasi page split and index await Daisy (no composition). RV-16 and RV-18 are done. |
| **UX-09** | «nomor induk» naming: Daisy's identity copy |
| **W1.2, D1, D3** | Await Daisy (since Batch 3) |
| **W9.12** (Batch 9) | Recovery readiness after a logical restore: six failures, plus Storage and the auth.users triggers (`03-RECOVERY-GATE.md`) |

## 6. Freeze restored · STOP

Nothing changes on staging or `main` without a new owner authorisation (D-155). The development branch carries this report only. STOP at the Batch 4 verification gate, for owner review.

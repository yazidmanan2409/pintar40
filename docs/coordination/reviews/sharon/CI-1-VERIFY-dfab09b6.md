# CI-1 · independent verification of the frozen candidate `dfab09b6` (PR #30) — Sharon

**Work:** migration `20270125100000_a_now_failing_result_is_never_confirmed_or_read_valid.sql` (242 lines), `selftest/ci1.test.ts` (CI1-S01, S02, V01, V02, K01), the Konfigurasi page, the strings and the evidence. Read from the source.

**Verdict: PASS, conditional on ci 45424228769 and journeys 45424259782 green in attempt 1.**

## S-1 · the refusal

- `putuskan_tinjauan_sertifikat` refuses CONFIRMED with `CERT_REVIEW_RESULT_NO_LONGER_PASSES` (PR190) when `sertifikat_hasil_lulus` is false. REVOKED is unchanged.
- **The lock:**
  - the review row is taken `FOR UPDATE` first, then the sitting's row (A2A order), and only then is the result in force read;
  - the read is a new statement in a volatile function, so it sees any recalculation committed meanwhile.
- **The refusal raises after the decision and audit writes**, so the whole call rolls back: nothing is written. CI1-S01 asserts that the review is still open, no decision is audited, and the certificate is as issued.
- **The rule** (`sertifikat_hasil_lulus`):
  - the **captured** `bersertifikasi` (ruling, 13:23Z);
  - OFFICIAL evidence;
  - the sealed mark;
  - the gate;
  - mastery at the mark, on `hasil_murid_id`.

  `sertifikat_layak_dengan` itself is untouched, as I asked.
- **The plants:**
  - **P3:** a gate-only failure is refused (CI1-S02);
  - **P4:** `hasil_terkini_id` is caught;
  - **P1 and P2** are caught as well.

## S-2 · validity, in one helper and every reader

- **`sertifikat_dipersoalkan`** is an open review, or ISSUED and no longer passing. It has no client grant, which is asserted.
- **Its readers:**
  - `verify_certificate`: DICABUT only from REVOKED, DIGANTIKAN from SUPERSEDED, DITINJAU when questioned, otherwise BERLAKU;
  - `sertifikat_saya_ditinjau`: the learner's page, card and print;
  - `tinjauan_sertifikat_dikonfirmasi`: says «dikonfirmasi» only of an unquestioned certificate;
  - the new `sertifikat_dipersoalkan_sekolah` for the staff list: ids only, CAN_PUBLISH in that school or the platform admin, with its **one registry row** (STAFF, CAPABILITY CAN_PUBLISH).
- **`verify_certificate`'s OUT signature** is asserted unchanged, `assert_public_surface()` passes, and the sealed `pass` is "as issued", never the recalculated result.
- **The plants:**
  - **P5:** a wrongly confirmed row reads DITINJAU, not BERLAKU;
  - **P6:** never DICABUT without a revocation;
  - **P7:** the learner's card and print are questioned;
  - **the mode toggle:** a clean confirmed row stays BERLAKU when its mode stops certifying (CI1-V01).

## My §7 (3) condition: an evidence downgrade

- **CI1-V02:** it reads DITINJAU, is surfaced in the staff list, and is revocable through the existing path, never orphaned. CONFIRMED is refused while a review is open (P9).
- **Accepted:** surfacing in the list, together with the existing revoke action, meets «never in DITINJAU with nothing to act on».

## Preserved

- The migration writes no row: only functions and one registry upsert.
- The sealed payload, the reviews, the results and the audit rows are untouched.
- The correction procedure is unchanged except for the refusal.
- **The evidence scripts** (`step0-CI1.sql`, `preservation-CI1.sql`) are read-only (0 write statements). Only line 10 is expected to move, 309 → 310.

**After this:** the merge and the staging promotion wait for the owner. I give the promotion verdict on the AFTER read, with the V6 counter check as for D2-R.

## Addendum · re-frozen `94ce6727` (24 Nov 2026, 17:35 UTC): PASS, unconditional

- **The delta from `dfab09b6`** is one test line in `selftest/c1w.test.ts`: C1W-S06's second correction now picks a question other than the first's.
  - It is a fixture fix, not a weakening: the correction was being refused as "unchanged" when the paper started with a safety-critical question.
  - **The product diff is empty.**
- **The runs:** PR #30 ci 45439475500 and journeys 45441914637 are green in one attempt.
- **CI-1: PASS.** The merge and the staging promotion are the owner's. I give the promotion verdict on AFTER.
- **Noted:** R1-K01 has a 16:00–24:00Z flake on main (UTC `current_date` passed to a school-clock function). The fix rides in CI-2, and I check it there.

## Addendum · staging promotion (310), ruling 101 (24 Nov 2026, 22:45 UTC): PASS, conditional only on the V6 counter re-read

**How I verified:**
- I read the evidence at `4776ac51` (`docs/post-4.1/ci-1/promotion/`), `main`, and the GitHub API.
- I did **not** query staging myself. My standing rule is no staging access in my own session unless the owner gives it to me directly. Bob's evidence is the read; my checks below are of that evidence and of the repository.

**What I checked:**
- **The run:** staging.yml 45500905721 read from the API at 22:44Z: `status=completed`, `conclusion=success`, head `93b93134`.
- **The merge:**
  - `main` `93b93134`'s tree equals `94ce6727`'s (`25a734bd…`), which I checked;
  - the migration's sha256 begins `2b450700b48fe857…`, as recorded.
- **My own diff of BEFORE against AFTER:** **only line 10 moves**, 309 → 310 (digest `ddcd294d…`). Line 76's trailing-space correction is disclosed and is not a data change.
- **Nothing written to any certificate, review, result or audit row:**
  - the migration has no write statement other than its one registry upsert;
  - the preserved lines are identical, including the certificates and the audit log up to BEFORE's watermark (10705).
- **Public and staff validity agree by construction:** `verify_certificate`, `sertifikat_saya_ditinjau` and the staff reads all call `sertifikat_dipersoalkan`.
  - Step 0 predicted 60 ISSUED, none turning DITINJAU.
  - The read after promotion shows 60 ISSUED, all BERLAKU, 6 REVOKED and 0 DITINJAU, which matches.
- **Grants and the registry row:** as built.

**One item missing from the evidence:** the V6 hosted check, as for Z and D2-R.
- After one staging request, the `periksa` counter must read above its post-promotion baseline.
- Its `pg_get_functiondef` md5 must still be `2b4a0444fbd36007341a536916fe14a0`, since CI-1 does not touch `periksa`.

**Once that is recorded, CI-1's staging promotion is a PASS, and CI-1 may be declared closed** (L-105 stays open under CI-1b).

**FINAL (22:50 UTC): CI-1's staging promotion is a PASS.**
- **V6 is met** (recorded at `9b4df016`): the `periksa` md5 is `2b4a0444…`, unchanged, and the counter read +190 after the promotion (178,026 → 178,216).
- **`main`'s ci 45500905491, read from the API at 22:49Z:** `completed`, `conclusion=failure`. Bob reads the single failing job as red-case `db-zr1-gates`, whose control R1-K01 is already red. **This does not change the promotion verdict:**
  - **it is a test-side clock defect:** a UTC `current_date` is passed to a school-clock function. Against WIB (UTC+7), the dates differ from **17:00Z to 24:00Z**, which is more precise than "16:00–24:00Z";
  - **the same tree passed earlier:** its PR ci 45439475500 (API at 22:49Z: `conclusion=success`) ran 16:38–17:15Z, which fits a gate reached before 17:00Z;
  - **CI-1 touches neither** `r1.sql` nor `akhiri_pendaftaran`.
- **A condition carried forward:** `main` has no green full run at `93b93134` (selftest was skipped on it). **No production promotion may take `main` while its ci is red.** CI-2's clock fix must land, and `main`'s ci must be green on the exact commit, before PR-22's production path.

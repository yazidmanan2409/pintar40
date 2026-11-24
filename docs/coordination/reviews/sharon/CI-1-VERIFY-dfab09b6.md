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

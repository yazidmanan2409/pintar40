# D2-R · the batch review (`claude/d2r` `42f6f432`) — Sharon

**Work:** migration `20270124100000_a_certifying_sitting_offers_no_help_and_discloses_counts_only.sql` (901 lines), the four restated tests (`c37e6884`), `42f6f432`, and `evidence/step0-D2R.sql` and `preservation-D2R.sql`.
Read-only, from the source. **The verdict is conditional on CI 45322159725 and journeys 45322163898 both being green.**

**Verdict: PASS, conditional on CI and the journeys. R-1 is closed on the same condition.**

## The capture (R-d, R-f, R-h; §7.2; the bersertifikasi conditions)

**The backfill is right:**
- Every existing sitting gets `kebijakan_bantuan_dari(mode_policy)` and `certifies` **before** `mode_policy` changes.
- It is asserted three ways:
  - no null;
  - equal to the old row;
  - POST_TEST still allowing help at that point.
- It is re-asserted after the change against `d2r_sebelum`, so an open Uji Penguasaan keeps its help.
- The three row guards are paused only for this migration-time write. No client path can reach that.

**The seal is right:**
- `assistance_policy` and `bersertifikasi` are `not null`, with the four-key CHECK (`kebijakan_bantuan_sah`).
- The fail-safe defaults are no help and certifying.
- The seal trigger, on INSERT:
  - overwrites whatever the writer passed, from the policy row;
  - refuses a certifying start that has any help (`CERTIFYING_SITTING_HAS_HELP`, condition 3);
  - computes `percobaan_ke` from `percobaan_terpakai`.
- On UPDATE it refuses any change to the three columns.
- It is SECURITY DEFINER, with no client grant.

**Readers and the lint:**
- `open_assistance` and `assistance_state` read the capture, never `mode_policy`, which closes F-1 and F-2.
- The lint (`assert_mode_policy_complete`) refuses `certifies ∧ allows_assistance` and `certifies ∧ reveals_rationale_on_review`. The final assertion checks it too.

**F-3 changes nothing for non-certifying modes.** `session_review` now refuses when the capture's `reveals_rationale_on_review` is false. From the original `mode_policy` row, that is PRE_TEST only, which was already refused. PRACTICE, TEST and QUICK reveal, so they keep their review (the owner's condition).

## R-h · counts only, in the database

Every gate reads `bersertifikasi` (condition 2):
- `session_review` refuses (PR081 RESULT_COUNTS_ONLY).
- `reading_map` on a certifying sitting gives only `tujuan_ulang_sesi`'s sections, as BACA_LAGI, with no reason, and no KUAT or WAJIB tier.
- `session_outcome` gives `per_domain` keys with `{}` values and no numbers, plus the server's `tujuan_ulang`.
- `hasil_koreksi_saya` gives only `dikoreksi`, `pada`, `benar` and `total`, with no reason, no before and after, and no review flag.
- `session_answers` reads only while the sitting is open, so it can be resumed, and refuses once it is finished.

`tujuan_ulang_sesi` reads the learner's result (`hasil_murid_id`): the sections below the sealed mark, together with the gate's objectives. It has no client grant.

## R-c · the band is not public

- `verify_certificate` returns `predikat := null`. The OUT signature is asserted unchanged.
- It is granted to `service_role` only, with no anon grant, which is asserted.
- The band stays in the payload.

## The restated tests: restatements, not weakenings

- **F19-Q01 to Q04:**
  - the fixture now sets `allows_assistance` and `reveals` false while it makes QUICK certify for one start, then restores all three;
  - that is the only state condition 3 allows;
  - the assertion that a certifying QUICK start is captured as certifying is unchanged.
- **C1W-S06:** the review flag moves to `sertifikat_saya_ditinjau`, which still asserts the certificate is under review, by its own read. That follows from my §7.2 rule.
- **Z-R15-01:** the column string («Materi Pembelajaran»), rev. 4's alignment.
- **C1W-J01:** the corrected certifying page shows counts and "corrected", with no percentage. That is R-h.
- **DAISY-26:** the exemption was added at `c37e6884` and removed at `42f6f432` (Daisy reworded). The guard is whole again.

## Evidence scripts

- Both are read-only (0 write statements).
- Step 0 counts sittings by mode, `will_capture_bersertifikasi` and status, as condition 4 asks.
- `baru` gains `assistance_policy`, `bersertifikasi` and `percobaan_ke`.
- **Note for the staging pair:**
  - `mode_policy` changes for the certifying modes;
  - the migration writes `mode_policy.changed` audit rows above BEFORE's watermark;
  - the preservation header must name both as expected movements, or show that no preserved line reads them.

## Second Eye's open question: `learning_delta` on a certifying post-test

**My ruling: R-h does not require it, so do NOT withhold `akhir` alone.**
- R-h's scope is the answer key, per-question marks and per-objective verdicts.
- The overall figure is the count's own ratio, and `session_outcome` already returns it to the learner (`penguasaan`, with `ringkasan`'s counts).
- Withholding `akhir` in one RPC, while `session_outcome` returns the same number, adds no protection and makes the two reads disagree.
- **If the owner wants no percentage at all** on a certifying result (Daisy's counts-first wording), that is one decision for both reads:
  - `session_outcome.penguasaan` and `learning_delta.akhir` together, in the database;
  - a product change to put to the owner, not a security condition.
- Until then, the page not drawing the comparison (D2R-H08) is the right presentation.

## R-1

- R1-K01 to K03 are database refusals of start, resume, `record_answer` and submit, after leaving, transfer and rollover. The sitting ends with the enrolment.
- Plant `zr1-1` turns K01 red.
- **Closed on CI green.**

## Addendum · the delta `42f6f432` → final `5dace1ad`: PASS, conditional on ci 45326703706 and journeys 45326707108 (24 Nov 2026, 04:45 UTC)

- **No migration change.** The delta is app and strings, the evidence header and tests only.
- **The certificate on the result page: no new disclosure.**
  - `engine.myCertificate(db, post_session)` is the learner's own certificate read, the same one `/lanjut` and the certificate page use, under the learner's session.
  - It is read only on a certifying pass, and only its status is used (`rendersCredential`).
- **Section B and the print** (`KomposisiMurid`, `hasil-belajar.ts`): certifying rows name their sections from the server's `tujuan_ulang` (`bagianUlang` with no figures), marked «baca lagi», with **no number**. The non-certifying rows are unchanged. This matches R-h.
- **«Baca lagi:» on a pass** (74a item 2) uses the same server list. The retake line stays on «Belum lulus».
- **Nit, not a condition (for Daisy and Bob):** a certifying pass whose certificate will never be issued shows «Sertifikat Anda sedang disiapkan.», which would be untrue. That happens when the sitting is not official evidence (INV-20), so `certificate_eligibility` is false. **The fix:**
  - show the line only when the certificate read returns a row in a preparing state;
  - on a null read, show the link alone, and let the certificate page say why.
- **Ruling 90's strings** (`lapor.langkah`) are wording only. BOB15-K01 is green, as Bob reports.
- **The header note:** closed at `2d3986ff` (my check above).

# CI-1 · certificate integrity: a now-failing result can't be confirmed or read as valid (Bob, 24 Nov 2026; ruling 97)

**Purpose, and only this:** close L-67, a confirmed Critical (Sharon, `AUDIT79-J7-1.md` and its addendum). After an answer-key correction recalculates a certified result to a fail, a reviewer can press «Konfirmasi berlaku», and the public check then reads «Berlaku · HASIL Lulus», although the result in force contradicts it.

**Status:** scope for Sharon's pre-build review. Nothing is built yet.

## 1 · The two safeguards (owner-approved, ruling 97)

| # | Where | Rule | Refusal / read |
|---|---|---|---|
| S-1 | `public.putuskan_tinjauan_sertifikat` (last defined in `20270115110000`) | **Refuses a CONFIRMED decision when `sertifikat_layak_dengan(...)` on the result in force (`hasil_murid_id`) is false.** REVOKED stays available, unchanged | A new code, **`CERT_REVIEW_RESULT_NO_LONGER_PASSES`**, named in the refusal registry (Indonesian and English), and no write. The audit row behaves as for any refused call today |
| S-2 | `public.verify_certificate` (last defined in `20270124100000`, D2-R) | **Reports BERLAKU only while the result in force passes**; otherwise DITINJAU (a review is open) or DICABUT (decided). A defensive read-side invariant, so a row already wrongly confirmed can never read «Berlaku · Lulus». **The contract is unchanged:** the same columns and types, with `predikat` still null (D2-R) | — |

**What the public check may show** (Sharon):
- a review is open: DITINJAU, with «Seperti saat diterbitkan · Lulus» and `fakta.ditinjau`;
- still passing and confirmed: BERLAKU;
- failing and decided: DICABUT only, with the facts marked as at issue;
- reissued: DIGANTIKAN.

**It never states the recalculated result publicly:** a token holder gets no personal result.

## 2 · What CI-1 preserves (ruling 97)

- **Historical records:** no certificate, review, result or audit row is changed or deleted. The sealed issue payload stays as issued. The migration writes no record rows. **Bob's ruling (24 Nov, routine):** the one metadata row in `client_rpc_registry`, for the new staff read `sertifikat_dipersoalkan_sekolah` (F04-T14; needed for Sharon's §6(b) Konfigurasi list), is allowed. It is the standard registration of a client RPC, not a record. The alternatives (changing `sertifikat_sekolah`'s OUT columns, or leaving the list on the open-review rule) are worse. Sharon confirms at verification.
- **The approved correction procedures** (D-2 §1.2; C1w O41-21/22): a correction opens a review; a review ends CONFIRMED (still passing) or REVOKED; a reissue gives DIGANTIKAN; two people. Unchanged except that CONFIRMED is no longer possible on a now-failing result, which the policy never sanctioned.
- **The public privacy boundaries:** K-05 and what `/verifikasi` discloses today; no new field.

## 3 · Out of scope (the combined revision, or not at all)

- **The reviewer's screen:** offering only «Cabut» on a now-failing row, with words naming the effect (C-7 / L-67's UI). One exception: if the S-1 refusal reaches the screen, it must display as a named refusal, not a generic error. That is the minimum for the refusal to be honest, and it is in CI-1 only if the current page wouldn't show it.
- L-68 and L-70 (the holder's and the reissue panel's words), and any policy on «keeping» an award.

## 4 · Verification

- **Red first:**
  - a direct RPC call confirming a now-failing review is refused (S-1);
  - a still-passing review confirms exactly as today;
  - a plant row CONFIRMED on a failing result reads DITINJAU / DICABUT from `verify_certificate`, never BERLAKU (S-2);
  - every existing certificate test stays green.
- **L-8 sweep:** «dependent tests: N found, N restated» and «dependent screens: N found». Every reader of `verify_certificate` and of the review decision is listed.
- **Pre-flight, freeze, CI, the PR:** the same discipline as D2-R (ruling 93): one frozen candidate, and a full run at the acceptance boundary.
- **Promotion:** staging 309 → 310, under its own owner authorisation, with step 0 and BEFORE/AFTER. **Production is untouched** (the flow isn't there: production is at 111, before migration 229).
- **Sharon verifies independently before acceptance** (ruling 97).

## 5 · Who

- **Build:** Second Eye, on a fresh branch from main, after the L-78 test.
- **Review:** Sharon (pre-build, and the independent verification). Daisy only for the refusal's wording, if it reaches a screen.

## 6 · Sharon's pre-build review (`CI-1-PREBUILD-d99fa8d3.md`, 24 Nov): CORRECT IN SCOPE, with these amendments, which are binding for the build

**(a) S-2's states. DICABUT is never derived from the result alone:**
- REVOKED → DICABUT;
- SUPERSEDED → DIGANTIKAN;
- ISSUED, with an open review OR a result in force that fails → **DITINJAU**;
- otherwise → BERLAKU.

A row wrongly CONFIRMED has no revocation, so DICABUT would be a different false statement. DITINJAU is true, and the school's revocation then makes it DICABUT honestly.

**(b) ONE SQL helper** (an open review OR a result in force that fails), used by every reader that states validity. This is within the integrity purpose:
- the public `verify_certificate`;
- the learner's `sertifikat_saya_ditinjau`, which feeds the certificate page, the `KartuSertifikat` card and print, `keadaanSertifikat`, and the A4 sheet through the card's data;
- the staff Konfigurasi list.

**(c) S-1's lock order:** take the review FOR UPDATE, then the sitting's row lock (A2A order), and only then read the result in force. `hitung_ulang_koreksi_kunci` writes under that lock.

**Plants (each must turn the check red):**

| # | Plant | What goes wrong |
|---|---|---|
| P1 | No S-1 check | A direct CONFIRMED on a failing review succeeds |
| P2 | An over-strict S-1 | A passing review can't confirm |
| P3 | A mastery-only check | A gate-only failure is confirmed |
| P4 | `hasil_terkini_id` used instead of `hasil_murid_id` | The wrong result is read |
| P5 | The old verify logic | A planted wrongly-confirmed row reads BERLAKU |
| P6 | DICABUT without a revocation | A false DICABUT |
| P7 | The learner's card or print | Shows a clean credential |

**Also assert:**
- the OUT signature is unchanged;
- `assert_public_surface` and F04-S01 pass;
- no rows are written;
- the S-1 refusal shows on screen as a named refusal.

## 7 · The helper's scope (Second Eye's three cases; Bob's ruling; Sharon agrees, 24 Nov)

| Case | Reads | Ruling |
|---|---|---|
| (1) A key correction drops the result in force | The result in force (`hasil_murid_id`) | DITINJAU, the intended case |
| (2) `mode_policy.certifies` switched off after issue | **The sitting's captured `assessment_sessions.bersertifikasi`** (D2-R), never today's policy | **No change:** a policy toggle never alters a certificate already issued. **Plant:** certifies switched off after issue still reads BERLAKU |
| (3) An `evidence_class` override makes the sitting non-OFFICIAL | Live evidence class | DITINJAU, accepted. **Sharon's condition:** a certificate never sits in DITINJAU with nothing for the school to act on. The staff list surfaces it as needing a decision, through the existing review/revoke path (opening a `certificate_review` in the override path if revoking needs one). S-1 applies: it can't be CONFIRMED while the evidence isn't official |

**Captured, as planned:** the sealed pass mark, `bersertifikasi` (now), and the result in force and gate from `hasil_murid_id`. Evidence class stays live.

**Structural (Sharon):** **don't modify `sertifikat_layak_dengan`**: `certificate_eligibility` and the correction preview call it, and at issue time captured equals live. CI-1's validity helper is a **new function** composing the captured `bersertifikasi`, official evidence, the sealed mark and the result in force. The fixture restatements for f38 and SERTIFIKAT-A01 (they bypassed `certificate_eligibility`) are accepted.

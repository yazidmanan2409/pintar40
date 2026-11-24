# D2-R · the pre-code review of R-c to R-f and R-h, and §6.3a (Sharon's part of D-2's §6.3 step 2)

**Work:** `D2-CERTIFICATE-CONDITIONS-SPEC.md` (revision 3, sha256 `0623517d…`, `claude/bob-41-master-plan`). Read against `main` `61a6ff9e` (308).
Read-only. **Z is accepted on staging (ruling 88), so this review is now due.**
Since my first review (`ed8ad32b`), my four points are in the spec:
- STANDALONE certifies, and so refuses assistance (R-d);
- the policy is captured at the start;
- an accommodation never appears on the certificate (R-e);
- the ordinal is fixed at the start (R-f).

**Verdict: R-d, R-e and R-f are ready to build as written. R-c and R-h each need one correction before code.**

## R-c · Predikat removed from the public surface: CORRECTION

- **The spec says** "the public read keeps its contract; its presentation drops one field". But `verify_certificate` returns `predikat` (`20270115110000`, its OUT column 2), and `/api/verifikasi/[token]` returns it as one of its five public fields (`route.ts:29`, `verification.ts:56`). Hiding it on the page would leave the band public through the API and the RPC.
- **The fix, which keeps the contract:** `verify_certificate` returns `predikat` as **null** for every certificate.
  - The OUT columns, the five-field set equality and `assert_public_surface()` stay unchanged. The column already reads null below 70 % today, so a null is a value the contract already allows.
  - The band stays in the snapshot, `certificate_eligibility` and internal reports.
- **The proofs:**
  - the RPC and the API return `predikat: null` for a certificate whose snapshot holds a band;
  - F04-S01 and `assert_public_surface()` stay green.

## R-d · All assistance refused in every certifying mode: ready

- **The rule:** capture the policy on the sitting at its start, under the sitting's row lock (A3's order), and have `open_assistance` read the captured value, never the live `mode_policy`.
- **The lint:** `certifies ⇒ not allows_assistance`, over `mode_policy`.
- **§6.2's proofs** cover each mode, each level, the direct call and an open sitting.

## R-e · Extra time recorded, staff-only: ready

- It is recorded with the result from A1's audited extension (old and new deadline, actor).
- **Test it on every surface:**
  - absent from the certificate, its snapshot, `verify_certificate`, the API and the A4 sheet;
  - absent from the learner's own pages too, unless Daisy wants it there.

## R-f · The attempt ordinal: ready

- It is fixed at the start, under ruling 46's lock, and equals the lineage count.
- It appears on the result and in authorised staff views, and on no public surface.

## R-h · Certifying results disclose counts only: CORRECTION (scope of the red cases)

- **"Every learner-facing route" must be named in the batch.** On `main` 308, the learner routes that disclose per-question correctness or the key for a POST_TEST are:
  - `session_review` (`benar`, `alasan`, `arah`, the answer text), repaired by D-1 in Z;
  - `session_answers`;
  - `reading_map`'s per-question reasons;
  - `hasil_koreksi_saya` (a corrected question's before and after);
  - `teacher_question_evidence`, which is not learner-facing and stays as is;
  - the print and export (`hasil-belajar.ts`).
- **Each needs its plant.** The guard should be a list test like Z-D1-02: every learner-callable function or view returning `benar`, `is_correct`, `kunci` or `alasan` is either mode-gated or on an allowed list.
- **`session_outcome.tujuan_gerbang_kode` (Z) is section-level advice, so it is allowed under R-h.** With one must-be-right question per objective, it does identify that question's objective. Daisy's words must say "revisit this section", never "you got question n wrong".
- **The evidence threshold**, "an approved one if it exists, confirmed with Sharon": there is none in 4.1. So everything is worded as revisit-advice, as the spec's fallback says.

## §6.3a · Consistency: conditions, certificate wording and public verification

- **Nothing implies a timed test.** Neither the certificate, nor the A4 sheet, nor the public page shows a duration, a time limit or an accommodation:
  - the public page carries pass, institution, date and validity, plus predikat, which goes after R-c;
  - R-b's new line («berdasarkan hasil asesmen») names no time.
- **The public read's contract is unchanged** under R-c's correction: the same five OUT columns, with predikat null.
- **«Memenuhi capaian»** agrees with "met the passing criteria set for the assessment". The words are Daisy's.

**Could reasonably have been anticipated:** R-c's API path was there to see in my first review, which noted that the page never shows the name. I did not check what the API returns beside it.

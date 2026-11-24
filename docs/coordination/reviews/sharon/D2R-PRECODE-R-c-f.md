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

## Addendum · R-c's render sites, with C1-R4's printed «Predikat» (24 Nov 2026, 01:10 UTC)

**R-c removes the band at every site where `main` 61a6ff9e renders it, and the plant list names each one:**
- `KartuSertifikat.tsx:80`, the card;
- `KartuSertifikat.tsx:153`, the printable record (C1-R4's printed line);
- `sertifikat-lembar.ts`, the A4 sheet's RECORD block;
- `verifikasi/[token]/page.tsx:138`;
- `/api/verifikasi/[token]` and `verify_certificate`, which return null, as above.

**The learner's own certificate page** (`belajar/[tugas]/sertifikat/page.tsx:166`) reads `detail.predikat`. Either drop it there too, or leave it as the learner's own view, which is Daisy's call. It is not public.

**The proof:** a static list test, like Z-D1-02, in which every `predikat` render site outside the internal reports fails. Plant one on the card.

## Addendum · spec §7.1 (Bob's decisions on `D2R-BUILD-MAP.md`, `cefb60eb`): CONFIRMED with four corrections (24 Nov 2026, 01:25 UTC)

### 1 · F-2's capture shape: CONFIRMED

The shape is `assessment_sessions.assistance_policy jsonb not null`, written once at start, immutable by a guard trigger, and read by both `open_assistance` and `assistance_state`. Four corrections:
- **(a) The backfill takes the OLD policy.**
  - Every existing sitting, open or closed, is backfilled from `mode_policy` **before** the same migration changes the certifying modes' levels.
  - Order the statements and assert it: backfill, then update `mode_policy`.
  - Otherwise an open POST_TEST sitting loses help mid-sitting, which contradicts §6.2.
  - `not null` needs every row, so closed sittings carry their historical policy too.
- **(b) The guard trigger allows only that backfill.**
  - Set the column, then add the trigger.
  - Or, if the trigger must exist first, keep its one exception keyed to the migration (as A3 did), never a session setting a client can set.
- **(c) Constrain the shape.** A `CHECK` that the jsonb has exactly the four boolean keys, so a malformed capture cannot read as "allowed".
- **(d) The preservation pair will see a write.** This migration updates existing rows of `assessment_sessions` at migration time.
  - D2-R's promotion therefore needs a step 0, counting sittings by mode and status.
  - Line 58's column exclusion (`baru`) gains `assistance_policy`.

### 2 · `session_review` on a certifying mode: refuse. CONFIRMED

- The words are Daisy's.
- **The other learner routes named in R-h get the same treatment**, each with its plant: `session_answers` (correctness and the key), `reading_map`'s reasons, and `hasil_koreksi_saya`. Under R-h, `hasil_koreksi_saya` should state that the result changed and its new count, not which question or which key.

### 3 · `per_domain` on certifying learner routes: CONFIRMED, with one correction

- **No label is not enough.** Today the learner's «Baca lagi» list is computed **on the client** from `per_domain`'s per-objective numbers (`siklus.ts` `bagianUlang`: `penguasaan < ambang`). Returning those numbers is a per-objective score in all but name.
- **The fix:** on a certifying mode, `session_outcome` returns `per_domain` **without per-objective numbers**, plus a server-computed `tujuan_ulang`.
  - `tujuan_ulang` is the codes below the mark, together with `tujuan_gerbang_kode`, ordered.
  - `bagianUlang` reads that list.
  - The overall counts stay.
- **KUAT** is not shown on a certifying route. Staff views are unchanged.
- **The forbidden-key test** includes `penguasaan` inside `per_domain` for certifying learner payloads.

### 4 · Also confirmed

- F-1 is closed by the captured policy.
- F-3 reads the capture in `session_review`, with the PRE_TEST refusal kept.
- R-h is enforced in the database for STANDALONE.
- H10 asserts the learner export is absent, and H18 is the list guard.
- **`verifikasi.lulus` «Lulus»:** checked with R-c. It is a string change only; the five OUT columns and `assert_public_surface()` are unchanged.

**R-d and R-h may start** with these corrections.

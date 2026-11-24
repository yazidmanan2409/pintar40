# CI-1 · certificate integrity: Sharon's pre-build review

**Work:** `docs/post-4.1/ci-1/CI-1-SPEC.md` at `d99fa8d3`. Read-only, against `main` `429b7dcc`.

**Verdict: correct in scope. Three corrections and the plants below.**

## (a) How S-2 chooses the state: never DICABUT from the result alone

**The rule, in order:**
- `REVOKED` gives **DICABUT** (a revocation exists);
- `SUPERSEDED` gives **DIGANTIKAN**;
- `ISSUED` **and** (an open review **or** the result in force no longer meets the criteria) gives **DITINJAU**;
- otherwise **BERLAKU**.

**Why:**
- DICABUT asserts that the school revoked the certificate. A row wrongly CONFIRMED on a failing result has **no** revocation, so «DICABUT» would be a false public statement of a different kind.
- DITINJAU («this may change once the issuing school finishes reviewing», with the facts «as issued») is true for that row: it is in a state the school must resolve.
- **The repair** of such a row is a revocation decision by the school, and then it reads DICABUT honestly.
- On staging there are 0 reviews, so this is the defensive case only.

## (b) Other readers that state validity must follow S-2, through one helper

**Make one SQL helper** that both `verify_certificate` and the learner's and staff's readers call, for example `sertifikat_ditinjau_atau_tidak_layak(cert)`: an open review **or** the result in force failing. Its readers:
- **Public:** `verify_certificate`.
- **The learner:** `sertifikat_saya_ditinjau`, read by the certificate page, `KartuSertifikat` (card and printable record) and `keadaanSertifikat` (D2-R's result-page line), so the holder sees «Sedang ditinjau», never a clean credential.
- **Staff:** the Konfigurasi certificate list's status and review flag.

Each states the certificate's validity, so this is within CI-1's integrity purpose, not an expansion. **The A4 sheet** (`sertifikat-lembar`) is drawn from the card's data, so it follows the learner's read.

## (c) One correction to S-1: the lock

- The decision must read the result in force **after** taking the sitting's row lock, in A2A-L01's order: the review row `FOR UPDATE`, then the certificate's sitting.
- `hitung_ulang_koreksi_kunci` writes the corrected result under that sitting lock. Otherwise a correction committing between the check and the decision could still leave CONFIRMED on a now-failing result.

## The plants (each red on the planted defect, green on the build)

| # | Plant | Must turn red |
|---|---|---|
| P1 | Remove S-1's check | A direct RPC CONFIRMED on a now-failing review succeeds |
| P2 | Over-strict S-1 (refuse every CONFIRMED) | A still-passing review cannot be confirmed |
| P3 | S-1 compares mastery only (ignores the gate) | A gate-only failure (mastery ≥ mark, gate false) is confirmed |
| P4 | The helper reads `hasil_terkini_id` instead of `hasil_murid_id` | An ordinary recalculation (D14), not a governed correction, changes the outcome |
| P5 | `verify_certificate` keeps the old validity logic | A planted row CONFIRMED on a failing result reads BERLAKU |
| P6 | S-2 returns DICABUT when no revocation exists | That planted row reads DICABUT instead of DITINJAU |
| P7 | The learner's read keeps the old logic | Their card and print show a clean credential for that row |

**Also asserted:**
- `verify_certificate`'s OUT signature is unchanged;
- `assert_public_surface()` and F04-S01 are green;
- no row is written by the migration (the spec's preservation);
- the refusal reaching the reviewer's screen is a named refusal (Daisy's words), not the generic error.

**The promotion:** 309 → 310 with step 0 (counts of reviews by decision, and of now-failing ones) and the BEFORE/AFTER pair. **I verify independently before acceptance** (ruling 97).

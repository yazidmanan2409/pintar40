# D-2 certificate conditions spec: §1 facts, and P-1 to P-3

Sharon, 18 Nov 2026 (14:40 UTC). Read-only. I checked against my local build of `main` `7ba18b03` (284 migrations).
Spec: `docs/completion-4.1/D2-CERTIFICATE-CONDITIONS-SPEC.md` at `ed8ad32b`, sha256 `7fcb5d810a1d93e883b86eaead13d9cf4621c561c314fbb5f8fdaf8e8243a2a6`.

## §1, the facts

- **Wrong: the set of certifying modes, and "only EXAM refuses assistance".** `mode_policy` as built reads:

  | Mode | Certifies | Allows assistance |
  |---|---|---|
  | POST_TEST | yes | **yes** |
  | STANDALONE | yes | **yes** |
  | TEST | yes | no |
  | EXAM | yes | no |
  | PAPER | yes | no |

  **So two certifying modes allow assistance (POST_TEST and STANDALONE), and three refuse it.** P-1 must cover STANDALONE too.
- **Right: the three levels.** `open_assistance` enforces 1 to 3, opened a step at a time: `arah_berpikir`, then `petunjuk`, then the lesson's first worked example.
- **Right: the glossary and read-aloud.** `telemetry.assistance_kind` includes `GLOSSARY_OPENED` and `READ_ALOUD`, and **no public function** mentions a glossary or read-aloud. They are telemetry kinds only.

## P-1 · no answer-providing assistance in a certifying sitting

- **Derive the set, never name it.** The lint is `certifies ⇒ not allows_assistance` (or the per-level form), read from `mode_policy`. A new certifying mode is then covered automatically.
- **Schema impact the spec misses: open sittings.**
  - `open_assistance` reads `mode_policy.allows_assistance` **live**, at each call.
  - Flipping the row would change sittings already open, against **P-6**, which says the policy applies to sittings that start after it lands.
  - **Needed:** capture the policy at the sitting's start (a column on `assessment_sessions`, or a policy version, written by the insert trigger). `open_assistance` then reads the sitting's own value.
- **If level 1 stays (Q-1),** the per-level rule belongs in that same captured value, for example a highest level allowed.

## P-2 · accommodations are recorded with the result

- **Extra time is already recorded,** in A1's extension count and audit on the sitting. Copy it to the result **at finalisation**, and carry it through every correction in the result chain.
- **Privacy: an accommodation can reveal a disability.** It must **never** appear on the certificate or the public verification page.
  - Only readers who can already see the result may see it.
  - It is personal data under R-2.
  - Daisy's wording on the certificate can say "accommodations, if any, were applied as allowed" without naming one.

## P-3 · the attempt is stated

- **Fix the ordinal at the start, not at finalisation.** The start already serialises per learner and lineage (ruling 46's advisory lock, A3), so the ordinal is race-free there.
  - Write it once on the sitting, where it is immutable, and copy it to the result.
  - At finalisation, two sittings of one lineage can finish out of order, so the ordinal would not be stable.
- **Use the same count as `may_start_assessment`.** A sitting ended by the school's own act is excused (`percobaan_terpakai`). Say whether "attempt 2" counts it. **The certificate's number must match what the learner was told they used.**
- **The verification page today shows 5 fields and no name** (`verify_certificate`). Adding the attempt there is a small disclosure of retake history to anyone holding the link.
  - P-5 says the certificate and verification agree, so it is the owner's call under D-2's "attempt information shown".
  - My recommendation: show it, since it is not identifying without a name.

## P-4

Waits on my verification of whether a retake's draw repeats questions (item 2).

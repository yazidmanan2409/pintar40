# E · runner and package v4 (OpenAI streaming; both providers blinded together, ruling 51): independent review

Sharon, 18 Nov 2026 (02:15 UTC). Read-only. Offline: no key exists, and no call has been made.

**Disclosure:** I am an Anthropic model. Here I review the OpenAI side of a comparison between providers. I applied the same tests I applied to Anthropic's adapter in v3 (`E-V3-f9e38d69.md`). Read my rulings on (a) and on R-1 with that in mind. The owner decides.

**What I reviewed:**
- **The facts:** `E-PROVIDER-FACTS-OPENAI-STREAM.md` on `claude/e-openai-stream-facts` at `3e1a09f0689ebeaa7834a3bddb304d16bc1e17f8`, read in full.
- **The runner:** `git diff f9e38d69..d4adbeb62374687f39a9567129ec97f84fd3adb3 -- runner.mjs`, 344 lines added and 18 removed.
- **The package and records:** `v4/OPENAI-READINESS.md`, `v4/jalankan-e.sh` Steps A and E, and `REHEARSAL-RESULT.txt`, on `claude/bob-41-master-plan` at `013903bcb3457b75afe3a96343aaabd8ea44434b`.
- **What I ran myself,** from a scratch copy, with no keys and the proxy pointed at a dead port:
  - the self-test: **260 passed, 0 failed**;
  - six probes of `openaiAssembler` (below).
- **The frozen files:** `kit.mjs` at `d4adbeb6` is byte-identical to `68ebe2fd`, the version I reviewed. `runner.mjs` is the only file changed since `f9e38d69`.

## What holds now

**PASS, with one wording condition (C-1) and two recommendations (R-1, R-2).** Neither recommendation is required. The owner's free practice run and his separate authorisation still come before any paid call.

### The adapter

**These hold:**
- **Only `output_text` deltas are kept,** and only in `output_text` parts of `message` items. They are cross-checked against `output_text.done` and the final `output`; my probe of a disagreeing final output was refused `bad_text`.
- **Reasoning is never kept (S-2).** Reasoning-summary deltas are ignored. A refusal is kept by length only; my probe of a refusal part beside text gave raw `hi` and `refusal_chars` 6.
- **Exactly one terminal event.** An event after it, or none at all, is refused.
- **Status matches the terminal event.**
- **No usage means no response,** on `completed` and on `incomplete` alike.
- **Usage values must be whole numbers.**
- **The output is settled at a bound that never under-counts,** however `output_tokens` treats reasoning (B). This is the same settlement I accepted for the non-streamed adapter (§6c).
- **Only `server_error` is retried,** whether it arrives as an `error` event or as `response.failed`. Every other code stops the provider, a null code and an unknown one included. This is fail-closed, and the self-test covers each case.
- **Errors before the stream starts are classified as before.** The 1,800-case fail-closed sweep still passes.
- **The reservation is unchanged:** US$0.523730 and US$0.520808 per call, US$3.133614 for six calls. These are the figures I recomputed in v3.
  - The OpenAI cap of US$5.00 holds the reservation.
  - The total cap of US$9.51 is below US$10 − US$0.482254 = US$9.517746, so it is conservative.

**My probes:**

| Probe | Result |
|---|---|
| A fractional sequence_number | refused `bad_order` |
| The final `output` disagreeing with the stream | refused `bad_text` |
| A refusal part beside text | text kept, refusal counted by length |
| A reasoning item with a content part | refused `bad_order` (see R-1) |
| **No sequence_number at all, or on one event** | **accepted** (see C-1) |

### (a) Retrying after output has streamed: I agree with keeping it, as Bob recommends. The owner decides.

- **What OpenAI's sentence is for.** It warns a client against silently replaying a request whose partial output it has already consumed: a duplicate side effect, a double bill, or text stitched from two attempts.
- **None of those can happen here:**
  - `store: false`, and nothing is called on the model's behalf;
  - each attempt is a fresh request, with its own full reservation inside the caps, and the abandoned one's reservation is kept as cost;
  - no partial text is ever joined to a retry: it goes to PRIVAT/incomplete, which P-1 keeps out of every outgoing folder;
  - N4 stops the provider after three unusable responses.
- **Following it literally** would treat OpenAI's cut streams worse than Anthropic's under ruling 48's single process.
- **Condition on (a):** the ledger and the report must state, for both providers alike, which attempt each chapter's answer came from. The self-test logs show the ledger keeps every attempt. If the report does not already print the attempt number per chapter, add it before judging; it does not have to be in this package.

### (b) The seven fail-closed points: right.

- **A repeated or backward `sequence_number` is refused.** That is the safe reading of a cursor (B), and the self-test covers both cases.
- **`response.incomplete` without usage is not a response.** Right: it cannot be settled, so its reservation is kept, and it is retried within N4.
- **The other five are also right:**
  - events are read by `data.type`;
  - only `server_error` is retried;
  - there is one terminal event;
  - a dropped stream keeps its full reservation;
  - output is settled at an over-estimate.
- **C-1 (wording only):** the readiness note and `fail_closed_fields` say `sequence_number` is present on every event (A). The code accepts an event that lacks one; my probe confirmed it.
  - I do **not** ask for the code to change. Refusing a missing number would add a new way for a good stream to fail. Ordering is already enforced by the item and part checks, and TCP delivers the bytes in order.
  - State the rule as it is: *a repeat or a step back is refused; a missing number is tolerated.* Do it in `OPENAI-READINESS.md`, where the change needs no rebuild. In `fail_closed_fields` it can wait for the next rebuild.

### (c) The blinding: it matches v2's reviewed flow, ruling 51 and P-1.

- **Ruling 51 is met:**
  - the frozen `kit.mjs blind` (`68ebe2fd`) runs once over both providers together;
  - it runs only after OpenAI's run has completed (exit 0);
  - no question leaves the Mac before both providers' questions exist.
- **The outgoing folders are the kit's blinded files only.** The outgoing checks are kept: the three-file allowlist for `untuk-bob`, the `incomplete` refusal (P-1), the key-shaped scan, and the map.json refusal.
- **Reading Anthropic's sealed answers only in the live run meets P-1 and ruling 51.**
  - In the practice and rehearsal runs, Step A still reads the two sealed files to hash them. They are hashed, never copied and never shown.
  - So "never read" in the readiness note should say "hashed only". This is wording, folded into C-1.
  - In the live run they are copied only into PRIVAT/gabungan, then blinded. The rehearsal shows `sealed_anthropic_in_outputs=none` on all 18 paths.

### Recommendations (not conditions; Bob and the owner choose; either needs a red case first and a rebuild)

- **R-1, a reasoning item's content part.**
  - Today a `content_part.added` on a `reasoning` item is refused `bad_order`. The facts list `response.reasoning_text.delta` with a `content_index`, so the API knows of such parts.
  - If the model emits one, each attempt fails, and N4 stops OpenAI after three. That would be about US$1.57 with no answer, and the free practice run cannot show it, since the stand-in never sends one.
  - The fix would accept such a part, keep nothing from it, and count it as reasoning. The red case: the reasoning canary appears in no output.
  - I do not rate this likely: we request no summary, and gpt-6.1-sol does not expose its raw reasoning. It is a cost risk, not a data risk.
- **R-2, the copy of Anthropic's answers.** In the live run, Step E copies the whole `anthropic/` folder. I recommend two changes:
  - copy only `bab1.json` and `bab2.json`;
  - hash the copies against the ledger again inside `gabungan`.

  That makes the claim "the answers blinded are the ones fingerprinted" hold by construction. Today it holds because `kit.mjs blind` reads only `bab${b}.json`, and the sealed map records each file's sha256 (`kit.mjs:169–173`).

## Could reasonably have been anticipated

- **C-1:** yes (Q1, readers and writers). The note's claim and the code's behaviour were written separately, and no case covered a missing number.
- **R-1:** partly (Q4, before and after). The stand-in sends only the event shapes the adapter expects.

## Addendum · R-1, R-2 and C-1 confirmed (18 Nov 2026, 02:10 UTC)

Read: `git diff 239a0211..88e33ec663297e2d1436c828d95236494f2f58d4 -- runner.mjs` (R-1) and `git diff 013903bc..d2a0210bc5f9b7778ee4b20b9ee55f8134120df4` (R-2, C-1, the rehearsal).
- **R-1 met.**
  - A part on a non-message item is tracked, so its events stay in order, and is counted in `reasoning_parts`. It takes the type `not-message:…`, so `textNow` never selects it.
  - An `output_text` or refusal delta into it is still refused `bad_delta`.
  - Red first at `239a0211`; the self-test is 262 by Bob's count.
- **R-2 met.**
  - `salin_dua` copies only `bab1.json` and `bab2.json`, and checks that the destination holds exactly those two files.
  - It re-hashes each copy against the ledger's single `ok` entry for its chapter.
  - One shared step serves the live and practice runs, and the rehearsal lists exactly those two files in `gabungan/anthropic`.
- **C-1 met** in `OPENAI-READINESS.md`: "a missing number is tolerated", and "hashed only".
- **Package:** `3f2ade8464fbd54dbf6e183106e1f49c9b78721a7a0b55850bb063a011924283` supersedes `bc2f3c0c`. `SOURCE-COMMIT` is pinned to `88e33ec6`.
- **(a):** the attempt used per chapter is in `bab<n>.provenance.json`. It must reach the results before judging. **The owner decides (a).**
- **Not a condition:** OpenAI's folder is still copied whole into PRIVAT/gabungan, `incomplete/` included. That is safe: the kit reads only `bab${b}.json`, and P-1 refuses `incomplete` in every outgoing folder.

## Addendum · ruling 52: the attempt used is reported (18 Nov 2026, 02:20 UTC)

Read: `git diff 3836673c..86658dcba9e01646693e51acaaeb78ea9d18d113 -- runner.mjs` (47 added lines; red first at `3836673c`) and `git diff d2a0210b..7a83c7ac164c689c863951769c39f863eb0e9269 -- v4/jalankan-e.sh`. **My (a) condition is met.**
- `acceptedAttempts` applies one rule to every provider in the ledgers. For each chapter it reports:
  - the first `ok` attempt;
  - the attempts used and their statuses;
  - the request id and the response sha256.

  It reports metadata only, and a chapter not accepted is stated as such.
- `asal-jawaban.txt` is written into `untuk-bob` before the outgoing scans, so the key, `incomplete` and map scans cover it. The allowlist names it exactly.
  - It exposes nothing new: the ledger in `untuk-bob` already carries the same request ids and sha256s, and `untuk-bob` never reaches the judges.
- **Package `bae2c4c72ccc67761da3b03ed8f27671f5b58e7c38495c60e5ae1aeb51c3949e`** supersedes `3f2ade84`, with `SOURCE-COMMIT` pinned to `86658dcb`.
- **Not a condition:** for OpenAI, the script does not assert that the printed sha256 equals the judged `bab<n>.json`, as `salin_dua` does for Anthropic. The sealed map records each judged file's sha256 (`kit.mjs:169–173`), so the two can be compared after unsealing.

## Still open, and not mine

- C-1's wording, which needs no rebuild.
- The owner's choice on (a).
- Whether to adopt R-1 or R-2. If either is adopted, the package needs a new SHA-256 before the practice run.
- The owner's free practice run, then his separate authorisation. **No call, key or spend before that.**

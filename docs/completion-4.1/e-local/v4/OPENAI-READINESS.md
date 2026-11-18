# E · OpenAI readiness (v4), for Sharon's review and then the owner's

**No call, no key and no spend.** The owner has authorised preparation only (18 Nov). A paid run needs his separate authorisation, after Sharon's PASS and his free practice run.

## 1 · The facts (grade A unless marked)

`docs/completion-4.1/E-PROVIDER-FACTS-OPENAI-STREAM.md`, on `claude/e-openai-stream-facts` at `3e1a09f0`, was read on 17 Nov by the research session `session_01FXjU1kQmRdGcQ1XZrzGxSK`. This session cannot reach developers.openai.com.
- **Streaming:**
  - `stream: true` on `POST /v1/responses`.
  - Final usage is in `response.completed`'s `response.usage`.
  - `sequence_number` is in every event's schema.
- **Statuses and errors:**
  - the status values, and the `incomplete_details.reason` values (`max_output_tokens`, `max_messages`, `content_filter`, `steered`);
  - the `error` event's fields (`code`, `message`, `param`, `sequence_number`);
  - `response.failed`'s error codes (server_error, rate_limit_exceeded, invalid_prompt and 18 more).
- **The model,** gpt-6.1-sol:
  - 128,000 max output tokens, so 48,000 fits;
  - `reasoning.effort` defaults to `medium`; we send none, so the default applies (Ruling 50);
  - streaming and structured outputs are both listed as supported.
- **New event types** are a backwards-compatible change.
- **Not documented or only B,** each handled fail-closed (the adapter's `fail_closed_fields`):
  - **Event framing:** event names are not documented to equal `data.type`, so events are read by `data.type`.
  - **sequence_number** being strictly increasing: a repeat or a step back is refused; a missing number is tolerated (Sharon C-1).
  - **Usage on `incomplete` and `failed`:** the examples print `null`. Without usage the stream is not a response, and its reservation is kept.
  - **Error-event codes:** only `server_error` is retried.
  - **One terminal event per stream:** anything after it, or none at all, is refused.
  - **Billing on a dropped stream:** its full reservation is kept.
  - **`output_tokens` includes reasoning** (B): output is settled at output + reasoning, never above `max_output_tokens`. That is an over-estimate, so it can never overrun.

## 2 · The runner (`claude/e-runner-v2`)

| Commit | What |
|---|---|
| `f47c7865` | Red first: OpenAI streaming checks and whole-run scenarios; 11 failed |
| `10414471` | The adapter, `openaiAssembler`, streaming, the same S-1 to S-3 as Anthropic; marked unverified; 258 passed |
| `792bd747` | Red first: events read by `data.type`; the adapter verified; 1 failed |
| `d4adbeb6` | Reconciled with the facts and verified; **self-test 260 passed** |

**How the adapter behaves:**
- **The text it keeps:** only `output_text` deltas in a message item's `output_text` parts. They are cross-checked against `output_text.done` and, when present, against the final response's `output`.
- **What it records, but never stores:**
  - reasoning items and summaries are counted, never kept;
  - a refusal is recorded by its length only, never its words.
- **How each ending is treated:**
  - `response.incomplete` with usage: a finished, billed answer, validated like Anthropic's `max_tokens`;
  - `incomplete` without usage: not a response;
  - `response.failed`, or an `error` event: `stream_error`;
  - a cut, a stall, or a missing or extra terminal event: `stream_incomplete`, with its reservation kept and its partial text preserved in PRIVAT.
- **What is unchanged:** errors before the stream starts are classified exactly as before. The request is the same as before, plus `stream: true`.

## 3 · The reservation and its enforcement (unchanged, Sharon to verify)

At the package settings (OpenAI only, 48,000, the pinned US$2 / US$10):

| | Input bound | Worst case |
|---|---|---|
| bab1, per call | 21,865 | US$0.523730 |
| bab2, per call | 20,404 | US$0.520808 |
| **all 6 calls** | | **US$3.133614** |

- **Caps:** US$5.00 for OpenAI, its balance, with auto-reload off; US$9.51 in total, which is US$10 less Anthropic's US$0.482254.
- **Enforcement:** as before. A call is refused if it could pass a cap, only one reservation is open at a time, and an overrun aborts the run.

## 4 · Package v4 (`e-local/v4`)

- **Runner and checksum:** runner `d4adbeb6`. **SHA-256 `bc2f3c0ce13d4c7a71be65ab104961b58a9396fc2da62a01a77f46a9e7d6a299`.**
- **One key:** OpenAI's. An Anthropic key is refused.
- **Checks before it starts:**
  - the void run 1, which must be unchanged;
  - **Anthropic's run 2:** the two recorded request ids and costs, and each sealed answer file's SHA-256 against its ledger. The files are hashed only, never shown.
- **After a completed run:** it blinds Anthropic's sealed answers and OpenAI's new ones **together** with the frozen `kit.mjs blind` (Ruling 51). That produces `untuk-bob` (the ledger and the summaries), `untuk-sharon` and `untuk-juri`, as in v2's reviewed flow.
- **Practice and rehearsal** blind mock answers for both providers. They only hash Anthropic's real answer files, never copying or showing them.
- **Kept from v3:** P-1, P-2, the key handling and the outgoing scans.
- **Rehearsal** (`v4/rehearsal/REHEARSAL-RESULT.txt`): 18 paths, all as expected:
  - no key in any output or the process list;
  - no reasoning text, and no sealed Anthropic text, in any output;
  - the Anthropic stand-in was never contacted;
  - the blinded set held 60 items under two provider codes.

## 5 · One question for Sharon and the owner: retrying after output

OpenAI's rate-limits guide says (A): *"An error after streaming begins can arrive as a stream event; don't automatically replay a request after consuming output."*

- **What v4 does:** like v3 for Anthropic, it retries a cut or errored stream as a fresh request. That is at most twice, each with a full reservation inside the caps, and N4 stops the provider after three unusable responses.
- **Options:**
  - **(a) Keep it.** This is the same process for both providers (Ruling 48). The guidance is advice, not a prohibition. With `store: false` there is no side effect, and the cost is bounded and reserved.
  - **(b) Follow the guidance literally:** no automatic retry once output has arrived. The request then fails, which can cost OpenAI a chapter that Anthropic's process would have retried. That is unequal treatment.
- **Bob recommends (a).** It is not changed in code until Sharon and the owner rule.

## 6 · Sharon's verdict (`b52b1079`): PASS, and what followed

- **PASS.** Sharon ran the self-test herself and probed the assembler six times. She found `kit.mjs` byte-identical to the reviewed `68ebe2fd`, and the reservation figures unchanged. The US$9.51 total cap is below US$9.517746, so it is conservative.
- **(a) Retrying after output:** she agrees with keeping it, because what the guidance protects against cannot happen here. **The owner decides.**
  - **Her condition:** the report states which attempt each chapter's answer came from, for both providers alike.
  - That is recorded per chapter in `bab<n>.provenance.json` (`attempt`), and carried into the results before judging.
- **(b) The fail-closed points:** right as they stand. She asked for one wording correction, C-1, made above; the code is deliberately unchanged.
- **(c) The blinding:** it matches v2's flow, Ruling 51 and P-1.
- **Her two recommendations, both done** (ordinary technical fixes, within scope under the owner's delegation of 18 Nov):
  - **R-1:** a content part on a reasoning item is accepted, counted as reasoning, and nothing of it is kept. Red first `239a0211`, fixed in `88e33ec6`; self-test 262. Without this, such a stream would have been refused and N4 would have stopped OpenAI after about US$1.57, with no answer.
  - **R-2:** Step E copies only `bab1.json` and `bab2.json` from Anthropic's run 2, then re-hashes the copies against the ledger. The live run and the practice run use one shared step, so the rehearsal exercises it. The rehearsal shows only those two files copied.
- **Package v4, rebuilt on runner `88e33ec6`:** SHA-256 **`3f2ade8464fbd54dbf6e183106e1f49c9b78721a7a0b55850bb063a011924283`**. It supersedes `bc2f3c0c`. Rehearsal: 18 paths, all as expected.

## 7 · Ruling 52: the retry is kept, and the accepted attempts are named

- **The owner's decision (18 Nov):** OpenAI keeps the governed retry, consistent with Anthropic, and Sharon's condition is adopted.
- **The runner** (red first `3836673c`, fixed in `86658dcb`; self-test 267):
  - `acceptedAttempts` and `node runner.mjs --asal <ledger>,<ledger>` give one line per provider and chapter;
  - each line names the first accepted attempt, the number of attempts used, the request id, the response SHA-256 (which matches the judged file), and the attempt statuses;
  - it is metadata only, with no question text, and the same rule applies to both providers;
  - on Anthropic's run 2 ledger it gives attempt 1 of 1 for both chapters.
- **v4:** after blinding, `untuk-bob/asal-jawaban.txt` is written from Anthropic's run 2 ledger and OpenAI's ledger together; practice and rehearsal use the mock ledgers. `untuk-bob`'s allowlist is now these four files.
- **Package v4, rebuilt on runner `86658dcb`:** SHA-256 **`bae2c4c72ccc67761da3b03ed8f27671f5b58e7c38495c60e5ae1aeb51c3949e`**. It supersedes `3f2ade84` and `bc2f3c0c`.
  - Rehearsal: 18 paths, all as expected.
  - No key, reasoning text or sealed Anthropic text in any output.
  - Only `bab1.json` and `bab2.json` copied for blinding.
  - 60 items blinded under two codes.

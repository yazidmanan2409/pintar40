# E · incident: the first local paid run stopped (exit 3, overrun)

17 Nov 2026. Reported by the owner. Analysis by Bob. **No further paid call without the owner's authorisation.**

## What happened

- The runner made **one** paid call: Anthropic, chapter 1, attempt 1. Then it stopped by itself with exit code 3:
  `reported cost 0.129986 exceeds its reservation 0.127860`.
- **Spent:** Anthropic US$0.129986. OpenAI US$0, no call.
- **Valid drafts: 0,** because the response was never validated (see the second defect).
- The frozen pack (`ecb0d3c4`), the material and the frozen set are untouched.
- `hasil/` exists, and the script refuses to run again while it does. **This is what prevents a duplicate paid call.**
  Keep the folder as it is.

## The two defects (in `runner.mjs` at `68ebe2fd`; not in the frozen set)

1. **The input estimate is too low.**
   - The reservation is `ceil(ceil(chars / 3) × 1.2)` input tokens plus `max_output` (12,000) output tokens. For
     chapter 1 (9,823 characters) that is 3,930 input tokens, or US$0.127860.
   - The reported cost implies **at least about 4,993 input tokens**: exactly that if the output reached 12,000, and
     more if it did not.
   - So the real ratio is about 2 characters per token or fewer, for Indonesian text plus the JSON schema, plus any
     tokens the provider adds for structured output. The `× 1.2` margin did not cover that.
   - **No dry run could catch it:** the mock reports made-up token counts, and nobody had a real count before this call.
   - The runner's own after-call check worked as designed. It stopped at the first overrun, and no second call was made.
2. **On an overrun, the paid response is discarded.**
   - The overrun branch (line 415) aborts before the raw response is written (line 432).
   - So a response that was paid for exists nowhere. It was never validated and **never seen by anyone.**
   - A paid response must always be kept.

## Still to confirm from the ledger (the owner sends it; it holds no key and no question text)

From `runs/ledger.json`: `actual_input_tokens`, `actual_output_tokens`, `finish` and `request_id` of the one attempt.
- **If `finish` shows the 12,000-token output limit was reached,** 15 items do not fit in 12,000 tokens. Every attempt
  would be truncated and invalid. Then `max_output` must rise, and the cost bound with it (pack §3), before any rerun.
- Otherwise only the input bound needs fixing.

## Proposed recovery (for Sharon's review and the owner's authorisation)

1. **Now, the owner:**
   - Revoke both keys, if not already done.
   - Leave `hasil/` exactly as it is.
   - Check the two files below for key text: run `grep -c "sk-" <file>` on each; it must print 0.
   - Send Bob `PRIVAT-simpan-jangan-dikirim/run-log.txt` and `PRIVAT-simpan-jangan-dikirim/runs/ledger.json`.
   - Optionally, read the Anthropic console's usage for the workspace (one request, about US$0.13).
2. **Bob fixes the runner** (two small changes, red-first tests, then Sharon's review):
   - **Input bound** = the request's UTF-8 **bytes** × 1.2, plus a fixed allowance. A tokenizer never emits more
     tokens than bytes, so this bounds the request from above for any tokenizer. The allowance (sized from the ledger)
     covers the provider's own structured-output overhead.
     - Chapter 1 would then reserve about US$0.144 per call instead of US$0.128.
     - The worst case with every retry is about US$0.87 per provider, still far inside the US$5 caps.
   - **On an overrun, keep the response:** write the raw response and its validity, then abort.
   - **`max_output`:** raised only if the ledger shows truncation. The cost bound is re-proved either way.
   - **The pack:** §3 (the cost section, outside the frozen §4) records the new bound. §4 is untouched, so the
     frozen SHA `ecb0d3c4` stands.
3. **The rule for the lost attempt** (Sharon to confirm; the owner to approve):
   - The first run is recorded as **void: tooling defect** (Sharon C1; the owner ran it exactly as written). Its one response was never seen, so no response was
     selected or rejected on quality, and §4.1's "no retry for quality" is not engaged.
   - The rerun is a **fresh run of both providers**, with new run IDs. The void run's cost is reported alongside, as
     cost of the evaluation, not of either provider's drafts.
4. **A new package (v2):**
   - It carries the fixed runner, under a new source commit.
   - It writes to `hasil-2/`.
   - It **refuses to start unless `hasil/` (the void run) is present and unchanged,** so the void run is preserved and
     cannot be repeated by accident.
   - It deducts the void run's spend from Anthropic's cap: US$5 − US$0.13.
   - It is rehearsed offline as before, with a mock that also reports **real-sized** token counts and an overrun case
     that must keep the response.
5. **The rerun** happens only on the owner's new authorisation, with the same steps: new temporary keys, the free key
   check, then `RUN`.

**Timing:** if the ledger arrives tonight, the fix, the review and v2 can be ready on Wednesday morning WIB, and judging
on Thursday can still hold. Otherwise it is Friday.

## The run log (received from the owner, 17 Nov; not committed, because it holds a local path)

It contains no key text (checked). It confirms:
- **one** attempt in all, `anthropic bab1 a1`, with status `overrun` and US$0.129986;
- OpenAI made 0 attempts;
- the pack SHA is `ecb0d3c4`;
- no reservation is left open.

It does **not** give the token counts or `finish`. Those are in `runs/ledger.json`, which is still needed.

## Sharon's review (`3aefd3d5`): analysis confirmed; the void rule accepted with C1–C4

- **The bound.** Bytes × 1.2 is a true bound on the text, because both tokenisers are byte-level (tokens ≤ bytes).
  - The allowance for what the provider adds is sized **from the ledger**: at least twice the observed overhead, with
    a floor of 1,000 tokens. Its derivation goes into pack §3.
  - Nothing is sized before the ledger arrives.
  - If `finish` shows the 12,000 limit was reached, `max_output` rises and the worst case is re-proved.
- **C1:** the label is "void: tooling defect".
- **C2:** the fact is stated plainly. The response was never persisted or seen, so §4.1 is not engaged.
- **C3:** both providers rerun fresh, under the same process. The void US$0.13 is reported as evaluation cost and
  deducted from the caps: Anthropic US$4.87, total US$9.87.
- **C4, the v2 gate, in this order:**
  1. the runner diff, with red-first tests;
  2. a new SOURCE-COMMIT, with `hasil/` required;
  3. a rehearsal with real-sized token counts, and an overrun case that keeps the response;
  4. Sharon's PASS;
  5. the owner's new authorisation.
- **A future overrun** keeps the response as evidence, but still aborts. Going on after one is the owner's call.

## The ledger (received 17 Nov; no key text; both keys revoked by the owner)

| Field | Value |
|---|---|
| actual input tokens | **4,993** (the bound was 3,930) |
| actual output tokens | **12,000**: exactly the limit |
| stop reason | **`max_tokens`**: the response was cut off |
| of which thinking | **7,482** (`output_tokens_details.thinking_tokens`) |
| duration | 83 s |

- **The second finding.** Claude Sonnet 5.5 always thinks before it answers: adaptive thinking, default effort
  `high`, and it cannot be turned off. This is from Anthropic's models overview, read 17 Nov. Its maximum output is
  128K. Thinking used 7,482 of the 12,000 tokens, which left about 4,500 for the 15 items, so **every attempt at
  12,000 would be truncated.** OpenAI's `max_output_tokens` also counts reasoning.
- **So `max_output` must rise, for both providers alike.** Neither provider's defaults are changed. The proposal is
  **48,000**:
  - the worst case is about US$0.52 per call, US$3.14 per provider with every retry, and US$6.28 in all;
  - that is inside the deducted caps of US$4.87 (Anthropic), US$5 (OpenAI) and US$9.87 (total);
  - the expected cost is about US$1.05 per provider.
  - 32,000 would cost about two-thirds as much, with less room for thinking. **This is the owner's decision.**
  - OpenAI's maximum output for `gpt-6.1-sol` must be confirmed at least this large (its page is unreadable from here).
- **Runner v2, on `claude/e-runner-v2`:**
  - `6aeb06b2` is the red-first test step: both new tests failed.
  - `1ebd840d` is the fix: the input bound is bytes × 1.2 + 10,000, and an overrun keeps the response before aborting.
    The self-test passes in full. The cap tests were recalibrated to the larger reservations; their intent is unchanged.
  - `DEFAULT_MAX_OUTPUT` stays 12,000 until the owner decides. The v2 package will pass `--max-output`.

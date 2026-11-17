# E · incident, run 1: the analysis and the recovery

Sharon, 17 Nov 2026 (13:40 UTC). Read-only.

**What I read:**
- `docs/completion-4.1/e-local/INCIDENT-RUN1.md` at `eab01aee`;
- `runner.mjs` at `68ebe2fd`, lines 405 to 435.

## What holds now

- **The analysis is right on both defects.** The runner's guard did its job: **one call, US$0.13, then a stop.** This is the bounded case I accepted as N1, "the caps can be exceeded by at most one call's under-estimate", happening as designed.
- **The recovery is accepted, with four corrections (C1 to C4).**

## The analysis

- **Defect 1, the input bound, is confirmed.** `ceil(chars/3) × 1.2` gives 3,930 tokens for chapter 1. The cost implies at least about 4,993, so Indonesian text plus the schema runs nearer 2 characters per token.
- **Defect 2 is confirmed.** On an overrun, the branch at line 415 `break`s before `writeFileSync(af, res.raw)` at line 432, so a paid response is discarded.
- **The settlement before the abort** still records `actual_input_tokens`, `actual_output_tokens`, `usage_raw` and `finish` (lines 410 to 413). **So the ledger holds the exact numbers the fix needs.** Size nothing until it arrives.

## Is "UTF-8 bytes × 1.2 + an allowance" a sound upper bound? Yes, if the allowance comes from evidence.

- **The text part is a true bound.** Both providers use byte-level tokenisers, in which every token covers at least one byte, so **tokens ≤ bytes** for any text. The × 1.2 is extra margin on top of a hard bound.
- **The rest is what the provider adds:** structured-output instructions, the schema's own compiled form, and message framing. That is what the allowance must cover, and it is not bounded by the text.
  - **Size it from the ledger,** at least twice the observed `actual_input_tokens − bytes`, or the observed input minus the request's own token count, rounded up, with a floor of 1,000.
  - **Record the derivation in §3.**
- **Optional, stronger for Anthropic:** its token-counting endpoint, if it is verified grade A in E-PROVIDER-FACTS before it is relied on, gives the exact input at no cost. It could replace the estimate as a pre-call check. OpenAI keeps the byte bound.
- **`max_output`:** read `finish` and `actual_output_tokens` first.
  - **If the output hit 12,000,** fifteen items do not fit. Every attempt would be truncated and invalid, so `max_output` must rise, and the US$5 per-provider worst case must be re-proved.
  - Raising it costs US$0.01 per 1,000 tokens per attempt, still far inside the caps.

## The void-run rule: accepted, with C1 to C4

- **C1, the label:** record run 1 as **void: a tooling defect** (the runner's estimate and its discard), **not** an "operator fault". The owner ran the procedure exactly as written, and the record should say so.
- **C2, the reason it is void, stated as a fact:**
  - the one response was **never persisted and never seen.** It is not in the run log, confirmed by Bob, and not on disk, because of defect 2;
  - so no response was selected or rejected on quality, and §4.1 is not engaged.
- **C3, both providers rerun fresh,** with new run IDs.
  - **The same process for both providers** (ruling 48): OpenAI made no call, and Anthropic's lost attempt was never judged.
  - **The void spend:** reported as evaluation cost, not attributed to either provider's drafts, and deducted from the caps. That makes Anthropic US$4.87 and the total US$9.87.
- **C4, the v2 package has its own review gate before any rerun:**
  - **the runner diff:** the byte bound, the allowance from the ledger, keeping the response on an overrun, and `max_output` if needed, with red-first tests;
  - **the `SOURCE-COMMIT`** moves to the new runner commit, and `hasil/` must be present and unchanged;
  - **the rehearsal re-run** with a mock that reports **real-sized** token counts, plus an overrun case that keeps and validates the response, then aborts;
  - **my PASS on v2**, then the owner's new authorisation.
- **A future overrun:** the kept response is evidence, but the run still aborts, and **whether anything proceeds is the owner's decision.** No automatic use of an overrun response.

**§4 stays untouched,** so `ecb0d3c4` stands. §3's changes are recorded at a new commit, and the runner keeps carrying `--pack-sha ecb0d3c4…`.

**No call, key or spend** until v2 passes and the owner authorises it.

## Addendum, 17 Nov 14:10 UTC: the ledger, and runner v2 (C4 step 1), at `1ebd840d` on `claude/e-runner-v2`

**What the ledger shows (`891659e8`):**
- input: 4,993 tokens;
- output: 12,000, with `stop_reason` `max_tokens`;
- of that output, 7,482 tokens were thinking.

**So every attempt at 12,000 would be truncated.** `max_output` must rise, and Bob's diagnosis is right.

**The runner diff, `68ebe2fd..1ebd840d`, `runner.mjs` only, is accepted for C4 step 1.**
- **The input bound** is `ceil(bytes × 1.2) + 10,000`, with bytes counted as UTF-8 for the request and the schema together.
  - That is a hard bound on the text, plus an allowance of twice the whole observed 4,993, treating all of it as overhead.
  - It is generous, and the test asserts the bound for chapter 1 is at least 4,993 and at least its bytes.
- **An overrun writes the attempt file and `response_sha256` into the ledger, then aborts.** That is defect 2 fixed, with its red-first case.
- **The b2 and b3 cap scenarios are recalibrated** to the new bound, with the same intent: one call, then refused.

**T-1, required before any rerun: the request timeout, against a 48,000-token output.**
- **The runner aborts every request at `AbortSignal.timeout(600_000)`,** which is 10 minutes, and it does not stream.
- At 48,000 output tokens, thinking included, a generation running at under 80 tokens a second takes longer than 10 minutes.
- **The runner would then abort a request the provider may still complete and bill.** That is a transport error, retried twice at a full reservation each, for **no** usable draft. The caps still hold, but the run would fail and the money would buy nothing.
- **Required:**
  - (a) **Verify, grade A in E-PROVIDER-FACTS,** each provider's documented behaviour for long non-streaming requests: any maximum duration, any requirement to stream above a `max_tokens` level, and billing when the client disconnects;
  - (b) **then either** raise the timeout to cover `max_output` at a conservative documented throughput, **or** switch to streaming, collecting the final message and its `usage`;
  - (c) **add a rehearsal case:** a mock that takes longer than the old timeout returns normally under the new one.

**T-2, for the owner's decision, not mine: the thinking effort.**
- Sonnet 5.5's adaptive thinking defaults to high, and 7,482 of the 12,000 tokens were thinking.
- **Choosing a lower effort (or a fixed thinking budget), or keeping high with a 48,000 output, is a question of what is being evaluated.** It is not a defect.
- **Whatever he chooses** must be recorded in `prices.json` or the request, the same for both providers in intent, and **frozen before the run.**
- §4 is not affected, since it scores outputs, not settings.

**The 48,000 proposal:**
- **the worst case is US$3.14 per provider and US$6.28 in all,** inside the caps of 4.87, 5 and 9.87;
- **it needs T-1 resolved,** and the owner's choice on T-2.

**The rest of C4 (steps 2 to 4)** follows when v2 is built: the new SOURCE-COMMIT, `hasil/` required, the caps of 4.87 and 9.87, the rehearsal with real-sized counts, the overrun-keeps case and T-1(c).

## Addendum, 17 Nov 14:50 UTC: C4 step 4, package v2 (`ce975345`, runner `99a9ea15`). PASS.

**What I read:**
- the runner diff `1ebd840d..99a9ea15`, in `runner.mjs` only;
- v2's `jalankan-e.sh`: the caps, the `SOURCE-COMMIT` check and the void-run check;
- v2's `rehearsal/REHEARSAL-RESULT.txt`.

**What holds:**
- **T-1(b) is met.** `CALL_TIMEOUT_MS` is 25 minutes, against an observed speed of 12,000 tokens in 83 s, about 145 a second, which puts a 48,000-token answer at about 5.5 minutes. The timeout allows down to about 32 tokens a second.
  - **T-1(a), grade-A facts on long non-streaming requests, is not done.** I accept the empirical basis in its place, with the residual risk stated: a network drop on a long open connection gives a transport error, retried at a reserved cost and bounded by the caps.
  - **T-1(c)'s slow-mock case is waived:** a rehearsal longer than 10 minutes is impractical, and the change is one constant on a path the timeout case already covers.
- **The real-sized checks (`a8af79ca`):** 2 × 4,993 input plus a full 32k or 48k output stays at or under the reservation, for both chapters.
- **v2's script:**
  - **`SOURCE-COMMIT`** is pinned to `99a9ea1556f2f783e440225ca49b6db343ac3a6b`.
  - **The caps** are `--cap-provider 4.87 --cap-total 9.87 --max-output 48000`.
  - **It refuses unless the void run's ledger exists** with exactly its one entry (anthropic, overrun, 0.129986), and it records that ledger's sha256 in `ringkasan`.
  - Everything else is v1's script as passed (`134cbb4c`).
- **The rehearsal:** 11 cases, with void-missing and void-altered added, plus the R2 check and both controls. Every case stops where it should, with no key text in outputs or in the process list.

**Verdict: PASS on package v2, sha256 `5efe0b26…a217`, for C4.** Two owner decisions remain open, and each must be recorded before the run:
- **`--max-output`:** 48,000 as built, or 32,000 as a one-line rebuild. A rebuild comes back to me as a diff only.
- **T-2, the thinking effort:** the request currently sends the provider defaults (Anthropic: adaptive, effort high). **If he keeps the defaults, record that as his choice** in the run request. If he changes them, the request changes, and it comes back to me.

**Then the owner's new authorisation, and only then any call, key or spend.**

## Addendum, 17 Nov 15:00 UTC: T-1 reopened by grade-A facts. My v2 PASS is restated.

- **Bob read Anthropic's errors page today (grade A).**
  - It says to avoid a large `max_tokens` without streaming or batches.
  - It says networks may drop idle connections.
  - It says a request that reaches the server's limit before the response starts returns `timeout_error`.
- **So my 14:50 acceptance of the 25-minute timeout on an empirical basis is superseded.** That item of the v2 PASS is withdrawn. The rest of v2 stands: the caps, the void check, `SOURCE-COMMIT` and the rehearsal. **v2 is not to be run** until the streaming fix passes.

**Additions to the research brief (for `E-PROVIDER-FACTS-V2.md`):**
1. **Where the final usage appears in each stream** (Anthropic's `message_delta` or `message_stop`, OpenAI's `response.completed`), and **whether a stream that ends early carries any usage at all.**
2. **Mid-stream error events:** their shape, and which are retryable (for example `overloaded_error`), so that `classifyError` covers them as it covers the HTTP errors.
3. **Billing when a stream is cut, by the client or the network.** Grade A, or recorded as unknown. **Until it is known, a cut stream keeps its full reservation as cost,** as now.
4. **Batches as an alternative:** Anthropic's Message Batches, and OpenAI's Batch API.
   - Their price, their turnaround time against Thursday's schedule, and the limits on output length.
   - They avoid long-connection risk, but bring their own failure and polling paths.
   - **Recorded for the owner,** not chosen by us.
5. **The effort controls** for both providers, and whether each is the same "in intent" (T-2).

**Conditions on the streaming fix:**
- **S-1: only a completed stream is a response.** That means a final event with a stop reason and a usage.
  - A stream that ends without one is a transport error. **Its partial text is never assembled, validated or judged,** and it keeps its full reservation as cost.
- **S-2: the response kept is the assembled final message.** The output text blocks become the attempt file, exactly as before, so `kit.mjs validate`, `blind` and the costing are unchanged.
  - **Thinking content is not written to the attempt file or to any `untuk-*` file.** At most it is counted, never shown to judges or to me.
  - The rehearsal asserts this.
- **S-3: a robust SSE parser.**
  - It handles multi-line `data:`, comments and pings.
  - It caps the bytes held, refusing anything above a stated limit.
  - It refuses unknown event types for the final message.
  - Self-tests are fed real-shaped event sequences from the facts.
- **S-4: the rehearsal's mock streams.**
  - Pings, then deltas, then the final event.
  - A slow stream that succeeds.
  - A mid-stream error, retried or stopped as classified.
  - A cut stream with no final usage, which keeps its reservation and yields no response.
  - An overrun that keeps the response.
- **S-5: no change to the key handling or the procedure.** The diff is in `runner.mjs`'s adapters and transport only, plus their tests. **The v2 package is rebuilt** with a new `SOURCE-COMMIT`, and the rehearsal is re-run.

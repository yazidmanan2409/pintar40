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

## Sharon on runner v2 (`435eb425`): step 1 accepted; T-1 required; T-2 for the owner

- **T-1, required before any rerun: long requests.** Anthropic's errors page, read 17 Nov (grade A), says:
  - "Avoid setting a large `max_tokens` value without using the streaming Messages API or Message Batches API".
  - "Some networks might drop idle connections".
  - A request that "reaches the server's time limit before the response starts" returns `timeout_error`.
  - "Consider using the streaming Messages API or Message Batches API for long-running requests, especially those over
    10 minutes".

  Raising the client timeout to 25 minutes (`99a9ea15`) is **not enough by itself**. Nobody has yet established, grade A:
  - whether a client disconnect is billed, for either provider;
  - OpenAI's long-request behaviour.

  A research session (`session_01FXjU1kQmRdGcQ1XZrzGxSK`, on the `pintar40` environment, which reaches both
  providers' documentation) is collecting these facts. Documentation only; no call. It is also collecting:
  - each provider's streaming event format, with final usage and the stop reason;
  - the batch options;
  - `gpt-6.1-sol`'s maximum output;
  - the reasoning-effort controls;
  - Anthropic's full sub-processor list (G2).
- **Bob's likely fix: stream (SSE) for both providers,** each provider's own recommended route. The runner collects the
  final message, usage and stop reason, so validation, costing and the ledger are unchanged.
  - Rehearsal cases: a slow mock stream that succeeds; a mid-stream error; and an overrun that keeps the response.
  - **The adapter changes need Sharon's review again.**
- **T-2, the owner's choice: reasoning effort.** Keep each provider's default (Anthropic `high`; OpenAI's default, to be
  confirmed), or set a lower effort, the same in intent for both. Whichever is chosen is recorded in the request and
  frozen before the run. §4 is unaffected.
- **Timing:** streaming adds the facts, the adapter work and Sharon's re-review. Thursday's judging is now **at risk**.
  Friday 20 Nov is the realistic date if the facts arrive tonight.

## Sharon, 17 Nov: v2 PASS (`efa02dd8`), then its timeout item withdrawn (`6eb93a51`)

**Package v2 must not be run until streaming passes.** The rest of v2 stands: the bound, the overrun-keeps fix, the
real-sized checks, the source-commit pin, the void-ledger check and the caps.

**The research brief is extended,** and the additions were sent to the research session:
- where final usage sits in each stream, and whether a stream that ends early carries any;
- mid-stream error events, and which of them are retryable;
- billing on a cut stream, grade A or "unknown";
- batches for both providers: price, turnaround against Thursday, and output limits. These are recorded for the owner,
  not chosen by us;
- the effort controls, and whether a given level means the same intent on both (T-2).

**Conditions on the streaming fix:**
- **S-1:** only a completed stream is a response, meaning a final event with a stop reason and usage. Partial text is
  never assembled, validated or judged, and its reservation is kept. **A cut stream keeps its full reservation** while
  billing on a cut stream is unknown.
- **S-2:** the attempt file holds the assembled final output text, as before. Thinking content never goes into it, or
  into any untuk-* file, and the rehearsal asserts this.
- **S-3:** a robust SSE parser: it handles multi-line data and pings, has a byte cap, refuses unknown final events, and
  has self-tests on real-shaped sequences.
- **S-4:** a streaming mock covering a slow success, a mid-stream error, a cut stream with no usage, and an overrun that
  keeps the response.
- **S-5:** only the adapters and the transport change. Key handling and the procedure are unchanged. The package is
  rebuilt with a new SOURCE-COMMIT, and the rehearsal is re-run.

## Ruling 50 and v3: Anthropic only, streamed (17 Nov, Bob; for Sharon's review)

**Nothing has been run. There is no key and no paid call.** The owner authorises a run only after Sharon's PASS.

### The runner, on `claude/e-runner-v2`
- **`80c80252` is the red-first step:** the streaming checks were added first, and 6 failed.
- **`301b91a6` is the fix.** The self-test passes in full: **193 checks.**
- **What changed:** the transport, the Anthropic adapter, error classification, the mock and the live gate.
- **What did not change:** key handling, the budget formula, the caps, the overrun abort, and the frozen set (`kit.mjs`, `score.mjs`, `report.mjs`).

| Condition | How it is met | Proof in the self-test |
|---|---|---|
| **S-1** Only a completed stream is a response | A stream counts only if it has `message_start`, every block closed, a known stop reason, a final output count from `message_delta` (never `message_start`'s), and then `message_stop`. Anything else is `stream_incomplete`, or `stream_error` for an `error` event. Either way the attempt keeps its **full reservation** as its cost. Its partial text is never written, validated or judged. Only the evidence is kept: event counts, bytes, and the partial text's length and SHA-256 | 15 refusal cases; scenarios (h) and (h4) |
| **S-2** No thinking is stored | Only `text_delta` in `text` blocks is kept. Thinking and signature deltas are counted, never kept. Every mock stream carries a canary in its thinking, and no file the run writes may contain it | (h), (h2), (h5); the rehearsal scans `hasil` and the terminal output: none |
| **S-3** A robust parser | It follows the HTML standard's rules for event streams: CRLF, LF and CR line endings; multi-line data; comments; `id` and `retry` ignored; an unterminated event discarded. It also has a 32 MB byte cap, strict UTF-8, unknown event types ignored and counted, and an unknown final event refused | The documented thinking stream, split at 1, 2, 3, 7 and 64 bytes and over CRLF and CR, gives the same events |
| **S-4** A streaming mock | The dry run's Anthropic answers go through the **real** adapter, parser and assembler, from a local stream in `fetch`'s place. The faults are: a slow stream (31-byte chunks, CRLF); a cut stream; a mid-stream `overloaded_error` (retried); a mid-stream `invalid_request_error` (the provider stops); no final usage; an unknown event; and an overrun that **keeps the answer** and then aborts | (h) to (h5); transport checks for a dropped connection, the idle limit and an early close |
| **S-5** Only the adapters and transport change | Key handling is unchanged. The procedure changes only as Ruling 50 requires (one key, no OpenAI). The package is v3, under the new SOURCE-COMMIT `301b91a6`, and is rehearsed | See the package section below |

**Further points for review:**
- **Errors before the stream starts** are classified exactly as before. For example, a 429 spend stop is still a `spend_stop`.
- **A 2xx that is not an event stream** is `unparsable_2xx`.
- **Retries on mid-stream `error` events:** only `overloaded_error`, `api_error` and `timeout_error` are retried. These are the documented retryable types. Every other type stops the provider (fail-closed).
- **The idle limit:** 5 minutes with no byte aborts the call as `stream_incomplete` (idle). The 25-minute call limit stays.
- **A real run now refuses any provider without a streaming transport.** That is OpenAI today, deferred by Ruling 50. Its adapter is unchanged and needs its own verification later.

### The reservation and its enforcement (for Sharon to verify)

At the package settings (Anthropic only, max_output 48,000, pinned US$2 / US$10, from `runner.mjs --plan`):

| | Input bound | Worst case |
|---|---|---|
| bab1, per call | 21,865 | US$0.523730 |
| bab2, per call | 20,404 | US$0.520808 |
| **all 6 calls** | | **US$3.133614** |

- The cap is **US$4.87**. So even if all 6 calls each cost their full reservation, Anthropic's spend stays US$1.74 under the cap. This is the worst case the owner accepted in Ruling 50.
- **How the cap is enforced:**
  - before every call, `Ledger.check` refuses the call if spent + open reservations + this call's worst case would exceed the cap;
  - only one reservation is open at a time;
  - with no final usage, the reservation stands as the cost;
  - a cost above its reservation aborts the run.
- These rules are the ones Sharon reviewed (scenarios b, b2, b3 and c). Streaming did not change them.

### Package v3 (`e-local/v3`)
- **Anthropic only:**
  - one key, with a refusal if the key looks like OpenAI's;
  - a key check for Anthropic only (`periksa-kunci.mjs anthropic`; it checks both providers when given no argument, as before);
  - `--providers anthropic`.
- **No blinding.** The frozen `kit.mjs blind` needs at least two providers. So Anthropic's drafts stay sealed and unread in the PRIVAT folder, and `untuk-bob` holds only the ledger and the two summaries. The script checks this before zipping.
- **Rehearsal** (`v3/rehearsal/REHEARSAL-RESULT.txt`, under zsh 5.9 and bash 5.2): **the happy path and 10 stop paths all passed.** On every path:
  - no key appeared in any output or in the process list;
  - no thinking text appeared in any output;
  - the OpenAI mock received nothing.

  On the happy path, every Anthropic attempt that started streamed, at max_output 48,000. The R1, R3 and S-2 controls each caught their planted case.
- Package: `pintar-e-local-v3.tar.gz`, SHA-256 `79226145e469c6184a56b727fe3ba8408feecc200bfd4022b03ca7df097b2005`.

### For the owner: what this means for judging (no action needed until Sharon passes)
- **The frozen kit blinds Anthropic's and OpenAI's questions together.** That is what keeps the judges from knowing whose questions they score.
- **Recommendation:** keep it that way.
  - Run Anthropic now; its drafts stay sealed.
  - Run OpenAI after its own verification.
  - Then blind the 60 questions together and judge them in one session.
- **Why:** judging Anthropic alone first would tell the judges that every question in that batch, and later every question in the second batch, came from one provider. That weakens the blinding the comparison rests on.
- **The cost:** **Friday 20 November is possible only if OpenAI's run is also done by then.** Otherwise judging moves to when it is.

## Owner review of the v3 report (17 Nov): five points, and corrections

### 1 · Structured output with streaming: confirmed (grade A, read 17 Nov)
Source: Anthropic's structured-outputs page (platform.claude.com, build-with-claude/structured-outputs).
- **"Feature compatibility. Works with: … Streaming: Stream structured outputs like normal responses."** Also: "Structured outputs also work with streaming. As responses arrive in stream events, you need to accumulate the full response before deserializing the JSON." The runner does this: only the completed text is assembled and validated.
- **Thinking:** "Grammars apply only to Claude's direct output, not to … thinking … Grammar state resets between sections, allowing Claude to think freely while still producing structured output in the final response."
- **Model:** "Structured outputs are available on every model". The page's supported-model list includes `claude-sonnet-5-5`.
- **Incompatible features:** citations and message prefilling. We use neither.
- **Complexity limits:** at most 24 optional parameters (ours: 0), at most 16 union types (ours: 0), and a 180-second compilation limit. Our schema has no optional parameters, no unions, and four objects.
- **Answers that may not match the schema:**
  - `refusal`: a 200, billed, and the output may not match the schema;
  - `max_tokens`: the output may be incomplete.

  Both are completed streams. `kit.mjs validate` measures them invalid, and they are retried within the caps. The page warns that a schema property asking for step-by-step reasoning can trigger a refusal. Ours asks for "satu kalimat alasan" (one sentence), the short explanation the page recommends.
- **Enum capitalisation may vary.** This affects values with spaces. Our enums are the single letters A–D, so it is a low risk, and `kit.mjs validate` decides in any case.
- **Output limit:** 48,000 is within the model's 128K maximum (models overview, read 17 Nov).
- **Still unproven against the live API:** this is documentation. The first paid call is the first live proof, and S-1 keeps a malformed stream from ever counting as an answer.

### 2 · Allowance, reservation and interrupted streams
- **Allowance:** US$5 less run 1's US$0.129986 = **US$4.87**. The runner's per-provider cap is 4.87, and the console's workspace limit of US$5 sits behind it.
- **Reservation:** unchanged by streaming. US$0.523730 (bab1) and US$0.520808 (bab2) per call; **US$3.133614 for all 6 calls.**
- **An interrupted stream is counted at its full reservation.** It has no trustworthy final usage, so its reservation stands as its cost: scenarios (h) and (h4). The cap check before the next call counts it.

### 3 · Incomplete paid answers are now preserved (`ccc0a285` red, `f9e38d69` fix)
- **Where they go:** a cut or errored stream's partial answer text goes to `<provider>/incomplete/bab<n>.a<k>.partial.txt`, inside PRIVAT on the Mac. Only text-block content is kept; thinking is never kept.
- **The ledger** records the file name, with the text's SHA-256 and length.
- **It never reaches scoring.** It is never an attempt file and never validated. The frozen `kit.mjs blind` reads only the judged files: a self-test runs `blind` on such a run and checks that no partial text reaches what the judges or the key checker see.
- **This changes Sharon's S-1** ("partial text is never assembled"). The owner's instruction overrides it, and Sharon is asked to confirm.

### 4 · Retry rules and untrustworthy usage (`c6cf0fd7` red, `f9e38d69` fix)
- **Retried:** a transport error, a cut stream, a retryable 429, the documented 5xx errors, a mid-stream `overloaded_error`, `api_error` or `timeout_error`, an unparsable 2xx, and an invalid answer.
- **Never retried; the provider stops:** any other error event or HTTP error, and every spend or billing stop.
- **No usable response three times on one request:** the provider stops (N4).
- **A stream is refused as an answer** unless its final usage is trustworthy. Each of these is refused:
  - no final output count;
  - a count that is negative, fractional or not a number;
  - a cumulative count that goes down between `message_delta` events;
  - a final output count below `message_start`'s.
- **Self-test: 204 checks, all passed.**

### 5 · The blinding question: a correction, and for Sharon to resolve
- **My correction.** Ruling 50 (2) says "the weaker one-provider blinding is noted in the results". That plans for Anthropic to be judged on its own, with the weaker blinding disclosed. My v3 report instead said judging must wait for OpenAI. That changed the owner-approved sequence without saying so. **It should have been raised as a conflict, not settled in the package.**
- **The conflict:**
  - Ruling 50 (5) keeps the frozen evaluation unchanged;
  - the frozen `kit.mjs blind` refuses fewer than two providers ("need 2–26 provider folders");
  - so independent Anthropic judging cannot run on the frozen kit as it stands.
- **The options, for Sharon to rule on and the owner to decide:**
  - **A.** Judge Anthropic on its own, with the weaker blinding disclosed, as in Ruling 50. This needs a separate one-provider blinding step outside the frozen kit, built from the same allowlists. That is a change to the evaluation tooling, so it needs Sharon's review and the owner's authorisation.
  - **B.** The owner's fallback: generate Anthropic's questions now, preserve them securely, and **distribute nothing to the judges** until OpenAI's are ready. Then blind both together with the frozen kit, unchanged.
- **v3 fits either.** It generates and preserves only, and sends the judges nothing, so the choice can be made after the run. Today it ends at preservation, which is option B's first half.

### 6 · The judges' introduction (owner clarification, 17 Nov)
- **What the teachers know:** only that they will check some questions. They were not told the questions are AI-generated, nor that two providers are compared.
- **`PANDUAN-JURI.md` had told them both.** It said «disusun dengan bantuan AI», and called the key checker «peninjau AI».
- **Now:**
  - the guide names no source;
  - it describes the key checker only by what it does;
  - the fixed date «Kamis, 19 November» is gone, because judging is not yet scheduled.
- **The rest is unchanged,** including the rule «Jangan memakai alat AI untuk membantu menilai», which says nothing about where the questions come from.
- **The frozen kit's judge sheets were checked:** a blinded dry run's reviewer and key-checker files name no AI, model or provider.
- **`JAWABAN-BILA-DITANYA.md`** is for the owner only. It gives a truthful answer, naming no provider, in case a teacher asks where the questions come from.
- **Daisy wrote the guide's text,** and she reviews these three edits before the guide is used.

### 7 · Mac-specific execution: a free practice run on the owner's Mac
- `zsh jalankan-e.sh --latihan` runs the whole procedure on the Mac itself, with its own tools: the checks, the hidden key prompt (with the dummy text `sk-ant-latihan`), the key check, the run, the scan and the zip.
  - The key check is answered by `latihan-mock.mjs` on 127.0.0.1, which the script starts and stops itself.
  - The run is the offline dry run, through the real streaming code.
  - Results go to `hasil-latihan`.
- **It refuses anything but the dummy text,** so a real key cannot be used by mistake.
- **Rehearsed here:**
  - the practice run;
  - the practice run with a real-looking key, which stopped;
  - a practice run followed by the real procedure in the same folder, which completed;
  - the full rehearsal again: 14 paths, all as expected.
- **The owner runs it before any key exists,** and sends `hasil-latihan/untuk-bob.zip`. Only after that is the paid run requested.
- **Package:** v3, rebuilt on runner `f9e38d69`. SHA-256: `eb701b4afb1c69019e4087424081a79ac9c7143f030a089705c1d7c7ae5f11d0`. It replaces `79226145…` and `1404befb…`, which must not be used.

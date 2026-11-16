# C3 provider runner · dry-run result (16 Nov 2026; no provider called, no credential used)

`runner.mjs` is the provider runner that README.md left unwritten. It was run only offline, against a mock provider.
Every network call is blocked during a dry run and the self-test: `fetch` is replaced by a function that throws, and
the self-test asserts that it was never invoked. A real run refuses to start today (see §5).

> **Later on 16 Nov:** prices are pinned, Google is excluded, and the adapters were checked against the official API
> reference. That update is the section "Adapter verification against official docs, 16 Nov" at the end. §2 and §3
> below record the first dry run (three providers, assumed $15/$75 prices) and are kept as they were run.

The kit itself (`kit.mjs`, the prompt, the schema, the material, `MANIFEST.json`) is unchanged and still frozen.
The runner calls it as a subprocess (`kit.mjs request`, `kit.mjs validate`) and checks every request against
`MANIFEST.json` before use, rather than re-implementing it.

## 1 · Files

| File | Purpose |
|---|---|
| `runner.mjs` | The runner: reservation ledger, caps, retries, mock provider, real adapters (unverified), self-test |
| `prices.json` | Price table per provider (USD per 1M tokens), the caps (8 / 25) and the dry-run assumption. Since the later 16 Nov update: anthropic `claude-sonnet-5-5` and openai `gpt-6.1-sol` pinned at $2 / $10 (grade A); google excluded |
| `out/` | Real-run output: `ledger.json`, `summary.json`, `<provider>/…`. Gitignored |
| `out-dry-run*/` | Dry-run output, kept apart from `out/` because `kit.mjs blind` treats every folder in its input as a provider. Gitignored |

Per provider, the runner writes:
- `bab<n>.json`: the raw response of the judged attempt (the first valid one; with none valid, the last one received), unmodified;
- `bab<n>.provenance.json`: `model`, `model_version`, `model_date`, `request_id`, `attempt`, `prompt_version`,
  `prompt_sha256`, `schema_sha256`, `source`, `source_sha256`, `source_excerpt_sha256` (the material hash),
  `request_sha256`, `response_sha256`, validity, and cost with its basis;
- `attempts/bab<n>.a<k>.json`: every attempt that returned a body, kept;
- `usage.json`: the kit's format, with every provenance field `kit.mjs score` checks, and one row per response.

## 2 · Commands and outputs

All commands are run from `docs/completion-4.1/c3-eval/`.

### `node runner.mjs --self-test` (exit 0)

```
── scenario a-normal (caps: 8.000000 per provider, 25.000000 total)
  invalid_output   anthropic bab1 attempt 1: cost 0.226665 (usage) → retry
  ok               anthropic bab1 attempt 2: cost 0.227190 (usage)
  http_429         anthropic bab2 attempt 1: HTTP 429 → retry
  ok               anthropic bab2 attempt 2: cost 0.222720 (usage)
  transport_error  openai bab1 attempt 1: mock transport error: connection reset → retry
  ok               openai bab1 attempt 2: cost 0.227190 (usage)
  ok               openai bab2 attempt 1: cost 0.222720 (usage)
  ok               google bab1 attempt 1: cost 0.227190 (usage)
  ok               google bab2 attempt 1: cost 0.951795 (no usage → reservation kept)
PASS  (a) completes with exit 0
PASS  (a) no reservation let spend exceed a cap
PASS  (a) all four planted faults were injected
PASS  (a) attempts per provider: anthropic 4, openai 3, google 2 (9 in all)
PASS  (a) malformed → invalid_output, 429 → http_429, transport → transport_error, each retried once
PASS  (a) the response with no usage keeps its reservation as its cost
PASS  (a) a 429 or transport error keeps its reservation as its cost
PASS  (a) every usage-based cost is within its reservation
PASS  (a) 30 valid drafts (2 requests × 15) per provider
PASS  (a) never more than one call in flight
PASS  (a) draft provenance: model, version, request id, prompt version, source excerpt hash; the judged file is the first valid attempt
PASS  (a) the invalid attempt is kept
PASS  (a) usage.json carries every provenance field the kit checks
PASS  (a) kit.mjs blind reads the runner output: 90 items (3 providers × 30)

── scenario b-ceiling-0.05 (caps: 8.000000 per provider, 0.050000 total)
  REFUSED  total: spent 0.000000 + reserved 0.000000 + worst case 0.958950 > total cap 0.050000
PASS  (b) total cap 0.05: aborts with exit 2 on the total cap
PASS  (b) no call made, nothing spent, no reservation above the cap
PASS  (b) the refusal is in the ledger and a summary is written

── scenario b2-ceiling-1.30 (caps: 8.000000 per provider, 1.300000 total)
  invalid_output   anthropic bab1 attempt 1: cost 0.226665 (usage) → retry
  ok               anthropic bab1 attempt 2: cost 0.227190 (usage)
  REFUSED  total: spent 0.453855 + reserved 0.000000 + worst case 0.951795 > total cap 1.300000
PASS  (b2) total cap 1.30: 2 calls, then refused; spend 0.453855 never above the cap

── scenario b3-provider-1.10 (caps: 1.100000 per provider, 25.000000 total)
  invalid_output   anthropic bab1 attempt 1: cost 0.226665 (usage) → retry
  REFUSED  anthropic: spent 0.226665 + reserved 0.000000 + worst case 0.958950 > per-provider cap 1.100000
PASS  (b3) per-provider cap 1.10: one call, then refused on the provider cap

── scenario c-branches (caps: 8.000000 per provider, 25.000000 total)
  http_4xx         anthropic bab1 attempt 1: HTTP 400
  ok               anthropic bab2 attempt 1: cost 0.222720 (usage)
  http_5xx         openai bab1 attempt 1: HTTP 500 → retry
  http_5xx         openai bab1 attempt 2: HTTP 500 → retry
  http_5xx         openai bab1 attempt 3: HTTP 500
  ok               openai bab2 attempt 1: cost 0.222720 (usage)
  ABORT    google bab1 attempt 1: reported cost 2.373600 exceeds its reservation 0.958950
PASS  (c) a 400 is not retried
PASS  (c) three 5xx: retries exhausted at 3 attempts, request failed
PASS  (c) a reported cost above its reservation aborts at once (exit 3), no further call
PASS  a real run refuses: UNVERIFIED prices, unverified adapters, no keys
PASS  no network call was attempted
PASS  plan: worst case with every retry 17.196705 within US$25; per provider 5.732235 within US$8

all passed
```

(The self-test writes to fresh temporary folders; their paths are omitted above.)

### `node runner.mjs --dry-run` (scenario (a), exit 0)

This produces the same nine attempts as the self-test, written to `out-dry-run/`. The ledger, per call:

| # | Provider | Chapter | Attempt | Status | Reserved (USD) | Input tokens | Output tokens | Cost (USD) | Basis |
|---|---|---|---|---|---|---|---|---|---|
| 1 | anthropic | bab1 | 1 | invalid_output (planted: fenced and truncated) | 0.958950 | 2456 | 2531 | 0.226665 | usage |
| 2 | anthropic | bab1 | 2 | ok | 0.958950 | 2456 | 2538 | 0.227190 | usage |
| 3 | anthropic | bab2 | 1 | http_429 (planted) | 0.951795 | — | — | 0.951795 | reservation |
| 4 | anthropic | bab2 | 2 | ok | 0.951795 | 2158 | 2538 | 0.222720 | usage |
| 1 | openai | bab1 | 1 | transport_error (planted) | 0.958950 | — | — | 0.958950 | reservation |
| 2 | openai | bab1 | 2 | ok | 0.958950 | 2456 | 2538 | 0.227190 | usage |
| 3 | openai | bab2 | 1 | ok | 0.951795 | 2158 | 2538 | 0.222720 | usage |
| 1 | google | bab1 | 1 | ok | 0.958950 | 2456 | 2538 | 0.227190 | usage |
| 2 | google | bab2 | 1 | ok, no usage (planted) | 0.951795 | — | — | 0.951795 | reservation |

Summary: anthropic 1.628370, openai 1.408860, google 1.178985; **total 4.216215** (mock tokens at the assumed prices).
There are 30 valid drafts per provider and no open reservation.

### `node runner.mjs --dry-run --scenario ceiling --out out-dry-run-ceiling` (scenario (b), exit 2)

```
REFUSED  total: spent 0.000000 + reserved 0.000000 + worst case 0.958950 > total cap 0.050000
```

The run makes 0 attempts and spends 0. The ledger holds one `refused` entry, and `summary.json` is written.

### `node runner.mjs --plan` (exit 0)

This prints the table in §3.

### `node runner.mjs` (a real run, exit 1)

```
real run refused:
- anthropic: model is UNVERIFIED
- anthropic: model_date is UNVERIFIED
- anthropic: input is UNVERIFIED
- anthropic: output is UNVERIFIED
- anthropic: price source and read_on date not pinned
- anthropic: API adapter not verified against the official documentation
- anthropic: no key in ANTHROPIC_API_KEY
… (the same seven lines for openai and for google)
```

## 3 · Worst-case cost under the assumed prices ($15 input / $75 output per 1M tokens, deliberately high)

The worst case per call is `ceil(ceil(chars / 3) × 1.2) × in_price + max_output × out_price`. Two choices feed it:
- `chars` is the request plus `item-schema.json` (1,852 chars), because the schema is sent, or listed, with the request;
- `max_output` is 12,000 tokens, sent as the hard output cap.

| Chapter | Chars (request + schema) | Input estimate | Input bound (×1.2) | Max output | Worst case per call (USD) |
|---|---|---|---|---|---|
| bab1 | 7,971 + 1,852 = 9,823 | 3,275 | 3,930 | 12,000 | 0.958950 |
| bab2 | 6,779 + 1,852 = 8,631 | 2,877 | 3,453 | 12,000 | 0.951795 |

| | 1 attempt per request (2 calls) | All retries used (6 calls) | Cap |
|---|---|---|---|
| per provider (each of the three) | 1.910745 | **5.732235** | 8.00 |
| **total, three providers** | 5.732235 | **17.196705** | 25.00 |

If every request used all three attempts, every attempt hit the output cap and every input reached its ×1.2 bound,
the run would cost **US$17.20**. That is within both caps, so at these prices the caps never cut the plan short.

For scale only: at the unverified Anthropic hint in `prices.json` ($2/$10), one bab1 call costs at most US$0.128.

## 4 · The in-flight bound and the retry accounting

- **In-flight bound: 1.** Calls are made strictly in sequence (`CONCURRENCY = 1`, one `await` at a time). At most one
  reservation is open at any moment, so the money at risk beyond what is settled is one worst case (≤ US$0.959 at the
  assumed prices). The self-test asserts `max_in_flight = 1`, and at every reservation it asserts that no more than one
  is open.
- **Every attempt is reserved separately** before it is sent. The check counts the spent amount plus open
  reservations plus this worst case, against both the provider cap and the total cap.
- **Retries:**
  - at most 2 per request (3 attempts);
  - made only after a transport error, a 429, a 5xx, or output that `kit.mjs validate` measures invalid (not parsed,
    not 15 items, a top-level problem, or any invalid item);
  - any other 4xx is not retried, and the request is recorded as failed.
- **Settlement:**
  - with usage reported, the cost is the provider's tokens × price, rounded up to the micro-dollar;
  - with no usage (including a 429, a 5xx and a transport error), **the reservation is kept as the cost**. A 429 is
    probably not billed, so this overstates spend. It is conservative on purpose.
- **Overrun:** a reported cost above its reservation means the estimator or the output cap failed. The runner records
  it and aborts at once (exit 3).
- **Persistence:**
  - the ledger is written after every reservation and every settlement;
  - a real run resumes the existing `out/ledger.json`, so spend from earlier runs counts against the caps;
  - a reservation left open by a crash is kept as its cost;
  - requests already valid in the ledger are not repeated;
  - a dry run always starts a fresh ledger.
- **Caps** come from `prices.json`. They are refused if set above 8 / 25. `--cap-provider` and `--cap-total` can only
  lower them.
- **Exit codes:**
  - 0: complete;
  - 1: configuration error or a real run refused;
  - 2: a cap refusal;
  - 3: an overrun;
  - 4: complete, but a request failed after its attempts.

## 5 · What the dry run does NOT prove

- **Real provider usage reporting.** The mock invents token counts. Whether each provider returns usage, in the fields
  the adapter reads, is not tested:
  - output counted with any reasoning or "thinking" tokens;
  - cached-input discounts;
  - the request id header.
- **Provider-side limits and behaviour:**
  - that each API honours the output cap exactly;
  - rate limits, timeouts, and whether a 429 or a dropped connection is billed;
  - structured-output support;
  - the provider-side spend cap on each key (P5).
- **The adapters.** The three real adapters (endpoint, headers, output-cap and structured-output parameters) were
  written without network access or the official documentation. They are marked `verified: false`, and a real run
  refuses until each is checked against the official SDK documentation (README: "written … against each provider's
  official SDK documentation"). *Later on 16 Nov:* the anthropic and openai adapters were checked against
  E-PROVIDER-FACTS.md §6 and corrected; both stay `verified: false` for the fields listed in the last section.
- **Official prices.** Every price is `UNVERIFIED`. The $15/$75 figures are an assumption, not a quote. The cost
  figures above are worst-case bounds under that assumption, not estimates of the real bill. *Later on 16 Nov:* the two
  prices were pinned at $2 / $10 (grade A); see the last section for the worst case at those prices.
- **The input estimator** (chars ÷ 3, then ×1.2) is assumed conservative for Indonesian text. A real tokenizer could
  count more. The runner detects that only after the call (the overrun abort), so one call could exceed its
  reservation by the excess.
- **The educational quality** of anything: the mock's items are placeholders, and validity here is only the kit's
  structural check.

## Addition, 16 Nov (owner's cost-evidence list)

Each ledger attempt now also records `duration_ms` (the provider's response time, measured around the call) and
`rate_limit` (whatever rate-limit information the adapter returns from the response or the error; `null` until the
adapters are verified against official documentation). With the existing fields, the ledger supports cost per attempt,
per valid draft and (with the judges' results) per accepted draft, tokens, retry and failure rates, response times and
rate limits. Self-test re-run: all passed. Scoring is unchanged.

## Adapter verification against official docs, 16 Nov

**No provider API was called, no key was created or used, nothing was spent, no material was sent.** The source is
`docs/completion-4.1/E-PROVIDER-FACTS.md` (branch `claude/e-provider-facts`, `82f4a43b`): §1b and §2b for prices, §6 for
the API reference, as corrected after Sharon's review (`291c5ab7`). The adapters were compared field by field with §6,
mismatches fixed, and the comparison turned into offline self-test assertions.

### What changed

- **Prices pinned** (`prices.json`): anthropic `claude-sonnet-5-5` and openai `gpt-6.1-sol`, each $2 input / $10 output
  per 1M tokens, grade A, read 2026-11-16, with the pricing and model page URLs. OpenAI's surcharge above 272K input
  tokens (2× input, 1.5× output for the full request) is recorded and applied by `costMicro` if ever reached. E never
  reaches it: the largest input bound is 3,930 tokens. `model_date` reads "undated alias, ID read 2026-11-16": neither
  provider's ID is a dated snapshot in §1a or §2a. The model version actually served is recorded per response.
  Caps unchanged: US$8 per provider, US$25 total.
- **Google excluded.** It is out of the default provider set (`enabled: false`, `excluded` with the reason:
  Service Specific Terms §20(d), the owner's decision). The runner refuses `--providers google` in every mode, and the
  real-run gate refuses it even with a key. The adapter code is kept, unchanged.
- **Spend and billing stops.** Both providers use 429 for spend stops as well as rate limits (§6, "For the adapters").
  Errors are now classified by status and error code. A stop is never retried, and no further call goes to that
  provider. The rest of its requests are recorded as failed (`not_attempted`), and the run ends with exit 4.
- **New dry-run option** `--real-prices` (for `--plan` and `--dry-run`): the pinned prices with the offline mock.

### The comparison

| Field | Adapter before | §6 fact (grade) | Adapter now |
|---|---|---|---|
| **anthropic** endpoint | `POST https://api.anthropic.com/v1/messages` | same (A) | unchanged |
| auth header | `x-api-key: <key>` | `Authorization: Bearer <key>`; `x-api-key` is the "Legacy fallback" (A) | **fixed:** `Authorization: Bearer` |
| version header | `anthropic-version: 2023-06-01` | current `2026-10-21` (A value; "required" is B, so it is always sent) | **fixed:** `2026-10-21` |
| content-type | `application/json` | same (A) | unchanged |
| user prompt | `messages: [{role: "user", content}]` | `messages`, each with `role` and `content` (A) | unchanged |
| system prompt | none | `system` is optional (A) | none (as in usage.json: `system_prompt: ''`) |
| max output | `max_tokens` | `max_tokens` (A) | unchanged |
| structured output | **none sent** | `output_config.format = {type: "json_schema", schema}` (A) | **fixed:** sent, with `item-schema.json` |
| usage | `input_tokens`, `output_tokens` | total input = `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`; `output_tokens` is the billing total (A) | **fixed:** the three input fields summed |
| request id | header `request-id`, else the message `id` | header `request-id`; error bodies carry `request_id` (A) | **fixed:** header only on success (the message id is not the request id); header, else body `request_id`, on errors |
| rate-limit info | none | `anthropic-ratelimit-*` and `retry-after` (A) | **fixed:** those headers kept, nothing else |
| 429 rate limit / ramp | retried | `rate_limit_error` with `retry-after`; `ramp_limit_exceeded` (A) | retried |
| 429 tier spend cap | **retried** | `enforced_spend_limit_reached`, no `retry-after`, retries fail (A) | **fixed:** `spend_stop`. A 429 with neither `retry-after` nor a rate-limit code also stops (fails closed) |
| 400 own spend limit | not retried, but later chapters still called | 400 "You have reached your specified (workspace) API usage limits" (A) | **fixed:** `spend_stop`; other 400s: `http_4xx`, not retried |
| credit exhaustion | not retried (generic 4xx) | 402 `billing_error`; no credit-specific error found (**B**) | `billing_stop` (fails closed) |
| 5xx | retried | 500 `api_error`, 504 `timeout_error`, 529 `overloaded_error` (A) | retried |
| response text | `content[]` of type `text` | **not in §6a** | unchanged, **unverified** |
| **openai** endpoint | `POST /v1/chat/completions` | the documented route is `POST https://api.openai.com/v1/responses` (A) | **fixed:** Responses API |
| auth header | `Authorization: Bearer` | same (A) | unchanged |
| version header | none | none required; path-versioned `v1` (A) | unchanged |
| content-type | `application/json` | **not stated in §6b** | unchanged, **unverified** |
| client request id | none | optional `X-Client-Request-Id`, ASCII ≤512, logged for lookup (A) | **added:** one per attempt, also in the ledger |
| user prompt | `messages: [{role: "user"}]` | `input` (string or messages) (A) | **fixed:** `input` |
| system prompt | none | `instructions` is optional (A) | none |
| max output | `max_completion_tokens` | `max_output_tokens`, includes reasoning tokens, min 16 (A) | **fixed:** `max_output_tokens` |
| structured output | `response_format.json_schema{name, strict, schema}` | `text.format = {type: "json_schema", name, schema, strict: true}` (A) | **fixed:** `text.format` |
| storage | not set (default true) | `store` defaults to true; set false (A) | **added:** `store: false` |
| usage | `prompt_tokens`, `completion_tokens` | `input_tokens`, `input_tokens_details.{cached_tokens, cache_write_tokens}`, `output_tokens`, `output_tokens_details.reasoning_tokens` (A); whether the totals include the details is not stated | **fixed:** settled at an upper bound that holds either way: input + cache details; output + reasoning, capped at `max_output_tokens`. The raw usage is kept in the ledger (`usage_raw`) |
| request id | header `x-request-id`, else the response `id` | header `x-request-id` (A) | **fixed:** header only |
| rate-limit info | none | `x-ratelimit-*` (incl. project-tokens), `Retry-After` (A) | **fixed:** those headers kept |
| 429 rate limit / slow_down | retried | 429 "Rate limit reached for requests", `slow_down` (A) | retried |
| 429 spend / usage limit | **retried** | `organization_spend_limit_exceeded`, `project_spend_limit_exceeded`, `organization_usage_limit_exceeded`, type `insufficient_quota`; retrying "won't restore API access" (A) | **fixed:** `spend_stop` |
| 429 credit exhausted | **retried** | `credit_balance_exhausted` (A) | **fixed:** `billing_stop` |
| 5xx | retried | 500; 503 `service_unavailable_error` / `server_is_overloaded` (A) | retried |
| 400 | not retried | documented only for a bad `X-Client-Request-Id` | not retried (fails closed) |
| response text | `choices[0].message.content` | **not in §6b** | `output[]` items of type `message`, parts of type `output_text`; **unverified** |

`model_version` (the response's `model` field) is not in §6 for either provider. It is provenance only, and nothing
depends on it.

### Verdict: both adapters stay `verified: false`

*Superseded by "Re-check against §6c, 16 Nov" below: openai is now verified; anthropic is not.*

The rule: `verified: true` only if every field the adapter depends on rests on a grade-A fact.

| Adapter | Fields without a grade-A fact |
|---|---|
| anthropic | (1) **response text location**: the text is read from `content[]` blocks of type `text`; §6a documents no response-content field. (2) **credit exhaustion**: 402 `billing_error` is grade B. The adapter treats it as a stop, so this one fails closed |
| openai | (1) **response text location**: read from `output[]` → `content[]` parts of type `output_text`; §6b documents no response-content field. (2) **`content-type: application/json`** request header: not stated in §6b |

Closing them needs one more documentation read, not an API call: the response-body shape of `POST /v1/messages` and
`POST /v1/responses` (the reference pages already cited in §6), Anthropic's error for an exhausted credit balance, and
OpenAI's request content type. Two residual risks are outside the field list:
- **The schema subset.** Anthropic supports only a "subset of the JSON Schema language". OpenAI's strict mode has
  its own rules. `item-schema.json` uses `type`, `required`, `enum` and `additionalProperties: false` (every property
  required), plus `$schema`, `title` and `description` at the root. Whether each provider accepts it is not in §6. A
  rejection would be a 400: not retried, and bounded by one reservation (≤ US$0.128).
- **No idempotency key** at either provider (§6). Each retry is a separate reservation, kept as its cost when no usage
  comes back, so a double charge stays inside the caps.

### `node runner.mjs --self-test` (exit 0, 78 PASS, 0 FAIL)

Scenarios (a), (b), (b2), (b3) and (c) are as before, for the two providers (7 attempts in scenario (a); `kit.mjs blind`
reads 60 items). New:

```
── scenario d-spend-stops (caps: 8.000000 per provider, 25.000000 total)
  spend_stop       anthropic bab1 attempt 1: HTTP 429 enforced_spend_limit_reached → no further call to anthropic
  ok               openai bab1 attempt 1: cost 0.227190 (usage)
  spend_stop       openai bab2 attempt 1: HTTP 429 organization_spend_limit_exceeded → no further call to openai
PASS  (d) anthropic tier spend cap (429 enforced_spend_limit_reached): one attempt, not retried, bab2 not attempted
PASS  (d) openai spend limit (429 organization_spend_limit_exceeded) on bab2: not retried; bab1 unaffected
PASS  (d) the run ends with exit 4 and names the three failed requests and the stop
PASS  (d) a stop keeps its reservation as its cost and records its request id and error code
```

Adapter checks, offline, with the key `DUMMY-KEY-PLACEHOLDER`, for the bab1 request:
- **Request:** the URL, method, the exact header set, and the exact body keys and values (above) for each adapter.
- **Wire path:** `httpCall` is given a local function in place of `fetch`. It answers from memory. The check asserts
  that exactly the built request is sent and the response parsed. Global `fetch` stays blocked throughout.
- **Response:** a canned response shaped as §6 documents it. Usage is extracted (anthropic input 2,415 = 2,400 + 10 + 5;
  openai output bound 2,900, and never above 12,000), as are the request id from the header (not the message or
  response id) and only the documented rate-limit headers.
- **Errors:** every documented error maps to its class.
  - anthropic: 429 with `retry-after` and 429 `ramp_limit_exceeded` are retried; 429 `enforced_spend_limit_reached`
    and a bare 429 are `spend_stop`; the two 400 spend-limit messages are `spend_stop`; another 400 is `http_4xx`;
    402 is `billing_stop`; 500, 504 and 529 are retried.
  - openai: 429 rate limit and `slow_down` are retried; the three spend and usage codes and `insufficient_quota` are
    `spend_stop`; `credit_balance_exhausted` is `billing_stop`; 500 and 503 are retried; 400 is not.
- **Surcharge:** at 272,001 input tokens the full request costs 2× input and 1.5× output.

The gate:

```
PASS  a real run refuses without keys
PASS  prices, model IDs and sources are pinned for anthropic and openai (grade A, read 2026-11-16)
PASS  with keys present, a real run still refuses while an adapter is unverified (anthropic, openai)
PASS  google is refused as excluded, even with a key
PASS  no network call was attempted
PASS  plan at the assumed $15/$75: worst case with every retry 11.464470 within US$25; per provider 5.732235 within US$8
PASS  plan at the pinned $2/$10: worst case with every retry 1.528596 (per provider 0.764298)

all passed (temporary folders removed)
```

### Worst case at the pinned prices: `node runner.mjs --plan --real-prices` (exit 0)

`ceil(ceil(chars / 3) × 1.2) × $2/M + 12,000 × $10/M` per call:

| Provider | Chapter | Chars (request + schema) | Input estimate | Input bound (×1.2) | Max output | Worst case per call (USD) |
|---|---|---|---|---|---|---|
| anthropic | bab1 | 9,823 | 3,275 | 3,930 | 12,000 | 0.127860 |
| anthropic | bab2 | 8,631 | 2,877 | 3,453 | 12,000 | 0.126906 |
| openai | bab1 | 9,823 | 3,275 | 3,930 | 12,000 | 0.127860 |
| openai | bab2 | 8,631 | 2,877 | 3,453 | 12,000 | 0.126906 |

| | 1 attempt per request (2 calls) | All retries used (6 calls) | Cap |
|---|---|---|---|
| anthropic | 0.254766 | **0.764298** | 8.00 |
| openai | 0.254766 | **0.764298** | 8.00 |
| **total, two providers** | 0.509532 | **1.528596** | 25.00 |

With every attempt at its output cap and every input at its bound, the run costs at most **US$1.53**. That is about
19% of one provider cap and 6% of the total cap.

### `node runner.mjs --dry-run --real-prices` (scenario (a) at $2/$10, exit 0)

| Provider | Chapter | Attempt | Status | Reserved (USD) | Input tokens | Output tokens | Cost (USD) | Basis |
|---|---|---|---|---|---|---|---|---|
| anthropic | bab1 | 1 | invalid_output (planted) | 0.127860 | 2456 | 2531 | 0.030222 | usage |
| anthropic | bab1 | 2 | ok | 0.127860 | 2456 | 2538 | 0.030292 | usage |
| anthropic | bab2 | 1 | http_429 (planted) | 0.126906 | — | — | 0.126906 | reservation |
| anthropic | bab2 | 2 | ok | 0.126906 | 2158 | 2538 | 0.029696 | usage |
| openai | bab1 | 1 | transport_error (planted) | 0.127860 | — | — | 0.127860 | reservation |
| openai | bab1 | 2 | ok | 0.127860 | 2456 | 2538 | 0.030292 | usage |
| openai | bab2 | 1 | ok, no usage (planted) | 0.126906 | — | — | 0.126906 | reservation |

Summary: anthropic 0.217116, openai 0.285058; **total 0.502174** (mock tokens; the faults keep three reservations as
cost). There are 30 valid drafts per provider and no open reservation. `out-dry-run/` was deleted afterwards.

### `node runner.mjs` (a real run, exit 1), with and without keys

```
real run refused:
- anthropic: API adapter not verified against the official documentation; no grade-A fact for: response text location, credit exhaustion
- anthropic: no key in ANTHROPIC_API_KEY
- openai: API adapter not verified against the official documentation; no grade-A fact for: response text location, content-type
- openai: no key in OPENAI_API_KEY
```

With `DUMMY-KEY-PLACEHOLDER` in both key variables, the two "no key" lines go and the run is still refused.
`node runner.mjs --providers google` exits 1: "google is excluded: Not eligible …".

### Addition, 16 Nov: a required `--live` flag, and the served model version

A real run now needs **both** `node runner.mjs --live` **and** a passing gate. Without `--live`, `node runner.mjs`
exits 1, and the first refusal line names the flag: "no --live flag: a real run starts only with node runner.mjs
--live, and only when every check below passes". With `--live` it is still refused today, with or without keys,
because both adapters are unverified. `--live` cannot be combined with `--self-test`, `--dry-run` or `--plan`. The
model version string each response reports is recorded per attempt (ledger `model_version`, and now also in each
`usage.json` call row), and the judged attempt's version is in `bab<n>.provenance.json`. Next to the `model_date`
label "undated alias, ID read 2026-11-16", this captures the version actually served. Self-test re-run: exit 0,
**83 PASS, 0 FAIL**. New checks: the model version is recorded; with dummy keys and adapters marked verified through a
test-only override, a run without `--live` is refused; `--live` with the real, unverified adapters is refused; and only
`--live` with keys and verified adapters gets through the gate. No network call was attempted.

### Re-check against §6c, 16 Nov

§6c (`claude/e-provider-facts` at `08e3221d`) documents the response shape, the structured-output schema rules and the
token totals. The open fields were re-checked against it. **No API was called.**

| Open field | §6c | Result |
|---|---|---|
| anthropic response text | `content[]`, select `type == "text"`, read `text`; the JSON is a string there (A) | matches; **closed** |
| anthropic credit exhaustion | nothing new; 402 `billing_error` stays B | **still open** (fails closed: a stop) |
| openai response text | `output[]` items of `type: "message"`, `content[]` parts of `type: "output_text"` with `text` (A); top-level `output_text` is SDK-only | matches; **closed**. A `refusal` part is now recorded |
| openai `Content-Type` | in every reference example (A); "required" is B, but it is always sent | **closed** |
| anthropic tokens | `input_tokens` excludes cache tokens; `output_tokens` includes thinking (A) | unchanged: the three input fields summed, output as is |
| openai tokens | `input_tokens` **includes** cached and cache-write (A); `reasoning_tokens` within `output_tokens` is B | **fixed:** input = `input_tokens` (the cache details were being added); output keeps the bound `min(max_output, output + reasoning)` |

**The schema.** Every validating keyword in `item-schema.json` is documented as supported by both providers: `type`,
`properties`, `items`, `required` (every property, so 0 optional parameters), `additionalProperties: false` on all four
objects, and string-only `enum`. The root is an object with no `anyOf`. No count, length or number constraint and no
composition is used. Only the root annotations `$schema`, `title` and `description` are undocumented (§6c, B). They do
not validate, so the adapters now send the schema **without those three keys**. Everything else is byte-for-byte the
frozen schema, and `item-schema.json` is unchanged. `kit.mjs validate` still checks every response in full. Provenance
records both the kit's `schema_sha256` and `schema_sent_sha256` with the omitted keys. **No incompatibility was
found.** One caveat: Anthropic does not guarantee the case of `enum` values. A lower-case label would be measured
invalid by the frozen validator and retried; the raw response is never altered.

**Also tightened:** only the documented server errors are retried (anthropic 500, 504 and 529; openai 500 and 503). Any
other 5xx is not retried, so it fails closed.

**Verdict:**
- **openai: `verified: true`.** Every relied-on field is grade A.
- **anthropic: `verified: false`.** Credit exhaustion is the only field without a grade-A fact.

The default run (both providers) is still refused. `--live --providers openai` with a key would pass the gate; the
self-test checks this in memory only. Self-test: exit 0, **93 PASS, 0 FAIL**, no network.

```
real run refused:
- no --live flag: a real run starts only with node runner.mjs --live, and only when every check below passes
- anthropic: API adapter not verified against the official documentation; no grade-A fact for: credit exhaustion
- anthropic: no key in ANTHROPIC_API_KEY
- openai: no key in OPENAI_API_KEY
```

The worst case is unchanged: 0.764298 per provider, 1.528596 in total. The plan still counts the full schema's
1,852 characters, more than is sent.

**Addition, 16 Nov (Sharon's note N2, `E-RUNNER-4a591fa3.md`):** the Google adapter was deleted, together with its self-test case. It had been written without documentation, and Google is ineligible. Google remains in `prices.json` only as an excluded entry with the §20(d) reason, and `--providers google` is still refused with that reason in every mode. Self-test re-run: exit 0, **93 PASS, 0 FAIL**, no network. The old Google check was replaced by "google: no adapter; refused with the §20(d) reason from prices.json".

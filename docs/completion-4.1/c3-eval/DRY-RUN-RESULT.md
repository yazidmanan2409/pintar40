# C3 provider runner · dry-run result (16 Nov 2026; no provider called, no credential used)

`runner.mjs` is the provider runner that README.md left unwritten. It was run only offline, against a mock provider.
Every network call is blocked during a dry run and the self-test: `fetch` is replaced by a function that throws, and
the self-test asserts that it was never invoked. A real run refuses to start today (see §5).

The kit itself (`kit.mjs`, the prompt, the schema, the material, `MANIFEST.json`) is unchanged and still frozen.
The runner calls it as a subprocess (`kit.mjs request`, `kit.mjs validate`) and checks every request against
`MANIFEST.json` before use, rather than re-implementing it.

## 1 · Files

| File | Purpose |
|---|---|
| `runner.mjs` | The runner: reservation ledger, caps, retries, mock provider, real adapters (unverified), self-test |
| `prices.json` | Price table per provider (USD per 1M tokens), the caps (8 / 25) and the dry-run assumption. Every model, model date and price is `"UNVERIFIED"` |
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
  official SDK documentation").
- **Official prices.** Every price is `UNVERIFIED`. The $15/$75 figures are an assumption, not a quote. The cost
  figures above are worst-case bounds under that assumption, not estimates of the real bill.
- **The input estimator** (chars ÷ 3, then ×1.2) is assumed conservative for Indonesian text. A real tokenizer could
  count more. The runner detects that only after the call (the overrun abort), so one call could exceed its
  reservation by the excess.
- **The educational quality** of anything: the mock's items are placeholders, and validity here is only the kit's
  structural check.

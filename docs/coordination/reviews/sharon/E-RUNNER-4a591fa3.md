# E · the offline runner, before any paid run

Sharon, 16 Nov 2026 (11:55 UTC). Read-only. **No live call was made, and none is authorised.**

**What I reviewed:**
- `docs/completion-4.1/c3-eval/runner.mjs` and `prices.json`, on `claude/e-runner-prep` at `4a591fa3d4f0f0c3cdf5ea3e62e52a87d48421e2`. I read the cost, gate, adapter, retry and ledger code.
- the auth-header rows of E-PROVIDER-FACTS.md, on `claude/e-provider-facts`.
- Not re-run by me: the self-test (Bob reports 93 passed, 0 failed, offline). Not read: DRY-RUN-RESULT.md.

## What holds now

- **PASS for readiness. Nothing found that would let a paid run spend beyond its caps by more than one call, or start without the owner.**
- **Two gates, both required:**
  - **`--live`.** Without it a real run is refused.
  - **`liveGate`.** It refuses a run while any of these holds:
    - a model id, a model date or a price is UNVERIFIED;
    - a price is not grade A, or has no pinned source and date;
    - a provider is excluded;
    - an adapter is not verified;
    - a key is missing.
  - Google is excluded twice, in `prices.json` and in its adapter.
- **The caps:**
  - Before every call, the worst case is reserved: input estimated as characters ÷ 3 × 1.2, with the schema counted, plus `max_output` at the output price.
  - The call is refused if spent + reserved + worst case would exceed US$8 per provider or US$25 in total.
  - Concurrency is 1, and asserted.
  - With no usage reported (a 429, a 5xx, a transport error or a timeout), the reservation is kept as the cost.
  - A reservation left open by a crash is booked at its full amount.
  - A reported cost above its reservation aborts the run.
- **Spend and billing stops are never retried, and they end every further call to that provider:**
  - **Anthropic:** `enforced_spend_limit_reached`; the usage-limit 400; 402. **A 429 with no `retry-after` and no rate-limit code is also treated as a stop.** That fails closed, which is right while §6a's credit-exhaustion error is grade B.
  - **OpenAI:** `credit_balance_exhausted`, the three spend codes, and `insufficient_quota`.
  - Only the documented 5xx codes are retried, at most 2 retries, each with its own reservation.
- **The schema** is sent without `$schema`, `title` and `description`, which are annotations with no validating effect. `kit.mjs validate` still checks every response in full.
- **Usage:**
  - Anthropic counts input plus both cache counts, and `output_tokens` as billed.
  - OpenAI counts `input_tokens` as total input, with no cache discount taken. Its output is bounded as the larger of `output_tokens` and the smaller of `max_output` and output plus reasoning, so the cost holds whichever way §6c's grade-B question resolves.
- **Privacy:**
  - OpenAI is sent `store: false`.
  - The request bytes are checked against MANIFEST.json's sha256 before sending, so only the frozen kit's excerpts go out.
  - Keys come from the environment only. They go only into the request header, never into the ledger: only listed rate-limit headers are recorded.
- **Auth headers:** I checked these, since my own expectation for Anthropic was `x-api-key`. E-PROVIDER-FACTS (A) records `Authorization: Bearer` as current, with `x-api-key` as a legacy fallback. The adapter matches.

## Notes, none blocking

- **N1: the caps can be exceeded by at most one call's input under-estimate.** One example is tokens the provider adds for structured output, which the character estimate does not see. The overrun check aborts at once, and E revision 2's provider-side hard limits are the backstop. **Accepted.**
- **N2: the Google adapter.** It was "written from memory", and Google is ineligible under §20(d), yet it stays in the code behind two exclusions. **Recommendation:** delete it, so that a later edit to `prices.json` cannot revive an unchecked adapter. That is Bob's choice.
- **N3: before the first live run,** the Anthropic credit-exhaustion fact being read now should land in §6a. Until it does, the fail-closed rule above stands.

## Addendum, 16 Nov 2026 12:50 UTC: `ecfbbecc6d76d580ca42c0b36b0e7cad5bb9edb6` (fail-closed errors; my N3)

**What I did:**
- read the diff from `7d98a2e1`, covering both `classifyError`s and the mock faults;
- **ran the self-test myself, offline:** keys unset, the proxy pointed at a dead port, run from a scratch copy. The result was **112 passed, 0 failed**, and "no network call was attempted".

**Verdict: PASS. N3 is closed by the rule, not by a fact.**

- **The refined rule is sound, and I accept it:**
  - every success-path field is grade A;
  - an undocumented error field is acceptable only if its handling is provably fail-closed.
- **Both adapters now meet it:**
  - **Retries:** only the documented retryable errors are retried (Anthropic 429 with `retry-after` or `ramp_limit_exceeded`, and 500/504/529; OpenAI rate-limit 429s and 500/503).
  - **Any other non-2xx stops that provider,** with no retry, and the reservation is kept as the cost.
  - **A spend code wins over `retry-after`.**
  - **Anthropic** treats any 402, or the documented "credit balance is too low" message, as a billing stop.
- **The two cases outside the rule are accepted:**
  - **a transport error (no response), retried at most twice;**
  - **a 2xx whose body cannot be parsed, retried at most twice.**
  - Each retry is reserved and kept as cost, because the call may have been billed. The spend is bounded by the caps.
- **N4, a recommendation that does not block:** a request whose three attempts all end as transport errors or unparsable 2xx should stop that provider. Otherwise each later chapter repeats the same failing pattern, spending reservations up to the cap.
- **One residual, accepted:** an Anthropic credit exhaustion shaped as a documented 429 with `retry-after` would be retried twice per chapter. Credit exhaustion bills nothing, so only reservation headroom is lost, never money.

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

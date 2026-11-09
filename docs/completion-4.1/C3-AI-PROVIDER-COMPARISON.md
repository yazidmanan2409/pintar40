# C3 · AI-assisted question generation: provider comparison (9 Nov 2026, for the owner's selection)

**The owner's decision:** O41-1, provider selection and new external cost. **Not decided here.**

**Already ruled (owner, 9 Nov):**
- AI-drafted questions enter official assessments only through the normal educator review, approval and publication
  safeguards.
- Provenance (model, source material) is kept.

**The workload:**
- An educator supplies or selects source text, a lesson or chapter in Indonesian. The model drafts multiple-choice items
  in Indonesian: a stem, four options, the key, a short reason per distractor (its misconception), and the target
  objective.
- Volume is small: a few hundred drafts per school per term. Cost is dominated by input (source text) rather than
  output.
- No learner data is sent, only educator-supplied content.

**How reliable the figures are:**
- **Anthropic's** come from its current first-party model and price list (cached 6 Oct 2026).
- **OpenAI's and Google's** come from one search on 9 Nov. The sources disagree and are mostly third-party, so every
  such figure is marked **to confirm on the official page before selection**.

## 1 · The comparison

| | **Anthropic (Claude API)** | **OpenAI API** | **Google (Gemini API, paid tier)** |
|---|---|---|---|
| **Candidate models** | Claude Sonnet 5.5 (quality/cost balance); Claude Haiku 5.5 (cheapest); Claude Opus 5.5 (highest quality) | the current GPT flagship and its smaller tiers (names and lineup to confirm) | Gemini Flash and Pro tiers (lineup to confirm) |
| **Price per 1M tokens (input / output)** | Sonnet 5.5 **$2 / $10**; Haiku 5.5 **$0.10 / $0.50** (≤100K-token prompts); Opus 5.5 **$4 / $20**. Cached input much cheaper; the Batch API halves the price | third-party reports range roughly $1–$10 input / $6–$50 output by tier (**to confirm**) | third-party reports roughly $0.75–$1.50 input / $3.75–$10 output for Flash/Pro (**to confirm**; Google lists price rises on 1 Jan 2027) |
| **Estimated cost at PINTAR's volume** | e.g. 500 drafts × (3K input + 1K output tokens) on Sonnet 5.5 ≈ **$8 per school per term**; on Haiku 5.5 well under $1 | same order of magnitude (to confirm) | same order of magnitude (to confirm) |
| **Context window** | 1M tokens (Sonnet/Haiku/Opus 5.5): a whole chapter fits | to confirm | to confirm |
| **Training on API data** | commercial API inputs are not used for training by default (confirm in the contract) | API data reported not used for training unless the organisation opts in (to confirm) | paid-tier prompts and responses are not used to improve Google products (official billing docs) |
| **Retention / zero retention** | standard retention; zero data retention by agreement (not for Claude Fable 5.1); confirm the terms | reported 30-day default, with zero retention by enterprise agreement (to confirm) | per Google's paid-services terms (to confirm) |
| **Structured output** (a schema for item, options, key, distractor reasons) | native structured outputs (a JSON schema enforced) | supported (to confirm specifics) | supported (to confirm specifics) |
| **Data region** | inference geography selectable on current models; also via AWS, Google Cloud or Microsoft Foundry | regional options per agreement (to confirm) | Vertex AI regions (to confirm) |
| **Operational requirements** | an API key held server-side only (a network secret, never in the browser); usage-based billing; rate limits by tier; a monthly spend limit settable in the Console | the same shape | the same shape; billing must be enabled for the paid tier's data terms |
| **Fit with PINTAR's stack** | an official TypeScript SDK (`@anthropic-ai/sdk`); the app is Next.js/TypeScript | an official TypeScript SDK | an official SDK |

## 2 · What matters most for this decision

1. **Quality in Indonesian school content.**
   - This is the deciding factor, and no price table shows it.
   - **Recommendation:** before selection, run a small blind evaluation with Sharon (item quality, key correctness,
     distractor plausibility) and Daisy (language). Use about 30 drafts from two real chapters per candidate, scored
     against a rubric.
   - Cost: a few dollars per provider. It needs the owner's approval for the external calls.
2. **Privacy.**
   - All three providers state that paid API data is not used for training.
   - PINTAR sends **no learner data**, only educator-supplied source material. That keeps the privacy exposure small
     with any of them.
   - The binding terms are the contract's, not this table's.
3. **Cost.** At PINTAR's volume, cost is small with every provider. It should not decide the choice.
4. **Operations.**
   - Each needs a server-side key, a spend cap and network egress to one host.
   - Under the environment rules, a key is supplied as a network secret and never committed.

## 3 · Recommendation (for the owner's decision)

- **Claude Sonnet 5.5** via the Anthropic API:
  - native structured outputs;
  - a 1M context for whole chapters;
  - the official TypeScript SDK matching PINTAR's stack;
  - a predictable small cost (Haiku 5.5 as a fallback for cost).
- **Subject to the blind evaluation above.** If another provider scores clearly better on Indonesian item quality,
  choose it.
- **Owner approval needed for:**
  - the evaluation's external calls;
  - the provider account and its data terms;
  - a monthly spend cap (suggested: USD 50 for the testing period);
  - the API key, provisioned as a network secret.

## Sources (searched 9 Nov 2026; third-party figures to confirm)

- [OpenAI API pricing (developers.openai.com)](https://developers.openai.com/api/docs/pricing.md) · [CIO Dive on OpenAI API data use](https://www.ciodive.com/news/OpenAI-ChatGPT-Whisper-API-data-privacy/643921/) · [Finout: OpenAI pricing 2026](https://finout.io/blog/openai-pricing-in-2026) · [CloudZero: OpenAI API pricing](https://www.cloudzero.com/blog/openai-api-pricing/)
- [Gemini API pricing (ai.google.dev)](https://ai.google.dev/gemini-api/docs/pricing) · [Gemini API billing (ai.google.dev)](https://ai.google.dev/gemini-api/docs/billing?authuser=1) · [Opslyft: Gemini API pricing 2026](https://www.opslyft.com/blog/google-gemini-api-pricing-2026) · [CloudZero: Gemini pricing](https://www.cloudzero.com/blog/gemini-pricing/)
- Anthropic: the current first-party model and price list (Claude API).

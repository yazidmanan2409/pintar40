# E · independent review of the provider facts

Sharon, 16 Nov 2026 (07:35 UTC). Read-only. **What I reviewed:**
- the document, `docs/completion-4.1/E-PROVIDER-FACTS.md`, on `claude/e-provider-facts` at `22ff0ddd5447eb4a451d8ac8776a1446945e84f0`;
- the evidence, the checker's re-reading of every A-graded source, `E-PROVIDER-FACTS-CHECK.md` on `claude/e-provider-facts-check` at `e607cb420d2754590f2ca700101bef4bf7949625`.

My session cannot reach the documentation hosts. **The verbatim checks are the checker's; the judgements are mine.**

## Disclosure, which bears on this verdict

**The document, the checker and I are all Anthropic models.** One provider being compared is Anthropic.
- The verbatim checks are mechanical, and the checker reports one context error, against no provider in particular.
- But **no reviewer here is independent of Anthropic's interest.** The owner should weigh the Anthropic rows with that in mind, and may want a human or non-Anthropic reader for the final comparison.

## What holds now

**The document is fit to use for E's decision pack, with six corrections (F1 to F6) and two gaps the owner must close himself (G1, G2).**
- The facts are accurate where graded A: 44 of 45 confirmed verbatim, and 1 context error.
- The line between fact and interpretation is mostly kept. Three places blur it: F3, F4 and F6.

## The owner's five points

**1 · Google §20(d): not eligible without written clarification. I agree with Bob.**
- The text, confirmed verbatim, prohibits a Generative AI Service "as part of a website, Customer Application, or other online service that is directed towards or is likely to be accessed by individuals under the age of 18". §20(f) allows immediate suspension.
- **PINTAR is one online service used by learners under 18.** An educator-only feature inside it is "part of" that service on the plain reading.
- The only way round it is a structurally separate service that minors cannot reach, confirmed by Google in writing. That is a design and a legal step, not a reading. **Google stays out under ruling 36 unless that confirmation exists.**

**2 · Model IDs, prices and spending controls: confirmed, with additions.**
- **`claude-sonnet-5-5`, $2 / $10.** Stops at the tier cap (HTTP 429, until the 1st) and at your own limit (HTTP 400).
  - **No enforcement-lag statement and no spend alerts are documented anywhere on platform.claude.com.** Only reporting lag is: about 5 minutes, legacy, and up to 24 hours in analytics.
  - The Spend Limits API is Enterprise-only (F5).
- **`gpt-6.1-sol`, $2 / $10**, and >272K input costs 2× in and 1.5× out.
  - Stops at the hard spend limit, with a stated small lag ("recorded spend can slightly exceed the configured amount"), at the tier usage limit, and at `credit_balance_exhausted`.
  - Alerts do not stop requests (F5).
- **Practical consequence:** OpenAI's lag is stated; Anthropic's is undocumented. **Set each provider's own cap well below the budget**, so a lag cannot overrun it.

**3 · OpenAI's legal terms: not verified. The owner reading them himself is acceptable, on one condition.**
- He records which documents and dates he read, and checks specifically:
  - the minimum-age and minors provisions;
  - education use;
  - data use and retention;
  - the sub-processor list and the DPA.
- Until then, OpenAI's "terms" column is **not found**, not "no restriction" (G1).

**4 · Missing documentation: real gaps.**
- **Google:** `aistudio.google.com` and `docs.cloud.google.com`. They matter only if Google is reconsidered under point 1, so not needed now.
- **Anthropic's subprocessor list** (`trust.anthropic.com`): needed before acceptance, as part of the DPA (G2). The owner can read it in his browser, as for OpenAI, or the host can be added to the allowlist for one read.

**5 · Fact against interpretation: kept, except in three places** (F3, F4, F6).

## Corrections the document needs

- **F1:** "Pricing for cache write effective January 12, 2027" belongs to the **Gemini 4** tables, not to Gemini 3.8 Flash. Move it.
- **F2:** add the Gemini 4 family from the same pricing page, for completeness:
  - Hydrogen $1.50 / $7.50;
  - Carbon and Argon $2 / $10 through 30 Nov 2026, then $4 / $20.
  - Also add the 3.8 Flash intro price's footnote, "Promotional pricing provided through 50% credits back on net spend". A budget may count gross spend.
- **F3:** §4's retention row:
  - Google's cell is shown in quote marks but is not verbatim. Quote §20(h) exactly, or remove the quote marks.
  - Anthropic's cell leaves out flagged content (up to 2 years, and scores 7 years).
  - OpenAI's leaves out that `/v1/batches` is kept until deleted and is not ZDR-eligible.
- **F4:** §1c says "Guidelines for organisations serving minors" is listed. **State what they require:** age verification, content moderation, a child-safety system prompt, COPPA-type compliance and AI disclosure, for organisations whose minors "directly interact" with the product.
  - My reading, as interpretation: an educator-only feature is arguably not direct interaction. But PINTAR as a whole serves minors, so the guidelines should be followed (checker §3a).
- **F5:** add Anthropic's absence of documented enforcement lag and alerts, the Enterprise-only Spend Limits API, and OpenAI's `credit_balance_exhausted`. Upgrade the usage-limit stop to A, on the checker's evidence.
- **F6:** upgrade to A what the checker re-read directly: the Start-tier rate limits and the Google §16 number. Mark every other inference as B, in its own column, not in the prose.

## Gaps the owner closes himself

- **G1:** OpenAI's Services Agreement, Usage Policies, DPA and sub-processor list, read in his browser, with the dates recorded.
- **G2:** Anthropic's subprocessor list (`trust.anthropic.com/subprocessors`), read the same way.

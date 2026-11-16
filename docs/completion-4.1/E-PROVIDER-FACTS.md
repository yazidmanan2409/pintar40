# E · Provider facts from official public sources

> **Read 16 November 2026 by a research assistant to the Chief Architect**, under owner rulings 35–36
> (`OWNER-RULINGS-4.1.md`) and `C3-EVALUATION-PREPARATION.md` §6a and §6d. All reading was done from the dedicated
> `pintar40` environment.
>
> **No provider API was called. No key or credential was created or requested. Nothing was spent. No evaluation
> material was sent anywhere.** The only change was the owner-approved addition of 14 documentation hosts to the
> `pintar40` environment's network allowlist.
>
> **Disclosure.** One of the providers is Anthropic, and this document was prepared by an Anthropic model. Each finding
> below quotes the provider's own text with its URL, so it can be checked. Sharon is asked to check it independently.
>
> **Grades.** **A** means I read it directly on an official page. **B** means it is official but indirect, inferred
> from a table, or ambiguous. Where a page could not be reached, the finding says **not found** and gives the reason.
> All dates read are 2026-11-16.

## 0 · What could not be reached, and why

These gaps matter to the decision. None of them is a finding about the provider.

| Source | What happened | Effect |
|---|---|---|
| `ai.google.dev/gemini-api/...` (every path tried: pricing, terms, models, rate-limits, billing) | It redirects (HTTP 301) to `aistudio.google.com/docs/...`, a host that is **not** on the approved list | **The Gemini Developer API could not be read at all.** Sections 3a–3e for that route are "not found" |
| `cloud.google.com/vertex-ai/generative-ai/docs/...` and `cloud.google.com/billing/docs/...` | They redirect to `docs.cloud.google.com`, which is not on the list | Vertex model IDs, quotas and budget behaviour: not found |
| `openai.com/policies/...` (services agreement, usage policies, sub-processor list, DPA, enterprise privacy) and `help.openai.com` | HTTP 403 with a bot-challenge page served by the site itself, not by our proxy | OpenAI's legal terms could not be read. The developer docs on `developers.openai.com` were readable |
| `www.anthropic.com/subprocessors` | It redirects to `trust.anthropic.com/subprocessors`, which is not on the list | We have the link, but could not read the list itself |

Reading those pages would need `aistudio.google.com`, `docs.cloud.google.com` and `trust.anthropic.com` added, plus a
browser able to pass openai.com's bot challenge. I did not request these. The brief allowed one network change, and
the owner approved that one.

---

## 1 · Anthropic, Claude API (first-party)

### 1a · Model and tier

| Finding | Grade | Source |
|---|---|---|
| Claude Sonnet 5.5. API ID **`claude-sonnet-5-5`**. Described as "The best combination of speed and intelligence" | A | https://platform.claude.com/docs/en/about-claude/models/overview (redirects to `/docs/en/models/overview`) |
| Tiers are Start, Build, Scale and Custom. "Organizations are placed on a tier automatically based on usage history and account standing." Also: "New organizations … may start in the Evaluation tier, with limits below the standard limits shown on this page" | A | https://platform.claude.com/docs/en/api/rate-limits |

A new paid organisation would begin in the Evaluation tier or Start tier. Start is the ordinary entry tier.

### 1b · Price (USD per 1M tokens)

| Item | Value | Grade |
|---|---|---|
| Input / output | **$2 / $10** | A |
| Batch API | $1 / $5. "50 percent discount on both input and output tokens" | A |
| Long prompts | **No surcharge.** "Claude 4.6 and later models (except Claude Haiku 5.5) … include the full 1M token context window at standard pricing" | A |
| US-only inference (`inference_geo: "us"`) | 1.1× on all token categories. Global routing (the default) is standard price | A |
| Prompt-cache hit | $0.10 (0.05×) | A |
| Announced price change | None found on the pricing page. Commercial Terms H.1: rate updates take effect "the earlier of 30 days after the updates are posted … or Customer otherwise receives Notice" | A |

Source: https://platform.claude.com/docs/en/about-claude/pricing · Commercial Terms: https://www.anthropic.com/legal/commercial-terms

### 1c · Terms and data handling

Documents:
- Commercial Terms of Service, effective Jun 17, 2025: https://www.anthropic.com/legal/commercial-terms
- Usage Policy, effective Nov 12, 2026: https://www.anthropic.com/legal/aup
- Data Processing Addendum: https://www.anthropic.com/legal/data-processing-addendum
- Guidelines for organisations serving minors: https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors

| Topic | Finding | Grade |
|---|---|---|
| Training | Commercial Terms B: "Anthropic may not train models on Customer Content from Services." Privacy Center, updated Aug 18, 2026: "By default, we will not use your inputs or outputs from our commercial products (e.g. … Anthropic API …) to train our models." Exception: explicitly submitted feedback | A |
| Retention | "For Anthropic API users, we automatically delete inputs and outputs on our backend within 30 days of receipt or generation", except for services you control (such as the Files API), a zero-retention agreement, Usage Policy enforcement, or law. Flagged content: "up to 2 years", and classification scores "up to 7 years". Source: https://privacy.claude.com/en/articles/7996866 (updated Jul 1, 2026) | A |
| Zero retention | Available by arrangement: "To request ZDR for your organization, contact the Anthropic sales team." Under ZDR, "Anthropic does not store customer prompts or responses at rest after the API response is returned." Covered Models (Fable/Mythos 5.x) require 30-day retention and are not ZDR-eligible. **Sonnet 5.5 is not listed as a Covered Model.** Source: https://platform.claude.com/docs/en/build-with-claude/zero-data-retention (redirects to `/docs/en/manage-claude/api-and-data-retention`) | A |
| Location | `inference_geo`: `"global"` (default) or `"us"` ("Inference runs only in US-based infrastructure"). Also: "Currently, "us" is the only available workspace geo" for data at rest. No EU or Asia option found. Source: https://platform.claude.com/docs/en/build-with-claude/data-residency | A |
| Subprocessors | DPA: "Anthropic's list of subprocessors is available at https://www.anthropic.com/subprocessors." That URL redirects to `trust.anthropic.com`, which was not reachable, so the list was not read | B |
| Synthetic, non-personal educational text | No term found that restricts it. The Usage Policy lists "General information or educational content" among the uses that do not trigger high-risk requirements. It treats grading that "determines admission, graduation, licensure, or certification" as high-risk. "Products serving minors … must comply with the additional guidelines." No explicit statement about synthetic text was found | B |

### 1d · Spend controls

| Control | Effect | Grade |
|---|---|---|
| Tier monthly spend cap (Start $500, Build $1,000, Scale $200,000; Custom has none) | **Stops requests.** "API usage pauses until 00:00 UTC on the first day of the next month". Requests return HTTP 429 `enforced_spend_limit_reached` | A |
| Your own spend limit (organisation; per-workspace too, but not on the default workspace) | **Stops requests.** HTTP 400 "You have reached your specified API usage limits" | A |
| Spend alerts | Not found on the rate-limits page | — |
| Default rate limits, Start tier, Sonnet 5.5 | 4,000 RPM / 2,000,000 ITPM / 400,000 OTPM. Read from a flattened table; the Evaluation tier may be lower | B |
| Billing or enforcement lag | Not found | — |

Source: https://platform.claude.com/docs/en/api/rate-limits

---

## 2 · OpenAI API

### 2a · Model and tier

| Finding | Grade | Source |
|---|---|---|
| The Models page says: "use GPT-6 Astra … our flagship … Choose **GPT-6.1 Sol** to balance intelligence and cost, or GPT-6 Luna for cost-sensitive, high-volume workloads." Model ID **`gpt-6.1-sol`** | A (the ID) / B (calling it "mid-tier" is my reading of the provider's wording) | https://developers.openai.com/api/docs/models · https://developers.openai.com/api/docs/models/gpt-6.1-sol |
| GPT-6.1 Terra (`gpt-6.1-terra`, $1 / $5) is a cheaper option, described as "A fast, efficient model". It is noted here in case the owner wants a price-matched pair | A | https://developers.openai.com/api/docs/models/gpt-6.1-terra |
| Paid tiers are Build, Launch and Grow. "Your organization's usage tier upgrades automatically as its total credit purchases reach each threshold." Build requires $5 in total credit purchases | A | https://developers.openai.com/api/docs/guides/rate-limits |

### 2b · Price for `gpt-6.1-sol` (USD per 1M tokens)

| Item | Value | Grade |
|---|---|---|
| Input / output (Standard) | **$2 / $10**. Cached input $0.10 | A |
| Long prompts | "API prompts with more than 272K input tokens are priced at 2x input and cache rates and 1.5x output for the full request", which is $4 / $15 | A |
| Batch and Flex | "50% lower than Standard", which is $1 / $5 | A |
| Regional processing | "adds a 10% premium where available" | A |
| Announced price change | None found | A |

Source: https://developers.openai.com/api/docs/pricing · the model page above

### 2c · Terms and data handling

Documents (links found; **pages not read**, because of the 403 bot challenge):
- Services Agreement: https://openai.com/policies/services-agreement/
- Usage Policies: https://openai.com/policies/usage-policies/
- Sub-processor list: https://openai.com/policies/sub-processor-list/
- DPA: https://openai.com/policies/data-processing-addendum/

| Topic | Finding | Grade |
|---|---|---|
| Training | "As of March 1, 2023, data sent to the OpenAI API is not used to train or improve OpenAI models (unless you explicitly opt in to share data with us)." The endpoint table shows "Data used for training: No" for `/v1/responses` and `/v1/chat/completions` | A |
| Retention | Abuse-monitoring logs are "retained for up to 30 days" by default. `/v1/batches` application state is kept "Until deleted" | A |
| Zero retention | Zero Data Retention and Modified Abuse Monitoring exist, but "these controls are subject to prior approval by OpenAI and acceptance of additional requirements" | A |
| Location | Data residency is configured per project, for "eligible organizations", with a 10% uplift. "GPT-6.1 Sol and GPT-6.1 Terra support only US and EU data residency." Source: https://developers.openai.com/api/docs/guides/data-residency | A |
| Subprocessors | The link above is referenced from the data-residency guide. The list was not read | B |
| Synthetic, non-personal educational text | **Not checked**: the Services Agreement and Usage Policies could not be read | not found |

Sources: https://developers.openai.com/api/docs/guides/your-data · data-residency guide above

### 2d · Spend controls

| Control | Effect | Grade |
|---|---|---|
| Hard spend limit (organisation or project; "Enforce a hard limit" toggle) | **Stops requests.** HTTP 429 `organization_spend_limit_exceeded` / `project_spend_limit_exceeded` | A |
| Spend alert | **Alert only.** "Sends a notification; API traffic continues" | A |
| OpenAI-approved monthly usage limit per tier (Build $500 / Launch $5,000 / Grow $200,000) | Separate from spend limits. Reaching it returns `organization_usage_limit_exceeded`. That it stops requests is inferred from the error code | B |
| Lag | "Enforcement is not instantaneous. The API Platform can process a small amount of extra usage while the limit state propagates, so recorded spend can slightly exceed the configured amount." | A |
| Default rate limits, Build tier (Astra, Sol and Terra) | 5,000 RPM / 1,000,000 TPM | A |

Sources: https://developers.openai.com/api/docs/guides/spend-limits · rate-limits guide above

---

## 3 · Google

### 3-I · Gemini Developer API (AI Studio route)

**Not found: none of (a)–(e) could be read.** Every `ai.google.dev/gemini-api/...` URL redirects to
`aistudio.google.com`, which is outside the approved hosts. That includes the Gemini API Additional Terms at
`ai.google.dev/gemini-api/terms`, whose under-18 text ruling 36 asks for. I am not reporting it from memory.

Two things I could read are relevant:
- `policies.google.com/terms/generative-ai` (Generative AI Additional Terms, last modified Aug 9, 2023) now says: "As of
  [May 22, 2024], these Generative AI Additional Terms of Service no longer apply, unless you're a business partner
  with a signed agreement that references these terms." So it is not the current governing document. (A)
- Google's subprocessor page at https://business.safety.google/subprocessors/ is reachable. It covers Google's Data
  Processing Terms. I did not confirm whether it applies to the Gemini Developer API. (B)

### 3-II · Gemini via Google Cloud Vertex AI (now "Gemini Enterprise Agent Platform")

**(a) Model.** The pricing page lists **Gemini 3.8 Flash** as the current Flash model. Pro appears only as **Gemini 3.1
Pro Preview**. **The API model ID was not found**, because the models documentation is on `docs.cloud.google.com`.
Tier: Vertex AI uses ordinary Cloud Billing pay-as-you-go. That is a B inference; the quota documentation was not
reachable.

**(b) Price (USD per 1M tokens, Standard, global endpoint).** Grade A. Source:
https://cloud.google.com/vertex-ai/generative-ai/pricing, which redirects to `cloud.google.com/model-garden/pricing`,
titled "Agent Platform Pricing".

| Model | Input / output | Notes |
|---|---|---|
| Gemini 3.8 Flash, **through 31 Dec 2026** | **$0.75 / $3.75** | "offered with introductory pricing … through December 31, 2026" |
| Gemini 3.8 Flash, **from 1 Jan 2027** | **$1.50 / $7.50** | "Starting January 1, 2027, standard pricing of $1.5 / $7.5 … will apply." This price change is already announced |
| Gemini 3.8 Flash, non-global endpoint | $0.825 / $4.125 (intro); $1.65 / $8.25 (from 2027) | About +10% |
| Gemini 3.8 Flash, Flex/Batch | $0.375 / $1.875 (intro); $0.75 / $3.75 (from 2027) | 50% |
| Gemini 3.8 Flash, >200K input | Same price as ≤200K | No surcharge |
| Gemini 3.1 Pro Preview | $2 / $12 (≤200K); $4 / $18 (>200K) | Preview offering |

Separately, the page notes "Pricing for cache write effective January 12, 2027".

**(c) Terms.** Google Cloud Service Specific Terms, last modified November 11, 2026:
https://cloud.google.com/terms/service-terms. Under the heading "AI / ML Services":

| Topic | Finding | Grade |
|---|---|---|
| Training | §18 Training Restriction: "Google will not use Customer Data to train or fine-tune any AI/ML models without Customer's prior permission or instruction." | A |
| Retention | §20(h): "Absent Customer's prior permission or instruction, Google will not store outside Customer's Account (i) Customer Data prompted to a Generative AI Service for longer than is reasonably necessary to create the Generated Output, or (ii) the Generated Output." No numeric period or separate zero-retention switch was found in the terms | A (text) / B (no numeric period) |
| Location | AI/ML Data Location ("formerly Section 15"; §16 by position): "Customer may configure the Services listed at https://cloud.google.com/terms/data-residency to (a) store Customer Data at rest and (b) perform machine learning processing … in a specific Multi-Region". That list includes "Generative AI on Gemini Enterprise Agent Platform (formerly Generative AI on Vertex AI) (except for Grounding with Google Search, Grounding with Google Maps, and RAG Engine)" | A (§ number B) |
| Subprocessors | https://cloud.google.com/terms/subprocessors (reachable). It lists entries for "AI Platform/Gemini platform (formerly Vertex AI), Generative AI Services" | A |
| Synthetic, non-personal educational text | No term found that restricts it. The limits are §20(c) (Prohibited Use Policy), §20(d) (age) and §20(e) (healthcare) | B |

**(d) Spend controls.** **Not found.** The Cloud Billing budgets and Vertex quotas documentation redirects to
`docs.cloud.google.com`. I am not asserting from memory whether budgets stop requests or only alert.

**(e) Under-18 restriction**, Google Cloud Service Specific Terms, §20 "Generative AI Services", subsection (d). Grade A:

> "d. Age Restrictions. Customer will not, and will not allow End Users to, use a Generative AI Service as part of a
> website, Customer Application, or other online service that is directed towards or is likely to be accessed by
> individuals under the age of 18."

§20(f): "Google may immediately suspend or terminate Customer's use of a Generative AI Service based on any suspected
violation of Section 17(b) or subsection (d) above." §20(g) makes (d) a "Restriction" under the Agreement.

The Gemini API Additional Terms version is **not found** (see 3-I).

---

## 4 · Side by side

| | Anthropic `claude-sonnet-5-5` | OpenAI `gpt-6.1-sol` | Google Vertex Gemini 3.8 Flash |
|---|---|---|---|
| In / out per 1M | $2 / $10 | $2 / $10 | $0.75 / $3.75 to 31 Dec 2026, then $1.50 / $7.50 |
| Long-prompt surcharge | none | >272K: 2× in, 1.5× out | none |
| Batch | −50% | −50% | −50% |
| Trains on API data | No (terms) | No (docs) | No (§18) |
| Default retention | ≤30 days | ≤30 days (abuse logs) | "no longer than reasonably necessary" |
| Zero retention | by arrangement | prior approval | not found as a separate option |
| Region control | US-only option (+10%) | US / EU (+10%) | Multi-Region (data-residency list) |
| Hard spend stop | yes (cap and own limit) | yes (hard limit; small lag) | not found |
| Under-18 term | guidelines for products serving minors | not read | §20(d) prohibits "likely to be accessed by" under-18s |

## 5 · Sources read (all on 2026-11-16)

platform.claude.com/docs/en/{about-claude/pricing, about-claude/models/overview, api/rate-limits,
build-with-claude/zero-data-retention, build-with-claude/data-residency} · privacy.claude.com/en/articles/{7996866,
7996868} · www.anthropic.com/legal/{commercial-terms, aup, data-processing-addendum} · support.claude.com article
9307344 · developers.openai.com/api/docs/{models, models/gpt-6.1-sol, models/gpt-6.1-terra, pricing, guides/your-data,
guides/rate-limits, guides/spend-limits, guides/data-residency} · cloud.google.com/{terms/service-terms,
terms/subprocessors, terms/data-residency, model-garden/pricing} · policies.google.com/terms/generative-ai ·
business.safety.google/subprocessors/

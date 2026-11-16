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
| `www.anthropic.com/subprocessors` | It redirects to `trust.anthropic.com/subprocessors`. That host was added with the owner's approval on 16 Nov 2026, in a second, single-host change. The page is a JavaScript app (Vanta Trust Center): the HTML served contains no subprocessor entries | We have the link, but the list itself could not be read without a browser |

Follow-up of 16 Nov 2026 (07:08 UTC): at the Chief Architect's request, only `trust.anthropic.com` was added. The owner
approved it. `aistudio.google.com` and `docs.cloud.google.com` were not requested: Google is out unless written
clarification of §20(d) arrives. No attempt was made to get past openai.com's bot challenge; the owner reads OpenAI's
terms himself.

## Corrections from Sharon's review

Sharon's review is `docs/coordination/reviews/sharon/E-PROVIDER-FACTS-REVIEW.md` (commit `291c5ab7`). It rests on the
checker's re-reading at `e607cb42` (`claude/e-provider-facts-check`). Her corrections were applied on 16 Nov 2026:

- **F1:** the note "Pricing for cache write effective January 12, 2027" moved to the Gemini 4 rows (§3-II b). It was
  wrongly attached to Gemini 3.8 Flash.
- **F2:** added the Gemini 4 family (Hydrogen, Carbon, Argon) and the 3.8 Flash promotional footnote ("50% credits back
  on net spend") (§3-II b).
- **F3:** completed the §4 retention row: Anthropic's flagged-content retention, OpenAI's `/v1/batches` "until deleted"
  and not ZDR-eligible, and Google's §20(h) now quoted exactly.
- **F4:** §1c now states what Anthropic's guidelines for organisations serving minors require, with Sharon's reading
  marked as interpretation.
- **F5:** §1d records that no enforcement lag is documented, and the reporting lags. The Enterprise-only Spend Limits
  API was already there. §2d adds `credit_balance_exhausted` and upgrades the usage-limit stop to A.
  - **One discrepancy.** Sharon writes that no spend alerts are documented anywhere on platform.claude.com. Her review
    covered `22ff0dd`. The follow-up `050820e` found email alerts for **workspace** spend limits on the Workspaces page,
    quoted in §1d. I kept that row and marked the conflict, rather than delete a quoted finding.
- **F6:** Start-tier rate limits and the Google §16 number raised to A, on the checker's direct reading. Grades that
  were in prose (§2a, §3-I, §3-II a and d) are now in grade columns.

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
| Subprocessors | DPA: "Anthropic's list of subprocessors is available at https://www.anthropic.com/subprocessors." That URL redirects to https://trust.anthropic.com/subprocessors. The page was fetched on 16 Nov 2026 (HTTP 200). It is a JavaScript-rendered Trust Center (scripts from `assets.vanta.com`), and the HTML contains no subprocessor names. **The list itself was not read.** Reading it needs a real browser; it may also need a sign-in, which I could not determine | B (link A; contents not found) |
| Guidelines for organisations serving minors: what they require | They apply to "organizations providing minors with the ability to directly interact with products that incorporate our API(s)". (1) Technical measures, which "may include, but are not limited to": "Age verification systems", "Content moderation and filtering", "Monitoring and reporting mechanisms", and "Educational resources and guidance for minors". Also a child-safety system prompt, "which organizations serving minors should implement". (2) Regulatory compliance: comply with child-safety and data-privacy law "such as the Children's Online Privacy Protection Act (COPPA)", and state it publicly. (3) Disclosure: "Organizations must disclose to their users that they are interacting with an AI system rather than a human." Anthropic "will periodically audit organizations"; non-compliance "may lead to the suspension or termination of your account" | A |
| Do the minors guidelines bind an educator-only feature? | **Interpretation (Sharon's reading, checker §3a):** an educator-only feature is arguably not "direct interaction" by minors. But PINTAR as a whole serves minors, so the guidelines should be followed | B |
| Synthetic, non-personal educational text | No term found that restricts it. The Usage Policy lists "General information or educational content" among the uses that do not trigger high-risk requirements. It treats grading that "determines admission, graduation, licensure, or certification" as high-risk. "Products serving minors … must comply with the additional guidelines." No explicit statement about synthetic text was found | B |

### 1d · Spend controls

| Control | Effect | Grade |
|---|---|---|
| Tier monthly spend cap (Start $500, Build $1,000, Scale $200,000; Custom has none) | **Stops requests.** "API usage pauses until 00:00 UTC on the first day of the next month". Requests return HTTP 429 `enforced_spend_limit_reached` | A |
| Your own spend limit (organisation; per-workspace too, but not on the default workspace) | **Stops requests.** HTTP 400 "You have reached your specified API usage limits" (for a workspace limit: "…specified workspace API usage limits") | A |
| Organisation limit when a dedicated workspace is used | **Still applies.** Workspaces page: "Workspace limits can keep a workspace below your organization's limits, but they can't raise those limits" and "Organization-wide limits always apply, even if workspace limits add up to more." Also: "You cannot set spend limits on the Default Workspace." So a dedicated, non-default workspace is needed for a workspace cap. The note sits under both spend and rate limits; that it covers the organisation **spend** cap is my reading | A (text) / B (spend scope) |
| Spend alerts | **Alert only, by email.** "If Anthropic bills your organization directly, you can also set up email alerts for when spending reaches an amount you choose: click **Add notification** … next to **Email notifications**." This is described for workspace spend limits. No organisation-level alert text was found. **Conflicts with Sharon's review** ("no spend alerts are documented anywhere on platform.claude.com"); her review predates this row (see Corrections) | A (workspace) / not found (org) |
| Per-member spend limits API | Not applicable. "The Spend Limits API is available to Claude Enterprise organizations only. It is not available to Claude Platform (Claude Console) organizations." | A |
| Default rate limits, Start tier, Sonnet 5.5 | 4,000 RPM / 2,000,000 ITPM / 400,000 OTPM. The checker re-read the Start-tier row directly. The Evaluation tier may be lower | A |
| Spend-limit enforcement lag | **Not documented.** No statement anywhere on platform.claude.com on how quickly a spend limit takes effect, or whether spend can overrun it. Treat "stops requests" as true with an unknown lag, not as "no lag" | not found |
| Reporting lag (not enforcement) | Usage and Cost Analytics API: "Data typically refreshes within 4 hours of the underlying usage and can take up to 24 hours", and values "can be revised … until about 7 days after the end of the calendar month". The legacy Usage and Cost API: "Data typically appears within 5 minutes" | A |
| Practical consequence | Set the provider's own cap well below the evaluation budget, so an undocumented lag cannot overrun it (Sharon, point 2) | B (advice) |

Sources: https://platform.claude.com/docs/en/api/rate-limits · https://platform.claude.com/docs/en/manage-claude/workspaces ·
https://platform.claude.com/docs/en/manage-claude/spend-limits-api · https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api
(read 16 Nov 2026, `.md` versions)

---

## 2 · OpenAI API

### 2a · Model and tier

| Finding | Grade | Source |
|---|---|---|
| The Models page says: "use GPT-6 Astra … our flagship … Choose **GPT-6.1 Sol** to balance intelligence and cost, or GPT-6 Luna for cost-sensitive, high-volume workloads." Model ID **`gpt-6.1-sol`** | A | https://developers.openai.com/api/docs/models · https://developers.openai.com/api/docs/models/gpt-6.1-sol |
| Treating `gpt-6.1-sol` as OpenAI's "mid-tier general model" | B (my reading of "balance intelligence and cost") | as above |
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
| OpenAI-approved monthly usage limit per tier (Build $500 / Launch $5,000 / Grow $200,000) | **Stops requests.** Separate from spend limits. Error codes page: "429 - Organization usage limit reached | Code: `organization_usage_limit_exceeded` … Your organization reached its OpenAI-assigned usage limit." Spend-limits page: "If requests fail because of a billing-related limit or credit balance … For organization_usage_limit_exceeded, request a higher approved usage limit" | A |
| Prepaid credit exhausted | **Stops requests.** "429 - Credit balance exhausted | Code: `credit_balance_exhausted` | Cause: Your organization has no prepaid credits remaining." With prepaid credit, the balance is a hard ceiling too | A |
| Lag | "Enforcement is not instantaneous. The API Platform can process a small amount of extra usage while the limit state propagates, so recorded spend can slightly exceed the configured amount." | A |
| Default rate limits, Build tier (Astra, Sol and Terra) | 5,000 RPM / 1,000,000 TPM | A |

Sources: https://developers.openai.com/api/docs/guides/spend-limits · https://developers.openai.com/api/docs/guides/error-codes · rate-limits guide above

---

## 3 · Google

### 3-I · Gemini Developer API (AI Studio route)

**Not found: none of (a)–(e) could be read.** Every `ai.google.dev/gemini-api/...` URL redirects to
`aistudio.google.com`, which is outside the approved hosts. That includes the Gemini API Additional Terms at
`ai.google.dev/gemini-api/terms`, whose under-18 text ruling 36 asks for. I am not reporting it from memory.

Two things I could read are relevant:

| Finding | Grade |
|---|---|
| `policies.google.com/terms/generative-ai` (Generative AI Additional Terms, last modified Aug 9, 2023) now says: "We updated the Google Terms of Service on May 22, 2024 to cover AI-related topics. As of that date, these Generative AI Additional Terms of Service no longer apply, unless you're a business partner with a signed agreement that references these terms." So it is not the current governing document | A |
| Google's subprocessor page at https://business.safety.google/subprocessors/ is reachable and covers Google's Data Processing Terms. Whether it applies to the Gemini Developer API was not confirmed | B |

### 3-II · Gemini via Google Cloud Vertex AI (now "Gemini Enterprise Agent Platform")

**(a) Model.**

| Finding | Grade |
|---|---|
| The pricing page lists **Gemini 3.8 Flash** as the current Flash model, and Pro only as **Gemini 3.1 Pro Preview**. It also lists a **Gemini 4** family (Hydrogen, Carbon, Argon; see b) | A |
| API model ID | not found (the models documentation is on `docs.cloud.google.com`) |
| Tier: ordinary Cloud Billing pay-as-you-go | B (inference; the quota documentation was not reachable) |

**(b) Price (USD per 1M tokens, Standard, global endpoint).** Grade A. Source:
https://cloud.google.com/vertex-ai/generative-ai/pricing, which redirects to `cloud.google.com/model-garden/pricing`,
titled "Agent Platform Pricing".

| Model | Input / output | Notes |
|---|---|---|
| Gemini 3.8 Flash, **through 31 Dec 2026** | **$0.75 / $3.75** | "offered with introductory pricing … through December 31, 2026". Marked `*`: "Promotional pricing provided through 50% credits back on net spend on select models within a given period." **So the gross charge may be the full price, with credit back.** How a Cloud budget counts that is not known |
| Gemini 3.8 Flash, **from 1 Jan 2027** | **$1.50 / $7.50** | "Starting January 1, 2027, standard pricing of $1.5 / $7.5 … will apply." This price change is already announced |
| Gemini 3.8 Flash, non-global endpoint | $0.825 / $4.125 (intro); $1.65 / $8.25 (from 2027) | About +10% |
| Gemini 3.8 Flash, Flex/Batch | $0.375 / $1.875 (intro); $0.75 / $3.75 (from 2027) | 50% |
| Gemini 3.8 Flash, >200K input | Same price as ≤200K | No surcharge |
| Gemini 3.1 Pro Preview | $2 / $12 (≤200K); $4 / $18 (>200K) | Preview offering |
| Gemini 4 Hydrogen | $1.50 / $7.50 | Its cache-write price ($1.875) carries `***`: "Pricing for cache write effective January 12, 2027". This note belongs to the Gemini 4 tables, not to 3.8 Flash |
| Gemini 4 Carbon, through 30 Nov 2026 | $2 / $10 | Marked `*` (promotional, "50% credits back on net spend") |
| Gemini 4 Carbon, from 1 Dec 2026 | $4 / $20 | "Starting December 1, 2026" |
| Gemini 4 Argon, through 30 Nov 2026 | $2 / $10 | Marked `*` (promotional) |
| Gemini 4 Argon, from 1 Dec 2026 | $4 / $20 | "Starting December 1, 2026" |

Gemini 4 footnote `**`: "When a completion exceeds 32K tokens in length, users will be charged for retrievable token
usage even if the request ultimately fails due to client or server timeouts. This will take effect on November 13
2026." Non-global endpoints are about +10%, as for 3.8 Flash.

**(c) Terms.** Google Cloud Service Specific Terms, last modified November 11, 2026:
https://cloud.google.com/terms/service-terms. Under the heading "AI / ML Services":

| Topic | Finding | Grade |
|---|---|---|
| Training | §18 Training Restriction: "Google will not use Customer Data to train or fine-tune any AI/ML models without Customer's prior permission or instruction." | A |
| Retention | §20(h): "Absent Customer's prior permission or instruction, Google will not store outside Customer's Account (i) Customer Data prompted to a Generative AI Service for longer than is reasonably necessary to create the Generated Output, or (ii) the Generated Output." No numeric period or separate zero-retention switch was found in the terms | A (text) / B (no numeric period) |
| Location | §16 AI/ML Data Location ("formerly Section 15"; number confirmed by the checker): "Customer may configure the Services listed at https://cloud.google.com/terms/data-residency to (a) store Customer Data at rest and (b) perform machine learning processing … in a specific Multi-Region". That list includes "Generative AI on Gemini Enterprise Agent Platform (formerly Generative AI on Vertex AI) (except for Grounding with Google Search, Grounding with Google Maps, and RAG Engine)" | A |
| Subprocessors | https://cloud.google.com/terms/subprocessors (reachable). It lists entries for "AI Platform/Gemini platform (formerly Vertex AI), Generative AI Services" | A |
| Synthetic, non-personal educational text | No term found that restricts it. The limits are §20(c) (Prohibited Use Policy), §20(d) (age) and §20(e) (healthcare) | B |

**(d) Spend controls.**

| Finding | Grade |
|---|---|
| Whether Cloud Billing budgets stop requests or only alert; default Vertex quotas | not found (the documentation redirects to `docs.cloud.google.com`; nothing is asserted from memory) |

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
| Default retention | ≤30 days; content flagged under the Usage Policy up to 2 years, classification scores up to 7 years | ≤30 days (abuse logs); `/v1/batches` kept until deleted and not ZDR-eligible | §20(h): Google "will not store outside Customer's Account (i) Customer Data prompted to a Generative AI Service for longer than is reasonably necessary to create the Generated Output, or (ii) the Generated Output" |
| Zero retention | by arrangement | prior approval | not found as a separate option |
| Region control | US-only option (+10%) | US / EU (+10%) | Multi-Region (data-residency list) |
| Hard spend stop | yes (cap and own limit; lag not documented) | yes (hard limit, small stated lag; also the approved usage limit and exhausted prepaid credit) | not found |
| Under-18 term | guidelines for products serving minors | not read | §20(d) prohibits "likely to be accessed by" under-18s |

## 5 · Sources read (all on 2026-11-16)

platform.claude.com/docs/en/{about-claude/pricing, about-claude/models/overview, api/rate-limits,
build-with-claude/zero-data-retention, build-with-claude/data-residency, manage-claude/workspaces,
manage-claude/spend-limits-api, manage-claude/usage-cost-analytics-api} · trust.anthropic.com/subprocessors (JavaScript only) · privacy.claude.com/en/articles/{7996866,
7996868} · www.anthropic.com/legal/{commercial-terms, aup, data-processing-addendum} · support.claude.com article
9307344 · developers.openai.com/api/docs/{models, models/gpt-6.1-sol, models/gpt-6.1-terra, pricing, guides/your-data,
guides/rate-limits, guides/spend-limits, guides/data-residency, guides/error-codes, guides/structured-outputs},
developers.openai.com/api/reference/{overview, resources/responses/methods/create} · platform.claude.com/docs/en/{api/overview,
api/messages/create, api/errors, api/versioning, build-with-claude/structured-outputs} · cloud.google.com/{terms/service-terms,
terms/subprocessors, terms/data-residency, model-garden/pricing} · policies.google.com/terms/generative-ai ·
business.safety.google/subprocessors/

---

## 6 · API reference facts

For checking the offline runner's adapters against documentation. Read on 16 Nov 2026 from the `.md` versions of the
official reference pages. **No API was called.**

Sources:
- **Anthropic:** https://platform.claude.com/docs/en/api/overview · https://platform.claude.com/docs/en/api/messages/create ·
  https://platform.claude.com/docs/en/api/errors · https://platform.claude.com/docs/en/api/versioning ·
  https://platform.claude.com/docs/en/api/rate-limits · https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- **OpenAI:** https://developers.openai.com/api/reference/overview ·
  https://developers.openai.com/api/reference/resources/responses/methods/create ·
  https://developers.openai.com/api/docs/guides/structured-outputs · https://developers.openai.com/api/docs/guides/error-codes ·
  https://developers.openai.com/api/docs/guides/rate-limits · https://developers.openai.com/api/docs/models/gpt-6.1-sol

### 6a · Anthropic Messages API, `claude-sonnet-5-5`

| Item | Documented fact | Grade |
|---|---|---|
| Endpoint | `POST https://api.anthropic.com/v1/messages`. The overview lists "`POST /v1/messages`", and the reference examples use `https://api.anthropic.com` | A |
| Auth header | `Authorization: Bearer <token>`, "your API key or a short-lived access token". `x-api-key` is "Legacy fallback for `Authorization`, still supported" | A |
| Version header | `anthropic-version`; the current version is `2026-10-21`, as used in the examples and listed first in the version history. **The sources disagree on whether it is required:** the overview's header table says "Required: Yes", but the Create-a-Message reference lists `"anthropic-version": optional string`. Send it always | A (value) / B (required) |
| Other headers | `content-type: application/json`. Optional `anthropic-workspace-id` "to select the Workspace for this request" | A |
| System prompt | `system: optional string or array of TextBlockParam` | A |
| User prompt | `messages: array of MessageParam`, each with a `role` and `content` | A |
| Max output tokens | `max_tokens: number`. It is listed without "optional", so it is required | A (field) / B (required, from the listing) |
| JSON-schema structured output | `output_config.format` = `{ "type": "json_schema", "schema": { … } }`. Structured outputs: "The request carries the schema in `output_config.format` with `type: "json_schema"`." `claude-sonnet-5-5` is in the page's `supportedModels`. Only a "subset of the JSON Schema language" is supported | A |
| Token usage | Response body `usage`: `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`. "Total input tokens in a request is the summation of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`." `output_tokens` "remains the inclusive, authoritative total used for billing" | A |
| Request ID | Header `request-id` on every response (e.g. `req_018E…`). Error bodies also carry a top-level `request_id` field | A |
| Rate-limit headers | `anthropic-ratelimit-requests-{limit,remaining,reset}`, `anthropic-ratelimit-tokens-{limit,remaining,reset}`, `anthropic-ratelimit-input-tokens-{limit,remaining,reset}`, `anthropic-ratelimit-output-tokens-{limit,remaining,reset}`, and `retry-after` on 429s | A |
| Rate limit | HTTP **429** `rate_limit_error`, with `retry-after`. A ramp limit is also 429 `rate_limit_error`, with `error.details.error_code` `ramp_limit_exceeded` | A |
| Spend limit | **Tier cap:** HTTP **429** `rate_limit_error`, `error.details.error_code` `enforced_spend_limit_reached`, **no `retry-after`**; retries fail until access resumes. **Your own limit:** HTTP **400** `invalid_request_error`, message beginning "You have reached your specified API usage limits" (workspace: "…specified workspace API usage limits") | A |
| Credit exhaustion | HTTP **402** `billing_error`: "There's an issue with your billing or payment information." No error specific to an exhausted credit balance was found | B |
| Server error | HTTP **500** `api_error`; **504** `timeout_error`; **529** `overloaded_error` | A |
| Error body shape | `{ "type": "error", "error": { "type", "message", … }, "request_id" }` | A |
| Idempotency key | **Not found.** No idempotency header or parameter is documented for `POST /v1/messages`. The SDKs retry transient failures twice by default, so a retry can be billed twice | not found |

### 6b · OpenAI Responses API, `gpt-6.1-sol`

The Responses API is the documented route: the reference overview names "Responses for direct model requests", and
the model page says "Tool calling requires the Responses API". `gpt-6.1-sol` lists `structured_outputs` among its
"Supported features". (A)

| Item | Documented fact | Grade |
|---|---|---|
| Endpoint | `POST https://api.openai.com/v1/responses` (the reference's `post /responses`, under REST API `v1`) | A |
| Auth header | `Authorization: Bearer <API key or access token>`. Optional `OpenAI-Organization` and `OpenAI-Project` headers select the organisation and project | A |
| Version header | **None required.** The REST API is versioned in the path (`v1`). The response header `openai-version` reports "REST API version used for this request (currently `2020-10-01`)" | A |
| System prompt | `instructions: optional string or null`: "A system (or developer) message inserted into the model's context" | A |
| User prompt | `input: optional string or array of …` messages | A |
| Max output tokens | `max_output_tokens: optional integer or null`, "including visible output tokens and reasoning tokens", minimum 16 | A |
| JSON-schema structured output | `text.format` = `{ "type": "json_schema", "name": …, "schema": { … }, "strict": true }`. `strict` is "optional boolean or null (default: false)", so set it explicitly. `description` is optional | A |
| Storage | `store: optional boolean or null (default: true)`. Set `false` unless stored responses are wanted. Under ZDR it is always treated as false | A |
| Token usage | Response body `usage`: `input_tokens`, `input_tokens_details.cached_tokens`, `input_tokens_details.cache_write_tokens`, `output_tokens`, `output_tokens_details.reasoning_tokens`, `total_tokens` | A |
| Request ID | Response header `x-request-id`. The client may also send `X-Client-Request-Id` (ASCII, ≤512 characters, otherwise a 400), which OpenAI logs for lookup if the response is lost | A |
| Rate-limit headers | `x-ratelimit-limit-requests`, `x-ratelimit-limit-tokens`, `x-ratelimit-remaining-requests`, `x-ratelimit-remaining-tokens`, `x-ratelimit-reset-requests`, `x-ratelimit-reset-tokens`, and the `…-project-tokens` variants. `Retry-After` "may be present" on temporary 429 and 503 | A |
| Rate limit | HTTP **429** "Rate limit reached for requests"; also 429 `rate_limit_error` / `slow_down` when the rate "increased too quickly" | A |
| Spend limit | HTTP **429**, `error.code` `organization_spend_limit_exceeded` or `project_spend_limit_exceeded`; approved usage limit `organization_usage_limit_exceeded`. "The broader `error.type` can still be `insufficient_quota`." "Retrying billing, spend, or quota errors won't restore API access." | A |
| Credit exhaustion | HTTP **429**, `error.code` `credit_balance_exhausted` | A |
| Server error | HTTP **500** "The server had an error while processing your request"; **503** `service_unavailable_error` / `server_is_overloaded` | A |
| Idempotency key | **Not found.** No idempotency header is documented for `POST /v1/responses`. `X-Client-Request-Id` is for tracing, and is not described as deduplicating | not found (B: not an idempotency key) |

**For the adapters:**
- **Classify failures by status and code, not status alone.** Both providers use **429 for spend and billing stops as
  well as rate limits**, and these stops never clear on retry. Anthropic marks a tier cap with `enforced_spend_limit_reached`
  and no `retry-after`; OpenAI uses the codes above.
- **Turn off automatic SDK retries, or bound them.** Neither API documents idempotency, so a retried request may be billed
  twice.

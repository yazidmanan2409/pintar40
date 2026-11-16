Checked 16 November 2026 by an independent checker for Sharon; prepared by an Anthropic model, as was the document checked.

# E · Independent check of `E-PROVIDER-FACTS.md`

> **Subject:** `docs/completion-4.1/E-PROVIDER-FACTS.md` on `claude/e-provider-facts`, commit `22ff0ddd`.
> **Method:** I fetched every cited page myself (plain HTTPS GET through this environment's existing proxy, no
> changes to the network), turned the HTML into text, and searched it for each quoted string. Quotes were compared after
> normalising curly quotes, dashes and whitespace only. Then I read the text around each match to check the context.
> **Not done:** no provider API called, no key or credential created or requested, nothing spent, no evaluation
> material sent anywhere, no network or environment change proposed. Pages that were blocked were left blocked.
> **Verdict is Sharon's.** This file is evidence only.

## Summary

| | Count |
|---|---|
| Grade-A findings checked | 45 |
| Confirmed verbatim and in the context claimed | 44 (one quote is cut short, with no change in meaning; see 1a) |
| Differs | 1 (the Gemini "cache write effective January 12, 2027" note is placed in the wrong context; see 3-II b) |
| Unreachable | 0 (every grade-A page was readable from here) |
| Pages the document says could not be reached | 5 of 5 confirmed unreachable (same result: redirect to a host not on the list, or 403) |
| Material gaps found that the document does not mention | 5 (see §6 (iii)). The biggest: the **Gemini 4** family is on the same Google pricing page and is left out |

Labels used below: **confirmed** = verbatim, in the stated context. **confirmed (note)** = verbatim, with a caveat.
**differs** = the actual text or context is not what the document says. **unreachable** = I could not load the page.

---

## 0 · Pages the document says could not be reached

| Claim | My result | Note |
|---|---|---|
| `ai.google.dev/gemini-api/...` gives a 301 to `aistudio.google.com`, which is not allowed | confirmed | `ai.google.dev/gemini-api/docs/pricing` → 301. Following `ai.google.dev/gemini-api/terms` ends at `aistudio.google.com/docs/terms`, which the proxy refuses (CONNECT 403) |
| `cloud.google.com/vertex-ai/generative-ai/docs/...` and `cloud.google.com/billing/docs/...` redirect to `docs.cloud.google.com` | confirmed | The models docs URL ends at `docs.cloud.google.com`, refused by the proxy. `billing/docs/how-to/budgets` → 301 |
| `openai.com/policies/...` and `help.openai.com` give 403 with a bot challenge from the site | confirmed | `services-agreement` → 403. The body contains challenge markup, so the block is at the site. `help.openai.com` → 403. I did not try to get past it |
| `www.anthropic.com/subprocessors` redirects to `trust.anthropic.com`, which is not allowed | confirmed | Proxy refuses the CONNECT (403) |

---

## 1 · Anthropic

### 1a · Model and tier

| Finding | Grade | My result | Note |
|---|---|---|---|
| Sonnet 5.5, API ID `claude-sonnet-5-5`, "The best combination of speed and intelligence" | A | confirmed | models/overview redirects to `/docs/en/models/overview`, as stated. The ID is in the "Claude API ID" row |
| Tiers; "Organizations are placed on a tier automatically based on usage history and account standing." | A | confirmed (note) | The sentence goes on: "…account standing **and can move to a higher tier over time as they use the API.**" The document ends the quote early and adds a full stop. No change in meaning |
| "New organizations … may start in the Evaluation tier, with limits below the standard limits shown on this page" | A | confirmed | The full text adds "…while account history is established" and says these limits "increase automatically" |
| A new organisation would start in Evaluation or Start (unlabelled inference) | — | agree | Follows from the two quotes |

### 1b · Price

| Finding | Grade | My result | Note |
|---|---|---|---|
| $2 / $10 input / output | A | confirmed | Model pricing table: Sonnet 5.5, $2 / MTok in, $10 / MTok out |
| Batch $1 / $5, "50 percent discount on both input and output tokens" | A | confirmed | Batch table: Sonnet 5.5, $1 / $5 |
| No long-prompt surcharge, "Claude 4.6 and later models (except Claude Haiku 5.5) … include the full 1M token context window at standard pricing" | A | confirmed | The full sentence also names "Claude Mythos Preview" |
| US-only inference: 1.1× on all token categories; global is standard price | A | confirmed | "incurs a 1.1x multiplier on all token pricing categories, including input tokens, output tokens, cache writes, and cache reads" |
| Cache hit $0.10 (0.05×) | A | confirmed | Cache-hit table: Sonnet 5.5, 0.05x, $0.10 |
| No announced price change; Commercial Terms H.1 "the earlier of 30 days after the updates are posted … or Customer otherwise receives Notice" | A | confirmed | H.1 text is verbatim. I found no announced change on the pricing page |

### 1c · Terms and data handling

| Finding | Grade | My result | Note |
|---|---|---|---|
| Document dates: Commercial Terms effective Jun 17, 2025; Usage Policy effective Nov 12, 2026 | — | confirmed | Both dates are on the pages |
| Training: Commercial Terms B, "Anthropic may not train models on Customer Content from Services."; Privacy Center (updated Aug 18, 2026) "By default, we will not use your inputs or outputs from our commercial products … to train our models." | A | confirmed | The section is "B. Customer Content". The page metadata date is 2026-08-18. The feedback exception is on the page |
| Retention: 30 days; listed exceptions; flagged content "up to 2 years", scores "up to 7 years"; article updated Jul 1, 2026 | A | confirmed | Metadata date is 2026-07-01. Not in the document: the same page says feedback submissions are kept **5 years**. That only matters if PINTAR sends feedback |
| ZDR by arrangement; quote on prompts not stored at rest; Covered Models (Fable/Mythos 5.x) are not ZDR-eligible; Sonnet 5.5 is not a Covered Model | A | confirmed | Redirects to `/docs/en/manage-claude/api-and-data-retention`, as stated. The Covered Models list is Fable 5.2, Mythos 5.2, Fable 5.1, Mythos 5.1, Fable 5 and Mythos 5. Sonnet 5.5 is not on it |
| Location: `inference_geo` global/us; "Currently, "us" is the only available workspace geo" | A | confirmed | The cited URL now redirects to `/docs/en/manage-claude/data-residency`, which the document does not say. Minor |
| Subprocessors: DPA points to anthropic.com/subprocessors, list not read | B | honestly labelled; agree | DPA sentence is verbatim. I could not reach `trust.anthropic.com` either |
| Synthetic educational text: no restriction found; AUP "General information or educational content" is excluded from high-risk; grading that "determines admission, graduation, licensure, or certification" is high-risk; "Products serving minors … must comply with the additional guidelines" | B | honestly labelled; agree | All three quotes are verbatim. Context: "General information…" is under **Exclusions** ("The requirements do not apply to"). The grading item is under "Education and credentials", which also excludes multiple-choice testing. The minors sentence in full reads: "Products serving minors, **including organizations providing minors with the ability to directly interact with products that incorporate our API(s)**, must comply…". That wording bears on 3a below |

### 1d · Spend controls

| Finding | Grade | My result | Note |
|---|---|---|---|
| Tier caps Start $500 / Build $1,000 / Scale $200,000 / Custom none; "API usage pauses until 00:00 UTC on the first day of the next month"; HTTP 429 `enforced_spend_limit_reached` | A | confirmed | The page also says the spend-cap 429 **never** carries `retry-after`. Useful for client handling |
| Own spend limit: HTTP 400 "You have reached your specified API usage limits"; per workspace but not the default workspace | A | confirmed | The error type is `invalid_request_error`. A workspace limit uses "…specified workspace API usage limits". "You can't set spend limits on the default workspace." confirmed |
| Spend alerts: not found | — | agree, with an addition | I found no spend-alert feature in the rate-limits page or in the `platform.claude.com/llms.txt` index (searched for alert, notification, billing, spend, budget). The Spend Limits API exists but says it is "available to Claude Enterprise organizations only. It is not available to Claude Platform (Claude Console) organizations", so it does not apply here |
| Start-tier rate limits for Sonnet 5.5: 4,000 RPM / 2,000,000 ITPM / 400,000 OTPM | B | **confirmed; could be A** | I read the Start-tier table row myself: Sonnet 5.5, 4,000, 2,000,000, 400,000. The Evaluation-tier caveat is correct |
| Billing or enforcement lag: not found | — | agree, with an addition | I found **no statement of enforcement lag** for spend caps or limits. What exists is **reporting** lag: the legacy Usage and Cost API says data "typically appears within 5 minutes of API request completion, though delays might occasionally be longer", and the Usage and Cost Analytics API "typically refreshes within 4 hours … and can take up to 24 hours". This is about dashboards, not about blocking. Whether the cap itself can be overrun by a small amount is **not stated** either way |

---

## 2 · OpenAI

### 2a · Model and tier

| Finding | Grade | My result | Note |
|---|---|---|---|
| Models page quote ("use GPT-6 Astra … our flagship … Choose GPT-6.1 Sol to balance intelligence and cost, or GPT-6 Luna for…"); ID `gpt-6.1-sol` | A / B | confirmed; "mid-tier" B agreed | The full sentence reads "our flagship model for complex reasoning and coding" |
| `gpt-6.1-terra` $1 / $5, "A fast, efficient model" | A | confirmed | Pricing table and model page both give $1 / $5 |
| Paid tiers Build / Launch / Grow; automatic upgrade quote; Build needs $5 | A | confirmed | There is also a **Free** tier ($100 / month usage limit, "allowed geography"). The document says "paid tiers", so this is correct |

### 2b · Price

| Finding | Grade | My result | Note |
|---|---|---|---|
| $2 / $10; cached $0.10 | A | confirmed | Pricing page, Standard, short context |
| >272K: "…2x input and cache rates and 1.5x output for the full request" → $4 / $15 | A | confirmed (note) | The quote is on the **model page**, not the pricing page text I could extract (the pricing page has a Short/Long toggle). $4 / $15 is the document's own sum and is correct |
| Batch and Flex "50% lower than Standard" → $1 / $5 | A | confirmed (note) | On the model page. The pricing page's Flex/Batch row also shows $1.00 / $5.00 |
| Regional processing "adds a 10% premium where available" | A | confirmed | Model page. The pricing page adds: "charged a 10% uplift for models released on or after March 5, 2026" |
| No announced price change | A | confirmed | The only dated price note is about a different model ("GPT-5.6 Sol's promotional pricing is available until November 30, 2026") |

### 2c · Terms and data handling

| Finding | Grade | My result | Note |
|---|---|---|---|
| Training quote (March 1, 2023); "Data used for training: No" for `/v1/responses` and `/v1/chat/completions` | A | confirmed | The column header is "Data used for training". Both rows say "No" |
| Abuse logs "retained for up to 30 days"; `/v1/batches` application state "Until deleted" | A | confirmed | The full sentence adds "unless longer retention is required by law, or is reasonably necessary to protect our services or any third party from harm". **Missed:** the same table marks `/v1/batches` as **not** ZDR-eligible. So the batch discount and zero retention cannot be combined at OpenAI |
| ZDR / Modified Abuse Monitoring "subject to prior approval by OpenAI and acceptance of additional requirements" | A | confirmed | |
| Data residency per project for "eligible organizations", 10% uplift; "GPT-6.1 Sol and GPT-6.1 Terra support only US and EU data residency." | A | confirmed | |
| Subprocessors list not read | B | honestly labelled; agree | |
| Synthetic text: not checked | not found | agree | The Services Agreement and Usage Policies were blocked for me as well |

### 2d · Spend controls

| Finding | Grade | My result | Note |
|---|---|---|---|
| Hard spend limit ("Enforce a hard limit") stops requests: 429 `organization_spend_limit_exceeded` / `project_spend_limit_exceeded` | A | confirmed | Also: "Raising or removing the reached limit allows traffic to resume after the update propagates" |
| Spend alert: "Sends a notification; API traffic continues" | A | confirmed | Also: "Spend alerts do not enforce a cap" |
| OpenAI-approved usage limit (Build $500 / Launch $5,000 / Grow $200,000) gives `organization_usage_limit_exceeded`; that it stops requests is inferred | B | honestly labelled; **agree, and the evidence is stronger than stated** | The spend-limits page: "If requests fail because of a billing-related limit or credit balance: Check error.code to identify whether the request reached … OpenAI-assigned usage limit … For organization_usage_limit_exceeded, request a higher approved usage limit." This treats it as a request failure. **Missed:** `credit_balance_exhausted` ("the organization exhausted its prepaid credits") is a further stop. With prepaid credit, the credit balance is a hard ceiling too |
| Lag: "Enforcement is not instantaneous. The API Platform can process a small amount of extra usage while the limit state propagates, so recorded spend can slightly exceed the configured amount." | A | confirmed | Verbatim. A shorter version is also in the page introduction |
| Build-tier rate limits for Astra, Sol and Terra: 5,000 RPM / 1,000,000 TPM | A | confirmed | |

---

## 3 · Google

### 3-I · Gemini Developer API

| Finding | Grade | My result | Note |
|---|---|---|---|
| None of (a)–(e) readable; Gemini API terms not reported from memory | not found | confirmed | Same redirect for me. Correct not to fill this in from memory |
| `policies.google.com/terms/generative-ai`: last modified Aug 9, 2023; no longer applies since May 22, 2024 | A | confirmed (note) | The page says "As of **that date**" (meaning May 22, 2024). The document puts `[May 22, 2024]` in brackets as an editorial substitution. That is acceptable and clearly marked |
| `business.safety.google/subprocessors/` reachable; unclear whether it covers the Gemini Developer API | B | honestly labelled; agree | The readable part of that page is about Google Workspace / RCS subprocessors. I saw nothing that ties it to the Gemini Developer API. I would read it as "probably not the relevant list" |

### 3-II · Vertex AI / Gemini Enterprise Agent Platform

**(a) Model**

| Finding | Grade | My result | Note |
|---|---|---|---|
| Pricing page lists Gemini 3.8 Flash as the current Flash model; Pro only as Gemini 3.1 Pro Preview; API ID not found | — | **confirmed as worded, but incomplete** | Literally true. But the same page **opens with a "Gemini 4" section**: **Gemini 4 Hydrogen** ($1.50 / $7.50, global), **Gemini 4 Carbon** and **Gemini 4 Argon** ($2.00 / $10.00 "through November 30, 2026", then $4.00 / $20.00 "Starting December 1, 2026"; the footnote says the promotional price is "provided through 50% credits back on net spend"). The document does not mention them. If the owner wants a $2 / $10 comparison, that model was available until 30 November and is now $4 / $20. I have not checked whether any Gemini 4 model is GA or preview |
| Tier: ordinary Cloud Billing pay-as-you-go | B | honestly labelled; agree | |

**(b) Price.** Page: `cloud.google.com/vertex-ai/generative-ai/pricing` → `cloud.google.com/model-garden/pricing`, titled "Agent Platform Pricing | Google Cloud". confirmed.

| Finding | Grade | My result | Note |
|---|---|---|---|
| 3.8 Flash $0.75 / $3.75 through 31 Dec 2026 ("offered with introductory pricing … through December 31, 2026") | A | confirmed | Page banner plus the table row "Gemini 3.8 Flash* through December 31, 2026". **Nuance:** the `*` footnote after that table reads "Promotional pricing provided through 50% credits back on net spend on select models within a given period". So the $0.75 may be billed at $1.50 and half credited back. That would affect how a Cloud budget sees the spend. Not settled; B |
| From 1 Jan 2027 $1.50 / $7.50 ("Starting January 1, 2027, standard pricing of $1.5 / $7.5 … will apply") | A | confirmed | |
| Non-global $0.825 / $4.125 (intro); $1.65 / $8.25 (2027) | A | confirmed | |
| Flex/Batch $0.375 / $1.875 (intro); $0.75 / $3.75 (2027) | A | confirmed | Under the "Flex/Batch" tab |
| >200K same price as ≤200K | A | confirmed | The ≤200K and >200K columns hold the same values |
| 3.1 Pro Preview $2 / $12 (≤200K); $4 / $18 (>200K) | A | confirmed | |
| "Pricing for cache write effective January 12, 2027", given as a note under the 3.8 Flash table | A | **differs (context)** | The text is verbatim, but it is a footnote (`***`) to the **Gemini 4** tables (Hydrogen's cache-write column). It is not about Gemini 3.8 Flash, whose table has no cache-write column. The document's "Separately, the page notes…" sits under the 3.8 Flash table and reads as if it applied there |

**(c) Terms.** Google Cloud Service Specific Terms, "(Last modified November 11, 2026)", heading "AI / ML Services": confirmed.

| Finding | Grade | My result | Note |
|---|---|---|---|
| §18 Training Restriction quote | A | confirmed | Heading: "18. Training Restriction (formerly Section 17 (Training Restriction))" |
| §20(h) retention quote; no numeric period or ZDR switch found | A / B | confirmed; B agreed | Heading "h. Handling of Prompts and Generated Output." I found no numeric period in the terms either |
| AI/ML Data Location quote; data-residency list entry | A (§ number B) | confirmed; **§ number can be A** | The page numbers it explicitly: "16. AI/ML Data Location (formerly Section 15 (AI/ML Data Location))". The data-residency list entry is verbatim |
| Subprocessors entry "AI Platform/Gemini platform (formerly Vertex AI), Generative AI Services" | A | confirmed | |
| Synthetic text: no restriction found; limits are §20(c), (d), (e) | B | honestly labelled; agree | §20(c) brings in the Generative AI Prohibited Use Policy. I did not read that policy |

**(d) Spend controls: not found.** confirmed. I could not reach the docs either and did not assert anything from memory.

**(e) Under-18 restriction.** See 3a below.

| Finding | Grade | My result | Note |
|---|---|---|---|
| §20(d) quote | A | confirmed | Section heading: "20. Generative AI Services (formerly Section 19 (Generative AI Services))", under "AI / ML Services". Subsection heading "d. Age Restrictions." Text verbatim |
| §20(f): suspension for "any suspected violation of Section 17(b) or subsection (d) above" | A | confirmed | 17(b) is "Model Restrictions" |
| §20(g): (d) is a "Restriction" under the Agreement | A | confirmed | Verbatim: "The restrictions contained in subsections (d) and (e) above are deemed to be "Restrictions" or "Use Restrictions" under the applicable Agreement." |

---

## 3a · §20(d) and an educator-only feature (INTERPRETATION, not provider text, not legal advice)

**What the provider says (verified):** "Customer will not, and will not allow End Users to, use a Generative AI Service as
part of a website, Customer Application, or other online service that is directed towards or is likely to be accessed by
individuals under the age of 18."

**My reading.** The test applies to the **service the AI is part of**, not to the feature or the person who triggers it.
It does not ask who uses the AI. It asks whether the website, application or online service that contains the AI is
"directed towards or … likely to be accessed by" under-18s. PINTAR is one platform that learners under 18 use. On a plain
reading, a Gemini drafting feature "as part of" PINTAR is caught even if only educators can see it. Educators are End
Users, and the clause also says Customer "will not allow End Users to" do it.

The narrower argument is that the educator tool is a **separate "online service"** that minors cannot reach and are not
likely to reach. It would need its own app or origin, its own sign-in, and no learner access. That argument is
available but not safe. "Likely to be accessed by" looks at likelihood, not intent. A shared brand, domain, account
system or database makes "separate service" hard to defend. §20(f) lets Google suspend on a **suspected** violation, not
a proven one. And §20(g) makes it a contractual Restriction.

**Conclusion I would offer Sharon:** treat Vertex Gemini as **not usable inside PINTAR as it is now built**, unless (i)
the educator feature is structurally a separate service that learners cannot access, **and** (ii) Google confirms in
writing that this arrangement is outside §20(d). The Gemini Developer API's own under-18 wording is still unread. It
should not be assumed to be looser.

**For contrast (verified text, my reading):** Anthropic's Usage Policy does not prohibit this. It requires "Products
serving minors, including organizations providing minors with the ability to directly interact with products that
incorporate our API(s)" to follow the minors guidelines (age verification, content moderation, child-safety system
prompt, COPPA-type compliance, AI disclosure). An educator-only feature that minors never interact with directly is
arguably not "direct interaction". But PINTAR as a whole serves minors, so following those guidelines is the prudent
reading. OpenAI's equivalent terms were not readable.

---

## 4 · Side-by-side table: does each cell follow from §1–§3?

| Row | Anthropic | OpenAI | Google | My result |
|---|---|---|---|---|
| In / out | ✔ | ✔ | ✔ | All follow. The table leaves out Gemini 4 (see 3-II a) |
| Long-prompt surcharge | ✔ | ✔ (cache rates also 2×) | ✔ | Follow |
| Batch −50% | ✔ | ✔ | ✔ (Flex/Batch) | Follow. Note that OpenAI `/v1/batches` is not ZDR-eligible |
| Trains on API data | ✔ | ✔ | ✔ | Follow. Google's is "without Customer's prior permission or instruction", and Anthropic's excludes submitted feedback |
| Default retention | ✔ but incomplete | ✔ but incomplete | **paraphrase shown in quotes** | Anthropic: "≤30 days" leaves out flagged content (up to 2 years / scores 7 years). OpenAI: "≤30 days (abuse logs)" leaves out application state (e.g. batches "Until deleted"). Google: "no longer than reasonably necessary" is in quote marks but is **not verbatim**. The terms say "for longer than is reasonably necessary to create the Generated Output", and Generated Output is not stored outside the Customer's Account at all. Suggest removing the quote marks or quoting exactly |
| Zero retention | ✔ | ✔ | ✔ | Follow |
| Region control | ✔ (1.1× = +10%) | ✔ ("eligible organizations") | ✔ | Follow |
| Hard spend stop | ✔ | ✔ | ✔ (not found) | Follow. Anthropic has no stated lag either way; "yes" is right, but "no lag" should not be read into it. OpenAI also stops at the approved usage limit and when prepaid credit runs out |
| Under-18 term | ✔ | ✔ (not read) | ✔ | Follow. The Google cell is a fair short form of §20(d), but leaves out "directed towards" and the suspension power in §20(f) |

No cell contradicts §1–§3. Three cells are incomplete or slightly misquoted (retention row; Google in/out leaving out
Gemini 4).

---

## 5 · Extra searching on platform.claude.com for spend limits, lag and alerts

As asked, I looked beyond the rate-limits page. Using the `platform.claude.com/llms.txt` index, I read the Spend Limits
API page, the Usage and Cost Analytics API page and the legacy Usage and Cost API page.

- **No spend-alert or notification feature** for Claude Console organisations is documented in those pages or the index.
- The **Spend Limits API** (per-member limits, increase requests) is "available to Claude Enterprise organizations only.
  It is not available to Claude Platform (Claude Console) organizations." It does not apply to an API-key organisation.
- **No enforcement-lag statement** was found. There is reporting lag: about 5 minutes (legacy API) and up to 24 hours
  (Analytics API), with revisions possible "until about 7 days after the end of the calendar month".
- The spend-cap 429 has no `retry-after`. The Claude Code workspace is checked separately and can return a 429 with
  `retry-after`.

The document's "not found" for Anthropic alerts and lag stands. It should not be taken to mean "zero lag".

---

## 6 · Separation

### (i) Provider statements verified verbatim (this session, 16 Nov 2026)

All 44 confirmed grade-A items above. The key ones are: the three model IDs and prices. Anthropic `claude-sonnet-5-5`
is $2 / $10, Batch $1 / $5, with no long-context surcharge. OpenAI `gpt-6.1-sol` is $2 / $10, $4 / $15 above 272K, and
Batch/Flex $1 / $5. Gemini 3.8 Flash on Vertex is $0.75 / $3.75 to 31 Dec 2026, then $1.50 / $7.50, Flex/Batch is half
that, and there is no surcharge above 200K. On spend: Anthropic tier caps and own limits stop requests (429
`enforced_spend_limit_reached` / 400). OpenAI hard limits stop requests (429 `*_spend_limit_exceeded`) and alerts only
notify. OpenAI states "Enforcement is not instantaneous…". Google Cloud Service Specific Terms §18, §16, §20(d), (f),
(g) and (h) are verbatim.

### (ii) Interpretations (the author's and mine)

- Author: new Anthropic organisation starts in Evaluation/Start. GPT-6.1 Sol is "mid-tier". Vertex is ordinary
  pay-as-you-go. OpenAI's usage limit stops requests. Synthetic educational text is not restricted by any provider term
  read. I agree with all of these. The usage-limit inference has stronger support than the document says.
- Mine: §20(d) catches an educator-only feature inside a platform minors use, unless it is a structurally separate
  service and Google confirms in writing (3a). Anthropic's minors guidelines should be followed even for an
  educator-only feature. `business.safety.google` is probably not the Gemini API subprocessor list. Gemini 3.8 Flash's
  intro price may work through credits back.

### (iii) Gaps

1. **Gemini 4 family omitted** (Hydrogen, Carbon, Argon) from a page the document read. Carbon/Argon were $2 / $10 to
   30 Nov 2026 and are $4 / $20 from 1 Dec 2026. Hydrogen is $1.50 / $7.50.
2. **Cache-write note placed in the wrong context** (it belongs to Gemini 4, not 3.8 Flash).
3. **OpenAI `/v1/batches` is not ZDR-eligible**, and **`credit_balance_exhausted`** is another stop. Neither is in the document.
4. **Retention row in §4**: incomplete for Anthropic and OpenAI. The Google wording is in quote marks but is not verbatim.
5. **Gemini 3.8 Flash intro price is delivered through "50% credits back"** (footnote). How a Cloud budget counts it is unknown.
6. Still unread, as the document says: the Gemini Developer API (all of it), Vertex model IDs, quotas and budget
   behaviour, OpenAI legal terms and subprocessors, and Anthropic subprocessors. These were blocked for me in the same
   way (§0).
7. Small points: the Anthropic data-residency URL now redirects, which is not noted. Start-tier rate limits and the
   Google §16 number can be raised to A.

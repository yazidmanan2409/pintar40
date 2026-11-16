Exploratory, read 16 November 2026 by a research assistant to the Chief Architect. Prepared by an Anthropic model; one evaluated competitor is Anthropic. Not an evaluation, and no authorisation.

# E — Exploratory feasibility: Kimi (Moonshot AI), DeepSeek, Qwen (Alibaba Cloud Model Studio, international)

Scope: educator-reviewed MCQ drafting (educators only; learners never interact with the feature). This note does **not** change provider evaluation E (Anthropic, OpenAI), and none of E's files were touched.

Method: read-only HTTPS GETs of official public pages, one request per URL, with no redirect following to unlisted hosts. No account, sign-in, terms acceptance, API key, API call, spend, or upload of educational material. All pages were read on **16 November 2026**.

Grades: **A** = read verbatim on an official page. **B** = official but indirect or inferred. **NOT FOUND** = with reason.
Every section keeps three kinds of material apart: **Verified** (quotations), **Interpretation** (labelled, mine), and **Unknown**.

---

## §0 Gaps (unreachable or unread pages)

| # | Page / host | What happened | Effect |
|---|---|---|---|
| G1 | `https://platform.moonshot.ai/docs/pricing/chat`, `https://platform.moonshot.ai/docs/overview` | HTTP 301 to `https://platform.kimi.ai/...`. That host is **not on the allowlist**, so I did not make a second request. | **Kimi API docs, pricing, limits and errors: not reachable.** |
| G2 | Kimi legal pages linked from `www.moonshot.ai`: `https://www.kimi.ai/user/agreement/modelUse?version=v2`, `https://www.kimi.ai/user/agreement/userPrivacy?version=v2` | Host `www.kimi.ai` is not on the allowlist, so these were not requested. | **Kimi terms, privacy, age clause and data location: not reachable.** |
| G3 | `https://platform.deepseek.com/` | HTTP 403 (919-byte body), probably a bot challenge or access block. I made no attempt to get past it. | The DeepSeek console (balance and top-up pages) is not readable. |
| G4 | `https://status.deepseek.com/` | Connection reset by peer (curl error 35). I did not retry. | DeepSeek status and uptime are not read. |
| G5 | `https://api-docs.deepseek.com/faq/` | The page shell loaded, but the FAQ content lives at `static.deepseek.com` (unlisted), so it was not requested. | DeepSeek FAQ (billing and refund details) is not read. |
| G6 | Alibaba Cloud *International Website Membership Agreement* (which names the contracting entity), Model Studio billing-centre and budget pages, the Singapore region page, any status page | Not read in this pass. The host was allowed; the pages were out of my reading budget. | Contracting entity for an Indonesian customer, paid-tier spending caps and the definition of the "International" inference scope are **unknown**. |
| G7 | Indonesian-language claims (all three providers) | No statement found on the pages read. | See each §x.3. |

Hosts added to the environment allowlist for this reading (read-only purpose): `platform.moonshot.ai`, `www.moonshot.ai`, `api-docs.deepseek.com`, `platform.deepseek.com`, `www.deepseek.com`, `cdn.deepseek.com`, `status.deepseek.com`, `www.alibabacloud.com`. Of these, `platform.moonshot.ai` only redirected (G1), and `platform.deepseek.com` and `status.deepseek.com` were not usable (G3, G4).

---

## §1 Kimi (Moonshot AI)

Sources read: `https://www.moonshot.ai/` (A, marketing home page). Everything else is blocked by G1 and G2.

### 1.1 Models and API
- **Verified (A, www.moonshot.ai):** The home page lists "Kimi K3.1 Pro" (dated 2026-10-24) and "Kimi K3" (dated 2026-07-16). It says of K3.1 Pro: "A 3-trillion-parameter-class model with a 1-million-token context window—built for long-horizon coding, 3D creation, financial research, and complex agentic tasks." The navigation has "Open Platform", "Pricing" and "API" links pointing to `platform.kimi.ai`.
- **Verified (A, Alibaba Model Studio, `https://www.alibabacloud.com/help/en/model-studio/text-generation-model`):** Model Studio lists third-party models `kimi-k3.1-pro` ("Structured output: Supported (JSON Mode)") and `kimi-k3` ("Supported"). Alibaba's Product Terms §4.48 say third-party models on Model Studio fall under "the Marketplace Supplemental to the Membership Agreement" and that "your Alibaba Cloud contracting entity is the invoicing party".
- **Interpretation:** Kimi models may be reachable through Alibaba Model Studio under Alibaba's contract. That would be a different contracting route from Moonshot's own platform, and I have not assessed it.
- **NOT FOUND (G1):** API model identifiers on Moonshot's platform, endpoint style, JSON/structured output, usage fields and request id.

### 1.2 Commercial eligibility: NOT FOUND (G2)
### 1.3 Indonesian capability: NOT FOUND (no statement on the home page; docs not reachable)
### 1.4 Prices: NOT FOUND (G1). No cost per draft can be computed.
### 1.5 Data handling: NOT FOUND (G2)
### 1.6 Spend and rate controls: NOT FOUND (G1)
### 1.7 C3w-relevant facts: NOT FOUND (G1)

---

## §2 DeepSeek

Sources (all read 16 Nov 2026):
- S-D1 `https://api-docs.deepseek.com/` ("Your First API Call")
- S-D2 `https://api-docs.deepseek.com/quick_start/pricing/` ("Models & Pricing")
- S-D3 `https://api-docs.deepseek.com/quick_start/rate_limit/`
- S-D4 `https://api-docs.deepseek.com/quick_start/error_codes/`
- S-D5 `https://api-docs.deepseek.com/guides/json_mode/`
- S-D6 `https://api-docs.deepseek.com/api/create-chat-completion/`
- S-D7 `https://api-docs.deepseek.com/quick_start/token_usage/`
- S-D8 `https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html` ("Release date: April 22, 2026 Effective date: April 29, 2026")
- S-D9 `https://cdn.deepseek.com/policies/en-US/deepseek-terms-of-use.html` ("Last Update: March 27, 2026")
- S-D10 `https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html` ("Last Update: Feb 10, 2026")

### 2.1 Models and API integration
**Verified:**
- (A, S-D1) "The DeepSeek API uses an API format compatible with OpenAI/Anthropic." Base URLs are `https://api.deepseek.com` (OpenAI format) and `https://api.deepseek.com/anthropic` (Anthropic format).
- (A, S-D2) The model names are `deepseek-flash` (model version "DeepSeek-V4.1-Flash-1017") and `deepseek-v4-pro` ("DeepSeek-V4-Pro-0813"). Both show "Context length 1M" and "Maximum: 384K" output. The page says "Supports both non-thinking and thinking (default) modes". Both are ticked for "Json Output" and "Tool Calls". It also says: "The legacy names deepseek-v4-flash and deepseek-v4-flash-vision-exp are still accepted, but the corresponding models have been retired".
- (A, S-D5) "Set the response_format parameter to {'type': 'json_object'}." "Include the word "json" in the system or user prompt". And: "if the model's output cannot be recognized as JSON, the API replaces the non-JSON content with spaces … the returned content may contain only spaces (appearing empty, even when finish_reason is stop)."
- (A, S-D6) Per response: `id`, described as "A unique identifier for the chat completion". `usage` includes `prompt_tokens` ("equals prompt_cache_hit_tokens + prompt_cache_miss_tokens"), `prompt_cache_hit_tokens`, `prompt_cache_miss_tokens`, `completion_tokens`, `total_tokens` and `completion_tokens_details.reasoning_tokens`. When streaming, usage is carried on the last chunk.

**Interpretation:** On the pages read, structured output is JSON-object mode only. I found no JSON-Schema or strict mode, so schema conformance would have to be validated on PINTAR's side. Thinking mode is the default, so its reasoning tokens would presumably be billed as output (unverified). That could push output above the 6,000–12,000 range used in §2.4.

### 2.2 Commercial eligibility
**Verified:**
- (A, S-D8) The Open Platform Terms apply to use "as an individual developer or on behalf of an enterprise developer … for developing applications, services, or tools for internal organizational use or end users." The operator is "Hangzhou DeepSeek Artificial Intelligence Co., Ltd."
- (A, S-D8, age) "We particularly advise you to read (minors under the age of 18 shall read in the presence of a legal guardian) and fully understand all these Terms."
- (A, S-D9 §2.1, age) "The Services are primarily intended for adults. If you are under 18 years old or the minimum age required in your country, please read these Terms with your legal guardian and use the Services only with the consent of your legal guardian."
- (A, S-D8 §10.1) Disputes "shall be governed by the laws of the People's Republic of China in the mainland". §10.2 provides for litigation in a court with jurisdiction over "the location of the registered office of Hangzhou DeepSeek Artificial…" (text truncated in my extract).
- (A, S-D8 §3.3) "You shall obtain the consent of end users or have other legal basis for the collection, processing of personal information, and delegation of personal information processing to us."
- (A, S-D8) Export control: Services "may not be used in or for the benefit of … any country subject to comprehensive sanctions".

**Unknown:** Whether sign-up from Indonesia is accepted, and which countries are eligible. No country list was found, and the console was blocked (G3).
**Interpretation:** The age clauses address the account holder and user of DeepSeek's services. PINTAR's account holder and users of this feature would be educators. I found no clause specifically about platforms whose wider audience includes under-18s.

### 2.3 Indonesian language and structured output
- Indonesian: **NOT FOUND** on the pages read. S-D7 mentions only English and Chinese token ratios.
- Structured output: see 2.1 (A).

### 2.4 Prices (USD per 1M tokens; A, S-D2)

| Model | Input, cache hit (off-peak / peak) | Input, cache miss (off-peak / peak) | Output (off-peak / peak) |
|---|---|---|---|
| deepseek-flash | $0.003 / $0.006 | $0.15 / $0.30 | $0.60 / $1.20 |
| deepseek-v4-pro | $0.022 / $0.044 | $0.66 / $1.32 | $1.98 / $3.96 |

- (A) "Off-peak rates are half of the peak rates. Peak hours are 01:00 - 04:00 and 06:00 - 10:00 UTC, Monday through Friday, excluding Chinese public holidays."
- (A) "Product prices may vary and DeepSeek reserves the right to adjust them."
- No announced future change was found.

**Cost per draft.** The working assumption is one request per chapter, giving 15 drafts, with input of 3,000–4,000 tokens and output of 6,000–12,000 tokens. Cache misses are assumed, which is conservative. The formula is: request cost = (in × p_in + out × p_out) / 1e6, and per draft = request cost ÷ 15.

- deepseek-flash, peak:
  - low: (3,000×0.30 + 6,000×1.20)/1e6 = 0.0009 + 0.0072 = **$0.00810/request** → **$0.000540/draft**
  - high: (4,000×0.30 + 12,000×1.20)/1e6 = 0.0012 + 0.0144 = **$0.01560/request** → **$0.001040/draft**
- deepseek-flash, off-peak: **$0.00405–$0.00780/request** → **$0.000270–$0.000520/draft**
- deepseek-v4-pro, peak:
  - low: 0.00396 + 0.02376 = **$0.02772/request** → **$0.001848/draft**
  - high: 0.00528 + 0.04752 = **$0.05280/request** → **$0.003520/draft**
- deepseek-v4-pro, off-peak: **$0.01386–$0.02640/request** → **$0.000924–$0.001760/draft**

Interpretation: if thinking mode is left on, reasoning tokens are likely to add to output (see 2.1).

### 2.5 Data handling
**Verified:**
- (A, S-D9 §4.3) "we may, to a minimal extent, use Inputs and Outputs to provide, maintain, operate, develop or improve the Services or the underlying technologies supporting the Services. If you refuse … you can opt out by turning off "Improve the model for everyone"."
- (A, S-D8 §4.2) "You retain any rights, title, and interests—if any—in the Inputs you submit; (2) We assign any rights, title, and interests—if any—in the Outputs of the Services to you".
- (A, S-D10) "To provide you with our services, we directly collect, process and store your Personal Data in People's Republic of China."
- (A, S-D10) "We retain Personal Data for as long as necessary to provide our Services and for the other purposes set out in this Privacy Policy."
- (A, S-D10) "Personal Data collected from end users when accessing downstream systems or applications developed by developers using our open platform services are not covered by this privacy policy."
- (A, S-D3) `user_id` is used for "KVCache Isolation … for privacy management", with the note "Do not include user privacy information in user_id."

**Unknown:**
- Whether the "Improve the model for everyone" opt-out applies to API traffic, or how it is set for API traffic.
- A retention period for API inputs and outputs.
- Any zero-retention option. None was found.
- A named subprocessor list. Not found; the policy refers only generically to "third party vendors".
- A data processing agreement or cross-border transfer clauses beyond "Where required, we will use appropriate safeguards for transferring Personal Data outside of certain countries".

**Fact relevant to cross-border transfer:** the processing and storage location stated is the People's Republic of China (A). No legal conclusion is drawn.

### 2.6 Spend and rate controls
- (A, S-D8 §6.1) "When you use our paid services, you may need to prepay for the Services. Your balance will be consumed … we reserve the right to suspend or terminate Services if your balance is insufficient."
- (A, S-D2) Fees "will be directly deducted from your topped-up balance or granted balance".
- (A, S-D4) "402 - Insufficient Balance … You have run out of balance."
- (A, S-D3) Concurrency limit per account: deepseek-flash 2,500, deepseek-v4-pro 500. "when the concurrency limit is exceeded, you will receive an HTTP 429 error code". Expansion is available on request "with no additional cost".
- **Interpretation:** the prepaid balance works as a hard ceiling. Exhausting it gives a 402 per the error table.
- **Unknown:** enforcement lag (none documented); any alert-only budget feature (console blocked, G3); refund mechanics in detail (S-D8 mentions a refund review "after deducting necessary costs such as handling fees"); status page (G4).

### 2.7 Facts for C3w
| Need | Fact | Grade |
|---|---|---|
| Per-response usage for the cost ledger | `usage` with cache hit and miss split, `completion_tokens`, `reasoning_tokens` | A (S-D6) |
| Request id | `id`, "unique identifier for the chat completion". No request-id header documented on the pages read | A for body id; header NOT FOUND |
| Limit error codes | 429 (rate/concurrency), 402 (balance), 503 (overloaded) | A (S-D4) |
| Idempotency key | NOT FOUND | — |
| Hard ceiling | Prepaid balance plus 402 | A (S-D8, S-D4); ceiling interpretation B |

---

## §3 Qwen (Alibaba Cloud Model Studio, international)

Sources (all read 16 Nov 2026, `https://www.alibabacloud.com/help/en/...`; the page's own "Last Updated" date is in brackets):
- S-Q1 `model-studio/models` [Nov 16, 2026]
- S-Q2 `model-studio/text-generation-model` [Nov 16, 2026]
- S-Q3 `model-studio/qwen3-7-plus` [Oct 11, 2026]
- S-Q4 `model-studio/qwen-structured-output` [Nov 16, 2026] (reached via a same-host 301 from `json-mode`)
- S-Q5 `model-studio/compatibility-of-openai-with-dashscope` [Nov 16, 2026]
- S-Q6 `model-studio/model-pricing` [Nov 16, 2026]
- S-Q7 `model-studio/rate-limit` [Nov 16, 2026]
- S-Q8 `model-studio/error-code` [Nov 15, 2026]
- S-Q9 `model-studio/regions` [Nov 12, 2026]
- S-Q10 `model-studio/privacy-notice` [Oct 11, 2026]
- S-Q11 `model-studio/new-free-quota` [Nov 16, 2026]
- S-Q12 `legal/latest/alibaba-cloud-international-website-product-terms-of-service-v-3-8-0` [Oct 19, 2026]
- S-Q13 `legal/latest/alibaba-cloud-international-website-privacy-policy` [Sep 04, 2026]

### 3.1 Models and API integration
**Verified:**
- (A, S-Q2) "Start here: qwen3.7-plus balances capability and cost. Prioritize quality: qwen4-max … Prioritize cost: qwen3.8-flash". All three are listed as 1M context with "Structured output: Supported".
- (A, S-Q3) qwen3.7-plus "is functionally equivalent to the snapshot model qwen3.7-plus-2026-05-26". The "Inference Service Provider … is Alibaba Cloud Model Studio". The Singapore "Scope: International" column reads "Structured Outputs Supported". The page gives max output 131,072.
- (A, S-Q5) OpenAI-compatible Chat Completions. The example base URL is `https://{WorkspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`, and the example response includes `"id": "chatcmpl-xxx"` and `"usage": {"completion_tokens", "prompt_tokens", "total_tokens"}`.
- (A, S-Q4) "JSON Schema mode: Ensures the output conforms to a specified structure. Usage: set response_format to {"type": "json_schema", "json_schema": {..., "strict": true}}". JSON Schema is supported for "The qwen4-max, Qwen3.7-Plus series, Qwen3.7-Flash series, Qwen3.7-Max series, Qwen3.8-Max series, and Qwen3.8-Flash series models". JSON Object mode "does not guarantee stable key names or field types".
- (A, S-Q9) "The DashScope domain (dashscope.aliyuncs.com) will no longer support new features after September 30, 2026." The workspace-dedicated domain is "Recommended for production environments". It also says: "Each region has its own endpoint, API Key, and model list. These cannot be used across regions."

### 3.2 Commercial eligibility
**Verified:**
- (A, S-Q13) "The Alibaba Cloud Platform and the Cloud Services are not intended for minors (persons under the age of 18). Minors must not use the Alibaba Cloud Platform and the Cloud Services for any purpose."
- (A, S-Q13) "Many of our Cloud Services offered through the Alibaba Cloud Platform are intended for use by business organisations." Registration covers "(i) an individual or (ii) a representative of a business organisation".
- (A, S-Q12 §5.8) "This Agreement shall be governed by the laws of Singapore … exclusive jurisdiction of the courts of Singapore."
- (A, S-Q12 §2.1) The contracting entity "is specified in the Alibaba Cloud International Website Membership Agreement" (not read; G6).
- (A, S-Q12 §4.48) Model Studio-specific terms exist, covering the end-user acknowledgements and third-party model marketplace terms quoted in §1.1.
- (A, S-Q11) "Starting September 15, you must complete your account information before activating Model Studio."

**Unknown:** Whether Indonesia is an eligible country and which entity contracts with an Indonesian customer (G6).
**Interpretation:** The under-18 clause bars minors from using Alibaba Cloud services. In this design, the users of the drafting feature are educators. Whether the clause has any implication for a platform whose learners are under 18 is a question for Sharon or legal; I draw no conclusion.

### 3.3 Indonesian language and structured output
- Indonesian: **NOT FOUND** on the pages read. S-Q2 mentions only "Qwen-MT translates text across languages".
- Structured output: strict JSON Schema for qwen3.7-plus and qwen3.8-flash (A, S-Q4).

### 3.4 Prices (USD per 1M tokens, Singapore / International scope)

| Model | Input | Output | Cache | Source |
|---|---|---|---|---|
| qwen3.7-plus (≤256K input) | $0.40 | $1.60 | implicit cache $0.08; explicit cache creation $0.50; explicit cache read $0.04 | A, S-Q3 |
| qwen3.7-plus (256K–1M) | $1.20 | $4.80 | implicit $0.24; creation $1.50; read $0.12 | A, S-Q3 |
| qwen3.8-flash (≤1M) | $0.15 | $0.47 | "context caching discount" (rate not extracted) | A, S-Q6 |

- (A, S-Q6) "Model API calls are billed on a pay-as-you-go basis by default." "explicit cache creation is billed at 125% of the standard input price, and cache hits at 10%".
- (A, S-Q6) For qwen3.7-plus: "List price $0.4 (Limited-time 20% off)" and "List price $1.6 (Limited-time 20% off)". Thinking-mode output is also $1.6 list.
- (A, S-Q3) "This page only shows the original pricing … excluding any limited-time promotions."
- (A, S-Q11) A new-user free quota of 1 million tokens per model is available in Singapore only, valid for 90 days.
- No time-of-day discount was found. The end date of the 20% promotion is unknown.

**Cost per draft** (same working assumption as §2.4; standard input; ≤256K tier):
- qwen3.7-plus, list price:
  - low: (3,000×0.40 + 6,000×1.60)/1e6 = 0.0012 + 0.0096 = **$0.01080/request** → **$0.000720/draft**
  - high: (4,000×0.40 + 12,000×1.60)/1e6 = 0.0016 + 0.0192 = **$0.02080/request** → **$0.001387/draft**
- qwen3.7-plus with the limited-time 20% off (×0.8): **$0.00864–$0.01664/request** → **$0.000576–$0.001109/draft**
- qwen3.8-flash:
  - low: 0.00045 + 0.00282 = **$0.00327/request** → **$0.000218/draft**
  - high: 0.0006 + 0.00564 = **$0.00624/request** → **$0.000416/draft**

### 3.5 Data handling
**Verified:**
- (A, S-Q10) "Alibaba Cloud strictly protects your data privacy and will never use your data for model training."
- (A, S-Q10) "In compliance with relevant laws and regulations, Alibaba Cloud Model Studio stores data generated from model and application calls."
- (A, S-Q9) "Regions determine the access point and data storage location." "Service deployment scope: Determines the inference execution location." "Request data is stored in that region. The region forwards the request to inference nodes within the service deployment scope … Your static data always remains in the selected region." Singapore is region `ap-southeast-1`.
- (A, S-Q8) Call records, "including the Request ID, status code, error code, request and response content", can be queried on the Model Monitoring page. "Inference logging must first be enabled".
- (A, S-Q13) Third-party service providers "may be located in Singapore or outside of Singapore".
- (A, S-Q10) "SOC 2 compliance with an unqualified opinion".

**Unknown:**
- Retention period for stored call data.
- Any zero-retention option. None was found.
- A named subprocessor list.
- The geographic boundary of the "International" inference scope (G6).
- Data-transfer or DPA terms specific to Model Studio.

**Facts relevant to cross-border transfer:** data from Indonesia would be stored in the chosen region; Singapore is the region with the free quota and the "International" scope. Inference happens within the chosen deployment scope. No legal conclusion is drawn.

### 3.6 Spend and rate controls
- (A, S-Q6) Pay-as-you-go (postpaid) by default.
- (A, S-Q11) "After the free quota is exhausted, you are automatically billed on a pay-as-you-go basis. To avoid unexpected charges, enable Free Quota Only in advance so that the service stops when the quota runs out." "Worry-free mode (Free Quota Only) is disabled by default". This hard stop applies only to the free quota.
- (A, S-Q8) "Arrearage — Access denied, please make sure your account is in good standing … The Alibaba Cloud account associated with the API Key has an overdue payment". "After recharging, system balance updates may be delayed". That is the only lag statement found, and it concerns restoring access, not stopping it.
- (A, S-Q7) For qwen3.7-plus (International), the limits are 15,000 RPM and 5,000,000 TPM. qwen3.8-flash is under "Dynamic Rate Limiting". "Rate limits are applied at the account level". "Requests that exceed the limits are rejected with a 429 error and typically recover automatically within one minute."
- (A, S-Q9) SLA "99.9%" for the workspace-dedicated and DashScope domains; the trial domain is "Not provided".
- **Unknown:** a hard spending cap on paid usage (not found; billing-centre pages not read, G6); budget alerts; a status page.

### 3.7 Facts for C3w
| Need | Fact | Grade |
|---|---|---|
| Per-response usage | `usage` {prompt_tokens, completion_tokens, total_tokens} in the example response; cache-token fields not confirmed | A (example), B (guaranteed field set) |
| Request id | "The Request ID is in UUID format … and is included in the Header or Body of the API response"; the response body also has `id` | A (S-Q8, S-Q5) |
| Limit error codes | 429 `Throttling.RateQuota`, `Throttling.AllocationQuota`/`insufficient_quota`, `Throttling.ResourceExhausted`; `Arrearage` (overdue); 503 `ServiceUnavailable` | A (S-Q7, S-Q8) |
| Idempotency key | NOT FOUND | — |
| Hard ceiling | Only "Free Quota Only" for the free tier. Paid usage is postpaid and no hard cap was found | A / NOT FOUND |

---

## §4 Side-by-side facts (no recommendation)

| Item | Kimi (Moonshot) | DeepSeek | Qwen (Model Studio intl.) |
|---|---|---|---|
| Docs reachable | No (G1, G2) | Yes (console G3, status G4 not) | Yes |
| Mid-tier model id | NOT FOUND (Moonshot); `kimi-k3`/`kimi-k3.1-pro` listed on Model Studio (A) | `deepseek-flash`, `deepseek-v4-pro` (A) | `qwen3.7-plus`; cost tier `qwen3.8-flash` (A) |
| Endpoint style | NOT FOUND | OpenAI- and Anthropic-compatible (A) | OpenAI-compatible, workspace domain (A) |
| Structured output | NOT FOUND (JSON Mode via Model Studio, A) | JSON object, no schema mode found (A) | Strict JSON Schema (A) |
| Usage per response | NOT FOUND | Yes, with cache split (A) | Yes (A, example) |
| Request id | NOT FOUND | Body `id` (A) | UUID Request ID, header or body (A) |
| Operator / governing law | NOT FOUND | Hangzhou DeepSeek; PRC mainland law (A) | Alibaba Cloud (entity per Membership Agreement, G6); Singapore law (A) |
| Age clause | NOT FOUND | "primarily intended for adults"; under-18s read terms with a guardian (A) | "not intended for minors (persons under the age of 18)… must not use" (A) |
| Indonesia eligibility | NOT FOUND | NOT FOUND | NOT FOUND |
| Indonesian language (official) | NOT FOUND | NOT FOUND | NOT FOUND |
| Training on API data | NOT FOUND | May use de-identified Inputs/Outputs; opt-out toggle (A); API applicability unknown | "will never use your data for model training" (A) |
| Storage location | NOT FOUND | PRC (A) | Selected region, e.g. Singapore (A) |
| Retention period | NOT FOUND | "as long as necessary" (A) | Stored; period NOT FOUND |
| Zero retention | NOT FOUND | NOT FOUND | NOT FOUND |
| Billing model | NOT FOUND | Prepaid balance (A) | Postpaid pay-as-you-go (A) |
| Hard stop | NOT FOUND | Balance exhaustion, 402 (A) | Free-quota-only mode; no paid cap found |
| Rate limits | NOT FOUND | Concurrency 2,500 / 500 (A) | 15,000 RPM / 5M TPM for qwen3.7-plus (A) |
| SLA / status | NOT FOUND | Status page not reachable (G4) | 99.9% SLA (A); status page not read |
| Price in / out per 1M (USD) | NOT FOUND | flash $0.30/$1.20 peak, half off-peak; pro $1.32/$3.96 peak (A) | plus $0.40/$1.60 list (20% off limited); flash $0.15/$0.47 (A) |
| Est. cost per draft (USD) | — | flash $0.00027–$0.00104; pro $0.00092–$0.00352 | plus $0.00058–$0.00139; flash $0.00022–$0.00042 |
| Idempotency | NOT FOUND | NOT FOUND | NOT FOUND |

The cost estimates are my arithmetic, using the working assumption in §2.4 (cache-miss input, no reasoning-token overhead). They are interpretations, not provider statements.

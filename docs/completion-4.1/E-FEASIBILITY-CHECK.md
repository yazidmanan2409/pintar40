Checked 16 November 2026 by an independent checker for Sharon; prepared by an Anthropic model, as was the document checked.

# Check of E-FEASIBILITY-ADDITIONAL-PROVIDERS.md: contractual, privacy and security findings (DeepSeek, Qwen)

- **Document checked:** `docs/completion-4.1/E-FEASIBILITY-ADDITIONAL-PROVIDERS.md`, branch `claude/e-feasibility-more`, commit `b608c6e0`.
- **Scope:** the A-graded findings in §2.2, §2.5, §2.6, §3.2, §3.5, §3.6 and §3.7. I also looked for anything the document missed. For Kimi I only re-checked that its pages are still unreachable.
- **Method:** read-only HTTPS GETs of official public pages, using only hosts that were already allowed. No account, sign-in, terms acceptance, key, API call, spend or upload. I made no change to the environment or network, and I did not try to get past any block. Sharon owns the verdict. This file is evidence only.
- **Who wrote the quotes:** every quotation below was read by me on 16 November 2026. "Interpretation" marks my own reading. "Gap" marks something that is still unknown.

## 1. Summary

| | Count |
|---|---|
| A-graded findings checked | 36 |
| Confirmed verbatim and in context | 32 |
| Confirmed, but context changes the reading | 3 (D-5.1, Q-5.5, Q-2.1) |
| Wording differs | 1 (D-6.4, minor) |
| Unreachable | 0 |
| New findings on allowed hosts | 15 (§5) |
| Kimi | Still unreachable (§4) |

The most important new facts:

1. **Qwen contracting entity.** The Membership Agreement does not name Indonesia. For any jurisdiction it does not list, the contracting entity is **Alibaba Cloud (Singapore) Private Limited**.
2. **Qwen has a published Data Processing Addendum (DPA).** Product Terms §4.48 adds a contractual promise not to use Model Studio content to improve models "unless you separately provide your consent".
3. **The Qwen "International" scope is defined:** "global nodes excluding Chinese mainland".
4. **Qwen has no hard spending cap.** The budget and spending-limit features only send alerts. An overdue account (available balance below zero) loses service for that commodity code.
5. **DeepSeek Open Platform Terms §5.4** let DeepSeek "forfeit any unconsumed balance" if the brand-use rules are breached.

## 2. Checks of the document's A-graded findings

### 2.1 DeepSeek

The DeepSeek pages were S-D8 (Open Platform ToS), S-D9 (Terms of Use, "Last Update: March 27, 2026") and S-D10 (Privacy Policy, "Last Update: Feb 10, 2026"), plus S-D2, S-D3 and S-D4. The dates match the document. S-D9 and S-D10 first returned a connection reset. One retry a few seconds later returned HTTP 200.

| ID | Doc § | Finding | Result |
|---|---|---|---|
| D-2.1 | 2.2 | S-D8 scope ("individual developer or on behalf of an enterprise developer … internal organizational use or end users") and the operator, Hangzhou DeepSeek Artificial Intelligence Co., Ltd. | Confirmed |
| D-2.2 | 2.2 | S-D8 "(minors under the age of 18 shall read in the presence of a legal guardian)" | Confirmed |
| D-2.3 | 2.2 | S-D9 §2.1 "The Services are primarily intended for adults. …" | Confirmed |
| D-2.4 | 2.2 | S-D8 §10.1 PRC mainland law; §10.2 court | Confirmed. The document marked the §10.2 text as truncated. The full text is: "…a court having jurisdiction over the location of the registered office of Hangzhou DeepSeek Artificial Intelligence Co., Ltd." |
| D-2.5 | 2.2 | S-D8 §3.3 end-user consent | Confirmed |
| D-2.6 | 2.2 | S-D8 export-control clause | Confirmed |
| D-5.1 | 2.5 | S-D9 §4.3 "we may, to a minimal extent, use Inputs and Outputs …" plus the opt-out | **Verbatim, but the quote leaves out its opening condition.** The sentence begins: "Under the premise of secure encryption technology processing, strict de-identification rendering, and irreversibility to identify specific individuals, we may…". The document's §4 table does say "de-identified", so the omission is limited to §2.5. **The clause is in the Terms of Use, not the Open Platform ToS.** S-D8 §4 has only §4.1–4.2 and says nothing about DeepSeek using API Inputs or Outputs (see N-D1). |
| D-5.2 | 2.5 | S-D8 §4.2 input and output rights | Confirmed. The same §4.2(3) also says you may use them for "training other models (such as model distillation)". |
| D-5.3 | 2.5 | S-D10 "…store your Personal Data in People's Republic of China." | Confirmed |
| D-5.4 | 2.5 | S-D10 "We retain Personal Data for as long as necessary…" | Confirmed |
| D-5.5 | 2.5 | S-D10 end-user data "not covered by this privacy policy" | Confirmed. The next sentence makes the developer "the controller of the Personal Data processing activity". S-D8 §5.5 says the same. |
| D-5.6 | 2.5 | S-D3 `user_id` "KVCache Isolation … for privacy management"; "Do not include user privacy information in user_id." | Confirmed |
| D-6.1 | 2.6 | S-D8 §6.1 prepayment and suspension | Confirmed. The ellipsis leaves out only "if you use our paid services, and". |
| D-6.2 | 2.6 | S-D2 "directly deducted from your topped-up balance or granted balance" | Confirmed |
| D-6.3 | 2.6 | S-D4 "402 - Insufficient Balance … You have run out of balance." | Confirmed |
| D-6.4 | 2.6 | S-D3 concurrency 2,500 / 500, 429, expansion "with no additional cost" | Numbers and 429 confirmed. **The wording differs:** the page says "There is no additional cost for capacity expansion." The meaning is the same. |

### 2.2 Qwen (www.alibabacloud.com)

The "Last Updated" dates on S-Q5 to S-Q13 match the document.

| ID | Doc § | Finding | Result |
|---|---|---|---|
| Q-2.1 | 3.2 | S-Q13 "…not intended for minors (persons under the age of 18). Minors must not use …" | **Verbatim, but see the context.** The clause comes straight after this text: "Cloud Services may be used by our customers … to develop or host their own services and products for the customer's end users. Any information collected or handled by Alibaba Cloud in such circumstances is processed on behalf of our customer … We do not have a direct relationship with the end users of our customers. … We are not responsible for the privacy or security practices of our customers." It sits in the platform Privacy Policy, just before "A. COLLECTION OF PERSONAL DATA". It is not in the Product Terms. *Interpretation:* the clause seems to address who uses the Alibaba Cloud Platform itself (account holders and users). The page does not say whether it reaches a customer's end users. Sharon or legal should decide. |
| Q-2.2 | 3.2 | S-Q13 "intended for use by business organisations"; "(i) an individual or (ii) a representative of a business organisation" | Confirmed |
| Q-2.3 | 3.2 | S-Q12 §5.8 Singapore law and courts | Confirmed. This is in Product Terms §5 "General Provisions". Country addenda follow it: Singapore, Australia, and Europe (outside EEA). |
| Q-2.4 | 3.2 | S-Q12 §2.1 entity "is specified in the … Membership Agreement" | Confirmed. The entity is now resolved in N-Q1. |
| Q-2.5 | 3.2 | S-Q12 §4.48: Marketplace Supplemental; "your Alibaba Cloud contracting entity is the invoicing party" | Confirmed. This is §4.48.1, on Third-party Model Service. |
| Q-2.6 | 3.2 | S-Q11 "Starting September 15, you must complete your account information before activating Model Studio." | Confirmed |
| Q-5.1 | 3.5 | S-Q10 "…will never use your data for model training." | Confirmed |
| Q-5.2 | 3.5 | S-Q10 "…stores data generated from model and application calls." | Confirmed. The next sentence points to "the terms regarding data processing, privacy, and security in the Related agreements" (see N-Q2). |
| Q-5.3 | 3.5 | S-Q9 regions, scope and data-flow quotes | Confirmed. Between the two quoted sentences the page also says: "The inference result is returned to the region for storage". |
| Q-5.4 | 3.5 | S-Q8 call records and "Inference logging must first be enabled" | Confirmed. The page goes on: "Only certain models in the China (Beijing), Singapore, and US (Virginia) regions are supported … historical call records from before inference logging was enabled cannot be traced back." |
| Q-5.5 | 3.5 | S-Q13 third-party service providers "may be located in Singapore or outside of Singapore" | **Verbatim, but the context narrows it.** The providers named are those helping with "customer services …, promotions …, risk control, fraud prevention and legal compliance procedures, and … payment processing". *Interpretation:* this is about the processing of account personal data. It is not a statement about where Model Studio inference content is processed. |
| Q-5.6 | 3.5 | S-Q10 "SOC 2 compliance with an unqualified opinion" | Confirmed |
| Q-6.1 | 3.6 | S-Q6 "billed on a pay-as-you-go basis by default" | Confirmed |
| Q-6.2 | 3.6 | S-Q11 automatic pay-as-you-go after the free quota; Free Quota Only "disabled by default" | Confirmed |
| Q-6.3 | 3.6 | S-Q8 Arrearage, overdue payment, "balance updates may be delayed" | Confirmed |
| Q-6.4 | 3.6 | S-Q7 qwen3.7-plus International 15,000 RPM / 5,000,000 TPM; account-level limits; 429 "typically recover automatically within one minute"; qwen3.8-flash dynamic | Confirmed |
| Q-6.5 | 3.6 | S-Q9 SLA 99.9% / trial "Not provided" | Confirmed |
| Q-7.1 | 3.7 | S-Q5 example `"id": "chatcmpl-xxx"` and `usage` {completion_tokens, prompt_tokens, total_tokens}; the Singapore base URL | Confirmed. Grading this as an *example* is right. |
| Q-7.2 | 3.7 | S-Q8 Request ID "in UUID format … included in the Header or Body" | Confirmed |
| Q-7.3 | 3.7 | Error codes `Throttling.RateQuota`, `Throttling.AllocationQuota`, `insufficient_quota`, `Throttling.ResourceExhausted`, `Arrearage`, `ServiceUnavailable` | Each one appears on S-Q8. `Throttling.RateQuota` is shown as HTTP 429 there. |

## 3. Gaps the document listed that this check closes or narrows

| Document gap | Status now |
|---|---|
| G6: Qwen contracting entity | Narrowed. See N-Q1. Indonesia is not named, so I grade this B. |
| G6: definition of the "International" inference scope | Closed (A). See N-Q3. |
| G6: paid-tier spending caps | Closed as a negative: only alerts were found. See N-Q5 and N-Q6. |
| §3.5: Model Studio DPA or data-transfer terms | Closed (A). See N-Q2. |
| §2.5: DeepSeek DPA, subprocessor list, non-PRC region | Still open. Nothing found. See N-D1 to N-D4. |
| §2.5: whether the DeepSeek opt-out applies to API traffic | Still open. See N-D1. |
| §3.5: Qwen retention period for stored call data | Still open. See N-Q7. |

## 4. Kimi: reachability only

- `https://platform.moonshot.ai/docs/overview` still returns HTTP 301 to `https://platform.kimi.ai/docs/overview`.
- Requests to `platform.kimi.ai` and `www.kimi.ai` are refused by the environment proxy (CONNECT 403). These hosts are not on the allowlist, and I did not ask for them to be added.
- G1 and G2 are therefore unchanged.

## 5. New findings (provider statements verified verbatim, grade A unless marked)

### DeepSeek

- **N-D1 (training on API data).** Open Platform ToS (S-D8) §4 has only §4.1 (your responsibility for Inputs) and §4.2 (rights). It says nothing about DeepSeek using API Inputs or Outputs. S-D8 calls itself "a Specific Agreement to the 'DeepSeek Terms of Use'". The use-and-opt-out clause is in the Terms of Use §4.3 (D-5.1). *Interpretation:* §4.3 may reach API traffic through that link. No page I read says how or whether the "Improve the model for everyone" switch applies to API calls. **Gap stays open.**
- **N-D2 (no DPA or subprocessor list found).** The policy links on `www.deepseek.com/en/` go only to the cookies policy, privacy policy, terms of use and "model-algorithm-disclosure". The API docs navigation has no privacy, DPA or subprocessor page. S-D10 lists only categories of providers, for example "We use third party vendors…", "communication service providers", "analytics services providers" and "support and safety monitoring services providers". It also says "We integrate third-party APIs to provide search services, and we will share your input keywords to provide these services."
- **N-D3 (no non-PRC region).** S-D10: "To provide you with our services, we directly collect, process and store your Personal Data in People's Republic of China." No region selector or non-PRC region was found on the pages read. S-D10 does name an EU and UK privacy representative ("Prighter Group … for the following regions: -European Union (EU) -United Kingdom (UK)"). That is a representative, not a storage location.
- **N-D4 (controller role).** S-D8 §5.5: "As the controller of personal information processing activities in that scenario, you should disclose the relevant privacy policy to your end users." *Interpretation:* DeepSeek puts PINTAR in the controller role for end-user data. I found no matching clause in which DeepSeek accepts processor obligations.
- **N-D5 (balance forfeiture).** S-D8 §5.4, on breach of the brand-use rules in §5: "We reserve the right to unilaterally terminate the Agreement, forfeit any unconsumed balance in your account, hold you liable for breach of contract, and require you to issue a public statement…". §6.3 adds that a refund "will be issued in one lump sum … partial refunds are not supported".
- **N-D6 (availability by jurisdiction).** S-D8 §1.4: "We make no warranty that the Services are available or will continue to be available in certain jurisdictions." This is relevant to Indonesian eligibility, which the document left as NOT FOUND.
- **N-D7 (liability cap and changes).** S-D8 §7.3 caps DeepSeek's total liability at "the total service fees you have actually consumed for the service in the past twelve months". Under §11.1, revised terms "shall take effect seven (7) days after release".
- **N-D8 (children in the privacy policy).** S-D10: "Our Services are not aimed at children, and we do not knowingly process Personal Data from children." The policy also mentions users "14 or older but under the age of 18" when it discusses legal bases.

### Qwen (Alibaba Cloud international)

- **N-Q1 (contracting entity).** Membership Agreement ("Last Updated: Sep 10, 2026"), opening paragraph. It names entities for the UK and non-EEA Europe, the EEA, the USA and Malaysia. It then says: "If you are a resident in or have indicated that, at the time of your Account registration, your billing address is an address in any other jurisdiction in which we operate, you are contracting with Alibaba Cloud (Singapore) Private Limited." Indonesia is not named anywhere in the agreement. **Grade B** for "an Indonesian customer contracts with Alibaba Cloud (Singapore) Private Limited". That is my inference from the catch-all; it also depends on Alibaba "operating" in Indonesia, which this page does not state.
- **N-Q2 (DPA exists).** The Model Studio "Related agreements" page (Oct 11, 2026) lists the Product Terms, the Model Inference SLA, the Membership Agreement, the Privacy Policy, Open Source Model License Terms, and Third Party Vendor terms. The Membership Agreement includes a "Data Processing Addendum to Alibaba Cloud Membership Agreement", marked "Applicable to all users". It applies "if required by Data Protection Legislation, but only to the extent that … we process as a processor personal data contained in or generated in relation to your Member Content." That legislation is defined as including "but not limited to" the GDPR and UK GDPR. The full DPA (`/help/en/legal/latest/fe2cxg`, "Last Updated: Nov 29, 2023") says:
  - §6.1: "You decide where to store Data ('Selected Region'). If the processing of Data involves a transfer outside Selected Region, Alibaba Cloud will take such measures as are necessary as a processor…"
  - Subcontractors: Alibaba must "maintain an up-to-date list of such subcontractors here (accessible when You login to Your Alibaba Cloud account)", update it "at least 10 working days before any such change", and the customer "may object". **The list sits behind login, so it was not read.**
  - On termination: "at Your choice, delete or return all Data … following the termination of the Agreement", except where law requires or permits retention, or for "Data archived on back-up systems".
  - *Interpretation:* whether Indonesia's personal data protection law counts as "Data Protection Legislation", and so triggers the DPA, is not stated. That is for legal.
- **N-Q3 (International scope).** Singapore region page (Oct 13, 2026): "Singapore International (global nodes excluding Chinese mainland)". The general regions page also lists geographically bounded scopes in other regions, for example "Germany (Frankfurt) (Global/EU)" and "Japan (Tokyo) (Global/Japan)".
- **N-Q4 (Model Studio content and training).** Product Terms §4.48.1(b): "Input and Output are also included in Member Content. Any processing of Member Content … submitted through Model Studio by Alibaba Cloud is for your purposes and on your behalf." §4.48.1(e): "Alibaba Cloud will not use your Member Content to develop or improve the models on Model Studio, unless you separately provide your consent." This is a contractual statement and is stronger than the S-Q10 notice the document quotes. It does carry a consent exception. §4.48.1(d)(v) also bars using Model Studio Output "to train or develop products or services that compete with Alibaba Cloud".
- **N-Q5 (no hard cap on paid usage; alerts only).**
  - S-Q11 FAQ "How do I avoid charges?" says: "After your free quota is exhausted, charges are automatically deducted from your account balance." The remedies it gives are to delete API keys or to "Set up a Spending Limit Alert: When your monthly spending exceeds the alert threshold, you receive a notification email."
  - The Budget management page ("Last Updated: Aug 21, 2026") describes alerts only: "the system sends alerts through email, and internal messages when a threshold is triggered". It also says "actual and forecasted values become available in two days".
  - I found no feature that stops paid calls automatically.
- **N-Q6 (overdue stop and prepaid plans).** Billing and cost management (Nov 05, 2026) says:
  - "An account is considered overdue if its available balance is less than zero. … When one commodity code has an overdue payment, the services under that commodity code become unavailable and are restored after you settle the overdue amount."
  - Bills for model inference are generated "typically within 2 to 10 minutes".
  - Subscription and prepaid items exist: "Token Plan, provisioned throughput, model units, savings plans". The free-quota page gives the deduction order "free quota > resource plan > savings plan > pay-as-you-go".
  - *Interpretation (B):* a balance-based stop exists, but only after the balance goes **below zero**, and billing lags by minutes. So overshoot is possible, and this is not a cap. I did not read whether a Token Plan key stops when its quota runs out.
- **N-Q7 (retention period still not found).** I found no retention period for stored call data on S-Q8, S-Q9, S-Q10, S-Q11, the Product Terms, the Privacy Policy or the DPA. The Model Monitoring page contained only navigation stubs. The Privacy Policy says only that "The specific retention periods depend on the nature of the personal data…". **Gap stays open.**

## 6. Separation of material

- **Provider statements verified verbatim:** §2 (35 of 36 exact; D-6.4 has different wording) and §5, apart from the items marked Interpretation or B.
- **The original author's interpretations that I did not test as facts:**
  - that the DeepSeek prepaid balance works as a hard ceiling (reasonable, given S-D8 §6.1 and the 402 error);
  - that the age clauses address the account holder rather than the platform's audience (for DeepSeek, consistent with the text; for Qwen, see the Q-2.1 context);
  - that Kimi might be reached through Model Studio under Alibaba's contract.
- **My interpretations:** N-D1, N-D4, N-Q1 (B), N-Q2's scope question, N-Q6 (B), and the Q-2.1 and Q-5.5 context notes.
- **Gaps still open:**
  - DeepSeek: whether the opt-out applies to API traffic; a DPA; a named subprocessor list; any non-PRC region; Indonesian eligibility.
  - Qwen: retention period; the subcontractor list (behind login); whether the DPA is triggered by Indonesian law; Token Plan exhaustion behaviour; whether Indonesia is a jurisdiction "in which we operate".
  - Kimi: all items.
- **One fix suggested for the document:** in §2.5, restore the opening condition of the S-D9 §4.3 sentence and note that the clause is in the Terms of Use rather than the Open Platform ToS. In §3.5, narrow the description of the third-party-provider quote to account data.

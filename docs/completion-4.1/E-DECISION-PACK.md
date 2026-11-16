# E · AI provider evaluation: decision pack for the owner (revision 3)

Prepared by Bob, 16 November 2026. **Revision 3, same day:** the owner's decisions on revision 2 are recorded
(ruling 43, §6). §4.2 is amended, and §4.3a's threshold is **proposed, not frozen**. §4 freezes only when the owner
approves that threshold.

**For your decision. Nothing is activated:** no account, credential, network
egress to a provider API, call, transmission of material or spending.

**Evidence:**
- **Provider facts:** `E-PROVIDER-FACTS.md` on `claude/e-provider-facts` (`22ff0ddd`), read from official pages in the
  `pintar40` environment.
- **Sharon's independent review:** `docs/coordination/reviews/sharon/E-PROVIDER-FACTS-REVIEW.md` (`291c5ab7`), on the
  checker's verbatim re-reading (`e607cb42`: 44 of 45 A-graded findings confirmed, 1 context error). Her corrections
  F1–F6 are being applied to the facts document; none changes a figure used below.
- **The runner and its no-cost dry run:** `c3-eval/runner.mjs` and `DRY-RUN-RESULT.md` on `claude/e-runner-prep`
  (`91d1fd1a`, `84124485`).
- **The approved design:** `C3-EVALUATION-PLAN.md`; rulings 34–40.

> **Disclosure (Sharon's, and mine).** The research, the checker, Sharon, Daisy and I are all Anthropic models, and
> Anthropic is one of the two providers. **No reviewer on the team is independent of Anthropic's interest.** The
> safeguards that do not depend on us are: the human educator judges, blind scoring, rules frozen before the first
> call, the sealed provider map, and your own reading of both providers' terms. Sharon suggests a human or
> non-Anthropic reader for the final comparison; your own reading of the terms (§2) and the human judges cover the
> two places where it matters most.

## 1 · Verified provider choices

| | Anthropic | OpenAI | Google |
|---|---|---|---|
| **Model ID** | `claude-sonnet-5-5` (A) | `gpt-6.1-sol` (A; "mid-tier" is our reading of OpenAI's wording, B) | — |
| **Price per 1M tokens, in / out** | US$2 / US$10 (A) | US$2 / US$10 (A). Above 272K input: 2× / 1.5×, which E never reaches | — |
| **API tier at sign-up** | Evaluation or Start, assigned automatically | Build, after US$5 of credit purchases | — |
| **Training on API data** | No: Commercial Terms B (A) | No, per the developer docs (A). **Terms not read** | — |
| **Retention** | Deleted within 30 days; flagged content up to 2 years, classification scores up to 7 (A) | Abuse-monitoring logs up to 30 days; batch state until deleted (A) | — |
| **Zero retention** | By arrangement with sales | Prior approval by OpenAI | — |
| **Location** | Global by default; US-only option (+10%). No EU or Asia option | US or EU residency for eligible organisations (+10%) | — |
| **Subprocessors** | List not read (**G2**) | List not read (**G1**) | — |
| **Eligibility (ruling 44): does the provider permit the educator-only authoring workflow?** | **YES, closed.** The Commercial Terms (effective 17 Jun 2025) contain no age or minors restriction, and A.1 permits use "to power products and services Customer makes available to its own customers and end users". The Usage Policy (effective 12 Nov 2026) "do[es] not categorically prohibit use by any particular industry"; its minors provisions concern minors who "directly interact" with products that incorporate the API, which learners never do here | **Open: the one check (G1),** on the Services Agreement and the Usage Policies. Not readable from this environment | **NO, excluded.** Cloud terms §20(d) forbid use "as part of" a service "likely to be accessed by individuals under the age of 18" (A) |
| **Synthetic educational text** | No restriction found (B) | Not checked: terms not read | — |

**Google stays out,** under ruling 36. Eligibility would need Google's written clarification and a structurally
separate service that minors cannot reach. That is a design and legal step, not a reading.

**The ten-working-day window:** I have no record that the §6b inquiry was sent. If you sent it, give me the date
and I will record when the window ends. **Without written clarification, E runs as the eligible two-provider
option: Anthropic and OpenAI.**

**What the comparison is for (ruling 40):** E's result is now the evidence to **qualify** each provider for schools
to choose from, not a single pick. A provider that passes qualifies. The blinded scores become the evidence for the
comparison schools later see.

## 2 · The terms: links, and the gaps you close yourself

**Anthropic:**
- [Commercial Terms](https://www.anthropic.com/legal/commercial-terms) (effective 17 Jun 2025)
- [Usage Policy](https://www.anthropic.com/legal/aup) (effective 12 Nov 2026)
- [Data Processing Addendum](https://www.anthropic.com/legal/data-processing-addendum)
- [Guidelines for organisations serving minors](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors)
- [Privacy: API retention](https://privacy.claude.com/en/articles/7996866)
- **G2:** [subprocessor list](https://trust.anthropic.com/subprocessors). The research session has asked to add this
  one host for a single read; you may read it yourself instead.

**OpenAI:** its site blocks automated readers, so **G1 is yours to read in your browser:**
- [Services Agreement](https://openai.com/policies/services-agreement/)
- [Usage Policies](https://openai.com/policies/usage-policies/)
- [Data Processing Addendum](https://openai.com/policies/data-processing-addendum/)
- [Sub-processor list](https://openai.com/policies/sub-processor-list/)

**Ruling 44 replaces the minors checklist with one question:** *Does the provider permit this educator-only
authoring workflow, in which AI drafts questions, educators review and approve them, and learners never interact with
the provider?*
- If yes, the issue is closed. If no, the provider is excluded.
- No child-facing AI feature, and no extra age or moderation machinery, is added.
- Data use, retention, the DPA and sub-processors are still read before the paid run, as ordinary contract checks.
  They are separate from this question.
- **Until OpenAI's answer is read, it is "open", not "yes".**

**Nothing here is treated as accepted.** The team cannot accept terms for PINTAR.

## 3 · The US$25 ceiling: how it is enforced

### 3.1 Four independent stops

| Layer | Limit | Stops requests? | Lag |
|---|---|---|---|
| **Runner, before every call** | Reserves the call's worst-case cost. Refuses if spent plus reserved would pass **US$8 for that provider** or **US$25 in total** | Yes, before the request leaves | None: the check precedes the call |
| **Runner, after every call** | A reported cost above its reservation aborts the run at once | Yes | — |
| **Provider-side limit, proposed US$5 per provider** | Anthropic: your organisation spend limit (HTTP 400); the default workspace cannot carry its own. OpenAI: "Enforce a hard limit" (HTTP 429), or a prepaid credit balance that runs out (`credit_balance_exhausted`) | Yes, both (A) | **OpenAI:** stated, "recorded spend can slightly exceed the configured amount". **Anthropic:** no lag documented, and no spend alerts. Spend reporting lags about 5 minutes, up to 24 hours in analytics |
| **Alerts** | OpenAI spend alerts | **No.** "API traffic continues" | — |

**Why US$5 at the provider:** Sharon's advice is to set each provider's own cap well below the budget, so a lag
cannot overrun it. US$5 sits below the runner's US$8, and the whole run's worst case at real prices is under US$1
per provider (below). Even a lagging provider cap stays far inside US$25.

### 3.2 Worst-case cost, with retries and the request in flight

The kit sends **one request per chapter**, 15 drafts each, so 2 requests and 30 drafts per provider. Each request has
at most **3 attempts**. Calls run **one at a time**, so at most one request is ever in flight, and its worst case is
already reserved before it starts.

Worst case per attempt: the input's upper bound (estimated tokens × 1.2) plus the full **12,000-token output cap**.

| At the verified price, US$2 / US$10 | Per attempt | 2 requests, 1 attempt each | **All 6 attempts used** |
|---|---|---|---|
| Chapter 1: 3,930 in + 12,000 out | US$0.128 | | |
| Chapter 2: 3,453 in + 12,000 out | US$0.127 | | |
| **Per provider** | | US$0.255 | **US$0.764** |
| **Both providers** | | US$0.510 | **US$1.529** |

Even at an assumed flagship price of US$15 / US$75, the dry run's bound is US$5.73 per provider and US$17.20 for three
providers. Both are within the caps.

**A correction to the approved plan's estimate.** §6 of the plan assumed about 1,000 output tokens per draft over 30
calls. The kit actually sends 15 drafts per call, which need about 6,000–12,000 output tokens. The worst case above
uses the 12,000 cap. The plan's "under about US$10" for three providers still holds for two.

**Failures and retries are counted.** A rate-limited (429), server-error (5xx), transport-error or malformed attempt
costs its reported usage, or its whole reservation if none is reported. A 400 is not retried. A crash leaves the
reservation counted. The ledger carries across runs, so a second run counts the first's spend.

### 3.3 The no-cost dry run

`node runner.mjs --self-test`: **all checks passed**. I re-ran it myself. No network: `fetch` is blocked and was
never called.

| Scenario | Result |
|---|---|
| (a) Normal plan with planted faults (a malformed output, a 429, a transport error, a response with no usage) | Each retried within 3 attempts; 30 valid drafts per provider; never more than one call in flight; the missing-usage response kept its reservation as cost |
| (b) Total cap below one call's worst case | Refused before the first call; nothing spent; refusal in the ledger |
| (b2) Total cap reached partway | 2 calls, then refused before the limit |
| (b3) Per-provider cap reached | 1 call, then refused on that provider's cap |
| (c) A 400; three 5xx; a reported cost above its reservation | Not retried; failed after 3 attempts; aborted at once |
| **A real run** | **Refuses** while any price is UNVERIFIED, any adapter unverified, or a key missing |

**No-cost preparation: DONE (16 Nov), `claude/e-runner-prep` at `716ae93b`, Sharon PASS (`6c113f68`).**
1. Verified prices entered: `claude-sonnet-5-5` and `gpt-6.1-sol`, US$2 / US$10 (grade A). Google excluded and its adapter
   deleted.
2. Both adapters checked field by field against the official API reference (E-PROVIDER-FACTS §6, §6c) and
   **verified**: every success-path field grade A; Anthropic's undocumented credit-exhaustion error accepted only
   because its handling is proven fail-closed (any non-documented error stops the provider, no retry, reservation
   kept as cost; an exhaustive sweep of 1,800 cases per adapter).
3. Dry run at real prices: worst case **US$0.764 per provider, US$1.529 total**; mock run US$0.502. Self-test 116/0,
   offline, re-run independently by Sharon.
4. A real run additionally needs the `--live` flag; it is refused without it or without keys.

## 4 · Scoring rules, frozen before the first call

The rubric is unchanged (plan §5). The rules below fix what the plan left open; you approve them once and they don't
move afterwards.

**4.1 Which response is judged, and what counts toward the 30**
- Retries are for **transport and format only:** a 429, 5xx, transport error or schema-invalid output. **A valid
  response is never retried for quality.** The first schema-valid response is the one judged.
- Each provider's denominator is **always 30**: 15 items per chapter × 2.
- **A missing draft** (a chapter whose 3 attempts all failed, or a response with fewer than 15 items) scores **0** on
  every judged criterion and counts as **not accepted**.
- **A malformed draft** (fails the item schema) scores 0 the same way. It is not shown to the judges, so its format
  cannot unblind them. It is not a critical key error, since no usable key exists, but it lowers the valid rate.
- **A retried chapter** counts its **valid response only once**. Every attempt still counts in the cost and reliability
  figures.

**4.2 Judges and disagreements**
- Two educators score every valid item independently, without seeing each other's scores.
- **Correctness (0/1, a wrong key is critical). Amended, owner, 16 Nov.** Final educational judgments belong to
  the human educators.
  - If the two judges agree, their score stands, unless Sharon has flagged the item.
  - If they disagree, the **third educator** decides, with both judges' reasons in front of them, and that decision is
    final.
  - **Sharon's role:** she checks every key independently and may **flag** a suspected wrong key. A flag sends the item
    to the third educator, even when the two judges agreed. It never changes a score by itself.
  - Sharon also **audits the process:** that every item had two independent scores, that disagreements went to the
    third educator, and that the map stayed sealed. Her flags, and what the educators decided on each, are listed in the
    report.
  - **Sharon's conditions** (review `E-PACK-R3-SCORING-c3112336.md`, `a17f487c`), adopted:
    1. Her flags are made **blind**, and committed with their SHA-256 **before she sees any judge's score**.
    2. Every flag states its reason. A flag the third educator rejects stays rejected.
    3. Flag counts, and how many the educators upheld, are reported **per provider after unblinding**.
    4. The audit states its limit: **it cannot prove that two judges did not confer.**
  - **Disclosure (Sharon):** she is an Anthropic model checking keys that can send an Anthropic provider's items to
    adjudication, and she may recognise her model family's style through the blinding. **The owner may prefer a key
    checker who is not an Anthropic model** (open, §6).
- **The 0–2 criteria:** if the two judges are 1 apart, the item scores the average. If they are 2 apart, the third
  judge also scores it and the item takes the **median of the three**.
- **Daisy** reviews the Indonesian as advice to the judges; her opinion is not a score.

**4.3 Qualification and the no-pass outcome**
- **A provider qualifies** only if it meets all three of these:
  - **no more than 1 critical key error in 30** (the plan's rule);
  - the **minimum educational-quality threshold** in §4.3a (owner, 16 Nov: "a provider must demonstrate educational
    usefulness, not merely avoid critical wrong keys");
  - the contract, security and operational checks (ruling 40).
- Qualified providers are **ranked for the evidence**, not for selection: summed educational score, then valid rate,
  then cost.
- **If no provider qualifies,** the report says so. Nothing is selected, C3w is not shortened, and it comes to you
  (THE PLAN §5.6 J). Changing the prompt and running again would need your separate approval and a new freeze.

**4.3a Minimum educational-quality threshold (PROPOSED by Bob, for the owner's approval; not frozen)**

It uses only the existing rubric (plan §5) and the existing definition of an accepted draft (§4.5). A provider must
meet **both** conditions, across its 30 items:

| # | Condition | Threshold | Why |
|---|---|---|---|
| **Q1** | **Accepted items:** the key is correct, and the review burden is 1 or 2 after resolution, so the item is usable as it stands or after a light edit | **at least 24 of 30 (80%)** | This is the add-on's whole case: it saves an educator's time. If more than 1 item in 5 must be rewritten or rejected, there is little saving |
| **Q2** | **No weak dimension:** the average score across the 30 items for each 0–2 criterion (objective alignment, distractor quality, Indonesian language, review burden) | **at least 1.0 for each of the four** | A good total must not hide a dimension that is consistently poor, such as distractors that no misconception would produce |

- **Missing or malformed items** score 0 and count as not accepted (§4.1). A provider that loses a whole chapter (15
  items) therefore cannot qualify. That is intended: three attempts per chapter allow ordinary transport faults.
- The threshold is **frozen before the first paid call,** and the frozen pack's commit SHA is recorded (Sharon). It is
  **applied** after all resolution and before the map is opened (§4.4).
- **Q1 and the critical-key rule read the same resolved table:** one table per provider, after the third educator's
  decisions.
- **One edge case, harmless and stated:** a provider that loses a whole chapter fails Q1, but can still pass Q2 at
  exactly 1.0. Q1 alone decides that case.
- **What 30 items can show:** 24 of 30 is a point estimate of 80%, with an uncertainty of roughly ±15 points. The
  threshold is a minimum bar for qualifying a provider for the first evaluation, not a guarantee of quality in use.
  C3w keeps a human educator's review of every draft whatever the provider (THE PLAN §5.6).
- **Alternatives,** if you prefer:
  - **stricter:** Q1 at 27 of 30 (90%);
  - **with a quality floor at the top:** add Q3, at least 10 of 30 items with review burden 2 (approve as is).

  I recommend Q1 and Q2 as proposed: simple, and set by the add-on's purpose.

**4.3b How the rules are applied (Bob, 16 Nov; for `score.mjs`, not a change of substance)**
- **Accepted** means a resolved review burden of at least 1. So 0.5 is not accepted and 1.5 is.
- **Every resolved correctness 0 on a valid item is critical.** The rubric's correctness covers the key, an
  unambiguous stem and exactly one correct option.
- Critical items still count toward Q2, at their resolved scores.
- **A flag is "upheld"** when the third educator scores correctness 0.
- **A malformed item** (one that fails the item schema inside an otherwise valid response) scores 0 and is not shown to
  judges or to Sharon. Only that item is voided. A whole response that fails goes down the retry and missing path (§4.1).
- Thresholds are applied by `score.mjs` (`claude/e-runner-prep`), whose self-test covers these cases. The older
  `kit.mjs score` rule is retired.

**4.4 The sealed map**
- The runner's operator session runs `kit.mjs blind` and keeps the provider-to-code map **outside the repository**. It
  commits only the map's SHA-256 before judging starts. The operator is not a judge, not Sharon and not Daisy.
- The map is opened only after **all scores, the key disagreements and the qualification decisions are final**.
  Opening it is then checked against the committed hash.
- **Blinding with two providers is weaker,** since a style can be recognised. That is a reason for frozen rules and
  human judges, not a defect in the design.

**4.5 Reported beside the blinded results, never inside the scoring**

The cost evidence for C3w's limits and the later pricing (rulings 38–40):
- cost per attempt, per valid draft and per **accepted draft**. A draft is accepted if it has no critical error and a
  review burden of 1 or 2 after resolution;
- tokens, retry and failure rates, response times, rate limits met, and cost variability.

Regeneration cost is estimated from the cost per attempt, since E measures no regeneration. **No promise** is made of
a number of approved questions for a fixed cost.

## 5 · Judges (P7)

| | |
|---|---|
| **Number** | Three: two score each item; the third resolves disagreements (§4.2) |
| **Profile** | Practising SD mathematics teachers, ideally of Kelas 5, fluent in the curriculum's Indonesian |
| **Independence** | Not on Dr Gladys's walkthrough team (your ruling); no part in building PINTAR |
| **Time** | About 2–3 hours each, for 60 blinded items (30 per provider) |
| **Recognition** | Yours to decide |

## 6 · What you need to decide

**Decided by the owner, 16 Nov (ruling 43):**
1. **Providers: approved as E's two evaluation candidates,** Anthropic and OpenAI, **subject to verification of the
   exact model IDs and the outstanding eligibility and terms** (G1, G2, §2). Google remains excluded. **This does not
   qualify either provider commercially.**
   - The model IDs `claude-sonnet-5-5` and `gpt-6.1-sol` are re-verified against the official model pages in the
     no-cost preparation immediately before the paid run, and again at the second dry run.
2. **Scoring: approved in principle, with two amendments before freezing.**
   - (a) Correctness disagreements go to the third educator; Sharon flags and audits (§4.2, done).
   - (b) A minimum educational-quality threshold, which **Bob proposes in §4.3a for approval.**

   Kept as they are: the denominator of 30, no retry for quality, blind judging, the sealed map, and the cost and
   reliability reporting. **§4 freezes when the owner approves §4.3a.**
3. **Judges: the three-educator structure and the §5 profile are approved.** The judges are **not yet nominated**;
   their names stay pending.

**Open for the owner now:**
- approve §4.3a (or one of its alternatives), then §4 freezes;
- **the key checker (Sharon's disclosure, §4.2):** Sharon, as amended, or a key checker who is not an Anthropic
  model. Choosing the second needs no other change to §4.2.

**No-cost preparation that follows from Sharon's review** (offline, on `claude/e-runner-prep`; no call, key or spend):
- a **self-tested scoring script,** run by the operator: the resolutions, the critical count, Q1 and Q2, with their edge
  cases;
- **provenance carries the frozen pack's SHA,** and the runner refuses a live run without it;
- `blind` **strips the model and request fields,** with a check in the self-test.

**Before the paid run (one request, after the second dry run):**

4. **Terms:** read G1 (OpenAI) and G2 (Anthropic's subprocessors) and the Anthropic documents in §2. Tell me you
   accept each provider's terms, or drop a provider.
5. **Limits:** provider-side US$5 per provider, runner US$8 per provider, US$25 total. Or set your own.
6. **Network:** egress to `api.anthropic.com` and `api.openai.com` only, in the `pintar40` environment, for the run.
   You approve it in the tool's prompt, and it is removed afterwards.
7. **Keys:** one capped key per provider, created and entered by you in the secure form. Revoked after the run.
8. **Go:** authorisation for the paid calls themselves.

## 7 · What else this touches

- **Z:** the corrected summary stands. The acceptance baseline is THE PLAN §8.5's five journeys. Addendum 1 adds a
  sixth (an account's life) and extends Journey 3 (a sitting on the corrected revision, and the rewriting of withdrawn
  explanations). E adds no journey.
- **C3w:** E's qualified providers become the first entries in the registry of AI options (ruling 40, S-8).
- **Kimi, DeepSeek, Qwen:** exploratory feasibility only, under way. E's providers, rules and budget don't change
  without your separate approval.
- **Security and privacy:** unchanged. Only the two synthetic chapters and the prompt are sent, and no person's data
  is involved. Keys are network secrets only. Every draft keeps its provenance. No draft enters PINTAR's item bank.

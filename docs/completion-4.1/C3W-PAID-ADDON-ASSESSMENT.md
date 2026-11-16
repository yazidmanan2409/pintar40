# C3w · AI-assisted MCQ generation as an optional paid school add-on: impact assessment

Bob, Chief Architect, 16 November 2026. Owner decision of the same date, recorded as ruling 38
(`OWNER-RULINGS-4.1.md` §7) and in Addendum 1 §5d, C-1.

> **Owner, 16 Nov (ruling 39): S-1 and S-2 approved** as the minimal architectural additions to C3w. S-3 to S-7
> proceed as refinements of approved requirements, subject to Sharon's and Daisy's reviews. Accounting must be
> reconcilable and **must not permanently consume allowances through bookkeeping failures** (S-4 revised below).
> No billing, payment gateway, pricing packages or school-admin purchasing screens in 4.1. E unchanged.

**Read against:** THE PLAN §5.6 (C3w, D1–D11, F, G, H, I) and §5.7 (E); Addendum 1 R-3; rulings D-5, D-6, D-8,
O41-1, O41-6. **Nothing here changes implementation.** C3w is not started; it follows A3.

## 1 · Does C3w's approved design already support school-level entitlements?

**Mostly. Its shape is right; three points are not explicit.**

| Owner requirement | Already in C3w | Gap |
|---|---|---|
| Optional; no AI without approval | D7: generation is **refused until limits are set**, so "unset" never means unlimited. Daisy's «belum tersedia» state, with the button absent | None for 4.1 |
| School-level entitlement | D7: limits per educator, **per school**, per month | No explicit on/off or end date per school. "Per month" presumes a monthly model, which you have not decided |
| Authorisation before a call | D1 step 3, D7: checked **before** the call; `CAN_DRAFT` in the owning school; draft package only | None |
| Provider and model identified | D3: `model_ident` and version as values; INV-32 keeps vendor names out of schema | The **ledger** should carry the model and the price basis too, so cost is reconcilable without the provenance table |
| Usage attributable to a school | D5: ledger of requests (who, which package) | The ledger should hold the **school fixed at request time**, not only reach it through the package |
| Tokens and cost recorded | D5: token counts and cost estimate | None |
| Allowance enforced under concurrency | D1: "reserves a ledger row"; I-4: "spend cannot exceed the approved ceilings" | D7 names the `email_send_would_allow` pattern, which checks but does not **reserve**. Two simultaneous requests could both pass |
| Failed, retried, cancelled, partial | D6: a failure creates nothing; D11: idempotency key, bounded retries | No rule for what a failed or abandoned attempt **counts against the allowance** |
| Provider outage | D11: bounded retries per request | Bounded per request only. Bounded overall once failed attempts count (above) |
| Key and billing under PINTAR's control | D8: one `server-only` module, key via `src/lib/env.ts`, entered by the owner | None |
| One school cannot use another's | Ledger and limits per school; `CAN_DRAFT` over the package | Follows once the ledger's school is fixed at request time |
| Existing content unaffected | D2: a generated question is an ordinary draft, then an ordinary question | No test proves the entitlement is checked **only** at the generation request |
| Admin visibility | — | Not in 4.1. Deferred (§3) |

## 2 · Essential before any real paid generation (the smallest set)

All but S-1 and S-2 are **precisions of approved text** (D1, D5, D6, D7, D11, I-4), needing no scope change. They
become requirements on C3w's page for Sharon's and Daisy's pre-build review.

- **S-1 · The school limit is a school entitlement record** *(**approved**, ruling 39; a change to D7)*. One row per
  school: on or off, an allowance, an optional start and end. Absent, off, expired or exhausted: **refused before any
  call**, as D7 already refuses an unset limit. In 4.1 the platform operator (you) sets it, as D-6 already says. No
  school-admin screen, no billing, no payment. The allowance period is a window, not a calendar month, so neither a
  monthly allowance nor prepaid credits is presumed.
- **S-2 · One platform-wide ceiling above all schools** *(**approved**, ruling 39)*. It is PINTAR's own
  stop, matching the provider account's limit, so that the sum of school allowances can never exceed what PINTAR
  pays for.
- **S-3 · Reserve, then call.** Before each provider attempt, the server reserves that attempt's **worst-case cost**
  against the school's allowance, the educator's limit and the platform ceiling, in one transaction holding the
  school's entitlement row lock. Concurrent requests queue on that lock and cannot both pass. After the call, the
  reservation is settled to the reported cost. If no usage is reported, the reservation stays held as unreconciled (S-4), not consumed. A cost
  above its reservation stops generation for the platform and is reported. (E's runner proves the reservation
  offline; its rule of keeping a missing-usage reservation as cost is right for E's fixed budget, not for C3w's
  allowances, per S-4.)
- **S-4 · Every attempt is accounted, and bookkeeping never consumes an allowance for good** *(revised for the
  owner's ruling 39)*. Each retry is its own ledger attempt under the one request. An attempt ends in one of:
  - **settled** at the provider's reported cost (success, invalid output, or a failure the provider reports usage
    for);
  - **released**, consuming nothing, when it is known no request reached the provider (refused or crashed before
    sending);
  - **unreconciled**, when a request may have reached the provider but no usage came back (timeout, abandoned,
    crash after sending). Its reservation is **held, not consumed**: it still counts against the school's allowance
    and the platform ceiling, so spend stays safe, and it is marked as held, not as cost.
  Unreconciled holds are cleared by reconciliation against the provider's own usage records, which settles them at
  the cost found or releases them. A hold older than a fixed age is flagged to the operator. So retries cannot evade
  accounting, an outage consumes a bounded hold rather than unlimited calls, and a crash or a lost response cannot
  burn a school's allowance permanently. The design's reconciliation step is Sharon's to review.
- **S-5 · The ledger is self-sufficient for reconciliation:** the school fixed at request time; the requester; the
  model identifier and price basis as values; tokens; reserved and settled cost; outcome per attempt. No source text
  beyond D5's hash and reference; no key.
- **S-6 · The entitlement is checked only at the generation request.** Tests, red first:
  - with the school's entitlement off, expired or exhausted, the school's generated drafts can still be accepted,
    edited, deleted and submitted, and its generated questions reviewed, released, published, sat, reported and
    certified;
  - provenance stays readable to staff;
  - a request for school A cannot consume school B's allowance;
  - two simultaneous requests at the edge of an allowance cannot both reach the provider.
- **S-7 · The UX is Daisy's.** Her «belum tersedia» state stays (button absent, so no pressure to upgrade). Her
  limit sentence says «untuk {bulan ini}»; it needs to be period-neutral. An inactive or exhausted entitlement needs
  a next step for the teacher, for example "your school's administrator manages this", with no price, token or
  provider shown. Manual question creation is never interrupted. Wording is hers at the pre-build review.

## 3 · Deferred until commercial launch (not 4.1)

- The pricing model (monthly allowance, prepaid credits or another arrangement), allowance sizes, renewal, expiry,
  top-up and margin. These are yours, after E and real operating costs.
- Payment, invoicing, a payment gateway, subscription packages, retail prices.
- School administrators managing or buying the entitlement, and their view of allowance, consumption and balance.
  S-5's ledger is what that view would read, so it needs no redesign.
- Converting provider cost into the school's chargeable unit. The ledger records provider cost; it never records a
  retail price.
- Whether a school bears the cost of failed attempts and provider outages. In 4.1, S-4 counts them, to protect spend.
  Whether a school is **charged** for them is a commercial decision.

## 4 · Future-compatible boundaries

- **Database:** the entitlement row (S-1), the platform ceiling (S-2), the ledger's per-attempt fields (S-5).
  Neutral column names (INV-32). A later billing system reads the ledger and writes the entitlement; neither table
  changes shape.
- **API contract:** the generation route's outcome codes gain the distinct refusals, so the screen can say which
  applies without a later contract change: not available at this school; allowance used up; entitlement ended; the
  platform ceiling reached. Codes are named on C3w's page.
- **The provider module (D8)** stays the only outbound path. Billing never reaches the provider key.

## 5 · Acceptance journeys

- **Z's journeys** (THE PLAN §8.5's five, as amended by Addendum 1): unchanged.
- **C3w's own journey (H):** unchanged. S-6's tests are added under H's database and app tests, and I-4 already
  covers spend. Two refusal states join F's list.

## 6 · "And then what?" and "What else did that change?"

| Area | Traced |
|---|---|
| Question drafting | The entitlement gates only the request. A draft generated before expiry is still the educator's to accept, edit or delete (D2), and the package can still be submitted |
| School permissions | Teachers request; they never see cost. The entitlement belongs to the school. In 4.1 only the operator sets it; school-admin governance comes with commercial launch |
| Provider costs | Ledger cost is provider cost, kept apart from any retail price. Reservations make concurrent and retried calls safe. A cost overrun stops generation |
| Content ownership | A generated question is the school's question like any other. Nothing in the content lifecycle reads the entitlement |
| Existing questions | Expiry changes nothing for approved questions, assessments, results, certificates, reports or provenance (S-6 proves it) |
| Future account closure | The ledger attributes cost to the **school**, so an educator's departure or anonymisation leaves the school's accounting intact. Provenance follows the existing anonymisation rule. Closing a school is "later than 4.2"; when designed, its entitlement ends and its records follow that design |
| E (the evaluation) | Unchanged in design and scoring. Its report adds the cost evidence you listed (§7) |

## 7 · E's report: the cost evidence added

Measured where possible, beside the blinded educational results and never inside the scoring: cost per attempt, per
valid draft and per accepted draft; tokens; retry and failure rates; response times; rate limits met; cost
variability across attempts. **Regeneration** is estimated, not measured: E has no educator-requested
regeneration, so the report gives cost per attempt as the unit and says so. **No promise** is made of a number of
approved questions for a fixed cost.

The runner now records response time and rate-limit information per attempt (`claude/e-runner-prep`,
`84124485`). The scoring rules are unchanged.

## 8 · Decisions for you

- **Now:** none required. Development continues.
- ~~Before C3w's build: approve S-1 and S-2.~~ **Approved, ruling 39 (16 Nov).** S-3 to S-7 go to Sharon and Daisy
  as review requirements at C3w's pre-build review.
- **Later:** the pricing model and everything in §3, informed by E.

## 9 · Ruling 40 (owner, 16 Nov): schools choose their AI from PINTAR's qualified options

> PINTAR shortlists and qualifies the AI providers; each school chooses which one it uses, from a transparent,
> evidence-based comparison showing each approved option's advantages, limitations and price. PINTAR qualifies
> providers, schools choose, PINTAR manages the integration. E stays the initial controlled evaluation, but C3w must
> not assume there will only ever be one selected provider.

### 9.1 What it changes in C3w's approved text

| Text | Now | Becomes |
|---|---|---|
| D8, G1 entry gate: "the owner has selected the provider from E's results" | One provider, one adapter | The owner **qualifies** one or more providers from E's results and the contractual, security and operational checks. The operational checks include a **mandatory provider-side hard spend stop** (a cap or a prepaid balance), since a leaked key on a postpaid account spends outside PINTAR's ledger (Sharon, 16 Nov). One adapter per qualified provider behind D8's one interface |
| S-1 (ruling 39): the school entitlement | Status, allowance, validity | Also **the school's selected option**. A school can only select a qualified one |
| S-2 (ruling 39): the platform ceiling | One ceiling | One platform ceiling **plus one ceiling per provider**, matching each provider account's own limit |
| S-5: the ledger | Model and price basis as values | Also the **option the attempt was reserved under**, so each provider's spend reconciles against its own account |
| D8: "nothing about the provider appears in a schema name or in copy" | No provider in copy | Schema names stay vendor-free (INV-32). **Provider names may appear in staff and administrator copy** (the comparison, the provenance line Daisy already designed). Never on a learner surface |

### 9.2 S-8 · The smallest addition: a registry of qualified options

- **One operator-managed table of AI options:** a neutral key, the display name, the model identifier and price basis
  as values, and a state: *qualified*, *suspended* or *withdrawn*. Only a qualified option can be selected or used.
- **The request resolves the option from the school's entitlement at reservation time** and records it on the ledger.
  A request never names a provider itself, so a teacher never sees model IDs, keys or tokens.
- **The key stays per provider, server-side** (D8). Schools never hold one.

### 9.3 "And then what?" and "What else did that change?"

| Event | Outcome |
|---|---|
| A school changes its option | New requests use the new option. A request already reserved finishes on the option it reserved under. Existing questions keep their provenance (D3 records the model) and stay usable. Unaccepted drafts stay the educator's to accept, edit or delete |
| An option is suspended or withdrawn (quality, terms, security or outage) | Schools on it cannot generate until it returns or they choose another; the screen says so, with a next step. Nothing already generated is touched |
| Two schools on different options | Each request routes to its own school's option, and spends against that school's allowance, that provider's ceiling and the platform ceiling. A test proves it |
| The allowance | Stays neutral (ruling 39). If it is later expressed in money or credits, a change of option needs no conversion. If in drafts, the pricing model must say how a change converts. That is a commercial decision, not 4.1's |
| Data protection | R-3 and D9 apply identically to every option. Each option's terms are qualified separately, so a school's choice never widens what is sent |
| E | Unchanged: providers, scoring, threshold and budget. Its result becomes the **qualification evidence** instead of a single pick: a provider passing the existing critical-key bar and the other checks is qualifiable; its blinded scores become the evidence for the matrix |
| The comparison schools see | Wording is Daisy's, from independently evaluated results only, never promotional claims. Prices follow the later commercial model. Not in 4.1 |
| The conflict of interest disclosed in E | Choice reduces it: PINTAR no longer picks a favourite for every school, and the evidence is shown |

### 9.4 In 4.1, and later

- **In 4.1 (C3w, under its existing gates):** S-8's registry; the entitlement's selected option; per-provider
  ceilings; the ledger's option; adapters only for the providers qualified from E; the test of two schools on two
  options. In 4.1 **the operator sets each school's option**, as he sets the entitlement (ruling 39).
- **Later, with the commercial launch:** the school-facing comparison and its prices, school administrators choosing
  the option themselves, and qualifying further providers (Kimi, DeepSeek, Qwen or others) through their own
  controlled evaluation, under separate approval.

### 9.5 Decisions

- **None needed now.** I have recorded ruling 40 and read its consequences as above. Two points I've taken as the
  defaults, which you can correct:
  1. **Qualification uses E's existing critical-key threshold** plus the contractual, security and operational checks.
     E's scoring is unchanged; only the use of its result changes, from picking one provider to qualifying each.
  2. **In 4.1 the operator selects each school's option;** school self-selection comes with the commercial launch.

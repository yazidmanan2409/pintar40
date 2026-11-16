# C3w · AI-assisted MCQ generation as an optional paid school add-on: impact assessment

Bob, Chief Architect, 16 November 2026. Owner decision of the same date, recorded as ruling 38
(`OWNER-RULINGS-4.1.md` §7) and in Addendum 1 §5d, C-1.

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

- **S-1 · The school limit is a school entitlement record** *(needs your approval: small change to D7)*. One row per
  school: on or off, an allowance, an optional start and end. Absent, off, expired or exhausted: **refused before any
  call**, as D7 already refuses an unset limit. In 4.1 the platform operator (you) sets it, as D-6 already says. No
  school-admin screen, no billing, no payment. The allowance period is a window, not a calendar month, so neither a
  monthly allowance nor prepaid credits is presumed.
- **S-2 · One platform-wide ceiling above all schools** *(needs your approval, same change)*. It is PINTAR's own
  stop, matching the provider account's limit, so that the sum of school allowances can never exceed what PINTAR
  pays for.
- **S-3 · Reserve, then call.** Before each provider attempt, the server reserves that attempt's **worst-case cost**
  against the school's allowance, the educator's limit and the platform ceiling, in one transaction holding the
  school's entitlement row lock. Concurrent requests queue on that lock and cannot both pass. After the call, the
  reservation is settled to the reported cost. If no usage is reported, the reservation is kept as the cost. A cost
  above its reservation stops generation for the platform and is reported. (This is the mechanism E's runner
  already proves offline.)
- **S-4 · Every attempt is accounted.** Each retry is its own ledger attempt under the one request. A failed,
  timed-out, cancelled or abandoned attempt counts against the allowance at its reported cost, or its reservation.
  A reservation left open by a crash is settled at the reservation after a fixed timeout. So retries cannot evade
  accounting, and a provider outage consumes a bounded allowance, not unlimited calls.
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
- **Before C3w's build (its pre-build review, after A3):** approve S-1 and S-2 together. That is one small change to
  D7: the per-school limit becomes a school entitlement record with an optional end date and a period that is not
  a calendar month, plus a platform-wide ceiling. Everything else in §2 is precision of approved text and goes to
  Sharon and Daisy as review requirements.
- **Later:** the pricing model and everything in §3, informed by E.

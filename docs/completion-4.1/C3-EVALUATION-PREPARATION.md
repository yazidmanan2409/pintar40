# C3 · Provider evaluation · preparation findings (no-cost)

> **Prepared 12 November 2026 (07:32 UTC) by the Chief Architect, under the owner's ruling M-A.** Reading only. No
> key was provisioned, nothing was spent, no network access was changed, and no material was sent to any provider.
> This is the "provider data-handling terms" and "licensing" prerequisite of THE PLAN §5.7, as far as it could be
> prepared. It recommends no provider.
>
> **Disclosure.** One of the three providers is Anthropic, and this document was prepared by an Anthropic model. The
> blind design protects the quality judging. This comparison has no such protection, so it quotes each provider's own
> text with its source and date and states how each item was verified. Sharon holds the data-handling review in the
> evaluation plan (§7) and is asked to check it.

## 1 · How far each provider could be verified

The session's network policy allowed Anthropic's legal and documentation pages and Google Cloud's terms pages. It
blocked every OpenAI host and the Gemini Developer API's own pages.

| Grade | Meaning | Applies to |
|---|---|---|
| **A** | Read directly on the provider's official page; quotes are verbatim | Anthropic's Commercial Terms, DPA, Usage Policy, Service Specific Terms and documentation; Google **Cloud** terms, DPA, sub-processor list and pricing |
| **B** | Official URL identified, but the page was blocked; content seen only as search-result excerpts. **Wording may not be verbatim and must be re-read on the live page before anyone relies on it** | **Everything for OpenAI.** The **Gemini Developer API's** own terms, retention, pricing and billing pages. Anthropic's privacy-centre article and its support article on minors |
| **C** | Not found | Named where it occurs |

**Consequence.** Anthropic is verified. OpenAI is not verified at all. Google is verified for its Cloud route and
not for its Developer API route, and those are two different contracts.

## 2 · What matters for PINTAR, by question

C3w sends an educator's source excerpt, the objective, the item schema and a prompt. It never sends a learner's name,
answer or result. Learners never interact with the model. PINTAR's learners are children (SD).

| Question | Anthropic (Claude API) | OpenAI (API platform) | Google (Gemini) |
|---|---|---|---|
| **Are inputs used to train models?** | **No, unless opted in (A).** "Anthropic may not train models on Customer Content from Services." | No, unless the customer agrees (B) | Paid Developer API: not used to improve products (B). Unpaid: used, with human review (B). Cloud route: not without permission (A) |
| **Retention of what is sent** | Documentation: not retained by default, except named "Covered Models" which require 30 days (A). A privacy-centre article says deleted within 30 days (B). **The two read differently and need reconciling.** Flagged content may be kept up to 2 years (A). Zero retention by request to sales (A) | Abuse-monitoring logs up to 30 days; zero retention only with approval (B) | Paid Developer API: logged for abuse monitoring, 55 days (B). Zero retention is offered on the Cloud route, not the Developer API (B). Cloud: not stored longer than needed to produce the output (A) |
| **Where it is processed** | Global by default; a US-only option; data at rest in the US. **No Indonesian or regional option on the first-party API (A)** | Default not confirmed; regional options listed, none in Indonesia, and non-US regions need approval (B) | Developer API: nothing found (C). Cloud: a region can be selected (A) |
| **Who owns the drafts; indemnity** | Customer owns outputs; Anthropic indemnifies third-party IP claims on paid use, with exclusions including the customer's own inputs (A) | Customer owns outputs; an output indemnity for API customers, with exclusions (B) | Developer API: Google claims no ownership; **no indemnity found (C)**. Cloud route: indemnity for listed services, which do not include the Developer API (A) |
| **Rights in the source material sent** | **The customer warrants it has "all rights and permissions required to submit Inputs", and indemnifies the provider for claims about inputs (A)** | Customer indemnifies for claims about its content; exact warranty wording not retrieved (B) | Customer is responsible; exact clause not retrieved (C) |
| **Minors and education** | Applies where minors "directly interact with products that incorporate our API(s)"; then additional guidelines apply (A). C3w's learners do not interact with the model | Guidance concerns processing personal data of children under 13 without zero retention (B). C3w sends no learner data | **Both routes restrict products for under-18s.** Cloud terms §20(d), read directly (A): the customer will not use a generative AI service "as part of a website, Customer Application, or other online service that is directed towards or is likely to be accessed by individuals under the age of 18." The Developer API's terms carry the same restriction (B) |
| **Data processing addendum** | Incorporated into the Commercial Terms automatically (A) | Incorporated into the Services Agreement (B) | A processor addendum is referenced; not read (B) |
| **Structured (JSON schema) output** | Native, stable (A) | Native (B) | Native, a subset of JSON Schema (B) |
| **A spending cap** | A spend limit per organization and per workspace; reaching it refuses calls (A). **No cap per key found** | Monthly limits per organization and project with a hard-limit switch; spend "can slightly exceed" it (B). No cap per key found | A monthly cap per project, and tier caps (B). No cap per key found |

## 3 · Prices (per million tokens, input / output), for the evaluation's budget

| Provider | Mid-tier general model | Cheapest | Highest | Grade |
|---|---|---|---|---|
| Anthropic | Claude Sonnet 5.5: $2 / $10 | Claude Haiku 5.5: $0.10 / $0.50 (prompts up to 100,000 tokens) | Claude Fable 5.2: $8 / $40; Claude Opus 5.5: $4 / $20 | A |
| OpenAI | `gpt-6.1-sol`: $2 / $10 (which model OpenAI calls mid-tier is not confirmed) | `gpt-6-luna`: $0.10 / $0.50 | `gpt-6-astra`: $10 / $50 | B |
| Google | Developer API price list not verified. Cloud route (A): Gemini 3.8 Flash $0.75 / $3.75 until 31 Dec 2026, then $1.50 / $7.50; Gemini 4 Argon $2 / $10 until 30 Nov 2026, then $4 / $20 | Gemini 3.1 Flash-Lite $0.25 / $1.50 (Cloud) | Gemini 4 Carbon $2 / $10 until 30 Nov, then $4 / $20 (Cloud) | A for Cloud; B for the Developer API |

The evaluation plan's estimate (about US$0.48 for 30 drafts on the mid-tier Anthropic model; under US$10 for the
whole evaluation with retries) still holds at these prices. Two of Google's prices are promotional and end on stated
dates, which matters for the cost-per-accepted-draft figure the owner will use to set limits.

## 4 · Findings that bear on the evaluation and on C3w

1. **Google's restriction on products accessed by under-18s is the one finding that could remove a provider.**
   PINTAR is used by children. In C3w the model is reached only by educators in Studio, and no learner ever
   interacts with it. Whether the clause's words, "as part of a … Customer Application … likely to be accessed by
   individuals under the age of 18", cover an educator-only feature inside an application that children also use is a
   question of contract reading that engineering should not answer. The evaluation itself (a script sending synthetic
   chapters) is not such an application. **This needs the owner's reading, or advice the owner trusts, before Google
   could be selected, and arguably before the effort of judging its drafts.**
2. **Source-material rights sit with PINTAR and the school under every provider.** The customer warrants its rights in
   what it sends and indemnifies the provider. This confirms THE PLAN §5.6 D10 and the owner's ruling D-5: the
   educator's confirmation is necessary, and is not by itself enough. The synthetic chapters carry no third-party
   rights, so the evaluation is unaffected.
3. **No provider offers processing in Indonesia** on the routes read. The content sent is educational text, not
   personal data, so this is recorded and not treated as a barrier; whether any Indonesian requirement applies to
   educator-supplied material is the owner's to confirm.
4. **No provider offers a cap on an individual key.** The evaluation plan's precondition P5 ("one API key per
   provider, with a provider-side spend cap") is met in substance by a cap on a dedicated workspace or project per
   provider, plus the script's own hard stop. The precondition should be read that way.
5. **Anthropic's retention statements need reconciling,** and its highest model requires 30-day retention. The
   evaluation uses the mid-tier model, which that requirement does not name.
6. **Training use is off by default on the paid API of all three,** on the evidence available (A for Anthropic and
   Google Cloud; B for OpenAI and the Gemini Developer API). On Google, this depends on the project being a paid one.

## 5 · What is still needed before the first call (THE PLAN §5.7; evaluation plan §1)

| Prerequisite | State | Whose action |
|---|---|---|
| Binding terms confirmed for each provider | Anthropic: read (A), with one reconciliation. **OpenAI and the Gemini Developer API: not read; grade B.** | **Owner's decision (§6, item 1)** |
| Licensing of the material | The synthetic chapters: no third-party rights. Authorized by the owner on 11 Nov | Done |
| Google's under-18 clause | Open | **Owner's decision (§6, item 2)** |
| Educator judges | Requirements given to the owner on 12 Nov | Owner nominates |
| Network access to the three API hosts | Not allowed; not authorized | Owner, when ready |
| Keys with a cap per workspace or project | Not provisioned; not authorized | Owner enters them, when ready |
| Kit (prompts, schema, material, blinding and scoring) | Ready; its offline self-test passes. The provider runner is written once terms and access are settled | Engineering |
| Sharon's check of this document | Requested | Sharon |

## 6 · Decisions for the owner

1. **How the unread terms are confirmed.** Either the owner (or someone the owner names) reads the listed OpenAI and
   Gemini Developer API pages and confirms the items graded B, or the session is allowed to read those documentation
   and policy pages. The second is a network change, read-only and to public pages, and is distinct from access to
   the providers' APIs; it is not made without the owner's approval.
2. **Whether Google stays in the evaluation,** given finding 1. Options: (a) keep three providers and settle the
   clause before any selection; (b) settle the clause first and include Google only if it could be selected;
   (c) evaluate two providers. Recommended: (b), because judging thirty drafts from a provider that cannot be chosen
   costs the judges' time and tells the owner nothing actionable.

## 6a · The owner's rulings on §6 (12 November 2026)

**Decision 1: approved.** The official public documentation, terms and policy pages of OpenAI and Google may be read
for verification. This authorizes no provider API access, credential, spending or transfer of evaluation material.
The exact sources, dates and service routes are to be recorded, and Sharon reviews the findings independently.

**Decision 2: option B approved.** Google's age-restriction eligibility is resolved before Google is included.
Written clarification is sought from Google specifically for PINTAR's educator-only question-generation feature
inside a school application also used by minors. **Until eligibility is established Google is a conditional
candidate: no evaluation funds and no educator judging time are spent on it.** If it cannot be confirmed within a
reasonable time, the evaluation proceeds with the eligible providers and reports the narrower comparison. The 4.1
critical path is not held for it.

**State of Decision 1: not yet carried out, and why.** This session runs in the owner's shared Default environment,
whose network policy blocks those hosts. The environment saved for this repository cannot be joined by a running
session. Allowing the hosts on the Default environment would change every future session of the owner that uses it,
not only this work, so it is not proposed without the owner asking for that specific change. The ways forward are in
the Chief Architect's report of the same time. **Hosts that would have to be reachable:** `openai.com`,
`developers.openai.com`, `platform.openai.com`, `help.openai.com`, `ai.google.dev`, `policies.google.com`,
`business.safety.google`.

**State of Decision 2: the inquiry is drafted for the owner to send (§6b).** Nobody on the team can write to Google
on PINTAR's behalf.

## 6b · Draft inquiry to Google (for the owner to send, from the owner's own account, through Google's sales or support channel for the Gemini API or Google Cloud)

> **Subject: Eligibility question: generative AI used only by teachers inside a school application**
>
> We operate an educational platform used by schools. Its users include teachers, school administrators and
> students, and many of the students are under 18.
>
> We are evaluating the Gemini API (and, alternatively, Gemini through Google Cloud's Agent Platform) for one
> feature. We would like to confirm in writing whether that feature is permitted under your terms before we evaluate
> the service.
>
> **The feature.** A teacher, signed in with a staff account, supplies a passage of teaching material and asks for
> draft multiple-choice questions. Our server sends the passage, the learning objective and a formatting instruction
> to the API and receives draft questions. The drafts are shown only to teachers. A teacher must review and accept or
> edit each draft, and a second teacher must approve it, before any question can be published to students.
>
> **What students do and do not do.** Students never send anything to the model and never receive anything from it
> directly. No student name, answer, result or other student data is sent to the API. Students later see only
> questions that teachers have reviewed, approved and published, with no indication of how a draft originated.
>
> **Our question.** Your terms state that a customer will not use a generative AI service "as part of a website,
> Customer Application, or other online service that is directed towards or is likely to be accessed by individuals
> under the age of 18" (Google Cloud Service Specific Terms, generative AI services), and the Gemini API Additional
> Terms contain a similar restriction on API clients directed towards or likely to be accessed by individuals under
> 18.
>
> 1. Does this restriction apply to the feature described, where the generative AI service is reached only by adult
>    staff, inside an application that students also use for other purposes?
> 2. If it applies, is there a permitted configuration or an agreement under which this use is allowed?
> 3. Does your answer differ between the Gemini Developer API and Gemini through Google Cloud?
>
> We would be grateful for a written answer we can keep on record, and for the name of the terms document and section
> it relies on.

*Notes for the owner.* The draft names no school, person or product. Add the organization's name and contact as you
see fit. **"A reasonable timeframe" needs a date:** the Chief Architect suggests ten working days from sending, after
which the evaluation proceeds with the eligible providers, as ruled.

## 6c · Sharon's independent check of the data-handling reading (12 Nov 2026)

**Her conclusion: the reading is sound and correctly graded where she could check it.** She states the same
limitation as this document: she is also an Anthropic model, so her check is not blind for that provider.

- **Confirmed by her, read directly** (`platform.claude.com/docs/en/manage-claude/api-and-data-retention`, 12 Nov):
  the 30-day requirement applies to **named Covered Models** (Claude Fable 5.2 and 5.1, Claude Mythos 5.2 and 5.1,
  Claude Fable 5 and Claude Mythos 5); flagged content may be retained up to 2 years even under zero-retention
  arrangements; retained data is never used for training without express permission; conversation content is not
  retained by default.
- **Correction taken:** where this document says "its highest model requires 30-day retention", read **"the named
  Covered Models require 30-day retention"**. The requirement is a list of models, not a tier. The mid-tier model the
  evaluation uses is not on it.
- **Still unreconciled:** "not retained by default" against "deleted within 30 days". The documentation page points
  to the commercial data retention policy on `privacy.claude.com` for standard retention outside those arrangements;
  that host is blocked. The item stays marked unreconciled.
- **Unchanged:** every grade-B item for OpenAI and the Gemini Developer API stays B; she could not read them either.
  She agrees with the reading of Google's under-18 clause (grade A, Cloud §20(d)) and with passing it to the owner as
  contract interpretation.
- **One addition for C3w's design review, not for the evaluation:** in production an educator's source excerpt could
  contain a learner's name (a worksheet with names on it), which would be personal data of a minor reaching the
  provider. C3w's page should keep a rule that excerpts are educator-supplied teaching text and are checked, or the
  educator warned, for names.

## 6d · The owner's further rulings (12 November 2026), and how the reading is to be done

**Documentation access: the dedicated `pintar40` environment, not the shared Default.** The official OpenAI, Google
and Anthropic documentation, including `privacy.claude.com`, is read there, read-only, in a new session once access
is available. No API access, credential, spending or transfer of evaluation material is authorized.

**The Google inquiry (§6b) is approved for sending.** The response window is **ten working days from the date it is
sent**. With no satisfactory clarification by then, the evaluation continues with the other eligible providers.
Google stays **conditional**, not declared ineligible. No provider selection or expenditure is authorized.

**C3w source material (owner):** learner personal information must be prevented from reaching an external provider,
by enforceable handling established at C3w's design review, not by assuming educators never supply identifying
material. Carried to C3w's page (Addendum 1 §5d, R-3).

### For the owner: configuring the `pintar40` environment

In the environment's settings (the cloud environment menu in a session's title bar, then Edit), under **Network
access**, keep the level at **Limited**, leave **Allow package managers** ticked, and add these under **Allowed
domains**. The two hosts already listed there stay.

| Host | Why |
|---|---|
| `openai.com` | Services Agreement, Service Terms, Data Processing Addendum, sub-processor list, usage policies |
| `developers.openai.com` | data controls, pricing, spend limits, structured outputs, under-18 guidance |
| `platform.openai.com` | the sub-processor page the addendum references; documentation that redirects there |
| `help.openai.com` | help-centre articles the policy pages link to |
| `ai.google.dev` | Gemini API Additional Terms, usage policies, zero data retention, pricing, billing, structured output |
| `policies.google.com` | the generative AI Prohibited Use Policy; Google APIs Terms of Service |
| `business.safety.google` | the processor addendum and sub-processor list that govern the paid Gemini Developer API |
| `cloud.google.com` | Google Cloud terms and pricing (reachable from this session; listed so that the new session has it) |
| `privacy.claude.com` | the commercial data retention policy, to reconcile the two retention statements |
| `www.anthropic.com`, `platform.claude.com`, `support.claude.com` | Anthropic's terms, documentation and the article on organizations serving minors (the first two were reachable from this session; the third was not) |

**These are documentation and policy sites only.** The API hosts (`api.openai.com`,
`generativelanguage.googleapis.com`, `api.anthropic.com`) are **not** on this list and must not be added for this
step.

### For the new session: what to read and confirm

Start it on the `pintar40` environment and give it this section. It reads only, changes nothing in the repository
except this document, and contacts no API.

1. **OpenAI (every item is grade B today).** On the official pages: training use and the opt-in; retention of
   abuse-monitoring logs and the conditions for zero retention; the sub-processor list; the default processing
   location and the regional options; ownership of outputs and the output indemnity with its exclusions; **the
   customer's warranty of rights in inputs, verbatim**; the clause on minors, verbatim, and the under-18 API
   guidance; how the Data Processing Addendum is accepted; current prices and exact model names, and **which model
   the provider presents as its mid-tier general model**; spend limits; structured output.
2. **Google, Gemini Developer API (grade B today).** The Gemini API Additional Terms in full, with their effective
   date: the definition of a Paid Service; training use on paid and unpaid tiers, and the "Contributor" tier seen in
   an excerpt; retention (the 55 days) and zero retention; data location; ownership; **whether any indemnity
   applies; the under-18 restriction, verbatim, and any "professional or business purposes" wording**; the processor
   addendum and its sub-processor list; current prices and model names; the project spend cap.
3. **Google, both routes:** the Prohibited Use Policy and the Google APIs Terms of Service clause on rights in
   inputs.
4. **Anthropic:** the commercial data retention policy on `privacy.claude.com`, to decide which of "not retained by
   default" and "deleted within 30 days" governs a standard API organization; the sub-processor list; the support
   article on organizations serving minors.
5. **For each item:** the URL, the page's effective or last-modified date, the date read, the **service route** it
   governs, and the governing sentence quoted exactly. Raise the grade to A only for what was read on the page. Leave
   as B or C, and say so, anything still not reached.
6. Update §1 to §4 of this document accordingly, mark each superseded statement where it stands, and ask Sharon to
   review the result.

## 7 · Sources

Official pages, accessed 12 November 2026. Grade A unless marked.

- **Anthropic:** Commercial Terms of Service (effective 17 Jun 2025), `www.anthropic.com/legal/commercial-terms`;
  Data Processing Addendum (effective 24 Feb 2025), `…/legal/data-processing-addendum`; Usage Policy,
  `…/legal/aup`; Service Specific Terms (effective 31 Aug 2026), `…/legal/service-specific-terms`; documentation at
  `platform.claude.com/docs/en/` (pricing, models overview, API and data retention, data residency, structured
  outputs, rate limits). *Grade B:* the privacy-centre retention article and the support article on organizations
  serving minors. The sub-processor list page was blocked.
- **OpenAI (all grade B):** Services Agreement, Service Terms, Data Processing Addendum and sub-processor list under
  `openai.com/policies/`; data controls, pricing, spend limits, structured outputs and under-18 guidance under
  `developers.openai.com/api/docs/`.
- **Google:** *Grade A:* Cloud Service Specific Terms (last modified 11 Nov 2026),
  `cloud.google.com/terms/service-terms`; Cloud Data Processing Addendum (30 Oct 2026); Cloud sub-processors
  (19 Oct 2026); Generative AI Indemnified Services (20 Jul 2026); Cloud model pricing. *Grade B:* Gemini API
  Additional Terms (effective 23 Mar 2026 per the excerpt), `ai.google.dev/gemini-api/terms`; its usage-policies,
  zero-data-retention, pricing, billing and structured-output pages.

No third-party figure is used anywhere in this document.

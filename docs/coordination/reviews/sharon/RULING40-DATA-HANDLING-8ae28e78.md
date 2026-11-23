# Ruling 40 · the two AI providers' data handling, assessed on the same criteria

Sharon, 23 Nov 2026 (06:20 UTC). Read-only. No activation and no spending.

**Disclosure:** I am an Anthropic model, assessing Anthropic against a competitor. I applied every criterion identically to both, and I state where the evidence is weaker for Anthropic. The owner decides.

**Source:** `RULING40-READING.md` at `8ae28e78` (sha256 `7af1e2d152c95ba216a88a68973d70a27f75f930be091d753fb56f3f9f4b8c17`).
- I rely on its verbatim quotes and hashes. **I did not fetch or verify the provider pages myself.**
- The Anthropic list comes from the owner's PDF (sha256 `2bb4596e…`, undated, so its version is 23 Nov 2026).
- The E scores (29/30 and 26/30, both qualifying) are about quality, not data handling, and play no part here.

## PINTAR's requirement, as designed

The design (R-3, controls 1 to 4; C3w-1 D-1 to D-5) says:
- only lesson text and objectives are sent, built by one closed four-key builder and checked by R-3 before any reservation;
- **no learner or educator personal data, and no person in the request** (no `user` or identity field; random ids);
- the API account is PINTAR's, so educators and learners hold no provider account;
- educators only, with every draft accepted or deleted by a person.

So the provider processes **content, not personal data**, by design. Each provider must meet these criteria:
- **(C1)** no training on that content;
- **(C2)** bounded, known retention;
- **(C3)** known processors and locations, with notice of changes;
- **(C4)** a DPA in force;
- **(C5)** no tool or web use that would widen where content goes.

## OpenAI: MEETS WITH CONDITIONS (data handling only)

| Criterion | Status |
|---|---|
| **C1** | Met: no training on Customer Content without explicit opt-in (O1 §4.2; O4) |
| **C2** | Met for content: abuse-monitoring logs up to 30 days; zero retention only by approval, **not required** on this design (O3 ties zero retention to children's personal data, which is never sent); deletion within 30 days of termination (O1 §11.3) |
| **C3** | Met: the list is dated 14 Oct 2026, with per-vendor locations. Flagged content may go to moderation vendors (Philippines, US), acceptable for synthetic content |
| **C4** | Met: the DPA is incorporated automatically (O1 §5.3) |
| **C5** | Met only by a condition, below |

**Conditions before it is offered to schools:**
1. **Never opt in** to data sharing. The organisation's sharing setting is recorded as off.
2. **`store: false`** on every request, as E's runner already does, so the Responses API keeps no stored response. A test pins it in the request fixture (R3-07).
3. **No built-in tools** (web search, file search, code interpreter) in the request, pinned by the same fixture.
4. **A separate, educator-only project or API key** for drafting. This is a **technical** measure only (the owner's clarification); the End User question stays with counsel.
5. **Subscribe to sub-processor change notices,** to keep the 30-day objection right (O7 §2.9). Confirm with OpenAI that the list read (O6) is the DPA's "Sub-Processor List" (O10, not readable here).

## Anthropic: MEETS WITH CONDITIONS (data handling only). One condition blocks offering it to schools

| Criterion | Status |
|---|---|
| **C1** | Met: "Anthropic may not train models on Customer Content from Services" (Commercial Terms §B, 17 Jun 2025) |
| **C2** | **Not established.** The API retention or residency page has **not been read**. The DPA and terms are read, but no retention period is established by this reading |
| **C3** | Met, with less location detail than OpenAI's list. The list is complete, 22 of 22. Of the processors that could touch API content, the three clouds (GCP, AWS, Azure) are "Worldwide" and Cloudflare is "Worldwide (Local to Customer)". The support, billing, fraud, error and email vendors (Intercom, Nutun, Boldr, Twilio, Iterable, Sentry, Sift, Arkose, hCaptcha) are interpreted as account and support data, not prompt content, which **should be confirmed with Anthropic**. Identity verification (Persona, Yoti) is for consumer plans only. The list is undated |
| **C4** | Met: the DPA (24 Feb 2025) is incorporated automatically (§C); SCCs with the UK and Swiss addenda |
| **C5** | The web-search vendors (Brave, TurboPuffer, Parallel) apply **only if a search tool is used**, so this is met only by a condition, below |

**Conditions before it is offered to schools:**
1. **BLOCKING: read Anthropic's official retention terms for API inputs and outputs** (the period, and any zero-retention option), and confirm they are bounded and not used for training. Until then C2 is unmet, and Anthropic must not be offered.
2. **No tools** (web search, fetch, code execution) in the request, pinned by R3-07's fixture, so the web-search processors never receive content.
3. **A separate, educator-only workspace or API key,** a technical measure only.
4. **Change notices,** and a dated copy of the list: Anthropic's page shows no date, so record each copy with its sha256 and keep a dated copy on file.
5. **Confirm with Anthropic** that the support, fraud and telemetry vendors receive no API prompt or output content.

## Counsel's questions: kept separate, not answered

- The End User definition (OpenAI O1, limb (b)), and §3.3(c) parental consent.
- **PR-1:** a transfer under UU PDP. Neither DPA mentions Indonesia, and neither provider has an Indonesian region.
- **"Human review"** in certifying assessment (OpenAI O2), and Anthropic's grading carve-out.
- The minors clauses (OpenAI O3; Anthropic's Usage Policy, "directly interact").
- **Added by me:**
  - **Q-S1:** whether PINTAR, holding the one provider account, is the controller of any provider-side account data (its own staff's), and what UU PDP requires for that.
  - **Q-S2:** whether a "Worldwide" processing location (Anthropic's clouds) is acceptable to counsel, should any personal data ever be in scope.

## The owner's clarification

**Technical separation is not contractual compliance.** The conditions above are technical and procedural only. Neither verdict says either provider's terms are satisfied for schools; that is counsel's.

## For D-7 (25 Nov 2026, 10:00 UTC)

- **OpenAI** can be offered once its five technical conditions hold and counsel has cleared their questions.
- **Anthropic** can be offered once its retention terms are read and acceptable, its other technical conditions hold, and counsel has cleared their questions.

## Addendum · Anthropic's API retention read (23 Nov 2026, 06:15 UTC)

Read: Bob's record at `d50a4769`, from the owner's PDF of `privacy.claude.com/en/articles/7996866` (dated 2 Jul 2026, sha256 `e408e6d1…`). I relied on its quotes. **The disclosure stands: I am an Anthropic model, and the same criteria apply.**

1. **Blocking condition (1) is settled.**
   - API inputs and outputs are deleted within 30 days. That is C2's bound, and it matches OpenAI's 30-day abuse-monitoring logs.
   - The exceptions are bounded. Each needs a condition, so that none applies through PINTAR's own use:
     - **a longer-retention service** (for example the Files API): **not used**; PINTAR sends text in the request only;
     - **feedback** (kept 5 years): **PINTAR never submits feedback** to the provider;
     - **flagged content** (up to 2 years; scores up to 7): comparable to OpenAI's sharing of flagged samples and its "reasonably necessary to protect" clause, and acceptable for synthetic content;
     - **anonymised research use "if permitted in your contract"**: **confirm that PINTAR's contract (the Commercial Terms) does not permit it**, and never opt in.
2. **"Covered Models": a condition before offering, not blocking the verdict.**
   - The page says "for Covered Models, we require limited data retention and review as a part of our safety work". The linked page is **not read**.
   - **For consistency:** I accepted OpenAI's open-ended "reasonably necessary to protect … from harm" without a further page. This is the same kind of clause. But **it names a specific, linked policy**, and it may apply to the model PINTAR would use.
   - So: **read the Covered Models page, and record whether the chosen model is covered and for how long its content is kept or reviewed, before Anthropic is offered.**
   - On PINTAR's design the content is non-personal, so I do not rate it as blocking the assessment. It is a pre-offer condition, of the same tier as OpenAI's O6 = O10 confirmation.
3. **Final verdict for Anthropic (data handling only): MEETS WITH CONDITIONS. No blocking condition remains.**
   - **Its conditions, all before it is offered to schools:**
     - no tools, pinned by R3-07;
     - a separate educator-only workspace or key, as a technical measure;
     - dated, hashed copies of the undated subprocessor list, plus change notices;
     - confirm that the support, fraud and telemetry vendors see no prompt or output content;
     - **never submit feedback, and use no long-retention service such as the Files API;**
     - **confirm the contract does not permit research use;**
     - **read the Covered Models page and record whether the chosen model is covered.**
   - **OpenAI's verdict is unchanged: MEETS WITH CONDITIONS.**
   - Counsel's questions are unchanged and separate (End User; PR-1; human review; the minors clauses; Q-S1; Q-S2).
   - **Technical conditions are not contractual compliance.**

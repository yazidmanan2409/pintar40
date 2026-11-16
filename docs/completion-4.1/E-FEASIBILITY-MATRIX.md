# Additional AI providers: feasibility matrix and recommendation

Bob, 16 November 2026. **Exploratory only.** It does not change E (providers, scoring rules, budget) and authorises
nothing. **Facts:** `E-FEASIBILITY-ADDITIONAL-PROVIDERS.md` on `claude/e-feasibility-more` (`b608c6e0`), read from
official pages in the `pintar40` environment.

> **Sharon's verdict** (`docs/coordination/reviews/sharon/E-FEASIBILITY-MORE-REVIEW.md`, `1f07977e`): **none of the
> three meets E's baseline, and none can be accepted on present evidence.** None has a DPA or published processing
> terms, a subprocessor list, or a stated retention period for API content; Kimi has no readable terms. Before any
> reconsideration, her conditions C1–C5 must be met (§2). Her addendum 2 (`6a4f7f49`) reviewed this matrix: **the
> recommendation stands**, with eight grading fixes, now applied. She judged on the note's quotes as given; a checker for her
> is re-reading the contractual, privacy and security quotes to E's standard (`claude/e-feasibility-check`).
> **The documentation hosts used were added through your approval prompt;** no API host is allowed.

> **Disclosure.** The research and this note were prepared by Anthropic models, and Anthropic is one of E's
> providers. The comparison below uses the providers' own quoted text, graded, so it can be checked.

**Legend:** ✔ verified on an official page · ✖ verified, and a problem · ? not found or not reachable ·
*italic* = my interpretation.

## 1 · Matrix

| | **Kimi (Moonshot AI)** | **DeepSeek** | **Qwen (Alibaba Cloud Model Studio, international)** |
|---|---|---|---|
| **Model ID** | ? Docs unreachable. Listed on Alibaba as `kimi-k3`, `kimi-k3.1-pro` | ✔ `deepseek-flash`, `deepseek-v4-pro` | ✔ `qwen3.7-plus` (mid tier); `qwen3.8-flash` (low cost) |
| **API fit with C3w's adapter (D8)** | ? | ✔ OpenAI- or Anthropic-compatible | ✔ OpenAI-compatible, workspace endpoint |
| **Structured MCQ output** | ? | ✖ JSON object only, no schema mode; invalid output can come back as blank text | ✔ Strict JSON Schema |
| **Indonesian (official statement)** | ? | ? | ? |
| **Commercial eligibility, Indonesia** | ? | ? No country list; console blocked | ? Contracting entity in an agreement not yet read |
| **Governing law** | ? | ✖ PRC mainland, Hangzhou courts | ? Singapore per the product terms; confirmed only once the contracting entity is read |
| **Age clause** | ? | ✔ "Primarily intended for adults"; minors only with a guardian. *Addresses the account user, who would be an educator* | ✖ "Not intended for minors … Minors must not use" the services. *Sharon: it governs who uses Alibaba's platform (the account holder), not PINTAR's audience, so it is narrower than Google's §20(d). An educator-only feature can satisfy it under a strict C1, subject to the checker's reading of the surrounding terms* |
| **Training on API data** | ? | ✖ May use inputs and outputs; an opt-out exists, but whether it covers API traffic is unknown | ✔ "Will never use your data for model training" |
| **Storage and processing** | ? | ✖ Stored in the PRC | ✔ Stored in the chosen region (Singapore, `ap-southeast-1`); ? inference location not stated (the "International" scope is undefined) |
| **Retention** | ? | "As long as necessary" | Stored; period not found |
| **DPA or data-processing terms** *(the decisive difference from E's providers, per Sharon)* | ? | ? Not found | ? Not found |
| **Zero retention; subprocessor list** | ? | ? None found | ? None found |
| **Provider-side hard stop** | ? | ✔ Prepaid balance; HTTP 402 when exhausted | ✖ Postpaid by default; no paid-usage cap found (free-quota-only mode only) |
| **Rate limits; reliability** | ? | ✔ Concurrency 2,500 / 500; status page unreachable | ✔ 15,000 RPM / 5M TPM; 99.9% SLA |
| **Usage and request ID per response (S-5 ledger)** | ? | ✔ Usage with cache split; body `id` | ✔ Usage; UUID request ID |
| **Price, US$ per 1M tokens, in / out** | ? | flash $0.30 / $1.20 at peak (half off-peak); pro $1.32 / $3.96 | plus $0.40 / $1.60 list (a 20% promotion runs now); flash $0.15 / $0.47 |
| **Estimated cost per draft** *(15 drafts per request, 3–4K in, 6–12K out)* | — | flash US$0.0003–0.0010; pro US$0.0009–0.0035 *(more if reasoning tokens are billed)* | plus US$0.0007–0.0014; flash US$0.0002–0.0004 |
| *For comparison: E's providers at US$2 / US$10* | | | *US$0.0044–0.0085 per draft* |

## 2 · Recommendation

**1 · Qwen (`qwen3.7-plus`): the one candidate worth a later controlled evaluation, but only once Sharon's C1–C5 are
met. Not acceptable on present evidence.**
- **Why:** it is the only one with strict schema output, Singapore law and storage, a stated no-training commitment,
  a published SLA and full per-response accounting. It is *about 5–6 times cheaper per draft than E's providers (an estimate)*.
- **Sharon's conditions, C1–C5,** before any reconsideration of any of the three:
  - **C1, by design, strictly:** no personal or learner data is sent, and an input check enforces it. **No learner
    action may cause a call, directly or indirectly** (no feedback on a learner's answers, no hints on demand), and
    drafts reach learners only after an educator reviews and publishes them. C3w already requires this (R-3, D9), and it also addresses DeepSeek's and Qwen's age clauses.
  - **C2:** a DPA, a subprocessor list and a stated retention period.
  - **C3:** for Qwen, the retention of call content with logging off; for DeepSeek, the API training opt-out in writing.
  - **C4, mandatory:** a provider-side hard spend stop (a cap or a prepaid balance). PINTAR's own stop is not a
    substitute: a leaked key on a postpaid account spends outside PINTAR's ledger without limit (Sharon, correcting
    her first C4). Qwen is postpaid with no cap found, so **it cannot qualify on present evidence.**
  - **C5:** the contracting entity and eligibility for Indonesia, and the basis for transfer abroad. The transfer basis
    is a legal question for you; C1 makes it largely moot.
- **When:** after E, as a separate evaluation under your approval, on E's frozen kit and rules, so E is not delayed.

**2 · DeepSeek: not now.**
- The price is the lowest of all, and its prepaid balance is a real hard stop.
- **But four points stand against qualification for schools, three verified and one not found:**
  - storage in the PRC;
  - PRC governing law;
  - training use of inputs, with no confirmed opt-out for API traffic;
  - no DPA or subprocessor list found (?).
- Its JSON mode is also weaker for MCQ output.
- An evaluation would spend judges' time on a provider that, on present evidence, could not then be offered to schools. That is the same
  logic as ruling 36's for Google.
- **Reconsider only if** C1–C5 are met, including a non-PRC region or a transfer basis you accept, a DPA, and a confirmed API training opt-out.

**3 · Kimi: unassessed, so not now.**
- Its documentation and legal pages sit on hosts that were not allowed (`platform.kimi.ai`, `www.kimi.ai`).
- **Two routes if you want it assessed:**
  - approve those two hosts for a single read-only pass;
  - or assess Kimi through Alibaba Model Studio, which lists it as a third-party model. That would put it under
    Alibaba's contract. *Qwen's conditions might cover most of it, but third-party models on Alibaba may carry their own terms (interpretation).*

**What none of them states:** Indonesian-language capability. That is exactly what a controlled educational
evaluation measures, and why no provider enters the schools' comparison on documentation alone (ruling 40).

## 3 · Fit with C3w (rulings 38–40)

- **DeepSeek's and Qwen's APIs fit D8's one interface** as further adapters (Kimi's: ?), and both return what S-5's
  ledger needs: usage and a request ID.
- **The qualification checks** of ruling 40 should include **a mandatory provider-side hard stop** (Sharon agrees) (a cap or a prepaid
  balance), alongside quality, terms and security. A provider without one would rely on PINTAR's ledger alone.
- **The schools' comparison** would show a low-cost option honestly only after its quality is measured. This matrix is
  not that comparison, and its "advantages" are not ratings.

## 4 · Decisions for you

- **None needed now.**
- **Optional:** approve `platform.kimi.ai` and `www.kimi.ai` for one read-only pass, if you want Kimi assessed.
- **Later, after E:** whether to run a controlled evaluation of Qwen once Sharon's five conditions (C1–C5) are met.

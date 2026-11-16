# Additional AI providers: feasibility matrix and recommendation

Bob, 16 November 2026. **Exploratory only.** It does not change E (providers, scoring rules, budget) and authorises
nothing. **Facts:** `E-FEASIBILITY-ADDITIONAL-PROVIDERS.md` on `claude/e-feasibility-more` (`b608c6e0`), read from
official pages in the `pintar40` environment. **Sharon is reviewing the contractual, privacy and security findings**
independently; this recommendation is subject to her verdict.

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
| **Governing law** | ? | ✖ PRC mainland, Hangzhou courts | ✔ Singapore |
| **Age clause** | ? | ✔ "Primarily intended for adults"; minors only with a guardian. *Addresses the account user, who would be an educator* | ✖ "Not intended for minors … Minors must not use" the services. *Learners never use the feature; Sharon to judge* |
| **Training on API data** | ? | ✖ May use inputs and outputs; an opt-out exists, but whether it covers API traffic is unknown | ✔ "Will never use your data for model training" |
| **Storage and processing** | ? | ✖ Stored in the PRC | ✔ The chosen region (Singapore, `ap-southeast-1`) |
| **Retention** | ? | "As long as necessary" | Stored; period not found |
| **Zero retention; subprocessor list; DPA** | ? | ? None found | ? None found |
| **Provider-side hard stop** | ? | ✔ Prepaid balance; HTTP 402 when exhausted | ✖ Postpaid by default; no paid-usage cap found (free-quota-only mode only) |
| **Rate limits; reliability** | ? | ✔ Concurrency 2,500 / 500; status page unreachable | ✔ 15,000 RPM / 5M TPM; 99.9% SLA |
| **Usage and request ID per response (S-5 ledger)** | ? | ✔ Usage with cache split; body `id` | ✔ Usage; UUID request ID |
| **Price, US$ per 1M tokens, in / out** | ? | flash $0.30 / $1.20 at peak (half off-peak); pro $1.32 / $3.96 | plus $0.40 / $1.60 list (a 20% promotion runs now); flash $0.15 / $0.47 |
| **Estimated cost per draft** *(15 drafts per request, 3–4K in, 6–12K out)* | — | flash US$0.0003–0.0010; pro US$0.0009–0.0035 *(more if reasoning tokens are billed)* | plus US$0.0007–0.0014; flash US$0.0002–0.0004 |
| *For comparison: E's providers at US$2 / US$10* | | | *US$0.0044–0.0085 per draft* |

## 2 · Recommendation

**1 · Qwen (`qwen3.7-plus`): the one candidate worth a later controlled evaluation, on three conditions met first.**
- **Why:** it is the only one with strict schema output, Singapore law and storage, a stated no-training commitment,
  a published SLA and full per-response accounting. It is roughly five times cheaper per draft than E's providers.
- **Conditions,** all no-cost reading and review:
  1. Sharon's reading of Alibaba's minors clause for an educator-only feature inside a platform learners use.
  2. The Membership Agreement and billing pages read: who contracts with an Indonesian school's provider, and
     whether a hard spending cap exists. **Without a provider-side stop it cannot qualify for schools.** S-2's
     per-provider ceiling would rest on PINTAR's ledger alone, which is one stop where every other provider has two.
  3. The retention period for stored call data, and a DPA or data-transfer terms.
- **When:** after E, as a separate evaluation under your approval, on E's frozen kit and rules, so E is not delayed.

**2 · DeepSeek: not now.**
- The price is the lowest of all, and its prepaid balance is a real hard stop.
- **But four verified points stand against qualification for schools:**
  - storage in the PRC;
  - PRC governing law;
  - training use of inputs, with no confirmed opt-out for API traffic;
  - no DPA or subprocessor list found.
- Its JSON mode is also weaker for MCQ output.
- An evaluation would spend judges' time on a provider that could not then be offered to schools. That is the same
  logic as ruling 36's for Google.
- **Reconsider only if** DeepSeek offers a non-PRC region, a DPA and a confirmed API training opt-out.

**3 · Kimi: unassessed, so not now.**
- Its documentation and legal pages sit on hosts that were not allowed (`platform.kimi.ai`, `www.kimi.ai`).
- **Two routes if you want it assessed:**
  - approve those two hosts for a single read-only pass;
  - or assess Kimi through Alibaba Model Studio, which lists it as a third-party model. That would put it under
    Alibaba's contract, and Qwen's conditions would cover most of it.

**What none of them states:** Indonesian-language capability. That is exactly what a controlled educational
evaluation measures, and why no provider enters the schools' comparison on documentation alone (ruling 40).

## 3 · Fit with C3w (rulings 38–40)

- **All three APIs fit D8's one interface** as further adapters, and the two that are readable return what S-5's
  ledger needs: usage and a request ID.
- **The qualification checks** of ruling 40 should include **a provider-side hard stop** (a cap or a prepaid
  balance), alongside quality, terms and security. A provider without one would rely on PINTAR's ledger alone.
- **The schools' comparison** would show a low-cost option honestly only after its quality is measured. This matrix is
  not that comparison, and its "advantages" are not ratings.

## 4 · Decisions for you

- **None needed now.**
- **Optional:** approve `platform.kimi.ai` and `www.kimi.ai` for one read-only pass, if you want Kimi assessed.
- **Later, after E:** whether to run a controlled evaluation of Qwen once its three conditions are met.

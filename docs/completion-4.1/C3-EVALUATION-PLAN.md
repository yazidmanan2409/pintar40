# C3 · Blind provider evaluation: plan (owner, 9 Nov: approved in principle, ≤ US$25 total)

**State:** prepared, **not run**. There have been no paid calls and no credentials are provisioned. The provider
selection and any integration wait for the owner's review of the results.

## 1 · Preconditions (all needed before the first call)

| # | Precondition | State |
|---|---|---|
| P1 | Anthropic: official pricing and the binding data terms confirmed | **pricing confirmed** on the official page, 9 Nov: Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50, Opus 5.5 $4/$20 per MTok; Batch half. **Data terms:** the commercial terms to be read and confirmed by the owner (not a web table) |
| P2 | OpenAI: official pricing and the binding data terms | **blocked**: `developers.openai.com` is not in this session's allowed network hosts; third-party figures only so far (`C3-AI-PROVIDER-COMPARISON.md`) |
| P3 | Google: official pricing and the binding data terms | **blocked**: `ai.google.dev` is not in the allowed hosts |
| P4 | Network egress to the three APIs (`api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`) | not allowed today; an environment change the owner approves |
| P5 | One API key per provider, with a provider-side spend cap | **owner to authorize**; each supplied as a network secret, never in the repository or the chat |
| P6 | The material, authorized | proposed below; owner to confirm |
| P7 | Educator judges | owner to name them: educators, not Dr Gladys's walkthrough team (no invitation before the 4.1 candidate) |

## 2 · Material (identical for every provider; no learner data)

- **Proposed:** the repository's synthetic SD Kelas 5 Matematika chapters, Bab 1 and Bab 2. They are written as synthetic
  replacements under F-4 (no keyed or third-party material), in Indonesian, with their learning objectives.
- **Optional:** one non-synthetic chapter the owner authorizes in writing.
- Each provider receives **byte-identical** source text, objectives and instructions.

## 3 · The task and the output contract (identical)

- **The request:** draft 15 multiple-choice items per chapter, i.e. **30 drafts per provider**.
- **Each item:**
  - stem;
  - four options;
  - the key;
  - for each wrong option, the misconception it represents;
  - the objective code it assesses;
  - a one-line rationale for the key.
- **Output format:** one JSON schema, the same for all, enforced through each provider's structured-output feature where
  it exists. Validity is measured, not assumed.
- **Model per provider:** the provider's mid-tier general model at standard settings, named and dated in the results
  (for Anthropic, Claude Sonnet 5.5). The model choice is recorded before the run and not changed after it.

## 4 · Blinding

- A script maps each provider to a random code (A, B, C). The map is held outside the reviewers' copy until scoring
  is complete.
- Outputs are normalized to one rendering (same font, order and layout). Provider-identifying artefacts are stripped.
- The items are shuffled across providers within each chapter.

## 5 · Scoring rubric (per item; two judges per item; disagreements resolved by a third)

| Criterion | Scale | Judged by |
|---|---|---|
| **Educational correctness**: the key is right; the stem is unambiguous; exactly one option is correct | 0/1, **a materially incorrect key is CRITICAL** | educators (Sharon checks the key independently) |
| **Objective alignment**: assesses the stated objective at the right level | 0–2 | educators |
| **Distractor quality**: plausible, each tied to a real misconception, none also correct | 0–2 | educators |
| **Indonesian language**: correct, natural, age-appropriate (SD Kelas 5), consistent with PINTAR's terminology | 0–2 | Daisy, educators |
| **Structured-output reliability**: valid against the schema without repair; every field present | per item 0/1; per provider the valid rate | automatic |
| **Cost**: the tokens actually billed × the confirmed price | USD | automatic |

**Decision rule, proposed for the owner:**
- A provider with **any** critical key error in more than 1 of 30 items is not recommended.
- Among the rest, rank by summed educational score, then structured-output reliability, then cost.

## 6 · Budget (cap US$25 total, including retries)

- **Per draft:** about 3,000 input tokens (chapter excerpt plus instructions) and 1,000 output tokens.
- **At confirmed Anthropic prices,** Sonnet 5.5: 30 × (3K × $2/M + 1K × $10/M) ≈ **$0.48**.
- **For a provider at flagship-level prices** of about $10/$50 per MTok, the same 30 drafts cost about **$2.40**.
- **With up to 3× retries and schema repairs,** the whole evaluation stays **under about US$10**.
- **Enforcement:** a provider-side spend cap per key and a hard stop in the script at **US$8 per provider**.

## 7 · Reviews

- **Sharon:**
  - provenance: model, version, request id, source excerpt and prompt version stored with every draft;
  - data handling: the source sent, nothing else; no learner data; each provider's binding data terms read;
  - the independent key check.
- **Daisy:**
  - Indonesian language;
  - the educator's workflow (how a draft is shown, reviewed and approved in Studio, `SCOPE-REGISTER.md` §2 C3).

## 8 · Deliverable

`docs/completion-4.1/C3-EVALUATION-RESULTS.md` will hold, per provider:
- each criterion's score;
- critical errors listed with the item;
- the structured-output valid rate;
- the billed cost;
- the blinding map revealed last.

Then the owner reviews and decides. **No production selection or integration before that decision.**

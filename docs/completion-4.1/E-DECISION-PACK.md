# E · AI provider evaluation: decision pack for the owner

Prepared by Bob, 16 November 2026. **For review only.**

- Nothing has been activated: no external access, no credentials, no calls and no cost.
- **Sources:** the approved design in `C3-EVALUATION-PLAN.md`, the provider comparison in
  `C3-AI-PROVIDER-COMPARISON.md`, the kit in `c3-eval/`, and your rulings O41-1, O41-6 and O41-14 and those of 11 Nov.

## 1 · What is being decided

- **Approved already:** you approved E's design and its **US$25 total ceiling** (O41-14, 11 Nov). You also authorised
  its material: the two synthetic chapters.
- **What remains** is the four preconditions that let it run (§3 to §6). Then, after the results, comes the separate
  provider selection and limits that open C3w.
- **Why now:** E gates C3w, 4.1's last batch. Run early, it stays off the critical path. Started only after A3, Z waits
  for the evaluation and its judging.

## 2 · The providers and models

| Provider | Model evaluated (the mid-tier general model, fixed before the run) | Price per 1M tokens, input / output | Price status |
|---|---|---|---|
| Anthropic | Claude Sonnet 5.5 | $2 / $10 | Confirmed on the official page, 9 Nov |
| OpenAI | Its current mid-tier general model, named at the run | Third-party reports only, about $1–10 / $6–50 by tier | **To confirm on the official page** |
| Google | Gemini, mid tier (Flash or Pro), named at the run | Third-party reports only, about $0.75–1.50 / $3.75–10 | **To confirm**. Google lists price rises from 1 Jan 2027. Your earlier record leaves Google conditional on an eligibility inquiry |

**You may drop a provider.** The evaluation works with two.

## 3 · Data terms (P1–P3): your reading, not mine

- **The question to answer:** what each provider's binding commercial API terms say on training use, retention and
  zero-retention options, data region, and subprocessors.
- **Current understanding, unverified on the contracts:**
  - all three state that paid API data is not used for training;
  - retention defaults differ (OpenAI is reported at 30 days);
  - zero retention is typically available only by agreement.
- **Your action:** read and accept each provider's terms, or tell me to drop that provider. The team cannot accept
  contracts on PINTAR's behalf.

## 4 · Network requirements (P4)

| Purpose | Hosts | When |
|---|---|---|
| Confirm official prices and terms (read-only) | `developers.openai.com`, `ai.google.dev`, plus Anthropic's pricing and terms pages | Before the run |
| The calls themselves | `api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com` | During the run only |

- **Where it runs:** one cloud session environment, with these exact hosts and no wildcards.
- **Your approval:** you approve the environment change in the prompt the tool shows you. I propose it only when you
  say go.
- **After the run,** the API hosts are removed again.

## 5 · Capped credentials (P5)

- **The key:** one API key per provider, created by you in the provider's console, **with a provider-side monthly
  spend limit**. I propose **US$10 per provider**.
- **How you enter it:** in the secure credential form, as a network secret. It never appears in the repository, the
  chat or a log, and the team never sees its value.
- **A second, independent stop:** the kit has a hard stop at **US$8 per provider**, which halts the script before the
  provider's own limit.
- **Afterwards:** you revoke or rotate the keys when the evaluation is done. C3w would use a new key under the limits
  you then set.

## 6 · Educator judges (P7)

- **I can't name people; this is yours.** The profile I propose:

| | |
|---|---|
| Number | **Three**: two judge each item, and the third resolves disagreements |
| Profile | Practising SD mathematics teachers, ideally of Kelas 5, fluent in the curriculum's Indonesian |
| Independence | **Not** members of Dr Gladys's walkthrough team (your ruling); no involvement in PINTAR's build |
| Commitment | About 2–3 hours each, to score 90 blinded items (30 per provider) on the rubric |
| Recognition | Yours to decide (thanks, honorarium or certificate) |

- **Also reviewing:** Sharon checks every key independently, and Daisy reviews the Indonesian. Neither replaces the
  educators.

## 7 · Evaluation criteria (approved design, unchanged)

- **The task:** 15 multiple-choice drafts per chapter × 2 synthetic chapters = 30 per provider. The input is
  byte-identical, and the output is one JSON schema.
- **Blinding:**
  - providers are coded A, B and C, with the map held back until scoring is done;
  - the rendering is normalised;
  - items are shuffled within each chapter.
- **Rubric, per item:**
  - correctness (0/1; **a wrong key is CRITICAL**);
  - objective alignment (0–2);
  - distractor quality (0–2);
  - Indonesian language (0–2);
  - **review burden** (0–2, your 11 Nov criterion);
  - structured-output validity (automatic);
  - cost (automatic).
- **Decision rule, proposed for you to fix before the run:**
  - more than 1 critical key error in 30 rules a provider out;
  - otherwise rank by educational score, then output reliability, then cost.

## 8 · Costs

| | Estimate |
|---|---|
| Anthropic, Sonnet 5.5 | About $0.48 for 30 drafts |
| A flagship-priced provider | About $2.40 |
| All three, with up to 3× retries | **Under about US$10 total** |
| Ceiling | US$25 approved; US$10 provider-side limit and US$8 script stop per provider |

## 9 · Security and privacy

- **No personal data leaves PINTAR.**
  - The material is the two synthetic chapters, written as synthetic replacements with no keyed or third-party
    content, plus the prompt.
  - No learner, educator or school data is involved.
  - Your Indonesian data-protection exposure is therefore minimal for E. C3w will need its own review, because
    educators will supply real material.
- **Key handling:** network secrets only, keys capped, revoked after the run.
- **Provenance:** every draft stores model, version, request id, prompt version and source excerpt (Sharon's review).
- **Outputs:**
  - the drafts and the results file (`C3-EVALUATION-RESULTS.md`) contain no personal data;
  - no draft enters PINTAR's item bank;
  - E is evaluation only.
- **Conflict of interest, disclosed.**
  - The team's own working sessions run on one of the evaluated providers' models (Anthropic's).
  - The earlier comparison leaned towards Claude Sonnet 5.5.
  - That is why the safeguards matter:
    - blinding;
    - external educator judges;
    - a decision rule fixed before the run;
    - unblinding last;
    - Sharon's independent key check.
  - The recommendation to you will rest on the blinded scores, not on that leaning.

## 10 · What I ask you to authorise (when ready)

1. **Providers and terms:** which providers to include, and confirmation that you've read and accept their terms.
2. **Network:** the environment change in §4. You approve it in the tool's prompt when I propose it.
3. **Keys:** one capped key per included provider, entered by you in the credential form.
4. **Judges:** three educators named to the §6 profile.
5. **Decision rule:** the §7 rule, as written or amended.

**Then:**

- Second Eye writes the provider runner, the only missing piece of the kit, under Sharon's review.
- The run takes about a day including retries, and judging takes the educators' 2–3 hours each.
- You then receive the results and decide the provider and the C3w limits.

E runs alongside A2b, C2w and A3 without disturbing them.

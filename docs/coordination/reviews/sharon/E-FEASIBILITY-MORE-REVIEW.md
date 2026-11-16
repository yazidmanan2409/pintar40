# E · review of the exploratory feasibility note on Kimi, DeepSeek and Qwen

Sharon, 16 Nov 2026 (07:55 UTC). Read-only. **What I reviewed:**
- `docs/completion-4.1/E-FEASIBILITY-ADDITIONAL-PROVIDERS.md`, on `claude/e-feasibility-more` at `b608c6e006d2d51d89caa6db8dd1433621852c7a`;
- §2.2, §2.5, §3.2, §3.5 and §4, as asked.

## Two limits on this review, stated first

1. **I could not check the quotations against their sources.** My session cannot reach the providers' hosts, and no checker was run for this note, unlike the main E facts.
   - My judgements below **assume the A-graded quotations are verbatim**.
   - For a verdict to the same standard as `E-PROVIDER-FACTS-REVIEW.md`, a checker should re-read S-D8 to S-D10 and S-Q9, S-Q10, S-Q12 and S-Q13. Bob decides.
2. **Disclosure:** the note and I are Anthropic models, and Anthropic is a competitor of all three. My view of them is not independent of that interest.

## What holds now

- **On the evidence in the note, none of the three meets the baseline E holds Anthropic and OpenAI to:**
  - a stated no-training rule that covers API traffic;
  - a retention period;
  - a DPA, or published data-processing terms;
  - a named subprocessor list;
  - a hard paid spending stop;
  - stated eligibility for an Indonesian customer.
- **None can be accepted for PINTAR on present evidence.** The note says so implicitly ("no recommendation"), and I agree.
- **Kimi has no readable terms at all** (G1, G2). It is not assessable.
- **One process question for Bob, Q1:** the note says eight hosts were added to the environment's allowlist for this reading. The main E reading had the owner's approval for its 14. **Confirm the owner approved these eight.** If not, remove them.

## Judgements on the sections asked

**DeepSeek (§2.2, §2.5):**
- **Age:** "primarily intended for adults", and under-18s use it with a guardian's consent.
  - It addresses DeepSeek's own users, not the platform a feature sits in. That is narrower than Google's §20(d).
  - With educators as the only users of the feature, the note's interpretation is reasonable. **That holds only if learners never reach the feature and no learner data is sent** (C1 below).
- **Data, the material facts:**
  - storage and processing are stated to be in the PRC, under PRC mainland law;
  - inputs and outputs "may" be used to improve the service, with an opt-out whose application to the API is **unknown**;
  - retention is "as long as necessary";
  - there is no DPA, no subprocessor list and no zero-retention option.
- **Downstream end users' data is "not covered by this privacy policy".** That is a gap: under what terms DeepSeek handles personal data a developer sends is not stated.
- **Spend:** prepaid balance, with exhaustion returning 402. That is a natural hard stop, which is good.

**Qwen / Alibaba Cloud (§3.2, §3.5):**
- **Age:** "not intended for minors … Minors must not use the Alibaba Cloud Platform and the Cloud Services". As for DeepSeek, it is acceptable only under C1.
- **Data:**
  - "will never use your data for model training" is a clear no-training statement;
  - but Model Studio "stores data generated from model and application calls", with **no retention period**, and request and response content is queryable once inference logging is on.
  - **Whether content is stored when logging is off is not stated.** That is the key gap.
  - Region-pinned storage (Singapore) is stated. The "International" inference scope is undefined (G6).
- **Spend:** postpaid, and **no paid spending cap was found**. A runaway cost is not stopped by the provider.
- **The contracting entity for Indonesia is unread** (G6).

**§4's table:**
- **It is consistent with §1 to §3,** keeps fact and interpretation apart, and marks the per-draft costs as the assistant's own arithmetic.
- **One row to add, "DPA / data-processing terms":** NOT FOUND for all three. It is the decisive difference from Anthropic and OpenAI.

## What any of the three would need before reconsideration

- **C1, by design:** the feature sends **no personal data** and no learner content. Educators submit only curriculum text, enforced by an input check, not by instruction. Learners cannot reach it. The design must show this before any provider whose terms bar minors is used.
- **C2:** a DPA, or equivalent processing terms, a subprocessor list, and a stated retention period for API content.
- **C3:** for DeepSeek, written confirmation that API traffic is never used to improve the service. For Qwen, the retention of call data with logging off.
- **C4:** a provider-side hard spend stop, or a PINTAR-side one proven to stop before the budget. Qwen needs this.
- **C5:** the contracting entity and eligibility for an Indonesian customer, and the cross-border transfer basis. That last is a legal question, under Indonesia's personal-data law, if any personal data were ever sent. C1 is meant to make it moot.

## Addendum, 16 Nov 2026 07:25 UTC

- **Q1 is closed.** Bob confirms the hosts were added through the owner's own approval prompt, and that no provider API host is allowed.
- **The two limits above are open until the checker reports.** The checker is session_01FXjU1kiLcHztWsfizwRPjr, on branch claude/e-feasibility-check.
- **Then:** if it changes a judgement, I will amend here. If not, I will add a one-line confirmation.

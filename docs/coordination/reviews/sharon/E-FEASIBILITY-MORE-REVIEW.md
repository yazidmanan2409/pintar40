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

> **Amended by addendum 3 (the checker's results):** Qwen **does** have a published DPA. Its scope for Indonesia is a legal question. The verdict, that none can be accepted on present evidence, is unchanged.

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
- **One row to add, "DPA / data-processing terms":** ~~NOT FOUND for all three.~~ *Superseded by addendum 3: Qwen's DPA exists, so only DeepSeek and Kimi are NOT FOUND.* It is the decisive difference from Anthropic and OpenAI.

## What any of the three would need before reconsideration

- **C1, by design:** the feature sends **no personal data** and no learner content. Educators submit only curriculum text, enforced by an input check, not by instruction. Learners cannot reach it. The design must show this before any provider whose terms bar minors is used.
- **C2:** a DPA, or equivalent processing terms, a subprocessor list, and a stated retention period for API content.
- **C3:** for DeepSeek, written confirmation that API traffic is never used to improve the service. For Qwen, the retention of call data with logging off.
- ~~**C4:** a provider-side hard spend stop, or a PINTAR-side one proven to stop before the budget. Qwen needs this.~~ *Superseded by addendum 2, T2: a provider-side stop is required.*
- **C5:** the contracting entity and eligibility for an Indonesian customer, and the cross-border transfer basis. That last is a legal question, under Indonesia's personal-data law, if any personal data were ever sent. C1 is meant to make it moot.

## Addendum, 16 Nov 2026 07:25 UTC

- **Q1 is closed.** Bob confirms the hosts were added through the owner's own approval prompt, and that no provider API host is allowed.
- **The two limits above are open until the checker reports.** The checker is session_01FXjU1kiLcHztWsfizwRPjr, on branch claude/e-feasibility-check.
- **Then:** if it changes a judgement, I will amend here. If not, I will add a one-line confirmation.

## Addendum 2, 16 Nov 2026 07:40 UTC: Bob's matrix and his three questions

**What I read:** `docs/completion-4.1/E-FEASIBILITY-MATRIX.md` on `claude/bob-41-master-plan` at `3ef7cdf1d0496a346bdf160ce3361b735e5ca2a6`.

**Verdict:** the recommendation stands, with three corrections: one to my own C4, and two to the matrix's grading.
- Qwen is at most a candidate for a later evaluation.
- DeepSeek is not to be evaluated now.
- Kimi is not assessed.

**T1 · Alibaba's "not intended for minors … Minors must not use" clause, for an educator-only feature inside a platform learners use.**
- **As quoted, the clause governs who uses Alibaba's platform and services,** that is, who holds the account and makes the calls. It does not govern the audience of the customer's product.
  - That differs from Google's §20(d), which reached apps "directed towards or likely to be accessed by" minors, and so the platform itself.
  - On the quoted text, an educator-only feature can satisfy it.
- **The clause holds only under C1, made strict:**
  - **No learner action may cause a call**, directly or indirectly. That rules out, for example, generating feedback on a learner's answer, or hints on demand.
  - **No learner content is sent.**
  - **Generated material reaches learners only after an educator reviews and publishes it.**
  - A learner-triggered call would be "use" by a minor through PINTAR, whatever the account.
- **This is conditional on the checker.** If the full terms around the clause also reach end users or "applications directed to" minors, Qwen falls under ruling 36's logic for Google, and is ineligible like Google. *Could reasonably have been anticipated (Q2, the neighbouring act): the clause was quoted without its surrounding section.*

**T2 · Should a provider-side hard stop be a qualification check under ruling 40? Yes, a mandatory one. This corrects my own C4.**
- **My C4 allowed a PINTAR-side stop as an alternative. That was wrong.** A ledger in PINTAR bounds only the calls PINTAR makes. It does not bound a **leaked or misused API key**, which can be spent outside PINTAR without limit on a postpaid account.
  - Only a provider-side cap, or a prepaid balance, bounds that loss.
  - E's US$25 enforcement for Anthropic and OpenAI already relies on provider-side limits, so this keeps the same standard.
  - *Could reasonably have been anticipated (Q5, who checks): I asked who enforces the budget, not who enforces it once the key is out of PINTAR's hands.*
- **On present evidence, then, Qwen cannot qualify.** It has no cap beyond a free-quota-only mode. The matrix's §2 C4 wording ("without one it cannot qualify") is right, and my file now matches it.

**T3 · Interpretation or not-found stated as fact.** Each of these is a correction to the matrix, not a blocker:
1. **✖ is used for findings that are only not-found.** The legend makes ✖ mean "verified, and a problem", but the DPA row marks "Not found" with ✖ for both providers.
   - So does §2's list of "four verified points" against DeepSeek, which includes "no DPA … found".
   - Not found is "?", not a verified absence. Grade them "?" and say "not found", or verify the absence.
2. **Governing law for Qwen is marked ✔ Singapore** while the contracting entity for Indonesia is unread (G6). The law may follow the entity, so it should be "?" until the agreement is read.
3. **Storage for Qwen is marked ✔ Singapore.** That is true of stored data, but the "International" inference scope is undefined (G6). Add "inference location not stated".
4. **"All three APIs fit D8's one interface"** (§3) contradicts the matrix, where Kimi's API fit is "?". Say "the two readable APIs".
5. **"Roughly five times cheaper"** is the assistant's own arithmetic on estimates, so it should be in italic. By the matrix's own ranges the factor is about 6, so state it as "an estimated 5–6×".
6. **"Could not then be offered to schools"** (DeepSeek) should read "*could not be offered on present evidence*".
7. **"Qwen's conditions would cover most of" Kimi via Alibaba** is interpretation. Third-party models on Model Studio may carry their own terms. Put it in italic, and record it as unverified.
8. **§4 says "its three conditions" for Qwen,** while §2 has five (C1–C5). Make it "C1–C5".

**Not checked by me:** the claim that C3w already requires C1 (R-3, D9). It is cited, and I did not reopen those rulings.

**Still open:** the checker's results on the quotations themselves (addendum 1).

## Addendum 3, 16 Nov 2026 07:50 UTC: the checker's results

**What I read:** `docs/completion-4.1/E-FEASIBILITY-CHECK.md` on `claude/e-feasibility-check` at `c6b347711a8dd92559f245249894f787e4cc7349`. I read the counts, the differences and the new findings.
- Of the 36 A-graded quotes, 32 are verbatim, 3 are verbatim but context matters, and 1 has a minor wording difference.
- Kimi is still unreachable.

**Judgements this changes:**
1. **Qwen has a DPA (N-Q2). My "no DPA for all three" is superseded for Qwen.**
   - What it gives: the selected region, a subcontractor list with 10 working days' notice and a right to object, and deletion or return on termination.
   - What remains open:
     - **whether it applies.** It is triggered by "Data Protection Legislation" ("including but not limited to" GDPR and UK GDPR), and whether Indonesia's personal-data law counts is **for legal**;
     - the subcontractor list sits behind login, so it is unread;
     - **no retention period during the term (N-Q7)**, since deletion on termination is not a retention period.
   - **So C2 is partly met for Qwen.** It is not met for DeepSeek: DeepSeek makes PINTAR the controller and accepts no processor obligations (N-D4).
2. **Qwen's no-training rule is contractual (§4.48.1(e))**, which is stronger than the notice I judged.
   - It has an exception "unless you separately provide your consent".
   - **New condition C3a:** whoever administers the account must not give that consent. Any console opt-in must be checked before use.
3. **T1, the minors clause, is supported.**
   - It sits in the platform Privacy Policy, straight after text saying Alibaba has "no direct relationship with the end users of our customers".
   - That fits my reading: the clause addresses users of Alibaba's platform, not a customer's end users. Qwen is not in ruling 36's position.
   - **The strict C1 still applies unchanged:** no learner-triggered call, no learner content, and educator review before publication. The final reading stays legal's.
4. **T2, the hard stop, stands.**
   - The only stop is service loss once the available balance is **below zero**, with bills lagging 2–10 minutes (N-Q6). That allows overshoot, and it is not a cap.
   - **One route to meeting C4:** a prepaid Token Plan, if its key stops when the quota runs out. That is unread, and is the question to ask.
5. **Corrections to my T3 fixes:**
   - **Fix 2 becomes "B":** an Indonesian customer probably contracts with Alibaba Cloud (Singapore) Private Limited, by the catch-all (N-Q1). Indonesia is not named.
   - **Fix 3 is answered:** the International scope is "global nodes excluding Chinese mainland" (N-Q3). The matrix should say so rather than "not stated".

**Judgements this does not change:**
- **DeepSeek stays not now.**
  - The S-D9 clause on improving the service is conditioned on "strict de-identification" and sits in the general Terms of Use. Whether it reaches the API is still open (N-D1).
  - It still stores and processes in the PRC with no non-PRC region (N-D3), has no DPA, and makes the developer the controller (N-D4).
  - §5.4's forfeiture of an unconsumed balance is a commercial point, not a blocker.
- **Kimi stays unassessed.**
- **None of the three can be accepted on present evidence.**

**Qwen's open items, the questions for the owner or legal before any evaluation:**
- (a) does the DPA apply under Indonesian law;
- (b) the subcontractor list, read after login;
- (c) the retention period during the term;
- (d) whether the Token Plan gives a hard stop;
- (e) whether Alibaba "operates" in Indonesia.

**Could reasonably have been anticipated:** yes, for my "no DPA" (Q1, readers and writers). I accepted the note's NOT FOUND without asking where a DPA usually sits, in the Membership Agreement, which the note had left unread (G6). The checker found it there.

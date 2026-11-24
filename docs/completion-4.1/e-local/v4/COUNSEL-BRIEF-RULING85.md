# Request for legal advice: AI-assisted question drafting in PINTAR

**From:** the owner of PINTAR. Prepared by the PINTAR team for the owner to send (ruling 85, 23 Nov 2026).
**Status:** FINAL (24 Nov); Sharon: FIT TO SEND (`60691d59`). Sent together with part 2 (`COUNSEL-BRIEF-PART2-FIRST-USE.md`). **Scope and fees are subject to the owner's separate approval.**
**Providers in scope:** OpenAI (API platform) and Anthropic (API platform). Each is a separate candidate, assessed on the same questions.

**Before any work begins, please confirm your fee estimate for this request.** No fees are to be incurred until the owner has confirmed the estimate in writing.

## 1 · What PINTAR is, and what the AI feature does

- **PINTAR** is an Indonesian learning and assessment platform for schools. Learners and teachers use it; its users include children.
- **The AI feature** is an optional, separately paid add-on that a school turns on. It helps **educators** draft multiple-choice questions.
  - An educator chooses a lesson and supplies a teaching excerpt (up to 20,000 characters) that they wrote or selected. In normal use this is the educator's own text, not synthetic material.
  - **Before anything is sent,** PINTAR automatically checks the excerpt for personal information (rule R-3). If the check fails, nothing is sent. The request carries no user identifier.
  - The provider returns draft questions.
  - The educator reviews every draft and accepts, edits or deletes it. Nothing reaches a learner without that review, and the school's normal approval and publication steps.
- **Learners never interact with the AI.** They see only questions that educators have approved and published.
- **What is sent to the provider:**
  - the lesson excerpt;
  - generation instructions.
- **What is never sent:**
  - learner data of any kind (names, answers, results);
  - personal data of educators;
  - files.
- **Provider settings, for both providers:**
  - no training opt-in, and no data-sharing opt-in;
  - no built-in or web-search tools;
  - no Files or other long-retention service;
  - no feedback is ever submitted to the provider;
  - for OpenAI, request storage is turned off (`store:false`).
- **Retention, as the providers state it:**
  - **OpenAI:** abuse-monitoring logs are kept for up to 30 days.
  - **Anthropic:** content is deleted within 30 days as standard. Flagged content is kept for up to 2 years, and safety classification scores for up to 7 years, in addition to anything the law requires. Anthropic's «Covered Models» terms are not yet read.
- **Status:** neither provider is active. No account, key or production use exists. The feature is built against a local stand-in only.

## 2 · The questions

1. **"End User" and parental consent (OpenAI Services Agreement, the "End User" definition and §3.3(c); its Under-18 guidance).**
   - "End User" covers anyone "who uses Customer Applications", including "students".
   - Does a platform that serves learners, including minors, make the educator-only drafting tool's users "End Users"? If so, do §3.3(c)'s parental-consent duty and the Under-18 guidance apply?
   - Would a separate application, account or API project for the educator tool change the answer? We understand that technical separation alone does not establish contractual compliance.
   - Please also address Anthropic's equivalent terms.
2. **Indonesian personal data law (UU PDP, Law 27/2022): cross-border transfer.**
   - Neither provider's data processing addendum mentions Indonesia. Both rely on EU, UK and Swiss transfer mechanisms.
   - The design in §1 sends no learner data. The educator's excerpt passes an automated personal-information check before sending, and the request carries no user identifier. Does that keep UU PDP's transfer rules out of scope? Is an automated check sufficient, or is more needed?
   - How should educators' own account data be treated?
3. **"Human review" in formal assessment.**
   - If PINTAR questions are used in certifying assessments, does an educator's review, acceptance and edit of each draft count as the human review the providers' policies require (OpenAI's usage policies; Anthropic's provisions on high-stakes uses, including grading)?
   - Is drafting multiple-choice items outside Anthropic's grading category?
4. **The provisions on minors.**
   - Anthropic's usage policy covers «Products serving minors, including organizations providing minors with the ability to directly interact with products that incorporate our API(s)». OpenAI publishes separate Under-18 guidance (its page as read on 23 Nov 2026).
   - As read against the design in §1, where learners never interact with the AI, does either provision apply?
   - If they do, what is required?
5. **PINTAR's controller duties for its own provider-account data.**
   - What are PINTAR's obligations as controller for the personal data in its own provider accounts (administrator and billing contacts, usage logs)?
6. **Processing location.**
   - Anthropic states that processing is «Worldwide». For OpenAI we have established only its data processing addendum's EU, UK and Swiss transfer mechanisms, not its processing locations. Neither provider offers an Indonesian region.
   - Is that acceptable for the design in §1?
   - What would change if personal data ever came into scope?

## 3 · What we are asking for

- A written view on each of the six questions, for each provider where the answer differs.
- Any condition that would make a provider acceptable, stated as a condition we can verify.
- Anything in the design you would change.

**Attached on request:** the provider pages we read, with the date read and a fingerprint of each copy. No evaluation results are included; they are not relevant to the legal questions.

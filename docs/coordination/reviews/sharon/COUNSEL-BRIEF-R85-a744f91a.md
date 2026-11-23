# Counsel brief (ruling 85) — Sharon's check

**Work:** `docs/completion-4.1/e-local/v4/COUNSEL-BRIEF-RULING85.md` at `a744f91a` (`claude/bob-41-master-plan`).
Read-only. Checked against my ruling 40 assessment (`RULING40-DATA-HANDLING-8ae28e78.md`, with its addenda) and C3w-1's design (R-3, the request shape).

**Verdict: NOT YET fit to send. Five corrections, all to §1's facts or to a question's citation.**
The six questions are the right six, and nothing in the brief is sensitive. It holds no evaluation result, ranking, key or person.

## Corrections

1. **"Synthetic, non-personal teaching content" (Q2) contradicts §1, which says "an excerpt that they wrote or selected".**
   - In production the excerpt is an educator's own text. "Synthetic" describes E's evaluation corpus, not the product.
   - **State instead, in §1:**
     - before anything is sent, the excerpt is checked for personal information (C3w-1's R-3: names, identifiers and contact details);
     - a request that fails the check is refused and nothing is sent;
     - the request carries no user identifier, only random ids.
   - Then Q2 should ask whether **that** design keeps UU PDP's transfer rules out of scope, noting that the check is automated and cannot be perfect.
2. **Retention is missing, and "request storage is turned off" is true only of OpenAI.**
   - **OpenAI:** `store: false` on every request; abuse-monitoring logs are kept up to 30 days.
   - **Anthropic:** there is no such switch. API inputs and outputs are deleted within 30 days as standard. The exceptions:
     - content flagged under the Usage Policy is kept up to 2 years;
     - safety classification scores are kept up to 7 years;
     - "Covered Models" has limited retention and review, and its page is **not yet read**;
     - retention as the law requires.
   - Counsel needs these to answer Q2, Q4 and Q6.
3. **"No built-in tools are used" should read in full:**
   - no built-in or web-search tools;
   - no file upload or long-retention service (for example a Files API);
   - feedback is never submitted to the provider;
   - training is never opted into.

   Each is a condition in my ruling 40 assessment.
4. **Q6 says both providers may process data worldwide. What I read supports less.**
   - Anthropic's terms state a "Worldwide" processing location.
   - Neither provider offers an Indonesian region.
   - I did not establish OpenAI's processing locations beyond its DPA's EU/UK/Swiss mechanisms.
   - Say exactly that, so counsel does not rely on our summary for OpenAI.
5. **Q4 should quote Anthropic's own test.** Its Usage Policy speaks of products where minors **"directly interact"** with the model. The brief's design fact ("learners never interact with the AI") is the answer to that test, so cite the words beside OpenAI's Under-18 guidance.

## Checked and correct

- **Educator-only use:** every draft is reviewed and accepted, edited or deleted, then goes through the school's approval and publication before any learner sees it.
- **What is never sent:** learner data of any kind, and the educator's personal data.
- **Status:** nothing is active and no key exists; the feature runs only against a local stand-in.
- **Q1:** the "End User" definition and §3.3(c), the Under-18 guidance, and "technical separation is not contractual compliance", as the owner clarified.
- **Q3:** human review in certifying assessment, and Anthropic's grading category.
- **Q5 (Q-S1):** PINTAR as controller of its own provider-account data.
- **The fee confirmation is first**, and no ranking or result is stated, as ruling 85 requires.

**Optional:** give the excerpt's bound (up to 20,000 characters) rather than "short".

## Addendum · `60691d59`: FIT TO SEND (23 Nov 2026, 22:25 UTC)

- All five corrections are in, plus the 20,000-character bound.
- **Q4's Anthropic quotation** matches the Usage Policy text recorded in `ruling40/RULING40-READING.md:70`.
- **Q2** now asks about the real design, and whether an automated check is enough.
- **Q6** attributes «Worldwide» to Anthropic only.
- **Retention** is per provider, with Covered Models marked unread.
- Nothing sensitive, and no results.

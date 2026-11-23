# Ruling 40 · the provider terms reading brief (owner, 23 Nov 2026)

**Read-only.** Official pages only. **Network access authorises reading, not API calls, provider activation, spending or deployment.**

Run it in the `pintar40-e-evaluation` environment, with these hosts allowed:
- `openai.com`, `cdn.openai.com`, `platform.openai.com`, `developers.openai.com`, `help.openai.com`;
- `trust.anthropic.com`.

## Context for the reader

- **What PINTAR does:** adult educators draft multiple-choice questions through the API. Only synthetic lesson text and objective statements are sent, never learner data.
- **Who touches the AI:** learners, who are children in Indonesia, never interact with the AI. Every draft is accepted or deleted by an educator.

## The same criteria and evidence standard for both providers

| # | Question | OpenAI | Anthropic |
|---|---|---|---|
| 1 | Business terms: the version and date; training on API inputs and outputs | Services Agreement | Commercial Terms (already read: 17 Jun 2025) |
| 2 | Eligibility: products for schools; end-user age or minors clauses; a teacher-only workflow | Services Agreement, Usage Policies, under-18 API guidance | Usage Policy (already read: 12 Nov 2026) |
| 3 | Educational or assessment content; labelling of AI output | Usage Policies | Usage Policy (already read) |
| 4 | API retention; zero retention; data residency | API data guide | Commercial Terms or DPA (read), plus any retention page |
| 5 | **Subprocessors:** names, purposes, locations, the page's date | Subprocessor list | `trust.anthropic.com/subprocessors` |
| 6 | **DPA:** how it is entered (automatic or by form); transfer mechanisms; any mention of Indonesia | DPA | DPA (already read: 24 Feb 2025, automatic, SCCs with UK and Swiss addenda) |

**For each answer, record three things separately:**
1. **What the document states:** the verbatim quote, the URL, the title and the version or effective date.
2. **The interpretation for PINTAR,** marked as interpretation.
3. **What needs legal advice or confirmation.**

**If a page can't be opened, record it as NOT READ.** Never infer compliance from a summary or a search snippet.

**Output:** `docs/completion-4.1/e-local/v4/ruling40/RULING40-READING.md`, with one table per provider and the open points for the owner (D-7, 25 Nov, 10:00 UTC).

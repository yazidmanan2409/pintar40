# PINTAR · one continuous execution sequence, 4.1 → 5.0 (ruling 71)

Bob, 23 Nov 2026. **Coordination document, deliberately short.**

**What governs, unchanged:**
- the roadmap (`PINTAR-ROADMAP.md`, `claude/roadmap-45-50`, approved 11 Nov);
- the planning audit (`PLANNING-AUDIT-4.2-4.5-5.0.md`);
- the 4.1 records (`docs/completion-4.1/`);
- the Guest Mode plan (`GUEST-EXPLORATION-4.5-PLAN.md` at `3160b3d0`).

This page only orders them. **It authorises no implementation:** each version still opens with its own planning and the
owner's implementation authorisation (roadmap header; audit §0.2).

## 1 · What changed (ruling 71)

- **The comprehensive owner and educator walkthrough moves from 4.1 to the completed 5.0.** That changes when humans
  accept the work, not the standard of verification.
- **Every stage still closes on its own internal gates:**
  - automated and integration tests;
  - Sharon's and Daisy's independent reviews;
  - the complete end-to-end journeys;
  - educational and reporting correctness;
  - migration, rollback and recovery proofs;
  - evidence-backed completion criteria.
- **"4.1 accepted" becomes "4.1 gates closed".** Concretely:
  - Z's candidate is green and reviewed, and is promoted to staging under the owner's authorisation;
  - every Z-READINESS row is closed or explicitly deferred;
  - D2-R (the certificate refinement) is done.
- **Production stays at 111 until the owner decides otherwise.** The readiness register (PR-1 to PR-20) stays live.

## 2 · The sequence and its gates

```
4.1  C3w-1 ─► (C3w-2 if a provider qualifies, D-7) ─► Z (incl. the D-1 repair, D-6, R-items) ─► D2-R ─► 4.1 GATES CLOSED
4.2  [owner decision D-A below]
4.5  planning gate ─► foundations (RD-4 runtime proof · 4.5-01 Question Intelligence · 4.5-04 classification ·
     4.5-10 scoring policy) ─► 4.5-02 comparability ─► 4.5-05 Quiet Intelligence ─► protected/formal items as decided
     (4.5-06/07/08 need R-1, R-2) · Guest Mode G0–G5 in parallel ─► 4.5 GATES CLOSED
5.0  planning gate ─► B4 server-side progression ─► B1 Educator Growth + Shared Growth Compact ─► B2/B3 interventions
     (needs R-4) ─► B5 institution level ─► 5.0 GATES CLOSED
     ─► whole-platform integration and verification ─► the COMPREHENSIVE WALKTHROUGH (owner, Dr Gladys)
```

**The critical path:** C3w-1 → Z → the 4.1 gates → the 4.5 measurement foundations (RD-4's four findings proven at
runtime first; "measurement quality before interpretation") → Quiet Intelligence → 5.0's growth and interventions →
integration → the walkthrough.

**Work that can run in parallel** (only where it shortens the path):
- 4.5 planning by Bob during Z (design only; the audit marks it plannable);
- Daisy's Quiet Intelligence screen design;
- Guest Mode G0 and G2 design once 4.5 opens (it depends on no unresolved 4.5 item);
- the owner's decisions and counsel (R-1 to R-5; PR-1), which have the longest lead.

## 3 · Decisions for the owner (each blocks a named stage, not today's work)

| # | Decision | Why it matters | Bob recommends | Needed by |
|---|---|---|---|---|
| **D-A** | **4.2's place.** The approved order is 4.1 → 4.2 → 4.5 → 5.0. The directive names 4.1 → 4.5 → 5.0 | 4.2 holds 14 operational items (Exam Mode, positions, two-school roles, export, past reports…). Several 4.5 items assume 4.2's answers (audit X-1, X-2: past reports vs. explainable history; positions vs. assessor authority) | **Keep 4.2 before 4.5, limited to its committed list,** unless the owner means to drop or defer it. Skipping it silently would leave 4.5-06/07/08 resting on undecided roles and history | When 4.1's gates close |
| **D-B** | **The five pending roadmap decisions R-1 to R-5** | R-2 (retention) before production data and 4.5-08; R-5 (competency anchor) in 4.5 planning; R-1 (formal evaluation) before 4.5-06/07; R-3 (structured misconception codes) before 4.5-09; R-4 (staggered interventions with children, likely an ethics review) before 5.0 B2 | Start R-2 and R-4 early: they are the longest lead (legal, ethics). Bob drafts recommended answers as each version's planning opens | As listed |
| **D-C** | **Real-use evidence before 5.0** | No real educator has used 4.x (Review P's top risk, PETE-01). 4.5's conclusions and 5.0's longitudinal claims need real sittings (audit G-4, X-12). Deferring all human use to after 5.0 risks building on untested assumptions | **One focused interim educator review after 4.1's gates** (the directive allows it): Dr Gladys on the core teaching-and-evidence cycle. Keep the 10-adult pilot as a separate owner decision, not assumed | When 4.1's gates close |

## 4 · Timeline (an estimate, not a date)

**The basis:**
- 4.1's measured pace: plan approval 12 Nov, nine batches promoted by 19 Nov;
- C3w-1 about 4 days so far, with chunk 3 remaining;
- the audit's maturity: 4.5 is 0 complete, 5 partial, 7 unresolved and 1 blocked; 5.0 is mostly blocked on 4.5 by design;
- Guest Mode's own estimate: 31–39 person-days.

| Stage | Estimate | Confidence | Main assumptions |
|---|---|---|---|
| 4.1 gates closed | **About 2–3 weeks** | Medium | C3w-1 in about 3–5 days; Z in about 4–6 days with no major finding; D2-R in about 3–5 days; the owner's promotion authorisations are timely |
| 4.2 (if kept, D-A) | **About 3–6 weeks** | Low | 9 of 14 items need narrow owner decisions first |
| 4.5 | **About 8–14 weeks** | Low | RD-4 proves out cheaply; R-2 and R-5 are decided in planning; Guest Mode runs in parallel |
| 5.0 | **About 6–12 weeks** | Very low | R-4's ethics question is answered in time; 4.5's measurement holds |
| Integration and verification of 5.0 | **About 2–3 weeks** | Low | — |

**In total:** roughly **5–9 months** to an internally verified 5.0 with 4.2, or **4–7 months** without it.

**What could move this most:**
- owner and legal lead times (R-2, R-4, PR-1);
- what RD-4's runtime proof finds;
- the platform's usage limits.

It will be re-estimated at each planning gate, with the measured pace replacing these figures.

## 5 · Unchanged

Every security, privacy, integrity, accessibility, educational and recovery protection. No production deployment,
spending, new infrastructure, paid AI, external pilot or change to a protected gate without the owner. **External
institutional discussions** are handled by the owner and Dr Gladys. They change nothing in the roadmap, access, IP or
governance.

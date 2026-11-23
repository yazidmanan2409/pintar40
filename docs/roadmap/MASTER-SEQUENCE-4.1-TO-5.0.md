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
POST-4.1  HX & Trust Audit (ruling 79) ∥ Rationalisation & Performance (ruling 54) ─► POST-4.1 INTERNAL ACCEPTANCE
4.5  planning gate ─► OPERATIONAL FOUNDATION (all 14 former 4.2 items, ids kept) ─► OF GATE ─►
     intelligence foundations (RD-4 runtime proof · 4.5-01 Question Intelligence · 4.5-04 classification ·
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


## 2b · Post-4.1 internal acceptance (rulings 54 and 79)

Two milestones open when **4.1's gates close** and run together, before 4.5's operational foundation. 4.5 planning, which is design only, may overlap them.
- **The Human Experience, Consistency & Trust Audit** (ruling 79):
  - eight dimensions and twelve real journeys, on synthetic data;
  - Daisy, Sharon and Second Eye find; Bob consolidates;
  - one report, classed Critical, Significant or Improvement.
  - **Draft journey scripts** (design only): Daisy's `docs/coordination/ux/roadmap/AUDIT-79-SKRIP-PERJALANAN-DRAF.md` (`4f0b3f42`, `ux-1/daisy-experience`). Three questions to settle when the audit opens: who captures each journey's evidence; whether Dr Gladys reads J2, J3 and J11 (through the owner); one shared synthetic world or fixtures per journey.
- **Codebase Rationalisation & Performance** (ruling 54): optimisation, not behaviour.

**Coordination:** the audit runs first on each area, so rationalisation never changes behaviour the audit is still examining. Approved fixes from both go through the normal gates.

**What they replace:** ruling 54's opening condition ("formal 4.1 acceptance" and "before 4.2") reads, under rulings 71 and 72, as "4.1 gates closed" and "before 4.5's operational foundation".

**What they don't replace:** neither replaces the walkthrough after 5.0. Decision D-C (one interim educator review) may draw on the audit's journeys.

**The standing principle** (ruling 79) applies to every feature from now on:
- Does it work correctly?
- Does it work with everything around it?
- Does it make sense to the person using it? *"How will the person using PINTAR experience this?"*

## 2a · 4.5 absorbs the whole of 4.2 (ruling 72)

4.2 is retired as a delivery milestone. **Its full approved scope is delivered in 4.5:** all 14 committed items
(4.2-01 to 4.2-13, with 4.2-06 split), its register item, and its candidates on their existing terms.

**Traceability:** each item keeps its **4.2-xx identifier**, requirements, tests and acceptance conditions (audit §1.1).
Only its delivery version changes.

**Dependency order** (the audit's §2.1 contracts, unchanged), enforced by an **operational-foundation gate (OF gate)**
inside 4.5:

| Operational item (former 4.2) | Must precede | Why |
|---|---|---|
| 4.2-02 positions and acting appointments; 4.2-03 two-school roles | 4.5-06 formal evaluation; 4.5-07 educator protections | Assessor authority and readership assume the role model (X-2) |
| 4.2-05 past reports (D-05) | 4.5-08 explainable history | One definition of "the past", not two (X-1) |
| 4.2-04 school data export | 4.5-08 snapshots | Retention and export interlock (X-4, R-2) |
| 4.2-12 the Question Health schedule | after RD-4's runtime proof; then 4.5-01 | Don't schedule figures before they are proven (X-3) |
| 4.2-01 Exam Mode | 4.5 intelligence that reads exam sittings | Builds on A3; sittings must be stable first (X-14, X-16) |

**The OF gate** is an engineering gate, not a walkthrough. It closes when the operational items are built and reviewed,
their journeys pass, and the cross-feature regression tests are green. Dependent intelligence features may be built
earlier where independent, but are **accepted only after it.**

Independent 4.5 work runs in parallel: Guest Mode, 4.5-04 classification, Daisy's design, and RD-4's proof.

**Batches, integration contracts and regression tests** are drawn up at 4.5's planning gate (during Z, by Bob), from
the audit's existing rows. There is no fresh replanning.

## 3 · Decisions for the owner (each blocks a named stage, not today's work)

| # | Decision | Why it matters | Bob recommends | Needed by |
|---|---|---|---|---|
| **D-A** | **4.2's place: DECIDED (ruling 72).** 4.5 absorbs the whole of 4.2, with identifiers, tests and acceptance kept, and an OF gate before the dependent intelligence | — | — | Done |
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
| 4.1 gates closed | **About 3.5–4 weeks from 23 Nov** (Z in two streams; about 11 working days on the critical path) | Medium | C3w-1 is done (ruling 80). Z was 15.5 + 3 days for one builder. Run as two streams (`batches/z/Z-PARALLEL-PLAN.md`; acceptance criteria unchanged), it is about 11 days on the critical path. D2-R takes about 3–5 days. The owner's promotion authorisations are timely |
| 4.5, including all of the former 4.2 | **About 10–18 weeks** | Low | The former 4.2's effort (about 3–6 weeks) is **kept, not absorbed for free**, and partly overlaps independent 4.5 work. 9 of its 14 items need narrow owner decisions; RD-4 proves out cheaply; R-2 and R-5 are decided in planning |
| 5.0 | **About 6–12 weeks** | Very low | R-4's ethics question is answered in time; 4.5's measurement holds |
| Integration and verification of 5.0 | **About 2–3 weeks** | Low | — |
| Post-4.1 internal acceptance (rulings 54 and 79) | **About 2–3 weeks**, overlapping 4.5 planning | Low | Twelve journeys across four reviewers; the size of the fixes depends on what is found |

**In total:** roughly **5½–9½ months** to an internally verified 5.0. The consolidation removes a milestone, not the work, and the post-4.1 internal acceptance adds about 2–3 weeks.

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

# PINTAR · Post-4.1 Codebase Rationalisation & Performance Optimisation (deferred engineering milestone)

**Entered in the schedule on 18 Nov 2026, on the owner's directive (ruling 54).** Status: **DEFERRED, not open.** No
investigation, measurement or change is made under this milestone until it opens.

## Trigger: formal 4.1 acceptance, and nothing else
It opens only when **all three** hold:
1. **Z:** integrated verification of the one 4.1 candidate (THE PLAN §8; `PLAN-A3-C3W-Z.md` §4);
2. **the educator walkthrough** with Dr Gladys and her educators;
3. **the owner's acceptance of 4.1.**

A staging promotion, a percentage complete or a target date does **not** open it.

## Position in the sequence
`… A3 → C3w-1 → C3w-2 → Z → walkthrough → owner's 4.1 acceptance → **this milestone (closed, with verified results)** → substantive 4.2 development`

- **It closes before substantive 4.2 development begins,** unless the owner explicitly approves a different sequence.
- **It does not slow 4.1.** A3, C3w, Z and the rest of the 4.1 acceptance work continue on their own plan.

## Objective
Make PINTAR faster and easier to maintain for 4.2, 4.5, 5.0 and beyond. Priority goes to changes that:
- remove a measured bottleneck;
- reduce operating costs;
- simplify code the team has evidence is costly to maintain.

Approved product behaviour, educational rules and release safeguards are preserved.

## The phases
1. **Baseline and inspection** (Bob may investigate and measure independently once the milestone opens).
   - **The baseline:** the accepted 4.1 commit and migration level, with the environment, dataset and representative
     workloads recorded so the measurements can be repeated.
   - **What is measured:**
     - user-facing responsiveness on supported devices;
     - API and database timings;
     - request counts, bundle size and job behaviour;
     - resource use;
     - build and test times.
   - **The journeys measured,** among others: saving an assessment answer, opening a class report, and working in
     Studio.
   - **The inspection looks for:** duplication; obsolete paths and dependencies; expensive queries; unnecessary
     renders and requests; redundant jobs; and abstractions that make change harder.
   - **Before any removal is proposed,** every direct and indirect caller is checked: database triggers, scheduled
     jobs, integrations, upgrades and restore paths.
   - **Complexity is kept where it serves a verified purpose** in security, auditability, compatibility or fault
     isolation.
2. **A prioritised plan, for the owner's approval.**
   - **For each material proposal:** the evidence, expected benefit, effort, risk, affected behaviour, verification and
     recovery plan.
   - **The plan also gives:** a time-boxed first set of changes, what is deferred, and where the evidence is still too
     weak to justify a change.
   - **No substantive change is made before this approval.**
3. **Implementation in small batches, after approval.**
   - **Routine low-risk work** inside the agreed scope proceeds without further approval.
   - **Roles:**
     - Second Eye implements and measures;
     - Sharon independently reviews security, permissions, data integrity, migrations and recovery;
     - Daisy verifies the affected journeys, usability and accessibility;
     - Bob owns sequencing and the acceptance evidence.
   - **Preserved throughout:** assessment and scoring semantics, reports, certificates, audit trails, migration
     history, data preservation and the approved end-to-end journeys. The established tests and promotion safeguards
     apply.
   - **Escalated to the owner:** material decisions on architecture, security, evidence integrity, spending or product
     behaviour.
   - **Production deployment needs the owner's separate authorisation.**
4. **Measure again and close.**
   - **The comparison** is against the accepted 4.1 baseline, under comparable conditions.
   - **What each change must show:**
     - a performance change: its measured gain and any trade-offs;
     - a simplification: the maintenance burden removed, and evidence that the affected behaviour still works.
   - **Every regression or inconclusive result** is reported with its disposition.
   - **The milestone closes** when the approved work is verified and every remaining finding has a recorded
     disposition.

**For every proposed change:** "And then what?" and "What else did that change?"

## Deliverables, in the existing engineering records
1. The baseline and the audit findings.
2. The approved priority list and its verification criteria.
3. The before-and-after results.
4. The independent closure verdict.

## Inputs already recorded, for when it opens (none acted on now)
- **Roadmap Revision 3,** "Post-4.1 Codebase Rationalisation and Performance Audit": the method, and the 2 October
  efficiency figures as historical illustration only, not a baseline.
- **The planning audit:**
  - G-8: an optional full sweep pairing `client_rpc_registry` with each page's conditions (about one day);
  - T-1: a test-clock override, as a cross-cutting harness decision.
- **`EXECUTION-PLAN.md` §5** and the Z register triage (`Z-READINESS.md` R-15): non-blocking findings marked "or in 4.2".
  These are candidates only; each needs this milestone's evidence test.

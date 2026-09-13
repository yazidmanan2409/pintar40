# 13 — Architectural Decision Log (ADR) Template

*Baseline amendment (2026-09-12): "Traces to" section added for
Requirement → Architecture → Implementation → Test → Audit Evidence
traceability; new mandatory-ADR triggers for scoring-policy versioning,
evidence eligibility, metric catalogue changes, governed-parameter bounds,
category moves under the BUILD NOW / FOUNDATION NOW / LATER / PARK scheme,
stop-patch-loop root causes, and patent-traceability links.*

Lightweight by design — the point is that Fable 5.1 will actually keep
using it. Create `docs/adr/NNNN-short-title.md` per decision using this
shape.

```markdown
# ADR-0001 — <short title>

**Date:** <ISO date>
**Phase:** <FABLE phase this belongs to, e.g. FABLE-02>
**Status:** Proposed | Accepted | Superseded by ADR-XXXX

## Problem
What question forced a decision? One or two sentences.

## Considered options
- Option A — one line
- Option B — one line
- Option C — one line (if any)

## Decision
Which option, stated plainly.

## Reason
Why this option over the others — tie back to a doctrine/invariant/lesson
from docs/rebuild/ where applicable (e.g. "per INV-13" or "per Lesson 4").

## Calm-surface check
Does this make PINTAR calmer for the person using it while making the
system more rigorous underneath? If complexity leaks to the user, say what
the surface does about it. If simplicity would weaken evidence, security,
governance, historical integrity or educational validity, say why the
foundation wins.

## Consequences
What this makes easier, harder, or forecloses. Include the honest
trade-off, not just the upside.

## Traces to
- Requirement: <doctrine/philosophy/Dr. Gladys cycle/baseline section>
- Architecture: <doc + section, invariant ids>
- Implementation: <modules/paths>
- Test: <selftest ids>
- Audit evidence: <where an independent auditor finds proof>
- Patent/innovation register entry: <id, if the product owner has registered one — never invented>

## Affected components
File/module paths or domain areas touched.

## Affected database objects
Tables/views/functions/policies touched, if any.

## Security implications
State explicitly, even if "none" — don't skip this section.

## Future constraints
What a later decision must now respect (or explicitly may revisit).

## Tests proving the decision
Which automated test(s) in the selftest contract assert this decision holds.
```

## When a new ADR MUST be recorded

- Any schema change to a table/column that participates in an invariant
  (doc 03) or a lifecycle (doc 04).
- Any new or changed RLS policy, storage policy, or authorization rule.
- Any change to what is versioned for historical interpretation (scoring
  policy, engine version semantics, assessment definition versioning,
  metric catalogue definitions — doc 08).
- Any change to evidence eligibility rules, evidence classes or channels
  (doc 06).
- Any change to the bounds of a governed parameter (hesitation window,
  late-sync grace, minimum-evidence thresholds, Quick Assessment limits).
- Any new abstraction introduced with fewer than two real callers
  (per doc 12's speculative-abstraction failure mode — record the
  justification even if the decision is "build it anyway, here's why").
- Any decision that moves an item between BUILD NOW / FOUNDATION NOW /
  LATER / PARK in doc 09.
- Any resolution of an item from doc 11 (open decisions) — link the ADR
  back to the OD-N id it resolves.
- Any stop-patch-loop event (doc 16 §7) — the root cause and the invalid
  assumption are recorded here, not only in a commit message.
- Any decision the product owner links to a patent-related technical
  concept (innovation register) — the ADR carries the link; it never
  invents the claim.
- Any deviation from a FABLE phase prompt's stated instruction — record
  what changed and why, don't just silently diverge.

## When it is NOT required

Routine implementation details with no architectural weight (variable
names, a component's internal layout, a copy tweak). If in doubt, write the
ADR — it's cheap; a missing one is expensive to reconstruct later.

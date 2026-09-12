# 13 — Architectural Decision Log (ADR) Template

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

## Consequences
What this makes easier, harder, or forecloses. Include the honest
trade-off, not just the upside.

## Affected components
File/module paths or domain areas touched.

## Affected database objects
Tables/views/functions/policies touched, if any.

## Security implications
State explicitly, even if "none" — don't skip this section.

## Future constraints
What a later decision must now respect (or explicitly may revisit).

## Tests proving the decision
Which automated test(s) in the selftest suite assert this decision holds.
```

## When a new ADR MUST be recorded

- Any schema change to a table/column that participates in an invariant
  (doc 03) or a lifecycle (doc 04).
- Any new or changed RLS policy, storage policy, or authorization rule.
- Any new abstraction introduced with fewer than two real callers
  (per doc 12's speculative-abstraction failure mode — record the
  justification even if the decision is "build it anyway, here's why").
- Any decision that moves an item from category B/C/D to A in doc 09.
- Any resolution of an item from doc 11 (open decisions) — link the ADR
  back to the OD-N id it resolves.
- Any deviation from a FABLE phase prompt's stated instruction — record
  what changed and why, don't just silently diverge.

## When it is NOT required

Routine implementation details with no architectural weight (variable
names, a component's internal layout, a copy tweak). If in doubt, write the
ADR — it's cheap; a missing one is expensive to reconstruct later.

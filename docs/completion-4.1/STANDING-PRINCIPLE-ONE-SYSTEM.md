# PINTAR standing engineering principle · one system

> **Owner's standing directive, 11 November 2026.** Permanent. It applies to PINTAR 4.1, 4.2, 4.5, 5.0 and every
> later release. It is a habit of work carried inside the existing engineering, review and acceptance process; it
> creates no gate, no document and no approval of its own.
>
> *Kept under `docs/completion-4.1/` because that is where the Chief Architect may commit today. It is not a 4.1
> record: when a merge is authorized it belongs in a version-independent place.*

**The objective.** Not working features, but one coherent, trustworthy PINTAR. PINTAR evolves as one integrated
system, not a collection of individually successful modules.

## 1 · What 4.0 taught

- A completed feature is not necessarily a completed human journey.
- Green tests do not guarantee that modules agree with each other.
- A correct decision in one module can produce a wrong consequence in another.
- Account lifecycle, institutional boundaries and historical evidence cannot be treated separately.
- UX consistency is a property of the whole platform, not of a screen.
- What happens after an action must be tested: reversals, transfers, corrections, departures and failures.

Two cases to remember. **The account lifecycle:** ordinary account management had to be reconsidered once we asked
what happens when a person transfers, leaves, closes an account or asks for deletion. **C1w's finding F-1:**
correcting an answer key is not enough if the teacher's evidence, the misconception analysis and the remediation go
on using the old conclusion.

## 2 · The three questions

Asked of every significant feature, state transition and correction, when it is designed and again before it is
accepted:

1. **And then what?** Follow the action through its consequences, to the end of the human journey.
2. **What else did that change?** Name every module, role, institution, record, report, decision and downstream
   process it affects.
3. **What happens when things go wrong?** The failure, the retry, the interruption, the reversal, the recovery.

## 3 · The five dimensions

| Dimension | Question |
|---|---|
| Human journey | What happens next for the actual user? |
| Cross-module effects | What other features, reports or decisions are affected? |
| Lifecycle | What happens when circumstances change, reverse or end? |
| Evidence integrity | Does every module agree on the authoritative truth? |
| Boundaries | Are permissions, institutional separation, history and privacy preserved? |

These are questions, not gates.

## 4 · The rules that follow

1. Consequence analysis is applied to every significant feature, state transition and correction.
2. Effects are traced across modules, institutional boundaries, account lifecycles, evidence, reporting, UX, security
   and recovery.
3. Every downstream consumer is verified to use the authoritative information.
4. Historical truth is preserved, and current decisions reflect the result in force. Both, never one at the cost of
   the other.
5. Complete human journeys are tested, including exceptional, reversed and terminal states.
6. A new capability is examined against the existing functionality it meets, not only on its own.
7. Each role applies this within its own responsibility (§5).

## 5 · Where it lives in the work

| Who | Where the questions are asked | What shows that they were |
|---|---|---|
| **Chief Architect** | In the plan of each version and batch; at each batch boundary | The plan names the consumers and transitions of each change. A batch is not closed without the evidence below |
| **Engineer** | In the impact analysis before building, and again before the candidate | The cross-module inventory on the completion page: each interface, how it was checked, the evidence, any limitation. Red-first tests for the transitions that apply. When a defect is found: the shared cause and the other places inspected |
| **Database, security and integrity reviewer** | In the pre-build review and the result review | Agreement between every reader of the same truth; boundaries across roles and schools; the lifecycle and failure cases; recovery |
| **UX and accessibility reviewer** | In the design input and the result review | The new screen beside existing ones of its kind; what the user sees after the action, after a reversal, and after a failure |
| **Owner** | At acceptance | The integrated journeys, run on the candidate |

For 4.1 the working form of this is `SYSTEM-INTEGRITY-4.1.md`. Each later version's plan carries the same table for
its own batches; it does not need to restate this principle.

## 6 · Limits

- **Bounded.** The trace follows the change's own callers, readers and consequences. It is not a re-audit of the
  platform at every change.
- **Prospective.** Completed work is not reopened without a concrete finding. Existing behaviour is investigated when
  a dependency or an inconsistency is identified.
- **Within authority.** It changes no approved plan, scope, sequence or authorization boundary. A consequence that
  cannot be handled inside the approved scope is recorded and escalated, not silently absorbed or silently dropped.
- **A stated limitation is acceptable. An unexamined consequence is not.**

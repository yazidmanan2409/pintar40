# Engineering lessons that outlive the phase that found them

Rules earned by a defect, kept because the defect will recur otherwise. Each one
names what was believed, what was true, and what caught it. They are written as
rules rather than as stories because a rule survives being skimmed.

This file is build commentary, not architecture. The controlling contracts are
the frozen documents in `docs/rebuild/` (ADR-0019); nothing here amends them.

---

## L1 — A grant is an exposure decision, not migration boilerplate

No `grant execute` to `anon` or `authenticated` without a `client_rpc_registry`
row in the same statement carrying a deliberate `rpc_exposure` class. A grant
written without deciding what it exposes is a decision taken by accident.

*From FABLE-04, 0047.*

## L2 — `alter default privileges` is not the guarantee anyone assumes

`alter default privileges … revoke all on functions from anon, authenticated`
was set in 0001 and has been read ever since as "new functions are closed by
default". **It is not.** `EXECUTE` is granted to `PUBLIC` by default, the
default-privileges lines do not revoke from `PUBLIC`, and
`has_function_privilege('anon', …)` is satisfied through `PUBLIC`. What has
actually been holding the line is the explicit
`revoke all on function … from public, anon, authenticated;` in every migration
— a convention, doing the work of a mechanism.

**So: every new function is revoked explicitly, from `public` as well as from the
client roles, in the migration that creates it.** A terminal assertion counting
anon-executable functions in that migration is cheaper than finding out later.

Found in Task 2, 0066: six new functions became anon-executable and
`functions_executable_by_anon` went 0 → 6. The counter found it; reading did not.

## L3 — `audit_log.at` is transaction time, so no audit property may be a time window

`audit_log.at` defaults to `now()`, which is **transaction start**. Every row
written in one transaction carries an identical timestamp — including rows
written before and after something else that happened in that same transaction.

Any property of the form *"was X true when this row was written?"*, reconstructed
by comparing `at` against another table's timestamps, is therefore **unsound**:
it classifies rows written before an event as during it, and rows written during
an event as after it, and no choice of `<` versus `<=` repairs that.

**So: express audit properties on columns, or structurally on the writer.** Where
a property really is about ordering, it needs a clock that advances within a
transaction (`clock_timestamp()`) or a sequence, and neither is what `at` is.

Found in Task 2, 0067, defining the dual-identity property. **This is not
specific to evaluation.** Anything that later reconstructs a sequence of events
from the audit log — FABLE-06's intelligence layer most obviously — inherits it.

## L4 — Assert on syntax a compiler would see, never on text a comment could contain

A verification block that greps `pg_get_functiondef()` is reading **comments as
well as code**. Four guards in two days fired on their own explanatory prose:

- 0064's `r.status = 'PUBLISHED'` check matched its own `ORDER BY` tie-breaker;
- 0067's expiry trap matched the comment explaining the expiry trap;
- 0067's summary-injection check matched the multi-line `INSERT`'s column list;
- 0067's forgeable-header check matched an unrelated `request.headers` read
  several lines away.

**So: match a qualified column read (`s.expires_at`), a syntactic shape
(`p_summary ||`), or a single line (`(?n)`) — never a bare word, and never two
words in proximity across lines.** And pair every negative assertion with a
positive one, so the check cannot be satisfied by deleting the thing it guards
instead of correcting it.

## L5 — Assert a security property from the predicate, never from the intent

`SYSTEM_ADMIN` was described, in a design document and in the product's own
language, as a role bounded to its tenant like any other. The predicate says
otherwise: `is_system_admin()` never reads `scope_node_id`, `has_scope()` returns
true for it before loading the node's `jalur`, nine functions short-circuit on it
including `is_member_of_institution()`, and eight policies across six tables grant
on it directly. The role is *defined* as the absence of tenant bounds.

**So: before relying on a boundary, read the function that defines it.** A
boundary described in prose — including prose in this repository — is a claim,
not a control.

Found in Task 2 while implementing ADR B, whose Super Admin section was amended
rather than corrected in place, because an ADR that edits away its own error
teaches nothing. Same failure class as Task 1's **F1**: a property asserted, not
tested.

## L6 — A probe that can skip itself proves nothing

Migrations run **before** seeds, so a conditional probe in a verification block
is vacuous on a from-empty replay. Build the data the probe needs in a
rolled-back subtransaction (ADR-0014), and measure what is already there rather
than assuming it — 0065's probe named a purpose outright, passed from empty, and
failed on the upgrade path where the seeded D1 tenant already held it.

The same rule applies to any check: an assertion nobody has watched fail proves
nothing. Every `baseline-parity` assertion was taken red deliberately before it
was trusted (ADR-0019).

## L7 — An ADR amends prose; find where the old rule was actually enforced

When a decision changes a rule, the amendment is **incomplete until every
mechanical enforcement of the old rule is located.** Prose is cheap to amend.
The index, constraint or trigger is where the rule really lived.

D1's *"one bootstrap tenant"* was not only a sentence in ADR-0008. Migration 0043
enforced it as `unique ((true)) where is_official_bootstrap` — **that index was
the rule.** An amendment that changed the prose and the assertion but left the
index would have produced a per-purpose rule that could never be reached: the
second purpose would have been refused by the old index, and the refusal would
have looked exactly like the new rule working correctly. 0065 drops it in the
same migration that creates the replacement, and asserts it is gone.

**So: before amending a rule, grep for it as a mechanism** — indexes,
constraints, triggers, guards, assertions, lint counters — and replace or remove
each one in the same change. A control that silently does nothing is worse than
no control, because it is believed.

*Distinct from L5: L5 is about believing a boundary you never read; L7 is about
changing a boundary you did read, in only one of the places it exists.*

---

## L8 — An illustration in a prompt is not a specification, and the builder cannot tell

Two of the four documents this build works from are written by the reviewer.
When that prose names a role, a column or a count, **it will be read as
measured** — because most of it is, and nothing in the sentence distinguishes
the two.

The FABLE-06 execution prompt §3.3 illustrated execution-time re-authorization
with *"a template saved by a dean and opened by a lecturer."* A dean cannot save
an institution report template. `role_capabilities()` returns
`CAN_MANAGE_REPORT_TEMPLATES` for `INSTITUTION_ADMIN` and `SYSTEM_ADMIN` only,
and doc 05's authorization matrix says the same thing with four ❌ in the
STUDENT / EDUCATOR / HoD / DEAN columns. **The frozen baseline and the running
schema agreed with each other; only the illustration disagreed with both.**

The failure is cheap to catch and expensive to miss in a specific way: the
builder's instinct on finding prose that contradicts the schema is to record a
**baseline discrepancy** — and that is the wrong repair, because it writes a
disagreement into the record between two documents that never disagreed. The
first move on any conflict is to read the baseline, not to reconcile the prompt
against the code.

**So, both directions:**
- Writing a prompt: an illustrative example either uses values you have
  measured, or says *illustrative* in the sentence itself.
- Reading one: a role, column, count or capability named in prose is a claim to
  verify, not a fact to build on — and when it is wrong, check the baseline
  before concluding the baseline is wrong.

*Distinct from L5 and L7: those are about boundaries in code. L8 is about the
prose upstream of the code, which carries no compiler and no test.*

---

## L9 — Coverage by count is not coverage by path

`metric_evaluate` shipped in 0072 with a dispatch that could never have worked:
it built the calculator's name from `calculation_key` without the `calc_` prefix
every calculator carries. **No metric could have been computed.** Its terminal
block had four probes. All four passed.

All four were refusals — `unavailable`, `not_permitted`, and two guards — and
**guards are placed before the work.** A verification block made of refusal
probes exercises the prefix of a function N times and its body zero times, and
it feels thorough in proportion to N. Four probes were evidence of diligence,
not of coverage.

This project's own culture produced the blind spot. *"Watch at least one new
assertion fail before trusting it"* is a standing rule and a good one — and a
refusal is the easiest failure to provoke, so a block drifts toward refusals
without anyone choosing that. The rule is right. It is not sufficient:

> **Watching an assertion fail proves the assertion works. It does not prove the
> thing it guards works.**

**So: a verification block must reach at least one successful return, and must
say which probe does it.** If no probe can — because success needs OFFICIAL
evidence, a human decision, or a real Auth session — that is a finding to record,
not a gap to leave silent.

## L10 — A bijection between two names does not bind the third

0072 asserted that the catalogue's `calculation_key` set and the `calc_*`
function names were in bijection. **That assertion was true, and stayed green
through the entire defect.** The dispatch built a *third* string from
`calculation_key`, and nothing compared that string to either set.

The map was proved consistent. Nobody proved the code read the map.

**So: when an assertion proves A and B agree, check that the code actually
traverses A→B.** An assertion over a mapping is not an assertion that the
mapping is used, and a name constructed at the call site is a third participant
no bijection can see.

*Distinct from L5: L5 is believing a boundary you never read. L10 is reading the
right boundary and asserting the wrong pair.*

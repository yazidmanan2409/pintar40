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

---

## L11 — A `limit 1` is a sample; a universal claim needs the aggregate

The FABLE-06 sweep review stated that *"all seven `item_type_registry` rows
currently carry `["item_type", "stem", "stimulus", "opsi"]`"*, and concluded the
sanitizer allowlist narrowed nothing. **`NUMERIC` carries three keys.** It
withholds `opsi`, because a numeric-entry question has no options to show.

The query behind the sentence was `select sanitizer_allowlist from
item_type_registry limit 1`, run beside a `count(*) = 7`. A sample of one and a
count of seven, written up as a universal over seven. **The data for the claim
was never fetched** — this was not a misreading.

It then propagated: the same sentence was copied into migration 0074's header by
a second reader who had the contradicting measurement on screen and read past it.
An unverified universal is contagious precisely because it sounds measured.

**So: before writing *all*, *every*, *none*, *identical* or *always* about a set,
the query must have grouped or counted over that set.** `limit 1` answers "what
does one look like", never "what do they all look like". The aggregate costs
nothing:

```sql
-- not this
select sanitizer_allowlist from item_type_registry limit 1;
-- this
select jsonb_array_length(sanitizer_allowlist) n, count(*)
  from item_type_registry group by 1;
```

**And the correction strengthened the finding.** An inert allowlist is a latent
risk; a live one is a boundary already doing work and sitting in an editable
row. The error understated its own argument — which is the usual shape, and the
reason to check rather than to assume the error is conservative.

*The mechanical form of L8's reading half: L8 says verify a claim in prose; L11
says what "verify" has to mean for a claim quantified over a set.*

---

## L9a — A state machine cannot be tested without data

Corollary to L9, and it explains why six migrations of careful probing could not
reach a defect that eighty real sessions found on the first run.

`enforce_question_health` requires a health row to **begin** at
`INSUFFICIENT_EVIDENCE`. Migration 0076's insert path wrote the derived state
directly, which is illegal for any item whose evidence already crosses a
threshold. Every probe passed.

**In a world with no data, the states collapse onto each other.** A probe's item
has no evidence, so its derived state *is* the starting state, and the guard
distinguishing them is unreachable. The probe exercised the transitions it
happened to name; it could not exercise the one the world would have forced.

**So: a verification block over an empty world proves the transitions it writes
down, and nothing about which transitions reality produces.** A state machine
needs a fixture with real data before its entry and exit conditions mean
anything — and the fixture has to be big enough to push items into *different*
states, because a fixture where everything lands in one state has the same blind
spot in miniature.

*L9 says a block of refusals never reaches the body. L9a says a block over an
empty database never reaches the branches data would have forced.*

---

## L12 — A probe that fails before reaching its subject reports the subject's behaviour

Three instances in one phase, each caught by a different mechanism and **none
caught by the suite being green**:

| | the probe | what it reported |
|---|---|---|
| 0072 | four refusal probes, all returning at a guard | that `metric_evaluate` worked, while its dispatch could never have run |
| the draw measurement | a regex using `\b`, which in PostgreSQL ARE is a **backspace** and matches nothing | that four service views contained zero aggregate calls |
| F06-N02 | a malformed argument list producing a syntax error in the generated SQL | that fifteen endpoints had **refused** a call they never received |
| F06-N02 | a population derived from the capability names in the bodies it was testing | that deleting a capability check made the endpoint **leave** the test rather than fail it — L3-F02 |

The shape is identical every time: **the probe failed upstream of its subject,
and its failure was recorded as the subject's answer.** It is invisible because
failing is what a negative probe is supposed to do — the result looks exactly
like success at the thing being tested.

**So: a probe's own error is a FAILURE, never an outcome.** Distinguish, in the
probe, between "the subject refused" and "I could not ask" — different exception
classes, different counters, and the second one is red. F06-N02 does this: a
`syntax_error_or_access_rule_violation` that does not name an authorization
reason increments a `n_broken` counter that fails the test, rather than falling
into the "refused for some other reason" bucket where it had been passing.

*L9 says a block of refusals never reaches the body. L9a says an empty world
never reaches the branches data would force. L12 is the third member: a broken
probe never reaches the subject at all, and says so in the subject's voice.*

---

## L13 — A probe's safety must not depend on the property it is probing

F06-N02 called eighteen privileged endpoints as a dean with real arguments and
no rollback. It was safe — because **INV-19 held**. Every endpoint refused, so
nothing mutated.

Had the invariant been broken, the test would have failed **and destroyed the
evidence needed to investigate the failure**, in the same run, before anyone read
the output. *The one scenario the test exists for is the one in which it does
damage.* A test that is only safe when it passes has no negative result worth
reading.

(The *population* that test walked was a separate defect, found in Layer-3 and
recorded as L15 below: it was derived from the bodies it was testing.)

So rollback there is not tidiness. **It is what makes the failing case
legible.** The general form:

> A probe must be safe in the world where the property is FALSE, because that is
> the only world whose result matters.

Apply it by asking, before writing a probe: *if the thing I am checking is
broken, what does this probe do?* If the answer is "the same thing, but it
lands", the probe needs a subtransaction.

**Related, and found the same day:** the db suite is a single query, so a fixture
escaping its own scope is a **total runner failure**, not a localised one. When
`f06_withdraw` reclassified sessions outside its cohort, the orphaned row blocked
a shared purge and **129 tests failed for one test's trespass.** The rule that
prevents it is short: *a fixture must purge everything it can TOUCH, not
everything it meant to touch* — and the cheap check is that the purge predicate
is at least as wide as the write predicate, rather than that it names the right
node.

---

## L15 — A verification population must not be derived from the implementation it verifies

F06-N02 decided which endpoints must refuse a DEAN by asking each candidate
function's own body whether it named a capability a DEAN lacks. That made the
population a function of the artefact under test: the defect it hunted — a
deleted capability check — was also the edit that removed the endpoint from the
hunt.

A floor was written as the closure, and a floor is not membership. Eighteen
against a population of twenty-one tolerated three silent deletions. Layer-3
deleted one guard from `save_certificate_template`; a DEAN could write, the
derived set fell from 21 to 20, and the full 173-entry contract stayed green —
reproduced both as a runtime replacement and as a source edit replayed from
zero, where the migration's own terminal block did not catch it either because
it exercised only the happy path.

**The rule.** When the thing being deleted is the thing under test, the expected
population must be *declared* somewhere the implementation cannot reach, and the
completeness of that declaration enforced separately. A count is evidence about
size; only membership is evidence about coverage.

---

## L16 — "No authorization predicate" is not an open question

Four mutating, client-exposed, SECURITY DEFINER STAFF RPCs carried no
authorization at all. Two of them were reachable: a capability-less DEAN of one
institution ran `run_mcq_quality` against another institution's course and
deleted that tenant's unacknowledged quality findings.

The observation was available from static reading the whole time. What was
missing was a disposition. **A security observation describing a mutating
endpoint with no authorization predicate is not eligible to cross a
build-complete gate merely as an open question.** It requires either
evidence-backed closure or an explicit gate-blocking disposition, recorded as
such. Anything else is an unowned finding wearing the costume of a known
limitation.

# ADR-0021 — A new function is closed by construction, not by remembering

**Status:** Accepted · **Date:** 2026-09-15 · **Phase:** FABLE-06, between 0072
and 0073 · **Scope:** build mechanics and CI. No schema change, no policy change,
no migration.

**Written because a STOP condition fired**, not because it seemed useful.
`FABLE-06-EXECUTION-PROMPT.md` §9: *"Also stop on the third repeat of one
failure — root-cause it and write an ADR rather than trying again."* The failure
is `EXECUTE` defaulting to `PUBLIC`. It has now been caught three times. Each
catch was late, and a fourth catch is not a plan.

## Problem

PostgreSQL grants `EXECUTE` on every new function to `PUBLIC` by default.
Migration 0001 set `alter default privileges … revoke all on functions from
anon, authenticated`, and that line has been read ever since as *"new functions
are closed by default."* **It is not**, because default privileges do not revoke
from `PUBLIC`, and `has_function_privilege('anon', …)` is satisfied through
`PUBLIC`. This is L2, and L2 already states the uncomfortable half:

> What has actually been holding the line is the explicit
> `revoke all on function … from public, anon, authenticated;` in every
> migration — **a convention, doing the work of a mechanism.**

The count that matters is not three. **Forty-nine migrations carry that explicit
revoke.** Forty-nine times, the line held because a human remembered. The three
recorded failures are the visible part of a mechanism that has never existed:

| when | what | how it was caught |
|---|---|---|
| Task 2, migration 0066 | six new functions became anon-executable; `functions_executable_by_anon` went 0 → 6 | the lint counter, after the fact |
| the occurrence recorded between them | — | *(asserted in review; not independently verified here — see Honesty below)* |
| FABLE-06, migration 0072 | all sixteen metric calculators were client-reachable on creation | the migration's own terminal block, before commit |

Detection has improved every round. **Prevention has never existed.** The 0072
catch is the best case — caught before the commit, by an assertion written into
the same file — and it is still a catch, three minutes after the mistake, by
machinery that only exists because the author chose to write it that day.

## Why this cannot be fixed with a database default

There is no default-off setting. `alter default privileges` is the mechanism
PostgreSQL offers, and **it cannot revoke from `PUBLIC`** — that is the whole of
L2. Revoking `EXECUTE` from `PUBLIC` at the database level for all future
functions is not expressible. So the mechanism cannot live in the database, and
anything that looks like it does is the convention wearing a costume.

## Decision

**A migration that creates a function must revoke `EXECUTE` on that function
from `PUBLIC` in the same migration, and CI refuses the migration if it does
not.**

The check is **syntactic, over the migration text, at authoring time** — per L4,
assert on syntax a compiler would see. It does not look at resulting privileges,
because a privilege check is what already exists and it is what keeps catching
this late. The two are kept as a pair and neither replaces the other:

- **Prevention (new, authoring time):** the syntax check below. A migration that
  creates a function without revoking it cannot merge.
- **Detection (existing, apply time):** `functions_executable_by_anon` in
  `platform_schema_lint`, and each migration's terminal assertion. These stay,
  because a syntax check cannot see a grant made by a later migration or by a
  hand at a console.

### What the check requires

For every `create [or replace] function public.<name>(…)` in a migration file,
the same file must carry a revoke that reaches it — either naming it, or a
dynamic revoke whose `like` pattern matches it. Both forms are legitimate:

- **Named**, for the ordinary case. This is the existing convention and stays
  the default. A revoke is an exposure decision stated once per function.
- **Pattern**, for a family of functions created together under a shared prefix
  (0072's sixteen calculators). The risk in a family is *omitting one name*, and
  a loop cannot omit one. Where a pattern is used, the migration must also
  assert the resulting count, so the loop cannot quietly under-reach.

A deliberate exposure is unaffected: revoke first, then `grant execute … to
authenticated` with a `client_rpc_registry` row in the same statement (ADR-0011,
L1). The check requires the revoke; it never forbids a grant.

## Consequences

- One more CI job, fast, text-only, no database.
- The check will occasionally be wrong about a function that is genuinely fine.
  The repair is to write the revoke, not to weaken the check; a redundant revoke
  costs nothing.
- **This check is itself watched to fail.** A rule that has never rejected
  anything is a rule nobody has tested, and this ADR exists precisely because a
  believed-but-untested guarantee cost three rounds.

## Honesty about the count

Three occurrences is the figure in the review that triggered this ADR. **Two are
directly evidenced here** — 0066 in `ENGINEERING-LESSONS.md` L2, and 0072 in
this session's own migration output. The third is asserted in review and was not
independently confirmed against the repository before writing this. The decision
does not rest on the count: forty-nine migrations depending on a remembered line
is the argument, and it is measurable. Recorded rather than smoothed over,
because an ADR that rounds its own evidence up is the thing this project is
built to refuse.

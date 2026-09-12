# ADR-0003 — Migration verification blocks must be self-sufficient

**Status:** accepted · **Date:** 2026-09-12 · **Phase:** FABLE-02

## Problem

Every migration ends in a verification block that fails the migration on its
own violation (doc 16 §2). FABLE-02's `20260912114854_content_lifecycle` ended
with a *behavioural* probe: it inserted a course and drove it through the state
machine to prove the guard trigger actually refused skips, self-approval and
reversal out of FROZEN.

It passed against the seeded development project and failed every clean-database
replay. `public.institutions` is populated only by `supabase/seed/synthetic.sql`,
and `supabase db reset` applies migrations **before** the seed, so on a clean
database the probe had no data and raised.

The failure split is what identified it: the clean-install jobs went red while
the upgrade-path job — which starts from an already-seeded previous schema —
went green.

## Decision

A migration's verification block asserts **structure and pure functions only**:
catalogue state (RLS, grants, policies, triggers, columns, defaults), rows the
same migration inserted, and functions that depend only on their arguments. It
never reads a table it did not populate.

Assertions that need seeded data belong in the db selftest runner
(`selftest/db/fable0N.sql`), which runs after the seed. The proof removed from
that migration became F02-T01…T04 rather than disappearing.

## Reason

A migration must replay against an empty database. That is not a style
preference: clean-install replay is how CI proves the migration chain can
rebuild the system from nothing, and a migration that needs pre-existing rows
silently breaks it while still passing everywhere that already has data — the
most expensive failure shape, because it looks green where it is exercised.

Every FABLE-01 migration already followed this. FABLE-02 broke it once and this
ADR is the record.

## Consequences

Two verification layers with a clear boundary: migrations prove the shape,
the seeded selftest proves the behaviour. Correcting the migration in place
cost one deliberate red on the forward-only immutability check, which fired
correctly and was not weakened or bypassed.

## Traces to

doc 16 §2 (verification block) · doc 16 §7 (root cause over patching) ·
migration `20260912114854_content_lifecycle` · `selftest/db/fable02.sql`

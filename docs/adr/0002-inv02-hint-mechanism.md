# ADR-0002 — INV-02 is enforced by CHECK *and* trigger, not CHECK alone

**Status:** accepted · **Date:** 2026-09-12 · **Phase:** FABLE-02

## Problem

FABLE-02 §5 says the hint/scaffold columns get "a regex CHECK constraint
blocking it from containing the correct option's text or letter, including
narrowing". A PostgreSQL CHECK constraint cannot contain a subquery or
reference another table. The hint lives on `items`; the correct option's text
lives on `item_options`. A CHECK physically cannot see it.

## Decision

Split the invariant by what each mechanism can actually see.

- **Same-row (CHECK, this migration):** letter reveals and narrowing —
  "jawabannya adalah C", "Kunci: B", "bukan A", "A atau C" — via
  `hint_reveals_answer_shape()`, applied to `petunjuk` and `arah_berpikir`.
- **Cross-table (trigger, next migration):** hint containing the correct
  option's *text*. It must fire on **both** sides — writing the hint and
  editing an option — or the rule is bypassed by writing the hint first and
  the option afterwards.

Scope is deliberate: the constraint covers the coaching columns only, never
`stem` or `stimulus`, where "titik A dan B" is ordinary subject prose. For the
same reason the narrowing pattern matches `atau|or` but not `dan|and`.

## Reason

The invariant is fully satisfied; only the mechanism differs from the prompt's
literal wording. Recorded per doc 13 rather than diverging silently.

## Consequences

Two enforcement points to keep in step. Adding a learner-readable hint column
later means adding it to both, in the same migration (Lesson 10).

## Note on implementation

The first revision used `\b` for word boundaries and matched nothing:
PostgreSQL ARE uses `\y`, and `\b` is a backspace. The migration's own
verification block caught it at apply time. Without those assertions the
constraint would have shipped as decoration. Every pattern now has a positive
and a negative case asserted in the migration.

## Traces to

INV-02 · FABLE-02 §5 · doc 13 (deviation recorded) · doc 16 §2 (verification
block) · migration `20260912112712_content_hierarchy`

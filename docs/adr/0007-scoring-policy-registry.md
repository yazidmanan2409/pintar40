# ADR-0007 — The scoring policy registry, and expand-first binding

**Date:** 2026-09-14
**Phase:** FABLE-04
**Status:** Accepted
**Supersedes:** nothing. **Superseded by:** nothing.
**Amends:** nothing.

---

## 1. What INV-29 actually asks for

Every rule that can change how a result is *interpreted* — passing rules, the
safety-critical set, weighting, partial credit, timeout and late-sync policy —
must live in a versioned record, and every Session and Result must record the
`engine_version` and the `scoring_policy_version` it was decided under. The
consequence is the part that matters: a scoring correction is a **new policy
version plus an audited recomputation writing new linked Result rows**, never
an edit to an existing Result.

FABLE-02 had already put `scoring_policy_version` on sessions and results as a
free-text column. That is the version of this invariant that satisfies a
column-existence check and nothing else: the column accepted `'policy-0'`,
`'e'`, or any other string a caller invented, and the suite's own fixtures were
passing exactly such strings. Nothing resolved them to a rule set, so nothing
could tell you what a stored result actually meant.

## 2. The decision

`public.scoring_policy` is a table with `pintar-scoring/1` as row one, carrying
the rules above as structured columns. `assessment_sessions.scoring_policy_version`
and `assessment_results.scoring_policy_version` become foreign keys to it.

The binding is **expand-first**, in three steps inside one migration (0039):

1. add the reference without constraining it;
2. validate that every existing row resolves — and, where FABLE-01–03 fixtures
   had written invented strings, repoint them at `pintar-scoring/1`, which is
   the policy those rows were in fact scored under;
3. then add the constraint.

Nothing is stranded and no historical result changes meaning. The step that
would have been easy to skip is (2): adding the FK first and discovering the
problem at apply time invites the fix "make the column nullable", which is the
invariant being deleted rather than satisfied.

## 3. Publishing a version, and correcting a score

`publish_scoring_policy()` writes a new version; it never mutates one. A
trigger refuses UPDATE and DELETE on `scoring_policy` for every role including
the owner, in the shape `audit_log` already uses.

`recompute_result()` is the correction path: it re-derives the score from the
raw `response_submitted` evidence under a named policy version and writes a
**new** Result row linked to the original. The original stays, still resolving
to the policy it was decided under. F04-T02 walks the whole sequence — publish
`pintar-scoring/2`, observe that the existing result still resolves to
`pintar-scoring/1`, recompute, observe two linked rows.

## 4. Why the version is a text key and not a serial

`pintar-scoring/1` is a name a human can read in an audit row, a certificate
payload and a support conversation. The certificate's canonical payload carries
`scoring_policy_version` verbatim (INV-05), so this string is a value a verifier
may end up looking at years later; `4` would tell them nothing and would
collide across any future tenant-specific policy line.

## 5. What is deliberately not built

**No per-institution policy override.** The registry is platform-wide. An
institution passing threshold is already an institution-level setting the
engine reads; folding it into the policy version would make every institution's
results resolve to a different version and make "which rules decided this" a
join rather than a value. If a future phase needs tenant-specific rule sets,
that is a new policy line in this table, not a new column on the result.

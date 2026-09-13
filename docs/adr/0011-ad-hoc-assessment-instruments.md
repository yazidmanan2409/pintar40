# ADR-0011 — An ad-hoc instrument is not taught content

**Date:** 2026-09-14
**Phase:** FABLE-04
**Status:** Accepted
**Supersedes:** nothing. **Superseded by:** nothing.
**Amends:** nothing. ADR-0004's `PINTAR-CONTENT-SHA256/1` preimage is unchanged — §3 below is why that matters.

---

## 1. The collision, found by building

FABLE-04 §5 requires a Teacher Quick Assessment: an educator picks a class, a
topic, a question count and a time, and learners are answering about a minute
later, with no administrator and no developer.

`launch_quick_assessment` has to create an `assessment_definitions` row to do
that. And `assessment_definitions` is in two places it cannot simply be added
to:

- it is inside the `PINTAR-CONTENT-SHA256/1` preimage, so inserting a row
  changes the content hash of the course it belongs to; and
- it is in the taught-content immutability set, so
  `enforce_taught_content_immutable` refuses the insert outright once the
  course's release is sealed.

Which means: **before this ADR, a Quick Assessment could never be launched for
any PUBLISHED course.** Every course a real class is actually using. The
feature and the invariant were mutually exclusive, and neither document
mentions the other.

## 2. The decision

A Quick Assessment is **an ad-hoc instrument, not taught content.**
`assessment_definitions.is_ad_hoc` marks it, and:

- `content_canonical_payload` excludes ad-hoc definitions from the hash
  preimage (`and not a.is_ad_hoc`);
- `enforce_taught_content_immutable` permits the creation of an ad-hoc
  definition under a sealed course, and continues to refuse everything else;
- `launch_quick_assessment` sets `is_ad_hoc = true`, and it is the only writer
  that does.

The distinction is real and not a loophole. Taught content is what the release
attests: the lessons, the items, the instruments the institution reviewed and
sealed. A teacher's Tuesday-morning five-question check is not part of what the
institution published; it is a use of the published bank. Freezing it into the
release hash would mean every quick check permanently altered the identity of
the content release it drew from — which is a worse outcome for ADR-0004 than
excluding it.

## 3. Hash invariance is proven behaviourally, not argued

The change to `content_canonical_payload` was made by **splicing the original
function source and altering exactly one line**, not by retyping it. That
precaution was taken because a rewritten version of this same function, written
from memory earlier in the phase, moved two sealed release hashes — and only
the migration's terminal verification block caught it.

0046's verification block re-computes the hash of every PUBLISHED release
before and after, and raises if any of them moves. F04-T01 repeats the check
from the suite.

## 4. What stays refused

Everything else. An ad-hoc definition may be created under a sealed course; it
may not be edited into a taught one, and no lesson, item, option or module
gains any new write path. `is_ad_hoc` has no setter other than
`launch_quick_assessment`, and the taught-content trigger's other branches are
untouched.

## 5. The related defect this surfaced

The quick-assessment title was `'Kuis Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI')`
against a `UNIQUE (institution_id, title, mode, version)` constraint: two
teachers in one school launching inside the same clock minute produced a raw
unique violation for the second one. At the start of a period that is the
normal case, not a corner case. Repaired forward in 0049 by disambiguating the
*title* — `(2)`, `(3)` — and explicitly not by bumping `version`, which would
make two different instruments look like revisions of one. F04-T04 reproduces
the collision inside a single transaction, so the two launches share a minute
by construction rather than by luck.

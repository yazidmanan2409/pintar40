# ADR-0016 — Course revision by copy-forward, with lineage

**Status:** Accepted · **Date:** 2026-09-15 · **Phase:** FABLE-05
**Decision owner:** Yazid (pre-flight decision E1, answered 2026-09-13).

## Context

FABLE-05 §6 requires a SUPERSEDED chain and §7 requires a v1.0 → v1.1 correction
on a live assignment. Neither was buildable. Once a course is sealed,
`content_is_sealed` and `enforce_taught_content_immutable` refuse every edit, and
there was no other way to produce a successor: a correction had nowhere to go.

## Decision

**A correction is a NEW COURSE, deep-copied from the sealed one, carrying a
lineage pointer on every node it creates.**

### 1. Five lineage columns

`courses.supersedes_course_id`, `modules.supersedes_module_id`,
`lessons.supersedes_lesson_id`,
`learning_objectives.supersedes_learning_objective_id`, `items.supersedes_item_id`.
All nullable, all self-referencing, all set **at copy time**, immutable once
written, acyclic (checked by a walk, not only by construction).

Set at copy time because only the copy knows which new row corresponds to which
old one — an hour later nothing does, since titles and ordinals are not
identities and a revision is expected to change them. `item_options` inherit
lineage through their item; option-level lineage, if ever needed, is additive.

### 2. `create_course_revision(p_course)`

SECURITY DEFINER, audited, one row per revision. It:

* requires `CAN_DRAFT` in the **owning** institution — so only PINTAR revises
  canonical content and only a school revises its own;
* refuses unless the source is sealed (an unsealed course is edited directly);
* refuses a second **open** revision — two divergent successors is a state with
  no correct resolution;
* deep-copies course → modules → lessons → objectives → items → options into a
  new course in the same institution, remapping objective links and parallel
  groups to the copies rather than leaving them pointing at the original;
* copies non-ad-hoc assessment definitions as the next **version** of the same
  named instrument, because `(institution_id, title, mode, version)` is unique
  and a copy of a named instrument is a new version of it;
* copies **no** `is_ad_hoc` definition — an ad-hoc instrument is not taught
  content and never enters a release (ADR-0011);
* copies **no empirical value**.

### 3. It works *around* immutability, never through it

Nothing relaxes `content_is_sealed` or `enforce_taught_content_immutable`; both
are untouched, still attached to seven tables, and still refuse every write to
the predecessor. The revision only ever INSERTs, into a new course that is not
sealed, which is why the seal needs no exception. The predecessor's stored
content hash is proven byte-identical before and after, and proven still to
recompute from the unmodified `course_content_sha256`.

No existing assignment, session, result, certificate or evidence row is
re-pointed at the new course or its items.

### 4. Empirical values are not copied — a required assertion

`empirical_difficulty`, `empirical_discrimination` and
`empirical_evidence_count` are NULL on every copy. A revised item has no
evidence of its own; carrying another item's numbers forward would state a
measurement that was never taken on it — the fabricated-empirical-value failure
doc 02 forbids by name. Asserted in the migration and again in F05-T12, and the
CI red case plants the opposite and requires F05-T12 to catch it.

### 5. Release correction across the lineage

Because a revision is a NEW course, `move_learning_assignment_release`'s
`r.course_id = a.course_id` check would have refused every correction on its
first use. It is widened to "a release of this course, **or of a course in this
course's lineage chain**" — `course_lineage_chain()` reads ancestors and
descendants, so a correction can also go back to the predecessor if a revision is
abandoned. The assignment's own `course_id` moves with the release, because
leaving it behind would make the row name one course and teach another.

`NOT_STARTED_ONLY`, the audit row per move, and the refusal of any automatic
move are unchanged. A release from OUTSIDE the lineage is still refused even when
the school holds a perfectly good distribution grant for it (F05-T14), which is
what separates "widened to the lineage" from "unwidened".

## One reading, flagged for the Layer-3 auditor

The brief says the revision lands "at DRAFT". The content lifecycle has no DRAFT
state; its entry state is INGESTED, and `enforce_content_status` refuses any
other status at insert (INV-22). **I read "DRAFT" as the brief's calm-surface
word for the entry state**, not as a demand for a tenth status, and the copy
lands at INGESTED. A new status would have been a state-machine change nobody
asked for. This is a reading of the baseline, not a fact in it.

Relatedly, "an open DRAFT revision already exists" is answered by
`content_is_sealed(successor)`, not by the successor course's status: a course
row never advances past APPROVED/FROZEN, because publication is a property of a
RELEASE. Asking the course's status would have made the first revision of any
course the last one it could ever have.

## The FABLE-06 constraint this creates

Lineage makes it possible to aggregate evidence across an item and its
successors. **FABLE-06 may do so only where the metric's own semantics permit
it** — a revised item is a different question, and a difficulty statistic
pooled across a stem that changed is a fabricated measurement in a new costume.
FABLE-06 inherits this as a requirement.

## Consequences

* Five new nullable columns, two partial indexes, one generic immutability
  trigger attached five times.
* `create_course_revision` is a `STAFF` client RPC.
* Historical evidence stays bound to the original release and items, permanently.
* The successor's release chains through the existing
  `plp_releases.supersedes_release_id`; the predecessor moves to SUPERSEDED,
  chain intact, never deleted.

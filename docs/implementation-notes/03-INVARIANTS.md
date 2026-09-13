# Implementation notes — doc 03, PINTAR Invariants

*These notes were written by this build and live **outside** the frozen
document they annotate.*

`docs/rebuild/` holds the architecture baseline, byte-identical to the
authoritative copies and pinned by `BASELINE-MANIFEST.json` and the
`baseline-parity` CI job. A frozen document cannot carry build commentary and
also be provably unmodified, so the commentary moved here. Earlier phases
appended these notes **inside** `docs/rebuild/03-PINTAR-INVARIANTS.md` — that is what made the
repository's copy diverge from the authority in a way nobody could distinguish
from staleness.

They record how an invariant or contract is *met* in the built system. They never
restate, narrow or widen the baseline; where a phase read the baseline rather
than found a fact in it, the note says so.

---


These record how an invariant is *met* in the built system. They never restate,
narrow or widen the invariant itself; where a phase read the baseline rather
than found a fact in it, the note says so.

### INV-04 — a correction is a new course and a chained release, never an edit
*(FABLE-05, ADR-0016; contract detail in doc 08.)*

INV-04 refuses every write to a frozen release's taught content, which leaves
the question of how a correction is produced at all. It is produced by
**copy-forward**: `create_course_revision` deep-copies the sealed course into a
new course carrying a lineage pointer on every node
(`supersedes_course_id`, `supersedes_module_id`, `supersedes_lesson_id`,
`supersedes_learning_objective_id`, `supersedes_item_id`), and that new course
walks the ordinary lifecycle to its own release, chained to the predecessor via
`plp_releases.supersedes_release_id`.

The revision works **around** the seal, never through it: it only ever INSERTs,
into a course that is not sealed. Three assertions carry it —

* `content_is_sealed` and `enforce_taught_content_immutable` are unchanged, and
  the trigger is still attached to seven tables;
* the predecessor's stored `content_sha256` is byte-identical before and after,
  and still recomputes from the unmodified `course_content_sha256`;
* no existing assignment, session, result, certificate or evidence row is
  re-pointed.

The copy carries **no empirical value**, because a revised item has no evidence
of its own (F05-T12, and a CI red case that plants the opposite).

Correcting a live assignment onto the successor is
`move_learning_assignment_release`, whose course check reads the lineage chain
rather than requiring an exact course match — a revision is a new course, so an
exact match would refuse every correction.

*A reading, flagged:* FABLE-05's brief says the revision lands "at DRAFT". The
content lifecycle has no DRAFT state and INV-22 refuses any entry state but
INGESTED, so "DRAFT" was read as the calm-surface word for the entry state
rather than a demand for a tenth status.

### INV-01 — "another tenant" does not mean authorized canonical content
*(FABLE-05, ADR-0015.)*

INV-01 protects a learner from ever being shown another TENANT'S item by
accident. When it was written, the only way an item could belong to a different
tenant was by mistake. Canonical content distribution adds a deliberate case: a
`PLATFORM_CANONICAL` tenant's release that a school has been explicitly, audibly
authorized to teach.

`enforce_presented_item_immutable` therefore admits an item whose owner is a
canonical tenant **and** whose release is actively distributed to the session's
institution — conjunctive, so School B's item is still refused in School C's
session with or without a distribution row (F05-T08). The refusal INV-01 exists
for is unchanged; what changed is that the guard can now tell an authorization
from an accident.

### INV-13 / INV-25 — an assignment and a progress row belong to the school
*(FABLE-05, ADR-0015 §5.)*

`enforce_assignment_status` stamped an assignment's `institution_id` from the
assigned artefact, and `enforce_lesson_progress` stamped a progress row's from
the lesson. For institution-owned content those are the same value; for
canonical content they would have handed a school's own rows to the content's
author. Both now read the **learner's** side — the node's institution, the
enrolment's institution — and CHECK the content against the distribution
predicate. Proven equivalent over every pre-existing row.

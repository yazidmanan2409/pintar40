# Implementation notes — doc 08, Content Versioning Contract

*These notes were written by this build and live **outside** the frozen
document they annotate.*

`docs/rebuild/` holds the architecture baseline, byte-identical to the
authoritative copies and pinned by `BASELINE-MANIFEST.json` and the
`baseline-parity` CI job. A frozen document cannot carry build commentary and
also be provably unmodified, so the commentary moved here. Earlier phases
appended these notes **inside** `docs/rebuild/08-PINTAR-CONTENT-VERSIONING-CONTRACT.md` — that is what made the
repository's copy diverge from the authority in a way nobody could distinguish
from staleness.

They record how an invariant or contract is *met* in the built system. They never
restate, narrow or widen the baseline; where a phase read the baseline rather
than found a fact in it, the note says so.

---

### Implementation note (FABLE-05, ADR-0016) — a correction is a new COURSE

The contract above says "a new release". What FABLE-05 had to decide is
what the release is a release *of*, because a frozen course's rows cannot
be edited to produce it: `content_is_sealed` and
`enforce_taught_content_immutable` refuse every write, which is INV-04
doing its job.

So a correction is a **new course, deep-copied from the sealed one**
(`create_course_revision`), carrying a lineage pointer on every node it
creates — `supersedes_course_id`, `supersedes_module_id`,
`supersedes_lesson_id`, `supersedes_learning_objective_id`,
`supersedes_item_id`. The copy lands at the content lifecycle's entry
state and then walks the ordinary path above. Its release chains to the
predecessor through the existing `plp_releases.supersedes_release_id`.

Three things this does **not** do, and each is asserted:

- it does not relax `content_is_sealed` or the immutability trigger — the
  revision works *around* them by inserting into a new, unsealed course,
  never *through* them;
- it does not re-point any existing assignment, session, result,
  certificate or evidence row;
- it does not change the content hash basis. The revision's release hashes
  its own content exactly as any first release does, and the predecessor's
  stored hash is byte-identical before and after the whole operation.

**A correction is therefore never an edit.** The predecessor course, its
rows, and all evidence bound to them are preserved permanently and stay
immutable. "What did this learner see" is still answered by looking up
that specific release, and the answer is still frozen.

The copy carries **no empirical value**: `empirical_difficulty`,
`empirical_discrimination` and `empirical_evidence_count` are NULL on
every revised item, because a revised item has no evidence of its own and
inheriting another item's numbers would state a measurement never taken.

Correcting a live assignment onto the successor uses
`move_learning_assignment_release`, whose course check reads the lineage
chain rather than requiring an exact course match — without that, every
correction would be refused on its first use, since a revision is a new
course.


  *Implementation note (FABLE-05, ADR-0015).* What V1 built is narrower than
  "cross-institution sharing": a `PLATFORM_CANONICAL` tenant owns a release
  and grants named institutions permission to teach it
  (`release_distributions`). Institution-to-institution sharing (OD-4) stays
  LATER and is not expressible — the grant refuses any release whose owner is
  not canonical. The rule above holds unchanged either way: a distributed
  release is one frozen, hashed object, and the hash basis does not know or
  care how many institutions were authorized to teach from it.

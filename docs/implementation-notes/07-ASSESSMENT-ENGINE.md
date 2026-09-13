# Implementation notes — doc 07, Assessment Engine Contract

*These notes were written by this build and live **outside** the frozen
document they annotate.*

`docs/rebuild/` holds the architecture baseline, byte-identical to the
authoritative copies and pinned by `BASELINE-MANIFEST.json` and the
`baseline-parity` CI job. A frozen document cannot carry build commentary and
also be provably unmodified, so the commentary moved here. Earlier phases
appended these notes **inside** `docs/rebuild/07-PINTAR-ASSESSMENT-ENGINE-CONTRACT.md` — that is what made the
repository's copy diverge from the authority in a way nobody could distinguish
from staleness.

They record how an invariant or contract is *met* in the built system. They never
restate, narrow or widen the baseline; where a phase read the baseline rather
than found a fact in it, the note says so.

---

## Implementation note — Quick Assessment eligibility follows authorization

*(Task 1 in the FABLE-05 → FABLE-06 window, ADR-0018. This records how the
contract above is **met** for one instrument; it neither narrows nor widens
anything stated above, and the general composition question it names is left
open, not answered.)*

A **Quick Assessment** is the one-action instrument an educator launches over a
chapter they have just taught. It is an **ad-hoc** definition
(`assessment_definitions.is_ad_hoc = true`): outside the taught-content release
by ADR-0011, outside the frozen `PINTAR-CONTENT-SHA256/1` payload, and unable
ever to enter one.

**For an ad-hoc definition, and only for an ad-hoc definition, item eligibility
follows *authorization* rather than *ownership*.** An item is eligible when it
satisfies the bank-tier and scope rules above **and** either belongs to the
definition's own institution — unchanged — or belongs to a course carrying a
release owned by a `PLATFORM_CANONICAL` tenant that is **actively distributed**
to that institution. The authorization is the existing
`release_is_distributed_to` predicate that every FABLE-05 relaxation reads; it
is called, never restated, so the conjunct that makes one school's grant
unusable by another has exactly one definition in the system.

Nothing else changes:

- **No second eligibility path.** `eligible_items_for_definition` remains the
  only place eligibility is computed (INV-26). For every non-ad-hoc definition
  it returns an identical set, asserted as set equality in both directions.
- **The instrument is the school's, the content is not.** The definition, the
  assignment and the audit row belong to the school that launched it. The
  session records the canonical release and canonical item identity alongside
  the school's institution, enrolment, class and derived `evidence_class` — the
  separation FABLE-05 established, reached through the ordinary cap model.
- **Withdrawal blocks new use and interrupts nothing.** A withdrawn distribution
  refuses the next launch and the next session; a session already legitimately
  started runs to its deadline (INV-27, not INV-17); completed evidence,
  results and certificates are permanently untouched; the assignment row is
  retained and Studio explains it in plain language.
- **Canonical content stays canonical.** Every write from the consuming
  institution is refused, item identity is never copied or re-parented, and no
  content hash moves.

**One content owner per ad-hoc paper.** At creation a Quick Assessment resolves
to exactly one source — a module of the school's own course, **or** a module of
one authorized canonical release, never both. This is enforced, at creation and
again at draw, not merely unimplemented.

**The general mixed-owner case remains deferred.** Canonical and
institution-owned items composed freely in one paper is an open question that
ADR-0018 does not decide and must not be cited as precedent for; the
aggregation grain it depends on is FABLE-06's to settle. Institution-to-
institution content sharing (OD-4) remains LATER.

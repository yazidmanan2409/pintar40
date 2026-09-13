# ADR-0019 — The architecture baseline lives in the repository, and is proven by content

**Status:** Accepted · **Date:** 2026-09-13 · **Phase:** the FABLE-05 → FABLE-06
window, alongside Task 1 · **Scope:** governance and CI integrity. No code, no
migration, no Task 1 policy.

## What this ADR is, and is not

**It is not an architecture amendment, and it does not ratify one.** The
`docs/rebuild/` documents brought into the repository today *are* the approved
**2026-09-12 baseline amendment**. That amendment was decided elsewhere and is
already authoritative; nothing here reopens, re-approves or re-dates it. What
failed was its **distribution** into the canonical repository, and the copy step
that repaired it is plumbing, not a decision.

The decision this ADR records is a new one and is about governance: **the
repository becomes the single source of truth for the baseline, and that status
is enforced by a manifest and a parity job rather than by convention.** That is
what needed deciding today, and it is what §Decision below decides.

## Problem

The repository's `docs/rebuild/` copies of the frozen architecture baseline had
drifted from the authoritative copies, and **nothing could see it**. A missing
document fails loudly; a truncated one is visibly short. A *stale* document
announces nothing: it reads as complete, it is quoted in good faith, and the
disagreement it produces looks like one party inventing text.

That is exactly what happened. Over two review rounds, two parties quoted the
same doc 08 and disagreed, and **two false statements very nearly entered the
permanent record** — first that a correctly-cited frozen clause could not be
found, then that a real section heading was a mis-attribution. No code defect was
involved at any point. The entire cost was documentary.

## What was measured

The authoritative set was exported and supplied with a manifest of sha256
digests. Digesting the repository's working tree **before** overwriting anything
— which is the only moment the evidence exists — gave:

| | |
|---|---|
| Byte-identical | **1** (doc 16) |
| Stale | **16** |
| Missing from the repository | **8** (the freeze record and all seven FABLE prompts) |
| Present but ungoverned | 0 |
| Payload self-consistency | 25/25 archive files matched their own manifest entries |

Two results are worth naming because they settle a design question:

- **Doc 03 carried the correct `Baseline amendment (2026-09-12)` marker and was
  still stale.** A right marker on wrong content.
- **The readiness report, doc 16 and the freeze record carry no marker at all**,
  so three of eighteen documents are structurally invisible to marker-counting —
  and one of them is the sync manifest itself.

## Decision

### 1. `docs/rebuild/` is frozen content, pinned by digest

`docs/rebuild/BASELINE-MANIFEST.json` lists every baseline document with its
`path`, `sha256`, `bytes` and `baseline` identity. `scripts/baseline-parity.mjs`
enforces five assertions; CI runs all five in the `baseline-parity` job, and the
selftest runs the first three as `DOC-P01`.

1. every listed path exists and its sha256 matches;
2. every file under `docs/rebuild/` appears in the manifest — **the one usually
   omitted, and the one that makes a deletion visible**;
3. each document's own marker equals its manifest `baseline` — two independent
   records that must agree, with `null` declared explicitly so a document that
   legitimately carries no marker is a recorded exception rather than a silent
   one;
4. a changed digest requires a changed `baseline` — editing a frozen document
   silently becomes impossible;
5. a changed `baseline` requires an ADR in the same change (doc 13).

Together: a baseline document can change only as a **recognisable amendment** —
new bytes, new baseline identity, a matching marker, and an ADR in the same
commit. That is the smallest rule that stops the manifest being a self-updating
checksum list.

### 2. Marker-counting is retired, on evidence

`DOC-S01` counted amendment markers. It was the right instrument for the
information available when it was written — a tripwire that fires when an
unknown amended set lands is correct when you cannot see what that set is — and
the measurement above retired it: doc 03 defeats it directly. `DOC-P01` replaces
it and measures content. The expected marker count was **not** simply raised
from 1 to 15; that would have re-encoded the weaker property.

### 3. Implementation notes move out of the frozen documents

Earlier phases appended implementation notes **inside** docs 03, 07 and 08. That
is what made three repository copies diverge from the authority in a way nobody
could distinguish from staleness — this build was itself a source of the drift it
later tripped over.

Those notes now live in `docs/implementation-notes/`, one file per annotated
document, carrying their own explanation of why they sit outside. A frozen
document cannot both carry build commentary and be provably unmodified.

### 4. The repository is the single source of truth

Assertions 1–5 guard **the repository against itself**. Nothing in CI can see an
authoring copy held anywhere else, so no amount of parity prevents two
authoritative copies drifting apart — which is the defect actually hit. Parity
detects the *next* divergence only if there is one place it is allowed to
originate.

**Decided, by the product owner, on this change:** `docs/rebuild/` in this
repository is the baseline of record. Amendments are made here and flow outward;
a copy held anywhere else is a working copy that follows this one, and a
disagreement between them is resolved in the repository's favour. This is the
only arrangement in which the parity job guards the real thing rather than a
snapshot of it.

A consequence worth stating plainly: an amendment now lands as a normal change
to this repository — new bytes, a new `baseline` identity, a matching marker, and
an ADR — rather than as an import to be reconciled afterwards. Today's sync was
the last import.

## Consequences

- Any amendment is now a deliberate, four-part change, and an accidental one
  fails CI.
- A disagreement about baseline text between two parties is now resolvable by
  digest instead of by argument.
- The seven FABLE prompt files and the freeze record are in the repository for
  the first time, and governed.
- `DOC-S01` is retired; `DOC-P01` and `baseline-parity` replace it.
- The 2026-09-12 amendment is unchanged by any of this. It arrived intact and is
  now pinned; this ADR governs how the **next** one arrives.

## What this ADR does not claim

The sync is a **mechanical copy** of a supplied export. This build did not author
or verify the content of the amended documents; it verified that the archive was
internally consistent with its own manifest, recorded what the repository held
before overwriting, and pinned the result. That the supplied copies are the
approved 2026-09-12 amendment is a fact this build was given, not one it
established — what it established is that the repository now holds them
byte-for-byte, and that nothing can change them quietly again.

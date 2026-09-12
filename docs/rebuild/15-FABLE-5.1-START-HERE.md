# 15 — FABLE 5.1, Start Here

Read this first, before FABLE-00.

## What PINTAR is

PINTAR is an Indonesian-language, evidence-based learning platform spanning
SD → SMP → SMA → University → professional education. Its purpose is not
to deliver content. Its purpose is to measure understanding, guide
learning, generate verifiable evidence of competency, and continuously
improve the content itself from that evidence. Every screen answers one
question: what does this person need to do next?

## What PINTAR is not

Not a generic LMS. Not a quiz generator. Not a file-upload/CMS tool
wearing an education skin. Not a platform locked to one AI vendor for
content generation — any producer (AI or human) that outputs the PLP
format is interchangeable.

## Why this is a ground-zero rebuild

The prior implementation (referred to below as "PINTAR 3.0") is not being
migrated, ported, or incrementally fixed. New codebase, new Supabase
project, new migrations, new architecture. This is deliberate: several of
PINTAR 3.0's problems were structural consequences of how it grew (see
`01-REBUILD-LESSONS-LEARNED.md`), not bugs a patch can fix.

## What knowledge survives from the old project

Everything in `docs/rebuild/01`–`13`, plus `FABLE-00`–`06`: product
philosophy, the Learning Safety Doctrine, the domain model, every
invariant, every lifecycle, the authorization matrix, the evidence
contract, the assessment-engine contract, the content-versioning contract,
V1 scope boundaries, and the specific lessons paid for in the old build
(storage security, RLS defaults, certificate key versioning, migration
hygiene, validator scope, dummy-data fallbacks, and more).

## What implementation does NOT survive

Old code, old migrations, old table names, old file layout, old patch-
folder history, and — critically — old *architecture*, even where it
happens to still be in the repo you might encounter during research. If
you read an old file and it contradicts one of the docs/rebuild/ documents,
the document wins; the old file is historical record, not spec.

## Architectural principles (non-negotiable — see FABLE-00 for the full list)

RLS closed by default. Storage private + signed-URL only, server-gated
uploads. Hint/scaffold leak-proofing enforced at the database level.
Every distractor has a rationale. Certificate signing keys are versioned
from migration one. One canonical public verification route. Tenant
isolation from day one. Every `SECURITY DEFINER` function pins
`search_path`. An audit trail exists from day one. Middleware covers every
authenticated route, including in-progress assessment sessions. The
safety-language validator scans every learner-readable field. `npm ci`
works from commit one, with real CI. One linear migration/repo history —
no parallel series, no patch-folder sprawl (`01-REBUILD-LESSONS-LEARNED.md`,
Lessons 4 and 12).

## Security principles

Answer keys never reach a learner client, under any role, at any lifecycle
stage. `learner_id` is always server-derived, never client-trusted. Scoring
and the safety gate are computed server-side and independently
re-verified at certificate-issuance. Authorization is checked at the
database layer and the application layer through one shared primitive —
UI visibility is never treated as authorization. See
`05-PINTAR-AUTHORIZATION-MATRIX.md` and `03-PINTAR-INVARIANTS.md` for the
complete, testable list.

## Learning/evidence principles

Every learner response — especially a wrong one — is evidence of a mental
model, never a failure to shame. Assistance must never reveal the correct
option and must never influence scoring (physically separated telemetry).
No dead ends: a wrong answer always offers a next step. See
`06-PINTAR-EVIDENCE-AND-TELEMETRY-CONTRACT.md` for exactly what gets
recorded, when, and how it may (and may never) be used.

## Content-versioning principles

APPROVED ≠ FROZEN. FROZEN means the taught-content hash is computed and
the row is immutable, permanently. A correction is always a new release,
never an edit to a frozen row. A certificate's binding to the release it
was assessed against is permanent and independent of the signing key's
version. See `08-PINTAR-CONTENT-VERSIONING-CONTRACT.md`.

## Rules against over-engineering

Build exactly `09-PINTAR-V1-SCOPE-BOUNDARIES.md` category A. Category B
items get architecture that doesn't block them later, and nothing more.
Category C and D items are not built, period, regardless of how
interesting they look in old design conversations. If a phase prompt seems
to imply building a B/C/D item, stop and flag it rather than proceeding.

## Rules against scope creep

If you find yourself building something not named in a FABLE phase prompt
because "it seemed necessary while I was in there," stop. Either the phase
prompt has a real gap (record it, flag it, keep going only if it's truly
blocking) or it's scope creep (don't build it). When genuinely unsure,
that uncertainty itself is the signal to ask the product owner rather than
decide silently.

## Required reading order

1. This document.
2. `FABLE-00-MASTER-OVERVIEW-PROMPT.md`.
3. `docs/rebuild/02` through `13`, in order, before writing any schema —
   especially `03-PINTAR-INVARIANTS.md` and `05-PINTAR-AUTHORIZATION-MATRIX.md`,
   which every phase's tests trace back to.
4. `docs/rebuild/14-FABLE-PROMPT-CROSSCHECK.md` — the amendments listed
   there should already be reflected in FABLE-01 through 06 by the time
   you start; if they aren't, apply them before Phase 1, don't work around
   the gap ad hoc.
5. `docs/rebuild/11-PINTAR-OPEN-DECISIONS.md` — note which items are
   "MUST ASK PRODUCT OWNER" and don't proceed past the phase that needs
   that answer until it's resolved.
6. Then FABLE-01 through FABLE-06, one at a time, in order.

## Phase execution rules

Each FABLE phase is self-contained but depends on the schema/conventions
the previous phase established. Do not start a phase until the previous
phase's acceptance checklist is a fully green automated `selftest` run —
not a manual walkthrough (see FABLE-00's self-test doctrine). If a later
phase seems to require reopening an earlier phase's schema, stop and flag
it rather than quietly patching around it — that's exactly the kind of
undocumented architectural drift `12-PINTAR-FAILURE-MODES.md` warns about.

## Acceptance-gate rules

A phase is "done" when `npm run selftest` exits 0 for every test
accumulated so far (not just the current phase's new tests) — regressions
are caught automatically, not rediscovered by a human clicking through the
app. Where something genuinely can't be automated, say so explicitly and
keep it as the one deliberate manual step, rather than letting "hard to
automate" quietly become "untested."

## Decision-log rules

Any decision matching the triggers in
`13-PINTAR-ARCHITECTURAL-DECISION-LOG-TEMPLATE.md` gets an ADR at the time
it's made, in `docs/adr/`. This starts in Phase 1, not "once things settle
down."

## When to stop and ask the product owner

Any item in `11-PINTAR-OPEN-DECISIONS.md` marked "MUST ASK PRODUCT OWNER."
Any point where you'd otherwise invent a source citation, a compliance
policy (retention/PDP), or an accreditation framework detail. Any point
where a FABLE phase prompt and a docs/rebuild/ document actually conflict
and you can't tell which should win. Silence is not consent — if in doubt,
ask rather than assume.

---

Requirements survive. Evidence survives. Product lessons survive. Proven
domain rules survive.

Implementation does not.

Build the PINTAR we now understand, not the PINTAR that history happened
to produce.

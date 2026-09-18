# ADR-0021 — Mini-PINTAR is a public, zero-write demonstration

**Date:** 2026-09-18
**Phase:** decided in the FABLE-06 window, alongside the corporate website
**Status:** Accepted

> Recorded on the product owner's rulings R1, R2 and R3 of 2026-09-18. This
> ADR carries three decisions that travel together: OD-11 is resolved, the
> execution model is fixed, and INV-26's scope is interpreted. Separating
> them would leave each one unreadable without the other two.

## Problem

The PINTAR corporate website is to contain **Mini-PINTAR**: a two-to-three
minute public experience in which an anonymous visitor walks one miniature
learning journey — Pemetaan Awal → Peta Bacaan → Pelajaran → Uji Penguasaan
→ Hasil — and so understands PINTAR by doing rather than by reading.

Three questions had to be answered before any of it could be designed.

1. **Is it in scope at all?** Doc 11 OD-11 ("Is the Mini-PINTAR public trial
   part of the first release?") was OPEN, with the standing default *"no
   public trial UI"* until the product owner moved it. Doc 09 places
   Mini-PINTAR *isolation* in FOUNDATION NOW and states that moving an item
   between categories requires an explicit, recorded product-owner decision
   and an ADR.
2. **Can an anonymous visitor hold a session?** Doc 05's authorization matrix
   grants a PUBLIC principal a *"Mini-PINTAR public trial session
   (`PUBLIC_DEMO` mode, `PUBLIC_DEMO` evidence class) — rate-limited; no
   persistence beyond the demo's own scope; never eligible for anything
   official"*, and the readiness report's scenario G-13 (100k anonymous
   sessions) is PASS WITH CONDITION on that basis. But
   `assessment_sessions.person_id`, `institution_id`, `enrollment_id` and
   `academic_period_id` are NOT NULL with foreign keys; identity is derived
   only from `current_person_id()` and no engine function accepts a person
   id; `anon` holds SELECT and no write grant anywhere;
   `assert_public_surface()` fails the build on any undeclared anon-reachable
   object; and no rate-limit primitive exists in the repository.
3. **Would a local simulation be a second assessment engine?** INV-26 states
   that no second implementation of assembly, sanitization, scoring or the
   safety gate exists.

## Considered options

- **A — Zero-write isolated demonstration.** The experience executes
  deterministic adaptation locally against its own public content bundle.
  No session, no response, no evidence, no Person, no write path.
- **B — Engine-backed `PUBLIC_DEMO` sessions.** The canonical shape doc 05
  anticipates: a real session under `PUBLIC_DEMO` mode and evidence class,
  excluded from official consumers by INV-20.
- **C — No public demonstration.** Explain PINTAR in prose and product
  reconstructions only; leave OD-11 at its standing default.

## Decision

**A, for V1.** OD-11 is **RESOLVED: BUILD NOW** — PINTAR 4.0 includes a
public Mini-PINTAR as part of the corporate website. It is public,
anonymous, and carries no account, login, institutional membership, official
learner identity, official evidence, learner record, institutional record,
certificate, or certification consequence.

Mini-PINTAR **writes nothing**: no `assessment_sessions` row, no response
row, no evidence row, no Person, no synthetic visitor identity, no anonymous
write path, no new `anon` grant, and no widening of the existing public
assessment surface.

**INV-26 is interpreted, not weakened.** INV-26 governs *authoritative,
evidence-producing* assessment execution. A zero-write public simulation
that cannot produce official evidence, official results, certification
consequences, learner records or institutional records is **not** a second
authoritative assessment engine, and Path A is therefore permitted. The
invariant's text is unchanged and its force over every evidence-producing
path is unchanged.

The permission is conditional on one obligation: **Mini-PINTAR must never
present its local calculation as an authoritative PINTAR mastery
determination.** Every Hasil outcome, including the best one, states the
limit of its own evidence:

> *Ini cukup untuk satu bacaan kecil. Belum cukup untuk menilai penguasaan
> seseorang.*
> *Enough for one small reading. Not enough to judge anyone's mastery.*

**Option B is deferred, not rejected** — see *Future constraints*.

## Reason

**Why A over B.** B is the canonical shape and it remains the right
destination, but reaching it today would require manufacturing a Person,
an Institution, an Enrollment and an Academic Period for a visitor who
deliberately gave no identity. That is a privacy decision wearing an
engineering costume, and it is not one to take in order to ship a
demonstration. A also gives the product expectation — *Mini-PINTAR must
never contaminate OFFICIAL evidence* — in its strongest available form:
not a filter that a future query could forget, but the absence of a
mechanism. There is no write path, so contamination is impossible rather
than prevented.

A also costs the product's security posture nothing: zero migrations, zero
new `anon` grants, `assert_public_surface()` untouched, `src/proxy.ts`'s
public path list untouched.

**Why not C.** PINTAR's differentiator is a refusal — it declines to
conclude more than the evidence supports. A refusal cannot be asserted
credibly in prose, because every platform asserts its own integrity. It is
only credible when a visitor watches it happen and can see that it cost the
system something: a demonstration that tells a visitor *belum cukup bukti*
when it had every commercial incentive to flatter them is the one argument
a competitor's demo cannot copy.

**Why the interpretation in R3 is sound.** INV-26's stated purpose is that
two code paths must never compute "did this session pass" differently. The
harm it prevents is divergent *authority*. A path that produces no result
anyone may rely on cannot diverge from the engine in the way INV-26 names,
because it has no authority to diverge from. Doc 12's *oversized
components / duplicated domain logic* failure mode points the same way: its
early-warning signal is "two different code paths compute 'did this session
pass' with subtly different rules", and Mini-PINTAR computes no such thing.

## Calm-surface check

Calmer, and more rigorous underneath. The visitor sees a two-minute journey
with no account, no gate and no jargon; underneath, the honesty that makes
the journey worth having is enforced structurally rather than by copy —
the demonstration has no way to record them, so "nothing is kept about you"
is a property rather than a promise. The one piece of rigour deliberately
allowed to reach the surface is the evidence limit, because concealing it
would misrepresent the product on the single point the product is built on.

## Consequences

**Easier.** The demonstration ships without touching the assessment engine,
the evidence model, the public surface contract or the authorization matrix.
It can be built, reviewed and changed at website cadence rather than at
migration cadence.

**Harder, and the honest trade-off.** The adaptation logic in the bundle is
a faithful *restatement* of the cycle's rules, not a call into the engine,
so the two can drift: a later change to how the product orders a Peta Bacaan
would not propagate to the demonstration. This is accepted because the
demonstration's job is to convey the *shape* of the cycle, not to reproduce
its arithmetic, and because the alternative costs a Person per visitor. It
is mitigated by *Future constraints* below.

**Foreclosed for V1.** No demonstration analytics beyond the four counters
in R8; no persistence of any kind, including browser storage; no delta
between Pemetaan Awal and Uji Penguasaan (they ask about different things,
and the demonstration says so rather than computing a comparison nobody
made).

## Traces to

- **Requirement:** the Dr. Gladys learning cycle (doc 15 *The learner
  cycle*); the PINTAR Doctrine's calm-surface principle; product owner
  rulings R1–R3, 2026-09-18.
- **Architecture:** doc 05 (PUBLIC principal); doc 06 (evidence classes and
  structural eligibility); doc 09 (FOUNDATION NOW → BUILD NOW move); doc 11
  (**OD-11 resolved**); INV-01, INV-20, INV-26, INV-33, INV-37.
- **Implementation:** `website/mini-pintar/` (design), and the corporate
  deployment at `pintarselalu.com` per R5. **No change to `src/`,
  `supabase/migrations/` or `selftest/`.**
- **Test:** none added to the selftest contract — see *Tests proving the
  decision*, which explains why that is the correct outcome and what is
  asserted instead.
- **Audit evidence:** an auditor confirms this decision by finding no
  Mini-PINTAR write path: no new migration, no new `anon` grant
  (`functions_executable_by_anon` unchanged), `assert_public_surface()`
  reporting the same declared surfaces as before, and no request from the
  demonstration carrying an answer.
- **Patent/innovation register entry:** none. The product owner has
  registered none for this decision and none is invented here.

## Affected components

`website/` (new, design only). No application module changes. No change to
`src/proxy.ts`'s `PUBLIC_PATHS`, because the demonstration is served by a
separate deployment (R5).

## Affected database objects

**None.** No table, view, function, policy, grant or enum is created,
altered or dropped by this decision. `assessment_mode` already carries
`PUBLIC_DEMO` and `mode_policy` already carries its row with the assertion
that it can never certify; both remain in place, unused by V1, for Path B.

## Security implications

- **Answer keys.** The demonstration scores locally, so its bundle contains
  its own answer key and any visitor can read it. This does **not** breach
  INV-01, on one condition which this ADR makes binding: **Mini-PINTAR
  content is authored for Mini-PINTAR and is never imported from any PINTAR
  item bank.** No item, option, rationale or misconception code that exists
  in `items` / `item_options` may appear in the bundle. Publishing a real
  item's key would breach INV-01 directly and would invalidate content a
  certificate may point at.
- **No new attack surface.** Nothing executes on the server on the visitor's
  behalf; there is no input that reaches a database.
- **No personal data is collected**, so none can leak. The four counters
  permitted by R8 carry a step identifier and a language, never an answer,
  and ship only if they can be implemented without identifiers or tracking
  machinery — otherwise V1 ships with no analytics at all.
- **INV-20 is untouched.** No evidence of any class is produced, so nothing
  can reach an official consumer.

## Future constraints

1. **A later decision may revisit Path B** (engine-backed `PUBLIC_DEMO`
   sessions). It must first supply: a public principal that can hold a
   session without a Person; a rate-limit primitive; new
   `public_surface_registry` entries with a widened
   `assert_public_surface()`; and a retention rule for demo sessions. That
   decision is a new ADR, not an amendment to this one.
2. **The content bundle must remain demo-only** (see *Security
   implications*). This constraint is not revisable without revisiting
   INV-01.
3. **The local calculation may never be presented as authoritative.** If a
   future version wants to tell a visitor what they have mastered, it needs
   Path B and real evidence, not a larger question set.
4. **This ADR does not authorize retrofitting closed product surfaces** —
   neither the colour ruling (R6) nor anything else here reaches `src/`.
5. **A baseline amendment is owed.** Doc 09 must move Mini-PINTAR's public
   experience from FOUNDATION NOW to BUILD NOW, and doc 11 must mark OD-11
   RESOLVED with this ADR's number. Both are frozen baseline documents, so
   that is a governed amendment — new bytes, a new `baseline` identity, a
   matching in-document marker, and `BASELINE-MANIFEST.json` regenerated —
   and it is a separate change from this ADR. **Until it lands, doc 11 still
   reads OD-11 as OPEN and disagrees with this ADR.** The ADR is the later
   authority; the disagreement is recorded here rather than left for someone
   to discover.

## Tests proving the decision

**No test is added to the selftest contract, and that is the point.** The
contract asserts properties of the PINTAR application and its database;
this decision's entire content is that Mini-PINTAR touches neither. A test
in `selftest/` would have to reach out of the system it verifies in order to
find something that, if the decision holds, does not exist.

What holds the decision instead:

- **The existing assertions, unchanged.** `assert_public_surface()` already
  fails on any anon-reachable object that is not declared, and the
  `functions_executable_by_anon` lint already counts them. If a future
  change gave Mini-PINTAR a write path, those two would go red without
  anyone remembering to write a new test — which is stronger than a test
  aimed at this decision specifically.
- **A build-time check in the website project** (to be specified in M1's
  implementation phase): the content bundle must contain no identifier
  drawn from any PINTAR bank, and the demonstration must issue no request
  carrying an answer.

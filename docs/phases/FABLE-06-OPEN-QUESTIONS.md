# FABLE-06 — open questions and retroactive findings

Two sections. **Open questions** are real questions with product answers,
deliberately not resolved under end-of-phase pressure. **Retroactive findings**
are gaps in closed phases that a mechanism built later exposed — recorded here
so the capstone carries them rather than Layer-3 discovering them.

Accumulated as they are found, so the capstone folds in a ledger rather than a
recollection. **Nothing here is a defect report.** Each entry is a real question
with a product answer, deliberately not resolved under end-of-phase time
pressure, and each names who it belongs to.

---

# Retroactive findings

## RF-1 — six surfaces shipped with no output-level HLE coverage

**Found by:** F06-S02 (the derived route inventory) and F06-S03 (enum in a text
position), both built in FABLE-06. **Reaches back into:** FABLE-05 and Task 2,
both of which closed with a second-eye gate behind them.

**What was missing.** Every route under `/studio/*` plus `/evaluasi` had no
rendered-output `INTERNAL_WORDS` check — five FABLE-05 surfaces and one from
Task 2. The source scan (F01-S03) was green throughout, and it is blind to
`{x.status}` by construction: it matches JSX text nodes and deliberately skips
`{...}` expressions, with the comment *"enum comparisons in code are not user
copy."* That statement is correct about what it does. Reading it as a broader
guarantee was the error, and it was made by both reviewer and builder.

**What the closure documents actually claimed — read, not assumed.**

- **FABLE-05's completion report did not overclaim.** Its row for
  *"`studio.*` / `config.*` declared staff-only in the HLE"* is marked
  **reading — flagged**, and points at F05-S03 as asserting "the other half".
  The report was careful.
- **The overclaim was in the manifest.** F05-S03's `proves` line read *"no
  Studio copy shows a lifecycle enum, version string or evidence class"* —
  which reads as a property of the Studio **surface**. What it tests is the
  **copy table** in `src/lib/hle.ts`. A page interpolating an enum passes it.
  **Amended** to say what it tests.
- **Task 2's completion report claimed nothing** about surface-level HLE
  enforcement — only *"thirteen HLE strings"*, a count. So for `/evaluasi` the
  coverage was **absent and unremarked**, which is the more honest of the two
  states and still a gap.

**It was live, not latent.** F06-S03's first run found five real
interpolations. **Four are one kind of defect and the fifth is another**, and
they should not be read as five of a thing.

*Vocabulary leaks (four).* `{i.bank_type}` on the Studio bank page and
`{b.mode}` three times on the definitions page rendered `PRACTICE`, `TEST`,
`EXAM`, `PRE_TEST`, `POST_TEST` to staff. **This is a product-quality defect,
not a boundary breach** — no learner surface, no evidence, no answer key. An
author choosing a mode needs to know which mode; they do not need to read the
identifier.

*An unlabelled behavioural signal beside a person (one).* `{g.category}` on the
integrity page rendered `VISIBILITY_CHANGE` next to a named learner. **That is
different in kind.** A bare token beside a person invites the reader to treat it
as a verdict, and INV-11 exists precisely to prevent that: *PINTAR observes and
highlights; educators interpret and decide.* The label is not cosmetic there —
"Berpindah dari layar penilaian" describes what was observed; `VISIBILITY_CHANGE`
reads like a charge. **The difference between an observation and an accusation
was one HLE key.** **None of those values is in
`INTERNAL_WORDS`**, so no word list would ever have caught them; the rule had to
be about shape and provenance instead. All five are fixed, and the enum-bearing
column list is derived from the migrations so a new enum column is covered the
day it is created.

**Why the fallback shows nothing rather than the key.** `enumLabel` returns an
em dash for an unmapped value. Most translation layers fall back to the key,
which turns a missing translation into exactly this defect — silently, at the
moment somebody adds a new enum value, which is the moment nobody is looking. A
fallback that shows nothing is honest; a fallback that shows the key is the leak
wearing a helpful face.

**Derive, do not enumerate — three for three.** Revoke coverage (ADR-0021),
route coverage (F06-S02), enum-column coverage (F06-S03). Each began as a
hand-maintained list that was green **because it was short**, and each was
repaired by deriving the list from the thing itself: the migration text, the
route table, the enum declarations. 71 columns from 32 enum types, covered the
day a new one is created, is the shape all three now share. A fourth followed
immediately — F06-S04 derives its subject from the manifest rather than from a
list of tests worth checking.

**The property worth carrying forward:** the HLE guard operates on the
product's actual language, not only on enum identifiers — it refused the label
*"Salah paham yang berulang"* written during this phase because `Salah` is a
verdict-shaped word. That protects copy written in the UI/UX stream after this
build closes, and it is a property of the system rather than of this phase.

---

## RF-2 — sixteen privileged endpoints resolve an argument before they authorize

**Found by:** F06-N02, while establishing INV-19 over a derived endpoint set.
**Not fixed here** — it spans FABLE-02 through FABLE-05 and changing sixteen
functions' error ordering at the end of a phase is the kind of wide, low-evidence
edit this project refuses.

**Measured, after giving each endpoint a resolvable argument.** Of the 18
mutating STAFF endpoints that check a capability `DEAN` lacks:

- **8** refuse with an authorization error naming the capability
- **10** refuse earlier, at argument resolution or value validation:
  `acknowledge_finding`, `publish_release`, `record_integrity_review`,
  `record_question_health_review`, `revoke_certificate`, `transfer_authorize`,
  `transfer_execute`, `transfer_reject`, `transfer_request`, `withdraw_release`

The first measurement said 2 and 16. Passing null arguments meant sixteen
endpoints refused on the null rather than on the capability; resolving real ids
from the dean's own tenant moved eight of them onto authorization. The remainder
need entities the tenant does not hold (no releases, no certificates, no
transfers) or a specific enum or text value a generic resolver cannot guess.

**THE HOLE THIS LEAVES, stated because the floor guard does not close it.** The
derived-set floor catches an endpoint whose capability check is *removed*. It
does not catch one *weakened* — `CAN_MANAGE_X` swapped for a capability DEAN
holds. Such an endpoint stays in the set, still refuses the probe at resolution,
and the test stays green while INV-19 is broken. **For the eight that reach
authorization the assertion would catch it; for the ten named above it would
not.**

The capstone sentence, which must appear as written:

> **INV-19 is verified by AUTHORIZATION for 8 endpoints and by REFUSAL for 10.
> For those 10, a weakened capability check would not be detected by this
> assertion.**

**None accepted the call**, which is INV-19's actual claim and it holds. But for
sixteen of them the test proves *refusal*, not *authorization* — and the
distinction is the one this phase has now repaired twice: `metric_evaluate`
checked deprecation before authorizing (0073), `sanitized_item` raised
`unknown presented item` before authorizing (0074). **This is the same shape,
sixteen more times.**

**Why it is partly unavoidable, and where it is not.** A function taking a
release id genuinely cannot call `can_in_institution(cap, inst)` until it has
resolved `inst` from that release — resolution must come first. What is *not*
forced is the error being distinguishable: `unknown release <NULL>` tells a
caller the id does not exist, which is an existence oracle of exactly the kind
0074 removed. The repair that worked there was one message for both cases.

**Exposure is low** — the ids are unguessable uuids, so the oracle answers a
question the caller already knew — and it is recorded for its **shape**, not its
severity, because sixteen instances is a pattern in how these functions are
written rather than a slip.

### What would settle it — BOTH PARTS, and the order matters

**A uniform refusal message ALONE makes things worse.** F06-N02 classifies by
reading the error text. If every refusal says "not available", the test can no
longer tell an authorization refusal from a resolution failure, and the honest
count goes from *8 by authorization, 10 by refusal* to **18 indistinguishable**
— strictly less than it proves today. A reader implementing "one refusal message
per endpoint" from this ledger alone would make the assertion vacuous while
believing they had closed a finding. That is L12's shape by a different road: a
repair that stops the probe from reaching its subject.

**The repair is two changes, and the message is the second one.**

1. **Authorization becomes the first gate.** Then any refusal a dean receives is
   an authorization refusal *by construction*, and the test's classification
   survives the message being uniform.
2. **Then the uniform message**, which at that point costs nothing and closes
   the existence oracle.

**"Authorize first" is not literally available for most of these, and the
substitute is two-stage.** An endpoint taking a release id cannot call
`can_in_institution(cap, inst)` before it knows `inst`, and `inst` comes from
the release. So:

- **Stage 1, before any resolution:** does the caller hold this capability in
  **any** institution? If not, refuse with the uniform message. This needs no
  argument and no lookup, and for a dean — who holds these capabilities nowhere
  — it is the branch that fires. It is a pre-filter, never the authorization: it
  cannot grant, only refuse early.
- **Stage 2, after resolution:** `can_in_institution(cap, resolved_inst)`, with
  the **same** message on failure.

Stage 1 is what makes a dean's refusal an authorization refusal; stage 2 is what
keeps it correct for someone who holds the capability somewhere but not here.
Both refuse identically, so nothing about existence leaks either way.

`sanitized_item` (0074) is the pattern for the message half; `metric_evaluate`
(0073) is the pattern for the ordering half. This finding needs both.

---

## OQ-4 — a briefing that never gathers enough evidence has no exit

**Belongs to:** the UI/UX stream or a later phase · **Found by:** running the
FABLE-06 suite twice on one database.

Doc 04 §8's lifecycle is `COLLECTING → GENERATING → READY → REVIEWED →
ARCHIVED`, and the declared edges implement exactly that: **ARCHIVED is
reachable only from READY and REVIEWED.** A briefing that never meets the
catalogue minimum therefore sits at `COLLECTING` permanently. There is no
`COLLECTING → ARCHIVED`, and adding one was not done here because the frozen
lifecycle does not have it and inventing an edge at phase end is how a state
machine stops meaning anything.

**Why it matters in practice, not in theory.** A class that never finishes its
post-test leaves a briefing collecting forever. Nothing breaks — the row is
inert and `advance_briefing` keeps returning "not yet" — but an educator's inbox
accumulates entries that will never resolve, and the product has no way to say
"this one is not coming".

**TWO FRAMINGS, and recording only the first would narrow the answers.**

*As a lifecycle question:* `COLLECTING` needs an exit, so add a declared edge.
This is the reading the finding invites, and it is the more expensive one — an
edge added to a state machine that currently means something precise, to solve
a problem that may not live there.

*As a surface question:* a stuck briefing is only a problem **because it appears
in an educator's inbox**. A surface that does not list a briefing which cannot
advance — or lists it with an honest sentence saying so — resolves the entire
complaint without touching the lifecycle at all.

The second is probably right and is certainly cheaper. **Recorded both ways
deliberately**, because a reader who sees only "missing edge" will add one, and
that is the outcome the restraint here was protecting against.

**What would settle it:** a product decision about whether an unfinished
briefing is closed, expires, or is simply not shown. Only the first of those
needs a declared edge.

---

## OQ-3 — Five mutating STAFF endpoints with no direct authorization reference

**Belongs to:** the final release audit · **Observed, not investigated.**

`grant_role`, `run_mcq_quality`, `validate_course_content`,
`ingest_structured_package` and `propose_easy_upload_mapping` are mutating STAFF
RPCs whose comment-stripped source references no capability check, no
`has_scope`, no `can_on_node`, no `is_system_admin` and no `current_person_id`.

**This may be correct.** `grant_role` is guarded by `role_assignments_guard`,
which enforces INV-16 at the trigger rather than in the function, and delegation
to a trigger is a legitimate and arguably better pattern. The others were not
examined.

**Deliberately not resolved here.** Reading five function bodies at the end of a
phase would produce a confident paragraph and no evidence, which is what this
ledger exists to prevent. The question is recorded as existing and unexamined.

---

## OQ-1 — Exposure cooling meets the safety-critical minimum

**Belongs to:** Load Lab (Tim) · **Raised by:** the FABLE-06 draw measurement ·
**Not in FABLE-06 scope.**

Two rules that are individually correct meet in an `EXAM`-bank context:

- `assemble_session` fills **safety-critical items first**, and
  `safety_critical_minimum` guarantees at least one per session — measured, and
  the reason two D1 items were presented 102 and 98 times out of 160 while the
  other ten fell between 64 and 83.
- `exam_item_is_cooled` excludes an item presented to the same cohort inside the
  institution's `cooling_days` window — and applies **only to `bank_type =
  'EXAM'`**, which is why the FABLE-06 fixture never met it: D1's bank is `TEST`.

**The question.** Safety-critical items are the ones cooling reaches first,
*precisely because* the minimum guarantees they are presented. With a bank thin
in the safety-critical dimension, can cooling exclude enough of them that
`assemble_session` cannot satisfy `safety_critical_minimum`? And if so, **which
rule yields** — does it present a cooled item, or assemble a session without the
safety guarantee?

**Why it is not answered here.** It needs a bank deliberately thin in the
safety-critical dimension to trigger, which a load laboratory constructs on
purpose and a fixture cannot stumble into. Reading the code for an answer at the
end of a phase would produce a confident sentence and no evidence — and this
project has lost rounds to exactly that. `assemble_session` does raise when the
bank cannot supply enough drawable safety-critical items, so a refusal is one
plausible behaviour; **whether that is what happens under cooling specifically
has not been measured and is not claimed here.**

**What would settle it:** an EXAM-bank institution with a cooling policy set, a
safety-critical pool small relative to cohort size, and enough repeated cohort
sessions to drive cooling across it.

---

## OQ-2 — Per-edge Question Health audit volume at institution scale

**Belongs to:** Load Lab (Tim) · **Raised by:** 0077's per-edge audit decision.

A first recompute writes at least one `audit_log` row per item, and up to two
per item that moves. Bounded in steady state by the Q4 guarantee — a rerun over
unchanged evidence writes nothing — but **unbounded on first run at institution
scale**. At D1's twelve items this is nothing. On a real bank it is a number
worth having before someone finds it.

---

# A rule for the capstone, recorded here so it is not a matter of intent

**Every number in the state-of-the-system document comes from a command run at
the commit the document describes, and the command is pasted beside the number.**
Not from a commit message, not from a conversation, not from recollection.

Three count errors landed in this phase between builder and reviewer, all from
the same habit: *"80 / 81 migrations"* (read off scratch database names — there
are 79), *"counters unchanged"* (eight counters checked, a ninth not), and *"all
seven allowlist rows are identical"* (written from a `limit 1` beside a
`count(*) = 7`). Each was cheap to correct because something else measured it.

The capstone is the one document where a wrong number is **load-bearing rather
than embarrassing** — it is the artefact a Layer-3 audit reads to decide what was
verified. A figure there that nobody can reproduce from a pasted command is a
claim, and this project's whole method is that claims are not evidence.

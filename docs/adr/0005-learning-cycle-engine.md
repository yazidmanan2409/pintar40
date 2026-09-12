# ADR-0005 — The one assessment engine, and five decisions it forced

**Date:** 2026-09-13
**Phase:** FABLE-03
**Status:** Accepted
**Supersedes:** nothing. **Superseded by:** nothing.
**Amends:** ADR-0004 not at all — §2 below exists precisely so it does not have to.

FABLE-03 §0 requires one engine module (INV-26) and does not say which layer
holds it. Six questions had no answer that could be read off the prompt, and
each is recorded here rather than settled in a diff.

---

## 1. Where the engine's implementation lives

### Problem
§0 names one engine that owns assembly, sanitization, response acceptance,
grading and finalize. `lib/assessment-engine/` is a TypeScript path; the
privileges that guard the answer key are in Postgres. Which one *is* the
engine?

### Considered options
- **A — TypeScript owns it.** The module reads items with `service_role` and
  builds the learner payload in Node.
- **B — SQL owns it, TypeScript is the only caller.** Assembly, sanitization,
  grading, the gate and finalize are database functions; one typed module
  calls them and every route calls that module.
- **C — Split by concern.** Sanitization in SQL, scoring in TypeScript.

### Decision
**B.**

### Reason
The privileges already decided it. FABLE-02 grants SELECT on `items` and
`item_options` behind a `CAN_DRAFT` policy, and `role_capabilities('STUDENT')`
is empty, so a learner cannot read one row of the bank through any client
path. Under A the sanitizer must run as `service_role` and hold the whole
authoring row — answer key included — in a Node process, and "the sanitizer"
degrades into "whatever that code remembered to drop". Under B the answer key
never leaves Postgres, and INV-01 is a property of the grants rather than of a
function's diligence. C is A's weakness with extra seams.

B also settles the roadmap's §5.1 trap without touching FABLE-01. The learner
RPCs are `SECURITY DEFINER` granted to `authenticated`, and a definer function
owned by the schema owner may call `open_assessment_session()` and
`submit_response()` even though both are `service_role`-only — so the engine
never imports `@/lib/supabase/service` and F01-S03 is unchanged. Deriving the
learner from `current_person_id()` inside the database makes INV-08 structural:
no entry point takes a person, so no route can attribute one learner's evidence
to another even by mistake.

### Consequences
Scoring logic is in SQL, which is harder to unit-test in isolation and harder
for a TypeScript-only reader to follow — the honest cost. In exchange,
INV-09's "independent recomputation at issuance" is `evaluate_session()` called
a second time and compared, so Phase 4 needs no second scorer and INV-26 stays
satisfiable. INV-26 is checked from both ends: each migration's verification
block asserts exactly one `assemble_session`, `session_paper`, `grade_response`,
`evaluate_session` and `finalize_session`, and F03-S01 asserts exactly one
module names those RPCs.

### Affected components
`src/lib/assessment-engine/`, `src/app/belajar/**`, `selftest/static.test.ts`.

### Affected database objects
`assemble_session`, `session_paper`, `sanitized_item`, `record_answer`,
`grade_response`, `evaluate_session`, `finalize_session`,
`start_learning_session`, `may_start_assessment`, `may_continue_session`.

### Security implications
The answer key never leaves the database. No client role can execute
`grade_response` or `evaluate_session`; F03-T03 asserts a learner reads zero
rows of `items` and `item_options`.

### Future constraints
Phase 4 extends these functions; it does not add a parallel set. A new route
that needs evidence calls the engine module.

### Tests proving it
`F03-S01`, `F03-T03`, `F03-T10`, and the CI red case `static-duplicate-engine`.

---

## 2. Mode names are mapped, not renamed

### Problem
FABLE-03 and FABLE-04 write `LEARNING_CYCLE_PRETEST`,
`LEARNING_CYCLE_POSTTEST` and `QUICK_ASSESSMENT`. FABLE-02's
`assessment_mode` enum reads `PRE_TEST | POST_TEST | QUICK | STANDALONE`. Two
vocabularies must not drift.

### Considered options
- **A — Rename the enum labels** (`ALTER TYPE … RENAME VALUE`).
- **B — Add the prompt's names as new labels** and leave the old ones.
- **C — Map the names once, in writing, and keep one set of labels.**

### Decision
**C.** `LEARNING_CYCLE_PRETEST` = `PRE_TEST`, `LEARNING_CYCLE_POSTTEST` =
`POST_TEST`, `QUICK_ASSESSMENT` = `QUICK`. FABLE-04's remaining modes are
added additively when Phase 4 needs them.

### Reason
A is unsafe: `mode::text` is inside the frozen content hash (ADR-0004 §1), so
renaming a label silently changes the hash of every release containing an
assessment definition — the exact event the freeze exists to make detectable,
caused by a cosmetic edit. ADR-0004 §4 says historical hashes are never
recomputed under new semantics; a rename would recompute them by accident. B
is the drift the roadmap warns about. C keeps one set of labels in the schema
and one mapping in the documentation.

### Consequences
A reader moving between the prompts and the schema must hold one mapping in
mind. Accepted: the alternative is either a silent hash change or two live
vocabularies.

### Affected database objects
`public.assessment_mode` — unchanged, deliberately.

### Security implications
None.

### Future constraints
Phase 4 may add labels; nothing may rename one while any frozen release
references it.

---

## 3. The learner answers with a display position, never an authored label

### Problem
doc 07 requires option shuffling to be seeded, deterministic per session, and
not derivable by the client. Emitting the authored label beside each option
makes the shuffle cosmetic: anyone reading the JSON recovers the authoring
order and any positional habit in how the bank was written.

### Decision
`session_paper()` emits `{posisi, teks}`. `record_answer()` recomputes the same
permutation server-side and stores the authored label, so the value on
`responses` keeps FABLE-02's `{"pilihan":"A"}` shape and 0026's aggregates are
untouched. `option_display_order()` is executable by no client role.

### Reason
INV-01's spirit: the learner-facing representation is a distinct shape, not the
authoring one with fields hidden. The mapping is the part worth hiding.

### Consequences
Every answer path must translate, and a test that wants to answer correctly
needs owner privileges to know which position is right — hence
`selftest.pick_position()` being `SECURITY DEFINER`, which is also a useful
signal that the shuffle is real.

### Tests proving it
`F03-T03`, `F03-T05`, `F03-T10`.

---

## 4. INV-11 narrowed from "no reference" to "no read"

### Problem
0024 put telemetry in its own schema and asserted that nothing in `public`
references it, with one named exception for the write trigger. §6 requires a
learner-facing path that *records* hesitation and assistance, and PostgREST
exposes only `public`, so such a function must live there and must name the
schema. The old rule and the new requirement cannot both stand.

### Considered options
- **A — Expose the `telemetry` schema to PostgREST for `service_role`.**
- **B — Extend the exception list to the new writer functions.**
- **C — Narrow the rule to what INV-11 says: a function in `public` may WRITE
  telemetry and may never READ it.**

### Decision
**C.**

### Reason
INV-11 is "hesitation/assistance telemetry never influences scoring", and its
own "how tested" column scopes to scoring-relevant views and functions. A
scoring path that cannot read a value cannot be influenced by it, so the
write-only rule enforces the invariant directly. Unlike B it constrains every
future function instead of excusing chosen ones — the drift 0024 objected to.
A would make the local stack and the hosted project diverge on a setting no
migration can carry, which is the silent-configuration-drift failure mode.

The rule has exactly one definition, `public.assert_telemetry_write_only()`,
covering reads, joins, updates, deletes, dynamic SQL naming the schema, view
dependencies, and client grants. 0033's verification block proves it bites: it
plants a `public` function that reads telemetry, asserts the check goes red,
drops it, and asserts it goes green again.

### Consequences
F02-T16 was changed, openly, to call the same assertion. This is a narrowed
rule, not a weakened one for scoring — but it does permit something the old
text forbade, and that is stated rather than buried.

### Affected database objects
`public.assert_telemetry_write_only`, `public.assistance_state`,
`public.open_assistance`, `public.dismiss_assistance`,
`telemetry.assistance_kind` (two additive labels),
`telemetry.assistance_events.level`.

### Security implications
No client role gains anything: `telemetry` is still ungranted and still not
exposed through PostgREST.

### Tests proving it
`F02-T16`, `F03-T08`, and 0033's own verification block.

---

## 5. First view is delivery evidence, and lives in `public`

### Problem
The whole paper's `presented_items` rows are written at assembly (doc 07), so
`presented_at` cannot answer "how long has this learner been looking at *this*
question", which §6's window needs. A client-side timer is rejected by doc 07
as spoofable.

### Decision
`public.presented_item_views` records, on the server clock, when the learner
first opened each delivered item. Written only through `note_item_view()`; no
client role holds a write grant; append-only.

### Reason
It is the `item_presented` fact refined — doc 06 category (1), "No (informs
exposure/cooling)" — not category (3). Scoring never reads it, and putting it
in `telemetry` would have forced the decision function to read telemetry,
which §4 above exists to forbid.

### Consequences
Testing the window with a fast-forwarded clock needs the harness to backdate a
row, so `selftest.age_item_view()` disables the append-only trigger for one
statement. The control that matters — no client write path — is asserted
separately and never relaxed.

### Tests proving it
`F03-T08`.

---

## 6. FABLE-03 seeds its own tenant (a stop-patch-loop)

### Problem
The suite first used Alpha's learners. FABLE-01's period rollover closes every
2026/27 membership in the tenant it runs against and its transfer test can end
an enrolment outright — both correct — so a learning assignment scoped to a
class in that tenant reached nobody once FABLE-01 had run, and every FABLE-03
test failed on `NO_ACTIVE_MEMBERSHIP` for a reason unrelated to FABLE-03.

### Considered options
- **A — Repair the shared personas from inside the suite.**
- **B — Scope the assignment to the programme so the rollover cannot be felt.**
- **C — Seed a third synthetic institution owned by this phase.**

### Decision
**C**, after three attempts at A each surfaced a different consequence of the
same cause: the closed membership, then a second enrolment in the other tenant,
then the rollover reaching the replacement learners too. Per the standing
stop-patch-loop rule, the third repeat stopped the patching.

### Reason
doc 12's test-isolation failure mode names this exactly: each test seeds its
own tenant, with no shared global fixture mutated across suites. B would hide a
real feature's effect by loosening the fixture's scope, which makes the fixture
less like production, not more.

### Consequences
A third synthetic institution, its own period, class, three staff and two
learners. Slightly more seed; complete independence between phase suites.

### Affected components
`supabase/seed/learning_cycle.sql`, `selftest/db/fable03.sql`,
`supabase/config.toml`.

### Tests proving it
The whole of `run_fable03()`, which passes in the same transaction as
`run_fable01()` and `run_fable02()`.

---

## 7. Two repairs carried in this phase

Both are inside the subsystem FABLE-03 uses, so they are fixed forward-only
here rather than filed:

- **`run_mcq_quality()` raised on every call** (migration 0032). Its
  `STEM_REVEALS_ANSWER` branch uses `INSERT … SELECT DISTINCT`, and `DISTINCT`
  resolves the select list before assignment coercion, so `'ERROR'` stayed
  `text` against `finding_severity`. The failure is in planning, so no row had
  to match. Nothing called the function in FABLE-02 — F02-T19 exercises the
  validator and `publish_readiness` but not this — and the phase's content
  fixture is its first caller. The verification block is behavioural, because a
  structural assertion is what missed it.
- **`submit_session()` was not idempotent at FINALIZED** (migration 0034). A
  learner who double-tapped *Kumpulkan* hit the transition allow-list and saw
  an error for work that had already succeeded. `finalize_session()` was
  already idempotent; the submit step in front of it was not, so the guarantee
  stopped one function short of the button.

---

## 8. What this phase deliberately did not build

- **Learner UI for the five non-MCQ item types.** §5 says build `MCQ_SINGLE`
  and `MCQ_MULTI` now "plus every other registered type the product owner has
  confirmed real V1 content for (**OD-8**, contingent on OD-3)". OD-8 is
  unanswered, so the type *system* is complete and registry-driven — every type
  has a sanitizer allow-list, and `public.item_type_learner_support` names the
  two that have a renderer — and the assembler refuses to put a type with no
  renderer on a paper rather than delivering a question nobody can answer.
  Building polished UI for a type with no confirmed content is the speculative
  architecture doc 12 warns about.
- **An answer-key store for free-entry and pairing types.** `NUMERIC` is
  expressible through `item_options` as accepted forms plus misconception-linked
  distractors; `MATCHING` is not, and a store for it would be taught content
  and so would require a `PINTAR-CONTENT-SHA256/2` contract under ADR-0004 §4.
  That is a real cost for a type OD-8 may never call for. Recorded, not built.
- **A certificate.** §7's call to action says so plainly on the results screen:
  eligibility needs `OFFICIAL` evidence, this tenant is synthetic, and issuance
  is Phase 4. The roadmap's §4 decision is untouched here.

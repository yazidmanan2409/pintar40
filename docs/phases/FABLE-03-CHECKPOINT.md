# FABLE-03 — acceptance map and mini audit

Every line of the phase prompt's acceptance checklist, the manifest id that
proves it, and the result of the mini audit the prompt requires at the end
("answer-key leakage incl. AI contexts, duplicate engine, telemetry joins,
learner routes without middleware").

Written at the close of the phase. It records what is proven, what is
deliberately absent, and what the phase found wrong in earlier work.

## Acceptance checklist → test id

| Checklist line | Id | Kind |
|---|---|---|
| Scripted end-to-end: pre-test → reading map → lesson → post-test → results, for an email learner and a classroom-card learner, in a synthetic tenant, full provenance | `F03-T01` (database) · `F03-R01` (HTTP) | behavioural |
| INV-24: the post-test set has an empty intersection with the pre-test's item ids **and** `parallel_group`s, across the whole bank | `F03-T02` | behavioural |
| INV-26: the code-search check fails a planted second scorer/sanitizer | `F03-S01` + CI red case `static-duplicate-engine` | static + red case |
| INV-01: the learner payload carries no `is_correct`, rationale-to-correct mapping or `misconception_code` (allow-list contract test diffing authoring vs sanitized) | `F03-T03` (behavioural) · `F03-S02` (contract diff) | both |
| INV-31: the assistance-context payload equals the sanitized type; building it from the authoring representation is refused | `F03-S03` | behavioural |
| INV-27: close the window mid-session → next response accepted, new session refused; revoke scope → next scored action refused | `F03-T04` | behavioural |
| INV-28: a duplicate key yields one response row; a killed client returns to the server's presented items and accepted responses | `F03-T05` (+ `F02-C01` under real concurrency) | behavioural |
| Refreshing mid-lesson resumes at the same or later position, never earlier | `F03-T06` | behavioural |
| INV-10: a safety-critical item answered wrong fails mastery even when the score would pass | `F03-T07` | behavioural |
| INV-11: identical response sets score identically with and without hints; the trigger never fires before the window (fast-forwarded clock); never offline | `F03-T08` (+ `F02-T16`) | behavioural |
| A planted forbidden word never appears in any generated assistance/feedback string, for at least one item of each built type | `F03-T09` | behavioural |
| INV-08 / INV-09: a forged `person_id` or client-submitted score is ignored; duplicate finalize is idempotent | `F03-T10` | behavioural + structural |
| Copy/route inventory: no internal enum, version string or "PINTAR 4.0" on any learner route | `F03-R02` (+ `F01-S04`) | behavioural |

Offline behaviour (§6, "assistance requires connectivity") is a property of the
design rather than a separate test: the client never decides when help is due,
it asks the server, so an unreachable server offers nothing. `F03-T08` proves
the server side of the same rule — the window holds to the second.

## Mini audit

Run against a clean-database replay of all 34 migrations with both seeds.

**Answer-key leakage, including AI contexts.** Six functions in `public` read
`is_correct`. Four are executable by no client role at all
(`content_canonical_payload`, `enforce_taught_content_immutable`,
`grade_response`, `session_misconceptions`). Two are executable by
`authenticated`: `run_mcq_quality` is FABLE-02's staff-facing quality pass, and
`reading_map` is this phase's — `SECURITY DEFINER`, ownership-checked, and its
projection carries objectives, remediation text and page citations, never an
item, an option or a correctness. A learner reads zero rows of `items` and
`item_options` (`F03-T03`). The assistance context is the sanitized item and
refuses an authoring row field by field (`F03-S03`). **No finding.**

**Client write path on evidence.** `anon` and `authenticated` hold no INSERT,
UPDATE or DELETE on any of `assessment_sessions`, `presented_items`,
`presented_item_views`, `responses`, `assessment_results`, `lesson_progress`,
`assistance_grants`, `integrity_signals`, or either telemetry table. Every
write goes through a `SECURITY DEFINER` function that derives the learner from
the JWT. **No finding.**

**Duplicate engine.** One `assemble_session`, one `session_paper`, one
`grade_response`, one `evaluate_session`, one `finalize_session` — asserted by
each migration's own verification block. One module names those RPCs, asserted
by `F03-S01`, and the CI red case plants a route that scores a session outside
the engine and requires the check to catch it by name. **No finding.**

**Telemetry joins.** `public.assert_telemetry_write_only()` reports clean: no
view in `public` depends on telemetry, no function reads it (FROM, JOIN, UPDATE,
DELETE, or dynamic SQL naming the schema), no client role holds a grant or
schema USAGE. The rule was narrowed this phase from "no reference" to "no read";
see ADR-0005 §4 for why, and 0033's verification block for the planted reader
that proves it still bites. **No finding.**

**Learner routes without middleware.** Seven learner page routes, none in the
proxy's `PUBLIC_PATHS`; `F03-R01` confirms over HTTP that an anonymous request
is redirected to sign in and keeps its destination. **No finding.**

**Schema lint.** `tables_without_rls` 0 · `policies_using_true` 0 ·
`secdef_without_search_path` 0 · `functions_executable_by_anon` 0 ·
`anon_table_grants` 0 · `anon_public_surface` 1 (the published lesson view) ·
`anon_public_view_write_grants` 0 · `audit_log_client_write_grants` 0 ·
`public_buckets` 0 · `client_storage_policies` 0 · 34 migrations applied.

## Defects this phase found in earlier work

Both were inside the subsystem FABLE-03 uses, so both were repaired
forward-only here (ADR-0005 §7).

1. **`run_mcq_quality()` raised on every call, on every course.** Its
   `STEM_REVEALS_ANSWER` branch used `INSERT … SELECT DISTINCT`, which resolves
   the select list before assignment coercion, so `'ERROR'` stayed `text`
   against `finding_severity`. The failure is in planning, so no row had to
   match. It survived FABLE-02 because nothing called it: F02-T19 exercises the
   validator and `publish_readiness` and not this. Migration 0032; the
   verification block is behavioural, because a structural assertion is exactly
   what missed it.
2. **`submit_session()` was not idempotent at FINALIZED.** A learner who
   double-tapped *Kumpulkan*, or whose client retried, met the transition
   allow-list and saw an error for work that had already succeeded.
   `finalize_session()` was already idempotent; the guarantee stopped one
   function short of the button. Migration 0034.

## Invariant whose statement changed

**INV-11.** 0024 enforced it as "nothing in `public` references `telemetry`",
with one named exception. §6 requires a learner-facing writer and PostgREST
exposes only `public`, so the rule is now "a function in `public` may WRITE
telemetry and may never READ it" — strictly stronger for scoring, and binding
on every future function rather than excusing a list. F02-T16 was changed,
openly, to call the same single assertion. ADR-0005 §4.

## Deliberately absent

- **Learner UI for the five non-MCQ item types.** §5 builds `MCQ_SINGLE` and
  `MCQ_MULTI` now, plus any type the product owner has confirmed real content
  for — **OD-8**, unanswered. The type *system* is complete and registry-driven;
  `public.item_type_learner_support` names the two with a renderer, and the
  assembler refuses to put any other type on a paper.
- **An answer-key store for free-entry and pairing types.** `NUMERIC` is
  expressible through `item_options`; `MATCHING` is not, and a store for it is
  taught content, so it would require a `PINTAR-CONTENT-SHA256/2` contract under
  ADR-0004 §4. Recorded, not built, pending OD-8.
- **Certificates and the public verification route.** Phase 4. The results
  screen says so rather than showing a call to action that leads nowhere.
- **Real source content.** OD-3 is unanswered, so the fixture's Source is named
  as a fixture and carries no ISBN. No citation is invented.

## Carried forward

- **The roadmap's §4 decision** — no `OFFICIAL` evidence is possible while every
  institution is synthetic — is untouched by this phase, which wants `SYNTHETIC`.
  It still blocks FABLE-04's positive certificate tests and must be settled
  before that phase starts.
- **`docs/rebuild/03` defines INV-01…INV-22**; FABLE-01 and FABLE-02 enforce and
  cite INV-23…INV-37, and FABLE-03 adds INV-24, 26, 27, 28, 31 to that set. The
  numbers are named in the synchronized phase prompts but have no entry in doc
  03, and **doc 16** (the verification contract cited by `selftest/run.ts`) is
  absent from the repository. Neither is invented here; both remain open
  documentation gaps.

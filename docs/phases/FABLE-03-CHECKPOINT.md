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
- **FABLE-02's item aggregates read one answer shape.**
  `service_item_statistics` and `service_distractor_uptake` match a chosen
  option with `value ->> 'pilihan'`, which is a string for `MCQ_SINGLE` and a
  JSON array for `MCQ_MULTI` — so a multi-select response matches no option and
  is counted as incorrect. The scoring path is unaffected (`grade_response`
  handles both shapes, and `F03-T01` scores a paper containing both), and these
  views are `service_role`-only and consumed by Phase 6, which owns them. Not
  fixed here: it is outside the subsystem this phase changed, and widening a
  phase on the way past is the scope creep doc 12 warns about. **Recorded for
  FABLE-06.**
- **CLOSED 2026-09-13 — the doc 03 and doc 16 gap was a supply gap, not an
  architecture gap.** This entry previously read that `docs/rebuild/03` defines
  only INV-01…INV-22 while FABLE-01…03 cite INV-23…INV-37, and that doc 16 was
  absent. Both statements were accurate about the copies **in this repository**
  — the imported doc 03 was the pre-amendment revision, 33 lines, stopping at
  INV-22, and no doc 16 existed here at all. Neither was accurate about the
  baseline: doc 03 carries a *baseline amendment dated 2026-09-12* adding
  INV-23…INV-38 and correcting INV-05 and INV-20, and doc 16 exists. Both were
  supplied by Claude 1's review and are now imported at
  `docs/rebuild/03-PINTAR-INVARIANTS.md` (57 lines, INV-01…INV-38 consecutive)
  and `docs/rebuild/16-PINTAR-ENGINEERING-AND-VERIFICATION-SYSTEM.md`.

  The five invariants this phase implements from the phase prompt — INV-24, 26,
  27, 28, 31 — were checked against the now-authoritative doc 03 text after
  import and match what was built. Two consequences follow and are **not**
  closed here: INV-24's second test clause (*"attempt to configure overlap on a
  LEARNING_CYCLE definition; assert rejection"*) is unbuilt, and INV-35's own
  "How tested" column **is** doc 16 §4's adversarial fixtures — so INV-35 has no
  test until those exist. `F03-S03` covers §4's assistance-context case and
  `F02-T22` its hint case; the four MCQ banks and the eligibility-probe set are
  outstanding. Recorded for FABLE-04.

## Closeout

**Integration.** `claude/quirky-meitner-a04smj` was fast-forwarded into `main`
under the repository's linear-trunk workflow (doc 01, Lessons 4 and 12). No
merge commit was created and `git log --merges` is still empty, so every
FABLE-03 commit is preserved in place. Canonical `main` is
`30b2d113a3ba1b5ed6185f1f52ef9383686a0eb2`, carrying 34 migrations.

**Verification.** CI run 27 on `main`
(https://github.com/yazidmanan2409/pintar40/actions/runs/34723321671), event
`push`, all eight jobs green: `check`, `migrations-clean`,
`migrations-upgrade-path`, the four `red-case` legs and `selftest`. The
selftest summary reads `72 passed, 0 failed, 0 skipped, 0 contract problem(s)`
— no acceptance id is skipped in strict CI, and the upgrade-path job replayed a
real base rather than short-circuiting.

**Hosted development synchronization.** Migrations 0030–0034 were applied to
the hosted development project through the management channel, in canonical
order, each one's recorded text verified byte-for-byte against its repository
file after apply:

| Migration | Recorded md5 |
|---|---|
| `learning_cycle_delivery` | `38d39cb47742834b21ff7d20de029063` |
| `learning_cycle_scoring` | `c4c119fbe365abf8a401738f72f62649` |
| `mcq_quality_severity_cast` | `c94290160d43d09d1c15f7877ecc4b8d` |
| `lesson_progress_and_assistance` | `ff2fc2051cc19652eedb8fc39c8e2994` |
| `cycle_state` | `33b1ea1e65a211c2cb14b0c3b0a39809` |

The hosted history now holds 34 migrations whose names and order hash
identically to the repository's migration directory
(`8fba36ea9a4781950d7b0a6c8356aaa5`). Correspondence was then checked against
the schema itself rather than against the history alone: a clean local replay
of all 34 migrations and the hosted database produce the same object inventory
in every category — 57 tables (with their RLS flags), 9 views, 566 columns, 117
enum labels, 130 functions (with `SECURITY DEFINER`, volatility and pinned
`search_path`), 106 policies (with roles, `USING` and `WITH CHECK`), 78
triggers, and every `anon`/`authenticated` table and function grant — 1239
lines, digest `4af4ccbe95175602a8236f7127ab8cd5` on both sides.

Thirteen of the twenty-nine FABLE-01/02 migrations still carry recorded text
that differs from their repository file, from the path by which they were first
applied. They are left exactly as they are: an applied migration is never
edited, and the inventory above is the demonstration that the divergence is in
the recorded text and not in the schema it produced.

**Schema correspondence is not behavioural evidence.** "Hosted development
corresponds to canonical `main`" above is a statement about *structure* and
about nothing else. Hosted carries 2 institutions, 0 courses, 0 assessment
sessions and 0 results: neither content seed has ever run there, deliberately,
because fixtures belong in CI rather than in a shared development project.
Every behavioural claim about the learner cycle therefore rests on CI's local
stack, not on hosted. The cycle has never run on hosted and this record does not
claim it has.

FABLE-04 is not started. The roadmap's §4 decision — that no `OFFICIAL`
evidence is possible while every institution is synthetic — is still open, and
nothing here anticipates it.

## Review findings closed after the phase (Claude 1, 2026-09-13)

An external review re-measured every checkable claim against the live project.
All nine inventory categories reconciled, the engine functions are one each,
telemetry is write-only, `assessment_mode` is unchanged and the §4 wall is
untouched. Eighteen findings; what was closed here, and what was not.

**Closed in migration 0035 and this document:**

| Finding | What was wrong | Closed by |
|---|---|---|
| `function_search_path_mutable` regressed 0 → 16 | Twelve of the sixteen are directly `EXECUTE`-able by `authenticated`, so the closeout's *"reached only from inside definer functions that pin it"* was **not true of those twelve**. Worse, `platform_schema_lint`'s counter is `secdef_without_search_path` — SECURITY DEFINER only — so the gate could not see the regression at all | 0035 pins every function in `public` by catalogue loop, adds the `functions_without_search_path` counter over *all* functions, and `F01-T13` asserts it |
| `seeded_index` reachable by `authenticated` | ADR-0005 §3's control is that `option_display_order()` is unreachable, which held — but the primitive underneath it did not, so the shuffle rested on `shuffle_seed` being ungrantable elsewhere rather than on the primitive being unreachable | 0035 revokes it from client roles; the verification block asserts both |
| INV-08's forged-`person_id` clause was argued, not tested | True by construction — the entry points take no person parameter — but a later signature change would have retired it silently | 0035 adds `assert_engine_takes_no_identity()` over 27 entry points, with a planted probe proving it bites; `F03-T10` re-runs it every build |
| doc 03 / doc 16 "gap" | Accurate about this repository's copies, not about the baseline | Both imported; see Carried forward above |
| ADR-0005 section list | The closeout and the test report summarised ADR-0005 as two *different* sets of five decisions, neither matching its actual eight sections | Corrected in both; the real list is §1 engine location · §2 mode mapping · §3 display position · §4 INV-11 narrowing · §5 first view as delivery evidence · §6 own tenant · §7 the two repairs · §8 deliberately not built |
| Hosted correspondence read as behavioural | — | The paragraph above |
| The drift proof did not hash the objects most likely to have drifted | Nine categories covered function *metadata*, not bodies, and covered no constraint or index at all — and INV-28's idempotency is arbitrated by a unique index | `docs/audit/schema-inventory.sql`, widened and re-run on both sides; **it found something** — see below |

### The widened drift proof, and what it found

The original nine categories were re-run with function bodies (`md5(prosrc)`),
every constraint definition, every index definition, column defaults,
`FORCE ROW LEVEL SECURITY` and view/trigger definition hashes added — 1801
lines against the original 1239. Run on hosted and on a genuinely clean
34-migration replay:

| Category | Hosted | Clean replay | |
|---|---|---|---|
| TABLE (incl. FORCE RLS) | 57 · `8dd451d7…` | 57 · `8dd451d7…` | match |
| VIEW (incl. definition hash) | 9 · `ec4ae0a4…` | 9 · `ec4ae0a4…` | match |
| COLUMN (incl. defaults) | 566 · `54d0b086…` | 566 · `54d0b086…` | match |
| ENUM | 117 · `ac41b7e5…` | 117 · `ac41b7e5…` | match |
| **CONSTRAINT** | 317 · `65787cf6…` | 317 · `65787cf6…` | **match** |
| **INDEX** | 115 · `4c334ae5…` | 115 · `4c334ae5…` | **match** |
| POLICY | 106 · `58bd7a36…` | 106 · `58bd7a36…` | match |
| TRIGGER (incl. definition hash) | 78 · `e55fba50…` | 78 · `e55fba50…` | match |
| GRANT / FGRANT | 107 / 69 | 107 / 69 | match |
| **FUNC (incl. body)** | 130 · `6469d6ba…` | 130 · `d9b7a17a…` | **DIFFERS** |
| **FUNCNORM** (body, comments and whitespace normalised) | 130 · `d51a0bb0…` | 130 · `d51a0bb0…` | **match** |

So the wider net caught six function bodies that the narrow one could not see:
`enrollments_guard`, `memberships_guard`, `role_assignments_guard`,
`transfer_authorize`, `transfer_execute` and `transfer_request` — all six from
the FABLE-01 migrations whose recorded text diverges. Diffed by hand, the
difference is comment lines: hosted's `enrollments_guard`, for example, lacks
the repository's `-- UPDATE: identity columns immutable; only lifecycle
transitions allowed.` and nothing else. Normalising comments and whitespace away
makes all six identical, and the whole-schema `FUNCNORM` digest is
`d51a0bb086ee867ddef889d3f9d75c44` on both sides.

**The conclusion the closeout reached is unchanged — there is no behavioural
drift — but it was previously an inference and is now a measurement.** The
thirteen divergent migration texts are comment-stripped, which is consistent
with the path by which they were first applied. The script keeps both digests
deliberately: `FUNC` differing while `FUNCNORM` matches is cosmetic; `FUNCNORM`
differing is real and must be explained before anything else proceeds.

### Round 2 (2026-09-13) — the review turned on 0035's own work

Claude 1 re-measured 0035 live (131 functions, 0 unpinned; `seeded_index`
revoked from both client roles; no regression) and raised six more. It also
retracted its round-1 correction on doc 03: the gap was real in the file this
repository held.

| Finding | What was wrong | Closed by |
|---|---|---|
| The new assertion hardcoded what 0035 refused to hardcode | `assert_engine_takes_no_identity()` was built on a 27-name array. A FABLE-04 entry point simply is not in it, so the check passes while the twenty-eighth goes unexamined — 0035's own reasoning applied inconsistently inside 0035 | 0036 replaces the array with `client_rpc_registry` and asserts the **property**: every client-executable SECDEF function must carry an exposure class, every row must name a live function, every LEARNER row must take no identity argument |
| The identity vocabulary was an instance list too | It missed `enrollment`, and `open_assessment_session(p_enrollment, …)` is exactly the shape the assertion exists to catch | Vocabulary widened to `person, institution, enrollment, learner, user, actor, account, evidence_class, mastery, score, grade, mark`, and a second planted probe uses `p_enrollment` |
| The assertion is a tripwire, not the INV-08 proof | A green result could be read later as "INV-08 is proven" | Said in the assertion's own detail line and in the `F03-T10` manifest entry: ownership is enforced by `session_is_mine` and the definer bodies, which the behavioural half exercises |
| INV-20 was strengthened and the boundary predates that text | Amended INV-20 requires consumers to hold **no direct grant on raw evidence**. Satisfied vacuously — no consumer exists — while `service_role` holds full grants on all six raw evidence tables | `assert_evidence_consumer_boundary()` + lint counter + `F02-T17`. It reports its own vacuity rather than presenting a green as proof. **The consumer-role decision stays open** — see below |
| doc 03's truncation reaches further than FABLE-03 | Only this phase's five invariants had been re-checked | `docs/audit/INV-REPASS-AMENDED-DOC-03.md` — all of INV-23…38 plus amended INV-05/20 against a clean 36-migration replay. No contradiction found |
| `FORCE ROW LEVEL SECURITY` is 0 everywhere, unexplained | An unexplained zero in a security digest invites a future reader to "fix" it | Explained in `docs/audit/schema-inventory.sql`: the engine runs as the schema owner inside definer functions, so forcing RLS on the owner would break assembly; owner-proof protections are carried by triggers |

### And a defect neither review found

Classifying all 54 client-reachable RPCs surfaced one that no name list would
ever have contained, because it is not a learner entry point:
**`excluded_items_for_post_test(p_person, p_learning_assignment)` was granted to
`authenticated`**, is `SECURITY DEFINER`, and has no ownership check in its body.
Any signed-in learner could pass another learner's person id and read back which
items that learner was shown in their pre-test. Reproduced against seeded data:
learner A queried learner B and received **7 rows**. It is called only from
inside `drawable_items_for_definition` and `assemble_session`, both
`SECURITY DEFINER` and both server-side, so the grant bought nothing. Revoked in
0036, with the revocation asserted. INV-13.

That is the argument for deriving the set from a property rather than listing
it, made by the exercise itself.

**Not closed, and why.** Four need a decision that is not an implementer's to
make, and are listed for the architect rather than quietly resolved: the §4
OFFICIAL-evidence wall; OD-9's evidence-portability clause (§5.3 — this phase
added five `INSTITUTION_SCOPED` rows and settling it by default is exactly what
should not happen one phase before certificates); the §5.2 scoring-policy
registry (`scoring_policy_version()` returns a bare literal with no registry
behind it, and doc 16 §5 names unversioned scoring as a dangerous pattern); and
whether `published_lessons` — a `SECURITY DEFINER` view, no institution
predicate, every tenant's lesson bodies world-readable once any release
publishes — is the intended product behaviour; and, added in round 2, **which
role FABLE-06's analytics runs as**. The amended INV-20 forbids a consumer from
holding direct grants on raw evidence; `service_role` holds full grants on all
six tables, so running analytics as `service_role` violates it by construction.
The shape the text implies is a distinct grant-poor role reading the `official_*`
views and nothing else. A migration now, a redesign in FABLE-06. A further finding belongs to
FABLE-05 rather than here: because `content_is_sealed` freezes taught content
for a course once *any* release is FROZEN or later, **a course can never be
revised after its first release**, and that is where an author will first hit
it.

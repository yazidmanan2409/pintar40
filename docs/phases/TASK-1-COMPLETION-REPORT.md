# Task 1 — Quick Assessment over authorized canonical content · completion report

**ADR:** ADR-0018 · **Baseline:** canonical `main` at migration 0060, FABLE-05
verified PASS · **Sequencing:** Task 1 of two; Task 2 (Human Evaluation Persona
Switching) is not started and must not begin until this gate is closed.

---

## 1. State

| | |
|---|---|
| Branch commit | `3f8e310` on `claude/quirky-meitner-a04smj` |
| Migrations | **63** (0061, 0062, 0063 added; nothing before 0060 touched) |
| CI | run **34747284030** on `3f8e310` — all twelve jobs green, including the new `red case · db-task1-gates` leg |
| Selftest (verbatim) | `123 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN` |
| Clean replay | 62 migrations from an empty database, terminal blocks included |
| Upgrade path | 0061–0062 applied over a seeded 60-migration database |
| Widened digest | **2177 objects**, `ZZ_TOTAL 4d78f50a9cf9b3c959d55a0d02e3dbfe` — **identical** on the clean replay and the upgrade path |
| Hosted | 62 migrations, both new files byte-identical, 2177 objects, FUNC divergence unchanged (see §1.1) |

Parity hashes (`md5` of the file with the trailing newline stripped, which is
what the hosted `statements` array hashes to):

| File | md5 |
|---|---|
| `20260916100000_ad_hoc_eligibility_follows_authorization.sql` | `0371d301af83663edf2f1818cc71edcc` |
| `20260916110000_quick_assessment_over_canonical.sql` | `8d7d80d621fdca4849112c7f426b031f` |

Both hashes were read back from `supabase_migrations.schema_migrations` on the
hosted project after applying and matched exactly.

## 1.1 Hosted, measured rather than assumed

The hosted project carries **62** migrations. Both terminal verification blocks
**ran there** — the behavioural halves build a school, an actor, canonical
content, a release and a grant inside a rolled-back subtransaction, and hosted
left **zero** probe rows behind (`institutions` matching `probe%` = 0).

The widened digest reports **2177 objects on hosted, the same count as a clean
local replay**, and every category digest is identical except one:

| Category | n | local | hosted |
|---|---|---|---|
| COLUMN / CONSTRAINT / ENUM / FGRANT / GRANT / INDEX / POLICY / TABLE / TRIGGER / VIEW | — | — | **identical** |
| FUNCNORM | 183 | `3f36680d…` | `3f36680d…` **identical** |
| FUNC | 183 | `62c1e083…` | `dfdb9403…` **differs** |
| ZZ_TOTAL | 2177 | `4d78f50a…` | `cdccc5f7…` |

**FUNC differing while FUNCNORM matches is the cosmetic-divergence signature the
digest file documents**: comments and whitespace differ, nothing executable
does. This is the pre-existing FABLE-01 condition, and it was checked rather
than assumed to be unchanged:

- the FUNC digest computed **excluding** the six known-divergent FABLE-01
  functions (`enrollments_guard`, `memberships_guard`, `role_assignments_guard`,
  `transfer_authorize`, `transfer_execute`, `transfer_request`) is **177 objects,
  `5cbaba01ed9ed364b62b41701e0c79c6`, identical on both sides** — so the
  divergence did not grow;
- all six functions this task touched match hosted **byte for byte**:
  `authorized_canonical_items` `92cbd358…`, `enforce_ad_hoc_single_owner`
  `bbbf6145…`, `eligible_items_for_definition` `7cfdcad9…`, `assemble_session`
  `e035f84b…`, `launch_quick_assessment` `5a5a5b6e…`, `start_learning_session`
  `bc516dae…`.

Hosted counters, read through `platform_schema_lint()` as a system admin: every
counter in §7 holds, with `migrations_applied` 62. `non_synthetic_institutions`
is 1 and `official_bootstrap_tenants` 0 on hosted, which is the FABLE-05
recorded state — hosted carries no D1 bootstrap tenant — and is unchanged by
this task.

---

## 2. §4's dependencies, re-measured before any code was written

All five statements in the task prompt hold at 0060, measured against a live
database rather than read from the migration files:

| Stated | Measured |
|---|---|
| `eligible_items_for_definition` filters `i.institution_id = d.institution_id` | true |
| `launch_quick_assessment` refuses *"that module belongs to another institution (INV-13)"* | true |
| `assessment_definitions.is_ad_hoc` exists | `boolean not null default false` |
| `release_is_distributed_to` and `caller_may_read_distributed_release` exist | both |
| `enforce_session_provenance` already admits a canonical release under an active grant | true — it reads the predicate |

**Nothing disagreed.** Four facts the prompt did not state were found by the same
measurement and changed the design:

1. `eligible_items_for_definition` is SECURITY **INVOKER**, and 0020's terminal
   block refuses it as DEFINER by name.
2. `items_select` is `can_in_institution('CAN_DRAFT', institution_id)`, so
   canonical rows are **invisible** to a consuming school's caller — a relaxed
   `WHERE` clause alone would have been vacuous on the direct call path.
3. `release_is_distributed_to` and `caller_may_read_distributed_release` are
   **revoked from `authenticated`**, so an INVOKER function cannot call them on
   behalf of a client.
4. The live `eligible_items_for_definition` carries a pinned `search_path` that
   0020's file does not — see defect **M1**.

---

## 3. What was built

### 0061 — eligibility, and the boundary

- **`authorized_canonical_items()`** — a named SECURITY DEFINER accessor
  returning the item identity (id, lesson, module, course, parallel group, bank
  tier, owner) of canonical content the **caller's own** institutions hold an
  active distribution for. Two named predicates and no restatement:
  `release_is_distributed_to` for the authorization and
  `is_member_of_institution` for the caller's relationship. It carries **no**
  eligibility logic — tier, scope, cooling and exclusion all stay in the one
  engine (INV-26). Registered `LEARNER`, revoked from `anon`.
- **`enforce_ad_hoc_single_owner(definition)`** — ADR-0018's boundary. Internal:
  revoked from `anon` and `authenticated`; returns immediately for every
  non-ad-hoc definition.
- **`eligible_items_for_definition`** — branch (a), the own-institution rule, is
  reproduced character for character; branch (b) is new, gated on `d.is_ad_hoc`,
  and additionally excludes the definition's own institution so it can neither
  add nor duplicate a row for a non-ad-hoc definition.
- **`assemble_session`** — one gated guard call, so a two-owner paper built past
  the launcher is refused at the draw.

### 0062 — the launch and the learner path

- **`launch_quick_assessment`** — the module's owner is now a separate variable
  that is **tested, never copied** (defect **D1**); the flat same-institution
  refusal becomes "this school's module, **or** a module whose course carries a
  release actively distributed to this school and readable by this caller",
  keeping the existing INV-13 sentence for the unauthorized case; the
  single-owner boundary is checked at creation, before the assignment exists.
- **`start_learning_session`** — one branch for an **ad-hoc** assignment naming
  no learning assignment (gap **D2**), resolving the release from the content
  the definition is bound to, through the existing opener, assembler and
  provenance guard.

### Surface

`/studio/kuis` — one action: class, chapter, count, minutes. The chapter list is
the union of the school's own modules and the authorized library modules read
through `distributed_releases()` and `distributed_release_outline()`. The copy
names no tenant kind and no distribution status; a launched quick assessment
whose material is no longer available keeps its row and says so in a sentence a
teacher can act on.

---

## 4. Every defect found, and the regression that now holds it

### Pre-existing, found by building

**D1 — `launch_quick_assessment` rebranded the definition's tenant.** It read
the class's institution into `v_inst` and then overwrote it with the module's
course's institution. For institution-owned content the two are identical, which
is why it survived FABLE-04. The moment eligibility follows authorization, the
ad-hoc definition, the assessment assignment and the audit row would all have
carried the **canonical** tenant's id for a quick assessment a school launched
for its own class — the same failure 0059 repaired one layer down.

It **failed closed** rather than silently: 0059's assignment guard refuses a
foreign-owned definition when no learning assignment carries a grant, and a
quick assessment carries none. No database holds a wrong row.

*Regression:* QAC-T02 asserts the definition, the assignment and the audit row
are the school's; 0062's terminal block asserts the same end to end and
structurally refuses the string `into v_course, v_inst`.

**D2 — a quick assessment could not be taken.** `start_learning_session` refused
any assignment naming no learning assignment, and a quick assessment names none
by construction, so since FABLE-04 one could be launched and never answered —
canonical or not. This was a deliberate phase boundary rather than a defect, but
ADR-0018's acceptance requires a learner to complete one, so it is closed here
for ad-hoc assignments only.

*Regression:* QAC-T02 runs a learner through to a scored result; 0062's terminal
block runs the same journey inside a rolled-back subtransaction.

### Mine, found by a second reading after I called the gate closed

**F1 — an ad-hoc session could cite an UNSEALED release. Gate blocker.**
Raised by Claude 1 reading the live hosted schema, against a completion report
they treated as a set of claims rather than evidence. They were right, and the
claim they falsified was mine.

0062's ad-hoc release resolution carried no status filter. A school authoring
its own course holds a release row at `INGESTED` long before publishing
anything, and that row satisfied the own-institution arm — so a quick assessment
over the school's own unfinished chapter opened a session citing an unsealed
release. Doc 07 and doc 08 both rest the "frozen, unambiguous answer to what did
this learner see" guarantee on that binding, and against an unsealed release it
pins nothing: `enforce_taught_content_immutable` only fires when the course is
sealed.

I reproduced it before repairing it, and then reproduced the harm: a session
opened over an unsealed own course, and the **stem of an item the learner had
just answered was updated successfully afterwards**. The evidence was
OFFICIAL-eligible and would have reached results, and in FABLE-06 item
statistics computed over items that can still change.

Two things about how this got past me are worth stating plainly rather than
softening. First, the third caveat in the first version of this report asserted
the opposite — "the learner is refused in plain language" — as a verified fact.
It was a general claim inferred from one special case (a course with no release
row at all) and **it was never tested**. Second, the path was new in 0062 and I
wrote both the code and its tests; the suite exercised only canonical content,
where `grant_release_distribution` happens to guarantee PUBLISHED, so the
own-content arm had no coverage at all.

*Regression:* **QAC-T11** walks one own-content course through three states —
`INGESTED`, `FROZEN`, `PUBLISHED` — with the same assignment over the same pool,
so the release's status is the only variable. The first two refuse the learner by
name and leave no session row; the third runs to a scored attempt whose presented
items are then sealed against edits. 0063's terminal block builds the same case
in a rolled-back subtransaction. A third CI plant removes the `PUBLISHED` clause
from the live function text and requires QAC-T11 to go red naming it.

*Repair:* `r.status = 'PUBLISHED'` on the whole predicate, so the rule is stated
once and covers both arms. It narrows; nothing in the canonical path changes.

### Mine, found and fixed while building

**M1 — I dropped a pinned `search_path`.** My `create or replace` of
`eligible_items_for_definition` was spliced from 0020's *file*, and the *live*
function carries a `SET search_path` that a later migration added.
`functions_without_search_path` went 0 → 1 and **F05-T21 named it**. This is
0049's lesson — splice from what is running, never from what was written —
learned a second time.
*Regression:* 0061's terminal block now asserts the pinned `search_path`
survives the rewrite.

**M2 — the first accessor gate was the wrong question.** It used FABLE-05's
staff read predicate `caller_may_read_distributed_release`, and a paper is drawn
by `assemble_session` running as the **learner**, who holds no capability
anywhere: the learner's pool came back empty. Widening that predicate to admit
learners would have made a canonical lesson body learner-previewable, which is a
much larger decision, so the gate became `is_member_of_institution` instead.
*Found by the migration's own end-to-end probe, not by reading.*
*Regression:* QAC-T02's learner completion, and 0062's terminal block.

**M3 — the first accessor took a caller-supplied institution.**
`assert_engine_takes_no_identity` refused it (F03-T10, F04-T14) because a
LEARNER entry point must not accept an identity argument. The assertion was
right. The institution is now derived from the caller's own memberships, so
there is no id to substitute — a stronger control than checking one.
*Regression:* 0061's terminal block asserts `pronargs = 0`; QAC-T05 asserts it
too, and compares School C's empty answer with School B's non-empty one on the
same grant.

**M4 — a test that reported writes that never happened.** QAC-T06's first draft
read `FOUND` after `EXECUTE`. `EXECUTE` does not set `FOUND`, so it reported
whatever the previous statement left behind — six canonical writes that had all
been correctly refused. Replaced with `GET DIAGNOSTICS ... ROW_COUNT`. A test
that lies in the failing direction is still a test that lies.

---

## 5. Every decision, and whether it is a decision or a reading

| Decision | Basis |
|---|---|
| Eligibility for an ad-hoc definition follows authorization, gated on `is_ad_hoc` | **ADR-0018**, decided before implementation |
| One content owner per ad-hoc paper, enforced at creation **and** at draw | **ADR-0018**; the second call site is mine, so a paper built past the launcher is refused too |
| The canonical branch reads a named SECURITY DEFINER accessor rather than a widened policy or a DEFINER eligibility function | a **reading** of ADR-0015 §0056's stated reasoning ("the policies are left exactly as they are, and reading distributed canonical content goes through named SECURITY DEFINER accessors instead"), applied to a case it did not name |
| The accessor's caller gate is `is_member_of_institution`, not `caller_may_read_distributed_release` | mine, forced by M2. Recorded in ADR-0018's implementation note |
| The accessor takes no argument | forced by `assert_engine_takes_no_identity`; see M3 |
| Exposure class `LEARNER` | mine: a learner reaches it through `assemble_session`. Registered with a note saying so |
| The learner path opens for ad-hoc assignments | mine, caused by ADR-0018's required positive test; narrow, gated, and through the existing engine |
| The release an ad-hoc session cites is resolved from the bound content, preferring the school's own | mine. Where neither an own release nor an authorized one exists the learner is refused in plain language, which is what the state honestly is |

---

## 6. Narrowed or argued rather than tested — visible in the manifest

**The two-owner ad-hoc paper is not reachable through any authorized path.**
Building one needs an item owned by the school inside a lesson owned by the
canonical tenant, and `enforce_taught_content_immutable` refuses that write for
as long as the canonical course is sealed — which a published release makes it.
So the guard behind that refusal would never fire in normal operation, and an
unfired guard is an unproven one.

QAC-T08 therefore has two halves, and the manifest says so: the authorized path
is shown to refuse the construction, and then the condition is **forced** past
that first line by the harness — an unsealed canonical course, a distribution
row written directly rather than granted — so the guard itself is made to refuse
by name. The second half is a harness-built state, not a reachable one. That is
argued, not tested, and it is the honest description.

**QAC-S01 asserts the surface's copy discipline by pattern**, over the HLE
strings the page renders — not by rendering the page and reading it. A phrase
that leaks an internal concept without matching the pattern would pass.

---

## 7. Counters, before and after

Every counter in `platform_schema_lint()` is **identical** at 60 and at 62
migrations, with one deliberate movement:

| Counter | 0060 | 0062 |
|---|---|---|
| `migrations_applied` | 60 | **62** |
| `functions_executable_by_anon` | 0 | 0 |
| `anon_public_surface` | 2 | 2 |
| `anon_reachable_http_paths` | 2 | 2 |
| `unclassified_client_rpcs` | 0 | 0 |
| `undeclared_anon_functions` | 0 | 0 |
| `functions_without_search_path` | 0 | 0 |
| `secdef_without_search_path` | 0 | 0 |
| `tables_without_rls` | 0 | 0 |
| `policies_using_true` | 0 | 0 |
| `platform_canonical_tenants` | 1 | 1 |
| `canonical_tenants_ok` | true | true |
| `official_bootstrap_ok` | true | true |
| `evidence_consumer_boundary_ok` | true | true |

Everything else — `public_buckets`, `malformed_jalur`, `anon_table_grants`,
`overloaded_client_rpcs`, `client_storage_policies`, `declared_public_surfaces`,
`evidence_class_overrides`, `non_synthetic_institutions`,
`official_bootstrap_tenants`, `persons_institution_columns`,
`anon_public_view_write_grants`, `audit_log_client_write_grants`,
`learner_rpcs_guarded_ok`, `mode_policy_complete_ok`,
`integrity_never_scores_ok`, `public_surface_ok` — unchanged.

No table, no policy, no enum was added. Object count moved 2172 → **2177**: two
functions, their two normalized forms, and one function grant.

---

## 8. Red-ability

Two plants, each verified locally to take its named test red **for the named
reason**, then wired into CI as `red case · db-task1-gates`:

| Plant | Effect | Required |
|---|---|---|
| `authorized_canonical_items()` keeps its caller gate and loses `release_is_distributed_to` | eligibility follows *membership* instead of *authorization*; any school reaches any other school's items | **QAC-T04** red with `an ad-hoc paper at School B drew 1 of School C's item(s)` |
| `enforce_ad_hoc_single_owner` replaced by a no-op | the boundary is gone | **QAC-T08** red with `a two-owner ad-hoc paper was not refused at the boundary` |

The leg asserts the suite is green **before** anything is planted, and each
defect is planted inside its own transaction and rolled back, so no plant can
mask or rescue another.

---

## 9. What remains open

- **Arbitrary mixed-owner composition** — canonical and institution-owned items
  in one paper — remains deferred, exactly as ADR-0018 leaves it. Nothing built
  here presumes either answer, and this ADR must not be cited as precedent.
- **OD-4, institution-to-institution content sharing** — remains LATER.
- **A quick assessment over a school's own *unpublished* course cannot be
  taken** — the learner is refused in plain language, and the teacher is told to
  publish the chapter first. This sentence appeared in the first version of this
  report as a verified fact. **It was not true when written**, and it was not
  tested: see **F1** in §4. It is true now, and QAC-T11 is what makes it so.
- **`distributed_lesson_preview` remains staff-only** — learners never preview a
  canonical lesson body. Deliberately unchanged; see M2.
- **The Studio Quick Assessment surface has no automated HTTP exercise beyond
  the anonymous knock** (F05-R01 now covers `/studio/kuis`). Its behaviour with
  a signed-in educator is not driven end to end by a test.

---

## 10. What I verified myself, and what I could not

**Verified myself, locally:**

- both migrations apply on a **clean replay from an empty database** (62
  migrations, terminal blocks included) and on the **upgrade path** over a
  seeded 60-migration database;
- both produce the **identical** widened digest, 2177 objects,
  `4d78f50a9cf9b3c959d55a0d02e3dbfe`;
- the full strict suite green — `123 passed, 0 failed, 0 skipped, 8 justified
  skips accepted (local only), 0 contract problem(s) → GREEN`;
- the Task 1 suite **re-run three times in succession** on the same database,
  green each time;
- every schema-lint counter compared row by row between a 60-migration and a
  62-migration database;
- both red-case plants, each taking its named test red with the exact substring
  CI greps for, and the suite green again after each rollback;
- `npm run lint`, `npm run typecheck` and a production build.

**Could not verify myself:**

- the eight app-layer tests that need the Supabase stack (`F01-R*`, `F04-S05`
  and siblings) are justified local skips; CI runs them strictly and they are
  green there;
- the hosted project's behaviour is verified by migration parity, the object
  digest, the per-function body comparison and the counters — **not** by running
  the acceptance suite against it, because the db suite mutates business data
  and must never be pointed at a hosted project. What *did* execute on hosted is
  both migrations' own verification blocks, including their end-to-end
  behavioural halves;
- the Studio surface was not opened in a browser by a human; its assertions are
  the anonymous knock (F05-R01), the copy-discipline pattern (QAC-S01), the
  build, and the type checker.

**And one I claimed to have verified and had not.** The first version of this
report stated that a quick assessment over a school's own unreleased course
"cannot be taken … the learner is refused in plain language". That was inference
presented as measurement, and it was false — F1. The lesson is narrower than
"test more": every other claim in this report is tied to a named test id or a
digest I can re-run, and that one was tied to nothing. A sentence in a report
that no test can fail is not a finding, it is an opinion.

**Layer-3 is not performed and is not claimed.** ADR-0018 records the two
Layer-3 concerns unchanged from the draft: whether the single-owner boundary is
enforced or merely not-exercised — §6 above is the honest answer to read
critically — and whether the generalized predicate admits anything beyond
canonical-with-grant, which should be attacked rather than read.

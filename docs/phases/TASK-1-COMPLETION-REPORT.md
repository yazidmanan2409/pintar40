# Task 1 — Quick Assessment over authorized canonical content · completion report

**ADR:** ADR-0018 · **Baseline:** canonical `main` at migration 0060, FABLE-05
verified PASS · **Sequencing:** Task 1 of two; Task 2 (Human Evaluation Persona
Switching) is not started and must not begin until this gate is closed.

---

## 1. State

| | |
|---|---|
| Branch commit | `820bf7f` on `claude/quirky-meitner-a04smj`, `main` fast-forwarded to it |
| Migrations | **64** (0061–0064 added; nothing before 0060 touched) |
| CI | run **34754367510** on `9219d8b` — all twelve jobs green, including `red case · db-task1-gates` and the new `baseline-parity` job |
| Selftest (verbatim) | `126 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN` |
| Clean replay | 64 migrations from an empty database, all four terminal blocks included |
| Upgrade path | 0061–0064 applied over a seeded 60-migration database |
| Widened digest | **2177 objects**, `ZZ_TOTAL 636a68106401a362b327a6a59a2fa771` — **identical** on the clean replay and the upgrade path |
| Hosted | **64** migrations, all four new files byte-identical, 2177 objects, FUNC divergence unchanged (see §1.1) |

Parity hashes (`md5` of the file with the trailing newline stripped, which is
what the hosted `statements` array hashes to):

| File | md5 |
|---|---|
| `20260916100000_ad_hoc_eligibility_follows_authorization.sql` | `0371d301af83663edf2f1818cc71edcc` |
| `20260916110000_quick_assessment_over_canonical.sql` | `8d7d80d621fdca4849112c7f426b031f` |
| `20260916120000_quick_assessment_cites_a_published_release.sql` | `1bb13cd6ce06c01a06d0962ac9348031` |
| `20260916130000_supersession_is_not_withdrawal.sql` | `dd0af1d6c49d65d79cea1daf82265b64` |

Every one of these was read back from `supabase_migrations.schema_migrations` on
the hosted project after applying and matched exactly.

## 1.1 Hosted, measured rather than assumed

The hosted project carries **64** migrations. All four terminal verification
blocks **ran there** — the behavioural halves build a school, an actor, canonical
content, a release and a grant inside a rolled-back subtransaction, and hosted
left **zero** probe rows behind (`institutions` matching `probe%` = 0).

The widened digest reports **2177 objects on hosted, the same count as a clean
local replay**, and every category digest is identical except one:

| Category | n | local | hosted |
|---|---|---|---|
| COLUMN / CONSTRAINT / ENUM / FGRANT / GRANT / INDEX / POLICY / TABLE / TRIGGER / VIEW | — | — | **identical** |
| FUNCNORM | 183 | `cddb7f27…` | `cddb7f27…` **identical** |
| FUNC | 183 | `9d1d2e02…` | `fe672974…` **differs** |
| ZZ_TOTAL | 2177 | `636a6810…` | `3e410415…` |

**FUNC differing while FUNCNORM matches is the cosmetic-divergence signature the
digest file documents**: comments and whitespace differ, nothing executable
does. This is the pre-existing FABLE-01 condition, and it was checked rather
than assumed to be unchanged:

- the FUNC digest computed **excluding** the six known-divergent FABLE-01
  functions (`enrollments_guard`, `memberships_guard`, `role_assignments_guard`,
  `transfer_authorize`, `transfer_execute`, `transfer_request`) is **177 objects,
  `da9ad5695e5e4f2325c41ab9155bfc84`, identical on both sides** — so the
  divergence did not grow, and this was recomputed after 0064 rather than
  carried forward from the 63-migration measurement;
- the function 0064 rewrote matches hosted byte for byte:
  `start_learning_session` `eec713c4…` on both sides.

Hosted counters, read through `platform_schema_lint()` as a system admin: every
counter in §7 holds, with `migrations_applied` 64. `non_synthetic_institutions`
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

*Regression:* **QAC-T11** walks one own-content course through four states —
`INGESTED`, `FROZEN`, `PUBLISHED`, `SUPERSEDED` — with the same pool, so the
release's status is the only variable. INGESTED and FROZEN refuse the learner by
name and leave no session row; PUBLISHED runs to a scored attempt whose presented
items are then sealed against edits; SUPERSEDED refuses again. 0063's terminal
block builds the INGESTED case in a rolled-back subtransaction. A third CI plant
removes the `PUBLISHED` clause from the live function text and requires QAC-T11
to go red naming it.

**F1b — my repair for F1 overshot it. Also mine.** Raised by Claude 1's addendum,
and correct.

0063 required the cited release to be `PUBLISHED`, which also refused a release
that had been published and later `SUPERSEDED`. I probed that consequence and
then *kept* it, arguing that superseding is how a correction propagates. The
probe was right; the conclusion was not. Two facts I did not check say so, and I
measured both before accepting the correction:

- **Release status gates new sessions nowhere else in this system.** A learner
  can start a new *learning-cycle* session against a `SUPERSEDED` release today —
  including one withdrawn outright. 0063 made the ad-hoc path stricter than the
  learning-cycle path for identical content.
- **Correction here is never automatic.** ADR-0016 — my own — kept
  `NOT_STARTED_ONLY`, an audit row per move, and "the refusal of any automatic
  move". 0063 produced that move's effect automatically and silently, triggered
  by something the *content owner* did elsewhere.

And the operational cost was real: a consuming school can neither publish
canonical content nor grant itself a successor, so a canonical supersede would
have silently stopped Quick Assessment for every school holding the old grant.

*Repair:* **0064** narrows the rule to `status in ('PUBLISHED','SUPERSEDED')` —
"sealed, and was published", which is exactly what F1 needed and nothing more.
`FROZEN` stays refused: it is the one sealed status that never was published.

*Regression:* QAC-T11 state (d) is inverted — SUPERSEDED now admits, and the
items it presents are still proven immutable, so F1 does not return. **QAC-T12**
adds the pair on canonical content: superseding the release leaves the school
using it; withdrawing the distribution stops it. 0064's terminal block proves the
two refusals that remain (INGESTED and FROZEN). The CI plant is re-aimed at the
new clause.

*The shape of this mistake.* It is the same one as F1 one level up: a product
intuition, held confidently, substituted for a property of the system I had not
checked. F1 was a claim I never tested; F1b was a decision I tested the
*consequence* of but not the *premise*. Probing my own fix was right and found
it; what I did with the finding was not.

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

Every counter in `platform_schema_lint()` is **identical** at 60 and at 63
migrations, with one deliberate movement — verified on the clean replay and
re-verified on hosted:

| Counter | 0060 | 0063 |
|---|---|---|
| `migrations_applied` | 60 | **63** |
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

No table, no policy, no enum was added. Object count moved 2172 → **2177** at
0062 — two functions, their two normalized forms, and one function grant — and
0063 added no object at all: it replaces one function body and one comment.

---

## 8. Red-ability

Three plants, each verified locally against the clean 63-migration replay to
take its named test red **for the named reason**, then wired into CI as
`red case · db-task1-gates`. The third was additionally extracted back out of the
workflow file and diffed, so what CI writes is byte-identical to what was
verified:

| Plant | Effect | Required |
|---|---|---|
| `authorized_canonical_items()` keeps its caller gate and loses `release_is_distributed_to` | eligibility follows *membership* instead of *authorization*; any school reaches any other school's items | **QAC-T04** red with `an ad-hoc paper at School B drew 1 of School C's item(s)` |
| `enforce_ad_hoc_single_owner` replaced by a no-op | the boundary is gone | **QAC-T08** red with `a two-owner ad-hoc paper was not refused at the boundary` |
| the `r.status = 'PUBLISHED'` clause stripped from the live `start_learning_session` text | F1 restored | **QAC-T11** red with `a learner sat a quick assessment against an INGESTED release` |

The leg asserts the suite is green **before** anything is planted, and each
defect is planted inside its own transaction and rolled back, so no plant can
mask or rescue another.

---

## 8.1 A supply gap that is now load-bearing — and my own citation inside it

Found while checking a review citation, and worth more than the round it cost.
The first version of this section reasoned about the divergence from the one
signal I could see — how many documents carried an amendment marker. That signal
was wrong, and the measurement below is what replaced it.

### 8.1.1 The measured inventory

Before overwriting anything, I digested the repository's working tree against
`BASELINE-MANIFEST.json` — the manifest supplied with the reconciliation
payload. **Overwriting first would have destroyed the only evidence of what
actually diverged**, and that evidence turned out to contradict my own account.

First, the payload was checked against its own manifest: **25 of 25 files match**
the sha256 recorded for them, 0 problems. A manifest that does not describe its
own payload cannot be used to judge anything else.

Then the repository, file by file:

| classification | count |
|---|---|
| IDENTICAL to the baseline | **1** |
| STALE — present but different bytes | **16** |
| MISSING FROM REPO | **8** |
| UNLISTED — in `docs/rebuild/` but not in the manifest | **0** |

The one identical document is doc 16. The eight missing are the freeze record
(`00-ARCHITECTURE-BASELINE-FREEZE-RECORD.md`) and all seven FABLE prompts, which
had never been in this repository at all. Everything else — docs 01 through 15
and `REBUILD-READINESS-REPORT.md` — differed.

### 8.1.2 What the measurement corrected

**My earlier account was inferred, and it understated the problem.** I wrote
that the repository "holds a pre-amendment doc 08 while holding an amended doc
03", reasoning from the amendment markers: doc 03 carried the `*Baseline
amendment (2026-09-12)*` marker and the others did not, so doc 03 looked current.

**Doc 03 carried the correct marker and was still stale.** That single fact
settles a question this round had open — whether counting markers is a workable
integrity check — and settles it on evidence rather than preference. A marker is
a claim a document makes about itself; it can be right while the bytes around it
are wrong. Marker-counting was retired for a content digest, and `DOC-S01`, the
static test I had added to pin the marker state, was retired with it. Its
replacement, `DOC-P01`, compares sha256 against the manifest and additionally
fails on a file present in `docs/rebuild/` that the manifest does not list — the
assertion that makes a deletion visible.

**The divergence was not one document, or eight.** It was 24 of 25. A citation
disagreement between the two copies was not an unlucky edge case; it was the
expected outcome of quoting almost any baseline document.

### 8.1.3 The citation, resolved

That is what produced a disagreement that looked like invention on one side.
Claude 1 quoted the amended doc 08; I looked it up in the repository, did not
find it, and recorded that the citation did not check out. Both readings were
honest and of consecutive versions of the same rule. The same applies to the
clause I leaned on hardest — "publication is not assignment" — which I attributed
to doc 08 in migration **0063**, in 0064 and in ADR-0018, then retracted as my own
mis-attribution, and which is in fact a section heading in the amended doc 08.
**Both of my corrections were wrong in the same direction**: each time I treated
the copy I could see as the only copy.

**The error was the method, not the attribution.** I carried a clause from review
into a migration comment and an ADR without opening any copy of the source. 0063
is applied to `main` and hosted and is forward-only; ADR-0018 carries the
correction of record, and 0064 re-grounds the rule in text that is verifiably
here: `content_status_transitions` records the `FROZEN → PUBLISHED` edge as
**"made available to the institution"**. A machine-readable in-repository fact
beats a prose citation and survives any document divergence.

### 8.1.4 This build was a source of the drift

Docs 03, 07 and 08 in this repository had implementation notes appended *inside*
them by earlier phases of this build — notes that do not exist in the frozen
originals. So part of what the digest classified as STALE is drift this build
introduced into documents it was told to treat as frozen. Those notes were
extracted into `docs/implementation-notes/` before the sync rather than deleted
with it; they are real work, they were simply in the wrong file.

### 8.1.4b The repair reproduced the defect, and that is how assertion 6 exists

Syncing the baseline in **created the exact problem the sync was fixing**. The
seven FABLE prompts landed under `fable-prompts/`, and `docs/phases/` already
held copies of all seven — **two of them pre-amendment**, still titled
`PINTAR 3.0` where the governed copy says `PINTAR 4.0`, and one an exact copy
under a different filename. Two copies of each document, no way to tell which
was current, and assertions 1–5 could not see any of it because only one copy
of each pair was governed.

I found this by listing `docs/phases/` for an unrelated reason, which is not a
method. So the check is now mechanical: **assertion 6** matches an ungoverned
file to a governed one by basename *or* by first `#` heading. Neither rule alone
was enough — the two stale copies had kept the filename and changed the title,
and the exact copy had kept the title and changed the filename. Together they
named all seven. The seven duplicates are removed and the one prose reference to
the renamed file now cites the governed path.

**What assertion 6 still cannot see**, stated here rather than discovered later:
a copy that changes both its name and its title. It catches a duplicate that
still looks like what it is, not one disguised.

Assertion 2 was widened in the same pass, for the same reason: it swept only
`docs/rebuild/`, so a stray or deleted file under `fable-prompts/` was
ungoverned. Its directory list is now derived from the manifest's own paths, so
governing a new directory brings the protection with it rather than requiring
someone to remember a constant.

### 8.1.5 What is closed, and what is not

**Closed.** The 25 baseline files are now in the repository byte-identical to the
manifest, and `scripts/baseline-parity.mjs` runs as its own CI job on every push
and pull request, with all six assertions watched to fail before being trusted. Baseline quotations are now mutually verifiable; a
disagreement about frozen text is now answerable by digest rather than by
assertion.

**What this sync was not.** It did not amend the architecture and did not ratify
an amendment. The documents that landed today *are* the approved **2026-09-12
amendment**, decided elsewhere and already authoritative; what had failed was its
**distribution** into the canonical repository. Copying it in is a repair, not a
decision, and nothing here re-dates or re-approves it.

**The decision that was taken.** `docs/rebuild/` in this repository is now the
single source of truth for the baseline, with manifest and parity enforcement
behind it — amendments are made here and flow outward, rather than arriving as
imports to be reconciled afterwards. That is a new governance decision, it is
Yazid's, and it is what **ADR-0019** records. The root cause the earlier draft
called unfixable by CI is fixed by that decision rather than by a check: parity
can only detect the next divergence, so the rule is that there is one place a
divergence may originate.

**One limit on what I am claiming.** The sync was a mechanical copy of a supplied
payload, verified against its own manifest. I did not author the amended content
and have not verified that it is correct — only that it is intact and that the
repository now matches it exactly.

## 9. What remains open

- **Arbitrary mixed-owner composition** — canonical and institution-owned items
  in one paper — remains deferred, exactly as ADR-0018 leaves it. Nothing built
  here presumes either answer, and this ADR must not be cited as precedent.
- **OD-4, institution-to-institution content sharing** — remains LATER.
- **A quick assessment over a school's own *unpublished* course cannot be
  taken** — the learner is refused in plain language. This sentence appeared in
  the first version of this report as a verified fact. **It was not true when
  written**, and it was not tested: see **F1** in §4. It is true now, and
  QAC-T11 is what makes it so.
- **The baseline divergence is closed.** It was measured before the overwrite —
  24 of 25 documents stale or missing, doc 03 stale despite a correct amendment
  marker — then synchronized, pinned by `BASELINE-MANIFEST.json`, and enforced by
  the `baseline-parity` CI job. `docs/rebuild/` is now the single source of truth
  (ADR-0019). See §8.1. What remains is ordinary: the next amendment is authored
  here, not imported.
- **`withdraw_release` sets a release to `SUPERSEDED`, the same status a
  correction produces**, so "replaced" and "withdrawn" are indistinguishable by
  status, and neither stops a new session in either path. Measured, not assumed.
  Left as it is: whether a withdrawn *release* should stop new sessions is a
  platform-wide question for the learning-cycle path too, and belongs in one
  decision with its own ADR — not bolted onto quick assessments. QAC-T12 pins
  today's behaviour so that decision changes a test rather than discovering a
  surprise.
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

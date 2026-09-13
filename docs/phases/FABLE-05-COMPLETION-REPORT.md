# FABLE-05 — Builder completion report

**Phase:** Studio · canonical content distribution · course revision by
copy-forward
**Branch:** `claude/quirky-meitner-a04smj` · **Date:** 2026-09-15

> **Not claimed:** the Layer-3 independent audit. It is an external programme
> gate and neither this builder nor Claude 1 satisfies its independence
> requirement.

---

## 1. State

| | |
|---|---|
| Migrations | 60 (0052–0060 added this phase) |
| Selftest ids | 120 (26 added: F05-T01…T22, F05-S01…S03, F05-R01) |
| Strict selftest | `112 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN` |
| Clean replay | 60 migrations from empty + three seeds |
| Upgrade path | 51-migration base + seeds, then 0052–0060 |
| Widened digest | **identical** across both — 2172 objects, `ZZ_TOTAL 4c80514ee37a014f7b0958679923889e` |

**Canonical `main`:** `9a8546c`, fast-forwarded from the branch, no merge
commit, no rewritten history.

**CI:** run [34743370241](https://github.com/yazidmanan2409/pintar40/actions/runs/34743370241)
on `9a8546c` — **all eleven jobs green**: `check`, `migrations-clean`,
`migrations-upgrade-path`, the seven-leg `red-case` matrix (including the new
`db-fable05-gates`), and the strict `selftest` contract.

**Hosted** (`sknixmwkynzmrgbxzrvb`): 60 migrations, synchronized after the gate.
Every one of the nine new migrations is byte-identical —
`md5(array_to_string(statements,''))` equals the repository file's md5:

| migration | parity |
|---|---|
| 0052 `canonical_tenant_kind` | `a4947353d5a62b308e2a9322d9235da4` |
| 0053 `release_distributions` | `4c76920fe3ef256949104fe05686c4e8` |
| 0054 `course_revision_lineage` | `9f62741de3ba2f93811e04f80a77b898` |
| 0055 `canonical_guard_relaxations` | `9da62653ec6e4d0980d62e6ddc1beaf4` |
| 0056 `canonical_read_path` | `13f8b208a289fd82afef98e4a6447caf` |
| 0057 `studio_governance` | `cd4af156a7a50ea0b600c33b78a35b11` |
| 0058 `studio_surfaces` | `6641879bec6ce595c954f4f521ec7f35` |
| 0059 `assignments_stay_institution_scoped` | `45f8ab5cc85211a761597182b389a179` |
| 0060 `delivery_layer_canonical` | `244a903b8de41c9ca054c643e74a4187` |

**Hosted digest vs the local clean replay:** identical object count (**2172**)
and an identical digest in **every category but FUNC** — TABLE, VIEW, COLUMN,
ENUM, **FUNCNORM (181/181)**, CONSTRAINT, INDEX, POLICY, TRIGGER, GRANT, FGRANT.
The FUNC divergence is exactly the six FABLE-01 functions whose recorded hosted
text was comment-stripped when first applied (`enrollments_guard`,
`memberships_guard`, `role_assignments_guard`, `transfer_authorize`,
`transfer_execute`, `transfer_request`), enumerated and confirmed function by
function. **Every FABLE-05 function body is byte-identical on both sides** —
all thirty-one of them, checked individually rather than inferred from the
category digest.

---

## 2. §2 re-verification, before any code

The prompt's architectural dependencies were re-measured on
`sknixmwkynzmrgbxzrvb` at migration 0051. Two disagreements, neither blocking:

1. **`platform_schema_lint` returns 29 counters, not 30.** Counted directly
   from the live function body. Immaterial — every counter the prompt names is
   present — but recorded rather than rounded.
2. **`assert_official_evidence_bootstrap` does not read the
   `non_synthetic_institutions` counter.** It computes `count(*) … where not
   is_synthetic` itself. The collision the prompt describes is real either way,
   and the fix is the one the prompt asked for; only the mechanism differed.

Everything else matched: nine `assessment_mode` labels; `rpc_exposure` =
LEARNER/PLATFORM/PUBLIC/STAFF; 36 `record_class_registry` rows; every content
table `institution_id NOT NULL` with `can_in_institution('CAN_DRAFT', …)`; no
lineage column anywhere; `content_is_sealed` true for FROZEN/PUBLISHED/
SUPERSEDED; both guard bodies exactly as quoted, including
`r.course_id = a.course_id`.

**Input gap:** the four `claude/*.md` supporting documents named in the prompt's
header — `CANONICAL-CONTENT-ASSESSMENT.md`,
`ADR-DRAFT-canonical-content-distribution.md`,
`FABLE-05-06-CARRIED-DECISIONS.md`, `INV-TRACEABILITY-MAP.md` — **do not exist
in the repository**. §10.5's two named gaps (INV-22, INV-33's negative case) are
stated in the prompt itself and were actionable without the map; both are closed
(F05-T16, F05-T06). The map's other contents are unknown to this build.

---

## 3. What was built, per stage

### Stage 1 — ownership, distribution, revision (0052–0056)

| Migration | What |
|---|---|
| 0052 | `institutions.tenant_kind`, immutable; the D1 bootstrap assertion **split** rather than widened; the canonical tenant; two new counters and `assert_canonical_tenants()` |
| 0053 | `release_distributions`: append-only, audited, canonical-owned and PUBLISHED only; `grant_release_distribution` / `withdraw_release_distribution`; the one conjunctive predicate `release_is_distributed_to` |
| 0054 | five lineage columns, one generic immutability trigger, `course_lineage_chain`, `create_course_revision` |
| 0055 | the two named guard relaxations, plus the lineage-aware release-move check |
| 0056 | the canonical read path as three named accessors; the FABLE-06 ownership/lineage hook; the `record_class_registry` notes |

### Stage 2–3 — Studio (0057–0058, `src/app/studio/**`)

| Migration | What |
|---|---|
| 0057 | CAN_REVIEW on APPROVED and CAN_PUBLISH on SUPERSEDED; `acknowledge_finding`; `assessment_definition_bounds`; `save_assessment_definition` with INV-29's twelve named fields |
| 0058 | `studio_package_state` (composition, not a second validator), `studio_home`, `record_integrity_review`, `record_question_health_review`, `certificate_templates` + save, `publish_release` / `withdraw_release` |

Twelve routes under `/studio`: home, Content Factory (both paths plus the
confirmation questions Easy Upload asks instead of guessing), review queue,
package detail, the read-only PINTAR library and its release view, sanitized
preview, definition builder, question banks, integrity centre, certificate
templates. No page holds a privileged client; every action is a thin call to a
database path that re-decides the same question.

### Stage 4–5 — acceptance, red-ability, ADRs (0059–0060)

`selftest/db/fable05.sql` (22 ids + F05-DONE, re-runnable), three static tests,
one app test (F05-R01 knocks on all eleven Studio routes anonymously, dynamic
segments included — something a static route inventory cannot do),
the `db-fable05-gates` CI leg with §10.6's five planted defects, ADR-0015/0016/
0017, doc 08 and the doc 03 implementation notes.

---

## 4. Every defect found, and its disposition

### 4.1 Defects in FABLE-01–04, found by building FABLE-05

These are not my own work. Each was found by running a flow, not by reading.

**D1 — `enforce_assignment_status()` stamped an assignment with the CONTENT
OWNER's tenant.** (0059, F05-T05.)
*Root cause:* the trigger read `institution_id` from the assigned artefact —
the release for a learning assignment, the definition for an assessment
assignment — and wrote it onto the row. For institution-owned content the two
are the same value, so the defect was invisible for four phases. For canonical
content it would hand a school's own assignment to the canonical tenant, which
§5.5 forbids by name; in practice the RLS `WITH CHECK` then refused, so a school
could not assign canonical content at all.
*Fix:* the assignment's tenant is its **node's** tenant — the school making the
decision — and the artefact is CHECKED against the distribution predicate rather
than copied. The `CAN_ASSIGN_LEARNING` question is now asked of the assigning
school, not of whoever authored the content.
*Regression:* F05-T05 asserts the assignment's institution is the school's; the
migration proves the new stamp equals the old one over every pre-existing row.

**D2 — `enforce_presented_item_immutable()` refused every canonical item
(INV-01).** (0060, F05-T05.)
*Root cause:* the guard required the item's owner to equal the session's
institution. §5.4 called the session provenance guard "the hard blocker; nothing
else stands between a learner and canonical content" — it is the hard blocker,
but it is not the last one. With the two named relaxations in place, assembling
a paper over canonical content still failed and no learner ever reached a
question.
*Fix:* admit an item whose owner is a canonical tenant **and** whose release is
actively distributed to the session's institution. Conjunctive, and a second
explicit clause refuses a non-canonical foreign owner outright.
*Regression:* F05-T05 runs a full six-answer attempt over canonical content;
F05-T08 proves School B's item is still refused; the migration plants a foreign
item and requires the refusal.

**D3 — `enforce_lesson_progress()` stamped progress with the LESSON author's
tenant.** (0060.)
*Root cause:* identical to D1, in the evidence layer, where it matters more: a
school learner's reading progress would have become the canonical tenant's row.
*Fix:* stamp from the learner's enrolment; check the lesson.
*Regression:* proven equivalent over every existing row; covered behaviourally
by the canonical flow in F05-T05.

**D4 — approval and withdrawal had no capability check.** (0057, F05-T17.)
*Root cause:* `enforce_content_status` enforced reviewer ≠ author on APPROVED
but never asked whether the caller holds `CAN_REVIEW`, and asked nothing at all
on PUBLISHED → SUPERSEDED. An EDUCATOR holds `CAN_DRAFT`, passes the content
UPDATE policy, and could approve a colleague's item by naming that colleague as
reviewer — and could withdraw a published release.
*Fix:* both checks added in the guard every write already passes through. The
recorded reviewer must also be the caller.
*Regression:* F05-T17 and a strengthened F02-T02. Seeds and FABLE-02's suite
updated to approve **as** the Head of Department — an approval is now an act
with an actor.

**D5 — `F05-S02`'s INV-32 provider check could not see a provider-named table.**
(Found by planting one.) `\bopenai\b` does not match `openai_calls`, because `_`
is a word character. Fixed to match without boundaries, as the database's own
INV-32 lint always has. Verified red on the plant, green without it.

### 4.2 Defects in my own FABLE-05 work

**M1 — `create_course_revision`'s "open revision" check asked the wrong
question.** It read the successor COURSE's status (`not in ('PUBLISHED',
'SUPERSEDED')`), but a course row never advances past APPROVED/FROZEN, because
publication belongs to the RELEASE. Every course would have had exactly one
revision, for ever. Now asks `content_is_sealed(successor)`.
**Amended in place** in 0054, on the same standing as 0046's amendment: it had
reached no canonical environment — not `main`, not hosted, not any deployment —
and the amendment is recorded in the file's own header.

**M2 — two red-case plants that could not have failed.** Plant 3 (a revision
copying an empirical value) passed while planted, because the source items carry
no empirical value — nothing has computed one — so "the copy has none" was true
for the wrong reason; it now marks a source item first. Plant 4's regexp matched
nothing at all, so the plant was a no-op; replaced with a literal substring
edit. Both now verified red for the right reason. *A probe that never fails
proves nothing — including mine.*

**M3 — the FABLE-05 suite was not re-runnable.** Grants are append-only, so the
second run found an ACTIVE grant where it expected none. `selftest.f05_reset()`
now **withdraws** rather than deletes (which the trigger correctly refuses) and
clears the suite's own sessions, assignments and revision courses. Verified by
running the suite twice in a row, twice.

---

## 5. Architectural decisions

| Decision | ADR | Reading or fact? |
|---|---|---|
| Canonical ownership via `tenant_kind`, no new content column | 0015 | fact (the alternatives fork existing predicates) |
| D1 assertion **split**, not widened; all three facts separately visible | 0015 §2 | fact, resting on a canonical tenant holding zero enrolments |
| One conjunctive distribution predicate read by every relaxation | 0015 §4 | fact |
| Withdrawal is INV-27, not INV-17 | 0015 §3 | **reading** — the invariants do not name this case; the argument is that a learner mid-attempt is neither party to a supply decision nor at fault |
| Five guards relaxed, not the two the prompt named | 0015 §5 | fact (three were defects) |
| INV-01 "stated correctly, not weakened" | 0015 §5 | **reading** — flagged for the auditor |
| Read path as accessors, not widened policies | 0015 §6 | fact (the brief prefers it) |
| Preview carries no answer key | 0015 §6 | **reading** — the brief says "previewable" and defines preview as the sanitized learner view; I read the two together |
| Correction = new course + chained release | 0016 | decided by Yazid (E1) |
| Revision lands at INGESTED, not "DRAFT" | 0016 | **reading** — flagged; the lifecycle has no DRAFT state |
| "Open revision" = not sealed | 0016 | **reading** — flagged |
| Copies non-ad-hoc definitions as the next *version* | 0016 §2 | **reading** — the brief excludes ad-hoc, implying the rest are copied; the unique key forces a version bump |
| `studio_package_state` composes rather than recomputes | 0017 §2 | fact — the brief says the three are separate underneath |
| INV-29's twelve interpretation-affecting fields, named | 0017 §4 | **reading** — the set is a judgement, recorded so it can be argued with |
| OD-10 held by a check constraint | 0017 §6 | fact |
| `studio.*` / `config.*` declared staff-only in the HLE | 0017 §7 | **reading** — flagged; `t()` still throws, and F05-S03 asserts the other half |

**E2 is named explicitly in ADR-0015**, with both questions, (i) scheduled
before FABLE-06, and the four things this phase did not do that would have made
either harder. `eligible_items_for_definition` is unchanged and its predicate
was copied nowhere.

---

## 6. Narrowed, substituted or argued rather than tested

Each is visible in the manifest or in an ADR, not only here.

1. **Preview excludes the answer key** (§5 above). Not a narrowing of anything
   that existed — a school could read none of it before — but a deliberate
   choice about how far the widening goes. F05-T10 asserts the accessor cannot
   reach `is_correct` or `item_options`.
2. **`publish_readiness` was not extended** to report the lifecycle conditions
   the brief's §5 table lists. Composing them in `studio_package_state` instead
   was chosen because `enforce_release_publish_readiness` consults
   `publish_readiness` at the moment of publication, and changing its status
   computation would have changed *when a release may publish* — a
   behaviour change nobody asked for. Argued, and asserted structurally
   (F05-T19 requires the composition to READ the gate and forbids it from
   counting findings itself).
3. **Question Health has nothing to review**, because FABLE-06 computes nothing.
   `record_question_health_review` is exercised only through its refusal
   (F05-T20). The positive path is unasserted and will be FABLE-06's to cover.
   Stated here rather than implied by a green suite.
4. **Structured Package Import and Easy Upload are exercised through the
   existing RPCs**, not through an end-to-end file upload: the acceptance flow
   in F05-T05 drives a canonical package built by the same lifecycle, and
   F05-S02 proves no client-side storage upload exists. An HTTP-level upload
   test needs the Supabase stack and is one of the eight justified local skips.

---

## 7. The counters (§11)

| Counter | Before | After | |
|---|---|---|---|
| `tables_without_rls` | 0 | 0 | unmoved |
| `policies_using_true` | 0 | 0 | unmoved |
| `secdef_without_search_path` | 0 | 0 | unmoved |
| `functions_without_search_path` | 0 | 0 | unmoved |
| `functions_executable_by_anon` | 0 | 0 | unmoved |
| `anon_table_grants` | 0 | 0 | unmoved |
| `unclassified_client_rpcs` | 0 | 0 | unmoved |
| `undeclared_anon_functions` | 0 | 0 | unmoved |
| `anon_public_surface` | 2 | 2 | unmoved |
| `anon_reachable_http_paths` | 2 | 2 | unmoved |
| `audit_log_client_write_grants` | 0 | 0 | unmoved |
| `public_buckets` | 0 | 0 | unmoved |
| `client_storage_policies` | 0 | 0 | unmoved |
| `evidence_class_overrides` | 0 | 0 | unmoved |
| every `*_ok` | true | true | unmoved |
| **`non_synthetic_institutions`** | 1 | **2** | **deliberate** — the canonical tenant |
| **`platform_canonical_tenants`** | — | **1** | **new** — so the movement above is legible |
| **`canonical_tenants_ok`** | — | **true** | **new** |
| `migrations_applied` | 51 | 60 | |

Re-measured on the hosted project after synchronization: identical, with
`non_synthetic_institutions` reading **1** there rather than 2 — hosted carries
no OFFICIAL bootstrap tenant (`official_bootstrap_tenants` 0), so the canonical
tenant is its only non-synthetic one. `platform_canonical_tenants` reads 1 on
both, which is what makes the difference legible rather than alarming.

Studio adds **no** anonymous surface: it is staff-only throughout, and F05-S01
asserts the anonymous path and prefix lists did not grow.

---

## 8. What is still open

**FABLE-05 gaps**

* Question Health's positive review path is unasserted (§6.3).
* The end-to-end Easy Upload / Structured Import HTTP flow is covered
  structurally and by RPC, not by an upload over the wire (§6.4).

**Carried standing decisions**

* **E2(i)** — ad-hoc or school Quick Assessment over authorized canonical items:
  its own ADR, after FABLE-05 and before FABLE-06. **E2(ii)** — arbitrary
  mixed-owner papers: deferred pending that analysis.
* **OD-4** — institution-to-institution content sharing: LATER, and nothing
  built here makes it expressible.
* **OD-10** — certificate identity presentation: unanswered; held at
  `NAME_ONLY` by a check constraint.
* **FABLE-06 inherits two requirements** from this phase: its aggregation grain
  must distinguish canonical-global from institution-local, and it may aggregate
  across an item lineage only where the metric's own semantics permit it.

**External gates**

* The Layer-3 independent audit. Not required of this phase, and not claimed.

---

## 9. What I verified myself, and what I could not

**Verified myself, locally, end to end:**

* 60-migration clean replay from empty plus all three seeds; the 51-migration
  upgrade path with seeded data; the **identical** widened digest across both
  (2172 objects), so no migration is order-dependent.
* The strict selftest on both databases: `112 passed, 0 failed, 0 skipped`.
* The FABLE-05 suite run twice in succession, twice, to prove re-runnability.
* All five §10.6 planted defects turning the right test red for the *right
  reason* — including two that initially did not, and were fixed rather than
  accepted.
* The phase mini audit: no AI direct publication path, no answer-key exposure in
  Studio, no dummy fallback or TODO, no provider concept in schema DDL, no
  client-side storage upload.
* Build, lint and typecheck clean.
* The clean replay run three times independently and the upgrade path twice,
  every one producing the same 2172-object digest, so no migration is
  order-dependent and the digest is reproducible rather than lucky.
* A three-deep lineage chain (R1 → R2 → R3): `course_lineage_chain` returns all
  three members read from any of them, and R3 carries no empirical value.

**Could not verify locally** — eight justified skips, all requiring network to
`*.supabase.co` or Docker, both denied by this session's egress policy. CI runs
every one of them strictly. They are the same eight as FABLE-04: the HTTP-level
app tests and the route-handler verification test.

**Not verified by me at all:** the Layer-3 independent audit, by design.

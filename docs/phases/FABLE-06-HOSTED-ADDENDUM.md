# FABLE-06 hosted addendum — migrations 0071–0082 applied and verified

Companion to `docs/phases/PINTAR-4.0-STATE-OF-THE-SYSTEM.md`, which was written
while the hosted development project stood **nine migrations behind** the
repository. This document records the sync and what was measured after it. Same
shape as Task 2's hosted addendum: the closure document and the hosted evidence
are separate commits with separate evidence, because they are separate claims.

**No schema, code, test or manifest change.** The nine migrations are the ones
already in the repository and already green on CI's clean stack; nothing was
edited to make them apply.

---

## 1. Byte parity — all nine

Each migration was applied through the management channel and its recorded
`statements` compared against the repository file. The hosted digest is
`md5(array_to_string(statements,''))`; the local digest is the md5 of the file
with its single trailing newline stripped.

```
$ for f in supabase/migrations/202609181*.sql; do
    printf "%s  %s\n" "$(perl -0777 -pe 's/\n\z//' "$f" | md5sum | cut -d' ' -f1)" "$(basename $f)"
  done
```

| migration | digest | hosted |
|---|---|---|
| `metric_catalogue` (0071) | `89d8c253f8067a29d00333e7183c6ada` | identical |
| `metric_evaluator` (0072) | `38132c95db015d7c802fe6be2d88eb70` | identical |
| `reports_and_templates` (0073) | `e1a440e2facc36dd5b862a7b0eb8d87f` | identical |
| `learner_projection_is_declared` (0074) | `c932e2c41a563b1b4cd5a82ed61ac3df` | identical |
| `calculators_pin_their_path` (0075) | `97d32f5ecd201426b104a20c9305580f` | identical |
| `question_health_computation` (0076) | `6220a38159ff1a7f08715c251700a6a9` | identical |
| `question_health_trail` (0077) | `05335d8bb858fe7e4784df49742a3bf9` | identical |
| `health_begins_at_the_beginning` (0078) | `decb3f99c7e580e5f6b8cba41d2a8306` | identical |
| `briefings` (0082) | `ccce30f8ab21d66c8403d7a5add753df` | identical |

**Nine of nine byte-identical.** The hosted migration count is now **79**, equal
to `ls supabase/migrations/*.sql | wc -l`.

**And every one of them ran its own terminal verification block on hosted**, not
only locally. That is what an ADR-0014 block is for: it builds the data it
probes in a rolled-back subtransaction rather than assuming a seeded row, so it
executes identically on a database that carries no synthetic seed. 0071's seven
probes, 0072's five (undeclared source, hidden helper, unparsed body, orphan
calculator, and the evaluator's two non-raising statuses), 0073's watched
failures for arithmetic and calculator bypass, 0074's widening refusal, 0076's
five, 0077's two and 0082's four all ran here. A migration that applied without
its probes passing would have rolled itself back.

---

## 2. The schema digest — twelve of thirteen identical, and the thirteenth bounded by name

The widened digest (`docs/audit/schema-inventory.sql` shape: tables, views,
columns, enums, function identity + body, normalised function body, constraints,
indexes, policies, triggers, table grants, function grants) run on both sides.

| category | n | local | hosted |
|---|---|---|---|
| COLUMN | 771 | `1d92fc7f…` | identical |
| CONSTRAINT | 463 | `75ba062d…` | identical |
| ENUM | 151 | `95fd79bc…` | identical |
| FGRANT | 99 | `05d68c60…` | identical |
| **FUNC** | **229** | `5acda78e…` | **`648f0c4a…` — differs** |
| **FUNCNORM** | **229** | `06977203…` | **identical** |
| GRANT | 130 | `4cb35454…` | identical |
| INDEX | 161 | `71e9d9f3…` | identical |
| POLICY | 125 | `528428ec…` | identical |
| TABLE | 79 | `5bcf9629…` | identical |
| TRIGGER | 105 | `3be44c32…` | identical |
| VIEW | 10 | `5b85f966…` | identical |
| **ZZ_TOTAL** | **2552** | `a8c345d4…` | `1d306f22…` |

Every count matches — **2552 objects on both sides**.

`FUNC` carries the raw `prosrc`; `FUNCNORM` carries the same text with comments
and whitespace normalised away. **FUNC differing while FUNCNORM matches means
the divergence is cosmetic and nothing executable differs.** That is the same
state Task 2's addendum recorded.

### The divergence is bounded BY NAME, not inferred from FUNCNORM

FUNCNORM matching is an argument, not a boundary, so the divergent set was
narrowed by bisection rather than asserted. Per-initial buckets of
`proname|md5(prosrc)` were compared on both sides: **fifteen of nineteen buckets
match exactly, and the four that differ are `e` (55 functions), `m` (15), `r`
(19) and `t` (7)** — with identical counts in every bucket. Drilling into those
four names exactly six functions:

| function | local `md5(prosrc)` | hosted |
|---|---|---|
| `enrollments_guard` | `17007dc8a202cada0dccd6981b240427` | `6f8b8da4dca33f82c906dff8a2a8e73a` |
| `memberships_guard` | `419372d8e0bddc1261ae20d83848528b` | `063baa6d3b8cbfe4e18500ae57a9eb82` |
| `role_assignments_guard` | `1df348429a8a370bbd4cdafaaab2e773` | `ba5e9cff526dd217f3d0c09de303c9cb` |
| `transfer_authorize` | `f272e4bd005f3eeda578cf2d77c40052` | `901da8190720b264a28e192b3eb5ad96` |
| `transfer_execute` | `8dfdb7836b2910e29acb77e34c9250c8` | `ce7dca02325f394f8711b34b112c9818` |
| `transfer_request` | `41816c5727a16615521cb088d07858d9` | `f1301b8812cefe1bae51b778232a50e6` |

**These are exactly the six FABLE-01 functions Task 2's addendum named, and the
same six the 34-migration comparison named before that.** The recorded text of
the thirteen divergent FABLE-01/02 migrations is comment-stripped on hosted;
that is the whole difference.

**FABLE-06 DID NOT WIDEN THE BOUND.** Spot-checked by name on functions this
phase created or replaced — `metric_evaluate` `a3d68c46…`,
`recompute_question_health` `c5f74f6c…`, `review_briefing` `4fcef4f1…`,
`transfer_reject` `444ae93b…` — all byte-identical on both sides, and every
bucket that contains only FABLE-06 functions matches whole.

---

## 3. Counters — every one equal to the local schema at this commit

```
functions 229 · tables 77 · views 10
tables_without_rls 0 · functions_executable_by_anon 0
secdef_without_search_path 0 · functions_without_search_path 0
policies_using_true 0
anon_public_surface 2 · anon_reachable_http_paths 2
```

Before the sync, hosted read **195 functions / 67 tables**. The nine migrations
added 34 functions and 10 tables, which is the local delta exactly.

`functions_without_search_path = 0` is worth naming: that is the counter 0072
moved to 16 and 0075 repaired, and it is **0 on hosted**, so the regression this
phase caught is closed here as well as locally.

## 4. The five FABLE-06 assertions, run on hosted

Not read — executed, on the hosted database:

```
assert_metric_catalogue()                 → true
assert_metric_closure()                   → true
assert_reports_do_not_compute()           → true
assert_question_health_observes_only()    → true
assert_learner_projection_is_closed()     → true
```

Seventeen `assert_*` functions are present (the count F06-P08's floor is set to),
16 calculators, 7 declared metric sources, 16 metric definitions under catalogue
`MC-1`, 4 readiness tiers, 3 question-health thresholds (one wired, two declared
unwired with a reason), 9 declared question-health edges and 6 declared briefing
edges. The client RPC registry carries **86** rows, 41 of them STAFF.

## 5. What hosted does NOT carry, stated rather than implied

```
report_templates 0 · briefings 0 · question_health 0 · metric_catalogue 1 (MC-1)
evaluation_personas 0
```

**Schema, not data.** Hosted carries the FABLE-06 machinery and none of the rows
the local suite produces — no templates, no briefings, no question-health rows.
That is correct: those are fixture artefacts of a test run, and the db suites
**mutate business data**, which is why `SUPABASE_DB_URL` is never pointed at a
hosted project (§7 of the capstone).

The Human Evaluation seed is likewise still absent — `evaluation_personas` 0, as
Task 2's addendum recorded and as re-measured here. The schema is present and
the OFFICIAL purpose slot is free; installing the seed belongs to Stream 4, and
the binding condition on the Human Pilot Release stands unchanged.

---

## 6. What this addendum does and does not close

**Closes:** the last item of the FABLE-06 code gate. The hosted development
project is at the same 79 migrations as the repository, byte-identically, with
every counter equal and every FABLE-06 assertion true on the hosted database.

**Does not close:** anything in the readiness gate. There is still no staging
environment, the deployment drill has not run, and no Layer-3 audit has taken
place. Applying migrations to a development project is not a deployment drill
and is not claimed as one.

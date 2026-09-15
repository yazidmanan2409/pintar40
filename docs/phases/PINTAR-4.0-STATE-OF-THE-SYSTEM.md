# PINTAR 4.0 — state of the system

**Commit:** the FABLE-06 closing commit on `claude/quirky-meitner-a04smj`.
**Written by:** the builder. **Not reviewed.** Two independent reads follow this
document and neither has happened yet: a FABLE-06 gate review, and a Layer-3
audit. **Nothing here is an audit outcome, and no claim in it should be read as
one.**

**The standard this document holds itself to.** Every claim carries one of three
statuses, and the status is about *evidence*, not about confidence:

- **VERIFIED** — a manifest test asserts it, named by id, and that test ran at
  this commit.
- **NOT YET VERIFIED** — the behaviour is believed correct and nothing asserts
  it. Reading the code is not verification.
- **DESIGNED–NOT-IMPLEMENTED** — the shape exists; the behaviour does not.

**Every number below comes from a command run at this commit, and the command is
printed beside it.** That rule exists because three count errors landed in this
phase between builder and reviewer, all from quoting a number instead of
re-taking it. A figure nobody can reproduce from a pasted command is a claim, and
this project's whole method is that claims are not evidence.

**Which numbers a second party confirmed, and which nobody did.** The second-eye
code-gate review measured the **hosted database at 80 migrations** and nothing
else: the migration count, the public surface, the seventeen assertions, the
empirical fields, the declared-edge table, the single evaluator, the sixteen
calculators, the closure and reports-do-not-compute verdicts, the allowlist
CHECK, and the authorization-before-existence and per-edge-audit detail strings.
That reviewer has **no repository, CI or filesystem access**, so everything else
in this document is single-sourced on my own measurement: CI run 73 and its
fifteen jobs, the manifest at v24 and its 171 tests, the red-case legs, the
strict-leg counts, the byte-parity of the ten migration files against their
applied digests, the FUNC/FUNCNORM bucket bisection, and the contents of this
document. **The review confirms the database and nothing else**, and that is a
standing division of labour rather than a gap this phase opened.

**And every load-bearing claim names its falsifier** — the specific assertion
that goes red if the claim stops being true, and the file it lives in. Where no
such assertion exists, the claim says so in the same sentence. A claim with a
named falsifier is worth more than three without one.

---

# 1. What was caught

This section is first on purpose. A closing document that leads with what passed
reads as a summary; the same facts at the front read as a method. What follows is
what this phase got wrong and how it was found — because the recurring lesson of
this build is that **a check nobody has watched fail is a check nobody knows
works**, and every item here is a case where something was believed and was not
so.

### 1.1 The dispatch defect — no metric could ever compute

0072 shipped `metric_evaluate` building its calculator name as
`format('select public.%I($1,$2,$3)', d.calculation_key)` — without the `calc_`
prefix every calculator actually carries. **Not one of the sixteen metrics could
have returned a number.** The migration's own terminal block passed, because all
four of its probes exercised paths that return *before* the dispatch line:
unknown metric, not permitted, no live catalogue, no such version. Four probes,
zero of them reaching the thing the function is for.

It was found the next migration along, when 0073 needed a real number and got an
error. **L9 — coverage by count is not coverage by path** — was written from it.
The repair is in 0073 and the happy path is now exercised by F06-P06 and F06-P09.

*Falsifier:* `F06-P06` (`selftest/db/fable06.sql`) evaluates
`class.participants` over real OFFICIAL evidence and compares the pinned
catalogue version; `F06-P09` requires at least one entry with `status = 'ok'`,
explicitly so that a report which computes nothing for anybody cannot pass.

### 1.2 The counter that moved while the commit said otherwise

A commit in this phase said "security counters unchanged". Eight counters had
been checked. The ninth, `functions_without_search_path`, had gone from **0 to
16** — every calculator 0072 created. The lint was right and the sentence was
wrong.

Two things matter about the repair. It pinned all sixteen search paths (0075)
rather than narrowing the lint to the counter that had been checked; and the
migration that would have shipped the regression **refused itself**, because its
own terminal block asserted the counter it had moved.

*Falsifier:* `docs/audit/launch-readiness.sql` asserts
`functions_without_search_path = 0` against the running system, and every
migration's terminal block re-asserts it at apply time.

### 1.3 The fixture that trespassed on D1 — and 129 tests that failed for it

`f06_withdraw`, a helper written for one probe, left an orphaned evidence
override in D1. `purge_certificates` could not then run, and **129 tests failed
because one test wrote outside its own scope.**

The distinction the repair turned on is worth stating plainly: a fixture's
**write scope** and its **cleanup scope** are not the same set. `f06_purge`
removes what the FABLE-06 fixture creates; it had no reason to know about a row
a probe left in someone else's lifecycle. The answer was for the probe to stop
creating it, not for the purge to grow.

*Falsifier:* `F06-P05` asserts that D1's demonstration learner keeps its class
and its certificate and that its single enrolment remains the below-threshold
case — that is, that the analytics cohort has not touched D1's own journey.

### 1.4 The probe that was safe only because the invariant held

F06-N02 calls every mutating STAFF endpoint a dean is denied. To reach the
authorization check rather than an argument error it passes **real ids**. Each
call is wrapped in a subtransaction that is rolled back.

That rollback is not a tidiness measure. If any endpoint had *accepted* the call,
the probe would have performed a real mutation — inside a test whose entire claim
is that it cannot. **The probe was safe only because the property it was testing
held.** That is L13, and it is the finding from this phase most worth carrying:
a probe whose safety depends on the invariant under test proves nothing on the
day the invariant breaks, which is the only day it matters.

*Falsifier:* the probe now raises and rolls back on the accepting path
explicitly, and the CI leg `db-fable06-gates` plants an endpoint that accepts a
dean and requires F06-N02 to report `ACCEPTED a call from a dean`.

### 1.5 Count errors, on both sides of the review

- *"80 / 81 migrations"* — written twice, read off scratch-database names. There
  were **79** when that was written and there are **80** now that 0083 has
  landed, which is the rule restating itself: a number quoted rather than
  measured is wrong as soon as the thing moves, and the only safe form is the
  command beside the figure.
- *"all seven allowlist rows are identical"* — written from a `limit 1` sitting
  beside a `count(*) = 7`. L11.
- *"the NUMERIC allowlist has four keys"* — it has **three**. Copied from the
  reviewer's message into a migration header **with the correct measurement on
  screen**. L10's companion: a number quoted is not a number measured, and the
  direction it travels does not make it safer.

Each was cheap to correct only because something else measured it. That is the
reason for the rule at the top of this document.

### 1.6 A manifest that claimed a surface and tested a table

F05-S03's `proves` line read *"no Studio copy shows a lifecycle enum, version
string or evidence class"* — a claim about the Studio **surface**. What the test
inspects is the **copy table** in `src/lib/hle.ts`. A page interpolating an enum
passes it, and five pages did.

The completion report had been careful; the machine-readable record was not,
**which is the worse of the two**, because a gate reads the manifest.
F06-S04 now requires every static/app test's `proves` to name the artefact its
predicate inspects.

*Falsifier:* `F06-S04` (`selftest/static.test.ts`), with the CI leg
`static-fable06-gates` rewriting a `proves` string to one that names no artefact
and requiring F06-S04 to reject it.

### 1.7 Five live enum leaks, and one of them was not like the others

F06-S03's first run found five interpolations of a lifecycle enum into a JSX text
position. Four were vocabulary leaks to staff — `PRACTICE`, `TEST`, `EXAM`,
`PRE_TEST`, `POST_TEST`. **The fifth was `VISIBILITY_CHANGE` rendered beside a
named learner.** A bare behavioural token next to a person invites the reader to
treat it as a verdict, which is the thing INV-11 exists to prevent. *"Berpindah
dari layar penilaian"* describes what was observed; `VISIBILITY_CHANGE` reads
like a charge. **The difference between an observation and an accusation was one
HLE key.**

None of those five values is in `INTERNAL_WORDS`, so no word list would have
caught any of them. The rule had to be about **shape and provenance** instead.

### 1.8 `\b` is a backspace character, not a word boundary

A check written to count aggregate calls inside evidence views used `\b` in a
PostgreSQL regular expression. In POSIX ARE `\b` is **backspace**. The check
returned zero for every view and read as a clean result. `\y` is the word
boundary. **L12** — a probe that fails before reaching its subject reports the
subject's behaviour — was written from this and then applied twice more.

### 1.9 The check that was a mirror

F06-S05 asserts that every declared invariant is named by some manifest test. Its
own `proves` string names INV-06, INV-22 and INV-35 — to state what it does *not*
cover — and the first version counted **its own entry** among the citers. An
invariant nobody tested could have been made "covered" by writing its name into
that sentence. Caught while collecting numbers for this document, not by a test.

### 1.10 An invariant tested under the wrong name, and one with no test at all

The §7 traceability sweep asked which of the thirty-eight invariants declared in
doc 03 no manifest `proves` string names. Two came back.

- **INV-06** (timing-safe certificate comparison) was tested all along, inside
  F04-S02, and labelled **INV-05** in both the assertion message and the
  manifest. A gate reading the manifest saw INV-05 twice and INV-06 nowhere.
- **INV-34** (a template selects from the catalogue, it never redefines a
  metric) had **no test at all**, in the phase that built the catalogue.

### 1.11 The wall that was never reached

0073 states that the CHECK constraints on `report_template_metrics` refuse a
formula "so it cannot be stored at all". They never see one. A `BEFORE ROW`
trigger runs before constraint evaluation, so the catalogue guard refuses a
formula first, as an *unknown metric*. The comment was not wrong about the
constraint — it was wrong about which wall is standing. F06-N03 now proves both,
by disabling the guard inside a rolled-back subtransaction and requiring the
constraints to refuse the same two writes themselves.

### 1.12 A state machine that refused three shortcuts, one of them a real defect

The question-health transitions table refused, in order: a jump the *recompute*
tried to make; a jump my *probe* tried to make; and **0076's illegal birth
state** — a row created directly in a state no declared edge produces. The third
is a real defect and was found only because 80 real sessions drove the machine
through data rather than through an argument. **L9a — a state machine cannot be
tested without data.**

### 1.13 A constraint that enforced half of what its header claimed

Found by the **second eye**, not by anything in this build, and it is the only
item in this section a mechanism here did not catch.

0082's provenance guard read

```sql
check (state in ('COLLECTING','GENERATING')
       or (catalogue_version is not null and generated_report_id is not null))
```

while the same file's header says a briefing "records the catalogue version **and
the template version** it used". `template_id` and `template_version` are both
nullable and appear nowhere in the predicate. `advance_briefing` writes all four,
so **no row in this build was ever wrong** — but what was *enforced* was half of
what was *claimed*, and the claim is §3.4's, which exists for a reader who comes
later and cannot ask what the template looked like that day.

**This is §1.6's defect one level over** — a description broader than its
predicate — sitting in a CONSTRAINT rather than in a `proves` string. F06-S04
catches that shape in the manifest and nothing was watching for it in the schema.

0083 widens the predicate to the claim rather than narrowing the claim to the
predicate, and `F06-N04` puts the result where a gate can re-read it: a
migration's terminal block runs once, and a constraint is exactly the kind of
thing a later migration drops in passing. It was watched to fail — planting
0082's original predicate turns F06-N04 red naming `template_id` and
`template_version` — and that plant is now the fourth in `db-fable06-gates`.

**The honest reading:** thirteen items in this section, twelve found inside the
project and one found by a second reader looking at the same database. The
mechanisms are good and they are not sufficient on their own.

### What the pattern is

Every item above is the same shape: something was believed because nothing had
contradicted it. The three techniques that did the contradicting, and that this
build should keep:

1. **Derive the set, never write it.** Applied six times this phase — ADR-0021
   revoke coverage, the route inventory (F06-S02), enum-bearing columns
   (F06-S03), the manifest's own metadata (F06-S04), the dean-denied endpoint set
   (F06-N02), the declared-assertion set (F06-P08), and the invariant list
   (F06-S05). Each replaced a hand-maintained list that was green **because it
   was short**.
2. **Give every derived set a floor.** A derived check has a failure mode a
   written list does not: deleting the thing removes it from the set instead of
   failing inside it. F06-N02 and F06-P08 both carry a measured floor for
   exactly that.
3. **Watch the assertion fail.** Eleven red-case CI legs now plant a real defect
   and require the named check to reject it for the named reason.

---

# 2. The system, measured

Each row is a command and its output at this commit. `$CLEAN` is a database built
by replaying all 80 repository migrations into an empty database and applying the
four seed files in `supabase/config.toml` order.

### The build

```
$ ls supabase/migrations/*.sql | wc -l
80
$ psql "$CLEAN" -Atc "select (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public') || ' functions, ' || (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') || ' tables, ' || (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v') || ' views'"
229 functions, 77 tables, 10 views
$ psql "$CLEAN" -At -F ' | ' -c "select exposure, count(*) from public.client_rpc_registry group by 1 order by 1"
LEARNER | 29
STAFF | 41
PLATFORM | 16
```

### The contract

```
$ npm run selftest:local        # SUPABASE_DB_URL=$CLEAN
163 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN
$ python3 -c "import json;m=json.load(open('selftest/manifest.json'));print('v'+str(m['version']),len(m['tests']),'tests')"
v24 171 tests
$ python3 -c "import json,collections;m=json.load(open('selftest/manifest.json'));print(collections.Counter(t['runner'] for t in m['tests']))"
Counter({'db': 134, 'static': 27, 'app': 10})
$ python3 -c "import yaml;w=yaml.safe_load(open('.github/workflows/ci.yml'));c=w['jobs']['red-case']['strategy']['matrix']['case'];print(len(c),'legs')"
11 legs
$ node scripts/baseline-parity.mjs --no-git
baseline-parity OK — 25 document(s) byte-identical to the frozen baseline
```

The eight justified skips are seven tests that need network to a Supabase stack
(`F01-R02`, `F01-R03`, `F01-R05`, `F01-R06`, `F03-R01`, `F03-R02`, `F04-S05`) and
one whose evidence exists only inside a CI run (`F01-R04`). This session's egress
policy denies `*.supabase.co` and Docker is unavailable. **CI runs all eight
strictly against its local stack, where nothing is skipped** — so the claims in
§3 that rest on `F04-S05` and the app runner are verified by CI, not by the local
run quoted above.

### CI, strict, with nothing skipped

**Confirmed at run level: run 73 on `8bff517`** — the capstone-and-addendum head
— **success across all fifteen jobs**, as was run 72 on `ced3784` before it. The
strict contract job runs on CI's own clean stack and therefore skips nothing:

```
170 passed, 0 failed, 0 skipped, 0 contract problem(s) → GREEN   # run 72/73, manifest v23
```

**Run 74 on `5f8f45d`** is the head carrying 0083 and the G1 repair, and its
status is stated exactly as it stood when this was written: every individual job
— including `red case · db-fable06-gates`, which now plants four defects rather
than three — reported `completed / success` in a snapshot taken while the run
was still open, and **the run-level conclusion had not settled.** The jobs are
evidence; the run-level green is not yet in hand, and writing it here before it
is would be the §1.2 error in a fresh coat.

The local equivalent of that leg IS measured at this commit: all four db plants
turn their own gate red for their own named reason on an 80-migration clean
stack, and the control — the same `red()` call against an unplanted transaction
— exits 1 with `stayed green with the defect planted`.

### The FABLE-00 non-negotiables, against the running system

`docs/audit/launch-readiness.sql` walks them against the database rather than
against a migration file — the §7 item 1 instruction, taken literally.

```
$ psql -v ON_ERROR_STOP=1 -At -F ' | ' -f docs/audit/launch-readiness.sql "$CLEAN"
PASS | RLS closed by default | 0 table(s) without RLS
PASS | anonymous surface unchanged (2 / 2 / 0) | 2 surface / 2 path / 0 anon function
PASS | audit trail is append-only AND populated | 1023 audit row(s); 0 client write grant(s)
PASS | certificate keys are versioned | 0 certificate(s) with no key version, of 1
PASS | empirical psychometric fields are honestly NULL | 0 item(s) carry an empirical value, of 152
PASS | every function pins its search_path | 0 function(s) without a pinned search_path
PASS | every option carries a rationale (live data) | 0 option(s) with no rationale, of 560
PASS | evidence eligibility is structural (no promotion possible) | evidence_class_min(SYNTHETIC, OFFICIAL) = SYNTHETIC
PASS | exactly one public verification path | certificate_verification
PASS | hint never leaks the answer shape (CHECK, live) | 2 live CHECK invoking hint_reveals_answer_shape
PASS | identity is Person-centred (no tenant column on persons) | 0 tenant column(s) on persons
PASS | no client storage policy | 0 client storage policy
PASS | no policy grants unconditionally | 0 policy using true
PASS | no provider concept in the schema | 0 provider-shaped column(s)
PASS | retention disabled and no default duration exists | no retention column carries a default
PASS | scoring reproducibility versions recorded on every result | 0 result(s) missing a version, of 8
PASS | storage buckets private | 0 public bucket(s)
```

Seventeen checks, seventeen PASS. **What this file is not:** it is a script in
the repository, not a manifest test. It is run by hand and no CI job fails if it
regresses. Each individual property it checks *is* separately asserted by a
manifest test or a migration's terminal block — that is what makes it a
convenience rather than a load-bearing control — but the aggregate "all seventeen
hold" is **NOT YET VERIFIED** in the sense this document uses the word.

### What FABLE-06 added

```
$ psql "$CLEAN" -Atc "select (select count(*) from public.metric_definitions where catalogue_version=public.current_metric_catalogue()) || ' metrics, ' || (select count(*) from public.readiness_tiers where catalogue_version=public.current_metric_catalogue()) || ' readiness tiers, catalogue ' || public.current_metric_catalogue()"
16 metrics, 4 readiness tiers, catalogue MC-1
$ psql "$CLEAN" -Atc "select (select count(*) from public.question_health_transitions) || ' declared health edges, ' || (select count(*) from public.briefing_transitions) || ' declared briefing edges'"
9 declared health edges, 6 declared briefing edges
$ psql "$CLEAN" -Atc "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'assert\_%' and pg_get_function_result(p.oid)='TABLE(ok boolean, detail text)'"
17
$ node -e "const s=require('fs').readFileSync('src/lib/hle.ts','utf8');console.log((s.match(/^  \"[a-z][a-z0-9_.]*\":/gm)||[]).length,'HLE keys')"
301 HLE keys
```

### The happy-path sweep, re-measured at the close

The sweep asks a question no test asks: *has this endpoint ever executed?* It
reads `pg_stat_user_functions`, which counts only **successful returns** — a
function that raises does not increment — and needs `track_functions = 'all'`,
because `pl` excludes SQL-language functions.

```
$ psql "$CLEAN" -Atc "show track_functions"
all
$ psql -v ON_ERROR_STOP=1 -At -F ' | ' -f docs/audit/happy-path-sweep.sql "$CLEAN" | tail -1
76 | 10 | 86
```

**76 of 86 client endpoints have executed to a successful return; 10 never have,
and they are named** — not counted:

| endpoint | exposure |
|---|---|
| `dismiss_assistance` | LEARNER |
| `may_read_lesson_media` | LEARNER |
| `my_certificate` | LEARNER |
| `my_cycle_state` | LEARNER |
| `pause_session` | LEARNER |
| `resume_session` | LEARNER |
| `session_state` | LEARNER |
| `ingest_structured_package` | STAFF |
| `record_integrity_review` | STAFF |
| `transfer_reject` | STAFF |

All ten predate FABLE-06. Two that the sweep named at the start of this phase —
`review_briefing` and `record_question_health_review` — were closed by F06-P07,
which executes both human paths rather than recording that they had never run.

**None of the ten is claimed to work.** They are read and they are believed
correct; nothing asserts it. That is the definition of NOT YET VERIFIED, and the
seven LEARNER endpoints among them are the ones a first pilot would exercise on
day one.

---

# 3. Claim register

Each claim carries its status, the manifest test that asserts it, and **what
would turn that test red**. Where the falsifier column says *none*, the claim is
NOT YET VERIFIED however plausible it is.

### The boundaries that would matter most if they failed

| Claim | Status | Asserted by | What turns it red |
|---|---|---|---|
| A learner never receives an answer key, a correctness flag, an option identity or a rationale | **VERIFIED** | `F06-P01`, `F06-P02`, `F01-T02`, `F01-T03` | F06-P01 takes the item's **real rationale text** out of the database and requires it to appear nowhere in the projection; a leak is caught by the secret's own bytes, not by a guess at the key name. CI leg `db-fable06-gates` plants the rationale back in and requires F06-P01 to report `RATIONALE verbatim`. |
| A refusal discloses nothing about whether the thing exists | **VERIFIED** | `F06-N01` | Compares the refusal for a real item owned by someone else against the refusal for a fabricated uuid and fails if they differ. CI plants two distinct refusals and requires `existence is an oracle`. |
| The learner projection's shape is closed by the database, not by convention | **VERIFIED** | `F06-P02` | `assert_learner_projection_is_closed()` over the declared allowlist; a new item type with an undeclared key fails it. |
| Only `OFFICIAL` evidence reaches analytics, question health, empirical psychometrics, certificates and reporting | **VERIFIED** | `F02-T17`, `F02-S01`, `F04-T08`, `F04-T11`, `F04-T16`, `F06-P08` | `evidence_class_min(SYNTHETIC, OFFICIAL) = SYNTHETIC` is structural: `derive_evidence_class` caps any synthetic tenant, and `enforce_evidence_override` is INSERT-only and refuses promotion, so the OFFICIAL pool is monotonically shrinking. The INV-20 lint has a CI leg that plants an analytics module reading a raw evidence table. |
| A dean is read-only **in the API**, not only in the UI | **VERIFIED, and bounded** | `F06-N02` | See §5, RF-2. **INV-19 is verified by AUTHORIZATION for 17 endpoints and by REFUSAL for 4. For those 4, a weakened capability check would not be detected by this assertion.** |
| A report template selects, orders, visualizes, titles and brands — never redefines a metric | **VERIFIED** | `F06-N03` | Four forbidden template rows must be refused and one legitimate row accepted; with the catalogue guard disabled, the CHECK constraints must refuse the two that carry punctuation. |
| No report function computes; every number comes from a declared calculator | **VERIFIED** | `F06-P08` (`assert_reports_do_not_compute`, `assert_metric_closure`) | Closure is mechanical: a `BEGIN ATOMIC` body records every relation it reads in `pg_depend`, and the assertion watches both vacuity traps — a string-bodied calculator (records nothing) and one level of function indirection (empties the relation set). |
| No catalogue metric aggregates a person across institutions | **VERIFIED** | `F06-P08` (`assert_metric_catalogue`) | `metric_scope` carries no such label, so the forbidden metric is a **type error at declaration**; the assertion re-measures the enum and fails if a label is added. |
| A saved template is a request, not an entitlement | **VERIFIED** | `F06-P09` | Two real personas read the same template; the educator's withheld entries must carry neither metric id nor label, and the admin must see at least one computed entry so "permitted subset" is not vacuous. |
| Integrity signals never enter scoring, and the system reaches no conclusion about a person | **VERIFIED** | `F02-T16`, `F03-T08`, `F06-P08` (`assert_integrity_never_scores`) | A scoring-relevant view or function referencing the assistance/integrity telemetry fails the assertion. |
| Question Health observes; it never scores and never drives a human-only edge | **VERIFIED** | `F06-P04`, `F06-P07`, `F06-P08` (`assert_question_health_observes_only`) | The recompute is refused the `→ UNDER_REVIEW` edge by the transitions table; F06-P07 drives it as a human and F06-P04 walks the computed edges over real evidence. |
| Empirical psychometric fields are honestly NULL | **VERIFIED** | `F06-P08`, and `launch-readiness.sql` | 0 of 152 items carry a value. `create_course_revision` deliberately omits the three columns when copying forward and asserts `empirical_values_copied = 0` in its audit row. |
| Every user-facing string goes through the HLE, and no internal word reaches a human | **VERIFIED for 16 static routes at the output level; source-level for the rest** | `F06-S02`, `F06-R01`, `F06-S03`, `F01-S03` | F06-S02 derives the served-route list from `src/app` and fails if a route is served with no output-level coverage — CI plants `/redcase` and requires it to be named. F06-S03 derives 72 enum-bearing column names from 33 enum types and fails on an interpolation into a JSX text position. **The 10 dynamic routes are covered by their own tests, not by the output scan.** |
| Exactly one public verification path, and the public surface is 2 / 2 / 0 | **VERIFIED** | `F04-S01`, `F04-T10`, `F06-P08` (`assert_public_surface`) | A second verification route fails F04-S01 — CI plants one. |
| A certificate proves which frozen content and which rules it attests to | **VERIFIED** | `F04-S02`, `F04-S04`, `F04-S05` | Tampering with each of the ten protected fields must break verification; the payload is built in SQL, signed in Node with the real keyring and read back by a separate process. |
| Certificate verification is timing-safe | **VERIFIED in part — see falsifier** | `F04-S02` | The test asserts `crypto.timingSafeEqual` is used and `===` is not. **Doc 03 also prescribes a behavioural test that near-miss hashes fail identically fast. That test does not exist.** The timing property itself has no falsifier in this build. |
| Dev-only tooling does not exist in a production build | **VERIFIED** | `F01-R01`, `F06-S06` | F01-R01 fetches `/api/dev/*` from a real production build and requires 404; F06-S06 derives the file set from `src/app/api/dev` and requires every exported handler to carry the gate in its own body, so a new dev tool is covered the day it appears. |
| Retention is disabled and no default duration exists anywhere | **VERIFIED** | `launch-readiness.sql`, and the schema itself | No retention column carries a default. OD-5 stands: no duration is invented. |
| Transfer is behind policy and its lifecycle holds across two tenants | **VERIFIED for request → authorize → execute; NOT for reject** | `F01-T10`, `F04-T13` | F01-T10 runs the transfer alpha → beta in synthetic tenants and asserts the two refusals that matter (no `REQUESTED → EXECUTED` skip; the requesting side cannot self-authorize). **`transfer_reject` has never executed** — it is one of the ten in §2. |
| A READY briefing names the catalogue version AND the template version it was made from | **VERIFIED — repaired after the second eye found it enforced by half** | `F06-N04`, and `0083` | The live CHECK must name all four provenance columns and a READY briefing missing any of them must be refused. 0082 enforced `catalogue_version` and `generated_report_id` only, while its own header claimed §3.4's "the catalogue version AND the template version" — see §5, G1. CI leg `db-fable06-gates` plants 0082's original predicate and requires F06-N04 to name `template_version (G1)`. |
| The manifest is the whole truth: every declared invariant is named by a test | **VERIFIED, and bounded** | `F06-S05` | All 38 invariants in doc 03 are named by at least one of 104 other manifest entries, and no entry cites an invariant the document does not declare. **This proves NAMING, not adequacy** — see §4. |

### Claims this build does NOT make

- **DESIGNED–NOT-IMPLEMENTED — deprecating a metric.** The flag, the mandatory
  note key and the reading path all exist and the reading is tested. Nothing can
  set the flag through any exposed surface. OQ-5.
- **DESIGNED–NOT-IMPLEMENTED — a briefing that never gathers enough evidence.**
  It sits at `COLLECTING` with no declared exit. OQ-4.
- **NOT YET VERIFIED — the seven LEARNER endpoints in §2 that have never
  executed.** Including `pause_session`, `resume_session` and `session_state`,
  which a pilot touches immediately.
- **NOT YET VERIFIED — anything about behaviour under load.** OQ-1 (exposure
  cooling against the safety-critical minimum) and OQ-2 (question-health audit
  volume at institution scale) are recorded as unmeasured, not as safe.
- **No forecasting, no prediction, no autonomous conclusion about a person** is a
  property of what was *not built*. There is no test that would notice one being
  added except the INV-11 assertion, which is about scoring inputs.

---

# 4. INV traceability

```
$ python3 -c "
import json,re,collections
declared=list(dict.fromkeys(re.findall(r'INV-\d+', open('docs/rebuild/03-PINTAR-INVARIANTS.md').read())))
m=json.load(open('selftest/manifest.json'))
hit=collections.defaultdict(list)
for t in m['tests']:
  if t['id']=='F06-S05': continue
  for i in set(re.findall(r'INV-\d+', t.get('proves',''))): hit[i].append(t['id'])
print(len(declared),'declared;',sum(1 for i in declared if hit[i]),'named;',sum(len(hit[i]) for i in declared),'citing entries')"
38 declared; 38 named; 104 citing entries
```

**All thirty-eight are named. Naming is the floor, not the ceiling**, and this
document is required to say which are named but not adequately covered.

### INV-35 — named, and the coverage is not what the invariant asks for

> *Publish Readiness reports `READY` only when technical validation passed,
> academic approval is recorded, and no unresolved ERROR-level MCQ Quality
> Finding exists; it always names exactly what prevents publication.*

Named by `F02-T19` and `F04-T15`. **Accepted as inadequately covered, with the
reason.** Doc 03's prescribed test seeds an adversarial combination — each
blocking condition present alone and in combination — and requires the projection
to name exactly what blocks. What exists asserts the readiness projection over
the states the fixture happens to produce. The gap is the *"always names exactly
what prevents publication"* half: a readiness projection that reported `Blocked`
with the wrong reason, or with a reason that named one blocker while two existed,
would pass today.

**Not closed here, and not because it is hard.** Closing it means constructing
the adversarial matrix, which is a fixture-building exercise of the same size as
the FABLE-06 cohort, at the end of a phase. **Falsifier: none for the naming
half.**

### INV-22 — named, and unverifiable as written

> *A validated PLP object can never regress lifecycle state except via the one
> defined `VALIDATED → VALIDATION_FAILED` branch.*

Named by `F02-T01`, `F02-T03` and `F05-T16`. The invariant as written asks for
*"attempt every non-adjacent/reverse state transition; assert all are rejected
except the one defined branch"*. The word **every** is the problem: the object's
lifecycle is enforced by a transitions table, and the honest test over "every"
pair is a cross-join of states against states, driven through data. What exists
asserts the declared-edge mechanism and a sample of refusals.

**This is a different kind of gap from INV-35.** INV-35 is under-tested. INV-22
is **stated in a way that cannot be closed by a finite test unless it is
re-stated** as a property of the transitions table — which is, in fact, how the
system enforces it, and is what FABLE-06's two new state machines do explicitly
(`question_health_transitions`, `briefing_transitions`: a move not in the table
is refused, so the cross-join is closed by construction rather than by
enumeration). **The recommendation is to re-state INV-22 against the mechanism**,
and that is a decision for the invariant document's owner, not for a builder at
phase end.

### INV-06 — named correctly now, and half of it has no falsifier

Covered in §1.10 and §3. The comparison-function half is verified by `F04-S02`.
The behavioural half — near-miss hashes failing identically fast — **has no test
and no falsifier.**

---

# 5. The ledger

`docs/phases/FABLE-06-OPEN-QUESTIONS.md` is the working copy and carries each
entry in full. This section is the ledger itself, with status — a reader deciding
what to do next should not have to open another file to find out what is open.

## Retroactive findings — gaps in closed phases that a later mechanism exposed

### RF-1 — six surfaces shipped with no output-level HLE coverage · **CLOSED**

Every route under `/studio/*` plus `/evaluasi` had no rendered-output
`INTERNAL_WORDS` check — five FABLE-05 surfaces and one from Task 2, both phases
having closed with a second-eye gate behind them. It was **live, not latent**:
F06-S03's first run found five real interpolations (§1.7). All five fixed; the
route list and the enum-column list are now derived.

**The part that reaches beyond this phase:** the overclaim was in the *manifest*,
not in the completion report. FABLE-05's report was careful and marked the row
*"reading — flagged"*. The machine-readable record said more than the prose did,
and a gate reads the machine-readable record.

*Falsifier for the repair:* `F06-S02` + `F06-S03` + `F06-S04`, each with a CI
red-case plant.

### RF-2 — privileged endpoints resolve an argument before they authorize · **OPEN**

Twenty-one mutating STAFF endpoints check a capability; most resolve an argument
first, so a refusal can be a resolution failure rather than an authorization
refusal. Measured three times this phase; the numbers moved twice and both
readings are kept in the working copy:

| measurement | set | by AUTHORIZATION | by REFUSAL only |
|---|---|---|---|
| first | 18 | 2 | 16 |
| second | 18 | 8 | 10 |
| **third — this commit, clean stack** | **21** | **17** | **4** |

The third move is a **fixture** change, not a product one. No endpoint's error
ordering was touched, so **RF-2's defect is still present in all twenty-one** —
what changed is that seventeen of them are now *observable*, which is a different
thing from fixed. The four that remain are `acknowledge_finding`,
`record_integrity_review`, `record_question_health_review` and
`transfer_authorize`.

> **INV-19 is verified by AUTHORIZATION for 17 endpoints and by REFUSAL for 4.
> For those 4, a weakened capability check would not be detected by this
> assertion.**

**The repair needs two changes and the order matters.** A uniform refusal message
*alone* makes the assertion weaker, not stronger: F06-N02 classifies by reading
the error text, so uniform messages would take the honest count from *17 by
authorization, 4 by refusal* to **21 indistinguishable**. Authorization must
become the first gate — a capability pre-filter needing no argument, then the
institution-scoped check after resolution, both refusing identically — and only
then the uniform message. `metric_evaluate` (0073) is the pattern for the
ordering; `sanitized_item` (0074) is the pattern for the message.

## Second-eye findings — the code-gate review

### G1 — a briefing's provenance was enforced by half · **CLOSED**

Covered in §1.13. Verified against the hosted catalog before it was acted on
rather than taken from the review. Repaired by **0083**, asserted by
**`F06-N04`**, watched to fail, and planted in CI.

### G2 — a constraint name that overstated its predicate · **CLOSED, as a rename**

```sql
check ((state <> all (array['REVIEWED','ARCHIVED'])) or reviewed_by_person_id is not null
       or state = 'ARCHIVED')
```

The third disjunct exempts `ARCHIVED`, so the rule is "REVIEWED names a person"
and archiving does not have to. **That is the intended behaviour** — `READY →
ARCHIVED` is a declared edge precisely so a briefing can be put away unread,
which is what OQ-4 turns on — so the predicate is unchanged. Only the NAME
claimed more than it delivered, and a reader auditing by name would have been
misled about which states require a reviewer. Renamed in 0083 to
`briefings_reviewed_names_its_reviewer`.

### G3 — what hosted parity proves · **WRITTEN, §6**

### G4 — INV-20 holds vacuously · **WRITTEN, §9**

## Open questions — real questions with product answers, deliberately unresolved

### OQ-1 — exposure cooling meets the safety-critical minimum · **OPEN** · Load Lab

`assemble_session` fills safety-critical items first and `safety_critical_minimum`
guarantees at least one; `exam_item_is_cooled` excludes recently-presented items
and applies **only** to `bank_type = 'EXAM'`. With a bank thin in the
safety-critical dimension, can cooling exclude enough of them that the minimum
cannot be met — and **which rule yields?** Needs a deliberately thin EXAM bank;
a fixture cannot stumble into it. `assemble_session` does raise when it cannot
supply enough drawable safety-critical items, so refusal is one plausible
behaviour; **whether that is what happens under cooling has not been measured and
is not claimed.**

### OQ-2 — per-edge Question Health audit volume at institution scale · **OPEN** · Load Lab

A first recompute writes at least one audit row per item and up to two per item
that moves. Bounded in steady state (a rerun over unchanged evidence writes
nothing, asserted) but **unbounded on first run at institution scale**. Twelve
items in D1 is nothing; a real bank is a number worth having before someone finds
it.

### OQ-3 — five mutating STAFF endpoints with no direct authorization reference · **OPEN, UNEXAMINED**

`grant_role`, `run_mcq_quality`, `validate_course_content`,
`ingest_structured_package`, `propose_easy_upload_mapping`. **This may be
correct** — `grant_role` is guarded by `role_assignments_guard`, and delegation to
a trigger is a legitimate and arguably better pattern. The other four were not
examined. Recorded as existing and unexamined rather than resolved by reading
four function bodies at phase end.

### OQ-4 — a briefing that never gathers enough evidence has no exit · **OPEN**

`ARCHIVED` is reachable only from `READY` and `REVIEWED`, so a briefing that never
meets the catalogue minimum sits at `COLLECTING` permanently. **Recorded in two
framings deliberately**: as a lifecycle question it wants a new declared edge; as
a surface question it wants an inbox that does not list a briefing which cannot
advance. The second is probably right and certainly cheaper, and recording only
the first would have produced an edge added to a state machine that currently
means something precise.

### OQ-5 — a metric can be deprecated in the schema and by no exposed surface · **OPEN**

`publish_metric_catalogue` copies the flag forward and takes no argument that
would raise it; `metric_definitions` refuses UPDATE by trigger. A migration is the
only path. **That may be the right design** — retiring a metric is a PINTAR-owned
semantic decision — but it is written down nowhere, and a reader who finds the
flag will look for the RPC that sets it.

## Engineering lessons added this phase

`docs/ENGINEERING-LESSONS.md` carries fourteen. Five are FABLE-06's, and each cost
a round:

| | lesson | what it cost |
|---|---|---|
| **L9** | Coverage by count is not coverage by path | The dispatch defect (§1.1): four probes, none reaching the dispatch |
| **L9a** | A state machine cannot be tested without data | 0076's illegal birth state, found only by 80 real sessions |
| **L10** | A bijection between two names does not bind the third | A calculator/metric bijection that said nothing about the dispatch string |
| **L11** | A `limit 1` is a sample; a universal claim needs the aggregate | *"all seven allowlist rows are identical"* |
| **L12** | A probe that fails before reaching its subject reports the subject's behaviour | `\b` as backspace (§1.8) — and applied twice more since |
| **L13** | A probe's safety must not depend on the property it is probing | F06-N02's rollback (§1.4) |

---

# 6. What was not executed, and why

### The readiness gate is not mine and is not done

The FABLE-06 gate has two halves. The **code gate** — migrations, surfaces,
tests, CI, hosted sync, this document — is the builder's and is what this
document closes. The **readiness gate** is a Layer-3 audit plus a deployment
drill, and it is neither mine to run nor blocked on me.

**Nothing in it has been executed.** In particular the deployment drill needs a
staging environment that does not exist. That is not a finding; it is the state.
The drill cannot be simulated locally and claiming otherwise would be inference
presented as measurement.

### The evaluation environment, and three proofs that converge on it

Three separately deferred proofs all now wait on the same unnamed Human
Evaluation environment. That convergence is what sets its priority, and it is the
single most load-bearing piece of missing infrastructure in this build:

1. **Task 2's binding condition** — below.
2. The human-evaluation seed data, which exists in the repository and **is not
   installed on the hosted project**. Re-measured on the management channel at
   this commit, not quoted from Task 2's addendum:

   ```
   select (select count(*) from public.evaluation_personas)  as evaluation_personas,
          (select count(*) from public.evaluation_evaluators) as evaluation_evaluators,
          (select count(*) from public.evaluation_sessions)   as evaluation_sessions
   → 0 | 0 | 0
   ```

   The schema is there and the OFFICIAL purpose slot is free; installing the seed
   belongs to Stream 4.
3. The persona-switching behaviours that can only be exercised against real
   GoTrue rather than a local shim.

### The hosted project — nine migrations behind when this was written, synced since

When this document was drafted the hosted development project carried **70**
migrations against the repository's **79**. The nine FABLE-06 migrations, and
**0083** after the second-eye review, have since been applied through the
management channel and verified; the evidence is
in `docs/phases/FABLE-06-HOSTED-ADDENDUM.md` and the short form is:

- **ten of ten byte-identical** (`md5(array_to_string(statements,''))` equals
  the md5 of each repository file with its trailing newline stripped), and each
  ran its own ADR-0014 terminal verification block on hosted rather than only
  locally — 0083's included, so the tightened provenance predicate was proven to
  refuse an incomplete READY briefing **on the hosted database**;
- hosted migration count **80**, matching the repository;
- the widened schema digest matches on **twelve of thirteen categories with the
  same 2552 objects**. FUNC differs while FUNCNORM matches, so the divergence is
  cosmetic — and it was **bounded by name** rather than inferred: bucket
  bisection narrowed it to four of nineteen buckets and then to exactly the six
  FABLE-01 functions Task 2's addendum already named. **FABLE-06 did not widen
  that bound**;
- every counter equal to the local schema, `functions_without_search_path = 0`
  included — the regression §1.2 describes is closed on hosted too;
- all five FABLE-06 assertions executed on the hosted database and returned true.

Hosted carries the **schema and not the fixture data**: 0 report templates, 0
briefings, 0 question-health rows. That is correct — those are artefacts of a
suite run, and the suite mutates business data (§7).

**This closes the last item of the code gate and closes nothing in the readiness
gate.** Applying migrations to a development project is not a deployment drill.

#### What hosted parity proves, and what it does not — G3

Raised by the second eye and required here in full, because the inference it
guards against is the natural one to make.

Hosted carries **0 bootstrap tenants** (`assert_official_evidence_bootstrap`
reads *"0 bootstrap tenant(s) by purpose [none]"*), **0 `question_health` rows**,
**0 briefings**, **0 report templates**, 0 items with empirical values and no
evaluation sessions. That is correct — the D1 cohort is a test fixture and
belongs in the replay, not in a hosted database.

**So hosted parity proves SCHEMA and STRUCTURAL properties. Every BEHAVIOURAL
claim this phase makes is proven in the local replay only.** The 160-learner
cohort, the signal firing in both directions, the withdrawal walk and its two
audit rows, the briefing reaching READY, the seventeen INV-19 endpoints refused
at authorization, the two-persona report — none of that has run in the hosted
system, and the seventeen assertions returning true there say nothing about
whether it would.

A reader who sees *"hosted synchronized, 17 of 17 assertions PASS"* and concludes
that Question Health has run on hosted would be wrong. Nothing else on this page
stops them; this paragraph is what does.

### The ten endpoints that have never executed

Named in §2. Not claimed to work.

### INV-35's adversarial matrix, and INV-22's restatement

§4. Both accepted with reasons rather than carried silently.

---

# 7. The db suites are not idempotent across repeated runs on one database

This matters the moment anyone points the correctness suite at a real
environment, so it is stated as a measurement rather than as a caveat.

**Measured at this commit.** On a freshly built stack the full suite is green
twice in a row:

```
$ npm run selftest:local        # run 1, clean stack
163 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN
$ npm run selftest:local        # run 2, same database
163 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN
```

A later run on the same database **aborted**:

```
F01-T01  FAIL  runner aborted: PL/pgSQL function selftest.run_fable05() line 155 at assignment
ERROR: the assessment definition does not belong to the enrolment's institution,
       and is not canonical content distributed to it
CONTEXT: PL/pgSQL function enforce_session_provenance() line 53 at RAISE
```

and a database cloned from a *previously exercised* one failed a different test
(`F04-T04`, a quick assessment an in-scope educator could no longer launch) with
no code change involved.

**What this means, stated precisely.** The suites are **written to be run against
a freshly built database**, which is what CI does on every leg and what every
number in this document was taken from. They are *not* idempotent in general: some
fixtures consume a one-shot resource (a canonical-content distribution grant, a
certificate that can be issued once) and a repeated run finds it spent.

**Three consequences a reader should carry:**

1. A green run on a database of unknown history proves less than a green run on a
   clean one. **Build the stack, then run the suite.**
2. Pointing this suite at a hosted or production-shaped environment **mutates
   business data** and may leave the environment in a state where the suite can
   no longer pass. `SUPABASE_DB_URL` must never be set to a hosted project.
3. A failure of this kind is indistinguishable, from the output alone, from a
   real regression. `F04-T04` above looked exactly like a broken authorization
   check. It cost a rebuild to tell the difference.

**Falsifier:** none. Nothing asserts that a suite run leaves the database able to
run it again, and building one would mean deciding which fixtures are meant to be
repeatable — a design question, not a test.

---

# 8. The binding condition carried from Task 2

Task 2's second-eye gate returned **PASS**, and the PASS carried a condition that
this document is required to restate in full rather than summarize:

> **The Human Pilot Release must not proceed until the retained-token expiry
> boundary test has executed against real Auth in the Human Evaluation
> environment.**

Negative 7's runtime half was a clearing condition under the accepted amendments
and **has not been met**. The standard was relocated, not removed: it carries the
same weight at the environment gate that it carried at the build gate. It is
recorded in `docs/phases/TASK-2-COMPLETION-REPORT.md` §11 and repeated here
because a capstone that omitted it would be the mechanism by which it was
forgotten.

---

# 9. What would falsify this document

The honest summary of the three sections above:

- **Every VERIFIED claim in §3 names a manifest test.** Run `npm run selftest`
  against a freshly built stack; if any of them is red, the corresponding claim
  here is false.
- **Eleven CI red-case legs** each plant a real defect and require a named check
  to reject it for a named reason. If a leg passes *without* its defect planted,
  the check it guards is vacuous and the claim resting on it is worth nothing.
  The control was run for `db-fable06-gates`: the same helper against an
  unplanted transaction exits 1 with `stayed green with the defect planted`.
- **Every number in §2 is a pasted command.** Re-run it. If it disagrees, this
  document is wrong and the command is right.

And the claims here that **cannot** be falsified by anything in this build, listed
together because that is the useful form:

| claim | why nothing would catch it |
|---|---|
| certificate verification fails identically fast for near-miss hashes | no behavioural timing test exists (INV-06, §4) |
| Publish Readiness always names exactly what prevents publication | no adversarial matrix (INV-35, §4) |
| no lifecycle regression is possible on any PLP object | INV-22 is stated over "every" transition and is not testable as written (§4) |
| a weakened — not removed — capability check on `acknowledge_finding`, `record_integrity_review`, `record_question_health_review` or `transfer_authorize` | RF-2; those four refuse before authorization is reached |
| the seven LEARNER endpoints that have never executed behave correctly | never run; `pg_stat_user_functions` says so (§2) |
| behaviour under load | OQ-1, OQ-2 |
| a suite run leaves the database able to run the suite again | nothing asserts it (§7) |
| the aggregate "all seventeen launch-readiness checks hold" | `launch-readiness.sql` is a script, not a manifest test; no CI job fails if it regresses (§2) |
| **that INV-20 as amended is actually constraining anything** | `assert_evidence_consumer_boundary` returns true and says why that is not the same as safe, in its own words: *"no analytics consumer role exists yet, so the amended INV-20 holds but holds **VACUOUSLY** — the consumer role is an open decision"*. The assertion is doing its job; a reader who takes its green without its sentence is not. Raised as **G4** by the second eye. |

---

**This document describes the code gate and nothing else.** It is not a Layer-3
audit, it does not report one, and it does not anticipate one. Two independent
reads follow it, and what they find is theirs to say.

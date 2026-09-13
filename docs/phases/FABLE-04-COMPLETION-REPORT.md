# FABLE-04 — builder completion report

*Assessment engine completion, resilience, Quick Assessment, certificates and
public verification. Written to the §16 contract of the builder task prompt.*

**Revised 2026-09-14 after Claude 1's review.** One blocking finding was
accepted and fixed (§4.3); one was answered against doc 05 and a real over-grant
narrowed (§4.4); two findings were Claude 1's own spec defects, confirmed as
such; one diagnosis was promoted to a rule (ADR-0014). Sections that were wrong
before the review are corrected in place with the original reasoning kept, not
deleted — §6.1 in particular is withdrawn rather than defended.

---

## 1. State

| | |
|---|---|
| Branch | `claude/quirky-meitner-a04smj` |
| Commits | `e81b41f` (the phase), `403b216` (the 0046 repair, §4.2), `edcc938` (the review fix, §4.3–§4.4) |
| `main` | fast-forwarded to `edcc938`; no merge commit, no rewritten history |
| Canonical `main` before this phase | `7f4b643` (37 migrations) |
| Migrations after this phase | **51** (0038–0051 added; nothing applied to a canonical environment was edited) |
| Selftest manifest | `pintar-selftest` v4, FABLE-04, **94 ids** |
| Strict selftest, clean replay (local) | `86 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN` — identical on the upgrade-path database |
| Strict selftest, CI (no skips permitted) | `93 passed, 0 failed, 0 skipped, 0 contract problem(s) → GREEN` |
| Widened object digest | 2007 objects; clean replay and the upgrade path identical, and hosted identical in every category but the six pre-existing FABLE-01 comment divergences (§1.3) |
| CI | *see §1.2* |
| Hosted development | *see §1.3* |

### 1.1 The verbatim selftest summary

Run against a database built from an empty cluster: 50 migrations applied in
order, then the three seeds (`synthetic`, `learning_cycle`, `official_bootstrap`).

```
86 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN
```

The eight justified skips are the network- and CI-facility tests
(`F01-R02…R06`, `F03-R01…R02`) plus `F04-S05`, which drives the real route
handler and therefore needs the Supabase stack as well as the database — this session's egress policy denies
`*.supabase.co` and Docker is unavailable, so they are skipped **locally only**
and run strictly in CI, which has both. `--accept-justified-skips` is a
local-only flag; the CI job runs `npm run selftest` with no skips permitted.

### 1.2 CI

CI run **34739066547** on commit `edcc938`, branch `claude/quirky-meitner-a04smj`,
**all ten jobs green**: `check`, `migrations-clean`, `migrations-upgrade-path`,
the six red cases (including both added this phase), and the strict selftest.

The strict selftest job's own summary line, with **no skips permitted**:

```
94 passed, 0 failed, 0 skipped, 0 contract problem(s) → GREEN
```

That 94 includes **F04-S05**, which drives the exported route handler against a
genuine certificate and against a tampered stored payload — the test that closes
the blocking review finding, running strictly rather than as evidence-by-argument.

Two earlier runs of this phase are part of the record. **34736339101** on
`403b216` was green on all ten jobs at `93 passed`. **34735898362** on `e81b41f` was **RED** on
`migrations · previous schema → HEAD`, and that failure is §4.2 below; every
other job on it, including all six red cases, was green.

### 1.3 Hosted development

**Project `sknixmwkynzmrgbxzrvb` (development). Migrations 0038–0050 applied, 50 total.**

**Byte parity, per migration.** `md5(array_to_string(statements,''))` on the
hosted record against `md5` of the repository file with its trailing newline
stripped, for all thirteen:

| Migration | Parity |
|---|---|
| 0038 assessment_mode_completion | `329d7282c2a06a0e9b32a931882f487a` ✓ |
| 0039 scoring_policy_registry | `70c6858327fee1fbd3ea49dc59685f7f` ✓ |
| 0040 mode_policy_quick_assessment_integrity | `359ea27e01daeed40f01dc1921cdc74c` ✓ |
| 0041 resilience_late_sync_termination | `665434aee18c161ec41b4cacab9eaabf` ✓ |
| 0042 official_evidence_bootstrap | `976fdb32b652200e1576af9316bd1daf` ✓ |
| 0043 certificates_core | `e70895c0bbb9cdcc51f3712e5419a1d3` ✓ |
| 0044 public_verification | `62b98f4b767d5d91136a9a3243760d7c` ✓ |
| 0045 assertion_failure_path_repair | `bc7dff74ee8bf0194df6a31ad008d307` ✓ |
| 0046 ad_hoc_assessments | `0062f04c68d3a539d69c8d9c7f1dda77` ✓ |
| 0047 rpc_exposure_public | `3e3829b88987b6a2254669308f2bd4c2` ✓ |
| 0048 anon_verification_rpc | `d1d57120c60defde01d1e5f96ce8ce05` ✓ |
| 0049 quick_assessment_title_collision | `53051ddd26575d61af57547b3d8a3c6d` ✓ |
| 0050 publish_readiness_names_the_finding | `7e70001590c4f07aa65831e058320449` ✓ |

Thirteen of thirteen identical. The recorded *versions* differ from the file
names (the hosted project assigns its own timestamps when a migration is
applied through the management API), which is why parity is measured on the
statements rather than on the filename.

**Widened object digest, hosted against a from-empty replay of the same 50
migrations.** 2003 objects on both sides.

| Category | n | Hosted | Clean replay | |
|---|---|---|---|---|
| COLUMN | 626 | `db6c4c44…` | `db6c4c44…` | ✓ |
| CONSTRAINT | 352 | `717a4133…` | `717a4133…` | ✓ |
| ENUM | 134 | `32a8c496…` | `32a8c496…` | ✓ |
| FGRANT | 74 | `df632d6d…` | `df632d6d…` | ✓ |
| **FUNC** | 157 | `619e77c6…` | `a1f4cc8b…` | **differs — see below** |
| **FUNCNORM** | 157 | `23cf15d4…` | `23cf15d4…` | ✓ |
| GRANT | 111 | `25fe787d…` | `25fe787d…` | ✓ |
| INDEX | 127 | `6948d535…` | `6948d535…` | ✓ |
| POLICY | 110 | `9a037124…` | `9a037124…` | ✓ |
| TABLE | 63 | `a0593233…` | `a0593233…` | ✓ |
| TRIGGER | 83 | `4d19c372…` | `4d19c372…` | ✓ |
| VIEW | 9 | `ec4ae0a4…` | `ec4ae0a4…` | ✓ |

**FUNC differs on exactly six functions, and FUNCNORM — the same 157 bodies
with comments and whitespace normalised away — is identical.** The six are
named individually by diffing the per-function body hashes:

```
enrollments_guard()            memberships_guard()
role_assignments_guard()       transfer_authorize(uuid, jsonb)
transfer_execute(uuid)         transfer_request(uuid, uuid, uuid, uuid, text, jsonb)
```

These are the **same six FABLE-01 functions** the digest tool's own header
documents as diverging at the 34-migration state, for the same reason: the
recorded text of thirteen FABLE-01/02 migrations on hosted is comment-stripped
from the path by which they were first applied. **No FABLE-04 function is among
them**, and FUNCNORM matching on all 157 is the proof that nothing executable
differs.

**0051 synchronized (2026-09-14, after the review).** 51 migrations on hosted.
Parity for `verification_is_cryptographic`: `42d94a3198b95ff3cb79e0da0905f11f`,
byte-identical to the repository file. The widened digest against a from-empty
replay of all 51: **2007 objects, every category identical except FUNC**, and
FUNCNORM identical (158/158). Spot-checking nineteen function bodies by name
confirms the FUNC divergence is still **exactly the six FABLE-01 guards**
(`enrollments_guard`, `memberships_guard`, `role_assignments_guard`, and the
three transfer functions) whose recorded migration text on hosted is
comment-stripped — and that **every FABLE-04 function is byte-identical**,
including `certificate_verification_material`, `assert_public_surface`,
`verify_certificate` and `platform_schema_lint`.

Measured on hosted after the sync: `functions_executable_by_anon` **0**,
`anon_public_surface` **2**, `anon_reachable_http_paths` **2**,
`assert_public_surface()` **true**, and both certificate read policies now read
`(person_id = current_person_id())`.

**§13 regression properties, re-measured on hosted after the sync:**

```
tables_without_rls            0    policies_using_true             0
secdef_without_search_path    0    functions_without_search_path   0
anon_table_grants             0    anon_public_surface             2
undeclared_anon_functions     0    unclassified_client_rpcs        0
public_buckets                0    client_storage_policies         0
audit_log_client_write_grants 0    evidence_class_overrides        0
non_synthetic_institutions    0    functions_executable_by_anon    0   ← was 1; 0051
excluded_items_for_post_test / finalize_session / session_enforce_deadline
  executable by a client role                                      0

assert_telemetry_write_only          true    assert_evidence_consumer_boundary  true
assert_learner_rpcs_are_guarded      true    assert_engine_takes_no_identity    true
assert_public_surface                true    assert_audit_write_arity           true
assert_mode_policy_complete          true    assert_integrity_never_scores      true
assert_official_evidence_bootstrap   true
```

**What hosted does NOT carry, said plainly.** The D1 bootstrap tenant is a
**seed**, not a migration, and seeds are not applied to the hosted project —
`non_synthetic_institutions` there is **0**, and hosted holds no session, no
result and no certificate. Hosted is therefore synchronized at the **schema**
level, which is what the digest proves and what §15.7 asks for; the certificate
path itself is exercised against the local stack and in CI, not on hosted. This
matches how FABLE-01–03 left it (hosted carries a partial synthetic seed from
those phases: 2 institutions, 9 persons, 0 sessions).

---

## 2. What was built, per stage

### Stage 1 — INV-35's missing fixtures (the gap the prompt named first)

INV-35 had **no test at all**. Its "How tested" column is doc 16 §4's
adversarial regression fixtures, and they did not exist.

- **F04-T15** builds four MCQ banks, each carrying exactly one of §4's named
  patterns and none of the others: correct options 2–3× longer
  (`CORRECT_OPTION_LENGTH_IMBALANCE`), ~70% of correct answers in one position
  (`ANSWER_POSITION_SKEW`), an obviously implausible distractor
  (`IMPLAUSIBLE_DISTRACTOR`), and a correct option copying stem wording
  (`STEM_REVEALS_ANSWER`). Each must make Publish Readiness report
  `ACTION_REQUIRED` — `BLOCKED` for the ERROR-severity one — **naming that
  pattern and no other**, and each must clear to `READY` only after the
  **content itself** is repaired, not after the finding is acknowledged. A
  clean control bank must reach `READY` unaided, so "READY after repair" is not
  merely proving that READY is reachable.
- **0050** made that possible: Publish Readiness reported a *count*
  ("3 temuan WARNING mutu soal belum diakui") and now also names each distinct
  unacknowledged `pattern_class`. The naming is derived from the findings, not
  from a list in the function — a hardcoded pattern list would go stale the
  moment `run_mcq_quality` learns a sixth pattern, which is the criticism 0036
  made of 0035.
- **F04-T16** is §4's eligibility-probe set: a `PUBLIC_DEMO`-channel session
  opened on the **official** tenant in a certifying mode, so the channel and
  only the channel degrades it. It reaches none of the three `official_*`
  views, contributes to no psychometric or Question Health figure, is refused
  certificate eligibility **for its evidence class**, and cannot be prepared.

### Stage 2 — Scoring-policy registry (INV-29) · 0039 · ADR-0007

`scoring_policy` with `pintar-scoring/1` as row one; sessions and results
FK-bound **expand-first** (add, validate/repoint, then constrain);
`publish_scoring_policy()` and `recompute_result()`; UPDATE/DELETE refused by
trigger. Acceptance: **F04-T02**.

### Stage 3 — Mode completion (INV-26, INV-12) · 0038, 0040 · ADR-0006

Five labels added, none renamed; `mode_policy` with a completeness assertion
derived from `pg_enum`; the `QUICK` ceiling read from the policy table so
INV-12 holds by construction. Acceptance: **F04-T01** (hash invariance),
**F04-T03**.

### Stage 4 — Resilience, interruption, Quick Assessment, integrity · 0040, 0041

Server-derived `receipt_mode`; governed late-sync grace as a definition
parameter; `termination_cause` with four values, actor and reason audited and
recorded work retained; capability-gated audited deadline extension; Quick
Assessment in one call; integrity signals with `assert_integrity_never_scores()`.
Acceptance: **F04-T04, T05, T06, T07**.

### Stage 5 — Certificate core · 0042, 0043, 0046 · ADR-0008, 0009, 0011

D1 bootstrap tenant (declared, singular, prohibited in production, counted);
certificates and identity snapshots, `INSTITUTION_SCOPED`; keyring; opaque
token; canonical payload; HMAC signing; one root certificate per session by
partial unique index; `ELIGIBLE → ISSUED → REVOKED / SUPERSEDED`.
Acceptance: **F04-T08, T09, T11, T12, T13**.

### Stage 6 — Verification · 0044, 0047, 0048 · ADR-0010, 0012

Exactly one public route resolving the opaque token; the closed five-field
payload; timing-safe comparison; the full INV-05 tamper matrix; rotation;
snapshot immutability. Acceptance: **F04-T10, F04-S01, S02, S03, S04**.

### Stage 7 — Boundary audit and gate

`docs/audit/FABLE-04-BOUNDARY-AUDIT.md`: the doc 16 §6 first-certificate-issuance
boundary audit and the **full** doc 16 §5 sixteen-pattern list. Two findings —
one closed (§4 below), one open (§6).

---

## 3. Every defect found, and its disposition

### 3.1 Defects in FABLE-04's own work

| # | Defect | Root cause | Fix | Regression that now protects it |
|---|---|---|---|---|
| 1 | `text[] \|\| 'bare literal'` raised `malformed array literal` on two assertion **failure** paths | In PostgreSQL `array \|\| unknown-literal` resolves to `array_cat`, not `array_append`. Both paths had never executed, so nothing noticed | `::text` casts; repaired forward in **0045** | 0045's verification block **executes each failure path** rather than inspecting it |
| 2 | `audit_write` called with 2 arguments instead of 5, at 8 call sites across 4 migrations | plpgsql resolves function calls at runtime, so every migration applied cleanly; the first real certificate issuance found it | all call sites fixed; **`assert_audit_write_arity()`** added in 0045 | The arity assertion counts **top-level arguments** with a real scanner. The first version demanded two string literals and flagged five *correct* FABLE-01 triggers whose action argument is a `case` expression |
| 3 | A rewritten `content_canonical_payload` **moved two sealed release hashes** | The function was retyped from memory rather than spliced | 0046 splices the ORIGINAL source from `20260912124007` and changes exactly one line | 0046's verification block recomputes every PUBLISHED release hash and raises if one moves; **F04-T01** repeats it |
| 4 | `certificate_seal` tried to mutate `canonical_payload`, which the immutability trigger forbids | The key version was not known at prepare time | `certificate_prepare(p_session, p_key_version)` embeds the key version, so the payload is final at prepare | `certificate_seal` now **refuses a key-version mismatch** between argument and payload |
| 5 | `record_answer` tried to UPDATE a response to set `is_final = false`, refused by INV-28's append-only guard | The receipt mode was derived after the write | `v_scorable` passed through `submit_response`'s existing `p_is_final` parameter | **F04-T05** |
| 6 | Quick Assessment title collision: two educators launching in the same clock minute hit `UNIQUE (institution_id, title, mode, version)` | The title was the minute stamp alone | **0049** disambiguates the title (`(2)`, `(3)`) and explicitly not `version` | **F04-T04** launches twice inside one transaction, so the two launches share a minute *by construction*; 0049's own block asserts the constraint still exists so the defect cannot be "fixed" by dropping it |
| 7 | Dollar-quote nesting collision (`$q$…$r$`) recreating a function inside a DO block | Three-deep dollar quoting | 0044 restructured to **probe-first**: the leaky version is created first, proven to fail the gate, dropped, then the real one created | The probe is part of the migration and must go red before green |
| 8 | The D3b payload assertion "caught" its probe **for the wrong reason** | `prorettype` for a `RETURNS TABLE` function is `record` and carries no attributes, so the field check returned NULL for every function | Read `proargnames`/`proargmodes` with `u.m = 't'` | The probe asserts the detail names **both** reasons, not just that it went red |
| 9 | `\y` word boundaries do not fire inside `p_person` (underscore is a word character), so the INV-08 assertion passed with a planted forgeable entry point | Regex assumption | boundaries removed | The planted probe that caught it is part of the migration |
| 10 | Test-only, but worth recording: a type-explicit item pick joined `public.items` **as the impersonated learner**, and the item bank is unreadable by a learner by design — so the pick silently returned NULL and the suite aborted 200 lines later | The fix for an earlier flake introduced a read the learner cannot perform | `selftest.first_presented_of_type()`, SECURITY DEFINER, with the reason in its comment | The helper is the only path; the three call sites use it |
| 11 | **0046 exempted ad-hoc definitions from taught-content immutability on INSERT and UPDATE and forgot DELETE.** An ad-hoc quick assessment launched over a sealed course — the only kind that matters — could be created and never removed, and 0046's own verification block could not apply to any database holding sealed content | The exemption was written per-verb instead of per-row | The DELETE branch, evaluated on OLD; §4.2 explains why in place rather than forward | **F04-T17**, which exercises all three verbs against the seeded bootstrap tenant's sealed course and was checked to go red against a schema with the branch removed |

### 3.2 Defects found in FABLE-01–03 (repaired forward, not "cleaned up")

| # | Defect | Disposition |
|---|---|---|
| A | `assert_telemetry_write_only()` and `assert_evidence_consumer_boundary()` — the same `array_cat` defect as 3.1#1, in already-applied migrations 0033 and 0037 | Repaired **forward** in 0045 with behavioural probes that execute each failure path. The applied migrations are untouched |
| B | INV-35 had no test at all | Closed by Stage 1 (F04-T15) |
| C | The db suite sealed certificates with `repeat('a', 64)`, and the real HMAC was produced only by the issuance route, which needs the network facility | Closed by **F04-S04** — see §4 |
| D | FABLE-02 fixtures passed invented scoring-policy strings (`'policy-0'`, `'e'`) that resolved to nothing | This is the INV-29 gap itself. 0039's FK now rejects them; the fixtures use `public.scoring_policy_version()` |
| E | F02-T17 created its own throwaway non-synthetic tenant | D1 makes that illegal outside production. The test now **asserts the refusal** and runs its positive case on the bootstrap tenant |
| F | `F01-S03` checked the platform secrets but said nothing about certificate signing keys | Extended: two secret classes, two named readers, neither may read the other's; the certificate reader must also carry the `server-only` guard. The rule is now tested against **comment-stripped** source, because a rule about what a module may *read* must not fail a module for explaining in prose that it never reads it |

---

## 4.1 The boundary-audit finding that was closed

**The real signing loop was never exercised end to end.** The HMAC was produced
in one place (the issuance route, network facility required) and verified in
one place (a static test over payloads that same test constructed). No test
proved that a payload **built in SQL, signed in Node and stored in Postgres**
verifies when a different process reads it back — which is the acceptance item
"issued, then verified after a full process restart". Every piece was tested;
the seam was not, and a seam between SQL `jsonb` and JavaScript `JSON.parse` is
exactly where a canonicalisation defect lives.

**F04-S04** now drives the whole loop through separate `psql` processes and
asserts that a changed stored byte fails and a wrong key fails, so the pass is
not vacuously true.

---

## 4.2 The finding CI found, and the vacuity behind it

The first CI run of this phase was red on one job: `migrations · previous
schema → HEAD`, applying 0038–0050 to a database that **already held seeded,
sealed content**. 0046 failed on its own probe:

```
taught content cannot be deleted once frozen (INV-04): public.assessment_definitions
```

**The defect** is §3.1 #11. **The more useful half is why nothing else saw it.**
0046's probe is wrapped in `if v_course is not null`, where `v_course` is a
course carrying a sealed release. **Migrations run before seeds**, so on a
from-empty replay there is no sealed content, the block is skipped, and the
migration passes over nothing. The clean-database job, the local replay and the
entire selftest all did exactly that. The first environment that actually ran
the probe failed on it immediately.

**It was repaired in place, not forward, and that is a deliberate exception
argued rather than assumed.** As first written, 0046 cannot apply to any
database holding sealed content — which is every real one — so no follow-up
migration could have repaired it: there would be nothing for the follow-up to
run after. It had been applied to no canonical environment at that point: not
`main`, not hosted development, not any deployment. The forward-only rule
protects environments that have already applied a migration, and there were
none. The amendment is recorded in the file's own header so the history is not
silent about it. **No migration that has reached `main` or hosted has been
edited.**

**The vacuity itself cannot be repaired inside a migration**, because a
migration cannot seal a course — when it runs there is no institution, no
author and no content. The behavioural proof therefore moved to where fixtures
always exist: **F04-T17**. The same split already applies to 0049, whose
terminal block asserts structure and whose behaviour is F04-T04's.

**The generalisation, for the Layer-3 auditor.** A conditional probe inside a
migration reports green when its precondition is absent, and the precondition is
absent in precisely the environment where migrations are most often tested. This
build now has two of them (0046, 0049). Neither is wrong, but neither is a test
either — the test is the selftest id beside it. A future reviewer should treat
any `if … then <probe> end if` in a migration as documentation until they find
the manifest id that runs it unconditionally.

---

## 4.3 The blocking finding from review, and the reasoning error behind it

**Claude 1, finding 1.** `verify_certificate` read `pass` and `predikat` out of
`canonical_payload` and `validity` out of `certificates.status`, and **never
touched `signature`**. INV-05's guarantee did not hold on the one path a printed
QR code points at: alter the stored payload and the public page said `BERLAKU`.
The tamper matrix passed throughout because it exercised a different, internal
verifier — two verification paths of unequal strength, the shape INV-38 and
INV-26 exist to prevent.

**§7.1 of this report disclosed the gap and gave the wrong reason for it.** It
said closing it needed a fourth database principal. It did not. F01-S03
restricts `@/lib/supabase/service` to `src/app/api/**` — **it does not forbid it
there**, and `/api/assets/read-url` has worked that way since FABLE-01. I had
considered an API route and rejected it as "a second anonymous surface INV-38
exists to prevent", which inverts the invariant: before the change there were
two implementations of validity, after it there is one, and the number of
verifier-facing URLs is unchanged at one. I turned a test-scoping question into
an architectural constraint. Disclosure is not a fix, and a well-written
disclosure of a wrong conclusion is still a wrong conclusion.

**What 0051 and ADR-0013 do.**

```
QR token → /verifikasi/[token]  (page: renders, holds no database client)
             → /api/verifikasi/[token]  (endpoint: service client, holds the key)
                 → verify_certificate                  → the five D3b fields
                 → certificate_verification_material   → payload, signature, key_version
                 → decideValidity(…, verifySignature)  ← crypto.timingSafeEqual
             ← { pass, predikat, institution, date, validity }
```

- `certificate_verification_material` has **no client grant**; the payload
  carries `result.score` and the identity snapshot hash.
- `decideValidity` is pure and **can only downgrade**: a failed signature makes
  validity `TIDAK SAH`; a good signature never un-revokes.
- **`verify_certificate` lost its anon grant.** Leaving it would move the defect
  from the page to the RPC. `functions_executable_by_anon` → **0**, so §13 is
  met in full and §6.1's deviation is withdrawn.
- No database principal was added. F01-S03 is untouched. `service_role` already
  held EXECUTE on the internal functions — verified on the live project before
  building, not assumed.

**Coverage, on the path a stranger uses.**

| id | what it drives |
|---|---|
| **F04-S05** (new) | the exported route handler itself: genuine → `BERLAKU`; **tampered stored payload** (trigger disabled to write it, simulating the exact compromise) → `TIDAK SAH`; five fields in both cases; unknown, malformed and unissued indistinguishable |
| **F04-S04** (extended) | the same `decideValidity` the route calls, over a real sealed certificate — locally runnable, so the closure is not CI-only evidence |
| **F04-S01** (extended) | exactly one verifier-facing route and one endpoint; the endpoint recomputes and holds the privileged client; the page holds neither |
| **F04-T10 / F04-T12** | `anon` executes nothing; neither verification function is reachable by any client role |

## 4.4 Claude 1's other findings, answered

**Finding 6 — the certificate read policy was a real over-grant.** Doc 05
§Certificates, row *Read own certificate*: STUDENT ✅ own-only, **EDUCATOR ❌,
HoD ❌, DEAN ❌, INST_ADMIN ❌, SYS_ADMIN ❌**, SERVICE ✅. There is no
institution-wide certificate read cell in the matrix. 0043's policy was
`person_id = current_person_id() OR can_in_institution('CAN_ASSIGN_LEARNING', …)`,
which let every educator with that capability read any learner's certificate
**and identity snapshot** in their institution. **Narrowed** to own-only in
0051, for both tables. F04-T12 now walks it as an educator and as an institution
admin rather than reading the policy text. Revocation is unaffected —
INST_ADMIN's ✅ is on the *Revoke* row, and `revoke_certificate` is SECURITY
DEFINER gated on `CAN_PUBLISH`, never needing table SELECT.

**Finding 3 — confirmed, and the missing half added.** Hash invariance was
proven behaviourally (0046's terminal block recomputes every sealed release
hash; F04-T01 repeats it). On promotion: an ad-hoc definition can never become
release-bound — the UPDATE branch refuses `is_ad_hoc` true → false. The
*converse* was untested, and is the direction that would launder a taught
definition into a deletable row. **F04-T17 now asserts it**: under a sealed
course a taught definition can be neither relabelled ad-hoc nor deleted. Both
directions are locked once the course is sealed; before sealing both are
ordinary authoring.

**Finding 4 — promoted to a rule.** **ADR-0014**: *a migration's verification
block must construct the data it probes, inside a subtransaction it rolls back;
it must never assume a seeded row exists.* Where a block genuinely cannot build
its fixture, it asserts structurally and names the selftest id that carries the
behaviour. This build has two conditional blocks (0046, 0049) and both are now
named against F04-T17 and F04-T04.

**Findings 2 and 3's origin — accepted, no action.** The §9/§13 contradiction
and the §5/INV-04 impossibility are defects in the phase brief, and Claude 1
says so. Worth noting for the record that the §9/§13 resolution I defended in
ADR-0012 has now been **superseded anyway**: the right answer needed neither
line bent.

**Finding 5 — the line they asked for.** **No certificate has ever been issued
outside CI and the local stack.** Hosted carries the schema; the D1 bootstrap
tenant is a seed and seeds are not applied there, so `non_synthetic_institutions`
on hosted is 0 and its certificate path has never run. "Certificate core
complete" must not be read as "certificates have been issued on hosted".

---

## 5. Architectural decisions, and which of them are *readings*

| ADR | Decision | Fact or reading? |
|---|---|---|
| **0006** | `assessment_mode` labels are **added, never renamed**; the prompt's mode names are mapped | **Fact.** `mode::text` is inside the ADR-0004 content-hash preimage |
| **0007** | Versioned `scoring_policy` registry, expand-first binding, corrections as new linked rows | **Fact** (INV-29), with one **reading** carried forward from FABLE-03: that a Result's policy resolves through `session_id`, which rests on `assessment_results.session_id` being NOT NULL — now asserted rather than assumed |
| **0008** | D1: one declared, singular, production-prohibited non-synthetic bootstrap tenant | **Fact** — decided by Yazid 2026-09-13, Option 1 |
| **0009** | D2: certificates are `INSTITUTION_SCOPED` | **Fact** — decided by Yazid, Option A. The *reasoning* (a certificate is an institutional attestation; the learner keeps the document, and the public route is what makes that enough) is argued in the ADR |
| **0010** | D3a opaque token; D3b the closed five-field payload with **no name** | **Fact** — decided by Yazid. D3b is the frozen baseline read literally: doc 02's Verification Record and doc 05's "only", with no exception clause anywhere |
| **0011** | An ad-hoc instrument is not taught content, so a Quick Assessment can exist over a PUBLISHED course | **READING — FLAGGED FOR THE LAYER-3 AUDITOR.** Neither document mentions the other, and as written INV-04 and §5 are mutually exclusive: before this, a Quick Assessment could never be launched for any PUBLISHED course. The distinction drawn here is defensible and it is still a distinction *this builder drew* |
| **0012** | ~~The verification route reads through an `anon`-executable projection function~~ **SUPERSEDED by ADR-0013** | was a reading; the question is now moot — §9 and §13 of the task prompt cannot both hold literally. §9 was followed because it governs this surface and pre-authorises the mechanism; the cost is stated in §7 below rather than engineered away |

---

## 6. Anything narrowed, substituted or argued rather than tested

1. ~~**`functions_executable_by_anon` is 1, not 0.**~~ **WITHDRAWN at review.**
   0051 revokes the anon grant on `verify_certificate` entirely, because a
   projection that reports validity without checking a signature must not be an
   independent public answer (§4.3). The counter returns to **0** and §13's
   regression table is met in full. `F01-T13` asserts `= 0` again, plus
   `undeclared_anon_functions = 0`, `anon_public_surface = 2` and
   `anon_reachable_http_paths = 2`. The original text is left struck through
   rather than deleted: it was a real deviation for two commits, and the reason
   it stopped being one is that the design that required it was wrong.
2. **`anon_public_surface` moved 1 → 2 by counting more of reality.** It counted
   anon's table grants; it now counts anon-reachable tables **and**
   anon-executable functions. The direction matters: it counts more, never less.
3. ~~**The public route does not recompute the HMAC.**~~ **CLOSED at review**,
   §4.3. Rejecting the SHA-256 digest that would have made it *look* verified
   was right; concluding that the real fix needed a new database principal was
   not. It needed an API route.
4. **`assert_evidence_consumer_boundary()` still holds VACUOUSLY.** No analytics
   consumer role exists. The assertion says so in its own detail string rather
   than presenting a green as proof. Unchanged from FABLE-03 and restated here
   so it is not read as newly proven.
5. **`assert_engine_takes_no_identity()` is a signature tripwire, not the INV-08
   proof** — it says so in its own detail line and in the manifest. Unchanged.
6. **`assert_learner_rpcs_are_guarded()` is a comment-stripped text walk over
   `prosrc`, not a parser** — a gate against an entry point that forgets the
   check, not a proof that the check is correct. Unchanged.
7. **Quick Assessment's "about one minute from intent to learners answering" is
   argued from the call shape** (one RPC creates the definition, the assignment
   and opens it) and measured as a database round trip, **not** as a timed
   user journey. There is no UI for it in this phase.

---

## 7. What is still open

### 7.1 FABLE-04 gaps

- ~~The public verification route reports validity from `status`.~~ **Closed by
  0051** — §4.3, ADR-0013, boundary audit §4.
- **No Quick Assessment UI, no PUBLIC_DEMO UI.** Both are FOUNDATION NOW by the
  prompt's own instruction; `PUBLIC_DEMO` explicitly has "no public UI in this
  phase".
- **`PAPER` is a label only.** No workflow, as specified.
- **The certificate template's photo (OD-10) is captured but never rendered.**
  D4 deferred; the schema is built for both answers so neither needs a
  migration.

### 7.2 Carried standing decisions (not FABLE-04's to close)

- The FABLE-06 analytics consumer role. `assert_evidence_consumer_boundary()`
  keeps its vacuity line intact and was not touched.
- `published_lessons`' cross-tenant scope, recorded in
  `public_surface_registry` as an open architecture decision.
- OD-8 (item types with confirmed V1 content) and OD-11 (public demo).

### 7.3 External gates

- **Layer-3 independent audit — NOT performed and NOT claimed.** Doc 16 §5
  requires a reviewer with no shared context with the builder. This phase is a
  critical boundary, which raises how much that layer matters and does not
  change who may perform it. Both boundary-audit findings were found by the
  builder, which is the weakest kind of finding: the defect classes a builder
  is blind to are by definition not in this report.

---

## 8. The verification I performed, and what I could not verify

**Performed:**

- All 50 migrations applied to an **empty** cluster in order, then the three
  seeds; full strict selftest green on that database (§1.1).
- The CI upgrade-path failure **reproduced locally** — 37 migrations plus the
  base commit's seeds, then 0038–0050 — and then shown clean after the repair.
  The upgrade-path database and the from-empty replay produce the **identical**
  widened digest, and the strict suite is green on both.
- The widened object digest (functions **by body**, every constraint
  definition, every index definition, column defaults, FORCE RLS, policies,
  triggers, table and function grants) compared between the incrementally-built
  database and the from-empty replay: **identical**, 2003 objects.
- Every migration's terminal verification block executed at apply time; several
  are behavioural probes that must go red before the migration may go green.
- Nine standing assertions clean with the whole phase present (F04-T14).
- The doc 16 §5 sixteen-pattern list, run as searches against the tree and the
  catalogue, with results in the boundary audit.
- Five new red cases proven locally: each planted defect turns its own named
  gate red for its own named reason, and the harness itself was checked by
  running it **without** a plant and confirming it fails.
- The full certificate lifecycle on the D1 bootstrap tenant: OFFICIAL evidence
  → eligible → prepared → sealed → verified (five fields) → idempotent
  re-prepare → revoked, with the public answer changing and the row kept.

**Could not verify in this session:**

- **Anything requiring network to a Supabase project or Docker.** The egress
  policy denies `*.supabase.co` and Docker is unavailable, so `F01-R02…R06` and
  `F03-R01…R02` are justified skips locally. They run strictly in CI.
- **The issuance route end to end over HTTP.** F04-S04 exercises the same SQL
  and the same crypto through `psql` and an in-process import; the HTTP layer
  between them is exercised only in CI.
- **The hosted project by direct connection.** The DB port is unreachable from
  here; the Supabase MCP is the only hosted path, so hosted verification is
  whatever that interface can show — recorded in §1.3 with its limits.
- **Layer 3.** See §7.3.

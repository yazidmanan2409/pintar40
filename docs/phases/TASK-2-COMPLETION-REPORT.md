# TASK 2 — Human Evaluation Persona Switching · completion report

**By:** Claude 2 (implementation) · **Date:** 2026-09-13 · **Governing:**
ADR-0020 (committed here), ADR-0008 as amended, PINTAR 4.0 Architecture Baseline
(docs 02, 05, 06, 16, 03). **Layer-3 is not claimed.**

---

## 1. State

| | |
|---|---|
| Migrations | **70** (0065–0070 added; nothing before 0064 touched) |
| Selftest (verbatim) | `143 passed, 0 failed, 0 skipped, 8 justified skips accepted (local only), 0 contract problem(s) → GREEN` |
| Clean replay | 70 migrations from an empty database, all six terminal blocks included |
| Seeds | four, in order: synthetic → learning_cycle → official_bootstrap → **human_evaluation** |
| Widened digest | **2271 objects**, `ZZ_TOTAL 3ed5d14bd427cd053457d88f41517e4e` |
| Manifest | version 11, **151 ids** (18 added: EVAL-S01, EVAL-S02, EVAL-T01, eleven negatives, four properties) |
| Justified skips | **8, unchanged.** No new skip was introduced; see §7 for the one place that was deliberately avoided |

Parity hashes (`md5` of the file with the trailing newline stripped):

| File | md5 |
|---|---|
| `20260917100000_official_evidence_purpose.sql` | `f08bfeadb11965a08e88aa7447c34d8f` |
| `20260917110000_evaluation_registry.sql` | `0b5ed2f1ce59058c3feb341575333be6` |
| `20260917120000_dual_identity_audit.sql` | `bb75eb1e364d505777925c72aef84bee` |
| `20260917130000_evaluation_hub.sql` | `115a041eed9b9afb734bf7e5c8463dda` |
| `20260917140000_evaluation_expiry_is_real.sql` | `040b46d11e2c01e33875bce92dc35175` |
| `20260917150000_persona_session_is_the_token.sql` | `0208cad771e2ab90a05373a7ad43f58a` |

---

## 2. What was built

**0065 — the bounded purpose.** `official_evidence_purpose`, an enum with
exactly two values, so an unapproved purpose is impossible *by type*. A CHECK
ties it to `is_official_bootstrap` in both directions; a partial unique index
permits one institution per purpose. D1's *"one bootstrap tenant"* becomes
*"every institution authorized for non-production OFFICIAL evidence declares a
bounded purpose; at most one per purpose; all refused in production."*

**0066 — the registry.** `evaluation_personas` (the allow-list),
`evaluation_evaluators` (granted by `is_system_admin()` only, never a role),
`evaluation_sessions` (the pairing). RLS on, no policy, no client grant,
reachable only through SECURITY DEFINER functions — the shape
`client_rpc_registry` already uses.

**0067 — the dual-identity audit.** Two additive `audit_log` columns;
`audit_write`'s arity unchanged across all call sites; the actor derived
server-side from a table lookup.

**0068 — the Hub surface.** `evaluation_hub`, `exit_persona`,
`evaluation_state`, each PLATFORM with a registry row in the same statement.

**0069, 0070 — the expiry closure.** See §5.

**Seed.** One school, one journey, five perspectives: the learner's enrolment,
class, assignment, material, assessment, answers and evidence are the same rows
the educator reviews and the dean sees in aggregate. Non-synthetic, declaring
`HUMAN_EVALUATION`, with authorized canonical material distributed to it. The
seed refuses to complete unless `certificate_eligibility` returns ELIGIBLE and
the session's evidence class is OFFICIAL — measured at 6 items, mastery 1.0000,
predikat *Sangat Baik*.

**Application.** `/evaluasi` Hub; `EVALUATION MODE` banner in the root layout
rendered from `evaluation_state()` on every page, so it survives a refresh and
cannot be dismissed — there is no client state to dismiss; thirteen HLE strings;
server-mediated assumption in `src/app/api/evaluation/assume/route.ts`; exit and
sign-out both ending the session server-side.

**No proxy change was made, and that is deliberate.** When a persona's token
expires, `getUser()` returns null and the existing proxy already refuses every
protected route. Adding code there would have looked thorough and changed
nothing.

---

## 3. Every defect, and its regression

Each was found by a check, not by reading.

1. **The evaluator/persona exclusion was dead for the seed.** It sat below the
   seed path's early return in `enforce_evaluation_evaluator`, so it never ran
   for the only caller that creates both populations. Moved above; regression
   **EVAL-N02** and 0066's own probe.
2. **`functions_executable_by_anon` went 0 → 6.** `alter default privileges`
   revokes from `anon` and `authenticated` but **not from `PUBLIC`**, and
   EXECUTE is granted to PUBLIC by default — so six new functions were
   anon-executable. Explicit revokes plus a terminal count assertion in 0066.
   Recorded as **L2**.
3. **The dual-identity property could not be expressed as a time window.**
   `audit_log.at` defaults to `now()` — *transaction* start — so every row in a
   transaction shares a timestamp with any session started or ended in it.
   Completeness is now structural, coherence time-free. Recorded as **L3**.
4. **`audit_write` keyed on expiry would launder.** Gating the stamp on
   `expires_at` lets an expired-but-unended session write unstamped rows — a
   window that opens on a timer with no attacker. Keys on `ended_at`;
   regression is 0067's probe case (3).
5. **The persona-to-persona refusal sat below the evaluator gate** in 0068, so
   the named refusal negative 5 needs did not exist. Then **the check became
   dead altogether** when 0070 moved assumption behind the service role: it
   keyed on `auth.uid()` being a live persona, and the caller is now always the
   server. Removed; **negatives 5 and 6 are recorded as one control**.
6. **`fable04.sql`'s reset swept the demonstration school.** It deleted sessions
   for every `is_official_bootstrap` institution, which since 0065 means two —
   destroying the journey Dr Gladys is meant to see. Only **EVAL-P03** noticed.
   Narrowed to `D1_ENGINEERING_BOOTSTRAP` in `fable04` and `fable02`. This is
   **L7 in reverse**: an amendment changed what a flag selects, and code using
   it as a proxy widened without being touched.
7. **F01-S03 refused the service-role client in `src/lib/`.** Minting moved to
   an API route — the same split certificate issuance uses. The invariant was
   not weakened to fit the feature.
8. **The expiry inequality was inverted** (0069 → 0070), and **persona
   credentials existed at all**. Both in §5.
9. **Six prose-matching guards**, two of them inside checks written to enforce
   the rule against it. Recorded as **L4**; all now match syntax a compiler
   would see.
10. **`verifySignature` argument order** and **a leak check that fired on the
    school's own display name** — both found by EVAL-S02 refusing to pass.

---

## 4. ADR decisions

| decision | where | status |
|---|---|---|
| Bounded purpose replaces D1's count rule | ADR-0020 §5, ADR-0008 §0 | implemented |
| Evaluator status is a registry, not a role | ADR-0020 | implemented |
| Two additive audit columns, not `summary` | ADR-0020 | implemented |
| **Super Admin persona removed — premise falsified** | ADR-0020, *Super Admin boundary* | **five personas; the sixth is structurally impossible** |
| **Evaluation actor from a table lookup, not a header** | ADR-0020, *Amendment 2* | implemented |
| **D1 is ADR-0008, not ADR-0009** | ADR-0020 + ADR-0008 | corrected in both, not silently |
| **The old global bootstrap index WAS the old rule** | ADR-0008 §0 | dropped by 0065, asserted gone |
| **Expiry is the token; the database asserts, it does not derive** | ADR-0020, *Amendment 3* | implemented |

All four historical corrections are preserved in the ADR with the original
wording quoted and why it was wrong, rather than edited away.

---

## 5. Negative 7 and EVAL-S01

**The closure is the persona's access token.** Every database-side lever was
measured and none works:

| lever | result |
|---|---|
| `role_assignments.valid_until` past | closes membership, capability and scope — complete |
| …UPDATE of `valid_until` | **refused** — grants are immutable |
| …grant made at assume | **refused by INV-16** — an evaluator is not an authorized grantor |
| `enrollments.valid_to` on ACTIVE | **refused** — a CHECK ties it to ENDED/CANCELLED |
| `status = 'ENDED'` | partial — membership stays true |
| `status = 'CANCELLED'` | **unreachable** — refused by the state machine |

The two ways past INV-16 — teaching `role_assignments_guard` about evaluation,
or clearing the JWT so the guard takes its seed branch — were refused, and the
approach abandoned rather than the invariant widened.

**EVAL-S01 pins four properties**, all passing:

1. **Coupling** — the expiry passed to the database is decoded from the token
   this server just minted; no cap, no offset, no clock. The recorded value is
   **bound to a value asserted by the trusted server under the service-role
   trust boundary**. *The database does not derive or verify the JWT `exp`.*
2. **No renewal** — `persistSession:false`, `autoRefreshToken:false`, the
   refresh token never destructured, stored, returned or logged, and the cookie
   explicitly carries an empty one.
3. **No independent credential** — persona accounts have no password; the seed
   creates none; `assert_evaluation_boundary` measures it against `auth.users`
   and 0070's probe plants one to watch the assertion name it.
4. **Boundary** — the session cookie expires with the token.

**What is not proven here, stated plainly.** Item 4 of the gate addendum — retain
the token, cross `expires_at`, call a learner RPC directly and see an
*authentication* refusal — is **not executed anywhere in this build**. The
database suite authenticates with `set_config` and bypasses JWT verification by
construction, and no environment reachable from here runs real auth. The
property is **argued from the platform's own token verification and pinned by
EVAL-S01's four source properties**, not demonstrated. It belongs to the
evaluation environment (§8).

---

## 6. The eleven negatives, the properties, and the plants

| # | test | result |
|---|---|---|
| 1 | EVAL-N01 — a non-evaluator cannot enter | PASS, refused by name |
| 2 | EVAL-N02 — an institution admin cannot self-grant, by any path | PASS |
| 3 | EVAL-N03 — a person not on the allow-list, including a real learner's id | PASS, refused by name in both directions |
| 4 | EVAL-N04 — cannot authenticate as a persona outside the Hub | PASS |
| 5 | EVAL-N05 — no persona-to-persona transition | PASS — **same control as 6** |
| 6 | EVAL-N06 — two simultaneous personas | PASS |
| 7 | EVAL-N07 — expired session refuses the next action | **database half only**; see §5 |
| 8 | EVAL-N08 — the persona is refused what that persona is refused (INV-19) | PASS, boundary exercised |
| 9 | EVAL-N09 — no persona credential in any artefact | PASS |
| 10 | EVAL-N1011 — refused in production | PASS |
| 11 | EVAL-N1011 — unapproved purpose, duplicate purpose | PASS |

**Properties:** EVAL-P01 (dual identity), EVAL-P02 (server-side exit), EVAL-P03
(OFFICIAL through the ordinary cap model, proved by the same expression that
proves it for D1), EVAL-P04 (no authorization root and no RLS policy knows the
facility exists) — all PASS.

**Red plants** — new `db-task2-gates` CI leg, each verified locally using the
workflow's **own heredoc text extracted back out of `ci.yml`**:

```
EVAL-P01 | f | the evaluation actor is not the evaluator's: the action reads as genuine
EVAL-N03 | f | a real person was admitted to the allow-list
EVAL-N08 | f | the DEAN persona holds CAN_DRAFT (INV-19)
```

**Certificate issuance — EVAL-S02, PASS.** The demonstration learner's own
FINALIZED, OFFICIAL, ELIGIBLE session is prepared by the ordinary internal
function, signed with the ordinary keyring using the server-held
`CERT_SECRET_KEY_V1`, sealed, read back out of Postgres and recomputed; a
tampered payload stops verifying, so the check is not vacuous; the public
projection is exactly the five D3b fields and names no internal designation. The
issuance route is pinned on **ordering** — `session_is_mine` under the caller's
own client *before* the service client is reached — which is what stops any
persona, the learner included, issuing somebody else's certificate. No seed file
reaches for a signing secret.

---

## 7. Counters, before and after

Every movement is declared; nothing else moved.

| counter | before (64) | after (70) | why |
|---|---|---|---|
| `migrations_applied` | 64 | 70 | six migrations |
| `evaluation_personas` | — | **5** | new counter; the seeded allow-list |
| `evaluation_evaluators_live` | — | **1** | new counter |
| `evaluation_sessions_live` | — | **0** | new counter; none live at rest |
| `evaluation_boundary_ok` | — | **true** | new assertion |
| `evaluation_audit_complete_ok` | — | **true** | new assertion |
| `official_purpose_d1_engineering_bootstrap` | — | **1** | new counter; D1's composition made visible |
| `official_purpose_human_evaluation` | — | **1** | new counter |
| `official_bootstrap_tenants` | 1 | **2** | the amended D1 rule; composition visible above |
| `non_synthetic_institutions` | 2 | **3** | the evaluation school is non-synthetic by design |

**Unmoved, and each one load-bearing:** `functions_executable_by_anon` 0 ·
`anon_public_surface` 2 · `anon_reachable_http_paths` 2 · `anon_table_grants` 0 ·
`tables_without_rls` 0 · `policies_using_true` 0 · `secdef_without_search_path`
0 · `functions_without_search_path` 0 · `unclassified_client_rpcs` 0 ·
`overloaded_client_rpcs` 0 · `undeclared_anon_functions` 0 ·
`audit_log_client_write_grants` 0 · `evidence_class_overrides` 0 ·
`platform_canonical_tenants` 1 · every `*_ok` assertion true.

**Justified skips: 8, unchanged.** EVAL-S02 was deliberately written to run
against the database alone rather than over HTTP, so it did not become a ninth
local-only skip carrying a transport F04-S05 already drives in CI.

---

## 8. Threat model → control → proving test

| # | threat | control | test |
|---|---|---|---|
| 1 | Authorization bypass | no evaluation clause in any authorization root or RLS policy; a persona is a real session | **EVAL-P04**, plant 3 |
| 2 | Targeting a real person | allow-list refuses a person holding any grant or enrolment outside the evaluation school | **EVAL-N03**, plant 2 |
| 3 | Privilege acquisition | evaluator status is a registry granted by `is_system_admin()` only; no SYSTEM_ADMIN persona is possible | **EVAL-N02**, **EVAL-T01** |
| 4 | Credential leakage | persona accounts carry no credential at all | **EVAL-N04**, **EVAL-N09**, **EVAL-S01** |
| 5 | Audit laundering | actor derived server-side from a table lookup; keyed on `ended_at`, not expiry; `audit_write` the only writer | **EVAL-P01**, plant 1 |
| 6 | Escape | server-mediated sign-in only; session ends server-side on exit and on sign-out; **expiry is the token's** | **EVAL-N04**, **EVAL-P02**, **EVAL-S01**; §5 for what is argued |
| 7 | Production reach | trigger refusal on all three tables plus the purpose, and counters that measure absence | **EVAL-N1011** |

---

## 9. Argued or narrowed rather than empirically tested

Visible in the manifest, not only here.

- **Negative 7's runtime half.** The authentication refusal immediately after
  `expires_at` is argued from the platform's token verification and pinned by
  EVAL-S01's source properties. Not executed. **This is the single largest
  unexercised claim in Task 2.**
- **Negatives 5 and 6 are one control**, recorded as such rather than staged as
  two.
- **The evaluator's own browser flow** — Hub → assume → banner → exit — has
  never been driven by a person or an automated browser. The database half of
  every step is tested; the HTTP half is not.
- **Leg B does not exist**, established by measurement and asserted positively
  in 0069's probe so that a later change closing it fires a test rather than
  drifting.

---

## 10. Hosted

Applied to the hosted development project `sknixmwkynzmrgbxzrvb` after local
GREEN and after CI run 65 returned **all 14 jobs success** on `879f0c2`.
**Hosted received the migrations and not the Human Evaluation seed** — the
school, its five personas and its evaluator are seed data and exist only where
the seed is installed. That is measured below, not asserted.

> **L3-F01 correction (2026-09-16).** Accurate for the Human Evaluation seed; it does not
> generalize. The FABLE-01 `synthetic.sql` persona seed HAD been applied to the hosted
> development project and was still resident (a global SYSTEM_ADMIN plus seven other
> credentialed identities, passwords tracked in the repository). Layer-3 (L3-F01) removed
> them; migration 0084 makes the credential seeds fail-closed off the local pipeline. See
> docs/audit/L3-F01-CREDENTIAL-BOUNDARY.md.

**Migrations applied: 70.** All six Task 2 migrations recorded byte-identically.
`md5(array_to_string(statements,''))` on hosted equals `md5` of the repository
file with its trailing newline stripped, for every one:

| Migration | Repository md5 | Hosted digest | |
|---|---|---|---|
| `official_evidence_purpose` | `f08bfeadb11965a08e88aa7447c34d8f` | `f08bfeadb11965a08e88aa7447c34d8f` | ✓ |
| `evaluation_registry` | `0b5ed2f1ce59058c3feb341575333be6` | `0b5ed2f1ce59058c3feb341575333be6` | ✓ |
| `dual_identity_audit` | `bb75eb1e364d505777925c72aef84bee` | `bb75eb1e364d505777925c72aef84bee` | ✓ |
| `evaluation_hub` | `115a041eed9b9afb734bf7e5c8463dda` | `115a041eed9b9afb734bf7e5c8463dda` | ✓ |
| `evaluation_expiry_is_real` | `040b46d11e2c01e33875bce92dc35175` | `040b46d11e2c01e33875bce92dc35175` | ✓ |
| `persona_session_is_the_token` | `0208cad771e2ab90a05373a7ad43f58a` | `0208cad771e2ab90a05373a7ad43f58a` | ✓ |

Each carries its own ADR-0014 terminal verification block, so every one of those
six probes — including 0070's four behavioural legs — executed on hosted and
passed there, not only locally.

**Widened digest (`docs/audit/schema-inventory.sql`), hosted against a clean
70-migration replay.** Same object count, and twelve of the thirteen categories
identical:

| Category | n | Local | Hosted | |
|---|---|---|---|---|
| COLUMN | 697 | `54730d24224ba2ce83d3871764816cc7` | same | ✓ |
| CONSTRAINT | 404 | `baf2f8a4f6cd3dcb29485a4d79536150` | same | ✓ |
| ENUM | 140 | `2a59801167f40049a4af1946071cb6d9` | same | ✓ |
| FGRANT | 92 | `fd4128f60d2eb97ba923f75d4f432f4c` | same | ✓ |
| **FUNC** | 195 | `52e3d807f4a36287a7af605033076f08` | `9dc8c38bc7a2969bdd087aa8ee2adfed` | **differs** |
| **FUNCNORM** | 195 | `566f472b890a1d69c015a72d5945f54a` | same | ✓ |
| GRANT | 114 | `3b424eb8d87b3faacc3bcff96e2b9c4b` | same | ✓ |
| INDEX | 145 | `550a9a2417d41e1bbd0a83226d24d32e` | same | ✓ |
| POLICY | 113 | `0519ea51dfd5781be8d8ef5b07945c98` | same | ✓ |
| TABLE | 69 | `7761d7d5641287287e388ca6ecaf75ce` | same | ✓ |
| TRIGGER | 97 | `9e353e474006ef70207c4fbe0f3e1f11` | same | ✓ |
| VIEW | 10 | `5b85f966c774b982fd006e229d7b5dab` | same | ✓ |
| ZZ_TOTAL | **2271** | `3ed5d14bd427cd053457d88f41517e4e` | `1b26a7a71b101a80418033021c0e9cf6` | FUNC only |

**FUNCNORM matches exactly, so the divergence is cosmetic.** It was then bounded
by name rather than inferred: every hosted function whose `prosrc` md5 is absent
from the local set was enumerated, and the answer is exactly the six known
FABLE-01 divergences and no others —

`enrollments_guard()`, `memberships_guard()`, `role_assignments_guard()`,
`transfer_authorize(uuid, jsonb)`, `transfer_execute(uuid)`,
`transfer_request(uuid, uuid, uuid, uuid, text, jsonb)`.

The recorded text of the thirteen divergent FABLE-01/02 migrations is
comment-stripped; these six are that, and nothing in Task 2 touched them. **The
divergence bound is unchanged by Task 2: still six functions, still comment-only.**

**Counters.** `platform_schema_lint()` on hosted. Every security counter sits at
the same value as the local schema at this commit:

| Counter | Local | Hosted |
|---|---|---|
| `tables_without_rls` | 0 | **0** |
| `policies_using_true` | 0 | **0** |
| `secdef_without_search_path` | 0 | **0** |
| `functions_without_search_path` | 0 | **0** |
| `functions_executable_by_anon` | 0 | **0** |
| `anon_table_grants` | 0 | **0** |
| `anon_public_view_write_grants` | 0 | **0** |
| `anon_public_surface` | 2 | **2** |
| `anon_reachable_http_paths` | 2 | **2** |
| `undeclared_anon_functions` | 0 | **0** |
| `overloaded_client_rpcs` | 0 | **0** |
| `unclassified_client_rpcs` | 0 | **0** |
| `audit_log_client_write_grants` | 0 | **0** |
| `public_buckets` / `client_storage_policies` | 0 / 0 | **0 / 0** |
| `migrations_applied` | 70 | **70** |

`functions_executable_by_anon = 0` is the L2 regression, and it is closed on
hosted as well as locally — the explicit revokes in 0066 survived the hosted
apply.

**Assertions.** All five boolean gates true on hosted:
`official_bootstrap_ok`, `canonical_tenants_ok`, `public_surface_ok`,
`evidence_consumer_boundary_ok`, `mode_policy_complete_ok`,
`integrity_never_scores_ok`, `learner_rpcs_guarded_ok`, and both new ones —
`evaluation_boundary_ok: true`, `evaluation_audit_complete_ok: true`.

`assert_evaluation_boundary()` on hosted reads, verbatim:

> `environment=development; 0 persona(s) none of which carries a password, 0 live evaluator(s), 0 live session(s); every session expires at its own token's instant, and assume_persona is reachable only by the server that minted it`

**The schema is present; the seed data is not.** Stated explicitly, and measured:

| | Hosted |
|---|---|
| `evaluation_personas` | **0** |
| `evaluation_evaluators_live` | **0** |
| `evaluation_sessions_live` | **0** |
| `official_purpose_human_evaluation` | **0** |
| `official_bootstrap_tenants` | 0 |
| `non_synthetic_institutions` | 1 |

**Hosted contains the Human Evaluation schema but no Human Evaluation seed
data.** There is no demonstration school, no persona account, no evaluator and
no evaluation session on hosted. The three evaluation tables exist with RLS on
and no policy; the four functions exist; the `HUMAN_EVALUATION` purpose slot
exists and is **free**. Installing the seed is Stream 4's business (§11), in the
environment named there — not here.

**Structural shape of the facility on hosted**, measured rather than assumed:

| | |
|---|---|
| `assume_persona` overloads | **1** (the three-argument form only) |
| `service_role` may execute it | **true** |
| `authenticated` / `anon` may execute it | **false / false** |
| rows in `client_rpc_registry` for `assume_persona` | **0** — not a client entry point |
| registry rows for the client half | `evaluation_hub:PLATFORM`, `evaluation_state:PLATFORM`, `exit_persona:PLATFORM` |
| `official_evidence_purpose` enum labels | **2**, exactly |
| D1's old `institutions_single_official_bootstrap` index | **0** — dropped by 0065, as ADR-0008 §0 records |
| `institutions_one_per_official_purpose` | **1** — the replacement rule, present |

**Not done on hosted, deliberately:** the seed, per the closure brief; and no
application traffic — the hosted project is reachable from this build only
through the migration API, so nothing here exercises GoTrue, persona sign-in or
the certificate route. `SUPABASE_DB_URL` was never pointed at hosted.

---

## 11. Human-Test Readiness — Stream 4

> **Name and provision the non-production Human Evaluation environment in which
> the `HUMAN_EVALUATION` seed is installed and `CERT_SECRET_KEY_V1` is
> configured before Dr Gladys's evaluation.**

A readiness dependency, not a Task 2 gate. Two things follow from it and should
be decided there rather than here:

- the project's **JWT TTL is the evaluation session length**, since the two are
  now the same instant by construction. It is a dashboard setting, invisible to
  the management API and to CI, and raising it lengthens evaluation sessions.
- **negative 7's runtime half is executable in that environment** and nowhere
  else: retain a persona token, cross `expires_at`, call `my_learning_assignments`
  directly, and require an authentication refusal.

Also carried forward, unchanged from Task 1: the db suites are not idempotent
across repeated runs on one database, and `/studio/kuis` has still never been
opened by a person.

### Second-eye gate outcome — recorded after closure

Claude 1's final gate on `c4cd969`, read from the live hosted catalog rather
than from this report: **PASS — Task 2 closes. No gate-blocking defects.**

Independently re-measured there, not taken from here: `current_person_id` is
byte-identical to its pre-Task-2 body; `evaluation_personas` carries
`CHECK (role_perspective <> 'SYSTEM_ADMIN')`; `derive_evidence_class` reads
neither `official_evidence_purpose` nor `tenant_kind`; the old global D1 index
is gone and `institutions_one_per_official_purpose` is the only official-purpose
index; `assume_persona` is unreachable by `authenticated` and `anon` with zero
registry rows; `audit_write` still arity 5; the purpose enum has exactly two
values; all ten assertions true; every security counter at target. Twelve
functions and three tables were added and the anonymous surface did not move.

**The binding condition of that PASS, carried here in full:**

> The Human Pilot Release must not proceed until the retained-token boundary
> test has executed against real Auth in the Human Evaluation environment —
> retain the persona token, cross `expires_at`, call a plain learner RPC
> directly, and require authentication refusal at the instant after the
> boundary.

The standard was **relocated, not removed**. By the accepted amendments
(`TASK-2-EXPIRY-GATE-REQUIREMENT.md` §4 and
`TASK-2-NEGATIVE-7-FINAL-INVARIANT.md` §6) the runtime observation was a
clearing condition for negative 7 and it has not been met. It does not block the
build gate because what remains unmeasured is GoTrue/PostgREST rejecting a JWT
past its `exp` — third-party behaviour beneath PINTAR, executable in no
environment that currently exists, and blocked by SI-01, open since FABLE-01.
**It now carries the same weight at the environment gate that it carried here.**

**Priority note.** Three separately deferred proofs now converge on the one
unnamed environment above: the `HUMAN_EVALUATION` seed, the `CERT_SECRET_KEY_V1`
issuance path, and negative 7's runtime half. Its priority is set by three
things, not one.

Claude 1 had no GitHub access from that channel. These remain single-sourced on
this session's measurement and were not independently confirmed: the SHA and the
`main` fast-forward; CI run 67 and its fourteen jobs; the selftest line; the
manifest at v11/151; the widened digest, its 12/13 category match and the
FUNC/FUNCNORM bound; per-migration byte parity; the three red plants; the
baseline-parity job; the issuance route's `session_is_mine` ordering; the
application surface; and the contents of ADR-0020 and the ADR-0008 and doc
05/06 amendments. Function count (195) and the hosted object state were
confirmed independently and agree.

---

## 12. What I verified myself, and what I could not

**Verified myself, locally:**

- all 70 migrations on a **clean replay from an empty database**, every terminal
  block included, then all four seeds;
- the full strict suite — `143 passed, 0 failed, 0 skipped, 8 justified skips
  accepted (local only), 0 contract problem(s) → GREEN`;
- all sixteen Task 2 database tests and both static tests, reported individually;
- the three red plants, each taking its named test red with the exact substring
  CI greps for, **using the workflow's own text extracted from `ci.yml`**;
- every lint counter, before and after;
- the first governed baseline amendment, with parity re-proved and assertions 4
  and 5 evaluating for the first time (2 digest changes, 2 baseline changes, ADR
  present);
- `npm run lint`, `npx tsc --noEmit`.

**Verified myself, on hosted** (§10) — the six migrations applied and recorded
byte-identically, their six terminal probes executing there; the widened digest
matching on twelve of thirteen categories with the FUNC divergence bounded by
name to the same six FABLE-01 functions; every security counter equal to local;
both new assertions true; and the absence of Human Evaluation seed data measured
rather than assumed.

**Could not verify myself:**

- **anything that requires real authentication**: the persona sign-in, the token
  `exp` being what the platform actually issues, the refresh token genuinely
  being withheld by `@supabase/ssr` at runtime, and negative 7's authentication
  refusal. The local stack has no GoTrue and the hosted project is unreachable
  from this build except through the migration API;
- **the browser surface** end to end;
- **whether the supplied ADR B content is correct** — it was given, not
  established here.

**Layer-3 is not claimed.**

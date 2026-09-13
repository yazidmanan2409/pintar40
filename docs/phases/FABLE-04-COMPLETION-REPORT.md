# FABLE-04 — builder completion report

*Assessment engine completion, resilience, Quick Assessment, certificates and
public verification. Written to the §16 contract of the builder task prompt.*

---

## 1. State

| | |
|---|---|
| Branch | `claude/quirky-meitner-a04smj` |
| Commit | `e81b41f` — *FABLE-04: modes, scoring policy, resilience, quick assessment, certificates and public verification* |
| Canonical `main` before this phase | `7f4b643` (37 migrations) |
| Migrations after this phase | **50** (0038–0050 added; nothing edited, nothing removed) |
| Selftest manifest | `pintar-selftest` v4, FABLE-04, **92 ids** |
| Strict selftest, clean replay | `85 passed, 0 failed, 0 skipped, 7 justified skips accepted (local only), 0 contract problem(s) → GREEN` |
| Widened object digest | `ZZ_TOTAL\|2003\|bfae1eb9f828dc363f4832867059a910` — **identical** between the incrementally-applied database and a from-empty replay of all 50 migrations |
| CI | *see §1.2* |
| Hosted development | *see §1.3* |

### 1.1 The verbatim selftest summary

Run against a database built from an empty cluster: 50 migrations applied in
order, then the three seeds (`synthetic`, `learning_cycle`, `official_bootstrap`).

```
85 passed, 0 failed, 0 skipped, 7 justified skips accepted (local only), 0 contract problem(s) → GREEN
```

The seven justified skips are the network- and CI-facility tests
(`F01-R02…R06`, `F03-R01…R02`) — this session's egress policy denies
`*.supabase.co` and Docker is unavailable, so they are skipped **locally only**
and run strictly in CI, which has both. `--accept-justified-skips` is a
local-only flag; the CI job runs `npm run selftest` with no skips permitted.

### 1.2 CI

*CI-RESULTS-PLACEHOLDER*

### 1.3 Hosted development

*HOSTED-RESULTS-PLACEHOLDER*

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

## 4. The boundary-audit finding that was closed

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

## 5. Architectural decisions, and which of them are *readings*

| ADR | Decision | Fact or reading? |
|---|---|---|
| **0006** | `assessment_mode` labels are **added, never renamed**; the prompt's mode names are mapped | **Fact.** `mode::text` is inside the ADR-0004 content-hash preimage |
| **0007** | Versioned `scoring_policy` registry, expand-first binding, corrections as new linked rows | **Fact** (INV-29), with one **reading** carried forward from FABLE-03: that a Result's policy resolves through `session_id`, which rests on `assessment_results.session_id` being NOT NULL — now asserted rather than assumed |
| **0008** | D1: one declared, singular, production-prohibited non-synthetic bootstrap tenant | **Fact** — decided by Yazid 2026-09-13, Option 1 |
| **0009** | D2: certificates are `INSTITUTION_SCOPED` | **Fact** — decided by Yazid, Option A. The *reasoning* (a certificate is an institutional attestation; the learner keeps the document, and the public route is what makes that enough) is argued in the ADR |
| **0010** | D3a opaque token; D3b the closed five-field payload with **no name** | **Fact** — decided by Yazid. D3b is the frozen baseline read literally: doc 02's Verification Record and doc 05's "only", with no exception clause anywhere |
| **0011** | An ad-hoc instrument is not taught content, so a Quick Assessment can exist over a PUBLISHED course | **READING — FLAGGED FOR THE LAYER-3 AUDITOR.** Neither document mentions the other, and as written INV-04 and §5 are mutually exclusive: before this, a Quick Assessment could never be launched for any PUBLISHED course. The distinction drawn here is defensible and it is still a distinction *this builder drew* |
| **0012** | The verification route reads through an `anon`-executable projection function | **READING — FLAGGED FOR THE LAYER-3 AUDITOR.** §9 and §13 of the task prompt cannot both hold literally. §9 was followed because it governs this surface and pre-authorises the mechanism; the cost is stated in §7 below rather than engineered away |

---

## 6. Anything narrowed, substituted or argued rather than tested

1. **`functions_executable_by_anon` is 1, not 0.** §13's row for that counter is
   **not met**. It was not narrowed to make it read zero — that is the move §9
   itself names as dishonest. `F01-T13` is now **exact rather than relaxed**: it
   asserts `= 1`, plus `undeclared_anon_functions = 0`,
   `anon_public_surface = 2` and `public_surface_ok`. A *second* anon grant
   still fails FABLE-01's lint test. In the manifest, not only in prose.
2. **`anon_public_surface` moved 1 → 2 by counting more of reality.** It counted
   anon's table grants; it now counts anon-reachable tables **and**
   anon-executable functions. The direction matters: it counts more, never less.
3. **The public route does not recompute the HMAC.** Open, §7. A SHA-256 payload
   digest that would have made it *look* verified was considered and **rejected**
   as a substitute control.
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

- **The public verification route reports validity from `status` without
  recomputing the signature.** Boundary audit §4. The remedy is a fourth
  database principal (a `certificate_verifier` role whose JWT the server mints)
  — a decision about the authentication architecture, not a patch. Recorded,
  not improvised.
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

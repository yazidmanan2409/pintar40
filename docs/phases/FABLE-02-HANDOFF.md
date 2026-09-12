# FABLE-02 — Handoff to the implementing session

**Written:** 2026-09-12, Asia/Jakarta, by a Cowork session with Supabase
management access but **no GitHub access to `yazidmanan2409/pintar40`**.
**For:** the Claude Code session that holds the repository and push rights.
**Purpose:** everything needed to carry FABLE-02 from a standing start to a
closed phase gate, without re-deriving what FABLE-01 already settled.

---

## 0. How to read this document

Yazid's standing rule applies to this file too: **a handoff is not a source
of truth.** Every claim below is tagged.

- **[VERIFIED]** — I queried the live Supabase project or ran the command
  myself, today. Quoted values are observed output.
- **[TRANSCRIPT]** — from the FABLE-01 session export. Second-hand. Treat as
  a strong hint and confirm before relying on it.
- **[JUDGEMENT]** — my reasoning or recommendation. Argue with it.

Anything about the **repository contents or git history is [TRANSCRIPT]**,
because I could not reach GitHub. Anything about the **database** is
[VERIFIED] unless marked otherwise.

---

## 1. Do this before anything else

Five checks. If any disagrees with §2, stop and reconcile before writing a
line of SQL.

```bash
git log --oneline -1 && git rev-list --count HEAD && git status --porcelain | wc -l
ls supabase/migrations/ | wc -l                    # expect 13
python3 -c "import json;print(len(json.load(open('selftest/manifest.json'))['tests']))"   # expect 30
npm ci && npm run lint && npm run typecheck
gh run list --limit 3     # or the API; last run on main should be green
```

Then confirm the database agrees with the repo:

```sql
select version, name from supabase_migrations.schema_migrations order by version;
select count(*) from pg_namespace where nspname = 'selftest';   -- expect 0
```

---

## 2. Verified state of the hosted project

Project `sknixmwkynzmrgbxzrvb` ("pintar"), org ZAYD (`jhpiwdmamllxkkchsaul`),
region `ap-southeast-1`, **plan `free`**, Postgres 17, `ACTIVE_HEALTHY`,
`platform_environment.environment = 'development'`. **[VERIFIED]**

### 2.1 Migrations — 13, matching the repository series **[VERIFIED]**

```
20260912004158 foundation_base          20260912004845 schema_lint
20260912004244 organisation             20260912010009 tenant_scoped_reads
20260912004321 identity_enrollment      20260912010100 read_helpers
20260912004431 authorization            20260912010155 read_helpers_by_value
20260912004527 transfer_rollover        20260912050956 build_sha_from_request
20260912004550 storage_config           20260912051935 audit_log_no_service_writes
20260912004654 function_privileges
```

### 2.2 Schema-lint counters — all zero **[VERIFIED]**

`tables_without_rls` 0 · `policies_using_true` 0 · `public_buckets` 0 ·
`anon_table_grants` 0 · `functions_executable_by_anon` 0 ·
`secdef_without_search_path` 0 · `audit_log_client_write_grants` 0
(including `service_role`) · `malformed_jalur` 0.

### 2.3 Data **[VERIFIED]**

9 persons · 9 auth users · 2 institutions (both synthetic) · 17 role
assignments · 18 enrollments · 145 audit rows · 0 storage objects ·
**`users_ever_signed_in` 0, `auth.sessions` 0, `auth.refresh_tokens` 0**.

The last three matter: **no one has ever signed in to the hosted project.**
That is the whole of SI-01 (§4.3).

### 2.4 Security advisor **[VERIFIED]**

- `authenticated_security_definer_function_executable`: **17** — the
  intended RPC allow-list, accepted in ADR-0001 finding 1. Not drift. If
  FABLE-02 adds RPCs this count rises; update the accepted list in the
  mini audit when it does, or the next reader will read it as drift.
- `auth_leaked_password_protection`: **disabled** — HA-02, see §4.2.
- `function_search_path_mutable`: **0**.

### 2.5 Existing objects FABLE-02 must build on **[VERIFIED]**

**Tables (16):** `academic_periods, accounts, audit_log, classes,
enrollments, feature_flags, institutions, memberships, org_nodes, persons,
platform_config, platform_environment, portable_visibility,
record_class_registry, role_assignments, transfers`

**Enums:**
```
account_kind            = EMAIL | CLASSROOM_CARD
app_role                = STUDENT | EDUCATOR | HEAD_OF_DEPARTMENT | DEAN | INSTITUTION_ADMIN | SYSTEM_ADMIN
class_status            = SCHEDULED | ACTIVE | ENDED | CANCELLED
enrollment_status       = PENDING | ACTIVE | ENDED | CANCELLED
enrollment_end_reason   = COMPLETED | TRANSFERRED_OUT | WITHDRAWN | EXPIRED
membership_close_reason = PERIOD_ROLLOVER | MOVED | ENROLLMENT_ENDED
org_kind                = INSTITUTION | FACULTY | DEPARTMENT | PROGRAMME | COHORT | CLASS
record_portability      = PORTABLE | INSTITUTION_SCOPED
transfer_status         = REQUESTED | AUTHORIZED | EXECUTED | REJECTED | CANCELLED
```
Follow this naming style for FABLE-02's enums: SCREAMING_SNAKE labels,
lower_snake type names, no provider or vendor words (INV-32).

**Authorization primitives — call these, never reimplement:**
```
is_system_admin() -> boolean                                   [SECDEF] authenticated:X
current_person_id() -> uuid                                    [SECDEF] authenticated:X
has_scope(p_min_role app_role, p_node uuid) -> boolean         [SECDEF] authenticated:X
can_on_node(p_capability text, p_node uuid) -> boolean         [SECDEF] authenticated:X
is_member_of_institution(p_inst uuid) -> boolean               [SECDEF] authenticated:X
person_visible_to_me(p_person uuid) -> boolean                 [SECDEF] authenticated:X
role_capabilities(r app_role) -> text[]                        [invoker] authenticated:X
role_rank(r app_role) -> smallint                              [invoker] authenticated:X
```

**The policy-helper pattern FABLE-02 must copy (ADR-0001 "Future
constraints"):**
```
enrollment_readable(p_id uuid, p_person uuid, p_institution uuid, p_created_at timestamptz) -> boolean
membership_readable(p_enrollment uuid, p_node uuid, p_created_at timestamptz) -> boolean
```
Note the shape: **helpers receive the row's values as arguments; they never
re-read the row they are protecting.** This came out of a stop-patch-loop —
the first attempt re-read by id and broke `INSERT … RETURNING`, because the
row is not yet visible to the helper's snapshot. Evidence tables in FABLE-02
must use the by-value shape from the first migration.

**Audit writer:** `audit_write(p_action, p_target_table, p_target_id,
p_institution_id, p_summary jsonb) -> bigint` — SECURITY DEFINER, revoked
from `public`, `anon`, `authenticated`. Called only from triggers and
SECDEF functions. It stamps `build_sha` from `app.build_sha`, falling back
to PostgREST's `request.headers ->> 'x-pintar-build'`, shape-validated
`^[0-9a-f]{7,40}$`.

**Audit action vocabulary in use** — extend it, never create a second log:
```
institution.created · enrollment.created · enrollment.ended
membership.created · membership.closed · period.rollover
role.granted · role.revoked
transfer.requested · transfer.authorized · transfer.executed
feature_flag.INSERT · feature_flag.UPDATE · platform_config.updated
```

**Record-class registry (transfer portability) — FABLE-02 must add a row
per new evidence table:**
```
enrollments:PORTABLE · memberships:PORTABLE
audit_log:INSTITUTION_SCOPED · role_assignments:INSTITUTION_SCOPED
```

**Roles present:** `anon, authenticated, authenticator, postgres,
service_role`. There is no analytics role yet — see §7.3.

---

## 3. Repository state — [TRANSCRIPT], verify per §1

- `main` at **`5bbd3c6`** "HA-02: reclassify leaked-password protection as a
  plan/platform limitation", linear, no merges.
- CI run #6 on that SHA: **green**, all six jobs.
- Selftest manifest: **30 ids** — `F01-T01…T19` + `T13b` (db, 21 rows
  including `F01-DONE`), `F01-S01…S05` (static), `F01-R01…R05` (app).
- CI jobs: `check` (npm ci · lint · typecheck · build) · `migrations-clean` ·
  `migrations-upgrade-path` · `red-case` matrix (`static-permissive-policy`,
  `db-table-without-rls`) · `selftest` (strict, needs the other four).
- Residue: remote branch **`verify/fable01-broken-pr`** at `1008592` was
  never deleted — the previous session's proxy refused ref deletion. Delete
  it; the commit stays reachable via `refs/pull/1/head`.

---

## 4. Open gates — carried into FABLE-02, none of them blocking it

### 4.1 HA-01 — bounded session / 24h inactivity — **plan limitation, open**
Supabase gates session-lifetime controls (time-box, inactivity timeout,
single-session) to **Pro and up**; the org is on Free. `[auth.sessions]
inactivity_timeout = "24h"` in `supabase/config.toml` configures the **local
stack only** and is not evidence of hosted enforcement. Recorded in ADR-0001
finding 9. Two accuracy points to preserve: Supabase does not proactively
kill sessions at the threshold — enforcement lands at token refresh, with
cleanup up to 24h afterwards — so "expires after 24h" cannot be claimed even
on Pro. **Do not introduce a compensating control to make this green.**

### 4.2 HA-02 — leaked-password protection — **plan limitation, open**
Product owner verified in the Dashboard that this is a Pro+ feature. It was
briefly misclassified as a configuration defect and a "one-toggle Dashboard
action"; that was wrong and is corrected in ADR-0001 finding 12. Related:
finding 10 withdrew the old justification ("no PINTAR user chooses a
password") because all nine hosted users carry a bcrypt password and the
suite authenticates with `signInWithPassword`. **Both stay open as
production-readiness gates. No substitute control.**

### 4.3 SI-01 — hosted sign-in never executed — **needs a human terminal** **[VERIFIED]**
This has been recorded as "blocked by this session's egress policy". That
framing is too narrow. I tested three environments today:

| From | `*.supabase.co` | `api.supabase.com` | `api.github.com` |
|---|---|---|---|
| Cowork cloud container | ✗ 403 `connect_rejected` | ✗ 403 | ✓ 200 |
| Yazid's Mac, Claude workspace VM | ✗ 403 | ✗ 403 | ✓ 200 |
| Claude Code session | ✗ (reported in transcript) | ✗ | ✓ |

The policy follows the session, not the machine. **No Claude session can
close SI-01.** It needs Yazid's own terminal, outside any Claude sandbox —
roughly ten minutes following the runbook. Toolchain is not the obstacle;
his machine's VM already has node v22.23.2, npm 10.9.8, git 2.34.1.

Stop describing this as environmentally blocked. It is waiting on ten
minutes of the product owner's time, and saying so plainly is what gets it
done.

### 4.4 OPS-01 — Free-plan auto-pause — **watch during FABLE-02** **[JUDGEMENT]**
Free projects pause after ~7 days of low activity. FABLE-02 is long. If the
project pauses mid-phase, management-channel calls start failing in a way
that looks like a defect. Touch the project weekly, or expect the confusion.

### 4.5 Layer-3 independent audit — not performed
Doc 16 §5 requires a reviewer with no shared context with the builder.
Outstanding for FABLE-01 and will be for FABLE-02.

---

## 5. Carry-over work — do this before FABLE-02's first migration

### 5.1 Commit the two loose artefacts
Both exist only in the session export, at these locations:

- **SI-01 runbook** — export lines **7835–7937**, under the reply to
  **Turn 15**, heading "SI-01 — hosted sign-in verification procedure
  (prepared, not executed)". Execution method, `.env.local` variable table,
  expected PASS output, before/after SQL. → `docs/` as a runbook.
- **F01-R06 card-auth test design** — export line **8833**, under the reply
  to **Turn 19**, heading "Proposed minimum test — one new id, F01-R06".

(An earlier note placed both at "turns 20–21". That is wrong — turns 20 and
21 begin at lines 8853 and 8899, after both artefacts.)

### 5.2 Implement F01-R06 now, not with FABLE-02 **[JUDGEMENT]**
Three reasons, in order of weight:

1. **The card secret is derived twice** — TypeScript in `src/lib/card.ts`
   (`sha256(pepper|card|pin)`) and SQL in `supabase/seed/synthetic.sql`
   (`encode(digest(pepper||'|'||card||'|'||pin,'sha256'),'hex')`) — with
   **nothing asserting the two agree**. Change the separator, hash,
   encoding or pepper position on either side and card sign-in breaks in
   production while the whole suite stays green. It is the only known
   defect class in the codebase with that property.
2. **FABLE-02 §7 binds `AssessmentSession` to `person_id` and
   `enrollment_id`.** The card learner is one of those people. After
   evidence rows exist, a derivation divergence stops being a login bug and
   becomes an evidence-provenance problem.
3. **Attribution.** One new id against a green 30 is trivially attributable.
   The same red inside a batch of seventeen new acceptance items is not.

CI already supplies `CARD_PEPPER=synthetic-card-pepper` and
`CARD_EMAIL_DOMAIN=cards.synthetic.pintar.test`, and the hosted/local seeds
carry the matching hash for card `7001` / PIN `2468`. No new infrastructure.
The test imports the app's own `deriveCardSecret` — do not write a second
derivation in the test, or it proves nothing.

Ordering note: R06 signs out card-7001 globally. The runner executes
db → static → app, so it lands after the db suite that depends on that
persona. Keep that order.

### 5.3 Two five-minute tidy-ups **[TRANSCRIPT, verify]**
- `/masuk/kartu` sits in `PUBLIC_PATHS` in `src/proxy.ts` but no such route
  exists. Harmless now; a latent trap if a real page ever lands there.
- `CARD_EMAIL_DOMAIN` is read with a bare `??` fallback in
  `src/app/masuk/actions.ts` rather than through the fail-loud `env.ts`
  contract that governs `CARD_PEPPER`. Unset in production it silently
  becomes `cards.pintar.internal` and every card sign-in fails against a
  project seeded under a different domain.

---

## 6. Standing conventions — violating these is what CI catches

Accumulated across FABLE-01. Each is enforced by a specific test.

**Migrations**
1. Apply through the management channel (`apply_migration`), then **name the
   repo file with the version the database recorded**. Never guess the
   version, never edit an applied migration — the upgrade-path job byte-
   compares every previously applied migration against HEAD.
2. Exactly one migrations directory (`supabase/migrations`), canonical names
   `^\d{14}_[a-z0-9_]+\.sql$`, strictly increasing (F01-S01).
3. **Every migration ends in a terminal `do $$ … raise exception … end $$;`
   verification block** that fails the migration on its own violation
   (F01-S01). This is not decoration — it is how a bad migration stops at
   apply time rather than at review time.
4. Expand → compatible deployment → backfill → switch → contract (doc 16
   §2). N−1 must stay correct against the expanded schema.
5. **Never add a migration whose only purpose is dropping a test artifact.**

**Security**
6. No `USING (true)` / `WITH CHECK (true)` for any client-facing role,
   anywhere, ever — not even temporarily (F01-S02 + the lint counter).
7. RLS enabled on every table at creation.
8. Every `SECURITY DEFINER` function pins `search_path = public, pg_temp`.
9. `SECURITY DEFINER` is not a way around a privilege problem. When the
   selftest harness hit `permission denied for schema selftest`, the fix was
   an explicit minimal grant, not SECDEF.
10. New RPCs need an explicit `grant execute … to authenticated` and a
    matching entry in the accepted advisor list.
11. No service-role key, pepper, or server-only module reachable from a
    client component (F01-S03 scans the bundle and the import graph).

**Audit**
12. One append-only `audit_log`. No UPDATE/DELETE/TRUNCATE grant for any
    non-owner role, `service_role` included. Extend the action vocabulary;
    never create a second log.

**Language**
13. Every user-facing string passes through `src/lib/hle.ts`. No lifecycle
    enum name, evidence class, status word or version string reaches a
    learner or public surface (F01-S04 + the HLE runtime guard). FABLE-02
    introduces a lot of new enum vocabulary — `INGESTED`, `FROZEN`,
    `VALIDATION_FAILED`, `SYNTHETIC`, `PUBLIC_DEMO` — and every one of those
    is already on the `INTERNAL_WORDS` blocklist. Staff surfaces get staff
    language; learner surfaces never see them.

**Boundaries**
14. `src/integrations/`, `src/care/`, `src/ai-gateway/` are reserved and
    **empty**. FABLE-02 does not open them. In particular §11's AI
    provenance fields are *metadata columns*, not a gateway integration, and
    no provider-named table, enum or column may exist (INV-32).

**Process**
15. **Stop-patch-loop (doc 16 §7):** roughly 2–3 cycles of the same failure
    → stop, find the root cause and the invalid assumption, record an ADR,
    then proceed. FABLE-01 hit this once and the ADR is what made the fix
    correct rather than another patch.
16. **Any deviation from the phase prompt's stated instruction is an ADR**
    (doc 13) — record what changed and why. See §7.1 for one you will
    almost certainly hit.
17. Commit trailers:
    ```
    Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
    Claude-Session: <this session's URL>
    ```

---

## 7. Foreseeable traps in FABLE-02 **[JUDGEMENT]**

Flagged now because each is cheaper to decide before the first migration.

### 7.1 INV-02 cannot be a CHECK constraint, and the prompt says CHECK
§5 asks for "a regex CHECK constraint blocking [the hint] from containing
the correct option's text or letter". Postgres CHECK constraints cannot
contain subqueries or reference other tables or rows. If the hint lives on
`Item` and the correct option's text lives on `ItemOption`, **a CHECK
physically cannot see it.**

Split it:
- *Letter/narrowing* patterns ("the answer is A", "not A or C") — same-row
  text, a genuine regex CHECK works.
- *Correct option's text* — needs a **trigger**, and it must fire on **both**
  sides: writing the hint, and editing an option. Otherwise the rule is
  bypassed by writing the hint first and the option afterwards.

This is a deviation from the prompt's literal wording, so per doc 13 it gets
an ADR rather than a silent divergence. The invariant is fully satisfied;
only the mechanism differs.

### 7.2 §6's media CHECK *is* legitimately a CHECK
Same row, single JSONB column — "reject any `audio.url`/`video.url` entry
missing a non-empty transcript" is expressible as a CHECK. Don't
over-generalise from 7.1.

### 7.3 The "analytics role with no SELECT on raw evidence" needs a decision
§7 requires eligibility views to be the only read path, with consumer roles
holding no SELECT on raw tables. Supabase ships a fixed role set (`anon`,
`authenticated`, `service_role`, `authenticator`) and PostgREST only assumes
`anon`/`authenticated`. `service_role` is already used by the app's server
routes for signed URLs, so revoking its SELECT is not free. Settle early
whether this is a new database role reached by a separate server-side
connection, or a narrower grant on the existing ones — and record it. It
shapes every evidence migration after it.

### 7.4 `content_sha256` scope must be recorded before the migration ships
Doc 08, restated in §2: if a column's in/out-of-hash status is ambiguous it
goes **inside** the hash, and the decision is recorded first. Write that ADR
before the freeze migration, not after — a later change to the hash input
silently invalidates every previously frozen release.

### 7.5 The db runner needs restructuring, and CI hardcodes its filename
`selftest/db/fable01.sql` is a single `run_fable01()` function with 21 return
rows. FABLE-02 roughly doubles the db surface. A sibling `fable02.sql` with
`run_fable02()` is the clean shape, but three files hardcode the FABLE-01
name and must be updated together — line numbers **[VERIFIED]** against the
tree at `b929c12`, so re-check offsets on current `main`:
- `selftest/run.ts` — line 68 (file path in `runDb()`) and line 72 (the
  `select … from selftest.run_fable01() r` query), plus the log string at 159.
- `.github/workflows/ci.yml` — lines 119–120 (upgrade-path job) and 164–165
  (`db-table-without-rls` red case); each invokes both the file and the
  function by name.
- `package.json` — line 13, the `selftest:db` script.

Both CI call sites also assert on the output shape (`! grep -E '\| f \|'`
and `grep -E '^F01-T13 \| f \|'`), so a second runner needs its own
assertions rather than being appended to those pipelines blindly.

Also: the new file needs the same privilege preamble the FABLE-01 harness
learned the hard way (`grant usage on schema selftest to authenticated,
anon`, `grant execute` on the role-switch helpers, `revoke all on
run_fable0N() from public`), or it fails on a clean CI database exactly as
CI-01 did.

### 7.6 The upgrade-path job stops being vacuous — and that is the point
It has been green-but-empty for most runs because no commit added a
migration. FABLE-02 adds many. From the first one it will genuinely start
the previous schema, apply HEAD's pending migrations on top, and re-run the
db contract against the upgraded database. **Expect the first real failure
there to be a legitimate finding, not a CI defect.**

### 7.7 CI cost will bite
Three full Supabase stack bring-ups per run today, ~6 minutes wall-clock,
and run #2 already hit an ECR `toomanyrequests` on a concurrent image pull.
FABLE-02 adds a fourth consumer at minimum. Two cheap mitigations worth
doing early: gate the upgrade-path job on `supabase/migrations/**` actually
changing, and cache or share a stack across jobs.

### 7.8 Four hand-synchronised documents will rot
ADR-0001, `docs/audit/FABLE-01-mini-audit.md`,
`docs/CHECKPOINT-FABLE-01.md` and `selftest/manifest.json` restate
overlapping facts, and a single FABLE-01 finding required hand-editing three
of them. FABLE-02 will make that worse. Consolidating to one or two records
is a genuine maintenance saving with zero test cost.

---

## 8. FABLE-02 scope and the open decisions

The phase prompt is `FABLE-02-PLP-CONTENT-MODEL-PROMPT.md` (delivered
alongside this file, verbatim from the Project): 12 sections, **17
acceptance checklist items**. It is the schema phase — every table later
phases write evidence into is created here, with provenance and structural
eligibility from the first migration.

**No open decision blocks it.** I checked each against doc 11
(`11-PINTAR-OPEN-DECISIONS.md`) rather than assuming:

| OD | Status | Blocks FABLE-02? |
|---|---|---|
| **OD-3** source books/editions/ISBNs | OPEN, **MUST ASK PRODUCT OWNER**, never invent a citation | **No.** Required "before any real content authoring begins — placeholder/fixture content can proceed" |
| **OD-8** which non-MCQ types get real V1 content | NARROWED, contingent on OD-3 | **No.** The registry is built regardless; only *content and UI polish* wait |
| **OD-5** retention durations | Architecture resolved, legal durations OPEN | **No.** Doc 11: "the schema does not need the answer". Build the column, default nothing |
| **OD-9** transfer consent policy | OPEN | Already handled — FABLE-01 built the lifecycle with policy as configuration |
| **OD-11** Mini-PINTAR public trial | OPEN | No. Default to FOUNDATION NOW; `PUBLIC_DEMO` exists as an evidence class only |

So: build the shape, leave the policy null, invent no citation and no
duration. That is exactly what the prompt instructs, and doc 11 agrees.

---

## 9. Definition of done for FABLE-02

Do not declare the phase complete until all of these hold:

1. Every §-level requirement of the phase prompt implemented.
2. All 17 acceptance items expressed as manifest ids and green.
3. `npm run selftest` **strict** — no `--accept-justified-skips` — green for
   **both phases together**, zero failures, zero skips, zero contract
   problems.
4. CI green on a pushed commit: all jobs, including the now-meaningful
   upgrade-path job.
5. Red-ability demonstrated for the new contract, the way FABLE-01 did it —
   a deliberate defect must turn the *right* test red for the *right*
   reason, not merely turn something red.
6. Mini audit per doc 16 §5, searching explicitly for this phase's dangerous
   patterns: **answer-key leakage, raw-evidence reads in analytics paths,
   provider concepts in the domain model, unsafe `SECURITY DEFINER`,
   unversioned scoring** — plus the standing list.
7. ADRs written for: the INV-02 mechanism deviation (§7.1), the
   `content_sha256` scope decision (§7.4), the analytics-role decision
   (§7.3), and any stop-patch-loop event.
8. Every new evidence table has a `record_class_registry` row.
9. External gates either cleared or explicitly, accurately recorded as open.

Items 3–6 are the ones that actually close the gate. The rest is bookkeeping
that makes them legible.

---

## 10. What not to do

- Do not weaken a security requirement to obtain a green status, and do not
  introduce a "compensating control" that is weaker than the thing it
  replaces. An openly recorded gap beats a misleading green.
- Do not seed empirical values. Every empirical difficulty column is NULL
  until legitimately computed from sufficient `OFFICIAL` evidence.
- Do not let a producer's concepts into the domain model — no
  provider-named table, enum, or column.
- Do not open the reserved module boundaries.
- Do not restart or re-derive FABLE-01. Its 13 migrations are applied and
  its contract is green; build forward.
- Do not treat this document as authority. Verify per §1.

---

## Appendix — commands

```bash
# full contract, strict (what CI runs)
npm run selftest

# locally, accepting manifest-justified skips
npm run selftest:local

# a subset
npx tsx selftest/run.ts --accept-justified-skips --only=F01-S01,F01-S02

# db runner alone, against a reachable Postgres
npm run selftest:db          # needs SUPABASE_DB_URL

# never set SUPABASE_DB_URL when pointing the app at the HOSTED project —
# the db suite mutates business data (grants roles, executes a transfer,
# performs a period rollover)
```

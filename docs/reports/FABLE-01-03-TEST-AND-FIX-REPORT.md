# PINTAR 4.0 — FABLE-01 → FABLE-03: tests, issues found, fixes applied

**Prepared:** 2026-09-12 · **Canonical `main`:** `51066b7fe87a6d0fc22edd460d39d51bd0c73a47`
**Migrations:** 34 · **Acceptance ids:** 72 · **CI:** run 28, 8/8 jobs green

## How to read this

FABLE-01 and FABLE-02 were built in **earlier sessions**. Sections A and B are
therefore reported **from the repository's own record** — `docs/CHECKPOINT-FABLE-01.md`,
`docs/audit/FABLE-01-mini-audit.md`, `docs/adr/0001-foundation.md`,
`docs/phases/FABLE-02-CHECKPOINT.md` — not from memory, with one thing added that
I *did* verify directly in this session: every FABLE-01 and FABLE-02 acceptance id
is currently green on canonical `main` (CI run 28).

Section C and D are FABLE-03, which I built, integrated and verified in this
session. Everything there is first-hand.

Where something is **open** rather than fixed, it says so. Nothing in this report
is described as satisfied when it is a gate.

---

# A. FABLE-01 — Foundation

**Scope:** identity, organisation hierarchy, enrollment/membership, roles and
capabilities, tenant isolation, RLS baseline, private storage, append-only audit,
the Human Language Engine skeleton, Config Studio shell, dev-tooling lockout.
**Migrations 0001–0013.**

| # | Migration |
|---|---|
| 0001 | `foundation_base` |
| 0002 | `organisation` |
| 0003 | `identity_enrollment` |
| 0004 | `authorization` |
| 0005 | `transfer_rollover` |
| 0006 | `storage_config` |
| 0007 | `function_privileges` |
| 0008 | `schema_lint` |
| 0009 | `tenant_scoped_reads` |
| 0010 | `read_helpers` |
| 0011 | `read_helpers_by_value` |
| 0012 | `build_sha_from_request` |
| 0013 | `audit_log_no_service_writes` |

## A.1 Tests performed — 31 acceptance ids

Three runners: **db** (`selftest/db/fable01.sql`, real role impersonation against a
live Postgres), **static** (source/migration scanning), **app** (real HTTP against a
production build + real GoTrue).

### Database runner — 20 ids

| Id | What it proves |
|---|---|
| F01-T01 | persona harness seeded in two synthetic institutions |
| F01-T02 | INV-13 tenant isolation — institution admin sees zero foreign rows |
| F01-T03 | INV-13 / doc 05 — a learner sees only themselves |
| F01-T04 | INV-16 anti-escalation; INV-18 grant/revoke audited; assignment immutable |
| F01-T05 | Lesson 11 fail-closed primitives |
| F01-T06 | INV-19 DEAN is read-only and holds no capability |
| F01-T07 | doc 05 educator scope over own class only |
| F01-T08 | INV-23 period rollover closes + recreates memberships; history answerable; audited |
| F01-T09 | INV-23 identity records append-only; `persons` has no institution/class column |
| F01-T10 | INV-25 transfer lifecycle; portable vs institution-scoped visibility; history intact |
| F01-T11 | INV-18 audit append-only for student, sysadmin and owner |
| F01-T12 | INV-21 seed guard (no intent; production) |
| F01-T13 | INV-14/15/36 schema lint all zero |
| F01-T13b | INV-37 lint RPC refused to a non-SYSTEM_ADMIN |
| F01-T14 | INV-15 no `anon`/`authenticated` storage or table path |
| F01-T15 | doc 02 hierarchy chain, `jalur` integrity, no delete |
| F01-T16 | doc 02 classroom-card account shares the Person model |
| F01-T17 | doc 05 own-profile update only |
| F01-T18 | doc 16 §8 flags institution-scoped; platform config SYSTEM_ADMIN only |
| F01-T19 | INV-18 audit rows carry the running build SHA via `x-pintar-build`; malformed values rejected |

### Static runner — 5 ids

| Id | What it proves |
|---|---|
| F01-S01 | doc 16 §2 one migrations directory; canonical ordered names; every migration ends in a verification block |
| F01-S02 | INV-36 no `USING/WITH CHECK (true)` text in any migration or seed |
| F01-S03 | INV-37 client bundle and import graph carry no service-role or pepper reference |
| F01-S04 | doc 12 HLE renders every key for every persona; no internal word or "PINTAR 4.0" on a user-facing route |
| F01-S05 | doc 13 ADR-0001 exists with every required section and the traceability block |

### App runner — 6 ids

| Id | What it proves |
|---|---|
| F01-R01 | INV-21/§4 unauthenticated `/konfigurasi` redirected, `/api/*` refused, `/api/dev/*` 404 in the production build, public copy clean |
| F01-R02 | INV-19/INV-13 DEAN and STUDENT get a clean refusal on `/konfigurasi`; INSTITUTION_ADMIN renders own institution only |
| F01-R03 | INV-15 anonymous and real-student HTTP fetch/list/create/overwrite of storage objects refused outside the server route |
| F01-R04 | doc 16 §2 CI ran migrations against a clean database **and** the previous schema, and went red on a deliberately broken build |
| F01-R05 | §2 sign-out invalidates the session **server-side** (refresh token revoked, not just the cookie cleared); other sessions unaffected |
| F01-R06 | §2 classroom-card auth: `CARD_PEPPER` meets the production contract (≥ 32 chars) and the TypeScript derivation authenticates card 7001 / PIN 2468 through **real GoTrue**, agreeing with the SQL derivation in the seed |

### Result

**All 31 green** on canonical `main`, CI run 28 (strict mode, zero skips).
Red-ability was proven rather than assumed: an injected `USING (true)` migration
turns S01/S02 red, and a deliberately broken PR (PR #1, `verify/fable01-broken-pr`)
made CI run `34683448686` red on `policies_using_true: 1`; the PR was closed
unmerged and `main` never carried the defect.

## A.2 Issues found in FABLE-01 — 13, with disposition

### Fixed forward (8)

| # | Issue | Root cause | Fix |
|---|---|---|---|
| 1 | **`anon` could execute RPCs despite explicit revokes** (Supabase security advisor) | Postgres grants `EXECUTE` to `PUBLIC` on every new function; the migrations' own checks looked only at *explicit* grants, so an inherited grant was invisible to them | Migration `function_privileges` — revoked from `PUBLIC`, and the verification now checks **effective** privilege, not explicit grants |
| 2 | **Cross-tenant read after a transfer** (F01-T02 on re-run) | The sending institution's admin could read the learner's *new* enrollment at the receiving institution: the policy keyed on person visibility rather than the row's institution | Migration `tenant_scoped_reads` |
| 3 | **Policy helper broke `INSERT … RETURNING`** | The first fix (`read_helpers`) re-read the row by id *inside* the policy; the row is not yet visible to the helper's snapshot. **Stop-patch-loop applied** — root cause: a policy must never re-read its own row | Migration `read_helpers_by_value`; the by-id helpers were dropped. This is now the standing pattern for all policy helpers |
| 4 | **`/api/dev/*` answered 401 instead of 404** in the production build (F01-R01, first run of the app runner) | The route proxy refused anonymous `/api/*` before the dev handler could answer — which *revealed that the namespace exists* | `src/proxy.ts` passes the dev namespace through; its handler alone decides (404 outside development) |
| 5 | **ADR-0001 lacked the doc 13 "Affected components" section** (F01-S05) | — | Section added |
| 6 | **`service_role` held UPDATE/DELETE/TRUNCATE on `audit_log`** (mini audit) | Supabase default privileges. The trigger already refused the writes, but an immutable table carries **two** locks | Migration `audit_log_no_service_writes`; the lint now counts `service_role` too |
| 7 | **Unpinned `search_path` on `selftest.*` helpers; magic-link origin fell back to `''`** (mini audit) | — | `search_path` pinned; `appUrl()` now fails loud on a missing env value |
| 8 | **CARD-01 — every card sign-in threw in the production build** | The synthetic pepper was 21 characters while `src/lib/env.ts` requires ≥ 32 outside development, and the selftest app runs under `NODE_ENV=production`. **Nothing caught it because nothing exercised the path** | Pepper lengthened in `supabase/seed/synthetic.sql` and `.github/workflows/ci.yml` (they must match — the seed derives the card password from it), and the path is now exercised by **F01-R06**. *Forward note:* `CARD_PEPPER` is an input to every stored card secret, so rotating it once real learners hold cards requires a controlled credential migration, not an edit |

### Found by CI (1)

**CI-01 — the selftest harness assumed privileges a clean database does not grant.**
Run #1, the first CI this repository ever had, failed with
`permission denied for schema selftest` at F01-T03. The role-switch helpers are
`SECURITY INVOKER` and live in schema `selftest`, so re-entering the schema needs
`USAGE` and calling the helper needs `EXECUTE` — the file granted neither. The
harness could switch role **once** and never switch back; the function that
restores the owner role was itself unreachable from the role it had switched to.
It died at the second of 40 role-switch call sites, so nothing past F01-T02 ran.

*Why the earlier "21/21 green" did not catch it:* that run was against the
long-lived project database, which already carried the grant as **ambient state**.
`create schema if not exists` and `create or replace function` never reset
privileges, so a database that once had the grant keeps it forever, while every CI
job starts genuinely clean. The class of defect is **a harness depending on state
it does not itself create**.

*Fix:* `selftest/db/fable01.sql` now states its own privileges — `grant usage on
schema selftest`, `grant execute` on the three role-switch helpers **only**, and
`revoke all on function selftest.run_fable01() from public` so opening the schema
does not leave the entrypoint reachable by client roles. No migration, RLS policy,
production privilege, audit protection or lint rule changed.

### Security finding, remediated (1)

**SEC-01 — hosted test artifact removed.** The throwaway `selftest` schema was
found **live on the hosted project** with `USAGE` granted to `anon` and
`authenticated`, and all four helpers executable by `authenticated`. Because
`selftest.as_owner()` is `SECURITY INVOKER` and begins with `reset role`, and
`authenticator` is a member of `service_role`, **every precondition for an
RLS-bypass escalation was present** — only reachability (PostgREST exposes
`public, graphql_public` by default) stood in the way. Dropped with
`drop schema selftest cascade` over the management channel, deliberately *not* as
a migration: the schema is a validation artifact created outside the production
chain and dropping it must not enter that chain.

### Open — accepted limitations and production gates (3)

These are **not fixed** and must not be reported as satisfied.

| Id | Item | Status |
|---|---|---|
| **HA-01** | **Bounded sessions / 24h idle expiry.** Supabase gates inactivity timeout, time-box and single-session-per-user to **Pro plans and up**; this project's org is on **Free**, so the control is *unavailable*, not merely unset. `[auth.sessions] inactivity_timeout = "24h"` in `config.toml` configures only the **local** stack and is not evidence of hosted enforcement. Even on Pro the semantics are not a hard kill at exactly 24h — sessions are evaluated at refresh and cleaned progressively for up to 24h *after* the threshold | **OPEN — production gate.** Before real-user launch PINTAR needs either the plan that provides it natively or an architecture-approved compensating control. Not waived, not weakened |
| **HA-02** | **Leaked-password protection disabled.** Pro+ only; Dashboard-verified by the product owner as unavailable on Free. The earlier justification — "no PINTAR user chooses a password" — was **withdrawn** (HA-03): all nine `auth.users` rows carry a bcrypt password, every one is `provider: email`, and the acceptance suite authenticates with `signInWithPassword`. The requirement is real and currently unmeetable | **OPEN — production gate.** **No substitute control was introduced** to obtain a green status, and none should be: a weaker check reported as equivalent would be worse than an openly recorded gap |
| **BUILD-SHA** | Over PostgREST each request is its own transaction, so `audit_write` reads the SHA from the `x-pintar-build` header when `app.build_sha` is unset. A direct API caller could stamp a different SHA on the rows *its own request* produces | **Accepted limitation.** The value is provenance, never authority. F01-T19 proves capture and rejection of malformed values |

Also open: **SI-01** (real hosted sign-in never executed from a build session — egress denies `*.supabase.co`; covered against a real local stack in CI instead) and the **Layer-3 independent/adversarial audit**, which has not been performed.

---

# B. FABLE-02 — Content model, lifecycle, evidence schema, consumption boundary

**Scope:** the PLP content hierarchy, the content state machine and freeze hash,
the three-tier question bank, the evidence schema (session → presented item →
response → result), telemetry separation, the official-evidence boundary, views
and aggregates, the coaching validator and Publish Readiness, assignments and
ingestion, exposure/cooling and INV-24. **Migrations 0014–0029.**

FABLE-02 owns the **schema**; it deliberately does **not** own the engine.
`drawable_items_for_definition`, `excluded_items_for_post_test`,
`exam_item_is_cooled` and `publish_readiness` are what an engine must *call* —
they are not the engine. That boundary is what made FABLE-03's INV-26 satisfiable.

## B.1 Tests — 26 acceptance ids

`F02-T01` … `F02-T24` (behavioural, `selftest/db/fable02.sql`), `F02-C01`
(concurrency: two real connections contesting one receipt), `F02-S01` (static).
Highlights of what they establish:

- **INV-04 / ADR-0004** — the freeze hash is deterministic, blind to
  empirical/provenance/status metadata, and addresses **content, not rows**:
  identical content under new uuids, timestamps and insertion order hashes
  identically (`T05`, `T06`, `T07`).
- **INV-32 / doc 04 §1** — publishing and sealing are **different human
  authorities**: `HEAD_OF_DEPARTMENT` can seal but still cannot publish; a service
  path can do neither (`T08`, `T09`).
- **INV-12** — EXAM never leaks down, and a parallel group cannot mix tiers or
  institutions (`T11`).
- **INV-28** — one row per receipt; an identical replay is acknowledged as one
  row, a replay carrying a *different* answer is refused rather than overwriting;
  under real concurrency the **unique index** arbitrates, not a prior read (`T14`, `C01`).
- **INV-29** — results are immutable; a recomputation is a **new linked row** and
  the lineage cannot fork or cross sessions (`T15`).
- **INV-20** — non-official evidence never reaches `official_*`, and the analytics
  role holds no grant on any raw evidence table (`T17`, `S01`, plus a CI red case).
- **INV-02/INV-03** — a hint that names the answer or narrows it to two options is
  refused **at the database**; an option with an empty rationale is refused (`T22`).
- **INV-24** — a post-test excludes every item presented in that learner's pre-test
  **and every parallel sibling** of one (`T23`).

All 26 are green on canonical `main`, CI run 28.

## B.2 Issues found in FABLE-02 — 2 defects, both found by testing

| # | Issue | Root cause | Fix |
|---|---|---|---|
| 1 | **Cross-tenant release seal.** A person holding `CAN_DRAFT` in institution A and `CAN_FREEZE_RELEASE` in B could carry A's release into B **and seal it in one statement** | RLS evaluates `USING` on the *old* row and `WITH CHECK` on the *new*, and the status trigger read the capability from `NEW.institution_id` — which the same statement had just written. The deeper cause was a FABLE-01 convention FABLE-02 failed to carry forward: eleven institution-scoped tables with no tenant guard | Migration `0019` — `institution_id` made immutable, and the capability read from `OLD`. Regression `F02-T10` |
| 2 | **`audit_write` called with the wrong argument shape.** `0025`'s evidence-reclassification guard passed `(uuid, text)` where the signature is `(text, jsonb)` | plpgsql resolves at run time, so the migration applied cleanly. It would have failed the **first time anyone reclassified a session**, taking the reclassification with it. It survived because on a synthetic tenant no override is possible at all — `SYNTHETIC` is the floor and an override may only weaken — so the path is reachable only on genuinely official evidence | Repaired forward-only in `0028`. `F02-T17` now walks the path |

## B.3 Two invariants whose *statement* changed (declared, not slipped in)

- **`anon_table_grants = 0`** was right while nothing in the product was public.
  §8 requires a publicly readable lesson view, so the counter now excludes that one
  view and two new counters report the public surface explicitly. F01-T13 still
  asserts zero **and** reports `anon_public_surface: 1`. *Narrowing a counter while
  leaving it named "zero" would have been the dishonest version of this change.*
- **`open_assessment_session` gained two arguments** in `0029`. Session provenance
  needed the assignment ids from `0021`, but the assignment tables did not exist
  until `0028`, and provenance is immutable after insert — so they could not be
  filled in later. The old signature was **dropped**, not overloaded.

## B.4 Deliberately not built in FABLE-02

Adversarial MCQ banks (doc 16 §4 is absent from the repository — not reproduced
from memory); the `misconception_taxonomy` validation sweep (lands with the
ingestion migration that first writes taxonomy rows); and everything the engine
does.

---

# C. FABLE-03 — The Learning Experience (Dr. Gladys Learning Cycle)

**Scope:** the complete learner cycle — pre-test → personal reading map → lesson
player → post-test → results — the single assessment engine, the answer-key
sanitizer, hesitation-triggered assistance, and the AI-context boundary.
**Migrations 0030–0034.** Built, integrated and verified in this session.

## C.1 What was built

### Database — 5 migrations, 2 243 lines, 42 functions, 5 tables

| Migration | Lines | Contents |
|---|---|---|
| `0030 learning_cycle_delivery` | 869 | allow-list sanitizer, `item_type_learner_support`, `seeded_index`, `option_display_order`, `presented_item_views` + `enforce_first_view`, `engine_version()`/`scoring_policy_version()`, `session_is_mine`, `session_enforce_deadline`, `may_continue_session`, `may_start_assessment`, `difficulty_band`, **`assemble_session`**, `start_learning_session`, `session_paper`, `sanitized_item`, `note_item_view`, `record_answer`, `session_answers`, `pause`/`resume`/`submit_session` |
| `0031 learning_cycle_scoring` | 505 | **`grade_response`**, `session_final_responses`, **`evaluate_session`**, `session_misconceptions`, **`finalize_session`**, `finish_my_session`, `session_outcome`, `session_review`, `reading_map`, `learning_delta` |
| `0032 mcq_quality_severity_cast` | 148 | forward-only repair of a FABLE-02 defect (see C.3) |
| `0033 lesson_progress_and_assistance` | 542 | `lesson_progress` (never-regress trigger), `my_learning_assignments`, `learner_lessons`, `record_lesson_progress`, `assert_telemetry_write_only`, `assistance_levels`, `assistance_grants`, `assistance_state`, `open_assistance`, `dismiss_assistance` |
| `0034 cycle_state` | 179 | `may_read_lesson_media`, `my_cycle_state`, `session_state`, and the `submit_session` idempotency repair |

New tables: `item_type_learner_support`, `presented_item_views`, `lesson_progress`,
`assistance_levels`, `assistance_grants`.

### Application — 14 new files

- **Engine façade** — `src/lib/assessment-engine/{index,types}.ts` (323 lines). A
  structural `EngineClient` type exposing **`rpc` only**, a `sanitize()` that
  *throws* if any answer-key field is present, and every engine call.
- **AI boundary** — `src/ai-gateway/contexts.ts`,
  `buildLearnerAssistanceContext(item, stage, level)` with three-layer INV-31
  enforcement. README rewritten.
- **Learner surface** — `src/app/belajar/` : the cycle hub, `[tugas]` (assignment),
  `pemetaan` (pre-test), `peta` (reading map), `pelajaran/[pelajaran]` (lesson),
  `penguasaan` (post-test), `hasil` (results), plus `ItemPlayer` and `LessonPlayer`
  client components and `actions.ts`.
- `src/app/api/assets/read-url/route.ts` extended for `pelajaran/*` paths, gated by
  `may_read_lesson_media`.
- ~90 new Human Language Engine keys (620 renders total).

### Fixture — `supabase/seed/learning_cycle.sql` (599 lines)

Its **own** synthetic institution (`synth-siklus-<ts>`) with its own period, org
tree, class, three staff, two learners (one email, one classroom-card `7002`/PIN
`1357`), an SD5 "Pecahan" course, 2 lessons, 4 objectives, 4 misconception codes,
20 items (3 parallel groups, 7 safety-critical), 2 assessment definitions, a
release frozen + published **through the real gate**, and three assignments.

## C.2 The five architectural decisions (ADR-0005)

1. **The engine's implementation lives in SQL; the TypeScript module is the single
   typed façade.** Forced by privilege, not preference: `STUDENT` holds no
   capability and `items`/`item_options` sit behind `CAN_DRAFT`, so the drawing and
   scoring logic *must* run inside `SECURITY DEFINER`. INV-26 is then checked both
   ways — each migration's verification block asserts one implementation each, and
   `F03-S01` asserts one calling module, with a CI red case that plants a second
   scorer and requires the check to catch it.
2. **Mode names are mapped, never renamed.** `mode::text` is inside the frozen
   `PINTAR-CONTENT-SHA256/1` content hash (ADR-0004), so
   `LEARNING_CYCLE_PRETEST` = `PRE_TEST`, `LEARNING_CYCLE_POSTTEST` = `POST_TEST`.
   ADR-0004 is **amended not at all** — §2 of ADR-0005 exists precisely so it does
   not have to be.
3. **The learner answers with a display position, never an authored label.**
   Seeded permutation via `seeded_index(seed, salt, key)`; `option_display_order()`
   is revoked from every client role.
4. **INV-11 narrowed from "no reference" to "no read".** §6 requires a
   learner-facing telemetry *writer*, and PostgREST exposes only `public` — so the
   rule became: a function in `public` may **WRITE** telemetry and may **never
   READ** it (no `FROM`, `JOIN`, `UPDATE`, `DELETE`, no dynamic SQL naming the
   schema; no view may depend on it at all). Strictly **stronger** for scoring than
   an exception list, because it binds every future function. One callable
   definition, `public.assert_telemetry_write_only()`, and 0033's verification block
   plants a reader to prove it still bites. F02-T16 was changed to call the same
   assertion — openly, and recorded.
5. **The fixture seeds its own institution** — see the stop-patch-loop in C.3.

## C.3 Issues found during FABLE-03 — 27, all resolved

### Defects in *earlier* work, repaired forward-only (2)

| # | Issue | Root cause | Fix |
|---|---|---|---|
| 1 | **`run_mcq_quality()` raised on every call, on every course — including an empty one** | `0026`'s `STEM_REVEALS_ANSWER` branch uses `INSERT … SELECT DISTINCT`. `DISTINCT` resolves the select list's types *before* assignment coercion applies, so `'ERROR'` stayed `text` against `finding_severity`. The failure is at **plan** time, so no row had to match. It survived FABLE-02 because **nothing called it** — F02-T19 exercises `validate_course_content()` and `publish_readiness()` and never this. Its first real caller is FABLE-03's fixture, which has to publish a release | Migration `0032`: the function replaced whole with **one line changed** (`'ERROR'::public.finding_severity`). `0026` was not edited. The verification block is **behavioural** — it creates a probe course in a rolled-back subtransaction and calls the function — because a structural assertion is exactly what missed it |
| 2 | **`submit_session()` was not idempotent at `FINALIZED`** | `0030` made `SUBMITTED` and `EXPIRED` idempotent but not `FINALIZED`, so a learner who double-tapped *Kumpulkan*, or whose client retried after a dropped response, hit the transition allow-list and saw an error for work that had already succeeded. `finalize_session()` was already idempotent; the guarantee stopped **one function short of the button** | Migration `0034`, replaced whole with the `FINALIZED` case added |

### Design defect found by testing — the stop-patch-loop (1)

**The fixture's learners kept being moved out of their class.** FABLE-01's rollover
and transfer machinery reaches into the shared Alpha institution and relocates its
learners. Three attempts, each of which produced a *different* error:

1. repair the memberships → `membership node belongs to another institution (INV-13)`
2. scope the repair to the fixture institution → `NO_ACTIVE_ENROLMENT`
3. use dedicated personas inside Alpha → rollover reached those too

That is the stop-patch-loop signal. **Root cause fixed rather than patched a fourth
time:** FABLE-03 seeds its **own institution** (ADR-0005 §6), so nothing another
phase's tests do can perturb it.

### Implementation defects found and fixed during the build (21)

Grouped by what they teach.

**Type and syntax faults the database caught at apply time**

| Issue | Fix |
|---|---|
| `values (course is not null and modul is not null and true and modul, …)` → *argument of AND must be type boolean, not type uuid* | replaced with `values (modul, …)` |
| `v_value := <text>` assigned into a `jsonb` in `record_answer` — would fail casting `'A'::jsonb` | separate `v_label text` variable |
| duplicate `revoke` on `sanitized_item` | removed |
| `position` is a reserved word in a `returns table` OUT-parameter list | renamed to `posisi` |
| named-arg typo `session_final_responses(f_session => p_session)` | positional |
| `max(uuid)` does not exist in `start_learning_session` | `(array_agg(n.id) filter (where n.kind='CLASS'))[1]` |
| `array_agg(distinct x order by x collate "C")` → *in an aggregate with DISTINCT, ORDER BY expressions must appear in argument list* | nested subquery: distinct first, then order |
| plpgsql `when sqlstate 'P0001' and sqlerrm = '…'` is not valid syntax | custom `errcode = 'PT999'` / `when sqlstate 'PT999'` |
| record shadowing: `declare … r record` vs a `plp_releases r` alias in a DELETE → *record r has no field id* | renamed to `v_row` |
| `from public.my_learning_assignments m` (missing parens) → *relation does not exist* | `public.my_learning_assignments() m` |

**Logic defects**

| Issue | Root cause | Fix |
|---|---|---|
| `create temporary table pool` collided when two sessions assembled in one transaction | temp table outlives the statement | `if to_regclass('pg_temp.pool') is not null then execute 'drop table pool'; end if;` — a catalog check rather than `drop table if exists`, to avoid a NOTICE on every call |
| **Assembler refused a legitimate blueprint:** *"the definition asks for 5 item(s) including 1 safety-critical, and the difficulty mix leaves no room"* | filling the difficulty mix **first** left no room for INV-10's safety-critical minimum | reordered so the safety-critical minimum is satisfied **first**, and its picks count toward their own difficulty bands |
| `array_to_string('{}', '; ')` returns `''`, not NULL, so `assert_telemetry_write_only`'s `detail` was empty on success | `coalesce` cannot distinguish them | explicit `case when ok then … else … end` |

**Fixture and harness defects — fixed in the fixture, never in the gate**

| Issue | Fix |
|---|---|
| the fixture tripped `IMPLAUSIBLE_DISTRACTOR` (mixed-length options on a comparison item) | **the item was rewritten**, four short numeric options. The quality gate was not weakened |
| `APPROVED requires a known author` — the seed has no auth context | explicit `author_person_id` on modules, lessons and items |
| `misconception_taxonomy_pkey` collision on re-seed | codes suffixed with the institution slug tail |
| **`answer_paper()` answered zero items and the test still passed** — it ran as the learner role, which cannot read `items`/`item_options` | made `SECURITY DEFINER`, **and** `if n = 0 then raise exception` so a silent zero-answer run can never pass again |
| `permission denied for function option_display_order` in the harness | added `selftest.pick_position()`, `SECURITY DEFINER` |
| **F03-S01 false positive** — it flagged the engine module's own *prose mention* of the service client | tightened to `from\s+["']@/lib/supabase/service["']` |
| **F02-T16 went red** after the telemetry writers landed (*"3 function(s) in public read telemetry"*) | updated to the narrowed INV-11 rule via `assert_telemetry_write_only()`, and the change documented openly rather than quietly |
| lint `react-hooks/set-state-in-effect` ×2 | assist/levels state keyed by item id; mount replay deferred with `setTimeout(…, 0)`; `answerOf` inlined into `choose` |

**Found by CI (1)**

**F03-T07 was drawing-dependent.** CI drew a five-item post-test carrying **three**
safety-critical items; flipping all three scored 0.4, below the 0.6 pass mark — so
the attempt failed on the *score* and the safety gate was no longer what refused
it. **The test's own guard caught this and went red rather than claiming a pass it
had not demonstrated — the guard was the part working.** INV-10's claim is that *a*
safety-critical item answered wrong fails the attempt, so the test now flips exactly
one: 4/5 = 0.8 always clears any mark this fixture sets. **No product change** — the
engine refused correctly in both runs.

**Environmental (1)** — the local Postgres 16 scratch cluster went down on a
container restart; restarted with `pg_ctl`. Nothing in the product.

## C.4 Mini audit (the phase prompt's four questions) — no findings

Run against a clean-database replay of all 34 migrations with both seeds.

| Question | Result |
|---|---|
| **Answer-key leakage, incl. AI contexts** | Six functions in `public` read `is_correct`. **Four are executable by no client role at all** (`content_canonical_payload`, `enforce_taught_content_immutable`, `grade_response`, `session_misconceptions`). Two are reachable by `authenticated`: `run_mcq_quality` (FABLE-02's staff quality pass) and `reading_map` — `SECURITY DEFINER`, ownership-checked, projecting objectives, remediation text and page citations, **never an item, an option or a correctness**. A learner reads zero rows of `items` and `item_options`. **No finding** |
| **Duplicate engine** | One `assemble_session`, one `session_paper`, one `grade_response`, one `evaluate_session`, one `finalize_session` — asserted by each migration's own block; one calling module — asserted by `F03-S01`; and a CI red case plants a route that scores outside the engine and requires the check to catch it **by name**. **No finding** |
| **Telemetry joins** | `assert_telemetry_write_only()` clean: no view depends on telemetry, no function reads it (FROM/JOIN/UPDATE/DELETE or dynamic SQL), no client role holds a grant or schema `USAGE`. **No finding** |
| **Learner routes without middleware** | Seven learner page routes, none in the proxy's `PUBLIC_PATHS`; `F03-R01` confirms over HTTP. **No finding** |

**Client write path on evidence:** `anon` and `authenticated` hold **no** INSERT,
UPDATE or DELETE on `assessment_sessions`, `presented_items`,
`presented_item_views`, `responses`, `assessment_results`, `lesson_progress`,
`assistance_grants`, `integrity_signals`, or either telemetry table. Every write
goes through a `SECURITY DEFINER` function that derives the learner from the JWT.

**Schema lint:** `tables_without_rls` 0 · `policies_using_true` 0 ·
`secdef_without_search_path` 0 · `functions_executable_by_anon` 0 ·
`anon_table_grants` 0 · `anon_public_surface` 1 (the published lesson view) ·
`anon_public_view_write_grants` 0 · `audit_log_client_write_grants` 0 ·
`public_buckets` 0 · `client_storage_policies` 0.

## C.5 Deliberately **not** done

- `MCQ_MULTI` aggregate handling in FABLE-02's `service_item_statistics` /
  `service_distractor_uptake` — a real gap, **recorded for FABLE-06**, which owns
  those `service_role`-only views. Scoring is unaffected.
- OD-8 (scorer contracts beyond `exact_option`/`set_match`), OD-10 (certificate
  template), OD-1, OD-5, OD-9 — left where they belong.
- **The SYNTHETIC → OFFICIAL evidence question.** FABLE-03 correctly operates on
  SYNTHETIC evidence. No evidence was marked OFFICIAL, monotonicity was not
  weakened, and certificate eligibility was not changed. **This blocks FABLE-04 and
  is an architectural decision, not something to improvise around when a test
  won't go green.**

---

# D. FABLE-03 — tests performed and results

## D.1 The suite

**15 new acceptance ids**, in three runners, all wired into the same strict
manifest as FABLE-01 and FABLE-02 (`selftest/manifest.json` v3, 72 ids). The
database runner is `selftest/db/fable03.sql` (730 lines) with its own fixture
helpers: `cycle_fixture()`, `purge_cycle_evidence()`, `age_item_view()` (fast-forwards
the server clock for the hesitation window), `answer_paper()` and `pick_position()`.

## D.2 Results — CI run 28, canonical `main`, strict mode

https://github.com/yazidmanan2409/pintar40/actions/runs/34725201075

| Id | Result | Evidence line, verbatim from the run |
|---|---|---|
| **F03-T01** | **PASS** | pre → peta → pelajaran → post → hasil completed for an email learner and a classroom-card learner; four sessions, two people, full provenance, SYNTHETIC throughout |
| **F03-T02** | **PASS** | post-test of 5 items shares no item and no sibling with the 5-item pre-test; the exclusion names 7 item(s) |
| **F03-T03** | **PASS** | every delivered payload carries only the allow-listed keys; a learner reads zero item and zero option rows |
| **F03-T04** | **PASS** | a closing assignment window accepts the next answer and starts nothing new; an ended enrolment refuses the next scored action |
| **F03-T05** | **PASS** | an identical replay is acknowledged into one row, a different answer on the same receipt is refused, a new sequence appends; a returning client reads 5 items and 2 answers back from the server |
| **F03-T06** | **PASS** | 3 then 1 then 5 leaves the learner at 5; a resume never shows less than what was recorded |
| **F03-T07** | **PASS** | score 0.8000 clears the 0.6 mark and the attempt still fails: one of the paper's 2 safety-critical item(s) answered wrong |
| **F03-T08** | **PASS** | the window holds to the second; three levels opened and 4 telemetry event(s) written; both attempts score 1.0000 |
| **F03-T09** | **PASS** | 15 served assistance string(s) and every review line are clean; every authored string on every item of all 2 delivered type(s) passes the doctrine scanner and the INV-02 check; a planted forbidden word is still caught |
| **F03-T10** | **PASS** | a second learner is refused on both the write and the read path; the stored score 1.0000 equals a fresh recomputation; a duplicate finalize observes one root result |
| **F03-S01** | **PASS** | exactly one module calls the engine's RPCs, and it holds no privilege of its own (30 file(s) outside the engine, 2 inside) |
| **F03-S02** | **PASS** | no authoring field is allow-listed, and the SQL allow-list and the TypeScript type agree (29 authoring column(s) against 4 allow-listed key(s)) |
| **F03-S03** | **PASS** | the assistance context equals the sanitized item and refuses an authoring row; no provider in the boundary |
| **F03-R01** | **PASS** | an anonymous request is sent to sign in and keeps its destination; a signed-in learner reaches their assigned cycle |
| **F03-R02** | **PASS** | no learner route shows a lifecycle enum, an evidence class, a version string or a release hash (5 learner route(s) scanned) |

### Full-suite summary line, verbatim

```
72 passed, 0 failed, 0 skipped, 0 contract problem(s) → GREEN
```

### All eight CI jobs

| Job | Result |
|---|---|
| `install · lint · typecheck · build` | success |
| `migrations · clean database + seed` | success |
| `migrations · previous schema → HEAD (upgrade path)` | success |
| `red case · static-duplicate-engine` | success — the INV-26 check caught the planted second engine |
| `red case · static-permissive-policy` | success |
| `red case · static-raw-evidence-read` | success |
| `red case · db-table-without-rls` | success |
| `selftest contract (strict, local stack)` | success |

**Zero skips in strict mode.** Every id ran; none was excused by a manifest
justification.

## D.3 What the tests did *not* cover, stated plainly

- **Offline assistance behaviour** (§6, "assistance requires connectivity") is a
  property of the design rather than a separate test: the client never decides when
  help is due, it asks the server, so an unreachable server offers nothing. `F03-T08`
  proves the server side of the same rule — the window holds to the second.
- **Real hosted sign-in** is still unexecuted from a build session (SI-01, carried
  from FABLE-01); the app runner covers it against a real local Supabase stack in CI
  instead.
- **A Layer-3 independent/adversarial audit** has not been performed for any phase.

## D.4 Post-integration verification (this session)

- **Integration:** fast-forward into `main`, **no merge commit**; `git log --merges`
  still empty; no history rewritten; no applied migration edited.
- **Hosted development** brought to 34 migrations, with 0030–0034 byte-identical to
  their repository files, and correspondence proven against the **schema** rather
  than the history: a clean local replay and the hosted database produce the same
  1 239-line object inventory across tables, views, columns, enums, functions,
  policies, triggers and client grants — digest `4af4ccbe95175602a8236f7127ab8cd5`
  on both sides.
- **One recorded observation:** 13 of the 29 FABLE-01/02 migrations still carry
  *recorded text* that differs from their repository file, from the path by which
  they were first applied. They are left untouched — an applied migration is never
  edited — and the inventory above is the demonstration that the divergence is in
  the recorded text, **not** in the schema it produced.

---

## Summary of counts

| | FABLE-01 | FABLE-02 | FABLE-03 |
|---|---|---|---|
| Migrations | 13 (0001–0013) | 16 (0014–0029) | 5 (0030–0034) |
| Acceptance ids | 31 | 26 | 15 |
| Issues found | 13 | 2 | 27 |
| Fixed | 9 + 1 security remediation | 2 | 27 |
| Open | 3 (HA-01, HA-02, build-SHA provenance) | 0 | 0 defects; 1 architectural decision blocks FABLE-04 |

**Current state of canonical `main`:** 34 migrations, 72/72 acceptance ids green,
8/8 CI jobs green, every schema-lint counter at its required value, hosted
development synchronized and proven identical.

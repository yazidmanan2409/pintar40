# ADR-0001 — Foundation: identity, hierarchy, authorization, audit, storage

**Date:** 2026-09-12
**Phase:** FABLE-01
**Status:** Accepted (phase still open — see docs/CHECKPOINT-FABLE-01.md)

## Problem
The first schema must express Person-centred identity, dated enrollment/
membership history, transfer, a single fail-closed authorization primitive,
an append-only audit trail and a closed-by-default storage/RLS baseline
(docs/rebuild/02, 03, 04, 05, 16) in a form later phases can build on
without reopening.

## Considered options
- A. One `org_nodes` table for the whole hierarchy with a `uuid[]` ancestor
  path, vs. B. one table per level with recursive joins.
- A. Learners authorized via Enrollment/Membership; staff via Role
  Assignments, vs. B. a single grants table for everyone (the 3.0 shape).
- A. Policy helpers that receive row values, vs. B. helpers that re-read the
  row by id.
- A. Effective-privilege verification (`has_function_privilege`), vs. B.
  checking explicit grants only.

## Decision
A in every case. `org_nodes` with `jalur uuid[]` maintained by trigger and
cascaded on move; `persons` carries no institution/class column; Enrollment
and Membership are dated append-only rows; Transfer is a lifecycle with a
record-class registry and `portable_visibility`; `has_scope` /
`can_on_node` / `is_member_of_institution` / `person_visible_to_me` /
`enrollment_readable` / `membership_readable` are SECURITY DEFINER, pinned
`search_path`, fail closed, and are the only authority used by RLS and by
the application server; `audit_log` refuses UPDATE/DELETE by trigger for
every role including the owner; the `assets` bucket is private with zero
client storage policies; every function in `public` is unexecutable by
`anon`, and `authenticated` may execute only an explicit RPC allow-list.

## Reason
INV-13, 14, 15, 16, 17, 18, 21, 23, 25, 36, 37; Lessons 1, 2, 11, 12.
Role assignments expire by `valid_until` evaluated on every check (no job
needed for correctness; a scheduled sweep is optional housekeeping).

## Calm-surface check
Users see "Konfigurasi", institutions, "aktif/nonaktif", "Semua pemeriksaan
lolos"; no lifecycle enum, evidence class, version string or "PINTAR 4.0" is
rendered (HLE throws if one would reach a learner/public surface). Rigor is
entirely in the database.

## Consequences
- The database is the authority; UI display role is never trusted.
- Cross-tenant reads of a learner's *later* records at another institution
  are impossible by construction (found and fixed in this phase — below).
- Two helper functions per readable table is the pattern later phases must
  follow for policies that need joins.

## Findings recorded during the phase (doc 16 §5–7)
1. **Supabase security advisor:** Postgres grants EXECUTE to PUBLIC on new
   functions, so `anon` inherited RPC access despite direct revokes; the
   migrations' own checks looked at explicit grants. Fixed forward in
   `function_privileges` with effective-privilege verification. The 14
   remaining advisor warnings are the intended `authenticated` RPC
   allow-list; each RPC enforces its own authorization — **accepted**.
2. **Selftest F01-T02 on re-run:** after a transfer, the sending
   institution's admin could read the learner's new enrollment at the
   receiving institution (policy keyed on person visibility, not row
   institution). Fixed forward in `tenant_scoped_reads`.
3. **Stop-patch-loop applied:** the first fix (`read_helpers`) re-read the
   row by id inside the policy and failed `INSERT … RETURNING` (row not yet
   visible to the helper's snapshot). Root cause: policies must not re-read
   their own row. Corrected in `read_helpers_by_value`; the by-id helpers
   were dropped. This is the pattern for all future policy helpers.
4. **Selftest F01-R01 (first run of the app runner):** `/api/dev/*`
   answered 401 in the production build because the route proxy refused
   anonymous `/api/*` before the dev handler's 404 — revealing that the
   namespace exists. Fixed in `src/proxy.ts`: the dev namespace is passed
   through and its handler alone decides (404 outside development).
5. **Selftest F01-S05 (first run of the static runner):** this ADR lacked
   the doc 13 "Affected components" section. Added.
6. **Mini audit:** `service_role` held UPDATE/DELETE/TRUNCATE on `audit_log`
   through Supabase's default privileges. The trigger already refused them
   (T11), but an immutable table carries two locks: revoked in
   `audit_log_no_service_writes`; the lint now counts `service_role`.
7. **Mini audit:** the throwaway `selftest.*` helpers had a mutable
   `search_path`; pinned. The magic-link origin fell back to an empty
   string; `appUrl()` now fails loud (env contract).
8. **Build SHA provenance (§8):** over PostgREST each request is its own
   transaction, so `audit_write` reads the SHA from the `x-pintar-build`
   request header (PostgREST `request.headers`) when `app.build_sha` is not
   set, shape-validated. A direct API caller could stamp a different SHA on
   the rows *its own request* produces; the value is provenance, never
   authority. Recorded as an accepted limitation; T19 proves capture and
   rejection of malformed values.

9. **Hosted Auth, bounded sessions (HA-01) — accepted limitation, not a
   satisfied requirement.** FABLE-01 §2 was written as "idle auth sessions
   expire after 24h". That is **not currently enforced** and must not be
   claimed as satisfied. Three separate reasons, each independently
   sufficient:
   - The Supabase development project `sknixmwkynzmrgbxzrvb` belongs to an
     organisation on the **Free** plan. Supabase gates session-lifetime
     controls — inactivity timeout, time-box, single-session-per-user — to
     **Pro plans and up**. The control is unavailable, not merely unset.
   - `[auth.sessions] inactivity_timeout = "24h"` in `supabase/config.toml`
     configures a **local** `supabase start` stack. It is not evidence of
     hosted enforcement and must never be cited as such.
   - Even on a plan that offers it, Supabase's semantics are **not a hard
     kill at exactly 24 hours**: sessions are evaluated at token refresh and
     are cleaned up progressively for up to 24 hours *after* crossing the
     threshold. A requirement phrased as an exact expiry cannot be met by
     this mechanism alone.

   **Production gate (not waived, not weakened):** before any real-user
   production launch PINTAR must have an approved bounded-session and
   inactivity control — either the Supabase plan that provides it natively,
   or a compensating control approved at architecture level (for example a
   short `jwt_expiry` with a server-side session register consulted on
   refresh, or application-enforced idle expiry backed by an auditable
   server-side check). Until one of those exists and is verified against the
   hosted project, §2 remains **open**, and the shortfall is a plan/platform
   limitation rather than an implementation defect.

10. **Hosted Auth, password credentials (HA-03) — earlier justification
    withdrawn.** The mini audit dismissed disabled leaked-password
    protection on the grounds that "no PINTAR user chooses a password". The
    hosted project contradicts the premise: all nine `auth.users` rows carry
    a bcrypt `encrypted_password` seeded by `supabase/seed/synthetic.sql`,
    every one is `provider: email`, and the acceptance suite authenticates
    with `signInWithPassword`. Password credentials are in use on this
    project today. The authentication mechanism for **real** learners and
    staff remains a product and authentication-policy decision and is not
    settled by this ADR; what is settled is that the previous justification
    is void: leaked-password protection must be carried as a real
    requirement rather than argued away. Whether it can be *enabled* is a
    separate question, answered in finding 12.

11. **Hosted test artifact (SEC-01) — removed.** The throwaway `selftest`
    schema was found live on the hosted project with `USAGE` granted to
    `anon` and `authenticated` (Supabase grants these on schemas created by
    `postgres`) and all four helpers executable by `authenticated`. Because
    `selftest.as_owner()` is SECURITY INVOKER and begins with `reset role`,
    and `authenticator` is a member of `service_role`, every precondition
    for an RLS-bypass escalation was present; only reachability (PostgREST
    exposes `public, graphql_public` by default) stood in the way. Dropped
    with `drop schema selftest cascade` over the management channel — not as
    a migration, since the schema is a validation artifact created outside
    the production migration chain and dropping it must not become part of
    that chain. This also explains, with evidence, why the harness reported
    21/21 on the hosted project while a clean CI database failed (CI-01).

12. **Hosted Auth, leaked-password protection (HA-02) — plan/platform
    limitation, open as a production gate.** The security advisor reports
    `auth_leaked_password_protection` disabled on
    `sknixmwkynzmrgbxzrvb`. The product owner verified directly in the
    Supabase Dashboard that the control is offered on **Pro and up** and is
    not available to this project, whose organisation is on **Free**.

    It is therefore classified as a **plan/platform limitation**, not a
    hosted configuration defect, and it must **not** be described as an
    available Free-tier toggle — an earlier revision of the mini audit said
    exactly that and was wrong. Nothing is misconfigured; the feature is
    absent at this tier.

    This does not weaken the requirement. Finding 10 withdrew the argument
    that nobody uses a password, and that withdrawal stands: password
    credentials are in use on this project today. Combining the two, the
    requirement is real and currently unmeetable, which is a gate rather
    than a defect.

    **Production gate (not waived, no substitute):** before any real-user
    production launch, leaked-password protection — or an
    architecture-approved equivalent control — must be **available and
    enabled** for the project serving real users. No compensating or
    substitute control has been introduced in its place merely to obtain a
    green status, and none should be, because a weaker check reported as
    equivalent would be worse than an openly recorded gap. HA-02 stays
    **open** as a production-readiness gate.

13. **Classroom-card pepper (CARD-01) — fixed, with one forward note.** The
    synthetic pepper was 21 characters while `src/lib/env.ts` requires >= 32
    outside development and the selftest app runs under
    `NODE_ENV=production`, so every card sign-in threw in the production-mode
    build. Nothing caught it because nothing exercised the path. Lengthened in
    `supabase/seed/synthetic.sql` and `.github/workflows/ci.yml` (they must
    match — the seed derives the card password from it), and proved by
    F01-R06. **Forward note, not designed here:** `CARD_PEPPER` is an input to
    every stored card secret, so changing it once real learners hold cards
    requires a controlled credential migration/rotation, not an edit.

## Traces to
- Requirement: docs/rebuild/02 §Organisation, §Identity; 04 §3–3c; 05; 16 §1–5
- Architecture: INV-13/14/15/16/17/18/21/23/25/36/37
- Implementation: supabase/migrations/20260912{004158…051935}_*.sql (13);
  src/lib/{env,auth,hle,card}.ts; src/lib/supabase/*; src/proxy.ts;
  src/app/{page,masuk,konfigurasi,api/assets,api/dev}
- Test: selftest/manifest.json — db F01-T01…T19 (selftest/db/fable01.sql), static F01-S01…S05 (selftest/static.test.ts), app F01-R01…R04 (selftest/app.test.ts)
- Audit evidence: docs/audit/FABLE-01-mini-audit.md; advisor output
  2026-09-12; green db runs on the live project; mutation checks
  (USING(true) → T02/T03/T07/T13 red; injected migration → S01/S02 red)
- Patent/innovation register entry: none supplied

## Affected components
- `supabase/migrations/*` (the eleven foundation migrations) and
  `supabase/seed/synthetic.sql` (persona harness).
- `src/lib/env.ts` (environment contract), `src/lib/auth.ts` (authority
  calls into the database primitives), `src/lib/hle.ts` (Human Language
  Engine), `src/lib/card.ts` (classroom-card secret derivation),
  `src/lib/supabase/{client,server,service}.ts`, `src/proxy.ts` (route
  protection).
- `src/app/{page,masuk,auth/callback,keluar,konfigurasi}` and
  `src/app/api/{assets,dev}`.
- `selftest/` (contract manifest and the db, static and app runners).

## Affected database objects
Tables: platform_environment, audit_log, institutions, academic_periods,
org_nodes, classes, persons, accounts, enrollments, memberships,
role_assignments, record_class_registry, portable_visibility, transfers,
feature_flags, platform_config; view my_profile; functions as listed in
the Decision plus `audit_write` (header-sourced build SHA) and
`platform_schema_lint`; storage bucket `assets`.

## Security implications
Stated throughout; no client role can read or write outside RLS; no
service-role key exists client-side (`server-only` guard); dev tooling
404s outside development; seeds refuse production and require declared
synthetic intent.

## Future constraints
- Phase 2 evidence tables must reuse the helper-by-value pattern.
- `--pintar-primary` in globals.css is PROVISIONAL until copied from the
  established PINTAR brand assets (open item; not an architecture change).
- Migrations are named by the versions recorded in the database
  (management channel assigns them); repo filenames were aligned to match.

## Tests proving the decision
F01-T01…T19 (db runner), F01-S01…S05 (static runner), F01-R01…R04 (app
runner; R02–R04 execute only where network/CI facilities exist — see checkpoint).

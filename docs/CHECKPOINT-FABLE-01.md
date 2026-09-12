# CHECKPOINT — FABLE-01 (Foundation), updated 2026-09-12 ~12:30 Asia/Jakarta

**Phase state: PASS — FROZEN at `570c77d`, CI run #7 green, selftest 31/31,
0 failed, 0 skipped.** Reopened only if a later phase exposes a genuine defect.
FABLE-02 is now in progress on top of it; its own state lives in
`docs/phases/FABLE-02-PROMPT.md` and the migration series from
`20260912112712` onward.
Governing architecture: PINTAR 4.0 Architecture Baseline (frozen). Phase
prompt: `FABLE-01-FOUNDATION-PROMPT.md` (synchronized). Governing
principle: calm on the surface, rigorous underneath.

Second session (resumed from the 01:20 checkpoint via
`pintar40-fable01-checkpoint.tgz`; the restored history was verified
against the live database before any work). Everything in §5 of the
previous checkpoint that could be completed without the external gates has
been completed. What remains is listed in §6 and is external to the
repository.

## 1. Where things live

| Thing | Location |
|---|---|
| Local repository (linear `main`, all work committed) | cloud workspace `/home/claude/pintar40`; archived as `pintar40-fable01-checkpoint.tgz` (includes `.git`; excludes node_modules/.next/.env.local) |
| GitHub remote | `github.com/yazidmanan2409/pintar40` — **still unreachable from the session** (external gate, §6); `origin` configured; nothing pushed yet |
| Supabase project | `pintar`, ref `sknixmwkynzmrgbxzrvb`, org ZAYD, ap-southeast-1, free tier, Postgres 17 |
| Supabase URL | `https://sknixmwkynzmrgbxzrvb.supabase.co` (anon key via the Supabase tools; `.env.local` is gitignored) |
| Architecture package | PINTAR project docs `01`–`16`, `FABLE-00`–`06`, freeze record |
| Mini-audit record | `docs/audit/FABLE-01-mini-audit.md` |

## 2. Migrations applied to the Supabase project (13, verified, in this order)

| Version | Name | Content |
|---|---|---|
| 20260912004158 | foundation_base | pgcrypto; closed-by-default grants; `platform_environment`; roles; `audit_log` + `audit_write` |
| 20260912004244 | organisation | institutions, academic_periods, `org_nodes` + `jalur`, classes |
| 20260912004321 | identity_enrollment | persons, accounts, enrollments, memberships, `members_of_node_at` |
| 20260912004431 | authorization | role_assignments + guard; primitives; `grant_role`/`revoke_role`; `my_profile`; RLS |
| 20260912004527 | transfer_rollover | record classes, portable visibility, transfers + RPCs, `period_rollover` |
| 20260912004550 | storage_config | private `assets` bucket, feature_flags, platform_config |
| 20260912004654 | function_privileges | EXECUTE revoked from PUBLIC; RPC allow-list; `search_path` pinned |
| 20260912004845 | schema_lint | `platform_schema_lint()` |
| 20260912010009 | tenant_scoped_reads | enrollment/membership reads scoped by institution |
| 20260912010100 | read_helpers | superseded by next |
| 20260912010155 | read_helpers_by_value | policy helpers take row values (stop-patch-loop root cause) |
| **20260912050956** | **build_sha_from_request** | `audit_write` reads `x-pintar-build` from PostgREST `request.headers` when `app.build_sha` is unset; shape-validated; probe in verification block |
| **20260912051935** | **audit_log_no_service_writes** | mini-audit fix: `service_role` UPDATE/DELETE/TRUNCATE revoked on `audit_log`; lint counts `service_role` |

Repo files `supabase/migrations/<version>_<name>.sql` match exactly.
**Rule:** apply new migrations through `apply_migration`, then name the
repo file by the version the database recorded — never edit an applied
migration (CI's upgrade-path job now enforces byte-identity of applied
migrations).

Also present (non-migration, throwaway): schema `selftest` (helpers now
with pinned `search_path`; grants to anon/authenticated for impersonation).
**Drop before any production use.** Synthetic seed applied once; the seed
file is unchanged.

## 3. Selftest status

`npm run selftest` (strict) and `npm run selftest:local` (accepts skips
that carry a manifest justification) run exactly `selftest/manifest.json`
(v2, 35 ids — 31 FABLE-01 plus F02-T01..T04) through three runners:

- **db** (`selftest/db/fable01.sql`, F01-T01…T19 + T13b = 21 rows):
  **GREEN on the live project** after migration 13, via role impersonation
  on the management channel. New this session: **T19** (build SHA stamped
  from the request header; malformed header rejected).
- **static** (`selftest/static.test.ts`, S01–S05): **GREEN**. Red-ability
  proven: an injected `USING (true)` migration turns S01/S02 red.
- **app** (`selftest/app.test.ts`): **R05 is new this pass** — sign-out and
  session invalidation against real GoTrue (refresh token refused after
  `POST /keluar`, previously authenticated browser redirected, unrelated
  session untouched). **R01 GREEN** against the production
  build (anonymous `/konfigurasi` → redirect, `/api/assets/*` → 401,
  `/api/dev/*` → 404, public copy clean). **R02/R03 not executed** (network
  gate); **R04 not executed** (CI gate). All three carry manifest
  justifications; the strict run is RED until CI executes them.
- Defects found by the new runners and fixed forward: `/api/dev/*` was 401
  (proxy) instead of 404; ADR lacked "Affected components".
- **CI-01 (found by CI Run #1, fixed forward):** the db runner assumed
  `authenticated`/`anon` could re-enter schema `selftest`, which a clean
  database does not grant, so it could switch role once and never back —
  `permission denied for schema selftest` at F01-T03. Green on the live
  project only because that database already carried the grant as ambient
  state. `selftest/db/fable01.sql` now states the privileges it needs; see
  `docs/audit/FABLE-01-mini-audit.md` § CI-discovered defects.
- `npm run lint`, `npm run typecheck`, `npm run build`: pass (9 routes).

## 4. FABLE-01 requirement status

| § | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Next.js/TS/Tailwind project | COMPLETE | |
| 1 | Supabase project, `.env.example` | COMPLETE | |
| 1 | One GitHub trunk from commit one; PR flow | **BLOCKED (external)** | linear `main`, 12 commits, unpushed |
| 1 | Lockfile; `npm ci` | COMPLETE | |
| 1 | CI: lint, typecheck, selftest, schema-lint, clean + upgrade-path migrations, broken-PR check | **WRITTEN, NOT EXECUTED** | `.github/workflows/ci.yml` + `.github/actions/local-stack`; red-case matrix runs on every CI run; first real broken PR pending push |
| 1 | One linear migration history | COMPLETE | 13 migrations |
| 1 | Selftest manifest + `npm run selftest` | COMPLETE (code) | strict exit rules per doc 16 §4 |
| 1 | `docs/adr/` with ADR-0001 | COMPLETE | 8 findings recorded |
| 1 | Design tokens | COMPLETE (one open item) | `--pintar-primary` PROVISIONAL |
| 1 | Feature flags | COMPLETE | now surfaced in Config Studio |
| 2 | Person / Account / photo path; card account | COMPLETE | |
| 2 | Auth: magic link + card PIN; 24h idle | IN PROGRESS | code built, not exercised end-to-end against hosted (network gate); `[auth.sessions] inactivity_timeout = "24h"` in `config.toml` configures the local stack only; the hosted controls (24h idle HA-01, leaked-password protection HA-02) are Pro+ and unavailable on this Free project — open gates, not settings left unset |
| 2 | Synthetic tenants, seed guard, persona harness | COMPLETE | |
| 3 | Hierarchy, periods, enrollment/membership, rollover | COMPLETE | rollover now in Config Studio |
| 3a | Transfer domain | COMPLETE (policy OD-9) | request/authorize/execute/reject in Config Studio; destination references entered as codes (tenant isolation) — the exchange mechanism is an OD-9 item |
| 4 | Roles, capabilities, primitives, anti-escalation | COMPLETE | grant/revoke in Config Studio |
| 5 | Tenant isolation | COMPLETE | |
| 6 | RLS baseline; black-box tests | COMPLETE (db) / REST pending | R02/R03 written |
| 7 | Private bucket; server-only routes; two-lock assertion | COMPLETE (code) / R03 pending | |
| 8 | Append-only audit; action coverage; commit SHA | **COMPLETE** | T19; service_role grants revoked |
| 9 | HLE skeleton + copy inventory test | **COMPLETE** | S04; staff strings added |
| 10 | Config Studio shell; placeholders; reserved boundaries | **COMPLETE** | rollover/transfers/roles/audit/flags wired; `src/{integrations,care,ai-gateway}` README stubs |
| 11 | Dev-only tooling 404 | **COMPLETE** | R01 proves it in the production build |
| — | Acceptance checklist as selftest contract | COMPLETE (code) / partially executed | see §3 |
| — | Mini audit (doc 16 §5) | LAYERS 1–2 DONE; LAYER 3 PENDING | `docs/audit/FABLE-01-mini-audit.md`; 3 findings fixed forward |

## 5. Next actions when resuming (in order)

1. **When the GitHub gate clears:** `git push -u origin main` (no rewrite);
   watch the first CI run (five jobs); fix anything CI finds *forward*.
2. Open one deliberately broken PR (e.g. a migration with `using (true)`),
   confirm red, close it; record the run URL in the mini-audit record.
3. **When network to the project exists** (or in CI): confirm R02/R03 green
   as real HTTP calls; exercise magic-link and card sign-in end to end.
4. Hosted Auth settings pass. Both items are **Pro+ features not available
   on the current Free project**: the 24h inactivity timeout (HA-01) and
   leaked-password protection (HA-02). Neither is a toggle waiting to be
   flipped, so this step is a plan/architecture decision first — obtain the
   plan that carries them, or get an equivalent control approved at
   architecture level — and a settings pass second. Record what was
   decided and what was actually set.
5. Layer-3 independent/adversarial audit by a separate session/reviewer
   with no shared context, against `docs/audit/FABLE-01-mini-audit.md`.
6. Drop schema `selftest` from the hosted project before any production
   use (CI recreates it on the local stack every run).
7. Only after 1–5: phase-gate report; then FABLE-02.

## 6. Unresolved external integration gates

- **GitHub push:** cleared. The checkpoint archive was restored and the
  12-commit history pushed to `yazidmanan2409/pintar40`; `main` tracks
  `origin/main`.
- **CI execution:** cleared. Run #1 (`b929c12`) was red on CI-01 (harness
  defect, fixed forward); run #2 (`da41bd3`) is green on all six jobs with
  the strict selftest at 29/29, 0 skipped — R04 included.
- **Deliberately broken PR:** cleared. PR #1 from
  `verify/fable01-broken-pr` (`1008592`) added one permissive
  `using (true)` policy on `public.persons`; CI run 34683448686 went red on
  the upgrade-path db contract with `policies_using_true: 1`, and the PR
  was closed unmerged. `main` never carried the defect. The remote branch
  still needs deleting by hand — the build session's proxy refuses ref
  deletion. Details in `docs/audit/FABLE-01-mini-audit.md`.
- **Network to Supabase from the session:** egress denies `*.supabase.co`;
  no Docker for a local stack. DB-layer verification continues through the
  management channel.
- **Hosted Auth settings:** the project's org is on the **Free** plan.
  Inactivity/session-lifetime controls are Pro+, so the FABLE-01 §2 24h
  idle expiry is **not enforced and must not be claimed as satisfied**
  (ADR-0001 finding 9); `supabase/config.toml` configures only the local
  stack. Leaked-password protection is **unavailable on the Free plan**
  (Pro+ only; Dashboard-verified by the product owner), so it too is a
  plan/platform limitation rather than a toggle left off — and the old
  "nobody uses a password" justification is withdrawn, so the requirement
  stands (ADR-0001 findings 10 and 12). Both remain open production gates;
  no substitute control has been introduced for either.
- **Real sign-in against the hosted project:** never executed — the build
  session's egress policy denies `*.supabase.co`, and `auth.sessions` there
  is empty. Covered against a real local stack in CI instead.
- **Hosted `selftest` schema:** removed (`drop schema selftest cascade`) —
  it had `USAGE` for `anon`/`authenticated` on the hosted project. Details
  in `docs/audit/FABLE-01-mini-audit.md`.

FABLE-01 cannot be declared complete while these are open.

## 7. Git

Linear `main`, working tree clean at checkpoint. Commits this session, on
top of `46db15d`:

- `b5041fb` selftest contract: static + app runners, manifest v2
- `912f5b6` CI workflow: clean + upgrade-path migrations, red cases, strict selftest
- `2c24898` reserved module boundaries
- `2da0345` Config Studio: rollover, transfers, roles, audit reader, flags
- `982569f` audit rows carry the build SHA per request (migration 12, T19)
- `9bcf77c` 24h auth inactivity timeout in config.toml
- `b929c12` mini audit: audit_log service_role grants revoked
  (migration 13), selftest search_path pinned, fail-loud app URL, audit
  record, ADR findings 6–8, this checkpoint
- `da41bd3` CI-01: the db runner's privilege assumptions on schema
  `selftest` stated in `selftest/db/fable01.sql`
- `2ea6437` verification evidence for CI run #2 and the deliberately
  broken PR #1 (documentation only — the defect was never on `main`)
- `881269e` auth correction pass: hosted `selftest` schema dropped
  (SEC-01), F01-R05 sign-out/session-invalidation coverage (SI-02),
  password-auth documentation corrected (HA-03), bounded-session
  limitation and production gate recorded (HA-01)
- `5bbd3c6` HA-02 reclassified as a plan/platform limitation
- `570c77d` CARD-01: synthetic card pepper fixed and card auth proved
  end to end (F01-R06). **FABLE-01 freeze point.**

FABLE-02 from here:

- `15fbb75` migration 1 — content hierarchy, item-type registry, doctrine
  constraints (+ a follow-up closing the default PUBLIC execute grant)
- `b728d26` migration 2 — assessment definitions, releases, allow-list
  state machine
- `e9ad92a` migration 2 repaired in place; its behavioural proof moved to
  `selftest/db/fable02.sql` (ADR-0003)
- (this commit) ADR-0003 and this checkpoint

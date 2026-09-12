# CHECKPOINT — FABLE-01 (Foundation), updated 2026-09-12 ~12:30 Asia/Jakarta

**Phase state: IN PROGRESS. Not complete. Phase gate not reached.**
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
(v2, 29 ids) through three runners:

- **db** (`selftest/db/fable01.sql`, F01-T01…T19 + T13b = 21 rows):
  **GREEN on the live project** after migration 13, via role impersonation
  on the management channel. New this session: **T19** (build SHA stamped
  from the request header; malformed header rejected).
- **static** (`selftest/static.test.ts`, S01–S05): **GREEN**. Red-ability
  proven: an injected `USING (true)` migration turns S01/S02 red.
- **app** (`selftest/app.test.ts`): **R01 GREEN** against the production
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
| 2 | Auth: magic link + card PIN; 24h idle | IN PROGRESS | code built, not exercised end-to-end (network gate); `[auth.sessions] inactivity_timeout = "24h"` in `config.toml`; hosted setting is Pro-plan/Dashboard (gate) |
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
4. Hosted Auth settings pass (Dashboard): inactivity timeout 24h (plan
   permitting), leaked-password protection; record what was set.
5. Layer-3 independent/adversarial audit by a separate session/reviewer
   with no shared context, against `docs/audit/FABLE-01-mini-audit.md`.
6. Drop schema `selftest` from the hosted project before any production
   use (CI recreates it on the local stack every run).
7. Only after 1–5: phase-gate report; then FABLE-02.

## 6. Unresolved external integration gates

- **GitHub push:** cleared. The checkpoint archive was restored and the
  12-commit history pushed to `yazidmanan2409/pintar40`; `main` tracks
  `origin/main`.
- **CI execution:** cleared. Run #1 executed on `b929c12` and was red on
  CI-01 (harness defect, fixed forward). R04 still needs a green run.
- **Network to Supabase from the session:** egress denies `*.supabase.co`;
  no Docker for a local stack. DB-layer verification continues through the
  management channel.
- **Hosted Auth settings:** Pro-plan features / Dashboard only.

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
- (this commit) CI-01: the db runner's privilege assumptions on schema
  `selftest` stated in `selftest/db/fable01.sql`

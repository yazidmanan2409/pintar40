# CHECKPOINT — FABLE-01 (Foundation), paused 2026-09-12 ~01:20 Asia/Jakarta

**Phase state: IN PROGRESS. Not complete. Phase gate not reached.**
Governing architecture: PINTAR 4.0 Architecture Baseline (frozen). Phase
prompt: `FABLE-01-FOUNDATION-PROMPT.md` (synchronized). Governing
principle: calm on the surface, rigorous underneath.

## 1. Where things live

| Thing | Location |
|---|---|
| Local repository (linear `main`, all work committed) | cloud workspace `/home/claude/pintar40` — see §7 for the commit list |
| GitHub remote | `github.com/yazidmanan2409/pintar40` — **unreachable from this session** (external gate, §6) |
| Supabase project | `pintar`, ref `sknixmwkynzmrgbxzrvb`, org ZAYD, region ap-southeast-1, free tier ($0/month), Postgres 17 |
| Supabase URL | `https://sknixmwkynzmrgbxzrvb.supabase.co` (anon key in `.env.local`, gitignored; obtainable again via the Supabase tools) |
| Architecture package | PINTAR project docs `01`–`16`, `FABLE-00`–`06`, freeze record |

## 2. Migrations applied to the Supabase project (all verified, in this order)

| Version | Name | Content |
|---|---|---|
| 20260912004158 | foundation_base | pgcrypto; closed-by-default grants + default privileges; `platform_environment`; roles enum; `role_rank`, `role_capabilities`; append-only `audit_log` + `audit_write` |
| 20260912004244 | organisation | `institutions`, `academic_periods` (append-only), `org_nodes` with `jalur` + chain/period triggers + cascade on move, `classes` lifecycle |
| 20260912004321 | identity_enrollment | `persons` (no institution/class column), `accounts`, `enrollments` + `memberships` (dated, append-only, audited), `members_of_node_at` |
| 20260912004431 | authorization | `role_assignments` + anti-escalation guard; `current_person_id`, `is_system_admin`, `has_scope`, `can_on_node`, `is_member_of_institution`, `person_visible_to_me` (fail-closed); `grant_role`/`revoke_role`; `my_profile`; `on_auth_user_created`; RLS policies for all tables |
| 20260912004527 | transfer_rollover | `record_class_registry`, `portable_visibility`, `transfers` lifecycle + RPCs (`transfer_request/authorize/execute/reject`), `period_rollover` |
| 20260912004550 | storage_config | private `assets` bucket (zero client policies), `feature_flags` + `flag_enabled`, `platform_config` |
| 20260912004654 | function_privileges | **advisor finding fix:** revoke EXECUTE from PUBLIC on all functions; default privileges; explicit `authenticated` RPC allow-list; `search_path` pinned on every function; effective-privilege verification |
| 20260912004845 | schema_lint | `platform_schema_lint()` RPC (SYSTEM_ADMIN only) |
| 20260912010009 | tenant_scoped_reads | **selftest finding fix:** enrollment/membership reads scoped by owning institution (was leaking a transferred learner's new enrollment to the sending institution) |
| 20260912010100 | read_helpers | SECURITY DEFINER helpers to remove policy recursion (superseded by next) |
| 20260912010155 | read_helpers_by_value | **root-cause fix (stop-patch-loop):** helpers take row values, never re-read the row; by-id helpers dropped |

Repo files `supabase/migrations/<version>_<name>.sql` match these versions
exactly. **Rule for resuming:** apply new migrations through the same channel
(management tools `apply_migration`), then rename the repo file to the
version the database recorded — never edit an applied migration.

Also applied (non-migration, throwaway): schema `selftest` with
`as_user/as_anon/as_owner/run_fable01` + `grant usage on schema selftest to
anon, authenticated; grant execute on all functions in schema selftest to
anon, authenticated`. Drop this schema before any production use.

Synthetic seed applied once (`supabase/seed/synthetic.sql`): institutions
`synth-alpha-20260912004….`, `synth-beta-…`; nine personas (passwords in the
seed file; card 7001 / PIN 2468; pepper `synthetic-card-pepper`).

## 3. Selftest status

- **DB runner (`selftest/db/fable01.sql`, F01-T01…T18 + T13b = 20 rows):
  GREEN, three consecutive runs (0 failures each) on the live project via
  role impersonation (`set local role authenticated` + `request.jwt.claims`,
  the same mechanism PostgREST uses).**
- **Red-ability proven:** a temporary `USING (true)` policy on `persons`
  (rolled back) turned T02, T03, T07, T13 red.
- Two genuine defects were found by the suite and fixed forward (migrations
  010009 → 010155); recorded in ADR-0001 §Findings.
- Supabase security advisor: 0 `anon` findings, 0 mutable `search_path`;
  14 remaining = intended authenticated RPC allow-list (accepted, ADR-0001).
- `npm run lint`, `npx tsc --noEmit`, `npm run build`: all pass (11 routes,
  proxy active).
- **Not yet written:** `selftest/static.test.ts` (F01-S01…S05) and
  `selftest/app.test.ts` (F01-R01…R04); `npm run selftest` script; CI
  workflow. See §5.

## 4. FABLE-01 requirement status

| § | Requirement | Status | Notes |
|---|---|---|---|
| 1 | New Next.js/TS/Tailwind project | COMPLETE | Next 16.3.5, App Router, `src/` |
| 1 | New Supabase project, `.env.example` placeholders | COMPLETE | ref above; `.env.example` committed, `.env.local` ignored |
| 1 | One GitHub trunk from commit one; PR flow | IN PROGRESS / BLOCKED | linear `main` exists locally; push blocked (§6) |
| 1 | Lockfile; `npm ci` works | COMPLETE | `package-lock.json` committed |
| 1 | CI: lint, typecheck, selftest, schema-lint, clean + upgrade-path migrations; broken-PR check | NOT STARTED | `supabase/config.toml` prepared (seed path set); `.github/workflows/ci.yml` not written |
| 1 | One linear migration history; no manual production SQL | COMPLETE | 11 migrations, each with verification block |
| 1 | Selftest manifest | IN PROGRESS | `selftest/manifest.json` written; only the db runner exists |
| 1 | `docs/adr/` with ADR-0001 | COMPLETE | `docs/adr/0001-foundation.md` |
| 1 | Design tokens | COMPLETE (one open item) | `src/app/globals.css`; `--pintar-primary` PROVISIONAL until copied from brand assets |
| 1 | Feature-flag mechanism | COMPLETE | `feature_flags`, `flag_enabled` |
| 2 | Person / Account / photo path; classroom-card account type | COMPLETE | card secret derivation `src/lib/card.ts`; seed uses same |
| 2 | Auth: magic link + card PIN; 24h idle | IN PROGRESS | `/masuk` + actions + `/auth/callback` + `/keluar` written and build; **not exercised end-to-end** (network gate); 24h idle expiry not yet configured (Supabase auth setting) |
| 2 | Synthetic tenants, non-prod seed guard, persona harness skeleton | COMPLETE | seed applied; T12 proves guard |
| 3 | Hierarchy with `jalur`, Academic Periods, Enrollment, Membership lifecycles, rollover | COMPLETE | T08/T09/T15 |
| 3a | Transfer domain (lifecycle, record classes, execution, policy hooks → OD-9) | COMPLETE (policy config pending OD-9) | T10 |
| 4 | Role Assignments, capabilities, fail-closed primitive pair, anti-escalation, `CAN_QUICK_ASSESSMENT` rename | COMPLETE | T04/T05/T06/T07 |
| 5 | Tenant isolation | COMPLETE | T02/T03; cross-tenant leak found & fixed |
| 6 | RLS baseline, `ALTER DEFAULT PRIVILEGES`, `search_path`, black-box tests | COMPLETE (db layer) | REST-level black-box execution pending gate |
| 7 | Private bucket, server-only signed upload/read routes, two-lock assertion | COMPLETE (code) / IN PROGRESS (verification) | routes written; anon HTTP fetch test pending gate |
| 8 | Append-only audit trail, action coverage, commit SHA | COMPLETE | T11; `PINTAR_BUILD_SHA` stamped via `app.build_sha` setting (server wiring of the setting per request NOT yet done) |
| 9 | Human Language Engine skeleton + copy inventory test | IN PROGRESS | `src/lib/hle.ts` with runtime guard; static test not written |
| 10 | Config Studio shell with System & Configuration wired; placeholders; reserved boundaries | IN PROGRESS | `/konfigurasi` renders institutions, health (lint), environment; refusal for lower roles; rollover/transfer/RBAC admin actions **not yet surfaced in UI**; `integrations/`, `care/`, `ai-gateway/` module boundaries **not yet reserved** |
| 11 | Dev-only tooling 404 outside development | COMPLETE (code) | `/api/dev/[[...tool]]`; production-build check pending REST runner |
| — | Acceptance checklist as selftest contract | IN PROGRESS | db items green; static/REST/CI items planned |
| — | Mini audit (doc 16 §5) | NOT STARTED | advisor pass done; formal dangerous-pattern search not run |

## 5. Next actions when resuming (in order)

1. Write `selftest/static.test.ts` (S01–S05) and `selftest/app.test.ts`
   (R01 offline-capable; R02–R03 need network), plus `scripts/run-selftest.*`
   and `npm run selftest` / `selftest:local`.
2. Write `.github/workflows/ci.yml`: `npm ci` → lint → tsc → build →
   `supabase start` → `supabase db reset` (migrations + synthetic seed) →
   psql `selftest/db/fable01.sql` → node tests → upgrade-path job
   (merge-base migrations, then HEAD migrations) → broken-PR check.
3. Reserve module boundaries (`src/integrations/`, `src/care/`,
   `src/ai-gateway/` with README stubs only).
4. Config Studio: surface period rollover, transfer request/authorize,
   role grant/revoke (calling the existing RPCs), audit reader.
5. Wire `app.build_sha` per request (`set_config` via RPC or connection
   option) so audit rows carry the commit SHA.
6. Configure auth idle expiry (24h) in the Supabase auth settings.
7. Mini audit per doc 16 §5, then the phase-gate report — **only after the
   external gate (§6) is cleared and the REST/CI runners have executed.**

## 6. Unresolved external integration gate

- **GitHub push:** `git push -u origin main` fails with the git proxy's own
  message: *"yazidmanan2409/pintar40 is not in this session's authorized
  repository set, so the proxy will not inject a credential for it. To fix,
  add the repository to the session's sources."* The repo was attached
  through a read-only GitHub App integration (Claude Design Import), which
  does not add it to the session's **sources**. Resolution is on the
  session/app side (add the repository as a source with push access); no
  files are to be transferred manually. Until then the linear `main` lives
  in the cloud workspace and in the checkpoint archive
  `pintar40-fable01-checkpoint.tgz` (includes `.git`; excludes
  node_modules/.next/.env.local). `origin` is already configured.
- **CI execution:** depends on push.
- **Network to Supabase from this container:** the organization egress
  policy denies `*.supabase.co`; Docker is unavailable, so no local stack.
  DB-layer verification was done through the management channel; REST/app
  runners cannot execute here.

FABLE-01 cannot be declared complete while this gate is open.

## 7. Git

Linear history on `main` (see `git log --oneline`). Working tree clean at
checkpoint. `.env.local` is ignored and contains only the anon key and the
synthetic pepper.

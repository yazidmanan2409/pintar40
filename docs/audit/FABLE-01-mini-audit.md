# FABLE-01 mini audit (doc 16 §5–6) — 2026-09-12

**Scope:** the FABLE-01 foundation as of repository HEAD and Supabase
project `sknixmwkynzmrgbxzrvb` (13 applied migrations).
**Layers (doc 16 §5):** 1 builder verification — done; 2 automated
verification — done for db + static + R01 (see limits); 3 independent /
adversarial audit — **not yet performed** (requires a reviewer or a separate
session with no shared context; see "Gate status").

## Dangerous-pattern search (doc 16 §5), result per pattern

| Pattern | Method | Result |
|---|---|---|
| Permissive RLS (`USING (true)`) | S02 over every `.sql` (comments/strings stripped); live `pg_policies` | 0 / 0 |
| Client-side service role | S03 bundle scan (`.next/static`), import-graph, secret-read locations | 0; only `src/lib/env.ts` reads `SUPABASE_SERVICE_ROLE_KEY`; service client imported only under `src/app/api/` |
| Answer-key leakage | n/a in Phase 1 (no item tables) | — |
| Public storage | live `storage.buckets.public`; storage policies | 0 public buckets; 0 policies on `storage.objects` |
| Hardcoded credentials | grep for JWTs, `sb_secret_`, `sb_publishable_`, key names in `src`, `supabase`, `selftest`, `.github` | none; synthetic persona passwords live only in the guarded seed (INV-21) |
| Dummy production fallbacks | grep `process.env.X ?? "…"` | **finding 3** (fixed): magic-link origin fell back to `""`; now `appUrl()` fails loud. `CARD_EMAIL_DOMAIN` default is a non-secret host name — accepted |
| Anonymous privileged uploads | live policies; R03 (pending network); T14 | no client path; upload/read only via server routes |
| Unsafe `SECURITY DEFINER` (unpinned `search_path`) | live `pg_proc.proconfig`; advisor | 0 in `public`; **finding 2** (fixed): 4 throwaway `selftest.*` helpers were unpinned — now pinned |
| Duplicate engines / legacy routes | route inventory (`next build` output: 9 routes) | none |
| TODO / bypass security comments | grep `TODO|FIXME|bypass|skip auth|hack|disable rls` | none (one match is the S05 check itself) |
| Unversioned scoring | n/a in Phase 1 | — |
| Provider concepts in the domain model | grep `openai|anthropic|gemini|gpt-|claude` in `src`, `supabase`, `selftest` | none in domain/app code; `config.toml` carries Supabase Studio's own `openai_api_key = "env(OPENAI_API_KEY)"` (local Studio feature, excluded in CI) — accepted |
| Privileged data in learner-assistance contexts | n/a in Phase 1 | — |
| Raw-evidence reads in analytics paths | n/a in Phase 1 | — |
| Internal version strings on user surfaces | S04 (HLE render + JSX text scan), R01 (rendered `/` and `/masuk`) | none |
| Second migration series | S01; `delivery-*`/`handoff-*` folder search | exactly `supabase/migrations`; none |
| Append-only audit, two locks | live `role_table_grants`, trigger (T11) | **finding 1** (fixed): `service_role` held UPDATE/DELETE/TRUNCATE on `audit_log` by Supabase default privileges; revoked in `20260912051935_audit_log_no_service_writes`; lint now counts `service_role` |

## Supabase security advisor (live, after fixes)

- `function_search_path_mutable`: 0 after pinning the `selftest.*` helpers
  (they are dropped before any production use in any case).
- `authenticated_security_definer_function_executable`: 17 — the intended
  RPC allow-list (`current_person_id`, `is_system_admin`, `has_scope`,
  `can_on_node`, `is_member_of_institution`, `person_visible_to_me`,
  `enrollment_readable`, `membership_readable`, `flag_enabled`,
  `grant_role`, `revoke_role`, `transfer_request/authorize/execute/reject`,
  `period_rollover`, `platform_schema_lint`). Each enforces its own
  authorization and fails closed (T04–T07, T13b). **Accepted** (ADR-0001
  finding 1; count was 14 before the by-value read helpers and the lint RPC).
- `auth_leaked_password_protection`: disabled. No PINTAR user chooses a
  password (magic link; classroom-card secrets are server-derived), so this
  does not gate Phase 1. Noted for the Auth settings pass (external gate).

## Findings this audit (all fixed forward)

1. `service_role` write grants on `audit_log` — migration
   `20260912051935`; lint extended; T13 would now catch a regression.
2. Unpinned `search_path` on `selftest.*` helpers — pinned in
   `selftest/db/fable01.sql` and on the live schema.
3. Magic-link origin fallback to empty string — `appUrl()` fails loud.

Earlier in the phase (ADR-0001 §Findings): advisor EXECUTE-to-PUBLIC (fixed
in `function_privileges`), cross-tenant enrollment read after transfer (fixed
in `tenant_scoped_reads`), policy self-read stop-patch-loop (fixed in
`read_helpers_by_value`), `/api/dev/*` 401-instead-of-404 (fixed in
`src/proxy.ts`), ADR missing "Affected components" (fixed).

## Evidence

- DB runner: 21/21 green on the live project after migration 13
  (F01-T01…T19, T13b, DONE), run via the management channel.
- Static runner: S01–S05 green; red-ability proven by an injected
  `USING (true)` migration (S01/S02 red).
- App runner: R01 green against the production build (anonymous refusal,
  404 on `/api/dev/*`, public copy clean). R02/R03 require network to the
  project; R04 requires a CI run.
- Advisor output and live structural counts recorded above, 2026-09-12.

## Gate status

The FABLE-01 gate is **not closed**. Open items, all external to the
repository:

1. GitHub push (`yazidmanan2409/pintar40` not in the session's authorized
   sources) → CI has never executed → R04 has no evidence; the first
   deliberately broken PR has not been opened.
2. Network to the Supabase project from the build session → R02/R03 not
   executed as real HTTP calls (their DB-layer counterparts T02/T03/T06/T14
   are green).
3. Independent/adversarial audit (layer 3) not yet performed.
4. Hosted Auth settings: 24h inactivity timeout (Pro-plan setting; encoded
   in `supabase/config.toml`), leaked-password protection.
5. Drop schema `selftest` before any production use.

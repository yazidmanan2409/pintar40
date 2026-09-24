# L3-F01 — synthetic credentials on a hosted environment

**Raised by:** Layer-3 (independent audit, Doc 16 §5), 2026-09-16.
**Class:** security / evidence-integrity boundary defect. **Status:** repaired and verified.
**Not a core-build feature gap** — a seed-boundary defect that spanned FABLE-01 → FABLE-06.

## The finding

`supabase/seed/synthetic.sql` carries plaintext persona passwords as tracked
literals (e.g. `sysadmin` = `'Sintetis-Sys-91!'`, `supabase/seed/synthetic.sql:39`,
introduced in commit `5732324` and never changed). Those identities were **live on
the hosted development project** `sknixmwkynzmrgbxzrvb`: eight password-enabled,
confirmed Auth identities, one of them `sysadmin@synthetic.pintar.test` holding
**SYSTEM_ADMIN at global scope**, unexpired to 2036.

**Root cause.** The seed's INV-21 guard refused only `platform_environment.environment
= 'production'`. That column is migration-seeded `'development'` identically on local,
CI and hosted (`20260912004158_foundation_base.sql:34`), so the guard was a denylist
that is empty by default: a hosted **development** project satisfied it and the seed
created real credentialed identities there. The only compensating control was a prose
instruction — *"Drop before any production use"* (docs/CHECKPOINT-FABLE-01.md) — which
was never executed. No automated gate watched for {tracked credential} × {hosted
privileged identity}.

The live-login step was **not** performed (cancelled by the safeguard); the finding
rests on the resident identity + tracked credential + fail-open guard, all measured.

## Remediation (this repair)

- **A — removal.** All nine synthetic-seed Auth identities deleted from hosted
  (`delete from auth.users where email like '%synthetic.pintar.test'`), cascading to
  `auth.*` and `public.accounts`. Verified: 0 Auth identities, 0 accounts, 0 privileged
  role assignments reachable through any login; `audit_log` preserved (append-only).
  Residual: 9 login-less persons and 2 synthetic institutions remain as inert
  SYNTHETIC-class data (removing them is a large NO-ACTION cascade, out of this bounded
  scope, and structurally excluded from OFFICIAL analytics by INV-20).
- **B — fail-closed.** Migration `0084` adds `platform_environment.local_fixtures_enabled`
  (a **separate** marker, default **false** — not the dev/prod axis) and
  `synthetic_fixtures_permitted()`. All four credential-bearing seeds (`synthetic`,
  `learning_cycle`, `official_bootstrap`, `human_evaluation`) refuse unless the marker is
  set. It is set only by `supabase/seed/00_local_fixtures.sql`, run first in the
  `config.toml [db.seed]` pipeline — which **hosted never executes**. A migrations-only
  database (i.e. every hosted project) keeps it false and every credential seed refuses.
- **C — detection.** `F06-S07` (static) proves every credential seed is guarded, the
  enabler runs first and creates nothing, and no workflow file seeds a hosted project.
  `F06-N05` (db) proves the predicate is fail-closed on the live schema. Both are watched
  to fail in `db-fable06-gates` / `static-fable06-gates`. `docs/audit/hosted-credential-audit.sql`
  is the mechanical hosted check (CI cannot reach hosted).

## The honest limit

No in-SQL signal distinguishes a local Supabase stack from a hosted project — same
image, roles, extensions (measured). The fix removes the fail-**open** default that let
the incident happen with **no deliberate act at all**; it does not defend against a human
who deliberately runs the local enabler on hosted too. The enforcing control there is the
hosted credential audit (C.2) plus removal, not the in-SQL guard.

## Seed-to-hosted reconciliation (corrects the blanket "seeds are not applied to hosted")

| seed | creates credentials? | ever applied to hosted? | current hosted state |
|---|---|---|---|
| `synthetic.sql` | yes (8 incl. global SYSTEM_ADMIN) | **yes, FABLE-01, never dropped** | **removed** (L3-F01 A); refused going forward (0084) |
| `learning_cycle.sql` | yes (2) | no | absent; refused going forward |
| `official_bootstrap.sql` (D1) | yes (4 incl. bootstrap admin) | no | absent; refused going forward |
| `human_evaluation.sql` | yes (1 evaluator) | no | absent; refused going forward |

**Current intended hosted state:** schema only. Migrations 0001–0084 applied
byte-identically; the one migration-created non-synthetic tenant `pintar-kanonik`
(canonical content, no Auth identity) remains; **zero** `*.pintar.test` Auth identities;
`local_fixtures_enabled = false`; `synthetic_fixtures_permitted() = false`.

# #150 — Backup and disaster-recovery review, 5 Oct 2026 (DRAFT: sections 3, 5 and 8 wait for the rehearsal's output)

**Owner's order (5 Oct):** after C-12 and ENGINEERING COMPLETE, examine backup and disaster recovery against PINTAR 4.0's
actual hosted architecture and configuration: not whether a backup mechanism exists, but whether there is a credible,
testable recovery path if production data or infrastructure is lost, corrupted, accidentally changed or unavailable.
Mandatory before production (D-098(d)). **No product change was made for this review.**

**How it was examined.** The repository (workflows, migrations, configuration, decisions, the release record);
Supabase's own documentation; and one executed rehearsal on **staging only**
(`.github/workflows/restore-rehearsal.yml`, read-only on staging: Supabase's backup facts, a logical backup by the
documented CLI procedure, a restore into an empty stack on the runner, and a table-by-table and fact-by-fact
comparison; only counts, hashes and yes/no facts printed; the backup discarded with the runner).
**Production was not read or touched** (standing rule; JOURNEY-LOG item 16: reading production's settings waits for
the owner's permission). Every production statement below is therefore from the repository's record or from the plan's
documented behaviour, and says so.

---

## 1. The hosted architecture (what there is to lose)

| Component | Production | Staging | Where its definition lives |
|---|---|---|---|
| Database, Auth, Storage | Supabase `pintar-production` (`trtlvibiybwixfumjrrx`), ap-southeast-1, **Pro plan, Micro compute**, Postgres 17.6.1.166 (RELEASES.md, 24 Sep). 111 migrations, last `20261005120000`; app `5b5b68d` (GO-LIVE, 23 Sep; unchanged since). Holds 1 person, 1 auth user, 2 schools, 0 sessions, 0 certificates, 0 cards (PHASE-1-STATUS). | Supabase `pintar-staging` (`keijhmdtsgrfvnvocfvk`), Pro, Micro, Postgres 17.6.1.166, **161 migrations** (run 37376829025). Synthetic data (D-064), including the Golden School's sealed certificates and cards. | Schema: `supabase/migrations` (forward-only, D-026). Auth settings: `supabase/auth-identitas.json` and the configure workflows. |
| Application | Vercel `pintar40`, `app.pintarselalu.com`, region sin1, deployed only by `deploy-vercel-production.yml` from a pinned release. | Vercel `pintar40-staging`, `staging.pintarselalu.com`, Git-connected to `main`. | Git (`main`), the deploy workflows. |
| Runtime secrets | Vercel environment of `pintar40`: Supabase URL and keys (rewritten every deploy), **`CARD_PEPPER` and `CERT_SECRET_KEY_V1`** (minted once by the deploy workflow, "added only when absent"), SMTP. | Vercel environment of `pintar40-staging`, set by hand. | Nowhere else (by design: "a secret the database can read is a secret a database backup carries"). |
| Deploy credentials | GitHub repository secrets (`PRODUCTION_SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROD_DB_PASSWORD`, `VERCEL_TOKEN`, `PINTAR_SMTP_PASSWORD`, …). Not readable back from GitHub. | `STAGING_SUPABASE_*`. | GitHub. |
| Domain and mail | Namecheap PremiumDNS (`app`, `staging` CNAME to Vercel; MX, SPF, DKIM, DMARC); Namecheap Stellar Business mail host for `noreply@` (both Supabase Auth projects and PINTAR's own sender). Hosting subscription expires **2 Nov 2026** (auto-renew on). | the same | GATE-0-FACTS §4. |
| Lesson sources | — | — | `docs/onboarding/konten/` (84 files) and `media/*` git branches. |

Single person: the sole production SYSTEM_ADMIN and the holder of every account above is the owner (SYS-08 "a second
SYSTEM_ADMIN": **FAIL**; C-11 break-glass rehearsal: TODO).

## 2. What is backed up, and what is not

| Asset | Backed up? | By what, how often, kept how long | Evidence |
|---|---|---|---|
| Postgres, all schemas (public, auth incl. password hashes and card secrets' bcrypt, storage metadata, audit_log, certificates, migration history) | **By the plan, yes; verified, no.** | Supabase Pro: daily, **7 days**; physical backups for Postgres ≥ 15.8.1.079 (so production's are physical and **not downloadable**). No point-in-time recovery: it is an add-on that **requires at least Small compute**, and D-089(c) keeps production on Micro. | Supabase docs. **Production's actual backup list: not read** (permission). **Staging's: the workflows' token is refused (HTTP 403)** — nobody but the dashboard can currently see them. |
| A copy outside Supabase | **No.** | — | **Deleting a project deletes its backups** (Supabase docs). No `pg_dump`, no off-platform copy anywhere in the repository or its workflows. |
| Storage objects (bucket `assets`: profile photos, lesson media, problem-report screenshots) | **No.** | Database backups hold only their metadata (Supabase docs: "Database backups do not include objects you store via the Storage API"). | Staging holds **28 objects (206 MB)** in Storage that no backup covers (rehearsal). |
| `CARD_PEPPER`, `CERT_SECRET_KEY_V1` | **No verified copy.** | D-066(a) requires verified offline copies before the first production card or certificate; REL-09: **NOT VERIFIED**. | Loss: every card in every school unusable; every certificate signed with V1 fails verification for ever (YAZID-DECISION-BRIEFS 3b). |
| Schema, functions, policies | Yes, as code. | Every change is a migration in git; CI replays all of them on a clean database and checks the upgrade from the previous commit. | `ci.yml`. CI does not test from production's exact level (111). |
| Application | Yes, as code and as Vercel's own deployments. | Rebuilt from a pinned commit by the deploy workflow. | `deploy-vercel-production.yml`. |
| Auth settings, SMTP | Reproducible. | Written by `configure-supabase-auth.yml` / `configure-supabase-smtp.yml` from the repository and GitHub secrets. | `"production_applied": false` in `auth-identitas.json`: production has not yet had Gate 3's settings. |
| DNS and mail-host configuration | Recorded, not backed up. | The records are written down in GATE-0-FACTS §4 (the DKIM private key lives only in the mail host). | — |

## 3. The rehearsal on staging (evidence that a restore can be performed)

**Runs** (all on `main`, read-only on staging): 37377017030 (the backup; the restore step stopped by the workflow's own shell, fixed), 37377920733, 37378809242 (per object, and the corrected step), 37379973507 (the one differing function's text). Staging at 161 migrations, `ACTIVE_HEALTHY`, Postgres 17.6.1.166.

**What Supabase would tell us.** The backup list and the add-ons are **refused (HTTP 403)** to the token the workflows hold: no machine can see staging's backups or whether PITR is on (production's were not asked).

**The logical backup** (Supabase's documented CLI procedure) works: 157 tables, **224–253 s**, about **25 MB** (data 20.9 MB, migration history 3.1 MB, schema 1.3 MB); no table changed on staging while it ran. `pg_dump` warns of circular foreign keys on 15 tables (handled by the documented `session_replication_role = replica`).

**The documented restore fails outright.** `psql --single-transaction … roles.sql schema.sql data.sql` stops at `roles.sql:17: permission denied for parameter log_min_messages`, and the single transaction restores **nothing**. Followed to the letter, Supabase's procedure does not restore PINTAR.

**Restored with errors tolerated** (5 s; 7 errors: that role parameter, five Auth objects of a newer Auth version than the CLI's local stack carries, and a newer Storage column, which loses the `assets` bucket's row):

| | Result |
|---|---|
| Data | **150 of 157 tables byte-identical** (row count and content hash): every PINTAR table in `public` and `telemetry`, `auth.users` and the other Auth data, the migration history. The 7 others are Supabase's own version tables, empty newer-version Auth tables, and `storage.buckets` (the `assets` row). |
| Kept | row security on every `public` table; all 131 policies; all 143 `public` triggers; PostgREST's pre-request on `authenticator`; the extensions; Storage **metadata** (staging: **28 objects, 206 MB**); `launch-readiness.sql` 0 FAIL. |
| **Lost** | **PINTAR's three triggers on `auth.users`** — account creation, the **password-write guard** (Gate 3, D-101, D-102) and the **card-email guard**. The schema backup contains none of them (Supabase leaves `auth` out; its docs say changes to `auth` "have to be restored separately"). |
| **Opened** | **Every privilege.** On the copy, `anon` and `authenticated` hold SELECT, INSERT, UPDATE and DELETE on **all 137** `public` tables and views (on staging `anon` holds none and `authenticated` only what each needs), and EXECUTE on **all 490** `public` functions: **280 that no client may call on staging** (among them `audit_write`, `auth_password_write_guard`, `certificate_prepare`, `bootstrap_first_system_admin`, `card_signin_settle`, `assume_persona`) and 210 that only a signed-in caller may call, now open to anonymous callers too. |
| Changed | one function's definition, `content_canonical_payload` (the content seal's payload): FUNCTION_DIFF |

**Why the privileges open.** A Supabase project's default privileges grant `anon` and `authenticated` every right on every object `postgres` creates in `public`. PINTAR revokes them explicitly in each migration (ADR-0021; D-033), but a dump records each object's rights only relative to Postgres's own defaults, so nothing revokes what the new project's defaults just granted. Row security still filters rows (which is why the readiness check reads 0 FAIL), but SECURITY DEFINER functions do not pass through it, and every internal one becomes callable by anyone at `/rest/v1/rpc`. **PINTAR's own readiness check does not detect this.**

**The corrected step, proven.** Recreating the three `auth.users` triggers from the source's own catalog (`pg_get_triggerdef`, read-only on staging) brings them back: the copy then reads `same` for them. The privileges were **not** corrected in the rehearsal: that is a proposal (§8), not something this review built.

**Not rehearsed:** Supabase's own physical restore (in place, or "Restore to a new project"). It copies the database as it is, so it should keep the triggers and the rights; whether it does is unproven (§8 G2).

## 4. Recovery objectives (as the configuration stands)

| Scenario | RPO (data lost) | RTO (time to service) | Why |
|---|---|---|---|
| Bad migration, accidental change or corruption, project intact | up to **24 h** (the last daily backup), plus everything since | the in-place restore's downtime (proportional to size; production is tiny today) plus detection and decision — **unmeasured: never rehearsed on a hosted project** | daily backups only; no PITR; the production apply workflow takes **no backup and records no restore point before `db push`**, although its own plan calls for one (APPLY-AND-STAMP-PLAN step "Back up") |
| Supabase project deleted, account lost or provider outage | **everything** | **undefined** | backups are deleted with the project; no off-platform copy |
| Storage object deleted or bucket lost | **everything in Storage** | — | no Storage backup at all |
| `CARD_PEPPER` or `CERT_SECRET_KEY_V1` lost (Vercel env or project lost) | every card and every certificate | — | no verified copy; and see §5 H1 |
| Vercel project lost | none (stateless) | a redeploy, minutes — **but see §5 H1** | |
| Mail host lost | none | until a new SMTP host is configured on both Auth projects and in Vercel; sign-in by emailed code stops meanwhile | single mail provider; hosting renews 2 Nov |
| Detection | — | unbounded | no monitoring or alerting (PROJECT-REALITY-AUDIT: "There is none") |

## 5. Hazards found in the recovery path itself

- **H4. The documented logical restore opens every privilege** (§3): all 137 tables and views to `anon` and `authenticated`, all 490 functions to `anon`, including 280 internal ones. Silent: row security, the policies and the readiness check all look healthy.
- **H5. The documented logical restore drops PINTAR's three `auth.users` triggers**, the password-write guard among them. Silent.
- **H6. The documented logical restore does not run**: it stops at a role parameter the project may not set, and its single transaction restores nothing. A person following Supabase's page under pressure meets a failure, then (by the troubleshooting advice) an unguarded tolerant restore that produces H4 and H5.
- **H7. `docs/audit/launch-readiness.sql` cannot see H4 or H5**: it checks row security and policies, not grants, `anon`'s rights, or the `auth.users` triggers.

- **H1. A rebuilt Vercel project silently re-keys PINTAR.** `deploy-vercel-production.yml` mints `CARD_PEPPER` and
  `CERT_SECRET_KEY_V1` whenever Vercel does not already hold them (`keep`: "added only when absent"). After losing the
  Vercel project or its environment, the ordinary deploy would succeed and mint **new** values: every existing card
  would stop opening and every existing certificate would stop verifying, with no error anywhere. Harmless today
  (production holds 0 cards and 0 certificates); permanent once it holds any.
- **H2. No restore point before a production migration.** The apply workflow runs `supabase db push` with no backup
  step and no recorded backup identifier, although APPLY-AND-STAMP-PLAN makes "Back up" its step 1. Migrations are
  forward-only with no down-migration, so the restore is the only undo, and with daily backups it can cost up to a day.
- **H3. Nobody can see the backups by machine.** The staging token is refused the backup list (HTTP 403); production's
  has never been read. The backups' existence, kind and age are an assumption until someone looks.

## 6. Single points of failure

1. One Supabase project per environment holding both the data and its only backups (deleted together).
2. Two secrets with no verified copy, and a deploy path that replaces them silently (H1).
3. One person holding every account and the only production SYSTEM_ADMIN role (SYS-08 FAIL; C-11 break-glass TODO).
4. One mail host and one mailbox password shared by staging and production.
5. No monitoring: a loss is noticed when someone reports it.
6. GitHub holds the only copy of the deploy credentials (secrets cannot be read back; each must be re-issued at its source if GitHub is lost — recoverable, but slow).

## 7. The responsible recovery sequence (the runbook this review proposes; none of it executed on production)

1. **Declare and freeze.** The owner decides; stop writes with PINTAR's own maintenance control (#148: a planned window, or Admin platform's «Hentikan sekarang») so nothing is written on top of the damage.
2. **Choose the restore point** (the last good daily backup before the damage) and record it.
3. **Restore the database**: in place from the dashboard (downtime), or to a new project ("Restore to a new project": database and Auth users; **not** Storage, Auth settings or API keys). **Never Supabase's logical CLI procedure as written** (H4–H6); a logical restore only through G3's PINTAR procedure.
4. **Verify before reopening**: migration history equals the release's; `audit/restore/banding.sh` against the last facts taken from the source shows no difference in data, rights, triggers or pre-request; `docs/audit/launch-readiness.sql` all PASS (with G7's rows); row counts of the key tables against the last known figures; one certificate verifies by its token; one class card signs in; one staff sign-in.
5. **Reconnect** (new project only): `configure-supabase-auth.yml`, `configure-supabase-smtp.yml`, then `deploy-vercel-production.yml` (new URL and keys) — **with `CARD_PEPPER` and `CERT_SECRET_KEY_V1` restored from their offline copies first**, never minted (H1).
6. **Storage**: restore objects from their off-platform copy (none exists today).
7. **Reopen**, end the maintenance window, tell the schools what was lost (the window between the restore point and the damage), and record it in RELEASES.md and the journey log.

## 8. Gaps to close before production (each a proposal; none implemented)

Ordered by what must close before production; each is the smallest change that closes it.

| # | Gap | Proposed remediation | Whose |
|---|---|---|---|
| G1 | Production's backups are unverified (kind, age, retention, PITR). | The owner reads production's Database → Backups page once (read-only), or gives a read-only token the backups permission; recorded in RELEASES.md. | Owner |
| G2 | No hosted restore has ever been performed; RTO unknown. | One rehearsal of Supabase's own **"Restore to a new project"** from staging's latest backup: a temporary Micro project, compared with staging by `audit/restore/fakta.sql` and `banding.sh` (data, rights, triggers, pre-request, bucket), timed, then deleted. Billable for its hours; needs the owner's approval. | Owner approves; coordinator runs |
| G3 | No copy outside Supabase (a deleted project or lost account loses the backups too). | A scheduled, encrypted logical backup to storage outside Supabase (custody the owner's), **and** a PINTAR restore procedure that (a) skips the reserved role parameter, (b) recreates the `auth.users` triggers, (c) re-applies every object's rights exactly as the source holds them (revoke `anon`, `authenticated`, PUBLIC; grant the source's ACLs), and (d) must pass `banding.sh` with no differences before anything reopens. Never Supabase's procedure as written (H4–H6). | Owner decides where; coordinator builds |
| G4 | Storage objects are in no backup. | Copy the `assets` bucket's objects on the same schedule as G3 (staging: 28 objects, 206 MB; production: none today). Before any real photo, lesson media or screenshot reaches production. | Coordinator |
| G5 | The two durable secrets have no verified copy, and a rebuilt Vercel project re-keys silently (H1). | D-066's offline copies made and verified (REL-09) before the first production card or certificate; and the deploy workflow refuses to mint `CARD_PEPPER` or `CERT_SECRET_KEY_V1` when the database already holds cards or certificates (fail closed). | Owner (copies); coordinator (workflow) |
| G6 | No restore point before a production migration (H2). | The apply workflow records the latest backup's identifier (or takes G3's backup) before `db push`, and refuses to apply without one. | Coordinator |
| G7 | The readiness check is blind to H4 and H5. | Add rows to `launch-readiness.sql`: `anon` holds no table right and no EXECUTE in `public`; EXECUTE for `authenticated` only on functions `client_rpc_registry` declares; the three `auth.users` triggers present; the pre-request set. Then any restore, and any drift, shows as FAIL. | Coordinator |
| G8 | RPO is up to 24 h; PITR is not possible on Micro. | Owner's decision: accept 24 h (with G3 more often than daily if wanted), or Small compute plus the PITR add-on (Supabase's prices: about USD 100 a month for 7 days, plus the compute). | Owner |
| G9 | Recovery depends on one person (SYS-08 FAIL, C-11 TODO). | A second SYSTEM_ADMIN and the break-glass rehearsal, as C-11 already plans. | Owner |
| G10 | Nobody is alerted when production fails. | Minimal uptime and error alerting on `app.pintarselalu.com` and the Supabase project. | Owner decides; coordinator sets up |

**Must close before production:** G1, G2, G5, G6, G7, and G3 with G4 before production holds real people's data. G8–G10 are owner decisions that set how much loss and delay is acceptable.

## 9. What this review could not establish

- Production's actual backups (list, kind, age, retention) and whether PITR is on: not read (standing rule).
- Staging's backup list: refused to the workflows' token (HTTP 403).
- A hosted restore (in place or to a new project): not performed — it either rewinds staging (destructive to the Golden School evidence, which "is never reset or deleted") or creates a billable project. Both are the owner's decision.
- Whether offline copies of the two production secrets exist: REL-09 says not verified.

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
| Storage objects (bucket `assets`: profile photos, lesson media, problem-report screenshots) | **No.** | Database backups hold only their metadata (Supabase docs: "Database backups do not include objects you store via the Storage API"). | REHEARSAL_STORAGE |
| `CARD_PEPPER`, `CERT_SECRET_KEY_V1` | **No verified copy.** | D-066(a) requires verified offline copies before the first production card or certificate; REL-09: **NOT VERIFIED**. | Loss: every card in every school unusable; every certificate signed with V1 fails verification for ever (YAZID-DECISION-BRIEFS 3b). |
| Schema, functions, policies | Yes, as code. | Every change is a migration in git; CI replays all of them on a clean database and checks the upgrade from the previous commit. | `ci.yml`. CI does not test from production's exact level (111). |
| Application | Yes, as code and as Vercel's own deployments. | Rebuilt from a pinned commit by the deploy workflow. | `deploy-vercel-production.yml`. |
| Auth settings, SMTP | Reproducible. | Written by `configure-supabase-auth.yml` / `configure-supabase-smtp.yml` from the repository and GitHub secrets. | `"production_applied": false` in `auth-identitas.json`: production has not yet had Gate 3's settings. |
| DNS and mail-host configuration | Recorded, not backed up. | The records are written down in GATE-0-FACTS §4 (the DKIM private key lives only in the mail host). | — |

## 3. The rehearsal on staging (evidence that a restore can be performed)

REHEARSAL_RESULTS

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

REHEARSAL_HAZARDS

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
3. **Restore the database**: in place from the dashboard (downtime), or to a new project ("Restore to a new project": database and Auth users; **not** Storage, Auth settings or API keys).
4. **Verify before reopening**: migration history equals the release's; `docs/audit/launch-readiness.sql` all PASS; the auth.users triggers and the authenticator pre-request present (§3); row counts of the key tables against the last known figures; one certificate verifies by its token; one class card signs in; one staff sign-in.
5. **Reconnect** (new project only): `configure-supabase-auth.yml`, `configure-supabase-smtp.yml`, then `deploy-vercel-production.yml` (new URL and keys) — **with `CARD_PEPPER` and `CERT_SECRET_KEY_V1` restored from their offline copies first**, never minted (H1).
6. **Storage**: restore objects from their off-platform copy (none exists today).
7. **Reopen**, end the maintenance window, tell the schools what was lost (the window between the restore point and the damage), and record it in RELEASES.md and the journey log.

## 8. Gaps to close before production (each a proposal; none implemented)

GAPS

## 9. What this review could not establish

- Production's actual backups (list, kind, age, retention) and whether PITR is on: not read (standing rule).
- Staging's backup list: refused to the workflows' token (HTTP 403).
- A hosted restore (in place or to a new project): not performed — it either rewinds staging (destructive to the Golden School evidence, which "is never reset or deleted") or creates a billable project. Both are the owner's decision.
- Whether offline copies of the two production secrets exist: REL-09 says not verified.

# #150 — Backup and disaster-recovery review: examined 5 Oct, closing work 6 Oct 2026

# Part I — Closing #150, 6 Oct

**Owner's order (6 Oct):** close #150 at C-12's evidence standard: G1 read production's backup configuration (read
only); G2 one billable "Restore to a new project" rehearsal from staging, verified, timed, deleted; G5 a safe recovery
mechanism for the two durable secrets, failing safe instead of minting; G6 a recorded restore point before production
migrations; G7 readiness that sees restore drift; G3/G4 a design only; G8 record 24 h RPO as provisional; G9/G10
recommendations and the minimum implementation. "The objective is to prove: PINTAR can be reconstructed safely,
predictably and verifiably after a serious failure. No shortcuts. No paper-only recovery claims."

## Verdict: **NOT PASS**

The objective is to prove that PINTAR can be reconstructed safely, predictably and verifiably after a serious failure.
That is not yet proven. The controls PINTAR itself owns are built and proven (A). The recovery that depends on the
provider and the owner has not been carried out (B), and B is what decides the verdict. ENGINEERING COMPLETE (declared
5 Oct) does not soften this.

### A. Recovery engineering readiness: the controls under PINTAR's own control — implemented and proven

| Control | Proof |
|---|---|
| G5: the production deploy never replaces `CARD_PEPPER` or `CERT_SECRET_KEY_V1` silently | DR-S01..S03, red on the old workflow, green; CI CI_FINAL |
| G6: no production migration without a recorded restore point (a completed backup ≤ 26 h) | DR-S04, DR-S05; CI CI_FINAL |
| G7: readiness sees restore drift by name | DR-D01 (planted drift, CI's database); **on a real restore, rehearsal 37389380945: 7 rows FAIL on the copy, each naming what drifted; staging 24/24 PASS** |
| G10: production is watched from outside, one self-closing issue, off until switched on | DR-S06, which now executes the step under `bash -e`; watch run WATCH_FINAL |
| The rehearsal's own instruments, corrected | the readiness count (`'\| FAIL'` → `^FAIL`); the two stale readiness rows restated; both kept on the record below |
| G8: the RPO decided and recorded | D-103 |
| G3/G4: the off-platform backup designed | `docs/recovery/OFFSITE-BACKUP-DESIGN.md` (design only, as authorised) |

**Not yet built on PINTAR's side:** the PINTAR logical-restore procedure. It must re-apply every object's rights,
recreate the `auth.users` triggers (the step itself is proven) and restore the bucket. It is part of G3/G4 and waits on
the same authorisation. Until then, a logical restore leaves the 6 FAIL rows the rehearsal shows after its corrected
step.

### B. Production recovery readiness: the provider and owner actions — not completed

| # | Blocker | Why it blocks | What clears it |
|---|---|---|---|
| B1 | **G2: no hosted restore performed; RTO unmeasured** | Supabase's "Restore to a new project" is the production recovery path. Whether it keeps PINTAR's triggers, rights, pre-request and bucket is unproven, and so is how long it takes | the owner starts it from staging's dashboard; the coordinator verifies and times it; the owner deletes the copy |
| B2 | **G1: production's backups never seen** | the existence, kind, status and age of the backups a restore would use are an assumption (HTTP 403) | the production token may read the project's backups |
| B3 | **G6 refuses every production apply until B2** | the restore-point check fails closed by design | B2 |
| B4 | **G3/G4: no copy outside Supabase; Storage in no backup** | deleting the project or losing the account loses everything; Storage files are lost on any restore | the owner's decisions in the design; then build, a restore drill, one CI |
| B5 | **G5 escrow: the two secrets exist only in Vercel** | losing Vercel's environment now stops the deploy instead of breaking cards and certificates, but nothing can recover the values | part of B4 (`secrets.age`) |
| B6 | G9: recovery rests on one person | — | the owner's choice of a second administrator and custodian |
| B7 | G10 is off | a failure is still noticed only when reported | the owner sets `PINTAR_PRODUCTION_WATCH` to `on` |

**PASS requires B1, B2 and B4 with B5 cleared, with a recovery verification rerun showing them.** B6 and B7 are owner
decisions that should not be left open once real schools depend on PINTAR.

## The closing table

| # | Status 6 Oct | Evidence |
|---|---|---|
| G1 | **Partly established; backup list unread** | see G1 below |
| G2 | **Not performed: needs the owner's two dashboard actions** | see G2 below |
| G3/G4 | **Designed, not built** (owner's approval needed) | `docs/recovery/OFFSITE-BACKUP-DESIGN.md` |
| G5 | **Guard built and proven; escrow waits on G3's custody** | `b4bd543`; DR-S01..S03 red on the old workflow, green; CI CI_FINAL |
| G6 | **Built and proven** (blocks production applies until G1's token can read backups) | `870fdac`; DR-S04, DR-S05; CI CI_FINAL |
| G7 | **Built and proven**, plus two defects found and fixed | `870fdac`; DR-D01; rehearsal 37389380945 |
| G8 | **Recorded**: D-103 | `docs/coordination/DECISIONS.md` |
| G9 | Recommendations (owner's decisions) | see G9 below |
| G10 | **Minimum built, off until the owner turns it on**; one defect found by its first run and fixed | `7ffbacc`, `babafd5`; DR-S06; watch runs 37389383812 (died, the defect) and WATCH_FINAL |

### G1. Production's backup configuration (read only; nothing changed)

Read 5–6 Oct through the Supabase connector (`get_project`, and `execute_sql` on system views only) and
`recovery-facts.yml` run 37382592466 (HTTP GET only):

| Fact | Value |
|---|---|
| Project | `pintar-production` (`trtlvibiybwixfumjrrx`), ap-southeast-1, `ACTIVE_HEALTHY`, Postgres 17.6.1.166 (GA channel), created 22 Sep |
| Organisation plan | Pro (so: daily backups, 7 days kept; physical, since Postgres ≥ 15.8.1.079) |
| WAL archiving | `archive_mode` on, an `archive_command` set, `archive_timeout` 2 min, `wal_level` logical |
| WAL archiver | 155 segments archived, **0 failed**; the last at 2026-10-05 19:27:10 UTC (statistics since 25 Aug); not in recovery |
| Database size | 20 MB |
| Point-in-time recovery | off by necessity: it needs Small compute and production is on Micro (D-089(c)); now also deliberately (D-103) |
| **The backup list** (how many, kind, status, age) | **not readable**: HTTP 403 to both workflow tokens, for backups and for add-ons alike |
| Organisation inventory | three projects, all active: `pintar-production`, `pintar-staging`, and `pintar` (`sknixmwkynzmrgbxzrvb`), the former FABLE development project (docs/phases) — not part of recovery; whether it is still needed is the owner's call |

**What is still missing.** The backups themselves. A daily physical backup is what the plan promises. That one exists,
completed and recent, has not been seen. **Owner's decision G1:** let the production access token read the
project's backups (the same token, re-issued with that permission). From then on `recovery-facts.yml`, G6 and the G10
watch all read the list by machine.

### G2. The hosted restore rehearsal: ready, waiting on the owner's dashboard

Supabase's documentation ("Restore to a new project", Beta) says it copies the schema, the data, roles, permissions and
Auth users. It does **not** copy Storage objects or bucket configuration, Auth settings, API keys, Edge Functions,
Realtime settings, or extensions and settings. The new project mirrors the source's compute and region. A project made
this way cannot itself be cloned. The feature has no Management API endpoint (run 37382592466 lists every restore
endpoint), and the Supabase connector cannot create or delete such a project.

**The two owner actions.**
1. Staging dashboard → Database → Backups → **Restore to a New Project** → the latest backup → Restore. Supabase shows
   the cost before confirming. Staging holds only synthetic data (D-064), so the copy holds no real data.
2. After the evidence is captured, the coordinator says so; the owner **deletes** the temporary project
   (Project settings → Delete project).

**What the coordinator then does.** It reads both projects through the connector, read only.
- Data fidelity: `audit/restore/fakta.sql` and `banding.sh`.
- The `auth.users` triggers; table and view rights; function rights; the policies and row security; owners.
- Auth users (counts and hashes, never values).
- The pre-request, extensions, Storage metadata, and whether the `assets` bucket survives.
- `launch-readiness.sql` with its G7 rows.
- Auth settings and API keys against staging's, by name.
- The time from the click to `ACTIVE_HEALTHY`, which is the RTO.

Each difference is classified as restored, lost-and-reconfigured-by-repository, or lost-and-needing-a-procedure. The
runbook (Part II §7) is corrected to match, and the project's deletion is confirmed.

### G5. The durable secrets: never replaced silently (built)

`scripts/release/durable-secrets.mjs` runs inside `deploy-vercel-production.yml`. It runs after the service-role key
is proven and before any variable is written, taken from the workflow's own commit. For each of `CARD_PEPPER` and
`CERT_SECRET_KEY_V1` it decides one of three things:

- **KEEP** only a value that is readable, at least 32 characters, and matches its recorded fingerprint. For the
  certificate key it must also **open an issued certificate's seal**, which proves it is the key the certificates were
  sealed with.
- **MINT** only an absent, never-recorded secret, and only into a production holding no classroom card, no sealed
  certificate, no school and nobody beyond the first administrator.
- **REFUSE** everything else, including a count it cannot read. Nothing is written, the deploy stops, and the message
  says to recover the secret, never to replace it.

Fingerprints are the first 16 hex characters of an HMAC-SHA256 under the secret's own label, never values. They live
in `docs/recovery/durable-secrets.json`. Production's two are not recorded yet: the next production deploy prints them
as a warning, and they are committed then. Production holds two schools (D-003), so if Vercel lost either secret
today the deploy would refuse.

Proof (DR-S01..S03, red on the old workflow, green now):
- the decision table;
- the seal byte for byte against `src/lib/certificates/sign.ts`;
- end to end against a stand-in for Vercel and PostgREST, the guard:
  - mints into an empty production;
  - refuses, writing no verdict, when Vercel has lost both secrets and production holds cards;
  - refuses an unreadable count;
  - keeps recorded secrets whose key opens the seal;
  - refuses a key that does not open it;
  - never prints a value.

**Still open: the escrow.** The secrets exist only in Vercel. If Vercel loses them, the guard now stops the deploy
instead of breaking every card and certificate, but there is nothing to recover them from. The escrow is
`secrets.age` in G3's design, under the same custody decision.

### G6. A recorded restore point before every production migration (built)

Named restore points are offered by Supabase only to select partners, and PITR is off (D-103). The restore point is
therefore the platform's daily backup. `scripts/release/restore-point.mjs` runs inside `deploy-supabase-production.yml`
before `db push`. The apply is refused unless Supabase lists a **COMPLETED backup no older than 26 hours**. The run
records which backup it was and its age, the WAL archiver's state, and the database's facts before the apply (counts,
hashes and names only), and keeps them as an artifact for 90 days. If the list cannot be read, nothing is applied.

Proof:
- DR-S04: the decision, and end to end against a stand-in Management API (GET only; the token never printed);
- DR-S05: the wiring.

**Consequence until G1's permission exists:** every production apply is refused.

### G7. Readiness that sees restore drift (built), and two defects found on the way

`docs/audit/launch-readiness.sql` has 24 rows, up from 17. Seven new G7 rows pin by name what this release grants:
- `anon` holds no right on any public table, view or sequence;
- `authenticated`'s table rights are exactly the release's 85 tokens (column grants included), and its executable
  functions are exactly the client registry's 193 plus the 17 helpers that row security and CHECKs call;
- every public object is owned by `postgres`;
- PINTAR's three `auth.users` triggers are present, enabled and bound to their functions;
- the PostgREST pre-request is set;
- the `assets` bucket exists and is private.

Before any of this was pinned, the expectation was checked on hosted staging (`execute_sql`, read only): the same 85
tokens, the same 17 helpers (identical md5), the same owners, triggers, bucket and pre-request.

**Defect 1: the rehearsal's readiness count was false.** It counted `'| FAIL'`, which no line contains, so it read 0
on staging and on the restored copy whatever happened. It is fixed: the rehearsal now prints each row by its verdict.

**Defect 2: two readiness rows had silently gone stale.** "Exactly one public verification path" and "anonymous surface
unchanged (2 / 2 / 0)" pinned the anonymous surface at its first size. They have FAILed on every database since
`20261019100000`, when the approved sign-in and recovery routes (BOB-12, BOB-26..28, IDENTITY-4.0) were registered.
They are restated (`RESTATED FOR #150 G7`). They now pin the 19 registered surfaces by name and require exactly one
certificate-verification route. Production's pinned release (17 rows) predates both changes. The count moves to 24
with the next production release.

Proof, DR-D01 (red on the old file, green now): 24 rows on CI's database with no unplanted FAIL. Then, inside a
rolled-back transaction, the 5 Oct restore's drift is planted: every right granted to `anon` and `authenticated`, the
password-write guard dropped, the pre-request lost. Two more drifts are added: a public bucket and a foreign owner.
Every G7 row FAILs and names what differs, for example:
- "2 of 3 present and enabled; missing or disabled: pintar_password_write_guard";
- "138 relation(s) anon may touch: …";
- "279 differ: +academic_periods_append_only …".

**On a real restore** (rehearsal 37389380945, `main` `6de0b9c`): staging reads **24 PASS, 0 FAIL**. The copy restored
by Supabase's documented procedure reads **17 PASS, 7 FAIL**, and every one of the seven is restore drift, named:
- 490 functions `anon` may execute;
- 9 client write grants on `audit_log`;
- 138 relations `anon` may touch;
- 280 functions `authenticated` may execute that it must not;
- 223 table-right differences;
- 0 of 3 `auth.users` triggers;
- no `assets` bucket.

After the corrected trigger step, 18 PASS and 6 FAIL: the trigger row passes, and exactly the rights and the bucket
remain. Rows that should hold did hold: the pre-request (kept by `roles.sql`), owners, row security, policies.

### G8. Recorded

D-103: RPO 24 hours, provisional; no PITR now; revisit as real-school usage grows, at the latest before the first real
school's learners sit assessments in production.

### G9. Recovery that does not hang on one person (recommendations; the people are the owner's to choose)

1. A second production SYSTEM_ADMIN before real schools depend on PINTAR (D-001 requires one before 23 Sep 2027;
   SYS-08 FAIL), and C-11's break-glass rehearsal.
2. A second person with administrative access to each account recovery needs: the Supabase organisation, the Vercel
   team, the GitHub repository, the domain registrar and mail host, and G3's backup account if approved. Each
   account's own recovery codes should be kept offline.
3. A second custodian of G3's recovery key (G3 design §3).

No implementation: each of these is a person or an account, and none is assumed.

### G10. Being told when production fails (minimum built, off)

`.github/workflows/production-watch.yml` looks at production from outside, with GET only:
- the sign-in page, without following a redirect;
- Supabase Auth's health;
- the TLS certificate's remaining days;
- the restore point through `restore-point.mjs` (an unreadable list is reported, not failed).

On a failure it opens one GitHub issue, comments on it while the failure lasts, and closes it when everything is green
again. GitHub notifies the repository's watchers; no paid service is used. Its hourly schedule is skipped at no cost
until the owner sets the repository variable `PINTAR_PRODUCTION_WATCH` to `on`. **Its first run found a defect in itself** (run 37389383812, `main` `6de0b9c`):
- the sign-in page answered 200, Auth was healthy, and TLS had 77 days left;
- then the step died at the backup check, because GitHub runs a step under `bash -e` and `restore-point.mjs`'s exit on
  the expected 403 ended the step before the 403 could be reported. No issue was opened.

DR-S06 had only read the workflow's text, so it missed this. It now **executes the step under `bash -e`** against a
local stand-in. Red on the old step: exit 1 right after the TLS line, as in the run. Green after `set +e` (`babafd5`).
Rerun on the fixed step: WATCH_FINAL.

**Owner's decisions:** turn it on, and how often. Who watches the repository; GitHub emails watchers about the issue.

## The owner's decisions, together

| # | Decision | Recommended |
|---|---|---|
| 1 | G2: start "Restore to a New Project" from staging's latest backup; delete it when told | yes, now (approved in principle 6 Oct) |
| 2 | G1/G6: let the production access token read the project's backups | yes; without it no production migration can be applied |
| 3 | G3/G4: destination, account, custody, drill key, retention, schedule | AWS S3 Singapore with Object Lock; the owner's account; the owner holds the recovery key (plus a second custodian); drill key yes; 35 days + 12 months; daily |
| 4 | G9: a second SYSTEM_ADMIN and a second account administrator | yes, before real schools depend on PINTAR |
| 5 | G10: turn the watch on, and how often | on, hourly |

## The recovery verification rerun

Run on `main` after the candidate's final CI (CI CI_FINAL, 35/35):

| Check | Run | Result | Classification |
|---|---|---|---|
| Restore rehearsal (staging, read only; logical procedure) | 37389380945 | backup 283 s, 25.3 MB, nothing moved during it; documented restore exit 3 at `roles.sql:17` (H6); tolerant restore 4 s, 7 errors; 150/157 tables byte-identical | as 5 Oct: no PINTAR data lost; H4, H5, H6 reproduced |
| — tolerant restore's 7 errors | | the reserved role parameter; 4 Auth objects and 1 Storage column newer than the CLI's local stack | version skew of the rehearsal target, not a PINTAR defect; it drops the `assets` bucket row, which G7 now reports |
| — facts | | triggers lost; grants changed (490 functions, 137 tables); 1 function's comments (`content_canonical_payload`, behaviour unchanged); policies, public triggers, pre-request, extensions, owners and Storage metadata (28 objects, 206 MB) the same | as 5 Oct |
| — readiness | | staging 24/24 PASS; copy 7 FAIL, then 6 after the corrected step | **G7 proven on a real restore** |
| Production watch, fixed step | WATCH_FINAL | WATCH_RESULT | |
| Staging's backups and add-ons, the rehearsal's token | 37389380945 | HTTP 403 | the same permission gap as G1 |

Not rerun, because it cannot be: the hosted restore (B1). Nothing here substitutes for it.

---

# Part II — The examination of 5 Oct (as written, with corrections marked)


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

**The logical backup** (Supabase's documented CLI procedure) works: 157 tables, **224–288 s** over four runs, about **25 MB** (data 20.9 MB, migration history 3.1 MB, schema 1.3 MB); no table changed on staging while it ran. `pg_dump` warns of circular foreign keys on 15 tables (handled by the documented `session_replication_role = replica`).

**The documented restore fails outright.** `psql --single-transaction … roles.sql schema.sql data.sql` stops at `roles.sql:17: permission denied for parameter log_min_messages`, and the single transaction restores **nothing**. Followed to the letter, Supabase's procedure does not restore PINTAR.

**Restored with errors tolerated** (5 s; 7 errors: that role parameter, five Auth objects of a newer Auth version than the CLI's local stack carries, and a newer Storage column, which loses the `assets` bucket's row):

| | Result |
|---|---|
| Data | **150 of 157 tables byte-identical** (row count and content hash): every PINTAR table in `public` and `telemetry`, `auth.users` and the other Auth data, the migration history. The 7 others are Supabase's own version tables, empty newer-version Auth tables, and `storage.buckets` (the `assets` row). |
| Kept | row security on every `public` table; all 131 policies; all 143 `public` triggers; PostgREST's pre-request on `authenticator`; the extensions; Storage **metadata** (staging: **28 objects, 206 MB**). ~~`launch-readiness.sql` 0 FAIL~~ **Corrected 6 Oct:** that figure was false: the rehearsal counted lines containing `'\| FAIL'`, and no line does (each begins with its verdict), so it read 0 whatever happened. See Part I, G7. |
| **Lost** | **PINTAR's three triggers on `auth.users`** — account creation, the **password-write guard** (Gate 3, D-101, D-102) and the **card-email guard**. The schema backup contains none of them (Supabase leaves `auth` out; its docs say changes to `auth` "have to be restored separately"). |
| **Opened** | **Every privilege.** On the copy, `anon` and `authenticated` hold SELECT, INSERT, UPDATE and DELETE on **all 137** `public` tables and views (on staging `anon` holds none and `authenticated` only what each needs), and EXECUTE on **all 490** `public` functions: **280 that no client may call on staging** (among them `audit_write`, `auth_password_write_guard`, `certificate_prepare`, `bootstrap_first_system_admin`, `card_signin_settle`, `assume_persona`) and 210 that only a signed-in caller may call, now open to anonymous callers too. |
| Changed | one function's definition, `content_canonical_payload` (the content seal's payload): the only difference (run 37379973507, `diff` of the two definitions) is its **eleven SQL comment lines that begin at the first column, removed** by the CLI's dump (it is the only function in `public` with such lines, which is why it alone differs); no executable line changed, so the payload it computes, and every content seal, is unaffected. A fidelity note, not a defect. |

**Why the privileges open.** A Supabase project's default privileges grant `anon` and `authenticated` every right on every object `postgres` creates in `public`. PINTAR revokes them explicitly in each migration (ADR-0021; D-033), but a dump records each object's rights only relative to Postgres's own defaults, so nothing revokes what the new project's defaults just granted. Row security still filters rows, but SECURITY DEFINER functions do not pass through it, and every internal one becomes callable by anyone at `/rest/v1/rpc`. ~~PINTAR's own readiness check does not detect this.~~ **Corrected 6 Oct:** two of its rows would have failed (`anon` may execute functions; client write grants on `audit_log`), but the rehearsal's count could not show it, and it had no row for table rights in general, for `authenticated`'s functions, for the `auth.users` triggers or for the pre-request (Part I, G7).

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
- **H4. The documented logical restore opens every privilege** (§3): all 137 tables and views to `anon` and `authenticated`, all 490 functions to `anon`, including 280 internal ones. Silent: row security, the policies and the readiness check all look healthy.
- **H5. The documented logical restore drops PINTAR's three `auth.users` triggers**, the password-write guard among them. Silent.
- **H6. The documented logical restore does not run**: it stops at a role parameter the project may not set, and its single transaction restores nothing. A person following Supabase's page under pressure meets a failure, then (by the troubleshooting advice) an unguarded tolerant restore that produces H4 and H5.
- **H7. `docs/audit/launch-readiness.sql` cannot see H4 or H5**: it checks row security and policies, not grants, `anon`'s rights, or the `auth.users` triggers. **Corrected 6 Oct:** it saw part of H4 (anon's functions, `audit_log`'s write grants), none of H5; and the rehearsal's count of its FAIL rows was itself broken (Part I, G7).

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

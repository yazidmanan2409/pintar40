# #150 closure plan under D-106, revision 2 (amendments A1–A7)

**Status: APPROVED (D-107, 6 Oct), with amendment A7 and decisions D1–D8.** Implementation proceeds one work package at
a time in the order below, each with its red→green evidence and its CI, and is reported before any owner action or
external-service boundary. Every stop point stands. No UI/UX work. No change to unrelated PINTAR functionality. No
PITR implementation. No 100,000-user rehearsal.

**Progress:** WP-A's code built and proven (`e6cb045`; CI 37401454517, 35/35, 580/580); waiting for O2 (C1), the
owner's action. **WP-B:** stopped for a ruling on 6 Oct (§ A7, "Finding"), ruled A + B (D-108), resumed; its code is
built and proven against local stand-ins (CI 37409454539 on `9133ffc`: 35/35, 587/587), then accepted (D-109): on `main`
since 6 Oct (CI 37412506567 on `cc2307e`, 35/35), migration 162 **applied to hosted staging only** (run 37414019844) and
verified read only; the staging path check waits for the owner's pooler value. Production is untouched until separately
authorised. The evidence, decision by decision: `docs/recovery/EVIDENCE-INDEX-150.md`.

**Unchanged boundaries (D-106(h)–(j)):**
- native Supabase restore is the **primary** database recovery path;
- logical restore is the **secondary**, provider-independent path, never presented as equivalent;
- PITR and RPO tightening are not 4.0 blockers;
- a 100,000-user rehearsal is not a 4.0 blocker.

**The outcome WP-C must make true:** *"We successfully reconstructed PINTAR in a new environment, verified its data and
security, restored its files and configuration, connected the application, and proved that it worked."*

## What changed from revision 1

| Amendment | Revision 1 | Revision 2 |
|---|---|---|
| A1 encryption | a shared GPG passphrase, also in GitHub | **OpenPGP public-key encryption.** The backup job holds **public keys only** and cannot decrypt any backup. Private keys are offline with their custodians. Production bundles are decryptable only offline |
| A2 database credential | reuse the production `postgres` password, read-only | **a dedicated role `pintar_backup`**: login, `pg_read_all_data`, BYPASSRLS, nothing else. Investigated and feasible (below). Dumps use `pg_dump` directly, because the Supabase CLI hard-codes `--role "postgres"` |
| A3 credentials | a short list | **an inventory**: every credential with its system, purpose, permissions, holder, rotation and revocation. Supabase Storage keys and AWS S3 keys are named apart |
| A4 secret retention | escrow kept 5 years | **no expiry.** S3 Object Lock *legal hold*; removal only by a retirement procedure that proves nothing depends on the secret |
| A5 completeness | not specified | **fail closed:** ten verified conditions, or no success and nothing uploaded |
| A6 recovery authority | a second SYSTEM_ADMIN | **external-account recovery authority** for Supabase, Vercel, GitHub, the registrar and DNS, mail and AWS, documented |
| A7 `pintar_backup` (D-107) | — | C2 treated as **highly privileged for confidentiality**: backup environment only, never logged, rotation and immediate revocation, Supabase's restrictions examined, a test that it cannot mutate PINTAR, and its compromise stated plainly (below) |

## A2: the investigation, and its result

**Evidence (read-only, 6 Oct):**
- **On Supabase, `postgres` is not a superuser, but has what is needed.** In staging's catalog it holds BYPASSRLS and
  CREATEROLE, and `pg_read_all_data` **with admin option**. It can therefore create a role with exactly the read
  rights a complete dump needs.
- **Supabase's own `supabase_read_only_user` has that very profile:** LOGIN, BYPASSRLS, `pg_read_all_data`,
  `default_transaction_read_only=on`. That proves the platform supports it. It is Supabase-managed, so it is not used.
- **The Supabase CLI cannot be used with such a role.** `supabase db dump --dry-run` (CLI 2.117.0) shows every dump
  (roles, schema, data) run with `--role "postgres"`, which would require membership of `postgres`.

**Result: a dedicated role is suitable.** It is `pintar_backup`:
- LOGIN, BYPASSRLS, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, connection limit 3;
- a member of `pg_read_all_data` only;
- `default_transaction_read_only=on`;
- owner of nothing, and given no other right.

The backup runs **PostgreSQL 17's `pg_dump` and `pg_dumpall` directly**, with the CLI's own exclusions and flags minus
`--role`.

**Consistency.** The CLI dumps schema and data in separate snapshots. This job does better: it opens **one exported
snapshot** (`pg_export_snapshot()` in a REPEATABLE READ transaction). The schema dump, the data dump, the fact query and
the **list of expected Storage objects** all read that same snapshot (`pg_dump --snapshot`).

**How it is created:**
- **The role:** one migration (162). The migration-count baselines move with a `MOVED` comment.
- **The password:** never in the repository. The owner generates it in the password manager and stores it as a GitHub
  environment secret. A one-off workflow sets it, sending only a SCRAM-SHA-256 verifier computed on the runner, so no
  plaintext password reaches the database or its logs.
- **Rollout:** staging at once; production at the PRODUCTION READY release apply, behind G6.

**Still to confirm at implementation (read-only):**
- that production's `postgres` has the same `pg_read_all_data` admin option;
- that `--snapshot` works through Supavisor's session pooler.

If either fails, the work stops and returns for approval, as A2 requires.

## A7: `pintar_backup` can read everything, so C2 is guarded as such (D-107(c))

**Stated plainly: a compromise of C2 could expose the complete database.** That means every school's staff and student
records, password hashes, the class cards' secret hashes, the audit log and the certificates. For confidentiality it is
therefore handled like the `postgres` password, not like a read-only convenience.

**What C2 can change (D-108(b), the canonical wording):** "`pintar_backup` has no ordinary PostgreSQL privileges to
mutate PINTAR data, schema, objects, roles or rights. Supabase's `supautils` extension-management mechanism nevertheless
permits database LOGIN roles to create/drop allow-listed extensions, and dropping an extension with CASCADE may affect
dependent PINTAR objects. This is a documented Supabase platform residual outside PINTAR's ordinary PostgreSQL grant
model." `default_transaction_read_only` is a **safety default, not a security boundary**: the role can change its own
session setting.

**The compensating controls (D-108(c)), each with where it is built and proven:**

| # | Control | Where | Proof |
|---|---|---|---|
| 1 | C2 only in the protected `backup` environment (`main` only); never in the application or its runtime | `backup-offsite.yml`, `backup-credential.yml` | DR-S11 (C2's name appears nowhere else, `src/` included) |
| 2 | never printed or logged | `backup.mjs` (`PGPASSWORD` in the environment only) | DR-S14 (a planted password appears in no output and no bundle) |
| 3 | rotation and immediate revocation | `backup-credential.yml` (`set`, `revoke`) | DR-S11 (wiring), DR-S15 (the role's catalog) |
| 4 | the enforced connection limit | migration 162 (3) | DR-S15 (a fourth connection refused) |
| 5 | every backup captures the installed extensions and their fingerprint | `backup.mjs` (`extensions.json`, the success record) | DR-S14 |
| 6 | compared with the approved baseline | `docs/recovery/extension-baseline.json` | DR-S14 |
| 7 | any addition, removal or version change fails the run closed and raises the production watch issue | `backup.mjs`; `backup-offsite.yml`'s failure step | DR-S14 (an extension planted by `pintar_backup` itself turns the run red); DR-S11 |
| 8 | a restore verifies the extension baseline before PINTAR may reopen | `restore-bundle.mjs` | DR-D02 |
| 9 | no EXECUTE or mutation privilege added for metadata collection | migration 162 | DR-S15 (no PINTAR function executable) |

**Provider follow-up (B; non-blocking; the owner asks Supabase).** "Can extension creation/drop through `supautils` be
disabled or restricted for a specific dedicated database LOGIN role while retaining that role's read access required
for `pg_dump`?" If Supabase offers a supported restriction, the coordinator returns before changing the architecture.

**Where C2 lives, and where it never goes:**
- **Only** in the secrets of the GitHub environment `backup`. Its deployment-branch rule is `main` only, so only the
  backup workflows on `main` can read it.
- **Never** in Vercel, never in the application or its runtime, never a repository-wide secret, never in `src/`.
  DR-S11 proves that its name appears in no other file.
- The job passes it only through `PGPASSWORD` in the environment of `pg_dump`, `pg_dumpall` and `psql`. It never
  appears on a command line, in a connection URL, a file in the bundle or the log. GitHub masks it as well. DR-S14
  plants a stand-in password and proves it appears in no output and no bundle.
- It is always used over `sslmode=verify-full` against Supabase's CA certificate, so it never crosses an unencrypted
  or unverified connection.
- **Setting it:** the database receives only a salted SCRAM-SHA-256 verifier, computed on the runner, never the
  password. If the statement is logged, only the verifier is; with a random password of 32 or more characters it cannot
  be brute-forced.

**Rotation and immediate revocation (workflow `backup-credential.yml`, `main` only, environment `backup`):**

| | How | Effect |
|---|---|---|
| Rotation (yearly, or on any doubt) | the owner puts a new random password in the password manager and in the `backup` environment secret; the `set` action applies its verifier | the old password stops working at once; the next backup proves the new one |
| **Immediate revocation** | the `revoke` action: `ALTER ROLE pintar_backup NOLOGIN` and its open sessions terminated, using the `postgres` password the apply already holds | no login at all with C2, whatever its value; backups fail closed and the watch says so until `set` restores LOGIN with a new password |
| Retirement | a migration drops the role | — |

**Supabase's connection, source and environment restrictions, examined (Supabase docs, 6 Oct):**

| Restriction | What Supabase offers | Practical for C2? | Adopted |
|---|---|---|---|
| Network Restrictions | an IP allowlist for Postgres and its pooler, **project-wide** (every role), in Database Settings | **No, not today.** GitHub-hosted runners connect from changing addresses across Azure's ranges. A fixed address needs GitHub's larger runners with static IPs (a paid plan) or a self-hosted runner. The allowlist would also bind the deploy workflows and every other database client | no; an owner option for later (a Supabase setting plus a paid runner) |
| Temporary access ("JIT") | a Supabase user's scoped token used as a role's password, with a per-role expiry and per-role IP ranges; needs Postgres ≥ 17.6.1.081 and a project setting switched on | **Partly.** The expiry is useful. The IP ranges have the runner problem above. The credential would become one person's Supabase account token, tying the backup to one person (against A6) | no for 4.0; recorded as an option |
| SSL enforcement | a project-wide setting that refuses non-SSL clients | the job already insists on it from its side (`verify-full`) | client side yes; the project setting is an owner option, since it affects every client |
| In-database role limits | standard PostgreSQL, set by migration 162 | **yes** | yes: LOGIN; member of `pg_read_all_data` only; read-only by default; `statement_timeout` and `idle_in_transaction_session_timeout`; connection limit 3; owns nothing; no other grant |
| A PostgreSQL 17 login event trigger (by role or time) | possible in principle | a fault in a login trigger can lock **every** role out of the database | rejected |

**DR-S15 proves it holds no ordinary privilege to mutate PINTAR.** On CI's database, as `pintar_backup`, the session
first switches its own read-only default **off**: the worst case, since a stolen C2 can do that. Each of the following
must then be refused:
- INSERT, UPDATE, DELETE, TRUNCATE and `COPY … FROM` on PINTAR's tables, `auth.users`, `storage.objects` and
  `audit_log`;
- `nextval` and `setval` on a sequence;
- CREATE (table, view, function, trigger, policy) in every PINTAR schema, CREATE SCHEMA, CREATE EXTENSION;
- ALTER and DROP of a table, a function and a policy, and `COMMENT ON`;
- GRANT on an object; granting any role (it holds no admin option); CREATE ROLE; ALTER ROLE of another role;
  `SET ROLE` to `postgres`, `authenticated`, `service_role` or `anon`.

From the catalog, it also proves:
- no PINTAR function it may execute is SECURITY DEFINER, so any function it calls runs with its own read-only rights;
- it owns nothing, holds no table, column or schema privilege beyond reading, and no role attribute beyond LOGIN and
  BYPASSRLS.

**What it can still do, and why none of it mutates PINTAR:**
- create or drop Supabase's allow-listed extensions through `supautils` (the platform residual above; controls 5-8);
- create temporary tables and large objects, which PostgreSQL allows every role as session scratch space and which
  touch no PINTAR object;
- change its own password, which PostgreSQL always allows: the next backup then fails closed and is reported;
- use up its 3 connections.

The same catalog checks run read-only against staging after migration 162, and against production before its first
backup, because CI's database has only stand-ins for Supabase's own schemas.

**Finding: Supabase's extension manager (6 Oct, WP-B; stops the work for a ruling).** Building DR-S15 on the local
Supabase stack, which runs the same Postgres image family as hosted staging (17.6), showed that `pintar_backup` **can
create and drop extensions**.

The mechanism is Supabase's `supautils`. For the extensions on its allow-list (`supautils.privileged_extensions`), it
performs CREATE and DROP EXTENSION on behalf of **any** database login, as the superuser `supabase_admin`. Staging's
settings are identical, read-only. Observed on the local stack, nothing left changed:
- a **bare LOGIN role with no grant at all** created `pg_trgm`, so this is not something PINTAR's grants give;
- `pintar_backup`, with its read-only default switched off, created `pg_trgm` (in `public`) and `dblink` (in `auth`);
- it dropped `hstore`, and dropped **`pgcrypto CASCADE` and `"uuid-ossp" CASCADE`** (each inside a transaction rolled
  back). A cascade can destroy every PINTAR object that depends on the extension;
- one test run's `CREATE EXTENSION hstore` was real: `hstore` appeared in `public`, owned by `supabase_admin`, its
  functions executable by PUBLIC, which includes `anon` through the API. It was removed;
- a `postgres`-owned event trigger refusing all DDL from a `pintar_backup` session did **not** stop any of it:
  `supautils` runs the command as the superuser, for whom such event triggers are skipped.

Everything else A7 asks is proven on the local stack:
- no INSERT, UPDATE, DELETE, TRUNCATE, COPY FROM, sequence advance, CREATE TABLE, VIEW or FUNCTION, CREATE SCHEMA,
  ALTER, DROP of a PINTAR object, COMMENT, policy, trigger, role grant, CREATE ROLE, ALTER ROLE or SET ROLE;
- no GRANT or REVOKE that moves a right;
- no PINTAR function or SECURITY DEFINER function it can execute;
- it owns nothing; it is read-only by default; the connection limit is enforced;
- its five dumps are byte-identical to `postgres`'s.

**Ruled 6 Oct (D-108): A + B.** The residual is recorded in the canonical wording above, with controls 1-9; the
provider question is pursued in parallel; the `postgres` credential (C) is rejected.

**Also changed from A5 condition 3 (approved, D-108(d)):** the bundle does not carry `readiness.txt`. The readiness check calls PINTAR's
functions, which `pintar_backup` may not execute (A7), and no right is added for it. Readiness is checked where it
decides something: on the restored copy, where 24/24 is required. `facts.txt` carries the security facts: rights,
triggers, the pre-request, policies, and each function's definition, owner and execute rights.

**Stop (D-107(c)):** if a complete dump turns out to need any privilege beyond this profile (for example a
Supabase-managed object it cannot read), the work stops and returns for approval.

## A1: encryption, and who can decrypt what

| Key (OpenPGP) | Purpose | Private half held by | Encrypts |
|---|---|---|---|
| **R1, recovery key A** | production recovery | **custodian A (the owner)**: offline, on their own device, plus an offline backup copy (encrypted USB, or a printed paper key) in a safe | every production bundle and every escrow |
| **R2, recovery key B** | production recovery, independent of A | **custodian B** (named under B6), offline, the same way | every production bundle and every escrow |
| **R3, staging drill key** | the monthly automated drill, on synthetic data only | a GitHub *environment* secret (`staging-recovery-drill`), owner-approved runs | **staging bundles only** |

- **The backup job holds only R1, R2 and R3's public keys** (committed under `docs/recovery/keys/`). It can encrypt
  and cannot decrypt anything.
- **Production bundles are never decryptable inside GitHub in normal operation.**
- **Key generation needs no developer tool.** Each custodian uses a desktop OpenPGP application with a normal window
  (GPG Suite on Mac, Kleopatra on Windows): new key pair, export the public key and send it to the coordinator, export
  a passphrase-protected backup of the private key to offline media.
- **Proving production bundles stay decryptable, without exposing a private key:**
  1. The same encryption pipeline is proven end to end every month on staging bundles (R3).
  2. Every production bundle's recipient list is checked against R1 and R2's fingerprints (`gpg --list-packets`, no
     decryption).
  3. Each quarter, a **key-possession check**: the job encrypts a short random word to R1 and to R2. Each custodian
     opens it in the desktop application and replies with the word. That proves the key is still held and working, and
     reveals nothing.
- **In a real recovery** of production from the independent copy:
  1. A custodian adds their private key to the `production-recovery` environment, for the restore run alone (the owner
     approves the run).
  2. It is removed afterwards.
  3. A key rotation follows: a new key pair, and the escrow re-encrypted.
- **If a custodian rejects the desktop application,** the stated alternatives are:
  - **hardware keys** (two OpenPGP USB keys, about USD 50–70 each; a purchase needing approval);
  - **an offline browser key generator** written for this purpose (weaker: the custodian must trust new code).
  The coordinator stops and asks rather than choosing.

## A3: the credential inventory (each is created only after approval)

| ID | System | Credential | Purpose | Permissions | Held by | Rotation | Revocation |
|---|---|---|---|---|---|---|---|
| C1 | **Supabase Management API** | scoped access token, `pintar-production` | B3: read the backup list (G6, the watch, recovery facts) | **Database → Backups: Read**, one project, nothing else; `restore-point.mjs isolation` proves it is refused seven probes (API keys, Auth config, project settings, Edge Function secrets, another project, the account's projects and organisations) | GitHub repository secret `PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN`, read only by G6's step, the watch's look step and the facts job (DR-S07) | owner, at expiry (12 months) or on doubt: Supabase → Access Tokens → new token → replace the secret → revoke the old | revoke in Access Tokens; G6 then refuses applies and the watch reports it |
| C2 | **Supabase Postgres** (production; staging separately) | role `pintar_backup` + password | B4: the database dump | **reads every row of every table, across all tenants** (`pg_read_all_data`, BYPASSRLS); no ordinary privilege to write, create, alter, drop or grant (DR-S15); like any Supabase login it can create or drop allow-listed extensions through `supautils` (D-108; detected by controls 5-8); read-only by default; 3 connections. **Its compromise exposes the complete database** (A7) | **only** the GitHub environment `backup` (`main` only): `PRODUCTION_DB_BACKUP_PASSWORD`, `STAGING_DB_BACKUP_PASSWORD`; never Vercel, the application or a repository secret | yearly or on doubt: the owner puts a new random password in the password manager and in the secret → `backup-credential.yml set` | **immediate:** `backup-credential.yml revoke` (NOLOGIN + sessions terminated) |
| C3 | **Supabase Storage S3-compatible API** (Supabase's, **not AWS**) | Storage S3 access key (ID + secret), per project | B9: download every Storage object | full Storage access on that project (Supabase offers no read-only key); the job only lists and gets | GitHub environment secrets `PRODUCTION_SUPABASE_STORAGE_S3_KEY_ID` / `…_SECRET` (staging likewise) | owner: Supabase → Storage → S3 access keys → new → update the secrets → revoke the old | revoke in the same screen |
| C4 | **AWS S3 (Amazon Web Services)** | IAM user `pintar-backup-writer` access key | B4/B5/B9: upload bundles and escrow | `PutObject` with checksum, `PutObjectRetention`, `PutObjectLegalHold` on the backup bucket only; **no read, list or delete** | GitHub environment secrets `AWS_BACKUP_WRITER_KEY_ID` / `…_SECRET` (backup and escrow environments) | owner: AWS → IAM → new key → update → delete the old | deactivate the key |
| C5 | **AWS S3** | IAM user `pintar-backup-reader` access key | drills and restores: download | `GetObject`, `ListBucket`, `GetObjectRetention`/`LegalHold` on the bucket only | GitHub environment secrets `AWS_BACKUP_READER_KEY_ID` / `…_SECRET` (`staging-recovery-drill`, `production-recovery`; owner-approved runs) | as C4 | as C4 |
| C6 | **OpenPGP** | R1 key pair | production recovery | decrypt all production bundles and escrow | public: repository; **private: custodian A, offline** | new pair → future bundles; escrow re-encrypted; the old private key kept until the last bundle encrypted to it has expired | announce retired; remove the public key from the repository |
| C7 | **OpenPGP** | R2 key pair | as C6, independently | as C6 | public: repository; **private: custodian B, offline** | as C6 | as C6 |
| C8 | **OpenPGP** | R3 key pair | staging drill | decrypt **staging** bundles only | public: repository; private: environment secret `staging-recovery-drill` | owner: new pair → secret → coordinator commits the public key | delete the secret |
| C9 | **AWS account root** | root login + MFA | break-glass; the only authority that can lift a legal hold or shorten governance locks | everything | custodian A, MFA device + recovery codes offline | — | — |
| C10 | **Supabase Management API** | temporary scoped token for the B8 rehearsal copy | WP-C | Auth config read-write, Project settings read-write, API keys read, **that temporary project only** | an environment secret for the rehearsal's duration | — | revoked when the copy is deleted (verified) |

**Existing credentials, unchanged in scope:**
- `SUPABASE_PROD_DB_PASSWORD` (`postgres`): used only by the apply and by the one-off password setting;
- `PRODUCTION_SUPABASE_ACCESS_TOKEN`: the deploy; **removed** from the watch and the facts job;
- `VERCEL_TOKEN`: the escrow job reads Vercel's environment with it, read-only.

## A4: cryptographic-secret retention, separate from backups

| | Ordinary backups | Escrow of `CARD_PEPPER` and `CERT_SECRET_KEY_V*` |
|---|---|---|
| Location | `production/daily/`, `production/monthly/` (staging likewise) | `production/escrow/<NAME>/<fingerprint>.gpg` |
| Retention | 35 days daily; 12 months monthly (Object Lock governance for the same period, then lifecycle expiry) | **No expiry.** S3 Object Lock **legal hold** (no end date) + versioning; **no lifecycle rule covers this prefix** |
| Why | RPO and personal-data minimisation | **Cards:** every class card's sign-in secret is derived from `CARD_PEPPER`, so it must stay recoverable while any card account exists, which in practice is the life of the deployment. **Certificates:** a certificate sealed with `V<n>` stays verifiable only while `V<n>` exists (INV-07); certificates are lasting records |
| Removal | automatic, by lifecycle | only by the **retirement procedure**: (1) for `V<n>`, proof that no certificate with key_version `n` exists or needs verifying; for the pepper, proof that no card account exists; (2) an owner ruling; (3) the AWS root (C9) lifts the legal hold. Never automatic, never by the backup's credentials |
| Continuity of the decryption keys | — | escrow stays decryptable by **two independent recovery keys** (R1, R2). When either rotates, the escrow is re-encrypted to the new set **before** the old private key is retired. The quarterly possession check covers both |
| Offline copy | — | **D8 (decided, D-107): no sealed offline plaintext copy.** The dual-recipient encrypted escrow is the recovery path; R1 and R2's private keys each have their own offline backup |

## A5: when a backup counts as successful (fail closed)

A run is recorded as successful **only if all ten hold**. On any failure nothing is uploaded under `daily/` or
`monthly/`, the run is red, and the watch's single GitHub issue is opened or updated.

1. **One snapshot.** The exported snapshot is open, and its ID and time are recorded.
2. **The database dump is complete:**
   - roles, schema, data and migration-history dumps all exit 0;
   - the data dump holds a `COPY` section for **every** included table in the snapshot's catalog, and no other;
   - row counts per table equal the snapshot's.
3. **PINTAR's additions are present:**
   - `auth-triggers.sql` holds exactly the snapshot's `auth.users` triggers (3 today);
   - `acl.sql` covers every public object;
   - `role-settings.sql` carries the pre-request;
   - `facts.txt` and `readiness.txt` are written.
4. **Storage is complete:**
   - the expected objects are **exactly the `storage.objects` rows in the snapshot**, and each is downloaded;
   - each object's size equals its metadata, and its MD5/ETag matches where Storage provides one;
   - its SHA-256 is recorded;
   - the manifest's row count equals the expected count.

   A missing or mismatched object is retried up to 3 times, then **fails the run**. An object deleted after the
   snapshot fails the run too, and the next day's run captures the new state.
5. **The bundle manifest** lists every file with its SHA-256, and the tar re-reads equal to it.
6. **Encryption:** `gpg` exits 0, and the ciphertext's recipient list equals exactly the expected key IDs (production:
   R1 and R2; staging: R1, R2, R3).
7. **Upload integrity:** S3 `PutObject` with `x-amz-checksum-sha256` succeeds, so S3 itself rejects any mismatch.
   The writer key cannot read back, so this is the verification it is allowed.
8. **Retention:** set by the upload itself (lock and retain-until date).
9. **The success record** (sizes, counts, hashes, snapshot, release; no values) is uploaded **last**. A bundle without
   it is by definition incomplete.
10. **The drill and the integrity check** treat only bundles **with** a success record as backups.

## The work packages (revised)

**WP-A: B3, the backups-read token (C1). Code built and proven; waiting for O2.**
- **Built:**
  - G6's step in the production apply, the watch's look step and `recovery-facts` read the backups with C1
    (`PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN`) only. None of them holds the deploy token any more, and the facts job no
    longer tries one project's token on another.
  - In the watch, C1 refused is a **failure**, because C1 exists to read the backups. Only C1's absence, before O2, is
    a note.
  - `restore-point.mjs isolation` proves C1 reads production's backups and is refused seven probes:
    - the API keys;
    - the Auth configuration;
    - the project's settings;
    - the Edge Function secrets;
    - staging's backups;
    - the account's projects;
    - the account's organisations.

    It uses GET only, and each answer is discarded unread. It fails closed: ISOLATED, TOO BROAD or UNPROVEN.
  - The facts job's last step runs that check and G6's check dry. It is red unless C1 is ISOLATED and G6 says OK.
- **Supabase's side (docs, 6 Oct):** scoped tokens (public alpha) have a **Database → Backups: Read** permission. It
  unlocks only "List all backups" and "Get backup schedule". API Keys, Auth Config, Project Settings, Edge Function
  Secrets, Projects and Organizations are separate permissions.
- **Tests:**
  - DR-S05 and DR-S06 restated (`RESTATED FOR #150 WP-A`), and DR-S07 new;
  - red on the commit before WP-A, green after.
- **Owner action O2:** `docs/recovery/OWNER-INSTRUCTIONS-150.md`.
- **Evidence after O2:**
  - a `recovery-facts` run from `main`: C1 ISOLATED (backups HTTP 200; every probe 401, 403 or 404) and G6 dry OK;
  - the owner's screenshot of the token's permission list (Read, not Read-write, cannot be seen without a write).
- **Stop point:** if Supabase offers no choice of permissions, or the run says TOO BROAD, the work stops and asks.

**WP-B: B4, B5, B9 (database + Storage files + escrow, independent of Supabase and Vercel). Code built and proven against
local stand-ins; nothing hosted, nothing bought, no real credential (owner's boundary, 6 Oct).**
- **Built:**
  - `pintar_backup`, migration 162 (`20261125100000`). On `main` and **applied to hosted staging only** (D-109(a);
    run 37414019844); its profile there equals the proven local one (JOURNEY-LOG item 43). Production needs its own
    authorisation.
  - `scripts/recovery/backup.mjs`: one snapshot; the Supabase CLI's five dumps without `--role`; conditions 1-9 of
    A5; the extension baseline (D-108).
  - `scripts/recovery/restore-bundle.mjs`: the secondary logical path, with exact rights; `--verify-only` checks a copy
    already restored.
  - `scripts/recovery/escrow.mjs` (escrow, mint, recover), `drill.mjs` (condition 10, the production check, the
    possession check), `credential.mjs` (C2 set and revoke), and `s3.mjs` (one Signature V4 client, checked against
    AWS's published example and local Storage).
  - `infra/aws/pintar-backup.json`: the bucket and the two IAM users, as CloudFormation.
  - `docs/recovery/extension-baseline.json` (staging recorded; production `null` until read before its first backup)
    and `docs/recovery/supabase-root-2021-ca.crt` (public; SHA-256 `80:70:25:AD:…:E6:CA:FA`).
  - Workflows: `backup-offsite.yml`, `backup-credential.yml`, `escrow-durable-secrets.yml`,
    `recover-durable-secret.yml`, `restore-drill.yml`, `key-possession-check.yml`. All run from `main` only, and every
    schedule is off until switched on.
- **Where it departs from this plan's first wording, and why:**
  1. **No `readiness.txt` in the bundle** (approved, D-108(d)). Readiness is required at 24/24 on the restored copy.
  2. **Comment lines are kept in the schema dumps.** The CLI deletes every line beginning with `--`, which also
     deletes comment lines inside function bodies: the 5 Oct rehearsal's restored `content_canonical_payload` lost
     eleven. Kept, the restored definitions are byte-identical (DR-D02).
  3. **`acl.sql` puts column rights back last.** A table's REVOKE ALL also clears its columns' rights; found by DR-S08
     and DR-D02, fixed before landing.
  4. **The restore's comparison leaves out the platform's own migration ledgers** (`storage.migrations` and the
     like). The CLI's dump excludes them, and a new project keeps its own.
  5. **The production deploy no longer mints.** A MINT verdict stops it and names `escrow-durable-secrets.yml`
     (mode mint), which escrows first and writes to Vercel only after. This keeps the AWS writer key out of the deploy
     job. DR-S02 restated.
  6. **The drill restores into an empty Supabase stack on the runner**, the same stand-in for a new project that
     DR-D02 uses on CI.
- **Still to confirm on hosted staging (D-109(a); each a stop point if it fails):** checked read only, before any
  backup credential exists, by `staging-backup-path.yml` (`scripts/recovery/path-check.mjs`, DR-S16):
  - staging's session pooler host, from Supabase's own pooler configuration and staging's apply agreeing, never
    guessed (otherwise the owner gives the dashboard's value), and `backup-offsite.yml`'s value checked against it;
  - the pooler's certificate chains to the Supabase Root 2021 CA (`verify-full`; this container cannot reach port 5432);
  - the exported snapshot is shared through Supavisor's session pooler (another session and `pg_dump --snapshot`);
  - `pintar_backup`'s profile there equals the proven local one, line for line
    (`docs/recovery/pintar-backup-profile.expected`), and the extensions equal staging's baseline.
  Still unproven until O6: a sign-in as `pintar_backup` itself through the pooler (C2 does not exist yet).
- **D-109, built in:**
  - **(c) production goes to R1 and R2, never one custodian's key alone**, and not at all until two separate
    custodians have each proven possession and decryption (`docs/recovery/custody.json`, roles only). The backup, the
    escrow and the mint refuse before they read anything; production's recipients are fixed in the workflows, no
    longer a variable. Staging keeps R1 and R3 (R2 added when it exists).
  - **(b) escrow first:** a durable secret is minted only where it can be escrowed first; a mint that cannot escrow
    (recipients, custody, upload) writes nothing to Vercel.
  - **(d) the 5 GiB limit is watched:** each success record carries the bundle's share of it; from 80 % the run warns
    and raises the backup-size issue (its own, apart from the production watch); above 5 GiB it is refused before
    any upload.
- **Limits, named:**
  - a single upload is at most 5 GiB (no multipart, accepted for 4.0 by D-109(d)): refused clearly, never truncated,
    and warned of from 80 %;
  - large objects are not carried, and the run fails closed if any exist;
  - the role's timeouts are defaults that a session may lengthen; only the connection limit is enforced by the
    server.

**Tests (each red on the code before WP-B, green after; run on the local Supabase stack, then CI):**

| ID | Proves |
|---|---|
| DR-S08 | `acl.sql` on CI's database, rolled back: after the 5 Oct drift (everything to `anon` and `authenticated`, CREATE on `public` to `anon`) and a right taken away, every PINTAR object's rights for `anon`, `authenticated`, `service_role` and PUBLIC, columns included, are exactly as before; readiness as before |
| DR-S09 | encryption with public keys only: a production bundle goes to exactly R1 and R2 (read from its packets); their private keys open it, R3's and the job's public keyring do not; production never R3, staging always R3, R1 always; a private-key file, a weak key, a missing or extra recipient refused |
| DR-S10 | escrow, mint and recover against stand-ins for Vercel and S3: legal hold, checksum, R1 and R2 only, only on a fingerprint match; mint escrows before Vercel; recover writes only the recorded value where Vercel holds none; no value printed; the template's lock, versioning, lifecycle (none on escrow), put-only writer, read-only reader, TLS |
| DR-S16 | staging's backup path, read only (D-109(a)): the path check is dispatch-only, `main`-only, read-only, with the apply's own credentials; the pooler only where Supabase's configuration and the apply agree (six disagreements and an unreadable configuration stop it and ask the owner); hosted connections `verify-full`; executed: the backup's own snapshot imported and dumped from; `pintar_backup`'s profile equals the proven one, a planted right is a difference |
| DR-S11 | the wiring (D-108(c)(1)-(4)): `main` only, schedules off until switched on, one environment per job, each credential in exactly its workflows and C2 nowhere in `src/`, `verify-full` against the committed CA, a failed production backup raises the watch's issue; executed: condition 10, a bundle with altered bytes refused, C2 set as a SCRAM verifier and revoked at once, the possession check |
| DR-S14 | **A5, executed** against CI's database and Storage and a stand-in S3: the clean run uploads daily and monthly copies with checksum and lock, each success record last, the bundle opening with R3 and holding every Storage object; red with no success record for a missing table, a missing or changed Storage object, wrong recipients, a rejected checksum, an extension `pintar_backup` itself added (D-108), and a production backup without a baseline |
| DR-S15 | `pintar_backup` (A7, D-108): it reads every table, `auth` and `storage` included, and its dumps equal `postgres`'s; with its read-only default switched **off** it is still refused every ordinary INSERT, UPDATE, DELETE, TRUNCATE, COPY FROM, sequence advance, CREATE, ALTER, DROP, COMMENT, GRANT, role grant, CREATE ROLE and SET ROLE; the catalog shows it owns nothing, can execute no PINTAR or SECURITY DEFINER function, and holds no attribute beyond LOGIN and BYPASSRLS; the `supautils` extension residual is shown to be the platform's (the extension is created by `supabase_admin`, not by the role) and is left to controls 5-8 |
| DR-D02 | the logical path end to end: a bundle collected by `pintar_backup` restored into a second, **empty** Supabase stack with its Storage files: 0 differences, every file's hash, `anon`'s reach as its source's, the extension baseline, readiness as its source, SAFE TO REOPEN; an extension added afterwards makes `--verify-only` refuse |
| DR-S02 | restated: the deploy never mints |

**Evidence:**
- the first green, fail-closed backups of staging and production (the success records);
- one planted-failure run shown red;
- the first escrow (fingerprints recorded; legal hold on);
- the staging drill: 0 differences, 24/24, every Storage file's hash equal, the logical-path time;
- the production recipient and checksum check;
- the first key-possession check answered by both custodians.

**WP-C: B8, reconstructing PINTAR in a new environment, proven.** *WP-C.1 built (6 Oct): the runbook
(`docs/recovery/RUNBOOK-NATIVE-RESTORE.md`), the one guarded record of the projects (`docs/recovery/projects.json`,
`scripts/recovery/repoint.mjs`), the Auth read-back (`scripts/recovery/auth-state.mjs`), the files put back after a
native restore (`restore-bundle.mjs --files-only`) and the read-only `recovery-target.yml`; DR-S12, DR-S13 new, DR-D02
restated. WP-C.2 (the rehearsal's preview deployment and functional checks) is next; then O8.*

**The runbook** (`docs/recovery/RUNBOOK-NATIVE-RESTORE.md`):
1. native restore to a new project;
2. new scoped tokens, created by the owner;
3. repoint the production workflows through one guarded setting (25 workflows hard-code a ref today);
4. re-apply Auth and SMTP, read back against `auth-identitas.json`, with the advisors clean;
5. Storage files from the independent copy (B9);
6. durable secrets kept by the G5 guard, or recovered from escrow;
7. redeploy;
8. verify;
9. reopen.

**Tests:**
- **DR-S12:** guarded repointing; the Auth read-back.
- **DR-S13:** every runbook step is tied to a named workflow or owner action, with its check.

**The proof: a hosted rehearsal on staging, mirroring the runbook end to end.**
1. Owner action: one native restore, to `pintar-g8-rehearsal-DELETE-ME`.
2. The coordinator reconstructs it:
   - Auth settings and SMTP;
   - API keys;
   - Storage files from the staging bundle;
   - the application, connected through a one-off Vercel preview deployment of `main` aimed at the copy (no persistent
     Vercel change).
3. It is verified:
   - data and security: the G2 fingerprint, readiness 24/24;
   - the files: every Storage object served, with its hash checked;
   - the configuration: the Auth read-back; the leaked-password advisor clean;
   - **that it works:** a staff sign-in, a class-card sign-in, a certificate verified by its token, and a lesson or
     photo served from Storage, all through the reconstructed application.
4. It is timed T0→Tn, then deleted, with the temporary token (C10) revoked and both confirmed.

**Acceptance:** each clause of the sentence at the top has its own evidence line. If any one is missing, WP-C is not
done.

**WP-D: B6 + A6, recovery authority that depends neither on one person nor on PINTAR.**

`docs/recovery/RECOVERY-AUTHORITY.md` lists people **by role, not by name**: "custodian A", "custodian B". The names
are the owner's to keep. For each system it records:
- who can administer it (at least two people, each with their own login and MFA);
- where its recovery codes are kept (offline);
- the break-glass path if both are unavailable.

| System | Minimum before real-school production use |
|---|---|
| Supabase organisation `ZAYD` | a second **Owner** (or Administrator) member |
| Vercel team | a second member with the Owner role |
| GitHub repository `pintar40` | a second **Admin** collaborator |
| Registrar and DNS (Namecheap) | a second authorised contact or delegated access; the DNS records exported (already in GATE-0-FACTS §4) |
| Mail host (Namecheap Stellar Business) | a second admin able to reset the `noreply@` mailbox |
| AWS account (WP-B) | root with MFA held by custodian A; an IAM administrator with MFA for custodian B |
| PINTAR production | a second SYSTEM_ADMIN, granted by Gladys at Konfigurasi → Peran (`grant_role`, audited), once production runs the PRODUCTION READY release |
| Backup decryption | custodians A and B each hold their own private key (R1, R2) |

**Evidence:** for each system, a statement of "two administrators", from the owner's screenshots of the member lists.
The screenshots are not committed (they show names); the record keeps roles and counts only.

**WP-E: B7.**
- The watch is enabled at the PRODUCTION READY release step (production on the release carrying #150; C1 in place;
  watchers decided).
- It also raises the backup job's failures (A5) through the same single issue.
- **Tests:** DR-S06 extended (the release-checklist gate).
- **Evidence:** the first green scheduled run.

**WP-F: records.**
- D-103 is flagged as provisional (PITR and RPO tightening are a scale and operations requirement).
- The 100,000-user rehearsal is kept as future scale validation.
- The runbook names native restore first, and logical restore as secondary and **not equivalent**.

## The owner's actions (revised)

| # | Action | When |
|---|---|---|
| O1 | Approve revision 2 and decisions D1–D8 | **done** (D-107) |
| O2 | C1: the backups-read token (screenshot of its permission list) → GitHub secret | after WP-A's code |
| O3 | AWS: the account (custodian A, root MFA), the stack from the template, access keys for C4 and C5 → environment secrets | after WP-B's code |
| O4 | **Key ceremony:** custodian A creates R1 and the owner creates R3 in the desktop OpenPGP application; public keys to the coordinator; R3's private key into `staging-recovery-drill`; R1's private key backed up offline. Custodian B creates R2 when named (B6); **R2 and both custodians' possession proofs come before the first production backup and the first escrow** (D-109(c)) | with O3 |
| O5 | **Supabase Storage S3 access keys (C3)** for production and staging → environment secrets | with O3 |
| O6 | The `pintar_backup` passwords (C2) in the password manager → environment secrets | with O3 |
| O7 | Approve the first escrow run (it reads the two production secrets from Vercel, read-only) | after O3–O4 **and R2 with both possession proofs** (D-107 D8, D-109(c)) |
| O8 | B8: one native restore of staging for the rehearsal; the temporary token (C10); deletion and revocation when told | after WP-C's code |
| O9 | B6/A6: name custodian B (R2: **before the first production backup and escrow**, D-109(c)); the second administrators, the provider invitations, Gladys's grant and recovery codes stored offline | R2: before production backups; the rest before real-school use |
| O10 | B7: switch the watch on at the release gate | PRODUCTION READY |
| O11 | The privacy-notice line on backup retention (≤ 12 months), owner or legal | before real-school use |
| O12 | Each quarter: answer the key-possession check (custodians A and B) | recurring |

## Decisions (decided, D-107)

| | Decision | Decided |
|---|---|---|
| D1 | Destination | AWS S3 ap-southeast-1 (Singapore), Object Lock |
| D2 | Encryption | OpenPGP R1 + R2 (custodians, offline) and R3 (staging drill only) |
| D3 | Drill | monthly, owner-approved |
| D4 | Ordinary retention | 35 days daily, 12 months monthly |
| D5 | Production bundles on runners | not decrypted on normal runners |
| D6 | Database credential | `pintar_backup`, not the `postgres` password; guarded as in A7 |
| D7 | Schedule | 03:00 WIB (20:00 UTC) |
| D8 | Offline plaintext copy of the two secrets | **no**; the dual-recipient encrypted escrow is the recovery path |

## Cost

| Item | Estimate |
|---|---|
| AWS S3 at today's size | under USD 1 a month. At intended scale it grows with data (for example a 50 GB database is about USD 60 a month at this retention) |
| GitHub Actions | about 360 min a month (backups) + about 20 min (drill) + 3 CI runs to build |
| Supabase | Storage egress within Pro's allowance; the B8 rehearsal's temporary Micro project for a few hours (cost shown before confirming) |
| Hardware keys (only if chosen instead of the desktop application) | about USD 100–140 for two |
| Vercel | one preview deployment |

## Security implications

- **A1 holds:** nothing in the automated backup path can decrypt a production backup or the escrow. Compromising
  GitHub gives ciphertext and staging's drill key, nothing of production.
- **New credentials, each in the inventory, each narrow:** C1, C2, C3 (read-write Storage: Supabase's limit,
  contained to the backup environment), C4 (write-only), C5 (gated), C6–C8, C10 (temporary).
- **Removed exposure:** the watch and the facts job no longer hold the broad deploy token. The `postgres` password is
  not given to a scheduled job.
- **Production personal data leaves Supabase,** encrypted before upload, to the owner's AWS account in Singapore,
  ≤ 12 months (O11).
- **Escrow is under legal hold.** Only the AWS root (C9) can lift it, by the retirement procedure.
- **Residual risks, named:**
  - **a compromise of C2 could expose the complete database**; it holds no ordinary privilege to modify it, but, like
    any Supabase login, it can create or drop allow-listed extensions (D-108); A7 bounds where C2 lives, controls 5-8
    detect an extension change at every backup and restore, and revocation is immediate;
  - losing **both** custodians' private keys makes production bundles and the escrow unrecoverable; the quarterly
    possession check is the control;
  - C3 can write to Storage, a Supabase limitation;
  - a recovery that uses a private key in GitHub is followed by key rotation.

## Sequence and stop points

1. **WP-A**, **WP-B** and **WP-C**'s runbook tooling, each one finished change with red-then-green tests and one CI,
   reported before the owner action or external service it leads to (D-107(a)).
   WP-B carries migration 162 (staging at once; production at the PRODUCTION READY release).
2. **Owner actions O2–O7** (D-111: checkpoint GREEN; before O3, the staging pooler proof and C1 `ISOLATED`; then one
   at a time in `EVIDENCE-INDEX-150.md` §7; every first use of real infrastructure a stop point). Stop if:
   - Supabase cannot isolate backups-read;
   - production's `postgres` lacks the `pg_read_all_data` admin option;
   - the snapshot cannot be shared through the pooler;
   - a custodian cannot use the desktop application;
   - a complete dump needs any privilege beyond `pintar_backup`'s read-only profile (A7, D-107(c)).
3. **WP-B's evidence:** green and planted-red backups, escrow, the drill, the production checks, the first possession
   check.
4. **The WP-C hosted rehearsal (O8):** the sentence at the top, evidenced clause by clause.
5. **WP-D/A6 (O9) and WP-E (O10)** at their gates; WP-F's records.
6. **The final #150 report against D-106.** A genuine new defect stops the work for a ruling.

## Proposed #150 closure criteria (for confirmation; not redefined here)

**PASS for PRODUCTION READY** when each of these is evidenced:
- **B3:** C1 isolated;
- **B4 + B9:** fail-closed, independent bundles of the database **and every Storage file**, restored in the drill
  with 0 differences, 24/24 and every hash equal;
- **B5:** escrow under legal hold, recoverable, with two independent keys proven held;
- **B8:** the WP-C sentence, clause by clause.

B7 is switched on at the release gate. **B6/A6** — two administrators per external system, and a second
SYSTEM_ADMIN — is required **before real-school production use**.

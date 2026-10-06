# #150 closure plan under D-106, revision 2 (amendments A1–A6): for approval

**Status: PLAN, approved in principle; implementation awaits the Second Eye's approval of this revision.**
Nothing below is built, bought, configured or run yet. No UI/UX work. No change to unrelated PINTAR functionality.

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
| C1 | **Supabase Management API** | scoped access token, `pintar-production` | B3: read the backup list (G6, the watch, recovery facts) | **backups: read**, nothing else; probed by GETs to `/api-keys` and `/config/auth`, both of which must answer 403 | GitHub repository secret `PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN` | owner: Supabase → Account → Access Tokens → new token → update the secret → revoke the old | revoke in Access Tokens |
| C2 | **Supabase Postgres** (production; staging separately) | role `pintar_backup` + password | B4: the database dump | read every table (`pg_read_all_data`, BYPASSRLS); no write grant; read-only by default; 3 connections | GitHub environment secrets `PRODUCTION_DB_BACKUP_PASSWORD`, `STAGING_DB_BACKUP_PASSWORD` | owner: a new password in the password manager → the secret → the coordinator's set-password workflow | `ALTER ROLE … NOLOGIN` by workflow |
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
| Offline copy | — | D-066(a) asked for "verified offline recovery copies". **Owner decision D8:** whether, beyond the encrypted escrow, a sealed paper copy of the two secrets is kept (an independent path, or plaintext risk) |

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

**WP-A: B3, the backups-read token (C1).**
- G6, the watch and `recovery-facts` use C1 only.
- **Tests:** DR-S05 and DR-S06 restated; **DR-S07** (credential isolation). Red on today's files.
- **Evidence:** the backup list HTTP 200 with C1; GETs to `/api-keys` and `/config/auth` with C1 answer **403**; a
  dry, read-only G6 check reports OK.
- **Stop point:** if Supabase cannot isolate backups-read, the work stops and asks.

**WP-B: B4, B5, B9 (database + Storage files + escrow, independent of Supabase and Vercel).** It covers A1–A5, with:
- the bucket and the two IAM users from a CloudFormation template;
- `pintar_backup` (migration 162);
- `backup-offsite.yml`: daily 20:00 UTC, `main` only, fail closed;
- `escrow-durable-secrets.yml`, and the deploy's mint path escrowing first;
- `recover-durable-secret.yml`;
- `scripts/recovery/restore-bundle.sh` (the secondary logical path, with exact rights);
- `restore-drill.yml` (monthly + on demand, owner-approved): the full restore of the **staging** bundle; for
  **production**, recipients, checksums and the quarterly possession check only.

**Tests (each red on today's code):**

| ID | Proves |
|---|---|
| DR-S08 | `acl.sql`, executed on CI's database: planted drift (all rights to `anon` and `authenticated`) is put back; the rights digest equals the original; readiness 24/24 |
| DR-S09 | encryption with public keys only: a bundle encrypted to test R1/R2 decrypts with the private keys and **not** with anything the backup job holds; the recipient check rejects a wrong or missing recipient |
| DR-S10 | escrow and recovery against stand-ins for Vercel and S3: legal hold set and no lifecycle expiry on `escrow/`; escrows only on a fingerprint match; recovery writes only a matching value; never prints a value |
| DR-S11 | the wiring: environments, schedules, `main` only; each credential C1–C8 appears only where the inventory says |
| DR-S14 | **A5, executed:** a backup run against CI's database and Storage, with each failure planted (a missing table, a missing or changed Storage object, a wrong recipient, a rejected checksum), is red and uploads no success record; the clean run is green |
| DR-S15 | `pintar_backup`: it can read every table, `auth` and `storage` included; it cannot write, create or change roles; the dump made with it equals one made with `postgres` |
| DR-D02 | the logical path end to end on CI: CI's bundle restored by `restore-bundle.sh` into a fresh database gives `banding.sh` 0 differences and readiness 24/24 |

**Evidence:**
- the first green, fail-closed backups of staging and production (the success records);
- one planted-failure run shown red;
- the first escrow (fingerprints recorded; legal hold on);
- the staging drill: 0 differences, 24/24, every Storage file's hash equal, the logical-path time;
- the production recipient and checksum check;
- the first key-possession check answered by both custodians.

**WP-C: B8, reconstructing PINTAR in a new environment, proven.**

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
| O1 | Approve revision 2 and decisions D1–D8 | first |
| O2 | C1: the backups-read token (screenshot of its permission list) → GitHub secret | after WP-A's code |
| O3 | AWS: the account (custodian A, root MFA), the stack from the template, access keys for C4 and C5 → environment secrets | after WP-B's code |
| O4 | **Key ceremony:** custodian A creates R1 and the owner creates R3 in the desktop OpenPGP application; public keys to the coordinator; R3's private key into `staging-recovery-drill`; R1's private key backed up offline. Custodian B creates R2 when named (B6) | with O3 |
| O5 | **Supabase Storage S3 access keys (C3)** for production and staging → environment secrets | with O3 |
| O6 | The `pintar_backup` passwords (C2) in the password manager → environment secrets | with O3 |
| O7 | Approve the first escrow run (it reads the two production secrets from Vercel, read-only) | after O3–O4 |
| O8 | B8: one native restore of staging for the rehearsal; the temporary token (C10); deletion and revocation when told | after WP-C's code |
| O9 | B6/A6: name custodian B and the second administrators; the provider invitations; Gladys's grant; recovery codes stored offline | before real-school use |
| O10 | B7: switch the watch on at the release gate | PRODUCTION READY |
| O11 | The privacy-notice line on backup retention (≤ 12 months), owner or legal | before real-school use |
| O12 | Each quarter: answer the key-possession check (custodians A and B) | recurring |

## Decisions needed

| | Decision | Recommended |
|---|---|---|
| D1 | Destination | AWS S3 ap-southeast-1, Object Lock |
| D2 | Encryption | OpenPGP public keys R1 + R2 (custodians, offline) and R3 (staging drill only), made in a desktop application; hardware keys as the stronger alternative |
| D3 | Drill | monthly + on demand, each run owner-approved |
| D4 | Ordinary retention | 35 days daily, 12 months monthly |
| D5 | Production bundles on runners | never decrypted in normal operation: recipients and checksums + the quarterly possession check |
| D6 | Database credential | `pintar_backup` (A2: feasible), **not** the `postgres` password |
| D7 | Schedule | 20:00 UTC (03:00 WIB) |
| D8 | Offline plaintext copy of the two secrets (D-066(a)) | the owner's decision. Recommended: no plaintext copy; the escrow under two independent recovery keys is the offline recovery path, since D-066(a)'s intent is met by verified recoverability |

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
  - losing **both** custodians' private keys makes production bundles and the escrow unrecoverable; the quarterly
    possession check is the control;
  - C3 can write to Storage, a Supabase limitation;
  - a recovery that uses a private key in GitHub is followed by key rotation.

## Sequence and stop points

1. **WP-A**, **WP-B** and **WP-C**'s runbook tooling, each one finished change with red-then-green tests and one CI.
   WP-B carries migration 162 (staging at once; production at the PRODUCTION READY release).
2. **Owner actions O2–O7.** Stop if:
   - Supabase cannot isolate backups-read;
   - production's `postgres` lacks the `pg_read_all_data` admin option;
   - the snapshot cannot be shared through the pooler;
   - a custodian cannot use the desktop application.
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

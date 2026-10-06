# #150 closure plan under D-106: for approval (nothing implemented)

**Status: PLAN.** Under D-106(k), nothing below is built, bought, configured or run until the owner approves it. No
UI/UX work. No change to unrelated PINTAR functionality.

## What is already proven, and is not redone

- **Native database recovery, at staging scale.** G2 (6 Oct): a native hosted restore was byte-identical on 157 tables
  and passed readiness 24/24 without repair, 8 min 03 s restore-to-verified. Per D-106(j) it is the **primary** database
  recovery path.
- **PINTAR's own controls:** G5 (no silent re-keying), G6 (no apply without a restore point), G7 (24-row readiness that
  sees restore drift), G10 (watch, off). CI 37390261594.
- **Not blockers (D-106(h), (i)):**
  - PITR and RPO tightening: D-103's provisional 24 h stays, flagged as a scale and operations requirement;
  - a synthetic 100,000-user rehearsal: a future scale-validation requirement.

## The work, by blocker

### WP-A: B3, the automated production backup read (no broadened credential)

| | |
|---|---|
| **Mechanism** | A **new, separate** scoped Supabase token for `pintar-production` holding **only** the backups-read permission. GitHub secret `PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN`. The existing `PRODUCTION_SUPABASE_ACCESS_TOKEN` is **not** given backup access |
| **Who uses it** | Three readers only: G6's check (`deploy-supabase-production.yml`), the watch (`production-watch.yml`) and `recovery-facts.yml`. This also **narrows** the watch, which today holds the broad deploy token |
| **Code** | Those three workflows pass the new secret to `restore-point.mjs` (unchanged) and to the facts job |
| **Owner pre-check** | Supabase's token screen must offer a backups-read permission **on its own**. If it does not, the coordinator stops and returns with options; no broader token is created |
| **Tests** | **DR-S05, DR-S06 restated:** G6 and the watch use only the backups token. **DR-S07 (new):** none of the three read paths holds `PRODUCTION_SUPABASE_ACCESS_TOKEN`; the backups token appears nowhere else. Red on today's files |
| **Evidence** | `recovery-facts.yml` with the new token: backup list HTTP 200, latest completed backup and age. **Negative probes with the same token, GET only:** `/api-keys` → 403 and `/config/auth` → 403, proving it reads nothing else. A dry G6 check (read only) reports OK. No write is ever attempted |

### WP-B: B4, B5 and B9, the independent encrypted copy (database, Storage files, secrets) and its restore

**Destination (owner's account): AWS S3 in Singapore (ap-southeast-1), recommended.** It is a provider independent of
Supabase and Vercel, in the same region as today's data, with Object Lock. One bucket gets:
- versioning;
- **Object Lock (governance mode)**;
- public access blocked;
- encryption at rest (SSE-S3);
- lifecycle rules: `*/daily/` expires after 35 days, `*/monthly/` after 12 months, and each object is locked for its
  retention.

There are **two IAM users**:
- `pintar-backup-writer`: may only **put** objects and set their retention. It cannot read, list, delete or shorten
  anything.
- `pintar-backup-reader`: may only get and list, for drills and restores.

All of this is in a CloudFormation template in the repository. The owner creates it with "Create stack → upload
template", so no policy is written by hand.

**Encryption.** Each bundle is encrypted **on the runner, before upload**.
- **Recommended for 4.0:** a symmetric passphrase (GPG, AES-256). The owner's password manager generates it (32+
  random characters), and it is kept in three places: the password manager, a sealed paper copy, and a GitHub
  *environment* secret. No developer tool is needed to create or recover it, which fits the standing rule.
- **The stronger alternative:** age public-key encryption, with the private key only offline. It needs a one-time key
  generation with a command-line tool. **Owner decision D2.**

**What a bundle holds** (daily, for `production` and `staging`, `backup-offsite.yml`):

| Part | Source | Why |
|---|---|---|
| roles, schema, data, migration history | the Supabase CLI dump (read-only sessions) | the database |
| `auth-triggers.sql` | `pg_get_triggerdef` from the source | the logical dump drops them (H5) |
| `acl.sql` | generated from the catalog: revoke everything from `anon`, `authenticated` and PUBLIC on every public object, then re-grant exactly the source's rights, column rights included | the logical restore opens everything (H4) |
| `role-settings.sql` | the authenticator's pre-request and the other PINTAR role settings | not in a database dump |
| `facts.txt`, `readiness.txt` | `audit/restore/fakta.sql`, `launch-readiness.sql` (24 rows) | what a restore is verified against |
| `storage/` + `storage-manifest.tsv` | **every Storage object**, downloaded through Supabase's Storage S3 API (path, size, SHA-256, content type) | **B9: the files, not the metadata** |
| `release.txt` | release SHA, migration count, time | which code the data belongs to |

**B5, escrow of the cryptographic secrets.**
- `escrow-durable-secrets.yml` (dispatch-only, on `main`, environment with the owner as required reviewer) reads
  `CARD_PEPPER` and `CERT_SECRET_KEY_V1` from Vercel production (read-only).
- It checks them against `docs/recovery/durable-secrets.json`. On the first run it records the fingerprints there, by a
  coordinator commit. It then encrypts them and stores them under `production/escrow/`, locked for 5 years.
- From then on, a deploy that **mints** a secret must also escrow it before the build, or the deploy fails.
- **Recovery:** `recover-durable-secret.yml` decrypts, checks the fingerprint, and only then writes to Vercel. It needs
  the owner's approval and never prints a value.

**The PINTAR logical restore** (`scripts/recovery/restore-bundle.sh`). This is the **secondary, emergency** path, never
called equivalent (D-106(j)). In order:
1. roles, without the reserved parameter (H6);
2. schema;
3. data (replica mode);
4. the `auth.users` triggers;
5. `acl.sql`;
6. role settings;
7. Storage files from the manifest, each verified by SHA-256 after upload;
8. verification: `banding.sh` with **zero differences**, and readiness **24/24**.

**The restore drill** (`restore-drill.yml`, dispatch plus monthly).
- It restores the **staging** bundle into an empty local Supabase stack on the runner. The stack's service images are
  pinned to the hosted versions, avoiding 5 Oct's version skew.
- It verifies every table, function, right, trigger and the pre-request (0 differences), readiness 24/24, every Storage
  file by SHA-256, and the escrow's fingerprints. It times the logical path.
- The **production** bundle gets an integrity check only (download, decrypt, every hash), unless the owner allows real
  personal data to be restored on a GitHub runner (decision D5).

**Tests (CI, each red on today's code):**

| ID | Proves |
|---|---|
| DR-S08 | `acl.sql`, **executed** on CI's database: generated, then drift planted (everything granted to `anon` and `authenticated`), then applied; the rights digest equals the original and readiness is 24/24 |
| DR-S09 | the bundle and encryption: built from CI's database and Storage, encrypted, decrypted and verified against its manifest; no plaintext and no passphrase leaves the runner (a stand-in S3 receives only ciphertext) |
| DR-S10 | escrow and recovery against stand-ins for Vercel and S3: escrows on a fingerprint match; refuses a mismatch and an unrecorded value; recovery writes only a value whose fingerprint matches; never prints a value |
| DR-S11 | the wiring: schedules, environments, `main` only, read-only sessions, retention per prefix, the writer key only in the backup job, the reader key only in the drill and restore |
| DR-D02 | the logical path end to end on CI: a bundle of CI's database restored by `restore-bundle.sh` into a fresh database, with `banding.sh` 0 differences and readiness 24/24 |

**Evidence:**
- the first backups of both projects: object keys, sizes, outer SHA-256, retention dates;
- the first escrow: fingerprints recorded and matching;
- the drill on staging: 0 differences, 24/24, 28 of 28 Storage files hash-equal (today's staging), escrow fingerprints
  match, the logical-path time;
- the production bundle's integrity check.

### WP-C: B8, the Auth and platform reconstruction runbook, proven after a native restore

**The runbook** (`docs/recovery/RUNBOOK-NATIVE-RESTORE.md`):
1. Decide and freeze.
2. Native restore to a new project, from the chosen backup.
3. The owner creates the new project's scoped tokens. Their names and permissions are listed in the runbook.
4. Repoint PINTAR's production workflows. Today 25 workflows hard-code a ref: this work makes the production ones read
   the ref, URL and anon key from one guarded repository setting. The guard refuses any project whose name is not
   `pintar-production…`, and prints the ref.
5. Re-apply Auth settings and SMTP (`configure-supabase-auth.yml`, `configure-supabase-smtp.yml`), read them back
   against `supabase/auth-identitas.json`, and require that the advisors no longer report
   `auth_leaked_password_protection`.
6. Restore the Storage files from the independent copy (B9).
7. Durable secrets: if Vercel is intact, the G5 guard **keeps** them (the certificate key must open an issued seal). If
   Vercel is lost, recover them from escrow (B5).
8. `deploy-vercel-production.yml` to the new URL and keys.
9. Verify: readiness 24/24; the watch green; a staff sign-in, a class-card sign-in, a certificate verified by its token,
   and a Storage-backed file loading.
10. Reopen; record what was lost (the window since the backup).

**The proof: a hosted rehearsal on staging, mirroring the runbook.**
1. The owner starts one more native restore of `pintar-staging` (`keijhmdtsgrfvnvocfvk`), to
   `pintar-g8-rehearsal-DELETE-ME`.
2. The owner creates one temporary scoped token for it.
3. The coordinator runs steps 4–9 against it, using the staging app. The app runs as a **one-off Vercel preview
   deployment** whose build environment points at the copy; no persistent Vercel setting changes.
4. The rehearsal is timed T0→Tn and evidenced, as G2 was.
5. The owner deletes the project and revokes the temporary token. The coordinator confirms both.

**Tests:**
- **DR-S12:** the production workflows take the ref only from the guarded setting, the guard refuses a foreign name,
  and the Auth read-back asserts every value in `auth-identitas.json`. Red on today's workflows.
- **DR-S13:** the runbook's steps each name the workflow or owner action they use, and no step is "by hand" without a
  named check. A static check of the document.

**Evidence:**
- T0 to Tn, by step;
- the advisors clean of the leaked-password finding;
- Auth settings read back equal to staging's;
- the four journeys passing against the copy;
- Storage files served from the copy;
- the copy deleted and the token revoked.

### WP-D: B6, second-administrator resilience (before real-school production use)

**The minimum owner action. No code is needed: the path exists.**
1. **Name a second person** for each of:
   - the PINTAR production SYSTEM_ADMIN;
   - an administrator of the Supabase organisation, the Vercel team, the GitHub repository, the domain registrar and
     mail host, and the AWS account (if WP-B);
   - the second custodian of the backup passphrase.
2. **In PINTAR,** once production runs the PRODUCTION READY release: the person gets a staff identity. Then the current
   SYSTEM_ADMIN (Gladys, D-001) grants **SYSTEM_ADMIN** at **Konfigurasi → Peran**, which calls `grant_role`: an active
   SYSTEM_ADMIN only, audited.
3. **Evidence:**
   - two active SYSTEM_ADMINs, read as a count only (with approval to read production) or by the owner's screenshot;
   - each provider's member list, as screenshots of names and roles.

### WP-E: B7, the production watch, enabled at the release gate

The watch stays **off** until the PRODUCTION READY release step. It is switched on only when all of these hold:
- production runs the release carrying the 24-row readiness check and #150's controls;
- the B3 token is in place;
- the owner has decided who watches the repository.

**Owner action at the gate:** set `PINTAR_PRODUCTION_WATCH` to `on` (or authorise the coordinator to set it).

**Changes:**
- a release-checklist row;
- DR-S06 extended to require that the checklist names the gate.

**Evidence:** the first scheduled run green, with every check and the backups line reading a fresh backup.

### WP-F: records

- **D-103:** RPO 24 h remains provisional; flagged in the board's scale track with PITR as an operations requirement.
- **The 100,000-user recovery rehearsal:** recorded as a future scale-validation requirement.
- **The runbook** orders native restore first; the logical path is labelled secondary and **not equivalent**, with the
  5 Oct drift as the reason.

## The owner's actions, in order

| # | Action | Changes | When |
|---|---|---|---|
| O1 | Approve this plan and decisions D1–D7 | — | first |
| O2 | B3: create the backups-read-only scoped token for `pintar-production`; screenshot its permission list; put it in GitHub as `PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN` | one new, narrow credential | after WP-A's code |
| O3 | B4: AWS account (owner's, MFA on root); create the stack from the template; make access keys for the two IAM users; put them in GitHub environment secrets | a new provider account (billing) | after WP-B's code |
| O4 | B4/B5: generate the backup passphrase in the password manager; make a sealed paper copy; put it in GitHub environment secrets | one secret, owner-held | with O3 |
| O5 | B9: create a Supabase **Storage S3 access key** for production and for staging (Storage only); put them in GitHub environment secrets | two Storage-only credentials | with O3 |
| O6 | B5: approve the first escrow run (it reads the two production secrets from Vercel, read-only) | none in production | after O3–O4 |
| O7 | B8: approve and start one native restore of staging; create a temporary scoped token for the copy; delete the copy and revoke the token when told | one temporary billable project | after WP-C's code |
| O8 | B6: name the second people; the provider invitations; Gladys grants SYSTEM_ADMIN in PINTAR | people and accounts | before real-school use |
| O9 | B7: switch the watch on at the release gate | one repository variable | at PRODUCTION READY |
| O10 | The privacy-notice line on backup retention (≤ 12 months), owner or legal | — | before real-school use |

## Decisions needed before implementation

| | Decision | Recommended |
|---|---|---|
| D1 | Destination | AWS S3 ap-southeast-1, Object Lock (governance), the owner's account |
| D2 | Encryption | a passphrase (GPG AES-256) held by the owner plus a second custodian, for 4.0; age keys as a later hardening |
| D3 | Drill reviewer | the drill and restore environment needs the owner's approval per run; the drill runs monthly plus on demand |
| D4 | Retention | 35 days daily + 12 months monthly; escrow 5 years |
| D5 | Production bundle on runners | integrity check only (no restore of real personal data on GitHub runners); full restore only in a real recovery |
| D6 | Database credential for the dump | reuse the existing production database password with every session forced read-only, in a `main`-only environment (no new credential); a dedicated read-only database role is the alternative (narrower, but a new credential) |
| D7 | Schedule | daily at 20:00 UTC (03:00 WIB) |

## Cost

| Item | Estimate at today's size | At intended scale |
|---|---|---|
| S3 storage (about 47 bundles of ~0.25 GB across both projects), requests, drill egress | **under USD 1 a month** | grows with data; for example a 50 GB database is about 2.3 TB retained, about USD 60 a month. Incremental Storage copies and fewer monthly copies are the levers |
| GitHub Actions | backup about 2 × 6 min a day (about 360 min a month), monthly drill about 20 min, 3 CI runs to build | proportional to data; check against D-091's budget |
| Supabase | Storage egress about 6 GB a month (staging's 206 MB daily), within Pro's included egress; the B8 rehearsal's temporary Micro project for 1–2 hours, shown by Supabase before confirming | proportional |
| Vercel | one preview deployment for B8 | — |

## Security implications

- **New credentials, all narrow:**
  - the backups-read token (B3);
  - two Storage-only S3 keys (B9: they can read **and write** Storage, the narrowest Supabase offers for files);
  - the AWS writer key (put only: it can neither read nor delete);
  - the AWS reader key (only in the reviewer-gated drill and restore environment);
  - the backup passphrase;
  - one temporary token for the B8 rehearsal, revoked afterwards.
- **Reused, not broadened:** the production database password, in the backup job, with sessions forced read-only and
  tested so (D6).
- **Narrowed:** the watch and the facts job stop holding the broad deploy token.
- **Production personal data leaves Supabase for the first time,** encrypted before upload, in Singapore, in the
  owner's account, kept at most 12 months. The privacy notice must say so (O10, UU PDP).
- **Object Lock (governance):** a leaked writer key cannot delete or overwrite a bundle; only the account's root can
  shorten a lock.
- **Trade-off (D2/D3):** GitHub holds the passphrase, and, in the gated environment, the reader key. Someone who takes
  over the repository **and** passes the owner's approval gate could read backups. The age alternative removes the
  passphrase from GitHub, but needs a command-line key ceremony.
- **The secondary logical path re-applies exact rights before anything reopens,** and is never presented as equivalent
  to native restore.

## Sequence, CI and stop points

1. **Build, with no owner prerequisite:** WP-A; then WP-B (with escrow); then WP-C's runbook and workflow
   parametrisation. Each is one finished change with its red-then-green tests and **one CI**, landed on `main`.
2. **Credentials:** O2–O5. **Stop** if Supabase's token screen cannot isolate backups-read.
3. **Evidence:**
   - WP-A's probes;
   - the first backups;
   - the escrow (O6);
   - the staging drill;
   - the production integrity check.
4. **The B8 hosted rehearsal (O7):** timed, evidenced, deleted and revoked.
5. **WP-F records;** then B6 (O8) and B7 (O9) at their gates.
6. **The final #150 report** against D-106. Any genuine new defect stops the work for a ruling.

## Proposed #150 closure criteria under D-106 (for the owner to confirm, not redefined here)

#150 is **PASS for PRODUCTION READY** when there is evidence for each of:
- B3 (the backups read, least privilege proven);
- B4 and B9 (independent copies of the database **and Storage files**, restored and verified in the drill);
- B5 (escrow recorded and recoverable);
- B8 (the runbook proven in the hosted rehearsal).

B7 is set at the release gate. **B6 is required before real-school production use** (D-106(d)).

# #150 G3/G4 (and G5's escrow): the off-platform encrypted backup — a design for the owner's decision

> **Superseded where it differs (6 Oct):** this was the 5 Oct proposal. What was decided and built is in D-107 (OpenPGP
> recipients R1, R2 and R3, not `age`; **no** sealed paper or plaintext copy of the recovery key, D8), D-108 and D-109,
> and in `CLOSURE-PLAN-150.md`. In particular the second recipient is **not optional**: production bundles and the
> escrow go to R1 **and** R2, held by two separate custodians who have each proven possession (D-109(c)).

**Status: PROPOSAL. Nothing here is bought, created or configured.** The owner's order (6 Oct): "propose the smallest
robust provider-independent encrypted backup design covering both the database and Storage. Do not purchase or
configure a new external service without my approval. Give me the recommended destination, retention, encryption and
restoration approach first."

## What it must survive, and what it need not

Supabase's daily backups (D-103: the 24-hour RPO) already cover a bad migration, an accidental change and corruption,
**as long as the Supabase project and account exist**. They do not survive: the project being deleted (its backups are
deleted with it), the account or organisation being lost or locked, or Supabase itself being unavailable for long. They
never hold Storage objects. This design covers exactly those gaps, and the two durable secrets (G5), with one
mechanism.

## The recommendation in one paragraph

Once a day, a GitHub Actions job takes a **PINTAR-shaped logical backup** of production (the database by the
rehearsed procedure plus what that procedure loses: the `auth.users` triggers, every object's exact rights, the role
settings, and the facts to verify a restore by), downloads **every Storage object** with a manifest of hashes,
**encrypts the bundle on the runner with `age` to public keys only**, and uploads it to an **AWS S3 bucket in
Singapore (ap-southeast-1), in an AWS account the owner holds, with Object Lock**, through a key that may only write.
Daily bundles are kept 35 days and the first of each month for 12 months. Nothing in GitHub or AWS can decrypt a
bundle: the private recovery key exists only offline, in the owner's custody. A weekly drill restores the latest bundle
on a runner and must pass the same comparison and readiness checks as any real restore.

## 1. Destination

| | Recommended: **AWS S3, ap-southeast-1** | Alternative: Cloudflare R2 | Not recommended |
|---|---|---|---|
| Independence | separate provider, separate account and billing | separate provider | GitHub artifacts/releases (90-day limit, same account as the code, not a backup store); a second Supabase project (same provider and organisation) |
| Where the data sits | Singapore, the same region as Supabase today: the residency position does not change | "APAC" location hint only | Backblaze B2 (no Asia-Pacific region) |
| Cannot be deleted early | **Object Lock** (governance mode) + versioning: a leaked key, a mistake or a compromised workflow cannot delete or overwrite a bundle before its retention ends | bucket lock rules | |
| Least privilege | an IAM user that may only `PutObject` into the bucket (no read, list or delete) for the daily job; restores use a separate read key that lives nowhere but the restore run | similar with R2 tokens | |
| Cost at today's size | production's database is about 20 MB (G1, 5 Oct), Storage small: about **47 bundles retained, well under 15 GB, under USD 1 a month**; request and transfer costs negligible until a restore | similar, no egress fee | |

**Owner decisions:** the provider (S3 recommended); the AWS account (opened and paid for by the owner; MFA on the
root user; nobody else's card or identity assumed).

## 2. What a bundle holds (one tar, one `age` envelope)

| Part | How it is made | Why |
|---|---|---|
| `roles.sql`, `schema.sql`, `data.sql`, `history.sql` | the Supabase CLI dump the 5 Oct rehearsal measured (157 tables, about 25 MB on staging, 4–5 minutes) | the data, byte-identical in 150 of 157 tables in the rehearsal |
| `auth-triggers.sql` | `pg_get_triggerdef` of PINTAR's triggers on `auth.users`, from the source's own catalog | the dump leaves them out (H5); the corrected step was proven in run 37378809242 |
| `acl.sql` | for every object in `public`: `revoke all … from anon, authenticated, public`, then the source's exact grants (from `aclexplode`), column grants included | a restore into a new project opens every right through its default privileges (H4) |
| `role-settings.sql` | the role settings PINTAR depends on (`authenticator`'s `pgrst.db_pre_request`) | not in a database dump |
| `storage.tar` + `storage-manifest.tsv` | every object of the `assets` bucket through the Storage API (service role), with path, size, SHA-256, content type, and the bucket's own settings | no database backup holds Storage objects (G4) |
| `facts.txt` | `audit/restore/fakta.sql` on the source at the moment of the dump (counts, hashes and names only) | what a restore is compared against (`banding.sh`) |
| `release.txt` | release SHA, migration count, the time of the dump | which code the data belongs to |
| `secrets.age` (G5 escrow) | `CARD_PEPPER` and `CERT_SECRET_KEY_V1`, written by the production deploy when it mints them, and once for the existing values; their fingerprints are already recorded in `docs/recovery/durable-secrets.json` | the only copy outside Vercel; the G5 guard refuses to replace them, so they must be recoverable |

## 3. Encryption and custody

- **`age`** (X25519 key agreement, ChaCha20-Poly1305): a small, audited, single-purpose tool; the bundle is encrypted on
  the runner before it leaves it, to **recipients' public keys committed in the repository**. The job holds no key that
  can decrypt; S3's own encryption at rest is a second layer, not the protection.
- **The recovery key** (the private half): generated once on a computer that is offline at the time, never on a server
  and never in a chat; kept in two places the owner controls (the owner's password manager, and a sealed paper copy).
  Without it no bundle can ever be read, by anyone, including PINTAR.
- **Optional second recipient** (G9): a second custodian's key, so recovery does not depend on one person. Who that is,
  is the owner's decision; the design takes any number of recipients.
- **The drill key** (the honest trade-off): an automatic weekly drill must decrypt. That needs a third recipient whose
  private key sits in a GitHub **environment secret** usable only by the drill workflow on `main`. Anyone who can take
  over the repository could then read the backups. Without it, the drill is manual (the key holder runs it monthly),
  and an untested backup is a paper claim. **Recommended: the drill key, accepted with that trade-off**; the owner
  decides.

## 4. Retention

**Daily bundles kept 35 days; the first bundle of each month kept 12 months** (about 47 bundles), enforced by the
bucket's lifecycle rules with Object Lock retention of the same length, so nothing can shorten it silently.

Personal data in backups (UU PDP): a person erased from PINTAR remains in backups until they age out, **at most 12
months**. That should be stated in PINTAR's privacy notice; the length is the owner's decision (6 months halves the
exposure and still covers a term).

## 5. Restoration

1. **Supabase still there:** use Supabase's own restore (in place, or "Restore to a new project", G2), not this bundle.
2. **Supabase copy gone:** a new Supabase project in the same region (owner); then `restore-offsite.yml`
   (dispatch-only, on `main`, behind a GitHub environment that needs the owner's approval for each run): download,
   check the outer SHA-256, decrypt with the recovery key supplied to that run only, check every part against the
   manifest, then restore in this order: roles (skipping the parameter a project may not set, H6) → schema → data (with
   `session_replication_role = replica`) → `auth-triggers.sql` → `acl.sql` → `role-settings.sql` → Storage objects
   (same paths, content types and bucket settings).
3. **Prove before reopening:** `banding.sh` against the bundle's `facts.txt` shows no difference in data, rights,
   triggers or the pre-request; `docs/audit/launch-readiness.sql` is all PASS, its G7 rows included; the Storage
   manifest's hashes match; the time taken is recorded (the RTO).
4. **Reconnect:** Auth settings and SMTP from the repository (`configure-supabase-auth.yml`,
   `configure-supabase-smtp.yml`); the two durable secrets put back into Vercel from `secrets.age` **before** the
   deploy (the G5 guard refuses to mint over a production that holds data, and refuses a value that does not match its
   recorded fingerprint); then `deploy-vercel-production.yml`.

## 6. What it costs to run

One job a day of about 5 minutes (about 150 runner minutes a month), the weekly drill about 10 minutes (about 40 a
month), storage under USD 1 a month at today's size. Building it: the backup job, the restore workflow and the drill,
with red-then-green tests, one CI.

## 7. Decisions needed from the owner before anything is built

1. **Destination:** AWS S3 in Singapore with Object Lock (recommended), or another.
2. **Account:** opened and paid for by the owner.
3. **Custody:** who holds the recovery key (the owner; and a second custodian?).
4. **The drill key in GitHub:** yes (recommended) or a manual monthly drill.
5. **Retention:** 35 days daily + 12 months monthly (recommended), or shorter monthly retention.
6. **Schedule:** daily (matches D-103), or more often.

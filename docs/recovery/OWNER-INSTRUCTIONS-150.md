# #150 closure (D-106, D-107): the owner's actions, one at a time

**For:** Yazid (owner). Each section is given to you only when the coordinator has finished and proven the code it
depends on (D-107(a)). **Nothing here is done by the coordinator:** the coordinator never creates, sees or pastes a
credential. Never send a token, key or password to the coordinator, in a message or a screenshot.

---

## O2: C1, the token that can read production's backups and nothing else (WP-A, B3)

**Why:** G6 refuses every production migration until a machine can see production's latest backup. The watch needs
the same. Today's deploy token is not allowed to read the backups, and should not be widened. C1 is a separate token
that reads the backup list **and nothing else**.

**What changes:** one new token in your Supabase account, and one new GitHub repository secret. Nothing in Supabase's
projects, settings, billing or data changes. The existing deploy token stays as it is.

### Steps

1. Open supabase.com/dashboard → your account menu (top right) → **Access Tokens**.
2. **Generate new token.**
   - Name: `pintar-production-backups-read`.
   - Expiry: **12 months**, if offered. Note the date: when it passes, G6 and the watch will say so, and the token is
     renewed by these same steps.
3. Choose the token's permissions. **If the page offers no choice of permissions, stop here and tell the
   coordinator.** That is a stop point: it means Supabase cannot limit this token, and nothing else is tried.
   - **Organisation:** ZAYD.
   - **Project:** **only** `pintar-production` (`trtlvibiybwixfumjrrx`).
   - **Permission:** **only** Database → **Backups** → **Read**. Not Read-write. Nothing else.
4. **Before you press Generate**, take one screenshot of the choices in step 3. The token does not exist yet, so the
   screenshot cannot show it.
5. Press **Generate**. Supabase shows the token once. Copy it.
6. Open github.com/yazidmanan2409/pintar40 → **Settings** → **Secrets and variables** → **Actions** → **New
   repository secret**.
   - Name: `PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN`
   - Secret: paste the token → **Add secret**.

   Paste it nowhere else.
7. Tell the coordinator **"C1 added"**, and send the screenshot from step 4.

### What the coordinator then does (read only)

- Runs **facts · backups and recovery (read only)** from `main`. With C1 it:
  - reads production's backup list;
  - shows that C1 is **refused** the API keys, the Auth settings, the project's settings, the Edge Function
    secrets, staging's backups, and the account's projects and organisations;
  - runs G6's check dry; nothing is applied.
- Records the result and your screenshot's permission list, with no token value, in the #150 record.

### If something goes wrong

- **The run says TOO BROAD:** the token can reach more than the backups. Revoke it at once (Access Tokens → the
  token's menu → Revoke). Tell the coordinator; nothing else is tried.
- **The run says UNPROVEN:** the coordinator reads why and tells you. No retry without your word.
- **Unsure at any step:** stop and ask. Nothing here is urgent.

**Rotation:** the same steps make a new token. Replace the secret's value, then revoke the old token.
**Revocation:** Access Tokens → Revoke. G6 then refuses production migrations again, and the watch reports it.

---

## B (D-108(e)): a question for Supabase support (non-blocking)

**Why:** any database login on Supabase can create or drop the extensions on Supabase's allow-list, through its
`supautils` extension manager (CLOSURE-PLAN-150.md § A7). #150 does not wait for the answer.

**When convenient:** open a support ticket from the Supabase dashboard (Help → Support) for organisation ZAYD, project
`pintar-production`, and send this text:

> We use a dedicated database LOGIN role for logical backups (`pg_dump`). It is a member of `pg_read_all_data` with
> BYPASSRLS and has no other privilege. We observed that `supautils` lets this role create and drop extensions on
> `supautils.privileged_extensions` (for example `DROP EXTENSION pgcrypto CASCADE`), as `supabase_admin`. Can extension
> creation/drop through `supautils` be disabled or restricted for a specific dedicated database LOGIN role, while
> retaining that role's read access required for `pg_dump`?

Send nothing else: no password, key, connection string or data. Forward the answer to the coordinator. If Supabase
offers a supported restriction, the coordinator brings it back to you before anything changes.

---

## O3–O7: WP-B's owner actions — PREPARED, NOT YET TO BE DONE

**Do none of these until the coordinator asks for each one, after you have approved it** (D-107(a): the coordinator
reports before every owner action or external service). They are written down now so they can be reviewed with the code.
Migration 162 (`pintar_backup`) is authorised for staging only (D-109(a)); production needs its own authorisation.

**Before O3 (D-111(c)):** two things must be green first: the staging pooler proof (you give the coordinator the
staging project's Connect → Session pooler host, port and user; no password) and O2 above, with the run saying
`ISOLATED`. Then O3 onward, one at a time; each first use of real infrastructure is a stop point if anything
unexpected happens (D-111(d)). Staging succeeding does not authorise anything in production (D-111(e)).

**D-109(c): production waits for two custodians.** Production backups and the escrow are encrypted to R1 **and** R2,
never to one custodian's key alone. Before the first production backup or escrow: R1 and R2 both exist, held by two
separate approved custodians, and each custodian has proven, on their own, that they hold their key and can decrypt
with it (the possession check below). Until then the code refuses every production backup and every escrow
(`docs/recovery/custody.json` says who holds which key, by role only, and when each proved it). Staging goes ahead
with R1 and R3 meanwhile.

The order: O3 (AWS), O4 (keys), O5 (Supabase Storage keys), O6 (the `pintar_backup` passwords), then the coordinator's
first backup and drill runs, then O7 (the first escrow).

### O3: AWS (D-107 D1)

1. An AWS account in your name, with **MFA on the root login**. Keep the recovery codes offline.
2. CloudFormation → Create stack → upload `infra/aws/pintar-backup.json` → stack name `pintar-backup`. Region **Asia
   Pacific (Singapore)**. BucketName: `pintar-backup-` followed by a few random letters.
3. IAM → Users → `pintar-backup-writer` → Security credentials → Create access key ("application running outside
   AWS"). Put it in GitHub (Settings → Environments):
   - environment **`backup`**: secrets `AWS_BACKUP_WRITER_KEY_ID` and `AWS_BACKUP_WRITER_SECRET`;
   - environment **`escrow`**: the same two secrets.
4. The same for `pintar-backup-reader`:
   - environments **`staging-recovery-drill`** and **`production-recovery`**: secrets `AWS_BACKUP_READER_KEY_ID` and
     `AWS_BACKUP_READER_SECRET`.
5. Repository variable `PINTAR_BACKUP_BUCKET` = the bucket's name.
6. On each of the four environments: deployment branches = `main` only. On `escrow`, `production-recovery` and
   `staging-recovery-drill`: required reviewer = you.

### O4: the key ceremony (D-107 D2)

1. Install a desktop OpenPGP application: GPG Suite (Mac) or Kleopatra (Windows).
2. **R1 (you, custodian A):**
   - make a new key pair named "PINTAR recovery R1", with a strong passphrase;
   - export the **public** key and send it to the coordinator;
   - export a **backup of the private key** to offline media, kept in a safe.
3. **R3 (the staging drill key, opens synthetic staging data only):**
   - make a new key pair named "PINTAR staging drill R3", **without** a passphrase;
   - export the public key to the coordinator;
   - export the private key as text and put it in environment `staging-recovery-drill`, secret
     `STAGING_DRILL_PRIVATE_KEY`;
   - then delete R3's private key from your computer.
4. **R2 (custodian B, named under B6)** is made by custodian B, on their own computer, the same way as R1: their own
   passphrase, their own offline backup of the private key; only the public key comes to the coordinator. You never
   hold R2's private key, and custodian B never holds R1's.
5. Repository variable `PINTAR_BACKUP_RECIPIENTS_STAGING` = `R1 R3`, and `R1 R2 R3` once R2 exists. Production's
   recipients are not a setting: they are fixed at `R1 R2` (D-109(c)).
6. **Each custodian proves possession, separately.** The coordinator runs **key possession check** for R1 and for R2.
   Each custodian alone decrypts their own message with their own key and passphrase and sends back only the phrase;
   the coordinator compares its SHA-256 with the run's. Only when both match does the coordinator record both proofs
   in `docs/recovery/custody.json`, and only then can production be backed up or escrowed.

### O5: the Supabase Storage S3 keys (C3; Supabase's, not AWS)

For each project (`pintar-production`, then `pintar-staging`): Supabase → Storage → Settings → S3 access keys → New
access key. Put them in environment **`backup`**:
- `PRODUCTION_SUPABASE_STORAGE_S3_KEY_ID` and `PRODUCTION_SUPABASE_STORAGE_S3_SECRET`;
- `STAGING_SUPABASE_STORAGE_S3_KEY_ID` and `STAGING_SUPABASE_STORAGE_S3_SECRET`.

### O6: the `pintar_backup` passwords (C2)

Your password manager makes a random password of 40 characters (letters, digits and symbols, no spaces) for each
database. Put them in environment **`backup`**: `STAGING_DB_BACKUP_PASSWORD` and `PRODUCTION_DB_BACKUP_PASSWORD`.
The coordinator then runs **backup credential · set** for each. The database receives only a verifier; the password
never leaves GitHub.

### Then the coordinator, read only where it can be

1. Records production's extension baseline (read only).
2. Runs one staging backup, and shows one planted failure red. The first production backup waits for both
   custodians' proofs (O4 step 6).
3. Runs the drill.
4. Runs the possession check.

Each run is reported to you before the next step.

### O7: the first escrow

Approve the run of **escrow · the durable secrets** (environment `escrow`). It needs both fingerprints recorded in
`docs/recovery/durable-secrets.json` first (the next production deploy prints them), and both custodians' proofs
(O4 step 6): the escrow, like a production bundle, goes to R1 and R2 together. A durable secret is never minted
unless it is escrowed first (D-109(b)).

### Afterwards

Set the repository variables `PINTAR_OFFSITE_BACKUP`, `PINTAR_RECOVERY_DRILL` and `PINTAR_POSSESSION_CHECK` to `on`
when you decide. Until then the schedules do nothing.

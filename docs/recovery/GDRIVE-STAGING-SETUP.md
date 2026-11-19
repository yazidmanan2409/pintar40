# Staging backup to Google Drive: the owner's setup (D-189, 5 Nov 2026)

**What this sets up.** The existing staging backup (`backup-offsite.yml`) and its isolated restore test
(`restore-drill.yml`) keep their logic unchanged: the database and every Storage file, encrypted before upload,
checksums, the success record last, and a restore into an empty stack. Only the place the encrypted bundles are kept
changes, from AWS S3 to your Google Drive (`scripts/recovery/gdrive.mjs`). AWS is paused; nothing is created there.

**Never put a password, a token, a client secret or a private key in chat, in the repository or in a log.** Every
value below goes straight into GitHub's settings, where only the protected workflows can read it.

## Why PINTAR makes its own Drive folder

The narrowest authorisation that can upload unattended is OAuth with the **`drive.file`** scope. PINTAR can then see,
create and delete **only the files it created itself**; nothing else in your Drive, your 5 TB included, is visible to
it.

That scope cannot reach a folder that you created, so «PINTAR — Staging Backups» (`1EVjr_tir04iYnHXNSVZLOMGw72VG9TCt`)
is not written to directly. Knowing its ID gives no access either.

The other ways are worse:
- the full `drive` scope reaches the whole Drive;
- a service account shared on that folder has no storage of its own on a personal (non-Workspace) account, so its
  uploads fail.

So the first backup creates the folder **«PINTAR backup (pintar-staging)»**. Once it exists you may drag it into
«PINTAR — Staging Backups». PINTAR's access follows its own files, not where they sit, so the move breaks nothing.

## A · Google: one OAuth client and one refresh token (about 15 minutes)

1. **The project.** Go to <https://console.cloud.google.com/>, signed in as the account that owns the 5 TB. Create the
   project `pintar-staging-backup`. Then APIs & Services → Library → **Google Drive API** → Enable.
2. **The consent screen.** Go to APIs & Services → OAuth consent screen (Google Auth Platform).
   - User type **External**. App name `PINTAR staging backup`. Your own address as the support and developer contact.
   - Data access / Scopes: add **only** `https://www.googleapis.com/auth/drive.file`.
   - Audience: press **Publish app** to put it **In production**. While it is in *Testing*, Google expires the refresh
     token after 7 days and the nightly backup would stop. `drive.file` is not a sensitive scope, so Google asks for
     no verification.
3. **The client.** Go to Credentials → Create credentials → OAuth client ID.
   - Type **Web application**, name `pintar-backup-writer`.
   - Authorised redirect URI: `https://developers.google.com/oauthplayground`.
   - Keep the client ID and client secret open for step 5; do not save them anywhere else.
4. **The refresh token.**
   - Open <https://developers.google.com/oauthplayground>. Click the gear and tick **Use your own OAuth credentials**,
     then enter the client ID and secret.
   - Step 1: type the scope `https://www.googleapis.com/auth/drive.file` (only that one) → **Authorize APIs** → sign in.
   - The consent screen must say only *«See, edit, create and delete only the specific Google Drive files you use with
     this app»*. If it asks for more, stop.
   - Step 2: **Exchange authorization code for tokens**. Copy the **Refresh token**.
5. **Into GitHub.** Go to Settings → Environments. Create the environment if it does not exist yet, then add each
   secret to both **`backup`** and **`staging-recovery-drill`**:
   - `GDRIVE_CLIENT_ID`
   - `GDRIVE_CLIENT_SECRET`
   - `GDRIVE_REFRESH_TOKEN`
6. **Protect the environments.** On both, set Deployment branches to **`main` only**. On `staging-recovery-drill`, set
   yourself as **Required reviewer**.
7. **The destination.** Settings → Secrets and variables → Actions → Variables: set `PINTAR_BACKUP_DESTINATION` =
   `gdrive`.

The backup refuses a token that carries any scope wider than `drive.file`.

**To revoke at any time:** <https://myaccount.google.com/permissions> → PINTAR staging backup → Remove access. Every
backup then fails closed and opens the staging backup issue.

## B · The recovery keys (O4, staging part)

8. **R1, your recovery key.**
   - In GPG Suite (Mac) or Kleopatra (Windows), make a key pair named «PINTAR recovery R1» **with** a strong passphrase.
   - Back up the **private** key to offline media.
   - Send the coordinator the **public** key only. It is committed to `docs/recovery/keys/R1.asc`.
9. **R3, the staging test-restore key.**
   - Make a key pair named «PINTAR staging drill R3» **without** a passphrase.
   - Send the coordinator the **public** key; it is committed to `docs/recovery/keys/R3.asc`.
   - Put the **private** key, exported as text, into environment `staging-recovery-drill`, secret
     `STAGING_DRILL_PRIVATE_KEY`.
   - Then delete R3's private key from your computer.
10. **The recipients.** Set the repository variable `PINTAR_BACKUP_RECIPIENTS_STAGING` = `R1 R3`.

Neither private key is ever in Google Drive. R3 opens synthetic staging data only, and production never uses it.

## C · Staging's own two credentials (O5, O6, staging part)

11. **The Storage key.** In Supabase, open `pintar-staging` → Storage → Settings → S3 access keys → New access key.
    Put it in environment `backup` as `STAGING_SUPABASE_STORAGE_S3_KEY_ID` and `STAGING_SUPABASE_STORAGE_S3_SECRET`.
    The backup uses it to read staging's Storage files.
12. **The database password.** Have your password manager make a random 40-character password. Put it in environment
    `backup` as `STAGING_DB_BACKUP_PASSWORD`.

## What the coordinator then runs (each step reported before the next)

1. `backup credential · set`, target staging. This gives `pintar_backup` the password; the database receives only its
   verifier.
2. `backup · offsite`, target staging: one backup.
   - It writes the daily copy (plus the monthly copy on the 1st), each with its success record last.
   - Drive's own SHA-256 is checked against each record.
3. A deliberate failure, to show that a broken run is red and leaves no success record.
4. `recovery drill`, staging, with your approval. It fetches the bundle, checks its SHA-256, decrypts it with R3, and
   restores it into an **empty** Supabase stack on the runner, never staging itself. It passes only if:
   - there are 0 differences;
   - every Storage file's hash matches (all 29 objects);
   - the extension baseline matches;
   - readiness reads 24/24, SAFE TO REOPEN.
5. The evidence:
   - the backup's timestamp, size and SHA-256;
   - the object count;
   - the restore result;
   - staging's file fingerprint still `166f7a3bc2f7b9594bfdda62e96e14f3`.

**Then, your choice:** set `PINTAR_OFFSITE_BACKUP_STAGING` = `on` for the nightly 03:00 WIB backup. That switch is
staging-only; production's job is untouched.

## What this is not

- **Not immutable.** Google Drive has no object lock. Your account, or this token, can delete a backup at any time, and
  Drive's trash is ordinary deletion recovery, not protection (D-189(9)). Every success record says so (`immutable:
  false`).
- **Retention is enforced by pruning:**
  - daily copies are kept 35 days, monthly copies 366 days;
  - after each successful backup, expired copies are deleted, never the one just made.
- **Failures are reported** by GitHub's failed-run notice and by one open issue, «Staging backup: the offsite staging
  backup failed», with a comment for each further failure.
- **Production is out of scope.** Production backups stay refused until R1 and R2 are held by two custodians (D-109(c)).

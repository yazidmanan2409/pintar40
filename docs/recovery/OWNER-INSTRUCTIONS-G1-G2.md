# #150: the owner's instructions for G1 and G2

**For:** Yazid (owner). **Prepared:** 6 Oct 2026, after #150's NOT PASS (accepted; D-104).
**Nothing here is done by the coordinator.** The coordinator changes no credential, permission, billing, production
data or infrastructure. Each step below is yours. Each says what it changes, if anything, and what the coordinator
does afterwards (read only).

The three projects in organisation **ZAYD**:

| Project | Ref (in the dashboard URL) | Role |
|---|---|---|
| `pintar-production` | `trtlvibiybwixfumjrrx` | production: **never** the source or target of anything in G2 |
| `pintar-staging` | `keijhmdtsgrfvnvocfvk` | staging: synthetic data only (D-064); **G2's source** |
| `pintar` | `sknixmwkynzmrgbxzrvb` | the old development project: not involved |

Before every click, check **two things**: the project name at the top of the dashboard, and the ref in the browser's
address bar.

---

## G1. Production's backups, seen

There are two parts. Part 1 changes nothing and gives the evidence once. Part 2 is a credential change that lets
machines read the backup list from then on. G6 needs Part 2 before **any** production migration can run, and the
production watch's backup check needs it too.

### G1, Part 1: look, change nothing (about 2 minutes)

1. Open supabase.com/dashboard → organisation **ZAYD** → project **`pintar-production`**. The address bar must show
   `trtlvibiybwixfumjrrx`.
2. Left menu → **Database** → **Backups**.
3. On the **Scheduled backups** tab, **do not click Restore or Download** on anything. Take one screenshot of the list.
   It shows each backup's date and time and status, plus any label such as "Physical".
4. Open the **Point in Time** tab and take one screenshot of what it says.
5. Send both screenshots to the coordinator. They show dates, statuses and sizes only, no personal data.

**The coordinator then** records, in the #150 review:
- how many backups there are (Pro keeps up to 7 days);
- the latest completed one, and its age;
- that PITR is off.

It raises at once if there are fewer backups than expected, if any failed, or if the latest is older than 26 hours.

### G1, Part 2: let the production token read backups (a credential change; your decision)

**What changes.** The scoped Supabase token held in GitHub as `PRODUCTION_SUPABASE_ACCESS_TOKEN` gains **one read-only
permission**: the backup list. Nothing else changes.

**What that token already does today** (so a new one must keep it):
- writes production's Auth settings (configure-supabase-auth, configure-supabase-smtp and deploy-vercel-production; it
  needs Auth Config read-write and Project Settings read-write);
- reads the project's API keys for the deploy (it needs API Keys read);
- reads the facts workflows.

1. Supabase → your account (avatar, top right) → **Access Tokens**. Find the **scoped** token for
   **`pintar-production`**. It starts `sbp_fc`. Its value cannot be shown again, and that is fine.
2. **If the token's permissions can be edited:** add the read permission for **database backups** (Supabase may label
   it "Backups" or "Database Backups"), **Read** only. **Never a write or restore permission**: that one could restore
   over production. Save. The GitHub secret does not change. Go to step 5.
3. **If they cannot be edited:** generate a new **scoped** token, scoped to **`pintar-production` only** (never staging,
   never the organisation). Give it **exactly the permissions the old token's page lists, plus backups Read**. Name
   it, for example, `PRODUCTION · github · with backups read`.
4. GitHub → `yazidmanan2409/pintar40` → **Settings** → **Secrets and variables** → **Actions** →
   `PRODUCTION_SUPABASE_ACCESS_TOKEN` → **Update** → paste the new token → Save. **Do not delete the old token yet.**
5. Tell the coordinator "G1 token done".

**The coordinator then:**
- dispatches `facts · backups and recovery (read only)`. It sends HTTP GETs only, and prints the token's kind and an
  8-character fingerprint, never the value. The backup list must answer 200, and the backups are recorded;
- dispatches `watch · production (read only)` once; its backup line must stop reading "not readable".

It reports the permissions the new token was seen to have. If you made a new token (step 3), the coordinator says when
the next workflow that writes Auth settings or reads the API keys has succeeded with it. Only then do you revoke the old
token, in Access Tokens.

**If you prefer not to change the token now:** Part 1 alone gives G1's evidence once. But every production migration
stays refused by G6 until Part 2 is done; that is by design.

---

## G2. One hosted restore rehearsal: "Restore to a New Project" from staging

**What it creates:** one new, temporary, billable Supabase project. It is a copy of **staging**, which holds synthetic
data only, taken from staging's latest daily backup. Supabase copies:
- the database schema and data;
- roles and permissions;
- Auth users.

It does **not** copy:
- Storage files or bucket settings;
- Auth settings;
- API keys;
- Edge Functions;
- Realtime settings;
- extensions and database settings.

It copies staging's compute size (Micro) and region (Singapore). **Staging itself is not changed.** Staging's
extensions (pg_stat_statements, pgcrypto, plpgsql, supabase_vault, uuid-ossp) make no outside calls, so nothing needs
switching off in the copy.

**Cost:** Supabase shows the copy's cost before you confirm. It is billed for the hours it exists. The coordinator
needs about 1–2 hours of it, then you delete it.

### G2, Step 1: start the restore (about 2 minutes)

1. Open supabase.com/dashboard → organisation **ZAYD** → project **`pintar-staging`**. The address bar must show
   `keijhmdtsgrfvnvocfvk`. **If it shows `trtlvibiybwixfumjrrx`, stop: that is production.**
2. Left menu → **Database** → **Backups** → the **Restore to a New Project** tab.
3. Choose the **most recent** backup → **Restore**.
4. If asked for a name, use **`pintar-g2-rehearsal-DELETE-ME`**.
5. Read the cost Supabase shows. Confirm only if it is what you expect.
6. Note the time you confirmed (with your time zone). Tell the coordinator "G2 started at …".

**Do not touch the new project.** Do not reset its database password, change its settings, copy its keys, connect any
app to it or share its address. The coordinator reads it through the Supabase connector, with read-only queries only.

### G2, what the coordinator does while the copy exists (read only, nothing for you)

- **Time:** from your confirmation to the copy reporting `ACTIVE_HEALTHY` (the recovery time, RTO).
- **Data fidelity:** row counts and content hashes of every table, against staging (`audit/restore/fakta.sql`); no
  values are read out.
- **Security controls:**
  - the readiness check, all 24 rows;
  - the three `auth.users` triggers;
  - the table and view rights;
  - the function rights;
  - row security and the 131 policies;
  - object owners;
  - PostgREST's pre-request;
  - the `assets` bucket.
- **Auth users:** counts and hashes only; never an email or a name.
- **What did not come across,** each classified as one of:
  - **restored**;
  - **lost, and put back by the repository's own workflows**: Auth settings, SMTP and keys, in a real recovery;
  - **lost, and needing a procedure**: Storage files, for which G3/G4 is still design only.
- **The record:** the #150 review's G2 section and the runbook (Part II §7), corrected to what was actually seen.

**Auth settings and Storage files** are recorded as "not copied", from Supabase's documentation and from what the
database shows. Checking them by machine on the copy would need a small new read-only workflow, or the copy's secret
key. Neither is used without your approval.

When the evidence is captured, the coordinator tells you **"G2 evidence captured: delete the copy"**, with the copy's
name and ref.

### G2, Step 2: delete the copy (about 2 minutes, after the coordinator's message only)

1. Open the copy: **`pintar-g2-rehearsal-DELETE-ME`**, or whatever name Supabase gave it. Its ref is the one the
   coordinator sent. **It must not be `pintar-staging`, `pintar-production` or `pintar`.**
2. **Project Settings** → **General** → **Delete project** → type the name to confirm.
3. Tell the coordinator "G2 copy deleted".

**The coordinator then** confirms that the organisation lists only the three projects above, and records the deletion
and the total time the copy existed.

### If something goes wrong in G2

- **The restore fails, or is not `ACTIVE_HEALTHY` after 60 minutes:** tell the coordinator. **Do not start another
  one**, because each attempt is a new billable project. The coordinator reads its state and advises.
- **You restored from the wrong project:** stop, and do not delete anything yourself. Tell the coordinator, who
  identifies which project is the new one before anything is removed.
- **You are unsure at any point:** stop and ask. Nothing in G2 is urgent.

---

## What closes, and what does not

- **G1** closes with Part 1's screenshots **and** Part 2's machine read. Part 1 alone closes the evidence, not G6's
  block.
- **G2** closes with the copy verified, timed and deleted.
- **#150 still needs G3/G4 (with G5's escrow) to PASS.** That stays **design only** until you authorise it (D-104).

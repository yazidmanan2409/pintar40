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

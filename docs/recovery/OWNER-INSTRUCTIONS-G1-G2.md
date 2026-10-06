# #150: the owner's instructions for G1 Part 1 and G2

**For:** Yazid (owner). **Prepared:** 6 Oct 2026. **Revised the same day** to the Second Eye ruling recorded as D-105.
The revision: G1 Part 2 on hold; G2 approved; recovery time measured, not assumed; G3/G4 design only.

**Nothing here is done by the coordinator.** Each dashboard step is yours. The coordinator changes no credential,
permission, billing, production data, infrastructure, Supabase setting, GitHub secret or Vercel setting, and repairs
nothing on the temporary project. It reads, through the Supabase connector, with read-only queries only.

The three projects in organisation **ZAYD**:

| Project | Ref (in the dashboard URL) | Role |
|---|---|---|
| `pintar-production` | `trtlvibiybwixfumjrrx` | production: **only looked at** in G1 Part 1; **never** the source or target of G2 |
| `pintar-staging` | `keijhmdtsgrfvnvocfvk` | staging: synthetic data only (D-064); **G2's source** |
| `pintar` | `sknixmwkynzmrgbxzrvb` | the old development project: not involved |

Before every click, check **two things**: the project name at the top of the dashboard, and the ref in the browser's
address bar.

---

## G1 Part 1: look at production's backups, change nothing

1. Open supabase.com/dashboard → organisation **ZAYD** → project **`pintar-production`**. The address bar must show
   `trtlvibiybwixfumjrrx`.
2. Left menu → **Database** → **Backups** → the **Scheduled backups** tab.
3. **Do not click Restore, Download or any other button.** Take one screenshot that shows the whole list. If the list
   is longer than the screen, scroll and take another.
4. Open the **Point in Time** tab. **Click nothing** (in particular, do not enable anything). Take one screenshot.
5. Send the screenshots to the coordinator. They show dates, statuses and sizes; no personal data.

**The coordinator then records only what the screenshots show:**
- whether scheduled backups exist;
- how many are visible;
- the latest completed backup, and its age at the time of the screenshot;
- any failed or missing backup that is visible;
- the PITR status as the page states it.

Nothing that cannot be seen is inferred.

### G1 Part 2: ON HOLD (D-105)

There is no token or credential step. The automated backup read that G6 needs will be solved separately. Until then G6
keeps refusing production migrations; it is not weakened.

---

## G2: one "Restore to a New Project" rehearsal from staging (approved, D-105)

**Source: `pintar-staging`, ref `keijhmdtsgrfvnvocfvk`.** Never `pintar-production` (`trtlvibiybwixfumjrrx`).

**What it creates:** one temporary, billable Supabase project from staging's most recent backup. Staging itself is not
changed. Supabase's documentation says what is and is not copied. **G2 tests those claims;** it does not assume them.
Staging's extensions (pg_stat_statements, pgcrypto, plpgsql, supabase_vault, uuid-ossp) make no outside calls, so
nothing needs switching off in the copy.

The coordinator gives these steps again, with the source repeated, when G1 Part 1 is done.

### G2, Step 1: the restore (T0)

1. Open supabase.com/dashboard → organisation **ZAYD** → project **`pintar-staging`**. The address bar must show
   `keijhmdtsgrfvnvocfvk`. **If it shows `trtlvibiybwixfumjrrx`, stop: that is production.**
2. Left menu → **Database** → **Backups** → the **Restore to a New Project** tab.
3. Choose the **most recent** completed backup → **Restore**.
4. If asked for a name: **`pintar-g2-rehearsal-DELETE-ME`**.
5. Read the cost Supabase shows; confirm only if it is what you expect.
6. **Note the exact time you confirmed, with your time zone. That is T0.** Tell the coordinator
   "G2 confirmed at <time>".

**Only one attempt.** If it fails, or does not finish, tell the coordinator; do not start another without explicit
approval.

**Do not touch the new project.** Do not reset its password, change its settings, copy its keys, connect anything to
it or share its address.

### G2, what the coordinator measures and verifies (read only; nothing for you)

**Time, measured:**
- T0: your confirmation;
- T1: Supabase reports the new project available or healthy (the connector, polled);
- T2: its database answers a query;
- T3: PINTAR's verification completes.

**Recorded:**
- the restore duration (T1−T0);
- the time to queryable (T2−T0);
- the verification duration (T3−T2);
- the total (T3−T0).

This is a measurement on the current staging dataset, not a prediction for production at intended scale.

**Verified against staging, deterministically where possible:**
- schema and migration history;
- PINTAR's table counts and content hashes;
- representative critical records;
- Auth users by count and hash, never a value;
- the identity links;
- row security and policies;
- table rights and function rights;
- SECURITY DEFINER functions and owners;
- the `auth.users` triggers;
- the pre-request;
- the audit-log protections;
- all 24 readiness rows, by row;
- Storage **metadata** apart from Storage **files**;
- each piece of configuration the restore does not reproduce.

**Compared with the 5 Oct logical restore,** point by point.

The copy's original state is captured before anything else is looked at. **Nothing on the copy is repaired.**

### G2, Step 2: deletion (only after the coordinator's message)

The coordinator sends exactly: **"G2 EVIDENCE CAPTURED — SAFE TO DELETE TEMPORARY PROJECT"**, with the temporary
project's **name** and **ref**. It will have checked that neither equals `pintar-staging` / `keijhmdtsgrfvnvocfvk`,
`pintar-production` / `trtlvibiybwixfumjrrx`, or `pintar`.

1. Open the project with **that name and that ref**. Check both.
2. **Project Settings** → **General** → **Delete project** → type the name to confirm.
3. Tell the coordinator "G2 copy deleted".

**The coordinator then** verifies that the temporary project is gone and that only the three projects above remain,
and records it.

### If something goes wrong

- The restore fails, or is not available after 60 minutes: tell the coordinator; **no second attempt** without approval.
- The wrong source project was used: stop; delete nothing yourself; tell the coordinator.
- You are unsure: stop and ask. Nothing here is urgent.

---

## Scope (D-104, D-105)

- **Required now:** G1 Part 1 and G2.
- **On hold:** G1 Part 2, and G6's automated backup read (G6 stays fail-closed).
- **Design only:** G3/G4 and G5's escrow. Their implementation is not authorised and is **not** a condition of the
  current #150 scope. Whether independent database, Storage and secret recovery is required before large-scale
  production (100,000 active users a day, 1,000 lessons, 75,000 questions) is a later owner ruling.

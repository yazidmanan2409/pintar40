# Batch 0 · Deliverable 7 · Migration 162: owner brief (2 Nov 2026)

**Correction 4 of the 2 Nov authorisation.** No production migration or database change is authorised, and none was made.

**Method:** read-only analysis of the migration files and of both application versions (`git show`, `git grep`). Production's database was **not** read. It has not been read since 23 Sep (F-18).

**In one line:**
- Production needs migration 162 for its backups.
- Reaching it means applying 51 migrations in order, several of them high-risk.
- A database stopped at exactly 162 runs **neither** the current production app nor the current candidate correctly.
- **The recommended path changes:** upgrade production to the **full candidate**, database and app together, in one rehearsed technical release with no new users. Not «162 alone».

## 1. Why 162 is required

- Migration **162** is `20261125100000_a_backup_reads_everything_and_writes_nothing.sql`, ordinal 162 of 177.
- It creates the cluster role **`pintar_backup`**: LOGIN, BYPASSRLS, `pg_read_all_data`, and nothing else.
- Every production backup path of #150 depends on that role:
  - the logical bundle (G4/G5);
  - the escrowed copies R1 and R2;
  - the O8 reconstruction rehearsal.
- Without it, **#150 cannot PASS**, and Gate 4 cannot pass (`G-FINAL-ACCEPTANCE-MATRIX` §4).
- Staging has had it since run 37414019844 (161 → 162). Its 16-line profile matches.

## 2. Why the 50 before it come with it

- `supabase db push` applies migrations **strictly in filename order**, and every migration assumes the ones before it.
- Production holds **111**. Its last is `20261005120000_activation_is_granted_not_inferred.sql`.
- Production's 111 are a **byte-identical prefix** of the repository's 177, so no applied migration was edited.
- Reaching 162 therefore means applying **112 → 162: 51 migrations**.
- Applying 162 out of order would break the in-order rule that the production workflow and the history check enforce (`deploy-supabase-production.yml` checks history = repository).

## 3. What 112–162 do to production

- **No migration drops a table or column or changes a column type.**
- Nearly every one ends with assertions. If an assertion fails, that migration rolls back and `db push` stops at the previous one.

**The high-risk ones:**

| # | What it does | Risk |
|---|---|---|
| **127** | Gives every existing person a random `pintar_id` (then NOT NULL and unique). Marks **every existing email account `account_setup = REQUIRED`**, including production's only admin | Irreversible data rewrite. The admin must complete setup at next sign-in. Needs W9.14 (staff transition) rehearsed |
| **139** | Backfills pass marks by casting `passing_rules->>'mastery_min'` to a number in 0..1, with row triggers disabled; then seals the values | **Can fail on production's real data** if any value is non-numeric or a percentage. Sealed values cannot be corrected in place |
| **147** | Revokes direct INSERT/UPDATE on `learning_assignments`, `assessment_assignments`, `institutions`, `classes` | Changes a contract the production app uses (§4) |
| **148** | `revoke_role(uuid)` becomes `revoke_role(uuid, text)`, with the old version dropped | Breaks the production app's role revocation (§4) |
| **149, 153** | Triggers on `auth.users`: password-hash and email writes refused without a PINTAR permit | A defect blocks sign-in or recovery. Dashboard password resets stop working by design |
| **154** | `ALTER ROLE authenticator SET pgrst.db_pre_request`: a function runs on **every API request** | A defect blocks every API call. It is cluster-level |
| **115, 122** | A release policy dropped; two functions' result type changes from `text[]` to `jsonb` | Break Studio in the production app (§4) |
| **162** | Creates `pintar_backup`; its assertions read the **whole catalogue** (e.g. any SECURITY DEFINER function executable by PUBLIC fails it) | Depends on production's catalogue being as expected, which is unread since 23 Sep |

The others (112–126, 128–138, 140–146, 150–152, 155–161) are additive, security-narrowing, or seed reference data:
- **117, 131, 137** insert standard report templates and live metric catalogues.
- **150** stops a quick assessment from certifying.
- **155** fails if any structure node lacks a learning context. That too is a production-data dependency.

## 4. Application and database compatibility

**Production's app (`5b5b68d`) on a database at 162 breaks in four places:**

| Where | Cause | Effect |
|---|---|---|
| `src/app/konfigurasi/actions.ts:126` calls `revoke_role(p_assignment)` | 148 dropped that signature | Revoking a role fails |
| `src/app/studio/actions.ts` updates `plp_releases` directly | 115 dropped the update policy | Freezing a release silently does nothing |
| `src/app/studio/paket/[course]/page.tsx` renders `reasons` as strings | 122 made them objects | The Studio package page crashes when blockers exist |
| `src/app/mengajar/actions.ts:81,100` writes `learning_assignments` | 147 revoked it | A teacher cannot make a lesson available |

Other effects: changed behaviour from 117, 149 and 150 (§3). Sign-in, magic link and cards keep working. The other 70 RPCs the old app calls are unchanged (signature comparison).

**The candidate app (`001a357`, main = staging) on a database at exactly 162: does not run.** It calls objects created by 163–177:
- `konteks_*` (177): the home page and all routing;
- `authorize_email_correction` (170);
- `management_decision_independent_decider` (172);
- the certificate functions and columns of 168.

**Therefore:**
- **«162 now, with the old app, no new users» (F-5 option 1 as written)** would leave production with four broken functions. It would also need a purpose-built release commit with exactly 162 migrations, which does not exist. The production workflow is pinned to `c358f58` (111) and checks history = repository.
- **«Database to the candidate (177+) and the candidate app together»** is the only combination where both sides match. It is what staging runs today.

## 5. Recommended path: a rehearsed technical upgrade, then PRODUCTION READY

**F-5 restated:**
1. **Technical upgrade** (no new users):
   - production database 111 → the candidate's full set (177, or more if Batch 1 adds migrations);
   - **together with** the candidate app;
   - in **one** rehearsed release;
   - the old app is not left running against the new schema.
   - After it, #150's G4–G9 and the escrow can complete on production.
2. **PRODUCTION READY** for real schools, gated on #150 PASS (Gate 4) and Gates 5–6.

**When (owner choice, E batch 9):**
- **(B, recommended):** once, in batch 11, on the candidate people accepted at Gate 5. Production changes one time. #150's production-only steps (bundle, escrow and O8 on production's own backup) move from Gate 4 to Gate 6, still before Dr Gladys and before any real user.
- **(A):** a separate no-users upgrade in batch 9 so #150 passes at Gate 4. Production then changes twice (technical upgrade, then the accepted release), and the first change precedes internal acceptance.
- Either way the migration set is the candidate's at that time, Batch 1's migrations included.

## 6. Rehearsal (F-18, W9.10; not started)

| Step | Action | What it proves | Needs |
|---|---|---|---|
| R-1 | Restore production's latest native backup into a **temporary, billable project** | Production's real data takes the upgrade: 127, 139, 155, 162's catalogue assertions | Owner: billable project; C1 token (O2) so G6 can read the backup |
| R-2 | On that copy, run the workflow's own sequence: facts before → `db push` 112 → 177 → history check → readiness → standing assertions | The exact production procedure, timed | The workflow pointed at the rehearsal project (a new, owner-approved target) |
| R-3 | Deploy the candidate app against the copy; run the critical journeys and the staff transition (W9.14): the sole admin completes `account_setup` | App and database match; nobody is locked out | A preview deployment pointed at the copy |
| R-4 | Restore the pre-upgrade backup again and confirm it reproduces production as it was, roles and `authenticator` setting included | The way back works and its time is known | Same project |
| R-5 | Tear down the rehearsal project | No copy of production data left behind | — |

**Pass:**
- every step green;
- durations recorded;
- the restore point's age and the data loss window stated in writing.

**Data handling:** the copy holds production data (real persons). It stays in the owner's Supabase organisation and is deleted at R-5. No data leaves it, and journeys use only synthetic accounts added for the rehearsal.

## 7. Backup and recovery for the real upgrade

- **Restore point:** the native daily physical backup, no older than 26 h. G6 checks this before any production migration, and it refuses until the C1 token exists (B3/O2).
- **Point-in-time recovery is off (D-103):** a restore loses every write since that backup, up to 26 h. With no real users in production that loss is small, but it must be stated.
- **Storage objects are not in the native backup (G1).** Before the upgrade, record the object list and checksums; after a restore, verify them.
- **No down-migrations exist** and none is claimed (E, Rollback). The way back is:
  - (a) **restore** the pre-upgrade backup (database) **and** redeploy `5b5b68d` (app), as a pair; or
  - (b) a corrective forward migration, rehearsed on a copy first.
- The cluster-level changes (`pintar_backup` role, `authenticator` setting) are reproduced by a native restore (G2 on staging). R-4 must prove it on production's copy.

## 8. Failure and contingency during the real upgrade

| Failure | Detected by | Action |
|---|---|---|
| A migration's assertion fails mid-push (e.g. 139 or 155 on unexpected data) | `db push` stops; that migration rolled back; history < 177 | Stop. Production stays at the last good migration with the **old app**, which breaks from 115 on (115, 122, 147, 148; earlier ones not separately verified against it). **Restore the pre-upgrade backup.** Fix forward on the rehearsal copy, then retry in a new window |
| Push completes but readiness or assertions fail | Workflow's readiness and standing assertions | Restore the backup and redeploy `5b5b68d`. Investigate on the copy |
| Sign-in or API blocked (149, 153, 154) | Post-deploy facts and critical journeys | Restore and redeploy (a). The `authenticator` setting is cluster-level: confirm it after the restore |
| Admin locked out by `account_setup` (127) | The staff transition step | Use the break-glass account (W9.12); it must exist **before** the upgrade |
| Candidate app fails against the new database | Critical journeys | Redeploy the previous app only if the database is still compatible; otherwise restore the pair |

**Window:** a maintenance window announced in advance, with the app's maintenance mode (158) on during the push.

## 9. The authorisation the owner will be asked for (later, not now)

This is the text for the owner to sign at Batch 9 or 10. **It is not requested in Batch 0.**

> I authorise the technical upgrade of PINTAR production (Supabase project production, Vercel production) from database migration 111 and application `5b5b68d` to database migration **[N]** and application **[candidate SHA]**, as one release, in the window **[date, time WIB]**, on these conditions:
> (1) the rehearsal R-1 … R-5 passed on a copy of production restored from its own backup, with evidence **[run ids]**;
> (2) a native backup no older than 26 h exists and G6 confirmed it;
> (3) the Storage object list was recorded;
> (4) the break-glass account exists and was tested;
> (5) the way back is: restore that backup and redeploy `5b5b68d`;
> (6) no real users are admitted until PRODUCTION READY is separately approved.

**Owner actions it depends on:**
- the C1 token (O2);
- a billable rehearsal project (F-18);
- break-glass and second admin (F-6);
- a window.

## 10. Related corrections

- `RELEASE-CHECKLIST.md` REL-03 still refers to «165» migrations. It is stale and is listed for Batch 9.
- F-5 in F now points to this brief and carries the restated recommendation (§5).

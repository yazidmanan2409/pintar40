# Batch 4 · Recovery gate: PR #7 on hold (3 Nov 2026)

**Authority:** owner, 3 Nov: «PINTAR 4.0 — BATCH 4 RECOVERY GATE — Decision: HOLD PR #7» (D-154).

**State:**
- PR #7 is not merged.
- Migrations 184–188 are not applied. Staging is at 183 migrations and `main` is at `cb1ff3e`, both unchanged.
- Nothing was written to staging or production.

## What blocks promotion

D-153's continuation required a recent usable staging backup, or an equivalent tested recovery point, before 184–188 are applied. Merging to `main` applies them through `staging.yml`, so the check came before the merge.

**1. Supabase's own backups could not be read.**
- The restore rehearsal (run 41594063773, 07:06–07:12 UTC) asked Supabase's API for staging's backups. It answered **HTTP 403**: the token cannot read the backup list (W9.1).
- So neither a physical backup, its age, nor point-in-time recovery could be confirmed from here.

**2. The offsite backup has never run for staging.**
- `backup-offsite.yml` is off by default, until the owner sets the repository variable `PINTAR_OFFSITE_BACKUP`.
- It has no dispatched run.

**3. The logical restore keeps the data, not the environment.** A fresh logical backup (261 s) was restored into an empty stack and compared.
- **Every PINTAR table** came back identical. In all, 152 of staging's 160 tables were identical.
- The other eight are Supabase's own `auth` and `storage` tables. The runner's stack is an older Supabase version than staging's:
  - 4 are missing, all empty on staging;
  - 4 differ: one temporary sign-in token, the `assets` bucket row, and the two vendor migration histories.
  - 2 vendor tables exist only in the copy.
- The documented restore procedure **does not give back a safe, working environment**. Launch readiness on the copy, after the corrected step that recreates PINTAR's `auth.users` triggers, is 18 PASS, 6 FAIL:

| # | Recovery-readiness failure on the restored copy (for Batch 9, W9.12) |
|---|---|
| 1 | The anonymous surface changed: 10 / 19 / 509 anon functions |
| 2 | The audit trail is not append-only: 9 client write grants |
| 3 | G7: anon holds rights on 142 public relations |
| 4 | G7: authenticated's function grants differ: 289 of 509 |
| 5 | G7: authenticated's table rights differ: 228 |
| 6 | G7: the private `assets` bucket is missing |

**Also outside any database backup:**
- Storage files (metadata only);
- `CERT_SECRET_KEY_V1` and `CARD_PEPPER` (in Vercel);
- Auth settings and SMTP (in the Supabase project);
- API keys.

## Where things stand

| Item | State |
|---|---|
| PR #7 | Open, held. Its head carries this record; CI runs on it. |
| D-153's four preconditions | Accepted by the owner (`02-PROMOTION-PRECONDITIONS.md`) |
| Staging preservation baseline (pre-merge) | Recorded: `evidence/preservation-before.txt` |
| Staging walk tooling | Ready on the branch (`audit/staging/golden-school-pentadbiran.mjs`). Not run. |

## What resumes the promotion (D-154)

The owner verifies, in the Supabase `pintar-staging` dashboard (Database → Backups), **a successful, restorable physical backup less than 24 hours old**. With that, and a green required CI verdict on PR #7's final head, the controlled promotion authorised under D-153 resumes:
1. the protected merge, pinned to that head;
2. a check that only the staging migration runs (no production workflow);
3. staging at 188 migrations and `main`'s commit;
4. the Golden School, Studio, administration and accessibility walks;
5. the preservation check;
6. the staging freeze restored;
7. the report.

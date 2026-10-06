# Runbook: reconstructing PINTAR after the loss of its Supabase project (native restore, the primary path)

**#150 WP-C (B8, D-106(f), D-111(g)).** The sentence this runbook must make true, clause by clause (closure plan, top):
*"We successfully reconstructed PINTAR in a new environment, verified its data and security, restored its files and
configuration, connected the application, and proved that it worked."*

**When:** production's Supabase project is lost, unusable or untrustworthy, and Supabase's own backups of it still exist
(native restore, D-106(j): the primary path). If the project's backups are gone too (account or organisation lost),
the secondary, logical path starts from the independent bundle instead: `scripts/recovery/restore-bundle.mjs` into an
empty project (DR-D02), then steps 2–9 below; it is never presented as equivalent (D-106(j)).

**Rules for the whole procedure:**
- One step at a time, in order; each step's check is green before the next starts.
- Every first use of real infrastructure is a stop point on unexpected behaviour or an evidence mismatch (D-111(d)).
- Nothing here is improvised: a step that cannot be done as written stops the procedure, and the owner decides.
- Times are recorded from the decision to restore (T0) to the reopening (Tn); the RTO is Tn − T0.
- Production is reconstructed only on the owner's word. The rehearsal (O8, below) proves this runbook on a copy of
  staging, never on production.

## The steps

| # | Step | Who | How | Check | Stop if |
|---|---|---|---|---|---|
| 1 | **Restore the database to a new project.** Supabase dashboard → the lost project's backups → *Restore to a new project*; region `ap-southeast-1`. Record T0, the backup's time and the new project's reference. | owner (O8 in the rehearsal) | Supabase dashboard; then the copy's facts and readiness, read only: `audit/restore/fakta.sql`, `docs/audit/launch-readiness.sql` | the facts equal the last recorded facts (the production apply's facts artifact, or staging in the rehearsal: the G2 method, JOURNEY-LOG item 38); readiness 24 of 24 PASS (DR-D01) | any table, right, trigger or readiness row differs: logical drift; nothing is repaired by hand |
| 2 | **New credentials for the new project.** The database password into the environment's database secret; a deploy token and a backups-read token (C1) scoped to the new project only; for the rehearsal, the temporary token C10. No value is ever sent to the coordinator. | owner | `OWNER-INSTRUCTIONS-150.md` (O2's procedure, for the new project); the backups-read check `scripts/release/restore-point.mjs` | C1 `ISOLATED` (DR-S07); the deploy token reads the new project (step 3's verify) | a token can reach more than its project (TOO BROAD); Supabase offers no scoped choice |
| 3 | **Repoint the workflows, once, in one reviewed commit.** The new reference, name, region and public (anon) key, with the decision that authorises the move. | coordinator, on the owner's decision | `scripts/recovery/repoint.mjs` (`apply production --ref … --name … --region … --anon-key … --decision D-nnn`), then `recovery-target.yml` | CI green with DR-S12 (every workflow equals `docs/recovery/projects.json`; no retired reference survives); `recovery-target.yml` step 2: VERIFIED, the recorded name and region, ACTIVE_HEALTHY | the live project's name, region or health differ from the record; any old reference survives |
| 4 | **Re-apply Auth and email, and read them back.** The address, the one callback, sign-up closed (`configure-supabase-auth.yml`); the sender (`configure-supabase-smtp.yml`, which first proves the mailbox password); Gate 3's settings where `supabase/auth-identitas.json` says production carries them. | coordinator | `configure-supabase-auth.yml`, `configure-supabase-smtp.yml`; read back with `recovery-target.yml` and `identity-facts.yml`; in the rehearsal `scripts/recovery/auth-state.mjs` (`apply staging --ref … --origin … --rehearsal`) | each workflow's own read-back; `recovery-target.yml` step 3: READ BACK, every declared setting (DR-S12); Supabase's security advisor clean (leaked-password protection on) | any declared field differs after the write; the mailbox password does not open the mailbox |
| 5 | **Put back the files (B9).** The newest complete independent bundle (with its success record) is fetched and decrypted by a custodian, never on a normal runner (D-107 D5); every file whose row the restored database holds is put back and read back by hash. | custodian and coordinator | `scripts/recovery/drill.mjs` (`fetch production`), the custodian's key (R1 or R2), then `scripts/recovery/restore-bundle.mjs` (`--files-only`) with the new project's Storage S3 key (C3, owner) | FILES PUT BACK: every row has its file, read back by SHA-256 (DR-D02); the rows the bundle has no file for are named | a row has no file in the bundle (files lost between the bundle and the native backup): the owner decides; a file reads back different |
| 6 | **Keep, or recover, the durable secrets.** `CARD_PEPPER` and `CERT_SECRET_KEY_V1` stay in Vercel and are kept by the deploy's guard; if Vercel lost them, each is recovered from the escrow (R1 or R2, legal hold). | coordinator (custodian for a recovery) | the guard in `deploy-vercel-production.yml`; `recover-durable-secret.yml` | the guard says KEEP and the fingerprints equal `docs/recovery/durable-secrets.json` (DR-S01, DR-S03); a recovery writes only the recorded value (DR-S10) | a value differs from its recorded fingerprint: nothing is overwritten; a ruling decides |
| 7 | **Redeploy the application against the new project.** The deploy carries the repointed address and public key, writes the service key from the Management API and reads every value back. | coordinator | `deploy-vercel-production.yml` | the deploy's own read-back (the service key equals the validated key; every required name present); DR-S02 | a value is missing or reads back different; the guard says REFUSE |
| 8 | **Verify that it works.** From outside: the sign-in page, Auth's health, TLS, the restore point; then, by its own login, a staff sign-in, a class-card sign-in, a certificate verified by its token, and a lesson or photo served from Storage. | coordinator | `production-watch.yml` (dispatched once), `recovery-facts.yml`, `recovery-target.yml`; the functional checks: PENDING WP-C.2 | the watch green (DR-S06); recovery facts C1 ISOLATED and G6 OK (DR-S05, DR-S07); every functional check passes | any check fails: the application stays closed |
| 9 | **Reopen, and record.** The owner decides to reopen; the watch's schedule is switched on; Tn recorded; the lost project is kept, not deleted, until the owner rules. | owner | the repository variable `PINTAR_PRODUCTION_WATCH`; JOURNEY-LOG; `docs/recovery/EVIDENCE-INDEX-150.md` | the RTO (Tn − T0) recorded with every step's evidence line; the first scheduled watch run green (DR-S06) | the owner does not reopen: PINTAR stays closed and the reason is recorded |

## The sentence, clause by clause

| Clause | Steps | Its evidence |
|---|---|---|
| reconstructed PINTAR in a new environment | 1, 3 | the new project restored; the workflows repointed and the project VERIFIED as recorded |
| verified its data and security | 1, 4 | the facts equal the source's; readiness 24 of 24; every declared Auth setting read back; the advisor clean |
| restored its files and configuration | 4, 5, 6 | FILES PUT BACK by hash; the settings read back; the durable secrets kept or recovered by fingerprint |
| connected the application | 7 | the deploy's read-back of every value it wrote |
| proved that it worked | 8 | the watch green; the functional checks (PENDING WP-C.2) |

**WP-C is not done while anything is marked PENDING WP-C.2** (selftest DR-S13 counts them).

## The rehearsal (O8): proving this runbook without touching production

The same nine steps on a copy of **staging**, `pintar-g8-rehearsal-DELETE-ME`, with these differences only:
- step 1: the owner restores staging's latest backup to the copy; its facts are compared with staging's (the G2 method);
- step 2: the temporary token C10 (Auth configuration, project settings and API keys of the copy only) and the copy's
  database password and Storage S3 key go into a temporary environment; nothing of staging's or production's changes;
- step 3: **no workflow is repointed.** The copy is verified as itself (its name ends `-DELETE-ME`; it is none of the
  recorded projects), so staging and production keep pointing where they do;
- step 4: `auth-state.mjs apply staging --ref <copy> --origin <the preview address> --rehearsal`, which refuses every
  recorded project, then reads back;
- step 5: the newest complete **staging** bundle (R3, the drill key) and `restore-bundle.mjs --files-only`;
- step 6: nothing to recover (the preview deployment carries staging's own secrets for the rehearsal only);
- step 7: a one-off Vercel preview deployment of `main` aimed at the copy; no project setting of Vercel changes
  (PENDING WP-C.2);
- step 8: the functional checks through the preview (PENDING WP-C.2);
- step 9: the copy is deleted by the owner and C10 revoked, both confirmed; the times recorded T0 → Tn.

Each clause of the sentence at the top gets its own evidence line in the rehearsal's record; if any one is missing,
WP-C is not done (closure plan, WP-C acceptance).

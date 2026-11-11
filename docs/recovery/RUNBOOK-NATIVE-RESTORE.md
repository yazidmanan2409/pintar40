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
| 1 | **Restore the database to a new project.** Supabase dashboard → the lost project's backups → *Restore to a new project*; region `ap-southeast-1`. Record T0, the backup's time and the new project's reference. **Then put back PINTAR's scheduled jobs** (C1w finding F-8; B1, THE PLAN §6.3): a native restore does not carry pg_cron's own tables, so the copy has the functions and no job. | owner (O8 in the rehearsal) | Supabase dashboard; then the copy's facts and readiness, read only: `audit/restore/fakta.sql`, `docs/audit/launch-readiness.sql`; then, as `postgres` in the SQL editor, the one installer `select public.pintar_jadwal_pasang()` and the health read `select public.pintar_periksa_kesehatan()` | the facts equal the last recorded facts (the production apply's facts artifact, or staging in the rehearsal: the G2 method, JOURNEY-LOG item 38); readiness 24 of 24 PASS (DR-D01); the health read lists no job missing or different (`hilang` and `berbeda` empty; DR-D02 proves it on a restored copy) | any table, right, trigger or readiness row differs: logical drift; nothing is repaired by hand; a declared job is still missing or different after the installer ran |
| 2 | **New credentials for the new project.** The database password into the environment's database secret; a deploy token and a backups-read token (C1) scoped to the new project only; for the rehearsal, the temporary token C10. No value is ever sent to the coordinator. | owner | `OWNER-INSTRUCTIONS-150.md` (O2's procedure, for the new project); the backups-read check `scripts/release/restore-point.mjs` | C1 `ISOLATED` (DR-S07); the deploy token reads the new project (step 3's verify) | a token can reach more than its project (TOO BROAD); Supabase offers no scoped choice |
| 3 | **Repoint the workflows, once, in one reviewed commit.** The new reference, name, region and public (anon) key, with the decision that authorises the move. | coordinator, on the owner's decision | `scripts/recovery/repoint.mjs` (`apply production --ref … --name … --region … --anon-key … --decision D-nnn`), then `recovery-target.yml` | CI green with DR-S12 (every workflow equals `docs/recovery/projects.json`; no retired reference survives); `recovery-target.yml` step 2: VERIFIED, the recorded name and region, ACTIVE_HEALTHY | the live project's name, region or health differ from the record; any old reference survives |
| 4 | **Re-apply Auth and email, and read them back.** The address, the one callback, sign-up closed (`configure-supabase-auth.yml`); the sender (`configure-supabase-smtp.yml`, which first proves the mailbox password); Gate 3's settings where `supabase/auth-identitas.json` says production carries them. | coordinator | `configure-supabase-auth.yml`, `configure-supabase-smtp.yml`; read back with `recovery-target.yml` and `identity-facts.yml`; in the rehearsal `scripts/recovery/auth-state.mjs` (`apply staging --ref … --origin … --rehearsal`) | each workflow's own read-back; `recovery-target.yml` step 3: READ BACK, every declared setting (DR-S12); Supabase's security advisor clean (leaked-password protection on) | any declared field differs after the write; the mailbox password does not open the mailbox |
| 5 | **Put back the files (B9).** The newest complete independent bundle (with its success record) is fetched and decrypted by a custodian, never on a normal runner (D-107 D5); every file whose row the restored database holds is put back and read back by hash. | custodian and coordinator | `scripts/recovery/drill.mjs` (`fetch production`), the custodian's key (R1 or R2), then `scripts/recovery/restore-bundle.mjs` (`--files-only`) with the new project's Storage S3 key (C3, owner) | FILES PUT BACK: every row has its file, read back by SHA-256 (DR-D02); the rows the bundle has no file for are named | a row has no file in the bundle (files lost between the bundle and the native backup): the owner decides; a file reads back different |
| 6 | **Keep, or recover, the durable secrets.** `CARD_PEPPER` and `CERT_SECRET_KEY_V1` stay in Vercel and are kept by the deploy's guard; if Vercel lost them, each is recovered from the escrow (R1 or R2, legal hold). | coordinator (custodian for a recovery) | the guard in `deploy-vercel-production.yml`; `recover-durable-secret.yml` | the guard says KEEP and the fingerprints equal `docs/recovery/durable-secrets.json` (DR-S01, DR-S03); a recovery writes only the recorded value (DR-S10) | a value differs from its recorded fingerprint: nothing is overwritten; a ruling decides |
| 7 | **Redeploy the application against the new project.** The deploy carries the repointed address and public key, writes the service key from the Management API and reads every value back. | coordinator | `deploy-vercel-production.yml`; in the rehearsal, `recovery-rehearsal.yml` (stage `reconstruct`): a one-off preview of staging's Vercel project aimed at the copy, no setting changed | the deploy's own read-back (the service key equals the validated key; every required name present); DR-S02 | a value is missing or reads back different; the guard says REFUSE |
| 8 | **Verify that it works.** From outside: the sign-in page, Auth's health, TLS, the restore point. Then the four functional checks through the application itself: a staff sign-in (F1), a class-card sign-in (F2), a certificate verified by its token (F3), a lesson or photo served from Storage with its hash (F4). In production, as D-113 rules: no test identity; F3 by `scripts/recovery/functional.mjs certificate` (no sign-in, no write); F1 and F4 by the owner's own sign-in; the card path by step 6's fingerprint and the rehearsal's F2, and the first real card sign-in recorded at step 9. | coordinator; owner (their own sign-in, in production) | `production-watch.yml` (dispatched once), `recovery-facts.yml`, `recovery-target.yml`; the functional checks `scripts/recovery/functional.mjs` (in the rehearsal `recovery-rehearsal.yml` runs `check --rehearsal` through the preview) | the watch green (DR-S06); recovery facts C1 ISOLATED and G6 OK (DR-S05, DR-S07); every functional check passes (DR-D03) | any check fails: the application stays closed |
| 9 | **Reopen, and record.** The owner decides to reopen; the watch's schedule is switched on; Tn recorded; the lost project is kept, not deleted, until the owner rules. | owner | the repository variable `PINTAR_PRODUCTION_WATCH`; JOURNEY-LOG; `docs/recovery/EVIDENCE-INDEX-150.md` | the RTO (Tn − T0) recorded with every step's evidence line; the first scheduled watch run green (DR-S06) | the owner does not reopen: PINTAR stays closed and the reason is recorded |

## The sentence, clause by clause

| Clause | Steps | Its evidence |
|---|---|---|
| reconstructed PINTAR in a new environment | 1, 3 | the new project restored; the workflows repointed and the project VERIFIED as recorded |
| verified its data and security | 1, 4 | the facts equal the source's; readiness 24 of 24; every declared Auth setting read back; the advisor clean |
| restored its files and configuration | 4, 5, 6 | FILES PUT BACK by hash; the settings read back; the durable secrets kept or recovered by fingerprint |
| connected the application | 7 | the deploy's read-back of every value it wrote |
| proved that it worked | 8 | the watch green; the four functional checks F1–F4 through the application (DR-D03; in production as D-113 rules) |

**WP-C's tooling is complete** (WP-C.1 and WP-C.2; DR-S13 fails if anything is left marked as waiting). **WP-C is done only when the rehearsal below has evidenced every clause.**

## The rehearsal (O8): proving this runbook without touching production

The same nine steps on a copy of **staging**, `pintar-g8-rehearsal-DELETE-ME`, driven by `.github/workflows/recovery-rehearsal.yml`
(dispatch only, from `main`, in the `staging-recovery-drill` environment; three stages, one at a time: `preflight`,
`reconstruct`, `teardown`). It needs one complete staging bundle, so it follows WP-B's first staging backup (O3–O6).
Differences from production, and only these:
- step 1: the owner restores staging's latest backup to the copy (T0). `reconstruct` first proves the copy is the rehearsal's
  own (`scripts/recovery/rehearsal.mjs guard`: named …-DELETE-ME, staging's region, healthy, none of the recorded projects; C10
  refused by staging and production), then compares its facts with staging's line for line and reads readiness 24 of 24
  (read only, both). Staging written to after its backup is a difference, so nothing else runs on staging meanwhile;
- step 2: the owner puts the rehearsal's temporary secrets into `staging-recovery-drill`: C10 (Auth configuration, project
  settings and API keys of the copy only), the copy's database address and its Storage S3 key. `preflight` lists them by name.
  The copy's keys are read with C10 (`rehearsal.mjs keys`), never printed. Nothing of staging's or production's changes;
- step 3: **no workflow is repointed.** The copy is verified as itself, so staging and production keep pointing where they do;
- step 4: `auth-state.mjs apply staging --ref <copy> --origin https://pintar-rehearsal-<copy>.vercel.app --rehearsal`, which
  refuses every recorded project, then reads every declared field back;
- step 5: the newest complete **staging** bundle (R3, the drill key, decrypted on the runner: staging's data is synthetic,
  D-064) and `restore-bundle.mjs --files-only`;
- step 6: nothing to recover: the preview carries staging's own card and certificate values from staging's Vercel project
  (`preflight` checks, by name and target only, that a preview receives `CARD_PEPPER`, `CERT_SECRET_KEY_V1` and
  `CARD_EMAIL_DOMAIN`; if not, giving them that target is a Vercel setting change and the owner decides);
- step 7: a one-off preview deployment of this commit on staging's Vercel project, given the copy's address and keys for that
  deployment only, at `https://pintar-rehearsal-<copy>.vercel.app`. Never `--prod`; no project variable, domain or protection
  setting changes. If `preflight` finds previews behind Vercel's protection, reaching it needs the owner's temporary bypass
  (`REHEARSAL_VERCEL_BYPASS`), created for the rehearsal and removed after it;
- step 8: `scripts/recovery/functional.mjs check --rehearsal` through the preview: F1 the newest Golden School's admin signs
  in with the password its walks set; F2 that admin re-issues one of the school's learners' cards as damaged and the new
  card signs in (on the copy only: D-113(a)); F3 an issued certificate verifies BERLAKU by its token; F4 a file put back at
  step 5 is served with the bundle's SHA-256;
- step 9: `teardown` removes the preview's address and deployment and confirms none remains; the owner deletes the copy and
  revokes C10 and the rehearsal's secrets, each confirmed; the times recorded T0 → Tn.

Each clause of the sentence at the top gets its own evidence line in the rehearsal's record; if any one is missing,
WP-C is not done (closure plan, WP-C acceptance).

# #150 evidence index: the checkpoint before O3–O7

**Checkpoint result (D-111, 6 Oct): GREEN to proceed from engineering proof into owner-controlled infrastructure
setup, after the two pre-O3 prerequisites (§6). Not #150 PASS; not PRODUCTION READY. No interim R1-only escrow.**

**For the Second Eye.** As of 6 Oct 2026, `main` at the commit that carries this file. Everything below points to its
source; nothing here is new evidence, and nothing here is a ruling.

**The checkpoint question:** *Given all evidence through D-110 and migration 162, is the #150 recovery architecture
internally coherent and safe to proceed from engineering proof into owner-controlled infrastructure setup (O3–O7)?*
In particular: no contradiction between D-103, D-106, D-107, D-108 and D-109, the closure plan, the owner's
instructions, the tests, the staging evidence, and D-109(c) (R1 and R2 before any production backup).

**How to read it:** §1 status; §2 each ruling traced to where it is built, what proves it, and what hosted evidence
exists; §3 the tests and CI runs; §4 the hosted runs; §5 the consistency check and what it changed; §6 what is open,
never yet exercised, or limited; §7 the O3–O7 order the code allows.

Sources: `docs/coordination/DECISIONS.md` (D-103–D-110), `docs/recovery/CLOSURE-PLAN-150.md`,
`docs/recovery/OWNER-INSTRUCTIONS-150.md`, `docs/recovery/JOURNEY-LOG.md` (items 36–43), `selftest/manifest.json`,
`docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`, `docs/recovery/evidence/150/`.

---

## 1. Status at a glance

**#150 verdict: NOT PASS, accepted (D-104, D-105).** Engineering proof is far along; provider and owner actions are
mostly not done.

| Item (D-106) | Work package | Built and proven | Hosted evidence | What is missing |
|---|---|---|---|---|
| G5, G6, G7, G10 (the earlier #150 gates) | — | yes: DR-S01–S06, DR-D01; CI 37390261594 | rehearsal 37389380945; watch 37391618155 | G6 refuses every production apply until C1 exists (O2) |
| B3: the backups-read token C1 | WP-A | yes: DR-S05–S07; CI 37401454517 | none | **O2** (owner), then the isolation run |
| B4 + B9: independent database and Storage files | WP-B | yes: DR-S08, S09, S14, S15, S16, DR-D02 | migration 162 on staging, profile equal (§4) | staging path proof (pooler value); O3–O6; a real staging run and drill |
| B5: durable-secret escrow | WP-B | yes, against stand-ins: DR-S01–S03, DR-S10 | none | fingerprints recorded; O3–O4; **R2 and both custodians' proofs**; O7 |
| B8: reconstruction in a new environment | WP-C | **WP-C.1 and WP-C.2 built**: the runbook, the guarded repointing, the Auth read-back, files after a native restore (DR-S12, DR-S13, DR-D02; CI 37421222152 on `f49280e`, 35/35); the rehearsal's workflow and guards and the four functional checks (DR-S17, DR-D03; DR-S11 and DR-S13 restated; CI 37425505226 on `9631bf6`, 35/35) | G2: native **database** restore, 24/24, 8 min 03 s (staging scale) | the hosted rehearsal (O8), after WP-B's first staging bundle |
| B6/A6: recovery authority | WP-D | **not started** | none | custodian B and R2 (now before production backups, D-109(c)); second administrators (O9) |
| B7: the production watch | WP-E | yes: DR-S06 (G10) | watch 37391618155 (green; 403 as a note) | switched on at the release gate (O10) |
| PITR / RPO | — | D-103: RPO 24 h, provisional; not a 4.0 blocker (D-106(h)) | G1 Part 1: 7 daily backups, PITR off | revisited per D-103(c) |

---

## 2. Each ruling: built, proven, evidenced

"CI" means the selftest runs in §3; "hosted" means §4. A ruling is listed as proven only where a test executes it.

### D-103 and D-106

| Ruling | Built in | Proven by | Hosted | Status |
|---|---|---|---|---|
| D-103: RPO 24 h from Supabase's daily backup, no PITR, provisional | `scripts/release/restore-point.mjs`; `deploy-supabase-production.yml` (no apply without a COMPLETED backup ≤ 26 h) | DR-S04, DR-S05 | G1 Part 1 screenshots (`evidence/150/`) | built; production applies refused until C1 (O2) |
| D-106(a) B3 | WP-A: `restore-point.mjs isolation`, `recovery-facts` | DR-S05, S06, S07 | — | waits for O2 |
| D-106(b) B4 | `scripts/recovery/backup.mjs`, `restore-bundle.mjs` | DR-S14, DR-D02, DR-S08 | 162 on staging | not active (O3–O6) |
| D-106(c) B5 | G5 guard; `scripts/recovery/escrow.mjs`; escrow and recover workflows | DR-S01–S03, DR-S10 | — | not active (O7) |
| D-106(d) B6 | WP-D | — | — | not started |
| D-106(e) B7 | `production-watch.yml` | DR-S06 | watch 37391618155 | off until the release |
| D-106(f) B8 | WP-C: `docs/recovery/RUNBOOK-NATIVE-RESTORE.md`; `docs/recovery/projects.json` + `scripts/recovery/repoint.mjs`; `scripts/recovery/auth-state.mjs`; `restore-bundle.mjs --files-only`; `recovery-target.yml`; `recovery-rehearsal.yml` + `scripts/recovery/rehearsal.mjs`; `scripts/recovery/functional.mjs` | DR-S12, DR-S13, DR-D02, DR-S17, DR-D03 | G2 (database only) | built; O8 open |
| D-106(g) B9 Storage files, not metadata | `backup.mjs` reads every object through Storage's S3 API with its hash; `restore-bundle.mjs` puts files back | DR-S14 (every planted object, hash), DR-D02 (every file read back, hash) | — | not active |
| D-106(h)–(i) PITR and the 100,000-user rehearsal are not 4.0 blockers | closure plan WP-F | — | — | recorded |
| D-106(j) native restore primary; logical secondary, never equivalent | closure plan boundaries | DR-D02 (logical path) | G2 (native: 24/24) | recorded |
| A1 asymmetric; the job holds public keys only | `seal`, `recipientsFor`, `checkRecipients` | DR-S09 (the job's own keyring cannot decrypt) | — | built |
| A2 dedicated minimum-privilege credential | migration 162 `pintar_backup` | DR-S15 (its dumps byte-identical to `postgres`'s) | staging profile 16/16 equal | built; C2 not set (O6) |
| A3 credential inventory | closure plan § A3 | DR-S11 (each credential in exactly its workflows; C2 nowhere in `src/`) | — | built |
| A4 secret retention apart from backups | escrow under legal hold; no lifecycle rule on `production/escrow/` | DR-S10 (template and legal hold) | — | built |
| A5 fail closed, ten conditions | `backup.mjs` conditions 1–9; `drill.mjs latestComplete` (10) | DR-S14 (each planted failure red, no success record); DR-S11 (condition 10) | — | built |
| A6 recovery authority | WP-D | — | — | not started |
| A7 C2 guarded: backup environment only, never printed, rotation and revocation, cannot write | environment `backup`; `credential.mjs` set/revoke | DR-S11, DR-S14 (password in no output or file), DR-S15 (every write refused) | staging profile | built |

### D-107 (D1–D8)

| Ruling | Built in | Proven by | Status |
|---|---|---|---|
| D1 AWS S3 Singapore, Object Lock | `infra/aws/pintar-backup.json` | DR-S10 (lock, versioning, public-access block, TLS-only, put-only writer, read-only reader) | O3 |
| D2 R1 + R2 custodians, R3 staging drill only | `recipientsFor` | DR-S09 | O4 |
| D3 monthly owner-approved drill | `restore-drill.yml` (environment `staging-recovery-drill`, schedule off) | DR-S11 | O3 step 6 sets the reviewer |
| D4 35 days daily, 12 months monthly | `placement()`; lifecycle 36 / 367 days; Object Lock 35 / 366 days | DR-S14 (retain-until dates), DR-S10 (lifecycle) | built |
| D5 production bundles never decrypted on runners | `drill.mjs check-production` reads packets only | DR-S11 (no `--decrypt` in the production drill job) | built |
| D6 `pintar_backup`, not `postgres` | migration 162; the backup jobs sign in as it | DR-S15, DR-S11 | built |
| D7 03:00 WIB | cron `0 20 * * *`, off until `PINTAR_OFFSITE_BACKUP = on` | DR-S11 | built |
| D8 no offline plaintext copy; the dual-recipient escrow | `escrow.mjs` (R1 and R2 only) | DR-S10 | built; the scope inventory's J8.7 corrected (§5) |

### D-108 (the `supautils` residual)

| Ruling | Built in | Proven by | Status |
|---|---|---|---|
| (b) the canonical wording; read-only default is a safety default | closure plan § A7; migration 162's header | DR-S15 (the residual shown, rolled back; writes refused with the default off) | recorded |
| (c)(1)–(4) C2 only in the backup environment; never printed; rotation and revocation; connection limit | `backup` environment; `credential.mjs`; `connection limit 3` | DR-S11, DR-S14, DR-S15 (a fourth connection refused) | built |
| (c)(5)–(7) extensions captured, compared with the baseline, a change fails closed and raises the watch issue | `extensionCheck`; `docs/recovery/extension-baseline.json`; `backup-offsite.yml` failure step | DR-S14 (an extension added through `supautils` is red); DR-S11 (the issue) | staging baseline recorded; **production `null`**: a production backup refuses to run until it is read |
| (c)(8) a restore checks the baseline before reopening | `restore-bundle.mjs` | DR-D02 (an added extension blocks SAFE TO REOPEN) | built |
| (c)(9) no extra EXECUTE for metadata | migration 162; profile | DR-S15; profile line `executes_*` | staging: 0 |
| (d) no `readiness.txt`; 24/24 on the restored copy | `backup.mjs`; `restore-bundle.mjs` | DR-S14, DR-D02 | built |
| (e) provider question | owner (`OWNER-INSTRUCTIONS-150.md` § B) | — | open, non-blocking (D-109(f)) |

### D-109 and D-110

| Ruling | Built in | Proven by | Hosted | Status |
|---|---|---|---|---|
| D-109(a) 162 on staging only; read-only verification; the pooler never guessed; a profile difference is a stop point | `staging.yml`; `scripts/recovery/backup-profile.sql`; `path-check.mjs`; `staging-backup-path.yml` | DR-S16 | apply 37414019844; profile 16/16 equal; path check 37414154468 **stopped at step 1** (HTTP 403) | **waiting for the owner's pooler value** |
| D-109(b) escrow first | `escrow.mjs mint`; the production deploy no longer mints | DR-S10 (Vercel written only after the upload; a refused escrow writes nothing); DR-S02 | — | built |
| D-109(c) R1 **and** R2; two separate custodians, each proven, before any production backup or escrow | `recipientsFor`, `custodyCheck`; `docs/recovery/custody.json` (both unproven); production recipients fixed at `R1 R2` in the workflows | DR-S09, S10, S11, S14 | — | built; **B6/R2 is now a prerequisite** |
| D-109(d) 5 GiB single upload, fail closed, watched | `sizeCheck`; the backup-size issue | DR-S14, DR-S11 | — | built |
| D-109(e) O2 independent; WP-A not closed until C1's real isolation | — | — | — | open |
| D-110 school data ownership (separate lane) | — | — | — | relevant to #150 only here: backups keep data up to 12 months (D-107 D4), so the future retention and deletion design (D-110(c), OD-5) and the privacy-notice line (O11) must account for backup expiry |

---

## 3. Tests and CI

All in `selftest/dr150.test.ts` and `selftest/dr150b.test.ts`; each was red on the commit before its change and green
after (the restatements say `RESTATED FOR …`).

| Test | Proves (short) |
|---|---|
| DR-S01–S03 | G5: the deploy keeps or mints a durable secret only on a verified state; end to end against stand-ins |
| DR-S04, S05 | G6: no production apply without a COMPLETED backup ≤ 26 h; the wiring (C1 only, WP-A) |
| DR-S06 | G10 / B7: the watch, GET only, one self-closing issue, off until switched on |
| DR-S07 | WP-A: C1 is held only where it is needed; the isolation check's verdicts |
| DR-S08 | `acl.sql` restores PINTAR's exact rights after the 5 Oct drift |
| DR-S09 | encryption to public keys only; production R1 and R2 exactly, never R3, **never R1 alone** |
| DR-S10 | escrow, mint (escrow first), recover; never R1 alone, never before both custodians' proofs; the AWS template |
| DR-S11 | the wiring: `main` only, schedules off, environments, credential inventory, `verify-full`, the watch issue, condition 10, C2 set and revoked, the possession check, production recipients fixed, the size issue |
| DR-S14 | a real backup run against CI's database and Storage and a stand-in S3: clean, and every planted failure red with no success record; custody; the 5 GiB limit |
| DR-S15 | `pintar_backup`: reads everything, writes nothing; the `supautils` residual shown |
| DR-S12 | WP-C: the workflows equal the one project record; a move rewrites them all at once, guarded (decision, no reuse, the right public key); the live project verified; the Auth settings read back, a rehearsal copy the only thing ever written |
| DR-S13 | WP-C: the runbook's nine steps each tied to existing tools or an owner action, a check naming existing tests, a stop condition; B8's clauses mapped; nothing left marked PENDING (restated for WP-C.2) |
| DR-S17 | WP-C.2: the rehearsal's guards against stand-ins (only a healthy …-DELETE-ME copy; C10 too broad refused; the copy's own keys, unprinted; a protected preview or one without staging's values goes to the owner; facts line for line) and its workflow (by hand, main, the drill's environment, nothing of production, the guard first, no Vercel setting) |
| DR-D03 | WP-C.2: the four functional checks through the running app (staff sign-in; a card re-issued and signed in; a certificate BERLAKU by its token; a file with its hash), each planted fault failing its own check; `certificate` alone for production (D-113) |
| DR-S16 | the staging path check: dispatch-only, read-only; the pooler only from an authoritative source; `verify-full`; the shared snapshot; the profile against the proven one |
| DR-D01 | readiness: 24 rows, each planted drift FAILs by name |
| DR-D02 | the logical path end to end into an empty Supabase stack: 0 differences, every file's hash, the baseline, 24/24, SAFE TO REOPEN; files put back after a native-like loss (`--files-only`) |

DR-S12 and DR-S13: WP-C.1 (6 Oct; CI 37421222152 on `f49280e`, 35/35, 590 tests). DR-S17 and DR-D03: WP-C.2 (6 Oct), with DR-S11 and DR-S13
restated; red on `f707464`, green on `9631bf6` (CI 37425505226, 35/35, 592 tests).

| CI run | Commit | Result | What it carried |
|---|---|---|---|
| 37390261594 | `683edd9` | 35/35, 579/579 | G5, G6, G7, G10 |
| 37401454517 | `e6cb045` | 35/35, 580/580 | WP-A |
| 37409454539 | `9133ffc` | 35/35, 587/587 | WP-B |
| 37412506567 | `cc2307e` | 35/35 | D-109 (R1 + R2, custody, 5 GiB, the path check) |
| 37415061854 | `c13589f` | **34/35**, 587 passed, 1 failed | the owner's pooler value as an input; R1 + R2 documents aligned. **DR-D02 red:** its second (empty) stack could not bind port 55322, which lies in Linux's ephemeral range and was held on the runner. The test now takes the first free set of ports below that range; reproduced locally (55322 held: the old test red with the same error, the new one green) |
| 37416489180 | `df7c170` | **35/35** | the DR-D02 fix; the landing of the pooler input, this index and D-111 (D-111(h)) |

---

## 4. Hosted evidence

| What | Where | Result |
|---|---|---|
| G1 Part 1 (owner screenshots) | `evidence/150/`, JOURNEY-LOG 38 | production: 7 scheduled daily physical backups; PITR off; Storage objects not included |
| G2: native restore of staging to a new project | JOURNEY-LOG 38, `evidence/150/g2-*` | 157 tables byte-identical; rights, policies, triggers, pre-request identical; readiness 24/24; **8 min 03 s**; API keys, Auth settings and Storage files not reproduced; the copy deleted, confirmed |
| Recovery rehearsal, documented procedure | run 37389380945 | staging 24/24; the logically restored copy 7 FAIL, each a named drift (why logical is secondary) |
| The watch's first runs | 37389383812 (defect found, fixed), 37391618155 | green; C1's absence reported as a note |
| Migration 162 applied to staging | `staging.yml` run 37414019844 | 161 → 162, equal to the repository; the migration's own assertions passed on staging |
| `pintar_backup` on staging (read only, Supabase connector) | JOURNEY-LOG 43 | **16 of 16 profile lines equal the proven local profile** (`docs/recovery/pintar-backup-profile.expected`); extensions equal the baseline; no test-harness schema; no password set |
| The staging path check | `staging-backup-path.yml` run 37414154468 | **stopped at step 1**: Supabase refused the pooler configuration to staging's token (HTTP 403); `verify-full`, the shared snapshot and the profile through the pooler not yet run |

Production: untouched by WP-A and WP-B. No migration, credential, key, bucket or escrow exists for it.

---

## 5. The consistency check, and what it changed

Checked on 6 Oct across the decisions, the closure plan, the owner's instructions, the workflows, the scripts and the
tests.

| Checked | Result |
|---|---|
| R1 + R2 (D-107 D2, D-107 D8, D-109(c)) everywhere | **Consistent now.** Code and workflows refuse R1 alone; the owner's instructions say so (O4 steps 4–6, O7). **Fixed today:** the closure plan's owner-action table (O4, O7, O9 now put R2 and both proofs before the first production backup and escrow); `OFFSITE-BACKUP-DESIGN.md` marked superseded where it differs (it called the second key "optional"); `PINTAR-4.0-SCOPE-INVENTORY.md` J8.7 ("verified offline copies") marked superseded by D-107 D8 |
| Migration 162's status | **Fixed today:** the closure plan's header and WP-B still said "not on `main`"; now they say applied to staging only |
| D-107 D4 retention vs the template | consistent: Object Lock 35 / 366 days shorter than expiry 36 / 367 days; no rule on the escrow prefix |
| D-103 vs G6 | consistent: a 24 h RPO; no apply without a backup ≤ 26 h |
| D-108(d) vs the restore | consistent: no readiness in the bundle; 24/24 required on the copy |
| D-106(j) | consistent: native primary (G2), logical secondary (DR-D02), never called equivalent |
| Dated documents | `BACKUP-DR-REVIEW-2026-10-05.md` and `OFFSITE-BACKUP-DESIGN.md` are 5 Oct records; where they differ, D-106–D-109 and the closure plan prevail |
| `backup-offsite.yml` `STAGING_POOLER_HOST` | **unverified**: a copy of production's; the path check compares it with the authoritative value |
| `PRODUCTION_POOLER_HOST` | the production apply's own host; `verify-full` to it is **not yet shown** (production is outside D-109(a)) |
| **The order of O3–O7** | **Ruled (D-111(b)): no interim R1-only production escrow.** The escrow follows R2 and both custodians' proofs (§7), as the code already enforces |

---

## 6. Open, never yet exercised, and limits

**The two prerequisites before O3 (D-111(c)):**
1. Staging's session pooler host, port and user (dashboard → Connect → Session pooler), so the path check finishes
   green: the pooler resolved, `verify-full`, the shared snapshot, the profile through the pooler.
2. O2 (C1), then the isolation run: `ISOLATED` (not TOO BROAD, not UNPROVEN).

**Also open:** B (D-108(e)), non-blocking.

**Every first use of real infrastructure is a stop point** on unexpected behaviour or an evidence mismatch
(D-111(d)); production is not touched because staging succeeds (D-111(e)).

**Never yet exercised on real infrastructure** (each is first proven at its owner step; kept current, D-111(f): an
item leaves this list only with the run that proved it):
- a sign-in as `pintar_backup` through the pooler (needs C2, O6);
- `pg_dump` as `pintar_backup` through Supavisor with one shared snapshot (the path check does it as the
  administrative user first);
- an upload to the real bucket with Object Lock (O3);
- Storage read through Supabase's real S3 API (O5);
- encryption to the real R1, R2, R3 keys (O4); the possession check answered by a real custodian;
- the escrow (O7: also needs both durable-secret fingerprints recorded in `docs/recovery/durable-secrets.json`,
  printed by the next production deploy);
- the rehearsal (O8), every part of it: C10 and its isolation; the copy's keys from the Management API (only the JWT
  format is taken); the copy reached through its pooler with verify-full; staging's Vercel project read for its preview
  protection and variable targets; a preview deployment with per-deployment values and its alias; the four checks through
  Vercel; the teardown.

**Prerequisites recorded in the code:** production's extension baseline is `null` (a production backup refuses to run
until it is read); `custody.json` has no proofs (production backup and escrow refuse).

**WP-C:** WP-C.1 and WP-C.2 built (the runbook, its tooling, the rehearsal's workflow and the functional checks); the
hosted rehearsal (O8) open. **Not started:** WP-D (B6/A6, O9). WP-E at the release (O10).

**Limits, named and accepted:**
- 5 GiB per upload: refused above it, warned of from 80 % (D-109(d));
- large objects are not carried; a run fails closed if any exist;
- the role's timeouts are defaults a session can lengthen; only the connection limit is enforced;
- the `supautils` residual (D-108(b)), watched by the extension baseline;
- logical restore is not equivalent to native restore (D-106(j)).

---

## 7. The O3–O7 order the code allows

Each step's evidence is reported before the next starts (D-107(a)).

| Step | Owner action | Evidence before the next |
|---|---|---|
| 0 | staging pooler value; O2 | the path check green (steps 1–4); C1 ISOLATED |
| 1 | O3: AWS account, stack, writer and reader keys | the stack's resources match the template; nothing else created |
| 2 | O4: R1 (custodian A) and R3 | public keys committed; R3's private key only in `staging-recovery-drill` |
| 3 | O5: Supabase Storage S3 keys | — |
| 4 | O6: C2 passwords; the coordinator runs `backup credential · set` (staging) | `pintar_backup` signs in read-only by default |
| 5 | — (coordinator) | one staging backup green, one planted failure red, one staging drill green (SAFE TO REOPEN, 24/24) |
| 6 | B6: custodian B creates R2; both possession checks answered | `custody.json` records both proofs |
| 7 | production authorisations (162, its baseline, C2) by separate ruling; O7 escrow | escrow under legal hold; a production backup encrypted to R1 and R2 only, checked from its packets |
| 8 | O10 at the release | the watch's first green scheduled run |

No interim R1-only escrow (D-111(b)). Step 7's production authorisations are separate rulings (D-111(e)). WP-C/B8
remains mandatory before final #150 PASS (D-111(g)).

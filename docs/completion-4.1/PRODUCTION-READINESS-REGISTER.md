# Production Readiness register (D-4)

**Bob coordinates; Sharon reviews.** Ruling 55, D-4: verify existing arrangements first, then propose the smallest
proportionate remedy for the owner's decision. **This register authorises nothing:** no build, purchase, configuration
change, production read or deployment.

**Draft 1, 18 Nov 2026.** Evidence comes from the repository, GitHub's run history (read-only) and recorded owner
evidence. Production itself was not read.

**A correction to the plan:** `POST-REVIEW-EXECUTION-18NOV.md` §4 gave "the 4.0 release checklist reads GO" as the exit.
**That checklist was retired as the readiness measure on 1 Oct (D-084).** Go-live is Phase 8 of
`docs/recovery/RECOVERY-CHARTER.md`, measured by the journey status on `docs/recovery/RECOVERY-BOARD.md`. This register
feeds that phase; it does not replace it.

## The operating envelope (owner, 18 Nov; ruling 57)

**The first use is a pilot of 10 adults:** no children; one school; one class; up to 10 people active at once;
existing features only. Any increase needs a new owner decision.

- **Capacity (PR-10): no upgrade indicated.** 10 learners starting together on Micro: database CPU 3%, save p95
  819 ms (efficiency audit of 2 Oct, run 36963146820). The real app at 50 learners: correct, database CPU 15%.
- **The leader page (PR-11):** about 7 requests for one class. **Not needed for the pilot**; it stays a GAP for a school
  cohort.
- **Support:** one named first-line contact, plus a second production administrator.

The proposal is `PILOT-10-ADULTS-PROPOSAL.md`.

## The register

**States:** EXISTS-ON (built, switched on and evidenced) · EXISTS-OFF (built, not switched on) · PARTIAL · GAP ·
UNKNOWN (needs the owner or a read).

| # | Area | What exists | Evidence | State | Smallest proportionate remedy (for the owner) | Owner | Exit criterion |
|---|---|---|---|---|---|---|---|
| PR-1 | **Legal and consent** (UU PDP, PSE registration, controller and processor, parental consent, content rights, the AI policy) | Questions drafted for counsel | W9.11: "BLOCKED: external dependency" | **GAP** | Engage counsel on the W9.11 list; scope it to the first intended use (an adult pilot needs less than children's data) | Owner + counsel | Counsel's written answers, mapped to product changes |
| PR-2 | **Retention and deletion (R-2)**, including the backup retention line (O11) and a restore resurrecting deleted data (M-2) | Designs and Sharon's D-R2 recommendation | Planning audit; W9.11 | **GAP** (an owner decision) | Decide R-2 per evidence type, with counsel | Owner; Sharon drafts | R-2 ruled; the product matches it |
| PR-3 | **Transfer consent (OD-9)** | A transfer flow; consent is sent as `{}` | **Verified:** `konfigurasi/actions.ts:83,132` | **GAP** (a policy decision) | Rule on OD-9; then a small form change | Owner; Sharon | OD-9 ruled; the consent is recorded |
| PR-4 | **The production watch** (hourly, read-only) | `production-watch.yml`, gated on `vars.PINTAR_PRODUCTION_WATCH == 'on'` | **Verified (GitHub run history):** runs 184–186 on 17–18 Nov all *skipped* | **EXISTS-OFF** | Switch it on (one repository variable), then make it fail once on purpose and see the alert | Owner (the variable) | One deliberate failure raises the alert |
| PR-5 | **Off-site encrypted backup** (daily, 03:00 WIB, fails closed) | `backup-offsite.yml`, gated on `vars.PINTAR_OFFSITE_BACKUP == 'on'` and a bucket | **Verified:** runs 41–43 (15–18 Nov) all *skipped* | **EXISTS-OFF** | Switch it on once the bucket and recipients are confirmed. Its retention must agree with R-2 | Owner | One scheduled backup lands, encrypted, and its size is reported |
| PR-6 | **The monthly restore drill** | `restore-drill.yml`, gated on `vars.PINTAR_RECOVERY_DRILL == 'on'` | **Verified:** its only scheduled run (2 Nov) was *skipped* | **EXISTS-OFF** | Switch it on after PR-5 | Owner | One drill restores the newest backup and passes the posture checks |
| PR-7 | **Restore of the database** | A native restore rehearsed (8 min 03 s on staging); a logical restore plus the posture step gives 24/24 PASS | `JOURNEY-LOG.md` G2; W9.12 (run 42174482669) | **PARTIAL** | Repeat once on the release candidate's data shape, timed | Sharon + owner | A timed restore on the candidate |
| PR-8 | **Restore of stored files; Auth and SMTP settings; secrets outside the database** | Metadata only; reconstruction procedures | W9.12 "still outside what it proves"; W9.9 "implemented, not verified" | **GAP** | Rehearse W9.9 (configuration reconstruction) once; one file-restore check | Second Eye + owner (billable) | Files and settings recovered in a rehearsal |
| PR-9 | **Point-in-time recovery** | Not enabled; daily physical backups (owner screenshots, 5 Oct) | `JOURNEY-LOG.md` G1 | **UNKNOWN today** (was off) | Owner decides whether the recovery point (about 24 h) is acceptable for the first use | Owner | A recovery point stated and accepted |
| PR-10 | **Capacity** | Both databases on the Micro tier; load test L1 failed on Micro (p95 11.7 s, pool exhausted); the 50-learner browser run passed | `A-CURRENT-STATE` §83–84; October efficiency audit | **Met for the 10-adult envelope** (evidence above); a GAP for a school cohort | None for the pilot. Before any larger cohort: L1 on the candidate tier, upgrade only if it fails | Owner (tier cost) + Second Eye | The load test passes on the chosen tier for the stated envelope |
| PR-11 | **The leader page's unbounded fan-out** | — | **Confirmed (Sharon):** 7 concurrent RPCs per class, unbounded | **GAP** | A concurrency limit, if the envelope includes a leader page | Sharon → Second Eye | Measured within the envelope |
| PR-12 | **Error capture** (application errors reaching someone) | An error page with a reference code; «Laporkan masalah» | Review P (cited); no error service in the repository | **GAP** | The smallest option: route the existing problem report and server errors to a monitored mailbox, before any paid service | Owner | One induced error reaches a named person |
| PR-13 | **Scheduled-job failure** | Two jobs declared once and checked; a failure warns in the database | `20270116110000` | **PARTIAL** | Have PR-4's watch read the job health it already exposes | Second Eye | A failed job is seen by the watch |
| PR-14 | **Production email** (SMTP, SPF/DKIM/DMARC, Gate 8) | In progress | W9.13 | **PARTIAL** | Finish W9.13 | Owner + Second Eye | Pass in received headers |
| PR-15 | **Named support people** | None named | W9.16 | **GAP** | Name one first-line contact for the first use, and an escalation path | Owner | Names and hours recorded |
| PR-16 | **A second production administrator and break-glass** | One production admin | W9.12 break-glass "NOT STARTED"; Review P | **GAP** | Name a second administrator; rehearse break-glass once | Owner | Rehearsal recorded |
| PR-17 | **The production upgrade (111 → the 4.1 candidate)** | A rehearsal on a scratch copy | `rehearsal/PRODUCTION-UPGRADE-REHEARSAL.md`; production counts of 17 Nov | **PARTIAL** | Re-run on the final 4.1 candidate | Bob + Sharon | A green rehearsal on the candidate |
| PR-18 | **Operating without one person** (promote, restore, approve) | Every merge, promotion and spend waits on the owner by design | Release rules | **By design** | Keep the owner's authority. Document who executes each runbook step under it, so that an execution step doesn't depend on one session | Bob | Each runbook names its executor and its approver |
| PR-19 | **Data residency** (E-K6-1) | Pending counsel | D-182(3) | **GAP** (with PR-1) | With PR-1 | Owner + counsel | Answered |
| PR-20 | **Real-device performance from Indonesia** | U-PERF "not met, by little" from US runners; no regional measurement | W6.2 | **GAP** | One measurement on a low-cost Android phone and a shared school line (D-4 and the plan's verification 7) | Daisy or the owner (a device in Indonesia) | p95 save and first screen recorded |
| PR-22 | **A locked account must not be detectable through Auth** (audit 79 L-78; Sharon, `AUDIT79-L78.md`) | Supabase Auth bans locked accounts (`banned_until`, from migration 221), and its token endpoint answers `user_banned` before checking the password. With the public anon key plus an email **or a card number**, anyone learns that an account is suspended or closed. A password can also be confirmed by timing (71 ms against 27 ms) | Second Eye, local stack, `e59276ce` | **BLOCKER** for any production promotion bringing migration 221 or later (Z, hence D2-R and CI-1). Production (111) has no bans, so nothing is exposed today | **CI-2** rides with that promotion or precedes it. **CI-2 approved (ruling 98).** No operational workaround that stops institutions suspending accounts. **The exposure assumption (production has no bans) is verified during the authorised production readiness process** | Owner; Sharon verifies | **Not met (open as the production gate, ruling 103).** CI-2 is **closed on staging** (25 Nov 01:18Z): merged `0c155a5c`, staging 311, Sharon's promotion PASS `6f0d376f`, main ci 45520797680 success. Remaining: the owner's separate production authorisation, the production exposure check, PR-25 on the commit taken |
| PR-23 | **The shared-computer idle lock must fire** (audit 79 L-112; Sharon, `AUDIT79-L112.md`) | With the welcome tour open, programmatic scrolls count as activity, so the shared-computer lock never fires and the next person gets the learner's session | Builder, J10 capture `6b248975`; cause traced by Sharon | **HIGH. A blocker for any shared-computer use**, not for a pilot on personal devices | Fixed in AR-79 under Sharon's conditions (only real input counts; red-first real-browser tests; sweep of self-scrolling components) | Sharon verifies | Not met |
| PR-24 | **Every AI request refusal is recorded with its reason** (audit 79 L-126; Sharon) | Allowance and ceiling refusals leave `ai_permintaan.hasil` empty; only the learner-data refusal is recorded | Daisy, J6 (`6a50d36f`) | **SIGNIFICANT. A blocker for C3w-2's AI activation** (AI is active nowhere today) | AR-79: a closed reason code in the same transaction; a CHECK against an empty terminal `hasil`; a test for each refusal path | Sharon verifies | Not met |
| PR-25 | **Main is green on the exact commit a production promotion takes** (Sharon, CI-1 FINAL, 24 Nov) | Main's ci on `93b93134` (CI-1's merge) is red on the pre-existing R1-K01 test-clock defect (17:00–24:00Z), with selftest skipped, so main has no green full run there | ci 45500905491 (failure, read by Bob and Sharon from the API); the same tree's PR ci 45439475500 was success | **A blocker for any production promotion taking main while its ci is red** | CI-2's clock fix (`6aceed28`; also ported into H-1, PR #32) lands, and main's ci goes green on the exact commit | Bob reads the conclusion; Sharon verifies | **Met at main `f1e35bb9`** (H-1's merge, ruling 102): ci 45510549989 completed, **success**, all 18 jobs including selftest, and the R1 red-case group ran inside the 17:00–24:00Z window (23:33–23:41Z), read from the API at 00:08Z on 25 Nov. **Standing rule:** any later commit a production promotion takes must itself be green Also green at main `0c155a5c` (CI-2's merge): ci 45520797680 success, 18/18, read from the API at 01:18Z on 25 Nov |

## What this shows, in plain terms

1. **Three safeguards are built and switched off:** the production watch, the off-site backup and the restore drill
   (PR-4 to PR-6). They cost almost nothing to switch on, each needs one owner action, and each has a test. **This is the
   cheapest readiness gain available.**
2. **Most of the real gaps are not engineering:** legal advice, retention, the transfer consent decision, support
   people and a second administrator (PR-1 to PR-3, PR-15, PR-16, PR-19).
3. **Capacity is the one engineering gap with a known failure** (PR-10). The proportionate answer is to state the first
   use's size and test it, not to upgrade in advance.
4. **No new backup or monitoring architecture is proposed.**

## For the owner (when convenient; none blocks 4.1)

- **PRQ-1 · PR-4 to PR-6:** switch the watch on now? It is read-only, and Sharon can induce the test failure. The backup
  and the drill wait for the bucket and recipients to be confirmed. **Bob recommends the watch now,** and the backup and
  drill once PR-5's settings are confirmed.
- **PRQ-2 · The first use's envelope: DECIDED** (10 adults, ruling 57). Was: for example "one adult pilot group" or "one class of 40". It sizes PR-10, PR-9 and
  PR-15.
- **PRQ-3 · PR-1 and PR-2:** start the counsel engagement scoped to the first use.

## Sharon's review (18 Nov, `READINESS-REGISTER-899d3aef.md`)

- **PR-4 to PR-6:** "off" covers only the schedule. **Each job also runs on `workflow_dispatch` against production,** so
  anyone with dispatch rights can run it today. Record who holds those rights (the owner confirms). The switch-on test
  must also prove that **a missing secret fails closed.**
- **PR-7:** the restore is the owner's to authorise and someone else's to execute, not Sharon's.
- **PR-11: CONFIRMED.** `buktiPerKelasDari` (`pimpinan.ts:454–469`) makes 7 concurrent RPCs per class, unbounded: about
  210 for 30 classes, against the Micro pool. **The smallest fix is a concurrency limit.**
- **PR-10:** the envelope must state whether a leader page is in scope.

## Draft 2 (Bob, 24 Nov 2026; ruling 89): what changed since 18 Nov

**This draft still authorises nothing.** Production was not read. Production is at 111. Staging is at 308 (Z, ruling 88).

| # | Change since draft 1 | State now |
|---|---|---|
| PR-1 | **Counsel approved for the AI questions only** (ruling 85, both providers, fees first). The brief, `e-local/v4/COUNSEL-BRIEF-RULING85.md`, is FIT TO SEND (Sharon, `60691d59`), not yet sent. **The wider W9.11 list** (PSE registration, controller and processor roles, consent and content rights for the first use) **is not in that brief** | **GAP**, narrowed. *Bob recommends:* add the W9.11 first-use questions to the same engagement, as one fee estimate |
| PR-3 | Ruling 73 (C′) decided how a pending transfer from a since-suspended administrator completes (re-confirmation, at 4.5). **OD-9 (consent itself) is still undecided** | **GAP** (unchanged). Needed before any real transfer; not needed for the 10-adult pilot, which is one school |
| PR-4 to PR-6 | **Still off.** Read on 24 Nov: the watch's runs up to #203 (23 Nov) and the backup's up to #48 (23 Nov) are all *skipped*. **Sharon's 18 Nov points stand:** record who can dispatch each job against production, and prove that a missing secret fails closed | **EXISTS-OFF**. PRQ-1 is still open for the owner |
| PR-13 | Unchanged | PARTIAL |
| PR-17 | **The candidate changed.** Main is now `61a6ff9e` at 308, and D2-R follows. The after-promotion checks are proven on staging: `v6-pre-request.sql` and `c3w-r3-bahan.sql` both OK; the pre-request ran after the promotion (+148 calls); `periksa` is byte-identical to main's build (`batches/z/z-promotion/V6-HOSTED-OVERRIDE.md`) | **PARTIAL**. Re-run the production rehearsal on the 4.1 candidate **after D2-R** (the final 4.1 shape), with the V6 hosted check added to its list |
| PR-18 | **Ruling 83** adds a readiness gate (`scripts/dev/siap.sh`) and run classes (PASS / FAIL / INFRA / VOID). GitHub CI is the authoritative full run (L-3) | **By design**, executors now named for verification runs. The runbook naming each executor is still to write |
| PR-12, PR-15, PR-19 | Unchanged. **Daisy reads them** for what a person sees when they need help (ruling 89, 2b) | GAP |
| Others | No change | As in draft 1 |

**For the owner (unchanged, none blocks 4.1's gates):**
- PRQ-1, the watch;
- PRQ-3, counsel for PR-1 and PR-2, now best combined with the ruling 85 brief;
- PR-15 and PR-16, the names.

**Reviews of draft 2:** Sharon (second pass) and Daisy (PR-12, PR-15, PR-19). Recorded here when they land.

### Sharon's second pass on draft 2 (24 Nov, `READINESS-REGISTER-D2-7aae24e0.md`): accurate, with four additions

1. **PR-4 to PR-6, dispatch rights: now recorded (Bob, read-only, 24 Nov).**
   - GitHub lists **one collaborator: the owner's account, with the admin role.** No other person has write access.
   - **The team's sessions also act through the GitHub App installation, and that can dispatch workflows.** It dispatched the ruling 84 diagnostic runs. So a session could start `backup-offsite`, `restore-drill` or `production-watch` against production today.
   - Standing rule: no session dispatches a production-facing workflow without the owner's separate authorisation, as for every production action.
   - **For the owner:** confirm this list before production holds data, and decide whether those three workflows should also require a GitHub environment approval (a protected `production` environment with the owner as required reviewer). That is the smallest technical guard.
2. **New row, PR-21: Z's production carry-overs (ruling 88).**
   - Until Z reaches production, no `MCQ_MULTI` package is published or imported there.
   - **Before the promotion:** `d1-multi-answer.sql` and `step0-Z.sql` run read-only on production, both expecting 0.
   - **After it, the same proofs as staging:**
     - `v6-pre-request` and `c3w-r3-bahan` OK;
     - line 84 convalidated;
     - the `periksa` counter rising;
     - its md5 equal to main's build.
   - **State:** PLANNED. **Owner:** Bob + Sharon. **Exit:** all recorded on the production promotion.
3. **PR-15 and PR-16, for the pilot.**
   - An `INSTITUTION_ADMIN` appointment reaching `valid_until` still leaves the school with no administrator, and nothing refuses it.
   - **Remedy:** give the pilot school two administrator appointments, or one that ends after the pilot, and name the platform administrator who can appoint a replacement.
   - (The expiry warning itself is 4.5, as Sharon recorded.)
4. **PRQ-1.** The skipped runs prove that the schedule gate holds. They don't prove that a missing secret fails closed. **That test still runs at switch-on.**

**PRQ-4 (new; Sharon, 24 Nov): the protected «production» environment is the right guard, if four things hold.**
1. Each job that uses `PRODUCTION_*` or `AWS_BACKUP_*` secrets declares `environment: production`.
2. Those secrets move from the repository level to **environment secrets**. Otherwise a job without the environment still reads them.
3. The environment's deployment branches are restricted to `main`.
4. The owner is the required reviewer. «Prevent self-review» is off only because the owner is the sole administrator, and that is recorded here.

The App's dispatch then waits for the owner's approval. **This is a configuration change on GitHub, so it is the owner's to authorise and make.** The workflow edits for point 1 can be prepared on a branch and reviewed by Sharon.

**A note for PRQ-4 (24 Nov):** the owner reports that the repository settings page returned 404. A protected environment is configured on that page, so PRQ-4 needs settings access confirmed first. It is not blocking, and nothing is changed now.

### Daisy's reading of PR-12, PR-15 and PR-19 (24 Nov, `BACA-REGISTER-PR12-15-19.md`, `fef73844`)

**One real gap: the screens promise a response time that nobody yet guarantees.**
- «Laporkan masalah» says «Admin sekolah atau tim PINTAR akan melihatnya dalam satu hari sekolah.» For a class that has stopped, it says «… dijawab pada hari sekolah yang sama.» (`lapor.langkah.*`).
- PR-12 (no monitored route) and PR-15 (no named contact) are both GAP, so the promise depends on someone happening to look.

**Before the first use, one of these (the owner's choice; it doesn't block 4.1's gates):**
- **(a) Preferred:** close PR-12 and PR-15, and add to PR-15's exit «hours cover school days in WIB, WITA and WIT». The words then stay as they are.
- **(b) Otherwise, soften the two strings** until (a) is met:
  - `lapor.langkah.awal` becomes «Admin sekolah Anda dan tim PINTAR dapat melihatnya di sini.»;
  - `lapor.langkah.awal_kelas` becomes «Laporan ini ditandai menghentikan kelas, jadi dibaca lebih dulu.», and only if the triage list really sorts these first.

**PR-19:** nothing for the person to see until counsel answers. Any disclosure belongs in the privacy information, not in each flow.

**Two small items go to the ruling 79 ledger (J10):**
- the error page has no «Laporkan masalah» link carrying the reference code;
- it tells a learner «pengelola sekolah Anda», where everything else says «guru Anda».

### Infrastructure facts (owner, 24 Nov 2026)

| Fact | Source | Effect |
|---|---|---|
| **Supabase production is in Singapore (`ap-southeast-1`)** | The owner, read from the dashboard | PR-19 and counsel part 2: confirmed |
| **Email is sent through Namecheap's mail host for `pintarselalu.com`** | The owner. **Verified in the repository (Bob):** `configure-supabase-smtp.yml` (production) and `staging.yml` set Supabase Auth's SMTP to `pintarselalu.com:465` (SMTPS), sender `noreply@pintarselalu.com`; credentials come from secrets and are not read here | PR-14: the sender exists. **The hosting server for `pintarselalu.com` is in Singapore** (owner-confirmed, 24 Nov). **Separately, any additional email processing or relay locations Namecheap may use remain unverified.** Counsel part 2 states both, and Q4 asks what must be established about such locations. **A second sender exists:** the app's own emails (activation, recovery: `_email/kirim.ts`) use `PINTAR_SMTP_HOST`, which is set in the application's environment, separately from Supabase Auth. **Owner-confirmed (24 Nov): production's `PINTAR_SMTP_HOST` is `pintarselalu.com`.** Both Supabase Auth's email and the app's own emails use the same Namecheap mail host. *Correction:* Bob's earlier draft named "Resend". That was wrong: the word came from unrelated uses of "resend" in the repository |
| **The off-site backup: Google Cloud Storage preferred over AWS, in Jakarta (`asia-southeast2`), proposed** | The owner | PR-5 and PR-6: **the implementation is deferred pending separate authorisation.** `backup-offsite.yml` today targets S3-style storage, so moving to GCS is a workflow change (GCS's S3-compatible interface or its own client). That is to be designed and reviewed with Sharon when authorised |
| **The Google Cloud project `pintar-staging-backup` exists, with no buckets; Cloud Storage is not activated** | The owner | Nothing exists yet to secure or point at. Nothing is created now |

### Email capacity (owner, 24 Nov 2026): for future capacity planning

- **The plan:** `pintarselalu.com` is on Namecheap's **Stellar Business** shared hosting plan, in Singapore (owner).
- **The sending limit:** **10,000 outgoing emails per hour per domain**, per Namecheap's documentation as cited by the owner (Namecheap knowledgebase article 9347, «Benefits of Stellar Business hosting packages»). This session could not open the page, so the figure is recorded as owner-cited.
- **The decision:** Namecheap stays the email provider. **No additional email provider or subscription is needed at this stage.**
- **What exists today** (read from the repository, for the future review):
  - Both senders share one domain, and so one hourly limit: Supabase Auth's sign-in emails and the app's own activation and recovery emails.
  - The app's sender (`src/app/api/_email/kirim.ts`) sets connection, greeting and socket timeouts (10 s, 10 s, 20 s), catches a failure, and **does not retry**.
  - `configure-supabase-smtp.yml` reads back Supabase Auth's `smtp_max_frequency` and `rate_limit_email_sent`, but this record does not establish their production values.
- **For future scalability reviews (no work now):**
  - aggregate volume across both senders, against the per-domain hourly limit;
  - rate limiting on the PINTAR side, so that a bulk action (for example, a class's activation emails) cannot exhaust the shared limit;
  - how a delivery failure reaches the person or an administrator;
  - retry handling, with backoff, for the app's sender.
- **For the 10-adult pilot:** the volume is far below the limit, and no change is indicated.

**Owner's decision (24 Nov): option (b).** The response-time promise in `lapor.langkah.awal` and `lapor.langkah.awal_kelas` is **softened** until a monitored support arrangement exists (PR-12, PR-15). Daisy settles the words, and the change rides D2-R as its own commit.

**Ruling 90 (24 Nov):** the wording is softened in 4.1 (no time-bound promise without an operational process). The full support capability, with notifications, escalation and threads, is a 4.5 item: **4.5-OF-SUP**. PR-12 and PR-15 remain the owner's for the first use's operational arrangement.
**The softened wording (Daisy, `D2R-KATA` §10, `ccd42fa6`), riding D2-R:**
- `lapor.langkah.awal`: «Laporan ini sudah tersimpan. Admin sekolah Anda dan tim PINTAR dapat membacanya.»
- `lapor.langkah.awal_kelas`: «Laporan ini ditandai menghentikan kelas. Admin sekolah Anda dan tim PINTAR melihat tanda itu, dan laporan ini tampil lebih dulu di antara laporan yang belum ditangani.»

No time period appears in either line. The second line is true per `lapor-masalah.ts:85`, and a test pins it.

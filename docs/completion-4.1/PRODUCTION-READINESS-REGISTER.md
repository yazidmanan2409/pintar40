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

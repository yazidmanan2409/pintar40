# PINTAR 4.1 · current instructions to the team

> Kept by the Chief Architect on `claude/bob-41-master-plan`, so that every instruction is readable by its recipient
> and names full commits. Replaced as the work moves; the log at the end keeps what was issued. It adds no gate: it is
> where the prompts live.

**Authority:** THE PLAN (`THE-PLAN.md`, owner approved, byte-identical) and **THE PLAN · Addendum 1**
(`THE-PLAN-ADDENDUM-1.md`, owner approved and effective 12 Nov 2026 as submitted at
`0e3c63e11540a004fbb5183c1486378301e7a9f7`). Where they differ, the addendum governs, on the points it names.

**Sequence now:** B2 → [staging checkpoint, only if separately authorized] → **A2a → A2b** → C2w → A3 → C3w → Z, with
the small corrections around B2 and the provider evaluation's preparation alongside.
*(The earlier line here, "B1 closure → L-1 → F-1 → B2 → A2 → C2w → A3 → C3w → Z", is superseded: B1, L-1 and F-1 are
closed, and A2 is built as A2a then A2b.)*
**Not authorized:** any PR, merge, staging promotion or production change. Staging is not to be modified.

## Owner directive, 16 November 2026: proceed through 4.1; a pending owner click is not a standstill

**Sequence:** A2b → C2w → A3 → C3w → Z → the educator walkthrough → the owner's 4.1 acceptance → **the Post-4.1 Codebase Rationalisation & Performance Optimisation milestone** (DEFERRED; it opens only on formal 4.1 acceptance and closes with verified results before substantive 4.2 development, unless the owner approves otherwise: ruling 54, `docs/post-4.1/RATIONALISATION-MILESTONE.md`) → 4.2.
Development, tests, reviews and internal verification continue without waiting for owner instructions. Escalate only
material decisions, genuine blockers, spending approvals or production actions.

**At an owner authorisation boundary** (any staging step that needs the owner to click Allow, approve access or
otherwise act):
1. **Stop at it.** Never bypass it, and never treat approval as implied.
2. **Preserve:** the exact frozen candidate (SHA), its evidence, the pending staging actions, and the before-and-after
   preservation checks. The **before** read is still taken **before the merge**, so the merge waits with it.
3. **Mark** staging promotion and staging-dependent acceptance as **PENDING OWNER AUTHORISATION**, never complete.
4. **Move on:** start the next approved batch on its own branch. It may branch from the frozen candidate, which is
   never modified; anything the candidate needs afterwards is a new commit on the candidate's own line, under the
   freeze rules.
5. **Resume** the staging work when the owner authorises it.

**Per batch:**
- **A2b:** second screen batch, Sharon's tests, Daisy's review, exact-candidate pre-flight, freeze, PR, CI, journeys,
  authorised staging with preservation checks.
- **C2w:** next. Verify F-3 and F-4's evidence first; build any missing prerequisite before dependent work.
- **A3:** after C2w, keeping the approved single-writer and recovery safeguards.
- **C3w:** all approved design and implementation preparation continues (rulings 38–41, R-3). **No external provider
  calls, no costs, no bypass of E's qualification and authorisation gates.**
- **Z:** integrated verification and staging promotion only when every prerequisite and authorisation is met. No
  acceptance on incomplete evidence.

**In parallel:** X-1 (external-AI prompts and instructions) after A2b's freeze; E's authorised no-cost preparation.
E's three owner decisions (providers, scoring rules, judges) stay visible in status reports, not raised repeatedly.

**Principles:** no silent scope expansion; no bypassed security or deployment gates; no false completion claims.

## C2w ACCEPTED on staging (18 Nov 2026, about 09:20 UTC)

**Owner's confirmation (18 Nov 2026):** "C2w acceptance approved … Record C2w as accepted in staging at 284 migrations. Production remains untouched. Proceed with A3 as planned, subject to its existing verification and promotion gates."

- **Sharon: promotion PASS** (`C2W-PROMOTION-7ba18b03.md` on her branch). She checked independently:
  - the merge tree equals `b57d897a` = `aa5f5741` + `C2W-MERGE-HEAD.md`;
  - the migration hash `54b6569d…`;
  - the before-read against A2b's after-read;
  - before → after: only line 10 moved, with the digest equal to the dry run's.
- **Her note, stated here:** lines 65–68 read 0 on staging because staging holds no `release_distributions`. Rule P1 (an unaudited withdrawal makes line 68 read 1) is proven by the local dry run's plants (`7815a70a`, `210cc98e`), not by staging.
- The after-read's truncated header line is restored; the data lines are unchanged.

- **The owner's authorisations (18 Nov):** the before-read; then the merge, the promotion 282 → 284, the after-read and the hosted checks.
- **Before-read:** read only on `pintar-staging` at 07:54:50 UTC; 282 / `20270120240000` (`d688c7c7`).
- **Merge:** the repository rule required the PR's own `pull_request` CI, so the owner chose a documentation-only head, `b57d897a` (= `aa5f5741` + `C2W-MERGE-HEAD.md`). PR CI 44267902485 passed. [PR #25](https://github.com/yazidmanan2409/pintar40/pull/25) was merged as `7ba18b03`, whose tree is identical to `b57d897a`.
- **Staging:** `staging.yml` 44272691283 passed.
- **After-read** (same cutoff and watermark; `5f18b25b`): only line 10 moved, 282 → 284 / `20270121110000`, and the versions digest equals main's. Every preserved line is identical; `release_distributions` (lines 65 and 66) is unchanged; line 68 = 0.
- **Hosted:** pg_cron job 5 succeeded at 09:05 and 09:10 UTC; job 6 is intact; C2w adds no job. environment-facts 44273100341: success.
- **Rollback position,** as for A2a and A2b: a reviewed forward fix, or a staging backup restore under the owner's authorisation.

## C2w FROZEN at `aa5f5741d0bb8574986f055458a05d9f714e277f` (18 Nov 2026, about 02:30 UTC)

**The product commit is `6b6f31c548b1797509c34bff4dd8f606b9efaad9`.** `aa5f5741` adds documentation only: the candidate note and the dry-run outputs. Bob checked that no code file differs. All evidence below is on these two SHAs:
- **Second Eye's pre-flight on `6b6f31c5`**, on a fresh reset and fresh build:
  - lint and typecheck 0;
  - build identity 11/0;
  - suite 1242 passed, 0 failed;
  - plants 175/175;
  - red-case 11/11.
- **Migrations:** 282 → 284 (`20270121100000`, and `20270121110000` with sha256 `54b6569d…5196`). No existing migration is edited.
- **CI on `aa5f5741`:** run 44216101395, success.
- **audit-journeys** (ref=claude/c2w, inputs.ref=`aa5f5741`): run 44216105919, success, jobs A and B.
- **The preservation pair 282 → 284:** the header was checked against the built migration (`dfa542ab`). The local dry run's three proofs were checked by Bob (`7815a70a`) and by Sharon (`210cc98e`).
- **Sharon:** the database delta check, then the delta on the CSS and component change (render order only), PASS at `210cc98e`.
- **Daisy:** the screens cleared on `6b6f31c5`, with C-7 and C-8 passing.

**Next: the owner's boundary.** **PENDING OWNER AUTHORISATION**, in two separate requests (`batches/c2w-evidence/C2W-OWNER-REQUESTS.md`):
1. the read-only "before" preservation read on staging (`keijhmdtsgrfvnvocfvk`);
2. then the merge of PR #25, staging's migration, the "after" read and the hosted checks.

Nothing goes past the boundary without his approval. Coordination delegated to Bob does not cover these two steps (Sharon). Until then the candidate stays frozen: **no commit to `claude/c2w`.** A3 continues on its own branch.

## C2w UNFROZEN: the 06:45 freeze of `a9d303b2` was premature (Chief Architect, 17 Nov 2026, about 07:20 UTC)

**My error.** `a9d303b2` holds only:
- C2w's first item, A2B-R2 («Tarik izin» fails closed; the Kanonik list shows open grants);
- the F-3 and F-4 entry evidence.

It does **not** hold C2w itself. C2w is reviewer notes on sealed questions: `PLAN-A2B-C2W.md` §3, «Catatan peninjau» (ruling 30), with I-5 tested in both places and B4–B6. That feature is not built on any branch. `STATUS-2026-11-16.md` row C2w gave the order: "A2B-R2 first, then F-3/F-4 evidence, then reviewer notes". A partial batch is not a freeze candidate (freeze sequence, step 2).

- **The freeze is withdrawn.**
  - Sharon's PASS on `a9d303b2` stands as a review of those commits. It is not a C2w acceptance.
  - Second Eye's pre-flight on `a9d303b2` was green, but it is not C2w's one full pre-flight.
- **[PR #25](https://github.com/yazidmanan2409/pintar40/pull/25) becomes a draft, kept open for CI only.** Its CI and the journeys run on `a9d303b2` are rehearsals, not evidence.
- **Daisy's Kanonik capture PASSED at 07:05, before the hold reached her** (`3174b6c1` on `ux-1/daisy-experience`, from a local build of `a9d303b2`, at 390 px, 0 px overflow).
  - It carries forward to the real candidate if `studio/kanonik/page.tsx` and `studio/actions.ts` are unchanged; otherwise it is re-taken.
  - Her notes N-6 (the confirmation's consequence line) and N-7 (the grant select's label) are 4.0 strings this fix newly exposes. They are not blockers; they go into the next batch.
  - The on-screen action is «Tarik dari peredaran». «Tarik izin» is team shorthand only.
- **Paused:** the preservation dry run. Both are taken on the real C2w candidate.
  - `preservation-C2w.sql` (Sharon's PASS at `1d5428ca`) is restated when the reviewer-notes migrations are known. Its pair will be 282 → 283+n.
- **Next:**
  - Second Eye builds the reviewer notes on `claude/c2w` per §3, red first.
  - Then the one candidate, the full pre-flight, Sharon's and Daisy's reviews, and the freeze.
  - A3 continues in parallel, as the owner allowed.
- **No staging read was requested, and none was made.**

### Withdrawn record (kept for the audit trail)

#### (withdrawn) C2w FROZEN at `a9d303b20294cf9fee9279944f66a3be6f1300fc` (17 Nov 2026, about 07:00 UTC)

- **The gates for the freeze are met.**
  - Second Eye ran the one full pre-flight on `a9d303b2` and it is green: suite 1232 passed and 0 failed, plants 175/175, red cases 11/11, and lint, typecheck and build identity clean.
  - Sharon's review is a PASS on this head (`C2W-R2-c9d9ae4e.md`, 04:30 addendum).
- **[PR #25](https://github.com/yazidmanan2409/pintar40/pull/25) is open for CI only.** The journeys (audit-journeys, both jobs) are dispatched with `inputs.ref` set to `a9d303b2`.
- **Still open, before the owner is asked for the before-read:**
  - CI on PR #25 is green.
  - The journeys are green.
  - Daisy captures the Kanonik list at 390, showing one grant (TERIMA, 16 Nov 15:52).
  - The preservation query is checked.
- **The preservation query is `batches/c2w-evidence/preservation-C2w.sql` on this branch.** It keeps A2b's method and restates the pair as 282 → 283. It is kept off `claude/c2w` so that the frozen head does not move.
  - reason_code is now preserved.
  - Line 64 is now state.
  - Lines 65 to 67 are new and read `release_distributions`.
  - Second Eye dry-runs it locally at 282 and at 283; Sharon checks it.
- **No staging read and no merge until the owner authorises each one.**

## A2b ACCEPTED on staging (17 Nov 2026, about 02:15 UTC)

- **The owner's authorisations:**
  - the "before" read (ruling 45);
  - "A2b merge authorised", with the staging migration and the mandatory after-check.
- **The "before" read** was taken read only on `pintar-staging` at 16 Nov 23:31:01 UTC, and read 267 / `20270119270000`.
- **Merge:** [PR #24](https://github.com/yazidmanan2409/pintar40/pull/24) as `1b1cada8`, a merge commit whose tree is identical
  to `ac25e9b1`.
- **Staging:** `staging.yml` run 43999826059 succeeded; the migrations equal the repository; the sign-in round trip passed.
- **The "after" read,** with the same cutoff and watermark:
  - only line 10 moved, 267 → 282 / `20270120240000`;
  - the versions digest equals `main`'s 282;
  - every preserved line is identical.
  - Evidence: `batches/a2b-evidence/preservation-A2b-staging-{BEFORE,AFTER}.txt`.
- **Hosted:** pg_cron job 5 succeeded at 02:05 UTC after the promotion; job 6 is intact; A2b adds no job. environment-facts run 44000776986: success.
- **Sharon:** promotion PASS; A2b accepted (`A2B-PROMOTION-1b1cada8.md`, `7ea8498f`).
- **Rollback position,** as for A2a: no dedicated script. Recovery is a reviewed forward fix, or a staging backup restore
  under the owner's authorisation.
- **Carried to Z:**
  - A2B-R3;
  - the start trigger's `now()` branch;
  - the L01 ranks (A3-R3);
  - A2B-R1;
  - Daisy's N-1 to N-5.
- **Production is untouched** (migration 111).

## A2b REFROZEN at `ac25e9b14d51928f6991f8932b3bb572a262c096` (16 Nov 2026, about 22:00 UTC)

The reopening for the start-path defect is closed. All evidence below is on this exact SHA:
- **Second Eye's pre-flight:** fresh reset and fresh build; lint and typecheck 0; build-identity 11/0; suite 1228 passed,
  0 failed, 1 justified local skip; plants 175/175; red-case 11/11; job A's journeys locally, all green.
- **PR #24's CI:** run 43958833562, success.
- **audit-journeys:** run 43959284163 (ref=claude/a2b, inputs.ref=ac25e9b1), success, jobs A and B.
- **Sharon:** PASS, freeze checks hold, R-SP2 closed (`5e51fa8b`); the definition copies do not weaken J1.6 or SP2.
- **Migrations:** 282; the preservation pair is 267 → 282. The product is unchanged since c507e41e (fix (a), reviewed).

**Next: the owner's boundary.** The read-only "before" preservation read on staging (`keijhmdtsgrfvnvocfvk`),
then the merge, staging's migration, the "after" read and the hosted checks. **PENDING OWNER AUTHORISATION.** Nothing
past the boundary without his approval. Until then the candidate stays frozen: no commit to `claude/a2b`.

## Owner, 16 Nov 2026, about 19:25 UTC: `claude/c2w` push granted; A2b's boundary restated

- **Second Eye may push `claude/c2w`.** This is strictly a push to a development branch. It authorises no merge, no
  staging promotion and no production action.
- **A2b:**
  - finish the current test-only corrections (J1.6's own fixture; Sharon's R-SP2);
  - then, on the one exact candidate: the full pre-flight, the journeys (both jobs), PR #24's CI and Sharon's review;
  - then refreeze.
  - Once ready, Bob presents the specific read-only "before" operation on staging for the owner's authorisation.
    **Nothing goes past that boundary without approval.**
- **E:** its three decisions stay pending. No paid provider calls or spending are authorised.
- Continue the approved sequence wherever dependencies allow.

## A2b's freeze REOPENED for one defect (16 Nov 2026, 16:20 UTC)

The journeys on `3c58620e` (run 43893436917) exposed a product regression. Since A2b commit 3,
`start_learning_session` raises the maintenance refusals as plain P0001, so `mulaiAsesmen` never sees PR040 or PR110.
A learner pressing «Mulai» on a start screen left open across T−15 or a window's start gets an error page instead of
R-A's start screen or 4.0's T−15 redirect. The suite missed it because its T−15 legs inserted sittings directly.

**Ruling (Chief Architect):** reopened for this defect only, and fixed before promotion with fix (a):
- the database raises PR110 and PR040 with DETAIL, as the trigger does;
- tests red first through `start_learning_session` and `mulaiAsesmen`, with a plant restoring the P0001 raise;
- a sweep of the other start paths;
- Sharon reviews.

Then a new candidate, the full pre-flight, and refreeze. The journey harness is fixed in the same pass (B4-W11's reason;
J1.6 restated under R-1, asserting PR040 positively). Staging is still PENDING OWNER AUTHORISATION.

## A2b FROZEN (16 Nov 2026, 15:08 UTC)

`3c58620ed6bdd27e3303e4d5decc462b648c2496` on `claude/a2b`. Pre-flight green (suite 1224/0, plants 175/175, red-case
11/11; A12 met). PR #24 open for CI only; journeys dispatched on the candidate. **Staging PENDING OWNER
AUTHORISATION** (the "before" read precedes the merge; owner offline overnight). C2w started on its own branch from the
candidate. Status report: `STATUS-2026-11-16.md`.

## While the owner is away (owner's standing instruction, 12 November 2026)

The owner is unavailable to relay messages. Everyone proceeds under the existing approved plans, decisions,
responsibilities and review procedures, and **does not wait for a relay.** Ordinary technical and design questions are
resolved among the team. All testing, review, evidence and deployment requirements stand. **The owner's absence
authorizes nothing new:** no merge, staging promotion, production release, expenditure or change to an owner
decision. A genuinely consequential owner decision is documented, and only the work it affects is held.

**How we reach each other without a relay.** No one on the team can message another directly. The repository is the
channel:

- **This file is the hub.** Read it, and the review queue below, **at every push, every verdict and every time you
  finish a piece of work.** The Chief Architect updates it at each check of the branches.
- **The engineer** needs no prompt to be read: a push to `claude/system-integrity-4.0` is the request. Each
  completion page says, at the top, which commit is the candidate and what it asks of each reviewer.
- **Reviewers take their work from the queue below,** on the exact commit named there, without waiting to be asked.
- **Verdicts are written where the others can read them:** Daisy on `ux-1/daisy-experience`, as she does. **Sharon on
  `claude/gracious-lamport-0m1qjr`, under `docs/coordination/reviews/sharon/`** (index: its `README.md`; since
  10:36 UTC, 12 Nov). *(Superseded, kept for the record:)* ~~Sharon: no branch of yours is visible to the team
  today.~~ ~~Please record each verdict in a file on a branch of your own
  (for example `reviews/sharon`, under `docs/coordination/reviews/`), named for the commit reviewed, and it will be
  picked up at the next check. A verdict that exists only in a conversation with the owner cannot reach anyone while
  the owner is away.~~
- **A question for another member** is written at the top of your own page or review, addressed by name. The Chief
  Architect answers on this branch.
- **For the owner's return:** anything that needs the owner is recorded in `STATUS-2026-11-12.md` under "Held for the
  owner", with the work it holds.

### Work in parallel while the checkpoint is in flight (Chief Architect, 13 Nov 2026, 03:55 UTC; on the owner's question)

**The bottleneck is one pipeline:** one engineer, one working tree, and about two hours per commit (the full local
pre-flight, then CI and journeys, then review), all in series. While it runs, the other three of us mostly wait.
None of the work below goes through that pipeline, and none of it needs a new authorization. **No gate changes.**

| Who | Now, in parallel | Why it is safe |
|---|---|---|
| **Daisy** | (1) **A2a's and A2b's words and screens, at the design stage:** the class-scoped emergency stop and its lift, the status notice, A2b's reason list (D2) and "cannot finish before the window" (D4), using her three habits (search existing strings, where it renders, the neighbouring act). (2) The design note for **X-2** (a learner's old link after a key correction). (3) The inventory for Z's consistency pass (the «Pendataan» naming, X-1, X-3, X-4) | Words and notes only, on her branch. They are ready when the build starts, so the build does not wait for them and she does not find them after it |
| **Sharon** | (1) **C3w's handling of learner personal information (R-3):** her five requirements turned into a checkable design, with the open question on common names. (2) The one-line test specifications for register items **F1R1B-R1** and **B2-R-S1**. (3) A2b's page, pre-build, when Second Eye pushes it | Design and specifications only. C3w is the batch with the longest lead (it also waits on the provider decision) |
| **Second Eye** | While a pre-flight runs (scratchpad only, as now): **A2b's completion page**, answering the five questions, and the skeleton of the staging verification report. **After the boundary commit is fixed and frozen (below): the register corrections** F1R1B-R1, B2-R-S1, X-1, X-3, as small commits, up to three on one verification | Pages are not builds. The register corrections are approved work ("before Z") and independent of the checkpoint |
| **Chief Architect** | The pull request's text and the verification report's structure, drafted now. **A frozen branch at the boundary commit for the pull request,** so the work branch can move on without widening it. The batch-close figures the owner asked for | The pull request then holds exactly the approved boundary, whatever is pushed afterwards |

**Still held, unchanged:** A2a's build, until the checkpoint has passed all verification (owner).

### The owner's rulings on elapsed time (13 Nov 2026)

> *Our objective is not to keep everyone busy. It is to deliver completed, correct work with less avoidable elapsed time.*

**1 · Documentation-only commits: focused local checks (approved).**
- **Documentation-only means:** every changed path is under `docs/`, and is a `.md` file or an image. **Anything
  else is not documentation-only:** code, tests, configuration, workflows, migrations, and also any `.sql`, `.mjs`
  or `.json` file wherever it sits (the rollback file, the preservation query and the manifest are executable or read
  by tests). If in doubt, it is not documentation-only.
- **Focused local checks:** the sensitive scan, baseline parity, and the static tests that read documents. Second
  Eye names the exact commands on the commit's page the first time, and they stay the same after that.
- **After the push: CI and journeys in full,** as for every commit. Reviews as before.
- Everything else keeps the full pre-flight of THE PLAN §4.1.

**2 · Reviewing a candidate while its pre-flight runs: no push before a green pre-flight (owner).**
The four of us share only two channels: the repository, and the owner. So, without a push:
- **The standard way: the review moves to the design.** The reviewer's specification of a fix (as Sharon wrote for
  the lock order and the clean-up) or the page's answers to the five questions is reviewed **before** the build.
  The review after the push is then a short confirmation of a delta against that specification.
- **For a small, review-critical commit, when the owner is available to carry it:** Second Eye prints the commit as
  a patch, with its commit hash and tree hash. The reviewer reads it as a preliminary read and says what they see.
  **It is not a verdict.** The verdict is given on the pushed commit, after green pre-flight, CI and journeys, and
  only if its hash is the one that was read.
- Nothing is pushed to any branch, under any name, before the pre-flight is green.

**3 · Running independent parts of the pre-flight at the same time (the owner asked; under examination).**
What is known from the repository, before any measurement:
- CI already runs the 11 red-case groups as separate jobs, each on its own database. So the groups are independent
  by construction; locally they run one after another on one stack.
- `scripts/dev/golden-db.sh` already clones a prepared database.
- Lint, typecheck and the build need no database.
- **What cannot be run side by side:** anything that changes what the whole database server shares (roles and their
  memberships, the scheduler's jobs), and the tests that need the app and Auth, which are bound to one database.

**Asked of Second Eye, as two small steps, with no new document:**
1. **Measure, from the last pre-flight's own log:** the minutes each step took (lint, typecheck, build-identity; the
   reset and build; the whole suite; the 175 plants; the 11 red-case groups). One table in his next report.
2. **Then, only where the numbers justify it,** as test tooling in its own commit after the boundary commit: run the
   static checks alongside the database reset; run the plants and the red-case groups on cloned databases in
   parallel, **except** those that touch roles or the scheduler, which stay in series.
   - **No compromise in verification:** the same counts must come out (175 of 175; 11 of 11), each plant still red
     for its own reason and green without it. Before it replaces the serial run, both are run once on the same
     commit and must agree line for line. Sharon reviews that one commit.
   - It is tooling, not product: it does not enter the checkpoint's boundary.

**The measurement (Second Eye, from the run that began 03:30 UTC on 13 Nov), and the decision.**

| Step | Minutes |
|---|---|
| Lint, typecheck, build-identity | about 0.7 |
| Reset and build | about 1.3 |
| Whole suite | about 9 |
| 175 plants | about 4 |
| **11 red-case groups** | **more than 14 and still running;** it resets the stack again and again |

- **The pre-flight is not sixty even minutes. One step is more than half of it:** the red-case groups, run one
  after another, each with its own reset. CI runs the same eleven side by side.
- **Decision (Chief Architect): parallelise the red-case groups only.** Static checks alongside the reset would save
  under a minute, and the plants about three: not worth a change. The safeguards above stand: groups that touch
  roles or the scheduler stay in series; the same 11 of 11; one side-by-side run that agrees with the serial run;
  its own commit after the boundary commit; Sharon reviews it.
- **Settled for A2b's page (Second Eye's question): extend gets its own function,** so the refusal of an EMERGENCY
  window lives in one place. Condition, from question 1: it is then the **only** writer of a planned window's end
  time apart from the listed ones, the older path refuses that change, and it is in A2a's writer enumeration.

### Review queue (as of 06:17 UTC, 13 Nov; updated at each check)

| For | What | Commit on `claude/system-integrity-4.0` | Read first |
|---|---|---|---|
| ~~**Sharon**~~ | ~~Result review of **F1-R1b**~~ **Done: PASS** on `97a40ebb…`, 12 Nov. One page item for Second Eye | — | her record, `claude/gracious-lamport-0m1qjr` `1076f121fc5d6f1e2414d190f20cf9b6c1be258f` |
| ~~**Sharon**~~ | ~~L1-F4's fix~~ **Done: PASS** on `7e42db9690486e82aab45dcdc4fc1ea5ebb68945`; A1 and A2 closed | — | same record |
| ~~**Sharon**~~ | ~~The eight-operation inventory~~ **Done: accepted.** Her condition before A2b is met; nothing goes to the owner; the three questions are answered in her file | — | `A2B-INVENTORY-55fb9b9b….md` on `claude/gracious-lamport-0m1qjr` at `a809058bbc2dfd6b0aea0b92f98e77e8901c3dbf` |
| ~~**Sharon**~~ | ~~A2a's page, pre-build review~~ **Done: PASS on the design, with four changes the page must carry.** **A2a is still not built** | — | `A2A-PREBUILD-55fb9b9b….md` on the same branch |
| ~~**Daisy**~~ | ~~Short check of her three F1-R1b items and the certificate count~~ **Done: both accepted** (`04f689483732d7da8eae6076da842d643a157cd1`, `3a63a2b2158ea4834c1f12653c864baf157c0dd5`) | — | her record at `2ca5794ddde95897d8b0951c174356ccad59052d` |
| ~~**Daisy**~~ | ~~One refusal line for a refused reopen~~ **Done; final.** Second Eye: it is in `ANONYMISED-PERSON-IS-TERMINAL.md` §0 item 11 | — | her `KATA-L1-F4.md` §3 at `2ca5794ddde95897d8b0951c174356ccad59052d` |
| ~~**Sharon**~~ | ~~Result review of **B2**~~ **Done: PASS on `bfe949b11935763a8c8ed7b91f4adcdbcea93645`** (confirmed after both runs ended green) | — | her record, `claude/gracious-lamport-0m1qjr` `62d52a22d2939137d789ed0ea2637e5c3ffe54ff` |
| ~~**Daisy**~~ | ~~**F1-R1b's** screens~~ **Done: PASS** on `97a40ebb…`, 12 Nov | — | her record at `a13f30ff4fe0bd53727d7af219068d35d0b1b0ae` |
| ~~**Daisy**~~ | ~~**L1-F4** wording~~ **Done: PASS** on `ea3c4b6f…`, 12 Nov | — | same record, §2 |
| ~~**Daisy**~~ | ~~B2, one visit~~ **Done: BLOCKED on one item** (the completeness notice's layout) at `bfe949b11935763a8c8ed7b91f4adcdbcea93645`; all else passes, S-1 included. Next: one screenshot of the fix | fix commit, when pushed | her record at `42683a7134a83feaeed389906512ba895e9f2fe9` |
| ~~**Daisy**~~ | ~~B2's fix: one look~~ **Done: PASS** on `546d9eb75abb53d41523750e7134cc83889d1089` | — | her record at `9f984fa42c3804db8fc7b92006fd7149c35e411f` |
| ~~**Second Eye**~~ | ~~B2's fix~~ **Pushed** at `546d9eb75abb53d41523750e7134cc83889d1089` | — | — |
| ~~**Sharon**~~ | ~~B2's fix: the delta~~ **Done: PASS** | — | her record on `claude/gracious-lamport-0m1qjr` at `75b8cc6e0deb267a4f5af96f3be58fcabe40f215` |
| ~~**Second Eye**~~ | ~~F1-R1b page item~~ **Done** in `e27f4a77a10c7c448170bb2851462e4561daadf7`, confirmed from its diff | — | — |
| ~~**Second Eye**~~ | ~~L1-F4 required change~~ **Pushed** at `3a63a2b2158ea4834c1f12653c864baf157c0dd5` | — | — |
| ~~**Sharon**~~ | ~~L1-F2's fix: the delta~~ **Done: PASS** on `9db58dd51aa4f785741bbb2e9fa33c76312b57d5`; the foreign-key point answered (none reachable) | — | her record on `claude/gracious-lamport-0m1qjr` at `156382f908a70618f6c899aca0ffa3a42bf1a315` |
| ~~**Second Eye**~~ | ~~L1-F2's blocker~~ **Fix pushed** at `9db58dd51aa4f785741bbb2e9fa33c76312b57d5` | — | — |
| ~~**Sharon**~~ | ~~A2a's page with her four changes~~ **Done: carried** at `3c46d521a27ae87627d590363b973f5dd7c7c7a3`. **A2a is not built** | — | her branch at `3ad40227b14aee30d8513c5627b7b56c1da0cf79` |
| **Second Eye** | **Part 2: the corrected checkpoint script, one commit, to Sharon's final list, on a branch from `main` at `40ca971ff0d7fd4009a9b822616ee21091027f6a`** (the merge of pull request 19; its tree equals the boundary). Only the script, its workflow, its page and `preservation.sql`. Full pre-flight; push that branch; tell the Chief Architect its hash and stop: he dispatches its CI and journeys. The work branch is restarted from `main` for what is not yet merged (A2b's page) | — | `STAGING-CHECKPOINT-BEFORE-A2A.md` §3h, §3i, §4 |
| **Sharon** | **One confirmation, now:** does your block on `a33c852877686bdd54353c63dfcd995e1c902110` bear on the promotion itself (the migrations, the rollback, the preservation query), or only on dispatching the checkpoint script? In writing, on your branch. Then the confirmation of the corrected script against your list, when it is pushed | `a33c852877686bdd54353c63dfcd995e1c902110` | `STAGING-CHECKPOINT-BEFORE-A2A.md` §3i |
| **Daisy** | **Staging is at 244 now.** If a browser can reach it: one look at the promoted screens (B1's reader, B2's print, the key-correction screens), **reading only: create, change and print nothing with a reference** until part 2 is done. Say which build the app shows, if you can see it | staging | `STAGING-CHECKPOINT-BEFORE-A2A.md` §4 |

### For Second Eye, from Daisy's review of `97a40ebb…` and `ea3c4b6f…` (non-blocking; one commit, with L1-F2 or sooner)

Her record: `ux-1/daisy-experience` at `a13f30ff4fe0bd53727d7af219068d35d0b1b0ae`,
`docs/coordination/ux/completion-4.1/TINJAUAN-F1R1B-97a40ebb.md` §1c and §2. Take the exact lines from there.

1. English «Misunderstanding» in three lines (`soal.tak_terkait`, `laporan.komposisi.keliru_kosong`,
   `studio.kunci.dampak.penjelasan_hilang`); Indonesian unchanged.
2. The teacher's per-question marker shows only when at least one answer in that view landed on an unlinked wrong
   option. In Studio, "any wrong option not linked" stays. F13-K24 and its plant follow the meaning in each place.
3. Her wording for the held step, `studio.konten.kode.content_rationale_owed`.
4. L1-F4: the shorter cell line for "earned but not issued"; her line for the refused certificate replacement.
5. **A correctness check, not wording:** the summary «… {n} sertifikat baru dapat diterbitkan» above the impact
   table must not count a certificate that will not be issued to an anonymised person. Verify with a test; if it
   counts it today, that is a defect in L1-F4 to correct before its acceptance.

### Register addition (Chief Architect, 16 Nov, at A2b's batch 2)

| # | Finding | Disposition |
|---|---|---|
| A2B-R1 | Daisy's B1 proposes the same five-reason list (RUTIN … LAINNYA) for the emergency form too. The two extra emergency codes, KEAMANAN and INTEGRITAS, were Second Eye's proposal in his batch 2 plan, not Daisy's (*attribution corrected 16 Nov at Daisy's request*). THE PLAN §5.3 D2 is the scheduler's list for PLANNED windows, and A2a's `stop_pintar_now` is accepted on staging | **Deferred, not refused.** A2b codes PLANNED rows only; EMERGENCY keeps free text, with a test pinning `stop_pintar_now`'s signature. A candidate for a later batch, with its own decision (Bob) |
| A2B-R2 | Second Eye's S-1 sweep (16 Nov): `withdrawDistributionAction` (`src/app/studio/actions.ts:328`) reads `release_distributions`, which the session role cannot select, so its context check fails open (the database still authorises). `src/app/studio/kanonik/page.tsx:91` reads the same table, so its list of active distributions can only be empty and «Tarik izin» may never be offered | **Placed in C2w, its first item** (C2w is the next batch and works in Studio): a controller-only read, fail closed, red first; the Kanonik display defect confirmed on screen and fixed. Until then A2b's static rule carries it as a named exception (file and table). Owner: Second Eye (Bob) |
| A2B-R3 | The root: `sasaranDalamKonteks` (`src/lib/konteks-server.ts:197`) treats "no school read" as "in context", so any context check fed by an empty read fails open; about 38 `sekolahDari` callers | **Sharon assesses it for Z's register triage:** whether any caller can be fed an empty read in practice, and whether a fail-closed default is safe for all callers. Not built in A2b. If not a Z blocker, it goes to the post-4.1 rationalisation audit (Bob) |
| A3-R1 (Sharon N-5, `a58eae49`) | **On `main` and staging since 9 Nov** (migration `20270113140000`, Sharon F1–F6). **Not on production,** which is still at migration 111 from September and untouched by 4.0 and 4.1 (`STATUS-2026-11-13.md`). *Corrected: first recorded as "latent since 4.0".* `start_learning_session`'s attempt lock is keyed per (person, assignment), but since the owner's rulings of 9 and 10 Nov `may_start` counts attempts per definition and version across assignments (school and year). Two concurrent starts on two open assignments of the same assessment can therefore both pass the attempt limit. The rare case: one learner, two open assignments of one assessment, two starts at the same moment. The effect is one extra attempt; no data is lost | **Fixed in A3** (the start path is A3's): re-key the lock to (person, definition, version), red first with a two-assignment race, with the assignment share lock taken before the key read and the advisory lock (Sharon `5ac3645d`; her earlier immutability condition is withdrawn). **The key's columns wait on an owner product rule:** whether a key correction gives a fresh attempt. It reaches production only with A3's release, under the owner's authorisation, like the rest of 4.1 |
| A3-R2 (Sharon, `c9d7c9d2`) | The sibling of A3-R1: `minta_percobaan`'s grant is keyed per assignment, while the attempt count spans assignments | **Moved into A3** (Sharon `561bcf9d`): under ruling 46 a per-assignment grant is a dead end, because a learner at the lineage limit cannot request on a new revision without a sitting there. So grants span the lineage. An approved request is not a "reset" under ruling 46 |
| A3-R3 (Sharon, `a1b66843`) | **Lock-order ranking of the assignment tables.** Rank `learning_assignments` and `assessment_assignments` in A2A-L01. Then reorder `akhiri_penugasan`, both moves, `tegaskan_koreksi_kunci`, `assign_release` and `minta_percobaan` to persons → fence → learning → assessment. Ranking the two tables exposes **23 existing lock-order violations**, which are hidden today because the tables are unranked | **For Z's register triage.** For A3, Sharon rules a pairwise check instead, with one condition: a sweep proving no function takes persons FOR UPDATE (or deletes or key-updates it) while it could wait on an assignment or a sitting. If one does, it is a real deadlock and becomes an A3 red test |
| A3-R4 (Sharon `561bcf9d`) | **A lock cycle.** `issue_institutional_id` holds institutions FOR UPDATE and then waits for the person. A start holds the person and then, through its sitting's foreign key, needs KEY SHARE on the institution. **Exposure:** staging, where the start takes the person lock (A2a's fence, 4.1). At production's migration 111, the last `start_learning_session` (`20260929100000`) takes no person lock, so the cycle cannot arise there. **Confirmed by Sharon (`343859fe`):** at 111 every persons lock is a foreign key's KEY SHARE, and those are mutually compatible. The exposure starts in 4.1, with A2a's person lock and A1's persons FOR UPDATE takers | **Fixed in A3, red first** (F37-R06), most likely with FOR NO KEY UPDATE on institutions |
| A3-R5 (Sharon `4d6965cc`) | **A second lock cycle on the school record.** Suspending a teacher while granting that teacher a role can deadlock through the last-administrator guard's institutions FOR UPDATE (`20270113170000`). **4.1 only: staging, not production** | **Fixed in A3, corrected by Sharon (`9e6688d0`):** FOR NO KEY UPDATE alone does not break the cycle with school-ID numbering. The last-administrator guard now serialises on a per-school advisory key, with no row lock on the school, which keeps SI-D03's school-then-person order for the import. The last-administrator guarantee is proven again under the new key. Pin 2's other two exceptions (`confirm_my_name`, `handle_new_auth_user`) become person-first, red first |
| REH-1 (rehearsal run 44008372954) | **Probable defect.** A sitting that is already EXPIRED at 111 but has never been scored stays unscored after the upgrade. `20270114100000` adds `closure_kind` with no backfill, and A1's closer and the lazy check finalise only EXPIRED sittings whose `closure_kind` is DEADLINE or WINDOW_CLOSED. A sitting past its deadline but still IN_PROGRESS is closed and scored correctly | **Sharon to confirm,** then fix red first (likely a backfill of `closure_kind` for EXPIRED, unfinalised sittings, or the closer accepting a null kind). **Production holds 0 sittings (stage 2, 17 Nov), so there is no release-day exposure;** it is still to be fixed for correctness. **Sharon CONFIRMED it (`da1dd8c5`):** at 111, `session_enforce_deadline` sets EXPIRED and never scores, and 4.1's closer scores only the sittings it marks. **Placement: Z,** as a data migration in the production release candidate. **Default (Sharon's option i):** mark such sittings DEADLINE with `closure_deadline = authoritative_deadline`, so the closer scores them on their recorded answers, audited per sitting. It is built red first on a rehearsal fixture; rows with no deadline are counted separately. **No owner decision is needed now:** production holds 0 such sittings. The release-day stage 2 rerun must read 0, or the choice between i, ii and iii goes to the owner |
| REH-2 (rehearsal) | Every existing email account, staff and learners alike, starts REQUIRED in `account_setup` (`20261021100000`, by design), so every production user meets the setup step at their next sign-in | **A release note,** plus the owner's awareness; not a defect |
| REH-3 (rehearsal) | Since `20270113160000`, `verify_certificate` dates a certificate on the school's clock, so a certificate issued between 17:00 and 24:00 UTC now shows the next day publicly. No row changes | **Sharon and Daisy:** intended, or should old certificates keep their issued date? Stage 2 counts them. **Sharon (`da1dd8c5`):** intended for new certificates. For WITA and WIT schools, a certificate issued just after local midnight would differ from its print. **Moot on production,** which holds 0 certificates. The release-day stage 2 rerun counts any whose date differs between the two zone rules; above 0, the owner chooses |
| REH-4 (rehearsal) | Four migrations refuse to apply over certain data shapes: `20261202100000` (an option naming another school's misconception), `20270112160000` (two live enrolments in the same school, year and programme), `20270113110000` (two sealed replacements of one certificate) and `20270112210000` (two promotion audit rows sharing a run id). Separately, `20261113100000`'s QUICK guard refuses if any ELIGIBLE unsigned QUICK certificate exists | **The guards work as designed. Production trips none:** every guard reads 0 (stage 2, 17 Nov) |

### Register additions (Daisy, 12 Nov; all predate this work; before Z)

| # | Finding | Disposition |
|---|---|---|
| X-1 | A refusal inside Studio renders two `<main id="isi">` (two main landmarks, a duplicated skip-link target) | Accessibility; small; before Z, Daisy verifies |
| X-2 | **Corrected by Daisy (13 Nov):** under `/belajar/[tugas]/`, only the main page and «lanjut» check that the id belongs to the learner. Six sub-pages do not, so a wrong or foreign id there shows the generic error page with a reference code. A key correction does **not** move the assignment. *(Superseded, kept: "after a key correction moves a class's assignment, a learner opening an earlier link gets the generic error page"; and the Chief Architect's note that it was a consequence of C1w, which it is not.)* | Design note ready: `X2-CATATAN-DESAIN.md` (`ux-1/daisy-experience` at `b5cde1ab7dc19bf9bc05297874fb3cb437126b8a`): one ownership guard for the section, answering «not found», never telling "not yours" from "does not exist". Sharon reads the note (it is an access check); then a small commit, before Z |
| X-3 | An unknown correction id at `/studio/tinjau/kunci/{id}` shows "not allowed" where it should show "not found" | Minor; before Z |
| X-4 | A Konfigurasi sub-page shows a shorter navigation than the Konfigurasi index, at every width: the platform admin loses «Keamanan akun», «Kirim email uji» and «Sertifikat sekolah»; a school admin loses «Keamanan akun» and «Sertifikat sekolah». From the sub-page shell that also names the bar «Pendataan». Not S-1 (Daisy, `S1-PRA-97a40ebb.md` at `15e1d39477458a0fe9f5563ede0d397cc1d60b15`) | Fix with the «Pendataan» item in the 4.1 consistency pass (Z); Daisy verifies |

**What may close without the owner:** a correction or a batch closes when its reviewers have passed its exact commit,
CI and journeys are green on it, and the Chief Architect's boundary check is met. **B2 may close on those terms.**
**The owner authorized the staging checkpoint on 12 Nov** (`STAGING-CHECKPOINT-BEFORE-A2A.md`); **A2a is released only when it passes.** *(Earlier wording, kept:)* A2a does not start until the staging checkpoint has been considered by the owner (Addendum 1, condition 3): after
B2 and the corrections, the engineer continues with L1-F2, L1-R2, the race test and the A2b inventory, and prepares
A2a's completion page for Sharon's pre-build review, but does not build A2a.

## The owner's instruction of 11 November 2026 on the execution phase (recorded 12 Nov, on Sharon's check)

This instruction was acted on from the day it was given but had not been written into any record. The owner's words:

- "Your B1 closure recommendation is accepted. Please proceed with formal B1 closure and ensure its completion record
  accurately reflects Sharon's and Daisy's PASS verdicts."
- "I also approve your recommendations: 1. L-1 before F-1. Your security-based prioritization is justified. Both
  corrections remain separate, independently verified passes. 2. Controlled staging verification of L-1. Authorized
  using a synthetic account only. Do not alter real user accounts or production. 3. Shared mobile drawer correction
  (S-1). Approved as bounded 4.1 consistency work, with Daisy's verification."
- "Staging promotion is NOT yet authorized."
- "You are the Chief Architect. Please take ownership of the next execution phase." With: issue the necessary task
  prompts to Second Eye, Sharon and Daisy; give each the correct branch, full 40-character commit, scope, acceptance
  requirements and reporting expectations; ensure all review instructions are accessible to their recipients;
  coordinate the sequence and dependencies; track completion and resolve routine issues within approved scope;
  "escalate only material decisions, blocked dependencies or actions requiring additional authorization."

> **Owner's confirmation, 12 November 2026 (08:06 UTC).** The owner approves **the substance** of the decisions
> recorded in this passage, as of today. The owner has **not verified the quotations word for word**: they are the
> Chief Architect's record, copied from the conversation in which they were given. The rulings that rest on them
> stand on today's approval of their substance, not on the exactness of the wording.

## State

| Item | State | Commit |
|---|---|---|
| B1 | **Closed.** Sharon PASS, Daisy PASS, CI `43110782265` and journeys `43110786290` green | `1fc719b5127313bf24084695fa30d7505e15b5d1` |
| L-1, suspended sign-in correction | **CLOSED. Sharon PASS** (12 Nov). Residual L1-R2 goes with L1-F2 | `916d12c01345816afcf567b40131e72b9857cf65` |
| F-1, C1w correction pass | **CLOSED. Sharon PASS** (12 Nov). Remaining with Daisy, not a gate: the learner's disclosure and any wording for an absent explanation | `bc67f72a0e1c6bc39a2c16292f728080b12710d4` |
| L1-F2, a suspension covers accounts created after it (with L1-R2) | **CLOSED.** Sharon PASS. CI green on the commit; journeys job B green on the descendant `b24d73ffd0e84b139a02fe26f52fa21c52a94a25` (see the brief, §0 item 10, for exactly what ran where) | `9db58dd51aa4f785741bbb2e9fa33c76312b57d5` |
| L1-F4, an anonymised person is terminal | **CLOSED.** Sharon PASS; both race tests pass; Daisy's refusal line in word for word at `049e21ad1875b399a4ed2111897dbda8b14cf1d2` | `7e42db9690486e82aab45dcdc4fc1ea5ebb68945` |
| F1-R1b, a key correction clears stale explanations | **CLOSED.** Sharon PASS, Daisy PASS, CI `43189210169` and journeys `43189229437` green; page evidence filled. Register: F1R1B-R1, F1R1B-R2 | `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b` |
| S-1, phone drawer overflow | **CLOSED. Daisy PASS** on `bfe949b11935763a8c8ed7b91f4adcdbcea93645` (drawer at 390 and 320 px; desktop sidebar at 1280 and 1100 px) | `61a6dd3b19761dfc91e11ac4f9e0295b64a32c6e` |
| B2 | **CLOSED.** Sharon PASS, Daisy PASS, runs green. Register: B2-R-S1 | `546d9eb75abb53d41523750e7134cc83889d1089` (on `bfe949b11935763a8c8ed7b91f4adcdbcea93645`) |

Work branch: `claude/system-integrity-4.0`. Briefs and records: this branch, `docs/completion-4.1/`.

## Second Eye

1. **Record B1's close.** `docs/completion-4.1/batches/B1-COMPLETION.md` still says "pre-build PASS, released for
   build". Add the result: closed on `1fc719b5127313bf24084695fa30d7505e15b5d1`; Sharon PASS (two governed
   limitations, one accepted exception); Daisy PASS (her record on `ux-1/daisy-experience` at `c3ab4eac`); CI and
   journeys run ids; the register B1-R1 to R5 going to B2. Documentation only; it may ride with the next commit.
2. **L-1 (in progress).** Brief: `AUTH-SUSPENDED-SIGNIN-CORRECTION.md`. Your reading of the one conflict is right:
   Sharon's condition governs; the accountability event records `MASUK_TIDAK_COCOK`. Three additions:
   - **Per method (added 12 Nov, from Daisy):** "the same as a wrong password" means each method's own ordinary
     mismatch (`MASUK_TIDAK_COCOK`, `CARD_NOT_MATCHED`, `PIN_TIDAK_COCOK`, and the code and link-request routes'
     own), in the response and in the accountability event. `PIN_DITANGGUHKAN` stays as it is. Brief §3.2.
   - **Staging has no locked account** (read-only check, in the brief §2). The rewrite migration must therefore be
     correct on a database with none, with some, and when run twice.
   - **State on the page whether the core change** (lock value, rewrite, route answer) **depends on any 4.1 object,**
     and keep the B1-A04 assertions separable from it. This keeps a narrow correction of `main` possible; it is not a
     request to build one.
   - **Do not suspend or close any account on staging,** and do not run the hosted test. It is deferred to the first
     promotion that carries this correction.
   When the full pre-flight is green and pushed: give the owner the 40-character commit for Sharon and Daisy.
3. **F-1.** Brief: `C1W-F1-CORRECTION.md` (§8 impact list, §9 brief). Starts when L-1 is pushed for review; it does
   not wait for L-1's verdict, because the code is independent. Its own commit; Sharon's review on that commit. If a
   screen changes (row 2, the key shown to the teacher), say so on the page so Daisy is asked.
4. **S-1.** The open phone drawer is 8 px wider than the screen on every Konfigurasi page (Daisy's review of
   `1fc719b5`, §2b; look first at `.pin-staf .pin-laci { width: 100% }` inside the fixed
   `.pin-staf[data-laci="buka"]` in `src/app/experience.css`). Required: the open sheet is no wider than the
   viewport; it keeps the 16 px gutter; the focus ring is whole at 320 px. Its own small commit, after F-1 and before
   B2's candidate, with the rendered check at 390 and 320 px on three different Konfigurasi pages, because it is a
   shell change: ask what else it changed. Daisy verifies it together with B2, in one visit.
5. **B2** opens when L-1 and F-1 both have Sharon's PASS. It takes B1-R1 to R5 (`B1-ARCHITECT-CHECK.md` §13) and the
   print step of §8.5 journey 4.
6. **Every page** carries the cross-module inventory and the next-state row (`SYSTEM-INTEGRITY-4.1.md` §2, §3a).
   **Report** at each push: the 40-character commit, the pre-flight figures, the CI and journeys run ids, and any
   limitation.

## Sharon

1. **L-1, when its commit is given to you** (one review, on that exact commit). The brief is
   `AUTH-SUSPENDED-SIGNIN-CORRECTION.md`; the engineer's page is
   `docs/completion-4.1/batches/AUTH-SUSPENDED-SIGNIN-COMPLETION.md` on the work branch. Please verify:
   - from outside, a suspended, a closed, an anonymised and an unknown account and a wrong password are
     indistinguishable in status, body and wording, for every sign-in method, whichever password is given, and that
     the measured response times do not separate them;
   - a real Auth outage still answers 503;
   - the lock value, every reader of it, reinstatement, and the rewrite of already-locked accounts (none, some, run
     twice);
   - your B1-A04 assertion: the accountability event records `MASUK_TIDAK_COCOK`. **Please confirm the
     reconciliation in the brief §5:** the true reason is kept only in the server log and the suspension's own audit
     record, never in a record a school admin reads;
   - the page's statement on whether the core change depends on any 4.1 object.
2. **F-1, when its commit is given to you:** your six acceptance requirements (`C1W-F1-CORRECTION.md` §5), the
   accessor chosen per view (§9.2), and the classification of the statistics views (§8 row 5). A proposed change to
   a catalogue definition is escalated, not reviewed in.
3. **B2's pre-build review** follows, on its completion page.
4. **Verdicts:** PASS or BLOCKED on the 40-character commit, with how the four questions were answered.

## Daisy

1. **L-1 (changed 12 Nov, 02:20): not a separate visit and not a gate.** Run it together with your F-1 review, on
   the F-1 commit, which contains L-1. The check itself is unchanged: your red-first check. A suspended or closed account's attempt reads
   exactly as a wrong password does, on the sign-in screen and as the reader's row («Email, username, atau password
   belum cocok.»), whichever password is given. Nothing else in the screens should have changed; say so if it has.
2. **F-1: you are needed.** The teacher's per-question screen gains one line naming the original key. On the F-1
   commit, when it is given: what the teacher is shown as the key in force, how the original key is named beside it,
   that a teacher cannot mistake one for the other, and that the screen is otherwise unchanged; at 1280, 390 and
   320 px. Then your L-1 confirmation (item 1), in the same visit.
3. **B2, one visit:** your design input for B2 as planned, plus the register B1-R1 to R5 (wording is yours), the
   completeness notice B1-R4 (platform admin only, qualified, linking to health; no school named), and S-1's
   verification at 390 and 320 px across Konfigurasi pages.
4. **Verdicts:** PASS or BLOCKED on the 40-character commit.

## Keeping instructions current (owner, 12 Nov 2026)

- **One current statement.** For each piece of work, the brief's "what holds now" section and this file's state table
  are what is in force. Anything else is history.
- **Whoever changes a requirement marks the old one where it stands**, as superseded or withdrawn, with a pointer to
  what replaced it. Nothing is deleted: the record of what was asked and when is kept, as PINTAR keeps its own.
- **A prompt or review that has been overtaken is not acted on.** If two instructions disagree, the later one by its
  author wins; if the authors differ, ask before building.
- **The same on each party's own documents:** the engineer's completion page, Sharon's reviews and Daisy's reviews
  each say, at the top, what currently holds.

## Stacked verification for small corrections (owner, 12 Nov 2026: approved with safeguards)

- Up to **three genuinely independent** small corrections may share one full pre-flight, CI and journeys run on the
  exact combined candidate (the top commit of their stack).
- Each keeps its **own commit, red-first evidence, impact assessment and review** on its own commit.
- **The combined candidate must be green before any of them is accepted.** On a failure, isolate and re-run.
- **Never** for a batch, and never for corrections that touch the same code or depend on each other.
- The engineer states on each page which commits were verified together and on which candidate.

## Before any correction is built (owner, 12 Nov 2026)

- **A short design review by Sharon first,** however small the correction.
- **The impact analysis names, for every column and table touched, its constraints and the baseline invariant that
  governs it** (`docs/rebuild/03-PINTAR-INVARIANTS.md`), not only the callers and readers.

### The owner's principle (13 Nov 2026), for everyone

> **Think thoroughly before building. Build carefully. Verify rigorously.** All three matter. None replaces the
> others. The objective isn't to eliminate mistakes entirely; that's unrealistic. It's to stop making mistakes we
> could reasonably have anticipated.

Why, in the owner's words: prevention is often considerably cheaper than cure. At roughly one hour per commit, every
foreseeable defect caught during planning saves a correction and verification cycle.

What it means in practice:
- **Think:** the five questions below are answered on the page before a build, and in every brief.
- **Build:** unchanged. Red first; one concern per commit; the full pre-flight before every push.
- **Verify:** unchanged. Both reviewers on the exact commit, CI, journeys, the boundary check. **Thinking earlier
  removes no check.**
- **How we will know:** at each result review, a defect is marked "could reasonably have been anticipated" or not,
  with which of the five questions would have caught it. The count is reported to the owner at each batch's close.

**The baseline (12 Nov 2026; Sharon's `ANTICIPATION-2026-11-12.md`, `claude/gracious-lamport-0m1qjr` at
`3d6849b5e341323ce69d357bbb4bcac2940dd1ab`).** Her reviews found **nine** defects that day. **All nine could reasonably have been
anticipated.** By question: locks and their order, 4; the opposite and neighbouring act, 2; what else reads or writes
the state, 2; before from after, 1; who runs each check, 1 (one defect counts under two questions). Three trace to
her own designs, by her account.

**Daisy's record (`ANTISIPASI-4.1.md`, `ux-1/daisy-experience` at `7e52ceed6234f91d9247d582bac7a2beb950a10b`):
eight** defects in her reviews, **all anticipable.** B2: the notice at 320 px (question 5) and the context refusal
blaming the account (question 2). F1-R1b and L1-F4's wording: six, by questions 1, 2 and 5; three were in her own
lines, by her account. Older problems (L-1, S-1, X-1, X-4) are listed there and not counted against these batches.

**The Chief Architect's own, in neither record: two.** INV-03 missed in his brief (question 1), and the checkpoint
page that had him signing in to staging (question 5).

**13 Nov, so far (the checkpoint's own preparation): 8 anticipable, 2 not.** Seven found by Second Eye's local end-to-end run (5 anticipable: questions 1, 2, 5, 5, 5; 2 not), one in Sharon's reading of item 4 (question 1, by her account), one found by Sharon in the script (no clean-up on a stop: question 2), and the Chief Architect's read that missed it (question 2). All ten were caught **before staging was touched.**

**13 Nov, added since:** four more in the checkpoint's preparation, all anticipable: a cancel or timeout bypassing the clean-up (question 5); a password recovery against the preservation fingerprint (question 1; the Chief Architect asked for the recovery to be recorded and did not connect it to the fingerprint); the app's build never checked (question 5); and two runs cancelled by a push to the same branch (question 3, a lock: the workflows' concurrency group; the Chief Architect's sequencing). A2b's page, reviewed before any build: three points found at the design stage.

**So the baseline for 12 Nov is nineteen defects, all of which could reasonably have been anticipated.** *(The "six"
below, and an earlier "twelve" here, understated it.)* By question: 1, what else reads or writes: 7. 2, the opposite
or neighbouring act: 4. 3, locks: 4. 4, before from after: 1. 5, who runs it and where it renders: 4 (one defect
counts twice). Reviewers' own errors of checking, not counted as defects: the Chief Architect's read that found no
lock cycle, and Daisy's statement that no learner screen showed a rationale; both are question 1. A2a's 28 readers and its fence order were
found at the design stage, before any build, which is what the questions are for.

### Five questions the design review answers before a build (Chief Architect, 13 Nov 2026; on the owner's question)

The owner asked whether we anticipate as well as we detect. On 12 Nov we did not: six defects were found after the
build, and each was visible from the design. They share one cause: **the design looked at the new thing, not at
what already touches the same state.** These five questions go **inside the existing design review**. They are not a
new gate and need no new document; the page answers each in a line or two, and Sharon checks the answers.

| # | Question | The 12 Nov defect it would have caught |
|---|---|---|
| 1 | **What else reads or writes this state?** Listed from the catalogue or the code, not from memory | L1F4-A2: "a deleted person is terminal" was designed without the reopen path. F1-R1b: INV-03's NOT NULL |
| 2 | **What is the opposite act, and the neighbouring one?** Delete and reopen; suspend and reinstate; lock and reissue | L1F4-A1: a deletion racing a reopen |
| 3 | **Which rows does it lock, in what order, and who else locks them?** Including locks taken by triggers on tables it inserts into | L1-F2's cycle, and the three functions and the Auth write with the same one |
| 4 | **How is "before" told from "after"?** By a lock or a record, never by two clocks | L1-F4's timestamp comparison |
| 5 | **Who runs each check, with what access, and where does it render?** | The checkpoint page that had the Chief Architect signing in; B2's notice, checked in source but not at 320 px |

The Chief Architect answers the same five when writing a brief. Two of the six defects were in his briefs.

**The owner (13 Nov 2026):** *"Good diagnosis, Bob. Apply the five questions rigorously. Let's see fewer avoidable
correction cycles, without weakening any verification gates."* No gate is removed or shortened by them.

## Relay rules (after the 38-character SHA and the unreadable prompt file)

- A commit is always given as 40 characters, copied from `git rev-parse`.
- A review instruction is either in this file or pasted in full. A file on a branch the recipient cannot read is not
  an instruction.

## Log

| When (UTC) | Issued |
|---|---|
| 11 Nov 2026, 23:58 | First issue: B1 close record; L-1 additions; F-1; S-1; B2 opening rule; reviewers' checks |
| 12 Nov 2026, 00:10 | L-1: the indistinguishable answer is per method (Second Eye, Sharon). Daisy's L-1 checks: `ux-1/daisy-experience` `f6bc7aa1d50c9a8179fecd4044a7a631bb57f937` |
| 12 Nov 2026, 00:15 | L-1, Second Eye: state on the page that the platform admin's reader also shows the ordinary mismatch for suspended or closed attempts, by intent (Sharon). Reconciliation of the brief §5 confirmed by Sharon |
| 12 Nov 2026, 01:45 | L-1 candidate `2ea60c85e4f855eca2175749c4270a170922ee33`. Sharon: also rule on the engineer's question (a pre-suspension recovery grant used after it) and see the two consequences in `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6a. Daisy: same commit |
| 12 Nov 2026 | L-1 with Sharon (prompt issued by the engineer; she should also read `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6a at this commit of the planning branch). Daisy: one visit on the F-1 commit covering F-1's teacher screen and her L-1 confirmation. F-1 built locally at `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49` |
| 12 Nov 2026 | Second Eye: L-1's one blocker, `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6b (two permit checks, three red-first tests, one bounded search, the PIN-ladder note on the page). Do not disturb F-1's pre-flight; the fix is a new commit after F-1's. B2 still waits for Sharon's PASS on both |
| 12 Nov 2026 | Second Eye: `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6c. The two checks at use are required; ending grants in `akun_kunci` is optional. State on the page the PIN-ladder consequence and the two reinstatement cases. Register L1-R1 (showing "PIN reset required" at reinstatement) is not in L-1 |
| 12 Nov 2026 | All: the rule on keeping instructions current (above). L-1's current statement is `AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §0 |
| 12 Nov 2026 | State table corrected (Daisy noticed it was stale): F-1 is pushed at `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`. Sharon: `C1W-F1-CORRECTION.md` §9a, two points to rule explicitly (rows 5a and 5b). Daisy: the one added line, and the L-1 confirmation |
| 12 Nov 2026 | L-1 fix local at `916d12c01345816afcf567b40131e72b9857cf65`. Finding L1-F2 recorded (`AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6d): not in L-1; Sharon to give her view on the choice at the recheck; decision is the owner's |
| 12 Nov 2026 | Sharon: pre-implementation review of `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §2 (place of the lock, no authentication window, reinstatement) and her view on §5 (closed person). Second Eye: nothing to build yet; report what happens today for §5 when convenient |
| 12 Nov 2026 | Second Eye: L1-F2 is released, `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §0 and §2a (one trigger on `public.accounts`; `FOR SHARE` on the person first; a guard on `banned_until`; six tests). Also report what happens today for a closed and an anonymised person (§5, §5a). After the L-1 fix; not before B2 if B2 is ready first |
| 12 Nov 2026 | Second Eye: `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §5b. Build the lock trigger as released. Before touching messages or matching, report the three items at the end of §5b (which paths send a message and what the school sees; what an institutional number can match after anonymisation; one test each of today's behaviour) |
| 12 Nov 2026 | Second Eye: P-1 needs only its guarding test, taken with the lock trigger. L1-F4 is with the owner; build nothing for it; the three tests of today's behaviour are still wanted, as evidence |
| 12 Nov 2026 | Sharon: pre-implementation review of `ANONYMISED-PERSON-IS-TERMINAL.md` §2 and §3 (four points from the owner). Second Eye: nothing to build for it yet; P-1's guarding test goes with the lock trigger |
| 12 Nov 2026 | Second Eye: L1-F4 released, `ANONYMISED-PERSON-IS-TERMINAL.md` §0 and §3a. Order of the small corrections after the L-1 fix is yours; none gates B2. Daisy: wording for the platform admin's refusal when a deletion meets a live attachment (one line, when the engineer asks) |
| 12 Nov 2026 | Second Eye: L1-F4's certificate case is decided (`ANONYMISED-PERSON-IS-TERMINAL.md` §0 item 6 and §3b): earned but not issued, recorded on the review; no certificate row. Daisy: if the review screen shows this state, its wording is yours |
| 12 Nov 2026 | Second Eye: Daisy's wording is in `ANONYMISED-PERSON-IS-TERMINAL.md` §3c. Use the refusal line as final; use the review line as draft and send Daisy a screenshot or the commit for her one-reply confirmation. State on the page the holding state (an open deletion request with a live attachment) |
| 12 Nov 2026 | F-1 with both reviewers. Sharon: also rule explicitly on row 5a (`item.correctness_rate`, Question Health), `C1W-F1-CORRECTION.md` §9a and §9b. Daisy: in the same visit, see what a corrected question shows where a rationale is displayed (F1-R1, §9b) |
| 12 Nov 2026 | Second Eye: F-1's one blocker, `C1W-F1-CORRECTION.md` §0 items 1 and 2 (null rationale in `session_review` where correctness changed; three tests and a plant). A new commit, after the L-1 fix or before it as the working tree allows; each is rechecked alone. Daisy: say whether the learner's review should explain the missing rationale, and give the wording if so |

> **Correction to this log (12 Nov 2026, 03:45 UTC, read from the clock).** Entries dated 12 Nov after 01:45 UTC carried times that were estimated, not read from a clock, and several were later than the actual time. Those times have been removed. The order of the entries is correct.
| 12 Nov 2026 (03:50 UTC) | Sharon: pre-implementation review of `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §2 and §3 (row 1 is the owner's question). Daisy: the wording of its §6; and, for F-1's fix, open the per-question disclosure on the learner's result for a corrected sitting. Second Eye: nothing to build for it yet |
| 12 Nov 2026 (03:53 UTC) | Second Eye: F1-R1b released, `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §0 and §3a; after F-1's fix. Daisy: its §6, where line 3 is now required: "no recorded misconception" wherever a misconception figure or list is empty or thin, and the marker's wording |
| 12 Nov 2026 (05:44 UTC) | State table brought up to date from the work branch (head `bc67f72a0e1c6bc39a2c16292f728080b12710d4`). Second Eye: CI needed a second attempt on two commits today; if the cause is again the runner failing to start its database, say so, and treat a third as a defect of the workflow to fix at its cause, not to re-run |
| 12 Nov 2026 (05:47 UTC) | Second Eye: your INV-03 question is answered in `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3b: it is the owner's decision; keep F1-R1b held. A question for a ruling goes to the owner in full, by name, so it is not missed |
| 12 Nov 2026 (05:49 UTC) | Sharon: `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3c (four points). Second Eye: F1-R1b stays unbuilt until her verification; L1-F4's race test on two connections is required before acceptance (`ANONYMISED-PERSON-IS-TERMINAL.md` §0 item 8) |
| 12 Nov 2026 (05:54 UTC) | Second Eye: F1-R1b released, `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3d (CHECK plus trigger; digest untouched; copy paths with a lineage link; baseline marker first, manifest, ADR in one commit). State how an option is tied to the option it was copied from |
| 12 Nov 2026 (05:56 UTC) | Second Eye: document authority is verified (`C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3e): amend INV-03 in the repository by §3d point 4; the new ADR takes the next number after 0024 and cites ADR-0019. No external copy is to be waited for |
| 12 Nov 2026 (06:03 UTC) | F-1 fix is green. Consolidated status written: `STATUS-2026-11-12.md` |
| 12 Nov 2026 (06:06 UTC) | Second Eye, Sharon: B2's learner own-results print is decided by the owner: the content rule (`B2-ARCHITECT-NOTES.md` §0 item 3 and §1). The transferred learner is the named case of the second test |
| 12 Nov 2026 (06:33 UTC) | F-1 PASS. B2 now waits on two things, both Sharon's: the L-1 fix recheck (`916d12c01345816afcf567b40131e72b9857cf65`) and the pre-build review of B2's page (work-branch head `b21bec621a449e8d4d90ed646f7fb09c15dfc6f9`) |
| 12 Nov 2026 (06:44 UTC) | **B2 is open.** Second Eye: carry Sharon's five changes onto B2's page (`B2-ARCHITECT-NOTES.md` §3), then build B2 under THE PLAN §5.2 with the full pre-flight; the order of B2 against F1-R1b, L1-F2 and L1-F4's race test is yours, but B2 is the batch and should not wait behind them. L1-F2 takes L1-R2. Daisy: the default print line that names no person (Sharon's ruling, item 5), with or without the time; and your B2 design input for the register R1 to R5 and the completeness notice. Sharon: one result review of B2 on its exact commit |
| 12 Nov 2026 (06:48 UTC) | Second Eye: Daisy's B2 wording is in `B2-ARCHITECT-NOTES.md` §4. Make the completeness notice's "last 7 days" and the count function agree; answer her question on failed print writes; record the changed browser line on the page as a deviation from THE PLAN §5.2 F. Daisy: at your B2 visit, S-1 also at the desktop sidebar |
| 12 Nov 2026 (07:26 UTC) | Owner's rulings on the reassessment recorded: stacked verification and the two pre-build rules above; `THE-PLAN-ADDENDUM-1.md` drafted, not effective. Sharon: confirm the A2 split. Daisy and Second Eye: one question each |
| 12 Nov 2026 (07:29 UTC) | Second Eye: Daisy's F1-R1b wording and the two terms are in `C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §6a; no screen string uses «anotasi». Sharon: one question on enforcing a class-scoped planned window on the class's work (`THE-PLAN-ADDENDUM-1.md` §5c) |
| 12 Nov 2026 (07:30 UTC) | **Addendum 1 is effective** (owner). All: read `THE-PLAN-ADDENDUM-1.md`; it is the one current statement of what has been added to THE PLAN and where execution departs from it. A2 is A2a then A2b, with Sharon's three conditions (§5a). No staging action is authorized |
| 12 Nov 2026 (07:32 UTC) | **Owner's ruling R-1** (`THE-PLAN-ADDENDUM-1.md` §5d): planned maintenance is work-scoped; emergency stays person-level. Sharon and Second Eye: the feasibility work listed there (eight points), before any A2b implementation; nothing to build now. R-2: the two terms, for F1-R1b and C2w. Provider evaluation: findings in `C3-EVALUATION-PREPARATION.md`; Sharon to check them |
| 12 Nov 2026 (07:39 UTC) | Owner: R-1 applies to class- and school-scoped planned windows alike (A2b); Sharon's eight answers are the technical direction, subject to Second Eye's inventory before A2b is built. R-3 for C3w's page (`THE-PLAN-ADDENDUM-1.md` §5d). Provider documentation is read in a new session on the `pintar40` environment (`C3-EVALUATION-PREPARATION.md` §6d) |
| 12 Nov 2026 (07:45 UTC) | Sharon: one bounded consistency check of `OWNER-RULINGS-4.1.md` against the governing records (owner's instruction; no approval round). After it, the digest is the team's decision index |
| 12 Nov 2026 (07:46 UTC) | Check: work-branch head unchanged at `b21bec621a449e8d4d90ed646f7fb09c15dfc6f9`. L1-F4's CI and journeys are green on `ea3c4b6f1d10a2a01281f16e8cce893235bfbef2`. F1-R1b not yet pushed |
| 12 Nov 2026 (07:52 UTC) | Sharon's consistency check of the rulings digest: 24 lines matched; the rest corrected. The owner's instruction of 11 Nov on the execution phase, which had been acted on but not recorded, is now recorded above. The digest is the team's decision index |
| 12 Nov 2026 (08:06 UTC) | Owner approved the substance of the decisions recorded as the instruction of 11 Nov, without verifying the quotations word for word. Noted on the three passages that quote the owner |
| 12 Nov 2026 (08:21 UTC) | **Correction:** L1-R2 is not the delete alone. Second Eye: build it to `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §2b (the delete; `for update` on the person's accounts in `akun_kunci`; `for share` on the account row first in both permit functions; three tests; two plants). The earlier line of today, that Sharon's one sentence was the design, is superseded |
| 12 Nov 2026 (08:23 UTC) | Second Eye: L1-R2's delete covers `RECOVERY` and `ACTIVATION` permits only, not `CARD_REISSUE` (`SUSPENSION-COVERS-NEW-ACCOUNTS.md` §2b, "SETTLED"). Card reissue for a locked learner is intended: write it on the page with its one test |
| 12 Nov 2026 (09:53 UTC) | F1-R1b pushed and read (`C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md` §3f). B2 built locally. For B2's reviews: the time zone on a learner's own-results print (`B2-ARCHITECT-NOTES.md` log) |
| 12 Nov 2026 (10:04 UTC) | Owner away; standing instruction recorded at the top of this file, with the review queue. The repository is the team's channel until the owner returns |
| 12 Nov 2026 (10:18 UTC) | Check: Daisy passed F1-R1b (`97a40ebb…`) and L1-F4 (`ea3c4b6f…`); journeys green on `97a40ebb…`. Work-branch head unchanged; B2 not yet pushed. No verdict from Sharon is visible on any branch. Queue and register updated |
| 12 Nov 2026 (10:40 UTC) | Sharon's verdicts are now on `claude/gracious-lamport-0m1qjr` (`1076f121fc5d6f1e2414d190f20cf9b6c1be258f`). F1-R1b: PASS, accepted; one page item for Second Eye; register F1R1B-R1, R2. L1-F4: interim review, one required change for Second Eye, with the race test |
| 12 Nov 2026 (10:56 UTC) | Daisy's early look at S-1 on `97a40ebb…`: no defect, nothing for Second Eye to change first; her verdict still comes with B2's visit. X-4 registered (shorter navigation on Konfigurasi sub-pages) |
| 12 Nov 2026 (11:50 UTC) | Check: no new commit on any branch. B2 still in the engineer's local pre-flight. Staging checkpoint readiness table drafted in `STATUS-2026-11-12.md` for the owner's return |
| 12 Nov 2026 (13:35 UTC) | B2 pushed at `bfe949b11935763a8c8ed7b91f4adcdbcea93645` and read (`B2-ARCHITECT-NOTES.md` §5): no blocker. Sharon: PASS, conditional on its runs. Daisy: your visit is open. Second Eye: next is L1-F2 with L1-R2, the race harness and L1-F4's change; the F1-R1b page item is still owed |
| 12 Nov 2026 (14:18 UTC) | B2: both runs green on `bfe949b11935763a8c8ed7b91f4adcdbcea93645`; Sharon's PASS confirmed. B2 waits only on Daisy's visit |
| 12 Nov 2026 (15:36 UTC) | L1-F2 with L1-R2 pushed at `e27f4a77a10c7c448170bb2851462e4561daadf7` and read: no blocker; with Sharon. F1-R1b CLOSED (page item confirmed). B2 still waits only on Daisy's visit. L1-F4's change is next for Second Eye |
| 12 Nov 2026 (16:37 UTC) | Sharon BLOCKED L1-F2 at `e27f4a77a10c7c448170bb2851462e4561daadf7` on a lock-order cycle (issuer: account then person; suspension: person then account). Second Eye: fix first, per her file, plus the list of paths asked for in `SUSPENSION-COVERS-NEW-ACCOUNTS.md` §0 item 9. B2 still waits only on Daisy |
| 12 Nov 2026 (16:58 UTC) | Three commits pushed, top `55fb9b9b93d75c0d683f8be543f30436246c3be2`: L1-F4's required change (`3a63a2b2158ea4834c1f12653c864baf157c0dd5`), Daisy's F1-R1b items (`04f689483732d7da8eae6076da842d643a157cd1`), pages (inventory, A2a page, evidence). Read; one question to Sharon (L1F4-A1). L1-F2's fix is built locally and found further cycles; not yet pushed |
| 12 Nov 2026 (17:03 UTC) | Daisy BLOCKED B2 at `bfe949b11935763a8c8ed7b91f4adcdbcea93645` on one item (the completeness notice's layout); all else passes; S-1 PASS and closed. B2-R-A1 gets its own line, with a condition. Second Eye: one small fix commit |
| 12 Nov 2026 (17:08 UTC) | Sharon (`claude/gracious-lamport-0m1qjr` at `a809058bbc2dfd6b0aea0b92f98e77e8901c3dbf`): L1-F4 BLOCKED on A1 and A2; the A2b inventory accepted; A2a's page PASS on the design with four changes (no build). Second Eye's order of work set in the queue. Daisy: one refusal line. Reminder to all: read the clock before writing a time; two of today's review files carry times ahead of it |
| 12 Nov 2026 (17:14 UTC) | Daisy (`2ca5794ddde95897d8b0951c174356ccad59052d`): the refused-reopen line is final; her F1-R1b items and the certificate count are accepted as built. She still owes one screenshot of B2's fix |
| 12 Nov 2026 (18:11 UTC) | L1-F2's fix pushed at `9db58dd51aa4f785741bbb2e9fa33c76312b57d5` and read, following each insert into its triggers: no blocker; one point for Sharon. The three commits at `55fb9b9b…` ended green. Next for Second Eye: B2's fix, then L1-F4's fix |
| 12 Nov 2026 (19:43 UTC) | Sharon PASS on L1-F2's fix (`9db58dd51aa4f785741bbb2e9fa33c76312b57d5`). Journeys job B failed on the runner before the database started; log read; re-run of the failed job queued by the Chief Architect (same commit, once). No new work-branch commit: B2's fix and L1-F4's fix still owed by Second Eye |
| 12 Nov 2026 (20:30 UTC) | Work branch at `b24d73ffd0e84b139a02fe26f52fa21c52a94a25`: B2's fix (`546d9eb75abb53d41523750e7134cc83889d1089`), L1-F4's fix (`7e42db9690486e82aab45dcdc4fc1ea5ebb68945`), the runner port fix. CI `43293048714` and journeys `43293054174`, both green on `b24d73ffd0e84b139a02fe26f52fa21c52a94a25`. Sharon PASS on both deltas. **L1-F2 CLOSED. L1-F4 ACCEPTED** (one wording item). B2 waits only on Daisy. Second Eye: Daisy's exact refusal line; A2a's page changes |
| 12 Nov 2026 (21:53 UTC) | A2a's page pushed at `3c46d521a27ae87627d590363b973f5dd7c7c7a3` (page only; not built), for Sharon. Second Eye's only remaining item: Daisy's exact refusal line for L1-F4 |
| 12 Nov 2026 (21:56 UTC) | **B2 CLOSED** (Daisy PASS on `546d9eb75abb53d41523750e7134cc83889d1089`). A2a's page carries Sharon's four changes; not built. Head `3c46d521a27ae87627d590363b973f5dd7c7c7a3`: CI `43308672713`, journeys `43308678595` green. All nine boundary rows read Yes; the proposal for the owner is in `STATUS-2026-11-12.md`. One item left: Daisy's exact refusal line for L1-F4 (Second Eye) |
| 12 Nov 2026 (22:00 UTC) | **The owner authorized the staging checkpoint** (words in `STAGING-CHECKPOINT-BEFORE-A2A.md` §0). Promotion is a pull request into `main` that the owner merges. Second Eye: the wording line and the promotion evidence. Sharon: review them. A2a is released when the checkpoint passes; no production action |
| 12 Nov 2026 (22:06 UTC) | Owner: the staging-checkpoint pull request is authorized once the boundary commit, Sharon's review, pre-flight, CI, journeys and the read-only preconditions are complete; no staging mutation before the merge; Sharon must confirm the scratch-target restore; A2a held until the checkpoint passes |
| 12 Nov 2026 (22:08 UTC) | Sharon corrected the checkpoint's six checks before anything is built on them, and confirmed the scratch-target restore satisfies §5b with four conditions (`STAGING-CHECKPOINT-BEFORE-A2A.md` §3a). Second Eye builds the preconditions page on her reading |
| 12 Nov 2026 (23:25 UTC) | **L1-F4 CLOSED:** Daisy's exact line is in at `049e21ad1875b399a4ed2111897dbda8b14cf1d2`. Every item of the boundary is now closed. Second Eye is building the promotion evidence; rulings on its open points are in `STAGING-CHECKPOINT-BEFORE-A2A.md` §3b |
| 13 Nov 2026 (00:56 UTC) | Checkpoint evidence at `d8db82bde8d7a47e9936a34fd21686ca11adb472`: Sharon PASS. One more commit owed before the pull request (`STAGING-CHECKPOINT-BEFORE-A2A.md` §3c): her two lines, and a dispatched workflow for the acting steps, because no credential passes through any of us. Staging read: 224 migrations, as expected |
| 13 Nov 2026 (01:16 UTC) | On the owner's question about anticipating problems: five questions added to the existing design review ("Before any correction is built"). Not a new gate. They apply first to A2a's build and to every brief |
| 13 Nov 2026 (01:18 UTC) | Owner: apply the five questions rigorously, without weakening any gate. First use: the checkpoint itself (`STAGING-CHECKPOINT-BEFORE-A2A.md` §3d). Second Eye: three more items in the boundary commit |
| 13 Nov 2026 (01:31 UTC) | The owner's principle recorded for everyone: think thoroughly before building, build carefully, verify rigorously; none replaces the others. At each result review, defects are marked anticipable or not, and the count is reported at each batch's close |
| 13 Nov 2026 (01:34 UTC) | Baseline for the owner's principle: Sharon classed the nine defects of her 12 Nov reviews, all anticipable; with three found elsewhere, twelve. The Chief Architect's earlier "six" is corrected in place |
| 13 Nov 2026 (01:34 UTC) | Baseline completed with Daisy's record: nineteen defects on 12 Nov, all anticipable; question 1 (what else reads or writes this state) is the largest group |
| 13 Nov 2026 (03:10 UTC) | Boundary candidate `55e7eed9573d7396973b48665cd9d67a048da5bf` pushed and read; with Sharon for the delta; runs in progress. Staging read: the scheduler's first run will end 5 overdue sittings in two synthetic test schools, none in the demonstration school |
| 13 Nov 2026 (03:16 UTC) | Sharon BLOCKED the boundary candidate on one item: the checkpoint script leaves a job running and an account suspended if it stops midway. Second Eye: the clean-up, then the boundary commit. The Chief Architect's "no blocker" is corrected in the runbook (§3f) |
| 13 Nov 2026 (03:55 UTC) | On the owner's question about the bottleneck: parallel work assigned to all four that does not pass through the engineer's pipeline (table above the review queue). No gate changes. Two options that would change a rule are with the owner |
| 13 Nov 2026 (03:57 UTC) | Owner's rulings on elapsed time recorded: focused local checks for documentation-only commits (full CI and journeys kept); no push before a green pre-flight, so review moves earlier to the design, with a carried patch as a preliminary read when useful; the pre-flight's independent parts to be measured, then run side by side where safe |
| 13 Nov 2026 (03:59 UTC) | Sharon, in parallel (`claude/gracious-lamport-0m1qjr` at `59298a19ad2cd37993fc31e24b81c3dfb8ee9cfd`): **C3w R-3 as a checkable design** (`C3W-R3-DESIGN.md`: five controls, seven red-first tests, and a proposal on common names: block identifiers, a visible learner's full name and anything shaped like a list of people; pass a lone given name in prose; the rule must prove itself on real material or go to the owner); **test specifications for F1R1B-R1 and B2-R-S1** (`REGISTER-TESTS-F1R1B-R1-B2-R-S1.md`), ready for Second Eye after the boundary commit. The common-names rule interprets an owner's ruling, so it is put to the owner at C3w's design review, with its evidence |
| 13 Nov 2026 (04:00 UTC) | Daisy, in parallel (`ux-1/daisy-experience` at `b5cde1ab7dc19bf9bc05297874fb3cb437126b8a`): **A2a's and A2b's words at the design stage** (`A2-KATA-DESAIN.md`); **X-2's design note**, which corrects what X-2 is (register row corrected in place); **Z's consistency inventory** (`Z-KONSISTENSI-INVENTARIS.md`, Z-1 to Z-5). For Sharon: X-2's guard, and Z-4's question whether an audit row's old wording is kept. For Second Eye, later: A2b's D8 deletes the fixed «WIB» string; on an emergency, «Lainnya»'s free text is shown to every affected learner |
| 13 Nov 2026 (04:01 UTC) | Pre-flight measured: the 11 red-case groups are more than half of it. Decision: parallelise those only, after the boundary commit, with the safeguards recorded. Second Eye's clean-up fix is local at `a33c852877686bdd54353c63dfcd995e1c902110`, on its last pre-flight step. A2b's page and the verification report's skeleton are drafted in his scratchpad |
| 13 Nov 2026 (04:23 UTC) | Boundary commit: `a33c852877686bdd54353c63dfcd995e1c902110`, frozen on `promote/4.1-staging-checkpoint`; its CI and journeys dispatched there. Sharon: the clean-up delta. A2b's page is pushed on the work branch (`63f27b3ed3fe8012958fc8ae862cb2b6c40072a1`), outside the boundary, for Sharon's and Daisy's answers |
| 13 Nov 2026 (04:57 UTC) | Boundary not yet fixed: one consolidated fix specified in the runbook §3h (Sharon's two items, the app-build check, journeys job B's retry). Sharon reviews the list **before** the build. A2b's page: Sharon PASS on the design with three points (`A2B-PREBUILD-ec09e82e….md`) |
| 13 Nov 2026 (05:09 UTC) | The promotion and the acting checks are separated (runbook §3i). Pull request 1 is `a33c852877686bdd54353c63dfcd995e1c902110` exactly. The corrected script follows as pull request 2. Red-case parallelisation on hold; no workflow or procedure changes until the checkpoint closes (owner) |
| 13 Nov 2026 (05:36 UTC) | **Pull request 19 opened: the staging promotion at `a33c852877686bdd54353c63dfcd995e1c902110`** (runbook §3i, §4). Not merged; the merge is the owner's. Second Eye: the corrected script to Sharon's list, for pull request 2. A2a held until part 2 passes. **Nobody uses staging once the owner says he is about to merge, until told.** Also: the owner approved in principle a more autonomous GitHub arrangement, to be implemented only after this checkpoint closes |
| 13 Nov 2026 (06:17 UTC) | **Staging promotion PASSED (part 1).** Pull request 19 merged by the owner; staging at 244; every read-only check as expected; preservation equal on every line (runbook §4). Part 2: the corrected script as pull request 2, from `main`. **A2a held until part 2 passes** |
| 13 Nov 2026 (06:29 UTC) | **The owner on access (13 Nov):** he will give the whole team the fullest practical access needed to develop, test, verify and operate PINTAR; his involvement is not to be treated as a dependency where it need not be one; independent reviews, verification and accountability are preserved; consequential decisions stay his; production security is not weakened. **After the checkpoint closes,** the Chief Architect brings one practical access arrangement for the whole team: what each member needs, what the owner must authorise, and what is set up for him. **Each member: note what you could not do for lack of access** (Daisy: the staging host and a synthetic account, already noted). Nothing changes before the checkpoint closes |
| 13 Nov 2026 (06:42 UTC) | **Owner directive, GitHub autonomy (13 Nov), for after part 2 closes; nothing changes before then.** (1) A practical GitHub access arrangement for the Chief Architect, Second Eye, Sharon and Daisy. (2) The tools and permissions for routine operations: workflow management, CI dispatch, pull requests, approved staging merges, deployment verification. (3) A dedicated automation identity or GitHub App in preference to the owner's personal credentials. (4) A production approval gate that is technically enforceable, with real separation between the team's operating identity and the owner's. (5) Every production deployment path verified to respect the gate; production credentials unable to bypass it. (6) The team's other access limits, including Daisy's staging access and synthetic account. **Principle:** *"You manage engineering. The team executes. I make strategic decisions and authorise genuinely consequential actions."* **Acceptance test:** one normal development-to-staging cycle completed without the owner clicking a GitHub button. Production releases and exceptional high-risk actions remain his. Known facts: the repository is public, under his personal account; a `Production` environment exists; required reviewers, prevention of self-review and administrator-bypass controls are available; the settings are identified and not yet saved |

## Production protection: recorded for release readiness (owner, 13 Nov)

The owner saved the `Production` environment's protection: required reviewer `yazidmanan2409`, self-review prevented,
administrator bypass off. No branch restriction, no environment secrets or variables yet. This is not yet a complete
gate. To verify at the release-readiness stage, not before:
1. every production workflow (`deploy-supabase-production`, `deploy-vercel-production`, `configure-supabase-auth`,
   `configure-supabase-smtp`, and any other that reads a production secret) declares `environment: Production`;
2. production secrets live in that environment, not at repository level, so no other workflow can read them;
3. deployment branches restricted to `main`;
4. the engineering automation acts under an identity other than the owner's (today it acts as the owner, so
   "prevent self-review" would block the owner approving what the automation started, and the gate is not yet separate);
5. no Vercel, Supabase or GitHub path deploys to production outside that gate.
No production action is authorised by this note.

## Owner's decisions after the 4.0 look-back (13 Nov 2026) — in force from the next session

**State at close of 13 Nov.** Checkpoint Part 2 ACCEPTED (Sharon, `PART2-VERDICT.md`, `2c90d178`); record in
`checkpoint/PART2-EVIDENCE.md`. `main` and staging: `a6b47466`, 244 migrations. A2a is released but **stopped for the
day**: only its page is pushed (`claude/a2a` at `be219c39`, documentation, not yet read by Sharon or Daisy); no A2a code
exists. Nothing is running on staging; `staging-checkpoint-41.yml` stays disabled. Production untouched.

1. **4.0 is preserved; 4.1 continues.** No overhaul, no reopening completed work, no speculative refactoring.
2. **The one confirmed inherited weakness is corrected inside A2a:** Sharon's catalogue test that every function which
   locks or writes `persons`, `auth.users`, `accounts` or `person_suspensions` takes them in the order
   persons → `auth.users` → accounts. It covers all such writers, including those A2a adds, and A3's when A3 is built.
   Existing account-lifecycle behaviour and every approved safeguard are preserved.
3. **Method:** develop and test cheaply → independent review → freeze the candidate → rigorous acceptance. No basic
   discovery during expensive release checks. The oversized checkpoint machinery is not rebuilt.
4. **Simple:** no new bureaucracy, documents, approval layers or broad clean-ups. Demonstrated problems are fixed at
   their source by the smallest safe correction.
5. **Friction, from existing records only** (no new reporting): per batch, approximate duration, number of full
   verification attempts, avoidable rework. One line per batch in its completion page. If difficulty recurs, first say
   whether the cause is architecture, feature complexity or operations, before adding any machinery.
6. **Roadmap:** A2a → A2b → C2w → A3 → C3w → Z under existing requirements and reviews. Sharon's conditions, the
   8-second timeout constraint and every acceptance gate stand. Reviewer sign-in on staging and the separate GitHub
   automation identity are handled at their readiness points. Production needs the owner's separate authorisation.
7. **The look-back is closed** (Sharon's `LOOKBACK-4.0.md`; run records: CI failure share flat at about 17–19%, journeys
   falling). Second Eye's input is taken only if it materially changes the conclusion.

**Next session starts with:** Sharon's and Daisy's early read of A2a's page at `be219c39` (with item 2 added to it),
then the build.

## Five working rules from what went wrong before (owner agreed, 13 Nov 2026) — in force from the next session

Each answers a mistake that happened more than once. They add no review round and no document.

1. **The acceptance evidence is named before building.** The batch's page lists what proves it done, who runs each
   check, with what access, and where.
2. **Freeze binds everyone, the Chief Architect included.** After the freeze nothing is added. A late idea is either a
   blocker with its reason, or a note for the next batch.
3. **A defect is swept for its siblings before it is fixed.** First question after any finding: where else does this
   shape exist? The fix covers all of them at once. (The lock-order catalogue test is this rule made permanent for the
   account lifecycle.)
4. **One thing in acceptance at a time, one dispatcher.** Only the Chief Architect dispatches CI and journeys during
   acceptance; nothing else is pushed to that branch meanwhile.
5. **A product change and verification tooling never travel in the same change.** A new probe or check is its own
   small change with its own review.

Unchanged: reviewers read before the expensive step; the five design questions are answered on the page before code;
half a day without the expected result means stop and reassess. Each batch's page records in one line whether its
defects were caught in development or in acceptance.

**First act of the next session:** brief Second Eye, Sharon and Daisy on these five, then A2a's page (lock-order test
added) goes to its early read.

## A2a change A merged and on staging (13 Nov 2026, 23:52 UTC)

- PR #21, frozen `2cea0564`, merged as `0ea4b8ad`. Gates on the frozen commit: Sharon's result review PASS
  (`A2A-CHANGE-A-RESULT-2cea0564.md`, `3d708613`); CI run 43522043800 green; journeys A and B (run 43522043225) green;
  Second Eye's full pre-flight green (1151 passed, 175/175 plants, 11/11 red cases). Each on the first attempt.
- `staging.yml` run 43529748093 green; staging at 249 / `20270118140000`, health ok. environment-facts run 43530225481
  green on `0ea4b8ad`.
- Preservation pair: before 23:47:20.61819+00 / watermark 10697; after, read with those values. Every preserved line
  (20–62) and the sittings lines (70–72) identical; only line 10 (migrations 244 → 249) moved, as designed.
- Register from change A: REG-A2A-01 to -08 (A2a's page). Friction: about 18:20 to 22:35 UTC to the freeze; one full
  verification attempt; all ten defects caught in development.
- Next: change B (the scale job, within the owner's four limits), then change C (A2a's product changes).

## A2a's order changed to A → C → B (owner, 14 Nov 2026)

Second Eye showed that change B (the scale job) cannot measure the stop and the lift until change C exists. The owner
authorised A → C → B, with these conditions (summarised; his message governs):
1. C starts from `main` at `0ea4b8ad`, with the inventory and tests of every reader of a sitting's closing time
   (`closure_deadline`, `closes_at`, grace) as its first commit.
2. Early reviews stay mandatory: Sharon on the risky database parts, Daisy on screens and wording before the freeze.
   Previously approved behaviour and conditions are preserved.
3. B stays separate, built against C's real implementation, within the four existing limits; nothing new measured.
4. The scale job measures one fixed, identifiable commit of C. **C is not accepted as A2a until its scale evidence is
   satisfactory.**
5. The full acceptance process stands. Changing a frozen candidate means an explicit unfreeze, correction, review and
   refreeze.
6. Directly related defects and their siblings are fixed; 4.0 is not reopened broadly; no unrelated improvements.

**The sequence (the Chief Architect's):**
1. C in development on `claude/a2a-change-c` from `0ea4b8ad`; early reads as it goes.
2. C frozen at a named commit; Sharon's result review, Daisy's screen review; then one full pre-flight, the PR (CI,
   left open, not merged) and journeys, all on that commit.
3. B in development on `claude/a2a-change-b`, branched from C's frozen commit, verification tooling only; Sharon's
   early read; B frozen; its own review and checks.
4. The scale job dispatched once, on C's frozen commit (B's tooling at B's frozen commit).
5. Only if the scale evidence holds: C's PR merges, then B's. Staging promotion with the preservation pair.
6. If they do not hold: C is explicitly unfrozen, corrected, re-reviewed and refrozen, and steps 2 and 4 repeat on the
   new commit.

**Two precisions (owner, 14 Nov):**
- **Two commits, one product.** The scale evidence names both: C's frozen commit (the product measured) and B's commit
  (the tooling). B's diff from C's frozen commit may touch only verification tooling (`selftest/`, `scripts/`,
  `.github/workflows/`, `audit/`); a diff that touches `supabase/migrations/` or `src/` means B is measuring a different
  product, and the run does not count. The Chief Architect checks this mechanically before dispatch.
- **Four measurements, not three.** As A2a's page §7 has them: (1) R1's skip count; (2) R2's 5 s at p95; (3) the
  activation's and the lift's work under the fence, ≤ 0.5 s; (4) the shared takers refused while the fence waits,
  counted (Sharon's 2.0 s correction). Measurement 4 is a reported count; Sharon judges it. "The three numbers" in
  earlier messages was shorthand that left it out.

**Before C's freeze (owner's review, 14 Nov; no owner decision):** the late-marking case (stop takes effect → learner
moves → marking runs → lift) is C7-1's permanent regression; Sharon rules on the three lock-order and privilege
questions on A2a's page; C7-2 (first-touch release) and C7-3 (consistent deadline reads) close. **At C's staging
promotion, a stop condition:** read-only, the hosted `pg_cron` job's owner can `CALL` the batch procedures and make
their writes, and `anon`, `authenticated` and `service_role` are refused on the six revoked routines (Sharon names the
exact reads).

### Change C check-in, 14 Nov 2026, 06:04 UTC

- **Commit 30** (`8cbda9cc`, 05:50): the no-mark-at-lift design with D1 is built, with test A2A-C711. It is with
  Sharon for an early read against her C18-1 ruling (`50dab36f`).
- **Daisy's early screen review** (`A2A-LAYAR-f308b0bf.md`, her branch at `e6471f61`) has three blockers:
  - the pause page has no class form;
  - the teacher's pause page has no other-class line;
  - the node-refusal line differs from her approved one.

  Several approved strings are still unbuilt, and nine of her twelve screens are still missing. Second Eye has all of
  this and has been told to keep building.
- **For Z, not change C:** Daisy's §3 note, phone-width overflow on `/mengajar/[kelas]/siapa` (A1's page), and its
  siblings `soal` and `bukti`. It joins the X-1 to X-4 list.
- **Friction:** a third handoff gap. Commit 30 waited 14 minutes with no reviewer told, and Second Eye stopped after
  pushing it. It was caught by the 30-minute check-in. The rule stands: whoever pushes tells the reviewer, then keeps
  building.

## Handoff convention (owner, 14 Nov 2026)

Bob should not have to discover finished work through check-ins. Every handoff follows one sequence: **work ready →
notify reviewer → reviewer acknowledges → review begins.**

- **Work ready.** Whoever pushes something for review sends one message to the reviewer, copying Bob. It gives the
  branch, the commit and what to read. Second Eye messages Sharon and Daisy, and they message him back.
- **Acknowledge.** The reviewer replies on receipt, copying Bob, with the commit and when to expect the verdict. The
  reply is one line and does not wait for the review.
- **No acknowledgement within 15 minutes:** the sender tells Bob, and Bob relays.
- **Direct messaging unavailable:** Bob relays the handoff and remains responsible for it.
- **The builder keeps building** while the review runs.
- **Bob's 30-minute check-ins stay as a backstop only.** A handoff that a check-in finds is recorded as friction.

No other coordination mechanism is added.

## Order of work to C's freeze (owner's verdict, 14 Nov 2026)

1. Correct C30-1 and C30-2, with tests for overlapping controls (a stop combined with A1's suspension hold) and for
   answer-saving after a lift.
2. Sharon verifies the corrections.
3. Daisy's approved wording is built, and her outstanding screen review is completed.
4. The full regression and concurrency checks run before C is frozen. Second Eye runs them in development, and C is
   frozen only on a green run. The one full pre-flight still runs afterwards, on the frozen candidate.
5. Then change B's independent scale verification.

- **No owner ruling** unless the implementation genuinely conflicts with an approved requirement.
- **The distinction the owner drew:** Sharon's reviews show the architecture is sound. They do not make change C
  technically closed. C closes only on the verified implementation.

### Change C check-in, 14 Nov 2026, 06:35 UTC

- **Commits 31 and 32:**
  - commit 31 (`2d94d939`) fixes two of Daisy's three blockers in code: the pause page names the stopped class, and
    the refusal is her approved line;
  - commit 32 (`ca063fb3`) is the C30-1 and C30-2 fixes.
- **Handoff:** both were handed off only as a note on the A2a page, so neither reviewer was told. Bob relayed both at
  06:37.
- **Friction, the first under the convention.**
  - A note on a page isn't a handoff. Second Eye has been given the route, a one-shot message to the reviewer's
    session.
  - Daisy's session can receive messages but cannot send them. Her acknowledgements go in `TERIMA.md` on
    `ux-1/daisy-experience`, which Bob reads at every check-in. That is the "messaging unavailable" case, so Bob
    relays for her.

### Security-lint exception for three committing procedures (14 Nov 2026, 07:05 UTC)

**What was found.** Second Eye ran the full static manifest for the first time since change C began. His regression
set had left it out. The platform lint (F05-T21, F01-T13, DR-D01) has been red since commit 15 on three procedures:
`pengerjaan_tandai_darurat`, `pengerjaan_tutup_berkala` and `pengerjaan_lepas_darurat_semua`.

**Why they cannot be fixed the usual way.** PostgreSQL forbids a SET clause, or SECURITY DEFINER, on a procedure that
commits. Committing between batches is Sharon's approved C15 design.

**What Bob checked on the branch.** All three are SECURITY INVOKER, and EXECUTE is revoked from public, anon,
authenticated and service_role.

**Bob's ruling: option (1), subject to Sharon's yes.** It is a declared exception that the lint enforces, never a
weakening of it.

- **Exact list.** The lint keeps a list of exactly these three names. Any other unpinned function or procedure stays
  red.
- **Conditions asserted for each listed name:**
  - it is a procedure;
  - it is not SECURITY DEFINER;
  - nobody in public, anon, authenticated or service_role can execute it;
  - its first act is `set_config('search_path', 'public, pg_temp', false)`;
  - every name in it is schema-qualified.
- **Plants:** one per condition.

Option (2), one batch per function call, is refused because it would reopen the C15 ruling.

**Friction.** The test omission is caught by the owner's step 4, the full regression run before the freeze. That run
now includes the whole static manifest.
- **Sharon: YES (07:09 UTC), with two additions, both binding.**
  - The lint also asserts that each procedure's owner is the cron job's username. `set_config(…, false)` is
    session-wide, so only that session should carry it.
  - "First act" means before any commit, and gets its own plant.

## The freeze sequence, defined once (Chief Architect, 14 Nov 2026; `PLAN-A2B-C2W.md` §4)

**The pre-freeze full run is the one full pre-flight.** It is not repeated after the freeze. This supersedes the
06:13 note above, which said the acceptance pre-flight still runs afterwards.

1. **Development:** focused checks only. They are rehearsals, not evidence.
2. **Candidate:** both reviewers are clear on every commit, and the engineer names a candidate commit.
3. **The one full pre-flight, on that exact commit:** full regression, the concurrency tests, the whole static
   manifest, every plant and every red case.
4. **Freeze, if green:** Bob freezes exactly that commit, with the run as its evidence. If red: no freeze; fix, then
   step 3 again.
5. **Acceptance on the frozen commit:** Sharon's result review, Daisy's screen review, PR and CI, journeys,
   measurements, merge, staging with preservation readings.
6. **A blocker:** explicitly unfreeze, correct, review, then step 3 again before refreezing.

**Change C now:** Second Eye's full run on `f74c6060` is that commit's one full pre-flight.

## Weekend shutdown: change C NOT frozen; a clean checkpoint at `f74c6060` (Chief Architect, 14 Nov 2026, 09:20 UTC)

### The run

Second Eye's full pre-flight on `f74c606069cbfdce9004138e3bdc99623f01af8b` is green:

- lint and typecheck: return code 0;
- build identity: 11 passed;
- the whole manifest, freshly reset and built: 1167 passed, 0 failed;
- plants: 175 of 175 caught;
- red cases: all 11 groups passed.

The tree is clean and everything is pushed.

### Why there is no freeze

His handover lists as "deferred, not in C" four items that are **approved A2a requirements**, not optional:

- **O1 after the lift:** a departure's rule for a sitting preserved through a stop, and `akhiri_penugasan`'s refusal
  (D6.2).
- **M-1:** the promotion run is refused for a learner with a protected sitting. Today it preserves the sitting instead
  of refusing (D6.2).
- **D6.9's remaining audit rows:** marking completed, and the released and held counts at the lift.
- **The per-blocker tests B3 to B6** of THE PLAN §5.3 H, with the required-change-1 test through every reader.

The A2a page lists all four as "then, in order" before the freeze. Freezing without them would freeze a candidate
known to be incomplete. Sharon's result review would then fail it, and it would have to be unfrozen.

The owner's directive is: "If Change C cannot safely freeze, preserve the current state and stop at a clean
checkpoint. Do not rush or waive any gate." So C stops at a clean checkpoint, `f74c6060`.

### Monday, in order

1. **Second Eye** builds the four items above, with tests, red first. Handoff per commit; Sharon reads each.
2. A new candidate, then the one full pre-flight on it (the freeze sequence, §4 of `PLAN-A2B-C2W.md`).
3. If it's green: freeze, then Sharon's result review of the frozen commit.
4. Change B on `claude/a2a-change-b` from the frozen commit: tooling only; the four measurements; scenario 8's three
   numbers.
5. If B's evidence holds: merge C, then B; staging promotion with the preservation pair, and Sharon's eight hosted
   privilege reads as a stop condition. pg_cron must be present where the search_path lint runs.

### Friction

An approved item was relabelled as deferred in a handover. The rule stands: only the owner or a reviewer's ruling
removes approved scope, and an engineer's "nobody asked for it" never does.

### Where everyone is

| Who | Handover | Where |
|---|---|---|
| Sharon | `0aab9152` | `claude/gracious-lamport-0m1qjr` |
| Daisy | `e990def9` | `ux-1/daisy-experience` |
| Second Eye | `cfafc1a2` | the A2a page, `claude/a2a`. Read it with this note: "proposed for freeze" is superseded by "clean checkpoint", and his "deferred" items are Monday's first work |
| Bob | this section | this file |

## CHANGE C FROZEN at `c04c088ea65f7eff32c07aadf0a91b16e098e3ed` (Chief Architect, 15 Nov 2026, 22:57 UTC)

This is commit 46 on `claude/a2a-change-c`. The branch head was verified equal to it, and the tree is clean.

**The one full pre-flight, on that exact commit** (fresh reset and fresh build; CI's steps run locally by Second Eye):

| Check | Result |
|---|---|
| Lint, typecheck | Return code 0 each |
| Build identity | 11 passed, 0 failed |
| Whole manifest: regression, concurrency, static, app | 1173 passed, 0 failed, 0 skipped. One skip is local-only and justified |
| Plants | 175 of 175 caught |
| Red cases | All 11 groups passed |

**Sharon:** "Nothing is open on C up to `c04c088e`" (`A2A-C-46-c04c088e.md`, `ddb27175`). Each of the owner's items is
closed:

| Item | Closed by |
|---|---|
| C39-1, departure at first touch | `ae479d83` |
| The refusal audit and its dedupe | `d79ee46a`, `ddb27175` |
| D6.9, the rows and the released count | `064e9d00`, `9eae2d53` |
| C717 and C718, with the six disabled triggers accepted | `84ddf56e` |
| C41-1 and C41-2 (C41-2 swept to six places) | `9eae2d53` |
| M-1 confirmed | `84ddf56e` |
| N42-1, and the reused-database test fixes (F01-T10, B1-S01 and S05, F05-T07; causes in commit 45) | `9eae2d53` |

**Registered by Sharon's rulings, not in C** (the A2a page, `claude/a2a` `945c5fa2`, items 6 and 7):

- the departed learner's direct sitting URL;
- the refusal record's simultaneous-call race.

**Not yet accepted as A2a.** That waits on:

1. Sharon's result review of `c04c088e`, starting now;
2. change B's scale evidence on this commit;
3. PR and CI, and the journeys;
4. merge, then staging promotion with the preservation pair. Sharon's eight hosted privilege reads are a stop
   condition, and pg_cron must be present where the search_path lint runs.

**Change B starts now** on `claude/a2a-change-b`, branched from `c04c088e`:

- tooling only: its diff may touch `selftest/`, `scripts/`, `.github/workflows/` and `audit/`, nothing else;
- the owner's four measurements;
- scenario 8's three C18-1 numbers.

Any change to C from here means an explicit unfreeze, correction, review and a new pre-flight.
- **Sharon's result review of `c04c088e`: PASS on the code** (`f3f5fa38`).
- **P1:** the lift makes one fence attempt, then `MAINTENANCE_LIFT_NOT_DONE`; §3 had said three. The owner ruled on
  15 Nov: **keep one attempt.** §3 is corrected on the A2a page, documentation only, with no unfreeze.
- **The lifts refused under shared load** are reported beside measurement 4's count. They are a reported figure, not a
  new gate.
- **Change B's scale run:** run 43778010841, started 00:02 UTC on 16 Nov from `e026a871`, which sits on `c04c088e`. The
  diff touches only the workflow and `selftest/a2a-skala.ts`.
- **Friction:** it was dispatched before Sharon had read `e026a871`, the B1 commit added after her read of `d7fd8165`.
  Bob's condition was dispatch after her read. Second Eye said so plainly.
- **The run counts as evidence only if Sharon confirms `e026a871`.** Otherwise there is one new run on the commit she
  clears.

## A2a scale evidence holds; change C's PR opened (16 Nov 2026, 01:00 UTC)

**Run 43782374237** (tooling `70b3e37d`, cleared before the push; product `c04c088e`): Sharon says the scale evidence
HOLDS (`6fd9fbcc`).

- R1: 50,000 overdue, 0 stopped among the candidates, and R1's plant bites.
- R2: p95 28.6 ms.
- Activation 20.1 ms and 5.7 ms; lift 5.8 ms.
- 0 of 3,966 shared takers refused; 0 lifts refused.
- D1 p95 0.38 ms; release at 1,639 per second.
- R1-B is closed.

**The first run, 43778010841, is superseded:** R1-B was found in its tooling.

**Change B now also carries** `cfeaaaaa` (the cause of ADM09-S01: A2A-C715's clean-up) and `dd382fe2` (F01-T09's
probes unwind). The `selftest/db` sibling sweep is done and accepted (`9dd1c75f`).

**Acceptance path now:**

- [PR #22](https://github.com/yazidmanan2409/pintar40/pull/22) merges `claude/a2a-change-c` at `c04c088e`, with CI.
- Journeys are dispatched on `c04c088e`.
- Then merge C, then B's PR, then staging with the preservation pair, the eight hosted reads, and pg_cron present.

## Change C merged and promoted to staging (16 Nov 2026, 01:55 UTC)

- **Merge:** [PR #22](https://github.com/yazidmanan2409/pintar40/pull/22) merged as `bbed52e4` after CI (18 of 18 checks)
  and journeys run 43783561156 passed on `c04c088e`.
- **Staging:** `staging.yml` run 43789058922 succeeded. Staging is at 267 / `20270119270000`, with pg_cron 1.6.4.
- **Sharon's eight hosted reads:**
  - 1, 2 and 4 to 8 are as expected;
  - the closer job (jobid 5) calls both batches;
  - read 3, the job's first run after promotion, is pending.
- **[PR #23](https://github.com/yazidmanan2409/pintar40/pull/23):** change B, opened.

### Process miss, recorded as friction: the "before" preservation read was not taken before the merge

- **What happened:** `staging.yml` applies migrations on push to `main` within about 60 s. The read at 01:56:54
  already showed 267.
- **The substitute, for Sharon's ruling:** every preserved line equals change A's after reading at 249 (cutoff
  13 Nov 23:47:20, watermark 10697). The watermark is unchanged, and there are 0 open sittings.
- **Rule from now on:** the "before" read is taken BEFORE the merge button, for every promotion. The merge waits for
  it.

## A2a ACCEPTED on staging (16 Nov 2026, 02:16 UTC)

- **Sharon:** C's promotion passes (`A2A-C-PROMOTION-READS.md`, addendum `fdffee31`).
  - All eight hosted reads match. Read 3: job 5 succeeded at 02:00 and 02:05.
  - N1: false for all three roles. pg_cron 1.6.4.
  - The preservation pair (`86490991`): under the corrected comparison, which leaves out change C's five new
    `assessment_sessions` columns by name, lines 20 to 62 and 70 to 72 are identical. Only line 10 (249 → 267)
    differs. `maintenance_windows` is not covered.
  - Environment facts: run 43789456025, green.
- **With her result PASS (`f3f5fa38`) and the scale evidence (`6fd9fbcc`), A2a is accepted.**
- **Change B,** [PR #23](https://github.com/yazidmanan2409/pintar40/pull/23), tooling only: merges when its CI is
  green.
- **Required before A2b's promotion (Sharon):** a preserved line for `maintenance_windows` in the preservation query,
  leaving out A2a's `node_ids`, `t_stop` and `t_lift` by name. It is added to A2b's acceptance evidence.
- **Next:** A2b, per `PLAN-A2B-C2W.md`. It starts from `main` once B is merged.

### Carried forward from A2a (owner, 16 Nov): register items that must not be forgotten

Both go to Z's triage list, with owners.

| Item | Source | Owner | When |
|---|---|---|---|
| A departed learner opening a sitting directly by its web address | Sharon's ruling; the A2a page, item 6 | Second Eye | Triage at Z; re-checked when A3 changes the start path |
| Two simultaneous refused acts can each write an audit row | Sharon's ruling; the A2a page, item 7 | Second Eye | Triage at Z |
| Phone-width overflow on `/mengajar/[kelas]/siapa`, and its siblings `soal` and `bukti` | Daisy | Daisy | Triage at Z, with X-1 to X-4 |
| A2b's trigger: the person-level start branch still reads `now()` instead of `clock_timestamp()` | Sharon's note on A2b commit 2 | Second Eye | Triage at Z |
| A preserved line for `maintenance_windows` | Sharon | Bob | **Mandatory before A2b's promotion** |
- **Change B merged:** [PR #23](https://github.com/yazidmanan2409/pintar40/pull/23) as `eff99f98` (CI 18 of 18).
  **A2a is complete on `main`.** A2b starts from `eff99f98`.

### A defect found in accepted A2a: D1-2 (Sharon, 16 Nov, `a7d0b378`)

**What happens:** after a stop is lifted, a sitting that was **marked** (held) shows its old, unshifted deadline until
its release runs: either the learner's first touch, or the release batch, which runs every 5 minutes. During that time
every read-only reader shows the wrong deadline:

- the player's countdown;
- `may_continue_session`;
- the learner's and the teacher's lists.

**Why it was missed:** Sharon's D1 ruling covered unmarked sittings only. She says it could reasonably have been
anticipated.

**Fix:** in A2b, as its own commit, with a test and a plant. It is not registered. A2b's K5 then asserts the drain
before the first touch.

**Exposure:** staging only; production is untouched. A2a's acceptance stands, with this known defect recorded against
it until the fix is promoted with A2b.

### A2b: an approved 4.0 test restated (16 Nov, pending Daisy)

Second Eye restated `UX1-S2-MELIHAT-01`, which pins two of 4.0's Slice-2 rulings, to fit A2b:

- **(a)** exactly one disabled control is allowed: «Mulai» on the maintenance branch;
- **(b)** D4's duration sentence moves to `pemeliharaan.d4.*`, and the orientation copy stays free of durations.

**Rule:** a test pinning an approved ruling is restated only with its author's ruling. Daisy authored Slice-2's UX
rulings and is asked whether each restatement keeps the intent. If not, the screen changes, not the test. This blocks
A2b's freeze until she rules.

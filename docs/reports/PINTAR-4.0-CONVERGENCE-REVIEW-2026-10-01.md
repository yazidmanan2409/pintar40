# PINTAR 4.0: convergence review (coordinator)

**1 October 2026.** The coordinator's reply to ChatGPT's proposed convergence path, given only as a convergence reviewer.
- Read-only. Nothing was changed in code, branches, Supabase, Vercel or canonical documents.
- Two facts were checked for this review, both read-only:
  - whether the lane sessions can be reached without Yazid;
  - which machine credentials GitHub already holds.
- Verdicts: **AGREE** (adopt as written), **AMEND** (adopt the principle, with a precise change), **OBJECT** (do not adopt).
- **There are no OBJECTs.**

---

## 1. Verdicts at a glance

| Element | Verdict | In one line |
|---|---|---|
| A. Starting point | **AGREE** | Walk back status, evidence and process, not code |
| Phase 0: Freeze / contain | **AMEND** | Make the production rule unambiguous: no new people until the Phase 8 release |
| 1.1 Scope inventory | **AMEND** | Every line cites an existing source; a line with no source is not scope |
| 1.2 Evidence states | **AMEND** | Precise definitions (§2); evidence pinned to a commit, never carried forward |
| 1.3 Vertical ownership | **AMEND** | One journey, one branch: the server and the screen travel and are proven together |
| 1.4 No self-certification | **AMEND** | The reviewer must be reachable without Yazid; "can fail" is proven by a recorded red |
| 1.5 Yazid out of the loop | **AGREE** | The replacement message path and most machine access already exist (§3) |
| Phase 2: Instruments | **AMEND** | Every instrument is shown red once before its green counts |
| Phase 3: Golden School | **AMEND** | Map the breaks beyond the first through labelled bypasses; check that staging runs `main` |
| Phase 4: Rivers and bridges | **AMEND** | Journey order sets priority; known later breaks may be worked in parallel, closed only by the run |
| Phase 5: Complete 4.0 | **AGREE** | Closes with polish and the email bar (D-052, D-079(f)) |
| Phase 6: Human acceptance | **AGREE** | Each person gets their school through the same operator path |
| Phase 7: L1 | **AMEND** | Measure L1 once early; it still gates in Phase 7 |
| Phase 8: Production + pilot | **AMEND** | Add three canonical release conditions it omits |
| C1–C3: Golden School decisions | Recommendations | §5 |
| D. Testing frequency | **AMEND** | Level 2 runs before the merge; Level 3 has an objective trigger |
| E. Status reporting | **AMEND** | Generated from runs, never typed; every row shows its commit and run time |

---

## 2. The amendments, with reasons

**Phase 0 (AMEND).** ChatGPT's draft says production gains no new users "until the known identity/certificate holes are safely addressed". Replace it with: **production gains no new people until the Phase 8 release.**
- **Why:** the fixes can reach production only through Phase 8.
  - BOB-26 carries the hole fixes together with password sign-in.
  - D-058(b) forbids password sign-in on production before recovery works.
  - "Until addressed" invites an out-of-sequence production deploy.
- **No mechanism is needed.** Sign-up is disabled on both projects (GATE-0-FACTS; PUB-02), and only provisioning creates people (D-054(a)).

**1.1 Scope inventory (AMEND).**
- **Every line cites its existing source,** a decision or a checklist row. A line with no source is not scope: it goes to Yazid as a MISSING REQUIREMENT.
- **Organised by journey;** built from the existing checklist rows and decisions, with no new research.
- **Drafted by the coordinator, reviewed by ChatGPT, approved by Yazid.**
- **Why:** an inventory can widen scope quietly. My audit did exactly that a day ago (READY §16.1, the school-creation screen).

**1.2 Evidence states (AMEND): precise meanings.**

| State | Means |
|---|---|
| **BUILT** | The code is on `main`. Work on a lane or a gate branch is not built. |
| **TESTED** | BUILT, and a Level 1 or Level 2 test that **runs** the behaviour passed in CI on that `main` commit. A test that only reads source text does not count. |
| **DEPLOYED** | TESTED, and staging runs that commit (code and migrations), as confirmed by the environment-facts check, not assumed. |
| **JOURNEY-PROVEN** | DEPLOYED, and the latest Level 3 run on that deployed commit passed every step of the journey from the front door, unaided (no bypass), under the Golden School rules. |
| **HUMAN-ACCEPTED** | JOURNEY-PROVEN, and Yazid (then Dr Gladys) walked the journey on staging through the front door without help, on a recorded commit and date, and recorded no blocking issue. |

**Rules:**
1. **The states form a ladder.** Each requires all the ones below it, and a row shows the highest state that is true.
2. **Evidence is pinned to a commit and a run, and nothing carries forward.**
   - A red latest run drops the row to DEPLOYED, whatever came before.
   - A newly deployed commit with no run yet shows as unproven.
   - A human acceptance stays on record with its commit, but it never outranks a red machine run.

**1.3 Vertical ownership (AMEND): one journey, one branch.**
- **The rule:** a journey's database, server and screen changes travel on one branch and pass that journey's Level 2 slice before the merge.
- **Why:** the seam defects came from two lanes meeting only at the gate (audit §4: zero- vs one-based numbering, objects vs numbers, UTC vs WIB, mismatched identifiers). The last landing needed a joint gate branch just to bring BOB-26 and DAISY-20 together.
- **Owners per journey are assigned by the coordinator on the board.** This is an engineering assignment, not an owner ruling.

**1.4 No self-certification (AMEND).**
- **(a) The reviewer of a journey test must be able to act without Yazid.**
  - That reviewer is another agent with repository access:
    - the coordinator reviews the lanes' journeys;
    - Bob or a fresh agent reviews the coordinator's instruments.
  - ChatGPT reviews at phase exits only, because a per-journey ChatGPT review would need Yazid to relay it, which contradicts 1.5.
- **(b) "Capable of failing honestly" is shown, not argued.** Every journey test and every instrument is run once against a deliberately broken step and seen to go red before its green counts. This is the repository's existing red-case "plant" practice, applied to journeys.

**Phase 2 (AMEND).**
- **The material change:** the recorded-red rule (1.4(b)) applies to every instrument.
- **Two clarifications:**
  - **Error visibility starts from the logs Vercel and Supabase already keep,** read by the scheduled checks. Add a new error-tracking service only if those logs cannot alert.
  - **Prune a test only when** a test that runs the code covers its claim, or it guards nothing (for example the migration-count tripwires). No security, tenancy, integrity or cryptographic test is pruned during the reset.
- **FACT:** none of the 18 workflows has a schedule today, so scheduled checks are new work.

**Phase 3 (AMEND).**
- **(a) Continue past a break through labelled bypasses.** After the first unaided failure, the run may continue so that later steps are still exercised.
  - Each bypass is recorded as a FAIL, never a pass.
  - The headline stays "how far it got unaided".
  - **Why:** otherwise breaks reveal themselves one per fix-land-rerun cycle, and Phase 4 cannot be planned. The audit harness's defect was never the bypasses themselves; it was that they and the FAILs could not turn the run red.
- **(b) Check what is being tested first.** Every run first asserts that staging runs `main`'s commit and migration level; a mismatch is red.
  - **Why:** `main` moves by a `[skip ci]` fast-forward, which suppresses push-triggered workflows, so staging's migrations are applied by a manual dispatch today. Without this check, Level 3 can test a different system from `main`.

**Phase 4 (AMEND).**
- **Priority follows journey order.**
- **Known later breaks may be worked in parallel when they do not depend on an earlier fix,** for example the certificate rules (D-081, BOB-49) and recovery (Gates 4–5) against teacher onboarding. The conditions:
  - each owner takes one break at a time;
  - each break is proven by its Level 2 slice;
  - a break is **closed only when the unaided Level 3 run passes through it.**
- **Why:** strictly serial work leaves two of three agents idle. The closing rule is what keeps this from sliding back to breadth-first.

**Phase 7 (AMEND).** Take a first L1 measurement as soon as the spine passes (the end of Phase 4): measure, don't optimise. The L1 pass on the release candidate in Phase 7 remains the gate.
- **Why:** D-031 itself records a concrete risk in the sign-in path.
  - Class-card sign-in shares the server's per-address Auth limit (bursts of 30).
  - One class signing in together may exceed it.
  - The card screen then reports the refusal as a wrong card or PIN.
- Found only in Phase 7, it would force identity changes after human acceptance, and acceptance would have to be redone.

**Phase 8 (AMEND). Add the canonical release conditions that the draft omits:**
- **D-054(e):** the existing-staff transition is rehearsed on staging, and the sole production system admin's break-glass is tested before the release. Production's only account is exactly the one that transitions.
- **D-058(b):** no password sign-in on production without working recovery.
- **D-079(f):** every email meets the polished bar before the production release.

"Restricted to the pilot group" needs no new mechanism, because production holds only the people the operator path provisions.

---

## 3. Facts checked for 1.5 (read-only)

- **The replacement message path exists.** Bob, Daisy and Lana run as sessions on the same account, with cross-session messages enabled.
  - The coordinator can message them directly.
  - They answer through the board in git.
  - No new tooling is needed to end the relay.
- **Machine access mostly exists.** GitHub already holds:
  - `VERCEL_TOKEN`;
  - both Supabase access tokens;
  - the production database password and the staging database URL;
  - `PINTAR_SMTP_PASSWORD`.

  The environment-facts and upgrade-rehearsal checks need no new credential from Yazid. The one-time list is therefore short (end of this document).

---

## 4. Where we walk back (status and process only)

- **Every checklist PASS is relabelled by its evidence** when the states are adopted.
  - Nothing can be JOURNEY-PROVEN before Phase 3. No run today drives the deployed app on `main`'s commit with a real staff sign-in: the staging journeys mint staff sessions with the service key, and the last one ran three merges before `main`.
  - "63 of 84 P0 PASS" therefore becomes mostly BUILT or TESTED.
- **Every GATE PASS becomes TESTED,** or BUILT once on `main`. Held work on lanes is neither.
- **Identity:** only Gate 0 is complete by D-058's own definition. Gates 1, 2 and 2E fall back to BUILT or TESTED until their staging acceptance runs.
- **The certificate:**
  - the visual design is approved on paper;
  - as a capability it is BUILT;
  - no certificate has ever been issued.
- **The process:**
  - the 7-step gate is replaced by Levels 1–3 and the reviewer check;
  - the board shrinks to one line per item.
- **Not walked back:** migrations, features, lanes, the database, the repository, and Bob's, Daisy's and Lana's work.

---

## 5. The three Golden School decisions

**C1. School birth. Recommendation: an operator path, scripted and audited, used both by real operations and by the Golden School.**
- **Why an operator path:**
  - PINTAR has no open self-registration (D-054(a)).
  - Schools join under the MOU (D-031: 150 schools in year 1), so PINTAR operations onboards them.
  - SYS-03 (P2) permits an operator path, and D-013 requires it to be audited.
- **The smallest mechanism:**
  - one reviewed, versioned script creates the school, exactly as the product expects one, and nothing else;
  - it runs only through a dispatch-only workflow, with the school's details as inputs;
  - it writes the audit record D-013 requires.
- **One path for tests and operations.** The harness's current hand-written school birth (step W0) is replaced by this script, so tests and real operations share one path.
- **From there the product takes over:** the platform admin adds the first school admin in the app, as today («Orang baru», then the role).
- **Not in 4.0:** a school-creation screen.

**C2. Staff sign-in for automation. Recommendation: the real 4.0 sign-in, with a test mailbox the runner can read. Not one or the other.**
- **Why both:** D-054(b) defines activation as a code by email → username → password → PIN → card.
  - A Golden School teacher who never receives the code is not doing the 4.0 journey.
  - Setting their password behind the scenes would be the impersonation the rules forbid.
  - So password sign-in alone cannot replace the mailbox.
- **How the mailbox is used:**
  - one test mailbox on PINTAR's mail domain, readable by the runner, that can receive mail at a fresh address on every run (the exact mechanism depends on what the mail host supports);
  - the activation code is read from it;
  - every later sign-in uses the password set during activation;
  - email recovery (Gate 4) uses the same mailbox.
- **Until BOB-26 lands:** the baseline run signs staff in through what `main` has (the magic link) via the same mailbox. It will probably go red at staff sign-in, because Supabase's mailer sends 2 emails an hour. That red is the honest baseline.
- **Limits:**
  - staging only, never production;
  - the mailbox receives nothing but test mail;
  - its credentials live only as a GitHub secret, entered by Yazid.

**C3. Data policy. Recommendation: a fresh school per run; never reset, never delete.**
- **The Golden School is a fixed recipe:** names, structure, one admin, one teacher, one student, one chapter. Each run creates a new instance through C1, then works from the front door.
- **Why not a reset:**
  - the product's evidence is immutable by design (sessions, results and certificates are append-only), so a reset must break those invariants with service-role deletes, an untested mechanism of its own;
  - a reset has already hidden a defect: C-07 hid BOB-42 for two runs;
  - a fresh school every run proves the school's birth every night.
- **The cost:** one school, three people and a few sessions per run. Staging holds 72 sessions today.
- **What it does not cover:** a long-lived school (a second term, returning students). That belongs to the Phase 5 journeys, not the spine.
- **People use the same path.** The operator path creates a school for Yazid or Dr Gladys, who then work through the front door.
- **The existing staging schools stay as they are.**

---

## 6. Testing frequency (D, AMEND)

| Level | What | When | Where |
|---|---|---|---|
| 1 | Component and security tests | Every change, before the merge | CI, local stack |
| 2 | The browser slice of each journey the change touches | Before the merge | CI, local stack: branches are not deployed (D-062(a)) |
| 3 | The complete Golden School | Every merge to `main` that changes `src/` or `supabase/`; nightly; before a release | Deployed staging |

- **Which slices run at Level 2:** a simple map from files to journeys decides. When a change is unmapped or unclear, all slices run.
- **Level 3 has an objective trigger, not "relevant".**
  - **Why:** a relevance judgment is how evidence went stale: the last staging journey ran three merges before `main`, and "PASS (unchanged)" was carried forward.
  - **The cost** is one browser job against staging, compared with today's 34 CI jobs per ticket.
  - A copy change on a lane runs only Levels 1–2. A merged integration runs Level 3 once. A documentation-only merge never runs it.
- **Level 3 first asserts that staging runs `main`** (Phase 3(b)).

---

## 7. Status reporting (E, AMEND)

- **Generated from runs.** Nobody types a state except HUMAN-ACCEPTED, which records the commit, the date and who accepted.
- **Every row shows the commit and the run time** behind it.
- **"Current break"** is the first unaided failure in the latest Level 3 run, with its screenshot. Bypassed steps beyond it show what is known further down.
- **The checklist rows stay as the detail underneath,** labelled with the same states. "63/84" is no longer a headline.
- **The picture is the chain as a person experiences it:** one segment per step, coloured by state, with the first break marked. A river without a bridge shows as broken, whatever the tests on either bank say.

---

# AGREED PATH — PROPOSED FINAL VERSION

**Phase 0: Freeze / contain**
- **Development stays paused.**
- **Preserve:**
  - `main`;
  - the lanes at their held commits;
  - staging and production;
  - the audit evidence.
- **No feature work.** Only genuine security or operational containment is allowed.
- **Production gains no new people until the Phase 8 release.** This needs no mechanism: sign-up is disabled, and only provisioning creates people.
- **Exit:** Yazid accepts this charter.

**Phase 1: Reset the development system**
1. **Scope inventory.**
   - Organised by journey; every line cites its existing source; a line with no source is not scope.
   - Drafted by the coordinator, reviewed by ChatGPT, approved by Yazid.
   - Every discovery is classified as a DEFECT (fix in 4.0), a MISSING REQUIREMENT (Yazid rules) or an ENHANCEMENT (4.5+). Only Yazid reopens 4.0.
2. **Evidence states:** BUILT, TESTED, DEPLOYED, JOURNEY-PROVEN and HUMAN-ACCEPTED, as defined in §2.
   - They form a ladder, pinned to a commit and a run, with no carry-forward.
   - Every current PASS is relabelled (the walk-back, §4).
3. **Journey ownership.**
   - One owner per journey, assigned by the coordinator on the board; specialists contribute.
   - One journey, one branch.
   - Backend PASS plus frontend PASS is not journey PASS.
4. **No self-certification.**
   - The owner builds and the machine run decides.
   - Another agent with repository access reviews what the journey test asserts.
   - Every journey test and instrument is shown red once on a deliberate break before its green counts.
   - ChatGPT reviews at phase exits.
5. **Yazid leaves the integration loop.**
   - The coordinator messages the lanes directly; the lanes report through the board in git.
   - After Yazid's short one-time list (below), no engineering verification depends on Yazid.
6. **The Golden School decisions are recorded:** C1 operator path, C2 the real sign-in with a test mailbox, C3 a fresh school per run.

**Exit:** the inventory is approved, the states are adopted and relabelled, owners are assigned, and the one-time list is done.

**Phase 2: Trustworthy instruments**
- **The instruments:**
  - The audit harness fails when a required step FAILS. A BLOCKED required step can never be green.
  - Browser journey slices (Level 2).
  - Staging takes `main`'s code and migrations without a manual step, and every Level 3 run asserts it.
  - An environment-facts check covers Vercel and both Supabase projects (drift turns it red), using the credentials GitHub already holds.
- **Email:**
  - verify both the PINTAR path and the break-glass path;
  - one source for each SMTP secret;
  - `staging.yml` no longer overwrites the SMTP password blindly.
- **Visibility and alerts:**
  - error visibility from the existing Vercel and Supabase logs first;
  - scheduled smoke checks;
  - budget and runner alerts.
- **Rehearsals:**
  - the production upgrade, from production's exact level (111 migrations), on a scratch copy;
  - a backup restore.
- **Tooling for the Golden School:** the C1 school-birth script and workflow, and the C2 mailbox reader.
- **Testing in proportion:**
  - Levels 1–3 as in §6;
  - keep the security, tenancy, authorization, concurrency, integrity and cryptographic tests;
  - prune only by the §2 rule.
- **Exit:** red means broken; green has a defined meaning; every instrument has a recorded red.

**Phase 3: The Golden School (red baseline)**
- **How each run works:**
  - It creates a fresh instance through C1, in production posture on staging, so evidence is official and certificates can be issued.
  - Staff sign in through the test mailbox (on `main` today, by magic link); students sign in by class card.
- **The rules:** no DevTools, typed internal routes, hidden SQL, service-role impersonation, hidden operator repair or technical help from Yazid. The only operator action is C1's.
- **Run current `main` unchanged, and expect red.** Labelled bypasses map the breaks beyond the first, and each bypass is a FAIL.
- **Human observation begins:** Yazid uses a school the operator path creates, through the front door.
- **Exit:** a recorded baseline: how far the chain gets unaided, and the map of breaks beyond it.

**Phase 4: Repair the rivers and bridges**
- **Order:**
  - Fix in journey order, the first unaided break first.
  - Known later breaks may be worked in parallel, one per owner, each proven at Level 2.
  - A break closes only when the unaided Level 3 run passes through it.
- **Held work** (BOB-26, BOB-50, BOB-51, DAISY-20, DAISY-40) lands only when it closes a mapped break, through the new gate.
- **Progress is reported as:** "yesterday the Golden School reached here; today it reaches here."
- **A first L1 measurement is taken once the spine passes.**
- **Exit:** one admin, one teacher and one student complete the whole chain unaided, and it is JOURNEY-PROVEN on the deployed commit.

**Phase 5: Complete the full agreed 4.0**
- **What remains:** everything left on the inventory, including:
  - Identity Gates 4–8;
  - the head of department, dean and platform-admin journeys;
  - the educator-as-learner package.
- **Each item attaches to a journey** and is proven at Level 3. It is not an MVP: nothing counts as done because code exists.
- **The phase closes with the UI/UX polish** and the email quality bar (D-052, D-079(f)).
- **Exit:** every inventory line is JOURNEY-PROVEN.

**Phase 6: Human acceptance on staging**
- **Who:** Yazid, then Dr Gladys, each on a school created through the operator path, through the front door, with no technical help.
- **What it answers:** human use asks "does this make sense?"; machine evidence asks "does this work reproducibly?" Both are required.
- **Exit:** every journey is HUMAN-ACCEPTED with no blocking issue.

**Phase 7: L1**
- **The test:** D-031's L1 (one school, 400 simulated active students, the whole-journey scenario and its pass criteria).
- **Where:** on staging at production's compute tier, never while people are testing (D-036).
- **Not:** a 10,000-student optimisation.
- **Exit:** L1 passes on the release candidate.

**Phase 8: Controlled production and the pilot**
- **Before the release:**
  - the upgrade is rehearsed from production's exact level;
  - the configuration is verified;
  - a restore is proven;
  - monitoring is verified;
  - Level 3 is green on the release candidate;
  - staging acceptance and L1 are complete;
  - the existing-staff transition is rehearsed and the sole production admin's break-glass tested (D-054(e));
  - password sign-in is released only with working recovery (D-058(b));
  - every email meets the polished bar (D-079(f)).
- **Then:**
  - release `main` to production through the rehearsed path;
  - production holds only the pilot group, provisioned through the operator path;
  - the pilot runs with 3–5 real educators (D-058(b));
  - L2 and above gate wider onboarding (D-031).

---

# REMAINING OWNER RULINGS

1. **Accept this final path as the temporary recovery charter,** once ChatGPT has accepted or rejected the amendments.
2. **Confirm how schools are born in 4.0:** a PINTAR-operations function, through a scripted and audited operator path, with no school self-registration. Any school-creation screen is 4.5+. SYS-03 allows either way; this picks one.
3. **Approve the scope inventory** at Phase 1's exit.

**One-time actions only Yazid can do** (actions, not rulings):
- create the staging test mailbox on PINTAR's mail domain and enter its credentials as a GitHub secret;
- set a GitHub Actions budget alert.

---

# DISAGREEMENTS WITH CHATGPT

**NO MATERIAL DISAGREEMENTS.**

The amendments above still need ChatGPT's acceptance. The one closest to its stated concern is Level 3's trigger (§6). If ChatGPT prefers "relevant main integration", the minimum I would hold is that relevance is decided by file paths, never by judgment.

---

# SAFE TO FREEZE?

**YES**, for the final version above.
- **It is consistent with the existing rulings:**
  - D-013, D-031, D-036 and D-052;
  - D-054, D-058, D-062(a) and D-079;
  - SYS-03.
- **It keeps the agreed 4.0 scope,** with no expansion and no MVP cut.
- **Every phase has an exit that a machine or a named person can check.**
- **If ChatGPT rejects an amendment,** only that item reopens, not the path.

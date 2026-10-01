# PINTAR 4.0 recovery charter

**The temporary governing document for the PINTAR 4.0 recovery.** Accepted by Yazid on 1 October 2026 (D-084), from the convergence review of Claude and ChatGPT.
- Where it conflicts with an earlier document, the charter governs until Phase 8 closes.
- The conflicts found so far, and how they resolve, are in `PHASE-1-STATUS.md` §5.

**Authorised now:** Phases 0 and 1 only. Phase 2 starts only when Claude, ChatGPT and Yazid agree that Phase 1 is sound.

## The principles

- **One measure of progress:** can PINTAR's users complete the connected journey?
- **This is not an MVP and not a rebuild.**
  - The full agreed 4.0 scope stays, as `PINTAR-4.0-SCOPE-INVENTORY.md` lists it, including the owner rulings M1–M10 and T1–T4 (D-085).
  - The architecture, security work, features, migrations, history and the lanes' useful work are preserved.
- **What moves back is knowledge, not code:** confidence, status, evidence, process, sequencing and the definition of done.
- **Development is journey-driven, not ticket-driven.** Depth comes before breadth.

## The package

| File | What it holds |
|---|---|
| `RECOVERY-CHARTER.md` | This path |
| `PINTAR-4.0-SCOPE-INVENTORY.md` | What 4.0 must do, journey by journey, each line with its source |
| `EVIDENCE-MODEL.md` | BUILT, TESTED, DEPLOYED, JOURNEY-PROVEN, HUMAN-ACCEPTED; the test levels |
| `JOURNEY-OWNERSHIP.md` | Journey → owner → specialists → independent reviewer |
| `RECOVERY-BOARD.md` | The compact operational board |
| `GOLDEN-SCHOOL-CONTRACT.md` | The Golden School's rules, the C1–C3 decisions and the spine |
| `PHASE-1-STATUS.md` | The Phase 0 evidence, the walk-back, conflicts, missing requirements and owner actions |

## Standing rules

1. **No engineering item is complete if its acceptance requires Yazid to perform a technical operation.**
2. **The owner of a journey builds it, the machine decides, and another agent reviews what the test asserts.**
   - Every new test or instrument records a controlled red before its green counts.
   - ChatGPT reviews at phase exits, and whenever Yazid asks.
3. **No new people on production until the Phase 8 release.**
   - Sign-up is disabled and only provisioning creates people, so no mechanism is needed.
   - Only genuine security or operational containment may touch production earlier, with Yazid's approval.
4. **Held work lands only when it closes a mapped journey break, through the new gate.** It never lands merely because it exists.
5. **New discoveries are classified against the inventory:**
   - a DEFECT is fixed in 4.0;
   - a MISSING REQUIREMENT goes to Yazid;
   - an ENHANCEMENT goes to 4.5 or later.

   Only Yazid reopens 4.0.
6. **Decisions go to `DECISIONS.md`** only when a product or architecture ruling is needed. Status is generated from runs, not written as prose.

## The path

**Phase 0: Freeze and contain.**
- **Development stays paused.**
- **Preserved:**
  - `main`;
  - the held lane commits;
  - staging and production;
  - the audit evidence.
- **No feature work.**
- **No new people on production** (rule 3).
- **Exit:** Yazid accepts this charter. *Done 1 Oct (D-084).*

**Phase 1: Reset the development system.**
- **The parts:**
  - the scope inventory;
  - the evidence states, with the existing status walked back;
  - journey ownership;
  - independent verification;
  - Yazid removed from the relay;
  - the compact board;
  - the Golden School decisions;
  - the test levels;
  - the status model.
- **Exit:** the Phase 1 package, reviewed by ChatGPT and accepted by Yazid; the inventory approved; the one-time owner access done.

**Phase 2: Build trustworthy instruments.**
- **The harness and the journeys:**
  - The audit harness fails on a required FAIL or BLOCKED step.
  - Browser journey slices (Level 2).
  - Staging takes `main`'s code and migrations without a manual step, and every Level 3 run asserts it.
- **Environment, email and visibility:**
  - An environment-facts check covers Vercel and both Supabase projects (drift is red).
  - Email is verified on both paths. Each SMTP secret has one source, and `staging.yml` no longer overwrites it blindly.
  - Error visibility starts from the logs Vercel and Supabase already keep.
  - Scheduled smoke checks run, with budget and runner alerts.
- **Rehearsals:**
  - the production upgrade, from production's exact level (111 migrations), on a scratch copy;
  - a backup restore.
- **Tooling for the Golden School:** the C1 operator script and workflow, and the C2 mailbox reader.
- **Testing in proportion:**
  - Keep the security, tenancy, authorization, concurrency, integrity and cryptographic tests.
  - Prune a test only when a test that runs the code covers its claim, or when it guards nothing. Never prune a security test during the reset.
- **Exit:** red means broken; green has a defined meaning; every instrument has a recorded red.

**Phase 3: The Golden School (red baseline).**
- **Run current `main` unchanged,** under `GOLDEN-SCHOOL-CONTRACT.md`. Expect red.
- **Labelled bypasses** map the breaks beyond the first, and each bypass is a FAIL.
- **Human observation begins:** Yazid uses a school created through C1, from the front door.
- **Exit:** a recorded baseline: how far the chain gets unaided, and the map of breaks beyond it.

**Phase 4: Repair the rivers and bridges.**
- **Fix in journey order,** the first unaided break first.
- **Known later breaks may be worked in parallel,** one per owner, each proven at Level 2. A break closes only when the unaided Level 3 run passes through it.
- **Held work lands only when it closes a mapped break.**
- **Progress is reported as:** "yesterday the Golden School reached here; today it reaches here."
- **Take a first L1 measurement once the spine passes.** It is a measurement, not optimisation.
- **Exit:** one admin, one teacher and one student complete the whole chain unaided, JOURNEY-PROVEN on the deployed commit.

**Phase 5: Complete the full agreed 4.0.**
- **What remains:** every remaining inventory line, including:
  - Identity Gates 4–8;
  - the head of department, dean and platform-admin journeys;
  - the educator-as-learner package;
  - support.
- **Each line attaches to a journey** and is proven at Level 3.
- **The phase closes with the UI/UX polish pass** and the email standard (D-052, D-079(f)).
- **Exit:** every inventory line is JOURNEY-PROVEN.

**Phase 6: Human acceptance on staging.**
- **Who:** Yazid, then Dr Gladys, each on a school created through C1, from the front door, with no technical help.
- **Exit:** every journey is HUMAN-ACCEPTED with no blocking issue.

**Phase 7: L1.**
- **The test:** L1 under D-031's scenario and pass criteria, on staging at production's compute tier, never while people are testing (D-036).
- **The size:** D-035 sized L1 to the first real cohort (about 1,000 students). D-083 left that cohort open for Yazid, so L1's size is the size of the first real deployment (owner ruling O3, `PHASE-1-STATUS.md` §6).
- **Exit:** L1 passes on the release candidate.

**Phase 8: Controlled production and the pilot.**
- **Before the release:**
  - the upgrade is rehearsed from production's exact level;
  - the configuration is verified;
  - a restore is proven;
  - monitoring is verified;
  - Level 3 is green on the release candidate;
  - staging acceptance and L1 are complete;
  - the existing-staff transition is rehearsed and the sole production admin's break-glass tested (D-054(e));
  - password sign-in is released only with working recovery (D-058(b));
  - every email meets the standard (D-079(f));
  - the production keys have verified offline copies (D-066).
- **Then:**
  1. Release `main` through the rehearsed path. Production holds only the pilot group, provisioned through C1.
  2. A walk by 3–5 real educators (D-058(b)).
  3. The observed educator pilot of about 20–30 (D-052(b)).
  4. Wider onboarding, gated by the capacity levels (D-031, D-035).

# Journey ownership

**1 October 2026 (Phase 1; D-084).** Completion is owned per journey, not per lane.

**Backend PASS plus frontend PASS is not journey PASS.**

## 1. The rule

**One journey, one journey owner, one integration branch.**

- **The owner** builds the journey's integration, including its database, server and screen changes, and its Level 2 proof.
- **One branch.** The changes travel together on one branch and pass the journey's Level 2 slice before the merge.
- **Specialists contribute** commits to that branch, or review it. Bob stays the server, data and security specialist; Daisy the UI, UX, words and design specialist; Lana the content specialist.
- **The machine decides.** A journey passes only on machine evidence (`EVIDENCE-MODEL.md`).
- **The owner never certifies their own work.** An **independent reviewer**, another agent with repository access, checks two things:
  - that the journey test asserts the intended user outcome;
  - that its controlled red was recorded (the test was shown able to fail).
- **Assignment.** Owners are an engineering assignment made by the coordinator on the board, not a ruling for Yazid. An owner changes only by a board line.

## 2. Assignments

| Journey | Owner | Specialists | Independent reviewer |
|---|---|---|---|
| J1 Platform operation (incl. the C1 operator path) | Bob | Coordinator (the workflow) | Coordinator, reviewing Bob's test assertions |
| J2 Identity: activation, sign-in, sessions, sign-out, recovery | Bob | Daisy (screens, words, the six emails) | Coordinator |
| J3 School setup | Daisy | Bob (roles, permissions, the pass-mark table) | Coordinator |
| J4 Content | Daisy | Bob (import, releases); Lana (real workbooks) | Coordinator |
| J5 Teaching (incl. Uji Cepat) | Daisy | Bob | Coordinator |
| J6 Learning and assessment | Bob | Daisy | Coordinator |
| J7 Evidence and reporting | Daisy | Bob (metrics) | Coordinator |
| J8 Certificate and verification | Bob | Daisy (the certificate as designed) | Coordinator |
| J9 Educator as learner | Bob | Daisy; Lana (demonstration content) | Coordinator |
| J10 Help and support | Daisy | Bob | Coordinator |
| X Cross-cutting qualities | Each journey owner, for their journey | Daisy (language, terminology, responsive, feedback); Bob (authorization, audit, privacy, performance) | Coordinator |
| R Instruments, Golden School runner, environments, release path, capacity | Coordinator | Bob (migrations, upgrade rehearsal, load) | **Bob** reviews the coordinator's instruments; ChatGPT at phase exits |

**Why this split:**
- Bob owns the journeys whose breaks are mostly server-side: identity, the engine, certificates, the operator path.
- Daisy owns the journeys whose breaks are mostly screens and flows.
- The coordinator owns the instruments, and is reviewed by Bob, so the instruments' author is not their only judge.

## 3. Who does what

| Role | Does | Does not |
|---|---|---|
| **Journey owner** | Integrates the journey on one branch; writes its Level 2 slice; records the slice's controlled red; hands off | Certify their own journey |
| **Specialist** | Contributes to the owner's branch, or reviews it | Declare a journey complete |
| **Coordinator (Second Eye)** | Assigns owners on the board; reviews journey tests; owns and runs the instruments and Level 3; merges to `main` | Judge their own instruments alone |
| **Machine (Levels 1–3)** | Decides pass or fail | — |
| **ChatGPT** | Independent review at phase exits, and whenever Yazid asks | A per-ticket relay |
| **Yazid** | Product and scope rulings; product observation; human acceptance; credentials and access that are legitimately owner-controlled | The message bus, SQL operator, DevTools tester, API harness, CI interpreter or environment verifier |

## 4. Communication without Yazid

- **The coordinator writes to Bob, Daisy and Lana directly** through cross-session messages.
  - FACT, 1 Oct: all three sessions are on the same account, with cross-session messages available.
- **Agents report** through `RECOVERY-BOARD.md` and their hand-off notes in git.
- **The coordinator reads the board** on its own schedule. A routine is set up when Phase 2 starts.
- **Hard rule: no engineering item is complete if its acceptance requires Yazid to perform a technical operation.**
- **The one exception** is the short one-time list of owner-controlled access in `PHASE-1-STATUS.md` §7, done once, before Phase 2.

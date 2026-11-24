# Ruling 83 · Test-environment reliability: the lessons, and the plan (Bob, 23 Nov 2026)

**The owner's objective:** spend engineering time improving PINTAR, not repairing the environment used to test it. Learn once, improve the process, and avoid repeating the same failures.

**The boundary:** Z9 is not interrupted or widened. Z9 finishes under its existing gates. This work is built on its own branch, and it applies from the next development round onward.

## 1 · What went wrong (Z and before)

| # | Incident | Where | What it cost | Root cause |
|---|---|---|---|---|
| I-1 | Docker daemon died; the stack was gone mid-run | Stream B (twice, 23 Nov afternoon); stream A's ec082bc4 pre-flight (VOID, 16:18Z); C3w-1 | One full pre-flight voided; reruns | The session container restarts, and containerd and dockerd are not brought back automatically |
| I-2 | A run on a database another run had already used: fable03 aborted, A2A-C705/C709 collided | Stream A, 12:25Z | One static run, and the owner's question | The db suites are not re-runnable on a used world, and nothing forced a reset first |
| I-3 | A stale `next-server` on :3999, built before the merge, served the captures | Stream A, Z3-A captures | One capture retake, and a false «Menga jar» report | A leaked process held the port, and the harness did not check what answered |
| I-4 | Registry rate limits, and missing database images, at stack start | Owner-reported, recurring | Runs failed before testing anything | Images are pulled at run time, not checked or cached beforehand |
| I-5 | Temporary files and build output accumulate until the disk allowance is spent | Owner-reported, recurring | Writes fail mid-run | Nothing cleans abandoned clones, builds or captures |
| I-6 | An environment failure reads like a test failure | All of the above | Diagnosis time, and a risk to the evidence | The runner records a red row whether the cause is the code or the machine |

## 2 · The improvements, each with how it is proved

| # | The owner's point | The improvement | How it is verified |
|---|---|---|---|
| P-1 | Images available first | `scripts/dev/siap.sh` (a readiness gate): checks that every image the stack and the tests need is present locally, pinned by digest, and pulls missing ones with backoff before anything starts. A run does not start until the gate prints READY | Remove one image, then run: the gate names it and pulls it, or stops with «image missing» before minute one. A rate-limit response is retried with backoff, then reported as INFRA |
| P-2 | Safe automatic cleanup | `scripts/dev/bersih.sh`: removes only what the harness itself created (clones carrying its prefix, its build directories, its capture scratch), older than the current run, and **never** anything under `docs/`, `z-evidence/` or any committed path. It runs a disk check before each expensive run (a minimum free allowance) | Plant abandoned clones and a large build directory: they are removed, and a planted evidence file is untouched (Sharon's check). Fill the disk below the minimum: the run refuses to start, with «disk», instead of failing mid-run |
| P-3 | Reliable start and recovery after a container restart | `siap.sh` also detects a dead runtime and restarts containerd and dockerd, brings the stack up, waits for health (database, auth, Mailpit), and frees the app port of any leaked server (I-3) | Kill dockerd, then run: it recovers without a person. A leaked server on :3999 is found and stopped |
| P-4 | Detect problems early | The pre-flight runs `siap.sh` first, then a heartbeat every few minutes during the run (runtime alive, database answering, disk above the minimum). The first lost heartbeat stops the run at once | Kill the runtime mid-run: the run stops within one heartbeat and marks itself INFRA, instead of running on for an hour |
| P-5 | Infrastructure failures kept apart from defects | Every row carries its cause: PASS, FAIL (the code), or INFRA (the machine, with the signal that proved it). A run with any INFRA row is VOID as a whole and never counts as red or green evidence. The forced reset before db suites removes I-2 | Replay I-1 and I-2: both classify as INFRA or VOID, never as FAIL. A real planted defect still reads FAIL. The evidence folder keeps every run, VOID included, as now |

## 3 · Ownership

| Role | Who | What |
|---|---|---|
| **Builds** | **The Z-UX builder** (stream B; its Z work is complete), on its own branch `claude/infra-83` from `claude/z` f5700bd1 | P-1 to P-5, each red first with a planted failure |
| **Reviews the design and the proofs** | **Second Eye** (stream A), who lived these incidents. **After Z9**, so Z9 is not disturbed | That each proof reproduces the real incident |
| **Reviews safety** | **Sharon** | That cleanup can never remove evidence, committed files or anything it did not create, and that no secret is logged |
| **Coordinates** | **Bob** | Merges it into the next round's base after both reviews; records it in the master sequence |

**Nothing here touches staging, production, CI's required checks or the repository's protections.** It changes only local dev scripts and the pre-flight runner.

## 4 · When

- **Now:** this record, and the builder starts on its own branch. It runs in its own container, so it shares nothing with Second Eye's Z9 run.
- **After Z9:** Second Eye's review, then Sharon's, then the merge into the next round's base.
- **From the next round:** every expensive run starts with `siap.sh` and runs with the heartbeat. VOID is a recorded outcome.

## 5 · Ruling 86's addition (23 Nov 2026): when the local machine cannot hold a long run

**The observation:** Z9's local pre-flights were interrupted by session-container restarts roughly every hour:
- ec082bc4 at about 16:06Z;
- 7615d6b1 at about 21:18Z (uptime 143 s at 21:20Z);
- plus restarts during the C3w-1 and stream B work.

They also hit a full disk (16 GB of stale /tmp) and registry refusals after a restart.

**The lessons, added to the plan:**
- **L-1 · Find the cause before rerunning.** Record uptime, cgroup memory events (`oom_kill`) and disk at the start of a run and at every heartbeat (P-4), so a restart has a named cause: a memory limit, a session lifetime, or something else.
- **L-2 · Size runs to the machine.** If the container cannot hold a run of about an hour, a long run on it is a gamble, not verification. Either the run is split into groups that each fit (with Sharon confirming equivalent coverage), or it runs where it can complete.
- **L-3 · GitHub Actions is the stable executor for full verification.** CI already runs the equivalent, and stricter, set: lint, typecheck, build and build identity; clean and upgrade-path migrations; every plant in the red-case matrix; and the whole manifest with no skips. From the next round, **the local pre-flight is the fast filter and CI is the authoritative full run**, unless Sharon finds a coverage gap.
- **L-4 · Never launch a long run on unchanged conditions after an infrastructure failure.** The readiness gate (P-1/P-3) and the VOID class (P-5) enforce this.

**L-5 (23 Nov, 22:41Z): the restarts are not a fixed cycle, and memory is ruled out by measurement.**
- Restart #7 came 16 min after #6, out of a healthy VM: MemAvailable 14.6/16 GB, oom_kill 0, nothing in dmesg.
- **Leading hypothesis:** the cloud session is suspended or reclaimed when it goes idle. A long run left in the background after the agent's turn ends is not protected.
- **Test it:** correlate each restart time with the session's turn ends.
- **If confirmed:** keep the session active for the whole run (wait on the run within the turn, rather than ending the turn), or run it on CI.
- **For the next round:** preflight.sh's L-2 warning names this.

**L-6 (23 Nov, 23:42Z; Second Eye's review): a planted proof isn't the incident.**
- The restart-recovery proof killed processes within one boot, and passed.
- A real reboot leaves a stale `/run/containerd/containerd.sock`, which stops dockerd from starting. The gate failed after 60 s, and only removing the socket fixed it.
- **The rule from now on:** every infrastructure fix is also proved against the real incident where it can be reproduced. Here that is easy: the session reboots whenever it goes idle.
- Also from the review: the registry signals must cover all of today's real refusal texts (Docker Hub 429, public ECR «Data limit exceeded», the GHCR proxy block), not only the 429.

## 6 · Reviews complete (24 Nov 2026)

- **Sharon (safety):** PASS at `7696819e`, addendum at `a3bc9516`.
- **Second Eye (design and proofs):** **PASS at `8a1293be`**, 24 Nov 00:3xZ.
  - N-4: his three app-style proxy refusals read FAIL; today's four real registry refusals (Docker Hub 429, public ECR, GHCR single-line and three-line) read INFRA; «Docker daemon not running» reads INFRA.
  - The restart-recovery fix (B-1) held on two real reboots, one per kind of leftover socket, and on the builder's own reboot.
  - The missing-dependency message names `npm ci`.
  - Scope since his last check: two scripts and six documents under the ruling 83 folders, nothing else.
- **Next:** `claude/infra-83` at `8a1293be` merges into the next round's base (not main) when that round opens.

**L-7 (24 Nov, the builder, during the audit-79 harness): the app can start before the stack is ready.**
- After a reboot, `siap.sh` reported READY, but the app started before the stack had printed its keys.
- It came up without the service-role key, so every sign-in failed with «PINTAR sedang tidak dapat memproses ini».
- The builder caught it from the log, restarted the app, and kept no capture from that window.
- **Follow-up for the next base:** the app's start waits for the stack's keys, or `siap.sh` checks that the app's environment has them. Red first.

**L-8 (24 Nov, the owner, after D2-R's red journeys; Z's c4c8f792 was the same): «What else did that change?» includes the tests.**
- When approved behaviour or wording changes, **every dependent test is examined before expensive verification starts**.
- **This applies the sibling-defect principle to the whole suite**, journeys included. It is not a new procedure.
- **In practice:**
  - With each product change, the builder searches the whole test tree for the strings, keys, routes and behaviours it changes: the journeys (`audit/`, the journey scripts), selftest, and the static guards.
  - The builder updates each dependent expectation in the same batch, before the hand-off.
  - Each replacement **proves the new behaviour**; it never simply removes the old assertion.
- **The hand-off names this sweep and its result** ("dependent tests: N found, N restated"), and Bob checks for it before sending the batch to review.

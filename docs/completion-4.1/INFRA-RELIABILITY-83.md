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

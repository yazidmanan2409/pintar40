# Ruling 83 · The proofs (the Z-UX builder, 23 Nov 2026)

> **What is built** on `claude/infra-83`, from `claude/z` `f5700bd1`. Only local dev scripts, no app code:
> - `scripts/dev/siap.sh`: the readiness gate (P-1, P-3), plus the heartbeat P-4 uses.
> - `scripts/dev/images.lock`: the six images, pinned by digest.
> - `scripts/dev/bersih.sh`: the cleanup (P-2).
> - `scripts/dev/preflight.sh`: the pre-flight runner (P-2, P-4, P-5).
> - `scripts/dev/kelas.sh` (how a failure is classed, after S-1) and `scripts/dev/tapis.sh` (keys stripped before any
>   log, S-2), both sourced.
> - `scripts/dev/README.md` gains a section on using them.
>
> **Every proof planted its failure in this builder's own container, and each was seen red before green.** Nothing
> ran on Second Eye's machine, staging, production or CI. Each proof's full output is in `bukti-<name>.txt`, written
> by `bukti.sh <name>`.

## The proofs

| Plan | Incident | Planted | Red (the failure, caught and named) | Green | File |
|---|---|---|---|---|---|
| P-1 | I-4 | `docker rmi` of the pinned `postgrest/postgrest:v16.2` | `siap.sh --tanpa-pulih`: **INFRA image: postgrest/postgrest:v16.2 is not present with sha256:8525…** (rc 3, before anything starts) | `siap.sh` pulls it **by digest**, checks the digest, then READY | `bukti-image.txt` |
| P-1 | I-4 | a registry answering every pull with 429 (a `docker` shim on PATH; every other docker command passes through) | 4 tries, waiting 2, 6 then 18 s, then **INFRA registry: the registry refused axllent/mailpit:v1.31.3 after 4 tries with backoff (rate limit)** (26 s) | the registry back: pulled by digest, READY | `bukti-registry.txt` |
| P-2 | I-5 | 5 abandoned harness folders aged 3 h: a red-case clone with a 512 MB build inside, a 256 MB scratch folder, a plants scratch folder, a clone holding an **untracked evidence file** under `docs/…/z-evidence/`, and a scratch folder holding `z-evidence/`. Plus one fresh harness folder, one folder whose name no harness file creates, and an evidence file in the checkout | the dry run lists the 3 removable folders (964 MB) and removes nothing | `--hapus` removes those 3 (964 MB). All 5 files that must survive do. The index and `git status` are byte-identical before and after | `bukti-clean.txt` |
| P-2 | I-5 | a 3 GB file filling the disk past a minimum set 2 GB under free space | `preflight.sh`: **INFRA disk: 51.6G free on …, below the minimum of 52G**, **RUN VOID** in 2 s, before any step | the file removed: READY | `bukti-disk.txt` |
| P-3 | I-1 | `pkill -9` of dockerd and containerd | `siap.sh --tanpa-pulih`: **INFRA runtime: docker does not answer** | `siap.sh` restarts containerd and dockerd and brings up the stack and Mailpit. READY in 27 s, with no person | `bukti-dockerd.txt` |
| P-3 | I-3 | a production `next-server` started on :3999 and abandoned | `--tanpa-pulih`: **INFRA port: 3999 is held by a leaked app server (pid …)** | `siap.sh` stops it and :3999 is free. A port held by something else (a Python server) is **named, not killed** | `bukti-port.txt` |
| P-4 | I-1 | dockerd **alone** killed 20 s into the whole suite (containers keep running, so the suite runs on, as in I-1) | heartbeat every 15 s: lost at 19:31:37, **11 s after the kill**. The step is stopped (no process left), **INFRA suite: heartbeat lost after 37s: runtime**, plants and red-case **NOT RUN**, **RUN VOID** | `siap.sh` recovers it | `bukti-midrun2.txt` |
| P-4/P-5 | I-1 | dockerd and containerd killed 20 s into a db suite (the database drops, the suite exits rc 1 by itself) | the suite's rc 1 is **not** read as FAIL: the end-of-step heartbeat finds the runtime gone, giving **INFRA suite: the machine was lost by the end of the step**, RUN VOID | | `bukti-midrun.txt` |
| P-4/P-5 | I-1 | the same kill, landing in the forced reset | **INFRA suite: forced reset failed: runtime: …**, RUN VOID | | `bukti-midrun-saat-reset.txt` |
| P-5 | (control) | a real code defect: one word of the EN text `Z-T03-01` pins, on a healthy machine | **FAIL suite: FAILED Z-T03-01 …**, the row classed FAIL, **RUN RED**: the code's failure stays the code's | reverted, no diff | `bukti-defect.txt` |
| P-5 | I-2 | (see below) | | | `bukti-usedb.txt` |

## I-2: a run on a used database

**The incident reproduced, then was removed.** Each run was planted on the same container.

| Run | World | Result | File |
|---|---|---|---|
| 1 | the whole suite on a forced-reset database, which leaves the world used | 1389 rows: 1386 PASS, 3 FAIL (C3W-C32, C36, C310; see below) | `bukti-usedb-run1*.txt` |
| 2, the old way | `F01-*,F02-*,F03-*,A2A-C*` on that used database, **no reset** | **I-2 exactly:** «runner aborted: PL/pgSQL function selftest.run_fable03() line 19», and **505 rows read FAIL**. Before the fix below, that was evidence against the code | `bukti-usedb-run1-kelas-ulang.txt` |
| 3, as the pre-flight now runs it | the same selection, same used database, **forced reset first** | **96 PASS, 0 FAIL, RUN GREEN** | same |
| 1 again | the whole suite on a forced-reset database | **1388 PASS, 0 FAIL, RUN GREEN** (the three C3W rows passed this time) | `bukti-usedb.txt` |
| 2 again, after the fix | the old way repeated (`--tanpa-reset`) on that used database | at the time, **INFRA suite: world … RUN VOID**. **Superseded by S-1:** it is now RED, with the world INFRA beside it (see «Sharon's safety review») | same |
| 3 again | forced reset first | **96 PASS, RUN GREEN** | same |

**The fix after run 2, since superseded by S-1.** For a time, a step run with `--tanpa-reset` was classed INFRA, so
the run was VOID. Sharon's S-1 (a) makes FAIL rows take precedence, so such a run is now RED with the world INFRA
listed beside it. The forced reset before every db step is what keeps I-2 from happening.

**Two replays that did NOT reproduce I-2,** kept for the record: `F01-*…F05-*` twice, and `F01-*…F03-*,A2A-C*` twice,
without a reset in between (`bukti-usedb-f01-f05.txt`, `bukti-usedb-targeted.txt`). Those suites leave nothing that
breaks a second run. The whole suite does.

**C3W-C32, C36 and C310: already root-caused, so no audit item.** They failed in run 1's whole suite with «invalid
input syntax for type uuid: ""; the scenario did not run». They passed alone (24/24, `~/pintar-preflight/c3w-sendiri`)
and in the next whole-suite run (1388/0). That matches the cause found by ruling 84 and fixed on `claude/z` in
`367ff569`, which `f5700bd1` predates. The world's two generated drafts were the package's first two questions by
uuid order. About 1 time in 10 both were POST_TEST questions, `c1.xs` stayed empty, and an unguarded cast stopped the
whole world. `main` has the same fault. The runner rightly classed the rows FAIL, because the machine was healthy:
it was a test's own intermittent, not the infrastructure.

## What the proofs turned up in the scripts themselves (fixed before the records above)

- **The suite's rows were read by column.** `run.ts` pads ids to 11 characters, so every longer id (PENUTUPAN-…,
  UX1-MASUK-…) pushed its status out of place, and run 1 first read «216 FAIL» where the suite itself said 3. Rows are
  now split on whitespace. Run 1's kept log was classed again with the fixed parser
  (`bukti-usedb-run1-kelas-ulang.txt`): 3 FAIL, the same 3 the suite printed.

- **`lsof` cannot see a listener in this sandbox.** The first port proof printed «3999 ok (free)» while a leaked
  `next-server` held the port. The gate now asks `fuser`; `ss` is not installed.
- **The rate-limit test matched «429» inside a digest's hex.** It now needs `toomanyrequests`, `429 Too Many Requests`
  or `rate limit`.
- **The cleanup's own `git status` refreshed a clone's index,** which made the clone look recently used. It now runs
  with `GIT_OPTIONAL_LOCKS=0`, which reads without writing.
- **Free space was rounded to whole gigabytes,** so the refusal read «52G free, below the minimum of 52G». It now
  prints one decimal.

## Sharon's safety review (INFRA83-SAFETY-c1f04845): S-1, S-2, N-1 to N-3

Every fix below was seen red first, each red against the scripts as they stood at `61bb1e3e`, before the fix.

| Item | Planted | Red (61bb1e3e) | Green (now) | File |
|---|---|---|---|---|
| **S-1 (a), (c)** | a suite log with a real defect row, a simulated INFRA row («Cannot connect to the Docker daemon») and a «facility missing: app» row | the INFRA row collapses the suite into **one INFRA row** and VOID is checked before RED: **RUN VOID**, the defect hidden | `kelas.sh`, healthy machine: 2 FAIL rows (the defect, and the facility signal on a healthy machine), 1 INFRA beside them: **RUN RED**. On an unhealthy machine: 1 FAIL and 2 INFRA, still **RUN RED**. Without the defect row on an unhealthy machine: **RUN VOID** (VOID only when nothing failed) | `bukti-s1-baris.txt` |
| **S-1 (b), (c)** | a real code defect that stops `next start` (`src/instrumentation.ts`: `register()` exits the process), on a healthy machine, with one app test selected | the run reads «facility missing: app» as **INFRA suite … RUN VOID** | the machine is healthy through the step, so the row is **FAIL (a facility signal, on a healthy machine)**: **RUN RED**. The plant is removed and `src` is clean | `bukti-s1-start.txt` |
| S-1, control | a defect in a pinned EN string (`Z-T03-01`), on a healthy machine | | FAIL, **RUN RED** | `bukti-defect.txt` |
| S-1, control | dockerd killed mid-suite | | a heartbeat lost, **INFRA**, the later steps NOT RUN, **RUN VOID** (no row failed) | `bukti-midrun2.txt` |
| **S-2** | an `npx` shim that makes `supabase start` print planted keys (JSON and a `JWT secret:` line), with the stack stopped | the planted keys reach `$TMPDIR/pintar-siap-log/supabase-start.log` | after `tapis.sh` filters the output before it is written, the files holding a planted key are **(none)**. The log shows 12 «redacted» and 0 key shapes. Each gate also scrubs what older versions left in that folder, and `redact()` now covers it too | `bukti-s2.txt` |
| **N-1** | a harness file creating the prefix «ab», and an aged `/tmp/abN1pl4x` | the dry run would remove `/tmp/abN1pl4x` | «refusing the harness prefix «ab» (shorter than 4 characters)», and the folder survives `--hapus` | `bukti-nits.txt` |
| **N-2** | an abandoned red-case clone with a commit that no branch or tag reaches | the dry run would remove it (196 MB) | «keep … a clone whose HEAD (0fd97f1a) no branch or tag reaches». It survives `--hapus` | same |
| **N-3** | a server named `next-server` on :3999, owned by `nobody` | `siap.sh` stops it | **INFRA port: … an app server of another user (pid …, uid 65534): not stopped**, and it is still running. Both scripts now say they are for a single-user sandbox | same |

**The rule now** (`scripts/dev/kelas.sh`, sourced by `preflight.sh`):
- RED takes precedence. Any FAIL row makes the run RED, and its INFRA rows are listed beside it.
- A failure is INFRA only in two cases: the machine was not healthy through the step (a heartbeat lost, or not READY at the step's end), or its signal is one code cannot produce (the runtime gone, a registry refusal, a REBOOT found by the next gate).
- The other signals are FAIL on a healthy machine: a missing facility, a port in use, a refused database, a full disk. Code can cause each of them.
- After any INFRA row the remaining steps are NOT RUN.
- VOID only when there is an INFRA row and no FAIL.

**What S-1 changes in the I-2 replay.** Run 2 again, on a used database without a reset, is now **RED**: 508 FAIL rows,
with «INFRA suite world: the database was not reset» listed beside them. Under (a), FAIL rows are never hidden. This
replaces the «always VOID» rule I added after the first replay. The first replay's whole suite was GREEN (1388/0),
and the forced-reset replay was GREEN (96/0) (`bukti-usedb.txt`). The forced reset is what removes I-2:
`--tanpa-reset` exists only to replay it, and its INFRA row says why such a run's FAIL rows are suspect.

**A first S-1(c) plant that did not work.** `register()` throwing still let `next start` come up and serve 500s, so
both runners read a plain FAIL (`bukti-s1-start-register-throw.txt`). The plant that stops the server is the record
above.

**L-5** (from Bob's 22:50Z message). The size warning now also says «Keep the session active for the whole run (wait
on it within the turn: an idle session may be suspended or reclaimed, L-5), or use CI …» (`bukti-ukuran.txt`).

## Ruling 86's additions (L-1, L-2)

| Plan | Planted | Red | Green | File |
|---|---|---|---|---|
| L-1 | the boot marker and uptime read from planted files (boot A, uptime 3412 s). The suite and plants start under the heartbeat, then **everything is killed** (the run, the suite, the app, dockerd, containerd) and the marker reset (boot B, uptime 143 s): a simulated reboot | the run's record just stops: no RUN line, no cause, only the in-progress marker | the next gate prints **«the previous run ended by a REBOOT at …, after uptime 3412s (the previous boot's last beat: 22:45:30Z, oom_kill=0)»**. It appends **INFRA run: ended by a REBOOT … RUN VOID** to that run's SUMMARY, clears the marker and recovers the machine. A restart with no run in progress is named too | `bukti-reboot.txt` |
| L-2 | a trace of three earlier boots that stayed up 55, 62 and 68 min | the runner at `c1f04845` has no size check: a 100-min run starts silently | `--ukur` (and every run): **WARN size: estimated 101 min, but this machine stayed up a median 62 min over its last 3 boots … the stable route is CI (L-3) … Starting anyway.** A 4-min run fits, with no warning. With 1–2 min lifetimes planted, lint and typecheck warn **and then run** (GREEN): a warning, not a block | `bukti-ukuran.txt` |

**How it works.** Every gate and every heartbeat appends one line to `$HOME/pintar-preflight/jejak-mesin.log` (on
disk, so it outlives a restart; this container's real restart at 22:08Z kept `$HOME`). Each line holds:
- the boot id and the uptime;
- `oom_kill` since boot (`/proc/vmstat`) and the memory cgroup's own (v2 `memory.events`, or v1 `memory.oom_control`
  here);
- the cgroup's memory peak and failure count;
- free memory and free disk;
- the run it belongs to, and the check's result.

`preflight.sh` marks a run in progress (`berjalan`) and clears the mark when it finishes. A gate that finds the mark
and another boot id, or an uptime lower than the last line's, names a reboot. It gives the previous boot's uptime and
OOM count, which separates a memory kill from a session lifetime.

**How the estimate is made.** For each step, the estimate is its last measured length in the kept runs. A step never
measured uses a default: suite 25 min, plants 30, red-case 40, others 2. The machine's lifetime is the median of the
earlier boots' last uptimes in the trace.

**Two notes for review:**
- With a planted uptime, the printed reboot time (now minus uptime) comes before the last beat. On a real reboot the
  two agree, as the 22:08:15Z line in `bukti-ukuran.txt` shows: that is this container's real restart, named
  correctly.
- All 8 measured lines so far have `oom_kill`, `cg_oom_kill` and `mem_failcnt` at 0. They all come from after
  this container's 22:08Z restart, because the trace began then. So they say nothing yet about why the earlier
  restarts happened. The next restart under a traced run will be the first with a named cause: a memory kill shows as
  a rising `oom_kill` in the last beat; a session lifetime shows as none.

## For the reviewers

**Sharon (the cleanup's safety).** `bersih.sh` only considers a direct child of `$TMPDIR`. Its name must be one that a
harness file under `selftest/` or `scripts/dev/` creates, read from the source at each run, never from a list kept by
hand. It keeps a candidate in any of these cases:
- it is a symlink, or owned by another user;
- it is inside the checkout, or contains it;
- it was modified in the last 30 minutes;
- a running process has its working folder or an open file inside it;
- it holds `docs/` or `z-evidence/`; for a clone, any changed or untracked file there.

Its default is a dry run. `preflight.sh` calls it with `--hapus`. No secret is printed: `siap.sh` and `preflight.sh`
read the stack's keys into the environment only. `preflight.sh` also strips any key from its kept files at the end. A
search of every kept file and `bukti-*.txt` for a JWT or an `sb_secret_`/`sb_publishable_` key finds none.

**Second Eye (that each proof reproduces the incident), after Z9.** Open points:
- the pre-flight's output folder is `$HOME/pintar-preflight/<commit>-<UTC>`, outside the checkout and outside `$TMPDIR`
  (never cleaned), to be copied to `z-evidence/` as before;
- the Mailpit check expects the CI-style `mailpit` container on :54324;
- the heartbeat runs every 120 s by default.

## Sharon's addendum (PASS at 7696819e): three small items, one commit each

1. **An unreset RED names its limit.** A RED run made with `--tanpa-reset` now ends: «RED on an UNRESET world
   (--tanpa-reset): its FAIL rows are NOT attributed to the code until a run with the forced reset reproduces them.»
   Proof: the Z-T03-01 string defect run without a reset. Before this, the SUMMARY ended at «RUN RED» with no note
   (`bukti-tanpa-reset-catatan.txt`).
2. **`preflight.sh`'s header** now states the S-1 rule for `--tanpa-reset`: never GREEN; RED if a row fails, else VOID;
   FAIL rows not attributed until a reset run reproduces them. It no longer says «always VOID».
3. **`tapis.sh` redacts a URL's user and password** (`postgresql://postgres:postgres@…`, any `user:pass@`, and a
   password-only `:pass@`). Proof with planted lines: `tapis.sh` at `55fa2a14` passes all four through; now each reads
   `«user:password redacted»@`, a URL without user-info is untouched, and none is left (`bukti-tapis-url.txt`).

## Second Eye's review at 7696819e: the real-reboot blocker (I-1) and the registry signals (I-4)

| Item | Planted / observed | Red (7696819e) | Green (now) | File |
|---|---|---|---|---|
| **I-1 blocker** | the runtime dead, and `/run/containerd/containerd.sock` on disk with nothing behind it, as a real reboot leaves it on Second Eye's machine | **INFRA runtime: dockerd did not come back within 60 s**. dockerd's log: «failed to start daemon: failed to get containerd plugins: … dial unix /run/containerd/containerd.sock», exactly Second Eye's failure | «removed the stale socket /run/containerd/containerd.sock (nothing behind it …)», then the runtime, the stack and Mailpit come back: **READY in 29 s** | `bukti-soket.txt` |
| I-1, liveness | a live listener planted at the same path, the runtime dead | | «/run/containerd/containerd.sock is live (a process is behind it): kept». The listener keeps running; the gate reports INFRA runtime instead of removing it. Once the listener stops, READY | same |
| I-1, a real reboot | **this container really rebooted** at 23:36:20Z (boot `0a78ca62…` at uptime 4521 s, then `8b8ec0ed…`) | | the first gate in the new boot named it («a REBOOT at 23:36:20Z, after uptime 4521s … oom_kill=0»), restarted the runtime and was READY. **It did not reproduce the blocker:** here dockerd runs its own managed containerd, and the previous boot left no `/run/containerd/containerd.sock`. That is why the blocker's proof is the planted socket above | `bukti-reboot-nyata.txt` |
| **I-4** | Second Eye's three real refusal lines, verbatim (`review-second-eye/EVIDENCE.md` §5): Docker Hub 429; public ECR «failed to pull docker image from all registries: … error from registry: Data limit exceeded»; GHCR «… httpReadSeeker … Forbidden (agent proxy: no rule or network setting allows this host)». Also ECR's phrase alone, and two controls: the proxy's words alone, and the proxy refusing an app request to `api.example.com` | the ECR and GHCR lines read **FAIL**, as Second Eye found | all four registry refusals read **INFRA registry**. **Both controls stay FAIL**, because app code can be refused by the proxy too. So the proxy's words count only on a line that is an image pull: `ghcr.io`, `httpReadSeeker`, `/v2/`, `docker image` or `registr…` | `bukti-registri.txt` |
| I-4, the gate's pull | a pull answered with «Error response from daemon: error from registry: Data limit exceeded» | the gate reports **INFRA image: … could not be pulled** | the gate reports **INFRA registry: … (a rate or data limit, or the proxy blocking its host)** | same |

**How the socket fix works.** When the runtime is dead, `siap.sh` stops what is left of it. It then checks each
runtime socket (`/run/containerd/containerd.sock`, `/var/run/docker.sock`, dockerd's managed containerd sockets) and
each pid file:
- a socket is removed only if the kernel lists nothing bound to it (`/proc/net/unix`) and a connection to it fails;
- a pid file is removed only if its pid is not running.

A live one is never removed.

**The texts used for I-4** are Second Eye's real lines, verbatim. One narrowing, deliberate and for review: Bob asked
for the proxy's «Forbidden (agent proxy: …)» in SIG_MESIN, «the code under test never pulls images». But the proxy
gives the same words to any refused request, including an app's call to an outside host, which code can produce. So it
counts as INFRA on an image-pull line, and a bare or app-request line stays FAIL (S-1 (b)).

**`realtime` and `edge-runtime` are not in `images.lock`, and rightly so.** The pre-flight's stack starts with
`-x studio,imgproxy,realtime,edge-runtime,…`, as CI's `local-stack` does, so it never pulls them. Today's refusals for
`supabase/realtime:v2.130.0` and `edge-runtime:v1.74.3` came from a stack started without those exclusions.

**The size warning** now leads with «keep the session active for the whole run (… L-5), or use CI», then gives the
estimate.

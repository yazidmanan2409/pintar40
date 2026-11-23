# Ruling 83 · The proofs (the Z-UX builder, 23 Nov 2026)

> **What is built** on `claude/infra-83`, from `claude/z` `f5700bd1`. Only local dev scripts, no app code:
> - `scripts/dev/siap.sh`: the readiness gate (P-1, P-3), plus the heartbeat P-4 uses.
> - `scripts/dev/images.lock`: the six images, pinned by digest.
> - `scripts/dev/bersih.sh`: the cleanup (P-2).
> - `scripts/dev/preflight.sh`: the pre-flight runner (P-2, P-4, P-5).
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

USEDB-PENDING

## What the proofs turned up in the scripts themselves (fixed before the records above)

- **`lsof` cannot see a listener in this sandbox.** The first port proof printed «3999 ok (free)» while a leaked
  `next-server` held the port. The gate now asks `fuser`; `ss` is not installed.
- **The rate-limit test matched «429» inside a digest's hex.** It now needs `toomanyrequests`, `429 Too Many Requests`
  or `rate limit`.
- **The cleanup's own `git status` refreshed a clone's index,** which made the clone look recently used. It now runs
  with `GIT_OPTIONAL_LOCKS=0`, which reads without writing.
- **Free space was rounded to whole gigabytes,** so the refusal read «52G free, below the minimum of 52G». It now
  prints one decimal.

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

# Ruling 83 · test-environment reliability: SAFETY review — Sharon

**Work:** `claude/infra-83` at `c1f04845`: `scripts/dev/siap.sh`, `bersih.sh`, `preflight.sh`. Read-only, from the source.
I computed `bersih`'s live pattern list from the source at that commit.

**Verdict: PASS with conditions.**
- **(1) Cleanup:** PASS.
- **(2) Privilege:** PASS.
- **(3) Secrets:** PASS with one condition.
- **(4) VOID:** **FAIL as written.** A real FAIL can be reported as VOID, so S-1 must land before any run under this harness counts.

## (1) Cleanup: what it may remove. PASS

**"Created by the harness" is decided from the harness's own source,** read each run.
- It takes every `mkdtempSync(join(tmpdir(), "<prefix>"))` (prefix plus exactly six alphanumerics) and every ``join(tmpdir(), `…${pid}…`)`` (digits).
- At `c1f04845` that gives 21 anchored patterns, all specific: `dr150-*`, `pintar-redcase-<n>`, `pintar-selftest-fetch-<n>.log` and the rest. My scratchpad (`/tmp/claude-0`) and every non-harness name fail the regex.

**Its refusals are sound.** It removes nothing that is:
- a direct non-child of the temp folder;
- inside the checkout, or containing it;
- a symlink;
- owned by another user;
- modified within 30 minutes;
- in use (a process's cwd or open file);
- holding `docs/` or `z-evidence/`, or, for a worktree, holding changed or untracked evidence.

It also refuses outright if the temp folder resolves to `/`, `/home`, `/root`, `/usr`, `/etc`, `/var` or `/opt`. A dry run is the default.

**Nits, not conditions:**
- **N-1:** refuse a pattern whose literal prefix is shorter than four characters. A future `mkdtempSync(join(tmpdir(), "t"))` would otherwise widen it to any `t??????`.
- **N-2:** for a worktree, also keep it when its HEAD is not reachable from a ref of the main repository (`git -C "$real" branch -r --contains HEAD` or equivalent). `pintar-redcase-*` is `worktree add --detach` and normally holds no commit, but a hand-made commit there would be lost at the next `gc`.

## (2) Restarting the runtime. PASS

- `pkill`, `setsid nohup dockerd` and `rm` of the pid files run as the session's own user. They gain nothing beyond it, and fail without it.
- `sudo -n sysctl` uses only a passwordless sudo the session already has, and falls back to plain `sysctl` or nothing.
- **Nit N-3:**
  - the restart kills every `dockerd` and `containerd` the user can signal. That is right in this one-session container and wrong on a shared host, so state in the header that it is for a single-user sandbox.
  - the port step should also check that a leaked `next-server` is owned by the session's uid before it stops it.

## (3) Secrets in logs. PASS with condition S-2

- `preflight.sh` evaluates `supabase status -o env` without printing it, and `redact()` scrubs the anon and service-role keys from every kept file in `$OUT`.
- The pull output keeps only its last line, from an anonymous pull.
- The synthetic values (`CARD_PEPPER`, `CERT_SECRET_KEY_V1`, the SMTP sink) are CI's published test values, not secrets.
- **S-2:** `siap.sh` writes `supabase start`'s whole output to `$LOGDIR/supabase-start.log` (default `$TMPDIR/pintar-siap-log/`).
  - That output prints the local stack's keys and JWT secret. `redact()` does not reach that folder, and `bersih` never removes it, because it is not a harness pattern.
  - They are the local stack's default demo values, not live credentials. But the rule is "no credential in a log".
  - **The fix:** filter the output before writing (drop the key and secret lines), or run the same redaction on `$LOGDIR`.
  - **The test:** plant a log line carrying the service-role key, and show it is redacted.

## (4) The VOID rule. FAIL: condition S-1, blocking

**As written, any INFRA makes the run VOID, even when a classified FAIL exists.**
- In `run_step`, a suite with both FAIL and INFRA rows becomes one INFRA row, `VOID=1`, and `FAILED` is never set.
- `finish` then reports VOID (exit 3), «not a result».
- So a real code failure beside one infrastructure blip is reported as no result, and a re-run on a luckier machine can come back GREEN with the defect never named as RED. The FAIL row survives in `ROWS.txt`, but the verdict hides it.

**Two signals can also be caused by the code itself:**
- `facility missing: (app|build)`: a code defect that stops `next build` or `next start` makes the app rows report a missing facility, and they are classed INFRA.
- `EADDRINUSE.*:3999` can also be a code defect.

**S-1, the fix:**
- **(a) RED takes precedence.** A run with any FAIL row is RED, with its INFRA rows listed beside it, never VOID. VOID is only for a run with INFRA and no FAIL. The safe direction is a false RED, never a false VOID.
- **(b) The machine must be corroborated.** A row's signal counts as INFRA only when `siap`, or the heartbeat at the end of that step, is not READY, or the signal is one code cannot cause (the runtime gone, a registry refusal). `facility missing: app|build` and the port signal on a healthy machine are FAIL.
- **(c) Proofs, red first:**
  - a planted code defect plus one simulated INFRA row gives RED;
  - a planted defect that breaks `next start`, on a healthy machine, gives FAIL and RED, not VOID.

**Could reasonably have been anticipated:** this is ruling 83's own risk statement (a VOID must never hide a FAIL), so the rule needed a mixed-case proof from the start.

## Addendum · `7696819e`: S-1 and S-2 met, (4) now PASS (23 Nov 2026, 23:45 UTC)

**S-1 (`kelas.sh`): met.**
- **RED takes precedence:** `putusan` is RED whenever any FAIL exists, with INFRA rows listed beside it. VOID only with INFRA and no FAIL.
- **Two signal lists:**
  - `SIG_MESIN` (runtime, registry) is always INFRA;
  - `SIG_MUNGKIN` (disk, database, facility, port) is INFRA only when the machine was not healthy through the step, and otherwise FAIL with the signal noted.
- **The suite keeps its FAIL rows** and never collapses into one INFRA row. The reset step also gives FAIL on a healthy machine.
- Bob reports both proofs red at `61bb1e3e`, then green.

**The I-2 question: yes, that is the reading I intend.**
- An unreset world sets `VOID=1` on every db step, so an unreset run can never be GREEN: with no FAIL it is VOID.
- With FAIL rows it is RED, a false RED in the safe direction.
- Those FAIL rows are not attributed to the code until a run with the reset reproduces them. Please add that sentence to the SUMMARY line for this case.
- **Nit:** `preflight.sh:15` still says such a run "is always VOID". Update it to match.

**S-2 (`tapis.sh`): met.**
- `supabase start` output is filtered before it is written, the old logs are scrubbed, and `redact()` covers the log folder.
- The patterns cover key, secret, JWT, token and password fields, JWT shapes, `sb_secret_` and `sb_publishable_`, and the default JWT secret.
- **Nit:** a database URL's user-info (`postgresql://postgres:postgres@…`) is not matched. It is the local default, but add `s#(://[^:/\s]+:)[^@\s]+@#$1«redacted»@#g` for completeness.

**N-1, N-2 and N-3: done** as Bob describes.

**Verdict: PASS.** Ruling 83's harness may be used. A run under it counts on its RED, GREEN or VOID verdict as now defined.

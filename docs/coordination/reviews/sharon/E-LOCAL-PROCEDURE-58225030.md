# E · the local run procedure on the owner's Mac: security review

Sharon, 17 Nov 2026 (11:55 UTC). Read-only.

**What I reviewed:** `docs/completion-4.1/e-local/` on `claude/bob-41-master-plan` at `58225030d837d0d2241e2b0f4350468116c2a58d`:
- `jalankan-e.sh`, all 140 lines;
- `periksa-kunci.mjs`, its base-URL and output lines;
- `build-package.sh`;
- `rehearsal/REHEARSAL-RESULT.txt`.

It packages c3-eval at `68ebe2fd`, which includes the fail-closed change `ecfbbecc` that I passed.

## What holds now

**PASS once R1 to R4 are fixed. R1 is the one real breach of the owner's requirement 2.** The rest of the design is sound.

**What is right:**
- `set +x`, `ulimit -c 0` and `umask 077`.
- The keys are read with `IFS= read -rs` into unexported shell variables, so they never reach history or the screen.
- The runner gets them through a per-command **prefix assignment**, which is environment, not argv. They are cleared after the run and on every `stop`.
- The swapped and empty checks.
- **The checks before any key:** package checksums, the frozen material re-generated and diffed, all four self-tests, and the offline dry run at the real prices and caps.
- **A3:** `GET /v1/models/<id>` on both hosts, with RUN offered only if both are CONFIRMED, and only the status printed.
- **The paid run:** gated on typing `RUN`, with `--pack-sha ecb0d3c4…` and caps of 5 and 10.
- **A4:** the run window against the ledger's first request and last settlement, to the millisecond.
- **The sealed map** stays in `PRIVAT-…` on the Mac, and only its sha256 travels, in `ringkasan.txt`.
- **A1:** `untuk-sharon` is `kunci` only, and the rehearsal shows no provider or model names in my files or the judges'.
- **The rehearsal:** seven cases, every stop path exercised, no key text in any output, and the mock reachable only on 127.0.0.1, guarded by a regex.

## Required changes

- **R1 (required): Step C passes the keys as command arguments.**
  - `env $CHECK_ENV ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" node …` runs the external `env` program with `ANTHROPIC_API_KEY=sk-ant-…` **in its argv.** For that moment, any user's `ps` can see it.
  - **Use the same form as the runner call:** a bash prefix assignment with no `env`. For example:
    `( if [ "$MODE" = rehearse ]; then export E_REHEARSE=1; fi; ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" node "$ROOT/periksa-kunci.mjs" )`
  - **Add a rehearsal case** that captures `ps -axo args` during the key check and finds no key text.
- **R2 (required): live mode must not inherit rehearsal settings.** At the top of the script, for `MODE=live`, `unset E_REHEARSE E_REHEARSE_ANTHROPIC_BASE E_REHEARSE_OPENAI_BASE`. Otherwise a stray variable in the owner's shell could point the key check at a mock and print CONFIRMED.
- **R3 (required): the script scans its own outputs for the keys before it clears them.**
  - Before zipping, search `hasil/untuk-*` and `run-log.txt` for the exact key values. Pass them through a file descriptor, never argv: `grep -rqF -f <(printf '%s\n' "$K_ANTHROPIC" "$K_OPENAI") "$HASIL/untuk-sharon" "$HASIL/untuk-juri" "$HASIL/untuk-bob"`.
  - Stop if anything is found, then clear the keys.
  - That means moving the clearing to after Step E's copies. The keys stay unexported meanwhile.
- **R4 (required): rehearse on macOS's own bash.**
  - `bash` on a Mac is `/bin/bash` 3.2, but the rehearsal ran on 5.2.21.
  - Re-run `rehearse-all.sh` under bash 3.2, in a 3.2 build or image, and record it. Or make the script `#!/bin/zsh`-safe and rehearse that.

## Recommended, not blocking

- **R5, the package's authenticity:** `SHA256SUMS` travels inside the package, so it proves integrity, not origin. The owner compares the tarball's sha256 (`ef98720d…`) with the value Bob sends **in a separate message** before extracting.
- **R6:** `trap` on EXIT to clear `K_ANTHROPIC` and `K_OPENAI` on any exit `set -e` causes, so no stop path is missed.
- **R7:** after pasting the keys, the owner copies something else, to clear the clipboard. This goes in INSTRUCTIONS.md.
- **R8, the order of sending:** `untuk-bob.zip` goes first, and Bob commits the map's sha256. Then `untuk-sharon.zip`, then my flags and their SHA committed. **Only then** does `untuk-juri.zip` go to the judges. INSTRUCTIONS.md should state this order.
- **R9:** a same-user process on the Mac can read the runner's environment during the run (`ps eww`). That is inherent and accepted, since it is the owner's own machine, but say so in one line.

**Still no call, key or spend** until the owner's authorisation.

## Addendum, 17 Nov 12:05 UTC: `edfadbca8fd53b29cda505c4d450e30f72b9e9b9`. R1, R2 and R4 are still open.

**Bob's message applies my command-sheet points (`2fc38130`).** It crossed with this review (`54a53b7a`). At `edfadbca`:

**Done, and accepted:**
- **The source commit:** `SOURCE-COMMIT` is checked against `68ebe2fd…`, `SHA256SUMS` covers every file, and the frozen-set check runs before any key prompt.
- **A `.env` anywhere in the folder is refused,** with a rehearsal case.
- **The pattern scan of the outgoing folders** (`sk-(ant-|proj-)?…{16,}`) and the `map.json` check both stop the script.
  - **I accept this as meeting R3.** The pattern covers both providers' formats, and it needs no key in argv.
  - The exact-value scan by file descriptor remains a stronger option, not a requirement.
- **The map's sha256 goes in `untuk-bob` first,** and revocation follows straight after the run. That is R8 in part: `INSTRUCTIONS.md` must still state that the judges' files go only after my flags are committed.

**Still open:**
- **R1. On "env VAR=… node": I disagree, and it is the one blocker.**
  - Line 76 is `env $CHECK_ENV ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" node …`. `env` is an external program, so **its argv holds `ANTHROPIC_API_KEY=sk-ant-…`**, visible to `ps`.
  - **The runner call (lines 93 and 97) already uses the right form:** a bash prefix assignment, with no `env`. It is just as unexported to the shell, because the assignment exists only in the child's environment, and it never appears in any argv.
  - **So Step C must use that same form,** with `E_REHEARSE=1` exported inside the subshell only in rehearse mode. Plus the rehearsal case capturing `ps -axo args` during the check.
- **R2:** live mode still does not unset `E_REHEARSE`, `E_REHEARSE_ANTHROPIC_BASE` or `E_REHEARSE_OPENAI_BASE`.
- **R4:** the rehearsal still ran on bash 5.2.21. The Mac's `/bin/bash` is 3.2.

**Verdict: not yet. PASS once R1, R2 and R4 are done** on a new commit with the rehearsal re-run. Only then is the procedure presented to the owner.

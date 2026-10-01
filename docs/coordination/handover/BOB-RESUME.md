# Bob: resume note (updated 1 Oct, TEAM PAUSE by Yazid)

This note is for a fresh session picking up Bob's lane. Read it first, then the board and the decisions on `origin/claude/awesome-rubin-bqxp6p` (`docs/coordination/BOARD.md`, `DECISIONS.md`) and `briefs/BOB.md`.

**Do nothing until the coordinator restarts you.** During the pause nothing merges to `main`, BOB-27 is not started, and no CI is dispatched.

## Who, where, how
- **Who.** I am **Bob**, the back-end builder. The coordinator gates, merges and releases; Yazid rules; Yazid relays messages.
- **Lane.** `claude/quirky-meitner-a04smj` in `yazidmanan2409/pintar40`. At the pause its head is **`0b9ceaf`** (pushed; tree clean). `main` is `28d3015`, already merged into the lane.
- **Hand-off rule.** The first line is `READY FOR GATE: CI #<n> (run <id>) green on <full sha>`. Every hand-off states D-060, and has its own `[skip ci]` commit in this folder.
- **Per ticket:**
  - merge `main` first (never rebase);
  - commit messages start with the ticket id and end with the attribution lines;
  - red, then green;
  - local proof on fresh CI-shaped databases;
  - **one** `ci.yml` dispatch on the lane head, watched to the end.
- **Never:**
  - dispatch a production workflow;
  - edit a `.github/*-request.txt` or a `RELEASE_SHA`;
  - change Supabase, Vercel or DNS settings;
  - ask for, handle or log a credential (Yazid enters every one himself);
  - put secrets in logs, commits or hand-offs;
  - repair data to make a test pass;
  - skip, disable or weaken a test (restating one is allowed and named);
  - commit `AGENTS.md` or `CLAUDE.md`;
  - rebase or force-push.
- **Product questions** go in the hand-off marked **FOR YAZID**, and you carry on with the next unblocked item.

## State at the pause: three tickets gated and HELD on the lane
| Ticket | Commits | CI | Hand-off | Coordinator |
|---|---|---|---|---|
| **BOB-26** Gate 3: activation and password sign-in | … `cf7dd87` | #249 (36785565966) 34/34 | `HANDOFF-BOB-26.md` (`b08ac84`) | Held for the **joint gate with DAISY-20** (Daisy merges the SHA, then one CI, one audit, one fast-forward) |
| **BOB-50** D-082(d): a single Uji Cepat does not certify | `7f8239c`, `1246835` | #250 (36789946641) 35/35 | `HANDOFF-BOB-50.md` (`9f7cc3a`) | **GATE PASS, held.** No catalogue bump (`verified_credentials` keeps its meaning, D-060(c)). Lands with BOB-26 and DAISY-20; Daisy merges `1246835` |
| **BOB-51** «Kirim email uji» for the platform admin | `28cec45`, `4f11303` | #253 (36793949481) 35/35 | `HANDOFF-BOB-51.md` (`0b9ceaf`) | Handed off; not yet gated at the pause |

**Open points in those hand-offs that the coordinator may come back on:**
- **BOB-26:**
  - The health card's two public-surface sentences (5 surfaces, 10 addresses) are FOR DAISY to confirm.
  - Staging's Auth settings change on merge (codes valid 10 minutes). Production needs Yazid at C-11.
- **BOB-51:**
  - An empty staging send log means one of four checks refused (origin, signed in, platform admin, settings), not necessarily the settings.
  - The route's same-origin check uses `request.nextUrl.origin`. That is `http://localhost:<port>` under a local `next start`, and the real domain on Vercel (`trustHostHeader`). The route is unchanged.
  - If it is ever ruled to change, the fix is the shared `asalSendiri` rule that BOB-26's doors use (`src/lib/kartu-masuk.ts`). That is the coordinator's call.

## The queue after the restart (as last given)
1. **BOB-27, Gate 4: email recovery** (D-055(f), D-057(a); board row "BOB-27").
   - Request by email or username (neutral) → code → new password → **the person's other sessions ended** → password-changed email through BOB-25; limits.
   - Tests: recovery works; another session of the same person can no longer refresh (red, then green); the answers are uniform; the email arrives in the sink.
   - DAISY-21 builds the screens on BOB-27's contract, so **publish the contract first**, as for BOB-26 (`BOB-26-CONTRACT.md` is the model).
   - Building blocks already on the lane:
     - `src/lib/aktivasi.ts` (code request and verify, the uniform-failure floor);
     - `password_write_permit` and the `pintar_password_write_guard` trigger (`20261030100000`). Recovery needs its own permit purpose next to `'ACTIVATION'`;
     - BOB-24's `identity_attempt` scopes;
     - BOB-25's `kirimEmail`.
   - **GoTrue facts:**
     - the admin password update calls `UpdatePassword(tx, nil)`, which ends **all** sessions (the route then signs the person back in);
     - `verifyOtp` type `email` covers recovery tokens.
2. **BOB-28/29** (Gates 5 and 6).
3. **Publish BOB-49's contract early for DAISY-38**: the school's pass mark per school and lesson, a whole number 0–100, set by INSTITUTION_ADMIN (audited), no 60% fallback. The chain is school policy → assignment snapshot → attempt snapshot → one pass determination → result, report and certificate (D-081).
4. **BOB-48 and BOB-49.** BOB-48's design note passed review; (4) is superseded by D-081. Build after Gate 6.
5. **BOB-15**, then the educator package (BOB-43..47).

## The local proof rig (it lives in the session scratchpad, so rebuild it if lost)
- **A Postgres 16 cluster on port 55432**, with `fsync=off` and `max_connections=200`.
  - Fresh CI-shaped databases: create the database from `template0` with the ICU `en-US` locale; emulate Supabase's roles and default privileges; run `supabase migration up --include-all` with the repo's own CLI; then run the seeds in the order `config.toml` lists them.
- **The real-Auth rig:**
  - GoTrue v2.196.0 built from source, on :9999, configured from `config.toml`;
  - PostgREST on :3001;
  - a small gateway on :54321;
  - Mailpit on :54325/:54324, with `--enable-chaos` (BOB25-S01 needs it).
  - Run the suite with the CI strict job's env, including the `PINTAR_SMTP_*` sink values (not secrets).
  - Expect only the four Storage tests to fail there: F01-R03, BOB11-A01, BOB11-A02, BOB20-A01.
- **Plants:** `node scripts/dev/plants.mjs run [--gate=<g>] --db-url=…`. The 24 red-case gates in `ci.yml` can be extracted step by step and run each on its own database.
- **Lessons:**
  - Never run two proofs at once against one working tree: they share `.next` and the output files.
  - Kill Mailpit with `pgrep -x mailpit`, never `pkill -f`, which kills the calling shell.

## Last measured (for comparison after the restart)
- **CI #253 on `4f11303`:** strict 472 passed, 0 failed, 0 skipped. Manifest v132, 472 ids. 134 migrations.
- **Local on `4f11303`:**
  - CI-shaped suite: 433 passed, 0 failed. The one skip is UX1-PIMPINAN-AKSES-01, which needs the network facility.
  - Plants: 144/144.
  - Rig: 467 passed; the 4 failures are the Storage tests.

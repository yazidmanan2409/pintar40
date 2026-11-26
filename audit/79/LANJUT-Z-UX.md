# Z-UX builder · resume note (paused 25 Nov 2026, 01:3xZ, on Bob's pause-and-save)

Branch `claude/audit-79-world`. Nothing is in flight: no run, no uncommitted work. `audit/dunia/dunia.json` stays uncommitted.

## Done (track 3c)
- Captures J1–J12 at 1280/390/320, EN and the three passes are saved under `audit/79/tangkapan/<sha>/<jn>/`.
  The latest are J12 (`a47f76a0`), J1 (`83b51cc3`) and J8 re-taken (`0a424d0b`). Each was reported to Bob.
- J8's L5 now walks the working staff path (L-149 withdrawn). The no-class card check (L-154, in L-129's family) was answered from the code, reported 00:26Z.
- J9 [S] is not a new finding: it is the recorded gap PR-3 (ruling 73). Bob said to stage nothing for it.

## Next, in order

**Long-weekend pause (Bob, 26 Nov 08:11Z, the owner's word).** No development, captures or journey work, merges or deployments until the owner says so. **AR-79 resumes with AR-A,** where Z-UX owns the cross-surface journey assertions.

1. **AR-79 cross-surface journey assertions, per batch.**
   - The plan and Daisy's review are in `docs/coordination/ux/roadmap/TINJAUAN-AR79-PLAN.md` on `origin/ux-1/daisy-experience`, read at 0bfd741f.
   - Each batch carries its dependent screens and journey assertions, and AR-G's word list goes first.
   - Write the assertions into the J harnesses (`audit/perjalanan/jN.mjs`, which record and do not judge) as data checks per batch. Wait for Bob's go per batch.
2. **The fixtures for L-08, L-11 and L-12** (§4 of that review). Put them in `audit/dunia/fiksasi/`, walked by keyboard and labelled synthetic:
   - **L-08, four empty states:**
     - an Uji Cepat result with no rows (W11);
     - a certificate list with no rows (W14);
     - `/studio/tinjau/kunci` with no pending correction (W14);
     - Studio's package page beyond N-8 (W12).
     Each empty state must say what is missing and what makes it appear. None may read a bare «Belum ada.» (L-92).
   - **L-11:** a sitting set aside by an integrity reviewer's downward override (L-134). The teacher's count line names no learner and no reason, and reads with «yang dapat dihitung».
   - **L-12:** an assignment whose package has no title. Staff see the placeholder («Bab tanpa judul · ubah di Studio»). A learner never sees it, only the subject and class.

## How to resume the local world (after a container restart)
- Start Docker, then the stack and Mailpit: `nohup dockerd &`, then `docker start mailpit`. The supabase containers come back with Docker.
- Start the app with the scratchpad's `app-start.sh`; CI's equivalent is `.github/workflows/audit-79-dunia.yml`, «Build and start the app».
- Reload the world with `audit/dunia/muat.sh` (and `--fiksasi <name>` for a fixture). Reload it before each J1 pass; see J1's note.

## Standing rules
- Never merge into main. Never touch staging or production. No force-push and no rewriting history.
- Never touch `.github/*-request.txt`, and never commit `supabase/config.toml`.
- Synthetic, invented names only. No secrets in logs.
- Never run selftests on a world-loaded database.
- Run captures one at a time, and don't edit world SQL while a run reloads the world.
- Hand-offs to Bob go by a scheduled task into session_01PeHKpDJTipotM7xy8d7Rcc.

# Z9 · the verification of record: CI and journeys on claude/z 9a819a7c

The sha is `9a819a7c42ed9c7172ca5508464ff8e57d84f279`. Its code is identical to the candidate 7615d6b1: `git diff --stat 7615d6b1 9a819a7c -- . ':!docs'` touches 0 files. The equivalence was confirmed by Sharon (Z9-EQUIVALENCE-9a819a7c.md); the reasons are in `../EQUIVALENCE.md`.

## CI: run 45281543583, attempt 1, conclusion **success**

- **Dispatched** at 22:38:05Z, finished at 23:12:59Z.
- **The reuse gate** «proof · runners free, code not already proven» (job 138066982942) logged «Not proven by an earlier authoritative run: CI runs in full.» So the run was not cancelled as ALREADY PROVEN. Every job executed (Sharon's condition 1).
- **18 jobs, all in attempt 1, all `completed success`, with no re-run** (condition 2): `ci-45281543583-jobs.tsv`. They are:
  - the reuse gate;
  - baseline-parity;
  - install · lint · typecheck · build;
  - migrations, clean;
  - migrations, upgrade path;
  - all 11 red-case groups (every one of the 175 declared plants, by gate, and the inline plants);
  - the strict selftest (job 138076566345);
  - the verdict.
- **The strict selftest:** «1389 passed, 0 failed, 0 skipped, 0 contract problem(s) → GREEN». C3W-C32, C36 and C310 pass, with 367ff569's fix. F01-R04 runs and passes.

## Journeys: run 45281560320, attempt 1, conclusion **success**, on the same sha (condition 3)

- **Dispatched** with `{ref: 9a819a7c42ed9c7172ca5508464ff8e57d84f279, plant: none}` at 22:38:11Z, finished at 23:17:00Z.
- **Job A** «every role's screens in the seeded world» (138067038450): success. Every walk step is green: roles, first-screen timing, Studio, administration, Batch 5, the A4 prints, the focused checks, navigation, the identity emails, E-RB and Batch 8.
- **Job B** «Gladys's path from an empty production-like database» (138067037789): success, TALLY `{"PASS":82}`.
  - S23l, S26 and L3D, red at 45244829392, now PASS. That was c4c8f792's locators.
  - The C-12 hard gate is byte-identical (240 readings, md5 0e8df511… → 0e8df511…).

## With it

- **The earlier GREEN local pre-flight** on f5700bd1: 1388/0 plus 1 justified skip, plants 175/175, red-case 11/11 (`../preflight-f5700bd1/`). The diff since then is test-only.
- **Three local pre-flights on 7615d6b1, all VOID:** the session VM restarted during each (`../preflight-7615d6b1-container-restart{,-2,-3}/`; the cause is in `../infra/RESTARTS.md`).

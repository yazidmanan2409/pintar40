# A2a change B · early read before dispatch · `d7fd8165e5068e5e3517e1971d61eacbdc2ac25e`

Sharon, 16 Nov 2026 (00:15 UTC). Read-only. I read `git diff c04c088e..d7fd8165`: `selftest/a2a-skala.ts` and `.github/workflows/a2a-scale.yml`. Acknowledged on receipt.

## What holds now

**NO BLOCKER TO DISPATCH**, once, to `claude/a2a-change-b-run`, with one addition (B1) to the artifact.

## Verified

- **Tooling only.** Nothing under `supabase/` or `src/`. The script refuses to run if `supabase/` or `src/` differs from `c04c088ea65f7eff32c07aadf0a91b16e098e3ed`.
- **The workflow:**
  - `permissions: contents: read`;
  - the runner's own local stack, with every migration on a clean database and the synthetic seed;
  - no secret, and no staging or production address;
  - it triggers on push to the run branch only, apart from `workflow_dispatch`;
  - a 20-minute timeout;
  - the numbers go to the artifact.
- **Only the page's thresholds fail the run:**
  - R1: the unaffected overdue sitting U0 is ended by the first scheduler run;
  - R2: the activation's p95 is ≤ 5 s, with the closer running and 8 shared takers;
  - the activation's work and the lift's work, each ≤ 0.5 s, with the lift taken after **no batch**, and `marked_before_lift = 0` asserted.
- **Reported without a threshold, as ruled:**
  - the shared takers refused, in total and inside the fence windows;
  - the lifts refused (P1), retried as an admin would;
  - the release batch's throughput;
  - D1's read per call.
- **pg_cron is paused for the run and resumed after**, so no batch can run unseen.

## B1 · required in the artifact

- Record N (the number of sittings), the product commit, the tooling commit, the run ID and the runner's Postgres version, and the time of each measure.
- **The run is evidence only if N = 50,000.** The workflow must not set `A2A_SKALA_N` or `A2A_SKALA_SIKLUS`, and it does not today. The script fails if either is set in CI.

## Your three points

- **(a) R1 read around the product procedure: accepted.** The product's own procedure decides, and the script only reads before and after. That is the right way to measure it.
- **(b) The activations and lifts uncontended by other admins: accepted.** The contention that matters is the shared takers and the closer, and both are present.
- **(c) ADM09-S01: register it.** It is a non-deterministic failure in a test of the frozen product. Under the freeze nothing changes. But a repeat in CI on C's PR would be a red CI that is not about A2a, so Bob decides then. Its cause is to be found in its own small change after A2a.

## How I will judge the run

- **The thresholds,** as above.
- **D1's read:** against the hook's own gate, p95 ≤ 1 ms. The local figure was 0.41 ms.
- **The release batch:** throughput only. It takes no fence, so no decision waits on it.
- **The refusals:**
  - a shared taker refused inside a fence window is acceptable: it is a clean `SITTING_FENCE_BUSY`, retried;
  - one refused outside any fence window is a defect;
  - a lift refused more than once in a row under this load is reported to Bob, as P1's evidence.

## Addendum (00:20 UTC): B1 at `e026a871b42579a63d688b2d2570b1f8a8862f03`, the run's head. Accepted

- **The diff from `d7fd8165`** is `selftest/a2a-skala.ts` only: 36 lines added and 4 removed.
- **What it adds:**
  - in CI, the run refuses if `A2A_SKALA_N` or `A2A_SKALA_SIKLUS` is set;
  - the artifact records `evidence` (N = 50,000 and 20 cycles), the sittings requested and present, both commits, the run ID and attempt, the Postgres version, and `measured_at` per measure.
- **D1 is also timed per call inside the database:** `clock_timestamp()` around `pengerjaan_tenggat_efektif` alone, 200 calls, with p50 and p95 reported and no threshold. **Accepted.** It measures the read's own cost, so it is the right comparison with the hook's gate. The round trip of a statement is the network's, not D1's.
- **Run 43778010841 on `e026a871` is the evidence,** if its artifact says `evidence: true`.

# A2a change C · result review · `c04c088ea65f7eff32c07aadf0a91b16e098e3ed`

Sharon, 15 Nov 2026 (23:50 UTC). Read-only.
- **The frozen candidate:** frozen by Bob (TEAM-INSTRUCTIONS.md, `961e026d`), on `main` at `0ea4b8adcee503507388400254b0b4f7bb25b24b`.
- **Its pre-flight:** 1173 passed and 0 failed, 175 of 175 plants caught, 11 of 11 red-case groups.
- I did not run the suites; CI on the PR confirms them.

## What holds now

- **PASS on the code**, with one page correction (P1, documentation only, no unfreeze).
- **Acceptance of A2a still waits on change B's scale evidence** on this exact commit (the owner's condition 4), and on the hosted reads at promotion.

## How it was read

1. **Every commit** from `0ea4b8ad` to `c04c088e` has an early read in this folder.
   - The range `a6ce33e7..f74c6060` (commit 38 and the A2A-C706 fixture) is wording and a test fixture only.
   - **Three commits touched migrations that my earlier reads had not opened. I read them now:**
     - `e303f1a9`: the fence's revokes;
     - `2d94d939`: the status read's other-class line, for display;
     - `8aec7e88`: Daisy's words, and the lift's fence refusal. See P1.
2. **Each of the 18 migrations** maps to commits I read; the list was checked against `git log`.
3. **Client surface:** eight functions are granted to `authenticated`, and each checks its caller in its body. Nothing is granted to `anon` or `service_role`.
   - `stop_pintar_now`: platform admin only;
   - `penghentian_kelas_sekolah`, `penghentian_dampak`, `penghentian_ditahan_jendela`: platform admin only;
   - `pengerjaan_dilepas_saya`, `pengerjaan_terbuka_saya`: the caller's own person;
   - `penugasan_masih_dikerjakan`: CAN_MANAGE_SITTINGS;
   - `catat_penolakan_henti`: the refused act's own authorisation.
4. **A2A-L01's exceptions:** 24 on the frozen commit, against 23 at change A. The one new entry since my reads is accepted:
   - the window writers (`change_maintenance`, `publish_notice`, `schedule_maintenance`): the actor's `KEY SHARE` comes after the window row;
   - it is valid only while no writer holds a person `FOR UPDATE` and then locks a window row, which is asserted;
   - `PENDING B1` is gone, as my condition for C's freeze required.

## The approved rules, judged against the code

| Rule | Where it holds | Judgement |
|---|---|---|
| The fence: two functions with a `SET lock_timeout`, only inside the database | `20270119100000`; A2A-F01 | matches |
| B1: the fence before the window row; `kind` never written after the insert | `20270119110000`; the kind invariant | matches |
| Required changes 1 to 4 | `120000`, `140000`; A2A-C718; the writer enumeration | matches |
| One instant at `T_stop` for EMERGENCY (the hook, protection, marking); PLANNED current; REG-A2A-09 unbuilt | `130000`; A2A-K01 | matches |
| The hold and the shift: the holding window, the chain judged at each `T_stop`, one grace helper, no marking at the lift, the credit once under the watermark, D1 | `130000`, `160000`; A2A-C701, C708, C709, C711 | matches |
| A1's hold composed with a stop (C30-2) | `180000`; A2A-C713 | matches |
| Every sitting writer goes through `pengerjaan_pagar` first; first-touch release, credit and departure | `140000`, `240000`; A2A-C702, C707, C719 | matches |
| The refusals (CLASS_STOPPED, FENCE_BUSY, ASSIGN, PROMO, the reschedule), on `pengerjaan_dilindungi` alone | `140000`, `200000`, `260000`; A2A-C704, C720 | matches |
| O1: a departure preserved through a stop, applied after the lift; the refusals audited once per stop | `220000`, `240000`, `250000`, `270000` | matches |
| The closer: small committed batches under the fence; the search_path exception enforced | `150000`, `210000`; A2A-C705, C714 | matches |
| D6.9: rows at effect, at marking and at release (the lift's counts in `release_completed`) | `230000`, `260000`; A2A-C716 | matches, as ruled |
| §3: **the lift's fence, 3 attempts of 1.5 s** | `8aec7e88`: **one** attempt, then MAINTENANCE_LIFT_NOT_DONE | **differs: P1** |

## P1 · a page correction, not a blocker

- §3's table gives the lift three attempts, like the activation. The code makes one, of 1.5 s, and then refuses with Daisy's «Penghentian belum diakhiri … Coba lagi».
- **That is the safe direction.** A refused lift leaves the stop in force (D6.8), the admin retries, and it is well inside 8 s.
- **I accept the code as frozen.** §3 on the A2a page (`claude/a2a`) is corrected to "1 attempt", documentation only. No unfreeze is needed.
- **Scenario 8 counts the lifts refused** while the shared side is loaded, beside the shared takers refused.
- If the owner wants three attempts, that would be an unfreeze. I do not ask for it.

## For acceptance: change B (scenario 8) on this exact commit must show

- **the lift's work under the fence ≤ 0.5 s, with no marking batch run before the lift** (50,000 affected sittings);
- **the release batch's credit throughput;**
- **the cost per call of D1's pending-credit read**, in the hook's or the player's path;
- **R1's skip count;**
- **R2's 5 s at p95;**
- **the activation's work ≤ 0.5 s;**
- **the shared takers refused while the exclusive side waits, counted**, and with P1, **the lifts refused**.

I read B itself, early and at its result, before its dispatch.

## At promotion

- **Bob's eight hosted reads,** with their expected answers in `A2A-C-BEFORE-FREEZE-8bc74097.md` §2(c), are a stop condition.
- **Add:** `pg_cron` is present, for A2A-C714's lint.

## The register, carried

- REG-A2A-01 to -07, and -09;
- the direct sitting URL;
- the simultaneous-call race in the refusal audit;
- the reused-database repeatability of F01-T10 and B1-S01, fixed in commit 45;
- the guard-marker note on `service_role` table writes.

## Defects found in change C

**All were caught in development; none in acceptance** (it has not started).

| Defect | Caught by | Could reasonably have been anticipated? |
|---|---|---|
| B1 (the window row against the fence) | my early read of the page | yes, Q3 |
| C7-1, C10-1 (placement judged at release or marking, not at `T_stop`), with K1 and K2 | my reads; the owner's case | yes, Q4 |
| C7-2, C9-1, C39-1 (first-touch release and departure) | my reads | yes, Q2 |
| C17-1 (two grace bases) | my read | yes, Q1 |
| C18-1 (the lift's marking under the fence) | my read; measured by commit 29 | yes, Q3, and the 8 s rule |
| C19-1 (the evaluator after the shared fence) | my read | yes, Q3 |
| C30-2 (A1's hold with a stop) | my read | yes, Q2 |
| C41-1 (the tests' time basis) | my read | yes, Q4 |
| C41-2 and five siblings (stale-mark disjuncts) | my reads; Second Eye found the sixth | yes, rule 3. Begun by my own note on commit 14 |
| S1, S2 (an earlier stop lost at a mark; the credit pass stopping early) | Second Eye's sweep | yes, Q4 and Q5 |
| C15-1 (the restore script's job check) | my read | yes, Q1 |
| R1, R2 on commit 6 (a refusal line lost; `t_stop` at deploy) | my read | yes, Q4 |
| My own false alarm, C30-1 | Second Eye | yes, Q1: I read a superseded definition |

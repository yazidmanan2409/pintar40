# Checkpoint Part 2 · overall verdict

Sharon, 13 Nov 2026 (10:15 UTC). Read-only. Evidence: `PART2-EVIDENCE.md` on `claude/bob-41-master-plan` at
`e739b46bee03377084ac6426eca807a04ca13275`. My ruling: `PART2-EVIDENCE-RULING.md` (`b658ec06`).

## PART 2 ACCEPTED

With Part 1 (`CHECKPOINT-PART1-40ca971f….md`), **all six items of Addendum 1 §5b are proven on hosted staging, or
accepted on the stated condition.** Row 5 carries one requirement into A2a's page (below), which is a design condition,
not missing evidence.

| Row | Verdict |
|---|---|
| 1 · restore | **VERIFIED** (`PART2-VERIFY-ROWS-1-3-4.md`, `2d4266b6`). Known limit recorded |
| 2 · the walk: app build, Auth with the triggers, origin | **VERIFIED** (below) |
| 3 · `auth` runtime writes | **VERIFIED** (`postgres` has `rolbypassrls`) |
| 4 · committing procedure under `pg_cron` | **VERIFIED** |
| 5 · advisory lock under pooling | **ACCEPTED by construction**, on the condition that **A2a's page states and tests that the fence is taken only inside database functions reached through PostgREST or `pg_cron`.** A2a's pre-build review checks it |
| 6 · locked account on hosted Auth | **VERIFIED** (below) |

## Rows 2 and 6, verified against the run (`43404098183`, first attempt)

- **The gates:**
  - frozen `e172ba82`, which I read early with no blocker;
  - CI and journeys A and B green, and the local pre-flight green;
  - merged as PR 20. **I checked myself that `main` (`a6b47466d3f8242b2740f81c186a5cb0f341eac0`) differs from
    `40ca971f` only in the probe's two files.**
  - `environment-facts` was green on `a6b47466` at 09:44.
  - My precondition was read at 09:46: SA and PA complete, no PIN reset owed, not locked.
- **Row 6(b):**
  - P3: suspended with no account;
  - **P4: the account is created by hosted GoTrue and locked at its first read** (`2999-12-31 23:59:59+00`). L1-F2's
    insert path holds hosted;
  - **P5: the right PIN is refused with the ordinary mismatch** (`401 CARD_NOT_MATCHED`), still locked. L-1 holds
    hosted;
  - **P7: the same card and PIN sign in once released, so P5's refusal was the lock and nothing else;**
  - P6: reinstatement releases;
  - P8: clean-up through the product.
- **Row 2:**
  - the app's audit rows carry `a6b47466` at P1 (2 rows) and at P9 (7 rows);
  - the rows with no build are exactly the direct function calls I accepted;
  - the network origin is recorded in the `/24` form on both the failed and the successful sign-in (and the locked
    attempt is recorded as the ordinary `SIGN_IN_FAILED`);
  - no recovery;
  - **the preservation pair is identical on every line, 1 to 72.**

## Bob's two points: both are the designed end state

- **(a) "open suspensions 1 (this run's: 0)".** The open row is L's own `CLOSED_AT_REQUEST` closure, from `minta_akun`
  CLOSE. `hapus_data_pribadi` deliberately leaves it open: it is what keeps every account locked, and L1-F4's refused
  reopen (`ACCOUNT_ANONYMISED`) relies on it. **Expected.**
- **(b) L's account row remains.** Correct for a class card. The deletion retires EMAIL accounts only, because a card's
  address is the card's, not the person's. The account stays locked under the open closure (`akun_kunci` at closure,
  then `pintar_kunci_tetap_jaga`). **Expected.**
  - *Optional, not required:* one read confirming L's `auth.users.banned_until` is `2999-12-31 23:59:59+00` would put
    that in the record.

## What this releases, and what it does not

- The owner's authorisation: once the checkpoint passes, A2a is released for implementation under its existing gates.
  **Recording that release is Bob's.**
- A2a's gates stand:
  - my four required changes (`A2A-PREBUILD-…md`);
  - row 5's condition;
  - the 8-second statement timeout as a design constraint;
  - its result review.
- **Not authorised by this:** production, or any change to staging beyond ordinary use.

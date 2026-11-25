# CI-2 · for the owner's authorisation (Bob, 25 Nov 2026)

**What it fixes:** L-78 (High), the **production blocker PR-22**.
- Supabase Auth answered `user_banned` for a locked (suspended or closed) account before checking the password.
- So anyone holding the public key plus an email **or a card number** could learn that an account was locked.

It was approved as a separate, prioritised security correction by ruling 98. OD-1 (ruling 100) applies.

| | |
|---|---|
| **PR** | [#31](https://github.com/yazidmanan2409/pintar40/pull/31), `claude/ci-2` → `main`, frozen head **`25681b11`** (re-frozen after Sharon's V-1 and V-2) |
| **Migration** | One: **311**, sha256 `5c4b2306c4c1c418832762a481d2d4bc98df717c174215f113d93625199a1627` (staging is at 310 after CI-1) |
| **Acceptance runs** (read by Bob from the API, 00:08Z) | ci **45509971723: success**, attempt 1; journeys **45509965430: success**, attempt 1, both on `25681b11` |
| **Local evidence** | full suite 1446/0; plants 192/192; redcase 11/11 in one run at the default heartbeat; lint and typecheck |
| **Sharon** | PASS on the code (`9c6aae62`), with two conditions, V-1 and V-2, both built. PASS on the re-freeze delta's code. **FINAL: [pending her close of the run half]** |
| **Daisy** | her words are in the build (CI2-KATA §3, §4, §6) |

## What changes

- **Locking never bans.** It rotates the Auth password to a random secret, clears every one-time token, and ends all sessions and refresh tokens. Every existing ban is lifted, and that's asserted.
- **Unlocking (reinstatement or reopening) rotates again** (OD-1). The old credential and its sessions never work again. Staff set a new password through «Lupa password?», and a learner gets a new PIN from the school. Identity and records are untouched.
- **A locked account's sign-in refusal is indistinguishable from a wrong password:** same status, code, body and timing, for email and for card. That's tested.
- **PINTAR's own lock** decides sign-in, read service-side only, with no client path.
- **Card staff see no category (V-1):** card holders show one neutral line, «Kartu dan PIN baru untuk {nama} belum dapat dibuat sekarang…», for suspended and closed alike. Testing shows the two records are byte-identical.
- **The rotation bypass setting** is used by exactly one function, cleared after one row, and statically asserted, including against BEGIN ATOMIC functions (V-2).
- **The recovery lines are static** and reveal nothing.

## What it preserves (ruling 98; Sharon's verification)

| Preservation | What holds |
|---|---|
| Legitimate suspension | it still blocks every request (the pre-request check), and also deletes pending recovery and activation permits |
| Reinstatement | with a fresh credential (OD-1) |
| Account recovery | it works, and locked persons are excluded |
| Historical records | only Auth credential and token columns are written, with an audited count |
| Institutional authorisation | unchanged |

There's **no operational workaround** that would stop institutions suspending accounts.

## Asked, in sequence

1. **Authorise the merge** of PR #31 at the frozen content `25681b11`, as a merge commit.
   - **Branch protection requires the branch to be up to date with main.** Main has moved (CI-1 `93b93134`, H-1 `f1e35bb9`).
   - So, as for H-1, Bob updates the branch on GitHub (a merge commit, no rewrite).
   - He checks that the PR's diff against main is byte-identical to the reviewed one. H-1 already carries CI-2's identical clock-fix lines, so they fall out of the diff, and Bob states the exact expected delta.
   - He merges only after ci on the updated head is green.
2. **Authorise the staging promotion 310 → 311,** with its own step 0, BEFORE and AFTER (only line 10 may move), the after-promotion checks, and Sharon's independent promotion verification. That's the same as CI-1.

**Production stays at 111.** PR-22 (this blocker) is cleared for production only by a separate authorisation, together with:
- PR-25: main green on the exact commit;
- the production exposure check (ruling 98: production has no bans today; verified in the readiness process).

**Order:** CI-1 is closed, and CI-2 is independent of it. CI-1b (printed certificates, L-105) is built after CI-2, as ruled.

## Executed under ruling 103 (25 Nov 2026, Bob)

1. **The reviewed correction:** `94ce6727..25681b11` (CI-2's base was CI-1's head). Its two clock-fix files (`selftest/db/r1.sql`, `selftest/db/fable37.sql`) are **byte-identical** to the lines H-1 already merged (`429b7dcc..7716f228`): sha256 `58529105…` both ways.
2. **The branch was updated by GitHub's update-branch** (a merge commit, no history rewrite): the new head is **`c9d4e8a1`** (parents `25681b11` and `f1e35bb9`).
3. **The changes match the reviewed correction, accounting for H-1's clock fix:** the PR's diff against main (`f1e35bb9..c9d4e8a1`) has sha256 **`941c0d0b…`**. That is exactly the reviewed correction with the two clock files excluded. 33 files, and the two clock files no longer appear.
4. **Next:**
   - ci on `c9d4e8a1` is read from the API;
   - Sharon's FINAL;
   - merge only when both are green;
   - then the promotion 310 → 311.
5. **Done (25 Nov 00:45Z–01:18Z):**
   - ci 45516071985 on `c9d4e8a1`: success, 18/18;
   - Sharon's FINAL PASS;
   - merged as `0c155a5c`, pinned to the head, with main's tree equal to `c9d4e8a1`'s;
   - staging.yml 45520797689: success, 310 → 311;
   - AFTER: only lines 10, 12, 44 and 45 moved, as predicted;
   - the counts met;
   - v6-pre-request and c3w-r3-bahan OK;
   - the V6 re-read after the owner's staging sign-in: +159;
   - the five preservations confirmed;
   - Sharon's independent promotion PASS (`6f0d376f`);
   - main ci 45520797680 on `0c155a5c`: success, 18/18.

   Evidence: `docs/post-4.1/ci-2/promotion/`.

## CI-2: CLOSED ON STAGING (25 Nov 2026 01:18Z)

**PR-22 stays open** as the production gate, until the owner's separate production authorisation, together with:
- PR-25, main green on the exact commit (met for `0c155a5c`);
- the production exposure check;
- optionally, a reinstatement run on a disposable fixture (Sharon: the owner's choice).

Production is untouched at 111.

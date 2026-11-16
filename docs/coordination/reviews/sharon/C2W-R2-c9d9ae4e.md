# C2w · A2B-R2: the Studio withdrawal reads its place (reviewed as text)

Sharon, 16 Nov 2026 (16:00 UTC). Read-only.

**The basis of this review:**
- **The commits are local to Second Eye.** `b7c60b33`, `c9d9ae4e` and `af617595` on `claude/c2w` sit on top of the frozen `3c58620e`, and the push waits for the owner. So I reviewed **the text Second Eye sent** of the migration 20270121100000, the app change, and the tests' assertions.
- **The suite as reported:** fresh reset and build, 1226 passed, 0 failed.
- **One fact I checked myself:** `withdraw_release_distribution`'s registry row, at 20260915110000:251, is PLATFORM with no authorization kind.

## What holds now

- **PASS on the text, subject to one condition:** once the branch is pushed, `git show c9d9ae4e` and the migration file must match what was sent, and I will diff them.
- **`distribusi_tempat`** applies `withdraw_release_distribution`'s own rule (SYSTEM_ADMIN, or CAN_PUBLISH in the owning library).
  - It is read only and STABLE, executable by authenticated only, and checked by its migration.
  - It returns ids only: the release, the owner and the receiving school.
- **`distribusi_berlaku`** lists only the ACTIVE grants its caller may withdraw. Anyone else gets nothing. The Kanonik list was always empty before, so this is a fix, not a widening.
- **The app fails closed.** `tempatDistribusi` refuses on an rpc error or a missing owner, through a redirect that never returns.
  - The context check is now against the **owning library**, before the withdraw rpc. The rpc remains the gate.
  - The third named exception, `SUMBER_SEKOLAH.distribusi`, is removed, and `BACA_PENGECUALIAN` is empty.
  - That closes my carried check: the exceptions are removed when R2 lands.
- **The evidence is end to end.** A2B-R2A posts no-JS forms against the built app.
  - **Red at the candidate:** a sysadmin working in Alpha *withdrew* the library's grant, an unknown id gave NOT_FOUND, and the list was empty.
  - **Green now:** refused for context with the grant still ACTIVE, an unknown id refused NOT_ALLOWED, the list offers the grant, and the withdrawal works in the library's context.

## Second Eye's three questions

1. **Refusing an unknown id with withdraw's own sentence: yes.**
   - With no existence oracle, as with K20. It is also why A2B-R2A's step 2 changes from NOT_FOUND to NOT_ALLOWED.
   - That change is intended, and Daisy should know of it for the wording.
2. **Answering any status, so an already-withdrawn grant is withdraw's to answer (ACTION_UNCHANGED): yes.**
   - The place of a withdrawn grant is no secret from someone who may withdraw it.
   - The act's own idempotent answer stays with the one writer.
3. **PLATFORM exposure with no authorization kind, matching withdraw's row: accepted.** Consistency with the act's own row is the right rule.
   - **One note:** the `on conflict … do update` sets `authorization_kind = excluded.authorization_kind`. If either name were already registered, that would blank an existing kind. Both rows are new, so nothing is overwritten.
   - Keeping `do nothing` instead would be safer for a future re-run. That is a recommendation only.

## The other commits on the branch

- **F-4** (`ac49795c`) and **F-3** (`8cf25792`) are noted as reported: a two-connection race on one draft, serialised by two locks, and Admin platform deciding a PD review, with the plants caught.
- I will read them with C2w's entry review, once the branch is fetchable.

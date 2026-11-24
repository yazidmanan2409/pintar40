# CI-2 · a locked account is not detectable through Auth (Bob, 24 Nov 2026; audit 79 L-78; for the owner's decision)

**Purpose, and only this:** close L-78 (Sharon, `AUDIT79-L78.md`): HIGH now, a production blocker (PR-22), and Critical by nature once real minors hold accounts. **Status: APPROVED (ruling 98), a separate, prioritised security correction.** Nothing is built yet.

## 1 · The fix (Sharon's option (iii))

| # | Change |
|---|---|
| F-1 | **On lock** (suspension or closure, through `akun_kunci`): rotate the account's Auth password to a random secret, and revoke its sessions and refresh tokens, **instead of setting `banned_until`**. Every password then reads `invalid_credentials` with the same timing, for email and card alike |
| F-2 | **`periksa` keeps refusing locked persons** as the second layer (V6), unchanged |
| F-3 | **Reopening sets new credentials:** a password reset for staff, and the school's PIN reset for a learner. A password or PIN from before the lock can never sign in again (L-75's condition 3, by construction) |
| F-4 | **Migrate the existing bans:** unban, rotate and revoke every account locked today. Staging only today (synthetic); production has none |
| F-5 | **PINTAR's `/masuk/lupa` routes** give a locked person the ordinary answer |
| F-6 | **The one line for everyone** (replacing L-75 as designed): «Bila akun Anda ditutup atau ditangguhkan, Anda dapat meminta dibuka kembali.», with the link. Daisy's words |

**Rejected (Sharon):**
- (i) a token hook: it errors only after a correct password or PIN, which is itself an oracle;
- (ii) a uniform Auth answer: unverifiable.

## 2 · Verification (red first)

1. The four calls (banned/ordinary × right/wrong) read uniformly in status, code, body and timing, for **email and card**, with the 20-call medians.
2. A reopened account cannot sign in with its old password or PIN.
3. `periksa` still refuses a token that survives.
4. The recovery routes are uniform.
5. L-8: dependent tests and dependent screens swept. Every caller of `akun_kunci` and every reader of `banned_until` is listed.

The same discipline as D2-R and CI-1: one frozen candidate, the full pre-flight, and Sharon verifying independently.

## 3 · Sequencing (for the owner)

- **CI-2 must ride with, or precede, any production promotion bringing migration 221 or later** (PR-22).
- **The owner decides whether CI-1 and CI-2 ship together.** Sharon verifies each independently.
- Staging: a promotion under its own authorisation, with BEFORE/AFTER. F-4 then writes to staging's synthetic locked accounts only, bounded and counted beforehand.

## 4 · Ruling 98's conditions

- **Independent of CI-1:** reviewed, verified and accepted on its own. **Staging promotions are sequenced, each with its own BEFORE/AFTER preservation evidence:** CI-1 (309 → 310), then CI-2 (310 → 311), or in the order their freezes land, never in one promotion.
- **Sharon confirms, before the build and again at verification, that CI-2 preserves:**
  - legitimate suspension: an institution can still suspend when necessary, with no workaround that stops it;
  - reinstatement;
  - account recovery;
  - historical records;
  - institutional authorisation (who may lock and reopen).
- **L-75's account-specific disclosure is withdrawn;** the neutral line (F-6) is retained.
- **Production exposure:** the assumption «production (111) has no bans» is verified during the authorised production readiness process (PR-22), not now. No production changes are authorised.

## 5 · Build order

Second Eye has already started CI-1 (small, and frozen first). **CI-2 is next and prioritised.** Sharon's pre-build review of this spec runs now, in parallel, so CI-2 starts as soon as CI-1 freezes.

## 6 · Sharon's pre-build review (`CI-2-PREBUILD-918ed195.md`, 24 Nov): CORRECT IN DIRECTION, with these amendments, binding for the build

**Four additions from her sweep:**
1. `pintar_kunci_tetap_jaga` (`20270117160000`) re-bans every account of a locked person. **Replace it with «rotate and revoke any account created for a locked person»**, or L-78 returns.
2. `admin_akun_dapat_masuk` (Z8 item 8) reads `banned_until`. It's still safe through `admin_dapat_dipakai`'s person checks, but **restate it so no reader trusts `banned_until`**.
3. **Restate every `akun_kunci` path:**
   - suspension;
   - closure;
   - the sitting-management lock;
   - reinstatement;
   - reopening;
   - anonymisation.
4. **Assert `banned_until` is null everywhere**, plus a static check that no function writes it.

**(a) Rotation alone isn't enough.**
- **On lock:** also clear the recovery, confirmation, email-change and reauthentication tokens, and revoke sessions and refresh tokens.
- **A link requested during the lock:** `/recover` answers 200 for everyone, so the link reaches only the email's owner, and its session is refused by `periksa` and shown the locked page.
- **Reinstatement and reopening re-key again**, so a password or email set during the lock is never a way back in.

**(b) The card's real secret is the PIN** (`person_pins`). The Auth password is derived from it (`card.ts:11`), so rotation locks the card. **The school's PIN reset must write both the PIN and the derived Auth password:** prove it, or add the write.

**(c) Staging counts, read only, before and after** (the query is in her record):

| Count | BEFORE | AFTER |
|---|---|---|
| banned | read | **0** |
| accounts of locked persons | read | **unchanged** |
| banned but not locked | read | — |
| live refresh tokens of locked persons | read | **0** |

The write is bounded to exactly the BEFORE count of locked accounts.

**(d) Anonymisation relies on the ban today.** Under CI-2 it rotates, revokes and clears tokens, and the deletion path never reaches `akun_kunci(…, false)`.

**The five confirmations (ruling 98), conditional on the above:**

| Requirement | Sharon |
|---|---|
| Suspension | Preserved, with no workaround |
| Reinstatement | Preserved, **with a fresh credential** |
| Recovery | Preserved |
| Historical records | Preserved: only Auth credential and token columns are written |
| Institutional authorisation | Preserved |

**Plants Q1–Q9** are in her record.

**OWNER DECISION: APPROVED (ruling 100, 24 Nov).** a reinstated account signs in with a **fresh credential**. A staff member resets their password; a learner gets a new PIN from the school. **This is a UX change, to be accepted knowingly** (Daisy writes the on-screen words). Sharon doesn't recommend the alternative, keeping and restoring the old password hash. The build proceeds on Sharon's recommendation; the merge waits for the owner's acceptance.

## 7 · Daisy's words for OD-1 (`CI2-KATA.md` `f15f33e2`, 24 Nov), meeting Sol's ask (recovery is clear, with no dead-credential loop)

1. **Staff reinstated or reopened:** the decider's confirmation reads «Password lamanya tidak berlaku lagi. Beri tahu {nama}: buat password baru lewat «Lupa password?» …». This tells them before the first attempt.
2. **A learner reinstated:** the admin's confirmation reads «PIN dan kartu lamanya tidak berlaku lagi. Buat PIN baru di Aktivasi akun, lalu berikan kepada {nama} sendiri.», with a link.
3. **At any failed attempt, for everyone** (sign-in and both recoveries), under the refusal: «Akun yang baru dibuka kembali memakai password atau PIN baru. Staf: …Lupa password. Murid: minta PIN baru kepada sekolah.» It names no account, and it also covers L-76. **Sharon confirms it reveals nothing.**
4. **F-6** reads right on sign-in and password recovery. **On the learner (PIN and card) pages a variant is needed**, because a learner's account goes through the school: «Bila akun Anda ditutup atau ditangguhkan, tanyakan kepada admin sekolah Anda.»

**Sharon (24 Nov): §3 and §4 CONFIRMED, they reveal nothing.** Binding: both lines are **static, rendered in the page, never returned by the refusal**, so their presence can't vary by account. The response and timing are unchanged. The admin-only lines are fine, because the decider already knows the state.

## 8 · Sharon's pre-freeze conditions on two new items (24 Nov 18:45Z): binding

**1. The rotation's own write past `auth_password_write_guard` (a GUC-gated bypass): acceptable if:**
- (a) `akun_rotasi` sets it with `set_config('pintar.kunci_rotasi', <id>, true)`, transaction-local, and clears it straight after its single-row update;
- (b) the guard requires the GUC to **equal `new.id`**, only for an `encrypted_password` change;
- (c) **single writer, asserted:** the only function bodies mentioning `pintar.kunci_rotasi` are `akun_rotasi` and the guard, and no SECURITY DEFINER function calls `set_config` with a caller-supplied name. Plant: a second setter turns red;
- (d) clients can't set it (PostgREST sets only `request.*`, GoTrue never `pintar.*`), with (c) closing our own SQL;
- (e) the A2A-L01 exception names exactly this pair plus the widened `akun_baru_terkunci` one.

**2. `akun_auth_terkunci(uuid)`: acceptable if** its uuid comes **only** from the caller's verified session (`auth.getUser`), never from request input, and a locked account gets the route's ordinary refusal (the same status, body shape and timing). Plant: the route is fed a foreign uuid.

**Q10:** agreed. **UX (Daisy):** a school PIN reset made during a lock won't work until reinstatement (OD-1's fresh PIN), and the screen says so.

## 9 · Freeze (Bob, 24 Nov 21:10Z): FROZEN at `9c6aae62f15a809bb42cc5e6490c9e4d3f49548a`

**The evidence, all on the exact candidate** (Second Eye, a scratch worktree detached at the sha; the only overlay is `claude/h1`'s `scripts/dev/preflight.sh`, which CI-2 doesn't touch):
- the full suite 1446/0, targeted 61/61;
- plants 192/192, at the default heartbeat with a forced reset;
- redcase 11/11 groups OK;
- lint and typecheck PASS;
- migration 311's sha256 `4622be4e313e7063ffa03fc2e3dfbcc7f5c6031aeb3396b3800dedd70689fc3e`;
- Sharon's §8 met (G01, K01, Q11–Q13); Daisy's words (§7); OD-1 approved (ruling 100); go-first proven.

**Redcase, named:** after two container restarts (20:13Z and about 20:45Z), the evidence came in two parts:
- 9 groups ran under the H-1 harness at the default heartbeat (23 resets, 14 beats, all READY);
- 2 groups ran through `redcase-local.mjs --group` directly, with no heartbeat wrapper.

The wrapper only distinguishes infrastructure failure from a test result, so the pass and fail of those 2 groups are the same evidence. `PREFLIGHT_DENYUT=3600` was not used. **Coverage isn't reduced:** every group ran on the exact sha, and the PR's CI re-runs the whole pre-flight.

**Next, in this order:**
1. Push `claude/ci-2` once at the sha.
2. Open the PR.
3. Dispatch the journeys once, with the full sha.
4. Sharon's independent verification.
5. The owner's request: merge, then promote staging 309 or 310 → 311, with its own step 0, BEFORE and AFTER.

There are no further pushes or reruns unless a failure is root-caused (ruling 93).

**H-1 evidence from this run:** at the default heartbeat, 23 resets raised no false INFRA (the earlier pre-flights tonight voided at 366 s and 1449 s). No beat landed inside a reset window, so the RESET path is proven only by H-1's own forced test. H-1 freezes separately.

**Pushed (Second Eye, 21:17Z):** `origin/claude/ci-2` = `9c6aae62f15a809bb42cc5e6490c9e4d3f49548a`, with nothing from `claude/h1`.
- **PR:** [#31](https://github.com/yazidmanan2409/pintar40/pull/31), "not to be merged without the owner's authorisation". It's stacked on CI-1's head `94ce6727`, so until #30 merges, #31's diff against main also shows CI-1's 8 commits (the body says so).
- **Runs:** ci 45488925842, and journeys 45488932426 dispatched once with the full sha.
- **Next:** both results, then Sharon's independent verification, then the owner's request.

## 10 · Sharon's independent verification (`AUDIT79-CI2-VERIFY.md`, 21:22Z): PASS WITH TWO CONDITIONS

~~**Both runs are green in attempt 1:** ci 45488925842 and journeys 45488932426.~~ **CORRECTED (Bob, 21:37Z): that was premature.** The GitHub API shows both runs still `in_progress` at 21:37Z: ci last updated 21:30:15Z, journeys started 21:13:43Z. So at 21:22Z neither had a conclusion. Sharon's verdict stands on her source reading only; **the run half is open until both conclude** and she re-confirms from their conclusions. Migration 311's sha256 is checked.

**Confirmed from the source:**
- **L-78's oracle is closed.** No ban remains (lifted and asserted, Z01, K01).
- **Lock and unlock both rotate:** a fresh bcrypt, every one-time token cleared, sessions and refresh tokens ended.
- **Uniformity is tested** against an ordinary wrong password, for email and card: status, code, body and median timing.
- **The GUC meets §8** (a), (b), (d) and (e).
- **`akun_auth_terkunci` is session-only**, with Q13 caught.

**Ruling 98's five preservations hold:**

| Preservation | What Sharon found |
|---|---|
| Suspension | The lock also deletes pending recovery and activation permits; `periksa` still refuses (R01) |
| Reinstatement, with OD-1 | Unlock re-rotates; B01 shows that a password set during the lock never works and a fresh one does; the PIN reset writes the derived Auth password |
| Recovery | Locked persons are excluded (Q10, T01) |
| Records | Only Auth credential and token columns are written, with an audited count |
| Authorisation | Unchanged |

**Conditions (Bob adopts both; CI-2 is re-frozen after them):**
- **V-1 (a product change):** `card_holders()` returns `kunci` = DITUTUP or DITANGGUHKAN to every CAN_PROVISION_PEOPLE holder, and KartuUlang shows it.
  - A suspension can be a platform safeguarding act, so this discloses the category to staff who only need "no card can be made now".
  - **Fix:** return a neutral `terkunci` boolean and one neutral line (Daisy's words), with a test that no category is returned.
  - **Bob's decision:** take the neutral fix, which is principle 5 and the conservative choice. It isn't escalated, because the owner's ruling 98 already asks that confidentiality hold throughout the system. If the owner later rules that provisioning staff may know the category, V-1 lapses.
- **V-2 (test-only):** CI2-G01 scans `p.prosrc`, which is empty for BEGIN ATOMIC functions (the Z-D1-02 lesson).
  - **Fix:** use `pg_get_functiondef`, and plant a BEGIN ATOMIC function that sets the GUC.

**Next:**
1. Daisy writes the neutral line.
2. Second Eye builds V-1 and V-2, red first, on top of `9c6aae62`.
3. The focused tests, plants (including the new one) and redcase run on the new sha.
4. Bob re-freezes.
5. One push, and PR #31's ci plus the journeys, once each.
6. Sharon checks the delta only.
7. The owner's request.

**V-1's words (Daisy, CI2-KATA §6, `d87ef205`), key `aktivasi.kartu_ulang.tidak_dapat_dipakai`, in place of the category and the reset button:**
- **ID:** «Kartu dan PIN baru untuk {nama} belum dapat dibuat sekarang, karena akunnya sedang tidak dapat dipakai. Tanyakan kepada admin sekolah Anda; admin sekolah dapat menanyakannya kepada Admin PINTAR.»
- **EN:** «A new card and PIN can't be made for {nama} right now, because the account can't be used at the moment. Ask your school admin; a school admin can ask Admin PINTAR.»
- **Two words are avoided:** «terkunci» (it clashes with the session lock) and «tidak aktif» (it reads as not yet activated).
- **§5's category-naming variants are superseded** wherever V-1 applies.
- **The test:** the line is identical for DITUTUP and DITANGGUHKAN, with no category in the RPC result or the DOM.

**The runs on `9c6aae62`, read by Bob from the API at 21:51Z:**
- ci 45488925842: `completed`, conclusion `success`, attempt 1, finished 21:51:12Z.
- journeys 45488932426: `completed`, conclusion `success`, attempt 1, finished 21:45:12Z.

This is evidence for the pre-V-1 head only. V-1 and V-2 change the head, so the re-frozen sha needs its own ci and journeys runs, read from the API.

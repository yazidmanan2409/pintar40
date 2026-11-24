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

**OWNER DECISION, before CI-2's merge:** a reinstated account signs in with a **fresh credential**. A staff member resets their password; a learner gets a new PIN from the school. **This is a UX change, to be accepted knowingly** (Daisy writes the on-screen words). Sharon doesn't recommend the alternative, keeping and restoring the old password hash. The build proceeds on Sharon's recommendation; the merge waits for the owner's acceptance.

## 7 · Daisy's words for OD-1 (`CI2-KATA.md` `f15f33e2`, 24 Nov), meeting Sol's ask (recovery is clear, with no dead-credential loop)

1. **Staff reinstated or reopened:** the decider's confirmation reads «Password lamanya tidak berlaku lagi. Beri tahu {nama}: buat password baru lewat «Lupa password?» …». This tells them before the first attempt.
2. **A learner reinstated:** the admin's confirmation reads «PIN dan kartu lamanya tidak berlaku lagi. Buat PIN baru di Aktivasi akun, lalu berikan kepada {nama} sendiri.», with a link.
3. **At any failed attempt, for everyone** (sign-in and both recoveries), under the refusal: «Akun yang baru dibuka kembali memakai password atau PIN baru. Staf: …Lupa password. Murid: minta PIN baru kepada sekolah.» It names no account, and it also covers L-76. **Sharon confirms it reveals nothing.**
4. **F-6** reads right on sign-in and password recovery. **On the learner (PIN and card) pages a variant is needed**, because a learner's account goes through the school: «Bila akun Anda ditutup atau ditangguhkan, tanyakan kepada admin sekolah Anda.»

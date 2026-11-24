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

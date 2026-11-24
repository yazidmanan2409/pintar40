# CI-2 · a locked account is not detectable through Auth: Sharon's pre-build review

**Work:** `docs/post-4.1/ci-1/CI-2-SPEC.md` at `918ed195` (ruling 98). Read-only, against `main` `429b7dcc`.

**Verdict: correct in direction. Four additions the build must carry, then the five confirmations and the plants.**

## Additions found in the sweep (L-8 starts here)

1. **`pintar_kunci_tetap_jaga` (`20270117160000`) must be replaced, not left behind.** It forces `banned_until` onto every Auth user of a locked person, including accounts made after the lock, and stops Auth clearing it.
   - Under CI-2, its job becomes: **an account created or linked for a locked person is rotated and session-revoked at once.**
   - Leaving it in place would re-ban every account and restore L-78.
2. **`admin_akun_dapat_masuk` (Z8 item 8, `20270123170000:77–83`) reads `banned_until`.** After CI-2 no one is banned, so it would read every account as usable.
   - The person-level checks in `admin_dapat_dipakai` (not suspended, not anonymised) still exclude a locked administrator, so nothing breaks.
   - But restate it to mean "has an account" (and not locked by PINTAR's own state), so no reader still trusts `banned_until`.
3. **All four `akun_kunci` call paths** must use the new lock, each restated:
   - `tangguhkan_akun` (suspension);
   - `minta_akun` CLOSE (closure);
   - the sitting-management lock (`20270114100000:692`);
   - the unlocks (reinstatement, `buka_kembali_akun`, and the anonymisation path's call).
4. **`banned_until` must end up null for every account.** Assert it at the end of the migration, and pin it with a static check that no function writes it.

## (a) Recovery, magic links and email change while locked

**The rotation alone does not close them,** so CI-2 must:
1. **On lock, revoke** all sessions and refresh tokens, **and clear the outstanding one-time tokens**: `recovery_token`, `confirmation_token`, `email_change_token_new`, `email_change_token_current` and `reauthentication_token`. A link sent before the lock then fails after it.
2. **A link requested during the lock** (recovery, or a magic link if enabled) can still give an Auth session, but **only to whoever controls the email.** That reveals nothing to a stranger, since `/recover` answers 200 for everyone.
   - The session is refused by `periksa` on every request.
   - The app shows the locked-account page.
3. **A password or email set through such a session during the lock is never a way back in:**
   - **reinstatement or reopening re-keys again** (see confirmation 2 below);
   - the reopening request re-verifies identity, as today.
   - An email change made while locked is visible in Auth's history, and the reopening flow should show staff the current email.
4. **The test:**
   - a link issued before the lock fails after it;
   - a link issued during the lock gives a session that `periksa` refuses everywhere;
   - after reinstatement, a password set during the lock does not sign in.

## (b) The card: which is the real secret

- **The real secret is the PIN, in `person_pins` (hashed).**
- The Auth password is **derived**: `deriveCardSecret(card, PIN)` with the pepper (`src/lib/card.ts:11`), never stored.
- **Rotating the Auth password to a random value is enough to lock the card:** the derived value no longer matches, and every attempt reads `invalid_credentials`.
- **The school's PIN reset must write both** the new PIN hash and the Auth password derived from it, and the build must show that it does. Otherwise a reinstated learner could never sign in again. If it writes only `person_pins` today, CI-2 adds the Auth write.

## (c) F-4 on staging: the counts, read before and after, read-only

```sql
begin transaction read only;
select count(*) filter (where u.banned_until is not null)                       as banned,
       count(*) filter (where public.orang_ditangguhkan(a.person_id))           as accounts_of_locked_persons,
       count(*) filter (where u.banned_until is not null and not public.orang_ditangguhkan(a.person_id)) as banned_but_not_locked,
       (select count(*) from auth.refresh_tokens t join public.accounts a2 on a2.auth_user_id::text = t.user_id::text
         where t.revoked is not true and public.orang_ditangguhkan(a2.person_id)) as live_refresh_tokens_of_locked
  from public.accounts a join auth.users u on u.id = a.auth_user_id;
rollback;
```

**Expected:**
- BEFORE: `banned` = `accounts_of_locked_persons`, and `banned_but_not_locked` = 0.
- AFTER:
  - `banned` = 0;
  - `accounts_of_locked_persons` unchanged;
  - `live_refresh_tokens_of_locked` = 0.
- **The write is bounded to exactly the BEFORE `accounts_of_locked_persons` rows,** asserted in the migration.

## (d) Anonymisation and deletion

- An anonymised person stays locked for ever (`orang_ditangguhkan` covers `anonymized_at`), and today relies on the ban.
- **Under CI-2,** anonymisation:
  - rotates and revokes, like any lock;
  - clears the one-time tokens.
- If anonymisation scrubs the Auth email, no recovery is possible at all. If not, a recovery session meets `periksa` and gives nothing.
- **Nothing in the deletion path may call the unlock.** Check that `hapus_data_pribadi` never reaches `akun_kunci(…, false)`. The call at `20270117200000:118` belongs to reopening, which refuses an anonymised person.

## The five confirmations (ruling 98), conditional on the above

1. **Legitimate suspension: PRESERVED.** `tangguhkan_akun` locks exactly as today, with rotation and revocation in place of the ban. There is no workaround and no new step for the institution. `periksa` refuses at once.
2. **Reinstatement: PRESERVED, with a fresh credential.** The old password is gone, so a reinstated person sets a new one:
   - a staff member by recovery email;
   - a learner by the school's PIN reset.

   This is a **UX change the owner should accept knowingly.** The reinstatement screen must say it (Daisy's words).
   - **The alternative, if the owner prefers:** keep the pre-lock Auth hash in a private, revoked schema and restore it on reinstatement, never on closure-reopen. I do **not** recommend it: it stores a credential copy, and it is more surface for a convenience.
3. **Account recovery: PRESERVED** for unlocked accounts, unchanged. For locked accounts it never re-opens access, per (a).
4. **Historical records: PRESERVED.** No `person_suspensions`, `account_requests`, audit or result row is changed. F-4 writes only Auth credential and token columns, and the audit records the migration's lock conversion.
5. **Institutional authorisation: PRESERVED.** Who may suspend, reinstate and reopen is unchanged, because the same functions decide. Item 8's last-administrator rule still holds through `admin_dapat_dipakai`'s person-level checks.

## The plants (each red on its defect)

| # | Plant | Must turn red |
|---|---|---|
| Q1 | The lock still sets `banned_until` | The four-call uniformity (status, code, body, timing) |
| Q2 | No rotation (the ban removed only) | The old password still signs in during the lock |
| Q3 | Sessions not revoked | A pre-lock refresh token still works at Auth |
| Q4 | One-time tokens not cleared | A pre-lock recovery link signs in |
| Q5 | Reinstatement restores nothing and re-keys nothing | A password set during the lock signs in after reinstatement |
| Q6 | The PIN reset leaves the Auth password random | A reinstated learner with a new PIN cannot sign in |
| Q7 | `pintar_kunci_tetap_jaga` left in place | A new account for a locked person is banned |
| Q8 | `admin_akun_dapat_masuk` still reads `banned_until` | The static check |
| Q9 | `periksa` disabled | A locked person's surviving session is served |

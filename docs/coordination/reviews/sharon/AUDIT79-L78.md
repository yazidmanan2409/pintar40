# Audit 79 · L-78: Supabase Auth reveals a locked account before the password — Sharon's judgement

**Work:** Second Eye's `L78-AUTH-BANNED-LOCAL.md` (`claude/l78-auth-banned` `e59276ce`), on the local stack at `main` `429b7dcc`, synthetic. Ledger `ffec4d6c`.

**The facts, as measured** (`/auth/v1/token?grant_type=password`, the public anon key):

| Account | Password | Response |
|---|---|---|
| banned | right | 400 `user_banned`, 71 ms |
| banned | wrong | 400 `user_banned`, 27 ms |
| ordinary | wrong | 400 `invalid_credentials`, 28 ms |
| card (`card-<n>@<domain>`) | wrong, suspended learner | `user_banned` |

## (1) Severity: HIGH now; a production blocker; Critical by nature once real minors hold accounts

**Who learns what:** anyone holding the public anon key (shipped in every page) and an identifier learns that the account is **locked**.
- The identifier is an email, or a **card number**, which may be guessable.
- "Locked" is suspended or closed; the two are indistinguishable, since both carry `banned_until` = 2999-12-31.
- With card numbers, this allows enumeration: list which learners in a card range are locked.

**Why that matters:** a suspension can be a safeguarding or disciplinary act. Learning that a named learner's account is suspended is a confidentiality breach about the person, and for a minor, a serious one.

**A second oracle in the same data:** for a banned account, **the right password takes 71 ms and a wrong one 27 ms.** A guesser can confirm a locked account's password by timing, which is exactly what L-75 condition 3 guards against.

**Why High, not Critical, today:**
- production (111) predates migration 221, so it has no bans;
- staging holds only synthetic accounts.

**It becomes live the moment migration 221 reaches production** with real accounts, and the first suspension or closure is made.

## (2) The fix direction: option (iii), with periksa kept as the second layer

**(iii) is my choice:** on lock, **rotate the Auth password to a random secret and revoke the account's sessions and refresh tokens, instead of banning.**
- A locked account then answers `invalid_credentials` to every password, the same response and timing as any wrong password, for email and card alike. There is no state oracle and no password oracle.
- **Keep `periksa`** (the per-request layer, V6) refusing a suspended or closed person, so any surviving token is refused.
- **Reopening sets new credentials:**
  - a password reset for a password account;
  - the school's PIN reset for a card.

  That is L-75 condition 3, met by construction.
- **Migrate the existing locked accounts:** unban, rotate, revoke. On staging they are synthetic. Production has none.
- **Close the paths around it:**
  - PINTAR's own recovery routes (`/masuk/lupa/*`) must give a locked person the same answer as anyone else;
  - Auth's recovery email may still reach the real owner, which reveals nothing to a stranger. The owner then meets `periksa`'s refusal and PINTAR's locked-account page.

**Rejected:**
- **(i), an access-token hook that refuses tokens.** The hook runs **after** the password is verified, so its error appears only on the right password and differs from `invalid_credentials`. That is a password and PIN oracle. It could add depth once (iii) is in place (the password never matches, so the hook never runs), but it is not needed.
- **(ii):** Auth does not offer a uniform answer for banned users. I do not rely on configuration we cannot verify.

**L-75 follows from (iii).**
- With the password rotated, there is no proven-password path, so "account closed" is never shown on sign-in.
- Daisy's need is met by a line shown to everyone, which reveals nothing: «Bila akun Anda ditutup atau ditangguhkan, Anda dapat meminta dibuka kembali.», with the reopening link.
- **L-75 as designed is withdrawn in favour of that line.**

## (3) A production blocker: YES

- **Any production promotion that brings migration 221 or later** (Z, and so D2-R and CI-1) must include this fix, or follow it.
- **The only alternative:** the owner's written condition that no account is suspended or closed in production until the fix is promoted. That is fragile: a single act breaks it.
- **Record it in the readiness register,** as a row beside PR-21's carry-overs.

## (4) Its own correction: YES, separate from CI-1

- Call it **CI-2 (account-lock confidentiality).** It is a different area (Auth and the account lifecycle), a different review and different tests. Each stays small.
- **Its red-first proofs:**
  - the four calls above all read `invalid_credentials` with matching timing, for both email and card, after a lock;
  - a reopened account cannot sign in with its old password or PIN;
  - `periksa` still refuses a locked person's existing token;
  - the PINTAR recovery routes give a locked person the ordinary answer.
- **The owner decides** whether CI-1 and CI-2 ship together. I verify each independently.

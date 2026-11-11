# Sign-in by a suspended or closed account: completion page

**A bounded correction of 4.0 behaviour, after B1 and before B2.** Source: `AUTH-SUSPENDED-SIGNIN-CORRECTION.md`
(owner's decision, 11 Nov 2026; `claude/bob-41-master-plan` `adb92aa1`). Review: Sharon, once, on the exact commit;
Daisy only if wording a user sees changes. Status: building. First of the two passes; F-1 follows.

## The defect

`akun_kunci` locks an account with `banned_until = 'infinity'`. Auth cannot read that value. So a suspended or closed
account's sign-in answers 503 «PINTAR sedang tidak dapat memeriksa», whatever password is given, while a wrong password
or an unknown address answers 401 `MASUK_TIDAK_COCOK`. Anyone who tries an address learns whether the account is
suspended or closed, with no password. Through B1, the school admin's accountability reader shows that person's rows
with the "cannot check" outcome, which reveals the suspension.

## What changes

1. **The lock stores a value Auth can read:** one named far-future instant, a single constant, written wherever the lock
   is set. Nothing else in suspension, closure, reinstatement or session ending changes.
2. **One migration rewrites accounts already locked with the old value** to the new one.
3. **From outside, five cases are indistinguishable:** suspended, closed, anonymised, an unknown address and a wrong
   password give the same status, body and wording, in every sign-in method. Response times are measured and recorded.
4. **Inside, the true reason stays where only authorized people read it:** the server log (without the identifier) and
   the suspension's own audit record. **B1's accountability event records `MASUK_TIDAK_COCOK`** for these attempts,
   because the reader is shown to school admins and a platform suspension must not be learnable from it. This is
   Sharon's condition at `1fc719b5`, which the correction page says governs. To be confirmed with her at review.
5. **A real outage still answers 503.** The correction does not turn an unavailable Auth into "wrong password".

## Next state of each consequential action (SYSTEM-INTEGRITY-4.1 §3a)

| Action | Kind | Work in progress | Completed work and history | People and institutions affected | Reversed or repeated | Permission, explanation, confirmation, audit |
|---|---|---|---|---|---|---|
| Lock an account (suspension, closure), now with a readable far-future instant | Reversible: reinstatement clears it, unchanged | Open sittings are held as A1 rules (O41-17), unchanged | Earlier sign-ins and their B1 rows keep what was recorded; the store is insert-only, so rows written before this pass keep the old outcome | The person cannot sign in, and is told only the ordinary refusal; their school learns of a suspension by its existing channels, not from the sign-in or the reader | Reinstating clears the lock and sign-in works. Locking twice keeps the same value. The migration rewrites old values once and is idempotent | Unchanged: the existing suspension and closure permissions, their reasons and their audit rows |

## The four questions

| Question | Answer |
|---|---|
| And then what? | The suspended person sees the ordinary refusal. Their honest route to learning why is the existing one (their school, the account-request channel), confirmed in this pass and not changed |
| What else did that change? | Every reader of `banned_until` found by search (functions, tests, pages; `selftest/db/fable38.sql` compares with `'infinity'`); every sign-in method and the reset and activation routes; Auth's admin user listing; B1's recorded outcome |
| What happens when things go wrong? | A real Auth outage still gives 503. A lock written with the old value after this pass is impossible, because the one constant is the only writer |
| Can it be reversed, and what survives? | Reinstatement works as before. Already-suspended accounts are rewritten by the migration. B1 rows from before the pass are kept as written |

## Tests, red first on `1fc719b5`

- Each sign-in method against a suspended, a closed and an anonymised account gives the same status and body as a
  wrong password. Red today: 503.
- A wrong password and an unknown address are unchanged.
- With Auth unreachable, the answer is still 503.
- Suspend, then reinstate: refused, then works.
- An account locked with the old value, after the migration, is refused in the ordinary way.
- B1-A04 is narrowed to `MASUK_TIDAK_COCOK` (Daisy), adds a wrong-password attempt on the suspended account, and its
  `c.note` becomes a `c.expect` (Sharon). The reader's row reads «Email, username, atau password belum cocok.»
- **Response time:** measured across the five cases and recorded.

## Not done here, and why

- **Observing hosted Auth on staging** needs a suspended test account and a credential, which are the owner's to provide.
  The correction does not wait on it (correction page §2).
- **No change to production** (outside authorization).

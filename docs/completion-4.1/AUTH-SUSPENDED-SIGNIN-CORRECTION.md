# Sign-in by a suspended or closed account · bounded correction

> **Coordination record.** Owner's decision of 11 November 2026 (approved). Kept by the Chief Architect. A separate,
> small correction to existing 4.0 behaviour, run **alongside the C1w F-1 pass, after B1 closes and before B2**. It is
> not a batch, changes no part of THE PLAN, and is **not** a redesign of authentication.

## 1 · The defect

| | |
|---|---|
| Reported by | The engineer, during B1's correction pass (`B1-ARCHITECT-CHECK.md` §9) |
| What | A suspended or closed account that tries to sign in is answered "cannot check right now" (503). A wrong password is answered with the normal refusal (401) |
| Consequences | A suspended person is told the service is down. An outside observer can tell a suspended or closed account from a wrong password, so the response discloses that the account exists and its state |
| Confirmed by running it (Daisy, at `1fc719b5`, local Auth gotrue v2.197.0) | Auth fails with a scan error on `banned_until` (a string that is not a time). The 503 is **independent of the password**: a suspended staff member with a wrong password gets 503; an address that is no one's and an active member with a wrong password both get 401 `MASUK_TIDAK_COCOK`. So the state of an account can be learned by anyone who tries its address, with no password |
| Second consequence, through B1 | Each such attempt is one row in the accountability reader reading «PINTAR sedang tidak dapat memeriksa; diminta mencoba lagi.» A school admin sees only that person's rows reading this way and can infer the suspension, which the ruling on neutral sign-in exists to prevent |
| Where the defect is | In `M/20270113130000…`, which is on `main`. It is 4.0's, not 4.1's |
| Cause, read in the code | `akun_kunci` (`M/20270113130000…:104-114`) locks an account by `update auth.users set banned_until = 'infinity'::timestamptz`. The Auth service cannot read that value as a time, fails, and the sign-in route reports a failed service |

## 2 · Whether hosted Auth does the same (the owner's first instruction)

**Not yet observed; expected.** The value is written directly into `auth.users` by PINTAR's own function, and the
hosted Auth service is the same software reading the same column, so the same failure is expected on staging. The
Chief Architect has not run a sign-in against a hosted project: that needs a suspended test account and a credential,
which are the owner's to provide, and production is outside every authorization.

**To establish it (engineer, on staging only, with a test account the owner designates):** suspend the account, try
to sign in with the right and with a wrong password, and record the route's status and the Auth log's line for each.
No real person's account is used.

**Read-only finding on staging (Chief Architect, 11 Nov 2026, 23:55 UTC; owner authorized a controlled
verification).** Counts only, no personal data read, nothing written:

| On `pintar-staging` | |
|---|---|
| Migrations applied | 224, last `20270113160000`. So the function that writes the `infinity` value is installed |
| Accounts locked with `infinity` | **0** |
| Accounts locked with any other value | 0 |
| Open suspensions | 0 |

**So there is no exposure on staging today:** no account there is in the state that produces the fault. The defect
is latent on staging; it would begin when someone suspends or closes an account there. Production is at 111
migrations and does not have the function at all.

**The active test was not run, by the Chief Architect's judgment.** Observing hosted Auth's behaviour means putting a
synthetic account into the faulty state on staging, which creates the very exposure being measured, and its result
would change nothing now: with no affected account there is nothing to protect urgently, and the correction is the
same either way. It is deferred to the moment it is useful: **the first authorized promotion that carries this
correction verifies, with one synthetic account, that a suspended sign-in on hosted Auth answers as a wrong password
does.** Until then, **no account on staging is to be suspended or closed.**

**A narrow correction for staging (the owner's question).** It is possible in principle: the defect is entirely in
4.0 code that is on `main`, so its core (the lock value, the rewrite of locked accounts, the route's answer) does not
need any 4.1 capability. It is **not recommended now**, because nothing on staging is exposed. To keep the option
open at no cost, the pass states on its page whether its core change depends on any 4.1 object, and keeps the
B1-specific test assertions separable from it.

**The correction does not wait on the answer.** A stored ban value that Auth can read is right in both cases, and the
disclosure through distinguishable responses must be closed in both cases. The observation decides only how urgent a
later staging promotion is.

## 3 · What the correction must do (owner's decision)

1. **Correct the underlying failure:** the lock stores a value Auth can read, for example a fixed far-future instant
   through one named constant. Nothing else in the account lifecycle changes.
2. **No disclosure through the response.** From outside, a suspended account, a closed account, an anonymised
   account, an unknown address and a wrong password are indistinguishable: the same status, the same body, the same
   wording. The engineer also checks that response time does not differ grossly between them, and records what was
   measured.
3. **Accurate internal diagnostics and audit.** Inside, the true reason is kept: the route's own stable failure code,
   the server log (without the identifier), and B1's accountability event with the outcome an authorized admin may
   read. What the outside is told and what the record holds are deliberately different.
4. **Bounded.** No change to how suspension, closure or reinstatement are decided, to session ending, or to any
   other sign-in rule.

## 4 · The four questions, asked of this correction

| Question | What the pass must answer |
|---|---|
| And then what? | The suspended person sees the ordinary refusal. Is there any honest route for them to learn they are suspended, such as the existing notice or their school? That is existing behaviour to confirm, not new work |
| What else did that change? | Every reader of `banned_until`: the `= 'infinity'` comparisons in the suite (`selftest/db/fable38.sql:865,908`) and any function, view or page that tests the lock; every sign-in method (password, card, link, code, recovery PIN) and the password-reset and activation routes; Auth's admin listing of users, which reads the same column; B1's recorded outcome for these attempts |
| What happens when things go wrong? | Auth genuinely unavailable must still answer 503: the correction must not turn a real outage into "wrong password" |
| Can it be reversed, and what survives? | Reinstatement still clears the lock and sign-in works again. **Accounts already suspended hold the old value:** one migration rewrites them to the new one. On staging that is part of a later authorized promotion; production is outside authorization |

## 5 · Tests (red first on the commit before the pass)

- Each sign-in method against a suspended, a closed and an anonymised account: the same status and body as a wrong
  password. Red today: 503.
- A wrong password, and an unknown address: unchanged.
- Auth unreachable: still 503.
- Suspend, then reinstate: sign-in refused, then works.
- An account locked under the old value, after the migration: refused in the ordinary way.
- B1's event for each: the internal outcome is the specific one; nothing specific reaches the response.
- **Daisy's red-first test (design side):** B1-A04 with its accepted codes narrowed to `MASUK_TIDAK_COCOK`, plus a
  wrong-password attempt on the suspended account. Both fail today. The response matches a wrong password in status,
  code and wording, whichever password is given; the reader's row then reads «Email, username, atau password belum
  cocok.»
- **Sharon's acceptance condition (her B1 recheck at `1fc719b5`):** in B1-A04 the present `c.note` becomes a
  `c.expect` that a suspended or closed attempt records `MASUK_TIDAK_COCOK`.

> **To reconcile in the pass, before building.** The line above it asks that the internal outcome be "the specific
> one", and Sharon's condition asks that the accountability event record the same code as a wrong password. They
> differ on one point: what a **school admin** reads in the accountability reader. Sharon's is the safer reading of
> the owner's rule (the reader is shown to school admins, and a platform suspension must not be learnable from it),
> and it governs: **the accountability event records `MASUK_TIDAK_COCOK`.** "Accurate internal diagnostics" is then
> met by the server log and by the suspension's own audit record, which already exist and are read only by those
> authorized. The engineer confirms this with Sharon on the pass's page; it is not a new decision.

The pre-flight of THE PLAN §4.1 (P1 to P6) applies in full. P1's search for readers of the lock is the part most
likely to find something this page did not.

## 6 · Review and order

- **Sharon:** once, on the pass's exact commit: the corrected behaviour and the security boundary.
- **Daisy:** only if any wording a user sees changes.
- **Order at the boundary after B1: this pass first, then F-1.** They are independent (different code), each its own
  commit with its own review. This one goes first because it is a disclosure reachable without a password, and
  because every day it stands, the accountability store gains rows that carry it. B2 opens when both have Sharon's
  PASS.
- **Promotion:** B1 is not promoted ahead of this correction (`B1-ARCHITECT-CHECK.md` §13).
- **Rows already written.** Rows recorded before the correction keep the old outcome. They are a true record of what
  the route answered, and the store is insert-only, so they are not rewritten. On the work branch's test data this
  is of no consequence. Where real rows could exist is a hosted environment that had B1 without this correction,
  which the promotion constraint prevents.

## 7 · Log

| Date | Entry |
|---|---|
| 11 Nov 2026 | Reported by the engineer. Owner approved the bounded correction. Scheduled after B1's close, alongside F-1, before B2 |
| 11 Nov 2026 (late) | Confirmed by Daisy by running it on the local Auth; second consequence through the accountability reader recorded. Sharon's and Daisy's acceptance tests added. Ordered first of the two passes. B1 closed on `1fc719b5`; this pass may start |
| 11 Nov 2026 (23:55 UTC) | Read-only check of staging: 224 migrations, no locked account, no open suspension. No exposure today. Active hosted test deferred to the first promotion that carries the correction. Engineer's completion page is on the work branch at `11171e5bd3e067d2f434f96cba09cf98102b6137` |

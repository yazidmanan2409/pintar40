# A suspension covers accounts created after it · small correction (L1-F2)

> **Coordination record.** Owner's decision of 12 November 2026: **approved in principle, Option B.** Kept by the
> Chief Architect. A small, separately reviewed correction of existing 4.0 behaviour, **before Z**. It does not hold
> L-1, F-1 or B2. It is not a batch and changes no part of THE PLAN.

## 0 · What holds now

1. **Rule (owner).** A person's standing suspension applies to accounts created after the suspension, not only to
   those that existed when it was imposed.
2. **Option B.** The account is created and is locked. Creation is not refused, because a refusal would tell a school
   that the person is suspended.
3. **No window.** The account is locked from the moment it becomes usable. There is no instant at which it can
   authenticate.
4. **Reinstatement releases it**, as it releases the person's other accounts.
5. **Closure is separate.** Creating an account for a **closed** person is its own finding (§5) and needs its own
   determination. Nothing here assumes suspension and closure share lifecycle rules.
6. **Sharon reviews before implementation.** Nothing is built until she has.
7. State: **awaiting Sharon's pre-implementation review.** Not started.

## 1 · The defect

| | |
|---|---|
| Found by | The engineer's bounded search in L-1 (`AUTH-SUSPENDED-SIGNIN-CORRECTION.md` §6b, §6d); table in `docs/completion-4.1/batches/AUTH-SUSPENDED-SIGNIN-CREDENTIAL-PATHS.md` on the work branch once the L-1 fix is pushed |
| What | A person suspended before they had an account can later be given one by a school. The new account is not locked |
| Cause | `akun_kunci` locks the Auth users the person has when it runs. The suspension is a standing state of the person (`person_suspensions`, `orang_ditangguhkan`); the lock is an act at one instant |

## 2 · Design direction (for Sharon's review; the engineer proposes the exact place)

**Make the lock follow the person's state wherever an account becomes usable, rather than only when a suspension
begins.** Three requirements:

1. **Every path that makes an Auth user for a person, or attaches one to a person,** applies the lock in the same
   transaction when `orang_ditangguhkan(person)` is true. The engineer lists those paths from the same search
   (account creation by a school, activation, card-to-email conversion, an address correction that creates a new Auth
   user, anything else found). One shared place is preferred over a check in each path, so that a path added later
   cannot miss it; the natural candidates are the function that links an Auth user to a person, or a guard on that
   link.
2. **No authentication window (owner).** If the Auth user must be created outside the database transaction (through
   Auth's admin interface) before the link is written, then "locked from the moment it becomes usable" has to be
   shown, not assumed: either the user is created already locked, or it cannot authenticate until linked. The page
   states which, and a test attempts a sign-in in the gap.
3. **Reinstatement releases it.** `akun_kunci(person, false)` already clears every account of the person; the test
   proves it for an account created during the suspension.

**The lock check at use from L-1 is not a substitute.** It guards recovery grants and activation permits. An account
created unlocked would still sign in with its password.

## 3 · The four questions

| Question | To answer on the page |
|---|---|
| And then what? | The school creates the account and sees an ordinary success. The person cannot sign in, and is answered as any locked account is. What does the school see if the person reports they cannot sign in? Nothing that names the suspension |
| What else did that change? | Every creation and linking path; the invitation or activation message the person may receive for an account they cannot use; the accountability event for their attempts (ordinary mismatch, as L-1); cards issued to a suspended learner |
| What happens when things go wrong? | Creation succeeds and locking fails: the creation must fail with it. A suspension imposed while a creation is in flight: the two orderings both end locked |
| Can it be reversed, and what survives? | Reinstatement unlocks the account created during the suspension. A suspension that ends and a new one that begins: the account follows the person's state each time |

## 4 · Tests (red first)

- A person suspended with no account, then given one by a school: the creation answers as usual; a sign-in with the
  right password is refused as an ordinary mismatch. Red today: it signs in.
- The same through each other creation or linking path the search lists.
- A sign-in attempted between the Auth user's creation and its linking: refused.
- A suspension and a creation run concurrently, in both orders: the account ends locked.
- Reinstatement: the account signs in.
- An unsuspended person: creation and sign-in unchanged.

Pre-flight of THE PLAN §4.1 in full. The page carries the inventory and the next-state row.

## 5 · Separate finding: account creation for a closed person (L1-F3)

**Not decided here, by the owner's instruction.** Closure is not suspension: `buka_kembali_akun` reopens by a
different act and ends the person's school roles, and a closed person may have asked to leave. The questions a
determination needs:

- Can a school create an account for a closed person today, and what does it get?
- Should it be possible at all, or is a new account for a closed person a reopening that only the reopening act may
  do?
- If refused, what is the school told, given that it may or may not be entitled to know of the closure?
- What of an anonymised person, for whom the old identity no longer resolves?

The engineer reports what happens today for each (read from the code, and one test each). Sharon gives her view. The
determination is then the owner's if it is material; it is recorded here.

## 6 · Review and order

- **Sharon, before implementation:** the design direction of §2, the choice of place, and the no-window requirement.
  Then one result review on the exact commit.
- **Daisy:** only if a screen or message changes (for example, an activation message sent to a suspended person).
- **When:** after the L-1 fix is closed, as its own commit, at any boundary before Z. It does not gate B2.

## 7 · Log

| Date (UTC) | Entry |
|---|---|
| 12 Nov 2026, 05:30 | Owner approved Option B in principle, with the no-window and reinstatement requirements, and separated the closed-person case. Brief written. Awaiting Sharon's pre-implementation review |

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
6. **Sharon's pre-implementation review: PASS on the design** (read at
   `299c417abbe1be3209e4c7dec5ccabe95f06a737`), **with three required design points** (§2a). They replace the open
   choices of §2 and one test line of §4.
7. **The same mechanism applies to a closed person:** a new account is created locked, and only the reopening act
   releases it (Sharon's view; integrity side settled). Two **privacy** questions about closed and anonymised persons
   remain the owner's (§5a).
8. State: **released to the engineer**, to build after the L-1 fix closes, as its own commit, before Z. It gates
   nothing.

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

## 2a · Sharon's three required design points (these govern; §2 above is the record of what was asked)

From the 4.0 code: every account is linked in one place (`handle_new_auth_user`, the AFTER INSERT trigger on
`auth.users`, inserts the `public.accounts` row from the live grant); no migration changes an account's
`auth_user_id` or `person_id` afterwards; an insert that cannot be linked is refused (PR010); `orang_ditangguhkan` is
true for any open `person_suspensions` row, **including `CLOSED_AT_REQUEST`**.

1. **The lock goes on the link: one AFTER INSERT trigger on `public.accounts`** that locks that account's Auth user
   when the person is suspended or closed. Every creation path ends in that insert, so one trigger covers them all,
   and any added later.
   - **Why there is no authentication window:** the account insert runs inside Auth's own insert of the user, in the
     same transaction, so the lock commits with the user or not at all; and an Auth user that cannot be linked is
     refused, so an unlinked user that could authenticate never exists. **The page states both facts.**
2. **Lock the person's row before reading their state.** The link trigger takes `FOR SHARE` on the person's row
   before calling `orang_ditangguhkan`. `tangguhkan_akun` already holds that row `FOR UPDATE`, so whichever comes
   second waits and sees the first. Without it, a suspension and a creation racing each other can both miss.
3. **Auth itself must not be able to clear the lock.** A BEFORE UPDATE OF `banned_until` trigger on `auth.users`
   keeps the lock while the linked person is suspended or closed, against a later update by Auth or by a server call.
   - **Reinstatement still works because of an ordering that must stay and be tested:** `aktifkan_kembali_akun` and
     `buka_kembali_akun` end the suspension row first and only then call `akun_kunci(false)`.

**Her tests, beyond §4:**
1. Atomicity: a lock step forced to fail leaves no Auth user and no account.
2. No unlinked user: an Auth insert with no grant is refused (PR010, asserted again here).
3. The race on two real connections, in both orders, with A2's shared multi-connection helper: the account ends
   locked either way.
4. The lock survives later updates: an admin update, an activation's password set and a sign-in attempt each leave
   `banned_until` at `akun_terkunci_sampai()`.
5. Successive suspensions: suspend, create, reinstate, suspend again. Locked, released, locked.
6. A closed person given an account: it ends locked, no session can be created, and `buka_kembali_akun` releases it.

**Chief Architect's note on test 3.** A2's shared multi-connection helper does not exist yet (A2 has not been
built). The engineer uses the existing two-connection pattern of A1's tests and says so; the helper is not built
early for this.

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
- ~~A sign-in attempted between the Auth user's creation and its linking: refused.~~ (**Superseded by Sharon:** the
  gap cannot exist; test the two facts that make it impossible, §2a tests 1 and 2.)
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

## 5a · After Sharon's view: what is settled and what is the owner's

**Settled on the integrity side.** A new account for a closed person is created locked, by the same trigger; creation
is not refused, because a refusal would tell the school of a closure that is the person's own act; reopening stays a
separate act of the platform. This follows from Option B and needs no further ruling.

**Two privacy questions remain the owner's.** Neither is needed to build this correction. They are put when the
engineer has reported what happens today:

| # | Question | Chief Architect's preliminary view |
|---|---|---|
| P-1 | Should a person who asked to leave receive an invitation or activation message when a school later creates an account for them? | No. A person who closed their account should not be contacted by PINTAR on a school's act; the school sees an ordinary creation. The same question arises for a **suspended** person, who would receive an activation they cannot use, and the same answer is suggested. Wording, if any, is Daisy's |
| P-2 | For an **anonymised** person, may a school start a new identity link from an institutional number? | The deleted identity should never be re-linked: a returning individual is a new person. To be confirmed against what the code does today |

## 6 · Review and order

- **Sharon, before implementation:** the design direction of §2, the choice of place, and the no-window requirement.
  Then one result review on the exact commit.
- **Daisy:** only if a screen or message changes (for example, an activation message sent to a suspended person).
- **When:** after the L-1 fix is closed, as its own commit, at any boundary before Z. It does not gate B2.

## 7 · Log

| Date (UTC) | Entry |
|---|---|
| 12 Nov 2026, 05:30 | Owner approved Option B in principle, with the no-window and reinstatement requirements, and separated the closed-person case. Brief written. Awaiting Sharon's pre-implementation review |
| 12 Nov 2026, 06:00 | Sharon: PASS on the design with three required points and six tests (§2a); the same mechanism for a closed person. Released to the engineer. Privacy questions P-1 and P-2 held for the owner (§5a) |

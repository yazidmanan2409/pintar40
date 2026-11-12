# Sign-in by a suspended or closed account · bounded correction

> **Coordination record.** Owner's decision of 11 November 2026 (approved). Kept by the Chief Architect. A separate,
> small correction to existing 4.0 behaviour, run **alongside the C1w F-1 pass, after B1 closes and before B2**. It is
> not a batch, changes no part of THE PLAN, and is **not** a redesign of authentication.

## 0 · What holds now (read this first; it overrides anything below that differs)

*Kept current by the Chief Architect. Sections below are the record of how we got here; where one has been
superseded it says so at that point and refers back to this list.*

1. The lock is one readable far-future instant, written only by `akun_kunci`; reinstatement clears it.
2. Every sign-in method answers a suspended, closed or anonymised account with **its own** ordinary mismatch, in the
   response and in the accountability event. A real Auth outage still answers 503.
3. The true reason is kept only in the server log (no identifier) and in the suspension's own audit record.
4. PIN recovery treats a locked person as a wrong PIN. The ladder is not cleared by reinstatement.
5. **Recovery grants and activations are checked at use:** `recovery_grant_permit` and `password_write_permit` (for
   `ACTIVATION`) refuse a locked person. Ending grants at locking is optional and not relied on.
6. **A grant used after a suspension** gets the ordinary expired-grant answer, `PEMULIHAN_BERAKHIR`; the password is
   byte-identical; the accountability event records that outcome with no person and an empty school snapshot. **The
   test compares that response and row, field by field, with those of a genuinely expired grant.** (It does *not*
   record `MASUK_TIDAK_COCOK`; that expectation is withdrawn by Sharon.)
7. State: BLOCKED by Sharon on `2ea60c85e4f855eca2175749c4270a170922ee33` for item 5 only; the fix is a new commit
   after F-1's; she rechecks that item alone. Daisy confirms in her F-1 visit; she is not a gate for this pass.
8. Not in this pass: register L1-R1; finding L1-F2 (§6d), put to the owner; any other path found by the bounded
   search.

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
   **"The same as a wrong password" is per method (Daisy, pre-review of the page at
   `11171e5bd3e067d2f434f96cba09cf98102b6137`).** Each sign-in method answers a suspended, closed or anonymised
   account with **its own** ordinary mismatch: `MASUK_TIDAK_COCOK` for a password, `CARD_NOT_MATCHED` for a card,
   `PIN_TIDAK_COCOK` for PIN recovery, and the code and link-request routes' own ordinary answers. It does not mean
   the password screen's code everywhere, which would itself mark the case out. The accountability event records
   that same per-method code; Sharon's `MASUK_TIDAK_COCOK` condition is the password method's instance of this rule.
   `PIN_DITANGGUHKAN` is unrelated and stays: it means PIN recovery was stopped after too many wrong PINs, not that
   the account is suspended. What PIN recovery answers for a suspended account is still to be checked.
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
- **Daisy:** not a gate for this pass. No wording a user sees changed, so L-1 closes on Sharon's PASS, as the owner
  decided. Daisy runs her own short rendered confirmation of the finding she raised (her list on
  `ux-1/daisy-experience` at `f6bc7aa1d50c9a8179fecd4044a7a631bb57f937`) **in the same visit as her F-1 review**,
  on the F-1 commit, which contains this pass. If she finds the screens differ from what she expects, that is a
  finding against L-1 and reopens it.
- **Order at the boundary after B1: this pass first, then F-1.** They are independent (different code), each its own
  commit with its own review. This one goes first because it is a disclosure reachable without a password, and
  because every day it stands, the accountability store gains rows that carry it. B2 opens when both have Sharon's
  PASS.
- **Promotion:** B1 is not promoted ahead of this correction (`B1-ARCHITECT-CHECK.md` §13).
- **Rows already written.** Rows recorded before the correction keep the old outcome. They are a true record of what
  the route answered, and the store is insert-only, so they are not rewritten. On the work branch's test data this
  is of no consequence. Where real rows could exist is a hosted environment that had B1 without this correction,
  which the promotion constraint prevents.

## 6a · Chief Architect's read of the candidate (12 Nov 2026, 01:45 UTC)

Read-only, of `2ea60c85e4f855eca2175749c4270a170922ee33` on `claude/system-integrity-4.0` (the pass's code, tests
and page; it also records B1's close on `B1-COMPLETION.md`). CI run `43132734581` (second attempt) and journeys run
`43132738349` were in progress.

| Point of the brief | As built | Standing |
|---|---|---|
| The lock value | One function, `akun_terkunci_sampai()`, a fixed instant in 2999; `akun_kunci` writes it; reinstatement still writes null; the migration refuses to finish if any account keeps an unreadable value | Met |
| Accounts already locked | Rewritten by the migration; tested with none, some, and run twice (AUTH-A02) | Met |
| Indistinguishable from outside, per method | Auth's own refusal of a banned user (`user_banned`) is mapped to each method's ordinary mismatch in one helper, `src/lib/akun-terkunci.ts`; the page tabulates the answer per method | Met as read; Sharon and Daisy verify by running |
| A real outage | Stays the method's "unavailable" answer | Met as read |
| Internal diagnostics | One server-log line per locked refusal, with a reference and no identifier | Met |
| B1's event | Holds the same per-method code; B1-A04 restated as Sharon and Daisy asked | Met |
| Response time | Medians of nine attempts per case, per route; no gross difference; a pre-existing 15 ms difference between an unknown and a known card recorded, unchanged | Recorded |
| Dependence on 4.1 | None in the core: the migration touches only 4.0 objects, the route change is one new module plus 4.0 modules, and the B1 assertions are a separate file | A narrow correction of `main` remains possible |

**A second defect, found by this pass and closed in it.** Under the old 503, a suspended account that entered the
right recovery PIN was given a recovery grant. Once the lock became readable, that grant could have reset a suspended
account's password. `recovery_attempt` now answers a locked person as a wrong PIN, after the same hashing work. This
is the fourth question earning its place: making one thing work exposed what it had been hiding.

**Two consequences for the reviewers to see, both following from "indistinguishable":**

1. A suspended person who keeps entering their correct PIN climbs the wrong-PIN ladder like anyone entering a wrong
   one, and can reach `PIN_DITANGGUHKAN` with a PIN reset required. **After reinstatement that state remains.** It is
   the price of not marking the case out, and it is acceptable, but the person who reinstates an account should not
   be surprised by it. For Daisy and Sharon to note; no change proposed.
2. **The engineer's question to Sharon: a recovery grant obtained before a suspension and used after it still sets
   the password** (the sign-in after it is refused). The Chief Architect's view, for her ruling: suspension already
   ends every session of the person; an outstanding recovery grant is the same kind of thing, a standing permission
   to act as the account, and should end with them. The natural place is where sessions are ended at locking
   (**superseded:** Sharon ruled this placement insufficient; the check is at use, §0 item 5 and §6c). That
   is a change to what suspension does, so it is **outside this bounded correction** unless Sharon judges it the same
   defect; if she does not, it is recorded as a finding of its own and put to the owner.

## 6b · Sharon's review: BLOCKED on one item (12 Nov 2026)

**Sharon: BLOCKED on `2ea60c85e4f855eca2175749c4270a170922ee33`, for the grant question alone.** She rules it the
same defect on its last remaining path, so its correction is **inside** this pass (§6a item 2 left that to her).
Everything else is verified: the five cases indistinguishable from outside for every method, with the response
times; a real outage still 503; the lock, its one writer, reinstatement and the rewrite; B1-A04 and the
reconciliation; no dependence on 4.1.

**The blocker.** `recovery_grant_permit` (`M/20261115100000…`) issues a password-write permit for any live grant
without asking whether the person is locked, and the route's admin password update ignores the ban. With a
suspension applied because an account is suspected compromised, an attacker holding a ten-minute grant sets their
password during the suspension, and it is live at reinstatement. The suspension contained nothing.

**The correction (hers, accepted):**
- In `recovery_grant_permit`, a locked person's grant is treated as no live grant: the existing
  `RECOVERY_GRANT_INVALID`, the same answer as an expired grant, so nothing new is told apart.
- The same check in `password_write_permit` for `ACTIVATION`: an outstanding activation for a locked person would
  otherwise create a working credential.
- In the two permit functions, **not** in `auth_password_write_guard`: an email correction legitimately clears the
  password through that guard.

**Tests, red first on `2ea60c85e4f855eca2175749c4270a170922ee33`:**
- a grant issued before a suspension and used after it: the ordinary invalid-grant answer, `encrypted_password`
  byte-identical, and ~~B1 records `MASUK_TIDAK_COCOK`~~ (**withdrawn by Sharon, 12 Nov:** with the fix no password
  is set, so the answer and the record are those of an expired grant, `PEMULIHAN_BERAKHIR`, compared field by field
  with a genuinely expired grant; §0 item 6);
- the same for an activation;
- after reinstatement, a fresh recovery works.

**To state on the page (hers):** a locked person who keeps trying their right PIN climbs the ladder; at level 3 the
PIN must be reset after reinstatement. Correct, and a visible after-effect for the school.

**Chief Architect's addition: one bounded search, so this is the last path and not the third of several.** Two
recovery paths have now been found that acted on a locked account without consulting the lock. The shared cause is
that the lock lived only in Auth's sign-in. The pass therefore lists **every path that changes a credential or
issues a standing permission for a person** (password, PIN, card, email address, activation, recovery grant, a
teacher's or admin's reset on the person's behalf) and records for each whether it consults the lock, and whether it
should. It corrects the two permits Sharon named. Anything else found is **recorded and reported, not fixed here**,
unless it is the same one-line check in the same kind of function; an act by an authorized admin on a suspended
account may be legitimate and is not assumed to be a defect.

**Still bounded.** No change to what suspension is, to session ending, or to reinstatement. The core stays on 4.0
objects only.

**Sequence.** F-1 is committed locally on top of this pass and its pre-flight is running; it is not disturbed. The
L-1 fix is a new commit after it. Sharon rechecks **that commit alone, for this item**; her verified items stand.

## 6c · Sharon's ruling on §6a (read at `ca1623c70b0ffcf80ec561e50ae5d04024c6c157`)

1. **The pre-suspension grant is the same defect and inside L-1.** No owner ruling is needed: it does not change
   what suspension does, it makes the existing rule hold on the last path.
   - **Where to fix it: at use.** The Chief Architect's placement in §6a (ending outstanding grants where sessions
     end at locking) is a tidy-up but **not sufficient**: a code verified just before the lock commits can issue a
     grant just after the grants were ended. The two checks in the permit functions (§6b) are stateless, so they
     cover that race and any grant issued by a path added later. **Required:** the two checks at use.
     **Optional:** also ending grants in `akun_kunci`, if the engineer wants the tidier state.
2. **The PIN ladder after reinstatement is acceptable as stated.** It is the price of being indistinguishable, and
   it is correct evidence: the attempts happened.
   - **Reinstatement must not clear it.** An automatic reset would itself mark the case out and would discard a real
     record.
   - **The person who reinstates should not be surprised.** The reinstatement flow, or the person's state as the
     platform admin sees it, should show that a PIN reset is required. No change on the database side, provided the
     existing assisted PIN reset stays available afterwards:
     - suspended, then reinstated: roles are untouched, so the school's assisted recovery still applies;
     - closed, then reopened: `buka_kembali_akun` ends the person's school roles, so the school cannot assist until
       it grants a role again.
   - **To state on the engineer's page.**

**Chief Architect's disposition of the reinstatement point.** Showing "PIN reset required" to whoever reinstates is
a small addition to an existing screen, with Daisy's wording. It is **not part of L-1** (L-1 changes no screen). It
goes on the register as **L1-R1**, to be taken with the next work that touches the account screens or before Z,
whichever comes first, and reviewed by Daisy. The closed-then-reopened case (no school can assist until a role is
granted) is recorded with it as a consequence to confirm, not as a defect.

## 6d · Finding from the bounded search: an account created for a person already suspended (L1-F2)

**Reported by the engineer, not fixed; not yet read in code by the Chief Architect** (the search's table,
`docs/completion-4.1/batches/AUTH-SUSPENDED-SIGNIN-CREDENTIAL-PATHS.md`, is in the local fix commit
`916d12c01345816afcf567b40131e72b9857cf65`, not yet pushed).

| | |
|---|---|
| What | A person suspended **before** they had an account can later be given one by a school. The new account is not locked |
| Shared cause | `akun_kunci` locks the accounts the person has at the instant of suspension. The lock is applied to accounts at a moment; the suspension is a standing state of the person. Anything created for the person afterwards is outside it |
| Why it is not a one-line fix inside L-1 | The act is an authorized admin's, and the correction is a design choice |

**The choice, and the Chief Architect's recommendation.**

| Option | Consequence |
|---|---|
| A. Refuse the creation | The school admin learns that the person is suspended. A platform suspension must not be learnable by a school (the same rule that governs the accountability reader), so this discloses |
| **B. Create the account and lock it at creation (recommended)** | The suspension holds for every account of the person, whenever created. The school sees an ordinary creation; the person's sign-in is answered as any locked account's. Reinstatement, which already clears the lock on all the person's accounts, releases it |

Asked the four questions, B is the only one of the two that keeps what L-1 established: nothing new is told apart,
and reinstatement reverses it completely. The same reasoning should be checked for a **closed** person, where
creating a new account at all may be wrong for a different reason.

**Decided (owner, 12 Nov 2026): Option B approved in principle.** Its brief is
`SUSPENSION-COVERS-NEW-ACCOUNTS.md`; the closed-person case is a separate finding there. The paragraph below is the
record of how it was put.

**Standing (as put).** It is a gap in what suspension covers, not in what a sign-in answers, so it is outside the correction
the owner approved ("do not expand into a general authentication redesign"). **It is put to the owner** as a small,
separate correction before Z, with Sharon's review, after her ruling on the choice. It does not hold L-1's recheck,
F-1, or B2.

## 7 · Log

| Date | Entry |
|---|---|
| 11 Nov 2026 | Reported by the engineer. Owner approved the bounded correction. Scheduled after B1's close, alongside F-1, before B2 |
| 11 Nov 2026 (late) | Confirmed by Daisy by running it on the local Auth; second consequence through the accountability reader recorded. Sharon's and Daisy's acceptance tests added. Ordered first of the two passes. B1 closed on `1fc719b5`; this pass may start |
| 11 Nov 2026 (23:55 UTC) | Read-only check of staging: 224 migrations, no locked account, no open suspension. No exposure today. Active hosted test deferred to the first promotion that carries the correction. Engineer's completion page is on the work branch at `11171e5bd3e067d2f434f96cba09cf98102b6137` |
| 12 Nov 2026 (00:10 UTC) | Daisy's pre-review of the engineer's page: agreed; one clarification taken into §3.2, that the indistinguishable answer is each method's own mismatch. Her check list is on `ux-1/daisy-experience` at `f6bc7aa1d50c9a8179fecd4044a7a631bb57f937` |
| 12 Nov 2026 (00:15 UTC) | **Sharon confirmed the reconciliation of §5:** the accountability event records the ordinary mismatch; the true reason is kept only in the server log (without the typed identifier) and in the suspension's own audit record, which `tangguhkan_akun` writes with no school, so only the platform admin reads it. **To state on the engineer's page:** the platform admin's accountability reader also shows the ordinary mismatch for these attempts, by intent; the reader is not where suspensions are found. Her condition names the password method; under §3.2 it holds per method |
| 12 Nov 2026 (01:45 UTC) | Candidate pushed: `2ea60c85e4f855eca2175749c4270a170922ee33`. Read by the Chief Architect (§6a). A second defect (a recovery grant to a suspended account) found and closed by the pass. CI and journeys running |
| 12 Nov 2026 (02:20 UTC) | CI `43132734581` success on attempt 2 (attempt 1: a runner could not start its database before any test ran; failed jobs re-run once), journeys `43132738349` success, both on `2ea60c85e4f855eca2175749c4270a170922ee33`. Local: 1075 passed, 0 failed; 156 of 156 planted defects. Review prompt issued to Sharon by the engineer. Daisy's role clarified in §6 |
| 12 Nov 2026 (03:00 UTC) | Sharon: BLOCKED on `2ea60c85e4f855eca2175749c4270a170922ee33` for the recovery and activation permits acting on a locked account; all else verified. Correction and tests recorded in §6b, with one bounded search added |
| 12 Nov 2026 (03:20 UTC) | Sharon's ruling on §6a recorded (§6c): checks at use are required, ending grants at locking is optional; the PIN ladder survives reinstatement by design; register item L1-R1 opened |
| 12 Nov 2026 (04:00 UTC) | Sharon withdrew the `MASUK_TIDAK_COCOK` expectation for a grant used after a suspension; the engineer's reading stands. §0 added as the one current statement; the two superseded passages are marked where they stand |
| 12 Nov 2026 (05:00 UTC) | L-1 fix committed locally by the engineer at `916d12c01345816afcf567b40131e72b9857cf65`, red first on `2ea60c85e4f855eca2175749c4270a170922ee33`, in full pre-flight. Bounded search reported one further gap, recorded as L1-F2 (§6d) and put to the owner |

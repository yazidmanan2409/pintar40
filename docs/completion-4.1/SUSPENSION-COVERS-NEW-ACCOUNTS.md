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
   releases it (Sharon's view; accepted by the owner as a reasonable reading of the approved security design).
   **Creating a locked account authorizes nothing else:** not a message, and not reconnecting a deleted identity.
7a. **Privacy principles (owner, 12 Nov 2026; §5b):**
   - **P-1.** No invitation or activation message is sent to a person while they are suspended or closed. The school
     sees an ordinary creation, and suppressing the message must not produce a different visible response.
   - **P-2.** Anonymisation stays meaningful. A deleted identity is never restored through an ordinary
     account-creation workflow; a returning individual is a new person, and their former history and identity links
     do not reappear. **How institutional-number matching works today is examined before any implementation is
     finalized.**
7b. **From the engineer's examination (12 Nov; read from code, tests of today's behaviour still to be written):**
   - **P-1 is already true:** no account-creation path sends a message to anyone, and every success screen says so.
     Nothing is to be suppressed. It is kept true by one guarding test (§5c).
   - **P-2 is not true today:** an anonymised person can be re-attached. This is finding **L1-F4** (§5c). **The
     owner approved its correction; it is governed by `ANONYMISED-PERSON-IS-TERMINAL.md`,** not by this page.
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

## 2b · L1-R2, built with this correction: no password-write permit survives a lock (Sharon's design, 12 Nov 2026)

**Origin.** Sharon's residual from the L-1 recheck: a permit issued in the moment before a lock commits can still be
spent within its one minute. She read this design against `916d12c01345816afcf567b40131e72b9857cf65`.

**Correction to the Chief Architect's reading.** The instructions said her one-line description ("`akun_kunci`
deletes the person's `password_write_permits` when it locks") was the whole design. **It is not.** Under READ
COMMITTED the delete sees only permits already committed. A `recovery_grant_permit` or `password_write_permit` call
that checked the lock before the suspension committed, and inserts its permit after `akun_kunci`'s delete, leaves a
permit that survives. The delete alone does not close the race it was opened for.

**The design (hers; it governs):**
1. **The delete.** When `p_kunci` is true, `akun_kunci` deletes `password_write_permits` for every `auth_user_id` of
   the person, all purposes. On unlock nothing is deleted.
2. **One lock both sides take.**
   - `akun_kunci` locks the person's `accounts` rows `for update`, in id order, in the same query its loop already
     runs.
   - `recovery_grant_permit` and `password_write_permit` lock the account row `for share` **first**, and only then run
     their existing lock check, as a later statement.
   - Then either the permit commits first and the delete removes it, or the issuer waits and its check sees the
     suspension. A refused issuer still gives each method's ordinary answer (for example `PEMULIHAN_BERAKHIR`).
3. **Tests, red first:**
   - a permit committed before the lock is gone afterwards;
   - the two-connection race in both orders, on this correction's helper: issuer first, the permit is gone after the
     lock; lock first, the issuer is refused;
   - two plants: removing the delete turns the first test red; removing the `for share` turns the race test red.

**For the engineer's page.** `akun_kunci` is guarded by AUTH-A02, which is restated with a note. The page states the
lock order this adds (the person's row, taken by the suspending act; then the person's `accounts` rows; the issuers
take only the account row) and that it introduces no cycle with the account-link trigger of §2a, which takes the
person's row `for share` inside an insert into `accounts`.

**Her question, not a requirement: `authorize_card_reissue`.** It issues a permit with purpose `CARD_REISSUE` and
does not check the lock, so a school can reissue a suspended learner's card while the account is locked. Sign-in is
still refused, so nothing is disclosed.

*Chief Architect's view, for the page and for Sharon to accept or correct:* **intended.** A platform suspension must
not be learnable by a school. A school's ordinary act on its own learner, reissuing a lost card, has to succeed as
usual, or its refusal tells the school that something is different about this learner. The card opens nothing while
the account is locked, and reinstatement restores an account whose card the school legitimately replaced. The delete
of item 1 removes a `CARD_REISSUE` permit outstanding at the moment of locking, which is correct: a reissue started
before the lock is simply started again. It is written on the page as intended. If Sharon reads it otherwise, it is a
separate finding and stays out of L1-R2.

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

## 5b · The owner's assessment of P-1 and P-2 (12 Nov 2026)

The owner agrees with both preliminary views of §5a, with these points, which govern:

**P-1 · No message while the restriction is active.**
- A school may create an account record; that does not mean the person should be invited to use an account they
  cannot access. For someone who asked to close their account it could contradict their decision to leave.
- The school sees an ordinary creation response and does not learn the person's status.
- **Nuance (owner):** suppressing the message must not create a different visible success or failure response that
  indirectly reveals the restriction.
- *Open, for the engineer's report:* which creation paths send a message at all, and what the school is shown about
  it today (for example, "invitation sent"). If the school's screen reports a sending, then what it shows for a
  suppressed one is the nuance above, and its wording is Daisy's.
- *And then what?* When the restriction ends, the person has an account and was never invited. Whether reinstatement
  or reopening then sends the message, or the school re-sends it, is to be stated, not left to chance.

**P-2 · Anonymisation must remain meaningful.**
- If PINTAR anonymised a person at their request, their identity is not reconstructed because a school later
  submits the same institutional number. Deletion is not reversible through account creation.
- A returning individual may establish a genuinely new identity, under the normal safeguards. Former learning history
  and identity links must not silently reappear.
- **Before anything is finalized (owner):** the team examines how institutional-number matching works today.

**What this is and is not.** These are principles for the correction and for the report that precedes it. P-1's
suppression is small and belongs with this correction if a message path exists. P-2 is first a **read-only
examination**; if it shows that matching can re-link an anonymised person today, that is a finding of its own,
reported to the owner with its correction proposed, not built on inference.

**The engineer's report (before building the message or matching parts):**
1. For each path that creates an account for a person: is a message sent, by what, and what does the school see?
2. For a person anonymised by `hapus_data_pribadi`: what remains that an institutional number could match (the
   number itself, a hash, an enrolment row)? What does creating a learner or staff member with that number do today:
   a new person, a match to the anonymised one, or a refusal?
3. One test each showing today's behaviour.

## 5c · The engineer's examination, and finding L1-F4

**Source.** The engineer's read-only examination of 12 Nov 2026, from the code. The three tests of today's behaviour
are not written yet. The Chief Architect checked one fact independently on the work branch: of all database
functions, only seven mention `anonymized_at`, and `import_validate`, `import_advance`, `daftarkan_kembali` and
`murid_keluar` are not among them.

### P-1 · Messages: nothing to suppress

- No account-creation path sends a message: single email account, class card, whole-class cards, a new person,
  card-to-email conversion. Bulk intake creates people, never accounts.
- Every success screen tells the school so («PINTAR tidak mengirim…»). No school screen says a message was sent.
- A person is sent a code only when they ask for one at `/aktifkan`. Reinstatement sends nothing.
- **So the owner's P-1 holds today, and the nuance (no revealing difference) cannot arise.** To keep it so: one test
  that a creation for a suspended and for a closed person sends nothing, through the running app and the mail sink,
  so that a path added later which starts sending is caught.
- *One consequence to state:* a locked person who asks for a code at `/aktifkan` is answered as L-1 requires, by the
  route's ordinary answer.

### L1-F4 · An anonymised person can be re-attached (P-2 does not hold today)

| | |
|---|---|
| What PINTAR keeps of a school's own numbers | None. No NIS, NISN or nomor induk column exists; a row without a person id always creates a new person; nothing is matched by number. **So the owner's concern in its literal form (a school submitting the same institutional number) cannot re-link anyone** |
| What survives `hapus_data_pribadi` | PINTAR-issued identifiers: `persons.id`, the PINTAR ID, the institutional identity rows, and the import rows' person and number (their payload is cleared) |
| **The gap** | An import row may name an existing person by their PINTAR id. Neither `import_validate` nor `import_advance` looks at `anonymized_at`. At the former school the row is refused (that school's identity row is kept). **From another school that can see the person, or from a platform admin, it attaches to the same `persons.id`:** a new number, a pending enrolment, and the person's history back under a live enrolment |
| Also | `daftarkan_kembali` (re-enrolling a departed learner) and `murid_keluar` (the departed-learners list) do not check anonymisation |
| Not verified | Which school screens would then show the earlier history; which schools can see an anonymised person's id at all |
| Exposure today | **None on staging:** a read-only count on 12 Nov found no anonymised person among 1,579. Production does not have the deletion function. The defect is latent |

**Why it matters.** Deletion is the one action in the account lifecycle that is **irreversible by policy**. Today it
is irreversible for the person's name and address, but not for the person: an ordinary administrative act can give
the deleted identity a live enrolment again. That is the fourth question failing: the action cannot be reversed by
the person, but can be undone around them.

**Proposed correction (Chief Architect; for the owner's decision and Sharon's pre-implementation review).**

*Rule:* **an anonymised person is terminal.** Nothing new may attach to them: no enrolment, role, account, card,
identity or import row. A returning individual is a new person.

1. **One guard where attachments are made,** on the same pattern as the lock of §2a: an insert that would attach a
   new enrolment, role assignment, account or institutional identity to a person with `anonymized_at` set is refused
   in the database, so that no present or future path can miss it.
2. **The paths answer as for a person who does not exist.** `import_validate` reports the row as it reports an
   unknown person id; `daftarkan_kembali` refuses in the same ordinary way; `murid_keluar` no longer offers an
   anonymised person for re-enrolment. Nothing tells a school that the id once belonged to someone who asked to be
   deleted.
3. **History is untouched.** The rows kept under the PINTAR ID for audit and for the integrity of past results stay
   exactly as they are. Only new attachment is refused.
4. **Bounded.** No change to how deletion is requested, decided or performed.

*Tests, red first:* an import naming an anonymised person, from another school and from the platform (red today: it
attaches); `daftarkan_kembali` on an anonymised learner; `murid_keluar` not listing them; each direct attachment
refused by the guard; a new person with the same name created normally; every historical row byte-identical.

*To be confirmed by Sharon before building:* whether any legitimate act must still attach something to an anonymised
person (for example, the deletion's own bookkeeping, or ending an open enrolment), so that the guard refuses new
attachment and nothing else.

**Decided (owner, 12 Nov 2026): approved.** Its brief is `ANONYMISED-PERSON-IS-TERMINAL.md`, which now governs; the
proposal above is the record of how it was put. P-1 needs only its guarding test.

## 6 · Review and order

- **Sharon, before implementation:** the design direction of §2, the choice of place, and the no-window requirement.
  Then one result review on the exact commit.
- **Daisy:** only if a screen or message changes (for example, an activation message sent to a suspended person).
- **When:** after the L-1 fix is closed, as its own commit, at any boundary before Z. It does not gate B2.

## 7 · Log

| Date (UTC) | Entry |
|---|---|
| 12 Nov 2026 | Owner approved Option B in principle, with the no-window and reinstatement requirements, and separated the closed-person case. Brief written. Awaiting Sharon's pre-implementation review |
| 12 Nov 2026 | Sharon: PASS on the design with three required points and six tests (§2a); the same mechanism for a closed person. Released to the engineer. Privacy questions P-1 and P-2 held for the owner (§5a) |
| 12 Nov 2026 | Owner's assessment of P-1 and P-2 recorded (§5b): no message while restricted, with no revealing difference in the response; anonymisation is never reversed through account creation; matching examined first. The trigger (§2a) may be built; the message and matching parts wait for the engineer's report |
| 12 Nov 2026 | Engineer's examination: P-1 already holds (nothing is sent); P-2 does not (L1-F4: an anonymised person can be re-attached by an import naming their id, and by re-enrolment). Read-only count on staging: no anonymised person. Correction proposed in §5c; awaiting the owner |

> **Correction to this log (12 Nov 2026, 03:45 UTC, read from the clock).** Entries dated 12 Nov after 01:45 UTC carried times that were estimated, not read from a clock, and several were later than the actual time. Those times have been removed. The order of the entries is correct.
| 12 Nov 2026 (08:21 UTC) | L1-R2's design recorded (§2b), as Sharon gave it: the delete **and** a shared lock taken by both sides, with a two-connection race test and two plants. The Chief Architect's earlier reading, that the delete alone was the design, is corrected |

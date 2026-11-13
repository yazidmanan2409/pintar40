# Sign-in by a suspended or closed account: completion page

**A bounded correction of 4.0 behaviour, after B1 and before B2.** Source: `AUTH-SUSPENDED-SIGNIN-CORRECTION.md`
(owner's decision, 11 Nov 2026; `claude/bob-41-master-plan` `adb92aa1`). Review: Sharon, once, on the exact commit;
Daisy only if wording a user sees changes (none changes). First of the two passes; F-1 follows.

## What holds now

- **Status:** Sharon verified everything on `2ea60c85e4f855eca2175749c4270a170922ee33` except the grant item
  (BLOCKED, brief §6b). That item is corrected in its own commit after F-1 (the section «Correction pass» below), for
  Sharon's recheck of that item alone.
- **A recovery grant or an activation never gives a locked person a password.** Both password permits consult the lock
  at use. A grant that a lock covered at any moment of its life is an expired grant, in its answer
  (`PEMULIHAN_BERAKHIR`), its B1 row and its effect (none), during the suspension and after reinstatement.
- **Superseded in this page** (kept where they stand, marked): the question to Sharon on whether such a grant should
  still set the password (answered: it must not, §6b), and the B1 record `MASUK_TIDAK_COCOK` for that case (replaced by
  her corrected expectation: exactly the expired grant's row).
- **Not in L-1:** L1-R1, the screen note «PIN reset required» for whoever reinstates (brief §6c). One finding of the
  bounded search is reported, not fixed (below).

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
   **Per method** (brief §3.2, Daisy's pre-review): each method answers a suspended, closed or anonymised account with
   its own ordinary mismatch: `MASUK_TIDAK_COCOK` for a password, `CARD_NOT_MATCHED` for a card, `PIN_TIDAK_COCOK` for
   PIN recovery, and the code and link-request routes' own ordinary answers. `PIN_DITANGGUHKAN` is unrelated and stays:
   it means PIN recovery was stopped after too many wrong PINs.
4. **Inside, the true reason stays where only authorized people read it:** the server log (without the identifier) and
   the suspension's own audit record. **B1's accountability event records `MASUK_TIDAK_COCOK`** for these attempts,
   because the reader is shown to school admins and a platform suspension must not be learnable from it. This is
   Sharon's condition at `1fc719b5`, which the correction page says governs. To be confirmed with her at review.
   The event records the same per-method code as the response. **The platform admin's reader also shows the ordinary
   mismatch for these attempts, by intent:** no record a reader sees carries the suspension. The suspension itself is
   in its own audit record, which the platform admin reads in «Jejak audit».
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

## As built

- **Migration** `20270116130000_a_locked_account_is_locked_until_a_date_auth_can_read.sql`:
  - `akun_terkunci_sampai()` returns `2999-12-31 23:59:59+00`, which Auth reads. Every client role is refused it.
  - `akun_kunci` locks with it; reinstatement still writes null.
  - Accounts locked with `'infinity'` are rewritten to it.
  - The rewrite is tested with no locked account, with one, and run twice (AUTH-A02).
- **Readers of the lock:** `akun_kunci` is the only writer. The only readers that compared with `'infinity'` were two
  test lines (F38-A01, F38-A04), now restated to the constant with notes. No database function, view or policy reads
  the column. Auth's admin reads (`getUserById` and the like) used to fail for a locked user and now work.
- **Answers, per method:**

  | Method | Answer |
  |---|---|
  | Password | 401 `MASUK_TIDAK_COCOK` |
  | Card | 401 `CARD_NOT_MATCHED` |
  | Activation code and recovery code | 400 `KODE_TIDAK_COCOK` |
  | Recovery PIN | 400 `PIN_TIDAK_COCOK` (`PIN_DITANGGUHKAN` unchanged) |
  | Link request and callback | Their own ordinary answers (links are switched off) |

  - A real Auth outage stays 503.
  - Each locked refusal writes one server-log line with no identifier.
  - B1's event holds the same per-method code.
- **Found and closed in this pass (the old 503 had hidden it):** a suspended account with the right PIN was given a
  recovery grant (200). With a readable lock that grant could have reset a suspended account's password.
  `recovery_attempt` now answers a locked person as a wrong PIN, after computing the PIN hash, so timing is unchanged.
- **A grant obtained before a suspension and used after it:** *(superseded by «Correction pass» below: the grant is
  now refused at the permit; Sharon, brief §6b)*
  - ~~The route answers as always, and B1 records `MASUK_TIDAK_COCOK`; it used to record `LAYANAN_TIDAK_TERSEDIA`.~~
  - ~~The password is still set, and the sign-in after it is refused. **Question for Sharon:** should a locked account's
    grant still set the password? Changing that is outside this correction's scope.~~ Answered: it must not (§6b).
- **Response time:** medians of 9 attempts per case, through the running app:

  | Route | Locked cases | Unknown | Wrong credential |
  |---|---|---|---|
  | Password | 812–814 ms | 813 ms | 813 ms |
  | Activation code | 23 ms | 21 ms | 23 ms |
  | Recovery PIN | 68–69 ms | 69 ms | 68 ms |
  | Card | 39 ms | 24 ms | 39 ms (wrong PIN) |

  - No gross difference anywhere.
  - An unknown card is about 15 ms faster than a known one. That was already the case, and it doesn't separate a locked
    card from a wrong PIN; recorded, not changed.
- **Dependence on 4.1:** none in the core. The migration touches only 4.0 objects (`akun_kunci`, `recovery_attempt`,
  `auth.users`). The route change is `src/lib/akun-terkunci.ts` plus 4.0 modules. B1-A04's assertions are a separate
  change in `selftest/b1-layar.test.ts`.
- **Honest route for the person to learn their state (confirmed, unchanged):**
  - A closed account has «buka kembali» on the sign-in screen.
  - A suspended person learns through their school or the platform.

## Cross-module inventory (SYSTEM-INTEGRITY-4.1 §2)

| Interface | Checked how | Evidence | Limitation |
|---|---|---|---|
| Every sign-in method (password, username, card, activation code, recovery code, recovery PIN, link) against suspended, closed and anonymised accounts, with the right and a wrong credential | Same status, body and wording as that method's ordinary mismatch | AUTH-A01, red on `1fc719b5127313bf24084695fa30d7505e15b5d1` (503, and a 200 PIN grant) | Link success can't be exercised (links are off) |
| Auth outage | Still 503 in every decision and through the running app | AUTH-K01, AUTH-A02 | — |
| The lock: writer, readers, reinstatement, rewrite | One constant; readers restated; reinstatement works; rewrite with none, some, twice | AUTH-A02, AUTH-A01, F38-A01, F38-A04 | — |
| B1 accountability reader (school admin and platform admin) | Records and shows the per-method ordinary mismatch; no record carries the suspension | B1-A04 (restated: Sharon's `c.expect`, Daisy's narrowed code), AUTH-A01 | Rows written before this pass keep the old outcome (insert-only) |
| PIN recovery (`recovery_attempt`) and its plants | Refuses a locked person as a wrong PIN; plants bob24-8, bob24-9 and bob24-12 still prove their gates | AUTH-A01, plants 156 of 156, F16-* | — |
| Recovery grant used after a suspension | ~~Ordinary answer; B1 records `MASUK_TIDAK_COCOK`~~ *(superseded: see «Correction pass»)* | AUTH-A01 | ~~Sharon's question~~ answered in §6b |
| Recovery grant and activation for a locked person (correction pass) | Both permits consult the lock; the grant is an expired grant in answer, B1 row and effect | AUTH-A01 (restated), AUTH-A03 | The race between a lock and the wizard's session check is exercised by calling the route's two calls directly |
| Suspension, closure, L4, session ending | Unchanged; the suites stay green | L1–L4, F38-*, AKUN-*, CABUT | — |

**Transitions (§3):** suspension and reinstatement (AUTH-A01); closure and L4 (AUTH-A01, F38); retries (the counted
mismatch); an old value surviving into the new code (AUTH-A02). Corrections, transfers and an emergency stop don't
apply.

## Not done here, and why

- **Observing hosted Auth on staging:** deferred to the first promotion that carries this correction. Staging has no
  locked account (read-only check), and no staging account was suspended.
- **No change to production** (outside authorization).

## Correction pass: the grant item (Sharon, brief §6b and §6c)

Sharon BLOCKED `2ea60c85e4f855eca2175749c4270a170922ee33` on one item: a recovery grant obtained before a suspension
set a password during it, live at reinstatement. She ruled it the same defect on its last path, so its correction is
in L-1. It is its own commit, after F-1, for her recheck of this item alone.

**As built** (migration `20270117110000_a_locked_account_is_given_no_password_by_a_grant_or_an_activation.sql`):
- **`recovery_grant_permit`:** a grant lives only while no lock has covered any moment of its life: the person is
  not locked now, and no suspension of theirs (one since ended included) overlaps the time since the grant was
  issued. Otherwise it is the existing `RECOVERY_GRANT_INVALID`, the expired grant's answer.
  - So a grant from before a suspension stays dead after reinstatement. A grant issued after reinstatement works as
    before.
  - This makes the optional step (ending grants in `akun_kunci`) unnecessary, so `akun_kunci` is unchanged.
- **`password_write_permit` (`ACTIVATION`):** a locked person is refused with `ACCOUNT_LOCKED`. Only the service
  role's activation route reads it. The route answers as it answers any locked person in the wizard, 401
  `BELUM_MASUK`, and writes one server-log line with no identifier.
- **Not in `auth_password_write_guard`:** an email correction legitimately clears the password through it. The
  migration's own check refuses to finish if the guard consults the lock, or if either permit doesn't.
- **Unchanged:** what suspension is, session ending, reinstatement, `akun_kunci`, the PIN ladder. The core stays on
  4.0 objects only.

**The B1 record (Sharon's corrected expectation; supersedes her earlier test line):** with no password set, there is
no sign-in to refuse. So a locked person's grant is recorded exactly as a genuinely expired grant is:
`SIGN_IN_FAILED`, `PASSWORD`, `PEMULIHAN_BERAKHIR`, no person and no school. The test compares the two rows in every
column but the row's id and time, and the two responses in status and body.

**Tests, red first on `2ea60c85e4f855eca2175749c4270a170922ee33`:**

| Test | What it shows |
|---|---|
| AUTH-A01 (restated, a note at the change) | A grant from before the suspension, used during it: the same response and the same B1 row as an expired grant of the same account from the same network; the password hash byte-identical. Used again after reinstatement: the same. A fresh recovery after reinstatement sets the password and signs in (`SIGN_IN_OK`) |
| AUTH-A03 (new) | A person whose activation was started, then suspended: the wizard's password step answers 401 `BELUM_MASUK` and writes nothing. The route's two calls, made directly as in the moment after a lock: the permit answers `ACCOUNT_LOCKED`, Auth's admin password write is refused by the guard, and the hash is byte-identical. Reinstated, the activation goes on and sets the password |
| Migration-count pins | 234 to 235 (restated, with notes) |

### The PIN ladder after reinstatement, and the two reinstatement cases (to state here, §6c)

- **The ladder's consequence:** a locked person who keeps trying their right PIN climbs the wrong-PIN ladder like
  anyone. At level 3 the PIN must be reset after reinstatement. Reinstatement does not clear it, by Sharon's ruling:
  an automatic reset would mark the case out and discard a real record. It is a visible after-effect for the school.
- **Suspended, then reinstated:** the person's roles are untouched, so their school's assisted PIN reset still applies.
- **Closed, then reopened:** `buka_kembali_akun` ends the person's school roles. No school can assist until one grants
  a role again. Recorded as a consequence to confirm, not as a defect.
- **Not in L-1:** showing «PIN reset required» to whoever reinstates is register item **L1-R1**, with Daisy's
  wording.

### The bounded search: every path that changes a credential or issues a standing permission

The full table (20 rows, with `file:line`) is `AUTH-SUSPENDED-SIGNIN-CREDENTIAL-PATHS.md`. In summary:

| Path | Consults the lock? | Should it? | Done here |
|---|---|---|---|
| `recovery_attempt` (PIN recovery) | Yes (L-1) | Yes | Already done in L-1 |
| `recovery_grant_permit` | Now yes | Yes | **Fixed** |
| `password_write_permit` (`ACTIVATION`) | Now yes | Yes | **Fixed** |
| `recovery_grant_issue` (both grant paths) | No; it is stopped upstream (Auth refuses the code, `recovery_attempt` the PIN) | Defence in depth only: the permit's check already makes any grant to a locked person dead | Recorded |
| `activation_code_target`, `recovery_code_target` (codes sent by email) | No | Optional: the code fails at Auth's verify; checking would only save an email | Recorded |
| Self-service on the person's own session: `set_my_pin`, `claim_username`, `complete_my_setup`, the wizard, `sesi_buka`, `my_identity_card` | Yes, twice: the lock ends their sessions and Auth refuses a new one; the per-request check refuses a suspended person | No more is needed | — |
| `auth_password_write_guard` | No | No (Sharon: the check belongs at the permits) | — |
| Admin acts: `admin_reset_recovery`, card reissue, card-to-email conversion, email correction, `correct_username` | No | No: deliberate acts by an authorized school or platform admin. Auth's admin write never clears the ban, so the account stays locked | — |
| **`authorize_account_activation` with `handle_new_auth_user`** (a school creates a person's first account) | No | **Yes: a finding** | **Reported, not fixed** |

**The finding.** `tangguhkan_akun` suspends a person who has no account yet. `akun_kunci` then has no Auth user to
lock. If a school then creates that person's account, the new Auth user is not banned:
- a class card signs in with its PIN;
- only the per-request check refuses what follows.

The fix is a design choice: refuse at creation, or lock the new user at creation. And the act is an authorized
admin's. So it is outside "the same one-line check in the same kind of function", and is put to the Chief Architect.

**Not verified:** that Auth's code verify refuses a banned user with `user_banned`. The email-recovery and activation
rows rely on it, as the routes already do (`src/lib/aktivasi.ts`, `src/lib/pemulihan.ts`). AUTH-A01 shows the right
code answered as the ordinary mismatch for a suspended account, through real Auth.

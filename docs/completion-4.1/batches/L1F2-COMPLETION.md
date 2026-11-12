# L1-F2 · A suspension covers the accounts made after it, with L1-R2 (completion page)

**Its own commit, after the L-1 fix, before Z. It gates nothing.** Source: `SUSPENSION-COVERS-NEW-ACCOUNTS.md` on
`claude/bob-41-master-plan` (§0; §2a, Sharon's three design points and six tests; §2b, her L1-R2 design, settled
12 Nov with the card reissue; §5c, P-1). Read at `e8a3996925ba46539125dc8e8cd5706fb6703695`. Reviews: Sharon once, on
the exact commit. No screen changes, so Daisy is not asked.

## For Sharon: the delta review after your BLOCKED of `e27f4a77…` (this is the prompt; it supersedes the next)

**Your verdict:** BLOCKED on one item, the lock order has a cycle (`claude/gracious-lamport-0m1qjr` at
`5941e3b7ef9c16f473eb6ba2139e7c95ccd17854`, `L1F2-e27f4a77a10c7c448170bb2851462e4561daadf7.md`). **Candidate:** the
commit on `claude/system-integrity-4.0` that carries this section; its 40-character hash is in the review queue. It
is its own commit, above `55fb9b9b93d75c0d683f8be543f30436246c3be2`.

**Please verify, as a delta on `e27f4a77`:**
1. **Your fix:** both issuers take the person row `FOR SHARE` first, then the account row, then their check
   (migration `20270117190000_the_person_row_is_locked_before_the_account_rows.sql`).
2. **L1R2-R02**, your deadlock order on two real connections. **Red on `55fb9b9b`:** "deadlock detected", the issuer
   aborted. Green here: both complete, the suspension commits after waiting, no permit survives.
3. **The structural line, L1R2-S02:** each issuer's first lock is on `persons`.
4. **L1R2-R01's plant**, restated: it removes the issuer's person lock **and** its account lock, with L1-F4's guard
   switched off as before. You asked to keep the account lock; either lock alone serialises that race against the
   suspending act, so removing only the person lock leaves the race safe and the plant cannot bite.
5. **Read this first: the engineer's search found the same shape in three more acts, and a second cycle.**
   - `authorize_card_reissue`, `authorize_card_conversion` and `authorize_email_correction` take the account row
     `FOR UPDATE`, then insert where L1-F4's guard takes the person row. **Changed:** the person row first.
   - **The second cycle, made by L1-R2.** Auth's own write of a reissued card holds the `auth.users` row, and its
     trigger `auth_card_email_guard` then updates the `accounts` row. `akun_kunci` took the `accounts` rows and then
     updated `auth.users`. A school's card reissue for a learner who is being suspended at that moment could deadlock
     with the suspension: L1F2-A01's own path. Before L1-R2, `akun_kunci` locked no account row, so the cycle did not
     exist. **Changed:** `akun_kunci` takes the person's `auth.users` rows `FOR NO KEY UPDATE`, in id order, before
     their accounts. Auth's order cannot be changed; ours can.
   - **L1R2-R03** proves it on two real connections. **Red on `55fb9b9b`:** "deadlock detected", the card's Auth
     write aborted. Green here.
   - **Why `NO KEY UPDATE`:** it waits for any `UPDATE` of the row (Auth's write). It does not wait for the
     `FOR KEY SHARE` a foreign key's check takes when a permit or a session is inserted, which needs no ordering. With
     `FOR UPDATE`, it also serialised permit inserts through the foreign key, a fourth hidden lock that masked
     L1R2-R01's plant.
6. **The rule and every path,** in "The lock order" below, corrected where it stood.

PASS or BLOCKED, on the candidate.

## For Sharon: the result review (the first prompt, on `e27f4a77`; superseded by the section above)

**Candidate:** the commit on `claude/system-integrity-4.0` that carries this page, one above B2
`bfe949b11935763a8c8ed7b91f4adcdbcea93645`. Its 40-character hash is given in the review queue
(TEAM-INSTRUCTIONS.md) when it is pushed. It is verified alone, not stacked.

**Please verify:**
1. **Your three design points** (§2a): the trigger on `public.accounts` and the two facts that leave no window; the
   person's row `FOR SHARE` before their state is read; the guard on `banned_until`, and reinstatement ending the
   suspension row before it unlocks.
2. **Your L1-R2 design** (§2b): the delete of `RECOVERY` and `ACTIVATION` permits only; `akun_kunci` taking the
   person's `accounts` rows `FOR UPDATE` in id order; both issuers taking the account row `FOR SHARE` first.
3. **The lock order** below, and that it has no cycle.
4. **One finding about your plants (read this first):** as you specified them, the two race plants cannot turn
   anything red on this tree. Three locks that already exist serialise both races. The section "Why the race plants
   needed the other locks out of the way" explains this, and what the tests do instead. Please confirm that reading.
5. **The card reissue for a locked learner** is written as intended, with its one test (L1F2-A01).
6. **P-1's guarding test** (L1F2-A02), and the restated AUTH-A02.

PASS or BLOCKED, on the candidate.

## What holds now

- **Status: built, awaiting Sharon's result review.**
- **Rule (owner):** a person's standing suspension or closure applies to accounts created after it. The account is
  created, and it is locked (option B). Creation is not refused, because a refusal would tell the school.
- **No authentication window.** The page states the two facts §2a asks for:
  - the account row is inserted by `handle_new_auth_user` inside Auth's own insert of the user, in one transaction,
    so the lock commits with the user or not at all;
  - an Auth user that cannot be linked is refused (PR010), so an unlinked user that could authenticate never exists.
  Both are tested (L1F2-S04).
- **Card reissue for a locked learner is intended** (Sharon, settled 12 Nov). The reissue writes only the card's
  email and password. It never touches `banned_until`. The new card opens nothing until reinstatement, and afterwards
  it is simply the learner's card. A `CARD_REISSUE` permit outstanding at a lock is not deleted.
- **P-1 is already true** and is kept true by one guarding test: no account-creation path sends a message to anyone.
- **L1-F4's required change is not in this commit.** It follows, in the L1-F2 commit set, and uses the harness built
  here (`selftest/balapan.ts`) for its third order.

## As built

**Migration** `20270117160000_a_suspension_covers_the_accounts_made_after_it.sql`:

1. **The lock on the link** (§2a point 1). `akun_baru_terkunci()`, fired by `_l1f2_accounts_terkunci`, an AFTER
   INSERT trigger on `public.accounts`. It takes the person's row `FOR SHARE` (§2a point 2), then, if
   `orang_ditangguhkan(person)`, sets the Auth user's `banned_until` to `akun_terkunci_sampai()`.
   - `orang_ditangguhkan` is true for any open `person_suspensions` row, `CLOSED_AT_REQUEST` included. So a closed
     person's new account is locked too (§0 item 7), and only `buka_kembali_akun` releases it.
2. **Auth cannot clear the lock** (§2a point 3). `kunci_tetap_jaga()`, fired by `pintar_kunci_tetap_jaga`, a BEFORE
   UPDATE OF `banned_until` trigger on `auth.users`. While the linked person is suspended or closed, any other value
   is put back to `akun_terkunci_sampai()`.
   - Reinstatement still works: `aktifkan_kembali_akun` and `buka_kembali_akun` end the suspension row first, and only
     then call `akun_kunci(false)`. That order is unchanged, and L1F2-S03 and S05 test it.
3. **L1-R2** (§2b):
   - `akun_kunci` takes the person's `accounts` rows `FOR UPDATE`, in id order, in the query its loop already ran.
   - When it locks, it deletes those accounts' `password_write_permits` with purpose `RECOVERY` or `ACTIVATION`. A
     `CARD_REISSUE` permit is left alone. On unlock nothing is deleted.
   - `recovery_grant_permit` and `password_write_permit` take the account row `FOR SHARE` first. Only then do they run
     their existing lock check, as a later statement. Under READ COMMITTED that statement has a fresh snapshot, so a
     suspension that committed while the issuer waited is seen. A refused issuer gives its existing answer
     (`ACCOUNT_LOCKED` for activation; the recovery route's ordinary `PEMULIHAN_BERAKHIR`).
4. **A structural verification block** (ADR-0003): the two triggers exist; `akun_kunci` locks and deletes the two
   purposes; both issuers take `FOR SHARE`; no trigger function is client-callable.

No route, page or copy changes. No `src/lib/hle.ts` key is added.

## The lock order (§2b, "for the engineer's page"; corrected after Sharon's BLOCKED of `e27f4a77`)

**The rule: the person's row before their `auth.users` rows, before their `accounts` rows, before their permits.**
`persons` → `auth.users` → `accounts` → `password_write_permits` (and the other rows an L1-F4 guard protects).
Every path that takes two of these takes them in that order.

**Every path that takes an account row or an `auth.users` row and then reaches the person** (directly, or through an
L1-F4 guard on its insert). Found by reading every function that locks or updates `accounts` or updates `auth.users`,
and every trigger on `auth.users`:

| Path | Before this correction | Now |
|---|---|---|
| `tangguhkan_akun`, `minta_akun` (CLOSE) → `akun_kunci` | person `FOR UPDATE`, then accounts `FOR UPDATE`, then `auth.users` | **Changed:** person, then `auth.users` `FOR NO KEY UPDATE` (id order), then accounts `FOR UPDATE` (id order), then permits |
| `aktifkan_kembali_akun`, `buka_kembali_akun` → `akun_kunci(false)` | the open suspension row `FOR UPDATE` (no person row), then accounts, then `auth.users` | **Changed** with `akun_kunci`: the suspension row, then `auth.users`, then accounts. They never ask for the person row, so they conform |
| `recovery_grant_permit` | account `FOR SHARE`, then the permit insert's L1-F4 guard took the person: **account → person** (Sharon's cycle) | **Changed:** person `FOR SHARE`, account `FOR SHARE`, check, insert |
| `password_write_permit` | the same: **account → person** | **Changed:** the same |
| `authorize_card_reissue` | card account `FOR UPDATE`, then `card_reissues` and permit inserts' guards took the person: **account → person** | **Changed:** person `FOR SHARE` first |
| `authorize_card_conversion` | card account `FOR UPDATE`, then the `card_conversions` guard: **account → person** | **Changed:** person `FOR SHARE` first |
| `authorize_email_correction` | email account `FOR UPDATE`, then the `email_corrections` guard: **account → person** | **Changed:** person `FOR SHARE` first |
| Auth's write of a card (`auth_card_email_guard`, BEFORE UPDATE OF email on `auth.users`) | `auth.users` row, then the `accounts` row: **auth.users → accounts**, against `akun_kunci`'s accounts → `auth.users` (the second cycle) | **Conforms** now that `akun_kunci` takes `auth.users` first. Auth's own order is unchanged |
| Auth's password write (`auth_password_write_guard`) | `auth.users` row, then the permit (delete), then `account_setup` (update; `accounts` read, not locked) | **Conforms** (`auth.users` → permits) |
| `auth_email_correction_guard`, `kunci_tetap_jaga` (BEFORE UPDATE on `auth.users`) | `auth.users` row; `accounts` and the person read, not locked | **Conforms** |
| The account-link trigger (`_l1f2_accounts_terkunci`) and L1-F4's guard on `accounts` | inside an insert of a **new** `accounts` row: the person `FOR SHARE`. The new row is invisible to `akun_kunci` until it commits | **Conforms** |
| `hapus_data_pribadi` (with L1-F4's change) | request row, then person `FOR UPDATE`, then the accounts read (not locked) and `auth.users` updated | **Conforms** (person → `auth.users`) |
| `minta_akun` (with L1-F4's change) | person `FOR UPDATE`; the record of what it held is read only; then `akun_kunci` | **Conforms** |

*(Superseded, kept as the record. The statement below was wrong: an issuer did ask for the person's row, through
L1-F4's guard on its insert, after it held the account row. Sharon found it; the engineer's search found three more
acts and the second cycle above.)*

~~**No cycle:**~~
- ~~**The link trigger** holds no lock on an existing `accounts` row that the suspending act waits for. The row it
  inserts is not visible to `akun_kunci` until it commits. It waits on the person's row, or the suspension waits on
  it. Never both.~~ *(This one holds, and is in the table above.)*
- ~~**An issuer** holds only its account row. It waits on step 2, or step 2 waits on it. It never asks for the person's
  row. L1-F4's guard on `password_write_permits` does take the person's row `FOR SHARE`. The suspending act takes that
  row before step 2, so the order is still person, then account, on both sides.~~ *(Wrong: the issuer had already
  taken the account row when the guard asked for the person.)*
- ~~**L1-F4's guard on `accounts`** (`_l1f4_accounts_person_id`) takes the person's row `FOR SHARE` before the insert.
  That is the same row and the same mode as the link trigger, so it adds nothing to the order.~~ *(This one holds.)*

## Why the race plants needed the other locks out of the way (a finding about Sharon's plants)

Sharon's two plants were "remove the link trigger's `FOR SHARE`" and "remove the issuer's `FOR SHARE`". Built exactly
so, **neither turned its race red.** Each race is already serialised by locks that exist on this tree without
L1-F2:

| Race | What already serialises it |
|---|---|
| Suspension against account creation | L1-F4's attachment guard on `accounts` takes the person's row `FOR SHARE` before the insert. The product's creation path also locks the activation grant's row, which the suspending act touches. The foreign key `accounts_person_id_fkey` takes `FOR KEY SHARE` on the person. Postgres fires AFTER triggers in name order, and the `RI_` check runs before `_l1f2_…` |
| Permit issue against lock | L1-F4's attachment guard on `password_write_permits` takes the person's row `FOR SHARE` before the insert |

So L1-F2's own locks are not, today, the only thing that makes these races safe. They are still required: each of
those other locks belongs to another rule and can change for that rule's reasons. **The tests now prove that L1-F2's
locks hold on their own, and that the plant bites:**
- **L1F2-R01.** For its plant phase it switches off L1-F4's guard on `accounts`. It renames the link trigger
  (`"A_l1f2_tanam"`) so that it fires before the foreign key's check. It creates the account by the seed's path,
  which uses no grant. Then:
  - with the trigger's `FOR SHARE`, suspension first still ends locked;
  - with it removed, the account is left open.
- **L1R2-R01.** For its plant phase it switches off L1-F4's guard on `password_write_permits`. Then:
  - with the issuer's `FOR SHARE`, issuer first leaves no permit;
  - with it removed, the permit survives the lock.
- Each change is committed so the other connection sees it, and each is put back in a `finally`. The function bodies
  are restored from `pg_get_functiondef`, exactly as they were.

These two plants live inside their tests, not in `selftest/plants/`, because each needs two connections and DDL
around the race. The delete's plant (`l1f2-1`) is an ordinary plant.

## The engineer's statements the brief asks for

- **Every creation path ends in the one insert.** The search in L-1 (`AUTH-SUSPENDED-SIGNIN-CREDENTIAL-PATHS.md`)
  lists account creation by a school (EMAIL and class card), activation and card-to-email conversion. Each reaches
  `public.accounts` only through `handle_new_auth_user`. No migration changes an account's `auth_user_id` or
  `person_id` afterwards. So one trigger covers them all, and any path added later.
- **What the school sees** when a suspended person cannot sign in: nothing that names the suspension. The creation
  answers as an ordinary creation (L1F2-A02). The sign-in answers as L-1 made every locked account answer: the
  ordinary mismatch for its method.
- **The activation's password set** goes through Auth's admin update, which writes `banned_until` among its
  columns. The guard keeps the lock (L1F2-S02 in the database). A real Auth admin password write leaves it locked
  through the app: the card reissue (L1F2-A01).

## Tests and plants

| Id | What | Red first, on `bfe949b11935763a8c8ed7b91f4adcdbcea93645` (the migration taken out) |
|---|---|---|
| L1F2-S01 | A suspended person given an account: created locked | red: `open` |
| L1F2-S02 | The lock survives later updates: one clearing `banned_until`, one of another column, one setting a nearer date (§2a test 4) | red: `open\|open\|other:…` |
| L1F2-S03 | Successive suspensions: suspend, create, reinstate, suspend: locked, released, locked (test 5) | red: `open\|open\|locked` |
| L1F2-S04 | Atomicity: a lock step forced to fail leaves no Auth user and no account (test 1). An Auth insert with no grant is refused PR010 (test 2) | red: the insert `went through` (no lock step to fail) |
| L1F2-S05 | A closed person given an account: locked; `buka_kembali_akun` releases it (test 6) | red: `open\|open` |
| L1R2-S01 | A lock leaves no `RECOVERY` or `ACTIVATION` permit; a `CARD_REISSUE` permit stays; an unlock deletes nothing; another person's permits are untouched | red: `mine 1` |
| L1F2-R01 | The race on two real connections, both orders: the account ends locked. Then the plant, as above | red: the trigger does not exist |
| L1R2-R01 | Permit issue against lock, both orders: issuer first, no permit survives; lock first, the issuer is refused `ACCOUNT_LOCKED` and writes none. Then the plant, as above | red: the plant's fragment is not in the function |
| L1F2-A01 | **Card reissue for a locked learner** (through the app, real Auth). It answers as for one not suspended: the same status and shape. It writes the same `account.card_reissued` row. `banned_until` stays `akun_terkunci_sampai()`. The new card is refused, and the refused attempt leaves the lock. After reinstatement the card signs in | **green on base, by design.** It pins behaviour that already held (Sharon's reading at `916d12c0`). L1-F2 must not change it, and the delete's purpose list is what protects it |
| L1F2-A02 | **P-1's guarding test.** An EMAIL account for a suspended person and a class card for a closed person answer as ordinary creations. Nothing is sent to anyone (the mail sink). Both are created locked, and an ordinary one is not | red: `suspended open, closed open` |

- **Plant `l1f2-1`** removes the delete from `akun_kunci`: L1R2-S01 reads `mine 1`. Gate `db-l1f2-gates`, control 6
  green rows. Run in CI's red-case group "db · bob37 bob24 bob39 bob04 fable04 l1f4 b2 l1f2".
- **The shared harness** `selftest/balapan.ts` (THE PLAN §5.3 H's shared multi-connection helper; Addendum 1: L1-F2,
  L1-F4, A2a and A3 use it). It is built once, here:
  - `psqlLain` runs SQL on a connection of its own;
  - `balapan(pertama, kedua)` holds the first transaction's locks for 2.5 s and starts the second 0.7 s in;
  - `berlaku` says the race overlapped, measured on the clock (the second waited at least the remaining hold).
  - *(The Chief Architect's note in §2a, "use A1's existing two-connection pattern, do not build the helper early",
    is superseded by Addendum 1, which places the helper here.)*
- **Restated with notes:**
  - **AUTH-A02** (`selftest/akun-terkunci.test.ts`). It re-runs L-1's rewrite migration, which defines `akun_kunci`,
    and refuses if a later migration redefines it. L1-F2 is now the one later definition it allows. The newer
    `akun_kunci` is saved before each re-run and restored after it. The old lock value `'infinity'` is planted past
    L1-F2's guard with `session_replication_role = replica` for that one statement, as a value from before the
    correction would be. Nothing it asserts is removed.
  - **The migration-count pins** 239 → 240 (`selftest/experience.test.ts`).
- **Exports added for reuse, not changed:** `muridBerkartu` (`selftest/d101.test.ts`) and `sinkCari`
  (`selftest/bob26.test.ts`).

## Every column and table touched: constraints and the governing invariant

| Column or table | Constraints after this commit | Baseline invariant |
|---|---|---|
| `auth.users.banned_until` | New guard `pintar_kunci_tetap_jaga`: while the linked person is suspended or closed, the value is `akun_terkunci_sampai()`. Written by the link trigger and `akun_kunci` only. L-1's guards (`pintar_password_write_guard`, the card and email guards) are unchanged | **INV-17**: a security intervention takes effect at the next check, and now also covers an account created after it |
| `public.accounts` (insert) | New AFTER INSERT trigger `_l1f2_accounts_terkunci`. Unchanged: PK, `accounts_auth_user_id_key` (unique), `accounts_card_number_key` (unique), `accounts_check` (a card account has a card number), the FKs to `auth.users` (cascade) and `persons`, L1-F4's `_l1f4_accounts_person_id`, `accounts_card_is_learners`, `accounts_setup_row` | **INV-17**; **INV-14**: the trigger function is security definer with a pinned `search_path` and no client grant |
| `public.accounts` (row locks) | Read `FOR UPDATE` by `akun_kunci`, `FOR SHARE` by the two issuers. No column is written | **INV-17** |
| `public.persons` (row lock) | Read `FOR SHARE` by the link trigger. No column is written | **INV-23**: one platform-wide person record; nothing on it changes |
| `public.password_write_permits` | Deleted at a lock for `RECOVERY` and `ACTIVATION`. Unchanged: PK `auth_user_id`, `password_write_permits_purpose_check` (ACTIVATION, RECOVERY, CARD_REISSUE), the FK to `auth.users` (cascade), L1-F4's guard | **INV-17**: no write permit outlives the intervention; a `CARD_REISSUE` permit is kept by Sharon's ruling |
| `public.person_suspensions` | Read only (`orang_ditangguhkan`). Unchanged: `person_suspension_end_pairs`, the category check (`CLOSED_AT_REQUEST` included), the note and end-reason lengths, the FKs | **INV-17**; **INV-18**: the suspension's own record is unchanged, and the card reissue's audit row is the same as for anyone (L1F2-A01) |

## Verified on

**This was verified alone, not stacked.** The candidate is the commit carrying this page. It also carries F1-R1b's
"Evidence on this commit" (page only, `F1R1B-COMPLETION.md`), as the review queue allows. No code of F1-R1b changes.

## Cross-module inventory

| Module | Effect |
|---|---|
| Sign-in, every method | None new. A locked account answers as L-1 made it answer. More accounts are locked: those created during a suspension or closure |
| Account creation (school, activation, conversion) | The account is created locked when the person is suspended or closed. The response is unchanged. Nothing is sent (P-1) |
| Recovery, activation | A permit issued in the moment around a lock is either deleted by it or refused. The answers are unchanged |
| Card reissue | Unchanged, by Sharon's ruling. A locked learner's new card opens nothing until reinstatement |
| Suspension, closure, reinstatement | `akun_kunci` locks rows first and deletes two permit purposes. Reinstatement order is unchanged |
| L1-F4 (anonymised person) | None. Its guards are unchanged. Its race test will use this harness |
| Accountability, reports, learning, Studio | None |

## Next state

| After this commit | Holds |
|---|---|
| A suspended or closed person given an account by any path | The account exists and is locked from its first instant. It answers as any locked account. Reinstatement or reopening releases it with the person's other accounts |
| A lock while a recovery or activation permit is being issued | No such permit survives the lock |

## The four questions

1. **And then what?** The school sees an ordinary creation. The person cannot sign in and is answered as any locked
   account. If they tell the school, nothing the school can see names the suspension.
2. **What else did that change?** Every creation and linking path, through the one insert; recovery and activation
   permits around a lock; nothing for card reissue, by ruling; no message, as before.
3. **What happens when things go wrong?** If the lock step fails, the creation fails with it (L1F2-S04). A suspension
   and a creation that overlap end locked in both orders (L1F2-R01).
4. **Can it be reversed, and what survives?** Reinstatement unlocks the account created during the suspension. A
   later suspension locks it again (L1F2-S03). A closed person's account is released only by reopening (L1F2-S05).

## Evidence on this commit

**Pushed at `e27f4a77a10c7c448170bb2851462e4561daadf7`.** *(Filled in the next commit: a page cannot carry its own
commit's runs.)*

| Check | Result |
|---|---|
| Red first on `bfe949b11935763a8c8ed7b91f4adcdbcea93645` (migration taken out) | 9 of the 11 new or restated ids red. L1F2-A01 and AUTH-A02 are green on base, by design (above) |
| Whole local suite (fresh reset, fresh build) | 1135 passed, 0 failed, 0 skipped |
| Planted defects | 170 of 170 (l1f2-1 new) |
| CI's red-case job, run locally | 11 of 11 groups |
| Lint, typecheck, build-identity | clean |
| CI | run `43248100218`, success |
| Journeys | run `43248126094`, in progress when this was written; its result is in the review queue |

**The first local pre-flight of this commit (before the push) was red,** and both causes were fixed before the push:
- **F06-S01:** `recovery_grant_permit` and `password_write_permit` were redefined without repeating their revoke from
  PUBLIC and grant to `service_role` in the same migration (ADR-0021). Both lines are now in it.
- **B0-S01 to S04, B0-C01, B0-A04:** L1-F2's database suite made a platform admin of its own outside the per-case blocks
  that are undone, so it outlived the suite, and B0 requires exactly one. The suite now uses the seeded platform admin.

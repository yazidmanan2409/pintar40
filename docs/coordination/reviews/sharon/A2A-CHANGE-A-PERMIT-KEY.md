# A2a change A · the permit's foreign key on `auth.users`, and the convergence rule

Sharon, 13 Nov 2026 (21:20 UTC). Read-only. On Bob's message about Second Eye's page at `fffaded0` ("New finding, not fixed: the permit's key on auth.users"). The code is read on `main` at `a6b47466`.

## What holds now

- **Not real in PINTAR's code. A declared exception with three checked conditions. Not fixed in change A.**
- **The convergence rule is accepted, with one limit:** a finding that touches what A2a adds or changes is blocking for A2a, and is not registered.

## The permit finding

**The shape.** Three functions lock the account, then insert `password_write_permits`, whose foreign key takes `FOR KEY SHARE` on the `auth.users` row:
- `password_write_permit`;
- `recovery_grant_permit`;
- `authorize_card_reissue`.

`KEY SHARE` waits only on a `FOR UPDATE` lock, a `DELETE`, or an update of a key column of that row. A key column is `id`, or a column under a non-partial unique index (`phone`). Auth's email index is partial, so an email change is not a key update.

**What PINTAR does to `auth.users`, read on `main`:**
- **No `DELETE`, and no `FOR UPDATE`,** in any migration or under `src/`. Users are created with `createUser`: a new row, which no one else can see.
- **`akun_kunci` takes the person's `auth.users` rows `FOR NO KEY UPDATE`** (`20270117190000…`, :86–87, under L1-F2's order). That does not conflict with `KEY SHARE`.
- **`hapus_data_pribadi`'s EMAIL retirement** (`20270116100000…`, :496–499):
  - it updates `email`, `email_change` and `raw_user_meta_data` only;
  - those are non-key columns, so the update is `NO KEY UPDATE`;
  - it runs under the person `FOR UPDATE`, and the three permit functions take the person `FOR SHARE` first (`20270117190000…`). The two serialise on the person before either reaches the account.
- **The one path that could close the cycle is Auth deleting a user:** a `DELETE` that cascades to `accounts` (`on delete cascade`). PINTAR never asks Auth to delete a user.

**Declared exception, with three conditions the test checks:**
1. No migration and no file under `src/` deletes from `auth.users`, takes it `FOR UPDATE`, or calls Auth's user deletion. This is a repository check, in the A2A-F01 form, with a plant.
2. `akun_kunci`'s `auth.users` lock is `FOR NO KEY UPDATE`. The existing structural check in `20270117190000` is extended to assert the mode.
3. Each of the three permit functions takes the person before the account. The existing check holds this.
- **Register:** Second Eye's fix (`auth.users` `FOR KEY SHARE` before the account), and only for the day PINTAR deletes auth users.
- Could reasonably have been anticipated: no. Before R1, foreign keys were not counted.

## The convergence rule

**Accepted:** after C1, C2 and this ruling, change A takes no further fixes. New items go to the page with my reading, and then to the register. Two limits:

1. **Blocking for A2a, not registered:** any cycle, lock inversion or under-report that involves what A2a adds or changes:
   - the fence;
   - the held sittings;
   - `maintenance_windows`;
   - `change_maintenance`;
   - the closer;
   - any function in A2a's writer enumeration.
   A2a freezing on top of a known cycle in its own objects would be unsafe. An inherited cycle elsewhere, whose outcome is a 40P01 and nothing lost, may be registered.
2. **A register item does not make the test green by omission.** Each one is a named declared exception in A2A-L01, with its register reference. The freeze is on a green A2A-L01 whose every exception is named.

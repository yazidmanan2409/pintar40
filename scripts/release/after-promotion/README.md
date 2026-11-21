# After every promotion

Read-only checks a promotion checklist runs after the migrations are applied, against staging and against production.
Each prints one line, and anything but `OK` stops the promotion.

| Name | File | Since | What it holds |
|---|---|---|---|
| **C3W-R3-BAHAN** | `c3w-r3-bahan.sql` | C3w-1 | R-3 control 1 (Sharon's ruling (b)): `c3w_bahan` is a postgres-owned, SQL-standard, SECURITY INVOKER function that depends only on the four content tables and pg_catalog objects. R3-07 runs the same file locally. |

```sh
psql "$DB_URL" -At -f scripts/release/after-promotion/c3w-r3-bahan.sql   # expect: OK
```

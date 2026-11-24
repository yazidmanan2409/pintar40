# After every promotion

Read-only checks a promotion checklist runs after the migrations are applied, against staging and against production.
Each prints one line, and anything but `OK` stops the promotion.

| Name | File | Since | What it holds |
|---|---|---|---|
| **C3W-R3-BAHAN** | `c3w-r3-bahan.sql` | C3w-1 | R-3 control 1 (Sharon's ruling (b)): `c3w_bahan` is a postgres-owned, SQL-standard, SECURITY INVOKER function that depends only on the four content tables and pg_catalog objects. R3-07 runs the same file locally. |
| **V6-PRE-REQUEST** | `v6-pre-request.sql` | Z (V6, R-25) | Suspension's per-request layer is installed: `authenticator` carries `pgrst.db_pre_request = pintar_permintaan.periksa`, no per-database setting names another, and the function exists. Z-V6-01 runs the same file locally, as is and on two plants. |

```sh
psql "$DB_URL" -At -f scripts/release/after-promotion/c3w-r3-bahan.sql   # expect: OK
psql "$DB_URL" -At -f scripts/release/after-promotion/v6-pre-request.sql  # expect: OK
```

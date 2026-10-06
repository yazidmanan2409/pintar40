# #150 G2: observation log (read only; nothing on the copy repaired or changed)

All times UTC. Every connector query was a single read-only statement (`begin read only; … commit`).

| Time (UTC) | Observation | Source |
|---|---|---|
| 00:48:02 | **T0**: the owner confirmed "Restore to a New Project" (07:48:02 WIB). Source `pintar-staging` / `keijhmdtsgrfvnvocfvk`; backup **05 Oct 2026 23:34:27 UTC**; temporary name `pintar-g2-rehearsal-DELETE-ME`; dashboard status RESTORING | owner |
| 00:48:02.615 | the temporary project's `created_at`: ref **`rzphxkmbsunmedxmxwsz`**, ap-southeast-1, Postgres image **17.11.0.002** (staging: 17.6.1.166) | connector `list_projects` |
| 00:48:54 | temporary project status `COMING_UP` | connector `list_projects` |
| ~00:49 | the owner's screenshot of staging's "Restore to new project" tab: "Restoration in progress"; Previous restorations: `pintar-g2-rehearsal-DELETE-ME`, RESTORING, 06 Oct 2026 00:48:02; Available backups: 05 Oct 23:34:27, 04 Oct 23:34:09, 03 Oct 23:33:45, 02 Oct 23:34:12, 01 Oct 23:34:52, 30 Sep 23:33:26, 29 Sep 23:34:32 (+0000), **each COMPLETED** (the image is held by the owner) | owner |
| 00:49–00:50 | staging baseline: fingerprint (`g2-fingerprint.sql`), the per-schema digests, the readiness check **24/24 PASS** | connector, staging, read only |
| 00:50:03 | temporary project status `COMING_UP` | connector `get_project` |
| 00:50:30 | temporary project status `RESTORING` | connector `get_project` |
| ~00:51:39 | **T1**: temporary project status **`ACTIVE_HEALTHY`** (first observed; it was `RESTORING` at 00:50:30) | connector `get_project` |
| 00:51:48.117 | **T2**: the copy's database answered a query (its own `now()`): not in recovery; server 17.11; migrations **161**, last `20261124100000` | connector `execute_sql`, copy |
| 00:51–00:56 | verification, read only (below) | connector, copy and staging |
| 00:56:04.697 | **T3**: verification complete | coordinator |
| 00:56 | final identity check: copy `pintar-g2-rehearsal-DELETE-ME` / `rzphxkmbsunmedxmxwsz`, `ACTIVE_HEALTHY`; equal to none of `pintar-staging` / `keijhmdtsgrfvnvocfvk`, `pintar-production` / `trtlvibiybwixfumjrrx`, `pintar` / `sknixmwkynzmrgbxzrvb` | connector `list_projects` |

## Timings (a rehearsal on the current staging dataset: 54 MB, 77,040 rows in 157 tables, 28 Storage objects of 206 MB; **not** a prediction for production at intended scale)

| Interval | Duration |
|---|---|
| Restore: T0 → T1 (provider reports healthy) | **≤ 3 min 37 s** (healthy first observed 00:51:39; not yet at 00:50:30, so between 2 min 28 s and 3 min 37 s) |
| Time to queryable: T0 → T2 | **3 min 46 s** |
| PINTAR verification: T2 → T3 | **4 min 17 s** |
| Total: T0 → T3 | **8 min 03 s** |

Not included: the time to decide and start a restore, and reconnecting the application (Auth settings, SMTP, API keys, Vercel, durable secrets), which a real recovery needs and this rehearsal did not perform.

## What was compared (every query read only; values never read out, only counts, hashes and names)

| Area | Staging | Copy | Result |
|---|---|---|---|
| All 157 tables (auth 27, public 119, storage 8, supabase_migrations 1, telemetry 2): rows and content hash per table, digest of all | 77,040 rows; digest `5b4830966efa1f1959e941dc9d12ca2e` | 77,040; `5b4830966efa1f1959e941dc9d12ca2e` | **identical** (each schema's digest identical too) |
| Migration history | 161, last `20261124100000` | the same | identical |
| Columns / constraints / indexes / views / enum and domain types / sequences (public, telemetry, pintar_permintaan) | 1173 / 703 / 240 / 18 / 45 / 1, digests `e986ca7e…` `bdccc6ca…` `c14a89ad…` `2a1ee97d…` `5b2b2e68…` `023c4d71…` | the same digests | identical |
| Representative records (by hash): certificates 6, accounts 1326, persons 1326, institutions 6, role_assignments 15, memberships 1312, assessment_sessions 1450, assessment_results 1446, responses 12,666, audit_log 6480 | per-table hashes | the same | identical |
| Auth users / identities / accounts linked / unlinked; links hash | 1326 / 1326 / 1326 / 0; `e75b679c…` | the same | identical |
| Row security: public tables / without RLS / forced | 119 / 0 / 3 | the same | identical |
| Policies (public, storage) | 131, `821a982f…` | the same | identical |
| Table rights (anon, authenticated) and table ACLs | 137 `78f0b9d0…`; ACL `ef79695d…`; anon on any table: 0 | the same | identical |
| Function definitions / owners / execute rights / ACLs (491) | `e6eea218…` / `562f976a…` / `49f06f4d…` / `3deaf451…`; anon 1 (the pre-request), authenticated 211, PUBLIC 0 | the same | identical |
| SECURITY DEFINER functions | 374, `afc8de55…` | the same | identical |
| Owners (relations, functions) | postgres | postgres | identical |
| `auth.users` triggers | 3 of 3, enabled, bound to their functions | the same | identical |
| PostgREST pre-request; all role settings; database settings | `pgrst.db_pre_request=pintar_permintaan.periksa`; 10 role settings; archive_mode on, wal_level logical, TimeZone UTC, … | the same | identical |
| Audit-log protections | 3 triggers enabled; 0 client write grants | the same | identical |
| Public triggers | 143, `de1905b0…` | the same | identical |
| Roles / memberships / schemas and owners / schema ACLs / event triggers / publications / vault secrets | 16 / 25 / 12 / `d69883e6…` / 7 / supabase_realtime:0 / 0 | the same | identical |
| Extensions | pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1 | the same | identical |
| **Readiness, 24 rows** | **24 PASS** | **24 PASS**, every measured value identical | identical |
| Storage **metadata**: bucket record; object rows | `assets`, private, 100 MB limit; 28 rows, 206,466,694 bytes, `8b4b43fb…` | the same | identical: **metadata only** |
| Storage **files** | 28 files | **not verified**: needs the copy's Storage API and secret key, not used without approval | per Supabase's documentation not copied; **not proven either way** |
| Postgres server image | 17.6.1.166 | **17.11.0.002** | **differs**: the copy was created on a newer image |
| API keys | legacy anon key (staging's ref) + a modern `sb_publishable_…` key | a **new** legacy anon key (the copy's own ref); **no** `sb_publishable_…` key | **not reproduced** |
| Auth settings (via the security advisors) | 3 findings | the same 3 **plus `auth_leaked_password_protection`** (WARN) | **not reproduced**: leaked-password protection (on in staging, D-082(a)) is off in the copy; the other Auth settings were not readable read-only |
| Edge Functions | none | none | nothing to reproduce |

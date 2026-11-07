-- ROLLBACK OF MIGRATIONS 199-200 (D-195(5), D-195(4); KESETIAAN #6, #7, #18, #21; D-069 / F33-P01), the next staging
-- promotion's recovery arrangement.
--
-- NOT A MIGRATION and NEVER APPLIED BY ANY WORKFLOW. It returns a database at 200 to staging's schema at 198 for every
-- object 199-200 created:
--   * 199 (20270102100000) created two new functions, murid_perlu_penguatan and jenis_belajar_saya, and their two
--     client_rpc_registry rows;
--   * 200 (20270103100000) created four new functions, sebaran_murid_kelas, kenaikan_awal_akhir,
--     kesiapan_kelas_per_mapel and kelas_dikecualikan_kartu, and their four registry rows.
--   None of the six existed at 198, and neither migration replaces, alters or writes anything else.
-- Run as the database owner in one transaction, only on the owner's say. The physical backup remains the recovery point
-- for data; this script is the schema's way back without a restore.
--
-- What a rollback keeps and loses, by design:
--   * KEPT: every row. Neither migration writes a row outside client_rpc_registry.
--   * LOST: nothing stored. The reads go; the pages that ask them say «not shown» (a read that errors is drawn as no
--     list, no dots, no pair and no per-subject section, never as «nobody»), as the pages do for a refused reader.
-- The two schema_migrations rows are removed too, so that `supabase migration up` (staging.yml) re-applies 199-200
-- cleanly later.
--
-- EVERY STATE A DEPLOYMENT CAN LEAVE. `supabase db push` applies each file in its own transaction with its
-- schema_migrations row and stops at the first failure, so staging can only be at 198, 199 or 200. Each `drop … if
-- exists` and `delete` is a no-op where its object is absent, so the script serves all three and is safe to run twice.
-- Its last check (exactly 198 migrations) makes it refuse any database not at 198-200.
-- It names no environment, so the operator chooses the target by its connection string.
--
-- Rehearsed locally on 7 Nov, each from its real state:
--   200 (6 functions, 6 registry rows) -> this script -> 198, 0 and 0, the checks pass;
--   198 -> this script again -> no change, the checks pass;
--   `supabase migration up` -> 200, 6 and 6;
--   199 only (made by applying with 200's file absent: 199 migrations, 2 functions) -> this script -> 198, 0;
--   `supabase migration up` -> 200, 6.

begin;

drop function if exists public.kelas_dikecualikan_kartu(uuid[]);
drop function if exists public.kesiapan_kelas_per_mapel(uuid);
drop function if exists public.kenaikan_awal_akhir(uuid);
drop function if exists public.sebaran_murid_kelas(uuid);
drop function if exists public.jenis_belajar_saya(uuid);
drop function if exists public.murid_perlu_penguatan(uuid);

delete from public.client_rpc_registry
 where function_name in ('murid_perlu_penguatan', 'jenis_belajar_saya', 'sebaran_murid_kelas', 'kenaikan_awal_akhir',
                         'kesiapan_kelas_per_mapel', 'kelas_dikecualikan_kartu');

delete from supabase_migrations.schema_migrations where version in ('20270102100000', '20270103100000');

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and p.proname in ('murid_perlu_penguatan', 'jenis_belajar_saya', 'sebaran_murid_kelas', 'kenaikan_awal_akhir',
                                  'kesiapan_kelas_per_mapel', 'kelas_dikecualikan_kartu')) then
    raise exception 'ROLLBACK-199-200: a function of 199-200 is still present';
  end if;
  if exists (select 1 from public.client_rpc_registry
              where function_name in ('murid_perlu_penguatan', 'jenis_belajar_saya', 'sebaran_murid_kelas',
                                      'kenaikan_awal_akhir', 'kesiapan_kelas_per_mapel', 'kelas_dikecualikan_kartu')) then
    raise exception 'ROLLBACK-199-200: a registry row of 199-200 is still present';
  end if;
  if (select max(version) from supabase_migrations.schema_migrations) <> '20270101100000' then
    raise exception 'ROLLBACK-199-200: the latest migration is %, not 198 (20270101100000)',
      (select max(version) from supabase_migrations.schema_migrations);
  end if;
  if (select count(*) from supabase_migrations.schema_migrations) <> 198 then
    raise exception 'ROLLBACK-199-200: % migrations recorded, not 198: this database was not at 198-200',
      (select count(*) from supabase_migrations.schema_migrations);
  end if;
end $$;

commit;

-- V6-PRE-REQUEST · after every promotion, to staging and to production (Z · V6, R-25; Sharon VERIFY-58: suspension is
-- one per-request layer, and nothing else in the product stands in for it). READ ONLY: it changes nothing and needs no
-- write right. A promotion checklist runs it after the migrations are applied; anything but 'OK' stops the promotion.
--   psql "$DB_URL" -At -f scripts/release/after-promotion/v6-pre-request.sql      # expect: OK
-- selftest/z-v6.test.ts (Z-V6-01) runs this same file locally, as is and on two plants, so the two cannot drift.
--
-- One row, one column: 'OK', or every problem found, separated by '; '.
--   * the role PostgREST connects as (authenticator) carries pgrst.db_pre_request = pintar_permintaan.periksa, the
--     per-request check that refuses a suspended or closed account and a maintenance window;
--   * no per-database setting for that role names any other pre-request (it would win for that database);
--   * pintar_permintaan.periksa() exists.
with s as (
  select coalesce(d.datname, '(every database)') as db, x as setelan
    from pg_db_role_setting r
    left join pg_database d on d.oid = r.setdatabase
    cross join lateral unnest(r.setconfig) x
   where r.setrole = 'authenticator'::regrole and x like 'pgrst.db_pre_request=%'
),
masalah as (
  select 'authenticator has no pgrst.db_pre_request' as m
   where not exists (select 1 from s)
  union all
  select 'authenticator''s pgrst.db_pre_request for ' || s.db || ' is ' || substr(s.setelan, length('pgrst.db_pre_request=') + 1)
         || ', not pintar_permintaan.periksa'
    from s where s.setelan <> 'pgrst.db_pre_request=pintar_permintaan.periksa'
  union all
  select 'pintar_permintaan.periksa() does not exist'
   where to_regprocedure('pintar_permintaan.periksa()') is null
)
select coalesce(string_agg(m, '; ' order by m), 'OK') from masalah;

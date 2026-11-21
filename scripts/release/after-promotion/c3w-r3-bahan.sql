-- C3W-R3-BAHAN · after every promotion, to staging and to production (Sharon's ruling (b), 625d52c1; Bob's B1 and B4
-- as amended 21 Nov). READ ONLY: it changes nothing and needs no write right. A promotion checklist runs it after the
-- migrations are applied and before the promotion is called done; anything but 'OK' stops the promotion.
--   psql "$DB_URL" -At -f scripts/release/after-promotion/c3w-r3-bahan.sql      # expect: OK
-- selftest/c3w-r3.test.ts (R3-07) runs this same file locally, on the real function and on each plant, so the two
-- cannot drift. What c3w_bahan may read (R-3 control 1):
--
-- One row, one column: 'OK', or every problem found, separated by '; '.
--   * c3w_bahan(uuid, uuid[]) exists, is LANGUAGE sql with a SQL-standard body (prosqlbody is not null, so pg_depend
--     records every object it reads and no dynamic SQL is possible), SECURITY INVOKER, and owned by postgres;
--   * every object it depends on is one of the four content tables (or their columns or types), or a pg_catalog
--     object: no other table, no view, no public function.
with f as (
  select p.oid, p.prosqlbody is not null as standar, l.lanname, p.prosecdef, pg_get_userbyid(p.proowner) as pemilik
    from pg_proc p join pg_language l on l.oid = p.prolang
   where p.oid = to_regprocedure('public.c3w_bahan(uuid,uuid[])')
),
boleh as (
  select c.oid from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relname in ('lessons', 'learning_objectives', 'modules', 'courses')
),
dep as (
  select d.refclassid, d.refobjid, d.refobjsubid from pg_depend d, f
   where d.classid = 'pg_proc'::regclass and d.objid = f.oid and d.deptype = 'n'
),
salah as (
  select case
           when dep.refclassid = 'pg_class'::regclass then
             case when dep.refobjid in (select oid from boleh) then null
                  else 'reads ' || dep.refobjid::regclass::text end
           when dep.refclassid = 'pg_type'::regclass then
             case when (select t.typnamespace = 'pg_catalog'::regnamespace or t.typrelid in (select oid from boleh)
                          from pg_type t where t.oid = dep.refobjid) then null
                  else 'uses the type ' || dep.refobjid::regtype::text end
           when dep.refclassid = 'pg_proc'::regclass then
             case when (select p.pronamespace = 'pg_catalog'::regnamespace from pg_proc p where p.oid = dep.refobjid) then null
                  else 'calls ' || dep.refobjid::regprocedure::text end
           when dep.refclassid = 'pg_operator'::regclass then
             case when (select o.oprnamespace = 'pg_catalog'::regnamespace from pg_operator o where o.oid = dep.refobjid) then null
                  else 'uses the operator ' || dep.refobjid::regoperator::text end
           when dep.refclassid = 'pg_language'::regclass then
             case when (select l.lanname = 'sql' from pg_language l where l.oid = dep.refobjid) then null
                  else 'is written in ' || (select l.lanname from pg_language l where l.oid = dep.refobjid) end
           when dep.refclassid = 'pg_namespace'::regclass then
             case when dep.refobjid in ('pg_catalog'::regnamespace, 'public'::regnamespace) then null
                  else 'depends on the schema ' || dep.refobjid::regnamespace::text end
           else 'depends on ' || dep.refclassid::regclass::text || ' ' || dep.refobjid::text
         end as m
    from dep
),
masalah as (
  select 'c3w_bahan(uuid, uuid[]) is missing' as m where not exists (select 1 from f)
  union all select 'c3w_bahan is ' || f.lanname || ', not LANGUAGE sql' from f where f.lanname <> 'sql'
  union all select 'c3w_bahan has a string body (prosqlbody is null): its reads are not recorded' from f where not f.standar
  union all select 'c3w_bahan is SECURITY DEFINER, not INVOKER' from f where f.prosecdef
  union all select 'c3w_bahan is owned by ' || f.pemilik || ', not postgres' from f where f.pemilik <> 'postgres'
  union all select distinct m from salah where m is not null
)
select coalesce(string_agg(m, '; ' order by m), 'OK') from masalah;

-- Schema inventory digest — the drift proof, widened.
--
-- WHY THIS EXISTS. Thirteen of the FABLE-01/02 migrations carry recorded text
-- on the hosted development project that differs from their repository file,
-- from the path by which they were first applied. They are not edited -- an
-- applied migration never is -- so the question "did that divergence change
-- the schema?" has to be answered by comparing the schemas themselves.
--
-- WHAT THE FIRST VERSION MISSED. The FABLE-03 closeout compared nine
-- categories: tables, views, columns, enum labels, functions *by metadata*,
-- policies, triggers, table grants, function grants. Two databases could match
-- that digest exactly while a function BODY or a UNIQUE INDEX differed -- and
-- INV-28's entire idempotency guarantee is arbitrated by a unique index. The
-- argument was sound but did not cover the objects a divergent migration text
-- would most plausibly have changed. Claude 1's review, finding 9, said so.
--
-- Added here: function bodies (`md5(prosrc)`), every constraint definition
-- (CHECK, UNIQUE, PRIMARY KEY, FOREIGN KEY with its ON DELETE action), every
-- index definition, column defaults, and `FORCE ROW LEVEL SECURITY`. Policy
-- USING/WITH CHECK expressions were already covered and stay.
--
-- HOW TO RUN. Against any database carrying the migration series, on both
-- sides of the comparison, and compare the ZZ_TOTAL digest:
--     psql -At -f docs/audit/schema-inventory.sql "$DB_URL"
-- Platform-managed schemas (auth, storage, extensions) are deliberately out of
-- scope: they differ between a local shim and a hosted project by design.

with raw as (
-- NOTE ON `relforcerowsecurity`, which this digest reports as 0 on all 55
-- `public` tables. That is deliberate and load-bearing, not an oversight.
-- FORCE RLS makes RLS apply to the table OWNER as well. The entire engine runs
-- inside SECURITY DEFINER functions owned by the schema owner -- that is how a
-- learner who holds no capability can have a paper assembled for them -- so
-- forcing RLS on the owner would break assembly, scoring and finalisation.
-- The protections that must survive the owner are carried by triggers instead,
-- which fire for every role: `audit_log_immutable` refuses owner writes
-- (ADR-0001), and the append-only guards on evidence do the same. Do not "fix"
-- this to 1 without reading those first.
select 'TABLE|'||c.relnamespace::regnamespace::text||'|'||c.relname||'|'
       ||c.relrowsecurity::text||'|'||c.relforcerowsecurity::text as line
  from pg_class c where c.relkind='r' and c.relnamespace::regnamespace::text in ('public','telemetry')
union all
select 'VIEW|'||c.relnamespace::regnamespace::text||'|'||c.relname||'|'||md5(pg_get_viewdef(c.oid, true))
  from pg_class c where c.relkind in ('v','m') and c.relnamespace::regnamespace::text in ('public','telemetry')
union all
select 'COLUMN|'||a.attrelid::regclass::text||'|'||a.attname||'|'||format_type(a.atttypid,a.atttypmod)||'|'
       ||a.attnotnull::text||'|'||coalesce(pg_get_expr(d.adbin, d.adrelid), '-')
  from pg_attribute a
  join pg_class c on c.oid=a.attrelid
  left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
 where a.attnum>0 and not a.attisdropped and c.relkind in ('r','v','m')
   and c.relnamespace::regnamespace::text in ('public','telemetry')
union all
select 'ENUM|'||t.typnamespace::regnamespace::text||'|'||t.typname||'|'||e.enumlabel
  from pg_type t join pg_enum e on e.enumtypid=t.oid
 where t.typnamespace::regnamespace::text in ('public','telemetry')
union all
-- function identity, metadata AND body. prosrc is the half the first digest missed.
select 'FUNC|'||p.pronamespace::regnamespace::text||'|'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')|'
       ||p.prosecdef::text||'|'||p.provolatile::text||'|'||coalesce(array_to_string(p.proconfig,','),'')||'|'
       ||md5(coalesce(p.prosrc,''))
  from pg_proc p where p.pronamespace::regnamespace::text in ('public','telemetry')
union all
-- the same functions with comments and whitespace normalised away. Two digests
-- rather than one, because they answer different questions: FUNC differing
-- while FUNCNORM matches means the divergence is cosmetic -- a comment, an
-- indent -- and nothing executable changed. FUNCNORM differing is a real
-- behavioural difference and must be explained before anything else proceeds.
-- This is not hypothetical: at the 34-migration state, hosted and a clean
-- replay differed on six FUNC lines (`enrollments_guard`, `memberships_guard`,
-- `role_assignments_guard`, `transfer_authorize`, `transfer_execute`,
-- `transfer_request`) and matched on all six FUNCNORM lines. The recorded text
-- of the thirteen divergent FABLE-01/02 migrations is comment-stripped.
select 'FUNCNORM|'||p.pronamespace::regnamespace::text||'|'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')|'
       ||md5(regexp_replace(regexp_replace(coalesce(p.prosrc,''), '--[^\n]*', '', 'g'), '\s+', ' ', 'g'))
  from pg_proc p where p.pronamespace::regnamespace::text in ('public','telemetry')
union all
-- CHECK, UNIQUE, PRIMARY KEY and FOREIGN KEY (with ON DELETE/ON UPDATE)
select 'CONSTRAINT|'||con.conrelid::regclass::text||'|'||con.conname||'|'||pg_get_constraintdef(con.oid)
  from pg_constraint con join pg_class c on c.oid=con.conrelid
 where c.relnamespace::regnamespace::text in ('public','telemetry')
union all
-- indexes, including the unique indexes INV-28's idempotency is arbitrated by
select 'INDEX|'||i.indrelid::regclass::text||'|'||i.indexrelid::regclass::text||'|'||pg_get_indexdef(i.indexrelid)
  from pg_index i join pg_class c on c.oid=i.indrelid
 where c.relnamespace::regnamespace::text in ('public','telemetry')
union all
select 'POLICY|'||pol.schemaname||'|'||pol.tablename||'|'||pol.policyname||'|'||pol.cmd||'|'
       ||coalesce(array_to_string(pol.roles,','),'')||'|'||coalesce(pol.qual,'')||'|'||coalesce(pol.with_check,'')
  from pg_policies pol where pol.schemaname in ('public','telemetry')
union all
select 'TRIGGER|'||c.relnamespace::regnamespace::text||'|'||c.relname||'|'||t.tgname||'|'||t.tgtype::text||'|'
       ||md5(pg_get_triggerdef(t.oid))
  from pg_trigger t join pg_class c on c.oid=t.tgrelid
 where not t.tgisinternal and c.relnamespace::regnamespace::text in ('public','telemetry')
union all
select 'GRANT|'||g.table_schema||'|'||g.table_name||'|'||g.grantee||'|'||g.privilege_type
  from information_schema.role_table_grants g
 where g.table_schema in ('public','telemetry') and g.grantee in ('anon','authenticated')
union all
select 'FGRANT|'||p.pronamespace::regnamespace::text||'|'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')|'||r.rolname
  from pg_proc p, (values('anon'),('authenticated')) r(rolname)
 where p.pronamespace::regnamespace::text in ('public','telemetry')
   and has_function_privilege(r.rolname, p.oid, 'EXECUTE')
), norm as (
  select split_part(line,'|',1) as kind, regexp_replace(line, '\s+', ' ', 'g') as line from raw
)
select kind, count(*) as n, md5(string_agg(line, E'\n' order by line collate "C")) as digest
  from norm group by kind
union all
select 'ZZ_TOTAL', count(*), md5(string_agg(line, E'\n' order by line collate "C")) from norm
order by 1;

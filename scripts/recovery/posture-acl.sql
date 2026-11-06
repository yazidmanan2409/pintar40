-- W9.12, the restore rehearsal: the client roles' rights on PINTAR's own schemas, one row per right, as CSV on stdout.
-- Selects only (it runs in a read-only transaction). Run on staging and on the restored copy alike, so the two outputs
-- can be compared line by line and staging's can be re-applied to the copy (posture-apply.sql):
--     psql -X -q -v ON_ERROR_STOP=1 -f scripts/recovery/posture-acl.sql "$DB" > acl.csv
-- Columns: kind (schema | table | sequence | column | routine | default), the object's SQL name, the column's SQL name
-- (column rows only), the grantee (PUBLIC, anon, authenticated, service_role), the privilege, and whether it is
-- grantable. A 'default' row is one of postgres's default privileges, which decide what every object a later migration
-- creates starts with: its object is the schema it applies in ('*' for all schemas), its column the object type
-- (tables | sequences | functions).
-- Names and privileges only: no row of any table is read. A right granted by two grantors is one row (distinct).
-- A NULL ACL is the built-in default (acldefault), as Postgres itself reads it: for a routine, PUBLIC may execute.
-- search_path is pg_catalog only, so every type in a routine's signature is schema-qualified and the same on both sides.
set search_path = pg_catalog;
copy (
  with sch as (
    select oid, nspname, nspowner, nspacl from pg_namespace where nspname in ('public', 'telemetry', 'pintar_permintaan')),
  rol(oid, name) as (
    select 0::oid, 'PUBLIC'
    union all
    select oid, rolname::text from pg_roles where rolname in ('anon', 'authenticated', 'service_role')),
  obj as (
    select 'schema' as kind, quote_ident(s.nspname) as ident, '' as col, coalesce(s.nspacl, acldefault('n', s.nspowner)) as acl
      from sch s
    union all
    select case when c.relkind = 'S' then 'sequence' else 'table' end, format('%I.%I', s.nspname, c.relname), '',
           coalesce(c.relacl, acldefault((case when c.relkind = 'S' then 's' else 'r' end)::"char", c.relowner))
      from pg_class c join sch s on s.oid = c.relnamespace
     where c.relkind in ('r', 'v', 'm', 'p', 'f', 'S')
    union all
    select 'column', format('%I.%I', s.nspname, c.relname), quote_ident(a.attname), a.attacl
      from pg_attribute a join pg_class c on c.oid = a.attrelid join sch s on s.oid = c.relnamespace
     where c.relkind in ('r', 'v', 'm', 'p', 'f') and a.attnum > 0 and not a.attisdropped and a.attacl is not null
    union all
    select 'routine', format('%I.%I(%s)', s.nspname, p.proname, pg_get_function_identity_arguments(p.oid)), '',
           coalesce(p.proacl, acldefault('f', p.proowner))
      from pg_proc p join sch s on s.oid = p.pronamespace
    union all
    -- postgres's default privileges: in each schema (added to the global ones), and global (none stored: the built-in)
    select 'default', coalesce(s.nspname, '*'), t.word,
           coalesce(d.defaclacl, case when s.oid = 0 then acldefault(t.ch::"char", r.oid) end)
      from (values ('r', 'r', 'tables'), ('S', 's', 'sequences'), ('f', 'f', 'functions')) t(objtype, ch, word)
      cross join (select oid from pg_roles where rolname = 'postgres') r
      cross join (select oid, nspname from sch union all select 0::oid, null) s
      left join pg_default_acl d on d.defaclrole = r.oid and d.defaclnamespace = s.oid and d.defaclobjtype = t.objtype::"char")
  select distinct o.kind, o.ident, o.col, r.name as grantee, x.privilege_type as priv, x.is_grantable as grantable
    from obj o cross join lateral aclexplode(o.acl) x join rol r on r.oid = x.grantee
   order by 1, 2, 3, 4, 5, 6
) to stdout with (format csv);

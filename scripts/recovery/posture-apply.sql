-- W9.12, the restore rehearsal: give the restored copy exactly the client roles' rights staging holds.
--     psql -X -q -v ON_ERROR_STOP=1 -f scripts/recovery/posture-apply.sql "$COPY_DB" < acl-staging.csv
-- stdin is posture-acl.sql's CSV as read from staging. Run on the restored copy ONLY, never on staging or production.
--
-- Why: a logical (pg_dump) backup records each object's rights relative to Postgres's built-in default, so it carries
-- GRANTs but no REVOKE for a role the built-in default never named (anon, authenticated, service_role). An empty
-- Supabase stack's default privileges grant those roles everything on every object postgres creates in public; the
-- restore therefore starts every table, sequence and function from "everything" and only adds staging's GRANTs to it,
-- and the backup's own ALTER DEFAULT PRIVILEGES (PINTAR's closed-by-default, migration 20260912004158) comes after the
-- objects. Here, in one transaction: every right of PUBLIC, anon, authenticated and service_role on every schema,
-- table, view, sequence, column and routine of public, telemetry and pintar_permintaan goes, and from postgres's default
-- privileges (global and in those schemas); then exactly the rights staging holds come back. Counts only are reported.
\set ON_ERROR_STOP on
set search_path = pg_catalog;
begin;
create temp table staging_acl (kind text, ident text, col text, grantee text, priv text, grantable boolean) on commit drop;
\copy staging_acl from pstdin with (format csv)
-- the copy's objects, named exactly as posture-acl.sql names them
create temp table copy_obj on commit drop as
  select 'schema'::text as kind, quote_ident(nspname) as ident, ''::text as col
    from pg_namespace where nspname in ('public', 'telemetry', 'pintar_permintaan')
  union all
  select case when c.relkind = 'S' then 'sequence' else 'table' end, format('%I.%I', n.nspname, c.relname), ''
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'telemetry', 'pintar_permintaan') and c.relkind in ('r', 'v', 'm', 'p', 'f', 'S')
  union all
  select 'column', format('%I.%I', n.nspname, c.relname), quote_ident(a.attname)
    from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'telemetry', 'pintar_permintaan') and c.relkind in ('r', 'v', 'm', 'p', 'f')
     and a.attnum > 0 and not a.attisdropped
  union all
  select 'routine', format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)), ''
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'telemetry', 'pintar_permintaan')
  union all
  select 'default', coalesce(n.nspname, '*'), t.word
    from (values ('tables'), ('sequences'), ('functions')) t(word)
    cross join (select nspname from pg_namespace where nspname in ('public', 'telemetry', 'pintar_permintaan') union all select null) n;
do $$
declare
  o record; n_obj int := 0; n_def int := 0; n_grant int := 0; n_missing int;
  kw constant jsonb := '{"schema": "schema", "table": "table", "sequence": "sequence", "column": "table", "routine": "routine"}';
begin
  -- 1. nothing left for the client roles (a table's REVOKE ALL takes its column rights with it)
  for o in select kind, ident from copy_obj where kind not in ('column', 'default') order by kind, ident loop
    execute format('revoke all on %s %s from public, anon, authenticated, service_role', kw ->> o.kind, o.ident);
    n_obj := n_obj + 1;
  end loop;
  -- postgres's default privileges too, or every object a later migration creates would start open again
  for o in select ident, col from copy_obj where kind = 'default' order by ident, col loop
    execute format('alter default privileges for role postgres%s revoke all on %s from public, anon, authenticated, service_role',
                   case when o.ident = '*' then '' else ' in schema ' || o.ident end, o.col);
    n_def := n_def + 1;
  end loop;
  -- 2. exactly what staging holds, for every object the copy has
  for o in select s.* from staging_acl s join copy_obj c using (kind, ident, col) order by s.kind, s.ident, s.col, s.grantee, s.priv loop
    if o.kind = 'default' then
      execute format('alter default privileges for role postgres%s grant %s on %s to %s%s',
                     case when o.ident = '*' then '' else ' in schema ' || o.ident end, o.priv, o.col,
                     case when o.grantee = 'PUBLIC' then 'public' else quote_ident(o.grantee) end,
                     case when o.grantable then ' with grant option' else '' end);
      n_grant := n_grant + 1;
      continue;
    end if;
    execute format('grant %s%s on %s %s to %s%s', o.priv, case when o.kind = 'column' then ' (' || o.col || ')' else '' end,
                   kw ->> o.kind, o.ident, case when o.grantee = 'PUBLIC' then 'public' else quote_ident(o.grantee) end,
                   case when o.grantable then ' with grant option' else '' end);
    n_grant := n_grant + 1;
  end loop;
  select count(*) into n_missing from staging_acl s where not exists (select 1 from copy_obj c where (c.kind, c.ident, c.col) = (s.kind, s.ident, s.col));
  raise notice 'posture: rights revoked on % object(s) and % default-privilege set(s) of the copy; % right(s) granted as staging holds them; % of staging''s right(s) name an object the copy lacks',
    n_obj, n_def, n_grant, n_missing;
end $$;
commit;

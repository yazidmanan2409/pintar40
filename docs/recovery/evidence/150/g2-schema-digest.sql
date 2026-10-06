-- #150 G2: one read-only statement digesting the schema and the database-level configuration (names, definitions and
-- counts only; no row values, no secret values), for comparing the native restore copy with staging.
select jsonb_build_object(
  'columns', (select count(*) || ' ' || md5(string_agg(concat_ws(':', table_schema, table_name, column_name, data_type, udt_name,
                coalesce(column_default, '-'), is_nullable, coalesce(character_maximum_length::text, '-')), '|'
                order by table_schema, table_name, ordinal_position))
              from information_schema.columns where table_schema in ('public', 'telemetry', 'pintar_permintaan')),
  'constraints', (select count(*) || ' ' || md5(string_agg(n.nspname || '.' || r.relname || ':' || c.conname || ':' || pg_get_constraintdef(c.oid), '|'
                    order by n.nspname, r.relname, c.conname))
                  from pg_constraint c join pg_class r on r.oid = c.conrelid join pg_namespace n on n.oid = r.relnamespace
                 where n.nspname in ('public', 'telemetry', 'pintar_permintaan')),
  'indexes', (select count(*) || ' ' || md5(string_agg(schemaname || '.' || indexname || ':' || indexdef, '|' order by schemaname, indexname))
              from pg_indexes where schemaname in ('public', 'telemetry', 'pintar_permintaan')),
  'views', (select count(*) || ' ' || md5(string_agg(c.oid::regclass::text || ':' || pg_get_viewdef(c.oid) || ':' || coalesce(c.reloptions::text, '-'), '|'
              order by c.oid::regclass::text))
            from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname in ('public', 'telemetry', 'pintar_permintaan') and c.relkind in ('v', 'm')),
  'types', (select count(*) || ' ' || md5(string_agg(t.typname || ':' || coalesce((select string_agg(e.enumlabel, ',' order by e.enumsortorder)
              from pg_enum e where e.enumtypid = t.oid), '-'), '|' order by t.typname))
            from pg_type t join pg_namespace n on n.oid = t.typnamespace
           where n.nspname in ('public', 'telemetry', 'pintar_permintaan') and t.typtype in ('e', 'd', 'c') and t.typrelid = 0
              or (n.nspname in ('public', 'telemetry', 'pintar_permintaan') and t.typtype = 'e')),
  'sequences', (select count(*) || ' ' || md5(coalesce(string_agg(sequencename || ':' || coalesce(last_value::text, 'null'), '|' order by sequencename), ''))
                from pg_sequences where schemaname in ('public', 'telemetry', 'pintar_permintaan')),
  'schemas', (select string_agg(nspname || ':' || pg_get_userbyid(nspowner), ',' order by nspname) from pg_namespace
               where nspname not like 'pg\_%' and nspname <> 'information_schema'),
  'schema_acl_md5', (select md5(string_agg(nspname || '=' || coalesce(nspacl::text, '-'), '|' order by nspname)) from pg_namespace
                      where nspname in ('public', 'telemetry', 'pintar_permintaan', 'auth', 'storage')),
  'telemetry_and_pintar_permintaan_functions', (select count(*) || ' ' || md5(string_agg(p.oid::regprocedure::text || ':' || md5(pg_get_functiondef(p.oid))
                  || ':' || coalesce(p.proacl::text, '-'), '|' order by p.oid::regprocedure::text))
                from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('telemetry', 'pintar_permintaan')),
  'role_settings', (select string_agg(coalesce(r.rolname, '*') || '@' || coalesce(d.datname, '*') || '=' || array_to_string(s.setconfig, ';'), ' | '
                      order by r.rolname nulls first, d.datname nulls first)
                    from pg_db_role_setting s left join pg_roles r on r.oid = s.setrole left join pg_database d on d.oid = s.setdatabase),
  'roles', (select count(*) || ' ' || md5(string_agg(rolname || ':' || rolsuper || rolinherit || rolcreaterole || rolcreatedb || rolcanlogin
              || rolreplication || rolbypassrls, '|' order by rolname)) from pg_roles where rolname not like 'pg\_%'),
  'role_names', (select string_agg(rolname, ',' order by rolname) from pg_roles where rolname not like 'pg\_%'),
  'memberships', (select count(*) || ' ' || md5(string_agg(pg_get_userbyid(roleid) || '>' || pg_get_userbyid(member), '|'
                    order by pg_get_userbyid(roleid), pg_get_userbyid(member))) from pg_auth_members),
  'event_triggers', (select coalesce(string_agg(evtname || ':' || evtevent || ':' || evtenabled::text, ',' order by evtname), '-') from pg_event_trigger),
  'publications', (select coalesce(string_agg(pubname || ':' || (select count(*) from pg_publication_tables pt where pt.pubname = p.pubname), ',' order by pubname), '-')
                   from pg_publication p),
  'vault_secrets', (select count(*) from vault.secrets),
  'database_settings', (select string_agg(name || '=' || setting, ',' order by name) from pg_settings
                         where name in ('TimeZone', 'statement_timeout', 'idle_in_transaction_session_timeout', 'max_connections',
                                        'shared_buffers', 'work_mem', 'wal_level', 'archive_mode', 'archive_timeout'))
) as schema_digest;

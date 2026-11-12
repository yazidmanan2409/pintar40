-- The catalogue fingerprint ROLLBACK-225-244-local-test.txt compares databases by (read only). One line per object, sorted;
-- two databases are schema-equal for the rollback's purpose when the outputs are identical.
select 'fn', n.nspname||'.'||p.oid::regprocedure::text, md5(pg_get_functiondef(p.oid)), coalesce(p.proacl::text,'-'), p.proowner::regrole::text, md5(coalesce(obj_description(p.oid,'pg_proc'),'')) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','auth','storage','extensions') and p.prokind in ('f','p')
union all select 'rel', c.oid::regclass::text, c.relkind::text, coalesce(c.relacl::text,'-'), c.relowner::regrole::text, c.relrowsecurity::text from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth','storage') and c.relkind in ('r','v','m','S','i','p')
union all select 'col', attrelid::regclass::text||'.'||attname, format_type(atttypid,atttypmod), attnotnull::text, coalesce(pg_get_expr(d.adbin,d.adrelid),'-'), coalesce(attacl::text,'-') from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth','storage') and a.attnum>0 and not a.attisdropped and c.relkind in ('r','v','p')
union all select 'con', conrelid::regclass::text||'.'||conname, md5(pg_get_constraintdef(oid)), '', '', '' from pg_constraint where connamespace in ('public'::regnamespace,'auth'::regnamespace)
union all select 'trg', tgrelid::regclass::text||'.'||tgname, md5(pg_get_triggerdef(oid)), tgenabled::text, '', '' from pg_trigger where not tgisinternal
union all select 'pol', schemaname||'.'||tablename||'.'||policyname, md5(coalesce(qual,'')||coalesce(with_check,'')||cmd||roles::text), '', '', '' from pg_policies
union all select 'ext', extname, extversion, '', '', '' from pg_extension
union all select 'idx', indexrelid::regclass::text, md5(pg_get_indexdef(indexrelid)), '', '', '' from pg_index i join pg_class c on c.oid=i.indrelid where c.relnamespace in ('public'::regnamespace,'auth'::regnamespace)
union all select 'type', t.oid::regtype::text, coalesce((select string_agg(enumlabel, ',' order by enumsortorder) from pg_enum e where e.enumtypid=t.oid),''), '', '', '' from pg_type t where t.typnamespace='public'::regnamespace and t.typtype in ('e','d','c') 
union all select 'nsp', nspname, nspowner::regrole::text, coalesce(nspacl::text,'-'), '', '' from pg_namespace
union all select 'defacl', defaclrole::regrole::text||'/'||coalesce(defaclnamespace::regnamespace::text,'-')||'/'||defaclobjtype::text, defaclacl::text, '', '', '' from pg_default_acl
order by 1,2;

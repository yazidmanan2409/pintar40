-- FABLE-06 §7 -- the FABLE-00 non-negotiables, measured IN THE RUNNING SYSTEM.
--
-- §7's wording is the whole point: "true in the running system, not just in a
-- migration file". Every row below reads the live catalog or live data. A
-- migration that declares a constraint and a database that carries one are
-- different claims, and this file only makes the second.
--
--     psql -At -F ' | ' -f docs/audit/launch-readiness.sql "$DB_URL"

with checks as (
select 'RLS closed by default' as item,
       (select count(*) = 0 from pg_tables where schemaname='public' and not rowsecurity) as ok,
       (select count(*)::text || ' table(s) without RLS' from pg_tables
         where schemaname='public' and not rowsecurity) as measured
union all
select 'no policy grants unconditionally',
       (select count(*) = 0 from pg_policies where schemaname='public' and (qual='true' or with_check='true')),
       (select count(*)::text || ' policy using true' from pg_policies
         where schemaname='public' and (qual='true' or with_check='true'))
union all
select 'storage buckets private',
       (select count(*) = 0 from storage.buckets where public),
       (select count(*)::text || ' public bucket(s)' from storage.buckets where public)
union all
select 'no client storage policy',
       (select count(*) = 0 from pg_policies where schemaname='storage' and tablename='objects'
         and (roles::text like '%anon%' or roles::text like '%authenticated%')),
       (select count(*)::text || ' client storage policy' from pg_policies
         where schemaname='storage' and tablename='objects'
           and (roles::text like '%anon%' or roles::text like '%authenticated%'))
union all
select 'hint never leaks the answer shape (CHECK, live)',
       (select count(*) > 0 from pg_constraint c join pg_class r on r.oid=c.conrelid
         where r.relname='items' and pg_get_constraintdef(c.oid) ~ 'hint_reveals_answer_shape'),
       (select count(*)::text || ' live CHECK invoking hint_reveals_answer_shape' from pg_constraint c
          join pg_class r on r.oid=c.conrelid
         where r.relname='items' and pg_get_constraintdef(c.oid) ~ 'hint_reveals_answer_shape')
union all
select 'every option carries a rationale (live data)',
       (select count(*) = 0 from public.item_options where rationale is null or btrim(rationale) = ''),
       (select count(*)::text || ' option(s) with no rationale, of '
             || (select count(*)::text from public.item_options) from public.item_options
         where rationale is null or btrim(rationale) = '')
union all
select 'certificate keys are versioned',
       (select count(*) = 0 from public.certificates where key_version is null),
       (select count(*)::text || ' certificate(s) with no key version, of '
             || (select count(*)::text from public.certificates) from public.certificates
         where key_version is null)
union all
select 'exactly one public verification path',
       (select count(*) = 1 from public.public_surface_registry where kind in ('ROUTE','ENDPOINT') and parent is null),
       (select coalesce(string_agg(surface, ', '), '(none)') from public.public_surface_registry
         where kind in ('ROUTE','ENDPOINT') and parent is null)
union all
select 'identity is Person-centred (no tenant column on persons)',
       (select count(*) = 0 from information_schema.columns
         where table_schema='public' and table_name='persons'
           and column_name in ('institution_id','class_id','cohort_id','node_id')),
       (select count(*)::text || ' tenant column(s) on persons' from information_schema.columns
         where table_schema='public' and table_name='persons'
           and column_name in ('institution_id','class_id','cohort_id','node_id'))
union all
select 'every function pins its search_path',
       (select count(*) = 0 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.prokind in ('f','p')
           and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%')),
       (select count(*)::text || ' function(s) without a pinned search_path' from pg_proc p
          join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.prokind in ('f','p')
           and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%'))
union all
select 'audit trail is append-only AND populated',
       (select count(*) > 0 from public.audit_log)
       and (select count(*) = 0 from information_schema.role_table_grants
             where table_schema='public' and table_name='audit_log'
               and privilege_type in ('UPDATE','DELETE','TRUNCATE')
               and grantee in ('anon','authenticated','service_role')),
       (select count(*)::text || ' audit row(s); ' from public.audit_log)
         || (select count(*)::text from information_schema.role_table_grants
              where table_schema='public' and table_name='audit_log'
                and privilege_type in ('UPDATE','DELETE','TRUNCATE')
                and grantee in ('anon','authenticated','service_role')) || ' client write grant(s)'
union all
select 'evidence eligibility is structural (no promotion possible)',
       (select public.evidence_class_min('SYNTHETIC','OFFICIAL') = 'SYNTHETIC'),
       'evidence_class_min(SYNTHETIC, OFFICIAL) = ' || public.evidence_class_min('SYNTHETIC','OFFICIAL')::text
union all
select 'scoring reproducibility versions recorded on every result',
       (select count(*) = 0 from public.assessment_results
         where engine_version is null or scoring_policy_version is null),
       (select count(*)::text || ' result(s) missing a version, of '
             || (select count(*)::text from public.assessment_results) from public.assessment_results
         where engine_version is null or scoring_policy_version is null)
union all
select 'no provider concept in the schema',
       (select count(*) = 0 from information_schema.columns
         where table_schema='public' and (column_name ~* '^provider' or column_name ~* '_provider$')),
       (select count(*)::text || ' provider-shaped column(s)' from information_schema.columns
         where table_schema='public' and (column_name ~* '^provider' or column_name ~* '_provider$'))
union all
-- OD-5: retention stays DISABLED and no default duration exists anywhere
select 'retention disabled and no default duration exists',
       (select count(*) = 0 from information_schema.columns
         where table_schema='public'
           and (column_name ~* 'retention' or column_name ~* 'anonymi[sz]')
           and column_default is not null),
       (select coalesce(string_agg(table_name||'.'||column_name||'='||column_default, ', '), 'no retention column carries a default')
          from information_schema.columns
         where table_schema='public'
           and (column_name ~* 'retention' or column_name ~* 'anonymi[sz]')
           and column_default is not null)
union all
-- OD-11: the anonymous surface has not widened
select 'anonymous surface unchanged (2 / 2 / 0)',
       (select count(*) = 2 from public.public_surface_registry where parent is null)
       and (select count(*) = 2 from public.public_surface_registry where kind in ('ROUTE','ENDPOINT'))
       and (select count(*) = 0 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
             where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE')),
       (select count(*)::text from public.public_surface_registry where parent is null) || ' surface / '
       || (select count(*)::text from public.public_surface_registry where kind in ('ROUTE','ENDPOINT')) || ' path / '
       || (select count(*)::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace
            where n.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE')) || ' anon function'
union all
-- INV-11 / the empirical columns, which the acceptance checklist names
select 'empirical psychometric fields are honestly NULL',
       (select count(*) = 0 from public.items
         where empirical_difficulty is not null or empirical_discrimination is not null
            or empirical_evidence_count is not null),
       (select count(*)::text || ' item(s) carry an empirical value, of '
             || (select count(*)::text from public.items) from public.items
         where empirical_difficulty is not null or empirical_discrimination is not null
            or empirical_evidence_count is not null)
)
select case when ok then 'PASS' else 'FAIL' end as verdict, item, measured from checks
order by ok, item;

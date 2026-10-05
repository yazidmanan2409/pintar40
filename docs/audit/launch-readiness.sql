-- FABLE-06 §7 -- the FABLE-00 non-negotiables, measured IN THE RUNNING SYSTEM.
--
-- §7's wording is the whole point: "true in the running system, not just in a
-- migration file". Every row below reads the live catalog or live data. A
-- migration that declares a constraint and a database that carries one are
-- different claims, and this file only makes the second.
--
--     psql -At -F ' | ' -f docs/audit/launch-readiness.sql "$DB_URL"
--
-- #150 G7. A restore (or any drift) can leave every row above it green while it
-- opens rights, drops a trigger or loses a setting: the hosted restore rehearsal
-- of 5 Oct did all three without a sound. The rows marked G7 pin those things BY
-- NAME to what this release grants, so a difference in either direction FAILs
-- and says what differs. When a migration deliberately changes a client right,
-- the release changes the pinned set in the same commit (DR-D01 runs this file
-- on CI's database and fails until it does).

with
-- every right `authenticated` holds on a public table, view or sequence, one
-- token per relation: S I U D T R X = select insert update delete truncate
-- references trigger on the whole relation; s i u r = on some columns only;
-- on a sequence G S U = usage select update
client_rights as (
  select c.relname as rel,
         case when c.relkind = 'S' then
                case when has_sequence_privilege('authenticated', c.oid, 'USAGE') then 'G' else '' end
             || case when has_sequence_privilege('authenticated', c.oid, 'SELECT') then 'S' else '' end
             || case when has_sequence_privilege('authenticated', c.oid, 'UPDATE') then 'U' else '' end
         else
                case when has_table_privilege('authenticated', c.oid, 'SELECT') then 'S' when has_any_column_privilege('authenticated', c.oid, 'SELECT') then 's' else '' end
             || case when has_table_privilege('authenticated', c.oid, 'INSERT') then 'I' when has_any_column_privilege('authenticated', c.oid, 'INSERT') then 'i' else '' end
             || case when has_table_privilege('authenticated', c.oid, 'UPDATE') then 'U' when has_any_column_privilege('authenticated', c.oid, 'UPDATE') then 'u' else '' end
             || case when has_table_privilege('authenticated', c.oid, 'DELETE') then 'D' else '' end
             || case when has_table_privilege('authenticated', c.oid, 'TRUNCATE') then 'T' else '' end
             || case when has_table_privilege('authenticated', c.oid, 'REFERENCES') then 'R' when has_any_column_privilege('authenticated', c.oid, 'REFERENCES') then 'r' else '' end
             || case when has_table_privilege('authenticated', c.oid, 'TRIGGER') then 'X' else '' end
         end as r
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r','v','m','p','f','S')),
rights_now as (select rel || '=' || r as tok from client_rights where r <> ''),
-- this release's set (staging, 6 Oct, migrations 161: the same 85 tokens)
rights_release as (select unnest(string_to_array(
  'academic_periods=S accounts=S assessment_assignment_status_transitions=S ' ||
  'assessment_assignments=S assessment_definition_bounds=S assessment_definitions=SIU ' ||
  'assessment_results=S assessment_sessions=s assistance_grants=S assistance_levels=S audit_log=S ' ||
  'briefing_transitions=S briefings=S certificate_identity_snapshots=S certificate_templates=S ' ||
  'certificates=S classes=S coaching_findings=SU content_ownership_lineage=S ' ||
  'content_status_transitions=S course_revision_notes=S courses=SIU doctrine_lexicon=S ' ||
  'enrollments=SIU evidence_class_overrides=SI exam_cooling_policies=SIU feature_flags=SIU ' ||
  'feedback_cycles=S feedback_opportunities=S generated_reports=S import_jobs=S import_rows=S ' ||
  'ingest_batches=SIU ingest_status_transitions=S institutional_identities=S institutions=S ' ||
  'integrity_signals=S item_options=SIU item_type_learner_support=S item_type_registry=S items=SIU ' ||
  'learner_readable_fields=S learning_assignment_release_moves=S ' ||
  'learning_assignment_status_transitions=S learning_assignments=S learning_objectives=SIU ' ||
  'lesson_progress=S lesson_review_items=S lesson_review_requests=S lessons=SIU ' ||
  'management_decisions=S mcq_quality_findings=SU memberships=SIU metric_catalogue=S ' ||
  'metric_definitions=S metric_sources=S misconception_taxonomy=SIU mode_policy=S modules=SIU ' ||
  'my_profile=S org_nodes=S person_tour_state=S persons=Su platform_config=SU ' ||
  'platform_environment=S plp_releases=S portable_visibility=S presented_item_views=S ' ||
  'presented_items=S question_health=SIU question_health_thresholds=S question_health_transitions=S ' ||
  'readiness_tiers=S record_class_registry=S report_template_metrics=SIUD report_templates=SIUD ' ||
  'responses=S role_assignments=S scoring_policy=S session_status_transitions=S source_versions=SIU ' ||
  'sources=SIU support_reports=S tour_registry=S transfers=S', ' ')) as tok),
rights_diff as (
  select '+' || tok as d from (select tok from rights_now except select tok from rights_release) x
  union all
  select '-' || tok from (select tok from rights_release except select tok from rights_now) y),
-- every public function `authenticated` may execute, against the client
-- registry plus the helpers row security and CHECKs call as the caller
exec_now as (
  select p.proname as f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'EXECUTE')),
exec_release as (
  select function_name as f from public.client_rpc_registry
  union
  select unnest(string_to_array(
  'bank_tier_rank difficulty_band eligible_items_for_definition engine_version evidence_readiness ' ||
  'hint_reveals_answer_shape import_pilot_size import_pilot_threshold item_is_drawable ' ||
  'media_entries_are_storage_paths media_entries_have_transcripts members_of_node_at ' ||
  'move_learner_to_class org_kind_level role_capabilities role_rank validate_learner_text', ' '))),
exec_diff as (
  select '+' || f as d from (select f from exec_now except select f from exec_release) x
  union all
  select '-' || f from (select f from exec_release except select f from exec_now) y),
-- PINTAR's triggers on auth.users (Supabase leaves `auth` out of a schema backup)
auth_triggers_release(name, fn) as (values
  ('on_auth_user_created', 'handle_new_auth_user()'),
  ('pintar_card_email_guard', 'auth_card_email_guard()'),
  ('pintar_password_write_guard', 'auth_password_write_guard()')),
auth_triggers_missing as (
  select e.name from auth_triggers_release e
   where not exists (select 1 from pg_trigger t
                      where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal and t.tgname = e.name
                        and t.tgfoid::regprocedure::text = e.fn and t.tgenabled in ('O', 'A'))),
checks as (
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
-- RESTATED FOR #150 G7: the row counted every root route as a "verification
-- path", so BOB-12, BOB-26..28 and IDENTITY-4.0's sign-in and recovery routes
-- (approved surfaces, each registered by its own migration) turned it FAIL from
-- migration 20261019100000 on, unseen until the rehearsal's count was repaired.
-- What INV-38 holds is unchanged: one public route verifies certificates.
select 'exactly one public verification path',
       (select count(*) = 1 from public.public_surface_registry
         where kind = 'ROUTE' and parent is null and surface ~ 'verif')
       and exists (select 1 from public.public_surface_registry
                    where surface = 'certificate_verification' and kind = 'ROUTE' and parent is null),
       (select coalesce(string_agg(surface, ', '), '(none)') from public.public_surface_registry
         where kind = 'ROUTE' and parent is null and surface ~ 'verif')
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
-- RESTATED FOR #150 G7: pinned at 2 / 2 / 0 when only certificate verification
-- was public; BOB-12, BOB-26..28 and IDENTITY-4.0 each widened it by an approved
-- migration that registers its surface, and the row turned FAIL unseen. It now
-- pins the registered surface BY NAME (10 routes, 9 endpoints) and, as before,
-- no public function `anon` may execute.
select 'anonymous surface unchanged (10 / 19 / 0)',
       (select count(*) = 10 from public.public_surface_registry where parent is null)
       and (select count(*) = 19 from public.public_surface_registry where kind in ('ROUTE','ENDPOINT'))
       and (select string_agg(surface, ' ' order by surface) from public.public_surface_registry) =
           'activation_check activation_check_api activation_code activation_code_api card_signin ' ||
           'card_signin_api certificate_verification certificate_verification_api identity_page ' ||
           'password_signin password_signin_api recovery_check recovery_check_api recovery_code ' ||
           'recovery_code_api recovery_password recovery_password_api recovery_pin recovery_pin_api'
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
union all
-- #150 G7 (H4): a restore re-grants every right through the new project's
-- default privileges; anon holds none in PINTAR
select 'G7 anon holds no right on any public table, view or sequence',
       (select count(*) = 0 from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and ((c.relkind in ('r','v','m','p','f') and (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                                                      or has_any_column_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')))
             or (c.relkind = 'S' and has_sequence_privilege('anon', c.oid, 'USAGE,SELECT,UPDATE')))),
       (select count(*)::text || ' relation(s) anon may touch'
               || coalesce(': ' || (array_to_string((array_agg(relname order by relname))[1:6], ', ')), '')
          from (select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public'
                   and ((c.relkind in ('r','v','m','p','f') and (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                                                              or has_any_column_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')))
                     or (c.relkind = 'S' and has_sequence_privilege('anon', c.oid, 'USAGE,SELECT,UPDATE')))) c)
union all
select 'G7 authenticated holds exactly the release''s table rights',
       (select count(*) = 0 from rights_diff),
       (select count(*)::text || ' relation(s) as released' from rights_now)
       || coalesce((select '; ' || count(*)::text || ' differ: ' || array_to_string((array_agg(d order by d))[1:8], ' ')
                      from rights_diff having count(*) > 0), '')
union all
select 'G7 authenticated executes exactly the registered functions',
       (select count(*) = 0 from exec_diff),
       (select count(*)::text || ' function(s) as released' from exec_now)
       || coalesce((select '; ' || count(*)::text || ' differ: ' || array_to_string((array_agg(d order by d))[1:8], ' ')
                      from exec_diff having count(*) > 0), '')
union all
-- a SECURITY DEFINER function runs as its owner: an owner a restore changed
-- changes what every one of them may do
select 'G7 every public table, view, sequence and function is owned by postgres',
       (select count(*) = 0 from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind in ('r','v','m','p','f','S') and pg_get_userbyid(c.relowner) <> 'postgres')
       and (select count(*) = 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and pg_get_userbyid(p.proowner) <> 'postgres'),
       (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind in ('r','v','m','p','f','S') and pg_get_userbyid(c.relowner) <> 'postgres')
       || ' relation(s) and '
       || (select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and pg_get_userbyid(p.proowner) <> 'postgres')
       || ' function(s) owned by another role'
union all
-- #150 G7 (H5): the account-creation, card-email and password-write guards
select 'G7 PINTAR''s three auth.users triggers present and enabled',
       (select count(*) = 0 from auth_triggers_missing),
       (select 3 - count(*) || ' of 3 present and enabled' || coalesce('; missing or disabled: ' || string_agg(name, ', ' order by name), '')
          from auth_triggers_missing)
union all
-- Gate 6: PostgREST asks pintar_permintaan.periksa() before every request
select 'G7 PostgREST pre-request set on authenticator',
       exists (select 1 from pg_db_role_setting s join pg_roles r on r.oid = s.setrole
                where r.rolname = 'authenticator' and s.setdatabase = 0
                  and 'pgrst.db_pre_request=pintar_permintaan.periksa' = any(s.setconfig))
       and to_regprocedure('pintar_permintaan.periksa()') is not null,
       coalesce((select array_to_string(array(select x from unnest(s.setconfig) x where x like 'pgrst.db_pre_request=%'), ', ')
                   from pg_db_role_setting s join pg_roles r on r.oid = s.setrole
                  where r.rolname = 'authenticator' and s.setdatabase = 0), '(no role setting)')
       || '; function ' || case when to_regprocedure('pintar_permintaan.periksa()') is null then 'absent' else 'present' end
union all
select 'G7 the assets bucket exists and is private',
       exists (select 1 from storage.buckets where id = 'assets' and not public),
       coalesce((select string_agg(id || case when public then ' (PUBLIC)' else ' (private)' end, ', ' order by id) from storage.buckets), '(no bucket)')
)
select case when ok then 'PASS' else 'FAIL' end as verdict, item, measured from checks
order by ok, item;

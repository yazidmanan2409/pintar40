-- STAGE 2 OF THE PRODUCTION-UPGRADE REHEARSAL: READ-ONLY COUNTS OF PRODUCTION, FOR THE OWNER'S LATER AUTHORISATION.
--
-- NOT AUTHORISED TO RUN AGAINST PRODUCTION YET. Running it there is the owner's separate decision
-- (PRODUCTION-UPGRADE-REHEARSAL.md, stage 2). Until then it runs only in the rehearsal workflow, on the throw-away
-- local stack at migration 111, against synthetic rows ("the stage 2 query runs at 111 (synthetic)").
--
-- WHAT IT RETURNS: COUNTS ONLY. One row per measure: (section, measure, value). No row content, no name, no email,
-- no identifier of any person, school or record. The only non-count values are the migration list's max version and
-- md5 (a fingerprint of the list, which is public in the repository), table names and sizes in section 9, and
-- booleans about configuration.
--
-- SAFETY: one transaction, READ ONLY, ended by a rollback; no function with side effects is called; every statement
-- is valid at migration 111's schema (a table created after 111 is reported as "n/a at 111", never queried). Where an
-- object may or may not exist (pg_cron), it is read only through to_regclass and query_to_xml, guarded by CASE.
--
-- HOW TO READ IT: each measure names the migration (112-282) whose predicate it counts. A guard measure
-- ("must be 0") above 0 means that migration REFUSES TO APPLY on production as it stands: a blocker to resolve
-- before the upgrade, not during it.

begin;
set transaction read only;
set local statement_timeout = '60s';

with
-- the people whom a migration's predicate excludes as evaluation personas (20261021100000's adalah_persona, at 111)
persona as (select distinct person_id from public.evaluation_personas),
open_sitting as (select s.* from public.assessment_sessions s where s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')),
-- course chains through supersedes_course_id, each course with its depth below the chain's root
chain as (
  with recursive c(id, depth) as (
    select id, 0 from public.courses where supersedes_course_id is null
    union all
    select k.id, c.depth + 1 from public.courses k join c on k.supersedes_course_id = c.id where c.depth < 64)
  select * from c),
m(ord, section, measure, value) as (
  -- 0 ---------------------------------------------------------------- identity: is production exactly at 111?
  select 0, 'identity', 'migrations: count', (select count(*)::text from supabase_migrations.schema_migrations)
  union all select 0, 'identity', 'migrations: max version', (select max(version) from supabase_migrations.schema_migrations)
  union all select 0, 'identity', 'migrations: md5 of the ordered version list',
    (select md5(string_agg(version, ',' order by version)) from supabase_migrations.schema_migrations)
  union all select 0, 'identity', 'platform_environment is production (20261006100000, 20261007100000 take their structural path)',
    (select count(*)::text from public.platform_environment where environment = 'production')
  union all select 0, 'identity', 'pg_cron installed (20270114110000, 20270116110000 install jobs)',
    (select count(*)::text from pg_extension where extname = 'pg_cron')
  union all select 0, 'identity', 'cron.job rows (0 when pg_cron is absent)',
    (case when to_regclass('cron.job') is not null
          then (xpath('/row/n/text()', query_to_xml('select count(*) as n from cron.job', false, true, '')))[1]::text
          else '0' end)

  -- 1 ---------------------------------------------------------------- the data-rewriting migrations, 112-282
  union all select 1, 'rewrite', '20261011100000 standard report templates provisioned: institutions (every tenant)',
    (select count(*)::text from public.institutions)
  union all select 1, 'rewrite', '20261011100000 of which tenant_kind INSTITUTION (each must end with both standard reports)',
    (select count(*)::text from public.institutions where tenant_kind = 'INSTITUTION')
  union all select 1, 'rewrite', '20261021100000 persons given a pintar_id (every person)',
    (select count(*)::text from public.persons)
  union all select 1, 'rewrite', '20261021100000 account_setup REQUIRED: EMAIL accounts not of an evaluation persona',
    (select count(*)::text from public.accounts a where a.kind = 'EMAIL' and a.person_id not in (select person_id from persona))
  union all select 1, 'rewrite', '20261102100000 assessment_assignments given pass_mark (mode <> PRE_TEST, mastery_min set)',
    (select count(*)::text from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
      where d.mode <> 'PRE_TEST' and nullif(d.passing_rules ->> 'mastery_min', '') is not null)
  union all select 1, 'rewrite', '20261102100000 assessment_sessions given pass_mark (mode <> PRE_TEST, mastery_min set)',
    (select count(*)::text from public.assessment_sessions s join public.assessment_definitions d on d.id = s.assessment_definition_id
      where s.mode <> 'PRE_TEST' and nullif(d.passing_rules ->> 'mastery_min', '') is not null)
  union all select 1, 'rewrite', '20261102100000 PRE_TEST definitions naming a mastery_min (left without a pass mark)',
    (select count(*)::text from public.assessment_definitions d
      where d.mode = 'PRE_TEST' and nullif(d.passing_rules ->> 'mastery_min', '') is not null)
  union all select 1, 'rewrite', '20261113100000 mode_policy QUICK certifies (1 = still true, the migration sets false)',
    (select count(*)::text from public.mode_policy where mode = 'QUICK' and certifies)
  union all select 1, 'rewrite', '20261118100000 org_nodes given learning_context ACADEMIC (kind not INSTITUTION/FACULTY)',
    (select count(*)::text from public.org_nodes where kind not in ('INSTITUTION', 'FACULTY'))
  union all select 1, 'rewrite', '20261227100000 result_views backfilled: POST_TEST sessions FINALIZED',
    (select count(*)::text from public.assessment_sessions where mode = 'POST_TEST' and status = 'FINALIZED')
  union all select 1, 'rewrite', '20270112195000 institutions given zona_waktu Asia/Jakarta (every institution)',
    (select count(*)::text from public.institutions)
  union all select 1, 'rewrite', '20270115100000 items given revision 1 (every item)',
    (select count(*)::text from public.items)
  union all select 1, 'rewrite', '20270115100000 SUPERSEDED releases with a RELEASE_WITHDRAWN audit row (withdrawn_* backfilled)',
    (select count(*)::text from public.plp_releases r where r.status = 'SUPERSEDED'
      and exists (select 1 from public.audit_log a where a.action = 'RELEASE_WITHDRAWN' and a.target_table = 'plp_releases'
                   and a.target_id = r.id::text))
  union all select 1, 'rewrite', '20270115100000 SUPERSEDED releases with no such audit row (left unmarked)',
    (select count(*)::text from public.plp_releases r where r.status = 'SUPERSEDED'
      and not exists (select 1 from public.audit_log a where a.action = 'RELEASE_WITHDRAWN' and a.target_table = 'plp_releases'
                       and a.target_id = r.id::text))
  union all select 1, 'rewrite', '20270116130000 auth users locked with banned_until = infinity (rewritten to 2999-12-31)',
    (select count(*)::text from auth.users where banned_until = 'infinity'::timestamptz)
  union all select 1, 'rewrite', '20270117170000 person_suspensions closed at request (n/a at 111: table created by 20270113130000)', '0'
  union all select 1, 'rewrite', '20270119120000 maintenance_windows EMERGENCY open (n/a at 111: table created by 20261120100000)', '0'
  union all select 1, 'rewrite', 'configuration rows the migrations rewrite: client_rpc_registry',
    (select count(*)::text from public.client_rpc_registry)
  union all select 1, 'rewrite', 'configuration rows the migrations rewrite: metric_catalogue / scoring_policy / mode_policy',
    (select (select count(*) from public.metric_catalogue) || ' / ' || (select count(*) from public.scoring_policy) || ' / '
            || (select count(*) from public.mode_policy))
  union all select 1, 'rewrite', 'configuration rows the migrations rewrite: public_surface_registry / doctrine_lexicon / learner_readable_fields',
    (select (select count(*) from public.public_surface_registry) || ' / ' || (select count(*) from public.doctrine_lexicon) || ' / '
            || (select count(*) from public.learner_readable_fields))

  -- 2 ---------------------------------------------------------------- guards: each must be 0, or that migration refuses
  union all select 2, 'guard', '20261113100000 ELIGIBLE (unsigned) certificates from a QUICK session (must be 0)',
    (select count(*)::text from public.certificates c join public.assessment_sessions s on s.id = c.session_id
      where c.status = 'ELIGIBLE' and s.mode = 'QUICK')
  union all select 2, 'guard', '20261202100000 options naming a misconception only another institution holds (must be 0)',
    (select count(*)::text from public.item_options o where o.misconception_code is not null
      and not exists (select 1 from public.misconception_taxonomy mt where mt.code = o.misconception_code and mt.institution_id = o.institution_id))
  union all select 2, 'guard', '20270112160000 live enrolments sharing (person, school, year, programme) (must be 0)',
    (select coalesce(sum(n - 1), 0)::text from (select count(*) n from public.enrollments where status in ('PENDING', 'ACTIVE')
      group by person_id, institution_id, academic_period_id, coalesce(programme_id, '00000000-0000-0000-0000-000000000000'::uuid)
      having count(*) > 1) g)
  union all select 2, 'guard', '20270113110000 certificates replaced by more than one sealed replacement (must be 0)',
    (select count(*)::text from (select supersedes_certificate_id from public.certificates
      where supersedes_certificate_id is not null and status <> 'ELIGIBLE' group by 1 having count(*) > 1) g)
  union all select 2, 'guard', '20270112210000 promotion.applied audit rows sharing a run_id (must be 0)',
    (select count(*)::text from (select summary ->> 'run_id' from public.audit_log
      where action = 'promotion.applied' and summary ->> 'run_id' is not null group by 1 having count(*) > 1) g)
  union all select 2, 'guard', '20261219100000 EXECUTED transfers with no to_academic_period_id (must be 0)',
    (select count(*)::text from public.transfers where status::text = 'EXECUTED' and to_academic_period_id is null)

  -- 3 ---------------------------------------------------------------- account shapes
  union all select 3, 'accounts', 'auth users', (select count(*)::text from auth.users)
  union all select 3, 'accounts', 'auth users locked (banned_until = infinity)',
    (select count(*)::text from auth.users where banned_until = 'infinity'::timestamptz)
  union all select 3, 'accounts', 'auth users suspended until a date still to come (finite banned_until > now)',
    (select count(*)::text from auth.users where banned_until is not null and banned_until <> 'infinity'::timestamptz and banned_until > now())
  union all select 3, 'accounts', 'auth users with a past banned_until', (select count(*)::text from auth.users where banned_until <= now())
  union all select 3, 'accounts', 'accounts by kind: EMAIL / CLASSROOM_CARD',
    (select count(*) filter (where kind = 'EMAIL') || ' / ' || count(*) filter (where kind = 'CLASSROOM_CARD') from public.accounts)
  union all select 3, 'accounts', 'password-write permits (n/a at 111: created by 20261112100000)', '0'
  union all select 3, 'accounts', 'activation grants: total / open (unconsumed, unexpired) / consumed',
    (select count(*) || ' / ' || count(*) filter (where consumed_at is null and expires_at > now()) || ' / '
            || count(*) filter (where consumed_at is not null) from public.account_activation_grants)
  union all select 3, 'accounts', 'orphan auth users (no account row)',
    (select count(*)::text from auth.users u where not exists (select 1 from public.accounts a where a.auth_user_id = u.id))
  union all select 3, 'accounts', 'orphan persons (no account, not anonymised)',
    (select count(*)::text from public.persons p where p.anonymized_at is null
      and not exists (select 1 from public.accounts a where a.person_id = p.id))
  union all select 3, 'accounts', 'persons anonymised', (select count(*)::text from public.persons where anonymized_at is not null)
  union all select 3, 'accounts', 'evaluation personas', (select count(*)::text from persona)

  -- 4 ---------------------------------------------------------------- sittings at upgrade time
  union all select 4, 'sittings', 'open: CREATED', (select count(*)::text from open_sitting where status = 'CREATED')
  union all select 4, 'sittings', 'open: IN_PROGRESS', (select count(*)::text from open_sitting where status = 'IN_PROGRESS')
  union all select 4, 'sittings', 'open: PAUSED', (select count(*)::text from open_sitting where status = 'PAUSED')
  union all select 4, 'sittings', 'open and past their authoritative deadline',
    (select count(*)::text from open_sitting where authoritative_deadline < now())
  union all select 4, 'sittings', 'open with no authoritative deadline', (select count(*)::text from open_sitting where authoritative_deadline is null)
  union all select 4, 'sittings', 'EXPIRED, not finalised (no result)',
    (select count(*)::text from public.assessment_sessions s where s.status = 'EXPIRED'
      and not exists (select 1 from public.assessment_results r where r.session_id = s.id))
  union all select 4, 'sittings', 'SUBMITTED, not finalised', (select count(*)::text from public.assessment_sessions where status = 'SUBMITTED')
  union all select 4, 'sittings', 'open, by mode (QUICK / POST_TEST / PRE_TEST / other)',
    (select count(*) filter (where mode = 'QUICK') || ' / ' || count(*) filter (where mode = 'POST_TEST') || ' / '
            || count(*) filter (where mode = 'PRE_TEST') || ' / ' || count(*) filter (where mode not in ('QUICK', 'POST_TEST', 'PRE_TEST'))
       from open_sitting)
  union all select 4, 'sittings', 'open, with neither class nor cohort recorded',
    (select count(*)::text from open_sitting where class_node_id is null and cohort_node_id is null)
  union all select 4, 'sittings', 'all sittings, by status',
    (select string_agg(status::text || '=' || n, ', ' order by status) from
      (select status, count(*) n from public.assessment_sessions group by 1) g)

  -- 5 ---------------------------------------------------------------- enrolment and membership shapes
  union all select 5, 'enrolments', 'enrolments by status',
    (select string_agg(status::text || '=' || n, ', ' order by status) from (select status, count(*) n from public.enrollments group by 1) g)
  union all select 5, 'enrolments', 'persons with more than one live (PENDING/ACTIVE) enrolment',
    (select count(*)::text from (select person_id from public.enrollments where status in ('PENDING', 'ACTIVE') group by 1 having count(*) > 1) g)
  union all select 5, 'enrolments', 'persons with open (valid_to null) memberships in more than one CLASS',
    (select count(*)::text from (select e.person_id from public.memberships m join public.enrollments e on e.id = m.enrollment_id
      join public.org_nodes n on n.id = m.node_id where m.valid_to is null and n.kind = 'CLASS' group by 1 having count(*) > 1) g)
  union all select 5, 'enrolments', 'departures: ENDED enrolments by end_reason',
    (select coalesce(string_agg(end_reason::text || '=' || n, ', ' order by end_reason), 'none') from
      (select end_reason, count(*) n from public.enrollments where status = 'ENDED' group by 1) g)
  union all select 5, 'enrolments', 'open memberships of an ENDED or CANCELLED enrolment',
    (select count(*)::text from public.memberships m join public.enrollments e on e.id = m.enrollment_id
      where m.valid_to is null and e.status in ('ENDED', 'CANCELLED'))
  union all select 5, 'enrolments', 'suspensions (n/a at 111: person_suspensions is created by 20270113130000; see auth bans above)', '0'
  union all select 5, 'enrolments', 'transfers by status',
    (select coalesce(string_agg(status::text || '=' || n, ', ' order by status), 'none') from (select status, count(*) n from public.transfers group by 1) g)

  -- 6 ---------------------------------------------------------------- certificates
  union all select 6, 'certificates', 'certificates by status',
    (select coalesce(string_agg(status::text || '=' || n, ', ' order by status), 'none') from (select status, count(*) n from public.certificates group by 1) g)
  union all select 6, 'certificates', 'sealed (non-ELIGIBLE) certificates from a QUICK session (read by 20261113100000''s question)',
    (select count(*)::text from public.certificates c join public.assessment_sessions s on s.id = c.session_id
      where c.status <> 'ELIGIBLE' and s.mode = 'QUICK')
  union all select 6, 'certificates', 'ELIGIBLE unsigned QUICK certificates (20261113100000 refuses if above 0)',
    (select count(*)::text from public.certificates c join public.assessment_sessions s on s.id = c.session_id
      where c.status = 'ELIGIBLE' and s.mode = 'QUICK')
  union all select 6, 'certificates', 'certificates issued between 17:00 and 24:00 UTC (their verification date moves a day under 20270113160000''s school clock)',
    (select count(*)::text from public.certificates where status <> 'ELIGIBLE'
      and extract(hour from (issued_at_iso::timestamptz at time zone 'UTC')) >= 17)

  -- 7 ---------------------------------------------------------------- A3's lineage backfill (refuses rather than guesses)
  union all select 7, 'lineage', 'definition groups sharing (institution, title, mode) with more than one row',
    (select count(*)::text from (select 1 from public.assessment_definitions group by institution_id, title, mode having count(*) > 1) g)
  union all select 7, 'lineage', 'definitions in those groups',
    (select coalesce(sum(n), 0)::text from (select count(*) n from public.assessment_definitions group by institution_id, title, mode having count(*) > 1) g)
  union all select 7, 'lineage', 'largest such group',
    (select coalesce(max(n), 0)::text from (select count(*) n from public.assessment_definitions group by institution_id, title, mode) g)
  union all select 7, 'lineage', 'courses by chain depth through supersedes_course_id',
    (select string_agg('depth ' || depth || '=' || n, ', ' order by depth) from (select depth, count(*) n from chain group by 1) g)
  union all select 7, 'lineage', 'courses not reached from a root (a broken or cyclic chain)',
    (select count(*)::text from public.courses c where not exists (select 1 from chain where chain.id = c.id))
  union all select 7, 'lineage', 'definitions whose module has no supersedes_module_id match in the next revision of its course',
    (select count(*)::text from public.assessment_definitions d
       join public.modules m on m.id = d.module_id
       join public.courses nxt on nxt.supersedes_course_id = m.course_id
      where not exists (select 1 from public.modules m2 where m2.course_id = nxt.id and m2.supersedes_module_id = m.id))
  union all select 7, 'lineage', 'modules of a superseding course with no supersedes_module_id',
    (select count(*)::text from public.modules m join public.courses c on c.id = m.course_id
      where c.supersedes_course_id is not null and m.supersedes_module_id is null)
  union all select 7, 'lineage', 'definitions bound to a course only, or to nothing',
    (select count(*) filter (where module_id is null and course_id is not null) || ' / ' || count(*) filter (where module_id is null and course_id is null)
       from public.assessment_definitions)

  -- 8 ---------------------------------------------------------------- storage (metadata counts only)
  union all select 8, 'storage', 'storage buckets', (select count(*)::text from storage.buckets)
  union all select 8, 'storage', 'storage objects', (select count(*)::text from storage.objects)
)
select section, measure, value from m order by ord, section, measure;

-- 9 ------------------------------------------------------------------ volume: the ten largest tables
select 'volume' as section, n.nspname || '.' || c.relname as measure,
       pg_total_relation_size(c.oid) || ' bytes, ~' || greatest(c.reltuples, 0)::bigint || ' rows' as value
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where c.relkind in ('r', 'p') and n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
 order by pg_total_relation_size(c.oid) desc
 limit 10;

rollback;

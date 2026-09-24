-- ===========================================================================
-- L3-F01 C.2 -- HOSTED CREDENTIAL AUDIT
--
-- Mechanically executable, not prose. Run against a hosted PINTAR project (the
-- management channel / SQL editor). It FAILS if any Auth identity on the hosted
-- project corresponds to a credential that is knowable from tracked repository
-- content -- the condition Layer-3 finding L3-F01 identified, where synthetic.sql
-- had placed a global SYSTEM_ADMIN with a repository-literal password on the
-- hosted development project.
--
-- WHY A PATTERN AND NOT A PASSWORD COMPARISON. The repository never carries a
-- hosted password HASH (bcrypt salts differ per row), so this cannot compare
-- ciphertext. What IS knowable from the repository is the IDENTITY SET the
-- fixture seeds create: their email domains. Every credential the repository
-- can reconstruct belongs to a *.pintar.test fixture account (synthetic, cards,
-- bootstrap, evaluation). A real end-user identity never uses those domains, so
-- the presence of ANY password-enabled *.pintar.test identity on a hosted
-- project is the defect. The pattern is the tracked fact; the seeds are its
-- provenance.
--
-- Expected on a correctly-provisioned hosted project: PASS on every row.
-- ===========================================================================
with checks as (
  select 'no password-enabled fixture identity on hosted' as item,
         count(*) = 0 as ok,
         count(*)::text || ' fixture Auth identit(y/ies) with a password present' as measured
    from auth.users u
   where (u.encrypted_password is not null and u.encrypted_password <> '')
     and u.email ~ '@(synthetic|cards\.synthetic|bootstrap)\.pintar\.test$'

  union all
  select 'no fixture identity at all on hosted (any auth state)',
         count(*) = 0,
         count(*)::text || ' *.pintar.test fixture Auth identit(y/ies) present'
    from auth.users u
   where u.email like '%.pintar.test'

  union all
  select 'no privileged role assignment resolvable through a fixture login',
         count(*) = 0,
         count(*)::text || ' privileged assignment(s) reachable via a *.pintar.test account'
    from public.role_assignments r
    join public.accounts a  on a.person_id = r.person_id
    join auth.users       u on u.id = a.auth_user_id
   where r.revoked_at is null
     and r.role in ('SYSTEM_ADMIN','INSTITUTION_ADMIN','HEAD_OF_DEPARTMENT','DEAN')
     and u.email like '%.pintar.test'

  union all
  -- the fail-closed marker introduced by 0084 must be OFF on a hosted project:
  -- a migrations-only apply leaves it false, and it should never be flipped here
  select 'synthetic fixtures are NOT enabled on hosted',
         coalesce(bool_and(not local_fixtures_enabled), true),
         coalesce(string_agg(environment || ': local_fixtures_enabled=' || local_fixtures_enabled, ', '), '(no platform_environment row)')
    from public.platform_environment

  union all
  select 'synthetic_fixtures_permitted() refuses on hosted',
         public.synthetic_fixtures_permitted() = false,
         'synthetic_fixtures_permitted() = ' || public.synthetic_fixtures_permitted()::text
)
select case when ok then 'PASS' else 'FAIL' end as verdict, item, measured
  from checks order by ok, item;

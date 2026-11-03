-- Batch 4 staging preservation (D-153), read only: run before the merge and after the last walk; every value must be equal.
with demo as (select id from public.institutions where slug = 'sekolah-demo-pintar'),
     uji as (select id from public.institutions where slug like 'sekolah-uji-%'),
     orang_demo as (select distinct e.person_id from public.enrollments e where e.institution_id = (select id from demo)
                    union select r.person_id from public.role_assignments r where r.institution_id = (select id from demo))
select
  (select count(*) from public.role_assignments where institution_id = (select id from demo) and revoked_at is null) as demo_roles,
  (select count(*) from public.assessment_results where institution_id = (select id from demo)) as demo_results,
  (select count(*) from public.official_results where institution_id = (select id from demo)) as demo_official,
  (select count(*) from public.certificates where institution_id = (select id from demo)) as demo_certificates,
  (select count(*) from public.enrollments where institution_id = (select id from demo)) as demo_enrolments,
  (select count(*) from public.courses where institution_id = (select id from demo)) as demo_courses,
  (select count(*) || ' (' || coalesce(max(id), 0) || ')' from public.audit_log where institution_id = (select id from demo)) as demo_audit,
  (select md5(coalesce(string_agg(p.id || ':' || p.display_name || ':' || coalesce(p.pintar_id, '') || ':' || coalesce(p.photo_path, '')
       || ':' || coalesce(u.username, ''), ',' order by p.id), '')) from public.persons p left join public.person_usernames u on u.person_id = p.id
     where p.id in (select person_id from orang_demo)) as demo_people,
  (select md5(coalesce(string_agg(a.id || ':' || a.kind || ':' || coalesce(a.card_number, '') || ':' || lower(coalesce(x.email, '')), ',' order by a.id), ''))
     from public.accounts a join auth.users x on x.id = a.auth_user_id where a.person_id in (select person_id from orang_demo)) as demo_accounts,
  (select md5(coalesce(string_agg(t::text, ',' order by t.id), '')) from public.assessment_results t where t.institution_id not in (select id from uji)) as results_outside_tests,
  (select md5(coalesce(string_agg(t::text, ',' order by t.id), '')) from public.official_results t where t.institution_id not in (select id from uji)) as official_outside_tests,
  (select md5(coalesce(string_agg(t::text, ',' order by t.id), '')) from public.certificates t where t.institution_id not in (select id from uji)) as certificates_outside_tests,
  (select count(*) from public.assessment_results) || '/' || (select count(*) from public.official_results) || '/' || (select count(*) from public.certificates)
     || '/' || (select count(*) from public.courses) || '/' || (select count(*) from public.transfers) as all_results_official_certs_courses_transfers;

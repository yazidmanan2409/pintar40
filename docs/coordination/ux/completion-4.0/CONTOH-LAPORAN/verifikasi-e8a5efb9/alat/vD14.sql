-- LOCAL ONLY, synthetic (Daisy). A corrected answer key, then the product's audited recalculation (recompute_result)
-- by a platform SYSTEM_ADMIN, as selftest F36-D14 does. One learner: the weakest 5B Uji Penguasaan.
\set ON_ERROR_STOP on
create temp table pilih as
select r.id as hasil, r.session_id as sesi, r.person_id as orang, r.mastery, r.institution_id as sekolah
  from public.assessment_results r join public.official_sessions s on s.id = r.session_id
  join public.accounts a on a.person_id = r.person_id join auth.users u on u.id = a.auth_user_id
 where u.email like 'lap-5b-%' and s.mode = 'POST_TEST' and r.supersedes_result_id is null
   and not exists (select 1 from public.assessment_results q where q.supersedes_result_id = r.id)
 order by r.mastery asc, r.computed_at desc limit 1;
create temp table koreksi as
select pi.item_id, o.id as dipilih, k.id as kunci_lama
  from pilih p join public.responses resp on resp.session_id = p.sesi and resp.is_final
  join public.presented_items pi on pi.id = resp.presented_item_id
  join public.item_options o on o.item_id = pi.item_id and o.label = (resp.value->>'pilihan')
  join public.item_options k on k.item_id = pi.item_id and k.is_correct
 where not o.is_correct limit 1;
select 'pilih', * from pilih; select 'koreksi', * from koreksi;
-- the corrected key (content edit; immutability triggers off for this one fixture write)
set session_replication_role = replica;
update public.item_options set is_correct = false where id = (select kunci_lama from koreksi);
update public.item_options set is_correct = true  where id = (select dipilih from koreksi);
set session_replication_role = origin;
-- a platform SYSTEM_ADMIN, as selftest.f11_user makes one
select set_config('app.seed_intent', 'synthetic', false);
insert into auth.users (id, email) values (gen_random_uuid(), 'daisy-sys@laporan.local.invalid');
insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
select a.person_id, 'SYSTEM_ADMIN', (select id from public.org_nodes where institution_id = (select sekolah from pilih) and kind = 'INSTITUTION'), now() - interval '1 day', now() + interval '30 days'
  from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'daisy-sys@laporan.local.invalid';
select set_config('app.seed_intent', '', false);
-- recompute as that user
begin;
select set_config('request.jwt.claims', json_build_object('sub', u.id, 'role', 'authenticated', 'email', u.email)::text, true),
       set_config('request.jwt.claim.sub', u.id::text, true) from auth.users u where u.email = 'daisy-sys@laporan.local.invalid';
set local role authenticated;
select public.recompute_result((select sesi from pilih), 'Kunci jawaban satu soal diperbaiki');
commit;
select 'baru', r.mastery, r.recomputation_reason, r.per_domain is distinct from (select per_domain from public.assessment_results where id = (select hasil from pilih)) as per_domain_berubah
  from public.assessment_results r where r.supersedes_result_id = (select hasil from pilih);
select 'audit', action from public.audit_log where target_id = (select sesi::text from pilih) or summary::text like '%' || (select sesi::text from pilih) || '%' order by created_at desc limit 3;

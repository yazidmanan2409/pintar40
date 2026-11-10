-- LOCAL ONLY, synthetic. One real recalculation in the report world (audit/fixtures/laporan-lokal.mjs), for the
-- screen-reader sessions (SCREEN-READER-SCRIPT.md S9) and the reviewers: a corrected answer key, then PINTAR's own
-- audited recompute_result run as a platform SYSTEM_ADMIN, as selftest F36-D14 does. Adapted from Daisy's staging
-- (ux-1/daisy-experience, verifikasi-e8a5efb9/alat/vD14.sql) with the \gset fix.
--
-- Run on the local stack after the fixture, once per mode:
--   psql "$SUPABASE_DB_URL" -v mode=POST_TEST -f audit/fixtures/laporan-hitung-ulang.sql   (the chapter result)
--   psql "$SUPABASE_DB_URL" -v mode=PRE_TEST  -f audit/fixtures/laporan-hitung-ulang.sql   (the reading map)
-- It picks the weakest 5B learner's sitting of that mode that was never recalculated, corrects the key of one item
-- that learner answered wrong, and recalculates. It prints the learner's email (the password is in the fixture's OUT
-- file), the sealed and the new mastery. Refuses to run anywhere but this machine's database.
\set ON_ERROR_STOP on
\if :{?mode}
\else
  \echo 'set the mode: -v mode=POST_TEST or -v mode=PRE_TEST'
  \quit
\endif
do $$ begin
  if inet_server_addr() is not null and host(inet_server_addr()) not in ('127.0.0.1', '::1', '172.17.0.1')
     and host(inet_server_addr()) !~ '^(172\.|10\.|192\.168\.)' then
    raise exception 'local stack only';
  end if;
end $$;

create temp table pilih as
select r.id as hasil, r.session_id as sesi, r.person_id as orang, r.mastery, r.institution_id as sekolah, u.email
  from public.assessment_results r join public.official_sessions s on s.id = r.session_id
  join public.accounts a on a.person_id = r.person_id join auth.users u on u.id = a.auth_user_id
 where u.email like 'lap-5b-%' and s.mode = :'mode'::public.assessment_mode and r.supersedes_result_id is null
   and not exists (select 1 from public.assessment_results q where q.supersedes_result_id = r.id)
 order by r.mastery asc, r.computed_at desc limit 1;

create temp table koreksi as
select pi.item_id, o.id as dipilih, k.id as kunci_lama
  from pilih p join public.responses resp on resp.session_id = p.sesi and resp.is_final
  join public.presented_items pi on pi.id = resp.presented_item_id
  join public.item_options o on o.item_id = pi.item_id and o.label = (resp.value->>'pilihan')
  join public.item_options k on k.item_id = pi.item_id and k.is_correct
 where not o.is_correct limit 1;

-- the corrected key (a content edit; immutability triggers off for this one fixture write)
set session_replication_role = replica;
update public.item_options set is_correct = false where id = (select kunci_lama from koreksi);
update public.item_options set is_correct = true  where id = (select dipilih from koreksi);
set session_replication_role = origin;

-- a platform SYSTEM_ADMIN, as selftest.f11_user makes one (once)
select set_config('app.seed_intent', 'synthetic', false);
insert into auth.users (id, email)
select gen_random_uuid(), 'penguji-sys@laporan.local.invalid'
 where not exists (select 1 from auth.users where email = 'penguji-sys@laporan.local.invalid');
insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
select a.person_id, 'SYSTEM_ADMIN', (select id from public.org_nodes where institution_id = (select sekolah from pilih) and kind = 'INSTITUTION'),
       now() - interval '1 day', now() + interval '30 days'
  from public.accounts a join auth.users u on u.id = a.auth_user_id
 where u.email = 'penguji-sys@laporan.local.invalid'
   and not exists (select 1 from public.role_assignments ra where ra.person_id = a.person_id and ra.role = 'SYSTEM_ADMIN');
select set_config('app.seed_intent', '', false);

-- recalculate as that user (the role cannot read this session's temp tables, so the sitting is passed in)
select sesi from pilih \gset
begin;
select set_config('request.jwt.claims', json_build_object('sub', u.id, 'role', 'authenticated', 'email', u.email)::text, true),
       set_config('request.jwt.claim.sub', u.id::text, true) from auth.users u where u.email = 'penguji-sys@laporan.local.invalid';
set local role authenticated;
select public.recompute_result(:'sesi', 'Kunci jawaban satu soal diperbaiki');
commit;

select 'learner', p.email, 'sealed', p.mastery, 'recalculated', r.mastery
  from pilih p join public.assessment_results r on r.supersedes_result_id = p.hasil;

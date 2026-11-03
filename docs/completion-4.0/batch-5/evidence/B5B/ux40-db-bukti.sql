-- UX-40 proof, inside one transaction that is rolled back: a learner's unseen result is new, seeing it clears it,
-- and nobody else's session can be marked or read.
begin;
create temp table bukti (k text, v text);
grant all on bukti to authenticated;
do $$
declare v_s uuid; v_la uuid; v_p uuid; v_u uuid; v_lain uuid;
begin
  select s.id, s.learning_assignment_id, s.person_id into v_s, v_la, v_p
    from public.assessment_sessions s where s.mode = 'POST_TEST' and s.status = 'FINALIZED' limit 1;
  select a.auth_user_id into v_u from public.accounts a where a.person_id = v_p limit 1;
  select s.id into v_lain from public.assessment_sessions s where s.person_id <> v_p limit 1;
  delete from public.result_views where session_id = v_s;   -- as if just finished
  insert into bukti values ('s', v_s::text), ('la', v_la::text), ('u', v_u::text), ('lain', coalesce(v_lain::text, ''));
end $$;
select set_config('request.jwt.claims', json_build_object('sub', (select v from bukti where k = 'u'), 'role', 'authenticated')::text, true);
set local role authenticated;
insert into bukti select 'baru_sebelum', count(*)::text from public.my_new_results() r where r.learning_assignment_id::text = (select v from bukti where k = 'la');
insert into bukti select 'catat_lain', public.note_result_seen((select nullif(v, '')::uuid from bukti where k = 'lain'))::text;
insert into bukti select 'catat', public.note_result_seen((select v::uuid from bukti where k = 's'))::text;
insert into bukti select 'catat_lagi', public.note_result_seen((select v::uuid from bukti where k = 's'))::text;
insert into bukti select 'baru_sesudah', count(*)::text from public.my_new_results() r where r.learning_assignment_id::text = (select v from bukti where k = 'la');
do $$ begin
  begin perform 1 from public.result_views limit 1; insert into bukti values ('baca_tabel', 'boleh');
  exception when insufficient_privilege then insert into bukti values ('baca_tabel', 'ditolak'); end;
end $$;
reset role;
select k, v from bukti where k not in ('s', 'la', 'u', 'lain') order by k;
rollback;

-- Run as School A's administrator (role authenticated, JWT sub = their auth user), inside a transaction that is ROLLED BACK.
-- Probe 1: what «Masukkan ke kelas» (tempatkan_murid) would do for the learner already transferred OUT to School B.
begin;
select set_config('request.jwt.claims', '{"sub":"8fe5d101-96b1-4865-86fa-6722db82ef48","role":"authenticated"}', true);
set local role authenticated;
select public.tempatkan_murid('15c8b8e6-e833-48c3-8437-ba8bce59ce3f', '2d985509-ebb5-4887-9242-4358adc5da99') as new_membership;
reset role;
select p.display_name, i.slug, e.status, e.end_reason from enrollments e join persons p on p.id=e.person_id join institutions i on i.id=e.institution_id where p.id='15c8b8e6-e833-48c3-8437-ba8bce59ce3f' order by e.created_at;
rollback;
-- Probe 2: can the administrator's session end an enrolment as WITHDRAWN by a raw table update (what PostgREST PATCH /enrollments would do)?
begin;
select set_config('request.jwt.claims', '{"sub":"8fe5d101-96b1-4865-86fa-6722db82ef48","role":"authenticated"}', true);
set local role authenticated;
update public.enrollments e set status='ENDED', end_reason='WITHDRAWN', valid_to=now()
 from public.persons p where p.id=e.person_id and p.display_name='Murid Demo Tujuh' returning e.id, e.status, e.end_reason;
select count(*) as tujuh_open_memberships_after_update from memberships m join enrollments e on e.id=m.enrollment_id join persons p on p.id=e.person_id where p.display_name='Murid Demo Tujuh' and m.valid_to is null;
rollback;
select 'after rollback' as note, e.status, e.end_reason from enrollments e join persons p on p.id=e.person_id where p.display_name in ('Murid Demo Tujuh') ;

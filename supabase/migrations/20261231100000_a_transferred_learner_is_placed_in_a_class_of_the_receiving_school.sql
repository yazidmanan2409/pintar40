-- W2.15 / J3.10 (cross-batch integration, 6 Nov): A TRANSFERRED LEARNER IS PLACED IN A CLASS OF THE RECEIVING SCHOOL.
--
-- The defect. transfer_execute (20261219100000) opened the learner's enrolment at the receiving school and closed
-- the sending school's placement, but opened NO placement (membership) at the receiving school. Everything a learner
-- and a school read after that reads placements, not enrolments: the learner's own pages (src/lib/pembelajaran.ts),
-- a Kelas's roster and «Pindah kelas» (src/lib/pindah-kelas.ts; move_learner_to_class needs a placement to move
-- FROM), the teacher's class and the class reports. So a transferred learner stood enrolled in no class, with no
-- screen able to place them: re-intake is refused for a person who already holds an identity, and «Pindah kelas» has
-- nothing to move. Each feature passed its own tests; the hand-off between them was never walked.
--
-- The correction, at the source:
--   (1) transfers.to_node_id: the Kelas or Tingkat of the receiving school the learner is placed in.
--   (2) transfer_terima(transfer, period, programme, place): the receiving school, accepting, also names the place:
--       an ACTIVE Kelas (CLASS) or Tingkat (COHORT) of ITS OWN school whose year is the accepted year (a place that
--       carries no year of its own takes the accepted one, as the intake does, M5a). Without one, or with another's:
--       PR040 PLACE_INVALID. The refusal order is unchanged before it (not found, 42501, not open, period, programme).
--   (3) transfer_execute: 20261219100000's body, plus the placement: when the transfer names a place, a membership in
--       it opens on the new enrolment, in the accepted year, in the same transaction. The platform admin's older path
--       (transfer_request / transfer_authorize) names no place and behaves as before.
-- Held by F24-P01 (selftest/db/fable24.sql): after execution the learner has exactly one open placement, in the
-- chosen Kelas of the receiving school; and a place of the sending school is refused.

alter table public.transfers add column if not exists to_node_id uuid references public.org_nodes(id);

drop function if exists public.transfer_terima(uuid, uuid, uuid);
create function public.transfer_terima(p_transfer uuid, p_to_period uuid, p_to_programme uuid default null,
                                       p_to_place uuid default null)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.transfers;
begin
  select * into t from public.transfers where id = p_transfer for update;
  if t.id is null then
    raise exception using errcode = 'PR040', detail = 'TRANSFER_NOT_FOUND', message = 'no such transfer';
  end if;
  if not public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) then
    raise exception using errcode = '42501', message = 'a transfer in requires CAN_AUTHORIZE_TRANSFER at the receiving school';
  end if;
  if t.status <> 'REQUESTED' or t.requested_by_institution is distinct from t.from_institution_id then
    raise exception using errcode = 'PR040', detail = 'TRANSFER_NOT_OPEN', message = 'this transfer is not waiting for the receiving school';
  end if;
  if p_to_period is null or not exists (select 1 from public.academic_periods ap where ap.id = p_to_period and ap.institution_id = t.to_institution_id) then
    raise exception using errcode = 'PR040', detail = 'PERIOD_INVALID', message = 'choose one of this school''s school years';
  end if;
  if p_to_programme is not null and not exists (select 1 from public.org_nodes n where n.id = p_to_programme
                                                    and n.institution_id = t.to_institution_id and n.kind = 'PROGRAMME' and n.is_active) then
    raise exception using errcode = 'PR040', detail = 'PROGRAMME_INVALID', message = 'choose one of this school''s programmes';
  end if;
  if p_to_place is null or not exists (select 1 from public.org_nodes n where n.id = p_to_place
                                          and n.institution_id = t.to_institution_id and n.kind in ('CLASS', 'COHORT') and n.is_active
                                          and coalesce(n.academic_period_id, p_to_period) = p_to_period) then
    raise exception using errcode = 'PR040', detail = 'PLACE_INVALID',
      message = 'choose one of this school''s Kelas or Tingkat in that school year';
  end if;
  update public.transfers
     set status = 'AUTHORIZED', to_academic_period_id = p_to_period, to_programme_id = p_to_programme, to_node_id = p_to_place,
         authorized_by = public.current_person_id(), authorized_by_institution = t.to_institution_id
   where id = p_transfer;
end $$;
revoke all on function public.transfer_terima(uuid, uuid, uuid, uuid) from public, anon, service_role;
grant execute on function public.transfer_terima(uuid, uuid, uuid, uuid) to authenticated;

update public.client_rpc_registry
   set note = 'W2.15: the receiving school accepts a request into one of its own school years (and programmes) and names '
           || 'the Kelas or Tingkat the learner is placed in; both sides recorded; audited by transfers_audit.'
 where function_name = 'transfer_terima';

create or replace function public.transfer_execute(p_transfer uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare t record; v_new uuid;
begin
  select * into t from public.transfers where id = p_transfer for update;
  if t.id is null then raise exception 'transfer not found'; end if;
  if t.status <> 'AUTHORIZED' then raise exception 'transfer is not AUTHORIZED'; end if;
  if not (public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) or public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.from_institution_id)) then
    raise exception 'not authorized to execute';
  end if;
  if t.to_academic_period_id is null then
    raise exception using errcode = 'PR040', detail = 'TRANSFER_PERIOD_MISSING',
      message = 'the receiving school has not chosen the school year';
  end if;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (t.person_id, t.to_institution_id, t.to_academic_period_id, t.to_programme_id, 'ACTIVE') returning id into v_new;
  update public.memberships set valid_to = now(), close_reason = 'ENROLLMENT_ENDED'
   where enrollment_id = t.from_enrollment_id and valid_to is null;
  update public.enrollments set status = 'ENDED', end_reason = 'TRANSFERRED_OUT', valid_to = now()
   where id = t.from_enrollment_id;
  -- the placement at the receiving school, in the place it named on accepting
  if t.to_node_id is not null then
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_new, t.to_node_id, t.to_academic_period_id);
  end if;
  insert into public.portable_visibility (person_id, institution_id, transfer_id)
  values (t.person_id, t.to_institution_id, t.id)
  on conflict (person_id, institution_id) do update set transfer_id = excluded.transfer_id, granted_at = now();
  update public.transfers set status = 'EXECUTED', to_enrollment_id = v_new, executed_at = now() where id = p_transfer;
  return v_new;
end $$;
revoke all on function public.transfer_execute(uuid) from public, anon;
grant execute on function public.transfer_execute(uuid) to authenticated;

do $$
begin
  if has_function_privilege('anon', 'public.transfer_terima(uuid,uuid,uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.transfer_terima(uuid,uuid,uuid,uuid)', 'execute') then
    raise exception 'transfer_terima is reached by the wrong roles';
  end if;
  if pg_get_functiondef('public.transfer_execute(uuid)'::regprocedure) !~ 'insert into public\.memberships' then
    raise exception 'transfer_execute does not place the learner';
  end if;
end $$;

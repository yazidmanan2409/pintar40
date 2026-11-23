-- ---------------------------------------------------------------------------------------------------------------
-- Z · V5 (R-24, PETE-22; Sharon VERIFY-58-feb1317b.md): A TRANSFER WHOSE SOURCE ENROLMENT HAS CLOSED IS REFUSED BY
-- NAME. An AUTHORIZED transfer across a rollover (or after the learner left) failed in transfer_execute with
-- enrollments_guard's raw «a closed enrollment is immutable», after the new enrolment had been inserted and rolled back.
-- It failed closed, but a raw database error must not reach an administrator. Red first: Z-V5-01.
--
--   * transfer_execute checks the source enrolment first: not PENDING or ACTIVE, it raises PR040 with DETAIL
--     TRANSFER_SOURCE_CLOSED before anything is written; the transfer stays AUTHORIZED and nothing changes.
--     Restated in full from its live definition; grant unchanged. The words are the app's (galat.transfer_source_closed).
--   * Consent (OD-9) and the rollover items are not here: the owner's and 4.5 (Sharon).
-- ---------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.transfer_execute(p_transfer uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  -- Z V5 (R-24; Sharon, VERIFY-58): an AUTHORIZED transfer whose source enrolment has since closed (a rollover ended it,
  -- or the learner left) is refused by name before anything is written, never by enrollments_guard's raw «a closed
  -- enrollment is immutable». The transfer stays AUTHORIZED, unchanged; a new one is asked from the current enrolment.
  if not exists (select 1 from public.enrollments e where e.id = t.from_enrollment_id and e.status in ('PENDING', 'ACTIVE')) then
    raise exception using errcode = 'PR040', detail = 'TRANSFER_SOURCE_CLOSED',
      message = 'the learner''s enrolment at the sending school has closed since the transfer was authorised';
  end if;
  -- Sharon (2ce4ddcf): a learner already enrolled at the receiving school that year is refused by name, never by a raw
  -- unique_violation; nothing is written
  begin
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (t.person_id, t.to_institution_id, t.to_academic_period_id, t.to_programme_id, 'ACTIVE') returning id into v_new;
  exception when unique_violation then
    raise exception using errcode = 'PR040', detail = 'TRANSFER_ALREADY_ENROLLED',
      message = 'the learner is already enrolled at the receiving school in that year';
  end;
  update public.memberships set valid_to = now(), close_reason = 'ENROLLMENT_ENDED'
   where enrollment_id = t.from_enrollment_id and valid_to is null;
  update public.enrollments set status = 'ENDED', end_reason = 'TRANSFERRED_OUT', valid_to = now()
   where id = t.from_enrollment_id;
  -- the learner's open sittings at the source school end with the enrolment (Sharon, 435a2856)
  perform public.tutup_asesmen_terbuka(t.from_enrollment_id, 'Pindah sekolah');
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
end;
$function$;

do $$
begin
  if position('TRANSFER_SOURCE_CLOSED' in pg_get_functiondef('public.transfer_execute(uuid)'::regprocedure)) = 0 then
    raise exception 'Z V5: transfer_execute does not refuse a closed source enrolment by name';
  end if;
end $$;

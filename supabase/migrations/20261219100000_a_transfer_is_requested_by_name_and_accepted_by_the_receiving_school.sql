-- W2.15 (Batch 4, D-152(c); F-10, CR-41, OP-4, RV-18, J3.10): A TRANSFER IS ADDRESSED TO A SCHOOL FOUND BY ITS NAME OR
-- CODE, AND THE RECEIVING SCHOOL ACCEPTS IT INTO ITS OWN SCHOOL YEAR.
--
-- A school admin cannot read other schools (RLS), so the transfer form offered only the schools, school years and
-- programmes the reader could already see: their own. A transfer out of a school was therefore a platform admin's
-- task. F-10 (owner, 3 Nov, D-152(c)): «a minimal directory: a school admin may search active schools by exact name or
-- code (name and code only), audited; the receiving school authorises».
--   (1) cari_sekolah_tujuan(words): for a reader who may authorise transfers somewhere (CAN_AUTHORIZE_TRANSFER) or the
--       platform admin: the ACTIVE schools whose name is exactly those words (case and outer spaces aside) or whose code
--       (the PINTAR ID prefix, institutions.namespace) is exactly them. Name and code only; nothing else of the school
--       is read. Every search is audited (directory.school_searched: what was asked and how many matched), so the
--       directory cannot be walked unseen. Fewer than 3 characters is refused (QUERY_TOO_SHORT).
--   (2) transfer_minta(enrolment, school, reason): the SENDING school asks (CAN_AUTHORIZE_TRANSFER where the learner is
--       enrolled), with a reason, for an active school other than its own. The school year and programme are the
--       receiving school's to choose, so they are left empty here (to_academic_period_id becomes nullable; a check
--       keeps every EXECUTED transfer's period set). Audited, as every transfer is, by transfers_audit (both schools).
--   (3) pindah_masuk(school): the receiving school's incoming requests, for its CAN_AUTHORIZE_TRANSFER holders: the
--       request, the learner's NAME and the sending school's name and code; and those it accepted but has not yet
--       executed (keadaan AUTHORIZED), so the school executes a transfer it can name. The learner's other data stays unreadable
--       until the transfer is executed (portable_visibility, unchanged).
--   (4) transfer_terima(transfer, period, programme): the RECEIVING school accepts a request made by the sending
--       school into one of ITS OWN school years (and, optionally, one of its programmes): status AUTHORIZED, both sides
--       recorded, audited by transfers_audit (transfer.authorized, both schools). The counterpart rule is transfer_authorize's: the side that asked does
--       not accept.
--   (5) transfer_execute is 20260912004527's text with one refusal added: a transfer with no school year is not
--       executed (TRANSFER_PERIOD_MISSING).
-- transfer_request, transfer_authorize and transfer_reject are unchanged (the platform admin's path and the learner's).
--
-- METRIC CATALOGUE AND ENGINE: unchanged.

alter table public.transfers alter column to_academic_period_id drop not null;
alter table public.transfers add constraint transfers_executed_has_period
  check (status <> 'EXECUTED' or to_academic_period_id is not null);

-- ═══════════════════════════════════════════════════════════════ (1) the directory
create function public.cari_sekolah_tujuan(p_kata text)
returns table (institution_id uuid, nama text, kode text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_kata text := btrim(coalesce(p_kata, '')); v_inst uuid; v_n int;
begin
  if public.current_person_id() is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  select i.id into v_inst from public.institutions i
   where public.can_on_node('CAN_AUTHORIZE_TRANSFER', i.id) order by i.name limit 1;
  if v_inst is null and not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'the school directory is for those who may authorise transfers';
  end if;
  if char_length(v_kata) < 3 or char_length(v_kata) > 120 then
    raise exception using errcode = 'PR040', detail = 'QUERY_TOO_SHORT', message = 'a school is found by its exact name or code (3 to 120 characters)';
  end if;
  return query
    select i.id, i.name, i.namespace from public.institutions i
     where i.is_active
       and (lower(btrim(i.name)) = lower(v_kata) or (i.namespace is not null and upper(i.namespace) = upper(v_kata)))
     order by i.name
     limit 10;
  get diagnostics v_n = row_count;
  perform public.audit_write('directory.school_searched', 'institutions', null, v_inst,
    jsonb_build_object('query', v_kata, 'found', v_n));
end $$;
revoke all on function public.cari_sekolah_tujuan(text) from public, anon, service_role;
grant execute on function public.cari_sekolah_tujuan(text) to authenticated;

-- ═══════════════════════════════════════════════════════════════ (2) the sending school asks
create function public.transfer_minta(p_from_enrollment uuid, p_to_institution uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare e public.enrollments; v_id uuid; v_alasan text := btrim(coalesce(p_reason, ''));
begin
  select * into e from public.enrollments where id = p_from_enrollment;
  if e.id is null or e.status <> 'ACTIVE' then
    raise exception using errcode = 'PR040', detail = 'ENROLLMENT_NOT_ACTIVE', message = 'the learner is not enrolled here now';
  end if;
  if not public.can_on_node('CAN_AUTHORIZE_TRANSFER', e.institution_id) then
    raise exception using errcode = '42501', message = 'a transfer out is asked by the sending school';
  end if;
  if p_to_institution is null or p_to_institution = e.institution_id
     or not exists (select 1 from public.institutions i where i.id = p_to_institution and i.is_active) then
    raise exception using errcode = 'PR040', detail = 'DESTINATION_INVALID', message = 'choose another, active school';
  end if;
  if char_length(v_alasan) not between 3 and 500 then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a transfer says why (3 to 500 characters)';
  end if;
  if exists (select 1 from public.transfers t where t.from_enrollment_id = e.id and t.status in ('REQUESTED', 'AUTHORIZED')) then
    raise exception using errcode = 'PR040', detail = 'TRANSFER_OPEN', message = 'this learner already has an open transfer';
  end if;
  insert into public.transfers (person_id, from_enrollment_id, from_institution_id, to_institution_id,
                                to_academic_period_id, to_programme_id, requested_by, requested_by_institution, reason, consent)
  values (e.person_id, e.id, e.institution_id, p_to_institution, null, null, public.current_person_id(), e.institution_id,
          v_alasan, '{}'::jsonb)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.transfer_minta(uuid, uuid, text) from public, anon, service_role;
grant execute on function public.transfer_minta(uuid, uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════ (3) what the receiving school sees
create function public.pindah_masuk(p_sekolah uuid default null)
returns table (transfer_id uuid, nama_murid text, dari_sekolah text, dari_kode text, alasan text, diminta_pada timestamptz,
               ke_sekolah uuid, keadaan text)
language sql stable security definer set search_path = public, pg_temp as $$
  select t.id, p.display_name, i.name, i.namespace, t.reason, t.created_at, t.to_institution_id, t.status::text
    from public.transfers t
    join public.persons p on p.id = t.person_id
    join public.institutions i on i.id = t.from_institution_id
   -- REQUESTED to accept; AUTHORIZED (accepted, not yet executed) so the school executes a transfer it can name
   where t.status in ('REQUESTED', 'AUTHORIZED')
     and t.requested_by_institution = t.from_institution_id
     and public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id)
     and (p_sekolah is null or t.to_institution_id = p_sekolah)
   order by t.created_at, t.id
   limit 200
$$;
revoke all on function public.pindah_masuk(uuid) from public, anon, service_role;
grant execute on function public.pindah_masuk(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════ (4) the receiving school accepts
create function public.transfer_terima(p_transfer uuid, p_to_period uuid, p_to_programme uuid default null)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.transfers;
begin
  select * into t from public.transfers where id = p_transfer for update;
  if t.id is null then
    raise exception using errcode = 'PR040', detail = 'TRANSFER_NOT_FOUND', message = 'no such transfer';
  end if;
  if not public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) then
    raise exception using errcode = '42501', message = 'a transfer in is accepted by the receiving school';
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
  update public.transfers
     set status = 'AUTHORIZED', to_academic_period_id = p_to_period, to_programme_id = p_to_programme,
         authorized_by = public.current_person_id(), authorized_by_institution = t.to_institution_id
   where id = p_transfer;
end $$;
revoke all on function public.transfer_terima(uuid, uuid, uuid) from public, anon, service_role;
grant execute on function public.transfer_terima(uuid, uuid, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════ (5) execution needs the school year
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
  insert into public.portable_visibility (person_id, institution_id, transfer_id)
  values (t.person_id, t.to_institution_id, t.id)
  on conflict (person_id, institution_id) do update set transfer_id = excluded.transfer_id, granted_at = now();
  update public.transfers set status = 'EXECUTED', to_enrollment_id = v_new, executed_at = now() where id = p_transfer;
  return v_new;
end $$;
-- ADR-0021: a function's EXECUTE is PUBLIC's by default, so its grants are restated where it is created
revoke all on function public.transfer_execute(uuid) from public, anon;
grant execute on function public.transfer_execute(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('cari_sekolah_tujuan', 'STAFF', 'W2.15 (F-10, D-152(c)): an active school found by its exact name or code, name and code only, '
   || 'for those who may authorise transfers; every search audited (directory.school_searched).', 'CAPABILITY', 'CAN_AUTHORIZE_TRANSFER'),
  ('transfer_minta', 'STAFF', 'W2.15: the sending school asks for a transfer to another active school, with a reason; the '
   || 'receiving school chooses the school year; audited by transfers_audit.', 'CAPABILITY', 'CAN_AUTHORIZE_TRANSFER'),
  ('pindah_masuk', 'STAFF', 'W2.15: the receiving school''s incoming requests: the learner''s name, the sending school''s name '
   || 'and code, the reason; nothing else of the learner before execution.', 'CAPABILITY', 'CAN_AUTHORIZE_TRANSFER'),
  ('transfer_terima', 'STAFF', 'W2.15: the receiving school accepts a request into one of its own school years (and '
   || 'programmes); both sides recorded; audited by transfers_audit.', 'CAPABILITY', 'CAN_AUTHORIZE_TRANSFER');

do $$
declare f text;
begin
  foreach f in array array['cari_sekolah_tujuan(text)', 'transfer_minta(uuid,uuid,text)', 'pindah_masuk(uuid)',
                           'transfer_terima(uuid,uuid,uuid)'] loop
    if has_function_privilege('anon', 'public.' || f, 'execute')
       or not has_function_privilege('authenticated', 'public.' || f, 'execute') then
      raise exception '% is reached by the wrong roles', f;
    end if;
  end loop;
end $$;

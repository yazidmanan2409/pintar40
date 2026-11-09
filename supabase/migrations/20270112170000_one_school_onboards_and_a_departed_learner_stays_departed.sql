-- The lifecycle's remaining findings (Sharon's review of 2ce4ddcf; owner, 9 Nov). Red on f2c4b9f7: F37-S03, L04, T01, L05.
--
-- 1. SI-D03: onboarding belongs to ONE school, the one that issued the person's most recent registration number.
--    Before, a person numbered by X and then by Y, never enrolled or activated, was onboardable by both, so X could
--    still activate them or redirect the activation email. The newest row is not assumed authorised (owner, 9 Nov):
--    when two schools' latest numbers share a timestamp, or the newest number's school is inactive, NO school onboards
--    (fail closed; the platform administrator still can). A new number and a school's credential act on one person are
--    serialised on the person's row (FOR UPDATE: no lock-table entry, so a 13,300-row import stays within its locks).
-- 2. Enrolment: two programmes of one school and year stay possible (the canonical model), but a live enrolment with
--    no programme never sits beside another live one of the same person, school and year (the index alone let a
--    programme-less one coexist with a programme one).
-- 3. transfer_execute: a learner already enrolled at the receiving school that year is refused PR040
--    TRANSFER_ALREADY_ENROLLED, not by a raw unique_violation.
-- 4. A departed learner (demonstration finding 8): murid_tanpa_kelas no longer offers, and tempatkan_murid refuses,
--    a learner who left this school (PLACE_DEPARTED) or is enrolled at another (PLACE_ELSEWHERE). A return is a
--    re-enrolment, never the ordinary placement.

-- 1.
create or replace function public.sekolah_memegang(p_person uuid, p_institution uuid)
returns boolean language plpgsql volatile security definer set search_path = public, pg_temp as $$
begin
  if p_person is null or p_institution is null then return false; end if;
  -- the lock serialises an ACT on the person; a read-only lookup (the recovery page's, PostgREST's read transaction)
  -- acts on nothing and may not lock (D101-A02)
  if current_setting('transaction_read_only') = 'off' then
    perform 1 from public.persons where persons.id = p_person for update;
  end if;
  return
    exists (select 1 from public.role_assignments ra
             where ra.person_id = p_person and ra.institution_id = p_institution and ra.role <> 'SYSTEM_ADMIN'
               and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)
    or exists (select 1 from public.enrollments e
                where e.person_id = p_person and e.institution_id = p_institution and e.status in ('PENDING', 'ACTIVE'))
    or (
      -- onboarding: this school's number is the person's single most recent one, issued by an active school; a tie at
      -- the newest time, or an inactive issuer, gives onboarding to nobody
      exists (select 1 from public.institutional_identities mine join public.institutions i on i.id = mine.institution_id
               where mine.person_id = p_person and mine.institution_id = p_institution and i.is_active
                 and not exists (select 1 from public.institutional_identities other
                                  where other.person_id = p_person and other.institution_id <> p_institution
                                    and other.issued_at >= mine.issued_at))
      and not exists (select 1 from public.enrollments e
                       where e.person_id = p_person and e.institution_id = p_institution)
      and not exists (select 1 from public.accounts a
                       where a.person_id = p_person
                         and not exists (select 1 from public.account_setup st
                                          where st.account_id = a.id and st.state = 'REQUIRED'))
      and not exists (select 1 from public.role_assignments ra
                       where ra.person_id = p_person and ra.institution_id is distinct from p_institution
                         and ra.role <> 'SYSTEM_ADMIN' and ra.revoked_at is null
                         and now() >= ra.valid_from and now() < ra.valid_until)
      and not exists (select 1 from public.enrollments e
                       where e.person_id = p_person and e.institution_id <> p_institution
                         and e.status in ('PENDING', 'ACTIVE')));
end;
$$;
revoke all on function public.sekolah_memegang(uuid, uuid) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.issue_institutional_id(p_person uuid, p_institution uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_ns text; v_next integer; v_id text; v_existing text; v_suffix text;
begin
  -- Sharon (2ce4ddcf): the person's row serialises a new number against a school's credential act on them
  perform 1 from public.persons where persons.id = p_person for update;
  -- ALREADY HAS ONE -> THAT ONE. Not a second number and not an error: the
  -- pair already has an identity and this is what it is. This is the row-level
  -- idempotency the import path leans on.
  select ii.institutional_id into v_existing from public.institutional_identities ii
   where ii.person_id = p_person and ii.institution_id = p_institution;
  if v_existing is not null then return v_existing; end if;

  -- The row lock serialises allocation inside one school; the unique
  -- constraint on (institution_id, sequence_number) is what makes it true.
  select i.namespace into v_ns from public.institutions i
   where i.id = p_institution for update;
  if v_ns is null then
    raise exception 'this institution has reserved no namespace, so it can issue no institutional ID';
  end if;

  select coalesce(max(ii.sequence_number), 0) + 1 into v_next
    from public.institutional_identities ii where ii.institution_id = p_institution;
  if v_next > 999999 then
    raise exception 'this institution has issued all 999999 institutional person IDs available under %', v_ns;
  end if;

  -- Two uppercase alphanumerics carrying no meaning and no secret; the
  -- namespace and the number already make the ID unique, and
  -- institutional_identities_id_unique is the backstop that says so.
  v_suffix := (select string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                                        1 + floor(random() * 36)::int, 1), '')
                 from generate_series(1, 2));
  v_id := v_ns || lpad(v_next::text, 6, '0') || v_suffix;

  insert into public.institutional_identities
    (person_id, institution_id, institutional_id, sequence_number, issued_by_person_id)
  values (p_person, p_institution, v_id, v_next, public.current_person_id());
  return v_id;
end;
$function$;
revoke all on function public.issue_institutional_id(uuid, uuid) from public, anon, authenticated;
grant execute on function public.issue_institutional_id(uuid, uuid) to service_role;

-- 2.
create or replace function public.enrollments_programme_alone()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status not in ('PENDING', 'ACTIVE') then return new; end if;
  -- concurrent enrolments of one person serialise on the person's row (no lock-table entry per enrolment)
  perform 1 from public.persons where persons.id = new.person_id for update;
  if exists (select 1 from public.enrollments e
              where e.person_id = new.person_id and e.institution_id = new.institution_id
                and e.academic_period_id = new.academic_period_id and e.id <> new.id
                and e.status in ('PENDING', 'ACTIVE')
                and (new.programme_id is null or e.programme_id is null)) then
    raise exception using errcode = '23505',
      message = 'one live enrolment per person, school, year and programme: an enrolment with no programme stands alone';
  end if;
  return new;
end;
$$;
revoke all on function public.enrollments_programme_alone() from public, anon, authenticated;
create trigger enrollments_programme_alone before insert or update of status, programme_id on public.enrollments
  for each row execute function public.enrollments_programme_alone();

-- 3.
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
revoke all on function public.transfer_execute(uuid) from public, anon, authenticated;
grant execute on function public.transfer_execute(uuid) to authenticated, service_role;

-- 4.
create or replace function public.murid_sudah_keluar(p_person uuid, p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  -- an enrolment here has ended and none here is live
  select exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id = p_institution
                   and e.status = 'ENDED')
     and not exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id = p_institution
                       and e.status in ('PENDING', 'ACTIVE'))
$$;
revoke all on function public.murid_sudah_keluar(uuid, uuid) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tempatkan_murid(p_person uuid, p_kelas uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_k record; v_period uuid; v_enr uuid; v_m uuid;
begin
  if p_person is null or p_kelas is null then
    raise exception using errcode = '22023', detail = 'PLACE_INPUT_INCOMPLETE', message = 'a person and a Kelas are both required';
  end if;
  select n.id, n.kind, n.is_active, n.institution_id, n.academic_period_id, n.member_kind into v_k
    from public.org_nodes n where n.id = p_kelas;
  if v_k.id is null or not public.can_on_node('CAN_PROVISION_PEOPLE', p_kelas) then
    raise exception using errcode = '42501', message = 'placing a learner requires CAN_PROVISION_PEOPLE over the Kelas';
  end if;
  -- a professional-learning Kelas holds participants, never learners (D-069)
  if v_k.kind <> 'CLASS' or not v_k.is_active or coalesce(v_k.member_kind::text, 'LEARNER') <> 'LEARNER' then
    raise exception using errcode = 'PR070', detail = 'PLACE_NOT_A_KELAS', message = 'a learner is placed in an active Kelas';
  end if;
  if not exists (select 1 from public.institutional_identities ii
                  where ii.person_id = p_person and ii.institution_id = v_k.institution_id) then
    raise exception using errcode = 'PR070', detail = 'PLACE_NOT_THIS_SCHOOL', message = 'this person is not recorded at this school';
  end if;
  if public.memegang_peran_staf(p_person) then
    raise exception using errcode = 'PR070', detail = 'PLACE_STAFF', message = 'a person holding a staff role is not placed as a learner';
  end if;
  -- the lifecycle (owner, 9 Nov; demonstration finding 8): a learner enrolled at another school joins this one only by
  -- a transfer, and one who left this school is not placed back from here
  if exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id <> v_k.institution_id
               and e.status in ('PENDING', 'ACTIVE')) then
    raise exception using errcode = 'PR070', detail = 'PLACE_ELSEWHERE', message = 'this learner is enrolled at another school';
  end if;
  if public.murid_sudah_keluar(p_person, v_k.institution_id) then
    raise exception using errcode = 'PR070', detail = 'PLACE_DEPARTED', message = 'this learner is no longer enrolled at this school';
  end if;
  if exists (select 1 from public.enrollments e
               join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
              where e.person_id = p_person and e.institution_id = v_k.institution_id
                and e.status in ('PENDING', 'ACTIVE') and e.valid_to is null) then
    raise exception using errcode = 'PR070', detail = 'PLACE_ALREADY_PLACED', message = 'this learner already has a place; Pindah moves them';
  end if;

  -- the Kelas's own year, as import_advance reads it
  v_period := coalesce(v_k.academic_period_id,
                       (select ap.id from public.academic_periods ap
                         where ap.institution_id = v_k.institution_id order by ap.created_at desc limit 1));
  if v_period is null then
    raise exception using errcode = 'PR070', detail = 'PLACE_NO_YEAR', message = 'the school has no academic year for this Kelas';
  end if;

  select e.id into v_enr from public.enrollments e
   where e.person_id = p_person and e.institution_id = v_k.institution_id and e.academic_period_id = v_period
     and e.status in ('PENDING', 'ACTIVE') and e.valid_to is null
   order by e.created_at limit 1;
  if v_enr is null then
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (p_person, v_k.institution_id, v_period, 'PENDING') returning id into v_enr;
  end if;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (v_enr, p_kelas, v_period) returning id into v_m;

  perform public.audit_write('LEARNER_PLACED', 'memberships', v_m::text, v_k.institution_id,
                             jsonb_build_object('person_id', p_person, 'node_id', p_kelas, 'enrollment_id', v_enr));
  return v_m;
end;
$function$;
revoke all on function public.tempatkan_murid(uuid, uuid) from public, anon, authenticated;
grant execute on function public.tempatkan_murid(uuid, uuid) to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.murid_tanpa_kelas(p_sekolah uuid)
 RETURNS TABLE(person_id uuid, display_name text, institutional_id text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select p.id, p.display_name, ii.institutional_id
    from public.institutional_identities ii
    join public.persons p on p.id = ii.person_id
   where ii.institution_id = p_sekolah
     and public.menunggu_akun_boleh(p_sekolah)
     and not public.memegang_peran_staf(p.id)
     -- the lifecycle: neither a learner who left this school nor one enrolled elsewhere is offered here
     and not public.murid_sudah_keluar(p.id, p_sekolah)
     and not exists (select 1 from public.enrollments x where x.person_id = p.id and x.institution_id <> p_sekolah
                       and x.status in ('PENDING', 'ACTIVE'))
     and not exists (
       select 1 from public.enrollments e
         join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
        where e.person_id = p.id and e.institution_id = p_sekolah
          and e.status in ('PENDING', 'ACTIVE') and e.valid_to is null)
   order by p.display_name, p.id
   limit 200
$function$;
revoke all on function public.murid_tanpa_kelas(uuid) from public, anon, authenticated;
grant execute on function public.murid_tanpa_kelas(uuid) to authenticated, service_role;

-- verification
do $$
begin
  if position('other.issued_at >= mine.issued_at' in (select prosrc from pg_proc where oid = 'public.sekolah_memegang(uuid, uuid)'::regprocedure)) = 0 then
    raise exception 'lifecycle: onboarding is not decided by the most recent registration number';
  end if;
  if position('from public.persons where persons.id = p_person for update' in (select prosrc from pg_proc where oid = 'public.issue_institutional_id(uuid, uuid)'::regprocedure)) = 0 then
    raise exception 'lifecycle: issuing a number is not serialised against a school''s credential act';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'enrollments_programme_alone' and tgrelid = 'public.enrollments'::regclass) then
    raise exception 'lifecycle: a programme-less live enrolment can sit beside another';
  end if;
  if position('TRANSFER_ALREADY_ENROLLED' in (select prosrc from pg_proc where oid = 'public.transfer_execute(uuid)'::regprocedure)) = 0 then
    raise exception 'lifecycle: a repeated transfer is not refused by name';
  end if;
  if position('PLACE_DEPARTED' in (select prosrc from pg_proc where oid = 'public.tempatkan_murid(uuid, uuid)'::regprocedure)) = 0
     or position('murid_sudah_keluar' in (select prosrc from pg_proc where oid = 'public.murid_tanpa_kelas(uuid)'::regprocedure)) = 0 then
    raise exception 'lifecycle: a departed learner can be placed back by the old school';
  end if;
  if has_function_privilege('authenticated', 'public.sekolah_memegang(uuid, uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.murid_sudah_keluar(uuid, uuid)', 'execute') then
    raise exception 'lifecycle: an internal predicate is a client function';
  end if;
end $$;

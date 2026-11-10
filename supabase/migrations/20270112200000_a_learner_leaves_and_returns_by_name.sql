-- E3 «Akhiri pendaftaran» and E4 «Daftarkan kembali» (owner, 9 Nov: both essential; design in
-- ACCOUNT-LIFECYCLE-INVENTORY.md §12). Red on 68116785: F37-E01..E05.
--
-- No function ended an enrolment with a reason and a date, and none brought a learner back; clients no longer write
-- enrolments (20270112160000). Both are governed functions on the existing model, no new tables:
--
-- akhiri_pendaftaran(enrolment, reason, explanation, effective_date): the school's INSTITUTION_ADMIN ends one live
--   enrolment. Daisy's reasons map to the existing end_reason; OTHER needs an explanation of 10–300 characters. The
--   effective date is today or earlier, never before the enrolment began, and is recorded in the audit row; access ends
--   at recording (Sharon on 89374424). An open sitting refuses the ending (fail closed until Sharon rules). Its Kelas
--   placements close as ENROLLMENT_ENDED. Results, sittings, certificates and attribution are untouched.
-- daftarkan_kembali(person, school, kind, reason, kelas, enrolment): two kinds that never rewrite the past.
--   CORRECTION reopens an ending this function recorded, at this school, as the person's latest enrolment there: a new
--   live enrolment in the same year and programme, back in the same Kelas where it is still active; the audit links
--   it to the ending it corrects. RETURN is a learner who left this school coming back: a new enrolment in the chosen
--   Kelas's year, under the same person and the same registration number. A learner enrolled at another school comes
--   back only by a transfer (PLACE_ELSEWHERE). Every refusal is PR070 with its code in DETAIL, and writes nothing.

-- (9 Nov, the journeys' S27: a learner's abandoned sitting blocked a class's year end, and no screen can close another
-- person's sitting.) A departure closes the learner's open sittings truthfully instead of being refused by them: a
-- sitting past its deadline expires as it would on its next touch (session_enforce_deadline); one still open is ended
-- as INSTITUTIONAL_REVOCATION through terminate_session itself (its authority check, its audit row, responses kept).
-- For Sharon's ruling: this replaces the fail-closed ENROL_SITTING_OPEN she was asked about.
create or replace function public.tutup_asesmen_terbuka(p_enrollment uuid, p_alasan text)
returns integer language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare s record; v_n int := 0; v_kept int; v_actor uuid := public.current_person_id();
begin
  -- CORRECTED IN PLACE (undeployed; Sharon F3 on 7a2c1751): the sitting is ended under the departure's own authority
  -- (the school's INSTITUTION_ADMIN, checked by akhiri_pendaftaran before this runs), not through terminate_session,
  -- whose check is over the place the sitting was given in: a sitting with neither class nor Angkatan has no such
  -- place, and the departure failed with that check's raw error. The update and the audit row are terminate_session's.
  for s in select a.id, a.institution_id from public.assessment_sessions a
            where a.enrollment_id = p_enrollment and a.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
              -- CORRECTED IN PLACE (undeployed; the owner on Sharon's addendum, 10 Nov): only the school's own sittings
              -- of its own enrolment, never a sitting held elsewhere (a PD sitting of another place is not this school's)
              and a.institution_id = (select e.institution_id from public.enrollments e where e.id = p_enrollment)
            order by a.id for update loop
    if public.session_enforce_deadline(s.id) in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
      select count(*) into v_kept from public.responses r where r.session_id = s.id;
      update public.assessment_sessions
         set status = 'TERMINATED', termination_cause = 'INSTITUTIONAL_REVOCATION',
             termination_reason = p_alasan, terminated_by_person_id = v_actor
       where id = s.id;
      perform public.audit_write('assessment_session.terminated', 'assessment_sessions', s.id::text, s.institution_id,
        jsonb_build_object('session_id', s.id, 'cause', 'INSTITUTIONAL_REVOCATION', 'reason', p_alasan,
                           'actor', v_actor, 'responses_retained', v_kept, 'enrollment_id', p_enrollment));
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;
revoke all on function public.tutup_asesmen_terbuka(uuid, text) from public, anon, authenticated;

-- CORRECTED IN PLACE (undeployed; Sharon's re-verification at 435a2856, Low, older than the range). A transfer ended
-- the source enrolment and closed its placements but left the learner's open sittings open; it now contains them the
-- same way a departure does, through the guarded tutup_asesmen_terbuka (the source school's own sittings of that
-- enrolment only). Red first: F38-H08. Otherwise transfer_execute is its 20270112170000 definition, unchanged.
do $$
declare v_def text := pg_get_functiondef('public.transfer_execute(uuid)'::regprocedure);
        v_old text := $o$  update public.enrollments set status = 'ENDED', end_reason = 'TRANSFERRED_OUT', valid_to = now()
   where id = t.from_enrollment_id;$o$;
begin
  if position(v_old in v_def) = 0 then raise exception 'transfer_execute no longer ends the source enrolment where it did'; end if;
  execute replace(v_def, v_old, v_old || $n$
  -- the learner's open sittings at the source school end with the enrolment (Sharon, 435a2856)
  perform public.tutup_asesmen_terbuka(t.from_enrollment_id, 'Pindah sekolah');$n$);
end $$;
revoke all on function public.transfer_execute(uuid) from public, anon, authenticated;
grant execute on function public.transfer_execute(uuid) to authenticated, service_role;

create or replace function public.akhiri_pendaftaran(p_enrollment uuid, p_reason text, p_explanation text,
                                                     p_effective date)
returns uuid language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare en record; v_end public.enrollment_end_reason; v_hari date; v_date date; v_zona text;
        v_expl text := nullif(btrim(coalesce(p_explanation, '')), ''); v_closed int; v_sesi int;
begin
  select e.id, e.person_id, e.institution_id, e.status, e.valid_from into en
    from public.enrollments e where e.id = p_enrollment for update;
  if en.id is null or not public.has_scope('INSTITUTION_ADMIN', en.institution_id) then
    raise exception using errcode = '42501',
      message = 'ending an enrolment needs INSTITUTION_ADMIN of the school the learner is enrolled at';
  end if;
  if en.status not in ('PENDING', 'ACTIVE') then
    raise exception using errcode = 'PR070', detail = 'ENROL_NOT_LIVE', message = 'this enrolment has already ended';
  end if;
  -- CORRECTED IN PLACE (undeployed; Sharon F1): the school's own clock (20270112195000), not WIB for every school
  v_zona := public.zona_sekolah(en.institution_id);
  v_hari := (now() at time zone v_zona)::date;
  v_date := coalesce(p_effective, v_hari);
  v_end := case p_reason
             when 'GRADUATED' then 'COMPLETED'
             when 'TRANSFER_EXTERNAL' then 'TRANSFERRED_OUT'
             when 'MOVED_ABROAD' then 'TRANSFERRED_OUT'
             when 'WITHDRAWN' then 'WITHDRAWN'
             when 'DECEASED' then 'WITHDRAWN'
             when 'OTHER' then 'WITHDRAWN'
           end::public.enrollment_end_reason;
  if v_end is null then
    raise exception using errcode = 'PR070', detail = 'ENROL_REASON_INVALID', message = 'choose one of the listed reasons';
  end if;
  if (p_reason = 'OTHER' and (v_expl is null or char_length(v_expl) < 10)) or char_length(coalesce(v_expl, '')) > 300 then
    raise exception using errcode = 'PR070', detail = 'ENROL_EXPLANATION_REQUIRED',
      message = '«Lainnya» needs an explanation of 10 to 300 characters (any explanation is at most 300)';
  end if;
  -- the school's clock, as the screen's date field is: «today» at 06.00 is not a future date
  if v_date > v_hari or v_date < (en.valid_from at time zone v_zona)::date then
    raise exception using errcode = 'PR070', detail = 'ENROL_DATE_INVALID',
      message = 'the effective date is today or earlier, and not before the enrolment began';
  end if;
  -- the learner's open sittings close with the departure (expired, or ended as an institutional revocation)
  v_sesi := public.tutup_asesmen_terbuka(en.id, 'Pendaftaran diakhiri (' || p_reason || ')');

  update public.memberships set valid_to = now(), close_reason = 'ENROLLMENT_ENDED'
   where enrollment_id = en.id and valid_to is null;
  get diagnostics v_closed = row_count;
  update public.enrollments set status = 'ENDED', end_reason = v_end, valid_to = now() where id = en.id;

  perform public.audit_write('enrollment.ended_with_reason', 'enrollments', en.id::text, en.institution_id,
    jsonb_build_object('person_id', en.person_id, 'reason_code', p_reason, 'end_reason', v_end,
                       'explanation', v_expl, 'effective_date', v_date, 'placements_closed', v_closed,
                       'sittings_closed', v_sesi));
  return en.id;
end;
$$;
revoke all on function public.akhiri_pendaftaran(uuid, text, text, date) from public, anon, authenticated;
grant execute on function public.akhiri_pendaftaran(uuid, text, text, date) to authenticated, service_role;

create or replace function public.daftarkan_kembali(p_person uuid, p_institution uuid, p_kind text, p_reason text,
                                                    p_kelas uuid, p_enrollment uuid)
returns uuid language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_reason text := nullif(btrim(coalesce(p_reason, '')), ''); old record; v_period uuid; v_prog uuid;
        v_kelas uuid; k record; v_new uuid; v_status public.enrollment_status; v_corrects uuid;
begin
  if p_person is null or p_institution is null or not public.has_scope('INSTITUTION_ADMIN', p_institution) then
    raise exception using errcode = '42501',
      message = 're-enrolling a learner needs INSTITUTION_ADMIN of the school they come back to';
  end if;
  if p_kind is null or p_kind not in ('CORRECTION', 'RETURN') then
    raise exception using errcode = 'PR070', detail = 'ENROL_KIND_INVALID',
      message = 'a re-enrolment is a correction of a mistaken ending or a return';
  end if;
  if v_reason is null or char_length(v_reason) > 300 then
    raise exception using errcode = 'PR070', detail = 'ENROL_REASON_REQUIRED', message = 'a reason of at most 300 characters is required';
  end if;
  -- the person's row serialises this against a transfer, a new number or another re-enrolment of them
  perform 1 from public.persons where persons.id = p_person for update;
  -- recorded at this school: its number, or an enrolment there (both kinds need an earlier enrolment here anyway)
  if not exists (select 1 from public.institutional_identities ii
                  where ii.person_id = p_person and ii.institution_id = p_institution)
     and not exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id = p_institution) then
    raise exception using errcode = 'PR070', detail = 'PLACE_NOT_THIS_SCHOOL', message = 'this person is not recorded at this school';
  end if;
  if public.memegang_peran_staf(p_person) then
    raise exception using errcode = 'PR070', detail = 'PLACE_STAFF', message = 'a person holding a staff role is not enrolled as a learner';
  end if;

  if p_kind = 'CORRECTION' then
    select e.id, e.status, e.academic_period_id, e.programme_id, e.created_at, ap.ends_on into old
      from public.enrollments e left join public.academic_periods ap on ap.id = e.academic_period_id
     where e.id = p_enrollment and e.person_id = p_person and e.institution_id = p_institution;
    if old.id is null then
      raise exception using errcode = 'PR070', detail = 'ENROL_NOT_CORRECTABLE', message = 'no such enrolment of this learner at this school';
    end if;
    if old.status <> 'ENDED' then
      raise exception using errcode = 'PR070', detail = 'ENROL_NOT_ENDED', message = 'this enrolment has not ended; there is nothing to correct';
    end if;
    -- CORRECTED IN PLACE (undeployed; Sharon F5): a correction reopens the ending's own year, so it is offered only
    -- while that year runs; after it the learner comes back as a RETURN, into a Kelas of the year they return to
    if old.ends_on is not null and old.ends_on < public.hari_sekolah(p_institution) then
      raise exception using errcode = 'PR070', detail = 'ENROL_YEAR_CLOSED',
        message = 'the school year of this ending has closed; the learner comes back as a return';
    end if;
  end if;
  if exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id <> p_institution
               and e.status in ('PENDING', 'ACTIVE')) then
    raise exception using errcode = 'PR070', detail = 'PLACE_ELSEWHERE',
      message = 'this learner is enrolled at another school; they come back through a transfer';
  end if;
  if exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id = p_institution
               and e.status in ('PENDING', 'ACTIVE')) then
    raise exception using errcode = 'PR070', detail = 'ENROL_ALREADY_LIVE', message = 'this learner is already enrolled at this school';
  end if;

  if p_kind = 'CORRECTION' then
    -- only an ending this function recorded, not yet corrected, and still the person's latest enrolment here
    if not exists (select 1 from public.audit_log a where a.target_table = 'enrollments' and a.target_id = old.id::text
                     and a.action = 'enrollment.ended_with_reason')
       or exists (select 1 from public.audit_log a where a.action = 'enrollment.reopened' and a.summary ->> 'corrects' = old.id::text)
       or exists (select 1 from public.enrollments e where e.person_id = p_person and e.institution_id = p_institution
                    and e.id <> old.id and e.created_at > old.created_at) then
      raise exception using errcode = 'PR070', detail = 'ENROL_NOT_CORRECTABLE',
        message = 'only the latest ending recorded with a reason at this school, not yet corrected, can be corrected';
    end if;
    v_period := old.academic_period_id; v_prog := old.programme_id; v_corrects := old.id;
    -- the same Kelas, where it is still active
    select m.node_id into v_kelas from public.memberships m join public.org_nodes n on n.id = m.node_id
     where m.enrollment_id = old.id and m.close_reason = 'ENROLLMENT_ENDED' and n.kind = 'CLASS' and n.is_active
     order by m.valid_to desc nulls last limit 1;
    if p_kelas is not null then v_kelas := p_kelas; end if;
  else
    if not public.murid_sudah_keluar(p_person, p_institution) then
      raise exception using errcode = 'PR070', detail = 'ENROL_NOT_DEPARTED',
        message = 'this person has never been enrolled at this school; they are placed, not re-enrolled';
    end if;
    if p_kelas is null then
      raise exception using errcode = 'PR070', detail = 'PLACE_NOT_A_KELAS', message = 'a returning learner is placed in an active Kelas';
    end if;
    v_kelas := p_kelas;
    -- the year of the chosen Kelas; its programme below. CORRECTED IN PLACE (Sharon F4): the fallback programme is
    -- that of their latest enrolment here that was not cancelled
    select e.programme_id into v_prog from public.enrollments e
     where e.person_id = p_person and e.institution_id = p_institution and e.status <> 'CANCELLED'
     order by e.created_at desc limit 1;
  end if;

  if v_kelas is not null then
    select n.id, n.kind, n.is_active, n.institution_id, n.academic_period_id, n.member_kind, n.jalur into k
      from public.org_nodes n where n.id = v_kelas;
    if k.id is null or k.kind <> 'CLASS' or not k.is_active or k.institution_id <> p_institution
       or coalesce(k.member_kind, 'LEARNER') <> 'LEARNER'
       or (p_kind = 'CORRECTION' and k.academic_period_id is distinct from v_period) then
      raise exception using errcode = 'PR070', detail = 'PLACE_NOT_A_KELAS', message = 'a learner is placed in an active Kelas of this school';
    end if;
    if p_kind = 'RETURN' then v_period := k.academic_period_id; end if;
    -- CORRECTED IN PLACE (undeployed; Sharon F4): the learner's programme is the one the Kelas sits under, where it
    -- sits under one (a return, or a correction into a Kelas the administrator chose)
    if p_kind = 'RETURN' or p_kelas is not null then
      v_prog := coalesce((select p.id from public.org_nodes p where p.id = any(k.jalur) and p.kind = 'PROGRAMME'
                           order by array_position(k.jalur, p.id) desc limit 1), v_prog);
    end if;
  end if;
  if v_period is null then
    raise exception using errcode = 'PR070', detail = 'PLACE_NO_YEAR', message = 'the school has no academic year for this Kelas';
  end if;

  -- ACTIVE once the person has activated an account, as an imported learner becomes; PENDING until then
  v_status := case when exists (select 1 from public.accounts a where a.person_id = p_person
                                  and not exists (select 1 from public.account_setup st
                                                   where st.account_id = a.id and st.state = 'REQUIRED'))
                   then 'ACTIVE' else 'PENDING' end;
  begin
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (p_person, p_institution, v_period, v_prog, v_status) returning id into v_new;
  exception when unique_violation then
    raise exception using errcode = 'PR070', detail = 'ENROL_ALREADY_LIVE', message = 'this learner is already enrolled at this school';
  end;
  if v_kelas is not null then
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_new, v_kelas, v_period);
  end if;

  perform public.audit_write('enrollment.reopened', 'enrollments', v_new::text, p_institution,
    jsonb_build_object('person_id', p_person, 'kind', p_kind, 'reason', v_reason, 'corrects', v_corrects, 'node_id', v_kelas,
                       'academic_period_id', v_period));
  return v_new;
end;
$$;
revoke all on function public.daftarkan_kembali(uuid, uuid, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.daftarkan_kembali(uuid, uuid, text, text, uuid, uuid) to authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('akhiri_pendaftaran', 'STAFF', 'E3 «Akhiri pendaftaran»: the school ends one live enrolment with a reason and an '
   || 'effective date; its placements close; one audit row.', 'SCOPE', 'INSTITUTION_ADMIN'),
  ('daftarkan_kembali', 'STAFF', 'E4 «Daftarkan kembali»: a correction of a mistaken ending, or a return of a learner '
   || 'who left; a new enrolment, the past unchanged; one audit row.', 'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- verification
do $$
begin
  if not (select prosecdef from pg_proc where oid = 'public.akhiri_pendaftaran(uuid, text, text, date)'::regprocedure)
     or not (select prosecdef from pg_proc where oid = 'public.daftarkan_kembali(uuid, uuid, text, text, uuid, uuid)'::regprocedure) then
    raise exception 'lifecycle: E3/E4 must run as definer, since clients no longer write enrolments';
  end if;
  if position('has_scope(''INSTITUTION_ADMIN''' in (select prosrc from pg_proc where oid = 'public.akhiri_pendaftaran(uuid, text, text, date)'::regprocedure)) = 0
     or position('has_scope(''INSTITUTION_ADMIN''' in (select prosrc from pg_proc where oid = 'public.daftarkan_kembali(uuid, uuid, text, text, uuid, uuid)'::regprocedure)) = 0 then
    raise exception 'lifecycle: E3/E4 are not bounded to the school''s administrator';
  end if;
  if position('PLACE_ELSEWHERE' in (select prosrc from pg_proc where oid = 'public.daftarkan_kembali(uuid, uuid, text, text, uuid, uuid)'::regprocedure)) = 0 then
    raise exception 'lifecycle: a learner enrolled elsewhere could return without a transfer';
  end if;
  if (select count(*) from public.client_rpc_registry where function_name in ('akhiri_pendaftaran', 'daftarkan_kembali')) <> 2 then
    raise exception 'lifecycle: E3/E4 are not registered client functions';
  end if;
end $$;

-- 4.0 completion (owner decisions 1 and 3, 8 Nov 2026).
--
-- 1. A LEARNER RECORDED WITHOUT A CLASS IS PLACED IN ONE. A Pendataan row with no place becomes a person with a school
--    registration number and nothing else: no enrolment, no membership (import_advance, 20261006100000). Pindah moves
--    a placement that exists (move_learner_to_class), so such a learner had no route into a Kelas. The two functions
--    below reuse the intake's own two writes, under the intake's own permission:
--      * murid_tanpa_kelas(sekolah): the school's people with a registration number there, no staff role (CR-91,
--        memegang_peran_staf) and no open placement in the school; to CAN_PROVISION_PEOPLE there, as the waiting list
--        (menunggu_akun_boleh). Read only.
--      * tempatkan_murid(orang, kelas): one transaction. A PENDING enrolment in the Kelas's year (an open one for that
--        year is reused, never doubled) and an open membership, exactly as import_advance writes them; refused to a
--        staff role holder, to someone already placed (Pindah moves them), outside the school, or to a Kelas that is
--        not an active learners' CLASS (a professional-learning Kelas holds participants). Audited LEARNER_PLACED. The person, the number and every record stay as they are.
--
-- 2. STUDIO'S HOME COUNTS EVERY STEP SOMEONE MUST TAKE (W1.16). studio_home counted drafts and reviews but no
--    package at «Ajukan» (VALIDATED) or at any release step, so a package could wait unseen. Now:
--      * ACTION_REQUIRED («Draf yang belum diajukan») also counts VALIDATED: it is still the author's to submit;
--      * RELEASE_STEP counts the newest version of each line whose next step is a release step the reader may take,
--        under langkah.ts's rule: «Buat terbitan» (APPROVED, no release; CAN_FREEZE_RELEASE), «Kunci» (a release of an
--        approved package not yet frozen; CAN_FREEZE_RELEASE, not the author), «Terbitkan» (a FROZEN release; CAN_PUBLISH).
--    studio_langkah_terbitan() is that rule, once: studio_home counts it and the Studio list reads it, so the count
--    and the list it opens cannot differ. The two lines W1.7 asserts (supersedes_course_id = c.id / = f.course_id)
--    stay in studio_home.

-- ───────────────────────────────────────────────────────── 1. placement
create or replace function public.murid_tanpa_kelas(p_sekolah uuid)
returns table (person_id uuid, display_name text, institutional_id text)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id, p.display_name, ii.institutional_id
    from public.institutional_identities ii
    join public.persons p on p.id = ii.person_id
   where ii.institution_id = p_sekolah
     and public.menunggu_akun_boleh(p_sekolah)
     and not public.memegang_peran_staf(p.id)
     and not exists (
       select 1 from public.enrollments e
         join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
        where e.person_id = p.id and e.institution_id = p_sekolah
          and e.status in ('PENDING', 'ACTIVE') and e.valid_to is null)
   order by p.display_name, p.id
   limit 200
$$;
revoke all on function public.murid_tanpa_kelas(uuid) from public, anon;
grant execute on function public.murid_tanpa_kelas(uuid) to authenticated;

create or replace function public.tempatkan_murid(p_person uuid, p_kelas uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;
revoke all on function public.tempatkan_murid(uuid, uuid) from public, anon;
grant execute on function public.tempatkan_murid(uuid, uuid) to authenticated;

-- ───────────────────────────────────────────────────────── 2. Studio's counts
create or replace function public.studio_langkah_terbitan()
returns table (course_id uuid, institution_id uuid, langkah text)
language sql stable security definer set search_path = public, pg_temp as $$
  select c.id, c.institution_id,
         case when r.status is null then 'buat' when r.status = 'FROZEN' then 'terbitkan' else 'kunci' end
    from public.courses c
    left join lateral (select pr.status from public.plp_releases pr where pr.course_id = c.id
                        order by pr.created_at desc limit 1) r on true
   where not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
     and ((c.status = 'APPROVED' and r.status is null
           and public.can_in_institution('CAN_FREEZE_RELEASE', c.institution_id))
       or (r.status not in ('FROZEN', 'PUBLISHED', 'SUPERSEDED') and c.status = 'APPROVED'
           and public.can_in_institution('CAN_FREEZE_RELEASE', c.institution_id)
           and c.author_person_id is distinct from public.current_person_id())
       or (r.status = 'FROZEN' and public.can_in_institution('CAN_PUBLISH', c.institution_id)))
$$;
revoke all on function public.studio_langkah_terbitan() from public, anon;
grant execute on function public.studio_langkah_terbitan() to authenticated;

create or replace function public.studio_home()
returns table (bucket text, institution_id uuid, count int)
language sql stable security definer set search_path = public, pg_temp as $$
  with mine as (
    select i.id, i.name from public.institutions i
     where public.can_in_institution('CAN_DRAFT', i.id)
        or public.can_in_institution('CAN_REVIEW', i.id)
        or public.can_in_institution('CAN_ASSIGN_LEARNING', i.id)
        or public.can_in_institution('CAN_FREEZE_RELEASE', i.id)
        or public.can_in_institution('CAN_PUBLISH', i.id)
  )
  select 'ACTION_REQUIRED', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and c.status in ('INGESTED','STRUCTURED','VALIDATED','VALIDATION_FAILED')
     and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
   group by m.id having count(*) > 0
  union all
  select 'AWAITING_MY_REVIEW', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW', m.id)
     and c.status = 'IN_REVIEW'
     and c.author_person_id is distinct from public.current_person_id()
     and not exists (select 1 from public.courses n where n.supersedes_course_id = c.id)
   group by m.id having count(*) > 0
  union all
  select 'RELEASE_STEP', t.institution_id, count(*)::int
    from public.studio_langkah_terbitan() t join mine m on m.id = t.institution_id
   group by t.institution_id having count(*) > 0
  union all
  select 'BLOCKED', m.id, count(distinct f.course_id)::int
    from mine m join public.mcq_quality_findings f on f.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and f.severity = 'ERROR' and f.acknowledged_at is null
     and not exists (select 1 from public.courses n where n.supersedes_course_id = f.course_id)
   group by m.id having count(*) > 0
  union all
  select 'QUESTION_HEALTH', m.id, count(*)::int
    from mine m join public.question_health q on q.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', m.id)
     and q.state = 'SIGNAL_RAISED'
   group by m.id having count(*) > 0
  union all
  select 'DISTRIBUTED_CANONICAL', d.institution_id, count(*)::int
    from public.release_distributions d
   where d.status = 'ACTIVE'
     and (public.can_in_institution('CAN_ASSIGN_LEARNING', d.institution_id)
       or public.can_in_institution('CAN_DRAFT', d.institution_id))
   group by d.institution_id having count(*) > 0
$$;
revoke all on function public.studio_home() from public, anon, authenticated;
grant execute on function public.studio_home() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('murid_tanpa_kelas', 'STAFF', '4.0 completion (owner decision 1): a school''s learners with a registration number, no '
   || 'staff role and no open placement, to CAN_PROVISION_PEOPLE there. Read only.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('tempatkan_murid', 'STAFF', '4.0 completion (owner decision 1): places such a learner in an active Kelas of the school '
   || 'with the intake''s own two writes (a PENDING enrolment for the Kelas''s year, reused if open, and a membership); '
   || 'audited LEARNER_PLACED.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('studio_langkah_terbitan', 'STAFF', 'W1.16 (owner decision 3): the newest version of each line whose next step is a '
   || 'release step the reader may take (langkah.ts). studio_home counts it; the Studio list reads it.', null, null);

do $$
begin
  if (select p.prosecdef from pg_proc p where p.oid = 'public.tempatkan_murid(uuid,uuid)'::regprocedure) is not true then
    raise exception '4.0: tempatkan_murid must run as definer with its own capability check';
  end if;
  if has_function_privilege('anon', 'public.tempatkan_murid(uuid,uuid)', 'execute')
     or has_function_privilege('anon', 'public.murid_tanpa_kelas(uuid)', 'execute')
     or has_function_privilege('anon', 'public.studio_langkah_terbitan()', 'execute') then
    raise exception '4.0: a new function is executable by anon';
  end if;
  if not exists (select 1 from pg_proc p where p.proname = 'studio_home' and p.prosecdef
                  and p.prosrc like '%supersedes_course_id = c.id%' and p.prosrc like '%supersedes_course_id = f.course_id%'
                  and p.prosrc like '%RELEASE_STEP%' and p.prosrc like '%''VALIDATED''%') then
    raise exception 'W1.16: studio_home does not count VALIDATED and the release steps, or lost W1.7''s superseded rule';
  end if;
end $$;

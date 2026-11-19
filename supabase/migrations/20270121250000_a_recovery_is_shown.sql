-- A3 · A RECOVERY IS SHOWN (THE PLAN §5.5 F; Daisy's A3-KODE-PEMULIHAN.md §1, §2.3, §6.2; O-4).
--
-- Two reads, each REDEFINED IN FULL from its live body (pg_get_functiondef), each change additive:
--   * pengerjaan_saya(p_session) gains di_sesi_ini (this verified session controls the sitting, or none does yet),
--     perlu_izin (an Uji Penguasaan: a recovery needs the teacher) and izin_dipakai (this generation came by a teacher's
--     permission). The learner's page chooses its screen from them; it never sees a session id or a generation.
--   * daftar_pengerjaan(p_kelas, p_assessment_assignment) gains mode_asesmen, lanjut_diminta_pada (the learner's
--     request, while the sitting is open) and izin_berlaku_sampai (the newest permission while unused and valid). Its
--     result type changes, so it is dropped and created; its grant is restated as it was.
-- Nothing writes. No order, lock, authority or refusal changes. The registry rows stand as they are.
--
-- METRIC CATALOGUE AND ENGINE: unchanged (D-060). Nothing is scored here.

drop function public.daftar_pengerjaan(uuid, uuid);
CREATE OR REPLACE FUNCTION public.daftar_pengerjaan(p_kelas uuid, p_assessment_assignment uuid)
 RETURNS TABLE(person_id uuid, nama text, sesi_id uuid, jumlah_sesi integer, keadaan text, status session_status, mulai timestamp with time zone, tenggat timestamp with time zone, sisa_detik integer, diperpanjang integer, ditahan_sejak timestamp with time zone, sisa_ditahan_detik integer, murid_aktif boolean, berakhir_pada timestamp with time zone, dihitung boolean, percobaan_terpakai integer, batas_percobaan integer, percobaan_diizinkan boolean, izin_belum_dipakai boolean, permintaan_id uuid, permintaan_status text, permintaan_pada timestamp with time zone, permintaan_alasan text, permintaan_oleh_saya boolean, keputusan_pada timestamp with time zone, keputusan_alasan text, mode_asesmen text, lanjut_diminta_pada timestamp with time zone, izin_berlaku_sampai timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_me uuid := public.current_person_id(); aa public.assessment_assignments; v_batas integer;
begin
  select * into aa from public.assessment_assignments x where x.id = p_assessment_assignment;
  if v_me is null or aa.id is null
     or not exists (select 1 from public.org_nodes n where n.id = p_kelas and (n.id = aa.node_id or n.jalur @> array[aa.node_id]))
     or exists (select 1 from public.learning_assignments la where la.id = aa.learning_assignment_id and public.release_is_professional(la.plp_release_id))
     or not public.can_on_node('CAN_MANAGE_SITTINGS', p_kelas) then
    perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED');
  end if;
  select d.attempt_limit into v_batas from public.assessment_definitions d where d.id = aa.assessment_definition_id;
  return query
    with murid as (
      select e.person_id as pid from public.memberships m join public.enrollments e on e.id = m.enrollment_id
       where m.node_id = p_kelas and m.valid_to is null and e.status = 'ACTIVE'
      union
      select s.person_id from public.assessment_sessions s
       where s.assessment_assignment_id = aa.id and coalesce(s.class_node_id, s.cohort_node_id) = p_kelas
    )
    select m.pid, p.display_name, s.id,
           (select count(*)::integer from public.assessment_sessions x where x.person_id = m.pid and x.assessment_assignment_id = aa.id
               and coalesce(x.class_node_id, x.cohort_node_id) = p_kelas),
           case when s.id is null then 'NOT_STARTED'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and s.frozen_at is not null and s.unfrozen_at is null then 'FROZEN'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and public.pengerjaan_dilindungi(s.id) then 'HELD_STOP'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and t.tenggat is not null and t.tenggat <= now() then 'ENDED_BY_DEADLINE'
                when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then 'OPEN'
                when s.closure_kind = 'TEACHER_SCORED' then 'ENDED_SCORED'
                when s.closure_kind = 'TEACHER_NOT_COUNTED' then 'ENDED_NOT_COUNTED'
                when s.closure_kind in ('DEADLINE', 'WINDOW_CLOSED') then 'ENDED_BY_DEADLINE'
                when s.status in ('SUBMITTED', 'FINALIZED') then 'HANDED_IN'
                when s.status = 'EXPIRED' then 'EXPIRED_UNSCORED'
                when s.status = 'TERMINATED' and s.termination_cause = 'ADMINISTRATIVE_TERMINATION' then 'ENDED_WITH_ASSIGNMENT'
                else 'ENDED_OTHER' end,
           s.status, coalesce(s.started_at, s.created_at), t.tenggat,
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and not (s.frozen_at is not null and s.unfrozen_at is null) and t.tenggat is not null
                then greatest(0, floor(extract(epoch from (t.tenggat - now())))::integer) end,
           s.deadline_extended_count::integer,
           case when s.frozen_at is not null and s.unfrozen_at is null then s.frozen_at end,
           case when s.frozen_at is not null and s.unfrozen_at is null then s.frozen_remaining_seconds end,
           not public.orang_ditangguhkan(m.pid),
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then null
                else coalesce(s.closure_at, s.finalized_at, s.submitted_at) end,
           case when s.id is null then null
                else coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION') end,
           public.percobaan_terpakai(m.pid, aa.id), v_batas,
           s.attempt_request_id is not null,
           exists (select 1 from public.attempt_requests g where g.person_id = m.pid
                     and g.assessment_assignment_id in (select public.percobaan_penugasan_segaris(aa.id))
                     and g.status = 'APPROVED'
                     and not exists (select 1 from public.assessment_sessions x where x.attempt_request_id = g.id)),
           q.id, q.status, q.requested_at, q.reason, q.requested_by_person_id = v_me, q.decided_at, q.decision_reason,
           -- A3 (the screens): the sitting's mode; while it is open, the learner's request and the newest permission if it is
           -- still unused and inside its 10 minutes (an expired one returns the row to its plain state, Daisy §1)
           s.mode::text,
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then s.lanjut_diminta_pada end,
           case when s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
             (select case when z.dipakai_pada is null and z.berlaku_sampai > now() then z.berlaku_sampai end
                from public.pengerjaan_izin_lanjut z where z.session_id = s.id and z.person_id = s.person_id
               order by z.dibuat_pada desc, z.id desc limit 1) end
      from murid m
      join public.persons p on p.id = m.pid
      left join lateral (select x.* from public.assessment_sessions x
                          where x.person_id = m.pid and x.assessment_assignment_id = aa.id
                            and coalesce(x.class_node_id, x.cohort_node_id) = p_kelas
                          -- the latest; at one instant, the open one, then the granted one
                          order by x.created_at desc, (x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) desc,
                                   (x.attempt_request_id is not null) desc, x.id desc limit 1) s on true
      left join lateral (select public.pengerjaan_tenggat_efektif(s.id) as tenggat) t on true
      left join lateral (select g.* from public.attempt_requests g
                          where g.person_id = m.pid and g.assessment_assignment_id = aa.id
                          order by g.requested_at desc, g.id desc limit 1) q on true
     order by p.display_name, m.pid;
end
$function$;
revoke all on function public.daftar_pengerjaan(uuid, uuid) from public, anon, authenticated;
grant execute on function public.daftar_pengerjaan(uuid, uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.pengerjaan_saya(p_session uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare s public.assessment_sessions;
begin
  select * into s from public.assessment_sessions where id = p_session;
  if s.id is null or s.person_id is distinct from public.current_person_id() then
    perform public.pengerjaan_tolak('SITTING_NOT_ALLOWED');
  end if;
  return jsonb_build_object(
    'status', s.status,
    'ditahan', s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')   -- D1-3: a stale mark holds nothing
               and ((s.frozen_at is not null and s.unfrozen_at is null) or public.pengerjaan_dilindungi(s.id)),
    'dilepas_henti', public.pengerjaan_dilepas_henti(s),   -- A2a, THE PLAN item 3
    'dilanjutkan', s.unfrozen_at is not null and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED'),
    'penutupan', case when s.closure_kind in ('DEADLINE', 'WINDOW_CLOSED') then 'DEADLINE'
                      when s.closure_kind is not null then s.closure_kind
                      when s.status = 'TERMINATED' and s.termination_cause = 'ADMINISTRATIVE_TERMINATION' then 'ASSIGNMENT_ENDED'
                      when s.status = 'TERMINATED' then 'OTHER' end,
    'dihitung', coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION'),
    'tenggat', public.pengerjaan_tenggat_efektif(s.id),
    'diperpanjang', s.deadline_extended_count,
    'percobaan_diizinkan', s.attempt_request_id is not null,
    -- A3 (the screens): whether THIS verified session controls the sitting (no controller yet: the first writer claims
    -- it, A3 D6), whether a recovery needs a teacher (an Uji Penguasaan, D7), and whether this generation came by a
    -- teacher's permission (Daisy §2.3's quiet line)
    'di_sesi_ini', s.pengendali_sesi is null or s.pengendali_sesi = public.sesi_saya(),
    'perlu_izin', s.mode = 'POST_TEST',
    'izin_dipakai', exists (select 1 from public.pengerjaan_izin_lanjut z
                             where z.session_id = s.id and z.dipakai_generasi = s.generasi));
end $function$;
revoke all on function public.pengerjaan_saya(uuid) from public, anon, authenticated;
grant execute on function public.pengerjaan_saya(uuid) to authenticated;

do $$
declare v text;
begin
  v := pg_get_functiondef('public.pengerjaan_saya(uuid)'::regprocedure);
  if position('di_sesi_ini' in v) = 0 or position('izin_dipakai' in v) = 0 then raise exception 'pengerjaan_saya lacks the screens'' fields'; end if;
  if (select provolatile from pg_proc where oid = 'public.daftar_pengerjaan(uuid,uuid)'::regprocedure) <> 's'
     or (select provolatile from pg_proc where oid = 'public.pengerjaan_saya(uuid)'::regprocedure) <> 's' then
    raise exception 'the screens'' reads must stay STABLE';
  end if;
  if pg_get_function_result('public.daftar_pengerjaan(uuid,uuid)'::regprocedure) not like '%izin_berlaku_sampai%' then
    raise exception 'daftar_pengerjaan lacks the screens'' columns';
  end if;
  if has_function_privilege('anon', 'public.daftar_pengerjaan(uuid,uuid)', 'execute')
     or has_function_privilege('anon', 'public.pengerjaan_saya(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.daftar_pengerjaan(uuid,uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.pengerjaan_saya(uuid)', 'execute') then
    raise exception 'the screens'' reads: grants changed';
  end if;
end $$;

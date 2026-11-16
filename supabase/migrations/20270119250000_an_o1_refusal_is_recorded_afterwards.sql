-- A2a, change C · the O1 refusal audit (Sharon's answer to question 3, A2A-C-39-d77609ec.md; THE PLAN §5.3 D6.9:
-- "each O1 refusal audited"). DRAFT.
--
-- A refusal raises, so its transaction keeps nothing. As catat_penolakan_peran (B0, migration 20270113170000), the
-- refusal is recorded afterwards by a second call, and only one that still stands for that caller at that moment:
--   * SITTING_CLASS_STOPPED, on a sitting: the sitting is protected by a stop (or held by one), and the caller may
--     manage it (boleh_atas_sesi CAN_MANAGE_SITTINGS, boleh_kelola_pengerjaan): the teacher's sitting acts. The
--     learner's own answers are not recorded here (put to Sharon: the offline client retries a refused answer);
--     on a learning assignment («Ubah jadwal»): the caller may assign there (CAN_ASSIGN_LEARNING over its node, not a
--     professional release) and an open sitting of it is protected or held;
--   * ASSIGN_CLASS_STOPPED, on a learning assignment: the caller may end it (boleh_akhiri_penugasan) and an open
--     sitting of it is protected;
--   * PROMO_STOPPED, on a Kelas: the caller is INSTITUTION_ADMIN over it and a learner of its population has a sitting
--     protected or held (kenaikan_tetapkan's own count).
-- Not SITTING_FENCE_BUSY: a retry, not an O1 refusal. Anything else is refused STOP_REFUSAL_NOT_FOUND.
-- The promotion's preview (kenaikan_tetapkan without p_terapkan) is a review, not an act: only the apply is recorded.
-- One row per call (one per refused act: the screens call it once, after the refusal); no text from the client; the
-- row names the stop or stops in force over the held sittings, and how many are held.

create function public.catat_penolakan_henti(p_sasaran uuid, p_kode text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); s public.assessment_sessions; la public.learning_assignments;
        k record; v_sesi uuid[]; v_aksi text; v_tabel text; v_inst uuid; v_ditahan integer;
begin
  if v_actor is null or p_sasaran is null then perform public.catat_penolakan_henti_tolak(); end if;
  if p_kode = 'SITTING_CLASS_STOPPED' then
    select * into s from public.assessment_sessions where id = p_sasaran;
    if s.id is not null then
      if not (public.pengerjaan_dilindungi(s.id) or (s.darurat_sejak is not null and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')))
         or not (public.boleh_atas_sesi(s.id, 'CAN_MANAGE_SITTINGS') or public.boleh_kelola_pengerjaan(s.id)) then
        perform public.catat_penolakan_henti_tolak();
      end if;
      v_sesi := array[s.id]; v_aksi := 'assessment_session.stop_refused'; v_tabel := 'assessment_sessions'; v_inst := s.institution_id;
    else
      select * into la from public.learning_assignments where id = p_sasaran;
      if la.id is null or public.release_is_professional(la.plp_release_id) or not public.can_on_node('CAN_ASSIGN_LEARNING', la.node_id) then
        perform public.catat_penolakan_henti_tolak();
      end if;
      select array_agg(x.id order by x.id) into v_sesi from public.assessment_sessions x
        join public.assessment_assignments aa on aa.id = x.assessment_assignment_id
       where aa.learning_assignment_id = la.id and x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
         and (x.darurat_sejak is not null or public.pengerjaan_dilindungi(x.id));
      v_aksi := 'learning_assignment.stop_refused'; v_tabel := 'learning_assignments';
      v_inst := (select n.institution_id from public.org_nodes n where n.id = la.node_id);
    end if;
  elsif p_kode = 'ASSIGN_CLASS_STOPPED' then
    select * into la from public.learning_assignments where id = p_sasaran;
    if la.id is null or not public.boleh_akhiri_penugasan(la.id) then perform public.catat_penolakan_henti_tolak(); end if;
    select array_agg(x.id order by x.id) into v_sesi from public.penugasan_sesi(la.id) x
     where x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and public.pengerjaan_dilindungi(x.id);
    v_aksi := 'learning_assignment.stop_refused'; v_tabel := 'learning_assignments';
    v_inst := (select n.institution_id from public.org_nodes n where n.id = la.node_id);
  elsif p_kode = 'PROMO_STOPPED' then
    select n.id, n.institution_id into k from public.org_nodes n where n.id = p_sasaran and n.kind = 'CLASS';
    if k.id is null or not public.has_scope('INSTITUTION_ADMIN', k.id) then perform public.catat_penolakan_henti_tolak(); end if;
    select array_agg(a.id order by a.id) into v_sesi
      from public.kenaikan_populasi(k.id) pop
      join public.assessment_sessions a on a.person_id = pop.person_id and a.enrollment_id = pop.enrollment_id
     where a.status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED')
       and not exists (select 1 from public.assessment_results r where r.session_id = a.id)
       and (public.pengerjaan_dilindungi(a.id) or a.darurat_sejak is not null);
    v_aksi := 'promotion.stop_refused'; v_tabel := 'org_nodes'; v_inst := k.institution_id;
  else
    perform public.catat_penolakan_henti_tolak();
  end if;
  if coalesce(cardinality(v_sesi), 0) = 0 then perform public.catat_penolakan_henti_tolak(); end if;
  select count(distinct a.person_id) into v_ditahan from public.assessment_sessions a where a.id = any (v_sesi);
  return public.audit_write(v_aksi, v_tabel, p_sasaran::text, v_inst,
    jsonb_build_object('refusal', p_kode, 'held_sittings', cardinality(v_sesi), 'held_learners', v_ditahan,
      'windows', coalesce((select jsonb_agg(w.id order by w.t_stop, w.id) from public.maintenance_windows w
                            where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is null
                              and exists (select 1 from public.assessment_sessions a where a.id = any (v_sesi)
                                           and (a.darurat_jendela_id = w.id or w.platform
                                                or public.maintenance_affects(w, a.person_id)))), '[]'::jsonb),
      'actor_role', public.audit_actor_role(v_inst)));
end $$;

create function public.catat_penolakan_henti_tolak() returns void
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using errcode = 'PR170', detail = 'STOP_REFUSAL_NOT_FOUND',
    message = 'no such refusal stands for you now; nothing was recorded';
end $$;

revoke all on function public.catat_penolakan_henti(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.catat_penolakan_henti(uuid, text) to authenticated;
revoke all on function public.catat_penolakan_henti_tolak() from public, anon, authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('catat_penolakan_henti', 'STAFF',
   'A2a D6.9: records an O1 refusal (SITTING_CLASS_STOPPED, ASSIGN_CLASS_STOPPED, PROMO_STOPPED) after the refused '
   || 'transaction, and only one that stands for the caller now: the sitting, the assignment''s open sitting or the '
   || 'Kelas''s learner is held by a stop, and the caller may act on it. One row per call, naming the stops in force. '
   || 'Anything else is refused STOP_REFUSAL_NOT_FOUND (PR170).',
   'DELEGATED', 'assessment_sessions')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if has_function_privilege('anon', 'public.catat_penolakan_henti(uuid, text)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.catat_penolakan_henti_tolak()'::regprocedure, 'execute') then
    raise exception 'A2a D6.9: the refusal record is open to anon, or its helper to a client';
  end if;
end $$;

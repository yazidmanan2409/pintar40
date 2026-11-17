-- A2b, commit 2 · the place guard: a PLANNED window at class or school scope refuses changes to that place's work,
-- and nothing else (the owner's R-1; A2B-COMPLETION.md rows 1 to 4 and 8; Sharon's inventory rulings; PLAN-A2B-C2W.md
-- §2.3 K1, K2, K6, K11, K12). DRAFT.
--
-- * maintenance_affects_place(node, at): true when a PLANNED window, not platform-wide and not ended at `at`, has
--   started by `at` and not reached its end, and scopes the node's school (a school window) or the node or one of its
--   ancestors (a class window). One indexed read (the open-window index on starts_at); no row lock.
-- * The refusal: PR040, detail MAINTENANCE_PLACE, naming the place only; never PT503.
-- * The guard (maintenance_jaga_tempat, _sesi, _orang) reads clock_timestamp(), never now() (Sharon, point 1: a
--   transaction that began before the start and writes after it is refused), and each refused writer calls it at its
--   write, after its own locks, so a writer that waited on a lock across the start is refused too (K1).
-- * The refused writers, per Sharon's classing (A2B-I01): the teacher's sitting acts (A1's extend and resume, the
--   older extend, the early end, the staff termination, closing a held sitting), a further attempt and its grant
--   (a decline is allowed), the assignment acts (assign, «Ubah jadwal», «Akhiri»/«Tarik», moving a release, the quick
--   assessment, both launches), the promotion as a whole act, and lesson progress (quietly: the same code, read by the
--   client without a redirect). A start is refused by the sitting-insert trigger: by the place during an ACTIVE window
--   (Sharon's ruling 1), by T−15 (MAINTENANCE_NO_NEW_START) before it.
-- * The request hook loses work-scoped windows: maintenance_block_for_me answers for EMERGENCY windows and for a
--   platform-wide PLANNED window only, so no one is sent to the pause page for a class or school window (K11).
-- Allowed and system closures are untouched: the drain, departures, transfers, key corrections and A1's closer.

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

-- ───────────────────────────────────────────────────────────── the place question and its refusal
create function public.maintenance_affects_place(p_node uuid, p_at timestamptz) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.maintenance_windows w join public.org_nodes n on n.id = p_node
     where (w.ended_at is null or w.ended_at > p_at)
       and w.kind = 'PLANNED' and not w.platform
       and w.starts_at <= p_at and (w.ends_at is null or w.ends_at > p_at)
       and n.institution_id = any (w.institution_ids)
       and (cardinality(w.node_ids) = 0 or w.node_ids && n.jalur))
$$;

create function public.maintenance_tolak_tempat() returns void
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using errcode = 'PR040', detail = 'MAINTENANCE_PLACE',
    message = 'planned maintenance is under way for this class or school; its work is not changed until it ends';
end $$;

/** the guard at a write: the place, read on the clock */
create function public.maintenance_jaga_tempat(p_node uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_node is not null and public.maintenance_affects_place(p_node, clock_timestamp()) then
    perform public.maintenance_tolak_tempat();
  end if;
end $$;

/** a sitting's place: its class (or Angkatan), else its learning assignment's node, else its school */
create function public.maintenance_jaga_sesi(p_session uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_node uuid;
begin
  select coalesce(s.class_node_id, s.cohort_node_id, la.node_id,
                  (select n.id from public.org_nodes n where n.institution_id = s.institution_id and n.kind = 'INSTITUTION'
                    order by n.id limit 1))
    into v_node
    from public.assessment_sessions s left join public.learning_assignments la on la.id = s.learning_assignment_id
   where s.id = p_session;
  perform public.maintenance_jaga_tempat(v_node);
end $$;

/** a person's work under a node: the node, and the person's current classes in its school (current placement) */
create function public.maintenance_jaga_orang(p_person uuid, p_node uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_kini timestamptz := clock_timestamp();
begin
  if public.maintenance_affects_place(p_node, v_kini)
     or exists (select 1 from public.enrollments e join public.memberships m on m.enrollment_id = e.id
                  join public.org_nodes n on n.id = m.node_id
                 where e.person_id = p_person and e.status = 'ACTIVE'
                   and m.valid_from <= v_kini and (m.valid_to is null or m.valid_to > v_kini)
                   and n.institution_id = (select x.institution_id from public.org_nodes x where x.id = p_node)
                   and public.maintenance_affects_place(n.id, v_kini)) then
    perform public.maintenance_tolak_tempat();
  end if;
end $$;

revoke all on function public.maintenance_affects_place(uuid, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.maintenance_tolak_tempat() from public, anon, authenticated, service_role;
revoke all on function public.maintenance_jaga_tempat(uuid) from public, anon, authenticated, service_role;
revoke all on function public.maintenance_jaga_sesi(uuid) from public, anon, authenticated, service_role;
revoke all on function public.maintenance_jaga_orang(uuid, uuid) from public, anon, authenticated, service_role;

-- ───────────────────────────────────────────────────────────── the refused writers, each at its write
do $$
declare g text := E'  perform public.maintenance_jaga_sesi(p_session);   -- A2b: the place, read at the write\n';
begin
  perform pg_temp.a2b_ganti('public.tambah_waktu_pengerjaan(uuid,integer,text)',
    E'  perform public.pengerjaan_putus_tenggat(p_session, true);\n', g || E'  perform public.pengerjaan_putus_tenggat(p_session, true);\n');
  perform pg_temp.a2b_ganti('public.extend_session_deadline(uuid,integer,text)',
    E'  -- A1 (O41-20): under the row lock, a sitting whose deadline has passed ends by it first\n',
    g || E'  -- A1 (O41-20): under the row lock, a sitting whose deadline has passed ends by it first\n');
  perform pg_temp.a2b_ganti('public.akhiri_pengerjaan(uuid,text,text)',
    E'  -- a sitting past its deadline has ended by it; the teacher''s choice does not replace that ending\n',
    g || E'  -- a sitting past its deadline has ended by it; the teacher''s choice does not replace that ending\n');
  perform pg_temp.a2b_ganti('public.lanjutkan_pengerjaan(uuid,text)',
    E'  -- the preserved remaining time, from now: no more.', g || E'  -- the preserved remaining time, from now: no more.');
  perform pg_temp.a2b_ganti('public.tutup_pengerjaan_ditahan(uuid,text)',
    E'  select count(*) into v_kept from public.responses r where r.session_id = p_session;\n',
    g || E'  select count(*) into v_kept from public.responses r where r.session_id = p_session;\n');
  perform pg_temp.a2b_ganti('public.terminate_session(uuid,termination_cause,text)',
    E'  select count(*) into v_kept from public.responses where session_id = p_session;\n',
    g || E'  select count(*) into v_kept from public.responses where session_id = p_session;\n');
  perform pg_temp.a2b_ganti('public.minta_percobaan(uuid,text)',
    E'  -- one request at a time for this learner and assessment', g || E'  -- one request at a time for this learner and assessment');
  -- a grant opens new work; a decline closes a pending request and is allowed
  perform pg_temp.a2b_ganti('public.putuskan_percobaan(uuid,boolean,text)',
    E'  v_status := case when p_setuju then ''APPROVED'' else ''DECLINED'' end;\n',
    E'  if p_setuju then perform public.maintenance_jaga_sesi(r.session_id); end if;   -- A2b: a grant only\n'
    || E'  v_status := case when p_setuju then ''APPROVED'' else ''DECLINED'' end;\n');
  -- lesson progress: the learner's work under the assignment (refused quietly: the same code, no redirect)
  perform pg_temp.a2b_ganti('public.record_lesson_progress(uuid,uuid,integer,integer)',
    E'\n  insert into public.lesson_progress',
    E'\n  perform public.maintenance_jaga_orang(v_person, (select la.node_id from public.learning_assignments la where la.id = p_learning_assignment));\n'
    || E'  insert into public.lesson_progress');
  -- the assignment acts
  perform pg_temp.a2b_ganti('public.ubah_jadwal_penugasan(uuid,timestamp with time zone,timestamp with time zone,text)',
    E'  begin\n    update public.learning_assignments set available_from = p_dari',
    E'  perform public.maintenance_jaga_tempat(la.node_id);   -- A2b\n  begin\n    update public.learning_assignments set available_from = p_dari');
  perform pg_temp.a2b_ganti('public.akhiri_penugasan(uuid,text,text,boolean)',
    E'  for s in select x.id, x.institution_id from public.penugasan_sesi(p_la) x\n',
    E'  perform public.maintenance_jaga_tempat(v_la.node_id);   -- A2b\n  for s in select x.id, x.institution_id from public.penugasan_sesi(p_la) x\n');
  perform pg_temp.a2b_ganti('public.assign_release(uuid,uuid,timestamp with time zone,timestamp with time zone)',
    E'\n  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id,',
    E'\n  perform public.maintenance_jaga_tempat(p_node);   -- A2b\n  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id,');
  perform pg_temp.a2b_ganti('public.launch_quick_assessment(uuid,uuid,integer,integer)',
    E'    raise exception ''launching a quick assessment requires CAN_QUICK_ASSESSMENT over this class'';\n  end if;\n',
    E'    raise exception ''launching a quick assessment requires CAN_QUICK_ASSESSMENT over this class'';\n  end if;\n'
    || E'  perform public.maintenance_jaga_tempat(p_node);   -- A2b\n');
  perform pg_temp.a2b_ganti('public.move_learning_assignment_release(uuid,uuid,text)',
    E'  perform 1 from public.learning_assignments where id = p_assignment for update;\n',
    E'  perform 1 from public.learning_assignments where id = p_assignment for update;\n'
    || E'  perform public.maintenance_jaga_tempat((select la.node_id from public.learning_assignments la where la.id = p_assignment));   -- A2b\n');
  -- the promotion, as a whole act: if the Kelas or any destination is under a planned window, nothing is promoted
  perform pg_temp.a2b_ganti('public.kenaikan_tetapkan(uuid,uuid,jsonb,boolean,boolean)',
    E'  for d in\n    select pop.person_id, pop.enrollment_id, pop.sumber,',
    E'  if p_terapkan then   -- A2b: the whole act, before anything is written\n'
    || E'    perform public.maintenance_jaga_tempat(p_kelas);\n'
    || E'    perform public.maintenance_jaga_tempat(n.id) from public.org_nodes n\n'
    || E'     where n.id::text in (select nullif(x ->> ''kelas_tujuan'', '''') from jsonb_array_elements(v_keputusan) x);\n'
    || E'  end if;\n'
    || E'  for d in\n    select pop.person_id, pop.enrollment_id, pop.sumber,');
end $$;

-- ───────────────────────────────────────────────────────────── a start: the trigger
create or replace function public.enforce_no_new_sitting_in_maintenance()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_kini timestamptz := clock_timestamp(); v_node uuid;
begin
  -- person-level (EMERGENCY, and PLANNED platform-wide): as before
  if exists (select 1 from public.maintenance_windows w
              where w.ended_at is null and (w.ends_at is null or w.ends_at > now())
                and (w.kind = 'EMERGENCY' or w.platform)
                and public.maintenance_state(w, now()) in ('MENJELANG', 'AKTIF')
                and public.maintenance_affects(w, new.person_id)) then
    perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START');
  end if;
  -- work-scoped PLANNED (R-1), on the clock: the place during the window (Sharon's ruling 1), T−15 before it
  v_node := coalesce(new.class_node_id, new.cohort_node_id,
                     (select la.node_id from public.learning_assignments la where la.id = new.learning_assignment_id));
  if v_node is null then return new; end if;
  if public.maintenance_affects_place(v_node, v_kini) then perform public.maintenance_tolak_tempat(); end if;
  if exists (select 1 from public.maintenance_windows w join public.org_nodes n on n.id = v_node
              where w.ended_at is null and w.kind = 'PLANNED' and not w.platform
                and w.starts_at > v_kini and w.starts_at - interval '15 minutes' <= v_kini
                and n.institution_id = any (w.institution_ids)
                and (cardinality(w.node_ids) = 0 or w.node_ids && n.jalur)) then
    perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START');
  end if;
  return new;
end $$;
revoke all on function public.enforce_no_new_sitting_in_maintenance() from public, anon, authenticated;

-- ───────────────────────────────────────────────────────────── the request hook: person-level windows only
do $$
begin
  perform pg_temp.a2b_ganti('public.maintenance_block_for_me()',
    E'    continue when not public.maintenance_affects(w, v_me) or public.maintenance_controls(w);\n',
    E'    -- A2b (R-1): a class or school PLANNED window is work-scoped: it stops no one as a person\n'
    || E'    continue when w.kind = ''PLANNED'' and not w.platform;\n'
    || E'    continue when not public.maintenance_affects(w, v_me) or public.maintenance_controls(w);\n');
end $$;

do $$
begin
  if to_regprocedure('public.maintenance_affects_place(uuid,timestamp with time zone)') is null
     or has_function_privilege('authenticated', 'public.maintenance_jaga_tempat(uuid)'::regprocedure, 'execute')
     or position('maintenance_jaga_sesi' in pg_get_functiondef('public.tambah_waktu_pengerjaan(uuid,integer,text)'::regprocedure)) = 0
     or position('maintenance_affects_place' in pg_get_functiondef('public.enforce_no_new_sitting_in_maintenance()'::regprocedure)) = 0
     or position('not w.platform' in pg_get_functiondef('public.maintenance_block_for_me()'::regprocedure)) = 0 then
    raise exception 'A2b commit 2: the place guard, a writer''s call, the start trigger or the request hook is not as intended';
  end if;
end $$;

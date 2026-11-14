-- A2a, change C · the emergency form chooses classes, and the list names them (Daisy, A2-KATA-DESAIN.md A1 and A4;
-- her early review of the first screenshots, A2A-LAYAR-f308b0bf.md §2 "Not yet in hle.ts"). DRAFT.
--
-- Reads only, for the Konfigurasi page; no write changes and no lock is taken:
--   penghentian_kelas_sekolah(p_sekolah)    the form's class list for one school: «{kelas} · {tahun ajaran}» (Admin PINTAR)
--   penghentian_dampak(p_sekolah, p_kelas)  the impact sentence's {n} (everyone the stop would reach, the classes' teachers
--                                           included) and {m} (assessments in progress), on the same people rule as the
--                                           stop itself (penghentian_orang, at now); a class outside the school is
--                                           MAINTENANCE_NODE_INVALID, as the stop refuses it
--   penghentian_ditahan(w)                  the sittings a stop holds (or held, once lifted): the confirmation's and the
--                                           result line's {m}; protection's own rule (opened by T_stop, affected then,
--                                           open or inside its grace at T_stop)
--   penghentian_ditahan_jendela(p_window)   the same for one window, for the lift's result line (Admin PINTAR)
-- maintenance_list gains, per row: the classes held (kelas), T_stop (sejak), who stopped it (oleh), the sittings held
-- (ditahan, a stop in force or lifted only); and a school's own admin sees an emergency stop at their school (A5: "the
-- school's own admin, who is not in the class, sees the stop in the maintenance list"), which they cannot change.

create function public.penghentian_ditahan(w public.maintenance_windows) returns integer
language sql stable security definer set search_path = public, pg_temp as $$
  select case when w.kind <> 'EMERGENCY' or w.t_stop is null then 0 else (
    select count(*)::integer from public.assessment_sessions s
     where (w.platform or s.person_id in (select o from public.penghentian_orang(w) o))
       and s.created_at <= w.t_stop
       and (s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') or public.pengerjaan_dalam_tenggang_pada(s, w.t_stop))
       and public.maintenance_affects_pada(w, s.person_id, w.t_stop)) end
$$;
revoke all on function public.penghentian_ditahan(public.maintenance_windows) from public, anon, authenticated, service_role;

create function public.penghentian_ditahan_jendela(p_window uuid) returns integer
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare w public.maintenance_windows;
begin
  if public.current_person_id() is null or not public.is_system_admin() then perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED'); end if;
  select * into w from public.maintenance_windows where id = p_window;
  return coalesce(public.penghentian_ditahan(w), 0);
end $$;
revoke all on function public.penghentian_ditahan_jendela(uuid) from public, anon, service_role;
grant execute on function public.penghentian_ditahan_jendela(uuid) to authenticated;

create function public.penghentian_kelas_sekolah(p_sekolah uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.current_person_id() is null or not public.is_system_admin() then perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED'); end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'nama', n.name, 'tahun', ap.name) order by n.name, ap.starts_on, n.id)
                     from public.org_nodes n left join public.academic_periods ap on ap.id = n.academic_period_id
                    where n.institution_id = p_sekolah and n.kind = 'CLASS' and n.is_active), '[]'::jsonb);
end $$;
revoke all on function public.penghentian_kelas_sekolah(uuid) from public, anon, service_role;
grant execute on function public.penghentian_kelas_sekolah(uuid) to authenticated;

create function public.penghentian_dampak(p_sekolah uuid, p_kelas uuid[]) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare w public.maintenance_windows; n integer; m integer;
begin
  if public.current_person_id() is null or not public.is_system_admin() then perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED'); end if;
  if p_sekolah is null or cardinality(coalesce(p_kelas, '{}')) = 0
     or exists (select 1 from unnest(p_kelas) k
                 where not exists (select 1 from public.org_nodes n where n.id = k and n.kind = 'CLASS' and n.institution_id = p_sekolah)) then
    perform public.maintenance_refuse('MAINTENANCE_NODE_INVALID');
  end if;
  w := jsonb_populate_record(null::public.maintenance_windows, jsonb_build_object(
         'kind', 'EMERGENCY', 'platform', false, 'institution_ids', jsonb_build_array(p_sekolah), 'node_ids', to_jsonb(p_kelas),
         't_stop', now()));
  select count(*)::integer into n from (select distinct o from public.penghentian_orang(w) o) x;
  select count(*)::integer into m from public.assessment_sessions s
   where s.status = 'IN_PROGRESS' and s.person_id in (select o from public.penghentian_orang(w) o);
  return jsonb_build_object('orang', n, 'asesmen', m);
end $$;
revoke all on function public.penghentian_dampak(uuid, uuid[]) from public, anon, service_role;
grant execute on function public.penghentian_dampak(uuid, uuid[]) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('penghentian_ditahan_jendela', 'PLATFORM', 'A2a (Daisy A4): the sittings an emergency stop holds or held, for the lift''s result line. Admin PINTAR only.', 'SYSTEM_ADMIN', null),
  ('penghentian_kelas_sekolah', 'PLATFORM', 'A2a (Daisy A1): one school''s classes, «{kelas} · {tahun ajaran}», for the emergency form. Admin PINTAR only.', 'SYSTEM_ADMIN', null),
  ('penghentian_dampak', 'PLATFORM', 'A2a (Daisy A1): the impact sentence''s counts (people the stop would reach, assessments in progress) on the stop''s own people rule. Admin PINTAR only; counts, never a listing.', 'SYSTEM_ADMIN', null);

create or replace function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baru text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2a A4: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, p_baru);
end $$;

do $$
begin
  perform pg_temp.a2a_sisip('public.maintenance_list(integer,integer,uuid)',
    E'''menguasai'', public.maintenance_controls(b.w))',
    E'''menguasai'', public.maintenance_controls(b.w),\n'
    || E'           ''kelas'', case when cardinality((b.w).node_ids) > 0 then (select jsonb_agg(n.name order by n.name) from public.org_nodes n where n.id = any ((b.w).node_ids)) end,\n'
    || E'           ''sejak'', (b.w).t_stop,\n'
    || E'           ''oleh'', (select p.display_name from public.persons p where p.id = (b.w).created_by_person_id),\n'
    || E'           ''ditahan'', case when (b.w).kind = ''EMERGENCY'' and (b.w).t_stop is not null then public.penghentian_ditahan(b.w) end)');
  perform pg_temp.a2a_sisip('public.maintenance_list(integer,integer,uuid)',
    E'                  or m.platform)',
    E'                  or m.platform\n'
    || E'                  -- A2a A5: a school''s own admin sees an emergency stop at their school (they cannot change it)\n'
    || E'                  or (m.kind = ''EMERGENCY'' and m.t_stop is not null\n'
    || E'                      and exists (select 1 from unnest(m.institution_ids) i where public.has_scope(''INSTITUTION_ADMIN'', i))))');
end $$;

do $$
begin
  if position('penghentian_ditahan(b.w)' in pg_get_functiondef('public.maintenance_list(integer,integer,uuid)'::regprocedure)) = 0 then
    raise exception 'A2a A4: the maintenance list does not name what a stop holds';
  end if;
end $$;

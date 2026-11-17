-- A2b batch 2 · a window's place, end and zone, for whoever controls it (found capturing D8-6). DRAFT.
--
-- A staff client reads no row of maintenance_windows (M148: the direct read is refused). «Perpanjang» needs the
-- window's end (its form says «Sekarang diperkirakan selesai pukul …», and the screen refuses a new end that is not
-- later), its place (the advisory count for the added period asks maintenance_collisions for the window's schools and
-- classes) and the zone its new end is typed in (the window's one school's clock, else WIB: the rule every maintenance
-- form keeps). pemeliharaan_jendela_tempat(p_window) gives those to the window's controller (maintenance_controls: its
-- school's Admin sekolah for a planned school or class window, Admin PINTAR for any) and refuses anyone else with
-- MAINTENANCE_NOT_ALLOWED. Read only; a STAFF read.

create function public.pemeliharaan_jendela_tempat(p_window uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare w public.maintenance_windows;
begin
  select * into w from public.maintenance_windows where id = p_window;
  if public.current_person_id() is null or w.id is null or not public.maintenance_controls(w) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  return jsonb_build_object('platform', w.platform, 'sekolah', to_jsonb(w.institution_ids), 'kelas', to_jsonb(w.node_ids),
    'selesai', w.ends_at,
    'zona', case when not w.platform and cardinality(w.institution_ids) = 1 then public.zona_sekolah(w.institution_ids[1]) else 'Asia/Jakarta' end);
end $$;
revoke all on function public.pemeliharaan_jendela_tempat(uuid) from public, anon, service_role;
grant execute on function public.pemeliharaan_jendela_tempat(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('pemeliharaan_jendela_tempat', 'STAFF',
   'A2b D3: a maintenance window''s place (platform, schools, classes), end and the zone its times are typed in, for '
   || 'its controller (the school''s Admin sekolah for a planned school or class window, Admin PINTAR for any); anyone '
   || 'else MAINTENANCE_NOT_ALLOWED. Read only.',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
declare f regprocedure := 'public.pemeliharaan_jendela_tempat(uuid)';
begin
  if has_function_privilege('anon', f, 'execute') or has_function_privilege('service_role', f, 'execute')
     or not has_function_privilege('authenticated', f, 'execute')
     or position('maintenance_controls(w)' in pg_get_functiondef(f)) = 0
     or (select provolatile from pg_proc where oid = f) <> 's'
     or not exists (select 1 from public.client_rpc_registry where function_name = 'pemeliharaan_jendela_tempat' and exposure = 'STAFF') then
    raise exception 'A2b batch 2: the window''s place read, its grants, its controller check or its registry entry is not as intended';
  end if;
end $$;

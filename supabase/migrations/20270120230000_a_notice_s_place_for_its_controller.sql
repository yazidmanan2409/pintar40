-- A2b batch 2 · S-1: a notice's place, for whoever may withdraw it (Sharon, A2B-BATCH2-APP-a186b1a7.md, finding S-1;
-- the Chief Architect, 16 Nov 11:51: fixed in batch 2). DRAFT.
--
-- «Tarik pengumuman» decided its working context (§2.11) from a direct read of broadcast_notices, on which a staff
-- client holds no grant: the read came back empty, the target had no school, and the context check passed having
-- checked nothing. pemeliharaan_pengumuman_tempat(p_notice) gives the notice's platform flag and schools to whoever
-- withdraw_notice would let withdraw it (maintenance_may_act over the notice's own platform flag and schools), and
-- refuses anyone else, and an unknown id, alike with MAINTENANCE_NOT_ALLOWED (no existence oracle). Read only.

create function public.pemeliharaan_pengumuman_tempat(p_notice uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare n public.broadcast_notices;
begin
  select * into n from public.broadcast_notices where id = p_notice;
  if public.current_person_id() is null or n.id is null or not public.maintenance_may_act(n.platform, n.institution_ids) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  return jsonb_build_object('platform', n.platform, 'sekolah', to_jsonb(n.institution_ids));
end $$;
revoke all on function public.pemeliharaan_pengumuman_tempat(uuid) from public, anon, service_role;
grant execute on function public.pemeliharaan_pengumuman_tempat(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('pemeliharaan_pengumuman_tempat', 'STAFF',
   'A2b S-1: a notice''s platform flag and schools, for whoever may withdraw it (withdraw_notice''s rule); anyone else, '
   || 'and an unknown id, MAINTENANCE_NOT_ALLOWED. Read only: the working-context check of «Tarik pengumuman».',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
declare f regprocedure := 'public.pemeliharaan_pengumuman_tempat(uuid)';
begin
  if has_function_privilege('anon', f, 'execute') or has_function_privilege('service_role', f, 'execute')
     or not has_function_privilege('authenticated', f, 'execute')
     or position('maintenance_may_act(n.platform, n.institution_ids)' in pg_get_functiondef(f)) = 0
     or (select provolatile from pg_proc where oid = f) <> 's'
     or not exists (select 1 from public.client_rpc_registry where function_name = 'pemeliharaan_pengumuman_tempat' and exposure = 'STAFF') then
    raise exception 'A2b S-1: the notice''s place read, its grants, its authority check or its registry entry is not as intended';
  end if;
end $$;

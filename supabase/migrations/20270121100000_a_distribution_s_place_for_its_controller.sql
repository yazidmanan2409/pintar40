-- C2w · A2B-R2: a distribution's place, and the open grants, for whoever may withdraw them (Second Eye's S-1 sweep,
-- 16 Nov; the Chief Architect, 16 Nov 11:59: option (b), C2w's first item; TEAM-INSTRUCTIONS register A2B-R2). DRAFT.
--
-- Pustaka PINTAR's «Tarik izin» decided its working context (§2.11) from a direct read of release_distributions, on
-- which a staff client holds no grant: the read came back empty, the target had no school, and the context check
-- passed having checked nothing (withdraw_release_distribution still decided the act). The Kanonik page read the same
-- table for its list of grants still open, so the list was always empty.
--
--   * distribusi_tempat(p_distribution): the grant's release, its owning library and its receiving school, to whoever
--     withdraw_release_distribution would let withdraw it (SYSTEM_ADMIN, or CAN_PUBLISH in the owning library);
--     anyone else, and an unknown id, are refused alike with withdraw's own sentence (no existence oracle). Any status:
--     an already-withdrawn grant is withdraw's to answer (ACTION_UNCHANGED).
--   * distribusi_berlaku(): the ACTIVE grants its caller may withdraw, by the same rule; nothing to anyone else.
-- Both read only.

create function public.distribusi_tempat(p_distribution uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare d record;
begin
  select rd.id, rd.plp_release_id, rd.institution_id, pr.institution_id as owner_id
    into d
    from public.release_distributions rd
    join public.plp_releases pr on pr.id = rd.plp_release_id
   where rd.id = p_distribution;
  if public.current_person_id() is null or d.id is null
     or not (public.is_system_admin() or public.can_in_institution('CAN_PUBLISH', d.owner_id)) then
    raise exception 'withdrawing a distribution requires SYSTEM_ADMIN or CAN_PUBLISH in the owning canonical tenant';
  end if;
  return jsonb_build_object('terbitan', d.plp_release_id, 'pemilik', d.owner_id, 'sekolah', d.institution_id);
end $$;
revoke all on function public.distribusi_tempat(uuid) from public, anon, service_role;
grant execute on function public.distribusi_tempat(uuid) to authenticated;

create function public.distribusi_berlaku()
returns table (id uuid, plp_release_id uuid, institution_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select rd.id, rd.plp_release_id, rd.institution_id
    from public.release_distributions rd
    join public.plp_releases pr on pr.id = rd.plp_release_id
   where rd.status = 'ACTIVE'
     and public.current_person_id() is not null
     and (public.is_system_admin() or public.can_in_institution('CAN_PUBLISH', pr.institution_id))
   order by rd.id
$$;
revoke all on function public.distribusi_berlaku() from public, anon, service_role;
grant execute on function public.distribusi_berlaku() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note) values
  ('distribusi_tempat', 'PLATFORM',
   'C2w A2B-R2: a grant''s release, owning library and receiving school, for whoever may withdraw it '
   || '(withdraw_release_distribution''s rule); anyone else, and an unknown id, withdraw''s own refusal. Read only: the '
   || 'working-context check of «Tarik izin».'),
  ('distribusi_berlaku', 'PLATFORM',
   'C2w A2B-R2: the ACTIVE grants its caller may withdraw (withdraw_release_distribution''s rule); nothing to anyone '
   || 'else. Read only: the Kanonik page''s «Tarik izin» list.')
-- Sharon (C2W-R2-c9d9ae4e.md): do nothing on a conflict, so a re-run never blanks a row's existing kind; the
-- verification block below still holds both rows at PLATFORM
on conflict (function_name) do nothing;

do $$
declare f regprocedure;
begin
  foreach f in array array['public.distribusi_tempat(uuid)', 'public.distribusi_berlaku()']::regprocedure[] loop
    if has_function_privilege('anon', f, 'execute') or has_function_privilege('service_role', f, 'execute')
       or not has_function_privilege('authenticated', f, 'execute')
       or position('public.is_system_admin() or public.can_in_institution(''CAN_PUBLISH''' in pg_get_functiondef(f)) = 0
       or (select provolatile from pg_proc where oid = f) <> 's'
       or not exists (select 1 from public.client_rpc_registry
                       where function_name = (select proname from pg_proc where oid = f) and exposure = 'PLATFORM') then
      raise exception 'C2w A2B-R2: % — its grants, its authority check or its registry entry is not as intended', f;
    end if;
  end loop;
end $$;

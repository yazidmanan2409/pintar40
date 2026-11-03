-- W2.10 (Batch 5; CR-49, R.5, CAP-10; D-153: «PARTIAL — INCOMPLETE» until done): THE PEOPLE WAITING FOR AN ACCOUNT ARE
-- LISTED A PAGE AT A TIME, AND A WHOLE CLASS'S CARDS ARE READ FOR THAT CLASS ALONE.
--
-- Aktivasi read persons_awaiting_account() whole, for every school the reader may provision, and drew every person
-- with an address field and two buttons; the whole-class cards were then grouped in the browser's server render from
-- that same full list and every class's current members. A school with a thousand provisioned learners drew a
-- thousand rows. Batch 4 paged the other platform lists; this one was left, and registered as incomplete (D-153).
--
--   persons_awaiting_account_page(p_sekolah, p_cari, p_hal): exactly persons_awaiting_account's people (no account
--     yet; the reader is Admin platform or may provision people in that school; boleh_kartu as CR-91 says), narrowed to
--     one school when p_sekolah is given, searched by a part of the name or the nomor induk (words, never a pattern),
--     a page of 20 by name, with the total.
--   kelas_menunggu_akun(p_sekolah): for the whole-class cards (M7, D-085), each Kelas with how many of its current
--     members (an enrolment still PENDING or ACTIVE, a membership not closed) wait for an account and may hold a card
--     (CR-91: never a person holding a staff role). Counts only.
--   orang_kelas_menunggu_akun(p_kelas): those learners of one Kelas, by name: what the whole-class run issues, one
--     card per person through /api/akun/aktivasi as before (the database still decides and audits each card).
--
-- persons_awaiting_account() stays (Konfigurasi counts with it; the journeys read it). Nothing here writes.
-- METRIC CATALOGUE AND ENGINE: unchanged.

-- who may see a person waiting for an account: persons_awaiting_account's own predicate, once
create or replace function public.menunggu_akun_boleh(p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.current_person_id() is not null
     and (public.is_system_admin() or public.can_on_node('CAN_PROVISION_PEOPLE', p_institution))
$$;
revoke all on function public.menunggu_akun_boleh(uuid) from public, anon, authenticated;

create or replace function public.persons_awaiting_account_page(p_sekolah uuid default null, p_cari text default null,
                                                                p_hal integer default 1)
returns table (person_id uuid, display_name text, institutional_id text, institution_id uuid, boleh_kartu boolean,
               total bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_dari integer := (greatest(coalesce(p_hal, 1), 1) - 1) * 20;
  v_cari text := nullif(btrim(coalesce(p_cari, '')), '');
  v_pola text;
begin
  v_pola := case when v_cari is null then null
                 else replace(replace(replace(v_cari, '\', '\\'), '%', '\%'), '_', '\_') end;
  return query
    select p.id, p.display_name, ii.institutional_id, ii.institution_id, not public.memegang_peran_staf(p.id),
           count(*) over ()
      from public.institutional_identities ii
      join public.persons p on p.id = ii.person_id
     where not exists (select 1 from public.accounts a where a.person_id = p.id)
       and public.menunggu_akun_boleh(ii.institution_id)
       and (p_sekolah is null or ii.institution_id = p_sekolah)
       and (v_pola is null or p.display_name ilike '%' || v_pola || '%' or ii.institutional_id ilike '%' || v_pola || '%')
     order by p.display_name, ii.institutional_id, p.id
     offset v_dari limit 20;
end $$;
revoke all on function public.persons_awaiting_account_page(uuid, text, integer) from public, anon;
grant execute on function public.persons_awaiting_account_page(uuid, text, integer) to authenticated;

-- the learners of a Kelas who wait for an account and may hold a card (CR-91), as current members of it
create or replace function public.kelas_menunggu_akun_anggota(p_sekolah uuid, p_kelas uuid)
returns table (node_id uuid, institution_id uuid, person_id uuid, display_name text, institutional_id text)
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct m.node_id, n.institution_id, p.id, p.display_name, ii.institutional_id
    from public.memberships m
    join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
    join public.enrollments e on e.id = m.enrollment_id and e.status in ('PENDING', 'ACTIVE')
    join public.persons p on p.id = e.person_id
    join public.institutional_identities ii on ii.person_id = p.id and ii.institution_id = n.institution_id
   where m.valid_to is null
     and (p_kelas is null or m.node_id = p_kelas)
     and (p_sekolah is null or n.institution_id = p_sekolah)
     and not exists (select 1 from public.accounts a where a.person_id = p.id)
     and not public.memegang_peran_staf(p.id)
     and public.menunggu_akun_boleh(n.institution_id)
$$;
revoke all on function public.kelas_menunggu_akun_anggota(uuid, uuid) from public, anon, authenticated;

create or replace function public.kelas_menunggu_akun(p_sekolah uuid default null)
returns table (node_id uuid, institution_id uuid, jumlah integer)
language sql stable security definer set search_path = public, pg_temp as $$
  select x.node_id, x.institution_id, count(*)::integer
    from public.kelas_menunggu_akun_anggota(p_sekolah, null) x
   group by x.node_id, x.institution_id
$$;
revoke all on function public.kelas_menunggu_akun(uuid) from public, anon;
grant execute on function public.kelas_menunggu_akun(uuid) to authenticated;

create or replace function public.orang_kelas_menunggu_akun(p_kelas uuid)
returns table (person_id uuid, display_name text, institutional_id text)
language sql stable security definer set search_path = public, pg_temp as $$
  select x.person_id, x.display_name, x.institutional_id
    from public.kelas_menunggu_akun_anggota(null, p_kelas) x
   where p_kelas is not null
   order by x.display_name, x.institutional_id, x.person_id
$$;
revoke all on function public.orang_kelas_menunggu_akun(uuid) from public, anon;
grant execute on function public.orang_kelas_menunggu_akun(uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('persons_awaiting_account_page', 'STAFF',
   'W2.10 (D-153): persons_awaiting_account''s people (Admin platform, or CAN_PROVISION_PEOPLE in the school), one school '
   'or every school the reader may provision, searched by name or nomor induk, a page of 20 with the total; boleh_kartu '
   'as CR-91. Read only.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('kelas_menunggu_akun', 'STAFF',
   'W2.10 / M7: per Kelas, how many current members wait for an account and may hold a card (CR-91), under '
   'persons_awaiting_account''s rule. Counts only.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE'),
  ('orang_kelas_menunggu_akun', 'STAFF',
   'W2.10 / M7: one Kelas''s current members waiting for an account who may hold a card, by name, for the whole-class '
   'run; each card is still decided per person by /api/akun/aktivasi. Read only.', 'CAPABILITY', 'CAN_PROVISION_PEOPLE')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
begin
  if position('menunggu_akun_boleh' in pg_get_functiondef('public.persons_awaiting_account_page(uuid, text, integer)'::regprocedure)) = 0
     or position('memegang_peran_staf' in pg_get_functiondef('public.kelas_menunggu_akun_anggota(uuid, uuid)'::regprocedure)) = 0
     or position('menunggu_akun_boleh' in pg_get_functiondef('public.kelas_menunggu_akun_anggota(uuid, uuid)'::regprocedure)) = 0 then
    raise exception 'a waiting-for-account read does not ask persons_awaiting_account''s rule, or offers a card to staff';
  end if;
  if has_function_privilege('anon', 'public.persons_awaiting_account_page(uuid, text, integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.kelas_menunggu_akun(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.orang_kelas_menunggu_akun(uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.kelas_menunggu_akun_anggota(uuid, uuid)', 'EXECUTE') then
    raise exception 'a waiting-for-account read is reachable beyond its callers';
  end if;
end $$;

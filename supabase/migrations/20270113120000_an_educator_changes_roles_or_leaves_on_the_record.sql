-- ---------------------------------------------------------------------------
-- E5 AND «UBAH PERAN & TANGGUNG JAWAB» (owner, 9 Nov: close the educator role/responsibility journey; E5 with a
-- category). ACCOUNT-LIFECYCLE-INVENTORY.md §4, §5 (E5) and §11, reusing everything that exists:
--   * role_assignments rows stay dated, immutable and audited per row (role_assignments_guard, role.granted /
--     role.revoked); a revocation is written once, a restoration is a new grant;
--   * every grant passes the guard unchanged (INV-16 self-grant, SYSTEM_ADMIN platform-only, INSTITUTION_ADMIN only at
--     the school's own node, D-049's «a person the school already has»), because the functions below insert and update
--     the table as the signed-in admin: the guard decides on the person, inside one transaction;
--   * responsibilities come from role_capabilities (the one registry) plus the management-decision rule
--     (HEAD_OF_DEPARTMENT and DEAN decide management decisions by role); no list is kept by hand;
--   * authority ends at the next request: capabilities are read live (CABUT-A01).
--
-- E5 akhiri_tugas_staf(person, school, category, reason, date): ends all of the person's live roles at this school, with
--   a category (RETIREMENT, RESIGNATION, DISMISSAL, TRANSFER, CONTRACT_END, CORRECTION, OTHER), a reason of 10–300
--   characters, and the date of the departure as a fact (the school's today or earlier, never before the person's
--   first live role there). The person, the account and other schools are untouched; attribution stays (E6). One
--   staff.ended_at_school audit row with the category, the reason, the date and the roles ended.
-- §11 peran_orang(person, school): the person's live roles at the school, each with its place, its end date and the
--   responsibilities it carries, and a fingerprint of the set.
-- §11 ubah_peran(person, school, add, remove, reason, fingerprint, admin_confirmed, apply): add and remove roles in one
--   transaction, or (apply false) only say what would happen: responsibilities gained, kept and lost, each with its
--   place; what is never given (no SYSTEM_ADMIN; nothing at another school); INSTITUTION_ADMIN only with its second
--   press (D-101(2)); and the queues that would be left with no one to decide them (management decisions waiting at a
--   place whose last Kepala departemen or Dekan is removed): warned, never reassigned. A stale preview is refused
--   (the fingerprint); concurrent changes to one person serialise on the person's row. One role.changed audit row
--   beside the per-row ones.
-- Refusals are PR130 with the code in DETAIL.
-- ---------------------------------------------------------------------------

create or replace function public.staf_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR130',
    detail  = p_code,
    message = case p_code
      when 'STAFF_NOT_ALLOWED'      then 'changing a person''s roles at a school needs INSTITUTION_ADMIN of that school'
      when 'STAFF_SELF'             then 'an administrator does not change or end their own roles'
      when 'STAFF_NOT_ACTIVE'       then 'this person holds no live role at this school'
      when 'STAFF_CATEGORY_INVALID' then 'the category is one of the listed ones'
      when 'STAFF_REASON_REQUIRED'  then 'the reason is 10 to 300 characters'
      when 'STAFF_DATE_INVALID'     then 'the date is today or earlier, and not before the person''s first live role here'
      when 'ROLE_STALE'             then 'the person''s roles changed since this review; review them again'
      when 'ROLE_NOTHING'           then 'the change adds and removes nothing'
      when 'ROLE_NOT_ALLOWED'       then 'this role is not given from a school (SYSTEM_ADMIN), or not to this place'
      when 'ROLE_SCOPE_INVALID'     then 'the place is not an active part of this school'
      when 'ROLE_UNTIL_INVALID'     then 'a role ends after today'
      when 'ROLE_ADMIN_UNCONFIRMED' then 'naming another Admin sekolah needs its own confirmation (D-101)'
      when 'ROLE_REMOVE_INVALID'    then 'a role to remove is not this person''s live role at this school'
      else 'the roles could not be changed' end;
end $$;
revoke all on function public.staf_tolak(text) from public, anon, authenticated;

-- the person's live roles at one school (no authorization: an internal read)
create or replace function public.staf_peran_hidup(p_person uuid, p_institution uuid)
returns setof public.role_assignments language sql stable security definer set search_path = public, pg_temp as $$
  select ra.* from public.role_assignments ra
   where ra.person_id = p_person and ra.institution_id = p_institution and ra.role <> 'SYSTEM_ADMIN'
     and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
$$;
revoke all on function public.staf_peran_hidup(uuid, uuid) from public, anon, authenticated;

create or replace function public.staf_sidik(p_person uuid, p_institution uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select md5(coalesce(string_agg(x.id::text, ',' order by x.id), '')) from public.staf_peran_hidup(p_person, p_institution) x
$$;
revoke all on function public.staf_sidik(uuid, uuid) from public, anon, authenticated;

-- the responsibilities a role carries: the registry's capabilities, and the management-decision rule by role
create or replace function public.staf_tanggung_jawab(p_role public.app_role)
returns text[] language sql stable security definer set search_path = public, pg_temp as $$
  select array(select c from unnest(public.role_capabilities(p_role)) c order by c)
         || case when p_role in ('HEAD_OF_DEPARTMENT', 'DEAN') then array['MANAGEMENT_DECISION'] else '{}'::text[] end
$$;
revoke all on function public.staf_tanggung_jawab(public.app_role) from public, anon, authenticated;

create or replace function public.staf_boleh(p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.current_person_id() is not null and (public.is_system_admin() or public.has_scope('INSTITUTION_ADMIN', p_institution))
$$;
revoke all on function public.staf_boleh(uuid) from public, anon, authenticated;

create or replace function public.peran_orang(p_person uuid, p_institution uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.staf_boleh(p_institution) then perform public.staf_tolak('STAFF_NOT_ALLOWED'); end if;
  return jsonb_build_object(
    'person_id', p_person,
    'nama', (select p.display_name from public.persons p where p.id = p_person),
    'sidik', public.staf_sidik(p_person, p_institution),
    'peran', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'role', x.role, 'tempat_id', x.scope_node_id,
                                                           'tempat', n.name, 'jenis_tempat', n.kind, 'sampai', x.valid_until,
                                                           'tanggung_jawab', to_jsonb(public.staf_tanggung_jawab(x.role)))
                                        order by public.role_rank(x.role) desc, n.name)
                         from public.staf_peran_hidup(p_person, p_institution) x
                         join public.org_nodes n on n.id = x.scope_node_id), '[]'::jsonb));
end $$;
revoke all on function public.peran_orang(uuid, uuid) from public, anon, authenticated;
grant execute on function public.peran_orang(uuid, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ E5 «Akhiri tugas di sekolah ini»
create or replace function public.akhiri_tugas_staf(p_person uuid, p_institution uuid, p_kategori text, p_alasan text, p_tanggal date)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); v_alasan text := btrim(coalesce(p_alasan, ''));
        v_hari date := (now() at time zone 'Asia/Jakarta')::date; v_tgl date := coalesce(p_tanggal, (now() at time zone 'Asia/Jakarta')::date);
        v_awal date; v_ids jsonb; v_n int;
begin
  if not public.staf_boleh(p_institution) then perform public.staf_tolak('STAFF_NOT_ALLOWED'); end if;
  if p_person = v_actor then perform public.staf_tolak('STAFF_SELF'); end if;
  perform 1 from public.persons where id = p_person for update;
  if p_kategori is null or p_kategori not in ('RETIREMENT', 'RESIGNATION', 'DISMISSAL', 'TRANSFER', 'CONTRACT_END', 'CORRECTION', 'OTHER') then
    perform public.staf_tolak('STAFF_CATEGORY_INVALID');
  end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.staf_tolak('STAFF_REASON_REQUIRED'); end if;
  select count(*), min((x.valid_from at time zone 'Asia/Jakarta')::date),
         jsonb_agg(jsonb_build_object('id', x.id, 'role', x.role, 'scope_node_id', x.scope_node_id) order by x.id)
    into v_n, v_awal, v_ids from public.staf_peran_hidup(p_person, p_institution) x;
  if v_n = 0 then perform public.staf_tolak('STAFF_NOT_ACTIVE'); end if;
  if v_tgl > v_hari or v_tgl < v_awal then perform public.staf_tolak('STAFF_DATE_INVALID'); end if;

  -- each role ends once, through the guard and its per-row audit (role.revoked with the reason)
  update public.role_assignments ra set revoked_at = now(), revoked_by = v_actor, revoked_reason = v_alasan
   where ra.id in (select x.id from public.staf_peran_hidup(p_person, p_institution) x);
  perform public.audit_write('staff.ended_at_school', 'persons', p_person::text, p_institution,
    jsonb_build_object('person_id', p_person, 'reason_code', p_kategori, 'reason', v_alasan, 'effective_date', v_tgl::text,
                       'roles_ended', v_ids, 'actor_role', public.audit_actor_role(p_institution)));
  return jsonb_build_object('ok', true, 'diakhiri', v_n);
end $$;
revoke all on function public.akhiri_tugas_staf(uuid, uuid, text, text, date) from public, anon, authenticated;
grant execute on function public.akhiri_tugas_staf(uuid, uuid, text, text, date) to authenticated;

-- ═══════════════════════════════════════════════════════════ §11 «Ubah peran & tanggung jawab»
create or replace function public.ubah_peran(p_person uuid, p_institution uuid, p_tambah jsonb, p_cabut uuid[], p_alasan text,
                                             p_sidik text, p_konfirmasi_admin boolean, p_terapkan boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_actor uuid := public.current_person_id(); v_alasan text := btrim(coalesce(p_alasan, '')); t jsonb; v_role public.app_role;
  v_node public.org_nodes; v_until timestamptz; v_cabut uuid[] := coalesce(p_cabut, '{}'); v_lama text[]; v_baru text[];
  v_tetap jsonb; v_dapat jsonb; v_hilang jsonb; v_antre jsonb; v_granted jsonb := '[]'; v_revoked jsonb; v_id uuid; v_admin boolean := false;
begin
  if not public.staf_boleh(p_institution) then perform public.staf_tolak('STAFF_NOT_ALLOWED'); end if;
  if p_person = v_actor then perform public.staf_tolak('STAFF_SELF'); end if;
  if p_terapkan then perform 1 from public.persons where id = p_person for update; end if;
  if p_sidik is distinct from public.staf_sidik(p_person, p_institution) then perform public.staf_tolak('ROLE_STALE'); end if;
  if jsonb_array_length(coalesce(p_tambah, '[]')) = 0 and cardinality(v_cabut) = 0 then perform public.staf_tolak('ROLE_NOTHING'); end if;
  if exists (select 1 from unnest(v_cabut) c where c not in (select x.id from public.staf_peran_hidup(p_person, p_institution) x)) then
    perform public.staf_tolak('ROLE_REMOVE_INVALID');
  end if;
  -- each addition: a school role, at an active place of this school, ending after today
  for t in select * from jsonb_array_elements(coalesce(p_tambah, '[]')) loop
    begin v_role := (t ->> 'role')::public.app_role; exception when others then perform public.staf_tolak('ROLE_NOT_ALLOWED'); end;
    if v_role in ('SYSTEM_ADMIN', 'STUDENT') then perform public.staf_tolak('ROLE_NOT_ALLOWED'); end if;
    select * into v_node from public.org_nodes n where n.id = nullif(t ->> 'scope_node_id', '')::uuid;
    if v_node.id is null or v_node.institution_id <> p_institution or not v_node.is_active then perform public.staf_tolak('ROLE_SCOPE_INVALID'); end if;
    if v_role = 'INSTITUTION_ADMIN' then
      if v_node.kind <> 'INSTITUTION' then perform public.staf_tolak('ROLE_NOT_ALLOWED'); end if;
      v_admin := true;
    end if;
    v_until := nullif(t ->> 'valid_until', '')::timestamptz;
    if v_until is null or v_until <= now() then perform public.staf_tolak('ROLE_UNTIL_INVALID'); end if;
  end loop;
  if v_admin and not coalesce(p_konfirmasi_admin, false) then perform public.staf_tolak('ROLE_ADMIN_UNCONFIRMED'); end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.staf_tolak('STAFF_REASON_REQUIRED'); end if;

  -- responsibilities, each with its place: before (all live roles), after (those kept plus those added)
  with sebelum as (
         select x.scope_node_id as tempat, unnest(public.staf_tanggung_jawab(x.role)) as tj
           from public.staf_peran_hidup(p_person, p_institution) x),
       sesudah as (
         select x.scope_node_id as tempat, unnest(public.staf_tanggung_jawab(x.role)) as tj
           from public.staf_peran_hidup(p_person, p_institution) x where x.id <> all (v_cabut)
         union
         select (a ->> 'scope_node_id')::uuid, unnest(public.staf_tanggung_jawab((a ->> 'role')::public.app_role))
           from jsonb_array_elements(coalesce(p_tambah, '[]')) a),
       nama as (select n.id, n.name from public.org_nodes n where n.institution_id = p_institution)
  select coalesce((select jsonb_agg(distinct jsonb_build_object('tj', s.tj, 'tempat', nm.name)) from sesudah s join nama nm on nm.id = s.tempat
                    where (s.tempat, s.tj) in (select b.tempat, b.tj from sebelum b)), '[]'),
         coalesce((select jsonb_agg(distinct jsonb_build_object('tj', s.tj, 'tempat', nm.name)) from sesudah s join nama nm on nm.id = s.tempat
                    where (s.tempat, s.tj) not in (select b.tempat, b.tj from sebelum b)), '[]'),
         coalesce((select jsonb_agg(distinct jsonb_build_object('tj', b.tj, 'tempat', nm.name)) from sebelum b join nama nm on nm.id = b.tempat
                    where (b.tempat, b.tj) not in (select s.tempat, s.tj from sesudah s)), '[]')
    into v_tetap, v_dapat, v_hilang;

  -- the queues: management decisions waiting at a place no Kepala departemen or Dekan would hold after the change
  select coalesce(jsonb_agg(jsonb_build_object('tempat', q.name, 'menunggu', q.n)), '[]') into v_antre from (
    select n.name, count(*) as n
      from public.management_decisions md join public.org_nodes n on n.id = md.scope_node_id
     where md.institution_id = p_institution and md.state <> 'DECIDED'
       and exists (select 1 from public.role_assignments ra join public.org_nodes rn on rn.id = ra.scope_node_id
                    where ra.id = any (v_cabut) and ra.role in ('HEAD_OF_DEPARTMENT', 'DEAN')
                      and (n.id = rn.id or n.jalur @> array[rn.id]))
       and not exists (select 1 from public.role_assignments ra2 join public.org_nodes an on an.id = ra2.scope_node_id
                        where ra2.institution_id = p_institution and ra2.role in ('HEAD_OF_DEPARTMENT', 'DEAN')
                          and ra2.revoked_at is null and now() >= ra2.valid_from and now() < ra2.valid_until
                          and ra2.id <> all (v_cabut) and ra2.person_id <> md.raised_by_person_id
                          and (n.id = an.id or n.jalur @> array[an.id]))
     group by n.name) q;

  if not p_terapkan then
    return jsonb_build_object('pratinjau', true, 'tetap', v_tetap, 'dapat', v_dapat, 'hilang', v_hilang, 'antrean', v_antre,
                              'tidak_diberikan', jsonb_build_array('SYSTEM_ADMIN'), 'butuh_konfirmasi_admin', v_admin);
  end if;

  -- grants first, then revocations: the guard's «a person this school already has» (D-049) reads the person's live roles,
  -- so a move revokes the old place only once the new one is held. Both are stamped now(), one instant: no gap, no overlap.
  for t in select * from jsonb_array_elements(coalesce(p_tambah, '[]')) loop
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_person, (t ->> 'role')::public.app_role, (t ->> 'scope_node_id')::uuid, (t ->> 'valid_until')::timestamptz)
    returning id into v_id;
    v_granted := v_granted || jsonb_build_array(jsonb_build_object('id', v_id, 'role', t ->> 'role', 'scope_node_id', t ->> 'scope_node_id'));
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('id', ra.id, 'role', ra.role, 'scope_node_id', ra.scope_node_id) order by ra.id), '[]')
    into v_revoked from public.role_assignments ra where ra.id = any (v_cabut);
  update public.role_assignments ra set revoked_at = now(), revoked_by = v_actor, revoked_reason = v_alasan where ra.id = any (v_cabut);
  perform public.audit_write('role.changed', 'persons', p_person::text, p_institution,
    jsonb_build_object('person_id', p_person, 'reason', v_alasan, 'granted', v_granted, 'revoked', v_revoked,
                       'queues_unattended', v_antre, 'actor_role', public.audit_actor_role(p_institution)));
  return jsonb_build_object('ok', true, 'diberikan', jsonb_array_length(v_granted), 'dicabut', cardinality(v_cabut),
                            'tetap', v_tetap, 'dapat', v_dapat, 'hilang', v_hilang, 'antrean', v_antre);
end $$;
revoke all on function public.ubah_peran(uuid, uuid, jsonb, uuid[], text, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.ubah_peran(uuid, uuid, jsonb, uuid[], text, text, boolean, boolean) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('peran_orang', 'STAFF',
   '§11: one person''s live roles at one school, each with its place, its end and the responsibilities it carries '
   || '(role_capabilities plus the management-decision rule), and the set''s fingerprint. INSTITUTION_ADMIN of the school.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('akhiri_tugas_staf', 'STAFF',
   'E5: ends all of a person''s live roles at one school with a category, a 10-300 reason and the departure''s date '
   || '(today or earlier, never before the first live role); each revocation through the guard and its per-row audit, '
   || 'one staff.ended_at_school row. Never the admin''s own. Refusals PR130 with a code in DETAIL.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('ubah_peran', 'STAFF',
   '§11: adds and removes a person''s roles at one school in one transaction through the guard, or previews it '
   || '(gained, kept, lost, not given, the INSTITUTION_ADMIN second press, unattended queues). A stale fingerprint is '
   || 'refused; changes to one person serialise on the person''s row; one role.changed audit row. Refusals PR130.',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

do $$
begin
  if has_function_privilege('anon', 'public.ubah_peran(uuid, uuid, jsonb, uuid[], text, text, boolean, boolean)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.akhiri_tugas_staf(uuid, uuid, text, text, date)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.peran_orang(uuid, uuid)'::regprocedure, 'execute') then
    raise exception 'E5/§11: an anonymous caller can change roles';
  end if;
  if has_function_privilege('authenticated', 'public.staf_peran_hidup(uuid, uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.staf_sidik(uuid, uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.staf_tanggung_jawab(public.app_role)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.staf_boleh(uuid)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.staf_tolak(text)'::regprocedure, 'execute') then
    raise exception 'E5/§11: an internal helper is callable by a client';
  end if;
end $$;

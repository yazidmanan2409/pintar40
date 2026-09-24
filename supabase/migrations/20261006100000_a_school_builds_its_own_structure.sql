-- ---------------------------------------------------------------------------
-- BOB-01 — A SCHOOL BUILDS ITS OWN STRUCTURE (D-006, audit B1 and M5a).
--
-- The app could not create a Bagian, a Tingkat or a Kelas. Classes were built
-- by an operator in SQL (D-016), students could not be placed, and teachers had
-- no class. The org tree and its rules already existed; what was missing was a
-- way to use them that speaks the school's language and returns something a
-- screen can say.
--
-- THE MAPPING (D-006), onto the existing ladder, with no schema change:
--
--     INSTITUTION  the school (its root node id is the institution id)
--     FACULTY      "Jenjang"   hidden, one per school, created on first need
--     DEPARTMENT   "Bagian"    shown
--     PROGRAMME    "Reguler"   hidden, one per Bagian, created with it
--     COHORT       "Tingkat"   shown, carries the academic year
--     CLASS        "Kelas"     shown, carries its Tingkat's academic year
--
-- The ladder forces one PROGRAMME between a DEPARTMENT and a COHORT, so the
-- hidden Reguler is per Bagian, not per school.
--
-- THE FUNCTIONS
--   school_structure(p_institution)                         the list the screen shows
--   create_bagian(p_institution, p_name)                    → the new Bagian's id
--   create_tingkat(p_bagian_node, p_name, p_academic_year)  → the new Tingkat's id
--   create_kelas(p_tingkat_node, p_name, p_academic_year)   → the new Kelas's id
--   rename_school_node(p_node, p_name)
--   deactivate_school_node(p_node)
--
-- WHO. An Admin sekolah (INSTITUTION_ADMIN scoped at the school) and an Admin
-- platform (SYSTEM_ADMIN). has_scope('INSTITUTION_ADMIN', <school root>) is
-- exactly that pair. Everyone else is refused, and so is anyone acting on
-- another school's node. An unknown node and a forbidden node give the same
-- refusal, so the refusal is not an existence oracle.
--
-- HOW A REFUSAL READS (D-011). SQLSTATE PR020, with the stable code in DETAIL.
-- The MESSAGE is for a developer and names the requirement; it never reaches a
-- screen. src/lib/struktur-kontrak.ts reads the code and nothing else.
--
--   STRUCTURE_NOT_ALLOWED          not an Admin sekolah or Admin platform for this
--                                  school, or no such node
--   STRUCTURE_NAME_INVALID         empty, longer than 80 characters, or contains
--                                  control characters
--   STRUCTURE_NAME_TAKEN           an active sibling already has this name (a Kelas:
--                                  anywhere in the school in the same year)
--   STRUCTURE_YEAR_INVALID         not "YYYY/YYYY+1"
--   STRUCTURE_YEAR_MISMATCH        a Kelas's year is not its Tingkat's year
--   STRUCTURE_PARENT_INVALID       the parent is not the kind this call needs
--   STRUCTURE_PARENT_INACTIVE      the parent has been deactivated
--   STRUCTURE_NODE_INVALID         not a Bagian, Tingkat or Kelas (the school and the
--                                  hidden nodes are not renamed or deactivated here)
--   STRUCTURE_HAS_ACTIVE_CHILDREN  deactivating it would orphan an active child
--   STRUCTURE_HAS_MEMBERS          students are still placed in it
--   STRUCTURE_HAS_STAFF            a role is still scoped to it
--
-- M5a. The intake's "Tempat" accepted any node for a learner, and the row then
-- failed at provisioning with a database sentence, or not at all: memberships
-- accept only a COHORT or CLASS of the node's own academic period, and the
-- intake enrolled into the school's NEWEST period whatever the node's was.
-- Now import_row_problems refuses a learner row whose place is not an active
-- Kelas or Tingkat, with its own phrase, and import_advance enrols into the
-- place's own academic year.
--
-- Nothing here creates a `classes` row: its subject is required and unknown at
-- this point. Teacher surfaces read `classes` optionally.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. INTERNAL HELPERS. Not client-callable; they run with the rights of the
--    SECURITY DEFINER function that calls them.
-- ---------------------------------------------------------------------------

-- The one way a structure call refuses.
create function public.structure_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR020',
    detail  = p_code,
    message = case p_code
      when 'STRUCTURE_NOT_ALLOWED'         then 'changing the school structure needs INSTITUTION_ADMIN at this school, or SYSTEM_ADMIN'
      when 'STRUCTURE_NAME_INVALID'        then 'a structure name is 1 to 80 characters, without control characters'
      when 'STRUCTURE_NAME_TAKEN'          then 'an active sibling already has this name'
      when 'STRUCTURE_YEAR_INVALID'        then 'an academic year is written YYYY/YYYY+1'
      when 'STRUCTURE_YEAR_MISMATCH'       then 'a Kelas carries its Tingkat''s academic year'
      when 'STRUCTURE_PARENT_INVALID'      then 'the parent is not the kind of node this call needs'
      when 'STRUCTURE_PARENT_INACTIVE'     then 'the parent has been deactivated'
      when 'STRUCTURE_NODE_INVALID'        then 'only a Bagian, Tingkat or Kelas is changed here'
      when 'STRUCTURE_HAS_ACTIVE_CHILDREN' then 'deactivate the active children first'
      when 'STRUCTURE_HAS_MEMBERS'         then 'students are still placed here'
      when 'STRUCTURE_HAS_STAFF'           then 'a role is still scoped to this node'
      else 'the school structure could not be changed' end;
end $$;
revoke all on function public.structure_refuse(text) from public, anon, authenticated;

-- The node a structure call acts on, once the caller may act on its school.
-- Authorization comes BEFORE anything is said about the node, so a caller
-- outside the school learns neither whether it exists nor what kind it is.
create function public.structure_node(p_node uuid)
returns public.org_nodes language plpgsql stable set search_path = public, pg_temp as $$
declare v public.org_nodes;
begin
  select * into v from public.org_nodes n where n.id = p_node;
  if v.id is null or not public.has_scope('INSTITUTION_ADMIN', v.institution_id) then
    perform public.structure_refuse('STRUCTURE_NOT_ALLOWED');
  end if;
  return v;
end $$;
revoke all on function public.structure_node(uuid) from public, anon, authenticated;

-- A name as it will be stored: trimmed, inner whitespace collapsed.
create function public.structure_clean_name(p_name text)
returns text language plpgsql stable set search_path = public, pg_temp as $$
declare v text;
begin
  v := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if v = '' or length(v) > 80 or v ~ '[[:cntrl:]]' then
    perform public.structure_refuse('STRUCTURE_NAME_INVALID');
  end if;
  return v;
end $$;
revoke all on function public.structure_clean_name(text) from public, anon, authenticated;

-- "2026/2027" → 2026. The school year runs 1 July to 30 June.
create function public.structure_year_start(p_year text)
returns int language plpgsql stable set search_path = public, pg_temp as $$
declare m text[]; y int;
begin
  m := regexp_match(coalesce(p_year, ''), '^\s*(\d{4})\s*/\s*(\d{4})\s*$');
  if m is null then perform public.structure_refuse('STRUCTURE_YEAR_INVALID'); end if;
  y := m[1]::int;
  if m[2]::int <> y + 1 or y < 2000 or y > 2098 then
    perform public.structure_refuse('STRUCTURE_YEAR_INVALID');
  end if;
  return y;
end $$;
revoke all on function public.structure_year_start(text) from public, anon, authenticated;

-- The school's academic period for a year, found by name or created. A period
-- someone already made under that name is reused whatever its dates:
-- academic_periods is append-only and unique on (institution, name).
create function public.structure_period(p_institution uuid, p_year text)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare y int; v_name text; v uuid;
begin
  y := public.structure_year_start(p_year);
  v_name := y::text || '/' || (y + 1)::text;
  select ap.id into v from public.academic_periods ap
   where ap.institution_id = p_institution and ap.name = v_name;
  if v is null then
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (p_institution, v_name, make_date(y, 7, 1), make_date(y + 1, 6, 30))
    returning id into v;
    perform public.audit_write('structure.academic_year_created', 'academic_periods', v::text, p_institution,
      jsonb_build_object('name', v_name));
  end if;
  return v;
end $$;
revoke all on function public.structure_period(uuid, text) from public, anon, authenticated;

-- The hidden Jenjang: one per school, created the first time it is needed. A
-- school whose FACULTY was built earlier (D-016) keeps the one it has.
create function public.structure_jenjang(p_institution uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v uuid;
begin
  select n.id into v from public.org_nodes n
   where n.institution_id = p_institution and n.parent_id = p_institution
     and n.kind = 'FACULTY' and n.is_active
   order by (n.name = 'Jenjang') desc, n.created_at, n.id limit 1;
  if v is null then
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (p_institution, p_institution, 'FACULTY', 'Jenjang') returning id into v;
    perform public.audit_write('structure.jenjang_created', 'org_nodes', v::text, p_institution,
      jsonb_build_object('hidden', true));
  end if;
  return v;
end $$;
revoke all on function public.structure_jenjang(uuid) from public, anon, authenticated;

-- The hidden Reguler under one Bagian, created with the Bagian, or on first
-- need for a Bagian built earlier.
create function public.structure_reguler(p_bagian uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v uuid; v_inst uuid;
begin
  select n.id into v from public.org_nodes n
   where n.parent_id = p_bagian and n.kind = 'PROGRAMME' and n.is_active
   order by (n.name = 'Reguler') desc, n.created_at, n.id limit 1;
  if v is null then
    select b.institution_id into v_inst from public.org_nodes b where b.id = p_bagian;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, p_bagian, 'PROGRAMME', 'Reguler') returning id into v;
    perform public.audit_write('structure.reguler_created', 'org_nodes', v::text, v_inst,
      jsonb_build_object('hidden', true, 'bagian', p_bagian));
  end if;
  return v;
end $$;
revoke all on function public.structure_reguler(uuid) from public, anon, authenticated;

-- Structure writes for one school happen one at a time, so two admins adding
-- the first Bagian at once cannot make two Jenjang, a name check cannot race
-- the insert it guards, and a Kelas cannot be added under a Tingkat that is
-- being deactivated. Every write takes it straight after authorization and
-- reads its node again under it.
create function public.structure_lock(p_institution uuid)
returns void language sql set search_path = public, pg_temp as $$
  select pg_advisory_xact_lock(hashtextextended('pintar.structure:' || p_institution::text, 0))
$$;
revoke all on function public.structure_lock(uuid) from public, anon, authenticated;

-- Would this name collide with an active sibling? A Bagian among the school's
-- Bagian; a Tingkat among its Bagian's Tingkat of the same year; a Kelas among
-- the school's Kelas of the same year, because the school's own lists name a
-- class as "school · class" (the Murid sheet) and two "1A"s would be one.
create function public.structure_name_taken(p_institution uuid, p_kind public.org_kind, p_name text,
                                            p_bagian uuid, p_period uuid, p_except uuid)
returns boolean language sql stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.org_nodes n
     where n.institution_id = p_institution and n.kind = p_kind and n.is_active
       and lower(n.name) = lower(p_name)
       and n.id is distinct from p_except
       and (p_kind <> 'COHORT' or (n.academic_period_id = p_period
             and exists (select 1 from public.org_nodes pr where pr.id = n.parent_id and pr.parent_id = p_bagian)))
       and (p_kind <> 'CLASS' or n.academic_period_id = p_period))
$$;
revoke all on function public.structure_name_taken(uuid, public.org_kind, text, uuid, uuid, uuid)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. THE LIST
-- ---------------------------------------------------------------------------
create function public.school_structure(p_institution uuid)
returns table (node_id uuid, level text, parent_id uuid, name text, academic_year text,
               is_active boolean, active_members int)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.org_nodes r where r.id = p_institution and r.kind = 'INSTITUTION')
     or not public.has_scope('INSTITUTION_ADMIN', p_institution) then
    perform public.structure_refuse('STRUCTURE_NOT_ALLOWED');
  end if;
  return query
    select n.id,
           case n.kind when 'DEPARTMENT' then 'BAGIAN' when 'COHORT' then 'TINGKAT' else 'KELAS' end,
           -- the parent the screen shows: none for a Bagian, the Bagian above
           -- the hidden Reguler for a Tingkat, the Tingkat for a Kelas
           case n.kind when 'DEPARTMENT' then null::uuid
                       when 'COHORT' then (select pr.parent_id from public.org_nodes pr where pr.id = n.parent_id)
                       else n.parent_id end,
           n.name, ap.name, n.is_active,
           case when n.kind = 'DEPARTMENT' then null::int
                else (select count(*)::int from public.memberships m
                       where m.node_id = n.id and m.valid_to is null) end
      from public.org_nodes n
      left join public.academic_periods ap on ap.id = n.academic_period_id
     where n.institution_id = p_institution
       and n.kind in ('DEPARTMENT', 'COHORT', 'CLASS')
     order by public.org_kind_level(n.kind), lower(n.name), ap.name, n.id;
end $$;
revoke all on function public.school_structure(uuid) from public, anon, authenticated;
grant execute on function public.school_structure(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. CREATE
-- ---------------------------------------------------------------------------
create function public.create_bagian(p_institution uuid, p_name text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.org_nodes; v_name text; v_jenjang uuid; v_id uuid; v_reguler uuid;
begin
  r := public.structure_node(p_institution);
  perform public.structure_lock(r.institution_id);
  if r.kind <> 'INSTITUTION' then perform public.structure_refuse('STRUCTURE_PARENT_INVALID'); end if;
  v_name := public.structure_clean_name(p_name);
  if public.structure_name_taken(r.id, 'DEPARTMENT', v_name, null, null, null) then
    perform public.structure_refuse('STRUCTURE_NAME_TAKEN');
  end if;
  v_jenjang := public.structure_jenjang(r.id);
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (r.id, v_jenjang, 'DEPARTMENT', v_name) returning id into v_id;
  v_reguler := public.structure_reguler(v_id);
  perform public.audit_write('structure.bagian_created', 'org_nodes', v_id::text, r.id,
    jsonb_build_object('name', v_name, 'jenjang', v_jenjang, 'reguler', v_reguler));
  return v_id;
end $$;
revoke all on function public.create_bagian(uuid, text) from public, anon, authenticated;
grant execute on function public.create_bagian(uuid, text) to authenticated;

create function public.create_tingkat(p_bagian_node uuid, p_name text, p_academic_year text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare b public.org_nodes; v_name text; v_period uuid; v_reguler uuid; v_id uuid;
begin
  b := public.structure_node(p_bagian_node);
  perform public.structure_lock(b.institution_id);
  -- read again under the lock: a concurrent change to this school's
  -- structure has either committed or not begun
  select * into b from public.org_nodes o where o.id = b.id;
  if b.kind <> 'DEPARTMENT' then perform public.structure_refuse('STRUCTURE_PARENT_INVALID'); end if;
  if not b.is_active then perform public.structure_refuse('STRUCTURE_PARENT_INACTIVE'); end if;
  v_name := public.structure_clean_name(p_name);
  perform public.structure_year_start(p_academic_year);
  v_period := public.structure_period(b.institution_id, p_academic_year);
  if public.structure_name_taken(b.institution_id, 'COHORT', v_name, b.id, v_period, null) then
    perform public.structure_refuse('STRUCTURE_NAME_TAKEN');
  end if;
  v_reguler := public.structure_reguler(b.id);
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (b.institution_id, v_reguler, 'COHORT', v_name, v_period) returning id into v_id;
  perform public.audit_write('structure.tingkat_created', 'org_nodes', v_id::text, b.institution_id,
    jsonb_build_object('name', v_name, 'bagian', b.id, 'academic_period', v_period));
  return v_id;
end $$;
revoke all on function public.create_tingkat(uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_tingkat(uuid, text, text) to authenticated;

-- The year is optional because a Kelas takes its Tingkat's; when the caller
-- states one (the Kelas sheet has a column for it), it must be that year.
create function public.create_kelas(p_tingkat_node uuid, p_name text, p_academic_year text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.org_nodes; v_name text; v_year text; y int; v_id uuid;
begin
  t := public.structure_node(p_tingkat_node);
  perform public.structure_lock(t.institution_id);
  -- read again under the lock: a concurrent change to this school's
  -- structure has either committed or not begun
  select * into t from public.org_nodes o where o.id = t.id;
  if t.kind <> 'COHORT' then perform public.structure_refuse('STRUCTURE_PARENT_INVALID'); end if;
  if not t.is_active then perform public.structure_refuse('STRUCTURE_PARENT_INACTIVE'); end if;
  v_name := public.structure_clean_name(p_name);
  if nullif(btrim(coalesce(p_academic_year, '')), '') is not null then
    y := public.structure_year_start(p_academic_year);
    select ap.name into v_year from public.academic_periods ap where ap.id = t.academic_period_id;
    if v_year is distinct from (y::text || '/' || (y + 1)::text) then
      perform public.structure_refuse('STRUCTURE_YEAR_MISMATCH');
    end if;
  end if;
  if public.structure_name_taken(t.institution_id, 'CLASS', v_name, null, t.academic_period_id, null) then
    perform public.structure_refuse('STRUCTURE_NAME_TAKEN');
  end if;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (t.institution_id, t.id, 'CLASS', v_name, t.academic_period_id) returning id into v_id;
  perform public.audit_write('structure.kelas_created', 'org_nodes', v_id::text, t.institution_id,
    jsonb_build_object('name', v_name, 'tingkat', t.id, 'academic_period', t.academic_period_id));
  return v_id;
end $$;
revoke all on function public.create_kelas(uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_kelas(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. RENAME AND DEACTIVATE
-- ---------------------------------------------------------------------------
create function public.rename_school_node(p_node uuid, p_name text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare n public.org_nodes; v_name text; v_bagian uuid;
begin
  n := public.structure_node(p_node);
  perform public.structure_lock(n.institution_id);
  -- read again under the lock: a concurrent change to this school's
  -- structure has either committed or not begun
  select * into n from public.org_nodes o where o.id = n.id;
  if n.kind not in ('DEPARTMENT', 'COHORT', 'CLASS') then
    perform public.structure_refuse('STRUCTURE_NODE_INVALID');
  end if;
  v_name := public.structure_clean_name(p_name);
  if v_name = n.name then return n.id; end if;
  if n.kind = 'COHORT' then
    select pr.parent_id into v_bagian from public.org_nodes pr where pr.id = n.parent_id;
  end if;
  -- only an active node claims its name; renaming an inactive one checks
  -- nothing it could collide with
  if n.is_active and public.structure_name_taken(n.institution_id, n.kind, v_name, v_bagian,
                                                 n.academic_period_id, n.id) then
    perform public.structure_refuse('STRUCTURE_NAME_TAKEN');
  end if;
  update public.org_nodes set name = v_name where org_nodes.id = n.id;
  perform public.audit_write('structure.renamed', 'org_nodes', n.id::text, n.institution_id,
    jsonb_build_object('kind', n.kind, 'from', n.name, 'to', v_name));
  return n.id;
end $$;
revoke all on function public.rename_school_node(uuid, text) from public, anon, authenticated;
grant execute on function public.rename_school_node(uuid, text) to authenticated;

-- Nodes are never deleted (doc 02). Deactivating one is refused while it still
-- holds something that would be left pointing at a closed place.
create function public.deactivate_school_node(p_node uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare n public.org_nodes;
begin
  n := public.structure_node(p_node);
  perform public.structure_lock(n.institution_id);
  -- read again under the lock: a concurrent change to this school's
  -- structure has either committed or not begun
  select * into n from public.org_nodes o where o.id = n.id;
  if n.kind not in ('DEPARTMENT', 'COHORT', 'CLASS') then
    perform public.structure_refuse('STRUCTURE_NODE_INVALID');
  end if;
  if not n.is_active then return n.id; end if;
  -- an active Tingkat under a Bagian (through its hidden Reguler), or an
  -- active Kelas under a Tingkat
  if exists (select 1 from public.org_nodes c
              where c.jalur @> array[n.id] and c.id <> n.id and c.is_active
                and c.kind in ('COHORT', 'CLASS')) then
    perform public.structure_refuse('STRUCTURE_HAS_ACTIVE_CHILDREN');
  end if;
  if exists (select 1 from public.memberships m
              join public.org_nodes c on c.id = m.node_id
             where c.jalur @> array[n.id] and m.valid_to is null) then
    perform public.structure_refuse('STRUCTURE_HAS_MEMBERS');
  end if;
  if exists (select 1 from public.role_assignments ra
              join public.org_nodes c on c.id = ra.scope_node_id
             where c.jalur @> array[n.id] and ra.revoked_at is null and now() < ra.valid_until) then
    perform public.structure_refuse('STRUCTURE_HAS_STAFF');
  end if;
  -- a Bagian takes its hidden Reguler with it; nothing active is under either
  update public.org_nodes set is_active = false
   where org_nodes.jalur @> array[n.id] and org_nodes.is_active;
  perform public.audit_write('structure.deactivated', 'org_nodes', n.id::text, n.institution_id,
    jsonb_build_object('kind', n.kind, 'name', n.name));
  return n.id;
end $$;
revoke all on function public.deactivate_school_node(uuid) from public, anon, authenticated;
grant execute on function public.deactivate_school_node(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. THE REGISTRY: every client-callable SECURITY DEFINER function is declared,
--    with the authorization it implements (L3-F02). F06-N02 calls each
--    mutating one as a DEAN and requires the refusal to name INSTITUTION_ADMIN.
-- ---------------------------------------------------------------------------
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('school_structure', 'STAFF',
   'BOB-01: the Bagian, Tingkat and Kelas of one school, with the parent the screen shows, the academic '
   || 'year, the active flag and the count of students placed. For an Admin sekolah or Admin platform of '
   || 'that school; refuses everyone else with PR020 STRUCTURE_NOT_ALLOWED.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('create_bagian', 'STAFF',
   'BOB-01: creates a Bagian (DEPARTMENT) under the school''s hidden Jenjang, making the Jenjang on first '
   || 'need and a hidden Reguler (PROGRAMME) with it. Audited. Refusals are PR020 with a stable code in DETAIL.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('create_tingkat', 'STAFF',
   'BOB-01: creates a Tingkat (COHORT) under a Bagian''s Reguler, in the academic year named, finding or '
   || 'creating that year. Audited. Refusals are PR020 with a stable code in DETAIL.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('create_kelas', 'STAFF',
   'BOB-01: creates a Kelas (CLASS) under a Tingkat, in the Tingkat''s academic year; a stated year that '
   || 'differs is refused. Audited. Refusals are PR020 with a stable code in DETAIL.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('rename_school_node', 'STAFF',
   'BOB-01: renames a Bagian, Tingkat or Kelas; never the school or a hidden node. Audited with the old '
   || 'and new name. Refusals are PR020 with a stable code in DETAIL.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('deactivate_school_node', 'STAFF',
   'BOB-01: deactivates a Bagian, Tingkat or Kelas that holds no active child, placed student or scoped '
   || 'role. Never deletes. Audited. Refusals are PR020 with a stable code in DETAIL.',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- 6. M5a — A LEARNER'S PLACE IS A KELAS OR A TINGKAT, AND THE INTAKE SAYS SO.
--
-- import_row_problems as it was (20260926110000), plus one rule: a row that
-- will be a learner -- no role, or role STUDENT -- and names a place must name
-- an active Kelas or Tingkat. Its phrase is new and is mapped to a sentence in
-- src/lib/pendataan-kontrak.ts (MASALAH); a static test reads this function's
-- phrases and fails if one has no sentence.
-- ---------------------------------------------------------------------------
create or replace function public.import_row_problems(p_institution uuid, p_payload jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_bad jsonb := '[]'::jsonb; v_name text; v_node uuid; v_role text; v_person uuid;
        v_kind public.org_kind; v_active boolean;
begin
  v_name := btrim(coalesce(p_payload ->> 'display_name', ''));
  begin v_node := nullif(p_payload ->> 'node_id', '')::uuid;
  exception when others then v_bad := v_bad || to_jsonb('node_id is not a uuid'::text); end;
  begin v_person := nullif(p_payload ->> 'person_id', '')::uuid;
  exception when others then v_bad := v_bad || to_jsonb('person_id is not a uuid'::text); end;
  v_role := nullif(p_payload ->> 'role', '');

  if v_name = '' or length(v_name) > 200 then
    v_bad := v_bad || to_jsonb('display_name is missing or too long'::text);
  end if;

  -- An existing person may be named only if this caller can already see them;
  -- otherwise a uuid probe becomes an existence oracle. NO MATCHING IS DONE:
  -- PINTAR never decides on its own that two people at two schools are one
  -- person, and this is the line where that temptation would live.
  if v_person is not null then
    if not exists (select 1 from public.persons p where p.id = v_person)
       or not public.person_visible_to_me(v_person) then
      v_bad := v_bad || to_jsonb('person_id is not a person you may name'::text);
    elsif exists (select 1 from public.institutional_identities ii
                   where ii.person_id = v_person and ii.institution_id = p_institution) then
      v_bad := v_bad || to_jsonb('this person already holds an institutional identity here'::text);
    end if;
  end if;

  if v_node is not null then
    select n.kind, n.is_active into v_kind, v_active from public.org_nodes n
     where n.id = v_node and n.institution_id = p_institution;
    if v_kind is null then
      v_bad := v_bad || to_jsonb('node_id is not an organizational node of this institution'::text);
    elsif not public.can_on_node('CAN_PROVISION_PEOPLE', v_node) then
      v_bad := v_bad || to_jsonb('node_id is outside your provisioning scope'::text);
    elsif (v_role is null or v_role = 'STUDENT')
          and (v_kind not in ('CLASS', 'COHORT') or not v_active) then
      -- M5a. A learner is placed through a membership, and a membership
      -- exists only in a Kelas or a Tingkat. Said here, before anything is
      -- provisioned, instead of by a database sentence at provisioning.
      v_bad := v_bad || to_jsonb('a learner is placed in an active Kelas or Tingkat'::text);
    end if;
  end if;

  if v_role is not null then
    if not exists (select 1 from unnest(enum_range(null::public.app_role)) e where e::text = v_role) then
      v_bad := v_bad || to_jsonb('role is not a role this platform has'::text);
    elsif v_role in ('SYSTEM_ADMIN', 'INSTITUTION_ADMIN') then
      v_bad := v_bad || to_jsonb('this role is not granted by bulk provisioning'::text);
    elsif v_node is null then
      v_bad := v_bad || to_jsonb('a role needs an organizational node to be scoped to'::text);
    end if;
  end if;
  return v_bad;
end $$;
-- ADR-0021: the same grants as the definition it replaces -- reached only
-- through import_validate and import_advance, never by a client directly.
revoke all on function public.import_row_problems(uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. M5a — THE INTAKE ENROLS INTO THE PLACE'S OWN YEAR.
--
-- import_advance as it was (20261005110000), with one change: the enrolment
-- and membership take the academic period of the node the row names. It took
-- the school's newest period, so once a school had two years every learner
-- placed in the other year's Kelas failed with "membership period must match
-- the node's period". A node with no period of its own keeps the old choice.
-- ---------------------------------------------------------------------------
create or replace function public.import_advance(p_job uuid, p_max_rows integer default 25)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  j public.import_jobs; r record; v_limit int; v_done int := 0; v_failed int := 0;
  v_ceiling int; v_person uuid; v_id text; v_bad jsonb; v_period uuid; v_enr uuid;
  v_name text; v_node uuid; v_role text; v_pending int; v_pilot int;
begin
  j := public.import_job_for_admin(p_job);
  if j.state not in ('PILOT_IMPORTING', 'REMAINDER_IMPORTING', 'IMPORTING') then
    -- §36R. Nothing provisions from a job nobody confirmed, and nothing
    -- provisions past the pilot from a job nobody verified.
    raise exception 'this import is % and is not provisioning', j.state;
  end if;
  v_limit := greatest(1, least(coalesce(p_max_rows, 25), 200));

  -- §22. THE PILOT CEILING. While the pilot is running, ordinals above 50 do
  -- not exist as far as this function is concerned. It is a ceiling on WHICH
  -- rows may be touched, not a count of how many -- so an interrupted pilot
  -- resumes into the pilot and never leaks into the remainder.
  v_ceiling := case when j.state = 'PILOT_IMPORTING' then public.import_pilot_size()
                    else j.row_count end;

  for r in select ir.ordinal, ir.payload from public.import_rows ir
            where ir.job_id = p_job and ir.state = 'PENDING' and ir.ordinal <= v_ceiling
            order by ir.ordinal
            limit v_limit
            for update loop
    -- §21/§29. THE ATOMIC UNIT IS ONE ROW. A row provisions completely or not
    -- at all, and a row that fails does not take its neighbours with it.
    begin
      v_bad := public.import_row_problems(j.institution_id, r.payload);
      if jsonb_array_length(v_bad) > 0 then
        raise exception '%', v_bad ->> 0;
      end if;

      v_name := btrim(r.payload ->> 'display_name');
      v_node := nullif(r.payload ->> 'node_id', '')::uuid;
      v_role := nullif(r.payload ->> 'role', '');
      v_person := nullif(r.payload ->> 'person_id', '')::uuid;

      -- §30. A PERSON, AND NO ACCOUNT. Nothing here reaches an
      -- authentication table: the person exists institutionally and has
      -- activated nothing.
      if v_person is null then
        insert into public.persons (display_name) values (v_name) returning persons.id into v_person;
      end if;

      -- idempotent by construction: a person who already holds an identity
      -- here gets that one back rather than a second number
      v_id := public.issue_institutional_id(v_person, j.institution_id);

      if v_node is not null then
        -- M5a. The place's own year: a Kelas or Tingkat carries one, and a
        -- membership must match it.
        select coalesce(n.academic_period_id,
                        (select ap.id from public.academic_periods ap
                          where ap.institution_id = j.institution_id order by ap.created_at desc limit 1))
          into v_period from public.org_nodes n where n.id = v_node;
        if v_period is not null then
          insert into public.enrollments
            (person_id, institution_id, academic_period_id, programme_id, status)
          values (v_person, j.institution_id, v_period,
                  nullif(r.payload ->> 'programme_id', '')::uuid, 'PENDING')
          returning enrollments.id into v_enr;
          insert into public.memberships (enrollment_id, node_id, academic_period_id)
          values (v_enr, v_node, v_period);
        end if;
      end if;

      -- F-03. A LEARNER IS AUTHORIZED BY ENROLMENT, NOT BY A ROLE (doc 05). The
      -- validator accepts role STUDENT as "a learner", and so does this step
      -- now: the membership above IS the learner's authorization, and STUDENT
      -- is not a role a role assignment may carry.
      if v_role is not null and v_role <> 'STUDENT' then
        insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
        values (v_person, v_role::public.app_role, v_node, now() + interval '1 year');
      end if;

      -- §6. THE COUNTER MOVES WITH THE WORK, NOT BEFORE IT. This row's state
      -- and its outcome columns are written together, inside the same
      -- subtransaction that did the work, and the CHECK on the table refuses
      -- to let them come apart.
      update public.import_rows
         set state = 'PROVISIONED', person_id = v_person, institutional_id = v_id,
             provisioned_at = now(), failure_reason = null
       where import_rows.job_id = p_job and import_rows.ordinal = r.ordinal;
      v_done := v_done + 1;
    exception when others then
      update public.import_rows
         set state = 'FAILED', failure_reason = left(sqlerrm, 300)
       where import_rows.job_id = p_job and import_rows.ordinal = r.ordinal;
      v_failed := v_failed + 1;
    end;
  end loop;

  -- WHERE THE JOB STANDS NOW, counted from rows rather than from a tally
  -- somebody incremented.
  select count(*) filter (where ir.state = 'PENDING' and ir.ordinal <= v_ceiling)
    into v_pending from public.import_rows ir where ir.job_id = p_job;

  if j.state = 'PILOT_IMPORTING' and v_pending = 0 then
    select count(*) filter (where ir.state = 'PROVISIONED') into v_pilot
      from public.import_rows ir
     where ir.job_id = p_job and ir.ordinal <= public.import_pilot_size();
    if v_pilot = public.import_pilot_size() then
      -- §22. STOP. The remaining rows are untouched and stay that way until a
      -- person says the 50 are right. Succeeding technically is exactly what
      -- a thousand wrong rows also do.
      update public.import_jobs set state = 'AWAITING_PILOT_VERIFICATION' where import_jobs.id = p_job;
      perform public.audit_write('import.pilot_completed', 'import_jobs', p_job::text, j.institution_id,
        jsonb_build_object('pilot_size', public.import_pilot_size(), 'row_count', j.row_count));
    else
      update public.import_jobs set state = 'FAILED',
             failure_reason = format('%s of the %s pilot rows could not be provisioned',
                                     public.import_pilot_size() - v_pilot, public.import_pilot_size())
       where import_jobs.id = p_job;
    end if;
  elsif j.state in ('IMPORTING', 'REMAINDER_IMPORTING') and v_pending = 0 then
    -- §29. NOT COMPLETED WHILE ANYTHING IS UNFINISHED.
    if exists (select 1 from public.import_rows ir where ir.job_id = p_job and ir.state = 'FAILED') then
      update public.import_jobs set state = 'FAILED',
             failure_reason = 'some rows could not be provisioned and need attention'
       where import_jobs.id = p_job;
    else
      update public.import_jobs set state = 'COMPLETED', completed_at = now()
       where import_jobs.id = p_job and import_jobs.state <> 'COMPLETED';
      perform public.audit_write('import.completed', 'import_jobs', p_job::text, j.institution_id,
        jsonb_build_object('row_count', j.row_count));
    end if;
  end if;

  return public.import_progress(p_job) || jsonb_build_object('provisioned_now', v_done,
                                                             'failed_now', v_failed);
end $$;
revoke all on function public.import_advance(uuid, integer) from public, anon, authenticated;
grant execute on function public.import_advance(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014). Rolled back; proves the contract once, on
-- the database this migration lands on. selftest/db/fable10.sql proves it on
-- every run.
-- ---------------------------------------------------------------------------
do $$
declare v_inst uuid; v_other uuid; v_adm_u uuid; v_adm uuid; v_adm2_u uuid; v_adm2 uuid;
        v_bag uuid; v_ting uuid; v_kel uuid; v_state text; v_detail text; n int;
begin
  -- structural: declared, reachable, and nothing internal is reachable
  select count(*) into n from public.client_rpc_registry
   where function_name in ('school_structure', 'create_bagian', 'create_tingkat', 'create_kelas',
                           'rename_school_node', 'deactivate_school_node')
     and exposure = 'STAFF' and authorization_kind = 'SCOPE' and authorization_requirement = 'INSTITUTION_ADMIN';
  if n <> 6 then raise exception 'BOB-01: % of 6 structure functions are declared', n; end if;
  select count(*) into n from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname like 'structure\_%'
     and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute'));
  if n <> 0 then raise exception 'BOB-01: % internal structure helper(s) are client-callable', n; end if;

  -- The behavioural half builds a synthetic school and two admins, which a
  -- production-marked database refuses by design (F-02: no identity nobody
  -- granted). There the structure above is what is asserted; the behaviour is
  -- F10's, proven in CI on every push.
  if (select environment from public.platform_environment) = 'production' then
    raise notice 'BOB-01: production-marked database; structural check only (behaviour: F10)';
    return;
  end if;

  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe BOB-01 school', 'probe-bob01-school', true, true) returning id into v_inst;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe BOB-01 other', 'probe-bob01-other', true, true) returning id into v_other;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-bob01-adm@local.invalid') returning id into v_adm_u;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-bob01-adm2@local.invalid') returning id into v_adm2_u;
    select a.person_id into v_adm from public.accounts a where a.auth_user_id = v_adm_u;
    select a.person_id into v_adm2 from public.accounts a where a.auth_user_id = v_adm2_u;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_adm,  'INSTITUTION_ADMIN', v_inst,  now() - interval '1 day', now() + interval '365 days'),
           (v_adm2, 'INSTITUTION_ADMIN', v_other, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    -- the school's own admin builds Bagian → Tingkat → Kelas
    perform set_config('request.jwt.claims', json_build_object('sub', v_adm_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_u::text, true);
    v_bag  := public.create_bagian(v_inst, 'Kelas Rendah');
    v_ting := public.create_tingkat(v_bag, 'Kelas 1', '2026/2027');
    v_kel  := public.create_kelas(v_ting, '1A', '2026/2027');
    select count(*) into n from public.school_structure(v_inst);
    if n <> 3 then raise exception 'BOB-01: the list shows % node(s), expected 3', n; end if;
    select count(*) into n from public.org_nodes where institution_id = v_inst and kind in ('FACULTY', 'PROGRAMME');
    if n <> 2 then raise exception 'BOB-01: % hidden node(s), expected one Jenjang and one Reguler', n; end if;

    -- another school's admin is refused, with the code in DETAIL
    perform set_config('request.jwt.claims', json_build_object('sub', v_adm2_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm2_u::text, true);
    begin
      perform public.create_kelas(v_ting, '1B');
      raise exception 'BOB-01: another school''s admin created a Kelas';
    exception when sqlstate 'PR020' then
      get stacked diagnostics v_detail = pg_exception_detail;
      if v_detail <> 'STRUCTURE_NOT_ALLOWED' then raise exception 'BOB-01: the refusal carries %', v_detail; end if;
    end;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'BOB01_PROBE_UNDO';
  exception when others then
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'BOB01_PROBE_UNDO' then
      raise exception 'school-structure verification failed: %', sqlerrm;
    end if;
  end;
end $$;

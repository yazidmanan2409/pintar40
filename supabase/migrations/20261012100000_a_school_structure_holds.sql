-- ---------------------------------------------------------------------------
-- BOB-08 (D-023, the BOB-01 gate review) — A SCHOOL'S STRUCTURE HOLDS.
--
-- (a) ONE WAY IN. BOB-01 gave a school's structure its own functions
--     (create_bagian, create_tingkat, create_kelas, rename_school_node,
--     deactivate_school_node), each deciding under the per-school structure
--     lock. W8-01's direct client writes to org_nodes and academic_periods
--     (the INSERT and UPDATE policies for a school administrator) stayed
--     open beside them, and a direct write skips every rule those functions
--     keep: names, years, the hidden Jenjang and Reguler, the lock. They are
--     closed: the four policies go, and the client write grants with them.
--     Reading is unchanged.
--
-- (b) NOTHING IS PLACED IN A DEACTIVATED PLACE. The intake, grant_role,
--     period_rollover and transfer_execute wrote memberships, role grants and
--     enrolments without the lock and without asking whether the place was
--     still active, so a place could be deactivated with someone arriving in
--     it. Rather than four patches, one rule on the three tables: a BEFORE
--     INSERT trigger takes the school's structure lock in SHARED mode, reads
--     the place again under it, and refuses an inactive one
--     (PR020 STRUCTURE_PLACE_INACTIVE). Deactivation takes the same lock
--     exclusively, so the two cannot interleave: whichever commits first, the
--     other sees it.
--
-- (c) A YEAR NEAR NOW. A structure function accepts an academic year only
--     from the one before the current one to the one after it
--     (STRUCTURE_YEAR_OUT_OF_RANGE): a typo would otherwise create a
--     permanent period, and academic_periods is append-only. "Current" is
--     the school year in Jakarta, starting 1 July.
--
-- (f) THE NATIONAL LIBRARY IS NOT A SCHOOL. Every structure function refuses
--     a tenant whose kind is not INSTITUTION (STRUCTURE_NOT_A_SCHOOL), found
--     at the DAISY-05 gate: a platform administrator could build classes in
--     the canonical library.
-- ---------------------------------------------------------------------------

-- (a) ------------------------------------------------------------------------
drop policy org_nodes_insert on public.org_nodes;
drop policy org_nodes_update on public.org_nodes;
drop policy academic_periods_write on public.academic_periods;
drop policy academic_periods_update on public.academic_periods;
revoke insert, update, delete, truncate on public.org_nodes from public, anon, authenticated;
revoke insert, update, delete, truncate on public.academic_periods from public, anon, authenticated;

-- (b) ------------------------------------------------------------------------
-- The same key as structure_lock, shared: writers into places run side by
-- side, and a structure change waits for them and they for it.
create function public.structure_lock_shared(p_institution uuid)
returns void language sql set search_path = public, pg_temp as $$
  select pg_advisory_xact_lock_shared(hashtextextended('pintar.structure:' || p_institution::text, 0))
$$;
revoke all on function public.structure_lock_shared(uuid) from public, anon, authenticated;

-- The place column is the trigger's argument, so one function serves the
-- three tables without naming a column any of them lacks.
create function public.enforce_place_is_active()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_node uuid; v public.org_nodes;
begin
  v_node := nullif(to_jsonb(new) ->> tg_argv[0], '')::uuid;
  if v_node is null then return new; end if;
  select * into v from public.org_nodes n where n.id = v_node;
  if v.id is null then return new; end if;  -- the foreign key answers that
  perform public.structure_lock_shared(v.institution_id);
  -- read again under the lock: a deactivation that committed while this
  -- waited is seen here
  select * into v from public.org_nodes n where n.id = v_node;
  if not v.is_active then perform public.structure_refuse('STRUCTURE_PLACE_INACTIVE'); end if;
  return new;
end $$;
revoke all on function public.enforce_place_is_active() from public, anon, authenticated;

create trigger memberships_place_is_active
  before insert on public.memberships
  for each row execute function public.enforce_place_is_active('node_id');
create trigger role_assignments_place_is_active
  before insert on public.role_assignments
  for each row execute function public.enforce_place_is_active('scope_node_id');
create trigger enrollments_place_is_active
  before insert on public.enrollments
  for each row execute function public.enforce_place_is_active('programme_id');

-- (b, c, f) the refusals, named ---------------------------------------------
create or replace function public.structure_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR020',
    detail  = p_code,
    message = case p_code
      when 'STRUCTURE_NOT_ALLOWED'         then 'changing the school structure needs INSTITUTION_ADMIN at this school, or SYSTEM_ADMIN'
      when 'STRUCTURE_NOT_A_SCHOOL'        then 'only a school has a structure; this tenant is not a school'
      when 'STRUCTURE_NAME_INVALID'        then 'a structure name is 1 to 80 characters, without control characters'
      when 'STRUCTURE_NAME_TAKEN'          then 'an active sibling already has this name'
      when 'STRUCTURE_YEAR_INVALID'        then 'an academic year is written YYYY/YYYY+1'
      when 'STRUCTURE_YEAR_OUT_OF_RANGE'   then 'an academic year is the current one, the one before or the one after'
      when 'STRUCTURE_YEAR_MISMATCH'       then 'a Kelas carries its Tingkat''s academic year'
      when 'STRUCTURE_PARENT_INVALID'      then 'the parent is not the kind of node this call needs'
      when 'STRUCTURE_PARENT_INACTIVE'     then 'the parent has been deactivated'
      when 'STRUCTURE_PLACE_INACTIVE'      then 'the place has been deactivated; nobody is placed or granted a role there'
      when 'STRUCTURE_NODE_INVALID'        then 'only a Bagian, Tingkat or Kelas is changed here'
      when 'STRUCTURE_HAS_ACTIVE_CHILDREN' then 'deactivate the active children first'
      when 'STRUCTURE_HAS_MEMBERS'         then 'students are still placed here'
      when 'STRUCTURE_HAS_STAFF'           then 'a role is still scoped to this node'
      else 'the school structure could not be changed' end;
end $$;
revoke all on function public.structure_refuse(text) from public, anon, authenticated;

-- (c) ------------------------------------------------------------------------
-- The current school year's first calendar year, in Jakarta: 1 July onwards
-- is the new year.
create function public.structure_current_year_start()
returns int language sql stable set search_path = public, pg_temp as $$
  select extract(year from (now() at time zone 'Asia/Jakarta'))::int
       - case when extract(month from (now() at time zone 'Asia/Jakarta')) < 7 then 1 else 0 end
$$;
revoke all on function public.structure_current_year_start() from public, anon, authenticated;

create or replace function public.structure_year_start(p_year text)
returns int language plpgsql stable set search_path = public, pg_temp as $$
declare m text[]; y int; kini int;
begin
  m := regexp_match(coalesce(p_year, ''), '^\s*(\d{4})\s*/\s*(\d{4})\s*$');
  if m is null then perform public.structure_refuse('STRUCTURE_YEAR_INVALID'); end if;
  y := m[1]::int;
  if m[2]::int <> y + 1 or y < 2000 or y > 2098 then
    perform public.structure_refuse('STRUCTURE_YEAR_INVALID');
  end if;
  -- BOB-08 (c): a typo would make a permanent period
  kini := public.structure_current_year_start();
  if y < kini - 1 or y > kini + 1 then
    perform public.structure_refuse('STRUCTURE_YEAR_OUT_OF_RANGE');
  end if;
  return y;
end $$;
revoke all on function public.structure_year_start(text) from public, anon, authenticated;

-- (f) ------------------------------------------------------------------------
create or replace function public.structure_node(p_node uuid)
returns public.org_nodes language plpgsql stable set search_path = public, pg_temp as $$
declare v public.org_nodes;
begin
  select * into v from public.org_nodes n where n.id = p_node;
  if v.id is null or not public.has_scope('INSTITUTION_ADMIN', v.institution_id) then
    perform public.structure_refuse('STRUCTURE_NOT_ALLOWED');
  end if;
  -- BOB-08 (f): the canonical library is a tenant, not a school
  if (select i.tenant_kind from public.institutions i where i.id = v.institution_id) is distinct from 'INSTITUTION' then
    perform public.structure_refuse('STRUCTURE_NOT_A_SCHOOL');
  end if;
  return v;
end $$;
revoke all on function public.structure_node(uuid) from public, anon, authenticated;

create or replace function public.school_structure(p_institution uuid)
returns table (node_id uuid, level text, parent_id uuid, name text, academic_year text,
               is_active boolean, active_members int)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.org_nodes r where r.id = p_institution and r.kind = 'INSTITUTION')
     or not public.has_scope('INSTITUTION_ADMIN', p_institution) then
    perform public.structure_refuse('STRUCTURE_NOT_ALLOWED');
  end if;
  -- BOB-08 (f): the canonical library is a tenant, not a school
  if (select i.tenant_kind from public.institutions i where i.id = p_institution) is distinct from 'INSTITUTION' then
    perform public.structure_refuse('STRUCTURE_NOT_A_SCHOOL');
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
-- TERMINAL VERIFICATION (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  -- (a) no client may write either table, and no write policy remains
  if has_table_privilege('authenticated', 'public.org_nodes', 'insert')
     or has_table_privilege('authenticated', 'public.org_nodes', 'update')
     or has_table_privilege('authenticated', 'public.academic_periods', 'insert')
     or has_table_privilege('authenticated', 'public.academic_periods', 'update') then
    raise exception 'BOB-08: a client still writes org_nodes or academic_periods directly';
  end if;
  if not has_table_privilege('authenticated', 'public.org_nodes', 'select')
     or not has_table_privilege('authenticated', 'public.academic_periods', 'select') then
    raise exception 'BOB-08: reading the structure was taken away with the writes';
  end if;
  select count(*) into n from pg_policies p
   where p.schemaname = 'public' and p.tablename in ('org_nodes', 'academic_periods') and p.cmd <> 'SELECT';
  if n <> 0 then raise exception 'BOB-08: % write policy(ies) remain on the structure tables', n; end if;
  -- (b) the three tables carry the rule
  select count(*) into n from pg_trigger t
   where t.tgname in ('memberships_place_is_active', 'role_assignments_place_is_active', 'enrollments_place_is_active')
     and not t.tgisinternal;
  if n <> 3 then raise exception 'BOB-08: % of 3 place triggers installed', n; end if;
  -- (c) the window is three years wide around now
  if public.structure_current_year_start() not between extract(year from now())::int - 1 and extract(year from now())::int then
    raise exception 'BOB-08: the current school year reads as %', public.structure_current_year_start();
  end if;
end $$;

-- A2a, change C · D1 and D7 at class scope, for the emergency (THE PLAN §5.3 D1; A2a's page, Sharon's required changes
-- 1 and 2). DRAFT, pushed unfinished for Sharon's early read.
--
-- A window's scope becomes: the platform; a list of schools; or a list of CLASS nodes of one school (node_ids). In A2a
-- a class-scoped window is EMERGENCY only (the CHECK below); A2b lifts it for PLANNED windows, in the migration that
-- adds the node parameter to schedule_maintenance.
--
-- Required change 1: a class-scoped window still names its school in institution_ids, so every reader that matched on
-- institution_ids alone would read it as school-wide. maintenance_affects becomes node-aware, and every reader on the
-- page's list reaches the person through it (the hook, draining, the status read, the start trigger).
-- Required change 2: a trigger validates node_ids beyond the CHECK (a CHECK cannot read other rows).

alter table public.maintenance_windows add column node_ids uuid[] not null default '{}';
-- D6.1: the instants of effect, read with clock_timestamp() under the exclusive fence, and the only ones used for time
-- arithmetic (D6.3, D6.4). starts_at stays the readers' column (the transaction's now(), at or before T_stop).
alter table public.maintenance_windows add column t_stop timestamptz, add column t_lift timestamptz;
alter table public.maintenance_windows add constraint maintenance_windows_emergency_instants
  check ((t_stop is null or kind = 'EMERGENCY') and (t_lift is null or (t_stop is not null and t_lift >= t_stop)));

-- A2a: a class-scoped window is EMERGENCY only (A2b drops this in the migration that adds the node parameter)
alter table public.maintenance_windows add constraint maintenance_windows_class_is_emergency
  check (cardinality(node_ids) = 0 or kind = 'EMERGENCY');

-- Required change 2: each node is a CLASS of the window's one school; one school; not platform-wide
create function public.maintenance_windows_node_check() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if cardinality(new.node_ids) = 0 then return new; end if;
  if new.platform or cardinality(new.institution_ids) <> 1 then
    raise exception using errcode = 'PR080', detail = 'MAINTENANCE_CLASS_SCOPE_INVALID',
      message = 'a class-scoped window names exactly one school and is not platform-wide';
  end if;
  if exists (select 1 from unnest(new.node_ids) x
              where not exists (select 1 from public.org_nodes n
                                 where n.id = x and n.kind = 'CLASS' and n.institution_id = new.institution_ids[1])) then
    raise exception using errcode = 'PR080', detail = 'MAINTENANCE_CLASS_SCOPE_INVALID',
      message = 'each node of a class-scoped window is a class of its school';
  end if;
  return new;
end $$;
create trigger maintenance_windows_node_check before insert or update of node_ids, platform, institution_ids
  on public.maintenance_windows for each row execute function public.maintenance_windows_node_check();

-- Required change 1: the one reader every other goes through. With node_ids, the school match alone no longer counts:
-- a learner placed now (membership valid_to is null) at one of the classes, or a live role whose scope node is one of
-- them or below one of them.
create or replace function public.maintenance_affects(w public.maintenance_windows, p_person uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_person is not null and (w.platform
    or (cardinality(w.node_ids) = 0 and (
         exists (select 1 from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id
                  where ra.person_id = p_person and s.institution_id = any (w.institution_ids)
                    and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)
      or exists (select 1 from public.enrollments e
                  where e.person_id = p_person and e.institution_id = any (w.institution_ids)
                    and e.status in ('PENDING', 'ACTIVE'))))
    or (cardinality(w.node_ids) > 0 and (
         exists (select 1 from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id
                  where ra.person_id = p_person and (s.id = any (w.node_ids) or s.jalur && w.node_ids)
                    and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)
      or exists (select 1 from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
                  where e.person_id = p_person and e.status in ('PENDING', 'ACTIVE') and m.node_id = any (w.node_ids)))))
$$;
revoke all on function public.maintenance_affects(public.maintenance_windows, uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'maintenance_windows_class_is_emergency') then
    raise exception 'A2a D1: the class-is-emergency CHECK is missing';
  end if;
  if position('w.node_ids' in pg_get_functiondef('public.maintenance_affects(public.maintenance_windows,uuid)'::regprocedure)) = 0 then
    raise exception 'A2a D1: maintenance_affects does not read node_ids';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════ the stop at class scope (D7), under the fence (D6.1)
-- The refusals, in A1's domain (PR110), with their designed codes:
--   MAINTENANCE_NODE_INVALID       a bad class, refused here before the trigger would (required change 2)
--   MAINTENANCE_STOP_NOT_IN_FORCE  the exclusive fence not taken in three attempts: nothing is stopped (D6.8)
create or replace function public.maintenance_refuse(p_code text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR110',
    detail  = p_code,
    message = case p_code
      when 'MAINTENANCE_NOT_ALLOWED'      then 'maintenance and notices are set by the school''s Admin sekolah (INSTITUTION_ADMIN) for that school, or by Admin platform (SYSTEM_ADMIN)'
      when 'MAINTENANCE_INPUT_INVALID'    then 'a window needs a scope, a start no earlier than now, an end after it, a reason (1-300) and a message of at most 500 characters'
      when 'MAINTENANCE_NOT_OPEN'         then 'this maintenance window has already ended'
      when 'MAINTENANCE_CONFIRMATION'     then 'stopping PINTAR at once is confirmed by typing HENTIKAN SEKARANG and giving a reason'
      when 'MAINTENANCE_NO_NEW_START'     then 'planned maintenance begins within 15 minutes or is under way; no new assessment starts until it ends'
      when 'NOTICE_INPUT_INVALID'         then 'a notice needs a scope, a message (1-500), and an expiry after its publication'
      when 'NOTICE_NOT_OPEN'              then 'this notice has already been withdrawn'
      when 'MAINTENANCE_NODE_INVALID'     then 'a class stop names classes of one school, chosen with that school, and is not platform-wide'
      when 'MAINTENANCE_STOP_NOT_IN_FORCE' then 'the stop has not taken effect; nothing was stopped; try again'
      else 'the maintenance action could not be completed' end;
end $$;

drop function public.stop_pintar_now(boolean, uuid[], text, text);
create function public.stop_pintar_now(p_platform boolean, p_institutions uuid[], p_reason text, p_confirmation text,
                                       p_nodes uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_id uuid; v_inst uuid[]; v_nodes uuid[]; v_stop timestamptz; v_coba int := 0;
begin
  v_me := public.current_person_id();
  if v_me is null or not public.is_system_admin() then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  if coalesce(p_confirmation, '') <> 'HENTIKAN SEKARANG' or length(btrim(coalesce(p_reason, ''))) not between 1 and 300 then
    perform public.maintenance_refuse('MAINTENANCE_CONFIRMATION');
  end if;
  v_inst := case when coalesce(p_platform, false) then '{}'::uuid[]
                 else (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_institutions, '{}')) x) end;
  v_nodes := (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_nodes, '{}')) x);
  if not coalesce(p_platform, false) and cardinality(v_inst) = 0 then
    perform public.maintenance_refuse('MAINTENANCE_INPUT_INVALID');
  end if;
  -- required change 2: a bad class is refused here, with its own code, before the trigger would
  if cardinality(v_nodes) > 0 and (coalesce(p_platform, false) or cardinality(v_inst) <> 1
      or exists (select 1 from unnest(v_nodes) x where not exists (select 1 from public.org_nodes n
                  where n.id = x and n.kind = 'CLASS' and n.institution_id = v_inst[1]))) then
    perform public.maintenance_refuse('MAINTENANCE_NODE_INVALID');
  end if;
  -- required change 3: no person row after the fence; the window's key to its creator is taken now
  perform 1 from public.persons where id = v_me for key share;
  -- D6.1: the exclusive fence, three attempts of 1.5 s with 0.1 s between (A2a's page §3); T_stop read under it
  loop
    v_coba := v_coba + 1;
    begin
      perform public.pagar_darurat_eksklusif();
      exit;
    exception when lock_not_available then
      if v_coba >= 3 then perform public.maintenance_refuse('MAINTENANCE_STOP_NOT_IN_FORCE'); end if;
      perform pg_sleep(0.1);
    end;
  end loop;
  v_stop := clock_timestamp();
  insert into public.maintenance_windows (kind, platform, institution_ids, node_ids, starts_at, t_stop, reason,
                                          created_by_person_id, activation_recorded_at)
  values ('EMERGENCY', coalesce(p_platform, false), v_inst, v_nodes, now(), v_stop, btrim(p_reason), v_me, now())
  returning id into v_id;
  perform public.audit_write('maintenance.emergency_stop', 'maintenance_windows', v_id::text,
    case when coalesce(p_platform, false) then null else v_inst[1] end,
    jsonb_build_object('window', v_id, 'kind', 'EMERGENCY', 'platform', coalesce(p_platform, false),
                       'institutions', to_jsonb(v_inst), 'nodes', to_jsonb(v_nodes), 't_stop', v_stop,
                       'attempts', v_coba, 'from_state', null, 'to_state', 'AKTIF', 'reason', btrim(p_reason)));
  return v_id;
end $$;
revoke all on function public.stop_pintar_now(boolean, uuid[], text, text, uuid[]) from public, anon;
grant execute on function public.stop_pintar_now(boolean, uuid[], text, text, uuid[]) to authenticated;

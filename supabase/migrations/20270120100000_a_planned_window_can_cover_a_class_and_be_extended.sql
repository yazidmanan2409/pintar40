-- A2b, commit 1 · the window side: a PLANNED window can cover a class (K10), and a planned window can be extended
-- (D3; K6 to K9). PLAN-A2B-C2W.md §2; A2B-COMPLETION.md rows 7 and "Lifting A2a's emergency-only CHECK"; Sharon's
-- A2B-K-TESTS-43ce13bf.md and her clearance of step 1 (A2B-STEP1-b95bfe9c.md). DRAFT.
--
-- K10 (Sharon, early read of d711d4b2, item 3): A2a's CHECK (a class-scoped window is EMERGENCY only) is dropped in the
-- migration that adds the node parameter to schedule_maintenance. schedule_maintenance refuses a bad node with its
-- designed code, MAINTENANCE_NODE_INVALID, before any constraint or trigger fires; A2a's node trigger then covers a
-- PLANNED class window as it covers an EMERGENCY one. A class window's notice is refused for now: a notice is scoped
-- to schools, so it would reach the whole school (put to Daisy and Sharon with this commit).
--
-- D3, extend (the Chief Architect, 13 Nov: its own function): perpanjang_pemeliharaan is the only new writer of a
-- window's ends_at, beside schedule_maintenance at insert (K7's enumeration). PLANNED only: an EMERGENCY window is
-- refused with MAINTENANCE_EMERGENCY_LIFT_ONLY (its only end is A2a's fenced lift). A window that has ended, by
-- ended_at or by its ends_at, read against clock_timestamp(), is refused MAINTENANCE_NOT_OPEN; nothing is read from
-- activation_recorded_at (K8). Locks: the actor (KEY SHARE, A2A-L01: persons first), then the window's row FOR UPDATE,
-- nothing after it and no fence (A2B-COMPLETION.md question 3). The edge recorder takes window rows FOR UPDATE SKIP
-- LOCKED, so a held window is recorded at its next run, never twice (K9). Audited as maintenance.extended with before,
-- after and reason; the window's notice, if it expired at the old end, now expires at the new one.
-- Resume early is the existing change_maintenance AKHIRI, unchanged.

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

-- ───────────────────────────────────────────────────────────── K10: the CHECK goes, the node parameter comes
alter table public.maintenance_windows drop constraint maintenance_windows_class_is_emergency;

drop function public.schedule_maintenance(boolean, uuid[], timestamptz, timestamptz, text, text, boolean);
create function public.schedule_maintenance(p_platform boolean, p_institutions uuid[], p_starts_at timestamptz,
                                            p_ends_at timestamptz, p_message text, p_reason text, p_notice boolean,
                                            p_nodes uuid[] default '{}')
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_id uuid; v_start timestamptz; v_inst uuid[]; v_nodes uuid[];
begin
  v_me := public.current_person_id();
  v_inst := case when coalesce(p_platform, false) then '{}'::uuid[]
                 else (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_institutions, '{}')) x) end;
  v_nodes := (select coalesce(array_agg(distinct x order by x), '{}') from unnest(coalesce(p_nodes, '{}')) x);
  if v_me is null or not public.maintenance_may_act(p_platform, v_inst) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  -- K10: a class window names classes of exactly one school, chosen with that school, and is not platform-wide;
  -- refused with its designed code before any constraint or trigger
  if cardinality(v_nodes) > 0 and (coalesce(p_platform, false) or cardinality(v_inst) <> 1
       or exists (select 1 from unnest(v_nodes) x
                   where not exists (select 1 from public.org_nodes n
                                      where n.id = x and n.kind = 'CLASS' and n.institution_id = v_inst[1]))) then
    perform public.maintenance_refuse('MAINTENANCE_NODE_INVALID');
  end if;
  v_start := coalesce(p_starts_at, now());
  if v_start < now() - interval '1 minute' or (p_ends_at is not null and p_ends_at <= v_start)
     or length(btrim(coalesce(p_reason, ''))) not between 1 and 300
     or (p_message is not null and length(btrim(p_message)) not between 1 and 500)
     or (coalesce(p_notice, false) and nullif(btrim(coalesce(p_message, '')), '') is null)
     or (coalesce(p_notice, false) and cardinality(v_nodes) > 0)   -- a notice is a school's: not for a class window
     or (not coalesce(p_platform, false) and cardinality(v_inst) = 0) then
    perform public.maintenance_refuse('MAINTENANCE_INPUT_INVALID');
  end if;
  insert into public.maintenance_windows (kind, platform, institution_ids, node_ids, starts_at, ends_at, message, reason,
                                          created_by_person_id)
  values ('PLANNED', coalesce(p_platform, false), v_inst, v_nodes, v_start, p_ends_at,
          nullif(btrim(coalesce(p_message, '')), ''), btrim(p_reason), v_me)
  returning id into v_id;
  perform public.audit_write('maintenance.scheduled', 'maintenance_windows', v_id::text,
    case when coalesce(p_platform, false) then null else v_inst[1] end,
    jsonb_build_object('window', v_id, 'kind', 'PLANNED', 'platform', coalesce(p_platform, false),
                       'institutions', to_jsonb(v_inst), 'nodes', to_jsonb(v_nodes), 'from_state', null, 'to_state',
                       case when v_start <= now() then 'AKTIF' else 'TERJADWAL' end,
                       'starts_at', v_start, 'ends_at', p_ends_at, 'reason', btrim(p_reason)));
  -- D-094(b): the matching notice, with no separate workflow
  if coalesce(p_notice, false) then
    insert into public.broadcast_notices (platform, institution_ids, message, publish_at, expires_at,
                                          maintenance_window_id, created_by_person_id)
    values (coalesce(p_platform, false), v_inst, btrim(p_message), now(),
            coalesce(p_ends_at, v_start + interval '1 day'), v_id, v_me);
  end if;
  return v_id;
end $$;
-- CORRECTED IN PLACE (undeployed; Sharon's C1-1, A2B-COMMIT1-60af5cc2.md): to authenticated only, as main's
revoke all on function public.schedule_maintenance(boolean, uuid[], timestamptz, timestamptz, text, text, boolean, uuid[]) from public, anon, service_role;
grant execute on function public.schedule_maintenance(boolean, uuid[], timestamptz, timestamptz, text, text, boolean, uuid[]) to authenticated;

-- ───────────────────────────────────────────────────────────── D3: extend
create function public.perpanjang_pemeliharaan(p_window uuid, p_ends_at timestamptz, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); w public.maintenance_windows; v_kini timestamptz;
begin
  -- A2A-L01: the actor first (the audit row names them), then the window's row; no fence, nothing after it
  perform 1 from public.persons p where p.id = v_me for key share;
  -- Addendum 1 §5a, condition 1: an emergency ends only by A2a's fenced lift (its kind never changes: read unlocked,
  -- so an emergency's row is never locked here; Sharon's note on commit 1)
  if (select x.kind from public.maintenance_windows x where x.id = p_window) = 'EMERGENCY' then
    perform public.maintenance_refuse('MAINTENANCE_EMERGENCY_LIFT_ONLY');
  end if;
  select * into w from public.maintenance_windows where id = p_window for update;
  if v_me is null or w.id is null then perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED'); end if;
  if not public.maintenance_controls(w) then perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED'); end if;
  -- K8: ended, read on the clock (never now(), never activation_recorded_at)
  v_kini := clock_timestamp();
  if w.ended_at is not null or (w.ends_at is not null and w.ends_at <= v_kini) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_OPEN');
  end if;
  if w.ends_at is null or p_ends_at is null or p_ends_at <= w.ends_at or p_ends_at <= v_kini
     or length(btrim(coalesce(p_reason, ''))) not between 1 and 300 then
    perform public.maintenance_refuse('MAINTENANCE_INPUT_INVALID');
  end if;
  update public.maintenance_windows set ends_at = p_ends_at where id = w.id;
  update public.broadcast_notices set expires_at = p_ends_at
   where maintenance_window_id = w.id and withdrawn_at is null and expires_at = w.ends_at;
  perform public.audit_write('maintenance.extended', 'maintenance_windows', w.id::text,
    case when w.platform then null else w.institution_ids[1] end,
    jsonb_build_object('window', w.id, 'kind', w.kind, 'platform', w.platform, 'institutions', to_jsonb(w.institution_ids),
                       'nodes', to_jsonb(w.node_ids), 'state', public.maintenance_state(w, v_kini),
                       'before', w.ends_at, 'after', p_ends_at, 'reason', btrim(p_reason)));
  return jsonb_build_object('ok', true, 'window', w.id, 'ends_at_before', w.ends_at, 'ends_at', p_ends_at);
end $$;
revoke all on function public.perpanjang_pemeliharaan(uuid, timestamptz, text) from public, anon, service_role;
grant execute on function public.perpanjang_pemeliharaan(uuid, timestamptz, text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('perpanjang_pemeliharaan', 'STAFF',
   'A2b D3: extend a PLANNED window that has not ended to a later end, with a reason (the school''s Admin sekolah for '
   || 'its school or class window, Admin platform for any). An EMERGENCY window is refused MAINTENANCE_EMERGENCY_LIFT_ONLY; '
   || 'an ended window MAINTENANCE_NOT_OPEN, read on the clock. Audited with before, after and reason.',
   'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- the designed refusal's words
do $$
begin
  perform pg_temp.a2b_ganti('public.maintenance_refuse(text)',
    E'      when ''MAINTENANCE_LIFT_NOT_DONE''    then ''the stop has not been ended; nothing was changed; try again''\n',
    E'      when ''MAINTENANCE_LIFT_NOT_DONE''    then ''the stop has not been ended; nothing was changed; try again''\n'
    || E'      when ''MAINTENANCE_EMERGENCY_LIFT_ONLY'' then ''an emergency stop is not extended or ended early; it ends only when Admin platform lifts it''\n');
end $$;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'maintenance_windows_class_is_emergency')
     or to_regprocedure('public.schedule_maintenance(boolean,uuid[],timestamp with time zone,timestamp with time zone,text,text,boolean)') is not null
     or to_regprocedure('public.perpanjang_pemeliharaan(uuid,timestamp with time zone,text)') is null
     or has_function_privilege('anon', 'public.perpanjang_pemeliharaan(uuid,timestamp with time zone,text)'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.schedule_maintenance(boolean,uuid[],timestamp with time zone,timestamp with time zone,text,text,boolean,uuid[])'::regprocedure, 'execute')
     or has_function_privilege('service_role', 'public.schedule_maintenance(boolean,uuid[],timestamp with time zone,timestamp with time zone,text,text,boolean,uuid[])'::regprocedure, 'execute')
     or has_function_privilege('service_role', 'public.perpanjang_pemeliharaan(uuid,timestamp with time zone,text)'::regprocedure, 'execute')
     or not has_function_privilege('authenticated', 'public.perpanjang_pemeliharaan(uuid,timestamp with time zone,text)'::regprocedure, 'execute')
     or not has_function_privilege('authenticated', 'public.schedule_maintenance(boolean,uuid[],timestamp with time zone,timestamp with time zone,text,text,boolean,uuid[])'::regprocedure, 'execute')
     or position('MAINTENANCE_EMERGENCY_LIFT_ONLY' in pg_get_functiondef('public.maintenance_refuse(text)'::regprocedure)) = 0 then
    raise exception 'A2b commit 1: the CHECK, the node parameter, the extend or its refusal is not as intended';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- MAINTENANCE AND SCOPED NOTICES (#148; D-094, D-100(b)(c), D-093 §5).
--
-- PLANNED MAINTENANCE (D-094(a)-(g), D-100(b)). A School Admin schedules it for
-- their own school; Admin platform for chosen schools or the whole platform.
-- It has a start and an estimated end, a message and a reason. From T-15
-- minutes no new affected assessment sitting starts. From T=0 the affected
-- people's requests are refused by the database (PostgREST's pre-request),
-- EXCEPT a person whose sitting is already running: they drain. Their sitting
-- continues, their answers are kept as usual and they can still hand it in;
-- what they cannot do is start another. The person who controls the window
-- (its school's admin, Admin platform) is never locked out of ending it.
-- It ends by itself at its end time, or when ended.
--
-- EMERGENCY INTERRUPTION (D-094(h), D-100(c)), separate and Admin platform
-- only, confirmed by a typed phrase and a reason. It stops affected activity
-- at once, running sittings included. Nothing is finalised, submitted or
-- discarded: what was safely received stays as it is, and every request is
-- answered with the truth (PT503 PINTAR_DIHENTIKAN) until it is ended.
--
-- NOTICES (D-094(b)): a message to one school, chosen schools or the
-- platform, from a publication time to an expiry. Not a messaging system:
-- one line, read once per page (D-094(d), no polling).
--
-- D-093 §5: every schedule, start, end, cancellation, emergency stop and
-- automatic activation and deactivation is its own audit row; automatic ones
-- are written as SYSTEM, with the window's id.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.maintenance_kind as enum ('PLANNED', 'EMERGENCY');

create table public.maintenance_windows (
  id                        uuid primary key default gen_random_uuid(),
  kind                      public.maintenance_kind not null,
  platform                  boolean not null,
  institution_ids           uuid[] not null default '{}',
  starts_at                 timestamptz not null,
  ends_at                   timestamptz,
  message                   text check (message is null or length(btrim(message)) between 1 and 500),
  reason                    text not null check (length(btrim(reason)) between 1 and 300),
  created_by_person_id      uuid not null references public.persons(id),
  created_at                timestamptz not null default now(),
  ended_at                  timestamptz,
  ended_by_person_id        uuid references public.persons(id),
  end_reason                text check (end_reason is null or length(btrim(end_reason)) between 1 and 300),
  activation_recorded_at    timestamptz,
  deactivation_recorded_at  timestamptz,
  check (platform or cardinality(institution_ids) > 0),
  check (ends_at is null or ends_at > starts_at)
);
create index maintenance_windows_open_idx on public.maintenance_windows (starts_at) where ended_at is null;
alter table public.maintenance_windows enable row level security;
revoke all on public.maintenance_windows from public, anon, authenticated;

create table public.broadcast_notices (
  id                     uuid primary key default gen_random_uuid(),
  platform               boolean not null,
  institution_ids        uuid[] not null default '{}',
  message                text not null check (length(btrim(message)) between 1 and 500),
  publish_at             timestamptz not null default now(),
  expires_at             timestamptz not null,
  maintenance_window_id  uuid references public.maintenance_windows(id),
  created_by_person_id   uuid not null references public.persons(id),
  created_at             timestamptz not null default now(),
  withdrawn_at           timestamptz,
  withdrawn_by_person_id uuid references public.persons(id),
  check (platform or cardinality(institution_ids) > 0),
  check (expires_at > publish_at)
);
create index broadcast_notices_live_idx on public.broadcast_notices (expires_at) where withdrawn_at is null;
alter table public.broadcast_notices enable row level security;
revoke all on public.broadcast_notices from public, anon, authenticated;

create or replace function public.maintenance_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR110',
    detail  = p_code,
    message = case p_code
      when 'MAINTENANCE_NOT_ALLOWED'      then 'maintenance and notices are set by the school''s Admin sekolah (INSTITUTION_ADMIN) for that school, or by Admin platform (SYSTEM_ADMIN); stopping PINTAR at once by Admin platform alone'
      when 'MAINTENANCE_INPUT_INVALID'    then 'a window needs a scope, a start no earlier than now, an end after it, a reason (1-300) and a message of at most 500 characters'
      when 'MAINTENANCE_NOT_OPEN'         then 'this maintenance window has already ended'
      when 'MAINTENANCE_CONFIRMATION'     then 'stopping PINTAR at once is confirmed by typing HENTIKAN SEKARANG and giving a reason'
      when 'MAINTENANCE_NO_NEW_START'     then 'planned maintenance begins within 15 minutes or is under way; no new assessment starts until it ends'
      when 'NOTICE_INPUT_INVALID'         then 'a notice needs a scope, a message (1-500), and an expiry after its publication'
      when 'NOTICE_NOT_OPEN'              then 'this notice has already been withdrawn'
      else 'the maintenance action could not be completed' end;
end $$;
revoke all on function public.maintenance_refuse(text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────── the rules

-- Where a window stands at a moment: ended (or cancelled), active, the last 15
-- minutes before a planned start (no new sitting), or scheduled.
create or replace function public.maintenance_state(w public.maintenance_windows, p_at timestamptz)
returns text language sql stable set search_path = public, pg_temp as $$
  select case
    when w.ended_at is not null and w.ended_at <= p_at then 'BERAKHIR'
    when w.ends_at is not null and w.ends_at <= p_at then 'BERAKHIR'
    when w.starts_at <= p_at then 'AKTIF'
    when w.kind = 'PLANNED' and w.starts_at - interval '15 minutes' <= p_at then 'MENJELANG'
    else 'TERJADWAL' end
$$;
revoke all on function public.maintenance_state(public.maintenance_windows, timestamptz) from public, anon, authenticated;

-- Whom a window reaches: everyone on the platform, or the people of its schools
-- (a live role there, or a current enrolment).
create or replace function public.maintenance_affects(w public.maintenance_windows, p_person uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_person is not null and (w.platform
    or exists (select 1 from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id
                where ra.person_id = p_person and s.institution_id = any (w.institution_ids)
                  and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)
    or exists (select 1 from public.enrollments e
                where e.person_id = p_person and e.institution_id = any (w.institution_ids)
                  and e.status in ('PENDING', 'ACTIVE')))
$$;
revoke all on function public.maintenance_affects(public.maintenance_windows, uuid) from public, anon, authenticated;

-- Who controls a window, and so is never locked out of it: Admin platform, and
-- for a planned window of chosen schools, an Admin sekolah of one of them.
create or replace function public.maintenance_controls(w public.maintenance_windows)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_system_admin()
      or (w.kind = 'PLANNED' and not w.platform
          and exists (select 1 from unnest(w.institution_ids) i where public.has_scope('INSTITUTION_ADMIN', i)))
$$;
revoke all on function public.maintenance_controls(public.maintenance_windows) from public, anon, authenticated;

-- A sitting already running: the drain (D-100(b)). CREATED is a sitting opened
-- but not yet answered, already under way; and a timed one drains until its
-- late-sync grace has passed, so an answer still travelling from the device
-- arrives as it would have without maintenance.
create or replace function public.maintenance_draining(p_person uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.assessment_sessions s
                   join public.assessment_definitions d on d.id = s.assessment_definition_id
                  where s.person_id = p_person and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED')
                    and case when s.authoritative_deadline is null then s.status <> 'EXPIRED'
                             else now() <= s.authoritative_deadline
                                           + make_interval(secs => coalesce(d.late_sync_grace_seconds, 0)) end)
$$;
revoke all on function public.maintenance_draining(uuid) from public, anon, authenticated;

-- What, if anything, stops this person's requests now: EMERGENCY, PLANNED or null.
create or replace function public.maintenance_block_for_me()
returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid; w public.maintenance_windows; v_out text;
begin
  -- the common case asks one indexed question and nothing else
  if not exists (select 1 from public.maintenance_windows m
                  where m.ended_at is null and m.starts_at <= now() and (m.ends_at is null or m.ends_at > now())) then
    return null;
  end if;
  v_me := public.current_person_id();
  if v_me is null then return null; end if;
  for w in select * from public.maintenance_windows m
            where m.ended_at is null and m.starts_at <= now() and (m.ends_at is null or m.ends_at > now())
            order by (m.kind = 'EMERGENCY') desc
  loop
    continue when not public.maintenance_affects(w, v_me) or public.maintenance_controls(w);
    if w.kind = 'EMERGENCY' then return 'EMERGENCY'; end if;
    if not public.maintenance_draining(v_me) then v_out := 'PLANNED'; end if;
  end loop;
  return v_out;
exception when others then return null;
end $$;
revoke all on function public.maintenance_block_for_me() from public, anon;
grant execute on function public.maintenance_block_for_me() to authenticated;

-- NO NEW SITTING from T-15 of a planned window, or during any window, for the
-- people it reaches: every path that starts a sitting inserts the row, so the
-- refusal is on the insert, after the provenance trigger has named the person.
create or replace function public.enforce_no_new_sitting_in_maintenance()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.maintenance_windows w
              where w.ended_at is null and (w.ends_at is null or w.ends_at > now())
                and public.maintenance_state(w, now()) in ('MENJELANG', 'AKTIF')
                and public.maintenance_affects(w, new.person_id)) then
    perform public.maintenance_refuse('MAINTENANCE_NO_NEW_START');
  end if;
  return new;
end $$;
revoke all on function public.enforce_no_new_sitting_in_maintenance() from public, anon, authenticated;
create trigger assessment_sessions_zz_no_new_sitting_in_maintenance before insert on public.assessment_sessions
  for each row execute function public.enforce_no_new_sitting_in_maintenance();

-- ─────────────────────────────────────── the database's refusal (PostgREST)
-- BOB-29's pre-request learns the maintenance refusal, first: during a window,
-- only the status read and leaving pass for the people it stops.
create or replace function pintar_permintaan.periksa()
returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_sesi uuid; v_peran text; r public.device_sessions; v_jalur text; v_blok text;
begin
  begin
    v_peran := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  exception when others then
    v_peran := null;
  end;
  if v_peran is distinct from 'authenticated' then
    return;
  end if;
  v_jalur := current_setting('request.path', true);
  -- #148 (D-094, D-100): maintenance; the status read and leaving always pass
  if v_jalur not in ('/rpc/pintar_status_saya', '/rpc/sesi_akhiri_saya') then
    v_blok := public.maintenance_block_for_me();
    if v_blok = 'EMERGENCY' then
      raise exception using errcode = 'PT503', message = 'PINTAR_DIHENTIKAN';
    elsif v_blok = 'PLANNED' then
      raise exception using errcode = 'PT503', message = 'PINTAR_PEMELIHARAAN';
    end if;
  end if;
  -- the lock screen's own questions pass: where it stands, and leaving
  if v_jalur in ('/rpc/sesi_periksa', '/rpc/sesi_akhiri_saya') then
    return;
  end if;
  v_sesi := public.sesi_saya();
  if v_sesi is null then return; end if;
  select * into r from public.device_sessions s where s.session_id = v_sesi;
  if not found then return; end if;
  case public.sesi_keadaan(r, clock_timestamp())
    when 'TERKUNCI' then raise exception using errcode = 'PT423', message = 'SESI_TERKUNCI';
    when 'BERAKHIR' then raise exception using errcode = 'PT401', message = 'SESI_BERAKHIR';
    else return;
  end case;
end $$;
revoke all on function pintar_permintaan.periksa() from public;
grant execute on function pintar_permintaan.periksa() to anon, authenticated, service_role;

-- ─────────────────────────────────────────── recording the automatic edges
-- A start or end that arrives by the clock is recorded by the first read after
-- it, as SYSTEM: the reader's identity is set aside for that one row.
create or replace function public.maintenance_record_edges()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare w public.maintenance_windows; v_claims text; v_sub text;
begin
  for w in select * from public.maintenance_windows m
            where (m.activation_recorded_at is null and m.starts_at <= now() and m.ended_at is null)
               or (m.deactivation_recorded_at is null and m.ended_at is null and m.ends_at is not null and m.ends_at <= now())
            for update skip locked
  loop
    v_claims := current_setting('request.jwt.claims', true);
    v_sub := current_setting('request.jwt.claim.sub', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if w.activation_recorded_at is null and w.starts_at <= now() then
      update public.maintenance_windows set activation_recorded_at = now() where id = w.id;
      perform public.audit_write('maintenance.activated', 'maintenance_windows', w.id::text,
        case when w.platform then null else w.institution_ids[1] end,
        jsonb_build_object('actor', 'SYSTEM', 'window', w.id, 'kind', w.kind, 'platform', w.platform,
                           'institutions', to_jsonb(w.institution_ids), 'from_state', 'TERJADWAL', 'to_state', 'AKTIF',
                           'starts_at', w.starts_at, 'ends_at', w.ends_at));
    end if;
    if w.deactivation_recorded_at is null and w.ends_at is not null and w.ends_at <= now() then
      update public.maintenance_windows set deactivation_recorded_at = now() where id = w.id;
      perform public.audit_write('maintenance.deactivated', 'maintenance_windows', w.id::text,
        case when w.platform then null else w.institution_ids[1] end,
        jsonb_build_object('actor', 'SYSTEM', 'window', w.id, 'kind', w.kind, 'platform', w.platform,
                           'institutions', to_jsonb(w.institution_ids), 'from_state', 'AKTIF', 'to_state', 'BERAKHIR',
                           'starts_at', w.starts_at, 'ends_at', w.ends_at));
    end if;
    perform set_config('request.jwt.claims', coalesce(v_claims, ''), true);
    perform set_config('request.jwt.claim.sub', coalesce(v_sub, ''), true);
  end loop;
end $$;
revoke all on function public.maintenance_record_edges() from public, anon, authenticated;

-- ─────────────────────────────────────────── what a person is told (no polling)
-- Read once as a page begins (D-094(d)): the windows that reach this person and
-- are active or start within the hour, and the notices live for them now.
create or replace function public.pintar_status_saya()
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_win jsonb; v_not jsonb;
begin
  v_me := public.current_person_id();
  if v_me is null then return jsonb_build_object('pemeliharaan', '[]'::jsonb, 'pengumuman', '[]'::jsonb, 'terhenti', null); end if;
  perform public.maintenance_record_edges();
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', w.id, 'jenis', w.kind, 'keadaan', public.maintenance_state(w, now()),
           'mulai', w.starts_at, 'selesai', w.ends_at, 'pesan', w.message,
           'menguasai', public.maintenance_controls(w), 'berjalan', public.maintenance_draining(v_me),
           -- a sitting handed in since the window began is acknowledged on the maintenance page
           'terkumpul', (select max(s.submitted_at) from public.assessment_sessions s
                          where s.person_id = v_me and s.submitted_at >= w.starts_at))
           order by w.starts_at), '[]'::jsonb)
    into v_win
    from public.maintenance_windows w
   where w.ended_at is null and (w.ends_at is null or w.ends_at > now())
     and w.starts_at <= now() + interval '60 minutes'
     and public.maintenance_affects(w, v_me);
  select coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'pesan', n.message, 'sampai', n.expires_at)
           order by n.publish_at desc), '[]'::jsonb)
    into v_not
    from public.broadcast_notices n
   where n.withdrawn_at is null and n.publish_at <= now() and n.expires_at > now()
     and (n.platform or exists (
           select 1 from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id
            where ra.person_id = v_me and s.institution_id = any (n.institution_ids)
              and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)
          or exists (select 1 from public.enrollments e
                      where e.person_id = v_me and e.institution_id = any (n.institution_ids)
                        and e.status in ('PENDING', 'ACTIVE')));
  -- what stops this person's requests now, the pre-request's own answer: a page asks here because this read passes
  -- and the database's clock, which decides every state: the browser times the warnings against it
  return jsonb_build_object('pemeliharaan', v_win, 'pengumuman', v_not, 'terhenti', public.maintenance_block_for_me(),
                            'sekarang', now());
end $$;
revoke all on function public.pintar_status_saya() from public, anon;
grant execute on function public.pintar_status_saya() to authenticated;

-- ─────────────────────────────────────────── the controls (D-094(a), (g), (h))

-- who may act for a scope: Admin platform for anything; a school's admin for that school alone, planned only
create or replace function public.maintenance_may_act(p_platform boolean, p_institutions uuid[])
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_system_admin()
      or (not coalesce(p_platform, false) and cardinality(coalesce(p_institutions, '{}')) > 0
          and not exists (select 1 from unnest(p_institutions) i where not public.has_scope('INSTITUTION_ADMIN', i)))
$$;
revoke all on function public.maintenance_may_act(boolean, uuid[]) from public, anon, authenticated;

-- D-094(g): before scheduling, the assessments the window would meet
create or replace function public.maintenance_collisions(p_platform boolean, p_institutions uuid[],
                                                         p_starts_at timestamptz, p_ends_at timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_from timestamptz; v_to timestamptz; v_n int; v_last timestamptz;
begin
  if not public.maintenance_may_act(p_platform, p_institutions) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  v_from := coalesce(p_starts_at, now()) - interval '15 minutes';
  v_to := coalesce(p_ends_at, coalesce(p_starts_at, now()) + interval '1 day');
  select count(*), max(aa.closes_at) into v_n, v_last
    from public.assessment_assignments aa
   where aa.status in ('SCHEDULED', 'OPEN')
     and (p_platform or aa.institution_id = any (p_institutions))
     and coalesce(aa.opens_at, aa.created_at) < v_to
     and (aa.closes_at is null or aa.closes_at > v_from);
  return jsonb_build_object('asesmen', v_n, 'terakhir_selesai', v_last);
end $$;
revoke all on function public.maintenance_collisions(boolean, uuid[], timestamptz, timestamptz) from public, anon;
grant execute on function public.maintenance_collisions(boolean, uuid[], timestamptz, timestamptz) to authenticated;

create or replace function public.schedule_maintenance(p_platform boolean, p_institutions uuid[], p_starts_at timestamptz,
                                                       p_ends_at timestamptz, p_message text, p_reason text, p_notice boolean)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_id uuid; v_start timestamptz; v_inst uuid[];
begin
  v_me := public.current_person_id();
  v_inst := case when coalesce(p_platform, false) then '{}'::uuid[]
                 else (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_institutions, '{}')) x) end;
  if v_me is null or not public.maintenance_may_act(p_platform, v_inst) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  v_start := coalesce(p_starts_at, now());
  if v_start < now() - interval '1 minute' or (p_ends_at is not null and p_ends_at <= v_start)
     or length(btrim(coalesce(p_reason, ''))) not between 1 and 300
     or (p_message is not null and length(btrim(p_message)) not between 1 and 500)
     or (coalesce(p_notice, false) and nullif(btrim(coalesce(p_message, '')), '') is null)
     or (not coalesce(p_platform, false) and cardinality(v_inst) = 0) then
    perform public.maintenance_refuse('MAINTENANCE_INPUT_INVALID');
  end if;
  insert into public.maintenance_windows (kind, platform, institution_ids, starts_at, ends_at, message, reason,
                                          created_by_person_id)
  values ('PLANNED', coalesce(p_platform, false), v_inst, v_start, p_ends_at, nullif(btrim(coalesce(p_message, '')), ''),
          btrim(p_reason), v_me)
  returning id into v_id;
  perform public.audit_write('maintenance.scheduled', 'maintenance_windows', v_id::text,
    case when coalesce(p_platform, false) then null else v_inst[1] end,
    jsonb_build_object('window', v_id, 'kind', 'PLANNED', 'platform', coalesce(p_platform, false),
                       'institutions', to_jsonb(v_inst), 'from_state', null, 'to_state',
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
revoke all on function public.schedule_maintenance(boolean, uuid[], timestamptz, timestamptz, text, text, boolean) from public, anon;
grant execute on function public.schedule_maintenance(boolean, uuid[], timestamptz, timestamptz, text, text, boolean) to authenticated;

-- start now, or end now (a window not yet started is cancelled); each with its reason
create or replace function public.change_maintenance(p_window uuid, p_action text, p_reason text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; w public.maintenance_windows; v_from text; v_to text;
begin
  v_me := public.current_person_id();
  select * into w from public.maintenance_windows where id = p_window for update;
  if v_me is null or w.id is null or not public.maintenance_controls(w) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  v_from := public.maintenance_state(w, now());
  if v_from = 'BERAKHIR' then perform public.maintenance_refuse('MAINTENANCE_NOT_OPEN'); end if;
  if p_action not in ('MULAI', 'AKHIRI') or length(btrim(coalesce(p_reason, ''))) not between 1 and 300
     or (p_action = 'MULAI' and v_from = 'AKTIF') then
    perform public.maintenance_refuse('MAINTENANCE_INPUT_INVALID');
  end if;
  if p_action = 'MULAI' then
    update public.maintenance_windows set starts_at = now(), activation_recorded_at = now() where id = w.id;
    v_to := 'AKTIF';
  else
    update public.maintenance_windows
       set ended_at = now(), ended_by_person_id = v_me, end_reason = btrim(p_reason),
           deactivation_recorded_at = coalesce(deactivation_recorded_at, now())
     where id = w.id;
    update public.broadcast_notices set withdrawn_at = now(), withdrawn_by_person_id = v_me
     where maintenance_window_id = w.id and withdrawn_at is null;
    v_to := 'BERAKHIR';
  end if;
  perform public.audit_write(
    case when p_action = 'MULAI' then 'maintenance.started_now'
         when v_from = 'AKTIF' then 'maintenance.ended_now' else 'maintenance.cancelled' end,
    'maintenance_windows', w.id::text, case when w.platform then null else w.institution_ids[1] end,
    jsonb_build_object('window', w.id, 'kind', w.kind, 'platform', w.platform, 'institutions', to_jsonb(w.institution_ids),
                       'from_state', v_from, 'to_state', v_to, 'starts_at', w.starts_at, 'ends_at', w.ends_at,
                       'reason', btrim(p_reason)));
  return jsonb_build_object('ok', true, 'window', w.id, 'state', v_to);
end $$;
revoke all on function public.change_maintenance(uuid, text, text) from public, anon;
grant execute on function public.change_maintenance(uuid, text, text) to authenticated;

-- D-094(h), D-100(c): «Hentikan sekarang». Admin platform only, a typed phrase and a reason. Separate from planned.
create or replace function public.stop_pintar_now(p_platform boolean, p_institutions uuid[], p_reason text, p_confirmation text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_id uuid; v_inst uuid[];
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
  if not coalesce(p_platform, false) and cardinality(v_inst) = 0 then
    perform public.maintenance_refuse('MAINTENANCE_INPUT_INVALID');
  end if;
  insert into public.maintenance_windows (kind, platform, institution_ids, starts_at, reason, created_by_person_id,
                                          activation_recorded_at)
  values ('EMERGENCY', coalesce(p_platform, false), v_inst, now(), btrim(p_reason), v_me, now())
  returning id into v_id;
  perform public.audit_write('maintenance.emergency_stop', 'maintenance_windows', v_id::text,
    case when coalesce(p_platform, false) then null else v_inst[1] end,
    jsonb_build_object('window', v_id, 'kind', 'EMERGENCY', 'platform', coalesce(p_platform, false),
                       'institutions', to_jsonb(v_inst), 'from_state', null, 'to_state', 'AKTIF',
                       'reason', btrim(p_reason)));
  return v_id;
end $$;
revoke all on function public.stop_pintar_now(boolean, uuid[], text, text) from public, anon;
grant execute on function public.stop_pintar_now(boolean, uuid[], text, text) to authenticated;

-- notices: publish and withdraw (D-094(b))
create or replace function public.publish_notice(p_platform boolean, p_institutions uuid[], p_message text,
                                                 p_publish_at timestamptz, p_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; v_id uuid; v_inst uuid[]; v_pub timestamptz;
begin
  v_me := public.current_person_id();
  v_inst := case when coalesce(p_platform, false) then '{}'::uuid[]
                 else (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_institutions, '{}')) x) end;
  if v_me is null or not public.maintenance_may_act(p_platform, v_inst) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  v_pub := coalesce(p_publish_at, now());
  if length(btrim(coalesce(p_message, ''))) not between 1 and 500 or p_expires_at is null or p_expires_at <= v_pub
     or p_expires_at <= now() or (not coalesce(p_platform, false) and cardinality(v_inst) = 0) then
    perform public.maintenance_refuse('NOTICE_INPUT_INVALID');
  end if;
  insert into public.broadcast_notices (platform, institution_ids, message, publish_at, expires_at, created_by_person_id)
  values (coalesce(p_platform, false), v_inst, btrim(p_message), v_pub, p_expires_at, v_me)
  returning id into v_id;
  perform public.audit_write('notice.published', 'broadcast_notices', v_id::text,
    case when coalesce(p_platform, false) then null else v_inst[1] end,
    jsonb_build_object('notice', v_id, 'platform', coalesce(p_platform, false), 'institutions', to_jsonb(v_inst),
                       'publish_at', v_pub, 'expires_at', p_expires_at));
  return v_id;
end $$;
revoke all on function public.publish_notice(boolean, uuid[], text, timestamptz, timestamptz) from public, anon;
grant execute on function public.publish_notice(boolean, uuid[], text, timestamptz, timestamptz) to authenticated;

create or replace function public.withdraw_notice(p_notice uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; n public.broadcast_notices;
begin
  v_me := public.current_person_id();
  select * into n from public.broadcast_notices where id = p_notice for update;
  if v_me is null or n.id is null or not public.maintenance_may_act(n.platform, n.institution_ids) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  if n.withdrawn_at is not null then perform public.maintenance_refuse('NOTICE_NOT_OPEN'); end if;
  if length(btrim(coalesce(p_reason, ''))) not between 1 and 300 then
    perform public.maintenance_refuse('NOTICE_INPUT_INVALID');
  end if;
  update public.broadcast_notices set withdrawn_at = now(), withdrawn_by_person_id = v_me where id = n.id;
  perform public.audit_write('notice.withdrawn', 'broadcast_notices', n.id::text,
    case when n.platform then null else n.institution_ids[1] end,
    jsonb_build_object('notice', n.id, 'reason', btrim(p_reason)));
  return jsonb_build_object('ok', true, 'notice', n.id);
end $$;
revoke all on function public.withdraw_notice(uuid, text) from public, anon;
grant execute on function public.withdraw_notice(uuid, text) to authenticated;

-- the administrator's list: the windows and notices this reader may act on, newest first
create or replace function public.maintenance_list()
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_win jsonb; v_not jsonb;
begin
  -- an administrator's list: Admin platform, or a person holding Admin sekolah somewhere
  if public.current_person_id() is null
     or not (public.is_system_admin()
             or exists (select 1 from public.role_assignments ra
                         where ra.person_id = public.current_person_id() and ra.role = 'INSTITUTION_ADMIN'
                           and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  perform public.maintenance_record_edges();
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', w.id, 'jenis', w.kind, 'keadaan', public.maintenance_state(w, now()), 'platform', w.platform,
           'sekolah', (select coalesce(jsonb_agg(i.name order by i.name), '[]'::jsonb) from public.institutions i where i.id = any (w.institution_ids)),
           'mulai', w.starts_at, 'selesai', w.ends_at, 'diakhiri', w.ended_at, 'pesan', w.message, 'alasan', w.reason,
           'menguasai', public.maintenance_controls(w)) order by w.created_at desc), '[]'::jsonb)
    into v_win
    from (select * from public.maintenance_windows m
           where public.is_system_admin() or public.maintenance_controls(m)
              -- a platform-wide window reaches every school, so its admins see it (they cannot change it)
              or m.platform
           order by m.created_at desc limit 50) w;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', n.id, 'pesan', n.message, 'terbit', n.publish_at, 'sampai', n.expires_at, 'ditarik', n.withdrawn_at,
           'platform', n.platform, 'boleh', public.maintenance_may_act(n.platform, n.institution_ids))
           order by n.created_at desc), '[]'::jsonb)
    into v_not
    from (select * from public.broadcast_notices x
           where public.maintenance_may_act(x.platform, x.institution_ids)
           order by x.created_at desc limit 50) n;
  return jsonb_build_object('pemeliharaan', v_win, 'pengumuman', v_not);
end $$;
revoke all on function public.maintenance_list() from public, anon;
grant execute on function public.maintenance_list() to authenticated;

-- ═══════════════════════════════════════════════════════════ the registry

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('maintenance_block_for_me', 'PLATFORM', '#148 policy helper behind PostgREST''s pre-request: what maintenance stops the '
   || 'caller''s own requests now (EMERGENCY, PLANNED or null). Returns a word only.', null, null),
  ('pintar_status_saya', 'LEARNER', '#148 (D-094(d)): the caller''s own maintenance windows (active or within the hour) and '
   || 'live notices, read once as a page begins; records a window''s automatic start or end as SYSTEM.', null, null),
  ('maintenance_collisions', 'STAFF', '#148 (D-094(g)): the assessments a proposed window would meet, for the people who '
   || 'may schedule it.', null, null),
  ('schedule_maintenance', 'STAFF', '#148 (D-094(a)): a planned window for the caller''s own school (Admin sekolah) or any '
   || 'schools or the platform (Admin platform), with an optional matching notice. Audited.', 'SCOPE', 'INSTITUTION_ADMIN'),
  ('change_maintenance', 'STAFF', '#148: start a window now, or end it now (cancel one not yet started), with a reason, by '
   || 'whoever controls it. Audited.', 'SCOPE', 'INSTITUTION_ADMIN'),
  ('stop_pintar_now', 'STAFF', '#148 (D-094(h), D-100(c)): Admin platform''s emergency stop, confirmed by a typed phrase and '
   || 'a reason; stops affected activity at once, running sittings included. Audited.', 'SYSTEM_ADMIN', null),
  ('publish_notice', 'STAFF', '#148 (D-094(b)): a notice to the caller''s own school (Admin sekolah) or any schools or the '
   || 'platform (Admin platform), from a publication time to an expiry. Audited.', 'SCOPE', 'INSTITUTION_ADMIN'),
  ('withdraw_notice', 'STAFF', '#148: withdraw a notice, with a reason. Audited.', 'SCOPE', 'INSTITUTION_ADMIN'),
  ('maintenance_list', 'STAFF', '#148: the windows and notices the caller may act on, newest first; records automatic '
   || 'edges as SYSTEM.', 'SCOPE', 'INSTITUTION_ADMIN');

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare w public.maintenance_windows;
begin
  foreach w.kind in array array['PLANNED', 'EMERGENCY']::public.maintenance_kind[] loop null; end loop;
  w.kind := 'PLANNED'; w.starts_at := now() + interval '20 minutes'; w.ends_at := now() + interval '2 hours';
  if public.maintenance_state(w, now()) <> 'TERJADWAL'
     or public.maintenance_state(w, now() + interval '6 minutes') <> 'MENJELANG'
     or public.maintenance_state(w, now() + interval '21 minutes') <> 'AKTIF'
     or public.maintenance_state(w, now() + interval '3 hours') <> 'BERAKHIR' then
    raise exception '#148: a planned window does not move through its states at T-15, T=0 and its end';
  end if;
  w.kind := 'EMERGENCY'; w.starts_at := now() + interval '5 minutes';
  if public.maintenance_state(w, now()) <> 'TERJADWAL' then
    raise exception '#148: an emergency window has a 15-minute warning';
  end if;
  if has_table_privilege('authenticated', 'public.maintenance_windows', 'select')
     or has_table_privilege('authenticated', 'public.broadcast_notices', 'select') then
    raise exception '#148: a client reads the windows or notices directly';
  end if;
  if not (select a.ok from public.assert_staff_rpc_authorization_declared() a) then
    raise exception '#148: %', (select a.detail from public.assert_staff_rpc_authorization_declared() a);
  end if;
end $$;

-- BOB-29 (Gate 6; IDENTITY-4.0 C4, C11, §7; D-085 T1, D-086(c)): A SHARED COMPUTER LOCKS AND RESUMES WITH THE PIN.
--
-- A staff session on a shared computer, and every class-card session (T1), locks after 5 minutes without activity;
-- the same person resumes it with their PIN (a card with its card PIN); 3 wrong PINs end that session; 60 minutes
-- locked end it too. A session on a computer its owner declared personal never locks (D-009's ~7 days stand).
-- Another device is never affected by this one's lock or failures. Locked hides the person's information but keeps
-- the session; ended needs a new sign-in.
--
-- WHERE IT IS ENFORCED (no client-only lock, IDENTITY-4.0 §10):
--   (1) THE DATABASE: PostgREST's pre-request function (pintar_permintaan.periksa) refuses every request whose JWT
--       carries a locked or ended session_id: PT423 (locked) or PT401 (ended). It is read-only and keyed by the
--       session, so a refreshed token of a locked session is refused as well, and a token issued before the lock.
--       Proven against PostgREST 12 before relying on it (GATE-0-FACTS §1: none was configured).
--   (2) THE PROXY: on each request of a signed-in browser it asks sesi_periksa (the one RPC a locked session may
--       call) and sends a locked browser to «PINTAR terkunci»; the screens follow (DAISY-23).
--
-- STATE, one row per Auth session (device_sessions): the mode (SHARED, PERSONAL, CARD), the last activity, the lock,
-- the failed PINs, the end. The state is computed, so a session that never returns is still locked at 5 minutes
-- and ended at 65; sesi_periksa records the lock, ends what has expired (deleting its auth.sessions row, so the
-- refresh fails) and tidies a few expired rows of others on the way. The row outlives the Auth session by a day,
-- so the remaining life of an ended session's access token is refused.
--
-- DEVICE CONTEXT (C11): «Komputer siapa ini?» is asked of a staff person on a browser that has not answered it; the
-- answer is kept per browser (the SHA-256 of a random httpOnly cookie) and person (device_contexts). Until then, and
-- by default, SHARED. Class cards are never asked (CARD); evaluation personas are never locked (C13).

-- ═══════════════════════════════════════════════════════════════ (1) state
create table public.device_sessions (
  session_id        uuid primary key,
  auth_user_id      uuid not null references auth.users (id) on delete cascade,
  mode              text not null check (mode in ('SHARED', 'PERSONAL', 'CARD')),
  last_activity_at  timestamptz not null default now(),
  locked_at         timestamptz,
  failures          smallint not null default 0 check (failures between 0 and 3),
  ended_at          timestamptz,
  ended_reason      text check (ended_reason in ('PIN_GAGAL', 'KUNCI_HABIS', 'KELUAR', 'KELUAR_SEMUA')),
  created_at        timestamptz not null default now(),
  check ((ended_at is null) = (ended_reason is null))
);
create index device_sessions_user on public.device_sessions (auth_user_id);
create index device_sessions_terbuka on public.device_sessions (last_activity_at) where ended_at is null and mode <> 'PERSONAL';
alter table public.device_sessions enable row level security;
revoke all on table public.device_sessions from public, anon, authenticated, service_role;
comment on table public.device_sessions is
  'BOB-29 (Gate 6): one row per Auth session: SHARED, PERSONAL or CARD; its last activity, its lock, its failed PINs '
  'and its end. Read by the pre-request refusal and sesi_periksa; written only by the sesi_* functions.';

create table public.device_contexts (
  device_hash   text not null check (device_hash ~ '^[0-9a-f]{64}$'),
  auth_user_id  uuid not null references auth.users (id) on delete cascade,
  mode          text not null check (mode in ('SHARED', 'PERSONAL')),
  declared_at   timestamptz not null default now(),
  primary key (device_hash, auth_user_id)
);
alter table public.device_contexts enable row level security;
revoke all on table public.device_contexts from public, anon, authenticated, service_role;
comment on table public.device_contexts is
  'BOB-29 (C11): «Komputer siapa ini?», answered per browser (the SHA-256 of its httpOnly device cookie) and person. '
  'A declaration, not proof of ownership.';

-- The timings, in one place (IDENTITY-4.0 §7): 5 minutes without activity lock; 60 minutes locked end.
create function public.sesi_keadaan(p public.device_sessions, p_nu timestamptz)
returns text
language sql immutable set search_path = public, pg_temp as $$
  select case
    when p.ended_at is not null then 'BERAKHIR'
    when p.mode = 'PERSONAL' then 'BUKA'
    when coalesce(p.locked_at, p.last_activity_at + interval '5 minutes') + interval '60 minutes' <= p_nu then 'BERAKHIR'
    when p.locked_at is not null or p.last_activity_at + interval '5 minutes' <= p_nu then 'TERKUNCI'
    else 'BUKA'
  end
$$;

-- The caller's own session, from the JWT PostgREST verified: its id, or null.
create function public.sesi_saya()
returns uuid
language plpgsql stable set search_path = public, pg_temp as $$
declare v text;
begin
  begin
    v := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'session_id';
  exception when others then
    return null;
  end;
  return case when v ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then v::uuid end;
end $$;

-- End one session: recorded (so the rest of its access token's life is refused), its Auth session deleted (so the
-- refresh fails), audited. Internal.
create function public.sesi_akhiri_inti(p_sesi uuid, p_alasan text)
returns void
language plpgsql set search_path = public, pg_temp as $$
declare v_user uuid;
begin
  update public.device_sessions set ended_at = clock_timestamp(), ended_reason = p_alasan
   where session_id = p_sesi and ended_at is null
  returning auth_user_id into v_user;
  delete from auth.sessions where id = p_sesi;
  if v_user is not null then
    perform public.audit_write('identity.session_ended', 'auth.users', v_user::text, null,
      jsonb_build_object('reason', p_alasan));
  end if;
end $$;

-- ═══════════════════════════════════════════════════════ (2) the database's refusal
create schema if not exists pintar_permintaan;
comment on schema pintar_permintaan is
  'BOB-29: PostgREST''s pre-request function lives here, outside the API schemas, so it can be run by every request '
  'role and called as an RPC by none.';
revoke all on schema pintar_permintaan from public;
grant usage on schema pintar_permintaan to anon, authenticated, service_role;

create function pintar_permintaan.periksa()
returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_sesi uuid; v_peran text; r public.device_sessions;
begin
  begin
    v_peran := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  exception when others then
    v_peran := null;
  end;
  if v_peran is distinct from 'authenticated' then
    return;
  end if;
  -- the lock screen's own questions pass: where it stands, and leaving
  if current_setting('request.path', true) in ('/rpc/sesi_periksa', '/rpc/sesi_akhiri_saya') then
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

alter role authenticator set pgrst.db_pre_request to 'pintar_permintaan.periksa';
notify pgrst, 'reload config';

-- ═══════════════════════════════════════════════════════ (3) the person's own calls
-- Where this session stands, asked by the proxy on each request of a signed-in browser (the one call a locked
-- session may make). The first time, the row is made: a class card is CARD; a staff person is what this browser
-- was declared for them, else SHARED; an evaluation persona is never locked (TANPA, no row). A page visit
-- (p_navigasi) is activity while open; nothing unlocks. A lock is recorded when first seen, an expired session is
-- ended. A few expired sessions of others are ended on the way, so an abandoned one ends even if it never returns.
create function public.sesi_periksa(p_perangkat text default null, p_navigasi boolean default false)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_sesi uuid := public.sesi_saya(); v_user uuid := auth.uid(); v_nu timestamptz := clock_timestamp();
  r public.device_sessions; v_akun public.accounts; v_mode text; v_keadaan text; v_alat text; x record;
begin
  if v_sesi is null or v_user is null then
    return jsonb_build_object('keadaan', 'TANPA');
  end if;
  v_alat := case when p_perangkat ~ '^[0-9a-f]{64}$' then p_perangkat end;
  select * into r from public.device_sessions s where s.session_id = v_sesi and s.auth_user_id = v_user for update;
  if not found then
    select a.* into v_akun from public.accounts a where a.auth_user_id = v_user;
    if v_akun.id is null or public.adalah_persona(v_akun.person_id) then
      return jsonb_build_object('keadaan', 'TANPA');
    end if;
    if v_akun.kind = 'CLASSROOM_CARD' then
      v_mode := 'CARD';
    else
      select c.mode into v_mode from public.device_contexts c where c.device_hash = v_alat and c.auth_user_id = v_user;
      v_mode := coalesce(v_mode, 'SHARED');
    end if;
    insert into public.device_sessions (session_id, auth_user_id, mode, last_activity_at)
    values (v_sesi, v_user, v_mode, v_nu)
    on conflict (session_id) do nothing;
    select * into r from public.device_sessions s where s.session_id = v_sesi and s.auth_user_id = v_user for update;
    if not found then
      return jsonb_build_object('keadaan', 'TANPA');
    end if;
  end if;

  v_keadaan := public.sesi_keadaan(r, v_nu);
  if v_keadaan = 'BUKA' and p_navigasi and r.mode <> 'PERSONAL' then
    update public.device_sessions set last_activity_at = v_nu where session_id = v_sesi returning * into r;
  elsif v_keadaan = 'TERKUNCI' and r.locked_at is null then
    update public.device_sessions set locked_at = r.last_activity_at + interval '5 minutes'
     where session_id = v_sesi returning * into r;
  elsif v_keadaan = 'BERAKHIR' and r.ended_at is null then
    perform public.sesi_akhiri_inti(v_sesi, 'KUNCI_HABIS');
  end if;

  -- an abandoned session ends even if its browser never returns: a few at a time, on the way
  for x in select s.session_id from public.device_sessions s
            where s.ended_at is null and s.mode <> 'PERSONAL' and s.session_id <> v_sesi
              and s.last_activity_at < v_nu - interval '65 minutes'
              and coalesce(s.locked_at, s.last_activity_at + interval '5 minutes') + interval '60 minutes' <= v_nu
            order by s.last_activity_at limit 5 for update skip locked loop
    perform public.sesi_akhiri_inti(x.session_id, 'KUNCI_HABIS');
  end loop;
  delete from public.device_sessions s
   where s.session_id in (select d.session_id from public.device_sessions d
                           where d.ended_at < v_nu - interval '1 day' limit 20 for update skip locked);

  return jsonb_build_object(
    'keadaan', v_keadaan,
    'mode', r.mode,
    'sisa_detik', case when v_keadaan = 'BUKA' and r.mode <> 'PERSONAL'
                       then greatest(0, ceil(extract(epoch from r.last_activity_at + interval '5 minutes' - v_nu)))::int end,
    'percobaan_sisa', case when v_keadaan = 'TERKUNCI' then 3 - r.failures end,
    -- a staff person is named on their own lock screen, as on the strip; a learner never is (S15, D-020)
    'nama', case when v_keadaan = 'TERKUNCI' and r.mode <> 'CARD'
                 then (select p.display_name from public.accounts a join public.persons p on p.id = a.person_id where a.auth_user_id = v_user) end,
    -- a staff person without a usable PIN (still setting up, or the PIN reset) cannot resume: Keluar only
    'bisa_pin', case when v_keadaan = 'TERKUNCI'
                     then r.mode = 'CARD' or exists (select 1 from public.accounts a join public.person_pins pp on pp.person_id = a.person_id
                                                      where a.auth_user_id = v_user and not pp.reset_required) end,
    'perlu_pilih', r.mode <> 'CARD' and v_keadaan = 'BUKA'
                   and not exists (select 1 from public.device_contexts c where c.device_hash = v_alat and c.auth_user_id = v_user));
end $$;

-- Activity from the screen (a key, a click, a scroll), at most about once a minute. Refused by the pre-request
-- while locked or ended, so activity never unlocks.
create function public.sesi_detak()
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_sesi uuid := public.sesi_saya(); r public.device_sessions;
begin
  -- the caller's own session, of a person: the row is keyed by the verified token's session and its user
  if public.current_person_id() is null then
    return jsonb_build_object('sisa_detik', null);
  end if;
  update public.device_sessions s set last_activity_at = clock_timestamp()
   where s.session_id = v_sesi and s.auth_user_id = auth.uid() and s.ended_at is null and s.mode <> 'PERSONAL'
     and public.sesi_keadaan(s, clock_timestamp()) = 'BUKA'
  returning * into r;
  return jsonb_build_object('sisa_detik', case when r.session_id is not null then 300 end);
end $$;

-- The screen saw 5 minutes without activity (its own clock, across its tabs): lock now. The server's record of the
-- last activity can trail the screen's by up to the heartbeat's minute, so the screen locks the session itself
-- rather than wait for the server to agree. Locking early is always safe; nothing here unlocks.
create function public.sesi_kunci_saya()
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_sesi uuid := public.sesi_saya();
begin
  if public.current_person_id() is null then
    return jsonb_build_object('keadaan', 'TANPA');
  end if;
  update public.device_sessions s set locked_at = clock_timestamp()
   where s.session_id = v_sesi and s.auth_user_id = auth.uid() and s.ended_at is null and s.mode <> 'PERSONAL' and s.locked_at is null;
  return jsonb_build_object('keadaan', (select public.sesi_keadaan(s, clock_timestamp()) from public.device_sessions s where s.session_id = v_sesi));
end $$;

-- «Komputer siapa ini?» (C11): this browser's answer for the caller, and this session follows it. Staff only.
create function public.sesi_tetapkan_perangkat(p_perangkat text, p_mode text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_sesi uuid := public.sesi_saya(); v_akun public.accounts;
begin
  if p_perangkat is null or p_perangkat !~ '^[0-9a-f]{64}$' or p_mode is null or p_mode not in ('SHARED', 'PERSONAL') then
    raise exception using errcode = '22023', message = 'sesi_tetapkan_perangkat: a device hash and SHARED or PERSONAL';
  end if;
  select a.* into v_akun from public.accounts a where a.auth_user_id = v_user;
  if v_akun.id is null or v_akun.kind <> 'EMAIL' or public.adalah_persona(v_akun.person_id) then
    raise exception using errcode = 'PR040', detail = 'PERANGKAT_TIDAK_BERLAKU', message = 'only a staff account declares its computer';
  end if;
  insert into public.device_contexts (device_hash, auth_user_id, mode) values (p_perangkat, v_user, p_mode)
  on conflict (device_hash, auth_user_id) do update set mode = excluded.mode, declared_at = now();
  update public.device_sessions set mode = p_mode, last_activity_at = clock_timestamp()
   where session_id = v_sesi and auth_user_id = v_user and ended_at is null and mode <> 'CARD';
  perform public.audit_write('identity.device_declared', 'auth.users', v_user::text, null, jsonb_build_object('mode', p_mode));
  return p_mode;
end $$;

-- Leaving this device (Keluar, «Bukan akun Anda?»): this session is ended here too, so the rest of its access
-- token's life is refused. A locked session may call it.
create function public.sesi_akhiri_saya()
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_sesi uuid := public.sesi_saya(); v_user uuid := auth.uid();
begin
  if v_sesi is null or v_user is null then return; end if;
  insert into public.device_sessions (session_id, auth_user_id, mode)
  values (v_sesi, v_user, 'SHARED') on conflict (session_id) do nothing;
  perform public.sesi_akhiri_inti(v_sesi, 'KELUAR');
end $$;

-- «Keluar dari semua perangkat» (BOB-29, confirmed on Akun saya): every session of the caller ends, this one too.
create function public.sesi_akhiri_semua()
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); n int := 0; x record;
begin
  if v_user is null then
    raise exception using errcode = '42501', message = 'no person in this session';
  end if;
  insert into public.device_sessions (session_id, auth_user_id, mode)
  select s.id, s.user_id, 'SHARED' from auth.sessions s where s.user_id = v_user
  on conflict (session_id) do nothing;
  for x in select d.session_id from public.device_sessions d where d.auth_user_id = v_user and d.ended_at is null for update loop
    perform public.sesi_akhiri_inti(x.session_id, 'KELUAR_SEMUA');
    n := n + 1;
  end loop;
  delete from auth.sessions where user_id = v_user;
  return n;
end $$;

-- ═══════════════════════════════════════════════════════ (4) resuming, the server's
-- The PIN on «PINTAR terkunci»: a staff person's personal PIN (BOB-24's hash), or a class card's derived secret
-- checked against its Auth password (the route derives it with the pepper; the PIN is never stored). A match opens
-- the session; 3 wrong end it (D-055: that session only). Service role, for the route that read the session.
create function public.sesi_buka(p_sesi uuid, p_auth_user uuid, p_rahasia text)
returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare r public.device_sessions; v_keadaan text; v_cocok boolean; v_hash text; v_person uuid;
begin
  select * into r from public.device_sessions s where s.session_id = p_sesi and s.auth_user_id = p_auth_user for update;
  if not found then
    return jsonb_build_object('keadaan', 'TANPA');
  end if;
  v_keadaan := public.sesi_keadaan(r, clock_timestamp());
  if v_keadaan = 'BERAKHIR' then
    if r.ended_at is null then perform public.sesi_akhiri_inti(p_sesi, 'KUNCI_HABIS'); end if;
    return jsonb_build_object('keadaan', 'BERAKHIR');
  end if;
  if v_keadaan = 'BUKA' then
    return jsonb_build_object('keadaan', 'BUKA');
  end if;
  if r.mode = 'CARD' then
    select u.encrypted_password into v_hash from auth.users u where u.id = p_auth_user;
    v_cocok := v_hash is not null and v_hash <> '' and coalesce(p_rahasia, '') <> ''
               and extensions.crypt(p_rahasia, v_hash) = v_hash;
  else
    select a.person_id into v_person from public.accounts a where a.auth_user_id = p_auth_user and a.kind = 'EMAIL';
    v_cocok := public.pin_matches(v_person, p_rahasia);
  end if;
  if v_cocok then
    update public.device_sessions set locked_at = null, failures = 0, last_activity_at = clock_timestamp()
     where session_id = p_sesi;
    perform public.audit_write('identity.session_resumed', 'auth.users', p_auth_user::text, null, jsonb_build_object('mode', r.mode));
    return jsonb_build_object('keadaan', 'BUKA');
  end if;
  if r.failures + 1 >= 3 then
    update public.device_sessions set failures = 3, locked_at = coalesce(locked_at, clock_timestamp()) where session_id = p_sesi;
    perform public.sesi_akhiri_inti(p_sesi, 'PIN_GAGAL');
    return jsonb_build_object('keadaan', 'BERAKHIR');
  end if;
  update public.device_sessions set failures = r.failures + 1, locked_at = coalesce(locked_at, r.last_activity_at + interval '5 minutes')
   where session_id = p_sesi;
  perform public.audit_write('identity.session_pin_wrong', 'auth.users', p_auth_user::text, null, jsonb_build_object('failures', r.failures + 1));
  return jsonb_build_object('keadaan', 'TERKUNCI', 'percobaan_sisa', 2 - r.failures);
end $$;

-- ═══════════════════════════════════════════════════════════════ surfaces
revoke all on function public.sesi_keadaan(public.device_sessions, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.sesi_saya() from public, anon, authenticated, service_role;
revoke all on function public.sesi_akhiri_inti(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.sesi_periksa(text, boolean) from public, anon;
revoke all on function public.sesi_detak() from public, anon;
revoke all on function public.sesi_kunci_saya() from public, anon;
revoke all on function public.sesi_tetapkan_perangkat(text, text) from public, anon;
revoke all on function public.sesi_akhiri_saya() from public, anon;
revoke all on function public.sesi_akhiri_semua() from public, anon;
grant execute on function public.sesi_periksa(text, boolean) to authenticated;
grant execute on function public.sesi_detak() to authenticated;
grant execute on function public.sesi_kunci_saya() to authenticated;
grant execute on function public.sesi_tetapkan_perangkat(text, text) to authenticated;
grant execute on function public.sesi_akhiri_saya() to authenticated;
grant execute on function public.sesi_akhiri_semua() to authenticated;
revoke all on function public.sesi_buka(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.sesi_buka(uuid, uuid, text) to service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('sesi_periksa', 'LEARNER', 'BOB-29, the caller''s own session: where it stands (open, locked, ended; its mode, the seconds to the '
   || 'lock, the PIN tries left, whether «Komputer siapa ini?» is due). The proxy asks it on each request; the one call a locked '
   || 'session may make. Records the lock and ends an expired session; never unlocks.', null, null),
  ('sesi_detak', 'LEARNER', 'BOB-29, the caller''s own session: activity from the screen keeps it open. Refused while locked.', null, null),
  ('sesi_kunci_saya', 'LEARNER', 'BOB-29, the caller''s own session locks now: the screen saw 5 minutes without activity. Never '
   || 'unlocks.', null, null),
  ('sesi_tetapkan_perangkat', 'LEARNER', 'BOB-29 (C11), the caller''s own: this browser is a shared or a personal computer for them; '
   || 'a staff account only; audited.', null, null),
  ('sesi_akhiri_saya', 'LEARNER', 'BOB-29, the caller''s own session ends (Keluar, «Bukan akun Anda?»); a locked session may call it.', null, null),
  ('sesi_akhiri_semua', 'LEARNER', 'BOB-29, «Keluar dari semua perangkat»: every session of the caller ends, audited.', null, null);

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare t text; r text; s public.device_sessions;
begin
  foreach t in array array['device_sessions', 'device_contexts'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass)
       or exists (select 1 from pg_policy where polrelid = ('public.' || t)::regclass) then
      raise exception 'BOB-29: % must have RLS and no policy', t;
    end if;
    foreach r in array array['anon', 'authenticated', 'service_role'] loop
      if has_table_privilege(r, 'public.' || t, 'select') then
        raise exception 'BOB-29: % can read %', r, t;
      end if;
    end loop;
  end loop;
  if has_function_privilege('authenticated', 'public.sesi_buka(uuid,uuid,text)', 'execute')
     or has_function_privilege('anon', 'public.sesi_periksa(text,boolean)', 'execute') then
    raise exception 'BOB-29: a client can resume a session, or a stranger ask about one';
  end if;
  if not exists (select 1 from pg_db_role_setting d join pg_roles ro on ro.oid = d.setrole
                  where ro.rolname = 'authenticator' and 'pgrst.db_pre_request=pintar_permintaan.periksa' = any (d.setconfig)) then
    raise exception 'BOB-29: PostgREST''s pre-request is not the session check';
  end if;
  -- the timings (IDENTITY-4.0 §7)
  s.mode := 'SHARED'; s.last_activity_at := now();
  if public.sesi_keadaan(s, now() + interval '4 minutes 59 seconds') <> 'BUKA'
     or public.sesi_keadaan(s, now() + interval '5 minutes') <> 'TERKUNCI'
     or public.sesi_keadaan(s, now() + interval '65 minutes') <> 'BERAKHIR' then
    raise exception 'BOB-29: a shared session does not lock at 5 minutes and end 60 minutes later';
  end if;
  s.mode := 'PERSONAL';
  if public.sesi_keadaan(s, now() + interval '6 days') <> 'BUKA' then
    raise exception 'BOB-29: a personal computer''s session locks';
  end if;
end $$;

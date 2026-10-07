-- L3 · CR-83 (D-127 §1, Q1, Q2, Q3, Q11; D-130(j); D-132): A SESSION KNOWS WHAT IT IS HERE TO DO.
--
-- «Identity tells PINTAR who the person is. Entitlement tells PINTAR what they may do. Working context tells PINTAR
-- what they are doing here, in this session, on this device. Working context may narrow presentation and action
-- choices; it must never widen authority.» (D-127 §1). The design, ruled GREEN WITH MODIFICATIONS (D-132):
-- docs/reports/PINTAR-4.0-L3-WORKING-CONTEXT-DESIGN-2026-10-07.md.
--
-- 4.0 had no working context: the door was dropped at sign-in, the landing followed the highest-ranked role, and
-- every school-shaped screen merged every school (Dr Gladys's DG-19 to DG-22). The context is now a PURPOSE and a
-- PLACE, held on the session's own device_sessions row (one per Auth session, so one per signed-in browser):
--
--   BELAJAR    no place: the person's own learning (C1). Held by everyone; offered on the chooser to a person with
--              an active enrolment, and to a class card.
--   MENGAJAR   one school, from the person's teaching appointments only, Guru and Kepala departemen (C2, HOD-08).
--              Admin sekolah's and Admin platform's authority gives no Mengajar. A teaching appointment in a PINTAR
--              library (its authors) gives Mengajar in that library, whose work is Studio's.
--   MENGELOLA  one school, from Kepala departemen, Dekan and Admin sekolah; for Admin platform also every active
--              school, each PINTAR library (PLATFORM_CANONICAL) and «Seluruh platform», the deliberately
--              platform-wide place (C7).
--   A class-card account holds BELAJAR only (C6; presentation; who may hold a card is CR-91's, not this).
--
-- THE RULES:
--   * ONE WRITER, konteks_tetapkan: the caller's own current session only, and only a pair the person holds now. A
--     door (PINTU) or a requested page (HALAMAN) sets a context only where the session has none (C4); the person's
--     own choice (PILIHAN) at any time.
--   * ONE READER, konteks_saya: re-checks the stored pair against the grants as they are now. A pair no longer held
--     is cleared, never moved to another purpose or place (§2.7).
--   * konteks_tempat_saya: the pairs the person holds, for the chooser. konteks_dipegang: one pair, internal.
--   * sesi_akhiri_inti clears the context with the session's end: «Keluar», expiry, three wrong PINs, a credential
--     change, «Keluar dari semua perangkat» (§2.8). The row is the context's only home: no cookie, no URL.
--   * NEVER AUTHORITY. No RLS policy and no function that authorizes an act reads these columns or functions; the
--     verification below fails this migration if one does. Every act is decided exactly as before. System and
--     platform-scoped operations use their governed scope and never fabricate a device session (D-132(k)).
--   * An evaluation persona has no row and so no context (C10): konteks_saya answers TANPA, the writer refuses.
--   * The sign-out mark that keeps a stale continuation from the next sign-in is the application's 4.0 guard
--     (D-132(e)); it is not part of this model and holds no identity.

-- ═══════════════════════════════════════════════════════════════ (1) the context, on the session's own row
alter table public.device_sessions
  add column konteks_tujuan   text check (konteks_tujuan in ('BELAJAR', 'MENGAJAR', 'MENGELOLA')),
  add column konteks_tempat   uuid references public.institutions (id),
  add column konteks_platform boolean not null default false,
  add column konteks_sebab    text check (konteks_sebab in ('PINTU', 'PILIHAN', 'HALAMAN')),
  add column konteks_pada     timestamptz,
  add constraint device_sessions_konteks_bentuk check (
    (konteks_tujuan is null and konteks_tempat is null and not konteks_platform
       and konteks_sebab is null and konteks_pada is null)
    or (konteks_sebab is not null and konteks_pada is not null and (
          (konteks_tujuan = 'BELAJAR' and konteks_tempat is null and not konteks_platform)
       or (konteks_tujuan = 'MENGAJAR' and konteks_tempat is not null and not konteks_platform)
       or (konteks_tujuan = 'MENGELOLA' and ((konteks_tempat is not null) <> konteks_platform)))));

comment on column public.device_sessions.konteks_tujuan is
  'L3 (D-127 Q1, D-132): this session''s working context, its purpose: BELAJAR, MENGAJAR or MENGELOLA. Presentation '
  'only: no policy and no authorization reads it. Written by konteks_tetapkan, cleared with the session''s end.';
comment on column public.device_sessions.konteks_tempat is
  'L3 (D-127 Q2): the place of the working context, one school or a PINTAR library; null for BELAJAR and for '
  '«Seluruh platform».';
comment on column public.device_sessions.konteks_platform is
  'L3 (C7): MENGELOLA in «Seluruh platform», the deliberately platform-wide place of Admin platform.';
comment on column public.device_sessions.konteks_sebab is
  'L3: how the context was set: PINTU (a door at sign-in), PILIHAN (the person''s own choice on the chooser), HALAMAN '
  '(a requested page, only where none existed and exactly one held pair fits it, C4).';

-- ═══════════════════════════════════════════════════════════════ (2) what the person holds
-- The purpose · place pairs the caller holds now, for the chooser: derived from the grants every time, never stored.
-- A class card holds BELAJAR only (C6). peran names the grants that give the purpose in that place, and kemampuan
-- the capabilities those grants carry (role_capabilities, the one map), so the screens show that purpose's
-- capabilities there and no others (C8); the database still decides every act from all of the person's grants.
create function public.konteks_tempat_saya()
returns table (tujuan text, tempat uuid, platform boolean, nama text, jenis text, peran text[], kemampuan text[])
language sql stable security definer set search_path = public, pg_temp as $$
  with orang as (
    select a.person_id, a.kind::text as kind from public.accounts a
     where a.auth_user_id = auth.uid() and a.person_id = public.current_person_id() limit 1
  ),
  hibah as (
    select ra.role::text as peran, ra.institution_id
      from public.role_assignments ra join orang o on o.person_id = ra.person_id
     where o.kind <> 'CLASSROOM_CARD' and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
  ),
  platform as (select exists (select 1 from hibah where peran = 'SYSTEM_ADMIN') as ya),
  pasangan as (
    -- BELAJAR: the person's own learning (C1)
    select 'BELAJAR'::text as tujuan, null::uuid as tempat, false as platform, null::text as nama, null::text as jenis,
           array[]::text[] as peran, 1 as urut
      from orang o
     where o.kind = 'CLASSROOM_CARD'
        or exists (select 1 from public.enrollments e where e.person_id = o.person_id and e.status = 'ACTIVE')
    union all
    -- MENGAJAR: teaching appointments only (C2); in a library, its authors
    select 'MENGAJAR', i.id, false, i.name, i.tenant_kind::text,
           array_agg(distinct h.peran order by h.peran), 2
      from hibah h join public.institutions i on i.id = h.institution_id
     where h.peran in ('EDUCATOR', 'HEAD_OF_DEPARTMENT') and i.is_active
       and i.tenant_kind in ('INSTITUTION', 'PLATFORM_CANONICAL')
     group by i.id, i.name, i.tenant_kind
    union all
    -- MENGELOLA in a school or a library: leadership and administration there; Admin platform everywhere (C7)
    select 'MENGELOLA', i.id, false, i.name, i.tenant_kind::text,
           array(select distinct h.peran from hibah h
                  where h.institution_id = i.id and h.peran in ('HEAD_OF_DEPARTMENT', 'DEAN', 'INSTITUTION_ADMIN')
                 union
                 select 'SYSTEM_ADMIN' where (select ya from platform)
                 order by 1),
           case when i.tenant_kind = 'INSTITUTION' then 3 else 4 end
      from public.institutions i
     where i.is_active and i.tenant_kind in ('INSTITUTION', 'PLATFORM_CANONICAL')
       and ((select ya from platform)
            or exists (select 1 from hibah h where h.institution_id = i.id
                                               and h.peran in ('HEAD_OF_DEPARTMENT', 'DEAN', 'INSTITUTION_ADMIN')))
    union all
    -- MENGELOLA in «Seluruh platform»: Admin platform only, deliberately platform-wide (C7)
    select 'MENGELOLA', null, true, null, null, array['SYSTEM_ADMIN'], 5
     where (select ya from platform)
  )
  select p.tujuan, p.tempat, p.platform, p.nama, p.jenis, p.peran,
         array(select distinct c from unnest(p.peran) g(r)
                 cross join lateral unnest(public.role_capabilities(g.r::public.app_role)) c order by 1)
    from pasangan p
   order by p.urut, p.nama, p.tempat
$$;

-- One pair: does the caller hold it now? BELAJAR is everyone's own (C1). Internal: the writer and the reader ask it.
create function public.konteks_dipegang(p_tujuan text, p_tempat uuid, p_platform boolean)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.current_person_id() is not null and (
    (p_tujuan = 'BELAJAR' and p_tempat is null and not coalesce(p_platform, false))
    or exists (select 1 from public.konteks_tempat_saya() k
                where k.tujuan = p_tujuan and k.tempat is not distinct from p_tempat
                  and k.platform = coalesce(p_platform, false)))
$$;

-- ═══════════════════════════════════════════════════════════════ (3) the one writer
-- The caller's own current session, a pair they hold now. A door or a requested page only where the session has no
-- context yet (C4); the person's own choice at any time. A locked session cannot call it (the pre-request refuses).
create function public.konteks_tetapkan(p_tujuan text, p_tempat uuid default null, p_platform boolean default false,
                                        p_sebab text default 'PILIHAN')
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_sesi uuid := public.sesi_saya(); v_user uuid := auth.uid(); r public.device_sessions;
  v_platform boolean := coalesce(p_platform, false);
begin
  if p_tujuan is null or p_tujuan not in ('BELAJAR', 'MENGAJAR', 'MENGELOLA')
     or p_sebab is null or p_sebab not in ('PINTU', 'PILIHAN', 'HALAMAN') then
    raise exception using errcode = '22023',
      message = 'konteks_tetapkan: a purpose (BELAJAR, MENGAJAR, MENGELOLA) and how it was chosen (PINTU, PILIHAN, HALAMAN)';
  end if;
  if v_sesi is null or v_user is null then
    raise exception using errcode = 'PR040', detail = 'KONTEKS_TANPA_SESI',
      message = 'a working context belongs to a signed-in session';
  end if;
  select * into r from public.device_sessions s where s.session_id = v_sesi and s.auth_user_id = v_user for update;
  if not found or r.ended_at is not null or public.sesi_keadaan(r, clock_timestamp()) = 'BERAKHIR' then
    raise exception using errcode = 'PR040', detail = 'KONTEKS_TANPA_SESI',
      message = 'a working context belongs to a signed-in session';
  end if;
  if not public.konteks_dipegang(p_tujuan, p_tempat, v_platform) then
    raise exception using errcode = 'PR040', detail = 'KONTEKS_TIDAK_DIPEGANG',
      message = 'this purpose and place are not held by this person';
  end if;
  if p_sebab in ('PINTU', 'HALAMAN') and r.konteks_tujuan is not null then
    raise exception using errcode = 'PR040', detail = 'KONTEKS_SUDAH_ADA',
      message = 'a door or a requested page sets a working context only where the session has none (C4)';
  end if;
  update public.device_sessions
     set konteks_tujuan = p_tujuan, konteks_tempat = p_tempat, konteks_platform = v_platform,
         konteks_sebab = p_sebab, konteks_pada = clock_timestamp()
   where session_id = v_sesi;
  return jsonb_build_object('tujuan', p_tujuan, 'tempat', p_tempat, 'platform', v_platform, 'sebab', p_sebab);
end $$;

-- ═══════════════════════════════════════════════════════════════ (4) the one reader
-- This session's context, re-checked against the grants as they are now. TANPA: no session row (an evaluation
-- persona, C10, or a row not made yet); BERAKHIR: the session has ended; KOSONG: none set; ADA: held, with the place's
-- name and the grants that give it; TIDAK_BERLAKU: it was no longer held, and has just been cleared (§2.7).
create function public.konteks_saya()
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_sesi uuid := public.sesi_saya(); v_user uuid := auth.uid(); r public.device_sessions; k record;
begin
  if v_sesi is null or v_user is null then
    return jsonb_build_object('keadaan', 'TANPA');
  end if;
  select * into r from public.device_sessions s where s.session_id = v_sesi and s.auth_user_id = v_user;
  if not found then
    return jsonb_build_object('keadaan', 'TANPA');
  end if;
  if r.ended_at is not null or public.sesi_keadaan(r, clock_timestamp()) = 'BERAKHIR' then
    return jsonb_build_object('keadaan', 'BERAKHIR');
  end if;
  if r.konteks_tujuan is null then
    return jsonb_build_object('keadaan', 'KOSONG');
  end if;
  if r.konteks_tujuan = 'BELAJAR' then
    if public.current_person_id() is not null then
      return jsonb_build_object('keadaan', 'ADA', 'tujuan', 'BELAJAR', 'tempat', null, 'platform', false,
                                'nama', null, 'jenis', null, 'peran', '[]'::jsonb, 'kemampuan', '[]'::jsonb,
                                'sebab', r.konteks_sebab);
    end if;
  else
    select * into k from public.konteks_tempat_saya() t
     where t.tujuan = r.konteks_tujuan and t.tempat is not distinct from r.konteks_tempat
       and t.platform = r.konteks_platform;
    if found then
      return jsonb_build_object('keadaan', 'ADA', 'tujuan', k.tujuan, 'tempat', k.tempat, 'platform', k.platform,
                                'nama', k.nama, 'jenis', k.jenis, 'peran', to_jsonb(k.peran),
                                'kemampuan', to_jsonb(k.kemampuan), 'sebab', r.konteks_sebab);
    end if;
  end if;
  -- no longer held: cleared, never moved to another purpose or place
  update public.device_sessions
     set konteks_tujuan = null, konteks_tempat = null, konteks_platform = false, konteks_sebab = null, konteks_pada = null
   where session_id = v_sesi;
  return jsonb_build_object('keadaan', 'TIDAK_BERLAKU', 'tujuan', r.konteks_tujuan);
end $$;

-- ═══════════════════════════════════════════════════════════════ (5) the end clears it
-- 20261117100000's sesi_akhiri_inti, unchanged but for the context, which ends with its session (§2.8).
create or replace function public.sesi_akhiri_inti(p_sesi uuid, p_alasan text)
returns void
language plpgsql set search_path = public, pg_temp as $$
declare v_user uuid;
begin
  update public.device_sessions set ended_at = clock_timestamp(), ended_reason = p_alasan,
         konteks_tujuan = null, konteks_tempat = null, konteks_platform = false, konteks_sebab = null, konteks_pada = null
   where session_id = p_sesi and ended_at is null
  returning auth_user_id into v_user;
  delete from auth.sessions where id = p_sesi;
  if v_user is not null then
    perform public.audit_write('identity.session_ended', 'auth.users', v_user::text, null,
      jsonb_build_object('reason', p_alasan));
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════ surfaces
revoke all on function public.konteks_tempat_saya() from public, anon;
revoke all on function public.konteks_dipegang(text, uuid, boolean) from public, anon, authenticated, service_role;
revoke all on function public.konteks_tetapkan(text, uuid, boolean, text) from public, anon;
revoke all on function public.konteks_saya() from public, anon;
-- re-created above with its body extended; its privileges as 20261117100000 left them (ADR-0021)
revoke all on function public.sesi_akhiri_inti(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.konteks_tempat_saya() to authenticated;
grant execute on function public.konteks_tetapkan(text, uuid, boolean, text) to authenticated;
grant execute on function public.konteks_saya() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('konteks_tempat_saya', 'LEARNER', 'L3 (D-127 Q1, Q2; D-132), the caller''s own: the purpose · place pairs they hold now, '
   || 'for the chooser (Belajar; Mengajar from teaching appointments; Mengelola from leadership and administration, Admin '
   || 'platform everywhere and «Seluruh platform»). Derived from the grants; decides nothing.', null, null),
  ('konteks_tetapkan', 'LEARNER', 'L3 (D-132), the caller''s own current session: sets its working context to a pair the '
   || 'caller holds; a door or a requested page only where none is set (C4). Presentation only: no policy or '
   || 'authorization reads it.', null, null),
  ('konteks_saya', 'LEARNER', 'L3 (D-132), the caller''s own current session: its working context, re-checked against the '
   || 'grants as they are now; a pair no longer held is cleared, never moved.', null, null);

-- ═══════════════════════════════════════════════════ terminal verification (structure, ADR-0003)
do $$
declare v text;
begin
  -- the context lives on the session row, and only in one of its four shapes
  if (select count(*) from information_schema.columns
       where table_schema = 'public' and table_name = 'device_sessions'
         and column_name in ('konteks_tujuan', 'konteks_tempat', 'konteks_platform', 'konteks_sebab', 'konteks_pada')) <> 5
     or not exists (select 1 from pg_constraint where conname = 'device_sessions_konteks_bentuk') then
    raise exception 'L3: the working context is not on device_sessions in its checked shape';
  end if;
  -- NEVER AUTHORITY: no policy reads it
  select p.tablename into v from pg_policies p
   where coalesce(p.qual, '') ~ '\mkonteks_(tujuan|tempat|platform|sebab|pada|saya|tetapkan|dipegang)'
      or coalesce(p.with_check, '') ~ '\mkonteks_(tujuan|tempat|platform|sebab|pada|saya|tetapkan|dipegang)'
   limit 1;
  if v is not null then
    raise exception 'L3: the policy on % reads the working context, which must never authorize', v;
  end if;
  -- ... and no function but its own reads it
  select n.nspname || '.' || p.proname into v
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'pintar_permintaan')
     and p.prosrc ~ '\mkonteks_(tujuan|tempat|platform|sebab|pada|saya|tetapkan|dipegang)'
     and p.proname not in ('konteks_tempat_saya', 'konteks_dipegang', 'konteks_tetapkan', 'konteks_saya', 'sesi_akhiri_inti')
   limit 1;
  if v is not null then
    raise exception 'L3: % reads the working context; only its own functions may', v;
  end if;
  -- the end clears it
  if position('konteks_tujuan = null' in pg_get_functiondef('public.sesi_akhiri_inti(uuid,text)'::regprocedure)) = 0 then
    raise exception 'L3: a session''s end does not clear its working context';
  end if;
  -- never a stranger's, and the internal check is nobody's to call
  if has_function_privilege('anon', 'public.konteks_tetapkan(text,uuid,boolean,text)', 'execute')
     or has_function_privilege('anon', 'public.konteks_saya()', 'execute')
     or has_function_privilege('anon', 'public.konteks_tempat_saya()', 'execute')
     or has_function_privilege('authenticated', 'public.konteks_dipegang(text,uuid,boolean)', 'execute') then
    raise exception 'L3: the working context is reachable by someone it does not belong to';
  end if;
end $$;

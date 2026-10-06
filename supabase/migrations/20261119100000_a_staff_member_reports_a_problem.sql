-- ═══════════════════════════════════════════════════════════════════════════
-- «LAPORKAN MASALAH» (BOB-15 + DAISY-12; D-037 step 2; D-100(d) item 2;
-- D-101(f): the school resolves what it safely can, PINTAR is the last resort).
--
-- A member of staff (Guru, Kepala departemen, Dekan, Admin sekolah, Admin
-- platform) reports a problem from inside PINTAR. The report carries what they
-- did, expected and saw, and PINTAR attaches the rest itself: the page, the
-- reporter's role and school, the build, the time, the device and any error
-- reference. The reporter sees it received at once and follows its status
-- (Diterima → Ditangani → Selesai) with the next step written to them.
--
--   Tier 1: the school's Admin sekolah reads their school's reports and moves
--           them (how-to questions, the first look).
--   Tier 2: Admin platform reads every report and moves any.
--
-- Not a ticket platform: one table, one way in, one way to move a report
-- forward, each audited. Reports stay inside PINTAR under row security,
-- because they may name students (D-037). Students tell their teacher; a
-- student account cannot report.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.support_report_status as enum ('DITERIMA', 'DITANGANI', 'SELESAI');

create table public.support_reports (
  id                   uuid primary key default gen_random_uuid(),
  reporter_person_id   uuid not null references public.persons(id),
  -- the school of the reporter's own role; null only for Admin platform reporting without one
  institution_id       uuid references public.institutions(id),
  reporter_role        public.app_role not null,
  page                 text not null check (page ~ '^/\S*$' and length(page) <= 300),
  error_ref            text check (error_ref is null or error_ref ~ '^[A-Za-z0-9-]{1,64}$'),
  build_sha            text check (build_sha is null or build_sha ~ '^[0-9a-f]{7,40}$'),
  device               text check (device is null or length(device) <= 300),
  did                  text not null check (length(btrim(did)) between 1 and 2000),
  expected             text not null check (length(btrim(expected)) between 1 and 2000),
  happened             text not null check (length(btrim(happened)) between 1 and 2000),
  stops_class          boolean not null default false,
  screenshot_path      text check (screenshot_path is null or screenshot_path ~ '^laporan/[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|jpeg|webp)$'),
  status               public.support_report_status not null default 'DITERIMA',
  next_step            text check (next_step is null or length(btrim(next_step)) between 1 and 500),
  handled_by_person_id uuid references public.persons(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index support_reports_reporter_idx on public.support_reports (reporter_person_id, created_at desc);
create index support_reports_institution_idx on public.support_reports (institution_id, status, created_at desc);

comment on table public.support_reports is
  'D-037 step 2 (BOB-15): «Laporkan masalah». Written only by submit_support_report, moved only by '
  'move_support_report; read by the reporter, the school''s Admin sekolah and Admin platform.';

alter table public.support_reports enable row level security;
revoke all on public.support_reports from public, anon, authenticated;
grant select on public.support_reports to authenticated;
create policy support_reports_select on public.support_reports for select to authenticated using (
  reporter_person_id = public.current_person_id()
  or (institution_id is not null and public.has_scope('INSTITUTION_ADMIN', institution_id))
  or public.is_system_admin());

create or replace function public.support_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR100',
    detail  = p_code,
    message = case p_code
      when 'REPORT_NOT_STAFF'          then 'a problem is reported by a member of staff; a student tells their teacher'
      when 'REPORT_INPUT_INVALID'      then 'a report says what was done, what was expected and what happened (1 to 2000 characters each), on a PINTAR page'
      when 'REPORT_NOT_ALLOWED'        then 'a report is moved by its school''s Admin sekolah (INSTITUTION_ADMIN) or by Admin platform'
      when 'REPORT_STATUS_INVALID'     then 'a report moves forward only: Diterima, Ditangani, Selesai'
      when 'REPORT_NEXT_STEP_REQUIRED' then 'moving a report tells the reporter the next step (1 to 500 characters)'
      else 'the report could not be recorded' end;
end $$;
revoke all on function public.support_refuse(text) from public, anon, authenticated;

-- SUBMIT. The reporter writes three things; PINTAR attaches the rest. The role
-- and school are the reporter's own highest active role and its school; the
-- build is the request's own (as audit_write reads it); the page, any error
-- reference, the device and a screenshot already uploaded under the
-- reporter's own folder are passed by the server, never trusted beyond shape.
create or replace function public.submit_support_report(
  p_page text, p_error_ref text, p_did text, p_expected text, p_happened text,
  p_stops_class boolean, p_device text, p_screenshot text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; r record; v_sha text; v_id uuid; v_ref text; v_shot text;
begin
  v_me := public.current_person_id();
  select ra.role, s.institution_id into r
    from public.role_assignments ra left join public.org_nodes s on s.id = ra.scope_node_id
   where ra.person_id = v_me and ra.role <> 'STUDENT' and ra.revoked_at is null
     and now() >= ra.valid_from and now() < ra.valid_until
   order by (ra.role = 'SYSTEM_ADMIN'), public.role_rank(ra.role) desc, ra.created_at desc
   limit 1;
  if v_me is null or r.role is null then perform public.support_refuse('REPORT_NOT_STAFF'); end if;
  -- an Admin platform who also holds a school role reports from that school; one without reports from the platform
  if r.role = 'SYSTEM_ADMIN' then r.institution_id := null; end if;

  v_ref := nullif(btrim(coalesce(p_error_ref, '')), '');
  v_shot := nullif(btrim(coalesce(p_screenshot, '')), '');
  if coalesce(p_page, '') !~ '^/\S*$' or length(p_page) > 300
     or (v_ref is not null and v_ref !~ '^[A-Za-z0-9-]{1,64}$')
     or length(btrim(coalesce(p_did, ''))) not between 1 and 2000
     or length(btrim(coalesce(p_expected, ''))) not between 1 and 2000
     or length(btrim(coalesce(p_happened, ''))) not between 1 and 2000
     or (v_shot is not null and v_shot !~ ('^laporan/' || v_me::text || '/[0-9a-f-]{36}\.(png|jpg|jpeg|webp)$')) then
    perform public.support_refuse('REPORT_INPUT_INVALID');
  end if;

  begin
    v_sha := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-pintar-build';
  exception when others then v_sha := null; end;
  if v_sha !~ '^[0-9a-f]{7,40}$' then v_sha := null; end if;

  insert into public.support_reports (reporter_person_id, institution_id, reporter_role, page, error_ref, build_sha,
                                      device, did, expected, happened, stops_class, screenshot_path)
  values (v_me, r.institution_id, r.role, p_page, v_ref, v_sha, left(nullif(btrim(coalesce(p_device, '')), ''), 300),
          btrim(p_did), btrim(p_expected), btrim(p_happened), coalesce(p_stops_class, false), v_shot)
  returning id into v_id;

  perform public.audit_write('support_report.received', 'support_reports', v_id::text, r.institution_id,
    jsonb_build_object('page', p_page, 'error_ref', v_ref, 'stops_class', coalesce(p_stops_class, false),
                       'reporter_role', r.role));
  return jsonb_build_object('ok', true, 'report', v_id, 'status', 'DITERIMA', 'stops_class', coalesce(p_stops_class, false));
end $$;
revoke all on function public.submit_support_report(text, text, text, text, text, boolean, text, text) from public, anon;
grant execute on function public.submit_support_report(text, text, text, text, text, boolean, text, text) to authenticated;

-- MOVE. Forward only, and every move tells the reporter what happens next.
create or replace function public.move_support_report(p_report uuid, p_status text, p_next_step text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid; r public.support_reports; v_to public.support_report_status;
begin
  v_me := public.current_person_id();
  select * into r from public.support_reports where id = p_report for update;
  -- an unknown report and another school's answer alike
  if v_me is null or r.id is null
     or not (public.is_system_admin()
             or (r.institution_id is not null and public.has_scope('INSTITUTION_ADMIN', r.institution_id))) then
    perform public.support_refuse('REPORT_NOT_ALLOWED');
  end if;
  if p_status is null or p_status not in ('DITANGANI', 'SELESAI') then
    perform public.support_refuse('REPORT_STATUS_INVALID');
  end if;
  v_to := p_status::public.support_report_status;
  if r.status = 'SELESAI' or (r.status = 'DITANGANI' and v_to = 'DITANGANI') then
    perform public.support_refuse('REPORT_STATUS_INVALID');
  end if;
  if length(btrim(coalesce(p_next_step, ''))) not between 1 and 500 then
    perform public.support_refuse('REPORT_NEXT_STEP_REQUIRED');
  end if;
  update public.support_reports
     set status = v_to, next_step = btrim(p_next_step), handled_by_person_id = v_me, updated_at = now()
   where id = r.id;
  perform public.audit_write('support_report.moved', 'support_reports', r.id::text, r.institution_id,
    jsonb_build_object('from_status', r.status, 'to_status', v_to, 'next_step', btrim(p_next_step)));
  return jsonb_build_object('ok', true, 'report', r.id, 'status', v_to);
end $$;
revoke all on function public.move_support_report(uuid, text, text) from public, anon;
grant execute on function public.move_support_report(uuid, text, text) to authenticated;

-- A SCREENSHOT is read by whoever may read its report.
create or replace function public.may_read_support_screenshot(p_path text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.support_reports r
     where r.screenshot_path = p_path
       and (r.reporter_person_id = public.current_person_id()
            or (r.institution_id is not null and public.has_scope('INSTITUTION_ADMIN', r.institution_id))
            or public.is_system_admin()))
$$;
revoke all on function public.may_read_support_screenshot(text) from public, anon;
grant execute on function public.may_read_support_screenshot(text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('submit_support_report', 'STAFF', 'BOB-15 (D-037 step 2): «Laporkan masalah». A member of staff records a problem; PINTAR '
   || 'attaches the reporter''s highest active role and its school and the request''s build; the page, error reference, '
   || 'device and an own-folder screenshot are checked for shape. A student is refused PR100 REPORT_NOT_STAFF. Audited.',
   'INSTITUTION_MEMBER', null),
  ('move_support_report', 'STAFF', 'BOB-15: the school''s Admin sekolah (its own school''s reports) or Admin platform (any) '
   || 'moves a report forward, Diterima → Ditangani → Selesai, with the next step written to the reporter. Audited.',
   'SCOPE', 'INSTITUTION_ADMIN'),
  ('may_read_support_screenshot', 'STAFF', 'BOB-15: whether the caller may read a report''s screenshot (its reporter, the '
   || 'school''s Admin sekolah, Admin platform). Returns a boolean only.', null, null);

-- ═══════════════════════════════════════════════════ terminal verification
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.support_reports'::regclass) then
    raise exception 'BOB-15: support_reports has no row security';
  end if;
  if has_table_privilege('authenticated', 'public.support_reports', 'insert')
     or has_table_privilege('authenticated', 'public.support_reports', 'update')
     or has_table_privilege('anon', 'public.support_reports', 'select') then
    raise exception 'BOB-15: a client writes support_reports directly, or a stranger reads it';
  end if;
  if not (select a.ok from public.assert_staff_rpc_authorization_declared() a) then
    raise exception 'BOB-15: %', (select a.detail from public.assert_staff_rpc_authorization_declared() a);
  end if;
end $$;

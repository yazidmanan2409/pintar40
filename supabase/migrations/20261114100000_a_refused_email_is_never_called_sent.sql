-- J1.9 (D-085 M8), D-098(c): A REFUSED EMAIL IS NEVER CALLED SENT.
--
-- The sending module (BOB-25) has always told the truth: a send the limits or the host refuse is logged and reported
-- as not sent. The screens did not. /aktifkan/kode answers before it sends (so the answer cannot separate an address
-- that has an account from one that has not, C1, D2) and the answer said the code «sudah dikirim» while the limits or
-- the host could still refuse it, silently.
--
-- What PINTAR knows before it answers, and that is the same for every address, it now says:
--
--   (1) email_sending_wait(): seconds until PINTAR can send at all. Two facts, both global, never about an address:
--       the GLOBAL send limit is full, or the newest finished send was refused by the host or failed within the
--       last ten minutes. A screen that hears a wait says no code was sent and when to try again, to everybody.
--   (2) code_request_pace(key): a code request is counted for EVERY well-formed address, existing or not, keyed by
--       the server's keyed hash of it: one a minute (email_resend_seconds) and five an hour. Stricter than the send
--       limits a real address meets (one of a kind a minute, six an hour with the card), so the send log never
--       refuses a request this let through, and a refusal here depends only on the requests themselves.
--   (3) email_send_history(...): the platform admin's answer to "what happened to this email?" (J1.9): the sends to
--       one address (looked up by its SHA-256, computed by the server from what the admin typed) or one reference,
--       newest first, with their outcomes. Never an address, a code or a message: the log holds none.
--
-- A send the host refuses after the answer has gone still cannot be told to that one requester without separating
-- addresses; it is logged, and from that moment (1) tells everybody that PINTAR cannot send.

-- ═══════════════════════════════════════════════════════ (1) can PINTAR send now?
create function public.email_sending_wait()
returns integer
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_nu timestamptz := now();
  v_jeda_host constant interval := interval '10 minutes';
  v_tunggu numeric := 0;
  l record; v_n integer; v_keluar timestamptz; v_akhir record;
begin
  -- the GLOBAL limits: full until enough of the window's sends have left it
  for l in select * from public.email_send_limits where scope = 'GLOBAL' loop
    select count(*) into v_n from public.email_send_log s
     where s.outcome <> 'REFUSED_LIMIT' and s.requested_at > v_nu - make_interval(secs => l.window_seconds);
    if v_n >= l.max_sends then
      select s.requested_at into v_keluar from public.email_send_log s
       where s.outcome <> 'REFUSED_LIMIT' and s.requested_at > v_nu - make_interval(secs => l.window_seconds)
       order by s.requested_at offset (v_n - l.max_sends) limit 1;
      v_tunggu := greatest(v_tunggu, extract(epoch from v_keluar + make_interval(secs => l.window_seconds) - v_nu));
    end if;
  end loop;
  -- the host: the newest finished send was refused or failed, recently
  select s.outcome, s.settled_at into v_akhir from public.email_send_log s
   where s.outcome in ('SENT', 'REFUSED_BY_HOST', 'FAILED')
   order by s.settled_at desc limit 1;
  if found and v_akhir.outcome <> 'SENT' and v_akhir.settled_at > v_nu - v_jeda_host then
    v_tunggu := greatest(v_tunggu, extract(epoch from v_akhir.settled_at + v_jeda_host - v_nu));
  end if;
  return case when v_tunggu > 0 then greatest(1, ceil(v_tunggu))::integer else 0 end;
end $$;

-- ═══════════════════════════════════════════════ (2) the pace of code requests
create table public.email_code_requests (
  kunci       text primary key check (kunci ~ '^[0-9a-f]{64}$'),
  waktu       timestamptz[] not null default '{}',
  diperbarui  timestamptz not null default now()
);
alter table public.email_code_requests enable row level security;
revoke all on table public.email_code_requests from public, anon, authenticated, service_role;
comment on table public.email_code_requests is
  'D-098(c): when each address was last asked a code for, keyed by the server''s keyed hash (never an address). '
  'Counted for every well-formed address, existing or not; read and written only by code_request_pace.';

create function public.code_request_pace(p_kunci text)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_jarak constant integer := public.email_resend_seconds();
  v_per_jam constant integer := 5;
  v_nu timestamptz; v_waktu timestamptz[]; v_n integer; v_tunggu numeric := 0;
begin
  if p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'code_request_pace takes the keyed hash, never an address';
  end if;
  insert into public.email_code_requests (kunci) values (p_kunci) on conflict do nothing;
  select r.waktu into v_waktu from public.email_code_requests r where r.kunci = p_kunci for update;
  v_nu := clock_timestamp();
  v_waktu := array(select t from unnest(v_waktu) t where t > v_nu - interval '1 hour' order by t);
  v_n := cardinality(v_waktu);
  if v_n > 0 then
    v_tunggu := greatest(v_tunggu, extract(epoch from v_waktu[v_n] + make_interval(secs => v_jarak) - v_nu));
  end if;
  if v_n >= v_per_jam then
    v_tunggu := greatest(v_tunggu, extract(epoch from v_waktu[v_n - v_per_jam + 1] + interval '1 hour' - v_nu));
  end if;
  if v_tunggu > 0 then
    update public.email_code_requests set waktu = v_waktu, diperbarui = v_nu where kunci = p_kunci;
    return greatest(1, ceil(v_tunggu))::integer;
  end if;
  update public.email_code_requests set waktu = v_waktu || v_nu, diperbarui = v_nu where kunci = p_kunci;
  delete from public.email_code_requests
   where kunci in (select r.kunci from public.email_code_requests r
                    where r.diperbarui < v_nu - interval '1 hour' for update skip locked);
  return 0;
end $$;

-- ═══════════════════════════════════════ (3) what happened to this email (J1.9)
create function public.email_send_history(p_recipient_hash text default null, p_log_id uuid default null)
returns table (id uuid, kind text, requested_at timestamptz, outcome text, limit_scope text, smtp_code integer, settled_at timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'email_send_history: the platform admin only';
  end if;
  if (p_recipient_hash is null) = (p_log_id is null) then
    raise exception using errcode = '22023', message = 'email_send_history: one address hash or one reference';
  end if;
  if p_recipient_hash is not null and p_recipient_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'email_send_history takes the recipient''s SHA-256, never an address';
  end if;
  return query
    select s.id, s.kind, s.requested_at, s.outcome, s.limit_scope, s.smtp_code, s.settled_at
      from public.email_send_log s
     where (p_log_id is not null and s.id = p_log_id)
        or (p_recipient_hash is not null and s.recipient_hash = p_recipient_hash)
     order by s.requested_at desc
     limit 50;
end $$;

revoke all on function public.email_sending_wait() from public, anon, authenticated;
grant execute on function public.email_sending_wait() to service_role;
revoke all on function public.code_request_pace(text) from public, anon, authenticated;
grant execute on function public.code_request_pace(text) to service_role;
revoke all on function public.email_send_history(text, uuid) from public, anon;
grant execute on function public.email_send_history(text, uuid) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('email_send_history', 'STAFF', 'J1.9 (D-098(c)): what happened to an email, for the platform admin on «Kirim email uji»: the sends to one address (its SHA-256, computed by the server) or one reference, newest first, with their outcomes. No address, code or message is held or returned.', 'SYSTEM_ADMIN', null);

update public.public_surface_registry
   set note = 'The handler /aktifkan/kode is rewritten to (next.config.ts): email_sending_wait and code_request_pace '
           || '(answered alike for every address, D-098(c)), activation_code_target, email_resend_seconds, '
           || 'email_send_would_allow and BOB-25''s send, service-role. Signed out, the proxy refuses this spelling itself.'
 where surface = 'activation_code_api';

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare r text; v integer; k text := repeat('a', 64);
begin
  foreach r in array array['anon', 'authenticated'] loop
    if has_function_privilege(r, 'public.email_sending_wait()', 'execute')
       or has_function_privilege(r, 'public.code_request_pace(text)', 'execute') then
      raise exception 'D-098(c): % can reach a signed-out email decision', r;
    end if;
    if has_table_privilege(r, 'public.email_code_requests', 'select') then
      raise exception 'D-098(c): % can read the code request pace', r;
    end if;
  end loop;
  if has_function_privilege('anon', 'public.email_send_history(text,uuid)', 'execute') then
    raise exception 'D-098(c): the anonymous visitor can read the send history';
  end if;
  begin
    if public.code_request_pace(k) <> 0 then raise exception 'D-098(c): a first request is refused'; end if;
    v := public.code_request_pace(k);
    if v < 1 or v > public.email_resend_seconds() then
      raise exception 'D-098(c): a second request within the minute waits % s', v;
    end if;
    raise exception 'D098C_ROLLBACK_PROBE';
  exception when others then
    if sqlerrm <> 'D098C_ROLLBACK_PROBE' then raise; end if;
  end;
end $$;

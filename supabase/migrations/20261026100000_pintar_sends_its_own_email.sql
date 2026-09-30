-- BOB-25 (Gate 2E, D-057(a), C-09): PINTAR SENDS ITS OWN EMAIL. The send log
-- and the send limits behind src/app/api/_email/.
--
-- WHAT THIS HOLDS. One row per send the module attempts or refuses: the kind
-- of email, the recipient's SHA-256 (of the trimmed, lower-cased address,
-- computed by the server before anything reaches the database), the outcome,
-- the host's SMTP reply code when it answered, and the times. NEVER an address,
-- a code, a PIN, a password, a subject or a body: the table has no column that
-- could carry one.
--
-- THE LIMITS are rows, so a change is a reviewed migration. Three scopes:
--   ADDRESS_KIND  the same kind to the same address (the resend countdown);
--   ADDRESS       everything to the same address;
--   GLOBAL        everything PINTAR sends.
-- A send is allowed only when every row's window holds fewer attempts than its
-- maximum. An attempt is any row not itself refused by a limit: a send the host
-- refused or that failed still used the host, so it counts, and asking again
-- works once the window has passed.
--
-- RACES. email_send_reserve takes one transaction-scoped advisory lock, so two
-- concurrent requests cannot both read "under the limit" and both send. Email
-- is rare next to sign-in traffic, so one lock for every send is not a D-031
-- hot path.
--
-- ACCESS. Both tables: RLS on, no policy, no client grant. Both functions:
-- SECURITY DEFINER, executable by service_role only (the module lives under
-- src/app/api/, the one place F01-S03 allows that client).
--
-- D-060: nothing grades, assembles or computes a metric.

create table public.email_send_limits (
  scope           text not null check (scope in ('ADDRESS_KIND', 'ADDRESS', 'GLOBAL')),
  window_seconds  integer not null check (window_seconds > 0),
  max_sends       integer not null check (max_sends > 0),
  why             text not null check (btrim(why) <> ''),
  primary key (scope, window_seconds)
);
alter table public.email_send_limits enable row level security;
revoke all on table public.email_send_limits from public, anon, authenticated;

insert into public.email_send_limits (scope, window_seconds, max_sends, why) values
  ('ADDRESS_KIND', 60,   1,   'one email of a kind to one address a minute: the resend countdown (D-057(d))'),
  ('ADDRESS',      3600, 6,   'at most six emails an hour to one address, whatever the kind'),
  ('GLOBAL',       3600, 200, 'everything PINTAR sends in an hour; not designed around the host''s own limit (D-053(b))');

create table public.email_send_log (
  id              uuid primary key default gen_random_uuid(),
  requested_at    timestamptz not null default now(),
  kind            text not null check (kind in ('KODE_AKTIVASI', 'KODE_ULANG', 'PEMULIHAN_PASSWORD', 'PASSWORD_DIUBAH',
                                                'KARTU_DIGITAL', 'PEMBERITAHUAN_KEAMANAN', 'UJI_PENGIRIMAN')),
  recipient_hash  text not null check (recipient_hash ~ '^[0-9a-f]{64}$'),
  outcome         text not null default 'PENDING'
                  check (outcome in ('PENDING', 'SENT', 'REFUSED_LIMIT', 'REFUSED_BY_HOST', 'FAILED')),
  limit_scope     text check (limit_scope in ('ADDRESS_KIND', 'ADDRESS', 'GLOBAL')),
  smtp_code       integer check (smtp_code between 200 and 599),
  settled_at      timestamptz,
  check ((outcome = 'REFUSED_LIMIT') = (limit_scope is not null)),
  check ((outcome = 'PENDING') = (settled_at is null))
);
create index email_send_log_recipient_idx on public.email_send_log (recipient_hash, requested_at);
create index email_send_log_requested_idx on public.email_send_log (requested_at);
alter table public.email_send_log enable row level security;
revoke all on table public.email_send_log from public, anon, authenticated;

-- ─────────────────────────────────────────────── reserve: may this send go?
create or replace function public.email_send_reserve(p_kind text, p_recipient_hash text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare l record; n integer; v_id uuid;
begin
  if p_recipient_hash is null or p_recipient_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'email_send_reserve takes the recipient''s SHA-256, never an address';
  end if;
  perform pg_advisory_xact_lock(hashtext('pintar.email_send'));
  for l in select * from public.email_send_limits order by
             case scope when 'ADDRESS_KIND' then 1 when 'ADDRESS' then 2 else 3 end, window_seconds loop
    select count(*) into n from public.email_send_log s
     where s.outcome <> 'REFUSED_LIMIT'
       and s.requested_at > now() - make_interval(secs => l.window_seconds)
       and (l.scope = 'GLOBAL'
            or (s.recipient_hash = p_recipient_hash and (l.scope = 'ADDRESS' or s.kind = p_kind)));
    if n >= l.max_sends then
      insert into public.email_send_log (kind, recipient_hash, outcome, limit_scope, settled_at)
      values (p_kind, p_recipient_hash, 'REFUSED_LIMIT', l.scope, now()) returning id into v_id;
      return jsonb_build_object('log_id', v_id, 'allowed', false, 'limit_scope', l.scope);
    end if;
  end loop;
  insert into public.email_send_log (kind, recipient_hash) values (p_kind, p_recipient_hash) returning id into v_id;
  return jsonb_build_object('log_id', v_id, 'allowed', true, 'limit_scope', null);
end $$;
revoke all on function public.email_send_reserve(text, text) from public, anon, authenticated;
grant execute on function public.email_send_reserve(text, text) to service_role;

-- ─────────────────────────────────────────────── settle: what became of it
create or replace function public.email_send_settle(p_log_id uuid, p_outcome text, p_smtp_code integer)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if p_outcome not in ('SENT', 'REFUSED_BY_HOST', 'FAILED') then
    raise exception 'a send settles as SENT, REFUSED_BY_HOST or FAILED, not %', p_outcome;
  end if;
  update public.email_send_log
     set outcome = p_outcome, smtp_code = p_smtp_code, settled_at = now()
   where id = p_log_id and outcome = 'PENDING';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'send % is not pending', p_log_id; end if;
end $$;
revoke all on function public.email_send_settle(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.email_send_settle(uuid, text, integer) to service_role;

-- ─────────────────────────────────────────────── terminal verification
do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relname in ('email_send_log', 'email_send_limits') loop
    if not (select relrowsecurity from pg_class where relname = r.relname and relnamespace = 'public'::regnamespace) then
      raise exception 'BOB-25: % has no row-level security', r.relname;
    end if;
    if has_table_privilege('anon', 'public.' || r.relname, 'select')
       or has_table_privilege('authenticated', 'public.' || r.relname, 'select') then
      raise exception 'BOB-25: a client role can read %', r.relname;
    end if;
  end loop;
  -- exactly these eight columns: none of them can carry an address, a code, a
  -- PIN, a password or the message (smtp_code is the host's reply number)
  if (select string_agg(column_name, ',' order by column_name) from information_schema.columns
       where table_schema = 'public' and table_name = 'email_send_log')
     is distinct from 'id,kind,limit_scope,outcome,recipient_hash,requested_at,settled_at,smtp_code' then
    raise exception 'BOB-25: the send log has a column beyond the eight declared ones';
  end if;
  if has_function_privilege('authenticated', 'public.email_send_reserve(text,text)', 'execute')
     or has_function_privilege('anon', 'public.email_send_reserve(text,text)', 'execute')
     or has_function_privilege('authenticated', 'public.email_send_settle(uuid,text,integer)', 'execute') then
    raise exception 'BOB-25: a client role can reserve or settle a send';
  end if;
  if (select count(*) from public.email_send_limits) <> 3 then
    raise exception 'BOB-25: the send limits are not the three declared rows';
  end if;
end $$;

-- BOB-12 (b): A CARD WAITS AFTER FAILURES (identity Gate 1, D-058).
--
-- Class cards are printed, so a card number is not a secret, and a PIN is
-- short. Once Auth's own limits are counted per school address instead of per
-- server (forwarding, BOB-12 (a)) and raised for a morning of 1,000 sign-ins,
-- nothing in Auth stops a classmate guessing one card's PIN. This does.
--
-- THE RULE. Up to 5 attempts within 15 minutes are free. After that each
-- attempt waits 30 s after the one before, then 60, 120, 240, and never more
-- than 300 s. An attempt older than 15 minutes is forgotten. It is never a
-- permanent lock: a classmate can trigger it, and the owner of the card only
-- ever waits minutes. A successful sign-in clears the card's record.
--
-- THE KEY is an HMAC-SHA256 of the card number with the server's card pepper,
-- computed by the sign-in route. The database never sees a card number, and
-- nobody without the pepper can compute or clear another card's key. Every
-- submitted number is counted, existing or not, so a wait never reveals which
-- cards exist.
--
-- ATOMIC. The attempt is recorded, under the card row's lock, BEFORE Auth is
-- asked, so parallel guesses queue on one row and cannot slip past the
-- threshold. Auth then judges the PIN, and the route settles the attempt:
--   MASUK         signed in: the card's record is cleared;
--   TIDAK_DINILAI Auth never judged the PIN (its own rate limit, or it was
--                 unreachable): the attempt is taken back, so a school's busy
--                 morning never counts against a student's card.
-- A wrong PIN is left recorded.
--
-- NOT A CLIENT ENTRY POINT. The table has RLS on, no policies and no grants.
-- The route itself is declared in public_surface_registry, below.
-- The two functions are executable by service_role only, and the route calls
-- them from under src/app/api/ (F01-S03), exactly as assume_persona: the
-- anonymous principal still executes nothing (FABLE-01, FABLE-04). Neither is
-- in client_rpc_registry, which lists what a signed-in client may call.

create table public.card_signin_cooldowns (
  kunci      text primary key check (kunci ~ '^[0-9a-f]{64}$'),
  percobaan  timestamptz[] not null default '{}',
  diperbarui timestamptz not null default now()
);
comment on table public.card_signin_cooldowns is
  'BOB-12 (b): recent sign-in attempts per class card, keyed by an HMAC of the card number (never the number). Reached only through card_signin_attempt and card_signin_settle, by service_role.';
create index card_signin_cooldowns_diperbarui on public.card_signin_cooldowns (diperbarui);

alter table public.card_signin_cooldowns enable row level security;
revoke all on table public.card_signin_cooldowns from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The attempt: the wait in seconds, or 0 when the attempt may go ahead (it is
-- then recorded).
-- ---------------------------------------------------------------------------
create or replace function public.card_signin_attempt(p_kunci text)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_jendela constant interval := interval '15 minutes';
  v_bebas   constant int := 5;
  v_batas   constant int := 300;
  v_nu      timestamptz;
  v_waktu   timestamptz[];
  v_n       int;
  v_sampai  timestamptz;
begin
  if p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'card_signin_attempt: not a card key';
  end if;
  -- one row per card, locked until this call ends: parallel attempts queue here
  insert into public.card_signin_cooldowns (kunci) values (p_kunci) on conflict (kunci) do nothing;
  select c.percobaan into v_waktu from public.card_signin_cooldowns c where c.kunci = p_kunci for update;
  -- the clock after the lock, so a queued attempt is judged at the time it is decided
  v_nu := clock_timestamp();
  v_waktu := array(select t from unnest(v_waktu) t where t > v_nu - v_jendela order by t);
  v_n := cardinality(v_waktu);
  if v_n >= v_bebas then
    v_sampai := v_waktu[v_n] + make_interval(secs => least(v_batas, 30 * (2 ^ least(v_n - v_bebas, 8)))::int);
    if v_sampai > v_nu then
      update public.card_signin_cooldowns set percobaan = v_waktu, diperbarui = v_nu where kunci = p_kunci;
      return greatest(1, ceil(extract(epoch from v_sampai - v_nu)))::int;
    end if;
  end if;
  update public.card_signin_cooldowns set percobaan = v_waktu || v_nu, diperbarui = v_nu where kunci = p_kunci;
  -- a card nobody has tried for the whole window has nothing left to remember;
  -- a row another attempt holds is left for later, so two attempts never wait on each other
  delete from public.card_signin_cooldowns
   where kunci in (select c.kunci from public.card_signin_cooldowns c
                    where c.diperbarui < v_nu - v_jendela for update skip locked);
  return 0;
end $$;

-- ---------------------------------------------------------------------------
-- The settlement, after Auth answered.
-- ---------------------------------------------------------------------------
create or replace function public.card_signin_settle(p_kunci text, p_hasil text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'card_signin_settle: not a card key';
  end if;
  if p_hasil = 'MASUK' then
    delete from public.card_signin_cooldowns where kunci = p_kunci;
  elsif p_hasil = 'TIDAK_DINILAI' then
    -- the newest attempt: Auth judged nothing, so it counts for nothing
    update public.card_signin_cooldowns
       set percobaan = percobaan[1:greatest(cardinality(percobaan) - 1, 0)]
     where kunci = p_kunci;
  else
    raise exception using errcode = '22023', message = 'card_signin_settle: MASUK or TIDAK_DINILAI';
  end if;
end $$;

revoke all on function public.card_signin_attempt(text) from public, anon, authenticated;
revoke all on function public.card_signin_settle(text, text) from public, anon, authenticated;
grant execute on function public.card_signin_attempt(text) to service_role;
grant execute on function public.card_signin_settle(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- The sign-in route is an anonymous surface, declared as one (design approval
-- (A)): the public path, and the handler it is rewritten to, as its child --
-- the same shape as the certificate verification route and its endpoint.
-- ---------------------------------------------------------------------------
insert into public.public_surface_registry (surface, kind, object, note, parent) values
  ('card_signin', 'ROUTE', '/masuk/kartu',
   'BOB-12: the class card''s sign-in. POST only, same origin only (Origin or Sec-Fetch-Site); GET answers 303 /masuk. '
   || 'Answers in codes (CARD_NOT_MATCHED, CARD_COOLDOWN, CARD_RATE_LIMITED, CARD_REQUEST_REFUSED, CARD_UNAVAILABLE), '
   || 'never whether a card exists. Listed in the proxy''s PUBLIC_PATHS.', null),
  ('card_signin_api', 'ENDPOINT', '/api/masuk/kartu',
   'The handler /masuk/kartu is rewritten to (next.config.ts). It holds the service-role client (F01-S03 permits it under '
   || 'src/app/api/) for card_signin_attempt and card_signin_settle only; anon executes neither. Signed out, the proxy '
   || 'refuses this spelling itself: the one public door is /masuk/kartu.', 'card_signin');

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare r text;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.card_signin_cooldowns'::regclass) then
    raise exception 'BOB-12: card_signin_cooldowns has no RLS';
  end if;
  if exists (select 1 from pg_policy where polrelid = 'public.card_signin_cooldowns'::regclass) then
    raise exception 'BOB-12: card_signin_cooldowns has a policy';
  end if;
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if has_table_privilege(r, 'public.card_signin_cooldowns', 'select')
       or has_table_privilege(r, 'public.card_signin_cooldowns', 'insert')
       or has_table_privilege(r, 'public.card_signin_cooldowns', 'update')
       or has_table_privilege(r, 'public.card_signin_cooldowns', 'delete') then
      raise exception 'BOB-12: % holds a grant on card_signin_cooldowns', r;
    end if;
  end loop;
  foreach r in array array['anon', 'authenticated'] loop
    if has_function_privilege(r, 'public.card_signin_attempt(text)', 'execute')
       or has_function_privilege(r, 'public.card_signin_settle(text, text)', 'execute') then
      raise exception 'BOB-12: % can call the card cooldown', r;
    end if;
  end loop;
  if not has_function_privilege('service_role', 'public.card_signin_attempt(text)', 'execute')
     or not has_function_privilege('service_role', 'public.card_signin_settle(text, text)', 'execute') then
    raise exception 'BOB-12: the sign-in route cannot call the card cooldown';
  end if;
  if not exists (select 1 from public.public_surface_registry where surface = 'card_signin' and kind = 'ROUTE' and object = '/masuk/kartu')
     or not exists (select 1 from public.public_surface_registry where surface = 'card_signin_api' and kind = 'ENDPOINT'
                     and object = '/api/masuk/kartu' and parent = 'card_signin') then
    raise exception 'BOB-12: the card sign-in route and its rewrite target are not declared public surfaces';
  end if;
end $$;

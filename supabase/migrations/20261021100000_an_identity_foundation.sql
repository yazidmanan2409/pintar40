-- BOB-24: THE IDENTITY FOUNDATION (identity Gate 2, D-054, D-056, D-059). No UI.
--
-- What Gate 3 (activation and password sign-in), Gate 5 (PINTAR ID + PIN
-- recovery) and Gate 6 (the shared-device lock) stand on, and nothing they
-- themselves decide:
--
--   (1) persons.pintar_id    8 characters of Crockford Base32 from secure
--                            randomness, unique, immutable, backfilled for
--                            every person; never derived from level,
--                            institution or role (D-059), not a secret
--   (2) person_usernames     one per staff person, canonical lowercase, C9's
--                            rules and reserved names, NO RENAME; a correction
--                            is an audited platform-admin operation
--   (3) person_pins          the personal 4-digit PIN, bcrypt (pgcrypto), the
--                            blocklist, never returned; a PIN retired by a
--                            forced reset is never usable again
--   (4) account_setup        REQUIRED / COMPLETE per EMAIL account; class cards
--                            and evaluation personas have none (C13)
--   (5) identity_attempts    code-attempt counters per address hash (the card
--                            cooldown's shape, BOB-12)
--   (6) recovery_ladder      PINTAR ID + PIN recovery, keyed by the TYPED
--                            canonical ID whether or not it exists: 3 wrong ->
--                            1 h, 3 -> 4 h, 3 -> SUSPENDED; levels 1-2 decay
--                            after 30 clean days; suspension never by time;
--                            restore by email recovery or an audited admin
--                            reset, both forcing a new PIN
--   (7) security events      every step audited ('identity.*'); read by the
--                            platform admin only
--
-- STORAGE. Every table: RLS on, no policies, no grants. Only the functions
-- below reach them. Three kinds of function:
--   * the person's own (claim_username, set_my_pin, my_setup_state,
--     complete_my_setup): authenticated, for the caller only, registered in
--     the caller's-own class (LEARNER, as complete_tour and submit_feedback
--     are, whoever calls them); each reaches current_person_id();
--   * the platform admin's (correct_username, admin_reset_recovery,
--     security_events): authenticated, refusing all but SYSTEM_ADMIN, registered;
--   * the sign-in and recovery routes' (identity_attempt, identity_attempt_settle,
--     recovery_attempt, recovery_restore): service_role only, as the card
--     cooldown's, because those flows start signed out and anon executes
--     nothing (FABLE-01);
--   and internal helpers with no grant at all.
--
-- REFUSALS carry SQLSTATE PR040 and a stable code in DETAIL (D-011).

-- ═══════════════════════════════════════════════════════════ (1) PINTAR ID
create or replace function public.pintar_id_new()
returns text
language plpgsql volatile set search_path = public, extensions, pg_temp as $$
declare
  a constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';  -- Crockford: no I, L, O, U
  b bytea := extensions.gen_random_bytes(5);                -- 40 random bits, 8 x 5
  v bigint := 0; s text := ''; i int;
begin
  for i in 0..4 loop v := (v << 8) | get_byte(b, i); end loop;
  for i in 1..8 loop s := substr(a, (v & 31)::int + 1, 1) || s; v := v >> 5; end loop;
  return s;
end $$;
comment on function public.pintar_id_new() is
  'BOB-24: a fresh PINTAR ID, 8 Crockford Base32 characters from 40 random bits. Nothing about the person enters it (D-059).';

-- What a person typed, as the ID it means: case-insensitive, spaces and
-- hyphens ignored, O -> 0 and I/L -> 1; null when it is not 8 valid characters.
create or replace function public.pintar_id_canonical(p text)
returns text
language sql immutable set search_path = public, pg_temp as $$
  select case when c ~ '^[0-9A-HJKMNP-TV-Z]{8}$' then c end
    from (select translate(upper(regexp_replace(coalesce(p, ''), '[[:space:]-]', '', 'g')), 'OIL', '011') as c) q
$$;

alter table public.persons add column pintar_id text;

create or replace function public.persons_pintar_id_guard()
returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare v text; n int := 0;
begin
  if tg_op = 'UPDATE' and old.pintar_id is not null and new.pintar_id is distinct from old.pintar_id then
    raise exception using errcode = 'PR040', detail = 'PINTAR_ID_IMMUTABLE',
      message = 'a PINTAR ID never changes and is never reused';
  end if;
  if new.pintar_id is null then
    loop
      v := public.pintar_id_new();
      exit when not exists (select 1 from public.persons p where p.pintar_id = v);
      n := n + 1;
      if n > 20 then raise exception 'no free PINTAR ID after 20 draws'; end if;
    end loop;
    new.pintar_id := v;
  end if;
  return new;
end $$;
create trigger persons_pintar_id before insert or update of pintar_id on public.persons
  for each row execute function public.persons_pintar_id_guard();

-- the backfill: every person, one at a time so each draw sees the ones before
do $$
declare r record;
begin
  for r in select id from public.persons where pintar_id is null order by created_at, id loop
    update public.persons set pintar_id = null where id = r.id;  -- the trigger draws it
  end loop;
end $$;
alter table public.persons alter column pintar_id set not null;
alter table public.persons add constraint persons_pintar_id_shape check (pintar_id ~ '^[0-9A-HJKMNP-TV-Z]{8}$');
create unique index persons_pintar_id_unique on public.persons (pintar_id);

-- ═══════════════════════════════════════════════════════════ (2) USERNAMES
create table public.person_usernames (
  person_id    uuid primary key references public.persons (id),
  username     text not null check (username ~ '^[a-z][a-z0-9._]{3,19}$'),
  claimed_at   timestamptz not null default now(),
  corrected_at timestamptz
);
create unique index person_usernames_unique on public.person_usernames (username);
alter table public.person_usernames enable row level security;
revoke all on table public.person_usernames from public, anon, authenticated, service_role;

-- Why a username is refused (C9), or null. Input is taken as lowercase.
create or replace function public.username_rejection(p text)
returns text
language plpgsql immutable set search_path = public, pg_temp as $$
declare u text := lower(btrim(coalesce(p, '')));
begin
  if position('@' in u) > 0 then return 'USERNAME_EMAIL_SHAPE'; end if;
  if length(u) < 4 or length(u) > 20 then return 'USERNAME_LENGTH'; end if;
  if u !~ '^[a-z0-9._]+$' then return 'USERNAME_CHARACTERS'; end if;
  if u ~ '^[0-9]+$' then return 'USERNAME_NUMBER'; end if;
  if u !~ '^[a-z]' then return 'USERNAME_START'; end if;
  if public.pintar_id_canonical(u) is not null then return 'USERNAME_ID_SHAPE'; end if;
  if u = any (array[
       'admin', 'administrator', 'root', 'system', 'sysadmin', 'superuser', 'support', 'help', 'bantuan', 'info',
       'security', 'keamanan', 'noreply', 'no_reply', 'no.reply', 'postmaster', 'webmaster', 'abuse', 'mail', 'email',
       'official', 'resmi', 'staff', 'staf', 'team', 'tim', 'moderator', 'owner', 'founder', 'pendiri', 'guru',
       'teacher', 'dosen', 'murid', 'siswa', 'student', 'sekolah', 'school', 'kepala', 'kepsek', 'dekan', 'rektor',
       'masuk', 'keluar', 'login', 'logout', 'daftar', 'register', 'akun', 'account', 'kartu', 'card', 'test', 'tester',
       'null', 'undefined', 'anonymous', 'anon', 'service', 'service_role', 'authenticated', 'api', 'www', 'id']::text[])
     or u ~ '^(pintar|admin|root|system|support|security|official|resmi)' then
    return 'USERNAME_RESERVED';
  end if;
  return null;
end $$;

-- A rename is refused; the one exception is correct_username, which opens this
-- pass for its own statement and audits it.
create or replace function public.person_usernames_guard()
returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' or (new.username is distinct from old.username and coalesce(current_setting('pintar.identity_correction', true), '') <> 'on')
     or new.person_id is distinct from old.person_id then
    raise exception using errcode = 'PR040', detail = 'USERNAME_FIXED',
      message = 'a username is fixed once chosen; a correction is a platform-admin operation';
  end if;
  return new;
end $$;
create trigger person_usernames_guard before update or delete on public.person_usernames
  for each row execute function public.person_usernames_guard();

-- ═══════════════════════════════════════════════════════════ (3) PERSONAL PIN
create table public.person_pins (
  person_id      uuid primary key references public.persons (id),
  pin_hash       text not null check (pin_hash ~ '^\$2[abxy]\$'),
  set_at         timestamptz not null default now(),
  reset_required boolean not null default false
);
create table public.person_pins_retired (
  person_id  uuid not null references public.persons (id),
  pin_hash   text not null check (pin_hash ~ '^\$2[abxy]\$'),
  retired_at timestamptz not null default now()
);
create index person_pins_retired_person on public.person_pins_retired (person_id);
alter table public.person_pins enable row level security;
alter table public.person_pins_retired enable row level security;
revoke all on table public.person_pins, public.person_pins_retired from public, anon, authenticated, service_role;

-- Why a PIN is refused (IDENTITY-4.0 §3), or null.
create or replace function public.pin_weakness(p text)
returns text
language plpgsql immutable set search_path = public, pg_temp as $$
declare d int[]; naik boolean := true; turun boolean := true; i int;
begin
  if p is null or p !~ '^[0-9]{4}$' then return 'PIN_FORMAT'; end if;
  if p ~ '^([0-9])\1{3}$' then return 'PIN_REPEATED'; end if;
  d := array[substr(p, 1, 1)::int, substr(p, 2, 1)::int, substr(p, 3, 1)::int, substr(p, 4, 1)::int];
  for i in 2..4 loop
    naik := naik and d[i] = (d[i - 1] + 1) % 10;
    turun := turun and d[i] = (d[i - 1] + 9) % 10;
  end loop;
  if naik or turun then return 'PIN_SEQUENCE'; end if;
  if (d[1] = d[3] and d[2] = d[4]) or (d[1] = d[2] and d[3] = d[4]) then return 'PIN_PATTERN'; end if;
  if p = any (array['2580', '0852', '1470', '0741', '7410', '0147', '3690', '0963', '9630', '0369', '1590', '0951',
                    '3570', '0753', '1478', '8741', '3698', '8963', '1236', '6321', '7896', '6987', '1379', '9731',
                    '2468', '8642', '1357', '7531', '1397', '7913']::text[]) then
    return 'PIN_KEYPAD';
  end if;
  if p::int between 1950 and 2030 then return 'PIN_YEAR'; end if;
  if p = any (array['0000', '1111', '1234', '4321', '1212', '7777', '1004', '2000', '4444', '2222', '6969', '9999',
                    '3333', '5555', '6666', '1122', '1313', '8888', '2001', '1010', '0123', '1231', '1230', '1221',
                    '2121', '0101', '0707', '0911', '1225', '5683', '0007', '0070', '2323', '4545', '5150', '0001',
                    '0002', '1000', '1001', '2002', '9000', '0110', '7007', '0420', '2112', '1024', '3141', '1123',
                    '8520', '2345', '5678', '6789', '9876', '0987', '1414', '1515', '0808', '0606', '1100', '1199']::text[]) then
    return 'PIN_COMMON';
  end if;
  return null;
end $$;

-- Whether a PIN is this person's current one. Internal: never granted, never
-- returns the hash; a PIN awaiting its forced reset matches nothing.
create or replace function public.pin_matches(p_person uuid, p_pin text)
returns boolean
language plpgsql stable set search_path = public, extensions, pg_temp as $$
declare h text; r boolean;
begin
  select pp.pin_hash into h from public.person_pins pp where pp.person_id = p_person and not pp.reset_required;
  -- the same work either way, so a missing PIN is not faster than a wrong one
  r := extensions.crypt(coalesce(p_pin, ''), coalesce(h, '$2a$10$abcdefghijklmnopqrstuuD4Q9dCmIBr2yDxyVBQeHkF.W5n7xZ8q'))
       = coalesce(h, '');
  return h is not null and r;
end $$;

-- ═══════════════════════════════════════════════════════════ (4) SET-UP STATE
create table public.account_setup (
  account_id   uuid primary key references public.accounts (id),
  state        text not null check (state in ('REQUIRED', 'COMPLETE')),
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  check ((state = 'COMPLETE') = (completed_at is not null))
);
alter table public.account_setup enable row level security;
revoke all on table public.account_setup from public, anon, authenticated, service_role;

create or replace function public.adalah_persona(p_person uuid)
returns boolean
language sql stable set search_path = public, pg_temp as $$
  select exists (select 1 from public.evaluation_personas e where e.person_id = p_person)
$$;

-- A new EMAIL account starts REQUIRED; a class card and a persona get none.
create or replace function public.accounts_setup_row()
returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.kind = 'EMAIL' and not public.adalah_persona(new.person_id) then
    insert into public.account_setup (account_id, state) values (new.id, 'REQUIRED') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger accounts_setup_row after insert on public.accounts
  for each row execute function public.accounts_setup_row();

-- A person who becomes a persona leaves the set-up flow (C13).
create or replace function public.personas_leave_setup()
returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  delete from public.account_setup s using public.accounts a where a.id = s.account_id and a.person_id = new.person_id;
  return new;
end $$;
create trigger personas_leave_setup after insert on public.evaluation_personas
  for each row execute function public.personas_leave_setup();

-- the backfill: every existing EMAIL account (existing staff, C10) but personas
insert into public.account_setup (account_id, state)
select a.id, 'REQUIRED' from public.accounts a
 where a.kind = 'EMAIL' and not public.adalah_persona(a.person_id)
on conflict do nothing;

-- ═══════════════════════════════════════════════ (5) CODE-ATTEMPT COUNTERS
create table public.identity_attempts (
  scope      text not null check (scope in ('CODE_VERIFY')),
  kunci      text not null check (kunci ~ '^[0-9a-f]{64}$'),
  percobaan  timestamptz[] not null default '{}',
  diperbarui timestamptz not null default now(),
  primary key (scope, kunci)
);
create index identity_attempts_diperbarui on public.identity_attempts (diperbarui);
alter table public.identity_attempts enable row level security;
revoke all on table public.identity_attempts from public, anon, authenticated, service_role;

-- One attempt at a code for an address (HMAC-hashed by the route, never the
-- address): 0 to go ahead (recorded), else the seconds to wait. 5 free within
-- 15 minutes, then 30 s after the last, doubling, at most 300 s; the card
-- cooldown's rule and its row lock.
create or replace function public.identity_attempt(p_scope text, p_kunci text)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_jendela constant interval := interval '15 minutes';
  v_nu timestamptz; v_waktu timestamptz[]; v_n int; v_sampai timestamptz;
begin
  if p_scope is distinct from 'CODE_VERIFY' or p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'identity_attempt: not a known scope and key';
  end if;
  insert into public.identity_attempts (scope, kunci) values (p_scope, p_kunci) on conflict do nothing;
  select a.percobaan into v_waktu from public.identity_attempts a where a.scope = p_scope and a.kunci = p_kunci for update;
  v_nu := clock_timestamp();
  v_waktu := array(select t from unnest(v_waktu) t where t > v_nu - v_jendela order by t);
  v_n := cardinality(v_waktu);
  if v_n >= 5 then
    v_sampai := v_waktu[v_n] + make_interval(secs => least(300, 30 * (2 ^ least(v_n - 5, 8)))::int);
    if v_sampai > v_nu then
      update public.identity_attempts set percobaan = v_waktu, diperbarui = v_nu where scope = p_scope and kunci = p_kunci;
      return greatest(1, ceil(extract(epoch from v_sampai - v_nu)))::int;
    end if;
  end if;
  update public.identity_attempts set percobaan = v_waktu || v_nu, diperbarui = v_nu where scope = p_scope and kunci = p_kunci;
  delete from public.identity_attempts
   where (scope, kunci) in (select a.scope, a.kunci from public.identity_attempts a
                             where a.diperbarui < v_nu - v_jendela for update skip locked);
  return 0;
end $$;

-- After the check: OK clears the address's record; NOT_JUDGED (the code was
-- never judged: the provider's limit, or unreachable) takes the attempt back.
create or replace function public.identity_attempt_settle(p_scope text, p_kunci text, p_hasil text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_scope is distinct from 'CODE_VERIFY' or p_kunci is null or p_kunci !~ '^[0-9a-f]{64}$'
     or p_hasil is null or p_hasil not in ('OK', 'NOT_JUDGED') then
    raise exception using errcode = '22023', message = 'identity_attempt_settle: a known scope, key and OK or NOT_JUDGED';
  end if;
  if p_hasil = 'OK' then
    delete from public.identity_attempts where scope = p_scope and kunci = p_kunci;
  else
    update public.identity_attempts set percobaan = percobaan[1:greatest(cardinality(percobaan) - 1, 0)]
     where scope = p_scope and kunci = p_kunci;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════ (6) RECOVERY LADDER
create table public.recovery_ladder (
  typed_id        text primary key check (typed_id ~ '^[0-9A-HJKMNP-TV-Z]{8}$'),
  level           smallint not null default 0 check (level between 0 and 3),  -- 3: SUSPENDED
  failures        smallint not null default 0 check (failures between 0 and 2),
  locked_until    timestamptz,
  last_failure_at timestamptz,
  suspended_at    timestamptz,
  updated_at      timestamptz not null default now(),
  check ((level = 3) = (suspended_at is not null))
);
alter table public.recovery_ladder enable row level security;
revoke all on table public.recovery_ladder from public, anon, authenticated, service_role;

-- One PINTAR ID + PIN recovery attempt. The ladder is the TYPED canonical ID's,
-- so an ID nobody holds walks exactly the same steps (D-056 (e)).
--   OK         the PIN is the ID's person's current one: the ladder is reset
--   WRONG      not a match (or no such ID, or no PIN yet); counted
--   LOCKED     the third wrong at a level, or tried while locked (wait_seconds)
--   SUSPENDED  the third wrong at level 2, or tried while suspended
--   MALFORMED  not an 8-character ID; nothing counted
create or replace function public.recovery_attempt(p_typed_id text, p_pin text)
returns table (outcome text, wait_seconds integer, person_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id text := public.pintar_id_canonical(p_typed_id);
  v_nu timestamptz := clock_timestamp();
  r public.recovery_ladder%rowtype;
  v_person uuid; v_ok boolean;
begin
  if v_id is null then
    outcome := 'MALFORMED'; wait_seconds := null; person_id := null; return next; return;
  end if;
  insert into public.recovery_ladder (typed_id) values (v_id) on conflict do nothing;
  select * into r from public.recovery_ladder l where l.typed_id = v_id for update;
  -- the time is read once the row is held: an attempt that queued behind
  -- another is judged at the moment it is taken, not when it arrived
  v_nu := clock_timestamp();

  -- 30 clean days: levels 1-2 (and a partial count) return to 0; never a suspension
  if r.level < 3 and r.last_failure_at is not null and r.last_failure_at < v_nu - interval '30 days'
     and (r.locked_until is null or r.locked_until <= v_nu) then
    r.level := 0; r.failures := 0; r.locked_until := null;
  end if;

  if r.level = 3 then
    outcome := 'SUSPENDED'; wait_seconds := null; person_id := null; return next; return;
  end if;
  if r.locked_until is not null and r.locked_until > v_nu then
    outcome := 'LOCKED'; wait_seconds := greatest(1, ceil(extract(epoch from r.locked_until - v_nu)))::int;
    person_id := null; return next; return;
  end if;

  select p.id into v_person from public.persons p where p.pintar_id = v_id;
  v_ok := public.pin_matches(v_person, p_pin);   -- the same hashing work for a missing person

  if v_ok then
    update public.recovery_ladder
       set level = 0, failures = 0, locked_until = null, last_failure_at = null, updated_at = v_nu
     where typed_id = v_id;
    perform public.audit_write('identity.recovery_pin_ok', 'persons', v_person::text, null, '{}'::jsonb);
    outcome := 'OK'; wait_seconds := null; person_id := v_person; return next; return;
  end if;

  r.failures := r.failures + 1;
  if r.failures < 3 then
    update public.recovery_ladder set level = r.level, failures = r.failures, locked_until = null,
           last_failure_at = v_nu, updated_at = v_nu where typed_id = v_id;
    perform public.audit_write('identity.recovery_pin_wrong', 'recovery_ladder', v_id, null,
      jsonb_build_object('level', r.level, 'failures', r.failures));
    outcome := 'WRONG'; wait_seconds := null; person_id := null; return next; return;
  end if;

  if r.level < 2 then
    update public.recovery_ladder
       set level = r.level + 1, failures = 0, last_failure_at = v_nu, updated_at = v_nu,
           locked_until = v_nu + case r.level when 0 then interval '1 hour' else interval '4 hours' end
     where typed_id = v_id;
    perform public.audit_write('identity.recovery_locked', 'recovery_ladder', v_id, null,
      jsonb_build_object('level', r.level + 1, 'hours', case r.level when 0 then 1 else 4 end));
    outcome := 'LOCKED';
    wait_seconds := case r.level when 0 then 3600 else 14400 end;
    person_id := null; return next; return;
  end if;

  -- level 2, a third wrong: suspended; the current PIN is never usable again
  update public.recovery_ladder
     set level = 3, failures = 0, locked_until = null, last_failure_at = v_nu, suspended_at = v_nu, updated_at = v_nu
   where typed_id = v_id;
  update public.person_pins pp set reset_required = true where pp.person_id = v_person;
  perform public.audit_write('identity.recovery_suspended', 'recovery_ladder', v_id, null, '{}'::jsonb);
  outcome := 'SUSPENDED'; wait_seconds := null; person_id := null; return next;
end $$;

-- Restore a person's recovery method: the ladder back to 0 and a NEW PIN
-- required (the current one is retired when the new one is set, and never
-- matches again). Shared by the two restore paths.
create or replace function public.recovery_restore_core(p_person uuid, p_via text, p_reason text)
returns void
language plpgsql set search_path = public, pg_temp as $$
declare v_id text;
begin
  select p.pintar_id into v_id from public.persons p where p.id = p_person;
  if v_id is null then
    raise exception using errcode = 'PR040', detail = 'IDENTITY_NOT_FOUND', message = 'no such person';
  end if;
  insert into public.recovery_ladder (typed_id) values (v_id) on conflict do nothing;
  update public.recovery_ladder
     set level = 0, failures = 0, locked_until = null, last_failure_at = null, suspended_at = null, updated_at = clock_timestamp()
   where typed_id = v_id;
  update public.person_pins pp set reset_required = true where pp.person_id = p_person;
  perform public.audit_write('identity.recovery_restored', 'persons', p_person::text, null,
    jsonb_build_object('via', p_via) || case when p_reason is null then '{}'::jsonb else jsonb_build_object('reason', p_reason) end);
end $$;

-- Restore path (1): the email-recovery route, after a successful email recovery.
create or replace function public.recovery_restore(p_person uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.recovery_restore_core(p_person, 'EMAIL_RECOVERY', null);
end $$;

-- ═══════════════════════════════════════════ the person's own functions
-- The caller's staff identity: a person with an EMAIL account who is not an
-- evaluation persona (C13). Anyone else is refused.
create or replace function public.identitas_staf_saya()
returns uuid
language plpgsql stable set search_path = public, pg_temp as $$
declare v_person uuid := public.current_person_id();
begin
  if v_person is null
     or not exists (select 1 from public.accounts a where a.person_id = v_person and a.kind = 'EMAIL')
     or public.adalah_persona(v_person) then
    raise exception using errcode = 'PR040', detail = 'IDENTITY_NOT_ELIGIBLE',
      message = 'only a staff person signed in with an email account has a username and a personal PIN';
  end if;
  return v_person;
end $$;

-- Claim the caller's username, once.
create or replace function public.claim_username(p_username text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.identitas_staf_saya(); v_u text := lower(btrim(coalesce(p_username, ''))); v_tolak text;
begin
  if exists (select 1 from public.person_usernames u where u.person_id = v_person) then
    raise exception using errcode = 'PR040', detail = 'USERNAME_ALREADY_SET', message = 'this person already has a username';
  end if;
  v_tolak := public.username_rejection(v_u);
  if v_tolak is not null then
    raise exception using errcode = 'PR040', detail = v_tolak, message = 'that username is not allowed: ' || v_tolak;
  end if;
  begin
    insert into public.person_usernames (person_id, username) values (v_person, v_u);
  exception when unique_violation then
    raise exception using errcode = 'PR040', detail = 'USERNAME_TAKEN', message = 'that username is taken';
  end;
  perform public.audit_write('identity.username_claimed', 'persons', v_person::text, null, jsonb_build_object('username', v_u));
  return v_u;
end $$;

-- Set the caller's PIN: the first time, or when a new one is required.
create or replace function public.set_my_pin(p_pin text)
returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_person uuid := public.identitas_staf_saya(); v_lemah text := public.pin_weakness(p_pin);
        r public.person_pins%rowtype; v_ada boolean;
begin
  if v_lemah is not null then
    raise exception using errcode = 'PR040', detail = v_lemah, message = 'that PIN is not allowed: ' || v_lemah;
  end if;
  select * into r from public.person_pins pp where pp.person_id = v_person for update;
  v_ada := found;
  if v_ada and not r.reset_required then
    raise exception using errcode = 'PR040', detail = 'PIN_ALREADY_SET', message = 'this person already has a PIN';
  end if;
  if (v_ada and extensions.crypt(p_pin, r.pin_hash) = r.pin_hash)
     or exists (select 1 from public.person_pins_retired x where x.person_id = v_person and extensions.crypt(p_pin, x.pin_hash) = x.pin_hash) then
    raise exception using errcode = 'PR040', detail = 'PIN_REUSED', message = 'a PIN that was replaced is never used again';
  end if;
  if v_ada then
    insert into public.person_pins_retired (person_id, pin_hash) values (v_person, r.pin_hash);
    update public.person_pins set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 10)),
           set_at = now(), reset_required = false where person_id = v_person;
  else
    insert into public.person_pins (person_id, pin_hash) values (v_person, extensions.crypt(p_pin, extensions.gen_salt('bf', 10)));
  end if;
  perform public.audit_write('identity.pin_set', 'persons', v_person::text, null, jsonb_build_object('replaced', v_ada));
end $$;

-- The caller's set-up state: REQUIRED, COMPLETE, or NOT_APPLICABLE (a class
-- card, a persona, or no account).
create or replace function public.my_setup_state()
returns text
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.current_person_id(); v_state text;
begin
  if v_person is null or public.adalah_persona(v_person) then return 'NOT_APPLICABLE'; end if;
  select s.state into v_state from public.account_setup s join public.accounts a on a.id = s.account_id
   where a.person_id = v_person and a.kind = 'EMAIL' order by s.created_at limit 1;
  return coalesce(v_state, 'NOT_APPLICABLE');
end $$;

-- Mark the caller's set-up complete, once a username and a PIN are in place.
-- (The password is Auth's; Gate 3's route calls this after setting it.)
create or replace function public.complete_my_setup()
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.identitas_staf_saya();
begin
  if not exists (select 1 from public.person_usernames u where u.person_id = v_person)
     or not exists (select 1 from public.person_pins pp where pp.person_id = v_person and not pp.reset_required) then
    raise exception using errcode = 'PR040', detail = 'SETUP_INCOMPLETE', message = 'a username and a PIN come first';
  end if;
  update public.account_setup s set state = 'COMPLETE', completed_at = coalesce(s.completed_at, now())
    from public.accounts a where a.id = s.account_id and a.person_id = v_person and a.kind = 'EMAIL';
  perform public.audit_write('identity.setup_completed', 'persons', v_person::text, null, '{}'::jsonb);
  return 'COMPLETE';
end $$;

-- ═══════════════════════════════════════════ the platform admin's functions
create or replace function public.correct_username(p_person uuid, p_username text, p_reason text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_u text := lower(btrim(coalesce(p_username, ''))); v_lama text; v_tolak text;
begin
  if not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'correcting a username requires the platform administrator';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a correction states its reason';
  end if;
  select u.username into v_lama from public.person_usernames u where u.person_id = p_person for update;
  if v_lama is null then
    raise exception using errcode = 'PR040', detail = 'IDENTITY_NOT_FOUND', message = 'that person has no username to correct';
  end if;
  v_tolak := public.username_rejection(v_u);
  if v_tolak is not null then
    raise exception using errcode = 'PR040', detail = v_tolak, message = 'that username is not allowed: ' || v_tolak;
  end if;
  perform set_config('pintar.identity_correction', 'on', true);
  begin
    update public.person_usernames set username = v_u, corrected_at = now() where person_id = p_person;
  exception when unique_violation then
    perform set_config('pintar.identity_correction', '', true);
    raise exception using errcode = 'PR040', detail = 'USERNAME_TAKEN', message = 'that username is taken';
  end;
  perform set_config('pintar.identity_correction', '', true);
  perform public.audit_write('identity.username_corrected', 'persons', p_person::text, null,
    jsonb_build_object('from', v_lama, 'to', v_u, 'reason', btrim(p_reason)));
  return v_u;
end $$;

-- Restore path (2): the platform admin's reset, audited, forcing a new PIN.
create or replace function public.admin_reset_recovery(p_person uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'resetting recovery requires the platform administrator';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception using errcode = 'PR040', detail = 'REASON_REQUIRED', message = 'a reset states its reason';
  end if;
  perform public.recovery_restore_core(p_person, 'ADMIN_RESET', btrim(p_reason));
end $$;

-- The security and recovery record, newest first: the platform admin's only.
create or replace function public.security_events(p_limit integer default 100)
returns table (at timestamptz, action text, target_table text, target_id text, summary jsonb)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_system_admin() then
    raise exception using errcode = '42501', message = 'the security record is the platform administrator''s';
  end if;
  return query
    select l.at, l.action, l.target_table, l.target_id, l.summary
      from public.audit_log l
     where l.action like 'identity.%'
     order by l.at desc, l.id desc
     limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;

-- ═══════════════════════════════════════════════════════════════ surfaces
revoke all on function public.pintar_id_new() from public, anon, authenticated;
revoke all on function public.pintar_id_canonical(text) from public, anon, authenticated;
revoke all on function public.persons_pintar_id_guard() from public, anon, authenticated;
revoke all on function public.username_rejection(text) from public, anon, authenticated;
revoke all on function public.person_usernames_guard() from public, anon, authenticated;
revoke all on function public.pin_weakness(text) from public, anon, authenticated;
revoke all on function public.pin_matches(uuid, text) from public, anon, authenticated;
revoke all on function public.adalah_persona(uuid) from public, anon, authenticated;
revoke all on function public.accounts_setup_row() from public, anon, authenticated;
revoke all on function public.personas_leave_setup() from public, anon, authenticated;
revoke all on function public.recovery_restore_core(uuid, text, text) from public, anon, authenticated;
revoke all on function public.identitas_staf_saya() from public, anon, authenticated;

revoke all on function public.identity_attempt(text, text) from public, anon, authenticated;
revoke all on function public.identity_attempt_settle(text, text, text) from public, anon, authenticated;
revoke all on function public.recovery_attempt(text, text) from public, anon, authenticated;
revoke all on function public.recovery_restore(uuid) from public, anon, authenticated;
grant execute on function public.identity_attempt(text, text) to service_role;
grant execute on function public.identity_attempt_settle(text, text, text) to service_role;
grant execute on function public.recovery_attempt(text, text) to service_role;
grant execute on function public.recovery_restore(uuid) to service_role;

revoke all on function public.claim_username(text) from public, anon;
revoke all on function public.set_my_pin(text) from public, anon;
revoke all on function public.my_setup_state() from public, anon;
revoke all on function public.complete_my_setup() from public, anon;
revoke all on function public.correct_username(uuid, text, text) from public, anon;
revoke all on function public.admin_reset_recovery(uuid, text) from public, anon;
revoke all on function public.security_events(integer) from public, anon;
grant execute on function public.claim_username(text) to authenticated;
grant execute on function public.set_my_pin(text) to authenticated;
grant execute on function public.my_setup_state() to authenticated;
grant execute on function public.complete_my_setup() to authenticated;
grant execute on function public.correct_username(uuid, text, text) to authenticated;
grant execute on function public.admin_reset_recovery(uuid, text) to authenticated;
grant execute on function public.security_events(integer) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('claim_username', 'LEARNER', 'BOB-24: the caller claims their own username, once (C9): canonical lowercase, validated, reserved names refused, a taken name refused USERNAME_TAKEN; only a staff person with an EMAIL account, never a persona. No rename.', null, null),
  ('set_my_pin', 'LEARNER', 'BOB-24: the caller sets their own 4-digit personal PIN, the first time or when a new one is required; the blocklist refuses common and trivial PINs; a replaced PIN is never used again; nothing returns the hash.', null, null),
  ('my_setup_state', 'LEARNER', 'BOB-24: the caller''s own set-up state: REQUIRED, COMPLETE or NOT_APPLICABLE (a class card, a persona).', null, null),
  ('complete_my_setup', 'LEARNER', 'BOB-24: the caller marks their own set-up COMPLETE once a username and a PIN are in place (the password is Auth''s; Gate 3 calls this after it).', null, null),
  ('correct_username', 'STAFF', 'BOB-24: the platform administrator corrects a person''s username, with a stated reason, audited (from, to, reason). Refuses everyone else.', 'SYSTEM_ADMIN', null),
  ('admin_reset_recovery', 'STAFF', 'BOB-24: the platform administrator restores a person''s PIN recovery with a stated reason, audited; forces a new PIN. Refuses everyone else.', 'SYSTEM_ADMIN', null),
  ('security_events', 'STAFF', 'BOB-24: the identity security and recovery record (audit actions identity.*), newest first. The platform administrator''s only.', 'SYSTEM_ADMIN', null);

-- ═══════════════════════════════════════════════════ terminal verification
do $$
declare n int; t text;
begin
  select count(*) into n from public.persons where pintar_id is null or pintar_id !~ '^[0-9A-HJKMNP-TV-Z]{8}$';
  if n > 0 then raise exception 'BOB-24: % person(s) without a well-formed PINTAR ID', n; end if;
  if public.pintar_id_canonical(' a14c-d7st ') <> 'A14CD7ST' or public.pintar_id_canonical('0I1L0OO0') <> '01110000'
     or public.pintar_id_canonical('A14CD7SU') is not null or public.pintar_id_canonical('A14CD7S') is not null then
    raise exception 'BOB-24: PINTAR ID input is not normalised as ruled';
  end if;
  foreach t in array array['person_usernames', 'person_pins', 'person_pins_retired', 'account_setup', 'identity_attempts', 'recovery_ladder'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass) then
      raise exception 'BOB-24: % has no RLS', t;
    end if;
    if exists (select 1 from pg_policy where polrelid = ('public.' || t)::regclass) then
      raise exception 'BOB-24: % has a policy', t;
    end if;
    if has_table_privilege('anon', 'public.' || t, 'select') or has_table_privilege('authenticated', 'public.' || t, 'select')
       or has_table_privilege('service_role', 'public.' || t, 'select') then
      raise exception 'BOB-24: % is readable by a client role', t;
    end if;
  end loop;
  if has_function_privilege('authenticated', 'public.recovery_attempt(text,text)', 'execute')
     or has_function_privilege('anon', 'public.recovery_attempt(text,text)', 'execute')
     or has_function_privilege('authenticated', 'public.pin_matches(uuid,text)', 'execute') then
    raise exception 'BOB-24: a client can reach recovery or the PIN check';
  end if;
  if public.pin_weakness('0000') is null or public.pin_weakness('1234') is null or public.pin_weakness('4321') is null
     or public.pin_weakness('1111') is null or public.pin_weakness('7394') is not null then
    raise exception 'BOB-24: the PIN blocklist is not as ruled';
  end if;
end $$;

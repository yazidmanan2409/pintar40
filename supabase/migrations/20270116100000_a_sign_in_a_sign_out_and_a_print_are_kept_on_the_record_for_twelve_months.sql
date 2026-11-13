-- ---------------------------------------------------------------------------
-- B1 · ACCOUNTABILITY EVENTS (docs/completion-4.1/batches/B1-COMPLETION.md, Sharon's pre-build PASS; THE PLAN §5.1;
-- O41-4, O41-13, C5: accountability, not surveillance). A school can answer "who signed in, who failed to, who printed
-- this" for twelve months. Until this migration a successful sign-in left no durable record and a failed one only a
-- fifteen-minute rate-limit counter.
--
--   * ONE STORE, public.accountability_events, separate from audit_log (no key into it; audit_log is unchanged). Four
--     kinds: SIGN_IN_OK, SIGN_IN_FAILED, SIGN_OUT, PRINT_REQUEST. A row holds the kind, the method of a sign-in
--     (PASSWORD, CARD, LINK, CODE, RECOVERY_PIN), the person when the identifier resolved to one, the governed hash of
--     the typed identifier for a failure, the schools (institution_ids, below), the outcome (OK, or the route's own
--     stable failure code; never Auth's text), the coarse network origin (an IPv4 /24 or an IPv6 /48 prefix, never an
--     address), the resource of a print and its reference, and the instant. NEVER a password, code, PIN, card secret,
--     full address, user agent, device fingerprint or the typed identifier itself.
--   * INSERT-ONLY. The guard refuses every UPDATE, DELETE and TRUNCATE, with two exceptions only: the purge (below),
--     under its own transaction-local marker, and the governed personal-data deletion (L4, hapus_data_pribadi), which
--     may set network_origin and identifier_hash to null on the rows of the one person it is deleting, and change
--     nothing else, only while its own transaction-local marker names that person (the pattern of
--     pintar.anonimkan_email, 20270113130000). No client role holds any right on the table: writes go through one
--     service-level writer, reads through one reader.
--   * BLOCKER 1, SCHOOLS AS A SNAPSHOT. institution_ids is computed INSIDE the writer from the person, at the instant
--     it runs: every school where the person holds a role assignment that is not revoked and is within valid_from and
--     valid_until, or an enrolment that is PENDING or ACTIVE. The writer takes no school from the application. It is
--     never recomputed: a later change of roles or enrolments changes no stored row. An unresolved identifier or
--     platform staff gives an empty snapshot, which only the platform admin reads. A PRINT (owner, via Bob, 11 Nov):
--     the single school that owns the printed resource (its node's, or its assignment's, institution), computed here,
--     never the person's affiliations and never the route's.
--   * BLOCKER 2: one processed attempt is one row; the application calls the writer once per processed attempt, after
--     its final answer (src/app/api/_akuntabilitas/catat.ts). The database adds no de-duplication: two attempts are two rows.
--   * THE IDENTIFIER HASH is computed by the application (src/app/api/_akuntabilitas/catat.ts) as an HMAC-SHA256 with the existing
--     pepper (CARD_PEPPER, the rate limiter's key) under this store's own purpose label «akuntabilitas», over the
--     normalised typed identifier, never over an address. PEPPER ROTATION: rotating CARD_PEPPER breaks the link between
--     a new hash of an identifier and every older hash of the same identifier in this store; older rows keep their
--     hash, which then matches nothing typed afterwards. The rate limiter's keys are transient and re-form on their own;
--     these do not, by design (no row is ever re-keyed).
--   * THE WRITER'S TIMEOUT. A function's own SET of statement_timeout does not bound the statement that called it, so
--     the bound is the caller's: the application aborts the writer's request after 1.5 s (src/app/api/_akuntabilitas/catat.ts) and
--     the writer waits on no lock longer than 1 s (lock_timeout). Fail open for sign-in and sign-out (logged without
--     the identifier, and counted through akuntabilitas_gagal_hitung, reported by the health check), fail closed for a
--     print (B2: no event, no reference, no official print).
--   * RETENTION is exactly twelve months, a constant in akuntabilitas_buang_lama (O41-4, O41-13), not a setting: rows
--     older than that are deleted in bounded batches taken with FOR UPDATE SKIP LOCKED (two runs at once delete each
--     row once), and each run that deleted anything writes one audit row (how many, the oldest and newest instant).
--     A daily job runs it, installed by the shared installer (the next migration). A failed run changes nothing and is
--     retried the next day. The table is ordinary application data and is in the backup.
--   * NOT A METRIC SOURCE (§5.1 E): metric_sources refuses the store, and assert_accountability_is_not_evidence() fails
--     if any evidence consumer or view reads it.
--   * History starts when this migration lands; there is no backfill.
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════ the raiser (PR200)
create or replace function public.akuntabilitas_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR200',
    detail  = p_code,
    message = case p_code
      when 'ACCOUNTABILITY_NOT_ALLOWED'     then 'the sign-in record is read by a school''s administrator (their school''s rows) or the platform administrator'
      when 'ACCOUNTABILITY_NOT_SERVICE'     then 'an accountability event is written by the service, with no signed-in actor'
      when 'ACCOUNTABILITY_EVENT_INVALID'   then 'not a known kind, method and outcome, or the person a success, sign-out or print needs is missing'
      when 'ACCOUNTABILITY_ORIGIN_INVALID'  then 'the network origin is an IPv4 /24 or an IPv6 /48 prefix, never an address'
      when 'ACCOUNTABILITY_HASH_INVALID'    then 'the identifier hash is 64 hexadecimal characters, on a failed sign-in only'
      when 'ACCOUNTABILITY_RESOURCE_INVALID' then 'a print names its report and exactly one class node or assignment of a school'
      when 'ACCOUNTABILITY_INSERT_ONLY'     then 'the record is insert-only: only the twelve-month purge deletes, and only a personal-data deletion clears an origin or a hash'
      when 'ACCOUNTABILITY_NOT_A_SOURCE'    then 'the sign-in record is not a source of any metric, report or calculator'
      else 'the sign-in record refused this'
    end;
end $$;
revoke all on function public.akuntabilitas_tolak(text) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the store
create table public.accountability_events (
  id              bigint generated always as identity primary key,
  at              timestamptz not null default clock_timestamp(),
  kind            text not null,
  method          text,
  person_id       uuid,
  identifier_hash text,
  institution_ids uuid[] not null default '{}',
  outcome         text not null,
  network_origin  text,
  resource        jsonb,
  print_ref       text,
  constraint accountability_events_kind check (kind in ('SIGN_IN_OK', 'SIGN_IN_FAILED', 'SIGN_OUT', 'PRINT_REQUEST')),
  constraint accountability_events_method check (
    (kind in ('SIGN_IN_OK', 'SIGN_IN_FAILED')) = (method is not null)
    and (method is null or method in ('PASSWORD', 'CARD', 'LINK', 'CODE', 'RECOVERY_PIN'))),
  constraint accountability_events_outcome check (
    outcome ~ '^[A-Z][A-Z_]{1,47}$' and (kind = 'SIGN_IN_FAILED') = (outcome <> 'OK')),
  -- a hash is a failure's only, and only ever the hash; a person is named by every kind but a failure that resolved nobody
  constraint accountability_events_hash check (
    identifier_hash is null or (kind = 'SIGN_IN_FAILED' and identifier_hash ~ '^[0-9a-f]{64}$')),
  constraint accountability_events_person check (kind = 'SIGN_IN_FAILED' or person_id is not null),
  constraint accountability_events_origin check (
    network_origin is null
    or network_origin ~ '^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.0/24$'
    or network_origin ~ '^[0-9a-f]{1,4}:[0-9a-f]{1,4}:[0-9a-f]{1,4}::/48$'),
  constraint accountability_events_print check (
    (kind = 'PRINT_REQUEST') = (resource is not null) and (kind = 'PRINT_REQUEST') = (print_ref is not null)
    and (print_ref is null or print_ref ~ '^CTK-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$')),
  constraint accountability_events_print_one_school check (kind <> 'PRINT_REQUEST' or cardinality(institution_ids) = 1)
);
comment on table public.accountability_events is
  'B1: who signed in, who failed to, who signed out, who asked for a print; twelve months (O41-13), insert-only, read through akuntabilitas_baca only.';
create unique index accountability_events_print_ref on public.accountability_events (print_ref) where print_ref is not null;
create index accountability_events_at on public.accountability_events (at desc, id desc);
create index accountability_events_schools on public.accountability_events using gin (institution_ids);
create index accountability_events_person on public.accountability_events (person_id, at desc) where person_id is not null;
alter table public.accountability_events enable row level security;
-- no policy and no right: no client role reads or writes it, the service role included (the writer and the reader are
-- the only ways in). Supabase's default privileges grant a new table and its sequence to the client roles: taken back.
revoke all on table public.accountability_events from public, anon, authenticated, service_role;
revoke all on sequence public.accountability_events_id_seq from public, anon, authenticated, service_role;

-- since when the store has recorded (the reader's «recorded since» and the purged reference's «sejak»)
create table public.accountability_store (
  singleton  boolean primary key default true check (singleton),
  started_at timestamptz not null
);
insert into public.accountability_store (started_at) values (now());
alter table public.accountability_store enable row level security;
revoke all on table public.accountability_store from public, anon, authenticated, service_role;

-- a write that could not be made (Sharon's condition: fail open, but every failure counted, and reported)
create table public.accountability_write_failures (
  day      date not null,
  kind     text not null check (kind in ('SIGN_IN', 'SIGN_OUT', 'PRINT_REQUEST')),
  n        integer not null check (n > 0),
  last_at  timestamptz not null,
  primary key (day, kind)
);
alter table public.accountability_write_failures enable row level security;
revoke all on table public.accountability_write_failures from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the guard
create or replace function public.accountability_events_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_orang text := coalesce(current_setting('pintar.akuntabilitas_anonimkan', true), '');
begin
  if tg_op = 'TRUNCATE' then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_INSERT_ONLY');
  elsif tg_op = 'DELETE' then
    -- the twelve-month purge's own path, and only for a row past the twelve months
    if coalesce(current_setting('pintar.akuntabilitas_buang', true), '') = 'on' and old.at < now() - interval '12 months' then
      return old;
    end if;
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_INSERT_ONLY');
  elsif tg_op = 'UPDATE' then
    -- L4 (blocker 3): the deletion transaction's marker names this row's person; the origin and the hash go to null;
    -- nothing else moves
    if v_orang <> '' and old.person_id is not null and old.person_id::text = v_orang
       and new.network_origin is null and new.identifier_hash is null
       and new.id = old.id and new.at = old.at and new.kind = old.kind and new.method is not distinct from old.method
       and new.person_id is not distinct from old.person_id and new.institution_ids = old.institution_ids
       and new.outcome = old.outcome and new.resource is not distinct from old.resource
       and new.print_ref is not distinct from old.print_ref then
      return new;
    end if;
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_INSERT_ONLY');
  end if;
  return null;
end $$;
revoke all on function public.accountability_events_guard() from public, anon, authenticated, service_role;
create trigger accountability_events_guard before update or delete on public.accountability_events
  for each row execute function public.accountability_events_guard();
create trigger accountability_events_no_truncate before truncate on public.accountability_events
  for each statement execute function public.accountability_events_guard();

-- ═══════════════════════════════════════════════════════════ the schools at an instant
-- Every school where the person is live at p_at: a role assignment not revoked and within its validity, or an enrolment
-- PENDING or ACTIVE. Sorted, so a snapshot reads the same however it was found.
create or replace function public.akuntabilitas_sekolah_orang(p_person uuid, p_at timestamptz)
returns uuid[] language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(array_agg(distinct s order by s), '{}'::uuid[]) from (
    select ra.institution_id as s from public.role_assignments ra
     where ra.person_id = p_person and ra.institution_id is not null and ra.revoked_at is null
       and p_at >= ra.valid_from and p_at < ra.valid_until
    union
    select e.institution_id from public.enrollments e
     where e.person_id = p_person and e.status in ('PENDING', 'ACTIVE')
  ) x where s is not null
$$;
revoke all on function public.akuntabilitas_sekolah_orang(uuid, timestamptz) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the writer (service only)
-- One processed attempt, one call. The person is resolved here: from the Auth user the route knows, or else from the
-- identifier the attempt named (an account's sign-in address, or a PINTAR ID: read to find the person, never stored). The
-- schools are computed here (above; a print's from its resource). Returns the row's id and, for a print, its reference.
create or replace function public.akuntabilitas_catat(
  p_kind text, p_method text, p_outcome text, p_auth_user uuid, p_pengenal text,
  p_identifier_hash text, p_origin text, p_resource jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp set lock_timeout = '1000ms' as $$
declare v_claims jsonb; v_role text; v_person uuid; v_schools uuid[]; v_now timestamptz := clock_timestamp();
        v_res jsonb; v_inst uuid; v_ref text; v_id bigint; v_hari text; v_scope text; v_rid uuid; i int;
        v_abjad constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; v_b bytea;
begin
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or auth.uid() is not null or (v_role is not null and v_role <> 'service_role') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_SERVICE');
  end if;
  if p_kind is null or p_kind not in ('SIGN_IN_OK', 'SIGN_IN_FAILED', 'SIGN_OUT', 'PRINT_REQUEST')
     or (p_kind in ('SIGN_IN_OK', 'SIGN_IN_FAILED')) <> (p_method is not null)
     or (p_method is not null and p_method not in ('PASSWORD', 'CARD', 'LINK', 'CODE', 'RECOVERY_PIN'))
     or p_outcome is null or p_outcome !~ '^[A-Z][A-Z_]{1,47}$' or (p_kind = 'SIGN_IN_FAILED') <> (p_outcome <> 'OK')
     or (p_pengenal is not null and length(p_pengenal) > 320) then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_EVENT_INVALID');
  end if;
  if p_identifier_hash is not null and (p_kind <> 'SIGN_IN_FAILED' or p_identifier_hash !~ '^[0-9a-f]{64}$') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_HASH_INVALID');
  end if;
  if p_origin is not null and not (
       p_origin ~ '^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.0/24$'
       or p_origin ~ '^[0-9a-f]{1,4}:[0-9a-f]{1,4}:[0-9a-f]{1,4}::/48$') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_ORIGIN_INVALID');
  end if;
  -- the person
  if p_auth_user is not null then
    select a.person_id into v_person from public.accounts a where a.auth_user_id = p_auth_user limit 1;
  elsif p_pengenal is not null and position('@' in p_pengenal) > 0 then
    select a.person_id into v_person from auth.users u join public.accounts a on a.auth_user_id = u.id
     where lower(u.email) = lower(btrim(p_pengenal)) limit 1;
  elsif p_pengenal is not null and upper(regexp_replace(p_pengenal, '[\s-]', '', 'g')) ~ '^[0-9A-Z]{8}$' then
    select p.id into v_person from public.persons p where p.pintar_id = upper(regexp_replace(p_pengenal, '[\s-]', '', 'g'));
  end if;
  if p_kind <> 'SIGN_IN_FAILED' and v_person is null then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_EVENT_INVALID');
  end if;
  -- the schools: a print's single owning school; anyone else's live affiliations at this instant
  if p_kind = 'PRINT_REQUEST' then
    if p_resource is null or jsonb_typeof(p_resource) <> 'object' or coalesce(p_resource ->> 'report', '') !~ '^[a-z][a-z0-9_.]{2,60}$'
       or (select count(*) from jsonb_object_keys(p_resource) k where k in ('node_id', 'learning_assignment_id', 'assessment_assignment_id')) <> 1
       or (select count(*) from jsonb_object_keys(p_resource)) <> 2 then
      perform public.akuntabilitas_tolak('ACCOUNTABILITY_RESOURCE_INVALID');
    end if;
    v_scope := (select k from jsonb_object_keys(p_resource) k where k <> 'report');
    begin
      v_rid := (p_resource ->> v_scope)::uuid;
    exception when others then v_rid := null; end;
    if v_scope = 'node_id' then
      select n.institution_id into v_inst from public.org_nodes n where n.id = v_rid;
    elsif v_scope = 'learning_assignment_id' then
      select la.institution_id into v_inst from public.learning_assignments la where la.id = v_rid;
    else
      select aa.institution_id into v_inst from public.assessment_assignments aa where aa.id = v_rid;
    end if;
    if v_inst is null then perform public.akuntabilitas_tolak('ACCOUNTABILITY_RESOURCE_INVALID'); end if;
    v_schools := array[v_inst];
    v_res := jsonb_build_object('report', p_resource ->> 'report', v_scope, v_rid);
  else
    if p_resource is not null then perform public.akuntabilitas_tolak('ACCOUNTABILITY_RESOURCE_INVALID'); end if;
    v_schools := case when v_person is null then '{}'::uuid[] else public.akuntabilitas_sekolah_orang(v_person, v_now) end;
  end if;
  -- a print's reference: CTK-XXXX-XXXX in Crockford's alphabet, stable and unique (a collision is drawn again)
  if p_kind = 'PRINT_REQUEST' then
    for attempt in 1..5 loop
      v_b := uuid_send(gen_random_uuid());
      v_hari := '';
      for i in 0..7 loop v_hari := v_hari || substr(v_abjad, (get_byte(v_b, i) % 32) + 1, 1); end loop;
      v_ref := 'CTK-' || substr(v_hari, 1, 4) || '-' || substr(v_hari, 5, 4);
      exit when not exists (select 1 from public.accountability_events e where e.print_ref = v_ref);
    end loop;
  end if;
  insert into public.accountability_events (at, kind, method, person_id, identifier_hash, institution_ids, outcome, network_origin, resource, print_ref)
  values (v_now, p_kind, p_method, v_person, p_identifier_hash, v_schools, p_outcome, p_origin, v_res, v_ref)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'ref', v_ref);
end $$;
revoke all on function public.akuntabilitas_catat(text, text, text, uuid, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.akuntabilitas_catat(text, text, text, uuid, text, text, text, jsonb) to service_role;

-- a write that failed, counted per day and kind (no identifier, no address, nothing about the attempt but its kind)
create or replace function public.akuntabilitas_gagal_hitung(p_kind text)
returns void language plpgsql security definer set search_path = public, pg_temp set lock_timeout = '1000ms' as $$
declare v_claims jsonb; v_role text;
begin
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or auth.uid() is not null or (v_role is not null and v_role <> 'service_role') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_SERVICE');
  end if;
  if p_kind is null or p_kind not in ('SIGN_IN', 'SIGN_OUT', 'PRINT_REQUEST') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_EVENT_INVALID');
  end if;
  insert into public.accountability_write_failures as f (day, kind, n, last_at)
  values ((now() at time zone 'Asia/Jakarta')::date, p_kind, 1, now())
  on conflict (day, kind) do update set n = f.n + 1, last_at = excluded.last_at;
end $$;
revoke all on function public.akuntabilitas_gagal_hitung(text) from public, anon, authenticated;
grant execute on function public.akuntabilitas_gagal_hitung(text) to service_role;

-- ═══════════════════════════════════════════════════════════ the reader
-- The caller's reach: the platform admin, every row (p_sekolah narrows to one school's); a school's admin, the rows
-- whose snapshot holds p_sekolah, a school they administer now. A row with an empty snapshot is the platform admin's
-- only. The network origin is the platform admin's only. A page of p_ukuran rows (one more when there are more), the
-- newest first, filtered by kind, by a person (name or PINTAR ID) or a print reference typed in p_cari, and by a date
-- range read on the school's clock (WIB when no school is named).
create or replace function public.akuntabilitas_baca(
  p_sekolah uuid default null, p_jenis text default null, p_cari text default null,
  p_dari date default null, p_sampai date default null, p_halaman integer default 1, p_ukuran integer default 50)
returns table (id bigint, at timestamptz, kind text, method text, outcome text, person_id uuid, nama text, pintar_id text,
               institution_ids uuid[], network_origin text, resource jsonb, print_ref text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); v_platform boolean := public.is_system_admin(); v_zona text := 'Asia/Jakarta';
        v_q text := nullif(btrim(regexp_replace(coalesce(p_cari, ''), '\s+', ' ', 'g')), ''); v_ref text; v_pid text;
        v_ukuran int := least(greatest(coalesce(p_ukuran, 50), 1), 100); v_hal int := greatest(coalesce(p_halaman, 1), 1);
        v_dari timestamptz; v_sampai timestamptz;
begin
  if v_me is null then perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_ALLOWED'); end if;
  if not v_platform and (p_sekolah is null or not exists (
       select 1 from public.role_assignments ra
        where ra.person_id = v_me and ra.role = 'INSTITUTION_ADMIN' and ra.institution_id = p_sekolah
          and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)) then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_ALLOWED');
  end if;
  if p_jenis is not null and p_jenis not in ('SIGN_IN_OK', 'SIGN_IN_FAILED', 'SIGN_OUT', 'PRINT_REQUEST') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_EVENT_INVALID');
  end if;
  if p_sekolah is not null then
    select coalesce(i.zona_waktu, 'Asia/Jakarta') into v_zona from public.institutions i where i.id = p_sekolah;
    v_zona := coalesce(v_zona, 'Asia/Jakarta');
  end if;
  v_dari := case when p_dari is null then null else p_dari::timestamp at time zone v_zona end;
  v_sampai := case when p_sampai is null then null else (p_sampai + 1)::timestamp at time zone v_zona end;
  -- a print reference, typed with or without its dashes and in any case
  if v_q is not null and upper(regexp_replace(v_q, '[\s-]', '', 'g')) ~ '^CTK[0-9A-HJKMNP-TV-Z]{8}$' then
    v_ref := upper(regexp_replace(v_q, '[\s-]', '', 'g'));
    v_ref := 'CTK-' || substr(v_ref, 4, 4) || '-' || substr(v_ref, 8, 4);
  elsif v_q is not null then
    v_pid := upper(regexp_replace(v_q, '[\s-]', '', 'g'));
  end if;
  return query
    select e.id, e.at, e.kind, e.method, e.outcome, e.person_id, p.display_name, p.pintar_id, e.institution_ids,
           case when v_platform then e.network_origin end, e.resource, e.print_ref
      from public.accountability_events e
      left join public.persons p on p.id = e.person_id
     where (p_sekolah is null or p_sekolah = any (e.institution_ids))
       and (v_platform or cardinality(e.institution_ids) > 0)
       and (p_jenis is null or e.kind = p_jenis)
       and (v_dari is null or e.at >= v_dari) and (v_sampai is null or e.at < v_sampai)
       and (v_ref is null or e.print_ref = v_ref)
       and (v_pid is null or (e.person_id is not null and (p.pintar_id = v_pid or p.display_name ilike '%' || replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_') || '%')))
     order by e.at desc, e.id desc
     offset (v_hal - 1) * v_ukuran limit v_ukuran + 1;
end $$;
revoke all on function public.akuntabilitas_baca(uuid, text, text, date, date, integer, integer) from public, anon, authenticated;
grant execute on function public.akuntabilitas_baca(uuid, text, text, date, date, integer, integer) to authenticated;

-- since when the reader can show anything: the store's start, or twelve months ago once it is older
create or replace function public.akuntabilitas_sejak(p_sekolah uuid default null)
returns timestamptz language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if v_me is null or not (public.is_system_admin() or (p_sekolah is not null and exists (
       select 1 from public.role_assignments ra
        where ra.person_id = v_me and ra.role = 'INSTITUTION_ADMIN' and ra.institution_id = p_sekolah
          and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until))) then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_ALLOWED');
  end if;
  return (select greatest(s.started_at, now() - interval '12 months') from public.accountability_store s);
end $$;
revoke all on function public.akuntabilitas_sejak(uuid) from public, anon, authenticated;
grant execute on function public.akuntabilitas_sejak(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ the purge (the daily job's entry point)
-- Twelve months exactly (O41-4: no record kept longer than its purpose; O41-13: a school answers for twelve months).
-- Bounded: at most p_batas rows a batch and 50 batches a run; taken in id order with FOR UPDATE SKIP LOCKED, so two runs
-- at once never take the same row and each row is deleted once. One audit row per run that deleted anything.
create or replace function public.akuntabilitas_buang_lama(p_batas integer default 1000)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_umur constant interval := interval '12 months';
  v_claims jsonb; v_role text; v_batas int := least(greatest(coalesce(p_batas, 1000), 1), 10000);
  v_n int := 0; v_k int; v_lama timestamptz; v_baru timestamptz; v_l timestamptz; v_b timestamptz; v_putaran int := 0;
begin
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or auth.uid() is not null or (v_role is not null and v_role <> 'service_role') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_SERVICE');
  end if;
  perform set_config('pintar.akuntabilitas_buang', 'on', true);
  loop
    v_putaran := v_putaran + 1;
    with sasaran as (
      select e.id from public.accountability_events e
       where e.at < now() - v_umur
       order by e.id
       limit v_batas
       for update skip locked),
    dibuang as (
      delete from public.accountability_events e using sasaran s where e.id = s.id returning e.at)
    select count(*), min(d.at), max(d.at) into v_k, v_l, v_b from dibuang d;
    v_n := v_n + v_k;
    if v_k > 0 then
      v_lama := least(coalesce(v_lama, v_l), v_l);
      v_baru := greatest(coalesce(v_baru, v_b), v_b);
    end if;
    exit when v_k < v_batas or v_putaran >= 50;
  end loop;
  perform set_config('pintar.akuntabilitas_buang', '', true);
  if v_n > 0 then
    perform public.audit_write('accountability.purged', 'accountability_events', null, null,
      jsonb_build_object('deleted', v_n, 'oldest', v_lama, 'newest', v_baru, 'kept_for', '12 months'));
  end if;
  return jsonb_build_object('ok', true, 'dihapus', v_n, 'tertua', v_lama, 'terbaru', v_baru);
end $$;
revoke all on function public.akuntabilitas_buang_lama(integer) from public, anon, authenticated;
grant execute on function public.akuntabilitas_buang_lama(integer) to service_role;

-- ═══════════════════════════════════════════════════════════ not a metric source (§5.1 E)
create or replace function public.akuntabilitas_bukan_sumber_metrik()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.source_relation in ('accountability_events', 'accountability_write_failures', 'accountability_store') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_A_SOURCE');
  end if;
  return new;
end $$;
revoke all on function public.akuntabilitas_bukan_sumber_metrik() from public, anon, authenticated, service_role;
create trigger akuntabilitas_bukan_sumber_metrik before insert on public.metric_sources
  for each row execute function public.akuntabilitas_bukan_sumber_metrik();

-- The boundary, measured (the F07-P11 pattern): no evidence consumer or calculator names the store, no view is built
-- over it, and it is not a declared source. Comments are stripped before the source is read.
create or replace function public.assert_accountability_is_not_evidence()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare problems text[] := '{}'; bad text; n int; v_consumers text[];
begin
  select array(
    select p.proname::text from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and (p.proname = any (array[
              'grade_response','evaluate_session','finalize_session','session_final_responses','session_outcome','session_review',
              'reading_map','learning_delta','assemble_session','recompute_result','metric_evaluate','generate_report',
              'certificate_eligibility','certificate_prepare','verify_certificate','derive_evidence_class','effective_evidence_class',
              'recompute_question_health','record_integrity_signal','management_learner_detail','advance_briefing'])
         or p.proname like 'calc\_%' or p.proname like 'metric\_%' or p.proname like 'laporan\_%' or p.proname like 'report\_%'))
    into v_consumers;
  n := coalesce(cardinality(v_consumers), 0);
  if n < 20 then problems := problems || format('the consumer set has collapsed to %s function(s): this assertion would pass over almost nothing', n); end if;
  select string_agg(p.proname, ', ') into bad from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname = any (v_consumers)
     and regexp_replace(regexp_replace(coalesce(p.prosrc, ''), '/\*.*?\*/', ' ', 'gs'), '--[^\n]*', ' ', 'g')
         ~* '\yaccountability_(events|write_failures|store)\y';
  if bad is not null then problems := problems || ('consumer(s) reading the sign-in record: ' || bad); end if;
  select string_agg(distinct dep.relname, ', ') into bad
    from pg_depend d join pg_rewrite rw on rw.oid = d.objid join pg_class dep on dep.oid = rw.ev_class
    join pg_class ref on ref.oid = d.refobjid
   where ref.oid in (to_regclass('public.accountability_events'), to_regclass('public.accountability_write_failures'))
     and dep.oid <> ref.oid;
  if bad is not null then problems := problems || ('view(s) built over the sign-in record: ' || bad); end if;
  select string_agg(source_relation, ', ') into bad from public.metric_sources where source_relation like 'accountability\_%';
  if bad is not null then problems := problems || ('declared metric source(s): ' || bad); end if;
  return query select cardinality(problems) = 0, coalesce(array_to_string(problems, '; '), '');
end $$;
revoke all on function public.assert_accountability_is_not_evidence() from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ L4 (blocker 3): the governed deletion
-- 20270113130000's definition, unchanged, with one addition before its audit row: the person's sign-in record keeps its
-- kind, its instant and its person, and loses its network origin and identifier hash, under this transaction's own
-- marker (pintar.akuntabilitas_anonimkan, the person's id), set for that one statement and cleared after it.
create or replace function public.hapus_data_pribadi(p_request uuid, p_catatan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public.current_person_id(); r public.account_requests; v_pid text; a record; v_foto boolean; v_lama text;
begin
  if v_actor is null or not public.is_system_admin() then perform public.akun_tolak('ACCOUNT_NOT_ALLOWED'); end if;
  select * into r from public.account_requests q where q.id = p_request for update;
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 2): a request already carried out answers with its person and
  -- writes nothing, so the route's second press removes a photo file the first could not
  if r.id is not null and r.kind = 'DELETE_PERSONAL_DATA' and r.status = 'DONE'
     and exists (select 1 from public.persons p where p.id = r.person_id and p.anonymized_at is not null) then
    return jsonb_build_object('ok', true, 'orang', r.person_id, 'sudah', true);
  end if;
  if r.id is null or r.kind <> 'DELETE_PERSONAL_DATA' or r.status not in ('RECEIVED', 'IN_PROGRESS') then
    perform public.akun_tolak('ACCOUNT_REQUEST_INVALID');
  end if;
  if not exists (select 1 from public.person_suspensions s where s.person_id = r.person_id and s.ended_at is null and s.category = 'CLOSED_AT_REQUEST') then
    perform public.akun_tolak('ACCOUNT_NOT_CLOSED');
  end if;
  select p.pintar_id, p.photo_path is not null into v_pid, v_foto from public.persons p where p.id = r.person_id for update;
  update public.persons set display_name = v_pid, photo_path = null, anonymized_at = now() where id = r.person_id;
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 1 on 6faef690): a class card's address (card-<number>@…) is not
  -- personal data and its own guard refuses any change, so only the email accounts are retired
  for a in select ac.id, ac.auth_user_id from public.accounts ac
            where ac.person_id = r.person_id and ac.auth_user_id is not null and ac.kind = 'EMAIL' loop
    perform set_config('pintar.anonimkan_email', a.id::text, true);
    select lower(u.email) into v_lama from auth.users u where u.id = a.auth_user_id;
    update auth.users set email = 'anonim-' || a.auth_user_id::text || '@pintar.invalid', email_change = '',
                          raw_user_meta_data = '{}'::jsonb where id = a.auth_user_id;
    -- GoTrue keeps the address again in the identity; it is not synced by the update above
    update auth.identities set identity_data = jsonb_build_object('sub', a.auth_user_id::text,
                                                                  'email', 'anonim-' || a.auth_user_id::text || '@pintar.invalid')
     where user_id = a.auth_user_id;
    -- CORRECTED IN PLACE (undeployed; Sharon's addendum on dc84af22): GoTrue's own copies of the address. Its audit log
    -- keeps the event and loses the address; a one-time token (recovery, confirmation) is removed, since it is useless
    -- for an address that no longer exists.
    update auth.audit_log_entries x
       set payload = ((x.payload::jsonb - 'actor_username' - 'actor_name')
                   || case when jsonb_typeof(x.payload::jsonb -> 'traits') = 'object'
                           then jsonb_build_object('traits', (x.payload::jsonb -> 'traits') - 'user_email' - 'email')
                           else '{}'::jsonb end)::json,
           -- CORRECTED IN PLACE (undeployed; Sharon's re-verification at 435a2856): GoTrue's record of where each event
           -- came from is the person's too; the IP goes, the event stays
           ip_address = ''
     where x.payload ->> 'actor_id' = a.auth_user_id::text or x.payload -> 'traits' ->> 'user_id' = a.auth_user_id::text
        -- (same correction) an entry naming the address under neither id, a failed sign-in, is found by the address
        -- itself, read before it was replaced
        or lower(x.payload -> 'traits' ->> 'user_email') = v_lama or lower(x.payload ->> 'actor_username') = v_lama;
    -- a session left behind keeps the device's IP and browser; the account is closed, so none is needed
    delete from auth.refresh_tokens t where t.user_id = a.auth_user_id::text;
    delete from auth.sessions s where s.user_id = a.auth_user_id;
    delete from auth.one_time_tokens t where t.user_id = a.auth_user_id;
  end loop;
  -- CORRECTED IN PLACE (undeployed; Sharon §16 finding 3): the name and email where else PINTAR copied them. Each address
  -- becomes an address of no one, unique per row; a name becomes the PINTAR ID; an import row keeps no payload. The audit
  -- log keeps its history of corrections (INV-18), as the person is told.
  update public.account_activation_grants g
     set email = 'anonim-' || g.id::text || '@pintar.invalid',
         display_name = case when g.display_name is null then null else v_pid end
   where g.person_id = r.person_id
      or g.consumed_by in (select ac.auth_user_id from public.accounts ac where ac.person_id = r.person_id);
  update public.email_corrections c
     set old_email = 'anonim-' || c.id::text || '-lama@pintar.invalid', new_email = 'anonim-' || c.id::text || '@pintar.invalid'
   where c.person_id = r.person_id;
  update public.card_conversions c set new_email = 'anonim-' || c.id::text || '@pintar.invalid' where c.person_id = r.person_id;
  update public.import_rows ir set payload = '{}'::jsonb where ir.person_id = r.person_id;
  -- what the person wrote with a request to reopen (owner ruling 2) is theirs too
  update public.account_requests q set pesan = null where q.person_id = r.person_id and q.pesan is not null;
  perform set_config('pintar.identity_correction', 'on', true);
  update public.person_usernames un set username = 'anonim.' || lower(v_pid) where un.person_id = r.person_id;
  perform set_config('pintar.identity_correction', '', true);
  -- B1 (blocker 3): the person's sign-in record keeps kind, instant and person; its origin and hash go
  perform set_config('pintar.akuntabilitas_anonimkan', r.person_id::text, true);
  update public.accountability_events e set network_origin = null, identifier_hash = null
   where e.person_id = r.person_id and (e.network_origin is not null or e.identifier_hash is not null);
  perform set_config('pintar.akuntabilitas_anonimkan', '', true);
  update public.account_requests set status = 'DONE', decided_by = v_actor, decided_at = now(),
         decision_note = nullif(btrim(coalesce(p_catatan, '')), '') where id = r.id;
  perform public.audit_write('account.personal_data_deleted', 'persons', r.person_id::text, null,
    jsonb_build_object('person_id', r.person_id, 'request_id', r.id, 'removed', jsonb_build_array('name', 'sign_in_email', 'username', 'copies', 'sign_in_origins')
                         || case when v_foto then jsonb_build_array('photo') else '[]'::jsonb end,
                       'kept', jsonb_build_array('results', 'certificates_as_issued', 'audit_log'),
                       'actor_role', public.audit_actor_role(null)));
  -- the person, so the server route that called this removes every file in their photo folder from storage
  -- (Sharon §16 finding 2: a database cannot delete a stored file; storage.protect_delete refuses it)
  return jsonb_build_object('ok', true, 'orang', r.person_id);
end $$;
revoke all on function public.hapus_data_pribadi(uuid, text) from public, anon, authenticated;
grant execute on function public.hapus_data_pribadi(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ the registry
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('akuntabilitas_baca', 'STAFF', 'B1: the sign-in record (sign-ins, failures, sign-outs, print requests), newest first, a page at a '
   || 'time, by kind, person or print reference and date. A school''s administrator: the rows whose school snapshot holds that school; '
   || 'the platform administrator: every row, the network origin theirs alone. No export, no delete.', 'SCOPE', 'INSTITUTION_ADMIN'),
  ('akuntabilitas_sejak', 'STAFF', 'B1: since when the sign-in record can show anything (its start, or twelve months ago), for the '
   || 'reader''s empty state; the same readers as akuntabilitas_baca.', 'SCOPE', 'INSTITUTION_ADMIN')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only.
-- ---------------------------------------------------------------------------
do $$
declare r text; f text;
begin
  foreach r in array array['accountability_events', 'accountability_store', 'accountability_write_failures'] loop
    foreach f in array array['anon', 'authenticated', 'service_role'] loop
      if has_table_privilege(f, 'public.' || r, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
        raise exception 'B1: % holds a right on %', f, r;
      end if;
    end loop;
  end loop;
  foreach f in array array['akuntabilitas_catat(text,text,text,uuid,text,text,text,jsonb)', 'akuntabilitas_gagal_hitung(text)',
                           'akuntabilitas_buang_lama(integer)', 'akuntabilitas_tolak(text)', 'accountability_events_guard()',
                           'akuntabilitas_sekolah_orang(uuid,timestamptz)', 'assert_accountability_is_not_evidence()',
                           'akuntabilitas_bukan_sumber_metrik()'] loop
    if has_function_privilege('authenticated', 'public.' || f, 'execute') or has_function_privilege('anon', 'public.' || f, 'execute') then
      raise exception 'B1: a client can call %', f;
    end if;
  end loop;
  if has_function_privilege('anon', 'public.akuntabilitas_baca(uuid,text,text,date,date,integer,integer)', 'execute') then
    raise exception 'B1: the signed-out role can read the sign-in record';
  end if;
  if not exists (select 1 from public.assert_accountability_is_not_evidence() a where a.ok) then
    raise exception 'B1: %', (select a.detail from public.assert_accountability_is_not_evidence() a);
  end if;
  raise notice 'B1 verified: the sign-in record is insert-only, closed to every client role, written and read through its functions';
end $$;

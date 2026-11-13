-- ---------------------------------------------------------------------------
-- SIGN-IN BY A SUSPENDED OR CLOSED ACCOUNT · bounded correction of 4.0 behaviour (owner's decision, 11 Nov 2026;
-- AUTH-SUSPENDED-SIGNIN-CORRECTION.md). Not a redesign of authentication.
--
--   * THE DEFECT: akun_kunci (20270113130000) locked an account with auth.users.banned_until = 'infinity'. Auth cannot
--     read that value as a time, so every request that loads the user failed (a sign-in answered 503 whatever the
--     password, while a wrong password and an unknown address answered 401): the state of an account could be learned
--     by anyone who tried its address.
--   * THE CORRECTION: the lock is ONE NAMED INSTANT, public.akun_terkunci_sampai(), a fixed far-future time that Auth
--     reads (2999-12-31 23:59:59 UTC), and Auth then refuses the sign-in with its own "banned" refusal, which the routes
--     answer as a non-match. akun_kunci is 20270113130000's definition with that one change; it is the only writer of
--     banned_until, and reinstatement still clears it (null). Nothing else in suspension, closure, reinstatement or
--     session ending changes.
--   * PIN RECOVERY, which Auth does not see: a suspended or closed person's PIN is answered as a wrong PIN (WRONG,
--     counted on the ladder), so recovery neither opens a locked account nor tells it apart (per method: each sign-in
--     method answers a locked account with its own ordinary mismatch).
--   * ACCOUNTS ALREADY LOCKED hold the old value: this migration rewrites every banned_until = 'infinity' to the
--     instant. It is written to be run again safely: on a database with no locked account it changes nothing, and a
--     second run finds nothing left to rewrite.
-- ---------------------------------------------------------------------------

-- the one instant a locked account is locked until (Auth's banned_until); far in the future, and a time Auth can read
create or replace function public.akun_terkunci_sampai()
returns timestamptz language sql immutable set search_path = pg_catalog, pg_temp as $$
  select timestamptz '2999-12-31 23:59:59+00'
$$;
revoke all on function public.akun_terkunci_sampai() from public, anon, authenticated, service_role;
comment on function public.akun_terkunci_sampai() is
  'The one instant a suspended or closed account''s Auth users are locked until (auth.users.banned_until): a fixed '
  'far-future time Auth can read. Written only by akun_kunci; reinstatement clears it.';

-- every session ends and sign-in is refused (the Auth users locked until akun_terkunci_sampai()); or both undone
create or replace function public.akun_kunci(p_person uuid, p_kunci boolean)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare a record; n int := 0;
begin
  for a in select ac.auth_user_id from public.accounts ac where ac.person_id = p_person and ac.auth_user_id is not null loop
    update auth.users set banned_until = case when p_kunci then public.akun_terkunci_sampai() else null end where id = a.auth_user_id;
    if p_kunci then n := n + public.sesi_akhiri_orang(a.auth_user_id, 'DITANGGUHKAN'); end if;
  end loop;
  return n;
end $$;
revoke all on function public.akun_kunci(uuid, boolean) from public, anon, authenticated, service_role;

-- PIN RECOVERY (the coordinator's binding correction: the same answer as a wrong PIN, per method): 20261021100000's
-- recovery_attempt with one addition, marked: the PIN of a person who is suspended or closed (an anonymised person is
-- closed) never matches, so the answer is WRONG and the ladder counts it, exactly as for a wrong PIN; no grant is given
-- and nothing distinguishes it. PIN_DITANGGUHKAN (the ladder's own stop after too many wrong PINs) is unchanged.
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
  -- AUTH CORRECTION (owner, 11 Nov): a suspended, closed or anonymised person's PIN is the ordinary mismatch, counted on
  -- the ladder like any wrong PIN, after the same hashing work; recovery never opens a locked account
  v_ok := v_ok and not public.orang_ditangguhkan(v_person);

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
revoke all on function public.recovery_attempt(text, text) from public, anon, authenticated;
grant execute on function public.recovery_attempt(text, text) to service_role;

-- accounts already locked with the old value, rewritten to the instant (none, some, or run again: the same end state)
update auth.users set banned_until = public.akun_terkunci_sampai() where banned_until = 'infinity'::timestamptz;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only.
-- ---------------------------------------------------------------------------
do $$
declare v_src text := (select prosrc from pg_proc where oid = 'public.akun_kunci(uuid,boolean)'::regprocedure);
begin
  if not isfinite(public.akun_terkunci_sampai()) or public.akun_terkunci_sampai() < timestamptz '2900-01-01 00:00:00+00' then
    raise exception 'auth correction: the lock''s instant is not a finite far-future time';
  end if;
  if position('public.akun_terkunci_sampai()' in v_src) = 0 or position('infinity' in v_src) > 0 then
    raise exception 'auth correction: akun_kunci does not lock with the one named instant';
  end if;
  if exists (select 1 from auth.users u where u.banned_until = 'infinity'::timestamptz or u.banned_until = '-infinity'::timestamptz) then
    raise exception 'auth correction: an account is still locked with a value Auth cannot read';
  end if;
  if has_function_privilege('authenticated', 'public.akun_terkunci_sampai()'::regprocedure, 'execute')
     or has_function_privilege('anon', 'public.akun_terkunci_sampai()'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.akun_kunci(uuid, boolean)'::regprocedure, 'execute') then
    raise exception 'auth correction: an internal helper is callable by a client';
  end if;
  if position('not public.orang_ditangguhkan(v_person)' in
              (select prosrc from pg_proc where oid = 'public.recovery_attempt(text,text)'::regprocedure)) = 0 then
    raise exception 'auth correction: PIN recovery opens a suspended or closed account';
  end if;
  if has_function_privilege('anon', 'public.recovery_attempt(text,text)', 'execute')
     or has_function_privilege('authenticated', 'public.recovery_attempt(text,text)', 'execute') then
    raise exception 'auth correction: a client can reach PIN recovery around its route';
  end if;
  raise notice 'auth correction verified: an account is locked until one instant Auth can read; none is left on the old value';
end $$;

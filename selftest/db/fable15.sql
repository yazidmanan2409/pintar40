-- FABLE-15 database suite: BOB-12 (b), a card waits after failures
-- (identity Gate 1, D-058).
--
-- Ordering: depends on fable01.sql (role switches) and fable11.sql (f11_note,
-- f11_raised). Never applied as a migration; never present in production.
--
--   F15-P01  the rule: 5 attempts within 15 minutes are free, then each waits
--            30 s after the one before, then 60, 120, 240, and never more than
--            300 s; an attempt older than 15 minutes is forgotten; a waiting
--            attempt is not recorded; two cards never share a count
--   F15-P02  the settlement: a sign-in clears the card's record, an attempt
--            Auth never judged is taken back, a wrong PIN stays counted, and
--            only a card key or a known outcome is accepted
--   F15-N01  the storage: RLS on, no policies, no grants on the table; the two
--            functions are service_role's only (anon and authenticated execute
--            neither, and neither is a client RPC); the table holds keys, never
--            a card number
--   (F15-C01, 20 attempts on one card at once, is driven from run.ts.)
--
-- Past attempts are placed by writing the card's row directly as the owner,
-- so the waits are measured without waiting.
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f11_note(jsonb, text, text)') is null
     or to_regprocedure('selftest.f11_raised(text)') is null then
    raise exception 'apply fable01.sql and fable11.sql before fable15.sql';
  end if;
end $$;

-- One attempt as the sign-in route makes it (service_role), back to the owner after.
create or replace function selftest.f15_coba(p_kunci text) returns integer
language plpgsql set search_path = public, pg_temp as $$
declare v int;
begin
  set local role service_role;
  v := public.card_signin_attempt(p_kunci);
  reset role;
  return v;
exception when others then
  reset role;
  raise;
end $$;

create or replace function selftest.f15_selesai(p_kunci text, p_hasil text) returns void
language plpgsql set search_path = public, pg_temp as $$
begin
  set local role service_role;
  perform public.card_signin_settle(p_kunci, p_hasil);
  reset role;
exception when others then
  reset role;
  raise;
end $$;

-- A card's attempts, placed in the past: `lalu` seconds ago each.
create or replace function selftest.f15_letakkan(p_kunci text, p_lalu int[]) returns void
language sql set search_path = public, pg_temp as $$
  insert into public.card_signin_cooldowns (kunci, percobaan, diperbarui)
  select p_kunci, coalesce(array(select clock_timestamp() - make_interval(secs => s) from unnest(p_lalu) s order by s desc), '{}'),
         clock_timestamp()
  on conflict (kunci) do update set percobaan = excluded.percobaan, diperbarui = excluded.diperbarui
$$;

create or replace function selftest.f15_jumlah(p_kunci text) returns int
language sql stable set search_path = public, pg_temp as $$
  select coalesce((select cardinality(percobaan) from public.card_signin_cooldowns where kunci = p_kunci), -1)
$$;

create or replace function selftest.f15_kunci(p text) returns text
language sql immutable as $$ select encode(sha256(convert_to('f15|' || p, 'UTF8')), 'hex') $$;

revoke all on function selftest.f15_coba(text), selftest.f15_selesai(text, text),
  selftest.f15_letakkan(text, int[]), selftest.f15_jumlah(text), selftest.f15_kunci(text) from public;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable15()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v int; w int; n int; v_tag text; v_err jsonb; k text; k2 text; i int;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  m_refused int := 0; m_p02 int := 0;
  -- (placed attempts, seconds ago) → the wait the next attempt must meet, give or take 2 s
  v_tangga constant jsonb := '[
    {"lalu": [240, 200, 150, 100, 1],                          "tunggu": 29},
    {"lalu": [240, 200, 150, 100, 50, 1],                      "tunggu": 59},
    {"lalu": [400, 300, 240, 200, 150, 100, 1],                "tunggu": 119},
    {"lalu": [600, 400, 300, 240, 200, 150, 100, 1],           "tunggu": 239},
    {"lalu": [800, 600, 400, 300, 240, 200, 150, 100, 1],      "tunggu": 299},
    {"lalu": [890, 850, 800, 700, 600, 500, 400, 300, 200, 100, 50, 1], "tunggu": 299}
  ]'::jsonb;
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F15-P01  THE RULE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      k := selftest.f15_kunci('p01-' || v_tag);
      -- five free, then the sixth waits about 30 s and is not recorded
      for i in 1..5 loop
        v := selftest.f15_coba(k);
        if v <> 0 then
          v_probs := selftest.f11_note(v_probs, 'F15-P01', format('attempt %s of a fresh card was made to wait %s s; the first 5 are free', i, v));
        end if;
      end loop;
      v := selftest.f15_coba(k);
      if v < 28 or v > 30 then
        v_probs := selftest.f11_note(v_probs, 'F15-P01', format('the 6th attempt within 15 minutes waits %s s, expected 30', v));
      end if;
      if selftest.f15_jumlah(k) <> 5 then
        v_probs := selftest.f11_note(v_probs, 'F15-P01', format('a waiting attempt was recorded: %s attempts kept, expected 5', selftest.f15_jumlah(k)));
      end if;
      -- the ladder, and its cap
      for r in select value as t from jsonb_array_elements(v_tangga) loop
        perform selftest.f15_letakkan(k, array(select jsonb_array_elements_text(r.t -> 'lalu')::int));
        v := selftest.f15_coba(k);
        w := (r.t ->> 'tunggu')::int;
        if v < w - 2 or v > w + 1 then
          v_probs := selftest.f11_note(v_probs, 'F15-P01', format('after %s attempts in the window (the last 1 s ago) the next waits %s s, expected %s',
            jsonb_array_length(r.t -> 'lalu'), v, w + 1));
        end if;
      end loop;
      -- a wait served: the next attempt goes ahead and the one after waits the next step
      perform selftest.f15_letakkan(k, array[240, 200, 150, 100, 31]);
      v := selftest.f15_coba(k);
      w := selftest.f15_coba(k);
      if v <> 0 or w < 58 or w > 60 then
        v_probs := selftest.f11_note(v_probs, 'F15-P01', format('the 6th attempt 31 s after the 5th was answered %s and the 7th %s; expected 0, then 60', v, w));
      end if;
      -- forgotten after 15 minutes: five 16-minute-old attempts count for nothing
      perform selftest.f15_letakkan(k, array[1000, 990, 980, 970, 960]);
      v := selftest.f15_coba(k);
      if v <> 0 or selftest.f15_jumlah(k) <> 1 then
        v_probs := selftest.f11_note(v_probs, 'F15-P01', format('five attempts 16 minutes old still counted: answered %s, %s kept', v, selftest.f15_jumlah(k)));
      end if;
      perform selftest.f15_letakkan(k, array[1000, 990, 980, 30, 20]);
      v := selftest.f15_coba(k);
      if v <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F15-P01', format('two recent attempts beside three forgotten ones made the card wait %s s', v));
      end if;
      -- never a lock: even twelve attempts in the window wait at most 300 s
      perform selftest.f15_letakkan(k, array[890, 850, 800, 700, 600, 500, 400, 350, 340, 330, 320, 301]);
      v := selftest.f15_coba(k);
      if v <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F15-P01', format('a card whose last attempt was 301 s ago still waits %s s: the cap is 300 s', v));
      end if;
      -- another card is its own count
      k2 := selftest.f15_kunci('p01b-' || v_tag);
      if selftest.f15_coba(k2) <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F15-P01', 'a card nobody had tried waits because another card did');
      end if;
    exception when others then
      v_probs := selftest.f11_note(v_probs, 'F15-P01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F15-P02  THE SETTLEMENT
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      k := selftest.f15_kunci('p02-' || v_tag);
      for i in 1..5 loop perform selftest.f15_coba(k); end loop;
      perform selftest.f15_selesai(k, 'MASUK');
      if selftest.f15_jumlah(k) <> -1 then
        v_probs := selftest.f11_note(v_probs, 'F15-P02', 'a sign-in did not clear the card''s record');
      end if;
      if selftest.f15_coba(k) <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F15-P02', 'a card that signed in still waits');
      end if;
      perform selftest.f15_selesai(k, 'MASUK');
      -- Auth never judged the PIN: the attempt is taken back, and a busy morning never locks a card
      for i in 1..8 loop
        v := selftest.f15_coba(k);
        perform selftest.f15_selesai(k, 'TIDAK_DINILAI');
        if v <> 0 then
          v_probs := selftest.f11_note(v_probs, 'F15-P02', format('attempt %s, each one unjudged by Auth and taken back, waited %s s', i + 1, v));
          exit;
        end if;
      end loop;
      if selftest.f15_jumlah(k) <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F15-P02', format('unjudged attempts were kept: %s', selftest.f15_jumlah(k)));
      end if;
      -- repeated unavailability never lets more than 5 JUDGED attempts through in
      -- the window: two unjudged (taken back) around every judged one, until the card waits
      perform selftest.f15_selesai(k, 'MASUK');
      n := 0; w := 0;
      for i in 1..60 loop
        v := selftest.f15_coba(k);
        exit when v > 0;
        if i % 3 = 0 then n := n + 1; else perform selftest.f15_selesai(k, 'TIDAK_DINILAI'); w := w + 1; end if;
      end loop;
      if n <> 5 or v <= 0 then
        v_probs := selftest.f11_note(v_probs, 'F15-P02', format('with %s unjudged attempts taken back between them, %s judged attempt(s) went ahead before the card waited %s s; exactly 5 may',
          w, n, v));
      end if;
      perform selftest.f15_selesai(k, 'MASUK');
      -- a wrong PIN stays counted: nothing is settled for it
      for i in 1..3 loop perform selftest.f15_coba(k); end loop;
      if selftest.f15_jumlah(k) <> 3 then
        v_probs := selftest.f11_note(v_probs, 'F15-P02', format('three non-matches left %s attempts counted', selftest.f15_jumlah(k)));
      end if;
      -- only a card key, only a known outcome
      foreach k2 in array array['7001', upper(k), k || '0', '', 'kartu-7001'] loop
        v_err := selftest.f11_raised(format('select selftest.f15_coba(%L)', k2));
        if v_err is null or v_err ->> 'code' <> '22023' then
          v_probs := selftest.f11_note(v_probs, 'F15-P02', format('%L was accepted as a card key (%s)', k2, coalesce(v_err ->> 'code', 'no error')));
        else m_refused := m_refused + 1; end if;
      end loop;
      v_err := selftest.f11_raised(format('select selftest.f15_coba(null)'));
      if v_err is null then v_probs := selftest.f11_note(v_probs, 'F15-P02', 'no key was accepted'); else m_refused := m_refused + 1; end if;
      v_err := selftest.f11_raised(format('select selftest.f15_selesai(%L, %L)', k, 'BERSIHKAN'));
      if v_err is null or v_err ->> 'code' <> '22023' then
        v_probs := selftest.f11_note(v_probs, 'F15-P02', 'an unknown outcome was accepted by the settlement');
      else m_refused := m_refused + 1; end if;
      if selftest.f15_jumlah(k) <> 3 then
        v_probs := selftest.f11_note(v_probs, 'F15-P02', 'a refused settlement changed the card''s record');
      end if;
      m_p02 := m_refused;
    exception when others then
      v_probs := selftest.f11_note(v_probs, 'F15-P02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F15-N01  THE STORAGE
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if not coalesce((select relrowsecurity from pg_class where oid = 'public.card_signin_cooldowns'::regclass), false) then
        v_probs := selftest.f11_note(v_probs, 'F15-N01', 'card_signin_cooldowns has no RLS');
      end if;
      select count(*) into n from pg_policy where polrelid = 'public.card_signin_cooldowns'::regclass;
      if n > 0 then v_probs := selftest.f11_note(v_probs, 'F15-N01', format('card_signin_cooldowns has %s polic(ies)', n)); end if;
      for r in select unnest(array['anon', 'authenticated', 'service_role']) as peran loop
        if has_table_privilege(r.peran, 'public.card_signin_cooldowns', 'select')
           or has_table_privilege(r.peran, 'public.card_signin_cooldowns', 'insert')
           or has_table_privilege(r.peran, 'public.card_signin_cooldowns', 'update')
           or has_table_privilege(r.peran, 'public.card_signin_cooldowns', 'delete')
           or has_table_privilege(r.peran, 'public.card_signin_cooldowns', 'truncate') then
          v_probs := selftest.f11_note(v_probs, 'F15-N01', format('%s holds a grant on card_signin_cooldowns', r.peran));
        end if;
      end loop;
      for r in select unnest(array['anon', 'authenticated', 'public']) as peran loop
        if (r.peran <> 'public' and (has_function_privilege(r.peran, 'public.card_signin_attempt(text)', 'execute')
                                  or has_function_privilege(r.peran, 'public.card_signin_settle(text, text)', 'execute')))
           or (r.peran = 'public' and exists (
                select 1 from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                 where p.oid in ('public.card_signin_attempt(text)'::regprocedure, 'public.card_signin_settle(text, text)'::regprocedure)
                   and a.grantee = 0 and a.privilege_type = 'EXECUTE')) then
          v_probs := selftest.f11_note(v_probs, 'F15-N01', format('%s can call the card cooldown', r.peran));
        end if;
      end loop;
      if not has_function_privilege('service_role', 'public.card_signin_attempt(text)', 'execute')
         or not has_function_privilege('service_role', 'public.card_signin_settle(text, text)', 'execute') then
        v_probs := selftest.f11_note(v_probs, 'F15-N01', 'the sign-in route (service_role) cannot call the card cooldown');
      end if;
      if exists (select 1 from public.client_rpc_registry where function_name in ('card_signin_attempt', 'card_signin_settle')) then
        v_probs := selftest.f11_note(v_probs, 'F15-N01', 'the card cooldown is registered as a client RPC');
      end if;
      -- a signed-in client and a visitor are refused both functions, by the database
      k := selftest.f15_kunci('n01-' || v_tag);
      for r in select * from (values ('authenticated', format('select public.card_signin_attempt(%L)', k)),
                                     ('authenticated', format('select public.card_signin_settle(%L, %L)', k, 'MASUK')),
                                     ('anon', format('select public.card_signin_attempt(%L)', k)),
                                     ('anon', format('select public.card_signin_settle(%L, %L)', k, 'TIDAK_DINILAI'))) t(peran, q) loop
        if r.peran = 'authenticated' then
          perform selftest.as_user((select u.email from auth.users u order by u.created_at limit 1));
        else
          perform selftest.as_anon();
        end if;
        v_err := selftest.f11_raised(r.q);
        perform selftest.as_owner();
        if v_err is null or v_err ->> 'code' <> '42501' then
          v_probs := selftest.f11_note(v_probs, 'F15-N01', format('%s ran %s', case r.peran when 'anon' then 'a visitor' else 'a signed-in client' end,
            substring(r.q from 'card_signin_[a-z]+')));
        else m_refused := m_refused + 1; end if;
      end loop;
      perform selftest.as_anon();
      v_err := selftest.f11_raised('select count(*) from public.card_signin_cooldowns');
      perform selftest.as_owner();
      if v_err is null then
        v_probs := selftest.f11_note(v_probs, 'F15-N01', 'a visitor read card_signin_cooldowns');
      else m_refused := m_refused + 1; end if;
      -- the route is a declared public surface, and so is the handler it is rewritten to
      if not exists (select 1 from public.public_surface_registry where surface = 'card_signin' and kind = 'ROUTE' and object = '/masuk/kartu')
         or not exists (select 1 from public.public_surface_registry where kind = 'ENDPOINT' and object = '/api/masuk/kartu' and parent = 'card_signin') then
        v_probs := selftest.f11_note(v_probs, 'F15-N01', 'the card sign-in route or its rewrite target is not in public_surface_registry');
      end if;
      if not (select a.ok from public.assert_public_surface() a) then
        v_probs := selftest.f11_note(v_probs, 'F15-N01', 'assert_public_surface fails: ' || (select left(a.detail, 150) from public.assert_public_surface() a));
      end if;
      -- a card number is not a key
      v_err := selftest.f11_raised($q$insert into public.card_signin_cooldowns (kunci) values ('7001')$q$);
      if v_err is null or v_err ->> 'code' <> '23514' then
        v_probs := selftest.f11_note(v_probs, 'F15-N01', 'a card number was stored as a key');
      else m_refused := m_refused + 1; end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F15-N01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    raise exception 'F15-ROLLBACK';
  exception when others then
    if sqlerrm <> 'F15-ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in
    select * from unnest(
      array['F15-P01', 'F15-P02', 'F15-N01'],
      array['BOB-12 (b) -- a card waits after failures, never locked',
            'BOB-12 (b) -- a sign-in clears it; an attempt Auth never judged counts for nothing',
            'BOB-12 (b) -- the cooldown is the sign-in route''s alone'],
      array[
        'a fresh card''s first 5 attempts in 15 minutes go ahead and the 6th waits 30 s, unrecorded; after 5, 6, 7, 8, 9 and 12 '
          || 'attempts the next waits 30, 60, 120, 240, 300 and 300 s after the last; a wait served lets one attempt through and the '
          || 'next waits the next step; attempts older than 15 minutes are forgotten; 301 s after the last attempt a card is never '
          || 'held; and one card''s count is not another''s',
        format('a sign-in clears the card''s record and the card goes ahead; with two unjudged attempts taken back around each judged one, exactly 5 judged attempts go ahead before the card waits; eight attempts each unjudged by Auth and taken back '
          || 'never wait and leave nothing counted; three non-matches stay counted; %s refusal(s): a card number, an upper-case, '
          || 'long or empty key, no key and an unknown outcome are refused 22023 and change nothing', m_p02),
        format('card_signin_cooldowns has RLS on, no policies and no grant for anon, authenticated or service_role; card_signin_attempt '
          || 'and card_signin_settle execute for service_role only, not for public, anon or authenticated, and are no client RPC; a '
          || 'signed-in client and a visitor are each refused both functions (42501) and a visitor cannot read the table; the route and its rewrite target are declared public surfaces and assert_public_surface holds; a card number is refused as a key (23514): %s refusal(s)', m_refused - m_p02)
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false; detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F15-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-15 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable15() from public;
grant execute on function selftest.run_fable15() to authenticated;

-- FABLE-17 database suite: BOB-25, PINTAR's own email (Gate 2E, D-057(a)):
-- the send log and the send limits behind src/app/api/_email/.
--
-- Ordering: depends on fable01.sql (role switches) only. Never applied as a
-- migration; never present in production.
--
--   F17-L01  the limits, as email_send_reserve applies them: one of a kind to
--            one address a minute; six to one address an hour; the global
--            hourly ceiling; a refusal is logged and itself counts for nothing;
--            a send the host refused still counts, and a window that has passed
--            counts for nothing, so asking again later works
--   F17-L02  the log's rules: a send settles once, only as SENT, REFUSED_BY_HOST
--            or FAILED; the log takes a SHA-256, never an address; it has no
--            column that could hold an address, a code, a PIN, a password or
--            the message
--   F17-N01  access: RLS on, no policy; no client role reads, writes, reserves
--            or settles; service_role reserves and settles
--   (F17-C01, concurrent reservations at a limit's edge, is driven from run.ts.)
--
-- EVERY ROW IS ROLLED BACK. The suite works in its own subtransaction, notes
-- problems per id, raises a sentinel to undo everything, then emits.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_anon()') is null or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply fable01.sql before fable17.sql';
  end if;
end $$;

create or replace function selftest.f17_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
revoke all on function selftest.f17_note(jsonb, text, text) from public;

-- a recipient hash no real address will ever have in this run
create or replace function selftest.f17_hash(p_tag text) returns text
language sql immutable as $$ select encode(sha256(convert_to('f17-' || p_tag || '@local.invalid', 'UTF8')), 'hex') $$;
revoke all on function selftest.f17_hash(text) from public;

create or replace function selftest.f17_reserve(p_kind text, p_hash text) returns jsonb
language sql as $$ select public.email_send_reserve(p_kind, p_hash) $$;
revoke all on function selftest.f17_reserve(text, text) from public;

create or replace function selftest.run_fable17()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_tag text; h text; h2 text; r jsonb; n int; v text; i int;
  k text;
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 10);
    -- the global window starts empty, so every count below is this suite's own
    delete from public.email_send_log;

    -- ─────────────────────────────── F17-L01: the limits
    h := selftest.f17_hash(v_tag || '-a');
    r := selftest.f17_reserve('KODE_AKTIVASI', h);
    if (r ->> 'allowed')::boolean is not true then
      v_probs := selftest.f17_note(v_probs, 'F17-L01', format('a first send to an address was refused: %s', r));
    end if;
    perform public.email_send_settle((r ->> 'log_id')::uuid, 'SENT', 250);
    r := selftest.f17_reserve('KODE_AKTIVASI', h);
    if (r ->> 'allowed')::boolean or r ->> 'limit_scope' is distinct from 'ADDRESS_KIND' then
      v_probs := selftest.f17_note(v_probs, 'F17-L01', format('a second code to the same address within a minute was answered %s, not refused by ADDRESS_KIND', r));
    end if;
    select count(*) into n from public.email_send_log
     where recipient_hash = h and outcome = 'REFUSED_LIMIT' and limit_scope = 'ADDRESS_KIND' and settled_at is not null;
    if n <> 1 then v_probs := selftest.f17_note(v_probs, 'F17-L01', format('the refusal left %s REFUSED_LIMIT row(s), expected 1', n)); end if;
    -- a refusal counts for nothing: a different kind still goes
    r := selftest.f17_reserve('PASSWORD_DIUBAH', h);
    if (r ->> 'allowed')::boolean is not true then
      v_probs := selftest.f17_note(v_probs, 'F17-L01', format('another kind to the same address was refused after one send and one refusal: %s', r));
    end if;
    perform public.email_send_settle((r ->> 'log_id')::uuid, 'SENT', 250);
    -- the minute passes: the same kind goes again
    update public.email_send_log set requested_at = requested_at - interval '61 seconds' where recipient_hash = h;
    r := selftest.f17_reserve('KODE_AKTIVASI', h);
    if (r ->> 'allowed')::boolean is not true then
      v_probs := selftest.f17_note(v_probs, 'F17-L01', format('once the minute had passed the same kind was still refused: %s', r));
    end if;
    perform public.email_send_settle((r ->> 'log_id')::uuid, 'SENT', 250);

    -- six to one address an hour, whatever the kind; the seventh is refused
    h2 := selftest.f17_hash(v_tag || '-b');
    i := 0;
    foreach k in array array['KODE_AKTIVASI','KODE_ULANG','PEMULIHAN_PASSWORD','PASSWORD_DIUBAH','KARTU_DIGITAL','PEMBERITAHUAN_KEAMANAN'] loop
      r := selftest.f17_reserve(k, h2);
      if (r ->> 'allowed')::boolean then
        i := i + 1;
        -- a send the host refused still counts: half of them are settled so
        perform public.email_send_settle((r ->> 'log_id')::uuid, case when i % 2 = 0 then 'REFUSED_BY_HOST' else 'SENT' end,
                                         case when i % 2 = 0 then 451 else 250 end);
      end if;
    end loop;
    if i <> 6 then v_probs := selftest.f17_note(v_probs, 'F17-L01', format('only %s of six different kinds to one address went', i)); end if;
    r := selftest.f17_reserve('UJI_PENGIRIMAN', h2);
    if (r ->> 'allowed')::boolean or r ->> 'limit_scope' is distinct from 'ADDRESS' then
      v_probs := selftest.f17_note(v_probs, 'F17-L01', format('a seventh email to one address within the hour, three of them refused by the host, was answered %s, not refused by ADDRESS', r));
    end if;
    -- the hour passes: the address is free again
    update public.email_send_log set requested_at = requested_at - interval '3601 seconds' where recipient_hash = h2;
    r := selftest.f17_reserve('UJI_PENGIRIMAN', h2);
    if (r ->> 'allowed')::boolean is not true then
      v_probs := selftest.f17_note(v_probs, 'F17-L01', format('once the hour had passed the address was still refused: %s', r));
    end if;
    perform public.email_send_settle((r ->> 'log_id')::uuid, 'SENT', 250);

    -- the global ceiling: the hour holds its maximum, so the next address is refused
    select max_sends into n from public.email_send_limits where scope = 'GLOBAL';
    insert into public.email_send_log (kind, recipient_hash, outcome, smtp_code, settled_at)
    select 'KODE_AKTIVASI', selftest.f17_hash(v_tag || '-g' || g), 'SENT', 250, now()
      from generate_series(1, n - (select count(*)::int from public.email_send_log
                                     where outcome <> 'REFUSED_LIMIT' and requested_at > now() - interval '3600 seconds')) g;
    r := selftest.f17_reserve('KODE_AKTIVASI', selftest.f17_hash(v_tag || '-baru'));
    if (r ->> 'allowed')::boolean or r ->> 'limit_scope' is distinct from 'GLOBAL' then
      v_probs := selftest.f17_note(v_probs, 'F17-L01', format('with the hour at the global maximum of %s a new address was answered %s, not refused by GLOBAL', n, r));
    end if;
    -- refusals do not fill the ceiling: after them, one freed slot is one send
    delete from public.email_send_log d
     where d.id = (select x.id from public.email_send_log x where x.outcome = 'SENT'
                     and x.requested_at > now() - interval '3600 seconds' order by x.requested_at limit 1);
    r := selftest.f17_reserve('KODE_AKTIVASI', selftest.f17_hash(v_tag || '-baru2'));
    if (r ->> 'allowed')::boolean is not true then
      v_probs := selftest.f17_note(v_probs, 'F17-L01', format('one slot under the ceiling, after refusals, was still refused: %s', r));
    end if;

    -- ─────────────────────────────── F17-L02: the log's rules
    begin
      perform public.email_send_settle((r ->> 'log_id')::uuid, 'SENT', 250);
      perform public.email_send_settle((r ->> 'log_id')::uuid, 'FAILED', null);
      v_probs := selftest.f17_note(v_probs, 'F17-L02', 'a settled send was settled a second time');
    exception when others then null;
    end;
    begin
      r := selftest.f17_reserve('KODE_ULANG', selftest.f17_hash(v_tag || '-s'));
      perform public.email_send_settle((r ->> 'log_id')::uuid, 'PENDING', null);
      v_probs := selftest.f17_note(v_probs, 'F17-L02', 'a send was settled back to PENDING');
    exception when others then null;
    end;
    begin
      perform public.email_send_settle((r ->> 'log_id')::uuid, 'REFUSED_LIMIT', null);
      v_probs := selftest.f17_note(v_probs, 'F17-L02', 'a send the host was asked for was settled as a limit refusal');
    exception when others then null;
    end;
    begin
      perform public.email_send_reserve('KODE_AKTIVASI', 'guru@sekolah.sch.id');
      v_probs := selftest.f17_note(v_probs, 'F17-L02', 'the log took an address instead of a SHA-256');
    exception when others then null;
    end;
    begin
      perform public.email_send_reserve('KODE_AKTIVASI', upper(selftest.f17_hash('x')));
      v_probs := selftest.f17_note(v_probs, 'F17-L02', 'the log took a hash that is not lower-case hexadecimal SHA-256');
    exception when others then null;
    end;
    begin
      perform public.email_send_reserve('UNDANGAN', selftest.f17_hash(v_tag || '-u'));
      v_probs := selftest.f17_note(v_probs, 'F17-L02', 'the log took a kind of email that is not one of the seven');
    exception when others then null;
    end;
    select string_agg(column_name, ', ' order by column_name) into v from information_schema.columns
     where table_schema = 'public' and table_name = 'email_send_log';
    if v is distinct from 'id, kind, limit_scope, outcome, recipient_hash, requested_at, settled_at, smtp_code' then
      v_probs := selftest.f17_note(v_probs, 'F17-L02', format('the send log''s columns are [%s]: one more column could carry an address, a code, a PIN, a password or the message', v));
    end if;

    -- ─────────────────────────────── F17-N01: access
    select count(*) into n from pg_class c join pg_namespace s on s.oid = c.relnamespace
     where s.nspname = 'public' and c.relname in ('email_send_log', 'email_send_limits') and c.relrowsecurity;
    if n <> 2 then v_probs := selftest.f17_note(v_probs, 'F17-N01', format('%s of the two email tables have row-level security', n)); end if;
    select count(*) into n from pg_policies where schemaname = 'public' and tablename in ('email_send_log', 'email_send_limits');
    if n <> 0 then v_probs := selftest.f17_note(v_probs, 'F17-N01', format('%s policy(ies) on the email tables; there should be none', n)); end if;
    foreach k in array array['anon', 'authenticated'] loop
      if has_table_privilege(k, 'public.email_send_log', 'select') or has_table_privilege(k, 'public.email_send_log', 'insert')
         or has_table_privilege(k, 'public.email_send_log', 'update') or has_table_privilege(k, 'public.email_send_limits', 'select')
         or has_table_privilege(k, 'public.email_send_limits', 'update') then
        v_probs := selftest.f17_note(v_probs, 'F17-N01', format('%s holds a privilege on an email table', k));
      end if;
      if has_function_privilege(k, 'public.email_send_reserve(text,text)', 'execute')
         or has_function_privilege(k, 'public.email_send_settle(uuid,text,integer)', 'execute') then
        v_probs := selftest.f17_note(v_probs, 'F17-N01', format('%s may reserve or settle a send', k));
      end if;
    end loop;
    if not has_function_privilege('service_role', 'public.email_send_reserve(text,text)', 'execute')
       or not has_function_privilege('service_role', 'public.email_send_settle(uuid,text,integer)', 'execute') then
      v_probs := selftest.f17_note(v_probs, 'F17-N01', 'the service role may not reserve or settle a send: the module could send nothing');
    end if;
    -- as a signed-in person and as a stranger, through the privileges themselves.
    -- The hash is computed first and findings are noted only as the owner, so
    -- the only thing that can be refused inside is the email function itself.
    h := selftest.f17_hash(v_tag || '-x');
    perform selftest.as_user('sysadmin@synthetic.pintar.test');
    begin perform public.email_send_reserve('KODE_AKTIVASI', h); k := 'reserved';
    exception when insufficient_privilege then k := null; end;
    begin select count(*) into n from public.email_send_log; v := 'read';
    exception when insufficient_privilege then v := null; end;
    perform selftest.as_owner();
    perform selftest.as_anon();
    begin perform public.email_send_reserve('KODE_AKTIVASI', h); i := 1;
    exception when insufficient_privilege then i := 0; end;
    perform selftest.as_owner();
    if k is not null then v_probs := selftest.f17_note(v_probs, 'F17-N01', 'a signed-in platform admin reserved a send directly'); end if;
    if v is not null then v_probs := selftest.f17_note(v_probs, 'F17-N01', 'a signed-in platform admin read the send log directly'); end if;
    if i <> 0 then v_probs := selftest.f17_note(v_probs, 'F17-N01', 'a stranger reserved a send'); end if;

    raise exception 'F17_UNDO';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F17_UNDO' then v_fatal := 'the probe itself failed: ' || left(sqlerrm, 240); end if;
  end;

  for id, area in values
    ('F17-L01', 'BOB-25 -- the send limits'),
    ('F17-L02', 'BOB-25 -- the send log keeps nothing it should not'),
    ('F17-N01', 'BOB-25 -- only the sending module reaches the log') loop
    if v_fatal <> '' then ok := false; detail := v_fatal;
    elsif v_probs ? id then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> id),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> id) x));
    else
      ok := true;
      detail := case id
        when 'F17-L01' then 'one email of a kind to one address a minute, six to one address an hour and the global hourly ceiling are each '
          || 'refused by their own scope, logged as REFUSED_LIMIT; a refusal counts for nothing and a send the host refused counts; '
          || 'once a window has passed the same address goes again. Every row rolled back'
        when 'F17-L02' then 'a send settles once, only as SENT, REFUSED_BY_HOST or FAILED; the log takes a lower-case SHA-256 and one of the '
          || 'seven kinds, never an address; its eight columns hold no address, code, PIN, password or message'
        else 'both email tables have RLS and no policy; anon and authenticated hold no privilege on them and may neither reserve nor '
          || 'settle, refused by the privileges themselves as a signed-in platform admin and as a stranger; service_role reserves and settles'
      end;
    end if;
    return next;
  end loop;
  id := 'F17-DONE'; area := 'suite'; ok := true; detail := 'FABLE-17 suite complete';
  return next;
end $$;
revoke all on function selftest.run_fable17() from public;

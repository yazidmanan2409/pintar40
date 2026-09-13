-- 0045 — forward-only repair: two assertions would have raised instead of
-- reporting, on the one code path nobody had ever executed.
--
-- WHAT WAS WRONG. `text[] || 'a literal'` does not append. The literal is
-- `unknown`, so Postgres resolves the operator to `array_cat(text[], text[])`
-- and tries to parse the string as an array literal, which fails with
-- `malformed array literal`. Appending works only when the right operand is
-- typed -- which it is whenever the message is built as `('prefix: ' || bad)`,
-- because `bad` is `text`. Every message in these assertions was built that
-- way except a handful of bare literals with nothing to concatenate.
--
-- WHERE IT SURVIVED. `assert_telemetry_write_only()` (0033) and
-- `assert_evidence_consumer_boundary()` (0037). In both, the affected line is
-- reachable only when the assertion is about to FAIL -- a client role holding
-- USAGE on telemetry; `assessment_results.session_id` becoming nullable. Those
-- conditions have never been true, so the line has never run, in any migration,
-- any CI run or any selftest. It was found by writing the same shape a third
-- time in FABLE-04 and having the new one fail immediately, which is the only
-- reason it is being fixed now rather than during an incident.
--
-- WHY IT MATTERS LESS THAN IT LOOKS, AND STILL MATTERS. The gate would still
-- have gone red: an exception fails a build as surely as `ok = false`. What
-- would have been lost is the DIAGNOSIS -- `platform_schema_lint()` would have
-- thrown `malformed array literal` instead of reporting which boundary broke,
-- and F01-T13 would have failed with a parser error pointing at the wrong
-- thing. An assertion whose failure path has never executed is not an assertion
-- that works; it is an assertion nobody has tested. That is the 0032 lesson
-- again, in the assertions written to enforce the 0032 lesson.
--
-- Both functions are replaced whole with only those lines changed, and the
-- verification block below EXECUTES each failure path -- by planting the exact
-- condition, reading the result, and restoring -- rather than inspecting the
-- source for a cast.

create or replace function public.assert_telemetry_write_only()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}';
begin
  select string_agg(distinct dep.relname, ', ') into bad
    from pg_depend d
    join pg_rewrite rw on rw.oid = d.objid
    join pg_class dep on dep.oid = rw.ev_class
    join pg_class ref on ref.oid = d.refobjid
    join pg_namespace rns on rns.oid = ref.relnamespace
    join pg_namespace dns on dns.oid = dep.relnamespace
   where rns.nspname = 'telemetry' and dns.nspname = 'public';
  if bad is not null then problems := problems || ('view(s) in public read telemetry: ' || bad); end if;

  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind = 'f'
     and p.proname <> 'enforce_observation_write'
     and pg_get_functiondef(p.oid) ~* '(\yfrom\s+telemetry\.|\yjoin\s+telemetry\.|\yupdate\s+telemetry\.|\ydelete\s+from\s+telemetry\.)';
  if bad is not null then problems := problems || ('function(s) in public read telemetry: ' || bad); end if;

  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prokind = 'f'
     and pg_get_functiondef(p.oid) ~* '\yexecute\y'
     and pg_get_functiondef(p.oid) ~* '\ytelemetry\.';
  if bad is not null then problems := problems || ('function(s) reach telemetry dynamically: ' || bad); end if;

  select string_agg(g.table_name || '->' || g.grantee, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'telemetry' and g.grantee in ('anon','authenticated');
  if bad is not null then problems := problems || ('client grant on telemetry: ' || bad); end if;
  if has_schema_privilege('anon','telemetry','USAGE')
     or has_schema_privilege('authenticated','telemetry','USAGE') then
    -- THE REPAIRED LINE. Was a bare literal, which array_cat then tried to
    -- parse as an array and failed on.
    problems := problems || 'a client role holds USAGE on the telemetry schema'::text;
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok
                 then 'telemetry is write-only from public, invisible to clients, and read by no view'
                 else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_telemetry_write_only() from public, anon, authenticated;

create or replace function public.assert_evidence_consumer_boundary()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; v_tables text[] := array[
  'assessment_sessions','presented_items','presented_item_views',
  'responses','assessment_results','integrity_signals'];
begin
  select string_agg(distinct g.grantee || ' on ' || g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables)
     and g.grantee not in ('postgres','service_role','supabase_admin','authenticated');
  if bad is not null then
    problems := problems || ('unexpected grantee on raw evidence (amended INV-20): ' || bad);
  end if;

  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables)
     and g.grantee in ('authenticated','anon') and g.privilege_type <> 'SELECT';
  if bad is not null then
    problems := problems || ('client role holds a write grant on raw evidence: ' || bad);
  end if;

  select string_agg(g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables) and g.grantee = 'anon';
  if bad is not null then problems := problems || ('anon holds a grant on raw evidence: ' || bad); end if;

  if (select is_nullable from information_schema.columns
       where table_schema='public' and table_name='assessment_results' and column_name='session_id') <> 'NO' then
    -- THE OTHER REPAIRED LINE.
    problems := problems || 'assessment_results.session_id is nullable: a result could carry no provenance at all (INV-29)'::text;
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok
    then format('raw evidence (%s tables) is reachable only by the platform roles and by authenticated SELECT under RLS, '
             || 'and every result is anchored to a session by a NOT NULL key (INV-29); no analytics consumer role exists '
             || 'yet, so the amended INV-20 holds but holds VACUOUSLY -- the consumer role is an open decision', cardinality(v_tables))
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_evidence_consumer_boundary() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003). Behavioural, because the defect was a code
-- path that had never executed: each failure branch is made to run.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text;
begin
  -- both report clean today
  select a.ok into v_ok from public.assert_telemetry_write_only() a;
  if not v_ok then raise exception 'telemetry boundary is red before the probe'; end if;
  select a.ok into v_ok from public.assert_evidence_consumer_boundary() a;
  if not v_ok then raise exception 'evidence consumer boundary is red before the probe'; end if;

  -- PROBE 1: grant a client role USAGE on telemetry. The repaired line runs.
  grant usage on schema telemetry to authenticated;
  select a.ok, a.detail into v_ok, v_detail from public.assert_telemetry_write_only() a;
  revoke usage on schema telemetry from authenticated;
  if v_ok then raise exception 'a client role held USAGE on telemetry and the assertion still reported clean'; end if;
  if v_detail !~ 'USAGE on the telemetry schema' then
    raise exception 'the telemetry failure path ran but reported the wrong thing: %', v_detail;
  end if;

  -- PROBE 2: make the INV-29 anchor nullable. The other repaired line runs.
  alter table public.assessment_results alter column session_id drop not null;
  select a.ok, a.detail into v_ok, v_detail from public.assert_evidence_consumer_boundary() a;
  alter table public.assessment_results alter column session_id set not null;
  if v_ok then raise exception 'session_id was nullable and the INV-29 anchor assertion still reported clean'; end if;
  if v_detail !~ 'session_id is nullable' then
    raise exception 'the INV-29 failure path ran but reported the wrong thing: %', v_detail;
  end if;

  -- both clean again after the probes
  select a.ok into v_ok from public.assert_telemetry_write_only() a;
  if not v_ok then raise exception 'the telemetry assertion stayed red after its probe'; end if;
  select a.ok into v_ok from public.assert_evidence_consumer_boundary() a;
  if not v_ok then raise exception 'the evidence assertion stayed red after its probe'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- And the same class again, from a different direction: audit_write arity.
--
-- FABLE-02's second defect was `audit_write` called with the wrong argument
-- shape. plpgsql resolves the call at RUN time, so the migration applied
-- cleanly and the mistake waited for the first person to walk the path. It was
-- repaired in 0028 with a regression -- and then FABLE-04 made the identical
-- mistake in eight new call sites across four migrations, for the identical
-- reason. The first certificate issuance is what found it.
--
-- A regression that tests one call site does not protect the next one somebody
-- writes, so the property is asserted instead. The first attempt at this
-- assertion demanded two leading string literals and immediately flagged five
-- CORRECT FABLE-01 triggers, whose action argument is a `case` expression
-- rather than a literal. A rule that fires on correct code is worse than no
-- rule, so this counts TOP-LEVEL ARGUMENTS instead: it walks each call from its
-- opening parenthesis tracking depth and quoting, and requires exactly five.
-- That is not a heuristic; it is the arity.
-- ---------------------------------------------------------------------------
create function public.audit_write_call_arities(p_src text)
returns table (arity integer)
language plpgsql immutable set search_path = public, pg_temp as $fn$
declare
  v text := regexp_replace(coalesce(p_src, ''), '--[^\n]*', '', 'g');
  i int; n int; depth int; args int; ch text; inq boolean; pos int; q text := chr(39);
begin
  n := length(v); i := 1;
  loop
    pos := position('audit_write' in substr(v, i));
    exit when pos = 0;
    i := i + pos - 1 + length('audit_write');
    while i <= n and substr(v, i, 1) ~ '\s' loop i := i + 1; end loop;
    if i > n or substr(v, i, 1) <> '(' then continue; end if;
    i := i + 1; depth := 1; args := 1; inq := false;
    while i <= n and depth > 0 loop
      ch := substr(v, i, 1);
      if inq then
        if ch = q then inq := false; end if;
      elsif ch = q then inq := true;
      elsif ch = '(' then depth := depth + 1;
      elsif ch = ')' then depth := depth - 1;
      elsif ch = ',' and depth = 1 then args := args + 1;
      end if;
      i := i + 1;
    end loop;
    arity := args; return next;
  end loop;
end $fn$;
revoke all on function public.audit_write_call_arities(text) from public, anon, authenticated;

create function public.assert_audit_write_arity()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $fn$
declare bad text; n_calls int;
begin
  select string_agg(distinct p.proname || '(' || a.arity || ' args)', ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace,
         lateral public.audit_write_call_arities(p.prosrc) a
   where ns.nspname = 'public' and p.prokind = 'f'
     and p.proname not in ('assert_audit_write_arity','audit_write_call_arities')
     and a.arity <> 5;
  select count(*) into n_calls
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace,
         lateral public.audit_write_call_arities(p.prosrc) a
   where ns.nspname = 'public' and p.prokind = 'f'
     and p.proname not in ('assert_audit_write_arity','audit_write_call_arities');
  ok := bad is null;
  detail := case when ok
    then format('%s audit_write call site(s), every one of them five-argument', n_calls)
    else 'audit_write called with the wrong arity in: ' || bad end;
  return next;
end $fn$;
revoke all on function public.assert_audit_write_arity() from public, anon, authenticated;

do $$
declare v_ok boolean; v_detail text;
begin
  select a.ok, a.detail into v_ok, v_detail from public.assert_audit_write_arity() a;
  if not v_ok then raise exception 'audit_write arity: %', v_detail; end if;

  execute 'create function public.zz_bad_audit() returns void
             language plpgsql security definer set search_path = public, pg_temp as $q$
             begin perform public.audit_write(''probe'', jsonb_build_object(''x'', 1)); end $q$';
  select a.ok, a.detail into v_ok, v_detail from public.assert_audit_write_arity() a;
  execute 'drop function public.zz_bad_audit()';
  if v_ok then raise exception 'a two-argument audit_write call passed the arity assertion'; end if;
  if v_detail not like '%zz_bad_audit(2 args)%' then
    raise exception 'the arity assertion caught something, but not with the arity it saw: %', v_detail;
  end if;

  -- and it does NOT fire on a correct call whose action is a case expression,
  -- which is the shape that made the first version of this assertion useless
  execute 'create function public.zz_good_audit() returns void
             language plpgsql security definer set search_path = public, pg_temp as $q$
             begin perform public.audit_write(
               case when true then ''a.b'' else ''c.d'' end, ''persons'', ''x'', null,
               jsonb_build_object(''x'', 1)); end $q$';
  select a.ok, a.detail into v_ok, v_detail from public.assert_audit_write_arity() a;
  execute 'drop function public.zz_good_audit()';
  if not v_ok then
    raise exception 'the arity assertion fired on a correct five-argument call: %', v_detail;
  end if;

  select a.ok into v_ok from public.assert_audit_write_arity() a;
  if not v_ok then raise exception 'the arity assertion stayed red after the probes were dropped'; end if;
end $$;

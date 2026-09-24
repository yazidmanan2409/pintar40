-- ---------------------------------------------------------------------------
-- W8-01 — A SCHOOL COULD NOT BUILD ITS OWN SHAPE.
--
-- An institution administrator, signing in and adding a cohort or a class the
-- way the product says they may, was refused:
--
--     permission denied for function org_kind_level
--
-- Not by a policy and not by a rule — by a missing EXECUTE grant. The
-- `org_nodes_before_write` trigger is SECURITY INVOKER, deliberately, so that
-- the ladder rules run with the writer's own rights; and it calls
-- `org_kind_level(org_kind)`, which was never granted to `authenticated`.
-- Every seed and every suite builds its org tree as the table's owner, where
-- the grant is irrelevant, so nothing ever saw it. It would have been found
-- the first time a real school was onboarded.
--
-- `org_kind_level` is a pure, immutable mapping from the ladder enum to its
-- depth. It reads no row, holds no authority, and knowing that a CLASS is
-- level 5 discloses nothing: the enum labels are already in the client's
-- schema. Granting it is the whole repair.
--
-- AND A STANDING ASSERTION, so that this class of defect cannot return by a
-- different door. The repair of one grant would otherwise be a fact about
-- today. The assertion generalises the sweep that found it: for every table a
-- client may write, every invoker-rights trigger on it, every function that
-- trigger calls — can the client execute it? If not, the write is unreachable
-- for everyone except the owner, which is a defect whether or not anyone has
-- tried it yet.
-- ---------------------------------------------------------------------------

grant execute on function public.org_kind_level(public.org_kind) to authenticated;

-- ---------------------------------------------------------------------------
-- THE STANDING ASSERTION
--
-- Owner-run, like every other `assert_*`: it reads the catalogue with the
-- privileges of whoever runs it, and a client-executable assertion about
-- client executability would answer about itself. F06-P08 runs it.
--
-- Comments are stripped before matching, because a function name in a comment
-- is not a call and a lint that cannot tell the difference will one day be
-- satisfied by deleting a sentence.
-- ---------------------------------------------------------------------------
create or replace function public.assert_client_writes_are_reachable()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; n_tables int; n_triggers int;
begin
  with writable as (
    select c.oid, c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and (has_table_privilege('authenticated', c.oid, 'insert')
         or has_table_privilege('authenticated', c.oid, 'update')
         or has_table_privilege('authenticated', c.oid, 'delete'))
  ),
  invoker_triggers as (
    select w.relname as tbl, p.proname as fn,
           regexp_replace(coalesce(p.prosrc, ''), '--[^\n]*', '', 'g') as src
      from writable w
      join pg_trigger t on t.tgrelid = w.oid and not t.tgisinternal
      join pg_proc p on p.oid = t.tgfoid
     where not p.prosecdef
  ),
  unreachable as (
    select p.proname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and not has_function_privilege('authenticated', p.oid, 'execute')
  )
  select string_agg(distinct it.tbl || ' → ' || it.fn || '() calls ' || u.proname || '()', '; ')
    into bad
    from invoker_triggers it join unreachable u
      on it.src ~ ('public\.' || u.proname || '\s*\(');

  select count(distinct c.oid) into n_tables
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and (has_table_privilege('authenticated', c.oid, 'insert')
       or has_table_privilege('authenticated', c.oid, 'update')
       or has_table_privilege('authenticated', c.oid, 'delete'));
  select count(*) into n_triggers
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    join pg_trigger t on t.tgrelid = c.oid and not t.tgisinternal
    join pg_proc p on p.oid = t.tgfoid
   where n.nspname = 'public' and c.relkind = 'r' and not p.prosecdef
     and (has_table_privilege('authenticated', c.oid, 'insert')
       or has_table_privilege('authenticated', c.oid, 'update')
       or has_table_privilege('authenticated', c.oid, 'delete'));

  ok := bad is null;
  detail := case
    when bad is null then format(
      'every invoker-rights trigger a client can reach calls only functions that client may execute '
      '(%s client-writable table(s), %s invoker trigger(s) on them)', n_tables, n_triggers)
    else 'a client-writable table runs an invoker trigger the client cannot execute: ' || bad
  end;
  return next;
end $$;
revoke all on function public.assert_client_writes_are_reachable() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014): builds its own school, signs in as its
-- administrator FOR REAL — `set local role authenticated`, not merely a claim,
-- because the defect was a grant and a claim alone would not have found it —
-- builds a cohort and a class, and rolls the whole thing back.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text;
        v_inst uuid; v_period uuid; v_fac uuid; v_dep uuid; v_prog uuid;
        v_coh uuid; v_cls uuid; v_adm_u uuid; v_adm uuid; n int;
begin
  -- 1. the grant is on the function the trigger calls
  if not has_function_privilege('authenticated', 'public.org_kind_level(public.org_kind)'::regprocedure, 'execute') then
    raise exception 'org_kind_level is still not executable by authenticated';
  end if;

  -- 2. the standing assertion holds in the database it now governs
  select a.ok, a.detail into v_ok, v_detail from public.assert_client_writes_are_reachable() a;
  if not v_ok then raise exception 'assert_client_writes_are_reachable: %', v_detail; end if;

  -- 3. and it is not client-callable, like every other assertion
  if has_function_privilege('authenticated', 'public.assert_client_writes_are_reachable()'::regprocedure, 'execute') then
    raise exception 'the reachability assertion is client-callable';
  end if;

  ------------------------------------------------------------------ behavioural
  begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0105 school', 'probe-0105-school', true, true) returning id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 30, current_date + 300) returning id into v_period;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'F') returning id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D') returning id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep, 'PROGRAMME', 'P') returning id into v_prog;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0105-admin@local.invalid')
    returning id into v_adm_u;
    select a.person_id into v_adm from public.accounts a where a.auth_user_id = v_adm_u;
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_adm, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    -- SIGNED IN AS THE ADMINISTRATOR, with that role's actual privileges.
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_adm_u, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm_u::text, true);
    execute 'set local role authenticated';

    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'Angkatan 2026', v_period) returning id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', '7A', v_period) returning id into v_cls;

    -- the ladder rules still ran: jalur is the path, not an empty array
    select array_length(jalur, 1) into n from public.org_nodes where id = v_cls;
    if coalesce(n, 0) <> 6 then
      raise exception 'the class was written with a jalur of % entries, so the ladder trigger did not run', coalesce(n, 0);
    end if;

    -- and the rules still REFUSE what they always refused: a CLASS under a
    -- FACULTY is not a step down the ladder.
    begin
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
      values (v_inst, v_fac, 'CLASS', 'salah', v_period);
      raise exception 'a CLASS was accepted directly under a FACULTY: the grant weakened the ladder';
    exception when others then
      if sqlerrm ~ 'weakened the ladder' then raise; end if;
    end;

    execute 'set local role postgres';
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'WP8A_PROBE_UNDO';
  exception when others then
    execute 'set local role postgres';
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'WP8A_PROBE_UNDO' then
      raise exception 'WP8-01 verification failed: %', sqlerrm;
    end if;
  end;
end $$;

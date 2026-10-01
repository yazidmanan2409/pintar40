-- ADM-J19 (J3.x, the school's new year) -- A NEW YEAR CARRIES THE WHOLE CLASS,
-- AND SAYS HOW MANY IT CARRIED.
--
-- Konfigurasi's «Pergantian tahun ajaran» calls period_rollover, which had
-- never been run outside a seeded test. Run on the bootstrap school, two
-- things were wrong:
--
-- 1. A LEARNER WHO HAD NOT SIGNED IN YET STAYED BEHIND. The rollover moved
--    only ACTIVE enrolments. Since 20261005120000 a learner recorded by the
--    intake is PENDING until they first sign in with their card, so every
--    recorded learner without a card yet stayed in last year's Kelas, with no
--    Kelas in the new year: off next year's roster, off the class cards, off
--    the teacher's page. The M7 class cards and the management roster had the
--    same filter and were corrected in ed8ed66; this is the database's copy of
--    it. PENDING and ACTIVE move; ENDED and CANCELLED, which no longer hold a
--    place, do not.
--
-- 2. THE COUNT WAS THE LAST CLASS'S. `get diagnostics ... row_count` replaced
--    the running total on each mapping, so a rollover of three classes
--    reported the last one's members: the screen said «…dipindahkan…: 1» for
--    two moved. It now adds each class's count.
--
-- Everything else is 20260912004527's body, unchanged: who may run it
-- (INSTITUTION_ADMIN over the school, asked first), the periods and nodes
-- checked against the school, memberships closed with PERIOD_ROLLOVER and
-- reopened in the next year's node at the same instant, and the audit row.
-- The client_rpc_registry row (SCOPE) still describes it. No table, policy
-- or grant changes.

create or replace function public.period_rollover(p_institution uuid, p_from_period uuid, p_to_period uuid, p_mapping jsonb)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare m record; v_count int := 0; v_n int; v_from uuid; v_to uuid;
begin
  if not public.has_scope('INSTITUTION_ADMIN', p_institution) then raise exception 'INSTITUTION_ADMIN required'; end if;
  if not exists (select 1 from public.academic_periods where id = p_to_period and institution_id = p_institution)
     or not exists (select 1 from public.academic_periods where id = p_from_period and institution_id = p_institution) then
    raise exception 'periods must belong to the institution';
  end if;
  for m in select (x->>'from_node')::uuid as from_node, (x->>'to_node')::uuid as to_node from jsonb_array_elements(p_mapping) x loop
    v_from := m.from_node; v_to := m.to_node;
    if not exists (select 1 from public.org_nodes where id = v_from and institution_id = p_institution and academic_period_id = p_from_period)
       or not exists (select 1 from public.org_nodes where id = v_to and institution_id = p_institution and academic_period_id = p_to_period) then
      raise exception 'mapping node not in the expected institution/period';
    end if;
    with closed as (
      update public.memberships mm set valid_to = now(), close_reason = 'PERIOD_ROLLOVER'
       where mm.node_id = v_from and mm.valid_to is null
         -- (1) recorded and not yet signed in (PENDING) moves with the class, as ACTIVE does
         and exists (select 1 from public.enrollments e where e.id = mm.enrollment_id and e.status in ('PENDING', 'ACTIVE'))
       returning mm.enrollment_id
    )
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    select c.enrollment_id, v_to, p_to_period from closed c;
    -- (2) every class's count, not the last one's
    get diagnostics v_n = row_count;
    v_count := v_count + v_n;
  end loop;
  perform public.audit_write('period.rollover', 'academic_periods', p_to_period::text, p_institution,
    jsonb_build_object('from_period', p_from_period, 'to_period', p_to_period, 'mapping', p_mapping));
  return v_count;
end $$;

revoke all on function public.period_rollover(uuid, uuid, uuid, jsonb) from public, anon;
grant execute on function public.period_rollover(uuid, uuid, uuid, jsonb) to authenticated;

-- ───────────────────────────────────────────────────────────── assertions
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.period_rollover(uuid,uuid,uuid,jsonb)'::regprocedure);
  if v_def !~ $r$e\.status in \('PENDING', 'ACTIVE'\)$r$ or v_def !~ 'v_count := v_count \+ v_n' then
    raise exception 'ADM-J19: period_rollover does not carry PENDING learners or does not add every class''s count';
  end if;
  if v_def !~ $r$has_scope\('INSTITUTION_ADMIN', p_institution\)$r$ or v_def !~ 'PERIOD_ROLLOVER' or v_def !~ 'period\.rollover' then
    raise exception 'ADM-J19: period_rollover lost its authority check, its close reason or its audit row';
  end if;
  if not (select p.prosecdef from pg_proc p where p.oid = 'public.period_rollover(uuid,uuid,uuid,jsonb)'::regprocedure) then
    raise exception 'ADM-J19: period_rollover is no longer SECURITY DEFINER';
  end if;
  if has_function_privilege('anon', 'public.period_rollover(uuid,uuid,uuid,jsonb)', 'execute')
     or not has_function_privilege('authenticated', 'public.period_rollover(uuid,uuid,uuid,jsonb)', 'execute') then
    raise exception 'ADM-J19: period_rollover''s execute grant changed';
  end if;
  if not exists (select 1 from public.client_rpc_registry r where r.function_name = 'period_rollover') then
    raise exception 'ADM-J19: period_rollover is no longer classified in client_rpc_registry';
  end if;
end $$;

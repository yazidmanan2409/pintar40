-- Year-end rollover (the Kelas 5 to 6 demonstration; Daisy's design; owner, 9 Nov). F37-N01 was red on the previous
-- commit: a run that moved nobody wrote a «Tahun ajaran dilanjutkan» audit event, and a run that moved learners did
-- not record how many. A refused run already changed and audited nothing, since the whole call aborts. Only the audit
-- changes; who may run it, what moves and the close reason are as they were (ADM-J19).

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
  -- the demonstration (owner, 9 Nov): a run that moves nobody records no event, and a run that moves says how many
  if v_count > 0 then
    perform public.audit_write('period.rollover', 'academic_periods', p_to_period::text, p_institution,
      jsonb_build_object('from_period', p_from_period, 'to_period', p_to_period, 'mapping', p_mapping, 'moved', v_count));
  end if;
  return v_count;
end;
$$;

revoke all on function public.period_rollover(uuid, uuid, uuid, jsonb) from public, anon;
grant execute on function public.period_rollover(uuid, uuid, uuid, jsonb) to authenticated;

do $$
declare v_def text := pg_get_functiondef('public.period_rollover(uuid,uuid,uuid,jsonb)'::regprocedure);
begin
  if v_def !~ 'if v_count > 0 then' or v_def !~ $r$'moved', v_count$r$ then
    raise exception 'year-end: period_rollover audits a run that moved nobody, or does not record how many moved';
  end if;
  if v_def !~ $r$has_scope\('INSTITUTION_ADMIN', p_institution\)$r$ or v_def !~ 'PERIOD_ROLLOVER' then
    raise exception 'ADM-J19: period_rollover lost its authority check or its close reason';
  end if;
end $$;

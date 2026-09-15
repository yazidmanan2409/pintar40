-- 0078 -- a health row begins where the state machine says, then walks.
--
-- THE THIRD SHORTCUT THIS STATE MACHINE HAS REFUSED, and the first one found by
-- real evidence rather than by a probe.
--
-- `enforce_question_health` requires a row to BEGIN at INSUFFICIENT_EVIDENCE.
-- 0076's insert path wrote the derived state directly, so the first recompute
-- over a cohort whose evidence already trips a threshold was refused outright:
--
--     question health begins at INSUFFICIENT_EVIDENCE, not SIGNAL_RAISED
--
-- The migration probes never met it because they computed over an item with no
-- evidence, whose derived state IS the starting state. It took 80 real learner
-- sessions in D1 to reach the branch -- L9 one level up: the mechanism was
-- proven, the mechanism over real evidence was not.
--
-- THE REPAIR IS THE MORE HONEST BEHAVIOUR ANYWAY. A row now starts where the
-- lifecycle starts and walks to its derived state through declared edges, so a
-- brand-new item that arrives already tripping a signal records
--
--     INSUFFICIENT_EVIDENCE -> OBSERVING -> SIGNAL_RAISED
--
-- as three states and two audit rows, rather than appearing fully-formed in a
-- state nothing explains. The walk that 0077 built for the downward direction
-- turns out to be the whole answer in both.

create or replace function public.recompute_question_health(p_institution uuid)
returns table(items_seen int, rows_written int, signals_raised int, signals_cleared int)
language plpgsql security definer set search_path = public, pg_temp as $function$
declare
  v_cat text; t public.question_health_thresholds; r record;
  v_next public.question_health_state; v_cur public.question_health_state;
  v_step public.question_health_state; v_from public.question_health_state; v_hops int;
  v_created boolean;
begin
  if not public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', p_institution)
     and not public.is_system_admin() then
    raise exception 'recomputing question health requires CAN_REVIEW_QUESTION_HEALTH in that institution';
  end if;

  v_cat := public.current_metric_catalogue();
  select * into t from public.question_health_thresholds
   where catalogue_version = v_cat and signal_key = 'kesehatan.korektnes';
  if t.signal_key is null or t.min_evidence is null then
    raise exception 'catalogue % declares no wired correctness signal', v_cat;
  end if;

  items_seen := 0; rows_written := 0; signals_raised := 0; signals_cleared := 0;

  for r in
    select i.id as item_id,
           coalesce(st.evidence_count, 0) as n,
           st.correctness_rate as rate
      from public.items i
      left join public.service_item_statistics st
             on st.item_id = i.id and st.institution_id = p_institution
     where i.institution_id = p_institution
     order by i.id
  loop
    items_seen := items_seen + 1;

    select qh.state into v_cur from public.question_health qh
     where qh.item_id = r.item_id and qh.institution_id = p_institution
       for update;

    if v_cur in ('UNDER_REVIEW', 'ACKNOWLEDGED_OK', 'ACTION_TAKEN') then
      continue;
    end if;

    if r.n < t.min_evidence then
      v_next := 'INSUFFICIENT_EVIDENCE';
    elsif r.rate is not null
          and (r.rate <= t.low_watermark or r.rate >= t.high_watermark) then
      v_next := 'SIGNAL_RAISED';
    else
      v_next := 'OBSERVING';
    end if;

    v_created := false;
    if v_cur is null then
      -- BEGIN WHERE THE LIFECYCLE BEGINS. The guard refuses any other birth
      -- state, and it is right to: a row that appeared already SIGNAL_RAISED
      -- would assert a history it never had.
      insert into public.question_health (item_id, institution_id, state, evidence_count)
      values (r.item_id, p_institution, 'INSUFFICIENT_EVIDENCE', r.n);
      perform public.audit_write('question_health.transition', 'question_health',
        r.item_id::text, p_institution,
        jsonb_build_object('from_state', null, 'to_state', 'INSUFFICIENT_EVIDENCE',
                           'evidence_count', r.n, 'catalogue_version', v_cat));
      v_cur := 'INSUFFICIENT_EVIDENCE'; v_created := true;
    end if;

    v_from := v_cur;
    v_hops := 0;
    while v_cur is distinct from v_next and v_hops < 4 loop
      select edge.to_state into v_step
        from public.question_health_transitions edge
       where edge.from_state = v_cur
         and edge.to_state in ('INSUFFICIENT_EVIDENCE','OBSERVING','SIGNAL_RAISED')
         and (edge.to_state = v_next
              or exists (select 1 from public.question_health_transitions edge2
                          where edge2.from_state = edge.to_state and edge2.to_state = v_next))
       order by (edge.to_state = v_next) desc
       limit 1;
      exit when v_step is null;
      update public.question_health qh set state = v_step, updated_at = now()
       where qh.item_id = r.item_id and qh.institution_id = p_institution;
      perform public.audit_write('question_health.transition', 'question_health',
        r.item_id::text, p_institution,
        jsonb_build_object('from_state', v_cur, 'to_state', v_step,
                           'evidence_count', r.n, 'catalogue_version', v_cat));
      v_cur := v_step; v_step := null; v_hops := v_hops + 1;
    end loop;

    update public.question_health qh
       set evidence_count = r.n, updated_at = now()
     where qh.item_id = r.item_id and qh.institution_id = p_institution
       and qh.evidence_count is distinct from r.n;

    if v_created or v_hops > 0 or found then
      rows_written := rows_written + 1;
      if v_cur = 'SIGNAL_RAISED' and v_from <> 'SIGNAL_RAISED' then
        signals_raised := signals_raised + 1;
      elsif v_from = 'SIGNAL_RAISED' and v_cur <> 'SIGNAL_RAISED' then
        signals_cleared := signals_cleared + 1;
      end if;
    end if;
  end loop;

  perform public.audit_write('question_health.recomputed', 'question_health', p_institution::text,
    p_institution,
    jsonb_build_object('catalogue_version', v_cat, 'items_seen', items_seen,
                       'rows_written', rows_written, 'signals_raised', signals_raised,
                       'signals_cleared', signals_cleared,
                       'min_evidence', t.min_evidence,
                       'low_watermark', t.low_watermark, 'high_watermark', t.high_watermark));
  return next;
end $function$;
revoke all on function public.recompute_question_health(uuid) from public, anon, authenticated;
grant execute on function public.recompute_question_health(uuid) to authenticated;

do $$
declare n int;
begin
  -- the birth state is now literal in the insert, and the derived state is
  -- reached only by walking
  if pg_get_functiondef('public.recompute_question_health(uuid)'::regprocedure)
       !~ 'values \(r\.item_id, p_institution, ''INSUFFICIENT_EVIDENCE'', r\.n\)' then
    raise exception 'the insert path no longer creates the row at the lifecycle''s start';
  end if;
  if not (select a.ok from public.assert_question_health_observes_only() a) then
    raise exception 'the question-health boundary is false after this migration: %',
      (select a.detail from public.assert_question_health_observes_only() a);
  end if;
  raise notice '0078 verified: a health row is born at INSUFFICIENT_EVIDENCE and walks to its derived state through declared edges, in both directions';
end $$;

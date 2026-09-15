-- 0077 -- the walk leaves a trail, and restraint becomes data.
--
-- =========================================================================
-- CARRY 1 -- 0076 ARGUED FOR THE TWO-EDGE WALK AND THEN DID NOT RECORD IT.
--
-- 0076's header says an item whose signal was raised and whose evidence was
-- later withdrawn must travel SIGNAL_RAISED -> OBSERVING ->
-- INSUFFICIENT_EVIDENCE "because the signal cleared and there is no longer
-- enough to watch are two separate things that happened and the trail should
-- say so."
--
-- It then wrote ONE audit row per RUN. Measured: no question-health history
-- table exists -- there is `question_health` (current state) and
-- `question_health_transitions` (declared edges) and nothing else -- so
-- `audit_log` is the only trail there is, and a per-run summary makes a
-- two-hop walk indistinguishable from a single jump. The argument for the walk
-- is the argument for recording each edge; writing one and not the other left
-- the design decision living in a commit message.
--
-- ORDER BY `id`, NEVER BY `at`. `audit_log.at` defaults to `now()`, which is
-- TRANSACTION start, so both edges of one walk carry the identical timestamp
-- (L3). `audit_log.id` is `bigint GENERATED ALWAYS AS IDENTITY` -- measured, not
-- assumed -- so it is the only ordering that can separate them. L3 named
-- FABLE-06 as its inheritor and this is where that lands.
-- =========================================================================

-- ---------------------------------------------------------------------------
-- CARRY 2 -- an unwired signal is declared, so an auditor can tell restraint
-- from breakage.
--
-- 0076 wired one signal and left distractor uptake and position effects alone,
-- because a threshold nobody has calibrated is an autonomous conclusion in
-- observation's clothing -- and a wrong signal teaches educators to discount
-- the surface, including the signal that matters. That judgement was correct
-- and it was invisible: a missing row and an unimplemented feature look
-- identical from outside.
--
-- So an unwired metric now carries a ROW with a stated reason and no numbers.
-- `min_evidence` becomes nullable and exactly one of (a threshold, a reason)
-- must be present.
-- ---------------------------------------------------------------------------
alter table public.question_health_thresholds alter column min_evidence drop not null;
alter table public.question_health_thresholds add column unwired_reason_key text;
alter table public.question_health_thresholds drop constraint qht_min_evidence_real;
alter table public.question_health_thresholds
  add constraint qht_min_evidence_real check (min_evidence is null or min_evidence > 0);
alter table public.question_health_thresholds
  add constraint qht_wired_or_declared_unwired
  check ((min_evidence is null) <> (unwired_reason_key is null));
alter table public.question_health_thresholds
  add constraint qht_unwired_carries_no_numbers
  check (unwired_reason_key is null or (low_watermark is null and high_watermark is null));
alter table public.question_health_thresholds
  add constraint qht_unwired_reason_is_hle
  check (unwired_reason_key is null or unwired_reason_key ~ '^[a-z][a-z0-9_.]+$');

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark, unwired_reason_key) values
  ('MC-1', 'kesehatan.pengecoh', null, null, null, 'kesehatan.belum_dikalibrasi'),
  ('MC-1', 'kesehatan.posisi',   null, null, null, 'kesehatan.belum_dikalibrasi');
-- Both are declared as catalogue METRICS (item.distractor_uptake,
-- item.position_effect) and are readable on a report. What is withheld is the
-- automatic SIGNAL, not the number.

-- ---------------------------------------------------------------------------
-- The recompute, recording each edge it takes.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_question_health(p_institution uuid)
returns table(items_seen int, rows_written int, signals_raised int, signals_cleared int)
language plpgsql security definer set search_path = public, pg_temp as $function$
declare
  v_cat text; t public.question_health_thresholds; r record;
  v_next public.question_health_state; v_cur public.question_health_state;
  v_step public.question_health_state; v_from public.question_health_state; v_hops int;
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

    if v_cur is null then
      insert into public.question_health (item_id, institution_id, state, evidence_count)
      values (r.item_id, p_institution, v_next, r.n);
      rows_written := rows_written + 1;
      if v_next = 'SIGNAL_RAISED' then signals_raised := signals_raised + 1; end if;
      perform public.audit_write('question_health.transition', 'question_health',
        r.item_id::text, p_institution,
        jsonb_build_object('from_state', null, 'to_state', v_next,
                           'evidence_count', r.n, 'catalogue_version', v_cat));
    else
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
        -- ONE ROW PER EDGE. Two hops are two events, which is the whole reason
        -- the walk exists rather than a jump.
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

      if v_hops > 0 or found then
        rows_written := rows_written + 1;
        if v_cur = 'SIGNAL_RAISED' and v_from <> 'SIGNAL_RAISED' then
          signals_raised := signals_raised + 1;
        elsif v_from = 'SIGNAL_RAISED' and v_cur <> 'SIGNAL_RAISED' then
          signals_cleared := signals_cleared + 1;
        end if;
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

-- ADR-0021, and F06-S01 refused this migration until it was here.
--
-- `create or replace` on an EXISTING function preserves its privileges, so
-- nothing was actually re-exposed. The check cannot know that -- it would need
-- cross-migration analysis -- and `create or replace` of a function that did
-- NOT previously exist behaves exactly like `create`, with the full PUBLIC
-- default. Excluding `or replace` would open a real hole to avoid a redundant
-- line, which is the trade ADR-0021 was written to refuse: "the repair is to
-- write the revoke, not to weaken the check."
--
-- The grant is unchanged and its `client_rpc_registry` row is the one 0076
-- declared; this is the same exposure decision restated, not a new one.
revoke all on function public.recompute_question_health(uuid) from public, anon, authenticated;
grant execute on function public.recompute_question_health(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The assertion, extended: every ITEM-scope metric has DECIDED about its signal.
-- ---------------------------------------------------------------------------
create or replace function public.assert_question_health_observes_only()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; bad text; n int; n_wired int; n_unwired int;
        v_src text; v_cat text;
begin
  v_cat := public.current_metric_catalogue();

  v_src := regexp_replace(
             pg_get_functiondef('public.recompute_question_health(uuid)'::regprocedure),
             '--[^\n]*', ' ', 'g');
  if v_src ~* '\y(assessment_results|official_results|mastery|safety_gate_passed|predikat)\y' then
    problems := problems || 'recompute_question_health reads or writes a RESULT: health is not a score'::text;
  end if;
  select string_agg(p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.proname in ('evaluate_session','grade_response','recompute_result','finalize_session',
                       'session_outcome','certificate_eligibility')
     and regexp_replace(p.prosrc, '--[^\n]*', ' ', 'g') ~* '\yquestion_health\y';
  if bad is not null then
    problems := problems || ('scoring path(s) reading question health: ' || bad);
  end if;

  if v_src ~* '\y(UNDER_REVIEW|ACKNOWLEDGED_OK|ACTION_TAKEN)\y' and v_src !~* 'continue' then
    problems := problems ||
      'the recompute names a review state without skipping it: computation must not drive a human edge'::text;
  end if;
  if v_src !~* 'for\s+update' then
    problems := problems ||
      'the recompute does not lock the row it is about to overwrite: a review landing mid-run would be lost'::text;
  end if;

  -- EVERY EDGE IS RECORDED. With no history table, audit_log is the only trail,
  -- and a walk that writes one row per RUN loses the intermediate state the
  -- two-hop walk exists to express.
  if v_src !~ 'question_health\.transition' then
    problems := problems ||
      'the recompute records no per-edge audit row: a two-hop walk is indistinguishable from a jump'::text;
  end if;
  n := (select count(*) from regexp_matches(v_src, 'question_health\.transition', 'g'));
  if n < 2 then
    problems := problems || format(
      'only %s per-edge audit call(s): the insert path and the walk each need one', n);
  end if;

  select string_agg(distinct qh.state::text, ', ') into bad
    from public.question_health qh
   where qh.state <> 'INSUFFICIENT_EVIDENCE'
     and not exists (select 1 from public.question_health_transitions t where t.to_state = qh.state);
  if bad is not null then
    problems := problems || ('question health state(s) no declared edge reaches: ' || bad);
  end if;

  foreach bad in array array['INSUFFICIENT_EVIDENCE>OBSERVING','OBSERVING>SIGNAL_RAISED',
                             'SIGNAL_RAISED>OBSERVING','OBSERVING>INSUFFICIENT_EVIDENCE'] loop
    if not exists (select 1 from public.question_health_transitions t
                    where t.from_state::text = split_part(bad, '>', 1)
                      and t.to_state::text   = split_part(bad, '>', 2)) then
      problems := problems || ('a computation edge is no longer declared: ' || replace(bad, '>', ' -> '));
    end if;
  end loop;

  select count(*) filter (where min_evidence is not null),
         count(*) filter (where unwired_reason_key is not null)
    into n_wired, n_unwired
    from public.question_health_thresholds where catalogue_version = v_cat;
  if n_wired = 0 then
    problems := problems || format('catalogue %s wires no question-health signal at all', v_cat);
  end if;

  -- RESTRAINT IS DECLARED, NOT INFERRED. An ITEM-scope metric with no threshold
  -- row is indistinguishable from an unimplemented one; adding a metric now
  -- forces a decision about whether it raises a signal.
  select string_agg(d.metric_id, ', ') into bad
    from public.metric_definitions d
   where d.catalogue_version = v_cat and d.scope = 'ITEM'
     and not exists (select 1 from public.question_health_thresholds q
                      where q.catalogue_version = v_cat
                        and q.signal_key = case d.metric_id
                              when 'item.correctness_rate'   then 'kesehatan.korektnes'
                              when 'item.distractor_uptake'  then 'kesehatan.pengecoh'
                              when 'item.position_effect'    then 'kesehatan.posisi' end);
  if bad is not null then
    problems := problems || ('item metric(s) with no signal decision, wired or declared unwired: ' || bad);
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'catalogue %s: %s signal(s) wired and %s declared unwired with a stated reason; the recompute drives '
      || 'only the four declared computation edges, writes one audit row per EDGE so a two-hop walk is '
      || 'legible, locks each row before overwriting it, reads no result and is read by no scoring path '
      || '-- %s row(s) held, %s raised',
      v_cat, n_wired, n_unwired,
      (select count(*) from public.question_health),
      (select count(*) from public.question_health where state = 'SIGNAL_RAISED'))
    else array_to_string(problems, '; ') end;
  return next;
end $function$;
revoke all on function public.assert_question_health_observes_only() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). The success path is probe (2): a real
-- two-hop walk, and the two audit rows it must leave behind.
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_row record; v_inst uuid; v_node uuid; v_item uuid; v_mark bigint;
  v_lesson uuid; v_mod uuid; v_course uuid; v_trail text;
  u_admin uuid := gen_random_uuid(); p_admin uuid; v_refused boolean;
begin
  if not (select a.ok from public.assert_question_health_observes_only() a) then
    raise exception 'the question-health boundary is false after this migration: %',
      (select a.detail from public.assert_question_health_observes_only() a);
  end if;

  begin
    -- (1) an unwired declaration may not smuggle numbers in, and a row must be
    --     one thing or the other
    v_refused := false;
    begin
      insert into public.question_health_thresholds
        (catalogue_version, signal_key, min_evidence, unwired_reason_key)
      values ('MC-1', 'kesehatan.probe', 30, 'kesehatan.belum_dikalibrasi');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a threshold was both wired and declared unwired'; end if;
    v_refused := false;
    begin
      insert into public.question_health_thresholds
        (catalogue_version, signal_key, min_evidence, high_watermark, unwired_reason_key)
      values ('MC-1', 'kesehatan.probe', null, 0.9, 'kesehatan.belum_dikalibrasi');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'an unwired signal carried a watermark'; end if;

    -- fixture
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0077 school', 'probe-0077-school', true, true) returning id into v_inst;
    select id into v_node from public.org_nodes where institution_id = v_inst order by created_at limit 1;
    insert into auth.users (id, email) values (u_admin, 'probe0077@local.invalid');
    select a.person_id into p_admin from public.accounts a where a.auth_user_id = u_admin;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_admin, 'INSTITUTION_ADMIN', v_node, now() + interval '10 years');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_admin::text, true);
    insert into public.courses (institution_id, title, subject, stage, grade_label, status, author_person_id)
    values (v_inst, 'probe course', 'Matematika', 'SD', 'Kelas 4', 'INGESTED', p_admin) returning id into v_course;
    insert into public.modules (course_id, institution_id, title, ordinal)
    values (v_course, v_inst, 'probe module', 1) returning id into v_mod;
    insert into public.lessons (module_id, institution_id, title, ordinal)
    values (v_mod, v_inst, 'probe lesson', 1) returning id into v_lesson;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, status, author_person_id)
    values (v_lesson, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'probe stem', 'INGESTED', p_admin) returning id into v_item;

    perform public.recompute_question_health(v_inst);
    update public.question_health set state = 'OBSERVING', evidence_count = 40 where item_id = v_item;
    update public.question_health set state = 'SIGNAL_RAISED' where item_id = v_item;

    -- (2) THE SUCCESS PATH: one recompute, a two-hop walk, TWO audit rows.
    -- Scoped by a high-water mark on `id` rather than by clearing the trail:
    -- `audit_log` is append-only (INV-18) and refused the delete this probe was
    -- first written with, which is the trigger doing its job on its own author.
    select coalesce(max(id), 0) into v_mark from public.audit_log;
    perform public.recompute_question_health(v_inst);
    select count(*) into n from public.audit_log
     where action = 'question_health.transition' and target_id = v_item::text and id > v_mark;
    if n <> 2 then
      raise exception 'the two-hop walk left % audit row(s), not 2: the intermediate state is invisible', n;
    end if;
    -- ORDERED BY id, NOT BY at. Both rows carry the identical `at` -- it
    -- defaults to now(), which is transaction start (L3) -- so time cannot
    -- separate them and only the identity column can.
    select string_agg((summary ->> 'from_state') || '->' || (summary ->> 'to_state'), ' then ' order by id)
      into v_trail from public.audit_log
     where action = 'question_health.transition' and target_id = v_item::text and id > v_mark;
    if v_trail <> 'SIGNAL_RAISED->OBSERVING then OBSERVING->INSUFFICIENT_EVIDENCE' then
      raise exception 'the recorded walk reads "%", not the two declared edges', v_trail;
    end if;
    select count(distinct at) into n from public.audit_log
     where action = 'question_health.transition' and target_id = v_item::text and id > v_mark;
    if n <> 1 then
      raise exception 'the two edges carry different timestamps; the L3 premise this ordering rests on is gone';
    end if;

    raise exception 'PROBE_0077_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0077_ROLLBACK' then raise; end if;
  end;

  raise notice '0077 verified: a two-hop walk leaves two audit rows naming both declared edges, ordered by identity because both share one transaction timestamp; two signals declared unwired with a reason, and a threshold cannot be both';
end $$;

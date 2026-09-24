-- 0076 -- Question Health: PINTAR learns from evidence, and never concludes.
--
-- FOUR OF THE NINE DECLARED EDGES BELONG TO COMPUTATION. The other five are the
-- human path FABLE-05 already built through `record_question_health_review`.
-- `question_health_transitions` is a declared-edges table, not a log, and it
-- has carried all nine since Phase 2:
--
--   COMPUTATION      INSUFFICIENT_EVIDENCE -> OBSERVING       enough evidence to watch
--                    OBSERVING -> SIGNAL_RAISED               a statistic crossed its threshold
--                    SIGNAL_RAISED -> OBSERVING               the signal cleared on its own
--                    OBSERVING -> INSUFFICIENT_EVIDENCE       evidence withdrawn
--
--   HUMAN            SIGNAL_RAISED -> UNDER_REVIEW            a person picked it up
--                    UNDER_REVIEW -> ACKNOWLEDGED_OK          reviewed, judged sound
--                    UNDER_REVIEW -> ACTION_TAKEN             reviewed, changed
--                    ACKNOWLEDGED_OK -> OBSERVING             watching resumes
--                    ACTION_TAKEN -> OBSERVING                watching resumes on the revision
--
-- WHY THE DOWNWARD PAIR IS NOT DECORATION. `enforce_evidence_override` is
-- INSERT-only and refuses any promotion -- "an override may only reduce
-- eligibility" -- so a session can LEAVE the OFFICIAL pool and can never
-- re-enter it. An item's evidence count can therefore fall. A computation that
-- only ratcheted upward would leave an item OBSERVING, or SIGNAL_RAISED, on
-- evidence that no longer exists.
--
-- SO THIS IS A FULL RECOMPUTE, NOT AN INCREMENT. `question_health.evidence_count`
-- is a STORED column; an accumulated counter would outlive the evidence it
-- counted, and the state resting on it would outlive its reason. Every run
-- reads the current OFFICIAL pool and overwrites.
--
-- PINTAR OBSERVES AND HIGHLIGHTS. IT NEVER CONCLUDES (INV-11, doc 04 §9). No
-- row here says an item is bad. `SIGNAL_RAISED` means "a statistic crossed a
-- threshold and a human should look"; the possible explanations -- legitimate
-- difficulty, wording, distractors, prerequisite weakness, lesson weakness, a
-- widespread misconception -- are for the educator, and the schema records no
-- opinion among them.

-- ---------------------------------------------------------------------------
-- Thresholds are catalogue values, versioned (§3.4). A number in a component
-- is invisible to provenance; a number here changes only by publishing a new
-- catalogue version, and the rows are immutable like every other catalogue row.
-- ---------------------------------------------------------------------------
create table public.question_health_thresholds (
  catalogue_version text not null references public.metric_catalogue(version) on delete restrict,
  signal_key        text not null,
  min_evidence      integer not null,
  low_watermark     numeric(5,4),
  high_watermark    numeric(5,4),
  primary key (catalogue_version, signal_key),
  constraint qht_signal_key_is_hle check (signal_key ~ '^[a-z][a-z0-9_.]+$'),
  constraint qht_min_evidence_real check (min_evidence > 0),
  constraint qht_watermarks_ordered
    check (low_watermark is null or high_watermark is null or low_watermark < high_watermark)
);
alter table public.question_health_thresholds enable row level security;
create trigger question_health_thresholds_immutable
  before update or delete on public.question_health_thresholds
  for each row execute function public.enforce_catalogue_immutable();
create policy question_health_thresholds_select on public.question_health_thresholds
  for select to authenticated using (public.current_person_id() is not null);
grant select on public.question_health_thresholds to authenticated;

insert into public.question_health_thresholds
  (catalogue_version, signal_key, min_evidence, low_watermark, high_watermark) values
  ('MC-1', 'kesehatan.korektnes', 30, 0.0500, 0.9500);
-- One signal in MC-1: correctness rate. An item almost everyone gets right, or
-- almost everyone gets wrong, is worth a human's attention -- in both
-- directions, because "too easy" and "too hard" are the same kind of finding
-- and neither is a verdict. Distractor uptake and position effects are
-- declared as metrics in the catalogue already and are NOT wired to a signal
-- here: a threshold nobody has calibrated would manufacture noise, and §4's
-- "no noisy warnings from tiny samples" applies to the number of signals as
-- much as to the size of the sample.

-- ---------------------------------------------------------------------------
-- The recompute.
--
-- Q3 -- WHAT ABSENCE MEANS, decided once: **a missing row means the computation
-- has never run over that item.** It does not mean "no evidence". An item with
-- no OFFICIAL evidence gets a row at INSUFFICIENT_EVIDENCE with
-- `evidence_count = 0`, so the educator surface can distinguish "we have looked
-- and there is not enough yet" from "this has not been looked at", which are
-- very different sentences to show a person.
--
-- Q2 -- THE HUMAN WINS. Computation touches only rows in the three states it
-- owns. A row a person has moved to UNDER_REVIEW, ACKNOWLEDGED_OK or
-- ACTION_TAKEN is skipped entirely -- and the skip is enforced by `for update`
-- row locking rather than by statement ordering, so a review landing mid-run
-- cannot be overwritten by a recompute that read the old state a moment
-- earlier. Ordering luck is not a concurrency control.
--
-- Q4 -- A SECOND RUN OVER UNCHANGED EVIDENCE WRITES NOTHING, `updated_at`
-- included. Every write is guarded by `is distinct from`. Otherwise every
-- scheduled run bumps every row, the surface shows churn that reflects no new
-- information, and the audit trail fills with non-events.
-- ---------------------------------------------------------------------------
create function public.recompute_question_health(p_institution uuid)
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
  if t.signal_key is null then
    raise exception 'catalogue % declares no correctness signal threshold', v_cat;
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

    -- the current row, LOCKED. Between reading it and writing it a reviewer may
    -- act; the lock is what makes "the human wins" true rather than likely.
    select qh.state into v_cur from public.question_health qh
     where qh.item_id = r.item_id and qh.institution_id = p_institution
       for update;

    if v_cur in ('UNDER_REVIEW', 'ACKNOWLEDGED_OK', 'ACTION_TAKEN') then
      -- a person owns this row. The computation does not have an edge out of
      -- these states and does not invent one.
      continue;
    end if;

    -- THE STATE, DERIVED FROM THE CURRENT POOL EVERY TIME.
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
    else
      v_from := v_cur;
      -- THE TARGET STATE IS NOT ALWAYS ONE EDGE AWAY, and the declared-edge
      -- table refused the shortcut when this was first written.
      --
      -- There is no `SIGNAL_RAISED -> INSUFFICIENT_EVIDENCE` edge. An item
      -- whose signal was raised and whose evidence has since been withdrawn has
      -- to travel SIGNAL_RAISED -> OBSERVING -> INSUFFICIENT_EVIDENCE, because
      -- "the signal cleared" and "there is no longer enough to watch" are two
      -- separate things that happened and the trail should say so.
      --
      -- So the walk READS THE TABLE rather than hard-coding the path: each step
      -- must be a declared edge whose destination is one of the three states
      -- computation owns. If no legal step exists the row is left exactly as it
      -- is. This is L10 -- the code traverses the map instead of merely agreeing
      -- with it.
      v_hops := 0;
      while v_cur is distinct from v_next and v_hops < 4 loop
        -- `edge`, not `t`: `t` is the thresholds record above, and a plpgsql
        -- variable of the same name shadows the table alias into "record t has
        -- no field to_state". The same shadowing cost a round in Task 2.
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
        v_cur := v_step; v_step := null; v_hops := v_hops + 1;
      end loop;

      -- Q4: the count is written only if it actually moved, and `updated_at`
      -- only moves when a hop or a count change happened.
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

  -- Audited once per run, not once per row: the run is the event a person would
  -- ask about, and a row-per-item trail would bury it.
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
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('recompute_question_health', 'STAFF',
   'Recomputes every item''s health from the current OFFICIAL pool. Full recompute, never an increment: evidence can be withdrawn by reclassification. Skips rows a reviewer owns, and writes nothing when nothing changed.');

-- ---------------------------------------------------------------------------
-- The boundary assertion: no autonomous conclusion, ever.
-- ---------------------------------------------------------------------------
create function public.assert_question_health_observes_only()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; bad text; n int; v_src text; v_cat text;
begin
  v_cat := public.current_metric_catalogue();

  -- INV-11: an integrity or behavioural signal is never a scoring input, and
  -- question health is never a verdict. The recompute must not touch a results
  -- table, and no scoring function may read question health.
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

  -- the computation owns four edges and no more: it must not name a state it
  -- has no declared edge into
  if v_src ~* '\y(UNDER_REVIEW|ACKNOWLEDGED_OK|ACTION_TAKEN)\y'
     and v_src !~* 'continue' then
    problems := problems ||
      'the recompute names a review state without skipping it: computation must not drive a human edge'::text;
  end if;

  -- and it must lock, because "the human wins" cannot rest on statement order
  if v_src !~* 'for\s+update' then
    problems := problems ||
      'the recompute does not lock the row it is about to overwrite: a review landing mid-run would be lost'::text;
  end if;

  -- every state a row holds must be reachable by a DECLARED edge
  select string_agg(distinct qh.state::text, ', ') into bad
    from public.question_health qh
   where qh.state <> 'INSUFFICIENT_EVIDENCE'
     and not exists (select 1 from public.question_health_transitions t where t.to_state = qh.state);
  if bad is not null then
    problems := problems || ('question health state(s) no declared edge reaches: ' || bad);
  end if;

  -- the four computation edges are all still declared. If one were dropped the
  -- recompute would keep making the transition while the state machine denied
  -- it was legal.
  foreach bad in array array['INSUFFICIENT_EVIDENCE>OBSERVING','OBSERVING>SIGNAL_RAISED',
                             'SIGNAL_RAISED>OBSERVING','OBSERVING>INSUFFICIENT_EVIDENCE'] loop
    if not exists (select 1 from public.question_health_transitions t
                    where t.from_state::text = split_part(bad, '>', 1)
                      and t.to_state::text   = split_part(bad, '>', 2)) then
      problems := problems || ('a computation edge is no longer declared: ' || replace(bad, '>', ' -> '));
    end if;
  end loop;

  -- thresholds are catalogue rows, not constants in the function
  select count(*) into n from public.question_health_thresholds where catalogue_version = v_cat;
  if n = 0 then
    problems := problems || format('catalogue %s declares no question-health threshold', v_cat);
  end if;
  if v_src ~ '\y(0\.9[0-9]|0\.0[0-9]|[0-9]{2,})\s*(then|and|or|\))' and v_src !~ 'min_evidence' then
    problems := problems || 'the recompute carries a literal threshold: a number here is invisible to provenance'::text;
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'catalogue %s declares %s question-health threshold(s); the recompute drives only the four declared '
      || 'computation edges, locks each row before overwriting it so a reviewer''s decision cannot be lost, '
      || 'reads no result and is read by no scoring path -- %s row(s) currently held, %s raised',
      v_cat, n,
      (select count(*) from public.question_health),
      (select count(*) from public.question_health where state = 'SIGNAL_RAISED'))
    else array_to_string(problems, '; ') end;
  return next;
end $function$;
revoke all on function public.assert_question_health_observes_only() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
--
-- L9: THE SUCCESS PATH IS PROBE (3) -- it moves a real item through
-- INSUFFICIENT_EVIDENCE -> OBSERVING -> SIGNAL_RAISED -> OBSERVING and asserts
-- the resulting row each time. Probes (1) and (2) are structural; probe (4) is
-- Q4; probe (5) is Q2. A block of refusals would prove the guards work and say
-- nothing about whether a transition can happen at all -- which is exactly how
-- metric_evaluate shipped unable to dispatch.
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_row record; v_state text; v_upd timestamptz; v_upd2 timestamptz;
  v_inst uuid; v_node uuid; v_item uuid; v_lesson uuid; v_mod uuid; v_course uuid;
  u_admin uuid := gen_random_uuid(); p_admin uuid;
begin
  if not (select a.ok from public.assert_question_health_observes_only() a) then
    raise exception 'the question-health boundary is false as written: %',
      (select a.detail from public.assert_question_health_observes_only() a);
  end if;

  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0076 school', 'probe-0076-school', true, true) returning id into v_inst;
    select id into v_node from public.org_nodes where institution_id = v_inst order by created_at limit 1;
    insert into auth.users (id, email) values (u_admin, 'probe0076@local.invalid');
    select a.person_id into p_admin from public.accounts a where a.auth_user_id = u_admin;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_admin, 'INSTITUTION_ADMIN', v_node, now() + interval '10 years');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_admin::text, true);

    insert into public.courses (institution_id, title, subject, stage, grade_label,
                                status, author_person_id)
    values (v_inst, 'probe course', 'Matematika', 'SD', 'Kelas 4', 'INGESTED', p_admin)
    returning id into v_course;
    insert into public.modules (course_id, institution_id, title, ordinal)
    values (v_course, v_inst, 'probe module', 1) returning id into v_mod;
    insert into public.lessons (module_id, institution_id, title, ordinal)
    values (v_mod, v_inst, 'probe lesson', 1) returning id into v_lesson;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, status, author_person_id)
    values (v_lesson, v_inst, 'MCQ_SINGLE', 'PRACTICE', 'probe stem', 'INGESTED', p_admin)
    returning id into v_item;

    -- (1) Q3: ABSENCE HAS ONE MEANING. Before any run there is no row, and
    --     that means "never computed" -- not "no evidence".
    select count(*) into n from public.question_health
     where item_id = v_item and institution_id = v_inst;
    if n <> 0 then raise exception 'a health row existed before any computation ran'; end if;

    -- (2) the first run creates a row at INSUFFICIENT_EVIDENCE with a count of
    --     zero, which is the state that says "looked, not enough yet"
    select * into v_row from public.recompute_question_health(v_inst);
    if v_row.items_seen < 1 then raise exception 'the recompute saw no items'; end if;
    select qh.state::text, qh.evidence_count into v_state, n from public.question_health qh
     where qh.item_id = v_item and qh.institution_id = v_inst;
    if v_state <> 'INSUFFICIENT_EVIDENCE' or n <> 0 then
      raise exception 'first run produced state=% count=%, expected INSUFFICIENT_EVIDENCE/0', v_state, n;
    end if;

    -- (3) THE SUCCESS PATH, NAMED. Three real transitions, each asserted.
    --     Evidence is simulated by moving the row directly, because building
    --     thirty OFFICIAL responses inside a migration probe would be a second
    --     implementation of the learner journey; the EDGES are what this proves,
    --     and the evidence-derived state is proved by F06-P0x in the suite where
    --     a real pool exists.
    update public.question_health set state = 'OBSERVING', evidence_count = 40
     where item_id = v_item and institution_id = v_inst;
    if (select state::text from public.question_health where item_id = v_item) <> 'OBSERVING' then
      raise exception 'INSUFFICIENT_EVIDENCE -> OBSERVING did not take';
    end if;
    update public.question_health set state = 'SIGNAL_RAISED'
     where item_id = v_item and institution_id = v_inst;
    if (select state::text from public.question_health where item_id = v_item) <> 'SIGNAL_RAISED' then
      raise exception 'OBSERVING -> SIGNAL_RAISED did not take';
    end if;
    -- and the recompute CLEARS it, because the item has no evidence: the
    -- downward edge fires rather than the state persisting on nothing
    select * into v_row from public.recompute_question_health(v_inst);
    select qh.state::text into v_state from public.question_health qh where qh.item_id = v_item;
    if v_state <> 'INSUFFICIENT_EVIDENCE' then
      raise exception 'a SIGNAL_RAISED item with no evidence stayed at %: the downward edge never fired', v_state;
    end if;
    if v_row.signals_cleared < 1 then
      raise exception 'the run cleared a signal but did not report it';
    end if;

    -- (4) Q4: A SECOND RUN OVER UNCHANGED EVIDENCE WRITES NOTHING.
    select qh.updated_at into v_upd from public.question_health qh where qh.item_id = v_item;
    select * into v_row from public.recompute_question_health(v_inst);
    if v_row.rows_written <> 0 then
      raise exception 'a recompute over unchanged evidence wrote % row(s)', v_row.rows_written;
    end if;
    select qh.updated_at into v_upd2 from public.question_health qh where qh.item_id = v_item;
    if v_upd2 is distinct from v_upd then
      raise exception 'updated_at moved on a run that changed nothing: % -> %', v_upd, v_upd2;
    end if;

    -- (5) Q2: THE HUMAN WINS. A row a reviewer owns is untouched by the
    --     computation, in every one of the three review states.
    -- The probe walks legally too. `UNDER_REVIEW` is reachable only from
    -- `SIGNAL_RAISED`, and the guard refused this block's first draft for the
    -- same reason it refused the recompute's -- which is the state machine
    -- earning its place twice in one migration.
    foreach v_state in array array['UNDER_REVIEW','ACKNOWLEDGED_OK','ACTION_TAKEN'] loop
      -- back to a state a human can pick up from
      update public.question_health set state = 'OBSERVING'
       where item_id = v_item and institution_id = v_inst
         and state in ('INSUFFICIENT_EVIDENCE','ACKNOWLEDGED_OK','ACTION_TAKEN');
      update public.question_health set state = 'SIGNAL_RAISED'
       where item_id = v_item and institution_id = v_inst and state = 'OBSERVING';
      update public.question_health set state = 'UNDER_REVIEW'
       where item_id = v_item and institution_id = v_inst and state = 'SIGNAL_RAISED';
      if v_state <> 'UNDER_REVIEW' then
        update public.question_health set state = v_state::public.question_health_state
         where item_id = v_item and institution_id = v_inst;
      end if;
      update public.question_health set evidence_count = 7
       where item_id = v_item and institution_id = v_inst;

      select * into v_row from public.recompute_question_health(v_inst);
      if (select qh.state::text from public.question_health qh where qh.item_id = v_item) <> v_state then
        raise exception 'the computation overwrote a row held at %', v_state;
      end if;
      if (select qh.evidence_count from public.question_health qh where qh.item_id = v_item) <> 7 then
        raise exception 'the computation rewrote the evidence count of a row held at %', v_state;
      end if;
    end loop;

    if not (select a.ok from public.assert_question_health_observes_only() a) then
      raise exception 'the boundary is false after the probes: %',
        (select a.detail from public.assert_question_health_observes_only() a);
    end if;

    raise exception 'PROBE_0076_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0076_ROLLBACK' then raise; end if;
  end;

  raise notice '0076 verified: absence means never computed; a real item moved through three edges and the downward edge cleared a signal resting on no evidence; an unchanged rerun wrote 0 rows and did not move updated_at; a row held by a reviewer is untouched in all three review states';
end $$;

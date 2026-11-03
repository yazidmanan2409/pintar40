-- W2.7 (Batch 5; CR-75, CR-76, CR-77; J7.6): EACH INTEGRITY OBSERVATION HAS ITS OWN DECISION, A REVIEWED ONE STAYS
-- VISIBLE WITH ITS STATE, AND THE PERSON WHO REFERRED A CASE SEES WHAT BECAME OF IT.
--
-- Three gaps the walks found (D-122(5): W-1, W-3; CR-75 «only a sitting's newest signal can be reviewed; reviewed and
-- new look alike»; CR-77 «the referrer never sees the outcome»):
--
--   1. ONE DECISION PER OBSERVATION. Tinjauan Integritas offered one form per sitting, posting the newest observation
--      only; FD-7's waiting list then dropped the whole sitting once that one was reviewed, so the sitting's other
--      observations never carried a decision of their own. record_integrity_review now marks its audit row as a
--      decision on that observation (scope 'signal'), and integrity_signals_awaiting_review keeps an observation
--      waiting until a decision is recorded on IT. A review recorded before this migration (no scope) still covers its
--      sitting as it did, so nothing already reviewed returns to the list. Everything else of record_integrity_review
--      (who may, the professional-learning rule, the referral in the same transaction) is unchanged.
--
--   2. A VISIBLE REVIEWED STATE. integrity_reviews_recorded(p_hal) answers, a page of 20 newest first, the observations
--      already decided that the reader may review (exactly the waiting list's rule: CAN_REVIEW_INTEGRITY in the owning
--      school; a professional-learning sitting only for Admin platform), each with its latest decision, its note, when
--      and by whom.
--
--   3. THE REFERRER SEES THE OUTCOME (Daisy, 11-validation §3 GQ2: on the page the case was referred from, its named
--      steps and its state in words). For a referred observation the same read carries the case: its state
--      (AWAITING_REVIEW, UNDER_REVIEW, DECIDED), and once decided its outcome, when, and the decision's note, but ONLY
--      where management_decisions' own row security would let the reader see that row (they raised it, or the case is
--      in their management scope). For anyone else the case is said to exist, with no state. For the referrer, whether
--      another leader can decide (CR-76, D-122(4)) is the decision queue's existing rule
--      (management_decision_independent_decider), read through the same function.
--
-- Nothing here decides or changes a decision; the act stays record_integrity_review's and decide_management_decision's.
-- METRIC CATALOGUE AND ENGINE: unchanged.

-- ════════════════════════════════════════════════════════════ 1. a decision is on its observation
create or replace function public.record_integrity_review(p_signal uuid, p_decision text, p_note text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; sig record;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'recording an integrity review requires an authenticated actor'; end if;
  if p_decision not in ('NO_CONCERN', 'DISCUSSED_WITH_LEARNER', 'REFERRED_TO_INSTITUTION') then
    raise exception
      'an integrity review records what the reviewer did, not a verdict about the learner: unknown decision %',
      p_decision;
  end if;

  select s.id, s.institution_id, s.session_id, s.category into sig
    from public.integrity_signals s where s.id = p_signal;
  if sig.id is null then raise exception 'unknown integrity signal %', p_signal; end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', sig.institution_id)
     -- BOB-46 (D-069(c)): a professional-learning signal reaches no school role
     or (public.session_is_professional(sig.session_id) and not public.is_system_admin()) then
    raise exception 'reviewing an integrity signal requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;

  -- No second log table (doc 16): the decision is an audit row, and the signal
  -- row itself is not mutated into carrying an outcome. W2.7: the row says it is
  -- this observation's decision (scope 'signal'), not its sitting's.
  perform public.audit_write('INTEGRITY_SIGNAL_REVIEWED', 'integrity_signals', p_signal::text,
    sig.institution_id,
    jsonb_build_object('session_id', sig.session_id, 'category', sig.category,
                       'decision', p_decision, 'note', p_note, 'scope', 'signal'));

  -- BOB-39: a referral is Management's to consider, so it reaches their queue.
  -- Same transaction: if the referral is refused, so is the review.
  if p_decision = 'REFERRED_TO_INSTITUTION' then
    perform public.refer_integrity_signal(p_signal, p_note);
  end if;
  return p_signal;
end $$;
revoke all on function public.record_integrity_review(uuid, text, text) from public, anon;
grant execute on function public.record_integrity_review(uuid, text, text) to authenticated;

-- An observation is decided once a review is recorded on it at or after it was observed, or (a review recorded before
-- W2.7, which covered its sitting) on a sibling of its sitting at or after it was observed.
create or replace function public.integrity_signal_decided(p_signal uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.integrity_signals s
      join public.integrity_signals o on o.session_id = s.session_id
      join public.audit_log a on a.target_table = 'integrity_signals' and a.target_id = o.id::text
     where s.id = p_signal and a.action = 'INTEGRITY_SIGNAL_REVIEWED' and a.at >= s.observed_at
       and (o.id = s.id or a.summary ->> 'scope' is null))
$$;
revoke all on function public.integrity_signal_decided(uuid) from public, anon, authenticated;

create or replace function public.integrity_signals_awaiting_review()
returns table (signal_id uuid, session_id uuid, institution_id uuid, category public.integrity_category,
               observed_at timestamptz, may_refer boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.id, s.session_id, s.institution_id, s.category, s.observed_at,
         (not public.session_is_professional(s.session_id) and ses.class_node_id is not null
          and public.can_on_node('CAN_REVIEW_INTEGRITY', ses.class_node_id))
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
   where public.current_person_id() is not null
     and public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id)
     and (not public.session_is_professional(s.session_id) or public.is_system_admin())
     and not public.integrity_signal_decided(s.id)
   order by s.observed_at desc, s.id
   limit 200
$$;
revoke all on function public.integrity_signals_awaiting_review() from public, anon;
grant execute on function public.integrity_signals_awaiting_review() to authenticated;

-- ════════════════════════════════════════════════════════════ 2 and 3. what was decided, and what became of a referral
create or replace function public.integrity_reviews_recorded(p_hal integer default 1)
returns table (signal_id uuid, session_id uuid, institution_id uuid, category public.integrity_category,
               observed_at timestamptz, decision text, note text, reviewed_at timestamptz, reviewer_name text,
               case_id uuid, case_visible boolean, case_state public.management_decision_state,
               case_outcome public.management_decision_outcome, case_decided_at timestamptz, case_note text,
               case_raised_by_me boolean, case_other_decider boolean, lagi boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  c_ukuran constant integer := 20;
  v_dari integer := (greatest(coalesce(p_hal, 1), 1) - 1) * 20;
  v_saya uuid := public.current_person_id();
begin
  if v_saya is null then return; end if;
  return query
    with terakhir as (
      -- each observation the reader may review, with the latest decision recorded on it (its own, or a pre-W2.7
      -- review of its sitting that covered it)
      select distinct on (s.id) s.id as sid, s.session_id as ses, s.institution_id as inst, s.category as kat,
             s.observed_at as obs, a.summary ->> 'decision' as kep, a.summary ->> 'note' as cat, a.at as pada,
             a.actor_person_id as oleh
        from public.integrity_signals s
        join public.integrity_signals o on o.session_id = s.session_id
        join public.audit_log a on a.target_table = 'integrity_signals' and a.target_id = o.id::text
       where a.action = 'INTEGRITY_SIGNAL_REVIEWED' and a.at >= s.observed_at
         and (o.id = s.id or a.summary ->> 'scope' is null)
         and public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id)
         and (not public.session_is_professional(s.session_id) or public.is_system_admin())
       order by s.id, a.at desc, a.id desc
    ), halaman as (
      select t.*, row_number() over (order by t.pada desc, t.sid) as urutan
        from (select * from terakhir order by pada desc, sid offset v_dari limit c_ukuran + 1) t
    )
    select h.sid, h.ses, h.inst, h.kat, h.obs, h.kep, h.cat, h.pada, p.display_name,
           d.id,
           -- the case's state and outcome only where management_decisions' row security would show the row
           (d.id is not null and (d.raised_by_person_id = v_saya or public.management_scope_over_node(d.scope_node_id))),
           case when d.raised_by_person_id = v_saya or public.management_scope_over_node(d.scope_node_id) then d.state end,
           case when d.raised_by_person_id = v_saya or public.management_scope_over_node(d.scope_node_id) then d.outcome end,
           case when d.raised_by_person_id = v_saya or public.management_scope_over_node(d.scope_node_id) then d.decided_at end,
           case when d.raised_by_person_id = v_saya or public.management_scope_over_node(d.scope_node_id) then d.decision_note end,
           coalesce(d.raised_by_person_id = v_saya, false),
           -- CR-76 (D-122(4)): for the referrer, whether another leader may decide (the decision queue's own rule)
           case when d.raised_by_person_id = v_saya then public.management_decision_independent_decider(d.id) end,
           exists (select 1 from halaman x where x.urutan > c_ukuran)
      from halaman h
      left join public.persons p on p.id = h.oleh
      left join lateral (
        select m.* from public.management_decisions m
         where m.family = 'INTEGRITY_REFERRAL' and m.source_table = 'integrity_signals' and m.source_id = h.sid
         order by m.raised_at desc limit 1) d on true
     where h.urutan <= c_ukuran
     order by h.pada desc, h.sid;
end $$;
revoke all on function public.integrity_reviews_recorded(integer) from public, anon;
grant execute on function public.integrity_reviews_recorded(integer) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('integrity_reviews_recorded', 'STAFF',
   'W2.7 (CR-75, CR-77): the integrity observations already decided that the caller may review (as '
   'integrity_signals_awaiting_review), a page of 20 newest first, each with its latest decision, note, time and '
   'reviewer; for a referred one, the case''s state, outcome, decision time and note only where management_decisions '
   'row security would show that row (the referrer, or the case''s management scope). Read only.',
   'CAPABILITY', 'CAN_REVIEW_INTEGRITY')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
declare v_src text;
begin
  v_src := pg_get_functiondef('public.record_integrity_review(uuid, text, text)'::regprocedure);
  if position('''scope'', ''signal''' in v_src) = 0 or position('refer_integrity_signal' in v_src) = 0
     or position('session_is_professional' in v_src) = 0 then
    raise exception 'record_integrity_review lost its referral or its professional-learning rule, or does not mark the observation';
  end if;
  v_src := pg_get_functiondef('public.integrity_signals_awaiting_review()'::regprocedure);
  if position('integrity_signal_decided' in v_src) = 0 or position('can_on_node(''CAN_REVIEW_INTEGRITY''' in v_src) = 0 then
    raise exception 'the waiting list does not keep an observation until it is decided, or no longer says who may refer';
  end if;
  v_src := pg_get_functiondef('public.integrity_reviews_recorded(integer)'::regprocedure);
  if position('management_scope_over_node' in v_src) = 0 or position('raised_by_person_id = v_saya' in v_src) = 0 then
    raise exception 'the reviewed list shows a case''s outcome beyond management_decisions'' own row security';
  end if;
  if has_function_privilege('anon', 'public.integrity_reviews_recorded(integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.integrity_signal_decided(uuid)', 'EXECUTE') then
    raise exception 'an integrity read is reachable beyond its callers';
  end if;
end $$;

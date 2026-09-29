-- BOB-39: «DITERUSKAN KE PIHAK SEKOLAH» REACHES THE DECISION QUEUE (post-login
-- review #2, D-061).
--
-- THE DEFECT. The Studio's «Tinjauan Integritas» records REFERRED_TO_INSTITUTION
-- through record_integrity_review (20260915160000), which writes an audit row
-- and creates nothing, and no code in src/ calls refer_integrity_signal
-- (20260924110000). So /pimpinan's «Keputusan», the Head of Department's and
-- Dean's attention surface, could never fill: «Tidak ada keputusan yang menunggu
-- Anda» was guaranteed whatever was waiting.
--
-- THE CORRECTION, and nothing else. Recording REFERRED_TO_INSTITUTION now
-- creates the INTEGRITY_REFERRAL decision through the existing
-- refer_integrity_signal, in the same transaction as the review: no review
-- without its referral, and no referral without its review. The reviewer's
-- note becomes the decision's raised_note. The referral keeps its own rules:
-- it is idempotent while open (a second referral of the same open signal is
-- the same decision), and it asks for CAN_REVIEW_INTEGRITY over the signal's
-- class node, so a referral by a reviewer whose role does not reach that class
-- is refused as a whole, review included. NO_CONCERN and DISCUSSED_WITH_LEARNER
-- are unchanged and create nothing.
--
-- The function body is 20260915160000's, re-emitted with that one call added;
-- every refusal, the audit row and the grants are as they were. No new family,
-- table, column or screen.
--
-- D-060: nothing grades, assembles or computes a metric.

create or replace function public.record_integrity_review(p_signal uuid, p_decision text, p_note text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
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
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', sig.institution_id) then
    raise exception 'reviewing an integrity signal requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;

  -- No second log table (doc 16): the decision is an audit row, and the signal
  -- row itself is not mutated into carrying an outcome.
  perform public.audit_write('INTEGRITY_SIGNAL_REVIEWED', 'integrity_signals', p_signal::text,
    sig.institution_id,
    jsonb_build_object('session_id', sig.session_id, 'category', sig.category,
                       'decision', p_decision, 'note', p_note));

  -- BOB-39: a referral is Management's to consider, so it reaches their queue.
  -- Same transaction: if the referral is refused, so is the review.
  if p_decision = 'REFERRED_TO_INSTITUTION' then
    perform public.refer_integrity_signal(p_signal, p_note);
  end if;
  return p_signal;
end $$;
revoke all on function public.record_integrity_review(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_integrity_review(uuid, text, text) to authenticated;

update public.client_rpc_registry
   set note = 'Records a CAN_REVIEW_INTEGRITY holder''s decision as an audit row. The three decisions '
              'describe what the reviewer did; none is a finding about the learner, and no outcome is '
              'written back onto the signal or onto any result. REFERRED_TO_INSTITUTION also raises the '
              'INTEGRITY_REFERRAL decision through refer_integrity_signal, in the same transaction (BOB-39).'
 where function_name = 'record_integrity_review';

-- ─────────────────────────────────────────────── terminal verification
do $$
declare v text;
begin
  v := pg_get_functiondef('public.record_integrity_review(uuid,text,text)'::regprocedure);
  if v !~ 'perform public\.refer_integrity_signal\(p_signal, p_note\)' then
    raise exception 'BOB-39: a referral does not reach the decision queue';
  end if;
  if v ~* 'update public\.integrity_signals|insert into public\.integrity' then
    raise exception 'BOB-39: the integrity review mutates the signal or writes a second log';
  end if;
  if has_function_privilege('anon', 'public.record_integrity_review(uuid,text,text)', 'execute') then
    raise exception 'BOB-39: anon can call record_integrity_review';
  end if;
end $$;

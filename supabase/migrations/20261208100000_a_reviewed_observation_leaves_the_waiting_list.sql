-- FD-7 (D-127 §3, CR-89; DG-32): A REVIEWED OBSERVATION LEAVES THE WAITING LIST, AND NO REFUSED ACT IS OFFERED.
--
-- Tinjauan Integritas read integrity_signals directly: the newest fifty, reviewed or not. record_integrity_review
-- writes its decision as an audit row and, by design (doc 16), never mutates the signal into carrying an outcome. So
-- nothing ever left the list, and its sentence «Tidak ada catatan yang menunggu tinjauan» could never be true once
-- one sitting had been observed. And the form offered «Diteruskan ke pihak sekolah» on every observation, which the
-- server refuses for a professional-learning sitting (D-069(c), PD_SIGNAL_NOT_REFERRED) and for a class outside the
-- reviewer's department (refer_integrity_signal asks CAN_REVIEW_INTEGRITY over the class itself, D-062(d)).
--
-- integrity_signals_awaiting_review() is the list's one read:
--   * it answers exactly what record_integrity_review would accept from this person: CAN_REVIEW_INTEGRITY in the
--     owning school, and a professional-learning sitting only for Admin platform (D-070(i));
--   * an observation waits until a review is recorded on its sitting at or after the moment it was observed. The
--     reviewer reviews a sitting (the page groups its observations), so one review takes the sitting's observations
--     off the list; an observation made after that review waits again;
--   * may_refer says whether this person may pass it to the school: never for a professional-learning sitting, and
--     only with CAN_REVIEW_INTEGRITY over the sitting's own class.
-- Nothing here writes. The decision, the audit row and the referral are record_integrity_review's, unchanged.

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
     and not exists (
       select 1 from public.integrity_signals o
         join public.audit_log a on a.target_table = 'integrity_signals' and a.target_id = o.id::text
        where o.session_id = s.session_id and a.action = 'INTEGRITY_SIGNAL_REVIEWED' and a.at >= s.observed_at)
   order by s.observed_at desc, s.id
   limit 200
$$;
revoke all on function public.integrity_signals_awaiting_review() from public, anon;
grant execute on function public.integrity_signals_awaiting_review() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('integrity_signals_awaiting_review', 'STAFF',
   'FD-7: the integrity observations still waiting for a human review, exactly those record_integrity_review would '
   'accept from the caller (CAN_REVIEW_INTEGRITY in the owning school; a professional-learning sitting only for Admin '
   'platform); an observation leaves once a review is recorded on its sitting at or after it was observed; may_refer '
   'says whether the caller may pass it to the school. Read only.', 'CAPABILITY', 'CAN_REVIEW_INTEGRITY')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ════════════════════════════════════════════════════════════ verification (structure only, ADR-0003)
do $$
declare v_src text := pg_get_functiondef('public.integrity_signals_awaiting_review()'::regprocedure);
begin
  if position('INTEGRITY_SIGNAL_REVIEWED' in v_src) = 0 or position('session_is_professional' in v_src) = 0
     or position('can_on_node(''CAN_REVIEW_INTEGRITY''' in v_src) = 0 then
    raise exception 'the waiting list does not drop reviewed sittings or does not say who may refer';
  end if;
  if has_function_privilege('anon', 'public.integrity_signals_awaiting_review()', 'EXECUTE') then
    raise exception 'the waiting list is reachable without signing in';
  end if;
end $$;

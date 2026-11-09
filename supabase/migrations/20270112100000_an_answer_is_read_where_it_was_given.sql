-- ---------------------------------------------------------------------------
-- SYSTEM INTEGRITY GATE, CHAIN D (owner, 9 Nov): AN ANSWER IS READ WHERE IT WAS GIVEN.
--
-- Found by audit/integritas-peran.mjs (P0-3): the Kepala departemen of IPA, signed in as herself, read 48 answers
-- given in Kelas 5D's Matematika sittings straight from public.responses, while public.assessment_results gave her
-- none of the same sittings' results.
--
-- R6 (20260924100000_an_administrator_is_not_an_examiner.sql) corrected THE WRONG AXIS on the result row:
-- `can_in_institution` asks whether the caller holds a capability ANYWHERE in the school, when the question is
-- whether the caller stands over the place the evidence was produced. The session carries `class_node_id`, and
-- `can_on_node` answers that question by the same containment every boundary uses. R6 moved assessment_results;
-- integrity_signals_awaiting_review followed (20261208100000). Four rows of the same evidence kept the flat shape:
--
--   responses         the learner's answers, from which the result is scored
--   presented_items   the questions each learner was shown, in order
--   integrity_signals the observations on a sitting (the waiting list is scoped; the table was not)
--   lesson_progress   how far a learner read each lesson (CAN_ASSIGN_LEARNING anywhere in the school)
--
-- So a head of a sibling department, or a Guru of another class, could read per-learner evidence their own reports
-- and lists withhold from them. This migration applies R6's axis, and only its axis, to those four policies:
--
--   * the learner keeps their own rows, first and untouched;
--   * a professional-learning sitting keeps its own branch exactly as 20261118100000 wrote it;
--   * an academic sitting is readable by CAN_REVIEW_INTEGRITY over its class (responses, presented_items,
--     integrity_signals), as integrity_signals_awaiting_review already reads it; a sitting with no class has no
--     organizational home and is readable by its learner only (R6's fail-closed direction);
--   * lesson progress is readable by CAN_ASSIGN_LEARNING over a class the learner is or was a member of in that
--     school (the teacher who taught them keeps what they saw; a teacher of another class does not).
--
-- WHAT DELIBERATELY DOES NOT MOVE:
--   * R6's second correction (which ROLE may read) is not extended: the Admin sekolah holds CAN_REVIEW_INTEGRITY by
--     the role catalogue and stands at the school's root, so they keep reading answers for integrity review. Whether
--     that should change is a policy question for the owner, recorded in the System Integrity Matrix, not decided here.
--   * assessment_sessions' row (status and timestamps, no answer and no mark) stays school-wide for CAN_ASSIGN_LEARNING
--     and CAN_REVIEW_INTEGRITY: the teacher's own pages read it through row security. Recorded for Sharon's review.
--   * No product function changes. Every reader of these tables is SECURITY DEFINER (checked at this migration) and
--     no view over them is granted to authenticated, so no screen reads them through these policies.
-- ---------------------------------------------------------------------------

drop policy responses_select on public.responses;
create policy responses_select on public.responses for select to authenticated using (
  exists (select 1 from public.assessment_sessions s
           where s.id = responses.session_id
             and (s.person_id = public.current_person_id()
                  or case when public.release_is_professional(s.plp_release_id)
                          then public.is_system_admin()
                          else s.class_node_id is not null
                               and public.can_on_node('CAN_REVIEW_INTEGRITY', s.class_node_id) end)));

drop policy presented_items_select on public.presented_items;
create policy presented_items_select on public.presented_items for select to authenticated using (
  exists (select 1 from public.assessment_sessions s
           where s.id = presented_items.session_id
             and (s.person_id = public.current_person_id()
                  or case when public.release_is_professional(s.plp_release_id)
                          then public.is_system_admin()
                          else s.class_node_id is not null
                               and public.can_on_node('CAN_REVIEW_INTEGRITY', s.class_node_id) end)));

drop policy integrity_signals_select on public.integrity_signals;
create policy integrity_signals_select on public.integrity_signals for select to authenticated using (
  case when public.session_is_professional(session_id)
       then public.is_system_admin()
       else exists (select 1 from public.assessment_sessions s
                     where s.id = integrity_signals.session_id and s.class_node_id is not null
                       and public.can_on_node('CAN_REVIEW_INTEGRITY', s.class_node_id)) end);

drop policy lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select to authenticated using (
  person_id = public.current_person_id()
  or case when public.release_is_professional(plp_release_id)
          then public.professional_progress_readable(person_id, plp_release_id, institution_id)
          else exists (select 1 from public.memberships m
                         join public.enrollments e on e.id = m.enrollment_id
                        where e.person_id = lesson_progress.person_id
                          and e.institution_id = lesson_progress.institution_id
                          and public.can_on_node('CAN_ASSIGN_LEARNING', m.node_id)) end);

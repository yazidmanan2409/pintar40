-- ---------------------------------------------------------------------------------------------------------------
-- Z · D-6 (R-17; ruling 55; Sharon's recommendation; Bob 23 Nov, Z-PLAN-APPROVAL.md 40a87d25): THE ANONYMOUS
-- FEEDBACK ROUND IS DARK. Learners rate a named educator through it, which is educator-related evidence 4.5-07 will
-- protect, and it was reachable (nine RPCs granted to authenticated; links from /belajar, /mengajar/[kelas] and
-- /pimpinan/[simpul]). The owner authorised two read-only counts: production and staging both hold 0 feedback rounds
-- and 0 results. Red first: Z-D6-01.
--
--   * EXECUTE is revoked from public, anon and authenticated on all nine: the five writes (open_feedback_cycle,
--     submit_feedback, close_feedback_cycle, publish_feedback_question_set, publish_feedback_threshold) and the four
--     reads (feedback_questionnaire, my_feedback_cycles, feedback_subjects_for_class, feedback_result). service_role
--     keeps its grant; no client reaches it.
--   * NOTHING IS DROPPED AND NO ROW IS TOUCHED: every table, row, function and registry row stays exactly as it is.
--   * RESTORE PATH (a ruling, not a migration): `grant execute on function <each of the nine, with its signature
--     below> to authenticated;` and set UMPAN_BALIK_TERBUKA = true in src/lib/umpanbalik-kontrak.ts, which brings the
--     links and the routes back. The registry rows are unchanged, so nothing else moves.
-- ---------------------------------------------------------------------------------------------------------------

revoke execute on function public.open_feedback_cycle(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.submit_feedback(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.close_feedback_cycle(uuid) from public, anon, authenticated;
revoke execute on function public.publish_feedback_question_set(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.publish_feedback_threshold(text, integer, text, text) from public, anon, authenticated;
revoke execute on function public.feedback_questionnaire(uuid) from public, anon, authenticated;
revoke execute on function public.my_feedback_cycles() from public, anon, authenticated;
revoke execute on function public.feedback_subjects_for_class(uuid) from public, anon, authenticated;
revoke execute on function public.feedback_result(uuid) from public, anon, authenticated;

do $$
declare v text;
begin
  select string_agg(p.oid::regprocedure::text, ', ') into v
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname in ('open_feedback_cycle', 'submit_feedback', 'close_feedback_cycle', 'publish_feedback_question_set',
                       'publish_feedback_threshold', 'feedback_questionnaire', 'my_feedback_cycles',
                       'feedback_subjects_for_class', 'feedback_result')
     and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute'));
  if v is not null then raise exception 'Z D-6: still executable by a client: %', v; end if;
  if (select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace
        and p.proname in ('open_feedback_cycle', 'submit_feedback', 'close_feedback_cycle', 'publish_feedback_question_set',
                          'publish_feedback_threshold', 'feedback_questionnaire', 'my_feedback_cycles',
                          'feedback_subjects_for_class', 'feedback_result')) <> 9 then
    raise exception 'Z D-6: a feedback function is missing; nothing is to be dropped';
  end if;
end $$;

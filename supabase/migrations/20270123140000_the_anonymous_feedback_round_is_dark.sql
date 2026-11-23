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
--   * CORRECTED IN PLACE (undeployed; Sharon Z2-1, Z2-8614bd26.md; Bob 11:29Z): authenticated also held SELECT on
--     feedback_cycles and feedback_opportunities (20260930100000:322 and :383), so the round's rows stayed readable
--     under their row security. SELECT is revoked on both from anon and authenticated; no feedback table is readable
--     by a client, asserted below. No row is touched.
--   * RESTORE PATH (a ruling, not a migration): `grant execute on function <each of the nine, with its signature
--     below> to authenticated;`, then `grant select on public.feedback_cycles to authenticated;` and
--     `grant select on public.feedback_opportunities to authenticated;`, and set UMPAN_BALIK_TERBUKA = true in
--     src/lib/umpanbalik-kontrak.ts, which brings the links and the routes back. The registry rows are unchanged, so
--     nothing else moves; docs/audit/launch-readiness.sql's G7 pins are restored with them.
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
-- CORRECTED IN PLACE (undeployed; Sharon Z2-1): the round's two client-readable tables
revoke select on public.feedback_cycles from anon, authenticated;
revoke select on public.feedback_opportunities from anon, authenticated;

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
  -- CORRECTED IN PLACE (undeployed; Sharon Z2-1): no feedback relation is readable by a client, whole or by column
  select string_agg(c.relname || '(' || r.peran || ')', ', ' order by c.relname) into v
    from pg_class c cross join (values ('anon'), ('authenticated')) r(peran)
   where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'v', 'm', 'p', 'f') and c.relname like 'feedback%'
     and (has_table_privilege(r.peran, c.oid, 'select') or has_any_column_privilege(r.peran, c.oid, 'select'));
  if v is not null then raise exception 'Z D-6: feedback relations still readable by a client: %', v; end if;
end $$;

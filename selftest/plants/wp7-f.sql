-- wp7-f — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 6. P-F, EVIDENCE CONTAMINATION. A calculator starts counting feedback
--    rows, so a class's anonymous answers become a number in an academic
--    report. Planted in a REAL consumer rather than in a new function,
--    which is what the assertion's named-consumer set exists to catch.
-- P-F EVIDENCE CONTAMINATION: a calculator starts reading feedback, so a
-- class's anonymous answers become a number in an academic report.
create or replace function public.calc_class_participants(p_node uuid, p_institution uuid, p_catalogue text)
returns jsonb language sql stable set search_path = public, pg_temp as $f$
  select jsonb_build_object(
    'value', (select count(distinct s.person_id) from public.scoped_official_sessions s
               where s.institution_id = p_institution and s.class_node_id = p_node)
           + (select count(*) from public.feedback_responses r
               join public.feedback_cycles c on c.id = r.cycle_id
              where c.scope_node_id = p_node),
    'sample', (select count(distinct s.person_id) from public.scoped_official_sessions s
                where s.institution_id = p_institution and s.class_node_id = p_node))
$f$;

-- wp7-e — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 5. P-E, SUBJECT CONTROL. The gate becomes CAN_ASSIGN_LEARNING -- the
--    briefing gate, which an EDUCATOR holds -- and the constraint that makes
--    self-opening unrepresentable is dropped with it. Both halves, because
--    either one alone would still be refused by the other.
-- P-E SUBJECT CONTROL: the gate becomes CAN_ASSIGN_LEARNING, which the
-- subject holds, and nothing stops them naming themselves.
alter table public.feedback_cycles drop constraint feedback_cycles_subject_is_not_the_opener;
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.open_feedback_cycle(uuid,uuid)'::regprocedure);
  src := replace(orig, 'not public.management_scope_over_node(p_node)',
                       'not public.can_on_node(''CAN_ASSIGN_LEARNING'', p_node)');
  src := replace(src, 'if p_subject_person_id = v_me then',
                      'if false and p_subject_person_id = v_me then');
  if src = orig then raise exception 'the plant did not reach the open body'; end if;
  execute src;
end $d$;

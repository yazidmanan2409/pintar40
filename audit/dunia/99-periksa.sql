-- Ruling 79's audit world (track 3c), the last part: the load's own checks, in the same transaction, so a world that
-- fails one is never left behind.
--   * Every guard trigger a world part disabled is ENABLED again (Bob, W4: pg_trigger.tgenabled = 'O').
do $$
declare t record;
begin
  for t in select c.relname, g.tgname, g.tgenabled from pg_trigger g join pg_class c on c.oid = g.tgrelid
            where (c.relname, g.tgname) in (('assessment_assignments', 'assessment_assignments_the_pass_mark_is_sealed'),
                                            ('assessment_results', 'assessment_results_write')) loop
    if t.tgenabled <> 'O' then raise exception 'dunia: the guard % on % is not enabled again (%)', t.tgname, t.relname, t.tgenabled; end if;
  end loop;
  if (select count(*) from pg_trigger g join pg_class c on c.oid = g.tgrelid
       where (c.relname, g.tgname) in (('assessment_assignments', 'assessment_assignments_the_pass_mark_is_sealed'),
                                       ('assessment_results', 'assessment_results_write'))) <> 2 then
    raise exception 'dunia: a guard trigger the world names is missing';
  end if;
  raise notice 'dunia: checks passed (every disabled guard is enabled again)';
end $$;

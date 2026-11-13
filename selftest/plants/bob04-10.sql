-- bob04-10 — C1w F-1 ROW 1 UNDONE. The class's misconception view (the source of class.misconceptions) counts an answer
-- as a misconception by the SEALED key again, as it did before 20270117100000: a corrected sitting is still counted by
-- the key the correction replaced.
do $$
declare v text := pg_get_viewdef('public.service_cohort_misconceptions'::regclass);
        v_in text := 'NOT COALESCE((o.label = ANY (kb.kunci)), o.is_correct)';
begin
  if position(v_in in v) = 0 then raise exception 'bob04-10: the cohort view does not read the key in force where it did'; end if;
  execute 'create or replace view public.service_cohort_misconceptions as ' || replace(v, v_in, 'NOT o.is_correct');
end $$;

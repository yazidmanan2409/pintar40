-- DELIBERATE DEFECT — TEST ONLY. This migration must never be merged.
--
-- FABLE-01 acceptance evidence (doc 16 §5): proves the pull-request pipeline
-- rejects a prohibited schema change before it reaches main. The policy below
-- is a permissive production RLS policy — USING (true) lets every
-- authenticated role read every row of public.persons, defeating INV-13
-- tenant isolation and the doc 05 student-scope rule.
--
-- Expected detections, both already in the contract:
--   * F01-S02  — no USING/WITH CHECK (true) in any migration or seed
--   * F01-T13  — schema lint counter policies_using_true must be 0
--
-- The branch carrying this commit exists only to be rejected. It is closed
-- without merging and the branch is deleted once CI has gone red.

create policy fable01_broken_pr_check on public.persons
  for select to authenticated
  using (true);

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'persons'
       and policyname = 'fable01_broken_pr_check'
  ) then
    raise exception 'deliberate defect not installed: fable01_broken_pr_check missing';
  end if;
end $$;

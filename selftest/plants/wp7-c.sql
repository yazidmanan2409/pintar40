-- wp7-c — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 3. P-C, RAW SELECT. A grant and a permissive policy, which is how the
--    answers would actually become readable: not through a new endpoint but
--    by someone making the table behave like every other table.
-- P-C RAW SELECT: ordinary authenticated clients may read the answers.
grant select on public.feedback_responses to authenticated;
create policy feedback_responses_red_case on public.feedback_responses
  for select to authenticated using (true);

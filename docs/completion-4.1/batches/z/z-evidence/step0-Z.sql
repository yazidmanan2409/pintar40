-- Z step 0 (Bob's delta §3) · READ ONLY, run on staging BEFORE the promotion and before the BEFORE read.
-- Every count must be 0. Otherwise stop and report: K-07 (20270123120000) would leave that floor NOT VALID, so
-- Sharon's C4 (preservation line 84 all true) could not be met. The owner decides.
begin transaction read only;
select 'school_pass_marks below 1..100' as what, count(*) as n from public.school_pass_marks where not (percent >= 1 and percent <= 100)
union all
select 'assessment_assignments below 0.01..1', count(*) from public.assessment_assignments where pass_mark is not null and not (pass_mark >= 0.01 and pass_mark <= 1)
union all
select 'assessment_sessions below 0.01..1', count(*) from public.assessment_sessions where pass_mark is not null and not (pass_mark >= 0.01 and pass_mark <= 1);
rollback;

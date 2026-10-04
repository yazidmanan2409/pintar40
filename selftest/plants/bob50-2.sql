-- bob50-2 — THE LINT FORGETS THE UJI CEPAT. assert_mode_policy_complete is put back to its 20260914093000 list, without QUICK.
-- Derived from pg_enum, so a tenth mode fails the build rather than defaulting.
create or replace function public.assert_mode_policy_complete()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n int;
begin
  select string_agg(e.enumlabel::text, ', ' order by e.enumsortorder) into bad
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'assessment_mode'
     and not exists (select 1 from public.mode_policy m where m.mode::text = e.enumlabel::text);
  if bad is not null then problems := problems || ('mode(s) with no policy row: ' || bad); end if;

  -- a mode that certifies must be a formal stage: practice never certifies,
  -- and a diagnostic pre-test is a starting point, not an achievement (§8)
  select string_agg(m.mode::text, ', ') into bad from public.mode_policy m
   where m.certifies and m.mode::text in ('PRE_TEST','PRACTICE','PUBLIC_DEMO');
  if bad is not null then problems := problems || ('mode(s) certifying that must not: ' || bad); end if;

  -- EXAM tier is reachable only from EXAM and PAPER
  select string_agg(m.mode::text, ', ') into bad from public.mode_policy m
   where m.max_bank_tier = 'EXAM' and m.mode::text not in ('EXAM','PAPER');
  if bad is not null then problems := problems || ('mode(s) reaching the EXAM bank tier (INV-12): ' || bad); end if;

  -- an exam offers no assistance
  if exists (select 1 from public.mode_policy where mode::text = 'EXAM' and allows_assistance) then
    problems := problems || 'EXAM allows assistance'::text;
  end if;

  select count(*) into n from public.mode_policy;
  ok := array_length(problems, 1) is null;
  detail := case when ok then format('%s mode(s), every enum label carries a policy; no non-formal mode certifies; the EXAM tier is reachable only from EXAM and PAPER', n)
                 else array_to_string(problems, '; ') end;
  return next;
end $$;

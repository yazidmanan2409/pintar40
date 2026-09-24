-- HAPPY-PATH SWEEP -- which client-reachable RPCs have ever run to a
-- SUCCESSFUL RETURN, as opposed to merely having been called or refused.
--
-- WHY THIS EXISTS. `metric_evaluate` shipped in migration 0072 with a dispatch
-- that could never have worked: it built the calculator's name without the
-- prefix every calculator carries, so no metric could be computed. Its
-- verification block had four probes and all four passed -- because all four
-- were REFUSALS, and guards sit before the work. Four probes exercised the
-- function's prefix four times and its body zero times. That is L9.
--
-- THE MECHANISM, measured rather than assumed: `pg_stat_user_functions.calls`
-- counts only calls that RETURNED. A function that raises does not increment
-- it. Verified directly --
--
--     select pr_ok()      -> calls = 1
--     perform pr_raise()  -> calls = 0   (called, raised, not counted)
--
-- so `calls > 0` is evidence of a success path having executed, not merely of
-- the function having been reached.
--
-- HOW TO RUN. `track_functions` must be on BEFORE the migrations replay, or
-- the terminal verification blocks -- which are a real part of CI coverage via
-- `migrations-clean` -- are invisible to it:
--
--     psql -c "alter system set track_functions='all'"   # then reload
--     <replay all migrations into a fresh database>
--     <apply all four seeds>
--     npm run selftest:db
--     psql -f docs/audit/happy-path-sweep.sql "$DB_URL"
--
-- Resetting stats after the replay measures the suite ALONE and overstates the
-- gap by three; that mistake was made once and is why the ordering is written
-- down here.

select pg_stat_force_next_flush();

select r.exposure::text as exposure,
       r.function_name,
       coalesce(s.calls, 0) as successful_returns
  from public.client_rpc_registry r
  left join (select p.proname, sum(st.calls) as calls
               from pg_stat_user_functions st join pg_proc p on p.oid = st.funcid
              group by p.proname) s on s.proname = r.function_name
 order by (coalesce(s.calls, 0) > 0), r.exposure::text, r.function_name;

select count(*) filter (where coalesce(s.calls, 0) > 0)  as success_path_executed,
       count(*) filter (where coalesce(s.calls, 0) = 0)  as never_returned,
       count(*)                                          as registered
  from public.client_rpc_registry r
  left join (select p.proname, sum(st.calls) as calls
               from pg_stat_user_functions st join pg_proc p on p.oid = st.funcid
              group by p.proname) s on s.proname = r.function_name;

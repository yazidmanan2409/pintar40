-- ---------------------------------------------------------------------------
-- A1 · THE SCHEDULER (docs/completion-4.1/batches/A1-COMPLETION.md, blocker 3; the owner's ruling O41-20; the owner's
-- decision after the build, Option A: pg_cron). 20270114100000 built the one function that decides a deadline ending
-- and its service-level entry point, pengerjaan_tutup_terjadwal, and scheduled nothing. This migration schedules it.
--
--   * pg_cron is created where Supabase keeps it (schema pg_catalog; its own tables live in schema cron).
--   * ONE job, by a fixed name, every five minutes: `select public.pengerjaan_tutup_terjadwal()`. It runs as the role
--     that installs it (the database owner), with no signed-in actor and no request claims, which is exactly what the
--     entry point requires (SITTING_JOB_NOT_SERVICE refuses anyone else).
--   * ONE idempotent installer, pengerjaan_jadwal_pasang(): a job of that name is unscheduled first, then scheduled,
--     so installing twice leaves exactly one. This migration calls it; so does the restore procedure, because pg_cron's
--     own tables (cron.job, cron.job_run_details) are the platform's and are not in the application backup: a restored
--     database has the function and no job until the installer has run.
--   * One sitting's failure never stops the rest of a run (20270114100000), and is now also WARNED to the server log
--     with the sitting's id: pg_cron discards a job's return value, so the returned list alone told nobody.
-- The lazy check keeps working without the job; the job only means a sitting nobody touches again is still closed.
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron with schema pg_catalog;

-- The entry point, as 20270114100000 wrote it, plus the warning (one line per run that had a failure).
do $$
declare v_def text := pg_get_functiondef('public.pengerjaan_tutup_terjadwal(integer)'::regprocedure);
        v_old text := E'  return jsonb_build_object(''ok'', true, ''diperiksa'', v_periksa, ''dinilai'', v_nilai, ''menunggu'', v_tunggu, ''gagal'', v_gagal);';
begin
  if position(v_old in v_def) = 0 then raise exception 'A1: pengerjaan_tutup_terjadwal no longer returns where it did'; end if;
  execute replace(v_def, v_old,
    E'  if jsonb_array_length(v_gagal) > 0 then\n'
    || E'    raise warning ''pengerjaan_tutup_terjadwal: % of % sitting(s) could not be closed and will be tried again on the next run: %'',\n'
    || E'      jsonb_array_length(v_gagal), v_periksa, v_gagal;\n'
    || E'  end if;\n' || v_old);
end $$;
revoke all on function public.pengerjaan_tutup_terjadwal(integer) from public, anon, authenticated;
grant execute on function public.pengerjaan_tutup_terjadwal(integer) to service_role;

-- The installer. Owner only: no client, and not the service role (a schedule is changed by a migration or a restore).
create or replace function public.pengerjaan_jadwal_pasang()
returns jsonb
language plpgsql set search_path = public, pg_temp as $$
declare j record; v_id bigint; n int;
begin
  if to_regnamespace('cron') is null then
    raise exception 'A1: pg_cron is not installed in this database; the abandoned-sitting job cannot be scheduled';
  end if;
  for j in select jobid from cron.job where jobname = 'pintar-pengerjaan-tutup-terjadwal' loop
    perform cron.unschedule(j.jobid);
  end loop;
  v_id := cron.schedule('pintar-pengerjaan-tutup-terjadwal', '*/5 * * * *', 'select public.pengerjaan_tutup_terjadwal()');
  select count(*) into n from cron.job where jobname = 'pintar-pengerjaan-tutup-terjadwal';
  if n <> 1 then raise exception 'A1: % job(s) named pintar-pengerjaan-tutup-terjadwal after installing, expected exactly one', n; end if;
  return jsonb_build_object('ok', true, 'jobid', v_id, 'jobname', 'pintar-pengerjaan-tutup-terjadwal', 'schedule', '*/5 * * * *');
end $$;
revoke all on function public.pengerjaan_jadwal_pasang() from public, anon, authenticated, service_role;

select public.pengerjaan_jadwal_pasang();

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only.
-- ---------------------------------------------------------------------------
do $$
declare n int; j record;
begin
  select count(*) into n from cron.job where jobname = 'pintar-pengerjaan-tutup-terjadwal';
  if n <> 1 then raise exception 'A1: % job(s) named pintar-pengerjaan-tutup-terjadwal, expected exactly one', n; end if;
  select * into j from cron.job where jobname = 'pintar-pengerjaan-tutup-terjadwal';
  if j.schedule <> '*/5 * * * *' or j.command <> 'select public.pengerjaan_tutup_terjadwal()' or not j.active then
    raise exception 'A1: the scheduled job is not the five-minute call of the entry point (%, %)', j.schedule, j.command;
  end if;
  if j.database <> current_database() then raise exception 'A1: the job runs in % and not in this database', j.database; end if;
  if not has_function_privilege(j.username, 'public.pengerjaan_tutup_terjadwal(integer)', 'execute') then
    raise exception 'A1: the job''s role (%) may not call the entry point', j.username;
  end if;
  if has_function_privilege('authenticated', 'public.pengerjaan_tutup_terjadwal(integer)', 'execute')
     or has_function_privilege('anon', 'public.pengerjaan_tutup_terjadwal(integer)', 'execute') then
    raise exception 'A1: a client can call the scheduler''s entry point';
  end if;
  if has_function_privilege('authenticated', 'public.pengerjaan_jadwal_pasang()', 'execute')
     or has_function_privilege('anon', 'public.pengerjaan_jadwal_pasang()', 'execute')
     or has_function_privilege('service_role', 'public.pengerjaan_jadwal_pasang()', 'execute') then
    raise exception 'A1: a client or the service role can change the schedule';
  end if;
  if has_schema_privilege('authenticated', 'cron', 'usage') or has_schema_privilege('anon', 'cron', 'usage') then
    raise exception 'A1: a client role reaches the scheduler''s schema';
  end if;
  raise notice 'A1 verified: one job, every five minutes, calls pengerjaan_tutup_terjadwal as %', j.username;
end $$;

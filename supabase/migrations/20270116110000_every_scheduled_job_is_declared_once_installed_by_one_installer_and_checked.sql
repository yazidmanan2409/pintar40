-- ---------------------------------------------------------------------------
-- B1 · ONE JOB INSTALLER (THE PLAN §6.3; B1-COMPLETION.md, Sharon's condition «shared installer»; C1w finding F-8,
-- THE PLAN §7.7). A1 scheduled its job through its own installer (pengerjaan_jadwal_pasang, 20270114110000). B1 adds a
-- second job, the daily twelve-month purge of the sign-in record (20270116100000). The rule: every PINTAR job is
-- declared once and installed by one installer, and no later batch adds a job outside it.
--
--   * THE DECLARATION, pintar_jadwal_daftar(): each job's name, schedule and command, and nothing else. Today:
--       pintar-pengerjaan-tutup-terjadwal  */5 * * * *   select public.pengerjaan_tutup_terjadwal()   (A1, unchanged)
--       pintar-akuntabilitas-buang-lama    17 19 * * *   select public.akuntabilitas_buang_lama()     (B1; 02.17 WIB daily)
--   * THE INSTALLER, pintar_jadwal_pasang(): idempotent. For each declared job, a job of that name is unscheduled first
--     and then scheduled, so installing twice leaves exactly one of each. Owner only (no client, not the service role):
--     a schedule is changed by a migration or a restore. A1's installer, pengerjaan_jadwal_pasang(), becomes a call to it
--     (same name, same answer for A1's job), so whatever already calls it installs every job.
--   * THE HEALTH READ, pintar_periksa_kesehatan(): compares the declaration with cron.job and names each declared job
--     that is missing, or present but different (schedule, command, inactive, another database, more than one), and
--     each pintar-* job that is not declared; and it reports the sign-in record's counted write failures of the last
--     seven days (src/app/api/_akuntabilitas/catat.ts fails open and counts). ok only when nothing is missing or different and the
--     count is zero. Owner only.
--   * RECOVERY: pg_cron's own tables are the platform's and are not in the application backup (backup.mjs), so a
--     restored database has the functions and no job. restore-bundle.mjs runs the shared installer and then checks
--     every declared job; after a NATIVE Supabase restore, which bypasses that procedure (F-8), the runbook's step 1
--     runs the installer and the health read as postgres (docs/recovery/RUNBOOK-NATIVE-RESTORE.md).
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron with schema pg_catalog;

-- The declaration: every PINTAR job, its name, its schedule (UTC, as pg_cron reads it) and its command.
create or replace function public.pintar_jadwal_daftar()
returns table (jobname text, schedule text, command text)
language sql immutable set search_path = public, pg_temp as $$
  values ('pintar-pengerjaan-tutup-terjadwal', '*/5 * * * *', 'select public.pengerjaan_tutup_terjadwal()'),
         ('pintar-akuntabilitas-buang-lama', '17 19 * * *', 'select public.akuntabilitas_buang_lama()')
$$;
revoke all on function public.pintar_jadwal_daftar() from public, anon, authenticated, service_role;

-- The one installer.
create or replace function public.pintar_jadwal_pasang()
returns jsonb
language plpgsql set search_path = public, pg_temp as $$
declare d record; j record; v_id bigint; n int; v_hasil jsonb := '[]'::jsonb;
begin
  if to_regnamespace('cron') is null then
    raise exception 'B1: pg_cron is not installed in this database; PINTAR''s scheduled jobs cannot be installed';
  end if;
  for d in select * from public.pintar_jadwal_daftar() loop
    for j in select c.jobid from cron.job c where c.jobname = d.jobname loop
      perform cron.unschedule(j.jobid);
    end loop;
    v_id := cron.schedule(d.jobname, d.schedule, d.command);
    select count(*) into n from cron.job c where c.jobname = d.jobname;
    if n <> 1 then raise exception 'B1: % job(s) named % after installing, expected exactly one', n, d.jobname; end if;
    v_hasil := v_hasil || jsonb_build_object('jobid', v_id, 'jobname', d.jobname, 'schedule', d.schedule);
  end loop;
  return jsonb_build_object('ok', true, 'jobs', v_hasil);
end $$;
revoke all on function public.pintar_jadwal_pasang() from public, anon, authenticated, service_role;

-- A1's installer, a call to the shared one: the same name and the same answer for A1's own job.
create or replace function public.pengerjaan_jadwal_pasang()
returns jsonb
language plpgsql set search_path = public, pg_temp as $$
declare v jsonb; a jsonb;
begin
  v := public.pintar_jadwal_pasang();
  select x.value into a from jsonb_array_elements(v -> 'jobs') x where x.value ->> 'jobname' = 'pintar-pengerjaan-tutup-terjadwal';
  return jsonb_build_object('ok', true, 'jobid', (a ->> 'jobid')::bigint, 'jobname', a ->> 'jobname', 'schedule', a ->> 'schedule', 'jobs', v -> 'jobs');
end $$;
revoke all on function public.pengerjaan_jadwal_pasang() from public, anon, authenticated, service_role;

-- The health read (F-8): the declaration against cron.job, and the sign-in record's counted write failures.
create or replace function public.pintar_periksa_kesehatan()
returns jsonb
language plpgsql stable set search_path = public, pg_temp as $$
declare d record; v_hilang jsonb := '[]'::jsonb; v_beda jsonb := '[]'::jsonb; v_lain jsonb := '[]'::jsonb; n int; c record;
        v_gagal int; v_terakhir timestamptz;
begin
  select coalesce(sum(f.n), 0)::int, max(f.last_at) into v_gagal, v_terakhir
    from public.accountability_write_failures f where f.day > (now() at time zone 'Asia/Jakarta')::date - 7;
  if to_regclass('cron.job') is null then
    return jsonb_build_object('ok', false, 'pg_cron', false,
      'hilang', (select coalesce(jsonb_agg(x.jobname order by x.jobname), '[]'::jsonb) from public.pintar_jadwal_daftar() x),
      'berbeda', '[]'::jsonb, 'tidak_dideklarasikan', '[]'::jsonb,
      'gagal_tulis_akuntabilitas', jsonb_build_object('n', v_gagal, 'hari', 7, 'terakhir', v_terakhir));
  end if;
  for d in select * from public.pintar_jadwal_daftar() loop
    select count(*) into n from cron.job j where j.jobname = d.jobname;
    if n = 0 then
      v_hilang := v_hilang || to_jsonb(d.jobname);
    else
      select j.* into c from cron.job j where j.jobname = d.jobname order by j.jobid limit 1;
      if n > 1 or c.schedule <> d.schedule or c.command <> d.command or not c.active or c.database <> current_database() then
        v_beda := v_beda || jsonb_build_object('jobname', d.jobname, 'jumlah', n, 'schedule', c.schedule, 'command', c.command,
                                               'active', c.active, 'database', c.database);
      end if;
    end if;
  end loop;
  select coalesce(jsonb_agg(j.jobname order by j.jobname), '[]'::jsonb) into v_lain from cron.job j
   where j.jobname like 'pintar-%' and j.jobname not in (select x.jobname from public.pintar_jadwal_daftar() x);
  return jsonb_build_object(
    'ok', jsonb_array_length(v_hilang) = 0 and jsonb_array_length(v_beda) = 0 and jsonb_array_length(v_lain) = 0 and v_gagal = 0,
    'pg_cron', true, 'hilang', v_hilang, 'berbeda', v_beda, 'tidak_dideklarasikan', v_lain,
    'gagal_tulis_akuntabilitas', jsonb_build_object('n', v_gagal, 'hari', 7, 'terakhir', v_terakhir));
end $$;
revoke all on function public.pintar_periksa_kesehatan() from public, anon, authenticated, service_role;

select public.pintar_jadwal_pasang();

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only.
-- ---------------------------------------------------------------------------
do $$
declare d record; j record; n int; h jsonb;
begin
  for d in select * from public.pintar_jadwal_daftar() loop
    select count(*) into n from cron.job c where c.jobname = d.jobname;
    if n <> 1 then raise exception 'B1: % job(s) named %, expected exactly one', n, d.jobname; end if;
    select * into j from cron.job c where c.jobname = d.jobname;
    if j.schedule <> d.schedule or j.command <> d.command or not j.active or j.database <> current_database() then
      raise exception 'B1: the job % is not as declared (%, %)', d.jobname, j.schedule, j.command;
    end if;
  end loop;
  if (select count(*) from public.pintar_jadwal_daftar()) <> 2 then raise exception 'B1: the declaration does not hold both jobs'; end if;
  h := public.pintar_periksa_kesehatan();
  if jsonb_array_length(h -> 'hilang') <> 0 or jsonb_array_length(h -> 'berbeda') <> 0 then
    raise exception 'B1: the health read finds the jobs it just installed missing or different: %', h;
  end if;
  if has_function_privilege('authenticated', 'public.akuntabilitas_buang_lama(integer)', 'execute')
     or has_function_privilege('anon', 'public.akuntabilitas_buang_lama(integer)', 'execute') then
    raise exception 'B1: a client can call the purge';
  end if;
  if has_function_privilege('service_role', 'public.pintar_jadwal_pasang()', 'execute')
     or has_function_privilege('authenticated', 'public.pintar_jadwal_pasang()', 'execute')
     or has_function_privilege('service_role', 'public.pengerjaan_jadwal_pasang()', 'execute')
     or has_function_privilege('authenticated', 'public.pintar_periksa_kesehatan()', 'execute') then
    raise exception 'B1: a client or the service role can change or read the schedule';
  end if;
  raise notice 'B1 verified: both declared jobs installed once by the one installer; the health read agrees';
end $$;

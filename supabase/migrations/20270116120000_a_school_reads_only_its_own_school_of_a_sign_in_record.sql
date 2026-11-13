-- ---------------------------------------------------------------------------
-- B1 · CORRECTION (Sharon's result review at 40e89308, blocked on one defect; the coordinator's correction pass).
--
--   * THE DEFECT: akuntabilitas_baca returned a row's whole school snapshot (institution_ids) to a school's
--     administrator, so a school read the other schools a person was live at. The snapshot stays as stored (it decides
--     who reads a row, and it is the record's history); what a school's administrator is SHOWN of it is their own school
--     alone. The platform administrator is shown the whole snapshot. 20270116100000's reader, with that one change.
--     The reader's other columns were checked for the same kind of disclosure: the person (name, PINTAR ID, id) is the
--     subject of a row the reading school is in, so the school already knows them; the network origin is the platform
--     administrator's alone; a print's resource is the reading school's own (a print's snapshot is its resource's one
--     school). Nothing else changes.
--   * PURGE CAPACITY: the purge no longer stops after 50 batches; each batch stays bounded (p_batas rows, FOR UPDATE SKIP
--     LOCKED) and the run continues until no row past the twelve months is left that it can take. And the health read
--     names any row older than twelve months and a day (lewat_retensi_akuntabilitas: how many and the oldest), which
--     makes it not ok: retention past twelve months is never silent.
-- ---------------------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════ the reader
create or replace function public.akuntabilitas_baca(
  p_sekolah uuid default null, p_jenis text default null, p_cari text default null,
  p_dari date default null, p_sampai date default null, p_halaman integer default 1, p_ukuran integer default 50)
returns table (id bigint, at timestamptz, kind text, method text, outcome text, person_id uuid, nama text, pintar_id text,
               institution_ids uuid[], network_origin text, resource jsonb, print_ref text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); v_platform boolean := public.is_system_admin(); v_zona text := 'Asia/Jakarta';
        v_q text := nullif(btrim(regexp_replace(coalesce(p_cari, ''), '\s+', ' ', 'g')), ''); v_ref text; v_pid text;
        v_ukuran int := least(greatest(coalesce(p_ukuran, 50), 1), 100); v_hal int := greatest(coalesce(p_halaman, 1), 1);
        v_dari timestamptz; v_sampai timestamptz;
begin
  if v_me is null then perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_ALLOWED'); end if;
  if not v_platform and (p_sekolah is null or not exists (
       select 1 from public.role_assignments ra
        where ra.person_id = v_me and ra.role = 'INSTITUTION_ADMIN' and ra.institution_id = p_sekolah
          and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until)) then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_ALLOWED');
  end if;
  if p_jenis is not null and p_jenis not in ('SIGN_IN_OK', 'SIGN_IN_FAILED', 'SIGN_OUT', 'PRINT_REQUEST') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_EVENT_INVALID');
  end if;
  if p_sekolah is not null then
    select coalesce(i.zona_waktu, 'Asia/Jakarta') into v_zona from public.institutions i where i.id = p_sekolah;
    v_zona := coalesce(v_zona, 'Asia/Jakarta');
  end if;
  v_dari := case when p_dari is null then null else p_dari::timestamp at time zone v_zona end;
  v_sampai := case when p_sampai is null then null else (p_sampai + 1)::timestamp at time zone v_zona end;
  -- a print reference, typed with or without its dashes and in any case
  if v_q is not null and upper(regexp_replace(v_q, '[\s-]', '', 'g')) ~ '^CTK[0-9A-HJKMNP-TV-Z]{8}$' then
    v_ref := upper(regexp_replace(v_q, '[\s-]', '', 'g'));
    v_ref := 'CTK-' || substr(v_ref, 4, 4) || '-' || substr(v_ref, 8, 4);
  elsif v_q is not null then
    v_pid := upper(regexp_replace(v_q, '[\s-]', '', 'g'));
  end if;
  return query
    -- the snapshot as stored for the platform admin; a school's admin is shown their own school alone (never the person's
    -- other schools: the stored snapshot decides who reads a row, and is not itself a school's to read)
    select e.id, e.at, e.kind, e.method, e.outcome, e.person_id, p.display_name, p.pintar_id,
           case when v_platform then e.institution_ids else array[p_sekolah] end,
           case when v_platform then e.network_origin end, e.resource, e.print_ref
      from public.accountability_events e
      left join public.persons p on p.id = e.person_id
     where (p_sekolah is null or p_sekolah = any (e.institution_ids))
       and (v_platform or cardinality(e.institution_ids) > 0)
       and (p_jenis is null or e.kind = p_jenis)
       and (v_dari is null or e.at >= v_dari) and (v_sampai is null or e.at < v_sampai)
       and (v_ref is null or e.print_ref = v_ref)
       and (v_pid is null or (e.person_id is not null and (p.pintar_id = v_pid or p.display_name ilike '%' || replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_') || '%')))
     order by e.at desc, e.id desc
     offset (v_hal - 1) * v_ukuran limit v_ukuran + 1;
end $$;
revoke all on function public.akuntabilitas_baca(uuid, text, text, date, date, integer, integer) from public, anon, authenticated;
grant execute on function public.akuntabilitas_baca(uuid, text, text, date, date, integer, integer) to authenticated;


-- ═══════════════════════════════════════════════════════════ the purge
create or replace function public.akuntabilitas_buang_lama(p_batas integer default 1000)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_umur constant interval := interval '12 months';
  v_claims jsonb; v_role text; v_batas int := least(greatest(coalesce(p_batas, 1000), 1), 10000);
  v_n int := 0; v_k int; v_lama timestamptz; v_baru timestamptz; v_l timestamptz; v_b timestamptz; v_putaran int := 0;
begin
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or auth.uid() is not null or (v_role is not null and v_role <> 'service_role') then
    perform public.akuntabilitas_tolak('ACCOUNTABILITY_NOT_SERVICE');
  end if;
  perform set_config('pintar.akuntabilitas_buang', 'on', true);
  loop
    v_putaran := v_putaran + 1;
    with sasaran as (
      select e.id from public.accountability_events e
       where e.at < now() - v_umur
       order by e.id
       limit v_batas
       for update skip locked),
    dibuang as (
      delete from public.accountability_events e using sasaran s where e.id = s.id returning e.at)
    select count(*), min(d.at), max(d.at) into v_k, v_l, v_b from dibuang d;
    v_n := v_n + v_k;
    if v_k > 0 then
      v_lama := least(coalesce(v_lama, v_l), v_l);
      v_baru := greatest(coalesce(v_baru, v_b), v_b);
    end if;
    -- every batch bounded; the run goes on until no row past the twelve months is left that it can take (a row another
    -- run holds is that run's, so a short batch ends this one)
    exit when v_k < v_batas;
  end loop;
  perform set_config('pintar.akuntabilitas_buang', '', true);
  if v_n > 0 then
    perform public.audit_write('accountability.purged', 'accountability_events', null, null,
      jsonb_build_object('deleted', v_n, 'oldest', v_lama, 'newest', v_baru, 'kept_for', '12 months'));
  end if;
  return jsonb_build_object('ok', true, 'dihapus', v_n, 'tertua', v_lama, 'terbaru', v_baru);
end $$;
revoke all on function public.akuntabilitas_buang_lama(integer) from public, anon, authenticated;
grant execute on function public.akuntabilitas_buang_lama(integer) to service_role;

-- ═══════════════════════════════════════════════════════════ the health read
create or replace function public.pintar_periksa_kesehatan()
returns jsonb
language plpgsql stable set search_path = public, pg_temp as $$
declare d record; v_hilang jsonb := '[]'::jsonb; v_beda jsonb := '[]'::jsonb; v_lain jsonb := '[]'::jsonb; n int; c record;
        v_gagal int; v_terakhir timestamptz; v_lewat int; v_tertua timestamptz; v_retensi jsonb;
begin
  select coalesce(sum(f.n), 0)::int, max(f.last_at) into v_gagal, v_terakhir
    from public.accountability_write_failures f where f.day > (now() at time zone 'Asia/Jakarta')::date - 7;
  -- the sign-in record kept past twelve months and a day: the purge has not run, or could not finish (a named finding)
  select count(*)::int, min(e.at) into v_lewat, v_tertua from public.accountability_events e where e.at < now() - interval '12 months 1 day';
  v_retensi := jsonb_build_object('n', v_lewat, 'tertua', v_tertua);
  if to_regclass('cron.job') is null then
    return jsonb_build_object('ok', false, 'pg_cron', false,
      'hilang', (select coalesce(jsonb_agg(x.jobname order by x.jobname), '[]'::jsonb) from public.pintar_jadwal_daftar() x),
      'berbeda', '[]'::jsonb, 'tidak_dideklarasikan', '[]'::jsonb,
      'gagal_tulis_akuntabilitas', jsonb_build_object('n', v_gagal, 'hari', 7, 'terakhir', v_terakhir),
      'lewat_retensi_akuntabilitas', v_retensi);
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
    'ok', jsonb_array_length(v_hilang) = 0 and jsonb_array_length(v_beda) = 0 and jsonb_array_length(v_lain) = 0 and v_gagal = 0 and v_lewat = 0,
    'pg_cron', true, 'hilang', v_hilang, 'berbeda', v_beda, 'tidak_dideklarasikan', v_lain,
    'gagal_tulis_akuntabilitas', jsonb_build_object('n', v_gagal, 'hari', 7, 'terakhir', v_terakhir),
    'lewat_retensi_akuntabilitas', v_retensi);
end $$;
revoke all on function public.pintar_periksa_kesehatan() from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only.
-- ---------------------------------------------------------------------------
do $$
begin
  if position('case when v_platform then e.institution_ids else array[p_sekolah] end' in
              (select prosrc from pg_proc where oid = 'public.akuntabilitas_baca(uuid,text,text,date,date,integer,integer)'::regprocedure)) = 0 then
    raise exception 'B1: the reader shows a school more than its own school of a row''s snapshot';
  end if;
  if position('v_putaran >= 50' in (select prosrc from pg_proc where oid = 'public.akuntabilitas_buang_lama(integer)'::regprocedure)) > 0 then
    raise exception 'B1: the purge still stops after a fixed number of batches';
  end if;
  if (public.pintar_periksa_kesehatan() -> 'lewat_retensi_akuntabilitas') is null then
    raise exception 'B1: the health read does not report rows kept past twelve months';
  end if;
  raise notice 'B1 correction verified: a school reads its own school of a snapshot; the purge runs until done; overdue rows are reported';
end $$;

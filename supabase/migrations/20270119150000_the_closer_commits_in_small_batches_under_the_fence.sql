-- A2a, change C · D6.6 and D6.7: the scheduled closer commits in small batches under the fence, never starves, and
-- runs the marking and the release (THE PLAN §5.3 D6.6, D6.7; Sharon's R1, R2). DRAFT, for Sharon's read.
--
-- R1 · no starvation. The closer's candidates EXCLUDE held sittings (darurat_sejak) and protected ones
--      (pengerjaan_dilindungi), in the query itself, and use the shifted closing time (D6.3, commit 13). A large
--      stopped scope can no longer fill every run's limit and leave unaffected overdue sittings waiting.
-- R2 · short fence holds. Today one run is one transaction of up to 500 sittings with scoring; holding the shared
--      fence for all of it would delay an activation by the whole run. The job becomes a PROCEDURE,
--      pengerjaan_tutup_berkala, that commits after each small batch (20 sittings by default), so the shared fence each
--      candidate takes (pengerjaan_pagar) is held for one batch at most.
-- D6.7 · bookkeeping. The same job then marks (pengerjaan_tandai_darurat) and releases (pengerjaan_lepas_darurat_semua)
--      in their own bounded, committed batches, after the closer. Protection comes from D6.1 and D6.2 and time from D6.3, so a late or
--      interrupted batch changes no outcome; the five-minute job is their schedule.
--
-- What stays: pengerjaan_tutup_terjadwal(p_batas), the service-only entry point A1 tests call, keeps its answer
-- ({ok, diperiksa, dinilai, menunggu, dilewati, gagal}); it and the procedure share one selection
-- (pengerjaan_tutup_calon) and one per-sitting step (pengerjaan_tutup_satu), so they decide identically.
-- The job's command changes from `select public.pengerjaan_tutup_terjadwal()` to `call public.pengerjaan_tutup_berkala()`
-- in the one declaration (B1's pintar_jadwal_daftar); A1-S08, A1-S09, B1's declaration test and the DR job pins are
-- restated with notes (THE PLAN D6.6).
-- A procedure that commits cannot be SECURITY DEFINER nor carry a SET clause: it runs as the job's owner, every name
-- schema-qualified, and no client, nor the server key, may call it.

-- ═══════════════════════════════════════════════════════════ the one selection (R1)
create function public.pengerjaan_tutup_calon(p_batas integer) returns setof uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select a.id
    from public.assessment_sessions a
   where ((a.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
           and not (a.frozen_at is not null and a.unfrozen_at is null)
           and coalesce(a.authoritative_deadline,
                        (select aa.closes_at from public.assessment_assignments aa where aa.id = a.assessment_assignment_id)
                          + make_interval(secs => a.darurat_geser_detik)) <= now())   -- D6.3: the stop's shift
       or (a.status = 'EXPIRED' and a.closure_kind in ('DEADLINE', 'WINDOW_CLOSED')
           and not exists (select 1 from public.assessment_results r where r.session_id = a.id)))
     -- R1: held and protected sittings are not candidates (marking may not have reached a protected one yet)
     and a.darurat_sejak is null
     and not public.pengerjaan_dilindungi(a.id)
   order by a.created_at, a.id
   limit greatest(1, least(coalesce(p_batas, 500), 5000))
$$;
revoke all on function public.pengerjaan_tutup_calon(integer) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ one candidate
-- The learner, the shared fence (and protection read under it), then the sitting; the deadline rule. Returns what was
-- done: FINALIZED, EXPIRED (waiting for its grace or its scoring), SKIPPED (no longer a candidate, or protected since).
create function public.pengerjaan_tutup_satu(p_session uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.assessment_sessions; v_st public.session_status;
begin
  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;
  if public.pengerjaan_pagar(p_session) then return 'SKIPPED'; end if;
  select * into v from public.assessment_sessions where id = p_session for update;
  if not ((v.status in ('CREATED', 'IN_PROGRESS', 'PAUSED'))
          or (v.status = 'EXPIRED' and v.closure_kind in ('DEADLINE', 'WINDOW_CLOSED')
              and not exists (select 1 from public.assessment_results r where r.session_id = p_session))) then
    return 'SKIPPED';
  end if;
  v_st := public.pengerjaan_putus_tenggat(p_session, true);
  return case when v_st in ('FINALIZED', 'EXPIRED') then v_st::text else 'SKIPPED' end;
end $$;
revoke all on function public.pengerjaan_tutup_satu(uuid) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the service-only entry point, on the shared parts
create or replace function public.pengerjaan_tutup_terjadwal(p_batas integer default 500) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_claims jsonb; v_role text; s record; v_hasil text; v_periksa int := 0; v_nilai int := 0;
        v_tunggu int := 0; v_lewat int := 0; v_gagal jsonb := '[]'::jsonb;
begin
  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then v_claims := null; end;
  v_role := v_claims ->> 'role';
  if public.current_person_id() is not null or auth.uid() is not null or (v_role is not null and v_role <> 'service_role') then
    perform public.pengerjaan_tolak('SITTING_JOB_NOT_SERVICE');
  end if;
  for s in select x as id from public.pengerjaan_tutup_calon(p_batas) x loop
    v_periksa := v_periksa + 1;
    begin
      v_hasil := public.pengerjaan_tutup_satu(s.id);
      if v_hasil = 'FINALIZED' then v_nilai := v_nilai + 1; elsif v_hasil = 'EXPIRED' then v_tunggu := v_tunggu + 1;
      else v_lewat := v_lewat + 1; end if;
    exception when others then
      v_gagal := v_gagal || jsonb_build_object('session_id', s.id, 'sqlstate', sqlstate, 'message', left(sqlerrm, 200));
    end;
  end loop;
  if jsonb_array_length(v_gagal) > 0 then
    raise warning 'pengerjaan_tutup_terjadwal: % of % sitting(s) could not be closed and will be tried again on the next run: %',
      jsonb_array_length(v_gagal), v_periksa, v_gagal;
  end if;
  return jsonb_build_object('ok', true, 'diperiksa', v_periksa, 'dinilai', v_nilai, 'menunggu', v_tunggu, 'dilewati', v_lewat, 'gagal', v_gagal);
end $$;
revoke all on function public.pengerjaan_tutup_terjadwal(integer) from public, anon, authenticated;
grant execute on function public.pengerjaan_tutup_terjadwal(integer) to service_role;

-- ═══════════════════════════════════════════════════════════ the job (R2, D6.7)
create procedure public.pengerjaan_tutup_berkala(p_batas integer default 500, p_kecil integer default 20)
language plpgsql as $$
declare v_calon uuid[]; v_hasil text; i integer := 0; v_gagal jsonb := '[]'::jsonb; v_id uuid;
begin
  if public.current_person_id() is not null or auth.uid() is not null then
    perform public.pengerjaan_tolak('SITTING_JOB_NOT_SERVICE');
  end if;
  -- the closer first: the candidates read once, then decided in small committed batches; each is re-read under its lock.
  -- It does not need the marks (its selection reads protection itself), and running it first keeps A2A-L01's order
  -- across the whole procedure: the learner, the fence, the sitting; then only sittings (the bookkeeping).
  v_calon := array(select x from public.pengerjaan_tutup_calon(p_batas) x);
  commit;
  foreach v_id in array v_calon loop
    begin
      v_hasil := public.pengerjaan_tutup_satu(v_id);
    exception when others then
      v_gagal := v_gagal || jsonb_build_object('session_id', v_id, 'sqlstate', sqlstate, 'message', left(sqlerrm, 200));
    end;
    i := i + 1;
    if i % greatest(1, coalesce(p_kecil, 20)) = 0 then commit; end if;
  end loop;
  commit;
  if jsonb_array_length(v_gagal) > 0 then
    raise warning 'pengerjaan_tutup_terjadwal: % of % sitting(s) could not be closed and will be tried again on the next run: %',
      jsonb_array_length(v_gagal), coalesce(array_length(v_calon, 1), 0), v_gagal;
  end if;
  -- D6.7: the bookkeeping, each in its own committed batches. A sitting released here is a candidate again from the next
  -- run, five minutes on; its shifted closing time is later than that.
  call public.pengerjaan_tandai_darurat(200);
  call public.pengerjaan_lepas_darurat_semua(200);
end $$;
revoke all on procedure public.pengerjaan_tutup_berkala(integer, integer) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the one declaration: the job's command
create or replace function public.pintar_jadwal_daftar()
returns table (jobname text, schedule text, command text)
language sql immutable set search_path = public, pg_temp as $$
  values ('pintar-pengerjaan-tutup-terjadwal', '*/5 * * * *', 'call public.pengerjaan_tutup_berkala()'),
         ('pintar-akuntabilitas-buang-lama', '17 19 * * *', 'select public.akuntabilitas_buang_lama()')
$$;
revoke all on function public.pintar_jadwal_daftar() from public, anon, authenticated, service_role;
-- installed again through the one installer, where pg_cron is (as B1's own migration did)
do $$ begin
  if to_regnamespace('cron') is not null then perform public.pintar_jadwal_pasang(); end if;
end $$;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
begin
  if exists (select 1 from public.pintar_jadwal_daftar() d where d.jobname = 'pintar-pengerjaan-tutup-terjadwal'
               and d.command <> 'call public.pengerjaan_tutup_berkala()') then
    raise exception 'A2a D6.6: the closer''s job is not the procedure';
  end if;
  if has_function_privilege('service_role', 'public.pengerjaan_tutup_satu(uuid)', 'execute')
     or has_function_privilege('service_role', 'public.pengerjaan_tutup_calon(integer)', 'execute')
     or has_function_privilege('authenticated', 'public.pengerjaan_tutup_berkala(integer,integer)', 'execute')
     or has_function_privilege('service_role', 'public.pengerjaan_tutup_berkala(integer,integer)', 'execute') then
    raise exception 'A2a D6.6: the closer''s parts are callable by a client or the server key';
  end if;
end $$;

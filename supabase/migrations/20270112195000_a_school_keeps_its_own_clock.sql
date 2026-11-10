-- Sharon F1 (Medium, review of 7a2c1751): a school's «today» is its own. Red first: F38-H01.
--
-- Indonesia has three civil time zones: WIB (Asia/Jakarta), WITA (Asia/Makassar) and WIT (Asia/Jayapura). The year-end
-- and departure functions read «today» and the date an enrolment began in Asia/Jakarta, written into each function, so
-- a school in Jayapura at 06.30 WIT (04.30 WIB) could not record an ending dated its own today, and one in Makassar saw
-- yesterday's date on an Uji Cepat launched before 01.00 WITA.
--
-- WHAT THIS MIGRATION ADDS (no backfill: every school keeps WIB, the clock it has been read on, until changed):
--   * institutions.zona_waktu, one of the three, default Asia/Jakarta.
--   * zona_sekolah(inst): the school's zone (WIB for an unknown school, as before). hari_sekolah(inst): today on it.
--     Neither is a client entry point; a screen reads the column with the school's row.
--   * atur_zona_waktu_sekolah(inst, zona): the PINTAR Administrator sets it (a school's admin does not: it moves every
--     date the school records, and it is chosen once, at founding or on a correction), with one
--     institution.time_zone_changed audit row. A refusal is PR150 with the code in
--     DETAIL (ZONA_NOT_ALLOWED, ZONA_INVALID).
--   * quick_assessment_label(at, inst): the Uji Cepat stamp on the school's clock; launch_quick_assessment's one label
--     line now passes its class's school. Its body is otherwise byte-for-byte what it was (replaced from its own
--     definition, below). The one-argument label stays WIB for anything that calls it without a school.
-- The functions that read the school's date follow in their own (undeployed) migrations, corrected in place:
-- akhiri_pendaftaran (20270112200000), akhiri_tugas_staf (20270113120000).
--
-- WHAT STAYS ON WIB, AND WHY: the school-year boundary (academic_periods starts_on/ends_on is a calendar date the
-- school wrote, and the structure year a ±1 year admission check that a few hours cannot move); and display of
-- stored instants (hle TIMEZONE), which is a reading of a moment, not a decision about which day it is.

alter table public.institutions add column if not exists zona_waktu text not null default 'Asia/Jakarta';
alter table public.institutions drop constraint if exists institutions_zona_waktu_check;
alter table public.institutions add constraint institutions_zona_waktu_check
  check (zona_waktu in ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'));
comment on column public.institutions.zona_waktu is
  'Sharon F1: the school''s civil time zone (WIB Asia/Jakarta, WITA Asia/Makassar, WIT Asia/Jayapura); its «today».';

create or replace function public.zona_sekolah(p_institution uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select i.zona_waktu from public.institutions i where i.id = p_institution), 'Asia/Jakarta')
$$;
-- not a client entry point: the database's functions call it; a screen reads institutions.zona_waktu with its row
revoke all on function public.zona_sekolah(uuid) from public, anon, authenticated;

create or replace function public.hari_sekolah(p_institution uuid)
returns date language sql stable security definer set search_path = public, pg_temp as $$
  select (now() at time zone public.zona_sekolah(p_institution))::date
$$;
revoke all on function public.hari_sekolah(uuid) from public, anon, authenticated;

create or replace function public.atur_zona_waktu_sekolah(p_institution uuid, p_zona text)
returns text language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_old text;
begin
  if public.current_person_id() is null or not public.is_system_admin() then
    raise exception using errcode = 'PR150', detail = 'ZONA_NOT_ALLOWED',
      message = 'a school''s time zone is set by the PINTAR Administrator';
  end if;
  if p_zona is null or p_zona not in ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura') then
    raise exception using errcode = 'PR150', detail = 'ZONA_INVALID', message = 'choose WIB, WITA or WIT';
  end if;
  select i.zona_waktu into v_old from public.institutions i where i.id = p_institution for update;
  if not found then
    raise exception using errcode = 'PR150', detail = 'ZONA_INVALID', message = 'no such school';
  end if;
  if v_old = p_zona then return p_zona; end if;
  update public.institutions set zona_waktu = p_zona where id = p_institution;
  perform public.audit_write('institution.time_zone_changed', 'institutions', p_institution::text, p_institution,
    jsonb_build_object('from', v_old, 'to', p_zona));
  return p_zona;
end;
$$;
revoke all on function public.atur_zona_waktu_sekolah(uuid, text) from public, anon, authenticated;
grant execute on function public.atur_zona_waktu_sekolah(uuid, text) to authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('atur_zona_waktu_sekolah', 'PLATFORM', 'Sharon F1: the PINTAR Administrator sets a school''s time zone (WIB, WITA, WIT); '
   || 'audited institution.time_zone_changed; refusals PR150.', 'SYSTEM_ADMIN', null)
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- the Uji Cepat stamp on the school's clock
create or replace function public.quick_assessment_label(p_at timestamptz, p_institution uuid)
returns text language sql stable set search_path = public, pg_temp as $$
  select to_char(p_at at time zone public.zona_sekolah(p_institution), 'YYYY-MM-DD HH24:MI')
$$;
comment on function public.quick_assessment_label(timestamptz, uuid) is
  'Sharon F1: the stamp in a Uji Cepat title on the school''s own clock. Called by launch_quick_assessment only.';
revoke all on function public.quick_assessment_label(timestamptz, uuid) from public, anon, authenticated;

-- launch_quick_assessment: its one label line, replaced from its own current definition so nothing else moves
do $$
declare v_def text := pg_get_functiondef('public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure);
begin
  if position('public.quick_assessment_label(now())' in v_def) = 0 then
    raise exception 'Sharon F1: launch_quick_assessment no longer labels with quick_assessment_label(now())';
  end if;
  execute replace(v_def, 'public.quick_assessment_label(now())', 'public.quick_assessment_label(now(), v_inst)');
end $$;

do $$
begin
  if position('quick_assessment_label(now(), v_inst)' in
              (select prosrc from pg_proc where oid = 'public.launch_quick_assessment(uuid,uuid,integer,integer)'::regprocedure)) = 0 then
    raise exception 'Sharon F1: the Uji Cepat label does not read the school''s clock';
  end if;
  if has_function_privilege('anon', 'public.atur_zona_waktu_sekolah(uuid, text)', 'execute')
     or has_function_privilege('authenticated', 'public.quick_assessment_label(timestamptz, uuid)', 'execute') then
    raise exception 'Sharon F1: a client reaches the time-zone setter anonymously, or the label helper at all';
  end if;
end $$;

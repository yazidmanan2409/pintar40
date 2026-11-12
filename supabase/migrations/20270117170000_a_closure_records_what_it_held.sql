-- L1-F4, Sharon's required change (interim review of ea3c4b6f, 12 Nov 2026; ANONYMISED-PERSON-IS-TERMINAL.md §0 item 9):
-- the deletion tells history from a live attachment by what is live under its lock and by what the closure recorded,
-- never by comparing timestamps. Plus Daisy's correctness check (TINJAUAN-F1R1B-97a40ebb.md §2.1): the key correction's
-- "{n} new certificates can be issued" no longer counts one that will not be issued.
--
--   * WHY NOT TIMESTAMPS. created_at and started_at are now(), the START of their transactions. An import or a grant that
--     began before the closure and inserted after it commits carried a created_at EARLIER than started_at, so the deletion
--     read it as history and ended a live attachment the school had added after the person closed.
--   * ENROLMENTS AND PLACEMENTS: NO TIMESTAMP. minta_akun refuses a closure while an enrolment is PENDING or ACTIVE, under
--     the person's FOR UPDATE; the deletion holds the same row FOR UPDATE. So every live enrolment at deletion was gained
--     after the closure, and the deletion refuses on any PENDING or ACTIVE enrolment, or a live placement of one.
--   * ROLES, OPEN TRANSFERS, EVALUATOR GRANTS: A RECORD AT CLOSURE. Closure ends none of these, so what was live then is
--     the closure's own state. minta_akun now writes their ids on the closure row, once, while it holds the person
--     FOR UPDATE (person_suspensions.dipegang_saat_tutup). The deletion refuses on any live row of those kinds whose id
--     is not in that record.
--     - A closure with no record (one that predates this column and was not backfilled, or a row made by hand) is read
--       as having held nothing: the deletion refuses rather than anonymise. Failing closed is the safe reading.
--   * BACKFILL. Every open CLOSED_AT_REQUEST row is given what is live at migration time. (Staging and production hold
--     no suspension today; locally the seed makes none.)
--   * WRITTEN ONCE. A guard refuses any UPDATE that changes the record; it is set only by the insert.

-- ═══════════════════════════════════════════════════════════ (1) the record on the closure row
alter table public.person_suspensions add column dipegang_saat_tutup jsonb;
alter table public.person_suspensions add constraint person_suspensions_dipegang_hanya_tutup
  check (dipegang_saat_tutup is null
         or (category = 'CLOSED_AT_REQUEST' and jsonb_typeof(dipegang_saat_tutup) = 'object'
             and dipegang_saat_tutup ?& array['peran', 'pindah', 'penilai']));
comment on column public.person_suspensions.dipegang_saat_tutup is
  'L1-F4 (Sharon, 12 Nov): on a closure, the ids of the role assignments, open transfers and evaluator grants live when '
  'it was made, recorded by minta_akun under the person''s FOR UPDATE. Written once. The deletion refuses on a live one '
  'not listed here.';

-- what is live for a person now, in the record's shape (one definition, used by the closure, the backfill and the test)
create or replace function public.orang_dipegang(p_person uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'peran',   coalesce((select jsonb_agg(ra.id order by ra.id) from public.role_assignments ra
                          where ra.person_id = p_person and ra.revoked_at is null
                            and (ra.valid_until is null or ra.valid_until > now())), '[]'::jsonb),
    'pindah',  coalesce((select jsonb_agg(t.id order by t.id) from public.transfers t
                          where t.person_id = p_person and t.status in ('REQUESTED', 'AUTHORIZED')), '[]'::jsonb),
    'penilai', coalesce((select jsonb_agg(v.id order by v.id) from public.evaluation_evaluators v
                          where v.person_id = p_person and v.revoked_at is null), '[]'::jsonb))
$$;
revoke all on function public.orang_dipegang(uuid) from public, anon, authenticated, service_role;

-- (2) the backfill, before the guard exists
update public.person_suspensions x set dipegang_saat_tutup = public.orang_dipegang(x.person_id)
 where x.category = 'CLOSED_AT_REQUEST' and x.ended_at is null and x.dipegang_saat_tutup is null;

-- (3) written once
create or replace function public.dipegang_saat_tutup_jaga()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.dipegang_saat_tutup is distinct from old.dipegang_saat_tutup then
    raise exception using errcode = '42501', message = 'person_suspensions.dipegang_saat_tutup is written once, at the closure';
  end if;
  return new;
end $$;
revoke all on function public.dipegang_saat_tutup_jaga() from public, anon, authenticated, service_role;
create trigger _l1f4_dipegang_saat_tutup_sekali before update of dipegang_saat_tutup on public.person_suspensions
  for each row execute function public.dipegang_saat_tutup_jaga();

-- ═══════════════════════════════════════════════════════════ (4) minta_akun writes the record, under its FOR UPDATE
do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.minta_akun(text,boolean)'::regprocedure);
  v_old := E'    insert into public.person_suspensions (person_id, category, started_by) values (v_me, ''CLOSED_AT_REQUEST'', v_me);\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: minta_akun does not write the closure where it did'; end if;
  if position('perform 1 from public.persons where id = v_me for update;' in v_def) = 0 then
    raise exception 'L1-F4: minta_akun does not hold the person before the closure';
  end if;
  execute replace(v_def, v_old,
    E'    -- L1-F4 (Sharon, 12 Nov): what is live at this instant, under the person''s FOR UPDATE, is what the closure held\n'
    || E'    insert into public.person_suspensions (person_id, category, started_by, dipegang_saat_tutup)\n'
    || E'    values (v_me, ''CLOSED_AT_REQUEST'', v_me, public.orang_dipegang(v_me));\n');
end $$;

-- ═══════════════════════════════════════════════════════════ (5) the deletion measures by live state and the record
do $$
declare v_def text; v_lama text; v_baru text; a int; b int;
begin
  v_def := pg_get_functiondef('public.hapus_data_pribadi(uuid,text)'::regprocedure);
  a := position(E'  -- L1-F4 (Sharon §3a.3): under this lock' in v_def);
  b := position(E'    perform public.akun_tolak(''ACCOUNT_LIVE_ATTACHMENT'');\n  end if;\n' in v_def);
  if a = 0 or b = 0 or b < a then raise exception 'L1-F4: hapus_data_pribadi does not hold the timestamp check where it did'; end if;
  v_lama := substr(v_def, a, b - a + length(E'    perform public.akun_tolak(''ACCOUNT_LIVE_ATTACHMENT'');\n  end if;\n'));
  if position('created_at > x.started_at' in v_lama) = 0 then raise exception 'L1-F4: the block found is not the timestamp check'; end if;
  v_baru :=
       E'  -- L1-F4 (Sharon, interim review of ea3c4b6f): under this lock, history is told from a live attachment by what is\n'
    || E'  -- live now and what the closure recorded, never by timestamps. A live enrolment or placement cannot be history\n'
    || E'  -- (minta_akun refuses a closure while one exists, under the same lock); a live role, open transfer or evaluator\n'
    || E'  -- grant is history only if the closure listed it. A closure with no record is read as having held nothing.\n'
    || E'  if exists (select 1 from public.enrollments e where e.person_id = r.person_id and e.status in (''PENDING'', ''ACTIVE''))\n'
    || E'     or exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id\n'
    || E'                 where e.person_id = r.person_id and m.valid_to is null and e.status in (''PENDING'', ''ACTIVE''))\n'
    || E'     or exists (select 1 from public.person_suspensions x\n'
    || E'                 cross join lateral (select coalesce(x.dipegang_saat_tutup, ''{"peran":[],"pindah":[],"penilai":[]}''::jsonb) d) h\n'
    || E'                 cross join lateral (select public.orang_dipegang(r.person_id) k) kini\n'
    || E'                 where x.person_id = r.person_id and x.ended_at is null and x.category = ''CLOSED_AT_REQUEST''\n'
    || E'                   and (exists (select 1 from jsonb_array_elements_text(kini.k -> ''peran'') i where not (h.d -> ''peran'') ? i.value)\n'
    || E'                        or exists (select 1 from jsonb_array_elements_text(kini.k -> ''pindah'') i where not (h.d -> ''pindah'') ? i.value)\n'
    || E'                        or exists (select 1 from jsonb_array_elements_text(kini.k -> ''penilai'') i where not (h.d -> ''penilai'') ? i.value))) then\n'
    || E'    perform public.akun_tolak(''ACCOUNT_LIVE_ATTACHMENT'');\n'
    || E'  end if;\n';
  execute replace(v_def, v_lama, v_baru);
end $$;

-- ═══════════════════════════════════════════════════════════ (6) Daisy: the summary counts only what will be issued
do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.koreksi_kunci_hitung_untuk(uuid,text[])'::regprocedure);
  v_old := E'       and not public.sertifikat_layak_dengan(s.id, v_cur.mastery, v_cur.safety_gate_passed) then\n      n_baru := n_baru + 1;\n';
  if position(v_old in v_def) = 0 then raise exception 'L1-F4: koreksi_kunci_hitung_untuk does not count the newly earned where it did'; end if;
  execute replace(v_def, v_old,
    E'       and not public.sertifikat_layak_dengan(s.id, v_cur.mastery, v_cur.safety_gate_passed)\n'
    || E'       -- L1-F4 (Daisy, 12 Nov): «{n} sertifikat baru dapat diterbitkan» counts only what will be issued; a person whose\n'
    || E'       -- personal data was deleted is counted in sertifikat_tidak_diterbitkan instead\n'
    || E'       and not exists (select 1 from public.persons p where p.id = s.person_id and p.anonymized_at is not null) then\n'
    || E'      n_baru := n_baru + 1;\n');
end $$;

-- ═══════════════════════════════════════════════════════════ (7) the migration's own check (ADR-0003: structural only)
do $$
declare v text;
begin
  v := pg_get_functiondef('public.hapus_data_pribadi(uuid,text)'::regprocedure);
  if position('created_at > x.started_at' in v) > 0 or position('dipegang_saat_tutup' in v) = 0 then
    raise exception 'L1-F4: the deletion still compares timestamps, or does not read the closure''s record';
  end if;
  if position('orang_dipegang(v_me)' in pg_get_functiondef('public.minta_akun(text,boolean)'::regprocedure)) = 0 then
    raise exception 'L1-F4: the closure does not write its record';
  end if;
  if exists (select 1 from public.person_suspensions x where x.category = 'CLOSED_AT_REQUEST' and x.ended_at is null and x.dipegang_saat_tutup is null) then
    raise exception 'L1-F4: an open closure was not backfilled';
  end if;
end $$;

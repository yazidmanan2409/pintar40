-- The 4.1 staging checkpoint: what each declared scheduled job's FIRST run will act on in staging's existing data, by
-- school (STAGING-CHECKPOINT-BEFORE-A2A.md §3d, question 1).
--
-- READ ONLY, one SELECT. The Chief Architect runs it before the merge, and the figures go to the owner with the pull
-- request. It reads the same at 224 and at 244: a column only 244 has is read through to_jsonb.
--
-- THE TWO JOBS (public.pintar_jadwal_daftar(), migration 231):
--   * pintar-pengerjaan-tutup-terjadwal, every 5 minutes: public.pengerjaan_tutup_terjadwal(), up to 500 sittings a run.
--     - A sitting still open (CREATED, IN_PROGRESS, PAUSED) whose deadline has passed is ended: EXPIRED, with its
--       answers kept. The deadline is its own, or else its assignment's window.
--     - One past its deadline and its definition's late-sync grace is also SCORED (finalize_session) in the same run.
--     - A sitting held for a suspension is skipped. None exists at 224.
--   * pintar-akuntabilitas-buang-lama, daily at 19:17 UTC: public.akuntabilitas_buang_lama(). It removes sign-in records
--     older than twelve months. Their table, accountability_events, is created by 230, empty, so its first run on
--     staging removes nothing.
--
-- Each row: job | school (name and slug, or "(no school)") | what the first run acts on | detail.
with tenggat as (
  select s.id, s.institution_id, s.status, s.authoritative_deadline,
         coalesce(s.authoritative_deadline, aa.closes_at) as batas,
         coalesce(d.late_sync_grace_seconds, 0) as grace,
         exists (select 1 from public.responses r where r.session_id = s.id) as ada_jawaban,
         (to_jsonb(s) ->> 'frozen_at') is not null and (to_jsonb(s) ->> 'unfrozen_at') is null as ditahan
    from public.assessment_sessions s
    left join public.assessment_assignments aa on aa.id = s.assessment_assignment_id
    left join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
),
calon as (
  select t.*, (t.authoritative_deadline is null or now() > t.batas + make_interval(secs => t.grace)) as dinilai
    from tenggat t where t.batas is not null and t.batas <= now() and not t.ditahan
),
penutup as (
  select 'pintar-pengerjaan-tutup-terjadwal'::text as job,
         coalesce(i.name || ' (' || i.slug || ')', '(no school)') as sekolah,
         count(*)::text || ' sitting(s) ended' as tindakan,
         count(*) filter (where c.dinilai) || ' of them also scored in the same run; '
           || count(*) filter (where c.ada_jawaban) || ' with answers kept; deadlines from '
           || to_char(min(c.batas) at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' to '
           || to_char(max(c.batas) at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC' as rincian
    from calon c left join public.institutions i on i.id = c.institution_id
   group by i.name, i.slug
)
select job, sekolah, tindakan, rincian from penutup
union all
select 'pintar-pengerjaan-tutup-terjadwal', 'ALL SCHOOLS', (select count(*) from calon) || ' sitting(s) ended',
       (select count(*) filter (where dinilai) from calon) || ' also scored; at most 500 a run, so '
       || greatest(1, ceil((select count(*) from calon) / 500.0)) || ' run(s) of 5 minutes'
union all
select 'pintar-akuntabilitas-buang-lama', 'ALL SCHOOLS',
       case when to_regclass('public.accountability_events') is null then '0 record(s) removed'
            else (xpath('/row/n/text()', query_to_xml(
                   'select count(*) as n from public.accountability_events where at < now() - interval ''12 months''',
                   false, true, '')))[1]::text || ' record(s) removed' end,
       case when to_regclass('public.accountability_events') is null
            then 'the table does not exist yet (224): 230 creates it empty'
            else 'sign-in records older than twelve months' end
order by 1, 2;

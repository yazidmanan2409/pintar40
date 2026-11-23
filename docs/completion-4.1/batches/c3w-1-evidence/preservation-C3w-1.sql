-- C3w-1's staging promotion: the preservation query (Second Eye, 23 Nov, for Sharon's check; Bob's brief of 23 Nov 07:45).
-- A3's query (a3-evidence/preservation-A3.sql on claude/bob-41-master-plan) restated for C3w-1, with the same method,
-- lines and rules. Read A2b's header for the method, C2w's for lines 63 to 68 and A3's for lines 77 to 81. Only what
-- differs is stated here.
--
-- THE PAIR IS 290 -> 300. Staging holds A3's 290 (last 20270121250000); C3w-1 adds ten migrations. Line 10 is
-- expected to read "290 / 20270121250000" BEFORE and "300 / 20270122190000" AFTER.
--
-- THE TEN MIGRATIONS AT THE FREEZE (claude/c3w-1 8668a695; Sharon PASS on the build and round 2, Daisy PASS on round 3):
--   20270122100000  ae0741a26225ca4070ecf16877a695410ee1578fbc38dfbd3d7c1bbbc855bfef
--   20270122110000  5757977c6eccc73308b0889e98afe0fd62492bfed307d00da4b617fd0763f912
--   20270122120000  da3abce87bca1a321fe5d3a6cca6d718f5176c99ada4e861ccac62851de39777
--   20270122130000  abb8173cb991787e4ae2dd4a983f4cbd67b2e1c414234b37f4fe43f78321375b
--   20270122140000  265d904fb3da1b4e295607026882385513804eed7b92d3d8c82f94144add5dd4
--   20270122150000  89c8e80f759f872a23220c441784778b19b9ad8435a2c523077a851623f7df2d
--   20270122160000  8deb8089dbe8ac87d6a8884c5e51340c457dae033a6d60b7fb4cf3de44cda84e
--   20270122170000  f5001965a82e68baa0004e03ba5f90803449aefbc4fe2ea6b49d09ce9b6e92c6
--   20270122180000  87add13f30d429af4fa2997deb3adbcad7648838aad9cbc54628e757364be16d
--   20270122190000  1b0873b44822fe8848a308d317493bb8be50269135733f73b03d1930574c1e58
--   The promotion checks each against the deployed file before migrating; any difference stops it.
--
-- READ ONLY, run exactly as A3's: in a read-only transaction, BEFORE with the two `batas` values null, AFTER with the
-- two printed values written in.
--
-- WHAT C3w-1 CHANGES THAT A PRESERVED LINE COULD SEE: nothing. Read from the ten files at the freeze:
--   * No existing table is altered, backfilled or constrained, and no existing row is written at migration time.
--   * The seven AI tables are created new (100000, 110000) and later altered only among themselves (120000: a column and a
--     rename on ai_opsi/ai_permintaan; 130000: foreign keys from ai_asal_soal and ai_penerimaan to items dropped;
--     150000: ai_permintaan.lesson_id made not null, on a table that is empty at that point of the promotion).
--   * Migration-time inserts go only to registries no preserved line reads: record_class_registry and orang_lampiran
--     (100000, 110000), client_rpc_registry (110000, 130000, 180000; line 83).
--   * One trigger is added to an existing table: ai_bukan_sumber_metrik on public.metric_sources (110000), which refuses
--     an AI table as a metric source. It writes nothing and no preserved line reads metric_sources.
--   * Every other change is a function: new (ai_*, c3w_*), or restated in full (langkah_konten in 130000, which only
--     gains the AI submit gate; ai_tolak, ai_minta_draf, ai_tulis_draf, ai_tersedia within the batch).
--   So lines 20 to 81 must read identically BEFORE and AFTER (no plants); only lines 10, 82 and 83 move.
--
-- STEP 0: none. A3 needed one because 210000 backfilled a column and could raise on staging's data. No C3w-1 migration
-- reads existing rows at migration time: its check blocks read only the catalogue (function definitions and
-- privileges). The not-null in 150000 is on ai_permintaan, created empty by 100000 in the same promotion.
--
-- IF A MIGRATION FAILS PART-WAY: each file is its own transaction, so staging is left at the last one applied, never
-- in the middle of one. Stop and report to the owner; no AFTER read is taken, and nothing is retried without the owner.
--
-- AFTER THE PROMOTION: scripts/release/after-promotion/c3w-r3-bahan.sql (C3W-R3-BAHAN) must print OK.
--
-- WHAT DIFFERS FROM A3's QUERY: this header, line 10's expectation, the comment on `baru` (its value is A3's, unchanged)
-- and the new lines 82 and 83. Every other line is A3's, unchanged.
with batas as (
  select coalesce(null::timestamptz, now()) as saat,
         coalesce(null::bigint, (select max(id) from public.audit_log)) as audit_id
),
-- A3's three session columns, kept out of line 58 exactly as in A3's AFTER read; C3w-1 adds no column to an existing table
baru as (select array['pengendali_sesi', 'generasi', 'lanjut_diminta_pada']::text[] as k),
mw_keluar as (select array[]::text[] as k),
-- an unfinished window: the seven columns a legitimate act writes (the header, line 75)
mw_jalan as (select array['starts_at', 'ends_at', 'ended_at', 'ended_by_person_id', 'end_reason',
  'activation_recorded_at', 'deactivation_recorded_at']::text[] as k),
demo as (select id from public.institutions where slug = 'sekolah-demo-pintar'),
uji as (select id from public.institutions where slug like 'sekolah-uji-%'),
orang_demo as (select distinct e.person_id from public.enrollments e where e.institution_id = (select id from demo)
               union select r.person_id from public.role_assignments r where r.institution_id = (select id from demo)),
sidik(n, garis, nilai) as (
  -- ── the read itself
  select 1, 'cutoff (write into batas.saat after the merge)', (select saat::text from batas)
  union all select 2, 'audit_log watermark (write into batas.audit_id after the merge)', (select audit_id::text from batas)

  -- ── state: expected to move from 290 to 300 by the promotion (line 10; the header)
  union all select 10, 'state · migrations',
    (select count(*) || ' / ' || max(version) || '; versions digest ' || md5(string_agg(version, ',' order by version))
       from supabase_migrations.schema_migrations)
  union all select 11, 'state · pg_cron',
    coalesce((select 'installed ' || extversion from pg_extension where extname = 'pg_cron'), 'absent')
  union all select 12, 'state · triggers on auth.users',
    (select count(*) || ': ' || string_agg(tgname, ', ' order by tgname) from pg_trigger
      where tgrelid = 'auth.users'::regclass and not tgisinternal)

  -- ── preserved: Batch 5's lines, limited to rows that existed at the cutoff
  union all select 20, 'demo_roles', (select count(*)::text from public.role_assignments, batas
     where institution_id = (select id from demo) and revoked_at is null and created_at <= batas.saat)
  union all select 21, 'demo_results', (select count(*)::text from public.assessment_results, batas
     where institution_id = (select id from demo) and computed_at <= batas.saat)
  union all select 22, 'demo_official', (select count(*)::text from public.official_results, batas
     where institution_id = (select id from demo) and computed_at <= batas.saat)
  union all select 23, 'demo_certificates', (select count(*)::text from public.certificates, batas
     where institution_id = (select id from demo) and created_at <= batas.saat)
  union all select 24, 'demo_enrolments', (select count(*)::text from public.enrollments, batas
     where institution_id = (select id from demo) and created_at <= batas.saat)
  union all select 25, 'demo_courses', (select count(*)::text from public.courses, batas
     where institution_id = (select id from demo) and created_at <= batas.saat)
  union all select 26, 'demo_audit', (select count(*) || ' (' || coalesce(max(id), 0) || ')' from public.audit_log, batas
     where institution_id = (select id from demo) and id <= batas.audit_id)
  union all select 27, 'demo_people', (select md5(coalesce(string_agg(p.id || ':' || p.display_name || ':' || coalesce(p.pintar_id, '')
       || ':' || coalesce(p.photo_path, '') || ':' || coalesce(u.username, ''), ',' order by p.id), ''))
       from public.persons p left join public.person_usernames u on u.person_id = p.id
      where p.id in (select person_id from orang_demo))
  union all select 28, 'demo_accounts', (select md5(coalesce(string_agg(a.id || ':' || a.kind || ':' || coalesce(a.card_number, '')
       || ':' || lower(coalesce(x.email, '')), ',' order by a.id), ''))
       from public.accounts a join auth.users x on x.id = a.auth_user_id where a.person_id in (select person_id from orang_demo))
  union all select 29, 'results_outside_tests', (select md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.assessment_results t, batas where t.institution_id not in (select id from uji) and t.computed_at <= batas.saat)
  union all select 30, 'official_outside_tests', (select md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.official_results t, batas where t.institution_id not in (select id from uji) and t.computed_at <= batas.saat)
  union all select 31, 'certificates_outside_tests', (select md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.certificates t, batas where t.institution_id not in (select id from uji) and t.created_at <= batas.saat)
  union all select 32, 'integrity_signals_outside_tests', (select md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.integrity_signals t, batas where t.institution_id not in (select id from uji) and t.observed_at <= batas.saat)
  union all select 33, 'management_decisions_all', (select md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.management_decisions t, batas where t.raised_at <= batas.saat)

  -- ── preserved: every row that existed at the cutoff, in the tables A2b's code reads or writes (and 4.0's lines above)
  union all select 40, 'persons', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.persons t, batas where t.created_at <= batas.saat)
  union all select 41, 'person_usernames', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.person_id), ''))
       from public.person_usernames t, batas where t.claimed_at <= batas.saat)
  union all select 42, 'person_pins (without the hash)', (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - 'pin_hash')::text || md5(t.pin_hash), ',' order by t.person_id), ''))
       from public.person_pins t, batas where t.set_at <= batas.saat)
  union all select 43, 'accounts', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.accounts t, batas where t.created_at <= batas.saat)
  union all select 44, 'auth users (id, email, locked, password digest)', (select count(*) || ' ' || md5(coalesce(string_agg(
         u.id || ':' || lower(coalesce(u.email, '')) || ':' || (u.banned_until is not null) || ':' || md5(coalesce(u.encrypted_password, '')),
         ',' order by u.id), '')) from auth.users u, batas where u.created_at <= batas.saat)
  union all select 45, 'auth users locked (any lock value)', (select count(*)::text from auth.users u, batas
     where u.created_at <= batas.saat and u.banned_until is not null)
  union all select 46, 'role_assignments', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.role_assignments t, batas where t.created_at <= batas.saat)
  union all select 47, 'person_suspensions', (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from baru))::text, ',' order by t.id), ''))
       from public.person_suspensions t, batas where t.started_at <= batas.saat)
  union all select 48, 'account_requests', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.account_requests t, batas where t.created_at <= batas.saat)
  union all select 49, 'enrollments', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.enrollments t, batas where t.created_at <= batas.saat)
  union all select 50, 'institutions', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.institutions t, batas where t.created_at <= batas.saat)
  union all select 51, 'org_nodes', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.org_nodes t, batas where t.created_at <= batas.saat)
  union all select 52, 'courses', (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from baru))::text, ',' order by t.id), ''))
       from public.courses t, batas where t.created_at <= batas.saat)
  union all select 53, 'plp_releases', (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from baru))::text, ',' order by t.id), ''))
       from public.plp_releases t, batas where t.created_at <= batas.saat)
  union all select 54, 'items', (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from baru))::text, ',' order by t.id), ''))
       from public.items t, batas where t.created_at <= batas.saat)
  union all select 55, 'item_options', (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from baru))::text, ',' order by t.id), ''))
       from public.item_options t, batas where t.created_at <= batas.saat)
  union all select 56, 'learning_assignments', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.learning_assignments t, batas where t.created_at <= batas.saat)
  union all select 57, 'assessment_assignments', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.assessment_assignments t, batas where t.created_at <= batas.saat)
  union all select 58, 'assessment_sessions ended at the cutoff', (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from baru))::text, ',' order by t.id), ''))
       from public.assessment_sessions t, batas
      where t.created_at <= batas.saat and t.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED')
        and coalesce((to_jsonb(t) ->> 'closure_at')::timestamptz, '-infinity') <= batas.saat
        and coalesce(t.submitted_at, '-infinity') <= batas.saat and coalesce(t.finalized_at, '-infinity') <= batas.saat)
  union all select 59, 'assessment_results', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.assessment_results t, batas where t.computed_at <= batas.saat)
  union all select 60, 'official_results', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.official_results t, batas where t.computed_at <= batas.saat)
  union all select 61, 'certificates', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.certificates t, batas where t.created_at <= batas.saat)
  union all select 62, 'audit_log up to the watermark', (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.audit_log t, batas where t.id <= batas.audit_id)

  union all select 63, 'maintenance_windows finished at the cutoff',
    (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from mw_keluar))::text, ',' order by t.id), ''))
       from public.maintenance_windows t, batas
      where t.created_at <= batas.saat and coalesce(t.ended_at, t.ends_at) <= batas.saat)

  union all select 64, 'state · maintenance_windows created before the cutoff that carry a reason_code',
    (select count(*)::text from public.maintenance_windows t, batas
      where t.created_at <= batas.saat and to_jsonb(t) ->> 'reason_code' is not null)

  -- release_distributions (C2w): the table C2w's code reads, and withdrawal writes. A2b's query did not read it.
  union all select 65, 'release_distributions withdrawn at the cutoff',
    (select count(*) || ' ' || md5(coalesce(string_agg(to_jsonb(t)::text, ',' order by t.id), ''))
       from public.release_distributions t, batas
      where t.created_at <= batas.saat and t.withdrawn_at <= batas.saat)
  union all select 66, 'release_distributions active at the cutoff (without the four a withdrawal writes)',
    (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t)
             - array['status', 'withdrawn_by_person_id', 'withdrawn_at', 'reason'])::text, ',' order by t.id), ''))
       from public.release_distributions t, batas
      where t.created_at <= batas.saat and (t.withdrawn_at is null or t.withdrawn_at > batas.saat))
  union all select 67, 'state · of those, withdrawn since the cutoff (each must be a «Tarik izin»; the header)',
    (select count(*) || ' ' || md5(coalesce(string_agg(t.id::text, ',' order by t.id), ''))
       from public.release_distributions t, batas
      where t.created_at <= batas.saat and t.withdrawn_at > batas.saat)
  union all select 68, 'state · of those, with no audited withdrawal above the watermark (must be 0; Sharon P1)',
    (select count(*)::text
       from public.release_distributions t, batas
      where t.created_at <= batas.saat and t.withdrawn_at > batas.saat
        and not exists (select 1 from public.audit_log a
                         where a.id > batas.audit_id
                           and a.action = 'RELEASE_DISTRIBUTION_WITHDRAWN'
                           and a.target_table = 'release_distributions'
                           and a.target_id = t.id::text
                           and a.actor_person_id = t.withdrawn_by_person_id))
  union all select 75, 'maintenance_windows not finished at the cutoff (without the seven an act writes)',
    (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from mw_jalan))::text, ',' order by t.id), ''))
       from public.maintenance_windows t, batas
      where t.created_at <= batas.saat and coalesce(t.ended_at, t.ends_at, 'infinity') > batas.saat)
  union all select 76, 'audit_log above the watermark on those windows (the rule for line 75)',
    (select count(*) || ' ' || coalesce(string_agg(l.target_id || ':' || l.action, ',' order by l.id), '')
       from public.audit_log l, batas
      where l.id > batas.audit_id and l.target_table = 'maintenance_windows'
        and l.target_id in (select t.id::text from public.maintenance_windows t
                             where t.created_at <= batas.saat and coalesce(t.ended_at, t.ends_at, 'infinity') > batas.saat))

  -- ── A3's lines (new in this pair; the header, "WHAT DIFFERS")
  union all select 77, 'assessment_definitions (without lineage_root_definition_id, which A3 backfills)',
    (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - 'lineage_root_definition_id')::text, ',' order by t.id), ''))
       from public.assessment_definitions t, batas where t.created_at <= batas.saat)
  union all select 78, 'state · lineage roots of the definitions created before the cutoff (absent BEFORE; the backfill AFTER)',
    (select count(*) filter (where to_jsonb(t) ->> 'lineage_root_definition_id' is null) || ' without a root; '
         || count(*) filter (where to_jsonb(t) ->> 'lineage_root_definition_id' = t.id::text) || ' are their own root; digest '
         || md5(coalesce(string_agg(t.id || '>' || coalesce(to_jsonb(t) ->> 'lineage_root_definition_id', '-'), ',' order by t.id), ''))
       from public.assessment_definitions t, batas where t.created_at <= batas.saat)
  union all select 79, 'responses on sittings ended at the cutoff (without generasi)',
    (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(r) - 'generasi')::text, ',' order by r.id), ''))
       from public.responses r join public.assessment_sessions t on t.id = r.session_id, batas
      where r.received_at <= batas.saat and t.created_at <= batas.saat and t.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED')
        and coalesce((to_jsonb(t) ->> 'closure_at')::timestamptz, '-infinity') <= batas.saat
        and coalesce(t.submitted_at, '-infinity') <= batas.saat and coalesce(t.finalized_at, '-infinity') <= batas.saat)
  union all select 80, 'state · rows created before the cutoff whose generasi is not 1 (must be 0 on both reads)',
    (select (select count(*) from public.responses r, batas
              where r.received_at <= batas.saat and coalesce(to_jsonb(r) ->> 'generasi', '1') <> '1')
          + (select count(*) from public.assessment_sessions t, batas
              where t.created_at <= batas.saat and coalesce(to_jsonb(t) ->> 'generasi', '1') <> '1') || '')
  union all select 81, 'state · sittings created before the cutoff that carry a controller (0 BEFORE; claimed once by a first write after)',
    (select count(*) filter (where to_jsonb(t) ->> 'pengendali_sesi' is not null) || ' of ' || count(*) || ' (ended at the cutoff: '
         || count(*) filter (where to_jsonb(t) ->> 'pengendali_sesi' is not null and t.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED')
                              and coalesce(t.submitted_at, '-infinity') <= batas.saat and coalesce(t.finalized_at, '-infinity') <= batas.saat) || ', must be 0)'
       from public.assessment_sessions t, batas where t.created_at <= batas.saat)

  -- ── C3w-1's lines (new in this pair): state only. The AI ledger arrives empty and nothing in it is preserved
  union all select 82, 'state · AI tables present, and their rows (absent BEFORE; seven, 0 rows each, AFTER)',
    (select count(*) || ' present; rows ' || coalesce(string_agg(c.relname || '=' ||
              (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', c.relname), false, true, '')))[1]::text,
              ', ' order by c.relname), '-')
       from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
        and c.relname in ('ai_opsi', 'ai_plafon_platform', 'ai_hak_sekolah', 'ai_permintaan', 'ai_percobaan', 'ai_asal_soal', 'ai_penerimaan'))
  union all select 83, 'state · client_rpc_registry rows for the AI functions (0 BEFORE; 4 AFTER)',
    (select count(*) || ': ' || coalesce(string_agg(function_name, ', ' order by function_name), '-')
       from public.client_rpc_registry where function_name like 'ai\_%')

  -- ── the scheduled closure's own lines (A1): not "preserved"; read with the rule in the header
  union all select 70, 'sittings open at this read (created before the cutoff)', (select count(*) || ' ' || md5(coalesce(string_agg(t.id::text, ',' order by t.id), ''))
       from public.assessment_sessions t, batas where t.created_at <= batas.saat and t.status in ('CREATED', 'IN_PROGRESS', 'PAUSED'))
  union all select 71, 'of which past their deadline at this read', (select count(*)::text
       from public.assessment_sessions t left join public.assessment_assignments aa on aa.id = t.assessment_assignment_id, batas
      where t.created_at <= batas.saat and t.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
        and coalesce(t.authoritative_deadline, aa.closes_at) <= now())
  union all select 72, 'closed by the schedule since the cutoff', (select count(*) || ' ' || md5(coalesce(string_agg(t.id::text, ',' order by t.id), ''))
       from public.assessment_sessions t, batas
      where t.created_at <= batas.saat and (to_jsonb(t) ->> 'closure_at')::timestamptz > batas.saat
        and to_jsonb(t) ->> 'closure_kind' in ('DEADLINE', 'WINDOW_CLOSED'))

  -- ── maintenance_windows' own state lines (A2b): not "preserved"; read with the rule in the header
  union all select 73, 'maintenance_windows not finished at the cutoff (created before it)',
    (select count(*) || ' ' || md5(coalesce(string_agg(t.id::text, ',' order by t.id), ''))
       from public.maintenance_windows t, batas
      where t.created_at <= batas.saat and coalesce(t.ended_at, t.ends_at, 'infinity') > batas.saat)
  union all select 74, 'of the finished, deactivation not yet recorded at this read', (select count(*)::text
       from public.maintenance_windows t, batas
      where t.created_at <= batas.saat and coalesce(t.ended_at, t.ends_at) <= batas.saat
        and t.activation_recorded_at is not null and t.deactivation_recorded_at is null)
)
select n || '|' || nilai as line from sidik order by n;

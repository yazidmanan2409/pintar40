-- CI-1 · the preservation read: D2-R's (docs/completion-4.1/d2r/evidence/preservation-D2R.sql, on main 429b7dcc), unchanged
-- below this header but for line 10's expectation.
--
-- CI-1's PAIR IS 309 -> 310: one migration, 20270125100000, sha256:
--   910068aab70e612222958ab304bf482af8f65338649548473d864eab52ba0d9e  (restated at the freeze if it changes)
-- Line 10 reads "309 / 20270124100000" BEFORE and "310 / 20270125100000" AFTER.
--
-- STEP 0 FIRST: step0-CI1.sql (read only): the issued certificates that will read DITINJAU, and why.
--
-- WHAT CI-1 WRITES AT MIGRATION TIME: no record. Its functions are new or restated (sertifikat_hasil_lulus,
-- sertifikat_dipersoalkan, sertifikat_dipersoalkan_sekolah new; koreksi_tolak, putuskan_tinjauan_sertifikat,
-- verify_certificate, sertifikat_saya_ditinjau, tinjauan_sertifikat_dikonfirmasi restated) with their grants, and ONE row:
-- client_rpc_registry 'sertifikat_dipersoalkan_sekolah' (the new staff read's exposure class). Line 83 reads only the
-- registry's ai_% rows, so it stays 5. No line reads certificates' validity as said (it is computed, not stored).
-- So every line except line 10 must read identically BEFORE and AFTER.
--
-- (D2-R's header, kept for its method) D2-R · the preservation read, from preservation-Z.sql (claude/z, Z9), with one change: `baru` gains the capture's three
-- columns (Sharon §7.2 (d)).
--
-- D2-R's PAIR IS 308 -> 309: one migration, 20270124100000, sha256 at c20c7e47:
--   4a6f88ec0193446ec8b3beebc399d25df78cf53c07cb24b1a9dfc300dec5cb60  (corrected in place until the freeze; restated then)
-- Line 10 reads "308 / 20270123170000" BEFORE and "309 / 20270124100000" AFTER.
--
-- STEP 0 FIRST: step0-D2R.sql (read only), by mode and by the purpose each sitting will capture.
--
-- WHAT D2-R WRITES AT MIGRATION TIME, AND WHY NO OTHER LINE MOVES (Sharon, D2R-BATCH-42f6f432.md, note 1):
--   * assessment_sessions: every sitting's assistance_policy, bersertifikasi and percobaan_ke are backfilled from the OLD
--     policy, with the three column-writing triggers (provenance, status, a1_state) disabled around the update so no
--     other column is touched. The three columns are in `baru`, kept out of line 58; the table has no updated_at.
--   * mode_policy: each certifying mode that allowed help or revealed rationale gets allows_assistance = false,
--     reveals_rationale_on_review = false and its note extended. No line reads mode_policy.
--   * audit_log: one 'mode_policy.changed' row per mode so changed (target_table 'mode_policy'), written by the migration,
--     so above the BEFORE watermark. Lines 26 and 62 read only up to the watermark; lines 68 and 76 read above it only for
--     target_table 'release_distributions' and 'maintenance_windows'. So no line reads these rows. Expected moves, named:
--     the mode_policy rows and these audit rows; neither is a preserved line.
--   Every other change is a function (restated or new), a column (the three), a CHECK, a trigger or a grant.
--   So every line except line 10 must read identically BEFORE and AFTER.
--
-- The Z header that follows is kept for its method; its pair (300 -> 308) and its "only line 10 and lines 84 to 86 move"
-- are Z's, not D2-R's (on 308 -> 309 lines 84 to 86 read the same on both reads).
-- Z's staging promotion: the preservation query (Second Eye, 23 Nov, for Sharon's check; Bob's delta
-- PRESERVATION-Z-DELTA.md on claude/bob-41-master-plan). C3w-1's query (c3w-1-evidence/preservation-C3w-1.sql, ed4a90cc on
-- main) restated for Z, with the same method, lines and rules. Read A2b's header for the method, C2w's for lines 63 to 68,
-- A3's for lines 77 to 81 and C3w-1's for 82 and 83. Only what differs is stated here.
--
-- THE PAIR IS 300 -> 308. Staging holds C3w-1's 300 (last 20270122190000); Z adds eight migrations. Line 10 is expected
-- to read "300 / 20270122190000" BEFORE and "308 / 20270123170000" AFTER.
--
-- THE EIGHT MIGRATIONS AT THE FREEZE (claude/z; Sharon PASS on Z1, Z2 and item 8 (1bf3e983)):
--   20270123100000  7a6e82588430d449da2ea01afc5fc0ac037c15aa0c63a2e53407317bd73bbf0c
--   20270123110000  aa0fe1c3f12f79bf3c1f6d0222d8000b481f966905163cde0532379bcb42558d
--   20270123120000  da3a537a07ccbe91b8332cb24030083721021bac8f252341729be8ff75a3cc29
--   20270123130000  99a63dc46c8b1d744d57f6b666a91e555f6d92d114e5c7e7a84911f55d6ed338
--   20270123140000  b3d91e0e43a696b7e9c28af1ce4a609202a6b1f0d1a66c7a9dd6361d27fa0a39
--   20270123150000  22d8603af6f6b5159f38f7ed76902115c703908d914d21f7186b132a3779363b
--   20270123160000  4ac9af981993f79cf04e3c71b1360cb5b83f7346de32a0006af044b91ee370bb
--   20270123170000  91c1437c675005218f62145ea10b78ae3ddd1dd28dc84119ff1bdbc035f327eb
--   The promotion checks each against the deployed file before migrating; any difference stops it.
--
-- READ ONLY, run exactly as C3w-1's: in a read-only transaction, BEFORE with the two `batas` values null, AFTER with the
-- two printed values written in.
--
-- STEP 0 FIRST (new; step0-Z.sql): a read-only count of the pass marks below K-07's floors. Every count must be 0;
-- otherwise stop and report: K-07 would leave a constraint NOT VALID and Sharon's C4 (line 84) could not be met. The
-- owner decides.
--
-- WHAT Z CHANGES THAT A PRESERVED LINE COULD SEE: nothing (Bob's delta §2, read from the eight files):
--   * No row is written at migration time: every insert, update and delete is inside a function body. The check blocks
--     read only the catalogue, plus count(*) for K-07's floors.
--   * K-07 adds three CHECK constraints NOT VALID and validates each only when no row is below its floor (line 84).
--   * D-6 (with Sharon's Z2-1) revokes privileges only: nine functions (line 85) and two tables' SELECT (line 86); it
--     drops nothing and deletes no row (line 87).
--   * No column is added to an existing table; no client_rpc_registry row is inserted (line 83 stays 5).
--   * Every other change is a function, restated in full or new (pilihan_dipilih, pilihan_tunggal; internal:
--     tujuan_gerbang_terlewat, admin_akun_dapat_masuk, admin_sekolah_lain_ada, kunci_admin_sekolah). Item 8's advisory
--     locks are taken at call time only.
--   So lines 20 to 83 and 87 must read identically BEFORE and AFTER; only line 10 and lines 84 to 86 move.
--
-- IF A MIGRATION FAILS PART-WAY: each file is its own transaction, so staging is left at the last one applied, never in
-- the middle of one. Stop and report to the owner; no AFTER read is taken, and nothing is retried without the owner.
--
-- AFTER THE PROMOTION (after-promotion list, README): v6-pre-request.sql and c3w-r3-bahan.sql print OK; line 84 reads
-- true for all three; the owner checks the dashboard for a PGRST_DB_PRE_REQUEST override.
--
-- WHAT DIFFERS FROM C3w-1's QUERY: this header, line 10's expectation, the labels of lines 82 and 83 (both now read the
-- same on both reads), and the new lines 84 to 87. Line 87 orders each table's rows by their to_jsonb text, not by id:
-- seven of the nine feedback_* tables have no id column. Every other line is C3w-1's, unchanged.
with batas as (
  select coalesce(null::timestamptz, now()) as saat,
         coalesce(null::bigint, (select max(id) from public.audit_log)) as audit_id
),
-- A3's three session columns, kept out of line 58 exactly as in A3's AFTER read; C3w-1 adds no column to an existing table
-- D2-R (Sharon §7.2 (d)): 20270124100000 adds the sitting's capture; those three columns are kept out of the line too
baru as (select array['pengendali_sesi', 'generasi', 'lanjut_diminta_pada', 'assistance_policy', 'bersertifikasi', 'percobaan_ke']::text[] as k),
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

  -- ── state: expected to move from 300 to 308 by the promotion (line 10; the header)
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
  union all select 82, 'state · AI tables present, and their rows (C3w-1''s; unchanged by Z)',
    (select count(*) || ' present; rows ' || coalesce(string_agg(c.relname || '=' ||
              (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', c.relname), false, true, '')))[1]::text,
              ', ' order by c.relname), '-')
       from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
        and c.relname in ('ai_opsi', 'ai_plafon_platform', 'ai_hak_sekolah', 'ai_permintaan', 'ai_percobaan', 'ai_asal_soal', 'ai_penerimaan'))
  union all select 83, 'state · client_rpc_registry rows for the AI functions (5; unchanged by Z)',
    (select count(*) || ': ' || coalesce(string_agg(function_name, ', ' order by function_name), '-')
       from public.client_rpc_registry where function_name like 'ai\_%')

  -- ── Z's lines (new in this pair; Bob's delta §4)
  union all select 84, 'state · the three K-07 floors, conname:convalidated (empty BEFORE; all true AFTER, Sharon C4)',
    (select coalesce(string_agg(conname || ':' || convalidated, ', ' order by conname), '-') from pg_constraint
      where conrelid in ('public.school_pass_marks'::regclass, 'public.assessment_assignments'::regclass, 'public.assessment_sessions'::regclass)
        and conname in ('school_pass_marks_percent_floor', 'assessment_assignments_pass_mark_floor', 'assessment_sessions_pass_mark_floor'))
  union all select 85, 'state · client EXECUTE on the nine feedback functions, (function, role) pairs (as read BEFORE; 0 AFTER)',
    (select count(*) filter (where has_function_privilege(r.rolname, p.oid, 'EXECUTE')) || ' (anon '
         || count(*) filter (where r.rolname = 'anon' and has_function_privilege(r.rolname, p.oid, 'EXECUTE')) || ', authenticated '
         || count(*) filter (where r.rolname = 'authenticated' and has_function_privilege(r.rolname, p.oid, 'EXECUTE')) || ')'
       from pg_proc p cross join pg_roles r
      where p.pronamespace = 'public'::regnamespace and r.rolname in ('anon', 'authenticated')
        and p.proname in ('close_feedback_cycle', 'feedback_questionnaire', 'feedback_result', 'feedback_subjects_for_class', 'my_feedback_cycles',
                          'open_feedback_cycle', 'publish_feedback_question_set', 'publish_feedback_threshold', 'submit_feedback'))
  union all select 86, 'state · client SELECT on the nine feedback_* tables, (table, role) pairs (as read BEFORE; 0 AFTER)',
    (select count(*) filter (where has_table_privilege(r.rolname, c.oid, 'SELECT')) || ': '
         || coalesce(string_agg(c.relname || '/' || r.rolname, ', ' order by c.relname, r.rolname) filter (where has_table_privilege(r.rolname, c.oid, 'SELECT')), '-')
       from pg_class c cross join pg_roles r
      where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname like 'feedback\_%' and r.rolname in ('anon', 'authenticated'))
  union all select 87, 'feedback records: per table, rows and the md5 of to_jsonb ordered by its text (identical; nothing deleted)',
    (select count(*) || ' tables; ' || string_agg(c.relname || '=' ||
              (xpath('/row/v/text()', query_to_xml(format(
                'select count(*) || '':'' || md5(coalesce(string_agg(to_jsonb(t)::text, '','' order by to_jsonb(t)::text), '''')) as v from public.%I t',
                c.relname), false, true, '')))[1]::text, ', ' order by c.relname)
       from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname like 'feedback\_%')

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

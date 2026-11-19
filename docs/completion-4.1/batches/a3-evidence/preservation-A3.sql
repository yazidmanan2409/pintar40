-- A3's staging promotion: the preservation query. DRAFT for Sharon's check (Bob, 18 Nov). C2w's query (c2w-evidence/
-- preservation-C2w.sql, frozen at aa5f5741) restated for A3, with the same method, lines and rules. Read A2b's header
-- for the method and C2w's for lines 63 to 68. Only what differs is stated here.
--
-- THE PAIR IS 284 -> 290 (restated 19 Nov 00:12 after Sharon's check: claude/a3 now carries SIX migrations, so main's 284
-- plus six is 290; earlier 284 -> 288 for four, first written 284 -> 287). A3 merges after C2w (the plan). claude/a3 at e6e28e52 branches from main
-- (1b1cada8, 282) and carries four migrations (three at e6e28e52), so Second Eye's "284 -> 285" counts A3's own chain from main. Once C2w
-- has landed, staging holds 284 and A3 adds:
--   * 20270121200000_the_start_lock_covers_what_the_attempt_count_counts (sha256 17a8c527f2bfeb51...);
--   * 20270121210000_attempts_count_across_an_assessments_versions (sha256 c88630e7a3fba12d...);
--   * 20270121220000_a_sitting_has_one_writer (sha256 a08a491afd546569fdd658d4f849741a78b13eca0d24834983cb8f77307387c6 at
--     4c5f6383, after V-1; it was 370d5c0a…b688 at e6e28e52. After V-2, at fc7a26e5: 150984a6400d7ceb6a088d43187cbe306fd3a1d7ad2f756defc630060110d09d.
--     The hashes are restated at the freeze).
--   * 20270121230000_every_sitting_writer_takes_its_row (sha256 7b60e23362d9e209557f847e5cb31aba74e2c60ec11a29b6716b0258bfb314a7 at
--     d19c9a6b): redefines terminate_session, extend_session_deadline, finalize_session and percobaan_tandai in full, each
--     now taking the sitting FOR UPDATE. No column, no data change at migration time, so no preserved line can see it.
--   * 20270121240000_a_sitting_is_recovered_on_another_session: the recovery act, the teacher's authorisation and
--     minta_izin_lanjut. It ADDS assessment_sessions.lanjut_diminta_pada (timestamptz, nullable, no default, so no
--     existing row changes) and CREATES pengerjaan_izin_lanjut (a new table, so no preserved line reads it).
--   * 20270121250000_a_recovery_is_shown: the screens' reads. Functions only: no column, no table, no data change.
--
-- THE SIX MIGRATIONS AT THE FREEZE (claude/a3 5ae2d406, product at merge 05354e4f; Sharon PASS, A3-DIFFS-671175e4.md):
--   20270121200000  17a8c527f2bfeb51f9247028747166655162b9ab676251ff704a6ce4d401abd7
--   20270121210000  c88630e7a3fba12d6d825037d4eed410a21cbd0b80f507c924ef37628f43dbb0
--   20270121220000  150984a6400d7ceb6a088d43187cbe306fd3a1d7ad2f756defc630060110d09d
--   20270121230000  7b60e23362d9e209557f847e5cb31aba74e2c60ec11a29b6716b0258bfb314a7
--   20270121240000  361b8f3ff56948a90ad52e93a2a3ca2fb42b34f92d44ede8427d1a74d045262b
--   20270121250000  4064fa73172851b780ad8dcda36b9b4a0f79aea03142bb42481bff34974958e2
--   The promotion checks each against the deployed file before migrating; any difference stops it.
-- Their timestamps sort after C2w's two (20270121100000, 110000), and no function is defined by both batches (Bob,
-- checked at e6e28e52 against aa5f5741). A3's candidate must be brought up to C2w before its freeze; the pair is
-- then re-checked against that head. Line 10 is expected to read "284 / 20270121110000" BEFORE and
-- "290 / 20270121250000" AFTER.
--
-- READ ONLY, run exactly as C2w's: in a read-only transaction, BEFORE with the two `batas` values null, AFTER with the
-- two printed values written in.
--
-- WHAT A3 CHANGES THAT A PRESERVED LINE COULD SEE:
--   * 20270121210000 ADDS assessment_definitions.lineage_root_definition_id and BACKFILLS it on every existing row, then
--     sets it not null. This is the only migration-time write to existing rows in A3. Line 77 fingerprints the table
--     without that column; line 78 is its state (BEFORE: every row without a root; AFTER: 0 without a root). The
--     backfill fires the existing BEFORE UPDATE trigger assessment_definitions_quick_rules_fixed, whose column list
--     does not include the new column, so it passes; the table has no updated_at.
--     RISK: garis_definisi_periksa() raises before the backfill if staging's course or module chain is ambiguous, and
--     the backfill raises on a cycle. Either aborts the migration. Sharon's ruling (f6d3a2cb): no staging copy, which
--     would be a data transfer of its own. Instead, STEP 0 of the BEFORE read, under the owner's same authorisation and
--     read only: step0-A3-lineage.sql, the same predicates as plain SELECTs, counts and ids only. Any hit stops the
--     promotion before migrating. Bob ran step 0 on a local scratch database: clean 0/0, a planted ambiguous chain
--     flags its id, and a planted cycle flags its three ids.
--   * 20270121220000 ADDS assessment_sessions.pengendali_sesi (nullable), assessment_sessions.generasi and
--     responses.generasi (int not null default 1, check >= 1); two BEFORE INSERT triggers; redefines pengerjaan_tolak,
--     pengerjaan_gerbang, start_learning_session, note_item_view and session_final_responses. It deletes no data.
--     `baru` leaves the THREE new session columns (pengendali_sesi, generasi and, from 240000, lanjut_diminta_pada) out
--     of line 58; line 79 (new) fingerprints responses on ended sittings
--     without generasi; line 80 must read 0 on both reads (the default fills 1); line 81 is state: a sitting open at
--     the merge has no controller, and the learner's first write claims it once (D6), so it moves only on open
--     sittings. Its "ended" count must stay 0.
--   * 20270121200000 redefines four functions and changes no row at migration time.
--   No other column is added, altered or retyped (checked at the frozen head, 5ae2d406).
--
-- IF A MIGRATION FAILS PART-WAY (Sharon's ruling (a), 19 Nov: step 0 is the gate). Step 0 exists so that 210000's
-- lineage check cannot fail on staging. If it fails all the same, staging is left at 285: 200000 applied, which only
-- replaces functions and changes no row. A re-run after the cause is fixed applies the remaining five. **On any failure:
-- stop and report to the owner; no AFTER read is taken,** and nothing is retried without the owner.
--
-- WHAT DIFFERS FROM C2w's QUERY: `baru` (three columns), line 10's expectation, and lines 77 to 81. Every other line is
-- C2w's, unchanged.
--
-- REVIEWED by Sharon (f6d3a2cb, A3-PRESERVATION-8cb312ee.md): PASS for a local dry run, with 284 -> 287 accepted (now 288 with the fourth migration; re-checked at the freeze)
-- (to be re-checked against A3's head once it carries C2w, with its three migration sha256s). Not yet rehearsed.
-- The local dry run at 284 -> 290 must show (Sharon's six proofs):
--   (1) no plants: only lines 10 and 78 move; line 81 reads 0, ended 0, on both reads;
--   (2) a first record_answer on an open pre-cutoff sitting: line 81 reads 1, ended 0;
--   (3) note_item_view on an ENDED pre-cutoff sitting: at e6e28e52 it claims (ended 1); after V-2 it must read 0.
--       Both are recorded;
--   (4) a definition's title update moves line 77 only;
--   (5) generasi = 2 on a pre-cutoff sitting makes line 80 read 1; the same on a pre-cutoff response makes it 2;
--   (6) a response value update on an ended sitting moves line 79.
--   Also, the step-0 plant: an ambiguous chain makes step 0's line 1 read 1, and the migration aborts cleanly at 284.
--   Also, step 0's line 4 reference (Sharon, S0-1, confirmed): run step 0 on a local database migrated to C2w's head
--   (284, before A3) and record its line 4 in this evidence folder before the BEFORE read. Staging's line 4 must equal it.
with batas as (
  select coalesce(null::timestamptz, now()) as saat,
         coalesce(null::bigint, (select max(id) from public.audit_log)) as audit_id
),
-- A3 adds three columns to assessment_sessions (the header): left out of line 58
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

  -- ── state: expected to move from 284 to 290 by the promotion (line 10; the header)
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

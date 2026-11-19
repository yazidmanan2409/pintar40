-- C2w's staging promotion: the preservation query. A2b's query (docs/completion-4.1/batches/a2b-evidence/
-- preservation-A2b.sql, as merged in 1b1cada8) restated for C2w, with the same method, lines and rules. Read that
-- file's header for the method. Only what differs is stated here.
--
-- THE PAIR IS 282 -> 284. Staging holds 282 migrations today (A2b, promoted 17 Nov). C2w adds two:
--   * 20270121100000, a distribution's place for its controller (A2B-R2);
--   * 20270121110000, the reviewer notes (C2W-COMPLETION.md §7, be01b4f2; restated 17 Nov 07:50, pending the build).
-- Line 10 is expected to read "282 / 20270120240000" BEFORE the merge and "284 / 20270121110000" AFTER it. Nothing else
-- under "preserved" may move.
--
-- READ ONLY, run exactly as A2b's was: in a read-only transaction, BEFORE with the two `batas` values null, AFTER with
-- the two printed values written in.
--
-- WHAT C2w CHANGES:
--   * 20270121100000: two functions (distribusi_tempat, distribusi_berlaku), their grants, and two new
--     client_rpc_registry rows.
--   * 20270121110000_a_reviewer_notes_what_a_wrong_option_reveals.sql, as BUILT at the candidate 53a31d91 (sha256
--     54b6569df6d08535c6c44fcb180ea3bdf78cc15db81ae10d06a32fbc3e585196; Bob's header check, 17 Nov 23:20):
--     - a NEW table, catatan_peninjau: three indexes, RLS on, revoked from public, anon and authenticated;
--     - NEW functions: catatan_tolak, catatan_peninjau_jaga and _jaga_kosongkan (guard triggers on the new table),
--       catatan_peninjau_bukan_sumber_metrik, _garis, _kunci, _baris, _tulis, _studio, _kelas, and
--       assert_reviewer_notes_are_not_evidence. Grants go to authenticated on _tulis, _studio and _kelas only;
--     - a NEW trigger, catatan_peninjau_bukan_sumber_metrik, on the existing table metric_sources. It is a new object
--       (no existing function body is edited, unlike the design's wording), and it writes no row;
--     - NEW rows in three existing registries: record_class_registry (catatan_peninjau), orang_lampiran (L1-F4:
--       catatan_peninjau.ditulis_oleh, fde309c5), and client_rpc_registry (_tulis, _studio, _kelas). The upsert's
--       conflict clause can only meet rows with these three new function names;
--     - a check block that raises if the notes are read as evidence or a reader takes a row lock. It writes nothing.
--     None of the query's lines reads metric_sources, record_class_registry, orang_lampiran or client_rpc_registry, so
--     none of these moves a preserved line.
--   Every new row is created after the cutoff, so it falls outside every fingerprint. The new table holds no row at the
--   BEFORE read. C2w adds no column to an existing table, alters no column, changes no column's type and changes no
--   existing row. If the built migration does otherwise, this header and the exclusions are restated first.
--
-- WHAT DIFFERS FROM A2b's QUERY:
--   * `baru` and `mw_keluar` are now empty. maintenance_windows.reason_code exists on both sides of this pair, so it is
--     preserved like any other column: line 63 now covers it.
--   * `mw_jalan` holds only the seven columns a legitimate act writes (A2b's line 75 rule is unchanged).
--     reason_code is now fingerprinted on unfinished windows too.
--   * Line 64 is now state, not a preserved line. It counts the windows created before the cutoff that carry a code.
--     Since A2b such windows are legitimate, and lines 63 and 75 hold their values.
--   * Lines 65 to 68 are new: release_distributions, which C2w's code reads and «Tarik izin» writes.
--     - Line 65 covers the grants withdrawn at the cutoff, every column. It must not move.
--     - Line 66 covers the grants active at the cutoff, without the four columns a withdrawal writes. It must not move.
--       This is safe because the table's check ties WITHDRAWN to withdrawn_at and withdrawn_by, and its trigger
--       makes WITHDRAWN terminal (Sharon, C2W-PRESERVATION-78336be2.md).
--     - Line 67 is state: the grants withdrawn since the cutoff.
--     - Line 68 is the rule for line 67, computed (Sharon P1). It counts the grants withdrawn since the cutoff that have
--       no audit_log row above the watermark with action RELEASE_DISTRIBUTION_WITHDRAWN, that grant as target_id, and
--       withdrawn_by_person_id as actor_person_id. It MUST read 0. withdraw_release_distribution checks the
--       authority before it writes the row and its audit together, so a match proves the authorised path. Anything
--       other than 0 is a material discrepancy.
--
-- Not yet rehearsed. Before the BEFORE read, a local dry run at 282 -> 284 must show three things (Sharon):
--   * only line 10 moves;
--   * a planted withdrawal through the function shows in line 67, with line 68 at 0;
--   * a planted direct update, with no audit row, makes line 68 read 1.
with batas as (
  select coalesce('2026-11-18 01:13:44.128096+00'::timestamptz, now()) as saat,
         coalesce(336::bigint, (select max(id) from public.audit_log)) as audit_id
),
-- C2w adds no column (the header): nothing is left out
baru as (select array[]::text[] as k),
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

  -- ── state: expected to move from 282 to 284 by the promotion (line 10; the header)
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

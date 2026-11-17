-- A2b's staging promotion: the preservation query (PLAN-A2B-C2W.md A13; the Chief Architect's GO of 16 Nov; restated
-- for Sharon's freeze checks P1 to P3, A2B-FREEZE-3c58620e.md at e07e67a6).
--
-- THE PAIR IS 267 -> 282. Staging holds 267 migrations today (A2a change C, the last promotion). A2b adds fifteen,
-- 268 to 282 (20270120100000 to 20270120240000; the last is the start path, A2b reopened 16 Nov). Line 10 is expected to
-- read "267 / 20270119270000" BEFORE the merge and "282 / 20270120240000" AFTER it; nothing else under "preserved" may move.
--
-- READ ONLY. Run it in a read-only transaction, once BEFORE the merge and once AFTER the promotion's last check. Nothing
-- here writes.
--   * BEFORE the merge: leave the two values in `batas` as null. The read takes now() and audit_log's last id, and
--     prints them on its first two lines.
--   * AFTER: write those two printed values into `batas`, in place of the two nulls, and run it again.
--
-- ONLY ROWS THAT EXISTED BEFORE. Every fingerprint covers only the rows that existed at the "before" read: by creation
-- time up to the cutoff, and audit_log by id up to its watermark. Each is a count and an md5 of each row's content in
-- id order (to_jsonb(row)), so rows written after the cutoff fall outside both reads by construction.
--
-- WHAT IS LEFT OUT, AND WHY: only what A2b adds, plus three exclusions each with its own reason.
--   * `baru` and `mw_keluar` hold the one column A2b adds to data that already exists, maintenance_windows.reason_code
--     (20270120190000). It exists only after A2b, so leaving it out by name is what lets the same text read at 267 and
--     at 282. Its value on the existing rows is held on its own line instead: line 64, no window created before the cutoff
--     carries a code (the migration adds the column with no default and fills nothing).
--     A2b's fifteen migrations add no other column, alter no other column, change no column's type, and change no
--     existing row: every insert and update they carry is inside a function body, or a new client_rpc_registry row
--     (created after the cutoff, outside every fingerprint). So every other existing column is fingerprinted,
--     including the darurat_* and closure_* columns of assessment_sessions and the node_ids, t_stop and t_lift of
--     maintenance_windows, which A2b's own code can write.
--   * Line 44, auth.users: a user is read as locked or not (banned_until is not null), not by the stored instant. Since
--     233 (4.0, L-1) a lock is stored as akun_terkunci_sampai(), an instant the platform computes; the lock itself is
--     what must be preserved. A2b writes nothing in auth.
--   * Line 58, assessment_sessions: only sittings that had ended at the cutoff, and were not ended or closed after it.
--     The scheduled closure (A1, every 5 minutes) legitimately ends sittings still open past their deadline; lines 70
--     to 72 read those, with the rule there.
--   * maintenance_windows is read in two parts (Sharon P3):
--     - line 63, the windows finished at the cutoff (ended_at, else ends_at, at or before it): every column but
--       reason_code;
--     - line 75, the windows not finished at the cutoff: every column but reason_code and the seven a legitimate act
--       writes (`mw_jalan`: starts_at for «Mulai sekarang», ends_at for «Perpanjang», ended_at, ended_by_person_id and
--       end_reason for an end, activation_recorded_at and deactivation_recorded_at for the minute tick). It still
--       covers kind, platform, institution_ids, node_ids, message, reason, created_by_person_id, created_at, t_stop and
--       t_lift. THE RULE: if line 75 differs, every window that differs must have an audit_log row above the
--       watermark (line 76 lists them); a difference with none is a material discrepancy. An emergency lift between
--       the reads writes t_lift and is such a row.
--   * Lines 73 and 74 are state, not preserved: 73 lists the unfinished windows by id; 74 counts finished windows whose
--     deactivation the tick has not yet recorded (expected 0 at the "before" read; if not 0, line 63 may move by
--     exactly those rows).
--
-- Rehearsed locally 267 -> 282 with planted windows: PRESERVATION-A2B.md.
with batas as (
  select coalesce(null::timestamptz, now()) as saat,
         coalesce(null::bigint, (select max(id) from public.audit_log)) as audit_id
),
-- only what A2b adds (the header): maintenance_windows.reason_code
baru as (select array['reason_code']::text[] as k),
mw_keluar as (select array['reason_code']::text[] as k),
-- an unfinished window: reason_code, and the seven columns a legitimate act writes (the header, line 75)
mw_jalan as (select array['reason_code', 'starts_at', 'ends_at', 'ended_at', 'ended_by_person_id', 'end_reason',
  'activation_recorded_at', 'deactivation_recorded_at']::text[] as k),
demo as (select id from public.institutions where slug = 'sekolah-demo-pintar'),
uji as (select id from public.institutions where slug like 'sekolah-uji-%'),
orang_demo as (select distinct e.person_id from public.enrollments e where e.institution_id = (select id from demo)
               union select r.person_id from public.role_assignments r where r.institution_id = (select id from demo)),
sidik(n, garis, nilai) as (
  -- ── the read itself
  select 1, 'cutoff (write into batas.saat after the merge)', (select saat::text from batas)
  union all select 2, 'audit_log watermark (write into batas.audit_id after the merge)', (select audit_id::text from batas)

  -- ── state: expected to move from 267 to 282 by the promotion (line 10; the header)
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

  union all select 63, 'maintenance_windows finished at the cutoff (without reason_code)',
    (select count(*) || ' ' || md5(coalesce(string_agg((to_jsonb(t) - (select k from mw_keluar))::text, ',' order by t.id), ''))
       from public.maintenance_windows t, batas
      where t.created_at <= batas.saat and coalesce(t.ended_at, t.ends_at) <= batas.saat)

  union all select 64, 'maintenance_windows created before the cutoff that carry a reason_code',
    (select count(*)::text from public.maintenance_windows t, batas
      where t.created_at <= batas.saat and to_jsonb(t) ->> 'reason_code' is not null)
  union all select 75, 'maintenance_windows not finished at the cutoff (without reason_code and the seven an act writes)',
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

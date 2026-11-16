/**
 * A2b, STEP 1 · THE INVENTORY TEST AND THE BOUNDARY TESTS K1 TO K12, RED FIRST (PLAN-A2B-C2W.md §2.3 and §2.5; Sharon's
 * A2B-K-TESTS-43ce13bf.md at cfa23583: K1 to K7 agreed as written, K8 to K12 required before any product code).
 *
 * A2B-I01 classes every writer of a class's work; A2B-I02 every reader and writer of maintenance_windows (Bob's
 * dispatch, 16 Nov 02:30 UTC). Written before any product code, on main at eff99f98. Each test states the behaviour A2b must have; a test that is
 * red on main is red because that behaviour does not exist yet, never because its fixture failed: every test first
 * checks its own baseline (the act it judges succeeds when no window is open), and reports a broken fixture as such.
 *
 * THE INTERFACE THESE TESTS FIX (for Sharon's read; each is a name or code the product commits must provide):
 *   * the place guard: public.maintenance_affects_place(node uuid, at timestamptz), called by every refused writer
 *     (directly, or by its trigger for a start); it reads clock_timestamp(), never now();
 *   * the work-scoped refusal: errcode PR040, detail MAINTENANCE_PLACE (never PT503);
 *   * D4: as THE PLAN §5.3 words it (the Chief Architect's ruling, 16 Nov), a sitting with no duration is refused only
 *     inside T−15; PINTAR has no per-assessment duration, so a start is refused MAINTENANCE_NO_NEW_START inside T−15,
 *     as today, and never for its assignment's close (K3, A2B-D4X);
 *   * extend: public.perpanjang_pemeliharaan(p_window uuid, p_ends_at timestamptz, p_reason text), PLANNED only;
 *     refused on an EMERGENCY window with PR110 MAINTENANCE_EMERGENCY_LIFT_ONLY, and on a window that has ended (judged
 *     by clock_timestamp() against ends_at and ended_at) with PR110 MAINTENANCE_NOT_OPEN; resume early is the existing
 *     change_maintenance(…, 'AKHIRI', …);
 *   * the node parameter: schedule_maintenance(…, p_nodes => uuid[]); a bad class refused with PR110
 *     MAINTENANCE_NODE_INVALID before any constraint; the CHECK maintenance_windows_class_is_emergency gone.
 *
 * Fixtures: one transaction each, rolled back, except K1's lock-wait leg and K9, which need two real connections and
 * so commit their rows (with the replica role) and remove them after, whatever the run did. Where a fixture needs a
 * PLANNED class window before K10's migration exists, the CHECK is dropped inside the rolled-back transaction (a no-op
 * once K10's migration has dropped it).
 */
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";
import { allKeys, t, type HleEvent } from "../src/lib/hle";
import { psqlBaris } from "./a2a-f01.test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { arahTolakMulai, batasTahap, hariLain, jamJendela, kapitalAwal, jendelaDiumumkan, tahapSetelahBaca, BACA_ULANG_MAKS, type JendelaSaya, type StatusSaya } from "../src/lib/pemeliharaan-kontrak";

// ─────────────────────────────────────────────────────────────────────────── helpers

function psqlStdin(db: string, sql: string): string {
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: sql });
  if (r.status !== 0) throw new Error(r.stderr.slice(0, 400));
  return r.stdout.trim();
}
/** Runs a script; every output line `kunci|nilai` becomes hasil[kunci]. */
function barisKunci(db: string, sql: string): { hasil: Record<string, string>; err: string } {
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: sql });
  const hasil: Record<string, string> = {};
  for (const l of (r.stdout ?? "").split("\n")) { const i = l.indexOf("|"); if (i > 0) hasil[l.slice(0, i)] = l.slice(i + 1); }
  return { hasil, err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n").filter((x) => /ERROR|DETAIL/.test(x)).join(" ") };
}
const sebagai = (uid: string) => `select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);`;
const tanpaOrang = `select set_config('request.jwt.claims', '', true);`;

/** pg_temp.a2b_coba(sql): runs the act in a subtransaction and undoes it, returning OK or sqlstate:detail.
 *  pg_temp.a2b_tetap(sql): the same, but keeps what the act wrote. */
const ALAT = `
create function pg_temp.a2b_coba(p_sql text) returns text language plpgsql as $c$
declare v_s text; v_d text;
begin
  execute p_sql;
  raise exception using errcode = 'P0001', message = 'A2B_OK';
exception when others then
  get stacked diagnostics v_s = returned_sqlstate, v_d = pg_exception_detail;
  if sqlerrm = 'A2B_OK' then return 'OK'; end if;
  return v_s || ':' || coalesce(v_d, '');
end $c$;
create function pg_temp.a2b_tetap(p_sql text) returns text language plpgsql as $c$
declare v_s text; v_d text;
begin
  execute p_sql;
  return 'OK';
exception when others then
  get stacked diagnostics v_s = returned_sqlstate, v_d = pg_exception_detail;
  return v_s || ':' || coalesce(v_d, '');
end $c$;`;
const TEMPAT = "PR040:MAINTENANCE_PLACE";
const ALASAN = "A2b boundary test: K";

/** The world of the two-place cases. School X: class 7A (the seed's class of a learner whose teacher has an account) and
 *  7B, made for the test (a copy of 7A's node); the teacher T teaches both; a learner in each, each with an open sitting
 *  (S_A in 7A, S_B in 7B). School Y: another school's class CY, where T also teaches, with its learner's open sitting
 *  S_Y. All read once from the seed; the rows are created inside the caller's transaction. */
type Dunia = {
  X: string; Y: string; kA: string; kB: string; kY: string;
  guru: string; guruUid: string; murid: string; muridUid: string; enrA: string; memA: string;
  murid2: string; murid2Uid: string; enrB: string; memB: string;
  muridY: string; enrY: string; adminX: string; adminXUid: string; sysUid: string; sys: string;
  sumber: string; SA: string; SB: string; SY: string; PA: string;
};
const ID = (n: string) => `a2b00001-0000-4000-8000-${n.padStart(12, "0")}`;
export function dunia(db: string): Dunia {
  const g = psqlStdin(db, `select e.id || '|' || e.person_id || '|' || m.id || '|' || m.node_id || '|' || e.institution_id
     || '|' || a.auth_user_id || '|' || rg.person_id || '|' || ag.auth_user_id
  from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
  join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
  join public.accounts a on a.person_id = e.person_id
  join public.role_assignments rg on rg.role = 'EDUCATOR' and rg.scope_node_id = m.node_id and rg.revoked_at is null
   and now() >= rg.valid_from and now() < rg.valid_until and rg.person_id <> e.person_id
  join public.accounts ag on ag.person_id = rg.person_id
  where e.status = 'ACTIVE' and e.valid_to is null
    and not exists (select 1 from public.person_suspensions ps where ps.person_id in (e.person_id, rg.person_id) and ps.ended_at is null)
  order by e.id, rg.id limit 1;`);
  const [enrA, murid, memA, kA, X, muridUid, guru, guruUid] = g.split("|");
  if (!guruUid) throw new Error("no live learner with an account in a class whose teacher has one: the seed changed");
  const y = psqlStdin(db, `select e.id || '|' || e.person_id || '|' || m.node_id || '|' || e.institution_id
  from public.enrollments e join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
  join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
  where e.status = 'ACTIVE' and e.valid_to is null and e.institution_id <> '${X}' and e.person_id not in ('${murid}', '${guru}')
  order by e.id limit 1;`);
  const [enrY, muridY, kY, Y] = y.split("|");
  if (!Y) throw new Error("no learner in a class of a second school: the seed changed");
  const l2 = psqlStdin(db, `select p.id || '|' || a.auth_user_id from public.persons p join public.accounts a on a.person_id = p.id
   where p.id not in ('${murid}', '${guru}', '${muridY}')
     and not exists (select 1 from public.enrollments e where e.person_id = p.id and e.institution_id = '${X}')
     and not exists (select 1 from public.role_assignments r where r.person_id = p.id and r.revoked_at is null)
     and not exists (select 1 from public.person_suspensions ps where ps.person_id = p.id and ps.ended_at is null)
   order by p.id limit 1;`).split("|");
  if (!l2[1]) throw new Error("no second learner with an account, no role and no suspension: the seed changed");
  const adm = psqlStdin(db, `select r.person_id || '|' || a.auth_user_id from public.role_assignments r join public.accounts a on a.person_id = r.person_id
    where r.role = 'INSTITUTION_ADMIN' and r.institution_id = '${X}' and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until
      and r.person_id not in ('${murid}', '${guru}') order by r.id limit 1;`).split("|");
  const sys = psqlStdin(db, `select r.person_id || '|' || a.auth_user_id from public.role_assignments r join public.accounts a on a.person_id = r.person_id
    where r.role = 'SYSTEM_ADMIN' and r.revoked_at is null order by r.id limit 1;`).split("|");
  const sumber = psqlStdin(db, `select s.id from public.assessment_sessions s join public.assessment_definitions d on d.id = s.assessment_definition_id
    where s.status = 'FINALIZED' and d.late_sync_grace_seconds >= 120
      and exists (select 1 from public.presented_items p join public.items i on i.id = p.item_id
                   where p.session_id = s.id and i.item_type = 'MCQ_SINGLE' and p.position = 1)
    order by s.id limit 1;`);
  if (!adm[1] || !sys[1] || !sumber) throw new Error("no school admin, no Admin PINTAR, or no source sitting with a single-choice item: the seed changed");
  return { X, Y, kA, kB: ID("b7"), kY, guru, guruUid, murid, muridUid, enrA, memA, murid2: l2[0], murid2Uid: l2[1],
    enrB: ID("e2"), memB: ID("e3"), muridY, enrY, adminX: adm[0], adminXUid: adm[1], sys: sys[0], sysUid: sys[1], sumber,
    SA: ID("5a"), SB: ID("5b"), SY: ID("59"), PA: ID("ca") };
}
/** A sitting of `orang` in `kelas`, copied from the source, open since an hour ago, its own deadline as given. */
const sesi = (d: Dunia, id: string, orang: string, enr: string, kelas: string, inst: string, tenggat: string) => `
insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', '${id}', 'status', 'IN_PROGRESS', 'person_id', '${orang}',
  'enrollment_id', '${enr}', 'institution_id', '${inst}', 'class_node_id', '${kelas}', 'cohort_node_id', null,
  'authoritative_deadline', ${tenggat}, 'created_at', now() - interval '60 minutes', 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'termination_cause', null, 'termination_reason', null, 'terminated_by_person_id', null, 'attempt_request_id', null,
  'deadline_extended_count', 0, 'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null,
  'darurat_keluar', null))).*
  from public.assessment_sessions s where s.id = '${d.sumber}';
delete from public.assessment_results where session_id = '${id}';`;
/** The world's rows, inside the caller's transaction (the replica role is left on: the caller sets origin). */
export function duniaSql(d: Dunia, tenggat = "now() + interval '30 minutes'"): string {
  return `set local session_replication_role = replica;
update public.memberships set valid_from = valid_from - interval '1 day' where id = '${d.memA}';
update public.enrollments set valid_from = valid_from - interval '1 day' where id = '${d.enrA}';
update public.role_assignments set valid_from = valid_from - interval '1 day'
 where person_id = '${d.guru}' and role = 'EDUCATOR' and scope_node_id = '${d.kA}' and revoked_at is null;
-- 7B: a second class of school X, a copy of 7A's node
insert into public.org_nodes (id, institution_id, parent_id, kind, name, jalur, academic_period_id, is_active, created_at, learning_context)
select '${d.kB}', n.institution_id, n.parent_id, n.kind, n.name || ' (7B)', n.jalur[1:cardinality(n.jalur) - 1] || '${d.kB}'::uuid,
       n.academic_period_id, true, now() - interval '2 days', n.learning_context
  from public.org_nodes n where n.id = '${d.kA}';
-- T teaches 7B, and CY at school Y
insert into public.role_assignments (id, person_id, role, scope_node_id, institution_id, valid_from, valid_until, granted_by)
select '${ID("71")}', r.person_id, r.role, '${d.kB}', r.institution_id, now() - interval '1 day', r.valid_until, r.granted_by
  from public.role_assignments r where r.person_id = '${d.guru}' and r.role = 'EDUCATOR' and r.scope_node_id = '${d.kA}' and r.revoked_at is null
 order by r.id limit 1;
insert into public.role_assignments (id, person_id, role, scope_node_id, institution_id, valid_from, valid_until, granted_by)
select '${ID("72")}', '${d.guru}', 'EDUCATOR', '${d.kY}', '${d.Y}', now() - interval '1 day', now() + interval '300 days', null;
-- the learner of 7B
insert into public.enrollments select (jsonb_populate_record(e, jsonb_build_object('id', '${d.enrB}', 'person_id', '${d.murid2}'))).*
  from public.enrollments e where e.id = '${d.enrA}';
insert into public.memberships select (jsonb_populate_record(m, jsonb_build_object('id', '${d.memB}', 'enrollment_id', '${d.enrB}', 'node_id', '${d.kB}'))).*
  from public.memberships m where m.id = '${d.memA}';
update public.memberships set valid_from = valid_from - interval '1 day'
 where enrollment_id = '${d.enrY}' and valid_to is null;
update public.enrollments set valid_from = valid_from - interval '1 day' where id = '${d.enrY}';
${sesi(d, d.SA, d.murid, d.enrA, d.kA, d.X, tenggat)}
${sesi(d, d.SB, d.murid2, d.enrB, d.kB, d.X, tenggat)}
${sesi(d, d.SY, d.muridY, d.enrY, d.kY, d.Y, tenggat)}
insert into public.presented_items (id, session_id, item_id, institution_id, position, presented_at)
select '${d.PA}', '${d.SA}', p.item_id, '${d.X}', p.position, now() - interval '59 minutes'
  from public.presented_items p where p.session_id = '${d.sumber}' and p.position = 1;
alter table public.maintenance_windows drop constraint if exists maintenance_windows_class_is_emergency;`;
}
/** A window, written directly (the replica role must be on). `nodes`: the classes of a class window, or none.
 *  An EMERGENCY window takes the hosted shape (Sharon's K12-1, C41-1's): `mulai` is its T_stop and `selesai` its
 *  T_lift; its row's starts_at is 3 s before T_stop and its ended_at 2 s before T_lift, so a reader that took the
 *  shift from starts_at and ended_at would be off by a second. */
export function jendela(d: Dunia, id: string, o: { kind?: "PLANNED" | "EMERGENCY"; inst?: string; nodes?: string[]; mulai: string; akhir?: string | null; selesai?: string | null; aktifDicatat?: string | null }): string {
  const kind = o.kind ?? "PLANNED";
  const nodes = o.nodes?.length ? `array[${o.nodes.map((n) => `'${n}'::uuid`).join(", ")}]` : "'{}'::uuid[]";
  const darurat = kind === "EMERGENCY";
  const tstop = darurat ? o.mulai : "null";
  const tlift = darurat && o.selesai ? o.selesai : "null";
  const awal = darurat ? `(${o.mulai}) - interval '3 seconds'` : o.mulai;
  const selesai = darurat && o.selesai ? `(${o.selesai}) - interval '2 seconds'` : o.selesai ?? "null";
  return `insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, ends_at, ended_at, t_stop, t_lift, reason, created_by_person_id, activation_recorded_at)
values ('${id}', '${kind}', false, array['${o.inst ?? d.X}'::uuid], ${nodes}, ${awal}, ${o.akhir ?? "null"}, ${selesai}, ${tstop}, ${tlift},
        '${ALASAN}', '${d.sys}', ${o.aktifDicatat === undefined ? o.mulai : o.aktifDicatat ?? "null"});`;
}
/** The teacher's act on a sitting: A1's extend (a refused writer: staff change to running work). */
const aksiGuru = (S: string) => `$q$select public.tambah_waktu_pengerjaan('${S}', 5, '${ALASAN} act')$q$`;
/** A start: the sitting-insert trigger alone (the seed's sittings are copies, so provenance, the course's release, the
 *  status machine and the pass mark would refuse a copy for their own reasons; they are off in this transaction only). */
const MATI_PICU = `alter table public.assessment_sessions disable trigger _l1f4_assessment_sessions_person_id, disable trigger assessment_sessions_provenance,
  disable trigger assessment_sessions_release_is_its_course, disable trigger assessment_sessions_status,
  disable trigger assessment_sessions_the_pass_mark_is_sealed, disable trigger assessment_sessions_zz_exposed_is_not_assessed;`;
/** Sharon (16 Nov, D12's plant after a restart): a reader of a PERSON-wide answer (maintenance_draining) is answered
 *  by any sitting the learner has, so the fixture removes the learner's other open sittings in its own rolled-back
 *  transaction and reports how many remain (asserted 0), never trusting the database's leftover state. */
const SENDIRI = (d: Dunia) => `set local session_replication_role = replica;
delete from public.assessment_sessions where person_id = '${d.murid}' and id not in ('${d.SA}', '${d.SB}', '${d.SY}') and status <> 'FINALIZED';
select 'lain|' || count(*) from public.assessment_sessions where person_id = '${d.murid}' and id not in ('${d.SA}', '${d.SB}', '${d.SY}') and status <> 'FINALIZED';`;
const mulai = (d: Dunia, orang: string, enr: string, kelas: string, tenggat: string) => `$q$insert into public.assessment_sessions
select (jsonb_populate_record(s, jsonb_build_object('id', gen_random_uuid(), 'status', 'CREATED', 'person_id', '${orang}',
  'enrollment_id', '${enr}', 'institution_id', '${d.X}', 'class_node_id', '${kelas}', 'cohort_node_id', null, 'created_at', now(),
  'authoritative_deadline', ${tenggat}, 'started_at', null, 'finalized_at', null, 'submitted_at', null,
  'closure_kind', null, 'closure_at', null, 'closure_deadline', null, 'frozen_at', null, 'unfrozen_at', null,
  'termination_cause', null, 'darurat_sejak', null, 'darurat_jendela_id', null, 'darurat_dikredit_sampai', null,
  'darurat_keluar', null))).* from public.assessment_sessions s where s.id = '${d.sumber}'$q$`;

const W1 = ID("a1"), W2 = ID("a2"), W3 = ID("a3");

// ═══════════════════════════════════════════════════════════ A2B-I01 · every writer of a class's work, classed

/** The tables a class's work lives in (Sharon's inventory row 4): a function that writes one of them, or a client entry
 *  point that reaches one, is classed. */
const KERJA = /\b(?:insert\s+into|update|delete\s+from)\s+(?:public\.)?(assessment_sessions|learning_assignments|assessment_assignments|lesson_progress|attempt_requests)\b/i;
type Kelas = "REFUSED" | "REFUSED_QUIETLY" | "REFUSED_GRANT" | "ALLOWED" | "SYSTEM" | "INNER";
/** The classing, Sharon's rulings (A2B-COMPLETION.md, "Every writer of a class's work, classed"). Entries marked
 *  `baru` were not named in her table: classed here for her read. */
export const KELAS_PENULIS: Record<string, { kelas: Kelas; alasan: string; baru?: true }> = {
  start_learning_session: { kelas: "REFUSED", alasan: "a start is new work: the sitting-insert trigger (place, T−15)" },
  record_lesson_progress: { kelas: "REFUSED_QUIETLY", alasan: "progress is the class's work; its own code, no redirect, reading stays open" },
  assign_release: { kelas: "REFUSED", alasan: "assigning: a routine staff change to the class's work" },
  ubah_jadwal_penugasan: { kelas: "REFUSED", alasan: "a schedule change" },
  tambah_waktu_pengerjaan: { kelas: "REFUSED", alasan: "A1's extend: a staff change to running work" },
  lanjutkan_pengerjaan: { kelas: "REFUSED", alasan: "A1's resume: a staff change to running work" },
  extend_session_deadline: { kelas: "REFUSED", alasan: "the older staff extend, the same act as A1's", baru: true },
  akhiri_pengerjaan: { kelas: "REFUSED", alasan: "a teacher's early end of a sitting (Sharon)" },
  akhiri_penugasan: { kelas: "REFUSED", alasan: "«Akhiri», «Tarik» (Sharon)" },
  terminate_session: { kelas: "REFUSED", alasan: "a staff-initiated ending of a sitting, as akhiri_pengerjaan", baru: true },
  tutup_pengerjaan_ditahan: { kelas: "REFUSED", alasan: "a staff-initiated ending of a held sitting, as akhiri_pengerjaan", baru: true },
  launch_quick_assessment: { kelas: "REFUSED", alasan: "a new assignment and new sittings" },
  launch_selected_quick_assessment: { kelas: "REFUSED", alasan: "the same act as launch_quick_assessment, for chosen learners", baru: true },
  move_learning_assignment_release: { kelas: "REFUSED", alasan: "a routine staff change" },
  kenaikan_tetapkan: { kelas: "REFUSED", alasan: "refused as a whole act: if any class it touches is under an active planned window, nothing is promoted" },
  minta_percobaan: { kelas: "REFUSED", alasan: "a further attempt is new work" },
  putuskan_percobaan: { kelas: "REFUSED_GRANT", alasan: "a decline is allowed (closes a pending request); a grant is refused (opens new work)" },
  koreksi_kunci_pindah: { kelas: "ALLOWED", alasan: "changes only what new starts use; an integrity correction across classes" },
  tegaskan_koreksi_kunci: { kelas: "ALLOWED", alasan: "confirms a key correction, as koreksi_kunci_pindah", baru: true },
  akhiri_pendaftaran: { kelas: "ALLOWED", alasan: "a departure: a person leaving is not the class's work being changed" },
  transfer_execute: { kelas: "ALLOWED", alasan: "a transfer: a person moving" },
  tangguhkan_akun: { kelas: "ALLOWED", alasan: "a suspension acts on a person, not on the class's work", baru: true },
  record_answer: { kelas: "ALLOWED", alasan: "the drain (D5, K5): a running sitting is worked on to its deadline and grace", baru: true },
  pause_session: { kelas: "ALLOWED", alasan: "the drain (D5, K5)", baru: true },
  resume_session: { kelas: "ALLOWED", alasan: "the drain (D5, K5)", baru: true },
  submit_session: { kelas: "ALLOWED", alasan: "the drain (D5, K5): a learner hands in", baru: true },
  finish_my_session: { kelas: "ALLOWED", alasan: "the drain (D5, K5): a learner finishes", baru: true },
  assistance_state: { kelas: "ALLOWED", alasan: "a learner's read during the drain; reaches a writer only through the deadline rule (a system closure)", baru: true },
  open_assistance: { kelas: "ALLOWED", alasan: "a learner's act inside a running sitting (the drain)", baru: true },
  note_item_view: { kelas: "ALLOWED", alasan: "a learner's item view inside a running sitting (the drain)", baru: true },
  platform_schema_lint: { kelas: "ALLOWED", alasan: "writes no work: reaches a writer's name only as a lint over the catalogue", baru: true },
  finalize_session: { kelas: "SYSTEM", alasan: "finalization: a window must never keep work open past its end" },
  pengerjaan_putus_tenggat: { kelas: "SYSTEM", alasan: "A1's decider: the drain's own end" },
  tutup_asesmen_terbuka: { kelas: "SYSTEM", alasan: "the closure of open sittings, reached from departures and promotions" },
  open_assessment_session: { kelas: "INNER", alasan: "the insert of a start, reached only from start paths; the trigger guards the row" },
  percobaan_tandai: { kelas: "INNER", alasan: "writes only attempt_request_id, at a start" },
  pengerjaan_lepas_darurat: { kelas: "INNER", alasan: "A2a's release of a stop's mark (first touch, the batch)" },
  pengerjaan_kredit_darurat: { kelas: "INNER", alasan: "A2a's credit of a lifted stop" },
  pengerjaan_tandai_darurat: { kelas: "INNER", alasan: "A2a's marking" },
  pengerjaan_tahan_orang: { kelas: "INNER", alasan: "A1's hold, on a suspension" },
  pengerjaan_keluar_terapkan: { kelas: "INNER", alasan: "A2a's departure applied at first touch" },
};
const PENJAGA = /\bmaintenance_affects_place\s*\(/;
const PICU_MULAI = "enforce_no_new_sitting_in_maintenance";

/** Every function of the class's work, and what is wrong with the classing. `tanam`: DDL first, rolled back. */
export function inventaris(db: string, tanam = ""): { fungsi: string[]; salah: string[] } {
  const q = "select p.proname, p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'";
  const r = "select function_name from public.client_rpc_registry";
  const src = new Map<string, string>();
  const baris = psqlBaris(db, tanam ? `begin; ${tanam}; ${q}; rollback;` : q);
  for (const [fn, s] of baris) src.set(fn, (src.get(fn) ?? "") + "\n" + (s ?? "").replace(/--[^\n]*/g, " "));
  const klien = new Set(psqlBaris(db, r).map(([f]) => f));
  const langsung = new Set([...src].filter(([, s]) => KERJA.test(s)).map(([f]) => f));
  const nama = [...src.keys()];
  const panggil = new Map<string, string[]>();
  for (const [f, s] of src) panggil.set(f, nama.filter((g) => g !== f && s.includes(g) && new RegExp(`\\b${g}\\s*\\(`).test(s)));
  const sampai = (f: string, lihat = new Set<string>()): boolean => {
    if (langsung.has(f)) return true;
    if (lihat.has(f)) return false;
    lihat.add(f);
    return (panggil.get(f) ?? []).some((g) => sampai(g, lihat));
  };
  /** whether the function, or one it calls, asks the place question */
  const bertanya = (f: string, lihat = new Set<string>()): boolean => {
    if (PENJAGA.test(src.get(f) ?? "")) return true;
    if (lihat.has(f)) return false;
    lihat.add(f);
    return (panggil.get(f) ?? []).some((g) => bertanya(g, lihat));
  };
  const fungsi = [...new Set([...langsung, ...[...klien].filter((f) => src.has(f) && sampai(f))])].sort();
  const salah: string[] = [];
  for (const f of fungsi) {
    const k = KELAS_PENULIS[f];
    if (!k) { salah.push(`${f} writes a class's work (or reaches a writer from a client) and is not classed`); continue; }
    const lewatPicu = f === "start_learning_session" && PENJAGA.test(src.get(PICU_MULAI) ?? "");
    if (["REFUSED", "REFUSED_QUIETLY", "REFUSED_GRANT"].includes(k.kelas) && !bertanya(f) && !lewatPicu)
      salah.push(`${f} is classed ${k.kelas} and does not ask the place question (maintenance_affects_place)`);
    if (k.kelas === "SYSTEM" && PENJAGA.test(src.get(f) ?? ""))
      salah.push(`${f} is a system closure and asks the place question: a window must never keep work open`);
  }
  for (const f of Object.keys(KELAS_PENULIS)) if (!fungsi.includes(f)) salah.push(`${f} is classed but no longer writes a class's work`);
  return { fungsi, salah };
}
const TANAM_INV = `create function public._a2b_i01_tanam(p uuid) returns void language plpgsql as $t$
begin update public.learning_assignments set status = status where id = p; end $t$`;

// ═══════════════════════════════════════════════════════════ A2B-I02 · every reader and writer of maintenance_windows, classed

type KelasJendela = "WRITER" | "PERSON" | "PLACE" | "EMERGENCY" | "ADMIN";
/** Every function that names maintenance_windows, or takes or returns its row, classed by what A2b asks of it.
 *  `menunggu`: A2b's new function, named so the enumeration is never green by omission. */
export const KELAS_JENDELA: Record<string, { kelas: KelasJendela; alasan: string; menunggu?: true }> = {
  schedule_maintenance: { kelas: "WRITER", alasan: "the insert of a PLANNED window; A2b adds the node parameter (K10) and the reason code (D2)" },
  change_maintenance: { kelas: "WRITER", alasan: "start now, cancel, resume early (AKHIRI) for PLANNED; A2a's fenced lift for EMERGENCY (B1's form); writes no ends_at (K7)" },
  maintenance_record_edges: { kelas: "WRITER", alasan: "the edge recorder (audit marks only, skip locked); unchanged; K9" },
  stop_pintar_now: { kelas: "WRITER", alasan: "A2a's emergency insert; unchanged" },
  perpanjang_pemeliharaan: { kelas: "WRITER", alasan: "A2b's extend: the only new writer of a planned window's end (K6 to K9)", menunggu: true },
  maintenance_affects: { kelas: "PERSON", alasan: "whether a window reaches a person: A2b keeps only EMERGENCY and platform-wide PLANNED here (R-1; K11)" },
  maintenance_affects_kini: { kelas: "PERSON", alasan: "the same, on current placement" },
  maintenance_affects_pada: { kelas: "PERSON", alasan: "the same, at an instant (EMERGENCY's T_stop)" },
  maintenance_block_for_me: { kelas: "PERSON", alasan: "the request hook's question: person-level windows only after A2b (K11: none for a work-scoped window)" },
  pintar_status_saya: { kelas: "PERSON", alasan: "the status read: says person-level or work-scoped, the place and the zone (D8)" },
  maintenance_jendela_atas: { kelas: "PLACE", alasan: "the one place predicate (Sharon, 16 Nov): the window's school holds the node and its classes are none or on the node's path; called by maintenance_affects_place, maintenance_mulai_tolak and maintenance_draining_di (D15, D16)" },
  maintenance_draining_di: { kelas: "PLACE", alasan: "draining per window (the Chief Architect, 16 Nov): only sittings in the window's place, every sitting for a platform-wide window; read by pintar_status_saya's 'berjalan' (D14, D15)" },
  maintenance_affects_place: { kelas: "PLACE", alasan: "A2b's place guard (clock_timestamp(), no lock)", menunggu: true },
  enforce_no_new_sitting_in_maintenance: { kelas: "PLACE", alasan: "the sitting-insert trigger: the place and T−15 (K1, K3, K4)" },
  assessment_orientation: { kelas: "PLACE", alasan: "commit 7: the start screen's orientation, which names the window that refuses the start (its start, end and classes), from maintenance_mulai_tolak's one call" },
  maintenance_mulai_tolak: { kelas: "PLACE", alasan: "A2b's one start rule (the place, then T−15), read by the trigger and by may_start_assessment" },
  catat_penolakan_henti: { kelas: "EMERGENCY", alasan: "A2a's O1 refusal record" },
  orang_dilindungi: { kelas: "EMERGENCY", alasan: "A2a's protection of a person" },
  pengerjaan_dilindungi: { kelas: "EMERGENCY", alasan: "A2a's protection of a sitting" },
  pengerjaan_keluar_terapkan: { kelas: "EMERGENCY", alasan: "A2a's departure after a stop" },
  pengerjaan_lepas_darurat_semua: { kelas: "EMERGENCY", alasan: "A2a's release batch" },
  pengerjaan_pagar: { kelas: "EMERGENCY", alasan: "A2a's first-touch helper" },
  pengerjaan_tahan_orang: { kelas: "EMERGENCY", alasan: "A1's hold, reading a stop's T_stop" },
  pengerjaan_tandai_darurat: { kelas: "EMERGENCY", alasan: "A2a's marking" },
  penghentian_berlaku: { kelas: "EMERGENCY", alasan: "the stop in force" },
  penghentian_dampak: { kelas: "EMERGENCY", alasan: "a stop's reach" },
  penghentian_ditahan: { kelas: "EMERGENCY", alasan: "a stop's held count" },
  penghentian_ditahan_jendela: { kelas: "EMERGENCY", alasan: "Admin PINTAR's held count of one window, through penghentian_ditahan" },
  penghentian_geser: { kelas: "EMERGENCY", alasan: "a stop's shift" },
  penghentian_kredit: { kelas: "EMERGENCY", alasan: "a lifted stop's credit" },
  penghentian_orang: { kelas: "EMERGENCY", alasan: "a stop's people at T_stop" },
  maintenance_controls: { kelas: "ADMIN", alasan: "who may change a window (the scheduling screen)" },
  maintenance_list: { kelas: "ADMIN", alasan: "the scheduling screen's list" },
  maintenance_state: { kelas: "ADMIN", alasan: "a window's state at an instant (TERJADWAL, MENJELANG, AKTIF, BERAKHIR)" },
};
const HANYA_DARURAT = /'EMERGENCY'|\bt_stop\b/;

/** The functions that name maintenance_windows or take or return its row, and what is wrong with the classing. */
export function inventarisJendela(db: string, tanam = ""): { fungsi: string[]; salah: string[] } {
  // Sharon's I02-1: every schema but the system's, so a later function outside public cannot pass unclassed
  const q = `select case when n.nspname = 'public' then p.proname else n.nspname || '.' || p.proname end, p.prosrc,
       ('public.maintenance_windows'::regtype = any (p.proargtypes::oid[]::regtype[])
        or p.prorettype = 'public.maintenance_windows'::regtype)::text
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname not in ('pg_catalog', 'information_schema', 'auth', 'storage', 'cron', 'extensions', 'pg_toast',
                         'selftest')   -- the test harness's own helpers, which build fixtures: not product code
   and n.nspname not like 'pg_temp%' and n.nspname not like 'pg_toast%'
   and p.prolang <> (select l.oid from pg_language l where l.lanname = 'c')`;
  const src = new Map<string, string>();
  const jenis = new Set<string>();
  for (const [fn, s, t] of psqlBaris(db, tanam ? `begin; ${tanam}; ${q}; rollback;` : q)) {
    src.set(fn, (src.get(fn) ?? "") + "\n" + (s ?? "").replace(/--[^\n]*/g, " "));
    if (t === "true") jenis.add(fn);
  }
  const fungsi = [...src].filter(([f, s]) => /\bmaintenance_windows\b/i.test(s) || jenis.has(f)).map(([f]) => f).sort();
  const salah: string[] = [];
  for (const f of fungsi) {
    const k = KELAS_JENDELA[f];
    if (!k) { salah.push(`${f} reads or writes maintenance_windows and is not classed`); continue; }
    if (k.kelas === "EMERGENCY") {
      const callees = [...src.keys()].filter((g) => g !== f && new RegExp(`\\b${g}\\s*\\(`).test(src.get(f)!));
      if (!HANYA_DARURAT.test(src.get(f)!) && !callees.some((g) => KELAS_JENDELA[g]?.kelas === "EMERGENCY"))
        salah.push(`${f} is classed EMERGENCY and neither reads only emergency windows nor delegates to an EMERGENCY reader: a PLANNED class window would reach it`);
    }
  }
  for (const [f, k] of Object.entries(KELAS_JENDELA)) {
    if (!src.has(f)) salah.push(k.menunggu ? `${f} (A2b's, ${k.kelas}) does not exist yet` : `${f} is classed but no longer exists`);
    else if (!fungsi.includes(f)) salah.push(`${f} is classed but no longer reads or writes maintenance_windows`);
  }
  return { fungsi, salah };
}
const TANAM_I02 = `create function public._a2b_i02_tanam() returns bigint language sql as $t$ select count(*) from public.maintenance_windows $t$;
create schema _a2b_i02_lain; create function _a2b_i02_lain.baca() returns bigint language sql as $t$ select count(*) from public.maintenance_windows $t$`;

// ═══════════════════════════════════════════════════════════ the boundary tests

/** K1 (a), one connection: a school-wide planned window starts 1.5 s after the transaction began; the teacher's act
 *  before the start, and after it in the same transaction (its now() still before the start). A start (the sitting
 *  insert) the same way across T−15. */
function k1Satu(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W1, { mulai: "clock_timestamp() + interval '1.5 seconds'", akhir: "clock_timestamp() + interval '1 hour'", aktifDicatat: null })}
${jendela(d, W2, { inst: d.Y, mulai: "clock_timestamp() + interval '15 minutes 1.5 seconds'", akhir: "clock_timestamp() + interval '2 hours'", aktifDicatat: null })}
${MATI_PICU}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.guruUid)}
select 'sebelum|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
${tanpaOrang}
select 'mulai_sebelum|' || pg_temp.a2b_coba(${mulai(d, d.muridY, d.enrY, d.kY, "null").replace(`'${d.X}', 'class_node_id'`, `'${d.Y}', 'class_node_id'`)});
select pg_sleep(2);
${sebagai(d.guruUid)}
select 'sesudah|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
${tanpaOrang}
select 'mulai_sesudah|' || pg_temp.a2b_coba(${mulai(d, d.muridY, d.enrY, d.kY, "null").replace(`'${d.X}', 'class_node_id'`, `'${d.Y}', 'class_node_id'`)});
select 'now_sebelum|' || (now() < (select starts_at from public.maintenance_windows where id = '${W1}'))::text;
rollback;`);
}

/** K1 (b), two connections: the window starts while the teacher's transaction waits on the sitting's row, held by
 *  another; it reaches its write after the start. Only what the case needs is committed (the sitting S_A, copied, and a
 *  school-wide planned window, valid before K10), and removed after, whatever the run did. */
async function k1Kunci(db: string, d: Dunia) {
  const { psqlLain, tidur } = await import("./balapan");
  const bersih = `begin; set local session_replication_role = replica;
delete from public.audit_log where target_table in ('maintenance_windows', 'assessment_sessions') and target_id in ('${W1}', '${d.SA}');
delete from public.maintenance_windows where id = '${W1}';
delete from public.assessment_sessions where id = '${d.SA}';
commit;`;
  try {
    psqlStdin(db, `begin; set local session_replication_role = replica;
${sesi(d, d.SA, d.murid, d.enrA, d.kA, d.X, "now() + interval '30 minutes'")}
${jendela(d, W1, { mulai: "clock_timestamp() + interval '2 seconds'", akhir: "clock_timestamp() + interval '1 hour'", aktifDicatat: null })}
commit;`);
    const pemegang = psqlLain(`begin; select 1 from public.assessment_sessions where id = '${d.SA}' for update; select pg_sleep(3.5); commit;`);
    await tidur(400);
    const t = await psqlLain(`begin; ${ALAT} ${sebagai(d.guruUid)} select 'HASIL|' || pg_temp.a2b_coba(${aksiGuru(d.SA)}) || '|' || (now() < (select starts_at from public.maintenance_windows where id = '${W1}'))::text || '|' || (clock_timestamp() >= (select starts_at from public.maintenance_windows where id = '${W1}'))::text; rollback;`);
    const p = await pemegang;
    const h = (t.out.split("\n").find((l) => l.startsWith("HASIL|")) ?? "").split("|");
    return { ok: t.ok && p.ok, err: t.err || p.err, hasil: h[1] ?? "", mulaiSebelum: h[2] === "true", tulisSesudah: h[3] === "true", tunggu: t.ms };
  } finally {
    psqlStdin(db, bersih);
  }
}

/** K2: a window that began an hour ago ends 1.5 s into the transaction; the act before the end, and after it in the
 *  same transaction (its now() still before the end). */
function k2(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W1, { mulai: "now() - interval '1 hour'", akhir: "clock_timestamp() + interval '1.5 seconds'" })}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.guruUid)}
select 'sebelum|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
select pg_sleep(2);
select 'sesudah|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
select 'now_sebelum|' || (now() < (select ends_at from public.maintenance_windows where id = '${W1}'))::text;
rollback;`);
}

/** K3 and K4: a start whose own deadline falls after a planned class window's start (in 30 min; deadline in 60 min)
 *  or before it (deadline in 20 min); an untimed start 20 min and 10 min before a window (T−15 only). */
function k3k4(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W1, { nodes: [d.kA], mulai: "now() + interval '30 minutes'", akhir: "now() + interval '2 hours'", aktifDicatat: null })}
${jendela(d, W2, { nodes: [d.kB], mulai: "now() + interval '10 minutes'", akhir: "now() + interval '2 hours'", aktifDicatat: null })}
${MATI_PICU}
set local session_replication_role = origin;
${ALAT}
select 'awal|' || pg_temp.a2b_coba(${mulai(d, d.muridY, d.enrY, d.kY, "now() + interval '60 minutes'").replace(`'${d.X}', 'class_node_id'`, `'${d.Y}', 'class_node_id'`)});
select 'k3_lewat|' || pg_temp.a2b_coba(${mulai(d, d.murid, d.enrA, d.kA, "now() + interval '60 minutes'")});
select 'k3_cukup|' || pg_temp.a2b_coba(${mulai(d, d.murid, d.enrA, d.kA, "now() + interval '20 minutes'")});
select 'k4_20|' || pg_temp.a2b_coba(${mulai(d, d.murid, d.enrA, d.kA, "null")});
select 'k4_10|' || pg_temp.a2b_coba(${mulai(d, d.murid2, d.enrB, d.kB, "null")});
select 'k3_10|' || pg_temp.a2b_coba(${mulai(d, d.murid2, d.enrB, d.kB, "now() + interval '5 minutes'")});
-- Sharon (03:59): the screen's answer, may_start_assessment, beside the trigger's, one refused and one allowed: the
-- learner's assessment assignment at 7A, open, outside a chapter, no attempt limit; its close is the deadline a start
-- would get (start_learning_session sets it), 60 min (after the window's start at 30) and then 20 min
set local session_replication_role = replica;
update public.assessment_assignments set node_id = '${d.kA}', institution_id = '${d.X}', status = 'OPEN', opens_at = null,
       closes_at = now() + interval '60 minutes', learning_assignment_id = null
 where id = (select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}');
update public.assessment_definitions set attempt_limit = null
 where id = (select assessment_definition_id from public.assessment_sessions where id = '${d.SA}');
set local session_replication_role = origin;
${sebagai(d.muridUid)}
select 'layar_lewat|' || (select x.ok::text || ':' || x.reason from public.may_start_assessment((select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}')) x);
set local session_replication_role = replica;
update public.assessment_assignments set closes_at = now() + interval '20 minutes'
 where id = (select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}');
set local session_replication_role = origin;
select 'layar_cukup|' || (select x.ok::text || ':' || x.reason from public.may_start_assessment((select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}')) x);
${tanpaOrang}
rollback;`);
}

/** The Chief Architect's R-A (PLAN-A2B-C2W.md at e15fe966): the code on each side of a planned class window's start.
 *  One minute before it a start in the class is refused MAINTENANCE_NO_NEW_START; one second after it,
 *  MAINTENANCE_PLACE; another class's start proceeds in both. Neither code is PT503. */
function rA(db: string, d: Dunia, sisi: "SEBELUM" | "SESUDAH") {
  const awal = sisi === "SEBELUM" ? "clock_timestamp() + interval '1 minute'" : "clock_timestamp() - interval '1 second'";
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W1, { nodes: [d.kA], mulai: awal, akhir: "clock_timestamp() + interval '2 hours'", aktifDicatat: null })}
${MATI_PICU}
set local session_replication_role = origin;
${ALAT}
select 'kelas|' || pg_temp.a2b_coba(${mulai(d, d.murid, d.enrA, d.kA, "null")});
select 'lain|' || pg_temp.a2b_coba(${mulai(d, d.murid2, d.enrB, d.kB, "null")});
${sebagai(d.muridUid)}
select 'kait|' || pg_temp.a2b_coba($q$select pintar_permintaan.periksa()$q$);
${tanpaOrang}
rollback;`);
}

/** Commit 7, the defect commit 3 brought (the Chief Architect's condition 4): the orientation under a maintenance refusal.
 *  The learner's assessment assignment at 7A, open, outside a chapter, no attempt limit, closing in 60 min. One window
 *  per case: P, platform-wide starting in 10 min (inside T−15); K, 7A's starting in 10 min; A, 7A's under way; D, 7A's
 *  starting in 30 min (the start cannot finish); N, none. The orientation is read as the learner. */
function o01(db: string, d: Dunia, kasus: "P" | "K" | "A" | "D" | "N") {
  const w = kasus === "P"
    ? `insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, ends_at, reason, created_by_person_id)
values ('${W1}', 'PLANNED', true, '{}', '{}', now() + interval '10 minutes', now() + interval '2 hours', '${ALASAN}O01', '${d.sys}');`
    : kasus === "K" ? jendela(d, W1, { nodes: [d.kA], mulai: "now() + interval '10 minutes'", akhir: "now() + interval '2 hours'", aktifDicatat: null })
    : kasus === "A" ? jendela(d, W1, { nodes: [d.kA], mulai: "now() - interval '10 minutes'", akhir: "now() + interval '2 hours'" })
    : kasus === "D" ? jendela(d, W1, { nodes: [d.kA], mulai: "now() + interval '30 minutes'", akhir: "now() + interval '2 hours'", aktifDicatat: null })
    : "";
  return barisKunci(db, `begin;
${duniaSql(d)}
update public.assessment_assignments set node_id = '${d.kA}', institution_id = '${d.X}', status = 'OPEN', opens_at = null,
       closes_at = now() + interval '60 minutes', learning_assignment_id = null
 where id = (select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}');
update public.assessment_definitions set attempt_limit = null
 where id = (select assessment_definition_id from public.assessment_sessions where id = '${d.SA}');
${w}
select 'namaA|' || name from public.org_nodes where id = '${d.kA}';
set local session_replication_role = origin;
${sebagai(d.muridUid)}
select 'baris|' || count(*) from public.assessment_orientation((select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}'));
select 'tolak|' || coalesce(o.tolak_pemeliharaan, 'null') || ':' || coalesce(o.tolak_cakupan, 'null')
  || ':' || (o.tolak_mulai is not null)::text || ':' || (o.tolak_selesai is not null)::text || ':' || coalesce(array_to_string(o.tolak_kelas, ','), 'null')
  from public.assessment_orientation((select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}')) o;
${tanpaOrang}
rollback;`);
}
const O01_SAAT = "and (m.ok or m.reason in ('MAINTENANCE_PLACE', 'MAINTENANCE_NO_NEW_START'))";
const O01_TANAM = "and m.ok";

/** K5: a running sitting when a planned class window starts drains through its effective deadline and grace: the
 *  learner's answer is taken; the decider leaves it open before its effective deadline and ends it after its grace.
 *  The effective deadline: the sitting was held by an emergency stop of 45 min, lifted 5 min ago, its own deadline 30
 *  min ago, so its effective deadline is 15 min ahead (the stop's shift, credited at first touch). */
function k5(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d, "now() - interval '30 minutes'")}
${SENDIRI(d)}
update public.assessment_sessions set darurat_sejak = now() - interval '50 minutes', darurat_jendela_id = '${W2}' where id = '${d.SA}';
${jendela(d, W2, { kind: "EMERGENCY", nodes: [d.kA], mulai: "now() - interval '50 minutes'", selesai: "now() - interval '5 minutes'" })}
${jendela(d, W1, { nodes: [d.kA], mulai: "now() - interval '1 minute'", akhir: "now() + interval '2 hours'" })}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.muridUid)}
-- before any touch (D1-2: the marked sitting's pending release is read): no person-level drain; the sitting still runs
select 'blok|' || coalesce(public.maintenance_block_for_me(), 'none');
select 'kuras|' || public.maintenance_draining('${d.murid}')::text;
select 'jawab|' || pg_temp.a2b_tetap($q$select public.record_answer('${d.PA}', 1, '{"posisi": 1}'::jsonb)$q$);
${tanpaOrang}
select 'efektif|' || extract(epoch from (public.pengerjaan_tenggat_efektif('${d.SA}') - now()))::int;
select 'saat|' || extract(epoch from (t_lift - t_stop))::int || ':' || extract(epoch from (t_stop - starts_at))::int || ':' || extract(epoch from (t_lift - ended_at))::int
  from public.maintenance_windows where id = '${W2}';
select 'putus_awal|' || pg_temp.a2b_tetap($q$select public.pengerjaan_putus_tenggat('${d.SA}', false)$q$);
select 'status_awal|' || status from public.assessment_sessions where id = '${d.SA}';
-- past the effective deadline and its grace: the decider (A1's closer runs it) ends it
set local session_replication_role = replica;
update public.assessment_sessions set authoritative_deadline = now() - interval '2 hours', darurat_sejak = null, darurat_dikredit_sampai = null where id = '${d.SA}';
set local session_replication_role = origin;
select 'putus_akhir|' || pg_temp.a2b_tetap($q$select public.pengerjaan_putus_tenggat('${d.SA}', false)$q$);
select 'status_akhir|' || status from public.assessment_sessions where id = '${d.SA}';
rollback;`);
}

/** K12-1's plant: penghentian_geser reading the window's row (starts_at, ended_at) instead of its instants. */
const GESER_SAAT = "select x.t_stop, case when x.ended_at is null then null else coalesce(x.t_lift, x.ended_at) end into v_awal, v_akhir";
const GESER_BARIS = "select x.starts_at, case when x.ended_at is null then null else x.ended_at end into v_awal, v_akhir";

/** D1-2 (Sharon, A2B-COMMIT2-4010fe83.md): a sitting marked by a class stop of 45 min, lifted 5 min ago, its own deadline
 *  30 min ago; no release batch, no touch. Every reader of its deadline shows it shifted (15 min ahead); the release
 *  then changes nothing they show. The assessment assignment is placed at 7A so the teacher's list reads it. */
function d12(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d, "now() - interval '30 minutes'")}
${SENDIRI(d)}
update public.assessment_sessions set darurat_sejak = now() - interval '50 minutes', darurat_jendela_id = '${W2}' where id = '${d.SA}';
-- placed at 7A (the teacher's list), outside any chapter, open and past its close (the learner's open list shows a
-- sitting running past its assignment's close; its own deadline is the sitting's)
update public.assessment_assignments set node_id = '${d.kA}', closes_at = now() - interval '1 minute', status = 'OPEN',
       learning_assignment_id = null
 where id = (select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}');
-- the learner's other sittings of that assessment, earlier, so the teacher's list shows this one
update public.assessment_sessions set created_at = created_at - interval '400 days', started_at = started_at - interval '400 days'
 where person_id = '${d.murid}' and id <> '${d.SA}'
   and assessment_assignment_id = (select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}');
${jendela(d, W2, { kind: "EMERGENCY", nodes: [d.kA], mulai: "now() - interval '50 minutes'", selesai: "now() - interval '5 minutes'" })}
set local session_replication_role = origin;
select 'efektif|' || extract(epoch from (public.pengerjaan_tenggat_efektif('${d.SA}') - now()))::int;
${sebagai(d.muridUid)}
select 'keadaan|' || extract(epoch from ((select x.authoritative_deadline from public.session_state('${d.SA}') x) - now()))::int;
select 'lanjut|' || (select x.ok::text || ':' || x.reason from public.may_continue_session('${d.SA}') x);
select 'saya|' || extract(epoch from ((public.pengerjaan_saya('${d.SA}') ->> 'tenggat')::timestamptz - now()))::int;
select 'kuras|' || public.maintenance_draining('${d.murid}')::text;
-- D1-3: the learner's own reads count no stale mark as a hold
select 'ditahan|' || (public.pengerjaan_saya('${d.SA}') ->> 'ditahan') || ':' || (public.pengerjaan_saya('${d.SA}') ->> 'dilepas_henti');
select 'terbuka|' || count(*) from public.pengerjaan_terbuka_saya() x where x.sesi_id = '${d.SA}';
${sebagai(d.guruUid)}
select 'daftar|' || coalesce((select extract(epoch from (x.tenggat - now()))::int::text from public.daftar_pengerjaan('${d.kA}',
  (select assessment_assignment_id from public.assessment_sessions where id = '${d.SA}')) x where x.sesi_id = '${d.SA}'), 'none');
${tanpaOrang}
-- the release, then the same reader: nothing it shows changes
select 'rilis|' || public.pengerjaan_lepas_darurat('${d.SA}')::text;
select 'sesudah|' || extract(epoch from (public.pengerjaan_tenggat_efektif('${d.SA}') - now()))::int
  || ':' || (darurat_sejak is null)::text from public.assessment_sessions where id = '${d.SA}';
rollback;`);
}
/** The Chief Architect's ruling (16 Nov 08:03, on Sharon's question): draining is PER WINDOW, a person drains for a
 *  window only through a sitting that window affects. 7A's class window under way; the learner is also enrolled at
 *  school Y. "lain": their 7A sitting is handed in and they have an open sitting in CY at school Y; "sini": their 7A
 *  sitting runs and they have none at Y. The status read's 'berjalan' for 7A's window, as the learner. */
function d14(db: string, d: Dunia, kasus: "lain" | "sini") {
  const enrYA = ID("d4"), memYA = ID("d5"), SYA = ID("d6");
  return barisKunci(db, `begin;
${duniaSql(d)}
${SENDIRI(d)}
insert into public.enrollments select (jsonb_populate_record(e, jsonb_build_object('id', '${enrYA}', 'person_id', '${d.murid}'))).*
  from public.enrollments e where e.id = '${d.enrY}';
insert into public.memberships select (jsonb_populate_record(m, jsonb_build_object('id', '${memYA}', 'enrollment_id', '${enrYA}'))).*
  from public.memberships m where m.enrollment_id = '${d.enrY}' and m.valid_to is null order by m.valid_from desc limit 1;
${kasus === "lain" ? `update public.assessment_sessions set status = 'FINALIZED', finalized_at = now(), submitted_at = now() where id = '${d.SA}';
${sesi(d, SYA, d.murid, enrYA, d.kY, d.Y, "now() + interval '1 hour'")}` : ""}
${jendela(d, W1, { nodes: [d.kA], mulai: "now() - interval '10 minutes'", akhir: "now() + interval '1 hour'" })}
set local session_replication_role = origin;
${sebagai(d.muridUid)}
select 'berjalan|' || coalesce((select x ->> 'berjalan' from jsonb_array_elements(public.pintar_status_saya() -> 'pemeliharaan') x
  where x ->> 'id' = '${W1}'), 'tidak tercantum');
select 'blok|' || coalesce(public.maintenance_block_for_me(), 'none');
${tanpaOrang}
rollback;`);
}
/** Batch 2, D2 (THE PLAN §5.3 D2; Daisy A2-KATA-DESAIN B1; the Chief Architect, 16 Nov 09:16: PLANNED rows only, A2a's
 *  emergency writer unchanged): the reason code on the row, its CHECK, schedule_maintenance's p_reason_code, and the
 *  status read's reason for the affected. */
const KODE_ALASAN = ["RUTIN", "PEMBARUAN", "GANGGUAN", "JARINGAN_LISTRIK", "LAINNYA"] as const;
function r01(db: string, d: Dunia) {
  const baris = (jenis: string, kode: string, alasan: string) => `$q$insert into public.maintenance_windows (kind, platform, institution_ids,
  node_ids, starts_at, ends_at, reason, reason_code, created_by_person_id, t_stop) values ('${jenis}', false, array['${d.X}'::uuid], '{}',
  now() + interval '1 day', now() + interval '2 days', '${alasan}', ${kode}, '${d.sys}', ${jenis === "EMERGENCY" ? "now() + interval '1 day'" : "null"})$q$`;
  const jadwal = (kode: string, alasan: string) => `$q$select public.schedule_maintenance(p_platform => false, p_institutions => array['${d.X}'::uuid],
  p_starts_at => now() + interval '2 hours', p_ends_at => now() + interval '3 hours', p_message => null, p_reason => '${alasan}',
  p_notice => false, p_nodes => '{}', p_reason_code => ${kode}) is not null$q$`;
  return barisKunci(db, `begin;
${duniaSql(d)}
set local session_replication_role = origin;
${ALAT}
${KODE_ALASAN.map((k) => `select 'baris_${k}|' || pg_temp.a2b_coba(${baris("PLANNED", `'${k}'`, k === "LAINNYA" ? "Pemadaman listrik gedung" : k)});`).join("\n")}
select 'baris_asing|' || pg_temp.a2b_coba(${baris("PLANNED", "'ASING'", "x")});
select 'baris_darurat_kode|' || pg_temp.a2b_coba(${baris("EMERGENCY", "'RUTIN'", "Masalah keamanan")});
select 'baris_lainnya_panjang|' || pg_temp.a2b_coba(${baris("PLANNED", "'LAINNYA'", "x".repeat(121))});
select 'baris_lama|' || pg_temp.a2b_coba(${baris("PLANNED", "null", "Teks bebas lama")});
select 'baris_darurat_lama|' || pg_temp.a2b_coba(${baris("EMERGENCY", "null", "Masalah keamanan")});
${sebagai(d.adminXUid)}
select 'jadwal_rutin|' || pg_temp.a2b_coba(${jadwal("'RUTIN'", "")});
select 'jadwal_asing|' || pg_temp.a2b_coba(${jadwal("'ASING'", "x")});
select 'jadwal_lainnya_kosong|' || pg_temp.a2b_coba(${jadwal("'LAINNYA'", " ")});
select 'jadwal_lainnya|' || pg_temp.a2b_coba(${jadwal("'LAINNYA'", "Pemadaman listrik gedung")});
select 'jadwal_tanpa_kode|' || pg_temp.a2b_coba(${jadwal("null", "Teks bebas")});
select 'tersimpan|' || coalesce((select string_agg(coalesce(reason_code, '-') || '=' || reason, ',' order by reason_code nulls last)
  from public.maintenance_windows where created_by_person_id = '${d.adminX}' and starts_at > now()), 'none');
${tanpaOrang}
select 'darurat_tanda|' || pg_get_function_identity_arguments('public.stop_pintar_now'::regproc);
rollback;`);
}
/** The status read gives a PLANNED window's reason to the affected (D2): a code, or an old row's text. */
function r02(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W1, { nodes: [d.kA], mulai: "now() - interval '10 minutes'", akhir: "now() + interval '1 hour'" })}
${jendela(d, W3, { nodes: [d.kA], mulai: "now() + interval '20 minutes'", akhir: "now() + interval '2 hours'" })}
update public.maintenance_windows set reason_code = 'PEMBARUAN', reason = 'PEMBARUAN' where id = '${W1}';
update public.maintenance_windows set reason = 'Teks bebas lama' where id = '${W3}';
set local session_replication_role = origin;
${sebagai(d.muridUid)}
select 'w1|' || coalesce((select coalesce(x ->> 'alasan_kode', '-') || ':' || coalesce(x ->> 'alasan', '-') from jsonb_array_elements(public.pintar_status_saya() -> 'pemeliharaan') x where x ->> 'id' = '${W1}'), 'tidak tercantum');
select 'w3|' || coalesce((select coalesce(x ->> 'alasan_kode', '-') || ':' || coalesce(x ->> 'alasan', '-') from jsonb_array_elements(public.pintar_status_saya() -> 'pemeliharaan') x where x ->> 'id' = '${W3}'), 'tidak tercantum');
${tanpaOrang}
rollback;`);
}
/** A6 and A7 end to end (PLAN-A2B-C2W.md §2.4): extend, then resume early, as the school's admin; the audit rows, the
 *  notice, and the place guard at once. */
function a67(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W1, { nodes: [d.kA], mulai: "now() - interval '10 minutes'", akhir: "now() + interval '30 minutes'" })}
insert into public.broadcast_notices (id, platform, institution_ids, message, publish_at, expires_at, created_by_person_id, maintenance_window_id)
select '${ID("e7")}', false, array['${d.X}'::uuid], 'Pemeliharaan kelas', now() - interval '1 hour', w.ends_at, '${d.sys}', w.id
  from public.maintenance_windows w where w.id = '${W1}';
set local session_replication_role = origin;
${ALAT}
create temp table sebelum as select ends_at from public.maintenance_windows where id = '${W1}';
${sebagai(d.adminXUid)}
select 'perpanjang|' || pg_temp.a2b_tetap($q$select public.perpanjang_pemeliharaan('${W1}', now() + interval '90 minutes', 'Pembaruan belum selesai')$q$);
${tanpaOrang}
select 'a6_audit|' || coalesce((select (a.summary ->> 'before')::timestamptz = s.ends_at and (a.summary ->> 'after')::timestamptz = w.ends_at
    and a.summary ->> 'reason' = 'Pembaruan belum selesai' and a.actor_person_id = '${d.adminX}'
  from public.audit_log a, sebelum s, public.maintenance_windows w
 where a.action = 'maintenance.extended' and a.target_id = '${W1}' and w.id = '${W1}' order by a.id desc limit 1)::text, 'tidak ada');
select 'a6_pengumuman|' || ((select expires_at from public.broadcast_notices where id = '${ID("e7")}') = (select ends_at from public.maintenance_windows where id = '${W1}'))::text;
select 'a6_tempat|' || public.maintenance_affects_place('${d.kA}', clock_timestamp() + interval '60 minutes')::text;
${sebagai(d.adminXUid)}
select 'akhiri|' || pg_temp.a2b_tetap($q$select public.change_maintenance('${W1}', 'AKHIRI', 'Pembaruan selesai lebih cepat')$q$);
${tanpaOrang}
select 'a7_audit|' || coalesce((select (a.summary ->> 'ends_at')::timestamptz = w.ends_at and a.at = w.ended_at
    and a.summary ->> 'reason' = 'Pembaruan selesai lebih cepat' and a.actor_person_id = '${d.adminX}' and a.summary ->> 'to_state' = 'BERAKHIR'
  from public.audit_log a, public.maintenance_windows w
 where a.action = 'maintenance.ended_now' and a.target_id = '${W1}' and w.id = '${W1}' order by a.id desc limit 1)::text, 'tidak ada');
select 'a7_tempat|' || public.maintenance_affects_place('${d.kA}', clock_timestamp())::text;
rollback;`);
}
const D12_SAAT = "then public.penghentian_geser(s.person_id, s.darurat_jendela_id) end, interval '0')";
const D12_TANAM = "then null::interval end, interval '0')";
const D13_SAAT = "'ditahan', s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')   -- D1-3: a stale mark holds nothing";
const D13_TANAM = "'ditahan', public.pengerjaan_ditahan(s) or s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')";
/** D1-3's sweep: the stable (read-only) functions that call pengerjaan_ditahan, which counts a stale mark as held. */
export function pembacaDitahan(db: string): string[] {
  return psqlBaris(db, `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.provolatile in ('s', 'i') and p.proname <> 'pengerjaan_ditahan'
      and regexp_replace(p.prosrc, '--[^' || chr(10) || ']*', '', 'g') ~ 'pengerjaan_ditahan[[:space:]]*[(]' order by 1`).map(([f]) => f);
}

/** The status read (A2b commit 4; D8; R-1): a PLANNED class window on 7A, school X in WITA; a platform-wide PLANNED
 *  window; an EMERGENCY class stop on 7B. Read by the teacher of 7A and 7B, by 7B's learner, and by school Y's learner. */
function s01(db: string, d: Dunia) {
  const baca = (uid: string, k: string) => `${sebagai(uid)}
select '${k}|' || coalesce((select jsonb_object_agg(x ->> 'id', jsonb_build_object('c', x ->> 'cakupan', 'z', x ->> 'zona', 'k', x -> 'kelas', 's', x ->> 'sekolah'))
  from jsonb_array_elements(public.pintar_status_saya() -> 'pemeliharaan') x)::text, '{}');`;
  return barisKunci(db, `begin;
${duniaSql(d)}
update public.institutions set zona_waktu = 'Asia/Makassar' where id = '${d.X}';
update public.institutions set zona_waktu = 'Asia/Jayapura' where id = '${d.Y}';
${jendela(d, W1, { nodes: [d.kA], mulai: "now() - interval '10 minutes'", akhir: "now() + interval '1 hour'" })}
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, ends_at, reason, created_by_person_id, activation_recorded_at)
values ('${W3}', 'PLANNED', true, '{}', '{}', now() + interval '30 minutes', now() + interval '2 hours', '${ALASAN}S01', '${d.sys}', null);
${jendela(d, W2, { kind: "EMERGENCY", nodes: [d.kB], mulai: "now() - interval '5 minutes'" })}
select 'namaA|' || name from public.org_nodes where id = '${d.kA}';
set local session_replication_role = origin;
${baca(d.guruUid, "guru")}
${baca(d.murid2Uid, "murid2")}
${tanpaOrang}
rollback;`);
}

/** K6: extend during a window, then end it early. The window ends 1.5 s in; it is extended by an hour; after the old
 *  end the act is still refused; then resume early (AKHIRI), and the act succeeds at once. */
function k6(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W1, { mulai: "now() - interval '10 minutes'", akhir: "clock_timestamp() + interval '1.5 seconds'" })}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.guruUid)}
select 'awal|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
${sebagai(d.adminXUid)}
select 'perpanjang|' || pg_temp.a2b_tetap($q$select public.perpanjang_pemeliharaan('${W1}', clock_timestamp() + interval '1 hour', '${ALASAN}6 extend')$q$);
select pg_sleep(2);
${sebagai(d.guruUid)}
select 'sesudah_perpanjang|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
${sebagai(d.adminXUid)}
select 'akhiri|' || pg_temp.a2b_tetap($q$select public.change_maintenance('${W1}', 'AKHIRI', '${ALASAN}6 resume early')$q$);
${sebagai(d.guruUid)}
select 'sesudah_akhiri|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
${tanpaOrang}
select 'audit|' || count(*) filter (where action = 'maintenance.extended' and (summary ? 'before') and (summary ? 'after') and (summary ? 'reason'))
  from public.audit_log where target_table = 'maintenance_windows' and target_id = '${W1}';
rollback;`);
}

/** The functions that write maintenance_windows.ends_at (an update setting it, or an insert naming it). */
export function penulisAkhir(db: string): string[] {
  const out = new Set<string>();
  for (const [fn, s] of psqlBaris(db, "select p.proname, p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'")) {
    const t = (s ?? "").replace(/--[^\n]*/g, " ");
    if (/\bupdate\s+(?:public\.)?maintenance_windows\b[^;]*\bset\b[^;]*\bends_at\s*=/i.test(t)
        || /\binsert\s+into\s+(?:public\.)?maintenance_windows\s*\([^)]*\bends_at\b/i.test(t)) out.add(fn);
  }
  return [...out].sort();
}
/** Every writer of a window's end (the Chief Architect's three conditions, 13 Nov): schedule_maintenance at insert and
 *  the extend. stop_pintar_now writes no end (an emergency ends only by its lift, ended_at); change_maintenance writes
 *  ended_at and starts_at, never ends_at. */
const PENULIS_AKHIR = ["perpanjang_pemeliharaan", "schedule_maintenance"];

/** K7 and A8: an emergency class stop in force; extend refuses it; the school admin's AKHIRI is refused; Admin PINTAR's
 *  AKHIRI is A2a's fenced lift (T_lift recorded). */
function k7(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W2, { kind: "EMERGENCY", nodes: [d.kA], mulai: "now() - interval '10 minutes'" })}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.sysUid)}
select 'perpanjang_sys|' || pg_temp.a2b_coba($q$select public.perpanjang_pemeliharaan('${W2}', clock_timestamp() + interval '1 hour', '${ALASAN}7 extend')$q$);
${sebagai(d.adminXUid)}
select 'perpanjang_admin|' || pg_temp.a2b_coba($q$select public.perpanjang_pemeliharaan('${W2}', clock_timestamp() + interval '1 hour', '${ALASAN}7 extend')$q$);
select 'akhiri_admin|' || pg_temp.a2b_coba($q$select public.change_maintenance('${W2}', 'AKHIRI', '${ALASAN}7 resume early')$q$);
${sebagai(d.sysUid)}
select 'akhiri_sys|' || pg_temp.a2b_tetap($q$select public.change_maintenance('${W2}', 'AKHIRI', '${ALASAN}7 lift')$q$);
${tanpaOrang}
select 'angkat|' || (t_lift is not null and ended_at is not null and ends_at is null)::text from public.maintenance_windows where id = '${W2}';
rollback;`);
}

/** K8: extend a window that has ended by its time, whether or not the recorder marked the end; and one that ends 1.5 s
 *  into the transaction (its now() before the end). And a window that started with no activation recorded: extend
 *  allowed (the state is never read from activation_recorded_at). */
function k8(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${jendela(d, W1, { mulai: "now() - interval '1 hour'", akhir: "now() - interval '1 second'" })}
update public.maintenance_windows set deactivation_recorded_at = null where id = '${W1}';
${jendela(d, W2, { inst: d.Y, mulai: "now() - interval '1 hour'", akhir: "clock_timestamp() + interval '1.5 seconds'" })}
${jendela(d, W3, { mulai: "now() - interval '5 minutes'", akhir: "now() + interval '1 hour'", aktifDicatat: null })}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.adminXUid)}
select 'berakhir_takdicatat|' || pg_temp.a2b_coba($q$select public.perpanjang_pemeliharaan('${W1}', clock_timestamp() + interval '1 hour', '${ALASAN}8 extend')$q$);
set local session_replication_role = replica;
update public.maintenance_windows set deactivation_recorded_at = now() where id = '${W1}';
set local session_replication_role = origin;
select 'berakhir_dicatat|' || pg_temp.a2b_coba($q$select public.perpanjang_pemeliharaan('${W1}', clock_timestamp() + interval '1 hour', '${ALASAN}8 extend')$q$);
select 'aktif_takdicatat|' || pg_temp.a2b_coba($q$select public.perpanjang_pemeliharaan('${W3}', clock_timestamp() + interval '2 hours', '${ALASAN}8 extend')$q$);
select pg_sleep(2);
${sebagai(d.sysUid)}
select 'baru_berakhir|' || pg_temp.a2b_coba($q$select public.perpanjang_pemeliharaan('${W2}', clock_timestamp() + interval '1 hour', '${ALASAN}8 extend')$q$);
${tanpaOrang}
select 'akhir_tetap|' || (ends_at < now())::text from public.maintenance_windows where id = '${W1}';
rollback;`);
}

/** K9, two connections, both orders, committed rows removed after. Order 1, the recorder first: the window has ended
 *  by its time; the recorder marks its end and holds the row; the extend waits, then is refused. Order 2, extend
 *  first: the window's end is 1 s away; the extend holds the row past the old end; the recorder skips it, and its next
 *  run reads the new end. Either way: one activation row and at most one deactivation row. */
async function k9(db: string, d: Dunia, urutan: 1 | 2) {
  const { psqlLain, tidur } = await import("./balapan");
  const siap = urutan === 1
    ? jendela(d, W1, { mulai: "now() - interval '1 hour'", akhir: "now() - interval '1 second'", aktifDicatat: null })
    : jendela(d, W1, { mulai: "now() - interval '1 hour'", akhir: "clock_timestamp() + interval '1 second'", aktifDicatat: null });
  const rekam = `select set_config('request.jwt.claims', '', true); select public.maintenance_record_edges();`;
  const panjang = `${sebagai(d.adminXUid)} select public.perpanjang_pemeliharaan('${W1}', clock_timestamp() + interval '1 hour', '${ALASAN}9 extend');`;
  try {
    psqlStdin(db, `begin; set local session_replication_role = replica;
${siap}
update public.maintenance_windows set deactivation_recorded_at = null where id = '${W1}';
commit;`);
    let satu, dua;
    if (urutan === 1) {
      const a = psqlLain(`begin; ${rekam} select pg_sleep(2.5); commit;`);
      await tidur(500);
      const b = psqlLain(`begin; ${ALAT} ${sebagai(d.adminXUid)} select 'HASIL|' || pg_temp.a2b_tetap($q$select public.perpanjang_pemeliharaan('${W1}', clock_timestamp() + interval '1 hour', '${ALASAN}9 extend')$q$); commit;`);
      [satu, dua] = await Promise.all([a, b]);
    } else {
      const a = psqlLain(`begin; ${panjang} select pg_sleep(2.5); commit;`);
      await tidur(1500);
      const b = psqlLain(`begin; ${rekam} commit;`);
      [satu, dua] = await Promise.all([a, b]);
      await psqlLain(`begin; ${rekam} commit;`);
    }
    const n = psqlStdin(db, `select count(*) filter (where action = 'maintenance.activated') || '|' || count(*) filter (where action = 'maintenance.deactivated')
      || '|' || (select (ends_at > now())::text from public.maintenance_windows where id = '${W1}')
      from public.audit_log where target_table = 'maintenance_windows' and target_id = '${W1}';`).split("|");
    const hasilPanjang = urutan === 1 ? ((dua.out.split("\n").find((l) => l.startsWith("HASIL|")) ?? "").split("|")[1] ?? "") : (satu.ok ? "OK" : satu.err);
    return { ok: urutan === 1 ? satu.ok && dua.ok : dua.ok, err: [satu.err, dua.err].filter(Boolean).join(" ; "),
      aktif: Number(n[0]), nonaktif: Number(n[1]), diperpanjang: n[2] === "true", panjang: hasilPanjang, tunggu: urutan === 1 ? dua.ms : satu.ms };
  } finally {
    psqlStdin(db, `begin; set local session_replication_role = replica;
delete from public.audit_log where target_table = 'maintenance_windows' and target_id = '${W1}';
delete from public.maintenance_windows where id = '${W1}';
commit;`);
  }
}

/** K10: schedule a PLANNED class window through schedule_maintenance (the school admin); a bad class each way. */
function k10(db: string, d: Dunia, kelas: string) {
  return barisKunci(db, `begin;
${duniaSql(d).replace("alter table public.maintenance_windows drop constraint if exists maintenance_windows_class_is_emergency;", "")}
set local session_replication_role = origin;
${ALAT}
select 'check|' || count(*) from pg_constraint where conname = 'maintenance_windows_class_is_emergency';
${sebagai(d.adminXUid)}
select 'jadwal|' || pg_temp.a2b_coba($q$select public.schedule_maintenance(p_platform => false, p_institutions => array['${d.X}'::uuid],
  p_starts_at => now() + interval '2 hours', p_ends_at => now() + interval '3 hours', p_message => null, p_reason => '${ALASAN}10',
  p_notice => false, p_nodes => array['${kelas}'::uuid]) is not null$q$);
${tanpaOrang}
select 'picu|' || pg_temp.a2b_coba($q$insert into public.maintenance_windows (kind, platform, institution_ids, node_ids, starts_at, ends_at, reason, created_by_person_id)
  values ('PLANNED', false, array['${d.X}'::uuid], array['${kelas}'::uuid], now() + interval '2 hours', now() + interval '3 hours', '${ALASAN}10', '${d.sys}')$q$);
rollback;`);
}

/** K11: work scope. A planned window on 7A: the teacher of 7A and 7B is refused on 7A's work only, never PT503, never
 *  stopped as a person. A school-wide planned window at X: the same teacher, who also teaches CY at school Y, is
 *  refused at X only. Placement now: a learner moved from 7A to 7B after the 7A window began starts in 7B; a learner
 *  moved into 7A after it began is refused there. */
function k11(db: string, d: Dunia, kasus: "KELAS" | "SEKOLAH") {
  const w = kasus === "KELAS"
    ? jendela(d, W1, { nodes: [d.kA], mulai: "now() - interval '10 minutes'", akhir: "now() + interval '1 hour'" })
    : jendela(d, W1, { mulai: "now() - interval '10 minutes'", akhir: "now() + interval '1 hour'" });
  return barisKunci(db, `begin;
${duniaSql(d)}
${w}
${MATI_PICU}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.guruUid)}
select 'aksi_A|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
select 'aksi_B|' || pg_temp.a2b_coba(${aksiGuru(d.SB)});
select 'aksi_Y|' || pg_temp.a2b_coba(${aksiGuru(d.SY)});
select 'kait|' || pg_temp.a2b_coba($q$select pintar_permintaan.periksa()$q$);
select 'blok|' || coalesce(public.maintenance_block_for_me(), 'none');
${tanpaOrang}
${kasus === "KELAS" ? `-- the moves, after the window began
set local session_replication_role = replica;
update public.memberships set valid_to = now() - interval '5 minutes', close_reason = 'MOVED' where id = '${d.memA}';
insert into public.memberships (enrollment_id, node_id, academic_period_id, valid_from)
select '${d.enrA}', '${d.kB}', m.academic_period_id, now() - interval '5 minutes' from public.memberships m where m.id = '${d.memA}';
update public.memberships set valid_to = now() - interval '5 minutes', close_reason = 'MOVED' where id = '${d.memB}';
insert into public.memberships (enrollment_id, node_id, academic_period_id, valid_from)
select '${d.enrB}', '${d.kA}', m.academic_period_id, now() - interval '5 minutes' from public.memberships m where m.id = '${d.memB}';
set local session_replication_role = origin;
select 'pindah_keluar|' || pg_temp.a2b_coba(${mulai(d, d.murid, d.enrA, d.kB, "null")});
select 'pindah_masuk|' || pg_temp.a2b_coba(${mulai(d, d.murid2, d.enrB, d.kA, "null")});` : ""}
rollback;`);
}

/** K12: a planned and an emergency window over 7A. The emergency governs: the teacher's act is refused with A2a's code,
 *  the learner is stopped as a person. After the lift (the planned window still on): the learner's answer is taken
 *  (the stop's credit), the release batch runs, the school's admin ends an enrolment (a departure), and the teacher's
 *  act is refused by the planned window's place, not by the stop. */
function k12(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
update public.assessment_sessions set darurat_sejak = now() - interval '20 minutes', darurat_jendela_id = '${W2}' where id = '${d.SA}';
${jendela(d, W1, { nodes: [d.kA], mulai: "now() - interval '30 minutes'", akhir: "now() + interval '2 hours'" })}
${jendela(d, W2, { kind: "EMERGENCY", nodes: [d.kA], mulai: "now() - interval '20 minutes'" })}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.guruUid)}
select 'aksi_henti|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
${sebagai(d.muridUid)}
select 'blok_henti|' || coalesce(public.maintenance_block_for_me(), 'none');
${tanpaOrang}
set local session_replication_role = replica;
update public.maintenance_windows set ended_at = now() - interval '1 minute 2 seconds', t_lift = now() - interval '1 minute' where id = '${W2}';
set local session_replication_role = origin;
${sebagai(d.muridUid)}
select 'blok_angkat|' || coalesce(public.maintenance_block_for_me(), 'none');
select 'jawab_angkat|' || pg_temp.a2b_coba($q$select public.record_answer('${d.PA}', 1, '{"posisi": 1}'::jsonb)$q$);
${tanpaOrang}
-- the release at first touch (the release batch is a committing procedure, so it cannot run in a rolled-back
-- transaction; here its per-sitting step, the helper every writer takes first)
select 'rilis|' || pg_temp.a2b_coba($q$select public.pengerjaan_pagar('${d.SA}')$q$);
${sebagai(d.guruUid)}
select 'aksi_angkat|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
${sebagai(d.adminXUid)}
select 'keluar_angkat|' || pg_temp.a2b_coba($q$select public.akhiri_pendaftaran('${d.enrB}', 'WITHDRAWN', null, null)$q$);
rollback;`);
}

/** A window-free baseline: the teacher's act on each sitting, and a start, succeed with no window open. */
function dasar(db: string, d: Dunia) {
  return barisKunci(db, `begin;
${duniaSql(d)}
${MATI_PICU}
set local session_replication_role = origin;
${ALAT}
${sebagai(d.guruUid)}
select 'A|' || pg_temp.a2b_coba(${aksiGuru(d.SA)});
select 'B|' || pg_temp.a2b_coba(${aksiGuru(d.SB)});
select 'Y|' || pg_temp.a2b_coba(${aksiGuru(d.SY)});
${tanpaOrang}
select 'mulai|' || pg_temp.a2b_coba(${mulai(d, d.murid, d.enrA, d.kA, "now() + interval '60 minutes'")});
${sebagai(d.muridUid)}
select 'jawab|' || pg_temp.a2b_coba($q$select public.record_answer('${d.PA}', 1, '{"posisi": 1}'::jsonb)$q$);
rollback;`);
}
/** Fails the test on a broken fixture, so that red is never a fixture's. */
function cekDasar(c: Checks, db: string, d: Dunia): boolean {
  const b = dasar(db, d);
  const ok = !b.err && b.hasil.A === "OK" && b.hasil.B === "OK" && b.hasil.Y === "OK" && b.hasil.mulai === "OK" && b.hasil.jawab === "OK";
  c.expect(ok, `THE FIXTURE, not the behaviour: with no window open, the teacher's act on S_A, S_B, S_Y, a start and an answer must succeed: ${b.err || JSON.stringify(b.hasil)}`);
  return ok;
}

const jalan = (fn: (c: Checks, db: string, d: Dunia) => Promise<string> | string) => async () => {
  const c = new Checks();
  const db = process.env.SUPABASE_DB_URL!;
  const d = dunia(db);
  if (!cekDasar(c, db, d)) return c.verdict("the fixture failed; the boundary was not judged");
  const ringkas = await fn(c, db, d);
  return c.verdict(ringkas);
};

/** R-B's window and status, for the pure planner (no database). */
const jendelaUji = (mulaiMs: number, o: Partial<JendelaSaya> = {}): JendelaSaya => ({ id: "w", jenis: "PLANNED", keadaan: "TERJADWAL",
  mulai: new Date(mulaiMs).toISOString(), selesai: null, pesan: null, menguasai: false, berjalan: false, terkumpul: null, kelas: ["7A"],
  kelasLain: false, kelasId: ["k"], cakupan: "TEMPAT", sekolah: "S", zona: "Asia/Makassar", ...o });
const statusUji = (j: JendelaSaya[]): StatusSaya => ({ pemeliharaan: j, pengumuman: [], terhenti: null, sekarang: null });
/** Every .ts and .tsx file under src. */
function berkasSrc(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? berkasSrc(f) : /\.tsx?$/.test(n) ? [f] : []; });
}

export const a2bBatasTests: SelfTest[] = [
  {
    id: "A2B-I01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const tanam = inventaris(db, TANAM_INV);
      c.expect(tanam.salah.some((s) => s.startsWith("_a2b_i01_tanam ")), "the planted writer of a class's work was not reported as unclassed");
      const { fungsi, salah } = inventaris(db);
      c.expect(salah.length === 0, `the writers of a class's work (Sharon's classing):\n  ${salah.join("\n  ")}`);
      const baru = Object.entries(KELAS_PENULIS).filter(([, v]) => v.baru).map(([k]) => k);
      return c.verdict(`${fungsi.length} functions write a class's work or reach a writer from a client; each is classed (${Object.keys(KELAS_PENULIS).length}; ${baru.length} classed here beyond Sharon's table: ${baru.join(", ")}); every refused one asks the place question; no system closure does; the planted unclassed writer is reported`);
    },
  },
  {
    id: "A2B-I02",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const tanam = inventarisJendela(db, TANAM_I02);
      c.expect(tanam.salah.some((s) => s.startsWith("_a2b_i02_tanam ")), "the planted reader of maintenance_windows was not reported as unclassed");
      c.expect(tanam.salah.some((s) => s.startsWith("_a2b_i02_lain.baca ")), "the planted reader in a schema outside public was not reported (I02-1)");
      const { fungsi, salah } = inventarisJendela(db);
      c.expect(salah.length === 0, `the readers and writers of maintenance_windows:\n  ${salah.join("\n  ")}`);
      const n = (k: KelasJendela) => Object.values(KELAS_JENDELA).filter((v) => v.kelas === k).length;
      return c.verdict(`${fungsi.length} functions read or write maintenance_windows, each classed: ${n("WRITER")} writers, ${n("PERSON")} person-level readers, ${n("PLACE")} place readers, ${n("EMERGENCY")} emergency-only readers (each reads only emergency windows or delegates to one that does), ${n("ADMIN")} for the scheduling screen; the planted unclassed readers (in public, and in a schema of its own: I02-1) are reported; every schema but the system's is read`);
    },
  },
  {
    id: "A2B-K01",
    requires: ["db"],
    run: jalan(async (c, db, d) => {
      const r = k1Satu(db, d);
      c.expect(!r.err, `K1 (one connection) failed to run: ${r.err}`);
      const h = r.hasil;
      c.expect(h.now_sebelum === "true", `K1: the transaction's now() must still be before the start (else the case is not made): ${h.now_sebelum}`);
      c.expect(h.sebelum === "OK", `K1: before the start the teacher's act must succeed: ${h.sebelum}`);
      c.expect(h.sesudah === TEMPAT, `K1: a transaction that began before the start and writes after it must be refused ${TEMPAT}: ${h.sesudah}`);
      c.expect(h.mulai_sebelum === "OK", `K1: a start 15 min and more before a window must succeed: ${h.mulai_sebelum}`);
      c.expect(h.mulai_sesudah === "PR110:MAINTENANCE_NO_NEW_START", `K1: a start whose transaction began before T−15 and inserts after it must be refused PR110:MAINTENANCE_NO_NEW_START: ${h.mulai_sesudah}`);
      const k = await k1Kunci(db, d);
      c.expect(k.ok, `K1 (two connections) failed to run: ${k.err}`);
      c.expect(k.mulaiSebelum && k.tulisSesudah && k.tunggu >= 2500, `K1: the case was not made (began before the start ${k.mulaiSebelum}, wrote after it ${k.tulisSesudah}, waited ${k.tunggu} ms)`);
      c.expect(k.hasil === TEMPAT, `K1: a transaction that waited on a lock before the start and reached its write after it must be refused ${TEMPAT}: ${k.hasil}`);
      return `the window's start, read on the clock: the teacher's act before it succeeds; in the same transaction after it, refused ${TEMPAT}; across T−15, a start refused MAINTENANCE_NO_NEW_START; on two connections, a transaction that waited ${k.tunggu} ms on the sitting's row across the start is refused`;
    }),
  },
  {
    id: "A2B-K02",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = k2(db, d);
      c.expect(!r.err, `K2 failed to run: ${r.err}`);
      c.expect(r.hasil.now_sebelum === "true", `K2: the transaction's now() must still be before the end (else the case is not made): ${r.hasil.now_sebelum}`);
      c.expect(r.hasil.sebelum === TEMPAT, `K2: before the end the act must be refused ${TEMPAT}: ${r.hasil.sebelum}`);
      c.expect(r.hasil.sesudah === "OK", `K2: after the end, read on the clock at the moment of writing, the act must succeed: ${r.hasil.sesudah}`);
      return `the window's end, read on the clock: refused before it; after it, in the same transaction (its now() before the end), the act succeeds`;
    }),
  },
  {
    id: "A2B-K03",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = k3k4(db, d);
      c.expect(!r.err, `K3 failed to run: ${r.err}`);
      c.expect(r.hasil.awal === "OK", `K3: a timed start where no window reaches its work must succeed: ${r.hasil.awal}`);
      // the Chief Architect's D4 ruling (16 Nov 05:16), THE PLAN §5.3 D4's text: the deadline D4 reads is "start plus its
      // duration"; PINTAR has no per-assessment duration, so every sitting is untimed and is refused only inside T−15. An
      // assignment's close is not a duration: a start well before a window, closing after it, is allowed
      c.expect(r.hasil.k3_lewat === "OK", `K3: a start 30 min before a planned class window, on work that closes after the window's start (60 min), must succeed (the close is not a duration): ${r.hasil.k3_lewat}`);
      c.expect(r.hasil.k3_cukup === "OK", `K3: a start whose deadline (20 min) falls before the window's start (30 min) must succeed: ${r.hasil.k3_cukup}`);
      c.expect(r.hasil.k3_10 === "PR110:MAINTENANCE_NO_NEW_START", `K3: inside T−15 a timed start is still refused by T−15 (it stays): ${r.hasil.k3_10}`);
      c.expect(r.hasil.layar_lewat === "true:OK", `K3: may_start_assessment must give the trigger's answer for that start, on an assignment closing after the window (the screen offers it): ${r.hasil.layar_lewat}`);
      c.expect(r.hasil.layar_cukup === "true:OK", `K3: may_start_assessment must give the trigger's answer for the start that finishes in time: ${r.hasil.layar_cukup}`);
      return `D4 as THE PLAN §5.3 words it (the Chief Architect's ruling, 16 Nov): an assignment's close is not a duration, so a start 30 min before a planned class window succeeds whether its work closes after the window or before it; inside T−15 a start is refused MAINTENANCE_NO_NEW_START; may_start_assessment gives the trigger's answer for both`;
    }),
  },
  {
    id: "A2B-K04",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = k3k4(db, d);
      c.expect(!r.err, `K4 failed to run: ${r.err}`);
      c.expect(r.hasil.k4_20 === "OK", `K4: an untimed start 30 min before a planned class window must succeed (T−15 only): ${r.hasil.k4_20}`);
      c.expect(r.hasil.k4_10 === "PR110:MAINTENANCE_NO_NEW_START", `K4: an untimed start 10 min before a planned class window must be refused by T−15, as today: ${r.hasil.k4_10}`);
      return `D4, an untimed start: T−15 only, as today (allowed 30 min before the window, refused 10 min before)`;
    }),
  },
  {
    id: "A2B-K05",
    requires: ["db"],
    run: jalan(async (c, db, d) => {
      const r = k5(db, d);
      c.expect(!r.err, `K5 failed to run: ${r.err}`);
      c.expect(r.hasil.lain === "0", `K5: the learner must have no other open sitting in the fixture (maintenance_draining is person-wide): ${r.hasil.lain}`);
      c.expect(r.hasil.saat === "2700:3:2", `K5 (K12-1's shape): the stop's T_lift − T_stop is 2700 s, its starts_at 3 s before T_stop and its ended_at 2 s before T_lift: ${r.hasil.saat}`);
      c.expect(r.hasil.efektif === "900", `K5: the effective deadline (own deadline 30 min ago, T_lift − T_stop = 45 min credited) must be exactly 900 s ahead: ${r.hasil.efektif} s`);
      c.expect(r.hasil.blok === "none", `K5: a work-scoped window must stop the learner with a running sitting as no person (no person-level drain): ${r.hasil.blok}`);
      c.expect(r.hasil.kuras === "true", `K5: maintenance_draining must still say the learner's sitting is running (it continues): ${r.hasil.kuras}`);
      c.expect(r.hasil.jawab === "OK", `K5: the learner's answer in a running sitting, during a planned window on its class, must be taken (the drain): ${r.hasil.jawab}`);
      c.expect(r.hasil.status_awal === "IN_PROGRESS", `K5: before its effective deadline the decider must leave it open: ${r.hasil.putus_awal} → ${r.hasil.status_awal}`);
      c.expect(r.hasil.putus_akhir === "OK" && r.hasil.status_akhir !== "IN_PROGRESS", `K5: past its deadline and grace the decider (A1's closer) must end it during the window: ${r.hasil.putus_akhir} → ${r.hasil.status_akhir}`);
      // Sharon's K12-1 plant: the shift read from the row's starts_at and ended_at instead of T_stop and T_lift
      const { gantiFungsi } = await import("./balapan");
      const balik = gantiFungsi("public.penghentian_geser(uuid,uuid)", GESER_SAAT, GESER_BARIS);
      let tanam: ReturnType<typeof k5>;
      try { tanam = k5(db, d); } finally { balik(); }
      c.expect(tanam.hasil.efektif !== "900", `with the plant (the shift read from starts_at and ended_at) the effective deadline was still 900 s: ${JSON.stringify(tanam.hasil)}`);
      return `a running sitting when a planned class window starts drains: the answer is taken; open to its effective deadline (exactly ${r.hasil.efektif} s ahead: T_lift − T_stop credited, the window in the hosted shape); the closer ends it after its grace (${r.hasil.status_akhir}); with the plant (the shift from starts_at and ended_at) ${tanam.hasil.efektif} s`;
    }),
  },
  {
    id: "A2B-D12",
    requires: ["db"],
    run: jalan(async (c, db, d) => {
      const r = d12(db, d);
      c.expect(!r.err, `D1-2 failed to run: ${r.err}`);
      const h = r.hasil;
      c.expect(h.lain === "0", `D1-2: the learner must have no other open sitting in the fixture (a person-wide reader would answer for it): ${h.lain}`);
      for (const k of ["efektif", "keadaan", "saya", "daftar"] as const)
        c.expect(h[k] === "900", `D1-2: ${k}: a marked sitting of a lifted stop must read its deadline shifted by the stop (exactly 900 s ahead) before any touch: ${h[k]}`);
      c.expect(h.lanjut === "true:OK", `D1-2: may_continue_session must let the learner continue: ${h.lanjut}`);
      c.expect(h.kuras === "true", `D1-2: maintenance_draining must say the sitting runs: ${h.kuras}`);
      c.expect(h.rilis === "true" && h.sesudah === "900:true", `D1-2: the release must then change nothing a reader shows (released, still 900 s): ${h.rilis}, ${h.sesudah}`);
      const { gantiFungsi } = await import("./balapan");
      const balik = gantiFungsi("public.pengerjaan_tenggat_efektif(uuid)", D12_SAAT, D12_TANAM);
      let tanam: ReturnType<typeof d12>;
      try { tanam = d12(db, d); } finally { balik(); }
      c.expect(tanam.hasil.efektif !== "900" && tanam.hasil.kuras !== "true", `with the plant (the marked case removed) the readers still showed the shift: ${JSON.stringify(tanam.hasil)}`);
      return `a marked sitting of a lifted stop, before any release or touch: the effective deadline, session_state, pengerjaan_saya and daftar_pengerjaan all read it 900 s ahead (the stop's 45 min on a deadline 30 min past), may_continue_session lets it go on and maintenance_draining says it runs; the release then changes nothing (still 900 s); with the plant (the marked case removed) ${tanam.hasil.efektif} s and draining ${tanam.hasil.kuras}`;
    }),
  },
  {
    id: "A2B-S01",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = s01(db, d);
      c.expect(!r.err, `the status read failed to run: ${r.err}`);
      const guru = JSON.parse(r.hasil.guru ?? "{}"), murid2 = JSON.parse(r.hasil.murid2 ?? "{}");
      const g1 = guru[W1], g3 = guru[W3], g2 = guru[W2];
      c.expect(g1?.c === "TEMPAT" && g1?.z === "Asia/Makassar" && JSON.stringify(g1?.k) === JSON.stringify([r.hasil.namaA]) && Boolean(g1?.s),
        `a PLANNED class window, to the teacher of its class: work-scoped (TEMPAT), the school's zone (WITA), the class and the school named: ${JSON.stringify(g1)}`);
      c.expect(g3?.c === "ORANG" && g3?.z === "Asia/Makassar" && !g3?.s, `a platform-wide PLANNED window: person-level (ORANG), in the reader's own school's zone: ${JSON.stringify(g3)}`);
      c.expect(g2?.c === "ORANG", `an EMERGENCY class stop is person-level (ORANG): ${JSON.stringify(g2)}`);
      c.expect(!murid2[W1] && murid2[W2]?.c === "ORANG" && murid2[W3]?.c === "ORANG", `7B's learner: not told of 7A's planned window; told of 7B's stop and the platform window: ${JSON.stringify(murid2)}`);
      return `the status read says who a window stops: a class or school PLANNED window is TEMPAT, named by its class and school and shown in its school's zone (WITA here), and reaches only the people with work in its place; a platform-wide PLANNED window and an emergency are ORANG, the platform's in the reader's own school's zone`;
    }),
  },
  {
    id: "A2B-D13",
    requires: ["db"],
    run: jalan(async (c, db, d) => {
      const r = d12(db, d);
      c.expect(!r.err, `D1-3 failed to run: ${r.err}`);
      c.expect(r.hasil.ditahan === "false:true", `D1-3: pengerjaan_saya must say the sitting is not held and released from the stop, before any touch: ${r.hasil.ditahan}`);
      c.expect(r.hasil.terbuka === "1", `D1-3: pengerjaan_terbuka_saya must offer the learner the sitting: ${r.hasil.terbuka}`);
      const sisa = pembacaDitahan(db);
      c.expect(sisa.length === 0, `D1-3's sweep: a read-only function still counts a stale mark as held (calls pengerjaan_ditahan): ${sisa.join(", ")}`);
      const { gantiFungsi } = await import("./balapan");
      const balik = gantiFungsi("public.pengerjaan_saya(uuid)", D13_SAAT, D13_TANAM);
      let tanam: ReturnType<typeof d12>;
      try { tanam = d12(db, d); } finally { balik(); }
      c.expect(!(tanam.hasil.ditahan ?? "").startsWith("false"), `with the plant (pengerjaan_saya reading the mark) the sitting still read as not held: ${tanam.hasil.ditahan}`);
      return `a marked sitting of a lifted stop, before any touch: pengerjaan_saya says not held and released from the stop, and pengerjaan_terbuka_saya offers it; no read-only function calls pengerjaan_ditahan any more (the decider's writers keep it, after pengerjaan_pagar); with the plant pengerjaan_saya said held (${tanam.hasil.ditahan})`;
    }),
  },
  {
    id: "A2B-B01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const T = Date.parse("2026-11-20T03:00:00Z"), m = 60_000;
      // the boundaries: at most one read per boundary, at most four per window, only while it is announced
      c.expect(JSON.stringify(batasTahap(new Date(T + 50 * m).toISOString(), T)) === JSON.stringify([20 * m, 35 * m, 50 * m]),
        `a window 50 min away: reads at T−30, T−15 and T=0 only: ${JSON.stringify(batasTahap(new Date(T + 50 * m).toISOString(), T))}`);
      // a window is listed from T−60, so its T−60 stage is the page's own first read: three boundaries remain, within the cap
      c.expect(batasTahap(new Date(T + 60 * m).toISOString(), T).length === 3 && BACA_ULANG_MAKS === 4,
        `a window exactly 60 min away: three reads ahead, within the cap of four: ${batasTahap(new Date(T + 60 * m).toISOString(), T).length}`);
      c.expect(batasTahap(new Date(T + 61 * m).toISOString(), T).length === 0, "a window more than an hour away is not announced: no read");
      c.expect(batasTahap(new Date(T - m).toISOString(), T).length === 0, "a window already begun: no read");
      c.expect(!jendelaDiumumkan(null, T) && !jendelaDiumumkan(jendelaUji(T + 10 * m, { keadaan: "AKTIF" }), T)
        && !jendelaDiumumkan(jendelaUji(T + 10 * m, { jenis: "EMERGENCY" }), T) && jendelaDiumumkan(jendelaUji(T + 10 * m), T),
        "only a planned window announced and not begun is re-read");
      // a failed read shows nothing new; an extension or an early end shows at the next stage
      c.expect(tahapSetelahBaca(30, null, T) === 30, "a failed read must keep the stage on screen");
      c.expect(tahapSetelahBaca(30, statusUji([]), T) === null, "after an early end or a cancellation, no further stage");
      c.expect(tahapSetelahBaca(30, statusUji([jendelaUji(T + 40 * m)]), T) === 60, "after an extension, the stage the new start gives");
      // the source: the one read is called only at a boundary's timeout, never on an interval, by the banner alone
      const src = readFileSync(join(repoRoot, "src/components/pemeliharaan/PengingatPemeliharaan.tsx"), "utf8");
      const panggil = [...src.matchAll(/bacaUlangStatusSaya\(/g)].length;
      c.expect(panggil === 1, `the banner must read again in exactly one place: ${panggil}`);
      const selaInterval = /setInterval\(([\s\S]*?)\);/.exec(src)?.[1] ?? "";
      c.expect(!/bacaUlang|rpc|fetch|statusSaya/.test(selaInterval), `the banner's interval (the minutes on screen) must read nothing: ${selaInterval.slice(0, 80)}`);
      c.expect(/setTimeout\(async \(\) => \{\s*bacaan\.current \+= 1;\s*(\/\/[^\n]*\n\s*)*const baru = await bacaUlangStatusSaya\(\)\.catch\(\(\) => null\);/.test(src),
        "the read must be the boundary timeout's first act, counted, and a read the browser cannot complete (no connection: the call throws) must count as a failed read (commit 10)");
      c.expect(/bacaan\.current < BACA_ULANG_MAKS/.test(src) && /jendelaDiumumkan\(jendela, jam\(\)\)/.test(src),
        "the boundary must be armed only while a window is announced and under the cap");
      c.expect(/const detik = gagal \? undefined : window\.setInterval/.test(src) && /setGagal\(!baru\)/.test(src) && /\{gagal \? <><strong>\{\(jendela\.kelas \? s\("pemeliharaan\.basi\.kelas"\)/.test(src),
        "after a failed re-read the minutes must stop and the last-known start alone be shown (the owner's ruling, PLAN c82444b8)");
      const lain = berkasSrc(join(repoRoot, "src")).filter((f) => !/PengingatPemeliharaan\.tsx$|pemeliharaan[\/]actions\.ts$/.test(f)
        && readFileSync(f, "utf8").includes("bacaUlangStatusSaya"));
      c.expect(lain.length === 0, `no other file may call the banner's re-read: ${lain.join(", ")}`);
      return c.verdict(`the banner's re-read (R-B): reads source and runs the pure planner: at most one read per stage boundary still ahead and at most ${BACA_ULANG_MAKS} per window, only for a planned window announced and not begun; a failed read keeps the stage on screen, an early end shows nothing further, an extension the new stage; in the source the one read is the boundary timeout's first act, counted against the cap, the interval reads nothing, and no other file calls it`);
    },
  },
  {
    id: "A2B-H01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // 22.30 WIB = 23.30 WITA on 16 Nov; an end an hour later is 23.30 WIB the same day, but 00.30 WITA on 17 Nov
      const kini = Date.parse("2026-11-16T15:30:00Z"), akhir = "2026-11-16T16:30:00Z";
      const wib = { zona: "Asia/Jakarta" }, wita = { zona: "Asia/Makassar" };
      c.expect(hariLain(akhir, wib, kini) === "", `the same day in the window's zone (WIB) adds nothing: «${hariLain(akhir, wib, kini)}»`);
      const id = hariLain(akhir, wita, kini), en = hariLain(akhir, wita, kini, "en");
      // Daisy's C-3 form (TINJAUAN-A2B-D8-B1): «, {hari} {tanggal}», no year and no comma between them
      c.expect(id === ", Selasa 17\u00a0Nov", `another day in the window's zone (WITA) adds «, Selasa 17 Nov», the day and month joined by a non-breaking space (Daisy, 16 Nov): ${JSON.stringify(id)}`);
      c.expect(en === " on Tuesday 17\u00a0Nov", `in English « on Tuesday 17 Nov», likewise: ${JSON.stringify(en)}`);
      const jz = jamJendela("2026-11-16T09:14:00Z", wita);
      c.expect(jz === "17.14\u00a0WITA", `a time and its zone word are joined by a non-breaking space (Daisy, 16 Nov): ${JSON.stringify(jz)}`);
      c.expect(hariLain("2026-11-16T15:45:00Z", wita, kini) === "", "a time later the same day adds nothing");
      const pita = readFileSync(join(repoRoot, "src/components/pemeliharaan/PengingatPemeliharaan.tsx"), "utf8");
      c.expect(/\.replace\("\{jam\}", jamPenuh\(jendela\.mulai, jendela, kini, locale\)\)/.test(pita),
        "the last-check line must date the window's start when it falls on another day");
      return c.verdict(`a maintenance time on another day carries its date, read in the window's zone (an hour after 22.30 WIB is the same day in WIB and the next in WITA: «${id}»); the banner's last-check line dates the window's start with it (D4's sentence, which also used it, is removed by the Chief Architect's D4 ruling)`);
    },
  },
  {
    id: "A2B-P01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = readFileSync(join(repoRoot, "src/app/pemeliharaan/page.tsx"), "utf8");
      const tempat = src.indexOf('w.keadaan === "AKTIF" && w.cakupan === "TEMPAT"');
      const umum = src.indexOf('} else if (w && w.jenis === "PLANNED" && w.keadaan === "AKTIF") {');
      c.expect(tempat > 0 && umum > tempat, "a work-scoped window under way must have its own branch, judged before the generic one");
      const cabang = tempat > 0 && umum > tempat ? src.slice(tempat, umum) : "";
      c.expect(/pemeliharaan\.tempat\.berlangsung/.test(cabang) && /pemeliharaan\.tempat\.arti/.test(cabang),
        "the work-scoped branch must name the place and say the rest of PINTAR stays usable");
      c.expect(!/pemeliharaan\.pita\.berjalan|pemeliharaan\.judul"|pemeliharaan\.langkah/.test(cabang),
        "the work-scoped branch must not say PINTAR cannot be used");
      c.expect(/mulai === "ditolak" && w && w\.jenis === "PLANNED" && w\.keadaan !== "AKTIF" && w\.cakupan === "ORANG"/.test(src),
        "the T−15 refusal copy must be limited to a platform-wide window (R-A)");
      return c.verdict("the maintenance page: a class or school window under way has its own branch, before the generic one, naming the place and saying the rest of PINTAR stays usable, never that PINTAR cannot be used; the T−15 refusal copy is a platform window's only");
    },
  },
  {
    id: "A2B-D4X",
    requires: ["db"],
    run: jalan((c, db) => {
      // the Chief Architect's D4 ruling (16 Nov 05:16): with no per-assessment duration, D4's calculation is gone from the
      // database and the app, not hidden. The detector is one query; the plant creates a function carrying the code in a
      // rolled-back transaction and the same query must find it
      const cari = `select count(*) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosrc like '%MAINTENANCE_CANNOT_FINISH%'`;
      const r = barisKunci(db, `begin;
select 'fungsi|' || (${cari});
select 'argumen|' || coalesce((select string_agg(p.pronargs::text, ',') from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'maintenance_mulai_tolak'), 'tidak ada');
create function public.a2b_d4x_tanam() returns text language sql as $t$ select 'MAINTENANCE_CANNOT_FINISH' $t$;
select 'tanam|' || (${cari});
rollback;`);
      c.expect(!r.err, `D4X failed to run: ${r.err}`);
      c.expect(r.hasil.tanam !== undefined && Number(r.hasil.tanam) > Number(r.hasil.fungsi ?? 0), `the plant (a function carrying the code) must be found by the detector: ${r.hasil.tanam}`);
      c.expect(r.hasil.fungsi === "0", `no database function may carry MAINTENANCE_CANNOT_FINISH: ${r.hasil.fungsi}`);
      c.expect(r.hasil.argumen === "2", `the start rule must take no deadline (person, node only): ${r.hasil.argumen} argument(s)`);
      const sisa = berkasSrc(join(process.cwd(), "src")).filter((f) => /CANNOT_FINISH|pemeliharaan\.d4\./.test(readFileSync(f, "utf8")));
      c.expect(sisa.length === 0, `no app file may carry D4's code or sentences: ${sisa.join(", ")}`);
      const muka = readFileSync(join(process.cwd(), "src/app/belajar/_components/PermukaanAsesmen.tsx"), "utf8");
      c.expect(!/menitTersisa\(orientasi\.closes_at\)|\{d\}/.test(muka), "the start screen must compute no {d} from the assignment's close");
      return `D4's calculation is gone, not hidden: no database function carries MAINTENANCE_CANNOT_FINISH (the planted one is found), the start rule takes person and node only, and no app file carries the code, the pemeliharaan.d4.* sentences or a {d} from the close`;
    }),
  },
  {
    id: "A2B-C01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // Daisy's review of D8 batch 1 (TINJAUAN-A2B-D8-B1-679987cb), C-1 to C-3
      const pita = readFileSync(join(repoRoot, "src/components/pemeliharaan/PengingatPemeliharaan.tsx"), "utf8");
      const jeda = readFileSync(join(repoRoot, "src/app/pemeliharaan/page.tsx"), "utf8");
      // C-1: the work's owner is named, never «-nya»
      for (const k of ["pemeliharaan.tempat.arti", "pemeliharaan.tempat.biasa"] as const) {
        const id = t(k, "learner", { locale: "id" }), en = t(k, "learner", { locale: "en" });
        c.expect(id.includes("pekerjaan {untuk}") || id.includes("Pekerjaan {untuk}"), `${k} must name the work's owner: «${id}»`);
        c.expect(!/pekerjaannya/i.test(id) && !/\bits work\b/i.test(en), `${k} must not say «pekerjaannya» or «its work»: «${id}» / «${en}»`);
        // Daisy (16 Nov): the EN has one form, «{untuk}'s work»
        c.expect(en.includes("{untuk}'s work") && !/work of \{untuk\}/.test(en), `${k}'s EN must use the one form «{untuk}'s work»: «${en}»`);
      }
      const tanpaGanti = [...`${pita}\n${jeda}`.matchAll(/s\("pemeliharaan\.tempat\.(arti|biasa)"\)(?!\.replace\("\{untuk\}", untuk\))/g)].length;
      // a sentence that opens with its place starts with a capital («Class 5S's work …»): every use of .arti
      const artiTanpaKapital = [...`${pita}\n${jeda}`.matchAll(/(.{0,12})s\("pemeliharaan\.tempat\.arti"\)/g)].filter((m) => !m[1].endsWith("kapitalAwal(")).length;
      c.expect(artiTanpaKapital === 0 && kapitalAwal("class 5S's work") === "Class 5S's work", `every use of pemeliharaan.tempat.arti must capitalise its opening: ${artiTanpaKapital} do not`);
      c.expect(tanpaGanti === 0, `every use of pemeliharaan.tempat.arti and .biasa must fill {untuk}: ${tanpaGanti} do not`);
      // C-2: while the last-check line shows, the stage's own start sentence is dropped
      c.expect(/\{gagal \? null : <>\{tempat \? s\("pemeliharaan\.tempat\.pukul"\)/.test(pita), "while the last-check line shows, the stage's start sentence must be dropped");
      // C-3: every shown window time carries its day when it is another: one helper, on the banner and the page
      const bare = [...pita.matchAll(/jamJendela\(([^)]*)\)/g)].map((m) => m[1]).filter((a) => !/^bacaTerakhir,/.test(a));
      c.expect(bare.length === 0, `the banner must show every window time through jamPenuh (only the read's own time, {jam_baca}, is today's): ${bare.join(" | ")}`);
      c.expect(/const jam = \(iso: string\) => jamPenuh\(iso, w \?\? \{ zona: null \}, kini, locale\);/.test(jeda) && !/jamJendela\(/.test(jeda),
        "the pause page must show every time through jamPenuh, today read on the database's clock");
      return c.verdict("Daisy's batch 1 corrections: C-1, pemeliharaan.tempat.arti and .biasa name the work's owner ({untuk}, filled at every use) and never say «pekerjaannya»; C-2, the stage's start sentence is dropped while the last-check line shows; C-3, every window time on the banner and the pause page goes through jamPenuh, which dates another day");
    },
  },
  {
    id: "A2B-D14",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const lain = d14(db, d, "lain"), sini = d14(db, d, "sini");
      c.expect(!lain.err && !sini.err, `D14 failed to run: ${lain.err} ${sini.err}`);
      c.expect(lain.hasil.berjalan === "false", `a class window at school X must not read "your sitting continues" through the learner's open sitting at school Y (draining is per window): berjalan ${lain.hasil.berjalan}`);
      c.expect(sini.hasil.berjalan === "true", `a class window must read "your sitting continues" through the learner's open sitting in its own class: berjalan ${sini.hasil.berjalan}`);
      c.expect(lain.hasil.blok === "none" && sini.hasil.blok === "none", `a work-scoped window stops no one as a person (R-1), in both cases: ${lain.hasil.blok}, ${sini.hasil.blok}`);
      return "draining is per window (the Chief Architect, 16 Nov): a two-school learner's open sitting at school Y does not make school X's class window read 'berjalan'; their open sitting in the window's own class does; neither stops them as a person";
    }),
  },
  {
    id: "A2B-D15",
    requires: ["db"],
    run: jalan((c, db) => {
      // the pin: the person-wide reading has one caller, the person-level stop, which reads it only after skipping
      // class and school windows; any other caller would read it for a window it does not suit
      const pemanggil = psqlBaris(db, `select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace
        and p.proname <> 'maintenance_draining' and regexp_replace(p.prosrc, '--[^' || chr(10) || ']*', '', 'g') ~ 'maintenance_draining[[:space:]]*[(]' order by 1`).map(([f]) => f);
      c.expect(JSON.stringify(pemanggil) === JSON.stringify(["maintenance_block_for_me"]), `maintenance_draining(person) must have exactly one caller, maintenance_block_for_me: ${pemanggil.join(", ")}`);
      const blok = psqlBaris(db, `select pg_get_functiondef('public.maintenance_block_for_me()'::regprocedure)`).map(([x]) => x).join("\n");
      const lewati = blok.indexOf("continue when w.kind = 'PLANNED' and not w.platform"), baca = blok.indexOf("maintenance_draining(");
      c.expect(lewati > 0 && baca > lewati, "maintenance_block_for_me must skip class and school windows before it reads the person-wide drain");
      // Sharon's conditions (16 Nov 08:14, 08:21): one place predicate, called by every place reader, with no raw copy left
      const salinan = psqlBaris(db, `select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname <> 'maintenance_jendela_atas'
        and regexp_replace(p.prosrc, '--[^' || chr(10) || ']*', '', 'g') ~ 'node_ids[[:space:]]*&&[[:space:]]*n[.]jalur' order by 1`).map(([f]) => f);
      c.expect(salinan.length === 0, `no function may carry a copy of the place predicate (node_ids && n.jalur): ${salinan.join(", ")}`);
      const pakai = psqlBaris(db, `select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace
        and p.prosrc ~ 'maintenance_jendela_atas[[:space:]]*[(]' and p.proname <> 'maintenance_jendela_atas' order by 1`).map(([f]) => f);
      c.expect(JSON.stringify(pakai) === JSON.stringify(["maintenance_affects_place", "maintenance_draining_di", "maintenance_mulai_tolak"]),
        `the place readers must all call maintenance_jendela_atas: ${pakai.join(", ")}`);
      // grants equal to maintenance_draining's, for the reader and the helper; read only
      // who may execute it, role by role, and whether PUBLIC holds it (its ACL's '=X' entry)
      const hak = (f: string) => psqlBaris(db, `select string_agg(r || '=' || has_function_privilege(r, '${f}'::regprocedure, 'execute')::text, ',' order by r)
        || ',public=' || coalesce((select bool_or(a::text like '=X%') from pg_proc p, unnest(p.proacl) a where p.oid = '${f}'::regprocedure), true)::text
        from unnest(array['anon', 'authenticated', 'service_role']) r`)[0]?.[0] ?? "";
      const dasar = hak("public.maintenance_draining(uuid)");
      for (const f of ["public.maintenance_draining_di(uuid,public.maintenance_windows)", "public.maintenance_jendela_atas(public.maintenance_windows,public.org_nodes)"])
        c.expect(hak(f) === dasar, `${f} must have maintenance_draining's grants (${dasar}): ${hak(f)}`);
      const bacaSaja = psqlBaris(db, `select p.provolatile::text || ':' || (regexp_replace(p.prosrc, '--[^' || chr(10) || ']*', '', 'g') ~* 'for[[:space:]]+(share|update|no key update|key share)')::text
        from pg_proc p where p.oid = 'public.maintenance_draining_di(uuid,public.maintenance_windows)'::regprocedure`)[0]?.[0];
      c.expect(bacaSaja === "s:false", `maintenance_draining_di must be STABLE and take no row lock: ${bacaSaja}`);
      return "the person-wide drain, maintenance_draining(person), has one caller, maintenance_block_for_me, which reads it only after skipping class and school windows (pin: a later caller cannot reuse the person-level reading); the place predicate exists once, maintenance_jendela_atas, called by maintenance_affects_place, maintenance_mulai_tolak and maintenance_draining_di, with no copy left; the reader and the helper carry maintenance_draining's grants; the reader is STABLE and takes no row lock";
    }),
  },
  {
    id: "A2B-D16",
    requires: ["db"],
    run: jalan((c, db, d) => {
      // Sharon's (a): NULL classes and an empty class array behave exactly as the old expression did, and the rest
      const lama = "n.institution_id = any (w.institution_ids) and (cardinality(w.node_ids) = 0 or w.node_ids && n.jalur)";
      const kasus: [string, string, string][] = [
        ["kelas", `array['${d.kA}']::uuid[]`, `'${d.kA}'`], ["kelas lain", `array['${d.kA}']::uuid[]`, `'${d.kY}'`],
        ["sekolah", "'{}'::uuid[]", `'${d.kA}'`], ["sekolah lain", "'{}'::uuid[]", `'${d.kY}'`],
        ["kelas null", "null::uuid[]", `'${d.kA}'`], ["simpul null", `array['${d.kA}']::uuid[]`, "null::uuid"],
        ["sekolah, simpul null", "'{}'::uuid[]", "null::uuid"]];
      const hasil = kasus.map(([nama, kelas, simpul]) => {
        const [x] = psqlBaris(db, `with w as (select (jsonb_populate_record(null::public.maintenance_windows,
            jsonb_build_object('institution_ids', jsonb_build_array('${d.X}'), 'platform', false))) as w),
          w2 as (select (jsonb_populate_record(w, jsonb_build_object('node_ids', to_jsonb(${kelas})))) as w from w),
          n as (select (select x from public.org_nodes x where x.id = ${simpul}) as n)
          select coalesce(public.maintenance_jendela_atas(w2.w, n.n)::text, 'null') || ':' ||
                 coalesce((select ${lama.replaceAll("w.", "(w2.w).").replaceAll("n.", "(n.n).")})::text, 'null')
            from w2, n`);
        return [nama, x?.[0] ?? "?"] as const;
      });
      for (const [nama, x] of hasil) {
        const [baru, dulu] = x.split(":");
        c.expect(baru === dulu, `${nama}: the helper must answer as the old predicate did: helper ${baru}, old ${dulu}`);
      }
      const peta = Object.fromEntries(hasil);
      c.expect(peta["kelas"] === "true:true" && peta["kelas lain"] === "false:false" && peta["sekolah"] === "true:true" && peta["sekolah lain"] === "false:false",
        `the ordinary cases: ${JSON.stringify(peta)}`);
      c.expect(peta["kelas null"] === "null:null" && peta["simpul null"] === "null:null", `NULL classes and a NULL node read as NULL, never as covered: ${JSON.stringify(peta)}`);
      return `the one place predicate answers as each old copy did on every edge: ${hasil.map(([n, x]) => `${n} ${x.split(":")[0]}`).join("; ")}`;
    }),
  },
  {
    id: "A2B-R01",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = r01(db, d); const h = r.hasil;
      c.expect(!r.err, `R01 failed to run: ${r.err}`);
      for (const k of KODE_ALASAN) c.expect(h[`baris_${k}`] === "OK", `a PLANNED row with the approved code ${k} must be accepted: ${h[`baris_${k}`]}`);
      c.expect(h.baris_asing?.startsWith("23514"), `a code outside the approved list must be refused by the CHECK: ${h.baris_asing}`);
      c.expect(h.baris_darurat_kode?.startsWith("23514"), `an EMERGENCY row must carry no code (the Chief Architect, 16 Nov: A2a's emergency reasons stay free text): ${h.baris_darurat_kode}`);
      c.expect(h.baris_lainnya_panjang?.startsWith("23514"), `LAINNYA's text must be at most 120 characters: ${h.baris_lainnya_panjang}`);
      c.expect(h.baris_lama === "OK" && h.baris_darurat_lama === "OK", `rows with no code (existing rows, and every emergency) stay valid: ${h.baris_lama}, ${h.baris_darurat_lama}`);
      c.expect(h.jadwal_rutin === "OK", `schedule_maintenance must accept an approved code with no free text: ${h.jadwal_rutin}`);
      c.expect(h.jadwal_asing === "PR110:MAINTENANCE_INPUT_INVALID" && h.jadwal_lainnya_kosong === "PR110:MAINTENANCE_INPUT_INVALID",
        `schedule_maintenance must refuse a code outside the list and LAINNYA without text, with MAINTENANCE_INPUT_INVALID: ${h.jadwal_asing}, ${h.jadwal_lainnya_kosong}`);
      c.expect(h.jadwal_lainnya === "OK" && h.jadwal_tanpa_kode === "OK", `LAINNYA with its text, and the old free-text call (no code; 4.0's and A2a's callers), are accepted: ${h.jadwal_lainnya}, ${h.jadwal_tanpa_kode}`);
      c.expect(h.darurat_tanda === "p_platform boolean, p_institutions uuid[], p_reason text, p_confirmation text, p_nodes uuid[]",
        `stop_pintar_now's signature must be unchanged (A2a's evidence is not reopened): ${h.darurat_tanda}`);
      return (`D2 in the database: the five planned codes accepted, a foreign code refused, an EMERGENCY row with a code refused, LAINNYA's text at most 120; rows with no code stay valid; schedule_maintenance takes p_reason_code (refusing a foreign code and LAINNYA without text, accepting the old call with none); stop_pintar_now unchanged`);
    }),
  },
  {
    id: "A2B-R02",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = r02(db, d);
      c.expect(!r.err, `R02 failed to run: ${r.err}`);
      c.expect(r.hasil.w1 === "PEMBARUAN:PEMBARUAN", `the status read must give a coded window's code to the affected: ${r.hasil.w1}`);
      c.expect(r.hasil.w3 === "-:Teks bebas lama", `an old row with no code gives its own text: ${r.hasil.w3}`);
      return ("the status read gives the affected a PLANNED window's reason: its code, or an old row's text");
    }),
  },
  {
    id: "A2B-A06",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = a67(db, d); const h = r.hasil;
      c.expect(!r.err, `A6/A7 failed to run: ${r.err}`);
      c.expect(h.perpanjang === "OK" && h.a6_audit === "true", `A6: the extension's audit row must hold before, after, reason and actor: ${h.perpanjang}, ${h.a6_audit}`);
      c.expect(h.a6_pengumuman === "true", `A6: the window's notice must move with the new end: ${h.a6_pengumuman}`);
      c.expect(h.a6_tempat === "true", `A6: the place guard must follow the new end at once (refused past the old end): ${h.a6_tempat}`);
      return ("A6, extend end to end: the audit row holds before, after, reason and actor; the notice's end moves with it; the place guard follows the new end at once");
    }),
  },
  {
    id: "A2B-A07",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = a67(db, d); const h = r.hasil;
      c.expect(!r.err, `A6/A7 failed to run: ${r.err}`);
      c.expect(h.akhiri === "OK" && h.a7_audit === "true", `A7: the early end's audit row must hold the planned end (before), the moment it ended (after, its own time), reason and actor: ${h.akhiri}, ${h.a7_audit}`);
      c.expect(h.a7_tempat === "false", `A7: work must resume at once after the early end: ${h.a7_tempat}`);
      return ("A7, resume early end to end: the audit row holds the planned end, the moment it ended, the reason and the actor; the class's work resumes at once");
    }),
  },
  {
    id: "A2B-R03",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // D2 in the app (Daisy, A2-KATA-DESAIN B1): the words, the planned form, the action, and the reason shown to the affected
      const kata: Record<string, string> = {
        "config.pemeliharaan.alasan.legenda": "Alasan",
        "config.pemeliharaan.alasan.petunjuk": "Alasan yang dipilih ditampilkan kepada orang yang terdampak.",
        "pemeliharaan.alasan.RUTIN": "Pemeliharaan rutin", "pemeliharaan.alasan.PEMBARUAN": "Pembaruan sistem",
        "pemeliharaan.alasan.GANGGUAN": "Perbaikan gangguan", "pemeliharaan.alasan.JARINGAN_LISTRIK": "Pemeliharaan jaringan atau listrik",
        "pemeliharaan.alasan.LAINNYA": "Lainnya", "config.pemeliharaan.alasan.jelaskan": "Jelaskan singkat",
        "galat.maintenance_reason_invalid": "Pilih alasannya. Bila memilih «Lainnya», jelaskan singkat, sampai 120 karakter.",
        "pemeliharaan.alasan.baris": "Alasan: {alasan}",
      };
      const kunci = new Set<string>(allKeys());
      for (const [k, v] of Object.entries(kata)) {
        c.expect(kunci.has(k) && t(k as HleEvent, "staff", { locale: "id" }) === v, `${k} must say «${v}»: ${kunci.has(k) ? t(k as HleEvent, "staff", { locale: "id" }) : "missing"}`);
      }
      const halaman = readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8");
      const aksi = readFileSync(join(repoRoot, "src/app/konfigurasi/actions.ts"), "utf8");
      for (const k of KODE_ALASAN) c.expect(halaman.includes(`value="${k}"`) || /KODE_ALASAN\.map/.test(halaman), `the planned form must offer the reason ${k}`);
      c.expect(/name="alasan_kode"/.test(halaman) && /type="radio"/.test(halaman) && /<fieldset/.test(halaman), "the planned form's reason must be a required radio group in a fieldset (alasan_kode)");
      c.expect(/name="alasan"[^>]*maxLength=\{120\}/.test(halaman), "«Lainnya»'s text field must take at most 120 characters");
      const jadwal = /export async function jadwalkanPemeliharaanAction[\s\S]*?\n}\n/.exec(aksi)?.[0] ?? "";
      c.expect(/MAINTENANCE_REASON_INVALID/.test(jadwal) && jadwal.indexOf("MAINTENANCE_REASON_INVALID") < jadwal.indexOf('rpc("schedule_maintenance"'),
        "the scheduling action must refuse no reason, or «Lainnya» without text, before it calls the database");
      c.expect(/p_reason_code:/.test(jadwal), "the scheduling action must pass p_reason_code");
      const pita = readFileSync(join(repoRoot, "src/components/pemeliharaan/PengingatPemeliharaan.tsx"), "utf8");
      const jeda = readFileSync(join(repoRoot, "src/app/pemeliharaan/page.tsx"), "utf8");
      c.expect(/pemeliharaan\.alasan\.baris/.test(pita) && /pemeliharaan\.alasan\.baris/.test(jeda), "the banner and the pause page must show «Alasan: {alasan}»");
      const kontrak = await import("../src/lib/pemeliharaan-kontrak") as Record<string, unknown>;
      const baca = kontrak.bacaStatusSaya as (d: unknown) => { pemeliharaan: Array<Record<string, unknown>> };
      const j = baca({ pemeliharaan: [{ id: "w", jenis: "PLANNED", keadaan: "AKTIF", mulai: "2026-11-16T03:00:00Z", alasan_kode: "RUTIN", alasan: "RUTIN" }], pengumuman: [] }).pemeliharaan[0];
      c.expect(j?.alasanKode === "RUTIN", `bacaStatusSaya must carry the reason code: ${JSON.stringify(j?.alasanKode)}`);
      return c.verdict("D2 in the app: Daisy's words; a required radio group of the five planned reasons with «Lainnya»'s text at most 120; the action refuses no choice before the call and passes p_reason_code; the banner and the pause page say «Alasan: …»");
    },
  },
  {
    id: "A2B-E01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // «Perpanjang» (Daisy, A2B-PERPANJANG-KATA §1; D3; A6's screen half)
      const kontrak = await import("../src/lib/pemeliharaan-kontrak") as Record<string, unknown>;
      const boleh = kontrak.bolehPerpanjang as ((w: Record<string, unknown>) => boolean) | undefined;
      c.expect(typeof boleh === "function", "pemeliharaan-kontrak must export bolehPerpanjang");
      if (boleh) {
        const w = { jenis: "PLANNED", keadaan: "TERJADWAL", selesai: "2026-11-16T05:00:00Z", menguasai: true };
        c.expect(boleh(w) && boleh({ ...w, keadaan: "AKTIF" }) && boleh({ ...w, keadaan: "MENJELANG" }), "a planned window with an end, scheduled or under way, can be extended");
        c.expect(!boleh({ ...w, selesai: null }), "a window with no end has nothing to extend");
        c.expect(!boleh({ ...w, jenis: "EMERGENCY" }), "an emergency is never extended (A8)");
        c.expect(!boleh({ ...w, keadaan: "BERAKHIR" }) && !boleh({ ...w, menguasai: false }), "an ended window, or one the reader does not control, offers no extension");
      }
      const kata: Record<string, string> = {
        "config.pemeliharaan.perpanjang": "Perpanjang", "config.pemeliharaan.perpanjang.judul": "Perpanjang pemeliharaan",
        "config.pemeliharaan.perpanjang.sekarang": "Sekarang diperkirakan selesai pukul {jam} {zona}.",
        "config.pemeliharaan.perpanjang.selesai_baru": "Selesai baru ({zona})", "config.pemeliharaan.perpanjang.simpan": "Simpan perpanjangan",
        "config.pemeliharaan.perpanjang.batal": "Batal",
        "galat.maintenance_extended": "Pemeliharaan diperpanjang sampai pukul {jam} {zona}. Pemberitahuan untuk yang terdampak ikut berubah.",
        "galat.maintenance_extend_not_later": "Waktu selesai baru harus lebih lambat dari pukul {jam} {zona}. Tidak ada yang diubah.",
        "galat.maintenance_extend_reason": "Tulis alasan perpanjangannya. Tidak ada yang diubah.",
      };
      const kunci = new Set<string>(allKeys());
      for (const [k, v] of Object.entries(kata)) {
        c.expect(kunci.has(k) && t(k as HleEvent, "staff", { locale: "id" }) === v, `${k} must say «${v}»: ${kunci.has(k) ? JSON.stringify(t(k as HleEvent, "staff", { locale: "id" })) : "missing"}`);
      }
      const aksi = readFileSync(join(repoRoot, "src/app/konfigurasi/actions.ts"), "utf8");
      const fn = /export async function perpanjangPemeliharaanAction[\s\S]*?\n}\n/.exec(aksi)?.[0] ?? "";
      c.expect(fn.length > 0, "actions.ts must export perpanjangPemeliharaanAction");
      const panggil = fn.indexOf('rpc("perpanjang_pemeliharaan"');
      c.expect(panggil > 0 && /p_window:/.test(fn) && /p_ends_at:/.test(fn) && /p_reason:/.test(fn), "the extend action must call perpanjang_pemeliharaan(p_window, p_ends_at, p_reason)");
      c.expect(fn.indexOf("MAINTENANCE_EXTEND_REASON") > 0 && fn.indexOf("MAINTENANCE_EXTEND_REASON") < panggil
        && fn.indexOf("MAINTENANCE_EXTEND_NOT_LATER") > 0 && fn.indexOf("MAINTENANCE_EXTEND_NOT_LATER") < panggil,
        "Daisy's two refusals (no reason; not later) must be checked before the call; the database stays the gate");
      c.expect(/MAINTENANCE_EXTENDED/.test(fn), "a done extension must say so (MAINTENANCE_EXTENDED)");
      const halaman = readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8");
      c.expect(/bolehPerpanjang\(w\)/.test(halaman) && /perpanjangPemeliharaanAction/.test(halaman), "the list row must offer «Perpanjang» only where bolehPerpanjang allows, with its form");
      c.expect(!/config\.pemeliharaan\.perpanjang\.batal"\)[^\n]*Batalkan/.test(halaman) && /config\.pemeliharaan\.perpanjang\.batal/.test(halaman),
        "the form's «Batal» must be its own key, never the row's «Batalkan»");
      return c.verdict("«Perpanjang»: offered only on a planned window with an end that is scheduled or under way and controlled by the reader; Daisy's words; the action checks no reason and not-later before calling perpanjang_pemeliharaan, which stays the gate; its «Batal» apart from the row's «Batalkan»");
    },
  },
  {
    id: "A2B-E02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // «Akhiri sekarang» on a planned window under way (Daisy, A2B-PERPANJANG-KATA §2; A7's screen half)
      const kontrak = await import("../src/lib/pemeliharaan-kontrak") as Record<string, unknown>;
      const kunciTanya = kontrak.kunciAkhiriTanya as ((w: Record<string, unknown>) => string) | undefined;
      c.expect(typeof kunciTanya === "function", "pemeliharaan-kontrak must export kunciAkhiriTanya");
      if (kunciTanya) {
        c.expect(kunciTanya({ platform: false, kelas: ["7A"] }) === "config.pemeliharaan.akhiri.tanya_kelas"
          && kunciTanya({ platform: false, kelas: null }) === "config.pemeliharaan.akhiri.tanya_sekolah"
          && kunciTanya({ platform: true, kelas: null }) === "config.pemeliharaan.akhiri.tanya_platform", "the confirmation is chosen by the window's scope");
      }
      const kata: Record<string, string> = {
        "config.pemeliharaan.akhiri.tanya_kelas": "Akhiri pemeliharaan sekarang? Pekerjaan kelas {kelas} dapat diubah lagi segera.",
        "config.pemeliharaan.akhiri.tanya_sekolah": "Akhiri pemeliharaan sekarang? Pekerjaan sekolah ini dapat diubah lagi segera.",
        "config.pemeliharaan.akhiri.tanya_platform": "Akhiri pemeliharaan sekarang? PINTAR dapat dipakai lagi segera.",
      };
      const kunci = new Set<string>(allKeys());
      for (const [k, v] of Object.entries(kata)) {
        c.expect(kunci.has(k) && t(k as HleEvent, "staff", { locale: "id" }) === v, `${k} must say «${v}»: ${kunci.has(k) ? t(k as HleEvent, "staff", { locale: "id" }) : "missing"}`);
      }
      const halaman = readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8");
      c.expect(/kunciAkhiriTanya\(w\)/.test(halaman), "a planned row under way must confirm its early end in its scope's words");
      return c.verdict("«Akhiri sekarang» on a planned window under way: its confirmation says what follows in the window's scope (class, school, platform), Daisy's words");
    },
  },
  {
    id: "A2B-E03",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // A8's screen half: the emergency keeps A2a's lift; neither act on its row; a direct call refused in Daisy's words
      const v = t("galat.maintenance_emergency_lift_only" as HleEvent, "staff", { locale: "id" });
      c.expect(v === "Penghentian darurat tidak dapat diperpanjang atau diakhiri di sini. Tidak ada yang diubah.", `the emergency refusal must say Daisy's sentence: «${v}»`);
      const halaman = readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8");
      c.expect(/const tanyaAkhiri = daruratKelas \?/.test(halaman) || /daruratKelas \? sl\("config\.pemeliharaan\.darurat\.akhiri_tanya"\)/.test(halaman),
        "an emergency row keeps A2a's own lift and its confirmation");
      c.expect(/w\.jenis === "PLANNED"[^\n]*kunciAkhiriTanya|kunciAkhiriTanya\(w\)/.test(halaman), "the scope confirmation is a planned window's only");
      return c.verdict("A8 on the screen: an emergency row keeps A2a's lift and offers neither «Perpanjang» nor the planned early end (bolehPerpanjang refuses it, E01); a direct call is refused in Daisy's words");
    },
  },
  {
    id: "A2B-K13",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const a = rA(db, d, "SEBELUM"), b = rA(db, d, "SESUDAH");
      c.expect(!a.err && !b.err, `R-A failed to run: ${a.err} ${b.err}`);
      c.expect(a.hasil.kelas === "PR110:MAINTENANCE_NO_NEW_START", `R-A: one minute before a planned class window, a start in the class must be refused PR110:MAINTENANCE_NO_NEW_START: ${a.hasil.kelas}`);
      c.expect(b.hasil.kelas === TEMPAT, `R-A: one second after its start, a start in the class must be refused ${TEMPAT}: ${b.hasil.kelas}`);
      c.expect(a.hasil.lain === "OK" && b.hasil.lain === "OK", `R-A: another class's start must proceed on both sides: ${a.hasil.lain}, ${b.hasil.lain}`);
      c.expect(a.hasil.kait === "OK" && b.hasil.kait === "OK", `R-A: the class's learner is never PT503 (no redirect) on either side: ${a.hasil.kait}, ${b.hasil.kait}`);
      return `the code on each side of a planned class window's start: T−1 min MAINTENANCE_NO_NEW_START, T+1 s MAINTENANCE_PLACE; another class starts on both sides; the class's learner passes the request hook on both (never PT503)`;
    }),
  },
  {
    id: "A2B-O01",
    requires: ["db"],
    run: jalan(async (c, db, d) => {
      const h = Object.fromEntries((["P", "K", "A", "D", "N"] as const).map((k) => [k, o01(db, d, k)])) as Record<string, ReturnType<typeof o01>>;
      for (const [k, r] of Object.entries(h)) c.expect(!r.err, `O01 ${k} failed to run: ${r.err}`);
      const nama = h.A.hasil.namaA;
      c.expect(h.P.hasil.baris === "1" && h.P.hasil.tolak === "MAINTENANCE_NO_NEW_START:ORANG:true:true:null",
        `inside T−15 of a PLATFORM window the orientation must be shown, refused NO_NEW_START with scope ORANG (4.0's «Mulai», then its page): ${h.P.hasil.baris} ${h.P.hasil.tolak}`);
      c.expect(h.K.hasil.tolak === `MAINTENANCE_NO_NEW_START:TEMPAT:true:true:${nama}`, `inside T−15 of 7A's window: NO_NEW_START, TEMPAT, its class: ${h.K.hasil.tolak}`);
      c.expect(h.A.hasil.tolak === `MAINTENANCE_PLACE:TEMPAT:true:true:${nama}`, `during 7A's window: PLACE, TEMPAT, its class: ${h.A.hasil.tolak}`);
      // the Chief Architect's D4 ruling: 30 min before 7A's window, on work closing after it, there is no refusal
      c.expect(h.D.hasil.baris === "1" && h.D.hasil.tolak === "null:null:false:false:null", `30 min before 7A's window, on work closing after it: the orientation, no refusal (D4 has no duration to judge): ${h.D.hasil.tolak}`);
      c.expect(h.N.hasil.baris === "1" && h.N.hasil.tolak === "null:null:false:false:null", `with no window: the orientation, no refusal: ${h.N.hasil.tolak}`);
      const { gantiFungsi } = await import("./balapan");
      const balik = gantiFungsi("public.assessment_orientation(uuid)", O01_SAAT, O01_TANAM);
      let tanam: ReturnType<typeof o01>;
      try { tanam = o01(db, d, "P"); } finally { balik(); }
      c.expect(tanam.hasil.baris === "0", `with the plant (the old "ok only" condition) the orientation was still shown inside a platform window's T−15: ${tanam.hasil.baris}`);
      return `the orientation under a maintenance refusal: shown with its code and the window's scope from one call, inside a platform window's T−15 (NO_NEW_START, ORANG), a class window's T−15 (NO_NEW_START, TEMPAT), and during it (PLACE), each with the window's start, end and class; 30 min before it, on work closing after it, and with no window, no refusal; with the plant (commit 3's "ok only") no orientation at all (${tanam.hasil.baris} rows)`;
    }),
  },
  {
    id: "A2B-A01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // R-A's three cases, by scope
      c.expect(arahTolakMulai("MAINTENANCE_NO_NEW_START", "ORANG") === "JEDA", "a platform window's T−15 must keep 4.0's page (redirect)");
      c.expect(arahTolakMulai("MAINTENANCE_NO_NEW_START", "TEMPAT") === "LAYAR", "a work-scoped window's T−15 must stay on the start screen");
      c.expect(arahTolakMulai("MAINTENANCE_PLACE", "TEMPAT") === "LAYAR", "a work-scoped window under way must stay on the start screen");
      c.expect(arahTolakMulai("MAINTENANCE_PLACE", "ORANG") === "LAYAR" && arahTolakMulai("MAINTENANCE_PLACE", null) === "LAYAR",
        "a refusal that is not T−15, whatever its scope, stays on the start screen");
      const tanpaKomentar = (x: string) => x.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
      const aksi = tanpaKomentar(readFileSync(join(repoRoot, "src/app/belajar/actions.ts"), "utf8"));
      const keJeda = [...aksi.matchAll(/redirect\(`?\$?\{?HALAMAN_PEMELIHARAAN[^\n]*/g)].map((m) => m[0]);
      c.expect(/if \(arahTolakMulai\(kodeTolak, cakupan\) === "JEDA"\) redirect\(`\$\{HALAMAN_PEMELIHARAAN\}\?mulai=ditolak`\);/.test(aksi),
        "the start action's redirect to the maintenance page for a refused start must be the platform branch only");
      c.expect(!/MAINTENANCE_PLACE"\)\s*redirect\(`?\$?\{?HALAMAN_PEMELIHARAAN/.test(aksi),
        `PLACE must never be sent to the maintenance page: ${keJeda.join(" | ")}`);
      const kontrak = tanpaKomentar(readFileSync(join(repoRoot, "src/lib/galat-kontrak.ts"), "utf8"));
      c.expect(/if \(state === "PR040" && e\?\.details === "MAINTENANCE_PLACE"\) return "MAINTENANCE_PLACE";/.test(kontrak)
        && !/MAINTENANCE_PLACE[^\n]*MAINTENANCE_ACTIVE|MAINTENANCE_ACTIVE[^\n]*MAINTENANCE_PLACE/.test(kontrak),
        "MAINTENANCE_PLACE must be read as its own refusal, never as PT503's MAINTENANCE_ACTIVE");
      const peta = tanpaKomentar(readFileSync(join(repoRoot, "src/lib/pemeliharaan-kontrak.ts"), "utf8"));
      c.expect(/if \(e\?\.code !== "PT503"\) return null;/.test(peta), "only PT503 is read as a window that stops the reader");
      const layar = readFileSync(join(repoRoot, "src/app/belajar/_components/PermukaanAsesmen.tsx"), "utf8");
      c.expect(/arahTolakMulai\(tolak, orientasi\.tolak_cakupan\) === "LAYAR"/.test(layar) && /disabled aria-describedby="mulai-tolak"/.test(layar),
        "the start screen must disable «Mulai» and tie its sentence to it for a refusal said there");
      return c.verdict("R-A in the app (reads source and runs the pure rule): a platform window's T−15 keeps 4.0's redirect to the maintenance page; a work-scoped window's T−15 and a work-scoped window under way stay on the start screen, as does D4; the start action redirects to the maintenance page only on the platform branch; MAINTENANCE_PLACE is its own refusal and never PT503's; the start screen disables «Mulai» with its sentence tied by aria-describedby");
    },
  },
  {
    id: "A2B-K06",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = k6(db, d);
      c.expect(!r.err, `K6 failed to run: ${r.err}`);
      const h = r.hasil;
      c.expect(h.awal === TEMPAT, `K6: during the window the act must be refused ${TEMPAT}: ${h.awal}`);
      c.expect(h.perpanjang === "OK", `K6: the school's admin's extend (perpanjang_pemeliharaan) must succeed: ${h.perpanjang}`);
      c.expect(h.sesudah_perpanjang === TEMPAT, `K6: after the old end, the guard must follow the new end: ${h.sesudah_perpanjang}`);
      c.expect(h.akhiri === "OK", `K6: resume early (AKHIRI) must succeed: ${h.akhiri}`);
      c.expect(h.sesudah_akhiri === "OK", `K6: after an early end the refused act must succeed at once: ${h.sesudah_akhiri}`);
      c.expect(h.audit === "1", `K6: one maintenance.extended audit row with before, after and reason: ${h.audit}`);
      return `extend moves the end the guard reads at once (refused after the old end); resume early lifts the refusal at once; the extend is audited with before, after and reason`;
    }),
  },
  {
    id: "A2B-K07",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = k7(db, d);
      c.expect(!r.err, `K7 failed to run: ${r.err}`);
      const h = r.hasil;
      c.expect(h.perpanjang_sys === "PR110:MAINTENANCE_EMERGENCY_LIFT_ONLY", `K7: extend on an EMERGENCY window must be refused PR110:MAINTENANCE_EMERGENCY_LIFT_ONLY (Admin PINTAR): ${h.perpanjang_sys}`);
      c.expect(/^PR110:/.test(h.perpanjang_admin ?? ""), `K7: extend on an EMERGENCY window by the school's admin must be refused: ${h.perpanjang_admin}`);
      c.expect(h.akhiri_admin === "PR110:MAINTENANCE_NOT_ALLOWED", `K7: resume early on an EMERGENCY window by the school's admin must be refused: ${h.akhiri_admin}`);
      c.expect(h.akhiri_sys === "OK" && h.angkat === "true", `K7: Admin PINTAR's AKHIRI must be A2a's fenced lift (T_lift recorded, ends_at untouched): ${h.akhiri_sys}, ${h.angkat}`);
      const ada = penulisAkhir(db);
      const lebih = ada.filter((f) => !PENULIS_AKHIR.includes(f)), kurang = PENULIS_AKHIR.filter((f) => !ada.includes(f));
      c.expect(lebih.length === 0 && kurang.length === 0, `K7: the writers of maintenance_windows.ends_at must be exactly ${PENULIS_AKHIR.join(", ")}: also ${lebih.join(", ") || "none"}; missing ${kurang.join(", ") || "none"}`);
      return `an emergency is never extended or ended early: extend refuses it; the school's admin's AKHIRI is refused; Admin PINTAR's AKHIRI is A2a's fenced lift; the writers of a window's end are exactly ${PENULIS_AKHIR.join(", ")}`;
    }),
  },
  {
    id: "A2B-K08",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = k8(db, d);
      c.expect(!r.err, `K8 failed to run: ${r.err}`);
      const h = r.hasil;
      c.expect(h.berakhir_takdicatat === "PR110:MAINTENANCE_NOT_OPEN", `K8: extending a window ended by its time, its end not yet recorded, must be refused PR110:MAINTENANCE_NOT_OPEN: ${h.berakhir_takdicatat}`);
      c.expect(h.berakhir_dicatat === "PR110:MAINTENANCE_NOT_OPEN", `K8: the same with its end recorded: ${h.berakhir_dicatat}`);
      c.expect(h.baru_berakhir === "PR110:MAINTENANCE_NOT_OPEN", `K8: a window that ended after the transaction began (its now() before the end) must be refused, read on the clock: ${h.baru_berakhir}`);
      c.expect(h.aktif_takdicatat === "OK", `K8: a window that started with no activation recorded must be extendable (the state is never read from activation_recorded_at): ${h.aktif_takdicatat}`);
      c.expect(h.akhir_tetap === "true", `K8: the ended window's end must be unchanged: ${h.akhir_tetap}`);
      return `a window that has ended is never extended, read on the clock against ends_at, whether or not the recorder marked it; activation_recorded_at decides nothing`;
    }),
  },
  {
    id: "A2B-K09",
    requires: ["db"],
    run: jalan(async (c, db, d) => {
      const a = await k9(db, d, 1);
      c.expect(a.ok, `K9 order 1 failed to run: ${a.err}`);
      c.expect(a.tunggu >= 1500, `K9 order 1: the extend did not wait for the recorder (${a.tunggu} ms): the race was not made`);
      c.expect(a.panjang === "PR110:MAINTENANCE_NOT_OPEN", `K9 order 1 (the recorder first): the extend must then be refused PR110:MAINTENANCE_NOT_OPEN: ${a.panjang}`);
      c.expect(a.aktif === 1 && a.nonaktif === 1 && !a.diperpanjang, `K9 order 1: one activation, one deactivation, the end unchanged: ${a.aktif}, ${a.nonaktif}, extended ${a.diperpanjang}`);
      const b = await k9(db, d, 2);
      c.expect(b.ok, `K9 order 2 failed to run: ${b.err}`);
      c.expect(b.panjang === "OK", `K9 order 2 (extend first): the extend must succeed: ${b.panjang}`);
      c.expect(b.aktif === 1 && b.nonaktif === 0 && b.diperpanjang, `K9 order 2: the recorder skipped the held row and its next run read the new end: one activation, no deactivation, extended: ${b.aktif}, ${b.nonaktif}, ${b.diperpanjang}`);
      return `extend against the edge recorder, both orders on two connections: the recorder first, the extend waits and is refused (1 activation, 1 deactivation); extend first, the recorder skips and its next run reads the new end (1 activation, 0 deactivations)`;
    }),
  },
  {
    id: "A2B-K10",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const baik = k10(db, d, d.kA);
      c.expect(!baik.err, `K10 failed to run: ${baik.err}`);
      c.expect(baik.hasil.check === "0", `K10: A2a's CHECK maintenance_windows_class_is_emergency must be dropped: ${baik.hasil.check} found`);
      c.expect(baik.hasil.jadwal === "OK", `K10: a PLANNED class window scheduled by the school's admin through schedule_maintenance(…, p_nodes) must be accepted: ${baik.hasil.jadwal}`);
      const lain = k10(db, d, d.kY), bukan = k10(db, d, d.X), entah = k10(db, d, ID("dead"));
      for (const [nama, r] of [["another school's class", lain], ["a node that is not a class", bukan], ["an unknown node", entah]] as const) {
        c.expect(r.hasil.jadwal === "PR110:MAINTENANCE_NODE_INVALID", `K10: ${nama} must be refused by schedule_maintenance with PR110:MAINTENANCE_NODE_INVALID before any constraint: ${r.hasil.jadwal}`);
      }
      c.expect(lain.hasil.picu === "PR080:MAINTENANCE_CLASS_SCOPE_INVALID", `K10: A2a's node trigger must cover a PLANNED window (another school's class written directly): ${lain.hasil.picu}`);
      return `A2a's emergency-only CHECK is gone; a PLANNED class window is scheduled by the school's admin; a bad class (another school's, not a class, unknown) is refused MAINTENANCE_NODE_INVALID before any constraint; the node trigger covers PLANNED`;
    }),
  },
  {
    id: "A2B-K11",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const k = k11(db, d, "KELAS");
      c.expect(!k.err, `K11 (class) failed to run: ${k.err}`);
      c.expect(k.hasil.aksi_A === TEMPAT, `K11: a planned window on 7A: the teacher's act on 7A's work must be refused ${TEMPAT}: ${k.hasil.aksi_A}`);
      c.expect(k.hasil.aksi_B === "OK" && k.hasil.aksi_Y === "OK", `K11: the same teacher's act on 7B's and school Y's work must succeed: 7B ${k.hasil.aksi_B}, Y ${k.hasil.aksi_Y}`);
      c.expect(k.hasil.kait === "OK" && k.hasil.blok === "none", `K11: a work-scoped window never stops the teacher as a person (no PT503, no redirect): hook ${k.hasil.kait}, block ${k.hasil.blok}`);
      c.expect(k.hasil.pindah_keluar === "OK", `K11: PLANNED reads current placement: a learner moved from 7A to 7B after the window began starts in 7B: ${k.hasil.pindah_keluar}`);
      // Sharon's ruling (A2B-STEP1-b95bfe9c.md, question 1): an ACTIVE work-scoped window refuses a start with the
      // place's code; MAINTENANCE_NO_NEW_START stays for T−15
      c.expect(k.hasil.pindah_masuk === TEMPAT, `K11: a learner moved into 7A after the window began is refused there ${TEMPAT}: ${k.hasil.pindah_masuk}`);
      const s = k11(db, d, "SEKOLAH");
      c.expect(!s.err, `K11 (school) failed to run: ${s.err}`);
      c.expect(s.hasil.aksi_A === TEMPAT && s.hasil.aksi_B === TEMPAT, `K11: a school-wide planned window at X: the teacher's acts at X must be refused ${TEMPAT}: 7A ${s.hasil.aksi_A}, 7B ${s.hasil.aksi_B}`);
      c.expect(s.hasil.aksi_Y === "OK", `K11: the same teacher's act at school Y must succeed (R-1's cross-school case): ${s.hasil.aksi_Y}`);
      c.expect(s.hasil.kait === "OK" && s.hasil.blok === "none", `K11: a school-wide planned window is work-scoped too: hook ${s.hasil.kait}, block ${s.hasil.blok}`);
      return `work scope: a teacher of 7A and 7B is refused only on 7A's work; at two schools, only at the window's; never PT503 nor stopped as a person; PLANNED reads current placement (moved out starts, moved in is refused)`;
    }),
  },
  {
    id: "A2B-K12",
    requires: ["db"],
    run: jalan((c, db, d) => {
      const r = k12(db, d);
      c.expect(!r.err, `K12 failed to run: ${r.err}`);
      const h = r.hasil;
      c.expect(h.aksi_henti === "PR170:SITTING_CLASS_STOPPED", `K12: with both windows over 7A the emergency governs: the teacher's act must be refused with A2a's PR170:SITTING_CLASS_STOPPED: ${h.aksi_henti}`);
      c.expect(h.blok_henti === "EMERGENCY", `K12: the learner must be stopped as a person by the emergency: ${h.blok_henti}`);
      c.expect(h.blok_angkat === "none", `K12: after the lift, with the planned window still on, the learner must not be stopped as a person: ${h.blok_angkat}`);
      c.expect(h.jawab_angkat === "OK", `K12: after the lift the learner's answer (A2a's credit) must be taken: ${h.jawab_angkat}`);
      c.expect(h.rilis === "OK", `K12: after the lift the release batch must run: ${h.rilis}`);
      c.expect(h.keluar_angkat === "OK", `K12: after the lift a departure must be allowed: ${h.keluar_angkat}`);
      c.expect(h.aksi_angkat === TEMPAT, `K12: after the lift the teacher's act is refused by the planned window's place: ${h.aksi_angkat}`);
      return `a planned and an emergency window over one class: the emergency governs (A2a's refusal, stopped as a person); after the lift the planned guard refuses nothing A2a allows (the answer, the release batch, a departure) and refuses the teacher's act by place`;
    }),
  },
];

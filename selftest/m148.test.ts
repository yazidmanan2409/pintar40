/**
 * #148 — MAINTENANCE AND SCOPED NOTICES (D-094, D-100(b)(c); D-093 §5 for the audit). Planned maintenance and the
 * emergency interruption are tested apart, as the ruling asks, with the assessments already under way watched in both.
 *
 *  K01  the contract, run: the status read back trusting nothing; PostgREST's PT503 read as the kind of window; the
 *       browser's T-60/30/15 and T=0, its minutes and its next moment; WIB both ways; the paths that still answer;
 *       PR110's codes and PT503 as action results, each with a sentence in both languages; no promise of a message.
 *  S01  the source: the proxy sends a stopped page to /pemeliharaan and refuses the rest 503; the root layout reads the
 *       status once and the browser times the rest (no polling); a refused start goes to the maintenance page;
 *       Konfigurasi checks the window against the assessments before scheduling, and «Hentikan sekarang» is Admin
 *       platform's alone; the migration's pre-request checks maintenance first and lets the status read and leaving
 *       through.
 *  D01  PLANNED, against the database, rolled back: who may schedule; the collision count; T-20 a start is allowed;
 *       T-15 a new sitting is refused and requests pass; T=0 the school's people are stopped (PT503) but the status
 *       read and leaving, a learner whose sitting is running (they drain: it continues and is handed in), the window's
 *       admin and another school's people pass; once handed in the learner is stopped and told it was received; ended
 *       by its admin, or by the clock, everyone passes; the matching notice reaches only the school; every step audited,
 *       the automatic ones as SYSTEM.
 *  D02  EMERGENCY, against the database, rolled back: Admin platform alone, with the typed phrase and a reason; it stops
 *       the school at once, the running sitting included, while the status read passes and says so; the sitting is left
 *       exactly as it was (not handed in, not finalised, its answer kept); Admin sekolah cannot end it; once ended the
 *       learner carries on; audited.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES, type HleEvent } from "../src/lib/hle";
import { KODE_PEMELIHARAAN, kodeGalat, kunciKode } from "../src/lib/galat-kontrak";
import {
  bacaDaftarKelola, bacaStatusSaya, galatPemeliharaan, HALAMAN_PEMELIHARAAN, jalurSaatPemeliharaan, jamWib, jendelaUtama,
  KONFIRMASI_HENTIKAN, menitTersisa, permukaanAsesmen, tahapBerikutMs, tahapPeringatan, waktuWib,
} from "../src/lib/pemeliharaan-kontrak";

const MIGRASI = "supabase/migrations/20261120100000_maintenance_is_announced_and_drains.sql";

const PEMBANTU = `
create function pg_temp.kode(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text;
begin
  execute p_sql; return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return v_state || coalesce(':' || nullif(v_detail, ''), '');
end $f$;
-- tried and undone: whether a statement would be accepted now, leaving nothing behind
create function pg_temp.coba(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text;
begin
  execute p_sql;
  raise exception 'M148_UNDO';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  if sqlerrm = 'M148_UNDO' then return 'OK'; end if;
  return v_state || coalesce(':' || nullif(v_detail, ''), '');
end $f$;
-- PostgREST's pre-request, for this person's request to this path
create function pg_temp.pintu(p_uid uuid, p_jalur text) returns text language plpgsql as $f$
declare v_state text; v_msg text; v_out text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  perform set_config('request.path', p_jalur, true);
  begin
    perform pintar_permintaan.periksa();
    v_out := 'LEWAT';
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
    v_out := v_state || ':' || v_msg;
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
-- what this person is told as a page begins
create function pg_temp.status(p_uid uuid) returns jsonb language plpgsql as $f$
declare j jsonb;
begin
  perform selftest.as_user_uid(p_uid);
  j := public.pintar_status_saya();
  perform selftest.as_owner();
  return j;
end $f$;
`;

const DB_RENCANA = `
begin;
${PEMBANTU}
do $m148$
declare v jsonb := '{}'::jsonb; c record; j jsonb; w1 uuid; w2 uuid; n1 uuid; jalan uuid; v_dulu bigint;
        lain_u uuid; lain uuid; inst2 uuid; s text;
begin
  perform selftest.as_owner();
  v := v || jsonb_build_object('ada', to_regprocedure('public.schedule_maintenance(boolean,uuid[],timestamptz,timestamptz,text,text,boolean)') is not null);
  select * into c from selftest.wp2_school();
  lain_u := selftest.f06p10_person('m148-murid-lain');
  select a.person_id into lain from public.accounts a where a.auth_user_id = lain_u;
  select i.id into inst2 from public.institutions i where i.id <> c.inst and i.tenant_kind = 'INSTITUTION' order by i.name limit 1;
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
  select lain, 'EDUCATOR', o.id, now() + interval '1 year' from public.org_nodes o where o.institution_id = inst2 and o.kind = 'INSTITUTION';
  perform set_config('app.seed_intent', '', true);
  select coalesce(max(id), 0) into v_dulu from public.audit_log;
  -- learner A is already sitting an assessment when it all begins (the copy's hand-in times are the template's: cleared)
  jalan := selftest.wp6_evidence_session(c.sess_a, c.la, c.cls_a, null);
  update public.assessment_sessions set submitted_at = null, finalized_at = null, authoritative_deadline = null where id = jalan;

  -- (1) who may schedule, and what the window would meet
  perform selftest.as_user_uid(c.edu_u);
  v := v || jsonb_build_object('guru', pg_temp.kode(format('select public.schedule_maintenance(false, array[%L]::uuid[], now() + interval ''20 minutes'', null, null, ''x'', false)', c.inst)));
  perform selftest.as_user_uid(c.adm_u);
  v := v || jsonb_build_object(
    'admin_platform', pg_temp.kode('select public.schedule_maintenance(true, null, now() + interval ''20 minutes'', null, null, ''x'', false)'),
    'admin_sekolah_lain', pg_temp.kode(format('select public.schedule_maintenance(false, array[%L]::uuid[], now() + interval ''20 minutes'', null, null, ''x'', false)', inst2)),
    'lalu', pg_temp.kode(format('select public.schedule_maintenance(false, array[%L]::uuid[], now() - interval ''1 hour'', null, null, ''x'', false)', c.inst)),
    'tanpa_alasan', pg_temp.kode(format('select public.schedule_maintenance(false, array[%L]::uuid[], now() + interval ''20 minutes'', null, null, '' '', false)', c.inst)),
    'tabrakan', public.maintenance_collisions(false, array[c.inst], now() + interval '20 minutes', now() + interval '2 hours'),
    'baca_langsung', pg_temp.kode('select count(*) from public.maintenance_windows'));
  w1 := public.schedule_maintenance(false, array[c.inst], now() + interval '20 minutes', now() + interval '2 hours',
                                    'PINTAR diperbarui malam ini.', 'Pembaruan basis data', true);
  perform selftest.as_owner();

  -- (2) T-20: told within the hour; a new sitting may still start; nothing is stopped
  j := pg_temp.status(c.lb_u);
  v := v || jsonb_build_object('t20', jsonb_build_object(
    'keadaan', j #>> '{pemeliharaan,0,keadaan}', 'pengumuman', jsonb_array_length(j -> 'pengumuman'),
    'mulai_baru', pg_temp.coba(format('select selftest.wp6_evidence_session(%L, %L, %L, null)', c.sess_b, c.lb, c.cls_b)),
    'pintu', pg_temp.pintu(c.lb_u, '/rpc/my_learning_assignments'),
    'lain', jsonb_array_length(pg_temp.status(lain_u) -> 'pemeliharaan') + jsonb_array_length(pg_temp.status(lain_u) -> 'pengumuman')));

  -- (3) T-10: no new sitting for the school's people; requests still pass
  update public.maintenance_windows set starts_at = now() + interval '10 minutes' where id = w1;
  v := v || jsonb_build_object('t10', jsonb_build_object(
    'keadaan', pg_temp.status(c.lb_u) #>> '{pemeliharaan,0,keadaan}',
    'mulai_baru', pg_temp.coba(format('select selftest.wp6_evidence_session(%L, %L, %L, null)', c.sess_b, c.lb, c.cls_b)),
    'pintu', pg_temp.pintu(c.lb_u, '/rpc/my_learning_assignments')));

  -- (4) T=0: the school's people are stopped, but for the status read and leaving; the running sitting drains
  update public.maintenance_windows set starts_at = now() - interval '1 minute' where id = w1;
  j := pg_temp.status(c.lb_u);
  v := v || jsonb_build_object('t0', jsonb_build_object(
    'murid_b', pg_temp.pintu(c.lb_u, '/rpc/my_learning_assignments'),
    'murid_b_status', pg_temp.pintu(c.lb_u, '/rpc/pintar_status_saya'),
    'murid_b_keluar', pg_temp.pintu(c.lb_u, '/rpc/sesi_akhiri_saya'),
    'murid_b_periksa', pg_temp.pintu(c.lb_u, '/rpc/sesi_periksa'),
    'guru', pg_temp.pintu(c.edu_u, '/rpc/my_learning_assignments'),
    'terhenti', j ->> 'terhenti', 'keadaan', j #>> '{pemeliharaan,0,keadaan}',
    'murid_a', pg_temp.pintu(c.la_u, '/rpc/submit_answer'),
    'murid_a_berjalan', pg_temp.status(c.la_u) #>> '{pemeliharaan,0,berjalan}',
    'murid_a_baru', pg_temp.coba(format('select selftest.wp6_evidence_session(%L, %L, %L, null)', c.sess_a, c.la, c.cls_a)),
    'admin', pg_temp.pintu(c.adm_u, '/rpc/maintenance_list'),
    'admin_menguasai', pg_temp.status(c.adm_u) #>> '{pemeliharaan,0,menguasai}',
    'sekolah_lain', pg_temp.pintu(lain_u, '/rpc/my_learning_assignments')));
  -- learner A hands the sitting in during maintenance; then they too are stopped, and told it was received
  perform selftest.as_user_uid(c.la_u);
  begin
    s := public.submit_session(jalan)::text;
  exception when others then s := sqlstate || ':' || sqlerrm;
  end;
  perform selftest.as_owner();
  j := pg_temp.status(c.la_u);
  v := v || jsonb_build_object('kumpul', s, 'sesi', (select status::text from public.assessment_sessions where id = jalan),
    'setelah_kumpul', pg_temp.pintu(c.la_u, '/rpc/my_learning_assignments'),
    'terkumpul', (j #>> '{pemeliharaan,0,terkumpul}') is not null);

  -- (5) ended by its admin, with a reason: everyone passes, the matching notice is withdrawn
  perform selftest.as_user_uid(c.edu_u);
  v := v || jsonb_build_object('akhiri_guru', pg_temp.kode(format('select public.change_maintenance(%L, ''AKHIRI'', ''x'')', w1)));
  perform selftest.as_user_uid(c.adm_u);
  v := v || jsonb_build_object(
    'akhiri_tanpa_alasan', pg_temp.kode(format('select public.change_maintenance(%L, ''AKHIRI'', '' '')', w1)),
    'akhiri', public.change_maintenance(w1, 'AKHIRI', 'Pembaruan selesai') ->> 'state',
    'akhiri_lagi', pg_temp.kode(format('select public.change_maintenance(%L, ''AKHIRI'', ''x'')', w1)));
  perform selftest.as_owner();
  v := v || jsonb_build_object('setelah_akhir', pg_temp.pintu(c.lb_u, '/rpc/my_learning_assignments'),
    'pengumuman_akhir', jsonb_array_length(pg_temp.status(c.lb_u) -> 'pengumuman'));

  -- (6) ended by the clock: started and ended while nobody looked; the next read records both edges as SYSTEM
  perform selftest.as_user_uid(c.adm_u);
  w2 := public.schedule_maintenance(false, array[c.inst], now() + interval '20 minutes', now() + interval '3 hours', null, 'Jadwal kedua', false);
  perform selftest.as_owner();
  update public.maintenance_windows set starts_at = now() - interval '2 hours', ends_at = now() - interval '1 minute' where id = w2;
  v := v || jsonb_build_object('jam_berakhir', pg_temp.pintu(c.lb_u, '/rpc/my_learning_assignments'),
    'jam_status', jsonb_array_length(pg_temp.status(c.lb_u) -> 'pemeliharaan'));

  -- (7) a notice of its own, to the school only, then withdrawn
  perform selftest.as_user_uid(c.adm_u);
  n1 := public.publish_notice(false, array[c.inst], 'Ujian semester dimulai Senin.', null, now() + interval '1 day');
  v := v || jsonb_build_object('pengumuman_lain_sekolah', pg_temp.kode(format('select public.publish_notice(false, array[%L]::uuid[], ''x'', null, now() + interval ''1 day'')', inst2)));
  perform selftest.as_owner();
  v := v || jsonb_build_object('pengumuman', jsonb_build_object(
    'murid', jsonb_array_length(pg_temp.status(c.lb_u) -> 'pengumuman'), 'lain', jsonb_array_length(pg_temp.status(lain_u) -> 'pengumuman')));
  perform selftest.as_user_uid(c.adm_u);
  perform public.withdraw_notice(n1, 'Jadwal berubah');
  perform selftest.as_owner();
  v := v || jsonb_build_object('pengumuman_ditarik', jsonb_array_length(pg_temp.status(c.lb_u) -> 'pengumuman'));

  -- (8) the audit (D-093): each step its own row; the automatic ones by nobody, as SYSTEM
  select jsonb_object_agg(action, n) into j from (select action, count(*) n from public.audit_log
    where id > v_dulu and (action like 'maintenance.%' or action like 'notice.%') group by action) x;
  v := v || jsonb_build_object('audit', j,
    'sistem', (select bool_and(a.actor_person_id is null and a.summary ->> 'actor' = 'SYSTEM') from public.audit_log a
                where a.id > v_dulu and a.action in ('maintenance.activated', 'maintenance.deactivated')),
    'peralihan', (select bool_and(a.summary ? 'from_state' and a.summary ? 'to_state') from public.audit_log a
                   where a.id > v_dulu and a.action like 'maintenance.%'),
    'alasan_akhir', (select a.summary ->> 'reason' from public.audit_log a where a.id > v_dulu and a.action = 'maintenance.ended_now'));
  raise notice 'M148D01 %', v;
end $m148$;
rollback;
`;

const DB_DARURAT = `
begin;
${PEMBANTU}
do $m148$
declare v jsonb := '{}'::jsonb; c record; j jsonb; em uuid; jalan uuid; v_dulu bigint; sys_u uuid; sys uuid; lain_u uuid; lain uuid;
        inst2 uuid; v_item uuid; v_pi uuid; jawab0 int; sesi0 text;
begin
  perform selftest.as_owner();
  select * into c from selftest.wp2_school();
  sys_u := selftest.f06p10_person('m148-sysadmin');
  lain_u := selftest.f06p10_person('m148-guru-lain');
  select a.person_id into sys from public.accounts a where a.auth_user_id = sys_u;
  select a.person_id into lain from public.accounts a where a.auth_user_id = lain_u;
  select i.id into inst2 from public.institutions i where i.id <> c.inst and i.tenant_kind = 'INSTITUTION' order by i.name limit 1;
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values (sys, 'SYSTEM_ADMIN', c.root, now() + interval '1 year');
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
  select lain, 'EDUCATOR', o.id, now() + interval '1 year' from public.org_nodes o where o.institution_id = inst2 and o.kind = 'INSTITUTION';
  perform set_config('app.seed_intent', '', true);
  select coalesce(max(id), 0) into v_dulu from public.audit_log;
  -- learner A is sitting an assessment, one answer already received (the copy's hand-in times are the template's: cleared)
  jalan := selftest.wp6_evidence_session(c.sess_a, c.la, c.cls_a, null);
  update public.assessment_sessions set submitted_at = null, finalized_at = null, authoritative_deadline = null where id = jalan;
  select i.id into v_item from public.items i where i.institution_id = c.inst order by i.id limit 1;
  if v_item is null then select i.id into v_item from public.items i order by i.id limit 1; end if;
  insert into public.presented_items (session_id, item_id, institution_id, position) values (jalan, v_item, c.inst, 1) returning id into v_pi;
  insert into public.responses (presented_item_id, session_id, institution_id, client_seq, value, value_digest, is_final)
  values (v_pi, jalan, c.inst, 1, '{"pilihan":"A"}'::jsonb, encode(sha256('A'::bytea), 'hex'), true);
  select count(*) into jawab0 from public.responses where session_id = jalan;

  -- (1) Admin platform alone, with the phrase and a reason
  perform selftest.as_user_uid(c.adm_u);
  v := v || jsonb_build_object('admin_sekolah', pg_temp.kode(format('select public.stop_pintar_now(false, array[%L]::uuid[], ''Insiden'', ''HENTIKAN SEKARANG'')', c.inst)));
  perform selftest.as_user_uid(sys_u);
  v := v || jsonb_build_object(
    'frasa_salah', pg_temp.kode(format('select public.stop_pintar_now(false, array[%L]::uuid[], ''Insiden'', ''hentikan'')', c.inst)),
    'tanpa_alasan', pg_temp.kode(format('select public.stop_pintar_now(false, array[%L]::uuid[], '' '', ''HENTIKAN SEKARANG'')', c.inst)));
  em := public.stop_pintar_now(false, array[c.inst], 'Insiden keamanan pada penyimpanan', 'HENTIKAN SEKARANG');
  perform selftest.as_owner();
  sesi0 := (select status::text from public.assessment_sessions where id = jalan);

  -- (2) at once: the school's people, the running sitting included, its admin too; the status read passes and says so
  j := pg_temp.status(c.la_u);
  v := v || jsonb_build_object('henti', jsonb_build_object(
    'murid_a', pg_temp.pintu(c.la_u, '/rpc/submit_answer'),
    'murid_a_kumpul', pg_temp.pintu(c.la_u, '/rpc/finish_my_session'),
    'murid_a_status', pg_temp.pintu(c.la_u, '/rpc/pintar_status_saya'),
    'murid_a_keluar', pg_temp.pintu(c.la_u, '/rpc/sesi_akhiri_saya'),
    'terhenti', j ->> 'terhenti', 'jenis', j #>> '{pemeliharaan,0,jenis}',
    'murid_b', pg_temp.pintu(c.lb_u, '/rpc/my_learning_assignments'),
    'admin_sekolah', pg_temp.pintu(c.adm_u, '/rpc/maintenance_list'),
    'platform', pg_temp.pintu(sys_u, '/rpc/maintenance_list'),
    'sekolah_lain', pg_temp.pintu(lain_u, '/rpc/my_learning_assignments'),
    'mulai_baru', pg_temp.coba(format('select selftest.wp6_evidence_session(%L, %L, %L, null)', c.sess_b, c.lb, c.cls_b))));

  -- (3) the sitting exactly as it was: not handed in, not finalised, its answer kept
  v := v || jsonb_build_object('sesi', jsonb_build_object(
    'sebelum', sesi0, 'sesudah', (select status::text from public.assessment_sessions where id = jalan),
    'dikumpulkan', (select submitted_at is not null or finalized_at is not null from public.assessment_sessions where id = jalan),
    'jawaban', (select count(*) from public.responses where session_id = jalan) = jawab0));

  -- (4) only Admin platform ends it; then the learner carries on
  perform selftest.as_user_uid(c.adm_u);
  v := v || jsonb_build_object('akhiri_admin_sekolah', pg_temp.kode(format('select public.change_maintenance(%L, ''AKHIRI'', ''x'')', em)));
  perform selftest.as_user_uid(sys_u);
  v := v || jsonb_build_object('akhiri', public.change_maintenance(em, 'AKHIRI', 'Penyimpanan aman kembali') ->> 'state');
  perform selftest.as_owner();
  v := v || jsonb_build_object('setelah', pg_temp.pintu(c.la_u, '/rpc/submit_answer'),
    'sesi_setelah', (select status::text from public.assessment_sessions where id = jalan),
    'jawaban_setelah', (select count(*) from public.responses where session_id = jalan) = jawab0);

  -- (5) the audit
  select jsonb_object_agg(action, n) into j from (select action, count(*) n from public.audit_log
    where id > v_dulu and action like 'maintenance.%' group by action) x;
  v := v || jsonb_build_object('audit', j,
    'alasan', (select a.summary ->> 'reason' from public.audit_log a where a.id > v_dulu and a.action = 'maintenance.emergency_stop'),
    'pelaku', (select a.actor_person_id = sys from public.audit_log a where a.id > v_dulu and a.action = 'maintenance.emergency_stop'));
  raise notice 'M148D02 %', v;
end $m148$;
rollback;
`;

function jalankan(repoRoot: string, skrip: string, tanda: string): { v: Record<string, unknown> | null; galat: string } {
  const db = process.env.SUPABASE_DB_URL!;
  for (const f of ["fable01.sql", "fable06.sql"]) {
    spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db], { encoding: "utf8" });
  }
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skrip, db], { encoding: "utf8", maxBuffer: 1 << 24 });
  const baris = (r.stderr || "").split("\n");
  const catat = baris.find((l) => l.includes(`NOTICE:  ${tanda} `));
  if (!catat) return { v: null, galat: baris.find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop() ?? "" };
  return { v: JSON.parse(catat.slice(catat.indexOf(`${tanda} `) + tanda.length + 1)), galat: "" };
}

export const m148Tests: SelfTest[] = [
  {
    id: "M148-K01",
    run: async () => {
      const c = new Checks();
      // the status, read back trusting nothing
      const mulai = "2026-10-05T15:00:00Z";
      const st = bacaStatusSaya({
        pemeliharaan: [
          { id: "w1", jenis: "PLANNED", keadaan: "MENJELANG", mulai, selesai: "2026-10-05T17:00:00Z", pesan: "x", menguasai: false, berjalan: true, terkumpul: null },
          { id: "w2", jenis: "EMERGENCY", keadaan: "AKTIF", mulai, selesai: null, pesan: null, menguasai: false, berjalan: false },
          { id: "w3", jenis: "LAINNYA", keadaan: "AKTIF", mulai },
          { id: "w4", jenis: "PLANNED", keadaan: "BERAKHIR", mulai },
          { jenis: "PLANNED", keadaan: "AKTIF", mulai },
        ],
        pengumuman: [{ id: "n1", pesan: "Libur", sampai: mulai }, { id: "n2", pesan: "", sampai: mulai }],
        terhenti: "SEMUA", sekarang: "2026-10-05T14:40:00Z",
      });
      c.expect(st.pemeliharaan.length === 2 && st.pemeliharaan[0].berjalan === true && st.pengumuman.length === 1 && st.terhenti === null
        && st.sekarang === "2026-10-05T14:40:00Z", `the status was trusted beyond its shape: ${JSON.stringify(st)}`);
      c.expect(jendelaUtama(st)?.id === "w2", "an emergency is not what the reader is told first");
      c.expect(bacaStatusSaya(null).pemeliharaan.length === 0 && bacaStatusSaya("x").terhenti === null, "an unreadable status says something");
      const kelola = bacaDaftarKelola({ pemeliharaan: [{ id: "a", jenis: "PLANNED", keadaan: "BERAKHIR", mulai, alasan: "r", sekolah: ["S", 3] }, { id: "b" }], pengumuman: [{ id: "n", pesan: "p", terbit: mulai, sampai: mulai, boleh: true }] });
      c.expect(kelola.pemeliharaan.length === 1 && kelola.pemeliharaan[0].sekolah.length === 1 && kelola.pengumuman[0].boleh === true, "the administrator's list was trusted beyond its shape");
      // PostgREST's refusal
      c.expect(galatPemeliharaan({ code: "PT503", message: "PINTAR_PEMELIHARAAN" }) === "PLANNED"
        && galatPemeliharaan({ code: "PT503", message: "PINTAR_DIHENTIKAN" }) === "EMERGENCY"
        && galatPemeliharaan({ code: "PT503", message: "lain" }) === null && galatPemeliharaan({ code: "PT423", message: "SESI_TERKUNCI" }) === null
        && galatPemeliharaan(null) === null, "PT503 is not read as the kind of window, or something else is");
      // the browser's clock: T-60, T-30, T-15, T=0
      const m = Date.parse(mulai);
      const menit = (n: number) => m - n * 60_000;
      c.expect(tahapPeringatan(mulai, menit(61)) === null && tahapPeringatan(mulai, menit(60)) === 60 && tahapPeringatan(mulai, menit(31)) === 60
        && tahapPeringatan(mulai, menit(30)) === 30 && tahapPeringatan(mulai, menit(16)) === 30 && tahapPeringatan(mulai, menit(15)) === 15
        && tahapPeringatan(mulai, menit(1)) === 15 && tahapPeringatan(mulai, m) === 0 && tahapPeringatan(mulai, m + 1) === 0,
        "the three notices and the start do not fall at T-60, T-30, T-15 and T=0");
      c.expect(tahapPeringatan(mulai, menit(20), -10 * 60_000) === 30, "a browser clock that is off is not corrected by the database's");
      c.expect(menitTersisa(mulai, menit(14.5)) === 15 && menitTersisa(mulai, m - 1000) === 1, "the minutes shown are not rounded up");
      c.expect(tahapBerikutMs(mulai, menit(45)) === 15 * 60_000 && tahapBerikutMs(mulai, menit(20)) === 5 * 60_000
        && tahapBerikutMs(mulai, menit(10)) === 10 * 60_000 && tahapBerikutMs(mulai, m) === null, "the next notice is not timed to its moment");
      // WIB, both ways
      c.expect(jamWib("2026-10-05T15:00:00Z") === "22.00" || jamWib("2026-10-05T15:00:00Z") === "22:00", `22.00 WIB reads ${jamWib("2026-10-05T15:00:00Z")}`);
      c.expect(waktuWib("2026-10-05T22:00") === "2026-10-05T15:00:00.000Z" && waktuWib("") === null && waktuWib("22:00") === null, "a typed time is not read as WIB");
      // the paths that still answer, and the assessment surface
      c.expect(jalurSaatPemeliharaan(HALAMAN_PEMELIHARAAN) && jalurSaatPemeliharaan("/keluar") && !jalurSaatPemeliharaan("/belajar"), "the paths a stopped reader keeps are wrong");
      c.expect(permukaanAsesmen("/belajar/asesmen/abc") && !permukaanAsesmen("/belajar"), "the assessment surface is not recognised");
      c.expect(KONFIRMASI_HENTIKAN === "HENTIKAN SEKARANG", "the typed phrase is not «HENTIKAN SEKARANG»");
      // the action results: PR110 by DETAIL only, PT503 as a window that stops the reader
      for (const k of KODE_PEMELIHARAAN.filter((x) => x !== "MAINTENANCE_ACTIVE")) {
        c.expect(kodeGalat({ code: "PR110", details: k }) === k, `PR110 ${k} is not read as itself`);
      }
      c.expect(kodeGalat({ code: "PR110", details: "X" }) === "ACTION_FAILED" && kodeGalat({ code: "PT503", message: "PINTAR_PEMELIHARAAN" }) === "MAINTENANCE_ACTIVE",
        "an unknown PR110 is trusted, or PT503 is not a window");
      const hasil = [...KODE_PEMELIHARAAN, "MAINTENANCE_SCHEDULED", "MAINTENANCE_STARTED", "MAINTENANCE_ENDED", "MAINTENANCE_STOPPED", "NOTICE_PUBLISHED", "NOTICE_WITHDRAWN"];
      for (const k of hasil) for (const locale of LOCALES) {
        const kal = t(kunciKode(k), "staff", { locale });
        c.expect(kunciKode(k) !== "galat.action_failed" && kal.length > 8 && !/MAINTENANCE_|NOTICE_|PR110/.test(kal), `(${locale}) ${k} has no sentence of its own`);
      }
      // every new line in both languages, none promising a message PINTAR does not send
      const hle = readFileSync(join(process.cwd(), "src", "lib", "hle.ts"), "utf8");
      const kunci = [...hle.matchAll(/^ {2}"((?:pemeliharaan\.|config\.pemeliharaan\.|config\.section\.pemeliharaan)[a-zA-Z0-9_.]*)": \{/gm)].map((x) => x[1]);
      c.expect(kunci.length >= 60, `${kunci.length} copy keys found`);
      for (const k of kunci) for (const locale of LOCALES) {
        const kal = t(k as HleEvent, k.startsWith("config.") ? "staff" : "learner", { locale });
        c.expect(kal.trim().length > 0 && !/email|notifikasi|SMS|WhatsApp|akan diberi tahu|will be told/i.test(kal), `${k} (${locale}): «${kal}»`);
      }
      return c.verdict("the contract executes: the status is read back dropping any row of the wrong shape, an emergency first; PT503 is read " +
        "as PLANNED or EMERGENCY and nothing else is; the browser's notices fall at T-60, T-30, T-15 and T=0 against the database's " +
        "clock, its minutes rounded up and its next moment timed; times are WIB both ways; a stopped reader keeps /pemeliharaan and " +
        "/keluar; PR110's seven codes are read by DETAIL only and PT503 as MAINTENANCE_ACTIVE, each result with its own sentence in both " +
        "languages; every new line of the copy table is in both languages and promises no message PINTAR does not send");
    },
  },
  {
    id: "M148-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => readFileSync(join(repoRoot, ...p), "utf8");
      const proxy = baca("src", "proxy.ts");
      c.expect(/const henti = galatPemeliharaan\(error\);\s*if \(henti && !jalurSaatPemeliharaan\(path\)\)/.test(proxy)
        && /NextResponse\.redirect\(new URL\(HALAMAN_PEMELIHARAAN, request\.url\)\)/.test(proxy) && /status: 503/.test(proxy),
        "the proxy does not send a stopped page to /pemeliharaan and refuse the rest 503");
      c.expect(/<PitaPemeliharaan locale=\{locale\} \/>/.test(baca("src", "app", "layout.tsx")), "the root layout does not carry the maintenance line");
      const pita = baca("src", "components", "pemeliharaan", "PengingatPemeliharaan.tsx");
      c.expect(!/fetch\(|\.rpc\(|supabase/i.test(pita.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")) && /tahapBerikutMs\(/.test(pita)
        && /window\.location\.replace\(HALAMAN_PEMELIHARAAN\)/.test(pita) && /!jendela\.berjalan && !jendela\.menguasai/.test(pita)
        && /permukaanAsesmen\(path\)/.test(pita), "the browser asks the server again, does not time the notices itself, or sends a draining learner away at T=0");
      const lib = baca("src", "lib", "pemeliharaan.ts");
      c.expect(/rpc\("pintar_status_saya"\)/.test(lib) && /adalahCookieSesi/.test(lib), "the status is not one read, or is asked of nobody signed in");
      // a locked or ended session's refusal of the read is expected, not a failure to log (audit walk 37260826024)
      c.expect(/error\.code !== "PT423" && error\.code !== "PT401"/.test(lib), "a locked session's status read is logged as a failure");
      const aksiBelajar = baca("src", "app", "belajar", "actions.ts");
      c.expect(/err\.code === "PR110" && err\.detail === "MAINTENANCE_NO_NEW_START"\) redirect\(`\$\{HALAMAN_PEMELIHARAAN\}\?mulai=ditolak`\)/.test(aksiBelajar),
        "a start refused before maintenance is shown as an error rather than explained");
      const halaman = baca("src", "app", "pemeliharaan", "page.tsx");
      c.expect(/status\.terhenti === "EMERGENCY"/.test(halaman) && /pemeliharaan\.darurat\.asesmen/.test(halaman) && /w\.terkumpul/.test(halaman)
        && /mulai === "ditolak"/.test(halaman) && /action="\/keluar" method="post"/.test(halaman),
        "the maintenance page does not tell planned from emergency, acknowledge a handed-in sitting, explain a refused start, or offer leaving");
      const konf = baca("src", "app", "konfigurasi", "page.tsx");
      c.expect(/<section id="pemeliharaan"/.test(konf) && /rpc\("maintenance_collisions"/.test(konf) && /action=\{jadwalkanPemeliharaanAction\}/.test(konf)
        && /\{platformIni \? \(\s*<section[^>]*data-hentikan="1"/.test(konf) && /action=\{hentikanSekarangAction\}/.test(konf),
        "Konfigurasi does not check the window against the assessments before scheduling, or offers «Hentikan sekarang» beyond Admin platform");
      // the schools a window or notice may name are the school picker's own (sekolahDitawarkan): never the national library
      const bagian148 = konf.slice(konf.indexOf('<section id="pemeliharaan"'), konf.indexOf("</section>", konf.indexOf('data-hentikan="1"')));
      c.expect((bagian148.match(/sekolahKu\.map\(/g) ?? []).length === 3 && !/myInstitutions/.test(bagian148),
        "the maintenance section offers schools beyond the school picker's own, the national library among them");
      const aksi = baca("src", "app", "konfigurasi", "actions.ts");
      for (const fn of ["schedule_maintenance", "change_maintenance", "stop_pintar_now", "publish_notice", "withdraw_notice"]) {
        c.expect(new RegExp(`rpc\\("${fn}"`).test(aksi), `${fn} is not one database call`);
      }
      const mig = baca(MIGRASI);
      c.expect(/if v_jalur not in \('\/rpc\/pintar_status_saya', '\/rpc\/sesi_akhiri_saya'\) then\s*v_blok := public\.maintenance_block_for_me\(\);/.test(mig)
        && /errcode = 'PT503', message = 'PINTAR_DIHENTIKAN'/.test(mig) && /errcode = 'PT503', message = 'PINTAR_PEMELIHARAAN'/.test(mig)
        && /raise exception using errcode = 'PT423', message = 'SESI_TERKUNCI'/.test(mig),
        "the pre-request does not check maintenance first, let only the status read and leaving through, or lost the lock");
      c.expect(/before insert on public\.assessment_sessions/.test(mig) && /in \('MENJELANG', 'AKTIF'\)/.test(mig), "no new sitting is refused from T-15 on the insert itself");
      return c.verdict("the source: the proxy sends a page the window stops to /pemeliharaan and refuses anything else 503; the root layout " +
        "reads pintar_status_saya once (nobody signed in asks nothing) and the browser times the notices itself, sending a reader the " +
        "window stops to /pemeliharaan at T=0 but never a draining learner or the window's admin; a start refused in the last 15 minutes " +
        "lands on the maintenance page; that page tells planned from emergency, acknowledges a handed-in sitting, explains a refused start " +
        "and offers Keluar; Konfigurasi asks maintenance_collisions before the schedule form and offers «Hentikan sekarang» to Admin " +
        "platform only; each control is one database call; migration 20261120100000's pre-request checks maintenance first, lets only " +
        "pintar_status_saya and sesi_akhiri_saya through, keeps the lock, and the insert itself refuses a new sitting from T-15");
    },
  },
  {
    id: "M148-D01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { v, galat } = jalankan(repoRoot, DB_RENCANA, "M148D01");
      if (!c.expect(v !== null, `the database half could not run: ${galat}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const x = v as Record<string, any>;
      c.expect(x.ada === true, "schedule_maintenance does not exist");
      c.expect(x.guru === "PR110:MAINTENANCE_NOT_ALLOWED" && x.admin_platform === "PR110:MAINTENANCE_NOT_ALLOWED" && x.admin_sekolah_lain === "PR110:MAINTENANCE_NOT_ALLOWED"
        && x.lalu === "PR110:MAINTENANCE_INPUT_INVALID" && x.tanpa_alasan === "PR110:MAINTENANCE_INPUT_INVALID" && x.baca_langsung === "42501",
        `who may schedule: ${JSON.stringify([x.guru, x.admin_platform, x.admin_sekolah_lain, x.lalu, x.tanpa_alasan, x.baca_langsung])}`);
      c.expect(typeof x.tabrakan?.asesmen === "number", `the collision check: ${JSON.stringify(x.tabrakan)}`);
      c.expect(x.t20?.keadaan === "TERJADWAL" && x.t20?.pengumuman === 1 && x.t20?.mulai_baru === "OK" && x.t20?.pintu === "LEWAT" && x.t20?.lain === 0,
        `T-20: ${JSON.stringify(x.t20)}`);
      c.expect(x.t10?.keadaan === "MENJELANG" && x.t10?.mulai_baru === "PR110:MAINTENANCE_NO_NEW_START" && x.t10?.pintu === "LEWAT", `T-10: ${JSON.stringify(x.t10)}`);
      const n = x.t0 ?? {};
      c.expect(n.murid_b === "PT503:PINTAR_PEMELIHARAAN" && n.guru === "PT503:PINTAR_PEMELIHARAAN" && n.murid_b_periksa === "PT503:PINTAR_PEMELIHARAAN"
        && n.murid_b_status === "LEWAT" && n.murid_b_keluar === "LEWAT" && n.terhenti === "PLANNED" && n.keadaan === "AKTIF",
        `T=0, the school's people: ${JSON.stringify(n)}`);
      c.expect(n.murid_a === "LEWAT" && n.murid_a_berjalan === "true" && n.murid_a_baru === "PR110:MAINTENANCE_NO_NEW_START",
        `T=0, the learner whose sitting is running: ${JSON.stringify([n.murid_a, n.murid_a_berjalan, n.murid_a_baru])}`);
      c.expect(n.admin === "LEWAT" && n.admin_menguasai === "true" && n.sekolah_lain === "LEWAT", `T=0, its admin and another school: ${JSON.stringify([n.admin, n.admin_menguasai, n.sekolah_lain])}`);
      c.expect(x.kumpul === "SUBMITTED" && x.sesi === "SUBMITTED" && x.setelah_kumpul === "PT503:PINTAR_PEMELIHARAAN" && x.terkumpul === true,
        `the drain: handed in ${x.kumpul} (${x.sesi}), then ${x.setelah_kumpul}, acknowledged ${x.terkumpul}`);
      c.expect(x.akhiri_guru === "PR110:MAINTENANCE_NOT_ALLOWED" && x.akhiri_tanpa_alasan === "PR110:MAINTENANCE_INPUT_INVALID" && x.akhiri === "BERAKHIR"
        && x.akhiri_lagi === "PR110:MAINTENANCE_NOT_OPEN" && x.setelah_akhir === "LEWAT" && x.pengumuman_akhir === 0,
        `ending it: ${JSON.stringify([x.akhiri_guru, x.akhiri_tanpa_alasan, x.akhiri, x.akhiri_lagi, x.setelah_akhir, x.pengumuman_akhir])}`);
      c.expect(x.jam_berakhir === "LEWAT" && x.jam_status === 0, `ended by the clock: ${x.jam_berakhir}, ${x.jam_status} window(s) still told`);
      c.expect(x.pengumuman_lain_sekolah === "PR110:MAINTENANCE_NOT_ALLOWED" && x.pengumuman?.murid === 1 && x.pengumuman?.lain === 0 && x.pengumuman_ditarik === 0,
        `the notice: ${JSON.stringify([x.pengumuman_lain_sekolah, x.pengumuman, x.pengumuman_ditarik])}`);
      const a = x.audit ?? {};
      c.expect(a["maintenance.scheduled"] === 2 && a["maintenance.activated"] === 2 && a["maintenance.deactivated"] === 1 && a["maintenance.ended_now"] === 1
        && a["notice.published"] === 1 && a["notice.withdrawn"] === 1 && x.sistem === true && x.peralihan === true && x.alasan_akhir === "Pembaruan selesai",
        `the audit: ${JSON.stringify(a)}, SYSTEM ${x.sistem}, transitions ${x.peralihan}, reason «${x.alasan_akhir}»`);
      return c.verdict("migration 20261120100000, planned maintenance, against the database and rolled back: a Guru, a school admin for the " +
        "platform or another school are refused, as are a start in the past and no reason, and no client reads the windows; the school's " +
        "admin schedules it with its notice and is told what it would meet; at T-20 the school is told and may still start a sitting; from " +
        "T-15 a new sitting is refused (PR110 MAINTENANCE_NO_NEW_START) while requests pass; at T=0 the school's learners, Guru and the " +
        "session check are refused PT503 PINTAR_PEMELIHARAAN, the status read and leaving pass; the learner already sitting drains (their " +
        "requests pass, no new sitting) and hands in (SUBMITTED), after which they too are stopped and told it was received; the window's " +
        "admin and another school's people pass; a Guru cannot end it, its admin ends it with a reason (BERAKHIR, notice withdrawn) and " +
        "everyone passes; a window ended by the clock stops nobody; a notice reaches its school only and goes when withdrawn; audit_log holds " +
        "each step with from and to states, the automatic start and end as SYSTEM with no person");
    },
  },
  {
    id: "M148-D02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { v, galat } = jalankan(repoRoot, DB_DARURAT, "M148D02");
      if (!c.expect(v !== null, `the database half could not run: ${galat}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const x = v as Record<string, any>;
      c.expect(x.admin_sekolah === "PR110:MAINTENANCE_NOT_ALLOWED" && x.frasa_salah === "PR110:MAINTENANCE_CONFIRMATION" && x.tanpa_alasan === "PR110:MAINTENANCE_CONFIRMATION",
        `who may stop PINTAR: ${JSON.stringify([x.admin_sekolah, x.frasa_salah, x.tanpa_alasan])}`);
      const h = x.henti ?? {};
      c.expect(h.murid_a === "PT503:PINTAR_DIHENTIKAN" && h.murid_a_kumpul === "PT503:PINTAR_DIHENTIKAN" && h.murid_b === "PT503:PINTAR_DIHENTIKAN"
        && h.admin_sekolah === "PT503:PINTAR_DIHENTIKAN", `at once, the school and the running sitting: ${JSON.stringify(h)}`);
      c.expect(h.murid_a_status === "LEWAT" && h.murid_a_keluar === "LEWAT" && h.terhenti === "EMERGENCY" && h.jenis === "EMERGENCY",
        `told the truth: ${JSON.stringify([h.murid_a_status, h.murid_a_keluar, h.terhenti, h.jenis])}`);
      c.expect(h.platform === "LEWAT" && h.sekolah_lain === "LEWAT" && h.mulai_baru === "PR110:MAINTENANCE_NO_NEW_START",
        `Admin platform, another school, a new sitting: ${JSON.stringify([h.platform, h.sekolah_lain, h.mulai_baru])}`);
      const s = x.sesi ?? {};
      c.expect(s.sebelum === "IN_PROGRESS" && s.sesudah === "IN_PROGRESS" && s.dikumpulkan === false && s.jawaban === true,
        `the sitting, untouched: ${JSON.stringify(s)}`);
      c.expect(x.akhiri_admin_sekolah === "PR110:MAINTENANCE_NOT_ALLOWED" && x.akhiri === "BERAKHIR" && x.setelah === "LEWAT"
        && x.sesi_setelah === "IN_PROGRESS" && x.jawaban_setelah === true,
        `ending it: ${JSON.stringify([x.akhiri_admin_sekolah, x.akhiri, x.setelah, x.sesi_setelah, x.jawaban_setelah])}`);
      c.expect(x.audit?.["maintenance.emergency_stop"] === 1 && x.audit?.["maintenance.ended_now"] === 1 && x.alasan === "Insiden keamanan pada penyimpanan" && x.pelaku === true,
        `the audit: ${JSON.stringify(x.audit)}, «${x.alasan}», by Admin platform ${x.pelaku}`);
      return c.verdict("migration 20261120100000, the emergency interruption, against the database and rolled back: a school admin is " +
        "refused, a wrong phrase or no reason MAINTENANCE_CONFIRMATION; Admin platform's «Hentikan sekarang» stops the school at once, " +
        "the learner mid-assessment (answering and handing in) and the school's admin included, PT503 PINTAR_DIHENTIKAN, while the " +
        "status read and leaving pass and say EMERGENCY; Admin platform and another school pass and no new sitting starts; the running " +
        "sitting is left IN_PROGRESS, not handed in or finalised, its received answer kept; a school admin cannot end it, Admin platform " +
        "ends it and the learner carries on the same sitting; audit_log holds the stop with its reason and actor, and the end");
    },
  },
];

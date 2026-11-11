/**
 * A1 · SITTING CONTROL, the database half (docs/completion-4.1/batches/A1-COMPLETION.md, «Pre-build review: outcome»;
 * O41-16, O41-17, O41-20; migration 20270114100000). The seeded learning-cycle school (its Kelas, its Pemetaan Awal with
 * one attempt and its Uji Penguasaan) with people of this suite's own; real sittings through start_learning_session
 * and record_answer. Every scenario is one transaction, rolled back.
 *
 *   A1-K01  reads the source: every code pengerjaan_tolak raises is a signed-in caller's (src/lib/pengerjaan-kontrak.ts,
 *           each with its sentence in Indonesian and English) or the scheduler's own; CAN_MANAGE_SITTINGS is the
 *           teacher's, the head's and the school admin's; one function writes EXPIRED and the lazy check and the
 *           scheduled entry point both call it; no extension is enabled and nothing is scheduled.
 *   A1-S01  the capability and extra time: the class's teacher, the head of department and the school admin give extra
 *           time (audited, bounded); another class's teacher, the learner and a platform admin are refused; a teacher
 *           cannot end a sitting for an integrity cause, a holder of CAN_REVIEW_INTEGRITY still can; a
 *           professional-learning sitting is unchanged.
 *   A1-S02  the teacher ends one sitting. SCORED: FINALIZED through the existing scoring, one ordinary result, the
 *           teacher and the reason recorded, an attempt. NOT_COUNTED: ADMINISTRATIVE_TERMINATION, answers kept, no
 *           result, not an attempt. Another class's teacher is refused; an ended sitting answers SITTING_ALREADY_ENDED;
 *           no TERMINATED sitting has a result; the learner's side is told which ending it was.
 *   A1-S03  an abandoned sitting (O41-20): past its deadline it ends with a result and the DEADLINE marking, identically
 *           by the lazy check and by the scheduled entry point; answers and timestamps kept; one attempt used; inside the
 *           late-sync window it is ended and not yet scored; an EXPIRED sitting from before the rule is untouched; a
 *           sitting with no deadline ends when its window closes and stays open while there is neither.
 *   A1-S04  a held sitting (O41-17): written by tangguhkan_akun in its transaction with the remaining time; answers,
 *           a hand-in and extra time refused; skipped by both ending paths; unchanged when the suspension is lifted;
 *           resumed by the class's teacher with exactly the stored remaining time, a closed window notwithstanding; or
 *           closed as not counted.
 *   A1-S05  another attempt (O41-16): a request grants nothing; the requester, the learner, a platform admin and anyone
 *           without CAN_REVIEW_INTEGRITY over the place cannot decide it; an approval gives one more start, marked,
 *           and leaves the earlier sitting, its result and its answers byte-identical; a decline needs a reason.
 *   A1-S06  the window: changed by the class's teacher with a reason, audited with before and after; an open sitting
 *           keeps its deadline; an ended assignment is not reopened.
 *   A1-S07  the reads: the teacher's list says each learner's state (not started, open, held, handed in, ended scored,
 *           ended not counted, ended by deadline) with no score; the learner reads how their own sitting ended and
 *           never why.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";
import { KODE_PENGERJAAN, KODE_PENGERJAAN_DB, kodePengerjaanDariGalat, kunciKodePengerjaan } from "../src/lib/pengerjaan-kontrak";
import { TANGGUNG_JAWAB, kunciTanggungJawab } from "../src/lib/staf-kontrak";

const MIGRASI = "supabase/migrations/20270114100000_a_sitting_is_managed_where_it_was_given.sql";
const ALASAN = "uji A1: alasan yang cukup panjang";

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}

/** The helpers every scenario stands on (role switches, the cycle fixture, a learner's answers, a user with a role). */
function siapkan(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable03.sql", "fable06.sql", "fable09.sql", "fable11.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}

// ------------------------------------------------------------------ the scenario's own language
const q = (s: string) => `$q$${s}$q$`;
/** An id the world recorded: a1.<name> (people are u_<name> and p_<name>, sittings s_<name>). */
const G = (k: string) => `current_setting('a1.${k}')::uuid`;
/** One probe: as the person `siapa` (the database owner, with no signed-in actor, when null) run `sql`; kept. */
const langkah = (k: string, siapa: string | null, sql: string) =>
  `v := v || jsonb_build_object('${k}', pg_temp.a1(${siapa ? G(`u_${siapa}`) : "null"}, ${q(sql)}));`;
/** A learner of the class, by name. */
const murid = (nama: string) => `perform pg_temp.a1_murid('${nama}');`;
/** That learner starts an assessment and answers its first `n` questions correctly. */
const mulai = (nama: string, aa: "aa_pre" | "aa_post", n: number) => `perform pg_temp.a1_mulai('${nama}', ${G(aa)}, ${n});`;
/** A fixture's own correction of a clock or a state, past the guards (the harness, never a product path). */
const paksa = (sql: string) => `set local session_replication_role = replica; execute ${q(sql)}; set local session_replication_role = origin;`;
/** The learner's next answer to the last question of a sitting. */
const jawab = (sesi: string, seq: number) => {
  const pi = `(select p.id from public.presented_items p where p.session_id = ${G(sesi)} order by p.position desc limit 1)`;
  return `select x.outcome from public.record_answer(${pi}, ${seq}, selftest.f09_answer(${pi}, true)) x`;
};
const boleh = (_nama: string, aa = "aa_pre") => `select m.reason from public.may_start_assessment(${G(aa)}) m`;
const sidikJawaban = (sesi: string) =>
  `(select md5(coalesce(string_agg(to_jsonb(r)::text, '|' order by r.id), '')) from public.responses r where r.session_id = ${G(sesi)})`;
const hasil = (sesi: string) => `(select count(*) from public.assessment_results r where r.session_id = ${G(sesi)})`;

/**
 * pg_temp.a1 answers «ok:<value>» or «<SQLSTATE>:<DETAIL, or the message's first 70 characters>». The world: the seeded
 * cycle's Kelas (a1.kelas) and a sibling Kelas B; guru_a (EDUCATOR over the Kelas), guru_b (EDUCATOR over Kelas B),
 * kadep and kadep2 (HEAD_OF_DEPARTMENT over the Angkatan), kadep_b (HEAD_OF_DEPARTMENT over Kelas B), admin
 * (INSTITUTION_ADMIN of the school), sys (SYSTEM_ADMIN).
 */
function skenario(badan: string[]): string {
  return `
begin;
create function pg_temp.a1(p_uid uuid, p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text;
begin
  begin
    if p_uid is not null then perform selftest.as_user_uid(p_uid); else perform selftest.as_owner(); end if;
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 70));
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
create function pg_temp.a1_orang(p_nama text, p_role public.app_role, p_node uuid)
returns void language plpgsql as $f$
declare v_u uuid;
begin
  v_u := selftest.f11_user('a1-' || p_nama || '-' || current_setting('a1.tag') || '@local.invalid', p_role, p_node);
  perform set_config('a1.u_' || p_nama, v_u::text, true);
  perform set_config('a1.p_' || p_nama, (select a.person_id::text from public.accounts a where a.auth_user_id = v_u), true);
end $f$;
create function pg_temp.a1_dunia()
returns void language plpgsql as $f$
declare f record; v_k uuid; v_inst uuid; v_parent uuid; v_root uuid; v_kb uuid;
begin
  perform selftest.as_owner();
  perform set_config('a1.tag', to_char(clock_timestamp(), 'HH24MISSUS'), true);
  select * into f from selftest.cycle_fixture();
  if f.aa_pre is null or f.aa_post is null then raise exception 'the learning-cycle fixture is absent'; end if;
  select la.node_id, la.institution_id into v_k, v_inst from public.learning_assignments la where la.id = f.la;
  select n.parent_id into v_parent from public.org_nodes n where n.id = v_k;
  select o.id into v_root from public.org_nodes o where o.institution_id = v_inst and o.kind = 'INSTITUTION';
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  select n.institution_id, n.parent_id, 'CLASS', 'Kelas A1 B ' || current_setting('a1.tag'), n.academic_period_id
    from public.org_nodes n where n.id = v_k returning id into v_kb;
  perform set_config('a1.la', f.la::text, true);
  perform set_config('a1.aa_pre', f.aa_pre::text, true);
  perform set_config('a1.aa_post', f.aa_post::text, true);
  perform set_config('a1.kelas', v_k::text, true);
  perform set_config('a1.kelas_b', v_kb::text, true);
  perform set_config('a1.inst', v_inst::text, true);
  perform pg_temp.a1_orang('guru_a', 'EDUCATOR', v_k);
  perform pg_temp.a1_orang('guru_b', 'EDUCATOR', v_kb);
  perform pg_temp.a1_orang('kadep', 'HEAD_OF_DEPARTMENT', v_parent);
  perform pg_temp.a1_orang('kadep2', 'HEAD_OF_DEPARTMENT', v_parent);
  perform pg_temp.a1_orang('kadep_b', 'HEAD_OF_DEPARTMENT', v_kb);
  perform pg_temp.a1_orang('admin', 'INSTITUTION_ADMIN', v_root);
  perform pg_temp.a1_orang('sys', 'SYSTEM_ADMIN', null);
end $f$;
create function pg_temp.a1_murid(p_nama text)
returns void language plpgsql as $f$
declare v_u uuid; v_p uuid; v_e uuid; v_k uuid := current_setting('a1.kelas')::uuid;
begin
  perform selftest.as_owner();
  v_u := selftest.f06p10_person('a1-murid-' || p_nama || '-' || current_setting('a1.tag'));
  select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE'
    from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
   where mm.node_id = v_k and mm.valid_to is null limit 1
  returning id into v_e;
  if v_e is null then raise exception 'the fixture Kelas has no learner to enrol beside'; end if;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  select v_e, v_k, e.academic_period_id from public.enrollments e where e.id = v_e;
  perform set_config('a1.u_' || p_nama, v_u::text, true);
  perform set_config('a1.p_' || p_nama, v_p::text, true);
end $f$;
create function pg_temp.a1_mulai(p_nama text, p_aa uuid, p_jawab int)
returns void language plpgsql as $f$
declare v_s uuid; r record;
begin
  perform selftest.as_user_uid(current_setting('a1.u_' || p_nama)::uuid);
  v_s := public.start_learning_session(p_aa);
  for r in select p.id from public.presented_items p where p.session_id = v_s order by p.position limit p_jawab loop
    perform public.record_answer(r.id, 1, selftest.f09_answer(r.id, true));
  end loop;
  perform selftest.as_owner();
  perform set_config('a1.s_' || p_nama, v_s::text, true);
end $f$;
create temp table a1_snap (v jsonb) on commit drop;
do $a1$
declare v jsonb := '{}'::jsonb; v_x text;
begin
  perform pg_temp.a1_dunia();
  ${badan.join("\n  ")}
  perform selftest.as_owner();
  insert into a1_snap values (v);
end $a1$;
select 'A1' || chr(9) || v::text from a1_snap;
rollback;
`;
}

function jalankan(c: Checks, repoRoot: string, badan: string[]): Record<string, string> | null {
  const gagal = siapkan(repoRoot);
  if (!c.expect(gagal === null, gagal ?? "")) return null;
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skenario(badan), db()], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
  if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return null;
  for (const l of r.stdout.split("\n")) {
    const [k, v] = l.split("\t");
    if (k === "A1" && v) return JSON.parse(v) as Record<string, string>;
  }
  c.expect(false, "the database half returned no snapshot");
  return null;
}

const TAK_BOLEH = "PR170:SITTING_NOT_ALLOWED";
const tambah = (sesi: string, menit = 10, alasan = ALASAN) => `select public.tambah_waktu_pengerjaan(${G(sesi)}, ${menit}, '${alasan}') ->> 'ok'`;
const akhiri = (sesi: string, cara: string, alasan = ALASAN) => `select public.akhiri_pengerjaan(${G(sesi)}, '${cara}', '${alasan}') ->> 'status'`;
const audit = (aksi: string, sesi: string, lagi = "true") =>
  `select count(*) from public.audit_log l where l.action = '${aksi}' and l.target_id = (${G(sesi)})::text and ${lagi}`;
const jadwal = `select public.pengerjaan_tutup_terjadwal(1000) ->> 'ok'`;
const sesiRingkas = (sesi: string) =>
  `select s.status::text || '|' || coalesce(s.closure_kind, '-') || '|' || coalesce(s.termination_cause::text, '-') || '|' || ${hasil(sesi)}
     from public.assessment_sessions s where s.id = ${G(sesi)}`;

export const a1Tests: SelfTest[] = [
  {
    id: "A1-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let sql = "";
      try { sql = readFileSync(join(repoRoot, MIGRASI), "utf8"); } catch { sql = ""; }
      if (!c.expect(sql.length > 0, `${MIGRASI} does not exist`)) return c.verdict("");
      const tolak = /create or replace function public\.pengerjaan_tolak[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      const kode = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((x) => x[1]);
      c.expect(kode.length >= 20, `pengerjaan_tolak names ${kode.length} code(s)`);
      const dipakai = new Set([...sql.matchAll(/pengerjaan_tolak\('([A-Z_]+)'\)/g)].map((x) => x[1]));
      for (const k of dipakai) c.expect(kode.includes(k), `${k} is raised without a message of its own`);
      for (const k of kode) {
        c.expect((KODE_PENGERJAAN_DB as readonly string[]).includes(k) || k === "SITTING_JOB_NOT_SERVICE", `the database raises ${k}, which the screens' contract does not know`);
        if (k !== "SITTING_JOB_NOT_SERVICE") c.expect(dipakai.has(k) || /SITTING_(PROFESSIONAL|NOT_ALLOWED)/.test(k), `${k} has a message and is raised nowhere`);
      }
      for (const k of KODE_PENGERJAAN_DB) c.expect(kode.includes(k), `the contract names ${k}, which the database does not raise`);
      for (const k of KODE_PENGERJAAN) {
        const id = t(kunciKodePengerjaan(k), "staff"), en = t(kunciKodePengerjaan(k), "staff", { locale: "en" });
        c.expect(id.length > 10 && en.length > 10 && id !== en, `${k} has no sentence in both languages («${id}» / «${en}»)`);
        c.expect(!/ditangguhkan|suspend/i.test(id) || k === "SITTING_LEARNER_SUSPENDED", `${k} says «ditangguhkan» of a sitting (it is held: «ditahan»)`);
      }
      c.expect(kodePengerjaanDariGalat({ code: "PR170", details: "SITTING_ALREADY_ENDED" }) === "SITTING_ALREADY_ENDED"
        && kodePengerjaanDariGalat({ code: "PR170", details: "SITTING_JOB_NOT_SERVICE" }) === "SITTING_FAILED"
        && kodePengerjaanDariGalat({ code: "PR160", details: "SITTING_FROZEN" }) === "SITTING_FAILED" && kodePengerjaanDariGalat(null) === "SITTING_FAILED",
        "a refusal is not read by its PR170 DETAIL alone");
      // the capability: the teacher's, the head's and the school admin's; the words the staff page says for it
      const peta = /CREATE OR REPLACE FUNCTION public\.role_capabilities[\s\S]*?\$function\$;/.exec(sql)?.[0] ?? "";
      const punya = (peran: string) => /CAN_MANAGE_SITTINGS/.test(new RegExp(`when '${peran}' then array\\[([^\\]]*)\\]`).exec(peta)?.[1] ?? "");
      c.expect(punya("EDUCATOR") && punya("HEAD_OF_DEPARTMENT") && punya("INSTITUTION_ADMIN") && !punya("SYSTEM_ADMIN") && !punya("DEAN") && !punya("STUDENT"),
        "CAN_MANAGE_SITTINGS is not held by exactly EDUCATOR, HEAD_OF_DEPARTMENT and INSTITUTION_ADMIN");
      c.expect(!/CAN_REVIEW_INTEGRITY/.test(new RegExp(`when 'EDUCATOR' then array\\[([^\\]]*)\\]`).exec(peta)?.[1] ?? "x CAN_REVIEW_INTEGRITY"), "a teacher holds integrity authority");
      c.expect((TANGGUNG_JAWAB as readonly string[]).includes("CAN_MANAGE_SITTINGS")
        && t(kunciTanggungJawab("CAN_MANAGE_SITTINGS"), "staff") !== t(kunciTanggungJawab("CAN_MANAGE_SITTINGS"), "staff", { locale: "en" }),
        "the staff page has no words for CAN_MANAGE_SITTINGS");
      // blocker 3: one function decides; the lazy check and the scheduled entry point both call it
      c.expect([...sql.matchAll(/set status = 'EXPIRED'/g)].length === 1
        && /create or replace function public\.pengerjaan_putus_tenggat[\s\S]*?set status = 'EXPIRED'[\s\S]*?end \$\$;/.test(sql), "EXPIRED is written by more than the one deciding function");
      const malas = /create or replace function public\.session_enforce_deadline[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      const terjadwal = /create or replace function public\.pengerjaan_tutup_terjadwal[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      c.expect(/return public\.pengerjaan_putus_tenggat\(p_session, true\);/.test(malas) && !/update /.test(malas), "the lazy check is not a call to the one deciding function");
      c.expect(/public\.pengerjaan_putus_tenggat\(s\.id, true\)/.test(terjadwal) && !/update /.test(terjadwal), "the scheduled entry point is not a call to the one deciding function");
      c.expect(/grant execute on function public\.pengerjaan_tutup_terjadwal\(integer\) to service_role;/.test(sql)
        && !/grant execute on function public\.pengerjaan_tutup_terjadwal\(integer\) to authenticated/.test(sql), "the scheduled entry point is not the service's alone");
      // the scheduler is held (pg_cron's own grants and tables break the recovery suite's proven profile; reported): this
      // migration enables no extension and schedules nothing, and the entry point waits for whatever calls it
      c.expect(!/create extension/i.test(sql) && !/cron\.schedule/i.test(sql), "the migration enables an extension or schedules a job");
      // the held state is the suspension's own transaction, and its own state (never PAUSED)
      const tangguh = /create or replace function public\.tangguhkan_akun[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      c.expect(/insert into public\.person_suspensions[\s\S]*pengerjaan_tahan_orang\(p_person, v_id\)/.test(tangguh), "tangguhkan_akun does not hold the person's sittings in its own transaction");
      c.expect(!/'PAUSED'\s*(where|,\s*frozen)/.test(sql) && !/set status = 'PAUSED'/.test(sql), "a held sitting is written as PAUSED");
      // every client entry is declared
      for (const f of ["tambah_waktu_pengerjaan", "akhiri_pengerjaan", "lanjutkan_pengerjaan", "tutup_pengerjaan_ditahan", "minta_percobaan",
        "putuskan_percobaan", "percobaan_antrean", "ubah_jadwal_penugasan", "daftar_pengerjaan", "pengerjaan_saya", "percobaan_saya"]) {
        c.expect(new RegExp(`\\('${f}', '(STAFF|LEARNER)'`).test(sql), `${f} is not declared in client_rpc_registry`);
        c.expect(new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon, authenticated;`).test(sql), `${f} is not revoked from public and anon`);
      }
      return c.verdict("every code pengerjaan_tolak raises is a signed-in caller's with its Indonesian and English sentence or the scheduler's own; "
        + "CAN_MANAGE_SITTINGS is the teacher's, the head's and the school admin's and has its words; EXPIRED is written by one function, which the lazy "
        + "check and the service-only scheduled entry point both call; no extension is enabled and nothing is scheduled; tangguhkan_akun holds the "
        + "person's sittings in its own transaction; every client entry is declared and revoked from the signed-out role");
    },
  },
  {
    id: "A1-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const akhiriIntegritas = (sesi: string, sebab: string) => `select public.terminate_session(${G(sesi)}, '${sebab}', '${ALASAN}')`;
      const pd = `
        declare v_c uuid; v_d uuid; v_r uuid; v_s uuid;
        begin
          perform selftest.as_owner();
          insert into public.courses (institution_id, subject, stage, grade_label, title, learning_context)
          values (${G("inst")}, 'Pengembangan Guru', 'SD', 'Guru', 'PD A1 ' || current_setting('a1.tag'), 'PROFESSIONAL_DEVELOPMENT') returning id into v_c;
          insert into public.assessment_definitions (institution_id, course_id, module_id, title, mode, bank_type, item_count)
          values (${G("inst")}, v_c, null, 'Asesmen PD A1 ' || current_setting('a1.tag'), 'POST_TEST', 'TEST', 1) returning id into v_d;
          insert into public.plp_releases (institution_id, course_id, version_label) values (${G("inst")}, v_c, '41.0.1') returning id into v_r;
          for i in 1..4 loop
            insert into public.assessment_sessions
              (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, plp_release_id,
               assessment_definition_id, assessment_definition_version, engine_version, scoring_policy_version, evidence_channel,
               evidence_class, mode, status, shuffle_seed, started_at, authoritative_deadline, deadline_extended_count)
            select gen_random_uuid(), x.person_id, x.institution_id, x.enrollment_id, x.academic_period_id, x.class_node_id, v_r, v_d, 1,
                   x.engine_version, x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode, 'CREATED', x.shuffle_seed,
                   now() - interval '5 minutes', now() + interval '1 hour', 0
              from public.assessment_sessions x where x.id = ${G("s_m1")} returning id into v_s;
            update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_s;
            perform set_config('a1.s_pd' || i, v_s::text, true);
          end loop;
        end;`;
      const L: string[] = [
        murid("m1"), mulai("m1", "aa_pre", 2), murid("m2"), mulai("m2", "aa_pre", 1),
        langkah("peta", null, `select ('CAN_MANAGE_SITTINGS' = any (public.role_capabilities('EDUCATOR')))::text || ('CAN_MANAGE_SITTINGS' = any (public.role_capabilities('HEAD_OF_DEPARTMENT')))::text
          || ('CAN_MANAGE_SITTINGS' = any (public.role_capabilities('INSTITUTION_ADMIN')))::text || ('CAN_MANAGE_SITTINGS' = any (public.role_capabilities('SYSTEM_ADMIN')))::text
          || ('CAN_MANAGE_SITTINGS' = any (public.role_capabilities('DEAN')))::text || ('CAN_REVIEW_INTEGRITY' = any (public.role_capabilities('EDUCATOR')))::text`),
        langkah("t0", null, `select set_config('a1.t0', s.authoritative_deadline::text, true) is not null from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        // ---- extra time: who may
        langkah("lain", "guru_b", tambah("s_m1")),
        langkah("murid", "m1", tambah("s_m1")),
        langkah("platform", "sys", tambah("s_m1")),
        langkah("lain_mentah", "guru_b", `select public.extend_session_deadline(${G("s_m1")}, 10, '${ALASAN}')`),
        langkah("platform_mentah", "sys", `select public.extend_session_deadline(${G("s_m1")}, 10, '${ALASAN}')`),
        langkah("pendek", "guru_a", tambah("s_m1", 10, "pendek")),
        langkah("menit", "guru_a", tambah("s_m1", 500)),
        langkah("belum", null, `select (s.authoritative_deadline = current_setting('a1.t0')::timestamptz)::text || ',' || s.deadline_extended_count from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("guru", "guru_a", tambah("s_m1", 10)),
        langkah("guru_cek", null, `select (s.authoritative_deadline = current_setting('a1.t0')::timestamptz + interval '10 minutes')::text || ',' || s.deadline_extended_count || ',' || s.status::text
           from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("guru_audit", null, audit("assessment_session.deadline_extended", "s_m1",
          `l.actor_person_id = ${G("p_guru_a")} and l.summary ->> 'reason' = '${ALASAN}' and (l.summary ->> 'minutes')::int = 10
           and (l.summary ->> 'old_deadline')::timestamptz = current_setting('a1.t0')::timestamptz
           and (l.summary ->> 'new_deadline')::timestamptz = current_setting('a1.t0')::timestamptz + interval '10 minutes'`)),
        langkah("kadep", "kadep", tambah("s_m1", 5)),
        langkah("admin", "admin", tambah("s_m1", 5)),
        langkah("batas", "guru_a", tambah("s_m1", 5)),
        // ---- a teacher never ends a sitting for an integrity cause; the reviewer still does
        ...["SECURITY_INTERVENTION", "AUTHORIZATION_REVOKED", "INSTITUTIONAL_REVOCATION", "ADMINISTRATIVE_TERMINATION"].map((s) => langkah(`integritas_${s}`, "guru_a", akhiriIntegritas("s_m1", s))),
        langkah("integritas_utuh", null, `select s.status::text from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("integritas_kadep", "kadep", akhiriIntegritas("s_m2", "SECURITY_INTERVENTION")),
        langkah("integritas_cek", null, `select s.status::text || '|' || s.termination_cause::text || '|' || coalesce(s.closure_kind, '-') from public.assessment_sessions s where s.id = ${G("s_m2")}`),
        // ---- a professional-learning sitting: unchanged
        pd,
        langkah("pd_guru", "guru_a", tambah("s_pd1")),
        langkah("pd_guru_mentah", "guru_a", `select public.extend_session_deadline(${G("s_pd1")}, 10, '${ALASAN}')`),
        langkah("pd_admin_akhiri", "admin", akhiri("s_pd1", "NOT_COUNTED")),
        langkah("pd_admin_integritas", "admin", akhiriIntegritas("s_pd1", "ADMINISTRATIVE_TERMINATION")),
        langkah("pd_sys_akhiri", "sys", akhiri("s_pd1", "SCORED")),
        langkah("pd_sys_minta", "sys", `select public.minta_percobaan(${G("s_pd1")}, '${ALASAN}') ->> 'ok'`),
        langkah("pd_sys_perpanjang", "sys", `select public.extend_session_deadline(${G("s_pd2")}, 10, '${ALASAN}') = now() + interval '70 minutes'`),
        langkah("pd_sys_integritas", "sys", akhiriIntegritas("s_pd3", "ADMINISTRATIVE_TERMINATION")),
        langkah("pd_utuh", null, `select s.status::text || '|' || coalesce(s.closure_kind, '-') from public.assessment_sessions s where s.id = ${G("s_pd1")}`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("peta", "ok:truetruetruefalsefalsefalse", "who holds CAN_MANAGE_SITTINGS (teacher, head, school admin; not platform admin, not dean) and a teacher's integrity authority");
      harap("lain", TAK_BOLEH, "another class's teacher giving extra time");
      harap("murid", TAK_BOLEH, "the learner giving themself extra time");
      harap("platform", TAK_BOLEH, "a platform admin giving extra time on an academic sitting");
      c.expect(/requires CAN_MANAGE_SITTINGS/.test(m.lain_mentah ?? ""), `another class's teacher on extend_session_deadline: ${m.lain_mentah}`);
      c.expect(/requires CAN_MANAGE_SITTINGS/.test(m.platform_mentah ?? ""), `a platform admin on extend_session_deadline, academic: ${m.platform_mentah}`);
      harap("pendek", "PR170:SITTING_REASON_REQUIRED", "extra time with a 6-character reason");
      harap("menit", "PR170:SITTING_MINUTES_INVALID", "extra time of 500 minutes");
      harap("belum", "ok:true,0", "the deadline after the refusals");
      harap("guru", "ok:true", "the class's teacher giving 10 minutes");
      harap("guru_cek", "ok:true,1,IN_PROGRESS", "the deadline after the teacher's 10 minutes");
      harap("guru_audit", "ok:1", "the extension's audit row (who, the reason, the minutes, before and after)");
      harap("kadep", "ok:true", "the head of department giving extra time");
      harap("admin", "ok:true", "the school admin giving extra time");
      harap("batas", "PR170:SITTING_EXTEND_LIMIT", "a fourth extension");
      for (const s of ["SECURITY_INTERVENTION", "AUTHORIZATION_REVOKED", "INSTITUTIONAL_REVOCATION", "ADMINISTRATIVE_TERMINATION"]) {
        c.expect(/requires CAN_REVIEW_INTEGRITY/.test(m[`integritas_${s}`] ?? ""), `the class's teacher ending a sitting as ${s} through terminate_session: ${m[`integritas_${s}`]}`);
      }
      harap("integritas_utuh", "ok:IN_PROGRESS", "the sitting after the teacher's refused integrity endings");
      harap("integritas_kadep", "ok:TERMINATED", "a holder of CAN_REVIEW_INTEGRITY ending a sitting for an integrity cause");
      harap("integritas_cek", "ok:TERMINATED|SECURITY_INTERVENTION|-", "the integrity ending as recorded");
      harap("pd_guru", TAK_BOLEH, "a teacher giving extra time on a professional-learning sitting");
      c.expect(/requires CAN_/.test(m.pd_guru_mentah ?? ""), `a teacher on extend_session_deadline, professional: ${m.pd_guru_mentah}`);
      harap("pd_admin_akhiri", TAK_BOLEH, "a school admin ending a professional-learning sitting");
      c.expect(/requires CAN_/.test(m.pd_admin_integritas ?? ""), `a school admin on terminate_session, professional: ${m.pd_admin_integritas}`);
      harap("pd_sys_akhiri", "PR170:SITTING_PROFESSIONAL", "the platform admin's scored ending of a professional-learning sitting (not offered)");
      harap("pd_sys_minta", "PR170:SITTING_PROFESSIONAL", "the platform admin requesting another attempt on a professional-learning sitting (not offered)");
      harap("pd_sys_perpanjang", "ok:true", "the platform admin extending a professional-learning sitting, as in 4.0");
      harap("pd_sys_integritas", "ok:TERMINATED", "the platform admin ending a professional-learning sitting, as in 4.0");
      harap("pd_utuh", "ok:IN_PROGRESS|-", "the professional-learning sitting after the refused acts");
      return c.verdict("CAN_MANAGE_SITTINGS is the teacher's, the head's and the school admin's: each gives extra time on the class's sitting (the deadline moves by the "
        + "minutes given, audited with who, the reason, before and after; three times at most); another class's teacher, the learner and a platform admin are refused; "
        + "a teacher is refused every cause of terminate_session and a holder of CAN_REVIEW_INTEGRITY still ends for an integrity cause; on a professional-learning "
        + "sitting no school role acts, the new acts are not offered, and the platform admin extends and ends it as in 4.0");
    },
  },
  {
    id: "A1-S02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const L: string[] = [
        murid("m1"), mulai("m1", "aa_pre", 3), murid("m2"), mulai("m2", "aa_pre", 2), murid("m3"), mulai("m3", "aa_pre", 0),
        murid("m4"), mulai("m4", "aa_pre", 5), murid("m5"), mulai("m5", "aa_pre", 1),
        langkah("sidik1", null, `select set_config('a1.j1', ${sidikJawaban("s_m1")}, true) is not null`),
        langkah("lain_dinilai", "guru_b", akhiri("s_m1", "SCORED")),
        langkah("lain_tidak", "guru_b", akhiri("s_m1", "NOT_COUNTED")),
        langkah("platform", "sys", akhiri("s_m1", "NOT_COUNTED")),
        langkah("murid", "m1", akhiri("s_m1", "SCORED")),
        langkah("cara", "guru_a", akhiri("s_m1", "LAIN")),
        langkah("pendek", "guru_a", akhiri("s_m1", "SCORED", "pendek")),
        langkah("utuh", null, sesiRingkas("s_m1")),
        // ---- scored: a hand-in on the learner's behalf
        langkah("dinilai", "guru_a", akhiri("s_m1", "SCORED")),
        langkah("dinilai_sesi", null, `select s.status::text || '|' || s.closure_kind || '|' || (s.closure_by_person_id = ${G("p_guru_a")}) || '|' || (s.closure_reason = '${ALASAN}') || '|'
            || (s.submitted_at is not null and s.finalized_at is not null) || '|' || (s.termination_cause is null and s.termination_reason is null)
           from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("dinilai_hasil", null, `select count(*) || '|' || min(r.delta_inputs ->> 'answered') || '|' || min(r.delta_inputs ->> 'item_total') || '|'
            || bool_and(r.supersedes_result_id is null and r.engine_version = public.engine_version() and r.mastery = (select e.mastery from public.evaluate_session(${G("s_m1")}) e))
           from public.assessment_results r where r.session_id = ${G("s_m1")}`),
        langkah("dinilai_jawaban", null, `select ${sidikJawaban("s_m1")} = current_setting('a1.j1')`),
        langkah("dinilai_audit", null, audit("assessment_session.handed_in_by_teacher", "s_m1",
          `l.actor_person_id = ${G("p_guru_a")} and l.summary ->> 'reason' = '${ALASAN}' and l.summary #>> '{from,status}' = 'IN_PROGRESS' and l.summary #>> '{to,status}' = 'FINALIZED'`)),
        langkah("dinilai_percobaan", "m1", boleh("m1")),
        langkah("dinilai_murid_jawab", "m1", jawab("s_m1", 2)),
        langkah("dinilai_murid_baca", "m1", `select public.pengerjaan_saya(${G("s_m1")}) ->> 'penutupan'`),
        // a sitting never begun, handed in on the learner's behalf: nothing answered, and scored so
        langkah("kosong", "guru_a", akhiri("s_m3", "SCORED")),
        langkah("kosong_hasil", null, `select count(*) || '|' || min(r.delta_inputs ->> 'answered') from public.assessment_results r where r.session_id = ${G("s_m3")}`),
        // ---- not counted: the existing ADMINISTRATIVE_TERMINATION
        langkah("tidak", "guru_a", akhiri("s_m2", "NOT_COUNTED")),
        langkah("tidak_sesi", null, `select s.status::text || '|' || s.termination_cause::text || '|' || (s.termination_reason = '${ALASAN}') || '|' || (s.terminated_by_person_id = ${G("p_guru_a")}) || '|' || s.closure_kind
            || '|' || (select count(*) from public.responses r where r.session_id = s.id) || '|' || ${hasil("s_m2")}
           from public.assessment_sessions s where s.id = ${G("s_m2")}`),
        langkah("tidak_audit", null, audit("assessment_session.terminated", "s_m2",
          `l.actor_person_id = ${G("p_guru_a")} and l.summary ->> 'cause' = 'ADMINISTRATIVE_TERMINATION' and l.summary ->> 'reason' = '${ALASAN}' and l.summary ->> 'act' = 'teacher_not_counted'
           and (l.summary ->> 'responses_retained')::int = 2`)),
        langkah("tidak_percobaan", "m2", boleh("m2")),
        langkah("tidak_murid_serah", "m2", `select public.finish_my_session(${G("s_m2")}, null)`),
        langkah("tidak_murid_jawab", "m2", jawab("s_m2", 2)),
        // ---- the race: the sitting ended before the change was saved
        langkah("lagi", "guru_a", akhiri("s_m1", "NOT_COUNTED")),
        langkah("lagi_waktu", "guru_a", tambah("s_m2")),
        langkah("murid_selesai", "m4", `select public.finish_my_session(${G("s_m4")}, null) is not null`),
        langkah("sesudah_murid", "guru_a", akhiri("s_m4", "NOT_COUNTED")),
        langkah("sesudah_murid_cek", null, sesiRingkas("s_m4")),
        // a sitting past its deadline has ended by it; the teacher's choice does not replace that ending
        paksa(`update public.assessment_sessions set authoritative_deadline = now() - interval '1 hour' where id = ${G("s_m5")}`),
        langkah("lewat", "guru_a", akhiri("s_m5", "NOT_COUNTED")),
        langkah("lewat_jadwal", null, jadwal),
        langkah("lewat_cek", null, sesiRingkas("s_m5")),
        langkah("tak_ada_hasil", null, `select count(*) from public.assessment_sessions s join public.assessment_results r on r.session_id = s.id where s.status::text = 'TERMINATED'`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("lain_dinilai", TAK_BOLEH, "another class's teacher ending the sitting as scored");
      harap("lain_tidak", TAK_BOLEH, "another class's teacher ending the sitting as not counted");
      harap("platform", TAK_BOLEH, "a platform admin ending an academic sitting");
      harap("murid", TAK_BOLEH, "the learner ending their own sitting through the teacher's act");
      harap("cara", "PR170:SITTING_END_KIND_INVALID", "an ending that is neither scored nor not counted");
      harap("pendek", "PR170:SITTING_REASON_REQUIRED", "an ending with a 6-character reason");
      harap("utuh", "ok:IN_PROGRESS|-|-|0", "the sitting after the refusals");
      harap("dinilai", "ok:FINALIZED", "the class's teacher ending the sitting as scored");
      harap("dinilai_sesi", "ok:FINALIZED|TEACHER_SCORED|true|true|true|true", "the scored ending as recorded (FINALIZED, the teacher, the reason, handed in and finalised, no termination)");
      harap("dinilai_hasil", "ok:1|3|5|true", "the scored ending's result (one, ordinary, 3 of 5 answered, the mastery the scoring gives)");
      harap("dinilai_jawaban", "ok:true", "the answers after the scored ending (unchanged)");
      harap("dinilai_audit", "ok:1", "the scored ending's audit row");
      harap("dinilai_percobaan", "ok:ATTEMPT_LIMIT_REACHED", "a scored ending uses the attempt (limit 1)");
      harap("dinilai_murid_jawab", "PR002:SESSION_ENDED_SCORED", "the learner's next answer after a scored ending");
      harap("dinilai_murid_baca", "ok:TEACHER_SCORED", "the learner reading how their sitting ended");
      harap("kosong", "ok:FINALIZED", "a scored ending of a sitting with no answer");
      harap("kosong_hasil", "ok:1|0", "its result (nothing answered stays unanswered)");
      harap("tidak", "ok:TERMINATED", "the class's teacher ending the sitting as not counted");
      harap("tidak_sesi", "ok:TERMINATED|ADMINISTRATIVE_TERMINATION|true|true|TEACHER_NOT_COUNTED|2|0", "the not-counted ending as recorded (cause, reason, teacher, the 2 answers kept, no result)");
      harap("tidak_audit", "ok:1", "the not-counted ending's audit row");
      harap("tidak_percobaan", "ok:OK", "a not-counted ending is not an attempt (limit 1, the learner may start again)");
      harap("tidak_murid_serah", "PR003:SESSION_ENDED_NOT_COUNTED", "the learner's hand-in after a not-counted ending");
      harap("tidak_murid_jawab", "PR002:SESSION_ENDED_NOT_COUNTED", "the learner's next answer after a not-counted ending");
      harap("lagi", "PR170:SITTING_ALREADY_ENDED", "ending a sitting that has already ended");
      harap("lagi_waktu", "PR170:SITTING_ALREADY_ENDED", "extra time on a sitting that has ended");
      harap("murid_selesai", "ok:true", "the learner handing in");
      harap("sesudah_murid", "PR170:SITTING_ALREADY_ENDED", "the teacher's ending arriving after the learner handed in");
      harap("sesudah_murid_cek", "ok:FINALIZED|-|-|1", "the learner's own hand-in after the teacher's late ending (untouched, one result)");
      harap("lewat", "PR170:SITTING_ALREADY_ENDED", "the teacher ending a sitting whose deadline has passed");
      harap("lewat_cek", "ok:FINALIZED|DEADLINE|-|1", "that sitting once the ending rule ran (ended by its deadline, scored)");
      harap("tak_ada_hasil", "ok:0", "TERMINATED sittings that have a result");
      return c.verdict("the class's teacher ends one sitting and another class's teacher, the learner and a platform admin do not. Scored: SUBMITTED then FINALIZED by "
        + "finalize_session, one ordinary result on what was answered, the teacher and the reason recorded, audited, an attempt; not counted: TERMINATED as "
        + "ADMINISTRATIVE_TERMINATION, answers kept, no result, audited, not an attempt. An ended sitting answers SITTING_ALREADY_ENDED (a second ending, extra time, "
        + "the learner's hand-in arriving first, a passed deadline); the learner's side is answered SESSION_ENDED_SCORED or SESSION_ENDED_NOT_COUNTED; no "
        + "TERMINATED sitting has a result");
    },
  },
  {
    id: "A1-S03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const lewat = (sesi: string, selang = "1 hour") => `update public.assessment_sessions set authoritative_deadline = now() - interval '${selang}' where id = ${G(sesi)}`;
      const potret = (sesi: string) => `select s.status::text || '|' || coalesce(s.closure_kind, '-') || '|' || (s.closure_deadline = s.authoritative_deadline) || '|' || ${hasil(sesi)} || '|'
          || (select min(r.delta_inputs ->> 'answered') || '/' || min(r.delta_inputs ->> 'correct') || '/' || bool_and(r.mastery = (select e.mastery from public.evaluate_session(s.id) e))
                from public.assessment_results r where r.session_id = s.id) || '|'
          || (s.started_at = current_setting('a1.mulai_' || '${sesi}')::timestamptz) || '|' || (${sidikJawaban(sesi)} = current_setting('a1.j_' || '${sesi}')) || '|'
          || coalesce(s.termination_cause::text, '-') || '|' || (s.submitted_at is null) || '|' || (s.finalized_at is not null)
          || '|' || (${audit("assessment_session.ended_by_deadline", sesi, "l.summary ->> 'kind' = 'DEADLINE' and (l.summary ->> 'responses_retained')::int = 3")})
         from public.assessment_sessions s where s.id = ${G(sesi)}`;
      const simpan = (sesi: string) => langkah(`simpan_${sesi}`, null, `select set_config('a1.mulai_${sesi}', s.started_at::text, true) || set_config('a1.j_${sesi}', ${sidikJawaban(sesi)}, true) is not null
          from public.assessment_sessions s where s.id = ${G(sesi)}`);
      const L: string[] = [
        murid("m1"), mulai("m1", "aa_pre", 3), murid("m2"), mulai("m2", "aa_pre", 3), murid("m3"), mulai("m3", "aa_pre", 2),
        murid("m4"), mulai("m4", "aa_pre", 2), murid("m5"), mulai("m5", "aa_pre", 2), murid("m6"), mulai("m6", "aa_pre", 2),
        simpan("s_m1"), simpan("s_m2"),
        // the scheduled entry point is the service's: no signed-in caller reaches it
        langkah("jadwal_guru", "guru_a", jadwal),
        langkah("jadwal_sys", "sys", jadwal),
        // ---- past its deadline (beyond the late-sync window): the lazy check, and the scheduled entry point
        paksa(lewat("s_m1")), paksa(lewat("s_m2")),
        langkah("sebelum", null, sesiRingkas("s_m2")),
        langkah("malas", null, `select public.session_enforce_deadline(${G("s_m1")})`),
        langkah("jadwal", null, jadwal),
        langkah("potret_malas", null, potret("s_m1")),
        langkah("potret_jadwal", null, potret("s_m2")),
        langkah("percobaan", "m1", boleh("m1")),
        langkah("lagi", null, `select public.session_enforce_deadline(${G("s_m1")})::text || '|' || (public.pengerjaan_tutup_terjadwal(1000) ->> 'ok') || '|' || ${hasil("s_m1")}`),
        langkah("murid_baca", "m2", `select public.pengerjaan_saya(${G("s_m2")}) ->> 'penutupan'`),
        // ---- inside the late-sync window (120 s): ended and marked, scored only once the window has closed
        paksa(lewat("s_m6", "30 seconds")),
        langkah("tenggang", null, `select public.session_enforce_deadline(${G("s_m6")})`),
        langkah("tenggang_jadwal", null, jadwal),
        langkah("tenggang_cek", null, sesiRingkas("s_m6")),
        langkah("tenggang_nilai", null, `select public.finalize_session(${G("s_m6")})`),
        paksa(lewat("s_m6", "10 minutes")),
        langkah("tenggang_lewat", null, jadwal),
        langkah("tenggang_akhir", null, sesiRingkas("s_m6")),
        // ---- an EXPIRED sitting from before the rule: untouched by both paths
        paksa(lewat("s_m3", "2 days")),
        paksa(`update public.assessment_sessions set status = 'EXPIRED' where id = ${G("s_m3")}`),
        langkah("lama_sidik", null, `select set_config('a1.lama', md5(to_jsonb(s)::text), true) is not null from public.assessment_sessions s where s.id = ${G("s_m3")}`),
        langkah("lama_malas", null, `select public.session_enforce_deadline(${G("s_m3")})`),
        langkah("lama_jadwal", null, jadwal),
        langkah("lama_cek", null, `select s.status::text || '|' || ${hasil("s_m3")} || '|' || (md5(to_jsonb(s)::text) = current_setting('a1.lama')) from public.assessment_sessions s where s.id = ${G("s_m3")}`),
        // ---- no deadline of its own: with no closing time it stays open; it ends when the window closes
        paksa(`update public.assessment_sessions set authoritative_deadline = null where id in (${G("s_m4")}, ${G("s_m5")})`),
        paksa(`update public.assessment_assignments set closes_at = null where id = ${G("aa_pre")}`),
        langkah("tanpa", null, `select public.session_enforce_deadline(${G("s_m4")})::text || '|' || (public.pengerjaan_tutup_terjadwal(1000) ->> 'ok')`),
        langkah("tanpa_cek", null, sesiRingkas("s_m4")),
        paksa(`update public.assessment_assignments set closes_at = now() - interval '1 minute' where id = ${G("aa_pre")}`),
        langkah("jendela_malas", null, `select public.session_enforce_deadline(${G("s_m4")})`),
        langkah("jendela_jadwal", null, jadwal),
        langkah("jendela_cek", null, `select (${sesiRingkas("s_m4")}) || ' ' || (${sesiRingkas("s_m5")})`),
        langkah("jendela_tenggat", null, `select bool_and(s.closure_deadline = now() - interval '1 minute' and s.authoritative_deadline is null) from public.assessment_sessions s where s.id in (${G("s_m4")}, ${G("s_m5")})`),
        langkah("tak_ada_hasil", null, `select count(*) from public.assessment_sessions s join public.assessment_results r on r.session_id = s.id where s.status::text = 'TERMINATED'`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      c.expect(!/^ok:/.test(m.jadwal_guru ?? "ok:") && !/^ok:/.test(m.jadwal_sys ?? "ok:"), `a signed-in caller reached the scheduled entry point: teacher ${m.jadwal_guru}, platform admin ${m.jadwal_sys}`);
      harap("sebelum", "ok:IN_PROGRESS|-|-|0", "an abandoned sitting past its deadline before anything asks (the 4.0 state: open, no result)");
      harap("malas", "ok:FINALIZED", "the lazy check on a sitting an hour past its deadline");
      harap("jadwal", "ok:true", "the scheduled entry point");
      const baik = "ok:FINALIZED|DEADLINE|true|1|3/3/true|true|true|-|true|true|1";
      harap("potret_malas", baik, "the sitting the lazy check ended (FINALIZED, marked DEADLINE at its deadline, one result on its 3 answers, start time and answers kept, not a hand-in, audited)");
      harap("potret_jadwal", baik, "the sitting the scheduled entry point ended (the same)");
      c.expect(m.potret_malas === m.potret_jadwal, `the two paths differ: lazy ${m.potret_malas}; scheduled ${m.potret_jadwal}`);
      harap("percobaan", "ok:ATTEMPT_LIMIT_REACHED", "a sitting ended by its deadline uses the attempt (limit 1)");
      harap("lagi", "ok:FINALIZED|true|1", "both paths asked again (nothing more: one result)");
      harap("murid_baca", "ok:DEADLINE", "the learner reading how their sitting ended");
      harap("tenggang", "ok:EXPIRED", "the lazy check 30 seconds past the deadline, inside the 120-second late-sync window");
      harap("tenggang_cek", "ok:EXPIRED|DEADLINE|-|0", "that sitting inside the window, after the scheduled entry point too (ended, marked, not yet scored)");
      c.expect(/^PR007:/.test(m.tenggang_nilai ?? ""), `scoring inside the late-sync window: ${m.tenggang_nilai}; expected PR007`);
      harap("tenggang_akhir", "ok:FINALIZED|DEADLINE|-|1", "that sitting once the window has closed");
      harap("lama_malas", "ok:EXPIRED", "the lazy check on an EXPIRED sitting from before the rule");
      harap("lama_cek", "ok:EXPIRED|0|true", "that sitting after both paths (EXPIRED, no result, the row byte-identical)");
      harap("tanpa", "ok:IN_PROGRESS|true", "a sitting with no deadline and no closing time, asked by both paths");
      harap("tanpa_cek", "ok:IN_PROGRESS|-|-|0", "that sitting (still open)");
      harap("jendela_malas", "ok:FINALIZED", "the lazy check on a sitting with no deadline once its window has closed");
      harap("jendela_cek", "ok:FINALIZED|WINDOW_CLOSED|-|1 FINALIZED|WINDOW_CLOSED|-|1", "the two sittings with no deadline once their window closed (lazy, then scheduled)");
      harap("jendela_tenggat", "ok:true", "the deadline they ended at (the window's closing time; no deadline was written on the sitting)");
      harap("tak_ada_hasil", "ok:0", "TERMINATED sittings that have a result");
      return c.verdict("an abandoned sitting an hour past its deadline ends FINALIZED with one result on the answers recorded (3 of 5; the rest unanswered), marked DEADLINE at "
        + "its deadline, its start time and answers kept, audited, an attempt used, identically by the lazy check and by the service-only scheduled entry point; inside the "
        + "late-sync window it is ended and marked and scored only once the window has closed; an EXPIRED sitting from before the rule is byte-identical after both paths; a "
        + "sitting with no deadline stays open while its assessment has no closing time and ends (WINDOW_CLOSED) when the window closes");
    },
  },
  {
    id: "A1-S04",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tangguh = (nama: string) => `select public.tangguhkan_akun(${G(`p_${nama}`)}, 'ADMINISTRATIVE', 'uji A1: penangguhan sementara') ->> 'pengerjaan_ditahan'`;
      const pulih = (nama: string) => `select public.aktifkan_kembali_akun(${G(`p_${nama}`)}, '${ALASAN}') ->> 'ok'`;
      const baris = (nama: string) => `select d.keadaan || ',' || coalesce(d.sisa_ditahan_detik::text, '-') || ',' || d.murid_aktif || ',' || coalesce(d.sisa_detik::text, '-')
          from public.daftar_pengerjaan(${G("kelas")}, ${G("aa_pre")}) d where d.person_id = ${G(`p_${nama}`)}`;
      const L: string[] = [
        murid("m1"), mulai("m1", "aa_pre", 2), murid("m2"), mulai("m2", "aa_pre", 2), murid("m3"), mulai("m3", "aa_pre", 1),
        paksa(`update public.assessment_sessions set authoritative_deadline = now() + interval '40 minutes' where id in (${G("s_m1")}, ${G("s_m2")})`),
        // m3's sitting has no deadline of its own: its window closes in 90 minutes
        paksa(`update public.assessment_sessions set authoritative_deadline = null where id = ${G("s_m3")}`),
        // a second open sitting of m1 at another school, where the fixture has one to copy
        `set local session_replication_role = replica;
         with x as (select s.* from public.assessment_sessions s where s.institution_id <> ${G("inst")} order by s.created_at limit 1),
              n as (insert into public.assessment_sessions
                (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id, plp_release_id, assessment_definition_id,
                 assessment_definition_version, engine_version, scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed, started_at,
                 authoritative_deadline, deadline_extended_count)
                select gen_random_uuid(), ${G("p_m1")}, x.institution_id, x.enrollment_id, x.academic_period_id, x.class_node_id, x.cohort_node_id, x.plp_release_id,
                       x.assessment_definition_id, x.assessment_definition_version, x.engine_version, x.scoring_policy_version, x.evidence_channel, x.evidence_class,
                       x.mode, 'IN_PROGRESS', x.shuffle_seed, now(), now() + interval '15 minutes', 0 from x returning id)
         select set_config('a1.s_lain', coalesce((select id::text from n), ''), true) into v_x;
         set local session_replication_role = origin;`,
        langkah("sidik", null, `select set_config('a1.j1', ${sidikJawaban("s_m1")}, true) is not null`),
        // ---- the suspension holds every open sitting of the person, in its own transaction
        langkah("tahan", "sys", tangguh("m1")),
        langkah("tahan_sesi", null, `select s.frozen_cause || '|' || s.frozen_remaining_seconds || '|' || s.status::text || '|' || (s.frozen_at = ps.started_at) || '|' || (s.frozen_suspension_id = ps.id)
            || '|' || (s.xmin::text = ps.xmin::text) || '|' || (s.unfrozen_at is null) || '|' || (s.authoritative_deadline = now() + interval '40 minutes')
           from public.assessment_sessions s join public.person_suspensions ps on ps.person_id = s.person_id and ps.ended_at is null where s.id = ${G("s_m1")}`),
        langkah("tahan_lain", null, `select case when current_setting('a1.s_lain') = '' then 'none' else
            (select (s.frozen_at is not null) || '|' || s.frozen_remaining_seconds || '|' || (s.institution_id <> ${G("inst")}) from public.assessment_sessions s where s.id::text = current_setting('a1.s_lain')) end`),
        langkah("tahan_audit", null, `select (${audit("assessment_session.frozen", "s_m1", `(l.summary ->> 'remaining_seconds')::int = 2400 and l.summary ->> 'cause' = 'ACCOUNT_SUSPENDED' and l.actor_person_id = ${G("p_sys")}`)})
            || '|' || (select l.summary ->> 'sittings_frozen' from public.audit_log l where l.action = 'account.suspended' and l.target_id = (${G("p_m1")})::text order by l.id desc limit 1)`),
        langkah("tahan_bukan_jeda", null, `select count(*) from public.assessment_sessions s where s.person_id = ${G("p_m1")} and s.status::text = 'PAUSED'`),
        langkah("daftar_ditahan", "guru_a", baris("m1")),
        // ---- while held: no extra time, no ending by either path, nothing by the teacher while the account is suspended
        langkah("waktu", "guru_a", tambah("s_m1")),
        langkah("waktu_mentah", "guru_a", `select public.extend_session_deadline(${G("s_m1")}, 10, '${ALASAN}')`),
        langkah("akhiri_dinilai", "guru_a", akhiri("s_m1", "SCORED")),
        langkah("lanjut_dini", "guru_a", `select public.lanjutkan_pengerjaan(${G("s_m1")}, null) ->> 'ok'`),
        langkah("tutup_dini", "guru_a", `select public.tutup_pengerjaan_ditahan(${G("s_m1")}, '${ALASAN}') ->> 'ok'`),
        paksa(`update public.assessment_sessions set authoritative_deadline = now() - interval '1 hour' where id = ${G("s_m1")}`),
        langkah("lewat_malas", null, `select public.session_enforce_deadline(${G("s_m1")})`),
        langkah("lewat_jadwal", null, jadwal),
        langkah("lewat_cek", null, sesiRingkas("s_m1")),
        langkah("lewat_serah", null, `select public.finalize_session(${G("s_m1")})`),
        // ---- the suspension is lifted: nothing on the sitting changes, and the learner still cannot continue
        langkah("murid_ditangguhkan", "m1", jawab("s_m1", 5)),
        langkah("beku", null, `select set_config('a1.beku', md5(to_jsonb(s)::text), true) is not null from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("pulih", "sys", pulih("m1")),
        langkah("pulih_cek", null, `select (md5(to_jsonb(s)::text) = current_setting('a1.beku')) || '|' || (s.frozen_at is not null and s.unfrozen_at is null) || '|' || s.status::text
           from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("daftar_pulih", "guru_a", baris("m1")),
        langkah("murid_jawab", "m1", jawab("s_m1", 5)),
        langkah("murid_serah", "m1", `select public.finish_my_session(${G("s_m1")}, null)`),
        langkah("murid_serah_mentah", "m1", `select public.submit_session(${G("s_m1")})`),
        langkah("murid_jeda", "m1", `select public.resume_session(${G("s_m1")})`),
        langkah("murid_baca", "m1", `select (public.pengerjaan_saya(${G("s_m1")}) ->> 'ditahan') || '|' || (public.pengerjaan_saya(${G("s_m1")}) ->> 'status')`),
        langkah("jawaban_utuh", null, `select ${sidikJawaban("s_m1")} = current_setting('a1.j1')`),
        langkah("jadwal_pulih", null, `select (public.pengerjaan_tutup_terjadwal(1000) ->> 'ok') || '|' || (${sesiRingkas("s_m1")})`),
        // ---- the class's teacher resumes it, a closed window notwithstanding, with exactly the stored remaining time
        langkah("lanjut_lain", "guru_b", `select public.lanjutkan_pengerjaan(${G("s_m1")}, null) ->> 'ok'`),
        langkah("lanjut_platform", "sys", `select public.lanjutkan_pengerjaan(${G("s_m1")}, null) ->> 'ok'`),
        langkah("lanjut_murid", "m1", `select public.lanjutkan_pengerjaan(${G("s_m1")}, null) ->> 'ok'`),
        // the other learners: m2 is closed as not counted, m3 (no deadline of its own) resumed, before the window is closed
        langkah("tahan2", "sys", tangguh("m2")), langkah("pulih2", "sys", pulih("m2")),
        langkah("tutup_lain", "guru_b", `select public.tutup_pengerjaan_ditahan(${G("s_m2")}, '${ALASAN}') ->> 'ok'`),
        langkah("tutup_pendek", "guru_a", `select public.tutup_pengerjaan_ditahan(${G("s_m2")}, 'pendek') ->> 'ok'`),
        langkah("tutup", "guru_a", `select public.tutup_pengerjaan_ditahan(${G("s_m2")}, '${ALASAN}') ->> 'status'`),
        langkah("tutup_cek", null, `select s.status::text || '|' || s.termination_cause::text || '|' || s.closure_kind || '|' || (select count(*) from public.responses r where r.session_id = s.id) || '|' || ${hasil("s_m2")}
            || '|' || (${audit("assessment_session.terminated", "s_m2", `l.summary ->> 'act' = 'frozen_closed' and l.summary ->> 'reason' = '${ALASAN}' and l.actor_person_id = ${G("p_guru_a")}`)})
           from public.assessment_sessions s where s.id = ${G("s_m2")}`),
        langkah("tutup_percobaan", "m2", boleh("m2")),
        paksa(`update public.assessment_assignments set closes_at = now() + interval '90 minutes' where id = ${G("aa_pre")}`),
        langkah("tahan3", "sys", tangguh("m3")), langkah("pulih3", "sys", pulih("m3")),
        langkah("tahan3_cek", null, `select s.frozen_remaining_seconds || '|' || (s.authoritative_deadline is null) from public.assessment_sessions s where s.id = ${G("s_m3")}`),
        paksa(`update public.assessment_assignments set closes_at = now() - interval '5 minutes' where id = ${G("aa_pre")}`),
        langkah("jendela_dilewati", null, `select (public.pengerjaan_tutup_terjadwal(1000) ->> 'ok') || '|' || public.session_enforce_deadline(${G("s_m3")})::text || '|' || (${sesiRingkas("s_m3")})`),
        langkah("lanjut", "guru_a", `select public.lanjutkan_pengerjaan(${G("s_m1")}, 'uji A1: murid sudah kembali') ->> 'sisa_detik'`),
        langkah("lanjut_cek", null, `select (s.authoritative_deadline = now() + interval '2400 seconds') || '|' || (s.unfrozen_at is not null) || '|' || (s.unfrozen_by_person_id = ${G("p_guru_a")}) || '|' || s.status::text
            || '|' || s.frozen_remaining_seconds || '|' || s.deadline_extended_count
           from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("lanjut_audit", null, audit("assessment_session.resumed", "s_m1",
          `l.actor_person_id = ${G("p_guru_a")} and (l.summary #>> '{from,remaining_seconds}')::int = 2400 and (l.summary #>> '{to,deadline}')::timestamptz = now() + interval '2400 seconds'`)),
        langkah("lanjut_lagi", "guru_a", `select public.lanjutkan_pengerjaan(${G("s_m1")}, null) ->> 'ok'`),
        langkah("lanjut_murid_jawab", "m1", jawab("s_m1", 5)),
        langkah("lanjut3", "guru_a", `select public.lanjutkan_pengerjaan(${G("s_m3")}, null) ->> 'sisa_detik'`),
        langkah("lanjut3_cek", null, `select (s.authoritative_deadline = now() + interval '5400 seconds') || '|' || s.status::text || '|' || public.session_enforce_deadline(s.id)::text from public.assessment_sessions s where s.id = ${G("s_m3")}`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      const duaSekolah = m.tahan_lain !== "ok:none";
      harap("tahan", duaSekolah ? "ok:2" : "ok:1", "the suspension, by how many open sittings it held");
      harap("tahan_sesi", "ok:ACCOUNT_SUSPENDED|2400|IN_PROGRESS|true|true|true|true|true",
        "the held sitting (why, the 2400 seconds it had left, still IN_PROGRESS, since the suspension's own instant and row, written by the suspension's transaction, deadline untouched)");
      if (duaSekolah) harap("tahan_lain", "ok:true|900|true", "the person's open sitting at another school (held too, with its own remaining time)");
      else c.note("the fixture has no sitting at a second school to copy; the every-school leg did not run");
      harap("tahan_audit", duaSekolah ? "ok:1|2" : "ok:1|1", "the hold's audit row and the suspension's own count");
      harap("tahan_bukan_jeda", "ok:0", "PAUSED sittings of the suspended learner (held is not PAUSED)");
      harap("daftar_ditahan", "ok:FROZEN,2400,false,-", "the teacher's list while the learner is suspended");
      harap("waktu", "PR170:SITTING_FROZEN", "extra time on a held sitting");
      harap("waktu_mentah", "PR170:SITTING_FROZEN", "extend_session_deadline on a held sitting");
      harap("akhiri_dinilai", "PR170:SITTING_FROZEN", "a scored ending of a held sitting");
      harap("lanjut_dini", "PR170:SITTING_LEARNER_SUSPENDED", "resuming while the account is still suspended");
      harap("tutup_dini", "PR170:SITTING_LEARNER_SUSPENDED", "closing while the account is still suspended");
      harap("lewat_malas", "ok:IN_PROGRESS", "the lazy check on a held sitting whose deadline has passed");
      harap("lewat_cek", "ok:IN_PROGRESS|-|-|0", "the held sitting after both ending paths (skipped)");
      c.expect(!/^ok:/.test(m.lewat_serah ?? "ok:"), `a held sitting was scored: ${m.lewat_serah}`);
      c.expect(!/^ok:/.test(m.murid_ditangguhkan ?? "ok:"), `a suspended learner's answer was recorded: ${m.murid_ditangguhkan}`);
      harap("pulih", "ok:true", "lifting the suspension");
      harap("pulih_cek", "ok:true|true|IN_PROGRESS", "the sitting after the suspension was lifted (byte-identical, still held)");
      harap("daftar_pulih", "ok:FROZEN,2400,true,-", "the teacher's list once the learner is reinstated");
      harap("murid_jawab", "PR170:SITTING_FROZEN", "the reinstated learner's answer on the held sitting");
      harap("murid_serah", "PR170:SITTING_FROZEN", "the reinstated learner's hand-in on the held sitting");
      harap("murid_serah_mentah", "PR170:SITTING_FROZEN", "submit_session on the held sitting");
      harap("murid_jeda", "PR170:SITTING_FROZEN", "the learner's own resume_session on the held sitting");
      harap("murid_baca", "ok:true|IN_PROGRESS", "the learner reading their held sitting");
      harap("jawaban_utuh", "ok:true", "the acknowledged answers while held (unchanged)");
      harap("jadwal_pulih", "ok:true|IN_PROGRESS|-|-|0", "the scheduled entry point after reinstatement (still skipped)");
      harap("lanjut_lain", TAK_BOLEH, "another class's teacher resuming it");
      harap("lanjut_platform", TAK_BOLEH, "a platform admin resuming an academic sitting");
      harap("lanjut_murid", TAK_BOLEH, "the learner resuming it themself");
      harap("tutup_lain", TAK_BOLEH, "another class's teacher closing a held sitting");
      harap("tutup_pendek", "PR170:SITTING_REASON_REQUIRED", "closing a held sitting with a 6-character reason");
      harap("tutup", "ok:TERMINATED", "the class's teacher closing a held sitting");
      harap("tutup_cek", "ok:TERMINATED|ADMINISTRATIVE_TERMINATION|TEACHER_NOT_COUNTED|2|0|1", "the closed held sitting (not counted, its 2 answers kept, no result, audited)");
      harap("tutup_percobaan", "ok:OK", "a closed held sitting is not an attempt");
      harap("tahan3_cek", "ok:5400|true", "a held sitting with no deadline of its own (the 90 minutes its window had left)");
      harap("jendela_dilewati", "ok:true|IN_PROGRESS|IN_PROGRESS|-|-|0", "the held sitting with no deadline once its window has closed (skipped by both paths)");
      harap("lanjut", "ok:2400", "the class's teacher resuming it after the window closed");
      harap("lanjut_cek", "ok:true|true|true|IN_PROGRESS|2400|0", "the resumed sitting (deadline exactly now plus the stored 2400 seconds, who resumed it, no extension counted)");
      harap("lanjut_audit", "ok:1", "the resume's audit row (who, the stored remaining time, the new deadline)");
      harap("lanjut_lagi", "PR170:SITTING_NOT_FROZEN", "resuming a sitting that is no longer held");
      harap("lanjut_murid_jawab", "ok:RECORDED", "the learner's next answer once resumed");
      harap("lanjut3", "ok:5400", "resuming the sitting with no deadline of its own");
      harap("lanjut3_cek", "ok:true|IN_PROGRESS|IN_PROGRESS", "that sitting (its preserved 90 minutes from now, although its window closed meanwhile)");
      return c.verdict("tangguhkan_akun holds every open sitting of the person in its own transaction (its own state, never PAUSED) with the time each had left; while held, "
        + "extra time, a scored ending, the learner's answer, hand-in and resume are refused SITTING_FROZEN and both ending paths skip it, a passed deadline and a closed window "
        + "included; lifting the suspension leaves the sitting byte-identical and still held; only the class's teacher resumes it, after reinstatement, with exactly the stored "
        + "remaining time and a closed window notwithstanding, or closes it as not counted (answers kept, no result, not an attempt); each act audited");
    },
  },
  {
    id: "A1-S05",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const minta = (sesi: string, alasan = ALASAN) => `select public.minta_percobaan(${G(sesi)}, '${alasan}') ->> 'status'`;
      const putus = (req: string, setuju: boolean, alasan: string | null) => `select public.putuskan_percobaan(${G(req)}, ${setuju}, ${alasan ? `'${alasan}'` : "null"}) ->> 'status'`;
      const sidikLama = `(select md5(to_jsonb(s)::text || coalesce((select string_agg(to_jsonb(r)::text, '|' order by r.id) from public.assessment_results r where r.session_id = s.id), '')
          || coalesce((select string_agg(to_jsonb(x)::text, '|' order by x.id) from public.responses x where x.session_id = s.id), '')
          || coalesce((select string_agg(to_jsonb(p)::text, '|' order by p.id) from public.presented_items p where p.session_id = s.id), ''))
         from public.assessment_sessions s where s.id = ${G("s_m1")})`;
      const baris = (nama: string, aa = "aa_post") => `select coalesce(d.permintaan_status, '-') || ',' || d.percobaan_diizinkan || ',' || d.izin_belum_dipakai || ',' || d.jumlah_sesi || ',' || d.percobaan_terpakai || '/' || d.batas_percobaan
          from public.daftar_pengerjaan(${G("kelas")}, ${G(aa)}) d where d.person_id = ${G(`p_${nama}`)}`;
      const antre = `select count(*) || '|' || coalesce(bool_or(a.milik_sendiri)::text, '-') from public.percobaan_antrean(${G("inst")}) a where a.id = ${G("req")}`;
      const selesai = (nama: string) => `perform pg_temp.a1(${G(`u_${nama}`)}, ${q(`select public.finish_my_session(${G(`s_${nama}`)}, null)`)});`;
      const L: string[] = [
        // m1: the Pemetaan Awal finished, then the Uji Penguasaan (its limit set to one attempt, so the fixture's bank can still draw a second paper)
        murid("m1"), mulai("m1", "aa_pre", 5), selesai("m1"),
        paksa(`update public.assessment_definitions set attempt_limit = 1 where id = (select aa.assessment_definition_id from public.assessment_assignments aa where aa.id = ${G("aa_post")})`),
        mulai("m1", "aa_post", 5), selesai("m1"), murid("m2"), mulai("m2", "aa_pre", 1), murid("m3"), mulai("m3", "aa_pre", 5), selesai("m3"),
        langkah("awal", null, `select (${sesiRingkas("s_m1")}) || ' ' || (select set_config('a1.lama', ${sidikLama}, true) is not null)`),
        langkah("habis", "m1", boleh("m1", "aa_post")),
        // ---- the request: who may, and what it grants (nothing)
        langkah("minta_lain", "guru_b", minta("s_m1")),
        langkah("minta_murid", "m1", minta("s_m1")),
        langkah("minta_platform", "sys", minta("s_m1")),
        langkah("minta_pendek", "guru_a", minta("s_m1", "pendek")),
        langkah("minta_terbuka", "guru_a", minta("s_m2")),
        langkah("minta", "kadep2", `select set_config('a1.req', public.minta_percobaan(${G("s_m1")}, '${ALASAN}') ->> 'id', true) ~ '^[0-9a-f-]{36}$'`),
        langkah("minta_cek", null, `select r.status || '|' || (r.requested_by_person_id = ${G("p_kadep2")}) || '|' || (r.person_id = ${G("p_m1")}) || '|' || (r.reason = '${ALASAN}') || '|'
            || (select count(*) from public.audit_log l where l.action = 'attempt_request.requested' and l.target_id = r.id::text and l.actor_person_id = ${G("p_kadep2")} and l.summary ->> 'reason' = '${ALASAN}')
           from public.attempt_requests r where r.id = ${G("req")}`),
        langkah("belum_boleh", "m1", boleh("m1", "aa_post")),
        langkah("belum_mulai", "m1", `select public.start_learning_session(${G("aa_post")})`),
        langkah("minta_ganda", "guru_a", minta("s_m1")),
        langkah("daftar_menunggu", "guru_a", baris("m1")),
        // ---- the decision: never the requester (who holds CAN_REVIEW_INTEGRITY too), the learner, a platform admin, or anyone without the capability over the place
        langkah("putus_peminta", "kadep2", putus("req", true, null)),
        langkah("putus_murid", "m1", putus("req", true, null)),
        langkah("putus_platform", "sys", putus("req", true, null)),
        langkah("putus_guru", "guru_a", putus("req", true, null)),
        langkah("putus_kelas_lain", "kadep_b", putus("req", true, null)),
        langkah("antre_kadep", "kadep", antre), langkah("antre_peminta", "kadep2", antre), langkah("antre_guru", "guru_a", antre),
        langkah("antre_platform", "sys", antre), langkah("antre_kelas_lain", "kadep_b", antre),
        langkah("masih", "m1", `select (select m.reason from public.may_start_assessment(${G("aa_post")}) m) || '|' || (select count(*) from public.assessment_sessions s where s.person_id = ${G("p_m1")})`),
        langkah("tolak_tanpa_alasan", "kadep", putus("req", false, null)),
        // ---- approved by a different authorized person: one more start, marked; nothing earlier touched
        langkah("setuju", "kadep", putus("req", true, null)),
        langkah("setuju_cek", null, `select r.status || '|' || (r.decided_by_person_id = ${G("p_kadep")}) || '|' || (r.decided_at is not null) || '|'
            || (select count(*) from public.audit_log l where l.action = 'attempt_request.approved' and l.target_id = r.id::text and l.actor_person_id = ${G("p_kadep")})
           from public.attempt_requests r where r.id = ${G("req")}`),
        langkah("setuju_lagi", "admin", putus("req", false, ALASAN)),
        langkah("daftar_diizinkan", "guru_a", baris("m1")),
        langkah("boleh", "m1", boleh("m1", "aa_post")),
        langkah("mulai", "m1", `select set_config('a1.s_m1b', public.start_learning_session(${G("aa_post")})::text, true) ~ '^[0-9a-f-]{36}$'`),
        langkah("ditandai", null, `select (s.attempt_request_id = ${G("req")}) || '|' || s.status::text || '|' || (select x.attempt_request_id is null from public.assessment_sessions x where x.id = ${G("s_m1")})
           from public.assessment_sessions s where s.id = ${G("s_m1b")}`),
        langkah("lama_utuh", null, `select ${sidikLama} = current_setting('a1.lama')`),
        langkah("daftar_dipakai", "guru_a", baris("m1")),
        langkah("murid_baca", "m1", `select public.pengerjaan_saya(${G("s_m1b")}) ->> 'percobaan_diizinkan'`),
        langkah("satu_saja", "m1", boleh("m1", "aa_post")),
        langkah("minta_saat_terbuka", "guru_a", minta("s_m1")),
        // ---- attempts remain: nothing to request
        langkah("m2_tidak_dihitung", "guru_a", akhiri("s_m2", "NOT_COUNTED")),
        langkah("minta_tak_perlu", "guru_a", minta("s_m2")),
        // ---- declined, with a reason; nothing granted
        langkah("minta3", "guru_a", `select set_config('a1.req3', public.minta_percobaan(${G("s_m3")}, '${ALASAN}') ->> 'id', true) ~ '^[0-9a-f-]{36}$'`),
        langkah("tolak_pendek", "admin", putus("req3", false, "pendek")),
        langkah("tolak", "admin", putus("req3", false, "uji A1: belum perlu percobaan lagi")),
        langkah("tolak_cek", null, `select r.status || '|' || r.decision_reason || '|' || (select count(*) from public.audit_log l where l.action = 'attempt_request.declined' and l.target_id = r.id::text
              and l.actor_person_id = ${G("p_admin")} and l.summary ->> 'reason' = r.decision_reason)
           from public.attempt_requests r where r.id = ${G("req3")}`),
        langkah("tolak_boleh", "m3", boleh("m3")),
        langkah("daftar_tidak_disetujui", "guru_a", `select d.permintaan_status || ',' || d.keputusan_alasan || ',' || d.permintaan_oleh_saya from public.daftar_pengerjaan(${G("kelas")}, ${G("aa_pre")}) d where d.person_id = ${G("p_m3")}`),
        langkah("murid_tak_baca", "m3", `select count(*) from public.attempt_requests`),
        // the row itself refuses a decision by its requester, whoever writes it
        langkah("baris_mandiri", null, `with r as (insert into public.attempt_requests (institution_id, person_id, assessment_assignment_id, session_id, requested_by_person_id, reason, status, decided_by_person_id, decided_at)
            select s.institution_id, s.person_id, s.assessment_assignment_id, s.id, ${G("p_guru_a")}, '${ALASAN}', 'APPROVED', ${G("p_guru_a")}, now() from public.assessment_sessions s where s.id = ${G("s_m3")} returning 1) select count(*) from r`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      const TAK_PUTUS = "PR170:ATTEMPT_DECISION_NOT_ALLOWED";
      harap("awal", "ok:FINALIZED|-|-|1 true", "the learner's first sitting (handed in, one result)");
      harap("habis", "ok:ATTEMPT_LIMIT_REACHED", "the learner's attempts (limit 1, used)");
      harap("minta_lain", TAK_BOLEH, "another class's teacher requesting another attempt");
      harap("minta_murid", TAK_BOLEH, "the learner requesting it themself");
      harap("minta_platform", TAK_BOLEH, "a platform admin requesting it on an academic sitting");
      harap("minta_pendek", "PR170:SITTING_REASON_REQUIRED", "a request with a 6-character reason");
      harap("minta_terbuka", "PR170:ATTEMPT_SITTING_OPEN", "a request while the learner's sitting is open");
      harap("minta", "ok:true", "the request, by a head of department who also holds CAN_REVIEW_INTEGRITY");
      harap("minta_cek", "ok:PENDING|true|true|true|1", "the request as recorded and audited");
      harap("belum_boleh", "ok:ATTEMPT_LIMIT_REACHED", "the learner's attempts while the request waits (nothing granted)");
      c.expect(/ATTEMPT_LIMIT_REACHED/.test(m.belum_mulai ?? "") && !/^ok:/.test(m.belum_mulai ?? "ok:"), `the learner started a sitting on a waiting request: ${m.belum_mulai}`);
      harap("minta_ganda", "PR170:ATTEMPT_REQUEST_OPEN", "a second request while one waits");
      harap("daftar_menunggu", "ok:PENDING,false,false,1,1/1", "the teacher's list while the request waits");
      harap("putus_peminta", "PR170:ATTEMPT_OWN_REQUEST", "the requester approving their own request, although they hold CAN_REVIEW_INTEGRITY over the class");
      harap("putus_murid", TAK_PUTUS, "the learner approving it");
      harap("putus_platform", TAK_PUTUS, "a platform admin approving it");
      harap("putus_guru", TAK_PUTUS, "a teacher (no CAN_REVIEW_INTEGRITY) approving it");
      harap("putus_kelas_lain", TAK_PUTUS, "another class's head of department approving it");
      harap("antre_kadep", "ok:1|false", "the approver's queue, for a head of department over the class");
      harap("antre_peminta", "ok:1|true", "the queue for the requester (listed as their own, not theirs to decide)");
      harap("antre_guru", "ok:0|-", "the queue for a teacher");
      harap("antre_platform", "ok:0|-", "the queue for a platform admin");
      harap("antre_kelas_lain", "ok:0|-", "the queue for another class's head of department");
      harap("masih", "ok:ATTEMPT_LIMIT_REACHED|2", "the learner after every refused decision (nothing granted: the two sittings they had)");
      harap("tolak_tanpa_alasan", "PR170:ATTEMPT_REASON_REQUIRED", "declining without a reason");
      harap("setuju", "ok:APPROVED", "a different head of department approving it");
      harap("setuju_cek", "ok:APPROVED|true|true|1", "the approval as recorded and audited");
      harap("setuju_lagi", "PR170:ATTEMPT_ALREADY_DECIDED", "deciding a decided request");
      harap("daftar_diizinkan", "ok:APPROVED,false,true,1,1/1", "the teacher's list after the approval (a granted attempt not yet started)");
      harap("boleh", "ok:OK", "the learner's attempts after the approval");
      harap("mulai", "ok:true", "the learner starting the granted attempt");
      harap("ditandai", "ok:true|CREATED|true", "the new sitting (marked with the request that granted it; the earlier one unmarked)");
      harap("lama_utuh", "ok:true", "the earlier sitting, its result, its answers and its paper after the grant and the new start (byte-identical)");
      harap("daftar_dipakai", "ok:APPROVED,true,false,2,2/1", "the teacher's list once the granted attempt is under way");
      harap("murid_baca", "ok:true", "the learner reading their granted sitting");
      harap("satu_saja", "ok:ATTEMPT_LIMIT_REACHED", "the learner's attempts after starting the granted one (one more, no more)");
      harap("minta_saat_terbuka", "PR170:ATTEMPT_SITTING_OPEN", "a further request while the granted sitting is open");
      harap("m2_tidak_dihitung", "ok:TERMINATED", "ending the second learner's sitting as not counted");
      harap("minta_tak_perlu", "PR170:ATTEMPT_NOT_NEEDED", "a request for a learner who can still start");
      harap("minta3", "ok:true", "the class's teacher requesting for a third learner");
      harap("tolak_pendek", "PR170:ATTEMPT_REASON_REQUIRED", "declining with a 6-character reason");
      harap("tolak", "ok:DECLINED", "the school admin declining with a reason");
      harap("tolak_cek", "ok:DECLINED|uji A1: belum perlu percobaan lagi|1", "the decline as recorded and audited");
      harap("tolak_boleh", "ok:ATTEMPT_LIMIT_REACHED", "the learner's attempts after the decline");
      harap("daftar_tidak_disetujui", "ok:DECLINED,uji A1: belum perlu percobaan lagi,true", "the teacher's list after the decline (the requester reads the reason)");
      c.expect(/^42501:/.test(m.murid_tak_baca ?? ""), `a learner read attempt_requests: ${m.murid_tak_baca}`);
      c.expect(/^23514:/.test(m.baris_mandiri ?? ""), `a request row approved by its own requester was accepted: ${m.baris_mandiri}`);
      return c.verdict("a request for another attempt is the class's teacher's (with a reason, audited) and grants nothing: the learner cannot start until a different holder of "
        + "CAN_REVIEW_INTEGRITY over the class approves it; the requester (who holds that capability too), the learner, a platform admin, a teacher and another class's head are "
        + "refused, and the row itself refuses its requester; the approval gives exactly one more start, marked with the request, and leaves the earlier sitting, result, answers "
        + "and paper byte-identical; a request is refused while a sitting is open, while one waits and while attempts remain; a decline needs a reason and grants nothing");
    },
  },
  {
    id: "A1-S06",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const ubah = (dari: string, sampai: string, alasan = ALASAN) => `select public.ubah_jadwal_penugasan(${G("la")}, ${dari}, ${sampai}, '${alasan}') ->> 'ok'`;
      const jendela = `select (la.available_from = now() - interval '2 days' and la.available_until = now() + interval '3 days')::text || '|'
          || (select bool_and(aa.opens_at = now() - interval '2 days' and aa.closes_at = now() + interval '3 days' and aa.status = 'OPEN')::text || '/' || count(*)
                from public.assessment_assignments aa where aa.learning_assignment_id = la.id)
         from public.learning_assignments la where la.id = ${G("la")}`;
      const L: string[] = [
        murid("m1"), mulai("m1", "aa_pre", 2),
        langkah("t0", null, `select set_config('a1.t0', s.authoritative_deadline::text, true) is not null and set_config('a1.w0', (select coalesce(la.available_until::text, '') from public.learning_assignments la where la.id = ${G("la")}), true) is not null
           from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("lain", "guru_b", ubah("now() - interval '2 days'", "now() + interval '3 days'")),
        langkah("murid", "m1", ubah("now() - interval '2 days'", "now() + interval '3 days'")),
        langkah("terbalik", "guru_a", ubah("now() + interval '3 days'", "now() + interval '2 days'")),
        langkah("lampau", "guru_a", ubah("now() - interval '3 days'", "now() - interval '1 hour'")),
        langkah("tanpa_buka", "guru_a", ubah("null", "now() + interval '3 days'")),
        langkah("pendek", "guru_a", ubah("now() - interval '2 days'", "now() + interval '3 days'", "pendek")),
        langkah("belum", null, `select coalesce(la.available_until::text, '') = current_setting('a1.w0') from public.learning_assignments la where la.id = ${G("la")}`),
        langkah("ubah", "guru_a", ubah("now() - interval '2 days'", "now() + interval '3 days'")),
        langkah("ubah_cek", null, jendela),
        langkah("sesi_tetap", null, `select (s.authoritative_deadline = current_setting('a1.t0')::timestamptz) || '|' || s.status::text || '|' || s.deadline_extended_count from public.assessment_sessions s where s.id = ${G("s_m1")}`),
        langkah("audit", null, `select count(*) from public.audit_log l where l.action = 'learning_assignment.window_changed' and l.target_id = (${G("la")})::text and l.actor_person_id = ${G("p_guru_a")}
            and l.summary ->> 'reason' = '${ALASAN}' and (l.summary #>> '{from,available_until}')::timestamptz is not distinct from nullif(current_setting('a1.w0'), '')::timestamptz
            and (l.summary #>> '{to,available_until}')::timestamptz = now() + interval '3 days' and jsonb_array_length(l.summary #> '{from,assessments}') = 2
            and (l.summary ->> 'open_sittings_kept')::int >= 1`),
        langkah("audit_sebelum", null, `select l.summary #>> '{from,available_until}' from public.audit_log l where l.action = 'learning_assignment.window_changed' and l.target_id = (${G("la")})::text order by l.id desc limit 1`),
        langkah("sama", "guru_a", ubah("now() - interval '2 days'", "now() + interval '3 days'")),
        langkah("kadep", "kadep", ubah("now() - interval '2 days'", "now() + interval '4 days'")),
        // ---- an ended assignment is never reopened
        langkah("akhiri", "guru_a", `select public.akhiri_penugasan(${G("la")}, 'ENDED', '${ALASAN}', true) ->> 'ok'`),
        langkah("berakhir", "guru_a", ubah("now() - interval '2 days'", "now() + interval '9 days'")),
        langkah("berakhir_cek", null, `select la.status::text || '|' || (la.available_until = now() + interval '4 days') || '|' || (select string_agg(distinct aa.status::text, ',') from public.assessment_assignments aa where aa.learning_assignment_id = la.id)
           from public.learning_assignments la where la.id = ${G("la")}`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("lain", "PR170:WINDOW_NOT_ALLOWED", "another class's teacher changing the window");
      harap("murid", "PR170:WINDOW_NOT_ALLOWED", "a learner changing the window");
      harap("terbalik", "PR170:WINDOW_INVALID", "a window that closes before it opens");
      harap("lampau", "PR170:WINDOW_INVALID", "a window that has already closed");
      harap("tanpa_buka", "PR170:WINDOW_INVALID", "a window with no opening time");
      harap("pendek", "PR170:SITTING_REASON_REQUIRED", "a window change with a 6-character reason");
      harap("belum", "ok:true", "the window after the refusals");
      harap("ubah", "ok:true", "the class's teacher changing the window");
      harap("ubah_cek", "ok:true|true/2", "the lesson's window and both assessments' after the change");
      harap("sesi_tetap", "ok:true|IN_PROGRESS|0", "the sitting already open (the deadline it was given, kept)");
      c.expect(m.audit === "ok:1", `the window change's audit row (who, the reason, before and after): ${m.audit}; before recorded as ${m.audit_sebelum}`);
      harap("sama", "PR170:WINDOW_UNCHANGED", "the same window again");
      harap("kadep", "ok:true", "the head of department changing the window");
      harap("akhiri", "ok:true", "ending the assignment");
      harap("berakhir", "PR170:WINDOW_ASSIGNMENT_ENDED", "changing the window of an ended assignment");
      harap("berakhir_cek", "ok:ENDED|true|CLOSED", "the ended assignment after the refused change (ENDED, its window as it was, its assessments CLOSED)");
      return c.verdict("the class's teacher changes a live assignment's window with a reason: the lesson's dates and both assessments' move together, audited with who, the reason, "
        + "before and after; the sitting already open keeps the deadline it was given; another class's teacher and a learner are refused, a window that closes before it opens or "
        + "has already closed is refused, and an ended assignment is not reopened");
    },
  },
  {
    id: "A1-S07",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const daftar = (kelas = "kelas") => `public.daftar_pengerjaan(${G(kelas)}, ${G("aa_pre")})`;
      const nama = ["m_belum", "m_buka", "m_serah", "m_dinilai", "m_tidak", "m_tenggat", "m_tahan"];
      const L: string[] = [
        ...nama.map((n) => murid(n)),
        mulai("m_buka", "aa_pre", 1), mulai("m_serah", "aa_pre", 5), mulai("m_dinilai", "aa_pre", 2), mulai("m_tidak", "aa_pre", 2),
        mulai("m_tenggat", "aa_pre", 2), mulai("m_tahan", "aa_pre", 2),
        `perform pg_temp.a1(${G("u_m_serah")}, ${q(`select public.finish_my_session(${G("s_m_serah")}, null)`)});`,
        paksa(`update public.assessment_sessions set authoritative_deadline = now() + interval '30 minutes' where id in (${G("s_m_buka")}, ${G("s_m_tahan")})`),
        langkah("dinilai", "guru_a", akhiri("s_m_dinilai", "SCORED")),
        langkah("tidak", "guru_a", akhiri("s_m_tidak", "NOT_COUNTED")),
        paksa(`update public.assessment_sessions set authoritative_deadline = now() - interval '1 hour' where id = ${G("s_m_tenggat")}`),
        langkah("sebelum_jadwal", "guru_a", `select d.keadaan from ${daftar()} d where d.person_id = ${G("p_m_tenggat")}`),
        langkah("jadwal", null, jadwal),
        langkah("tahan", "sys", `select public.tangguhkan_akun(${G("p_m_tahan")}, 'ADMINISTRATIVE', 'uji A1: penangguhan sementara') ->> 'ok'`),
        // ---- who reads the list
        langkah("lain", "guru_b", `select count(*) from ${daftar()}`),
        langkah("murid", "m_buka", `select count(*) from ${daftar()}`),
        langkah("platform", "sys", `select count(*) from ${daftar()}`),
        langkah("kelas_lain", "guru_b", `select count(*) from ${daftar("kelas_b")}`),
        // ---- what it says
        langkah("keadaan", "guru_a", `select string_agg(coalesce(d.keadaan, '?'), ',' order by x.ord)
           from unnest(array[${nama.map((n) => G(`p_${n}`)).join(", ")}]) with ordinality x(pid, ord) left join ${daftar()} d on d.person_id = x.pid`),
        langkah("belum", "guru_a", `select (d.sesi_id is null) || '|' || d.jumlah_sesi || '|' || coalesce(d.dihitung::text, '-') || '|' || d.percobaan_terpakai || '/' || d.batas_percobaan from ${daftar()} d where d.person_id = ${G("p_m_belum")}`),
        langkah("buka", "guru_a", `select d.sisa_detik || '|' || (d.mulai is not null) || '|' || (d.tenggat = now() + interval '30 minutes') || '|' || d.dihitung || '|' || (d.berakhir_pada is null) from ${daftar()} d where d.person_id = ${G("p_m_buka")}`),
        langkah("tahan_baris", "guru_a", `select d.sisa_ditahan_detik || '|' || (d.ditahan_sejak is not null) || '|' || d.murid_aktif || '|' || coalesce(d.sisa_detik::text, '-') from ${daftar()} d where d.person_id = ${G("p_m_tahan")}`),
        langkah("akhir", "guru_a", `select string_agg(d.dihitung || '/' || (d.berakhir_pada is not null), ',' order by x.ord)
           from unnest(array[${["m_serah", "m_dinilai", "m_tidak", "m_tenggat"].map((n) => G(`p_${n}`)).join(", ")}]) with ordinality x(pid, ord) join ${daftar()} d on d.person_id = x.pid`),
        langkah("urut", "guru_a", `select array_agg(d.nama) = array_agg(d.nama order by d.nama) from ${daftar()} d`),
        langkah("tanpa_nilai", null, `select pg_get_function_result('public.daftar_pengerjaan(uuid, uuid)'::regprocedure) !~* 'mastery|skor|nilai|score|rank|peringkat|pass'`),
        // ---- the learner's own read: how, never why or who
        langkah("saya_dinilai", "m_dinilai", `select (j ->> 'penutupan') || '|' || (j ->> 'dihitung') || '|' || (j::text !~* 'alasan|reason|person|oleh') from (select public.pengerjaan_saya(${G("s_m_dinilai")}) j) x`),
        langkah("saya_tidak", "m_tidak", `select (j ->> 'penutupan') || '|' || (j ->> 'dihitung') from (select public.pengerjaan_saya(${G("s_m_tidak")}) j) x`),
        langkah("saya_tenggat", "m_tenggat", `select (j ->> 'penutupan') || '|' || (j ->> 'status') from (select public.pengerjaan_saya(${G("s_m_tenggat")}) j) x`),
        langkah("saya_orang_lain", "m_buka", `select public.pengerjaan_saya(${G("s_m_dinilai")}) ->> 'penutupan'`),
        langkah("kolom_alasan", "m_dinilai", `select s.closure_reason from public.assessment_sessions s where s.id = ${G("s_m_dinilai")}`),
        langkah("kolom_guru", "guru_a", `select s.frozen_cause from public.assessment_sessions s where s.id = ${G("s_m_tahan")}`),
      ];
      const m = jalankan(c, repoRoot, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("lain", TAK_BOLEH, "another class's teacher reading the list");
      harap("murid", TAK_BOLEH, "a learner reading the list");
      harap("platform", TAK_BOLEH, "a platform admin reading the list");
      harap("kelas_lain", TAK_BOLEH, "the list of a class the assessment was not given to");
      harap("sebelum_jadwal", "ok:ENDED_BY_DEADLINE", "a sitting past its deadline before the scheduled entry point ran (said as ended by its deadline, never as open)");
      harap("keadaan", "ok:NOT_STARTED,OPEN,HANDED_IN,ENDED_SCORED,ENDED_NOT_COUNTED,ENDED_BY_DEADLINE,FROZEN", "each learner's state");
      harap("belum", "ok:true|0|-|0/1", "a learner who has not started");
      harap("buka", "ok:1800|true|true|true|true", "an open sitting (30 minutes left, since when, its deadline)");
      harap("tahan_baris", "ok:1800|true|false|-", "a held sitting (the 30 minutes preserved, since when, the learner not yet reinstated, no running clock)");
      harap("akhir", "ok:true/true,true/true,false/true,true/true", "handed in, ended scored, ended not counted, ended by deadline: whether each counts, and when it ended");
      harap("urut", "ok:true", "the list's order (by name, never by a result)");
      harap("tanpa_nilai", "ok:true", "the list's columns (no score, no rank)");
      harap("saya_dinilai", "ok:TEACHER_SCORED|true|true", "the learner reading a sitting the teacher handed in (how, never why or who)");
      harap("saya_tidak", "ok:TEACHER_NOT_COUNTED|false", "the learner reading a sitting ended as not counted");
      harap("saya_tenggat", "ok:DEADLINE|FINALIZED", "the learner reading a sitting ended by its deadline");
      harap("saya_orang_lain", TAK_BOLEH, "a learner reading another learner's sitting");
      c.expect(/^42501:/.test(m.kolom_alasan ?? ""), `a learner read the reason their sitting was ended: ${m.kolom_alasan}`);
      c.expect(/^42501:/.test(m.kolom_guru ?? ""), `a client read why a sitting is held, directly from the table: ${m.kolom_guru}`);
      return c.verdict("the teacher's list for one class and one instrument says each learner's latest sitting (not started; open with its start and time left; held with the "
        + "preserved time and whether the learner is reinstated; handed in; ended scored; ended not counted; ended by its deadline, also before the scheduled entry point "
        + "has run), whether it counts and when it ended, in the order of the names with no score or rank; another class's teacher, a learner and a platform admin are refused; "
        + "a learner reads how their own sitting ended and never why or by whom, and no client reads those columns");
    },
  },
];

/**
 * A2B-SP1, A2B-SP2 — A START REFUSED FOR MAINTENANCE SAYS SO BY ITS CODE (the journeys on 3c58620e, J1.6; Second
 * Eye's finding; Sharon, f1e969a1: a promotion blocker; the Chief Architect, 16 Nov 16:21: A2b reopened for this
 * defect only, fix (a), red first through the real path).
 *
 * A2b commit 3 (20270120120000) made may_start_assessment answer MAINTENANCE_PLACE and MAINTENANCE_NO_NEW_START, so
 * the screen never offers what the sitting-insert trigger refuses. But start_learning_session asks may_start first and
 * raised every refusal as P0001 'cannot start this assessment: <reason> (INV-27)', with no code and no DETAIL: the
 * trigger's PR040 / PR110 were reached only in a race. mulaiAsesmen maps PR110 MAINTENANCE_NO_NEW_START and PR040
 * MAINTENANCE_PLACE (R-A: the start screen for a work-scoped window; 4.0's /pemeliharaan?mulai=ditolak at T−15 for a
 * platform-wide one), so a learner who pressed «Mulai» on a start screen loaded before T−15 or before the window got an
 * error page. 4.0's T−15 start had reached the trigger's PR110 and been redirected as designed.
 *
 * The learner is the Siklus school's (siklus-email); the assignment is a fresh copy of the class's Pemetaan Awal, so
 * the learner has never started it and may_start's maintenance answer is the deciding one.
 *   A2B-SP1 (database, rolled back): with no window the start succeeds (the control); inside a planned school window
 *     under way it raises PR040 with DETAIL MAINTENANCE_PLACE; with a planned school window starting in 10 minutes,
 *     and with a platform-wide one, PR110 with DETAIL MAINTENANCE_NO_NEW_START. The plant (after the fix): the
 *     function given back the generic P0001 raise; the same cases must then fail.
 *   A2B-SP2 (the running build, «Mulai» posted as a browser without script posts it): in the school window the
 *     learner is sent back to the start screen (R-A), at a platform-wide T−15 to /pemeliharaan?mulai=ditolak (4.0),
 *     at a school-wide T−15 back to the start screen; never an error page, and no sitting is made.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createServerClient } from "@supabase/ssr";
import { Checks, compiledBundle, type Context, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

const MURID = { email: "siklus-email@synthetic.pintar.test", password: "Sintetis-SiklusEmail-84!" };
const ID = (n: string) => `a2b5f000-0000-4000-8000-${n.padStart(12, "0")}`;
const SALINAN = ID("aa1"), W = ID("b01");

/** The Siklus school, its class's Pemetaan Awal assignment (the original), and the learner's auth id. */
function dunia(): { inst: string; asli: string; la: string; uid: string } {
  const inst = psql("select id from public.institutions where name = 'Sekolah Sintetis Siklus'");
  const [asli, la] = psql(`select aa.id || ',' || aa.learning_assignment_id from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
    join public.learning_assignments l on l.id = aa.learning_assignment_id
   where aa.institution_id = ${lit(inst)} and d.mode = 'PRE_TEST' and aa.status = 'OPEN'
     and exists (select 1 from public.memberships m join public.enrollments e on e.id = m.enrollment_id
                  join public.accounts a on a.person_id = e.person_id join auth.users u on u.id = a.auth_user_id
                 where m.node_id = l.node_id and m.valid_to is null and u.email = ${lit(MURID.email)})
   order by aa.id limit 1`).split(",");
  const uid = psql(`select id from auth.users where email = ${lit(MURID.email)}`);
  return { inst, asli, la, uid };
}
/** The journey fixture's copy of an assignment, with a new id (the harness's hand: triggers off for the copy only). */
const salinSql = (asli: string) => `set local session_replication_role = replica;
create temp table if not exists sp_salin on commit drop as select * from public.assessment_assignments where id = ${lit(asli)};
update sp_salin set id = ${lit(SALINAN)};
insert into public.assessment_assignments select * from sp_salin;
set local session_replication_role = origin;`;
/** A planned window: of the school (or the platform), starting `mulai` from now, an hour long. */
const jendelaSql = (inst: string, platform: boolean, mulai: string) => `set local session_replication_role = replica;
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, ends_at, reason, reason_code, created_by_person_id, activation_recorded_at)
values (${lit(W)}, 'PLANNED', ${platform}, ${platform ? "'{}'::uuid[]" : `array[${lit(inst)}]::uuid[]`}, '{}', now() + interval '${mulai}', now() + interval '${mulai}' + interval '1 hour',
        'RUTIN', 'RUTIN', (select id from public.persons order by id limit 1), case when interval '${mulai}' <= interval '0' then now() end);
set local session_replication_role = origin;`;

/** Rows of one psql run, each «key|value». */
function baris(sql: string): { hasil: Record<string, string>; err: string } {
  const r = spawnSync("psql", [process.env.SUPABASE_DB_URL!, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: sql });
  const hasil: Record<string, string> = {};
  for (const l of (r.stdout ?? "").split("\n")) { const i = l.indexOf("|"); if (i > 0) hasil[l.slice(0, i)] = l.slice(i + 1); }
  return { hasil, err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n").filter((x) => /ERROR|DETAIL/.test(x)).join(" ") };
}

/** One case of SP1, in its own rolled-back transaction: the start's answer as sqlstate:detail, or OK. */
function kasus(d: ReturnType<typeof dunia>, k: string, jendela: string, tanam: boolean): string {
  const r = baris(`begin;
${salinSql(d.asli)}
${jendela}
${tanam ? `select pg_temp_sp_tanam();` : ""}
create function pg_temp.sp_coba() returns text language plpgsql as $c$
declare s text; dt text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', '${d.uid}', 'role', 'authenticated')::text, true);
  perform public.start_learning_session('${SALINAN}');
  return 'OK';
exception when others then get stacked diagnostics s = returned_sqlstate, dt = pg_exception_detail; return s || ':' || coalesce(dt, '');
end $c$;
select '${k}|' || pg_temp.sp_coba();
rollback;`.replace("select pg_temp_sp_tanam();", TANAM));
  return r.err ? `error: ${r.err}` : (r.hasil[k] ?? "no answer");
}
/** The plant (after the fix): start_learning_session given back the generic raise, by removing the fix's marked lines. */
const TANAM = `do $p$ declare v text := pg_get_functiondef('public.start_learning_session(uuid)'::regprocedure); b text; begin
  b := regexp_replace(v, '\\s*-- A2b start-path:[^\\n]*\\n(\\s*if [^\\n]*\\n){2}', E'\\n', 'g');
  if b = v then raise exception 'the plant did not reach start_learning_session (no fix to undo)'; end if;
  execute b;
end $p$;`;

async function masuk(ctx: Context): Promise<string> {
  const jar = new Map<string, string>();
  const client = createServerClient(ctx.supabaseUrl!, ctx.supabaseAnonKey!, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { error } = await client.auth.signInWithPassword(MURID);
  if (error) throw new Error(`sign-in failed for ${MURID.email}: ${error.message}`);
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}
function idAksi(ctx: Context, berkas: string, nama: string): string | null {
  const p = compiledBundle(ctx, "server", "server-reference-manifest.json");
  if (!existsSync(p)) return null;
  const m = JSON.parse(readFileSync(p, "utf8")) as { node?: Record<string, { filename?: string; exportedName?: string }> };
  for (const [id, a] of Object.entries(m.node ?? {})) if ((a.filename ?? "").endsWith(berkas) && (a.exportedName ?? nama) === nama) return id;
  return null;
}
/** «Mulai» posted as a browser without script posts it: where it sends the learner, or its status when it does not. */
async function mulai(ctx: Context, cookie: string, aksi: string, penugasan: string, kembali: string): Promise<string> {
  const fd = new FormData();
  fd.set(`$ACTION_ID_${aksi}`, "");
  fd.set("penugasan", penugasan);
  fd.set("kembali", kembali);
  // the action is posted to the page that draws its form (the Pemetaan Awal's start screen), as Next requires
  const r = await fetch(`${ctx.appUrl}${kembali}/pemetaan`, { method: "POST", body: fd, redirect: "manual", headers: { cookie, origin: ctx.appUrl! } });
  const ke = r.headers.get("location") ?? "";
  return ke ? decodeURIComponent(new URL(ke, "http://x").pathname + new URL(ke, "http://x").search) : `status ${r.status}`;
}
function bersihkan(): string {
  psql(`begin; set local session_replication_role = replica;
delete from public.maintenance_windows where id = ${lit(W)};
delete from public.assessment_sessions where assessment_assignment_id = ${lit(SALINAN)};
delete from public.assessment_assignments where id = ${lit(SALINAN)};
commit;`);
  return psql(`select (select count(*) from public.maintenance_windows where id = ${lit(W)}) + (select count(*) from public.assessment_assignments where id = ${lit(SALINAN)})`);
}

export const a2bMulaiDbTests: SelfTest[] = [
  {
    id: "A2B-SP1",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const d = dunia();
      if (!c.expect(/^[0-9a-f-]{36}$/.test(d.asli) && /^[0-9a-f-]{36}$/.test(d.uid), `the Siklus learner's Pemetaan Awal is missing: ${JSON.stringify(d)}`)) return c.verdict("");
      const tanpa = kasus(d, "tanpa", "", false);
      const tempat = kasus(d, "tempat", jendelaSql(d.inst, false, "-5 minutes"), false);
      const t15Sekolah = kasus(d, "t15s", jendelaSql(d.inst, false, "10 minutes"), false);
      const t15Platform = kasus(d, "t15p", jendelaSql(d.inst, true, "10 minutes"), false);
      c.expect(tanpa === "OK", `the control: with no window the learner starts the copy: ${tanpa}`);
      c.expect(tempat === "PR040:MAINTENANCE_PLACE", `inside a planned school window under way the start must raise PR040 MAINTENANCE_PLACE: ${tempat}`);
      c.expect(t15Sekolah === "PR110:MAINTENANCE_NO_NEW_START", `with a planned school window starting in 10 minutes the start must raise PR110 MAINTENANCE_NO_NEW_START: ${t15Sekolah}`);
      c.expect(t15Platform === "PR110:MAINTENANCE_NO_NEW_START", `with a platform-wide window starting in 10 minutes the start must raise PR110 MAINTENANCE_NO_NEW_START: ${t15Platform}`);
      // the plant, once the fix is there: its marked lines removed, the generic raise is back and both codes are lost
      if (tempat === "PR040:MAINTENANCE_PLACE") {
        const tt = kasus(d, "tanam_tempat", jendelaSql(d.inst, false, "-5 minutes"), true);
        const t15 = kasus(d, "tanam_t15", jendelaSql(d.inst, true, "10 minutes"), true);
        c.expect(tt !== "PR040:MAINTENANCE_PLACE" && t15 !== "PR110:MAINTENANCE_NO_NEW_START",
          `the plant (the generic P0001 raise back) must be caught: place ${tt}, T−15 ${t15}`);
      }
      return c.verdict("start_learning_session, for the Siklus learner's never-started copy of the class's Pemetaan Awal: no window, it starts; inside a planned school window under way it raises PR040 MAINTENANCE_PLACE; with a planned school or platform-wide window starting in 10 minutes it raises PR110 MAINTENANCE_NO_NEW_START, each with its DETAIL, as the sitting-insert trigger does; the plant restoring the generic P0001 raise is caught");
    },
  },
  {
    id: "A2B-SP3",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = readFileSync(join(repoRoot, "src", "app", "belajar", "actions.ts"), "utf8");
      const salah = mulaiTakTertangani(src);
      c.expect(salah.length === 0, `src/app/belajar/actions.ts: ${salah.join("; ")}`);
      c.expect(/export\s+async\s+function\s+mulaiAsesmen\b/.test(src) && !/export\s+async\s+function\s+startSession\b/.test(src),
        "mulaiAsesmen must be the one start, and the unhandled startSession action must not return");
      // the plant: 3c58620e's unhandled export, appended, must be caught
      const tanam = mulaiTakTertangani(`${src}\nexport async function startSession(id: string) {\n  return engine.startSession(await db(), id);\n}\n`);
      c.expect(tanam.length === 1 && /startSession/.test(tanam[0]), `the plant (an exported start with no maintenance handling) must be caught once: ${JSON.stringify(tanam)}`);
      return c.verdict("src/app/belajar/actions.ts: every exported function that starts a sitting maps PR110 MAINTENANCE_NO_NEW_START and PR040 MAINTENANCE_PLACE (mulaiAsesmen, the one start); the unhandled startSession action is gone, and a plant restoring it is caught");
    },
  },
  {
    id: "A2B-Q12",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const d = dunia();
      const lain = psql("select id from auth.users where email = 'alpha-siswa-1@synthetic.pintar.test'");
      if (!c.expect(/^[0-9a-f-]{36}$/.test(d.asli) && /^[0-9a-f-]{36}$/.test(lain), "the Siklus learner's Pemetaan Awal or Alpha's learner is missing")) return c.verdict("");
      const tanpa = daftarKasus(d.inst, d.uid, lain, "");
      const tempat = daftarKasus(d.inst, d.uid, lain, jendelaSql(d.inst, false, "-5 minutes"));
      const t15s = daftarKasus(d.inst, d.uid, lain, jendelaSql(d.inst, false, "10 minutes"));
      const t15p = daftarKasus(d.inst, d.uid, lain, jendelaSql(d.inst, true, "10 minutes"));
      const belumBuka = daftarKasus(d.inst, d.uid, lain, jendelaSql(d.inst, false, "-5 minutes"), "now() + interval '1 day'");
      c.expect(tanpa === "1:0", `the control: with no window the standalone row is the learner's and no other school's (learner:other ${tanpa})`);
      c.expect(tempat === "1:0", `inside a school window under way the row stays on the learner's list (Daisy: shown, its refusal on the orientation), never another school's: ${tempat}`);
      c.expect(t15s === "1:0" && t15p === "1:0", `at a school-wide and a platform-wide T−15 the row stays: school ${t15s}, platform ${t15p}`);
      c.expect(belumBuka === "0:0", `a refusal that is not maintenance still drops the row (not yet open, inside a window): ${belumBuka}`);
      // (3) a running sitting stays reachable through its own read while the window runs
      const r = baris(`begin;
${adhocSql(d.inst, "now() - interval '1 day'")}
${sebagai(d.uid)}
select set_config('q12.s', public.start_learning_session(${lit(AA_ADHOC)})::text, true);
${jendelaSql(d.inst, false, "-5 minutes")}
${sebagai(d.uid)}
create function pg_temp.q12_baca() returns text language plpgsql as $c$
declare v jsonb; s text; dt text;
begin
  v := public.pengerjaan_saya(current_setting('q12.s')::uuid);
  return 'OK:' || coalesce(v ->> 'status', jsonb_typeof(v));
exception when others then get stacked diagnostics s = returned_sqlstate, dt = pg_exception_detail; return s || ':' || coalesce(dt, '');
end $c$;
select 'baca|' || pg_temp.q12_baca();
rollback;`);
      c.expect(!r.err && /^OK:/.test(r.hasil.baca ?? ""), `a running sitting stays reachable through its own read (pengerjaan_saya) inside the window: ${r.err || r.hasil.baca}`);
      return c.verdict("my_open_assessments (/belajar's standalone list) keeps the learner's row inside a school window and at a school-wide and platform-wide T−15, as with no window (Daisy, ab730614: shown; the refusal is the orientation's), never another school's; a refusal that is not maintenance (not yet open) still drops it; a running sitting is read through its own read (pengerjaan_saya) inside the window");
    },
  },
];

/** Daisy (A2B-DAFTAR-Q12-PUTUSAN.md at ab730614; the Chief Architect, 16 Nov 16:27): /belajar's standalone (Q-12) list keeps a
 *  row a maintenance refusal stops; its other refusals still drop it. A standalone copy of the class's Pemetaan Awal,
 *  its definition marked ad-hoc as a Uji Cepat's is (the journey fixture, rolled back). */
const D_ADHOC = ID("d02"), AA_ADHOC = ID("c02");
const adhocSql = (inst: string, buka: string) => `set local session_replication_role = replica;
create temp table q12d on commit drop as select d.* from public.assessment_definitions d join public.assessment_assignments aa on aa.assessment_definition_id = d.id
 where aa.institution_id = ${lit(inst)} and d.mode = 'PRE_TEST' and aa.status = 'OPEN' order by aa.id limit 1;
update q12d set id = ${lit(D_ADHOC)}, is_ad_hoc = true, title = title || ' (uji Q-12)';
insert into public.assessment_definitions select * from q12d;
create temp table q12a on commit drop as select aa.* from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
 where aa.institution_id = ${lit(inst)} and d.mode = 'PRE_TEST' and aa.status = 'OPEN' order by aa.id limit 1;
update q12a set id = ${lit(AA_ADHOC)}, learning_assignment_id = null, assessment_definition_id = ${lit(D_ADHOC)}, opens_at = ${buka};
insert into public.assessment_assignments select * from q12a;
set local session_replication_role = origin;`;
const sebagai = (uid: string) => `select set_config('request.jwt.claims', json_build_object('sub', '${uid}', 'role', 'authenticated')::text, true);`;
function daftarKasus(inst: string, murid: string, lain: string, jendela: string, buka = "now() - interval '1 day'"): string {
  const r = baris(`begin;
${adhocSql(inst, buka)}
${jendela}
${sebagai(murid)}
select 'murid|' || count(*) from public.my_open_assessments() where assessment_assignment_id = ${lit(AA_ADHOC)};
${sebagai(lain)}
select 'lain|' || count(*) from public.my_open_assessments() where assessment_assignment_id = ${lit(AA_ADHOC)};
rollback;`);
  return r.err ? `error: ${r.err}` : `${r.hasil.murid}:${r.hasil.lain}`;
}

/** The Chief Architect (16 Nov 16:27): src/app/belajar/actions.ts exports no start that leaves a maintenance refusal unhandled.
 *  Every exported function that starts a sitting (engine.startSession / start_learning_session) must map PR110
 *  MAINTENANCE_NO_NEW_START and PR040 MAINTENANCE_PLACE; the one such today is mulaiAsesmen. */
export function mulaiTakTertangani(sumber: string): string[] {
  const s = sumber.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  const salah: string[] = [];
  const awal = [...s.matchAll(/export\s+async\s+function\s+(\w+)\s*\(/g)];
  awal.forEach((m, i) => {
    const badan = s.slice(m.index!, i + 1 < awal.length ? awal[i + 1].index : undefined);
    if (!/\b(?:engine\.startSession|start_learning_session)\b/.test(badan)) return;
    const tertangani = /err\.code === "PR110" && err\.detail === "MAINTENANCE_NO_NEW_START"/.test(badan)
      && /err\.code === "PR040" && err\.detail === "MAINTENANCE_PLACE"/.test(badan);
    if (!tertangani) salah.push(`${m[1]} starts a sitting without mapping PR110 MAINTENANCE_NO_NEW_START and PR040 MAINTENANCE_PLACE`);
  });
  return salah;
}

export const a2bMulaiAppTests: SelfTest[] = [
  {
    id: "A2B-SP2",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      const d = dunia();
      const aksi = idAksi(ctx, "src/app/belajar/actions.ts", "mulaiAsesmen");
      if (!c.expect(aksi !== null, "the build's manifest names no mulaiAsesmen")) return c.verdict("");
      if (!c.expect(/^[0-9a-f-]{36}$/.test(d.asli), "the Siklus learner's Pemetaan Awal is missing")) return c.verdict("");
      const kembali = `/belajar/${d.la}`;
      const sesi = () => psql(`select count(*) from public.assessment_sessions where assessment_assignment_id = ${lit(SALINAN)}`);
      try {
        psql(`begin; ${salinSql(d.asli)} commit;`);
        const cookie = await masuk(ctx);
        const kasusApp = async (jendela: string) => {
          psql(`begin; set local session_replication_role = replica; delete from public.maintenance_windows where id = ${lit(W)}; commit;`);
          psql(`begin; ${jendela} commit;`);
          return mulai(ctx, cookie, aksi!, SALINAN, kembali);
        };
        const tempat = await kasusApp(jendelaSql(d.inst, false, "-5 minutes"));
        c.expect(tempat === kembali, `inside a school window «Mulai» must send the learner back to the start screen (R-A), never an error: ${tempat}`);
        const t15p = await kasusApp(jendelaSql(d.inst, true, "10 minutes"));
        c.expect(t15p === "/pemeliharaan?mulai=ditolak", `at a platform-wide T−15 «Mulai» must send the learner to /pemeliharaan?mulai=ditolak (4.0): ${t15p}`);
        const t15s = await kasusApp(jendelaSql(d.inst, false, "10 minutes"));
        c.expect(t15s === kembali, `at a school-wide T−15 «Mulai» must send the learner back to the start screen (R-A): ${t15s}`);
        c.expect(sesi() === "0", `no sitting may be made by a refused start: ${sesi()}`);
      } finally {
        c.expect(bersihkan() === "0", "the test's window or assignment copy is still there");
      }
      return c.verdict("mulaiAsesmen against the build, «Mulai» posted as a browser without script posts it, for a never-started copy of the Siklus class's Pemetaan Awal: inside a school window the learner returns to the start screen (R-A); at a platform-wide T−15 to /pemeliharaan?mulai=ditolak (4.0); at a school-wide T−15 to the start screen; never an error page, and no sitting is made");
    },
  },
];

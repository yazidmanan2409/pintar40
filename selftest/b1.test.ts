/**
 * B1 · ACCOUNTABILITY EVENTS, the database, the source and the helper (docs/completion-4.1/batches/B1-COMPLETION.md,
 * Sharon's pre-build PASS; THE PLAN §5.1 H; migrations 20270116100000 and 20270116110000). Each database scenario is one
 * transaction, rolled back, except B1-C01, which needs real connections and commits rows of its own (and proves they
 * are gone afterwards, THE PLAN §4.1 P3).
 *
 *   B1-K01  the source: every code akuntabilitas_tolak raises is the contract's; each kind, method and failure outcome
 *           has one sentence in Indonesian and English, worded as the sign-in screen's own (never Auth's text) and naming
 *           no mechanism; the reader is declared and the writer, the purge and the counter are the service's alone; the
 *           store is closed to every client role; ONLY src/app/api/_akuntabilitas/catat.ts calls the writer; each sign-in route and
 *           the sign-out path call the helper exactly once, after the decision and before the answer; the origin is read
 *           from alamatKlien alone.
 *   B1-K02  the helper, driven with its writer replaced: the /24 and /48 (an IPv4-mapped address read as IPv4; no full
 *           address, no other header); the hash is the store's own label over the normalised identifier; one request is
 *           never written twice, two requests are two writes; a decision whose call to Auth is retried inside the route
 *           writes once; a writer that fails or times out does not throw, is logged without the identifier and is
 *           counted; a print fails closed.
 *   B1-S01  the writer and the reader: a successful and a failed sign-in each leave exactly one row (red before B1:
 *           there is no store); the two-school snapshot (a school left before and one joined after read nothing; later
 *           changes leave the snapshot as it was); an empty snapshot is the platform admin's only; a print at school A by
 *           a person at A and B is A's alone, by its resource; the network origin is the platform admin's alone; the
 *           reader finds a print by its reference; the writer refuses a signed-in caller, an address, a hash on a
 *           success and a print with no school's resource; no client role selects, inserts, updates or deletes.
 *   B1-S02  L4 (blocker 3): after hapus_data_pribadi the person's rows keep kind, instant and person and hold no origin
 *           and no hash; the same update without the marker, with another person's marker, or touching another column is
 *           refused; another person's rows are untouched.
 *   B1-S03  retention: a row aged twelve months and a day is purged with one audit row (its count, oldest and newest);
 *           a row at eleven months stays; a run that deletes nothing writes no audit row; a delete or truncate outside
 *           the purge is refused; the purge refuses a signed-in caller.
 *   B1-S04  not a metric source: metric_sources refuses the store; the boundary assertion holds, and fails for a
 *           calculator that reads the store and for a view built over it.
 *   B1-R01  one installer: both jobs declared and installed once as declared; A1's installer is a call to it; a job
 *           removed by hand is reported missing, a changed one different, an undeclared pintar-* job named; installing
 *           again restores each once; a counted writer failure makes the health read report it.
 *   B1-C01  two purges at once, on real connections: a run that finds every aged row locked by another run deletes none
 *           of them and does not wait; a run beside another's batch in flight deletes the rest; each row is deleted once
 *           and the audit rows add up to the rows deleted; nothing of the scenario is left behind.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";
import {
  CARA_MASUK, JENIS_AKUNTABILITAS, KODE_AKUNTABILITAS_DB, SEMUA_HASIL_GAGAL, kunciCara, kunciHasil, kunciJenis, rujukanCetakDari,
} from "../src/lib/akuntabilitas-kontrak";

export const MIGRASI_B1 = "supabase/migrations/20270116100000_a_sign_in_a_sign_out_and_a_print_are_kept_on_the_record_for_twelve_months.sql";
export const MIGRASI_B1_JADWAL = "supabase/migrations/20270116110000_every_scheduled_job_is_declared_once_installed_by_one_installer_and_checked.sql";
/** The sign-in routes and the sign-out path of THE PLAN §5.1 C, and the helper call each makes once. */
export const RUTE_B1: ReadonlyArray<readonly [string, number]> = [
  ["src/app/api/masuk/password/route.ts", 1],
  ["src/app/api/masuk/kartu/route.ts", 1],
  ["src/app/api/masuk/lupa/periksa/route.ts", 1],
  ["src/app/api/masuk/lupa/pin/route.ts", 1],
  ["src/app/api/masuk/lupa/password/route.ts", 1],
  ["src/app/auth/callback/actions.ts", 1],
  ["src/app/keluar/route.ts", 1],
  // the sign-in link's request (an unknown address) and S15's sign-out, one each
  ["src/app/masuk/actions.ts", 2],
];

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}
function psql(sql: string): { ok: boolean; out: string; err: string } {
  const r = spawnSync("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", db()], { encoding: "utf8", input: sql, maxBuffer: 1 << 26 });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim().split("\n").filter((l) => /ERROR|FATAL/.test(l)).slice(-3).join(" | ") };
}
function siapkan(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable02.sql", "fable03.sql", "fable06.sql", "fable11.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}
/** psql in a connection of its own, as a promise (A1's psqlLain, selftest/a1-layar.test.ts). */
function psqlLain(sql: string): Promise<{ ok: boolean; out: string; err: string; ms: number }> {
  const t0 = Date.now();
  return new Promise((selesai) => {
    const p = spawn("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-c", sql, db()], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (b) => { out += b; });
    p.stderr.on("data", (b) => { err += b; });
    p.on("close", (code) => selesai({ ok: code === 0, out: out.trim(), err: err.trim().split("\n").slice(-3).join(" | "), ms: Date.now() - t0 }));
  });
}
const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const tanpaKomentarSql = (s: string) => s.replace(/^\s*--.*$/gm, "");
function semuaBerkas(dir: string, akar: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...semuaBerkas(p, akar));
    else if (/\.(ts|tsx|mjs|js)$/.test(n)) out.push(relative(akar, p));
  }
  return out;
}

// ------------------------------------------------------------------ one rolled-back scenario
/**
 * pg_temp.b1(uid, sql): as that user (the database owner when null, with no claims: the service's context) run sql;
 * 'ok:<value>' or '<sqlstate>:<detail or message>'. pg_temp.b1_svc(sql): as the service role (claims role service_role).
 */
const PEMBUKA = `
begin;
create function pg_temp.b1(p_uid uuid, p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text;
begin
  begin
    if p_uid is not null then perform selftest.as_user_uid(p_uid); else perform selftest.as_owner(); end if;
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 90));
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
create function pg_temp.b1_peran(p_role text, p_sql text, p_claims jsonb default null)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text;
begin
  begin
    perform selftest.as_owner();
    perform set_config('request.jwt.claims', coalesce(p_claims, jsonb_build_object('role', p_role))::text, true);
    execute format('set local role %I', p_role);
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 90));
  end;
  reset role;
  perform selftest.as_owner();
  return v_out;
end $f$;
-- as the owner, with one transaction-local setting set first (a marker), run sql
create function pg_temp.b1_dengan(p_kunci text, p_nilai text, p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text;
begin
  begin
    perform selftest.as_owner();
    perform set_config(p_kunci, p_nilai, true);
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 90));
  end;
  perform set_config(p_kunci, '', true);
  return v_out;
end $f$;
-- a person by a fixture's own hand (selftest.f11_user), with a role at a node from p_dari to p_sampai (null: no role)
create function pg_temp.b1_orang(p_nama text, p_role public.app_role, p_node uuid)
returns uuid language plpgsql as $f$
declare v_u uuid;
begin
  v_u := selftest.f11_user('b1-' || p_nama || '-' || current_setting('b1.tag') || '@local.invalid', p_role, p_node);
  perform set_config('b1.u_' || p_nama, v_u::text, true);
  perform set_config('b1.p_' || p_nama, (select a.person_id::text from public.accounts a where a.auth_user_id = v_u), true);
  return v_u;
end $f$;
create function pg_temp.b1_peran_di(p_person uuid, p_role public.app_role, p_node uuid, p_dari timestamptz, p_sampai timestamptz, p_cabut timestamptz)
returns void language plpgsql as $f$
begin
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until, revoked_at)
  values (p_person, p_role, p_node, p_dari, p_sampai, p_cabut);
  perform set_config('app.seed_intent', '', true);
end $f$;
create function pg_temp.b1_catat(p_kind text, p_method text, p_outcome text, p_auth uuid, p_pengenal text, p_hash text, p_origin text, p_res jsonb)
returns bigint language plpgsql as $f$
declare v jsonb;
begin
  perform selftest.as_owner();
  v := public.akuntabilitas_catat(p_kind, p_method, p_outcome, p_auth, p_pengenal, p_hash, p_origin, p_res);
  return (v ->> 'id')::bigint;
end $f$;
create temp table b1_hasil (v jsonb);
`;
const G = (k: string) => `current_setting('b1.${k}')::uuid`;
const q = (s: string) => `$q$${s}$q$`;

function jalankan(badan: string): { ok: boolean; v: Record<string, unknown>; err: string } {
  const r = psql(`${PEMBUKA}
do $b1$
declare v jsonb := '{}'::jsonb; f record; n int; x text; i bigint; j bigint; k bigint;
begin
  perform selftest.as_owner();
  perform set_config('b1.tag', to_char(clock_timestamp(), 'HH24MISSUS'), true);
${badan}
  insert into b1_hasil values (v);
end $b1$;
select 'V|' || v::text from b1_hasil;
rollback;
`);
  const baris = r.out.split("\n").find((l) => l.startsWith("V|"));
  let v: Record<string, unknown> = {};
  try { v = baris ? JSON.parse(baris.slice(2)) : {}; } catch { v = {}; }
  return { ok: r.ok && Boolean(baris), v, err: r.err };
}

/** Four schools (A, B: live; C: left before; D: joined after) and their admins, a platform admin and a teacher. */
const DUNIA = `
  for f in select o.id as node, o.institution_id as inst, row_number() over (order by i.created_at, i.id) as nomor
             from public.org_nodes o join public.institutions i on i.id = o.institution_id
            where o.kind = 'INSTITUTION' and i.tenant_kind = 'INSTITUTION' and i.official_evidence_purpose is distinct from 'D1_ENGINEERING_BOOTSTRAP'
            order by i.created_at, i.id limit 4 loop
    perform set_config('b1.node' || f.nomor, f.node::text, true);
    perform set_config('b1.inst' || f.nomor, f.inst::text, true);
  end loop;
  if current_setting('b1.inst4', true) is null or current_setting('b1.inst4', true) = '' then raise exception 'B1: four schools are needed'; end if;
  perform pg_temp.b1_orang('sys', 'SYSTEM_ADMIN', null);
  perform pg_temp.b1_orang('adminA', 'INSTITUTION_ADMIN', ${G("node1")});
  perform pg_temp.b1_orang('adminB', 'INSTITUTION_ADMIN', ${G("node2")});
  perform pg_temp.b1_orang('adminC', 'INSTITUTION_ADMIN', ${G("node3")});
  perform pg_temp.b1_orang('adminD', 'INSTITUTION_ADMIN', ${G("node4")});
  perform pg_temp.b1_orang('guru', 'EDUCATOR', ${G("node1")});
  -- the person at two schools: a role at A, a role at B, a role at C revoked before, one at D from tomorrow
  perform pg_temp.b1_orang('dua', 'EDUCATOR', ${G("node1")});
  perform pg_temp.b1_peran_di(${G("p_dua")}, 'EDUCATOR', ${G("node2")}, now() - interval '30 days', now() + interval '300 days', null);
  perform pg_temp.b1_peran_di(${G("p_dua")}, 'EDUCATOR', ${G("node3")}, now() - interval '400 days', now() + interval '300 days', now() - interval '5 days');
  perform pg_temp.b1_peran_di(${G("p_dua")}, 'EDUCATOR', ${G("node4")}, now() + interval '1 day', now() + interval '300 days', null);
`;
/** The reader, as one of the world's people, for a school (or none): the ids it returns and their origins, as text. */
const baca = (siapa: string, sekolah: string | null, ekstra = "", args: string[] = []) =>
  `pg_temp.b1(${G(`u_${siapa}`)}, format(${q(`select coalesce(string_agg(id::text || '/' || coalesce(network_origin, '-'), ',' order by id), '') from public.akuntabilitas_baca(%L::uuid${ekstra})`)}, ${sekolah ? `current_setting('b1.${sekolah}')` : "null"}${args.map((a) => `, ${a}`).join("")}))`;

export const b1Tests: SelfTest[] = [
  {
    id: "B1-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca1 = (p: string) => { try { return readFileSync(join(repoRoot, p), "utf8"); } catch { return ""; } };
      const sql = baca1(MIGRASI_B1), jadwal = baca1(MIGRASI_B1_JADWAL);
      if (!c.expect(sql.length > 0 && jadwal.length > 0, `${MIGRASI_B1} or ${MIGRASI_B1_JADWAL} does not exist: the sign-in record is not built`)) return c.verdict("");
      // 1. the codes: every code the raiser names is the contract's, and every one it is called with has a message
      const tolak = /create or replace function public\.akuntabilitas_tolak[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      const kode = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((x) => x[1]);
      c.expect(/errcode = 'PR200'/.test(tolak) && kode.length === KODE_AKUNTABILITAS_DB.length && KODE_AKUNTABILITAS_DB.every((k) => kode.includes(k)),
        `akuntabilitas_tolak (PR200) names ${kode.join(", ")}; the contract ${KODE_AKUNTABILITAS_DB.join(", ")}`);
      for (const k of new Set([...sql.matchAll(/akuntabilitas_tolak\('([A-Z_]+)'\)/g)].map((x) => x[1]))) c.expect(kode.includes(k), `${k} is raised without a message of its own`);
      // 2. each kind, method and failure outcome has one sentence in both languages, the sign-in screen's own kind of words
      const MEKANISME = /\b(hash|hmac|pepper|sha-?256|cron|ip|ipv[46]|alamat ip|token|jwt|identifier_hash|network_origin|accountability_events|auth\.users|supabase|gotrue|invalid login credentials|invalid_credentials|otp)\b/i;
      const kunci = [...JENIS_AKUNTABILITAS.map(kunciJenis), ...CARA_MASUK.map(kunciCara), kunciHasil("OK"), ...SEMUA_HASIL_GAGAL.map(kunciHasil)];
      for (const k of kunci) {
        const id = t(k, "staff"), en = t(k, "staff", { locale: "en" });
        c.expect(id.length > 3 && en.length > 3 && id !== "—" && en !== "—", `${k} has no sentence in both languages («${id}» / «${en}»)`);
        c.expect(!MEKANISME.test(id) && !MEKANISME.test(en), `${k} names the mechanism or Auth's text: «${id}» / «${en}»`);
      }
      c.expect(new Set(SEMUA_HASIL_GAGAL.map(kunciHasil)).size === SEMUA_HASIL_GAGAL.length, "two failure outcomes share one key");
      const salinan = [...readFileSync(join(repoRoot, "src/lib/hle.ts"), "utf8").matchAll(/^ {2}"(akuntabilitas\.[a-z_.]+)": \{ default: "((?:[^"\\]|\\.)*)", en: "((?:[^"\\]|\\.)*)"/gm)];
      c.expect(salinan.length >= 60, `only ${salinan.length} akuntabilitas.* sentences in src/lib/hle.ts`);
      for (const [, k, id, en] of salinan) c.expect(!MEKANISME.test(id) && !MEKANISME.test(en), `the copy ${k} names the mechanism: «${id}» / «${en}»`);
      c.expect(t("akuntabilitas.rujukan_hilang", "staff") === "Referensi ini tidak ditemukan. Catatan cetak disimpan 12 bulan, sejak {tanggal}."
        && t("akuntabilitas.tidak_dikenal", "staff") === "pengenal tidak dikenal", "the purged reference's sentence or «pengenal tidak dikenal» is not Daisy's");
      // 3. the store closed to every client role; the reader declared; the writer, the purge and the counter the service's
      const bersih = tanpaKomentarSql(sql);
      for (const tb of ["accountability_events", "accountability_store", "accountability_write_failures"]) {
        c.expect(new RegExp(`revoke all on table public\\.${tb} from public, anon, authenticated, service_role;`).test(bersih)
          && new RegExp(`alter table public\\.${tb} enable row level security;`).test(bersih) && !new RegExp(`grant [a-z, ]+ on (table )?public\\.${tb}`).test(bersih)
          && !new RegExp(`create policy [a-z_]+ on public\\.${tb}`).test(bersih), `${tb} is not closed to every client role`);
      }
      for (const f of ["akuntabilitas_baca", "akuntabilitas_sejak"]) {
        c.expect(new RegExp(`\\('${f}', 'STAFF',`).test(bersih) && new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to authenticated;`).test(bersih)
          && new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon, authenticated;`).test(bersih), `${f} is not declared, or not revoked from the signed-out role`);
      }
      for (const f of ["akuntabilitas_catat", "akuntabilitas_gagal_hitung", "akuntabilitas_buang_lama"]) {
        c.expect(new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to service_role;`).test(bersih) && !new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to authenticated`).test(bersih)
          && !new RegExp(`\\('${f}',`).test(bersih), `${f} is not the service's alone`);
      }
      // the schools are computed inside the writer, never taken from the caller (execution requirement 1)
      const penulis = /create or replace function public\.akuntabilitas_catat\([\s\S]*?end \$\$;/.exec(bersih)?.[0] ?? "";
      const tanda = /akuntabilitas_catat\(\s*([\s\S]*?)\)\s*returns/.exec(penulis)?.[1] ?? "";
      c.expect(penulis.length > 0 && !/institution|sekolah|school/i.test(tanda) && /akuntabilitas_sekolah_orang\(v_person, v_now\)/.test(penulis)
        && /v_schools := array\[v_inst\]/.test(penulis), `the writer takes a school from its caller, or does not compute the snapshot itself (${tanda})`);
      // 4. ONLY the helper calls the writer; the routes call the helper once each, after the decision and before the answer
      const berkas = semuaBerkas(join(repoRoot, "src"), repoRoot);
      const pemanggil = berkas.filter((f) => /akuntabilitas_catat|akuntabilitas_gagal_hitung/.test(tanpaKomentar(baca1(f))));
      c.expect(JSON.stringify(pemanggil) === JSON.stringify(["src/app/api/_akuntabilitas/catat.ts"]), `the writer is called from ${pemanggil.join(", ") || "nowhere"}, not the helper alone`);
      const pengguna = berkas.filter((f) => /catatAkuntabilitas\(/.test(tanpaKomentar(baca1(f))) && f !== "src/app/api/_akuntabilitas/catat.ts").sort();
      c.expect(JSON.stringify(pengguna) === JSON.stringify(RUTE_B1.map(([f]) => f).sort()), `the helper is called from ${pengguna.join(", ")}; THE PLAN's table C names ${RUTE_B1.map(([f]) => f).join(", ")}`);
      for (const [f, n] of RUTE_B1) {
        const src = tanpaKomentar(baca1(f));
        const panggil = [...src.matchAll(/await catatAkuntabilitas\(/g)].map((m) => m.index ?? 0);
        c.expect(panggil.length === n, `${f} calls the helper ${panggil.length} time(s), not ${n}`);
        if (/route\.ts$/.test(f)) {
          // after the decision's whole call (its tools included), before the one answer
          const keputusan = /const hasil = await [a-zA-Z]+\(/.exec(src);
          const jawab = src.lastIndexOf("return ");
          const akhirKeputusan = keputusan ? src.indexOf("\n  );\n", keputusan.index) : -1;
          c.expect(panggil.every((i) => (f.endsWith("keluar/route.ts") || (keputusan !== null && i > akhirKeputusan && akhirKeputusan > 0)) && i < jawab),
            `${f}: the event is not written once the decision is final and before the answer`);
        }
      }
      // 5. the origin from alamatKlien alone; no other header, no full address sent
      const helper = tanpaKomentar(baca1("src/app/api/_akuntabilitas/catat.ts"));
      c.expect(/^import "server-only";/.test(baca1("src/app/api/_akuntabilitas/catat.ts")) && /asalDariAlamat\(alamatKlien\(headers\)\)/.test(helper)
        && !/x-forwarded-for|x-real-ip|sb-forwarded-for|user-agent|headers\.get\(/i.test(helper), "the origin is read from something other than alamatKlien, or the helper is not server-only");
      c.expect(/p_origin: asalJaringan\(headers\)/.test(helper) && !/p_origin: alamatKlien/.test(helper), "the writer is sent something other than the coarse origin");
      // the sign-in link: an unknown address only, at the request; success only at the callback
      const tautan = tanpaKomentar(baca1("src/app/masuk/actions.ts"));
      const kirim = tautan.slice(tautan.indexOf("export async function sendMagicLink"), tautan.indexOf("function tidakTerdaftar"));
      c.expect(/if \(error && tidakTerdaftar\(error\)\) \{\s*await catatAkuntabilitas\(await headers\(\), "masuk\/tautan", \{ jenis: "SIGN_IN_FAILED", cara: "LINK", hasil: "TAUTAN_TIDAK_TERDAFTAR", diketik: normalPengenal\("nama", email\) \}\);\s*\}/.test(kirim)
        && !/SIGN_IN_OK/.test(kirim) && !/authUserId|pengenal:/.test(kirim), "a link request writes something other than one failure, hash only, for an unknown address");
      const balik = tanpaKomentar(baca1("src/app/auth/callback/actions.ts"));
      c.expect(/jenis: "SIGN_IN_OK", cara: "LINK", hasil: "OK", authUserId: data\.user\.id/.test(balik), "a sign-in by link is not recorded at the callback");
      return c.verdict("every PR200 code is the contract's with its message; each kind, method and failure outcome has its own sentence in both "
        + "languages, in the sign-in screen's kind of words and naming no mechanism; the store is closed to every client role; the reader is "
        + "declared and the writer, the purge and the counter are the service's alone; the writer computes the schools itself; only the helper "
        + "calls the writer, and each route of table C calls the helper once, after its decision and before its answer; the origin is alamatKlien's "
        + "/24 or /48 only; a link request writes a hash-only failure for an unknown address and the success is the callback's");
    },
  },
  {
    id: "B1-K02",
    requires: [],
    run: async () => {
      const c = new Checks();
      const sebelum = process.env.CARD_PEPPER;
      process.env.CARD_PEPPER = sebelum || "selftest-pepper-b1-at-least-thirty-two-chars";
      try {
        const m = await import("../src/app/api/_akuntabilitas/catat");
        const { masukPassword } = await import("../src/lib/aktivasi");
        const { createHmac } = await import("node:crypto");
        // 1. the origin
        const kasus: Array<[string | null, string | null]> = [
          ["203.0.113.77", "203.0.113.0/24"], ["::ffff:198.51.100.9", "198.51.100.0/24"], ["::FFFF:c633:6409", "198.51.100.0/24"],
          ["2001:db8:abcd:12::1", "2001:db8:abcd::/48"], ["2001:0DB8:0000:0042:0000:8a2e:0370:7334", "2001:db8:0::/48"], ["::1", "0:0:0::/48"],
          ["bukan-ip", null], ["", null], [null, null],
        ];
        for (const [a, harap] of kasus) c.expect(m.asalDariAlamat(a) === harap, `the origin of ${a}: ${m.asalDariAlamat(a)}, not ${harap}`);
        const h = new Headers({ "x-real-ip": "203.0.113.77", "x-forwarded-for": "9.9.9.9" });
        c.expect(m.asalJaringan(h) === "203.0.113.0/24" && m.asalJaringan(new Headers({ "x-forwarded-for": "9.9.9.9" })) === null,
          "the origin is read from a header other than x-real-ip");
        // 2. the hash: the store's own label, over the normalised identifier, the existing pepper
        const harapHash = createHmac("sha256", process.env.CARD_PEPPER!).update("akuntabilitas|bagas@sekolah.sch.id").digest("hex");
        c.expect(m.hashPengenal(m.normalPengenal("nama", "  Bagas@Sekolah.sch.id ")) === harapHash && m.LABEL_HASH === "akuntabilitas",
          "the identifier hash is not HMAC-SHA256(pepper, «akuntabilitas|<normalised>»)");
        c.expect(m.normalPengenal("pintar_id", "a14c d7st") === "A14CD7ST" && m.normalPengenal("pintar_id", "a14o-d7sl") === "A140D7S1"
          && m.normalPengenal("kartu", "70 01") === "7001", "an identifier is not normalised as its route reads it");
        // 3. one request, one write; two requests, two writes; a retry inside the route, one
        const tulisan: Array<Record<string, unknown>> = [];
        const log: string[] = [];
        let gagalDihitung = 0;
        const penulis = (perilaku: "ok" | "gagal" | "lambat" = "ok") => ({
          tulis: async (a: Record<string, unknown>) => {
            if (perilaku === "gagal") throw Object.assign(new Error("x"), { code: "PR200", details: "ACCOUNTABILITY_EVENT_INVALID" });
            if (perilaku === "lambat") throw Object.assign(new Error("aborted"), { name: "TimeoutError" });
            tulisan.push(a); return { ref: a.p_kind === "PRINT_REQUEST" ? "CTK-AAAA-BBBB" : null };
          },
          hitungGagal: async () => { gagalDihitung++; },
          log: (b: string) => { log.push(b); },
        });
        const permintaan = new Headers({ "x-real-ip": "198.51.100.23" });
        await m.catatAkuntabilitas(permintaan, "uji", { jenis: "SIGN_IN_FAILED", cara: "PASSWORD", hasil: "MASUK_TIDAK_COCOK", diketik: "bagas" }, penulis());
        await m.catatAkuntabilitas(permintaan, "uji", { jenis: "SIGN_IN_FAILED", cara: "PASSWORD", hasil: "MASUK_TIDAK_COCOK", diketik: "bagas" }, penulis());
        c.expect(tulisan.length === 1 && log.some((l) => /a second event for one request was not written/.test(l)), `one request wrote ${tulisan.length} event(s)`);
        await m.catatAkuntabilitas(new Headers({ "x-real-ip": "198.51.100.23" }), "uji", { jenis: "SIGN_IN_FAILED", cara: "PASSWORD", hasil: "MASUK_TIDAK_COCOK", diketik: "bagas" }, penulis());
        c.expect(tulisan.length === 2, `two requests (a client retrying after a failure) wrote ${tulisan.length} event(s), not two`);
        const w = tulisan[0] ?? {};
        c.expect(w.p_origin === "198.51.100.0/24" && w.p_identifier_hash === m.hashPengenal("bagas") && !JSON.stringify(tulisan).includes("198.51.100.23")
          && !JSON.stringify(tulisan).includes("\"bagas\"") && w.p_resource === null, `the writer was sent ${JSON.stringify(w).slice(0, 300)}`);
        // a decision whose call to Auth is retried inside the route: the route's one call after the final answer writes once
        const sebelumRetry = tulisan.length;
        let panggilAuth = 0;
        const kepala = new Headers({ "x-real-ip": "198.51.100.24" });
        const hasil = await masukPassword({ origin: true, identitas: "bagas.saputro", password: "rahasia-sekali", lanjut: null }, {
          resolusi: async () => "bagas@sekolah.sch.id", catat: async () => 0, selesaikan: async () => undefined,
          masuk: async () => {
            // the route's own retry: Auth asked twice for the same attempt
            for (let i = 0; i < 2; i++) panggilAuth++;
            return { error: { status: 400, code: "invalid_credentials" } };
          },
          keadaan: async () => "COMPLETE", tujuan: async () => "/mulai", tunggu: async () => undefined, sekarang: () => 0, catatGalat: () => undefined,
        });
        await m.catatAkuntabilitas(kepala, "uji", { jenis: "SIGN_IN_FAILED", cara: "PASSWORD", hasil: hasil.body.ok ? "OK" : hasil.body.code, diketik: "bagas.saputro" }, penulis());
        c.expect(panggilAuth === 2 && tulisan.length === sebelumRetry + 1 && tulisan[tulisan.length - 1].p_outcome === "MASUK_TIDAK_COCOK",
          `a request whose call to Auth was retried wrote ${tulisan.length - sebelumRetry} event(s)`);
        // 4. a failed or slow writer: no throw, logged without the identifier, counted; a print fails closed
        const logSebelum = log.length;
        let lempar = false;
        try {
          await m.catatAkuntabilitas(new Headers({ "x-real-ip": "198.51.100.25" }), "masuk/password", { jenis: "SIGN_IN_FAILED", cara: "PASSWORD", hasil: "MASUK_TIDAK_COCOK", pengenal: "rahasia@sekolah.sch.id", diketik: "rahasia@sekolah.sch.id" }, penulis("gagal"));
          await m.catatAkuntabilitas(new Headers(), "keluar", { jenis: "SIGN_OUT", hasil: "OK", authUserId: "00000000-0000-4000-8000-000000000001" }, penulis("lambat"));
        } catch { lempar = true; }
        const baru = log.slice(logSebelum);
        c.expect(!lempar && gagalDihitung === 2 && baru.length === 2 && baru.every((l) => !/rahasia|198\.51\.100/.test(l)) && /timeout/.test(baru[1] ?? ""),
          `a failed writer: threw ${lempar}, counted ${gagalDihitung}, logged ${JSON.stringify(baru)}`);
        let tertutup = false;
        try { await m.catatPermintaanCetak(new Headers(), { authUserId: "x", laporan: "laporan.kelas", lingkup: { node_id: "y" } }, penulis("gagal")); } catch (e) { tertutup = (e as Error).message === "AKUNTABILITAS_CETAK_GAGAL"; }
        const cetak = await m.catatPermintaanCetak(new Headers(), { authUserId: "x", laporan: "laporan.kelas", lingkup: { node_id: "y" } }, penulis());
        c.expect(tertutup && cetak.ref === "CTK-AAAA-BBBB" && gagalDihitung === 3, `a print does not fail closed (${tertutup}) or give its reference (${cetak.ref})`);
        c.expect(rujukanCetakDari(" ctk aaaa-bbbb ") === "CTK-AAAA-BBBB" && rujukanCetakDari("CTKAAAA BBB") === null && rujukanCetakDari("Bagas") === null,
          "a print reference is not read from the search as typed");
      } finally {
        if (sebelum === undefined) delete process.env.CARD_PEPPER; else process.env.CARD_PEPPER = sebelum;
      }
      return c.verdict("the origin is x-real-ip's /24 or /48 (an IPv4-mapped address as IPv4), never another header or the full address; the hash "
        + "is HMAC-SHA256 with the pepper under «akuntabilitas» over the normalised identifier; one request writes once, two requests twice, and a "
        + "request whose Auth call was retried once; a failed or timed-out write neither throws nor blocks, is logged without the identifier "
        + "and is counted; a print with no event fails closed");
    },
  },
  {
    id: "B1-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const r = jalankan(`
${DUNIA}
  -- 1. a successful and a failed sign-in each leave exactly one row
  n := (select count(*) from public.accountability_events);
  i := pg_temp.b1_catat('SIGN_IN_OK', 'PASSWORD', 'OK', ${G("u_dua")}, null, null, '203.0.113.0/24', null);
  j := pg_temp.b1_catat('SIGN_IN_FAILED', 'PASSWORD', 'MASUK_TIDAK_COCOK', null, 'b1-dua-' || current_setting('b1.tag') || '@local.invalid', repeat('a', 64), '2001:db8:a::/48', null);
  k := pg_temp.b1_catat('SIGN_IN_FAILED', 'CARD', 'CARD_NOT_MATCHED', null, null, repeat('b', 64), null, null);
  perform set_config('b1.e_ok', i::text, true); perform set_config('b1.e_gagal', j::text, true); perform set_config('b1.e_tiada', k::text, true);
  -- a PINTAR ID, typed in any case and spacing, names its person (read, never stored)
  x := (select lower(substr(p.pintar_id, 1, 4) || ' ' || substr(p.pintar_id, 5)) from public.persons p where p.id = ${G("p_dua")});
  perform set_config('b1.e_pin', pg_temp.b1_catat('SIGN_IN_FAILED', 'RECOVERY_PIN', 'PIN_TIDAK_COCOK', null, x, repeat('9', 64), null, null)::text, true);
  v := v || jsonb_build_object('pin_orang', (select person_id = ${G("p_dua")} from public.accountability_events where id = current_setting('b1.e_pin')::bigint));
  v := v || jsonb_build_object('pin_teks', (select count(*) from public.accountability_events e where e::text ilike '%' || replace(x, ' ', '') || '%' or e::text ilike '%' || x || '%'));
  v := v || jsonb_build_object('baru', (select count(*) from public.accountability_events) - n,
    'ok', (select jsonb_build_object('kind', kind, 'method', method, 'person', person_id = ${G("p_dua")}, 'schools', institution_ids, 'origin', network_origin, 'hash', identifier_hash)
             from public.accountability_events where id = i),
    'gagal', (select jsonb_build_object('person', person_id = ${G("p_dua")}, 'schools', institution_ids, 'outcome', outcome, 'hash', identifier_hash is not null)
             from public.accountability_events where id = j),
    'tiada', (select jsonb_build_object('person', person_id, 'schools', institution_ids) from public.accountability_events where id = k),
    'A', ${G("inst1")}, 'B', ${G("inst2")});
  -- 2. a print at school A by the person at A and B: A's alone, by its resource
  x := (public.akuntabilitas_catat('PRINT_REQUEST', null, 'OK', ${G("u_dua")}, null, null, null, jsonb_build_object('report', 'laporan.kelas', 'node_id', ${G("node1")}))) ->> 'ref';
  perform set_config('b1.ref', x, true);
  v := v || jsonb_build_object('cetak', (select jsonb_build_object('schools', institution_ids, 'ref', print_ref ~ '^CTK-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$',
      'resource', resource ->> 'report') from public.accountability_events where print_ref = x));
  -- 3. who reads what
  v := v || jsonb_build_object(
    'baca_A', ${baca("adminA", "inst1")}, 'baca_B', ${baca("adminB", "inst2")}, 'baca_C', ${baca("adminC", "inst3")}, 'baca_D', ${baca("adminD", "inst4")},
    'baca_sys', ${baca("sys", null)}, 'baca_sysA', ${baca("sys", "inst1")},
    'A_di_B', ${baca("adminA", "inst2")}, 'A_semua', ${baca("adminA", null)}, 'guru', ${baca("guru", "inst1")},
    'cari_ref_A', ${baca("adminA", "inst1", ", null, %L", ["lower(replace(current_setting('b1.ref'), '-', ' '))"])},
    'cari_ref_B', ${baca("adminB", "inst2", ", null, %L", ["current_setting('b1.ref')"])},
    'cari_hilang', ${baca("adminA", "inst1", `, null, 'CTK-0000-0000'`)},
    'cari_jenis', ${baca("adminA", "inst1", `, 'SIGN_IN_FAILED'`)},
    'sejak_A', pg_temp.b1(${G("u_adminA")}, ${q("select (public.akuntabilitas_sejak('") + ` || current_setting('b1.inst1') || ` + q("'::uuid) <= now())::text")}),
    'sejak_guru', pg_temp.b1(${G("u_guru")}, ${q("select public.akuntabilitas_sejak(null)::text")}));
  -- 4. later changes leave the snapshot as it was: B's role revoked, C's taken again
  update public.role_assignments set revoked_at = now() where person_id = ${G("p_dua")} and scope_node_id = ${G("node2")};
  perform pg_temp.b1_peran_di(${G("p_dua")}, 'EDUCATOR', ${G("node3")}, now() - interval '1 day', now() + interval '300 days', null);
  v := v || jsonb_build_object('nanti', (select institution_ids from public.accountability_events where id = i),
    'nanti_A', ${baca("adminA", "inst1")}, 'nanti_B', ${baca("adminB", "inst2")}, 'nanti_C', ${baca("adminC", "inst3")},
    'kini', public.akuntabilitas_sekolah_orang(${G("p_dua")}, now()));
  -- 5. platform staff: an empty snapshot, the platform admin's only
  i := pg_temp.b1_catat('SIGN_OUT', null, 'OK', ${G("u_sys")}, null, null, null, null);
  v := v || jsonb_build_object('staf', (select institution_ids from public.accountability_events where id = i), 'staf_id', i);
  -- 6. the writer's refusals
  v := v || jsonb_build_object(
    'tulis_masuk', pg_temp.b1(${G("u_guru")}, ${q("select (public.akuntabilitas_catat('SIGN_OUT', null, 'OK', auth.uid(), null, null, null, null)) ->> 'id'")}),
    'tulis_svc_klaim', pg_temp.b1_peran('service_role', ${q("select (public.akuntabilitas_catat('SIGN_OUT', null, 'OK', null, null, null, null, null)) ->> 'id'")}, jsonb_build_object('role', 'authenticated', 'sub', ${G("u_guru")})),
    'tulis_svc', pg_temp.b1_peran('service_role', format(${q("select (public.akuntabilitas_catat('SIGN_IN_FAILED', 'LINK', 'TAUTAN_TIDAK_TERDAFTAR', null, null, %L, null, null)) ->> 'id' is not null")}, repeat('c', 64))),
    'alamat', pg_temp.b1(null, ${q("select public.akuntabilitas_catat('SIGN_IN_FAILED', 'PASSWORD', 'MASUK_TIDAK_COCOK', null, null, null, '203.0.113.77', null)")}),
    'alamat24', pg_temp.b1(null, ${q("select public.akuntabilitas_catat('SIGN_IN_FAILED', 'PASSWORD', 'MASUK_TIDAK_COCOK', null, null, null, '203.0.113.0/16', null)")}),
    'hash_sukses', pg_temp.b1(null, format(${q("select public.akuntabilitas_catat('SIGN_IN_OK', 'PASSWORD', 'OK', %L, null, %L, null, null)")}, ${G("u_dua")}, repeat('d', 64))),
    'sukses_tanpa_orang', pg_temp.b1(null, ${q("select public.akuntabilitas_catat('SIGN_IN_OK', 'PASSWORD', 'OK', null, null, null, null, null)")}),
    'gagal_ok', pg_temp.b1(null, ${q("select public.akuntabilitas_catat('SIGN_IN_FAILED', 'PASSWORD', 'OK', null, null, null, null, null)")}),
    'cetak_tanpa', pg_temp.b1(null, format(${q("select public.akuntabilitas_catat('PRINT_REQUEST', null, 'OK', %L, null, null, null, jsonb_build_object('report', 'laporan.kelas', 'node_id', gen_random_uuid()))")}, ${G("u_dua")})),
    'cetak_dua', pg_temp.b1(null, format(${q("select public.akuntabilitas_catat('PRINT_REQUEST', null, 'OK', %L, null, null, null, jsonb_build_object('report', 'laporan.kelas', 'node_id', %L, 'institution_id', %L))")}, ${G("u_dua")}, ${G("node2")}, ${G("inst1")})),
    'masuk_dengan_sekolah', pg_temp.b1(null, format(${q("select public.akuntabilitas_catat('SIGN_IN_OK', 'PASSWORD', 'OK', %L, null, null, null, jsonb_build_object('report', 'x', 'node_id', %L))")}, ${G("u_dua")}, ${G("node2")})));
  -- 7. no client role touches the store
  v := v || jsonb_build_object(
    'auth_select', pg_temp.b1(${G("u_sys")}, ${q("select count(*)::text from public.accountability_events")}),
    'auth_insert', pg_temp.b1(${G("u_sys")}, ${q("insert into public.accountability_events (kind, outcome, person_id) values ('SIGN_OUT', 'OK', gen_random_uuid()) returning id::text")}),
    'auth_update', pg_temp.b1(${G("u_sys")}, ${q("update public.accountability_events set outcome = 'OK' returning id::text")}),
    'auth_delete', pg_temp.b1(${G("u_sys")}, ${q("delete from public.accountability_events returning id::text")}),
    'anon_select', pg_temp.b1_peran('anon', ${q("select count(*)::text from public.accountability_events")}),
    'anon_baca', pg_temp.b1_peran('anon', ${q("select count(*)::text from public.akuntabilitas_baca()")}),
    'svc_select', pg_temp.b1_peran('service_role', ${q("select count(*)::text from public.accountability_events")}),
    'svc_insert', pg_temp.b1_peran('service_role', ${q("insert into public.accountability_events (kind, outcome, person_id) values ('SIGN_OUT', 'OK', gen_random_uuid()) returning id::text")}),
    'svc_delete', pg_temp.b1_peran('service_role', ${q("delete from public.accountability_events returning id::text")}),
    'auth_tulis', pg_temp.b1(${G("u_sys")}, ${q("select public.akuntabilitas_catat('SIGN_OUT', null, 'OK', auth.uid(), null, null, null, null)::text")}),
    'auth_buang', pg_temp.b1(${G("u_sys")}, ${q("select public.akuntabilitas_buang_lama()::text")}),
    'auth_hitung', pg_temp.b1(${G("u_sys")}, ${q("select public.akuntabilitas_gagal_hitung('SIGN_IN')::text")}));
  v := v || jsonb_build_object('e_ok', current_setting('b1.e_ok'), 'e_gagal', current_setting('b1.e_gagal'), 'e_tiada', current_setting('b1.e_tiada'));
`);
      if (!c.expect(r.ok, `the scenario did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = r.v as Record<string, any>;
      const A = String(v.A), B = String(v.B);
      const ids = (s: unknown) => String(s ?? "").replace(/^ok:/, "").split(",").filter(Boolean).map((x) => x.split("/")[0]);
      const origins = (s: unknown) => String(s ?? "").replace(/^ok:/, "").split(",").filter(Boolean).map((x) => x.split("/").slice(1).join("/"));
      const [eOk, eGagal, eTiada] = [String(v.e_ok), String(v.e_gagal), String(v.e_tiada)];
      // 1.
      c.expect(v.baru === 4, `four writes left ${v.baru} row(s)`);
      c.expect(v.pin_orang === true && v.pin_teks === 0, `a PINTAR ID did not name its person (${v.pin_orang}), or is kept in a row (${v.pin_teks})`);
      c.expect(v.ok?.kind === "SIGN_IN_OK" && v.ok?.method === "PASSWORD" && v.ok?.person === true && v.ok?.origin === "203.0.113.0/24" && v.ok?.hash === null
        && JSON.stringify(v.ok?.schools) === JSON.stringify([A, B].sort()), `the success: ${JSON.stringify(v.ok)} (A ${A}, B ${B})`);
      c.expect(v.gagal?.person === true && v.gagal?.outcome === "MASUK_TIDAK_COCOK" && v.gagal?.hash === true && JSON.stringify(v.gagal?.schools) === JSON.stringify([A, B].sort()),
        `the failure for an address that resolved: ${JSON.stringify(v.gagal)}`);
      c.expect(v.tiada?.person === null && JSON.stringify(v.tiada?.schools) === "[]", `the failure that resolved nobody: ${JSON.stringify(v.tiada)}`);
      // 2.
      c.expect(JSON.stringify(v.cetak?.schools) === JSON.stringify([A]) && v.cetak?.ref === true && v.cetak?.resource === "laporan.kelas", `the print: ${JSON.stringify(v.cetak)}`);
      // 3. blocker 1, and the print by its resource
      const bacaA = ids(v.baca_A), bacaB = ids(v.baca_B);
      c.expect(bacaA.includes(eOk) && bacaA.includes(eGagal) && !bacaA.includes(eTiada) && bacaB.includes(eOk) && bacaB.includes(eGagal) && !bacaB.includes(eTiada),
        `the two schools' admins read A ${v.baca_A}, B ${v.baca_B}`);
      c.expect(ids(v.baca_C).length === 0 && ids(v.baca_D).length === 0 && /^ok:/.test(String(v.baca_C)) && /^ok:/.test(String(v.baca_D)),
        `the school left before (${v.baca_C}) or joined after (${v.baca_D}) reads something`);
      c.expect(bacaA.length === bacaB.length + 1 && bacaA.length >= 4, `the print is not A's alone (A reads ${bacaA.length} rows, B ${bacaB.length})`);
      c.expect([eOk, eGagal, eTiada].every((x) => ids(v.baca_sys).includes(x)) && !ids(v.baca_sysA).includes(eTiada) && ids(v.baca_sysA).includes(eOk),
        `the platform admin reads ${v.baca_sys} (with A named: ${v.baca_sysA})`);
      c.expect(origins(v.baca_A).every((o) => o === "-") && origins(v.baca_sys).includes("203.0.113.0/24") && origins(v.baca_sys).includes("2001:db8:a::/48"),
        `the network origin reaches someone other than the platform admin (A: ${v.baca_A}; platform: ${v.baca_sys})`);
      for (const k of ["A_di_B", "A_semua", "guru", "sejak_guru"]) c.expect(String(v[k]) === "PR200:ACCOUNTABILITY_NOT_ALLOWED", `${k}: ${v[k]} (expected PR200:ACCOUNTABILITY_NOT_ALLOWED)`);
      c.expect(ids(v.cari_ref_A).length === 1 && ids(v.cari_ref_B).length === 0 && v.cari_hilang === "ok:" && v.sejak_A === "ok:true",
        `a print reference, typed: A ${v.cari_ref_A}, B ${v.cari_ref_B}; an absent one ${v.cari_hilang}; since ${v.sejak_A}`);
      c.expect(ids(v.cari_jenis).length === 2 && ids(v.cari_jenis).includes(eGagal) && !ids(v.cari_jenis).includes(eOk), `the kind filter: ${v.cari_jenis}`);
      // 4. the snapshot does not move
      c.expect(JSON.stringify(v.nanti) === JSON.stringify([A, B].sort()) && ids(v.nanti_B).includes(eOk) && !ids(v.nanti_C).includes(eOk)
        && JSON.stringify(v.kini) !== JSON.stringify(v.nanti), `after the person's roles changed the stored snapshot reads ${JSON.stringify(v.nanti)} (now ${JSON.stringify(v.kini)}); B ${v.nanti_B}; C ${v.nanti_C}`);
      // 5.
      c.expect(JSON.stringify(v.staf) === "[]" && ids(v.baca_sys).length >= 3, `platform staff's snapshot: ${JSON.stringify(v.staf)}`);
      // 6. the writer's refusals
      c.expect(/^42501:/.test(String(v.tulis_masuk)) && v.tulis_svc === "ok:true" && v.tulis_svc_klaim === "PR200:ACCOUNTABILITY_NOT_SERVICE",
        `a signed-in caller writing: ${v.tulis_masuk}; the service with a user's claims: ${v.tulis_svc_klaim}; the service: ${v.tulis_svc}`);
      for (const [k, harap] of [["alamat", "ACCOUNTABILITY_ORIGIN_INVALID"], ["alamat24", "ACCOUNTABILITY_ORIGIN_INVALID"], ["hash_sukses", "ACCOUNTABILITY_HASH_INVALID"],
        ["sukses_tanpa_orang", "ACCOUNTABILITY_EVENT_INVALID"], ["gagal_ok", "ACCOUNTABILITY_EVENT_INVALID"], ["cetak_tanpa", "ACCOUNTABILITY_RESOURCE_INVALID"],
        ["cetak_dua", "ACCOUNTABILITY_RESOURCE_INVALID"], ["masuk_dengan_sekolah", "ACCOUNTABILITY_RESOURCE_INVALID"]] as const) {
        c.expect(String(v[k]) === `PR200:${harap}`, `${k}: ${v[k]} (expected PR200:${harap})`);
      }
      // 7.
      for (const k of ["auth_select", "auth_insert", "auth_update", "auth_delete", "anon_select", "anon_baca", "svc_select", "svc_insert", "svc_delete", "auth_tulis", "auth_buang", "auth_hitung"]) {
        c.expect(/^42501:/.test(String(v[k])), `${k}: ${v[k]} (expected a refusal of privilege, 42501)`);
      }
      return c.verdict("a successful and a failed sign-in each left exactly one row; the person at schools A and B is read by both admins, and by "
        + "neither the school they left before nor the one they join after; revoking B and joining C afterwards moved no stored snapshot; a print "
        + "at A by that person is A's alone; an unresolved identifier and platform staff hold an empty snapshot, read by the platform admin only; "
        + "the network origin is the platform admin's alone; a reference typed in any form finds its print; the writer refuses a signed-in caller, "
        + "an address, a hash on a success, a success with nobody, a print with no school's resource and a sign-in with one; no client role, the "
        + "service role included, selects, inserts, updates or deletes, and none but the service may write, purge or count");
    },
  },
  {
    id: "B1-S02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const r = jalankan(`
${DUNIA}
  perform pg_temp.b1_orang('pergi', 'EDUCATOR', ${G("node1")});
  perform pg_temp.b1_orang('tetap', 'EDUCATOR', ${G("node1")});
  i := pg_temp.b1_catat('SIGN_IN_FAILED', 'PASSWORD', 'MASUK_TIDAK_COCOK', null, 'b1-pergi-' || current_setting('b1.tag') || '@local.invalid', repeat('e', 64), '203.0.113.0/24', null);
  j := pg_temp.b1_catat('SIGN_IN_OK', 'PASSWORD', 'OK', ${G("u_pergi")}, null, null, '2001:db8:a::/48', null);
  k := pg_temp.b1_catat('SIGN_IN_FAILED', 'PASSWORD', 'MASUK_TIDAK_COCOK', null, 'b1-tetap-' || current_setting('b1.tag') || '@local.invalid', repeat('f', 64), '198.51.100.0/24', null);
  perform set_config('b1.i', i::text, true); perform set_config('b1.j', j::text, true); perform set_config('b1.k', k::text, true);
  v := v || jsonb_build_object('sebelum', (select jsonb_agg(jsonb_build_array(id, kind, at, person_id, network_origin, identifier_hash) order by id) from public.accountability_events where id in (i, j, k)));
  -- the same update, without the marker; with another person's; touching another column with the right one
  v := v || jsonb_build_object(
    'tanpa', pg_temp.b1(null, format(${q("update public.accountability_events set network_origin = null, identifier_hash = null where id = %s returning id::text")}, i)),
    'lain', pg_temp.b1_dengan('pintar.akuntabilitas_anonimkan', current_setting('b1.p_tetap'), format(${q("update public.accountability_events set network_origin = null, identifier_hash = null where id = %s returning id::text")}, i)),
    'kolom', pg_temp.b1_dengan('pintar.akuntabilitas_anonimkan', current_setting('b1.p_pergi'), format(${q("update public.accountability_events set network_origin = null, identifier_hash = null, outcome = 'OK', kind = 'SIGN_IN_OK' where id = %s returning id::text")}, i)),
    'separuh', pg_temp.b1_dengan('pintar.akuntabilitas_anonimkan', current_setting('b1.p_pergi'), format(${q("update public.accountability_events set network_origin = '10.0.0.0/24' where id = %s returning id::text")}, i)),
    'hapus', pg_temp.b1(null, format(${q("delete from public.accountability_events where id = %s returning id::text")}, i)));
  perform set_config('pintar.akuntabilitas_anonimkan', '', true);
  -- the governed deletion, as the product does it: the person asks for deletion, closes the account; the platform admin deletes
  perform selftest.as_user_uid(${G("u_pergi")});
  perform public.minta_akun('DELETE_PERSONAL_DATA', true);
  perform public.minta_akun('CLOSE', true);
  perform selftest.as_owner();
  v := v || jsonb_build_object('hapus_data', pg_temp.b1(${G("u_sys")}, format(${q("select (public.hapus_data_pribadi(%L, null)) ->> 'ok'")},
    (select q.id from public.account_requests q where q.person_id = ${G("p_pergi")} and q.kind = 'DELETE_PERSONAL_DATA'))));
  v := v || jsonb_build_object('sesudah', (select jsonb_agg(jsonb_build_array(id, kind, at, person_id, network_origin, identifier_hash) order by id) from public.accountability_events where id in (i, j, k)),
    'penanda', coalesce(current_setting('pintar.akuntabilitas_anonimkan', true), ''));
`);
      if (!c.expect(r.ok, `the scenario did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = r.v as Record<string, any>;
      for (const k of ["tanpa", "lain", "kolom", "separuh", "hapus"]) c.expect(String(v[k]) === "PR200:ACCOUNTABILITY_INSERT_ONLY", `${k}: ${v[k]} (expected PR200:ACCOUNTABILITY_INSERT_ONLY)`);
      c.expect(v.hapus_data === "ok:true", `the deletion did not run: ${v.hapus_data}`);
      const a = (v.sebelum ?? []) as unknown[][], b = (v.sesudah ?? []) as unknown[][];
      c.expect(a.length === 3 && b.length === 3, `the rows before ${a.length} and after ${b.length}`);
      if (a.length === 3 && b.length === 3) {
        for (const n of [0, 1]) {
          c.expect(JSON.stringify(b[n].slice(0, 4)) === JSON.stringify(a[n].slice(0, 4)) && b[n][4] === null && b[n][5] === null,
            `the deleted person's row ${n + 1} after L4: ${JSON.stringify(b[n])} (before ${JSON.stringify(a[n])})`);
        }
        c.expect(a[0][3] !== null && a[0][5] !== null && a[1][4] !== null, "the fixture's rows hold no person, hash or origin to clear");
        c.expect(JSON.stringify(b[2]) === JSON.stringify(a[2]), `another person's row moved: ${JSON.stringify(a[2])} -> ${JSON.stringify(b[2])}`);
      }
      return c.verdict("after hapus_data_pribadi the person's two rows keep their kind, instant and person and hold no origin and no hash; the same "
        + "update without the marker, under another person's marker, touching the outcome and kind, or writing an origin, and any delete, are "
        + "refused; another person's row is byte for byte as it was");
    },
  },
  {
    id: "B1-S03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const r = jalankan(`
${DUNIA}
  insert into public.accountability_events (at, kind, method, outcome, person_id) values
    (now() - interval '12 months 1 day', 'SIGN_IN_OK', 'PASSWORD', 'OK', ${G("p_dua")}) returning id into i;
  insert into public.accountability_events (at, kind, method, outcome, person_id) values
    (now() - interval '11 months', 'SIGN_IN_OK', 'PASSWORD', 'OK', ${G("p_dua")}) returning id into j;
  insert into public.accountability_events (at, kind, method, outcome, person_id) values
    (now() - interval '12 months' + interval '1 hour', 'SIGN_OUT', null, 'OK', ${G("p_dua")}) returning id into k;
  n := (select count(*) from public.audit_log where action = 'accountability.purged');
  v := v || jsonb_build_object(
    'hapus_luar', pg_temp.b1(null, format(${q("delete from public.accountability_events where id = %s returning id::text")}, i)),
    'hapus_penanda_baru', pg_temp.b1_dengan('pintar.akuntabilitas_buang', 'on', format(${q("delete from public.accountability_events where id = %s returning id::text")}, j)),
    'truncate', pg_temp.b1(null, ${q("truncate public.accountability_events")}),
    'aktor', pg_temp.b1(${G("u_sys")}, ${q("select public.akuntabilitas_buang_lama()::text")}));
  perform set_config('pintar.akuntabilitas_buang', '', true);
  v := v || jsonb_build_object('jalan1', public.akuntabilitas_buang_lama());
  v := v || jsonb_build_object(
    'ada', (select jsonb_agg(id order by id) from public.accountability_events where id in (i, j, k)),
    'audit1', (select count(*) from public.audit_log where action = 'accountability.purged') - n,
    'audit_isi', (select summary from public.audit_log where action = 'accountability.purged' order by id desc limit 1),
    'i', i, 'j', j, 'k', k);
  v := v || jsonb_build_object('jalan2', public.akuntabilitas_buang_lama());
  v := v || jsonb_build_object(
    'audit2', (select count(*) from public.audit_log where action = 'accountability.purged') - n);
  v := v || jsonb_build_object('svc', pg_temp.b1_peran('service_role', ${q("select (public.akuntabilitas_buang_lama()) ->> 'ok'")}));
  v := v || jsonb_build_object('konstanta', (select prosrc ~ 'v_umur constant interval := interval ''12 months''' from pg_proc where proname = 'akuntabilitas_buang_lama'));
`);
      if (!c.expect(r.ok, `the scenario did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = r.v as Record<string, any>;
      for (const k of ["hapus_luar", "hapus_penanda_baru", "truncate"]) c.expect(String(v[k]) === "PR200:ACCOUNTABILITY_INSERT_ONLY", `${k}: ${v[k]}`);
      c.expect(/^42501:/.test(String(v.aktor)), `a signed-in caller purging: ${v.aktor}`);
      c.expect(JSON.stringify(v.ada) === JSON.stringify([v.j, v.k]), `after the purge the rows ${JSON.stringify(v.ada)} remain of ${v.i} (12 months and a day), ${v.j} (11 months), ${v.k} (12 months less an hour)`);
      const s = v.audit_isi ?? {};
      c.expect(v.audit1 === 1 && s.deleted === v.jalan1?.dihapus && Number(s.deleted) >= 1 && typeof s.oldest === "string" && typeof s.newest === "string" && s.kept_for === "12 months",
        `the purge's audit: ${v.audit1} row(s), ${JSON.stringify(s)}; the run ${JSON.stringify(v.jalan1)}`);
      c.expect(v.jalan2?.dihapus === 0 && v.audit2 === 1 && v.svc === "ok:true", `a second run: ${JSON.stringify(v.jalan2)}, audit rows ${v.audit2}; the service's run ${v.svc}`);
      c.expect(v.konstanta === true, "twelve months is not the purge's own constant");
      return c.verdict("a row aged twelve months and a day is purged and one audit row records how many and the oldest and newest instant; a row "
        + "at eleven months and one an hour short of twelve stay; a second run deletes nothing and writes no audit row; a delete outside the "
        + "purge, a delete of a younger row under the purge's marker, and a truncate are refused; a signed-in caller may not purge; twelve months "
        + "is the function's constant");
    },
  },
  {
    id: "B1-S04",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const r = jalankan(`
  v := v || jsonb_build_object(
    'sumber', pg_temp.b1(null, ${q("insert into public.metric_sources (catalogue_version, source_relation, why) select version, 'accountability_events', 'uji' from public.metric_catalogue limit 1 returning source_relation")}),
    'sumber2', pg_temp.b1(null, ${q("insert into public.metric_sources (catalogue_version, source_relation, why) select version, 'accountability_write_failures', 'uji' from public.metric_catalogue limit 1 returning source_relation")}),
    'asli', (select to_jsonb(a) from public.assert_accountability_is_not_evidence() a));
  create function public.calc_b1_uji() returns bigint language sql set search_path = public, pg_temp as 'select count(*) from public.accountability_events';
  v := v || jsonb_build_object('kalkulator', (select to_jsonb(a) from public.assert_accountability_is_not_evidence() a));
  drop function public.calc_b1_uji();
  create view public.b1_uji_lihat as select id, at from public.accountability_events;
  v := v || jsonb_build_object('lihat', (select to_jsonb(a) from public.assert_accountability_is_not_evidence() a));
  drop view public.b1_uji_lihat;
  v := v || jsonb_build_object('kembali', (select to_jsonb(a) from public.assert_accountability_is_not_evidence() a));
`);
      if (!c.expect(r.ok, `the scenario did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = r.v as Record<string, any>;
      c.expect(v.sumber === "PR200:ACCOUNTABILITY_NOT_A_SOURCE" && v.sumber2 === "PR200:ACCOUNTABILITY_NOT_A_SOURCE", `declaring the store a metric source: ${v.sumber}, ${v.sumber2}`);
      c.expect(v.asli?.ok === true && v.kembali?.ok === true, `the boundary does not hold as built: ${JSON.stringify(v.asli)}`);
      c.expect(v.kalkulator?.ok === false && /calc_b1_uji/.test(String(v.kalkulator?.detail)), `a calculator reading the store passes: ${JSON.stringify(v.kalkulator)}`);
      c.expect(v.lihat?.ok === false && /b1_uji_lihat/.test(String(v.lihat?.detail)), `a view over the store passes: ${JSON.stringify(v.lihat)}`);
      return c.verdict("metric_sources refuses the sign-in record and its failure count; the boundary assertion holds as built and fails, by name, for "
        + "a calculator that reads the store and for a view built over it");
    },
  },
  {
    id: "B1-R01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const jadwal = (() => { try { return tanpaKomentarSql(readFileSync(join(repoRoot, MIGRASI_B1_JADWAL), "utf8")); } catch { return ""; } })();
      const r = jalankan(`
  v := v || jsonb_build_object('daftar', (select jsonb_agg(jsonb_build_array(jobname, schedule, command) order by jobname) from public.pintar_jadwal_daftar()),
    'cron', (select jsonb_agg(jsonb_build_array(jobname, schedule, command, active, database = current_database()) order by jobname) from cron.job where jobname like 'pintar-%'),
    'sehat0', public.pintar_periksa_kesehatan());
  perform cron.unschedule('pintar-akuntabilitas-buang-lama');
  v := v || jsonb_build_object('hilang', public.pintar_periksa_kesehatan());
  perform cron.alter_job((select jobid from cron.job where jobname = 'pintar-pengerjaan-tutup-terjadwal'), schedule := '*/7 * * * *');
  perform cron.schedule('pintar-tidak-dideklarasikan', '0 1 * * *', 'select 1');
  v := v || jsonb_build_object('beda', public.pintar_periksa_kesehatan());
  perform cron.unschedule('pintar-tidak-dideklarasikan');
  v := v || jsonb_build_object('pasang', public.pengerjaan_jadwal_pasang());
  v := v || jsonb_build_object('pasang2', public.pintar_jadwal_pasang());
  v := v || jsonb_build_object(
    'sesudah', (select jsonb_agg(jsonb_build_array(jobname, count) order by jobname) from (select jobname, count(*) from cron.job where jobname like 'pintar-%' group by jobname) x),
    'sehat1', public.pintar_periksa_kesehatan());
  perform public.akuntabilitas_gagal_hitung('SIGN_IN');
  perform public.akuntabilitas_gagal_hitung('SIGN_IN');
  v := v || jsonb_build_object('gagal', public.pintar_periksa_kesehatan());
  v := v || jsonb_build_object(
    'klien', pg_temp.b1_peran('service_role', ${q("select public.pintar_periksa_kesehatan()::text")}),
    'klien_pasang', pg_temp.b1_peran('service_role', ${q("select public.pintar_jadwal_pasang()::text")}));
`);
      if (!c.expect(r.ok, `the scenario did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = r.v as Record<string, any>;
      const DUA = [["pintar-akuntabilitas-buang-lama", "17 19 * * *", "select public.akuntabilitas_buang_lama()"],
        // RESTATED, A2a change C, D6.6 (migration 20270119150000): the closer's job calls its procedure. Was: select public.pengerjaan_tutup_terjadwal()
        ["pintar-pengerjaan-tutup-terjadwal", "*/5 * * * *", "call public.pengerjaan_tutup_berkala()"]];
      c.expect(JSON.stringify(v.daftar) === JSON.stringify(DUA), `the declaration: ${JSON.stringify(v.daftar)}`);
      c.expect(JSON.stringify(v.cron) === JSON.stringify(DUA.map((d) => [...d, true, true])), `cron.job holds ${JSON.stringify(v.cron)}`);
      c.expect(v.sehat0?.ok === true || (v.sehat0?.hilang?.length === 0 && v.sehat0?.berbeda?.length === 0), `the health read as installed: ${JSON.stringify(v.sehat0)}`);
      c.expect(JSON.stringify(v.hilang?.hilang) === JSON.stringify(["pintar-akuntabilitas-buang-lama"]) && v.hilang?.ok === false, `a job removed by hand: ${JSON.stringify(v.hilang)}`);
      c.expect(v.beda?.berbeda?.length === 1 && v.beda.berbeda[0].jobname === "pintar-pengerjaan-tutup-terjadwal" && v.beda.berbeda[0].schedule === "*/7 * * * *"
        && JSON.stringify(v.beda?.tidak_dideklarasikan) === JSON.stringify(["pintar-tidak-dideklarasikan"]) && v.beda?.ok === false, `a changed and an undeclared job: ${JSON.stringify(v.beda)}`);
      c.expect(v.pasang?.ok === true && v.pasang?.jobname === "pintar-pengerjaan-tutup-terjadwal" && v.pasang?.schedule === "*/5 * * * *" && Array.isArray(v.pasang?.jobs) && v.pasang.jobs.length === 2
        && v.pasang2?.ok === true && JSON.stringify(v.sesudah) === JSON.stringify([["pintar-akuntabilitas-buang-lama", 1], ["pintar-pengerjaan-tutup-terjadwal", 1]])
        && v.sehat1?.hilang?.length === 0 && v.sehat1?.berbeda?.length === 0, `installing again (A1's installer, then the shared one): ${JSON.stringify(v.pasang)}; ${JSON.stringify(v.sesudah)}; ${JSON.stringify(v.sehat1)}`);
      c.expect(v.gagal?.ok === false && Number(v.gagal?.gagal_tulis_akuntabilitas?.n) >= 2, `two counted writer failures: ${JSON.stringify(v.gagal?.gagal_tulis_akuntabilitas)}`);
      c.expect(/^42501:/.test(String(v.klien)) && /^42501:/.test(String(v.klien_pasang)), `the service role reads the health or installs: ${v.klien} ${v.klien_pasang}`);
      // the source: A1's installer is a call to the one installer; the migration installs through it; nothing else schedules
      const a1 = /create or replace function public\.pengerjaan_jadwal_pasang\(\)[\s\S]*?end \$\$;/.exec(jadwal)?.[0] ?? "";
      c.expect(/v := public\.pintar_jadwal_pasang\(\);/.test(a1) && !/cron\.(un)?schedule/.test(a1), "A1's installer is not a call to the shared one");
      c.expect(/^select public\.pintar_jadwal_pasang\(\);$/m.test(jadwal) && [...jadwal.matchAll(/cron\.schedule\(/g)].length === 1, "the migration does not install through the one installer alone");
      return c.verdict("both jobs are declared with their names, schedules and commands and installed once as declared; a job removed by hand is "
        + "reported missing, a changed schedule different and an undeclared pintar-* job named; A1's installer, now a call to the shared one, and "
        + "the shared one restore each job once; two counted writer failures make the health read report them; neither the installer nor the "
        + "health read is the service role's");
    },
  },
  {
    id: "B1-S05",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      // Sharon's result review at 40e89308 (the defect): the reader showed a school's administrator the person's other
      // schools. The snapshot stays stored whole; a school is shown its own school of it, the platform admin all of it.
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const lihat = (siapa: string, sekolah: string | null) =>
        `pg_temp.b1(${G(`u_${siapa}`)}, format(${q("select coalesce(string_agg(id::text || '=' || institution_ids::text || '/' || coalesce(nama, '-') || '/' || coalesce(network_origin, '-') || '/' || coalesce(resource::text, '-'), ';' order by id), '') from public.akuntabilitas_baca(%L::uuid)")}, ${sekolah ? `current_setting('b1.${sekolah}')` : "null"}))`;
      const r = jalankan(`
${DUNIA}
  i := pg_temp.b1_catat('SIGN_IN_OK', 'PASSWORD', 'OK', ${G("u_dua")}, null, null, '203.0.113.0/24', null);
  perform set_config('b1.e', i::text, true);
  -- a print at A by the same person, and one at B
  perform public.akuntabilitas_catat('PRINT_REQUEST', null, 'OK', ${G("u_dua")}, null, null, '203.0.113.0/24', jsonb_build_object('report', 'laporan.kelas', 'node_id', ${G("node1")}));
  perform public.akuntabilitas_catat('PRINT_REQUEST', null, 'OK', ${G("u_dua")}, null, null, '203.0.113.0/24', jsonb_build_object('report', 'laporan.kelas', 'node_id', ${G("node2")}));
  v := v || jsonb_build_object('A', ${G("inst1")}, 'B', ${G("inst2")}, 'e', i,
    'disimpan', (select institution_ids::text from public.accountability_events where id = i),
    'lihat_A', ${lihat("adminA", "inst1")}, 'lihat_B', ${lihat("adminB", "inst2")},
    'lihat_sys', ${lihat("sys", null)}, 'lihat_sysA', ${lihat("sys", "inst1")});
`);
      if (!c.expect(r.ok, `the scenario did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = r.v as Record<string, any>;
      const A = String(v.A), B = String(v.B), id = String(v.e);
      const baris = (s: unknown) => String(s ?? "").replace(/^ok:/, "").split(";").filter(Boolean).map((x) => { const [k, rest] = x.split("="); const [ids, nama, asal, res] = rest.split("/"); return { k, ids, nama, asal, res }; });
      const satu = (s: unknown) => baris(s).find((b) => b.k === id);
      const dua = `{${[A, B].sort().join(",")}}`;
      c.expect(v.disimpan === dua, `the stored snapshot is not kept whole: ${v.disimpan}`);
      c.expect(satu(v.lihat_A)?.ids === `{${A}}`, `school A's admin is shown ${satu(v.lihat_A)?.ids}, not {${A}} alone`);
      c.expect(satu(v.lihat_B)?.ids === `{${B}}`, `school B's admin is shown ${satu(v.lihat_B)?.ids}, not {${B}} alone`);
      c.expect(satu(v.lihat_sys)?.ids === dua && satu(v.lihat_sysA)?.ids === dua, `the platform admin is shown ${satu(v.lihat_sys)?.ids} / ${satu(v.lihat_sysA)?.ids}, not ${dua}`);
      // the other columns: no other school's id anywhere in a school's rows; no origin; only its own prints
      for (const [k, sendiri, lain] of [["lihat_A", A, B], ["lihat_B", B, A]] as const) {
        const bs = baris(v[k]);
        c.expect(bs.length > 0 && bs.every((b) => !b.ids.includes(lain) && b.asal === "-" && !b.res.includes(lain)), `${k} shows something of the other school: ${String(v[k]).slice(0, 400)}`);
        c.expect(bs.filter((b) => b.res !== "-").length === 1, `${k} does not read exactly its own one print: ${String(v[k]).slice(0, 400)}`);
        void sendiri;
      }
      return c.verdict("the person at A and B keeps the whole snapshot stored; A's admin is shown {A} alone, B's admin {B} alone, the platform admin "
        + "both (in «Seluruh platform» and with A named); no row a school reads holds the other school's id, an origin or the other school's print");
    },
  },
  {
    id: "B1-S06",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      // the coordinator's check 2c: a learner moved from A to B by the product's own transfer (transfer_minta by A's admin,
      // transfer_terima and transfer_execute by B's): before it A reads the learner's events, after it B
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const r = jalankan(`
  perform set_config('b1.alpha', (select i.id::text from public.institutions i where i.is_synthetic and i.slug like 'synth-alpha-%' order by i.created_at desc limit 1), true);
  perform set_config('b1.beta', (select i.id::text from public.institutions i where i.is_synthetic and i.slug like 'synth-beta-%' order by i.created_at desc limit 1), true);
  perform set_config('b1.u_murid', selftest.f11_user('b1-pindah-' || current_setting('b1.tag') || '@local.invalid', null, null)::text, true);
  perform set_config('b1.p_murid', (select a.person_id::text from public.accounts a where a.auth_user_id = ${G("u_murid")}), true);
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  values (${G("p_murid")}, ${G("alpha")}, (select id from public.academic_periods where institution_id = ${G("alpha")} and name = 'TA 2027/2028'),
          (select id from public.org_nodes where institution_id = ${G("alpha")} and kind = 'PROGRAMME'), 'ACTIVE') returning id::text into x;
  perform set_config('b1.enr', x, true);
  i := pg_temp.b1_catat('SIGN_IN_OK', 'PASSWORD', 'OK', ${G("u_murid")}, null, null, null, null);
  -- the transfer, as the product makes it today (20261219100000): asked by name by the sending school, accepted
  -- with its year and programme by the receiving school, then carried out
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  perform set_config('b1.tf', public.transfer_minta(${G("enr")}, ${G("beta")}, 'uji B1 pindah sekolah')::text, true);
  perform selftest.as_user('beta-admin@synthetic.pintar.test');
  -- into one of Beta's Kelas, in that Kelas's school year
  perform public.transfer_terima(${G("tf")}, (select n.academic_period_id from public.org_nodes n where n.institution_id = ${G("beta")} and n.kind = 'CLASS' and n.is_active order by n.name limit 1),
    (select id from public.org_nodes where institution_id = ${G("beta")} and kind = 'PROGRAMME' and is_active limit 1),
    (select n.id from public.org_nodes n where n.institution_id = ${G("beta")} and n.kind = 'CLASS' and n.is_active order by n.name limit 1));
  perform public.transfer_execute(${G("tf")});
  perform selftest.as_owner();
  j := pg_temp.b1_catat('SIGN_IN_OK', 'PASSWORD', 'OK', ${G("u_murid")}, null, null, null, null);
  v := v || jsonb_build_object('i', i, 'j', i, 'j2', j,
    'snap_i', (select institution_ids::text from public.accountability_events where id = i),
    'snap_j', (select institution_ids::text from public.accountability_events where id = j),
    'alpha', current_setting('b1.alpha'), 'beta', current_setting('b1.beta'),
    'enr_lama', (select status::text from public.enrollments where id = ${G("enr")}));
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  v := v || jsonb_build_object('baca_alpha', (select coalesce(string_agg(id::text, ',' order by id), '') from public.akuntabilitas_baca(current_setting('b1.alpha')::uuid) where id in (i, j)));
  perform selftest.as_user('beta-admin@synthetic.pintar.test');
  v := v || jsonb_build_object('baca_beta', (select coalesce(string_agg(id::text, ',' order by id), '') from public.akuntabilitas_baca(current_setting('b1.beta')::uuid) where id in (i, j)));
  perform selftest.as_owner();
`);
      if (!c.expect(r.ok, `the scenario did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = r.v as Record<string, any>;
      c.expect(v.enr_lama === "ENDED", `the transfer did not end the sending enrolment (${v.enr_lama})`);
      c.expect(v.snap_i === `{${v.alpha}}` && v.snap_j === `{${v.beta}}`, `the snapshots before and after the transfer: ${v.snap_i}, ${v.snap_j}`);
      c.expect(v.baca_alpha === String(v.i) && v.baca_beta === String(v.j2), `before the transfer A reads ${v.baca_alpha || "nothing"} and B reads ${v.baca_beta || "nothing"} (before ${v.i}, after ${v.j2})`);
      return c.verdict("a learner moved from Alpha to Beta through transfer_minta, transfer_terima and transfer_execute: the sign-in before it "
        + "holds {Alpha} and is read by Alpha's admin only; the one after it holds {Beta} and is read by Beta's admin only");
    },
  },
  {
    id: "B1-S07",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      // the coordinator's follow-up 3a and check 2d: retention past twelve months is never silent (the health read names
      // it; the purge runs batch after batch until it is gone); the purge's audit row is the platform admin's (audit_log's
      // own bounds: no school), and a purged print's reference finds nothing in the reader
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const r = jalankan(`
${DUNIA}
  insert into public.accountability_events (at, kind, method, outcome, person_id, institution_ids)
  select now() - interval '12 months 2 days' - (g || ' seconds')::interval, 'SIGN_OUT', null, 'OK', ${G("p_dua")}, array[${G("inst1")}]
    from generate_series(1, 120) g;
  insert into public.accountability_events (at, kind, outcome, person_id, institution_ids, resource, print_ref)
  values (now() - interval '12 months 2 days', 'PRINT_REQUEST', 'OK', ${G("p_dua")}, array[${G("inst1")}],
          jsonb_build_object('report', 'laporan.kelas', 'node_id', ${G("node1")}), 'CTK-B1S7-0AAA');
  v := v || jsonb_build_object('sebelum', public.pintar_periksa_kesehatan() -> 'lewat_retensi_akuntabilitas',
    'ok_sebelum', public.pintar_periksa_kesehatan() -> 'ok',
    'ref_sebelum', pg_temp.b1(${G("u_adminA")}, format(${q("select count(*)::text from public.akuntabilitas_baca(%L::uuid, null, 'CTK-B1S7-0AAA')")}, current_setting('b1.inst1'))));
  v := v || jsonb_build_object('jalan', public.akuntabilitas_buang_lama(1));
  v := v || jsonb_build_object('sesudah', public.pintar_periksa_kesehatan() -> 'lewat_retensi_akuntabilitas',
    'ref_sesudah', pg_temp.b1(${G("u_adminA")}, format(${q("select count(*)::text from public.akuntabilitas_baca(%L::uuid, null, 'CTK-B1S7-0AAA')")}, current_setting('b1.inst1'))),
    'audit_id', (select max(id) from public.audit_log where action = 'accountability.purged'));
  perform set_config('b1.audit', (v ->> 'audit_id'), true);
  v := v || jsonb_build_object(
    'audit_sys', pg_temp.b1(${G("u_sys")}, ${q("select count(*)::text from public.audit_log where id = current_setting('b1.audit')::bigint")}),
    'audit_A', pg_temp.b1(${G("u_adminA")}, ${q("select count(*)::text from public.audit_log where id = current_setting('b1.audit')::bigint")}),
    'audit_isi', (select jsonb_build_object('inst', institution_id, 'deleted', summary -> 'deleted') from public.audit_log where id = current_setting('b1.audit')::bigint));
`);
      if (!c.expect(r.ok, `the scenario did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = r.v as Record<string, any>;
      c.expect(Number(v.sebelum?.n) >= 121 && typeof v.sebelum?.tertua === "string" && v.ok_sebelum === false,
        `rows past twelve months and a day are not a named finding of the health read: ${JSON.stringify(v.sebelum)}, ok ${v.ok_sebelum}`);
      c.expect(Number(v.jalan?.dihapus) >= 121 && Number(v.sesudah?.n) === 0, `one run in batches of one left rows past the twelve months: ${JSON.stringify(v.jalan)}; then ${JSON.stringify(v.sesudah)}`);
      c.expect(v.ref_sebelum === "ok:1" && v.ref_sesudah === "ok:0", `a purged print's reference: before ${v.ref_sebelum}, after ${v.ref_sesudah}`);
      c.expect(v.audit_sys === "ok:1" && v.audit_A === "ok:0" && v.audit_isi?.inst === null && Number(v.audit_isi?.deleted) >= 121,
        `the purge's audit row: the platform admin ${v.audit_sys}, a school admin ${v.audit_A}; ${JSON.stringify(v.audit_isi)}`);
      return c.verdict("121 rows past twelve months and a day are a named, not-ok finding of the health read; one purge run in batches of one row "
        + "removes them all and the finding clears; a purged print's reference finds nothing; the purge's audit row (no school) is read by the "
        + "platform admin and not by a school's admin");
    },
  },
  {
    id: "B1-C01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const N = 600;
      const ambilPerson = psql("select person_id from public.accounts order by created_at limit 1").out;
      // the scenario's rows: sign-outs aged thirteen months (nothing else in a test database is that old)
      const tanam = psql(`insert into public.accountability_events (at, kind, method, outcome, person_id, institution_ids)
        select now() - interval '13 months' - (g || ' seconds')::interval, 'SIGN_OUT', null, 'OK', '${ambilPerson}'::uuid, '{}'::uuid[]
          from generate_series(1, ${N}) g;
        select count(*) from public.accountability_events where at < now() - interval '12 months';`);
      const sisa = () => psql("select count(*) from public.accountability_events where at < now() - interval '12 months'").out;
      const audit = () => psql("select coalesce(sum((summary ->> 'deleted')::int), 0) || '|' || count(*) from public.audit_log where action = 'accountability.purged'").out;
      const auditAwal = audit();
      const jumlahAwal = Number(tanam.out.split("\n").pop() ?? 0);
      try {
        if (!c.expect(tanam.ok && jumlahAwal >= N, `the aged rows were not planted: ${tanam.err}`)) return c.verdict("");
        // 1. run 1 takes every aged row and holds them; run 2, at once, deletes none of them and does not wait
        const satu = psqlLain(`begin; select (public.akuntabilitas_buang_lama(50)) ->> 'dihapus'; select pg_sleep(4); commit;`);
        await tidur(1500);
        const dua = await psqlLain(`select (public.akuntabilitas_buang_lama(50)) ->> 'dihapus'`);
        const s1 = await satu;
        c.expect(s1.ok && dua.ok && Number(dua.out) === 0 && dua.ms < 3000 && Number(s1.out.split("\n").filter(Boolean)[0]) === jumlahAwal,
          `two runs at once: run 1 deleted ${s1.out.split("\n")[0]} (${s1.err}), run 2 ${dua.out} in ${dua.ms} ms (${dua.err})`);
        // 2. another run's batch in flight (half the rows locked): this run deletes the rest; once released, the next run the locked half
        psql(`insert into public.accountability_events (at, kind, method, outcome, person_id, institution_ids)
          select now() - interval '13 months' - (g || ' seconds')::interval, 'SIGN_OUT', null, 'OK', '${ambilPerson}'::uuid, '{}'::uuid[] from generate_series(1, ${N}) g`);
        const tahan = psqlLain(`begin; select count(*) from (select id from public.accountability_events where at < now() - interval '12 months' order by id limit ${N / 2} for update) x; select pg_sleep(4); commit;`);
        await tidur(1500);
        const tiga = await psqlLain(`select (public.akuntabilitas_buang_lama(50)) ->> 'dihapus'`);
        await tahan;
        const empat = await psqlLain(`select (public.akuntabilitas_buang_lama(50)) ->> 'dihapus'`);
        c.expect(tiga.ok && empat.ok && Number(tiga.out) === N / 2 && Number(empat.out) === N / 2 && tiga.ms < 3000,
          `beside a batch in flight: this run deleted ${tiga.out} in ${tiga.ms} ms, the next ${empat.out} (${tiga.err} ${empat.err})`);
        const [jAudit, nAudit] = audit().split("|").map(Number);
        const [jAwal, nAwal] = auditAwal.split("|").map(Number);
        c.expect(sisa() === "0" && jAudit - jAwal === jumlahAwal + N && nAudit - nAwal === 3,
          `each row once: ${sisa()} aged row(s) left; the audit rows add ${jAudit - jAwal} over ${nAudit - nAwal} run(s), for ${jumlahAwal + N} rows and three runs that deleted`);
      } finally {
        // P3: the scenario's own rows are gone (the purge took them; any left are removed past the guard) and no lock is held
        psql(`begin; set local session_replication_role = replica; delete from public.accountability_events where at < now() - interval '12 months' and person_id = '${ambilPerson}'::uuid and kind = 'SIGN_OUT'; commit;`);
      }
      c.expect(sisa() === "0", `the scenario left ${sisa()} aged row(s) behind`);
      return c.verdict(`with ${N} aged rows on real connections: a run that found every row locked by another deleted none and did not wait; a run `
        + "beside another's batch in flight deleted the other half and the next run the rest; every row was deleted once and the audit rows add up "
        + "to the rows deleted, one per run that deleted anything; no aged row is left behind");
    },
  },
];

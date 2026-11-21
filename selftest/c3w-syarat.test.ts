/**
 * C3w-1 · SHARON'S FIVE CONDITIONS, the red cases, written before any product code (C3W-1-DESIGN.md §9, Sharon's
 * pre-build review 6a63bdee, adopted at 8831d62a). Every case is red until the build; each names what must turn it red
 * again (its plant), and the database cases show that plant caught inside the same rolled-back transaction.
 *
 * The names these cases use are the design's (§3, §9) where it gives one; where it does not, the case names a proposal
 * (C3W-1-SYARAT-MERAH.md, «the interface the cases assume») for Bob's and Sharon's review before the build.
 *
 *   C3W-D1  identity from the session: the service functions take one request or attempt id and nothing else; no AI
 *           function takes a person or a school; every one authenticated can execute is a definer reading
 *           current_person_id(); no client role writes the AI tables directly.
 *   C3W-D2  «sending» is a conditional claim: ai_tandai_kirim is true once on a RESERVED, unsent attempt, then false;
 *           false on a RELEASED one; the sweep releases a RESERVED, unsent attempt past 10 minutes, after which the
 *           claim is false; the sweep never releases a claimed one. Its source is the one guarded update with a row count.
 *   C3W-D3  forward-only: a claimed attempt with no end past the hard timeout plus 5 minutes becomes UNRECONCILED, a
 *           recent one does not; nothing leaves SETTLED or RELEASED, UNRECONCILED never returns to RESERVED, a sending
 *           mark is never cleared, by any writer (a trigger); the plant (the trigger dropped) is caught; every update of
 *           keadaan in a function body is guarded on keadaan.
 *   C3W-D4  the lock order school, option, platform: A2A-L01 ranks the three tables in that order, and reserving,
 *           settling, releasing and reconciling each take the three FOR UPDATE in that order.
 *   C3W-D5  the stub only under the harness's explicit flag: without it (or with any other value) the selection answers
 *           AI_TIDAK_TERSEDIA; the flag is read in one module and set only by the harness.
 *   C3W-R34 R-3 control 4: a REFUSED_PERSONAL_DATA request carries no excerpt_sha256, by a check constraint (caught
 *           when violated); excerpt_sha256 is a sha-256 in hex; no column of the request or the attempt holds text of
 *           the excerpt.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { URUTAN } from "./a2a-l01.test";

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}
const q = (s: string) => `$q$${s}$q$`;

/** The service functions (D-1): the route's server role only, each taking one request or attempt id. */
const LAYANAN: Record<string, string[]> = {
  ai_cadangkan: ["p_permintaan uuid"],
  ai_tandai_kirim: ["p_percobaan uuid"],
  // Sharon's ruling on the usage (via Bob, 19 Nov 18:21): one closed-shape p_penggunaan; counts are not identity (D-1)
  ai_selesaikan: ["p_percobaan uuid", "p_penggunaan jsonb"],
  ai_lepaskan: ["p_percobaan uuid"],
  ai_rekonsiliasi: ["p_percobaan uuid", "p_penggunaan jsonb"],
  ai_sapu: [],
};
/** The usage's one shape check (D-1b): both usage takers call it, so its plant (accept any jsonb) reaches both. */
const SAH_PENGGUNAAN = "ai_penggunaan_sah";
/** D-1b's probes: [key, the usage sent]; the first two are the shape, the rest are refused AI_PENGGUNAAN_TIDAK_SAH. */
const D1B: Array<[string, string]> = [
  ["tepat", '{"token_masuk": 10, "token_keluar": 20, "biaya_mikro": 30}'],
  ["dengan_id", '{"token_masuk": 10, "token_keluar": 20, "biaya_mikro": 30, "id_penyedia": "req_AB-12"}'],
  ["sekolah", '{"token_masuk": 1, "token_keluar": 1, "biaya_mikro": 1, "sekolah": "00000000-0000-0000-0000-000000000001"}'],
  ["pemohon", '{"token_masuk": 1, "token_keluar": 1, "biaya_mikro": 1, "pemohon": "00000000-0000-0000-0000-000000000001"}'],
  ["teks", '{"token_masuk": 1, "token_keluar": 1, "biaya_mikro": 1, "catatan": "Budi Santoso kelas 7A"}'],
  ["string", '{"token_masuk": "10", "token_keluar": 1, "biaya_mikro": 1}'],
  ["negatif", '{"token_masuk": -1, "token_keluar": 1, "biaya_mikro": 1}'],
  ["pecahan", '{"token_masuk": 1.5, "token_keluar": 1, "biaya_mikro": 1}'],
  ["kurang", '{"token_masuk": 1, "token_keluar": 1}'],
  ["id_buruk", '{"token_masuk": 1, "token_keluar": 1, "biaya_mikro": 1, "id_penyedia": "Budi Santoso"}'],
  ["larik", '[1, 2, 3]'],
];
const TOLAK_PENGGUNAAN = "PR220:AI_PENGGUNAAN_TIDAK_SAH";
/** D-3: the one constant the sweep reads, the call's hard timeout plus 5 minutes (Sharon's ruling 2). */
const BATAS_KIRIM = "ai_batas_kirim_tanpa_akhir";
/** Functions that lock the three ceilings (D-4), in Sharon's order. */
const PENGUNCI = ["ai_cadangkan", "ai_selesaikan", "ai_lepaskan", "ai_rekonsiliasi"];
const URUT_KUNCI = ["ai_hak_sekolah", "ai_opsi", "ai_plafon_platform"];
const TABEL = ["ai_opsi", "ai_plafon_platform", "ai_hak_sekolah", "ai_permintaan", "ai_percobaan", "ai_asal_soal", "ai_penerimaan"];
/** An argument that names a person or a school (D-1: those come from the session, never from the caller). */
const ARG_IDENTITAS = /(person|orang|pemohon|peminta|pendidik|sekolah|school|institution|inst\b|requester|user|uid)/i;

function sql(s: string): { ok: boolean; out: string; err: string } {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", s, db()], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  return { ok: r.status === 0, out: (r.stdout || "").trim(), err: ((r.stderr || "").split("\n").find((l) => /ERROR/.test(l)) ?? r.stderr ?? "").trim() };
}

type Fungsi = { nama: string; args: string[]; tipe: string[]; definer: boolean; path: boolean; src: string; anon: boolean; auth: boolean; publik: boolean; layanan: boolean };
function fungsiAi(): Fungsi[] | string {
  const r = sql(`select coalesce(jsonb_agg(jsonb_build_object(
      'nama', p.proname, 'args', coalesce(to_jsonb(p.proargnames), '[]'::jsonb),
      'tipe', (select coalesce(jsonb_agg(format_type(t, null) order by o), '[]'::jsonb) from unnest(p.proargtypes::oid[]) with ordinality u(t, o)),
      'definer', p.prosecdef, 'path', coalesce(array_to_string(p.proconfig, ',') ~ 'search_path', false), 'src', p.prosrc,
      'anon', has_function_privilege('anon', p.oid, 'execute'), 'auth', has_function_privilege('authenticated', p.oid, 'execute'),
      'publik', exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'),
      'layanan', has_function_privilege('service_role', p.oid, 'execute')) order by p.proname), '[]'::jsonb)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and (p.proname like 'ai\\_%' or p.proname like 'c3w\\_%')`);
  if (!r.ok) return r.err;
  return JSON.parse(r.out || "[]") as Fungsi[];
}
/** A function body without comments and string literals' insides kept (the order of statements is what is read). */
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");

// ------------------------------------------------------------------------------------------------ the behaviour scenario
/**
 * One transaction, rolled back, as the database owner. The world is written past the triggers (replica), as a fixture
 * is: one option, the platform row, an entitlement for a seeded school, one request, and attempts in the states each
 * case needs. Then the product's own functions and the guard trigger are exercised with the triggers on. Every probe
 * keeps «ok:<value>» or «<SQLSTATE>:<detail or the message's start>».
 */
function skenario(): string {
  const p = (k: string, s: string) => `v := v || jsonb_build_object('${k}', pg_temp.c3(${q(s)}));`;
  const keadaan = (k: string) => `(select keadaan from public.ai_percobaan where id = current_setting('c3.${k}')::uuid)`;
  const ubah = (k: string, set: string) => `update public.ai_percobaan set ${set} where id = current_setting('c3.${k}')::uuid returning keadaan`;
  // an attempt in a given state and age, written past the triggers (a fixture), its id kept under c3.<k>
  const buat = (k: string, st: string, cadang: string, kirim: string | null, akhir: string | null = null) =>
    `perform set_config('c3.${k}', pg_temp.c3_percobaan('${st}', interval '${cadang}', ${kirim ? `interval '${kirim}'` : "null"}, ${akhir ? `interval '${akhir}'` : "null"})::text, true);`;
  return `
begin;
create function pg_temp.c3(p_sql text) returns text language plpgsql as $f$
declare v_val text; v_state text; v_detail text; v_msg text;
begin
  begin
    execute p_sql into v_val;
    return 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    return v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 90));
  end;
end $f$;
create function pg_temp.c3_percobaan(p_keadaan text, p_cadang interval, p_kirim interval, p_akhir interval) returns uuid language plpgsql as $f$
declare v uuid;
begin
  set local session_replication_role = replica;
  insert into public.ai_percobaan (permintaan, opsi, model_ident, harga_dasar, dicadangkan, diselesaikan, keadaan, dicadangkan_at, dikirim_at, berakhir_at)
  values (current_setting('c3.minta')::uuid, current_setting('c3.opsi')::uuid, 'stub-1', '{"masuk": 1, "keluar": 1}'::jsonb, 100,
          case when p_keadaan = 'SETTLED' then 90 end, p_keadaan, now() - p_cadang, now() - p_kirim, now() - p_akhir)
  returning id into v;
  set local session_replication_role = origin;
  return v;
end $f$;
do $d$
declare v jsonb := '{}'::jsonb; v_sekolah uuid; v_orang uuid; v_kursus uuid; v_id uuid;
begin
  select i.id into v_sekolah from public.institutions i order by i.id limit 1;
  select c.id into v_kursus from public.courses c order by c.id limit 1;
  select p.id into v_orang from public.persons p order by p.id limit 1;
  set local session_replication_role = replica;
  insert into public.ai_opsi (kunci, nama_tampilan, model_ident, harga_dasar, status, plafon_biaya, henti_keras_terverifikasi)
  values ('uji-c3w', 'Uji', 'stub-1', '{"masuk": 1, "keluar": 1}'::jsonb, 'QUALIFIED', 1000000, true) returning id into v_id;
  perform set_config('c3.opsi', v_id::text, true);
  insert into public.ai_plafon_platform (plafon, berhenti) values (1000000, false);
  insert into public.ai_hak_sekolah (sekolah, opsi, aktif, jatah, batas_per_pendidik, mulai, berakhir)
  values (v_sekolah, v_id, true, 100000, null, now() - interval '1 day', null);
  insert into public.ai_permintaan (sekolah, pemohon, course_id, sumber_jenis, excerpt_sha256, tujuan, jumlah, kunci_idempoten, hak_sumber_dikonfirmasi_at, hasil)
  values (v_sekolah, v_orang, v_kursus, 'TEMPEL', repeat('a', 64), 'Membandingkan pecahan', 3, 'c3w-uji-1', now(), null) returning id into v_id;
  perform set_config('c3.minta', v_id::text, true);
  set local session_replication_role = origin;

  -- D-2: the conditional claim
  ${buat("baru", "RESERVED", "1 minute", null)}
  ${p("d2_klaim1", "select public.ai_tandai_kirim(current_setting('c3.baru')::uuid)::text")}
  ${p("d2_kirim_at1", "select dikirim_at::text from public.ai_percobaan where id = current_setting('c3.baru')::uuid")}
  ${p("d2_klaim2", "select public.ai_tandai_kirim(current_setting('c3.baru')::uuid)::text")}
  ${p("d2_kirim_at2", "select dikirim_at::text from public.ai_percobaan where id = current_setting('c3.baru')::uuid")}
  ${buat("lepas", "RELEASED", "1 minute", null, "1 minute")}
  ${p("d2_klaim_lepas", "select public.ai_tandai_kirim(current_setting('c3.lepas')::uuid)::text")}
  ${p("d2_lepas_kirim_at", "select coalesce(dikirim_at::text, 'null') from public.ai_percobaan where id = current_setting('c3.lepas')::uuid")}
  ${buat("basi", "RESERVED", "11 minutes", null)}
  ${buat("basi_muda", "RESERVED", "9 minutes", null)}
  ${buat("basi_klaim", "RESERVED", "11 minutes", null)}
  ${p("d2_klaim_basi", "select public.ai_tandai_kirim(current_setting('c3.basi_klaim')::uuid)::text")}
  -- D-3: a claimed attempt with no end
  ${buat("gantung", "RESERVED", "1 day", "1 day")}
  ${buat("gantung_muda", "RESERVED", "2 minutes", "1 minute")}
  ${p("sapu", "select public.ai_sapu()::text")}
  ${p("d2_basi", `select ${keadaan("basi")}`)}
  ${p("d2_basi_muda", `select ${keadaan("basi_muda")}`)}
  ${p("d2_klaim_basi_lagi", "select public.ai_tandai_kirim(current_setting('c3.basi')::uuid)::text")}
  ${p("d2_basi_klaim", `select ${keadaan("basi_klaim")}`)}
  ${p("d3_gantung", `select ${keadaan("gantung")}`)}
  ${p("d3_gantung_muda", `select ${keadaan("gantung_muda")}`)}

  -- D-3: forward only, by any writer (the owner, triggers on). A move out of SETTLED also clears the settled cost, so
  -- the ledger's own SETTLED-has-a-cost check cannot be what refuses it: the guard trigger alone is under test
  ${buat("s1", "SETTLED", "1 hour", "1 hour", "1 hour")}
  ${p("d3_settled_released", ubah("s1", "keadaan = 'RELEASED', diselesaikan = null"))}
  ${p("d3_settled_reserved", ubah("s1", "keadaan = 'RESERVED', diselesaikan = null"))}
  ${p("d3_settled_unrec", ubah("s1", "keadaan = 'UNRECONCILED', diselesaikan = null"))}
  ${buat("r1", "RELEASED", "1 hour", null, "1 hour")}
  ${p("d3_released_settled", ubah("r1", "keadaan = 'SETTLED'"))}
  ${p("d3_released_reserved", ubah("r1", "keadaan = 'RESERVED'"))}
  ${p("d3_released_unrec", ubah("r1", "keadaan = 'UNRECONCILED'"))}
  ${buat("u1", "UNRECONCILED", "1 day", "1 day")}
  ${p("d3_unrec_reserved", ubah("u1", "keadaan = 'RESERVED'"))}
  ${buat("k1", "RESERVED", "1 minute", "1 minute")}
  ${p("d3_kirim_dihapus", ubah("k1", "dikirim_at = null"))}
  -- the allowed moves stay allowed
  ${buat("a1", "RESERVED", "1 minute", null)}
  ${p("d3_reserved_released", ubah("a1", "keadaan = 'RELEASED', berakhir_at = now()"))}
  ${buat("a2", "RESERVED", "1 minute", "1 minute")}
  ${p("d3_reserved_settled", ubah("a2", "keadaan = 'SETTLED', diselesaikan = 90, berakhir_at = now()"))}
  ${buat("a3", "RESERVED", "1 day", "1 day")}
  ${p("d3_reserved_unrec", ubah("a3", "keadaan = 'UNRECONCILED'"))}
  ${buat("a4", "UNRECONCILED", "1 day", "1 day")}
  ${p("d3_unrec_settled", ubah("a4", "keadaan = 'SETTLED', diselesaikan = 90, berakhir_at = now()"))}
  ${buat("a5", "UNRECONCILED", "1 day", "1 day")}
  ${p("d3_unrec_released", ubah("a5", "keadaan = 'RELEASED', berakhir_at = now()"))}

  -- D-1b: the usage's closed shape, each probe on its own claimed attempt (a settle that lands ends it)
  ${D1B.map(([k, u]) => `${buat(`u_${k}`, "RESERVED", "1 minute", "1 minute")}
  ${p(`d1b_${k}`, `select public.ai_selesaikan(current_setting('c3.u_${k}')::uuid, '${u}'::jsonb)::text`)}`).join("\n  ")}
  ${p("d1b_tepat_hasil", `select keadaan || '|' || diselesaikan from public.ai_percobaan where id = current_setting('c3.u_tepat')::uuid`)}
  ${buat("u_rek", "UNRECONCILED", "1 day", "1 day")}
  ${p("d1b_rek_sekolah", `select public.ai_rekonsiliasi(current_setting('c3.u_rek')::uuid, '{"token_masuk": 1, "token_keluar": 1, "biaya_mikro": 1, "sekolah": "x"}'::jsonb)::text`)}
  ${p("d3_batas", `select extract(epoch from public.${BATAS_KIRIM}())::bigint::text`)}

  -- R-3 control 4: the check constraint, by violating it
  ${p("r34_dengan_sidik", "update public.ai_permintaan set hasil = 'REFUSED_PERSONAL_DATA' where id = current_setting('c3.minta')::uuid returning hasil")}
  ${p("r34_tanpa_sidik", "update public.ai_permintaan set hasil = 'REFUSED_PERSONAL_DATA', excerpt_sha256 = null where id = current_setting('c3.minta')::uuid returning hasil")}
  ${p("r34_sidik_bukan_hex", "update public.ai_permintaan set hasil = null, excerpt_sha256 = 'Budi Santoso kelas 7A' where id = current_setting('c3.minta')::uuid returning hasil")}

  -- the plant (D-3), caught: with every row trigger on ai_percobaan dropped, a SETTLED attempt is released
  ${buat("tanam", "SETTLED", "1 hour", "1 hour", "1 hour")}
  ${p("tanam_drop", "select string_agg(format('drop trigger %I on public.ai_percobaan', tgname), '; ') from pg_trigger where tgrelid = 'public.ai_percobaan'::regclass and not tgisinternal")}
  if v ->> 'tanam_drop' like 'ok:drop trigger%' then
    execute substr(v ->> 'tanam_drop', 4);
  end if;
  ${p("tanam_settled_released", ubah("tanam", "keadaan = 'RELEASED', diselesaikan = null"))}
  -- the plant (D-1b), caught: the shape check accepting any jsonb lets a usage naming a school settle
  ${buat("u_tanam", "RESERVED", "1 minute", "1 minute")}
  if to_regprocedure('public.${SAH_PENGGUNAAN}(jsonb)') is not null then
    execute ${q(`create or replace function public.${SAH_PENGGUNAAN}(p jsonb) returns boolean language sql as $t$ select true $t$`)};
  end if;
  ${p("tanam_d1b", `select public.ai_selesaikan(current_setting('c3.u_tanam')::uuid, '{"token_masuk": 1, "token_keluar": 1, "biaya_mikro": 1, "sekolah": "x"}'::jsonb)::text`)}
  raise notice 'C3|%', v::text;
end $d$;
rollback;`;
}

let hasil: Record<string, string> | null | undefined;
let galat = "";
function jalankan(): Record<string, string> | null {
  if (hasil !== undefined) return hasil;
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skenario(), db()], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const baris = (r.stderr || "").split("\n").find((l) => l.includes("C3|"));
  if (r.status !== 0 || !baris) {
    galat = ((r.stderr || "").split("\n").find((l) => /ERROR/.test(l)) ?? "no snapshot").trim();
    hasil = null;
  } else {
    hasil = JSON.parse(baris.slice(baris.indexOf("C3|") + 3)) as Record<string, string>;
  }
  return hasil;
}
const ditolak = (x: string | undefined) => x !== undefined && !x.startsWith("ok:");

// ------------------------------------------------------------------------------------------------ D-5 helpers
const semuaBerkas = (dir: string, akhiran: RegExp): string[] => !existsSync(dir) ? [] : readdirSync(dir).flatMap((n) => {
  if (new Set(["node_modules", ".next", ".git"]).has(n)) return [];
  const f = join(dir, n);
  return statSync(f).isDirectory() ? semuaBerkas(f, akhiran) : akhiran.test(n) ? [f] : [];
});
const BENDERA = "PINTAR_AI_STUB_HARNESS";
const PILIH = ["src", "lib", "ai", "pilih-penyedia.ts"];

export const c3wSyaratTests: SelfTest[] = [
  {
    id: "C3W-D1",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const fs = fungsiAi();
      if (!c.expect(typeof fs !== "string", `the catalogue could not be read: ${fs}`)) return c.verdict("");
      const daftar = fs as Fungsi[];
      for (const [nama, arg] of Object.entries(LAYANAN)) {
        const f = daftar.filter((x) => x.nama === nama);
        if (!c.expect(f.length === 1, `${nama}: ${f.length} definitions (one service function, D-1)`)) continue;
        const x = f[0];
        const ada = x.args.map((a, i) => `${a} ${x.tipe[i]}`);
        c.expect(JSON.stringify(ada) === JSON.stringify(arg),
          `${nama}(${ada.join(", ")}): it must take ${arg.length ? arg.join(", ") : "no argument"} and nothing else (D-1: never a person or a school)`);
        c.expect(x.layanan && !x.auth && !x.anon && !x.publik,
          `${nama}: executable by service_role ${x.layanan}, authenticated ${x.auth}, anon ${x.anon}, public ${x.publik} (the route's server role only)`);
      }
      for (const x of daftar) {
        const salah = x.args.filter((a) => ARG_IDENTITAS.test(a));
        c.expect(salah.length === 0, `${x.nama} takes ${salah.join(", ")}: a person or a school comes from the verified session (D-1)`);
        if (x.auth) {
          c.expect(x.definer && x.path, `${x.nama} is executable by authenticated but is ${x.definer ? "" : "not a definer"}${x.path ? "" : " without a fixed search_path"}`);
          c.expect(/public\.current_person_id\(\)/.test(tanpaKomentar(x.src)), `${x.nama} is executable by authenticated and never reads public.current_person_id() (D-1)`);
        }
      }
      c.expect(daftar.some((x) => x.auth), "no AI function is executable by authenticated: the request is not made from the session (D-1)");
      const r = sql(`select coalesce(string_agg(t || ':' || r || ':' || pr, ',' order by t, r, pr), '')
          from unnest(array[${TABEL.map((t) => `'${t}'`).join(",")}]) t, unnest(array['anon','authenticated']) r, unnest(array['INSERT','UPDATE','DELETE']) pr
         where to_regclass('public.' || t) is null or has_table_privilege(r, 'public.' || t, pr)`);
      c.expect(r.ok && r.out === "", `client roles that write the AI tables directly, or tables missing: ${r.ok ? r.out : r.err}`);
      return c.verdict("reads the catalogue: the six service functions (ai_cadangkan on a request id; ai_tandai_kirim and ai_lepaskan on an attempt id; ai_selesaikan and ai_rekonsiliasi on an attempt id and the closed-shape p_penggunaan; ai_sapu on nothing) each take exactly that and are executable by service_role only; no ai_ or c3w_ function takes an argument naming a person or a school; every one authenticated can execute is a definer with a fixed search_path that reads public.current_person_id(); anon and authenticated cannot insert, update or delete any of the seven AI tables (Sharon's D-1)");
    },
  },
  {
    id: "C3W-D1b",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const v = jalankan();
      if (!c.expect(v !== null, `the scenario could not run: ${galat}`)) return c.verdict("");
      const h = v!;
      for (const [k] of D1B.slice(0, 2)) c.expect((h[`d1b_${k}`] ?? "").startsWith("ok:"), `the closed shape (${k}): ${h[`d1b_${k}`]} (settled)`);
      c.expect(h.d1b_tepat_hasil === "ok:SETTLED|30", `the settled attempt: ${h.d1b_tepat_hasil} (SETTLED at biaya_mikro 30)`);
      for (const [k, u] of D1B.slice(2)) c.expect(h[`d1b_${k}`] === TOLAK_PENGGUNAAN, `${k} ${u}: ${h[`d1b_${k}`]} (${TOLAK_PENGGUNAAN})`);
      c.expect(h.d1b_rek_sekolah === TOLAK_PENGGUNAAN, `ai_rekonsiliasi with a school in the usage: ${h.d1b_rek_sekolah} (${TOLAK_PENGGUNAAN})`);
      c.expect((h.tanam_d1b ?? "").startsWith("ok:"), `the plant (${SAH_PENGGUNAAN} accepting any jsonb) was not caught: ${h.tanam_d1b}`);
      const fs = fungsiAi();
      if (typeof fs !== "string") {
        for (const nama of ["ai_selesaikan", "ai_rekonsiliasi"]) {
          const b = tanpaKomentar(fs.find((x) => x.nama === nama)?.src ?? "");
          c.expect(new RegExp(`public\\.${SAH_PENGGUNAAN}\\(p_penggunaan\\)`).test(b), `${nama} does not check p_penggunaan through public.${SAH_PENGGUNAAN}(p_penggunaan)`);
        }
      }
      return c.verdict(`executes ai_selesaikan and ai_rekonsiliasi in one rolled-back transaction (Sharon's ruling on the usage, 19 Nov): exactly token_masuk, token_keluar and biaya_mikro as non-negative integers, with or without an id_penyedia of ^[A-Za-z0-9_-]{1,128}$, settles (SETTLED at biaya_mikro); a school, a requester, free text, a count sent as a string, a negative or fractional count, a missing count, an id_penyedia with a space, and a non-object are each refused ${TOLAK_PENGGUNAAN}, and so is a school in a reconciliation; both functions check through public.${SAH_PENGGUNAAN}(p_penggunaan), and its plant (accept any jsonb) lets a usage naming a school settle`);
    },
  },
  {
    id: "C3W-D2",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const v = jalankan();
      if (!c.expect(v !== null, `the scenario could not run: ${galat}`)) return c.verdict("");
      const h = v!;
      c.expect(h.d2_klaim1 === "ok:true", `the first claim on a RESERVED, unsent attempt: ${h.d2_klaim1} (true)`);
      c.expect(h.d2_klaim2 === "ok:false", `a second claim: ${h.d2_klaim2} (false: a row count other than 1 means no call)`);
      c.expect(h.d2_kirim_at1 === h.d2_kirim_at2 && /^ok:\d/.test(h.d2_kirim_at1 ?? ""), `the sending mark moved on the second claim: ${h.d2_kirim_at1} -> ${h.d2_kirim_at2}`);
      c.expect(h.d2_klaim_lepas === "ok:false" && h.d2_lepas_kirim_at === "ok:null", `a claim on a RELEASED attempt: ${h.d2_klaim_lepas}, mark ${h.d2_lepas_kirim_at} (false, no mark)`);
      c.expect(h.d2_basi === "ok:RELEASED", `a RESERVED, unsent attempt 11 minutes old after the sweep: ${h.d2_basi} (RELEASED)`);
      c.expect(h.d2_basi_muda === "ok:RESERVED", `a RESERVED, unsent attempt 9 minutes old after the sweep: ${h.d2_basi_muda} (RESERVED)`);
      c.expect(h.d2_klaim_basi_lagi === "ok:false", `a claim after the sweep released the attempt: ${h.d2_klaim_basi_lagi} (false: the sweep and the claim cannot both win)`);
      c.expect(h.d2_klaim_basi === "ok:true" && h.d2_basi_klaim === "ok:RESERVED", `an 11-minute-old attempt claimed before the sweep: claim ${h.d2_klaim_basi}, then ${h.d2_basi_klaim} (true, then still RESERVED: a claimed attempt is never released)`);
      const fs = fungsiAi();
      const src = typeof fs === "string" ? "" : tanpaKomentar(fs.find((x) => x.nama === "ai_tandai_kirim")?.src ?? "").replace(/\s+/g, " ");
      c.expect(/update public\.ai_percobaan set dikirim_at = now\(\) where id = p_percobaan and keadaan = 'RESERVED' and dikirim_at is null/i.test(src)
        && /(get diagnostics \w+ = row_count|\bfound\b)/i.test(src),
        "ai_tandai_kirim is not the one conditional update (… set dikirim_at = now() where id = p_percobaan and keadaan = 'RESERVED' and dikirim_at is null) with its row count read");
      return c.verdict("executes ai_tandai_kirim and ai_sapu against the migrations in one rolled-back transaction: the claim is true once on a RESERVED, unsent attempt and false after, the mark unmoved; false on a RELEASED attempt; the sweep releases a RESERVED, unsent attempt at 11 minutes and not at 9, and a claim after it is false; an attempt claimed before the sweep stays RESERVED. Reads the claim's source: the one conditional update and its row count (Sharon's D-2)");
    },
  },
  {
    id: "C3W-D3",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const v = jalankan();
      if (!c.expect(v !== null, `the scenario could not run: ${galat}`)) return c.verdict("");
      const h = v!;
      c.expect(h.d3_gantung === "ok:UNRECONCILED", `a claimed attempt with no end, a day old, after the sweep: ${h.d3_gantung} (UNRECONCILED)`);
      c.expect(h.d3_gantung_muda === "ok:RESERVED", `a claimed attempt with no end, a minute old, after the sweep: ${h.d3_gantung_muda} (RESERVED)`);
      for (const k of ["d3_settled_released", "d3_settled_reserved", "d3_settled_unrec", "d3_released_settled", "d3_released_reserved", "d3_released_unrec", "d3_unrec_reserved", "d3_kirim_dihapus"]) {
        c.expect(ditolak(h[k]), `${k}: ${h[k]} (refused by the guard trigger, for any writer)`);
      }
      for (const [k, st] of [["d3_reserved_released", "RELEASED"], ["d3_reserved_settled", "SETTLED"], ["d3_reserved_unrec", "UNRECONCILED"], ["d3_unrec_settled", "SETTLED"], ["d3_unrec_released", "RELEASED"]] as const) {
        c.expect(h[k] === `ok:${st}`, `${k}: ${h[k]} (an allowed forward move)`);
      }
      c.expect(h.tanam_settled_released === "ok:RELEASED", `the plant (every row trigger on ai_percobaan dropped) was not caught: ${h.tanam_drop} / ${h.tanam_settled_released}`);
      const fs = fungsiAi();
      if (typeof fs !== "string") {
        for (const f of fs) {
          const b = tanpaKomentar(f.src).replace(/\s+/g, " ");
          for (const m of b.matchAll(/update public\.ai_percobaan set ([^;]*?)(?:;|$)/gi)) {
            if (!/\bkeadaan\s*=/.test(m[1].split(/\bwhere\b/i)[0])) continue;
            c.expect(/\bwhere\b[^;]*\bkeadaan\s*(=|in)/i.test(m[1]), `${f.nama}: an update of keadaan without a guard on keadaan: ${m[0].slice(0, 140)}`);
          }
        }
      }
      // Sharon's ruling 2: one SQL constant the sweep reads; the provider's call timeout at least 5 minutes under it
      const batas = Number((h.d3_batas ?? "").replace(/^ok:/, ""));
      c.expect(/^ok:\d+$/.test(h.d3_batas ?? ""), `${BATAS_KIRIM}(): ${h.d3_batas} (an interval, the hard timeout plus 5 minutes)`);
      const sapu = typeof fs === "string" ? "" : tanpaKomentar(fs.find((x) => x.nama === "ai_sapu")?.src ?? "");
      c.expect(new RegExp(`public\\.${BATAS_KIRIM}\\(\\)`).test(sapu), `ai_sapu does not read public.${BATAS_KIRIM}() (one constant, not a literal)`);
      const penyedia = join(repoRoot, "src", "lib", "ai", "penyedia.ts");
      const ms = existsSync(penyedia) ? Number(/export const BATAS_PANGGILAN_MS = (\d[\d_]*);/.exec(readFileSync(penyedia, "utf8"))?.[1]?.replace(/_/g, "") ?? NaN) : NaN;
      c.expect(Number.isFinite(ms) && Number.isFinite(batas) && batas * 1000 - ms >= 5 * 60 * 1000,
        `src/lib/ai/penyedia.ts BATAS_PANGGILAN_MS ${ms} ms against ${BATAS_KIRIM}() ${batas} s: the call's timeout must be at least 5 minutes under it`);
      return c.verdict(`executes against the migrations in one rolled-back transaction: the sweep makes a day-old claimed attempt with no end UNRECONCILED and leaves a minute-old one, reading the one constant ${BATAS_KIRIM}(), which is at least 5 minutes above src/lib/ai/penyedia.ts's BATAS_PANGGILAN_MS; as the owner with triggers on, SETTLED to RELEASED, RESERVED or UNRECONCILED, RELEASED to any, UNRECONCILED to RESERVED, and clearing a sending mark are each refused, and the five forward moves are allowed; the plant (the guard dropped) lets SETTLED become RELEASED, so the guard is what refuses. Reads every ai_ and c3w_ body: each update of keadaan is guarded on keadaan (Sharon's D-3)`);
    },
  },
  {
    id: "C3W-D4",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const rank = URUT_KUNCI.map((t) => URUTAN[t]);
      c.expect(rank.every((x) => typeof x === "number") && rank[0] < rank[1] && rank[1] < rank[2],
        `A2A-L01's ranks for ${URUT_KUNCI.join(", ")}: ${rank.join(", ")} (all three ranked, in that order)`);
      const fs = fungsiAi();
      if (!c.expect(typeof fs !== "string", `the catalogue could not be read: ${fs}`)) return c.verdict("");
      for (const nama of PENGUNCI) {
        const f = (fs as Fungsi[]).find((x) => x.nama === nama);
        if (!c.expect(f !== undefined, `${nama} is missing`)) continue;
        const b = tanpaKomentar(f!.src).replace(/\s+/g, " ");
        const pos = URUT_KUNCI.map((t) => {
          const re = new RegExp(`from public\\.${t}\\b[^;]*?for update`, "i");
          const m = re.exec(b);
          return m ? m.index : -1;
        });
        c.expect(pos.every((x) => x >= 0) && pos[0] < pos[1] && pos[1] < pos[2],
          `${nama}: locks ${URUT_KUNCI.map((t, i) => `${t}@${pos[i]}`).join(", ")} (each FOR UPDATE, school then option then platform)`);
      }
      return c.verdict("reads A2A-L01's ranks and the catalogue: ai_hak_sekolah, ai_opsi and ai_plafon_platform are ranked in that order, so A2A-L01 itself reports any function that takes them otherwise; ai_cadangkan, ai_selesaikan, ai_lepaskan and ai_rekonsiliasi each take the three FOR UPDATE, school, then option, then platform (Sharon's D-4)");
    },
  },
  {
    id: "C3W-D5",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const berkas = join(repoRoot, ...PILIH);
      if (!c.expect(existsSync(berkas), `${PILIH.join("/")} is missing: the provider selection is not one module`)) return c.verdict("");
      const m = await import(berkas) as { pilihPenyedia?: (env: Record<string, string | undefined>) => { ok: boolean; kode?: string; jenis?: string } };
      if (!c.expect(typeof m.pilihPenyedia === "function", "pilih-penyedia.ts does not export pilihPenyedia(env)")) return c.verdict("");
      const tak = { ok: false, kode: "AI_TIDAK_TERSEDIA" };
      const kasus: Array<[string, Record<string, string | undefined>, object]> = [
        ["no flag", {}, tak],
        ["NODE_ENV=development, no flag", { NODE_ENV: "development" }, tak],
        [`${BENDERA}=true`, { [BENDERA]: "true" }, tak],
        [`${BENDERA}=0`, { [BENDERA]: "0" }, tak],
        [`${BENDERA}=""`, { [BENDERA]: "" }, tak],
        ["an adapter named, none built", { PINTAR_AI_ADAPTER: "nyata" }, tak],
        [`${BENDERA}=1`, { [BENDERA]: "1" }, { ok: true, jenis: "stub" }],
      ];
      for (const [nama, env, mau] of kasus) {
        const dapat = m.pilihPenyedia!(env);
        c.expect(JSON.stringify(dapat) === JSON.stringify(mau), `${nama}: ${JSON.stringify(dapat)} (${JSON.stringify(mau)})`);
      }
      const sumber = readFileSync(berkas, "utf8");
      c.expect(!/NODE_ENV/.test(sumber), "the selection reads NODE_ENV: a development build is not the harness (D-5)");
      const src = semuaBerkas(join(repoRoot, "src"), /\.(ts|tsx)$/);
      const pembaca = src.filter((f) => readFileSync(f, "utf8").includes(BENDERA)).map((f) => relative(repoRoot, f));
      c.expect(pembaca.length === 1 && pembaca[0] === PILIH.join("/"), `the flag is read in ${pembaca.join(", ") || "no module"} (one module: ${PILIH.join("/")})`);
      const stub = src.filter((f) => /from ["'][^"']*\/ai\/stub["']/.test(readFileSync(f, "utf8"))).map((f) => relative(repoRoot, f));
      c.expect(stub.length === 1 && stub[0] === "src/lib/ai/penyedia.ts", `the stub is imported by ${stub.join(", ") || "nothing"} (the provider module alone)`);
      // set only by the harness: the selftest runner and the CI jobs that run it, never a deploy file or an env file
      const luar = [".", "scripts", ".github", "supabase"].flatMap((d) => d === "." ? readdirSync(repoRoot).filter((n) => /^(\.env.*|vercel\.json|next\.config\..*|package\.json)$/.test(n)).map((n) => join(repoRoot, n))
        : semuaBerkas(join(repoRoot, d), /./)).filter((f) => !/[\\/]scripts[\\/]dev[\\/]/.test(f) && !/[\\/]\.github[\\/]workflows[\\/](ci|audit-journeys)\.ya?ml$/.test(f));
      const penyetel = luar.filter((f) => { try { return readFileSync(f, "utf8").includes(BENDERA); } catch { return false; } }).map((f) => relative(repoRoot, f));
      c.expect(penyetel.length === 0, `the flag is set outside the harness: ${penyetel.join(", ")}`);
      return c.verdict(`imports ${PILIH.join("/")} and reads the source: pilihPenyedia answers AI_TIDAK_TERSEDIA with no flag, with NODE_ENV=development, with ${BENDERA} set to anything but "1", and with an adapter named while none is built; only ${BENDERA}=1 selects the stub. The selection never reads NODE_ENV; the flag is read in that one module; the stub is imported by src/lib/ai/penyedia.ts alone; no env, deploy or migration file sets the flag, only the harness (Sharon's D-5)`);
    },
  },
  {
    id: "C3W-R34",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const v = jalankan();
      if (c.expect(v !== null, `the scenario could not run: ${galat}`)) {
        const h = v!;
        c.expect((h.r34_dengan_sidik ?? "").startsWith("23514:"), `REFUSED_PERSONAL_DATA with an excerpt_sha256: ${h.r34_dengan_sidik} (23514, a check constraint)`);
        c.expect(h.r34_tanpa_sidik === "ok:REFUSED_PERSONAL_DATA", `REFUSED_PERSONAL_DATA with no excerpt_sha256: ${h.r34_tanpa_sidik} (allowed)`);
        c.expect((h.r34_sidik_bukan_hex ?? "").startsWith("23514:"), `an excerpt_sha256 holding a name: ${h.r34_sidik_bukan_hex} (23514: only 64 hex characters)`);
      }
      const k = sql(`select coalesce(string_agg(pg_get_constraintdef(oid), ' | '), '') from pg_constraint
                      where conrelid = to_regclass('public.ai_permintaan') and contype = 'c'`);
      c.expect(k.ok && /excerpt_sha256/.test(k.out) && /REFUSED_PERSONAL_DATA/.test(k.out), `no check constraint ties excerpt_sha256 to REFUSED_PERSONAL_DATA: ${k.ok ? k.out : k.err}`);
      const kol = sql(`select coalesce(string_agg(c.relname || '.' || a.attname, ', ' order by c.relname, a.attname), '')
          from pg_attribute a join pg_class c on c.oid = a.attrelid
         where c.oid in (to_regclass('public.ai_permintaan'), to_regclass('public.ai_percobaan')) and a.attnum > 0 and not a.attisdropped
           and a.attname ~* '(teks|text|bahan|excerpt|kutipan|isi|prompt|keluaran|output|respons)' and a.attname <> 'excerpt_sha256'`);
      const ada = sql(`select (to_regclass('public.ai_permintaan') is not null and to_regclass('public.ai_percobaan') is not null)::text`);
      c.expect(ada.out === "true" && kol.ok && kol.out === "", `the request and attempt tables ${ada.out === "true" ? "" : "are missing; "}hold excerpt or output text in: ${kol.out}`);
      return c.verdict("executes against the migrations in one rolled-back transaction and reads the catalogue: marking a request REFUSED_PERSONAL_DATA while it carries an excerpt_sha256 is refused 23514 by a check constraint naming both, and allowed with none; an excerpt_sha256 that is not 64 hex characters is refused 23514; neither ai_permintaan nor ai_percobaan has a column for the excerpt's or the output's text (Sharon's R-3, control 4)");
    },
  },
];

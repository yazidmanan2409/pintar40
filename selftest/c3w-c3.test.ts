/**
 * C3w-1 · THE ACCEPTANCE CASES C3-2 TO C3-10, red first (docs/completion-4.1/batches/C3W-1-DESIGN.md §6 on
 * claude/bob-41-master-plan; PLAN-A3-C3W-Z.md §3.3). C3-1 is C3W-T02, C3-3 is C3W-R01 with C3W-T03, C3-7 is R3-01 to
 * R3-07 and C3-9 is the existing workbook and structured-import suite, unchanged.
 *
 *   C3W-C32  Provenance is staff-only. No role a session holds may read or write an AI table; the only functions a
 *            signed-in session may run that read one are the named, gated ones, and a learner is refused by each; the
 *            staff read of a package's provenance answers a learner nothing. The engine's learner payload refuses the
 *            provenance keys as it refuses an answer key.
 *   C3W-C34  Spend cannot pass the allowance: two real connections reserve at its edge, in both orders, and exactly one
 *            attempt is reserved, the other refused AI_JATAH_HABIS after waiting on the school's row. The plant (the
 *            school's row lock removed) lets both through. A retry is its own attempt, and the third is the last.
 *   C3W-C35  School A cannot consume school B's allowance; two schools on two options each reserve against their own
 *            option and ceiling.
 *   C3W-C36  (S-6) With the entitlement off, drafts are still kept, removed and submitted, the package is approved, and
 *            provenance stays readable to the package's staff.
 *   C3W-C38  Only the provider module reaches the stub, and only the drafting route reaches the provider; no AI vendor
 *            SDK is a dependency; no vendor name in any schema name; no learner surface carries the AI mark.
 *   C3W-C310 The cross-batch checkpoint: a generated, accepted, reviewed and published question is sat, scored,
 *            key-corrected (C2w's path) and annotated like any other, its provenance kept on the line.
 */
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { G, S, jalankan, langkah } from "./c1w.test";
import { balapan, gantiFungsi } from "./balapan";

const db = () => process.env.SUPABASE_DB_URL!;
const psql = (sql: string) => spawnSync("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", db()], { encoding: "utf8", input: sql });

/** The AI tables (C3W-1-DESIGN.md §3). */
const TABEL_AI = ["ai_opsi", "ai_plafon_platform", "ai_hak_sekolah", "ai_permintaan", "ai_percobaan", "ai_asal_soal", "ai_penerimaan"];
/** The functions a signed-in session may run that read an AI table, each gated on CAN_DRAFT or CAN_REVIEW in the school. */
const BACA_TERGERBANG = ["ai_asal_paket", "ai_draf_belum_diputuskan", "ai_minta_draf", "ai_putuskan", "ai_tersedia"];

// ------------------------------------------------------------------ the C1w world: generated drafts in a teacher's package
const SOAL_D1 = `(select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules md on md.id = l.module_id
   where md.course_id = ${G("d1")}`;
const soalZ = `${SOAL_D1} and i.cycle_role is null order by i.id limit 1)`;
const soalKe = (n: number) => `${SOAL_D1} and i.id <> ${G("z")} order by i.id offset ${n - 1} limit 1)`;
const PELAJARAN = `(select l.id from public.lessons l join public.modules md on md.id = l.module_id where md.course_id = ${G("d1")} order by l.ordinal limit 1)`;
const asal = (it: string) => `
  insert into public.ai_asal_soal (item_id, permintaan, percobaan, model_ident, versi_prompt, excerpt_sha256, pemohon, isi_sha256)
  values (${it}, current_setting('c1.t_minta')::uuid, current_setting('c1.t_coba')::uuid, 'stub-1', 'c3w-1.1', repeat('c', 64),
          ${G("p_guru")}, public.ai_isi_soal_sha256(${it}));`;
const putuskan = (it: string, kp: string) => `select (public.ai_putuskan(${it}, '${kp}') ->> 'keputusan')`;

/** The opening every world here shares: an option, an entitlement, a checked request on d1's first lesson, a claimed attempt,
 *  and three generated drafts (X, Y, Z) with provenance; W is written by hand. */
const AWAL = [
  `perform pg_temp.c1_murid('m1'); perform pg_temp.c1_draf('d1');`,
  `insert into public.ai_opsi (kunci, nama_tampilan, model_ident, harga_dasar, status, plafon_biaya, henti_keras_terverifikasi)
     values ('c3-' || ${S("tag")}, 'Uji Stub', 'stub-1', '{"masuk": 1, "keluar": 1}', 'QUALIFIED', 100000000, true);
   insert into public.ai_plafon_platform (plafon) values (100000000) on conflict (id) do nothing;
   insert into public.ai_hak_sekolah (sekolah, opsi, aktif, jatah, mulai)
     select ${G("inst")}, o.id, true, 100000000, now() - interval '1 day' from public.ai_opsi o where o.kunci = 'c3-' || ${S("tag")}
     on conflict (sekolah) do update set opsi = excluded.opsi, aktif = true, jatah = excluded.jatah, mulai = excluded.mulai, berakhir = null;`,
  langkah("t_minta", "guru", `select set_config('c1.t_minta', (public.ai_minta_draf(${G("d1")}, ${PELAJARAN}, 'Budi membeli lima apel di pasar.',
      'Membandingkan pecahan', 2, 'c3-satu', true) ->> 'permintaan'), true)`),
  langkah("t_coba", null, `select set_config('c1.t_coba', public.ai_cadangkan(current_setting('c1.t_minta')::uuid)::text, true)`),
  langkah("t_kirim", null, `select public.ai_tandai_kirim(current_setting('c1.t_coba')::uuid)::text`),
  `perform set_config('c1.z', ${soalZ}::text, true);
   perform set_config('c1.x', ${soalKe(1)}::text, true); perform set_config('c1.y', ${soalKe(2)}::text, true);`,
  `begin set local session_replication_role = replica; ${asal(G("x"))} ${asal(G("y"))} ${asal(G("z"))}
     set local session_replication_role = origin;
   exception when others then v := v || jsonb_build_object('t_asal', 'ERR:' || sqlerrm); end;`,
];

let dunia: Record<string, string> | null | undefined;
function skenario(c: Checks, repoRoot: string): Record<string, string> | null {
  if (dunia !== undefined) return dunia;
  const L: string[] = [
    ...AWAL,
    // ---- C3-2: the tables, closed to every role a session holds
    langkah("c32_tabel", null, `select coalesce(string_agg(r || ':' || t, ',' order by r, t), '') from unnest(array[${TABEL_AI.map((t) => `'${t}'`).join(",")}]) t
        cross join unnest(array['anon', 'authenticated']) r
       where has_table_privilege(r, 'public.' || t, 'select') or has_table_privilege(r, 'public.' || t, 'insert')
          or has_table_privilege(r, 'public.' || t, 'update') or has_table_privilege(r, 'public.' || t, 'delete')`),
    // the functions a signed-in session may run that read an AI table
    langkah("c32_fungsi", null, `select coalesce(string_agg(distinct p.proname, ',' order by p.proname), '') from pg_proc p
       where p.pronamespace = 'public'::regnamespace and has_function_privilege('authenticated', p.oid, 'execute')
         and p.prosrc ~ '\\mai_(opsi|plafon_platform|hak_sekolah|permintaan|percobaan|asal_soal|penerimaan)\\M'`),
    // a learner, by each of them
    langkah("c32_murid_minta", "m1", `select public.ai_minta_draf(${G("d1")}, ${PELAJARAN}, 'Teks.', 'Tujuan', 1, 'c3-murid', true)::text`),
    langkah("c32_murid_putus", "m1", putuskan(G("x"), "TERIMA")),
    langkah("c32_murid_hitung", "m1", `select public.ai_draf_belum_diputuskan(${G("d1")})::text`),
    langkah("c32_murid_asal", "m1", `select jsonb_array_length(public.ai_asal_paket(${G("d1")}))::text`),
    langkah("c32_murid_ada", "m1", `select public.ai_tersedia(${G("d1")})::text`),
    langkah("c32_guru_ada", "guru", `select public.ai_tersedia(${G("d1")})::text`),
    langkah("c32_guru_asal", "guru", `select jsonb_array_length(public.ai_asal_paket(${G("d1")}))::text`),
    langkah("c32_lain_asal", "lain", `select jsonb_array_length(public.ai_asal_paket(${G("d1")}))::text`),
    // ---- C3-6: the entitlement off after the drafts were written
    `update public.ai_hak_sekolah set aktif = false where sekolah = ${G("inst")};`,
    langkah("c36_minta", "guru", `select public.ai_minta_draf(${G("d1")}, ${PELAJARAN}, 'Budi membeli lima apel.', 'Membandingkan pecahan', 2, 'c3-mati', true)::text`),
    langkah("c36_x", "guru", putuskan(G("x"), "TERIMA")),
    `perform selftest.as_user_uid(${G("u_guru")}); perform public.ubah_soal_draf(${G("y")}, 1, jsonb_build_object('stem', 'Soal Y diubah oleh guru?', 'options', jsonb_build_array(
       jsonb_build_object('label', 'A', 'body', 'Pilihan A', 'is_correct', true, 'rationale', 'Tepat.'),
       jsonb_build_object('label', 'B', 'body', 'Pilihan B', 'is_correct', false, 'rationale', 'Belum tepat.')))); perform selftest.as_owner();`,
    langkah("c36_y", "guru", putuskan(G("y"), "TERIMA")),
    langkah("c36_z", "guru", putuskan(G("z"), "HAPUS")),
    langkah("c36_asal", "guru", `select string_agg(concat_ws(':', e ->> 'keputusan', e ->> 'diubah', e ->> 'model'), ',' order by e ->> 'keputusan')
        from jsonb_array_elements(public.ai_asal_paket(${G("d1")})) e`),
    langkah("c36_aju", "guru", `select public.langkah_konten(${G("d1")}, 'STRUCTURED')::text || '|' || public.langkah_konten(${G("d1")}, 'VALIDATED')::text
        || '|' || public.langkah_konten(${G("d1")}, 'IN_REVIEW')::text`),
    langkah("c36_setuju", "kadep", `select public.langkah_konten(${G("d1")}, 'APPROVED')::text`),
    langkah("c36_tinjau", "kadep", `select string_agg(e ->> 'keputusan', ',' order by e ->> 'keputusan') from jsonb_array_elements(public.ai_asal_paket(${G("d1")})) e`),
    // ---- C3-10: released, published, given to the class, sat, scored, key-corrected and annotated
    // the rest of c1_terbitkan from APPROVED, by the school's seeded people
    `declare v_rel uuid; x jsonb; r record; begin
       perform selftest.as_user('siklus-admin@synthetic.pintar.test');
       v_rel := (public.create_release(${G("d1")}) ->> 'release')::uuid;
       perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
       x := public.freeze_release(v_rel);
       if (x ->> 'ok')::boolean is not true then raise exception 'the release did not freeze: %', left(x::text, 200); end if;
       for r in select f.id from public.mcq_quality_findings f where f.course_id = ${G("d1")} and f.acknowledged_at is null loop
         perform public.acknowledge_finding('MCQ_QUALITY', r.id, 'C3W'); end loop;
       for r in select f.id from public.coaching_findings f where f.course_id = ${G("d1")} and f.acknowledged_at is null loop
         perform public.acknowledge_finding('COACHING', r.id, 'C3W'); end loop;
       perform selftest.as_user('siklus-admin@synthetic.pintar.test');
       perform public.publish_release(v_rel);
       perform selftest.as_owner();
       perform set_config('c1.d1_rel', v_rel::text, true);
       perform selftest.pass_mark(${G("inst")}, ${G("d1")}); perform pg_temp.c1_beri('d1');
     exception when others then perform selftest.as_owner(); v := v || jsonb_build_object('c310_rilis', 'ERR:' || sqlerrm); end;`,
    langkah("c310_terbit", null, `select r.status::text from public.plp_releases r where r.id = ${G("d1_rel")}`),
    `perform pg_temp.c1_duduk('m1', ${G("d1_pre")}, true, true, 's1');
     perform set_config('c1.xs', coalesce((select p.item_id::text from public.presented_items p join public.ai_asal_soal a on a.item_id = p.item_id
       where p.session_id = ${G("s1")} order by p.position limit 1), ''), true);`,
    langkah("c310_duduk", null, `select (select count(*) from public.presented_items p join public.ai_asal_soal a on a.item_id = p.item_id where p.session_id = ${G("s1")})::text
        || '|' || (select count(*) from public.assessment_results r where r.session_id = ${G("s1")})::text`),
    `perform set_config('c1.xs_kunci', (select case when bool_or(o.label = 'A' and o.is_correct) then 'B' else 'A' end from public.item_options o where o.item_id = nullif(current_setting('c1.xs'), '')::uuid), true);`,
    langkah("c310_aju", "admin", `select public.ajukan_koreksi_kunci(${G("xs")}, array[current_setting('c1.xs_kunci')], 'Kunci soal yang disusun dengan AI keliru dan diperbaiki.') ->> 'koreksi' is not null`),
    `perform set_config('c1.k1', (select k.id::text from public.key_corrections k where k.item_id = public.soal_ujung(${G("xs")}) and k.status = 'PENDING'), true);`,
    langkah("c310_tegas", "kadep2", `select (x ->> 'ok') from public.tegaskan_koreksi_kunci(${G("k1")}) x`),
    `perform set_config('c1.x2', public.soal_ujung(${G("xs")})::text, true);`,
    langkah("c310_hasil", null, `select count(*)::text || '|' || count(*) filter (where r.supersedes_result_id is not null)::text
        from public.assessment_results r where r.session_id = ${G("s1")}`),
    langkah("c310_catat", "kadep", `select (public.catatan_peninjau_tulis(${G("x2")}, (select case when current_setting('c1.xs_kunci') = 'B' then 'A' else 'B' end), 'Banyak murid memilih pilihan ini sebelum kuncinya diperbaiki.', null) ->> 'id') is not null`),
    langkah("c310_asal", null, `select (select count(*) from public.ai_asal_soal a where a.item_id = ${G("xs")})::text || '|'
        || (select keputusan from public.ai_penerimaan p where p.item_id = ${G("xs")} order by p.pada desc, p.id desc limit 1)`),
  ];
  dunia = jalankan(c, repoRoot, L);
  return dunia;
}
const ditolak = (x: string | undefined) => x !== undefined && !x.startsWith("ok:");

// ------------------------------------------------------------------ the ledger alone, for the race and the two schools
/** A minimal ledger world, foreign keys off (replica): `n` requests per school, each a checked excerpt of 10 characters, so
 *  each worst case is 100 + (10 + 100) = 210 at a price of 1. */
function dunia2(tag: string, sekolah: Array<{ id: string; opsi: string; jatah: number; plafon: number; minta: string[] }>): string {
  const p = randomUUID();
  return `set local session_replication_role = replica;
${sekolah.map((s) => `insert into public.ai_opsi (id, kunci, nama_tampilan, model_ident, harga_dasar, maks_token_keluar, batas_token_prompt, status, plafon_biaya, henti_keras_terverifikasi)
  values ('${s.opsi}', 'c3-${tag.toLowerCase()}-${s.opsi.slice(0, 8)}', 'Uji', 'stub-1', '{"masuk": 1, "keluar": 1}', 100, 100, 'QUALIFIED', ${s.plafon}, true);
insert into public.ai_hak_sekolah (sekolah, opsi, aktif, jatah, mulai) values ('${s.id}', '${s.opsi}', true, ${s.jatah}, now() - interval '1 day');
${s.minta.map((m, i) => `insert into public.ai_permintaan (id, sekolah, pemohon, course_id, sumber_jenis, lesson_id, excerpt_sha256, tujuan, jumlah,
    kunci_idempoten, hak_sumber_dikonfirmasi_at, diperiksa_at, panjang_karakter)
  values ('${m}', '${s.id}', '${p}', '${randomUUID()}', 'TEMPEL', '${randomUUID()}', repeat('a', 64), 'Tujuan', 2, 'c3-${tag}-${s.id.slice(0, 8)}-${i}', now(), now(), 10);`).join("\n")}`).join("\n")}
insert into public.ai_plafon_platform (plafon) values (1000000000000) on conflict (id) do nothing;
set local session_replication_role = origin;`;
}
function hapus2(sekolah: string[]): string {
  const s = sekolah.map((x) => `'${x}'`).join(",");
  return `begin; set local session_replication_role = replica;
delete from public.ai_percobaan where permintaan in (select id from public.ai_permintaan where sekolah in (${s}));
delete from public.ai_permintaan where sekolah in (${s});
delete from public.ai_opsi where id in (select opsi from public.ai_hak_sekolah where sekolah in (${s}));
delete from public.ai_hak_sekolah where sekolah in (${s});
commit;`;
}
const coba = `create or replace function pg_temp.coba(p_sql text) returns text language plpgsql as $f$
declare v text; d text; st text;
begin execute p_sql into v; return 'ok:' || coalesce(v, '');
exception when others then get stacked diagnostics st = returned_sqlstate, d = pg_exception_detail; return st || ':' || coalesce(nullif(d, ''), sqlerrm); end $f$;`;

// ------------------------------------------------------------------ source walks
const semua = (dir: string): string[] => !existsSync(dir) ? [] : readdirSync(dir).flatMap((n) => {
  const f = join(dir, n);
  return statSync(f).isDirectory() ? semua(f) : /\.(ts|tsx)$/.test(n) ? [f] : [];
});
const VENDOR = /\b(openai|anthropic|claude|gemini|gpt[-_]?\d|mistral|cohere|llama|bedrock|vertex)\b/i;
const SDK_VENDOR = ["openai", "@anthropic-ai/sdk", "@google/generative-ai", "@google/genai", "cohere-ai", "@mistralai/mistralai", "@aws-sdk/client-bedrock-runtime", "ai", "@ai-sdk/openai", "@ai-sdk/anthropic"];

export const c3wC3Tests: SelfTest[] = [
  {
    id: "C3W-C32",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, "the scenario did not run")) return c.verdict("");
      c.expect(h!.c32_tabel === "ok:", `an AI table a session's role may read or write: ${h!.c32_tabel} (none)`);
      c.expect(h!.c32_fungsi === `ok:${BACA_TERGERBANG.join(",")}`, `the functions a signed-in session may run that read an AI table: ${h!.c32_fungsi} (exactly ${BACA_TERGERBANG.join(", ")})`);
      for (const k of ["c32_murid_minta", "c32_murid_putus", "c32_murid_hitung", "c32_murid_asal"]) c.expect(ditolak(h![k]), `a learner, ${k}: ${h![k]} (refused)`);
      c.expect(h!.c32_murid_ada === "ok:false" && h!.c32_guru_ada === "ok:true", `whether drafting with AI is offered, to a learner|the teacher: ${h!.c32_murid_ada}|${h!.c32_guru_ada} (false|true)`);
      c.expect(h!.c32_guru_asal === "ok:3", `the package's teacher reads its provenance: ${h!.c32_guru_asal} (3 generated drafts)`);
      c.expect(ditolak(h!.c32_lain_asal), `another school's administrator reads it: ${h!.c32_lain_asal} (refused)`);
      const tipe = await import("../src/lib/assessment-engine/types") as { ANSWER_KEY_FIELDS?: readonly string[]; AI_PROVENANCE_FIELDS?: readonly string[] };
      const mesin = await import("../src/lib/assessment-engine/index") as { sanitize?: (x: unknown) => unknown };
      const asalKunci = tipe.AI_PROVENANCE_FIELDS ?? [];
      c.expect(["model_ident", "versi_prompt", "excerpt_sha256", "isi_sha256", "permintaan", "percobaan", "pemohon", "id_penyedia"].every((k) => asalKunci.includes(k)),
        `the engine's forbidden provenance keys: ${JSON.stringify(asalKunci)} (every ai_asal_soal column a learner must never receive)`);
      for (const k of asalKunci) {
        let dilempar = false;
        try { mesin.sanitize?.({ item_type: "MCQ_SINGLE", stem: "S", opsi: [], [k]: "x" }); } catch { dilempar = true; }
        c.expect(dilempar, `the learner payload carrying ${k} is not refused by sanitize()`);
      }
      return c.verdict("executes, in one rolled-back transaction of C1w's world: no AI table is readable or writable by anon or authenticated; the only functions a signed-in session may run that read one are ai_asal_paket, ai_draf_belum_diputuskan, ai_minta_draf, ai_putuskan and ai_tersedia, and a learner is refused by each or offered nothing; the package's teacher reads its three drafts' provenance and another school's administrator is refused; and imports the assessment engine's source: its forbidden provenance keys name every ai_asal_soal column, and sanitize() refuses a learner payload carrying any of them");
    },
  },
  {
    id: "C3W-C34",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const tag = Date.now().toString(36);
      // the platform row is a singleton other suites plant in their own transactions: removed again if this test made it
      const adaPlafon = psql("select count(*) from public.ai_plafon_platform").stdout.trim() !== "0";
      try {
      const satu = async (urutan: string, tanam: boolean) => {
        const sk = randomUUID(), op = randomUUID(), m1 = randomUUID(), m2 = randomUUID();
        const r = psql(`begin; ${dunia2(tag + urutan, [{ id: sk, opsi: op, jatah: 210, plafon: 1000000000, minta: [m1, m2] }])} commit;`);
        if (!c.expect(r.status === 0, `the ledger world (${urutan}): ${r.stderr}`)) return;
        try {
          const [a, b] = urutan === "AB" ? [m1, m2] : [m2, m1];
          const ras = await balapan(`select public.ai_cadangkan('${a}')`, `select public.ai_cadangkan('${b}')`);
          const n = psql(`select count(*) from public.ai_percobaan where permintaan in ('${m1}', '${m2}')`).stdout.trim();
          if (tanam) {
            c.expect(ras.satu.ok && ras.dua.ok && n === "2", `the plant (the three row locks removed) did not let both through: ${ras.satu.ok}/${ras.dua.ok}, ${n} attempts`);
          } else {
            c.expect(ras.berlaku, `${urutan}: the second reservation did not wait on the first (${ras.dua.ms} ms): not a race`);
            c.expect(ras.satu.ok && !ras.dua.ok && /AI_JATAH_HABIS/.test(ras.dua.err) && n === "1",
              `${urutan}: at the allowance's edge, first ${ras.satu.ok ? "reserved" : ras.satu.err}, second ${ras.dua.ok ? "reserved" : ras.dua.err}; ${n} attempt(s) (exactly one, the other AI_JATAH_HABIS)`);
          }
        } finally { psql(hapus2([sk])); }
      };
      await satu("AB", false);
      await satu("BA", false);
      // the plant: the three row locks (school, option, platform) removed, so the sums are read unserialised
      const pulih: Array<() => void> = [];
      try {
        pulih.push(gantiFungsi("public.ai_cadangkan(uuid)", "where sekolah = m.sekolah for update", "where sekolah = m.sekolah"));
        pulih.push(gantiFungsi("public.ai_cadangkan(uuid)", "where id = h.opsi for update", "where id = h.opsi"));
        pulih.push(gantiFungsi("public.ai_cadangkan(uuid)", "from public.ai_plafon_platform where id for update", "from public.ai_plafon_platform where id"));
        await satu("tanam", true);
      } catch (e) { c.expect(false, `the plant could not be set: ${(e as Error).message}`); } finally { for (const p of pulih.reverse()) p(); }
      // a retry is its own attempt; the third is the last
      const sk = randomUUID(), op = randomUUID(), m = randomUUID();
      const r = psql(`begin; ${dunia2(tag + "u", [{ id: sk, opsi: op, jatah: 100000, plafon: 1000000000, minta: [m] }])} ${coba}
        select string_agg(pg_temp.coba($$select public.ai_cadangkan('${m}')::text$$) ~ '^ok:' || '', ',') from generate_series(1, 3);
        select pg_temp.coba($$select public.ai_cadangkan('${m}')::text$$);
        select count(distinct id) from public.ai_percobaan where permintaan = '${m}';
        rollback;`);
      const [tiga, keempat, beda] = r.stdout.trim().split("\n");
      c.expect(tiga === "true,true,true" && keempat === "PR220:AI_GAGAL" && beda === "3",
        `three retries: ${tiga}; a fourth: ${keempat}; distinct attempts: ${beda} (each its own reservation; the fourth refused AI_GAGAL)`);
      } finally { if (!adaPlafon) psql("delete from public.ai_plafon_platform"); }
      return c.verdict("executes ai_cadangkan on two real connections at an allowance of exactly one worst case, in both orders: the second waits on the school's row and is refused AI_JATAH_HABIS, one attempt reserved; with its three row locks removed (planted, then restored) both are reserved; a retry is its own attempt and the fourth is refused AI_GAGAL");
    },
  },
  {
    id: "C3W-C35",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const tag = Date.now().toString(36);
      const A = { id: randomUUID(), opsi: randomUUID(), jatah: 420, plafon: 420, minta: [randomUUID(), randomUUID(), randomUUID()] };
      const B = { id: randomUUID(), opsi: randomUUID(), jatah: 210, plafon: 210, minta: [randomUUID()] };
      const r = psql(`begin; ${dunia2(tag, [A, B])} ${coba}
        select pg_temp.coba($$select public.ai_cadangkan('${A.minta[0]}')::text$$) ~ '^ok:';
        select pg_temp.coba($$select public.ai_cadangkan('${A.minta[1]}')::text$$) ~ '^ok:';
        select pg_temp.coba($$select public.ai_cadangkan('${A.minta[2]}')::text$$);
        select pg_temp.coba($$select public.ai_cadangkan('${B.minta[0]}')::text$$) ~ '^ok:';
        select string_agg((m.sekolah::text = '${A.id}' and p.opsi = '${A.opsi}' or m.sekolah::text = '${B.id}' and p.opsi = '${B.opsi}')::text, ',')
          from public.ai_percobaan p join public.ai_permintaan m on m.id = p.permintaan where m.sekolah in ('${A.id}', '${B.id}');
        rollback;`);
      if (!c.expect(r.status === 0, `the ledger world: ${r.stderr}`)) return c.verdict("");
      const [a1, a2, a3, b1, rute] = r.stdout.trim().split("\n");
      c.expect(a1 === "t" && a2 === "t" && a3 === "PR220:AI_JATAH_HABIS", `school A's three requests: ${a1}, ${a2}, ${a3} (two reserved, the third AI_JATAH_HABIS)`);
      c.expect(b1 === "t", `school B, its allowance one worst case, after A used all of its own: ${b1} (reserved: A's spend is not B's)`);
      c.expect(rute === "true,true,true", `each attempt on its own school's option: ${rute}`);
      return c.verdict("executes ai_cadangkan in one rolled-back transaction on two schools with two options: school A reserves up to its own allowance and is then refused AI_JATAH_HABIS; school B, whose allowance and option ceiling are one worst case each, still reserves; every attempt carries its own school's option");
    },
  },
  {
    id: "C3W-C36",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, "the scenario did not run")) return c.verdict("");
      c.expect(/^PR220:AI_(TIDAK_TERSEDIA|HAK_BERAKHIR)$|^ok:\{"ok": false, "kode": "AI_(TIDAK_TERSEDIA|HAK_BERAKHIR)"\}$/.test(h!.c36_minta ?? ""),
        `a new request with the entitlement off: ${h!.c36_minta} (refused AI_TIDAK_TERSEDIA)`);
      c.expect(h!.c36_x === "ok:ACCEPTED" && h!.c36_y === "ok:EDITED" && h!.c36_z === "ok:DELETED", `deciding with the entitlement off: ${h!.c36_x}, ${h!.c36_y}, ${h!.c36_z} (ACCEPTED, EDITED, DELETED)`);
      c.expect(h!.c36_asal === "ok:ACCEPTED:false:Uji Stub,EDITED:true:Uji Stub", `the provenance the teacher reads: ${h!.c36_asal} (the kept two, the edit seen, the option's display name)`);
      c.expect((h!.c36_aju ?? "").startsWith("ok:") && (h!.c36_setuju ?? "").startsWith("ok:"), `submitted, then approved by the second person: ${h!.c36_aju}; ${h!.c36_setuju}`);
      c.expect(h!.c36_tinjau === "ok:ACCEPTED,EDITED", `the reviewer reads the provenance: ${h!.c36_tinjau}`);
      return c.verdict("executes, in one rolled-back transaction of C1w's world, with the school's entitlement switched off after the drafts were written: a new request is refused, yet the teacher keeps one draft, keeps an edited one and removes the third, submits the package, the head of department approves it, and both read the provenance (the edit derived, the option's display name)");
    },
  },
  {
    id: "C3W-C38",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = semua(join(repoRoot, "src"));
      const rel = (f: string) => relative(repoRoot, f).replace(/\\/g, "/");
      const pengimpor = (m: string) => src.filter((f) => new RegExp(`from\\s+["']${m.replace(/[/@]/g, (x) => `\\${x}`)}["']`).test(readFileSync(f, "utf8"))).map(rel).sort();
      c.expect(JSON.stringify(pengimpor("@/lib/ai/stub")) === JSON.stringify(["src/lib/ai/penyedia.ts"]), `importers of the stub: ${pengimpor("@/lib/ai/stub").join(", ")} (only the provider module)`);
      c.expect(JSON.stringify(pengimpor("@/lib/ai/penyedia")) === JSON.stringify(["src/app/api/draf-ai/route.ts"]), `importers of the provider module: ${pengimpor("@/lib/ai/penyedia").join(", ")} (only the drafting route)`);
      const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const dep = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
      c.expect(!dep.some((d) => SDK_VENDOR.includes(d)), `an AI vendor SDK is a dependency: ${dep.filter((d) => SDK_VENDOR.includes(d)).join(", ")}`);
      for (const f of src) {
        const t = readFileSync(f, "utf8");
        for (const s of SDK_VENDOR) if (new RegExp(`from\\s+["']${s.replace(/[/@]/g, (x) => `\\${x}`)}["']`).test(t)) c.expect(false, `${rel(f)} imports ${s}`);
      }
      // no vendor name in a schema name
      const r = spawnSync("psql", ["-X", "-At", db(), "-c", `select n from (
          select c.relname as n from pg_class c where c.relnamespace = 'public'::regnamespace
          union select a.attname from pg_attribute a join pg_class c on c.oid = a.attrelid where c.relnamespace = 'public'::regnamespace and a.attnum > 0
          union select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace) x order by 1`], { encoding: "utf8" });
      const vendor = (r.stdout ?? "").split("\n").filter((n) => VENDOR.test(n.replace(/_/g, " ")));
      c.expect(r.status === 0 && vendor.length === 0, `a vendor name in a schema name: ${vendor.join(", ")}`);
      // no learner surface carries the AI mark
      const belajar = [...semua(join(repoRoot, "src", "app", "belajar")), ...semua(join(repoRoot, "src", "components", "pelajaran")),
        ...semua(join(repoRoot, "src", "components", "sesi")), ...semua(join(repoRoot, "src", "components", "sertifikat"))];
      c.expect(belajar.length > 5, `only ${belajar.length} learner source file(s) found`);
      for (const f of belajar) {
        const t = readFileSync(f, "utf8");
        if (/studio\.ai\.|Draf dari AI|Disusun dengan AI|ai_asal|@\/lib\/ai\//.test(t)) c.expect(false, `${rel(f)} carries the AI mark or reads provenance`);
      }
      return c.verdict(`reads the source of every file under src: only src/lib/ai/penyedia.ts imports the stub and only the drafting route imports the provider module; package.json lists no AI vendor SDK and no file imports one; the database catalogue names no table, column or function after a vendor; the ${belajar.length} learner source files carry no AI mark and read no provenance`);
    },
  },
  {
    id: "C3W-C310",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, "the scenario did not run")) return c.verdict("");
      c.expect(h!.c310_terbit === "ok:PUBLISHED", `the package with its generated questions, released: ${h!.c310_terbit} (PUBLISHED)`);
      c.expect(/^ok:[1-9]\d*\|[1-9]/.test(h!.c310_duduk ?? ""), `the learner sat it: generated questions presented|results ${h!.c310_duduk} (at least 1|at least 1)`);
      c.expect(h!.c310_aju === "ok:true" && h!.c310_tegas === "ok:true", `the generated question's key corrected (C2w's path): ${h!.c310_aju}; ${h!.c310_tegas}`);
      c.expect(/^ok:[2-9]\|[1-9]/.test(h!.c310_hasil ?? ""), `the sitting's results after the correction: ${h!.c310_hasil} (a superseding result)`);
      c.expect(h!.c310_catat === "ok:true", `a reviewer's note on the corrected question: ${h!.c310_catat}`);
      c.expect(h!.c310_asal === "ok:1|ACCEPTED" || h!.c310_asal === "ok:1|EDITED", `its provenance and acceptance, kept on the line: ${h!.c310_asal} (1|ACCEPTED or EDITED: the sitting may present the edited draft)`);
      return c.verdict("executes, in one rolled-back transaction of C1w's world: a package whose questions were generated, accepted by the teacher and approved by the second person is released and published by the school's people, given to the class and sat; the generated question's key is corrected through C2w's governed path and the sitting rescored; a reviewer annotates the corrected question; the question's provenance and acceptance stay on its line");
    },
  },
];

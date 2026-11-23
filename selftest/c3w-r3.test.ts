/**
 * C3w-1 · R-3: NO LEARNER PERSONAL INFORMATION REACHES A PROVIDER, the red cases, written before any R-3 code
 * (Sharon's C3W-R3-DESIGN.md on claude/gracious-lamport-0m1qjr, controls 1 to 5 and the common-names rule; adopted by
 * C3W-1-DESIGN.md §6 C3-7). C1w's scenario harness (selftest/c1w.test.ts): the seeded learning-cycle school, a teacher
 * of this suite with a class of their own, learners in it, the fixture class's learners whom that teacher cannot see,
 * and a draft package of the teacher's. One transaction, rolled back.
 *
 * The interface these cases assume (Sharon's names where she gives one):
 *   c3w_periksa_bahan(p_teks text) returns jsonb  {boleh, kelas[], rentang[]}: the check, as the signed-in educator
 *   ai_minta_draf(p_course, p_lesson, p_teks, p_tujuan, p_jumlah, p_kunci_idempoten, p_hak_sumber[, p_sumber]) returns jsonb
 *       (p_lesson is the target lesson, required, Bob's ruling of 21 Nov)
 *       {ok, kode?, permintaan, kelas?, rentang?}: the request, its identity from the session (D-1); a refusal is a
 *       recorded outcome, not an error, so the ledger row stands (control 4)
 *   c3w_bahan(p_lesson, p_objectives): content reads, LANGUAGE sql with a SQL-standard body, SECURITY INVOKER, owned
 *       by postgres (Sharon's ruling (b), 625d52c1; Bob's B1): the teacher's own content RLS applies
 *   src/lib/ai/permintaan.ts bangunPermintaan(...): the one builder, a closed four-key record (control 1)
 *
 *   R3-01  a visible learner's full name is refused before anything is reserved: AI_DATA_PRIBADI, the request
 *          REFUSED_PERSONAL_DATA with no hash, no attempt, and the reservation refused; an allowed request is checked,
 *          hashed and reservable. Plant: the check answers «allowed» (the request then passes).
 *   R3-02  hard identifiers, each refused IDENTIFIER: a PINTAR ID, an email, two phone shapes, a 10-digit and a 16-digit
 *          number.
 *   R3-03  list shapes, each refused LIST: three names with scores, three names with a class label (names PINTAR cannot
 *          know), and three visible learners' given names in one line.
 *   R3-04  ordinary text passes: «Budi membeli lima apel» where a learner Budi Santoso is visible; an 8-letter word that
 *          a PINTAR ID's alphabet could spell; ordinary numbers.
 *   R3-05  the full name of a learner the educator cannot see, in prose: allowed, and the answer equals the answer for a
 *          name of no learner (no disclosure of a learner's existence).
 *   R3-06  the check's answer holds exactly boleh, kelas and rentang, and never the name, the PINTAR ID or the person id.
 *   R3-07  controls 1, 3 and 4 (Sharon's ruling (b), 625d52c1, with Bob's B1, B3 and B4): c3w_bahan is LANGUAGE sql with
 *          a SQL-standard body, SECURITY INVOKER and owned by postgres, and everything it depends on is a content table
 *          (or its columns or types) or a pg_catalog object, by scripts/release/after-promotion/c3w-r3-bahan.sql
 *          (the staging check, run here). Five plants each turn it red: a read of persons, a public helper reading
 *          persons, a view over persons, a string body and plpgsql. As the invoker it returns the teacher's own lesson
 *          and nothing of another school's. The builder's record deep-equals its fixture (the schema too) and refuses
 *          a fifth key; src/lib/ai imports only itself, server-only and node:crypto, and calls no fetch.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { G, S, jalankan, langkah, q } from "./c1w.test";
import { tanamTujuan } from "./c3w-terima.test";

const NAMA_TAMPAK = "Rina Kartika Sari";
const NAMA_BUDI = "Budi Santoso";
const NAMA_TONO = "Tono Wijaya";
const NAMA_TERSEMBUNYI = "Dewi Lestari Putri";
const NAMA_BUKAN_MURID = "Siti Nurhaliza Rahman";
/** A SQL text literal (no newline); a line break is ` || chr(10) || `. */
const t = (s: string) => `'${s.replace(/'/g, "''")}'`;
const baris = (...l: string[]) => l.map(t).join(" || chr(10) || ");

/** R3-01's plant: the check answering «allowed» to everything, as a SQL text literal for EXECUTE. */
const TANAM_PERIKSA = t(`create or replace function public.c3w_periksa_bahan(p_teks text) returns jsonb language sql as 'select ''{"boleh": true, "kelas": [], "rentang": []}''::jsonb'`);

/** B4's check after every promotion (C3W-R3-BAHAN), run here on the real function and on each plant (one source, so the two cannot drift). */
const CEK = (repoRoot: string) => readFileSync(join(repoRoot, "scripts", "release", "after-promotion", "c3w-r3-bahan.sql"), "utf8");
const BAHAN = "create or replace function public.c3w_bahan(p_lesson uuid, p_objectives uuid[]) returns jsonb language ";
/** R3-07's plants (Sharon's two and Bob's B3): each replaces c3w_bahan, the check runs, and everything is undone. */
const TANAM_BAHAN: Array<[string, string[], string]> = [
  ["orang", [`${BAHAN}sql stable begin atomic select jsonb_build_object('x', (select p.display_name from public.persons p limit 1)); end`], "persons"],
  ["pembantu", ["create function public.c3w_tanam_bantu() returns text language sql stable begin atomic select p.display_name from public.persons p limit 1; end",
    `${BAHAN}sql stable begin atomic select jsonb_build_object('x', public.c3w_tanam_bantu()); end`], "c3w_tanam_bantu"],
  ["tampilan", ["create view public.c3w_tanam_v as select p.display_name from public.persons p",
    `${BAHAN}sql stable begin atomic select jsonb_build_object('x', (select v.display_name from public.c3w_tanam_v v limit 1)); end`], "c3w_tanam_v"],
  ["teks", [`${BAHAN}sql stable as 'select jsonb_build_object(''judul'', l.title) from public.lessons l where l.id = p_lesson'`], "string body"],
  ["plpgsql", [`${BAHAN}plpgsql stable as 'begin return (select jsonb_build_object(''judul'', l.title) from public.lessons l where l.id = p_lesson); end'`], "plpgsql"],
];
const tanamBahan = (repoRoot: string) => TANAM_BAHAN.map(([k, ddl]) => `declare x text; begin
      ${ddl.map((d) => `execute ${q(d)};`).join(" ")}
      execute ${q(CEK(repoRoot))} into x;
      v := v || jsonb_build_object('tanam_${k}', x);
      raise exception 'c3w-batal';
    exception when others then if sqlerrm <> 'c3w-batal' then v := v || jsonb_build_object('tanam_${k}', 'ERR:' || sqlerrm); end if;
    end;`);

/** Bob's ruling (21 Nov): every request names the lesson of the package its drafts are written into; a pasted excerpt
 *  is only the source. */
const SASARAN = `(select l.id from public.lessons l join public.modules md on md.id = l.module_id where md.course_id = ${G("d1")} order by l.ordinal limit 1)`;

const periksa = (k: string, teks: string) => langkah(k, "guru", `select public.c3w_periksa_bahan(${teks})::text`);
const minta = (k: string, teks: string, kunci: string) =>
  langkah(k, "guru", `select public.ai_minta_draf(${G("d1")}, ${SASARAN}, ${teks}, 'Membandingkan pecahan', 2, '${kunci}', true)::text`);

const IDENTITAS: Array<[string, string]> = [
  ["pintar", t("Hubungi 7K3M9QX2 untuk tugas tambahan.")],
  ["email", t("Kirim jawabanmu ke budi.s@sekolah.invalid sebelum Jumat.")],
  ["hp", t("Hubungi 081234567890 bila ada pertanyaan.")],
  ["hp62", t("Hubungi +6281234567890 bila ada pertanyaan.")],
  ["nisn", t("NISN 0071234567 terdaftar.")],
  ["nik", t("NIK 3201234567890001 terdaftar.")],
];
const DAFTAR: Array<[string, string]> = [
  ["nilai", baris("Andi 85", "Bayu 90", "Citra 78")],
  ["kelas", baris("Andi Pratama - 7A", "Bayu Saputra - 7A", "Citra Ayu - 7B")],
  ["tiga_tampak", t("Rina, Budi dan Tono maju ke depan kelas.")],
];
const BIASA: Array<[string, string]> = [
  ["budi", t("Budi membeli lima apel di pasar.")],
  ["kata8", t("Setelah itu pelajari hasilnya bersama teman.")],
  ["angka", t("Ada 12 apel dan 2024 butir beras dalam 3 karung.")],
];

let hasil: Record<string, string> | null | undefined;
let galat = "";
function skenario(c: Checks, repoRoot: string): Record<string, string> | null {
  if (hasil !== undefined) return hasil;
  const ganti = (p: string, nama: string) => `update public.persons set display_name = '${nama}' where id = ${G(`p_${p}`)};`;
  const L: string[] = [
    `perform pg_temp.c1_murid('m1'); perform pg_temp.c1_murid('m2'); perform pg_temp.c1_murid('m3');`,
    `set local session_replication_role = replica; ${ganti("m1", NAMA_TAMPAK)} ${ganti("m2", NAMA_BUDI)} ${ganti("m3", NAMA_TONO)}
     perform set_config('c1.p_sembunyi', (select e.person_id::text from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
        where mm.node_id = ${G("kelas_lama")} and mm.valid_to is null
          and not exists (select 1 from public.memberships m2 where m2.enrollment_id = mm.enrollment_id and m2.node_id = ${G("kelas")})
        order by e.person_id limit 1), true);
     update public.persons set display_name = '${NAMA_TERSEMBUNYI}' where id = ${G("p_sembunyi")};
     set local session_replication_role = origin;`,
    `perform pg_temp.c1_draf('d1');`, tanamTujuan(G("d1")),
    // the school's entitlement, its option and the platform row: the operator's rows, written as the owner
    `insert into public.ai_opsi (kunci, nama_tampilan, model_ident, harga_dasar, status, plafon_biaya, henti_keras_terverifikasi)
       values ('r3-' || ${S("tag")}, 'Uji', 'stub-1', '{"masuk": 1, "keluar": 1}', 'QUALIFIED', 100000000, true);
     insert into public.ai_plafon_platform (plafon) values (100000000) on conflict (id) do nothing;
     insert into public.ai_hak_sekolah (sekolah, opsi, aktif, jatah, mulai)
       select ${G("inst")}, o.id, true, 100000000, now() - interval '1 day' from public.ai_opsi o where o.kunci = 'r3-' || ${S("tag")};`,
    // R3-01, R3-06: a visible learner's full name
    periksa("r01_periksa", t(`Kemarin ${NAMA_TAMPAK} membaca buku cerita.`)),
    minta("r01_minta", t(`Kemarin ${NAMA_TAMPAK} membaca buku cerita.`), "r3-tampak"),
    langkah("r01_baris", null, `select coalesce(m.hasil, 'null') || '|' || coalesce(m.excerpt_sha256, 'null') || '|'
        || (select count(*) from public.ai_percobaan a where a.permintaan = m.id)
       from public.ai_permintaan m where m.pemohon = ${G("p_guru")} and m.kunci_idempoten = 'r3-tampak'`),
    langkah("r01_cadang", null, `select public.ai_cadangkan((select m.id from public.ai_permintaan m where m.pemohon = ${G("p_guru")} and m.kunci_idempoten = 'r3-tampak'))::text`),
    langkah("r06_ids", null, `select ${G("p_m1")}::text || '|' || coalesce((select p.pintar_id from public.persons p where p.id = ${G("p_m1")}), '')`),
    // R3-01: an allowed request is checked, hashed and reservable
    minta("r01_boleh", t("Budi membeli lima apel di pasar."), "r3-boleh"),
    langkah("r01_boleh_baris", null, `select (m.diperiksa_at is not null)::text || '|' || (m.excerpt_sha256 = encode(extensions.digest('Budi membeli lima apel di pasar.', 'sha256'), 'hex'))::text
         || '|' || coalesce(m.hasil, 'null') || '|' || (m.sekolah = ${G("inst")})::text
       from public.ai_permintaan m where m.pemohon = ${G("p_guru")} and m.kunci_idempoten = 'r3-boleh'`),
    langkah("r01_boleh_cadang", null, `select (public.ai_cadangkan((select m.id from public.ai_permintaan m where m.pemohon = ${G("p_guru")} and m.kunci_idempoten = 'r3-boleh')) is not null)::text`),
    // R3-02, R3-03, R3-04
    ...IDENTITAS.map(([k, x]) => periksa(`r02_${k}`, x)),
    ...DAFTAR.map(([k, x]) => periksa(`r03_${k}`, x)),
    ...BIASA.map(([k, x]) => periksa(`r04_${k}`, x)),
    // R3-05: a learner this educator cannot see, and a name of no learner, in the same sentence
    periksa("r05_tersembunyi", t(`Kemarin ${NAMA_TERSEMBUNYI} membaca buku cerita.`)),
    periksa("r05_bukan", t(`Kemarin ${NAMA_BUKAN_MURID} membaca buku cerita.`)),
    // the hidden learner exists, at this school, and is out of this teacher's sight (else R3-05 would hold vacuously)
    langkah("r05_ada", null, `select count(*)::text from public.persons p where p.display_name = '${NAMA_TERSEMBUNYI}'`),
    langkah("r05_tak_tampak", "guru", `select public.person_visible_to_me(${G("p_sembunyi")})::text`),
    // R3-07: control 1, by the staging check (B4); the invoker reads the teacher's own lesson and nothing of another school's
    langkah("r07_cek", null, CEK(repoRoot)),
    langkah("r07_bahan_guru", "guru", `select (public.c3w_bahan((select l.id from public.lessons l join public.modules md on md.id = l.module_id
        where md.course_id = ${G("d1")} order by l.ordinal limit 1), null) ->> 'judul') is not null`),
    langkah("r07_lain_ada", null, `select count(*)::text from public.lessons l join public.institutions i on i.id = l.institution_id
        where l.institution_id <> ${G("inst")} and i.tenant_kind = 'INSTITUTION'`),
    langkah("r07_bahan_lain", "guru", `select coalesce(public.c3w_bahan((select l.id from public.lessons l join public.institutions i on i.id = l.institution_id
        where l.institution_id <> ${G("inst")} and i.tenant_kind = 'INSTITUTION' order by l.id limit 1), null)::text, 'null')`),
    ...tanamBahan(repoRoot),
    // the last plant: the check answering «allowed» (R3-01); a DDL statement returns nothing for the probe to read
    `begin execute ${TANAM_PERIKSA}; exception when others then null; end;`,
    minta("tanam_minta", t(`Kemarin ${NAMA_TAMPAK} membaca buku cerita.`), "r3-tanam"),
  ];
  hasil = jalankan(c, repoRoot, L);
  if (!hasil) galat = "the scenario did not run (see the first failure above)";
  return hasil;
}

const json = (x: string | undefined): Record<string, unknown> | null => {
  if (!x?.startsWith("ok:")) return null;
  try { return JSON.parse(x.slice(3)) as Record<string, unknown>; } catch { return null; }
};
const kelasDari = (x: string | undefined) => ((json(x)?.kelas ?? null) as string[] | null);
const ditolakSebagai = (x: string | undefined, kelas: string) => json(x)?.boleh === false && (kelasDari(x) ?? []).includes(kelas);
const boleh = (x: string | undefined) => json(x)?.boleh === true && (kelasDari(x) ?? ["?"]).length === 0;

const semuaTs = (dir: string): string[] => !existsSync(dir) ? [] : readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? semuaTs(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []);

export const c3wR3Tests: SelfTest[] = [
  {
    id: "R3-01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, galat)) return c.verdict("");
      const m = json(h!.r01_minta);
      c.expect(m?.ok === false && m?.kode === "AI_DATA_PRIBADI", `a visible learner's full name: ${h!.r01_minta} (refused AI_DATA_PRIBADI, as an answer)`);
      c.expect(h!.r01_baris === "ok:REFUSED_PERSONAL_DATA|null|0", `its ledger row (outcome|hash|attempts): ${h!.r01_baris} (REFUSED_PERSONAL_DATA|null|0)`);
      c.expect(!(h!.r01_cadang ?? "").startsWith("ok:"), `reserving the refused request: ${h!.r01_cadang} (refused)`);
      const b = json(h!.r01_boleh);
      c.expect(b?.ok === true && typeof b?.permintaan === "string", `an allowed request: ${h!.r01_boleh} (ok, with its request id)`);
      c.expect(h!.r01_boleh_baris === "ok:true|true|null|true", `its row (checked|sha-256 of the text|outcome|the package's school): ${h!.r01_boleh_baris}`);
      c.expect(h!.r01_boleh_cadang === "ok:true", `reserving the allowed request: ${h!.r01_boleh_cadang} (an attempt)`);
      c.expect(json(h!.tanam_minta)?.ok === true, `the plant (the check answering «allowed») was not caught: ${h!.tanam_minta}`);
      return c.verdict(`executes ai_minta_draf and ai_cadangkan in one rolled-back transaction as the class's teacher (Sharon's R3-01): an excerpt naming «${NAMA_TAMPAK}», a learner of their class, is answered AI_DATA_PRIBADI; its ledger row is REFUSED_PERSONAL_DATA with no hash and no attempt, and it cannot be reserved; an ordinary excerpt is checked, carries its sha-256 and the package's school, and reserves; with the check planted to answer «allowed», the named excerpt passes, so the check is what refuses. The stub's zero-call count is the route's half (C3-3)`);
    },
  },
  {
    id: "R3-02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, galat)) return c.verdict("");
      for (const [k] of IDENTITAS) c.expect(ditolakSebagai(h![`r02_${k}`], "IDENTIFIER"), `${k}: ${h![`r02_${k}`]} (refused, IDENTIFIER)`);
      return c.verdict("executes c3w_periksa_bahan as the teacher (Sharon's R3-02): a PINTAR ID, an email address, a 0- and a +62-phone number, a 10-digit NISN-shaped and a 16-digit NIK-shaped number are each refused IDENTIFIER");
    },
  },
  {
    id: "R3-03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, galat)) return c.verdict("");
      for (const [k] of DAFTAR) c.expect(ditolakSebagai(h![`r03_${k}`], "LIST"), `${k}: ${h![`r03_${k}`]} (refused, LIST)`);
      return c.verdict("executes c3w_periksa_bahan as the teacher (Sharon's R3-03): three lines of names with scores and three with a class label, none of them the school's learners, and three visible learners' given names in one line, are each refused LIST");
    },
  },
  {
    id: "R3-04",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, galat)) return c.verdict("");
      for (const [k] of BIASA) c.expect(boleh(h![`r04_${k}`]), `${k}: ${h![`r04_${k}`]} (allowed, no class)`);
      return c.verdict(`executes c3w_periksa_bahan as the teacher (Sharon's R3-04): «Budi membeli lima apel di pasar.» passes although «${NAMA_BUDI}» is a learner of their class; an ordinary 8-letter word a PINTAR ID's alphabet could spell, and ordinary numbers, pass`);
    },
  },
  {
    id: "R3-05",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, galat)) return c.verdict("");
      c.expect(h!.r05_ada === "ok:1" && h!.r05_tak_tampak === "ok:false",
        `the hidden learner: ${h!.r05_ada} person(s) named «${NAMA_TERSEMBUNYI}», visible to the teacher ${h!.r05_tak_tampak} (one, not visible)`);
      c.expect(boleh(h!.r05_tersembunyi), `a learner of the school this teacher cannot see: ${h!.r05_tersembunyi} (allowed)`);
      c.expect(h!.r05_tersembunyi === h!.r05_bukan, `the answers differ: ${h!.r05_tersembunyi} against a name of no learner ${h!.r05_bukan} (the check discloses existence)`);
      return c.verdict(`executes c3w_periksa_bahan as the teacher (Sharon's R3-05): the full name of a learner of the school outside their sight passes, and its answer is byte-identical to the answer for a name of no learner`);
    },
  },
  {
    id: "R3-06",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, galat)) return c.verdict("");
      const a = json(h!.r01_periksa);
      c.expect(a !== null && JSON.stringify(Object.keys(a).sort()) === JSON.stringify(["boleh", "kelas", "rentang"]),
        `the check's answer: ${h!.r01_periksa} (exactly boleh, kelas and rentang)`);
      c.expect(ditolakSebagai(h!.r01_periksa, "NAME"), `a visible learner's full name: ${h!.r01_periksa} (refused, NAME)`);
      const [pid, pin] = (h!.r06_ids ?? "").replace(/^ok:/, "").split("|");
      for (const [nama, x] of [["a part of the name", "Rina"], ["the name", NAMA_TAMPAK], ["the person id", pid], ["the PINTAR ID", pin]] as const) {
        if (x) c.expect(!`${h!.r01_periksa}|${h!.r01_minta}`.includes(x), `the check's or the request's answer carries ${nama}`);
      }
      return c.verdict("executes c3w_periksa_bahan and ai_minta_draf as the teacher (Sharon's R3-06): on a visible learner's full name the check answers exactly boleh, kelas (NAME) and rentang, and neither answer carries the name, any part of it, the person id or the PINTAR ID");
    },
  },
  {
    id: "R3-07",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (c.expect(h !== null, galat)) {
        c.expect(h!.r07_cek === "ok:OK", `the staging check on c3w_bahan: ${h!.r07_cek} (OK)`);
        c.expect(h!.r07_bahan_guru === "ok:true", `the teacher reading their own draft's lesson through c3w_bahan: ${h!.r07_bahan_guru} (its title)`);
        c.expect(Number((h!.r07_lain_ada ?? "").replace(/^ok:/, "")) > 0 && h!.r07_bahan_lain === "ok:null",
          `another school's lesson through c3w_bahan, as the teacher: ${h!.r07_bahan_lain} (${h!.r07_lain_ada} such lesson(s); nothing, by their own RLS)`);
        for (const [k, , kata] of TANAM_BAHAN) {
          const x = h![`tanam_${k}`] ?? "";
          c.expect(x !== "" && x !== "OK" && !x.startsWith("ERR:") && x.includes(kata), `the plant «${k}» was not caught: ${x || "(no answer)"} (a problem naming ${kata})`);
        }
      }
      // control 1: the one builder, a closed four-key record
      const pembangun = join(repoRoot, "src", "lib", "ai", "permintaan.ts");
      if (c.expect(existsSync(pembangun), "src/lib/ai/permintaan.ts is missing: no one builder")) {
        const m = await import(pembangun) as { bangunPermintaan?: (x: unknown) => Record<string, unknown> };
        if (c.expect(typeof m.bangunPermintaan === "function", "permintaan.ts does not export bangunPermintaan")) {
          const masuk = { excerpt: "Budi membeli lima apel di pasar.", objectives: ["Membandingkan pecahan"], jumlah: 2 };
          const r = m.bangunPermintaan!(masuk);
          // Sharon's ruling 4: the outbound record deep-compared with its fixture, the schema (the count) included
          const fixture = {
            excerpt: masuk.excerpt, objectives: masuk.objectives,
            itemSchema: { type: "array", minItems: 2, maxItems: 2, items: { type: "object", required: ["stem", "options"] } },
            promptVersion: "c3w-1.1",
          };
          const urut = (x: unknown): unknown => Array.isArray(x) ? x.map(urut) : x && typeof x === "object"
            ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, urut((x as Record<string, unknown>)[k])])) : x;
          c.expect(JSON.stringify(urut(r)) === JSON.stringify(urut(fixture)), `the builder's record: ${JSON.stringify(r)} (exactly ${JSON.stringify(fixture)})`);
          let tolak = false;
          try { m.bangunPermintaan!({ ...masuk, user: "guru@sekolah.invalid" }); } catch { tolak = true; }
          c.expect(tolak, "the builder accepts an extra key (user)");
        }
      }
      // controls 3 and 4: src/lib/ai imports only itself and server-only; nothing there calls fetch
      const ai = semuaTs(join(repoRoot, "src", "lib", "ai"));
      for (const f of ai) {
        const src = readFileSync(f, "utf8");
        const luar = [...src.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)].map((x) => x[1]).filter((x) => !/^(@\/lib\/ai\/|server-only$|node:crypto$)/.test(x));
        c.expect(luar.length === 0, `${relative(repoRoot, f)} imports ${luar.join(", ")} (src/lib/ai imports only itself, server-only and node:crypto)`);
        c.expect(!/\bfetch\s*\(/.test(src), `${relative(repoRoot, f)} calls fetch (no provider is reached in C3w-1)`);
      }
      return c.verdict("reads the catalogue in one rolled-back transaction and the source (Sharon's R3-07): by scripts/release/after-promotion/c3w-r3-bahan.sql, c3w_bahan is LANGUAGE sql with a SQL-standard body, SECURITY INVOKER and owned by postgres, and depends only on the four content tables and pg_catalog objects; five plants (a persons read, a public helper reading persons, a view over persons, a string body, plpgsql) are each caught; as the invoker it returns the teacher's own lesson and nothing of another school's; the one builder, src/lib/ai/permintaan.ts, deep-equals its fixture, the item schema with the count included, and refuses a fifth key; src/lib/ai imports only itself, server-only and node:crypto, and calls no fetch");
    },
  },
];

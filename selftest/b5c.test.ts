/**
 * BATCH 5 · AGENT C · TEACHER WORKFLOWS (owner, 3 Nov: «BATCH 5 DEVELOPMENT GO»). Each guard is RED on the code Batch 4
 * closed with (31e456d) and GREEN after.
 *
 *  B5C-MURID-K01  W2.18 · J5.13: the teacher's view of one learner lists the learning objectives the learner has not
 *                 yet reached, by their statement: the page asks pengajar.tujuanBelum, which asks the database's
 *                 tujuan_belum_tercapai (a SECURITY DEFINER function that returns the objective and its statement and
 *                 nothing else, checks the reader's teaching role over THIS class and the learner's placement in it,
 *                 and reads the class's official Uji Penguasaan against the mark sealed on each attempt); the section
 *                 shows no figure, says «belum» and never failure (X.5), and has an empty state; both languages.
 *                 Its isolation is proved in the database (F25-T01, F25-T02).
 *  B5C-BERANDA-K01 UX-37: what waits in a class is decided once (pengajar.menungguKelas, executed here): /langkah's
 *                 «Yang bisa Anda lakukan sekarang» and the home's class rows both read it, in the same words
 *                 (kataMenunggu); the home reads it batched (one read of the classes' material, one of the school's
 *                 releases); a «Sedang berjalan» row opens who has submitted that assessment.
 *  B5C-BUKTI-K01  UX-41 (RESTATED AT THE PROMOTION GATE: the heading keeps Terminology v1's «Penguasaan per bagian»; its
 *                 new words await Dr Gladys) · «Lihat bukti» heads the per-objective rows (formerly «Penguasaan per tujuan pembelajaran», DAISY-29's
 *                 words) and names each row by the evaluator's objective statement, as the learner's result does.
 *  B5C-TOLAK-K01  UX-45: a refusal a Guru meets ends with the teacher's recovery line: tolak.arti has an educator telling
 *                 that sends nobody to a teacher, every refusal page under /mengajar speaks as an educator, and the Uji
 *                 Cepat's and «Minta membaca lagi»'s not-allowed refusals end with that same line (no copy of their own).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
/** SQL without its comments. */
const sql = (x: string) => x.replace(/--[^\n]*/g, "");
const LOCALES = ["id", "en"] as const;

function semuaBerkas(dir: string): string[] {
  let out: string[] = [];
  let isi: string[] = [];
  try { isi = readdirSync(dir); } catch { return out; }
  for (const n of isi) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out = out.concat(semuaBerkas(p));
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

export const b5cTests: SelfTest[] = [
  {
    id: "B5C-MURID-K01",
    run: async (ctx) => {
      const c = new Checks();
      const hal = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/murid/[orang]/page.tsx"));
      c.expect(/ajar\.tujuanBelum\(id, orang\)/.test(hal), "the learner page does not ask which objectives the learner has not yet reached");
      const bagian = /<section className="pin-sec" aria-labelledby="pin-murid-tujuan">[\s\S]*?<\/section>/.exec(hal)?.[0] ?? "";
      c.expect(/s\("mengajar\.murid1\.tujuan"\)/.test(bagian) && /s\("mengajar\.murid1\.tujuan_arti"\)/.test(bagian)
        && /<Kosong jenis="belum" kalimat=\{s\("mengajar\.murid1\.tujuan_kosong"\)\} \/>/.test(bagian),
        "the page has no section «Tujuan pembelajaran yang belum tercapai» with its meaning and its empty state");
      c.expect(/belum\.map\(\(x\) => \([\s\S]*?className="pin-drow"[\s\S]*?<TeksBaris teks=\{x\.pernyataan\} \/>/.test(bagian),
        "the section does not name each objective by its statement, in the learner's result's rows");
      c.expect(bagian !== "" && !/format\.|pin-num|penguasaan|%/.test(bagian), "the section shows a figure");

      const ajar = kode(baca(ctx.repoRoot, "src/lib/pengajar.ts"));
      const fn = /export async function tujuanBelum\([\s\S]*?\n\}/.exec(ajar)?.[0] ?? "";
      c.expect(/c\.rpc\("tujuan_belum_tercapai", \{ p_class: kelasId, p_learner: orang \}\)/.test(fn) && /if \(error\) return \[\];/.test(fn)
        && !/\.from\(/.test(fn), "pengajar.tujuanBelum does not ask the database's tujuan_belum_tercapai alone, or lists something it could not read");

      const mig = sql(baca(ctx.repoRoot, "supabase/migrations/20261225100000_a_teacher_sees_the_objectives_a_learner_has_not_yet_reached.sql"));
      c.expect(/create or replace function public\.tujuan_belum_tercapai\(p_class uuid, p_learner uuid\)\s*returns table \(objective_id uuid, statement text\)\s*language plpgsql stable security definer set search_path = public, pg_temp/.test(mig),
        "tujuan_belum_tercapai is not a SECURITY DEFINER function returning the objective and its statement only");
      c.expect(/ra\.person_id = v_me[\s\S]*?ra\.role = any \(v_aud\)[\s\S]*?v_jalur @> array\[ra\.scope_node_id\]/.test(mig)
        && /m\.node_id = p_class and m\.valid_to is null[\s\S]*?e\.person_id = p_learner/.test(mig)
        && /metric_id = 'learner\.result'/.test(mig) && /a <> 'STUDENT'/.test(mig),
        "the function does not check the reader's teaching role over this class (learner.result's staff audience) and the learner's placement in it");
      c.expect(/scoped_official_results[\s\S]*?scoped_official_sessions[\s\S]*?s\.class_node_id = p_class[\s\S]*?s\.mode = 'POST_TEST'/.test(mig)
        && /set_config\('pintar\.metric_boundary_node', p_class::text, true\)/.test(mig)
        && /x\.pass_mark is not null and x\.penguasaan < x\.pass_mark/.test(mig),
        "the function does not read the class's own official Uji Penguasaan against the mark sealed on each attempt");
      c.expect(!/\b(responses|presented_items|item_options|answer_key|correct_option)\b/.test(mig), "the function reads an item, a response or a key");
      c.expect(/revoke all on function public\.tujuan_belum_tercapai\(uuid, uuid\) from public, anon;/.test(mig)
        && /insert into public\.client_rpc_registry[\s\S]*?'tujuan_belum_tercapai'/.test(mig), "the function is open to anon, or not in the client RPC registry");

      for (const locale of LOCALES) {
        for (const k of ["mengajar.murid1.tujuan", "mengajar.murid1.tujuan_arti", "mengajar.murid1.tujuan_kosong"] as const) {
          const x = t(k as HleEvent, "educator", { locale });
          c.expect(x && x !== "—" && !/gagal|tidak lulus|\bfail/i.test(x), `(${locale}) ${k} reads «${x}»`);
        }
      }
      return c.verdict("the learner page (src/app/mengajar/[kelas]/murid/[orang]/page.tsx) lists, under «Tujuan pembelajaran yang belum "
        + "tercapai», each objective by its statement and no figure, with an empty state; pengajar.tujuanBelum asks only the database's "
        + "tujuan_belum_tercapai (supabase/migrations/20261225100000_…), a SECURITY DEFINER function returning the objective and its "
        + "statement, which checks the reader's teaching role over the class and the learner's placement, reads the class's own official "
        + "Uji Penguasaan against each attempt's sealed mark, and reads no item, response or key; the words in both languages say «belum», never failure");
    },
  },
  {
    id: "B5C-BERANDA-K01",
    run: async (ctx) => {
      const c = new Checks();
      let mod: Record<string, unknown> | null = null;
      try { mod = (await import("../src/lib/pengajar")) as Record<string, unknown>; } catch (e) { c.note(`pengajar could not be imported: ${String(e).slice(0, 80)}`); }
      type M = { key: string; belum?: number; href: string };
      const menunggu = mod?.menungguKelas as
        ((k: string, b: Array<{ id: string; nodeId: string; mengumpulkan: number }>, n: number, p: Set<string>, t: Array<{ id: string }>) => M[]) | undefined;
      if (c.expect(typeof menunggu === "function", "there is no one decision of what waits in a class (pengajar.menungguKelas)")) {
        const buka = [
          { id: "a-lain", nodeId: "K2", mengumpulkan: 0 },
          { id: "a-penuh", nodeId: "K1", mengumpulkan: 30 },
          { id: "a-kurang", nodeId: "K1", mengumpulkan: 12 },
        ];
        const x = menunggu!("K1", buka, 30, new Set(["r-punya"]), [{ id: "r-punya" }, { id: "r-baru" }, { id: "r-lama" }]);
        c.expect(JSON.stringify(x) === JSON.stringify([
          { key: "f1", belum: 18, href: "/mengajar/K1/siapa?penugasan=a-kurang" },
          { key: "f4", href: "/mengajar/K1/siapkan?terbitan=r-baru" },
        ]), `K1 waits on ${JSON.stringify(x)}`);
        c.expect(menunggu!("K1", buka.slice(0, 2), 30, new Set(["r-punya"]), [{ id: "r-punya" }]).length === 0,
          "a class whose open assessment everyone submitted, with nothing new to give, still waits on the teacher");
      }
      const langkah = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/langkah/page.tsx"));
      c.expect(/ajar\s*\.menungguKelas\(id, buka, fakta\.murid\.length, new Set\(tugas\.map\(\(x\) => x\.releaseId\)\), terbit\)/.test(langkah)
        && /kataMenunggu\(m, s, locale\)/.test(langkah) && !/mengajar\.langkah\.f1"|mengajar\.langkah\.f4"/.test(langkah),
        "«Yang bisa Anda lakukan sekarang» decides its waiting acts by itself rather than through menungguKelas");
      const beranda = kode(baca(ctx.repoRoot, "src/app/mengajar/page.tsx"));
      c.expect(/ajar\.menungguBeranda\(konteks\.kelas, buka, ringkas\)/.test(beranda)
        && /const tunggu = menunggu\[k\.id\] \?\? \[\];[\s\S]*?<Link key=\{k\.id\} className="pin-row" href=\{`\/mengajar\/\$\{k\.id\}`\}>[\s\S]*?tunggu\.map\(\(m\) => \([\s\S]*?kataMenunggu\(m, s, locale, kataAnggota\("mengajar\.bukti\.murid", k\.jenis\)\)\.judul/.test(beranda),
        "the home does not show each class's waiting work in its row");
      c.expect(/buka\.map\(\(b\) => \([\s\S]*?<Link key=\{b\.id\} className="pin-row" href=\{`\/mengajar\/\$\{b\.nodeId\}\/siapa\?penugasan=\$\{b\.id\}`\}>/.test(beranda)
        && !/<div key=\{b\.id\} className="pin-row">/.test(beranda), "a «Sedang berjalan» row does not open");
      const ajar = kode(baca(ctx.repoRoot, "src/lib/pengajar.ts"));
      const fn = /export async function menungguBeranda\([\s\S]*?\n\}/.exec(ajar)?.[0] ?? "";
      c.expect(/Promise\.all\(\[penugasanKelas\(ids\), terbitanKelas\(kelas\[0\]\.institusi, ids\)\]\)/.test(fn)
        && /\.from\("learning_assignments"\)[\s\S]{0,200}\.in\("node_id", \[\.\.\.nodeIds\]\)/.test(ajar)
        && /export async function terbitanKelas\([\s\S]*?const semua = await terbitan\(institusi\);/.test(ajar),
        "the home reads each class's material one class at a time");
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "educator", { locale });
        const kata = await import("../src/components/mengajar/menunggu").then((m) => m.kataMenunggu).catch(() => null);
        c.expect(kata !== null && kata({ key: "f1", belum: 3, href: "" }, s, locale).judul === `${s("mengajar.langkah.f1")} — 3 ${s("mengajar.bukti.murid")}`,
          `(${locale}) the home and /langkah do not say a waiting act in the same words`);
      }
      return c.verdict("pengajar.menungguKelas, executed: a class waits on the first open assessment some have not submitted (with "
        + "how many) and on the newest material it may be given and lacks, and on nothing else; /langkah and the home's class rows read "
        + "it in the same words (kataMenunggu); the home reads it batched (one read of the classes' material, one of the school's releases, "
        + "the database's fit per class); a «Sedang berjalan» row opens /siapa for that assessment");
    },
  },
  {
    id: "B5C-BUKTI-K01",
    run: async (ctx) => {
      const c = new Checks();
      // RESTATED AT THE BATCH 5 PROMOTION GATE (owner, 3 Nov: «preserve Dr Gladys's approved terminology … do not silently
      // replace»): the heading keeps Terminology v1's «Penguasaan per bagian» (E23 was moved to the register, not changed);
      // its new words are Dr Gladys's to give (UX-41 stays open for them). The rows stay named by their objective.
      c.expect(t("mengajar.bukti.bagian", "educator", { locale: "id" }) === "Penguasaan per bagian"
        && t("mengajar.bukti.bagian", "educator", { locale: "en" }) === "Mastery by part",
        "«Lihat bukti»'s heading is not Terminology v1's «Penguasaan per bagian»");
      const hal = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/bukti/page.tsx"));
      c.expect(/<span className="pin-ml">\{s\("mengajar\.bukti\.bagian"\)\}<\/span>[\s\S]*?bagian\.map\(\(b\) => \(\s*<BarisKesiapan\s+key=\{b\.objective_id \?\? b\.code\}\s+label=\{b\.competency\}/.test(hal),
        "the rows are not named by the evaluator's objective");
      const mig = sql(baca(ctx.repoRoot, "supabase/migrations/20261031100000_a_topic_is_named_by_its_objective.sql"));
      const calc = /create or replace function public\.calc_class_topic_mastery[\s\S]*?\nend;/.exec(mig)?.[0] ?? "";
      c.expect(/'competency', d\.statement/.test(calc) && /coalesce\(min\(lo\.statement\), min\(t\.code\)\) as statement/.test(calc),
        "class.topic_mastery does not name each row by its objective's statement");
      return c.verdict("«Lihat bukti» keeps Terminology v1's heading «Penguasaan per bagian» (new words await Dr Gladys) and each row is the evaluator's objective, named by its statement (class.topic_mastery, MC-4)");
    },
  },
  {
    id: "B5C-TOLAK-K01",
    run: async (ctx) => {
      const c = new Checks();
      for (const locale of LOCALES) {
        const guru = t("tolak.arti", "educator", { locale });
        c.expect(!/\bguru\b|\bteacher\b/i.test(guru) && guru === t("tolak.arti", "staff", { locale }) && guru !== t("tolak.arti", "learner", { locale }),
          `(${locale}) a Guru's refusal reads «${guru}»`);
      }
      const halaman = semuaBerkas(join(ctx.repoRoot, "src", "app", "mengajar"));
      let n = 0;
      for (const f of halaman) {
        const isi = kode(readFileSync(f, "utf8"));
        for (const m of isi.match(/<HalamanPenolakan[\s\S]*?\/>/g) ?? []) {
          n += 1;
          c.expect(/persona="educator"/.test(m), `${f.slice(ctx.repoRoot.length + 1)} refuses a teacher in another register: ${m.slice(0, 60)}`);
        }
      }
      c.expect(n >= 13, `only ${n} refusal pages under /mengajar`);
      type Tolak = (g: { kode: string | null; ref: string | null }, s: (k: HleEvent) => string, l: "id" | "en", b: { soalMin: number; soalMax: number; menit: readonly number[] }) => string;
      let tolak: Tolak | null = null;
      try { tolak = (await import("../src/components/mengajar/tolakUjiCepat")).kalimatTolakUjiCepat as unknown as Tolak; } catch { /* reported below */ }
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "educator", { locale });
        const x = tolak ? tolak({ kode: "QUICK_NOT_ALLOWED", ref: null }, s, locale, { soalMin: 3, soalMax: 20, menit: [10] }) : "";
        c.expect(x.endsWith(` ${s("tolak.arti")}`) && x.split(s("tolak.arti")).length === 2,
          `(${locale}) the Uji Cepat's refusal does not end with the teacher's recovery line: «${x}»`);
        const izin = s("mengajar.cepat.tolak.izin");
        c.expect(!/keliru|mistake/i.test(izin), `(${locale}) the Uji Cepat's refusal keeps a recovery line of its own`);
      }
      const ulang = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/ulang/page.tsx"));
      c.expect(/\{kode === "REVIEW_NOT_ALLOWED" \? ` \$\{s\("tolak\.arti"\)\}` : ""\}/.test(ulang),
        "«Minta membaca lagi»'s not-allowed refusal does not end with the teacher's recovery line");
      const hle = baca(ctx.repoRoot, "src/lib/hle.ts");
      const sendiri = [...hle.matchAll(/^\s*"(mengajar\.[^"]+)":\s*\{[^\n]*(Jika ini keliru|If you think this is a mistake)/gm)].map((m) => m[1]);
      c.expect(sendiri.length === 0, `Mengajar copy carries its own recovery line: ${sendiri.join(", ")}`);
      return c.verdict(`tolak.arti has an educator telling that sends nobody to a teacher (the staff line), in both languages; all ${n} `
        + "refusal pages under src/app/mengajar speak as an educator; the Uji Cepat's and «Minta membaca lagi»'s not-allowed refusals end "
        + "with that same line, and no Mengajar sentence keeps a recovery line of its own");
    },
  },
];

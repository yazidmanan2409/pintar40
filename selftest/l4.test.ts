/**
 * L4 · the Human Interface Boundary (CR-85) and shared components (CR-88, engineering part). D-127 Q5 and Q9; the
 * investigation of DG-19..37, §B RC-4 and RC-6, §E.
 *
 *   L4-C01  the example workbook: a separate download, clearly marked, built from its source byte for byte, read
 *           and converted by the importer's own code with no special case
 *   L4-P01  one lesson renderer: the player and Studio's preview draw through src/components/pelajaran/Halaman.tsx;
 *           rendered, the player's page is the shared page, byte for byte, and a real lesson pages at its headings
 *           with its diagram drawn, never printed
 *   L4-K01  the screens: one number per difficulty band instead of typed JSON; the bank and the predicted difficulty
 *           in their words; an integrity sitting named by its learner, class and assessment; staff lists one page at a
 *           time; a rule's edit opened by «Ubah»
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";

function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
}

const RENDER =
  "(async () => {" +
  '  const { createElement: h } = await import("react");' +
  '  const { renderToStaticMarkup } = await import("react-dom/server");' +
  '  const { readFileSync } = await import("node:fs");' +
  '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
  '  const lp = await import("file://" + process.cwd() + "/src/app/belajar/_components/LessonPlayer.tsx");' +
  '  const hal = await import("file://" + process.cwd() + "/src/components/pelajaran/Halaman.tsx");' +
  '  const xl = await import("file://" + process.cwd() + "/src/lib/xlsx.ts");' +
  "  const LessonPlayer = lp.default?.default ?? lp.default;" +
  "  const H = hal.halamanPelajaran ? hal : hal.default;" +
  "  const X = xl.bacaBukuKerja ? xl : xl.default;" +
  '  const buku = X.bacaBukuKerja(new Uint8Array(readFileSync(process.cwd() + "/public/contoh/contoh-buku-kerja-pintar.xlsx")));' +
  '  const pel = buku.lembar.find((l) => l.nama === "Pelajaran");' +
  '  const kol = pel.baris[0].indexOf("Isi pelajaran");' +
  "  const isi = pel.baris.slice(1).map((b) => b[kol]).sort((a, b) => b.split(\"\\n## \").length - a.split(\"\\n## \").length)[0];" +
  '  const body = isi + "\\n[[visual:pecahan|3/8]]";' +
  "  const pages = H.halamanPelajaran(body);" +
  "  const bersama = pages.map((p) => renderToStaticMarkup(h(H.HalamanPelajaran, { baris: p })));" +
  "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
  "  const pemain = renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(LessonPlayer, {" +
  '    learningAssignmentId: "t", lessonId: "l", title: "x", bodyMarkdown: body,' +
  "    workedExamples: [], media: [], startAt: 0, personId: null, savedNote: \"\", locale: \"id\"," +
  "    saveProgress: async () => ({ ok: true }) })));" +
  "  const judul = (body.match(/^## /gm) || []).length;" +
  "  process.stdout.write(JSON.stringify({ judul, halaman: pages.length, bersama, pemain }));" +
  "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });";

export const l4Tests: SelfTest[] = [
  {
    id: "L4-C01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { BERKAS_CONTOH, SUMBER_CONTOH, TANDA_CONTOH, bukuKerjaContoh } = await import("../src/lib/contoh-buku-kerja");
      const { bacaBukuKerja } = await import("../src/lib/xlsx");
      const { bukuKerjaKePaket } = await import("../src/lib/unggah-kontrak");
      const disajikan = join(repoRoot, "public", "contoh", BERKAS_CONTOH);
      if (!c.expect(existsSync(disajikan), `the example is not served at public/contoh/${BERKAS_CONTOH}`)) return c.verdict("");
      const berkas = new Uint8Array(readFileSync(disajikan));
      const dibangun = bukuKerjaContoh(new Uint8Array(readFileSync(join(repoRoot, SUMBER_CONTOH))));
      c.expect(Buffer.from(berkas).equals(Buffer.from(dibangun)), `the served example is not its build from ${SUMBER_CONTOH} (run npm run contoh:buku-kerja)`);
      const h = bacaBukuKerja(berkas);
      if (!c.expect(h.ok, "the importer's reader refuses the example")) return c.verdict("");
      const paket = bukuKerjaKePaket((h as unknown as { lembar: never[] }).lembar) as { ok: boolean; paket?: { courses: Array<{ title: string; modules: Array<{ lessons: unknown[] }> }> } };
      const kursus = paket.ok ? paket.paket!.courses : [];
      c.expect(paket.ok && kursus.length === 1 && kursus[0].modules.reduce((n, m) => n + m.lessons.length, 0) > 0,
        "the importer's converter does not turn the example into one course with lessons");
      c.expect(kursus[0]?.title.startsWith(TANDA_CONTOH), `the example's course title is not marked «${TANDA_CONTOH.trim()}»: ${kursus[0]?.title}`);
      // a separate download, linked beside the blank template; no importer special case
      const panel = code(readFileSync(join(repoRoot, "src", "components", "unggah", "PanelUnggah.tsx"), "utf8"));
      c.expect(/href=\{`\/contoh\/\$\{BERKAS_CONTOH\}`\} download/.test(panel) && /s\("studio\.unggah\.contoh"\)/.test(panel),
        "the upload panel does not offer the example as its own download");
      const pengimpor = ["src/lib/unggah-kontrak.ts", "src/lib/xlsx.ts", "src/app/studio/actions.ts"]
        .filter((f) => /TANDA_CONTOH|contoh-buku-kerja|BERKAS_CONTOH/.test(code(readFileSync(join(repoRoot, f), "utf8"))));
      c.expect(pengimpor.length === 0, `the import path treats the example specially: ${pengimpor.join(", ")}`);
      return c.verdict(`public/contoh/${BERKAS_CONTOH} is the build of ${SUMBER_CONTOH} byte for byte; the importer's reader and `
        + `converter accept it as one course of ${kursus[0]?.modules.reduce((n, m) => n + m.lessons.length, 0)} lesson(s), titled «${kursus[0]?.title}»; `
        + "the upload panel offers it as a separate download beside the blank template, and the import path has no case for it");
    },
  },
  {
    id: "L4-P01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const lp = code(readFileSync(join(repoRoot, "src", "app", "belajar", "_components", "LessonPlayer.tsx"), "utf8"));
      const pr = code(readFileSync(join(repoRoot, "src", "app", "studio", "pratinjau", "[pelajaran]", "page.tsx"), "utf8"));
      const dari = /from "@\/components\/pelajaran\/Halaman"/;
      c.expect(dari.test(lp) && /halamanPelajaran\(props\.bodyMarkdown\)/.test(lp) && /<HalamanPelajaran baris=\{pages\[page\]\} \/>/.test(lp)
        && !/function Visual|function sisipVisual|startsWith\("## "\)/.test(lp), "the player does not draw through the shared renderer alone");
      c.expect(dari.test(pr) && /halamanPelajaran\(body\)\.map/.test(pr) && /<HalamanPelajaran baris=\{baris\} \/>/.test(pr)
        && /<LangkahContoh contoh=\{c\} tampil=\{\(c\.langkah \?\? \[\]\)\.length\} \/>/.test(pr) && /worked_examples/.test(pr)
        && !/<TeksBlok teks=\{body\}/.test(pr), "Studio's preview does not draw the lesson's pages and worked examples through the shared renderer");
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e", RENDER], { cwd: repoRoot, encoding: "utf8" });
      let r: { judul?: number; halaman?: number; bersama?: string[]; pemain?: string } = {};
      try { r = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (!c.expect(anak.status === 0 && Array.isArray(r.bersama), `the lesson could not be rendered: ${(anak.stderr || "").split("\n")[0]}`)) return c.verdict("");
      c.expect(r.halaman === r.judul && r.halaman! >= 2, `a real lesson does not page at its headings: ${r.judul} heading(s), ${r.halaman} page(s)`);
      c.expect(r.pemain!.includes(r.bersama![0]), "the player's first page is not the shared renderer's first page, byte for byte");
      const terakhir = r.bersama![r.bersama!.length - 1];
      c.expect(/<svg[^>]*aria-label="3 dari 8 bagian"/.test(terakhir) && !r.bersama!.some((x) => x.includes("[[visual")),
        "a diagram directive is printed as text instead of drawn");
      return c.verdict(`the player and Studio's preview import one renderer (src/components/pelajaran/Halaman.tsx) and neither keeps its own; `
        + `rendered, PINTAR's own SD 5 lesson with the most sections pages at its ${r.judul} headings, the player's page is the shared page `
        + "byte for byte, and a diagram directive is drawn as a figure on its page, never printed; the preview shows every worked example's steps");
    },
  },
  {
    id: "L4-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => code(readFileSync(join(repoRoot, ...p), "utf8"));
      // Aturan Penilaian: no typed JSON; the bank in its words; one page of rules; edit by «Ubah»
      const def = baca("src", "app", "studio", "definisi", "page.tsx");
      const aksi = baca("src", "app", "studio", "actions.ts");
      c.expect(/name=\{`komposisi_\$\{b\}`\} type="number"/.test(def) && /s\(`mengajar\.cepat\.tingkat\.\$\{b\}`\)/.test(def)
        && !/placeholder='komposisi/.test(def), "the difficulty mix is still asked for as typed JSON");
      c.expect(/for \(const b of \["MUDAH", "SEDANG", "SULIT"\]\) \{ const n = num\(fd, `komposisi_\$\{b\}`\)/.test(aksi) && !/JSON\.parse\(mix\)/.test(aksi),
        "the rule's action does not build the mix from one number per band");
      c.expect(/\{enumLabel\("bank", b\)\}/.test(def), "Aturan Penilaian draws the bank's value instead of its words");
      c.expect(/\.range\(\.\.\.rentang\(halaman\)\)/.test(def) && /<Penomoran halaman=\{halaman\}/.test(def)
        && /bukaUbah\(d\.id\) \? \(\s*<form action=\{saveDefinitionAction\}/.test(def) && /s\("koleksi\.ubah"\)/.test(def),
        "Aturan Penilaian is not one page at a time with its edit opened by «Ubah»");
      // Bank Soal: the author's word for the difficulty, by the database's band rule
      const { pitaKesulitan } = await import("../src/lib/unggah-kontrak");
      c.expect(pitaKesulitan(0.3) === "MUDAH" && pitaKesulitan(0.4) === "MUDAH" && pitaKesulitan(0.5) === "SEDANG"
        && pitaKesulitan(0.7) === "SULIT" && pitaKesulitan(null) === null, "the band rule differs from difficulty_band's");
      c.expect(/pitaKesulitan\(i\.predicted_difficulty\)/.test(baca("src", "app", "studio", "bank", "page.tsx")), "Bank Soal draws the predicted difficulty as a number");
      // the integrity review names a sitting
      const integ = baca("src", "app", "studio", "integritas", "page.tsx");
      c.expect(/from\("assessment_sessions"\)/.test(integ) && /persons\(display_name\)/.test(integ) && /assessment_definitions\(title\)/.test(integ)
        && /namaSesi\.get\(session\)/.test(integ) && !/short\(session\)/.test(integ), "an integrity sitting is not named by its learner, class and assessment");
      // Konfigurasi: the transfers and the audit trail one page at a time
      const konf = baca("src", "app", "konfigurasi", "page.tsx");
      c.expect(/satuHalaman\(transfers \?\? \[\], halamanDiminta\(sp\.hal_pindah\)\)\.isi\.map/.test(konf)
        && /\.range\(\.\.\.rentang\(halamanDiminta\(sp\.hal_jejak\), UKURAN_JEJAK\)\)/.test(konf) && /const UKURAN_JEJAK = 50;/.test(konf) && !/order\("at", \{ ascending: false \}\)\.limit\(50\)/.test(konf),
        "Konfigurasi's transfers or audit trail is not one page at a time");
      // the paging itself
      const { satuHalaman, rentang, halamanDiminta, UKURAN } = await import("../src/components/koleksi/halaman");
      const baris = Array.from({ length: UKURAN * 2 + 3 }, (_, i) => i);
      const h1 = satuHalaman(baris, 1), h3 = satuHalaman(baris, 3);
      c.expect(h1.isi.length === UKURAN && h1.lagi && h3.isi.length === 3 && !h3.lagi && rentang(2).join() === `${UKURAN},${UKURAN * 2}`
        && halamanDiminta("x") === 1 && halamanDiminta("0") === 1 && halamanDiminta("4") === 4, "the paging rule is wrong");
      return c.verdict(`Aturan Penilaian asks the mix as one number per band in the band's word and builds it in its action, draws the `
        + `bank in its words, shows ${UKURAN} rules a page and opens a row's edit by «Ubah»; Bank Soal shows the predicted difficulty as `
        + "the author's word by difficulty_band's rule; an integrity sitting is named by its learner, class and assessment; Konfigurasi's "
        + `transfers and audit trail are one page at a time; the paging rule holds (${UKURAN} a page, the last page short, a bad page asked for is the first)`);
    },
  },
];

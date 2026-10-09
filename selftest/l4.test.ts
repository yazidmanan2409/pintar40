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
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) walkFiles(p, out); else out.push(p); }
  return out;
}

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
  '  const buku = X.bacaBukuKerja(new Uint8Array(readFileSync(process.cwd() + "/docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx")));' +
  '  const pel = buku.lembar.find((l) => l.nama === "Pelajaran");' +
  '  const kol = pel.baris[0].indexOf("Isi pelajaran");' +
  "  const isi = pel.baris.slice(1).map((b) => b[kol]).sort((a, b) => b.split(\"\\n## \").length - a.split(\"\\n## \").length)[0];" +
  '  const body = isi + "\\n[[visual:pecahan|3/8]]";' +
  "  const pages = H.halamanPelajaran(body);" +
  "  const bersama = pages.map((p) => renderToStaticMarkup(h(H.HalamanPelajaran, { baris: p })));" +
  '  const contoh = [{ judul: "Contoh satu", langkah: ["Langkah pertama.", "Langkah kedua."] }, { judul: "Contoh kedua", langkah: ["Lain."] }];' +
  "  const contohBersama = renderToStaticMarkup(h(H.LangkahContoh, { contoh: H.contohPelajaran(contoh), tampil: 1 }));" +
  "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
  "  const pemain = renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(LessonPlayer, {" +
  '    learningAssignmentId: "t", lessonId: "l", title: "x", bodyMarkdown: body,' +
  "    workedExamples: contoh, media: [], startAt: 0, personId: null, savedNote: \"\", locale: \"id\"," +
  "    saveProgress: async () => ({ ok: true }) })));" +
  "  const judul = (body.match(/^## /gm) || []).length;" +
  "  process.stdout.write(JSON.stringify({ judul, halaman: pages.length, bersama, pemain, contohBersama }));" +
  "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });";

export const l4Tests: SelfTest[] = [
  {
    id: "L4-C01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { HASIL_CONTOH, SUMBER_CONTOH, TANDA_CONTOH, bukuKerjaContoh } = await import("../src/lib/contoh-buku-kerja");
      const { bacaBukuKerja } = await import("../src/lib/xlsx");
      const { bukuKerjaKePaket } = await import("../src/lib/unggah-kontrak");
      // WITHHELD (the Second Eye's L4 finding 1): nothing a browser can fetch is a workbook, and nothing links one
      const disajikan = walkFiles(join(repoRoot, "public")).filter((f) => /\.(xlsx|xlsm|xls|csv|json)$/i.test(f));
      c.expect(disajikan.length === 0, `a workbook or data file is served from public/: ${disajikan.join(", ")}`);
      const panel = code(readFileSync(join(repoRoot, "src", "components", "unggah", "PanelUnggah.tsx"), "utf8"));
      c.expect(!/contoh-buku-kerja|BERKAS_CONTOH|\/contoh\//.test(panel), "the upload panel links the withheld example");
      const berkasHasil = join(repoRoot, HASIL_CONTOH);
      if (!c.expect(existsSync(berkasHasil), `the example's build is not kept at ${HASIL_CONTOH}`)) return c.verdict("");
      const berkas = new Uint8Array(readFileSync(berkasHasil));
      const dibangun = bukuKerjaContoh(new Uint8Array(readFileSync(join(repoRoot, SUMBER_CONTOH))));
      c.expect(Buffer.from(berkas).equals(Buffer.from(dibangun)), `the kept example is not its build from ${SUMBER_CONTOH} (run npm run contoh:buku-kerja)`);
      const h = bacaBukuKerja(berkas);
      if (!c.expect(h.ok, "the importer's reader refuses the example")) return c.verdict("");
      const paket = bukuKerjaKePaket((h as unknown as { lembar: never[] }).lembar) as { ok: boolean; paket?: { courses: Array<{ title: string; modules: Array<{ lessons: unknown[] }> }> } };
      const kursus = paket.ok ? paket.paket!.courses : [];
      c.expect(paket.ok && kursus.length === 1 && kursus[0].modules.reduce((n, m) => n + m.lessons.length, 0) > 0,
        "the importer's converter does not turn the example into one course with lessons");
      c.expect(kursus[0]?.title.startsWith(TANDA_CONTOH), `the example's course title is not marked «${TANDA_CONTOH.trim()}»: ${kursus[0]?.title}`);
      const pengimpor = ["src/lib/unggah-kontrak.ts", "src/lib/xlsx.ts", "src/app/studio/actions.ts"]
        .filter((f) => /TANDA_CONTOH|contoh-buku-kerja|BERKAS_CONTOH/.test(code(readFileSync(join(repoRoot, f), "utf8"))));
      c.expect(pengimpor.length === 0, `the import path treats the example specially: ${pengimpor.join(", ")}`);
      return c.verdict(`the example is built from ${SUMBER_CONTOH} byte for byte into ${HASIL_CONTOH}, accepted by the importer's own `
        + `reader and converter as one course titled «${kursus[0]?.title}», with no special case; and WITHHELD: public/ serves no `
        + "workbook or data file and the upload panel links none, until the owner rules on Q9's «if canonically suitable» (it carries live keys)");
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
        && /contohPelajaran\(contoh\)/.test(pr) && /<LangkahContoh contoh=\{contohPelajaran\(contoh\)!\}/.test(pr)
        && (pr.match(/worked_examples/g) ?? []).length >= 3 && /contohPelajaran\(props\.workedExamples\)/.test(lp)
        && !/<TeksBlok teks=\{body\}/.test(pr), "Studio's preview does not draw the lesson's pages and worked examples through the shared renderer");
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e", RENDER], { cwd: repoRoot, encoding: "utf8" });
      let r: { judul?: number; halaman?: number; bersama?: string[]; pemain?: string; contohBersama?: string } = {};
      try { r = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (!c.expect(anak.status === 0 && Array.isArray(r.bersama), `the lesson could not be rendered: ${(anak.stderr || "").split("\n")[0]}`)) return c.verdict("");
      c.expect(r.halaman === r.judul && r.halaman! >= 2, `a real lesson does not page at its headings: ${r.judul} heading(s), ${r.halaman} page(s)`);
      c.expect(r.pemain!.includes(r.bersama![0]), "the player's first page is not the shared renderer's first page, byte for byte");
      // the worked example: the player shows the lesson's first, through the shared component, one step at a time
      c.expect(!!r.contohBersama && r.pemain!.includes(r.contohBersama!) && r.pemain!.includes("Contoh satu")
        && !r.pemain!.includes("Contoh kedua") && !r.pemain!.includes("Langkah kedua."),
        "the player's worked example is not the shared component's (the lesson's first, one step shown)");
      const terakhir = r.bersama![r.bersama!.length - 1];
      c.expect(/<svg[^>]*aria-label="3 dari 8 bagian"/.test(terakhir) && !r.bersama!.some((x) => x.includes("[[visual")),
        "a diagram directive is printed as text instead of drawn");
      return c.verdict(`the player and Studio's preview import one renderer (src/components/pelajaran/Halaman.tsx) and neither keeps its own; `
        + `rendered, PINTAR's own SD 5 lesson with the most sections pages at its ${r.judul} headings, the player's page is the shared page `
        + "byte for byte, a diagram directive is drawn as a figure on its page, never printed, and the player's worked example is the "
        + "shared component's (the lesson's first, one step at a time); the preview shows that same example, all its steps, from both "
        + "the school's own lesson and the canonical read (whose RPC already returns it). The preview itself is read as SOURCE, not rendered");
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
      c.expect(/daftarPindah\.map\(/.test(konf) && (konf.match(/\.range\(\.\.\.rentang\(halPindah\)\)/g) ?? []).length === 2
        && /tautanHalaman\("\/konfigurasi", sp, "hal_pindah", n, "transfers"\)/.test(konf) && /tautanHalaman\("\/konfigurasi", sp, "hal_jejak", n, "audit"\)/.test(konf)
        && /\.range\(\.\.\.rentang\(halamanDiminta\(sp\.hal_jejak\), UKURAN_JEJAK\)\)/.test(konf) && /const UKURAN_JEJAK = 50;/.test(konf) && !/order\("at", \{ ascending: false \}\)\.limit\(50\)/.test(konf),
        "Konfigurasi's transfers or audit trail is not one page at a time");
      // the re-review's N1: a listed transfer past the newest 50 is named from its own row, and its schools are read
      c.expect(/const namaPindah = new Map\(daftarPindah\.map\(\(x\) => \[String\(x\.person_id\), namaDari\(x\.persons\)\]/.test(konf)
        && /\{namaPindah\.get\(x\.person_id\) \?\? TANPA_NAMA\}/.test(konf) && /\[\.\.\.\(transfers \?\? \[\]\), \.\.\.daftarPindah\]/.test(konf)
        && konf.indexOf("const daftarPindah") < konf.indexOf("const sekolahPindah"),
        "a transfer on a later page is not named from its own row, or its schools are not read");
      // the re-review's N2: a saved edit opens no row; only a refused one reopens it
      c.expect(/\.\.\.\(error \? \{ ubah: existing \} : \{\}\)/.test(aksi) && !/hal: String\([^)]*\)\)?, ubah: existing \}/.test(aksi),
        "a rule's edit reopens its row after a successful save");
      // the paging itself
      const { satuHalaman, rentang, halamanDiminta, tautanHalaman, UKURAN } = await import("../src/components/koleksi/halaman");
      // a page link keeps the section, the school and the other list's page, and drops an action's one-time result
      const tautan = tautanHalaman("/konfigurasi", { bagian: "roles", sekolah: "s1", hal_jejak: "3", hasil: "ok", kode: "X", hal_pindah: "1" }, "hal_pindah", 2, "transfers");
      c.expect(tautan === "/konfigurasi?bagian=roles&sekolah=s1&hal_jejak=3&hal_pindah=2#transfers", `a page link loses or keeps the wrong parameters: ${tautan}`);
      // the re-review's N4: a pending step (a confirmation, a check, a report, a scheduling preview) is not repeated by paging
      const sekali = tautanHalaman("/konfigurasi", { bagian: "roles", hal_jejak: "2", lapor: "1", periksa: "skema", angkat: "a", lingkup: "b", sampai: "2026-12-31",
        pertama: "1", pm_cek: "1", pm_sekolah: ["x", "y"], dari: "k", ubah: "d" }, "hal_jejak", 3, "audit");
      c.expect(sekali === "/konfigurasi?bagian=roles&hal_jejak=3#audit", `a page link repeats a one-time step: ${sekali}`);
      const def2 = tautanHalaman("/studio/definisi", { hal: "2", hasil: "ok", ubah: "d" }, "hal", 3, "definisi");
      c.expect(def2 === "/studio/definisi?hal=3#definisi", `Aturan Penilaian's page link keeps a one-time word: ${def2}`);
      const baris = Array.from({ length: UKURAN * 2 + 3 }, (_, i) => i);
      const h1 = satuHalaman(baris, 1), h3 = satuHalaman(baris, 3);
      c.expect(h1.isi.length === UKURAN && h1.lagi && h3.isi.length === 3 && !h3.lagi && rentang(2).join() === `${UKURAN},${UKURAN * 2}`
        && halamanDiminta("x") === 1 && halamanDiminta("0") === 1 && halamanDiminta("4") === 4, "the paging rule is wrong");
      return c.verdict(`Aturan Penilaian asks the mix as one number per band in the band's word and builds it in its action, draws the `
        + `bank in its words, shows ${UKURAN} rules a page and opens a row's edit by «Ubah»; Bank Soal shows the predicted difficulty as `
        + "the author's word by difficulty_band's rule; an integrity sitting is named by its learner, class and assessment; Konfigurasi's "
        + `transfers and audit trail are one page at a time, a transfer on any page named from its own row; a saved edit opens no row, a refused one reopens it; a page link keeps only the section, the school and the pages; the paging rule holds (${UKURAN} a page, the last page short, a bad page asked for is the first)`);
    },
  },
  {
    // CR-52 (QN5 as D-123 rules it; journey S23q): Bank Soal is browsed, narrowed and reviewed with the key and reasons,
    // and nothing on it writes a question
    id: "CR52-B01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { pitaKesulitan, rentangPita } = await import("../src/lib/unggah-kontrak");
      // the band a list is narrowed to holds exactly the values pitaKesulitan draws as that band (executed)
      const dalam = (v: number, r: ReturnType<typeof rentangPita>) => !!r && (r.lte === undefined || v <= r.lte)
        && (r.gt === undefined || v > r.gt) && (r.lt === undefined || v < r.lt) && (r.gte === undefined || v >= r.gte);
      const nilai = [0, 0.2, 0.4, 0.4001, 0.55, 0.6999, 0.7, 0.85, 1];
      const salah = nilai.flatMap((v) => (["MUDAH", "SEDANG", "SULIT"] as const)
        .filter((b) => dalam(v, rentangPita(b)) !== (pitaKesulitan(v) === b)).map((b) => `${v}→${b}`));
      c.expect(salah.length === 0 && rentangPita("") === null && rentangPita("X") === null, `a band's range disagrees with pitaKesulitan: ${salah.join(", ")}`);
      const bank = code(readFileSync(join(repoRoot, "src", "app", "studio", "bank", "page.tsx"), "utf8"));
      // FILTER: a GET form with the two choices; both the newest list and the waiting list are narrowed the same way
      c.expect(/<form method="get" action="\/studio\/bank"/.test(bank) && /<select className=\{field\} name="bank"/.test(bank)
        && /<select className=\{field\} name="tingkat"/.test(bank), "Bank Soal has no way to narrow the list");
      c.expect((bank.match(/saring\(supabase\.from\("items"\)/g) ?? []).length === 2, "the bank's two reads are not narrowed alike");
      c.expect(/\{enumLabel\("bank", b\)\}/.test(bank) && /s\(`mengajar\.cepat\.tingkat\.\$\{p\}`\)/.test(bank), "a choice is drawn as its raw value");
      // REVIEW: the key and every option's reason, read under the reader's row security, only where they hold CAN_DRAFT
      c.expect(/capabilities\.includes\("CAN_DRAFT"\)/.test(bank) && /from\("item_options"\)\.select\("item_id, label, body, is_correct, rationale"\)/.test(bank)
        && /"pin-opsi pin-opsi-kunci"/.test(bank) && /s\("studio\.soal\.alasan"\)/.test(bank),
        "a question's key and reasons are not on the bank, or not gated as the package page's are (D-088(h))");
      c.expect(!/service|createClient|SERVICE_ROLE/.test(bank), "the bank reads keys with anything but the reader's own client");
      // NO AUTHORING: nothing writes a question
      c.expect(!/<textarea/.test(bank) && !/\.(insert|update|upsert|delete)\(/.test(bank) && !/name="(stem|opsi|kunci)"/.test(bank),
        "something on the bank writes a question");
      return c.verdict("Bank Soal narrows its list by use and by the author's difficulty band with a GET form (the band's range "
        + "executed against pitaKesulitan at its edges), narrows its newest and its waiting reads alike, draws each choice in "
        + "its words, shows each question's key and every option's reason only where the reader holds CAN_DRAFT, read with "
        + "the reader's own client under row security as the package page reads them (D-088(h)), and writes no question");
    },
  },
  {
    // CR-92: «Komputer siapa ini?» opened from Akun saya opens on the choice this browser holds
    id: "CR92-P01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const hal = code(readFileSync(join(repoRoot, "src", "app", "perangkat", "page.tsx"), "utf8"));
      const proxy = code(readFileSync(join(repoRoot, "src", "proxy.ts"), "utf8"));
      // the page asks the session check with this browser's identity, read and hashed exactly as the proxy does it
      c.expect(/\(await cookies\(\)\)\.get\(COOKIE_PERANGKAT\)\?\.value/.test(hal)
        && /rpc\("sesi_periksa", \{ p_perangkat: hashPerangkat\(alat\) \}\)/.test(hal),
        "/perangkat asks sesi_periksa without this browser's identity, so a browser already declared reads as not chosen yet");
      c.expect(/request\.cookies\.get\(COOKIE_PERANGKAT\)/.test(proxy) && /p_perangkat: kartu \? null : hashPerangkat\(alat\)/.test(proxy),
        "the proxy no longer reads the browser's identity the way the page now does");
      // and the screen opens on that answer: «shared» only when nothing is declared yet
      c.expect(/awal=\{jaga\.perluPilih \? "SHARED" : jaga\.mode\}/.test(hal), "the screen's preselected choice is not the declared one");
      return c.verdict("/perangkat asks sesi_periksa with this browser's identity (the pintar_perangkat cookie, hashed by "
        + "hashPerangkat, as src/proxy.ts asks it), so a browser already declared is found and the screen opens on its "
        + "declared choice; «shared» is preselected only when nothing is declared");
    },
  },
  {
    // L4 finding 6 (CR-88): Peran & akses draws one page of roles, each with its revoke form; the counts stay whole
    id: "L4F6-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const konf = code(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      c.expect(/const UKURAN_PERAN = 50;/.test(konf)
        && /const \{ isi: daftarPeran, lagi: lagiPeran \} = satuHalaman\(assignments \?\? \[\], halPeran, UKURAN_PERAN\);/.test(konf)
        && /\{daftarPeran\.map\(\(a\) => \(/.test(konf) && !/\{\(assignments \?\? \[\]\)\.map\(/.test(konf),
        "Peran & akses still draws every active role, each with a revoke form");
      c.expect(/\.is\("revoked_at", null\)\.order\("created_at", \{ ascending: false \}\)\.order\("id"\)/.test(konf),
        "the roles are not in a stable order, so a page boundary can repeat or drop one");
      c.expect(/<Penomoran halaman=\{halPeran\} lagi=\{lagiPeran\} ke=\{\(n\) => tautanHalaman\("\/konfigurasi", sp, "hal_peran", n, "roles"\)\} \/>/.test(konf),
        "the roles list has no way to its next page");
      c.expect(/persiapanSekolah\(struktur\.rows, \(assignments \?\? \[\]\)/.test(konf) && /jumlahAdminSekolah\(\(assignments \?\? \[\]\)/.test(konf),
        "the school's readiness or its admin count is no longer taken from every active role");
      const { tautanHalaman } = await import("../src/components/koleksi/halaman");
      const t = tautanHalaman("/konfigurasi", { bagian: "roles", hal_jejak: "2", hasil: "ok" }, "hal_peran", 3, "roles");
      c.expect(t === "/konfigurasi?bagian=roles&hal_jejak=2&hal_peran=3#roles", `a roles page link keeps the wrong parameters: ${t}`);
      return c.verdict("Peran & akses draws 50 roles a page (satuHalaman over the whole read), each with its revoke form, "
        + "with a page link that keeps the section and the other lists' pages; the school's readiness and its count of admins "
        + "are still taken from every active role");
    },
  },
];

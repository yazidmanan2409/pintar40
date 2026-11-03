/**
 * BATCH 5 · AGENT A — REPORTS AND LEADERSHIP (owner, 3 Nov: «BATCH 5 DEVELOPMENT GO»). Each guard is RED on the code
 * Batch 4 closed with (31e456d) and GREEN after this work.
 *
 *  B5A-LAPORAN-K01  W3.8 (RV-11; J7.2–J7.4, X.7) · the source: both report pages (/edukator/ringkasan,
 *                   /dekan/ringkasan) sit in the staff shell (CangkangStaf with the working context's places,
 *                   navKonteks) instead of a bare header with the signed-in strip; above the figures the school (and,
 *                   for the class, the class and its school year) through BarisLingkup, the place in the heading and
 *                   a sentence saying what the figures cover and when they were calculated; «Kembali» and «Cetak»
 *                   kept; the working-context guard (layouts) and the «another school» offer kept; kepalaLaporan reads
 *                   the names as the signed-in reader (no service key). Print: the shell's header, the footer, the
 *                   report's controls and the skip link carry `pin-noprint`, which print hides. Rendered: BarisLingkup
 *                   names school / class / year.
 *  B5A-PIMPINAN-K01 W3.9 (RV-9; X.5, J9.3) · the copy table: RESTATED AT THE PROMOTION GATE, the class and school
 *                   figures keep Terminology v1's approved words, «Peserta» (ruling 8) and «Kenaikan», in both languages;
 *                   a new label is Dr Gladys's to give (W4.2). Rendered: the report pages' absence sentence (omissionText) no longer
 *                   carries «(0/5)»; kalimatJumlah says «Sekarang 0 murid; perlu 5.» and the report pages draw it. The
 *                   source: Pimpinan and its branch page stack their figures and absence cards with the layout gap
 *                   (.pin-bukti-tumpuk, a space token), so no two cards touch.
 *  B5A-TAKLIMAT-K01 W2.6 (CR-37; J7.5; D-120 QN4) · briefings are hidden: no copy promises a periodic briefing
 *                   («mengajar.langkah.quiet» is gone, and no other sentence speaks of one outside the audit trail's
 *                   names for past rows); the class's «Langkah» page draws no such footnote; no screen or library
 *                   code reads the briefings table; no comment in src promises a briefings surface; the class report
 *                   no longer carries the unused exposure-caveat predicate that waited on it.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, allKeys, type HleEvent } from "../src/lib/hle";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

function semua(dir: string): string[] {
  let out: string[] = [];
  let isi: string[] = [];
  try { isi = readdirSync(dir); } catch { return out; }
  for (const n of isi) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out = out.concat(semua(p));
    else if (/\.(ts|tsx)$/.test(n)) out.push(p);
  }
  return out;
}

/** Render a module's export in a child process (tsx), as the other rendering guards do. */
function render(root: string, skrip: string, env: Record<string, string> = {}) {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    `(async () => {${skrip}})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`],
  { cwd: root, encoding: "utf8", env: { ...process.env, ...env } });
  return { ok: anak.status === 0, out: anak.stdout, err: (anak.stderr || "").split("\n").slice(0, 3).join(" ") };
}

export const b5aTests: SelfTest[] = [
  {
    id: "B5A-LAPORAN-K01",
    run: async (ctx) => {
      const c = new Checks();
      const HAL = [
        { f: "src/app/edukator/ringkasan/page.tsx", judul: "laporan.kelas.judul", cakupan: "laporan.cakupan.kelas", param: "kelas", persona: "educator" },
        { f: "src/app/dekan/ringkasan/page.tsx", judul: "laporan.institusi.judul", cakupan: "laporan.cakupan.sekolah", param: "simpul", persona: "staff" },
      ] as const;
      for (const h of HAL) {
        const src = kode(baca(ctx.repoRoot, h.f));
        c.expect(/<CangkangStaf locale=\{locale\} kini=\{judul\} nav=\{await navKonteks\(\{ locale, persona: "staff", bentuk: "nav" \}\)\} \/>/.test(src),
          `${h.f} is not inside the staff shell with the working context's places`);
        c.expect(!/<SesiSaya\b/.test(src) && !/<header\b/.test(src), `${h.f} still draws its own bare header and signed-in strip`);
        c.expect(new RegExp(`const judul = s\\("${h.judul.replace(/\./g, "\\.")}", "${h.persona}", locale\\);`).test(src)
          && /<p className="pin-eyebrow">\{judul\}<\/p>/.test(src), `${h.f} does not name the report above its heading`);
        c.expect(new RegExp(`\\? kepalaLaporan\\(${h.param}\\)`).test(src), `${h.f} does not read what the report is of`);
        c.expect(new RegExp(`s\\("${h.cakupan.replace(/\./g, "\\.")}", "${h.persona}", locale\\)\\.replace\\("\\{waktu\\}", tanggal\\(dihitung, "cap", locale\\)\\)`).test(src)
          && /const dihitung = new Date\(\);/.test(src), `${h.f} does not say what the figures cover and when they were calculated`);
        c.expect(new RegExp(`<AksiLaporan kembali=\\{s\\("laporan\\.kembali", "${h.persona}", locale\\)\\} cetak=\\{s\\("laporan\\.cetak", "${h.persona}", locale\\)\\} />`).test(src),
          `${h.f} lost «Kembali» or «Cetak»`);
        c.expect(/<KakiPintar className="pin-noprint" \/>/.test(src), `${h.f} has no footer, or prints it`);
        c.expect(/await tawarkanSekolahLain\(/.test(src) && src.indexOf("tawarkanSekolahLain(") < src.indexOf("generate_report"),
          `${h.f} no longer offers another school's report through the chooser before reading it`);
        c.expect(new RegExp(`templatUntuk\\("${h.f.includes("dekan") ? "institution" : "class"}_learning_intelligence", ${h.param}\\)`).test(src),
          `${h.f} no longer reads its template through templatUntuk`);
        for (const locale of ["id", "en"] as const) {
          const kata = t(h.cakupan as HleEvent, "staff", { locale });
          c.expect(kata.includes("{waktu}") && !kata.startsWith("laporan."), `(${locale}) ${h.cakupan} has no sentence`);
        }
      }
      const kelas = kode(baca(ctx.repoRoot, HAL[0].f));
      c.expect(/<BarisLingkup scope=\{\{ institution: kepala\?\.sekolah, path: kepala\?\.tempat \? \[kepala\.tempat\] : \[\], period: kepala\?\.periode \}\}/.test(kelas)
        && /<h1 className="pin-h1">\{kepala\?\.tempat \?\? judul\}<\/h1>/.test(kelas), "the class report does not name the school, the class and its school year");
      const sekolah = kode(baca(ctx.repoRoot, HAL[1].f));
      c.expect(/<BarisLingkup scope=\{\{ institution: kepala\?\.sekolah \}\}/.test(sekolah)
        && /<h1 className="pin-h1">\{kepala\?\.sekolah \?\? judul\}<\/h1>/.test(sekolah), "the school report does not name the school");
      for (const lay of ["src/app/edukator/layout.tsx", "src/app/dekan/layout.tsx"]) {
        c.expect(/await konteksHalaman\(\);/.test(kode(baca(ctx.repoRoot, lay))), `${lay} lost the working-context guard`);
      }
      const lap = kode(baca(ctx.repoRoot, "src/lib/laporan.ts"));
      const kep = lap.slice(lap.indexOf("export async function kepalaLaporan("));
      c.expect(kep.length > 40 && /const supabase = await supabaseServer\(\);/.test(kep) && !/supabaseService/.test(lap)
        && /from\("org_nodes"\)/.test(kep) && /from\("institutions"\)\.select\("name"\)/.test(kep) && /from\("academic_periods"\)\.select\("name"\)/.test(kep),
        "kepalaLaporan does not read the school, the place and the year as the signed-in reader");
      // print: every shell part and the report's controls stay off the paper
      const cang = kode(baca(ctx.repoRoot, "src/components/CangkangPengalaman.tsx"));
      const staf = cang.slice(cang.indexOf("function shellStaf("));
      c.expect(/<header className="pin-top pin-shell pin-noprint pin-staf">/.test(staf), "the staff shell would print");
      c.expect(/<div className="pin-actions pin-noprint">/.test(kode(baca(ctx.repoRoot, "src/components/laporan/AksiLaporan.tsx"))), "the report's controls would print");
      c.expect(/className="pin-lewati pin-noprint"/.test(kode(baca(ctx.repoRoot, "src/app/layout.tsx"))), "the skip link would print");
      c.expect(/@media print \{\s*\.pin-noprint \{ display: none !important; \}/.test(baca(ctx.repoRoot, "src/app/experience.css")), "print does not hide .pin-noprint");
      // rendered: the scope line names school / class / year
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/bukti/BarisLingkup.tsx");' +
        "const B = m.default?.default ?? m.default;" +
        "process.stdout.write(renderToStaticMarkup(h(B, { scope: { institution: 'SD Contoh', path: ['Kelas 5A'], period: 'TA 2026/2027' } })));");
      if (c.expect(r.ok, `the scope line could not be rendered: ${r.err}`)) {
        const teks = r.out.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        c.expect(teks === "SD Contoh / Kelas 5A / TA 2026/2027", `the scope line reads «${teks}»`);
      }
      return c.verdict("both report pages (source) are in the staff shell with the context's places and no bare header; the class report names " +
        "the school, the class and its year (BarisLingkup, rendered «SD Contoh / Kelas 5A / TA 2026/2027») and the class in its heading, the " +
        "school report the school; each says what its figures cover and when they were calculated; «Kembali» and «Cetak» kept; the layouts' " +
        "working-context guard and the «another school» offer kept; kepalaLaporan reads as the signed-in reader; the shell, the footer, the " +
        "controls and the skip link carry pin-noprint, which print hides");
    },
  },
  {
    id: "B5A-PIMPINAN-K01",
    run: async (ctx) => {
      const c = new Checks();
      // RESTATED AT THE BATCH 5 PROMOTION GATE (owner, 3 Nov: «preserve Dr Gladys's approved terminology wherever
      // applicable; do not silently replace «Peserta» with unapproved terms»). Terminology v1 (frozen, D-068) ruling 8:
      // «Peserta» (metric) is kept, «participants in the measurement, not all murid». The four labels are the approved
      // words, in both languages; any change to them is Dr Gladys's, in writing (W4.2), not this batch's.
      const DISETUJUI: Array<[HleEvent, string, string]> = [
        ["metrik.peserta.label", "Peserta", "Students"],
        ["metrik.peserta_institusi.label", "Peserta", "Students"],
        ["metrik.kenaikan.label", "Kenaikan", "Gain"],
        ["metrik.kenaikan_institusi.label", "Kenaikan", "Gain"],
      ];
      for (const [k, id, en] of DISETUJUI) {
        c.expect(t(k, "staff", { locale: "id" }) === id && t(k, "staff", { locale: "en" }) === en,
          `${k} reads «${t(k, "staff", { locale: "id" })}» / «${t(k, "staff", { locale: "en" })}», not the approved «${id}» / «${en}»`);
      }
      // rendered: the report pages' absence sentence, and the count sentence beside it
      const r = render(ctx.repoRoot,
        'const intel = await import("file://" + process.cwd() + "/src/app/_intel.ts");' +
        'const kk = await import("file://" + process.cwd() + "/src/components/bukti/KartuKetiadaan.tsx");' +
        "const I = intel.default ?? intel; const K = kk.default ?? kk;" +
        "const e = { status: 'below_minimum', metric_id: 'class.participants', label_key: 'metrik.peserta.label', statement_key: 'laporan.metrik.belum_cukup_data', have: 0, needed: 5 };" +
        "const f = { ...e, metric_id: 'institution.participants', needed: 10 };" +
        "process.stdout.write(JSON.stringify([I.omissionText(e, 'id'), (K.kalimatJumlah ?? kk.kalimatJumlah)(e, 'id'), (K.kalimatJumlah ?? kk.kalimatJumlah)(f, 'en', 'staff'), I.omissionText(f, 'en')]));");
      if (c.expect(r.ok, `the absence sentences could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        c.expect(x.length === 4 && !x.some((s) => /\(\s*\d+\s*\/\s*\d+\s*\)/.test(s ?? "")), `a report still says «(have/needed)»: ${JSON.stringify(x)}`);
        c.expect(x[0] === t("laporan.metrik.belum_cukup_data", "educator") && x[1] === "Sekarang 0 murid; perlu 5."
          && x[2] === "0 students so far; 10 needed.", `the absence reads ${JSON.stringify(x)}`);
      }
      for (const f of ["src/app/edukator/ringkasan/page.tsx", "src/app/dekan/ringkasan/page.tsx"]) {
        c.expect(/\{kalimatJumlah\(e, locale[^)]*\) \? <p[^>]*>\{kalimatJumlah\(e, locale[^)]*\)\}<\/p> : null\}/.test(kode(baca(ctx.repoRoot, f))),
          `${f} does not say how far a figure is from appearing`);
      }
      const intel = kode(baca(ctx.repoRoot, "src/app/_intel.ts"));
      c.expect(!/e\.have/.test(intel) && !/e\.needed/.test(intel), "the report pages' absence sentence still reads have/needed");
      // the cards: stacked with the layout gap on Pimpinan and its branch page
      const css = baca(ctx.repoRoot, "src/app/experience.css");
      c.expect(/\.pin-bukti-tumpuk \{ display: grid; gap: var\(--space-\d\);/.test(css), "no stack spaces the figures and the absence cards");
      for (const f of ["src/app/pimpinan/page.tsx", "src/app/pimpinan/[simpul]/page.tsx"]) {
        const src = kode(baca(ctx.repoRoot, f));
        const i = src.indexOf('aria-labelledby="pin-bukti"');
        const sek = src.slice(i, src.indexOf("</section>", i));
        c.expect(i > 0 && /<div className="pin-bukti-tumpuk">\s*\{angka\.length > 0 \? \(\s*<div className="pin-grid2">/.test(sek)
          && /<\/div>\s*\) : null\}\s*\{absen\.map\(\(e, i\) => \(\s*<KartuKetiadaan/.test(sek), `${f}: the figures and the absence cards touch`);
      }
      return c.verdict("the class and school figures keep Terminology v1's approved words, «Peserta» (ruling 8) and «Kenaikan», in both " +
        "languages; rendered, the report pages' absence sentence carries no «(0/5)» and " +
        "kalimatJumlah says «Sekarang 0 murid; perlu 5.» / «0 students so far; 10 needed.», which both report pages draw; Pimpinan and its " +
        "branch page stack their figures and absence cards in .pin-bukti-tumpuk (grid gap, a space token)");
    },
  },
  {
    id: "B5A-TAKLIMAT-K01",
    run: async (ctx) => {
      const c = new Checks();
      c.expect(!allKeys().includes("mengajar.langkah.quiet" as HleEvent), "«mengajar.langkah.quiet» still promises a periodic briefing");
      const JANJI = /ringkasan berkala|periodic briefing|briefing|pengarahan/i;
      for (const k of allKeys().filter((x) => !x.startsWith("audit."))) {
        for (const locale of ["id", "en"] as const) {
          const kata = t(k, "staff", { locale });
          c.expect(!JANJI.test(kata), `«${k}» (${locale}) speaks of a briefing: «${kata}»`);
        }
      }
      const langkah = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/langkah/page.tsx"));
      c.expect(langkah.length > 100 && !/mengajar\.langkah\.quiet/.test(langkah), "the class's «Langkah» page still draws the briefing footnote");
      const berkas = ["src/app", "src/components", "src/lib"].flatMap((d) => semua(join(ctx.repoRoot, d)))
        .filter((p) => !/database\.types|supabase\/types/.test(p));
      c.expect(berkas.length > 50, "the sources could not be read");
      for (const p of berkas) {
        const mentah = readFileSync(p, "utf8");
        const rel = relative(ctx.repoRoot, p);
        c.expect(!/from\("briefings"\)/.test(kode(mentah)), `${rel} reads the briefings table`);
        c.expect(!/briefings surface|ringkasan berkala/i.test(mentah), `${rel} still promises a briefings surface`);
      }
      const kelas = baca(ctx.repoRoot, "src/app/edukator/ringkasan/page.tsx");
      c.expect(kelas.length > 100 && !/exposureCaveatApplies/.test(kelas), "the class report still carries the predicate that waited on the briefings surface");
      return c.verdict("no copy outside the audit trail's names for past rows speaks of a briefing (mengajar.langkah.quiet is gone); the class's " +
        "«Langkah» page draws no such footnote; no source under src/app, src/components or src/lib reads the briefings table or promises a " +
        "briefings surface; the class report's unused exposure-caveat predicate is gone");
    },
  },
];

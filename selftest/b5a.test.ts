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
        { f: "src/app/edukator/ringkasan/page.tsx", judul: "laporan.kelas.judul", cakupan: "laporan.cakupan.kelas", param: "kelas", persona: "untuk" },
        { f: "src/app/dekan/ringkasan/page.tsx", judul: "laporan.institusi.judul", cakupan: "laporan.cakupan.sekolah", param: "simpul", persona: "staff" },
      ] as const;
      for (const h of HAL) {
        const src = kode(baca(ctx.repoRoot, h.f));
        // RESTATED FOR E-C1-2 (D-132): the class report speaks the reader's working context — a teacher's words in
        // Mengajar, staff words otherwise — so its persona is the variable `untuk`, decided from the context here
        const P = h.persona === "untuk" ? "untuk" : `"${h.persona}"`;
        if (h.persona === "untuk") {
          c.expect(/const untuk: Persona = k\?\.keadaan === "ADA" && k\.tujuan === "MENGAJAR" \? "educator" : "staff";/.test(src) && !/"educator", locale\)/.test(src),
            `${h.f} does not choose its words by the working context`);
        }
        c.expect(/<CangkangStaf locale=\{locale\} kini=\{judul\} nav=\{await navKonteks\(\{ locale, persona: "staff", bentuk: "nav" \}\)\} \/>/.test(src),
          `${h.f} is not inside the staff shell with the working context's places`);
        c.expect(!/<SesiSaya\b/.test(src) && !/<header\b/.test(src), `${h.f} still draws its own bare header and signed-in strip`);
        c.expect(new RegExp(`const judul = s\\("${h.judul.replace(/\./g, "\\.")}", ${P}, locale\\);`).test(src)
          && /<p className="pin-eyebrow">\{judul\}<\/p>/.test(src), `${h.f} does not name the report above its heading`);
        c.expect(new RegExp(`\\? kepalaLaporan\\(${h.param}\\)`).test(src), `${h.f} does not read what the report is of`);
        c.expect(new RegExp(`s\\("${h.cakupan.replace(/\./g, "\\.")}", ${P}, locale\\)\\.replace\\("\\{waktu\\}", tanggal\\(dihitung, "cap", locale\\)\\)`).test(src)
          && /const dihitung = new Date\(\);/.test(src), `${h.f} does not say what the figures cover and when they were calculated`);
        // RESTATED FOR E-K1 (D-173(d)): the way back is the history-back, named as one
        c.expect(new RegExp(`<AksiLaporan kembali=\\{s\\(asal\\.nama, ${P}, locale\\)\\} ke=\\{asal\\.ke\\} cetak=\\{s\\("laporan\\.cetak", ${P}, locale\\)\\} />`).test(src),
          `${h.f} lost its way back (named by its origin, H9) or «Cetak»`);
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
      // CONTOH LAPORAN (approved 7 Nov): the class report's body is its composition, src/components/laporan/KomposisiKelas.tsx
      const KOMPOSISI: Record<string, string> = { "src/app/edukator/ringkasan/page.tsx": "src/components/laporan/KomposisiKelas.tsx",
        "src/app/dekan/ringkasan/page.tsx": "src/components/laporan/KomposisiSekolah.tsx" };
      for (const f of ["src/app/edukator/ringkasan/page.tsx", "src/app/dekan/ringkasan/page.tsx"]) {
        c.expect(/\{kalimatJumlah\(e, locale[^)]*\) \? <p[^>]*>\{kalimatJumlah\(e, locale[^)]*\)\}<\/p> : null\}/.test(kode(baca(ctx.repoRoot, f) + (KOMPOSISI[f] ? baca(ctx.repoRoot, KOMPOSISI[f]) : ""))),
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
  {
    // CONTOH LAPORAN 2-guru / 2b (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov): the class report is one composition
    id: "LAPORAN-KELAS-01",
    run: async (ctx) => {
      const c = new Checks();
      const ok = (o: Record<string, unknown>): Record<string, unknown> => ({ status: "ok", readiness: "SUFFICIENT_EVIDENCE", ...o });
      const penuh = [
        ok({ metric_id: "class.participants", label_key: "metrik.peserta.label", meaning_key: "metrik.peserta.arti", value: 29, sample: 29 }),
        ok({ metric_id: "class.comprehension", label_key: "metrik.pemahaman.label", meaning_key: "metrik.pemahaman.arti", value: 0.748, sample: 29 }),
        ok({ metric_id: "class.net_gain", label_key: "metrik.kenaikan.label", meaning_key: "metrik.kenaikan.arti", value: 0.2, sample: 29 }),
        ok({ metric_id: "class.readiness_distribution", label_key: "metrik.kesiapan.label", meaning_key: "metrik.kesiapan.arti",
          value: { "kesiapan.butuh_pendampingan": 5, "kesiapan.siap_sertifikasi": 17, "kesiapan.perlu_review": 7, "kesiapan.belum_post_test": 2 },
          population: { placed: 31, assessed: 29, not_yet: 2 } }),
        ok({ metric_id: "class.topic_mastery", label_key: "metrik.topik.label", meaning_key: "metrik.topik.arti", value: [
          { objective_id: "1", competency: "Pecahan campuran", mean_score: 0.57, learners: 29 },
          { objective_id: "2", competency: "Penjumlahan dan pengurangan pecahan", mean_score: 0.61, learners: 29 },
          { objective_id: "3", competency: "Membandingkan pecahan", mean_score: 0.79, learners: 29 },
          { objective_id: "4", competency: "Pecahan senilai", mean_score: 0.87, learners: 29 } ] }),
        ok({ metric_id: "class.misconceptions", label_key: "metrik.miskonsepsi.label", meaning_key: "metrik.miskonsepsi.arti",
          value: [{ code: "M1", label: "Menjumlahkan pembilang dan penyebut", remediation: "Samakan penyebut dulu.", occurrences: 13 }] }),
      ];
      const kurang = penuh.map((e) => ({ status: "below_minimum", readiness: "INSUFFICIENT_EVIDENCE", metric_id: e.metric_id, label_key: e.label_key,
        meaning_key: e.meaning_key, statement_key: "laporan.metrik.belum_cukup_data", have: 3, needed: 5,
        ...(e.metric_id === "class.readiness_distribution" ? { population: { placed: 30, assessed: 3, not_yet: 27 } } : {}) }));
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiKelas.tsx");' +
        "const K = m.default?.default ?? m.default; const J = m.persenJujur ?? m.default?.persenJujur;" +
        "const [a, b] = JSON.parse(process.env.ENTRI);" +
        "const p = { locale: 'id', persona: 'educator', jenis: 'LEARNER', namaKelas: 'Kelas 7A', buktiHref: '/mengajar/k/bukti' };" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { ...p, entries: a, target: 0.75 })), renderToStaticMarkup(h(K, { ...p, entries: b, target: 0.75 }))," +
        " renderToStaticMarkup(h(K, { ...p, entries: a, target: null })), J(0.596, 'id'), J(0.62, 'id'), J(0.748, 'id', [0.75]), J(0.748, 'id')]));",
        { ENTRI: JSON.stringify([penuh, kurang]) });
      if (c.expect(r.ok, `the composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
        const [isi, belum, tanpaTarget, j1, j2, j3, j4] = x;
        const t1 = teks(isi);
        // the lead: counted from the rows, naming the topics below the target; the bands and the comprehension under it
        c.expect(t1.includes("2 dari 4 topik masih di bawah target: Pecahan campuran; Penjumlahan dan pengurangan pecahan."), `the lead reads «${t1.slice(0, 200)}»`);
        c.expect(t1.includes("24 dari 29 murid sudah berada di pita «Mantap» atau «Berkembang»; 5 murid perlu penguatan.") && t1.includes("Pemahaman kelas: 74,8%."),
          "the bands and the comprehension are not said under the lead (R4-02: 74,8% against a 75% target)");
        // G-03: below the target is amber AND in words; the target is a labelled line; colour never alone
        c.expect((isi.match(/<li data-bawah="">/g) ?? []).length === 2 && (isi.match(/class="pin-lk-bawah">di bawah target</g) ?? []).length === 2 && /class="pin-lk-target"/.test(isi) && t1.includes("Target 75%"),
          "the rows below the target are not marked in words and amber, or the target line is missing");
        // B: the population line, then the bands over the assessed in the legend's order; «belum mengerjakan» is a count, never a band
        c.expect(/31 murid di kelas ini · 29 sudah mengerjakan Uji Penguasaan · 2 belum mengerjakan/.test(t1) && t1.includes("Hasil 29 murid yang sudah mengerjakan")
          && /data-pita="mantap"[^>]*>17<[\s\S]*data-pita="berkembang"[^>]*>7<[\s\S]*data-pita="penguatan"[^>]*>5</.test(isi) && !/data-pita="[a-z]*"[^>]*>2</.test(isi),
          "the bands are not drawn over the assessed, in order, apart from who has not sat");
        // C, D, letters, the next step, the action sentence (S-3)
        c.expect(t1.includes("+20 poin") && t1.includes("Dihitung dari 29 murid yang mengerjakan Pemetaan Awal dan Uji Penguasaan bab yang sama."), "the gain or its base is missing");
        c.expect(t1.includes("13 kali") && t1.includes("Samakan penyebut dulu.") && t1.includes("Saran penanganan untuk pemahaman keliru ada di bagian D."), "the misunderstanding, its remedy or the pointer to it is missing");
        c.expect(/>A<[\s\S]*>B<[\s\S]*>C<[\s\S]*>D<[\s\S]*>E<[\s\S]*>F</.test(isi) && /href="\/mengajar\/k\/bukti"/.test(isi), "the sections are not lettered A–F, or «Lihat bukti» is not linked");
        c.expect((isi.match(/data-lk-tindakan=""/g) ?? []).length >= 4, "a figure is drawn without its action sentence (S-3)");
        // 2b: every figure keeps its place, with how far and what makes it appear; no figure, no lead
        const t2 = teks(belum);
        c.expect(!/data-lk-kalimat/.test(belum) && (t2.match(/Sekarang 3 murid; perlu 5\./g) ?? []).length >= 4 && /30 murid di kelas ini · 3 sudah/.test(t2) && !/data-pita/.test(belum.replace(/<i data-pita[^>]*>/g, "")),
          `the not-yet report does not keep each figure's place: ${t2.slice(0, 200)}`);
        // no target: no line, no «di bawah target», the lowest named instead
        const t3 = teks(tanpaTarget);
        c.expect(!/pin-lk-target/.test(tanpaTarget) && !/di bawah target/.test(t3) && t3.includes("Penguasaan terendah ada pada Pecahan campuran."), "a class with no one target still draws a target or says «di bawah target»");
        // R4-02: a value rounding would carry across 60%, 80% or the target shows one decimal; others whole
        c.expect(j1 === "59,6%" && j2 === "62%" && j3 === "74,8%" && j4 === "75%", `R4-02 rounding reads ${JSON.stringify([j1, j2, j3, j4])}`);
      }
      const halaman = kode(baca(ctx.repoRoot, "src/app/edukator/ringkasan/page.tsx"));
      c.expect(/<KomposisiKelas entries=\{entries\}/.test(halaman) && /await targetKelas\(kelas\)/.test(halaman) && /supabase\.rpc\("generate_report"/.test(halaman),
        "Ringkasan Kelas does not draw the composition over generate_report's envelopes and the class's sealed target");
      return c.verdict("renders KomposisiKelas (CONTOH LAPORAN 2-guru/2b): the lead counted from the rows, the bands and comprehension under it with R4-02's decimal, " +
        "rows below the target amber and in words against a labelled target line, the population apart from the bands drawn in order over the assessed, the gain with its base, " +
        "the remedy, letters A–F, an action sentence under each figure; the not-yet report keeps each figure's place with how far; no target, no line; " +
        "and Ringkasan Kelas draws it over generate_report and the sealed target");
    },
  },
  {
    // CONTOH LAPORAN 3-kadep (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov): topics × classes on /pimpinan
    id: "LAPORAN-KISI-01",
    run: async (ctx) => {
      const c = new Checks();
      const topik = (r: Array<[string, string, number]>) => ({ status: "ok", metric_id: "class.topic_mastery", label_key: "metrik.topik.label",
        value: r.map(([id, nama, v]) => ({ objective_id: id, competency: nama, mean_score: v, learners: 25 })) });
      const kolom = [
        { id: "7a", nama: "7A", target: 0.75, topik: topik([["p", "Pecahan campuran", 0.57], ["s", "Pecahan senilai", 0.87]]) },
        { id: "7b", nama: "7B", target: 0.75, topik: topik([["p", "Pecahan campuran", 0.62], ["s", "Pecahan senilai", 0.9]]) },
        { id: "7c", nama: "7C", target: 0.7, topik: topik([["p", "Pecahan campuran", 0.81], ["s", "Pecahan senilai", 0.696]]) },
        { id: "7d", nama: "7D", target: null, topik: topik([["p", "Pecahan campuran", 0.5]]) },
        { id: "7e", nama: "7E", target: 0.75, topik: { status: "below_minimum", readiness: "INSUFFICIENT_EVIDENCE", have: 2, needed: 5 } },
        { id: "7f", nama: "7F", target: 0.75, topik: { status: "not_permitted" } },
      ];
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KisiTopik.tsx");' +
        "const K = m.default?.default ?? m.default;" +
        "process.stdout.write(renderToStaticMarkup(h(K, { kolom: JSON.parse(process.env.KOLOM), locale: 'id' })));",
        { KOLOM: JSON.stringify(kolom) });
      if (c.expect(r.ok, `the grid could not be rendered: ${r.err}`)) {
        const html = r.out;
        const teks = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        // the lead counts the topics below their own target in most classes that have a target (7A, 7B of 7A–7C)
        c.expect(teks.includes("Pecahan campuran di bawah target di sebagian besar kelas."), `the lead reads «${teks.slice(0, 220)}»`);
        // each class its own column; the refused one is absent without a word; the short one says so in its place
        c.expect(/>7A<[\s\S]*>7B<[\s\S]*>7C<[\s\S]*>7D<[\s\S]*>7E</.test(html) && !/>7F</.test(html), "the columns are not the classes the reader may see");
        c.expect((teks.match(/Belum cukup bukti/g) ?? []).length === 2, "a class without enough evidence does not say so in its cells");
        // cells: below the class's own target amber and in words; R4-02 (69,6% against 70%); no target, no tick and no verdict
        c.expect((html.match(/data-bawah=""/g) ?? []).length === 3 && (html.match(/class="pin-lk-bawah">di bawah target</g) ?? []).length === 3,
          "a cell below its class's target is not marked in words and amber (expected 7A, 7B Pecahan campuran and 7C Pecahan senilai)");
        c.expect(teks.includes("69,6%") && teks.includes("57%") && (html.match(/<u /g) ?? []).length === 6, "R4-02 or the target ticks are wrong");
        c.expect(/<table[\s\S]*<th scope="col">Topik<\/th>[\s\S]*<th scope="row">Pecahan campuran<\/th>/.test(html), "the grid is not a table with row and column headers (its own text equivalent)");
      }
      const hal = kode(baca(ctx.repoRoot, "src/app/pimpinan/page.tsx"));
      const lib = kode(baca(ctx.repoRoot, "src/lib/pimpinan.ts"));
      c.expect(/<KisiTopik kolom=\{perKelas\.map\(/.test(hal) && /minta\("class\.topic_mastery", k\.id\)/.test(lib) && /targetKelasDari\(c, k\.id\)/.test(lib),
        "/pimpinan does not draw the grid from each class's own figure and sealed target");
      return c.verdict("renders KisiTopik (CONTOH LAPORAN 3-kadep): each class the reader may see as its own column (a refused class absent without a word), each cell that class's own topic figure " +
        "against its own sealed target, amber and in words below it, R4-02's decimal; a class without enough evidence says so in its cells; the lead names the topics below target in most classes; " +
        "a table with row and column headers; and /pimpinan draws it from each class's own envelope and target");
    },
  },
  {
    // CONTOH LAPORAN 4-dekan (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov): the school summary is one composition
    id: "LAPORAN-SEKOLAH-01",
    run: async (ctx) => {
      const c = new Checks();
      const ok = (o: Record<string, unknown>): Record<string, unknown> => ({ status: "ok", readiness: "SUFFICIENT_EVIDENCE", ...o });
      const penuh = [
        ok({ metric_id: "institution.participants", label_key: "metrik.peserta_institusi.label", value: 420, sample: 420 }),
        ok({ metric_id: "institution.net_gain", label_key: "metrik.kenaikan_institusi.label", value: 0.19, sample: 380 }),
        ok({ metric_id: "institution.safety_gate_pass_rate", label_key: "metrik.gerbang_keselamatan.label", value: 0.84, sample: 836 }),
        ok({ metric_id: "institution.verified_credentials", label_key: "metrik.kredensial.label", value: 408, sample: 411 }),
        ok({ metric_id: "institution.competency_outcomes", label_key: "metrik.kompetensi.label", value: [
          { objective_id: "a", competency: "Listrik dan magnet", mean_score: 0.596, learners: 200 },
          { objective_id: "b", competency: "Bilangan", mean_score: 0.82, learners: 210 },
          { objective_id: "c", competency: "Geometri dan pengukuran", mean_score: 0.55, learners: 205 } ] }),
        ok({ metric_id: "institution.cohort_comparison", label_key: "metrik.perbandingan_kohort.label", value: [
          { cohort_node_id: "k7", learners: 150, mean_mastery: 0.71 }, { cohort_node_id: "k8", learners: 140, mean_mastery: 0.66 } ] }),
      ];
      const kurang = penuh.map((e) => ({ status: "below_minimum", readiness: "INSUFFICIENT_EVIDENCE", metric_id: e.metric_id, label_key: e.label_key,
        statement_key: "laporan.metrik.belum_cukup_data", have: 4, needed: 10 }));
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiSekolah.tsx");' +
        "const K = m.default?.default ?? m.default; const [a, b] = JSON.parse(process.env.ENTRI);" +
        "const tempat = { k7: 'Angkatan 2026 (kelas 7)', k8: 'Angkatan 2025 (kelas 8)' };" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { entries: a, locale: 'id', tempat })), renderToStaticMarkup(h(K, { entries: b, locale: 'id', tempat }))]));",
        { ENTRI: JSON.stringify([penuh, kurang]) });
      if (c.expect(r.ok, `the school composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const [isi, belum] = x;
        const t1 = teks(isi);
        c.expect(t1.includes("Perhatian ada pada Listrik dan magnet; Geometri dan pengukuran: masih di bawah 60%."), `the lead reads «${t1.slice(0, 200)}»`);
        // R4-01: the zones named once above the scale; R4-02: 59,6%, not «60%»; sorted high to low; below 60% amber and names its band
        c.expect(t1.includes("Batas pita: di bawah 60% «Perlu penguatan» · 60–79% «Berkembang» · 80% ke atas «Mantap».") && t1.includes("59,6%")
          && /Bilangan[\s\S]*Listrik dan magnet[\s\S]*Geometri dan pengukuran/.test(t1)
          && (isi.match(/<li data-bawah="">/g) ?? []).length === 2 && (isi.match(/class="pin-lk-bawah">Perlu penguatan</g) ?? []).length === 2
          && (isi.match(/class="pin-lk-zona"/g) ?? []).length === 10, "the domain dot plot does not follow R4-01, R4-02 or G-03");
        // B: every headline figure with its base; R4-03: issued and not revoked out of all issued
        c.expect(t1.includes("408 dari 411 yang pernah terbit; 3 dicabut.") && t1.includes("Dari 836 hasil Uji Penguasaan.")
          && t1.includes("Dihitung dari 380 murid yang mengerjakan Pemetaan Awal dan Uji Penguasaan bab yang sama."), "a headline figure stands without its base");
        // C: the cohorts by name on the same scale, captioned as states, not a ranking
        c.expect(t1.includes("Angkatan 2026 (kelas 7)") && t1.includes("Ini perbandingan keadaan, bukan peringkat."), "the cohort comparison is not named or captioned");
        c.expect(/>A<[\s\S]*>B<[\s\S]*>C<[\s\S]*>D</.test(isi) && (isi.match(/data-lk-tindakan=""/g) ?? []).length >= 6, "the sections are not lettered, or a figure lacks its action sentence");
        const t2 = teks(belum);
        c.expect(!/data-lk-kalimat/.test(belum) && (t2.match(/Sekarang 4 murid; perlu 10\./g) ?? []).length >= 3, `the not-yet school report does not keep each figure's place: ${t2.slice(0, 200)}`);
      }
      c.expect(/<KomposisiSekolah entries=\{entries\}/.test(kode(baca(ctx.repoRoot, "src/app/dekan/ringkasan/page.tsx"))), "Ringkasan Sekolah does not draw the composition");
      return c.verdict("renders KomposisiSekolah (CONTOH LAPORAN 4-dekan): the lead names the domains below 60%; the dot plot high to low with PINTAR's zones named once above (R4-01), " +
        "R4-02's 59,6%, below 60% amber and naming its band; each headline figure with its base, «Sertifikat terbit» issued and not revoked out of all issued (R4-03); " +
        "the cohorts by name on the same scale captioned as states, not a ranking; lettered sections, an action sentence under each figure; the not-yet report keeps each place");
    },
  },
];

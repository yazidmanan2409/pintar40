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
        // KESETIAAN #1: the list said as a sentence, «serta» before the last because a name already holds «dan»
        c.expect(t1.includes("2 dari 4 topik masih di bawah target: Pecahan campuran serta Penjumlahan dan pengurangan pecahan."), `the lead reads «${t1.slice(0, 200)}»`);
        c.expect(t1.includes("24 dari 29 murid sudah berada di pita «Mantap» atau «Berkembang»; 5 murid perlu penguatan.") && t1.includes("Pemahaman kelas: 74,8%."),
          "the bands and the comprehension are not said under the lead (R4-02: 74,8% against a 75% target)");
        // G-03: below the target is amber AND in words; the target is a labelled line; colour never alone
        c.expect((isi.match(/<li data-bawah="">/g) ?? []).length === 2 && (isi.match(/class="pin-lk-bawah">di bawah target</g) ?? []).length === 2 && /class="pin-lk-target"/.test(isi) && t1.includes("Target 75%"),
          "the rows below the target are not marked in words and amber, or the target line is missing");
        // B: the population line, then the bands over the assessed in the legend's order; «belum mengerjakan» is a count, never a band
        c.expect(/31 murid di kelas ini · 29 sudah mengerjakan Uji Penguasaan · 2 belum mengerjakan/.test(t1) && t1.includes("Hasil 29 murid yang sudah mengerjakan")
          && /data-pita="mantap"[^>]*>17<[\s\S]*data-pita="berkembang"[^>]*>7<[\s\S]*data-pita="penguatan"[^>]*>5</.test(isi) && !/data-pita="[a-z]*"[^>]*>2</.test(isi),
          "the bands are not drawn over the assessed, in order, apart from who has not sat");
        // KESETIAAN #6: the legend says how many learners and their share
        c.expect(t1.includes("Mantap 17 murid (59%)") && t1.includes("Perlu penguatan 5 murid (17%)"), "the band legend does not say «17 murid (59%)»");
        // KESETIAAN #10: the target's label sits on the scale at its line, in the one scale row
        c.expect((isi.match(/class="pin-lk-skala"/g) ?? []).length === 1 && /<div class="pin-lk-skala-garis">[^]*?class="pin-lk-skala-target" style="left:75%"/.test(isi),
          "the target's label is not on the scale at the target line");
        // C, D, letters, the next step, the action sentence (S-3)
        c.expect(t1.includes("+20 poin") && t1.includes("Dihitung dari 29 murid yang mengerjakan Pemetaan Awal dan Uji Penguasaan bab yang sama."), "the gain or its base is missing");
        c.expect(t1.includes("13 kali") && /class="pin-lk-saran">Saran penanganan: Samakan penyebut dulu\.</.test(isi) && t1.includes("Saran penanganan untuk pemahaman keliru ada di bagian D."), "the misunderstanding, its labelled remedy (#8) or the pointer to it is missing");
        // KESETIAAN #4/#4b: every section lettered A–E with the letter read («Bagian A»), each heading outside its card;
        // #9: no «Peserta» tile repeats B's population line
        c.expect(/>A<[\s\S]*>B<[\s\S]*>C<[\s\S]*>D<[\s\S]*>E</.test(isi) && !/>F</.test(isi) && /href="\/mengajar\/k\/bukti"/.test(isi), "the sections are not lettered A–E, or «Lihat bukti» is not linked");
        c.expect((isi.match(/<span class="pin-lk-huruf"><span class="pin-sr">Bagian <\/span>[A-E]<\/span>/g) ?? []).length === 5 && !/aria-hidden="true">[A-F]</.test(isi)
          && !/class="pin-lk-inti"[^>]*>\s*<h2/.test(isi), "a section letter is hidden from a screen reader, or a heading sits inside its card");
        c.expect(!/data-lk="lain"/.test(isi) && !/Peserta 29/.test(t1), "a «Peserta» tile repeats the population line");
        // …and the participants figure IS that line: it keeps its labelled place, so the template's entries stay countable (journey S23t)
        c.expect((isi.match(/data-lk-entri="Peserta"/g) ?? []).length === 1 && /<p class="pin-meta" data-lk-entri="Peserta">31 murid di kelas ini/.test(isi),
          "the population line does not carry the participants figure's label");
        // KESETIAAN #2: no advice line under any figure
        c.expect(!/data-lk-tindakan/.test(isi) && !/Tidak perlu diulang|Fokuskan waktu tambahan/.test(t1), "an advice line is drawn under a figure");
        // 2b: every figure keeps its place, with how far and what makes it appear; no figure, no lead
        const t2 = teks(belum);
        // KESETIAAN #11: one lead says how far (once), each figure keeps its place on one line, nothing to do now
        c.expect(t2.includes("Belum cukup bukti untuk menyimpulkan apa pun tentang Kelas 7A.") && t2.includes("Baru 3 dari 30 murid mengerjakan Uji Penguasaan. Angka kelas muncul setelah paling sedikit 5 murid mengerjakannya.")
          && t2.includes("Tidak ada yang perlu dilakukan sekarang.") && /30 murid di kelas ini · 3 sudah/.test(t2) && (t2.match(/30 murid di kelas ini/g) ?? []).length === 1,
          `the not-yet report has no single lead: ${t2.slice(0, 260)}`);
        c.expect((belum.match(/data-lk-tiada=""/g) ?? []).length >= 4 && (t2.match(/Sekarang 3 murid; perlu 5\./g) ?? []).length >= 4 && !/data-pita/.test(belum.replace(/<i data-pita[^>]*>/g, ""))
          && !/class="pin-lk-arti">Angka ini muncul/.test(belum), `the not-yet figures are not one line each: ${t2.slice(0, 200)}`);
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
        "the labelled remedy, letters A–E read aloud, no advice line, no duplicated participants tile, the legend in learners and share, the target label on the scale; " +
        "the not-yet report one lead with how far, each figure one line, nothing to do now; no target, no line; " +
        "and Ringkasan Kelas draws it over generate_report and the sealed target");
    },
  },
  {
    // D-195(5), CONTOH LAPORAN 2-guru section E: the learners in the lowest band, by name, for the class's teacher
    id: "LAPORAN-KELAS-02",
    run: async (ctx) => {
      const c = new Checks();
      const pita = { status: "ok", readiness: "SUFFICIENT_EVIDENCE", metric_id: "class.readiness_distribution", label_key: "metrik.kesiapan.label",
        meaning_key: "metrik.kesiapan.arti", value: { "kesiapan.butuh_pendampingan": 2, "kesiapan.siap_sertifikasi": 5 }, population: { placed: 7, assessed: 7, not_yet: 0 } };
      const sedikit = { ...pita, status: "below_minimum", readiness: "INSUFFICIENT_EVIDENCE", value: undefined, statement_key: "laporan.metrik.belum_cukup_data", have: 3, needed: 5 };
      const orang = [{ id: "o1", nama: "Ayu Tanjung", ulang: ["Pecahan campuran", "Membandingkan pecahan"], benar: 9, total: 20, soalWajibTepat: false },
        { id: "o2", nama: "Hana Siregar", ulang: [], benar: 11, total: 20, soalWajibTepat: true }];
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiKelas.tsx");' +
        "const K = m.default?.default ?? m.default; const [a, b, o] = JSON.parse(process.env.ENTRI);" +
        "const p = { locale: 'id', persona: 'educator', jenis: 'LEARNER', namaKelas: 'Kelas 7A', buktiHref: '/mengajar/k/bukti', target: 0.75 };" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { ...p, entries: [a], penguatan: o, muridHref: '/mengajar/k/murid' }))," +
        " renderToStaticMarkup(h(K, { ...p, entries: [a], penguatan: [], muridHref: '/mengajar/k/murid' }))," +
        " renderToStaticMarkup(h(K, { ...p, entries: [a], penguatan: null }))," +
        " renderToStaticMarkup(h(K, { ...p, entries: [b], penguatan: o, muridHref: '/mengajar/k/murid' }))]));",
        { ENTRI: JSON.stringify([pita, sedikit, orang]) });
      if (c.expect(r.ok, `the composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const [ada, kosong, tanpa, belum] = x;
        const t1 = teks(ada);
        c.expect(t1.includes("Murid yang perlu penguatan") && t1.includes("Murid kelas ini di pita «Perlu penguatan», menurut abjad.")
          && /data-lk-penguatan=""/.test(ada) && /href="\/mengajar\/k\/murid\/o1">Ayu Tanjung</.test(ada) && /href="\/mengajar\/k\/murid\/o2">Hana Siregar</.test(ada)
          && t1.includes("Pelajari lagi: Pecahan campuran, Membandingkan pecahan"), `section E does not name the learners with what to study again: ${t1.slice(0, 300)}`);
        c.expect((ada.match(/Pelajari lagi:/g) ?? []).length === 1, "a learner with nothing recorded below the target is given an empty «Pelajari lagi»");
        // KESETIAAN #5: each with «N dari M soal tepat», and «soal wajib belum tepat» only where the gate failed
        c.expect(t1.includes("9 dari 20 soal tepat") && t1.includes("11 dari 20 soal tepat") && (ada.match(/class="pin-lk-bawah">soal wajib belum tepat</g) ?? []).length === 1,
          "the learners' counts or the required-question note are missing");
        c.expect(/>A<[\s\S]*>B<[\s\S]*>C</.test(ada) && t1.includes("Mulai dari murid di bagian B:"), "section E is not lettered after the bands, or «Apa berikutnya» does not point to it");
        c.expect(!/\d+(,\d+)?%/.test(teks(ada.slice(ada.indexOf('data-lk="penguatan"'), ada.indexOf('data-lk="berikutnya"')))), "section E shows a percentage beside a name");
        c.expect(teks(kosong).includes("Saat ini tidak ada murid kelas ini di pita «Perlu penguatan».") && !/data-lk-penguatan/.test(kosong), "an empty list is not said");
        c.expect(!/data-lk="penguatan"/.test(tanpa), "a reader given no list (not the class's teacher, or an unread answer) is shown section E");
        c.expect(!/data-lk="penguatan"/.test(belum) && !/Ayu Tanjung/.test(belum), "names appear where the class's bands are not shown");
      }
      const lib = kode(baca(ctx.repoRoot, "src/lib/pengajar.ts"));
      const awal = lib.indexOf("export async function perluPenguatan");
      const fn = lib.slice(awal, lib.indexOf("export ", awal + 10));
      c.expect(/c\.rpc\("murid_perlu_penguatan", \{ p_class: kelasId \}\)/.test(fn) && /if \(error\) return null;/.test(fn) && /tujuanBelum\(kelasId, o\.person_id\)/.test(fn) && !/\.from\(/.test(fn),
        "pengajar.perluPenguatan does not ask the database's murid_perlu_penguatan and tujuan_belum_tercapai alone, or says «nobody» for an unread answer");
      const halaman = kode(baca(ctx.repoRoot, "src/app/edukator/ringkasan/page.tsx"));
      c.expect(/untuk === "educator" && kelas \? perluPenguatan\(kelas\) : Promise\.resolve\(null\)/.test(halaman) && /penguatan=\{penguatan\}/.test(halaman),
        "Ringkasan Kelas asks for the names for a reader who does not teach the class, or does not pass them");
      const mig = baca(ctx.repoRoot, "supabase/migrations/20270102100000_a_teacher_names_the_learners_who_need_reinforcement.sql");
      c.expect(/create or replace function public\.murid_perlu_penguatan\(p_class uuid\)\s*returns table \(person_id uuid, display_name text, benar integer, total integer, soal_wajib_tepat boolean\)\s*language plpgsql stable security definer set search_path = public, pg_temp/.test(mig)
        && !/responses|answer_key|item_responses/.test(mig.slice(0, mig.indexOf("create or replace function public.jenis_belajar_saya"))),
        "murid_perlu_penguatan is not a SECURITY DEFINER function returning the identity, the name, the count and the gate only, or reads answers");
      return c.verdict("renders section E (D-195(5)): the class's learners in «Perlu penguatan» by name, linked to the teacher's view of each, with what to study again " +
        "and no figure; an empty list said; nothing for a reader given no list or where the bands are not shown; lettered after the bands and pointed to by «Apa berikutnya»; " +
        "the names come from murid_perlu_penguatan, for the class's teacher only");
    },
  },
  {
    // D-195(4), CONTOH LAPORAN 5-peserta: a professional-learning result says who else may see it, exactly as the database decides
    id: "LAPORAN-PESERTA-01",
    run: async (ctx) => {
      const c = new Checks();
      const id = t("pengembangan.siapa_melihat" as HleEvent, "learner", { locale: "id" });
      const en = t("pengembangan.siapa_melihat" as HleEvent, "learner", { locale: "en" });
      // the audiences of professional_learning_record: the full record for the facilitator, the Kepala departemen and the Dekan; enrolment,
      // participation and completion only for Admin sekolah (D-069(b)); answers to no one else; integrity not surfaced (D-069(c))
      const mig = baca(ctx.repoRoot, "supabase/migrations/20261118100000_an_educator_learns_as_a_participant.sql");
      c.expect(/v_full := v_aud && array\['FACILITATOR', 'HEAD', 'DEAN'\];/.test(mig) && /array\['FACILITATOR', 'HEAD', 'DEAN', 'ADMIN'\]/.test(mig),
        "the professional-learning record's audiences are no longer the ones the sentence states: restate the sentence with the change");
      // KESETIAAN #23: Daisy's corrected sentence (5-peserta-pd.html, 8cfc75b5), word for word
      c.expect(id === "Hasil ini terlihat oleh Anda, fasilitator paket ini, Kepala departemen yang membawahi pengembangan profesi, dan Dekan. Admin sekolah hanya melihat pendaftaran, keikutsertaan, dan penyelesaian; guru lain tidak melihatnya. Jawaban Anda per soal tidak ditampilkan kepada mereka.",
        `the Indonesian sentence is not Daisy's corrected one (D-069(b)): «${id}»`);
      c.expect(/facilitator[\s\S]*Head of department[\s\S]*Dean[\s\S]*school administrator sees only enrolment, participation and completion; other teachers do not see it[\s\S]*answers to each question are not shown to them/.test(en),
        `the English sentence does not say the same: «${en}»`);
      c.expect(/hanya untuk fasilitator, Kepala departemen dan Dekan/.test(t("pengembangan.arti_terbatas" as HleEvent, "staff", { locale: "id" })),
        "the administrator's own page (pengembangan.arti_terbatas) no longer agrees with the participant's sentence");
      const halaman = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx"));
      c.expect(/engine\.isProfessionalLearning\(db, tugas\)/.test(halaman) && /\{pengembangan === true \? \(/.test(halaman)
        && /s\("pengembangan\.siapa_melihat"\)/.test(halaman) && /s\("pengembangan\.arti"\)/.test(halaman),
        "the result page does not say it for a professional-learning package only");
      const eng = kode(baca(ctx.repoRoot, "src/lib/assessment-engine/index.ts"));
      c.expect(/call\(db, "jenis_belajar_saya", \{ p_learning_assignment: learningAssignmentId \}\)/.test(eng), "the engine does not ask jenis_belajar_saya");
      const baru = baca(ctx.repoRoot, "supabase/migrations/20270102100000_a_teacher_names_the_learners_who_need_reinforcement.sql");
      c.expect(/create or replace function public\.jenis_belajar_saya\(p_learning_assignment uuid\)\s*returns boolean[\s\S]*?from public\.my_learning_assignments\(\) m/.test(baru),
        "jenis_belajar_saya does not answer for the caller's own learning assignments only");
      return c.verdict("a professional-learning result page (only) says who sees it in Daisy's corrected words: the facilitator, the Kepala departemen and the Dekan the result; Admin sekolah enrolment, " +
        "participation and completion only; other teachers nothing; the answers per question not shown to them (D-069(b)), matching " +
        "professional_learning_record's audiences and the administrator's own page, in both languages");
    },
  },
  {
    // D-195(3), CONTOH LAPORAN 6-fasilitator: each participant's steps, person by person, nothing added up (D-069(b))
    id: "LAPORAN-FASILITATOR-01",
    run: async (ctx) => {
      const c = new Checks();
      const pkt = (o: Record<string, unknown>): Record<string, unknown> => ({ id: "la1", judul: "Merancang Asesmen Formatif", mulai: true, pemetaan: "SELESAI", penguasaan: "SELESAI", selesai: true, ...o });
      const peserta = [
        { id: "p3", nama: "Citra Lestari", terdaftar: "ACTIVE", paket: [pkt({ id: "la3", penguasaan: "BELUM", selesai: false, pelajaran: { selesai: 4, jumlah: 5 }, hasil: null })] },
        { id: "p1", nama: "Andi Nugroho", terdaftar: "ACTIVE", paket: [pkt({ pelajaran: { selesai: 5, jumlah: 5 }, hasil: { penguasaan: 0.85, tercapai: true } })] },
        { id: "p9", nama: "Imam Syafii", terdaftar: "PENDING", paket: [pkt({ id: "la9", mulai: false, pemetaan: "BELUM", penguasaan: "BELUM", selesai: false, pelajaran: { selesai: 0, jumlah: 5 }, hasil: null })] },
        { id: "p5", nama: "Eko Prasetyo", terdaftar: "ACTIVE", paket: [] },
      ];
      const penuh = { simpul: "n", nama: "Kelas PD", kolom: "FULL", peserta };
      const terbatas = { ...penuh, kolom: "COMPLETION", peserta: peserta.map((o) => ({ ...o, paket: o.paket.map((p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== "pelajaran" && k !== "hasil"))) })) };
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiPengembangan.tsx");' +
        "const K = m.default?.default ?? m.default; const [a, b] = JSON.parse(process.env.ENTRI);" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { isi: a, locale: 'id' })), renderToStaticMarkup(h(K, { isi: b, locale: 'id' }))]));",
        { ENTRI: JSON.stringify([penuh, terbatas]) });
      if (c.expect(r.ok, `the composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const [f, a] = x;
        const tf = teks(f), ta = teks(a);
        // alphabetical, never by result; the row's own facts in words
        c.expect(/Andi Nugroho[\s\S]*Citra Lestari[\s\S]*Imam Syafii/.test(tf), "the participants are not in alphabetical order");
        c.expect(/<th scope="col">Pelajaran selesai<\/th>/.test(f) && /<th scope="col">Hasil<\/th>/.test(f) && tf.includes("5 dari 5") && tf.includes("Tercapai · 85%") && tf.includes("4 dari 5"),
          "the facilitator's columns (lessons, result) are not drawn per person");
        c.expect(tf.includes("Terdaftar, akun belum diaktifkan") && tf.includes("Belum mulai: Imam Syafii.") && tf.includes("Belum diberi paket: Eko Prasetyo."),
          "who has not begun, who has no package, or an account not activated, is not said by name");
        // D-069(b): no participant count, no total, no headline figure
        c.expect(!/\d+\s*(dari\s*\d+\s*)?(peserta|orang|sudah mulai|sudah selesai)/i.test(tf) && !/data-lk-entri/.test(f) && !/<tfoot/.test(f),
          `an aggregate is drawn: ${tf.slice(0, 200)}`);
        c.expect(tf.includes("Jawaban peserta dan catatan integritas tidak ditampilkan di sini.") && tf.includes("tidak dijumlahkan dan tidak diurutkan"), "the record does not say answers and integrity are not shown, or that nothing is added up");
        c.expect((f.match(/data-selesai=""/g) ?? []).length >= 4 && /<caption class="pin-sr">/.test(f), "done steps are not marked, or the table has no caption");
        // RB1-C1 (journey, 7 Nov): a sideways-scrolling table is a focusable, named region (axe scrollable-region-focusable)
        c.expect(/class="pin-lk-kisi-wadah" data-pd-paket="" role="region" tabindex="0" aria-label="Paket: /.test(f), "the scrolling table is not a focusable, named region");
        // COMPLETION (Admin sekolah): what came back only
        c.expect(!/Pelajaran selesai/.test(ta) && !/Hasil/.test(ta.replace("Tentang catatan ini", "")) && !/85%/.test(ta) && /<th scope="col">Selesai<\/th>/.test(a)
          && ta.includes("Peserta menurut abjad.") && !ta.includes("tidak dijumlahkan"),
          `the administrator's record draws a column the database did not return: ${ta.slice(0, 200)}`);
      }
      const halaman = kode(baca(ctx.repoRoot, "src/app/pengembangan/[simpul]/page.tsx"));
      c.expect(/<KomposisiPengembangan isi=\{isi\} locale=\{locale\} \/>/.test(halaman) && /catatan\(simpul\)/.test(halaman), "the record page does not draw the composition over professional_learning_record");
      return c.verdict("renders the professional-learning record (D-195(3), 6-fasilitator): a table per package, participants alphabetical, each step in words with a mark " +
        "when done, the facilitator's lessons and result per person, who has not begun and who has no package by name; no count, total or headline figure (D-069(b)); " +
        "answers and integrity said not shown; the administrator's record draws only enrolment, participation and completion");
    },
  },
  {
    // D-195(1), CONTOH LAPORAN 1-murid: every chapter the learner has worked on, on one page, their own work only
    id: "LAPORAN-MURID-01",
    run: async (ctx) => {
      const c = new Checks();
      const bab = [
        { tugas: "t1", judul: "Matematika · Bab 1", keadaan: "SELESAI", awal: 0.45, akhir: 0.9, ambang: 0.75, tercapai: "TERCAPAI", benar: 18, total: 20,
          bagian: [{ kode: "A", nama: "Bilangan bulat", benar: 4, total: 4, ulang: false }], ulang: [] },
        { tugas: "t2", judul: "IPA · Bab 1", keadaan: "SELESAI", awal: null, akhir: 0.65, ambang: 0.75, tercapai: "BELUM", benar: 13, total: 20,
          bagian: [{ kode: "M", nama: "Massa jenis", benar: 1, total: 4, ulang: true }, { kode: "W", nama: "Wujud zat", benar: 4, total: 4, ulang: false }],
          ulang: ["Massa jenis", "Campuran dan larutan"] },
        { tugas: "t3", judul: "Matematika · Bab 3", keadaan: "BERJALAN", awal: null, akhir: null, ambang: null, tercapai: null, benar: 0, total: 0, bagian: [], ulang: [] },
      ];
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiMurid.tsx");' +
        "const K = m.default?.default ?? m.default; const [a] = JSON.parse(process.env.ENTRI);" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { bab: a, locale: 'id' })), renderToStaticMarkup(h(K, { bab: [a[2]], locale: 'id' }))]));",
        { ENTRI: JSON.stringify([bab]) });
      if (c.expect(r.ok, `the composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const [isi, belum] = x;
        const t1 = teks(isi);
        c.expect(t1.includes("1 dari 2 bab yang selesai sudah mencapai target.") && t1.includes("Pelajari lagi: Massa jenis serta Campuran dan larutan (IPA · Bab 1)."),
          `the lead is not counted from the learner's own chapters, or does not name what to study again: ${t1.slice(0, 250)}`);
        c.expect(t1.includes("18 dari 20 soal") && t1.includes("target tercapai") && /class="pin-lk-bawah">belum mencapai target</.test(isi) && (isi.match(/<li data-bawah="">/g) ?? []).length >= 2,
          "a chapter's count, its verdict, or below-the-target in words and amber is missing (G-03)");
        c.expect(/data-awal="" style="left:45%"/.test(isi) && /class="pin-lk-target" style="left:75%"/.test(isi) && t1.includes("Pemetaan Awal: 45%.") && t1.includes("Uji Penguasaan: 90%."),
          "the Pemetaan Awal mark, the chapter's own target line, or the row's text equivalent is missing");
        c.expect(/data-keadaan="berjalan"/.test(isi) && t1.includes("Sedang dikerjakan") && /href="\/belajar\/t3">Lanjutkan Matematika · Bab 3</.test(isi),
          "a chapter under way is not said, with no figure, and continued from here");
        c.expect(/data-hb-bab=""/.test(isi) && t1.includes("Massa jenis") && t1.includes("1 dari 4 soal") && /class="pin-lk-bawah">pelajari lagi</.test(isi) && (isi.match(/<i data-isi=""/g) ?? []).length === 9,
          "the parts per chapter (one square per question, filled when right; «pelajari lagi») are not drawn");
        c.expect(/href="\/belajar\/t1\/hasil">Hasil lengkap Matematika · Bab 1</.test(isi) && /href="\/belajar\/t2\/hasil"/.test(isi) && /href="\/belajar\/sertifikat"/.test(isi),
          "each chapter's own result page, or the certificates, is not linked: the chapter-level details are not kept");
        c.expect(!/kelas|rata-rata|peringkat|teman/i.test(t1), "a class figure, an average, a rank or a peer appears on the learner's own report");
        c.expect(/>A<[\s\S]*>B<[\s\S]*>C</.test(isi) && /data-lk-kalimat/.test(isi), "the sections are not lettered A–C");
        c.expect(teks(belum).includes("Belum ada bab yang selesai.") && !/data-lk="bagian"/.test(belum) && /data-awal|data-bawah/.test(belum) === false, "a learner with nothing finished is shown figures");
      }
      const halaman = kode(baca(ctx.repoRoot, "src/app/belajar/hasil/page.tsx"));
      const lib = kode(baca(ctx.repoRoot, "src/lib/hasil-belajar.ts"));
      c.expect(/await hasilBelajar\(db\)/.test(halaman) && /<KomposisiMurid bab=\{bab\}/.test(halaman), "/belajar/hasil does not draw the composition over hasilBelajar");
      c.expect(/engine\.myAssignments\(db\)/.test(lib) && /engine\.outcome\(db, state\.post_session\)/.test(lib) && /ketuntasan\(outcome\)/.test(lib) && /bagianUlang\(/.test(lib) && !/\.from\(|\.rpc\(/.test(lib),
        "hasilBelajar reads anything but the learner's own engine reads, or decides a verdict of its own");
      c.expect(/href="\/belajar\/hasil"/.test(kode(baca(ctx.repoRoot, "src/app/belajar/page.tsx"))), "Belajar does not link the learner's report");
      return c.verdict("renders «Hasil belajar» (D-195(1), 1-murid): the lead counted from the learner's own chapters with what to study again, per chapter Pemetaan Awal and " +
        "Uji Penguasaan on one scale against the chapter's own target, below it amber and in words, a chapter under way said and continued; the parts per chapter as " +
        "squares with «pelajari lagi»; each chapter's own result page and the certificates linked; no class figure, average, rank or peer; the page reads only the " +
        "learner's own engine reads and is linked from Belajar");
    },
  },
  {
    // KESETIAAN #6 and #7 (owner GO, 7 Nov): the score line for the teacher; the before → after pair over Kenaikan's own pairs
    id: "LAPORAN-KELAS-03",
    run: async (ctx) => {
      const c = new Checks();
      const pita = { status: "ok", readiness: "SUFFICIENT_EVIDENCE", metric_id: "class.readiness_distribution", label_key: "metrik.kesiapan.label",
        value: { "kesiapan.butuh_pendampingan": 2, "kesiapan.perlu_review": 1, "kesiapan.siap_sertifikasi": 2 }, population: { placed: 6, assessed: 5, not_yet: 1 } };
      const naik = { status: "ok", readiness: "SUFFICIENT_EVIDENCE", metric_id: "class.net_gain", label_key: "metrik.kenaikan.label", value: 0.3083, sample: 6 };
      const titik = [{ mastery: 0.4, pita: "penguatan" }, { mastery: 0.9, pita: "penguatan" }, { mastery: 0.7, pita: "berkembang" }, { mastery: 0.85, pita: "mantap" }, { mastery: 0.851, pita: "mantap" }];
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiKelas.tsx");' +
        "const K = m.default?.default ?? m.default; const [a, b, d] = JSON.parse(process.env.ENTRI);" +
        "const p = { locale: 'id', persona: 'educator', jenis: 'LEARNER', namaKelas: 'Kelas 7A', buktiHref: null, target: 0.75, entries: [a, b] };" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { ...p, titik: d, awalAkhir: { awal: 0.425, akhir: 0.7333, pasangan: 6 } }))," +
        " renderToStaticMarkup(h(K, { ...p, titik: null, awalAkhir: 'TIDAK' })), renderToStaticMarkup(h(K, { ...p, titik: null, awalAkhir: null }))]));",
        { ENTRI: JSON.stringify([pita, naik, titik]) });
      if (c.expect(r.ok, `the composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const [ada, tidak, tanpa] = x;
        const strip = ada.slice(ada.indexOf('data-lk-titik=""'), ada.indexOf('data-lk-titik=""') + 4000);
        // #6: one dot per learner, in its band's step, the two that share 85% stacked, the picture hidden and said in words
        c.expect((strip.match(/<i data-pita="/g) ?? []).length === 5 && (strip.match(/<i data-pita="penguatan"/g) ?? []).length === 2
          && /<div class="pin-lk-strip" aria-hidden="true"/.test(strip) && /bottom:calc\(var\(--lk-titik\) \* 1\)/.test(strip),
          "the score line does not draw one dot per learner in its band, stacked where scores meet, as a hidden picture");
        c.expect(teks(ada).includes("Setiap titik satu murid (5 murid), diwarnai menurut pitanya"), "the score line has no text equivalent naming how many learners");
        c.expect(!/data-lk-titik/.test(tidak) && !/data-lk-titik/.test(tanpa), "a strip is drawn for a reader given no dots");
        // #7: the pair over Kenaikan's own pairs, R4-02's decimal; «Belum dapat dibandingkan» when not comparable; nothing unread
        c.expect(teks(ada).includes("Rata-rata kelas 42,5% → 73,3%") && teks(ada).includes("dari murid dan bab yang sama dengan Kenaikan")
          && (ada.match(/data-lk-awal-akhir=""/g) ?? []).length === 1, `the before → after pair is not drawn: ${teks(ada).slice(0, 300)}`);
        c.expect(teks(tidak).includes("Rata-rata sebelum dan sesudah belum dapat dibandingkan.") && !/→/.test(teks(tidak)), "an incomparable pair shows a figure, or says nothing");
        c.expect(!/data-lk-awal-akhir/.test(tanpa), "an unread pair is drawn");
      }
      const halaman = kode(baca(ctx.repoRoot, "src/app/edukator/ringkasan/page.tsx"));
      c.expect(/untuk === "educator" && kelas \? sebaranKelas\(kelas\) : Promise\.resolve\(null\)/.test(halaman) && /kelas \? awalAkhirKelas\(kelas\) : Promise\.resolve\(null\)/.test(halaman)
        && /titik=\{titik\} awalAkhir=\{awalAkhir\}/.test(halaman), "Ringkasan Kelas asks for the dots for a reader who does not teach the class, or does not pass the pair");
      const lib = kode(baca(ctx.repoRoot, "src/lib/pengajar.ts"));
      c.expect(/c\.rpc\("sebaran_murid_kelas", \{ p_class: kelasId \}\)/.test(lib) && /c\.rpc\("kenaikan_awal_akhir", \{ p_class: kelasId \}\)/.test(lib)
        && /if \(!r \|\| r\.awal == null \|\| r\.akhir == null\) return "TIDAK";/.test(lib), "the lib does not ask the two reads, or turns an empty answer into a figure");
      const mig = baca(ctx.repoRoot, "supabase/migrations/20270103100000_the_report_reads_daisy_asked_for.sql");
      c.expect(/create or replace function public\.sebaran_murid_kelas\(p_class uuid\)\s*returns table \(mastery numeric, tier_key text\)/.test(mig)
        && /v_ok := public\.metric_evaluate\('class\.net_gain', p_class, v_inst\) ->> 'status';/.test(mig), "the dots carry more than mastery and band, or the pair is not gated by the reader's own Kenaikan");
      return c.verdict("renders the score line (#6): one dot per learner in its band, stacked where scores meet, hidden from a screen reader and said in words, for the "
        + "teacher only; and the before → after pair (#7) over Kenaikan's own pairs, one decimal each, «belum dapat dibandingkan» when not comparable, nothing unread");
    },
  },
  {
    // KESETIAAN #18: the Dekan's evidence readiness per subject and class
    id: "LAPORAN-SEKOLAH-02",
    run: async (ctx) => {
      const c = new Checks();
      const mapel = [
        { mapel: "Matematika", kelasId: "a", kelas: "Kelas 7A", ada: 29, perlu: 5 }, { mapel: "Matematika", kelasId: "e", kelas: "Kelas 7E", ada: 4, perlu: 5 },
        { mapel: "IPA", kelasId: "a", kelas: "Kelas 7A", ada: 0, perlu: 5 } ];
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiSekolah.tsx");' +
        "const K = m.default?.default ?? m.default; const d = JSON.parse(process.env.MAPEL);" +
        "const e = [{ status: 'below_minimum', readiness: 'INSUFFICIENT_EVIDENCE', metric_id: 'institution.participants', label_key: 'metrik.peserta_institusi.label', have: 1, needed: 10 }];" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { entries: e, locale: 'id', kesiapanMapel: d })), renderToStaticMarkup(h(K, { entries: e, locale: 'id', kesiapanMapel: null }))]));",
        { MAPEL: JSON.stringify(mapel) });
      if (c.expect(r.ok, `the school composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const [ada, tanpa] = x;
        c.expect(teks(ada).includes("Matematika: 1 dari 2 kelas cukup untuk ditafsirkan.") && teks(ada).includes("Kelas 7E: sudah ada, belum cukup (4 dari 5 murid)")
          && teks(ada).includes("IPA: 0 dari 1 kelas cukup untuk ditafsirkan.") && teks(ada).includes("Kelas 7A: belum ada"),
          `the readiness per subject is not said with its denominator and the classes not yet: ${teks(ada).slice(0, 300)}`);
        c.expect(/data-lk-kesiapan-mapel=""/.test(ada) && /id="pin-kesiapan"/.test(ada) && /<span class="pin-sr">Bagian <\/span>/.test(ada), "the section is not lettered and named");
        c.expect(!/data-lk-kesiapan-mapel/.test(tanpa) && /data-lk="kesiapan"/.test(tanpa), "an unread answer does not fall back to the readiness by figure");
      }
      const hal = kode(baca(ctx.repoRoot, "src/app/dekan/ringkasan/page.tsx"));
      c.expect(/const kesiapanMapel = simpul \? await kesiapanPerMapel\(simpul\) : null;/.test(hal) && /kesiapanMapel=\{kesiapanMapel\}/.test(hal)
        && /c\.rpc\("kesiapan_kelas_per_mapel", \{ p_node: node \}\)/.test(kode(baca(ctx.repoRoot, "src/lib/pimpinan.ts"))), "Ringkasan Sekolah does not ask kesiapan_kelas_per_mapel for its node");
      return c.verdict("renders «Kesiapan bukti» per subject (#18): «n dari m kelas cukup untuk ditafsirkan» over every class the subject is assigned to, the classes not "
        + "yet by how far («belum ada»; «sudah ada, belum cukup (4 dari 5 murid)»); the readiness by figure when unread; Ringkasan Sekolah asks for its node");
    },
  },
  {
    // KESETIAAN #21 (H30): the several-classes cards say how many are not included, by one reason each
    id: "AKTIVASI-KECUALI-01",
    run: async (ctx) => {
      const c = new Checks();
      const r = render(ctx.repoRoot,
        'const m = await import("file://" + process.cwd() + "/src/components/aktivasi/kelas.ts");' +
        "const f = m.jumlahDikecualikan ?? m.default?.jumlahDikecualikan;" +
        "process.stdout.write(JSON.stringify([f([{ id: 'a', label: 'A', jumlah: 3, dikecualikan: { AKUN: 2, PENDATAAN: 1 } }, { id: 'b', label: 'B', jumlah: 1, dikecualikan: { STAF: 1, AKUN: 1 } }]), f([])]));");
      if (c.expect(r.ok, `the sum could not be run: ${r.err}`)) {
        let x: unknown[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        c.expect(JSON.stringify(x[0]) === JSON.stringify({ AKUN: 3, STAF: 1, PENDATAAN: 1 }) && JSON.stringify(x[1]) === JSON.stringify({ AKUN: 0, STAF: 0, PENDATAAN: 0 }),
          `the chosen classes' exclusions are not summed per reason: ${r.out}`);
      }
      const form = kode(baca(ctx.repoRoot, "src/components/aktivasi/FormAktivasi.tsx"));
      c.expect(/const terbaca = kelasBanyak\.length > 0 && kelasBanyak\.every\(\(k\) => k\.dikecualikan !== undefined\);/.test(form)
        && /\{terbaca && bagianKecuali\.length > 0 \? \(/.test(form) && /daftarKata\(bagianKecuali, locale\)/.test(form), "the form draws a count it did not read, or not as a sentence");
      const hal = kode(baca(ctx.repoRoot, "src/app/aktivasi/page.tsx"));
      c.expect(/supabase\.rpc\("kelas_dikecualikan_kartu", \{ p_classes: kelasTawar\.map\(\(k\) => k\.id\) \}\)/.test(hal) && /dikecualikan: Array\.isArray\(data\) \? \{\} : undefined/.test(hal),
        "Aktivasi does not ask kelas_dikecualikan_kartu for the classes it offers, or guesses on an unread answer");
      for (const [k, re] of [["akun", /yang sudah punya akun/], ["staf", /yang memegang peran staf/], ["pendataan", /masih menunggu di Pendataan/]] as const) {
        c.expect(re.test(t(`aktivasi.kelas.banyak.${k}` as HleEvent, "staff", { locale: "id" })) && !t(`aktivasi.kelas.banyak.${k}` as HleEvent, "staff", { locale: "en" }).startsWith("aktivasi."),
          `aktivasi.kelas.banyak.${k} does not name its reason in both languages`);
      }
      return c.verdict("the several-classes cards (#21): the chosen classes' exclusions summed per reason (AKUN, STAF, PENDATAAN, one reason each) and said as one "
        + "sentence («Tidak termasuk: …»), only when the database answered for every chosen class; Aktivasi asks kelas_dikecualikan_kartu for the classes it offers");
    },
  },
  {
    // KESETIAAN #3 (G-01, G-05): a report on paper — wordmark, report · place · period, page counter, blocks on white
    id: "LAPORAN-CETAK-01",
    run: async (ctx) => {
      const c = new Checks();
      const css = baca(ctx.repoRoot, "src/app/experience.css");
      const halaman = (n: string) => css.match(new RegExp(`@page ${n} \\{[\\s\\S]*?\\n\\}`))?.[0] ?? "";
      for (const n of ["laporan", "laporan-lebar"]) {
        const h = halaman(n);
        c.expect(/@top-left \{ content: "PINTAR";[^}]*color: var\(--merek-warna\)/.test(h) && /@bottom-right \{ content: "Halaman " counter\(page\) " dari " counter\(pages\)/.test(h)
          && /@top-right \{ font:/.test(h), `@page ${n} does not carry the wordmark, the header line's type and «Halaman n dari m»`);
      }
      c.expect(/size: A4 portrait/.test(halaman("laporan")) && /size: A4 landscape/.test(halaman("laporan-lebar")), "the report pages are not A4 (portrait; landscape for a wide grid)");
      c.expect(/body:has\(\.pin-lk\) \{ page: laporan; background: var\(--surface-1\) !important; \}/.test(css)
        && /\.pin-lk, \.pin-lk-bagian, \.pin-lk-inti, \.pin-lk-gambar \{ display: block; \}/.test(css) && /\.pin-lk-h \+ \* \{ break-before: avoid; \}/.test(css)
        && /\.pin-lk-gambar, \.pin-lk-pita, \.pin-lk-kelompok \{ break-inside: avoid; \}/.test(css), "a report does not print as blocks on white with each heading kept with its chart");
      c.expect(/\[data-kisi-lebar\] \{ page: laporan-lebar; \}/.test(css) && /\.pin-lk-kisi-tabel thead th, \.pin-lk-kisi-tabel \.pin-lk-bawah \{ white-space: nowrap; \}/.test(css)
        && /\.pin-lk-kisi-tabel \.pin-lk-kol-nama \{ width: var\(--lk-kolom-nama\); \}/.test(css), "the grid does not print with a fixed name column, whole words, or a landscape page when wide (#15)");
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KepalaCetak.tsx");' +
        "const K = m.default?.default ?? m.default;" +
        "process.stdout.write(renderToStaticMarkup(h(K, { bagian: JSON.parse(process.env.BAGIAN) })));", { BAGIAN: JSON.stringify(["Ringkasan Kelas", "Kelas 7A", null, 'TA 2026/2027 "</style>']) });
      if (c.expect(r.ok, `KepalaCetak could not be rendered: ${r.err}`)) {
        const harap = String.raw`@page laporan { @top-right { content: "Ringkasan Kelas · Kelas 7A · TA 2026/2027 \"\3C /style>"; } }`;
        c.expect(r.out.includes(harap) && r.out.includes("@page laporan-lebar") && r.out.split("</style>").length === 2,
          `the header line is not one escaped CSS string: ${r.out.slice(0, 240)}`);
      }
      for (const [f, re] of [
        ["src/app/edukator/ringkasan/page.tsx", /<KepalaCetak bagian=\{\[judul, kepala\?\.tempat, kepala\?\.sekolah, kepala\?\.periode\]\} \/>/],
        ["src/app/dekan/ringkasan/page.tsx", /<KepalaCetak bagian=\{\[judul, kepala\?\.sekolah, kepala\?\.periode\]\} \/>/],
        ["src/app/pimpinan/page.tsx", /<KepalaCetak bagian=\{\[s\("pimpinan\.judul"\), dipilih\.nama\]\} \/>/],
      ] as Array<[string, RegExp]>) {
        c.expect(re.test(kode(baca(ctx.repoRoot, f))), `${f} does not write its report · place · period into the A4 header`);
      }
      return c.verdict("the reports print on A4 (KESETIAAN #3): the PINTAR wordmark in the brand teal, the report · place · period line each report page writes (escaped as "
        + "one CSS string), «Halaman n dari m»; the body as blocks on white, a heading kept with its chart, a chart never split; the wide grid on a landscape page with a "
        + "fixed name column and whole words (#15)");
    },
  },
  {
    // KESETIAAN #26, #27 (E2 §1.1): the chooser's head is the wordmark; the reason is an info alert; «choose a place» names the doors
    id: "PEMILIH-KESETIAAN-01",
    run: async (ctx) => {
      const c = new Checks();
      const src = kode(baca(ctx.repoRoot, "src/app/page.tsx"));
      c.expect((src.match(/<p className="pin-pemilih-merek"><MerekPintar \/><\/p>/g) ?? []).length === 2 && !/s\("app\.name"\)/.test(src),
        "the chooser's head line is not the wordmark, signed in and signed out");
      c.expect(/\{alasan \? \(\s*<div className="pin-banner pin-info mt-4" role="status">\s*<Ikon nama="info" \/>\s*<p>\{alasan\}<\/p>/.test(src)
        && /const alasan = minta\.alasan === "tidak_dipegang" \? istilah\("context\.not_held"\)/.test(src) && !/role="status">\{kalimat\}/.test(src),
        "the reason is not an info alert above the doors");
      c.expect(/\{pilihTempat \? <h2 id="pin-pilih-tempat"[^>]*>\{pilihTempat\}<\/h2> : null\}/.test(src)
        && /aria-labelledby=\{pilihTempat \? "pin-pilih-tempat" : undefined\}/.test(src), "«choose a place» is not the heading that names the door list");
      return c.verdict("the chooser (src/app/page.tsx, from the source) heads with the PINTAR wordmark signed in and out; why the reader was sent is an info alert above "
        + "the doors; «choose a place» is an h2 naming the door list (aria-labelledby); both still draw nothing until their words arrive (D-132(m))");
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
        { id: "7a", nama: "7A", target: 0.75, topik: topik([["p", "Pecahan campuran", 0.57], ["s", "Pecahan senilai", 0.87]]),
          populasi: { placed: 32, assessed: 29 }, kenaikan: { status: "ok", metric_id: "class.net_gain", value: 0.2 } },
        { id: "7b", nama: "7B", target: 0.75, topik: topik([["p", "Pecahan campuran", 0.62], ["s", "Pecahan senilai", 0.9]]) },
        { id: "7c", nama: "7C", target: 0.7, topik: topik([["p", "Pecahan campuran", 0.81], ["s", "Pecahan senilai", 0.696]]) },
        { id: "7d", nama: "7D", target: null, topik: topik([["p", "Pecahan campuran", 0.5]]) },
        { id: "7e", nama: "7E", target: 0.75, topik: { status: "below_minimum", metric_id: "class.topic_mastery", readiness: "INSUFFICIENT_EVIDENCE", have: 2, needed: 5 } },
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
        // KESETIAAN #13: a class without enough evidence says so once, in its header («Sekarang 2 murid; perlu 5.»), no target there, «—» in its cells
        const kepala7e = html.slice(html.indexOf('data-kisi-kelas="7e"'), html.indexOf("</th>", html.indexOf('data-kisi-kelas="7e"')));
        c.expect(/data-kisi-belum="">Sekarang 2 murid; perlu 5\.</.test(kepala7e) && !/Target/.test(kepala7e) && !/Belum cukup bukti/.test(teks),
          `a class without enough evidence is not said once in its header: ${kepala7e.slice(0, 200)}`);
        // KESETIAAN #14: the class's base under its name, and the Kenaikan row at the foot
        c.expect(/data-kisi-dasar="">29 dari 32 murid</.test(html) && /<tfoot><tr data-kisi-kenaikan=""><th scope="row">Kenaikan<\/th><td><b>\+20 poin<\/b><\/td>/.test(html),
          "the class's base or the Kenaikan row is missing");
        // KESETIAAN #1, #4: the lead's list said as a sentence; the section lettered and read
        c.expect(/<span class="pin-lk-huruf"><span class="pin-sr">Bagian <\/span>A<\/span>/.test(html) && /data-kisi-lebar=""/.test(html) === false, "the grid's letter is not read, or six classes print landscape");
        // cells: below the class's own target amber and in words; R4-02 (69,6% against 70%); no target, no tick and no verdict
        c.expect((html.match(/data-bawah=""/g) ?? []).length === 3 && (html.match(/class="pin-lk-bawah">di bawah target</g) ?? []).length === 3,
          "a cell below its class's target is not marked in words and amber (expected 7A, 7B Pecahan campuran and 7C Pecahan senilai)");
        c.expect(teks.includes("69,6%") && teks.includes("57%") && (html.match(/<u /g) ?? []).length === 6, "R4-02 or the target ticks are wrong");
        c.expect(/<table[\s\S]*<th scope="col" class="pin-lk-kol-nama">Topik<\/th>[\s\S]*<th scope="row">Pecahan campuran<\/th>/.test(html), "the grid is not a table with row and column headers (its own text equivalent)");
        // RB1-C1 (journey, 7 Nov, axe scrollable-region-focusable at 320 px): the sideways-scrolling grid is a focusable, named region
        c.expect(/<div class="pin-lk-kisi-wadah" role="region" tabindex="0" aria-labelledby="pin-kisi">/.test(html), "the scrolling grid cannot be reached by keyboard");
      }
      const hal = kode(baca(ctx.repoRoot, "src/app/pimpinan/page.tsx"));
      const lib = kode(baca(ctx.repoRoot, "src/lib/pimpinan.ts"));
      c.expect(/const kolomKisi: KolomKisi\[\] = perKelas\.map\(/.test(hal) && /<KisiTopik huruf=\{huruf\(\)\} kolom=\{kolomKisi\}/.test(hal)
        && /e\.metric_id === "class\.readiness_distribution"\)\?\.population/.test(hal) && /e\.metric_id === "class\.net_gain"/.test(hal)
        && /minta\("class\.topic_mastery", k\.id\)/.test(lib) && /targetKelasDari\(c, k\.id\)/.test(lib),
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
        // KESETIAAN #17, #1: the lead says the Kenaikan and the domains in «Perlu penguatan» as a sentence; the sub line counts the rest
        c.expect(t1.includes("Kenaikan penguasaan rata-rata sejak Pemetaan Awal: +19 poin. Listrik dan magnet serta Geometri dan pengukuran masih di pita «Perlu penguatan».")
          && /1 dari 3 ranah berada di pita «Berkembang» atau «Mantap»\./.test(t1), `the lead reads «${t1.slice(0, 260)}»`);
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
        // KESETIAAN #2, #4, #18: no advice line; every letter read aloud; «Kesiapan bukti» drawn as a section of its own
        c.expect(/>A<[\s\S]*>B<[\s\S]*>C<[\s\S]*>D</.test(isi) && !/data-lk-tindakan/.test(isi) && !/aria-hidden="true">[A-F]</.test(isi)
          && /<span class="pin-sr">Bagian <\/span>A</.test(isi), "the sections are not lettered and read, or an advice line is drawn");
        c.expect(/data-lk="kesiapan"[\s\S]*?<h2 class="pin-lk-h" id="pin-kesiapan">[\s\S]*?Kesiapan bukti/.test(isi), "«Kesiapan bukti» is not a section of the school report");
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

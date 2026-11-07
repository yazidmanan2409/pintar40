/**
 * W9, the report pages (J7.3, J7.4) -- A FIGURE AS A READER READS IT, ROWS INCLUDED.
 *
 * The dean's and the class report printed a figure's raw value («0.75»), a
 * distribution's raw fractions, a cohort row with nothing in it and a
 * competency row with no score; /pimpinan showed a list of competencies as a
 * count of them (journey cross-check W9; REP-J06, HOD-J03). This renders the
 * one renderer the three surfaces now share with each kind of figure, and
 * checks they are wired to it.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const KASUS = [
  { metric_id: "class.comprehension", value: 0.75 },
  { metric_id: "institution.net_gain", value: 0.35 },
  // D-088(g), MC-4: one row per objective, named by its statement
  { metric_id: "class.topic_mastery", value: [
    { objective_id: "o1", code: "B1P1", competency: "Nilai tempat", mean_score: 0.8, learners: 5 },
    { objective_id: "o2", code: "B1P2", competency: "Membandingkan", mean_score: 0.625, learners: 4 }] },
  { metric_id: "class.readiness_distribution", value: { "kesiapan.siap": 3, "kesiapan.berkembang": 2 } },
  { metric_id: "institution.cohort_comparison", value: [{ cohort_node_id: "c1", learners: 5, mean_mastery: 0.75 }] },
  { metric_id: "institution.competency_outcomes", value: [{ objective_id: "o1", code: "B1P1", competency: "Nilai tempat", mean_score: 0.8, learners: 5 }] },
  { metric_id: "class.misconceptions", value: [{ code: "SD5-M-B1-01", label: "Nilai tempat tertukar", remediation: "Ulangi halaman 3." }] },
].map((e) => ({ status: "ok", ...e }));

export const w9bTests: SelfTest[] = [
  {
    id: "W9-K02",
    run: async (ctx) => {
      const c = new Checks();
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/bukti/NilaiLaporan.tsx");' +
        "  const N = m.default?.default ?? m.default;" +
        "  const kasus = JSON.parse(process.env.W9_KASUS);" +
        "  process.stdout.write(JSON.stringify(['id', 'en'].map((locale) => kasus.map((entry) => renderToStaticMarkup(h(N, { entry, locale, tempat: { c1: 'Kelas Rendah · Tingkat 1 · 2026/2027' } }))))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: ctx.repoRoot, encoding: "utf8", env: { ...process.env, W9_KASUS: JSON.stringify(KASUS) },
      });
      let html: string[][] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === 2, `the report figures could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const teks = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const [paham, naik, topik, siap, kohort, kompetensi, keliru] = html[0].map(teks);
        c.expect(paham === "75%", `comprehension 0.75 reads «${paham}»`);
        c.expect(naik === "+35 poin", `a net gain of 0.35 reads «${naik}»; «Lihat bukti» says +35 poin`);
        c.expect(/Nilai tempat 80%/.test(topik) && /Membandingkan 63%/.test(topik), `topic mastery reads «${topik}»`);
        c.expect(/3/.test(siap) && /2/.test(siap) && !/kesiapan\./.test(siap), `the readiness distribution reads «${siap}» (a tier key or no count)`);
        c.expect(/Kelas Rendah · Tingkat 1 · 2026\/2027/.test(kohort) && /75%/.test(kohort) && /5 murid/.test(kohort),
          `a cohort row reads «${kohort}»; expected its place's name, mean mastery and learners`);
        c.expect(/Nilai tempat/.test(kompetensi) && /80%/.test(kompetensi) && /5 murid/.test(kompetensi), `a competency row reads «${kompetensi}»; expected its score and learners`);
        c.expect(/Nilai tempat tertukar/.test(keliru) && /Ulangi halaman 3/.test(keliru), `a misconception row reads «${keliru}»`);
        for (const [i, l] of (["id", "en"] as const).entries()) {
          const semua = html[i].map(teks).join(" | ");
          c.expect(!/(?<![\d.,])0[.,]\d{2,}(?!\d)/.test(semua), `(${l}) a raw decimal reaches the report: ${semua.slice(0, 300)}`);
        }
        c.expect(/\+35 points/.test(teks(html[1][1])) && /5 learners/.test(teks(html[1][4])), "the English report is not in English units");
      }

      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/\{\s*\}/g, "");
      const baca = (...p: string[]) => buang(readFileSync(join(ctx.repoRoot, ...p), "utf8"));
      for (const p of [["src", "app", "dekan", "ringkasan", "page.tsx"], ["src", "app", "edukator", "ringkasan", "page.tsx"]]) {
        // CONTOH LAPORAN (approved 7 Nov): the class report's body is its composition (KomposisiKelas); the page still names the places
        const src = baca(...p) + baca("src", "components", "laporan", p[2] === "edukator" ? "KomposisiKelas.tsx" : "KomposisiSekolah.tsx");
        c.expect(/<NilaiLaporan entry=\{e\} locale=\{locale\} tempat=\{tempat\} persona=(\{untuk\}|"staff") \/>/ /* RESTATED FOR H24: in the reader's words */.test(src) && !/function Value\(/.test(src) && /await namaTempat\(/.test(src),
          `${p.join("/")} still draws a figure by itself, or does not name the places its rows name`);
      }
      for (const p of [["src", "app", "pimpinan", "page.tsx"], ["src", "app", "pimpinan", "[simpul]", "page.tsx"]]) {
        const src = baca(...p);
        c.expect(/rincian=\{berstruktur\(e\.value\) \? <NilaiLaporan entry=\{e\} locale=\{locale\} persona="staff" \/> : undefined\}/.test(src),
          `${p.join("/")} still shows a structured figure as a count of its rows`);
      }
      c.expect(/\{rincian \?\? <span className="pin-mv pin-num">\{value\}<\/span>\}/.test(baca("src", "components", "pimpinan", "AngkaTerkelola.tsx")),
        "the management figure does not draw a structured figure's rows in place of one number");

      return c.verdict(
        "NilaiLaporan (rendered output, id and en): comprehension 0.75 reads 75%; a net gain of 0.35 reads +35 poin / " +
          "+35 points; topic mastery per topic as percentages; a readiness distribution as counts beside tier names, " +
          "never tier keys; a cohort row by its place's name with mean mastery and learners; a competency row with score " +
          "and learners; a misconception row with its remediation; no raw decimal in either language. The source of both " +
          "report pages draws every figure through it and names the places their rows name; /pimpinan and its class pages " +
          "draw a structured figure's rows in place of a count",
      );
    },
  },
];

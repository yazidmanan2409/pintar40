/**
 * Owner decisions 7 and 8 and Daisy's re-verification of 94160304 (N1–N4, the three further states, Temuan), on the
 * RENDERED components where a component draws the state, and on the source where the state is a page's choice.
 *
 *   D78-P01  A figure WITHHELD to protect a smaller part (the evaluator's `withheld`) reads as withheld, with every
 *            learner who sat, and never as «no evidence» or «Sekarang 0 murid» (decision 7, N2); Kenaikan's pair
 *            withheld says so; misconception patterns withheld are said with their count and minimum.
 *   D78-K01  N4: the grid's meaning line and key say only what is drawn, for every class's target, some, and none.
 *   D78-N03  N3: wherever a lesson's short title stands for an objective, its statement is on its own line under it
 *            (Lihat bukti, the grid, Ringkasan Sekolah A), and the school counts learning objectives, not «ranah».
 *   D78-N01  N1: «Lihat bukti» says the educator-decision line once.
 *   D78-S01  The chapter result never says «every important question was right» when the check had none; Pimpinan's
 *            class summary says «Ada angka» only for a performance figure; a count-and-link keeps its space; a Temuan
 *            panel in a list keeps its box.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function render(root: string, skrip: string, env: Record<string, string> = {}, server = false) {
  // a server-only module (src/lib/pengajar.ts) loads under the React server condition, as app.test.ts loads card.ts
  const anak = spawnSync(process.execPath, [...(server ? ["--conditions=react-server"] : []), "--import", "tsx", "-e",
    `(async () => {${skrip}})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`],
  { cwd: root, encoding: "utf8", env: { ...process.env, ...env } });
  return { ok: anak.status === 0, out: anak.stdout, err: (anak.stderr || "").split("\n").slice(0, 3).join(" ") };
}

export const d78Tests: SelfTest[] = [
  {
    id: "D78-P01",
    run: async (ctx) => {
      const c = new Checks();
      // the envelopes metric_evaluate gives (F36-P01 runs it): Pemahaman withheld with 8 learners; Pemahaman below the
      // minimum with 4; Kenaikan ok; misconceptions ok with one pattern shown and two withheld
      const dilindungi = { status: "below_minimum", metric_id: "class.comprehension", label_key: "metrik.pemahaman.label", readiness: "NOT_YET_EVALUABLE",
        statement_key: "laporan.metrik.dilindungi", have: 8, needed: 5, withheld: { reason: "subgroup", needed: 5, chapters: 2 } };
      const kurang = { status: "below_minimum", metric_id: "class.comprehension", label_key: "metrik.pemahaman.label", readiness: "INSUFFICIENT_EVIDENCE",
        statement_key: "laporan.metrik.belum_cukup_data", have: 4, needed: 5 };
      const naik = { status: "ok", metric_id: "class.net_gain", label_key: "metrik.kenaikan.label", value: 0.2667, sample: 9 };
      const keliru = { status: "ok", metric_id: "class.misconceptions", label_key: "metrik.miskonsepsi.label", meaning_key: "metrik.miskonsepsi.arti",
        value: [{ code: "M1", label: "Mengira pecahan lebih besar bila penyebutnya besar", remediation: null, occurrences: 5 }], sample: 6,
        withheld: { reason: "patterns", count: 2, needed: 5 } };
      const kosong = { ...keliru, value: [], withheld: { reason: "patterns", count: 1, needed: 5 } };
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const k = await import("file://" + process.cwd() + "/src/components/bukti/KartuKetiadaan.tsx");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiKelas.tsx");' +
        "const Kartu = k.default?.default ?? k.default; const K = m.default?.default ?? m.default;" +
        "const [dl, ku, nk, kl, ks] = JSON.parse(process.env.ENTRI);" +
        "const p = { locale: 'id', persona: 'educator', jenis: 'LEARNER', namaKelas: 'Kelas 7A', buktiHref: '/b', target: 0.75, titik: null };" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(Kartu, { entry: dl, locale: 'id' })), renderToStaticMarkup(h(Kartu, { entry: ku, locale: 'id' }))," +
        " renderToStaticMarkup(h(Kartu, { entry: dl, locale: 'en' }))," +
        " renderToStaticMarkup(h(K, { ...p, entries: [nk, kl], awalAkhir: 'DILINDUNGI' })), renderToStaticMarkup(h(K, { ...p, entries: [nk, ks], awalAkhir: 'TIDAK' }))]));",
        { ENTRI: JSON.stringify([dilindungi, kurang, naik, keliru, kosong]) });
      if (c.expect(r.ok, `could not render: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const [dl, ku, dlEn, kls, kos] = x.map(teks);
        c.expect(dl.includes("Angka gabungan ini tidak ditampilkan") && dl.includes("Sudah 8 murid mengerjakan Uji Penguasaan; ada bab yang baru dikerjakan kurang dari 5 murid.")
          && dl.includes("setiap bab dikerjakan cukup murid"), `a withheld figure does not say it is withheld with its 8 learners: «${dl}»`);
        c.expect(!/Belum ada bukti|Sekarang 0|Sekarang 8|0%/.test(dl), `a withheld figure reads as no evidence, a zero or «not enough students»: «${dl}»`);
        c.expect(ku.includes("Belum cukup data") && ku.includes("Sekarang 4 murid; perlu 5."), `four learners under the minimum are not «belum cukup» with 4: «${ku}»`);
        c.expect(dlEn.includes("This combined figure is not shown") && dlEn.includes("8 students have taken the Mastery Check"), `the English withheld card: «${dlEn}»`);
        c.expect(kls.includes("Rata-rata sebelum dan sesudah tidak ditampilkan") && !/→/.test(kls), `a withheld before → after pair is drawn or unsaid: «${kls.slice(0, 400)}»`);
        c.expect(kls.includes("2 pola lain baru dialami kurang dari 5 murid, jadi belum ditampilkan sebagai pola kelas."), "withheld misconception patterns are not said with their count and minimum");
        c.expect(kos.includes("Belum ada pola jawaban keliru yang dialami cukup banyak murid") && kos.includes("1 pola lain baru dialami kurang dari 5 murid"),
          `a class whose every pattern is withheld does not say so: «${kos.slice(0, 400)}»`);
        c.expect(kos.includes("Rata-rata sebelum dan sesudah belum dapat dibandingkan."), "no pair at all is no longer «belum dapat dibandingkan»");
      }
      const bukti = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/bukti/page.tsx"));
      c.expect(/keliru\.withheld\?\.reason === "patterns"/.test(bukti) && /laporan\.komposisi\.keliru_belum/.test(bukti),
        "«Lihat bukti» does not say withheld or absent misconception patterns");
      return c.verdict("the rendered KartuKetiadaan and KomposisiKelas output: a withheld «Pemahaman» says it is withheld with its 8 learners (id and en), " +
        "never «belum ada bukti», a zero or «Sekarang 0»; 4 learners are «belum cukup data» with 4; Kenaikan's withheld pair is said, not drawn; withheld " +
        "misconception patterns are said with their count and minimum, also when none is shown, here and in the source of «Lihat bukti»");
    },
  },
  {
    id: "D78-K01",
    run: async (ctx) => {
      const c = new Checks();
      const topik = (v: number) => ({ status: "ok", metric_id: "class.topic_mastery", label_key: "metrik.topik.label",
        value: [{ objective_id: "o1", competency: "Menentukan selisih dan melanjutkan pola bilangan.", title: "Mengenal Pola Bertambah", mean_score: v, learners: 25 }] });
      const kolom = (t1: number | null, t2: number | null) => [{ id: "a", nama: "5A", target: t1, topik: topik(0.5) }, { id: "b", nama: "5B", target: t2, topik: topik(0.8) }];
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KisiTopik.tsx");' +
        "const K = m.default?.default ?? m.default; const ks = JSON.parse(process.env.KOLOM);" +
        "process.stdout.write(JSON.stringify(ks.map((k) => renderToStaticMarkup(h(K, { kolom: k, locale: 'id' })))));",
        { KOLOM: JSON.stringify([kolom(0.7, 0.7), kolom(0.7, null), kolom(null, null)]) });
      if (c.expect(r.ok, `the grid could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const [semua, sebagian, tanpa] = x;
        c.expect(/data-kisi-arti="laporan.kisi.arti"/.test(semua) && /data-kisi-kunci="laporan.kisi.kunci"/.test(semua) && teks(semua).includes("terhadap target kelas itu."),
          "with every class's target the grid does not say it compares with it");
        c.expect(/data-kisi-arti="laporan.kisi.arti_sebagian"/.test(sebagian) && teks(sebagian).includes("hanya di kelas yang targetnya dapat dibaca"),
          "with one class's target the grid does not say the comparison is partial");
        c.expect(/data-kisi-arti="laporan.kisi.arti_tanpa_target"/.test(tanpa) && !teks(tanpa).includes("terhadap target") && !teks(tanpa).includes("Garis tegak")
          && teks(tanpa).includes("Belum ada target kelas yang dapat dibaca di sini") && !/<u /.test(tanpa) && !/data-bawah/.test(tanpa),
          `with no readable target the grid still implies a comparison, explains marks it does not draw, or draws them: «${teks(tanpa).slice(0, 400)}»`);
        c.expect(teks(semua).includes("Mengenal Pola Bertambah Menentukan selisih dan melanjutkan pola bilangan."), "the grid's short title stands without its objective's statement (N3)");
      }
      return c.verdict("the rendered KisiTopik output: the meaning line and key are «against that class's target» only where every class's target is " +
        "drawn, partial where some are, and with none they imply no comparison, explain no line and draw no line or amber; a short title keeps its statement");
    },
  },
  {
    id: "D78-N03",
    run: async (ctx) => {
      const c = new Checks();
      const komp = { status: "ok", metric_id: "institution.competency_outcomes", label_key: "metrik.kompetensi.label", sample: 30,
        value: [{ objective_id: "o1", competency: "Membaca, membandingkan dan menjumlahkan data dalam tabel.", title: "Membaca Tabel Data", mean_score: 0.7, learners: 30, needed: 10 },
                { objective_id: "o2", competency: "Pecahan senilai.", title: null, mean_score: 0.5, learners: 12, needed: 10 },
                { objective_id: "o3", competency: "Pola.", title: "Pola", mean_score: null, learners: 15, needed: 10 }] };
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiSekolah.tsx");' +
        "const K = m.default?.default ?? m.default;" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { entries: [JSON.parse(process.env.E)], locale: 'id' })), renderToStaticMarkup(h(K, { entries: [JSON.parse(process.env.E)], locale: 'en' }))]));",
        { E: JSON.stringify(komp) });
      if (c.expect(r.ok, `the school composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const [id, en] = x.map(teks);
        c.expect(id.includes("Membaca Tabel Data Membaca, membandingkan dan menjumlahkan data dalam tabel."), `a short title stands without its statement: «${id.slice(0, 400)}»`);
        c.expect(!/\branah\b/.test(id) && id.includes("tujuan pembelajaran"), `the school counts «ranah» where its rows are learning objectives: «${id.slice(0, 400)}»`);
        c.expect(id.includes("1 tujuan pembelajaran lain belum ditampilkan") && id.includes("di salah satu kelas"), "a withheld row's sentence omits the class-cell reason");
        c.expect(!/\bdomains?\b/.test(en) && en.includes("learning objective"), `the English page counts «domains»: «${en.slice(0, 300)}»`);
      }
      // every row withheld (one small class in each): the section says so, never stands empty
      const semua = { ...komp, value: komp.value.map((d) => ({ ...d, mean_score: null })) };
      const r2 = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiSekolah.tsx");' +
        "const K = m.default?.default ?? m.default;" +
        "process.stdout.write(renderToStaticMarkup(h(K, { entries: [JSON.parse(process.env.E)], locale: 'id' })));",
        { E: JSON.stringify(semua) });
      c.expect(r2.ok && teks(r2.out).includes("Sudah ada hasil untuk 3 tujuan pembelajaran, tetapi belum ada yang dapat ditampilkan"),
        `with every competency withheld, section A is empty or silent: «${teks(r2.out).slice(0, 300)}»`);
      const bukti = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/bukti/page.tsx"));
      c.expect(/pernyataan=\{b\.title && b\.title\.trim\(\) !== "" && b\.title\.trim\(\) !== b\.competency\.trim\(\) \? b\.competency : undefined\}/.test(bukti),
        "«Lihat bukti» «Penguasaan per bagian» shows a short title without its statement");
      c.expect(/mengajar\.bukti\.bagian_tertahan/.test(bukti) && !/laporan\.sekolah\.ranah_tertahan/.test(bukti), "«Lihat bukti» says a class's withheld topics in the school's words");
      const baris = kode(baca(ctx.repoRoot, "src/components/bukti/BarisKesiapan.tsx"));
      c.expect(/pernyataan \? <span className="pin-lk-pernyataan">\{pernyataan\}<\/span> : null/.test(baris), "BarisKesiapan does not draw the statement line");
      return c.verdict("the rendered KomposisiSekolah output (id, en) and the source of «Lihat bukti» and BarisKesiapan: a short title keeps its " +
        "objective's statement on its own line; the school counts learning objectives, never «ranah» or «domains»; a withheld row's sentence names both reasons");
    },
  },
  {
    id: "D78-N01",
    run: async (ctx) => {
      const c = new Checks();
      const bukti = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/bukti/page.tsx"));
      c.expect((bukti.match(/laporan\.anda_memutuskan/g) ?? []).length === 1, "«Lihat bukti» does not say the educator-decision line exactly once");
      return c.verdict("the source of «Lihat bukti» says «PINTAR menunjukkan; langkah berikutnya Anda yang memutuskan.» once for the page (O1, N1)");
    },
  },
  {
    id: "D78-S01",
    run: async (ctx) => {
      const c = new Checks();
      const hasil = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx"));
      c.expect(/const wajib = review\.filter\(\(r\) => r\.is_safety_critical\)\.length;/.test(hasil)
        && /wajib === 0 \? "tidak_ada" : "ok"/.test(hasil) && /review\.length === 0 \? null/.test(hasil) && /hasil\.safety\.tidak_ada/.test(hasil),
        "the chapter result can say «Semua soal penting sudah dijawab dengan tepat» over a check with no required question, or over unread items");
      const pim = kode(baca(ctx.repoRoot, "src/app/pimpinan/page.tsx"));
      c.expect(/const ada = bk\.filter\(\(e\) => e\.status === "ok" && e\.metric_id !== "class\.participants"\);/.test(pim) && /pimpinan\.kelas\.bukti_saja/.test(pim),
        "Pimpinan says «Ada angka» for a class whose only figure is its headcount");
      const css = baca(ctx.repoRoot, "src/app/experience.css");
      c.expect(/a\.pin-tautan \{ display: inline-flex; align-items: center; flex-wrap: wrap; column-gap: var\(--space-1\); \}/.test(css), "a count-and-link loses its space («1murid»)");
      c.expect(/\.pin-daftar li\.pin-panel \{ display: grid; \}/.test(css), "a Temuan panel in a list loses its box and padding");
      return c.verdict("the source of the chapter result, Pimpinan and experience.css: «every important question was right» only over required questions, " +
        "«none in this check» when there were none, nothing over unread items; «Ada angka» only for a performance figure, «evidence, no figure yet» " +
        "otherwise; a count-and-link keeps its gap and wraps; a list item that is a panel keeps its box");
    },
  },
  {
    id: "D78-E01",
    run: async (ctx) => {
      const c = new Checks();
      // owner decision E1: the teacher's record of a recomputed sitting, built by the pure susunCatatan from the envelope
      const r = render(ctx.repoRoot,
        'const m = await import("file://" + process.cwd() + "/src/lib/pengajar.ts");' +
        "const env = { status: 'ok', value: [{ session_id: 's1', mode: 'POST_TEST', mastery: 0.7, recomputed: true, sealed_mastery: 0.6 }," +
        " { session_id: 's2', mode: 'POST_TEST', mastery: 0.5, recomputed: false, sealed_mastery: null }] };" +
        "process.stdout.write(JSON.stringify(m.susunCatatan('p', [], [], env).daftarHasil));", {}, true);
      if (c.expect(r.ok, `susunCatatan could not run: ${r.err}`)) {
        let x: Array<{ sesi: string; dihitungUlang?: boolean; asli?: number | null; penguasaan: number | null }> = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const a = x.find((h) => h.sesi === "s1"), b = x.find((h) => h.sesi === "s2");
        c.expect(a?.dihitungUlang === true && a?.asli === 0.6 && a?.penguasaan === 0.7, `the recomputed sitting's record: ${JSON.stringify(a)}`);
        c.expect(b?.dihitungUlang === false && b?.asli === null, `a sitting never recomputed claims a sealed original: ${JSON.stringify(b)}`);
      }
      const hal = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/murid/[orang]/page.tsx"));
      c.expect(/h\.dihitungUlang && h\.asli !== null && h\.asli !== undefined && h\.penguasaan !== null && h\.asli !== h\.penguasaan/.test(hal)
        && /mengajar\.murid1\.dihitung_ulang/.test(hal), "the learner page does not explain a recomputed sitting, or explains one whose figures agree");
      // the owner's Kenaikan question: the figure is a mean over (learner, chapter) pairs, said as such, with both counts
      const naik = { status: "ok", metric_id: "class.net_gain", label_key: "metrik.kenaikan.label", meaning_key: "metrik.kenaikan.arti", value: 0.18, sample: 7, pairs: 10 };
      const r2 = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiKelas.tsx");' +
        "const K = m.default?.default ?? m.default;" +
        "process.stdout.write(renderToStaticMarkup(h(K, { locale: 'id', persona: 'educator', jenis: 'LEARNER', namaKelas: '5C', buktiHref: null, target: 0.7, titik: null, awalAkhir: null, entries: [JSON.parse(process.env.E)] })));",
        { E: JSON.stringify(naik) });
      if (c.expect(r2.ok, `the composition could not be rendered: ${r2.err}`)) {
        const t = teks(r2.out);
        c.expect(t.includes("Dihitung dari 10 pasangan Pemetaan Awal dan Uji Penguasaan bab yang sama, milik 7 murid.")
          && t.includes("dihitung per murid per bab: murid yang mengerjakan dua bab dihitung dua kali") && !/pembelajaran, per murid\./.test(t),
          `Kenaikan is described as a per-learner average, or without its pairs: «${t.slice(0, 400)}»`);
      }
      return c.verdict("the output of susunCatatan (src/lib/pengajar.ts), the source of the learner page and the rendered KomposisiKelas: a recomputed " +
        "sitting carries its sealed original and the page explains it only when the two differ; Kenaikan says it is a mean per student per chapter " +
        "(a student with two chapters counts twice) and gives its pairs and its learners");
    },
  },
];

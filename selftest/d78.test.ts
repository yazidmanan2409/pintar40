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
 *   D78-A01  D12, D13 and Daisy's A3–A7 (owner, 9 Nov): denominators of topics with a figure, «not applicable», one
 *            explanation per withheld figure, the stacked grid, English terms, screen-reader order, the learner's notice.
 *   D78-B01  Daisy on e8a5efb9: the learner's sealed count (B3), the gate below its minimum (B1), the page's own
 *            section (B2), «1 learner» (A4).
 *   D78-E01  E1 and D14: the recalculation note, rendered, under the figure, with its reason; Kenaikan's pairs.
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
          // restated to Daisy's A7 (owner, 9 Nov): the withheld figure is explained ONCE, by its actual reason; the second
          // «it appears once every chapter…» line, which pointed to a section not always shown, is gone
          && !dl.includes("setiap bab dikerjakan cukup murid") && !dl.includes("«Per bab»"), `a withheld figure does not say it is withheld with its 8 learners, or says it twice: «${dl}»`);
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
                { objective_id: "o3", competency: "Pola.", title: "Pola", mean_score: null, learners: 15, needed: 10, withheld: "class" },
                // Sharon (e8a5efb9): withheld only for a learner who moved class and re-sat
                { objective_id: "o4", competency: "Bangun datar.", title: null, mean_score: null, learners: 14, needed: 10, withheld: "moved" }] };
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
        // restated to Daisy's A5 (owner, 9 Nov): the row's own reason, never «this or that»
        c.expect(id.includes("1 tujuan pembelajaran lain belum ditampilkan karena di salah satu kelas") && !id.includes("kurang dari 10 murid, atau")
          && id.includes("1 tujuan pembelajaran lain belum ditampilkan karena ada murid yang pindah kelas lalu mengerjakannya lagi"),
          "a withheld row's sentence omits its class-cell reason, or still offers two reasons");
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
      c.expect(r2.ok && teks(r2.out).includes("Sudah ada hasil untuk 4 tujuan pembelajaran, tetapi belum ada yang dapat ditampilkan")
        // the walk (9 Nov): with none shown, the reasons are «of them», never «other» objectives
        && teks(r2.out).includes("2 di antaranya masing-masing dikerjakan kurang dari 10 murid.")
        && teks(r2.out).includes("1 di antaranya dikerjakan lagi oleh murid yang pindah kelas")
        && teks(r2.out).includes("1 di antaranya di salah satu kelas dikerjakan terlalu sedikit murid") && !teks(r2.out).includes("tujuan pembelajaran lain"),
        `with every competency withheld, section A is empty or silent: «${teks(r2.out).slice(0, 300)}»`);
      const bukti = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/bukti/page.tsx"));
      c.expect(/pernyataan=\{b\.title && b\.title\.trim\(\) !== "" && b\.title\.trim\(\) !== b\.competency\.trim\(\) \? b\.competency : undefined\}/.test(bukti),
        "«Lihat bukti» «Penguasaan per bagian» shows a short title without its statement");
      c.expect(/mengajar\.bukti\.bagian_tertahan/.test(bukti) && !/laporan\.sekolah\.ranah_tertahan/.test(bukti), "«Lihat bukti» says a class's withheld topics in the school's words");
      const baris = kode(baca(ctx.repoRoot, "src/components/bukti/BarisKesiapan.tsx"));
      c.expect(/pernyataan \? <span className="pin-lk-pernyataan">\{pernyataan\}<\/span> : null/.test(baris), "BarisKesiapan does not draw the statement line");
      return c.verdict("the rendered KomposisiSekolah output (id, en) and the source of «Lihat bukti» and BarisKesiapan: a short title keeps its " +
        "objective's statement on its own line; the school counts learning objectives, never «ranah» or «domains»; a withheld row's sentence names its own reason");
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
      c.expect(/a\.pin-tautan \{ display: inline-flex; align-items: center; column-gap: var\(--space-1\); \}/.test(css), "a count-and-link loses its space («1murid»), or wraps its count onto a line of its own");
      c.expect(/\.pin-daftar li\.pin-panel \{ display: grid; \}/.test(css), "a Temuan panel in a list loses its box and padding");
      return c.verdict("the source of the chapter result, Pimpinan and experience.css: «every important question was right» only over required questions, " +
        "«none in this check» when there were none, nothing over unread items; «Ada angka» only for a performance figure, «evidence, no figure yet» " +
        "otherwise; a count-and-link keeps its gap without putting its count on a line of its own; a list item that is a panel keeps its box");
    },
  },
  {
    id: "D78-A01",
    run: async (ctx) => {
      const c = new Checks();
      // D13: the class lead counts over the topics WITH a figure, names the others apart, and never says «every topic» while some are withheld
      const baris = (vs: Array<number | null>) => vs.map((v, i) => ({ objective_id: `o${i}`, competency: `Tujuan ${i}`, title: `Topik ${i}`, mean_score: v, learners: v === null ? 3 : 8 }));
      const topik = (vs: Array<number | null>) => ({ status: "ok", metric_id: "class.topic_mastery", label_key: "metrik.topik.label", value: baris(vs), sample: 8 });
      // A6: a chapter row below target
      const bab = { status: "ok", metric_id: "class.chapter_mastery", label_key: "metrik.bab.label", sample: 12,
        value: [{ plp_release_id: "r1", chapter: "Bab Satu", learners: 6, needed: 5, mean_mastery: 0.5 }, { plp_release_id: "r2", chapter: "Bab Dua", learners: 6, needed: 5, mean_mastery: 0.9 }] };
      const pita = { status: "ok", metric_id: "class.readiness_distribution", label_key: "metrik.kesiapan.label", meaning_key: "metrik.kesiapan.arti", sample: 12,
        value: { "kesiapan.butuh_pendampingan": 4, "kesiapan.siap_sertifikasi": 5, "kesiapan.perlu_review": 3 }, population: { placed: 12, assessed: 12, not_yet: 0 } };
      const r = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiKelas.tsx");' +
        "const K = m.default?.default ?? m.default; const es = JSON.parse(process.env.E);" +
        "const p = { locale: 'id', persona: 'educator', jenis: 'LEARNER', namaKelas: '5C', buktiHref: null, target: 0.7, titik: null, awalAkhir: null };" +
        "process.stdout.write(JSON.stringify(es.map((e, i) => renderToStaticMarkup(h(K, { ...p, entries: e, perBab: i === 4 ? JSON.parse(process.env.BAB) : null })))));",
        { BAB: JSON.stringify(bab), E: JSON.stringify([[topik([0.5, 0.8, 0.9, null, null])], [topik([0.8, 0.9, null])], [topik([null, null])], [topik([0.8, 0.9])], [pita]]) });
      if (c.expect(r.ok, `the class composition could not be rendered: ${r.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const [satuBawah, semuaTertampil, semuaTertahan, lengkap, babRow] = x.map(teks);
        c.expect(satuBawah.includes("1 dari 3 topik yang punya angka masih di bawah target: Topik 0.")
          && satuBawah.includes("2 topik lainnya belum dapat ditampilkan, jadi belum diketahui apakah sudah mencapai target.") && !satuBawah.includes("dari 5 topik"),
          `the lead counts withheld topics in its denominator, or does not name them: «${satuBawah.slice(0, 300)}»`);
        c.expect(semuaTertampil.includes("Ke-2 topik yang punya angka sudah mencapai target 70%.") && semuaTertampil.includes("1 topik lainnya belum dapat ditampilkan")
          && !semuaTertampil.includes("Semua topik sudah mencapai target"), `«every topic reached the target» while one is withheld: «${semuaTertampil.slice(0, 300)}»`);
        c.expect(semuaTertahan.includes("Sudah ada hasil untuk 2 topik, tetapi belum ada yang dapat ditampilkan.") && !/mencapai target 70%/.test(semuaTertahan),
          `with every topic withheld the lead implies a result: «${semuaTertahan.slice(0, 300)}»`);
        c.expect(lengkap.includes("Semua topik sudah mencapai target 70%.") && !lengkap.includes("belum dapat ditampilkan"), "with nothing withheld the lead changed");
        // A6: «below target» is read with the percentage, before the learners
        c.expect(/50%\s*\(di bawah target\)\s*·\s*6 murid/.test(babRow) && !/6 murid\s*di bawah target/.test(babRow),
          `a screen reader hears «below target» after the learners: «${babRow.slice(0, 300)}»`);
      }
      // D12: the school's safety gate, not applicable to any sitting, and shown with some sittings apart
      const tb = { status: "below_minimum", metric_id: "institution.safety_gate_pass_rate", label_key: "metrik.gerbang_keselamatan.label", readiness: "NOT_YET_EVALUABLE",
        statement_key: "laporan.metrik.tidak_berlaku", have: 0, needed: 10, withheld: { reason: "not_applicable", sittings: 12 } };
      const ada = { status: "ok", metric_id: "institution.safety_gate_pass_rate", label_key: "metrik.gerbang_keselamatan.label", meaning_key: "metrik.gerbang_keselamatan.arti",
        value: 0.7, sample: 10, sittings: 10, not_applicable: 12 };
      const r2 = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const k = await import("file://" + process.cwd() + "/src/components/bukti/KartuKetiadaan.tsx");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiSekolah.tsx");' +
        'const mu = await import("file://" + process.cwd() + "/src/components/bukti/muncul.ts");' +
        "const Kartu = k.default?.default ?? k.default; const K = m.default?.default ?? m.default; const [tb, ada] = JSON.parse(process.env.E);" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(Kartu, { entry: tb, locale: 'id', persona: 'staff' })), renderToStaticMarkup(h(K, { entries: [tb], locale: 'id' }))," +
        " renderToStaticMarkup(h(K, { entries: [ada], locale: 'id' })), (mu.kunciMuncul ?? mu.default?.kunciMuncul)(tb)," +
        " (mu.kunciMuncul ?? mu.default?.kunciMuncul)({ status: 'below_minimum', metric_id: 'class.comprehension', withheld: { reason: 'subgroup', needed: 5 } })]));",
        { E: JSON.stringify([tb, ada]) });
      if (c.expect(r2.ok, `the safety gate could not be rendered: ${r2.err}`)) {
        let x: Array<string | null> = [];
        try { x = JSON.parse(r2.out); } catch { /* reported below */ }
        const [kartu, sekolahTb, sekolahAda] = x.slice(0, 3).map((v) => teks(v ?? ""));
        for (const [nama, v] of [["the card", kartu], ["the school page", sekolahTb]] as const) {
          c.expect(v.includes("Tidak berlaku: Uji Penguasaan yang sudah dikerjakan di sini tidak memuat soal wajib") && !/Sekarang 0|100%|0%|Belum cukup data|Belum ada bukti/.test(v),
            `${nama}: a gate that applies to no sitting reads as a pass, a zero or «not enough»: «${v.slice(0, 300)}»`);
        }
        // Sharon (e8a5efb9): the count is of RESULTS (sittings), never read as so many different tests
        c.expect(sekolahAda.includes("Dari 10 hasil Uji Penguasaan yang memuat soal wajib, milik 10 murid.")
          && sekolahAda.includes("12 hasil Uji Penguasaan lain berasal dari uji tanpa soal wajib, jadi tidak dihitung, baik sebagai lulus maupun tidak."),
          `the shown gate does not give its applicable sittings, or hides the twelve apart: «${sekolahAda.slice(0, 400)}»`);
        // A7: a withheld figure has no second «it appears when…» line
        c.expect(x[3] === null && x[4] === null, `a withheld figure still gets a second explanation: ${JSON.stringify(x.slice(3))}`);
      }
      // A3: the topic grid is stacked at phone width, the table kept for wider screens and print
      const kisi = { status: "ok", metric_id: "class.topic_mastery", label_key: "metrik.topik.label", value: baris([0.5, 0.8]) };
      const r3 = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KisiTopik.tsx");' +
        "const K = m.default?.default ?? m.default; const kisi = JSON.parse(process.env.E);" +
        "process.stdout.write(renderToStaticMarkup(h(K, { kolom: [{ id: 'a', nama: '5A', target: 0.7, topik: kisi }, { id: 'b', nama: '5B', target: 0.7, topik: { status: 'below_minimum', metric_id: 'class.topic_mastery', have: 3, needed: 5 } }], locale: 'id' })));",
        { E: JSON.stringify(kisi) });
      if (c.expect(r3.ok, `the grid could not be rendered: ${r3.err}`)) {
        const tumpuk = (r3.out.match(/<div class="pin-lk-kisi-tumpuk"[\s\S]*$/) ?? [""])[0];
        c.expect(/<li><p class="pin-lk-kisi-nama">Topik 0/.test(tumpuk) && /<dt>5A<\/dt><dd><span class="pin-lk-sel" data-bawah="">/.test(tumpuk)
          && /<dt>5B<\/dt><dd class="pin-lk-sel-kosong">—<\/dd>/.test(tumpuk) && /di bawah target/.test(tumpuk),
          `the stacked grid does not give each topic with each class's figure, mark and dash: «${teks(tumpuk).slice(0, 300)}»`);
      }
      const css = baca(ctx.repoRoot, "src/app/experience.css");
      c.expect(/\.pin-lk-kisi-tumpuk \{ display: none; \}/.test(css) && /@media \(max-width: 639px\) \{\s*\.pin-lk-kisi-wadah \{ display: none; \}\s*\.pin-lk-kisi-tumpuk \{ display: grid;/.test(css)
        && /@media print \{ \.pin-lk-kisi-tumpuk \{ display: none !important; \}/.test(css),
        "the stacked grid is not the only one shown at phone width, or prints beside the table");
      // A4: English terms and sentences
      const hle = baca(ctx.repoRoot, "src/lib/hle.ts");
      c.expect(!/Pre-assessment/.test(hle) && !/en: "You answered" \}/.test(hle) && !/a Initial Mapping/.test(hle), "English still says «Pre-assessment», «You answered 3 of 8» or «a Initial Mapping»");
      const r4 = render(ctx.repoRoot,
        'const h = await import("file://" + process.cwd() + "/src/lib/hle.ts"); const f = (h.format ?? h.default?.format);' +
        'const k = await import("file://" + process.cwd() + "/src/components/bukti/KartuKetiadaan.tsx");' +
        "process.stdout.write(JSON.stringify([f.tunggal('1 students so far; 5 needed.', 'en'), f.tunggal('11 students; 1 learners (21 learners)', 'en'), f.tunggal('1 murid', 'id')," +
        " (k.kalimatJumlahOrang ?? k.default?.kalimatJumlahOrang)(1, 5, 'LEARNER', 'en')]));");
      c.expect(r4.ok && r4.out === JSON.stringify(["1 student so far; 5 needed.", "11 students; 1 learner (21 learners)", "1 murid", "1 student so far; 5 needed."]),
        `English still says «1 students», or a count other than one lost its plural: ${r4.out || r4.err}`);
      // D14: the learner's chapter result says, neutrally, that a recalculation exists, from their own sitting's yes/no
      const hasil = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx"));
      // RESTATED, C1w (O41-21, Daisy C1-B1): a sitting a governed key correction recalculated shows the corrected result as
      // its own, marked so (outcome.dikoreksi, before this branch); every other recalculated sitting keeps D14's notice
      c.expect(/engine\.sesiDihitungUlang\(db, state\.post_session\)/.test(hasil)
        && /\{outcome\.dikoreksi \? \([\s\S]*?\) : dihitungUlang \? <p className="pin-meta" data-dihitung-ulang="">\{s\("hasil\.dihitung_ulang"\)\}<\/p> : null\}/.test(hasil),
        "the learner's chapter result does not say their sitting was recalculated");
      // restated to Daisy's B3 (e8a5efb9): the notice claims only what IS sealed: the mastery, the count and the certificate
      // restated to the owner's wording decision (9 Nov): ordinary words for a learner, never «disegel»
      // RESTATED, C1w (O41-19, Daisy C1-B1): the certificate half became false (a governed correction puts it «Sedang
      // ditinjau»), so the ordinary notice now claims only what holds: the result shown is the original and it is kept
      const dihitungUlangBaris = hle.split("\n").find((l) => l.startsWith('  "hasil.dihitung_ulang": ')) ?? "";
      c.expect(/Hasil di atas adalah hasil asli, dan tetap tersimpan/.test(dihitungUlangBaris) && !/sertifikat|certificate|disegel|sealed/i.test(dihitungUlangBaris)
        && !/Hasil yang Anda lihat di sini dan sertifikat Anda tidak berubah/.test(hle),
        "the learner's notice claims more, or less, than the original result being shown and kept");
      return c.verdict("the rendered KomposisiKelas, KomposisiSekolah, KartuKetiadaan and KisiTopik output, kunciMuncul, experience.css, hle.ts and the source of the chapter result: " +
        "the topic lead counts over the topics with a figure and names the withheld ones apart (D13); «below target» is heard with its percentage (A6); a gate that applies to " +
        "no sitting is «not applicable», never a pass, a zero or «not enough», and a shown gate gives its applicable sittings and the ones apart (D12); a withheld figure is explained " +
        "once (A7); the grid is stacked at phone width (A3); English terms are consistent (A4); the learner is told of a recalculation (D14)");
    },
  },
  {
    id: "D78-B01",
    run: async (ctx) => {
      const c = new Checks();
      // B3: «Terjawab tepat n dari m» is the sealed result's own count, never the review re-graded against today's key
      const r = render(ctx.repoRoot,
        'const m = await import("file://" + process.cwd() + "/src/lib/siklus.ts"); const f = m.hitunganSegel ?? m.default?.hitunganSegel;' +
        "const ulang = [{ benar: true }, { benar: true }, { benar: false }, { benar: false }, { benar: false }, { benar: false }, { benar: false }, { benar: false }];" +
        "process.stdout.write(JSON.stringify([f({ correct: 1, item_total: 8, answered: 8 }, ulang), f({}, ulang), f(null, ulang), f({ correct: 9, item_total: 8 }, ulang)]));");
      if (c.expect(r.ok, `hitunganSegel could not run: ${r.err}`)) {
        c.expect(r.out === JSON.stringify([{ benar: 1, total: 8, tersegel: true }, { benar: 2, total: 8, tersegel: false }, { benar: 2, total: 8, tersegel: false }, { benar: 2, total: 8, tersegel: false }]),
          `the count beside the sealed mastery is not the sealed result's own (1 of 8 sealed, 2 of 8 against a corrected key): ${r.out}`);
      }
      const hasil = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx"));
      const hb = kode(baca(ctx.repoRoot, "src/lib/hasil-belajar.ts"));
      c.expect(/const hitungan = hitunganSegel\(outcome\.ringkasan, review\);/.test(hasil) && /format\.number\(hitungan\.total, locale\)/.test(hasil)
        // O-B3: the review's own count is only compared with the sealed one, never displayed as the result's count
        && /const benar = hitungan\.benar;/.test(hasil) && !/const benar = review\./.test(hasil), "the chapter result still counts the review, not the sealed result");
      c.expect(/benar: hitunganSegel\(outcome\.ringkasan, review\)\.benar/.test(hb) && !/review\.filter\(\(r\) => r\.benar === true\)/.test(hb), "«Hasil belajar» still counts the review, not the sealed result");
      // B1: the school's gate below its minimum says its count is of checks WITH required items, and the others apart
      const g = { status: "below_minimum", metric_id: "institution.safety_gate_pass_rate", label_key: "metrik.gerbang_keselamatan.label", readiness: "INSUFFICIENT_EVIDENCE",
        statement_key: "laporan.metrik.belum_cukup_data", have: 1, needed: 10, not_applicable: 51 };
      // B2: the next step points to THIS page's own «Kesiapan bukti» section, by its letter
      const r2 = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const k = await import("file://" + process.cwd() + "/src/components/bukti/KartuKetiadaan.tsx");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiSekolah.tsx");' +
        'const hl = await import("file://" + process.cwd() + "/src/lib/hle.ts"); const fm = hl.format ?? hl.default?.format;' +
        "const Kartu = k.default?.default ?? k.default; const K = m.default?.default ?? m.default; const g = JSON.parse(process.env.G);" +
        "const part = { status: 'ok', metric_id: 'institution.participants', label_key: 'metrik.peserta.label', value: 52, sample: 52 };" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(Kartu, { entry: g, locale: 'id', persona: 'staff' })), renderToStaticMarkup(h(K, { entries: [part, g], locale: 'id' }))," +
        " renderToStaticMarkup(h(K, { entries: [part], locale: 'id' })), fm.satuan(1, 'learners', 'en'), fm.satuan(2, 'learners', 'en'), fm.satuan(1, 'murid', 'id')]));",
        { G: JSON.stringify(g) });
      if (c.expect(r2.ok, `the gate or the school page could not be rendered: ${r2.err}`)) {
        let x: string[] = [];
        try { x = JSON.parse(r2.out); } catch { /* reported below */ }
        const [kartu, sekolah, tanpa] = x.slice(0, 3).map(teks);
        c.expect(kartu.includes("Dari hasil Uji Penguasaan yang memuat soal wajib, baru 1 murid; perlu 10.")
          && kartu.includes("51 hasil Uji Penguasaan lain berasal dari uji tanpa soal wajib") && !kartu.includes("Sekarang 1 murid"),
          `the gate below its minimum reads as the school's participation: «${kartu}»`);
        c.expect(/Bagian [A-F] di atas, «Kesiapan bukti», menyebut kelas yang buktinya belum cukup\./.test(sekolah) && !/Pimpinan › «Kesiapan bukti»/.test(sekolah),
          `the school page points to a section of another page: «${sekolah.slice(-300)}»`);
        c.expect(!/Kesiapan bukti», menyebut/.test(tanpa) || /Bagian [A-F] di atas/.test(tanpa), "with no readiness section, the pointer names one that is not there");
        c.expect(x[3] === "learner" && x[4] === "learners" && x[5] === "murid", `«1 learners» is still possible: ${JSON.stringify(x.slice(3))}`);
      }
      // O-B3 (owner, 9 Nov): the per-question review and the reading map grade by the corrected key, and say so beside
      // themselves, with the sealed figure, and never that the sealed result or the certificate changed
      c.expect(/const kunciBerbeda = hitungan\.tersegel && \(benarKini !== hitungan\.benar \|\| review\.length !== hitungan\.total\);/.test(hasil)
        && /<h2>\{s\("hasil\.review"\)\}<\/h2>\s*\{kunciBerbeda \? \(\s*<p className="pin-banner pin-neutral" role="note" data-kunci-terkini="">/.test(hasil),
        "the per-question review does not say, beside itself, that it uses the corrected key where it differs from the sealed count");
      const peta = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/peta/page.tsx"));
      c.expect(/engine\.sesiDihitungUlang\(db, state\.pre_session\)/.test(peta) && /\{dihitungUlang \? <p className="pin-banner pin-neutral" role="note" data-kunci-terkini="">\{s\("map\.kunci_terkini"\)\}<\/p> : null\}\s*<PetaBacaan/.test(peta),
        "the reading map of a recalculated sitting does not say it uses the corrected key");
      const hle2 = baca(ctx.repoRoot, "src/lib/hle.ts");
      const baris = (k: string) => (hle2.split("\n").find((l) => l.startsWith(`  "${k}": `)) ?? "");
      for (const k of ["hasil.review.kunci_terkini", "map.kunci_terkini"]) {
        const l = baris(k);
        // DAISY-26: learner copy never says «kunci jawaban» (it reads as locking an answer); «jawaban benar yang sudah diperbaiki»
        // RESTATED, C1w (O41-19, O41-21, Daisy C1-B1): «… tetap seperti semula» is no longer required, and the line may not
        // speak for the certificate at all, which a governed correction may put under review
        c.expect(/jawaban benar yang sudah diperbaiki/.test(l) && !/kunci jawaban/i.test(l) && /corrected answers/.test(l) && !/answer key/i.test(l) && !/disegel|sealed/i.test(l)
          && !/sertifikat|certificate/i.test(l),
          `«${k}» does not say the corrected key, or implies the sealed result or certificate changed: ${l.slice(0, 200)}`);
      }
      // Daisy (20302e39): the gate's «it appears when…» line names checks WITH required items; more sittings of checks
      // without them never make it appear
      const mu = kode(baca(ctx.repoRoot, "src/components/bukti/muncul.ts"));
      c.expect(/if \(e\.metric_id === "institution\.safety_gate_pass_rate"\) return "laporan\.muncul\.gerbang";/.test(mu)
        && /"laporan\.muncul\.gerbang": \{ default: "Angka ini muncul setelah cukup murid mengerjakan Uji Penguasaan yang memuat soal wajib\."/.test(hle2),
        "the gate below its minimum still says it appears once enough students finish any Mastery Check");
      const kh = kode(baca(ctx.repoRoot, "src/components/bukti/KeadaanHariIni.tsx"));
      c.expect((kh.match(/format\.satuan\(k\.(sedang|belum), s\(kataAnggota\("mengajar\.bukti\.murid", jenis\)\), locale\)/g) ?? []).length === 2,
        "«Lihat bukti» still writes «1 learners» under «Belum mengerjakan»");
      return c.verdict("hitunganSegel (src/lib/siklus.ts), its use in the chapter result and «Hasil belajar», the rendered KartuKetiadaan and KomposisiSekolah, " +
        "format.satuan and KeadaanHariIni: the learner's count is the sealed result's own (B3); the per-question review and the reading map say, beside themselves, that they use the corrected key and that the sealed result and certificate do not change (O-B3); the gate below its minimum counts the checks with required " +
        "items and the others apart (B1); the next step points to the page's own «Kesiapan bukti» section (B2); one learner is «1 learner» (A4)");
    },
  },
  {
    id: "D78-E01",
    run: async (ctx) => {
      const c = new Checks();
      // owner decision E1: the teacher's record of a recomputed sitting, built by the pure susunCatatan from the envelope
      const r = render(ctx.repoRoot,
        'const m = await import("file://" + process.cwd() + "/src/lib/pengajar.ts");' +
        "const env = { status: 'ok', value: [{ session_id: 's1', mode: 'POST_TEST', mastery: 0.7, recomputed: true, sealed_mastery: 0.6, recomputation_reason: 'Kunci soal 4 diperbaiki' }," +
        " { session_id: 's2', mode: 'POST_TEST', mastery: 0.5, recomputed: false, sealed_mastery: null }] };" +
        "process.stdout.write(JSON.stringify(m.susunCatatan('p', [], [], env).daftarHasil));", {}, true);
      if (c.expect(r.ok, `susunCatatan could not run: ${r.err}`)) {
        let x: Array<{ sesi: string; dihitungUlang?: boolean; asli?: number | null; penguasaan: number | null }> = [];
        try { x = JSON.parse(r.out); } catch { /* reported below */ }
        const a = x.find((h) => h.sesi === "s1"), b = x.find((h) => h.sesi === "s2");
        c.expect(a?.dihitungUlang === true && a?.asli === 0.6 && a?.penguasaan === 0.7 && (a as { alasan?: string })?.alasan === 'Kunci soal 4 diperbaiki', `the recomputed sitting's record: ${JSON.stringify(a)}`);
        c.expect(b?.dihitungUlang === false && b?.asli === null, `a sitting never recomputed claims a sealed original: ${JSON.stringify(b)}`);
      }
      // owner (regressions, 9 Nov) and D14: the note is RENDERED, directly under the figure, with its recorded reason; the page
      // only places it (the source check below is that placement, not the note's logic)
      const r3 = render(ctx.repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/CatatanHitungUlang.tsx");' +
        "const K = m.default?.default ?? m.default;" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { baru: 0.7, asli: 0.6, alasan: 'Kunci soal 4 diperbaiki', locale: 'id' }))," +
        " renderToStaticMarkup(h(K, { baru: 0.7, asli: 0.7, alasan: 'x', locale: 'id' })), renderToStaticMarkup(h(K, { baru: 0.7, asli: null, locale: 'id' }))," +
        " renderToStaticMarkup(h(K, { baru: 0.7, asli: 0.6, alasan: '  ', locale: 'en' }))]));");
      if (c.expect(r3.ok, `the recalculation note could not be rendered: ${r3.err}`)) {
        let y: string[] = [];
        try { y = JSON.parse(r3.out); } catch { /* reported below */ }
        const [beda, sama, tanpa, en] = y.map(teks);
        c.expect(beda.includes("Laporan memakai hasil terbaru (70%)") && beda.includes("hasil asli yang disegel (60%)") && beda.includes("Alasan yang dicatat: Kunci soal 4 diperbaiki"),
          `a recalculated sitting is not explained with both figures and its reason: «${beda}»`);
        c.expect(sama === "" && tanpa === "", `a note is drawn where the figures agree or no sealed original is known: «${sama}» «${tanpa}»`);
        c.expect(en.includes("Reports use the latest result (70%)") && !en.includes("Reason recorded"), `the English note, or a blank reason drawn: «${en}»`);
      }
      const hal = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/murid/[orang]/page.tsx"));
      c.expect(/\{h\.penguasaan === null \? "—" : format\.percent\(h\.penguasaan, locale\)\}\s*\{h\.dihitungUlang \? <CatatanHitungUlang baru=\{h\.penguasaan\} asli=\{h\.asli\} alasan=\{h\.alasan\}/.test(hal),
        "the teacher's learner page does not place the recalculation note directly under the figure");
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
          && t.includes("dihitung per pasangan murid dan bab: murid yang mengerjakan dua bab memberi dua pasangan") && !/pembelajaran, per murid\./.test(t),
          `Kenaikan is described as a per-learner average, or without its pairs: «${t.slice(0, 400)}»`);
      }
      return c.verdict("the output of susunCatatan (src/lib/pengajar.ts), the source of the learner page and the rendered KomposisiKelas: a recomputed " +
        "sitting carries its sealed original and the page explains it only when the two differ; Kenaikan says it is a mean per student per chapter " +
        "(a student who took two chapters gives two pairs) and gives its pairs and its learners");
    },
  },
];

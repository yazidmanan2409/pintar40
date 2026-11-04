/**
 * D-168 (cross-component integrity) and D-172 (one experience): checks that span components, kept in one place
 * inside the existing static suite.
 *
 *   D168-B1-5  Konfigurasi: every school-shaped section (BAGIAN_SEKOLAH) is drawn only where the menu lists it, so
 *              «Seluruh platform» draws none (L3; D-169(a)). Each such <section> carries the same `tampil()` rule the
 *              menu uses — the menu and the sections cannot disagree.
 *   D168-B2-1  the person's number at a school has one name (D-174, D-175): no user-facing string, in either language,
 *              says «nomor induk», «identity number», «school number» or «ID PINTAR»; the approved term and its short
 *              label are used; the five identifiers stay apart (the PINTAR ID is never called a registration number,
 *              «Kode sekolah» stays the school's, the number is never offered as the NIS/NISN, «Keanggotaan» stays
 *              class membership); Pendataan and Aktivasi carry the same approved explanation.
 *   D168-X12-1 the Studio object is «paket» / «package» (Terminology v1 ruling 2; X12 T1): no user-facing string says
 *              «kursus» or «course» except the workbook's own structure (ruling 14), the JSON format's language (ruling
 *              13) and the certificate list's column (X12 T4, awaiting Dr Gladys and the owner). The allow-list IS the
 *              decision: a later string cannot drift back.
 *   D168-C2-1  the professional-learning «Lihat bukti» (C2; D-069(b)(c), D-070(h), D-169(b)): the per-question link and
 *              the per-question page follow ONE rule (adaBuktiSoal) — the link is offered only where the page opens; the
 *              class evidence (academic metrics) is not requested for a professional-learning class, which draws one
 *              statement and the way to its record instead of the «not yet» cards; the ordinary footnote (which names
 *              the Kepala departemen as reviewer of integrity signals, false for PD) is not drawn there; its people are
 *              «peserta» in the names link.
 *   D168-K7-1  one page-head rule (E-K7, D-173(d)): no file that draws the shell (CangkangStaf / CangkangPengalaman)
 *              draws the app's name as a page's eyebrow or head line — the shell already names PINTAR.
 *   D168-K2-1  one pagination grammar (E-K2, D-173(d)): Penomoran IS the Collection's pager (HalamanKoleksi); every
 *              list that pages passes its rows' noun, its count and the reader's language; rendered, page 1 of a keyset
 *              list shows «Menampilkan 1–20 …», «Halaman 1» and a DISABLED «Sebelumnya» (never hidden), page 2 links
 *              both ways, no pager says «Kembali», and a list with a known total shows it («… dari 45 …»).
 */
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { allKeys, t, type HleEvent } from "../src/lib/hle";

const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

export const d168Tests: SelfTest[] = [
  {
    id: "D168-B1-5",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = kode(readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      const m = src.match(/const BAGIAN_SEKOLAH = \[([^\]]*)\]/);
      if (!c.expect(m !== null, "BAGIAN_SEKOLAH (the school-shaped sections) is not declared in Konfigurasi") || !m) return c.verdict("");
      const bagian = [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
      c.expect(bagian.length >= 5, `only ${bagian.length} school-shaped sections declared`);
      c.expect(/const nav = navSemua\.filter\(\(\[bagian\]\) => tampil\(bagian\)\)/.test(src), "the menu is not filtered by tampil()");
      for (const b of bagian) {
        const tag = src.match(new RegExp(`<section id="${b}"[^>]*>`));
        if (!tag) continue; // a section drawn elsewhere (or not at all) is not this page's
        c.expect(new RegExp(`hidden=\\{!tampil\\("${b}"\\)`).test(tag[0]), `the section «${b}» is drawn without the menu's rule (tampil): it shows in «Seluruh platform» although L3 hides it`);
      }
      return c.verdict("every school-shaped Konfigurasi section carries the menu's own tampil() rule, so «Seluruh platform» draws none");
    },
  },
  {
    id: "D168-B2-1",
    run: async () => {
      const c = new Checks();
      const semua = allKeys().flatMap((k) => (["id", "en"] as const).map((l) => [k, l, t(k as HleEvent, "staff", { locale: l })] as const));
      const lama = semua.filter(([, , v]) => /nomor induk|identity numbers?|school number|school's number|\bID PINTAR\b/i.test(v));
      c.expect(lama.length === 0, `the old or reversed names remain: ${lama.slice(0, 6).map(([k, l]) => `${k} (${l})`).join(", ")}`);
      const pakai = semua.filter(([, l, v]) => l === "id" && /nomor registrasi sekolah|No\. Registrasi Sekolah/i.test(v)).length;
      c.expect(pakai >= 10, `only ${pakai} Indonesian strings use «Nomor Registrasi Sekolah»`);
      const salah = semua.filter(([, , v]) => /PINTAR ID[^.]{0,40}(registrasi|registration)|(registrasi|registration)[^.]{0,40}\b(adalah|is)\b[^.]{0,20}PINTAR ID/i.test(v)
        || /(nomor registrasi|registration number)[^.]{0,30}\b(NIS|NISN)\b(?![^.]{0,5}\.)/.test(v) && !/Berbeda dari|Different from/.test(v)
        || /Keanggotaan[^.]{0,20}(nomor|number)/i.test(v));
      c.expect(salah.length === 0, `an identifier is presented as another: ${salah.slice(0, 4).map(([k, l]) => `${k} (${l})`).join(", ")}`);
      const arti = "Nomor registrasi orang ini di sekolah tersebut. Berbeda dari PINTAR ID dan NIS/NISN.";
      c.expect(t("pendataan.nomor.arti" as HleEvent, "staff", { locale: "id" }).startsWith(arti) && t("aktivasi.tunggu.cari_arti" as HleEvent, "staff", { locale: "id" }) === arti,
        "Pendataan and Aktivasi do not carry the same approved explanation");
      return c.verdict("one name for the person's number at a school, in both languages; the identifiers stay apart; one explanation on both surfaces");
    },
  },
  {
    id: "D168-X12-1",
    run: async () => {
      const c = new Checks();
      // ruling 14 (the workbook's structure), ruling 13 (the JSON format), T4 (pending): the only places the words may stay
      const BOLEH = new Set(['sertifikat.kelola.kolom.kursus', 'studio.paket.masalah.course_context_unknown', 'studio.paket.masalah.course_title_missing', 'studio.paket.masalah.package_empty', 'studio.paket.masalah.package_json_unreadable', 'studio.paket.masalah.package_shape_invalid', 'studio.paket.masalah.revision_one_course', 'studio.paket.masalah.workbook_course_row_missing', 'studio.paket.masalah.workbook_course_rows_many', 'studio.templat.batas.kursus', 'studio.templat.cara.1', 'studio.templat.satu_kursus', 'studio.unggah.hitung.courses', 'studio.unggah.isi_json', 'studio.unggah.json_arti', 'studio.unggah.json_judul', 'studio.unggah.mudah_penjelasan', 'studio.unggah.periksa_mudah', 'studio.unggah.periksa_terstruktur', 'studio.unggah.terstruktur', 'studio.unggah.terstruktur_penjelasan']);
      const salah: string[] = [];
      for (const k of allKeys()) {
        if (BOLEH.has(k)) continue;
        const id = t(k as HleEvent, "staff", { locale: "id" }).replace(/\{[a-z_]+\}/g, "");
        const en = t(k as HleEvent, "staff", { locale: "en" }).replace(/\{[a-z_]+\}/g, "");
        if (/\bkursus\b/i.test(id)) salah.push(`${k} (id)`);
        if (/\bcourses?\b/i.test(en)) salah.push(`${k} (en)`);
      }
      c.expect(salah.length === 0, `«kursus» / «course» names the Studio object in: ${salah.slice(0, 8).join(", ")}${salah.length > 8 ? ` and ${salah.length - 8} more` : ""}`);
      c.expect(t("studio.paket.judul" as HleEvent, "staff", { locale: "id" }) === "Paket Pembelajaran" && t("studio.paket.judul" as HleEvent, "staff", { locale: "en" }) === "Learning Package",
        "the full term is not «Paket Pembelajaran» / «Learning Package»");
      return c.verdict("the Studio object is «paket» / «package» everywhere; «kursus» / «course» only in the workbook's structure, the JSON format and the pending certificate column");
    },
  },
  {
    id: "D168-C2-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => kode(readFileSync(join(repoRoot, f), "utf8"));
      const ajar = baca("src/lib/mengajar.ts");
      const keadaan = baca("src/components/bukti/KeadaanHariIni.tsx");
      const soal = baca("src/app/mengajar/[kelas]/soal/page.tsx");
      const bukti = baca("src/app/mengajar/[kelas]/bukti/page.tsx");
      c.expect(/export function adaBuktiSoal\(jenis: JenisAnggota\): boolean \{\s*return jenis === "LEARNER";\s*\}/.test(ajar), "adaBuktiSoal (the one rule) is not declared as LEARNER-only");
      c.expect(/adaBuktiSoal\(jenis\)/.test(keadaan) && /href=\{`\/mengajar\/\$\{kelas\}\/soal/.test(keadaan), "the per-question link in «Keadaan hari ini» is not offered by adaBuktiSoal");
      c.expect(/if \(!adaBuktiSoal\(ctx\.ini\.jenis\)\)\s*\{?\s*return <HalamanPenolakan/.test(soal), "the per-question page does not refuse by the same rule");
      c.expect(/kataAnggota\("mengajar\.bukti\.siapa", jenis\)/.test(keadaan) && /"mengajar\.bukti\.siapa": "mengajar\.bukti\.siapa_peserta"/.test(ajar), "the names link is not «peserta» for a professional-learning class");
      c.expect(/const akademik = adaBuktiSoal\(ctx\.ini\.jenis\)/.test(bukti), "the evidence page does not decide by the same rule");
      c.expect(/akademik \? ajar\.bukti\(/.test(bukti) && (bukti.match(/ajar\.bukti\(/g) ?? []).length === 1, "the class evidence (academic metrics) is requested for a professional-learning class");
      c.expect(/data-pd-kesimpulan/.test(bukti) && /mengajar\.bukti\.pd\.arti/.test(bukti) && /href=\{`\/pengembangan\/\$\{id\}`\}/.test(bukti) && /mengajar\.bukti\.pd\.buka/.test(bukti), "the professional-learning statement and the way to its record are not drawn");
      c.expect(/akademik \? <p className="pin-foot">\{s\("mengajar\.bukti\.kaki"\)\}<\/p> : null/.test(bukti) && (bukti.match(/mengajar\.bukti\.kaki"/g) ?? []).length === 1, "the ordinary footnote is drawn for a professional-learning class (false there, D-069(c))");
      c.expect(t("mengajar.bukti.siapa_peserta" as HleEvent, "staff", { locale: "id" }) === "Lihat nama peserta", "«Lihat nama peserta» is not the copy");
      c.expect(!/murid|angka akademik kelas\b[^.]*akan/i.test(t("mengajar.bukti.pd.arti" as HleEvent, "staff", { locale: "id" })), "the professional-learning statement says «murid» or promises a figure");
      return c.verdict("one rule (adaBuktiSoal) offers the per-question link and opens its page; a PD class requests no class metric, draws one statement and its record's link, no ordinary footnote, and «peserta»");
    },
  },
  {
    id: "D168-K7-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const semua: string[] = [];
      const jalan = (d: string) => { for (const e of readdirSync(join(repoRoot, d), { withFileTypes: true })) { const f = `${d}/${e.name}`; if (e.isDirectory()) jalan(f); else if (f.endsWith(".tsx")) semua.push(f); } };
      jalan("src/app");
      const bercangkang = semua.filter((f) => /<Cangkang(Staf|Pengalaman)\b/.test(kode(readFileSync(join(repoRoot, f), "utf8"))));
      c.expect(bercangkang.length >= 20, `only ${bercangkang.length} shelled files found`);
      const salah = bercangkang.filter((f) => /<(p|span|div)[^>]*>\s*\{s\("app\.name"\)\}/.test(kode(readFileSync(join(repoRoot, f), "utf8"))));
      c.expect(salah.length === 0, `the app's name is drawn as a page head line inside the shell in: ${salah.join(", ")}`);
      return c.verdict(`no shelled page (${bercangkang.length} files) draws «PINTAR» as its eyebrow or head line`);
    },
  },
  {
    id: "D168-K2-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const pager = kode(readFileSync(join(repoRoot, "src/components/koleksi/Penomoran.tsx"), "utf8"));
      c.expect(/import \{ HalamanKoleksi \} from "\.\/Koleksi"/.test(pager) && /<HalamanKoleksi posisi=\{posisi\} benda=\{benda\} ke=\{ke\} locale=\{locale\} \/>/.test(pager)
        && !/<Link\b|<nav\b/.test(pager), "Penomoran draws its own pager instead of the Collection's");
      const PAKAI = ["src/app/konfigurasi/page.tsx", "src/app/studio/integritas/page.tsx", "src/app/studio/definisi/page.tsx", "src/app/aktivasi/page.tsx"];
      let jumlah = 0;
      for (const f of PAKAI) {
        const src = kode(readFileSync(join(repoRoot, f), "utf8"));
        for (const m of src.matchAll(/<Penomoran\b([\s\S]*?)\/>/g)) {
          jumlah++;
          c.expect(/locale=\{locale\}/.test(m[1]) && /benda=\{s?l?\("koleksi\.benda\.[a-z]+"\)|benda=\{s\("orang\.benda"\)\}/.test(m[1]) && /jumlah=\{/.test(m[1]),
            `${f}: a pager without the reader's language, its rows' noun or its count: ${m[1].replace(/\s+/g, " ").slice(0, 90)}`);
        }
      }
      c.expect(jumlah === 10, `${jumlah} paged lists found, not the 10 known`);
      const KASUS = [
        { halaman: 1, lagi: true, jumlah: 20, locale: "id" }, { halaman: 2, lagi: true, jumlah: 20, locale: "id" },
        { halaman: 3, lagi: false, jumlah: 5, locale: "en" }, { halaman: 1, lagi: false, jumlah: 20, locale: "id" },
        { halaman: 2, lagi: true, jumlah: 20, locale: "id", total: 45 },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/koleksi/Penomoran.tsx");' +
        "  const P = m.default?.default ?? m.default;" +
        "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
        "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_HAL).map((k) =>" +
        "    renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(P, { ...k, benda: 'laporan', ke: (n) => '/x?hal=' + n }))))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: repoRoot, encoding: "utf8", env: { ...process.env, KASUS_HAL: JSON.stringify(KASUS) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (!c.expect(anak.status === 0 && html.length === KASUS.length, `the pager could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) return c.verdict("");
      const teks = (x: string) => x.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const [p1, p2, p3en, satu, ber] = html;
      c.expect(/Menampilkan 1–20 laporan/.test(teks(p1)) && /Halaman 1\b/.test(teks(p1)) && !/ dari /.test(teks(p1)), `page 1: ${teks(p1)}`);
      const tombol = (x: string, arah: string) => (x.match(new RegExp(`<a [^>]*data-pager="${arah}"[^>]*>`)) ?? [""])[0];
      const mati = (x: string, arah: string) => /aria-disabled="true"/.test(tombol(x, arah)) && !/href=/.test(tombol(x, arah));
      const ke = (x: string, arah: string, n: number) => tombol(x, arah).includes(`href="/x?hal=${n}"`);
      c.expect(mati(p1, "sebelum") && ke(p1, "sesudah", 2), "page 1 hides «Sebelumnya» (or links it) or does not link onward");
      c.expect(ke(p2, "sebelum", 1) && ke(p2, "sesudah", 3) && /Menampilkan 21–40 laporan/.test(teks(p2)), `page 2: ${teks(p2)}`);
      c.expect(/Showing 41–45 laporan/.test(teks(p3en)) && /Page 3\b/.test(teks(p3en)) && mati(p3en, "sesudah") && /Previous/.test(p3en), `the last page in English: ${teks(p3en)}`);
      c.expect(satu === '<div data-penomoran=""></div>', "a one-page list draws a pager");
      c.expect(/Menampilkan 21–40 dari 45 laporan/.test(teks(ber)) && /Halaman 2 dari 3/.test(teks(ber)), `a known total is not shown: ${teks(ber)}`);
      c.expect(html.every((x) => !/>\s*(Kembali|Back)\s*</.test(x)), "a pager says «Kembali»");
      return c.verdict("one pager (the Collection's) for every paged list: the count line, the position, «Sebelumnya» disabled on page 1, no «Kembali», the total only where the list has it");
    },
  },
];

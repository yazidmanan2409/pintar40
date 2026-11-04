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
 *   D168-K1-1  a back link names where it goes (E-K1, D-173(d)): no copy key reads only «Kembali» / «Back» but the step
 *              controls (the tour's, a sitting's previous question); no `pin-back` link and no refusal page's `backKey` draws such a word; a link to a place takes
 *              its word from the one table (LABEL_TEMPAT) the navigation reads; the refusal page names its destination
 *              from it; a return that depends on how the reader arrived is declared `data-kembali="riwayat"` and named
 *              KEMBALI_RIWAYAT («Kembali ke halaman sebelumnya»); a report opened from Pimpinan or Konfigurasi
 *              names that place (H9, asalLaporan).
 *   D168-K3-1  the ✓ shares the line with its words (E-K3): the save-result line (BarisHasil, `.pin-msg.pin-hasil`) and
 *              the learner's result card no longer share a class — the card's grid had put the ✓ on a row of its own on
 *              every surface. No stylesheet rule gives `.pin-hasil` a layout; the card is `.pin-capaian`; a paragraph
 *              after the ✓ runs inline.
 *   D168-A2-1  an Uji Cepat is named in one place (E-A2-1, RV-16): judulAsesmen names it «Uji Cepat · <cap date>» in the
 *              reader's language from when it opened, never from the stored stamp («Uji Cepat — 2026-11-02 20:26»); the
 *              result page, «Keadaan hari ini», the Uji Cepat page (running and last) and Belajar's open list all name
 *              it so, and none adds «Uji Cepat» beside the name.
 *   D168-K9-1  a fixed value is text (E-K9): the date field (TanggalDenganGema), given `disabled` (Siapkan after
 *              «Disediakan»), draws no field at all — the date in the helper's words in an <output> the caller's label
 *              still names — and no src file draws a disabled native date field.
 *   D168-K8-1  Studio's step list reads as progress, not as radio buttons (E-K8): its markers are segments (no ring, no
 *              round marker, no border on any state), the list carries no radio role or input, and the current step is
 *              told by aria-current and the primary segment.
 *   D168-C1-1  the reader's working context decides, and every way back names its destination (E-C1-2, E-C1-4,
 *              E-C1-6, E-C2-1): /pengembangan and /lapor choose their shell by the working context (cangkangStaf with the
 *              context; no role-name matching in the page); the class report speaks the context's persona; the record's
 *              refusal says who it is for; a PD participant has no academic per-learner page (adaBuktiSoal) and the
 *              rosters do not link one; no Mengajar refusal that returns to a class page, «Lihat bukti» or the Uji Cepat
 *              calls its button «Mengajar».
 *   D168-C1-2  a figure is named, never by a key and never by nothing (E-C1-1, E-C1-3): labelMetrik gives a known key's
 *              words and, for a key the copy table lacks or no key, the one «no name yet» sentence; every surface that
 *              names a report entry asks it (no `label_key ? … : ""` left, no empty heading); every metric label key the
 *              database's migrations and seed define has words in both languages.
 *   D168-A1-1  the reviewer sees each question's difficulty and each option's misconception (E-A1-1): susunSoal returns
 *              the author's difficulty as its band (never the number) and an option's misconception by its taxonomy name
 *              (the code where unnamed); the loader reads both columns and the names with the reader's own client (no
 *              new reach); the package page draws them in the Bank Soal's words.
 *   D168-D2-1  the saved certificate's name (E-D2-1): namaBerkas turns / \ : * ? " < > | into hyphens, folds runs, trims, and
 *              caps a 200-character title at 150 on a word; the certificate page names its PDF through it (the package,
 *              never the learner); the print button puts the tab's title back when print returns, printed or cancelled.
 *   D168-B1-4  every Tab stop of a date field shows the ring (E-B1-4): the design system's focus rule gives a date,
 *              date-time or time field the ring while focus is within it but not on it (its calendar button), with the
 *              same tokens as every other focus ring. Rendered evidence in Chromium: docs/completion-4.0/d177-koreksi/.
 *   D168-K4-1  a result is said where its action was (E-K4): queryHasil returns the sending form's origin (`asal`), its
 *              row (`baris`) and its list's page, and drops anything else; HasilDi draws a row's answer in the row and
 *              the list's line only for a row not on the page; Konfigurasi's multi-form sections (roles, transfers,
 *              maintenance, problem reports), Studio's row lists (definitions, Bank Soal, integrity, release moves)
 *              and the distribution forms answer at the form; the answers no page read (package-less Studio refusals,
 *              the intake file, the certificate revocation's context refusal) are read where their form is.
 *   D168-B4-1  a platform role beside a school role, rendered (E-B4-1; Daisy 1820300e): the Digital Card on «Akun saya»
 *              (KartuPintar) and the card email (templatKartu) show the same lines in the same order — «Admin platform» on
 *              its own line, then «Guru · SMP …», alphabetical — and the card takes the first role's colour, whatever
 *              order the database gives.
 *   D168-SERAH-1 Daisy's engineering hand-off (SERAH-TERIMA, 4 Nov), the rows not proved elsewhere: no screen writes
 *              the formal date (E3 #15; only the certificate sheet and the emails, which print); the learner's answer
 *              button and Studio's «Periksa» say why they are disabled (E3 #4); the report body speaks the reader's
 *              persona and draws no raw key (H24); no Pimpinan page draws an empty heading (H24); «Seluruh platform»
 *              has its own «Laporan masalah» sentence (H17); the overlap sentence has no «pukul» before a day (H19).
 */
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Checks, visibleText, type SelfTest } from "./lib";
import { tanpaIsiMateri } from "./isi-materi";
import { allKeys, t, INTERNAL_WORDS, type HleEvent } from "../src/lib/hle";
import { judulAsesmen } from "../src/lib/judul-asesmen";
import { cangkangStaf } from "../src/components/lapor/cangkang";
import { labelMetrik } from "../src/components/bukti/label";
import { susunSoal } from "../src/lib/soal-tinjauan";
import { namaBerkas, BATAS_NAMA_BERKAS } from "../src/lib/nama-berkas";
import { queryHasil } from "../src/lib/galat-kontrak";
import { render } from "./ux2.test";

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
        // (B1: a section is drawn on its own page through tampilDi, which is tampil and the page's section; Persiapan on the index)
        c.expect(new RegExp(`hidden=\\{(?:bagianIni !== null \\|\\| )?!tampil(?:Di)?\\("${b}"\\)`).test(tag[0]) && /const tampilDi = \(bagian: string\) => bagianIni === bagian && tampil\(bagian\);/.test(src), `the section «${b}» is drawn without the menu's rule (tampil): it shows in «Seluruh platform» although L3 hides it`);
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
      // retrospective R4 (B2's acceptance: «in both languages»): every key whose Indonesian names the number says the
      // same number in English, never another identifier (aktivasi.staf.arti's English said «PINTAR ID»)
      const tanpaPadanan = allKeys().filter((k) => /nomor registrasi sekolah|No\. Registrasi Sekolah/i.test(t(k as HleEvent, "staff", { locale: "id" }))
        && !/school registration number/i.test(t(k as HleEvent, "staff", { locale: "en" })));
      c.expect(tanpaPadanan.length === 0, `the English does not say «school registration number» where the Indonesian names it: ${tanpaPadanan.join(", ")}`);
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
        { halaman: 1, lagi: false, jumlah: 1, locale: "id", total: 1 },
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
      const [p1, p2, p3en, satu, ber, satuTotal] = html;
      c.expect(/^<div data-penomoran="" class="pin-penomoran">/.test(p1) && /\.pin-penomoran \{ container-type: inline-size;/.test(readFileSync(join(repoRoot, "src/app/experience.css"), "utf8")),
        "the pager outside a Collection is not its own container, so it does not fold at 320 px (B5-W3: /aktivasi 476 px)");
      c.expect(/Menampilkan 1–20 laporan/.test(teks(p1)) && /Halaman 1\b/.test(teks(p1)) && !/ dari /.test(teks(p1)), `page 1: ${teks(p1)}`);
      const tombol = (x: string, arah: string) => (x.match(new RegExp(`<a [^>]*data-pager="${arah}"[^>]*>`)) ?? [""])[0];
      const mati = (x: string, arah: string) => /aria-disabled="true"/.test(tombol(x, arah)) && !/href=/.test(tombol(x, arah));
      const ke = (x: string, arah: string, n: number) => tombol(x, arah).includes(`href="/x?hal=${n}"`);
      c.expect(mati(p1, "sebelum") && ke(p1, "sesudah", 2), "page 1 hides «Sebelumnya» (or links it) or does not link onward");
      c.expect(ke(p2, "sebelum", 1) && ke(p2, "sesudah", 3) && /Menampilkan 21–40 laporan/.test(teks(p2)), `page 2: ${teks(p2)}`);
      c.expect(/Showing 41–45 laporan/.test(teks(p3en)) && /Page 3\b/.test(teks(p3en)) && mati(p3en, "sesudah") && /Previous/.test(p3en), `the last page in English: ${teks(p3en)}`);
      // RESTATED FOR E3 #12 (Daisy): a single page keeps the one grammar — «Halaman 1», both moves disabled
      c.expect(/Menampilkan 1–20 laporan/.test(teks(satu)) && mati(satu, "sebelum") && mati(satu, "sesudah"), `a one-page list: ${teks(satu)}`);
      c.expect(/Menampilkan 1–1 dari 1 laporan/.test(teks(satuTotal)) && /Halaman 1 dari 1/.test(teks(satuTotal)) && mati(satuTotal, "sebelum") && mati(satuTotal, "sesudah"), `a one-page list with its total: ${teks(satuTotal)}`);
      c.expect(/Menampilkan 21–40 dari 45 laporan/.test(teks(ber)) && /Halaman 2 dari 3/.test(teks(ber)), `a known total is not shown: ${teks(ber)}`);
      c.expect(html.every((x) => !/>\s*(Kembali|Back)\s*</.test(x)), "a pager says «Kembali»");
      return c.verdict("one pager (the Collection's) for every paged list: the count line, the position, «Sebelumnya» disabled on page 1, no «Kembali», the total only where the list has it");
    },
  },
  {
    id: "D168-K1-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const telanjang = allKeys().filter((k) => (["id", "en"] as const).some((l) => /^(Kembali|Back)$/.test(t(k as HleEvent, "staff", { locale: l }).trim())));
      // a step control moves back one step in a sequence (the tour, the questions of a sitting); it goes to no place
      const LANGKAH = ["pretest.back", "tur.kembali"];
      c.expect(JSON.stringify(telanjang) === JSON.stringify(LANGKAH), `copy keys that read only «Kembali» besides the step controls: ${telanjang.filter((k) => !LANGKAH.includes(k)).join(", ")}`);
      const semua: string[] = [];
      const jalan = (d: string) => { for (const e of readdirSync(join(repoRoot, d), { withFileTypes: true })) { const f = `${d}/${e.name}`; if (e.isDirectory()) jalan(f); else if (f.endsWith(".tsx")) semua.push(f); } };
      jalan("src/app"); jalan("src/components");
      let tautan = 0;
      for (const f of semua) {
        const src = kode(readFileSync(join(repoRoot, f), "utf8"));
        for (const m of src.matchAll(/className="pin-back[^"]*"[\s\S]*?<\/Link>/g)) {
          tautan++;
          for (const k of m[0].matchAll(/\bs\("([a-z0-9_.]+)"/g)) c.expect(!(telanjang as string[]).includes(k[1]), `${f}: a back link reads only «Kembali» (${k[1]})`);
        }
        for (const k of src.matchAll(/backKey="([a-z0-9_.]+)"/g)) c.expect(!(telanjang as string[]).includes(k[1]) && (allKeys() as string[]).includes(k[1]), `${f}: a refusal's way back reads only «Kembali» (${k[1]})`);
        if (/data-kembali="riwayat"|data-kembali=\{|<TautanKembali[^>]*jenis=/.test(src)) c.expect(/KEMBALI_RIWAYAT/.test(src) || /AksiLaporan\.tsx$|TautanKembali\.tsx$/.test(f), `${f}: a history-back is not named as one`);
        // R0-4: a way back NAMED as the history-back goes back in the history (TautanKembali), never to a bare address
        // that drops the page's query (/siapa without ?penugasan= refused the teacher who had come from it)
        if (!/TautanKembali\.tsx$/.test(f)) c.expect(!/<Link[^>]*data-kembali="riwayat"/.test(src), `${f}: a link named as the history-back is a plain Link to an address`);
      }
      c.expect(tautan >= 30, `only ${tautan} back links found`);
      const nav = kode(readFileSync(join(repoRoot, "src/components/NavKonteks.tsx"), "utf8"));
      c.expect(/const LABEL: Readonly<Record<string, HleEvent>> = LABEL_TEMPAT;/.test(nav), "the navigation does not read the one place table");
      const tolak = kode(readFileSync(join(repoRoot, "src/components/HalamanPenolakan.tsx"), "utf8"));
      c.expect(/namaTempat\(backHref\)/.test(tolak), "the refusal page does not name its destination from the place table");
      const aksi = kode(readFileSync(join(repoRoot, "src/components/laporan/AksiLaporan.tsx"), "utf8"));
      // H9: the report's way back is declared by what it is: «tempat» when opened from a named place, «riwayat» otherwise
      // RESTATED, R0-4: the history-back is one component (TautanKembali), which the report pages and /lapor both use
      const kembali = kode(readFileSync(join(repoRoot, "src/components/TautanKembali.tsx"), "utf8"));
      c.expect(/window\.history\.back\(\)/.test(kembali) && /data-kembali=\{jenis\}/.test(kembali), "the history-back component does not go back in the history, or does not declare itself");
      c.expect(/<TautanKembali href=\{ke\} className="pin-btn pin-quiet" jenis=\{ke === "\/" \? "riwayat" : "tempat"\}>/.test(aksi) && !/history\.back/.test(aksi), "the report's history-back is not the shared one");
      const lapor = kode(readFileSync(join(repoRoot, "src/app/lapor/page.tsx"), "utf8"));
      c.expect(/<TautanKembali className="pin-back" href=\{halaman\} jenis="riwayat">← \{s\(KEMBALI_RIWAYAT\)\}<\/TautanKembali>/.test(lapor), "«Laporkan masalah»'s way back is not the history-back");
      const aksiLapor = kode(readFileSync(join(repoRoot, "src/app/lapor/actions.ts"), "utf8"));
      c.expect(/redirect\(`\/lapor\?\$\{p\.toString\(\)\}`, RedirectType\.replace\)/.test(aksiLapor), "a refused report adds a history entry, so its way back returns to the form");
      const semuaSrc = semua.map((f) => kode(readFileSync(join(repoRoot, f), "utf8"))).join("\n");
      c.expect((semuaSrc.match(/window\.history\.back\(\)/g) ?? []).length === 1, "the history-back is written in more than one place");
      const asal = readFileSync(join(repoRoot, "src/lib/nama-tempat.ts"), "utf8");
      c.expect(/pimpinan: \{ ke: "\/pimpinan", nama: "nav\.pimpinan" \}/.test(asal) && /konfigurasi: \{ ke: "\/konfigurasi\/laporan", nama: "config\.laporan\.judul" \}/.test(asal)
        && /\{ ke: "\/", nama: KEMBALI_RIWAYAT \}/.test(asal), "a report's origin is not named from its place (H9)");
      for (const f of ["src/app/edukator/ringkasan/page.tsx", "src/app/dekan/ringkasan/page.tsx"]) {
        c.expect(/const asal = asalLaporan\(dari\);/.test(kode(readFileSync(join(repoRoot, f), "utf8"))) && /<AksiLaporan kembali=\{s\(asal\.nama, /.test(kode(readFileSync(join(repoRoot, f), "utf8"))), `${f}: the report's way back is not named by its origin`);
      }
      c.expect(t("kembali.riwayat" as HleEvent, "staff", { locale: "id" }) === "Kembali ke halaman sebelumnya" && t("nav.pimpinan" as HleEvent, "staff", { locale: "id" }) === "Pimpinan", "the words are not the table's");
      return c.verdict(`no back link (${tautan} drawn) or refusal reads only «Kembali»; places are named from the one table the navigation reads; the history-back is declared and named as one`);
    },
  },
  {
    id: "D168-K3-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = ["src/app/experience.css", "src/app/globals.css"].map((f) => readFileSync(join(repoRoot, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")).join("\n");
      const aturan = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ pilih: m[1].trim(), isi: m[2] }));
      const garis = aturan.filter((a) => a.pilih.split(",").some((p) => /\.pin-hasil(?![-\w])/.test(p)));
      c.expect(garis.length > 0, "no rule names the result line");
      const tata = garis.filter((a) => /\b(display|grid-template|flex-direction)\s*:/.test(a.isi) && !/\.pin-centang \+ p/.test(a.pilih));
      c.expect(tata.length === 0, `a rule lays the result line out (the ✓ leaves its words): ${tata.map((a) => a.pilih).join(" | ")}`);
      c.expect(aturan.some((a) => a.pilih === ".pin-capaian" && /display: grid/.test(a.isi)), "the learner's result card has no class of its own");
      c.expect(aturan.some((a) => a.pilih === ".pin-msg.pin-hasil > .pin-centang + p" && /display: inline/.test(a.isi)), "a paragraph after the ✓ starts a line of its own");
      const hasil = kode(readFileSync(join(repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx"), "utf8"));
      c.expect(/<section className="pin-capaian">/.test(hasil) && !/className="pin-hasil"/.test(hasil), "the result page still draws the card as the result line's class");
      const baris = kode(readFileSync(join(repoRoot, "src/components/BarisHasil.tsx"), "utf8"));
      c.expect(/<span className="pin-centang" aria-hidden="true">✓<\/span> : null\}\s*\{children\}/.test(baris), "the ✓ is not drawn directly before its words");
      return c.verdict("the result line has no layout of its own to break: the card is .pin-capaian, the ✓ runs on with its words, a paragraph included");
    },
  },
  {
    id: "D168-A2-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const q = { judul: "Uji Cepat — 2026-11-02 20:26", mode: "QUICK", dibuka: "2026-11-02T13:26:00Z" };
      const id = judulAsesmen(q, "id");
      const en = judulAsesmen(q, "en");
      c.expect(id === "Uji Cepat · 2 Nov 2026, 20.26 WIB", `in Indonesian an Uji Cepat is named «${id}»`);
      c.expect(en.startsWith("Quick Assessment · ") && /2026, 20\.26 WIB$/.test(en), `in English an Uji Cepat is named «${en}»`);
      c.expect((id.match(/Uji Cepat/g) ?? []).length === 1 && !id.includes("—") && !/\d{4}-\d{2}-\d{2}/.test(id), "the name repeats «Uji Cepat» or carries the stored stamp");
      c.expect(judulAsesmen({ judul: "Cek penguasaan", mode: "POST_TEST", dibuka: q.dibuka }, "id") === "Cek penguasaan", "another assessment loses its package's title");
      const SURFACE: Array<[string, RegExp]> = [
        ["src/app/mengajar/[kelas]/uji-cepat/hasil/page.tsx", /<p className="pin-eyebrow">\{judulAsesmen\(tugas, locale\)\}<\/p>/],
        ["src/components/bukti/KeadaanHariIni.tsx", /<p className="pin-keadaan-judul">\{judulAsesmen\(a, locale\)\}<\/p>/],
        ["src/app/mengajar/[kelas]/uji-cepat/page.tsx", /\{judulAsesmen\(hidup, locale\)\}[\s\S]*\{judulAsesmen\(terakhir, locale\)\}/],
        ["src/app/belajar/page.tsx", /<span className="pin-ttitle">\{judulAsesmen\(\{ judul: a\.title, mode: a\.mode, dibuka: a\.opens_at \}, locale\)\}<\/span>/],
      ];
      for (const [f, re] of SURFACE) {
        const src = kode(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(re.test(src), `${f} does not name the assessment through judulAsesmen`);
        c.expect(!/s\("mengajar\.cepat\.eyebrow"\)\} · \{[a-z]+\.judul\}/.test(src) && !/\{(tugas|hidup|terakhir)\.judul\}/.test(src), `${f} still draws the stored title or adds «Uji Cepat» beside it`);
      }
      return c.verdict(`an Uji Cepat is «${id}» / «${en}» on every surface that names it; the stored stamp is never shown; others keep their titles`);
    },
  },
  {
    id: "D168-K9-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tetap = render(repoRoot, "src/components/bentuk/TanggalDenganGema.tsx", { id: "pin-mulai", name: "mulai", defaultValue: "2026-11-09", disabled: true, locale: "id", untuk: "educator" });
      const bisa = render(repoRoot, "src/components/bentuk/TanggalDenganGema.tsx", { id: "pin-mulai", name: "mulai", defaultValue: "2026-11-09", locale: "id", untuk: "educator" });
      const kosong = render(repoRoot, "src/components/bentuk/TanggalDenganGema.tsx", { id: "pin-sampai", name: "sampai", disabled: true, kosong: "Tanpa batas akhir", locale: "id", untuk: "educator" });
      if (!c.expect(tetap.ok && bisa.ok && kosong.ok, `the date field could not be rendered: ${tetap.galat || bisa.galat || kosong.galat}`)) return c.verdict("");
      c.expect(!/<input\b/.test(tetap.html) && /<output id="pin-mulai"[^>]*>Senin, 9 Nov 2026<\/output>/.test(tetap.html) && /data-tetap=""/.test(tetap.html),
        `a fixed date is still a field, or not said as the helper says it: ${tetap.html.slice(0, 200)}`);
      c.expect(/<output id="pin-sampai" class="is-kosong">Tanpa batas akhir<\/output>/.test(kosong.html) && !/<input\b/.test(kosong.html), "a fixed empty end is not said as what empty means");
      c.expect(/<input[^>]*id="pin-mulai"[^>]*type="date"/.test(bisa.html) && !/disabled/.test(bisa.html), "a date that can change is no longer a field");
      const semua: string[] = [];
      const jalan = (d: string) => { for (const e of readdirSync(join(repoRoot, d), { withFileTypes: true })) { const f = `${d}/${e.name}`; if (e.isDirectory()) jalan(f); else if (f.endsWith(".tsx")) semua.push(f); } };
      jalan("src");
      const salah = semua.filter((f) => /<input\b[^>]*type="(date|datetime-local)"[^>]*\bdisabled\b|<input\b[^>]*\bdisabled\b[^>]*type="(date|datetime-local)"/.test(kode(readFileSync(join(repoRoot, f), "utf8"))));
      c.expect(salah.length === 0, `a disabled native date field is drawn in: ${salah.join(", ")}`);
      return c.verdict("a fixed date is the helper's words in an <output>, never a disabled field; a date that can change stays a native field");
    },
  },
  {
    id: "D168-K8-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      const aturan = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ pilih: m[1].trim(), isi: m[2] })).filter((a) => /\.pin-lt-langkah[^,]*::before/.test(a.pilih));
      c.expect(aturan.length >= 3, `only ${aturan.length} marker rules`);
      const cincin = aturan.filter((a) => /\bborder(-width|-color)?\s*:|border-radius:\s*50%|width:\s*var\(--icon/.test(a.isi));
      c.expect(cincin.length === 0, `a step marker is a ring (a radio's look): ${cincin.map((a) => a.pilih).join(" | ")}`);
      const dasar = aturan.find((a) => a.pilih === ".pin-lt-langkah::before");
      c.expect(!!dasar && /display: block/.test(dasar.isi) && /height: var\(--space-1\)/.test(dasar.isi), "the marker is not a segment over the word");
      c.expect(aturan.some((a) => a.pilih === '.pin-lt-langkah[aria-current="step"]::before' && /background: var\(--pintar-primary\)/.test(a.isi)), "the current step is not the primary segment");
      const src = kode(readFileSync(join(repoRoot, "src/components/studio/LangkahTerbit.tsx"), "utf8"));
      const daftar = /<ol className="pin-lt-daftar"[\s\S]*?<\/ol>/.exec(src)?.[0] ?? "";
      c.expect(daftar !== "" && !/role="radio|<input\b|tabIndex/.test(daftar) && /aria-current=\{keadaan === "kini" \? "step" : undefined\}/.test(daftar), "the step list is a control, or its current step is not aria-current");
      return c.verdict("Studio's steps are segments of progress over their words (no ring), not a control; the current one is aria-current and primary");
    },
  },
  {
    id: "D168-C1-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => kode(readFileSync(join(repoRoot, f), "utf8"));
      const pasang = (tujuan: string, peran: string[]) => ({ tujuan, tempat: "s", platform: false, nama: "S", jenis: "INSTITUTION", peran, kemampuan: [] }) as never;
      // a person who is both a teacher and a school administrator, working in Mengelola: Konfigurasi's shell, not a teacher's
      c.expect(JSON.stringify(cangkangStaf(["EDUCATOR", "INSTITUTION_ADMIN"], pasang("MENGELOLA", ["INSTITUTION_ADMIN"]))) === JSON.stringify({ kind: "focus", kembali: "/konfigurasi" }),
        `a teacher-administrator in Mengelola gets ${JSON.stringify(cangkangStaf(["EDUCATOR", "INSTITUTION_ADMIN"], pasang("MENGELOLA", ["INSTITUTION_ADMIN"])))}`);
      c.expect(cangkangStaf(["EDUCATOR", "DEAN"], pasang("MENGAJAR", ["EDUCATOR"])).kembali === "/mengajar", "a teaching Dean in Mengajar is not given Mengajar");
      c.expect(cangkangStaf(["EDUCATOR"], null).kembali === "/mengajar", "without a context the roles no longer stand in");
      for (const f of ["src/app/pengembangan/[simpul]/page.tsx", "src/app/lapor/page.tsx", "src/app/lapor/saya/page.tsx"]) {
        const src = baca(f);
        c.expect(/cangkangStaf\(peran, k\?\.keadaan === "ADA" \? k : null\)/.test(src) && !/peran\?\.(includes|some)\(/.test(src), `${f} chooses its shell from role names, not the working context`);
      }
      const ringkas = baca("src/app/edukator/ringkasan/page.tsx");
      c.expect(/const untuk: Persona = k\?\.keadaan === "ADA" && k\.tujuan === "MENGAJAR" \? "educator" : "staff";/.test(ringkas) && !/"educator", locale\)/.test(ringkas)
        && /kalimatJumlah\(e, locale, untuk\)/.test(ringkas), "the class report does not speak the reader's working context");
      c.expect(/messageKey="pengembangan\.ditolak"/.test(baca("src/app/pengembangan/[simpul]/page.tsx")) && t("pengembangan.ditolak" as HleEvent, "staff", { locale: "id" }).startsWith("Catatan ini untuk fasilitator"),
        "the record's refusal falls back to the generic line");
      const murid = baca("src/app/mengajar/[kelas]/murid/[orang]/page.tsx");
      c.expect(/if \(!adaBuktiSoal\(ctx\.ini\.jenis\)\) \{\s*return <HalamanPenolakan [^>]*backHref=\{`\/pengembangan\/\$\{id\}`\} backKey="mengajar\.bukti\.pd\.buka"/.test(murid),
        "a PD participant still has an academic per-learner page");
      for (const f of ["src/app/mengajar/[kelas]/page.tsx", "src/app/mengajar/[kelas]/siapa/page.tsx"]) {
        c.expect(/nama: adaBuktiSoal\(ctx\.ini\.jenis\) \? <Link href=\{`\/mengajar\/\$\{id\}\/murid\/\$\{m\.id\}`\}>\{m\.nama\}<\/Link> : m\.nama/.test(baca(f)), `${f}: a participant's name links to a per-learner page`);
      }
      const semua: string[] = [];
      const jalan = (d: string) => { for (const e of readdirSync(join(repoRoot, d), { withFileTypes: true })) { const f = `${d}/${e.name}`; if (e.isDirectory()) jalan(f); else if (f.endsWith(".tsx")) semua.push(f); } };
      jalan("src/app/mengajar");
      for (const f of semua) {
        for (const m of baca(f).matchAll(/<HalamanPenolakan\b([\s\S]*?)\/>/g)) {
          const ke = /backHref=\{([^}]*\}?[^}]*)\}|backHref="([^"]*)"/.exec(m[1]);
          const tujuanBukanTempat = ke && /`\/mengajar\/\$\{id\}/.test(ke[0]) && !/: "\/mengajar"/.test(ke[0]);
          if (tujuanBukanTempat) c.expect(!/backKey="mengajar\.kembali"/.test(m[1]) || /backLabel=/.test(m[1]), `${f}: a refusal to a class page calls its button «Mengajar»: ${m[1].replace(/\s+/g, " ").slice(0, 120)}`);
        }
      }
      return c.verdict("the shell, the persona and the way back follow the working context and name their destinations; a PD participant has the record, not an academic page");
    },
  },
  {
    id: "D168-C1-2",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tanpa = t("laporan.metrik.tanpa_nama" as HleEvent, "staff", { locale: "id" });
      c.expect(labelMetrik({ label_key: "metrik.peserta.label" }, "staff", "id") === t("metrik.peserta.label" as HleEvent, "staff", { locale: "id" }), "a known measure is not named by its words");
      for (const e of [{ label_key: "metrik.belum_ada.label" }, { label_key: null }, {}]) {
        const id = labelMetrik(e, "staff", "id");
        const en = labelMetrik(e, "educator", "en");
        c.expect(id === tanpa && en === t("laporan.metrik.tanpa_nama" as HleEvent, "staff", { locale: "en" }) && id.trim() !== "" && !/[a-z]+(\.[a-z_]+)+/.test(id + en),
          `an unnamed measure (${JSON.stringify(e)}) reads «${id}» / «${en}»`);
      }
      const SURFACE = ["src/app/edukator/ringkasan/page.tsx", "src/app/dekan/ringkasan/page.tsx", "src/components/bukti/KartuKetiadaan.tsx",
        "src/components/bukti/AngkaBerdiri.tsx", "src/components/pimpinan/AngkaTerkelola.tsx", "src/app/mengajar/[kelas]/bukti/page.tsx"];
      for (const f of SURFACE) {
        const src = kode(readFileSync(join(repoRoot, f), "utf8"));
        c.expect(/labelMetrik\(/.test(src) && !/label_key \? [^:]*: ""/.test(src) && !/\{s\((entry|e|siap)\.label_key\)\}/.test(src), `${f} names an entry without labelMetrik, or draws nothing in its place`);
      }
      for (const f of ["src/app/edukator/ringkasan/page.tsx", "src/app/dekan/ringkasan/page.tsx"]) {
        c.expect(/<h2 className="font-medium">\{labelMetrik\(e, (untuk|"staff"), locale\)\}<\/h2>/.test(kode(readFileSync(join(repoRoot, f), "utf8"))), `${f}: an entry's heading can be empty`);
      }
      const kunci = new Set(allKeys() as string[]);
      const db: string[] = [];
      const jalan = (d: string) => { for (const e of readdirSync(join(repoRoot, d), { withFileTypes: true })) { const f = `${d}/${e.name}`; if (e.isDirectory()) jalan(f); else if (f.endsWith(".sql")) db.push(f); } };
      jalan("supabase/migrations"); jalan("supabase/seed");
      const label = new Set(db.flatMap((f) => [...readFileSync(join(repoRoot, f), "utf8").matchAll(/'(metrik\.[a-z_]+\.(label|arti))'/g)].map((m) => m[1])));
      // a probe measure is planted and removed by the migrations' own checks; it never reaches a reader
      const tanpaKata = [...label].filter((k) => !k.startsWith("metrik.probe.") && !kunci.has(k));
      c.expect(label.size >= 30 && tanpaKata.length === 0, `metric keys the database defines without words: ${tanpaKata.join(", ")} (of ${label.size})`);
      return c.verdict(`every report entry is named through labelMetrik (no key, no empty heading); the ${label.size} metric keys the database defines all have words`);
    },
  },
  {
    id: "D168-A1-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tgl = "2026-10-01T00:00:00Z";
      const hasil = susunSoal([{ id: "m", ordinal: 1 }], [{ id: "l", module_id: "m", ordinal: 1, title: "P" }],
        [{ id: "a", lesson_id: "l", cycle_role: "POST_TEST", bank_type: "TEST", stimulus: null, stem: "s", created_at: tgl, predicted_difficulty: 0.75 },
          { id: "b", lesson_id: "l", cycle_role: null, bank_type: "PRACTICE", stimulus: null, stem: "t", created_at: tgl, predicted_difficulty: 0.3 },
          { id: "d", lesson_id: "l", cycle_role: null, bank_type: "PRACTICE", stimulus: null, stem: "u", created_at: tgl, predicted_difficulty: null }],
        [{ item_id: "a", label: "A", body: "x", is_correct: false, rationale: "r", misconception_code: "MK-1" },
          { item_id: "a", label: "B", body: "y", is_correct: false, rationale: "r", misconception_code: "MK-2" },
          { item_id: "a", label: "C", body: "z", is_correct: true, rationale: "r", misconception_code: null }],
        new Map([["MK-1", "Menjumlahkan penyebut"]]));
      const [a, b, d] = hasil[0].soal;
      c.expect(a.pita === "SULIT" && b.pita === "MUDAH" && d.pita === null && !JSON.stringify(hasil).includes("0.75"), `the bands read ${a.pita}/${b.pita}/${d.pita}, or a number leaked`);
      c.expect(JSON.stringify(a.opsi.map((o) => o.miskonsepsi ?? null)) === JSON.stringify([{ kode: "MK-1", nama: "Menjumlahkan penyebut" }, { kode: "MK-2", nama: null }, null]),
        `the options' misconceptions read ${JSON.stringify(a.opsi.map((o) => o.miskonsepsi ?? null))}`);
      const muat = kode(readFileSync(join(repoRoot, "src/lib/soal-tinjauan.ts"), "utf8"));
      c.expect(/from\("items"\)\.select\("[^"]*predicted_difficulty"\)/.test(muat) && /from\("item_options"\)\.select\("[^"]*misconception_code"\)/.test(muat)
        && /await c\.from\("misconception_taxonomy"\)\.select\("code, label"\)/.test(muat) && !/service|admin|createClient/i.test(muat),
        "the loader does not read the band, the code and its name with the reader's own client");
      const hal = kode(readFileSync(join(repoRoot, "src/app/studio/paket/[course]/page.tsx"), "utf8"));
      // restated at A1 (D-166(b) decision 5, retrospective R3): the band is a bare word on the meta line, with no «Prediksi:» label
      c.expect(/q\.pita \? <> · \{sl\(`mengajar\.cepat\.tingkat\.\$\{q\.pita\}` as HleEvent\)\}<\/> : null/.test(hal)
        && /o\.miskonsepsi \?[\s\S]{0,200}studio\.soal\.miskonsepsi[\s\S]{0,80}o\.miskonsepsi\.nama \?\? o\.miskonsepsi\.kode/.test(hal),
        "the package page does not draw the band or the misconception");
      return c.verdict("the reviewer's questions carry the author's band (Sulit, Mudah, none) and each option's misconception by name (the code where unnamed), read under the reader's own access");
    },
  },
  {
    id: "D168-D2-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const kotor = namaBerkas('Sertifikat Penguasaan · Pecahan: 1/2 * 3? "Bab" <A> | B\\C');
      c.expect(!/[/\\:*?"<>|]/.test(kotor) && kotor.startsWith("Sertifikat Penguasaan · Pecahan") && !/\s{2}|--/.test(kotor), `a title with forbidden characters gives «${kotor}»`);
      const panjang = namaBerkas(`Sertifikat Penguasaan · ${"Kata ".repeat(40)}`);
      c.expect(panjang.length <= BATAS_NAMA_BERKAS && panjang.length >= BATAS_NAMA_BERKAS - 30 && !/\s$/.test(panjang) && BATAS_NAMA_BERKAS === 150, `a 200-character title gives ${panjang.length} characters`);
      c.expect(namaBerkas("Sertifikat Penguasaan · Matematika") === "Sertifikat Penguasaan · Matematika", "a clean title is changed");
      const hal = kode(readFileSync(join(repoRoot, "src/app/belajar/[tugas]/sertifikat/page.tsx"), "utf8"));
      c.expect(/const judulBerkas = namaBerkas\(t\("sertifikat\.berkas", "learner", \{ locale: bahasaSertifikat \}\)\.replace\("\{kursus\}", course\)\);/.test(hal), "the certificate's PDF is not named through namaBerkas from the package's title");
      const aksi = kode(readFileSync(join(repoRoot, "src/components/sertifikat/AksiCetak.tsx"), "utf8"));
      c.expect(/const semula = document\.title;\s*if \(judulBerkas\) document\.title = judulBerkas;\s*window\.print\(\);\s*document\.title = semula;/.test(aksi)
        && /addEventListener\("afterprint", sesudah\)/.test(aksi), "the tab's title is not put back after a print or a cancelled print");
      return c.verdict(`the saved PDF's name holds on every system (forbidden characters replaced, capped at ${BATAS_NAMA_BERKAS}), names the package only, and the tab's title returns after print or cancel`);
    },
  },
  {
    id: "D168-B1-4",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src/app/globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      const umum = /\*:focus-visible \{ outline: (var\(--border-focus\) solid var\(--focus-ring\)); outline-offset: (2px); \}/.exec(css);
      const tanggal = /input:is\(\[type="date"\], \[type="datetime-local"\], \[type="time"\]\):focus-within:not\(:focus\) \{ outline: ([^;]+); outline-offset: ([^;]+); \}/.exec(css);
      c.expect(!!umum && !!tanggal && tanggal[1] === umum[1] && tanggal[2] === umum[2], "the date field's calendar button has no focus ring, or a ring of its own look");
      return c.verdict("a date field's calendar button shows the same ring as every other Tab stop (the field carries it while focus is within)");
    },
  },
  {
    id: "D168-K4-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => kode(readFileSync(join(repoRoot, f), "utf8"));
      const fd = new FormData();
      fd.set("asal", "cabut"); fd.set("hal_peran", "2"); fd.set("baris", "0f81f5a6-aeb9-45d8-aef6-431a02100818"); fd.set("hal_x", "<b>"); fd.set("nama", "Sari");
      const q = queryHasil("roles", { ok: true, kode: "ROLE_REVOKED" }, fd);
      c.expect(q.get("asal") === "cabut" && q.get("hal_peran") === "2" && q.get("baris") === "0f81f5a6-aeb9-45d8-aef6-431a02100818" && !q.has("hal_x") && !q.has("nama"),
        `queryHasil carries ${q.toString()}`);
      const jahat = new FormData(); jahat.set("asal", "Cabut<script>"); jahat.set("baris", "x");
      const q2 = queryHasil("roles", { ok: false, kode: "ACTION_FAILED" }, jahat);
      c.expect(!q2.has("asal") && !q2.has("baris"), "a forged origin or row reaches the page");
      const R = (props: unknown) => render(repoRoot, "src/components/HasilDi.tsx", props);
      const q3 = { bagian: "kesehatan", hasil: "ok", baris: "a" };
      const diBaris = R({ q: q3, bagian: "kesehatan", baris: "a", kalimat: "OK" }), barisLain = R({ q: q3, bagian: "kesehatan", baris: "b", kalimat: "OK" });
      const daftarAda = R({ q: q3, bagian: "kesehatan", barisDiHalaman: ["a", "b"], kalimat: "OK" }), daftarTiada = R({ q: q3, bagian: "kesehatan", barisDiHalaman: ["b"], kalimat: "OK" });
      c.expect(/OK/.test(diBaris.html) && !/OK/.test(barisLain.html) && !/OK/.test(daftarAda.html) && /OK/.test(daftarTiada.html),
        "HasilDi does not answer a row in its row, and a row not on the page at the list");
      const konf = baca("src/app/konfigurasi/page.tsx");
      c.expect(/const result = \(section: string, asal\?: string\) =>\s*sp\.bagian === section && sp\.hasil && \(asal \? asalKini === asal : asalKini === null\)/.test(konf), "Konfigurasi's result line does not follow the form's origin");
      const ASAL: Array<[string, string, string]> = [["revokeRoleAction", "roles", "cabut"], ["tunjukAdminPertamaAction", "roles", "pertama"],
        ["transferAuthorizeAction", "transfers", "baris"], ["transferExecuteAction", "transfers", "baris"], ["transferRejectAction", "transfers", "baris"],
        ["transferTerimaAction", "transfers", "terima"], ["jadwalkanPemeliharaanAction", "pemeliharaan", "jadwal"], ["ubahPemeliharaanAction", "pemeliharaan", "jendela"],
        ["terbitkanPengumumanAction", "pemeliharaan", "umumkan"], ["tarikPengumumanAction", "pemeliharaan", "tarik"], ["hentikanSekarangAction", "pemeliharaan", "henti"]];
      for (const [aksi, bagian, asal] of ASAL) {
        const form = new RegExp(`<form\\b[^>]*action=\\{${aksi}\\}[^>]*><input type="hidden" name="asal" value="${asal}" />`);
        c.expect(form.test(konf) && konf.includes(`{result("${bagian}", "${asal}")}`), `Konfigurasi: ${aksi} is not answered at its form («${asal}»)`);
      }
      c.expect(/action=\{grantRoleAction\}[^>]*><input type="hidden" name="asal" value="angkat" \/>/.test(konf) && konf.includes('{result("roles", "angkat")}'), "the appointment's confirmation is not answered at itself");
      c.expect(/sp\.baris === l\.id \? hasilLapor\(\) : null/.test(konf) && /name="hal_lapor"/.test(konf), "a problem report's move is not answered in its row");
      const aksiKonf = baca("src/app/konfigurasi/actions.ts");
      c.expect(!/back\("(roles|transfers)", (?:(?!, fd\);).)*\);/.test(aksiKonf) && /kembaliPemeliharaan = \(h: HasilAksi, fd\?: FormData\)/.test(aksiKonf), "a Konfigurasi action returns without its form");
      for (const [f, bagian, baris] of [["src/app/studio/definisi/page.tsx", "definisi-baris", "d.id"], ["src/app/studio/bank/page.tsx", "kesehatan", "i.id"],
        ["src/app/studio/integritas/page.tsx", "integritas", "g.id"], ["src/app/studio/paket/[course]/page.tsx", "koreksi", "a.id as string"]]) {
        const src = baca(f);
        c.expect(src.includes(`<HasilDi q={sp} bagian="${bagian}" baris={${baris}} kalimat={banner} />`) && new RegExp(`<HasilDi q=\\{sp\\} bagian="${bagian}" kalimat=\\{banner\\} barisDiHalaman=`).test(src),
          `${f}: a row's action is not answered in its row`);
      }
      const kanonik = baca("src/app/studio/kanonik/page.tsx");
      c.expect(kanonik.includes('<HasilDi q={sp} bagian="izin-beri" kalimat={banner} />') && kanonik.includes('<HasilDi q={sp} bagian="izin-tarik" kalimat={banner} />') && !/bagian="izin"/.test(kanonik), "the distribution forms are not answered at each form");
      const studio = baca("src/app/studio/actions.ts");
      c.expect(!/back\("\/studio\/kanonik", "izin",/.test(studio) && !/`koreksi-\$\{assignment\}`/.test(studio), "a Studio result names a section no page reads");
      c.expect(/<HasilDi q=\{sp\} bagian=\{\["paket", "temuan", "koreksi"\]\}/.test(baca("src/app/studio/page.tsx")), "a package-less Studio refusal is answered nowhere");
      c.expect(/sp\.galat === "baris" \? <BarisHasil nada="gagal">\{s\("pendataan\.buka\.gagal"\)\}/.test(baca("src/app/pendataan/page.tsx")), "an intake file that would not open is answered nowhere");
      c.expect(/"cabut", \{ pilih: id \}\)/.test(baca("src/app/konfigurasi/sertifikat/actions.ts")) && /sp\.kode === "CONTEXT_OTHER_PLACE"/.test(baca("src/app/konfigurasi/sertifikat/page.tsx")),
        "a revocation refused for its context loses its certificate, or is called a service failure");
      const pd = baca("src/app/pendataan/[pekerjaan]/page.tsx");
      c.expect(pd.indexOf('sp.galat === "konfirmasi"') > pd.indexOf("<DaftarNama") && pd.indexOf('sp.galat === "percontohan"') > pd.indexOf("barisPercontohan.map"), "Pendataan's refusals are said above what stands between them and their button");
      return c.verdict("every result names its form and row, comes back with its list's page, and is said at that form or row; no result names a part no page reads");
    },
  },
  {
    id: "D168-B4-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { templatKartu } = await import("../src/components/email/identitas");
      const { KELUARGA_PERAN } = await import("../src/lib/kartu-pintar");
      const teks = (x: string) => x.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      for (const konteks of [[{ peran: "SYSTEM_ADMIN", institusi: null }, { peran: "EDUCATOR", institusi: "SMP Sintetis Satu" }],
        [{ peran: "EDUCATOR", institusi: "SMP Sintetis Satu" }, { peran: "SYSTEM_ADMIN", institusi: null }]]) {
        const kartu = { nama: "Nadia Putri", pintarId: "A14CD7ST", tautanId: "https://app.pintarselalu.com/id/A14CD7ST", konteks };
        const r = render(repoRoot, "src/components/kartu/KartuPintar.tsx", { locale: "id", kartu });
        if (!c.expect(r.ok, `the card could not be rendered: ${r.galat}`)) continue;
        const baris = [...r.html.matchAll(/<li class="pin-kd-bab-baris">([\s\S]*?)<\/li>/g)].map((m) => teks(m[1]));
        const e = templatKartu({ ...kartu, konteks: konteks as never, tautanAkun: "https://app.pintarselalu.com/akun" }, { asal: "https://app.pintarselalu.com", staging: false });
        // RESTATED, D1 step 2: the email's card block rows (pin-kartu-baris), no longer label rows of its own
        const email = [...e.html.matchAll(/<p class="pin-kartu-baris"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => teks(m[1]));
        const harap = [t("role.SYSTEM_ADMIN" as HleEvent, "staff", { locale: "id" }), `${t("role.EDUCATOR" as HleEvent, "staff", { locale: "id" })} · SMP Sintetis Satu`];
        c.expect(JSON.stringify(baris) === JSON.stringify(harap), `from ${konteks.map((k) => k.peran).join(",")}: the card shows ${JSON.stringify(baris)}, want ${JSON.stringify(harap)}`);
        c.expect(JSON.stringify(email) === JSON.stringify(baris), `the email lists ${JSON.stringify(email)}, the card ${JSON.stringify(baris)}`);
        // and the email's band takes the same first role's family colour (D1: --kartu-admin-platform)
        c.expect(/bgcolor="#5E6062"/i.test(e.html.slice(e.html.indexOf('class="pin-kartu-pintar"'))), "the email's card band is not the first role's family colour (Admin platform)");
        const keluarga = /data-keluarga="([^"]+)"/.exec(r.html)?.[1];
        c.expect(!!keluarga && keluarga === (KELUARGA_PERAN as Record<string, string>).SYSTEM_ADMIN, `the card's colour is ${keluarga}, not the first role's (${(KELUARGA_PERAN as Record<string, string>).SYSTEM_ADMIN})`);
      }
      return c.verdict("«Admin platform» on its own line, then «Guru · SMP …», on the rendered card and in its email, whatever order the database gives, in the first role's colour");
    },
  },
  {
    id: "D168-SERAH-1",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => kode(readFileSync(join(repoRoot, f), "utf8"));
      const semua: string[] = [];
      const jalan = (d: string) => { for (const e of readdirSync(join(repoRoot, d), { withFileTypes: true })) { const f = `${d}/${e.name}`; if (e.isDirectory()) jalan(f); else if (f.endsWith(".tsx")) semua.push(f); } };
      jalan("src");
      const resmi = semua.filter((f) => !/\/email\//.test(f) && f !== "src/components/sertifikat/KartuSertifikat.tsx" && /format\.date\(/.test(baca(f)));
      c.expect(resmi.length === 0, `a screen writes the formal date: ${resmi.join(", ")}`);
      const pemain = baca("src/app/belajar/_components/ItemPlayer.tsx");
      c.expect(/aria-describedby=\{!chosen && !committed \? "jawab-alasan" : undefined\}/.test(pemain) && /<AlasanNonaktif id="jawab-alasan">\{kata\("alasan\.nonaktif\.jawab"\)\}<\/AlasanNonaktif>/.test(pemain),
        "the learner's answer button does not say why it is disabled");
      c.expect(t("alasan.nonaktif.jawab" as HleEvent, "learner", { locale: "id" }) === "Pilih satu jawaban dulu." && t("alasan.nonaktif.periksa" as HleEvent, "staff", { locale: "id" }) === "Pilih buku kerja dulu.", "the reasons are not Daisy's words");
      const nilai = baca("src/components/bukti/NilaiLaporan.tsx");
      c.expect(/const s = \(k: string\) => t\(k as HleEvent, persona, \{ locale \}\);/.test(nilai) && /<dt>\{s\(k\)\}<\/dt>/.test(nilai) && !/: k\}<\/dt>/.test(nilai), "the report body is not in the reader's words, or can draw a raw key");
      const kls = baca("src/app/pimpinan/[simpul]/umpan-balik/kelas/[kelas]/page.tsx");
      c.expect(/if \(!ini\) \{[\s\S]{0,200}messageKey="umpanbalik\.buka\.tanpa_wewenang"/.test(kls) && !/ini\?\.nama \?\? ""/.test(kls), "a class outside the branch is drawn with an empty heading");
      c.expect(!/display_name \?\? ""/.test(baca("src/app/pimpinan/[simpul]/murid/[orang]/page.tsx")), "a learner's page can draw an empty heading");
      c.expect(/sl\(platformKonteks \? "lapor\.triase\.arti_platform" : "lapor\.triase\.arti"\)/.test(baca("src/app/konfigurasi/page.tsx"))
        && !/Anda/.test(t("lapor.triase.arti_platform" as HleEvent, "staff", { locale: "id" })), "«Seluruh platform» speaks of «your school»");
      for (const k of ["config.pemeliharaan.tabrakan.terakhir", "config.pemeliharaan.tabrakan.saran"]) {
        c.expect(!/pukul\s*$/.test(t(k as HleEvent, "staff", { locale: "id" })) && !/\bat\s*$/.test(t(k as HleEvent, "staff", { locale: "en" })), `${k} puts «pukul» before a day`);
      }
      return c.verdict("the hand-off's remaining rows hold: screen dates by their use, disabled buttons with their reason, the report body in the reader's words with no key, no empty heading, the platform's own sentence, no «pukul» before a day");
    },
  },
  {
    id: "D168-E1-1",
    run: async ({ repoRoot }) => {
      // E-E1-1 (D-170(c), D-171(a)): the rail, its names and its tooltip; the collapse control (E1 §1, §4)
      const c = new Checks();
      const baca = (f: string) => kode(readFileSync(join(repoRoot, f), "utf8"));
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      // rendered: a place's link is named by its own word, carries no aria-label or title, and its tooltip is the same word, aria-hidden
      const r = render(repoRoot, "src/components/ItemNav.tsx", { href: "/studio", label: "Studio", kini: true });
      c.expect(r.ok, `ItemNav could not be rendered: ${r.galat}`);
      c.expect(/<span class="pin-nav-label">Studio<\/span><span class="pin-nav-tip" aria-hidden="true">Studio<\/span>/.test(r.html), `a place's word or its tooltip is not as specified: ${r.html.slice(0, 240)}`);
      c.expect(!/aria-label=|title=/.test(r.html) && /aria-current="page"/.test(r.html), "a place carries an aria-label or a title, or the current place is not marked");
      // the rail: by default from 1024 to 1279 px unless expanded, and at 1280 px and up when collapsed; 72 px; words visually hidden
      const blok = (q: string, akhir = false) => { const i = akhir ? css.lastIndexOf(q) : css.indexOf(q); if (i < 0) return ""; const j = css.indexOf("{", i); let d = 0; for (let k = j; k < css.length; k++) { if (css[k] === "{") d++; else if (css[k] === "}" && --d === 0) return css.slice(j, k); } return ""; };
      const rentang = blok("@media (min-width: 1024px) and (max-width: 1279px)");
      const lebar = blok("@media (min-width: 1280px)", true);
      for (const [nama, isi, pilih] of [["1024-1279 px", rentang, '.pin-shell.pin-staf:not([data-ciut="tidak"])'], ["1280 px and up", lebar, '.pin-shell.pin-staf[data-ciut="ya"]']] as const) {
        const esc = pilih.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        c.expect(new RegExp(`${esc} \\{ width: var\\(--shell-rail\\)`).test(isi), `${nama}: the shell is not the 72 px rail`);
        c.expect(new RegExp(`${esc} :is\\(\\.pin-nav-label, \\.pin-rail-teks, \\.pin-sesi-ket strong\\) \\{\\s*position: absolute; width: 1px; height: 1px;[^}]*clip: rect\\(0 0 0 0\\)`).test(isi), `${nama}: the rail's words are not visually hidden`);
        c.expect(new RegExp(`${esc} \\[data-tip-host\\]\\[data-tip-xy\\]:focus-visible:not\\(\\[data-tip-tutup\\]\\) > \\.pin-nav-tip \\{ display: block`).test(isi), `${nama}: a focused rail item shows no tooltip`);
      }
      c.expect(!/\.pin-nav-label[^{]*\{[^}]*display:\s*none/.test(css), "a place's word is removed with display: none somewhere");
      // the tooltip shows only in the rail: every rule that draws it names a rail state
      const drawn = [...css.matchAll(/([^{}]+)\{[^{}]*display:\s*block[^{}]*\}/g)].map((m) => m[1].trim()).filter((q) => q.includes(".pin-nav-tip"));
      c.expect(drawn.length >= 4 && drawn.every((q) => /data-ciut="ya"|:not\(\[data-ciut="tidak"\]\)/.test(q)), `a tooltip is drawn outside the rail: ${drawn.join(" | ")}`);
      c.expect(/^\.pin-nav-tip \{ display: none; \}/m.test(css), "the tooltip is not hidden by default");
      // every place has its icon, so no place is blank in the rail
      const { IKON_TEMPAT } = await import("../src/components/ikon-tempat");
      const { URUTAN_TEMPAT } = await import("../src/lib/nama-tempat");
      const tanpa = URUTAN_TEMPAT.filter((h) => !IKON_TEMPAT[h]);
      c.expect(tanpa.length === 0, `a place has no icon and draws nothing in the rail: ${tanpa.join(", ")}`);
      // the collapse control: hidden until its state is known, words from the rail's state, no aria-label
      const ciut = baca("src/components/TombolCiut.tsx");
      c.expect(/hidden=\{rel === null\}/.test(ciut) && /aria-expanded=\{rel === null \? undefined : !rel\}/.test(ciut)
        && /setRel\(shell\.getBoundingClientRect\(\)\.width <= 80\)/.test(ciut) && /\{rel \? lebarkan : ciutkan\}/.test(ciut) && !/aria-label/.test(ciut),
        "the collapse control does not name the state it offers from the rail's own state");
      c.expect(/e\.key !== "Escape"/.test(ciut) && /tipTutup/.test(ciut), "a rail tooltip cannot be dismissed with Escape (1.4.13)");
      const cangkang = baca("src/components/CangkangPengalaman.tsx");
      c.expect(/<TombolCiut ciutkan=\{t\("nav\.ciutkan", persona, \{ locale \}\)\} lebarkan=\{t\("nav\.lebarkan", persona, \{ locale \}\)\} \/>/.test(cangkang), "the staff shell has no collapse control");
      for (const [k, id, en] of [["nav.ciutkan", "Ciutkan navigasi", "Collapse navigation"], ["nav.lebarkan", "Lebarkan navigasi", "Expand navigation"]] as const) {
        c.expect(t(k as HleEvent, "staff", { locale: "id" }) === id && t(k as HleEvent, "staff", { locale: "en" }) === en, `${k} is not the design system's word`);
      }
      // the bottom group keeps its words as names in the rail (visually hidden), beside the icon
      c.expect(/<span className="pin-rail-teks">\{t\("nav\.bantuan"/.test(baca("src/components/tur/TombolBantuan.tsx"))
        && /<Ikon nama="triangle-alert"[^>]*\/>\s*<span className="pin-rail-teks">\{t\("nav\.lapor"/.test(baca("src/components/lapor/TautanLapor.tsx"))
        && /<Ikon nama="log-out" \/>\s*<span className="pin-rail-teks">\{s\("sesi\.keluar"\)\}/.test(baca("src/components/BarisSesi.tsx")),
        "Bantuan, «Laporkan masalah» or «Keluar» loses its word in the rail");
      return c.verdict("in the rail every place keeps its own word as its name, visually hidden (never display: none, no aria-label or title), with an aria-hidden tooltip of the same word shown only while the shell is the rail; the rail is 72 px from 1024 to 1279 px unless expanded and at 1280 px when collapsed; every place has an icon; the collapse control names the state it offers from the rail's own state and is hidden until it knows it");
    },
  },
  {
    id: "D168-E2-1",
    run: async ({ repoRoot }) => {
      // E2 (D-169(c)) with E1: the context control, the chooser's door, the drawer, the places' one order (O12)
      const c = new Checks();
      const baca = (f: string) => kode(readFileSync(join(repoRoot, f), "utf8"));
      const nav = baca("src/components/NavKonteks.tsx");
      const blok = nav.slice(nav.indexOf("export async function blokKonteks"));
      c.expect(blok.length > 0 && /if \(k\?\.keadaan !== "ADA"\) return null;/.test(blok), "there is no context control, or it is drawn without a context");
      c.expect(/istilah\("context\.manage_label"\)/.test(blok) && /"nav\.pembelajaran" : "nav\.kelas"/.test(blok), "the purpose's short name is not Mengajar, Belajar or G1's slot");
      const pilihan = [...blok.matchAll(/\{lain \? \(/g)].length;
      c.expect(pilihan === 2 && /<Link href="\/" className="pin-konteks-pilih"/.test(blok) && /<Link href="\/" className="pin-nav-item pin-konteks-rail"/.test(blok),
        "the chooser (block and rail item) is not offered exactly when the person holds another context");
      c.expect(/<span className="pin-konteks-inisial" aria-hidden="true">/.test(blok) && /const railNama = \[pilih, tujuan, tempat\]\.filter\(Boolean\)\.join\(" · "\)/.test(blok),
        "the rail item is not named «Mau ke mana hari ini? · purpose · place», or its initials are read");
      const iNav = nav.indexOf('if (bentuk === "nav")');
      const navItems = iNav < 0 ? "" : nav.slice(iNav, nav.indexOf("\n  }\n", iNav));
      c.expect(navItems.includes("<ItemNav") && !/data-konteks-tempat|data-konteks-pilih/.test(navItems), "the navigation's items still carry the place and the chooser after the places");
      const cangkang = baca("src/components/CangkangPengalaman.tsx");
      c.expect(/<nav className="pin-tabs" aria-label=\{t\("nav\.tempat", persona, \{ locale \}\)\}>\s*\{blok\}\s*\{urutkanNav\(nav\)\}/.test(cangkang), "the context control is not the navigation's first part");
      // O12: the places in one order, the DOM's
      const { URUTAN_TEMPAT } = await import("../src/lib/nama-tempat");
      c.expect(JSON.stringify(URUTAN_TEMPAT) === JSON.stringify(["/mengajar", "/pimpinan", "/konfigurasi", "/pendataan", "/aktivasi", "/studio", "/konfigurasi/keamanan", "/konfigurasi/email-uji", "/konfigurasi/sertifikat", "/belajar"]),
        "the places' order is not O12's");
      // the chooser's door: the current one marked four ways
      const beranda = baca("src/app/page.tsx");
      c.expect(/aria-current=\{di \? "true" : undefined\}/.test(beranda) && /<Ikon nama=\{di \? "check" : "chevron-right"\} \/>/.test(beranda) && /className=\{`\$\{PINTU\} pin-pintu w-full text-left`\}/.test(beranda),
        "the current door is not marked by its check and aria-current, or still by weight alone");
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      c.expect(/\.pin-pintu\[aria-current="true"\] \{\s*background: var\(--pintar-primary-soft\); border-color: var\(--pintar-primary\);/.test(css), "the current door has no primary edge or ground");
      // the drawer: a modal with «Buka menu» / «Tutup menu», focus in and back, the page inert; after «Keluar»
      const laci = baca("src/components/TombolLaci.tsx");
      c.expect(/aria-expanded=\{terbuka\}/.test(laci) && /setAttribute\("role", "dialog"\)/.test(laci) && /setAttribute\("aria-modal", "true"\)/.test(laci)
        && /\.inert = true/.test(laci) && /e\.key === "Escape"/.test(laci) && /tombol\.current\?\.focus\(\)/.test(laci) && /\{terbuka \? kataTutup : kataBuka\}/.test(laci) && !/aria-label=\{/.test(laci),
        "the drawer is not a modal that takes focus in and gives it back, named «Buka menu» / «Tutup menu»");
      c.expect(/\{sesi\}\s*<TombolLaci buka=\{t\("nav\.buka_menu"/.test(cangkang), "«Buka menu» does not follow «Keluar»");
      c.expect(/\.pin-staf\[data-laci-js\] :is\(\.pin-laci-saklar, \.pin-laci-tombol\) \{ display: none; \}/.test(css) && /\.pin-staf \.pin-laci-saklar \{ display: none; \}/.test(css),
        "the script-less menu control stays beside the button, or is a Tab stop at 1024 px and wider");
      return c.verdict("the context control is the navigation's first part (the purpose's short name, the place, the chooser only with another context; in the rail one item named «Mau ke mana hari ini? · purpose · place»); the places follow O12's one order in the DOM; the chooser's current door is marked by its check, edge, ground and aria-current; the drawer is a modal named «Buka menu» / «Tutup menu» after «Keluar», taking focus in and back");
    },
  },
  {
    id: "D168-B1-2",
    run: async ({ repoRoot }) => {
      // B1 §1 «Jejak audit», RV-24: the audit trail is the design system's Table with its caption; «Versi» is Admin
      // platform's diagnostic, drawn only when a row on the page carries a build, and a row without one is left empty
      const c = new Checks();
      const src = kode(readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      const i = src.indexOf('<section id="audit"');
      const audit = i < 0 ? "" : src.slice(i, src.indexOf("</section>", i));
      c.expect(/<div className="pin-tabel-bingkai[^"]*" role="region" tabIndex=\{0\} aria-labelledby="pin-jejak-judul">\s*<table className="pin-tabel/.test(audit)
        && /<caption id="pin-jejak-judul"/.test(audit) && (audit.match(/<th scope="col">/g) ?? []).length === 4, "the audit trail is not the design system's Table with its caption and column headers");
      c.expect(/const adaVersi = platformIni && barisJejak\.some\(\(r\) => Boolean\(r\.build_sha\)\);/.test(src)
        && /\{adaVersi \? <th scope="col">\{s\("config\.label\.build"\)\}<\/th> : null\}/.test(audit) && !/\{platformIni \?/.test(audit),
        "«Versi» is drawn for a page none of whose rows carries a build, or for a reader who is not Admin platform");
      c.expect(/\{r\.build_sha \? short\(r\.build_sha\) : ""\}/.test(audit), "a row without a build shows «—» in «Versi»");
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/\.pin-tabel tbody tr:where\(:nth-child\(even\)\) > \* \{ background: var\(--table-row-alt\); \}/.test(css)
        && /@media print \{ \.pin-tabel tbody tr > \* \{ -webkit-print-color-adjust: exact; print-color-adjust: exact; \} \}/.test(css), "the Table's stripes are not drawn, or do not reach the paper");
      return c.verdict("the audit trail is the design system's Table, captioned, striped on screen and on paper; «Versi» is drawn for Admin platform only when a row on the page carries a build, and an unbuilt row's cell is empty");
    },
  },
  {
    id: "D168-B1-3",
    run: async ({ repoRoot }) => {
      // B1 §1 «Records», §4: a record's one action is at its row's end, named with its record; it opens in place (the row
      // takes surface-2 and shows its short form, with «Batal»), one row at a time, carried in the address (?ubah=)
      const c = new Checks();
      const src = kode(readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      c.expect(/const ubah = uuidSah\(sp\.ubah\) \? sp\.ubah! : null;/.test(src) && /if \(id\) q\.set\("ubah", id\);/.test(src), "the open record is not carried in the address, or not checked");
      const bagian = (id: string) => { const i = src.indexOf(`<section id="${id}"`); return i < 0 ? "" : src.slice(i, src.indexOf("</section>", i)); };
      for (const [id, kunci, nama, aksi] of [["roles", 's("config.action.revoke")', "personName.get(a.person_id) ?? TANPA_NAMA", "revokeRoleAction"], ["ketuntasan", 'sl("config.ketuntasan.tombol")', "p.title", "tetapkanBatasAction"],
        ["laporan-masalah", 'sl("lapor.triase.ubah")', "l.terjadi.slice(0, 80)", "pindahkanLaporanAksi"],
        ["transfers", 's("config.action.reject")', "namaPindah.get(x.person_id) ?? namaMasuk.get(x.id) ?? TANPA_NAMA", "transferRejectAction"]] as const) {
        const b = bagian(id);
        const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        c.expect(new RegExp(`data-buka-ubah="">\\s*\\{${esc(kunci)}\\}<span className="pin-sr"> · \\{${esc(nama)}\\}</span>`).test(b),
          `${id}: the row's action is not named with its record`);
        c.expect(new RegExp(`<form action=\\{${aksi}\\}[^>]*aria-label=\\{\`\\$\\{${esc(kunci)}\\} · \\$\\{${esc(nama)}\\}\`\\}`).test(b), `${id}: the opened form is not named like its action`);
        c.expect(/ubah === [a-z]\.(id|course_id) \? "bg-surface-2"/.test(b) && /\{s\("config\.angkat\.batal"\)\}<\/Link>/.test(b), `${id}: the opened row does not take surface-2 or has no «Batal»`);
        c.expect((b.match(new RegExp(`<form action=\\{${aksi}\\}`, "g")) ?? []).length === 1 && /ubah !== [a-z]\.(id|course_id)/.test(b), `${id}: a row's form is drawn while it is closed`);
      }
      // Persiapan sekolah (J3.2): each step's state is a badge, «Sudah» ok with its icon, «Belum» neutral
      c.expect(/<strong className="pin-pill pin-ok pin-pill-ikon"><Ikon nama="check" \/>\{sl\("config\.persiapan\.sudah"\)\}<\/strong>/.test(src)
        && /<strong className="pin-pill pin-neutral">\{sl\("config\.persiapan\.belum"\)\}<\/strong>/.test(src), "Persiapan sekolah's steps are not marked by their badges");
      c.expect(/<TombolKirim className=\{bahaya\}[^>]*>\{s\("config\.action\.revoke"\)\}/.test(bagian("roles")), "the revocation's confirming button is not destructive");
      // a problem report is an article named by what happened, its state a badge, «Menghentikan kelas» an attention badge
      const lapor = bagian("laporan-masalah");
      c.expect(/<article className="grid gap-2" aria-labelledby=\{`laporan-judul-\$\{l\.id\}`\}>\s*<h2 id=\{`laporan-judul-\$\{l\.id\}`\}[^>]*>\{l\.terjadi\}<\/h2>/.test(lapor)
        && /<strong className="pin-pill pin-neutral" data-status-laporan="">/.test(lapor) && /pin-pill pin-attention pin-pill-ikon"><Ikon nama="triangle-alert" \/>/.test(lapor)
        && /<dl className="grid gap-1 text-ink-2">/.test(lapor), "a problem report is not an article named by what happened, with its state and «Menghentikan kelas» as badges and its answers as a description list");
      return c.verdict("Peran & akses and Batas ketuntasan are records: each row's one action is named with its record and opens its short form in place, one at a time, in the address (?ubah=), the row on surface-2 with «Batal»; the revocation's confirming button is destructive");
    },
  },
  {
    id: "D168-KATA-1",
    run: async ({ repoRoot }) => {
      // F03-R02's false positive: the learner-surface check reads PINTAR's own words, never the author's content. An
      // option «Salah satu lebih besar» is Indonesian, not a verdict; «Salah» as PINTAR's badge or feedback is one.
      const c = new Checks();
      const kata = (html: string) => { const x = visibleText(tanpaIsiMateri(html)); return INTERNAL_WORDS.filter((w) => w !== "PINTAR 4.0" && new RegExp(`\\b${w}\\b`).test(x)); };
      const opsi = '<label><input type="radio"/><span><span data-isi-materi="">Salah satu lebih besar</span></span></label>';
      c.expect(kata(opsi).length === 0, "an authored option «Salah satu lebih besar» is flagged as a verdict");
      c.expect(kata('<div data-isi-materi="" class="pin-isi-materi"><p>Jawaban yang <strong>salah</strong>: Salah satu sisi</p><div><p>Salah</p></div></div>').length === 0,
        "authored content with nested elements of its own tag is not set aside whole");
      // the product rule stands: PINTAR's own verdict beside the content, or as feedback, is caught
      c.expect(kata(`${opsi}<span class="pin-pill">Salah</span>`).includes("Salah"), "PINTAR's «Salah» badge beside an option is not caught");
      c.expect(kata('<p role="status">Incorrect, try again</p><span data-isi-materi="">Dua</span>').includes("Incorrect"), "PINTAR's feedback outside the content is not caught");
      c.expect(kata('<div data-isi-materi=""><p>Tiga</p></div><p>Wrong</p>').includes("Wrong"), "a verdict after the content is set aside with it");
      c.expect(kata('<span data-other="">Salah</span>').includes("Salah"), "an element not marked as content is set aside");
      // an unclosed marker sets nothing aside (the scan is never narrowed by malformed markup)
      c.expect(kata('<span data-isi-materi="">Dua <p>Salah</p>').includes("Salah"), "an unclosed content marker hides the page after it");
      // the shared renderer marks what it draws, and the player draws the stem, the stimulus and every option through it
      const r = render(repoRoot, "src/components/teks/Teks.tsx", { teks: "Salah satu **lebih** besar" }, "TeksBaris");
      c.expect(r.ok && /^<span data-isi-materi="">Salah satu <strong>lebih<\/strong> besar<\/span>$/.test(r.html), `TeksBaris does not mark its content: ${r.html || r.galat}`);
      const b = render(repoRoot, "src/components/teks/Teks.tsx", { teks: "Salah satu" });
      c.expect(b.ok && /^<div data-isi-materi="" class="pin-isi-materi">/.test(b.html) && kata(b.html).length === 0, `TeksBlok does not mark its content: ${b.html || b.galat}`);
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/\.pin-isi-materi \{ display: contents; \}/.test(css), "TeksBlok's wrapper changes the layout");
      const pemain = readFileSync(join(repoRoot, "src/app/belajar/_components/ItemPlayer.tsx"), "utf8");
      c.expect(/<TeksBaris teks=\{current\.item\.stem\} \/>/.test(pemain) && /<TeksBaris teks=\{o\.teks\} \/>/.test(pemain), "the player draws a stem or an option outside the shared renderer");
      // no seed is held to avoid ordinary words: the option stays as it was written
      const benih = readFileSync(join(repoRoot, "supabase/seed/learning_cycle.sql"), "utf8");
      c.expect(benih.includes("'B','Salah satu lebih besar'"), "the seed's option was rewritten to satisfy the scan");
      return c.verdict("the learner-surface scan reads PINTAR's own words only: authored content (marked by TeksBaris/TeksBlok, through which the player draws stems and options) is set aside whole, nested or not; PINTAR's «Salah» badge or «Incorrect»/«Wrong» feedback beside or after it is still caught, an unclosed marker narrows nothing, and the seed keeps «Salah satu lebih besar»");
    },
  },
  {
    id: "D168-B1-7",
    run: async ({ repoRoot }) => {
      // B1 §1 «Every section's pattern» for Pindah kelas, Peserta, Laporan, Sistem & Konfigurasi, Pergantian tahun ajaran
      // and Templat laporan: forms at measure-narrow with two short fields sharing a row, records as rows on a rule,
      // each row's action named with its record, badges for state, dates in words
      const c = new Checks();
      const src = kode(readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      const bagian = (id: string) => { const i = src.indexOf(`<section id="${id}"`); return i < 0 ? "" : src.slice(i, src.indexOf("</section>", i)); };
      const sempit = /className="mt-[34] grid max-w-\[var\(--measure-narrow\)\] gap-[23]"/;
      // Pindah kelas: «Dari» then «Tampilkan murid» (GET), then the Kelas's students as rows, each «Pindahkan · name»
      const pindah = bagian("pindah");
      c.expect(/<form method="get" action="\/konfigurasi\/pindah#pindah"/.test(pindah) && sempit.test(pindah), "Pindah kelas's first step is not a narrow GET form");
      c.expect(/<h2 className="text-sm font-medium text-ink-1">\{namaKelas\(kelasDari\)\}<\/h2>/.test(pindah) && /<li key=\{m\.penempatan\} className="grid gap-2 border-b border-line-1/.test(pindah)
        && /\{sl\("config\.pindah\.tombol"\)\}<span className="pin-sr"> · \{m\.nama\}<\/span>/.test(pindah), "Pindah kelas's students are not rows under their Kelas, each «Pindahkan» named with the student");
      // Peserta: the form (two selects sharing a row), then «Catatan pengembangan profesi» as link rows under its h2
      const peserta = bagian("peserta");
      c.expect(sempit.test(peserta) && /<div className="pin-baris-isian">\s*<label className=\{label\}>\{sl\("config\.peserta\.orang"\)\}/.test(peserta)
        && /<h2 className="font-medium text-ink-1">\{sl\("config\.peserta\.catatan"\)\}<\/h2>/.test(peserta), "Peserta is not a narrow form with «Orang» and «Tempat» sharing a row, then its records under their heading");
      // Laporan: link rows, the school's summary first, then each active class's under its heading
      const laporan = bagian("laporan");
      const sekolahDulu = laporan.indexOf('config.laporan.sekolah'), kelasLalu = laporan.indexOf('<h2 className="font-medium text-ink-1">{sl("config.laporan.kelas")}</h2>');
      c.expect(sekolahDulu > 0 && kelasLalu > sekolahDulu && (laporan.match(/<li[^>]*className="border-b border-line-1 px-3 py-2"/g) ?? []).length === 2, "Laporan is not link rows, the school's summary before the classes'");
      // Sistem: read-only rows; «aktif»/«nonaktif» and «data uji» as badges; a school year's dates in words, never ISO
      const sistem = bagian("system");
      c.expect(/className=\{`pin-pill \$\{i\.is_active \? "pin-ok" : "pin-neutral"\}`\}/.test(sistem) && /<span className="pin-pill pin-info">\{s\("config\.sekolah\.sintetis"\)\}<\/span>/.test(sistem)
        && /when\(p\.starts_on, "baca"\)\} – \$\{when\(p\.ends_on, "baca"\)\}/.test(sistem) && !/\$\{p\.starts_on\}/.test(sistem) && !/<form/.test(sistem), "Sistem & Konfigurasi's schools are not read-only rows with their badges and their years in words");
      // Pergantian tahun ajaran: a panel per school under its name, «Dari» and «Ke» sharing a row
      const roll = bagian("rollover");
      c.expect(/<h2 className="text-sm font-medium">\{inst\.name\}<\/h2>\s*<div className="pin-baris-isian">\s*<label className=\{label\}>\{s\("config\.label\.period_from"\)\}/.test(roll), "Pergantian tahun ajaran's «Dari» and «Ke» do not share a row under the school's name");
      // Templat laporan: the templates as rows, then the narrow form, school and kind sharing a row
      const templat = bagian("intelligence");
      c.expect(/<li key=\{tpl\.id\} className="border-b border-line-1 px-3 py-2">/.test(templat) && sempit.test(templat)
        && /<div className="pin-baris-isian">\s*<label className=\{label\}>\{s\("laporan\.templat\.institusi"\)\}/.test(templat)
        && templat.indexOf("myTemplates.map") < templat.indexOf("saveReportTemplateAction"), "Templat laporan is not its records, then a narrow form with school and kind sharing a row");
      // A4 (B1 §2): a section page prints its content only; every form, a record's action and the pager stay off the paper
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/@media print \{ \[data-bagian-ini\] form, \[data-bagian-ini\] \[data-buka-ubah\], \[data-bagian-ini\] \[data-penomoran\] \{ display: none !important; \} \}/.test(css)
        && /<Link className="pin-back pin-noprint"/.test(src), "a section page's forms, record actions, pager or back link reach the paper");
      const cetak = readFileSync(join(repoRoot, "audit/b6-cetak.mjs"), "utf8");
      c.expect(/await step\("P6"/.test(cetak) && /"\/konfigurasi\/audit"/.test(cetak), "the print walk does not print a Konfigurasi section page");
      // the journeys press a student's «Pindahkan» by its full name
      const jalan = readFileSync(join(repoRoot, "audit/journey.mjs"), "utf8");
      c.expect((jalan.match(/getByRole\("button", \{ name: `Pindahkan · \$\{nama\}`, exact: true \}\)/g) ?? []).length === 2, "the journeys do not press «Pindahkan» by the student's name");
      return c.verdict("Pindah kelas is a narrow GET step then its Kelas's students as rows, each «Pindahkan · name»; Peserta is a narrow form (Orang, Tempat sharing a row) then its records; Laporan is link rows, the school's first; Sistem's schools are read-only rows with «aktif»/«nonaktif» and «data uji» badges and their years in words; Pergantian's «Dari»/«Ke» share a row under the school's name; Templat laporan is its records then a narrow form; in print a section page keeps its content and drops its forms, record actions, pager and back link (walked: P6)");
    },
  },
];
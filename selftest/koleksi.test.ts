/**
 * BATCH 2 · W3.4 TABLE / COLLECTION (CR-88 «Collection with an explicit edit»; J2). Daisy's design system,
 * origin/ux-1/daisy-experience docs/coordination/ux/sistem-desain/project/components/{Table, TableRows, Search,
 * Pagination, SegmentedControl, EmptyState, J2Kelas}. Each guard is RED on the code before W3.4 (the exit gate).
 *
 *  KOLEKSI-HAL-01    THE PAGING ARITHMETIC, EXECUTED (src/components/koleksi/aturan.ts). Where a page sits in the whole
 *                    («21–40 dari 312», «Halaman 2 dari 16»): the last page is short, a page past the last is the last,
 *                    nothing at all is page 1 of 1 showing nothing; a bad page or size is page 1 / one row. Rows are
 *                    alphabetical in Indonesian order by default; the search ignores case and accents; the filter is
 *                    always one of its choices, and of the two controls that carry it the one the person changed wins;
 *                    links keep the page's own place and drop what is default.
 *  KOLEKSI-TABEL-01  THE COLLECTION, RENDERED (src/components/koleksi/Koleksi.tsx) in id and en: the frame is a named
 *                    `role=region` with tabindex=0; the table has a caption; columns are `th scope=col` and each row's
 *                    name a `th scope=row`; the filter is a radio group of segments AND a select of the same choices;
 *                    the search is labelled, described by a polite count; the pager says «Menampilkan 21–40 dari 312
 *                    murid» and «Halaman 2 dari 16», moves by «Sebelumnya» / «Berikutnya» links that keep the search
 *                    and filter, and is disabled, not absent, at an end; nothing matching is a row inside the frame,
 *                    «Tidak ada murid yang cocok», with «Hapus pencarian»; no rows at all is the caller's Empty state.
 *  KOLEKSI-CSS-01    THE LOOK, IN TOKENS (the source of src/app/experience.css): the head is sticky on `table-head`;
 *                    rows are at least `control-lg` (52 px) on the `table-row` / `table-row-alt` stripe; the frame
 *                    scrolls on its own and shows focus; below 640 px low-priority columns step back, the segments
 *                    become the select and the pager its short form.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { render } from "./ux2.test";

const MODUL = "src/components/koleksi/Koleksi.tsx";

/** One CSS rule's body, by its exact selector. */
function aturan(css: string, sel: string): string {
  const esc = sel.replace(/[.*+?^${}()|[\]\\:"=]/g, (x) => `\\${x}`);
  return css.match(new RegExp(`(?:^|\\n|\\}\\s*)\\s*${esc}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

/** The first `<name …>` opening tag in `html` that carries every one of `attrs` (in any order), or "". */
function tag(html: string, name: string, attrs: Record<string, string>): string {
  for (const m of html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))) {
    const a = Object.fromEntries([...m[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map((x) => [x[1], x[2]]));
    if (Object.entries(attrs).every(([k, v]) => a[k] === v)) return m[0];
  }
  return "";
}

export const koleksiTests: SelfTest[] = [
  {
    id: "KOLEKSI-HAL-01",
    run: async () => {
      const c = new Checks();
      const k = await import("../src/components/koleksi/aturan");
      const sama = (a: unknown, b: unknown, apa: string) => c.expect(JSON.stringify(a) === JSON.stringify(b), `${apa}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

      const p = (total: number, hal: number, ukuran = 20) => {
        const x = k.posisiHalaman(total, hal, ukuran);
        return [x.halaman, x.jumlahHalaman, x.dari, x.sampai, x.total];
      };
      sama(p(312, 2), [2, 16, 21, 40, 312], "page 2 of 312 by 20");
      sama(p(312, 16), [16, 16, 301, 312, 312], "the last page is short");
      sama(p(312, 99), [16, 16, 301, 312, 312], "a page past the last is the last");
      sama(p(312, 0), [1, 16, 1, 20, 312], "page 0 is page 1");
      sama(p(312, -3), [1, 16, 1, 20, 312], "a negative page is page 1");
      sama(p(312, Number.NaN), [1, 16, 1, 20, 312], "no page is page 1");
      sama(p(0, 1), [1, 1, 0, 0, 0], "nothing at all");
      sama(p(0, 5), [1, 1, 0, 0, 0], "nothing at all, any page");
      sama(p(1, 1), [1, 1, 1, 1, 1], "one row");
      sama(p(20, 1), [1, 1, 1, 20, 20], "exactly one page");
      sama(p(21, 2), [2, 2, 21, 21, 21], "one row over a page");
      sama(p(40, 2), [2, 2, 21, 40, 40], "exactly two pages");
      sama(p(5, 1, 0), [1, 5, 1, 1, 5], "a size below one is one row");

      sama(k.halamanKoleksi("3"), 3, "?hal=3"); sama(k.halamanKoleksi(["2", "9"]), 2, "?hal twice");
      for (const v of [undefined, "", "0", "-1", "1.5", "x", "1e3x"]) sama(k.halamanKoleksi(v), 1, `?hal=${String(v)}`);
      sama(k.kueriDiminta("  Adi  "), "Adi", "the search is trimmed"); sama(k.kueriDiminta(undefined), "", "no search");

      const pilihan = ["belum", "sedang", "selesai"];
      sama(k.saringDiminta(undefined, pilihan), "semua", "no filter is «Semua»");
      sama(k.saringDiminta("sedang", pilihan), "sedang", "one filter");
      sama(k.saringDiminta("bukan", pilihan), "semua", "a filter not offered is «Semua»");
      sama(k.saringDiminta(["selesai", "belum"], pilihan, "belum"), "selesai", "the segments changed (no script): the segments win");
      sama(k.saringDiminta(["belum", "selesai"], pilihan, "belum"), "selesai", "the select changed (no script): the select wins");
      sama(k.saringDiminta(["sedang", "sedang"], pilihan, "belum"), "sedang", "both kept equal (script)");

      const orang = ["bagus Santoso", "Ádi Pratama", "Citra", "adi Lestari", "Murid 10", "Murid 9"].map((nama) => ({ nama, kelompok: nama.length > 8 ? "panjang" : "pendek" }));
      sama(k.urutAbjad(orang, (o) => o.nama).map((o) => o.nama),
        ["adi Lestari", "Ádi Pratama", "bagus Santoso", "Citra", "Murid 9", "Murid 10"], "alphabetical, case, accents and numbers in Indonesian order");
      const s = k.susunKoleksi(orang, { nama: (o) => o.nama, kelompok: (o) => o.kelompok, kueri: "ADI", halaman: 1, ukuran: 1 });
      sama([s.isi.map((o) => o.nama), s.posisi.total, s.posisi.jumlahHalaman, s.totalSemua], [["adi Lestari"], 2, 2, 6], "a search ignores case and accents, then pages");
      const f = k.susunKoleksi(orang, { nama: (o) => o.nama, kelompok: (o) => o.kelompok, saring: "pendek", halaman: 9, ukuran: 2 });
      sama([f.isi.map((o) => o.nama), f.posisi.halaman, f.posisi.total], [["Murid 10"], 2, 3], "a filter (Citra, Murid 9, Murid 10), then the last page");
      const n = k.susunKoleksi(orang, { nama: (o) => o.nama, kueri: "Zainal", halaman: 1, ukuran: 20 });
      sama([n.isi.length, n.posisi.total, n.totalSemua], [0, 0, 6], "nothing matches, and the whole is still known");

      sama(k.tautanKoleksi("/kelas", { bagian: "murid", hal: "7" }, { cari: "Adi", saring: "semua", hal: 1 }, k.PARAM_BAKU, "daftar"),
        "/kelas?bagian=murid&cari=Adi#daftar", "the default filter and page 1 are not written; the page's own place stays");
      sama(k.tautanKoleksi("/kelas", {}, { saring: "belum", hal: 3 }), "/kelas?saring=belum&hal=3", "filter and page");
      sama(k.tautanKoleksi("/kelas", {}, {}), "/kelas", "nothing to say");
      sama(k.tautanKoleksi("/k", {}, { cari: "a&b", hal: 2 }, { cari: "q2", saring: "s2", hal: "h2" }), "/k?q2=a%26b&h2=2", "a second collection's own names, encoded");
      return c.verdict("posisiHalaman, susunKoleksi, urutAbjad, saringDiminta, halamanKoleksi and tautanKoleksi hold at every edge");
    },
  },
  {
    id: "KOLEKSI-TABEL-01",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      const { posisiHalaman } = await import("../src/components/koleksi/aturan");
      const kolom = [{ judul: "Murid" }, { judul: "Status" }, { judul: "Bab 3", angka: true }, { judul: "Terakhir aktif", prioritas: "rendah" }];
      const baris = Array.from({ length: 20 }, (_, i) => ({ kunci: `m${i}`, nama: `Murid ${String(i + 21).padStart(3, "0")}`, sel: ["Selesai", "3 dari 5", "3 Okt 2026"] }));
      const saring = { nilai: "sedang", pilihan: [{ nilai: "belum", label: "Belum mulai" }, { nilai: "sedang", label: "Sedang belajar" }, { nilai: "selesai", label: "Selesai" }] };

      for (const locale of ["id", "en"] as const) {
        const s = (k: Parameters<typeof t>[0]) => t(k, "staff", { locale });
        const benda = t("bukti.murid", "staff", { locale });
        const isi = (x: string) => x.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, "\"");
        const dasar = { id: "daftar-murid", nama: "Murid Kelas 5A", benda, kolom, jalan: "/kelas", tetap: { bagian: "murid" }, locale };

        // a page in the middle, searched and filtered
        const r = render(ctx.repoRoot, MODUL, { ...dasar, baris, posisi: posisiHalaman(312, 2, 20), totalSemua: 400, cari: "Mur", saring });
        if (!c.expect(r.ok, `(${locale}) the Collection could not be rendered: ${r.galat}`)) continue;
        const x = isi(r.html);
        c.expect(/<div class="pin-tabel-bingkai" id="daftar-murid" role="region" tabindex="0" aria-label="Murid Kelas 5A">/.test(x),
          `(${locale}) the frame is not a focusable region named «Murid Kelas 5A»`);
        c.expect(/<table class="pin-tabel"><caption[^>]*>Murid Kelas 5A<\/caption>/.test(x), `(${locale}) the table has no caption`);
        c.expect((x.match(/<th scope="col"/g) ?? []).length === 4, `(${locale}) the four column heads are not th scope=col`);
        c.expect(/<th scope="col" class="pin-angka">Bab 3<\/th>/.test(x) && /<th scope="col" data-prioritas="rendah">Terakhir aktif<\/th>/.test(x),
          `(${locale}) a number column is not right-aligned, or a low-priority column is not marked`);
        c.expect((x.match(/<th scope="row" class="pin-tabel-nama">Murid \d{3}<\/th>/g) ?? []).length === 20, `(${locale}) the 20 rows are not named by th scope=row`);
        c.expect(/<td data-prioritas="rendah">3 Okt 2026<\/td>/.test(x), `(${locale}) a low-priority cell is not marked`);

        // the toolbar: a GET form keeping the page's place; search; one filter as segments and as a select
        const form = tag(x, "form", { class: "pin-koleksi-alat", method: "get" });
        c.expect(form && /^<form[^>]*><input type="hidden" name="bagian" value="murid"\/>/.test(x.slice(x.indexOf(form))),
          `(${locale}) the toolbar is not a GET form that keeps the page's own place`);
        c.expect(tag(x, "input", { class: "pin-input", type: "search", name: "cari", value: "Mur", "aria-label": s("koleksi.cari.label").replace("{benda}", benda),
          placeholder: s("koleksi.cari.placeholder"), "aria-describedby": "daftar-murid-hasil" }),
        `(${locale}) the search field is not labelled and described by its count`);
        c.expect(tag(x, "a", { class: "pin-cari-hapus", "aria-label": s("koleksi.cari.hapus"), href: "/kelas?bagian=murid&saring=sedang#daftar-murid" }),
          `(${locale}) there is no «${s("koleksi.cari.hapus")}» that keeps the filter`);
        const cocok = s("koleksi.cari.cocok").replace("{n}", "312").replace("{benda}", benda).replace("{q}", "Mur");
        c.expect(x.includes(`<p class="pin-hint pin-cari-hasil" id="daftar-murid-hasil" aria-live="polite">${cocok}</p>`),
          `(${locale}) the search does not say politely how many matched («${cocok}»)`);
        const seg = x.match(/<div class="pin-seg pin-lebar-saja" role="radiogroup" aria-label="([^"]+)">([\s\S]*?)<\/div>/);
        c.expect(seg?.[1] === s("koleksi.saring.label"), `(${locale}) the filter is not a radio group named «${s("koleksi.saring.label")}»`);
        const radio = [...(seg?.[2] ?? "").matchAll(/<label>(<input [^>]*\/>)<span>([^<]+)<\/span><\/label>/g)]
          .map((m) => ({ ok: /type="radio"/.test(m[1]) && /name="saring"/.test(m[1]), nilai: m[1].match(/value="(\w+)"/)?.[1], dipilih: /checked=""/.test(m[1]), label: m[2] }));
        c.expect(radio.every((m) => m.ok) && radio.map((m) => m.nilai).join() === "semua,belum,sedang,selesai" && radio[0]?.label === s("koleksi.saring.semua")
          && radio.filter((m) => m.dipilih).map((m) => m.nilai).join() === "sedang", `(${locale}) the segments are not «${s("koleksi.saring.semua")}» and the three choices, «sedang» chosen`);
        const pilih = x.match(/<span class="pin-pilih pin-sempit-saja"><select class="pin-input" name="saring" aria-label="([^"]+)">([\s\S]*?)<\/select>/);
        c.expect(pilih?.[1] === s("koleksi.saring.label") && [...(pilih?.[2] ?? "").matchAll(/<option value="(\w+)"/g)].map((m) => m[1]).join() === "semua,belum,sedang,selesai"
          && /<option value="sedang" selected="">/.test(pilih?.[2] ?? ""), `(${locale}) there is no select with the same choices below 640 px`);
        c.expect(/<input type="hidden" name="saring_tadi" value="sedang"\/>/.test(x), `(${locale}) the toolbar does not carry the filter it was drawn with`);

        // the pager
        const ringkas = s("koleksi.menampilkan").replace("{dari}", "21").replace("{sampai}", "40").replace("{total}", "312").replace("{benda}", benda);
        const posisi = s("koleksi.posisi").replace("{n}", "2").replace("{total}", "16");
        c.expect(locale !== "id" || (ringkas === "Menampilkan 21–40 dari 312 murid" && posisi === "Halaman 2 dari 16"), `the count reads «${ringkas}» and «${posisi}»`);
        c.expect(new RegExp(`<nav class="pin-pager" aria-label="${s("koleksi.halaman.label").replace("{benda}", benda)}"><span class="pin-pager-ringkas" aria-live="polite">${ringkas}</span>`).test(x),
          `(${locale}) the pager does not say «${ringkas}» under its name`);
        c.expect(x.includes(`<span class="pin-pager-posisi" aria-live="polite"><span class="pin-pager-lebar">${posisi}</span><span class="pin-pager-kecil">2 / 16</span></span>`),
          `(${locale}) the pager does not say «${posisi}» (and «2 / 16» narrow)`);
        const ke = (h: number) => `/kelas?bagian=murid&cari=Mur&saring=sedang${h > 1 ? `&hal=${h}` : ""}#daftar-murid`;
        const tautan = (h: number, arah: string, nama: string, teks: string) => {
          const a = tag(x, "a", { class: "pin-btn", href: ke(h), "aria-label": nama, "data-pager": arah });
          return Boolean(a) && x.slice(x.indexOf(a)).split("</a>")[0].includes(`<span class="pin-pager-teks">${teks}</span>`);
        };
        c.expect(tautan(1, "sebelum", s("lesson.prev"), s("koleksi.sebelumnya")), `(${locale}) «${s("koleksi.sebelumnya")}» does not lead to page 1 keeping the search and filter`);
        c.expect(tautan(3, "sesudah", s("lesson.next"), s("koleksi.berikutnya")), `(${locale}) «${s("koleksi.berikutnya")}» does not lead to page 3 keeping the search and filter`);

        // the first page: «Sebelumnya» is there, disabled
        const awal = isi(render(ctx.repoRoot, MODUL, { ...dasar, baris, posisi: posisiHalaman(31, 1, 40), totalSemua: 31 }).html);
        const mati = (arah: string, nama: string) => {
          const a = tag(awal, "a", { role: "link", "aria-disabled": "true", class: "pin-btn", "aria-label": nama, "data-pager": arah });
          return Boolean(a) && !/href=/.test(a);
        };
        c.expect(mati("sebelum", s("lesson.prev")) && mati("sesudah", s("lesson.next")), `(${locale}) on a single page the two moves are not there, disabled`);
        c.expect(awal.includes(s("koleksi.menampilkan").replace("{dari}", "1").replace("{sampai}", "31").replace("{total}", "31").replace("{benda}", benda)),
          `(${locale}) a single page hides its total`);
        c.expect(!/role="radiogroup"/.test(awal) && !/<select/.test(awal), `(${locale}) a filter is drawn that was not asked for`);

        // nothing matches: a row inside the frame, and the way back
        const nihil = isi(render(ctx.repoRoot, MODUL, { ...dasar, baris: [], posisi: posisiHalaman(0, 1, 20), totalSemua: 31, cari: "Zainal" }).html);
        const judul = s("koleksi.kosong.judul").replace("{benda}", benda);
        c.expect(locale !== "id" || judul === "Tidak ada murid yang cocok", `the nothing-matches row reads «${judul}»`);
        c.expect(new RegExp(`<div class="pin-tabel-bingkai"[^>]*>[\\s\\S]*<tbody><tr class="pin-tabel-kosong"><td colSpan="4"><div class="pin-kosong-cocok"><h3>${judul}</h3><p>${s("koleksi.kosong.kueri").replace("{q}", "Zainal")}</p>`, "i").test(nihil),
          `(${locale}) nothing matching is not the row «${judul}» inside the frame, naming the search`);
        c.expect(new RegExp(`<tr class="pin-tabel-kosong">[\\s\\S]*<a[^>]*href="/kelas\\?bagian=murid#daftar-murid"[^>]*>${s("koleksi.cari.hapus")}<`).test(nihil),
          `(${locale}) the nothing-matches row offers no «${s("koleksi.cari.hapus")}» link`);
        c.expect(!/class="pin-pager"/.test(nihil) && !/pin-cari-hasil" [^>]*>[^<]/.test(nihil), `(${locale}) nothing matching still draws a pager or a count`);
        const nihilSaring = isi(render(ctx.repoRoot, MODUL, { ...dasar, baris: [], posisi: posisiHalaman(0, 1, 20), totalSemua: 31, saring: { ...saring, nilai: "belum" } }).html);
        c.expect(new RegExp(`<a[^>]*href="/kelas\\?bagian=murid#daftar-murid"[^>]*>${s("koleksi.kosong.reset")}`).test(nihilSaring),
          `(${locale}) a filter that matches nothing offers no «${s("koleksi.kosong.reset")}»`);

        // no rows at all: the Empty state, not an empty table
        const kosong = render(ctx.repoRoot, MODUL, { ...dasar, baris: [], posisi: posisiHalaman(0, 1, 20), totalSemua: 0, kosong: "BELUM-ADA" }).html;
        c.expect(kosong === "BELUM-ADA", `(${locale}) a collection with no rows at all draws «${kosong.slice(0, 60)}» instead of its Empty state`);
      }
      return c.verdict("the Collection, rendered in id and en: a named focusable region with a caption, th scope=col and scope=row, one filter as segments and a select, a labelled search with a polite count, «Menampilkan 21–40 dari 312 murid» and «Halaman 2 dari 16» with «Sebelumnya»/«Berikutnya» links (disabled at an end), the nothing-matches row with «Hapus pencarian», and the Empty state for no rows");
    },
  },
  {
    id: "KOLEKSI-CSS-01",
    run: async (ctx) => {
      const c = new Checks();
      const css = readFileSync(join(ctx.repoRoot, "src/app/experience.css"), "utf8");
      const kepala = aturan(css, ".pin-tabel thead th");
      c.expect(/position:\s*sticky/.test(kepala) && /top:\s*0/.test(kepala) && /background:\s*var\(--table-head\)/.test(kepala) && /color:\s*var\(--ink-2\)/.test(kepala),
        "the head is not sticky, in ink-2 on table-head");
      c.expect(/height:\s*var\(--control-lg\)/.test(aturan(css, ".pin-tabel tbody tr > *")), "body rows are not at least control-lg (52 px)");
      const globals = readFileSync(join(ctx.repoRoot, "src/app/globals.css"), "utf8");
      c.expect(/--control-lg:\s*52px;/.test(globals), "control-lg is not 52 px");
      c.expect(/\.pin-tabel tbody tr > \* \{ background: var\(--table-row\); \}/.test(css)
        && /\.pin-tabel tbody tr:where\(:nth-child\(even\)\) > \* \{ background: var\(--table-row-alt\); \}/.test(css),
      "rows are not striped table-row / table-row-alt (option A)");
      const bingkai = aturan(css, ".pin-tabel-bingkai");
      c.expect(/overflow-x:\s*auto/.test(bingkai) && /background:\s*var\(--surface-1\)/.test(bingkai) && /border-radius:\s*var\(--radius-lg\)/.test(bingkai),
        "the frame does not scroll on its own on surface-1 with radius-lg");
      c.expect(/outline:/.test(aturan(css, ".pin-tabel-bingkai:focus-visible")), "the focusable frame shows no focus");
      c.expect(/position:\s*sticky/.test(aturan(css, ".pin-tabel thead th:first-child, .pin-tabel .pin-tabel-nama")), "a row's name is not held still");
      c.expect(!/\.pin-tabel[^{]*\{[^}]*border-(left|right)/.test(css), "a table draws vertical lines");
      const sempit = css.match(/@container \(max-width: 639px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
      c.expect(/\.pin-tabel \[data-prioritas="rendah"\] \{ display: none; \}/.test(sempit), "below 640 px low-priority columns do not step back");
      c.expect(/\.pin-lebar-saja \{ display: none; \}/.test(sempit) && /\.pin-sempit-saja \{ display: block; \}/.test(sempit)
        && /\.pin-sempit-saja \{ display: none; \}/.test(css), "below 640 px the segments do not become the select");
      c.expect(/\.pin-pager-kecil \{ display: inline; \}/.test(sempit) && /* RESTATED FOR H2 (Daisy D-172 S1): the button word is visually hidden, never removed */ /\.pin-pager-teks \{ position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset\(50%\); white-space: nowrap; \}/.test(sempit) && /\.pin-pager-lebar \{ display: none; \}/.test(sempit),
        "below 640 px the pager does not take its short form");
      c.expect(/container-type:\s*inline-size/.test(aturan(css, ".pin-koleksi")), "the Collection is not the container its narrow rules ask");
      c.expect(/min-height:\s*var\(--control-md\)/.test(aturan(css, ".pin-seg span")), "a segment is not a 44 px target");
      return c.verdict("the source of src/app/experience.css draws the Collection in tokens: sticky head on table-head, rows of control-lg (52 px) striped table-row / table-row-alt, a frame that scrolls and shows focus, the name held still, no vertical lines, and the narrow rules at 640 px");
    },
  },
];

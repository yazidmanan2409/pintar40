import { t, format, type HleEvent } from "@/lib/hle";
import { BATAS_PAKET, KOLOM, LEMBAR, type NamaLembar } from "@/lib/unggah-kontrak";

/**
 * THE LESSON WORKBOOK TEMPLATE, BUILT IN THE BROWSER (DAISY-06; D-007, D-030).
 *
 * The template is written from BOB-02's contract (`KOLOM`, `LEMBAR`,
 * `BATAS_PAKET`) at the moment somebody downloads it, so it cannot drift from
 * what the reader accepts: there is no stored copy to fall behind. No
 * dependency is added (D-030); an .xlsx file is a zip of a handful of XML parts,
 * and this writes exactly those.
 *
 * WHAT IS IN IT
 *   - "Cara mengisi" first, so the workbook opens on how to fill it in: every
 *     column, whether it is required, the values it accepts, and its limits.
 *     Bob's reader finds the five data sheets by name and ignores this one.
 *   - Kursus, Bab, Pelajaran, Soal, Pilihan, in `LEMBAR` order. Row 1 is each
 *     column's `judul` in `KOLOM` order and nothing else is in those sheets,
 *     because the reader takes every later row as data. A column with a fixed
 *     list offers it as a dropdown (the reader ignores dropdowns).
 *
 * HOW IT IS WRITTEN (the gate's conditions): stored zip entries (no
 * compression) with a correct CRC-32; cell text as inline strings, XML-escaped;
 * a fixed timestamp, so the same contract always gives the same bytes.
 *
 * Pure and free of Node: it runs in the browser, and it must never import
 * src/lib/xlsx.ts, which needs node:zlib. It is Indonesian whatever the screen's
 * language, because its column headers are the contract and are Indonesian.
 */

// ════════════════════════════════════════════════════════════════ the zip

const CRC_TABEL = (() => {
  const tabel = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabel[n] = c >>> 0;
  }
  return tabel;
})();

/** CRC-32 (IEEE 802.3), as zip requires. */
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABEL[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** 1 January 1980, 00:00: the earliest zip date, and the same in every build. */
const WAKTU_DOS = 0;
const TANGGAL_DOS = (0 << 9) | (1 << 5) | 1;

/** A zip of stored (uncompressed) entries, in the order given. */
export function zipTersimpan(entri: ReadonlyArray<{ nama: string; isi: Uint8Array }>): Uint8Array {
  const enc = new TextEncoder();
  const lokal: Uint8Array[] = [];
  const pusat: Uint8Array[] = [];
  let offset = 0;
  for (const e of entri) {
    const nama = enc.encode(e.nama);
    const crc = crc32(e.isi);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true); // version needed
    h.setUint16(6, 0x0800, true); // names are UTF-8
    h.setUint16(8, 0, true); // stored
    h.setUint16(10, WAKTU_DOS, true);
    h.setUint16(12, TANGGAL_DOS, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, e.isi.length, true);
    h.setUint32(22, e.isi.length, true);
    h.setUint16(26, nama.length, true);
    h.setUint16(28, 0, true);
    lokal.push(new Uint8Array(h.buffer), nama, e.isi);

    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true); // made by
    c.setUint16(6, 20, true); // needed
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, WAKTU_DOS, true);
    c.setUint16(14, TANGGAL_DOS, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, e.isi.length, true);
    c.setUint32(24, e.isi.length, true);
    c.setUint16(28, nama.length, true);
    // extra, comment, disk, internal and external attributes: all 0
    c.setUint32(42, offset, true);
    pusat.push(new Uint8Array(c.buffer), nama);
    offset += 30 + nama.length + e.isi.length;
  }
  const ukuranPusat = pusat.reduce((n, b) => n + b.length, 0);
  const akhir = new DataView(new ArrayBuffer(22));
  akhir.setUint32(0, 0x06054b50, true);
  akhir.setUint16(8, entri.length, true);
  akhir.setUint16(10, entri.length, true);
  akhir.setUint32(12, ukuranPusat, true);
  akhir.setUint32(16, offset, true);
  const bagian = [...lokal, ...pusat, new Uint8Array(akhir.buffer)];
  const out = new Uint8Array(bagian.reduce((n, b) => n + b.length, 0));
  let p = 0;
  for (const b of bagian) { out.set(b, p); p += b.length; }
  return out;
}

// ═══════════════════════════════════════════════════════════ the workbook

/** Text as XML content: the five special characters, and no control characters. */
export function xmlTeks(s: string): string {
  return s
    // XML 1.0 admits tab, newline and carriage return and no other control character
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** A, B, ... Z, AA, AB ... for a zero-based column. */
export function hurufKolom(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** Cell styles, as indexes into styles.xml's cellXfs. */
const GAYA = { biasa: 0, judulKolom: 1, judulHalaman: 2, bungkus: 3 } as const;
type Gaya = (typeof GAYA)[keyof typeof GAYA];

export type Sel = string | { teks: string; gaya: Gaya };
export type LembarTulis = {
  nama: string;
  baris: Sel[][];
  /** Column widths, in characters. */
  lebar?: number[];
  /** Keep row 1 in view while scrolling. */
  bekukanJudul?: boolean;
  /** A dropdown list for a column, from row 2 down. */
  daftar?: Array<{ kolom: number; nilai: string[] }>;
};

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
/** How far down a dropdown reaches: the reader's own row limit. */
const BARIS_DAFTAR = BATAS_PAKET.barisMaks.nilai;

function lembarXml(l: LembarTulis, pertama: boolean): string {
  const tampilan = `<sheetViews><sheetView${pertama ? ' tabSelected="1"' : ""} workbookViewId="0">${
    l.bekukanJudul ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' : ""
  }</sheetView></sheetViews>`;
  const kolom = l.lebar?.length
    ? `<cols>${l.lebar.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const baris = l.baris.map((sel, r) => {
    const isi = sel.map((x, k) => {
      const { teks, gaya } = typeof x === "string" ? { teks: x, gaya: GAYA.biasa as Gaya } : x;
      if (teks === "") return "";
      return `<c r="${hurufKolom(k)}${r + 1}" t="inlineStr"${gaya ? ` s="${gaya}"` : ""}><is><t xml:space="preserve">${xmlTeks(teks)}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${isi}</row>`;
  }).join("");
  const daftar = l.daftar?.length
    ? `<dataValidations count="${l.daftar.length}">${l.daftar.map((d) => {
        const huruf = hurufKolom(d.kolom);
        return `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${huruf}2:${huruf}${BARIS_DAFTAR}"><formula1>${xmlTeks(`"${d.nilai.join(",")}"`)}</formula1></dataValidation>`;
      }).join("")}</dataValidations>`
    : "";
  return `${XML}<worksheet ${NS}>${tampilan}${kolom}<sheetData>${baris}</sheetData>${daftar}</worksheet>`;
}

const GAYA_XML = `${XML}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
  + '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>'
  + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
  + '<fill><patternFill patternType="solid"><fgColor rgb="FFE3EFEC"/><bgColor indexed="64"/></patternFill></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
  + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
  + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>'
  + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

/** An .xlsx file of the given sheets, in order. The same sheets always give the same bytes. */
export function tulisBukuKerja(lembar: readonly LembarTulis[]): Uint8Array {
  const enc = new TextEncoder();
  const n = lembar.length;
  const tipe = `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + lembar.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")
    + "</Types>";
  const relAkar = `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const buku = `${XML}<workbook ${NS}><bookViews><workbookView activeTab="0"/></bookViews><sheets>`
    + lembar.map((l, i) => `<sheet name="${xmlTeks(l.nama)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")
    + "</sheets></workbook>";
  const relBuku = `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + lembar.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")
    + `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  return zipTersimpan([
    { nama: "[Content_Types].xml", isi: enc.encode(tipe) },
    { nama: "_rels/.rels", isi: enc.encode(relAkar) },
    { nama: "xl/workbook.xml", isi: enc.encode(buku) },
    { nama: "xl/_rels/workbook.xml.rels", isi: enc.encode(relBuku) },
    { nama: "xl/styles.xml", isi: enc.encode(GAYA_XML) },
    ...lembar.map((l, i) => ({ nama: `xl/worksheets/sheet${i + 1}.xml`, isi: enc.encode(lembarXml(l, i === 0)) })),
  ]);
}

// ═════════════════════════════════════════════════════════ the template

/** The guidance sheet's name. Not "Petunjuk": that is a column of the Soal sheet. */
export const LEMBAR_PANDUAN = "Cara mengisi";
export const NAMA_BERKAS_TEMPLAT = "templat-pelajaran-pintar.xlsx";

const s = (k: HleEvent) => t(k, "staff", { locale: "id" });
const angka = (n: number) => format.number(n, "id");

/**
 * Where each text limit applies: `BATAS_PAKET.teksMaks` names a field, and this
 * names its sheet and column, so the limit is written beside the column it
 * governs. DAISY-06-TEMPLAT-01 fails if a limit has no column here.
 */
export const BATAS_TEKS_KOLOM: Record<keyof typeof BATAS_PAKET.teksMaks.nilai, readonly [NamaLembar, string]> = {
  judulKursus: ["Kursus", "title"], mapel: ["Kursus", "subject"], jenjang: ["Kursus", "stage"], kelas: ["Kursus", "grade_label"],
  judulBab: ["Bab", "title"], judulPelajaran: ["Pelajaran", "title"], ringkasan: ["Pelajaran", "summary"],
  isiPelajaran: ["Pelajaran", "body_markdown"], soal: ["Soal", "stem"], stimulus: ["Soal", "stimulus"],
  pilihan: ["Pilihan", "body"], alasan: ["Pilihan", "rationale"], kelompokSetara: ["Soal", "parallel_group"],
};

function batasTeks(lembar: NamaLembar, kunci: string): number | null {
  for (const [nama, [l, k]] of Object.entries(BATAS_TEKS_KOLOM)) {
    if (l === lembar && k === kunci) return BATAS_PAKET.teksMaks.nilai[nama as keyof typeof BATAS_PAKET.teksMaks.nilai];
  }
  return null;
}

/** The limits that are not a column's length, each as [what, the limit], from BATAS_PAKET. */
export function batasLain(): Array<[string, string]> {
  const b = BATAS_PAKET;
  const mb = b.berkasMaks.nilai / (1024 * 1024);
  const jenis = b.jenisMedia.nilai;
  return [
    [s("studio.templat.batas.berkas"), `${s("studio.templat.paling_besar")} ${angka(mb)} MB`],
    [s("studio.templat.batas.kursus"), s("studio.templat.satu_kursus")],
    [s("studio.templat.batas.baris"), `${s("studio.templat.paling_banyak")} ${angka(b.barisMaks.nilai)} ${s("studio.templat.baris_termasuk_judul")}`],
    [s("studio.templat.batas.pelajaran"), `${s("studio.templat.paling_banyak")} ${angka(b.pelajaranMaks.nilai)}`],
    [s("studio.templat.batas.soal"), `${s("studio.templat.paling_banyak")} ${angka(b.soalMaks.nilai)}`],
    [s("studio.templat.batas.pilihan"), `${angka(b.pilihanMin.nilai)}–${angka(b.pilihanMaks.nilai)}, ${s("studio.templat.berlabel")} ${b.labelPilihan.nilai.join(", ")}`],
    [s("studio.templat.batas.media"),
      `${s("studio.templat.media.gambar")} (${jenis.gambar.join(", ")}); ${s("studio.templat.media.audio")} (${jenis.audio.join(", ")}); `
      + `${s("studio.templat.media.video")} (${jenis.video.join(", ")}); PDF (${jenis.pdf.join(", ")}). `
      + `${s("studio.templat.nama_media")} ${angka(b.namaMediaMaks.nilai)} ${s("studio.templat.karakter")}.`],
    [s("studio.templat.batas.transkrip"), s("studio.templat.transkrip_wajib")],
  ];
}

/** The template's sheets: the guidance, then the five data sheets. */
export function lembarTemplat(): LembarTulis[] {
  const judul = (teks: string): Sel => ({ teks, gaya: GAYA.judulKolom });
  const bungkus = (teks: string): Sel => ({ teks, gaya: GAYA.bungkus });

  const panduan: Sel[][] = [
    [{ teks: s("studio.templat.judul"), gaya: GAYA.judulHalaman }],
    [],
    ...(["studio.templat.cara.1", "studio.templat.cara.2", "studio.templat.cara.3", "studio.templat.cara.4", "studio.templat.cara.5"] as const)
      .map((k) => [bungkus(s(k))]),
    [],
    [judul(s("studio.templat.kolom.lembar")), judul(s("studio.templat.kolom.kolom")), judul(s("studio.templat.kolom.wajib")),
      judul(s("studio.templat.kolom.pilihan")), judul(s("studio.templat.kolom.batas")), judul(s("studio.templat.kolom.arti"))],
    ...LEMBAR.flatMap((l) => KOLOM[l].map((k) => {
      const batas = batasTeks(l, k.kunci);
      return [
        l, k.judul, s(k.wajib ? "studio.templat.ya" : "studio.templat.tidak"),
        bungkus(k.pilihan ? k.pilihan.map(([label]) => label).join(", ") : ""),
        batas === null ? "" : `${angka(batas)} ${s("studio.templat.karakter")}`,
        bungkus(k.arti),
      ] as Sel[];
    })),
    [],
    [judul(s("studio.templat.batas.judul")), judul(s("studio.templat.kolom.batas"))],
    ...batasLain().map(([apa, batas]) => [apa, bungkus(batas)] as Sel[]),
  ];

  return [
    { nama: LEMBAR_PANDUAN, baris: panduan, lebar: [22, 24, 9, 30, 16, 60] },
    ...LEMBAR.map((l): LembarTulis => ({
      nama: l,
      baris: [KOLOM[l].map((k) => judul(k.judul))],
      lebar: KOLOM[l].map((k) => Math.min(48, Math.max(14, k.judul.length + 6))),
      bekukanJudul: true,
      daftar: KOLOM[l].flatMap((k, i) => (k.pilihan ? [{ kolom: i, nilai: k.pilihan.map(([label]) => label) }] : [])),
    })),
  ];
}

/** The template file itself. */
export function templatPelajaran(): Uint8Array {
  return tulisBukuKerja(lembarTemplat());
}

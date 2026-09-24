import { inflateRawSync } from "node:zlib";

/**
 * BOB-02 — A WORKBOOK, READ AS TEXT. The smallest reader that turns an .xlsx
 * file (Excel, LibreOffice or Google Sheets) into its sheets' cell text, and
 * nothing else: no formulas are evaluated, no styles are read, no date is
 * interpreted, and no macro, external link or embedded object is touched.
 *
 * WHY NOT A LIBRARY. The npm "xlsx" package has open advisories and is no
 * longer published to npm; the maintained alternatives are large and read far
 * more of the file than a course workbook needs. An .xlsx file is a zip of XML
 * parts, and Node's own zlib inflates it, so this reads exactly the four parts
 * the lesson template uses:
 *
 *   xl/workbook.xml             sheet names, in order
 *   xl/_rels/workbook.xml.rels  which part holds each sheet
 *   xl/sharedStrings.xml        the text most cells point at
 *   xl/worksheets/sheetN.xml    the cells
 *
 * LIMITS, because the input is a stranger's file: at most 5 MB compressed,
 * 40 MB inflated in total, 1,000 zip entries, 10,000 rows and 200 columns a
 * sheet. Anything past a limit is refused, never truncated silently.
 */

export type Lembar = { nama: string; baris: string[][] };
export type HasilBaca = { ok: true; lembar: Lembar[] } | { ok: false; code: "WORKBOOK_UNREADABLE" | "WORKBOOK_TOO_LARGE" };

export const BATAS = {
  berkas: 5 * 1024 * 1024,
  terurai: 40 * 1024 * 1024,
  entri: 1000,
  baris: 10_000,
  kolom: 200,
} as const;

class Tolak extends Error {
  constructor(public code: "WORKBOOK_UNREADABLE" | "WORKBOOK_TOO_LARGE") {
    super(code);
  }
}

// ═══════════════════════════════════════════════════════════════ the zip

type Entri = { nama: string; metode: number; ukuranZip: number; ukuranAsli: number; offset: number };

function daftarEntri(buf: Buffer): Map<string, Entri> {
  // End of central directory: the last 22 bytes, or up to 64 KiB earlier
  // when the archive carries a comment.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65_535); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Tolak("WORKBOOK_UNREADABLE");
  const jumlah = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  if (jumlah > BATAS.entri) throw new Tolak("WORKBOOK_TOO_LARGE");
  const out = new Map<string, Entri>();
  for (let n = 0; n < jumlah; n += 1) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Tolak("WORKBOOK_UNREADABLE");
    const metode = buf.readUInt16LE(p + 10);
    const ukuranZip = buf.readUInt32LE(p + 20);
    const ukuranAsli = buf.readUInt32LE(p + 24);
    const panjangNama = buf.readUInt16LE(p + 28);
    const panjangExtra = buf.readUInt16LE(p + 30);
    const panjangKomentar = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const nama = buf.toString("utf8", p + 46, p + 46 + panjangNama);
    out.set(nama, { nama, metode, ukuranZip, ukuranAsli, offset });
    p += 46 + panjangNama + panjangExtra + panjangKomentar;
  }
  return out;
}

function isiEntri(buf: Buffer, e: Entri, anggaran: { sisa: number }): string {
  if (e.offset + 30 > buf.length || buf.readUInt32LE(e.offset) !== 0x04034b50) throw new Tolak("WORKBOOK_UNREADABLE");
  const mulai = e.offset + 30 + buf.readUInt16LE(e.offset + 26) + buf.readUInt16LE(e.offset + 28);
  const data = buf.subarray(mulai, mulai + e.ukuranZip);
  if (e.ukuranAsli > anggaran.sisa) throw new Tolak("WORKBOOK_TOO_LARGE");
  let isi: Buffer;
  if (e.metode === 0) isi = Buffer.from(data);
  else if (e.metode === 8) {
    try {
      // the declared size bounds the inflate, so a zip bomb stops at its lie
      isi = inflateRawSync(data, { maxOutputLength: Math.max(1, e.ukuranAsli) });
    } catch {
      throw new Tolak("WORKBOOK_UNREADABLE");
    }
  } else throw new Tolak("WORKBOOK_UNREADABLE");
  anggaran.sisa -= isi.length;
  return isi.toString("utf8");
}

// ═══════════════════════════════════════════════════════════════ the XML

/** XML entities and OOXML's own `_xHHHH_` escapes, and nothing more. */
export function uraiTeks(s: string): string {
  return s
    .replace(/_x([0-9a-fA-F]{4})_/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&(#x[0-9a-fA-F]+|#[0-9]+|lt|gt|amp|quot|apos);/g, (_, e: string) => {
      if (e === "lt") return "<";
      if (e === "gt") return ">";
      if (e === "amp") return "&";
      if (e === "quot") return '"';
      if (e === "apos") return "'";
      const code = e.startsWith("#x") ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    });
}

const atribut = (tag: string, nama: string): string | null => {
  const m = new RegExp(`\\s${nama}="([^"]*)"`).exec(tag) ?? new RegExp(`\\s${nama}='([^']*)'`).exec(tag);
  return m ? uraiTeks(m[1]) : null;
};

/** The visible text of an <si> or <is>: every <t> except phonetic runs. */
function teksKaya(xml: string): string {
  const tanpaFonetik = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  let out = "";
  for (const m of tanpaFonetik.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)) out += uraiTeks(m[1] ?? "");
  return out;
}

function kolomKe(indeksHuruf: string): number {
  let n = 0;
  for (const ch of indeksHuruf) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function bacaLembar(xml: string, teksBersama: string[]): string[][] {
  const baris: string[][] = [];
  const data = /<sheetData\b[^>]*>([\s\S]*?)<\/sheetData>/.exec(xml)?.[1] ?? "";
  let urutBaris = 0;
  for (const r of data.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>|<row\b([^>]*)\/>/g)) {
    const tagBaris = r[1] ?? r[3] ?? "";
    const nomor = Number(atribut(`<row${tagBaris}>`, "r") ?? urutBaris + 1);
    urutBaris = Number.isFinite(nomor) && nomor > 0 ? nomor : urutBaris + 1;
    if (urutBaris > BATAS.baris) throw new Tolak("WORKBOOK_TOO_LARGE");
    const sel: string[] = [];
    let urutKolom = 0;
    for (const c of (r[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const tag = `<c${c[1]}>`;
      const ref = atribut(tag, "r");
      const m = ref ? /^([A-Z]{1,3})[0-9]+$/.exec(ref) : null;
      const k = m ? kolomKe(m[1]) : urutKolom;
      urutKolom = k + 1;
      if (k >= BATAS.kolom) throw new Tolak("WORKBOOK_TOO_LARGE");
      const isi = c[2] ?? "";
      const jenis = atribut(tag, "t");
      const v = /<v>([\s\S]*?)<\/v>/.exec(isi)?.[1];
      let teks = "";
      if (jenis === "s") teks = teksBersama[Number(v)] ?? "";
      else if (jenis === "inlineStr") teks = teksKaya(/<is>([\s\S]*?)<\/is>/.exec(isi)?.[1] ?? "");
      else if (jenis === "b") teks = v === "1" ? "TRUE" : v === "0" ? "FALSE" : "";
      else if (jenis === "e") teks = "";
      else teks = v !== undefined ? uraiTeks(v) : "";
      while (sel.length < k) sel.push("");
      sel[k] = teks;
    }
    while (baris.length < urutBaris - 1) baris.push([]);
    baris[urutBaris - 1] = sel;
  }
  return baris;
}

// ═══════════════════════════════════════════════════════════ the workbook

function normalisasiTarget(target: string): string {
  const t = target.replace(/\\/g, "/");
  if (t.startsWith("/")) return t.slice(1);
  const parts: string[] = [];
  for (const p of `xl/${t}`.split("/")) {
    if (p === "..") parts.pop();
    else if (p !== "." && p !== "") parts.push(p);
  }
  return parts.join("/");
}

/** Every sheet of an .xlsx file, in workbook order, as rows of cell text. */
export function bacaBukuKerja(berkas: Uint8Array): HasilBaca {
  try {
    if (berkas.byteLength > BATAS.berkas) throw new Tolak("WORKBOOK_TOO_LARGE");
    const buf = Buffer.from(berkas.buffer, berkas.byteOffset, berkas.byteLength);
    if (buf.length < 22) throw new Tolak("WORKBOOK_UNREADABLE");
    const entri = daftarEntri(buf);
    const anggaran = { sisa: BATAS.terurai };
    const baca = (nama: string): string | null => {
      const e = entri.get(nama);
      return e ? isiEntri(buf, e, anggaran) : null;
    };

    const workbook = baca("xl/workbook.xml");
    const rels = baca("xl/_rels/workbook.xml.rels");
    if (!workbook || !rels) throw new Tolak("WORKBOOK_UNREADABLE");
    const target = new Map<string, string>();
    for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
      const id = atribut(m[0], "Id");
      const t = atribut(m[0], "Target");
      if (id && t) target.set(id, normalisasiTarget(t));
    }
    const shared = baca("xl/sharedStrings.xml");
    const teksBersama = shared ? [...shared.matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => teksKaya(m[1] ?? "")) : [];

    const lembar: Lembar[] = [];
    for (const m of workbook.matchAll(/<sheet\b[^>]*>/g)) {
      const nama = atribut(m[0], "name");
      const rid = atribut(m[0], "r:id");
      const bagian = rid ? target.get(rid) : undefined;
      if (!nama || !bagian) continue;
      const xml = baca(bagian);
      if (xml === null) continue;
      lembar.push({ nama, baris: bacaLembar(xml, teksBersama) });
    }
    return { ok: true, lembar };
  } catch (e) {
    if (e instanceof Tolak) return { ok: false, code: e.code };
    return { ok: false, code: "WORKBOOK_UNREADABLE" };
  }
}

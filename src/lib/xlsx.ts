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
//
// ONE FORWARD PASS PER PART (D-030(b)). The XML is walked tag by tag with
// indexOf and a quote-aware scan for the end of each tag; no position is ever
// read twice and no pattern backtracks, so the work is linear in the size of
// the part whatever the file holds. The first tag that never closes stops the
// read as WORKBOOK_UNREADABLE instead of rescanning the rest of the file for
// every tag that follows -- which is what the earlier regular expressions did,
// quadratically, on a file of unclosed <row>, <c>, <si> or <t> tags.

/** XML entities and OOXML's own `_xHHHH_` escapes, and nothing more (no DTD). */
export function uraiTeks(s: string): string {
  if (s.indexOf("&") < 0 && s.indexOf("_x") < 0) return s;
  return s
    .replace(/_x([0-9a-fA-F]{4})_/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|lt|gt|amp|quot|apos);/g, (_, e: string) => {
      if (e === "lt") return "<";
      if (e === "gt") return ">";
      if (e === "amp") return "&";
      if (e === "quot") return '"';
      if (e === "apos") return "'";
      const code = e.startsWith("#x") ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    });
}

type Tag = { nama: string; isi: string; tutup: boolean; sendiri: boolean };

/**
 * Every tag and every run of text in `xml`, in order. `teks` receives raw
 * text between tags; `tag` receives each element tag (comments, processing
 * instructions and declarations are skipped). Throws on a tag that never
 * closes.
 */
function jalani(xml: string, tag: (t: Tag) => void, teks: (t: string) => void): void {
  const n = xml.length;
  let pos = 0;
  while (pos < n) {
    const lt = xml.indexOf("<", pos);
    if (lt < 0) { teks(xml.slice(pos)); return; }
    if (lt > pos) teks(xml.slice(pos, lt));
    if (xml.startsWith("<!--", lt)) {
      const e = xml.indexOf("-->", lt + 4);
      if (e < 0) throw new Tolak("WORKBOOK_UNREADABLE");
      pos = e + 3;
      continue;
    }
    // the end of the tag: the first '>' outside a quoted attribute value
    let q = 0;
    let gt = -1;
    for (let k = lt + 1; k < n; k += 1) {
      const ch = xml.charCodeAt(k);
      if (q !== 0) { if (ch === q) q = 0; }
      else if (ch === 34 || ch === 39) q = ch;
      else if (ch === 62) { gt = k; break; }
      else if (ch === 60) throw new Tolak("WORKBOOK_UNREADABLE"); // '<' inside a tag: it never closed
    }
    if (gt < 0) throw new Tolak("WORKBOOK_UNREADABLE");
    const c0 = xml.charCodeAt(lt + 1);
    if (c0 !== 63 && c0 !== 33) { // not <? … ?> or <! … >
      const tutup = c0 === 47;
      const awal = tutup ? lt + 2 : lt + 1;
      const sendiri = xml.charCodeAt(gt - 1) === 47;
      let akhirNama = awal;
      while (akhirNama < gt) {
        const ch = xml.charCodeAt(akhirNama);
        if (ch === 32 || ch === 9 || ch === 10 || ch === 13 || ch === 47) break;
        akhirNama += 1;
      }
      tag({ nama: xml.slice(awal, akhirNama), isi: xml.slice(akhirNama, sendiri ? gt - 1 : gt), tutup, sendiri });
    }
    pos = gt + 1;
  }
}

/** A tag's attributes, read once, left to right. */
function atributTag(isi: string): Map<string, string> {
  const out = new Map<string, string>();
  const n = isi.length;
  let i = 0;
  while (i < n) {
    while (i < n && /\s/.test(isi[i])) i += 1;
    const mulai = i;
    while (i < n && isi[i] !== "=" && !/\s/.test(isi[i])) i += 1;
    const nama = isi.slice(mulai, i);
    while (i < n && /\s/.test(isi[i])) i += 1;
    if (isi[i] !== "=") { i += 1; continue; }
    i += 1;
    while (i < n && /\s/.test(isi[i])) i += 1;
    const kutip = isi[i];
    if (kutip !== '"' && kutip !== "'") break;
    const tutup = isi.indexOf(kutip, i + 1);
    if (tutup < 0) throw new Tolak("WORKBOOK_UNREADABLE");
    if (nama) out.set(nama, uraiTeks(isi.slice(i + 1, tutup)));
    i = tutup + 1;
  }
  return out;
}

/** Depth of an element that may not nest: 0 or 1, and never a second opening. */
function buka(dalam: number, tutup: boolean): number {
  if (tutup) return 0;
  if (dalam > 0) throw new Tolak("WORKBOOK_UNREADABLE");
  return 1;
}

function kolomKe(indeksHuruf: string): number {
  let n = 0;
  for (const ch of indeksHuruf) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** The shared-string table: the visible text of each <si>, phonetic runs excluded. */
function bacaTeksBersama(xml: string): string[] {
  const out: string[] = [];
  let dalamSi = false;
  let dalamT = 0;
  let dalamRph = 0;
  let isi: string[] = [];
  jalani(xml, (t) => {
    // none of these nest: a second opening tag before the first has closed is
    // a broken part, refused at once rather than read to its end
    if (t.nama === "si") {
      if (t.sendiri) { if (dalamSi) throw new Tolak("WORKBOOK_UNREADABLE"); out.push(""); return; }
      if (!t.tutup) { if (dalamSi) throw new Tolak("WORKBOOK_UNREADABLE"); dalamSi = true; isi = []; }
      else { out.push(isi.join("")); dalamSi = false; }
    } else if (t.nama === "rPh") {
      if (!t.sendiri) dalamRph = buka(dalamRph, t.tutup);
    } else if (t.nama === "t") {
      if (!t.sendiri) dalamT = buka(dalamT, t.tutup);
    }
  }, (s) => {
    if (dalamSi && dalamT > 0 && dalamRph === 0) isi.push(uraiTeks(s));
  });
  if (dalamSi) throw new Tolak("WORKBOOK_UNREADABLE");
  return out;
}

function bacaLembar(xml: string, teksBersama: string[]): string[][] {
  const baris: string[][] = [];
  let sel: string[] | null = null;
  let urutBaris = 0;
  let urutKolom = 0;
  // the cell being read
  let k = -1;
  let jenis: string | null = null;
  let v: string[] | null = null;
  let tIs: string[] | null = null;
  let dalamIs = false;
  let dalamT = 0;
  let dalamRph = 0;
  let dalamV = false;

  const tutupSel = () => {
    if (!sel || k < 0) return;
    const nilai = v ? v.join("") : undefined;
    let teks = "";
    if (jenis === "s") teks = teksBersama[Number(nilai)] ?? "";
    else if (jenis === "inlineStr") teks = tIs ? tIs.join("") : "";
    else if (jenis === "b") teks = nilai === "1" ? "TRUE" : nilai === "0" ? "FALSE" : "";
    else if (jenis === "e") teks = "";
    else teks = nilai !== undefined ? uraiTeks(nilai) : "";
    // A line break in a cell is a line break, whichever application wrote it:
    // Excel stores one as _x000D_ and a newline (CR LF), openpyxl and Sheets
    // as a newline alone. One form reaches the package, so the same workbook
    // saved by two applications is the same lesson.
    if (teks.indexOf("\r") >= 0) teks = teks.replace(/\r\n?/g, "\n");
    while (sel.length < k) sel.push("");
    sel[k] = teks;
    k = -1;
  };
  const tutupBaris = () => {
    if (!sel) return;
    while (baris.length < urutBaris - 1) baris.push([]);
    baris[urutBaris - 1] = sel;
    sel = null;
  };

  jalani(xml, (t) => {
    if (t.nama === "row") {
      if (t.tutup) { tutupBaris(); return; }
      if (sel !== null) throw new Tolak("WORKBOOK_UNREADABLE"); // a row inside a row
      const r = Number(atributTag(t.isi).get("r") ?? urutBaris + 1);
      urutBaris = Number.isFinite(r) && r > 0 ? Math.floor(r) : urutBaris + 1;
      if (urutBaris > BATAS.baris) throw new Tolak("WORKBOOK_TOO_LARGE");
      sel = [];
      urutKolom = 0;
      if (t.sendiri) tutupBaris();
    } else if (t.nama === "c") {
      if (t.tutup) { tutupSel(); return; }
      if (k >= 0) throw new Tolak("WORKBOOK_UNREADABLE"); // a cell inside a cell
      if (!sel) return;
      const a = atributTag(t.isi);
      const m = /^([A-Z]{1,3})[0-9]+$/.exec(a.get("r") ?? "");
      k = m ? kolomKe(m[1]) : urutKolom;
      urutKolom = k + 1;
      if (k >= BATAS.kolom) throw new Tolak("WORKBOOK_TOO_LARGE");
      jenis = a.get("t") ?? null;
      v = null; tIs = null; dalamIs = false; dalamT = 0; dalamRph = 0;
      if (t.sendiri) tutupSel();
    } else if (t.nama === "v") {
      if (t.sendiri) return;
      if (t.tutup) { dalamV = false; return; }
      if (dalamV) throw new Tolak("WORKBOOK_UNREADABLE");
      dalamV = true;
      if (k >= 0) v = v ?? [];
    } else if (t.nama === "is") {
      if (t.sendiri) return;
      if (!t.tutup && dalamIs) throw new Tolak("WORKBOOK_UNREADABLE");
      dalamIs = !t.tutup;
      if (dalamIs) tIs = [];
    } else if (t.nama === "rPh") {
      if (!t.sendiri) dalamRph = buka(dalamRph, t.tutup);
    } else if (t.nama === "t") {
      if (!t.sendiri) dalamT = buka(dalamT, t.tutup);
    }
  }, (s) => {
    if (k < 0) return;
    if (dalamIs) { if (dalamT > 0 && dalamRph === 0 && tIs) tIs.push(uraiTeks(s)); }
    else if (v && dalamV) v.push(s);
  });
  if (sel !== null) throw new Tolak("WORKBOOK_UNREADABLE"); // a row that never closed
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

/** Every element of one name in a part, with its attributes. */
function elemen(xml: string, nama: string): Array<Map<string, string>> {
  const out: Array<Map<string, string>> = [];
  jalani(xml, (t) => { if (t.nama === nama && !t.tutup) out.push(atributTag(t.isi)); }, () => {});
  return out;
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
    for (const a of elemen(rels, "Relationship")) {
      const id = a.get("Id");
      const t = a.get("Target");
      if (id && t) target.set(id, normalisasiTarget(t));
    }
    const shared = baca("xl/sharedStrings.xml");
    const teksBersama = shared ? bacaTeksBersama(shared) : [];

    const lembar: Lembar[] = [];
    for (const a of elemen(workbook, "sheet")) {
      const nama = a.get("name");
      const rid = a.get("r:id");
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

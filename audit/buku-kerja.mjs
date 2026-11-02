// The workbook Studio offers («Unduh contoh isian», «Unduh templat Excel») is a STORED (uncompressed) .xlsx with inline
// strings (src/components/unggah/templat.ts). These read it and rewrite it in place, as a teacher editing it would,
// for the walks that upload it: audit/studio-ujung.mjs (local) and audit/staging/golden-school-studio.mjs (staging).
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function bacaZip(buf) {
  const entri = [];
  let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    if (buf.readUInt16LE(p + 8) !== 0) throw new Error("the workbook is not stored uncompressed");
    const n = buf.readUInt16LE(p + 26), x = buf.readUInt16LE(p + 28), size = buf.readUInt32LE(p + 18);
    const nama = buf.subarray(p + 30, p + 30 + n).toString("utf8");
    const isi = buf.subarray(p + 30 + n + x, p + 30 + n + x + size);
    entri.push({ nama, isi: Buffer.from(isi) });
    p += 30 + n + x + size;
  }
  return entri;
}
export function tulisZip(entri) {
  const lokal = [], pusat = [];
  let offset = 0;
  for (const e of entri) {
    const nama = Buffer.from(e.nama, "utf8"), crc = crc32(e.isi);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(0, 8);
    h.writeUInt16LE(0, 10); h.writeUInt16LE(33, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(e.isi.length, 18);
    h.writeUInt32LE(e.isi.length, 22); h.writeUInt16LE(nama.length, 26); h.writeUInt16LE(0, 28);
    lokal.push(h, nama, e.isi);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8);
    c.writeUInt16LE(0, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(33, 14); c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(e.isi.length, 20); c.writeUInt32LE(e.isi.length, 24); c.writeUInt16LE(nama.length, 28); c.writeUInt32LE(offset, 42);
    pusat.push(c, nama);
    offset += 30 + nama.length + e.isi.length;
  }
  const ukuran = pusat.reduce((n, b) => n + b.length, 0);
  const akhir = Buffer.alloc(22);
  akhir.writeUInt32LE(0x06054b50, 0); akhir.writeUInt16LE(entri.length, 8); akhir.writeUInt16LE(entri.length, 10);
  akhir.writeUInt32LE(ukuran, 12); akhir.writeUInt32LE(offset, 16);
  return Buffer.concat([...lokal, ...pusat, akhir]);
}
export const xmlTeks = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** The workbook with `ubah(namaLembar, xml) → xml` applied to each sheet. */
export function ubahBuku(buf, ubah) {
  const entri = bacaZip(buf);
  const buku = entri.find((e) => e.nama === "xl/workbook.xml").isi.toString("utf8");
  const nama = [...buku.matchAll(/<sheet name="([^"]*)" sheetId="(\d+)"/g)].map((m) => m[1]);
  return tulisZip(entri.map((e) => {
    const m = /^xl\/worksheets\/sheet(\d+)\.xml$/.exec(e.nama);
    if (!m) return e;
    const lembar = nama[Number(m[1]) - 1];
    return { nama: e.nama, isi: Buffer.from(ubah(lembar, e.isi.toString("utf8")), "utf8") };
  }));
}
/** In one sheet, the row whose cells include `kunci` exactly: `dari` → `ke` in that row only. */
export const ubahBaris = (xml, kunci, dari, ke) => xml.replace(/<row r="\d+">.*?<\/row>/g, (row) =>
  row.includes(`>${xmlTeks(kunci)}</t>`) ? row.replace(`>${xmlTeks(dari)}</t>`, `>${xmlTeks(ke)}</t>`) : row);

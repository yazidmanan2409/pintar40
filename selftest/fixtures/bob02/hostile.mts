/**
 * BOB02-X02's hostile workbooks (D-030(b)). Run in a child process by the
 * test, with a hard timeout, so a reader that goes quadratic is killed rather
 * than holding the suite: node tsx cli.mjs hostile.mts <path to xlsx.ts> [size].
 * Prints one JSON array: each shape, how long the read took, and its answer.
 */
import { deflateRawSync } from "node:zlib";
const mod = process.argv[2];
const { bacaBukuKerja, BATAS } = await import(mod);
function zip(entries: Array<{ name: string; data: string }>): Buffer {
  const locals: Buffer[] = []; const centrals: Buffer[] = []; let offset = 0;
  for (const e of entries) {
    const raw = Buffer.from(e.data, "utf8"); const body = deflateRawSync(raw); const name = Buffer.from(e.name);
    const l = Buffer.alloc(30); l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(8, 8); l.writeUInt32LE(body.length, 18); l.writeUInt32LE(raw.length, 22); l.writeUInt16LE(name.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(8, 10); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
    locals.push(l, name, body); centrals.push(c, name); offset += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(centrals); const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
const WB = `<workbook><sheets><sheet name="A" sheetId="1" r:id="rId1"/></sheets></workbook>`;
const RELS = `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`;
// each hostile part fills the inflation budget, less a margin for the others
const size = Number(process.argv[3] ?? BATAS.terurai - 1024 * 1024);
const fill = (pre: string, unit: string, post = "") => pre + unit.repeat(Math.floor((size - pre.length - post.length) / unit.length)) + post;
const shapes: Array<[string, Record<string, string>]> = [
  ["unclosed <row>", { sheet: fill("<worksheet><sheetData>", "<row>") }],
  ["unclosed <c>", { sheet: fill('<worksheet><sheetData><row r="1">', "<c>") }],
  ["unclosed <si>", { shared: fill("<sst>", "<si>") }],
  ["unclosed <t>", { shared: fill("<sst><si>", "<t>") }],
  ["unclosed <rPh>", { shared: fill("<sst><si>", "<rPh>") }],
  ["a <row> tag missing its >", { sheet: fill("<worksheet><sheetData><row", " a") }],
  ["an attribute missing its closing quote", { sheet: fill('<worksheet><sheetData><row r="', "x") }],
  ["<sheet> tags missing their >", { wb: fill("<workbook><sheets>", "<sheet ") }],
  ["<Relationship> tags missing their >", { rels: fill("<Relationships>", "<Relationship ") }],
  ["unclosed <v> inside a cell", { sheet: fill('<worksheet><sheetData><row r="1"><c r="A1">', "<v>") }],
  // and the honest case at scale: a well-formed sheet of 10,000 rows
  ["a well-formed sheet of 10,000 rows of 30 cells", { sheet: "<worksheet><sheetData>" + Array.from({ length: 10_000 }, (_, r) =>
      `<row r="${r + 1}">` + Array.from({ length: 30 }, (_, c) => `<c r="${c < 26 ? "" : "A"}${String.fromCharCode(65 + (c % 26))}${r + 1}" t="inlineStr"><is><t>sel ${r}.${c}</t></is></c>`).join("") + "</row>").join("") + "</sheetData></worksheet>" }],
];
const out: Array<{ shape: string; ms: number; code: string; bytes: number }> = [];
for (const [label, p] of shapes) {
  const buf = zip([
    { name: "xl/workbook.xml", data: p.wb ?? WB }, { name: "xl/_rels/workbook.xml.rels", data: p.rels ?? RELS },
    { name: "xl/sharedStrings.xml", data: p.shared ?? "<sst></sst>" },
    { name: "xl/worksheets/sheet1.xml", data: p.sheet ?? "<worksheet><sheetData></sheetData></worksheet>" },
  ]);
  const t0 = performance.now();
  const r = bacaBukuKerja(new Uint8Array(buf));
  out.push({ shape: label, ms: Math.round(performance.now() - t0), code: r.ok ? "read" : r.code, bytes: buf.length });
}
console.log(JSON.stringify(out));

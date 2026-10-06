/**
 * BOB-02 — THE LESSON WORKBOOK, STATICALLY (D-007, D-008, D-011, M8).
 *
 * Added, not edited: the whole ticket's static half, in its own file. The
 * behaviour is proved in the database by selftest/db/fable11.sql (F11-*); what
 * is proved here is everything before and around it -- the .xlsx reader on
 * real files and on hostile ones, the column contract, that the sample
 * workbook, its committed JSON and the literal F11 runs on are one package,
 * that every problem code has a sentence, and that the actions and routes
 * carry codes and call the functions by the names the migration declares.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { deflateRawSync } from "node:zlib";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES, type HleEvent } from "../src/lib/hle";
import { bacaBukuKerja, BATAS, type Lembar } from "../src/lib/xlsx";
import {
  KOLOM, LEMBAR, KODE_MASALAH_PAKET, KODE_TOLAK_PAKET, bukuKerjaKePaket, kodeGalatPaket,
  kunciKodePaket, kunciMasalahPaket, BATAS_PAKET, type KodePaket,
} from "../src/lib/unggah-kontrak";

const MIGRASI = "20261007100000_a_lesson_arrives_whole.sql";

/** A minimal zip writer, so a test can hand the reader exactly the bytes it means. */
function zip(entries: Array<{ name: string; data: string | Buffer; store?: boolean; declared?: number }>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data, "utf8");
    const body = e.store ? raw : deflateRawSync(raw);
    const name = Buffer.from(e.name, "utf8");
    const size = e.declared ?? raw.length;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(e.store ? 0 : 8, 8);
    local.writeUInt32LE(body.length, 18); local.writeUInt32LE(size, 22); local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(e.store ? 0 : 8, 10); central.writeUInt32LE(body.length, 20); central.writeUInt32LE(size, 24);
    central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, name, body);
    centrals.push(central, name);
    offset += local.length + name.length + body.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const WB = `<?xml version="1.0"?><workbook xmlns="x" xmlns:r="r"><sheets><sheet name="Satu &amp; Dua" sheetId="1" r:id="rId1"/></sheets></workbook>`;
const RELS = `<Relationships><Relationship Id="rId1" Type="t" Target="/xl/worksheets/sheet1.xml"/></Relationships>`;

function dibaca(buf: Buffer) {
  return bacaBukuKerja(new Uint8Array(buf));
}

/**
 * D-030(d): the sample workbook as real applications save it. The original is
 * openpyxl's; each copy is that file re-saved by the application named, and
 * must read to the same cells and the same package as the file it was saved
 * from (`asal`). A copy not yet delivered is a slot, reported rather than
 * skipped silently.
 *
 * D-040 regrouped the sample: its pre-test and post-test questions no longer
 * share a Kelompok paralel. The copies were saved from the sample before that
 * (kept byte for byte as contoh-pelajaran-v1.xlsx), so each is compared with
 * the file it came from, and the two originals are asserted to differ in
 * exactly those four cells.
 */
const SALINAN: ReadonlyArray<{ berkas: string; oleh: string; wajib: boolean; asal: string }> = [
  { berkas: "contoh-excel.xlsx", oleh: "Microsoft Excel for Mac 16", wajib: true, asal: "contoh-pelajaran-v1.xlsx" },
  { berkas: "contoh-gsheets.xlsx", oleh: "Google Sheets", wajib: false, asal: "contoh-pelajaran-v1.xlsx" },
];

/** Rows without trailing empty cells or trailing empty rows: what a person typed. */
function isiTerketik(baris: string[][]): string[][] {
  const out = baris.map((r) => { const x = [...r]; while (x.length && x[x.length - 1] === "") x.pop(); return x; });
  while (out.length && out[out.length - 1].length === 0) out.pop();
  return out;
}

export const unggahTests: SelfTest[] = [
  {
    // =======================================================================
    // BOB02-X01 — THE READER, ON REAL FILES AND ON HOSTILE ONES. Two files
    // written by two different tools (openpyxl's shared strings, and the
    // onboarding workbook's inline strings), one crafted file carrying every
    // cell form the reader claims to handle, and the refusals: not a zip,
    // truncated, too big, a size that lies, and a sheet past its row limit.
    // =======================================================================
    id: "BOB02-X01",
    run: async (ctx) => {
      const c = new Checks();
      const contoh = dibaca(readFileSync(join(ctx.repoRoot, "selftest", "fixtures", "bob02", "contoh-pelajaran.xlsx")));
      c.expect(contoh.ok, "the sample workbook could not be read");
      if (contoh.ok) {
        c.expect(contoh.lembar.map((l) => l.nama).join(",") === "Kursus,Bab,Pelajaran,Soal,Pilihan",
          `the sample's sheets came back as ${contoh.lembar.map((l) => l.nama).join(",")}`);
        const p = contoh.lembar[2].baris[1];
        c.expect(p[0] === "1" && p[2] === "Apa itu pecahan?" && p[4].includes("\n\nAngka di atas"),
          `the sample's first lesson row came back as ${JSON.stringify(p).slice(0, 120)}`);
      }
      const isian = dibaca(readFileSync(join(ctx.repoRoot, "docs", "onboarding", "PINTAR-Isian-Data-Sekolah.xlsx")));
      c.expect(isian.ok, "the onboarding workbook (inline strings, another writer) could not be read");
      if (isian.ok) {
        const kelas = isian.lembar.find((l) => l.nama === "Kelas");
        c.expect(kelas?.baris[0]?.[0] === "Sekolah" && kelas?.baris[1]?.[3] === "1A" && kelas?.baris[1]?.[4] === "2026/2027",
          `the onboarding workbook's Kelas sheet came back as ${JSON.stringify(kelas?.baris.slice(0, 2)).slice(0, 160)}`);
      }

      // each application's copy holds the cells of the file it was saved from, exactly
      const dir = join(ctx.repoRoot, "selftest", "fixtures", "bob02");
      // D-040: the regrouped sample differs from v1 in the four Kelompok paralel cells and nothing else
      const v1 = dibaca(readFileSync(join(dir, "contoh-pelajaran-v1.xlsx")));
      if (c.expect(v1.ok && contoh.ok, "contoh-pelajaran-v1.xlsx could not be read") && v1.ok && contoh.ok) {
        const beda: string[] = [];
        for (const l of contoh.lembar) {
          const a = isiTerketik(l.baris); const b = isiTerketik(v1.lembar.find((y) => y.nama === l.nama)?.baris ?? []);
          for (let r = 0; r < Math.max(a.length, b.length); r++) {
            for (let k = 0; k < Math.max(a[r]?.length ?? 0, b[r]?.length ?? 0); k++) {
              if ((a[r]?.[k] ?? "") !== (b[r]?.[k] ?? "")) beda.push(`${l.nama}!${r + 1}:${k + 1}=${b[r]?.[k] ?? ""}`);
            }
          }
        }
        c.expect(JSON.stringify(beda) === JSON.stringify(["Soal!2:10=P1", "Soal!3:10=P1", "Soal!4:10=P2", "Soal!5:10=P2"]),
          `the regrouped sample differs from v1 in ${JSON.stringify(beda).slice(0, 200)}, not exactly its four Kelompok paralel cells`);
      }
      let salinan = 0;
      for (const x of SALINAN) {
        if (!existsSync(join(dir, x.berkas))) {
          c.expect(!x.wajib, `${x.berkas} (${x.oleh}) is missing from selftest/fixtures/bob02`);
          if (!x.wajib) c.note(`${x.berkas} (${x.oleh}) not yet delivered`);
          continue;
        }
        const r = dibaca(readFileSync(join(dir, x.berkas)));
        c.expect(r.ok, `${x.berkas} (${x.oleh}) could not be read: ${!r.ok ? r.code : ""}`);
        const sumber = dibaca(readFileSync(join(dir, x.asal)));
        if (!r.ok || !sumber.ok) continue;
        for (const l of sumber.lembar) {
          const lain = r.lembar.find((y) => y.nama === l.nama);
          c.expect(!!lain, `${x.berkas} has no sheet ${l.nama}`);
          if (!lain) continue;
          const a1 = JSON.stringify(isiTerketik(l.baris));
          const b1 = JSON.stringify(isiTerketik(lain.baris));
          c.expect(a1 === b1, `${x.berkas}'s ${l.nama} sheet does not hold the cells of ${x.asal}: ${b1.slice(0, 160)}`);
        }
        salinan += 1;
      }

      const sheet = `<worksheet><sheetData>
        <row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>inline</t></is></c></row>
        <row r="3"><c t="s"><v>1</v></c><c t="b"><v>1</v></c><c t="str"><v>formula &lt;teks&gt;</v></c><c><v>0.5</v></c></row>
        <row r="4"><c r="A4" t="s"><v>2</v></c></row>
        <row r="5"><c t="n"><v>3.0</v></c><c><v>12.000</v></c><c><v>-4.0</v></c><c><v>78.145</v></c><c t="str"><v>5.0</v></c><c t="s"><v>3</v></c><c><v>1.05</v></c></row>
      </sheetData></worksheet>`;
      const shared = `<sst><si><r><t>Ha</t></r><r><t xml:space="preserve">lo </t></r><rPh><t>FONETIK</t></rPh></si><si><t>A&amp;B &#x41;&#66; baris_x000D_</t></si><si><t>dua_x000D_
baris</t></si><si><t>6.0</t></si></sst>`;
      const buat = dibaca(zip([
        { name: "xl/workbook.xml", data: WB, store: true },
        { name: "xl/_rels/workbook.xml.rels", data: RELS },
        { name: "xl/sharedStrings.xml", data: shared },
        { name: "xl/worksheets/sheet1.xml", data: sheet },
      ]));
      c.expect(buat.ok, "a crafted workbook could not be read");
      if (buat.ok) {
        const [l] = buat.lembar;
        c.expect(l.nama === "Satu & Dua", `the sheet name came back as ${l.nama}`);
        c.expect(JSON.stringify(l.baris[0]) === JSON.stringify(["Halo ", "", "inline"]),
          `rich text, a gap and an inline string came back as ${JSON.stringify(l.baris[0])}`);
        c.expect(JSON.stringify(l.baris[1]) === "[]", "the missing row 2 is not an empty row");
        c.expect(JSON.stringify(l.baris[2]) === JSON.stringify(["A&B AB baris\n", "TRUE", "formula <teks>", "0.5"]),
          `entities, escapes, cells without a reference, a boolean and a formula string came back as ${JSON.stringify(l.baris[2])}`);
        c.expect(JSON.stringify(l.baris[3]) === JSON.stringify(["dua\nbaris"]),
          `Excel's CR LF line break came back as ${JSON.stringify(l.baris[3])}`);
        // BOB-16: Google Sheets stores a whole number as N.0 where Excel stores
        // N. A NUMBER cell that is whole reads as N; a fraction, a formula's
        // text and typed text keep exactly what was stored
        c.expect(JSON.stringify(l.baris[4]) === JSON.stringify(["3", "12", "-4", "78.145", "5.0", "6.0", "1.05"]),
          `whole numbers stored as N.0, a fraction, a formula string and typed text came back as ${JSON.stringify(l.baris[4])}`);
      }

      const tolak: Array<[string, Buffer, string]> = [
        ["not a zip", Buffer.from("ini bukan buku kerja, hanya teks biasa yang cukup panjang"), "WORKBOOK_UNREADABLE"],
        ["a truncated workbook", readFileSync(join(ctx.repoRoot, "selftest", "fixtures", "bob02", "contoh-pelajaran.xlsx")).subarray(0, 4000), "WORKBOOK_UNREADABLE"],
        ["a file past 5 MB", Buffer.alloc(BATAS.berkas + 1), "WORKBOOK_TOO_LARGE"],
        ["a part that inflates past its declared size", zip([
          { name: "xl/workbook.xml", data: WB }, { name: "xl/_rels/workbook.xml.rels", data: RELS },
          { name: "xl/worksheets/sheet1.xml", data: Buffer.alloc(2 * 1024 * 1024, 65), declared: 100 },
        ]), "WORKBOOK_UNREADABLE"],
        ["parts declaring more than 40 MB", zip([
          { name: "xl/workbook.xml", data: WB }, { name: "xl/_rels/workbook.xml.rels", data: RELS },
          { name: "xl/worksheets/sheet1.xml", data: "<worksheet/>", declared: BATAS.terurai + 1 },
        ]), "WORKBOOK_TOO_LARGE"],
        ["a sheet past 10,000 rows", zip([
          { name: "xl/workbook.xml", data: WB }, { name: "xl/_rels/workbook.xml.rels", data: RELS },
          { name: "xl/worksheets/sheet1.xml", data: `<worksheet><sheetData><row r="${BATAS.baris + 1}"><c r="A${BATAS.baris + 1}"><v>1</v></c></row></sheetData></worksheet>` },
        ]), "WORKBOOK_TOO_LARGE"],
        ["a zip without a workbook part", zip([{ name: "word/document.xml", data: "<w/>" }]), "WORKBOOK_UNREADABLE"],
      ];
      for (const [label, buf, want] of tolak) {
        const r = dibaca(buf);
        c.expect(!r.ok && r.code === want, `${label} came back ${r.ok ? "read" : r.code}, not ${want}`);
      }
      return c.verdict(
        "the .xlsx reader in the source file src/lib/xlsx.ts reads the sample workbook as openpyxl wrote it and as " +
        `${salinan} real application(s) re-saved it (${SALINAN.filter((x) => existsSync(join(dir, x.berkas))).map((x) => x.oleh).join(", ")}; every copy delivered holds ` +
        "exactly the original's cells), the onboarding file's inline strings, and a crafted one carrying rich text with " +
        "phonetic runs, entities and _xHHHH_ escapes, Excel's CR LF line break as a newline, gaps, cells without references, " +
        "booleans and formula strings; it refuses a non-zip, " +
        `a truncated file, a file past 5 MB, a part that inflates past its declared size, parts declaring more than 40 MB, ` +
        `a sheet past ${BATAS.baris} rows and a zip without a workbook (${tolak.length} refusals)`,
      );
    },
  },
  {
    // =======================================================================
    // BOB02-X02 — EVERY SCAN IS LINEAR (D-030(b)). A 5 MB upload can inflate
    // to 40 MB, and the earlier reader's regular expressions went quadratic on
    // unclosed tags: 400 KB of unclosed <si> took 14 s, so the 40 MB budget
    // would hold a server function for hours. Each hostile shape here fills
    // the budget and must be refused in well under a second; a well-formed
    // 10,000-row sheet must still be read. The reads run in a child process
    // with a hard timeout, so a reader that goes quadratic fails this test by
    // being killed rather than by hanging the suite.
    // =======================================================================
    id: "BOB02-X02",
    run: async (ctx) => {
      const c = new Checks();
      const cli = join(ctx.repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
      const harness = join(ctx.repoRoot, "selftest", "fixtures", "bob02", "hostile.mts");
      const r = spawnSync(process.execPath, [cli, harness, join(ctx.repoRoot, "src", "lib", "xlsx.ts")],
        { encoding: "utf8", timeout: 30_000, maxBuffer: 1 << 20 });
      if (r.error || r.status !== 0) {
        c.expect(false, `the hostile reads did not finish within 30 s (${r.error?.message ?? r.stderr.split("\n").filter(Boolean).pop()})`);
        return c.verdict("");
      }
      const out = JSON.parse(r.stdout.trim()) as Array<{ shape: string; ms: number; code: string; bytes: number }>;
      const HOSTILE_MS = 1000;
      const VALID_MS = 2500;
      let terlama = 0;
      for (const x of out) {
        const sah = x.shape.startsWith("a well-formed");
        c.expect(sah ? x.code === "read" : x.code !== "read", `${x.shape} came back ${x.code}`);
        c.expect(x.ms < (sah ? VALID_MS : HOSTILE_MS), `${x.shape} took ${x.ms} ms`);
        c.expect(x.bytes < BATAS.berkas, `${x.shape} is ${x.bytes} bytes, not an upload the route would accept`);
        if (!sah) terlama = Math.max(terlama, x.ms);
      }
      c.expect(out.length === 11, `${out.length} shape(s) reported, expected 11`);
      const sah = out.find((x) => x.shape.startsWith("a well-formed"));
      return c.verdict(
        `${out.length - 1} hostile workbooks, each an upload under 5 MB inflating to the 40 MB budget -- unclosed <row>, <c>, ` +
        "<si>, <t>, <rPh> and <v>, a tag missing its >, an attribute missing its quote, and <sheet> and <Relationship> " +
        `tags missing their > -- were each refused by the reader in the source file src/lib/xlsx.ts in at most ${terlama} ms ` +
        `(bound ${HOSTILE_MS} ms), and a well-formed 10,000-row sheet was read in ${sah?.ms ?? "?"} ms (bound ${VALID_MS} ms)`,
      );
    },
  },
  {
    // =======================================================================
    // BOB02-K01 — THE SAMPLE WORKBOOK, ITS JSON AND WHAT F11 RUNS ON ARE ONE
    // PACKAGE, and the converter finds what only a workbook can get wrong.
    // =======================================================================
    id: "BOB02-K01",
    run: async (ctx) => {
      const c = new Checks();
      const dir = join(ctx.repoRoot, "selftest", "fixtures", "bob02");
      const baca = dibaca(readFileSync(join(dir, "contoh-pelajaran.xlsx")));
      c.expect(baca.ok, "the sample workbook could not be read");
      const paket = baca.ok ? bukuKerjaKePaket(baca.lembar) : null;
      c.expect(paket?.ok === true, `the sample workbook has problems: ${paket && !paket.ok ? JSON.stringify(paket.problems) : ""}`);
      const json = JSON.parse(readFileSync(join(dir, "contoh-pelajaran.paket.json"), "utf8"));
      const suite = readFileSync(join(ctx.repoRoot, "selftest", "db", "fable11.sql"), "utf8");
      const lit = /create or replace function selftest\.f11_contoh\(\)[\s\S]*?select '([\s\S]*?)'::jsonb/.exec(suite)?.[1];
      c.expect(!!lit, "fable11.sql carries no sample literal");
      if (paket?.ok) {
        c.expect(JSON.stringify(paket.paket) === JSON.stringify(json),
          "the committed contoh-pelajaran.paket.json is not what the converter makes of the sample workbook");
        c.expect(!!lit && JSON.stringify(JSON.parse(lit.replace(/''/g, "'"))) === JSON.stringify(json),
          "the literal F11 runs on is not the committed sample package");
        c.expect(JSON.stringify(paket.media) === JSON.stringify(["Kue Empat Potong.png", "penjelasan-senilai.mp3"]),
          `the sample names media ${JSON.stringify(paket.media)}`);
      }

      // the same package, whichever application saved the workbook (D-030(d))
      let sama = 0;
      for (const x of SALINAN) {
        if (!existsSync(join(dir, x.berkas))) { c.expect(!x.wajib, `${x.berkas} (${x.oleh}) is missing`); continue; }
        const r = dibaca(readFileSync(join(dir, x.berkas)));
        const p = r.ok ? bukuKerjaKePaket(r.lembar) : null;
        const src = dibaca(readFileSync(join(dir, x.asal)));
        const q = src.ok ? bukuKerjaKePaket(src.lembar) : null;
        const sah = p?.ok === true && q?.ok === true && JSON.stringify(p.paket) === JSON.stringify(q.paket);
        c.expect(sah, `${x.berkas} (${x.oleh}) does not make the package ${x.asal} makes`);
        if (sah) sama += 1;
      }

      // what only a workbook can get wrong, each at its sheet and row
      const lembar = (over: Partial<Record<string, string[][]>> = {}): Lembar[] =>
        LEMBAR.map((n) => ({
          nama: n.toUpperCase(),
          baris: over[n] ?? [KOLOM[n].map((k) => ` ${k.judul.toLowerCase()} * `), ...({
            Kursus: [["Judul", "Mapel", "SD", "Kelas 1", ""]],
            Bab: [["1", "Bab satu"]],
            Pelajaran: [["1", "1", "Pelajaran", "", "Isi", "", "", "", ""]],
            Soal: [["S1", "1", "1", "", "Tanya?", "", "", "Pemetaan awal", "Mudah", ""]],
            Pilihan: [["S1", "a", "Satu", "Ya", "Karena"], ["S1", "B", "Dua", "Tidak", "Bukan"]],
          } as Record<string, string[][]>)[n]],
        }));
      const baik = bukuKerjaKePaket(lembar());
      c.expect(baik.ok, `a minimal workbook with headers in another case and spacing was refused: ${!baik.ok ? JSON.stringify(baik.problems) : ""}`);
      if (baik.ok) {
        const s = JSON.stringify(baik.paket);
        c.expect(s.includes('"use":"PRE_TEST"') && s.includes('"difficulty":"0.3"') && s.includes('"is_correct":true')
          && s.includes('"label":"A"'), `the choices were not mapped: ${s.slice(0, 200)}`);
      }
      const kepala = (n: keyof typeof KOLOM) => KOLOM[n].map((k) => k.judul);
      const salah: Array<[string, Lembar[], string, string, number | undefined]> = [
        ["a missing sheet", lembar().filter((l) => l.nama !== "BAB"), "WORKBOOK_SHEET_MISSING", "Bab", undefined],
        ["a missing required column", lembar({ Soal: [kepala("Soal").filter((j) => j !== "Pertanyaan")] }), "WORKBOOK_COLUMN_MISSING", "Soal", undefined],
        ["a value not in the list", lembar({ Soal: [kepala("Soal"), ["S1", "1", "1", "", "Tanya?", "", "", "Ujian akhir", "", ""]] }), "WORKBOOK_VALUE_UNKNOWN", "Soal", 2],
        ["a required cell left empty", lembar({ Bab: [kepala("Bab"), ["1", ""]] }), "WORKBOOK_VALUE_REQUIRED", "Bab", 2],
        ["a lesson in a chapter that does not exist", lembar({ Pelajaran: [kepala("Pelajaran"), ["9", "1", "P", "", "Isi", "", "", "", ""]] }), "WORKBOOK_CHAPTER_UNKNOWN", "Pelajaran", 2],
        ["an option for a question that does not exist", lembar({ Pilihan: [kepala("Pilihan"), ["S1", "A", "x", "Ya", "y"], ["S9", "A", "x", "Ya", "y"]] }), "WORKBOOK_QUESTION_UNKNOWN", "Pilihan", 3],
        ["a question with no options", lembar({ Pilihan: [kepala("Pilihan")] }), "WORKBOOK_QUESTION_WITHOUT_OPTIONS", "Soal", 2],
        ["two course rows", lembar({ Kursus: [kepala("Kursus"), ["A", "B", "C", "D", ""], ["E", "F", "G", "H", ""]] }), "WORKBOOK_COURSE_ROWS_MANY", "Kursus", 3],
      ];
      for (const [label, l, code, sheet, row] of salah) {
        const r = bukuKerjaKePaket(l);
        const hit = !r.ok && r.problems.find((p) => p.code === code && p.sheet === sheet && (row === undefined || p.row === row));
        c.expect(!!hit, `${label} came back ${r.ok ? "accepted" : JSON.stringify(r.problems).slice(0, 160)}, not ${code} at ${sheet}${row ? ` ${row}` : ""}`);
      }
      for (const n of LEMBAR) {
        const judul = KOLOM[n].map((k) => k.judul.toLowerCase());
        c.expect(new Set(judul).size === judul.length, `the ${n} sheet declares a header twice`);
      }
      return c.verdict(
        `the sample workbook, ${sama} copy(ies) of it re-saved by a real application, the committed file ` +
        "contoh-pelajaran.paket.json and the literal F11 runs on are one package, " +
        "naming two media files; headers match in any case, spacing and order, choices map to their values, and " +
        `${salah.length} workbook-only faults each come back as their code at their sheet and row`,
      );
    },
  },
  {
    // =======================================================================
    // BOB02-K02 — EVERY CODE HAS A SENTENCE, AND NOTHING ELSE REACHES A
    // SCREEN. Read from the migration source: the codes its check and
    // refusals can produce are the contract's; every code has a key in the
    // copy table in both languages; and the actions keep database text in the
    // server log, confirm through confirm_ingest_batch and never write the
    // status that does not exist.
    // =======================================================================
    id: "BOB02-K02",
    run: async (ctx) => {
      const c = new Checks();
      // BOB-04 (D-040) replaced lesson_package_check, adding one code: both sources are read
      // D-085 M10 added a correction's own problems (package_revision_problems): read too
      // RESTATED FOR CR-50 (D-063 M5): 20261202100000 replaces lesson_package_check with the «Miskonsepsi» codes; read too
      const sql = [MIGRASI, "20261010100000_a_lesson_is_assigned_whole.sql", "20261106100000_a_correction_arrives_in_its_line.sql",
        "20261202100000_a_misconception_belongs_to_its_contents_owner.sql"]
        .map((f) => readFileSync(join(ctx.repoRoot, "supabase", "migrations", f), "utf8")).join("\n").replace(/--[^\n]*/g, "");
      const dariDb = new Set<string>();
      for (const m of sql.matchAll(/package_problem\('([A-Z_]+)'/g)) dariDb.add(m[1]);
      for (const m of sql.matchAll(/'code', '([A-Z_]+)'/g)) if (m[1] !== "PACKAGE_CONFIRM") dariDb.add(m[1]);
      const katalog = new Set<string>(KODE_MASALAH_PAKET);
      for (const k of dariDb) c.expect(katalog.has(k), `the database can return ${k} and the contract does not name it`);
      for (const k of katalog) {
        if (k.startsWith("WORKBOOK_") || k === "PACKAGE_JSON_UNREADABLE") continue;
        c.expect(dariDb.has(k), `the contract names ${k} and the database never returns it`);
      }
      const tolak = /create function public\.package_refuse[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
      const tolakDb = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((m) => m[1]).sort();
      c.expect(JSON.stringify(tolakDb) === JSON.stringify([...KODE_TOLAK_PAKET].sort()),
        `package_refuse raises ${tolakDb.join(",")} and the contract names ${KODE_TOLAK_PAKET.join(",")}`);

      const MESIN = /PACKAGE_|WORKBOOK_|PR0\d\d|jsonb|uuid|ingest_|SQLSTATE|MCQ_|PRE_TEST|POST_TEST/;
      const kunci: HleEvent[] = [...KODE_MASALAH_PAKET.map(kunciMasalahPaket), kunciMasalahPaket("TIDAK_ADA"),
        ...([...KODE_TOLAK_PAKET, "PACKAGE_HAS_PROBLEMS", "PACKAGE_INPUT_INVALID", "PACKAGE_FAILED"] as KodePaket[]).map(kunciKodePaket)];
      for (const k of kunci) {
        for (const l of LOCALES) {
          let s = "";
          try { s = t(k, "staff", { locale: l }); } catch { s = ""; }
          c.expect(s.trim() !== "" && s !== k, `${k} has no ${l} telling`);
          c.expect(!MESIN.test(s), `${k} names the machinery in ${l}: ${s.slice(0, 60)}`);
        }
      }
      c.expect(kunciMasalahPaket("SOMETHING_NEW") === "studio.paket.masalah.lain", "an unknown code would render raw");
      for (const [e, want] of [
        [{ code: "PR030", details: "PACKAGE_NOT_ALLOWED" }, "PACKAGE_NOT_ALLOWED"],
        [{ code: "PR030", details: "PACKAGE_STATE_INVALID" }, "PACKAGE_STATE_INVALID"],
        [{ code: "PR030", details: "this batch is RECEIVED" }, "PACKAGE_FAILED"],
        [{ code: "22P02", details: null }, "PACKAGE_FAILED"],
        [{ code: "42501", details: null }, "PACKAGE_NOT_ALLOWED"],
        [null, "PACKAGE_FAILED"],
      ] as const) {
        c.expect(kodeGalatPaket(e) === want, `${JSON.stringify(e)} became ${kodeGalatPaket(e)}, not ${want}`);
      }

      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "actions.ts"), "utf8");
      const bagian = aksi.slice(aksi.indexOf("// ----------------------------------------------------------------- ingestion"),
                                aksi.indexOf("// ------------------------------------------------------------------ panels"))
        .replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
      c.expect(bagian.length > 1000, "the ingestion section of src/app/studio/actions.ts could not be read");
      c.expect(!/"MAPPED"/.test(bagian), "an action still writes the status 'MAPPED', which ingest_status does not have (bug A)");
      c.expect(!/from\("ingest_batches"\)\s*\.update/.test(bagian), "an action confirms a batch by writing its status directly");
      c.expect(!/ingest_structured_package/.test(bagian), "an action still materialises before anyone confirms (bug B)");
      c.expect(/rpc\("confirm_ingest_batch", \{ p_batch: batch \}\)/.test(bagian)
        && /rpc\("prepare_ingest_batch", \{ p_batch: batch\.id \}\)/.test(bagian),
        "the actions do not prepare and confirm through prepare_ingest_batch(p_batch) and confirm_ingest_batch(p_batch)");
      for (const fn of ["prepare_ingest_batch", "confirm_ingest_batch", "may_upload_package_media"]) {
        c.expect(new RegExp(`create function public\\.${fn}\\((p_batch uuid|p_path text)\\)`).test(sql), `${fn} is not declared as the actions call it`);
      }
      const bocor = [...bagian.matchAll(/error\??\.message/g)].length;
      const dicatat = [...bagian.matchAll(/console\.error\([^)]*error\??\.message/g)].length;
      c.expect(bocor === dicatat, `${bocor - dicatat} use(s) of error.message outside the server log`);
      for (const nama of ["unggahBukuKerjaAksi", "siapkanPaketAksi", "konfirmasiPaketAksi"]) {
        c.expect(new RegExp(`export async function ${nama}\\(_prev: HasilPaket \\| null, fd: FormData\\): Promise<HasilPaket>`).test(bagian),
          `${nama} is not shaped (prev, FormData) => Promise<HasilPaket>`);
      }
      return c.verdict(
        `read from the migration source: the ${dariDb.size} problem codes its check and confirmation can return and the ` +
        `${tolakDb.length} refusal codes of package_refuse are exactly the contract's; all ${kunci.length} codes have a key ` +
        "in the copy table in both languages without machinery words, and an unknown code falls back to one sentence; the " +
        "ingestion actions never write 'MAPPED', never update a batch's status directly, never materialise before a " +
        "confirmation, keep error.message in the server log, and call prepare_ingest_batch and confirm_ingest_batch by " +
        "their declared arguments",
      );
    },
  },
  {
    // =======================================================================
    // BOB02-K03 — THE LIMITS THE TEMPLATE STATES ARE THE ONES ENFORCED
    // (D-030). Every number and list in BATAS_PAKET is read back from the
    // reader's BATAS or from the clause of lesson_package_check that enforces
    // it, and names the code that clause returns.
    // =======================================================================
    id: "BOB02-K03",
    run: async (ctx) => {
      const c = new Checks();
      const sql = readFileSync(join(ctx.repoRoot, "supabase", "migrations", MIGRASI), "utf8").replace(/--[^\n]*/g, "");
      const b = BATAS_PAKET;
      c.expect(b.berkasMaks.nilai === BATAS.berkas, `the template states ${b.berkasMaks.nilai} bytes and the reader allows ${BATAS.berkas}`);
      c.expect(b.teruraiMaks.nilai === BATAS.terurai, `the template states ${b.teruraiMaks.nilai} unpacked bytes and the reader allows ${BATAS.terurai}`);
      c.expect(b.barisMaks.nilai === BATAS.baris, `the template states ${b.barisMaks.nilai} rows and the reader allows ${BATAS.baris}`);
      c.expect(b.kolomMaks.nilai === BATAS.kolom, `the template states ${b.kolomMaks.nilai} columns and the reader allows ${BATAS.kolom}`);
      const t = b.teksMaks.nilai;
      const klausa: Array<[string, string, string]> = [
        ["kursusMaks", `jsonb_array_length(p_package -> 'courses') > ${b.kursusMaks.nilai} then\n    v_p := v_p || public.package_problem('${b.kursusMaks.kode}'`, ""],
        ["pelajaranMaks/soalMaks", `if n_i > ${b.soalMaks.nilai} or n_l > ${b.pelajaranMaks.nilai} then\n    v_p := v_p || public.package_problem('${b.soalMaks.kode}'`, ""],
        ["pilihanMin", `if v_n < ${b.pilihanMin.nilai} then v_p := v_p || public.package_problem('${b.pilihanMin.kode}'`, ""],
        ["pilihanMaks", `elsif v_n > ${b.pilihanMaks.nilai} then v_p := v_p || public.package_problem('${b.pilihanMaks.kode}'`, ""],
        ["labelPilihan", `if v_t !~ '^[${b.labelPilihan.nilai[0]}-${b.labelPilihan.nilai.at(-1)}]$' then v_p := v_p || public.package_problem('${b.labelPilihan.kode}'`, ""],
        ["jenisSoal", `if v_type not in (${b.jenisSoal.nilai.map((v) => `'${v}'`).join(", ")}) then\n            v_p := v_p || public.package_problem('${b.jenisSoal.kode}'`, ""],
        ["namaMediaMaks", `length(v_name) > ${b.namaMediaMaks.nilai} or v_name !~ '^[a-z0-9][a-z0-9_.-]*$' then\n            v_p := v_p || public.package_problem('${b.namaMediaMaks.kode}'`, ""],
        ["jenisMedia", `elsif v_kind is null then\n            v_p := v_p || public.package_problem('${b.jenisMedia.kode}'`, ""],
        ["transkripWajib", `if v_kind in (${b.transkripWajib.nilai.map((v) => `'${v}'`).join(", ")}) and public.package_text(md, 'transcript') is null then\n              v_p := v_p || public.package_problem('${b.transkripWajib.kode}'`, ""],

        ["teksMaks.kursus", `if length(coalesce(public.package_text(c, v_t), '')) > ${t.judulKursus} then\n        v_p := v_p || public.package_problem('${b.teksMaks.kode}', c, v_path, v_t)`, ""],
        ["teksMaks.judulBab", `length(public.package_text(m, 'title')) > ${t.judulBab} then v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
        ["teksMaks.judulPelajaran", `length(public.package_text(l, 'title')) > ${t.judulPelajaran} then v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
        ["teksMaks.isiPelajaran", `length(public.package_text(l, 'body_markdown')) > ${t.isiPelajaran} then\n          v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
        ["teksMaks.ringkasan", `length(coalesce(public.package_text(l, 'summary'), '')) > ${t.ringkasan} then\n          v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
        ["teksMaks.soal", `length(public.package_text(i, 'stem')) > ${t.soal} then v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
        ["teksMaks.stimulus", `length(coalesce(public.package_text(i, 'stimulus'), '')) > ${t.stimulus} then\n            v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
        ["teksMaks.kelompokSetara", `if length(v_t) > ${t.kelompokSetara} then v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
        ["teksMaks.pilihan", `length(public.package_text(o, 'body')) > ${t.pilihan} then v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
        ["teksMaks.alasan", `length(public.package_text(o, 'rationale')) > ${t.alasan} then v_p := v_p || public.package_problem('${b.teksMaks.kode}'`, ""],
      ];
      for (const [nama, potongan] of klausa) {
        c.expect(sql.includes(potongan), `BATAS_PAKET.${nama} is not the clause lesson_package_check enforces`);
      }
      // RESTATED FOR CR-50 (D-063 M5, a changed requirement): an option's misconception must be defined in the package's
      // own «Miskonsepsi» (misconceptions), read from the migration that now defines lesson_package_check
      const sql50 = readFileSync(join(ctx.repoRoot, "supabase", "migrations", "20261202100000_a_misconception_belongs_to_its_contents_owner.sql"), "utf8");
      c.expect(sql50.includes(`p_package ? '${b.miskonsepsi.nilai}'`)
        && sql50.includes(`if v_t is not null and not (v_t = any (v_codes)) then\n              v_p := v_p || public.package_problem('${b.miskonsepsi.kode}'`),
        "BATAS_PAKET.miskonsepsi is not the clause lesson_package_check enforces");
      c.expect(t.mapel === t.judulKursus && t.jenjang === t.judulKursus && t.kelas === t.judulKursus,
        "the course's subject, stage and grade share the title's limit in the database");
      c.expect(sql.includes("foreach v_t in array array['title', 'subject', 'stage', 'grade_label'] loop"),
        "the course's four texts are no longer checked by one limit");
      // the media kinds are exactly the extensions package_media_kind knows
      const fn = /create function public\.package_media_kind[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
      const db: Record<string, string[]> = {};
      for (const m of fn.matchAll(/when p_name ~ '\\\.\(([^)]*)\)\$'\s+then '([a-z]+)'|when p_name ~ '\\\.([a-z]+)\$'\s+then '([a-z]+)'/g)) {
        const kind = m[2] ?? m[4];
        const ext = (m[1] ?? m[3]).split("|").flatMap((e) => (e === "jpe?g" ? ["jpg", "jpeg"] : [e]));
        db[kind] = ext.sort();
      }
      const kontrak = Object.fromEntries(Object.entries(b.jenisMedia.nilai).map(([k, v]) => [k, [...v].sort()]));
      c.expect(JSON.stringify(db) === JSON.stringify(kontrak),
        `package_media_kind knows ${JSON.stringify(db)} and the template states ${JSON.stringify(kontrak)}`);
      const codes = new Set<string>(KODE_MASALAH_PAKET);
      for (const [nama, v] of Object.entries(b)) c.expect(codes.has(v.kode), `BATAS_PAKET.${nama} names ${v.kode}, not a contract code`);
      return c.verdict(`the template's v1 limits are the reader's (5 MB, 40 MB unpacked, 10,000 rows, 200 columns) and `
        + `the database's (20 courses, 500 lessons, 2,000 questions, 2-5 options labelled A-E, MCQ_SINGLE and MCQ_MULTI, `
        + `media names up to 110 characters of ${Object.keys(b.jenisMedia.nilai).length} kinds, a transcript for sound and video, `
        + `a misconception only when the file's own «Miskonsepsi» defines it, and ${Object.keys(t).length} text lengths), each with its contract code`);
    },
  },
  {
    // =======================================================================
    // BOB02-R01 — THE MEDIA PATH IS ONE PATH. The upload route signs
    // pelajaran/<school>/<batch>/<file> only on may_upload_package_media's
    // word, the read route accepts exactly that shape (and the flat seeded
    // one), and the longest path the database can name fits the upload
    // route's own limit.
    // =======================================================================
    id: "BOB02-R01",
    run: async (ctx) => {
      const c = new Checks();
      const api = join(ctx.repoRoot, "src", "app", "api", "assets");
      const up = readFileSync(join(api, "upload-url", "route.ts"), "utf8");
      const rd = readFileSync(join(api, "read-url", "route.ts"), "utf8");
      c.expect(/path\.startsWith\("pelajaran\/"\)[\s\S]{0,600}rpc\("may_upload_package_media", \{ p_path: path \}\)/.test(up),
        "the upload route does not ask may_upload_package_media before signing a pelajaran/ path");
      const src = /const lesson = \/(.+)\/i\.test\(path\);/.exec(rd)?.[1];
      c.expect(!!src, "the read route's lesson-path rule could not be read");
      const re = new RegExp(src ?? "^$", "i");
      const u = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";
      for (const [p, want] of [
        [`pelajaran/${u}/${u}/kue-empat-potong.png`, true], ["pelajaran/pecahan-senilai.mp3", true],
        [`pelajaran/${u}/kue.png`, false], ["pelajaran/a/b/c.png", false], ["pelajaran/../rahasia.pdf", false],
        [`content/${u}/x.png`, false], [`pelajaran/${u}/${u}/`, false],
      ] as const) {
        c.expect(re.test(p) === want, `the read route ${want ? "refuses" : "accepts"} ${p}`);
      }
      const upLimit = Number(/\{3,(\d+)\}\$\/i\.test\(path\)/.exec(up)?.[1] ?? 0);
      const longest = "pelajaran/".length + 36 + 1 + 36 + 1 + 110;
      c.expect(upLimit >= longest, `the upload route allows ${upLimit} characters and a package path can be ${longest}`);
      const sql = readFileSync(join(ctx.repoRoot, "supabase", "migrations", MIGRASI), "utf8");
      c.expect(/length\(v_name\) > 110/.test(sql) && /\[a-z0-9_.-\]\{0,109\}/.test(sql),
        "the migration's media-name limit is not the 110 characters the route length allows");
      const migs = readdirSync(join(ctx.repoRoot, "supabase", "migrations"));
      c.expect(migs.includes(MIGRASI), `${MIGRASI} is not in the tree`);
      return c.verdict(
        "the upload route source signs a pelajaran/ path only on may_upload_package_media's answer; the read route " +
        "accepts pelajaran/<school>/<batch>/<file> and the seeded flat path and refuses 5 near misses; the longest " +
        `package path (${longest} characters) fits the upload route's ${upLimit}-character rule`,
      );
    },
  },
];

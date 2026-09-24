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
import { readFileSync, readdirSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES, type HleEvent } from "../src/lib/hle";
import { bacaBukuKerja, BATAS, type Lembar } from "../src/lib/xlsx";
import {
  KOLOM, LEMBAR, KODE_MASALAH_PAKET, KODE_TOLAK_PAKET, bukuKerjaKePaket, kodeGalatPaket,
  kunciKodePaket, kunciMasalahPaket, type KodePaket,
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

      const sheet = `<worksheet><sheetData>
        <row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>inline</t></is></c></row>
        <row r="3"><c t="s"><v>1</v></c><c t="b"><v>1</v></c><c t="str"><v>formula &lt;teks&gt;</v></c><c><v>0.5</v></c></row>
      </sheetData></worksheet>`;
      const shared = `<sst><si><r><t>Ha</t></r><r><t xml:space="preserve">lo </t></r><rPh><t>FONETIK</t></rPh></si><si><t>A&amp;B &#x41;&#66; baris_x000D_</t></si></sst>`;
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
        c.expect(JSON.stringify(l.baris[2]) === JSON.stringify(["A&B AB baris\r", "TRUE", "formula <teks>", "0.5"]),
          `entities, escapes, cells without a reference, a boolean and a formula string came back as ${JSON.stringify(l.baris[2])}`);
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
        "the .xlsx reader in the source file src/lib/xlsx.ts reads two workbooks written by two tools (openpyxl's " +
        "shared strings, the onboarding file's inline strings) and a crafted one carrying rich text with phonetic runs, " +
        "entities and _xHHHH_ escapes, gaps, cells without references, booleans and formula strings; it refuses a non-zip, " +
        `a truncated file, a file past 5 MB, a part that inflates past its declared size, parts declaring more than 40 MB, ` +
        `a sheet past ${BATAS.baris} rows and a zip without a workbook (${tolak.length} refusals)`,
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
        "the sample workbook, the committed file contoh-pelajaran.paket.json and the literal F11 runs on are one package, " +
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
      const sql = readFileSync(join(ctx.repoRoot, "supabase", "migrations", MIGRASI), "utf8").replace(/--[^\n]*/g, "");
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

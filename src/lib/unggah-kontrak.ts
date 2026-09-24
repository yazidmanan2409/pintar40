/**
 * BOB-02 — THE LESSON WORKBOOK'S CONTRACT (D-007, D-008). Pure: no database,
 * no React, no server. DAISY-06 builds the downloadable template and the
 * upload screen on exactly this file and the actions in
 * src/app/studio/actions.ts.
 *
 * ONE COURSE PER WORKBOOK, FIVE SHEETS (D-007): Kursus, Bab, Pelajaran, Soal,
 * Pilihan. Row 1 of every sheet is the header; headers are matched without
 * regard to case, spacing or a trailing "*", and in any column order. Every
 * later row with any text in it is data. `KOLOM` below is the whole contract:
 * the sheet names, each column's header, whether it is required, and the
 * values an enumerated column accepts.
 *
 * WHAT HAPPENS TO A WORKBOOK
 *   1. bacaBukuKerja (src/lib/xlsx.ts) reads the cells as text;
 *   2. bukuKerjaKePaket turns them into the lesson package JSON that
 *      prepare_ingest_batch checks -- the same JSON a machine producer sends
 *      as a "Paket Terstruktur" -- tagging every object with the sheet and row
 *      it came from, and finding what only the workbook can get wrong (a
 *      missing sheet, an unknown chapter number, a value not in the list);
 *   3. the database checks everything else and names each problem by code at
 *      its sheet and row (KODE_MASALAH_PAKET, KUNCI_MASALAH_PAKET).
 * No row is ever dropped: a workbook with any problem makes nothing.
 */
import type { HleEvent } from "./hle";
import type { Lembar } from "./xlsx";

// ═══════════════════════════════════════════════════════ the column contract

export type Kolom = {
  /** The key the package JSON uses. */
  kunci: string;
  /** The header in row 1, as the template prints it. */
  judul: string;
  wajib: boolean;
  /** For an enumerated column: each accepted value and what it becomes. */
  pilihan?: ReadonlyArray<readonly [string, string]>;
  /** One line for the template's instructions. */
  arti: string;
};

export const JENIS_SOAL = [["Pilihan ganda", "MCQ_SINGLE"], ["Pilihan ganda banyak jawaban", "MCQ_MULTI"]] as const;
export const KEGUNAAN = [["Latihan", ""], ["Pemetaan awal", "PRE_TEST"], ["Cek penguasaan", "POST_TEST"]] as const;
export const KESULITAN = [["Mudah", "0.3"], ["Sedang", "0.5"], ["Sulit", "0.7"]] as const;
/** Sent to the database as the label itself; the database decides what each means. */
export const KONTEKS = [["Akademik", "Akademik"], ["Pengembangan profesi", "Pengembangan profesi"]] as const;
export const TINGKAT_BERPIKIR = [
  ["Mengingat", "REMEMBER"], ["Memahami", "UNDERSTAND"], ["Menerapkan", "APPLY"],
  ["Menganalisis", "ANALYSE"], ["Mengevaluasi", "EVALUATE"], ["Mencipta", "CREATE"],
] as const;
export const YA_TIDAK = [["Ya", "true"], ["Tidak", "false"]] as const;

export const LEMBAR = ["Kursus", "Bab", "Pelajaran", "Soal", "Pilihan"] as const;
export type NamaLembar = (typeof LEMBAR)[number];

export const KOLOM: Record<NamaLembar, readonly Kolom[]> = {
  Kursus: [
    { kunci: "title", judul: "Judul kursus", wajib: true, arti: "Nama kursus seperti yang dilihat guru dan murid." },
    { kunci: "subject", judul: "Mata pelajaran", wajib: true, arti: "Misalnya Matematika." },
    { kunci: "stage", judul: "Jenjang", wajib: true, arti: "SD, SMP, SMA atau lainnya." },
    { kunci: "grade_label", judul: "Kelas", wajib: true, arti: "Misalnya Kelas 4 atau Kelas X." },
    { kunci: "konteks", judul: "Konteks", wajib: false, pilihan: KONTEKS, arti: "Kosongkan untuk Akademik." },
  ],
  Bab: [
    { kunci: "ordinal", judul: "No bab", wajib: true, arti: "1, 2, 3 ... tidak boleh kembar." },
    { kunci: "title", judul: "Judul bab", wajib: true, arti: "" },
  ],
  Pelajaran: [
    { kunci: "module", judul: "No bab", wajib: true, arti: "Nomor bab tempat pelajaran ini." },
    { kunci: "ordinal", judul: "No pelajaran", wajib: true, arti: "1, 2, 3 ... di dalam bab itu." },
    { kunci: "title", judul: "Judul pelajaran", wajib: true, arti: "" },
    { kunci: "summary", judul: "Ringkasan", wajib: false, arti: "Satu atau dua kalimat." },
    { kunci: "body_markdown", judul: "Isi pelajaran", wajib: true, arti: "Teks pelajaran yang dibaca murid." },
    { kunci: "objective", judul: "Tujuan pembelajaran", wajib: false, arti: "Apa yang dapat dilakukan murid sesudahnya." },
    { kunci: "bloom", judul: "Tingkat berpikir", wajib: false, pilihan: TINGKAT_BERPIKIR, arti: "Kosongkan untuk Memahami." },
    { kunci: "media", judul: "Media", wajib: false, arti: "Nama berkas gambar, audio, video atau PDF; beberapa dipisah titik koma." },
    { kunci: "transcript", judul: "Transkrip", wajib: false, arti: "Wajib bila ada audio atau video; berlaku untuk semuanya di pelajaran ini." },
  ],
  Soal: [
    { kunci: "ref", judul: "Kode soal", wajib: true, arti: "Misalnya S1. Dipakai lembar Pilihan; tidak boleh kembar." },
    { kunci: "module", judul: "No bab", wajib: true, arti: "" },
    { kunci: "lesson", judul: "No pelajaran", wajib: true, arti: "" },
    { kunci: "item_type", judul: "Jenis soal", wajib: false, pilihan: JENIS_SOAL, arti: "Kosongkan untuk Pilihan ganda." },
    { kunci: "stem", judul: "Pertanyaan", wajib: true, arti: "" },
    { kunci: "stimulus", judul: "Bacaan", wajib: false, arti: "Teks yang dibaca sebelum menjawab." },
    { kunci: "petunjuk", judul: "Petunjuk", wajib: false, arti: "Bantuan berpikir; tidak boleh menyebut jawabannya." },
    { kunci: "use", judul: "Kegunaan", wajib: false, pilihan: KEGUNAAN, arti: "Pemetaan awal atau Cek penguasaan (D-008); kosongkan untuk Latihan." },
    { kunci: "difficulty", judul: "Tingkat kesulitan", wajib: false, pilihan: KESULITAN, arti: "Mudah, Sedang atau Sulit." },
    { kunci: "parallel_group", judul: "Kelompok paralel", wajib: false, arti: "Soal setara diberi label yang sama." },
  ],
  Pilihan: [
    { kunci: "ref", judul: "Kode soal", wajib: true, arti: "Kode dari lembar Soal." },
    { kunci: "label", judul: "Pilihan", wajib: true, arti: "A, B, C, D atau E." },
    { kunci: "body", judul: "Teks pilihan", wajib: true, arti: "" },
    { kunci: "is_correct", judul: "Benar", wajib: true, pilihan: YA_TIDAK, arti: "Ya untuk jawaban yang benar." },
    { kunci: "rationale", judul: "Alasan", wajib: true, arti: "Mengapa pilihan ini benar atau salah. Wajib untuk setiap pilihan." },
    { kunci: "misconception_code", judul: "Kode miskonsepsi", wajib: false, arti: "Kode yang sudah terdaftar, bila ada." },
  ],
};

// ══════════════════════════════════════════════════════════ the v1 limits

/**
 * WHAT A PACKAGE MAY HOLD IN V1 (D-030). DAISY-06's template states these;
 * the reader (src/lib/xlsx.ts, BATAS) or lesson_package_check enforces each
 * one, and anything past a limit comes back as `kode` -- at its sheet and row
 * wherever the limit belongs to a row. BOB02-K03 fails if a number here stops
 * being the one the reader or the database uses.
 */
export const BATAS_PAKET = {
  /** The workbook file, and the text its parts may unpack to. */
  berkasMaks: { nilai: 5 * 1024 * 1024, kode: "WORKBOOK_TOO_LARGE" },
  teruraiMaks: { nilai: 40 * 1024 * 1024, kode: "WORKBOOK_TOO_LARGE" },
  /** Rows per sheet (the header included) and columns per row. */
  barisMaks: { nilai: 10_000, kode: "WORKBOOK_TOO_LARGE" },
  kolomMaks: { nilai: 200, kode: "WORKBOOK_TOO_LARGE" },
  /** Per package: courses, lessons, questions. */
  kursusMaks: { nilai: 20, kode: "PACKAGE_TOO_LARGE" },
  pelajaranMaks: { nilai: 500, kode: "PACKAGE_TOO_LARGE" },
  soalMaks: { nilai: 2000, kode: "PACKAGE_TOO_LARGE" },
  /** Per question: its options and their labels, and its kinds (JENIS_SOAL). */
  pilihanMin: { nilai: 2, kode: "ITEM_OPTIONS_TOO_FEW" },
  pilihanMaks: { nilai: 5, kode: "ITEM_OPTIONS_TOO_MANY" },
  labelPilihan: { nilai: ["A", "B", "C", "D", "E"], kode: "OPTION_LABEL_INVALID" },
  jenisSoal: { nilai: JENIS_SOAL.map(([, v]) => v), kode: "ITEM_TYPE_UNKNOWN" },
  /** Media: the file's name after it is made safe, and the kinds by extension. */
  namaMediaMaks: { nilai: 110, kode: "MEDIA_NAME_INVALID" },
  jenisMedia: {
    nilai: { gambar: ["png", "jpg", "jpeg", "webp", "svg", "gif"], audio: ["mp3", "m4a", "wav", "ogg"], video: ["mp4", "webm"], pdf: ["pdf"] },
    kode: "MEDIA_KIND_UNKNOWN",
  },
  /** Every sound or video file carries its own transcript. */
  transkripWajib: { nilai: ["audio", "video"], kode: "MEDIA_TRANSCRIPT_MISSING" },
  /** An option's misconception must be a code already in the taxonomy; none is created by a package. */
  miskonsepsi: { nilai: "misconception_taxonomy", kode: "OPTION_MISCONCEPTION_UNKNOWN" },
  /** Characters per text. */
  teksMaks: {
    nilai: {
      judulKursus: 200, mapel: 200, jenjang: 200, kelas: 200, judulBab: 200, judulPelajaran: 200,
      ringkasan: 1000, isiPelajaran: 50_000, soal: 4000, stimulus: 20_000, pilihan: 2000, alasan: 2000, kelompokSetara: 60,
    },
    kode: "TEXT_TOO_LONG",
  },
} as const;

// ═════════════════════════════════════════════════════════════ the problems

/** Every problem a workbook or package can come back with, as a stable code. */
export const KODE_MASALAH_PAKET = [
  // the workbook itself (found here)
  "WORKBOOK_UNREADABLE", "WORKBOOK_TOO_LARGE", "WORKBOOK_SHEET_MISSING", "WORKBOOK_COLUMN_MISSING",
  "WORKBOOK_COURSE_ROW_MISSING", "WORKBOOK_COURSE_ROWS_MANY", "WORKBOOK_VALUE_REQUIRED", "WORKBOOK_VALUE_UNKNOWN",
  "WORKBOOK_CHAPTER_UNKNOWN", "WORKBOOK_LESSON_UNKNOWN", "WORKBOOK_QUESTION_UNKNOWN", "WORKBOOK_QUESTION_WITHOUT_OPTIONS",
  "PACKAGE_JSON_UNREADABLE",
  // the package (found by the database, lesson_package_check)
  "PACKAGE_EMPTY", "PACKAGE_TOO_LARGE", "PACKAGE_SHAPE_INVALID",
  "COURSE_TITLE_MISSING", "COURSE_SUBJECT_MISSING", "COURSE_STAGE_MISSING", "COURSE_GRADE_MISSING", "COURSE_CONTEXT_UNKNOWN",
  "MODULE_NUMBER_INVALID", "MODULE_NUMBER_REPEATED", "MODULE_TITLE_MISSING",
  "LESSON_NUMBER_INVALID", "LESSON_NUMBER_REPEATED", "LESSON_TITLE_MISSING", "LESSON_TEXT_MISSING",
  "OBJECTIVE_STATEMENT_MISSING", "OBJECTIVE_THINKING_UNKNOWN",
  "MEDIA_NAME_INVALID", "MEDIA_KIND_UNKNOWN", "MEDIA_NAME_CLASH", "MEDIA_TRANSCRIPT_MISSING", "MEDIA_NOT_UPLOADED",
  "ITEM_REF_REPEATED", "ITEM_TYPE_UNKNOWN", "ITEM_QUESTION_MISSING", "ITEM_HINT_REVEALS_ANSWER", "ITEM_USE_UNKNOWN",
  "ITEM_DIFFICULTY_INVALID", "ITEM_PARALLEL_TIER_MIXED", "ITEM_OPTIONS_TOO_FEW", "ITEM_OPTIONS_TOO_MANY",
  "ITEM_CORRECT_MISSING", "ITEM_CORRECT_TOO_MANY",
  "OPTION_LABEL_INVALID", "OPTION_LABEL_REPEATED", "OPTION_TEXT_MISSING", "OPTION_REASON_MISSING",
  "OPTION_CORRECT_INVALID", "OPTION_MISCONCEPTION_UNKNOWN",
  "TEXT_TOO_LONG", "PACKAGE_COULD_NOT_BE_SAVED",
] as const;
export type KodeMasalahPaket = (typeof KODE_MASALAH_PAKET)[number];

/** One problem, where it is. `sheet`/`row` for a workbook, `path` for JSON. */
export type MasalahPaket = {
  code: KodeMasalahPaket;
  sheet?: string;
  row?: number;
  field?: string;
  path?: string;
  file?: string;
};

/** The copy key for each problem code (D-014): `studio.paket.masalah.<code>`. */
export function kunciMasalahPaket(code: string): HleEvent {
  return ((KODE_MASALAH_PAKET as readonly string[]).includes(code)
    ? `studio.paket.masalah.${code.toLowerCase()}`
    : "studio.paket.masalah.lain") as HleEvent;
}

/** Codes the database raises (SQLSTATE PR030, code in DETAIL) for the call itself. */
export const KODE_TOLAK_PAKET = ["PACKAGE_NOT_ALLOWED", "PACKAGE_STATE_INVALID", "PACKAGE_SCHOOL_NOT_ALLOWED"] as const;
export type KodePaket =
  | (typeof KODE_TOLAK_PAKET)[number]
  | "PACKAGE_HAS_PROBLEMS"
  | "PACKAGE_INPUT_INVALID"
  | "PACKAGE_FAILED";

export function kunciKodePaket(code: KodePaket): HleEvent {
  return `studio.paket.kode.${code.toLowerCase()}` as HleEvent;
}

/** A media file the package names, and where it must be uploaded. */
export type MediaPaket = { file: string; name: string; kind: "gambar" | "audio" | "video" | "pdf"; path: string };
export type HitunganPaket = { courses: number; modules: number; lessons: number; items: number; options: number; media: number };

export type HasilPaket =
  | { ok: true; batch: string; counts: HitunganPaket; media: MediaPaket[]; courses?: string[] }
  | { ok: false; code: KodePaket; batch?: string; problems?: MasalahPaket[]; media?: MediaPaket[]; ref?: string };

/** A database error as a package code: PR030 with a known DETAIL, else PACKAGE_FAILED. */
export function kodeGalatPaket(e: { code?: string | null; details?: string | null } | null | undefined): KodePaket {
  if (e?.code === "PR030" && typeof e.details === "string"
      && (KODE_TOLAK_PAKET as readonly string[]).includes(e.details)) {
    return e.details as KodePaket;
  }
  if (e?.code === "42501") return "PACKAGE_NOT_ALLOWED";
  return "PACKAGE_FAILED";
}

// ═════════════════════════════════════════════ a workbook, as a lesson package

const kunciJudul = (s: string) => s.toLowerCase().replace(/\*/g, "").replace(/[\s._-]+/g, " ").trim();
const kunciNilai = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

type BarisData = { row: number; nilai: Record<string, string> };
type Paket = { courses: unknown[] };

export type HasilKonversi = { ok: true; paket: Paket; media: string[] } | { ok: false; problems: MasalahPaket[] };

function nomor(s: string): string {
  // a spreadsheet may hold 1 as "1" or "1.0"
  const t = s.trim();
  return /^[0-9]+(\.0+)?$/.test(t) ? String(Number(t)) : t;
}

/**
 * The workbook's rows as the lesson package JSON. Problems found here are
 * the workbook's own; everything else is left for the database to judge, so
 * the two never disagree about a rule.
 */
export function bukuKerjaKePaket(lembar: readonly Lembar[]): HasilKonversi {
  const masalah: MasalahPaket[] = [];
  const tabel = {} as Record<NamaLembar, BarisData[]>;

  for (const nama of LEMBAR) {
    const l = lembar.find((x) => kunciJudul(x.nama) === kunciJudul(nama));
    if (!l) { masalah.push({ code: "WORKBOOK_SHEET_MISSING", sheet: nama }); tabel[nama] = []; continue; }
    const kepala = (l.baris[0] ?? []).map(kunciJudul);
    const posisi = new Map<string, number>();
    for (const k of KOLOM[nama]) {
      const i = kepala.indexOf(kunciJudul(k.judul));
      if (i >= 0) posisi.set(k.kunci, i);
      else if (k.wajib) masalah.push({ code: "WORKBOOK_COLUMN_MISSING", sheet: nama, field: k.judul });
    }
    const baris: BarisData[] = [];
    l.baris.slice(1).forEach((sel, i) => {
      if (!sel.some((x) => (x ?? "").trim() !== "")) return;
      const nilai: Record<string, string> = {};
      for (const k of KOLOM[nama]) {
        const p = posisi.get(k.kunci);
        let v = p === undefined ? "" : (sel[p] ?? "").trim();
        if (k.wajib && v === "" && posisi.has(k.kunci)) {
          masalah.push({ code: "WORKBOOK_VALUE_REQUIRED", sheet: nama, row: i + 2, field: k.judul });
        }
        if (v !== "" && k.pilihan) {
          const hit = k.pilihan.find(([label]) => kunciNilai(label) === kunciNilai(v));
          const bool = k.kunci === "is_correct" ? ["true", "false", "1", "0", "benar", "salah", "y", "t"].includes(kunciNilai(v)) : false;
          const angka = k.kunci === "difficulty" && /^(0(\.[0-9]+)?|1(\.0+)?)$/.test(v);
          if (hit) v = hit[1];
          else if (bool) v = ["true", "1", "benar", "y"].includes(kunciNilai(v)) ? "true" : "false";
          else if (!angka) masalah.push({ code: "WORKBOOK_VALUE_UNKNOWN", sheet: nama, row: i + 2, field: k.judul });
        }
        nilai[k.kunci] = v;
      }
      baris.push({ row: i + 2, nilai });
    });
    tabel[nama] = baris;
  }
  if (masalah.some((m) => m.code === "WORKBOOK_SHEET_MISSING" || m.code === "WORKBOOK_COLUMN_MISSING")) {
    return { ok: false, problems: masalah };
  }

  if (tabel.Kursus.length === 0) masalah.push({ code: "WORKBOOK_COURSE_ROW_MISSING", sheet: "Kursus", row: 2 });
  if (tabel.Kursus.length > 1) masalah.push({ code: "WORKBOOK_COURSE_ROWS_MANY", sheet: "Kursus", row: tabel.Kursus[1].row });
  const k = tabel.Kursus[0];
  const baris = (b: BarisData, sheet: string) => ({ _row: { sheet, row: b.row } });
  const kosong = (v: string) => (v === "" ? undefined : v);

  const bab = tabel.Bab.map((b) => ({
    ...baris(b, "Bab"), ordinal: nomor(b.nilai.ordinal), title: b.nilai.title,
    lessons: [] as Array<Record<string, unknown>>,
  }));
  const pelajaran = new Map<string, Record<string, unknown> & { items: unknown[] }>();
  const semuaMedia: string[] = [];
  for (const p of tabel.Pelajaran) {
    const induk = bab.find((b) => b.ordinal === nomor(p.nilai.module));
    if (!induk) { masalah.push({ code: "WORKBOOK_CHAPTER_UNKNOWN", sheet: "Pelajaran", row: p.row, field: "No bab" }); continue; }
    const media = p.nilai.media.split(/[;\n]/).map((x) => x.trim()).filter(Boolean);
    semuaMedia.push(...media);
    const isi = {
      ...baris(p, "Pelajaran"), ordinal: nomor(p.nilai.ordinal), title: p.nilai.title,
      summary: kosong(p.nilai.summary), body_markdown: p.nilai.body_markdown,
      objective: p.nilai.objective ? { statement: p.nilai.objective, bloom: kosong(p.nilai.bloom) } : undefined,
      media: media.map((file) => ({ file, transcript: kosong(p.nilai.transcript) })),
      items: [] as unknown[],
    };
    induk.lessons.push(isi);
    const kunci = `${nomor(p.nilai.module)}/${nomor(p.nilai.ordinal)}`;
    if (!pelajaran.has(kunci)) pelajaran.set(kunci, isi);
  }
  const soal = new Map<string, Record<string, unknown> & { options: unknown[]; _row: { row: number } }>();
  for (const s of tabel.Soal) {
    const induk = pelajaran.get(`${nomor(s.nilai.module)}/${nomor(s.nilai.lesson)}`);
    if (!induk) {
      const adaBab = bab.some((b) => b.ordinal === nomor(s.nilai.module));
      masalah.push({ code: adaBab ? "WORKBOOK_LESSON_UNKNOWN" : "WORKBOOK_CHAPTER_UNKNOWN", sheet: "Soal", row: s.row,
                     field: adaBab ? "No pelajaran" : "No bab" });
      continue;
    }
    const isi = {
      ...baris(s, "Soal"), ref: s.nilai.ref, item_type: kosong(s.nilai.item_type), stem: s.nilai.stem,
      stimulus: kosong(s.nilai.stimulus), petunjuk: kosong(s.nilai.petunjuk), use: kosong(s.nilai.use),
      difficulty: kosong(s.nilai.difficulty), parallel_group: kosong(s.nilai.parallel_group),
      options: [] as unknown[],
    };
    induk.items.push(isi);
    if (s.nilai.ref && !soal.has(s.nilai.ref.toLowerCase())) soal.set(s.nilai.ref.toLowerCase(), isi);
  }
  for (const o of tabel.Pilihan) {
    const induk = soal.get(o.nilai.ref.toLowerCase());
    if (!induk) { masalah.push({ code: "WORKBOOK_QUESTION_UNKNOWN", sheet: "Pilihan", row: o.row, field: "Kode soal" }); continue; }
    induk.options.push({
      ...baris(o, "Pilihan"), label: o.nilai.label.toUpperCase(), body: o.nilai.body,
      is_correct: o.nilai.is_correct === "true", rationale: o.nilai.rationale,
      misconception_code: kosong(o.nilai.misconception_code),
    });
  }
  for (const s of soal.values()) {
    if (s.options.length === 0) masalah.push({ code: "WORKBOOK_QUESTION_WITHOUT_OPTIONS", sheet: "Soal", row: s._row.row, field: "Kode soal" });
  }
  if (masalah.length > 0) return { ok: false, problems: masalah };

  const course = {
    ...baris(k, "Kursus"), title: k.nilai.title, subject: k.nilai.subject, stage: k.nilai.stage,
    grade_label: k.nilai.grade_label, konteks: kosong(k.nilai.konteks), modules: bab,
  };
  return { ok: true, paket: { courses: [JSON.parse(JSON.stringify(course))] }, media: [...new Set(semuaMedia)] };
}

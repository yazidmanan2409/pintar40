/**
 * THE INTAKE SURFACE'S PURE CONTRACT — no database, no React, no server.
 *
 * Three jobs, and not one of them is a decision the backend already makes:
 *
 *   1. READING A SPREADSHEET into a grid, which is the one genuinely
 *      client-side problem in WP5B: the file never leaves the browser until a
 *      human has looked at the mapping.
 *   2. TURNING A MAPPING INTO THE ROWS WP5A ACCEPTS, using only the five
 *      fields `import_row_problems` actually reads and inventing none.
 *   3. READING `import_progress` — reading it, never recomputing it. Every
 *      number an administrator sees is counted by the database from rows that
 *      committed; nothing here adds, estimates or extrapolates one.
 *
 * IT IS A SEPARATE FILE SO IT CAN BE TESTED WITHOUT A DATABASE, and
 * UX1-DATA-BERKAS-01 and UX1-DATA-TAHAP-01 drive every function in it directly
 * — including the boundary sizes the ruling names: 1, 50, 100, 101 and 1,000.
 */

// ═══════════════════════════════════════════════ 1. a spreadsheet, as a grid

export type Kisi = { kepala: string[]; baris: string[][] };

/**
 * CSV/TSV, parsed properly rather than split on commas.
 *
 * A school's spreadsheet contains names, and names contain commas — "Wijaya,
 * S.Pd" is one field and a naive split makes it two, silently shifting every
 * column after it for that row only. So this is a character scanner that
 * honours quoting, doubled quotes inside a quoted field, and newlines inside
 * one. It strips a UTF-8 BOM, because Excel writes one and an invisible byte
 * on the first header turns `nama` into something that matches nothing.
 *
 * THE DELIMITER IS DETECTED, NOT ASKED FOR. An administrator exporting from a
 * spreadsheet does not know whether they produced commas, semicolons or tabs,
 * and Indonesian locale exports frequently produce semicolons. Detection reads
 * the FIRST LINE OUTSIDE QUOTES and picks the candidate that appears most —
 * counting inside quotes would let one comma in a name outvote the real
 * delimiter.
 */
export function bacaKisi(teks: string): Kisi {
  const bersih = teks.replace(/^﻿/, "");
  const pemisah = tebakPemisah(bersih);
  const baris: string[][] = [];
  let sel = "";
  let baris1: string[] = [];
  let dalamKutip = false;

  for (let i = 0; i < bersih.length; i += 1) {
    const c = bersih[i];
    if (dalamKutip) {
      if (c === '"') {
        if (bersih[i + 1] === '"') { sel += '"'; i += 1; }
        else dalamKutip = false;
      } else sel += c;
      continue;
    }
    if (c === '"') { dalamKutip = true; continue; }
    if (c === pemisah) { baris1.push(sel); sel = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { baris1.push(sel); baris.push(baris1); baris1 = []; sel = ""; continue; }
    sel += c;
  }
  if (sel !== "" || baris1.length > 0) { baris1.push(sel); baris.push(baris1); }

  // A TRAILING NEWLINE IS NOT A PERSON. A file that ends with one would
  // otherwise contribute a row of one empty cell, and an administrator would
  // be told their 40-person file holds 41 people.
  const isi = baris.filter((r) => r.some((x) => x.trim() !== ""));
  if (isi.length === 0) return { kepala: [], baris: [] };
  const kepala = isi[0].map((x) => x.trim());
  // Every row is padded to the header's width, so a short row maps to empty
  // cells rather than to `undefined` reaching a payload.
  const rest = isi.slice(1).map((r) => {
    const out = kepala.map((_, i) => (r[i] ?? "").trim());
    return out;
  });
  return { kepala, baris: rest };
}

function tebakPemisah(teks: string): string {
  const akhir = teks.search(/\r|\n/);
  const barisPertama = akhir === -1 ? teks : teks.slice(0, akhir);
  let dalamKutip = false;
  const hitung: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  for (const c of barisPertama) {
    if (c === '"') { dalamKutip = !dalamKutip; continue; }
    if (dalamKutip) continue;
    if (c in hitung) hitung[c] += 1;
  }
  let terbaik = ",";
  for (const [c, n] of Object.entries(hitung)) if (n > hitung[terbaik]) terbaik = c;
  return terbaik;
}

// ═══════════════════════════════════ 2. the fields WP5A accepts, and no others

/**
 * EXACTLY THE FIVE KEYS `import_row_problems` AND `import_advance` READ.
 *
 * There is no email here, no phone number, no date of birth, no national
 * student number and no institutional ID column — the last one most
 * deliberately of all: PINTAR generates the ID, and a column for it would
 * invite a school to bring their own, which the identity doctrine forbids.
 * Anything not on this list would be collected, shown, mapped and then
 * silently dropped by the database, which is worse than not offering it.
 */
export const MEDAN = ["display_name", "person_id", "node_id", "role", "programme_id"] as const;
export type Medan = (typeof MEDAN)[number];

/** Only a name is required; everything else is optional to WP5A too. */
export const MEDAN_WAJIB: readonly Medan[] = ["display_name"] as const;

/**
 * Where one field's value comes from: a column of the file, or one value the
 * administrator chose for every row.
 *
 * THE SECOND KIND IS NOT A CONVENIENCE. `node_id`, `programme_id` and
 * `person_id` are uuids, and no school's spreadsheet contains them. Without a
 * "one value for everyone" source, mapping a class would mean asking an
 * administrator to paste a uuid into a spreadsheet — so the surface offers the
 * places by name and sends the id, which is the same five fields either way.
 */
export type Sumber = { jenis: "kolom"; kolom: number } | { jenis: "tetap"; nilai: string };
export type Pemetaan = Partial<Record<Medan, Sumber>>;

/** Header words a school actually writes, in both languages. */
const PETUNJUK: Record<Medan, RegExp> = {
  display_name: /^(nama|nama lengkap|nama siswa|nama murid|nama peserta|name|full ?name|student ?name)$/i,
  person_id: /^(person[ _]?id|id orang)$/i,
  node_id: /^(kelas|rombel|node[ _]?id|class|group)$/i,
  role: /^(peran|role|jabatan)$/i,
  programme_id: /^(program|programme|program[ _]?id|programme[ _]?id)$/i,
};

/**
 * A FIRST GUESS AT THE MAPPING, WHICH IS A SUGGESTION AND NEVER A DECISION.
 * The screen shows what it guessed and the administrator changes it; nothing
 * is submitted because a guess was confident.
 */
export function tebakPemetaan(kepala: readonly string[]): Pemetaan {
  const out: Pemetaan = {};
  for (const m of MEDAN) {
    const i = kepala.findIndex((h) => PETUNJUK[m].test(h.trim()));
    if (i >= 0 && !Object.values(out).some((s) => s.jenis === "kolom" && s.kolom === i)) {
      out[m] = { jenis: "kolom", kolom: i };
    }
  }
  return out;
}

/** Is this mapping usable at all? Only the name is required. */
export function pemetaanLengkap(p: Pemetaan): boolean {
  return MEDAN_WAJIB.every((m) => p[m] !== undefined);
}

/**
 * THE GRID AND THE MAPPING BECOME THE ROWS WP5A IS GIVEN.
 *
 * An empty value is OMITTED rather than sent as "": `import_row_problems`
 * treats `nullif(... , '')` as absent, and an empty string in `role` would be
 * read as "no role" by the database and as "a role was mapped" by anybody
 * reading the payload. Omission means the two agree.
 *
 * NOTHING IS DROPPED HERE. A row whose name is blank is still produced, still
 * numbered, and still sent — so the database sees it, reports it as a problem
 * against its ordinal, and the administrator is told about it. A surface that
 * quietly skipped bad rows would be provisioning a file the administrator
 * never approved.
 */
export function barisTernormalisasi(kisi: Kisi, p: Pemetaan): Array<Record<string, string>> {
  return kisi.baris.map((r) => {
    const out: Record<string, string> = {};
    for (const m of MEDAN) {
      const s = p[m];
      if (!s) continue;
      const nilai = (s.jenis === "kolom" ? r[s.kolom] ?? "" : s.nilai).trim();
      if (nilai !== "") out[m] = nilai;
    }
    return out;
  });
}

// ═══════════════════════════════════════════ 3. the job, as the database says

/** `import_progress`, exactly as WP5A returns it. Read; never recomputed. */
export type Kemajuan = {
  job_id: string;
  institution_id: string;
  state: string;
  total: number;
  completed: number;
  remaining: number;
  failed: number;
  pilot_required: boolean;
  pilot_size: number;
  pilot_completed: number;
  pilot_verified: boolean;
  pilot_verified_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
};

/**
 * WHAT THE SCREEN IS FOR, DERIVED FROM THE JOB'S OWN STATE.
 *
 * A mapping from the database's eight-member enum onto the phase a human is
 * in. It reads `state` and nothing else — not a count, not a clock, not a
 * flag the browser set. That matters most at one place: the difference between
 * "provisioning the pilot" and "the pilot is done and waiting for you" is
 * `PILOT_IMPORTING` versus `AWAITING_PILOT_VERIFICATION`, and `import_advance`
 * is what moves it, only when fifty rows really committed.
 */
export type Tahap =
  | "menyusun"        // DRAFT: rows are in, nothing has been validated
  | "menunggu_konfirmasi"
  | "percontohan"     // provisioning the first fifty, and only those
  | "periksa_percontohan"
  | "sisa"            // released, provisioning the remainder
  | "berjalan"        // <= 100: one straight run
  | "selesai"
  | "gagal";

const TAHAP: Record<string, Tahap> = {
  DRAFT: "menyusun",
  AWAITING_CONFIRMATION: "menunggu_konfirmasi",
  PILOT_IMPORTING: "percontohan",
  AWAITING_PILOT_VERIFICATION: "periksa_percontohan",
  REMAINDER_IMPORTING: "sisa",
  IMPORTING: "berjalan",
  COMPLETED: "selesai",
  FAILED: "gagal",
};

export function tahap(k: Pick<Kemajuan, "state">): Tahap | null {
  return TAHAP[k.state] ?? null;
}

/**
 * MAY THE BROWSER ASK FOR ANOTHER CHUNK?
 *
 * THIS IS THE FIFTY-ROW GATE AS THE FRONTEND SEES IT, and it is written as a
 * whitelist of three states rather than as "not one of the finished ones". The
 * difference is the whole rule: `AWAITING_PILOT_VERIFICATION` is not on this
 * list, so the driver stops there and cannot be nudged past it by a page that
 * happened to stay open. `import_advance` refuses that state too — the ceiling
 * is the database's, and this is the surface agreeing with it rather than
 * enforcing it.
 *
 * It also stops when nothing is left, so a completed job is never asked for a
 * chunk it has no rows for.
 */
export function bolehLanjut(k: Pick<Kemajuan, "state" | "remaining">): boolean {
  if (k.remaining <= 0) return false;
  return k.state === "IMPORTING" || k.state === "PILOT_IMPORTING" || k.state === "REMAINDER_IMPORTING";
}

/**
 * IS THE PILOT SITTING COMPLETE AND UNVERIFIED? Both halves come from the
 * database: the state it moved itself into, and the count of rows that
 * committed. The surface never decides that fifty happened.
 */
export function percontohanMenunggu(k: Kemajuan): boolean {
  return k.state === "AWAITING_PILOT_VERIFICATION" && !k.pilot_verified;
}

/**
 * A JOB THAT STOPPED PART-WAY AND CAN SIMPLY CARRY ON.
 *
 * This is what makes a closed laptop cost nothing: a job in a provisioning
 * state with rows still pending is not broken and does not need the
 * spreadsheet again — it needs another call. The browser discovering this on
 * arrival is the whole of the resume experience.
 */
export function bisaDilanjutkan(k: Kemajuan): boolean {
  return bolehLanjut(k) && k.completed > 0;
}

/**
 * PROVISIONED IS NOT ACTIVE, AS A NUMBER RATHER THAN ONLY AS A SENTENCE.
 * WP5A's preview returns `accounts_activated: 0` deliberately; this is the
 * same fact for a progress screen, and it is a constant because there is no
 * activation path in PINTAR for it to ever be anything else. When one exists,
 * it will have to change this line, which is the point.
 */
export const AKUN_AKTIF = 0;

// ═══════════════════════════════════════ 4. a refusal, as a sentence

/**
 * WP5A'S VALIDATION PROBLEMS (THIRTEEN SINCE BOB-10), EACH AS A COPY KEY.
 *
 * `import_row_problems` returns phrases written for a developer —
 * "display_name is missing or too long", "node_id is outside your provisioning
 * scope". Every one of them names a column, and a column name is an internal
 * word: it tells an administrator about PINTAR's schema instead of about their
 * spreadsheet. So none of them reaches a screen.
 *
 * THE KEYS ARE THE MIGRATION'S OWN STRINGS, and a guard reads them out of the
 * SQL and fails if one is missing here — because the failure mode of a map
 * like this is silent. A problem WP5A adds later would otherwise fall through
 * to the generic sentence, and the administrator would be told their row
 * cannot be recorded without being told why, which is the one thing §6 asks
 * this screen to do.
 */
export const MASALAH: Record<string, string> = {
  "display_name is missing or too long": "pendataan.masalah.nama",
  "person_id is not a uuid": "pendataan.masalah.orang_bentuk",
  "person_id is not a person you may name": "pendataan.masalah.orang_asing",
  "this person already holds an institutional identity here": "pendataan.masalah.orang_sudah",
  "node_id is not a uuid": "pendataan.masalah.tempat_bentuk",
  "node_id is not an organizational node of this institution": "pendataan.masalah.tempat_asing",
  "node_id is outside your provisioning scope": "pendataan.masalah.tempat_luar",
  // BOB-01 / M5a: a learner row placed anywhere but an active Kelas or Tingkat
  "a learner is placed in an active Kelas or Tingkat": "pendataan.masalah.tempat_murid",
  "role is not a role this platform has": "pendataan.masalah.peran_asing",
  "this role is not granted by bulk provisioning": "pendataan.masalah.peran_dilarang",
  "a role needs an organizational node to be scoped to": "pendataan.masalah.peran_tanpa_tempat",
  // BOB-10 (M5b, interim): a staff row, refused until the intake has a staff path
  "a staff row is not recorded by the bulk intake yet": "pendataan.masalah.staf",
  "duplicate row within this import": "pendataan.masalah.ganda",
};

/** The one sentence for a problem no map entry covers. Never a raw phrase. */
export const MASALAH_LAIN = "pendataan.masalah.lain";

export function kunciMasalah(teks: string): string {
  return MASALAH[teks] ?? MASALAH_LAIN;
}

/**
 * THE ROLES A BULK INTAKE MAY GRANT.
 *
 * `import_row_problems` refuses SYSTEM_ADMIN and INSTITUTION_ADMIN by name —
 * administrative authority is granted one person at a time, deliberately — so
 * the mapping screen offers the four that remain rather than offering six and
 * letting two of them fail validation.
 */
export const PERAN_PENDATAAN = ["STUDENT", "EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN"] as const;

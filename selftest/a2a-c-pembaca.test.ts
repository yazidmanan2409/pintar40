/**
 * A2A-T01 — EVERY READER OF A SITTING'S CLOSING TIME, CLASSED (A2a's page, "The single most likely thing to go wrong in
 * (C)"; the owner's condition 1 for the order A → C → B; change C's first commit, before any of D6.3).
 *
 * D6.3's one time rule moves a sitting's effective deadline by exactly the protected interval. Every reader of a
 * sitting's closing time must then add that interval: the effective deadline, the window-timed `closes_at`, the grace
 * and late sync, the closer's selection, the teacher's list and the player. A missed reader re-times or ends a sitting
 * silently. So every reader is found, from the catalogue and from the repository, and classed here:
 *   HARUS  it reads a LIVE sitting's closing time to decide or show something: D6.3 makes it shift-aware;
 *   KLIEN  an explicit client computation from the server's shifted value (checked by D6.3's shift test);
 *   TIDAK  it reads something else: an assignment's start or scheduling window, a definition's grace setting, the
 *          initial deadline being written, or a type.
 * It fails on a reader not in the table (a missed reader is red), and on a table entry that no longer reads (a stale
 * class). Two plants, a function and an app file, must each be reported first.
 *
 * WHAT IT DOES NOT ESTABLISH YET: that a HARUS reader adds the shift. That is D6.3's own test, which uses this table.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { bacaKatalog, bersih } from "./a2a-l01.test";

/** What a reader of a sitting's closing time names, in the database and in the app. */
// E1 (Sharon, A2A-C-T01-768eb032.md): frozen_remaining_seconds is a sitting's time left under another name
const KOLOM_DB = ["closure_deadline", "closes_at", "authoritative_deadline", "late_sync_grace_seconds",
  "pengerjaan_tenggat_efektif", "late_sync_until", "frozen_remaining_seconds"];
/** E1: a call to a function that returns a deadline is a read of it, so a new caller is found and classed. */
const FUNGSI_TENGGAT = ["session_state", "pengerjaan_saya", "daftar_pengerjaan", "pengerjaan_tenggat_efektif"];
// E2: the names the app uses for a sitting's deadline, read in code only (comments removed, as bersih does for SQL)
const POLA_SRC = /closes_at|authoritative_deadline|closure_deadline|late_sync|closesAt|authoritativeDeadline|closureDeadline|lateSync|tenggat_efektif|tenggatEfektif|\btenggat\b|sisa_detik|sisa_ditahan_detik|berakhir_pada|\bdeadline\b/;
const kodeSaja = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

export type Kelas = { kelas: "HARUS" | "TIDAK" | "KLIEN"; alasan: string };
const H = (alasan: string): Kelas => ({ kelas: "HARUS", alasan });
const T = (alasan: string): Kelas => ({ kelas: "TIDAK", alasan });
/** An explicit client computation from the server's shifted value: D6.3's shift test checks it against the server. */
const K = (alasan: string): Kelas => ({ kelas: "KLIEN", alasan });
const TAMPIL = "shows the server's shifted value; never computes its own deadline (Sharon, E2)";
const JENDELA = "the assignment's window for starting or scheduling a sitting, not a running sitting's closing time";
const SETELAN = "the definition's grace setting (configuration), not a sitting's time";

/** The database's readers, by function. */
export const PEMBACA_DB: Record<string, Kelas> = {
  pengerjaan_tenggat_efektif: H("THE effective deadline: own deadline, else the assignment's closes_at; D6.3 adds the shift here first"),
  pengerjaan_putus_tenggat: H("the deadline decider: ends a sitting past its deadline, scores it after the grace"),
  // D6.6 (migration 20270119150000): the closer's selection moved into one function the job's procedure and the
  // service-only entry point share; the entry point itself no longer reads a closing time
  pengerjaan_tutup_calon: H("the closer's selection: which sittings are past their (shifted) deadline, held and protected ones excluded (R1)"),
  finalize_session: H("the grace: refuses to score inside the late-sync window from the deadline"),
  record_answer: H("late sync: accepts an answer inside the grace after the deadline"),
  maintenance_draining: H("whether a sitting is still in time (deadline + grace) while maintenance drains"),
  may_continue_session: H("whether the sitting may continue: its deadline"),
  session_state: H("the player's deadline: what the learner's screen counts down to"),
  daftar_pengerjaan: H("the teacher's list: each sitting's deadline and extensions"),
  pengerjaan_saya: H("the learner's own list: the effective deadline"),
  pengerjaan_tahan_orang: H("the hold: the remaining time it freezes, from the effective deadline"),
  extend_session_deadline: H("an extension: the new deadline from the effective one"),
  tambah_waktu_pengerjaan: H("the teacher's added time: from the effective deadline"),
  lanjutkan_pengerjaan: H("resuming a held sitting: its new deadline from the time it had"),
  pengerjaan_jaga: H("the guard on deadline writes: D6.3 lets exactly the release's transition through"),
  pengerjaan_lepas_darurat: H("the release itself: moves the effective deadline by the protected interval (D6.3)"),
  // C17-1 (migration 20270119130000): the one grace rule protection and both markings use (B3)
  pengerjaan_dalam_tenggang_pada: H("whether an EXPIRED sitting was inside its grace at an instant: authoritative_deadline plus grace, the grace readers' own basis (B3, C17-1)"),
  pengerjaan_tandai_saat_angkat: H("the lift's completion of the marking: an EXPIRED sitting is protected only inside its grace at T_stop (D6.3/B3)"),
  pengerjaan_tandai_darurat: H("the marking: an EXPIRED sitting is protected only inside its grace at T_stop (D6.3/B3)"),
  open_assessment_session: T("writes the initial deadline of a new sitting; nothing is shifted yet"),
  tutup_pengerjaan_ditahan: T("records the held time left (frozen_remaining_seconds) in its audit row; decides nothing on it"),
  assessment_orientation: T(JENDELA),
  my_open_assessments: T(JENDELA),
  may_start_assessment: T(JENDELA),
  start_learning_session: T(JENDELA),
  assign_release: T(JENDELA),
  launch_quick_assessment: T(JENDELA),
  ubah_jadwal_penugasan: T(JENDELA),
  maintenance_collisions: T("counts assignments that close inside a maintenance window: scheduling, not a sitting"),
  content_canonical_payload: T(SETELAN),
  lesson_package_materialise: T(SETELAN),
  salin_kursus_revisi: T(SETELAN),
  save_assessment_definition: T(SETELAN),
};

/** The app's readers, by file. */
export const PEMBACA_SRC: Record<string, Kelas> = {
  "src/lib/assessment-engine/index.ts": H("the player: reads session_state's deadline (shifted server-side; it must not compute its own)"),
  "src/lib/assessment-engine/types.ts": T("types only: no value is read"),
  "src/lib/pengajar.ts": T("the teacher's assignments: OPEN or CLOSED by the assignment's closes_at, not a sitting's time"),
  "src/app/belajar/page.tsx": T("the learner's assignment list: the assignment's closing date"),
  "src/components/siklus/OrientasiAsesmen.tsx": T("the orientation before a start: the assignment's closing date"),
  "src/app/studio/actions.ts": T(SETELAN),
  "src/lib/aturan-asesmen.ts": T(SETELAN),
  "src/lib/pengerjaan-kontrak.ts": T(TAMPIL),
  "src/lib/pengerjaan-tampil.ts": T(TAMPIL),
  "src/app/belajar/_components/ItemPlayer.tsx": T(TAMPIL),
  "src/app/mengajar/[kelas]/siapa/page.tsx": T("the added-time result line: " + TAMPIL),
  "src/lib/hle.ts": T("the wording dictionary: the word deadline in sentences; no value is read"),
  "src/components/mengajar/AturPengerjaan.tsx": K("the added-time confirmation: Date.parse(tenggat) + n minutes, from the server's shifted tenggat"),
};

/** The database's readers: every function in `public` whose source names a closing-time column or the effective
 *  deadline; `tanam` is DDL run first, inside a rolled-back transaction. */
export function pembacaDb(db: string, tanam = ""): string[] {
  const kat = bacaKatalog(db, tanam);
  return [...kat.fns].filter(([fn, bs]) => bs.some((b) => KOLOM_DB.some((c) => new RegExp(`\\b${c}\\b`).test(bersih(b)))
      || FUNGSI_TENGGAT.some((f) => f !== fn && new RegExp(`\\b${f}\\s*\\(`).test(bersih(b)))))
    .map(([fn]) => fn).sort();
}
/** The app's readers: every file under src/ that names one; `tambahan` adds planted files. */
export function pembacaSrc(root: string, tambahan: { path: string; text: string }[] = []): string[] {
  const out: string[] = [];
  const jalan = (d: string) => {
    for (const n of readdirSync(d)) {
      const q = join(d, n);
      if (statSync(q).isDirectory()) jalan(q);
      else if (/\.(ts|tsx)$/.test(n) && POLA_SRC.test(kodeSaja(readFileSync(q, "utf8")))) out.push(q.slice(root.length + 1));
    }
  };
  jalan(join(root, "src"));
  for (const t of tambahan) if (POLA_SRC.test(kodeSaja(t.text))) out.push(t.path);
  return out.sort();
}
/** What does not match the table: readers not classed, and classed names that no longer read. */
export function bedaKelas(ada: string[], tabel: Record<string, Kelas>): { baru: string[]; basi: string[] } {
  return { baru: ada.filter((x) => !(x in tabel)), basi: Object.keys(tabel).filter((x) => !ada.includes(x)) };
}

const TANAM_FN = `create function public._a2a_t01_tanam(p uuid) returns timestamptz language sql as $t$
  select s.authoritative_deadline from public.assessment_sessions s where s.id = p $t$;`;
const TANAM_SRC = { path: "src/_a2a_t01_tanam.ts", text: "export const batas = (s: { closes_at: string }) => s.closes_at;" };
// the third plant (E2): an app file reading the app's own name for a sitting's deadline
const TANAM_SRC2 = { path: "src/_a2a_t01_tanam2.tsx", text: "export const Sisa = (k: { tenggat: string }) => Date.parse(k.tenggat);" };

export const a2aPembacaTests: SelfTest[] = [
  {
    id: "A2A-T01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      // the plants first
      const t1 = bedaKelas(pembacaDb(db, TANAM_FN), PEMBACA_DB);
      c.expect(t1.baru.includes("_a2a_t01_tanam"), "the planted function reading a sitting's deadline was not reported");
      const t2 = bedaKelas(pembacaSrc(repoRoot, [TANAM_SRC]), PEMBACA_SRC);
      c.expect(t2.baru.includes(TANAM_SRC.path), "the planted app file reading closes_at was not reported");
      c.expect(bedaKelas(pembacaSrc(repoRoot, [TANAM_SRC2]), PEMBACA_SRC).baru.includes(TANAM_SRC2.path), "the planted app file reading tenggat was not reported");
      // the real code
      const d = bedaKelas(pembacaDb(db), PEMBACA_DB);
      c.expect(d.baru.length === 0, `database readers of a sitting's closing time not classed (A2a's page, D6.3): ${d.baru.join(", ")}`);
      c.expect(d.basi.length === 0, `classed database readers that no longer read a closing time: ${d.basi.join(", ")}`);
      const s = bedaKelas(pembacaSrc(repoRoot), PEMBACA_SRC);
      c.expect(s.baru.length === 0, `app readers of a sitting's closing time not classed: ${s.baru.join(", ")}`);
      c.expect(s.basi.length === 0, `classed app readers that no longer read a closing time: ${s.basi.join(", ")}`);
      const n = (t: Record<string, Kelas>, k: string) => Object.values(t).filter((x) => x.kelas === k).length;
      return c.verdict(`${Object.keys(PEMBACA_DB).length} database and ${Object.keys(PEMBACA_SRC).length} app readers of a sitting's closing time, each classed `
        + `(${n(PEMBACA_DB, "HARUS") + n(PEMBACA_SRC, "HARUS")} must add the shift, ${n(PEMBACA_SRC, "KLIEN")} a client computation, ${n(PEMBACA_DB, "TIDAK") + n(PEMBACA_SRC, "TIDAK")} read something else or show the server's value); three plants reported`);
    },
  },
];

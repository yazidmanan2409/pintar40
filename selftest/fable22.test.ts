/**
 * L3 · THE WORKING CONTEXT (CR-83; D-127 Q1, Q2, Q11; D-132 C1–C10, §2.11), ITS PURE HALF.
 *
 * The database half is F22-K01..K06 in selftest/db/fable22.sql (the pairs, the one writer, two sessions, invalidation,
 * an end, non-escalation). The walks are the journeys. This file drives the rules of src/lib/konteks.ts and
 * src/lib/tanda-keluar.ts with recorded people, and reads the source for what must hold everywhere:
 *
 *   F22-P01  the door × person table (design §4): where each person lands from each door and from none (C9), what a
 *            page asked for may set (C4) and what the sign-out mark discards (C5)
 *   F22-P02  the surface → purpose table: which pair serves which surface, the shell's tabs, the homes, and the four
 *            shapes a pair may have
 *   F22-P03  the sign-out mark: when the proxy sets, clears and honours it, and that every end of a session sets it
 *   F22-P04  the chooser changes nothing by being visited (C3): only its POST writes, and only three places call the
 *            writer at all
 *   F22-P05  §2.11: every context-bound human action (server actions and the five API routes) checks its target
 *            against the active context before it acts; every other server action and route is exempt by name, with
 *            its reason; a planted unguarded action is caught
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import {
  BELAJAR, alamatPilih, bacaKonteks, bacaKunciPasangan, bacaPermintaan, berandaPasangan, kunciPasangan, melayani,
  permukaan, permukaanKonteks, pintuPilihan, rencanaHalaman, rencanaMasuk, tujuanJalur, type Pasangan, type Rencana,
  type Tujuan,
} from "../src/lib/konteks";
import { aturTanda } from "../src/lib/tanda-keluar";
import { ISTILAH_MENUNGGU, istilah } from "../src/lib/istilah-menunggu";

const A = "a0000000-0000-4000-8000-00000000000a";
const B = "b0000000-0000-4000-8000-00000000000b";
const S = "c0000000-0000-4000-8000-00000000000c";
const L = "d0000000-0000-4000-8000-00000000000d"; // Pustaka PINTAR (PLATFORM_CANONICAL)

/** role_capabilities as the database answers it (supabase/migrations/20260926100000_*). */
const KEMAMPUAN: Record<string, string[]> = {
  EDUCATOR: ["CAN_DRAFT", "CAN_ASSIGN_LEARNING", "CAN_QUICK_ASSESSMENT", "CAN_VIEW_LEARNER_ROSTER", "CAN_VIEW_LEARNER_RESULT"],
  HEAD_OF_DEPARTMENT: ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_ASSIGN_LEARNING", "CAN_QUICK_ASSESSMENT",
    "CAN_REVIEW_QUESTION_HEALTH", "CAN_REVIEW_INTEGRITY", "CAN_VIEW_LEARNER_ROSTER", "CAN_VIEW_LEARNER_RESULT"],
  DEAN: ["CAN_VIEW_LEARNER_ROSTER"],
  INSTITUTION_ADMIN: ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH", "CAN_ASSIGN_LEARNING", "CAN_QUICK_ASSESSMENT",
    "CAN_AUTHORIZE_TRANSFER", "CAN_REVIEW_QUESTION_HEALTH", "CAN_MANAGE_REPORT_TEMPLATES", "CAN_REVIEW_INTEGRITY",
    "CAN_VIEW_LEARNER_ROSTER", "CAN_PROVISION_PEOPLE"],
  SYSTEM_ADMIN: ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH", "CAN_ASSIGN_LEARNING", "CAN_QUICK_ASSESSMENT",
    "CAN_AUTHORIZE_TRANSFER", "CAN_REVIEW_QUESTION_HEALTH", "CAN_MANAGE_REPORT_TEMPLATES", "CAN_REVIEW_INTEGRITY",
    "CAN_VIEW_LEARNER_ROSTER", "CAN_VIEW_LEARNER_RESULT", "CAN_PROVISION_PEOPLE"],
};

function pasangan(tujuan: Tujuan, tempat: string | "PLATFORM" | null, peran: string[]): Pasangan {
  const platform = tempat === "PLATFORM";
  return {
    tujuan, tempat: platform ? null : tempat, platform,
    nama: platform || tempat === null ? null : `Tempat ${tempat.slice(0, 1).toUpperCase()}`,
    jenis: platform || tempat === null ? null : tempat === L ? "PLATFORM_CANONICAL" : "INSTITUTION",
    peran, kemampuan: [...new Set(peran.flatMap((r) => KEMAMPUAN[r] ?? []))].sort(),
  };
}
const AJAR = (t: string, r = "EDUCATOR") => pasangan("MENGAJAR", t, [r]);
const KELOLA = (t: string | "PLATFORM", r: string) => pasangan("MENGELOLA", t, [r]);
const SYS = ["SYSTEM_ADMIN"];
const ADMIN_PLATFORM = [KELOLA(A, "SYSTEM_ADMIN"), KELOLA(B, "SYSTEM_ADMIN"), pasangan("MENGELOLA", L, SYS), KELOLA("PLATFORM", "SYSTEM_ADMIN")];

/** Design §4's people, each with exactly what konteks_tempat_saya gives them (F22-K01 proves that half). */
const ORANG: Record<string, Pasangan[]> = {
  "Learner only": [BELAJAR],
  "Class card": [BELAJAR],
  "Teacher, one school": [AJAR(S)],
  "Teacher + Admin sekolah, one school": [AJAR(S), KELOLA(S, "INSTITUTION_ADMIN")],
  "Learner + Admin sekolah": [BELAJAR, KELOLA(S, "INSTITUTION_ADMIN")],
  "Kepala departemen": [AJAR(S, "HEAD_OF_DEPARTMENT"), KELOLA(S, "HEAD_OF_DEPARTMENT")],
  "Admin platform only": ADMIN_PLATFORM,
  "Admin platform + teacher in A and B": [AJAR(A), AJAR(B), ...ADMIN_PLATFORM],
};

const TIDAK = (untuk: Tujuan) => alamatPilih({ untuk, alasan: "tidak_dipegang" });
type Harap = { set?: Pick<Pasangan, "tujuan" | "tempat" | "platform"> & { sebab: string }; ke: string };
const set = (p: Pasangan, sebab = "PINTU") => ({ tujuan: p.tujuan, tempat: p.tempat, platform: p.platform, sebab });

/** Design §4, row by row. */
const TABEL: Array<[string, Tujuan | null, Harap]> = [
  ["Learner only", "BELAJAR", { set: set(BELAJAR), ke: "/belajar" }],
  ["Learner only", "MENGAJAR", { ke: TIDAK("MENGAJAR") }],
  ["Learner only", "MENGELOLA", { ke: TIDAK("MENGELOLA") }],
  ["Class card", "BELAJAR", { set: set(BELAJAR), ke: "/belajar" }],
  ["Teacher, one school", "BELAJAR", { set: set(BELAJAR), ke: "/belajar" }],
  ["Teacher, one school", "MENGAJAR", { set: set(AJAR(S)), ke: "/mengajar" }],
  ["Teacher, one school", "MENGELOLA", { ke: TIDAK("MENGELOLA") }],
  ["Teacher + Admin sekolah, one school", "BELAJAR", { set: set(BELAJAR), ke: "/belajar" }],
  ["Teacher + Admin sekolah, one school", "MENGAJAR", { set: set(AJAR(S)), ke: "/mengajar" }],
  ["Teacher + Admin sekolah, one school", "MENGELOLA", { set: set(KELOLA(S, "INSTITUTION_ADMIN")), ke: "/konfigurasi" }],
  ["Learner + Admin sekolah", "BELAJAR", { set: set(BELAJAR), ke: "/belajar" }],
  ["Learner + Admin sekolah", "MENGAJAR", { ke: TIDAK("MENGAJAR") }],
  ["Learner + Admin sekolah", "MENGELOLA", { set: set(KELOLA(S, "INSTITUTION_ADMIN")), ke: "/konfigurasi" }],
  ["Kepala departemen", "BELAJAR", { set: set(BELAJAR), ke: "/belajar" }],
  ["Kepala departemen", "MENGAJAR", { set: set(AJAR(S, "HEAD_OF_DEPARTMENT")), ke: "/mengajar" }],
  ["Kepala departemen", "MENGELOLA", { set: set(KELOLA(S, "HEAD_OF_DEPARTMENT")), ke: "/pimpinan" }],
  ["Admin platform only", "BELAJAR", { set: set(BELAJAR), ke: "/belajar" }],
  ["Admin platform only", "MENGAJAR", { ke: TIDAK("MENGAJAR") }],
  ["Admin platform only", "MENGELOLA", { ke: alamatPilih({ untuk: "MENGELOLA" }) }],
  ["Admin platform + teacher in A and B", "BELAJAR", { set: set(BELAJAR), ke: "/belajar" }],
  ["Admin platform + teacher in A and B", "MENGAJAR", { ke: alamatPilih({ untuk: "MENGAJAR" }) }],
  ["Admin platform + teacher in A and B", "MENGELOLA", { ke: alamatPilih({ untuk: "MENGELOLA" }) }],
  // no door (D-132(i)): one purpose · place, selected; several, the chooser; the ranking never chooses
  ["Learner only", null, { set: set(BELAJAR), ke: "/belajar" }],
  ["Teacher, one school", null, { set: set(AJAR(S)), ke: "/mengajar" }],
  ["Admin platform + teacher in A and B", null, { ke: "/" }],
  ["Teacher + Admin sekolah, one school", null, { ke: "/" }],
  ["Admin platform only", null, { ke: "/" }],
];

function sama(r: Rencana, h: Harap): boolean {
  const a = r.tetapkan ? JSON.stringify([r.tetapkan.tujuan, r.tetapkan.tempat, r.tetapkan.platform, r.tetapkan.sebab]) : "-";
  const b = h.set ? JSON.stringify([h.set.tujuan, h.set.tempat, h.set.platform, h.set.sebab]) : "-";
  return a === b && r.ke === h.ke;
}
const tampil = (r: Rencana) => `${r.tetapkan ? kunciPasangan(r.tetapkan) + "/" + r.tetapkan.sebab : "nothing set"} → ${r.ke}`;

const baca = (root: string, p: string) => readFileSync(join(root, p), "utf8");
// a comment opens after whitespace (or JSX's brace); "/api/*" or "https://" inside a string is not one
const tanpaKomentar = (s: string) => s.replace(/(^|[\s{])\/\*[\s\S]*?\*\//g, "$1").replace(/(^|\s)\/\/[^\n]*/g, "$1");

function semuaBerkas(root: string, d: string, pola: RegExp): string[] {
  const out: string[] = [];
  for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) out.push(...semuaBerkas(root, p, pola));
    else if (pola.test(e.name)) out.push(p);
  }
  return out;
}

// ════════════════════════════════════════════════════════════════ F22-P05's reader
/** The top-level functions of a file, each with its body (a function runs until the next top-level declaration). */
function fungsiDari(sumber: string): Map<string, { ekspor: boolean; isi: string }> {
  const s = tanpaKomentar(sumber);
  const awal = [...s.matchAll(/^(export )?(?:async )?function (\w+)\s*[(<]/gm)];
  const batas = [...s.matchAll(/^(?:export |const |type |async |function |let )/gm)].map((m) => m.index!);
  const out = new Map<string, { ekspor: boolean; isi: string }>();
  for (const m of awal) {
    const akhir = batas.find((i) => i > m.index!) ?? s.length;
    out.set(m[2], { ekspor: Boolean(m[1]), isi: s.slice(m.index!, akhir) });
  }
  return out;
}

/** A call that writes or asks the database to act, in a server action. */
const TINDAKAN = /\.rpc\(|\)\s*\.(?:insert|update|upsert|delete)\(/;
/** The context checks themselves (src/lib/konteks-server.ts; pengajar.ts's kelas, which narrows to the context). */
const PENJAGA = ["wajibDalamKonteks", "sasaranDalamKonteks", "kelasKonteks"];

/**
 * Which top-level functions of a context-bound file check the context before they act: a check (or a call to a
 * function of the same file that checks) comes before the first database act in the body. A function with no act
 * of its own is guarded only through what it calls.
 */
function terjaga(sumber: string): Map<string, boolean> {
  const fn = fungsiDari(sumber);
  const hasil = new Map<string, boolean>([...fn.keys()].map((k) => [k, false]));
  for (let ubah = true; ubah;) {
    ubah = false;
    for (const [nama, { isi }] of fn) {
      if (hasil.get(nama)) continue;
      const badan = isi.slice(isi.indexOf("{"));
      const penjaga = [...PENJAGA, ...[...hasil].filter(([k, v]) => v && k !== nama).map(([k]) => k)];
      const posJaga = Math.min(...penjaga.map((g) => { const m = new RegExp(`\\b${g}\\(`).exec(badan); return m ? m.index : Infinity; }));
      const tindak = TINDAKAN.exec(badan);
      if (posJaga !== Infinity && (!tindak || posJaga < tindak.index)) { hasil.set(nama, true); ubah = true; }
    }
  }
  return hasil;
}

/** The server-action files bound to a working context, and their actions exempt by name, each with its reason. */
const AKSI_TERIKAT: Record<string, Record<string, string>> = {
  "src/app/studio/actions.ts": {},
  "src/app/konfigurasi/actions.ts": {},
  "src/app/pendataan/actions.ts": { kemajuanAksi: "a re-read of the job's progress; it acts on nothing" },
  "src/app/pimpinan/actions.ts": {},
  "src/app/pimpinan/[simpul]/umpan-balik/actions.ts": {},
  "src/app/mengajar/actions.ts": {},
  // W2.5 (Batch 5; CR-05): the revocation checks the certificate's school against the context before revoke_certificate
  // W2.10 (Batch 5): the whole-class run's read of one class's waiting learners; the cards are /api/akun/aktivasi's
  "src/app/aktivasi/actions.ts": { anggotaKelasMenungguAksi: "a read of one class's waiting learners for the whole-class run; it acts on nothing, each card is decided per person by /api/akun/aktivasi" },
  "src/app/konfigurasi/sertifikat/actions.ts": {},
};
/** Every other server-action file, and why it is not context-bound. */
const AKSI_BEBAS: Record<string, string> = {
  "src/app/auth/callback/actions.ts": "signing in: there is no context yet",
  "src/app/masuk/actions.ts": "signing in and out: there is no context yet, or it is ending",
  "src/app/konteks-actions.ts": "the chooser itself: the person's own choice of context (C3)",
  "src/app/belajar/actions.ts": "Belajar has no place (C1): the learner's own work, and an attempt is bound by its controller (D-125(e))",
  "src/app/belajar/umpan-balik/actions.ts": "Belajar has no place (C1): the learner's own answer to a feedback round",
  "src/app/lapor/actions.ts": "one's own problem report: a neutral surface",
  "src/app/evaluasi/actions.ts": "an evaluation persona has no session row and so no context (C10)",
  "src/app/tur/actions.ts": "the tour's evaluation persona (C10)",
  "src/app/konfigurasi/email-uji/actions.ts": "explicitly platform-scoped (D-132(k)): the send history is the platform administrator's, by its own scope",
  "src/app/aktivasi/orang/actions.ts": "explicitly platform-scoped (F-8, D-077(3)): a name or username correction is the platform administrator's alone, decided by the database",
};
/** The context-bound API routes, and the act each checks the context before. */
const RUTE_TERIKAT: Record<string, RegExp[]> = {
  "src/app/api/akun/aktivasi/route.ts": [/rpc\("authorize_new_person"/, /rpc\("authorize_account_activation"/],
  "src/app/api/akun/kartu-kelas/route.ts": [/rpc\("authorize_card_reissue"/],
  "src/app/api/keamanan/pemulihan/route.ts": [/rpc\("admin_reset_recovery"/],
  "src/app/api/assets/upload-url/route.ts": [/rpc\("can_on_node"/, /rpc\("may_upload_package_media"/],
  "src/app/api/akun/kartu-ke-email/route.ts": [/rpc\("authorize_card_conversion"/],
};
/** Every other API route, and why it is not context-bound. */
const RUTE_BEBAS: Array<[RegExp, string]> = [
  [/^src\/app\/api\/aktifkan\//, "activating one's own account, before any session"],
  [/^src\/app\/api\/masuk\//, "signing in: there is no context yet"],
  [/^src\/app\/api\/sesi\//, "the session itself: lock, heartbeat, device, end"],
  [/^src\/app\/api\/akun\/(?:email|pin|kartu)\/|^src\/app\/api\/akun\/kartu\/kirim\//, "the person's own account"],
  [/^src\/app\/api\/akun\/(?:email|pin|kartu)\/route\.ts$/, "the person's own account"],
  [/^src\/app\/api\/assets\/read-url\//, "a read: each path is decided by the database"],
  [/^src\/app\/api\/certificates\/issue\//, "the learner's own certificate: Belajar has no place (C1)"],
  [/^src\/app\/api\/dev\//, "development only, refused in production"],
  [/^src\/app\/api\/evaluation\/assume\//, "an evaluation persona (C10)"],
  [/^src\/app\/api\/verifikasi\//, "public certificate verification"],
  [/^src\/app\/api\/email\/uji\//, "explicitly platform-scoped (D-132(k)): the platform administrator's delivery proof, by its own scope"],
  [/^src\/app\/api\/akun\/foto\//, "the person's own profile photo (W2.8): a neutral surface"],
];

export const fable22Tests: SelfTest[] = [
  {
    id: "F22-P01",
    run: async () => {
      const c = new Checks();
      // 1. each door, each person (§4), and no door (C9)
      for (const [orang, pintu, harap] of TABEL) {
        const r = rencanaMasuk({ pintu, lanjut: "", tanda: false, tempat: ORANG[orang] });
        c.expect(sama(r, harap), `${orang}, ${pintu ? `door ${pintu}` : "no door"}: ${tampil(r)}; expected `
          + `${harap.set ? kunciPasangan(harap.set) + "/" + harap.set.sebab : "nothing set"} → ${harap.ke}`);
      }
      // the chooser each «not held» and «several» lands on offers what §4 says
      const tawar = (orang: string, ke: string) =>
        pintuPilihan(ORANG[orang], bacaPermintaan(Object.fromEntries(new URL(ke, "https://x").searchParams))).map(kunciPasangan).sort();
      const harapTawar: Array<[string, string, string[]]> = [
        ["Teacher, one school", TIDAK("MENGELOLA"), [kunciPasangan(AJAR(S))]],
        ["Learner only", TIDAK("MENGAJAR"), ["BELAJAR"]],
        ["Admin platform only", alamatPilih({ untuk: "MENGELOLA" }), [`MENGELOLA:${A}`, `MENGELOLA:${B}`, `MENGELOLA:${L}`, "MENGELOLA:PLATFORM"].sort()],
        ["Admin platform + teacher in A and B", alamatPilih({ untuk: "MENGAJAR" }), [`MENGAJAR:${A}`, `MENGAJAR:${B}`].sort()],
        ["Teacher + Admin sekolah, one school", "/", [kunciPasangan(AJAR(S)), `MENGELOLA:${S}`].sort()],
      ];
      for (const [orang, ke, pintu] of harapTawar) {
        const ada = tawar(orang, ke);
        c.expect(JSON.stringify(ada) === JSON.stringify(pintu), `${orang} at ${ke} is offered ${JSON.stringify(ada)}; expected ${JSON.stringify(pintu)}`);
      }
      // nobody holding anything: the chooser, which says so (entry.kosong), and never a home of a role
      const kosong = rencanaMasuk({ pintu: null, lanjut: "", tanda: false, tempat: [] });
      c.expect(!kosong.tetapkan && kosong.ke === "/", `a person holding nothing: ${tampil(kosong)}`);

      // 2. C4: a page asked for sets a context only when exactly one held pair fits it; several, the chooser
      const halaman: Array<[string, string, Harap]> = [
        ["Teacher, one school", "/mengajar/k1?bagian=siapkan", { set: set(AJAR(S), "HALAMAN"), ke: "/mengajar/k1?bagian=siapkan" }],
        ["Learner + Admin sekolah", "/konfigurasi?bagian=roles", { set: set(KELOLA(S, "INSTITUTION_ADMIN"), "HALAMAN"), ke: "/konfigurasi?bagian=roles" }],
        ["Admin platform + teacher in A and B", "/mengajar", { ke: alamatPilih({ lanjut: "/mengajar" }) }],
        ["Admin platform only", "/konfigurasi", { ke: alamatPilih({ lanjut: "/konfigurasi" }) }],
        ["Kepala departemen", "/studio", { ke: alamatPilih({ lanjut: "/studio" }) }],
        ["Kepala departemen", "/pimpinan", { set: set(KELOLA(S, "HEAD_OF_DEPARTMENT"), "HALAMAN"), ke: "/pimpinan" }],
        // a neutral page decides nothing: the person arrives as without one, then continues there
        ["Teacher, one school", "/akun", { set: set(AJAR(S)), ke: "/akun" }],
        ["Teacher + Admin sekolah, one school", "/akun", { ke: alamatPilih({ lanjut: "/akun" }) }],
        // nobody's page here: arriving as if none were asked for
        ["Teacher, one school", "/konfigurasi", { set: set(AJAR(S)), ke: "/mengajar" }],
      ];
      for (const [orang, lanjut, harap] of halaman) {
        const r = rencanaMasuk({ pintu: null, lanjut, tanda: false, tempat: ORANG[orang] });
        c.expect(sama(r, harap), `${orang} asking for ${lanjut}: ${tampil(r)}; expected ${harap.set ? kunciPasangan(harap.set) + "/" + harap.set.sebab : "nothing set"} → ${harap.ke}`);
      }
      // the same rule for a page asked for while a session holds no context (konteksHalaman)
      const h1 = rencanaHalaman("/mengajar/k1", ORANG["Teacher, one school"]);
      const h2 = rencanaHalaman("/konfigurasi", ORANG["Admin platform only"]);
      const h3 = rencanaHalaman("/konfigurasi", ORANG["Teacher, one school"]);
      c.expect(h1.tetapkan?.sebab === "HALAMAN" && h1.ke === "/mengajar/k1", `a teacher's page with no context: ${tampil(h1)}`);
      c.expect(!h2.tetapkan && h2.ke === alamatPilih({ lanjut: "/konfigurasi" }), `Admin platform's Konfigurasi with no context: ${tampil(h2)}`);
      c.expect(!h3.tetapkan && h3.ke === alamatPilih({ lanjut: "/konfigurasi" }), `a page nobody's context serves, with no context: ${tampil(h3)}`);
      // a door with a page: the page when the door's pair serves it, its home when not
      const d1 = rencanaMasuk({ pintu: "MENGAJAR", lanjut: "/mengajar/k1", tanda: false, tempat: ORANG["Teacher + Admin sekolah, one school"] });
      const d2 = rencanaMasuk({ pintu: "MENGAJAR", lanjut: "/konfigurasi", tanda: false, tempat: ORANG["Teacher + Admin sekolah, one school"] });
      c.expect(d1.ke === "/mengajar/k1" && d2.ke === "/mengajar" && d2.tetapkan?.tujuan === "MENGAJAR",
        `a door with a page: ${tampil(d1)}; ${tampil(d2)} (another context's page must not decide the door)`);
      // an address outside PINTAR is never a destination
      const luar = rencanaMasuk({ pintu: null, lanjut: "//contoh.test/x", tanda: false, tempat: ORANG["Teacher, one school"] });
      c.expect(luar.ke === "/mengajar", `an outside address was kept as a destination: ${tampil(luar)}`);

      // 3. C5: after a session ended on this browser, a carried destination is ignored
      const t1 = rencanaMasuk({ pintu: null, lanjut: "/mengajar/k1", tanda: true, tempat: ORANG["Teacher, one school"] });
      const t2 = rencanaMasuk({ pintu: null, lanjut: "/konfigurasi?bagian=roles", tanda: true, tempat: ORANG["Teacher + Admin sekolah, one school"] });
      const t3 = rencanaMasuk({ pintu: "MENGELOLA", lanjut: "/konfigurasi?bagian=roles", tanda: true, tempat: ORANG["Learner + Admin sekolah"] });
      c.expect(t1.ke === "/mengajar" && t1.tetapkan?.sebab === "PINTU", `with the sign-out mark, a teacher went to ${tampil(t1)}`);
      c.expect(t2.ke === "/" && !t2.tetapkan, `with the sign-out mark, a person of several places went to ${tampil(t2)}`);
      c.expect(t3.ke === "/konfigurasi", `with the sign-out mark, a door went to ${tampil(t3)}`);
      return c.verdict(`the door × person table of design §4 holds for ${TABEL.length} rows (8 people × 3 doors and no door, `
        + "C9: one pair selected, several asked, the ranking never choosing), each «not held» and «several» chooser offers "
        + "exactly what §4 says, a page asked for sets a context only when exactly one held pair fits it (C4, also for a "
        + "session that holds none), a door with another context's page lands at the door's home, and after a sign-out "
        + "the carried destination is ignored (C5)");
    },
  },
  {
    id: "F22-P02",
    run: async () => {
      const c = new Checks();
      // 1. the surface table, and the neutral surfaces
      const permukaanHarap: Array<[string, string | null, Tujuan[] | null]> = [
        ["/belajar/x/peta", "/belajar", ["BELAJAR"]], ["/mengajar", "/mengajar", ["MENGAJAR"]],
        ["/edukator/ringkasan?simpul=k", "/edukator", ["MENGAJAR", "MENGELOLA"]], ["/pimpinan/k/murid", "/pimpinan", ["MENGELOLA"]],
        ["/dekan/ringkasan", "/dekan", ["MENGELOLA"]], ["/konfigurasi/keamanan", "/konfigurasi", ["MENGELOLA"]],
        ["/pendataan/j", "/pendataan", ["MENGELOLA"]], ["/aktivasi", "/aktivasi", ["MENGELOLA"]],
        ["/studio/bank", "/studio", ["MENGAJAR", "MENGELOLA"]],
        ["/akun", null, null], ["/perangkat", null, null], ["/lapor", null, null], ["/", null, null], ["/terkunci", null, null],
        ["/belajarlah", null, null], ["/studios", null, null],
      ];
      for (const [jalur, s, t] of permukaanHarap) {
        c.expect(permukaan(jalur) === s && JSON.stringify(tujuanJalur(jalur)) === JSON.stringify(t),
          `${jalur} is on ${permukaan(jalur)} for ${JSON.stringify(tujuanJalur(jalur))}; expected ${s} for ${JSON.stringify(t)}`);
      }
      // 2. which pair serves which surface (C2, C7, C8)
      const SURFACES = ["/belajar", "/mengajar", "/edukator", "/pimpinan", "/dekan", "/konfigurasi", "/pendataan", "/aktivasi", "/studio", "/akun"];
      const layan: Array<[string, Pasangan, string[]]> = [
        ["Belajar", BELAJAR, ["/belajar", "/akun"]],
        ["Mengajar · a school (Guru)", AJAR(S), ["/mengajar", "/edukator", "/studio", "/akun"]],
        ["Mengajar · a school (Kepala departemen)", AJAR(S, "HEAD_OF_DEPARTMENT"), ["/mengajar", "/edukator", "/studio", "/akun"]],
        ["Mengajar · Pustaka PINTAR", AJAR(L), ["/studio", "/akun"]],
        ["Mengelola · a school (Admin sekolah)", KELOLA(S, "INSTITUTION_ADMIN"), ["/edukator", "/konfigurasi", "/pendataan", "/aktivasi", "/studio", "/akun"]],
        ["Mengelola · a school (Admin platform)", KELOLA(S, "SYSTEM_ADMIN"), ["/edukator", "/konfigurasi", "/pendataan", "/aktivasi", "/studio", "/akun"]],
        ["Mengelola · a school (Kepala departemen)", KELOLA(S, "HEAD_OF_DEPARTMENT"), ["/edukator", "/pimpinan", "/dekan", "/studio", "/akun"]],
        // a dean holds no Studio capability (D-021; DAISY-11-STUDIO-02): Studio refuses them, so it is no tab of theirs
        ["Mengelola · a school (Dekan)", KELOLA(S, "DEAN"), ["/edukator", "/pimpinan", "/dekan", "/akun"]],
        ["Mengelola · Pustaka PINTAR", pasangan("MENGELOLA", L, SYS), ["/studio", "/akun"]],
        ["Mengelola · «Seluruh platform»", KELOLA("PLATFORM", "SYSTEM_ADMIN"), ["/konfigurasi", "/aktivasi", "/akun"]],
      ];
      for (const [nama, p, harap] of layan) {
        const ada = SURFACES.filter((s) => melayani(p, s));
        c.expect(JSON.stringify(ada) === JSON.stringify(harap), `${nama} serves ${JSON.stringify(ada)}; expected ${JSON.stringify(harap)}`);
      }
      // 3. the shell's tabs: the context's own surfaces, never another purpose's (Mengajar · B never shows Konfigurasi)
      const tab: Array<[string, Pasangan, string[]]> = [
        ["Mengajar · B", AJAR(B), ["/mengajar", "/studio"]],
        ["Mengelola · A (Admin platform)", KELOLA(A, "SYSTEM_ADMIN"), ["/konfigurasi", "/pendataan", "/aktivasi", "/studio"]],
        ["Mengelola · «Seluruh platform»", KELOLA("PLATFORM", "SYSTEM_ADMIN"), ["/konfigurasi", "/aktivasi"]],
        ["Mengelola · a school (Kepala departemen)", KELOLA(S, "HEAD_OF_DEPARTMENT"), ["/pimpinan", "/studio"]],
        ["Belajar", BELAJAR, ["/belajar"]],
      ];
      for (const [nama, p, harap] of tab) {
        const ada = permukaanKonteks(p);
        c.expect(JSON.stringify(ada) === JSON.stringify(harap), `${nama}'s tabs are ${JSON.stringify(ada)}; expected ${JSON.stringify(harap)}`);
      }
      // 4. the homes (D-010 kept for where a pair lands, never to choose among several)
      const beranda: Array<[Pasangan, string]> = [
        [BELAJAR, "/belajar"], [AJAR(S), "/mengajar"], [KELOLA(S, "INSTITUTION_ADMIN"), "/konfigurasi"], [KELOLA(S, "SYSTEM_ADMIN"), "/konfigurasi"],
        [KELOLA(S, "HEAD_OF_DEPARTMENT"), "/pimpinan"], [KELOLA(S, "DEAN"), "/pimpinan"], [pasangan("MENGELOLA", L, SYS), "/studio"],
        [AJAR(L), "/studio"], [KELOLA("PLATFORM", "SYSTEM_ADMIN"), "/konfigurasi"],
      ];
      for (const [p, harap] of beranda) {
        c.expect(berandaPasangan(p) === harap, `${kunciPasangan(p)} (${p.peran.join(",")}) lands on ${berandaPasangan(p)}; expected ${harap}`);
      }
      // 5. a pair as a form value, and the four shapes a context may have (device_sessions_konteks_bentuk)
      for (const p of [BELAJAR, AJAR(S), KELOLA(S, "DEAN"), KELOLA("PLATFORM", "SYSTEM_ADMIN")]) {
        const balik = bacaKunciPasangan(kunciPasangan(p));
        c.expect(balik !== null && balik.tujuan === p.tujuan && balik.tempat === p.tempat && balik.platform === p.platform,
          `${kunciPasangan(p)} does not read back as itself`);
      }
      for (const salah of [`BELAJAR:${S}`, "MENGAJAR", "MENGAJAR:PLATFORM", "MENGELOLA", "BELAJAR:PLATFORM", "MENGAJAR:bukan-uuid",
        `MENGELOLA:${S}:x`, "mengajar", 42, null]) {
        c.expect(bacaKunciPasangan(salah) === null, `the malformed form value ${JSON.stringify(salah)} was read as a pair`);
      }
      const bentuk: Array<[Record<string, unknown>, boolean]> = [
        [{ keadaan: "ADA", tujuan: "BELAJAR", tempat: null, platform: false }, true],
        [{ keadaan: "ADA", tujuan: "BELAJAR", tempat: S, platform: false }, false],
        [{ keadaan: "ADA", tujuan: "MENGAJAR", tempat: null, platform: false }, false],
        [{ keadaan: "ADA", tujuan: "MENGAJAR", tempat: null, platform: true }, false],
        [{ keadaan: "ADA", tujuan: "MENGELOLA", tempat: S, platform: true }, false],
        [{ keadaan: "ADA", tujuan: "MENGELOLA", tempat: null, platform: false }, false],
        [{ keadaan: "ADA", tujuan: "MENGELOLA", tempat: null, platform: true }, true],
        [{ keadaan: "ADA", tujuan: "PENGAWAS", tempat: S, platform: false }, false],
      ];
      for (const [data, sah] of bentuk) {
        c.expect((bacaKonteks(data) !== null) === sah, `${JSON.stringify(data)} was ${sah ? "refused" : "read as a context"}`);
      }
      c.expect(bacaKonteks({ keadaan: "TIDAK_BERLAKU", tujuan: "MENGAJAR" })?.keadaan === "TIDAK_BERLAKU" && bacaKonteks({ keadaan: "LAIN" }) === null
        && bacaKonteks(null) === null, "an invalidated context or an unreadable answer is not read as konteks_saya says");
      return c.verdict(`the surface table holds for ${permukaanHarap.length} paths (neutral pages keep the context), `
        + `${layan.length} pairs serve exactly their own surfaces (Mengajar only from teaching grants and never in a library, C2; `
        + "«Seluruh platform» only Konfigurasi and Aktivasi, C7; Studio by the pair's capabilities, C8), the shell's tabs are the "
        + "context's own (Mengajar · B never offers Konfigurasi), each pair lands on its D-010 home, a pair round-trips as a "
        + "form value, and only the four shapes the database allows are read as a context");
    },
  },
  {
    id: "F22-P03",
    run: async (ctx) => {
      const c = new Checks();
      type Masuk = Parameters<typeof aturTanda>[0];
      type Keluar = ReturnType<typeof aturTanda>;
      const kasus: Array<[string, Masuk, Keluar]> = [
        ["a signed-in page, first time on this browser", { masuk: true, berakhir: false, hadir: false, selesai: false, aksi: false },
          { pasangHadir: true, hapusHadir: false, pasangSelesai: false, tandai: false }],
        ["a signed-in server action (no cookie written there, BOB-23)", { masuk: true, berakhir: false, hadir: false, selesai: false, aksi: true },
          { pasangHadir: false, hapusHadir: false, pasangSelesai: false, tandai: false }],
        ["a signed-in page, already present", { masuk: true, berakhir: false, hadir: true, selesai: false, aksi: false },
          { pasangHadir: false, hapusHadir: false, pasangSelesai: false, tandai: false }],
        ["a session the proxy finds ended (expiry, three wrong PINs)", { masuk: true, berakhir: true, hadir: true, selesai: false, aksi: false },
          { pasangHadir: false, hapusHadir: true, pasangSelesai: true, tandai: true }],
        ["a browser that held a session and arrives without one (ended elsewhere)", { masuk: false, berakhir: false, hadir: true, selesai: false, aksi: false },
          { pasangHadir: false, hapusHadir: true, pasangSelesai: true, tandai: true }],
        ["signed out with the mark (no lanjut is minted)", { masuk: false, berakhir: false, hadir: false, selesai: true, aksi: false },
          { pasangHadir: false, hapusHadir: false, pasangSelesai: false, tandai: true }],
        ["a fresh browser: a genuinely new request stays usable", { masuk: false, berakhir: false, hadir: false, selesai: false, aksi: false },
          { pasangHadir: false, hapusHadir: false, pasangSelesai: false, tandai: false }],
      ];
      for (const [nama, masuk, harap] of kasus) {
        const ada = aturTanda(masuk);
        c.expect(JSON.stringify(ada) === JSON.stringify(harap), `${nama}: ${JSON.stringify(ada)}; expected ${JSON.stringify(harap)}`);
      }
      // every end of a session on a browser sets the mark, and the next arrival removes it and ignores the destination
      const b = (p: string) => tanpaKomentar(baca(ctx.repoRoot, p));
      for (const p of ["src/app/keluar/route.ts", "src/app/api/sesi/keluar-semua/route.ts", "src/app/masuk/actions.ts"]) {
        c.expect(/COOKIE_SELESAI/.test(b(p)), `${p} ends a session without setting the sign-out mark`);
      }
      const mulai = b("src/app/mulai/route.ts");
      c.expect(/const tanda = request\.cookies\.has\(COOKIE_SELESAI\)/.test(mulai) && /const lanjut = tanda \? "" :/.test(mulai)
        && /cookies\.set\(COOKIE_SELESAI, "", \{[^}]*maxAge: 0/.test(mulai),
        "/mulai does not ignore a carried destination under the mark, or does not remove the mark");
      // every arrival goes through /mulai, so where it sends the browser must be this same origin: a relative Location,
      // never one built from request.url (which names the server's own host, not the address the browser used)
      c.expect(!/request\.url/.test(mulai) && /headers: \{ location: tujuanInternal\(ke, "\/"\) \}/.test(mulai),
        "/mulai builds where it sends the browser from the server's own host, not as a relative address");
      const proxy = b("src/proxy.ts");
      c.expect(/aturTanda\(/.test(proxy) && /tanda\.tandai/.test(proxy), "the proxy does not apply the sign-out mark");
      // the mark holds no identity
      for (const p of ["src/lib/tanda-keluar.ts", "src/app/keluar/route.ts", "src/app/api/sesi/keluar-semua/route.ts", "src/proxy.ts", "src/app/masuk/actions.ts"]) {
        const m = b(p).match(/cookies\.set\((?:COOKIE_SELESAI|COOKIE_HADIR), ([^,]+),/g) ?? [];
        c.expect(m.every((x) => /, (?:"1"|"")$/.test(x.replace(/,$/, ""))), `${p} writes the mark with a value other than "1": ${m.join(" ")}`);
      }
      return c.verdict(`the sign-out mark (D-132(e), a 4.0 stale-continuation guard): ${kasus.length} cases as designed (an end `
        + "found by the proxy and an end elsewhere both set it; a fresh browser is never marked, so a new request stays usable; "
        + "a server action writes no cookie); «Keluar», «Keluar dari semua perangkat» and S15's sign-out set it; /mulai ignores "
        + "the carried destination under it and removes it, sending the browser on by a relative address; it holds no identity");
    },
  },
  {
    id: "F22-P04",
    run: async (ctx) => {
      const c = new Checks();
      const b = (p: string) => tanpaKomentar(baca(ctx.repoRoot, p));
      // 1. visiting `/` writes nothing: its doors are forms whose POST is the person's choice
      const pilih = b("src/app/page.tsx");
      c.expect(!/tetapkanKonteks|konteks_tetapkan/.test(pilih) && /action=\{pilihKonteks\}/.test(pilih),
        "the chooser (src/app/page.tsx) writes a context on a visit, or its doors are not the chooser's POST");
      // 2. the writer has exactly three callers: arriving (/mulai), a page asked for with no context (C4), the choice
      const src = semuaBerkas(ctx.repoRoot, "src", /\.tsx?$/);
      const rpc = src.filter((p) => /rpc\("konteks_tetapkan"/.test(b(p)));
      c.expect(JSON.stringify(rpc.sort()) === JSON.stringify(["src/app/mulai/route.ts", "src/lib/konteks-server.ts"]),
        `konteks_tetapkan is called from ${JSON.stringify(rpc)}`);
      const pemanggil = src.filter((p) => p !== "src/lib/konteks-server.ts" && /\btetapkanKonteks\(/.test(b(p)));
      c.expect(JSON.stringify(pemanggil) === JSON.stringify(["src/app/konteks-actions.ts"]), `tetapkanKonteks is called from ${JSON.stringify(pemanggil)}`);
      const server = b("src/lib/konteks-server.ts");
      c.expect((server.match(/\btetapkanKonteks\(/g) ?? []).length === 2 && /sebab: "PILIHAN"/.test(b("src/app/konteks-actions.ts")),
        "konteks-server.ts calls its writer from somewhere other than the page's C4 (konteksSaya), or the choice is not PILIHAN");
      // C4 settles on a surface page only: never on a neutral page, never inside a server action (§2.11)
      c.expect(/if \(h\.get\("next-action"\)\) return k;/.test(server) && /if \(tujuanJalur\(jalur\) === null\) return k;/.test(server),
        "a server action or a neutral page can set a context");
      // no other switch: the chooser's action is used by the chooser alone, and nothing writes the columns directly
      const pakai = src.filter((p) => p !== "src/app/konteks-actions.ts" && /\bpilihKonteks\b/.test(b(p)));
      c.expect(JSON.stringify(pakai) === JSON.stringify(["src/app/page.tsx"]), `pilihKonteks is used by ${JSON.stringify(pakai)}`);
      const kolom = src.filter((p) => /konteks_(?:tujuan|tempat|platform|sebab|pada)\b/.test(b(p)));
      c.expect(kolom.length === 0, `the context's columns are named in ${JSON.stringify(kolom)}`);
      // 3. the chooser narrows to what was asked and never strands anybody
      const semua = ORANG["Admin platform + teacher in A and B"];
      const n = (sp: Record<string, string>) => pintuPilihan(semua, bacaPermintaan(sp)).map(kunciPasangan);
      c.expect(n({}).length === semua.length, "the chooser does not offer every pair held when nothing is asked");
      c.expect(JSON.stringify(n({ untuk: "MENGELOLA", tempat: A })) === JSON.stringify([`MENGELOLA:${A}`]), "the chooser does not narrow to a purpose and place");
      c.expect(JSON.stringify(n({ tempat: "PLATFORM" })) === JSON.stringify(["MENGELOLA:PLATFORM"]), "the chooser does not narrow to «Seluruh platform»");
      c.expect(JSON.stringify(n({ lanjut: "/mengajar/k1" }).sort()) === JSON.stringify([`MENGAJAR:${A}`, `MENGAJAR:${B}`]),
        "the chooser does not narrow to the pairs that serve the page to continue to");
      c.expect(n({ untuk: "BELAJAR" }).length === semua.length, "a chooser asked for what nobody holds strands the person");
      c.expect(bacaPermintaan({ lanjut: "https://contoh.test/" }).lanjut === "" && bacaPermintaan({ tempat: "bukan" }).tempat === null,
        "the chooser accepts an outside destination or a malformed place");
      // 4. D-132(m): the six expressions awaiting Dr Gladys stay unresolved. Each is a semantic key that draws nothing
      //    (never the key, never a stand-in sentence), none has words in the copy table, and each is placed in the source
      const ENAM = ["context.manage_label", "context.not_held", "context.other_context", "context.invalid", "context.other_school", "context.choose_place"];
      c.expect(JSON.stringify([...ISTILAH_MENUNGGU].sort()) === JSON.stringify([...ENAM].sort()), `the expressions awaiting words are ${JSON.stringify(ISTILAH_MENUNGGU)}`);
      c.expect(ISTILAH_MENUNGGU.every((k) => istilah(k) === null), "an expression awaiting Dr Gladys's words draws something before she gives them");
      const salinan = b("src/lib/hle.ts");
      c.expect(ENAM.every((k) => !salinan.includes(`"${k}"`)), "an expression awaiting Dr Gladys has words in the copy table");
      const dipakai = ENAM.filter((k) => src.some((p) => p !== "src/lib/istilah-menunggu.ts" && b(p).includes(`istilah("${k}")`)));
      c.expect(dipakai.length === ENAM.length, `expressions not placed anywhere: ${JSON.stringify(ENAM.filter((k) => !dipakai.includes(k)))}`);
      return c.verdict("the chooser changes nothing by being visited (C3): its doors are POSTs to pilihKonteks, the one switch; "
        + "konteks_tetapkan is called only by /mulai and konteks-server.ts, whose writer only the page's C4 (konteksSaya) and the "
        + "person's choice (PILIHAN) call; nothing else names the context's columns; and the chooser narrows to the purpose, "
        + "place or page asked for without ever stranding anybody. The six expressions awaiting Dr Gladys (D-132(m)) stay "
        + "semantic keys: each is placed, draws nothing, and has no words in the copy table");
    },
  },
  {
    id: "F22-P05",
    run: async (ctx) => {
      const c = new Checks();
      const src = semuaBerkas(ctx.repoRoot, "src", /\.tsx?$/);
      // 1. every server-action file is classified: bound to a context, or exempt with its reason
      const berkasAksi = src.filter((p) => /^\s*["']use server["'];?/m.test(baca(ctx.repoRoot, p).split("\n").slice(0, 3).join("\n")));
      for (const p of berkasAksi) {
        c.expect(p in AKSI_TERIKAT || p in AKSI_BEBAS, `${p} holds server actions and is neither context-bound nor exempt by name`);
      }
      for (const p of [...Object.keys(AKSI_TERIKAT), ...Object.keys(AKSI_BEBAS)]) {
        c.expect(berkasAksi.includes(p), `${p} is classified but holds no server actions`);
      }
      // 2. every exported action of a bound file checks the context before it acts
      let n = 0;
      const bebas: string[] = [];
      for (const [p, kecuali] of Object.entries(AKSI_TERIKAT)) {
        const sumber = baca(ctx.repoRoot, p);
        const fn = fungsiDari(sumber);
        const jaga = terjaga(sumber);
        for (const [nama, { ekspor }] of fn) {
          if (!ekspor) continue;
          if (nama in kecuali) { bebas.push(`${nama} (${kecuali[nama]})`); continue; }
          n++;
          c.expect(jaga.get(nama) === true, `${p}: ${nama} acts without first checking that its target is in the active context (§2.11)`);
        }
        for (const nama of Object.keys(kecuali)) c.expect(fn.get(nama)?.ekspor === true, `${p}: the exempt ${nama} is not an action there`);
      }
      // 3. the checker bites: an action with its check removed, or moved after its act, is caught
      const studio = baca(ctx.repoRoot, "src/app/studio/actions.ts");
      const tanpa = studio.replace(/(export async function runValidationAction[\s\S]*?)\n\s*await wajibDalamKonteks\([^\n]*\n/, "$1\n");
      c.expect(tanpa !== studio && terjaga(tanpa).get("runValidationAction") === false, "a Studio action with its check removed is not caught");
      const pend = baca(ctx.repoRoot, "src/app/pendataan/actions.ts");
      const telat = pend.replace(/(export async function simpanKodeAksi[\s\S]*?)(\n\s*await wajibDalamKonteks\([^\n]*)([\s\S]*?\.rpc\("reserve_institution_namespace"[^\n]*\n)/, "$1$3$2\n");
      c.expect(telat !== pend && terjaga(telat).get("simpanKodeAksi") === false, "a check moved after its act is not caught");
      // 4. the context-bound API routes check before their act; every other route is exempt by name
      const rute = src.filter((p) => /^src\/app\/api\/.*\/route\.ts$/.test(p));
      for (const p of rute) {
        const bebasRute = RUTE_BEBAS.find(([pola]) => pola.test(p));
        c.expect(p in RUTE_TERIKAT || bebasRute, `${p} is neither a context-bound route nor exempt by name`);
      }
      for (const [p, tindakan] of Object.entries(RUTE_TERIKAT)) {
        c.expect(rute.includes(p), `${p} is classified but does not exist`);
        const s = tanpaKomentar(baca(ctx.repoRoot, p));
        for (const t of tindakan) {
          const di = t.exec(s);
          const jaga = [...s.matchAll(/sasaranDalamKonteks\(/g)].map((m) => m.index!);
          c.expect(di !== null && jaga.some((j) => j < di.index), `${p}: ${t} is reached without first checking the active context (§2.11)`);
        }
        c.expect(/CONTEXT_OTHER_PLACE/.test(s), `${p} does not say why a target outside the context was refused`);
      }
      // 5. the check is a narrowing only: it never grants, and no system path makes a device session for it
      const server = tanpaKomentar(baca(ctx.repoRoot, "src/lib/konteks-server.ts"));
      c.expect(!/supabaseService|service_role|device_sessions/.test(server), "the context check reaches for the service key or writes a device session");
      return c.verdict(`§2.11 (D-132(k)): all ${n} context-bound server actions in ${Object.keys(AKSI_TERIKAT).length} files check their `
        + `target against the active context before acting (exempt by name: ${bebas.join("; ")}), and the ${Object.keys(RUTE_TERIKAT).length} `
        + "context-bound API routes before their act; every other server-action file and route is exempt by name with its reason "
        + "(signing in, the chooser, Belajar's own work, a person's own account, personas, public pages); the checker catches a "
        + "removed check and a check moved after its act; the check uses no service key and makes no device session");
    },
  },
];

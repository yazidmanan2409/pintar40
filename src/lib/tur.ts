/**
 * THE FIRST-LOGIN TOUR, AS A MODEL.
 *
 * Seven steps, chosen by what this person will use most in a real week — never
 * by what was hard to build. A map, not a manual: each step answers one of
 * "where am I", "what is PINTAR helping me do", "where do my most-used things
 * live", "what do I normally do next", "where is help". No workflow is taught
 * end to end.
 *
 * THE TOUR LOOKS; IT NEVER COMMITS. Nothing here navigates, and nothing here
 * is clickable product. A surface that lives INSIDE an assignment is shown as a
 * miniature labelled "Contoh / Example" — because opening the real lesson
 * records reading progress (`record_lesson_progress` fires from `LessonPlayer`'s
 * mount) and opening a real assessment would be a commitment. The step's meaning
 * is carried by its words; the miniature only shows the shape.
 *
 * ONE LEARNER IDENTITY, THREE VARIANTS. `learner.first_login` is the identity
 * the person's state hangs on. `Belajar·Netral`, `Belajar·SD` and
 * `Belajar·Menengah` are presentation VARIANTS of it, not separate tours: a
 * variant change resets nothing, counts against nothing and is not a new
 * version. Which one is presented is decided by `varianBelajar()` below, and
 * PINTAR does not guess: with no legitimate person-scoped stage signal — which
 * is PINTAR 4.0 today — the neutral variant is the executable one. `courses.stage`
 * is a property of a course, not of a person, and is never consulted.
 *
 * This module is pure. The reads and writes live in `src/lib/tur-negara.ts`.
 */
import type { HleEvent } from "@/lib/hle";

/** The persistence identities the backend declares. Nothing else exists. */
export const TUR_BELAJAR = "learner.first_login";
export const TUR_PENGAJAR = "educator.first_login";
export type TurKey = typeof TUR_BELAJAR | typeof TUR_PENGAJAR;

/** Which presentation variant of a tour identity is being shown. */
export type Varian = "netral" | "sd" | "menengah" | "pengajar";

/**
 * A step's target. `anchor` points at a real thing on the landing page, found
 * by its stable `data-tur` name; `miniatur` draws a small, inert example of a
 * surface that lives somewhere the tour must not go.
 */
export type Sasaran =
  | { jenis: "anchor"; nama: string }
  | { jenis: "miniatur"; nama: MiniaturKind };

export type MiniaturKind =
  | "spine" | "peta" | "soal" | "pelajaran" | "hasil"
  | "cepat" | "sedia" | "bukti";

export type Langkah = {
  /** 1..7 — the position a reader is told, and the order they are read in. */
  posisi: number;
  sasaran: Sasaran;
  judul: HleEvent;
  isi: HleEvent;
  /** Body used when an `anchor` target is legitimately absent. */
  kosong?: HleEvent;
};

export type Tur = {
  kunci: TurKey;
  varian: Varian;
  /** The tour's own name, as Help lists it. */
  nama: HleEvent;
  langkah: Langkah[];
};

const k = (s: string) => s as HleEvent;

// ══════════════════════════════════════════ Belajar · Netral (§C2) — executable
const BELAJAR_NETRAL: Langkah[] = [
  { posisi: 1, sasaran: { jenis: "anchor", nama: "daftar" },
    judul: k("tur.nt.1.judul"), isi: k("tur.nt.1.isi"), kosong: k("tur.nt.1.kosong") },
  { posisi: 2, sasaran: { jenis: "miniatur", nama: "spine" },
    judul: k("tur.nt.2.judul"), isi: k("tur.nt.2.isi") },
  { posisi: 3, sasaran: { jenis: "miniatur", nama: "peta" },
    judul: k("tur.nt.3.judul"), isi: k("tur.nt.3.isi") },
  { posisi: 4, sasaran: { jenis: "miniatur", nama: "soal" },
    judul: k("tur.nt.4.judul"), isi: k("tur.nt.4.isi") },
  { posisi: 5, sasaran: { jenis: "miniatur", nama: "hasil" },
    judul: k("tur.nt.5.judul"), isi: k("tur.nt.5.isi") },
  { posisi: 6, sasaran: { jenis: "anchor", nama: "sertifikat" },
    judul: k("tur.nt.6.judul"), isi: k("tur.nt.6.isi") },
  { posisi: 7, sasaran: { jenis: "anchor", nama: "bantuan" },
    judul: k("tur.nt.7.judul"), isi: k("tur.nt.7.isi") },
];

// ═══════════════════════════════════════════════ Belajar · SD (§B) — dormant
const BELAJAR_SD: Langkah[] = [
  { posisi: 1, sasaran: { jenis: "anchor", nama: "daftar" },
    judul: k("tur.sd.1.judul"), isi: k("tur.sd.1.isi"), kosong: k("tur.sd.1.kosong") },
  { posisi: 2, sasaran: { jenis: "miniatur", nama: "soal" },
    judul: k("tur.sd.2.judul"), isi: k("tur.sd.2.isi") },
  { posisi: 3, sasaran: { jenis: "miniatur", nama: "soal" },
    judul: k("tur.sd.3.judul"), isi: k("tur.sd.3.isi") },
  { posisi: 4, sasaran: { jenis: "miniatur", nama: "peta" },
    judul: k("tur.sd.4.judul"), isi: k("tur.sd.4.isi") },
  { posisi: 5, sasaran: { jenis: "miniatur", nama: "pelajaran" },
    judul: k("tur.sd.5.judul"), isi: k("tur.sd.5.isi") },
  { posisi: 6, sasaran: { jenis: "miniatur", nama: "hasil" },
    judul: k("tur.sd.6.judul"), isi: k("tur.sd.6.isi") },
  { posisi: 7, sasaran: { jenis: "anchor", nama: "bantuan" },
    judul: k("tur.sd.7.judul"), isi: k("tur.sd.7.isi") },
];

// ════════════════════════════════════════ Belajar · Menengah (§C) — dormant
const BELAJAR_MENENGAH: Langkah[] = [
  { posisi: 1, sasaran: { jenis: "anchor", nama: "daftar" },
    judul: k("tur.sm.1.judul"), isi: k("tur.sm.1.isi"), kosong: k("tur.sm.1.kosong") },
  { posisi: 2, sasaran: { jenis: "miniatur", nama: "spine" },
    judul: k("tur.sm.2.judul"), isi: k("tur.sm.2.isi") },
  { posisi: 3, sasaran: { jenis: "miniatur", nama: "peta" },
    judul: k("tur.sm.3.judul"), isi: k("tur.sm.3.isi") },
  { posisi: 4, sasaran: { jenis: "miniatur", nama: "soal" },
    judul: k("tur.sm.4.judul"), isi: k("tur.sm.4.isi") },
  { posisi: 5, sasaran: { jenis: "miniatur", nama: "hasil" },
    judul: k("tur.sm.5.judul"), isi: k("tur.sm.5.isi") },
  { posisi: 6, sasaran: { jenis: "anchor", nama: "sertifikat" },
    judul: k("tur.sm.6.judul"), isi: k("tur.sm.6.isi") },
  { posisi: 7, sasaran: { jenis: "anchor", nama: "bantuan" },
    judul: k("tur.sm.7.judul"), isi: k("tur.sm.7.isi") },
];

// ═════════════════════════════════════════════ Kelas · Pengajar (§D)
const PENGAJAR: Langkah[] = [
  { posisi: 1, sasaran: { jenis: "anchor", nama: "layak" },
    judul: k("tur.pg.1.judul"), isi: k("tur.pg.1.isi"), kosong: k("tur.pg.1.kosong") },
  { posisi: 2, sasaran: { jenis: "anchor", nama: "kelas" },
    judul: k("tur.pg.2.judul"), isi: k("tur.pg.2.isi"), kosong: k("tur.pg.2.kosong") },
  { posisi: 3, sasaran: { jenis: "anchor", nama: "berjalan" },
    judul: k("tur.pg.3.judul"), isi: k("tur.pg.3.isi"), kosong: k("tur.pg.3.kosong") },
  { posisi: 4, sasaran: { jenis: "miniatur", nama: "cepat" },
    judul: k("tur.pg.4.judul"), isi: k("tur.pg.4.isi") },
  { posisi: 5, sasaran: { jenis: "miniatur", nama: "sedia" },
    judul: k("tur.pg.5.judul"), isi: k("tur.pg.5.isi") },
  { posisi: 6, sasaran: { jenis: "miniatur", nama: "bukti" },
    judul: k("tur.pg.6.judul"), isi: k("tur.pg.6.isi") },
  { posisi: 7, sasaran: { jenis: "anchor", nama: "bantuan" },
    judul: k("tur.pg.7.judul"), isi: k("tur.pg.7.isi") },
];

const VARIAN: Record<Varian, Tur> = {
  netral:   { kunci: TUR_BELAJAR,  varian: "netral",   nama: k("tur.nama.belajar"),  langkah: BELAJAR_NETRAL },
  sd:       { kunci: TUR_BELAJAR,  varian: "sd",       nama: k("tur.nama.belajar"),  langkah: BELAJAR_SD },
  menengah: { kunci: TUR_BELAJAR,  varian: "menengah", nama: k("tur.nama.belajar"),  langkah: BELAJAR_MENENGAH },
  pengajar: { kunci: TUR_PENGAJAR, varian: "pengajar", nama: k("tur.nama.pengajar"), langkah: PENGAJAR },
};

export function tur(varian: Varian): Tur {
  return VARIAN[varian];
}

/**
 * WHICH LEARNER VARIANT IS PRESENTED — and the whole point is what it refuses.
 *
 * It takes a legitimate PERSON-SCOPED stage, or nothing. There is no other
 * parameter, so there is nothing for a caller to pass a course, a class, a
 * title, an age or a guess through. PINTAR 4.0 has no such source, so every
 * caller passes null today and every learner gets the neutral variant.
 *
 * If a legitimate signal ever lands, it selects a variant of the SAME identity:
 * no state reset, no re-presentation, no new version.
 */
export function varianBelajar(tahapResmi: "sd" | "menengah" | null | undefined): Varian {
  return tahapResmi === "sd" ? "sd" : tahapResmi === "menengah" ? "menengah" : "netral";
}

/**
 * SENIORITY DOES NOT ACCUMULATE TOURS (§H-3).
 *
 * A Head of Department arriving at the Classes page does not get the educator
 * tour. Their page is not the educator's page — it omits the review work that
 * is most of their week — so the educator's seven steps would be a map of
 * somewhere else, drawn confidently. Until an HoD tour exists they get NO
 * automatic tour, which is the honest version of "we have not written your map
 * yet", and Help offers them nothing rather than somebody else's.
 */
const SENIOR = new Set(["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"]);

/** One role grant, as the tour needs to read it. */
export type HibahPeran = {
  role: string;
  valid_from: string | null;
  valid_until: string | null;
  revoked_at: string | null;
};

/**
 * The roles in force right now.
 *
 * DELIBERATELY NOT `hibahAktif` from the teaching-context module. That one also
 * drops a grant with no scope node, because a teaching context is a set of
 * subtrees and a grant pointing at no node contains no class. Here the question
 * is "what is this person", and an institution-wide grant with no node is
 * exactly the kind that must NOT be missed: dropping it would hand a school
 * administrator the educator tour.
 */
export function peranAktif(rows: readonly HibahPeran[], sekarang: Date): string[] {
  const t = sekarang.getTime();
  const out = new Set<string>();
  for (const r of rows) {
    if (r.revoked_at != null) continue;
    const dari = r.valid_from ? Date.parse(r.valid_from) : Number.NEGATIVE_INFINITY;
    const sampai = r.valid_until ? Date.parse(r.valid_until) : Number.POSITIVE_INFINITY;
    if (t >= dari && t < sampai) out.add(r.role);
  }
  return [...out];
}

/**
 * Whether the educator tour is this person's tour at all — for presenting it
 * and for offering it in Help, which is the same question (§F, §H-6).
 */
export function turPengajarBerlaku(peran: readonly string[]): boolean {
  if (!peran.includes("EDUCATOR")) return false;
  return !peran.some((p) => SENIOR.has(p));
}

// ══════════════════════════════════ where the card goes, as arithmetic (§J, §M)
//
// PURE, AND HERE RATHER THAN IN THE COMPONENT, because this is the part of the
// tour that cannot be read for correctness — it is four comparisons about two
// rectangles, and getting one of them slightly wrong puts the card on top of
// the thing the step is describing. A rendered measurement found exactly that,
// and a rule that can be got wrong that quietly belongs where a test can drive
// it through the geometry that broke it.

/** A measured rectangle, in viewport coordinates. */
export type Petak = { top: number; left: number; width: number; height: number };

/**
 * What the viewport offers.
 *
 * `atap` is the ceiling: Evaluation Mode's banner cannot be dismissed, because
 * its presence is a property of the session (ADR-0020), so the card keeps clear
 * of whatever sits above the Experience shell (§J-11). With nothing there it is
 * the ordinary gutter.
 */
export type Layar = { lebar: number; tinggi: number; atap: number; telepon: boolean };

/** The gutter the card and a scrolled-to target keep from the viewport edge. */
export const TEPI = 16;
/** The gap between a target and the card describing it. */
export const JARAK = 16;
/**
 * W3.15 (RV-19): THE ROOM BETWEEN A TARGET AND ITS RING. The ring was drawn on the target's own edge, so a tab or a
 * heading touched the white gap and the ring read as the target's border. It stands this far outside instead, the
 * focus ring's offset (InteractionStates) carried to the spotlight's scale: one 8 px step of the spacing scale.
 */
export const CELAH = 8;

/** The ring's box: the target's, grown by CELAH on every side. */
export function kotakCincin(r: Petak): Petak {
  return { top: r.top - CELAH, left: r.left - CELAH, width: r.width + 2 * CELAH, height: r.height + 2 * CELAH };
}

/**
 * THE BAND A TARGET MUST SIT IN — and the whole point is that it is NOT just
 * "on screen".
 *
 * A target can be perfectly visible and still leave no room to put the card
 * below it, and then the card has nowhere to go but over it. So the band
 * subtracts the card's own height on both layouts: on a phone the sheet is
 * docked at the bottom, so the gap is the gutter alone; on a wide screen the
 * card floats, so it also needs the gap it keeps from its target.
 *
 * This is §J-7 read as it is written — "the page scrolls just enough for the
 * target to sit above the sheet" — with the wide screen's card understood as
 * the sheet's equivalent, which it is.
 */
export function pitaSasaran(layar: Layar, tinggiKartu: number): { atas: number; bawah: number } {
  return {
    atas: layar.atap,
    bawah: layar.telepon
      ? layar.tinggi - tinggiKartu - TEPI
      : layar.tinggi - tinggiKartu - JARAK - TEPI,
  };
}

/**
 * THE ROOM THE PAGE LENDS THE TOUR AT ITS FOOT (§J-14).
 *
 * Scrolling a target up into the band only works if the page HAS that much
 * scroll left. A short page has none, and then a target sitting low is stuck
 * where it is with no room for the card below it — which is how the card ends
 * up over the thing it is describing on exactly the pages that are shortest.
 *
 * So the page gains bottom room equal to what the card takes: the sheet's own
 * height on a phone, where it is docked against the bottom edge, and that plus
 * the gap on a wide screen, where the card floats clear of its target. The room
 * is given back when the tour closes.
 *
 * The design names this for the phone. It is the same problem on a wide screen
 * and the same answer, and leaving it to the phone alone was the difference
 * between a card beside its target and a card on top of it.
 */
export function ruangBawah(tinggiKartu: number, telepon: boolean): number {
  if (tinggiKartu <= 0) return 0;
  return telepon ? tinggiKartu : tinggiKartu + JARAK;
}

/** How far the page must scroll for `sasaran` to sit inside the band. */
export function geserKe(sasaran: Petak, pita: { atas: number; bawah: number }): number {
  if (sasaran.top < pita.atas) return sasaran.top - pita.atas;
  if (sasaran.top + sasaran.height > pita.bawah) {
    return Math.min(sasaran.top - pita.atas, sasaran.top + sasaran.height - pita.bawah);
  }
  return 0;
}

/**
 * WHERE THE CARD GOES ON A WIDE SCREEN: below the target when it fits, above it
 * when that does not, beside it when neither does, and centred only when there
 * is no target at all.
 *
 * "Never over it" (§M) is the property, and the order above is what keeps it:
 * the beside case is what a target too tall for the space above or below makes,
 * and it is exactly where centring would put the card on top of its subject.
 */
export function tempatKartu(
  sasaran: Petak | null,
  kartu: { lebar: number; tinggi: number },
  layar: Layar,
): { top: number; left: number } {
  const tengah = {
    top: Math.max(layar.atap, (layar.tinggi - kartu.tinggi) / 2),
    left: Math.max(TEPI, (layar.lebar - kartu.lebar) / 2),
  };
  if (!sasaran) return tengah;

  const bawahnya = sasaran.top + sasaran.height + JARAK;
  const atasnya = sasaran.top - JARAK - kartu.tinggi;
  const muatBawah = bawahnya + kartu.tinggi <= layar.tinggi - TEPI;
  const muatAtas = atasnya >= layar.atap;
  if (muatBawah || muatAtas) {
    return {
      top: muatBawah ? bawahnya : atasnya,
      left: Math.min(
        Math.max(TEPI, sasaran.left),
        Math.max(TEPI, layar.lebar - kartu.lebar - TEPI),
      ),
    };
  }

  const kanan = sasaran.left + sasaran.width + JARAK;
  const kiri = sasaran.left - JARAK - kartu.lebar;
  const disamping =
    kanan + kartu.lebar <= layar.lebar - TEPI ? kanan : kiri >= TEPI ? kiri : null;
  return {
    top: Math.max(layar.atap, Math.min(sasaran.top, layar.tinggi - kartu.tinggi - TEPI)),
    left: disamping ?? tengah.left,
  };
}

/** Whether two rectangles touch at all. The card must never be over its target. */
export function bertumpuk(a: Petak, b: Petak): boolean {
  return !(
    a.top + a.height <= b.top ||
    a.top >= b.top + b.height ||
    a.left + a.width <= b.left ||
    a.left >= b.left + b.width
  );
}

/** The envelope `my_tour_state` returns, as this layer consumes it. */
export type Keadaan = {
  tour_key: string;
  tour_version: number;
  should_auto_present: boolean;
  auto_shown_count: number;
  auto_presentation_limit: number;
  completed: boolean;
  suppressed: boolean;
};

/** Why an eligible tour was not presented. Recorded so tests can name it. */
export type Tahan =
  | "tidak_berhak"      // the backend says no: finished, suppressed, or at the cap
  | "tautan_langsung"   // a deep-link arrival — it waits for a landing arrival
  | "uji_cepat_berjalan"; // a teacher's Quick Assessment window is open

/**
 * SHOULD THE TOUR OPEN BY ITSELF ON THIS ARRIVAL?
 *
 * The backend owns the durable half and this function never second-guesses it:
 * `should_auto_present` is taken as given, and the only thing added here is the
 * two Experience exclusions, both of which are about NOT INTERRUPTING WORK.
 * Neither consumes a presentation — an arrival that was held back has not been
 * spent, which is why this returns the reason rather than a bare false.
 */
export function bolehTampilOtomatis(
  keadaan: Keadaan | null,
  konteks: { tautanLangsung: boolean; ujiCepatBerjalan: boolean },
): { boleh: true } | { boleh: false; sebab: Tahan } {
  if (!keadaan || !keadaan.should_auto_present) return { boleh: false, sebab: "tidak_berhak" };
  if (konteks.tautanLangsung) return { boleh: false, sebab: "tautan_langsung" };
  if (konteks.ujiCepatBerjalan) return { boleh: false, sebab: "uji_cepat_berjalan" };
  return { boleh: true };
}

/**
 * WILL THIS TOUR OPEN BY ITSELF AGAIN?
 *
 * The tip shown after a tour closes says one of two things, and only one of
 * them can be true (§G-6). Getting it from "did they tick the box" alone is
 * not enough, because a REPLAY from Help can close with nothing ticked while
 * the person finished the tour last month, or spent their third automatic
 * presentation five minutes ago. Either would promise a return that is not
 * coming.
 *
 * So the question is asked of the durable state instead: three ways the tour
 * stops for good, and the cap.
 */
export function akanMunculLagi(
  keadaan: Keadaan | null,
  arus: { tampilOtomatis: number; dicentang: boolean; selesai: boolean },
): boolean {
  if (!keadaan) return false;
  if (keadaan.completed || keadaan.suppressed) return false;
  if (arus.dicentang || arus.selesai) return false;
  return keadaan.auto_shown_count + arus.tampilOtomatis < keadaan.auto_presentation_limit;
}

/**
 * The after-closing tip's wording (§G-6). A promise that the tour will come
 * back, or a statement that it will not — and the primary-school variant of
 * the first, which promises only that Help still has it. Saying the wrong one
 * is a small lie either way, so the input is the honest predicate above rather
 * than what the person just pressed.
 */
export function tipSetelahTutup(
  args: { akanMunculLagi: boolean; sd: boolean },
): HleEvent {
  if (!args.akanMunculLagi) return k("tur.tip.berhenti");
  return args.sd ? k("tur.tip.lagi.sd") : k("tur.tip.lagi");
}

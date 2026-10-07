/**
 * L3 · THE WORKING CONTEXT (CR-83; D-127 §1, Q1, Q2, Q11; D-132).
 *
 * «Identity tells PINTAR who the person is. Entitlement tells PINTAR what they may do. Working context tells PINTAR
 * what they are doing here, in this session, on this device. Working context may narrow presentation and action
 * choices; it must never widen authority.»
 *
 * The context is a PURPOSE and a PLACE, held on the session's own row (device_sessions; migration 20261210100000):
 * Belajar, with no place (C1); Mengajar in one school, from teaching appointments only (C2); Mengelola in one school,
 * a PINTAR library, or «Seluruh platform» (C7). The database writes it (konteks_tetapkan, the caller's own session,
 * a pair they hold), re-checks it on every read (konteks_saya) and clears it with the session's end. Nothing here,
 * and nothing in the database, grants anything from it: every act is still decided by RLS and the RPCs from the
 * person's grants (§2.11).
 *
 * PURE. The layouts, the chooser, `/mulai` and the tests read the same rules, with nothing else loaded. The design
 * these rules implement: docs/reports/PINTAR-4.0-L3-WORKING-CONTEXT-DESIGN-2026-10-07.md (ruled by D-132).
 */
import { KEMAMPUAN_STUDIO, tabStudio } from "@/lib/studio-tab";
import { tujuanInternal } from "@/lib/tujuan";

/** The request header the proxy writes: the path (and query) a request is for, so a layout can continue to it. */
export const HEADER_JALUR = "x-pintar-jalur";

export type Tujuan = "BELAJAR" | "MENGAJAR" | "MENGELOLA";
export const TUJUAN: readonly Tujuan[] = ["BELAJAR", "MENGAJAR", "MENGELOLA"];

/** One purpose · place pair the person holds (konteks_tempat_saya), with the grants that give it there. */
export type Pasangan = {
  tujuan: Tujuan;
  /** The school or library; null for Belajar and for «Seluruh platform». */
  tempat: string | null;
  /** Mengelola in «Seluruh platform» (C7). */
  platform: boolean;
  /** The place's name (data), or null. */
  nama: string | null;
  /** The place's tenant kind: INSTITUTION or PLATFORM_CANONICAL (a library), or null. */
  jenis: string | null;
  /** The roles that give this purpose in this place. */
  peran: string[];
  /** The capabilities those roles carry (the database's role_capabilities). Presentation only (C8). */
  kemampuan: string[];
};

/** This session's context as konteks_saya answers it. */
export type Konteks =
  | { keadaan: "TANPA" }
  | { keadaan: "BERAKHIR" }
  | { keadaan: "KOSONG" }
  | { keadaan: "TIDAK_BERLAKU"; tujuan: Tujuan | null }
  | ({ keadaan: "ADA"; sebab: string } & Pasangan);

const adalahTujuan = (x: unknown): x is Tujuan => typeof x === "string" && (TUJUAN as readonly string[]).includes(x);
const daftarTeks = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : []);
const teksAtauNull = (x: unknown): string | null => (typeof x === "string" && x !== "" ? x : null);

function bacaPasangan(o: Record<string, unknown>): Pasangan | null {
  if (!adalahTujuan(o.tujuan)) return null;
  const p: Pasangan = {
    tujuan: o.tujuan,
    tempat: teksAtauNull(o.tempat),
    platform: o.platform === true,
    nama: teksAtauNull(o.nama),
    jenis: teksAtauNull(o.jenis),
    peran: daftarTeks(o.peran),
    kemampuan: daftarTeks(o.kemampuan),
  };
  // the database's four shapes, and nothing else (device_sessions_konteks_bentuk)
  if (p.tujuan === "BELAJAR" && (p.tempat !== null || p.platform)) return null;
  if (p.tujuan === "MENGAJAR" && (p.tempat === null || p.platform)) return null;
  if (p.tujuan === "MENGELOLA" && (p.tempat === null) === !p.platform) return null;
  return p;
}

/** konteks_saya's answer; anything unreadable is null (the caller treats it as no context, never as one). */
export function bacaKonteks(data: unknown): Konteks | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  switch (o.keadaan) {
    case "TANPA":
    case "BERAKHIR":
    case "KOSONG":
      return { keadaan: o.keadaan };
    case "TIDAK_BERLAKU":
      return { keadaan: "TIDAK_BERLAKU", tujuan: adalahTujuan(o.tujuan) ? o.tujuan : null };
    case "ADA": {
      const p = bacaPasangan(o);
      return p ? { keadaan: "ADA", sebab: typeof o.sebab === "string" ? o.sebab : "", ...p } : null;
    }
    default:
      return null;
  }
}

/** konteks_tempat_saya's rows; an unreadable row is dropped, never guessed. */
export function bacaTempat(rows: unknown): Pasangan[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r) => {
    const p = r && typeof r === "object" ? bacaPasangan(r as Record<string, unknown>) : null;
    return p ? [p] : [];
  });
}

/** Belajar, the person's own learning: held by everyone (C1), offered on the chooser only with participation. */
export const BELAJAR: Pasangan = {
  tujuan: "BELAJAR", tempat: null, platform: false, nama: null, jenis: null, peran: [], kemampuan: [],
};

export function samaPasangan(a: Pick<Pasangan, "tujuan" | "tempat" | "platform">,
                             b: Pick<Pasangan, "tujuan" | "tempat" | "platform">): boolean {
  return a.tujuan === b.tujuan && a.tempat === b.tempat && a.platform === b.platform;
}

/** A pair as one form value: «BELAJAR», «MENGAJAR:<id>», «MENGELOLA:<id>», «MENGELOLA:PLATFORM». */
export function kunciPasangan(p: Pick<Pasangan, "tujuan" | "tempat" | "platform">): string {
  if (p.platform) return `${p.tujuan}:PLATFORM`;
  return p.tempat ? `${p.tujuan}:${p.tempat}` : p.tujuan;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The inverse of kunciPasangan, for a value posted back: a malformed one is null. */
export function bacaKunciPasangan(raw: unknown): Pick<Pasangan, "tujuan" | "tempat" | "platform"> | null {
  if (typeof raw !== "string") return null;
  const [t, rest, ...lebih] = raw.split(":");
  if (lebih.length || !adalahTujuan(t)) return null;
  if (rest === undefined) return t === "BELAJAR" ? { tujuan: t, tempat: null, platform: false } : null;
  if (rest === "PLATFORM") return t === "MENGELOLA" ? { tujuan: t, tempat: null, platform: true } : null;
  return t !== "BELAJAR" && UUID.test(rest) ? { tujuan: t, tempat: rest, platform: false } : null;
}

// ═══════════════════════════════════════════════════════════════ the doors (§2.2)
/** The three signed-out doors send a PURPOSE, never a role: `/masuk?pintu=belajar|mengajar|mengelola`. */
export const PINTU: Readonly<Record<string, Tujuan>> = { belajar: "BELAJAR", mengajar: "MENGAJAR", mengelola: "MENGELOLA" };

export function bacaPintu(raw: unknown): Tujuan | null {
  return typeof raw === "string" && Object.prototype.hasOwnProperty.call(PINTU, raw) ? PINTU[raw] : null;
}

export function namaPintu(t: Tujuan): string {
  return Object.keys(PINTU).find((k) => PINTU[k] === t)!;
}

// ═══════════════════════════════════════════════════════════════ the surfaces (§2.6)
/**
 * Which purpose each signed-in surface belongs to. Studio follows Mengajar or Mengelola. Every other signed-in
 * surface is NEUTRAL: it keeps the context and wears its shell (`/akun`, `/perangkat`, `/terkunci`, `/lapor`, ...).
 */
const SURFACE: ReadonlyArray<readonly [string, readonly Tujuan[]]> = [
  ["/belajar", ["BELAJAR"]],
  ["/mengajar", ["MENGAJAR"]],
  // a class's summary: the teacher's (Kelas) and their leaders' (Pimpinan, Konfigurasi), wherever the place is a school
  ["/edukator", ["MENGAJAR", "MENGELOLA"]],
  ["/pimpinan", ["MENGELOLA"]],
  ["/dekan", ["MENGELOLA"]],
  ["/konfigurasi", ["MENGELOLA"]],
  ["/pendataan", ["MENGELOLA"]],
  ["/aktivasi", ["MENGELOLA"]],
  ["/studio", ["MENGAJAR", "MENGELOLA"]],
];

/** The surface a path is on, or null for a neutral or public one. */
export function permukaan(jalur: string): string | null {
  const path = jalur.split(/[?#]/)[0];
  const hit = SURFACE.find(([awal]) => path === awal || path.startsWith(`${awal}/`));
  return hit ? hit[0] : null;
}

/** The purposes a path belongs to; null when it is neutral. */
export function tujuanJalur(jalur: string): readonly Tujuan[] | null {
  const s = permukaan(jalur);
  return s ? SURFACE.find(([awal]) => awal === s)![1] : null;
}

const ADMIN = ["INSTITUTION_ADMIN", "SYSTEM_ADMIN"];
const PIMPINAN = ["HEAD_OF_DEPARTMENT", "DEAN"];
const pustaka = (p: Pasangan) => p.jenis === "PLATFORM_CANONICAL";

/**
 * Does this pair serve this surface? Its purpose is one the surface belongs to, and its grants there reach the
 * surface: Kelas needs a school (a library has no classes); Pimpinan, Kepala departemen or Dekan; Konfigurasi, Admin
 * sekolah or Admin platform (or «Seluruh platform»); Pendataan and Aktivasi, the people capability (or the platform);
 * Studio, a place and at least one Studio tab. A neutral surface is served by every pair.
 */
export function melayani(p: Pasangan, jalur: string): boolean {
  const s = permukaan(jalur);
  if (s === null) return true;
  if (!tujuanJalur(jalur)!.includes(p.tujuan)) return false;
  switch (s) {
    case "/belajar":
      return true;
    case "/mengajar":
      return p.tujuan === "MENGAJAR" && p.tempat !== null && !pustaka(p);
    case "/edukator":
      return p.tempat !== null && !pustaka(p);
    case "/pimpinan":
    case "/dekan":
      return p.tempat !== null && !pustaka(p) && p.peran.some((r) => PIMPINAN.includes(r));
    case "/konfigurasi":
      return p.platform || (!pustaka(p) && p.peran.some((r) => ADMIN.includes(r)));
    case "/pendataan":
      return p.tempat !== null && !pustaka(p) && p.kemampuan.includes("CAN_PROVISION_PEOPLE");
    case "/aktivasi":
      return p.platform || (p.tempat !== null && !pustaka(p) && p.kemampuan.includes("CAN_PROVISION_PEOPLE"));
    case "/studio":
      // Studio's own capabilities only: any other (a dean's roster) gives no Studio tab, as Studio refuses it (D-021)
      return p.tempat !== null
        && tabStudio(new Set(p.kemampuan.filter((k) => (KEMAMPUAN_STUDIO as readonly string[]).includes(k))), p.peran).length > 0;
    default:
      return false;
  }
}

/**
 * Where each pair lands (D-010 kept for where a purpose · place lands, never to choose among several, D-132(i)).
 */
export function berandaPasangan(p: Pasangan): string {
  if (p.tujuan === "BELAJAR") return "/belajar";
  if (p.platform) return "/konfigurasi";
  if (pustaka(p)) return "/studio";
  if (p.tujuan === "MENGAJAR") return "/mengajar";
  return p.peran.some((r) => ADMIN.includes(r)) ? "/konfigurasi" : "/pimpinan";
}

// ═══════════════════════════════════════════════════════════════ the chooser (`/`, §2.3–2.5)
/** What the chooser is asked to show: one purpose's places, one exact place, why, and where to continue. */
export type Permintaan = {
  untuk: Tujuan | null;
  tempat: string | null;
  platform: boolean;
  alasan: "tidak_dipegang" | "tidak_berlaku" | "lain" | null;
  lanjut: string;
};

const ALASAN = ["tidak_dipegang", "tidak_berlaku", "lain"] as const;

export function bacaPermintaan(sp: Record<string, string | string[] | undefined>): Permintaan {
  const satu = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined));
  const tempat = satu("tempat");
  const alasan = satu("alasan");
  return {
    untuk: adalahTujuan(satu("untuk")) ? (satu("untuk") as Tujuan) : null,
    tempat: tempat && UUID.test(tempat) ? tempat : null,
    platform: satu("tempat") === "PLATFORM",
    alasan: (ALASAN as readonly string[]).includes(alasan ?? "") ? (alasan as Permintaan["alasan"]) : null,
    lanjut: tujuanInternal(satu("lanjut"), ""),
  };
}

/** The chooser's address for a request (the inverse of bacaPermintaan). */
export function alamatPilih(p: Partial<Permintaan>): string {
  const q = new URLSearchParams();
  if (p.untuk) q.set("untuk", p.untuk);
  if (p.platform) q.set("tempat", "PLATFORM");
  else if (p.tempat) q.set("tempat", p.tempat);
  if (p.alasan) q.set("alasan", p.alasan);
  if (p.lanjut) q.set("lanjut", p.lanjut);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

/**
 * The doors the chooser offers: every pair the person holds, narrowed to the purpose (and place) asked for when
 * one is, and to the pairs that serve the page to continue to when there is one. When nothing fits the narrowing,
 * every pair held is offered rather than none: the chooser never strands anybody.
 */
export function pintuPilihan(tempat: readonly Pasangan[], p: Pick<Permintaan, "untuk" | "tempat" | "platform" | "lanjut">): Pasangan[] {
  let pilihan = tempat.filter((x) => !p.untuk || x.tujuan === p.untuk);
  if (p.platform) pilihan = pilihan.filter((x) => x.platform);
  else if (p.tempat) pilihan = pilihan.filter((x) => x.tempat === p.tempat);
  if (p.lanjut) pilihan = pilihan.filter((x) => melayani(x, p.lanjut));
  return pilihan.length > 0 ? pilihan : [...tempat];
}

// ═══════════════════════════════════════════════════════════════ arriving (`/mulai`: C4, C5, C9)
export type Penetapan = { tujuan: Tujuan; tempat: string | null; platform: boolean; sebab: "PINTU" | "HALAMAN" };
export type Rencana = { tetapkan: Penetapan | null; ke: string };

const tetapkan = (p: Pasangan, sebab: Penetapan["sebab"]): Penetapan =>
  ({ tujuan: p.tujuan, tempat: p.tempat, platform: p.platform, sebab });

/**
 * Where a person who has just signed in goes, and what context their session takes. The session has none yet.
 *
 *   tanda    a session ended on this browser since the last sign-in (the sign-out mark): any carried destination
 *            is ignored. A 4.0 stale-continuation guard, not part of the context (D-132(e))
 *   pintu    the door chosen: its purpose, never a role. One place for it: set; several: the chooser asks
 *            where; none: the chooser says so and offers what is held (§2.3)
 *   lanjut   a page asked for (no door): sets the context only when exactly one held pair serves it (C4)
 *   neither  one pair held: set (C9); several: the chooser. D-010's ranking never chooses (D-132(i))
 */
export function rencanaMasuk(a: { pintu: Tujuan | null; lanjut: string; tanda: boolean; tempat: readonly Pasangan[] }): Rencana {
  const lanjut = a.tanda ? "" : tujuanInternal(a.lanjut, "");
  const ke = (p: Pasangan) => (lanjut && melayani(p, lanjut) ? lanjut : berandaPasangan(p));

  if (a.pintu === "BELAJAR") return { tetapkan: tetapkan(BELAJAR, "PINTU"), ke: ke(BELAJAR) };
  if (a.pintu) {
    const calon = a.tempat.filter((p) => p.tujuan === a.pintu);
    if (calon.length === 1) return { tetapkan: tetapkan(calon[0], "PINTU"), ke: ke(calon[0]) };
    if (calon.length === 0) return { tetapkan: null, ke: alamatPilih({ untuk: a.pintu, alasan: "tidak_dipegang" }) };
    return { tetapkan: null, ke: alamatPilih({ untuk: a.pintu, lanjut }) };
  }

  if (lanjut && tujuanJalur(lanjut)) {
    const belajar = tujuanJalur(lanjut)!.includes("BELAJAR") ? [BELAJAR] : [];
    const calon = [...belajar, ...a.tempat.filter((p) => p.tujuan !== "BELAJAR" && melayani(p, lanjut))];
    if (calon.length === 1) return { tetapkan: tetapkan(calon[0], "HALAMAN"), ke: lanjut };
    if (calon.length > 1) return { tetapkan: null, ke: alamatPilih({ lanjut }) };
    // nobody's page to continue to: arriving as if none were asked for
    return rencanaMasuk({ ...a, lanjut: "" });
  }

  if (a.tempat.length === 1) return { tetapkan: tetapkan(a.tempat[0], "PINTU"), ke: ke(a.tempat[0]) };
  if (a.tempat.length === 0) return { tetapkan: null, ke: lanjut || "/" };
  return { tetapkan: null, ke: alamatPilih({ lanjut }) };
}

/**
 * A page asked for while the session holds no context (C4): set it only when exactly one held pair serves the page;
 * otherwise the chooser, continuing here once the person has chosen.
 */
export function rencanaHalaman(jalur: string, tempat: readonly Pasangan[]): Rencana {
  const belajar = (tujuanJalur(jalur) ?? []).includes("BELAJAR") ? [BELAJAR] : [];
  const calon = [...belajar, ...tempat.filter((p) => p.tujuan !== "BELAJAR" && melayani(p, jalur))];
  if (calon.length === 1) return { tetapkan: tetapkan(calon[0], "HALAMAN"), ke: jalur };
  return { tetapkan: null, ke: alamatPilih({ lanjut: jalur }) };
}

// ═══════════════════════════════════════════════════════════════ the shell (§2.4, §2.6)
/** The surfaces a context's shell offers as tabs: this purpose's, in this place, by these grants. */
export function permukaanKonteks(p: Pasangan): string[] {
  const kandidat = ["/belajar", "/mengajar", "/pimpinan", "/konfigurasi", "/pendataan", "/aktivasi", "/studio"];
  return kandidat.filter((s) => melayani(p, s));
}

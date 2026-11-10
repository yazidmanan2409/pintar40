/**
 * W3.3 · ONE DATE HELPER (Batch 2; RV-16; Daisy, components/Dates and components/DateTime, accepted 5 Oct).
 *
 * Every date a person reads is written here, in one grammar: day, month, year, in both languages; the month in words
 * («Okt», no full stop) wherever a misreading would matter; the year always; time 24-hour with a full stop and always
 * its zone's word. «09/10/2026» only in a narrow column of dates.
 *
 * THE ZONE (the owner's ruling, 10 Nov): a named school's date is written on that school's clock, the caller passing
 * institutions.zona_waktu (WIB, WITA or WIT); a platform-wide or personal moment tied to no school passes none and is
 * written in WIB, the word printed so the convention is explicit. The forms below show WIB.
 *
 *   baca     d MMM yyyy                    9 Okt 2026                    any date a person reads (the default)
 *   hari     EEEE, d MMM yyyy              Jumat, 9 Okt 2026             a date someone acts on; the line under a field
 *   hariJam  EEEE, d MMM yyyy, HH.mm WIB   Jumat, 9 Okt 2026, 07.30 WIB  a time someone acts on
 *   cap      d MMM yyyy, HH.mm WIB         9 Okt 2026, 07.30 WIB         a record of when something happened
 *   ringkas  dd/mm/yyyy                    09/10/2026                    a narrow column of dates only
 *   resmi    d MMMM yyyy                   9 Oktober 2026                emails and printed letters
 *   resmiJam d MMMM yyyy pukul HH.mm WIB   9 Oktober 2026 pukul 07.30 WIB  an email's moment, as the emails already write
 *                                                                        it (Daisy's audit, 10-dates.md: «fine»)
 *
 * English keeps the order with English names as `en-ID` writes them: «Friday, 9 Oct 2026, 07.30 WIB».
 *
 * PURE, the same on the server and in the browser. Jakarta has no daylight saving, so its parts are the instant moved by
 * seven hours and read in UTC: no `Intl` locale data, no dependence on the server's or the device's zone. A field's
 * value (yyyy-mm-dd, or yyyy-mm-ddThh:mm from datetime-local) is a day or a wall-clock time on the school's clock
 * already, and is read as written, never shifted.
 */

export type BentukTanggal = "baca" | "hari" | "hariJam" | "cap" | "ringkas" | "resmi" | "resmiJam";
export type BahasaTanggal = "id" | "en";

const BULAN: Record<BahasaTanggal, readonly string[]> = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"],
};
const BULAN_PANJANG: Record<BahasaTanggal, readonly string[]> = {
  id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
/** Indexed as getUTCDay(): Sunday first. */
const HARI: Record<BahasaTanggal, readonly string[]> = {
  id: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
/** «pukul» in the formal form with its time (resmiJam). */
const PUKUL: Record<BahasaTanggal, string> = { id: "pukul", en: "at" };
/** WIB is UTC+7 all year (no daylight saving). */
const WIB_MS = 7 * 60 * 60 * 1000;
/**
 * Daisy (435a2856, §1.1 and §4.3): a record of when something happened at a school is written on that school's clock
 * when the caller knows the school (institutions.zona_waktu, read by zonaSekolah). Indonesia's three zones keep no
 * daylight saving, so each is a fixed offset and its own word. A caller with no school keeps WIB, as before.
 */
const ZONA_JAM: Record<string, { ms: number; kata: string }> = {
  "Asia/Jakarta": { ms: WIB_MS, kata: "WIB" },
  "Asia/Makassar": { ms: 8 * 60 * 60 * 1000, kata: "WITA" },
  "Asia/Jayapura": { ms: 9 * 60 * 60 * 1000, kata: "WIT" },
};

/** The zone's offset from UTC in milliseconds: WIB (+7) for no zone or one PINTAR does not keep. */
export function geserZona(zona?: string | null): number {
  return (ZONA_JAM[zona ?? ""] ?? ZONA_JAM["Asia/Jakarta"]).ms;
}

/** The zone's word, «WIB», «WITA» or «WIT» (the same in both languages): WIB for no zone or one PINTAR does not keep. */
export function kataZona(zona?: string | null): string {
  return (ZONA_JAM[zona ?? ""] ?? ZONA_JAM["Asia/Jakarta"]).kata;
}

/** A day (and, when there is one, a time) on Jakarta's clock. */
export type BagianJakarta = {
  tahun: number;
  /** 1–12 */
  bulan: number;
  hari: number;
  /** 0 = Sunday … 6 = Saturday */
  hariPekan: number;
  /** null for a date-only value */
  jam: number | null;
  menit: number | null;
};

const HANYA_HARI = /^(\d{4})-(\d{2})-(\d{2})$/;
const JAM_LOKAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

function hariNyata(t: number, b: number, h: number): Date | null {
  const d = new Date(Date.UTC(t, b - 1, h));
  return d.getUTCFullYear() === t && d.getUTCMonth() === b - 1 && d.getUTCDate() === h ? d : null;
}

/**
 * The value's parts on Jakarta's clock, or null for nothing or a value that is not a moment.
 * - a Date, or an ISO string with its zone: an instant, read in Jakarta;
 * - yyyy-mm-dd: that day, as written (no time);
 * - yyyy-mm-ddThh:mm (datetime-local, no zone): that wall-clock time in Jakarta, as written.
 */
export function bagianJakarta(nilai: string | Date | null | undefined, geserMs: number = WIB_MS): BagianJakarta | null {
  if (nilai == null) return null;
  if (typeof nilai === "string") {
    const s = nilai.trim();
    const m = HANYA_HARI.exec(s);
    if (m) {
      const d = hariNyata(+m[1], +m[2], +m[3]);
      return d ? { tahun: +m[1], bulan: +m[2], hari: +m[3], hariPekan: d.getUTCDay(), jam: null, menit: null } : null;
    }
    const j = JAM_LOKAL.exec(s);
    if (j) {
      const d = hariNyata(+j[1], +j[2], +j[3]);
      if (!d || +j[4] > 23 || +j[5] > 59) return null;
      return { tahun: +j[1], bulan: +j[2], hari: +j[3], hariPekan: d.getUTCDay(), jam: +j[4], menit: +j[5] };
    }
    if (!s) return null;
  }
  const waktu = typeof nilai === "string" ? Date.parse(nilai) : nilai.getTime();
  if (!Number.isFinite(waktu)) return null;
  const w = new Date(waktu + geserMs);
  return {
    tahun: w.getUTCFullYear(), bulan: w.getUTCMonth() + 1, hari: w.getUTCDate(), hariPekan: w.getUTCDay(),
    jam: w.getUTCHours(), menit: w.getUTCMinutes(),
  };
}

const dua = (n: number) => String(n).padStart(2, "0");

/**
 * The time of day on Jakarta's clock, or on the given school's zone, «07.30» (the zone word is the caller's, kataZona);
 * "" when there is no time.
 */
export function jam(nilai: string | Date | null | undefined, zona?: string | null): string {
  const p = bagianJakarta(nilai, geserZona(zona));
  return p && p.jam !== null ? `${dua(p.jam)}.${dua(p.menit ?? 0)}` : "";
}

/**
 * A date in words, in one of the forms above; "" for nothing or a value that is not a moment (the caller says what an
 * empty place shows). A form with a time given a date-only value writes the date without one.
 */
export function tanggal(nilai: string | Date | null | undefined, bentuk: BentukTanggal = "baca", locale: BahasaTanggal = "id",
                        zona?: string | null): string {
  const z = { ms: geserZona(zona), kata: kataZona(zona) };
  const p = bagianJakarta(nilai, z.ms);
  if (!p) return "";
  const bhs: BahasaTanggal = locale === "en" ? "en" : "id";
  const baca = `${p.hari} ${BULAN[bhs][p.bulan - 1]} ${p.tahun}`;
  const resmi = `${p.hari} ${BULAN_PANJANG[bhs][p.bulan - 1]} ${p.tahun}`;
  const denganHari = `${HARI[bhs][p.hariPekan]}, ${baca}`;
  const pukul = p.jam !== null ? `${dua(p.jam)}.${dua(p.menit ?? 0)} ${z.kata}` : "";
  switch (bentuk) {
    case "hari": return denganHari;
    case "hariJam": return pukul ? `${denganHari}, ${pukul}` : denganHari;
    case "cap": return pukul ? `${baca}, ${pukul}` : baca;
    case "ringkas": return `${dua(p.hari)}/${dua(p.bulan)}/${p.tahun}`;
    case "resmi": return resmi;
    case "resmiJam": return pukul ? `${resmi} ${PUKUL[bhs]} ${pukul}` : resmi;
    default: return baca;
  }
}

/**
 * THE ECHO under a native date field (Daisy, components/DateTime): the field's value (yyyy-mm-dd, or
 * yyyy-mm-ddThh:mm) in words with the day, «Jumat, 9 Okt 2026» or «Jumat, 9 Okt 2026, 07.30 WIB»; "" when the field
 * is empty or holds no real day. Built from the value, never from what the field displays. A time is read on the clock
 * of the school the form is for, so its word is that zone's (WIB when none); the value itself is never shifted.
 */
export function gemaTanggal(nilai: string | null | undefined, locale: BahasaTanggal = "id", zona?: string | null): string {
  const s = String(nilai ?? "").trim();
  if (!HANYA_HARI.test(s) && !JAM_LOKAL.test(s)) return "";
  return tanggal(s, "hariJam", locale, zona);
}

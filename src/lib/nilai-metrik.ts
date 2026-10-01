/**
 * W9 — ONE FIGURE, ONE READING, ON EVERY SCREEN.
 *
 * «Lihat bukti» shows a class's net gain as «+35 poin»; /pimpinan showed the
 * same figure as «35%», because it guessed a unit from the value (a fraction
 * between 0 and 1 became a percentage). The guess also printed a perfect
 * comprehension as «1» and a negative gain as a raw decimal (journey
 * cross-check W9; HOD-J03, HOD-J09). A figure is now read by what it is:
 *
 *   persen  a share of the class, 0–100%      comprehension, safety-gate pass rate
 *   poin    a change in percentage points     net gain (signed, as «Lihat bukti»)
 *   jumlah  a count                           participants, verified credentials
 *
 * A metric not named here keeps the old reading, so nothing that rendered
 * before renders differently. Inside a structured figure (J7.3, J7.4) each
 * value is read the same way: a topic's mastery is a share, a readiness tier
 * holds a count (`nilaiIsi`); `NilaiLaporan` draws the rows.
 */
import { format, t, type Locale } from "@/lib/hle";

export type JenisAngka = "persen" | "poin" | "jumlah";

const JENIS: Record<string, JenisAngka> = {
  comprehension: "persen",
  safety_gate_pass_rate: "persen",
  net_gain: "poin",
  participants: "jumlah",
  verified_credentials: "jumlah",
};

/** What a catalogue metric is, read from its name after the scope («class.», «institution.»). */
export function jenisAngka(metricId: string | null | undefined): JenisAngka | null {
  const nama = (metricId ?? "").split(".").slice(1).join(".");
  return JENIS[nama] ?? null;
}

/** A figure as a human reads it, the same on «Lihat bukti», /pimpinan and its class pages. */
export function nilaiMetrik(metricId: string | null | undefined, value: unknown, locale: Locale): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    switch (jenisAngka(metricId)) {
      case "persen":
        return format.percent(value, locale);
      case "poin": {
        const poin = Math.round(value * 100);
        return `${poin > 0 ? "+" : ""}${format.number(poin, locale)} ${t("mengajar.bukti.poin", "educator", { locale })}`;
      }
      case "jumlah":
        return format.number(value, locale);
      default:
        return value > 0 && value <= 1 && !Number.isInteger(value)
          ? format.percent(value, locale)
          : format.number(value, locale);
    }
  }
  if (Array.isArray(value)) return format.number(value.length, locale);
  if (value !== null && typeof value === "object") {
    return format.number(Object.keys(value as Record<string, unknown>).length, locale);
  }
  return "—";
}

/** What each value INSIDE a structured figure is: the share per topic, the count per readiness tier. */
const JENIS_ISI: Record<string, JenisAngka> = {
  topic_mastery: "persen",
  readiness_distribution: "jumlah",
};

/** One value inside a structured figure, read by what the figure is; a count when the figure is not named. */
export function nilaiIsi(metricId: string | null | undefined, value: unknown, locale: Locale): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const nama = (metricId ?? "").split(".").slice(1).join(".");
  return JENIS_ISI[nama] === "persen" ? format.percent(value, locale) : format.number(value, locale);
}

/** A figure with rows rather than one number: a distribution or a list. */
export function berstruktur(value: unknown): boolean {
  return value !== null && typeof value === "object";
}

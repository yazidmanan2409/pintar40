import type { HleEvent } from "@/lib/hle";

/**
 * W1.3 (Batch 3; RV-14, DG-28/29 residue): AN ASSESSMENT RULE'S LIMITS, IN WORDS. Pure: Aturan Asesmen draws its limits
 * line and each field's hint through these, and STUDIO3B-ATURAN-01 executes them.
 *
 * Every number comes from `assessment_definition_bounds` (the page reads it; nothing here holds a bound). A time is
 * said in minutes where it is whole minutes, in minutes and seconds where it is not, and in seconds under a minute: the
 * send grace's 900 is «15 menit», never «900 detik». A range is «antara 3 dan 60», never «3–60».
 */

export type Kata = (event: HleEvent) => string;

/** One mode's bounds, as assessment_definition_bounds holds them. */
export type BatasMode = {
  mode: string;
  item_count_min: number; item_count_max: number;
  hesitation_window_min: number | null; hesitation_window_max: number | null;
  late_sync_grace_max: number; attempt_limit_max: number | null;
};

/** «15 menit», «1 menit 30 detik», «45 detik». */
export function lamaDalamKata(detik: number, s: Kata): string {
  const n = Math.max(0, Math.round(detik));
  const menit = Math.floor(n / 60), sisa = n % 60;
  if (menit === 0) return `${sisa} ${s("studio.definisi.unit.detik")}`;
  return sisa === 0
    ? `${menit} ${s("studio.definisi.unit.menit")}`
    : `${menit} ${s("studio.definisi.unit.menit")} ${sisa} ${s("studio.definisi.unit.detik")}`;
}

/** «antara 3 dan 60». */
export function antara(min: number | string, max: number | string, s: Kata): string {
  return `${s("studio.definisi.kata.antara")} ${min} ${s("studio.definisi.kata.dan")} ${max}`;
}

/**
 * One limit across the modes a form offers: said once when every mode has the same, else per mode, each named in
 * its own words («Pemetaan Awal: …; Uji Penguasaan: …»). Null when no mode has the limit.
 */
export function perMode(batas: readonly BatasMode[], nilai: (b: BatasMode) => string | null, namaMode: (mode: string) => string): string | null {
  const ada = batas.map((b) => [b.mode, nilai(b)] as const).filter((x): x is readonly [string, string] => x[1] !== null);
  if (ada.length === 0) return null;
  if (ada.length === batas.length && ada.every(([, v]) => v === ada[0][1])) return ada[0][1];
  return ada.map(([m, v]) => `${namaMode(m)}: ${v}`).join("; ");
}

/** The limits line for one mode: its questions, its send grace and its attempts, in words. */
export function batasDalamKata(b: BatasMode, s: Kata): string {
  const bagian = [
    `${antara(b.item_count_min, b.item_count_max, s)} ${s("studio.definisi.unit.soal")}`,
    `${s("studio.definisi.unit.tenggang")} ${lamaDalamKata(b.late_sync_grace_max, s)}`,
  ];
  if (b.attempt_limit_max) bagian.push(`${s("studio.definisi.unit.percobaan")} ${b.attempt_limit_max}`);
  return bagian.join(" · ");
}

/** Each numeric field's hint: what it is for, then its limit in words (or nothing, where the bounds set none). */
export function petunjukAturan(batas: readonly BatasMode[], s: Kata, namaMode: (mode: string) => string) {
  const kalimat = (awal: HleEvent, batasan: string | null) => (batasan ? `${s(awal)} ${batasan}.` : null);
  return {
    jumlah: kalimat("studio.definisi.petunjuk.jumlah",
      perMode(batas, (b) => `${antara(b.item_count_min, b.item_count_max, s)} ${s("studio.definisi.unit.soal")}`, namaMode)),
    keselamatan: s("studio.definisi.petunjuk.keselamatan"),
    ragu: kalimat("studio.definisi.petunjuk.ragu",
      perMode(batas, (b) => (b.hesitation_window_min !== null && b.hesitation_window_max !== null
        ? `${antara(b.hesitation_window_min, b.hesitation_window_max, s)} ${s("studio.definisi.unit.detik")}` : null), namaMode)),
    tenggang: kalimat("studio.definisi.petunjuk.tenggang", perMode(batas, (b) => lamaDalamKata(b.late_sync_grace_max, s), namaMode)),
    percobaan: kalimat("studio.definisi.petunjuk.percobaan",
      perMode(batas, (b) => (b.attempt_limit_max ? String(b.attempt_limit_max) : null), namaMode)),
    komposisi: s("studio.definisi.petunjuk.komposisi"),
  };
}

/**
 * The send grace a form sent, in seconds: minutes (`tenggang_menit`, the field Aturan Asesmen draws) to whole seconds;
 * a hand-made post's seconds (`tenggang`) as before; nothing when neither is given.
 */
export function tenggangDetik(menit: number | null, detik: number | null): number | null {
  if (menit !== null) return Number.isFinite(menit) ? Math.round(menit * 60) : menit;
  return detik;
}

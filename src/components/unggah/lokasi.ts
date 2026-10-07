import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { KOLOM, LEMBAR, LEMBAR_BOLEH, type MasalahPaket } from "@/lib/unggah-kontrak";

/**
 * WHERE A PACKAGE PROBLEM IS (DAISY-06): "Lembar Soal, baris 4, kolom
 * Pertanyaan" for a workbook, with the column's own header from KOLOM, or the
 * file a media problem names. Pure and free of React and Next, so the guard
 * can read exactly what the panel shows.
 */
export function lokasiMasalah(p: MasalahPaket, locale: Locale): string {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const bagian: string[] = [];
  if (p.sheet) bagian.push(`${s("studio.unggah.lokasi.lembar")} ${p.sheet}`);
  if (p.row) bagian.push(`${s("studio.unggah.lokasi.baris")} ${format.number(p.row, locale)}`);
  if (p.field) {
    const lembar = [...LEMBAR, ...LEMBAR_BOLEH].find((l) => l === p.sheet);
    const judul = lembar ? KOLOM[lembar].find((k) => k.kunci === p.field)?.judul : undefined;
    bagian.push(`${s("studio.unggah.lokasi.kolom")} ${judul ?? p.field}`);
  }
  if (p.file) bagian.push(`${s("studio.unggah.lokasi.berkas")} ${p.file}`);
  if (!p.sheet && p.path) bagian.push(p.path);
  return bagian.join(", ");
}

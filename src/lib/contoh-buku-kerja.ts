import { bacaBukuKerja } from "@/lib/xlsx";
import { tulisBukuKerja } from "@/components/unggah/templat";

/**
 * L4 (CR-88; D-127 Q9): A SEPARATE, CLEARLY MARKED EXAMPLE WORKBOOK. It is PINTAR's own SD 5 Matematika Bab 1
 * workbook (docs/onboarding/konten/SD5-Matematika-Bab1.xlsx), unchanged except that the course title begins with
 * «Contoh», the copy table's own word (tur.contoh). It is a download beside the blank template, never rows inside it,
 * and the importer has no special case for it: a teacher who imports it on purpose gets an ordinary draft in their
 * school's Studio, seen by no learner until the normal publish steps (Q9).
 *
 * Built from the source by `npm run contoh:buku-kerja` into public/contoh/; the test L4-C01 builds it again, checks the
 * file served is that build, byte for byte, and that the importer's own reader and converter accept it.
 */
export const BERKAS_CONTOH = "contoh-buku-kerja-pintar.xlsx";
export const SUMBER_CONTOH = "docs/onboarding/konten/SD5-Matematika-Bab1.xlsx";
export const TANDA_CONTOH = "Contoh — ";

export function bukuKerjaContoh(sumber: Uint8Array): Uint8Array {
  const h = bacaBukuKerja(sumber);
  if (!h.ok) throw new Error(`the example's source is unreadable: ${h.code}`);
  const lembar = h.lembar.map((l) => ({
    nama: l.nama,
    baris: l.nama === "Kursus"
      ? l.baris.map((b, i) => (i === 1 ? [b[0].startsWith(TANDA_CONTOH) ? b[0] : TANDA_CONTOH + b[0], ...b.slice(1)] : b))
      : l.baris,
    bekukanJudul: true,
  }));
  return tulisBukuKerja(lembar);
}

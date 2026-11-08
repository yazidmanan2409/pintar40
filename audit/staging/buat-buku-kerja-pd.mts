// STAGING ONLY. The professional-learning workbook a school uploads on staging (golden-school-pd.mjs, D9–D12): the
// synthetic chapter SD5-Sintetis-Bab1.xlsx (F-4; 0 items from real content), its «Kursus» row restated as a
// professional-learning package («Konteks: Pengembangan profesi», D-069/D-070) and marked [UJI INTERNAL]. Every other
// sheet is the synthetic chapter's, unchanged, so the workbook passes the same checks the academic one does.
//
// Run: npx tsx audit/staging/buat-buku-kerja-pd.mts  →  audit/staging/fixtures/PD-Sintetis-Bab1.xlsx
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bacaBukuKerja } from "../../src/lib/xlsx";
import { bukuKerjaKePaket } from "../../src/lib/unggah-kontrak";
import { tulisBukuKerja } from "../../src/components/unggah/templat";

export const JUDUL_PD = "[UJI INTERNAL] Pengembangan Profesi · Bab 1: Mengajarkan Pola Bilangan";
const akar = join(import.meta.dirname, "..", "..");
const asal = bacaBukuKerja(new Uint8Array(readFileSync(join(akar, "docs/onboarding/konten-sintetis/SD5-Sintetis-Bab1.xlsx"))));
if (!asal.ok) throw new Error(`the synthetic chapter does not read: ${asal.code}`);
const lembar = asal.lembar.map((l) => {
  if (l.nama !== "Kursus") return { ...l, bekukanJudul: true };
  const [kepala, ...data] = l.baris;
  if (data.length !== 1) throw new Error("the synthetic chapter's Kursus sheet is not one course");
  const kolom = (nama: string) => { const i = kepala.findIndex((h) => h.trim().startsWith(nama)); if (i < 0) throw new Error(`no «${nama}» column`); return i; };
  const baris = [...data[0]];
  baris[kolom("Judul")] = JUDUL_PD;
  baris[kolom("Mata pelajaran")] = "Pengembangan Profesi";
  baris[kolom("Jenjang")] = "Guru";
  baris[kolom("Kelas")] = "Semua jenjang";
  baris[kolom("Konteks")] = "Pengembangan profesi";
  return { ...l, baris: [kepala, baris], bekukanJudul: true };
});
const xlsx = tulisBukuKerja(lembar);
const baca = bacaBukuKerja(xlsx);
if (!baca.ok) throw new Error(`the written workbook does not read back: ${baca.code}`);
const hasil = bukuKerjaKePaket(baca.lembar);
if (!hasil.ok) throw new Error(JSON.stringify(hasil.problems));
const k = (hasil.paket as { courses: Array<{ title: string; konteks?: string }> }).courses[0];
if (k.title !== JUDUL_PD || k.konteks !== "Pengembangan profesi") throw new Error(`the package reads ${JSON.stringify({ title: k.title, konteks: k.konteks })}`);
writeFileSync(join(akar, "audit/staging/fixtures/PD-Sintetis-Bab1.xlsx"), xlsx);
console.log(`audit/staging/fixtures/PD-Sintetis-Bab1.xlsx: «${k.title}», konteks «${k.konteks}»`);

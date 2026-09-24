// Workbook (.xlsx) → lesson package JSON, with the app's own reader and converter
// (bacaBukuKerja, bukuKerjaKePaket), so the package is exactly what the upload page
// would build from the same file. Stops on the first problem, naming it.
//
// Run: npx tsx docs/onboarding/konten/ke-paket.ts <workbook.xlsx> <package.json>
import { readFileSync, writeFileSync } from "node:fs";
import { bacaBukuKerja } from "../../../src/lib/xlsx";
import { bukuKerjaKePaket } from "../../../src/lib/unggah-kontrak";

const [masuk, keluar] = process.argv.slice(2);
if (!masuk || !keluar) {
  console.error("usage: ke-paket.ts <workbook.xlsx> <package.json>");
  process.exit(2);
}
const baca = bacaBukuKerja(new Uint8Array(readFileSync(masuk)));
if (!baca.ok) {
  console.error(`the workbook cannot be read: ${baca.code}`);
  process.exit(1);
}
const hasil = bukuKerjaKePaket(baca.lembar);
if (!hasil.ok) {
  console.error(JSON.stringify(hasil.problems, null, 1));
  process.exit(1);
}
writeFileSync(keluar, JSON.stringify(hasil.paket, null, 1) + "\n");
console.log(`${keluar}: media ${hasil.media.length ? hasil.media.join(", ") : "none"}`);

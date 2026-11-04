// D1 step 2 (05-D1 test plan §4): writes the eight identity-email specimens, from the real templates through the real
// frame (the same list selftest/d1.test.ts reads), as <kode>.html and <kode>.txt into the directory given, for the
// rendered walk (audit/d1-email.mjs). Synthetic people and schools only; nothing is sent.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spesimen } from "../selftest/d1.test";

const keluar = process.argv[2];
if (!keluar) throw new Error("usage: tsx scripts/d1-spesimen.mts <directory>");
mkdirSync(keluar, { recursive: true });
const daftar = spesimen().map((s) => {
  const kode = s.nama.split(" ")[0];
  writeFileSync(join(keluar, `${kode}.html`), s.e.html);
  writeFileSync(join(keluar, `${kode}.txt`), s.e.teks);
  return { kode, nama: s.nama, subjek: s.e.subjek, alasan: s.alasan, tempat: s.tempat };
});
writeFileSync(join(keluar, "spesimen.json"), JSON.stringify(daftar, null, 2));
console.log(`${daftar.length} specimens written to ${keluar}`);

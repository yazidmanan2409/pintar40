import { readFileSync, writeFileSync } from "node:fs";
import { bacaBukuKerja } from "../src/lib/xlsx";
import { tulisBukuKerja } from "../src/components/unggah/templat";
const asal = bacaBukuKerja(new Uint8Array(readFileSync("docs/onboarding/konten-sintetis/SD5-Sintetis-Bab1.xlsx")));
if (!asal.ok) throw new Error(asal.code);
for (const l of asal.lembar) console.log(l.nama, "|", l.baris[0].join(" ¦ ").slice(0, 200));
const tabel = "\n\n| Bilangan | Pola | Suku ke-1 | Suku ke-2 | Suku ke-3 | Suku ke-4 | Suku ke-5 | Suku ke-6 | Aturan pembentukan pola |\n|---|---|---|---|---|---|---|---|---|\n| Genap | +2 | 2 | 4 | 6 | 8 | 10 | 12 | Tambahkan dua pada suku sebelumnya |\n| Ganjil | +2 | 1 | 3 | 5 | 7 | 9 | 11 | Tambahkan dua pada suku sebelumnya |\n| Kelipatan 5 | +5 | 5 | 10 | 15 | 20 | 25 | 30 | Tambahkan lima pada suku sebelumnya |";
let dipasang = false;
const lembar = asal.lembar.map((l) => {
  if (dipasang || !/^pelajaran/i.test(l.nama)) return l;
  const [kepala, ...data] = l.baris;
  const i = kepala.findIndex((h) => /isi|materi|teks|konten/i.test(h));
  if (i < 0 || !data.length) return l;
  dipasang = true; console.log("table into", l.nama, "column", kepala[i]);
  return { ...l, baris: [kepala, [...data[0].slice(0, i), data[0][i] + tabel, ...data[0].slice(i + 1)], ...data.slice(1)] };
});
console.log("dipasang", dipasang);
writeFileSync(process.argv[2], tulisBukuKerja(lembar));

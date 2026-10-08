// L4 (CR-88; D-127 Q9): writes public/contoh/contoh-buku-kerja-pintar.xlsx from its source. See src/lib/contoh-buku-kerja.ts.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BERKAS_CONTOH, SUMBER_CONTOH, bukuKerjaContoh } from "../src/lib/contoh-buku-kerja";

const root = join(import.meta.dirname, "..");
writeFileSync(join(root, "public", "contoh", BERKAS_CONTOH), bukuKerjaContoh(new Uint8Array(readFileSync(join(root, SUMBER_CONTOH)))));
console.log(`public/contoh/${BERKAS_CONTOH} written from ${SUMBER_CONTOH}`);

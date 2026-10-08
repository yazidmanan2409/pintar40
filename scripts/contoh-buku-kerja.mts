// L4 (CR-88; D-127 Q9): writes the example workbook beside its source (not served; see src/lib/contoh-buku-kerja.ts).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HASIL_CONTOH, SUMBER_CONTOH, bukuKerjaContoh } from "../src/lib/contoh-buku-kerja";

const root = join(import.meta.dirname, "..");
writeFileSync(join(root, HASIL_CONTOH), bukuKerjaContoh(new Uint8Array(readFileSync(join(root, SUMBER_CONTOH)))));
console.log(`${HASIL_CONTOH} written from ${SUMBER_CONTOH}`);

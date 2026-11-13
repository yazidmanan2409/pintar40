/**
 * A2A-L01's report (Sharon's R3): one line per writer of the ranked tables, its locks in order with their strength,
 * read from the local stack's catalogue. Writes selftest/a2a-l01-laporan.txt; with --salah, also prints the breaches.
 *   SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npx tsx scripts/dev/a2a-l01-laporan.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { bacaUrutan, laporan } from "../../selftest/a2a-l01.test";

const db = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const r = bacaUrutan(db);
writeFileSync(join(process.cwd(), "selftest", "a2a-l01-laporan.txt"), laporan(r.semua));
process.stdout.write(`${r.menyentuh} writers of ${r.fungsi} functions; ${r.salah.length} breach(es)\n`);
if (process.argv.includes("--salah")) for (const s of r.salah) process.stdout.write(`  ${s}\n`);

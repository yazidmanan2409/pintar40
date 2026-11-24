// Ruling 79's audit world (track 3c): W14's certificates, issued THROUGH THE PRODUCT after the load (Bob's condition 3:
// never by SQL). Each holder signs in on the app's own sign-in page, and the app's own route signs the database's
// payload with its key (POST /api/certificates/issue; CI's synthetic CERT_SECRET_KEY_V1). Then the issued ids are
// recorded in the world's facts, and dunia.json is written again.
//
//   audit/dunia/muat.sh && node audit/dunia/terbitkan.mjs        (the app on APP_URL, built from this tree)
//
// Holders: Ratih (w14.murid_terbit: the reissue case) and Citra (w14.murid_cabut: the revocation case).
// The local-only guard: the facts are written only into the local stack's database (as muat.sh refuses any other).
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const AKAR = join(HERE, "..", "..");
const { chromium } = createRequire(join(AKAR, "audit", "package.json"))("playwright");
const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const DB = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
{
  let u = null;
  try { u = new URL(DB); } catch { /* refused below */ }
  if (!u || !["postgresql:", "postgres:"].includes(u.protocol) || !["127.0.0.1", "localhost"].includes(u.hostname)
      || u.port !== "54322" || u.pathname !== "/postgres" || u.search) {
    console.error("terbitkan: REFUSED: the world's facts are written into the local stack only");
    process.exit(3);
  }
}
const psql = (sql) => execFileSync("psql", [DB, "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" }).trim();
const D = JSON.parse(readFileSync(join(HERE, "dunia.json"), "utf8"));

const pemegang = [["w14.murid_terbit", "w14.sesi_terbit", "w14.sertifikat_terbit"],
                  ["w14.murid_cabut", "w14.sesi_cabut", "w14.sertifikat_cabut"]];
const browser = await chromium.launch();
let gagal = 0;
for (const [kMurid, kSesi, kSimpan] of pemegang) {
  const m = D[kMurid];
  const sesi = D[kSesi];
  const ctx = await browser.newContext({ locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const page = await ctx.newPage();
  await page.goto(`${APP}/masuk`);
  await page.locator("#identitas").fill(m.email);
  await page.locator("#password").fill(m.password);
  await page.locator("#password").press("Enter");
  await page.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 30000 });
  const r = await page.request.post(`${APP}/api/certificates/issue`, { data: { session_id: sesi } });
  const body = await r.json().catch(() => ({}));
  if (r.status() !== 200 || body.status !== "issued" || !body.certificate_id) {
    console.error(`terbitkan: ${m.nama}: not issued (HTTP ${r.status()}, ${JSON.stringify(body)})`);
    gagal = 1;
  } else {
    const status = psql(`select status::text from public.certificates where id = '${body.certificate_id}'`);
    psql(`select dunia.simpan('${kSimpan}', '${body.certificate_id}')`);
    console.log(`terbitkan: ${m.nama}: certificate ${body.certificate_id} (${status}), through the product's route`);
  }
  await ctx.close();
}
await browser.close();

// SHARON (24 Nov): no certificate in the bootstrap tenant carries a signature from any other key. Every one is
// recomputed here exactly as src/lib/certificates/sign.ts signs (HMAC-SHA256 over the payload with its keys sorted at
// every level) with CI's synthetic key, CERT_SECRET_KEY_V1, and must match it, at key version 1.
{
  const kunci = process.env.CERT_SECRET_KEY_V1;
  if (!kunci) { console.error("terbitkan: CERT_SECRET_KEY_V1 (CI's synthetic key) is needed to check the signatures"); process.exit(4); }
  const kanon = (v) => Array.isArray(v) ? v.map(kanon)
    : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, kanon(v[k])])) : v;
  const baris = psql(`select coalesce(json_agg(json_build_object('id', c.id, 'v', c.key_version, 'sig', c.signature, 'p', c.canonical_payload)), '[]')
                        from public.certificates c where c.institution_id = '${D["boot.sekolah"]}'`);
  const semua = JSON.parse(baris);
  const lain = semua.filter((c) => c.v !== 1 || !c.sig
    || createHmac("sha256", kunci).update(JSON.stringify(kanon(c.p))).digest("hex") !== c.sig);
  if (lain.length) {
    console.error(`terbitkan: ${lain.length} certificate(s) in the bootstrap tenant NOT signed with CI's synthetic key: ${lain.map((c) => c.id).join(", ")}`);
    gagal = 1;
  } else {
    console.log(`terbitkan: all ${semua.length} certificate(s) in the bootstrap tenant are signed with CI's synthetic key (version 1)`);
  }
}
execFileSync(join(HERE, "muat.sh"), ["--ekspor"], { stdio: "inherit" });
process.exit(gagal);

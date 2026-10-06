// STAGING ONLY. CR-18 (J2.18) on staging: the resend countdown, side by side for a real account and a name nobody holds,
// through audit/staging/kode-ulang.mjs (proven locally red on two plants and green, 6 Oct). Every step is a press of
// PINTAR's buttons in a browser; nothing is read from or written to the database. The real account is a specimen's
// teacher (GS_KNOWN, a synthetic Golden School address): one run sends it two recovery codes (the request and the
// resend), inside the six sends PINTAR allows one address an hour.
import { chromium } from "playwright";
import { appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { mintaKodePemulihan, mintaKodeAktivasi, periksaHitungMundur, tanpaHitungDiMasuk } from "./kode-ulang.mjs";

const APP = process.env.STAGING_ORIGIN ?? "";
const KNOWN = process.env.GS_KNOWN ?? "";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!/^https:\/\/staging\./.test(APP)) throw new Error("not staging");
if (!/^goldenschool\+[a-z0-9-]+@pintarselalu\.com$/.test(KNOWN)) throw new Error("GS_KNOWN is not a Golden School address");
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const tag = randomBytes(3).toString("hex");

const browser = await chromium.launch();
let ok = true;
try {
  // K1: «Lupa password» for the specimen's teacher and for a name nobody holds, read side by side to zero and a resend
  const halaman = [];
  for (const [nama, siapa] of [[KNOWN, "a real account"], [`tiada.${tag}`, "a name nobody holds"]]) {
    const page = await (await browser.newContext()).newPage();
    const awal = await mintaKodePemulihan(page, APP, nama);
    halaman.push({ nama: siapa, page });
    log(`        K1 ${siapa}: the code screen first reads ${JSON.stringify({ judul: awal.judul, tertahan: awal.tertahan, detik: awal.detik })}`);
  }
  const r = await periksaHitungMundur(halaman, { batasMs: 150_000 });
  log(`${r.ok ? "PASS" : "FAIL"}    K1  CR-18 (J2.18): «Lupa password»'s countdown, a real account beside nobody :: ${r.jejak.join("; ")}${r.masalah.length ? ` | PROBLEMS: ${r.masalah.join("; ")}` : ""}`);
  ok = ok && r.ok;

  // K2: «Aktifkan akun» for an address nobody holds: the same held resend and line
  const akt = await mintaKodeAktivasi(await (await browser.newContext()).newPage(), APP, `tiada-${tag}@local.invalid`);
  const k2 = akt.tertahan === true && akt.detik != null && akt.detik > 0;
  log(`${k2 ? "PASS" : "FAIL"}    K2  CR-18: «Aktifkan akun» holds «Kirim ulang kode» and says how long :: ${JSON.stringify({ judul: akt.judul, tertahan: akt.tertahan, teks: akt.teks })}`);
  ok = ok && k2;

  // K3: the sign-in screen shows no countdown, after a failed password for a name nobody holds
  const m = await tanpaHitungDiMasuk(await (await browser.newContext()).newPage(), APP, `tiada.${tag}`);
  log(`${m.ok ? "PASS" : "FAIL"}    K3  CR-18: the sign-in screen shows no resend countdown :: «${m.teks}»`);
  ok = ok && m.ok;
} catch (e) {
  ok = false;
  log(`FAIL    K?  the walk stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`);
} finally {
  await browser.close();
}
process.exit(ok ? 0 : 1);

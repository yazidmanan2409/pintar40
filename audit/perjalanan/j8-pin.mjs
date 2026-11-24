// J8 · the PIN-reload probe (Sharon's PIN rule, ledger a73874d6; Bob 21:12Z): a class's cards made on Aktivasi, then
// the page reloaded, left and returned to by Back. A PIN is shown once, at creation; never in a URL, never in plaintext
// storage, never re-shown on reload. Local world only, a W15-style school (fixture w15-kartu: Anggrek's 1A and 1B,
// three learners waiting in each); every name and PIN is synthetic. A harness: it records, it does not judge.
//
//   node audit/perjalanan/j8-pin.mjs        (1280, ID; the app on APP_URL; it LOADS THE WORLD ITSELF)
//
// Recorded: the response headers of the Aktivasi page and of every request carrying the PINs (Cache-Control above all);
// then at four moments (just made; after Reload; after leaving; after Back) whether any of the PINs is visible, in the
// DOM, in history.state, or in the URL; and whether the browser kept the page in its back/forward cache.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, dunia, jalan, lewatiTur, masukEmail, muatUlang, keluar, ringkas } from "./lib.mjs";

muatUlang("w15-kartu");
const D = dunia();
const admin = D["w15.admin"];
const j = await jalan({ perjalanan: "j8-pin-muat-ulang", lebar: 1280, zona: "WIB", nama: "Wahyu Nugroho (Admin sekolah Anggrek)",
  label: ["keadaan fiksasi: kelas 1A Anggrek dengan tiga murid menunggu kartu", "PIN sintetis (dunia audit), boleh tercatat"] });
const { page } = j;
const header = [];
const pin = new Set();
page.on("response", async (r) => {
  const u = new URL(r.url());
  if (!u.host.includes("3999")) return;
  const dok = r.request().resourceType() === "document";
  const api = u.pathname.startsWith("/api/akun/");
  if (!dok && !api && !r.request().method().match(/POST/)) return;
  let membawaPin = false;
  if (api || r.request().method() === "POST") {
    const t = await r.text().catch(() => "");
    for (const m of t.matchAll(/"pin"\s*:\s*"(\d{4,8})"/g)) { pin.add(m[1]); membawaPin = true; }
  }
  const h = r.headers();
  header.push({ waktu: new Date().toISOString(), metode: r.request().method(), jalur: u.pathname + u.search, jenis: r.request().resourceType(), status: r.status(),
    membawa_pin: membawaPin, "cache-control": h["cache-control"] ?? "(none)", pragma: h["pragma"] ?? "(none)", expires: h["expires"] ?? "(none)", vary: h["vary"] ?? "(none)" });
});
let bfcache = null;
await page.addInitScript(() => { window.addEventListener("pageshow", (e) => { window.__dipulihkan = e.persisted; }); });

/** where any of the PINs is, now */
async function periksa(nama, foto, data) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
  await foto(nama);
  const daftar = [...pin];
  const tampil = (await page.locator("body").innerText().catch(() => "")) ?? "";
  const dom = await page.content().catch(() => "");
  const state = JSON.stringify(await page.evaluate(() => history.state).catch(() => null)) ?? "";
  const url = page.url();
  const penyimpanan = await page.evaluate(() => JSON.stringify({ ...sessionStorage }) + JSON.stringify({ ...localStorage })).catch(() => "");
  data(nama, {
    url: new URL(url).pathname + new URL(url).search,
    pins_known: daftar.length,
    visible: daftar.filter((p) => tampil.includes(p)).length,
    in_dom: daftar.filter((p) => dom.includes(p)).length,
    in_history_state: daftar.filter((p) => state.includes(p)).length,
    in_url: daftar.filter((p) => url.includes(p)).length,
    in_web_storage: daftar.filter((p) => penyimpanan.includes(p)).length,
    restored_from_bfcache: await page.evaluate(() => window.__dipulihkan ?? null).catch(() => null),
  });
}

/** the sheet made for one class on Aktivasi, by keyboard */
async function buat(rec, foto, kelas) {
  await page.goto(`${APP}/aktivasi`); await page.waitForLoadState("networkidle").catch(() => {});
  await foto(`aktivasi-${kelas}`);
  const pilih = page.getByLabel(/^Kelas$|^Class$/).first();
  if (await pilih.count() && (await pilih.evaluate((e) => e.tagName)) === "SELECT") {
    const opsi = await pilih.locator("option").allInnerTexts();
    const satu = opsi.find((x) => new RegExp(`^${kelas}\\b`).test(x.trim())) ?? opsi.find((x) => x.includes(kelas));
    rec.tab += await j.tabKe(pilih, 200);
    if (satu) await pilih.selectOption({ label: satu });
  }
  rec.tab += await j.tekan(page.getByRole("button", { name: /^(Buat kartu untuk kelas ini|Make cards for this class)/ }).first(), 300);
  await page.getByText(/PIN hanya ditampilkan sekali|PINs are shown only once/).first().waitFor({ timeout: 60000 });
}

await j.langkah("P1", "1A: the cards made (the sheet with its PINs)", async ({ rec, foto, data }) => {
  await masukEmail(j, admin);
  await lewatiTur(j);
  await buat(rec, foto, "1A");
  await periksa("1a-dibuat", foto, data);
  if (!pin.size) throw new Error("no PIN was seen in any response");
});

await j.langkah("P2", "1A: Reload", async ({ foto, data }) => {
  await page.reload();
  await periksa("1a-muat-ulang", foto, data);
});

await j.langkah("P3", "1B: the cards made, then left for another page (Konfigurasi)", async ({ rec, foto, data }) => {
  const sebelum = pin.size;
  await buat(rec, foto, "1B");
  data("new_pins", pin.size - sebelum);
  await periksa("1b-dibuat", foto, data);
  await page.goto(`${APP}/konfigurasi`); await page.waitForLoadState("networkidle").catch(() => {});
  await periksa("1b-ditinggal", foto, data);
});

await j.langkah("P4", "1B: Back to the sheet's page; then Forward and Back again", async ({ foto, data }) => {
  await page.goBack().catch(() => {});
  await periksa("1b-kembali", foto, data);
  await page.goForward().catch(() => {});
  await page.goBack().catch(() => {});
  await periksa("1b-kembali-lagi", foto, data);
});

await keluar(j).catch(() => {});
writeFileSync(join(j.out, "header.json"), JSON.stringify(header, null, 2));
writeFileSync(join(j.out, "pin.json"), JSON.stringify({ catatan: "PIN sintetis dari dunia audit (lokal); dicatat agar setiap pemeriksaan bisa diulang", pin: [...pin] }, null, 2));
process.exit(ringkas("j8-pin", [await j.selesai()]));

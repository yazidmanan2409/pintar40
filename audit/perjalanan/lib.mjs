// Ruling 79's audit (track 3c): what every journey capture shares. A HARNESS, not findings: it walks a journey from a
// reset to its last screen and records what the screen showed and what the data said. Daisy judges; Second Eye
// reproduces. Nothing here decides whether a screen is good.
//
// Environment:
//   APP_URL            the app under capture (default http://127.0.0.1:3999)
//   SUPABASE_DB_URL    the local database the world was loaded into (read only here)
//   AUDIT_OUT          where captures go (default audit-out/perjalanan)
//   AUDIT_LEBAR        widths to walk, comma-separated (default "1280,390,320": the standard walk)
//   AUDIT_BAHASA       "id" (default) or "en": each journey is walked once in EN (Daisy's rule: ID first)
//   AUDIT_LALUAN       the pass: "standar" (default), or one of the passes Daisy and Second Eye run themselves:
//                        "pembaca-layar"   an ARIA snapshot (landmarks, names, roles, live regions) beside every screen
//                        "jaringan-lambat" a throttled network (Chromium's DevTools emulation: 400 kbit/s, 400 ms)
//                        "gerak-dikurangi" prefers-reduced-motion: reduce
//                      These are HOOKS: the pass is switched on and recorded; judging it is theirs.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// the harness's own Playwright (audit/package.json, as audit-journeys.yml installs it), else one already on the machine
const { chromium } = createRequire(join(AKAR, "audit", "package.json"))("playwright");

export const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const DB = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
export const LEBAR = (process.env.AUDIT_LEBAR ?? "1280,390,320").split(",").map((x) => Number(x.trim())).filter(Boolean);
export const BAHASA = process.env.AUDIT_BAHASA === "en" ? "en" : "id";
export const LALUAN = process.env.AUDIT_LALUAN ?? "standar";
const LALUAN_SAH = ["standar", "pembaca-layar", "jaringan-lambat", "gerak-dikurangi"];
if (!LALUAN_SAH.includes(LALUAN)) throw new Error(`AUDIT_LALUAN must be one of ${LALUAN_SAH.join(", ")}`);
const TINGGI = { 1280: 900, 390: 844, 320: 640 };
const ZONA = { WIB: "Asia/Jakarta", WITA: "Asia/Makassar" };

/** The world's facts, as audit/dunia/muat.sh exported them. */
export function dunia() {
  return JSON.parse(readFileSync(join(AKAR, "audit", "dunia", "dunia.json"), "utf8"));
}

/** A read of the database, read only (a READ ONLY transaction): the data a step is recorded against. */
export function baca(sql) {
  return execFileSync("psql", [DB, "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", `begin read only; ${sql}; commit;`],
    { encoding: "utf8" }).trim();
}

/**
 * One walk of one journey at one width. `langkah(id, judul, fn)` runs a step and records it; a step either REACHED
 * its screen or STOPPED there (the walk could not go on: the capture is incomplete, which is the harness's failure,
 * never a judgement of the screen). `amati` records what a step OBSERVED without stopping (for example a step the
 * script names that the screen did not offer).
 */
export async function jalan({ perjalanan, lebar, zona = "WIB", nama }) {
  const out = join(process.env.AUDIT_OUT ?? "audit-out/perjalanan", perjalanan, `${LALUAN}-${BAHASA}-${lebar}`);
  rmSync(out, { recursive: true, force: true });   // a walk's folder holds that walk only
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: lebar, height: TINGGI[lebar] ?? 900 },
    locale: BAHASA === "en" ? "en-GB" : "id-ID",
    timezoneId: ZONA[zona],
    reducedMotion: LALUAN === "gerak-dikurangi" ? "reduce" : "no-preference",
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  if (LALUAN === "jaringan-lambat") {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 400, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8,
    });
  }
  const catatan = { perjalanan, nama, lebar, zona, bahasa: BAHASA, laluan: LALUAN, mulai: new Date().toISOString(), langkah: [] };
  let n = 0;
  let berhenti = null;

  // A screen is captured once it has SETTLED: the network idle, the streamed page's loading fallback («Memuat
  // halaman…», src/app/loading.tsx) gone, and a heading drawn. Otherwise a capture can be the skeleton, not the screen.
  async function tenang() {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => !/Memuat halaman|Loading the page/i.test(document.body.innerText)
      && document.querySelector("h1, [role=dialog] h2, main h2"), null, { timeout: 30000 }).catch(() => {});
  }
  async function layar(nm) {
    await tenang();
    const f = `${String(++n).padStart(2, "0")}-${nm}`;
    await page.screenshot({ path: join(out, `${f}.png`), fullPage: true });
    if (LALUAN === "pembaca-layar") {
      const aria = await page.locator("body").ariaSnapshot().catch((e) => `(no ARIA snapshot: ${e.message})`);
      writeFileSync(join(out, `${f}.aria.yml`), aria);
    }
    return f;
  }
  async function teks() {
    return ((await page.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
  }
  const ctxJalan = {
    page, out, layar, teks, baca,
    /** Tab until `loc` holds the focus (real keyboard travel); returns the number of Tab presses. */
    async tabKe(loc, maks = 80) {
      const target = await loc.elementHandle({ timeout: 15000 });
      for (let i = 0; i <= maks; i++) {
        if (await target.evaluate((el) => el === document.activeElement || el.contains(document.activeElement))) return i;
        await page.keyboard.press("Tab");
      }
      throw new Error(`could not reach it by Tab in ${maks} presses`);
    },
    /** Tab to a control and press Enter: the keyboard's click. Returns the Tab count. */
    async tekan(loc, maks) {
      const t = await ctxJalan.tabKe(loc, maks);
      await page.keyboard.press("Enter");
      return t;
    },
    /** Tab to a field and type into it. */
    async ketik(loc, nilai, maks) {
      const t = await ctxJalan.tabKe(loc, maks);
      await page.keyboard.type(nilai);
      return t;
    },
  };

  async function langkah(id, judul, fn) {
    const rec = { id, judul, hasil: "SAMPAI", layar: [], amatan: [], data: {}, tab: 0 };
    if (berhenti) { rec.hasil = "TIDAK_DIJALAN"; rec.amatan.push(`the walk stopped at ${berhenti}`); catatan.langkah.push(rec); return rec; }
    const t0 = Date.now();
    try {
      await fn({ ...ctxJalan, rec, amati: (s) => rec.amatan.push(s), data: (k, v) => { rec.data[k] = v; },
                 foto: async (nm) => { rec.layar.push(await layar(nm)); } });
      rec.url = new URL(page.url()).pathname;
    } catch (e) {
      rec.hasil = "BERHENTI";
      rec.amatan.push(String(e.message ?? e).slice(0, 800));
      rec.url = new URL(page.url()).pathname;
      rec.layar.push(await layar(`${id}-berhenti`).catch(() => null));
      rec.teks_layar = (await teks()).slice(0, 600);
      berhenti = id;
    }
    rec.ms = Date.now() - t0;
    catatan.langkah.push(rec);
    console.log(`${rec.hasil.padEnd(12)} ${perjalanan} ${lebar} ${id.padEnd(4)} ${judul}${rec.amatan.length ? " :: " + rec.amatan.join(" | ").slice(0, 300) : ""}`);
    return rec;
  }

  async function selesai() {
    catatan.selesai = new Date().toISOString();
    catatan.sampai_akhir = !berhenti;
    writeFileSync(join(out, "langkah.json"), JSON.stringify(catatan, null, 2));
    await browser.close();
    return catatan;
  }
  return { page, langkah, selesai, ...ctxJalan };
}

/** The language toggle (ID/EN) by keyboard, when the walk is in EN. */
export async function pilihBahasa(j) {
  if (BAHASA !== "en") return;
  await j.tekan(j.page.getByRole("button", { name: "EN", exact: true }).first());
  await j.page.waitForLoadState("networkidle").catch(() => {});
}

/** The record of a whole journey run: one line per walk, and an exit code (0 only when every walk reached its end). */
export function ringkas(perjalanan, hasil) {
  const out = join(process.env.AUDIT_OUT ?? "audit-out/perjalanan", perjalanan);
  mkdirSync(out, { recursive: true });
  const baris = hasil.map((c) => `${c.sampai_akhir ? "SAMPAI AKHIR" : "BERHENTI    "}  ${c.laluan}/${c.bahasa}/${c.lebar}  ${c.nama}  `
    + c.langkah.map((l) => `${l.id}:${l.hasil}`).join(" "));
  const semua = hasil.every((c) => c.sampai_akhir);
  writeFileSync(join(out, "RINGKASAN.txt"), `${perjalanan} · ${new Date().toISOString()}\n${baris.join("\n")}\n${semua ? "EVERY WALK REACHED ITS LAST SCREEN" : "A WALK STOPPED"}\n`);
  console.log(baris.join("\n"));
  console.log(semua ? `${perjalanan}: every walk reached its last screen` : `${perjalanan}: a walk stopped`);
  return semua ? 0 : 1;
}

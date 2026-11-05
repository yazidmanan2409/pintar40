// E-E1-2 (D-170(e)): THE INTEGRATED NAVIGATION, E1 + E2 AS ONE EXPERIENCE, walked in a real browser against the seed.
// Required by the owner: role and context transitions, destination availability, the chooser, the rail, collapse,
// the drawer, accessibility and refusals, together (D-168). Every act is a click or a key; SQL is not used.
//
//   N1  For each role and context: the places are a subsequence of O12's one order (URUTAN_TEMPAT), the DOM's order is
//       the order on screen, exactly one is current, no link carries an aria-label; the context control heads the
//       navigation and the chooser appears exactly when «/» offers the person more than one door.
//   N2  At 1280, 1279, 1100, 1024, 1023, 820, 390 and 320 px: expanded (248 px) from 1280, the rail (72 px) from 1024
//       to 1279, the top bar under 1024; «Keluar» visible without opening anything at every width (D-009); in the rail
//       each link's name is its own word (E-E1-1) and a focused link shows its tooltip with the same words; axe clean in
//       the rail.
//   N3  The reader's collapse and expand: at 1280 «Ciutkan navigasi» gives the rail and the control then says «Lebarkan
//       navigasi» (aria-expanded false); at 1100 «Lebarkan navigasi» gives the full navigation.
//   N4  Under 1024 px: the bar's Tab order is the skip link, «Keluar», «Buka menu»; the drawer opens as a modal (focus
//       moves in, the page behind is inert) and Escape closes it and returns focus to «Buka menu».
//   N5  A transition: the teacher who also learns chooses Belajar on «/»; the navigation is then Belajar's, and back.
//   N7  «Laporkan masalah» from a page that needs its query (an assignment's /siapa) and back: the same page and
//       query, never a refusal (R0-4; the way back is the history-back, TautanKembali)
//   N8  X.11 (W6.1; D-186): a report is never sent while its screenshot is still uploading, and a second pick wins. With
//       the upload held in flight, «Kirim laporan» does not send (the page stays on /lapor; the file field says it is
//       uploading); a second, faster pick is the one attached even when the first finishes after it; once the upload is
//       done the report is sent and received.
//   N6  A page of another context is not drawn inside this one: a teacher in Mengajar opening /konfigurasi is refused
//       or sent to «/», never shown Konfigurasi with its places.
//
// Local or CI stack with the synthetic seed: APP_URL, SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL, the anon key, APP_DIR.
// Writes OUT_DIR/e1-navigasi.json and screenshots; exits 1 on any FAIL.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AXE_PATH } from "./a11y.mjs";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OUT = process.env.OUT_DIR ?? "audit-out/e1-navigasi";
const SLOW = 30000;
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

// O12 (D-170(d)), as src/lib/nama-tempat.ts URUTAN_TEMPAT
const URUTAN = ["/mengajar", "/pimpinan", "/konfigurasi", "/pendataan", "/aktivasi", "/studio",
  "/konfigurasi/keamanan", "/konfigurasi/email-uji", "/konfigurasi/sertifikat", "/belajar"];
const ORANG = [
  { key: "guru-dua", tujuan: "MENGAJAR", beranda: "/mengajar", email: "siklus-guru@synthetic.pintar.test", password: "Sintetis-SiklusGuru-11!" },
  { key: "guru", tujuan: "MENGAJAR", beranda: "/mengajar", email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" },
  { key: "admin", tujuan: "MENGELOLA", beranda: "/konfigurasi", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  { key: "hod", tujuan: "MENGELOLA", beranda: "/pimpinan", email: "alpha-hod@synthetic.pintar.test", password: "Sintetis-AlphaHod-48!" },
  { key: "dekan", tujuan: "MENGELOLA", beranda: "/pimpinan", email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!" },
  { key: "platform", tujuan: "MENGELOLA:PLATFORM", beranda: "/konfigurasi", email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" },
];
const LEBAR = [1280, 1279, 1100, 1024, 1023, 820, 390, 320];

mkdirSync(OUT, { recursive: true });
const langkah = [];
let gagal = false;
async function step(id, judul, fn) {
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try { await fn(rec); } catch (e) { rec.verdict = "FAIL"; rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`); }
  if (rec.verdict !== "PASS") gagal = true;
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
async function shot(page, rec, nama) {
  const f = `${String(langkah.length + 1).padStart(2, "0")}-${nama}.png`;
  await page.screenshot({ path: join(OUT, f) }).catch(() => null);
  rec.shots.push(f);
}
async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.key}: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}
/** The doors «/» offers this session (their pair keys). */
const pintu = (page) => page.locator('[data-pemilih="konteks"] button[data-konteks]').evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
async function pilih(page, tujuan) {
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  const kunci = await pintu(page);
  const k = kunci.find((x) => x === tujuan) ?? kunci.find((x) => x.split(":")[0] === tujuan) ?? kunci[0];
  if (!k) return kunci;
  await page.locator(`[data-pemilih="konteks"] button[data-konteks="${k}"]`).click();
  await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
  return kunci;
}
async function masuk(browser, p) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await context.addCookies(await cookies(p));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  const pintuAwal = await pilih(page, p.tujuan);
  // the tour, where it opens by itself, is closed so the walk reads the shell
  const lewati = page.getByRole("button", { name: /Lewati tur|Lewati|Tutup tur/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
  return { context, page, pintuAwal };
}
async function buka(page, jalan) {
  await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle" });
  const lewati = page.getByRole("button", { name: /Lewati tur|Lewati|Tutup tur/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
  await page.waitForTimeout(150);
}
/** The navigation as drawn: its places (hrefs, DOM order and screen order), the current ones, the context control. */
const bacaNav = (page) => page.evaluate(() => {
  const nav = document.querySelector(".pin-staf nav.pin-tabs");
  if (!nav) return null;
  const tempat = [...nav.querySelectorAll("a.pin-nav-item:not(.pin-konteks-rail)")];
  const terlihat = tempat.filter((a) => a.getBoundingClientRect().height > 0);
  const layar = [...terlihat].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).map((a) => a.getAttribute("href"));
  return {
    dom: tempat.map((a) => a.getAttribute("href")),
    layar,
    kini: tempat.filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.getAttribute("href")),
    berlabel: [...nav.querySelectorAll("a")].filter((a) => a.hasAttribute("aria-label") || a.hasAttribute("title")).map((a) => a.getAttribute("href")),
    blokPertama: nav.firstElementChild?.matches("[data-konteks-blok]") ?? false,
    pilih: !!nav.querySelector("[data-konteks-pilih]"),
    pilihRail: !!nav.querySelector("[data-konteks-rail]"),
  };
});
/** The accessible name as a screen reader takes it from the subtree: aria-hidden parts are not read. */
const namaDari = (page, sel) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  const jalan = (n) => n.nodeType === 3 ? n.textContent : n.nodeType === 1 && n.getAttribute("aria-hidden") !== "true" ? [...n.childNodes].map(jalan).join("") : "";
  return el ? jalan(el).replace(/\s+/g, " ").trim() : null;
}, sel);

const browser = await chromium.launch();
const sesi = {};
for (const p of ORANG) sesi[p.key] = await masuk(browser, p);

for (const p of ORANG) {
  const { page, pintuAwal } = sesi[p.key];
  await step(`N1-${p.key}`, `${p.key} in ${p.tujuan}: the places, their one order, the current place, the context control`, async (rec) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await buka(page, p.beranda);
    const n = await bacaNav(page);
    if (!harus(rec, n !== null, `${p.beranda} is in the staff shell`)) return;
    const urut = n.dom.map((h) => URUTAN.indexOf(h));
    harus(rec, urut.every((i) => i >= 0) && urut.every((v, i) => i === 0 || v > urut[i - 1]), `the places follow O12's order: ${n.dom.join(" · ")}`);
    harus(rec, JSON.stringify(n.dom) === JSON.stringify(n.layar), `the keyboard's order is the screen's (${n.layar.join(" · ")})`);
    harus(rec, n.kini.length === 1 && n.kini[0] === p.beranda, `exactly one current place, ${p.beranda} (${n.kini.join(", ") || "none"})`);
    harus(rec, n.berlabel.length === 0, `no navigation link carries an aria-label or title (${n.berlabel.join(", ") || "none"})`);
    harus(rec, n.blokPertama, "the context control is the navigation's first part");
    const lain = pintuAwal.length > 1;
    harus(rec, n.pilih === lain && n.pilihRail === lain, `the chooser is offered ${lain ? "" : "not "}exactly as «/» offers ${pintuAwal.length} door(s)`);
    if (p.key === "dekan") harus(rec, !n.dom.includes("/studio"), "the dean is not offered Studio (DAISY-11)");
    await shot(page, rec, `${p.key}-1280`);
  });
}

for (const p of ORANG.filter((x) => ["guru-dua", "admin", "platform"].includes(x.key))) {
  const { page } = sesi[p.key];
  await step(`N2-${p.key}`, `${p.key}: the layout at each width, «Keluar» always visible, the rail's names and tooltips, axe in the rail`, async (rec) => {
    for (const w of LEBAR) {
      await page.setViewportSize({ width: w, height: 860 });
      await buka(page, p.beranda);
      const m = await page.evaluate(() => {
        const h = document.querySelector(".pin-staf");
        const k = h?.querySelector(".pin-sesi-keluar");
        const r = k?.getBoundingClientRect();
        return { lebar: Math.round(h?.getBoundingClientRect().width ?? 0), keluar: !!r && r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
          luap: document.documentElement.scrollWidth - innerWidth };
      });
      const harap = w >= 1280 ? 248 : w >= 1024 ? 72 : w;
      harus(rec, m.lebar === harap, `${w} px: the shell is ${m.lebar} px wide (${w >= 1280 ? "expanded" : w >= 1024 ? "the rail" : "the top bar"}, ${harap})`);
      harus(rec, m.keluar, `${w} px: «Keluar» is visible without opening anything`);
      harus(rec, m.luap <= 0, `${w} px: no sideways scroll (${m.luap} px)`);
      if (w === 1100) {
        const hrefs = await page.locator(".pin-staf nav.pin-tabs a.pin-nav-item:not(.pin-konteks-rail)").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
        for (const href of hrefs) {
          const sel = `.pin-staf nav.pin-tabs a.pin-nav-item[href="${href}"]`;
          const nama = await namaDari(page, sel);
          await page.locator(sel).focus();
          await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
          const tip = await page.evaluate((sel) => { const t = document.querySelector(sel)?.querySelector(".pin-nav-tip"); return t && getComputedStyle(t).display !== "none" ? t.textContent : null; }, sel);
          harus(rec, Boolean(nama) && tip === nama, `1100 px: «${nama}» is named by its own word and its tooltip says the same on focus («${tip}»)`);
        }
        if (await page.locator("[data-konteks-rail]").count()) {
          const nama = await namaDari(page, "[data-konteks-rail]");
          harus(rec, /^Mau ke mana hari ini\? · /.test(nama ?? ""), `1100 px: the rail's chooser item is named «${nama}»`);
        }
        await page.addScriptTag({ path: AXE_PATH });
        const axe = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => `${v.id}×${v.nodes.length}`));
        harus(rec, axe.length === 0, `1100 px (the rail): axe clean${axe.length ? ` — ${axe.join(", ")}` : ""}`);
        await shot(page, rec, `${p.key}-1100-rel`);
      }
    }
  });
}

await step("N3", "the reader collapses the navigation at 1280 px and expands it in the rail range", async (rec) => {
  const { page } = sesi.admin;
  await page.setViewportSize({ width: 1280, height: 860 });
  await buka(page, "/konfigurasi");
  const tombol = page.locator("[data-ciut-tombol]");
  const baca = async () => page.evaluate(() => { const t = document.querySelector("[data-ciut-tombol]"); return { lebar: Math.round(document.querySelector(".pin-staf").getBoundingClientRect().width), kata: t.textContent.trim(), exp: t.getAttribute("aria-expanded") }; });
  let s = await baca();
  harus(rec, s.lebar === 248 && s.kata === "Ciutkan navigasi" && s.exp === "true", `1280 px expanded: the control says «${s.kata}», aria-expanded ${s.exp}`);
  await tombol.click(); await page.waitForTimeout(150);
  s = await baca();
  harus(rec, s.lebar === 72 && s.kata === "Lebarkan navigasi" && s.exp === "false", `collapsed: ${s.lebar} px, the control says «${s.kata}», aria-expanded ${s.exp}`);
  await shot(page, rec, "ciut-1280");
  await tombol.click(); await page.waitForTimeout(150);
  s = await baca();
  harus(rec, s.lebar === 248, `expanded again: ${s.lebar} px`);
  const simpan = await page.evaluate(() => localStorage.getItem("pin-nav-ciut"));
  harus(rec, simpan === null, `back at 1280 px's default, no choice is kept (${simpan})`);
  await page.setViewportSize({ width: 1100, height: 860 });
  await page.waitForTimeout(150);
  s = await baca();
  harus(rec, s.lebar === 72 && s.kata === "Lebarkan navigasi", `1100 px: the rail by default (${s.lebar} px), the control says «${s.kata}»`);
  await tombol.click(); await page.waitForTimeout(150);
  s = await baca();
  harus(rec, s.lebar === 248 && s.kata === "Ciutkan navigasi" && s.exp === "true", `1100 px expanded by the reader: ${s.lebar} px, «${s.kata}»`);
  await shot(page, rec, "lebar-1100");
  await buka(page, "/konfigurasi");
  s = await baca();
  harus(rec, s.lebar === 248 && s.kata === "Ciutkan navigasi", `the reader's choice holds on the next page (${s.lebar} px, «${s.kata}»)`);
  await page.locator("[data-ciut-tombol]").click(); await page.waitForTimeout(150);
  harus(rec, await page.evaluate(() => localStorage.getItem("pin-nav-ciut")) === null, "collapsed again at 1100 px, the default, no choice is kept");
});

await step("N4", "under 1024 px: «Keluar», then «Buka menu»; the drawer is a modal and gives focus back", async (rec) => {
  const { page } = sesi.platform;
  await page.setViewportSize({ width: 390, height: 860 });
  await buka(page, "/konfigurasi");
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const urut = [];
  for (let i = 0; i < 3; i++) { await page.keyboard.press("Tab"); urut.push(await page.evaluate(() => (document.activeElement.innerText || document.activeElement.textContent || "").replace(/\s+/g, " ").trim())); }
  harus(rec, urut[1] === "Keluar" && urut[2] === "Buka menu", `the bar's Tab order: ${urut.join(" → ")}`);
  await page.keyboard.press("Enter"); await page.waitForTimeout(200);
  const buka1 = await page.evaluate(() => { const l = document.querySelector(".pin-laci"); return { role: l.getAttribute("role"), modal: l.getAttribute("aria-modal"), dalam: l.contains(document.activeElement), inert: !!document.querySelector("main")?.closest("[inert]"),
    kata: document.querySelector("[data-laci-tombol]").textContent.trim(), blok: !!l.querySelector("nav [data-konteks-blok]") }; });
  harus(rec, buka1.role === "dialog" && buka1.modal === "true" && buka1.dalam && buka1.inert, `open: a modal dialog, focus inside, the page inert (${JSON.stringify(buka1)})`);
  harus(rec, buka1.kata === "Tutup menu" && buka1.blok, "the button now says «Tutup menu»; the context control heads the menu");
  await shot(page, rec, "laci-390");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  const tutup = await page.evaluate(() => ({ fokus: document.activeElement.textContent.trim(), inert: !!document.querySelector("[inert]"), buka: document.querySelector(".pin-staf").dataset.laci ?? null }));
  harus(rec, tutup.fokus === "Buka menu" && !tutup.inert && tutup.buka === null, `Escape closes it and returns focus to «${tutup.fokus}»; nothing is left inert`);
});

await step("N5", "the teacher who also learns changes context on «/»: the navigation follows, and back", async (rec) => {
  const { page } = sesi["guru-dua"];
  await page.setViewportSize({ width: 1280, height: 860 });
  const kunci = await pilih(page, "BELAJAR");
  if (!harus(rec, kunci.some((k) => k.startsWith("BELAJAR")) && kunci.some((k) => k.startsWith("MENGAJAR")), `«/» offers Mengajar and Belajar (${kunci.join(", ")})`)) return;
  await buka(page, "/belajar");
  let n = await bacaNav(page);
  const tujuan = await page.locator("nav [data-konteks-blok] .pin-konteks-tujuan").textContent().catch(() => null);
  harus(rec, n !== null && JSON.stringify(n.dom) === JSON.stringify(["/belajar"]) && tujuan === "Belajar", `in Belajar the navigation is Belajar's alone (${n?.dom.join(" · ")}), the control says «${tujuan}»`);
  await shot(page, rec, "belajar");
  await pilih(page, "MENGAJAR");
  await buka(page, "/mengajar");
  n = await bacaNav(page);
  harus(rec, n !== null && n.dom[0] === "/mengajar" && !n.dom.includes("/belajar"), `back in Mengajar: ${n?.dom.join(" · ")}`);
});

await step("N6", "a page of another context is not drawn inside this one", async (rec) => {
  const { page } = sesi.guru;
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto(`${APP}/konfigurasi`, { waitUntil: "networkidle" });
  const u = new URL(page.url());
  const n = await bacaNav(page);
  const konfig = n?.dom.includes("/konfigurasi") ?? false;
  harus(rec, !konfig, `a teacher in Mengajar opening /konfigurasi lands on ${u.pathname}${u.search}, ${n ? `a shell offering ${n.dom.join(" · ")}` : "no navigation"}`);
  await shot(page, rec, "lain-konteks");
});

await step("N7", "«Laporkan masalah» from a page that needs its query, and back: the same page, not a refusal (R0-4)", async (rec) => {
  const { page } = sesi["guru-dua"];
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
  const siapa = page.locator('main a[href*="/siapa?penugasan="]').first();
  if (!harus(rec, (await siapa.count()) === 1, "the teacher's home links an assignment's «siapa» page")) return;
  await siapa.click();
  await page.waitForURL((u) => u.pathname.endsWith("/siapa") && u.searchParams.has("penugasan"), { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const asal = new URL(page.url());
  await page.locator("[data-lapor]").first().click();
  await page.waitForURL((u) => u.pathname === "/lapor", { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const dari = new URL(page.url()).searchParams.get("dari");
  harus(rec, dari === asal.pathname, `the report keeps the page without its query (dari=${dari})`);
  const balik = page.locator('[data-kembali="riwayat"]').first();
  harus(rec, (await balik.innerText()).includes("Kembali ke halaman sebelumnya"), "the way back is named as the history-back");
  await balik.click();
  await page.waitForURL((u) => u.pathname === asal.pathname, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
  const kini = new URL(page.url());
  const judul = (await page.locator("h1").first().innerText()).trim();
  harus(rec, kini.search === asal.search, `back on ${kini.pathname}${kini.search}, the page as it was left (${asal.search})`);
  harus(rec, !/belum tersedia untuk akun Anda/.test(judul), `the page is drawn, not refused («${judul}»)`);
  await shot(page, rec, "lapor-kembali");
});

await step("N8", "X.11: a report is never sent while its screenshot uploads, and a second pick wins", async (rec) => {
  const { page } = sesi["guru-dua"];
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto(`${APP}/lapor?dari=/mengajar`, { waitUntil: "networkidle" });
  // the first upload's signed-URL request is held until released; every other request goes through
  let lepas; const ditahan = new Promise((r) => { lepas = r; });
  let pertama = true;
  await page.route("**/api/assets/upload-url", async (route) => {
    if (pertama) { pertama = false; await ditahan; }
    await route.continue().catch(() => {});   // released after the step ended: nothing left to continue
  });
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
  for (const n of ["lakukan", "harapan", "terjadi"]) await page.locator(`textarea[name="${n}"]`).fill(`X.11 walk: ${n}`);
  await page.setInputFiles("#lapor-tangkapan", { name: "satu.png", mimeType: "image/png", buffer: png });
  await page.waitForFunction(() => /Mengunggah/.test(document.querySelector(".pin-lapor-isian .pin-hint")?.textContent ?? ""), null, { timeout: 10000 });
  // pressing send while it uploads does not send
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await page.waitForTimeout(1500);
  const masih = new URL(page.url()).pathname;
  if (!harus(rec, masih === "/lapor", masih === "/lapor" ? "pressing «Kirim laporan» mid-upload sent nothing: the page stayed on /lapor" : `pressing «Kirim laporan» mid-upload sent the report without its screenshot (now on ${masih})`)) { lepas(); await page.unroute("**/api/assets/upload-url"); return; }
  const pesan = await page.locator("#lapor-tangkapan").evaluate((el) => el.validationMessage, null, { timeout: 5000 });
  harus(rec, /Mengunggah/.test(pesan), `the file field says why it cannot be sent yet («${pesan}»)`);
  // a second, faster pick; then the first finishes after it
  await page.setInputFiles("#lapor-tangkapan", { name: "dua.jpg", mimeType: "image/jpeg", buffer: png });
  await page.waitForFunction(() => /\.jpg$/.test(document.querySelector('input[name="tangkapan"]')?.value ?? ""), null, { timeout: SLOW }).catch(() => {});
  lepas();
  await page.waitForTimeout(2500);
  const jalur = await page.locator('input[name="tangkapan"]').inputValue();
  harus(rec, /^laporan\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/.test(jalur), `the attached screenshot is the second pick (${jalur || "none"})`);
  // once done, the report is sent and received
  await page.getByRole("button", { name: "Kirim laporan" }).click();
  await page.waitForURL((u) => u.pathname === "/lapor/saya", { timeout: SLOW }).catch(() => {});
  harus(rec, new URL(page.url()).pathname === "/lapor/saya", `after the upload the report was sent (${new URL(page.url()).pathname})`);
  await page.unroute("**/api/assets/upload-url");
  await shot(page, rec, "lapor-tangkapan");
});

await browser.close();
writeFileSync(join(OUT, "e1-navigasi.json"), JSON.stringify(langkah, null, 2));
console.log(`\n${langkah.filter((l) => l.verdict === "PASS").length}/${langkah.length} PASS`);
process.exit(gagal ? 1 : 0);

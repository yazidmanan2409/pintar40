// LOCAL ONLY. O-B3 and B1/B2: the recalculated learner's pages (ID and EN, 1280 and 390) and the school page.
import { chromium } from "playwright";
import { createRequire } from "node:module"; import { join } from "node:path"; import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const require = createRequire(join(process.cwd(), "package.json")); const { createServerClient } = require("@supabase/ssr");
const APP = "http://127.0.0.1:3999", OUT = process.env.OUT_DIR; mkdirSync(OUT, { recursive: true });
const W = JSON.parse(readFileSync(process.env.WORLD, "utf8"));
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
async function masuk(b, p, w, tujuan, lang) {
  const jar = new Map(); const c = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) } });
  const { error } = await c.auth.signInWithPassword({ email: p.email, password: p.password }); if (error) throw error;
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, locale: lang === "en" ? "en-GB" : "id-ID" });
  await ctx.addCookies([...jar].map(([name, value]) => ({ name, value, domain: "127.0.0.1", path: "/", sameSite: "Lax" })).concat(lang === "en" ? [{ name: "pintar-lang", value: "en", domain: "127.0.0.1", path: "/", sameSite: "Lax" }] : []));
  const page = await ctx.newPage(); await page.goto(APP + "/", { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") { await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check(); await page.locator('form button[type="submit"]').first().click(); await page.waitForURL((u) => u.pathname !== "/perangkat").catch(() => {}); await page.goto(APP + "/", { waitUntil: "networkidle" }); }
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]'); if (await pintu.count()) { const k = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks"))); await page.locator(`[data-pemilih="konteks"] button[data-konteks="${k.find((x) => x.startsWith(tujuan)) ?? k[0]}"]`).click(); await page.waitForURL((u) => u.pathname !== "/").catch(() => {}); }
  // dismiss a first-run tour if it covers the page
  for (const t of ["Lewati tur", "Skip the tour", "Skip tour"]) { const x = page.getByRole("button", { name: t }); if (await x.count()) await x.first().click().catch(() => {}); }
  return { ctx, page };
}
const teks = {};
const b = await chromium.launch();
const murid = W.murid.find((m) => m.email === process.env.EMAIL);
for (const lang of ["id", "en"]) for (const w of [1280, 390]) {
  const { ctx, page } = await masuk(b, murid, w, "BELAJAR", lang);
  for (const [n, u] of [["hasil", "/belajar/hasil"], ["bab-uji", `/belajar/${process.env.TUGAS_POST}/hasil`], ["peta", `/belajar/${process.env.TUGAS_PRE}/peta`], ["bab-awal", `/belajar/${process.env.TUGAS_PRE}/hasil`]]) {
    await page.goto(APP + u, { waitUntil: "networkidle" });
    await page.screenshot({ path: join(OUT, `murid-${n}-${lang}-${w}.png`), fullPage: true });
    await page.screenshot({ path: join(OUT, `murid-${n}-${lang}-layar-${w}.png`) });
    teks[`murid-${n}-${lang}-${w}`] = norm(await page.locator("main").first().innerText().catch(() => ""));
  }
  await ctx.close();
}
for (const w of [1280, 390]) { const { ctx, page } = await masuk(b, W.staf.admin, w, "MENGELOLA", "id");
  await page.goto(`${APP}/dekan/ringkasan?simpul=${process.env.ROOT}&dari=konfigurasi`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, `admin-sekolah-${w}.png`), fullPage: true }); teks[`admin-sekolah-${w}`] = norm(await page.locator("main").first().innerText()); await ctx.close(); }
for (const [k, tujuan, pages] of [["guru", "MENGAJAR", [["ringkasan-5B", `/edukator/ringkasan?kelas=${W.kelas["5B"]}&dari=kelas`], ["bukti-5B", `/mengajar/${W.kelas["5B"]}/bukti`], ["ringkasan-5C", `/edukator/ringkasan?kelas=${W.kelas["5C"]}&dari=kelas`]]], ["dekan", "MENGELOLA", [["pimpinan", "/pimpinan"]]], ["admin", "MENGELOLA", [["sekolah", `/dekan/ringkasan?simpul=${process.env.ROOT}&dari=konfigurasi`]]]]) {
  const { ctx, page } = await masuk(b, W.staf[k], 1280, tujuan, "en");
  for (const [n, u] of pages) { await page.goto(APP + u, { waitUntil: "networkidle" }); await page.screenshot({ path: join(OUT, `${k}En-${n}-1280.png`), fullPage: true }); teks[`${k}En-${n}`] = norm(await page.locator("main").first().innerText()); }
  await ctx.close(); }
await b.close(); writeFileSync(join(OUT, "teks.json"), JSON.stringify(teks, null, 1)); console.log(Object.keys(teks).join(" "));

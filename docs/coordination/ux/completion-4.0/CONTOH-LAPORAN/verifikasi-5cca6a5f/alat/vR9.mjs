import { chromium } from "playwright";
import { createRequire } from "node:module"; import { join } from "node:path"; import { mkdirSync } from "node:fs";
const require = createRequire(join(process.cwd(), "package.json")); const { createServerClient } = require("@supabase/ssr");
const APP = "http://127.0.0.1:3999", OUT = process.env.OUT_DIR, C = process.env.COURSE; mkdirSync(OUT, { recursive: true });
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const p = { email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" };
const b = await chromium.launch();
for (const w of [1280, 390, 320]) {
  const jar = new Map(); const c = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) } });
  await c.auth.signInWithPassword(p);
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, locale: "id-ID" }); await ctx.addCookies([...jar].map(([name, value]) => ({ name, value, domain: "127.0.0.1", path: "/", sameSite: "Lax" })));
  const page = await ctx.newPage(); await page.goto(APP + "/", { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") { await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check(); await page.getByRole("button", { name: "Simpan pilihan" }).click(); await page.waitForURL((u) => u.pathname !== "/perangkat").catch(() => {}); await page.goto(APP + "/", { waitUntil: "networkidle" }); }
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]'); if (await pintu.count()) { await pintu.first().click(); await page.waitForURL((u) => u.pathname !== "/").catch(() => {}); }
  await page.goto(`${APP}/studio/paket/${C}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(OUT, `r9-awal-${w}.png`), fullPage: true }); console.log(w, "before:", norm(await page.locator("main").textContent()).match(/SEKARANG.{0,300}/)?.[0]);
  const t0 = Date.now(); await page.getByRole("button", { name: "Tandai lolos pemeriksaan", exact: true }).click();
  await page.waitForURL((u) => u.searchParams.has("kode") || u.searchParams.has("hasil"), { timeout: 120000 }).catch(() => {}); await page.waitForLoadState("networkidle");
  const teks = norm(await page.locator("main").textContent());
  console.log(w, `${Date.now() - t0} ms`, page.url().replace(APP, ""));
  console.log("  refusal:", teks.match(/[^.]*(Tertahan|wajib diperbaiki|tidak dapat ditandai|menemukan)[^.]*\.[^.]*\./)?.[0]);
  console.log("  temuan:", teks.slice(teks.indexOf("Temuan"), teks.indexOf("Temuan") + 500));
  await page.screenshot({ path: join(OUT, `r9-${w}.png`), fullPage: true }); await page.screenshot({ path: join(OUT, `r9-layar-${w}.png`) });
  await ctx.close();
}
await b.close();

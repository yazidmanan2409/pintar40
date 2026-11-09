import { chromium } from "playwright";
import { createRequire } from "node:module"; import { join } from "node:path"; import { mkdirSync, readFileSync } from "node:fs";
const require = createRequire(join(process.cwd(), "package.json")); const { createServerClient } = require("@supabase/ssr");
const APP = "http://127.0.0.1:3999", OUT = process.env.OUT_DIR; mkdirSync(OUT, { recursive: true });
const W = JSON.parse(readFileSync(process.env.WORLD, "utf8"));
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const guru = W.staf.guru, murid = W.murid.find((m) => m.email === process.env.EMAIL);
async function masuk(b, p, w, tujuan) {
  const jar = new Map(); const c = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) } });
  await c.auth.signInWithPassword({ email: p.email, password: p.password });
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, locale: "id-ID" }); await ctx.addCookies([...jar].map(([name, value]) => ({ name, value, domain: "127.0.0.1", path: "/", sameSite: "Lax" })));
  const page = await ctx.newPage(); await page.goto(APP + "/", { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") { await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check(); await page.getByRole("button", { name: "Simpan pilihan" }).click(); await page.waitForURL((u) => u.pathname !== "/perangkat").catch(() => {}); await page.goto(APP + "/", { waitUntil: "networkidle" }); }
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]'); if (await pintu.count()) { const k = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks"))); await page.locator(`[data-pemilih="konteks"] button[data-konteks="${k.find((x) => x.startsWith(tujuan)) ?? k[0]}"]`).click(); await page.waitForURL((u) => u.pathname !== "/").catch(() => {}); }
  return { ctx, page };
}
const b = await chromium.launch();
for (const w of [1280, 390]) {
  { const { ctx, page } = await masuk(b, guru, w, "MENGAJAR");
    for (const [n, u] of [["guru-murid", `/mengajar/${process.env.KELAS}/murid/${process.env.ORANG}`], ["guru-ringkasan", `/edukator/ringkasan?kelas=${process.env.KELAS}&dari=kelas`], ["guru-bukti", `/mengajar/${process.env.KELAS}/bukti`]]) {
      await page.goto(APP + u, { waitUntil: "networkidle" }); const t = norm(await page.locator("main").textContent());
      if (w === 1280) console.log(`## ${n}\n${n === "guru-murid" ? t.slice(0, 1600) : (t.match(/.{0,200}(dihitung ulang|Hasil sesi ini).{0,200}/)?.[0] ?? "(no recalculation note)")}`);
      await page.screenshot({ path: join(OUT, `${n}-${w}.png`), fullPage: true }); }
    await ctx.close(); }
  { const { ctx, page } = await masuk(b, murid, w, "BELAJAR");
    for (const [n, u] of [["murid-hasil", "/belajar/hasil"]]) {
      await page.goto(APP + u, { waitUntil: "networkidle" }); const t = norm(await page.locator("main").textContent());
      if (w === 1280) console.log(`## ${n}\n${t.slice(0, 900)}`);
      await page.screenshot({ path: join(OUT, `${n}-${w}.png`), fullPage: true });
      const bab = await page.locator('a[href*="/hasil"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")).filter((h) => /\/belajar\/[^/]+\/hasil/.test(h)));
      for (const [i, h] of bab.entries()) { await page.goto(APP + h, { waitUntil: "networkidle" }); const t2 = norm(await page.locator("main").textContent()); if (w === 1280) console.log(`## murid-bab-${i}\n${t2.slice(0, 500)}`); await page.screenshot({ path: join(OUT, `murid-bab-${i}-${w}.png`), fullPage: true }); }
    }
    await ctx.close(); }
}
await b.close();

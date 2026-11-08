// LOCAL ONLY. Daisy's design re-verification for owner decisions 1 and 3 on the report world (5cca6a5f).
// Signs in like audit/laporan-jalan.mjs; full-page screenshots at 1280, 390, 320; counts against lists.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const require = createRequire(join(process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");
const APP = "http://127.0.0.1:3999", SB = process.env.NEXT_PUBLIC_SUPABASE_URL, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const W = JSON.parse(readFileSync(process.env.WORLD, "utf8")); const OUT = process.env.OUT_DIR; mkdirSync(OUT, { recursive: true });
const MURID0 = JSON.parse(process.env.TANPA_KELAS);
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
async function cookies(p) { const jar = new Map(); const c = createServerClient(SB, ANON, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) } });
  const { error } = await c.auth.signInWithPassword({ email: p.email, password: p.password }); if (error) throw error;
  return [...jar].map(([name, value]) => ({ name, value, domain: "127.0.0.1", path: "/", sameSite: "Lax" })); }
async function masuk(b, p, viewport) { const context = await b.newContext({ viewport, locale: "id-ID", timezoneId: "Asia/Jakarta" }); await context.addCookies(await cookies(p));
  const page = await context.newPage(); await page.goto(APP + "/", { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") { await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check(); await page.getByRole("button", { name: "Simpan pilihan" }).click(); await page.waitForURL((u) => u.pathname !== "/perangkat").catch(() => {}); await page.goto(APP + "/", { waitUntil: "networkidle" }); }
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  if (await pintu.count()) { const k = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks"))); const pilih = k.find((x) => x.split(":")[0] === p.tujuan) ?? k[0];
    await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click(); await page.waitForURL((u) => u.pathname !== "/").catch(() => {}); }
  await page.waitForLoadState("networkidle"); return { context, page }; }
const catat = []; const b = await chromium.launch();
const foto = async (page, nama, w) => { const lebar = await page.evaluate(() => document.documentElement.scrollWidth); await page.screenshot({ path: join(OUT, `${nama}-${w}.png`), fullPage: true }); return lebar; };
const ORANG = { admin: { ...W.staf.admin, tujuan: "MENGELOLA" }, guru: { ...W.staf.guru, tujuan: "MENGAJAR" }, kadep: { ...W.staf.kadep, tujuan: "MENGELOLA" }, murid0: { ...MURID0, tujuan: "BELAJAR" } };
for (const w of [1280, 390, 320]) {
  const vp = { width: w, height: w === 1280 ? 900 : 844 };
  // decision 1: admin
  { const { context, page } = await masuk(b, ORANG.admin, vp);
    await page.goto(APP + "/konfigurasi", { waitUntil: "networkidle" }); const t = norm(await page.locator("main").textContent());
    catat.push(`${w} admin konfigurasi: «belum punya kelas» line ${/belum punya kelas/.test(t)} · sideways ${await foto(page, "d1-konfigurasi", w)}`);
    const tautan = page.locator('a[href*="/konfigurasi/pindah#tempatkan"]'); catat.push(`${w} admin konfigurasi: link to #tempatkan ${await tautan.count()}`);
    await page.goto(APP + "/konfigurasi/pindah#tempatkan", { waitUntil: "networkidle" });
    const n = await page.locator("[data-tanpa-kelas] li").count(); const y = await page.evaluate(() => { const e = document.getElementById("tempatkan"); return e ? Math.round(e.getBoundingClientRect().top) : null; });
    catat.push(`${w} admin pindah: rows ${n}, #tempatkan top in viewport ${y} · sideways ${await foto(page, "d1-pindah", w)}`);
    await page.screenshot({ path: join(OUT, `d1-pindah-layar-${w}.png`) });
    if (w === 390) { const baris = page.locator("[data-tanpa-kelas] li", { hasText: "Tanpa Kelas Dua" });
      const opsi = await baris.locator("select option").evaluateAll((os) => os.map((o) => [o.value, o.textContent]));
      catat.push(`390 admin pindah: options ${JSON.stringify(opsi.map((o) => o[1]))}`);
      await baris.locator("select").selectOption(opsi.find((o) => o[0])[0]); await baris.getByRole("button", { name: /Masukkan ke kelas/ }).click();
      await page.waitForURL((u) => u.searchParams.has("hasil") || u.searchParams.has("kode")).catch(() => {}); await page.waitForLoadState("networkidle");
      catat.push(`390 admin pindah after placing: «${norm(await page.locator("main").textContent()).match(/[^.]*ditempatkan[^.]*\./)?.[0]}» url ${page.url().replace(APP, "")} rows ${await page.locator("[data-tanpa-kelas] li").count()}`);
      await foto(page, "d1-pindah-sesudah", w); await page.screenshot({ path: join(OUT, `d1-pindah-sesudah-layar-${w}.png`) }); }
    await context.close(); }
  // decision 1: the learner
  { const { context, page } = await masuk(b, ORANG.murid0, vp); await page.goto(APP + "/belajar", { waitUntil: "networkidle" });
    catat.push(`${w} murid tanpa kelas /belajar: «${norm(await page.locator("[data-tanpa-kelas]").textContent().catch(() => "—"))}» · sideways ${await foto(page, "d1-belajar", w)}`); await context.close(); }
  // decision 3: Studio
  for (const k of ["guru", "kadep", "admin"]) { const { context, page } = await masuk(b, ORANG[k], vp); await page.goto(APP + "/studio", { waitUntil: "networkidle" });
    const kartu = await page.locator('a.pin-kartu-tautan').evaluateAll((as) => as.map((a) => ({ href: a.getAttribute("href"), teks: a.textContent.replace(/\s+/g, " ").trim(), n: Number((a.querySelector(".pin-studio-angka")?.textContent ?? "").replace(/\D/g, "")) })));
    catat.push(`${w} ${k} studio: ${JSON.stringify(kartu)} · sideways ${await foto(page, `d3-studio-${k}`, w)}`);
    for (const [i, c] of kartu.entries()) { if (!c.href) continue; await page.goto(APP + c.href, { waitUntil: "networkidle" });
      const daftar = await page.locator('#paket a[href^="/studio/paket/"]').evaluateAll((as) => [...new Set(as.map((a) => a.textContent.replace(/\s+/g, " ").trim()))]);
      const tinjau = c.href.includes("tinjau") ? await page.locator('main a[href^="/studio/paket/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]).then((x) => x.length) : null;
      catat.push(`${w} ${k} ${c.href}: count ${c.n}, list ${tinjau ?? daftar.length} ${JSON.stringify(daftar)} · sideways ${await foto(page, `d3-daftar-${k}-${i}`, w)}`); }
    await context.close(); }
}
await b.close(); writeFileSync(join(OUT, "catatan.txt"), catat.join("\n") + "\n"); console.log(catat.join("\n"));

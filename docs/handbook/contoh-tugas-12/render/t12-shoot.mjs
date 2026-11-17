// Screenshot the three rendered pages at 1280 px (2x), clip to <main>, and record annotation boxes.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { writeFileSync, mkdirSync } from "node:fs";
const base = process.argv[2] || "http://localhost:8765";
const out = process.argv[3];
mkdirSync(out, { recursive: true });
const pages = ["ss32-lihat-bukti", "ss32b-belum-cukup", "ss33-lihat-per-soal"];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const boxes = {};
for (const p of pages) {
  const page = await ctx.newPage();
  await page.goto(`${base}/${p}.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const main = await page.$("main");
  const mb = await main.boundingBox();
  await page.screenshot({ path: `${out}/${p}.png`, clip: mb, fullPage: true });
  const ann = await page.$$eval("[data-ann], .pin-keadaan-siapa, .pin-intro[data-memutuskan], .pin-ms, .pin-meta, .pin-head, .pin-sec > h2", (els) =>
    els.map((e) => { const r = e.getBoundingClientRect(); return { key: e.getAttribute("data-ann") || e.className, text: (e.textContent || "").slice(0, 60),
      x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }));
  boxes[p] = { main: mb, ann };
  await page.close();
}
writeFileSync(`${out}/boxes.json`, JSON.stringify(boxes, null, 1));
await browser.close();
console.log("ok");

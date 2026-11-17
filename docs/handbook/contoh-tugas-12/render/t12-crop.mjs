// Crop the rendered pages to the parts the handbook shows, at 2x. Boxes in CSS px relative to <main>.
// The product footer (it names a real person) is never inside a crop.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const [base = "http://localhost:8765", out] = process.argv.slice(2);
const CROPS = {
  "ss32a-lihat-bukti-atas":  ["ss32-lihat-bukti",    8, 150, 752, 1046],
  "ss32b-lihat-bukti-bawah": ["ss32-lihat-bukti",    8, 1036, 752, 1844],
  "ss32c-belum-cukup":       ["ss32b-belum-cukup",   8, 322, 752, 966],
  "ss33-lihat-per-soal":     ["ss33-lihat-per-soal", 8, 150, 752, 956],
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
for (const [name, [src, x0, y0, x1, y1]] of Object.entries(CROPS)) {
  const page = await ctx.newPage();
  await page.goto(`${base}/${src}.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const mb = await (await page.$("main")).boundingBox();
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true, clip: { x: mb.x + x0, y: mb.y + y0, width: x1 - x0, height: y1 - y0 } });
  console.log(name, x1 - x0, y1 - y0);
  await page.close();
}
await browser.close();

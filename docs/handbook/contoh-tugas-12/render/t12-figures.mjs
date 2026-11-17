// Tugas 12 figures, design language v0.1: one idea per crop, captured just above the product's phone breakpoint (576 px; it stacks at 560) so a
// crop prints at a readable size in the picture column. Writes img/<fig>.png (3x) and img/figures.json
// with each crop's size and its callout boxes (CSS px, relative to the crop). Callout boxes are the
// elements' own boxes plus a small margin, so an outline never cuts through text.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const [base = "http://localhost:8765", out] = process.argv.slice(2);
const PAD = 8, CPAD = 4;
const FIG = {
  "12-1-keadaan": { page: "ss32-lihat-bukti", crop: ['[data-ann="keadaan"]'],
    callouts: { A: ['[data-ann="keadaan"] .pin-facts'], B: ['.pin-keadaan-siapa'] } },
  "12-2-kesimpulan": { page: "ss32-lihat-bukti", crop: ['[data-ann="simpulan"] > h2', '[data-memutuskan]', '[data-ann="angka"]'],
    callouts: { C: ['[data-ann="angka"] > .pin-metric:nth-child(1)'], D: ['[data-ann="angka"] > .pin-metric:nth-child(2)'] } },
  "12-3-bagian": { page: "ss32-lihat-bukti", crop: ['[data-ann="bagian"]'],
    callouts: { E: ['[data-ann="bagian"] .pin-rrow:first-child'] } },
  "12-4-keliru": { page: "ss32-lihat-bukti", crop: ['[data-ann="keliru"]'],
    callouts: { F: ['[data-ann="keliru"] .pin-keliru > li:first-child'] } },
  "12-5-sebaran": { page: "ss32-lihat-bukti", crop: ['[data-ann="sebaran"]'],
    callouts: { G: ['[data-ann="sebaran"] .pin-readiness'], H: ['[data-ann="sebaran"] .pin-meta'] } },
  "12-6-per-soal": { page: "ss33-lihat-per-soal", crop: ['[data-ann="soal-0"]'],
    callouts: { I: ['[data-ann="tepat-0"]', '[data-ann="opsi-0"]'], J: ['[data-ann="bantuan-0"]'] } },
  "12-7-belum-cukup": { page: "ss32b-belum-cukup", crop: ['[data-ann="angka"] > .pin-metric:nth-child(1)'],
    callouts: { K: ['[data-ann="angka"] > .pin-metric:nth-child(1) .pin-abs'], L: ['[data-ann="angka"] > .pin-metric:nth-child(1) .pin-ma'] } },
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 576, height: 900 }, deviceScaleFactor: 3 });
const meta = {};
for (const [name, f] of Object.entries(FIG)) {
  const page = await ctx.newPage();
  await page.goto(`${base}/${f.page}.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const union = (sels) => page.evaluate((sels) => {
    const rs = sels.flatMap((s) => [...document.querySelectorAll(s)]).map((e) => e.getBoundingClientRect());
    if (!rs.length) throw new Error("no match: " + sels.join(", "));
    const x0 = Math.min(...rs.map((r) => r.left)) + scrollX, y0 = Math.min(...rs.map((r) => r.top)) + scrollY;
    const x1 = Math.max(...rs.map((r) => r.right)) + scrollX, y1 = Math.max(...rs.map((r) => r.bottom)) + scrollY;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }, sels);
  const c = await union(f.crop);
  const clip = { x: Math.max(0, c.x - PAD), y: Math.max(0, c.y - PAD), width: Math.min(576, c.w + 2 * PAD), height: c.h + PAD + 3 };
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true, clip });
  const callouts = {};
  for (const [letter, sels] of Object.entries(f.callouts)) {
    const r = await union(sels);
    callouts[letter] = { x: Math.round(r.x - CPAD - clip.x), y: Math.round(r.y - CPAD - clip.y), w: Math.round(r.w + 2 * CPAD), h: Math.round(r.h + 2 * CPAD) };
  }
  meta[name] = { w: Math.round(clip.width), h: Math.round(clip.height), callouts };
  await page.close();
}
writeFileSync(`${out}/figures.json`, JSON.stringify(meta, null, 1));
await browser.close();
console.log(JSON.stringify(meta));

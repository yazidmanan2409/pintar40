// Build the Tugas 12 sample: inline D-05 into the page, then print the PDF with the
// pre-installed Chromium. Also reports any page whose content overflows its A4 sheet.
//   node docs/handbook/contoh-tugas-12/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(here, "d05.svg"), "utf8");
const html = readFileSync(join(here, "tugas-12.src.html"), "utf8").replace("{{D05}}", svg);
writeFileSync(join(here, "tugas-12.html"), html);

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(join(here, "tugas-12.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const over = await page.$$eval(".halaman", (hs) => hs.map((h, i) => {
  const kaki = h.querySelector(".kaki");
  const isi = [...h.children].filter((e) => !e.matches(".kaki, .kepala, .tab-peran"));
  const bawahIsi = Math.max(...isi.flatMap((e) => [e, ...e.querySelectorAll("*")]).map((e) => e.getBoundingClientRect().bottom));
  return { halaman: i + 1, lebihMm: Math.round((bawahIsi - kaki.getBoundingClientRect().top) / 3.78) };
}).filter((x) => x.lebihMm > -2));
if (over.length) console.warn("TERLALU PENUH (mm melewati kaki halaman):", JSON.stringify(over));
await page.pdf({ path: join(here, "PINTAR-Buku-Panduan-Contoh-Tugas-12.pdf"), preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log("ok: tugas-12.html, PINTAR-Buku-Panduan-Contoh-Tugas-12.pdf");

// Build PANDUAN-JURI-PINTAR.pdf from panduan-juri.html with the pre-installed Chromium, and warn when a
// page's content runs into its footer.   NODE_PATH=$(npm root -g) node docs/handbook/panduan-juri/build.mjs
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(join(here, "panduan-juri.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const over = await page.$$eval(".halaman", (hs) => hs.map((h, i) => {
  const kaki = h.querySelector(".kaki");
  const isi = [...h.children].filter((e) => !e.matches(".kaki, .kepala, .tab"));
  const bawah = Math.max(...isi.flatMap((e) => [e, ...e.querySelectorAll("*")]).map((e) => e.getBoundingClientRect().bottom));
  return { halaman: i + 1, sisaMm: Math.round((kaki.getBoundingClientRect().top - bawah) / 3.78) };
}));
console.log("ruang tersisa di atas kaki halaman (mm):", JSON.stringify(over));
if (over.some((x) => x.sisaMm < 3)) console.warn("TERLALU PENUH");
await page.pdf({ path: join(here, "PANDUAN-JURI-PINTAR.pdf"), preferCSSPageSize: true, printBackground: true });
await browser.close();

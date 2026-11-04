/**
 * D5 · the four wordmark slots for «Pintar», drawn to scale with the provisional placeholder
 * (master pending F-11). Geometry only: never the artwork, never a master. Run from the repository root:
 *
 *   npx tsx docs/coordination/ux/completion-4.0/D5/buat-d5.mts
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sini = dirname(fileURLToPath(import.meta.url));
const repo = join(sini, "..", "..", "..", "..", "..");
const DS = join(repo, "docs/coordination/ux/sistem-desain");
const LABEL = "Pintar (master pending F-11)";

/** Each slot: the cap height and baseline are fixed; the width follows the master between floor and ceiling. */
const SLOT = [
  { k: "shell-nav", judul: "Shell · staff navigation (expanded)", satuan: "px", cap: 18, min: 66, maks: 120, ruang: 9, letak: "16 px from the navigation's left edge; vertically centred in the 44 px head, beside the collapse control" },
  { k: "shell-bar", judul: "Shell · top bar (under 1024 px; learner, focus, public)", satuan: "px", cap: 16, min: 66, maks: 104, ruang: 8, letak: "16 px from the bar's left edge; vertically centred in the bar" },
  { k: "shell-sendiri", judul: "Shell · standalone (sign-in, the lock, an error page)", satuan: "px", cap: 24, min: 66, maks: 160, ruang: 24, letak: "above the task, aligned to its column's start" },
  { k: "sertifikat", judul: "Certificate · header slot (A4)", satuan: "mm", cap: 3.15, min: 15, maks: 20, ruang: 1.6, letak: "upper right: on «SERTIFIKAT PENGUASAAN»'s baseline, its right edge on the right text margin" },
  { k: "kartu", judul: "Digital Card · front slot", satuan: "mm", cap: 2.9, min: 15, maks: 18, ruang: 1.45, letak: "top left: on the 6 mm text margin, the cap top at 5.57 mm" },
  { k: "email", judul: "Email · header slot (for the master)", satuan: "px", cap: 20, min: 66, maks: 120, ruang: 10, letak: "in a 120 × 40 px box at the frame's top left; the interim logo keeps 104 × 58 until F-11 (D1 P3)" },
] as const;

const kotak = (s: (typeof SLOT)[number]) => {
  const u = s.satuan;
  // the slot box: the cap height, at the ceiling width; the floor and ceiling marked; the clear space dashed around it
  return `<figure class="d5-slot" aria-labelledby="${s.k}-j">
    <figcaption id="${s.k}-j"><strong>${s.judul}</strong><span>cap height ${s.cap} ${u} · width ${s.min}–${s.maks} ${u} · clear space ≥ ${s.ruang} ${u}</span></figcaption>
    <div class="d5-kanvas"><div class="d5-ruang" style="padding:${s.ruang}${u}"><div class="d5-kotak" role="img" aria-label="${LABEL}" style="height:${s.cap}${u};width:${s.maks}${u}">
      <span class="d5-min" style="width:${s.min}${u}"></span><span class="d5-teks">${LABEL}</span></div></div></div>
    <p class="d5-letak">${s.letak}</p></figure>`;
};
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>D5 · the wordmark slots</title>
<style>${readFileSync(join(DS, "render/tokens.css"), "utf8").replace(/url\("\/(fonts\/[^"]+)"\)/g, (_, f) => `url("file://${repo}/public/${f}")`)}</style><style>${readFileSync(join(sini, "d5.css"), "utf8")}</style></head>
<body><main class="d5"><h1>The four wordmark slots, drawn to scale</h1><p>Each box is the slot at its ceiling width and its cap height; the darker band inside is the floor width; the dashed ring is the clear space. The master sits in the box at the box's cap height with its own ratio, between floor and ceiling. Placeholder only: «${LABEL}».</p>
${SLOT.map(kotak).join("")}</main></body></html>`;
mkdirSync(join(sini, "render"), { recursive: true });
writeFileSync(join(sini, "render/slot.html"), html);
const req = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = req("playwright");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 })).newPage();
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: join(sini, "render/slot.png"), fullPage: true });
const label = await page.evaluate(`[].every.call(document.querySelectorAll(".d5-kotak"), function (k) { return k.getAttribute("aria-label") === ${JSON.stringify(LABEL)} && k.textContent.indexOf(${JSON.stringify(LABEL)}) >= 0; })`) as boolean;
await browser.close();
const ringkas = `${SLOT.length} slots drawn; every slot labelled «${LABEL}»: ${label ? "yes" : "NO"}\n`;
writeFileSync(join(sini, "render/laporan.txt"), ringkas);
console.log(ringkas);
process.exit(label ? 0 : 1);

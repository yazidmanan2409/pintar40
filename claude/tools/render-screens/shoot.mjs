// Screenshot every rendered page at both widths. See ./README.md.
//
// IT SERVES OVER HTTP RATHER THAN OPENING file://, and that is not a detail.
// The compiled stylesheet references its assets absolutely — `/fonts/…` for the
// self-hosted faces, `/brand/…` for the mark — because that is how Next serves
// `public/`. Under `file://` a leading slash resolves to the FILESYSTEM ROOT, so
// every one of those requests fails silently and the page renders in the system
// fallback stack with a broken image where the logo should be. A review screen
// in the wrong typeface is worse than no review screen: it looks fine, and it
// is evidence of something that is not what ships.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readdirSync, mkdirSync, cpSync, existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";

const dir = resolve(process.argv[2] ?? "");
if (!dir || !existsSync(join(dir, "pintar.css"))) {
  console.error("usage: node claude/tools/render-screens/shoot.mjs <out-dir>  (run stylesheet.mjs and screens.tsx first)");
  process.exit(2);
}

const shots = join(dir, "shots");
mkdirSync(shots, { recursive: true });
// the same assets Next serves from public/, at the same paths
for (const asset of ["fonts", "brand"]) {
  if (existsSync(join("public", asset))) cpSync(join("public", asset), join(dir, asset), { recursive: true });
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".png": "image/png",
  ".woff2": "font/woff2", ".svg": "image/svg+xml", ".jpg": "image/jpeg",
};
const server = createServer((req, res) => {
  const path = join(dir, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!path.startsWith(dir) || !existsSync(path) || statSync(path).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
  res.end(readFileSync(path));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--force-color-profile=srgb"],
});

const widths = [[1280, 900, "desktop"], [390, 844, "phone"]];
const missing = new Set();
let n = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".html")).sort()) {
  for (const [width, height, tag] of widths) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    // A failed asset must be loud. Silence is how the wrong typeface ships.
    page.on("requestfailed", (r) => missing.add(new URL(r.url()).pathname));
    page.on("response", (r) => { if (r.status() >= 400) missing.add(new URL(r.url()).pathname); });
    await page.goto(`${base}/${file}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(shots, `${file.replace(".html", "")}.${tag}.png`), fullPage: true });
    await page.close();
    n++;
  }
}
await browser.close();
server.close();

console.log(`screenshots: ${n} → ${shots}`);
if (missing.size) {
  console.error(`\nASSETS FAILED TO LOAD — these screens are not what ships:\n  ${[...missing].join("\n  ")}`);
  process.exit(1);
}
console.log("every referenced asset loaded");

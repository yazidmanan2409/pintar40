// Screenshot every rendered page at both widths. See ./README.md.
import { chromium } from "playwright";
import { readdirSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const dir = resolve(process.argv[2] ?? "");
if (!dir || !existsSync(join(dir, "pintar.css"))) {
  console.error("usage: node claude/tools/render-screens/shoot.mjs <out-dir>  (run stylesheet.mjs and screens.tsx first)");
  process.exit(2);
}

const shots = join(dir, "shots");
mkdirSync(shots, { recursive: true });
// the self-hosted faces have to be reachable from a file:// page, or every
// screen silently falls back to the system stack and the review is of the
// wrong typeface
cpSync("public/fonts", join(dir, "fonts"), { recursive: true });

// The pre-installed browser, not the build a fresh `playwright` expects.
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--force-color-profile=srgb"],
});

const widths = [[1280, 900, "desktop"], [390, 844, "phone"]];
let n = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".html")).sort()) {
  for (const [width, height, tag] of widths) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await page.goto("file://" + join(dir, file));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(shots, `${file.replace(".html", "")}.${tag}.png`), fullPage: true });
    await page.close();
    n++;
  }
}
await browser.close();
console.log(`screenshots: ${n} → ${shots}`);

// Screens for review. Reuses the CDP driver written for Mini-PINTAR rather
// than keeping a second copy: it is generic, and two copies drift.
import { serve, launch, Page } from "../../../../website/mini-pintar/app/verify/driver.mjs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const OUT = join(APP, "screens");

const site = await serve(APP);
const b = await launch();
const p = await Page.open(b.pageUrl);
const BASE = `http://127.0.0.1:${site.port}/`;

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const [w, h, tag, lang] of [
  [1280, 1400, "desktop-id", "id"], [1280, 1400, "desktop-en", "en"],
  [390, 1800, "mobile-id", "id"],
]) {
  await p.viewport(w, h);
  await p.goto(BASE + `?lang=${lang}`);
  await p.screenshot(join(OUT, `${tag}.png`));
}
console.log("screens written to", OUT);
await b.kill();
await site.close();

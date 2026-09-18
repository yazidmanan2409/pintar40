import { serve, launch, Page } from "../../../../website/mini-pintar/app/verify/driver.mjs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, ".."), OUT = join(APP, "screens");
const site = await serve(APP); const b = await launch(); const p = await Page.open(b.pageUrl);
const BASE = `http://127.0.0.1:${site.port}/`;
await rm(OUT, { recursive: true, force: true }); await mkdir(OUT, { recursive: true });
for (const s of ["beranda","umpan-mulai","umpan-pertanyaan","umpan-terbit","umpan-hasil","umpan-tipis"]) {
  await p.viewport(1280, 1400); await p.goto(`${BASE}?screen=${s}`);
  await p.screenshot(join(OUT, `desktop-${s}.png`));
}
await p.viewport(390, 1700); await p.goto(`${BASE}?screen=beranda`);
await p.screenshot(join(OUT, "mobile-beranda.png"));
await p.viewport(1280, 1400); await p.goto(`${BASE}?screen=beranda&lang=en`);
await p.screenshot(join(OUT, "desktop-en-beranda.png"));
console.log("screens written");
await b.kill(); await site.close();

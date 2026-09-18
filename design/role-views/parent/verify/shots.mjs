import { serve, launch, Page } from "../../../../website/mini-pintar/app/verify/driver.mjs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, ".."), OUT = join(APP, "screens");
const site = await serve(APP); const b = await launch(); const p = await Page.open(b.pageUrl);
const BASE = `http://127.0.0.1:${site.port}/`;
await rm(OUT, { recursive: true, force: true }); await mkdir(OUT, { recursive: true });
for (const st of ["berjalan", "belum-cukup", "perlu-perhatian"]) {
  for (const [w, h, tag, lang] of [[1280, 1100, "desktop", "id"], [390, 1400, "mobile", "id"]]) {
    await p.viewport(w, h);
    await p.goto(`${BASE}?lang=${lang}&state=${st}`);
    await p.screenshot(join(OUT, `${tag}-${st}.png`));
  }
}
await p.viewport(1280, 1100);
await p.goto(`${BASE}?lang=en&state=berjalan`);
await p.screenshot(join(OUT, "desktop-en-berjalan.png"));
console.log("screens written");
await b.kill(); await site.close();

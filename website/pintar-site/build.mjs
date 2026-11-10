// Builds the public website into site/: plain HTML, one file per page and
// language, with relative links, so the folder can be uploaded to any static
// host as it is. No dependencies; run with `node build.mjs`.
//
//   node build.mjs            review build: every page carries noindex
//   node build.mjs --publish  publication build: indexable (only once the owner approves)
//   --origin=https://…        the production address; adds the share image and absolute share links

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUTES, context, page } from "./src/core.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "site");
const review = !process.argv.includes("--publish");
const origin = (process.argv.find((a) => a.startsWith("--origin=")) || "").slice(9).replace(/\/+$/, "");

const PAGES = {
  home: "home", why: "why", features: "features", audiences: "audiences",
  trust: "trust", contact: "contact", privacy: "privacy", terms: "terms",
};

let n = 0;
for (const [key, mod] of Object.entries(PAGES)) {
  const render = (await import(`./src/pages/${mod}.mjs`).catch((e) => { if (e.code === "ERR_MODULE_NOT_FOUND") return {}; throw e; })).default;
  if (!render) { console.warn(`  (skipped ${key}: no page module yet)`); continue; }
  for (const lang of ["id", "en"]) {
    const c = context(lang, key);
    const { title, description, body } = render(c);
    const file = join(OUT, ROUTES[key][lang], "index.html");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, page(c, { title, description, body, review, origin }));
    n += 1;
  }
}

// The review document lives beside the site, not in it: it is never uploaded.
const reviewDoc = (await import("./src/review.mjs").catch(() => ({}))).default;
if (reviewDoc) { await mkdir(join(HERE, "review"), { recursive: true }); await writeFile(join(HERE, "review", "index.html"), reviewDoc()); }

console.log(`${n} pages written to site/ (${review ? "review build, noindex" : "publication build"}); review/index.html written.`);

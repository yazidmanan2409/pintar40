// Prepares the website's images. Put an original in images/ named after its
// slot (P1.png, P2.jpg … see src/core.mjs PHOTOS and images/README.md), then
// run `node images.mjs` and `node build.mjs`. Each original becomes WebP files
// at 640, 1024, 1600 and (when the original is large enough) 2400 px wide in
// site/assets/img/, with all metadata removed. The originals stay in images/
// and are never uploaded. Needs ffmpeg.

import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PHOTOS, IMG_WIDTHS } from "./src/core.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "images");
const OUT = join(HERE, "site", "assets", "img");
mkdirSync(OUT, { recursive: true });

const width = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width", "-of", "csv=p=0", file]).toString().trim());

let n = 0;
for (const f of existsSync(SRC) ? readdirSync(SRC) : []) {
  const m = /^(P\d+)\.(png|jpe?g|webp)$/i.exec(f);
  if (!m || !PHOTOS[m[1]]) continue;
  const file = join(SRC, f), w0 = width(file);
  for (const w of IMG_WIDTHS) {
    if (w > 1600 && w > w0) continue; // never invent detail above 1600 px
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-map_metadata", "-1", "-vf", `scale=${w}:-2:flags=lanczos`,
      "-c:v", "libwebp", "-quality", "80", "-compression_level", "6", join(OUT, `${m[1]}-${w}.webp`)]);
  }
  console.log(`${m[1]}: ${f} (${w0} px) → ${IMG_WIDTHS.filter((w) => w <= 1600 || w <= w0).join(", ")} px`);
  n += 1;
}
console.log(n ? `${n} image(s) prepared in site/assets/img/. Now run node build.mjs.` : "No originals found in images/.");

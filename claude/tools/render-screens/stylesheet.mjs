// Compile src/app/globals.css (and the experience stylesheet it imports)
// exactly as the Next build does, so the screens are painted by the real
// tokens rather than by a copy of them. See ./README.md.
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2];
if (!out) {
  console.error("usage: node claude/tools/render-screens/stylesheet.mjs <out-dir>");
  process.exit(2);
}
mkdirSync(out, { recursive: true });

const src = readFileSync("src/app/globals.css", "utf8");
const css = await postcss([tailwind()]).process(src, { from: "src/app/globals.css", to: null });
writeFileSync(join(out, "pintar.css"), css.css);
console.log(`stylesheet: ${css.css.length} bytes → ${join(out, "pintar.css")}`);

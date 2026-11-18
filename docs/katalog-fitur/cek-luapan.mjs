// Overflow check for katalog.html: lists any box whose content is wider than the box, or that sticks out of its parent.
// Usage: NODE_PATH=$(npm root -g) node cek-luapan.mjs "$PWD/katalog.html" [viewport width; default 794 = A4]. Run at 794 and at 650.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: Number(process.argv[3]||794), height: 1123 } });
await p.goto("file://" + process.argv[2], { waitUntil: "networkidle" });
await p.emulateMedia({ media: "print" });
const out = await p.evaluate(() => {
  const bad = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "inline" || !el.clientWidth) continue;
    if (el.scrollWidth > el.clientWidth + 1) bad.push(`${el.tagName}.${el.className} «${el.textContent.trim().slice(0,50)}» ${el.scrollWidth}>${el.clientWidth}`);
    // text sticking out of a box's right edge relative to parent
    const r = el.getBoundingClientRect(), pr = el.parentElement.getBoundingClientRect();
    if (r.right > pr.right + 1 && cs.position !== "absolute") bad.push(`OUT ${el.tagName}.${el.className} «${el.textContent.trim().slice(0,50)}» ${Math.round(r.right-pr.right)}px`);
  }
  return bad;
});
console.log(out.length ? out.join("\n") : "no overflow"); await b.close();

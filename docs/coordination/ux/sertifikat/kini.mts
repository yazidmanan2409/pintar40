/**
 * Sertifikat, round 1: THE CURRENT IMPLEMENTATION, PRINTED. Evidence for the
 * README's "conflicts with the current implementation"; not a design.
 *
 * It reuses the repository's own review harness (claude/tools/render-screens),
 * which renders the real KartuSertifikat component with the real compiled
 * stylesheet and copy table, and assembles the issued page the way
 * src/app/belajar/[tugas]/sertifikat/page.tsx does: the on-screen certificate,
 * the actions, then the A4 sheet in its well. Then it prints that page as
 * Chrome's print dialog would by default (A4, «Default» margins, «Headers and
 * footers» on, «Background graphics» off), and once more with every option in
 * the sheet's favour, and screenshots the page at 390 and 1280 px.
 *
 *   node claude/tools/render-screens/stylesheet.mjs "$OUT"
 *   npx tsx claude/tools/render-screens/screens.tsx "$OUT"   # see the README: a server-only shim may be needed
 *   KARTU_PY=/path/to/venv/bin/python npx tsx docs/coordination/ux/sertifikat/kini.mts "$OUT"
 *
 * Every name, number and token is the harness's own invented sample.
 */
import { readFileSync, writeFileSync, cpSync, existsSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const OUT = resolve(process.argv[2] ?? "");
const RENDER = join(process.cwd(), "docs/coordination/ux/sertifikat/render");
const halaman = readFileSync(join(OUT, "02-sertifikat-berlaku.id.html"), "utf8");
const cetak = readFileSync(join(OUT, "06-cetak-a4.id.html"), "utf8");

// page.tsx, ISSUED: …KartuSertifikat, the actions, then the print head and the sheet, then the footer
const kepala = cetak.match(/<div class="pin-head">[\s\S]*?<\/div>/)![0]
  .replace(/<p class="pin-eyebrow">/, '<p class="pin-eyebrow pin-noprint">')
  .replace(/<h1 class="pin-h1">/, '<h2 class="pin-h1 pin-noprint">').replace(/<\/h1>/, "</h2>")
  .replace(/<p class="pin-intro">/, '<p class="pin-intro pin-noprint">')
  .replace('<div class="pin-head">', '<div class="pin-head" style="margin-top:var(--space-9)">');
const sumur = cetak.match(/<div class="pin-printwell">[\s\S]*?<\/div><\/div><\/div><\/div><\/div><\/div>/)?.[0];
if (!sumur) throw new Error("the sheet was not found in 06-cetak-a4");
const rakit = halaman.replace(/(<div class="pin-actions pin-noprint">[\s\S]*?<\/div>)/, `$1${kepala}${sumur}`);
if (!rakit.includes("pin-sheet")) throw new Error("the sheet was not placed");
writeFileSync(join(OUT, "kini-halaman.html"), rakit);
for (const a of ["fonts", "brand"]) if (existsSync(join("public", a))) cpSync(join("public", a), join(OUT, a), { recursive: true });

const JENIS: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const p = join(OUT, decodeURIComponent(new URL(req.url!, "http://x").pathname));
  if (!p.startsWith(OUT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": JENIS[extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
});
await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
const alamat = `http://127.0.0.1:${(server.address() as { port: number }).port}/kini-halaman.html`;

const { chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright");
const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });
const hilang: string[] = [];
async function buka(lebar: number) {
  const ctx = await browser.newContext({ viewport: { width: lebar, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on("response", (r: { status(): number; url(): string }) => { if (r.status() >= 400) hilang.push(r.url()); });
  await p.goto(alamat);
  await p.evaluate(() => document.fonts.ready);
  // LembarA4's scaling, as the harness's FIT script does it
  await p.evaluate(() => {
    const b = document.getElementById("sheetbox")!; const sh = b.firstElementChild as HTMLElement;
    const s = Math.min(1, b.clientWidth / 794); sh.style.transform = `scale(${s})`; b.style.height = `${Math.round(1123 * s)}px`;
  });
  return { ctx, p };
}
for (const lebar of [390, 1280]) {
  const { ctx, p } = await buka(lebar);
  await p.screenshot({ path: join(RENDER, `kini-layar-${lebar}.png`), fullPage: true });
  await ctx.close();
}
const hasil: string[] = [];
for (const [nama, o] of [
  // Chrome's print preview as it opens: A4, «Default» margins (about 10 mm), headers and footers on, background graphics off
  ["kini-cetak-bawaan.pdf", { margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }, displayHeaderFooter: true, printBackground: false }],
  // every option in the sheet's favour: no margins, no headers, background graphics on
  ["kini-cetak-terbaik.pdf", { margin: { top: "0", bottom: "0", left: "0", right: "0" }, displayHeaderFooter: false, printBackground: true }],
] as const) {
  const { ctx, p } = await buka(1280);
  await p.emulateMedia({ media: "print" });
  await p.pdf({ path: join(RENDER, nama), format: "A4", ...o });
  hasil.push(`${nama}: written`);
  await ctx.close();
}
await browser.close();
server.close();
if (hilang.length) throw new Error(`assets failed: ${hilang.join(", ")}`);
// page images of both PDFs (KARTU_PY: a Python with PyMuPDF, as the render script's)
execFileSync(process.env.KARTU_PY ?? "python3", ["-c", `
import pymupdf, sys
for n in ("kini-cetak-bawaan", "kini-cetak-terbaik"):
    d = pymupdf.open(sys.argv[1] + "/" + n + ".pdf")
    for i, pg in enumerate(d):
        pg.get_pixmap(dpi=60).save(sys.argv[1] + "/" + n + "-" + str(i + 1) + ".png")
`, RENDER]);
console.log(hasil.join("\n"));

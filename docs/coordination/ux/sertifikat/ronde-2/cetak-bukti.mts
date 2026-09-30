/**
 * Sertifikat round 2 (G): THE PRINT PROOF. Today's certificate page, printed
 * before and after the proposed change (cetak-usulan.css), with round 1's
 * harness: the repository's review tooling (claude/tools/render-screens)
 * renders the real KartuSertifikat with the real compiled stylesheet, and the
 * page is assembled the way src/app/belajar/[tugas]/sertifikat/page.tsx does:
 * the on-screen certificate, the actions, the print heading, the A4 sheet in
 * its well. Evidence, not a design; nothing in src/ changes.
 *
 *   node claude/tools/render-screens/stylesheet.mjs "$OUT"
 *   npx tsx claude/tools/render-screens/screens.tsx "$OUT"   # a server-only shim may be needed (../README.md)
 *   KARTU_PY=/path/to/venv/bin/python npx tsx docs/coordination/ux/sertifikat/ronde-2/cetak-bukti.mts "$OUT"
 *
 * "After" is the same page with the stylesheet's one `@media print` block
 * replaced by the proposal, exactly as the proposal replaces it in
 * src/app/experience.css. Each is printed by Chromium (Playwright) as:
 *   1. the print dialog as it opens: A4, «Default» margins (about 10 mm, or the
 *      page's own @page margin when it declares one), «Headers and footers» on,
 *      «Background graphics» off;
 *   2. every option in the sheet's favour: no margins, no headers, backgrounds on;
 *   3. Letter paper instead of A4 (a printer set to Letter);
 *   4. the reader overriding the margins with 10 mm, headers on (emulated by
 *      giving the page 10 mm margins: Chromium's PDF printer lets a page's own
 *      @page margin win over the one it is given, as the dialog's «Default» does).
 * Every name, number and token is the harness's own invented sample.
 */
import { readFileSync, writeFileSync, cpSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const OUT = resolve(process.argv[2] ?? "");
const DIR = join(process.cwd(), "docs/coordination/ux/sertifikat/ronde-2");
const RENDER = join(DIR, "render");
mkdirSync(RENDER, { recursive: true });
const PY = process.env.KARTU_PY ?? "python3";
const halaman = readFileSync(join(OUT, "02-sertifikat-berlaku.id.html"), "utf8");
const cetak = readFileSync(join(OUT, "06-cetak-a4.id.html"), "utf8");

// page.tsx, ISSUED: …KartuSertifikat, the actions, then the print head and the sheet, then the footer (as ../kini.mts)
const kepala = cetak.match(/<div class="pin-head">[\s\S]*?<\/div>/)![0]
  .replace(/<p class="pin-eyebrow">/, '<p class="pin-eyebrow pin-noprint">')
  .replace(/<h1 class="pin-h1">/, '<h2 class="pin-h1 pin-noprint">').replace(/<\/h1>/, "</h2>")
  .replace(/<p class="pin-intro">/, '<p class="pin-intro pin-noprint">')
  .replace('<div class="pin-head">', '<div class="pin-head" style="margin-top:var(--space-9)">');
const sumur = cetak.match(/<div class="pin-printwell">[\s\S]*?<\/div><\/div><\/div><\/div><\/div><\/div>/)?.[0];
if (!sumur) throw new Error("the sheet was not found in 06-cetak-a4");
const sebelum = halaman.replace(/(<div class="pin-actions pin-noprint">[\s\S]*?<\/div>)/, `$1${kepala}${sumur}`);
if (!sebelum.includes("pin-sheet")) throw new Error("the sheet was not placed");

// AFTER: the stylesheet's one print block replaced by the proposal, nothing else
const usulan = readFileSync(join(DIR, "cetak-usulan.css"), "utf8");
function gantiBlokCetak(html: string): string {
  const awal = html.indexOf("@media print {");
  if (awal < 0 || html.indexOf("@media print {", awal + 1) >= 0) throw new Error("expected exactly one @media print block in the compiled stylesheet");
  let i = awal + "@media print {".length, dalam = 1;
  while (dalam > 0) { const c = html[i++]; if (c === "{") dalam++; else if (c === "}") dalam--; }
  const lama = html.slice(awal, i);
  for (const s of [".pin-noprint", ".pin-printwell", ".pin-sheetbox", ".pin-sheet", ".pin-col"]) if (!lama.includes(s)) throw new Error(`the print block no longer holds ${s}: the proposal's premise changed`);
  return html.slice(0, awal) + usulan + html.slice(i);
}
const sesudah = gantiBlokCetak(sebelum);
// scenario 4: the reader's own 10 mm margins, emulated on the page
const sesudahMargin = sesudah.replace("@page sertifikat {\n  size: A4 portrait;\n  margin: 0;\n}", "@page sertifikat {\n  size: A4 portrait;\n  margin: 10mm;\n}");
if (sesudahMargin === sesudah) throw new Error("the margin emulation did not apply");
writeFileSync(join(OUT, "g-sebelum.html"), sebelum);
writeFileSync(join(OUT, "g-sesudah.html"), sesudah);
writeFileSync(join(OUT, "g-sesudah-margin.html"), sesudahMargin);
writeFileSync(join(OUT, "g-sebelum-margin.html"), sebelum);
for (const a of ["fonts", "brand"]) if (existsSync(join("public", a))) cpSync(join("public", a), join(OUT, a), { recursive: true });

const JENIS: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const p = join(OUT, decodeURIComponent(new URL(req.url!, "http://x").pathname));
  if (!p.startsWith(OUT) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": JENIS[extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
});
await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
const asal = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

const { chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright");
const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });
const hilang: string[] = [];
const SEPULUH = { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" };
const NOL = { top: "0", bottom: "0", left: "0", right: "0" };
const SKENARIO = [
  { kode: "bawaan", nama: "The print dialog as it opens (A4, «Default» margins, headers and footers on, background graphics off)", o: { format: "A4", margin: SEPULUH, displayHeaderFooter: true, printBackground: false, preferCSSPageSize: true }, berkas: "" },
  { kode: "terbaik", nama: "Every option in the sheet's favour (no margins, no headers, background graphics on)", o: { format: "A4", margin: NOL, displayHeaderFooter: false, printBackground: true, preferCSSPageSize: true }, berkas: "" },
  { kode: "letter", nama: "Letter paper instead of A4 (a printer set to Letter), otherwise as the dialog opens", o: { format: "Letter", margin: SEPULUH, displayHeaderFooter: true, printBackground: false, preferCSSPageSize: false }, berkas: "" },
  { kode: "margin", nama: "The reader overrides the margins: 10 mm on every side, headers and footers on", o: { format: "A4", margin: SEPULUH, displayHeaderFooter: true, printBackground: false, preferCSSPageSize: true }, berkas: "-margin" },
] as const;
const pdfs: Array<{ versi: string; skenario: string; pdf: string }> = [];
for (const versi of ["sebelum", "sesudah"] as const) for (const s of SKENARIO) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on("response", (r: { status(): number; url(): string }) => { if (r.status() >= 400) hilang.push(r.url()); });
  await p.goto(`${asal}/g-${versi}${s.berkas}.html`);
  await p.evaluate(() => document.fonts.ready);
  // LembarA4's screen scale, as the harness's FIT script sets it
  await p.evaluate(() => {
    const b = document.getElementById("sheetbox")!; const sh = b.firstElementChild as HTMLElement;
    const k = Math.min(1, b.clientWidth / 794); sh.style.transform = `scale(${k})`; b.style.height = `${Math.round(1123 * k)}px`;
  });
  await p.emulateMedia({ media: "print" });
  const pdf = join(RENDER, `G-${versi}-${s.kode}.pdf`);
  await p.pdf({ path: pdf, ...s.o });
  pdfs.push({ versi, skenario: s.kode, pdf });
  await ctx.close();
}

// MEASURED: pages, page size, what the browser printed in the margins, how many
// copies of the certificate, the rule, the sheet's place, and the QR read back
type Ukur = { pdf: string; halaman: number; ukuran: number[]; tepi: string[]; nama: number; garis: number; lembar_atas: number | null; qr: boolean; png: string[] };
const ukur = JSON.parse(execFileSync(PY, ["-c", `
import json, sys, importlib.util, os
import pymupdf, numpy as np, cv2
spec = importlib.util.spec_from_file_location("r1", os.path.join(sys.argv[1], "..", "uji-sertifikat.py")); r1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r1)
out = []
mm = 25.4 / 72
for p in json.loads(sys.argv[2]):
    d = pymupdf.open(p)
    tepi, nama, garis, atas, png = [], 0, 0, None, []
    for i, pg in enumerate(d):
        h = pg.rect.height
        for b in pg.get_text("blocks"):
            if b[1] < 10 / mm or b[3] > h - 10 / mm:
                t = " ".join(b[4].split())
                if t and not any(x in t for x in ("SMA Peragaan", "Rani", "Periksa", "PREDIKAT", "https://pintar.sekolah")): tepi.append(t)
        nama += len(pg.search_for("Rani Kusumawati"))
        for dr in pg.get_drawings():
            f = dr.get("fill"); r = dr["rect"]
            if f and abs(f[0] - 0x24/255) < 0.02 and abs(f[1] - 0x5F/255) < 0.02 and abs(f[2] - 0x55/255) < 0.02 and 8 < r.width * mm < 14 and r.height * mm < 1: garis += 1
        if atas is None:
            r = pg.search_for("SMA Peragaan Nusantara")
            if r: atas = round(r[-1].y0 * mm, 1)
        f = os.path.join(sys.argv[3], os.path.basename(p).replace(".pdf", f"-{i + 1}.png")); pg.get_pixmap(dpi=60).save(f); png.append(f)
    # the sheet's QR, read back from the whole last page at 300 dpi
    img = r1._raster(p, len(d) - 1, 300)
    qr = r1._baca(img, "https://pintar.sekolah-peragaan.sch.id/verifikasi/k7QmX2vR9pLwB4tHs8NcY1eDfZ6uJ0aGqKo3iVbMnTx")
    out.append({"pdf": p, "halaman": len(d), "ukuran": [round(d[0].rect.width * mm, 1), round(d[0].rect.height * mm, 1)], "tepi": tepi, "nama": nama, "garis": garis, "lembar_atas": atas, "qr": bool(qr["zxing"] or qr["opencv"]), "png": png})
print(json.dumps(out))
`, DIR, JSON.stringify(pdfs.map((x) => x.pdf)), OUT]).toString()) as Ukur[];

const baris: string[] = [];
const catat = (s: string) => baris.push(s);
let gagal = 0;
catat("G · THE PRINT PROOF: today's certificate page (the review harness: the real KartuSertifikat and the real compiled stylesheet), printed by Chromium before and after cetak-usulan.css");
for (const s of SKENARIO) {
  catat("");
  catat(s.nama);
  for (const versi of ["sebelum", "sesudah"] as const) {
    const i = pdfs.findIndex((x) => x.versi === versi && x.skenario === s.kode);
    const u = ukur[i];
    catat(`  ${versi === "sebelum" ? "BEFORE" : "AFTER "} ${u.halaman} page(s), ${u.ukuran.join(" × ")} mm; the certificate printed ${u.nama} time(s); the green rule ${u.garis ? "printed" : "MISSING"}; the sheet's first line ${u.lembar_atas ?? "—"} mm from the page top; QR read back ${u.qr ? "yes" : "no"}; the browser's own lines: ${u.tepi.length ? u.tepi.map((t) => `«${t}»`).join(" ") : "none"}`);
    if (versi === "sesudah" && ["bawaan", "terbaik"].includes(s.kode)) {
      const ok = u.halaman === 1 && Math.abs(u.ukuran[0] - 210) < 0.6 && Math.abs(u.ukuran[1] - 297) < 0.6 && u.nama === 1 && u.garis === 1 && u.tepi.length === 0 && u.qr;
      if (!ok) { gagal++; catat("    ^ the fix does not give one clean A4 page here"); }
    }
  }
}
await browser.close();
server.close();
if (hilang.length) throw new Error(`assets failed: ${hilang.join(", ")}`);

// THE BOARD: each scenario, before and after, page by page
const img = (f: string) => `<img src="file://${f}" style="height:95mm;border:0.3mm solid rgba(31,42,51,.25);background:#fff;display:block">`;
const papan = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "PJS"; font-weight: 200 800; src: url("file://${process.cwd()}/public/fonts/plus-jakarta-sans-latin.woff2") format("woff2"); }
body { margin: 0; background: #E6E3DC; font-family: "PJS"; color: #1F2A33; }
.l { padding: 8mm; width: 330mm; } h1 { font: 600 13pt "PJS"; margin: 0 0 1.4mm; } .sub { font: 400 8pt/1.5 "PJS"; color: #4E5A64; margin: 0 0 6mm; }
h2 { font: 600 9.5pt "PJS"; margin: 0 0 3mm; } .r { display: flex; gap: 10mm; margin-bottom: 8mm; } .k { display: flex; gap: 3mm; align-items: flex-start; }
.v { font: 600 8pt "PJS"; margin: 0 0 2mm; } .ket { font: 400 7pt/1.45 "PJS"; color: #4E5A64; margin: 2mm 0 0; max-width: 150mm; }
</style></head><body><div class="l"><h1>G · The print proof: today's certificate page, before and after the proposal</h1>
<p class="sub">The review harness renders the real KartuSertifikat with the real compiled stylesheet, assembled as the certificate page is. Chromium prints it. «After» changes one thing: the stylesheet's print block, replaced by cetak-usulan.css. Every page each print produced is shown, at the same scale.</p>
${SKENARIO.map((s) => `<h2>${s.nama}</h2><div class="r">${(["sebelum", "sesudah"] as const).map((versi) => { const u = ukur[pdfs.findIndex((x) => x.versi === versi && x.skenario === s.kode)]; return `<div><p class="v">${versi === "sebelum" ? "Before" : "After"}: ${u.halaman} page${u.halaman > 1 ? "s" : ""}</p><div class="k">${u.png.map(img).join("")}</div><p class="ket">Certificate printed ${u.nama}×; green rule ${u.garis ? "printed" : "missing"}; QR read back ${u.qr ? "yes" : "no"}; browser's lines: ${u.tepi.length ? u.tepi.map((t) => `«${t.replace(/</g, "&lt;")}»`).join(" ") : "none"}.</p></div>`; }).join("")}</div>`).join("")}
</div></body></html>`;
const fPapan = join(OUT, "g-papan.html");
writeFileSync(fPapan, papan);
{
  const b2 = await chromium.launch();
  const p = await (await b2.newContext({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(`file://${fPapan}`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(RENDER, "G-cetak-sebelum-sesudah.png"), fullPage: true });
  await b2.close();
}
writeFileSync(join(RENDER, "G-laporan.txt"), baris.join("\n") + "\n");
console.log(baris.join("\n"));
console.log(gagal ? `\n${gagal} check(s) FAILED` : "\nthe fix gives one clean A4 page");
process.exit(gagal ? 1 : 0);

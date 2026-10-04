/**
 * THE REVIEW HARNESS for the design system proposal. Review tooling, not
 * product code, and not part of the published system.
 *
 * It does what the Design System page does with these files: compiles
 * tokens.css from tokens.json (colour variables, the other families, a class
 * per type style, @font-face per font), loads bundle.css and bundle.js, and
 * renders each components/<Comp>/preview.html in Chromium at its card width.
 * Then it checks each preview:
 *   - no script error and no failed request;
 *   - axe-core, WCAG 2.0/2.1/2.2 A and AA, colour contrast included;
 *   - nothing wider than the card (no sideways scroll);
 *   - every control at least 24 px (WCAG 2.5.8); PINTAR's 44 px is reported;
 *   - with --sempit, the same at 390 px wide.
 * It writes render/<Comp>.png and render/laporan.txt, and exits non-zero on
 * any failure.
 *
 *   npx tsx docs/coordination/ux/sistem-desain/alat/pratinjau.mts [Comp ...] [--sempit]
 */
import { createServer } from "node:http";
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const sini = dirname(fileURLToPath(import.meta.url));
const akar = join(sini, "..");
const repo = join(akar, "..", "..", "..", "..");
const proyek = join(akar, "project");
const keluaran = join(akar, "render");
mkdirSync(keluaran, { recursive: true });

const globalRoot = execSync("npm root -g").toString().trim();
const req = createRequire(join(globalRoot, "x.js"));
const { chromium } = req("playwright");
const axeSumber = readFileSync(join(repo, "node_modules", "axe-core", "axe.min.js"), "utf8");

// ── tokens.css, as the page compiles it ────────────────────────────────
type Tok = { name: string; value: unknown; usage?: string };
const tokens = JSON.parse(readFileSync(join(proyek, "tokens.json"), "utf8"));
function tokensCss(): string {
  const tema = tokens.color.themes[0].id;
  const nilai = (t: Tok) => (typeof t.value === "string" ? t.value : (t.value as Record<string, string>)[tema]);
  const warna = (tokens.color.tokens as Tok[]).map((t) => {
    const v = nilai(t);
    const m = /^\{(.+)\}$/.exec(v);
    return `  --${t.name}: ${m ? `var(--${m[1]})` : v};`;
  });
  const lain: string[] = [];
  for (const [k, fam] of Object.entries(tokens)) {
    if (["name", "version", "meta", "color", "type"].includes(k)) continue;
    for (const t of (fam as { tokens: Tok[] }).tokens) lain.push(`  --${t.name}: ${t.value};`);
  }
  for (const [k, v] of Object.entries(tokens.type.families as Record<string, string>)) lain.push(`  --font-${k}: ${v};`);
  const kelas: string[] = [];
  for (const g of tokens.type.groups) {
    for (const s of g.styles) {
      const fam = s.family ?? g.family;
      kelas.push(`.${s.name} { font-family: var(--font-${fam}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};${s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : ""}${s.name === "t-eyebrow" ? " text-transform: uppercase;" : ""}${/stat/.test(s.name) ? " font-variant-numeric: tabular-nums;" : ""} }`);
    }
  }
  const huruf = (tokens.type.fonts as Array<{ family: string; file: string; weight: string; style?: string }>).map(
    (f) => `@font-face { font-family: "${f.family}"; src: url("/${f.file}") format("woff2"); font-weight: ${f.weight}; font-style: ${f.style ?? "normal"}; font-display: block; }`,
  );
  return `${huruf.join("\n")}\n:root, [data-theme="${tema}"] {\n${warna.join("\n")}\n}\n:root {\n${lain.join("\n")}\n}\n${kelas.join("\n")}\n`;
}
const tokensCssTeks = tokensCss();
writeFileSync(join(keluaran, "tokens.css"), tokensCssTeks);

// ── a preview, framed the way the page frames it ──────────────────────
function bingkai(nama: string): { html: string; tinggi: number; lebar: number } {
  const isi = readFileSync(join(proyek, "components", nama, "preview.html"), "utf8");
  const tanda = /^<!--\s*@dsCard([^>]*)-->/.exec(isi);
  const attr = tanda ? tanda[1] : "";
  const tinggi = Number(/height=(\d+)/.exec(attr)?.[1] ?? 120);
  const lebar = Number(/width=(\d+)/.exec(attr)?.[1] ?? 960);
  const html = `<!doctype html><html lang="id" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${nama}</title>
<link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/components/bundle.css"><script src="/components/bundle.js"></script></head><body>${isi}</body></html>`;
  return { html, tinggi, lebar };
}

const halaman = new Map<string, string>();
const tipe: Record<string, string> = { ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".html": "text/html" };
const server = createServer((r, w) => {
  const url = decodeURIComponent((r.url ?? "/").split("?")[0]);
  if (halaman.has(url)) { w.writeHead(200, { "content-type": "text/html; charset=utf-8" }); w.end(halaman.get(url)); return; }
  if (url === "/tokens.css") { w.writeHead(200, { "content-type": "text/css" }); w.end(tokensCssTeks); return; }
  let berkas = "";
  const blob = JSON.parse(readFileSync(join(sini, "blob.json"), "utf8")) as Record<string, string>;
  if (url.startsWith("/_blob/") && blob[url.slice(7)]) berkas = join(repo, blob[url.slice(7)]);
  else if (url.startsWith("/fonts/")) berkas = join(repo, "public", "fonts", url.slice(7));
  else if (url.startsWith("/brand/")) berkas = join(repo, "public", "brand", url.slice(7));
  else berkas = join(proyek, url);
  if (!berkas.startsWith(repo) || !existsSync(berkas)) { w.writeHead(404); w.end(); return; }
  w.writeHead(200, { "content-type": tipe[extname(berkas)] ?? "application/octet-stream" });
  w.end(readFileSync(berkas));
});
await new Promise<void>((ok) => server.listen(0, "127.0.0.1", () => ok()));
const port = (server.address() as { port: number }).port;

type Langkah = { klik?: string; tunggu?: number; tekan?: string; fokus?: string; ketik?: [string, string] };
const skenario: Record<string, Array<{ nama: string; langkah: Langkah[]; lebar?: number }>> = existsSync(join(sini, "skenario.json"))
  ? JSON.parse(readFileSync(join(sini, "skenario.json"), "utf8"))
  : {};
const argumen = process.argv.slice(2);
const sempit = argumen.includes("--sempit");
const dipilih = argumen.filter((a) => !a.startsWith("--"));
const semua = readdirSync(join(proyek, "components"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(proyek, "components", d.name, "preview.html")))
  .map((d) => d.name)
  .filter((n) => dipilih.length === 0 || dipilih.includes(n));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const laporan: string[] = [];
let gagal = 0;
for (const nama of semua) {
  const { html, tinggi, lebar } = bingkai(nama);
  halaman.set(`/pratinjau/${nama}.html`, html);
  const varian: Array<{ w: number; sk?: { nama: string; langkah: Langkah[] } }> = [
    // The cover is one 960-wide picture that Overview scales down; it has no narrow layout.
    ...(sempit && nama !== "Cover" ? [lebar, 390] : [lebar]).map((w) => ({ w })),
    ...(skenario[nama] ?? []).map((sk) => ({ w: sk.lebar ?? lebar, sk })),
  ];
  for (const { w, sk } of varian) {
    const page = await browser.newPage({ viewport: { width: w, height: Math.max(tinggi, 200) } });
    const galat: string[] = [];
    page.on("pageerror", (e: Error) => galat.push(`script: ${e.message}`));
    page.on("console", (m: { type: () => string; text: () => string }) => { if (m.type() === "error" && !/404 \(Not Found\)/.test(m.text())) galat.push(`console: ${m.text()}`); });
    page.on("requestfailed", (q: { url: () => string }) => galat.push(`request: ${q.url()}`));
    page.on("response", (q: { status: () => number; url: () => string }) => { if (q.status() >= 400 && !q.url().endsWith("/favicon.ico")) galat.push(`http ${q.status()}: ${q.url()}`); });
    await page.goto(`http://127.0.0.1:${port}/pratinjau/${nama}.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    for (const l of sk?.langkah ?? []) {
      if (l.klik) await page.click(l.klik);
      if (l.fokus) await page.focus(l.fokus);
      if (l.ketik) await page.fill(l.ketik[0], l.ketik[1]);
      if (l.tekan) await page.keyboard.press(l.tekan);
      await page.waitForTimeout(l.tunggu ?? 120);
    }
    const ukur = await page.evaluate(() => {
      // When the page is wider than the window, name the deepest elements that stick out.
      const w = window.innerWidth;
      const keluar = [...document.body.querySelectorAll("*")].filter((el) => el.getBoundingClientRect().right > w + 1 && !el.closest(".pds-seg, .pds-demo-gulir, .pds-table-wrap"));
      const terdalam = keluar.filter((el) => !keluar.some((c) => c !== el && el.contains(c)));
      const pelaku = terdalam.slice(0, 4).map((el) => `${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).join(".") : ""} ${Math.round(el.getBoundingClientRect().right)}`);
      return { lebarHal: document.documentElement.scrollWidth, lebarJendela: w, tinggi: document.documentElement.scrollHeight, pelaku };
    });
    const target = await page.evaluate(() => {
      const kecil: string[] = [];
      const kurang44: string[] = [];
      document.querySelectorAll("a, button, input:not([type=hidden]), select, textarea, summary, [role=tab], [role=menuitem], [role=switch]").forEach((el) => {
        const e = el as HTMLElement;
        if (e.closest("[hidden], dialog:not([open]), .pds-menu[hidden]")) return;
        const r = e.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        // A link inside running text is exempt (WCAG 2.5.8's inline exception).
        if (e.tagName === "A" && getComputedStyle(e).display === "inline") return;
        // A native checkbox, radio or the seg's hidden input: its label is the target.
        const label = e.closest("label");
        const rr = label && (e.matches("input[type=checkbox], input[type=radio]")) ? label.getBoundingClientRect() : r;
        const n = `${e.tagName.toLowerCase()}${e.className ? "." + String(e.className).split(" ")[0] : ""} "${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 24)}"`;
        if (rr.width < 24 || rr.height < 24) kecil.push(`${n} ${Math.round(rr.width)}x${Math.round(rr.height)}`);
        else if (rr.height < 44 && !e.closest(".pds-demo-kontrol, .pds-sort, .pds-tag, .pds-scope")) kurang44.push(`${n} ${Math.round(rr.width)}x${Math.round(rr.height)}`);
      });
      return { kecil, kurang44 };
    });
    await page.addScriptTag({ content: axeSumber });
    const axe = await page.evaluate(async () => {
      // @ts-expect-error axe is injected
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
      return r.violations.map((v: { id: string; nodes: { target: string[] }[] }) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    });
    const berkas = sk ? `${nama}--${sk.nama}.png` : w === lebar ? `${nama}.png` : `${nama}-${w}.png`;
    await page.screenshot({ path: join(keluaran, berkas), fullPage: true });
    const masalah = [
      ...galat,
      ...(ukur.lebarHal > ukur.lebarJendela + 1 ? [`sideways scroll: ${ukur.lebarHal}px in ${ukur.lebarJendela}px (${ukur.pelaku.join("; ")})`] : []),
      ...target.kecil.map((t) => `target under 24px: ${t}`),
      ...axe.map((a) => `axe ${a}`),
    ];
    if (masalah.length) gagal++;
    laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${nama}${sk ? ` [${sk.nama}]` : ""} @${w} (height ${ukur.tinggi}px, card ${tinggi})${masalah.length ? "\n      " + masalah.join("\n      ") : ""}${target.kurang44.length ? "\n      note, under 44px: " + target.kurang44.join("; ") : ""}`);
    await page.close();
  }
}
await browser.close();
server.close();
const ringkas = `${semua.length} previews, ${gagal} with a failure\n\n${laporan.join("\n")}\n`;
writeFileSync(join(keluaran, dipilih.length ? "laporan-sebagian.txt" : "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);

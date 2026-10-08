/**
 * THE DESIGN SYSTEM AS ONE FILE: a navigable page to open in any browser, offline. Review tooling,
 * not product code. Run from the repository root:
 *
 *   npx tsx docs/coordination/ux/sistem-desain/alat/buat-situs.mts
 *
 * Writes situs/PINTAR-design-system.html (not committed; this script rebuilds it). Everything is
 * inside the one file: the tokens, the fonts, bundle.css and bundle.js, every document in project/,
 * and every component's guideline and live preview. A preview runs in its own frame with the
 * tokens and the bundle, as the Design System page runs it, so hover, focus, menus, dialogs and
 * the table's filters work. Its width can be switched between the card's own, 820 and 390 px.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { esc, sebaris, md } from "./md.mjs";

const sini = dirname(fileURLToPath(import.meta.url));
const akar = join(sini, "..");
const repo = join(akar, "..", "..", "..", "..");
const proyek = join(akar, "project");
const KE = join(akar, "situs");
mkdirSync(KE, { recursive: true });
const baca = (p: string) => readFileSync(join(proyek, p), "utf8");
const sha = execSync("git rev-parse --short HEAD", { cwd: repo }).toString().trim();
const hariCommit = (() => {
  const [t, b, h] = execSync("git log -1 --format=%cs", { cwd: repo }).toString().trim().split("-").map(Number);
  return `${h} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][b - 1]} ${t}`;
})();

// ── tokens.css, as the page compiles it (pratinjau.mts), with the fonts inside ──
type Tok = { name: string; value: unknown; usage?: string };
const tokens = JSON.parse(baca("tokens.json"));
const tema = tokens.color.themes[0].id;
const nilai = (t: Tok) => (typeof t.value === "string" ? t.value : (t.value as Record<string, string>)[tema]);
function tokensCss(): string {
  const warna = (tokens.color.tokens as Tok[]).map((t) => {
    const m = /^\{(.+)\}$/.exec(nilai(t));
    return `  --${t.name}: ${m ? `var(--${m[1]})` : nilai(t)};`;
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
  const huruf = (tokens.type.fonts as Array<{ family: string; file: string; weight: string; style?: string }>).map((f) => {
    const data = readFileSync(join(repo, "public", f.file)).toString("base64");
    return `@font-face { font-family: "${f.family}"; src: url(data:font/woff2;base64,${data}) format("woff2"); font-weight: ${f.weight}; font-style: ${f.style ?? "normal"}; font-display: block; }`;
  });
  return `${huruf.join("\n")}\n:root, [data-theme="${tema}"] {\n${warna.join("\n")}\n}\n:root {\n${lain.join("\n")}\n}\n${kelas.join("\n")}\n`;
}
const TOKENS_CSS = tokensCss();
const BUNDLE_CSS = baca("components/bundle.css");
const BUNDLE_JS = baca("components/bundle.js");
if (/<\/script/i.test(BUNDLE_JS)) throw new Error("bundle.js holds «</script»: it cannot be inlined");

// ── the components ────────────────────────────────────────────────────────────
const NAMA: Record<string, string> = { DateTime: "Date and time", TableRows: "Table rows", PinInput: "PIN input", CodeInput: "Code input", TextField: "Text field", SegmentedControl: "Segmented control", ActionFeedback: "Action feedback", EmptyState: "Empty state", AppShell: "App shell", LearnerShell: "Learner shell", LockScreen: "Lock screen", DeviceChoice: "Device choice", IdleWarning: "Idle warning", PasswordField: "Password field", ActivationFlow: "Activation flow", FormLayout: "Form layout", LayoutGrid: "Layout grid", InteractionStates: "Interaction states", FileField: "File field",
  J1Terbit: "J1 · Publish, then make available", J2Kelas: "J2 · A whole class, one learner", J3MengajarBelajar: "J3 · Teaching and learning", J4Murid: "J4 · A lesson, a question, a result", J5Jendela: "J5 · The window's dates", J6Peragaan: "J6 · MODE PERAGAAN", J7Kunci: "J7 · Stepping away" };
const GRUP = ["Brand", "Foundations", "Actions", "Inputs", "Navigation", "Containers", "Feedback", "Data", "Identity"];
// The composed journeys (11-validation.md §1) are cards too, but they are not components: they have their own category.
const JALAN = "Journeys";
type Komp = { nama: string; label: string; grup: string; lebar: number; tinggi: number; subjudul: string; pratinjau: string; panduan: string; status: string };
const KOMP: Komp[] = readdirSync(join(proyek, "components"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
  const pratinjau = baca(`components/${d.name}/preview.html`);
  const attr = /^<!--\s*@dsCard([^>]*)-->/.exec(pratinjau)?.[1] ?? "";
  const ambil = (k: string) => new RegExp(`${k}="([^"]*)"`).exec(attr)?.[1] ?? "";
  const panduan = existsSync(join(proyek, "components", d.name, "README.md")) ? baca(`components/${d.name}/README.md`) : ""; // the cover has none
  return {
    nama: d.name, label: NAMA[d.name] ?? d.name, grup: ambil("group"),
    lebar: Number(/width=(\d+)/.exec(attr)?.[1] ?? 960), tinggi: Number(/height=(\d+)/.exec(attr)?.[1] ?? 120),
    subjudul: ambil("subtitle"), pratinjau, panduan: md(panduan),
    status: panduan.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p.startsWith("**Status")) ?? "",
  };
});
for (const k of KOMP) if (k.grup && !GRUP.includes(k.grup) && k.grup !== JALAN) throw new Error(`${k.nama}: group «${k.grup}» has no place in the navigation`);
// The status tag, read the way the boards read it.
function tandaStatus(teks: string): string {
  const m = /Status:\s*([A-Z][A-Z ,]+?)(?:\*\*|\.|\s\(|$)/.exec(teks);
  if (!m) return "";
  const k = m[1].trim().replace(/,$/, "");
  const ruling = /RULING/.test(teks.slice(0, 80));
  const nada = ruling ? "ruling" : /^NEW/.test(k) ? "new" : /^CHANGED/.test(k) ? "changed" : "kept";
  return `<span class="tanda tanda-${nada}">${esc(ruling && !/RULING/.test(k) ? `${k} · needs a ruling` : k)}</span>`;
}

// ── the tokens page ───────────────────────────────────────────────────────────
const GRUP_WARNA: Array<[string, RegExp]> = [
  ["Grounds", /^surface-/], ["Ink", /^ink-/], ["Lines", /^line/], ["PINTAR green", /^pintar-|^focus-ring/],
  ["Status, always with a word", /^status-/], ["Table rows (Dr Gladys, 5 Oct): roles, no new colour", /^table-/], ["Layers and context", /^scrim|^context/],
];
function tandaTok(u = ""): string {
  const m = /^(KEPT|CHANGED|NEW)/.exec(u);
  const ruling = /NEEDS A RULING/.test(u);
  if (!m && !ruling) return "";
  const nada = ruling ? "ruling" : m![1] === "NEW" ? "new" : m![1] === "CHANGED" ? "changed" : "kept";
  return `<span class="tanda tanda-${nada}">${m ? m[1] : ""}${ruling ? `${m ? " · " : ""}needs a ruling` : ""}</span>`;
}
const tanpaStatus = (u = "") => u.replace(/^(?:(?:KEPT|NEW|CHANGED)(?:,\s*NEEDS A RULING)?|NEEDS A RULING)\s*[.:,]?\s*/, "");
function halamanToken(): string {
  const warna = GRUP_WARNA.map(([judul, re]) => {
    const isi = (tokens.color.tokens as Tok[]).filter((t) => re.test(t.name));
    return `<h2>${esc(judul)}</h2><div class="tabel-gulir"><table class="tok"><thead><tr><th>Swatch</th><th>Token</th><th>Value</th><th>Use</th></tr></thead><tbody>${isi.map((t) => {
      const v = nilai(t);
      return `<tr><td><span class="contoh" style="background:var(--${t.name})"></span></td><td><code>${t.name}</code></td><td><code>${esc(v.replace(/^\{(.+)\}$/, "= $1"))}</code></td><td>${tandaTok(t.usage)} ${sebaris(tanpaStatus(t.usage))}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }).join("");
  const tipe = (tokens.type.groups as Array<{ name: string; family: string; styles: Array<Record<string, string | number>> }>).map((g) =>
    `<h3>${esc(g.name)}</h3>${g.styles.map((s) => `<div class="tipe"><div class="tipe-meta"><code>${s.name}</code><span>${s.fontSize} / ${s.lineHeight} · ${s.fontWeight}${(s.family ?? g.family) === "mono" ? " · mono" : ""}${s.letterSpacing ? ` · ${s.letterSpacing}` : ""}</span>${tandaTok(String(s.usage ?? ""))}</div><div class="${s.name} tipe-contoh">${esc(String(s.sample ?? ""))}</div><p class="tipe-arti">${sebaris(tanpaStatus(String(s.usage ?? "")))}</p></div>`).join("")}`).join("");
  const keluarga = (k: string, judul: string, contoh: (t: Tok) => string) =>
    `<h2>${esc(judul)}</h2><div class="tabel-gulir"><table class="tok"><thead><tr><th>Sample</th><th>Token</th><th>Value</th><th>Use</th></tr></thead><tbody>${(tokens[k].tokens as Tok[]).map((t) => `<tr><td>${contoh(t)}</td><td><code>${t.name}</code></td><td><code>${esc(String(t.value))}</code></td><td>${tandaTok(t.usage)} ${sebaris(tanpaStatus(t.usage))}</td></tr>`).join("")}</tbody></table></div>`;
  return `<h2>Colour</h2><p class="lede">Every colour token, with its value and its job. One theme: light.</p>${warna}
<h2>Type</h2><p class="lede">Plus Jakarta Sans at 400 and 600, IBM Plex Mono 500 for identifiers. Each sample is set in its own style.</p>${tipe}
${keluarga("spacing", "Space", (t) => `<span class="batang" style="width:var(--${t.name})"></span>`)}
${keluarga("radius", "Corners", (t) => `<span class="sudut" style="border-radius:var(--${t.name})"></span>`)}
${keluarga("shadow", "Shadows", (t) => `<span class="bayang" style="box-shadow:var(--${t.name})"></span>`)}
${keluarga("size", "Sizes", () => "")}
${keluarga("border", "Borders", (t) => `<span class="garis" style="border-top:var(--${t.name}) solid var(--ink-1)"></span>`)}
${keluarga("duration", "Durations", () => "")}
${keluarga("easing", "Easing", () => "")}
${keluarga("zIndex", "Layers (z-index)", () => "")}
${keluarga("breakpoint", "Breakpoints", () => "")}`;
}

// ── the assets page ───────────────────────────────────────────────────────────
function halamanAset(): string {
  const ikon = (f: string, tipe: string, ukuran: number, ket: string) =>
    `<figure><img src="data:${tipe};base64,${readFileSync(join(proyek, "assets", "AppIcon", f)).toString("base64")}" width="${ukuran}" height="${ukuran}" alt=""><figcaption><code>${f}</code><br>${esc(ket)}</figcaption></figure>`;
  return `<h2>The tab icon</h2>
<div class="ikon-baris">${ikon("favicon.ico", "image/x-icon", 32, "16, 32, 48 px, rounded")}${ikon("icon.svg", "image/svg+xml", 48, "vectors, rounded")}${ikon("apple-icon.png", "image/png", 90, "180 px, full bleed (half size)")}${ikon("icon-192.png", "image/png", 96, "192 px, full bleed (half size)")}</div>
${md(baca("assets/AppIcon/README.md"))}
<h2>The wordmark's master files</h2>
${md(baca("assets/Logos/README.md"))}
<p>The full specification is on the <a href="#/c/Wordmark">Wordmark</a> page.</p>`;
}

// ── the pages and the navigation ──────────────────────────────────────────────
// `kat` is the main category in the left column (collapsible); `sub` a quiet label inside Components; `bagian` the page's eyebrow.
type Halaman = { id: string; kat: string; sub?: string; bagian: string; judul: string; lede?: string; isi: string; komp?: string };
const KATEGORI: Array<[string, string]> = [["foundations", "Foundations"], ["components", "Components"], ["rulings", "Rulings and validation"], ["journeys", "Composed journeys"], ["assets", "Assets"]];
const SUB: Record<string, string> = { Foundations: "Foundations in use" };
const dok = (berkas: string) => {
  const s = baca(berkas);
  const judul = /^#\s+(.+)$/m.exec(s)?.[1] ?? berkas;
  return { judul, isi: md(s.replace(/^#\s+.+\n/, "")) };
};
const HAL: Halaman[] = [];
const sampul = KOMP.find((k) => k.nama === "Cover");
HAL.push({ id: "overview", kat: "", bagian: "Overview", judul: "PINTAR design system", lede: "Token set v3, approved in principle (5 Oct): the brand book, the foundations and every component, live. Nothing here is applied to PINTAR until the authorised UI/UX stage.", isi: md(baca("README.md")), komp: sampul ? "Cover" : undefined });
const FONDASI: Array<[string, string]> = [["colour", "01-colour.md"], ["typography", "02-typography.md"], ["layout", "03-layout.md"], ["interaction", "04-interaction.md"], ["navigation", "05-navigation.md"], ["accessibility", "06-accessibility.md"], ["dates", "10-dates.md"]];
for (const [id, f] of FONDASI) HAL.push({ id, kat: "foundations", bagian: "Foundations", ...dok(f) });
HAL.push({ id: "tokens", kat: "foundations", bagian: "Foundations", judul: "Tokens", lede: "Every token in tokens.json, drawn with its own value.", isi: halamanToken() });
for (const g of GRUP) {
  for (const k of KOMP.filter((x) => x.grup === g).sort((a, b) => a.label.localeCompare(b.label))) {
    HAL.push({ id: `c/${k.nama}`, kat: "components", sub: SUB[g] ?? g, bagian: `Components · ${SUB[g] ?? g}`, judul: k.label, lede: k.subjudul, isi: k.panduan, komp: k.nama });
  }
}
for (const [id, f] of [["proposal", "07-proposal.md"], ["validation", "11-validation.md"], ["migration", "08-migration.md"], ["references", "09-references.md"]] as const) HAL.push({ id, kat: "rulings", bagian: "Rulings and validation", ...dok(f) });
for (const k of KOMP.filter((x) => x.grup === JALAN).sort((a, b) => a.nama.localeCompare(b.nama))) {
  HAL.push({ id: `c/${k.nama}`, kat: "journeys", bagian: "Composed journeys · for owner validation", judul: k.label, lede: k.subjudul, isi: k.panduan, komp: k.nama });
}
HAL.push({ id: "assets", kat: "assets", bagian: "Assets", judul: "Assets", lede: "The tab icon and the wordmark's master files.", isi: halamanAset() });

const tautan = (h: Halaman) => `<li><a href="#/${h.id}" data-id="${h.id}">${esc(h.judul)}</a></li>`;
const nav = `<ul class="nav-atas">${HAL.filter((h) => !h.kat).map(tautan).join("")}</ul>` + KATEGORI.map(([kat, judul]) => {
  const isi = HAL.filter((h) => h.kat === kat);
  const subs = [...new Set(isi.map((h) => h.sub ?? ""))];
  const daftar = subs.map((sub) => `<div class="kat-grup">${sub ? `<p class="kat-sub">${esc(sub)}</p>` : ""}<ul>${isi.filter((h) => (h.sub ?? "") === sub).map(tautan).join("")}</ul></div>`).join("");
  return `<section class="nav-kat" data-kat="${kat}"><h2 class="kat-kepala"><button type="button" class="kat-tombol" aria-expanded="true" aria-controls="kat-${kat}"><span class="kat-nama">${esc(judul)}</span><span class="kat-jumlah">${isi.length}</span><span class="kat-tanda" aria-hidden="true">−</span></button></h2><div class="kat-isi" id="kat-${kat}">${daftar}</div></section>`;
}).join("");

const DATA = {
  kaki: esc(`Token set v3, approved in principle (5 Oct); not applied to PINTAR until the authorised UI/UX stage. Built from commit ${sha}, ${hariCommit}. Every word and value comes from the design system's files.`),
  kepala: `<style>${TOKENS_CSS}</style><style>${BUNDLE_CSS}</style><script>${BUNDLE_JS}</script>`,
  halaman: HAL,
  komp: Object.fromEntries(KOMP.map((k) => [k.nama, { label: k.label, grup: k.grup, lebar: k.lebar, tinggi: k.tinggi, status: tandaStatus(k.status), pratinjau: k.pratinjau }])),
};
// «<» as <, so nothing in the data can end the script element that holds it.
const dataJson = JSON.stringify(DATA).replace(/</g, "\\u003c");

const CSS = `
:root { color-scheme: light; }
html, body { background: var(--surface-0); color: var(--ink-1); }
body { margin: 0; font-family: var(--font-sans); font-size: 16px; line-height: 24px; -webkit-font-smoothing: antialiased; }
* { box-sizing: border-box; }
html { scroll-padding-top: 24px; }
a { color: var(--pintar-primary); }
:focus-visible { outline: var(--border-focus) solid var(--focus-ring); outline-offset: 2px; }
.situs { display: grid; grid-template-columns: 288px minmax(0, 1fr); min-height: 100vh; }
.samping { position: sticky; top: 0; height: 100vh; overflow-y: auto; border-right: var(--border-hairline) solid var(--line); background: var(--surface-0); padding: var(--space-6) var(--space-3) var(--space-8); }
.merek { display: block; margin: 0 var(--space-3) var(--space-1); font-family: var(--font-wordmark); font-weight: 500; font-synthesis: none; font-size: calc(var(--wordmark-nav) / 0.714); font-size-adjust: cap-height 0.714; line-height: 1; letter-spacing: 0.05em; text-transform: uppercase; color: var(--pintar-primary); text-decoration: none; }
.sub-merek { margin: var(--space-2) var(--space-3) var(--space-4); font-size: 13px; line-height: 18px; color: var(--ink-3); }
.cari { display: block; width: calc(100% - 2 * var(--space-2)); margin: 0 var(--space-2) var(--space-2); height: 40px; padding: 0 var(--space-3); border: var(--border-hairline) solid var(--line-control); border-radius: var(--radius-md); background: var(--surface-1); font: inherit; font-size: 15px; color: var(--ink-1); }
/* The design-system browser's own navigation: main categories as soft bands that open and close.
   This is for browsing the system only; it is not PINTAR's application sidebar. */
.nav-atas, .kat-isi ul { list-style: none; margin: 0; padding: 0; }
.nav-atas { margin-bottom: var(--space-2); }
.kat-kepala { margin: var(--space-2) 0 0; }
.kat-tombol { display: flex; align-items: center; gap: var(--space-2); width: 100%; min-height: 40px; padding: 0 var(--space-3); border: 0; border-radius: var(--radius-md); background: var(--surface-2); color: var(--ink-1); font: inherit; font-size: 14px; line-height: 20px; font-weight: 600; text-align: left; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
.kat-tombol:hover { background: var(--surface-3); }
.kat-nama { flex: 1; }
.kat-jumlah { font-weight: 400; font-size: 13px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.kat-tanda { width: 16px; text-align: center; font-size: 18px; line-height: 1; font-weight: 400; color: var(--ink-2); }
.kat-isi { padding: var(--space-1) 0 var(--space-2); }
.kat-isi[hidden] { display: none; }
.kat-sub { margin: var(--space-3) var(--space-3) 2px; font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
.kat-grup:first-child .kat-sub { margin-top: var(--space-2); }
.nav-atas a, .kat-isi a { display: flex; align-items: center; min-height: 36px; padding: var(--space-1) var(--space-3); border-radius: var(--radius-md); color: var(--ink-1); text-decoration: none; font-size: 15px; line-height: 20px; transition: background-color var(--duration-fast) var(--ease-standard); }
.nav-atas a:hover, .kat-isi a:hover { background: var(--surface-2); }
.nav-atas a[aria-current="page"], .kat-isi a[aria-current="page"] { background: var(--pintar-primary-soft); color: var(--pintar-primary); font-weight: 600; }
.kosong-cari { margin: var(--space-4) var(--space-3); font-size: 14px; color: var(--ink-2); }
.utama { min-width: 0; padding: var(--space-8) var(--space-8) var(--space-9); }
.utama:focus { outline: none; }
.isi { max-width: 1120px; }
.jejak { margin: 0 0 var(--space-2); font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
h1.judul { margin: 0; font-size: 32px; line-height: 40px; font-weight: 600; letter-spacing: -0.015em; }
h1.judul:focus { outline: none; }
.lede { max-width: 72ch; margin: var(--space-2) 0 0; font-size: 18px; line-height: 28px; color: var(--ink-2); }
.kepala-hal { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.tanda { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--radius-pill); font-size: 12px; line-height: 18px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; background: var(--surface-2); color: var(--ink-2); vertical-align: middle; }
.tanda-new { background: var(--status-info-soft); color: var(--status-info); }
.tanda-changed { background: var(--status-attention-soft); color: var(--ink-1); }
.tanda-ruling { background: var(--status-attention-soft); color: var(--ink-1); box-shadow: inset 0 0 0 1px var(--status-attention); }
.pratinjau { margin: var(--space-6) 0 var(--space-7); }
.alat { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); }
.alat .label { font-size: 14px; color: var(--ink-2); margin-right: var(--space-1); }
.alat button { min-height: 36px; padding: 0 var(--space-3); border: var(--border-hairline) solid var(--line-control); border-radius: var(--radius-md); background: var(--surface-1); color: var(--ink-1); font: inherit; font-size: 14px; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); }
.alat button:hover { background: var(--surface-2); }
.alat button[aria-pressed="true"] { background: var(--pintar-primary); border-color: var(--pintar-primary); color: var(--surface-1); }
.alat .sendiri { margin-left: auto; }
.panggung { overflow-x: auto; padding: var(--space-4); background: var(--surface-2); border-radius: var(--radius-lg); }
.panggung iframe { display: block; border: var(--border-hairline) solid var(--line); border-radius: var(--radius-md); background: var(--surface-0); margin: 0 auto; max-width: none; }
.catatan-pratinjau { margin: var(--space-2) 0 0; font-size: 13px; line-height: 18px; color: var(--ink-3); }
.dok { max-width: 1120px; margin-top: var(--space-6); }
.dok > p, .dok > ul, .dok > ol, .dok > blockquote { max-width: 76ch; }
.dok h2 { margin: var(--space-8) 0 var(--space-3); font-size: 24px; line-height: 32px; font-weight: 600; letter-spacing: -0.01em; }
.dok h3 { margin: var(--space-6) 0 var(--space-2); font-size: 18px; line-height: 26px; font-weight: 600; }
.dok h4 { margin: var(--space-5) 0 var(--space-2); font-size: 16px; line-height: 24px; font-weight: 600; }
.dok p { margin: 0 0 var(--space-4); }
.dok ul, .dok ol { margin: 0 0 var(--space-4); padding-left: 24px; }
.dok li { margin: 0 0 6px; }
.dok li > ul, .dok li > ol { margin: 6px 0 0; }
.dok li > p { margin: var(--space-2) 0 0; }
.dok blockquote { margin: var(--space-2) 0 var(--space-4); padding: 2px 0 2px var(--space-4); border-left: 3px solid var(--pintar-primary); color: var(--ink-2); }
.dok blockquote p { margin: 0; }
.dok code, .tok code { font-family: var(--font-mono); font-size: 0.88em; padding: 1px 5px; border-radius: var(--radius-sm); background: var(--surface-2); color: var(--ink-1); overflow-wrap: anywhere; }
.dok table, table.tok { width: 100%; border-collapse: collapse; margin: 0 0 var(--space-5); font-size: 15px; line-height: 22px; background: var(--surface-1); }
.dok table { display: block; overflow-x: auto; }
.dok th, .dok td, .tok th, .tok td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: var(--border-hairline) solid var(--line); }
.dok th, .tok th { background: var(--table-head); font-weight: 600; font-size: 14px; color: var(--ink-2); }
.dok tbody tr:hover td, .tok tbody tr:hover td { background: var(--table-row-hover); }
.tabel-gulir { overflow-x: auto; }
.tok td:first-child { width: 120px; }
.tok td:nth-child(2), .tok td:nth-child(3) { white-space: nowrap; }
.contoh { display: block; width: 88px; height: 40px; border-radius: var(--radius-md); box-shadow: inset 0 0 0 1px var(--line); }
.batang { display: block; height: 16px; background: var(--pintar-primary); border-radius: 2px; }
.sudut { display: block; width: 56px; height: 40px; background: var(--pintar-primary-soft); border: var(--border-hairline) solid var(--pintar-primary); }
.bayang { display: block; width: 72px; height: 40px; background: var(--surface-1); border-radius: var(--radius-md); }
.garis { display: block; width: 72px; margin-top: 12px; }
.tipe { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: var(--space-2) var(--space-5); padding: var(--space-4) 0; border-bottom: var(--border-hairline) solid var(--line); }
.tipe-meta { display: grid; align-content: start; gap: 4px; font-size: 13px; line-height: 18px; color: var(--ink-2); }
.tipe-meta .tanda { justify-self: start; }
.tipe-contoh { min-width: 0; overflow-wrap: anywhere; }
.tipe-arti { grid-column: 2; margin: 0; font-size: 14px; line-height: 20px; color: var(--ink-2); }
.ikon-baris { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--space-6); margin: var(--space-4) 0 var(--space-6); }
.ikon-baris figure { margin: 0; display: grid; gap: var(--space-2); justify-items: start; font-size: 13px; line-height: 18px; color: var(--ink-2); }
.langkah { display: flex; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-9); padding-top: var(--space-5); border-top: var(--border-hairline) solid var(--line); }
.langkah a { display: grid; gap: 2px; max-width: 48%; padding: var(--space-3) var(--space-4); border: var(--border-hairline) solid var(--line); border-radius: var(--radius-md); text-decoration: none; color: var(--ink-1); background: var(--surface-1); transition: border-color var(--duration-fast) var(--ease-standard); }
.langkah a:hover { border-color: var(--pintar-primary); }
.langkah a span { font-size: 12px; line-height: 16px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.langkah .lanjut { margin-left: auto; text-align: right; }
.kaki { margin-top: var(--space-6); font-size: 13px; line-height: 18px; color: var(--ink-3); }
.bar-atas { display: none; }
@media (max-width: 899px) {
  .situs { grid-template-columns: minmax(0, 1fr); }
  .bar-atas { display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 3; height: 56px; padding: 0 var(--space-4); background: var(--surface-0); border-bottom: var(--border-hairline) solid var(--line); }
  .bar-atas .merek { margin: 0; font-size: calc(var(--wordmark-bar) / 0.714); }
  .bar-atas button { min-height: 44px; padding: 0 var(--space-4); border: var(--border-hairline) solid var(--line-control); border-radius: var(--radius-md); background: var(--surface-1); font: inherit; color: var(--ink-1); }
  .samping { display: none; position: fixed; inset: 56px 0 0 0; z-index: 2; height: auto; border-right: 0; }
  .situs.nav-buka .samping { display: block; }
  .samping > .merek, .samping > .sub-merek { display: none; }
  .utama { padding: var(--space-6) var(--space-4) var(--space-8); }
  .panggung { padding: var(--space-2); }
  .alat .sendiri { margin-left: 0; }
  .tipe { grid-template-columns: minmax(0, 1fr); }
  .tipe-arti { grid-column: 1; }
}
`;

const JS = `
const DATA = JSON.parse(document.getElementById("data").textContent);
const HAL = DATA.halaman;
const utama = document.querySelector(".utama");
const situs = document.querySelector(".situs");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dokumen = (nama) => '<!doctype html><html lang="id" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(DATA.komp[nama].label) + '</title>' + DATA.kepala + '</head><body>' + DATA.komp[nama].pratinjau + '</body></html>';

// A frame grows and shrinks with its preview (a menu opened, a row filtered).
function ukurBingkai(f, cadangan) {
  f.style.height = cadangan + "px";
  f.addEventListener("load", () => {
    try {
      const d = f.contentDocument;
      const atur = () => { f.style.height = Math.max(80, Math.ceil(d.body.scrollHeight)) + "px"; };
      atur();
      new ResizeObserver(atur).observe(d.body);
    } catch (e) { /* the browser keeps the frame closed to this page: the card's own height stays */ }
  });
}
function pratinjau(nama, alat) {
  const k = DATA.komp[nama];
  // A journey is checked at 1280, 1024 and 390 px (11-validation.md §1); a component at its card, 820 and 390.
  const lebar = [k.lebar, k.grup === "Journeys" ? 1024 : 820, 390].filter((v, i, a) => a.indexOf(v) === i);
  const tombol = lebar.map((w, i) => '<button type="button" data-lebar="' + w + '" aria-pressed="' + (i === 0) + '">' + (i === 0 ? "Card · " : w === 820 ? "Tablet · " : w === 1024 ? "Laptop · " : "Phone · ") + w + ' px</button>').join("") + '<button type="button" data-lebar="pas" aria-pressed="false">Fit the window</button>';
  return '<div class="pratinjau">' + (alat ? '<div class="alat" role="group" aria-label="Preview width"><span class="label">Width</span>' + tombol + '<button type="button" class="sendiri" data-sendiri>Open alone in a new tab</button></div>' : "") +
    '<div class="panggung"><iframe title="' + esc("Live preview: " + k.label) + '" style="width:' + k.lebar + 'px" loading="eager"></iframe></div>' +
    (alat ? '<p class="catatan-pratinjau">Live: hover, click, type and tab through it. It runs with the same tokens, styles and behaviour as the Design System page.</p>' : "") + "</div>";
}
function pasangPratinjau(nama) {
  const f = utama.querySelector(".panggung iframe");
  if (!f) return;
  ukurBingkai(f, DATA.komp[nama].tinggi);
  f.srcdoc = dokumen(nama);
  const pilih = (b) => {
    utama.querySelectorAll("[data-lebar]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    f.style.width = b.dataset.lebar === "pas" ? "100%" : b.dataset.lebar + "px";
  };
  utama.querySelectorAll("[data-lebar]").forEach((b) => b.addEventListener("click", () => pilih(b)));
  const panggung = utama.querySelector(".panggung");
  const ruang = panggung.clientWidth - parseFloat(getComputedStyle(panggung).paddingLeft) * 2;
  const pas = utama.querySelector('[data-lebar="pas"]');
  if (pas && DATA.komp[nama].lebar > ruang) pilih(pas);
  else if (!pas && DATA.komp[nama].lebar > ruang) f.style.width = "100%";
  const s = utama.querySelector("[data-sendiri]");
  if (s) s.addEventListener("click", () => window.open(URL.createObjectURL(new Blob([dokumen(nama)], { type: "text/html" })), "_blank"));
}

// Each category opens and closes on its own (several may be open). The state lasts for the session;
// storage may be unavailable (a private window, a blocked file page), and then it simply is not kept.
const KUNCI = "pintar-ds-kategori";
let keadaanKat = {};
try { keadaanKat = JSON.parse(sessionStorage.getItem(KUNCI) || "{}") || {}; } catch (e) { keadaanKat = {}; }
const simpanKat = () => { try { sessionStorage.setItem(KUNCI, JSON.stringify(keadaanKat)); } catch (e) { /* not kept */ } };
function aturKat(sec, terbuka, ingat) {
  sec.querySelector(".kat-tombol").setAttribute("aria-expanded", String(terbuka));
  sec.querySelector(".kat-tanda").textContent = terbuka ? "\u2212" : "+";
  if (!cari.value.trim()) sec.querySelector(".kat-isi").hidden = !terbuka;
  if (ingat) { keadaanKat[sec.dataset.kat] = terbuka; simpanKat(); }
}
const cari = document.querySelector(".cari");
document.querySelectorAll(".nav-kat").forEach((sec) => {
  aturKat(sec, keadaanKat[sec.dataset.kat] !== false, false);
  sec.querySelector(".kat-tombol").addEventListener("click", (e) => aturKat(sec, e.currentTarget.getAttribute("aria-expanded") !== "true", true));
});

function buka(id, pindahFokus) {
  const i = Math.max(0, HAL.findIndex((h) => h.id === id));
  const h = HAL[i];
  const k = h.komp ? DATA.komp[h.komp] : null;
  const sebelum = HAL[i - 1], sesudah = HAL[i + 1];
  utama.innerHTML = '<div class="isi"><p class="jejak">' + esc(h.bagian) + '</p><div class="kepala-hal"><h1 class="judul" tabindex="-1">' + esc(h.judul) + "</h1>" + (k && h.id !== "overview" ? k.status : "") + "</div>" +
    (h.lede ? '<p class="lede">' + esc(h.lede) + "</p>" : "") +
    (k ? pratinjau(h.komp, h.id !== "overview") : "") +
    '<div class="dok">' + h.isi + "</div>" +
    '<nav class="langkah" aria-label="Previous and next">' + (sebelum ? '<a href="#/' + sebelum.id + '"><span>Previous</span>' + esc(sebelum.judul) + "</a>" : "") + (sesudah ? '<a class="lanjut" href="#/' + sesudah.id + '"><span>Next</span>' + esc(sesudah.judul) + "</a>" : "") + "</nav>" +
    '<p class="kaki">' + DATA.kaki + "</p></div>";
  if (k) pasangPratinjau(h.komp);
  document.title = h.judul + " · PINTAR design system";
  document.querySelectorAll(".samping nav a").forEach((a) => { if (a.dataset.id === h.id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  const aktif = document.querySelector('.samping nav a[aria-current="page"]');
  // The category holding the current page opens, and stays open for the session.
  const kat = aktif && aktif.closest(".nav-kat");
  if (kat && kat.querySelector(".kat-tombol").getAttribute("aria-expanded") !== "true") aturKat(kat, true, true);
  if (aktif) aktif.scrollIntoView({ block: "nearest" });
  situs.classList.remove("nav-buka");
  window.scrollTo(0, 0);
  if (pindahFokus) utama.querySelector("h1").focus();
}
const dariHash = () => decodeURIComponent(location.hash.replace(/^#\\/?/, "")) || "overview";
window.addEventListener("hashchange", () => buka(dariHash(), true));

// Filter the navigation as you type.
// While searching, every match shows, whatever its category's state; clearing the search restores it.
cari.addEventListener("input", () => {
  const q = cari.value.trim().toLowerCase();
  let ada = 0;
  document.querySelectorAll(".nav-atas li").forEach((li) => { const cocok = !q || li.textContent.toLowerCase().includes(q); li.hidden = !cocok; if (cocok) ada++; });
  document.querySelectorAll(".nav-kat").forEach((sec) => {
    const namaKat = sec.querySelector(".kat-nama").textContent.toLowerCase();
    let n = 0;
    sec.querySelectorAll(".kat-grup").forEach((g) => {
      const namaSub = (g.querySelector(".kat-sub")?.textContent ?? "").toLowerCase();
      let m = 0;
      g.querySelectorAll("li").forEach((li) => { const cocok = !q || li.textContent.toLowerCase().includes(q) || namaSub.includes(q) || namaKat.includes(q); li.hidden = !cocok; if (cocok) m++; });
      g.hidden = m === 0; n += m;
    });
    sec.hidden = n === 0; ada += n;
    sec.querySelector(".kat-isi").hidden = q ? n === 0 : sec.querySelector(".kat-tombol").getAttribute("aria-expanded") !== "true";
  });
  document.querySelector(".kosong-cari").hidden = ada > 0;
});
document.querySelector("[data-menu]").addEventListener("click", (e) => {
  const buka = situs.classList.toggle("nav-buka");
  e.currentTarget.setAttribute("aria-expanded", String(buka));
});
buka(dariHash(), false);
`;

const html = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PINTAR design system</title>
<link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(baca("assets/AppIcon/icon.svg")).toString("base64")}">
<style>${TOKENS_CSS}</style>
<style>${CSS}</style>
</head>
<body>
<div class="situs">
  <header class="bar-atas"><a class="merek" href="#/overview" aria-label="PINTAR design system, overview">PINTAR</a><button type="button" data-menu aria-expanded="false">Menu</button></header>
  <aside class="samping" aria-label="Design system">
    <a class="merek" href="#/overview" aria-label="PINTAR design system, overview">PINTAR</a>
    <p class="sub-merek">Design system · token set v3, approved in principle<br>${esc(sha)} · ${esc(hariCommit)}</p>
    <input class="cari" type="search" placeholder="Find a page or component" aria-label="Find a page or component">
    <nav aria-label="Pages">${nav}</nav>
    <p class="kosong-cari" hidden>Nothing matches. Try a component's name, such as «Table».</p>
  </aside>
  <main class="utama" tabindex="-1"></main>
</div>
<script type="application/json" id="data">${dataJson}</script>
<script>${JS}</script>
</body>
</html>
`;
const keluar = join(KE, "PINTAR-design-system.html");
writeFileSync(keluar, html);
console.log(`${keluar}\n${HAL.length} pages, ${KOMP.length} live previews, ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);

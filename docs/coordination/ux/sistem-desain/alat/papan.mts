/**
 * THE BOARDS: the design language, system and grammar as images.
 * Review tooling, not product code. It lays out the same files the Design
 * System page shows (tokens.json, the brand book, the sections, and every
 * component card, live) as 1600-wide boards, and saves each at 2x as
 * papan/NN-name.png. Nothing here is a new rule; every word comes from
 * project/.
 *
 *   npx tsx docs/coordination/ux/sistem-desain/alat/papan.mts [NN ...]
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const sini = dirname(fileURLToPath(import.meta.url));
const akar = join(sini, "..");
const repo = join(akar, "..", "..", "..", "..");
const proyek = join(akar, "project");
const keluaran = join(akar, "papan");
mkdirSync(keluaran, { recursive: true });
const req = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = req("playwright");
const baca = (p: string) => readFileSync(join(proyek, p), "utf8");
const sha = execSync("git rev-parse --short HEAD", { cwd: repo }).toString().trim();
// The commit's own day, written as the date grammar writes it in English: «5 Oct 2026».
const hariCommit = (() => {
  const [t, b, h] = execSync("git log -1 --format=%cs", { cwd: repo }).toString().trim().split("-").map(Number);
  return `${h} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][b - 1]} ${t}`;
})();
const NAMA: Record<string, string> = { DateTime: "Date and time", TableRows: "Table rows", PinInput: "PIN input", CodeInput: "Code input", TextField: "Text field", SegmentedControl: "Segmented control", ActionFeedback: "Action feedback", EmptyState: "Empty state", AppShell: "App shell", LearnerShell: "Learner shell", LockScreen: "Lock screen", DeviceChoice: "Device choice", IdleWarning: "Idle warning", PasswordField: "Password field", ActivationFlow: "Activation flow", FormLayout: "Form layout", LayoutGrid: "Layout grid", InteractionStates: "Interaction states" };

// ── tokens.css, as the page compiles it (same as pratinjau.mts) ─────────
type Tok = { name: string; value: string; usage?: string };
const tokens = JSON.parse(baca("tokens.json"));
const warnaTok = tokens.color.tokens as Tok[];
function tokensCss(): string {
  const warna = warnaTok.map((t) => { const m = /^\{(.+)\}$/.exec(t.value); return `  --${t.name}: ${m ? `var(--${m[1]})` : t.value};`; });
  const lain: string[] = [];
  for (const [k, fam] of Object.entries(tokens)) {
    if (["name", "version", "meta", "color", "type"].includes(k)) continue;
    for (const t of (fam as { tokens: Tok[] }).tokens) lain.push(`  --${t.name}: ${t.value};`);
  }
  for (const [k, v] of Object.entries(tokens.type.families as Record<string, string>)) lain.push(`  --font-${k}: ${v};`);
  const kelas: string[] = [];
  for (const g of tokens.type.groups) for (const s of g.styles) {
    const fam = s.family ?? g.family;
    kelas.push(`.${s.name} { font-family: var(--font-${fam}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};${s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : ""}${s.name === "t-eyebrow" ? " text-transform: uppercase;" : ""}${/stat/.test(s.name) ? " font-variant-numeric: tabular-nums;" : ""} }`);
  }
  const huruf = (tokens.type.fonts as Array<{ family: string; file: string; weight: string }>).map((f) => `@font-face { font-family: "${f.family}"; src: url("/${f.file}") format("woff2"); font-weight: ${f.weight}; font-display: block; }`);
  return `${huruf.join("\n")}\n:root {\n${warna.join("\n")}\n${lain.join("\n")}\n}\n${kelas.join("\n")}\n`;
}
const tokensCssTeks = tokensCss();

// ── a little markdown, enough for project/*.md ──────────────────────────
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sebaris = (s: string) => esc(s)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
  .replace(/&amp;nbsp;/g, "&nbsp;");
function md(teks: string): string {
  const baris = teks.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < baris.length) {
    const b = baris[i];
    if (!b.trim()) { i++; continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(b);
    if (h) { const n = Math.min(h[1].length + 1, 4); out.push(`<h${n}>${sebaris(h[2])}</h${n}>`); i++; continue; }
    if (b.startsWith("|")) {
      const rows: string[][] = [];
      while (i < baris.length && baris[i].startsWith("|")) { rows.push(baris[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())); i++; }
      const [kepala, , ...isi] = rows;
      out.push(`<table><thead><tr>${kepala.map((c) => `<th>${sebaris(c)}</th>`).join("")}</tr></thead><tbody>${isi.map((r) => `<tr>${r.map((c) => `<td>${sebaris(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s/.test(b)) {
      const urut = /^\s*\d+\./.test(b);
      const mula = urut ? Number(/^\s*(\d+)\./.exec(b)![1]) : 1;
      const item: string[] = [];
      // An item continues over a blank line when the next text is indented under it: a new paragraph,
      // a nested list (two levels) or a quote inside the item.
      const lanjut = (j: number) => { while (j < baris.length && !baris[j].trim()) j++; return j < baris.length && /^\s{2,}\S/.test(baris[j]); };
      let kosong = false;
      while (i < baris.length && (/^\s*([-*]|\d+\.)\s/.test(baris[i]) || (/^\s{2,}\S/.test(baris[i]) && item.length) || (!baris[i].trim() && item.length && lanjut(i)))) {
        const l = baris[i];
        const akhir = item.length - 1;
        if (!l.trim()) { kosong = true; i++; continue; }
        if (/^\s{6,}([-*]|\d+\.)\s/.test(l) && item[akhir].endsWith("</li></ul>")) item[akhir] = item[akhir].replace(/<\/li><\/ul>$/, `<ul><li>${sebaris(l.replace(/^\s+([-*]|\d+\.)\s/, ""))}</li></ul></li></ul>`);
        else if (/^\s{2,}([-*]|\d+\.)\s/.test(l)) item[akhir] += `<ul><li>${sebaris(l.replace(/^\s+([-*]|\d+\.)\s/, ""))}</li></ul>`;
        else if (/^\s{2,}>/.test(l)) {
          const q: string[] = [];
          while (i < baris.length && /^\s{2,}>/.test(baris[i])) { q.push(baris[i].replace(/^\s+>\s?/, "")); i++; }
          item[akhir] += `<blockquote>${md(q.join("\n"))}</blockquote>`; kosong = false; continue;
        } else if (/^\s{2,}\S/.test(l)) item[akhir] += kosong ? `<p>${sebaris(l.trim())}</p>` : ` ${sebaris(l.trim())}`;
        else item.push(sebaris(l.replace(/^\s*([-*]|\d+\.)\s/, "")));
        kosong = false;
        i++;
      }
      out.push(`<${urut ? `ol${mula !== 1 ? ` start="${mula}"` : ""}` : "ul"}>${item.map((x) => `<li>${x.replace(/<\/ul><ul>/g, "")}</li>`).join("")}</${urut ? "ol" : "ul"}>`);
      continue;
    }
    if (b.startsWith(">")) { const q: string[] = []; while (i < baris.length && baris[i].startsWith(">")) { q.push(baris[i].replace(/^>\s?/, "")); i++; } out.push(`<blockquote>${md(q.join("\n"))}</blockquote>`); continue; }
    const p: string[] = [];
    while (i < baris.length && baris[i].trim() && !/^(#|\||\s*[-*]\s|\s*\d+\.\s|>)/.test(baris[i])) { p.push(baris[i]); i++; }
    out.push(`<p>${sebaris(p.join(" "))}</p>`);
  }
  return out.join("\n");
}
function bagian(berkas: string, judul: string): string {
  const s = baca(berkas);
  const a = s.indexOf(`## ${judul}`);
  if (a < 0) throw new Error(`${berkas}: no section ${judul}`);
  const b = s.indexOf("\n## ", a + 3);
  return s.slice(s.indexOf("\n", a) + 1, b < 0 ? undefined : b);
}

// ── a component's card and guideline ────────────────────────────────────
function kartuInfo(nama: string) {
  const isi = baca(`components/${nama}/preview.html`);
  const attr = /^<!--\s*@dsCard([^>]*)-->/.exec(isi)?.[1] ?? "";
  return {
    tinggi: Number(/height=(\d+)/.exec(attr)?.[1] ?? 300),
    lebar: Number(/width=(\d+)/.exec(attr)?.[1] ?? 960),
    grup: /group="([^"]+)"/.exec(attr)?.[1] ?? "",
    subjudul: /subtitle="([^"]+)"/.exec(attr)?.[1] ?? "",
  };
}
const skenario = JSON.parse(readFileSync(join(sini, "skenario.json"), "utf8")) as Record<string, Array<{ nama: string; langkah: unknown[] }>>;
function kartu(nama: string, opsi: { sk?: string; langkah?: unknown[]; lebar?: number; tinggi?: number; skala?: number } = {}): string {
  const k = kartuInfo(nama);
  const w = opsi.lebar ?? k.lebar, h = opsi.tinggi ?? k.tinggi, sk = opsi.skala ?? 1;
  const langkah = opsi.langkah ? JSON.stringify(opsi.langkah).replace(/'/g, "&#39;") : opsi.sk ? JSON.stringify(skenario[nama].find((x) => x.nama === opsi.sk)!.langkah).replace(/'/g, "&#39;") : "";
  const bingkai = `<iframe src="/pratinjau/${nama}.html" title="${nama}" width="${w}" height="${h}" style="width:${w}px;height:${h}px;${sk !== 1 ? `transform:scale(${sk});transform-origin:0 0;` : ""}" ${langkah ? `data-langkah='${langkah}'` : ""}></iframe>`;
  return `<div class="kartu" style="width:${Math.round(w * sk)}px;height:${Math.round(h * sk)}px">${bingkai}</div>`;
}
function panduan(nama: string): { ringkas: string; status: string; aturan: string[] } {
  const p = `components/${nama}/README.md`;
  if (!existsSync(join(proyek, p))) return { ringkas: "", status: "", aturan: [] };
  const s = baca(p).replace(/^# .*\n/, "");
  const para = s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const ringkas = para[0] ?? "";
  const status = para.find((x) => x.startsWith("**Status")) ?? "";
  const baris = s.split("\n");
  let a = baris.findIndex((l) => /^\*\*Rules\*\*/.test(l.trim()));
  if (a < 0) a = baris.findIndex((l) => /^- /.test(l)) - 1;
  const aturan: string[] = [];
  for (let i = a + 1; i < baris.length && aturan.length < 5; i++) { if (/^- /.test(baris[i])) aturan.push(baris[i].slice(2)); else if (aturan.length && !baris[i].trim()) break; }
  return { ringkas, status, aturan };
}
function tandaStatus(teks: string): string {
  const m = /Status:\s*([A-Z][A-Z ,]+?)(?:\*\*|\.|\s\(|$)/.exec(teks) ?? /^(KEPT|CHANGED|NEW|NEEDS A RULING)/.exec(teks);
  if (!m) return "";
  const k = m[1].trim().replace(/,$/, "");
  const nada = /RULING/.test(teks.slice(0, 80)) ? "ruling" : /^NEW/.test(k) ? "new" : /^CHANGED/.test(k) ? "changed" : "kept";
  return `<span class="tanda tanda-${nada}">${esc(/RULING/.test(teks.slice(0, 80)) && !/RULING/.test(k) ? `${k} · needs a ruling` : k)}</span>`;
}
function baris(nama: string, opsi: { sk?: string } = {}): string {
  const k = kartuInfo(nama), g = panduan(nama);
  const teks = `<div class="teks"><p class="t-eyebrow">${esc(k.grup)}</p><h3>${esc(NAMA[nama] ?? nama.replace(/([a-z])([A-Z])/g, "$1 $2"))}</h3>${tandaStatus(g.status)}<p class="ringkas">${sebaris(g.ringkas)}</p>${g.aturan.length ? `<ul class="aturan">${g.aturan.map((a) => `<li>${sebaris(a)}</li>`).join("")}</ul>` : ""}</div>`;
  const lebar = k.lebar > 960;
  return `<section class="baris ${lebar ? "baris-tumpuk" : ""}">${teks}${kartu(nama, opsi)}</section>`;
}

// ── the board frame ─────────────────────────────────────────────────────
const gaya = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--surface-2); color: var(--ink-1); font-family: var(--font-sans); font-size: 16px; line-height: 24px; -webkit-font-smoothing: antialiased; }
.papan { width: 1600px; padding: 64px 72px 56px; display: grid; gap: 48px; }
.kepala { display: grid; gap: 12px; padding-bottom: 32px; border-bottom: 1px solid var(--line-strong); }
.kepala .atas { display: flex; justify-content: space-between; align-items: center; color: var(--ink-3); }

.kepala h1 { margin: 8px 0 0; } .kepala .lede { margin: 0; max-width: 64ch; color: var(--ink-2); font-size: 18px; line-height: 28px; }
.kaki { display: flex; justify-content: space-between; gap: 24px; padding-top: 24px; border-top: 1px solid var(--line-strong); color: var(--ink-3); font-size: 14px; line-height: 20px; }
h2.judul-bagian { margin: 0 0 4px; font-size: 22px; line-height: 28px; font-weight: 600; }
.catatan { margin: 0; color: var(--ink-2); max-width: 72ch; }
.kartu { background: var(--surface-0); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; flex: none; }
.kartu iframe { border: 0; display: block; background: var(--surface-0); }
.baris { display: grid; grid-template-columns: 400px 960px; gap: 40px; align-items: start; }
.baris-tumpuk { grid-template-columns: minmax(0, 1fr); }
.baris-tumpuk .teks { max-width: 960px; }
.teks { display: grid; gap: 10px; align-content: start; }
.teks h3 { margin: 0; font-size: 26px; line-height: 32px; font-weight: 600; }
.teks .ringkas { margin: 0; color: var(--ink-1); font-size: 18px; line-height: 28px; }
.aturan { margin: 4px 0 0; padding-left: 18px; display: grid; gap: 6px; color: var(--ink-2); font-size: 14px; line-height: 20px; }
.tanda { justify-self: start; font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; background: var(--surface-1); border: 1px solid var(--line-strong); color: var(--ink-2); }
.tanda-new { background: var(--pintar-primary-soft); border-color: transparent; color: var(--pintar-primary); }
.tanda-ruling { background: var(--status-attention-soft); border-color: transparent; color: var(--status-attention); }
.prosa { columns: 2; column-gap: 56px; font-size: 16px; line-height: 24px; color: var(--ink-1); }
.prosa > * { break-inside: avoid; }
.prosa > ul, .prosa > ol { break-inside: auto; } .prosa li { break-inside: avoid; }
button, input, select, textarea { font: inherit; }
.prosa h2, .prosa h3 { font-size: 18px; line-height: 24px; margin: 0 0 8px; font-weight: 600; break-after: avoid; }
.prosa p, .prosa ul, .prosa ol { margin: 0 0 16px; } .prosa ul, .prosa ol { padding-left: 20px; } .prosa li { margin: 0 0 6px; }
.prosa p:has(> strong:only-child) { break-after: avoid; }
.prosa blockquote { margin: 8px 0 12px; padding: 2px 0 2px 16px; border-left: 3px solid var(--pintar-primary); color: var(--ink-2); } .prosa blockquote p { margin: 0; } .prosa li > p { margin: 8px 0 0; }
.lebar-penuh { columns: 1; max-width: 1100px; }
table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 20px; background: var(--surface-1); border-radius: 12px; overflow: hidden; }
th, td { text-align: left; vertical-align: top; padding: 10px 14px; border-bottom: 1px solid var(--line); }
th { font-weight: 600; color: var(--ink-2); background: var(--surface-1); border-bottom: 1px solid var(--line-strong); }
code { font-family: var(--font-mono); font-weight: 500; font-size: 0.86em; color: var(--ink-1); background: var(--surface-1); padding: 0 4px; border-radius: 4px; border: 1px solid var(--line); }
.grid { display: grid; gap: 24px; }
.panel { background: var(--surface-1); border: 1px solid var(--line); border-radius: 12px; padding: 28px; display: grid; gap: 12px; align-content: start; }
.panel h3 { margin: 0; font-size: 18px; line-height: 24px; font-weight: 600; }
.panel p { margin: 0; color: var(--ink-2); }
.label { font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
`;
function papan(no: string, judul: string, lede: string, isi: string, total: number): string {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(judul)}</title>
<link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/components/bundle.css"><script src="/components/bundle.js"></script><style>${gaya}</style></head>
<body><main class="papan"><header class="kepala"><div class="atas"><span class="pds-merek" style="--merek-tinggi: 20px" role="img" aria-label="PINTAR">PINTAR</span><span class="label">PINTAR design system · ${no} / ${String(total).padStart(2, "0")}</span></div>
<h1 class="t-display">${esc(judul)}</h1><p class="lede">${lede}</p></header>
${isi}
<footer class="kaki"><span>A proposal for review: token set v3 (draft), not applied to PINTAR. Every word and value comes from the design system files.</span><span>${sha} · ${hariCommit}</span></footer></main>
<script>Pintar.siapkan && Pintar.siapkan();</script></body></html>`;
}

// ── the foundation boards ───────────────────────────────────────────────
function statusTok(u = "") { const m = /^(KEPT[^.]*|CHANGED[^.]*|NEW[^.(:]*)/.exec(u); return { kata: m ? m[1].split(/[ :,(]/)[0] : "", ruling: /NEEDS A RULING/.test(u) }; }
function arti(u = "") { return u.replace(/^(KEPT|CHANGED|NEW)[^.]*\.\s*/, "").replace(/^NEEDS A RULING \(question \d+\)\.?\s*/, "").split(/(?<=\.)\s/)[0]; }
function swatch(t: Tok): string {
  const st = statusTok(t.usage); const alias = /^\{(.+)\}$/.exec(t.value);
  const terang = /surface|soft|line|ink-disabled|scrim|context-ink|primary-ink/.test(t.name) && !/^ink-[123]$/.test(t.name);
  return `<div class="sw"><i style="background:var(--${t.name});${terang ? "box-shadow: inset 0 0 0 1px var(--line);" : ""}"></i><div class="sw-teks"><code>${t.name}</code><span class="nilai">${alias ? `= ${alias[1]}` : esc(t.value)}</span>${st.kata ? `<span class="tanda ${st.ruling ? "tanda-ruling" : st.kata === "NEW" ? "tanda-new" : ""}">${st.kata}${st.ruling ? " · ruling" : ""}</span>` : ""}<span class="arti">${sebaris(arti(t.usage))}</span></div></div>`;
}
const kelompokWarna: Array<[string, RegExp]> = [
  ["Grounds", /^surface-/], ["Ink", /^ink-/], ["Lines", /^line/], ["PINTAR green", /^pintar-|^focus-ring/],
  ["Status, always with a word", /^status-/], ["Table rows (Dr Gladys, 5 Oct): roles, no new colour", /^table-/], ["Layers and context", /^scrim|^context/],
];
const gayaWarna = `<style>
.warna { display: grid; gap: 32px; }
.warna-kel { display: grid; gap: 12px; } .warna-isi { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }
.sw { display: grid; gap: 10px; align-content: start; } .sw i { display: block; height: 72px; border-radius: 8px; }
.sw-teks { display: grid; gap: 4px; font-size: 14px; line-height: 20px; } .sw-teks code { justify-self: start; } .sw-teks .nilai { color: var(--ink-3); font-variant-numeric: tabular-nums; }
.sw-teks .arti { color: var(--ink-2); } .sw-teks .tanda { font-size: 11px; padding: 2px 8px; }
.kontras { columns: 2; column-gap: 32px; } .kontras table { break-inside: auto; }
</style>`;
function papanWarna(): string {
  const kel = kelompokWarna.map(([j, re]) => `<div class="warna-kel"><h2 class="judul-bagian">${j}</h2><div class="warna-isi">${warnaTok.filter((t) => re.test(t.name)).map(swatch).join("")}</div></div>`).join("");
  const k = readFileSync(join(akar, "render", "kontras.md"), "utf8");
  const tabel = k.slice(k.indexOf("| Pair |"), k.indexOf("**For information")).trim().split("\n");
  const separuh = Math.ceil((tabel.length - 2) / 2);
  const t1 = [tabel[0], tabel[1], ...tabel.slice(2, 2 + separuh)].join("\n"), t2 = [tabel[0], tabel[1], ...tabel.slice(2 + separuh)].join("\n");
  return gayaWarna + `<section class="warna">${kel}</section>`;
}
function papanWarna2(): string {
  const k = readFileSync(join(akar, "render", "kontras.md"), "utf8");
  const tabel = k.slice(k.indexOf("| Pair |"), k.indexOf("**For information")).trim().split("\n");
  const separuh = Math.ceil((tabel.length - 2) / 2);
  const t1 = [tabel[0], tabel[1], ...tabel.slice(2, 2 + separuh)].join("\n"), t2 = [tabel[0], tabel[1], ...tabel.slice(2 + separuh)].join("\n");
  return gayaWarna + `<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>Rules</h2>${md(bagian("01-colour.md", "Rules"))}</div><div class="grid">${kartu("Accent", { lebar: 960, skala: 0.7 })}</div></section>
<section class="grid"><h2 class="judul-bagian">Contrast, computed (WCAG: text 4.5:1, marks and outlines 3:1)</h2><div class="grid" style="grid-template-columns: 1fr 1fr; gap: 24px">${md(t1)}${md(t2)}</div></section>`;
}
function papanHuruf(): string {
  const baris = (tokens.type.groups as Array<{ name: string; styles: Array<Record<string, string | number>> }>).flatMap((g) => g.styles.map((s) => {
    const st = statusTok(String(s.usage ?? ""));
    return `<div class="tipe"><div class="tipe-meta"><code>${s.name}</code><span>${s.fontSize} / ${s.lineHeight} · ${s.fontWeight}${s.family === "mono" ? " · mono" : ""}</span>${st.kata ? `<span class="tanda ${st.kata === "NEW" ? "tanda-new" : ""}">${st.kata}</span>` : ""}</div><div class="${s.name}" style="min-width:0">${esc(String(s.sample ?? ""))}</div><p class="tipe-arti">${sebaris(arti(String(s.usage ?? "")))}</p></div>`;
  })).join("");
  return `<style>.tipe { display: grid; grid-template-columns: 240px minmax(0, 1fr) 420px; gap: 32px; align-items: baseline; padding: 20px 0; border-bottom: 1px solid var(--line); } .tipe-meta { display: grid; gap: 4px; font-size: 14px; line-height: 20px; color: var(--ink-3); } .tipe-meta code { justify-self: start; } .tipe-meta .tanda { font-size: 11px; padding: 2px 8px; } .tipe-arti { margin: 0; font-size: 14px; line-height: 20px; color: var(--ink-2); }
.wajah { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; } .wajah .contoh { font-size: 56px; line-height: 64px; }</style>
<section class="wajah"><div class="panel"><span class="label">Plus Jakarta Sans 400</span><div class="contoh" style="font-weight:400">Aa Bb 0123</div><p>Body text, help, metadata.</p></div><div class="panel"><span class="label">Plus Jakarta Sans 600</span><div class="contoh" style="font-weight:600">Aa Bb 0123</div><p>Titles, labels, the selected item.</p></div><div class="panel"><span class="label">IBM Plex Mono 500</span><div class="contoh" style="font-family:var(--font-mono);font-weight:500">7Q2Z 0D9K</div><p>PINTAR IDs, codes, references. Never a third weight.</p></div></section>
<section><h2 class="judul-bagian">The ladder</h2>${baris}</section>
<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>From v2 to v3</h2>${md(bagian("02-typography.md", "From v2 to v3"))}</div><div class="prosa lebar-penuh"><h2>Rules</h2>${md(bagian("02-typography.md", "Rules"))}</div></section>`;
}
function papanRuang(): string {
  const fam = (k: string) => (tokens[k].tokens as Tok[]);
  const ruang = fam("spacing").map((t) => `<div class="ruang"><i style="width:${t.value};height:${t.value}"></i><code>${t.name}</code><span>${t.value}</span><p>${sebaris(arti(t.usage))}</p></div>`).join("");
  const sudut = fam("radius").map((t) => `<div class="sudut"><i style="border-radius:var(--${t.name})"></i><code>${t.name}</code><span>${t.value === "999px" ? "pill" : t.value}</span>${/RULING/.test(t.usage ?? "") ? `<span class="tanda tanda-ruling">needs a ruling</span>` : ""}<p>${sebaris(arti(t.usage))}</p></div>`).join("");
  const ukuran = fam("size").filter((t) => /^control-/.test(t.name)).sort((a, b) => parseInt(a.value) - parseInt(b.value)).map((t) => `<div class="kontrol"><i style="height:${t.value}">${t.value}</i><code>${t.name}</code><p>${sebaris(arti(t.usage))}</p></div>`).join("");
  const ukur = fam("size").filter((t) => /^measure-(auth|narrow|read|stage)/.test(t.name)).map((t) => `<div class="ukur"><i style="width:${t.value}"><code>${t.name}</code> ${t.value}</i><p>${sebaris(arti(t.usage))}</p></div>`).join("");
  const bayang = fam("shadow").map((t) => `<div class="bayang" style="box-shadow:${t.value}"><code>${t.name}</code><span class="tanda tanda-ruling">needs a ruling (question 5)</span><p>${sebaris(arti(t.usage))}</p></div>`).join("");
  return `<style>
.ruang-isi { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 16px; align-items: end; }
.ruang { display: grid; gap: 6px; align-content: end; font-size: 14px; line-height: 20px; color: var(--ink-3); } .ruang i { display: block; background: var(--pintar-primary); border-radius: 2px; } .ruang code { justify-self: start; } .ruang p { margin: 0; color: var(--ink-2); font-size: 13px; line-height: 18px; min-height: 72px; }
.sudut-isi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; } .sudut { display: grid; gap: 6px; font-size: 14px; line-height: 20px; color: var(--ink-3); } .sudut i { display: block; height: 96px; background: var(--surface-1); border: 2px solid var(--ink-2); } .sudut code, .sudut .tanda { justify-self: start; } .sudut p { margin: 0; color: var(--ink-2); }
.kontrol-isi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-items: end; } .kontrol { display: grid; gap: 6px; font-size: 14px; line-height: 20px; } .kontrol i { display: grid; place-items: center; font-style: normal; font-weight: 600; background: var(--pintar-primary-soft); color: var(--pintar-primary); border-radius: 8px; } .kontrol code { justify-self: start; } .kontrol p { margin: 0; color: var(--ink-2); min-height: 60px; }
.ukur { display: grid; gap: 6px; } .ukur i { display: block; font-style: normal; padding: 10px 14px; background: var(--surface-1); border: 1px solid var(--line-strong); border-radius: 8px; font-size: 14px; line-height: 20px; font-weight: 600; } .ukur p { margin: 0 0 8px; color: var(--ink-2); font-size: 14px; line-height: 20px; }
.pita { display: grid; grid-template-columns: 640fr 384fr 256fr 320fr; border-radius: 12px; overflow: hidden; border: 1px solid var(--line-strong); } .pita div { padding: 16px; display: grid; gap: 4px; background: var(--surface-1); border-right: 1px solid var(--line); font-size: 14px; line-height: 20px; color: var(--ink-2); } .pita b { color: var(--ink-1); font-size: 16px; }
.bayang-isi { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; } .bayang { background: var(--surface-1); border-radius: 12px; padding: 28px; display: grid; gap: 8px; } .bayang code, .bayang .tanda { justify-self: start; } .bayang p { margin: 0; color: var(--ink-2); }
</style>
<section class="grid"><h2 class="judul-bagian">Space: a 4 px base, used in 8s (unchanged from v2)</h2><div class="ruang-isi">${ruang}</div></section>
<section class="grid"><h2 class="judul-bagian">Corners</h2><div class="sudut-isi">${sudut}</div></section>
<section class="grid"><h2 class="judul-bagian">Control heights: every target at least 44 px</h2><div class="kontrol-isi">${ukuran}</div></section>
<section class="grid"><h2 class="judul-bagian">Content widths, drawn at full size</h2>${ukur}</section>
<section class="grid"><h2 class="judul-bagian">Screen bands (question 1)</h2><div class="pita"><div><b>Under 640</b>Phone. Top bar, «Keluar», the menu opens a drawer. One column. Primary action full width on a task.</div><div><b>640 to 1023</b>Tablet. Top bar and drawer; two columns where they fit.</div><div><b>1024 to 1279</b>Rail: icons only, 72 px, names as tooltips.</div><div><b>1280 and up</b>The full navigation, 248 px.</div></div></section>
<section class="grid"><h2 class="judul-bagian">Elevation: only for layers floating over the page</h2><div class="bayang-isi">${bayang}</div><p class="catatan">In the page, things are separated by hairlines and grounds, never shadows. No blur and no backdrop filters.</p></section>
<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>What stays, moves, stacks or steps back</h2>${md(bagian("03-layout.md", "What stays, moves, stacks or steps back"))}</div><div class="prosa lebar-penuh"><h2>School reality</h2>${md(bagian("03-layout.md", "School reality"))}</div></section>`;
}
function papanTataBahasa(): string {
  const tahap = [
    ["Click", `<button type="button" class="pds-btn pds-btn-primary is-pressed" tabindex="-1">Simpan</button>`, "The pressed ground for an instant. Every control has one."],
    ["Acknowledged", `<button type="button" class="pds-btn pds-btn-primary" aria-busy="true" aria-disabled="true"><span class="pds-dot" aria-hidden="true"></span>Menyimpan…</button>`, "Under 100 ms: its own colour, the working dot, the progressive word. It cannot be pressed twice."],
    ["Processing", `<p class="pds-result pds-result-working" role="status"><span class="pds-dot" aria-hidden="true"></span><span>Jaringan sedang lambat. PINTAR masih bekerja; Anda tidak perlu menekan lagi.</span></p>`, "Over 3 seconds, it says why. Never a bar that moves by itself."],
    ["Completed", `<button type="button" class="pds-btn pds-btn-primary" data-keadaan="selesai" aria-disabled="true"><i data-ikon="check"></i>Tersimpan</button><p class="pds-result pds-result-ok" role="status"><i data-ikon="check"></i><span>Bab 3 tersedia untuk 31 murid Kelas 5A mulai sekarang.</span></p>`, "Only after the server confirms: ✓, the result word, and what changed for whom."],
    ["Did not complete", `<button type="button" class="pds-btn pds-btn-primary">Simpan</button><p class="pds-result pds-result-blocked" role="alert"><i data-ikon="circle-alert"></i><span>Belum tersimpan. Periksa koneksi, lalu coba lagi. Isian Anda masih ada.</span></p>`, "Back to its verb; what did not happen, what to do, and that nothing typed is lost."],
    ["Next action", `<a class="pds-link" href="#">Lihat siapa yang sudah mulai</a>`, "Every end has a way forward."],
  ];
  const kata = [
    ["Save", "Simpan", "Menyimpan…", "Tersimpan"], ["Send (a server-confirmed result)", "Kirim jawaban", "Mengirim…", "Terkirim"], ["Publish", "Terbitkan", "Menerbitkan…", "Selesai"],
  ].map(([a, r, w, d]) => `<tr><td><strong>${a}</strong></td><td><button type="button" class="pds-btn pds-btn-primary" tabindex="-1">${r}</button></td><td><button type="button" class="pds-btn pds-btn-primary" aria-busy="true" aria-disabled="true" tabindex="-1"><span class="pds-dot" aria-hidden="true"></span>${w}</button></td><td><button type="button" class="pds-btn pds-btn-primary" data-keadaan="selesai" aria-disabled="true" tabindex="-1"><i data-ikon="check"></i>${d}</button></td></tr>`).join("");
  const waktu = [["under 100 ms", "acknowledged"], ["0.5 to 1 s", "ordinary navigation"], ["under 1 s", "a save"], ["1 to 2 s", "useful content on a heavy page"], ["over 3 s", "exceptional, and explained"]]
    .map(([a, b]) => `<div class="panel"><span class="t-stat-small">${a}</span><p>${b}</p></div>`).join("");
  return `<style>.alur { font-size: 30px; line-height: 40px; font-weight: 600; margin: 0; } .alur span { color: var(--pintar-primary); }
.tahap { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0; border: 1px solid var(--line); border-radius: 12px; background: var(--surface-1); overflow: hidden; }
.tahap > div { padding: 24px 20px; display: grid; gap: 14px; align-content: start; border-right: 1px solid var(--line); } .tahap > div:last-child { border-right: 0; }
.tahap .no { font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); } .tahap .wujud { display: grid; gap: 10px; justify-items: start; min-height: 120px; align-content: start; } .tahap p.aturan-t { margin: 0; font-size: 14px; line-height: 20px; color: var(--ink-2); }
.kata td { vertical-align: middle; } .waktu { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }</style>
<section class="grid"><p class="alur">Receive <span>→</span> acknowledge <span>→</span> explain the status <span>→</span> give the next step.</p>
<div class="tahap">${tahap.map(([n, w, a], i) => `<div><span class="no">${i + 1} · ${n}</span><div class="wujud">${w}</div><p class="aturan-t">${a}</p></div>`).join("")}</div>
<p class="catatan">Sample sentences, except «Jaringan sedang lambat…» and the Bab 3 line, which are the brief's and the spec's. The wording of every live line comes from the copy table (<code>src/lib/hle.ts</code>).</p></section>
<section class="grid" style="grid-template-columns: 1.3fr 1fr; gap: 40px; align-items: start"><div class="grid"><h2 class="judul-bagian">One pattern, three words</h2><table class="kata"><thead><tr><th>Act</th><th>Rest</th><th>Working</th><th>Done, after the server confirms</th></tr></thead><tbody>${kata}</tbody></table></div>
<div class="panel"><span class="label">The exception: email</span><h3>Email never ends in ✓</h3><p>PINTAR cannot confirm that an email arrived (D-098(c)). The button returns to its verb, and its line says PINTAR is sending.</p><div class="pds-row"><button type="button" class="pds-btn pds-btn-secondary" tabindex="-1">Kirim ulang kode</button></div><p class="pds-result pds-result-info" role="status"><i data-ikon="info"></i><span>Jika alamat ini terdaftar, PINTAR sedang mengirim kode baru.</span></p><p style="font-size:14px;line-height:20px">aktifkan.kode_ulang_ok (real). EMAILJUJUR-L01 enforces it.</p></div></section>
<section class="grid"><h2 class="judul-bagian">Timing objectives (D-047(b))</h2><div class="waktu">${waktu}</div></section>
<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>Validation</h2>${md(bagian("04-interaction.md", "Validation"))}<h2>Results and alerts</h2>${md(bagian("04-interaction.md", "Results and alerts"))}</div><div class="prosa lebar-penuh"><h2>Loading and empty</h2>${md(bagian("04-interaction.md", "Loading and empty"))}</div></section>`;
}
function papanKeadaan(): string {
  return `<section class="grid">${kartu("InteractionStates", { lebar: 1100 })}</section>
<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>States</h2>${md(bagian("04-interaction.md", "States"))}</div><div class="grid"><div class="prosa lebar-penuh"><h2>Motion</h2>${md(bagian("04-interaction.md", "Motion"))}</div></div></section>
<section class="grid">${baris("Motion")}</section>`;
}
function papanNavigasi(): string {
  return `<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>The four shells</h2>${md(bagian("05-navigation.md", "The four shells"))}</div><div class="prosa lebar-penuh"><h2>«Keluar» and the name</h2>${md(bagian("05-navigation.md", "«Keluar» and the name"))}<h2>Small screens</h2>${md(bagian("05-navigation.md", "Small screens"))}</div></section>
<section class="grid"><h2 class="judul-bagian">The staff shell at 1280 px (question 1)</h2>${kartu("AppShell", { lebar: 1328, tinggi: 1000, skala: 1456 / 1328 })}</section>
<section class="grid"><h2 class="judul-bagian">The rail at 1100 px</h2>${kartu("AppShell", { lebar: 1180, tinggi: 1060, sk: "rail-1100" })}</section>
`;
}
function papanNavigasi2(): string {
  return `<section class="grid" style="grid-template-columns: 440px 440px minmax(0, 1fr); gap: 32px; align-items: start"><div class="grid"><h2 class="judul-bagian">A phone at 390 px</h2>${kartu("AppShell", { lebar: 440, tinggi: 1240, langkah: [{ klik: "input[name=as-lebar][value='390']", tunggu: 200 }] })}</div><div class="grid"><h2 class="judul-bagian">The drawer open</h2>${kartu("AppShell", { lebar: 440, tinggi: 1240, sk: "ponsel-390-laci" })}</div><div class="prosa lebar-penuh" style="padding-top: 40px"><h2>Under 1024 px</h2><p>A top bar carries the mark, the current place's name, «Keluar» and a menu button. The menu opens a left drawer with the same places and the identity block, over a scrim.</p><p>«Keluar» never moves into the drawer: it stays one press away on every signed-in screen (D-009).</p><p>The review controls above each frame («See as», «Width») are not part of the product.</p></div></section>
<section class="grid"><h2 class="judul-bagian">The learner's top bar, the focus shell and the public shell</h2>${kartu("LearnerShell", { lebar: 1040, skala: 1.4 })}</section>
<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>Which places each person sees</h2>${md(bagian("05-navigation.md", "Which places each person sees"))}</div><div class="prosa lebar-penuh"><h2>Within a page</h2>${md(bagian("05-navigation.md", "Within a page"))}</div></section>`;
}
function papanNiat(): string {
  const intent = bagian("README.md", "The intent");
  const prinsip = [...intent.matchAll(/^- \*\*(.+?)\*\*\s*(.*)$/gm)].map((m) => `<div class="panel"><h3>${sebaris(m[1])}</h3><p>${sebaris(m[2])}</p></div>`).join("");
  const pasangan = [
    ["«Terbitkan Bab 4»", "«OK», «Ya», «Submit»", "An action is a verb and its object."],
    ["«24 dari 31»", "«77%» on its own", "A number never stands alone."],
    ["«Belum cukup untuk disimpulkan»", "«0» standing in for an unknown", "Say what is not known."],
    ["«Bukan akun Anda?» and «Keluar»", "«Masuk sebagai Ayu» on a shared screen", "A learner is never named (S15, D-020)."],
    ["«PINTAR sedang mengirim kode baru.»", "«✓ Terkirim» for an email", "PINTAR cannot confirm an email arrived (D-098(c))."],
    ["«Kode ini tidak cocok. Pakai kode di email terbaru, atau minta kode baru.»", "Raw server text", "Errors blame nobody and say what to do (D-011)."],
    ["«Jumat, 9 Okt 2026, 07.30 WIB»", "«10/9/26 7:30»", "Jakarta time, and it says so."],
    ["«Bab 3 tersedia untuk 31 murid Kelas 5A mulai sekarang.»", "«Hebat!», confetti, points", "Success is the plain fact (D-059(e))."],
  ].map(([y, t, w]) => `<tr><td>${esc(y)}</td><td>${esc(t)}</td><td>${esc(w)}</td></tr>`).join("");
  return `<section class="grid">${kartu("Cover", { lebar: 960, tinggi: 288, skala: 1456 / 960 })}</section>
<section class="grid" style="grid-template-columns: repeat(3, 1fr)">${prinsip}</section>
<section class="grid"><h2 class="judul-bagian">How PINTAR speaks</h2><table><thead><tr><th>Write</th><th>Never</th><th>Because</th></tr></thead><tbody>${pasangan}</tbody></table></section>
<section class="prosa"><h2>Content fundamentals</h2>${md(bagian("README.md", "Content fundamentals"))}</section>`;
}
function papanSekilas(): string {
  return `<section class="grid">${kartu("Specimen", { lebar: 960, skala: 1456 / 960 })}</section>`;
}
function papanAkses(): string {
  const angka = [["WCAG 2.2 AA", "the named standard (question 10)"], ["44 px", "every target"], ["320 px", "usable, no sideways scroll"], ["4.5 : 1", "text contrast"], ["3 : 1", "outlines, focus, marks"], ["160 ms", "colour and opacity only; off under reduced motion"]]
    .map(([a, b]) => `<div class="panel"><span class="t-stat-small">${a}</span><p>${b}</p></div>`).join("");
  return `<section class="grid" style="grid-template-columns: repeat(6, 1fr)">${angka}</section>
<section class="prosa">${md(baca("06-accessibility.md").replace(/^# .*\n/, ""))}</section>`;
}
function papanPertanyaan(): string {
  return `<section class="prosa lebar-penuh" style="max-width: 1200px">${md(bagian("07-proposal.md", "Questions for Yazid"))}</section>
<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>Departures from existing rulings</h2>${md(bagian("07-proposal.md", "Departures from existing rulings: for Yazid, not decided here"))}</div><div class="prosa lebar-penuh"><h2>What does not change</h2>${md(bagian("07-proposal.md", "What does not change"))}</div></section>`;
}
function papanTanggal(): string {
  return `<section class="grid">${kartu("Dates", { lebar: 1040, skala: 1.4 })}</section>
${baris("DateTime")}
<section class="grid" style="grid-template-columns: 1fr 1fr; gap: 40px"><div class="prosa lebar-penuh"><h2>Native date fields</h2>${md(bagian("10-dates.md", "Native date fields"))}</div><div class="prosa lebar-penuh"><h2>In the product today (for the application pass)</h2>${md(bagian("10-dates.md", "In the product today (for the application pass, nothing changed)"))}</div></section>
<section class="prosa lebar-penuh" style="max-width: 1456px"><h2>Specimen audit (5 Oct)</h2>${md(bagian("10-dates.md", "Specimen audit (5 Oct)"))}</section>`;
}
function papanMerek(): string {
  const r = baca("components/Wordmark/README.md").replace(/^.*\n/, "");
  return `<section class="grid">${kartu("Wordmark", { lebar: 1040, skala: 1456 / 1040 })}</section>
<section class="prosa">${md(r)}</section>`;
}
function papanKomponen(daftar: Array<string | [string, string]>): string {
  return daftar.map((d) => (typeof d === "string" ? baris(d) : baris(d[0], { sk: d[1] }))).join("\n");
}

const PAPAN: Array<[string, string, string, string, () => string]> = [
  ["01", "intent", "PINTAR: intent and voice", "Complex underneath. Calm above. One obvious next action per screen, hierarchy from type and space, colour only with a reason, and every click answered.", papanNiat],
  ["02a", "colour-palette", "Colour: the palette", "Neutral first, one green, status only with a word. Every v2 value is kept; additions are marked NEW, and departures need a ruling.", papanWarna],
  ["02b", "colour-rules-contrast", "Colour: rules, accent and contrast", "Accent only where it says context, hierarchy, state or attention. Every pair computed against WCAG.", papanWarna2],
  ["03", "typography", "Typography", "Plus Jakarta Sans at 400 and 600, IBM Plex Mono 500 for identifiers. Eight interface sizes, plus the learner's question stem.", papanHuruf],
  ["04", "space-shape-layout", "Space, shape and layout", "A 4 px base used in 8s, three corners and a pill, 44 px targets, three content widths and four screen bands.", papanRuang],
  ["05", "interaction-grammar", "The interaction grammar", "PINTAR hears every click: it answers at once, says what it is doing, says honestly how it ended, and offers the next step.", papanTataBahasa],
  ["06", "states-motion", "States and motion", "One grammar of states across every control. Motion is colour and opacity at 160 ms, and only where it has a reason.", papanKeadaan],
  ["07", "navigation", "Navigation and shells", "Upper navigation is what I can do in PINTAR; the bottom is me. A proposal: it replaces today's staff header only with Yazid's approval. (The same board as 07a and 07b, in one image.)", () => papanNavigasi() + papanNavigasi2()],
  ["07a", "navigation-staff", "Navigation and shells: staff", "Upper navigation is what I can do in PINTAR; the bottom is me. A proposal: it replaces today's staff header only with Yazid's approval.", papanNavigasi],
  ["07b", "navigation-small-learner", "Navigation and shells: small screens and learners", "Under 1024 px a top bar and a drawer, «Keluar» always in reach. A learner's bar names no one.", papanNavigasi2],
  ["08", "at-a-glance", "At a glance", "Every family of control together, to judge in one look: does this feel like PINTAR?", papanSekilas],
  ["09", "actions", "Components: actions", "Five button families at 44 px, and the link.", () => papanKomponen(["Button", "Link"])],
  ["10a", "inputs-fields", "Components: fields and forms", "Label above, help under the label, the error under the field. Validation on submit.", () => papanKomponen(["TextField", "Textarea", "Select", "Search", "DateTime", ["FormLayout", "galat"]])],
  ["10b", "inputs-choices", "Components: choices", "The whole row is the target; a setting that takes effect at once says its state in a word.", () => papanKomponen(["Checkbox", "Radio", "Switch"])],
  ["11", "navigation-controls", "Components: moving within a page", "Tabs for views of one thing, the segmented control for a value, pagination that always says where you are, and the scope line.", () => papanKomponen(["Tabs", "SegmentedControl", "Pagination", "Breadcrumb"])],
  ["12a", "feedback-results", "Components: results and alerts", "A result at the action that caused it; a state of a whole section at the top of that section.", () => papanKomponen([["ActionFeedback", "tersimpan"], "Alert"])],
  ["12b", "feedback-progress-loading-empty", "Components: progress, loading and empty", "Committed counts and named steps, the page's own shape while it loads, and three kinds of empty.", () => papanKomponen(["Progress", "Loading", "EmptyState"])],
  ["13", "data", "Components: data", "One table that searches, filters, sorts, selects and pages; badges for how something is doing; tags for what it is.", () => papanKomponen(["Table", "Badge", "Tag"])],
  ["13b", "table-rows", "Table rows: striping (Dr Gladys)", "A whole class in one table. Quiet stripes to follow a row, hover and selection that each read on their own, all from existing PINTAR colours.", () => papanKomponen(["TableRows"])],
  ["14a", "containers", "Components: containers", "Type and space first; a container only when something must stand apart.", () => papanKomponen(["Panel", "Disclosure", "Confirmation", ["Identity", "menu"]])],
  ["14b", "layers", "Components: layers", "Layers float only when they must: a rare dialog, the drawers, a menu, a tooltip.", () => papanKomponen([["Dialog", "terbuka"], ["Drawer", "terbuka"], ["Menu", "terbuka"], ["Tooltip", "fokus"]])],
  ["15", "identity-1", "Identity screens: on a shared computer", "The lock, the device question, the idle warning, the PIN and the code: Gates 3 to 6.", () => papanKomponen(["LockScreen", "DeviceChoice", "IdleWarning", "PinInput", "CodeInput"])],
  ["16", "identity-2", "Identity screens: activation and recovery", "Password rules shown before typing, activation one step at a time, and the way back in.", () => papanKomponen(["PasswordField", "ActivationFlow", "Recovery"])],
  ["17", "foundations", "Foundations in use", "A page made of type and space, the layout grid, and the forty icons.", () => papanKomponen(["Hierarchy", "LayoutGrid", "Icons"])],
  ["18", "accessibility", "Accessibility and school reality", "Shared computers, 1366 × 768 laptops, slow networks and children still learning to read. Nothing depends on a phone, hover, animation or a fast machine.", papanAkses],
  ["20", "dates", "Dates and times (Dr Gladys)", "Indonesia-first: day before month, the month in words wherever a misreading would matter, always WIB. A native date field is followed by the date in words.", papanTanggal],
  ["21", "wordmark", "The PINTAR wordmark (locked)", "PINTAR, the name, in Helvetica Neue 65 Medium capitals, in PINTAR green, with nothing added. Production refinement only.", papanMerek],
  ["19", "questions", "Open questions for Yazid", "Nothing here is applied until Yazid approves. These are the decisions the proposal needs; 16 and 17 were ruled on 5 Oct.", papanPertanyaan],
];

// ── serve, render, save ─────────────────────────────────────────────────
const halaman = new Map<string, string>();
const tipe: Record<string, string> = { ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".png": "image/png", ".html": "text/html" };
const blob = JSON.parse(readFileSync(join(sini, "blob.json"), "utf8")) as Record<string, string>;
const server = createServer((r, w) => {
  const url = decodeURIComponent((r.url ?? "/").split("?")[0]);
  const pr = /^\/pratinjau\/(\w+)\.html$/.exec(url);
  if (pr) {
    const isi = baca(`components/${pr[1]}/preview.html`);
    w.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    w.end(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/components/bundle.css"><script src="/components/bundle.js"></script></head><body>${isi}</body></html>`);
    return;
  }
  if (halaman.has(url)) { w.writeHead(200, { "content-type": "text/html; charset=utf-8" }); w.end(halaman.get(url)); return; }
  if (url === "/tokens.css") { w.writeHead(200, { "content-type": "text/css" }); w.end(tokensCssTeks); return; }
  let berkas = "";
  if (url.startsWith("/_blob/") && blob[url.slice(7)]) berkas = join(repo, blob[url.slice(7)]);
  else if (url.startsWith("/fonts/")) berkas = join(repo, "public", "fonts", url.slice(7));
  else berkas = join(proyek, url);
  if (!berkas.startsWith(repo) || !existsSync(berkas)) { w.writeHead(404); w.end(); return; }
  w.writeHead(200, { "content-type": tipe[extname(berkas)] ?? "application/octet-stream" });
  w.end(readFileSync(berkas));
});
await new Promise<void>((ok) => server.listen(0, "127.0.0.1", () => ok()));
const port = (server.address() as { port: number }).port;

const dipilih = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [no, nama, judul, lede, isi] of PAPAN) {
  if (dipilih.length && !dipilih.includes(no) && !dipilih.includes(nama)) continue;
  halaman.set(`/papan/${no}.html`, papan(no, judul, lede, isi(), 21));
  let skala = 2;
  let page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: skala });
  const galat: string[] = [];
  page.on("pageerror", (e: Error) => galat.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/papan/${no}.html`, { waitUntil: "networkidle" });
  const tinggiAwal = await page.evaluate(() => document.documentElement.scrollHeight);
  if (tinggiAwal * skala > 8000) {
    // Image uploads accept at most 8000 px on the long side: draw this board smaller rather than cut it.
    skala = Math.floor((7990 / (tinggiAwal + 200)) * 100) / 100;
    await page.close();
    page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: skala });
    page.on("pageerror", (e: Error) => galat.push(e.message));
    await page.goto(`http://127.0.0.1:${port}/papan/${no}.html`, { waitUntil: "networkidle" });
  }
  for (const f of page.frames()) await f.evaluate(() => document.fonts.ready).catch(() => {});
  for (const el of await page.$$("iframe[data-langkah]")) {
    const f = await el.contentFrame();
    for (const l of JSON.parse((await el.getAttribute("data-langkah"))!) as Array<{ klik?: string; tunggu?: number; tekan?: string }>) {
      if (l.klik) await f.click(l.klik);
      if (l.tekan) await f.press("body", l.tekan);
      await page.waitForTimeout(l.tunggu ?? 120);
    }
  }
  await page.waitForTimeout(300);
  const berkas = join(keluaran, `${no}-${nama}.png`);
  await page.screenshot({ path: berkas, fullPage: true });
  const ukuran = await page.evaluate(() => document.documentElement.scrollHeight);
  if (ukuran * skala > 8000) console.log(`  note: ${no} is ${Math.round(ukuran * skala)} px tall; image uploads accept at most 8000`);
  console.log(`${no}-${nama}.png  ${Math.round(1600 * skala)} × ${Math.round(ukuran * skala)} px (${skala}x)  ${(statSync(berkas).size / 1048576).toFixed(1)} MB${galat.length ? "  ERRORS: " + galat.join("; ") : ""}`);
  await page.close();
}
await browser.close();
server.close();

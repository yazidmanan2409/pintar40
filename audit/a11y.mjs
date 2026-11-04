// Batch 0 (B0-B; D-142, owner authorisation 2 Nov): the accessibility and responsive BASELINE harness.
//
// Called by crawl.mjs on every page each persona reaches, after the crawl's own checks. It RECORDS; it does not
// judge. Nothing here changes the crawl's verdict (its `broken` list): Batch 0 measures where every screen stands so
// later batches can be held to it (G §2: skip link and title on every screen, clean axe, keyboard operation, no
// clipping at 320 px, 200 % zoom). A finding here is a baseline row, not a regression.
//
// Per page:
//   axe        axe-core (pinned in audit/package.json) with the WCAG 2.0/2.1/2.2 A and AA tags; violations by rule,
//              impact and node count, with up to three target selectors each
//   judul      the document title: present, not empty, and not the bare application name shared by every page
//   lompat     the first Tab stop: a same-page link whose target exists («Langsung ke konten» or similar)
//   papan      a keyboard walk of up to 40 Tab presses: stops reached, whether each shows a visible focus indicator,
//              whether focus is stuck on one element, whether the page has no focus stop at all, and whether any
//              focused element sits off screen (focus on <body> after the last stop is the page's end, not a defect)
//   lebar      at 320, 640 (1280 at 200 % zoom), 1024 and 1280 CSS px: page wider than the window (horizontal
//              scroll), and text clipped by a box that hides overflow without an ellipsis
//
// Pages are keyed by persona and path; a run writes OUT_DIR/a11y.json and a summary to the job log.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export const AXE_PATH = require.resolve("axe-core/axe.min.js");
export const LEBAR = [320, 640, 1024, 1280];
const NAMA_APLIKASI = /^\s*PINTAR\s*$/i;

/** In the page: a horizontal overflow and the clipped text boxes, at the current width. */
const UKUR = () => {
  const d = document.documentElement;
  const lebar = d.clientWidth;
  const meluap = d.scrollWidth > lebar + 1 ? d.scrollWidth : null;
  const nama = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + [...el.classList].slice(0, 2).map((c) => `.${c}`).join("");
  const terpotong = [];
  for (const el of document.querySelectorAll("body *")) {
    if (terpotong.length >= 6) break;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const sembunyi = (v) => v === "hidden" || v === "clip";
    const teks = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!teks) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    // a visually-hidden helper (sr-only: 1 px, clipped) is meant to be hidden
    if (r.width <= 1 || cs.clip !== "auto" || cs.clipPath !== "none") continue;
    const x = sembunyi(cs.overflowX) && el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== "ellipsis";
    const y = sembunyi(cs.overflowY) && el.scrollHeight > el.clientHeight + 1 && !cs.webkitLineClamp?.match(/^\d/);
    if (x || y) terpotong.push(`${nama(el)} (${x ? `${el.scrollWidth}>${el.clientWidth} px wide` : ""}${x && y ? ", " : ""}${y ? `${el.scrollHeight}>${el.clientHeight} px tall` : ""})`);
  }
  return { lebar, meluap, terpotong };
};

/** In the page: what has focus, whether it shows a focus indicator, and whether it is on screen. */
const FOKUS = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { tubuh: true };
  const cs = getComputedStyle(el);
  const garis = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
  const bayang = cs.boxShadow && cs.boxShadow !== "none";
  const r = el.getBoundingClientRect();
  const teks = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").replace(/\s+/g, " ").trim().slice(0, 50);
  return {
    kunci: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (el.getAttribute("href") ? `[href=${el.getAttribute("href")}]` : "") + `|${teks}`,
    tag: el.tagName.toLowerCase(), teks, href: el.getAttribute("href"),
    terlihat: garis || bayang, // compared against the unfocused style below
    gaya: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}|${cs.boxShadow}|${cs.backgroundColor}|${cs.borderColor}|${cs.textDecorationLine}`,
    luar: r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth || r.width === 0,
  };
};

/** Run every check on the page as it stands (1280 px). Leaves the viewport at 1280 × 900. */
export async function periksa(page) {
  const hasil = { judul: null, lompat: null, papan: null, axe: null, lebar: {}, gagal: [] };
  // title
  hasil.judul = await page.title().catch(() => null);
  hasil.judulMasalah = !hasil.judul || !hasil.judul.trim() ? "no title" : NAMA_APLIKASI.test(hasil.judul) ? "only the application name, the same on every page" : null;

  // axe
  try {
    if (!(await page.evaluate(() => typeof window.axe === "object").catch(() => false))) await page.addScriptTag({ path: AXE_PATH });
    const r = await page.evaluate(async () => {
      const out = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      return out.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, target: v.nodes.slice(0, 3).map((x) => String(x.target[0]).slice(0, 120)) }));
    });
    hasil.axe = r;
  } catch (e) { hasil.gagal.push(`axe: ${String(e.message ?? e).slice(0, 160)}`); }

  // skip link and keyboard walk, from the top of the page
  try {
    // FROM THE DOCUMENT'S START, really: blur() leaves the browser's focus starting point where focus was (the
    // first-visit tour's headline, which W3.15 focuses on open), so the next Tab continued from there and the skip
    // link read as missing (R0-3). Focusing <body> as a focusable element moves the starting point to the top.
    await page.evaluate(() => {
      document.activeElement?.blur?.(); window.scrollTo(0, 0);
      const ada = document.body.hasAttribute("tabindex");
      if (!ada) document.body.setAttribute("tabindex", "-1");
      document.body.focus({ preventScroll: true });
      if (!ada) document.body.removeAttribute("tabindex");
    });
    const langkah = [];
    let macet = 0, tubuh = 0, tanpaTanda = 0, luar = 0;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(FOKUS);
      // focus on <body> after the last stop is the page's end (the browser wraps next); not a defect
      if (f.tubuh) { tubuh++; if (i === 0) langkah.push({ tubuh: true }); if (tubuh >= 2) break; continue; }
      // a focus indicator: the focused style differs from the same element's unfocused style
      const tanpa = await page.evaluate(() => { const el = document.activeElement; el.blur(); const cs = getComputedStyle(el);
        const s = `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}|${cs.boxShadow}|${cs.backgroundColor}|${cs.borderColor}|${cs.textDecorationLine}`; el.focus({ preventScroll: true }); return s; });
      f.terlihat = f.gaya !== tanpa;
      if (!f.terlihat) tanpaTanda++;
      if (f.luar) luar++;
      if (langkah.length && langkah[langkah.length - 1].kunci === f.kunci) { macet++; if (macet >= 3) break; } else macet = 0;
      if (langkah.some((l) => l.kunci === f.kunci) && langkah.length > 3) { langkah.push({ ...f, ulang: true }); break; } // wrapped round
      langkah.push(f);
    }
    const pertama = langkah[0];
    const sasaran = pertama?.href?.startsWith("#") ? await page.evaluate((h) => !!document.getElementById(decodeURIComponent(h.slice(1))), pertama.href) : false;
    hasil.lompat = { ada: Boolean(pertama?.href?.startsWith("#") && sasaran), pertama: pertama?.tubuh ? "(body)" : pertama ? `${pertama.tag} «${pertama.teks}»` : null };
    hasil.papan = { berhenti: langkah.filter((l) => !l.tubuh && !l.ulang).length, tanpaTanda, luar, macet: macet >= 3, tanpaBerhenti: langkah.filter((l) => !l.tubuh && !l.ulang).length === 0,
      tanpaTandaContoh: langkah.filter((l) => l.terlihat === false).slice(0, 3).map((l) => `${l.tag} «${l.teks}»`) };
  } catch (e) { hasil.gagal.push(`keyboard: ${String(e.message ?? e).slice(0, 160)}`); }

  // widths
  for (const w of LEBAR) {
    try {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(150);
      hasil.lebar[w] = await page.evaluate(UKUR);
    } catch (e) { hasil.gagal.push(`${w}px: ${String(e.message ?? e).slice(0, 160)}`); }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  return hasil;
}

/** Summarise a run: one row per check, how many pages fail it, and the worst axe rules. */
export function ringkas(semua) {
  const hal = semua.flatMap((r) => r.pages.filter((x) => x.a11y).map((x) => ({ who: r.persona, path: x.path, ...x.a11y })));
  const unik = new Map();
  for (const h of hal) { const k = h.path.replace(/\?.*$/, "").replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/g, ":id"); if (!unik.has(k)) unik.set(k, h); }
  const layar = [...unik.values()];
  const aturan = new Map();
  for (const h of layar) for (const v of h.axe ?? []) {
    const a = aturan.get(v.id) ?? { id: v.id, impact: v.impact, help: v.help, layar: 0, node: 0, contoh: [] };
    a.layar++; a.node += v.n; if (a.contoh.length < 3) a.contoh.push(h.path); aturan.set(v.id, a);
  }
  const hitung = (f) => layar.filter(f).length;
  return {
    halaman: hal.length,
    layar: layar.length,
    tanpaJudul: hitung((h) => h.judulMasalah),
    tanpaLompat: hitung((h) => !h.lompat?.ada),
    fokusTakTerlihat: hitung((h) => (h.papan?.tanpaTanda ?? 0) > 0),
    fokusMacet: hitung((h) => h.papan?.macet),
    tanpaBerhentiPapan: hitung((h) => h.papan?.tanpaBerhenti),
    axeBersih: hitung((h) => h.axe && h.axe.length === 0),
    axeGagal: hitung((h) => !h.axe),
    meluap: Object.fromEntries(LEBAR.map((w) => [w, hitung((h) => h.lebar?.[w]?.meluap)])),
    terpotong: Object.fromEntries(LEBAR.map((w) => [w, hitung((h) => (h.lebar?.[w]?.terpotong?.length ?? 0) > 0)])),
    aturan: [...aturan.values()].sort((a, b) => ({ critical: 0, serious: 1, moderate: 2, minor: 3 }[a.impact] - { critical: 0, serious: 1, moderate: 2, minor: 3 }[b.impact]) || b.layar - a.layar),
    layarDaftar: layar.map((h) => ({ path: h.path, who: h.who, judul: h.judul, judulMasalah: h.judulMasalah, lompat: h.lompat, papan: h.papan,
      axe: (h.axe ?? []).map((v) => `${v.id}:${v.impact}:${v.n}`), lebar: Object.fromEntries(Object.entries(h.lebar ?? {}).map(([w, u]) => [w, { meluap: u.meluap, terpotong: u.terpotong.length }])), gagal: h.gagal })),
  };
}

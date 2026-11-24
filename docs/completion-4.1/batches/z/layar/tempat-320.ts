/**
 * Daisy's Z5 review, walk finding (b): THE PLACE WORD IN THE BAR NEVER BREAKS INSIDE A WORD. If it does not fit beside
 * the brand it moves whole to the bar's second line and the bar grows; never an ellipsis. Measured in a real browser at
 * 320 and 390 px: each word of `.pin-bar-tempat` is one line box (a Range over the word has one client rect), the
 * word's text is whole (no ellipsis, nothing clipped), the menu button stays on the brand's line, and the page does not
 * scroll sideways.
 *
 * Run against `next start` on port 3999 (or TEMPAT_ASAL), with the selftest's environment:
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tempat-320.ts <label>
 * TEMPAT_DIAM=<prefix> also saves the bar of each page at each width.
 */
import { createRequire } from "node:module";
import { psql } from "../../../../../selftest/bob26.test";
import { BOOT_ADMIN, masuk } from "../../../../../selftest/c1w-layar.test";

const { chromium } = createRequire(__filename)("playwright");
const ASAL = process.env.TEMPAT_ASAL ?? "http://127.0.0.1:3999";
const hasil: string[] = [];
let gagal = 0;
const periksa = (ok: boolean, teks: string) => { hasil.push(`${ok ? "PASS" : "FAIL"}  ${teks}`); if (!ok) gagal++; };

(async () => {
  const sekolah = psql(`select ra.institution_id from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
    join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.institution_id is not null
     and ra.revoked_at is null order by ra.id limit 1`);
  const admin = await masuk(ASAL, BOOT_ADMIN, `MENGELOLA:${sekolah}`);
  if (typeof admin === "string") throw new Error(admin);
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } });
    await ctx.addCookies([...(admin as unknown as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
    const p = await ctx.newPage();
    // the place words a staff reader meets: one long word, two words, and the pages' own names
    for (const alamat of ["/konfigurasi/kesempatan", "/pendataan", "/aktivasi", "/konfigurasi/keamanan", "/lapor"]) {
      for (const w of [320, 390]) {
        await p.setViewportSize({ width: w, height: 800 });
        await p.goto(`${ASAL}${alamat}`, { waitUntil: "networkidle" });
        // (a string, so the bundler's helpers never reach the page)
        const m = await p.evaluate(`(() => {
          const el = document.querySelector("header.pin-staf .pin-bar-tempat");
          if (!el || el.offsetParent === null) return null;
          const node = [...el.childNodes].find((n) => n.nodeType === 3);
          const teks = el.textContent;
          const kata = [];
          if (node) { let i = 0; for (const k of teks.split(" ")) { if (k) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + k.length);
            kata.push({ k, kotak: [...r.getClientRects()].filter((x) => x.width > 0).length }); } i += k.length + 1; } }
          const cs = getComputedStyle(el);
          const merek = document.querySelector("header.pin-staf .pin-staf-kepala").getBoundingClientRect();
          const menu = [...document.querySelectorAll("header.pin-staf .pin-laci-js, header.pin-staf .pin-laci-tombol")].find((e) => e.offsetParent !== null).getBoundingClientRect();
          const tempat = el.getBoundingClientRect();
          return { teks, kata, ellipsis: cs.textOverflow, potong: el.scrollWidth > el.clientWidth + 0.5,
            menuSebaris: Math.abs((menu.top + menu.bottom) / 2 - (merek.top + merek.bottom) / 2) < 12,
            barisKedua: tempat.top >= merek.bottom - 1,
            lebih: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        })()`) as { teks: string; kata: Array<{ k: string; kotak: number }>; ellipsis: string; potong: boolean; menuSebaris: boolean; barisKedua: boolean; lebih: number } | null;
        if (!m) { periksa(false, `${alamat} at ${w}: no place word in the bar`); continue; }
        const pecah = m.kata.filter((x) => x.kotak !== 1);
        periksa(pecah.length === 0 && m.kata.length > 0,
          `${alamat} at ${w}: «${m.teks}», each word one line box (${m.kata.map((x) => `${x.k}:${x.kotak}`).join(" ")})${m.barisKedua ? ", on the bar's second line" : ""}`);
        periksa(m.ellipsis !== "ellipsis" && !m.potong, `${alamat} at ${w}: «${m.teks}» is whole (text-overflow ${m.ellipsis}, clipped ${m.potong})`);
        periksa(m.menuSebaris && m.lebih <= 0, `${alamat} at ${w}: the menu button stays on the brand's line (${m.menuSebaris}) and the page does not scroll sideways (${m.lebih} px)`);
        if (process.env.TEMPAT_DIAM) await p.locator("header.pin-staf").screenshot({ path: `${process.env.TEMPAT_DIAM}-${alamat.replace(/\//g, "_")}-${w}.png` });
      }
    }
  } catch (e) {
    periksa(false, `the walk stopped: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
    console.log(`# ${process.argv[2] ?? ""}\n${hasil.join("\n")}`);
    process.exit(gagal ? 1 : 0);
  }
})().catch((e) => { console.error(e); process.exit(1); });

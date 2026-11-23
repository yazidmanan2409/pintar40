/**
 * R-26 items 1 and 4 (ruling 75; Daisy's package, UX-75), in a real browser, keyboard only.
 *
 *   Z-R26-01  «Minta akun dibuka kembali»: Enter twice on «Kirim permintaan» posts ONCE; the answer is «Terima kasih. …»,
 *             never «Tunggu»; while the page is on its way the button says «Mengirim…» and is busy; Back shows the verb.
 *   Z-R26-02  «Ganti» (a.pin-konteks-pilih): its hit area is at least 44 px at 1280, 390 and 320, and its block looks the same
 *   Z-R26-04  a busy button never narrows: its width while busy is at least its width at rest, on the reopening page
 *             (390) and on Pendataan's school-code row (1280), where the field beside it must not grow. That row's verb
 *             («Simpan») is shorter than its busy word, so the browser first lengthens the button's own text node to a
 *             long verb (the text node React then rewrites to «Menyimpan…»): the case of «Sudah saya tinjau semuanya».
 *
 * Each response is held back 1.5 s by the browser (page.route), so the busy state can be read. Run against `next start`
 * of the build under test on port 3999, with the selftest's environment:
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/r26-tekan.ts <label>
 * It prints one line per check and exits non-zero on any failure.
 */
import { createRequire } from "node:module";
import { BOOT_ADMIN, masuk } from "../../../../../selftest/c1w-layar.test";
import { psql } from "../../../../../selftest/bob26.test";

const { chromium } = createRequire(__filename)("playwright");
const ASAL = process.env.R26_ASAL ?? "http://127.0.0.1:3999";
const hasil: string[] = [];
let gagal = 0;
const periksa = (ok: boolean, teks: string) => { hasil.push(`${ok ? "PASS" : "FAIL"}  ${teks}`); if (!ok) gagal++; };
const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  try {
    // ------------------------------------------------------------------ Z-R26-01 and the reopening page's width
    const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, extraHTTPHeaders: { "x-real-ip": `198.51.100.${1 + Math.floor(Math.random() * 250)}` } });
    const p = await ctx.newPage();
    let kiriman = 0;
    p.on("request", (r: { method(): string; url(): string }) => { if (r.method() === "POST" && r.url().includes("/masuk/buka-kembali/kirim")) kiriman++; });
    await p.route("**/masuk/buka-kembali/kirim", async (route: { continue(): Promise<void> }) => { await jeda(1500); await route.continue(); });
    await p.goto(`${ASAL}/masuk/buka-kembali`, { waitUntil: "networkidle" });
    await p.locator("#bk-identitas").focus();
    await p.keyboard.type(`tiada-r26-${Date.now()}@local.invalid`);
    await p.keyboard.press("Tab");
    await p.keyboard.type("Saya ingin kembali mengajar. Hubungi saya di nomor sekolah.");
    const tombol = p.locator("form#buka-kembali button[type=submit]");
    await tombol.focus();
    const diam = await tombol.boundingBox();
    if (process.env.R26_DIAM) await tombol.screenshot({ path: `${process.env.R26_DIAM}-buka-kembali.png` });
    // the busy state is read inside the page as it changes (a pending navigation blocks Playwright's own reads)
    const keadaan: Array<{ teks: string | null; busy: string | null; mati: boolean; lebar: number }> = [];
    await p.exposeFunction("catatTombol", (x: { teks: string | null; busy: string | null; mati: boolean; lebar: number }) => { keadaan.push(x); });
    // (a string, so the bundler's helpers never reach the page)
    await p.evaluate(`(() => { const b = document.querySelector("form#buka-kembali button[type=submit]");
      new MutationObserver(() => window.catatTombol({ teks: b.textContent, busy: b.getAttribute("aria-busy"), mati: b.disabled,
        lebar: b.getBoundingClientRect().width })).observe(b, { attributes: true, childList: true, characterData: true, subtree: true }); })()`);
    await p.keyboard.press("Enter");
    await jeda(150);
    await p.keyboard.press("Enter").catch(() => undefined);
    const sibuk = keadaan.find((x) => x.busy === "true") ?? keadaan[keadaan.length - 1] ?? null;
    await p.waitForURL(/hasil=|kode=/, { timeout: 15000 }).catch(() => undefined);
    await p.waitForLoadState("networkidle");
    const jawab = (await p.locator("main").innerText()).replace(/\s+/g, " ");
    periksa(kiriman === 1, `Z-R26-01 Enter twice on «Kirim permintaan» posts once (${kiriman} POST)`);
    periksa(/hasil=terkirim/.test(p.url()) && jawab.includes("Terima kasih.") && !jawab.includes("Baru saja ada permintaan"),
      `Z-R26-01 the answer is «Terima kasih. …», not «Tunggu» (${p.url().replace(ASAL, "")})`);
    periksa(sibuk !== null && sibuk.teks === "Mengirim…" && sibuk.busy === "true" && sibuk.mati,
      `Z-R26-01 while on its way the button says «Mengirim…», busy and disabled (${JSON.stringify(sibuk && { teks: sibuk.teks, busy: sibuk.busy, mati: sibuk.mati })})`);
    periksa(sibuk !== null && diam !== null && sibuk.lebar >= diam.width - 0.5,
      `Z-R26-04 the reopening button does not narrow while busy (rest ${diam?.width.toFixed(1)} px, busy ${sibuk?.lebar.toFixed(1)} px)`);
    await p.goBack({ waitUntil: "networkidle" });
    const kembali = await tombol.evaluate((b: HTMLButtonElement) => ({ teks: b.textContent, mati: b.disabled, busy: b.getAttribute("aria-busy") })).catch(() => null);
    periksa(kembali !== null && kembali.teks === "Kirim permintaan" && !kembali.mati && kembali.busy === null,
      `Z-R26-01 Back shows the verb again, enabled (${JSON.stringify(kembali)})`);

    // ------------------------------------------------------------------ Z-R26-04 on an inline row: Pendataan's school code, 1280
    const sekolah = psql(`select ra.institution_id from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
      join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.institution_id is not null
       and ra.revoked_at is null order by ra.id limit 1`);
    const admin = await masuk(ASAL, BOOT_ADMIN, `MENGELOLA:${sekolah}`);
    if (typeof admin === "string") throw new Error(admin);
    const actx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await actx.addCookies([...(admin as unknown as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
    const ap = await actx.newPage();
    await ap.route("**/pendataan**", async (route: { request(): { method(): string }; continue(): Promise<void> }) => {
      if (route.request().method() === "POST") await jeda(1500);
      await route.continue();
    });
    await ap.goto(`${ASAL}/pendataan`, { waitUntil: "networkidle" });
    const baris = ap.locator("form.pin-baris-aksi").filter({ has: ap.locator("#pin-kode-isi") });
    if ((await baris.count()) === 1) {
      const b = baris.locator("button[type=submit]");
      const f = ap.locator("#pin-kode-isi");
      const kode = await f.inputValue();
      if (process.env.R26_DIAM) await b.screenshot({ path: `${process.env.R26_DIAM}-pendataan.png` });
      await b.evaluate((el: HTMLButtonElement) => { const n = [...el.childNodes].find((x) => x.nodeType === 3); if (n) n.nodeValue = "Sudah saya tinjau semuanya"; });
      const rest = { b: await b.boundingBox(), f: await f.boundingBox() };
      await f.focus();
      await ap.keyboard.press("Enter"); // the field's own submit, keyboard only
      await jeda(300);
      const busy = { b: await b.boundingBox(), f: await f.boundingBox(), teks: await b.textContent() };
      periksa(busy.teks === "Menyimpan…" && rest.b !== null && busy.b !== null && busy.b.width >= rest.b.width - 0.5,
        `Z-R26-04 Pendataan's button, busy as «${busy.teks}», does not narrow (rest ${rest.b?.width.toFixed(1)} px, busy ${busy.b?.width.toFixed(1)} px)`);
      periksa(rest.f !== null && busy.f !== null && busy.f.width <= rest.f.width + 0.5,
        `Z-R26-04 the field beside it does not grow into the button's place (${rest.f?.width.toFixed(1)} → ${busy.f?.width.toFixed(1)} px; code «${kode}»)`);
      await ap.waitForLoadState("networkidle");
    } else {
      periksa(false, "Z-R26-04 Pendataan's school-code row was not found for the bootstrap administrator");
    }

    // ------------------------------------------------------------------ Z-R26-02: «Ganti» (a.pin-konteks-pilih), its hit area and its pixels
    // (drawn only for a person with more than one place: the seed's platform administrator)
    const sys = await masuk(ASAL, { identitas: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" }, "MENGELOLA:PLATFORM");
    if (typeof sys === "string") throw new Error(sys);
    const sctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await sctx.addCookies([...(sys as unknown as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
    const sp = await sctx.newPage();
    for (const w of [1280, 390, 320]) {
      await sp.setViewportSize({ width: w, height: 900 });
      await sp.goto(`${ASAL}/konfigurasi`, { waitUntil: "networkidle" });
      if (w < 1024) {
        // the opened menu, by keyboard: «Buka menu» then Enter
        await sp.getByRole("button", { name: "Buka menu" }).focus();
        await sp.keyboard.press("Enter");
        await jeda(300);
      }
      const pilih = sp.locator("a.pin-konteks-pilih:visible").first();
      const kotak = await pilih.boundingBox();
      if (!kotak) { periksa(false, `Z-R26-02 «${w}»: a.pin-konteks-pilih is not on screen`); continue; }
      // the element under a point 3.5 px beyond each edge (string, so the bundler's helpers never reach the page)
      const kena = async (y: number) => sp.evaluate(`(() => { const e = document.elementFromPoint(${kotak.x + kotak.width / 2}, ${y});
        return Boolean(e && e.closest("a.pin-konteks-pilih")); })()`);
      const atas = await kena(kotak.y - 3.5), bawah = await kena(kotak.y + kotak.height + 3.5);
      periksa(kotak.height + (atas ? 4 : 0) + (bawah ? 4 : 0) >= 44 && atas && bawah && kotak.width >= 44,
        `Z-R26-02 at ${w} px the hit area of «${(await pilih.innerText()).trim()}» is at least 44 px (drawn ${kotak.width.toFixed(0)}×${kotak.height.toFixed(0)}; 3.5 px above ${atas ? "hits" : "misses"}, below ${bawah ? "hits" : "misses"})`);
      if (process.env.R26_DIAM) await sp.locator(".pin-konteks-blok:visible").first().screenshot({ path: `${process.env.R26_DIAM}-konteks-${w}.png` });
    }
  } catch (e) {
    periksa(false, `the walk stopped: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
    console.log(`# ${process.argv[2] ?? ""}\n${hasil.join("\n")}`);
    process.exit(gagal ? 1 : 0);
  }
})().catch((e) => { console.error(e); process.exit(1); });

/**
 * Z4 (stream B) captures for Daisy: S-12 with R-27(a), R-26 item 1, R-27(c), R-26 item 2, S-08, S-11 and S-15, at
 * 1280, 390 and 320 px, keyboard only. Each shot's overflow, focus, live text and the changed text go to CATATAN-Z4.txt.
 *
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tangkap-z4.ts
 *
 * Against `next start` of this branch on port 3999 and a local stack, with the selftest's environment. The world is A1's
 * screen fixture (its signing-in learner has a PINTAR ID and the PIN 2817), the seed's platform and bootstrap
 * administrators; it is removed after the run. S-15's outage is the route's own answer (`create_failed`) given by the
 * browser (page.route): stopping Auth would also end the administrator's session.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { lit, psql } from "../../../../../selftest/bob26.test";
import { bersihkan, dunia, muat } from "../../../../../selftest/a1-layar.test";
import { BOOT_ADMIN, masuk } from "../../../../../selftest/c1w-layar.test";

const { chromium } = createRequire(__filename)("playwright");
type Browser = Awaited<ReturnType<typeof chromium.launch>>;
type BrowserContext = Awaited<ReturnType<Browser["newContext"]>>;
type Page = Awaited<ReturnType<BrowserContext["newPage"]>>;

const ASAL = "http://127.0.0.1:3999";
const AKAR = join(__dirname, "..", "..", "..", "..", "..");
const KE = __dirname;
const LEBAR = [1280, 390, 320] as const;
const catatan: string[] = [];
const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ip = () => `198.51.100.${1 + Math.floor(Math.random() * 250)}`;

async function rekam(p: Page, nama: string, w: number, lain = "") {
  const info = await p.evaluate(`(() => {
    const el = document.activeElement;
    const live = [...document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')].map((x) => (x.textContent || "").trim()).filter(Boolean).join(" | ");
    return { lebih: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fokus: el ? el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + " «" + (el.textContent || el.value || "").trim().slice(0, 60) + "»" : "none",
      live: live.slice(0, 300) }; })()`) as { lebih: number; fokus: string; live: string };
  catatan.push(`${nama}-${w}\toverflow ${info.lebih}px\tfocus ${info.fokus}\tlive «${info.live}»${lain ? "\t" + lain : ""}`);
  await p.screenshot({ path: join(KE, `${nama}-${w}.png`) });
}
const teksDi = async (p: Page, sel: string) => ((await p.locator(sel).allInnerTexts().catch(() => [])) as string[]).join(" / ").replace(/\s+/g, " ").slice(0, 400);
async function kontekDari(browser: Browser, k: unknown, w: number): Promise<BrowserContext> {
  const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 } });
  await ctx.addCookies([...(k as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
  return ctx;
}

(async () => {
  muat(AKAR);
  const tag = `z4${Date.now().toString(36)}`;
  const d = dunia(tag);
  if (typeof d === "string") throw new Error(d);
  const { uid, pid } = d.murid.masuk;
  const pintarId = psql(`select pintar_id from public.persons where id = ${lit(pid)}`);
  const browser = await chromium.launch();
  try {
    for (const w of LEBAR) {
      // -------------------------------------------------------------- S-12 + R-27(a): a refused input, then its recovery
      const bk = await (await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 }, extraHTTPHeaders: { "x-real-ip": ip() } })).newPage();
      await bk.goto(`${ASAL}/masuk/buka-kembali`, { waitUntil: "networkidle" });
      await bk.locator("#bk-identitas").focus();
      await bk.keyboard.type(`seseorang-${tag}@local.invalid`);
      await bk.keyboard.press("Tab");
      await bk.keyboard.type("   pendek   ");
      await bk.keyboard.press("Tab");
      await bk.keyboard.press("Enter");
      await bk.waitForURL(/kode=/, { timeout: 15000 });
      await bk.waitForLoadState("networkidle");
      await rekam(bk, "01-buka-kembali-isian", w, `line: ${await teksDi(bk, ".pin-hasil")}\tkept: «${await bk.locator("#bk-identitas").inputValue()}» / «${await bk.locator("#bk-pesan").inputValue()}»`);
      // recovery: the message written properly, from the same address; the refused try used no pace
      await bk.locator("#bk-pesan").focus();
      await bk.keyboard.press("Control+A");
      await bk.keyboard.type("Saya ingin kembali mengajar. Hubungi saya di nomor sekolah.");
      await bk.keyboard.press("Tab");
      await bk.keyboard.press("Enter");
      await bk.waitForURL(/hasil=/, { timeout: 15000 });
      await bk.waitForLoadState("networkidle");
      await rekam(bk, "02-buka-kembali-terkirim", w, `line: ${await teksDi(bk, ".pin-hasil")}\turl: ${bk.url().replace(ASAL, "")}`);

      // -------------------------------------------------------------- R-27(c): the sign-in identity field, by Tab
      const mp = await (await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 } })).newPage();
      await mp.goto(`${ASAL}/masuk`, { waitUntil: "networkidle" });
      await mp.locator("#identitas").focus();
      const atr = await mp.locator("#identitas").evaluate((x: HTMLInputElement) => ["type", "inputmode", "autocomplete", "autocapitalize", "autocorrect", "spellcheck"].map((a) => `${a}=${x.getAttribute(a)}`).join(" "));
      await rekam(mp, "03-masuk-identitas", w, `attributes: ${atr}`);

      // -------------------------------------------------------------- S-08: the PIN path's time runs out, said on the PIN form
      const lp = await (await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 }, extraHTTPHeaders: { "x-real-ip": ip() } })).newPage();
      await lp.goto(`${ASAL}/masuk/lupa?id=${pintarId}`, { waitUntil: "networkidle" });
      await lp.locator("#pin").focus();
      await lp.keyboard.type("2817");
      await lp.keyboard.press("Enter");
      await lp.waitForSelector("input[type=password]", { timeout: 15000 });
      psql(`update public.password_recovery_grants set expires_at = now() - interval '1 minute' where auth_user_id = ${lit(uid)}`);
      const sandi = lp.locator("input[type=password]");
      await sandi.nth(0).focus();
      await lp.keyboard.type("Sintetis-Baru-Z4-2026!");
      await sandi.nth(1).focus();
      await lp.keyboard.type("Sintetis-Baru-Z4-2026!");
      await lp.keyboard.press("Enter");
      await lp.waitForSelector("#pin", { timeout: 15000 }).catch(async (e: Error) => {
        await lp.screenshot({ path: join(KE, "..", "..", "..", "..", "..", "..", "..", "tmp", "claude-0", "lupa-debug.png") }).catch(() => undefined);
        throw new Error(`the PIN form did not come back: ${(await lp.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 300)} (${e.message.split("\n")[0]})`);
      });
      await jeda(300);
      await rekam(lp, "04-lupa-pin-berakhir", w, `line: ${await teksDi(lp, ".pin-msg, [role=status], [role=alert]")}`);
    }

    // ---------------------------------------------------------------- R-26 item 2 and S-11 and S-15, as administrators
    const sekolah = psql(`select ra.institution_id from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
      join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.institution_id is not null
       and ra.revoked_at is null order by ra.id limit 1`);
    const admin = await masuk(ASAL, BOOT_ADMIN, `MENGELOLA:${sekolah}`);
    const sys = await masuk(ASAL, { identitas: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" }, "MENGELOLA:PLATFORM");
    if (typeof admin === "string" || typeof sys === "string") throw new Error(`${admin} / ${sys}`);
    for (const w of LEBAR) {
      // «Ganti» is drawn only for a person with more than one place: the seed's platform administrator
      const ap = await (await kontekDari(browser, sys, w)).newPage();
      await ap.goto(`${ASAL}/konfigurasi`, { waitUntil: "networkidle" });
      if (w < 1024) { await ap.getByRole("button", { name: "Buka menu" }).focus(); await ap.keyboard.press("Enter"); await jeda(300); }
      await ap.locator("a.pin-konteks-pilih:visible").first().focus();
      await rekam(ap, "05-konteks-ganti", w, `link: ${await teksDi(ap, "a.pin-konteks-pilih:visible")}`);

      const sp = await (await kontekDari(browser, sys, w)).newPage();
      await sp.goto(`${ASAL}/konfigurasi/keamanan`, { waitUntil: "networkidle" });
      await sp.locator("#akun-pid").focus();
      await sp.keyboard.type(`${pintarId.slice(0, 4)} ${pintarId.slice(4)}`); // as printed on the card, pasted whole
      await sp.keyboard.press("Enter");
      await sp.waitForURL(/pid=/, { timeout: 15000 });
      await sp.waitForLoadState("networkidle");
      await rekam(sp, "06-keamanan-cari-spasi", w, `found: ${(await sp.locator("[data-akun-platform]").count()) > 0}\tfield: «${await sp.locator("#akun-pid").inputValue()}»`);
      await sp.locator("#akun-pid").focus();
      await sp.keyboard.press("Control+A");
      await sp.keyboard.type("A14CD7SU");
      await sp.keyboard.press("Enter");
      await sp.waitForURL(/pid=A14CD7SU/, { timeout: 15000 });
      await sp.waitForLoadState("networkidle");
      await rekam(sp, "07-keamanan-cari-salah", w, `line: ${await teksDi(sp, "#akun-pid-salah")}\tfield: «${await sp.locator("#akun-pid").inputValue()}»`);

      // S-15: the activation route answers create_failed (an Auth outage), given by the browser
      await sp.route("**/api/akun/aktivasi", async (route: { fulfill(x: unknown): Promise<void> }) => {
        await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ ok: false, error: "create_failed", ref: "Z4-UJI" }) });
      });
      await sp.goto(`${ASAL}/aktivasi`, { waitUntil: "networkidle" });
      const baru = sp.locator("section.pin-akt-baru");
      if ((await baru.count()) > 0) {
        await baru.locator("input").nth(0).focus();
        await sp.keyboard.type("Guru Baru Z4");
        await baru.locator("input").nth(1).focus();
        await sp.keyboard.type(`guru-baru-${tag}@local.invalid`);
        await baru.locator("button.pin-primary").focus();
        await sp.keyboard.press("Enter");
        await baru.locator("button.pin-primary").first().focus();
        await sp.keyboard.press("Enter");
        await jeda(800);
        await baru.scrollIntoViewIfNeeded();
        await rekam(sp, "08-aktivasi-gagal-buat", w, `line: ${await teksDi(sp, "section.pin-akt-baru .pin-hasil")}`);
      } else {
        catatan.push(`08-aktivasi-gagal-buat-${w}\tthe platform administrator's «orang baru» section was not found`);
      }
    }
  } finally {
    await browser.close();
    bersihkan();
    writeFileSync(join(KE, "CATATAN-Z4.txt"), catatan.join("\n") + "\n");
  }
})().catch((e) => { console.error(e); process.exit(1); });

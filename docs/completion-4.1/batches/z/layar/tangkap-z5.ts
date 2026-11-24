/**
 * Z5 (stream B) captures for Daisy: R-10, N-9, S-02, S-04, S-07, R-26 item 3 with S-05, and N-16, at 1280, 390 and
 * 320 px, keyboard only. Each shot's overflow, focus, live text and the changed text go to CATATAN-Z5.txt.
 *
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tangkap-z5.ts
 *
 * Against `next start` of this branch on port 3999 and a local stack, with the selftest's environment. The world: the
 * seed's bootstrap and platform administrators, and C1w's screen fixture (a draft package in the cycle school, for the
 * Studio rule form), which is removed after the run. Nothing is saved in the bootstrap school: S-02's review saves
 * nothing, S-04's recovery types the school's own code back, and S-07's recovery is «Batal».
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { lit, psql } from "../../../../../selftest/bob26.test";
import { ADMIN, BOOT_ADMIN, BOOT_GURU, bersihkan, dunia, masuk, muat } from "../../../../../selftest/c1w-layar.test";

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
async function halaman(browser: Browser, k: unknown, w: number): Promise<Page> {
  const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 } });
  await ctx.addCookies([...(k as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
  return ctx.newPage();
}
/** «Tempat kerja Anda», as the reader meets it: the rail at 1280; at 390 and 320 the menu, opened by keyboard. */
async function bukaMenu(p: Page, w: number) {
  if (w >= 1024) return;
  await p.getByRole("button", { name: "Buka menu" }).focus();
  await p.keyboard.press("Enter");
  await jeda(300);
}
const tempatKerja = async (p: Page) => p.evaluate(`(() => [...document.querySelectorAll("nav.pin-tabs a")].filter((a) => a.offsetParent !== null)
  .map((a) => (a.getAttribute("aria-current") === "page" ? "[" : "") + a.textContent.trim() + (a.getAttribute("aria-current") === "page" ? "]" : "")).join(" · "))()`) as Promise<string>;

(async () => {
  muat(AKAR);
  const tag = `z5${Date.now().toString(36)}`;
  const sekolah = psql(`select ra.institution_id from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
    join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.institution_id is not null
     and ra.revoked_at is null order by ra.id limit 1`);
  const guru = psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(BOOT_GURU.identitas)}`);
  const admin = await masuk(ASAL, BOOT_ADMIN, `MENGELOLA:${sekolah}`);
  const sys = await masuk(ASAL, { identitas: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" }, "MENGELOLA:PLATFORM");
  if (typeof admin === "string" || typeof sys === "string") throw new Error(`${admin} / ${sys}`);
  const d = dunia(tag, `C1W layar Z5 ${tag}`);
  if (typeof d === "string") throw new Error(d);
  const siklus = await masuk(ASAL, ADMIN, `MENGELOLA:${d.inst}`);
  if (typeof siklus === "string") throw new Error(siklus);
  const aturan = psql(`select id from public.assessment_definitions where course_id = ${lit(d.course)} order by mode, created_at limit 1`);
  const browser = await chromium.launch();
  try {
    for (const w of LEBAR) {
      // -------------------------------------------------------------- R-10: one «Tempat kerja Anda», both administrators
      const a1 = await halaman(browser, admin, w);
      await a1.goto(`${ASAL}/konfigurasi/kesempatan`, { waitUntil: "networkidle" });
      await bukaMenu(a1, w);
      await rekam(a1, "01-nav-sekolah-kesempatan", w, `places: ${await tempatKerja(a1)}`);
      const s1 = await halaman(browser, sys, w);
      await s1.goto(`${ASAL}/konfigurasi/email-uji`, { waitUntil: "networkidle" });
      await bukaMenu(s1, w);
      await rekam(s1, "02-nav-platform-email-uji", w, `places: ${await tempatKerja(s1)}`);

      // -------------------------------------------------------------- N-9: a staff page that cannot be opened
      await a1.goto(`${ASAL}/konfigurasi/staf?orang=00000000-0000-4000-8000-000000000509`, { waitUntil: "networkidle" });
      await a1.locator("main a").first().focus().catch(() => undefined);
      await rekam(a1, "03-staf-tidak-dapat-dibuka", w, `line: ${(await teksDi(a1, "main")).slice(0, 160)}`);

      // -------------------------------------------------------------- S-02: a role chosen without a date, then its recovery
      await a1.goto(`${ASAL}/konfigurasi/staf?orang=${guru}#ubah`, { waitUntil: "networkidle" });
      await a1.locator("#staf-tambah-peran").focus();
      await a1.keyboard.press("ArrowDown");
      await a1.locator("#staf-ubah-alasan").focus();
      await a1.keyboard.type("Menambah tugas untuk semester ini.");
      await a1.locator("#ubah form button[type=submit]").first().focus();
      await a1.keyboard.press("Enter");
      await a1.waitForLoadState("networkidle");
      await jeda(300);
      await a1.locator("#staf-tambah-sampai").scrollIntoViewIfNeeded();
      await rekam(a1, "04-staf-tanpa-tanggal", w, `role: «${await a1.locator("#staf-tambah-peran").inputValue()}»\tline: ${await teksDi(a1, "#ubah .pin-hasil")}\turl: ${a1.url().replace(ASAL, "")}`);
      // recovery: the date given (the keyboard types next year's last day, in the browser's month-first order), the review
      // shows what would change; nothing is saved until «Terapkan»
      await a1.locator("#staf-tambah-sampai").focus();
      await a1.keyboard.type(`1231${new Date().getFullYear() + 1}`);
      await a1.locator("#ubah form button[type=submit]").first().focus();
      await a1.keyboard.press("Enter");
      await a1.waitForLoadState("networkidle");
      await jeda(300);
      await a1.locator("[data-staf-tinjau]").scrollIntoViewIfNeeded().catch(() => undefined);
      await rekam(a1, "05-staf-tinjau", w, `review: ${(await a1.locator("[data-staf-tinjau]").count()) > 0}\tdate: «${await a1.locator("#staf-tambah-sampai").inputValue()}»`);

      // -------------------------------------------------------------- S-04: the school code's shape
      await a1.goto(`${ASAL}/pendataan`, { waitUntil: "networkidle" });
      // the field's own pattern is the server's rule, so a browser stops this first; the server's line is shown with the
      // form's validation off, as a client that ignores `pattern` would meet it
      const kodeAsli = await a1.locator("#pin-kode-isi").inputValue();
      await a1.evaluate(`document.querySelector("#pin-kode-isi").form.noValidate = true`);
      await a1.locator("#pin-kode-isi").focus();
      await a1.keyboard.press("Control+A");
      await a1.keyboard.type("A-");
      await a1.keyboard.press("Enter");
      await a1.waitForURL(/galat=/, { timeout: 15000 });
      await a1.waitForLoadState("networkidle");
      await rekam(a1, "06-pendataan-kode-bentuk", w, `line: ${await teksDi(a1, ".pin-hasil, [role=alert]")}\turl: ${a1.url().replace(ASAL, "")}`);
      // recovery: three letters, which the field accepts. The walk stops before «Simpan kode»: the bootstrap school has no
      // code yet (kodeAsli is empty) and a saved code is the school's for good
      await a1.locator("#pin-kode-isi").focus();
      await a1.keyboard.press("Control+A");
      await a1.keyboard.type(kodeAsli || "Z5A");
      const sah = await a1.locator("#pin-kode-isi").evaluate((x: HTMLInputElement) => x.checkValidity());
      await rekam(a1, "07-pendataan-kode-lagi", w, `field: «${await a1.locator("#pin-kode-isi").inputValue()}» valid=${sah}\tbefore: «${kodeAsli}» (kept after the refusal: no)`);

      // -------------------------------------------------------------- S-07: a deactivation reason of spaces, then «Batal»
      await a1.goto(`${ASAL}/konfigurasi/struktur`, { waitUntil: "networkidle" });
      const nonaktif = a1.locator("#struktur button.pin-bahaya").first();
      if ((await nonaktif.count()) > 0) {
        await nonaktif.focus();
        await a1.keyboard.press("Enter");
        await jeda(300);
        await a1.keyboard.type("   "); // the reason field takes focus as the question opens
        await a1.keyboard.press("Enter");
        await jeda(1200);
        await rekam(a1, "08-struktur-alasan-spasi", w, `line: ${await teksDi(a1, "#struktur .pin-hasil, #struktur [role=alert]")}`);
        await a1.locator("form.pin-str-tanya button[type=button]").first().focus();
        await a1.keyboard.press("Enter");
        await jeda(300);
        await rekam(a1, "09-struktur-batal", w, `question still open: ${(await a1.locator("form.pin-str-tanya").count()) > 0}`);
      } else {
        catatan.push(`08-struktur-alasan-spasi-${w}\tthe bootstrap school has no node a deactivation is offered for`);
      }

      // -------------------------------------------------------------- R-26 item 3 and S-05: Studio's rule forms
      const st = await halaman(browser, siklus, w);
      await st.goto(`${ASAL}/studio/definisi`, { waitUntil: "networkidle" });
      const baru = st.locator("form#definisi-baru");
      await baru.locator("select[name=course]").focus();
      await st.keyboard.press("ArrowDown");
      await baru.locator("input[name=judul]").focus();
      await st.keyboard.type("Aturan Z5");
      await st.locator("#definisi-jumlah").focus();
      await st.keyboard.type("3");
      await baru.locator("input[name=komposisi_MUDAH]").focus();
      await st.keyboard.type("1");
      await baru.locator("input[name=komposisi_SEDANG]").focus();
      await st.keyboard.type("1");
      await baru.locator("button[type=submit]").focus();
      await st.keyboard.press("Enter");
      await st.waitForURL(/kode=|hasil=|galat=/, { timeout: 15000 }).catch(() => undefined);
      await st.waitForLoadState("networkidle");
      await st.locator("#definisi").scrollIntoViewIfNeeded();
      await rekam(st, "10-definisi-campuran", w, `button: «${(await st.locator("form#definisi-baru button[type=submit]").textContent())?.trim()}»\tline: ${await teksDi(st, ".pin-hasil, [role=alert]")}\turl: ${st.url().replace(ASAL, "")}`);
      const tetap = await baru.evaluate((f: HTMLFormElement) => ["judul", "jumlah", "komposisi_MUDAH", "komposisi_SEDANG"].map((n) => `${n}=${(f.elements.namedItem(n) as HTMLInputElement | null)?.value ?? "?"}`).join(" "));
      catatan.push(`10-definisi-campuran-${w}\tkept after the refusal: ${tetap}`);
      // recovery: the third band given, so the mix adds up to the count; the rule is saved in the fixture's draft
      await baru.locator("input[name=komposisi_SULIT]").focus();
      await st.keyboard.press("Control+A");
      await st.keyboard.type("1");
      if (!(await baru.locator("input[name=judul]").inputValue())) { await baru.locator("input[name=judul]").focus(); await st.keyboard.type("Aturan Z5"); }
      if (!(await st.locator("#definisi-jumlah").inputValue())) { await st.locator("#definisi-jumlah").focus(); await st.keyboard.type("3"); }
      for (const [n, v] of [["komposisi_MUDAH", "1"], ["komposisi_SEDANG", "1"]] as const) {
        if (!(await baru.locator(`input[name=${n}]`).inputValue())) { await baru.locator(`input[name=${n}]`).focus(); await st.keyboard.type(v); }
      }
      if (!(await baru.locator("select[name=course]").inputValue())) { await baru.locator("select[name=course]").focus(); await st.keyboard.press("ArrowDown"); }
      await baru.locator("button[type=submit]").focus();
      await st.keyboard.press("Enter");
      await st.waitForLoadState("networkidle");
      await jeda(500);
      await st.locator("#definisi").scrollIntoViewIfNeeded();
      await rekam(st, "10b-definisi-tersimpan", w, `line: ${await teksDi(st, ".pin-hasil, [role=status]")}\turl: ${st.url().replace(ASAL, "")}`);
      // the row's own form says what it does: «Simpan perubahan»
      await st.goto(`${ASAL}/studio/definisi?ubah=${aturan}#definisi-${aturan}`, { waitUntil: "networkidle" });
      const baris = st.locator(`form#definisi-${aturan} button[type=submit]`);
      if ((await baris.count()) > 0) { await baris.focus(); await rekam(st, "11-definisi-baris", w, `button: «${(await baris.textContent())?.trim()}»`); }
      else catatan.push(`11-definisi-baris-${w}\tthe rule's row form was not on the page`);

      // -------------------------------------------------------------- R-26 item 3: Kanonik's grant
      const kn = await halaman(browser, sys, w);
      await kn.goto(`${ASAL}/studio/kanonik`, { waitUntil: "networkidle" });
      const beri = kn.locator("form#izin-beri button[type=submit]");
      if ((await beri.count()) > 0) { await beri.focus(); await rekam(kn, "12-kanonik-beri", w, `button: «${(await beri.textContent())?.trim()}»`); }
      else catatan.push(`12-kanonik-beri-${w}\tKanonik offers no grant here (no library package for the platform administrator)`);

      // -------------------------------------------------------------- N-16: the reopening page's wait line
      const dari = ip();
      for (const n of [1, 2]) {
        const bk = await (await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 }, extraHTTPHeaders: { "x-real-ip": dari } })).newPage();
        await bk.goto(`${ASAL}/masuk/buka-kembali`, { waitUntil: "networkidle" });
        await bk.locator("#bk-identitas").focus();
        await bk.keyboard.type(`seseorang-${tag}-${w}@local.invalid`);
        await bk.keyboard.press("Tab");
        await bk.keyboard.type("Saya ingin kembali mengajar. Hubungi saya di nomor sekolah.");
        await bk.keyboard.press("Tab");
        await bk.keyboard.press("Enter");
        await bk.waitForURL(/hasil=|kode=/, { timeout: 15000 });
        await bk.waitForLoadState("networkidle");
        if (n === 2) await rekam(bk, "13-buka-kembali-tunggu", w, `line: ${await teksDi(bk, ".pin-hasil")}\turl: ${bk.url().replace(ASAL, "")}\tkept: «${await bk.locator("#bk-pesan").inputValue()}»`);
        await bk.context().close();
      }
    }
  } finally {
    await browser.close();
    bersihkan();
    writeFileSync(join(KE, "CATATAN-Z5.txt"), catatan.join("\n") + "\n");
  }
})().catch((e) => { console.error(e); process.exit(1); });

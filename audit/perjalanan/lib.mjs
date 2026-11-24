// Ruling 79's audit (track 3c): what every journey capture shares. A HARNESS, not findings: it walks a journey from a
// reset to its last screen and records what the screen showed and what the data said. Daisy judges; Second Eye
// reproduces. Nothing here decides whether a screen is good.
//
// Environment:
//   APP_URL            the app under capture (default http://127.0.0.1:3999)
//   SUPABASE_DB_URL    the local database the world was loaded into (read only here)
//   AUDIT_OUT          where captures go (default audit-out/perjalanan)
//   AUDIT_LEBAR        widths to walk, comma-separated (default "1280,390,320": the standard walk)
//   AUDIT_BAHASA       "id" (default) or "en": each journey is walked once in EN (Daisy's rule: ID first)
//   AUDIT_LALUAN       the pass: "standar" (default), or one of the passes Daisy and Second Eye run themselves:
//                        "pembaca-layar"   an ARIA snapshot (landmarks, names, roles, live regions) beside every screen
//                        "jaringan-lambat" a throttled network (Chromium's DevTools emulation: 400 kbit/s, 400 ms)
//                        "gerak-dikurangi" prefers-reduced-motion: reduce
//                      These are HOOKS: the pass is switched on and recorded; judging it is theirs.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// the harness's own Playwright (audit/package.json, as audit-journeys.yml installs it), else one already on the machine
const { chromium } = createRequire(join(AKAR, "audit", "package.json"))("playwright");

export const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const DB = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
export const LEBAR = (process.env.AUDIT_LEBAR ?? "1280,390,320").split(",").map((x) => Number(x.trim())).filter(Boolean);
export const BAHASA = process.env.AUDIT_BAHASA === "en" ? "en" : "id";
export const LALUAN = process.env.AUDIT_LALUAN ?? "standar";
const SAMPAI = process.env.AUDIT_SAMPAI ?? null;
const LALUAN_SAH = ["standar", "pembaca-layar", "jaringan-lambat", "gerak-dikurangi"];
if (!LALUAN_SAH.includes(LALUAN)) throw new Error(`AUDIT_LALUAN must be one of ${LALUAN_SAH.join(", ")}`);
const TINGGI = { 1280: 900, 390: 844, 320: 640 };
const ZONA = { WIB: "Asia/Jakarta", WITA: "Asia/Makassar" };

/** The world's facts, as audit/dunia/muat.sh exported them. */
export function dunia() {
  return JSON.parse(readFileSync(join(AKAR, "audit", "dunia", "dunia.json"), "utf8"));
}

/** A read of the database, read only (a READ ONLY transaction): the data a step is recorded against. */
export function baca(sql) {
  return execFileSync("psql", [DB, "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", `begin read only; ${sql}; commit;`],
    { encoding: "utf8" }).trim();
}

/**
 * One walk of one journey at one width. `langkah(id, judul, fn)` runs a step and records it; a step either REACHED
 * its screen or STOPPED there (the walk could not go on: the capture is incomplete, which is the harness's failure,
 * never a judgement of the screen). `amati` records what a step OBSERVED without stopping (for example a step the
 * script names that the screen did not offer).
 */
export async function jalan({ perjalanan, lebar, zona = "WIB", nama, label = [] }) {
  const out = join(process.env.AUDIT_OUT ?? "audit-out/perjalanan", perjalanan, `${LALUAN}-${BAHASA}-${lebar}`);
  rmSync(out, { recursive: true, force: true });   // a walk's folder holds that walk only
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: lebar, height: TINGGI[lebar] ?? 900 },
    locale: BAHASA === "en" ? "en-GB" : "id-ID",
    timezoneId: ZONA[zona],
    reducedMotion: LALUAN === "gerak-dikurangi" ? "reduce" : "no-preference",
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  if (LALUAN === "jaringan-lambat") {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 400, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8,
    });
  }
  // A walk's labels (Bob): what the reader must know before judging its screens, e.g. a legacy state written past
  // today's guards, or OFFICIAL evidence in the dev/CI bootstrap tenant. Kept in langkah.json and in LABEL.txt.
  const catatan = { perjalanan, nama, lebar, zona, bahasa: BAHASA, laluan: LALUAN, label, mulai: new Date().toISOString(), langkah: [] };
  if (label.length) writeFileSync(join(out, "LABEL.txt"), label.join("\n") + "\n");
  let n = 0;
  let berhenti = null;
  let cukup = false;   // AUDIT_SAMPAI=<step id>: a partial walk, ended after that step (a capture added to a journey)

  // A screen is captured once it has SETTLED: the network idle, the streamed page's loading fallback («Memuat
  // halaman…», src/app/loading.tsx) gone, and a heading drawn. Otherwise a capture can be the skeleton, not the screen.
  async function tenang() {
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => !/Memuat halaman|Loading the page/i.test(document.body.innerText)
      && document.querySelector("h1, [role=dialog] h2, main h2"), null, { timeout: 30000 }).catch(() => {});
  }
  async function layar(nm) {
    await tenang();
    const f = `${String(++n).padStart(2, "0")}-${nm}`;
    await page.screenshot({ path: join(out, `${f}.png`), fullPage: true });
    if (LALUAN === "pembaca-layar") {
      const aria = await page.locator("body").ariaSnapshot().catch((e) => `(no ARIA snapshot: ${e.message})`);
      writeFileSync(join(out, `${f}.aria.yml`), aria);
    }
    return f;
  }
  async function teks() {
    return ((await page.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
  }
  const ctxJalan = {
    page, out, layar, teks, baca,
    /** Tab until `loc` holds the focus (real keyboard travel); returns the number of Tab presses. */
    async tabKe(loc, maks = 80) {
      const target = await loc.elementHandle({ timeout: 15000 });
      for (let i = 0; i <= maks; i++) {
        if (await target.evaluate((el) => el === document.activeElement || el.contains(document.activeElement))) return i;
        await page.keyboard.press("Tab");
      }
      throw new Error(`could not reach it by Tab in ${maks} presses`);
    },
    /** Tab to a control and press Enter: the keyboard's click. Returns the Tab count. */
    async tekan(loc, maks) {
      const t = await ctxJalan.tabKe(loc, maks);
      await page.keyboard.press("Enter");
      return t;
    },
    /** Tab to a field and type into it. */
    async ketik(loc, nilai, maks) {
      const t = await ctxJalan.tabKe(loc, maks);
      await page.keyboard.type(nilai);
      return t;
    },
  };

  async function langkah(id, judul, fn) {
    const rec = { id, judul, hasil: "SAMPAI", layar: [], amatan: [], data: {}, tab: 0 };
    if (berhenti) { rec.hasil = "TIDAK_DIJALAN"; rec.amatan.push(`the walk stopped at ${berhenti}`); catatan.langkah.push(rec); return rec; }
    if (cukup) { rec.hasil = "TIDAK_DIJALAN"; rec.amatan.push(`a partial walk: AUDIT_SAMPAI=${SAMPAI}`); catatan.langkah.push(rec); return rec; }
    const t0 = Date.now();
    try {
      await fn({ ...ctxJalan, rec, amati: (s) => rec.amatan.push(s), data: (k, v) => { rec.data[k] = v; },
                 foto: async (nm) => { rec.layar.push(await layar(nm)); } });
      rec.url = new URL(page.url()).pathname;
    } catch (e) {
      rec.hasil = "BERHENTI";
      rec.amatan.push(String(e.message ?? e).slice(0, 800));
      rec.url = new URL(page.url()).pathname;
      rec.layar.push(await layar(`${id}-berhenti`).catch(() => null));
      rec.teks_layar = (await teks()).slice(0, 600);
      berhenti = id;
    }
    rec.ms = Date.now() - t0;
    if (SAMPAI && id === SAMPAI) { cukup = true; catatan.sebagian = `AUDIT_SAMPAI=${SAMPAI}: the steps after ${id} were not walked`; }
    catatan.langkah.push(rec);
    console.log(`${rec.hasil.padEnd(12)} ${perjalanan} ${lebar} ${id.padEnd(4)} ${judul}${rec.amatan.length ? " :: " + rec.amatan.join(" | ").slice(0, 300) : ""}`);
    return rec;
  }

  async function selesai() {
    catatan.selesai = new Date().toISOString();
    catatan.sampai_akhir = !berhenti;
    writeFileSync(join(out, "langkah.json"), JSON.stringify(catatan, null, 2));
    await browser.close();
    return catatan;
  }
  return { page, langkah, selesai, ...ctxJalan };
}

/** The language toggle (ID/EN) by keyboard, when the walk is in EN. */
export async function pilihBahasa(j) {
  if (BAHASA !== "en") return;
  await j.tekan(j.page.getByRole("button", { name: "EN", exact: true }).first());
  await j.page.waitForLoadState("networkidle").catch(() => {});
}

/** The record of a whole journey run: one line per walk, and an exit code (0 only when every walk reached its end). */
export function ringkas(perjalanan, hasil) {
  const out = join(process.env.AUDIT_OUT ?? "audit-out/perjalanan", perjalanan);
  mkdirSync(out, { recursive: true });
  const baris = hasil.map((c) => `${c.sampai_akhir ? "SAMPAI AKHIR" : "BERHENTI    "}  ${c.laluan}/${c.bahasa}/${c.lebar}  ${c.nama}  `
    + (c.label?.length ? `[${c.label.join("; ")}]  ` : "")
    + c.langkah.map((l) => `${l.id}:${l.hasil}`).join(" "));
  const semua = hasil.every((c) => c.sampai_akhir);
  writeFileSync(join(out, "RINGKASAN.txt"), `${perjalanan} · ${new Date().toISOString()}\n${baris.join("\n")}\n${semua ? "EVERY WALK REACHED ITS LAST SCREEN" : "A WALK STOPPED"}\n`);
  console.log(baris.join("\n"));
  console.log(semua ? `${perjalanan}: every walk reached its last screen` : `${perjalanan}: a walk stopped`);
  return semua ? 0 : 1;
}

/**
 * Sign in by email and password, by keyboard (the sign-in page's default form), and answer «Komputer siapa ini?»
 * when the app asks (an email account's first sign-in on a device: /perangkat). `perangkat` is "pribadi" (default for
 * a staff walk: a walk is longer than the shared computer's 5-minute lock) or "bersama". Returns where it landed and
 * the choice made, for the step's record. A journey that walks «Komputer siapa ini?» itself (J10) passes null.
 */
/** The browser forgets the session but keeps the reader's language choice (the `pintar-lang` cookie, which the
 *  product itself never clears on sign-out: src/app/keluar/route.ts, src/app/masuk/actions.ts): a harness fallback
 *  must not undo a choice the person made. */
export async function lupakanSesi(page) {
  const ctx = page.context();
  const bahasa = (await ctx.cookies()).filter((c) => c.name === "pintar-lang");
  await ctx.clearCookies();
  if (bahasa.length) await ctx.addCookies(bahasa);
}

/** the welcome tour opens over a home page at each sign-in; after the page is captured with it, a person skips it by keyboard so later captures are not covered */
export async function lewatiTur(j) {
  const b = j.page.getByRole("button", { name: /^Lewati tur$|^Skip tour$/ }).first();
  if (!(await b.isVisible().catch(() => false))) return false;
  await j.tekan(b);
  await b.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  return true;
}

/** /masuk with a live session shows «Anda sudah masuk» and «Keluar dari sesi ini»: a person presses it to sign in as someone else */
async function keluarDiMasuk(j) {
  const b = j.page.getByRole("button", { name: /^Keluar dari sesi ini$|^Sign out of this session$/ }).first();
  if (!(await b.isVisible().catch(() => false))) return;
  await j.tekan(b);
  await j.page.locator("#identitas").waitFor({ timeout: 15000 }).catch(() => {});
  if (!(await j.page.locator("#identitas").isVisible().catch(() => false))) { await j.page.goto(`${APP}/masuk`).catch(() => {}); await j.page.waitForLoadState("networkidle").catch(() => {}); }
}

export async function masukEmail(j, orang, perangkat = "pribadi") {
  const { page } = j;
  if (!new URL(page.url()).pathname.startsWith("/masuk")) await page.goto(`${APP}/masuk`).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  await keluarDiMasuk(j);
  if (!(await page.locator("#identitas").isVisible().catch(() => false))) {
    // /masuk sent a signed-in browser on (a redirect from the server can land on «localhost», whose cookies the 127.0.0.1 sign-out left alone)
    await lupakanSesi(page);
    await page.goto(`${APP}/masuk`).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    await keluarDiMasuk(j);
  }
  await j.ketik(page.locator("#identitas"), orang.email);
  await j.ketik(page.locator("#password"), orang.password);
  await page.keyboard.press("Enter");
  await page.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 30000 });
  let dipilih = null;
  if (perangkat && new URL(page.url()).pathname === "/perangkat") {
    const nama = perangkat === "bersama" ? /^Komputer bersama|^A shared computer/i : /^Komputer pribadi saya|^My personal computer/i;
    // a radio group takes ONE Tab stop (the checked radio); the arrows move the choice within it, as a keyboard user does
    const target = page.getByRole("radio", { name: nama }).first();
    await j.tabKe(page.getByRole("radio", { checked: true }).first());
    for (let i = 0; i < 4 && !(await target.isChecked()); i++) await page.keyboard.press("ArrowDown");
    if (!(await target.isChecked())) throw new Error(`«Komputer siapa ini?»: could not choose ${perangkat} by the arrow keys`);
    await j.tekan(page.getByRole("button", { name: /^(Simpan pilihan|Save my choice)/i }).first());
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: 30000 });
    dipilih = perangkat;
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  return { mendarat: new URL(page.url()).pathname, perangkat: dipilih };
}

/**
 * A journey that CHANGES the world (J9's promotion, J7's correction, …) walks each width on a world loaded afresh:
 * audit/dunia/muat.sh (a reset and the whole world, through the loader's local-only guard), then the fixtures named.
 */
export function muatUlang(...fiksasi) {
  const muat = join(AKAR, "audit", "dunia", "muat.sh");
  const jalankan = (args) => {
    try { execFileSync(muat, args, { stdio: "pipe", encoding: "utf8" }); }
    catch (e) { throw new Error(`muat.sh ${args.join(" ")} failed: ${String(e.stderr ?? e.message).split("\n").filter((l) => /ERROR|REFUSED/.test(l)).join(" | ").slice(0, 600)}`); }
  };
  jalankan([]);
  for (const f of fiksasi) jalankan(["--fiksasi", f]);
}

/** Choose an option of a select by keyboard focus (Tab) and its visible label (exact, or the first that includes it). */
export async function pilih(j, loc, label, maks) {
  const t = await j.tabKe(loc, maks);
  const semua = await loc.locator("option").allInnerTexts();
  const tepat = semua.find((x) => x.trim() === label) ?? semua.find((x) => x.includes(label));
  if (!tepat) throw new Error(`no option «${label}» (offered: ${semua.join(" | ")})`);
  await loc.selectOption({ label: tepat });
  return t;
}

/** Sign out by the session strip's «Keluar» (keyboard). */
export async function keluar(j) {
  // a page without the session strip (a 404, a maintenance page) has no «Keluar»: sign out from the home page instead
  if (!(await j.page.locator("button.pin-sesi-keluar").first().isVisible().catch(() => false))) {
    await j.page.goto(`${APP}/`).catch(() => {});
    await j.page.waitForLoadState("networkidle").catch(() => {});
  }
  if (!(await j.page.locator("button.pin-sesi-keluar").first().isVisible().catch(() => false))) {
    await lupakanSesi(j.page);   // no page offers it (e.g. during a maintenance): the browser forgets the session
    await j.page.goto(`${APP}/masuk`).catch(() => {});   // a redirect in flight may abort this navigation
    await j.page.waitForLoadState("networkidle").catch(() => {});
    if (!new URL(j.page.url()).pathname.startsWith("/masuk")) await j.page.goto(`${APP}/masuk`).catch(() => {});
    return;
  }
  await j.tekan(j.page.locator("button.pin-sesi-keluar").first());
  await j.page.waitForURL((u) => !/^\/(konfigurasi|belajar|mengajar|dekan|pimpinan|studio)/.test(u.pathname), { timeout: 30000 });
}

/** A chapter's key: question text → the correct options' text (read from the database; the order is shuffled per sitting). */
export function kunciBab(kursus) {
  return JSON.parse(baca(`select coalesce(json_object_agg(i.stem, (select json_agg(o.body) from public.item_options o where o.item_id = i.id and o.is_correct)), '{}')
    from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = '${kursus}'`));
}

/** Answer every question of the sitting on screen by the key (or `ganti`, stem → the options chosen instead), by keyboard;
 *  then finish it (or stop after `berhenti` questions, unfinished). Returns the counts. */
export async function kerjakan(j, kunci, rec, foto, awalan, selesai, ganti = {}, berhenti = null) {
  const { page } = j;
  const artikel = page.locator("main article").first();
  let n = 0, bantuan = [];
  for (; n < 20; n++) {
    await artikel.getByRole("heading").first().waitFor({ timeout: 30000 });
    const stem = (await artikel.getByRole("heading").first().innerText()).trim();
    const benar = ganti[stem] ?? kunci[stem];
    if (!benar) throw new Error(`no key for the question «${stem.slice(0, 60)}»`);
    if (n === 0) await foto(`${awalan}-soal-1`);
    if (await page.getByRole("button", { name: /Perlu petunjuk|Need a hint/i }).count()) bantuan.push(n + 1);
    for (const body of benar) {
      const opsi = artikel.getByRole("button", { name: new RegExp(`^[A-F]\\s+${body.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).first();
      if ((await opsi.getAttribute("aria-pressed")) === "true") continue;   // already chosen (a resumed sitting): pressing it again would undo it
      rec.tab += await j.tekan(opsi, 60);
      await page.waitForFunction((el) => el.getAttribute("aria-pressed") === "true", await opsi.elementHandle(), { timeout: 15000 });
    }
    // the Uji Penguasaan keeps an answer only by «Simpan jawaban ini» (the Pemetaan Awal saves on choosing)
    const simpan = page.getByRole("button", { name: /^(Simpan jawaban ini|Save this answer)$/i }).first();
    if (await simpan.isVisible().catch(() => false)) { rec.tab += await j.tekan(simpan, 60); await page.waitForLoadState("networkidle").catch(() => {}); }
    await page.waitForTimeout(600);   // the answer's save (the page says when one is not yet saved)
    if (berhenti !== null && n + 1 >= berhenti) return { soal: n + 1, bantuan_ditawarkan_di: bantuan, berhenti: true };
    const lanjut = page.getByRole("button", { name: /^(Berikutnya|Next)$/i }).first();
    if (await lanjut.isEnabled().catch(() => false)) { rec.tab += await j.tekan(lanjut, 60); continue; }
    break;
  }
  await foto(`${awalan}-soal-terakhir`);
  rec.tab += await j.tekan(page.getByRole("button", { name: selesai }).first(), 60);
  await page.waitForTimeout(1500);
  // a confirmation asked inline («Kumpulkan sekarang? …») or in a dialog: its words recorded, then confirmed
  const tanya = page.locator("main div, [role=dialog], [role=alertdialog]").filter({ hasText: /sekarang\?|now\?/i })
    .filter({ has: page.getByRole("button", { name: selesai }) }).last();
  if (await tanya.isVisible().catch(() => false)) {
    await foto(`${awalan}-konfirmasi`);
    rec.data[`${awalan}_confirm_words`] = (await tanya.innerText()).replace(/\s+/g, " ").slice(0, 300);
    rec.tab += await j.tekan(tanya.getByRole("button", { name: selesai }).first(), 60);
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  return { soal: n + 1, bantuan_ditawarkan_di: bantuan };
}
